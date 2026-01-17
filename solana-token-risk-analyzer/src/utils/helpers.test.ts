import {
  calculateRiskLevel,
  calculateWeightedRiskScore,
  formatNumber,
  calculatePercentage,
  truncateAddress,
  isValidSolanaAddress,
  generateRecommendations,
} from './helpers';

describe('helpers', () => {
  describe('calculateRiskLevel', () => {
    it('should return LOW for scores 0-25', () => {
      expect(calculateRiskLevel(0)).toBe('LOW');
      expect(calculateRiskLevel(15)).toBe('LOW');
      expect(calculateRiskLevel(25)).toBe('LOW');
    });

    it('should return MEDIUM for scores 26-50', () => {
      expect(calculateRiskLevel(26)).toBe('MEDIUM');
      expect(calculateRiskLevel(35)).toBe('MEDIUM');
      expect(calculateRiskLevel(50)).toBe('MEDIUM');
    });

    it('should return HIGH for scores 51-75', () => {
      expect(calculateRiskLevel(51)).toBe('HIGH');
      expect(calculateRiskLevel(65)).toBe('HIGH');
      expect(calculateRiskLevel(75)).toBe('HIGH');
    });

    it('should return CRITICAL for scores 76-100', () => {
      expect(calculateRiskLevel(76)).toBe('CRITICAL');
      expect(calculateRiskLevel(90)).toBe('CRITICAL');
      expect(calculateRiskLevel(100)).toBe('CRITICAL');
    });
  });

  describe('calculateWeightedRiskScore', () => {
    it('should calculate correct weighted average', () => {
      const scores = [
        { score: 50, weight: 1 },
        { score: 100, weight: 1 },
      ];
      expect(calculateWeightedRiskScore(scores)).toBe(75);
    });

    it('should handle different weights correctly', () => {
      const scores = [
        { score: 20, weight: 3 },
        { score: 80, weight: 1 },
      ];
      // (20*3 + 80*1) / 4 = 140/4 = 35
      expect(calculateWeightedRiskScore(scores)).toBe(35);
    });

    it('should round to nearest integer', () => {
      const scores = [
        { score: 33, weight: 1 },
        { score: 66, weight: 1 },
      ];
      expect(calculateWeightedRiskScore(scores)).toBe(50);
    });
  });

  describe('formatNumber', () => {
    it('should format billions correctly', () => {
      expect(formatNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions correctly', () => {
      expect(formatNumber(2500000)).toBe('2.50M');
    });

    it('should format thousands correctly', () => {
      expect(formatNumber(5500)).toBe('5.50K');
    });

    it('should format small numbers correctly', () => {
      expect(formatNumber(500)).toBe('500.00');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
    });

    it('should return 0 when total is 0', () => {
      expect(calculatePercentage(25, 0)).toBe(0);
    });
  });

  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'So11111111111111111111111111111111111111112';
      expect(truncateAddress(address)).toBe('So1111...1112');
    });

    it('should not truncate short addresses', () => {
      const address = 'short';
      expect(truncateAddress(address)).toBe('short');
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
      expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidSolanaAddress('invalid')).toBe(false);
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('0x1234567890123456789012345678901234567890')).toBe(false);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate holder concentration warning', () => {
      const recs = generateRecommendations(60, 20, 20, 20);
      expect(recs.some(r => r.includes('holder concentration'))).toBe(true);
    });

    it('should generate liquidity warning', () => {
      const recs = generateRecommendations(20, 60, 20, 20);
      expect(recs.some(r => r.includes('liquidity'))).toBe(true);
    });

    it('should generate deployer warning', () => {
      const recs = generateRecommendations(20, 20, 60, 20);
      expect(recs.some(r => r.includes('Deployer'))).toBe(true);
    });

    it('should generate security warning', () => {
      const recs = generateRecommendations(20, 20, 20, 60);
      expect(recs.some(r => r.includes('authorities'))).toBe(true);
    });

    it('should generate safe message when all scores are low', () => {
      const recs = generateRecommendations(20, 20, 20, 20);
      expect(recs.some(r => r.includes('relatively safe'))).toBe(true);
    });
  });
});
