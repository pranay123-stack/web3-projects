import {
  Connection,
  PublicKey,
  ParsedAccountData,
  Logs,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NewTokenEvent, TokenMetadata } from '../types';
import logger from '../utils/logger';
import { withRetry } from '../utils/helpers';

export class SolanaMonitor {
  private connection: Connection;
  private wsConnection: Connection;
  private subscriptionId: number | null = null;
  private tokenCallbacks: ((event: NewTokenEvent) => void)[] = [];

  constructor(rpcUrl: string, wsUrl?: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.wsConnection = new Connection(wsUrl || rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: wsUrl,
    });
  }

  /**
   * Subscribe to new token mint events
   */
  async subscribeToNewTokens(callback: (event: NewTokenEvent) => void): Promise<void> {
    this.tokenCallbacks.push(callback);

    if (this.subscriptionId !== null) {
      return; // Already subscribed
    }

    logger.info('Subscribing to new token events...');

    try {
      this.subscriptionId = this.wsConnection.onLogs(
        TOKEN_PROGRAM_ID,
        (logs: Logs, ctx) => {
          this.handleTokenLogs(logs, ctx.slot);
        },
        'confirmed'
      );

      logger.info(`Subscribed to token program logs (ID: ${this.subscriptionId})`);
    } catch (error) {
      logger.error('Failed to subscribe to token events:', error);
      throw error;
    }
  }

  /**
   * Handle incoming token program logs
   */
  private async handleTokenLogs(logs: Logs, slot: number): Promise<void> {
    try {
      // Check for InitializeMint instruction
      const isNewMint = logs.logs.some(
        (log) =>
          log.includes('InitializeMint') ||
          log.includes('Instruction: InitializeMint2')
      );

      if (isNewMint && logs.signature) {
        // Parse transaction to get token address
        const tx = await this.connection.getParsedTransaction(logs.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx?.meta?.postTokenBalances) {
          for (const balance of tx.meta.postTokenBalances) {
            if (balance.mint) {
              const event: NewTokenEvent = {
                signature: logs.signature,
                tokenAddress: balance.mint,
                deployer: tx.transaction.message.accountKeys[0]?.pubkey?.toString() || 'unknown',
                timestamp: tx.blockTime || Date.now() / 1000,
                slot,
              };

              logger.info(`New token detected: ${event.tokenAddress}`);

              // Notify all callbacks
              for (const callback of this.tokenCallbacks) {
                try {
                  callback(event);
                } catch (err) {
                  logger.error('Error in token callback:', err);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.debug(`Error processing logs: ${error}`);
    }
  }

  /**
   * Get token metadata and info
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenMetadata> {
    return withRetry(async () => {
      const mintPubkey = new PublicKey(tokenAddress);
      const accountInfo = await this.connection.getParsedAccountInfo(mintPubkey);

      if (!accountInfo.value) {
        throw new Error(`Token not found: ${tokenAddress}`);
      }

      const data = accountInfo.value.data as ParsedAccountData;
      const info = data.parsed?.info;

      if (!info) {
        throw new Error(`Invalid token data for: ${tokenAddress}`);
      }

      // Try to get metadata
      let name = 'Unknown';
      let symbol = 'UNKNOWN';
      let hasMetadata = false;

      try {
        const metadata = await this.getMetaplexMetadata(tokenAddress);
        if (metadata) {
          name = metadata.name;
          symbol = metadata.symbol;
          hasMetadata = true;
        }
      } catch {
        // Metadata not found
      }

      // Get deployer from recent transactions
      let deployer = 'Unknown';
      let deployedAt: number | null = null;

      try {
        const signatures = await this.connection.getSignaturesForAddress(mintPubkey, { limit: 10 });
        if (signatures.length > 0) {
          const oldestSig = signatures[signatures.length - 1];
          deployedAt = oldestSig.blockTime ?? null;

          const tx = await this.connection.getParsedTransaction(oldestSig.signature);
          if (tx) {
            deployer = tx.transaction.message.accountKeys[0]?.pubkey?.toString() || 'Unknown';
          }
        }
      } catch {
        // Could not get deployer
      }

      return {
        name,
        symbol,
        decimals: info.decimals,
        supply: info.supply,
        mintAuthority: info.mintAuthority || null,
        freezeAuthority: info.freezeAuthority || null,
        deployer,
        deployedAt,
        hasMetadata,
      };
    });
  }

  /**
   * Get Metaplex metadata
   */
  private async getMetaplexMetadata(
    tokenAddress: string
  ): Promise<{ name: string; symbol: string } | null> {
    const mintPubkey = new PublicKey(tokenAddress);
    const METADATA_PROGRAM_ID = new PublicKey(
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
    );

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const accountInfo = await this.connection.getAccountInfo(metadataPDA);

    if (!accountInfo) {
      return null;
    }

    // Parse metadata (simplified)
    const data = accountInfo.data;
    let offset = 1 + 32 + 32;

    const nameLength = data.readUInt32LE(offset);
    offset += 4;
    const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '').trim();
    offset += nameLength;

    const symbolLength = data.readUInt32LE(offset);
    offset += 4;
    const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '').trim();

    return { name, symbol };
  }

  /**
   * Get top holders for a token
   */
  async getTopHolders(
    tokenAddress: string,
    limit: number = 10
  ): Promise<{ address: string; percentage: number }[]> {
    return withRetry(async () => {
      const mintPubkey = new PublicKey(tokenAddress);
      const largestAccounts = await this.connection.getTokenLargestAccounts(mintPubkey);
      const supplyInfo = await this.connection.getTokenSupply(mintPubkey);
      const totalSupply = BigInt(supplyInfo.value.amount);

      const holders: { address: string; percentage: number }[] = [];

      for (const account of largestAccounts.value.slice(0, limit)) {
        const balance = BigInt(account.amount);
        const percentage = totalSupply > 0n
          ? Number((balance * 10000n) / totalSupply) / 100
          : 0;

        // Get owner
        const accountInfo = await this.connection.getParsedAccountInfo(account.address);
        const data = accountInfo.value?.data as ParsedAccountData;
        const owner = data?.parsed?.info?.owner || account.address.toString();

        holders.push({ address: owner, percentage });
      }

      return holders;
    });
  }

  /**
   * Get wallet age in days
   */
  async getWalletAge(address: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit: 1000 });

      if (signatures.length === 0) return 0;

      const oldestSig = signatures[signatures.length - 1];
      if (!oldestSig.blockTime) return 0;

      const now = Date.now() / 1000;
      return Math.floor((now - oldestSig.blockTime) / 86400);
    } catch {
      return 0;
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId !== null) {
      await this.wsConnection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      logger.info('Unsubscribed from token events');
    }
  }

  /**
   * Check if connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.connection.getSlot();
      return true;
    } catch {
      return false;
    }
  }
}

export default SolanaMonitor;
