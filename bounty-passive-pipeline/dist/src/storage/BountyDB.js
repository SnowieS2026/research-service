import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Logger } from '../Logger.js';
const LOG = new Logger('BountyDB');
export class BountyDB {
    db;
    constructor(dbPath) {
        const resolved = dbPath ?? path.join(process.cwd(), 'logs', 'bounty.db');
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        this.db = new Database(resolved);
        LOG.log(`BountyDB opened: ${resolved}`);
        this.init();
    }
    init() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        platform TEXT NOT NULL,
        programs_found INTEGER NOT NULL DEFAULT 0,
        changes_found INTEGER NOT NULL DEFAULT 0,
        reports_generated INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        program_name TEXT NOT NULL,
        platform TEXT NOT NULL,
        severity TEXT NOT NULL,
        cvss REAL NOT NULL DEFAULT 0,
        report_path TEXT NOT NULL,
        diff_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES runs(id)
      );

      CREATE TABLE IF NOT EXISTS findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        field TEXT NOT NULL,
        old_value TEXT NOT NULL DEFAULT '',
        new_value TEXT NOT NULL DEFAULT '',
        severity_contribution TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (report_id) REFERENCES reports(id)
      );

      CREATE INDEX IF NOT EXISTS idx_reports_run_id ON reports(run_id);
      CREATE INDEX IF NOT EXISTS idx_findings_report_id ON findings(report_id);
    `);
        LOG.log('BountyDB tables initialised');
    }
    insertRun(platform, programsFound, changesFound, reportsGenerated, durationMs) {
        const stmt = this.db.prepare(`
      INSERT INTO runs (timestamp, platform, programs_found, changes_found, reports_generated, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(new Date().toISOString(), platform, programsFound, changesFound, reportsGenerated, durationMs);
        return result.lastInsertRowid;
    }
    insertReport(runId, programName, platform, severity, cvss, reportPath, diffHash) {
        const stmt = this.db.prepare(`
      INSERT INTO reports (run_id, program_name, platform, severity, cvss, report_path, diff_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(runId, programName, platform, severity, cvss, reportPath, diffHash, new Date().toISOString());
        return result.lastInsertRowid;
    }
    insertFinding(reportId, field, oldValue, newValue, severityContribution) {
        const stmt = this.db.prepare(`
      INSERT INTO findings (report_id, field, old_value, new_value, severity_contribution)
      VALUES (?, ?, ?, ?, ?)
    `);
        const result = stmt.run(reportId, field, oldValue, newValue, severityContribution);
        return result.lastInsertRowid;
    }
    insertScanRun(scanId, startedAt, durationMs, targetsScanned, totalFindings, errors) {
        const stmt = this.db.prepare(`
      INSERT INTO runs (timestamp, platform, programs_found, changes_found, reports_generated, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        // We reuse the runs table – platform='scan', programs_found=targetsScanned, changes_found=totalFindings, reports_generated=errors
        const result = stmt.run(startedAt, 'scan', targetsScanned, totalFindings, errors, durationMs);
        return result.lastInsertRowid;
    }
    insertScanFinding(scanRunId, url, findingType, severity, cvss, tool, description, evidence) {
        // We store scan findings in the reports table with diff_hash=url, field=findingType, old_value=evidence
        const stmt = this.db.prepare(`
      INSERT INTO reports (run_id, program_name, platform, severity, cvss, report_path, diff_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(scanRunId, url, findingType, severity, cvss, description, // reuse report_path column for description
        evidence, // reuse diff_hash column for evidence
        new Date().toISOString());
        return result.lastInsertRowid;
    }
    getRuns(limit = 100) {
        return this.db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT ?').all(limit);
    }
    getReportsByRun(runId) {
        return this.db.prepare('SELECT * FROM reports WHERE run_id = ?').all(runId);
    }
    getFindingsByReport(reportId) {
        return this.db.prepare('SELECT * FROM findings WHERE report_id = ?').all(reportId);
    }
    close() {
        this.db.close();
        LOG.log('BountyDB closed');
    }
}
