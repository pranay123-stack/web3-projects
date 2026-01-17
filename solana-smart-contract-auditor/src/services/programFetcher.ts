import {
  Connection,
  PublicKey,
  AccountInfo,
  ParsedAccountData,
} from '@solana/web3.js';
import { ProgramInfo, DeployerInfo } from '../types';
import logger from '../utils/logger';
import { withRetry, calculateHash } from '../utils/helpers';

// BPF Upgradeable Loader Program ID
const BPF_LOADER_UPGRADEABLE = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);

export class ProgramFetcher {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Fetch program account data and metadata
   */
  async fetchProgramInfo(programId: string): Promise<ProgramInfo> {
    return withRetry(async () => {
      const pubkey = new PublicKey(programId);
      const accountInfo = await this.connection.getAccountInfo(pubkey);

      if (!accountInfo) {
        throw new Error(`Program not found: ${programId}`);
      }

      if (!accountInfo.executable) {
        throw new Error(`Account is not executable: ${programId}`);
      }

      // Check if program is upgradeable
      const isUpgradeable = accountInfo.owner.equals(BPF_LOADER_UPGRADEABLE);
      let upgradeAuthority: string | null = null;
      let programDataAccount: string | undefined;
      let lastDeploySlot: number | undefined;

      if (isUpgradeable) {
        const programData = await this.fetchUpgradeableLoaderData(pubkey, accountInfo);
        upgradeAuthority = programData.upgradeAuthority;
        programDataAccount = programData.programDataAccount;
        lastDeploySlot = programData.lastDeploySlot;
      }

      // Try to get deployer info
      let deployerHistory: DeployerInfo | undefined;
      if (upgradeAuthority) {
        try {
          deployerHistory = await this.getDeployerInfo(upgradeAuthority);
        } catch {
          // Deployer info not available
        }
      }

      return {
        programId,
        owner: accountInfo.owner.toString(),
        executable: accountInfo.executable,
        lamports: accountInfo.lamports,
        dataLength: accountInfo.data.length,
        isUpgradeable,
        upgradeAuthority,
        lastDeploySlot,
        programDataAccount,
        idlAvailable: false, // Would need to check for IDL account
        verified: false, // Would need external verification service
        deployerHistory,
      };
    });
  }

  /**
   * Fetch program bytecode
   */
  async fetchProgramBytecode(programId: string): Promise<Buffer> {
    return withRetry(async () => {
      const pubkey = new PublicKey(programId);
      const accountInfo = await this.connection.getAccountInfo(pubkey);

      if (!accountInfo) {
        throw new Error(`Program not found: ${programId}`);
      }

      // For upgradeable programs, get data from program data account
      if (accountInfo.owner.equals(BPF_LOADER_UPGRADEABLE)) {
        // First 4 bytes indicate account type, next 32 bytes are program data address
        if (accountInfo.data.length >= 36) {
          const programDataAddress = new PublicKey(
            accountInfo.data.slice(4, 36)
          );
          const programDataAccount = await this.connection.getAccountInfo(
            programDataAddress
          );

          if (programDataAccount) {
            // Skip metadata (45 bytes) to get actual bytecode
            return Buffer.from(programDataAccount.data.slice(45));
          }
        }
      }

      return Buffer.from(accountInfo.data);
    });
  }

  /**
   * Get upgradeable loader data
   */
  private async fetchUpgradeableLoaderData(
    programPubkey: PublicKey,
    accountInfo: AccountInfo<Buffer>
  ): Promise<{
    upgradeAuthority: string | null;
    programDataAccount: string;
    lastDeploySlot: number;
  }> {
    // Parse program account to get program data address
    // Format: [4 bytes type][32 bytes program data address]
    if (accountInfo.data.length < 36) {
      throw new Error('Invalid upgradeable program account');
    }

    const programDataAddress = new PublicKey(accountInfo.data.slice(4, 36));
    const programDataAccount = await this.connection.getAccountInfo(
      programDataAddress
    );

    if (!programDataAccount) {
      throw new Error('Program data account not found');
    }

    // Parse program data account
    // Format: [4 bytes type][1 byte initialized][8 bytes slot][33 bytes optional authority]
    const data = programDataAccount.data;
    const slot = data.readBigUInt64LE(5);

    let upgradeAuthority: string | null = null;
    if (data[13] === 1) {
      // Authority exists
      upgradeAuthority = new PublicKey(data.slice(14, 46)).toString();
    }

    return {
      upgradeAuthority,
      programDataAccount: programDataAddress.toString(),
      lastDeploySlot: Number(slot),
    };
  }

  /**
   * Get deployer wallet information
   */
  private async getDeployerInfo(address: string): Promise<DeployerInfo> {
    const pubkey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: 1000,
    });

    let walletAge = 0;
    if (signatures.length > 0) {
      const oldest = signatures[signatures.length - 1];
      if (oldest.blockTime) {
        walletAge = Math.floor((Date.now() / 1000 - oldest.blockTime) / 86400);
      }
    }

    // Estimate reputation based on wallet age
    let reputation: DeployerInfo['reputation'] = 'UNKNOWN';
    if (walletAge > 365) {
      reputation = 'TRUSTED';
    } else if (walletAge > 90) {
      reputation = 'ESTABLISHED';
    } else if (walletAge > 0) {
      reputation = 'NEW';
    }

    return {
      address,
      walletAge,
      programsDeployed: 0, // Would need additional analysis
      reputation,
    };
  }

  /**
   * Get program account history (deployments/upgrades)
   */
  async getProgramHistory(
    programId: string
  ): Promise<{ slot: number; signature: string; timestamp: number | null }[]> {
    const pubkey = new PublicKey(programId);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: 100,
    });

    return signatures.map((sig) => ({
      slot: sig.slot,
      signature: sig.signature,
      timestamp: sig.blockTime ?? null,
    }));
  }

  /**
   * Check if program exists
   */
  async programExists(programId: string): Promise<boolean> {
    try {
      const pubkey = new PublicKey(programId);
      const accountInfo = await this.connection.getAccountInfo(pubkey);
      return accountInfo !== null && accountInfo.executable;
    } catch {
      return false;
    }
  }

  /**
   * Get current slot
   */
  async getCurrentSlot(): Promise<number> {
    return this.connection.getSlot();
  }

  /**
   * Check if program was recently upgraded
   */
  async wasRecentlyUpgraded(
    programId: string,
    lastKnownSlot: number
  ): Promise<{ upgraded: boolean; newSlot?: number }> {
    try {
      const info = await this.fetchProgramInfo(programId);
      if (info.lastDeploySlot && info.lastDeploySlot > lastKnownSlot) {
        return { upgraded: true, newSlot: info.lastDeploySlot };
      }
      return { upgraded: false };
    } catch (error) {
      logger.error(`Error checking upgrade status for ${programId}:`, error);
      return { upgraded: false };
    }
  }
}

export default ProgramFetcher;
