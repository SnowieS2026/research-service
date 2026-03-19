import { osintFetch, osintDelay, tryParseJson } from '../http.js';
import { Logger } from '../../Logger.js';
import { loadConfig } from '../../config.js';
const LOG = new Logger('IpCollector');
// Common ports for banner grabbing
const SCAN_PORTS = [21, 22, 80, 443, 3306, 5432, 27017, 6379, 8080, 8443];
export class IpCollector {
    async collect(query) {
        const { target, flags } = query;
        const findings = [];
        const errors = [];
        const rawData = {};
        const cfg = loadConfig();
        const isDeep = flags.includes('--deep') || cfg.OSINT_DEEP_SEARCH;
        // Validate IP format
        const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipv4Re.test(target)) {
            findings.push({
                source: 'IpCollector',
                field: 'error',
                value: `"${target}" does not appear to be a valid IPv4 address`,
                confidence: 0
            });
            return { collector: 'IpCollector', findings, errors, rawData };
        }
        // ── ip-api.com geolocation (free, no key) ─────────────────────────────────
        try {
            const geoUrl = `http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,country,countryCode,city,region,regionName,isp,org,as,query,hosting`;
            const geoText = await osintFetch(geoUrl, { timeout: 12_000 });
            const geo = tryParseJson(geoText, {});
            rawData['geo'] = geo;
            if (geo.status === 'success') {
                findings.push({ source: 'IPApi', field: 'country', value: String(geo.country ?? 'Unknown'), confidence: 95 });
                findings.push({ source: 'IPApi', field: 'region', value: String(geo.regionName ?? 'Unknown'), confidence: 90 });
                findings.push({ source: 'IPApi', field: 'city', value: String(geo.city ?? 'Unknown'), confidence: 85 });
                findings.push({ source: 'IPApi', field: 'isp', value: String(geo.isp ?? 'Unknown'), confidence: 85 });
                findings.push({ source: 'IPApi', field: 'org', value: String(geo.org ?? 'Unknown'), confidence: 80 });
                findings.push({ source: 'IPApi', field: 'asn', value: String(geo.as ?? 'Unknown'), confidence: 85 });
                if (geo.hosting === true || geo.hosting === 'true') {
                    findings.push({
                        source: 'IPApi',
                        field: 'hosting',
                        value: 'Yes – appears to be a hosting/VPN/数据中心 IP',
                        confidence: 80
                    });
                }
            }
            else {
                errors.push(`ip-api returned failure for ${target}`);
            }
        }
        catch (err) {
            errors.push(`Geolocation lookup failed: ${err}`);
        }
        await osintDelay(400);
        // ── BGPView API (free, no key) ────────────────────────────────────────────
        try {
            const bgpUrl = `https://api.bgpview.io/ip/${encodeURIComponent(target)}`;
            const bgpText = await osintFetch(bgpUrl, { timeout: 12_000 });
            const bgp = tryParseJson(bgpText, {});
            rawData['bgp'] = bgp;
            if (bgp.status === 'ok') {
                const data = bgp.data;
                if (data) {
                    const prefixes = data.prefixes;
                    if (prefixes && prefixes.length > 0) {
                        findings.push({
                            source: 'BGPView',
                            field: 'bgp_prefix',
                            value: prefixes.map((p) => String(p.prefix ?? '')).join(', '),
                            confidence: 90
                        });
                        const routeObj = prefixes[0];
                        const asnData = routeObj.related_asn_infos;
                        if (asnData && asnData.length > 0) {
                            const asns = asnData.map(a => `${a.asn} (${a.name})`).join(', ');
                            findings.push({
                                source: 'BGPView',
                                field: 'asn_info',
                                value: asns,
                                confidence: 90
                            });
                        }
                    }
                }
            }
        }
        catch (err) {
            errors.push(`BGPView lookup failed: ${err}`);
        }
        await osintDelay(400);
        // ── RDAP WHOIS (IANA-managed, free) ─────────────────────────────────────────
        try {
            const rdapUrl = `https://rdap.arin.net/registry/ip/${encodeURIComponent(target)}`;
            const rdapText = await osintFetch(rdapUrl, { timeout: 12_000 });
            const rdap = tryParseJson(rdapText, {});
            rawData['rdap'] = rdap;
            if (rdap.name) {
                findings.push({ source: 'RDAP', field: 'netname', value: String(rdap.name), confidence: 85 });
            }
            if (rdap.startAddress && rdap.endAddress) {
                findings.push({
                    source: 'RDAP',
                    field: 'range',
                    value: `${rdap.startAddress} – ${rdap.endAddress}`,
                    confidence: 80
                });
            }
            if (rdap.country) {
                findings.push({ source: 'RDAP', field: 'country', value: String(rdap.country), confidence: 80 });
            }
        }
        catch (err) {
            errors.push(`RDAP WHOIS failed: ${err}`);
        }
        await osintDelay(400);
        // ── Reverse DNS (PTR via ARPA) ──────────────────────────────────────────────
        try {
            // Dig reverse using Cloudflare DoH
            const ptrDomain = target.split('.').reverse().join('.') + '.in-addr.arpa';
            const ptrUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(ptrDomain)}&type=PTR`;
            const ptrText = await osintFetch(ptrUrl, { timeout: 10_000, headers: { Accept: 'application/dns-json' } });
            const ptrJson = tryParseJson(ptrText, {});
            const answers = ptrJson.Answer;
            if (answers && answers.length > 0) {
                const ptrValue = String(answers[0].data ?? '').replace(/.$/, ''); // trim trailing dot
                findings.push({ source: 'ReverseDNS', field: 'ptr', value: ptrValue, confidence: 85 });
            }
        }
        catch {
            // non-fatal – many IPs don't have PTR
        }
        await osintDelay(500);
        // ── Shodan-style banner grabbing on common ports (if deep mode) ─────────────
        if (isDeep) {
            const banners = await this.grabBanners(target, SCAN_PORTS);
            rawData['banners'] = banners;
            for (const [port, banner] of Object.entries(banners)) {
                if (banner) {
                    findings.push({
                        source: 'BannerGrab',
                        field: `port_${port}`,
                        value: String(banner).substring(0, 200),
                        confidence: 60
                    });
                }
            }
        }
        else {
            findings.push({
                source: 'IpCollector',
                field: 'note',
                value: 'Use --deep flag to enable port scanning / banner grabbing',
                confidence: 0
            });
        }
        return {
            collector: 'IpCollector',
            findings,
            errors,
            rawData
        };
    }
    /**
     * Attempt TCP banner grabbing on a list of ports.
     * Uses Node.js native TCP socket via net module.
     */
    async grabBanners(ip, ports) {
        const results = {};
        // Dynamic import of net to avoid top-level import issues
        const { createConnection } = await import('net');
        const grab = (port) => new Promise((resolve) => {
            const sock = createConnection({ host: ip, port, timeout: 3000, writable: false });
            let data = '';
            const timer = setTimeout(() => {
                sock.destroy();
                resolve(null);
            }, 4000);
            sock.on('connect', () => {
                // Send HTTP request for web ports
                if (port === 80 || port === 8080) {
                    sock.write(`GET / HTTP/1.0\r\nHost: ${ip}\r\n\r\n`);
                }
                else if (port === 443 || port === 8443) {
                    sock.end();
                    clearTimeout(timer);
                    resolve('[SSL/TLS – cannot grab banner without TLS handshake]');
                }
                else {
                    // For other ports just wait for banner
                }
            });
            sock.on('data', (chunk) => {
                data += chunk.toString();
                if (data.length > 500 || sock.destroyed) {
                    sock.destroy();
                }
            });
            sock.on('error', () => {
                clearTimeout(timer);
                resolve(null);
            });
            sock.on('close', () => {
                clearTimeout(timer);
                resolve(data.trim() || null);
            });
        });
        // Run ports in batches of 5 to avoid overwhelming
        const banners = {};
        for (let i = 0; i < ports.length; i += 5) {
            const batch = ports.slice(i, i + 5);
            const settled = await Promise.all(batch.map(p => grab(p)));
            for (let j = 0; j < batch.length; j++) {
                banners[batch[j]] = settled[j];
            }
            await osintDelay(300);
        }
        return banners;
    }
}
