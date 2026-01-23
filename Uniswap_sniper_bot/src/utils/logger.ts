import winston from 'winston';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let coloredLevel: string;
  switch (level) {
    case 'error':
      coloredLevel = chalk.red.bold(level.toUpperCase());
      break;
    case 'warn':
      coloredLevel = chalk.yellow.bold(level.toUpperCase());
      break;
    case 'info':
      coloredLevel = chalk.blue.bold(level.toUpperCase());
      break;
    case 'debug':
      coloredLevel = chalk.gray(level.toUpperCase());
      break;
    default:
      coloredLevel = level.toUpperCase();
  }

  const ts = chalk.gray(timestamp);
  const meta = Object.keys(metadata).length ? chalk.cyan(JSON.stringify(metadata, null, 2)) : '';

  return `${ts} [${coloredLevel}] ${message} ${meta}`;
});

const fileFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `${timestamp} [${level.toUpperCase()}] ${message} ${meta}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
        customFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        fileFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        fileFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'snipes.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        fileFormat
      )
    })
  ]
});

// Specialized loggers for different components
export const createComponentLogger = (component: string) => {
  return {
    info: (message: string, meta?: object) => {
      logger.info(`[${chalk.green(component)}] ${message}`, meta);
    },
    warn: (message: string, meta?: object) => {
      logger.warn(`[${chalk.yellow(component)}] ${message}`, meta);
    },
    error: (message: string, meta?: object) => {
      logger.error(`[${chalk.red(component)}] ${message}`, meta);
    },
    debug: (message: string, meta?: object) => {
      logger.debug(`[${chalk.gray(component)}] ${message}`, meta);
    },
    snipe: (message: string, meta?: object) => {
      logger.info(`[${chalk.magenta('SNIPE')}][${component}] ${message}`, meta);
    },
    success: (message: string, meta?: object) => {
      logger.info(`[${chalk.green('SUCCESS')}][${component}] ${message}`, meta);
    },
    pool: (message: string, meta?: object) => {
      logger.info(`[${chalk.cyan('POOL')}][${component}] ${message}`, meta);
    }
  };
};

export default logger;
