'use client';

export interface IPFSUploadResult {
  hash: string;
  url: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

// IPFS Gateway URLs
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

// Pinata API endpoints (free tier available)
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// NFT.Storage API (free, backed by Filecoin)
const NFT_STORAGE_API_URL = 'https://api.nft.storage';

class IPFSService {
  private pinataApiKey: string | null = null;
  private pinataSecretKey: string | null = null;
  private nftStorageApiKey: string | null = null;

  constructor() {
    // Keys should be set via environment variables
    if (typeof window !== 'undefined') {
      this.pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || null;
      this.pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || null;
      this.nftStorageApiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY || null;
    }
  }

  /**
   * Upload an image file to IPFS
   */
  async uploadImage(file: File): Promise<IPFSUploadResult> {
    // Try NFT.Storage first (free and reliable)
    if (this.nftStorageApiKey) {
      try {
        return await this.uploadToNFTStorage(file);
      } catch (error) {
        console.warn('NFT.Storage upload failed, trying Pinata...', error);
      }
    }

    // Try Pinata as fallback
    if (this.pinataApiKey && this.pinataSecretKey) {
      try {
        return await this.uploadToPinata(file);
      } catch (error) {
        console.warn('Pinata upload failed, using mock...', error);
      }
    }

    // Fallback to mock upload for development
    return this.mockUpload(file);
  }

  /**
   * Upload metadata JSON to IPFS
   */
  async uploadMetadata(metadata: TokenMetadata): Promise<IPFSUploadResult> {
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });

    // Try NFT.Storage first
    if (this.nftStorageApiKey) {
      try {
        return await this.uploadToNFTStorage(file);
      } catch (error) {
        console.warn('NFT.Storage metadata upload failed, trying Pinata...', error);
      }
    }

    // Try Pinata as fallback
    if (this.pinataApiKey && this.pinataSecretKey) {
      try {
        return await this.uploadToPinata(file);
      } catch (error) {
        console.warn('Pinata metadata upload failed, using mock...', error);
      }
    }

    // Fallback to mock upload for development
    return this.mockUpload(file);
  }

  /**
   * Upload to NFT.Storage (free, backed by Filecoin)
   */
  private async uploadToNFTStorage(file: File): Promise<IPFSUploadResult> {
    const response = await fetch(`${NFT_STORAGE_API_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.nftStorageApiKey}`,
      },
      body: file,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NFT.Storage upload failed: ${error}`);
    }

    const data = await response.json();
    const hash = data.value.cid;

    return {
      hash,
      url: `https://nftstorage.link/ipfs/${hash}`,
    };
  }

  /**
   * Upload to Pinata
   */
  private async uploadToPinata(file: File): Promise<IPFSUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        pinata_api_key: this.pinataApiKey!,
        pinata_secret_api_key: this.pinataSecretKey!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${error}`);
    }

    const data = await response.json();
    return {
      hash: data.IpfsHash,
      url: `${PINATA_GATEWAY}${data.IpfsHash}`,
    };
  }

  /**
   * Mock upload for development (returns fake hash)
   */
  private async mockUpload(file: File): Promise<IPFSUploadResult> {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a fake CID based on file content
    const buffer = await file.arrayBuffer();
    const hashArray = new Uint8Array(buffer);
    let hash = 'Qm';
    for (let i = 0; i < 44; i++) {
      const charCode = hashArray[i % hashArray.length] || Math.floor(Math.random() * 256);
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      hash += chars[charCode % chars.length];
    }

    console.warn('Using mock IPFS upload. Set NEXT_PUBLIC_NFT_STORAGE_API_KEY or Pinata keys for real uploads.');

    return {
      hash,
      url: `${IPFS_GATEWAYS[0]}${hash}`,
    };
  }

  /**
   * Get accessible URL from IPFS hash
   */
  getIPFSUrl(hash: string, gatewayIndex = 0): string {
    const cleanHash = hash.replace('ipfs://', '').replace(/^\/ipfs\//, '');
    return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${cleanHash}`;
  }

  /**
   * Convert IPFS URL to gateway URL
   */
  ipfsToHttp(ipfsUrl: string): string {
    if (ipfsUrl.startsWith('ipfs://')) {
      const hash = ipfsUrl.replace('ipfs://', '');
      return this.getIPFSUrl(hash);
    }
    if (ipfsUrl.startsWith('/ipfs/')) {
      const hash = ipfsUrl.replace('/ipfs/', '');
      return this.getIPFSUrl(hash);
    }
    return ipfsUrl;
  }

  /**
   * Check if IPFS upload is configured
   */
  isConfigured(): boolean {
    return !!(this.nftStorageApiKey || (this.pinataApiKey && this.pinataSecretKey));
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();

// Export class for testing
export { IPFSService };
