// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables
process.env.PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
process.env.RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
process.env.SIMULATION_MODE = 'true';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Mock console.log to keep test output clean
const originalLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
});

// Global test timeout
jest.setTimeout(30000);
