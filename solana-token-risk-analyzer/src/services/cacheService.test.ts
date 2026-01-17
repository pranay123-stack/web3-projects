import { CacheService } from './cacheService';
import { TokenRiskScore } from '../types';

describe('CacheService', () => {
  let cacheService: CacheService;

  const mockRiskScore: TokenRiskScore = {
    tokenAddress: 'TestToken111111111111111111111111111111111',
    overallRisk: 'MEDIUM',
    riskScore: 45,
    timestamp: new Date().toISOString(),
    analysis: {
      holderConcentration: {
        score: 40,
        riskLevel: 'MEDIUM',
        totalHolders: 100,
        top10HoldersPercentage: 35,
        top1HolderPercentage: 10,
        details: 'Test details',
      },
      liquidityAnalysis: {
        score: 50,
        riskLevel: 'MEDIUM',
        totalLiquidityUSD: 50000,
        liquidityLocked: false,
        liquidityPools: [],
        details: 'Test liquidity',
      },
      deployerHistory: {
        score: 30,
        riskLevel: 'LOW',
        deployerAddress: 'Deployer1111111111111111111111111111111111',
        walletAge: 90,
        totalTokensDeployed: 2,
        rugPullHistory: 0,
        successfulProjects: 1,
        details: 'Test deployer',
      },
      tokenMetadata: {
        score: 20,
        riskLevel: 'LOW',
        name: 'Test Token',
        symbol: 'TEST',
        hasValidMetadata: true,
        hasSocialLinks: true,
        hasWebsite: true,
        isMintable: false,
        isFreezable: false,
        details: 'Test metadata',
      },
      contractSecurity: {
        score: 25,
        riskLevel: 'LOW',
        mintAuthorityRevoked: true,
        freezeAuthorityRevoked: true,
        hasUpdateAuthority: false,
        supplyConcentration: 10,
        details: 'Test security',
      },
    },
    recommendations: ['Test recommendation'],
  };

  beforeEach(() => {
    cacheService = new CacheService(1); // 1 second TTL for testing
  });

  describe('get and set', () => {
    it('should cache and retrieve data', () => {
      cacheService.set('token1', mockRiskScore);
      const result = cacheService.get('token1');
      expect(result).toEqual(mockRiskScore);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should expire data after TTL', async () => {
      cacheService.set('token1', mockRiskScore);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = cacheService.get('token1');
      expect(result).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should remove cached data', () => {
      cacheService.set('token1', mockRiskScore);
      cacheService.invalidate('token1');
      const result = cacheService.get('token1');
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cached data', () => {
      cacheService.set('token1', mockRiskScore);
      cacheService.set('token2', mockRiskScore);
      cacheService.clear();

      expect(cacheService.get('token1')).toBeNull();
      expect(cacheService.get('token2')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct cache statistics', () => {
      cacheService.set('token1', mockRiskScore);
      cacheService.set('token2', mockRiskScore);

      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
      expect(stats.oldestEntry).not.toBeNull();
    });

    it('should return null for oldest entry when cache is empty', () => {
      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.oldestEntry).toBeNull();
    });
  });
});
