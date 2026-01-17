import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ScamDetector } from '../detectors/scamDetector';
import { DatabaseService } from '../db/database';
import { CheckTokenSchema, ReportScamSchema, AgentStats } from '../types';
import logger from '../utils/logger';

export function createApiServer(
  scamDetector: ScamDetector,
  db: DatabaseService,
  stats: AgentStats
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
      name: 'Solana Scam Detection Agent API',
      version: '1.0.0',
      description: 'Real-time scam detection for Solana tokens',
      endpoints: {
        check: 'GET /api/check/:tokenAddress',
        report: 'POST /api/report',
        recent: 'GET /api/recent',
        stats: 'GET /api/stats',
        health: 'GET /health',
      },
    });
  });

  // Check token for scams
  app.get('/api/check/:tokenAddress', async (req, res) => {
    try {
      const { tokenAddress } = req.params;

      const validation = CheckTokenSchema.safeParse({ tokenAddress });
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Solana address format',
        });
      }

      // Check cache first
      const cached = db.getDetection(tokenAddress);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Perform detection
      const result = await scamDetector.detectScam(tokenAddress);

      // Save to database
      db.saveDetection(result);

      // Update stats
      stats.tokensAnalyzed++;
      if (result.isScam) stats.scamsDetected++;

      res.json({
        success: true,
        data: result,
        cached: false,
      });
    } catch (error: any) {
      logger.error('Error checking token:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // Report a scam
  app.post('/api/report', async (req, res) => {
    try {
      const validation = ReportScamSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.message,
        });
      }

      const { tokenAddress, scamType, description, evidence } = validation.data;

      db.saveReport(tokenAddress, scamType, description, evidence);

      res.json({
        success: true,
        message: 'Report submitted successfully',
      });
    } catch (error: any) {
      logger.error('Error submitting report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // Get recent detections
  app.get('/api/recent', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const detections = db.getRecentDetections(limit);

      res.json({
        success: true,
        data: detections,
        count: detections.length,
      });
    } catch (error: any) {
      logger.error('Error getting recent detections:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  // Get scams only
  app.get('/api/scams', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const detections = db.getRecentDetections(limit);
      const scams = detections.filter((d) => d.isScam);

      res.json({
        success: true,
        data: scams,
        count: scams.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Get agent statistics
  app.get('/api/stats', (req, res) => {
    const dbStats = db.getStats();
    const uptime = Math.floor((Date.now() - new Date(stats.startedAt).getTime()) / 1000);

    res.json({
      success: true,
      data: {
        ...stats,
        ...dbStats,
        uptime,
        uptimeFormatted: formatUptime(uptime),
      },
    });
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - new Date(stats.startedAt).getTime()) / 1000),
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default createApiServer;
