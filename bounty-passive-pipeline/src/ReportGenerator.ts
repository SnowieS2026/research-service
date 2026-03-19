import fs from 'fs';
import path from 'path';
import { DiffNotification } from './BrowserTool.js';
import type { Classification } from './FindingClassifier.js';
import { Logger } from './Logger.js';

const LOG = new Logger('ReportGenerator');

export interface ReportPaths {
  mdPath: string;
  jsonPath: string;
}

export interface ReportData {
  programName: string;
  platform: string;
  programUrl: string;
  severity: string;
  cvss: number;
  reasons: string[];
  reportDate: string;
  changes: ChangeEntry[];
  newAssets: string[];
  removedAssets: string[];
  rewardChange: string;
  changedFields: string[];
  recommendations: string[];
  rawDiff: DiffNotification;
}

export interface ChangeEntry {
  field: string;
  oldValue: string;
  newValue: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();
}

function todayDir(reportsDir: string): string {
  const today = new Date().toISOString().split('T')[0];
  const dir = path.join(reportsDir, today);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function buildChangeEntries(diff: DiffNotification): ChangeEntry[] {
  const entries: ChangeEntry[] = [];
  const diffAny = diff as unknown as Record<string, unknown>;

  for (const field of diff.diff.addedFields) {
    entries.push({
      field,
      oldValue: '(new)',
      newValue: String(diffAny[field] ?? '')
    });
  }

  for (const field of diff.diff.removedFields) {
    entries.push({
      field,
      oldValue: String(diffAny[field] ?? ''),
      newValue: '(removed)'
    });
  }

  for (const field of diff.diff.changedFields) {
    entries.push({
      field,
      oldValue: String(diffAny[field] ?? ''),
      newValue: String(diffAny[field] ?? '')
    });
  }

  return entries;
}

function buildRecommendations(classification: Classification, diff: DiffNotification): string[] {
  const recs: string[] = [];

  if (classification.newAssets.length > 0) {
    recs.push(
      `**Scope expansion detected** – ${classification.newAssets.length} new asset(s) added. ` +
        'Review the new targets and begin reconnaissance. Priority targets: ' +
        classification.newAssets.slice(0, 3).join(', ')
    );
  }

  if (classification.rewardChanged === 'increased') {
    recs.push(
      '**Bounty increased** – Reward ranges have gone up. ' +
        'This program may be actively soliciting higher-severity findings. ' +
        'Consider focusing effort here.'
    );
  }

  if (classification.rewardChanged === 'decreased') {
    recs.push(
      '**Bounty decreased** – Reward ranges have been reduced. ' +
        'Consider whether the program still justifies the effort investment.'
    );
  }

  if (classification.changedFields.includes('prohibited_techniques')) {
    recs.push(
      '**Technique restrictions eased** – Previously prohibited techniques may now be allowed. ' +
        'Review the updated scope and adjust your testing methodology accordingly.'
    );
  }

  if (classification.changedFields.includes('allowed_techniques')) {
    recs.push(
      '**New allowed techniques** – The program has explicitly listed new acceptable techniques. ' +
        'Incorporate these into your testing workflow.'
    );
  }

  if (classification.severity === 'HIGH' || classification.severity === 'CRITICAL') {
    recs.push(
      '**High-impact change detected** – This change warrants immediate attention. ' +
        'Prioritise this program in your current testing cycle.'
    );
  }

  if (recs.length === 0) {
    recs.push(
      'Review the raw diff below for full details on what changed.',
      'Subscribe to notifications for this program to stay updated.'
    );
  }

  return recs;
}

export function generateReport(
  diff: DiffNotification,
  classification: Classification
): ReportData {
  const reportDate = new Date().toISOString().split('T')[0];
  const changes = buildChangeEntries(diff);

  return {
    programName: diff.program_name,
    platform: diff.platform,
    programUrl: diff.program_url,
    severity: classification.severity,
    cvss: classification.cvss,
    reasons: classification.reasons,
    reportDate,
    changes,
    newAssets: classification.newAssets,
    removedAssets: classification.removedAssets,
    rewardChange: classification.rewardChanged,
    changedFields: classification.changedFields,
    recommendations: buildRecommendations(classification, diff),
    rawDiff: diff
  };
}

export function writeReport(
  data: ReportData,
  reportsDir: string,
  diffHash: string
): ReportPaths {
  const dir = todayDir(reportsDir);
  const safeName = sanitizeFilename(data.programName);
  const platform = sanitizeFilename(data.platform);
  const base = `${platform}-${safeName}-${diffHash}`;

  const mdPath = path.join(dir, `${base}.md`);
  const jsonPath = path.join(dir, `${base}.json`);

  const mdContent = renderMarkdown(data);
  const jsonContent = JSON.stringify(data, null, 2);

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');

  LOG.log(`Report written: ${mdPath}`);
  return { mdPath, jsonPath };
}

function renderMarkdown(data: ReportData): string {
  const lines: string[] = [];

  lines.push(`# Bug Bounty Report – ${data.programName}`);
  lines.push('');
  lines.push('## Meta');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Platform | ${data.platform} |`);
  lines.push(`| Program URL | ${data.programUrl} |`);
  lines.push(`| Report Date | ${data.reportDate} |`);
  lines.push(`| Severity | **${data.severity}** |`);
  lines.push(`| CVSS | ${data.cvss} |`);
  lines.push(`| Reasons | ${data.reasons.join('; ')} |`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  const summary = buildSummary(data);
  lines.push(summary);
  lines.push('');

  lines.push('## Changes Detected');
  lines.push('');
  lines.push('| Field | Old Value | New Value |');
  lines.push('| --- | --- | --- |');
  for (const change of data.changes) {
    const oldVal = change.oldValue.length > 80 ? change.oldValue.slice(0, 80) + '…' : change.oldValue;
    const newVal = change.newValue.length > 80 ? change.newValue.slice(0, 80) + '…' : change.newValue;
    lines.push(`| ${change.field} | ${oldVal} | ${newVal} |`);
  }
  lines.push('');

  if (data.newAssets.length > 0) {
    lines.push('## New Scope Assets');
    lines.push('');
    for (const asset of data.newAssets) {
      lines.push(`- ${asset}`);
    }
    lines.push('');
  }

  if (data.removedAssets.length > 0) {
    lines.push('## Removed Scope Assets');
    lines.push('');
    for (const asset of data.removedAssets) {
      lines.push(`- ~~${asset}~~`);
    }
    lines.push('');
  }

  if (data.rewardChange !== 'unchanged' && data.rewardChange !== 'unknown') {
    lines.push('## Reward Changes');
    lines.push('');
    lines.push(`Reward range **${data.rewardChange}**.`);
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');
  for (const rec of data.recommendations) {
    lines.push(rec);
    lines.push('');
  }

  lines.push('## Raw Diff');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(data.rawDiff, null, 2));
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function buildSummary(data: ReportData): string {
  const parts: string[] = [];

  if (data.newAssets.length > 0) {
    parts.push(
      `${data.newAssets.length} new ${data.newAssets.length === 1 ? 'asset' : 'assets'} ` +
        `added to the scope of ${data.programName} on ${data.platform}.`
    );
  }

  if (data.removedAssets.length > 0) {
    parts.push(
      `${data.removedAssets.length} ${data.removedAssets.length === 1 ? 'asset' : 'assets'} ` +
        `removed from scope.`
    );
  }

  if (data.rewardChange === 'increased') {
    parts.push('Reward range increased – higher payouts may be available now.');
  } else if (data.rewardChange === 'decreased') {
    parts.push('Reward range decreased.');
  }

  if (data.changedFields.includes('allowed_techniques')) {
    parts.push('Allowed testing techniques list updated.');
  }

  if (data.changedFields.includes('prohibited_techniques')) {
    parts.push('Prohibited techniques restrictions eased.');
  }

  if (parts.length === 0) {
    parts.push(
      `Minor metadata change detected for ${data.programName}. ` +
        `Severity: ${data.severity}.`
    );
  }

  return parts.join(' ');
}
