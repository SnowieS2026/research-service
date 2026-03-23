/**
 * XSS scanning using dalfox + manual reflection analysis.
 */
import { type DiscoveredEndpoint } from './DiscoveryScanner.js';
import { type StackInfo } from '../stackdetector/StackDetector.js';
import { type ScannerConfig } from './ScannerOrchestrator.js';
import { type XSSFinding, buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import { spawnTool } from './tool-spawn.js';

const LOG = new Logger('XSSScanner');

// Common XSS payloads
const REFLECTED_XSS_PAYLOADS = [
  "'<script>alert(1)</script>",
  '"><script>alert(1)</script>',
  "javascript:alert(1)",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "'-alert(1)-'",
  "{{constructor.constructor('alert(1)')()}}",
  "<script>alert(String.fromCharCode(88,83,83))</script>"
];

interface DalfoxResult {
  url: string;
  param: string;
  payload: string;
  severity: string;
}

async function runDalfox(endpoint: DiscoveredEndpoint, config: ScannerConfig): Promise<DalfoxResult[]> {
  const results: DalfoxResult[] = [];
  const hasDalfox = await isToolAvailable('dalfox');

  if (!hasDalfox) {
    LOG.warn('dalfox not available – skipping XSS scan');
    return results;
  }

  const timeoutMs = Math.min(config.timeoutPerTarget ?? 30, 30) * 1000;

  if (endpoint.params.length === 0) {
    // Scan the URL directly (no params to target)
    const args = ['url', endpoint.url];
    if (config.callbackUrl) {
      args.push('--blind', config.callbackUrl);
    }
    args.push('--format', 'json');

    try {
      const res = await spawnTool('dalfox', args, { timeoutMs });
      if (res.stdout) {
        results.push(...parseDalfoxOutput(res.stdout));
      }
    } catch (err) {
      LOG.warn(`dalfox error on ${endpoint.url}: ${err}`);
    }
    return results;
  }

  // Target each parameter individually
  for (const param of endpoint.params) {
    if (config.dryRun) {
      LOG.log(`[DRY_RUN] dalfox url ${endpoint.url} --param ${param.name}`);
      continue;
    }

    const args = ['url', endpoint.url, '--param', param.name];
    if (config.callbackUrl) {
      args.push('--blind', config.callbackUrl);
    }
    args.push('--format', 'json');

    try {
      const res = await spawnTool('dalfox', args, { timeoutMs });
      if (res.stdout) {
        results.push(...parseDalfoxOutput(res.stdout));
      }
    } catch (err) {
      LOG.warn(`dalfox error on ${endpoint.url} param=${param.name}: ${err}`);
      break; // stop targeting further params on this endpoint
    }
  }

  return results;
}

function parseDalfoxOutput(stdout: string): DalfoxResult[] {
  const results: DalfoxResult[] = [];
  try {
    const lines = stdout.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'xss' || parsed.category === 'xss') {
          results.push({
            url: parsed.url ?? parsed.target ?? '',
            param: parsed.param ?? parsed.parameter ?? '',
            payload: parsed.payload ?? parsed.evidence ?? '',
            severity: parsed.severity ?? 'HIGH'
          });
        }
      } catch {
        // Try text parsing
        const match = stdout.match(/\[XSS\]\s+(.+?)\s+\[(.+?)\]/);
        if (match) {
          results.push({ url: match[1], param: '', payload: match[2], severity: 'HIGH' });
        }
      }
    }
  } catch { /* ignore */ }
  return results;
}

async function checkReflectedParams(endpoint: DiscoveredEndpoint): Promise<string[]> {
  const reflected: string[] = [];
  try {
    const response = await fetch(endpoint.url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    for (const param of endpoint.params) {
      const val = `${param.name}=test`;
      if (html.includes(val)) reflected.push(param.name);
    }
  } catch { /* ignore */ }
  return reflected;
}

export async function scanForXSS(
  targets: DiscoveredEndpoint[],
  _stack: StackInfo,
  config: ScannerConfig
): Promise<XSSFinding[]> {
  const findings: XSSFinding[] = [];
  const hasDalfox = await isToolAvailable('dalfox');

  if (!hasDalfox && !config.dryRun) {
    LOG.warn('dalfox not available – falling back to manual reflection check');
  }

  for (const endpoint of targets) {
    if (endpoint.params.length === 0) continue;

    const reflected = await checkReflectedParams(endpoint);

    if (hasDalfox) {
      try {
        const dalfoxResults = await runDalfox(endpoint, config);
        for (const r of dalfoxResults) {
          findings.push({
            id: buildFindingId(r.url, r.param, 'xss'),
            url: r.url,
            type: 'xss',
            severity: (r.severity === 'CRITICAL' ? 'CRITICAL' : r.severity === 'HIGH' ? 'HIGH' : 'MEDIUM') as XSSFinding['severity'],
            cvss: r.severity === 'CRITICAL' ? 9.8 : r.severity === 'HIGH' ? 8.1 : 6.1,
            tool: 'dalfox',
            param: r.param,
            payload: r.payload,
            description: `Reflected XSS in parameter '${r.param}'`,
            evidence: `${r.url} | param: ${r.param} | payload: ${r.payload}`,
            createdAt: new Date().toISOString(),
            references: [
              'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/01-Testing_for_XSS_Injection'
            ]
          });
        }
      } catch (err) {
        LOG.warn(`dalfox error on ${endpoint.url}: ${err}`);
      }
    } else {
      for (const paramName of reflected) {
        for (const payload of REFLECTED_XSS_PAYLOADS) {
          const testUrl = injectParam(endpoint.url, paramName, payload);
          try {
            const res = await fetch(testUrl, {
              signal: AbortSignal.timeout(10_000),
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = await res.text();
            if (html.includes(payload)) {
              findings.push({
                id: buildFindingId(endpoint.url, paramName, 'xss'),
                url: endpoint.url,
                type: 'xss',
                severity: 'HIGH',
                cvss: 8.1,
                tool: 'manual',
                param: paramName,
                payload,
                description: `Reflected XSS in parameter '${paramName}'`,
                evidence: `Payload reflected verbatim in response: ${payload}`,
                createdAt: new Date().toISOString(),
                references: [
                  'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/01-Testing_for_XSS_Injection'
                ]
              });
              break;
            }
          } catch { /* ignore */ }
        }
      }
    }

    await new Promise((r) => setTimeout(r, config.rateLimitMs));
  }

  LOG.log(`XSSScanner: ${findings.length} findings`);
  return findings;
}

function injectParam(url: string, paramName: string, value: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set(paramName, value);
    return u.href;
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}${encodeURIComponent(paramName)}=${encodeURIComponent(value)}`;
  }
}
