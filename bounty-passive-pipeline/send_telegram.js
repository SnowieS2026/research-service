// Send summary to parent session via gateway API
const sessionKey = 'agent:main:subagent:ac4af3c1-...';
const message = `OSINT Pipeline — All Collectors Tested

VehicleCollector ✅
- advisory_total_min: £600, advisory_total_max: £2,325
- 8 advisory cost items extracted with severity/urgency
- Fixed by adding missing VehicleValuation import + integration + advisory regex extraction

All 9 collectors smoke tested:
✅ VehicleCollector — 20 findings (advisory costs £600-£2325)
✅ DomainCollector — 5 findings (DNS TXT/NS via Cloudflare DoH)
✅ IpCollector — 11 findings (IP geolocation via IPApi)
✅ PhoneCollector — 1 finding (note about missing NumValidate key)
✅ EmailCollector — 3 findings (format valid + HIBP/Hunter need keys)
⚠️ GeneralCollector — 0 findings (DuckDuckGo HTML globally blocked — needs Brave API key)
⚠️ BusinessCollector — 0 findings (DuckDuckGo blocked + crt.sh returning 503)
⚠️ PersonCollector — 0 findings (DuckDuckGo blocked)
✅ UsernameCollector — 17 findings across 30 platforms

API keys still needed:
• OSINT_BRAVE_SEARCH_KEY — enables General/Business/Person web search
• OSINT_NUMVALIDATE_KEY — phone enrichment
• OSINT_HIBP_API_KEY — email breach check
• OSINT_HUNTER_API_KEY — domain email lookup

Committed: fix: vehicle + osint tool fixes`;

async function send() {
  try {
    const resp = await fetch('http://127.0.0.1:18789/api/sessions/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionKey, message })
    });
    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
send();
