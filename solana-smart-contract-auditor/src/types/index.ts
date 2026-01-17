import { z } from 'zod';

// Audit Result Types
export interface AuditResult {
  programId: string;
  programName: string;
  timestamp: string;
  overallScore: number; // 0-100, higher = safer
  riskLevel: RiskLevel;
  summary: AuditSummary;
  vulnerabilities: Vulnerability[];
  securityChecks: SecurityCheck[];
  programInfo: ProgramInfo;
  recommendations: string[];
  auditDuration: number; // milliseconds
}

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  informational: number;
}

// Vulnerability Types
export interface Vulnerability {
  id: string;
  name: string;
  severity: VulnerabilitySeverity;
  category: VulnerabilityCategory;
  description: string;
  impact: string;
  location?: CodeLocation;
  recommendation: string;
  references: string[];
  cweId?: string;
  confidence: number; // 0-1
}

export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type VulnerabilityCategory =
  | 'ACCESS_CONTROL'
  | 'ARITHMETIC'
  | 'REENTRANCY'
  | 'ACCOUNT_VALIDATION'
  | 'SIGNER_AUTHORIZATION'
  | 'PDA_VALIDATION'
  | 'OWNERSHIP'
  | 'INITIALIZATION'
  | 'UPGRADE_RISK'
  | 'DATA_VALIDATION'
  | 'CROSS_PROGRAM'
  | 'DENIAL_OF_SERVICE'
  | 'LOGIC_ERROR'
  | 'CONFIGURATION'
  | 'OTHER';

export interface CodeLocation {
  instruction?: string;
  offset?: number;
  context?: string;
}

// Security Check Types
export interface SecurityCheck {
  id: string;
  name: string;
  category: string;
  status: CheckStatus;
  severity: VulnerabilitySeverity;
  description: string;
  details?: string;
}

export type CheckStatus = 'PASSED' | 'WARNING' | 'FAILED' | 'SKIPPED' | 'NOT_APPLICABLE';

// Program Information
export interface ProgramInfo {
  programId: string;
  owner: string;
  executable: boolean;
  lamports: number;
  dataLength: number;
  isUpgradeable: boolean;
  upgradeAuthority?: string | null;
  lastDeploySlot?: number;
  programDataAccount?: string;
  idlAvailable: boolean;
  verified: boolean;
  deployerHistory?: DeployerInfo;
}

export interface DeployerInfo {
  address: string;
  walletAge: number;
  programsDeployed: number;
  reputation: 'UNKNOWN' | 'NEW' | 'ESTABLISHED' | 'TRUSTED';
}

// Bytecode Analysis Types
export interface BytecodeAnalysis {
  programId: string;
  size: number;
  hash: string;
  instructions: InstructionInfo[];
  crossProgramCalls: CrossProgramCall[];
  accountsUsed: AccountUsage[];
  syscalls: string[];
  patterns: DetectedPattern[];
}

export interface InstructionInfo {
  index: number;
  name: string;
  discriminator?: string;
  accountsRequired: number;
  hasSignerCheck: boolean;
  hasOwnerCheck: boolean;
  modifiesState: boolean;
}

export interface CrossProgramCall {
  targetProgram: string;
  instruction: string;
  riskLevel: RiskLevel;
  notes: string;
}

export interface AccountUsage {
  index: number;
  isSigner: boolean;
  isWritable: boolean;
  isOptional: boolean;
  validationLevel: 'NONE' | 'BASIC' | 'STRICT';
}

export interface DetectedPattern {
  name: string;
  type: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  description: string;
  occurrences: number;
}

// Monitoring Types
export interface MonitoredProgram {
  programId: string;
  name?: string;
  addedAt: string;
  lastAudit?: string;
  lastSlot?: number;
  alertOnUpgrade: boolean;
  webhookUrl?: string;
}

export interface ProgramUpgradeEvent {
  programId: string;
  previousSlot: number;
  newSlot: number;
  timestamp: string;
  upgradeAuthority: string;
}

// Database Types
export interface AuditRecord {
  id: number;
  programId: string;
  programName: string;
  overallScore: number;
  riskLevel: string;
  vulnerabilities: string; // JSON
  summary: string; // JSON
  reportPath?: string;
  createdAt: string;
}

export interface MonitorRecord {
  id: number;
  programId: string;
  name?: string;
  lastSlot: number;
  lastAudit?: string;
  alertOnUpgrade: number;
  webhookUrl?: string;
  createdAt: string;
}

// API Types
export const AuditRequestSchema = z.object({
  programId: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address'),
  programName: z.string().optional(),
  fullAnalysis: z.boolean().optional().default(true),
  includeDecompilation: z.boolean().optional().default(false),
});

export const MonitorRequestSchema = z.object({
  programId: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  name: z.string().optional(),
  alertOnUpgrade: z.boolean().optional().default(true),
  webhookUrl: z.string().url().optional(),
});

// Known Vulnerability Patterns
export interface VulnerabilityPattern {
  id: string;
  name: string;
  category: VulnerabilityCategory;
  severity: VulnerabilitySeverity;
  description: string;
  pattern: RegExp | ((data: Buffer) => boolean);
  recommendation: string;
  cweId?: string;
  references: string[];
}

// Report Types
export interface ReportOptions {
  format: 'json' | 'markdown' | 'html';
  includeRawData: boolean;
  includeBytecodeAnalysis: boolean;
  outputPath?: string;
}

// Configuration
export interface AuditorConfig {
  solanaRpcUrl: string;
  heliusApiKey?: string;
  databasePath: string;
  reportsDir: string;
  enableMonitoring: boolean;
  monitorIntervalMs: number;
  severityThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
}
