"""
img_generate.py -- Generate AI images via Stability AI (SDXL / Flux).
Uses the Stability AI REST API. No GPU required.

Credentials: credentials/stability-ai.json
API: https://api.stability.ai/v1/generation/{engine}/text-to-image

Usage:
  python img_generate.py --prompt "A minimalist book cover" --output cover.png --aspect 3:2
  python img_generate.py --prompt "Product photo" --output photo.png --width 1024 --height 1024 --style photorealistic
  python img_generate.py --prompt "Dark background" --output bg.png --aspect 16:9 --negative "blurry, low quality"
  python img_generate.py --credits          # check remaining credits

Options:
  --prompt              Text prompt (required unless --credits)
  --output, -o         Output PNG path (required)
  --aspect             Aspect ratio: 1:1 | 16:9 | 9:16 | 4:3 | 3:2 | 2:3 (default: 1:1)
  --width, -W          Width in px (default: auto from aspect)
  --height, -H         Height in px (default: auto from aspect)
  --model              Model: sdxl | flux-schnell | flux-dev | sd3 (default: sdxl)
  --style              Style: photorealistic | anime | cinematic | logo | product | none (default: none)
  --negative, -n       Negative prompt
  --steps              Inference steps 1-50 (default: 30)
  --seed               Random seed (default: random)
  --credits            Check remaining credits only
"""

import argparse
import json
import math
import random
import sys
import urllib.request
import urllib.error
import base64
from pathlib import Path

CREDENTIALS_FILE = Path(__file__).parent.parent / 'credentials' / 'stability-ai.json'

# SDXL (v1.0) only accepts these exact dimensions
SDXL_DIMS = {
    '1:1':   (1024, 1024),
    '16:9':  (1344, 768),
    '9:16':  (768, 1344),
    '4:3':   (1024, 768),
    '3:2':   (1216, 832),
    '2:3':   (832, 1216),
    '21:9':  (1536, 640),
}

# Engine IDs available on Stability AI platform
ENGINE_MAP = {
    'sdxl':        'stable-diffusion-xl-1024-v1-0',
    'flux-schnell': 'flux-schnell',
    'flux-dev':    'flux-dev',
    'sd3':         'stable-diffusion-3',
}


def get_api_key():
    """Load API key from credentials file."""
    if not CREDENTIALS_FILE.exists():
        print(f"ERROR: Missing {CREDENTIALS_FILE}")
        print('Create it with: {"api_key": "sk-...", "provider": "stability-ai"}')
        sys.exit(1)
    with open(CREDENTIALS_FILE) as f:
        creds = json.load(f)
    key = creds.get('api_key') or creds.get('api-key') or creds.get('key')
    if not key:
        print("ERROR: No 'api_key' field in credentials file")
        sys.exit(1)
    return key


# Cloudflare-wrapped hosts need a browser-like User-Agent
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'


def api_request(url, api_key, method='GET', payload=None):
    """Make a Stability AI API request with browser-like headers."""
    headers = {
        'Authorization': f'Bearer {api_key}',
        'User-Agent': UA,
    }
    if payload:
        headers['Content-Type'] = 'application/json'

    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


def check_credits(api_key):
    """Show remaining credits."""
    data, status = api_request(
        'https://api.stability.ai/v1/user/balance',
        api_key
    )
    if status == 200:
        print(f"Credits remaining: {data.get('credits', 'unknown')}")
    else:
        print(f"Error {status}: {data}")


def snap_to_sdxl_dims(width, height):
    """Snap any dimension to the nearest SDXL-allowed size."""
    if (width, height) in SDXL_DIMS.values():
        return width, height
    closest = min(
        SDXL_DIMS.values(),
        key=lambda d: math.hypot(d[0] - width, d[1] - height)
    )
    print(f"  [SDXL] Snapped to allowed size: {closest[0]}x{closest[1]}")
    return closest


def generate(prompt, output_path, api_key,
             width=1024, height=1024, model='sdxl',
             negative=None, steps=30, seed=None):
    """Generate an image via the Stability AI REST API."""

    engine = ENGINE_MAP.get(model, 'stable-diffusion-xl-1024-v1-0')

    # Snap to SDXL dims if using sdxl
    if engine == 'stable-diffusion-xl-1024-v1-0':
        width, height = snap_to_sdxl_dims(width, height)

    if seed is None:
        seed = random.randint(0, 2147483647)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Build text_prompts array
    text_prompts = [{'text': prompt, 'weight': 1.0}]
    if negative:
        text_prompts.append({'text': negative, 'weight': -1.0})

    payload = {
        'text_prompts': text_prompts,
        'seed': seed,
        'width': width,
        'height': height,
        'steps': steps,
        'cfg_scale': 7.0,
    }

    url = f'https://api.stability.ai/v1/generation/{engine}/text-to-image'
    print(f"  Engine : {engine}")
    print(f"  Size   : {width}x{height}")
    print(f"  Steps  : {steps}")
    print(f"  Seed   : {seed}")

    data, status = api_request(url, api_key, method='POST', payload=payload)

    if status != 200:
        print(f"  Error {status}: {data}")
        return None

    artifacts = data.get('artifacts', [])
    if not artifacts:
        print(f"  No artifacts in response: {data}")
        return None

    img_b64 = artifacts[0].get('base64')
    if not img_b64:
        print(f"  No base64 image in artifact")
        return None

    img_bytes = base64.b64decode(img_b64)
    with open(output_path, 'wb') as f:
        f.write(img_bytes)

    size_kb = len(img_bytes) // 1024
    print(f"  Saved : {output_path} ({size_kb} KB)")
    return str(output_path)


def main():
    parser = argparse.ArgumentParser(description='Generate AI images via Stability AI')
    parser.add_argument('--prompt', '-p', help='Image prompt')
    parser.add_argument('--output', '-o', help='Output PNG path')
    parser.add_argument('--aspect', default='1:1',
                        choices=['1:1', '16:9', '9:16', '4:3', '3:2', '2:3', '21:9'],
                        help='Aspect ratio (default: 1:1)')
    parser.add_argument('--width', '-W', type=int,
                        help='Width in px (overrides --aspect)')
    parser.add_argument('--height', '-H', type=int,
                        help='Height in px (overrides --aspect)')
    parser.add_argument('--model', '-m', default='sdxl',
                        choices=['sdxl', 'flux-schnell', 'flux-dev', 'sd3'],
                        help='Generation model (default: sdxl)')
    parser.add_argument('--style', default='none',
                        choices=['photorealistic', 'anime', 'cinematic',
                                'logo', 'product', 'none'],
                        help='Style preset (default: none)')
    parser.add_argument('--negative', '-n', help='Negative prompt')
    parser.add_argument('--steps', type=int, default=30,
                        help='Inference steps 1-50 (default: 30)')
    parser.add_argument('--seed', type=int, help='Random seed')
    parser.add_argument('--credits', action='store_true',
                        help='Check remaining credits only')
    args = parser.parse_args()

    api_key = get_api_key()

    if args.credits:
        check_credits(api_key)
        return

    if not args.prompt:
        parser.print_help()
        print("\nERROR: --prompt is required")
        sys.exit(1)
    if not args.output:
        parser.print_help()
        print("\nERROR: --output is required")
        sys.exit(1)

    # Resolve dimensions
    w, h = SDXL_DIMS.get(args.aspect, (1024, 1024))
    if args.width:
        w = args.width
    if args.height:
        h = args.height

    print(f"Prompt : {args.prompt}")
    print(f"Output : {args.output}")
    print(f"Model  : {args.model}")

    result = generate(
        prompt=args.prompt,
        output_path=args.output,
        api_key=api_key,
        width=w, height=h,
        model=args.model,
        negative=args.negative,
        steps=args.steps,
        seed=args.seed,
    )

    if result:
        print(f"\nOK: {result}")
    else:
        print("\nFailed.")
        sys.exit(1)


if __name__ == '__main__':
    main()
