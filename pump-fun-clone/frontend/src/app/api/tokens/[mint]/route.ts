import { NextRequest, NextResponse } from 'next/server';
import type { TokenDetails, ApiResponse, BondingCurve, PriceDataPoint, Holder, Comment } from '@/types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Mock data for development
const mockBondingCurve: BondingCurve = {
  virtualSolReserves: 30_000_000_000, // 30 SOL
  virtualTokenReserves: 1_000_000_000_000_000, // 1B tokens
  realSolReserves: 45_000_000_000, // 45 SOL raised
  realTokenReserves: 200_000_000_000_000, // 200M tokens remaining
  tokenTotalSupply: 1_000_000_000_000_000,
  complete: false,
  graduationThreshold: 85_000_000_000, // 85 SOL
  currentProgress: 52.9,
};

function generateMockToken(mint: string): TokenDetails {
  return {
    id: mint,
    address: mint,
    name: 'Sample Token',
    symbol: 'SMPL',
    description: 'This is a sample token for testing purposes. It was created to demonstrate the pump.fun clone functionality.',
    image: `https://picsum.photos/seed/${mint}/400/400`,
    creator: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    marketCap: 45000,
    price: 0.000045,
    priceChange24h: 12.5,
    volume24h: 15000,
    holders: 234,
    bondingCurveProgress: mockBondingCurve.currentProgress,
    isGraduated: false,
    totalSupply: 1_000_000_000,
    circulatingSupply: 800_000_000,
    creatorAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    bondingCurve: mockBondingCurve,
    socialLinks: {
      twitter: 'https://twitter.com/sample',
      telegram: 'https://t.me/sample',
      website: 'https://sample.com',
    },
    tradingEnabled: true,
  };
}

/**
 * GET /api/tokens/[mint]
 * Fetch token details by mint address
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
): Promise<NextResponse<ApiResponse<TokenDetails>>> {
  try {
    const { mint } = await params;

    if (!mint || mint.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid mint address' },
        { status: 400 }
      );
    }

    // Try to fetch from backend API
    try {
      const response = await fetch(`${API_BASE_URL}/api/tokens/${mint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ success: true, data: data.data || data });
      }
    } catch (backendError) {
      console.warn('Backend API unavailable, using mock data:', backendError);
    }

    // Return mock data for development
    const mockToken = generateMockToken(mint);
    return NextResponse.json({ success: true, data: mockToken });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock chart data
 */
function generateMockChartData(interval: string): PriceDataPoint[] {
  const points: PriceDataPoint[] = [];
  const now = Date.now();
  let basePrice = 0.00003;
  const intervalMs = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
  }[interval] || 300000;

  const count = 100;

  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const volatility = (Math.random() - 0.45) * 0.00001;
    basePrice = Math.max(0.00001, basePrice + volatility);

    const open = basePrice;
    const close = basePrice + (Math.random() - 0.5) * 0.000005;
    const high = Math.max(open, close) + Math.random() * 0.000002;
    const low = Math.min(open, close) - Math.random() * 0.000002;

    points.push({
      timestamp,
      price: close,
      volume: Math.random() * 10000,
      open,
      high,
      low,
      close,
    });
  }

  return points;
}

/**
 * Generate mock holders data
 */
function generateMockHolders(mint: string): Holder[] {
  const holders: Holder[] = [
    {
      address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      username: 'creator.sol',
      balance: 100_000_000,
      percentage: 10,
      isCreator: true,
    },
    {
      address: 'BVChZ3XFEwTMUk1o9i3HAf91H6mFxSwa5X2wFAWhYPhU',
      username: 'whale1.sol',
      balance: 80_000_000,
      percentage: 8,
      isCreator: false,
    },
    {
      address: '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5',
      balance: 50_000_000,
      percentage: 5,
      isCreator: false,
    },
    {
      address: 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR',
      balance: 30_000_000,
      percentage: 3,
      isCreator: false,
    },
    {
      address: 'Ey8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSAA',
      balance: 25_000_000,
      percentage: 2.5,
      isCreator: false,
    },
  ];

  return holders;
}

/**
 * Generate mock comments
 */
function generateMockComments(mint: string): Comment[] {
  return [
    {
      id: '1',
      tokenAddress: mint,
      author: {
        address: 'BVChZ3XFEwTMUk1o9i3HAf91H6mFxSwa5X2wFAWhYPhU',
        username: 'degen_trader',
        avatar: 'https://picsum.photos/seed/user1/100/100',
      },
      content: 'This token is going to moon! Just loaded my bags.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      likes: 24,
      isLiked: false,
    },
    {
      id: '2',
      tokenAddress: mint,
      author: {
        address: '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5',
        username: 'sol_maxi',
      },
      content: 'Dev seems based. Community is active. Aping in.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 15,
      isLiked: true,
    },
    {
      id: '3',
      tokenAddress: mint,
      author: {
        address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        username: 'creator.sol',
        avatar: 'https://picsum.photos/seed/creator/100/100',
      },
      content: 'Thanks for the support everyone! Big announcement coming soon.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 45,
      isLiked: false,
    },
  ];
}
