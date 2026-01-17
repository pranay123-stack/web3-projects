import { Router, Request, Response } from 'express';
import { Connection } from '@solana/web3.js';
import logger from '../utils/logger';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    solanaRpc: {
      status: 'connected' | 'disconnected';
      latency?: number;
      slot?: number;
    };
    cache: {
      status: 'active';
      size: number;
    };
  };
}

const startTime = Date.now();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  );

  let solanaStatus: HealthStatus['services']['solanaRpc'] = {
    status: 'disconnected',
  };

  try {
    const start = Date.now();
    const slot = await connection.getSlot();
    const latency = Date.now() - start;

    solanaStatus = {
      status: 'connected',
      latency,
      slot,
    };
  } catch (error) {
    logger.error('Health check: Solana RPC connection failed', error);
  }

  const health: HealthStatus = {
    status: solanaStatus.status === 'connected' ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    services: {
      solanaRpc: solanaStatus,
      cache: {
        status: 'active',
        size: 0, // Would get from cache service
      },
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /health/ready
 * Readiness probe
 */
router.get('/ready', async (req: Request, res: Response) => {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  );

  try {
    await connection.getSlot();
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

/**
 * GET /health/live
 * Liveness probe
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ live: true });
});

export default router;
