'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  creator: string;
  createdAt: string;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
  replies: number;
}

interface TrendingTokensResponse {
  tokens: Token[];
  total: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchTrendingTokens(limit: number = 10): Promise<TrendingTokensResponse> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tokens/trending`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    // Return mock data for development
    return {
      tokens: generateMockTrendingTokens(limit),
      total: limit,
    };
  }
}

function generateMockTrendingTokens(count: number): Token[] {
  const mockNames = [
    { name: 'Pepe Unchained', symbol: 'PEPU' },
    { name: 'Doge 2.0', symbol: 'DOGE2' },
    { name: 'Shiba Moon', symbol: 'SHIBM' },
    { name: 'Solana Cat', symbol: 'SOLCAT' },
    { name: 'Based AI', symbol: 'BASAI' },
    { name: 'Moon Rocket', symbol: 'MROCK' },
    { name: 'Floki Prime', symbol: 'FPRIME' },
    { name: 'Wojak Finance', symbol: 'WOJAK' },
    { name: 'Giga Chad', symbol: 'GIGA' },
    { name: 'Pump King', symbol: 'PKING' },
    { name: 'Degen Protocol', symbol: 'DEGEN' },
    { name: 'Solana Punk', symbol: 'SPUNK' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const mockToken = mockNames[i % mockNames.length];
    const randomMarketCap = Math.random() * 1000000 + 10000;
    const randomPrice = Math.random() * 0.01;
    const randomChange = (Math.random() - 0.3) * 100;
    const bondingProgress = Math.random() * 100;

    return {
      id: `token-${i}`,
      address: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      name: mockToken.name,
      symbol: mockToken.symbol,
      image: `https://picsum.photos/seed/${mockToken.symbol}/200`,
      description: `${mockToken.name} is the next big thing in DeFi!`,
      creator: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      marketCap: randomMarketCap,
      price: randomPrice,
      priceChange24h: randomChange,
      volume24h: randomMarketCap * (0.1 + Math.random() * 0.5),
      holders: Math.floor(Math.random() * 5000) + 100,
      bondingCurveProgress: bondingProgress,
      isGraduated: bondingProgress >= 100,
      replies: Math.floor(Math.random() * 500),
    };
  });
}

export function useTrendingTokens(limit: number = 10) {
  return useQuery({
    queryKey: ['trendingTokens', limit],
    queryFn: () => fetchTrendingTokens(limit),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Data is fresh for 10 seconds
  });
}

export default useTrendingTokens;
