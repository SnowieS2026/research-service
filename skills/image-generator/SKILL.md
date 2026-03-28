# Image Generator Skill

**Trigger phrases:** "generate an image", "create an image", "make an image", "AI image", "text to image", "image generation", "product cover image", "book cover", "thumbnail", "generate a cover"

---

## Tool

**`tools/img_generate.py`** — Stability AI (SDXL) image generation via REST API.

**No GPU required.** Uses the API key in `credentials/stability-ai.json`.

```
python tools/img_generate.py --prompt "your prompt" --output "path/to/image.png" --aspect 3:2
```

---

## Usage Examples

**Product cover image:**
```
python tools/img_generate.py ^
  --prompt "Professional book cover, dark navy background, mint green geometric accent shapes, bold white title text center" ^
  --output "reports/covers/my-product-cover.png" ^
  --aspect 3:2
```

**Thumbnail (16:9):**
```
python tools/img_generate.py ^
  --prompt "YouTube thumbnail, bold text overlay, vibrant colours, high contrast" ^
  --output "thumb.png" ^
  --aspect 16:9
```

**Square image:**
```
python tools/img_generate.py ^
  --prompt "Minimalist design, mint green accent on dark background" ^
  --output "square.png" ^
  --aspect 1:1
```

**With negative prompt (exclude things):**
```
python img_generate.py --prompt "..." --output out.png --negative "blurry, watermark, text, low quality"
```

**Specific size:**
```
python img_generate.py --prompt "..." --output out.png --width 1344 --height 768
```

**Use a specific seed (reproducible):**
```
python img_generate.py --prompt "..." --output out.png --seed 12345
```

---

## Aspect Ratios

| Ratio | Dimensions | Best for |
|-------|-----------|----------|
| `1:1` | 1024x1024 | Square images, social posts |
| `16:9` | 1344x768 | YouTube thumbnails, banners |
| `9:16` | 768x1344 | Instagram stories, mobile |
| `4:3` | 1024x768 | Presentations, ebooks |
| `3:2` | 1216x832 | Book covers, product images |
| `2:3` | 832x1216 | Portraits, posters |
| `21:9` | 1536x640 | Wide banners |

---

## Available Models

| Model | Speed | Quality | Notes |
|-------|-------|---------|-------|
| `sdxl` | Medium | High | Default. SDXL v1.0. Only available model on free tier. |
| `flux-schnell` | Fast | Good | May require paid tier |
| `flux-dev` | Medium | High | May require paid tier |
| `sd3` | Unknown | High | May require paid tier |

**Default: `--model sdxl`**

---

## Style Presets

`photorealistic` | `anime` | `cinematic` | `logo` | `product` | `none`

---

## Check Credits

```bash
python tools/img_generate.py --credits
```

**25 free credits** on current plan. Check at: https://platform.stability.ai

---

## Credentials

Stored in `credentials/stability-ai.json`:
```json
{
  "api_key": "sk-...",
  "provider": "stability-ai"
}
```

---

## Workflow: Generate a Product Cover

1. **Generate multiple concepts** (vary seeds/prompts):
```
python img_generate.py --prompt "Dark book cover, mint green accent, geometric" --output cover1.png --seed 1 --aspect 3:2
python img_generate.py --prompt "Dark book cover, cyan accent, abstract waves" --output cover2.png --seed 2 --aspect 3:2
python img_generate.py --prompt "Dark book cover, teal accent, minimal typography" --output cover3.png --seed 3 --aspect 3:2
```

2. **Pick the best** → use in PDF Gumroad product

3. **If text looks wrong**: add to PDF overlay instead (pdf_create.py can add text over images)

---

## Combining with Document Tools

After generating a cover image, embed it in a document:

```powershell
# Generate cover
python tools/img_generate.py --prompt "..." --output cover.png --aspect 3:2

# Create PDF with cover
python tools/pdf_create.py --output product.pdf --title "My Product" --cover-image cover.png

# Or embed in Word doc
python tools/docx_create.py --output report.docx --image "cover.png,6,center"
```
