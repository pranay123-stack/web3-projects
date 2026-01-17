import {
  scoreToRiskLevel,
  calculateOverallScore,
  severityToNumber,
  sortBySeverity,
  truncateAddress,
  formatBytes,
  isValidSolanaAddress,
  formatDuration,
  getProgramName,
} from './helpers';
import { VulnerabilitySeverity, AuditSummary } from '../types';

describe('helpers', () => {
  describe('scoreToRiskLevel', () => {
    it('should return SAFE for scores >= 90', () => {
      expect(scoreToRiskLevel(90)).toBe('SAFE');
      expect(scoreToRiskLevel(100)).toBe('SAFE');
    });

    it('should return LOW for scores 70-89', () => {
      expect(scoreToRiskLevel(70)).toBe('LOW');
      expect(scoreToRiskLevel(89)).toBe('LOW');
    });

    it('should return MEDIUM for scores 50-69', () => {
      expect(scoreToRiskLevel(50)).toBe('MEDIUM');
      expect(scoreToRiskLevel(69)).toBe('MEDIUM');
    });

    it('should return HIGH for scores 30-49', () => {
      expect(scoreToRiskLevel(30)).toBe('HIGH');
      expect(scoreToRiskLevel(49)).toBe('HIGH');
    });

    it('should return CRITICAL for scores < 30', () => {
      expect(scoreToRiskLevel(29)).toBe('CRITICAL');
      expect(scoreToRiskLevel(0)).toBe('CRITICAL');
    });
  });

  describe('calculateOverallScore', () => {
    it('should return 100 for no issues', () => {
      const summary: AuditSummary = {
        totalChecks: 10,
        passed: 10,
        warnings: 0,
        failed: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        informational: 0,
      };
      expect(calculateOverallScore(summary)).toBe(100);
    });

    it('should deduct points for critical issues', () => {
      const summary: AuditSummary = {
        totalChecks: 10,
        passed: 8,
        warnings: 1,
        failed: 1,
        criticalIssues: 2,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        informational: 0,
      };
      expect(calculateOverallScore(summary)).toBe(50); // 100 - (2 * 25)
    });

    it('should not go below 0', () => {
      const summary: AuditSummary = {
        totalChecks: 10,
        passed: 0,
        warnings: 0,
        failed: 10,
        criticalIssues: 5,
        highIssues: 5,
        mediumIssues: 5,
        lowIssues: 5,
        informational: 0,
      };
      expect(calculateOverallScore(summary)).toBe(0);
    });
  });

  describe('severityToNumber', () => {
    it('should return correct numeric values', () => {
      expect(severityToNumber('CRITICAL')).toBe(5);
      expect(severityToNumber('HIGH')).toBe(4);
      expect(severityToNumber('MEDIUM')).toBe(3);
      expect(severityToNumber('LOW')).toBe(2);
      expect(severityToNumber('INFORMATIONAL')).toBe(1);
    });
  });

  describe('sortBySeverity', () => {
    it('should sort by severity descending', () => {
      const items = [
        { severity: 'LOW' as VulnerabilitySeverity },
        { severity: 'CRITICAL' as VulnerabilitySeverity },
        { severity: 'MEDIUM' as VulnerabilitySeverity },
      ];

      const sorted = sortBySeverity(items);
      expect(sorted[0].severity).toBe('CRITICAL');
      expect(sorted[1].severity).toBe('MEDIUM');
      expect(sorted[2].severity).toBe('LOW');
    });
  });

  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      expect(truncateAddress(address)).toBe('Tokenk...Q5DA');
    });

    it('should not truncate short strings', () => {
      expect(truncateAddress('short')).toBe('short');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1500)).toBe('1.46 KB');
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should validate correct addresses', () => {
      expect(isValidSolanaAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(true);
      expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('invalid')).toBe(false);
      expect(isValidSolanaAddress('0x1234')).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5.00s');
    });

    it('should format minutes', () => {
      expect(formatDuration(120000)).toBe('2.00m');
    });
  });

  describe('getProgramName', () => {
    it('should return known program names', () => {
      expect(getProgramName('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe('Token Program');
      expect(getProgramName('11111111111111111111111111111111')).toBe('System Program');
    });

    it('should return Unknown for unknown programs', () => {
      expect(getProgramName('RandomAddress123456789012345678901234')).toBe('Unknown Program');
    });
  });
});
