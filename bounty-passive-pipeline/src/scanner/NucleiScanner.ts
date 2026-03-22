/**
 * Nuclei wrapper – runs nuclei with selected templates based on stack detection.
 * Uses nuclei v3.7 flags:
 *   -t <dir>   — template directory (can be repeated)
 *   -json-export <path> — write JSON output to file (not stdout)
 *
 * On Windows: execFileP with windowsHide:true + timeout is reliable.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { type ScannerConfig } from './ScannerOrchestrator.js';
import { type NucleiFinding, nucleiToFinding } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execFileP = promisify(execFile);
const LOG = new Logger('NucleiScanner');

/** Template sub-dirs to run from the nuclei-templates directory. Templates live under http/. */
const TEMPLATE_DIRS = [
  'http/vulnerabilities/',
  'http/exposed-panels/',
  'http/exposures/',
  'http/misconfiguration/',
];

/**
 * Parse nuclei JSONL output into NucleiFinding objects.
 * nuclei v3 JSONL: { host, info: { severity, name, description }, matched_at, template_id }
 */
function parseNucleiOutput(output: string): NucleiFinding[] {
  const findings: NucleiFinding[] = [];
  if (!output?.trim()) return findings;

  for (const line of output.split('\n').filter(Boolean)) {
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      const host = (parsed.host ?? parsed.matched_at ?? '') as string;
      const info = (parsed.info ?? {}) as Record<string, unknown>;
      const severity = (info.severity ?? parsed.severity ?? 'info') as string;
      const description = (info.description ?? info.name ?? '') as string;
      const template = (parsed.template_id ?? parsed.template ?? '') as string;
      const matchedAt = (parsed.matched_at ?? new Date().toISOString()) as string;

      if (host) {
        findings.push(
          nucleiToFinding(host, template, severity, matchedAt, description, `Template: ${template}`)
        );
      }
    } catch {
      // Fallback text format: [severity] [template] host
      const textMatch = line.match(/\[(\w+)\]\s+\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/);
      if (textMatch) {
        findings.push(
          nucleiToFinding(textMatch[3], textMatch[2], textMatch[1], new Date().toISOString(), `Nuclei match: ${textMatch[2]}`, line)
        );
      }
    }
  }
  return findings;
}

/**
 * Run nuclei against a list of targets with selected template dirs.
 */
export async function runNuclei(
  targets: string[],
  _stackTechs: string[],
  config: ScannerConfig
): Promise<NucleiFinding[]> {
  const findings: NucleiFinding[] = [];
  const hasNuclei = await isToolAvailable('nuclei');
  if (!hasNuclei) {
    LOG.warn('nuclei not available – skipping nuclei scan');
    return findings;
  }

  if (targets.length === 0) {
    LOG.log('No targets for nuclei scan');
    return findings;
  }

  const tmpDir = os.tmpdir();
  const urlsPath = path.join(tmpDir, `nuclei-urls-${Date.now()}.txt`);
  const jsonOutPath = path.join(tmpDir, `nuclei-json-${Date.now()}.txt`);
  await fs.promises.writeFile(urlsPath, targets.join('\n'), 'utf8');

  const templatesBase = (config.nucleiTemplates || path.join(os.homedir(), 'nuclei-templates'))
    .replace(/^~/, os.homedir());

  // Build args: explicit template dirs (-t can be repeated)
  const args: string[] = ['-l', urlsPath];
  for (const dir of TEMPLATE_DIRS) {
    const fullDir = path.join(templatesBase, dir);
    if (fs.existsSync(fullDir)) {
      args.push('-t', fullDir);
    }
  }

  // Rate limit and timeout
  args.push(
    '-rl', '20',
    '-timeout', String(Math.min(config.timeoutPerTarget ?? 30, 30)),
    '-retries', '0',
    '-nc',
    '-jsonl',          // JSON Lines output (nuclei v3.7.1 compatible)
    '-o', jsonOutPath
  );

  if (config.dryRun) {
    LOG.log(`[DRY_RUN] nuclei ${args.join(' ')}`);
    await fs.promises.unlink(urlsPath).catch(() => {});
    return findings;
  }

  if (!fs.existsSync(templatesBase)) {
    LOG.warn(`Nuclei templates not found at ${templatesBase} – skipping`);
    await fs.promises.unlink(urlsPath).catch(() => {});
    return findings;
  }

  LOG.log(`NucleiScanner: running nuclei on ${targets.length} targets`);
  const timeout = Math.min(config.timeoutPerTarget ?? 60, 120) * 1000;

  try {
    await execFileP('nuclei', args, { timeout, windowsHide: true });

    if (fs.existsSync(jsonOutPath)) {
      const output = await fs.promises.readFile(jsonOutPath, 'utf8');
      findings.push(...parseNucleiOutput(output));
      await fs.promises.unlink(jsonOutPath).catch(() => {});
    } else {
      LOG.log('NucleiScanner: no JSON output (exit 0 = no findings, normal)');
    }
  } catch (err: unknown) {
    const e = err as Error & { name?: string; code?: number };
    if (e.name === 'TimeoutError') {
      LOG.warn(`NucleiScanner: nuclei timeout after ${timeout}ms`);
    } else {
      const code = (err as Record<string, unknown>).code;
      LOG.log(`NucleiScanner: nuclei exited, code=${code ?? '?'}`);
    }
    if (fs.existsSync(jsonOutPath)) {
      try {
        const output = await fs.promises.readFile(jsonOutPath, 'utf8');
        findings.push(...parseNucleiOutput(output));
      } catch { /* ignore */ }
    }
  } finally {
    await fs.promises.unlink(urlsPath).catch(() => {});
  }

  LOG.log(`NucleiScanner: ${findings.length} findings`);
  return findings;
}
