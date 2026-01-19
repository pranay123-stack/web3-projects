import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { User, Session, ApiResponse } from '@/types';
import { generateRandomString } from '@/lib/utils';

// API base URL - should be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Nonce storage (in production, this should be handled server-side with Redis/DB)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Nonce expiry time (5 minutes)
const NONCE_EXPIRY = 5 * 60 * 1000;

// Session expiry time (7 days)
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a nonce for wallet signature verification
 */
export async function generateNonce(walletAddress: string): Promise<string> {
  const nonce = generateRandomString(32);
  const timestamp = Date.now();

  // Store nonce with timestamp
  nonceStore.set(walletAddress, { nonce, timestamp });

  // Clean up expired nonces
  cleanupExpiredNonces();

  return nonce;
}

/**
 * Create the message to be signed by the wallet
 */
export function createSignMessage(nonce: string, walletAddress: string): string {
  const domain = typeof window !== 'undefined' ? window.location.host : 'pump.fun';
  const timestamp = new Date().toISOString();

  return `Welcome to Pump.Fun!

Sign this message to verify your wallet ownership.

Domain: ${domain}
Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Verify a signed message from the wallet
 */
export async function verifySignature(
  walletAddress: string,
  signature: Uint8Array,
  message: string
): Promise<boolean> {
  try {
    // Get stored nonce
    const storedData = nonceStore.get(walletAddress);
    if (!storedData) {
      console.error('No nonce found for wallet');
      return false;
    }

    // Check nonce expiry
    if (Date.now() - storedData.timestamp > NONCE_EXPIRY) {
      nonceStore.delete(walletAddress);
      console.error('Nonce expired');
      return false;
    }

    // Verify the message contains the correct nonce
    if (!message.includes(storedData.nonce)) {
      console.error('Message does not contain valid nonce');
      return false;
    }

    // Import nacl for signature verification
    const nacl = await import('tweetnacl');

    // Encode message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);

    // Get public key from wallet address
    const publicKey = new PublicKey(walletAddress);

    // Verify signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signature,
      publicKey.toBytes()
    );

    // Clear nonce after verification attempt
    nonceStore.delete(walletAddress);

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Create a session for authenticated user
 */
export async function createSession(walletAddress: string): Promise<Session> {
  const sessionToken = generateRandomString(64);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY).toISOString();

  // In production, this would make an API call to create the session server-side
  // For now, we create a mock session
  const user: User = {
    id: walletAddress,
    address: walletAddress,
    username: undefined,
    avatar: undefined,
    bio: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      tokensCreated: 0,
      totalTrades: 0,
      totalVolume: 0,
      totalPnL: 0,
      followers: 0,
      following: 0,
    },
  };

  return {
    token: sessionToken,
    expiresAt,
    user,
  };
}

/**
 * Full authentication flow
 */
export async function authenticate(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<ApiResponse<Session>> {
  try {
    // Step 1: Generate nonce
    const nonce = await generateNonce(walletAddress);

    // Step 2: Create message to sign
    const message = createSignMessage(nonce, walletAddress);

    // Step 3: Request signature from wallet
    const messageBytes = new TextEncoder().encode(message);
    const signature = await signMessage(messageBytes);

    // Step 4: Verify signature
    const isValid = await verifySignature(walletAddress, signature, message);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid signature. Please try again.',
      };
    }

    // Step 5: Create session
    const session = await createSession(walletAddress);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Fetch user profile from API
 */
export async function fetchUserProfile(address: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}`);

    if (!response.ok) {
      if (response.status === 404) {
        // User not found - return default profile
        return {
          success: true,
          data: {
            id: address,
            address,
            username: undefined,
            avatar: undefined,
            bio: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: {
              tokensCreated: 0,
              totalTrades: 0,
              totalVolume: 0,
              totalPnL: 0,
              followers: 0,
              following: 0,
            },
          },
        };
      }
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Fetch user profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  address: string,
  updates: Partial<User>,
  sessionToken: string
): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Update user profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  file: File,
  sessionToken: string
): Promise<ApiResponse<{ url: string }>> {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Upload avatar error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload avatar',
    };
  }
}

/**
 * Validate session token
 */
export async function validateSession(sessionToken: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: 'Invalid session' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Validate session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session validation failed',
    };
  }
}

/**
 * Logout / invalidate session
 */
export async function logout(sessionToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Clean up expired nonces
 */
function cleanupExpiredNonces(): void {
  const now = Date.now();
  for (const [address, data] of nonceStore.entries()) {
    if (now - data.timestamp > NONCE_EXPIRY) {
      nonceStore.delete(address);
    }
  }
}

/**
 * Follow/unfollow a user
 */
export async function toggleFollow(
  targetAddress: string,
  sessionToken: string
): Promise<ApiResponse<{ isFollowing: boolean }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${targetAddress}/follow`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle follow');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Toggle follow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle follow',
    };
  }
}

export const authService = {
  generateNonce,
  createSignMessage,
  verifySignature,
  createSession,
  authenticate,
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  validateSession,
  logout,
  toggleFollow,
};

export default authService;
