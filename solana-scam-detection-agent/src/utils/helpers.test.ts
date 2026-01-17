import {
  truncateAddress,
  isValidSolanaAddress,
  hasSuspiciousPattern,
  checkFakeToken,
  stringSimilarity,
  levenshteinDistance,
  confidenceToSeverity,
  scamTypeToReadable,
} from './helpers';

describe('helpers', () => {
  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'So11111111111111111111111111111111111111112';
      expect(truncateAddress(address)).toBe('So1111...1112');
    });

    it('should not truncate short strings', () => {
      expect(truncateAddress('short')).toBe('short');
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
      expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('invalid')).toBe(false);
      expect(isValidSolanaAddress('0x1234567890123456789012345678901234567890')).toBe(false);
    });
  });

  describe('hasSuspiciousPattern', () => {
    it('should detect suspicious patterns', () => {
      expect(hasSuspiciousPattern('ELONMOON')).toBe(true);
      expect(hasSuspiciousPattern('SafeGem')).toBe(true);
      expect(hasSuspiciousPattern('100xToken')).toBe(true);
      expect(hasSuspiciousPattern('DogeShiba')).toBe(true);
    });

    it('should not flag normal names', () => {
      expect(hasSuspiciousPattern('Solana')).toBe(false);
      expect(hasSuspiciousPattern('Jupiter')).toBe(false);
      expect(hasSuspiciousPattern('Raydium')).toBe(false);
    });
  });

  describe('checkFakeToken', () => {
    it('should detect potential fake tokens', () => {
      // Test with symbol very similar to known token (>70% similarity but <100%)
      const result = checkFakeToken('USDC2', 'USDC Clone');
      expect(result.isFake).toBe(true);
      expect(result.impersonating).toBe('USDC');
    });

    it('should not flag legitimate tokens', () => {
      const result = checkFakeToken('MYTOKEN', 'My Token');
      expect(result.isFake).toBe(false);
    });

    it('should not flag exact matches as fake', () => {
      // Exact matches are legitimate, only similar but different should be flagged
      const result = checkFakeToken('BONK', 'Bonk');
      expect(result.isFake).toBe(false);
    });
  });

  describe('levenshteinDistance', () => {
    it('should calculate correct distance', () => {
      expect(levenshteinDistance('cat', 'cat')).toBe(0);
      expect(levenshteinDistance('cat', 'hat')).toBe(1);
      expect(levenshteinDistance('cat', 'cats')).toBe(1);
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });
  });

  describe('stringSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(stringSimilarity('test', 'test')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(stringSimilarity('abc', 'xyz')).toBe(0);
    });

    it('should return correct similarity for similar strings', () => {
      const similarity = stringSimilarity('USDC', 'USDT');
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('confidenceToSeverity', () => {
    it('should return correct severity levels', () => {
      expect(confidenceToSeverity(0.95)).toBe('CRITICAL');
      expect(confidenceToSeverity(0.8)).toBe('DANGER');
      expect(confidenceToSeverity(0.6)).toBe('WARNING');
      expect(confidenceToSeverity(0.3)).toBe('INFO');
    });
  });

  describe('scamTypeToReadable', () => {
    it('should convert scam types to readable strings', () => {
      expect(scamTypeToReadable('RUG_PULL')).toBe('Rug Pull');
      expect(scamTypeToReadable('HONEYPOT')).toBe('Honeypot');
      expect(scamTypeToReadable('FAKE_TOKEN')).toBe('Fake/Clone Token');
      expect(scamTypeToReadable(null)).toBe('N/A');
    });
  });
});
