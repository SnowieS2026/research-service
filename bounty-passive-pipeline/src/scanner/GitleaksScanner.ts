/**
 * GitleaksScanner – secret / credential scanning using gitleaks.
 * Scans:
 *  1. GitHub repositories detected in scope assets (github.com/org/repo)
 *  2. Git repository URLs discovered by gau/subfinder (e.g. .git/config URLs)
 *
 * Runs `gitleaks detect --no-git --report-path <report.json>` on each repo.
 * Returns CRITICAL-severity findings for any secrets found.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { type ScannerConfig } from './ScannerOrchestrator.js';
import { type InfoFinding, type BaseFinding, FindingSeverity, buildFindingId } from './ScanResult.js';
import { Logger } from '../Logger.js';
import { isToolAvailable } from './tool-utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execFileP = promisify(execFile);
const LOG = new Logger('GitleaksScanner');

interface GitleaksResult {
  rule: string;
  match: string;
  file: string;
  line: number;
  commit: string;
  repo: string;
  repoURL: string;
  commitURL: string;
  author: string;
  email: string;
  date: string;
  message: string;
  tags: string[];
}

// Secret type → CVSS estimate
const SECRET_CVSS: Record<string, number> = {
  'API Key': 8.0,
  'AWS Access Key': 9.0,
  'AWS Secret Key': 9.5,
  'Azure Storage Key': 8.5,
  'GCP Service Account': 9.0,
  'GitHub Personal Access Token': 9.0,
  'GitHub OAuth': 9.5,
  'GitLab Personal Access Token': 9.0,
  'Slack Token': 8.5,
  'Discord Token': 9.0,
  'Stripe API Key': 9.5,
  'Stripe Publishable Key': 4.0,
  'Mailgun API Key': 8.0,
  'SendGrid API Key': 8.0,
  'Twilio API Key': 8.5,
  'JWT Token': 9.0,
  'Private Key': 9.8,
  'Generic Secret': 7.5,
  'Password': 9.8,
  'Database Credential': 9.5,
  'Hardcoded Credential': 9.0,
  'Client Secret': 9.0,
  'Session Token': 8.5,
  'API Token': 8.0,
  'Authorization Bearer': 8.5
};

function ruleToCvss(rule: string): number {
  const upper = rule.toUpperCase();
  for (const [key, cvss] of Object.entries(SECRET_CVSS)) {
    if (upper.includes(key.toUpperCase())) return cvss;
  }
  return 8.0; // default
}

function ruleToSeverity(rule: string): FindingSeverity {
  const cvss = ruleToCvss(rule);
  if (cvss >= 9.0) return 'CRITICAL';
  if (cvss >= 7.0) return 'HIGH';
  if (cvss >= 4.0) return 'MEDIUM';
  return 'LOW';
}

/**
 * Detect GitHub repository URLs from scope assets.
 * Handles: github.com/org/repo, https://github.com/org/repo, git@github.com:org/repo.git
 */
function extractGitHubRepos(targets: string[]): Array<{ org: string; repo: string }> {
  const repos: Array<{ org: string; repo: string }> = [];
  const seen = new Set<string>();

  for (const target of targets) {
    // git@github.com:org/repo.git
    const gitMatch = target.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (gitMatch) {
      const key = `${gitMatch[1]}/${gitMatch[2]}`;
      if (!seen.has(key)) { seen.add(key); repos.push({ org: gitMatch[1], repo: gitMatch[2] }); }
      continue;
    }

    // https://github.com/org/repo or http://github.com/org/repo
    try {
      const u = new URL(target);
      if (u.hostname === 'github.com' || u.hostname === 'www.github.com') {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const key = `${parts[0]}/${parts[1]}`;
          if (!seen.has(key)) { seen.add(key); repos.push({ org: parts[0], repo: parts[1] }); }
        }
      }
    } catch {
      // skip
    }
  }

  return repos;
}

/**
 * Detect .git URLs from gau/subfinder output (e.g. https://example.com/.git/config)
 */
function extractGitConfigUrls(urls: string[]): string[] {
  const gitUrls: string[] = [];
  for (const url of urls) {
    if (/\.git\/config$/.test(url) || /\.git\/HEAD$/.test(url)) {
      // Trim to base repo URL
      const base = url.replace(/\.git\/(config|HEAD)$/, '.git');
      if (!gitUrls.includes(base)) gitUrls.push(base);
    }
    // Also detect bare git URLs like https://example.com/repo.git
    if (/^https?:\/\/[^/]+\/[^/]+\.git\/?$/.test(url)) {
      if (!gitUrls.includes(url)) gitUrls.push(url);
    }
  }
  return gitUrls;
}

/**
 * Clone a git repository to a temp directory.
 * Returns the local path to the cloned repo.
 */
async function cloneRepo(repoUrl: string, tmpDir: string, timeoutMs = 60_000): Promise<string | null> {
  const hasGit = await isToolAvailable('git');
  if (!hasGit) {
    LOG.warn('git not available – cannot clone repos');
    return null;
  }

  // Generate a safe local directory name from the repo URL
  const repoName = repoUrl
    .replace(/^https?:\/\//, '')
    .replace(/:/g, '_')
    .replace(/\//g, '_')
    .replace(/\.git$/, '')
    .slice(0, 60);

  const clonePath = path.join(tmpDir, `gitleaks-${repoName}-${Date.now()}`);

  try {
    await execFileP('git', ['clone', '--depth=1', repoUrl, clonePath], {
      signal: AbortSignal.timeout(timeoutMs)
    });
    LOG.log(`GitleaksScanner: cloned ${repoUrl} → ${clonePath}`);
    return clonePath;
  } catch (err) {
    const e = err as Error & { name?: string; code?: string };
    if (e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') {
      LOG.warn(`git clone timeout: ${repoUrl}`);
    } else {
      LOG.warn(`git clone failed: ${repoUrl} – ${err}`);
    }
    return null;
  }
}

/**
 * Run gitleaks detect on a local repository directory.
 * Returns parsed gitleaks findings.
 */
async function runGitleaks(repoPath: string, timeoutMs = 120_000): Promise<GitleaksResult[]> {
  const hasGitleaks = await isToolAvailable('gitleaks');
  if (!hasGitleaks) {
    LOG.warn('gitleaks not available – skipping secret scan');
    return [];
  }

  const tmpDir = os.tmpdir();
  const reportFile = path.join(tmpDir, `gitleaks-report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);

  const args = [
    'detect',
    '--no-git',
    '--source', repoPath,
    '--report-path', reportFile,
    '--no-color'
  ];

  try {
    // gitleaks exits non-zero when secrets are found – that's expected
    await execFileP('gitleaks', args, { signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    // Non-zero exit means secrets found (or error) – we still read the report
  }

  try {
    const content = await fs.promises.readFile(reportFile, 'utf8');
    await fs.promises.unlink(reportFile).catch(() => {});
    const results = JSON.parse(content);
    return Array.isArray(results) ? results : [results];
  } catch {
    await fs.promises.unlink(reportFile).catch(() => {});
    return [];
  }
}

/**
 * Scan scope targets for secrets using gitleaks.
 * Handles GitHub org/repos from scope assets and .git URLs from other OSINT tools.
 */
export async function scanGitleaks(
  targets: string[],
  _stack: unknown,
  config: ScannerConfig
): Promise<BaseFinding[]> {
  const findings: BaseFinding[] = [];

  const hasGitleaks = await isToolAvailable('gitleaks');
  if (!hasGitleaks) {
    LOG.warn('gitleaks not available – skipping secret scanning');
    return findings;
  }

  const tmpDir = path.join(os.tmpdir(), 'bounty-gitleaks');
  await fs.promises.mkdir(tmpDir, { recursive: true });

  // 1. Scan GitHub repos from scope assets
  const githubRepos = extractGitHubRepos(targets);
  LOG.log(`GitleaksScanner: ${githubRepos.length} GitHub repos to scan`);

  for (const { org, repo } of githubRepos) {
    if (config.dryRun) {
      LOG.log(`[DRY_RUN] gitleaks scan: github.com/${org}/${repo}`);
      continue;
    }

    const clonePath = await cloneRepo(`https://github.com/${org}/${repo}.git`, tmpDir);
    if (!clonePath) continue;

    const results = await runGitleaks(clonePath, config.timeoutPerTarget ?? 120_000);
    LOG.log(`GitleaksScanner: ${org}/${repo} → ${results.length} secrets found`);

    for (const r of results) {
      const fileUrl = `https://github.com/${org}/${repo}/blob/master/${r.file}#L${r.line}`;
      findings.push({
        id: buildFindingId(`${org}/${repo}/${r.file}`, `line-${r.line}`, 'secret'),
        url: fileUrl,
        type: 'info',
        severity: ruleToSeverity(r.rule),
        cvss: ruleToCvss(r.rule),
        tool: 'gitleaks',
        description: `Secret detected: ${r.rule}`,
        evidence: `File: ${r.file}:${r.line} | Rule: ${r.rule} | Match: ${r.match} | Author: ${r.author} <${r.email}>`,
        createdAt: new Date().toISOString(),
        references: [fileUrl]
      });
    }

    // Cleanup cloned repo
    await fs.promises.rm(clonePath, { recursive: true, force: true }).catch(() => {});

    // Rate limit
    await new Promise((r) => setTimeout(r, config.rateLimitMs));
  }

  // 2. Scan .git URLs from other OSINT tool output
  // These are passed via the targets array when gitleaks is called from
  // the orchestrator after subfinder/gau have run
  const gitUrls = extractGitConfigUrls(targets);
  LOG.log(`GitleaksScanner: ${gitUrls.length} .git URLs to scan`);

  for (const gitUrl of gitUrls) {
    if (config.dryRun) {
      LOG.log(`[DRY_RUN] gitleaks scan: ${gitUrl}`);
      continue;
    }

    const clonePath = await cloneRepo(gitUrl, tmpDir);
    if (!clonePath) continue;

    const results = await runGitleaks(clonePath, config.timeoutPerTarget ?? 120_000);

    for (const r of results) {
      findings.push({
        id: buildFindingId(`${gitUrl}/${r.file}`, `line-${r.line}`, 'secret'),
        url: `${gitUrl}/${r.file}#L${r.line}`,
        type: 'info',
        severity: ruleToSeverity(r.rule),
        cvss: ruleToCvss(r.rule),
        tool: 'gitleaks',
        description: `Secret detected: ${r.rule}`,
        evidence: `File: ${r.file}:${r.line} | Rule: ${r.rule} | Match: ${r.match}`,
        createdAt: new Date().toISOString(),
        references: []
      });
    }

    // Cleanup
    await fs.promises.rm(clonePath, { recursive: true, force: true }).catch(() => {});
    await new Promise((r) => setTimeout(r, config.rateLimitMs));
  }

  LOG.log(`GitleaksScanner: ${findings.length} secret findings`);
  return findings;
}
