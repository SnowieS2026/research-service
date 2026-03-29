# OSINT Toolkit — Unified Wrapper Skill

## Description
Master wrapper that invokes all free OSINT tools via a single entry point. Use this as the primary OSINT skill. For deep-dives on specific techniques, use the individual skills listed below.

## Entry Point
```
python C:\Users\bryan\.openclaw\workspace\tools\osint-toolkit.py <command> [args]
```

## Available Commands

### Username OSINT
```
python osint-toolkit.py username <username>
```
Runs: Maigret + Sherlock + Holehe simultaneously against a username. Most comprehensive single command.

### Email OSINT
```
python osint-toolkit.py email <email_address>
```
Holehe reverse lookup — checks if email exists across 160+ services.

```
python osint-toolkit.py email-hunter <domain>
```
Opens Hunter.io free search for email patterns on a domain.

### Image Analysis
```
python osint-toolkit.py image-meta <path_to_image>
```
Extracts EXIF metadata via exifread. Shows camera model, GPS coordinates, timestamps, software.

```
python osint-toolkit.py image-ela <path_to_image>
```
Error Level Analysis — detects if image has been recompressed or edited. Requires PIL/numpy.

```
python osint-toolkit.py reverse-image <path_to_image>
```
Opens image simultaneously in Yandex Images, PimEyes, and Google Lens. Yandex is best for faces/people.

```
python osint-toolkit.py exif-viewer <path_to_image>
```
Opens Jeffrey's Exif Viewer (web-based EXIF tool) for the image.

### Phone OSINT
```
python osint-toolkit.py phone <number>
```
Opens Spydialer.com — free US/UK phone lookup (voicemail, carrier, associated names).

```
python osint-toolkit.py truecaller <number>
```
Opens Truecaller web search for phone number identity.

### Social Media Analysis
```
python osint-toolkit.py socialblade <username>
```
Opens Social Blade stats for Twitter, YouTube, Instagram, Twitch.

```
python osint-toolkit.py reddit <username>
```
Opens Reddit user profile + Pushshift archive link for historical Reddit data.

```
python osint-toolkit.py whatsmyname <username>
```
Opens WhatsMyName — checks username across 400+ websites.

### Comprehensive Scan
```
python osint-toolkit.py all <target>
```
Runs Maigret + Sherlock + Holehe + WhatsMyName for a username. Most thorough option.

## Tool Locations
- Maigret: `pip install maigret` (CLI: `python -m maigret`)
- Holehe: `pip install holehe` (CLI: `python -m holehe`)
- Sherlock: `C:\Users\bryan\.openclaw\workspace\tools\sherlock\sherlock_project`
- SpiderFoot: `C:\Users\bryan\.openclaw\workspace\tools\spiderfoot`
- exifread: `pip install exifread`

## When to Use This
- Any OSINT enquiry where you need multiple complementary tools
- When you don't know which tool is most appropriate — use `all`
- Fast reconnaissance before deeper investigation

## Individual Tool Skills (use for deep-dives)
| Skill | Use for |
|-------|---------|
| `maigret` | Comprehensive username scan across 300+ sites |
| `holehe` | Email-to-account discovery |
| `sherlock` | Username scan (alternative to Maigret) |
| `spiderfoot` | Full automated OSINT automation |
| `exif-analysis` | Image metadata and edit detection |
| `reverse-image` | Face and image reverse search |
| `phone-osint` | Phone number lookup |
| `social-media-osint` | Social media profile and stats research |
