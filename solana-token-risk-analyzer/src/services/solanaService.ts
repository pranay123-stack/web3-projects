import {
  Connection,
  PublicKey,
  ParsedAccountData,
  AccountInfo,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenInfo, HolderInfo } from '../types';
import logger from '../utils/logger';
import { withRetry } from '../utils/helpers';

export class SolanaService {
  private connection: Connection;
  private heliusApiKey?: string;

  constructor(rpcUrl: string, heliusApiKey?: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.heliusApiKey = heliusApiKey;
  }

  /**
   * Get token info including mint authority and freeze authority
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
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

      return {
        address: tokenAddress,
        decimals: info.decimals,
        supply: BigInt(info.supply),
        mintAuthority: info.mintAuthority || null,
        freezeAuthority: info.freezeAuthority || null,
      };
    });
  }

  /**
   * Get top token holders with their balances
   */
  async getTopHolders(tokenAddress: string, limit: number = 20): Promise<HolderInfo[]> {
    return withRetry(async () => {
      const mintPubkey = new PublicKey(tokenAddress);

      // Get largest token accounts
      const largestAccounts = await this.connection.getTokenLargestAccounts(mintPubkey);

      // Get total supply for percentage calculation
      const supplyInfo = await this.connection.getTokenSupply(mintPubkey);
      const totalSupply = BigInt(supplyInfo.value.amount);

      const holders: HolderInfo[] = [];

      for (const account of largestAccounts.value.slice(0, limit)) {
        const balance = BigInt(account.amount);
        const percentage = totalSupply > 0n
          ? Number((balance * 10000n) / totalSupply) / 100
          : 0;

        // Get owner of the token account
        const accountInfo = await this.connection.getParsedAccountInfo(account.address);
        const data = accountInfo.value?.data as ParsedAccountData;
        const owner = data?.parsed?.info?.owner || account.address.toString();

        holders.push({
          address: owner,
          balance,
          percentage,
        });
      }

      return holders;
    });
  }

  /**
   * Get deployer wallet info and history
   */
  async getDeployerInfo(deployerAddress: string): Promise<{
    walletAge: number;
    transactionCount: number;
    firstTransaction: number | null;
  }> {
    return withRetry(async () => {
      const pubkey = new PublicKey(deployerAddress);

      // Get signatures to estimate wallet age
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit: 1000,
      });

      if (signatures.length === 0) {
        return {
          walletAge: 0,
          transactionCount: 0,
          firstTransaction: null,
        };
      }

      // Get the oldest transaction timestamp
      const oldestSig = signatures[signatures.length - 1];
      const firstTransaction = oldestSig.blockTime || null;

      const walletAge = firstTransaction
        ? Math.floor((Date.now() / 1000 - firstTransaction) / 86400)
        : 0;

      return {
        walletAge,
        transactionCount: signatures.length,
        firstTransaction,
      };
    });
  }

  /**
   * Get recent transactions for analysis
   */
  async getRecentTransactions(
    address: string,
    limit: number = 100
  ): Promise<{ signature: string; blockTime: number | null }[]> {
    return withRetry(async () => {
      const pubkey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit,
      });

      return signatures.map((sig) => ({
        signature: sig.signature,
        blockTime: sig.blockTime ?? null,
      }));
    });
  }

  /**
   * Check if account exists and get balance
   */
  async getAccountBalance(address: string): Promise<number> {
    return withRetry(async () => {
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return balance / 1e9; // Convert lamports to SOL
    });
  }

  /**
   * Get token metadata using Metaplex (if available)
   */
  async getTokenMetadata(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    uri: string;
  } | null> {
    try {
      // Derive metadata PDA
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

      // Parse basic metadata (simplified parsing)
      const data = accountInfo.data;

      // Skip to name (after key byte and update authority)
      let offset = 1 + 32 + 32; // key + updateAuthority + mint
      const nameLength = data.readUInt32LE(offset);
      offset += 4;
      const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '').trim();
      offset += nameLength;

      const symbolLength = data.readUInt32LE(offset);
      offset += 4;
      const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '').trim();
      offset += symbolLength;

      const uriLength = data.readUInt32LE(offset);
      offset += 4;
      const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '').trim();

      return { name, symbol, uri };
    } catch (error) {
      logger.debug(`Could not fetch metadata for ${tokenAddress}: ${error}`);
      return null;
    }
  }

  /**
   * Estimate tokens deployed by an address
   */
  async estimateTokensDeployed(deployerAddress: string): Promise<number> {
    try {
      const pubkey = new PublicKey(deployerAddress);

      // Get token accounts owned by this address as authority
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        pubkey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // This is a rough estimate - actual deployed tokens would require
      // parsing all transactions
      return tokenAccounts.value.length;
    } catch (error) {
      logger.debug(`Could not estimate tokens deployed: ${error}`);
      return 0;
    }
  }
}

export default SolanaService;
