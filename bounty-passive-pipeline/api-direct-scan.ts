/**
 * api-direct-scan.ts - Direct API vulnerability scanner, no browser needed.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const REPORTS_DIR = path.join(process.cwd(), 'reports', 'api-direct');

const REST_PATHS = [
  '/api/v1/', '/api/v2/', '/api/v3/', '/api/', '/api/users', '/api/admin',
  '/rest/v1/', '/rest/api/', '/graphql', '/gql', '/api-docs', '/swagger',
  '/swagger.json', '/swagger.yaml', '/openapi.json', '/openapi.yaml',
  '/api/swagger', '/api/documentation', '/api/v1/users', '/v1/api/',
  '/api/health', '/api/status', '/api/info', '/api/keys', '/api/tokens',
  '/api/login', '/api/auth', '/api/profile', '/api/settings', '/api/config',
  '/api/me', '/api/current', '/api/debug', '/admin', '/administrator',
  '/q/health', '/healthz', '/ready', '/live', '/status', '/ping', '/api/ping',
];

const INTROSPECTION_QUERY = '{"query":"{ __schema { queryType { name } mutationType { name } } }"}';

interface Finding {
  id: string; url: string; type: string; severity: string;
  cvss: number; tool: string; description: string; evidence: string;
  createdAt: string; references: string[]; subType?: string;
}

function md5(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function buildId(url: string, key: string, tool: string): string {
  return tool + '-' + md5(url + key);
}

async function httpGet(url: string, extraHeaders: Record<string,string> = {}): Promise<{status: number; body: string; headers: Record<string,string>}> {
  const hdrs = { 'User-Agent': 'Mozilla/5.0 (compatible; bounty-scanner/1.0)', 'Accept': 'application/json, text/html, */*', ...extraHeaders };
  const cmd = 'curl.exe -s -L --max-time 10 --noproxy "*" -w "\\n%{http_code}" -H "Accept: application/json" -o - "' + url + '"';
  try {
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const lines = stdout.trim().split('\n');
    const statusLine = lines[lines.length - 1];
    const body = lines.slice(0, -1).join('\n');
    const status = parseInt(statusLine) || 0;
    return { status, body, headers: {} };
  } catch {
    return { status: 0, body: '', headers: {} };
  }
}

async function httpPost(url: string, body: string): Promise<{status: number; body: string}> {
  const cmd = 'curl.exe -s -L --max-time 10 --noproxy "*" -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d "' + body.replace(/"/g, '\\"') + '" -w "\\n%{http_code}" -o - "' + url + '"';
  try {
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const lines = stdout.trim().split('\n');
    const statusLine = lines[lines.length - 1];
    const responseBody = lines.slice(0, -1).join('\n');
    const status = parseInt(statusLine) || 0;
    return { status, body: responseBody };
  } catch {
    return { status: 0, body: '' };
  }
}

async function httpGetHeaders(url: string): Promise<Record<string,string>> {
  const cmd = 'curl.exe -s -L --max-time 5 --noproxy "*" -I "' + url + '"';
  try {
    const { stdout } = await execAsync(cmd, { timeout: 10000 });
    const headers: Record<string,string> = {};
    for (const line of stdout.split('\n')) {
      const idx = line.indexOf(':');
      if (idx > 0) headers[line.substring(0, idx).trim().toLowerCase()] = line.substring(idx+1).trim();
    }
    return headers;
  } catch {
    return {};
  }
}

async function probeGraphQL(endpoint: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const { status, body } = await httpPost(endpoint, INTROSPECTION_QUERY);
  if (status === 0) return findings;

  try {
    const data = JSON.parse(body);
    if (data?.data?.__schema) {
      findings.push({
        id: buildId(endpoint, 'gql-introspection', 'api-scanner'),
        url: endpoint, type: 'api', severity: 'HIGH', cvss: 8.1, tool: 'api-scanner',
        description: 'GraphQL introspection enabled - full schema can be enumerated',
        evidence: 'Query root: ' + (data.data.__schema.queryType?.name ?? 'unknown'),
        createdAt: new Date().toISOString(),
        references: ['https://graphql.org/learn/introspection/'],
        subType: 'graphql-introspection'
      });
      if (data.data.__schema.mutationType) {
        findings.push({
          id: buildId(endpoint, 'gql-mutations', 'api-scanner'),
          url: endpoint, type: 'api', severity: 'MEDIUM', cvss: 6.5, tool: 'api-scanner',
          description: 'GraphQL mutations available - test for IDOR and auth bypass',
          evidence: 'Mutation root: ' + data.data.__schema.mutationType.name,
          createdAt: new Date().toISOString(),
          references: ['https://portswigger.net/web-security/graphql'],
          subType: 'graphql-mutations'
        });
      }
    } else if (data?.errors) {
      findings.push({
        id: buildId(endpoint, 'gql-reachable', 'api-scanner'),
        url: endpoint, type: 'api', severity: 'INFO', cvss: 0, tool: 'api-scanner',
        description: 'GraphQL endpoint reachable (introspection disabled)',
        evidence: 'Reachable at ' + endpoint,
        createdAt: new Date().toISOString(), references: []
      });
    }
  } catch { /* not JSON */ }
  return findings;
}

async function probeRESTApi(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const base = baseUrl.replace(/\/$/, '');

  for (const apiPath of REST_PATHS) {
    const url = base + apiPath;
    try {
      const { status, body } = await httpGet(url);
      if (status === 0) break;

      if (status === 200 && (url.match(/\.(json|yaml|yml)$/) || body.startsWith('{'))) {
        try {
          const json = JSON.parse(body.startsWith('{') ? body : '{}');
          if (json.openapi || json.swagger) {
            findings.push({
              id: buildId(url, 'openapi', 'api-scanner'),
              url, type: 'api', severity: 'HIGH', cvss: 8.1, tool: 'api-scanner',
              description: 'OpenAPI/Swagger spec exposed - enumerate all endpoints for vulns',
              evidence: 'Spec version: ' + (json.openapi ?? json.swagger),
              createdAt: new Date().toISOString(),
              references: ['https://www.oauth.com/oauth2-server/pdiscover/'],
              subType: 'openapi-exposed'
            });
          }
        } catch { /* not JSON */ }
      }

      if (status === 200 && /\/admin|\/config|\/settings|\/user[^\/]*$|\/me\/?$|api\/user/i.test(url)) {
        findings.push({
          id: buildId(url, 'missing-auth', 'api-scanner'),
          url, type: 'api', severity: 'HIGH', cvss: 8.1, tool: 'api-scanner',
          description: 'Sensitive API endpoint accessible without authentication',
          evidence: 'GET ' + url + ' -> HTTP 200',
          createdAt: new Date().toISOString(),
          references: ['https://owasp.org/www-project-web-security-testing-guide/'],
          subType: 'missing-auth'
        });
      }

      await new Promise(r => setTimeout(r, 300));
    } catch { /* ignore */ }
  }

  return findings;
}

async function runNucleiTech(target: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  try {
    const outFile = path.join(REPORTS_DIR, 'nuclei-' + md5(target) + '.txt');
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const cmd = 'nuclei.exe -u "' + target + '" -t "C:\\Users\\bryan\\nuclei-templates\\http\\technologies" -silent -o "' + outFile + '" 2>nul';
    await execAsync(cmd, { timeout: 120000 });
    if (fs.existsSync(outFile)) {
      const content = fs.readFileSync(outFile, 'utf8');
      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length >= 4) {
          findings.push({
            id: buildId(target, parts[0], 'nuclei'),
            url: target, type: 'tech', severity: 'INFO', cvss: 0, tool: 'nuclei',
            description: 'Tech: ' + parts[0],
            evidence: parts.slice(1).join(' '),
            createdAt: new Date().toISOString(), references: []
          });
        }
      }
    }
  } catch { /* nuclei may have issues */ }
  return findings;
}

async function scanTarget(target: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  console.log('Scanning: ' + target);

  // 1. Nuclei tech
  const techFindings = await runNucleiTech(target);
  findings.push(...techFindings);
  console.log('  tech: ' + techFindings.length + ' findings');

  // 2. GraphQL
  const gqlUrl = target.endsWith('/graphql') ? target : target.replace(/\/$/, '') + '/graphql';
  console.log('  graphql: ' + gqlUrl);
  const gqlFindings = await probeGraphQL(gqlUrl);
  findings.push(...gqlFindings);
  console.log('  graphql: ' + gqlFindings.length + ' findings');

  // 3. REST API paths
  console.log('  rest-api: probing paths...');
  const restFindings = await probeRESTApi(target);
  findings.push(...restFindings);
  console.log('  rest-api: ' + restFindings.length + ' findings');

  return findings;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npx tsx api-direct-scan.ts <target1> [target2] ...');
    process.exit(1);
  }

  const targets = args.map(t => t.replace(/\/$/, ''));
  console.log('=== API Direct Scan: ' + targets.length + ' targets ===\n');

  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const allFindings: Finding[] = [];
  for (const target of targets) {
    try {
      const findings = await scanTarget(target);
      allFindings.push(...findings);
    } catch (e) {
      console.warn('Error scanning ' + target + ': ' + e);
    }
  }

  console.log('\n' + '='.repeat(60));
  const bySev: Record<string,number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of allFindings) {
    const k = (f.severity || 'INFO').toUpperCase();
    if (k in bySev) bySev[k]++; else bySev.INFO++;
  }
  console.log('TOTAL: ' + allFindings.length + ' findings');
  console.log('  CRITICAL: ' + bySev.CRITICAL + '  HIGH: ' + bySev.HIGH + '  MEDIUM: ' + bySev.MEDIUM + '  LOW: ' + bySev.LOW + '  INFO: ' + bySev.INFO);
  console.log('='.repeat(60));

  const notable = allFindings.filter(f => ['CRITICAL','HIGH','MEDIUM'].includes((f.severity||'').toUpperCase()));
  if (notable.length > 0) {
    console.log('\nNOTABLE FINDINGS:');
    for (const f of notable) {
      console.log('  [' + f.severity + '] ' + (f.subType||f.type) + ' @ ' + f.url);
      console.log('    ' + f.description);
      console.log('    -> ' + f.evidence);
      console.log('');
    }
  }

  const reportPath = path.join(REPORTS_DIR, 'findings-' + Date.now() + '.json');
  fs.writeFileSync(reportPath, JSON.stringify({ targets, findings: allFindings }, null, 2));
  console.log('Report: ' + reportPath);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
