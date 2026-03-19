# Bug Bounty Toolkit

A comprehensive, organized security testing stack. Always operate within scope and per program rules.

## 🗂️ Structure

```
bounty-toolkit/
├── README.md
├── recon/          # Reconnaissance & enumeration
├── scanning/       # Vulnerability scanning
├── web/            # Web application testing
├── api/            # API security testing
├── network/        # Network analysis & MITM
├── exploits/       # Exploitation frameworks
├── wordlists/      # Wordlists & payloads
└── scripts/        # Custom automation scripts
```

## ⚙️ Setup

Run the setup script to install dependencies:
```bash
./setup.sh
```

Tools marked with `*` require manual installation (see individual tool sections).

---

## 🔍 RECON

### Subdomain Enumeration

| Tool | Install | Usage |
|------|---------|-------|
| **amass** | `go install -v github.com/owasp-amass/amass/v3/...@latest` | Deep subdomain enumeration |
| **sublist3r** | `pip install sublist3r` | Fast subdomain brute-forcing |
| **findomain** | `cargo install findomain` | DNS enumeration, supports VT |
| **assetfinder** | `go install github.com/tomnomnom/assetfinder@latest` | Quick subdomain recon |
| **shuffledns** | `go install -v github.com/projectdiscovery/shuffledns/...@latest` | DNS bruteforce wrapper |
| **puredns** | `go install github.com/d3mondev/puredns/v2@latest` | Fast DNS bruteforce |
| **alterx** | `go install github.com/projectdiscovery/alterx@latest` | Fast DNS mutation |

### Port Scanning

| Tool | Install | Usage |
|------|---------|-------|
| **nmap*** | Package manager | Full port + service scan |
| **masscan*** | Package manager | Fast mass IP scanning |
| **naabu** | `go install github.com/projectdiscovery/naabu/v2/...@latest` | Fast port scanner |
| **RustScan*** | `cargo install rustscan` | Modern Nmap replacement |

### Web Discovery

| Tool | Install | Usage |
|------|---------|-------|
| **httprobe** | `go install github.com/tomnomnom/httprobe@latest` | Probe live web servers |
| **hakrawler** | `go install github.com/hakluke/hakrawler@latest` | Web crawler + extractor |
| **gospider** | `go install github.com/jaeles-project/gospider@latest` | Fast web spider |
| **katana** | `go install github.com/projectdiscovery/katana@latest` | Next-gen web crawler |
| **waybackurls** | `go install github.com/tomnomnom/waybackurls@latest` | Wayback Machine URLs |
| **gau** | `go install github.com/lc/gau@latest` | All URLs (gau, wayback, otx) |
| **dirsearch** | `pip install dirsearch` | Directory/File discovery |
| **feroxbuster** | `cargo install feroxbuster` | Fast directory enumeration |
| **gobuster** | `go install github.com/OJ/gobuster/v3@latest` | DNS/Gobuster/Dir modes |

### Technology Fingerprinting

| Tool | Install | Usage |
|------|---------|-------|
| **whatweb** | `gem install whatweb` | Web technology detection |
| **wappalyzer*** | CLI or browser ext | Tech stack fingerprinting |
| **httpx** | `go install github.com/projectdiscovery/httpx@latest` | Multi-purpose HTTP toolkit |
| **td** | `go install github.com/tomnomnom/td@latest` | Technology detector |

---

## 🕵️ SCANNING

### Vulnerability Scanning

| Tool | Install | Usage |
|------|---------|-------|
| **nuclei** | `go install -v github.com/projectdiscovery/nuclei/v3/...@latest` | Template-based vulnerability scanner |
| **nuclei-tags** | `nuclei -update-templates` | Update nuclei templates |
| **openvas*** | Docker/VM | Full vulnerability scanner (GUI) |
| **nikto** | `cpan App::Nikto` or docker | Web server scanner |
| **semgrep** | `pip install semgrep` | Static analysis / SAST |
| **snyk** | `npm install -g snyk` | Dependency vulnerability scanning |
| **trufflehog** | `go install github.com/trufflesecurity/trufflehog/v3@latest` | Secrets in code/gits |

### CMS & Platform Scanners

| Tool | Install | Usage |
|------|---------|-------|
| **wpscan** | `gem install wpscan` | WordPress vulnerability scanner |
| **droopescan** | `pip install droopescan` | Drupal/SilverStripe/Laravel |
| **joomscan** | `perl install joomscan` | Joomla scanner |
| **cmsmap** | `pip install cmsmap` | WordPress, Drupal, Joomla |

---

## 🌐 WEB APPLICATION TESTING

### SQL Injection

| Tool | Install | Usage |
|------|---------|-------|
| **sqlmap** | `pip install sqlmap` | SQL injection exploitation |
| **nosqli** | `go install github.com/Charlie-belmer/nosqli@latest` | NoSQL injection |
| **sqli-scanner** | `go install github.com/assetnote/sqli-scanner@latest` | Fast SQLi detection |

### XSS (Cross-Site Scripting)

| Tool | Install | Usage |
|------|---------|-------|
| **dalfox** | `go install github.com/hahwul/dalfox/v2@latest` | XSS scanner & parameter analysis |
| **xsstrike** | `pip install xsstrike` | Advanced XSS detection |
| **xss-scan** | `go install github.com/joohojin/xss-scan@latest` | Fast XSS scanner |
| **gxss** | `go install github.com/KathanP19/Gxss@latest` | Reflected parameter detection |
| **kxss** | `go install github.com/tomnomnom/hacks/kxss@latest` | Find reflected XSS params |

### Command/SSRF/LFI

| Tool | Install | Usage |
|------|---------|-------|
| **commix** | `pip install commix` | Command injection tester |
| **ssrfmap** | `pip install ssrfmap` | SSRF testing |
| **liffy** | `pip install liffy` | LFI/RFI exploitation |
| **dotdotpwn** | `pip install dotdotpwn` | Directory traversal |

### Authentication & Sessions

| Tool | Install | Usage |
|------|---------|-------|
| **hydra** | `apt install hydra` | Brute force authentication |
| **patator** | `git clone https://github.com/lanjelot/patator` | Multi-protocol brute force |
| **bpfo** | `go install github.com/tomnomnom/hacks/bpfa@latest` | Bruteforce form auth |

---

## 📡 API TESTING

| Tool | Install | Usage |
|------|---------|-------|
| **ffuf** | `go install github.com/ffuf/ffuf@latest` | HTTP fuzzer (API endpoints) |
| **wfuzz** | `pip install wfuzz` | Web fuzzer |
| **kiterunner** | `go install github.com/assetnote/kiterunner@latest` | API wordlist fuzzer |
| **(restler)** | Docker | API fuzzing (authenticated) |
| **soapui*** | Download | SOAP/REST API testing |

---

## 📡 NETWORK

### Traffic Analysis

| Tool | Install | Usage |
|------|---------|-------|
| **wireshark*** | Package manager | Packet capture & analysis |
| **tcpdump*** | Package manager | CLI packet capture |
| **mitmproxy** | `pip install mitmproxy` | HTTPS proxy |
| **burp suite*** | Download | Web proxy & testing (PRO) |
| **owasp zap*** | Package manager | Web app proxy/scanner |

---

## 💀 EXPLOITATION

| Tool | Install | Usage |
|------|---------|-------|
| **metasploit*** | `apt install metasploit-framework` | Exploitation framework |
| **searchsploit** | `pip install exploitdb` | Exploit database search |
| **pwntools** | `pip install pwntools` | CTF & exploit dev library |
| **payloadsallthethings** | `git clone https://github.com/swisskyrepo/PayloadsAllTheThings` | Payloads & bypasses cheatsheet |

---

## 📝 WORDLISTS & PAYLOADS

| Resource | Location | Description |
|----------|----------|-------------|
| **SecLists** | `git clone https://github.com/danielmiessler/SecLists` | Big wordlist collection |
| **PayloadsAllTheThings** | `git clone https://github.com/swisskyrepo/PayloadsAllTheThings` | Web attack payloads |
| **Assetnote wordlists** | Download | High-quality API/directory wordlists |
| **fuzz.txt** | `curl -sL https://raw.githubusercontent.com/Bo0oM/fuzz.txt` | Fast fuzzing wordlist |
| **API endpoints wordlist** | Built-in + SecLists | API path enumeration |

---

## 🔧 SCRIPTS

Custom helper scripts live in `scripts/`:

| Script | Purpose |
|--------|---------|
| `recon-all.sh` | Full recon pipeline for a target domain |
| `scan-ports.sh` | Fast port scan + service detection |
| `web-enum.sh` | Crawl + dirbust + screenshot |
| `xss-hunt.sh` | Automated XSS scanning pipeline |

---

## 🚀 QUICK START

### 1. Install core tools

```bash
# Essential Go-based tools
go install github.com/tomnomnom/assetfinder@latest
go install github.com/tomnomnom/waybackurls@latest
go install github.com/projectdiscovery/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/...@latest
go install github.com/projectdiscovery/naabu@latest
go install github.com/owasp-amass/amass/v3/...@latest
go install github.com/ffuf/ffuf@latest

# Python tools
pip install sqlmap dalfox dirsearch

# Clone wordlists
git clone https://github.com/danielmiessler/SecLists
```

### 2. Basic target recon

```bash
# Get subdomains
assetfinder -subs-only target.com | tee subs.txt

# Probe alive hosts
cat subs.txt | httprobe -c 50 | tee alive.txt

# Port scan
naabu -host target.com -top-ports 100 -o ports.txt

# Technology detection
cat alive.txt | httpx -title -tech-detect -o detailed.txt

# Run nuclei scan
nuclei -l alive.txt -t vulnerabilities/ -o results.txt
```

### 3. Web testing workflow

```bash
# Crawl + collect URLs
gospider -s https://target.com -o crawled/

# Find XSS
dalfox file urls.txt --depth 1

# SQL injection check
sqlmap -m urls.txt --batch --level 2

# Fuzz parameters
ffuf -w wordlist.txt -u https://target.com/FUZZ -mc 200
```

---

## 📋 Program Rules

Before testing ANY target:
1. Read the program's scope — only test in-scope targets
2. Note rate limits and allowed testing hours
3. Set polite thread counts (don't burn the target)
4. Always report through official channels
5. Ask before touching authenticated endpoints

---

*Tools marked with `*` are not installable via simple commands — download from the official site or use the provided Docker images where available.*
