import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Auditor } from '../services/auditor';
import { AuditRequestSchema, MonitorRequestSchema } from '../types';
import { DatabaseService } from '../db/database';
import logger from '../utils/logger';

export function createApiServer(
  auditor: Auditor,
  db: DatabaseService,
  reportsDir: string
) {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.debug(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Solana Smart Contract Auditor API',
      version: '1.0.0',
      description: 'Automated security auditing for Solana programs',
      endpoints: {
        audit: {
          full: 'POST /api/audit',
          quick: 'GET /api/audit/:programId/quick',
          result: 'GET /api/audit/:programId',
        },
        reports: {
          generate: 'POST /api/reports/:programId',
          list: 'GET /api/reports',
        },
        monitor: {
          add: 'POST /api/monitor',
          list: 'GET /api/monitor',
          remove: 'DELETE /api/monitor/:programId',
        },
        health: 'GET /health',
        stats: 'GET /api/stats',
      },
    });
  });

  // Full audit
  app.post('/api/audit', async (req, res) => {
    try {
      const validation = AuditRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.message,
        });
      }

      const { programId, programName, fullAnalysis } = validation.data;

      // Check if program exists
      const exists = await auditor.programExists(programId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: 'Program not found or not executable',
        });
      }

      logger.info(`Starting audit for ${programId}`);

      const result = await auditor.audit(programId, programName, {
        fullAnalysis,
        generateReport: true,
        reportFormat: 'markdown',
      });

      // Save to database
      db.saveAudit(result);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Audit error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Audit failed',
      });
    }
  });

  // Quick check
  app.get('/api/audit/:programId/quick', async (req, res) => {
    try {
      const { programId } = req.params;

      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(programId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid program address',
        });
      }

      const exists = await auditor.programExists(programId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
        });
      }

      const result = await auditor.quickCheck(programId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Quick check error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Quick check failed',
      });
    }
  });

  // Get audit result
  app.get('/api/audit/:programId', async (req, res) => {
    try {
      const { programId } = req.params;

      const audit = db.getLatestAudit(programId);
      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'No audit found for this program',
        });
      }

      res.json({
        success: true,
        data: audit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Generate report
  app.post('/api/reports/:programId', async (req, res) => {
    try {
      const { programId } = req.params;
      const { format = 'markdown' } = req.body;

      const audit = db.getLatestAudit(programId);
      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'No audit found. Run an audit first.',
        });
      }

      const reportPath = await auditor.generateReport(audit, {
        format: format as 'json' | 'markdown',
        includeRawData: false,
        includeBytecodeAnalysis: false,
      });

      res.json({
        success: true,
        data: {
          reportPath,
          format,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // List recent audits
  app.get('/api/audits', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const audits = db.getRecentAudits(limit);

      res.json({
        success: true,
        data: audits,
        count: audits.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Add program to monitoring
  app.post('/api/monitor', async (req, res) => {
    try {
      const validation = MonitorRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.message,
        });
      }

      const { programId, name, alertOnUpgrade, webhookUrl } = validation.data;

      db.addMonitoredProgram(programId, name, alertOnUpgrade, webhookUrl);

      res.json({
        success: true,
        message: `Program ${programId} added to monitoring`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // List monitored programs
  app.get('/api/monitor', async (req, res) => {
    try {
      const programs = db.getMonitoredPrograms();

      res.json({
        success: true,
        data: programs,
        count: programs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Remove from monitoring
  app.delete('/api/monitor/:programId', async (req, res) => {
    try {
      const { programId } = req.params;
      db.removeMonitoredProgram(programId);

      res.json({
        success: true,
        message: `Program ${programId} removed from monitoring`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Statistics
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = db.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Health check
  app.get('/health', async (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  });

  return app;
}

export default createApiServer;
