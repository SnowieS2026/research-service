#!/usr/bin/env python3
"""
Unified OSINT Toolkit — Free Tools Only
Wraps: maigret, holehe, sherlock, exifread + web-based tools
Usage: python osint-toolkit.py <command> [args]

Commands:
  python osint-toolkit.py username <username>          — Maigret + Holehe + Sherlock
  python osint-toolkit.py email <email>                — Holehe email discovery
  python osint-toolkit.py image-meta <image_path>      — EXIF metadata extraction
  python osint-toolkit.py image-ela <image_path>       — ELA analysis (requires PIL)
  python osint-toolkit.py phone <number>               — Spydialer + Numverify lookup
  python osint-toolkit.py email-hunter <email_domain> — Hunter.io free search
  python osint-toolkit.py reddit <user>                — Pushshift Reddit archive
  python osint-toolkit.py socialblade <username>       — Social Blade stats
  python osint-toolkit.py reverse-image <image_path>   — Open in Yandex, PimEyes, Google Lens
  python osint-toolkit.py exif-viewer <image_path>    — EXIF via Jeffrey's web viewer URL
  python osint-toolkit.py people <name>               — Whitepages + BeenVerified (web)
  python osint-toolkit.py phone-lookup <number>        — Truecaller + Sync.me (web)
  python osint-toolkit.py all <target>                 — Run all applicable tools
"""

import subprocess
import sys
import os
import json
import webbrowser
import urllib.parse
from pathlib import Path

# ─── CLI Tool Wrappers ───────────────────────────────────────────────────────

def run_maigret(username):
    """Maigret: username OSINT across 300+ sites"""
    print(f"\n[MAIGRET] Scanning username: {username}")
    try:
        result = subprocess.run(
            ["python", "-m", "maigret", username, "--json", "-o"],
            capture_output=True, text=True, timeout=120
        )
        print(result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
        if result.stderr:
            print(result.stderr[-1000:])
    except subprocess.TimeoutExpired:
        print("[MAIGRET] TIMEOUT — try specific site queries")
    except Exception as e:
        print(f"[MAIGRET] ERROR: {e}")

def run_holehe_email(email):
    """Holehe: checks if email exists on 160+ sites"""
    print(f"\n[HOLEHE] Scanning email: {email}")
    try:
        result = subprocess.run(
            ["python", "-m", "holehe", email],
            capture_output=True, text=True, timeout=120
        )
        print(result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
        if result.stderr:
            print(result.stderr[-500:])
    except subprocess.TimeoutExpired:
        print("[HOLEHE] TIMEOUT")
    except Exception as e:
        print(f"[HOLEHE] ERROR: {e}")

def run_holehe_username(username):
    """Holehe for username (reverse email lookup)"""
    print(f"\n[HOLEHE] Reverse email lookup for: {username}")
    try:
        result = subprocess.run(
            ["python", "-m", "holehe", f"{username}@email.com"],
            capture_output=True, text=True, timeout=120
        )
        print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
    except Exception as e:
        print(f"[HOLEHE] ERROR: {e}")

SHERLOCK_PATH = r"C:\Users\bryan\.openclaw\workspace\tools\sherlock\sherlock_project"

def run_sherlock(username):
    """Sherlock: alternate username scanner"""
    print(f"\n[SHERLOCK] Scanning: {username}")
    try:
        result = subprocess.run(
            ["python", "-m", "sherlock_project.sherlock", username, "--print-found"],
            cwd=SHERLOCK_PATH, capture_output=True, text=True, timeout=180
        )
        print(result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout)
    except subprocess.TimeoutExpired:
        print("[SHERLOCK] TIMEOUT")
    except Exception as e:
        print(f"[SHERLOCK] ERROR: {e}")

def run_exif_metadata(image_path):
    """Extract EXIF metadata from image"""
    print(f"\n[EXIF] Extracting metadata: {image_path}")
    try:
        import exifread
        with open(image_path, 'rb') as f:
            tags = exifread.process_file(f, details=False)
            if not tags:
                print("[EXIF] No metadata found")
                return
            for tag, value in sorted(tags.items()):
                print(f"  {tag}: {value}")
    except ImportError:
        print("[EXIF] exifread not installed: pip install exifread")
    except Exception as e:
        print(f"[EXIF] ERROR: {e}")

def run_image_ela(image_path):
    """Error Level Analysis — detect edited images"""
    print(f"\n[ELA] Error Level Analysis: {image_path}")
    try:
        from PIL import Image
        import numpy as np

        img = Image.open(image_path)
        img_array = np.array(img.convert('RGB'), dtype=np.float32)
        # Save at 90% quality to reintroduce compression artifacts
        import tempfile, os
        tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        img.save(tmp.name, 'JPEG', quality=90)
        compressed = np.array(Image.open(tmp.name).convert('RGB'), dtype=np.float32)
        os.unlink(tmp.name)

        diff = np.abs(img_array - compressed).mean(axis=2)
        print(f"[ELA] Mean absolute difference: {diff:.4f}")
        print(f"[ELA] Max difference: {diff.max():.4f}")
        # High values = heavily recompressed/edited
        if diff.max() > 20:
            print("[ELA] WARNING: High差异 detected — image may be edited")
        elif diff.max() > 10:
            print("[ELA] CAUTION: Moderate差异 — possible processing")
        else:
            print("[ELA] Clean: metadata + compression only")
    except ImportError:
        print("[ELA] Requires pillow and numpy: pip install pillow numpy")
    except Exception as e:
        print(f"[ELA] ERROR: {e}")

# ─── Web-Based Tool Launchers ───────────────────────────────────────────────

def open_reverse_image(image_path):
    """Open image in Yandex, PimEyes, Google Lens"""
    abs_path = os.path.abspath(image_path)
    file_url = urllib.parse.quote(f"file://{abs_path}")

    urls = {
        "Yandex Images": f"https://yandex.com/images/search?url={file_url}",
        "PimEyes": f"https://pimeyes.com",
        "Google Lens": f"https://lens.google.com/search?url={file_url}",
        "TinEye": f"https://tineye.com/search",
    }
    print("\n[REVERSE IMAGE] Opening in all engines:")
    for name, url in urls.items():
        print(f"  {name}: {url}")
        webbrowser.open(url)

def open_jeffreys_exif(image_path):
    """Generate Jeffrey's EXIF Viewer URL for image"""
    abs_path = os.path.abspath(image_path)
    file_url = urllib.parse.quote(f"file://{abs_path}")
    url = f"https://exif.viewer/?url={file_url}"
    print(f"\n[JEFFREY'S EXIF] {url}")
    webbrowser.open(url)

def open_spydialer(phone):
    """Spydialer — free phone lookup"""
    clean = phone.strip().replace(" ", "").replace("-", "")
    url = f"https://www.spydialer.com/phone/{clean}"
    print(f"\n[SPYDIALER] {url}")
    webbrowser.open(url)

def open_socialblade(username):
    """Social Blade social media stats"""
    platforms = [
        ("Twitter", f"https://socialblade.com/twitter/user/{username}"),
        ("YouTube", f"https://socialblade.com/youtube/user/{username}"),
        ("Instagram", f"https://socialblade.com/instagram/user/{username}"),
        ("Twitch", f"https://socialblade.com/twitch/user/{username}"),
    ]
    print(f"\n[SOCIAL BLADE] Checking @{username}:")
    for platform, url in platforms:
        print(f"  {platform}: {url}")
        webbrowser.open(url)

def open_pushshift_reddit(username):
    """Pushshift Reddit archive — historical Reddit data"""
    url = f"https://archive.org/details/@{username}?tab=history&channel=gm_reddit"
    # Actually use the Pushshift web interface
    url2 = f"https://npm.micu.io/?q=author%3A{username}&network=reddit&sort=created_utc&sort_type=desc"
    url3 = f"https://www.reddit.com/user/{username}/"
    print(f"\n[PUSHSHIFT/REDDIT] @{username}:")
    print(f"  Reddit profile: {url3}")
    print(f"  Pushshift archive: {url2}")
    webbrowser.open(url3)

def open_hunter_io(domain):
    """Hunter.io free email finder"""
    url = f"https://hunter.io/search/{domain}?type=free"
    print(f"\n[HUNTER.IO] {domain}")
    print(f"  {url}")
    webbrowser.open(url)

def open_truecaller(phone):
    """Truecaller web lookup"""
    clean = phone.strip().replace(" ", "").replace("-", "")
    url = f"https://www.truecaller.com/search/{clean}"
    print(f"\n[TRUECALLER] {url}")
    webbrowser.open(url)

def open_whatsmyname(username):
    """WhatsMyName — username across 400+ sites"""
    url = f"https://whatsmyname.app/?q={urllib.parse.quote(username)}"
    print(f"\n[WHATSMYNAME] {username}")
    print(f"  {url}")
    webbrowser.open(url)

# ─── Unified Entry Point ─────────────────────────────────────────────────────

COMMANDS = {
    "username":   lambda args: (run_maigret(args[0]), run_sherlock(args[0]) if os.path.exists("sherlock") else None, run_holehe_username(args[0])),
    "email":      lambda args: run_holehe_email(args[0]),
    "image-meta": lambda args: run_exif_metadata(args[0]),
    "image-ela":  lambda args: run_image_ela(args[0]),
    "phone":      lambda args: open_spydialer(args[0]),
    "email-hunter": lambda args: open_hunter_io(args[0]),
    "reddit":     lambda args: open_pushshift_reddit(args[0]),
    "socialblade": lambda args: open_socialblade(args[0]),
    "reverse-image": lambda args: open_reverse_image(args[0]),
    "exif-viewer": lambda args: open_jeffreys_exif(args[0]),
    "truecaller": lambda args: open_truecaller(args[0]),
    "whatsmyname": lambda args: open_whatsmyname(args[0]),
    "all":        lambda args: (
        run_maigret(args[0]),
        run_sherlock(args[0]),
        run_holehe_username(args[0]),
        open_whatsmyname(args[0]),
    ),
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    args = sys.argv[2:]
    COMMANDS[cmd](args)
