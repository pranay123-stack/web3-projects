import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import analyzeRoutes from './routes/analyze';
import healthRoutes from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Global rate limiter
app.use(apiRateLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Solana Token Risk Analyzer API',
    version: '1.0.0',
    description: 'Real-time risk scoring for Solana tokens',
    endpoints: {
      analyze: {
        single: 'GET /api/analyze/:tokenAddress',
        batch: 'POST /api/analyze/batch',
        quick: 'GET /api/analyze/:tokenAddress/quick',
        holders: 'GET /api/analyze/:tokenAddress/holders',
      },
      health: {
        status: 'GET /health',
        ready: 'GET /health/ready',
        live: 'GET /health/live',
      },
    },
    documentation: 'https://github.com/pranay123-stack/solana-token-risk-analyzer',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Solana Token Risk Analyzer API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 RPC: ${process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
