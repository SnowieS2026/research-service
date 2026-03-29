# EXIF Analysis — Image Metadata & Edit Detection

## Description
Extracts and analyses EXIF (Exchangeable Image File Format) metadata from images. EXIF data is embedded in photos by cameras, phones, and editing software, and can reveal: camera model, lens, GPS coordinates, timestamps, editing software, and original creation dates.

Two techniques are used:
1. **EXIF extraction** — read metadata embedded in the image file
2. **ELA (Error Level Analysis)** — detect edited/recompressed images by analysing compression artefacts

## EXIF Extraction

### CLI
```
python -c "import exifread; import sys; tags=exifread.process_file(open('image.jpg','rb'), details=False); [print(f'{k}: {v}') for k,v in sorted(tags.items())]"
```

### Or via osint-toolkit
```
python tools/osint-toolkit.py image-meta <path_to_image>
```

### Via Jeffrey's Exif Viewer (web)
```
python tools/osint-toolkit.py exif-viewer <path_to_image>
```

## Key EXIF Tags to Look For
| Tag | What it reveals |
|-----|----------------|
| `GPS GPSLatitude/GPSLongitude` | Exact location photo was taken |
| `EXIF DateTimeOriginal` | When photo was originally taken |
| `EXIF DateTimeDigitized` | When photo was scanned/digitised |
| `Image Make` | Camera manufacturer |
| `Image Model` | Camera model |
| `Image Software` | Editing software used |
| `Image Artist` | Photographer/owner name |
| `EXIF LensModel` | Lens used |
| `EXIF UserComment` | Embedded user comments |

## ELA (Error Level Analysis)

### CLI
```
python tools/osint-toolkit.py image-ela <path_to_image>
```

### What ELA shows
- Images saved and re-compressed will show artefacts at higher error levels
- Inconsistent error levels across an image suggest different sources/merged layers
- GPS coordinates in EXIF can be spoofed but ELA cannot easily fake consistent error patterns

### Interpreting ELA results
| Max diff | Meaning |
|----------|---------|
| <10 | Clean — metadata only, no significant editing |
| 10-20 | Moderate processing — resized, colour-corrected |
| >20 | Heavily edited or recompressed — investigate further |

## Integration with osint-toolkit
```
python tools/osint-toolkit.py image-meta <path>   # EXIF extraction
python tools/osint-toolkit.py image-ela <path>   # ELA analysis
python tools/osint-toolkit.py exif-viewer <path> # Jeffrey's web viewer
```

## Best Practices
1. Always check GPS coordinates — even a single photo with location data can locate a person's home or workplace
2. Compare `DateTimeOriginal` against claimed timeline — inconsistencies are a red flag
3. Check `Software` tag — an image claimed to be from a "real camera" may have been edited in Photoshop
4. Run ELA on images used in investigations — doctor's photos, location proofs, alibis
5. Combine with reverse image search — same image with different EXIF may indicate theft/impersonation

## Tools
- exifread: `pip install exifread`
- Jeffrey's Exif Viewer: web-based at jeffreyfriedl.com/exif viewer
- FotoForensics: fotoforensics.com (online ELA calculator)
