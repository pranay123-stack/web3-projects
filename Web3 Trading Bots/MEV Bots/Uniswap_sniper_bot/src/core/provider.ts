import {
  JsonRpcProvider,
  WebSocketProvider,
  Wallet,
  Contract,
  TransactionRequest,
  TransactionResponse,
  TransactionReceipt,
  Block,
  FeeData,
  HDNodeWallet
} from 'ethers';
import { EventEmitter } from 'eventemitter3';
import { config } from '../config';
import { createComponentLogger } from '../utils/logger';
import { retry, sleep } from '../utils/helpers';

const logger = createComponentLogger('Provider');

interface ProviderEvents {
  'block': (blockNumber: number) => void;
  'pendingTransaction': (txHash: string) => void;
  'error': (error: Error) => void;
  'reconnect': () => void;
  'disconnect': () => void;
}

export class ProviderManager extends EventEmitter<ProviderEvents> {
  private httpProvider: JsonRpcProvider;
  private wsProvider: WebSocketProvider | null = null;
  private wallet: Wallet | HDNodeWallet;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private pendingTxSubscription: any = null;

  constructor() {
    super();
    this.httpProvider = new JsonRpcProvider(config.network.rpcUrl, {
      chainId: config.network.chainId,
      name: config.network.name
    });

    if (config.privateKey) {
      this.wallet = new Wallet(config.privateKey, this.httpProvider);
    } else {
      this.wallet = Wallet.createRandom().connect(this.httpProvider);
      logger.warn('No private key provided, using random wallet for read-only operations');
    }
  }

  async initialize(): Promise<void> {
    try {
      // Verify HTTP connection
      const network = await this.httpProvider.getNetwork();
      logger.info(`Connected to ${network.name} (chainId: ${network.chainId})`);

      // Initialize WebSocket connection
      await this.initializeWebSocket();

      this.isConnected = true;
      logger.info('Provider manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize provider manager', { error });
      throw error;
    }
  }

  private async initializeWebSocket(): Promise<void> {
    if (!config.network.wssUrl) {
      logger.warn('No WebSocket URL provided, pending tx monitoring will be limited');
      return;
    }

    try {
      this.wsProvider = new WebSocketProvider(config.network.wssUrl, {
        chainId: config.network.chainId,
        name: config.network.name
      });

      // Subscribe to new blocks
      this.wsProvider.on('block', (blockNumber: number) => {
        this.emit('block', blockNumber);
      });

      // Handle WebSocket errors
      const ws = this.wsProvider.websocket as any;
      if (ws && typeof ws.on === 'function') {
        ws.on('error', (error: Error) => {
          logger.error('WebSocket error', { error: error.message });
          this.handleDisconnect();
        });

        ws.on('close', () => {
          logger.warn('WebSocket connection closed');
          this.handleDisconnect();
        });
      }

      logger.info('WebSocket provider initialized');
    } catch (error) {
      logger.error('Failed to initialize WebSocket provider', { error });
    }
  }

  private async handleDisconnect(): Promise<void> {
    this.emit('disconnect');

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    await sleep(delay);

    try {
      await this.initializeWebSocket();
      this.reconnectAttempts = 0;
      this.emit('reconnect');
    } catch (error) {
      this.handleDisconnect();
    }
  }

  async subscribeToPendingTransactions(callback: (tx: TransactionResponse) => void): Promise<void> {
    if (!this.wsProvider) {
      logger.warn('WebSocket not available for pending tx subscription');
      return;
    }

    try {
      // Subscribe to pending transactions
      this.wsProvider.on('pending', async (txHash: string) => {
        try {
          const tx = await this.getTransaction(txHash);
          if (tx) {
            callback(tx);
          }
        } catch (error) {
          // Transaction might be dropped before we can fetch it
        }
      });

      logger.info('Subscribed to pending transactions');
    } catch (error) {
      logger.error('Failed to subscribe to pending transactions', { error });
    }
  }

  // Provider Methods
  getHttpProvider(): JsonRpcProvider {
    return this.httpProvider;
  }

  getWsProvider(): WebSocketProvider | null {
    return this.wsProvider;
  }

  getWallet(): Wallet | HDNodeWallet {
    return this.wallet;
  }

  getAddress(): string {
    return this.wallet.address;
  }

  async getBalance(address?: string): Promise<bigint> {
    const target = address || this.wallet.address;
    return retry(() => this.httpProvider.getBalance(target));
  }

  async getBlockNumber(): Promise<number> {
    return retry(() => this.httpProvider.getBlockNumber());
  }

  async getBlock(blockNumber: number | string = 'latest'): Promise<Block | null> {
    return retry(() => this.httpProvider.getBlock(blockNumber));
  }

  async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    return this.httpProvider.getTransaction(txHash);
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    return retry(() => this.httpProvider.getTransactionReceipt(txHash));
  }

  async getFeeData(): Promise<FeeData> {
    return retry(() => this.httpProvider.getFeeData());
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    return retry(() => this.httpProvider.estimateGas(tx));
  }

  async getGasPrice(): Promise<bigint> {
    const feeData = await this.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  async getNonce(address?: string): Promise<number> {
    const target = address || this.wallet.address;
    return retry(() => this.httpProvider.getTransactionCount(target, 'pending'));
  }

  // Transaction Methods
  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    return this.wallet.sendTransaction(tx);
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    return this.wallet.signTransaction(tx);
  }

  // Contract Methods
  getContract(address: string, abi: any[]): Contract {
    return new Contract(address, abi, this.wallet);
  }

  getReadOnlyContract(address: string, abi: any[]): Contract {
    return new Contract(address, abi, this.httpProvider);
  }

  // Utility Methods
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<TransactionReceipt | null> {
    return this.httpProvider.waitForTransaction(txHash, confirmations);
  }

  async call(tx: TransactionRequest): Promise<string> {
    return this.httpProvider.call(tx);
  }

  isConnectionHealthy(): boolean {
    return this.isConnected;
  }

  async destroy(): Promise<void> {
    if (this.wsProvider) {
      await this.wsProvider.destroy();
    }
    this.removeAllListeners();
    logger.info('Provider manager destroyed');
  }
}

// Singleton instance
let providerManager: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!providerManager) {
    providerManager = new ProviderManager();
  }
  return providerManager;
}

export async function initializeProvider(): Promise<ProviderManager> {
  const manager = getProviderManager();
  await manager.initialize();
  return manager;
}
