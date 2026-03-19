import type { OsintResult } from './types.js';
import { generateOsintReport } from './report.js';
import { loadConfig } from '../config.js';
import { Logger } from '../Logger.js';
import { sessions_send } from '../sessions.js';

const LOG = new Logger('OsintDeliver');

export async function deliverOsintResult(result: OsintResult): Promise<void> {
  const cfg = loadConfig();

  // Always save to disk
  const reportPath = generateOsintReport(result);
  LOG.log(`OSINT report saved to: ${reportPath}`);

  // Telegram summary (unless DRY_RUN)
  if (cfg.ENABLE_TELEGRAM && !cfg.DRY_RUN) {
    await sendTelegramSummary(result, reportPath);
  } else if (cfg.DRY_RUN) {
    LOG.log('[DRY_RUN] Would send Telegram summary');
  }
}

async function sendTelegramSummary(result: OsintResult, reportPath: string): Promise<void> {
  const { query, findings, summary, errors } = result;

  // Confidence-sorted top findings
  const sorted = [...findings].sort((a, b) => b.confidence - a.confidence);
  const topFindings = sorted.filter(f => f.confidence >= 60).slice(0, 8);

  // Confidence distribution
  const high = findings.filter(f => f.confidence >= 80).length;
  const med = findings.filter(f => f.confidence >= 50 && f.confidence < 80).length;
  const low = findings.filter(f => f.confidence < 50).length;

  const lines: string[] = [];

  lines.push(`🔍 *OSINT Report – ${query.type}:* \`${query.target}\``);
  lines.push('');

  // Summary table
  lines.push(`*Summary:* ${findings.length} findings across ${Object.keys(summary).length} collectors`);
  lines.push(`🟢 High: ${high} | 🟡 Med: ${med} | ⚪ Low: ${low}`);
  lines.push('');

  // Collector breakdown
  lines.push('*By Collector:*');
  for (const [collector, count] of Object.entries(summary)) {
    lines.push(`  • ${collector}: ${count} finding(s)`);
  }
  lines.push('');

  // Top findings
  if (topFindings.length > 0) {
    lines.push('*Top Findings:*');
    for (const f of topFindings) {
      const emoji = f.confidence >= 80 ? '🟢' : '🟡';
      const field = f.field.length > 30 ? f.field.substring(0, 28) + '…' : f.field;
      const value = f.value.length > 60 ? f.value.substring(0, 58) + '…' : f.value;
      lines.push(`${emoji} [${f.confidence}%] *${field}:* ${value}`);
    }
    lines.push('');
  }

  // Errors
  if (errors.length > 0) {
    lines.push(`⚠️ *${errors.length} error(s):*`);
    for (const err of errors.slice(0, 3)) {
      const short = err.length > 100 ? err.substring(0, 98) + '…' : err;
      lines.push(`  • ${short}`);
    }
    lines.push('');
  }

  lines.push(`📄 Full report: \`${reportPath}\``);

  const message = lines.join('\n');

  try {
    await sessions_send('agent:main:main', message);
    LOG.log('Telegram summary sent');
  } catch (err) {
    LOG.error(`Failed to send Telegram summary: ${err}`);
  }
}
