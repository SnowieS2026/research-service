/**
 * Authentication / Authorization scanning.
 * Tests: JWT algorithm confusion, IDOR on numeric IDs, missing auth on JS-discovered endpoints.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { type DiscoveredEndpoint } from './DiscoveryScanner.js';
import { type StackInfo } from '../stackdetector/StackDetector.js';
import { type ScannerConfig } from './ScannerOrchestrator.js';
import { type AuthFinding, type IDORFinding, type AnyFinding, buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';

const execAsync = promisify(exec);
const LOG = new Logger('AuthScanner');

// JWT test payloads
const JWT_PAYLOADS = [
  { alg: 'none', description: 'JWT with "none" algorithm – unsigned token' },
  { alg: 'HS256', description: 'JWT algorithm confusion – signed with HS256 using server public key' }
];

// Weak secret wordlist (mini)
const WEAK_SECRETS = ['secret', 'key', 'token', 'password', 'jwt', '123456'];

/**
 * Test a JWT token for common vulnerabilities.
 */
async function testJWT(endpoint: DiscoveredEndpoint, tokenValue: string): Promise<AuthFinding[]> {
  const findings: AuthFinding[] = [];

  try {
    // Decode JWT (no verification – we're testing the algorithm)
    const parts = tokenValue.split('.');
    if (parts.length !== 3) return findings;

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const alg = header.alg as string;

    // none algorithm
    if (alg === 'none') {
      findings.push({
        id: buildFindingId(endpoint.url, 'jwt', 'auth'),
        url: endpoint.url,
        type: 'auth',
        severity: 'CRITICAL',
        cvss: 9.4,
        tool: 'auth-scanner',
        description: 'JWT "none" algorithm detected – token is not signed',
        evidence: `JWT header: ${JSON.stringify(header)}`,
        createdAt: new Date().toISOString(),
        references: ['https://portswigger.net/web-security/jwt'],
        subType: 'jwt-none-algorithm'
      });
    }

    // Algorithm confusion (RS256 → HS256)
    if (alg === 'RS256') {
      findings.push({
        id: buildFindingId(endpoint.url, 'jwt', 'auth'),
        url: endpoint.url,
        type: 'auth',
        severity: 'HIGH',
        cvss: 8.1,
        tool: 'auth-scanner',
        description: 'JWT RS256 algorithm – test for algorithm confusion (HS256 swap)',
        evidence: `JWT header: ${JSON.stringify(header)}`,
        createdAt: new Date().toISOString(),
        references: ['https://portswigger.net/web-security/jwt#algorithm-confusion'],
        subType: 'jwt-algorithm-confusion'
      });
    }

    // Check for weak secrets (simulate signing with weak secret)
    for (const secret of WEAK_SECRETS) {
      const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')), "role": "admin" })).toString('base64url');
      const forgedToken = `${parts[0]}.${forgedPayload}.${Buffer.from(secret).toString('base64url')}`;
      findings.push({
        id: buildFindingId(endpoint.url, 'jwt', 'auth'),
        url: endpoint.url,
        type: 'auth',
        severity: 'HIGH',
        cvss: 8.1,
        tool: 'auth-scanner',
        description: `JWT potentially signed with weak secret – check manually with secret: '${secret}'`,
        evidence: `Forged token (role=admin): ${forgedToken.slice(0, 60)}…`,
        createdAt: new Date().toISOString(),
        references: ['https://portswigger.net/web-security/jwt#brute-forcing-secret-keys'],
        subType: 'jwt-weak-secret'
      });
    }
  } catch {
    // ignore decode errors
  }

  return findings;
}

/**
 * Test an endpoint for IDOR on numeric/object IDs.
 */
async function testIDOR(endpoint: DiscoveredEndpoint): Promise<IDORFinding[]> {
  const findings: IDORFinding[] = [];

  // Look for numeric ID patterns in the URL
  const idPattern = /\/([a-z_-]+)\/(\d+)/i;
  const match = endpoint.url.match(idPattern);
  if (!match) return findings;

  const [, resource, id] = match;
  const idNum = parseInt(id, 10);

  // Test with ID - 1 (unauthorized access to previous resource)
  const tamperedUrl = endpoint.url.replace(`/${resource}/${id}`, `/${resource}/${idNum - 1}`);

  try {
    const [originalRes, tamperedRes] = await Promise.all([
      fetch(endpoint.url, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch(tamperedUrl, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
    ]);

    const origStatus = originalRes.status;
    const tammpedStatus = tamperedRes.status;

    // IDOR: both return 200, but different content (or both 403 vs 401 → auth issue)
    if (tammpedStatus === 200 && origStatus === 200) {
      findings.push({
        id: buildFindingId(endpoint.url, resource, 'idor'),
        url: endpoint.url,
        type: 'idor',
        severity: 'HIGH',
        cvss: 8.1,
        tool: 'auth-scanner',
        param: resource,
        description: `Potential IDOR on ${resource} ID – accessing ${idNum - 1} returned 200`,
        evidence: `${endpoint.url} → ${tamperedUrl} returned 200 (original: ${origStatus}, tampered: ${tammpedStatus})`,
        createdAt: new Date().toISOString(),
        references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Indirect_Reference_Vulnerabilities']
      });
    }

    // Missing auth: tampered request succeeds when it shouldn't
    if (tammpedStatus === 200 && origStatus === 401) {
      findings.push({
        id: buildFindingId(endpoint.url, resource, 'idor'),
        url: endpoint.url,
        type: 'idor',
        severity: 'HIGH',
        cvss: 8.1,
        tool: 'auth-scanner',
        param: resource,
        description: `Missing authorization – IDOR on ${resource} ID parameter`,
        evidence: `${tamperedUrl} returned 200 without auth`,
        createdAt: new Date().toISOString(),
        references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Indirect_Reference_Vulnerabilities']
      });
    }
  } catch {
    // ignore
  }

  return findings;
}

/**
 * Check for missing authentication on protected endpoints discovered in JS.
 */
async function testMissingAuth(endpoint: DiscoveredEndpoint): Promise<AuthFinding[]> {
  const findings: AuthFinding[] = [];

  // Try accessing the endpoint without any auth headers/cookies
  try {
    const response = await fetch(endpoint.url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Test-Agent)' }
    });

    const status = response.status;

    // 200 on a sensitive endpoint without auth = missing auth
    const sensitivePatterns = [
      /\/admin/i, /\/dashboard/i, /\/profile/i, /\/settings/i,
      /\/api\/users/i, /\/api\/admin/i, /\/api\/config/i,
      /\/api\/[a-z]+\/[0-9]+/i, /\/me\/?$/i, /\/account/i
    ];

    const isSensitive = sensitivePatterns.some(pat => pat.test(endpoint.url));

    if (status === 200 && isSensitive) {
      findings.push({
        id: buildFindingId(endpoint.url, '', 'auth'),
        url: endpoint.url,
        type: 'auth',
        severity: 'MEDIUM',
        cvss: 6.5,
        tool: 'auth-scanner',
        description: `Endpoint ${endpoint.url} returned 200 without authentication – missing auth check`,
        evidence: `GET ${endpoint.url} → HTTP ${status}`,
        createdAt: new Date().toISOString(),
        references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Indirect_Reference_Vulnerabilities'],
        subType: 'missing-auth'
      });
    }

    // 401/403 on sensitive endpoints – check for auth header presence
    if ((status === 401 || status === 403) && isSensitive) {
      const authHeader = response.headers.get('www-authenticate') ?? '';
      if (!authHeader) {
        findings.push({
          id: buildFindingId(endpoint.url, '', 'auth'),
          url: endpoint.url,
          type: 'auth',
          severity: 'LOW',
          cvss: 3.5,
          tool: 'auth-scanner',
          description: `Sensitive endpoint ${endpoint.url} returned ${status} but lacks WWW-Authenticate header`,
          evidence: `No WWW-Authenticate challenge present`,
          createdAt: new Date().toISOString(),
          references: ['https://tools.ietf.org/html/rfc7235#section-4.1'],
          subType: 'missing-auth-header'
        });
      }
    }
  } catch {
    // ignore
  }

  return findings;
}

/**
 * Scan targets for authentication and authorization vulnerabilities.
 */
export async function scanForAuthIssues(
  targets: DiscoveredEndpoint[],
  stack: StackInfo,
  config: ScannerConfig
): Promise<AnyFinding[]> {
  const findings: AnyFinding[] = [];
  const hasHydra = await checkTool('hydra');
  const hasPatator = await checkTool('patator');

  for (const endpoint of targets) {
    // JWT testing
    const jwtTech = stack.technologies.find(t => t.name === 'JWT');
    if (jwtTech || endpoint.url.includes('token') || endpoint.url.includes('jwt')) {
      // Look for JWT in URL params
      for (const param of endpoint.params) {
        if (param.name.toLowerCase().includes('token') || param.name.toLowerCase().includes('jwt')) {
          try {
            const u = new URL(endpoint.url);
            const tokenValue = u.searchParams.get(param.name) ?? '';
            const jwtFindings = await testJWT(endpoint, tokenValue);
            findings.push(...jwtFindings);
          } catch {
            // ignore
          }
        }
      }
    }

    // OAuth testing
    if (stack.technologies.some(t => t.name === 'OAuth')) {
      // Test for redirect_uri in authorization flow
      if (endpoint.url.includes('authorize') || endpoint.url.includes('oauth')) {
        findings.push({
          id: buildFindingId(endpoint.url, 'redirect_uri', 'auth'),
          url: endpoint.url,
          type: 'auth',
          severity: 'HIGH',
          cvss: 8.1,
          tool: 'auth-scanner',
          description: 'OAuth endpoint detected – test redirect_uri for open redirect',
          evidence: `OAuth/authorize endpoint: ${endpoint.url}`,
          createdAt: new Date().toISOString(),
          references: ['https://oauth.net/2/redirect-uris/'],
          subType: 'oauth-redirect-uri'
        });
      }
    }

    // IDOR testing on endpoints with numeric IDs
    if (endpoint.params.some(p => p.type === 'number' || /\d+/.test(p.name))) {
      const idorFindings = await testIDOR(endpoint);
      findings.push(...idorFindings);
    }

    // Missing auth on JS-discovered endpoints
    if (endpoint.inJS || endpoint.source === 'js') {
      const authFindings = await testMissingAuth(endpoint);
      findings.push(...authFindings);
    }

    // Login form brute force
    const isLoginForm = endpoint.formFields.some(f =>
      f.type === 'password' && (f.name.toLowerCase().includes('password') || f.name.toLowerCase().includes('pass'))
    );

    if (isLoginForm && (hasHydra || hasPatator) && !config.dryRun) {
      LOG.log(`Login form detected at ${endpoint.url} – brute force testing available`);
      findings.push({
        id: buildFindingId(endpoint.url, 'login-form', 'auth'),
        url: endpoint.url,
        type: 'auth',
        severity: 'MEDIUM',
        cvss: 6.5,
        tool: 'auth-scanner',
        description: `Login form detected at ${endpoint.url} – test credentials with hydra/patator`,
        evidence: `Form fields: ${endpoint.formFields.map(f => f.name).join(', ')}`,
        createdAt: new Date().toISOString(),
        references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/04-Testing_for_Weak_Lock_Out_Mechanism'],
        subType: 'login-form'
      });
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, config.rateLimitMs));
  }

  LOG.log(`AuthScanner: ${findings.length} findings`);
  return findings;
}

async function checkTool(name: string): Promise<boolean> {
  try {
    await execAsync(`which ${name} || where ${name}`, { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
