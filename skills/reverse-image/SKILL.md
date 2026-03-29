# Reverse Image Search

## Description
Reverse image search finds where an image appears online, whether it's been manipulated, and what the original source is. Critical for verifying authenticity of photos, identifying locations, finding profiles using stolen images, and tracking image reuse.

Three engines are used — each has different strengths:
- **Yandex Images** — best for faces and people
- **Google Lens** — best for products, landmarks, artwork
- **PimEyes** — specialised face recognition

## Entry Points

### All engines simultaneously (osint-toolkit)
```
python tools/osint-toolkit.py reverse-image <path_to_image>
```
Opens all three engines at once with the image.

### Individual engines
**Yandex (best for faces):**
```
https://yandex.com/images/search?url=file://<full_path>
```

**Google Lens:**
```
https://lens.google.com/search?url=file://<full_path>
```

**PimEyes:**
```
https://pimeyes.com
```
(Note: PimEyes requires you to upload manually or create account for API access)

**TinEye (supplementary):**
```
https://tineye.com/search
```
TinEye is the original reverse image search — free tier is 50/month. Use for historical image tracking.

## Integration with osint-toolkit
```
python tools/osint-toolkit.py reverse-image <path>
```
Opens Yandex + PimEyes + Google Lens simultaneously.

## Best Practices
1. **Start with Yandex for people** — it consistently outperforms Google for face matching
2. **Use PimEyes for faces that Yandex misses** — different indexing
3. **Check Google Lens for objects/locations** — superior for product and landmark identification
4. **For investigation use:** paste the same image into all three engines and cross-reference results
5. **TinEye** — use it to track when an image first appeared online (historical reverse search)

## What Each Engine Does Best
| Engine | Best for | Limitation |
|--------|----------|------------|
| Yandex | Faces, people | Can return unrelated similar images |
| Google Lens | Products, landmarks, text | Weaker on faces |
| PimEyes | Face recognition | Free tier limited; upload required |
| TinEye | Historical tracking | 50 free searches/month |

## Workflow for Verifying a Person's Photo
1. Run `osint-toolkit.py reverse-image <image>` (opens all engines)
2. Cross-reference results — note which profiles/accounts appear across multiple engines
3. Run EXIF analysis on same image to check for metadata
4. Run Maigret on any usernames found in reverse image results
5. Check if same image appears on multiple accounts (sign of stock photo or impersonation)

## Tools
- Yandex: yandex.com/images
- Google Lens: lens.google.com
- PimEyes: pimeyes.com
- TinEye: tineye.com (50 free/month)
