import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import type { BondingCurve, PriceEstimate, TradingParams } from '@/types';

// Program ID for the pump.fun contract (replace with actual)
const PUMP_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PUMP_PROGRAM_ID || '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
);

// Fee recipient (replace with actual)
const FEE_RECIPIENT = new PublicKey(
  process.env.NEXT_PUBLIC_FEE_RECIPIENT || 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM'
);

// Trading constants
const TRADING_FEE_BPS = 100; // 1% fee
const DEFAULT_SLIPPAGE_BPS = 100; // 1% default slippage
const GRADUATION_THRESHOLD = 85; // 85 SOL to graduate

/**
 * Calculate the amount of tokens received for a given SOL input
 * Using constant product formula: x * y = k
 */
export function calculateBuyAmount(
  solAmount: number,
  bondingCurve: BondingCurve
): PriceEstimate {
  const solLamports = solAmount * LAMPORTS_PER_SOL;

  // Apply fee
  const fee = (solLamports * TRADING_FEE_BPS) / 10000;
  const solAfterFee = solLamports - fee;

  // Constant product formula
  const k = bondingCurve.virtualSolReserves * bondingCurve.virtualTokenReserves;
  const newSolReserves = bondingCurve.virtualSolReserves + solAfterFee;
  const newTokenReserves = k / newSolReserves;
  const tokensOut = bondingCurve.virtualTokenReserves - newTokenReserves;

  // Calculate price impact
  const spotPrice = bondingCurve.virtualSolReserves / bondingCurve.virtualTokenReserves;
  const executionPrice = solAfterFee / tokensOut;
  const priceImpact = ((executionPrice - spotPrice) / spotPrice) * 100;

  // Minimum output with default slippage
  const minOutputAmount = tokensOut * (1 - DEFAULT_SLIPPAGE_BPS / 10000);

  return {
    inputAmount: solAmount,
    outputAmount: tokensOut,
    priceImpact,
    fee: fee / LAMPORTS_PER_SOL,
    minOutputAmount,
  };
}

/**
 * Calculate the amount of SOL received for selling tokens
 */
export function calculateSellAmount(
  tokenAmount: number,
  bondingCurve: BondingCurve
): PriceEstimate {
  // Constant product formula
  const k = bondingCurve.virtualSolReserves * bondingCurve.virtualTokenReserves;
  const newTokenReserves = bondingCurve.virtualTokenReserves + tokenAmount;
  const newSolReserves = k / newTokenReserves;
  const solOut = bondingCurve.virtualSolReserves - newSolReserves;

  // Apply fee
  const fee = (solOut * TRADING_FEE_BPS) / 10000;
  const solAfterFee = solOut - fee;

  // Calculate price impact
  const spotPrice = bondingCurve.virtualSolReserves / bondingCurve.virtualTokenReserves;
  const executionPrice = solOut / tokenAmount;
  const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;

  // Minimum output with default slippage
  const minOutputAmount = solAfterFee * (1 - DEFAULT_SLIPPAGE_BPS / 10000);

  return {
    inputAmount: tokenAmount,
    outputAmount: solAfterFee / LAMPORTS_PER_SOL,
    priceImpact,
    fee: fee / LAMPORTS_PER_SOL,
    minOutputAmount: minOutputAmount / LAMPORTS_PER_SOL,
  };
}

/**
 * Calculate slippage-adjusted minimum output
 */
export function getSlippageAdjustedAmount(
  amount: number,
  slippageBps: number
): number {
  return amount * (1 - slippageBps / 10000);
}

/**
 * Get the current price from bonding curve
 */
export function getCurrentPrice(bondingCurve: BondingCurve): number {
  return bondingCurve.virtualSolReserves / bondingCurve.virtualTokenReserves / LAMPORTS_PER_SOL;
}

/**
 * Get bonding curve progress percentage
 */
export function getBondingCurveProgress(bondingCurve: BondingCurve): number {
  return (bondingCurve.realSolReserves / LAMPORTS_PER_SOL / GRADUATION_THRESHOLD) * 100;
}

/**
 * Create buy instruction for the pump.fun program
 */
async function createBuyInstruction(
  connection: Connection,
  buyer: PublicKey,
  tokenMint: PublicKey,
  solAmount: number,
  minTokensOut: number,
  bondingCurvePda: PublicKey
): Promise<TransactionInstruction[]> {
  const instructions: TransactionInstruction[] = [];

  // Get or create associated token account
  const buyerTokenAccount = await getAssociatedTokenAddress(tokenMint, buyer);

  try {
    await getAccount(connection, buyerTokenAccount);
  } catch {
    // Account doesn't exist, create it
    instructions.push(
      createAssociatedTokenAccountInstruction(
        buyer,
        buyerTokenAccount,
        buyer,
        tokenMint
      )
    );
  }

  // Create the buy instruction
  // Note: This is a simplified version. The actual instruction data
  // depends on your specific smart contract implementation
  const buyIx = new TransactionInstruction({
    programId: PUMP_PROGRAM_ID,
    keys: [
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: tokenMint, isSigner: false, isWritable: true },
      { pubkey: bondingCurvePda, isSigner: false, isWritable: true },
      { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([
      0, // Buy instruction discriminator
      ...new Uint8Array(new Float64Array([solAmount * LAMPORTS_PER_SOL]).buffer),
      ...new Uint8Array(new Float64Array([minTokensOut]).buffer),
    ]),
  });

  instructions.push(buyIx);

  return instructions;
}

/**
 * Create sell instruction for the pump.fun program
 */
async function createSellInstruction(
  connection: Connection,
  seller: PublicKey,
  tokenMint: PublicKey,
  tokenAmount: number,
  minSolOut: number,
  bondingCurvePda: PublicKey
): Promise<TransactionInstruction[]> {
  const instructions: TransactionInstruction[] = [];

  const sellerTokenAccount = await getAssociatedTokenAddress(tokenMint, seller);

  // Create the sell instruction
  const sellIx = new TransactionInstruction({
    programId: PUMP_PROGRAM_ID,
    keys: [
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: tokenMint, isSigner: false, isWritable: true },
      { pubkey: bondingCurvePda, isSigner: false, isWritable: true },
      { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([
      1, // Sell instruction discriminator
      ...new Uint8Array(new Float64Array([tokenAmount]).buffer),
      ...new Uint8Array(new Float64Array([minSolOut * LAMPORTS_PER_SOL]).buffer),
    ]),
  });

  instructions.push(sellIx);

  return instructions;
}

/**
 * Get the bonding curve PDA for a token
 */
export function getBondingCurvePda(tokenMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bonding_curve'), tokenMint.toBuffer()],
    PUMP_PROGRAM_ID
  );
  return pda;
}

/**
 * Execute a buy transaction
 */
export async function executeBuy(
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  },
  tokenMint: string,
  solAmount: number,
  params: TradingParams = { slippageBps: DEFAULT_SLIPPAGE_BPS, priorityFee: 0 }
): Promise<string> {
  const mint = new PublicKey(tokenMint);
  const bondingCurvePda = getBondingCurvePda(mint);

  // Fetch current bonding curve state
  const bondingCurve = await fetchBondingCurveState(connection, bondingCurvePda);

  // Calculate expected output
  const estimate = calculateBuyAmount(solAmount, bondingCurve);
  const minTokensOut = getSlippageAdjustedAmount(estimate.outputAmount, params.slippageBps);

  // Build transaction
  const transaction = new Transaction();

  // Add priority fee if specified
  if (params.priorityFee > 0) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: params.priorityFee,
      })
    );
  }

  // Add compute budget
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200000,
    })
  );

  // Add buy instructions
  const buyInstructions = await createBuyInstruction(
    connection,
    wallet.publicKey,
    mint,
    solAmount,
    minTokensOut,
    bondingCurvePda
  );
  buyInstructions.forEach((ix) => transaction.add(ix));

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign and send transaction
  const signedTx = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

/**
 * Execute a sell transaction
 */
export async function executeSell(
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  },
  tokenMint: string,
  tokenAmount: number,
  params: TradingParams = { slippageBps: DEFAULT_SLIPPAGE_BPS, priorityFee: 0 }
): Promise<string> {
  const mint = new PublicKey(tokenMint);
  const bondingCurvePda = getBondingCurvePda(mint);

  // Fetch current bonding curve state
  const bondingCurve = await fetchBondingCurveState(connection, bondingCurvePda);

  // Calculate expected output
  const estimate = calculateSellAmount(tokenAmount, bondingCurve);
  const minSolOut = getSlippageAdjustedAmount(estimate.outputAmount, params.slippageBps);

  // Build transaction
  const transaction = new Transaction();

  // Add priority fee if specified
  if (params.priorityFee > 0) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: params.priorityFee,
      })
    );
  }

  // Add compute budget
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200000,
    })
  );

  // Add sell instructions
  const sellInstructions = await createSellInstruction(
    connection,
    wallet.publicKey,
    mint,
    tokenAmount,
    minSolOut,
    bondingCurvePda
  );
  sellInstructions.forEach((ix) => transaction.add(ix));

  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign and send transaction
  const signedTx = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

/**
 * Fetch bonding curve state from chain
 */
export async function fetchBondingCurveState(
  connection: Connection,
  bondingCurvePda: PublicKey
): Promise<BondingCurve> {
  const accountInfo = await connection.getAccountInfo(bondingCurvePda);

  if (!accountInfo) {
    throw new Error('Bonding curve account not found');
  }

  // Parse account data
  // Note: This parsing depends on your specific smart contract's account layout
  const data = accountInfo.data;

  // Example parsing (adjust based on your actual contract)
  const virtualSolReserves = Number(data.readBigUInt64LE(8));
  const virtualTokenReserves = Number(data.readBigUInt64LE(16));
  const realSolReserves = Number(data.readBigUInt64LE(24));
  const realTokenReserves = Number(data.readBigUInt64LE(32));
  const tokenTotalSupply = Number(data.readBigUInt64LE(40));
  const complete = data[48] === 1;

  const graduationThreshold = GRADUATION_THRESHOLD * LAMPORTS_PER_SOL;
  const currentProgress = (realSolReserves / graduationThreshold) * 100;

  return {
    virtualSolReserves,
    virtualTokenReserves,
    realSolReserves,
    realTokenReserves,
    tokenTotalSupply,
    complete,
    graduationThreshold,
    currentProgress,
  };
}

/**
 * Get user's token balance
 */
export async function getTokenBalance(
  connection: Connection,
  userPublicKey: PublicKey,
  tokenMint: PublicKey
): Promise<number> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(tokenMint, userPublicKey);
    const account = await getAccount(connection, tokenAccount);
    return Number(account.amount);
  } catch {
    return 0;
  }
}

/**
 * Estimate gas/priority fee for faster transactions
 */
export async function estimatePriorityFee(
  connection: Connection
): Promise<number> {
  try {
    const recentPrioritizationFees = await connection.getRecentPrioritizationFees();
    if (recentPrioritizationFees.length === 0) {
      return 1000; // Default 1000 micro lamports
    }

    // Get median fee
    const fees = recentPrioritizationFees.map((f) => f.prioritizationFee).sort((a, b) => a - b);
    const medianIndex = Math.floor(fees.length / 2);
    return fees[medianIndex] || 1000;
  } catch {
    return 1000;
  }
}

export default {
  calculateBuyAmount,
  calculateSellAmount,
  getSlippageAdjustedAmount,
  getCurrentPrice,
  getBondingCurveProgress,
  executeBuy,
  executeSell,
  fetchBondingCurveState,
  getTokenBalance,
  getBondingCurvePda,
  estimatePriorityFee,
};
