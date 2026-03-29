# SpiderFoot — Full OSINT Automation Framework

## Description
SpiderFoot is a powerful open-source OSINT automation tool that maps out the connections between internet-facing data. You give it a target (domain, IP, email, username, etc.) and it runs 200+ OSINT modules in sequence to build a comprehensive picture.

**Strengths:** Most comprehensive automated OSINT tool available for free. Modular. Python-based. Great for pivot analysis (e.g., finding all domains hosted on same IP).
**Weaknesses:** Heavy on resources; web UI requires running a server; CLI is powerful but less user-friendly than single-purpose tools.

## Entry Points

### CLI mode
```
python sf.py -t <target> -m <modules> [-s] [-S] [-o <format>] [-o <output_file>]
```

### Web UI mode
```
python sfwebui.py
```
Then open http://127.0.0.1:5001 in browser.

## Essential Commands

### Basic scan (all modules, human-readable output)
```
python sf.py -t example.com -s
```

### Scan with JSON output
```
python sf.py -t example.com -o json -o results.json
```

### Target a specific type
```
python sf.py -t email@domain.com -tType EMAILADDR -s
```

### Target types
```
-tType ADDR (IPv4 address)
-tType BTCADDR (Bitcoin address)
-tType DOMAIN (domain name)
-tType EMAILADDR (email address)
-tType INTERNET NAME (hostname)
-tType NETBLOCK_OWNER (IP range)
-tType PHONE_NUMBER (phone number)
-tType USERNAME (username)
-tType PERSON (person name)
-tType SUBDOMAIN (subdomain)
```

### Use specific modules only
```
python sf.py -t example.com -m sflite_shodan,sflite_hunter_io -s
```

### List all available modules
```
python sf.py -M
```

## Key Modules
| Module | What it does |
|--------|--------------|
| `sflite_shodan` | Shodan port scan data |
| `sflite_hunter_io` | Hunter.io email patterns |
| `sflite_builtwith` | Technology fingerprinting |
| `sflite_spyse` | Certificate transparency |
| `sflite_dnsbrute` | Subdomain enumeration |
| `sflite_social_media` | Social media profiles |
| `sflite_github` | GitHub repositories |
| `sflite_virustotal` | VirusTotal reputation |

## Best Practices
1. Use web UI for exploratory investigation — it visualises relationships
2. Use CLI for scripted/pipeline operations with JSON output
3. Always filter modules with `-m` for targeted scans — running all modules is slow
4. Use `-tType` to specify target type accurately — SpiderFoot will infer if not specified
5. For email targets, combines well with Holehe for cross-validation

## Source
GitHub: github.com/smicallef/spiderfoot
Location: `C:\Users\bryan\.openclaw\workspace\tools\spiderfoot\`
