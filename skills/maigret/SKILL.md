# Maigret — Username OSINT

## Description
Maigret is a powerful username OSINT tool that queries 300+ social networks, forums, and platforms to find accounts associated with a given username. It is the most comprehensive username scanner available for free.

**Strengths:** Largest site coverage (300+), JSON/CSV export, threaded requests, proxy support.
**Weaknesses:** Some sites block it; results vary by username popularity.

## Entry Point
```
python -m maigret <username> [options]
```

## Essential Commands

### Basic scan
```
python -m maigret johndoe
```

### Scan with JSON output
```
python -m maigret johndoe --json -o results.json
```

### Scan with XLSX export
```
python -m maigret johndoe --xlsx -o results.xlsx
```

### Scan specific site only
```
python -m maigret johndoe --site twitter --print-found
```

### Limit to top 50 sites by Alexa rank
```
python -m maigret johndoe --top-sites 50
```

### Use Tor for anonymity
```
python -m maigret johndoe --proxy socks5://127.0.0.1:9050
```

### Browse to found profiles
```
python -m maigret johndoe --browse --print-found
```

## Output
- Console: colour-coded results showing site name, URL, and status
- JSON: full results with response codes and metadata
- XLSX: spreadsheet with sortable results
- CSV: flat-file export

## Integration with osint-toolkit
```
python tools/osint-toolkit.py username <username>
```
Runs Maigret as part of a multi-tool username sweep.

## Best Practices
1. Run with `--print-found` to only see positive matches (less noise)
2. Use `--json` for machine-readable output for pipeline processing
3. Try variant usernames: `johndoe`, `john.doe`, `john_doe`, `johndoe123`
4. For bulk username checks, use `--site` to target specific platforms

## Source
`pip install maigret` | GitHub: github.com/soxoj/maigret
