import { z } from 'zod';

// Scam Detection Types
export interface ScamDetectionResult {
  tokenAddress: string;
  timestamp: string;
  isScam: boolean;
  confidence: number; // 0-1
  scamType: ScamType | null;
  indicators: ScamIndicator[];
  riskScore: number; // 0-100
  recommendation: string;
  metadata: TokenMetadata;
}

export type ScamType =
  | 'RUG_PULL'
  | 'HONEYPOT'
  | 'PUMP_AND_DUMP'
  | 'FAKE_TOKEN'
  | 'LIQUIDITY_DRAIN'
  | 'MINT_EXPLOIT'
  | 'FREEZE_SCAM'
  | 'UNKNOWN';

export interface ScamIndicator {
  name: string;
  detected: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  weight: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  deployer: string;
  deployedAt: number | null;
  hasMetadata: boolean;
}

// Monitoring Events
export interface NewTokenEvent {
  signature: string;
  tokenAddress: string;
  deployer: string;
  timestamp: number;
  slot: number;
}

export interface LiquidityEvent {
  type: 'ADD' | 'REMOVE';
  signature: string;
  tokenAddress: string;
  poolAddress: string;
  amount: number;
  timestamp: number;
}

export interface TransferEvent {
  signature: string;
  tokenAddress: string;
  from: string;
  to: string;
  amount: bigint;
  timestamp: number;
}

// Alert Types
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  tokenAddress: string;
  title: string;
  message: string;
  timestamp: string;
  detection: ScamDetectionResult;
  sent: boolean;
}

export type AlertType = 'SCAM_DETECTED' | 'SUSPICIOUS_ACTIVITY' | 'RUG_IN_PROGRESS' | 'NEW_HIGH_RISK_TOKEN';
export type AlertSeverity = 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';

// ML Model Types
export interface FeatureVector {
  holderConcentration: number;
  deployerAge: number;
  liquidityRatio: number;
  mintAuthorityActive: number;
  freezeAuthorityActive: number;
  transferCount: number;
  uniqueHolders: number;
  namePatternScore: number;
  symbolPatternScore: number;
  metadataQuality: number;
}

export interface ModelPrediction {
  isScam: boolean;
  probability: number;
  features: FeatureVector;
}

// Database Types
export interface DetectionRecord {
  id: number;
  tokenAddress: string;
  isScam: number; // SQLite stores as 0 or 1
  confidence: number;
  scamType: string | null;
  riskScore: number;
  indicators: string; // JSON
  metadata: string; // JSON
  createdAt: string;
}

export interface AlertRecord {
  id: number;
  alertId: string;
  type: string;
  severity: string;
  tokenAddress: string;
  title: string;
  message: string;
  sent: boolean;
  createdAt: string;
}

// Pattern Matching
export interface ScamPattern {
  id: string;
  name: string;
  description: string;
  regex?: RegExp;
  keywords?: string[];
  weight: number;
}

// API Types
export const CheckTokenSchema = z.object({
  tokenAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address'),
});

export const ReportScamSchema = z.object({
  tokenAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  scamType: z.enum(['RUG_PULL', 'HONEYPOT', 'PUMP_AND_DUMP', 'FAKE_TOKEN', 'OTHER']),
  description: z.string().max(1000).optional(),
  evidence: z.array(z.string()).optional(),
});

// Configuration
export interface AgentConfig {
  solanaRpcUrl: string;
  solanaWsUrl: string;
  heliusApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  discordWebhookUrl?: string;
  databasePath: string;
  minScamConfidence: number;
  alertThreshold: number;
  monitorNewTokens: boolean;
  monitorLpEvents: boolean;
  checkIntervalMs: number;
}

// Stats
export interface AgentStats {
  startedAt: string;
  tokensAnalyzed: number;
  scamsDetected: number;
  alertsSent: number;
  uptime: number;
  lastCheck: string | null;
}
