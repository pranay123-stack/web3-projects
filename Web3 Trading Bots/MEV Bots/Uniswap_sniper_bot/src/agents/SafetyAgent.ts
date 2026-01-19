import { Contract, Interface, ZeroAddress } from 'ethers';
import { BaseAgent } from './BaseAgent';
import { ProviderManager, getProviderManager } from '../core/provider';
import { config } from '../config';
import {
  AgentType,
  AgentMessage,
  MessageType,
  TokenInfo,
  TokenSafetyCheck,
  PoolInfo
} from '../types';
import { ERC20_ABI } from '../contracts/abis';
import { createComponentLogger } from '../utils/logger';
import { formatEthAmount, calculatePercentage } from '../utils/helpers';
import NodeCache from 'node-cache';

// Common honeypot contract patterns
const HONEYPOT_SIGNATURES = [
  '0x70a08231', // balanceOf - often manipulated in honeypots
  '0x095ea7b3', // approve - might revert
  '0xa9059cbb', // transfer - might revert or have hidden fees
  '0x23b872dd'  // transferFrom
];

// Known blacklist function selectors
const BLACKLIST_SELECTORS = [
  '0x3a0c4a5c', // addToBlacklist
  '0x44337ea1', // blacklist
  '0xe47d6060', // setBlacklist
  '0x4a49ac4c'  // setBot
];

export class SafetyAgent extends BaseAgent {
  private provider: ProviderManager;
  private safetyCache: NodeCache;
  private pendingChecks: Map<string, Promise<TokenSafetyCheck>> = new Map();

  constructor() {
    super(AgentType.SAFETY, 'SafetyAgent');
    this.provider = getProviderManager();
    // Cache safety checks for 10 minutes
    this.safetyCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  }

  protected async onStart(): Promise<void> {
    this.logger.info('Safety agent started');
  }

  protected async onStop(): Promise<void> {
    this.safetyCache.flushAll();
    this.pendingChecks.clear();
    this.logger.info('Safety agent stopped');
  }

  protected onMessage(message: AgentMessage): void {
    switch (message.type) {
      case MessageType.SAFETY_CHECK_REQUEST:
        this.handleSafetyCheckRequest(message);
        break;

      case MessageType.NEW_POOL_DETECTED:
        this.handleNewPool(message.payload);
        break;

      case MessageType.COMMAND:
        this.handleCommand(message.payload);
        break;
    }
  }

  /**
   * Handle safety check request
   */
  private async handleSafetyCheckRequest(message: AgentMessage): Promise<void> {
    const { token, requestId } = message.payload;

    const result = await this.performSafetyCheck(token);

    this.sendMessage(message.from, MessageType.SAFETY_CHECK_RESULT, {
      requestId,
      token: token.address,
      result
    });
  }

  /**
   * Handle new pool detection - automatically check token safety
   */
  private async handleNewPool(payload: any): Promise<void> {
    const { pool } = payload;

    // Determine which token is not WETH (that's the token we want to check)
    const targetToken = pool.token0.address.toLowerCase() === config.wethAddress.toLowerCase()
      ? pool.token1
      : pool.token0;

    this.logger.info(`Checking safety for new token: ${targetToken.symbol}`);

    const result = await this.performSafetyCheck(targetToken);

    // Broadcast the result
    this.broadcast(MessageType.SAFETY_CHECK_RESULT, {
      pool: pool.address || pool.poolId,
      token: targetToken.address,
      result
    });
  }

  /**
   * Perform comprehensive safety check on a token
   */
  async performSafetyCheck(token: TokenInfo): Promise<TokenSafetyCheck> {
    // Check cache first
    const cached = this.safetyCache.get<TokenSafetyCheck>(token.address);
    if (cached) {
      return cached;
    }

    // Check if already being processed
    const pending = this.pendingChecks.get(token.address);
    if (pending) {
      return pending;
    }

    // Start new check
    const checkPromise = this.runSafetyChecks(token);
    this.pendingChecks.set(token.address, checkPromise);

    try {
      const result = await checkPromise;
      this.safetyCache.set(token.address, result);
      return result;
    } finally {
      this.pendingChecks.delete(token.address);
    }
  }

  /**
   * Run all safety checks
   */
  private async runSafetyChecks(token: TokenInfo): Promise<TokenSafetyCheck> {
    const warnings: string[] = [];
    let score = 100;

    const results = {
      isHoneypot: false,
      buyTax: 0,
      sellTax: 0,
      isRenounced: false,
      hasBlacklist: false,
      hasMaxTx: false,
      maxTxAmount: undefined as bigint | undefined,
      hasMaxWallet: false,
      maxWalletAmount: undefined as bigint | undefined,
      liquidityLocked: false,
      lockDuration: undefined as number | undefined,
      score: 100,
      warnings
    };

    try {
      // Get contract bytecode
      const bytecode = await this.provider.getHttpProvider().getCode(token.address);

      // Check 1: Contract has code
      if (bytecode === '0x') {
        warnings.push('Token contract has no code');
        results.isHoneypot = true;
        score = 0;
        results.score = score;
        return results;
      }

      // Check 2: Analyze bytecode for suspicious patterns
      const bytecodeAnalysis = this.analyzeBytecode(bytecode);
      if (bytecodeAnalysis.hasBlacklist) {
        results.hasBlacklist = true;
        warnings.push('Contract may have blacklist functionality');
        score -= 20;
      }

      if (bytecodeAnalysis.suspiciousTransfer) {
        warnings.push('Transfer function has suspicious patterns');
        score -= 30;
      }

      // Check 3: Try to simulate buy/sell to detect honeypot
      const taxResult = await this.estimateTaxes(token);
      results.buyTax = taxResult.buyTax;
      results.sellTax = taxResult.sellTax;

      if (taxResult.buyTax > config.sniper.maxBuyTax) {
        warnings.push(`High buy tax: ${taxResult.buyTax}%`);
        score -= 20;
      }

      if (taxResult.sellTax > config.sniper.maxSellTax) {
        warnings.push(`High sell tax: ${taxResult.sellTax}%`);
        score -= 30;
      }

      if (taxResult.sellTax > 90) {
        results.isHoneypot = true;
        warnings.push('Likely honeypot: Cannot sell');
        score = 0;
      }

      // Check 4: Check for max transaction limits
      const limitCheck = await this.checkTransactionLimits(token);
      results.hasMaxTx = limitCheck.hasMaxTx;
      results.maxTxAmount = limitCheck.maxTxAmount;
      results.hasMaxWallet = limitCheck.hasMaxWallet;
      results.maxWalletAmount = limitCheck.maxWalletAmount;

      if (limitCheck.hasMaxTx) {
        warnings.push('Token has max transaction limit');
        score -= 10;
      }

      if (limitCheck.hasMaxWallet) {
        warnings.push('Token has max wallet limit');
        score -= 10;
      }

      // Check 5: Check ownership
      results.isRenounced = await this.checkOwnership(token);
      if (!results.isRenounced) {
        warnings.push('Contract ownership not renounced');
        score -= 15;
      }

      // Check 6: Basic liquidity check
      const liquidityCheck = await this.checkLiquidity(token);
      if (liquidityCheck.isLow) {
        warnings.push('Low liquidity');
        score -= 20;
      }

      results.score = Math.max(0, score);

      this.logger.info(`Safety check completed for ${token.symbol}`, {
        score: results.score,
        isHoneypot: results.isHoneypot,
        buyTax: results.buyTax,
        sellTax: results.sellTax,
        warnings: warnings.length
      });

      return results;
    } catch (error) {
      this.logger.error('Error during safety check', { token: token.address, error });
      warnings.push('Safety check partially failed');
      results.score = Math.max(0, score - 20);
      return results;
    }
  }

  /**
   * Analyze contract bytecode for suspicious patterns
   */
  private analyzeBytecode(bytecode: string): {
    hasBlacklist: boolean;
    suspiciousTransfer: boolean;
    hasPausable: boolean;
  } {
    const byteLower = bytecode.toLowerCase();

    return {
      hasBlacklist: BLACKLIST_SELECTORS.some(sel =>
        byteLower.includes(sel.slice(2))
      ),
      suspiciousTransfer: byteLower.includes('revert') &&
                          (byteLower.includes('transfer') || byteLower.includes('a9059cbb')),
      hasPausable: byteLower.includes('5c975abb') // paused() selector
    };
  }

  /**
   * Estimate buy/sell taxes by simulation
   */
  private async estimateTaxes(token: TokenInfo): Promise<{
    buyTax: number;
    sellTax: number;
  }> {
    try {
      // This is a simplified estimation
      // In production, you'd want to simulate actual swaps
      const tokenContract = this.provider.getReadOnlyContract(token.address, [
        ...ERC20_ABI,
        'function _taxFee() view returns (uint256)',
        'function _liquidityFee() view returns (uint256)',
        'function buyTax() view returns (uint256)',
        'function sellTax() view returns (uint256)',
        'function totalFee() view returns (uint256)'
      ]);

      let buyTax = 0;
      let sellTax = 0;

      // Try to read tax values directly
      try {
        const [buy, sell] = await Promise.all([
          tokenContract.buyTax().catch(() => BigInt(0)),
          tokenContract.sellTax().catch(() => BigInt(0))
        ]);
        buyTax = Number(buy);
        sellTax = Number(sell);
      } catch {
        // Try alternative methods
        try {
          const totalFee = await tokenContract.totalFee();
          buyTax = Number(totalFee);
          sellTax = Number(totalFee);
        } catch {
          // Can't determine taxes from contract
        }
      }

      return { buyTax, sellTax };
    } catch (error) {
      return { buyTax: 0, sellTax: 0 };
    }
  }

  /**
   * Check for transaction limits
   */
  private async checkTransactionLimits(token: TokenInfo): Promise<{
    hasMaxTx: boolean;
    maxTxAmount?: bigint;
    hasMaxWallet: boolean;
    maxWalletAmount?: bigint;
  }> {
    try {
      const tokenContract = this.provider.getReadOnlyContract(token.address, [
        ...ERC20_ABI,
        'function _maxTxAmount() view returns (uint256)',
        'function maxTransactionAmount() view returns (uint256)',
        'function _maxWalletSize() view returns (uint256)',
        'function maxWalletAmount() view returns (uint256)'
      ]);

      let maxTxAmount: bigint | undefined;
      let maxWalletAmount: bigint | undefined;

      try {
        maxTxAmount = await tokenContract._maxTxAmount().catch(() =>
          tokenContract.maxTransactionAmount()
        );
      } catch {}

      try {
        maxWalletAmount = await tokenContract._maxWalletSize().catch(() =>
          tokenContract.maxWalletAmount()
        );
      } catch {}

      return {
        hasMaxTx: maxTxAmount !== undefined && maxTxAmount > BigInt(0),
        maxTxAmount,
        hasMaxWallet: maxWalletAmount !== undefined && maxWalletAmount > BigInt(0),
        maxWalletAmount
      };
    } catch (error) {
      return {
        hasMaxTx: false,
        hasMaxWallet: false
      };
    }
  }

  /**
   * Check contract ownership
   */
  private async checkOwnership(token: TokenInfo): Promise<boolean> {
    try {
      const tokenContract = this.provider.getReadOnlyContract(token.address, [
        'function owner() view returns (address)',
        'function getOwner() view returns (address)'
      ]);

      let owner: string;
      try {
        owner = await tokenContract.owner();
      } catch {
        try {
          owner = await tokenContract.getOwner();
        } catch {
          return true; // Assume renounced if no owner function
        }
      }

      return owner === ZeroAddress;
    } catch (error) {
      return true; // Assume renounced on error
    }
  }

  /**
   * Check liquidity status
   */
  private async checkLiquidity(token: TokenInfo): Promise<{
    isLow: boolean;
    ethAmount?: bigint;
  }> {
    // This would check the pool liquidity
    // Simplified version
    return {
      isLow: false
    };
  }

  /**
   * Handle commands
   */
  private handleCommand(command: any): void {
    switch (command.action) {
      case 'check':
        if (command.token) {
          this.performSafetyCheck(command.token);
        }
        break;

      case 'clearCache':
        this.safetyCache.flushAll();
        this.logger.info('Safety cache cleared');
        break;
    }
  }

  /**
   * Quick honeypot check
   */
  async isHoneypot(tokenAddress: string): Promise<boolean> {
    const cached = this.safetyCache.get<TokenSafetyCheck>(tokenAddress);
    if (cached) {
      return cached.isHoneypot;
    }

    // Simple check - just verify we can call balanceOf and transfer
    try {
      const token = this.provider.getReadOnlyContract(tokenAddress, ERC20_ABI);
      await token.balanceOf(this.provider.getAddress());
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Get safety score for a token
   */
  getSafetyScore(tokenAddress: string): number | undefined {
    const cached = this.safetyCache.get<TokenSafetyCheck>(tokenAddress);
    return cached?.score;
  }
}

export default SafetyAgent;
