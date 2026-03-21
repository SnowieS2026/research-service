/**
 * API-focused scanning: GraphQL introspection, REST API endpoints,
 * OpenAPI/Swagger discovery.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
const execAsync = promisify(exec);
const LOG = new Logger('ApiScanner');
// Common REST API paths to probe
const REST_API_PATHS = [
    '/api/v1/users', '/api/v1/users/', '/api/v1/admin',
    '/api/v2/', '/api/', '/api/users', '/api/admin',
    '/rest/v1/', '/rest/api/', '/graphql', '/gql',
    '/api-docs', '/swagger', '/swagger.json', '/swagger.yaml',
    '/openapi.json', '/openapi.yaml', '/api/swagger',
    '/api/documentation', '/api/v1/', '/v1/api/',
    '/api/v2/users', '/api/current', '/api/me',
    '/api/config', '/api/settings', '/api/profile',
    '/api/health', '/api/status', '/api/info',
    '/api/keys', '/api/tokens', '/api/login', '/api/auth'
];
// GraphQL introspection query
const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      args { ...InputValue }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args { ...InputValue }
    type { ...TypeRef }
    isDeprecated
    deprecationReason
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType { kind name ofType { kind name ofType { kind name } } }
}
`;
/**
 * Probe GraphQL endpoint for introspection.
 */
async function probeGraphQL(endpoint) {
    const result = {
        introspectionAvailable: false,
        schema: null,
        queryRoot: null,
        mutationsAvailable: false
    };
    const graphqlUrl = endpoint.url.includes('graphql') ? endpoint.url : `${endpoint.url.replace(/\/$/, '')}/graphql`;
    try {
        const response = await fetch(graphqlUrl, {
            method: 'POST',
            signal: AbortSignal.timeout(15_000),
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; ApiScanner/1.0; +bounty-pipeline)'
            },
            body: JSON.stringify({ query: INTROSPECTION_QUERY })
        });
        if (!response.ok)
            return result;
        const json = await response.json();
        if (json.data?.__schema) {
            result.introspectionAvailable = true;
            result.schema = json.data.__schema;
            result.queryRoot = json.data.__schema.queryType?.name ?? null;
            result.mutationsAvailable = !!json.data.__schema.mutationType;
        }
    }
    catch {
        // ignore
    }
    return result;
}
/**
 * Probe REST API paths for information disclosure.
 */
async function probeRESTApi(baseUrl) {
    const findings = [];
    for (const apiPath of REST_API_PATHS) {
        const url = `${baseUrl.replace(/\/$/, '')}${apiPath}`;
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(8_000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ApiScanner/1.0; +bounty-pipeline)',
                    'Accept': 'application/json, */*'
                }
            });
            if (response.ok) {
                const contentType = response.headers.get('content-type') ?? '';
                // Check for OpenAPI/Swagger JSON
                if (url.endsWith('.json') || url.endsWith('.yaml')) {
                    try {
                        const json = await response.json();
                        if (json.openapi || json.swagger) {
                            findings.push({
                                id: buildFindingId(url, 'openapi', 'api'),
                                url,
                                type: 'api',
                                severity: 'HIGH',
                                cvss: 8.1,
                                tool: 'api-scanner',
                                description: `OpenAPI/Swagger spec exposed at ${url} – enumerate endpoints for auth issues`,
                                evidence: `Content-Type: ${contentType} | Spec version: ${json.openapi ?? json.swagger}`,
                                createdAt: new Date().toISOString(),
                                references: ['https://www.oauth.com/oauth2-server-pdiscovery/'],
                                subType: 'openapi-exposed'
                            });
                        }
                    }
                    catch {
                        // not JSON
                    }
                }
                // Sensitive API data exposed
                if (contentType.includes('application/json') && response.status === 200) {
                    const text = await response.text();
                    if (text.length < 100_000) { // don't read huge responses
                        const parsed = JSON.parse(text);
                        const textLower = JSON.stringify(parsed).toLowerCase();
                        // Check for sensitive data exposure
                        if (/password|passwd|secret|token|api_key|apikey|private/i.test(textLower)) {
                            findings.push({
                                id: buildFindingId(url, 'sensitive-data', 'api'),
                                url,
                                type: 'api',
                                severity: 'CRITICAL',
                                cvss: 9.1,
                                tool: 'api-scanner',
                                description: `Sensitive data (passwords/secrets/tokens) exposed via ${url}`,
                                evidence: `API returned JSON containing sensitive fields`,
                                createdAt: new Date().toISOString(),
                                references: ['https://owasp.org/www-project-api-security/'],
                                subType: 'sensitive-data-exposure'
                            });
                        }
                        // Check for user enumeration
                        if (/\{"id":\d+.*?"email"|userId|username|count":\d+\}/.test(text) && url.includes('/users')) {
                            findings.push({
                                id: buildFindingId(url, 'user-enum', 'api'),
                                url,
                                type: 'api',
                                severity: 'MEDIUM',
                                cvss: 6.5,
                                tool: 'api-scanner',
                                description: `User enumeration endpoint: ${url}`,
                                evidence: `GET ${url} → HTTP 200 with user data`,
                                createdAt: new Date().toISOString(),
                                references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Testing_Handbook/'],
                                subType: 'user-enumeration'
                            });
                        }
                    }
                }
                // Missing auth on sensitive endpoints
                if (response.status === 200 && /\/admin|\/config|\/settings|\/user|\/me\/?$/i.test(url)) {
                    findings.push({
                        id: buildFindingId(url, 'missing-auth', 'api'),
                        url,
                        type: 'api',
                        severity: 'HIGH',
                        cvss: 8.1,
                        tool: 'api-scanner',
                        description: `Sensitive API endpoint ${url} accessible without authentication`,
                        evidence: `GET ${url} → HTTP 200`,
                        createdAt: new Date().toISOString(),
                        references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/'],
                        subType: 'missing-auth'
                    });
                }
            }
            // OPTIONS method reveals allowed methods (CORS misconfig)
            if (response.headers.get('access-control-allow-methods')) {
                const allowedMethods = response.headers.get('access-control-allow-methods') ?? '';
                if (allowedMethods.toLowerCase().includes('delete') || allowedMethods.toLowerCase().includes('put') || allowedMethods.toLowerCase().includes('patch')) {
                    findings.push({
                        id: buildFindingId(url, 'cors-misconfig', 'api'),
                        url,
                        type: 'api',
                        severity: 'MEDIUM',
                        cvss: 6.1,
                        tool: 'api-scanner',
                        description: `CORS misconfiguration on ${url} – dangerous HTTP methods allowed`,
                        evidence: `Access-Control-Allow-Methods: ${allowedMethods}`,
                        createdAt: new Date().toISOString(),
                        references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Web_Services/'],
                        subType: 'cors-misconfiguration'
                    });
                }
            }
        }
        catch {
            // ignore
        }
        // Rate limit
        await new Promise((r) => setTimeout(r, 500));
    }
    return findings;
}
/**
 * Scan for API-related vulnerabilities: GraphQL, REST API, OpenAPI docs.
 */
export async function scanAPI(targets, stack, config) {
    const findings = [];
    const hasGraphQL = (stack?.technologies ?? []).some(t => t.name === 'GraphQL');
    // ── GraphQL testing ────────────────────────────────────────────────────────
    if (hasGraphQL) {
        const graphqlEndpoints = targets.filter(e => e.url.includes('graphql') || e.url.includes('api'));
        for (const endpoint of graphqlEndpoints) {
            if (config.dryRun) {
                LOG.log(`[DRY_RUN] GraphQL introspection on ${endpoint.url}`);
                continue;
            }
            const gqlResult = await probeGraphQL(endpoint);
            if (gqlResult.introspectionAvailable) {
                findings.push({
                    id: buildFindingId(endpoint.url, '__schema', 'api'),
                    url: endpoint.url,
                    type: 'api',
                    severity: 'HIGH',
                    cvss: 8.1,
                    tool: 'api-scanner',
                    description: `GraphQL introspection enabled – schema enumeration possible`,
                    evidence: `Query root: ${gqlResult.queryRoot ?? 'unknown'}, Mutations: ${gqlResult.mutationsAvailable ? 'yes' : 'no'}`,
                    createdAt: new Date().toISOString(),
                    references: ['https://graphql.org/learn/introspection/'],
                    subType: 'graphql-introspection'
                });
                // Mutations available → test for mutations
                if (gqlResult.mutationsAvailable) {
                    findings.push({
                        id: buildFindingId(endpoint.url, 'mutations', 'api'),
                        url: endpoint.url,
                        type: 'api',
                        severity: 'MEDIUM',
                        cvss: 6.5,
                        tool: 'api-scanner',
                        description: `GraphQL mutations available – test for IDOR, injection, and auth bypass`,
                        evidence: `Mutation root: ${gqlResult.queryRoot}`,
                        createdAt: new Date().toISOString(),
                        references: ['https://portswigger.net/web-security/graphql'],
                        subType: 'graphql-mutations'
                    });
                }
            }
            // Rate limit
            await new Promise((r) => setTimeout(r, config.rateLimitMs));
        }
    }
    // ── REST API testing ───────────────────────────────────────────────────────
    // Probe common REST API paths
    const baseUrls = [...new Set(targets.map(t => {
            try {
                const u = new URL(t.url);
                return `${u.protocol}//${u.host}`;
            }
            catch {
                return null;
            }
        }).filter(Boolean))];
    for (const base of baseUrls) {
        if (config.dryRun) {
            LOG.log(`[DRY_RUN] REST API probe on ${base}`);
            continue;
        }
        const restFindings = await probeRESTApi(base);
        findings.push(...restFindings);
    }
    LOG.log(`ApiScanner: ${findings.length} findings`);
    return findings;
}
