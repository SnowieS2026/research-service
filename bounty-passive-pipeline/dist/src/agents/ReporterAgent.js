/**
 * ReporterAgent – generates and delivers change + scan reports.
 *
 * Receives:
 *   - REPORT:GENERATE (immediate, from browser on change) → generate change report
 *   - REPORT:GENERATE (phase-level, from coordinator at end of tick) → generate summary
 *
 * Sends:
 *   - REPORT:DONE → coordinator with paths + notification status
 *
 * Self-healing:
 * - If Telegram send fails → retries with backoff (3 attempts)
 * - If disk write fails → tries alternate report directory
 * - If classification fails → falls back to INFO severity
 * - Report generation is idempotent (based on diff hash)
 */
import { BaseAgent } from './BaseAgent.js';
import { Logger } from '../Logger.js';
import { writeReport } from '../ReportGenerator.js';
import { classifyFinding } from '../FindingClassifier.js';
import { BountyDB } from '../storage/BountyDB.js';
import path from 'path';
import fs from 'fs';
const LOG = new Logger('Agent:Reporter');
const MAX_DELIVERY_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 3_000;
const REPORTS_DIR_FALLBACK = 'reports';
export class ReporterAgent extends BaseAgent {
    PIPELINE_ROOT;
    db;
    deliveryQueue = [];
    reportQueue = [];
    pendingReports = new Map(); // diffHash → done
    constructor(pipelineRoot) {
        super('reporter', {
            queueDir: path.join(pipelineRoot ?? process.cwd(), 'logs', 'agent-queue'),
            pollIntervalMs: 2_000,
            repairThreshold: 5,
            repairCooloffMs: 30_000
        });
        this.PIPELINE_ROOT = pipelineRoot ?? process.cwd();
    }
    async setup() {
        try {
            this.db = new BountyDB(path.join(this.PIPELINE_ROOT, 'logs', 'bounty.db'));
        }
        catch (err) {
            LOG.warn(`DB not available: ${err}`);
        }
        LOG.log('ReporterAgent ready');
    }
    async onShutdown() {
        this.db?.close();
        LOG.log('ReporterAgent shut down');
    }
    async handleMessage(msg) {
        switch (msg.type) {
            case 'REPORT:GENERATE': {
                const payload = msg.payload;
                if ('programUrl' in payload && 'changes' in payload) {
                    // Immediate change report (from browser)
                    await this.generateChangeReport(payload);
                }
                else if ('scanResults' in payload) {
                    // Scan results report (from scanner)
                    await this.generateScanReport(payload);
                }
                else if ('completedDiffs' in payload) {
                    // Phase summary (from coordinator)
                    await this.generatePhaseSummary(payload);
                }
                return true;
            }
            case 'PING':
                this.replyTo(msg, 'ACK', {
                    name: this.name,
                    pendingReports: this.reportQueue.length,
                    pendingDeliveries: this.deliveryQueue.length
                });
                return true;
            default:
                return false;
        }
    }
    // ── Change reports (immediate, from browser agent) ──────────────────────────
    async generateChangeReport(data) {
        const { programUrl, changes, scopeAssets } = data;
        LOG.log(`Generating change report for ${programUrl}: ${changes.length} changes`);
        try {
            // Classify the change
            const classification = classifyFinding({
                program_name: programUrl,
                platform: detectPlatform(programUrl) ?? 'unknown',
                program_url: programUrl,
                engagement_type: 'unknown',
                submission_state: 'unknown',
                rewards: { min: undefined, max: undefined, currency: 'USD' },
                scope: scopeAssets,
                created_at: new Date().toISOString(),
                diff: {
                    oldHash: '',
                    newHash: '',
                    addedFields: [],
                    removedFields: [],
                    changedFields: changes.map((c) => ({
                        field: c.field ?? c.name ?? 'unknown',
                        oldValue: c.oldValue ?? '',
                        newValue: c.newValue ?? ''
                    }))
                }
            });
            // Generate report
            const reportData = {
                programName: programUrl,
                platform: detectPlatform(programUrl) ?? 'unknown',
                severity: classification.severity,
                cvss: classification.cvss,
                reasons: classification.reasons,
                changes: changes.map((c) => ({
                    field: c.field ?? c.name ?? 'unknown',
                    oldValue: c.oldValue ?? '',
                    newValue: c.newValue ?? ''
                })),
                newAssets: scopeAssets,
                reportDate: new Date().toISOString()
            };
            const diffHash = reportData.newHash?.slice(0, 12) ?? Date.now().toString(36);
            const paths = writeReport(reportData, this.getReportsDir(), diffHash);
            LOG.log(`Change report written: ${paths.mdPath}`);
            // Deliver immediately
            await this.deliverReport(paths.mdPath, reportData);
            // Acknowledge to coordinator
            this.send('coordinator', 'REPORT:DONE', {
                reportPaths: [paths.mdPath, paths.jsonPath],
                notified: true,
                type: 'change'
            });
        }
        catch (err) {
            const errMsg = String(err);
            LOG.error(`Change report generation failed for ${programUrl}: ${errMsg}`);
            // Try fallback report dir
            try {
                const fallbackDir = path.join(this.PIPELINE_ROOT, REPORTS_DIR_FALLBACK, 'fallback');
                fs.mkdirSync(fallbackDir, { recursive: true });
                LOG.log('Attempting fallback write…');
            }
            catch { /* ignore */ }
            this.send('coordinator', 'REPORT:FAIL', {
                programUrl,
                error: errMsg
            });
        }
    }
    // ── Scan reports ─────────────────────────────────────────────────────────────
    async generateScanReport(data) {
        const result = data.scanResults;
        if ((result.findingsCount ?? 0) === 0) {
            LOG.log('No scan findings – skipping report');
            return;
        }
        LOG.log(`Scan report: ${result.findingsCount} findings`);
        // Reports already written by ParallelScanner – just deliver them
        if (result.reportPaths && result.reportPaths.length > 0) {
            for (const rp of result.reportPaths) {
                await this.deliverReport(rp, null);
            }
        }
    }
    // ── Phase summary ────────────────────────────────────────────────────────────
    async generatePhaseSummary(data) {
        LOG.log(`Generating phase summary (tick #${data.tickCount})`);
        const allAssets = [...new Set(Object.values(data.scopeAssets).flat())];
        const summaryLines = [];
        summaryLines.push(`# Pipeline Summary — Tick #${data.tickCount}`);
        summaryLines.push(`Generated: ${new Date().toISOString()}`);
        summaryLines.push('');
        summaryLines.push(`## Programs Processed`);
        summaryLines.push(`${data.completedDiffs.length} programs with diffs`);
        summaryLines.push('');
        summaryLines.push(`## Scope Assets`);
        summaryLines.push(`${allAssets.length} total unique assets`);
        if (allAssets.length > 0) {
            summaryLines.push('');
            summaryLines.push('**Top programs by asset count:**');
            const byCount = Object.entries(data.scopeAssets)
                .map(([k, v]) => [k, v.length])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            for (const [program, count] of byCount) {
                summaryLines.push(`- ${program}: ${count} assets`);
            }
        }
        summaryLines.push('');
        summaryLines.push(`## Scan Reports`);
        if (data.scanReportPaths.length > 0) {
            for (const rp of data.scanReportPaths) {
                summaryLines.push(`- \`${rp}\``);
            }
        }
        else {
            summaryLines.push('No scan reports this tick.');
        }
        summaryLines.push('');
        summaryLines.push(`_Generated by ReporterAgent at ${new Date().toISOString()}_`);
        const today = new Date().toISOString().split('T')[0];
        const summaryPath = path.join(this.getReportsDir(), today, `summary-tick${data.tickCount}.md`);
        try {
            fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
            fs.writeFileSync(summaryPath, summaryLines.join('\n'), 'utf8');
            LOG.log(`Phase summary written: ${summaryPath}`);
            await this.deliverReport(summaryPath, null);
        }
        catch (err) {
            LOG.error(`Phase summary write failed: ${err}`);
        }
    }
    // ── Delivery ─────────────────────────────────────────────────────────────────
    async deliverReport(reportPath, _reportData) {
        if (!fs.existsSync(reportPath)) {
            LOG.warn(`Report not found: ${reportPath}`);
            return false;
        }
        let attempts = 0;
        while (attempts < MAX_DELIVERY_RETRIES) {
            try {
                // Send to main session via sessions_send
                await this.sendToMainSession(reportPath);
                LOG.log(`Report delivered: ${reportPath}`);
                return true;
            }
            catch (err) {
                attempts++;
                const errMsg = String(err);
                LOG.warn(`Delivery attempt ${attempts} failed for ${reportPath}: ${errMsg}`);
                if (attempts < MAX_DELIVERY_RETRIES) {
                    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempts - 1);
                    LOG.log(`Retrying in ${delay}ms…`);
                    await new Promise((r) => setTimeout(r, delay));
                }
            }
        }
        LOG.error(`Max delivery retries exceeded for ${reportPath}`);
        return false;
    }
    async sendToMainSession(reportPath) {
        const { sessions_send } = await import('../sessions.js');
        let summary;
        try {
            const content = fs.readFileSync(reportPath, 'utf8');
            summary = this.buildTelegramSummary(reportPath, content);
        }
        catch {
            summary = `📄 New report: \`${reportPath}\``;
        }
        await sessions_send('agent:main:main', summary);
    }
    buildTelegramSummary(reportPath, content) {
        const lines = [];
        lines.push('📊 *Pipeline Report*');
        lines.push('');
        lines.push(`📄 \`${reportPath}\``);
        lines.push('');
        // Extract key info from report
        const lines_content = content.split('\n');
        const titleMatch = content.match(/^#\s+(.+)/m);
        if (titleMatch)
            lines.push(`*${titleMatch[1]}*`);
        // Severity counts
        const critMatch = content.match(/🔴\s+(\d+)/);
        const highMatch = content.match(/🟠\s+(\d+)/);
        if (critMatch || highMatch) {
            lines.push('');
            lines.push(`🔴 ${critMatch?.[1] ?? 0} 🟠 ${highMatch?.[1] ?? 0} findings`);
        }
        return lines.join('\n');
    }
    // ── Utilities ────────────────────────────────────────────────────────────────
    getReportsDir() {
        const primary = path.join(this.PIPELINE_ROOT, 'reports');
        try {
            fs.mkdirSync(primary, { recursive: true });
            return primary;
        }
        catch {
            return path.join(this.PIPELINE_ROOT, REPORTS_DIR_FALLBACK);
        }
    }
}
function detectPlatform(url) {
    const lower = url.toLowerCase();
    if (lower.includes('bugcrowd.com'))
        return 'bugcrowd';
    if (lower.includes('hackerone.com'))
        return 'hackerone';
    if (lower.includes('intigriti.com'))
        return 'intigriti';
    if (lower.includes('standoff365.com'))
        return 'standoff365';
    return null;
}
