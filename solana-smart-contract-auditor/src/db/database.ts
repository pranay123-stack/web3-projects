import Database from 'better-sqlite3';
import path from 'path';
import { AuditResult, AuditRecord, MonitoredProgram, MonitorRecord } from '../types';
import logger from '../utils/logger';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    const fullPath = path.resolve(dbPath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    logger.info(`Initializing database at: ${fullPath}`);
    this.db = new Database(fullPath);
    this.db.pragma('journal_mode = WAL');
    this.initialize();
  }

  private initialize(): void {
    // Create audits table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_id TEXT NOT NULL,
        program_name TEXT,
        overall_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        vulnerabilities TEXT NOT NULL,
        security_checks TEXT NOT NULL,
        summary TEXT NOT NULL,
        program_info TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        audit_duration INTEGER,
        report_path TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create monitored programs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS monitored_programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_id TEXT UNIQUE NOT NULL,
        name TEXT,
        last_slot INTEGER DEFAULT 0,
        last_audit TEXT,
        alert_on_upgrade INTEGER DEFAULT 1,
        webhook_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audits_program ON audits(program_id);
      CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at);
      CREATE INDEX IF NOT EXISTS idx_monitored_program ON monitored_programs(program_id);
    `);

    logger.info('Database initialized successfully');
  }

  /**
   * Save audit result
   */
  saveAudit(audit: AuditResult, reportPath?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO audits
      (program_id, program_name, overall_score, risk_level, vulnerabilities,
       security_checks, summary, program_info, recommendations, audit_duration, report_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      audit.programId,
      audit.programName,
      audit.overallScore,
      audit.riskLevel,
      JSON.stringify(audit.vulnerabilities),
      JSON.stringify(audit.securityChecks),
      JSON.stringify(audit.summary),
      JSON.stringify(audit.programInfo),
      JSON.stringify(audit.recommendations),
      audit.auditDuration,
      reportPath || null
    );

    logger.debug(`Saved audit for ${audit.programId}`);
  }

  /**
   * Get latest audit for a program
   */
  getLatestAudit(programId: string): AuditResult | null {
    const stmt = this.db.prepare(`
      SELECT * FROM audits WHERE program_id = ? ORDER BY created_at DESC LIMIT 1
    `);

    const row = stmt.get(programId) as any;
    if (!row) return null;

    return this.rowToAuditResult(row);
  }

  /**
   * Get recent audits
   */
  getRecentAudits(limit: number = 50): AuditResult[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audits ORDER BY created_at DESC LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((row) => this.rowToAuditResult(row));
  }

  /**
   * Convert database row to AuditResult
   */
  private rowToAuditResult(row: any): AuditResult {
    return {
      programId: row.program_id,
      programName: row.program_name,
      timestamp: row.created_at,
      overallScore: row.overall_score,
      riskLevel: row.risk_level,
      vulnerabilities: JSON.parse(row.vulnerabilities),
      securityChecks: JSON.parse(row.security_checks),
      summary: JSON.parse(row.summary),
      programInfo: JSON.parse(row.program_info),
      recommendations: JSON.parse(row.recommendations),
      auditDuration: row.audit_duration,
    };
  }

  /**
   * Add program to monitoring
   */
  addMonitoredProgram(
    programId: string,
    name?: string,
    alertOnUpgrade: boolean = true,
    webhookUrl?: string
  ): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO monitored_programs
      (program_id, name, alert_on_upgrade, webhook_url)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(programId, name || null, alertOnUpgrade ? 1 : 0, webhookUrl || null);
    logger.info(`Added ${programId} to monitoring`);
  }

  /**
   * Get monitored programs
   */
  getMonitoredPrograms(): MonitoredProgram[] {
    const stmt = this.db.prepare(`SELECT * FROM monitored_programs`);
    const rows = stmt.all() as MonitorRecord[];

    return rows.map((row) => ({
      programId: row.programId,
      name: row.name,
      addedAt: row.createdAt,
      lastAudit: row.lastAudit,
      lastSlot: row.lastSlot,
      alertOnUpgrade: row.alertOnUpgrade === 1,
      webhookUrl: row.webhookUrl,
    }));
  }

  /**
   * Update monitored program slot
   */
  updateMonitoredProgramSlot(programId: string, slot: number): void {
    const stmt = this.db.prepare(`
      UPDATE monitored_programs SET last_slot = ? WHERE program_id = ?
    `);
    stmt.run(slot, programId);
  }

  /**
   * Update last audit time
   */
  updateLastAudit(programId: string): void {
    const stmt = this.db.prepare(`
      UPDATE monitored_programs SET last_audit = CURRENT_TIMESTAMP WHERE program_id = ?
    `);
    stmt.run(programId);
  }

  /**
   * Remove program from monitoring
   */
  removeMonitoredProgram(programId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM monitored_programs WHERE program_id = ?
    `);
    stmt.run(programId);
    logger.info(`Removed ${programId} from monitoring`);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAudits: number;
    uniquePrograms: number;
    monitoredPrograms: number;
    criticalFindings: number;
    averageScore: number;
  } {
    const totalAudits = (this.db.prepare('SELECT COUNT(*) as count FROM audits').get() as any)?.count || 0;
    const uniquePrograms = (this.db.prepare('SELECT COUNT(DISTINCT program_id) as count FROM audits').get() as any)?.count || 0;
    const monitoredPrograms = (this.db.prepare('SELECT COUNT(*) as count FROM monitored_programs').get() as any)?.count || 0;
    const avgScore = (this.db.prepare('SELECT AVG(overall_score) as avg FROM audits').get() as any)?.avg || 0;

    // Count critical findings from recent audits
    let criticalFindings = 0;
    const recentAudits = this.getRecentAudits(100);
    for (const audit of recentAudits) {
      criticalFindings += audit.summary.criticalIssues;
    }

    return {
      totalAudits,
      uniquePrograms,
      monitoredPrograms,
      criticalFindings,
      averageScore: Math.round(avgScore),
    };
  }

  /**
   * Close database
   */
  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}

export default DatabaseService;
