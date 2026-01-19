'use client';

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import { ipfsService, TokenMetadata } from './ipfs';
import { TokenFormData, getCostBreakdown } from '@/lib/validation';

// Solana program IDs
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Your pump.fun clone program ID (replace with actual deployed program)
const PUMP_FUN_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PUMP_FUN_PROGRAM_ID || '11111111111111111111111111111111'
);

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description: string;
  image: File;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface CreateTokenResult {
  success: boolean;
  mintAddress?: string;
  signature?: string;
  metadataUri?: string;
  error?: string;
}

export interface TokenCreationProgress {
  stage: 'idle' | 'uploading_image' | 'uploading_metadata' | 'creating_token' | 'confirming' | 'complete' | 'error';
  message: string;
  progress: number;
}

type ProgressCallback = (progress: TokenCreationProgress) => void;

class TokenCreationService {
  private connection: Connection;

  constructor() {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Create a new token with the given parameters
   */
  async createToken(
    params: CreateTokenParams,
    wallet: {
      publicKey: PublicKey;
      signTransaction: (tx: Transaction) => Promise<Transaction>;
    },
    onProgress?: ProgressCallback
  ): Promise<CreateTokenResult> {
    try {
      // Stage 1: Upload image to IPFS
      onProgress?.({
        stage: 'uploading_image',
        message: 'Uploading image to IPFS...',
        progress: 10,
      });

      const imageResult = await ipfsService.uploadImage(params.image);
      const imageUrl = imageResult.url;

      onProgress?.({
        stage: 'uploading_image',
        message: 'Image uploaded successfully!',
        progress: 30,
      });

      // Stage 2: Create and upload metadata
      onProgress?.({
        stage: 'uploading_metadata',
        message: 'Creating token metadata...',
        progress: 40,
      });

      const metadata: TokenMetadata = {
        name: params.name,
        symbol: params.symbol.toUpperCase(),
        description: params.description,
        image: imageUrl,
        external_url: params.website,
        attributes: [
          ...(params.twitter ? [{ trait_type: 'Twitter', value: params.twitter }] : []),
          ...(params.telegram ? [{ trait_type: 'Telegram', value: params.telegram }] : []),
        ],
        properties: {
          files: [
            {
              uri: imageUrl,
              type: params.image.type,
            },
          ],
          category: 'token',
          creators: [
            {
              address: wallet.publicKey.toBase58(),
              share: 100,
            },
          ],
        },
      };

      const metadataResult = await ipfsService.uploadMetadata(metadata);
      const metadataUri = metadataResult.url;

      onProgress?.({
        stage: 'uploading_metadata',
        message: 'Metadata uploaded successfully!',
        progress: 60,
      });

      // Stage 3: Create token on-chain
      onProgress?.({
        stage: 'creating_token',
        message: 'Creating token on Solana...',
        progress: 70,
      });

      // Generate a new keypair for the mint
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;

      // Build the transaction
      const transaction = await this.buildCreateTokenTransaction(
        wallet.publicKey,
        mintAddress,
        params.name,
        params.symbol.toUpperCase(),
        metadataUri
      );

      // Sign with mint keypair first
      transaction.partialSign(mintKeypair);

      // Sign with wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      onProgress?.({
        stage: 'creating_token',
        message: 'Sending transaction...',
        progress: 80,
      });

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      // Stage 4: Confirm transaction
      onProgress?.({
        stage: 'confirming',
        message: 'Confirming transaction...',
        progress: 90,
      });

      await this.connection.confirmTransaction(signature, 'confirmed');

      onProgress?.({
        stage: 'complete',
        message: 'Token created successfully!',
        progress: 100,
      });

      return {
        success: true,
        mintAddress: mintAddress.toBase58(),
        signature,
        metadataUri,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      onProgress?.({
        stage: 'error',
        message: errorMessage,
        progress: 0,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Build the transaction for creating a new token
   */
  private async buildCreateTokenTransaction(
    payer: PublicKey,
    mint: PublicKey,
    name: string,
    symbol: string,
    metadataUri: string
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Get latest blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;

    // Calculate rent for mint account
    const mintRent = await this.connection.getMinimumBalanceForRentExemption(82);

    // 1. Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mint,
        lamports: mintRent,
        space: 82, // Mint account size
        programId: TOKEN_PROGRAM_ID,
      })
    );

    // 2. Initialize mint (using Token Program instruction)
    transaction.add(
      this.createInitializeMintInstruction(
        mint,
        6, // 6 decimals like most Solana tokens
        payer, // Mint authority
        payer  // Freeze authority (optional, can be null)
      )
    );

    // 3. Create metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    transaction.add(
      this.createMetadataInstruction(
        metadataAccount,
        mint,
        payer,
        payer,
        payer,
        name,
        symbol,
        metadataUri
      )
    );

    // 4. Optional: Call pump.fun program to register token in bonding curve
    // This would be your custom program instruction
    if (PUMP_FUN_PROGRAM_ID.toBase58() !== '11111111111111111111111111111111') {
      transaction.add(
        await this.createPumpFunInstruction(payer, mint, name, symbol)
      );
    }

    return transaction;
  }

  /**
   * Create Initialize Mint instruction
   */
  private createInitializeMintInstruction(
    mint: PublicKey,
    decimals: number,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null
  ): TransactionInstruction {
    const keys = [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
    ];

    const data = Buffer.alloc(67);
    data.writeUInt8(0, 0); // Instruction index for InitializeMint
    data.writeUInt8(decimals, 1);
    mintAuthority.toBuffer().copy(data, 2);
    data.writeUInt8(freezeAuthority ? 1 : 0, 34);
    if (freezeAuthority) {
      freezeAuthority.toBuffer().copy(data, 35);
    }

    return new TransactionInstruction({
      keys,
      programId: TOKEN_PROGRAM_ID,
      data,
    });
  }

  /**
   * Create Metadata instruction for Token Metadata Program
   */
  private createMetadataInstruction(
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: PublicKey,
    payer: PublicKey,
    updateAuthority: PublicKey,
    name: string,
    symbol: string,
    uri: string
  ): TransactionInstruction {
    const keys = [
      { pubkey: metadataAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
    ];

    // Simplified metadata instruction data
    // In production, use @metaplex-foundation/mpl-token-metadata for proper serialization
    const nameBuffer = Buffer.from(name.substring(0, 32));
    const symbolBuffer = Buffer.from(symbol.substring(0, 10));
    const uriBuffer = Buffer.from(uri.substring(0, 200));

    const data = Buffer.concat([
      Buffer.from([33]), // CreateMetadataAccountV3 instruction
      Buffer.from([nameBuffer.length, 0, 0, 0]), // name length (u32 LE)
      nameBuffer,
      Buffer.from([symbolBuffer.length, 0, 0, 0]), // symbol length
      symbolBuffer,
      Buffer.from([uriBuffer.length, 0, 0, 0]), // uri length
      uriBuffer,
      Buffer.from([0, 0]), // seller_fee_basis_points
      Buffer.from([0]), // no creators option
      Buffer.from([0]), // no collection option
      Buffer.from([0]), // no uses option
      Buffer.from([1]), // is_mutable
      Buffer.from([0]), // no collection_details option
    ]);

    return new TransactionInstruction({
      keys,
      programId: TOKEN_METADATA_PROGRAM_ID,
      data,
    });
  }

  /**
   * Create Pump.fun program instruction to register token
   */
  private async createPumpFunInstruction(
    payer: PublicKey,
    mint: PublicKey,
    name: string,
    symbol: string
  ): Promise<TransactionInstruction> {
    // This would be your custom program instruction
    // The actual implementation depends on your Solana program

    // Find PDA for bonding curve account
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), mint.toBuffer()],
      PUMP_FUN_PROGRAM_ID
    );

    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    // Instruction data - customize based on your program
    const data = Buffer.concat([
      Buffer.from([0]), // Instruction discriminator for CreateToken
      Buffer.from(name.substring(0, 32).padEnd(32, '\0')),
      Buffer.from(symbol.substring(0, 10).padEnd(10, '\0')),
    ]);

    return new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM_ID,
      data,
    });
  }

  /**
   * Estimate the total cost of token creation
   */
  async estimateCost(): Promise<{
    creationFee: number;
    rentFee: number;
    metadataRent: number;
    networkFee: number;
    total: number;
  }> {
    const costs = getCostBreakdown();

    // Get current network fee estimate
    const { feeCalculator } = await this.connection.getRecentBlockhash();
    const networkFee = (feeCalculator?.lamportsPerSignature || 5000) * 3 / 1e9; // 3 signatures

    return {
      ...costs,
      networkFee,
      total: costs.total + networkFee,
    };
  }

  /**
   * Check if wallet has sufficient balance for token creation
   */
  async checkBalance(walletPublicKey: PublicKey): Promise<{
    balance: number;
    required: number;
    sufficient: boolean;
  }> {
    const balance = await this.connection.getBalance(walletPublicKey);
    const balanceSOL = balance / 1e9;
    const costs = await this.estimateCost();

    return {
      balance: balanceSOL,
      required: costs.total,
      sufficient: balanceSOL >= costs.total,
    };
  }

  /**
   * Get token info after creation
   */
  async getTokenInfo(mintAddress: string): Promise<{
    mint: string;
    supply: number;
    decimals: number;
    authority: string | null;
  } | null> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const accountInfo = await this.connection.getAccountInfo(mintPubkey);

      if (!accountInfo) {
        return null;
      }

      // Parse mint account data (simplified)
      const data = accountInfo.data;
      const decimals = data[44];
      const supply = data.slice(36, 44).readBigUInt64LE();

      return {
        mint: mintAddress,
        supply: Number(supply),
        decimals,
        authority: accountInfo.owner.toBase58(),
      };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const tokenCreationService = new TokenCreationService();

// Export class for testing
export { TokenCreationService };
