import type { ReportData, ReportPaths } from './ReportGenerator.js';
import { generateReport, writeReport } from './ReportGenerator.js';
import type { DiffNotification } from './BrowserTool.js';
import type { Classification } from './FindingClassifier.js';
import { classifyFinding } from './FindingClassifier.js';
import { BountyDB } from './storage/BountyDB.js';
import type { PipelineConfig } from './config.js';
import { meetsSeverityThreshold } from './config.js';
import { Logger } from './Logger.js';

const LOG = new Logger('Reporter');

export interface ReporterOptions {
  config: PipelineConfig;
  runId: number;
  db?: BountyDB;
}

export class Reporter {
  private config: PipelineConfig;
  private runId: number;
  private db?: BountyDB;
  private deliveredCount = 0;

  constructor(opts: ReporterOptions) {
    this.config = opts.config;
    this.runId = opts.runId;
    this.db = opts.db;
    LOG.log(`Reporter initialized (run #${this.runId}, DRY_RUN=${this.config.DRY_RUN})`);
  }

  /**
   * Process a diff notification end-to-end:
   * classify → generate report → save → optionally notify via Telegram + DB.
   */
  async process(notification: DiffNotification): Promise<ReportPaths | null> {
    const hasChanges =
      notification.diff.addedFields.length > 0 ||
      notification.diff.removedFields.length > 0 ||
      notification.diff.changedFields.length > 0;

    if (!hasChanges) {
      LOG.log(`No changes for ${notification.program_name} – skipping report`);
      return null;
    }

    const classification = classifyFinding(notification);

    LOG.log(
      `Classification for ${notification.program_name}: ${classification.severity} ` +
        `(${classification.reasons.join(', ')})`
    );

    if (!meetsSeverityThreshold(classification.severity, this.config.MIN_SEVERITY_TO_NOTIFY)) {
      LOG.log(
        `Severity ${classification.severity} below threshold ${this.config.MIN_SEVERITY_TO_NOTIFY} – skipping`
      );
      return null;
    }

    // Generate and write report
    const reportData = generateReport(notification, classification);
    const diffHash = notification.diff.newHash.slice(0, 12);
    const paths = writeReport(reportData, this.config.REPORTS_DIR, diffHash);

    if (this.config.DRY_RUN) {
      LOG.log(`[DRY_RUN] Would deliver report for ${notification.program_name} at ${paths.mdPath}`);
      return paths;
    }

    // Save to DB
    if (this.db && this.config.ENABLE_DB) {
      await this.saveToDb(reportData, paths, notification);
    }

    // Send to Telegram
    if (this.config.ENABLE_TELEGRAM) {
      await this.sendToTelegram(reportData, paths);
    }

    this.deliveredCount++;
    return paths;
  }

  private async saveToDb(
    reportData: ReportData,
    paths: ReportPaths,
    notification: DiffNotification
  ): Promise<void> {
    if (!this.db) return;
    try {
      const reportId = this.db.insertReport(
        this.runId,
        reportData.programName,
        reportData.platform,
        reportData.severity,
        reportData.cvss,
        paths.mdPath,
        notification.diff.newHash
      );

      for (const change of reportData.changes) {
        this.db.insertFinding(
          reportId,
          change.field,
          change.oldValue,
          change.newValue,
          ''
        );
      }
      LOG.log(`Report saved to DB: id=${reportId}`);
    } catch (err) {
      LOG.error(`Failed to save report to DB: ${err}`);
    }
  }

  private async sendToTelegram(reportData: ReportData, paths: ReportPaths): Promise<void> {
    try {
      const summary = this.buildTelegramMessage(reportData, paths);
      const message = summary.length > 4000 ? summary.slice(0, 4000) + '\n…(truncated)' : summary;

      // Use sessions_send to deliver to main session
      const { sessions_send } = await import('./sessions.js');
      await sessions_send('agent:main:main', message);

      LOG.log(`Telegram notification sent for ${reportData.programName}`);
    } catch (err) {
      LOG.error(`Failed to send Telegram notification: ${err}`);
    }
  }

  private buildTelegramMessage(data: ReportData, paths: ReportPaths): string {
    const lines: string[] = [];

    lines.push(`🛎 *Bug Bounty Change Detected*`);
    lines.push('');
    lines.push(`*Program:* ${data.programName}`);
    lines.push(`*Platform:* ${data.platform}`);
    lines.push(`*Severity:* ${data.severity} (CVSS ${data.cvss})`);
    lines.push(`*Date:* ${data.reportDate}`);
    lines.push('');
    lines.push('*Changes:*');
    for (const reason of data.reasons) {
      lines.push(`  • ${reason}`);
    }

    if (data.newAssets.length > 0) {
      lines.push('');
      lines.push(`*New assets (${data.newAssets.length}):*`);
      for (const asset of data.newAssets.slice(0, 10)) {
        lines.push(`  • ${asset}`);
      }
      if (data.newAssets.length > 10) {
        lines.push(`  • …and ${data.newAssets.length - 10} more`);
      }
    }

    lines.push('');
    lines.push(`📄 Full report: \`${paths.mdPath}\``);

    return lines.join('\n');
  }

  getDeliveredCount(): number {
    return this.deliveredCount;
  }
}
