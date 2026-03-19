import { osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
const LOG = new Logger('DomainCollector');
async function ddgSearch(query, count = 8) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=en-us`;
    const text = await osintFetch(url, { timeout: 12_000 });
    const results = [];
    const linkMatches = text.matchAll(/<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
    for (const m of linkMatches) {
        const href = decodeURIComponent(m[1]);
        const title = m[2].replace(/<[^>]+>/g, '').trim();
        if (href && title && !href.includes('duckduckgo')) {
            results.push({ title, url: href });
            if (results.length >= count)
                break;
        }
    }
    if (results.length === 0) {
        const simpleMatches = text.matchAll(/<a[^>]+href="(https?[^"]+)"[^>]*>([^<]+)<\/a>/gi);
        for (const m of simpleMatches) {
            const href = m[1];
            const title = m[2].replace(/<[^>]+>/g, '').trim();
            if (href.startsWith('http') && title && !href.includes('duckduckgo') && title.length > 3) {
                results.push({ title, url: href });
                if (results.length >= count)
                    break;
            }
        }
    }
    return results;
}
export class DomainCollector {
    async collect(query) {
        const { target } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        // Normalise domain
        const domain = target.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        // ── CRTSH – certificate transparency logs ─────────────────────────────────
        try {
            const crtUrl = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
            const text = await osintFetch(crtUrl, { timeout: 15_000 });
            const entries = tryParseJson(text, []);
            rawData.crtsh = entries;
            if (Array.isArray(entries) && entries.length > 0) {
                const uniqueDomains = new Set();
                const allSANs = [];
                for (const entry of entries) {
                    const nameVal = String(entry.name_value ?? entry.common_name ?? '');
                    nameVal.split('\n').forEach(n => uniqueDomains.add(n));
                    if (entry.name_value) {
                        String(entry.name_value).split('\n').forEach(n => allSANs.push(n));
                    }
                }
                findings.push({
                    source: 'CRTSH',
                    field: 'certificate_count',
                    value: `${entries.length} certificate(s) found`,
                    confidence: 85
                });
                findings.push({
                    source: 'CRTSH',
                    field: 'unique_domains_on_cert',
                    value: `${uniqueDomains.size} unique domain(s)`,
                    confidence: 80
                });
                // Extract subdomains from SANs
                const subdomains = [...uniqueDomains].filter(d => d !== domain && d.endsWith(`.${domain}`));
                if (subdomains.length > 0) {
                    rawData.subdomains = subdomains.slice(0, 50);
                    findings.push({
                        source: 'CRTSH',
                        field: 'subdomains',
                        value: `${subdomains.length} subdomain(s): ${subdomains.slice(0, 5).join(', ')}${subdomains.length > 5 ? '...' : ''}`,
                        confidence: 80
                    });
                }
                // First cert issuer
                const first = entries[0];
                findings.push({
                    source: 'CRTSH',
                    field: 'issuer',
                    value: String(first.issuer_name ?? 'Unknown'),
                    confidence: 80
                });
                if (first.not_before) {
                    findings.push({
                        source: 'CRTSH',
                        field: 'first_cert_issued',
                        value: String(first.not_before),
                        confidence: 70
                    });
                }
                if (first.not_after) {
                    findings.push({
                        source: 'CRTSH',
                        field: 'first_cert_expires',
                        value: String(first.not_after),
                        confidence: 70
                    });
                }
            }
        }
        catch (err) {
            errors.push(`CRTSH lookup failed: ${err}`);
        }
        await osintDelay(500);
        // ── DNS over HTTPS (Cloudflare + Google) ────────────────────────────────────
        const dnsTypes = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
        for (const rtype of dnsTypes) {
            try {
                // Cloudflare DoH
                const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${rtype}`;
                const text = await osintFetch(dohUrl, {
                    timeout: 10_000,
                    headers: { Accept: 'application/dns-json' }
                });
                const dnsJson = tryParseJson(text, {});
                const dnsData = (dnsJson.Answer ?? dnsJson.Answer ?? []);
                if (dnsData.length > 0) {
                    const values = dnsData
                        .map((a) => String(a.data ?? ''))
                        .filter(Boolean);
                    if (values.length > 0) {
                        rawData[`dns_${rtype}`] = values;
                        findings.push({
                            source: 'CloudflareDoH',
                            field: `dns_${rtype}`,
                            value: values.join(', '),
                            confidence: 90
                        });
                        // Flag Cloudflare usage
                        if (rtype === 'A' && values.some(v => v.startsWith('104.') || v.startsWith('172.') || v.startsWith('192.'))) {
                            // Cloudflare Proxy IPs often start with 104.x
                            findings.push({
                                source: 'CloudflareDoH',
                                field: 'cloudflare_proxy',
                                value: 'Likely behind Cloudflare proxy (IPs in Cloudflare range)',
                                confidence: 70
                            });
                        }
                    }
                }
            }
            catch {
                // individual DNS type failure non-fatal
            }
            await osintDelay(300);
        }
        // ── ip-api.com geolocation (using resolved A record IPs) ──────────────────
        const aRecords = rawData.dns_A ?? [];
        if (aRecords.length > 0) {
            try {
                const ip = aRecords[0];
                const geoUrl = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city,isp,org,as,query`;
                const geoText = await osintFetch(geoUrl, { timeout: 10_000 });
                const geo = tryParseJson(geoText, {});
                rawData.geo = geo;
                if (geo.status === 'success') {
                    findings.push({ source: 'IPApi', field: 'country', value: String(geo.country ?? 'Unknown'), confidence: 90 });
                    findings.push({ source: 'IPApi', field: 'city', value: String(geo.city ?? 'Unknown'), confidence: 80 });
                    findings.push({ source: 'IPApi', field: 'isp', value: String(geo.isp ?? 'Unknown'), confidence: 80 });
                    findings.push({ source: 'IPApi', field: 'org', value: String(geo.org ?? 'Unknown'), confidence: 75 });
                }
            }
            catch {
                // non-fatal
            }
        }
        await osintDelay(500);
        // ── WHOIS via whoisxmlapi.com free check ────────────────────────────────────
        // Free WHOIS API (no key for basic)
        try {
            const whoisUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=free&domainName=${encodeURIComponent(domain)}&outputFormat=json`;
            const text = await osintFetch(whoisUrl, { timeout: 12_000 });
            const whois = tryParseJson(text, {});
            if (whois.WhoisRecord) {
                const wr = whois.WhoisRecord;
                rawData.whois = wr;
                findings.push({
                    source: 'WHOIS',
                    field: 'registrar',
                    value: String(wr.registrarName ?? 'Unknown'),
                    confidence: 85
                });
                if (wr.createdDate) {
                    findings.push({
                        source: 'WHOIS',
                        field: 'created_date',
                        value: String(wr.createdDate),
                        confidence: 80
                    });
                }
                if (wr.expiresDate) {
                    findings.push({
                        source: 'WHOIS',
                        field: 'expires_date',
                        value: String(wr.expiresDate),
                        confidence: 80
                    });
                }
                if (wr.nameServers) {
                    const ns = Array.isArray(wr.nameServers) ? wr.nameServers.join(', ') : String(wr.nameServers);
                    findings.push({ source: 'WHOIS', field: 'nameservers', value: ns, confidence: 85 });
                }
            }
        }
        catch (err) {
            errors.push(`WHOIS lookup failed: ${err}`);
        }
        await osintDelay(500);
        // ── Typosquatting check (common TLDs) ───────────────────────────────────────
        const commonTlds = ['com', 'net', 'org', 'io', 'co', 'app', 'dev', 'info'];
        const baseName = domain.split('.')[0];
        for (const tld of commonTlds) {
            const candidate = `${baseName}.${tld}`;
            if (candidate === domain)
                continue;
            try {
                // Just do a quick A record check
                const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(candidate)}&type=A`;
                const text = await osintFetch(dohUrl, { timeout: 8_000, headers: { Accept: 'application/dns-json' } });
                const dns = tryParseJson(text, {});
                const answers = dns.Answer;
                if (answers && answers.length > 0) {
                    findings.push({
                        source: 'TyposquattingCheck',
                        field: `similar_domain:${candidate}`,
                        value: `${candidate} is registered (active)`,
                        confidence: 50
                    });
                }
            }
            catch {
                // NXDOMAIN = not registered; skip
            }
            await osintDelay(200);
        }
        // ── General web search ──────────────────────────────────────────────────────
        try {
            const webResults = await ddgSearch(`site:${domain}`, 5);
            if (webResults.length > 0) {
                rawData.relatedSites = webResults;
                for (const r of webResults) {
                    findings.push({
                        source: 'WebSearch',
                        field: 'related_site',
                        value: r.title,
                        confidence: 50,
                        url: r.url
                    });
                }
            }
        }
        catch {
            // non-fatal
        }
        return {
            collector: 'DomainCollector',
            findings,
            errors,
            rawData
        };
    }
}
