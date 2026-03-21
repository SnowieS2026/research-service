/**
 * SQL injection scanning using sqlmap.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
const execFileP = promisify(execFile);
const LOG = new Logger('SQLScanner');
function parseSqlmapOutput(stdout, stderr) {
    const results = [];
    const combined = stdout + '\n' + stderr;
    // Parse sqlmap JSON output if available
    const jsonMatch = combined.match(/\{[\s\S]*?"urls"[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            JSON.parse(jsonMatch[0]);
            // Handle sqlmap JSON format (parsed for url list)
        }
        catch {
            // ignore
        }
    }
    // Text-based parsing
    const injectablePattern = /\[INFO\](.+?)is\s+INJECTABLE\s+---\s+Parameter:\s+(\S+)\s+Type:\s+(\S+)/gi;
    let match;
    while ((match = injectablePattern.exec(combined)) !== null) {
        results.push({
            url: match[1].trim(),
            param: match[2],
            dbms: match[3],
            payload: '[sqlmap injectable]'
        });
    }
    // Simpler pattern: Parameter: id is vulnerable
    const vulnPattern = /Parameter:\s+(\S+).*?(?:vulnerable|INJECTABLE)/gi;
    while ((match = vulnPattern.exec(combined)) !== null) {
        if (!results.some((r) => r.param === match[1])) {
            results.push({
                url: '',
                param: match[1],
                dbms: 'unknown',
                payload: '[sqlmap injectable]'
            });
        }
    }
    return results;
}
/**
 * Run sqlmap in batch mode against a single endpoint.
 */
async function runSqlmap(endpoint, config) {
    const results = [];
    const hasSqlmap = await isToolAvailable('sqlmap');
    if (!hasSqlmap) {
        LOG.warn('sqlmap not available – skipping SQLi scan');
        return results;
    }
    if (endpoint.params.length === 0) {
        LOG.log(`No parameters for sqlmap: ${endpoint.url}`);
        return results;
    }
    // Write URL list to temp file
    const tmpDir = os.tmpdir();
    const urlListPath = path.join(tmpDir, `sqlmap-urls-${Date.now()}.txt`);
    const outputPath = path.join(tmpDir, `sqlmap-out-${Date.now()}.txt`);
    await fs.promises.writeFile(urlListPath, endpoint.url, 'utf8');
    const level = config.sqlmapLevel ?? 2;
    const risk = config.sqlmapRisk ?? 1;
    const args = [
        '-m', urlListPath,
        '--batch',
        `--level=${level}`,
        `--risk=${risk}`,
        '--output-dir', tmpDir,
        '-o'
    ];
    if (config.dryRun) {
        LOG.log(`[DRY_RUN] sqlmap ${args.join(' ')}`);
        await fs.promises.unlink(urlListPath).catch(() => { });
        return results;
    }
    try {
        const { stdout, stderr } = await execFileP('sqlmap', args, {
            signal: AbortSignal.timeout(30_000),
            timeout: config.timeoutPerTarget,
            cwd: tmpDir,
            windowsHide: true
        });
        results.push(...parseSqlmapOutput(stdout, stderr));
    }
    catch (err) {
        const e = err;
        if (e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') {
            LOG.warn(`sqlmap timeout on ${endpoint.url} – skipping`);
            return results;
        }
        // sqlmap exits non-zero when it finds vulns
        results.push(...parseSqlmapOutput(e.stdout ?? '', e.stderr ?? ''));
    }
    finally {
        await fs.promises.unlink(urlListPath).catch(() => { });
        await fs.promises.unlink(outputPath).catch(() => { });
    }
    return results;
}
/**
 * Scan targets for SQL injection vulnerabilities using sqlmap.
 */
export async function scanForSQLi(targets, _stack, config) {
    const findings = [];
    const hasSqlmap = await isToolAvailable('sqlmap');
    if (!hasSqlmap && !config.dryRun) {
        LOG.warn('sqlmap not available – skipping SQLi scan');
        return findings;
    }
    for (const endpoint of targets) {
        if (endpoint.params.length === 0)
            continue;
        try {
            const results = await runSqlmap(endpoint, config);
            for (const r of results) {
                const dbms = r.dbms ?? 'unknown';
                findings.push({
                    id: buildFindingId(r.url || endpoint.url, r.param, 'sql'),
                    url: r.url || endpoint.url,
                    type: 'sql',
                    severity: dbms !== 'unknown' ? 'CRITICAL' : 'HIGH',
                    cvss: dbms !== 'unknown' ? 9.8 : 8.1,
                    tool: 'sqlmap',
                    param: r.param,
                    dbms,
                    description: `SQL injection in parameter '${r.param}'${dbms !== 'unknown' ? ` (${dbms})` : ''}`,
                    evidence: r.payload,
                    createdAt: new Date().toISOString(),
                    references: [
                        'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05-Testing_for_SQL_Injection'
                    ]
                });
            }
        }
        catch (err) {
            LOG.warn(`sqlmap error on ${endpoint.url}: ${err}`);
        }
        // Rate limit
        await new Promise((r) => setTimeout(r, config.rateLimitMs));
    }
    LOG.log(`SQLScanner: ${findings.length} findings`);
    return findings;
}
