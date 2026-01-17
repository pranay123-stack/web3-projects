import Database from 'better-sqlite3';
import path from 'path';
import { DetectionRecord, AlertRecord, ScamDetectionResult, Alert } from '../types';
import logger from '../utils/logger';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    const fullPath = path.resolve(dbPath);
    logger.info(`Initializing database at: ${fullPath}`);

    this.db = new Database(fullPath);
    this.db.pragma('journal_mode = WAL');
    this.initialize();
  }

  private initialize(): void {
    // Create detections table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        is_scam INTEGER NOT NULL,
        confidence REAL NOT NULL,
        scam_type TEXT,
        risk_score INTEGER NOT NULL,
        indicators TEXT NOT NULL,
        metadata TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(token_address)
      )
    `);

    // Create alerts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        token_address TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        sent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reports table (user submitted)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        scam_type TEXT NOT NULL,
        description TEXT,
        evidence TEXT,
        verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_detections_token ON detections(token_address);
      CREATE INDEX IF NOT EXISTS idx_detections_scam ON detections(is_scam);
      CREATE INDEX IF NOT EXISTS idx_alerts_token ON alerts(token_address);
      CREATE INDEX IF NOT EXISTS idx_alerts_sent ON alerts(sent);
    `);

    logger.info('Database initialized successfully');
  }

  /**
   * Save detection result
   */
  saveDetection(detection: ScamDetectionResult): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO detections
      (token_address, is_scam, confidence, scam_type, risk_score, indicators, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      detection.tokenAddress,
      detection.isScam ? 1 : 0,
      detection.confidence,
      detection.scamType,
      detection.riskScore,
      JSON.stringify(detection.indicators),
      JSON.stringify(detection.metadata)
    );

    logger.debug(`Saved detection for ${detection.tokenAddress}`);
  }

  /**
   * Get detection by token address
   */
  getDetection(tokenAddress: string): ScamDetectionResult | null {
    const stmt = this.db.prepare(`
      SELECT * FROM detections WHERE token_address = ?
    `);

    const row = stmt.get(tokenAddress) as DetectionRecord | undefined;

    if (!row) return null;

    return {
      tokenAddress: row.tokenAddress,
      timestamp: row.createdAt,
      isScam: row.isScam === 1,
      confidence: row.confidence,
      scamType: row.scamType as any,
      indicators: JSON.parse(row.indicators),
      riskScore: row.riskScore,
      recommendation: '',
      metadata: JSON.parse(row.metadata),
    };
  }

  /**
   * Save alert
   */
  saveAlert(alert: Alert): void {
    const stmt = this.db.prepare(`
      INSERT INTO alerts (alert_id, type, severity, token_address, title, message, sent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      alert.id,
      alert.type,
      alert.severity,
      alert.tokenAddress,
      alert.title,
      alert.message,
      alert.sent ? 1 : 0
    );

    logger.debug(`Saved alert ${alert.id}`);
  }

  /**
   * Mark alert as sent
   */
  markAlertSent(alertId: string): void {
    const stmt = this.db.prepare(`
      UPDATE alerts SET sent = 1 WHERE alert_id = ?
    `);
    stmt.run(alertId);
  }

  /**
   * Get recent detections
   */
  getRecentDetections(limit: number = 100): ScamDetectionResult[] {
    const stmt = this.db.prepare(`
      SELECT * FROM detections ORDER BY created_at DESC LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];

    return rows.map((row) => ({
      tokenAddress: row.token_address,
      timestamp: row.created_at,
      isScam: row.is_scam === 1,
      confidence: row.confidence,
      scamType: row.scam_type,
      indicators: JSON.parse(row.indicators),
      riskScore: row.risk_score,
      recommendation: '',
      metadata: JSON.parse(row.metadata),
    }));
  }

  /**
   * Get scam statistics
   */
  getStats(): {
    totalDetections: number;
    scamsDetected: number;
    alertsSent: number;
    reportsReceived: number;
  } {
    const detections = this.db.prepare('SELECT COUNT(*) as count FROM detections').get() as any;
    const scams = this.db.prepare('SELECT COUNT(*) as count FROM detections WHERE is_scam = 1').get() as any;
    const alerts = this.db.prepare('SELECT COUNT(*) as count FROM alerts WHERE sent = 1').get() as any;
    const reports = this.db.prepare('SELECT COUNT(*) as count FROM reports').get() as any;

    return {
      totalDetections: detections?.count || 0,
      scamsDetected: scams?.count || 0,
      alertsSent: alerts?.count || 0,
      reportsReceived: reports?.count || 0,
    };
  }

  /**
   * Save user report
   */
  saveReport(
    tokenAddress: string,
    scamType: string,
    description?: string,
    evidence?: string[]
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO reports (token_address, scam_type, description, evidence)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(tokenAddress, scamType, description || null, JSON.stringify(evidence || []));
  }

  /**
   * Get known scam addresses for ML training
   */
  getKnownScams(): string[] {
    const stmt = this.db.prepare(`
      SELECT token_address FROM detections WHERE is_scam = 1 AND confidence > 0.8
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => row.token_address);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}

export default DatabaseService;
