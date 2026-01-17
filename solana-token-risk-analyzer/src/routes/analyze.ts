import { Router, Request, Response } from 'express';
import { SolanaService } from '../services/solanaService';
import { RiskAnalyzer } from '../services/riskAnalyzer';
import { CacheService } from '../services/cacheService';
import {
  TokenAddressSchema,
  AnalyzeRequestSchema,
  BatchAnalyzeRequestSchema,
  APIResponse,
  TokenRiskScore,
} from '../types';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { analysisRateLimiter, batchRateLimiter } from '../middleware/rateLimiter';
import logger from '../utils/logger';

const router = Router();

// Initialize services
const solanaService = new SolanaService(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  process.env.HELIUS_API_KEY
);
const riskAnalyzer = new RiskAnalyzer(solanaService);
const cacheService = new CacheService(300); // 5 minute cache

/**
 * GET /api/analyze/:tokenAddress
 * Analyze a single token's risk profile
 */
router.get(
  '/:tokenAddress',
  analysisRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.params;
    const skipCache = req.query.skipCache === 'true';

    // Validate token address
    const validationResult = TokenAddressSchema.safeParse(tokenAddress);
    if (!validationResult.success) {
      throw new ValidationError('Invalid Solana token address format');
    }

    // Check cache first
    if (!skipCache) {
      const cached = cacheService.get(tokenAddress);
      if (cached) {
        const response: APIResponse<TokenRiskScore & { cached: boolean }> = {
          success: true,
          data: { ...cached, cached: true },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
        return;
      }
    }

    // Perform analysis
    logger.info(`Analyzing token: ${tokenAddress}`);
    const analysis = await riskAnalyzer.analyzeToken(tokenAddress);

    // Cache result
    cacheService.set(tokenAddress, analysis);

    const response: APIResponse<TokenRiskScore & { cached: boolean }> = {
      success: true,
      data: { ...analysis, cached: false },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * POST /api/analyze
 * Analyze a token with additional options
 */
router.post(
  '/',
  analysisRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validationResult = AnalyzeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const { tokenAddress, includeHistory } = validationResult.data;

    // Perform analysis
    const analysis = await riskAnalyzer.analyzeToken(tokenAddress);

    // Cache result
    cacheService.set(tokenAddress, analysis);

    const response: APIResponse<TokenRiskScore> = {
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * POST /api/analyze/batch
 * Analyze multiple tokens (max 10)
 */
router.post(
  '/batch',
  batchRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validationResult = BatchAnalyzeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const { tokenAddresses } = validationResult.data;

    // Analyze all tokens in parallel
    const results = await Promise.allSettled(
      tokenAddresses.map(async (address) => {
        // Check cache first
        const cached = cacheService.get(address);
        if (cached) {
          return { ...cached, cached: true };
        }

        const analysis = await riskAnalyzer.analyzeToken(address);
        cacheService.set(address, analysis);
        return { ...analysis, cached: false };
      })
    );

    // Format results
    const formattedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          tokenAddress: tokenAddresses[index],
          success: true,
          data: result.value,
        };
      } else {
        return {
          tokenAddress: tokenAddresses[index],
          success: false,
          error: result.reason?.message || 'Analysis failed',
        };
      }
    });

    const response: APIResponse<typeof formattedResults> = {
      success: true,
      data: formattedResults,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/analyze/:tokenAddress/holders
 * Get holder distribution for a token
 */
router.get(
  '/:tokenAddress/holders',
  analysisRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    // Validate token address
    const validationResult = TokenAddressSchema.safeParse(tokenAddress);
    if (!validationResult.success) {
      throw new ValidationError('Invalid Solana token address format');
    }

    const holders = await solanaService.getTopHolders(tokenAddress, limit);

    const response: APIResponse<{ address: string; balance: string; percentage: number }[]> = {
      success: true,
      data: holders.map((h) => ({
        address: h.address,
        balance: h.balance.toString(), // Convert BigInt for JSON
        percentage: h.percentage,
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/analyze/:tokenAddress/quick
 * Quick risk check (basic metrics only)
 */
router.get(
  '/:tokenAddress/quick',
  asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.params;

    // Validate token address
    const validationResult = TokenAddressSchema.safeParse(tokenAddress);
    if (!validationResult.success) {
      throw new ValidationError('Invalid Solana token address format');
    }

    // Get basic token info
    const [tokenInfo, topHolders] = await Promise.all([
      solanaService.getTokenInfo(tokenAddress),
      solanaService.getTopHolders(tokenAddress, 10),
    ]);

    const top10Percentage = topHolders.reduce((sum, h) => sum + h.percentage, 0);

    const quickAnalysis = {
      tokenAddress,
      mintAuthorityRevoked: tokenInfo.mintAuthority === null,
      freezeAuthorityRevoked: tokenInfo.freezeAuthority === null,
      top10HoldersPercentage: Math.round(top10Percentage * 100) / 100,
      totalHolders: topHolders.length,
      quickRiskIndicator: tokenInfo.mintAuthority !== null || top10Percentage > 50
        ? 'HIGH'
        : top10Percentage > 30
          ? 'MEDIUM'
          : 'LOW',
    };

    const response: APIResponse<typeof quickAnalysis> = {
      success: true,
      data: quickAnalysis,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
