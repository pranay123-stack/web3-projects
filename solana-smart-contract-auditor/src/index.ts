import dotenv from 'dotenv';
import { Auditor } from './services/auditor';
import { DatabaseService } from './db/database';
import { ProgramMonitor } from './monitoring/monitor';
import { createApiServer } from './api/server';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  const config = {
    solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    databasePath: process.env.DATABASE_PATH || './data/audits.db',
    reportsDir: process.env.REPORTS_DIR || './reports',
    port: parseInt(process.env.PORT || '3002', 10),
    enableMonitoring: process.env.ENABLE_CONTINUOUS_MONITORING !== 'false',
    monitorIntervalMs: parseInt(process.env.MONITOR_INTERVAL_MS || '60000', 10),
  };

  logger.info('Starting Solana Smart Contract Auditor...');
  logger.info(`Configuration:`);
  logger.info(`  - RPC: ${config.solanaRpcUrl}`);
  logger.info(`  - Database: ${config.databasePath}`);
  logger.info(`  - Reports: ${config.reportsDir}`);
  logger.info(`  - Monitoring: ${config.enableMonitoring ? 'enabled' : 'disabled'}`);

  // Initialize services
  const db = new DatabaseService(config.databasePath);
  const auditor = new Auditor(config.solanaRpcUrl, config.reportsDir);

  // Start API server
  const app = createApiServer(auditor, db, config.reportsDir);
  app.listen(config.port, () => {
    logger.info(`API server running on port ${config.port}`);
  });

  // Start monitoring if enabled
  if (config.enableMonitoring) {
    const monitor = new ProgramMonitor(
      config.solanaRpcUrl,
      auditor,
      db,
      config.monitorIntervalMs
    );

    monitor.onUpgrade((event) => {
      logger.info(`Program upgrade detected: ${event.programId}`);
    });

    // Run monitoring in background
    monitor.start().catch((error) => {
      logger.error('Monitor error:', error);
    });
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    db.close();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down...');
    db.close();
    process.exit(0);
  });

  logger.info('Solana Smart Contract Auditor started successfully');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

export { Auditor } from './services/auditor';
export { DatabaseService } from './db/database';
export { ProgramMonitor } from './monitoring/monitor';
