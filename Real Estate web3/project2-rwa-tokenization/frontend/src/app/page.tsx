'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FaBuilding, FaChartLine, FaUsers, FaShieldAlt,
  FaCoins, FaGlobe, FaFileContract, FaMoneyBillWave,
  FaCheckCircle, FaTimesCircle, FaLock
} from 'react-icons/fa';

// Contract addresses - Update after deployment
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0';
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0x0';

// ABIs (simplified)
const FACTORY_ABI = [
  {
    name: 'totalProperties',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'deploymentFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getAllPropertyTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
  },
] as const;

const TOKEN_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getPropertyInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'propertyId', type: 'string' },
          { name: 'propertyAddress', type: 'string' },
          { name: 'propertyType', type: 'string' },
          { name: 'totalValue', type: 'uint256' },
          { name: 'tokenizedPercentage', type: 'uint256' },
          { name: 'legalDocumentURI', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'pendingDividends',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'investor', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalDividendsDistributed',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claimDividends',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'invest' | 'compliance'>('dashboard');

  // Contract reads
  const { data: totalProperties } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'totalProperties',
  });

  const { data: tokenBalance } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: pendingDividends } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'pendingDividends',
    args: address ? [address] : undefined,
  });

  const { data: totalDividends } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'totalDividendsDistributed',
  });

  const { data: propertyInfo } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'getPropertyInfo',
  });

  // Contract writes
  const { writeContract: claimDividends, data: claimHash, isPending: isClaiming } = useWriteContract();
  const { isLoading: isConfirmingClaim, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Dividends claimed successfully!');
    }
  }, [isClaimSuccess]);

  const handleClaimDividends = async () => {
    try {
      claimDividends({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'claimDividends',
      });
    } catch (error) {
      toast.error('Failed to claim dividends');
      console.error(error);
    }
  };

  const formatUSD = (value: bigint | undefined) => {
    if (!value) return '$0';
    const formatted = Number(formatEther(value));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(formatted);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaBuilding className="text-3xl text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">RWA Tokenization</h1>
              <p className="text-xs text-gray-500">Fractional Real Estate Investment</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card bg-white/10 backdrop-blur">
              <FaBuilding className="text-3xl mb-2" />
              <p className="text-3xl font-bold">{totalProperties?.toString() || '0'}</p>
              <p className="text-sm opacity-80">Tokenized Properties</p>
            </div>
            <div className="stat-card bg-white/10 backdrop-blur">
              <FaCoins className="text-3xl mb-2" />
              <p className="text-3xl font-bold">{tokenBalance ? formatEther(tokenBalance) : '0'}</p>
              <p className="text-sm opacity-80">Your Token Balance</p>
            </div>
            <div className="stat-card bg-white/10 backdrop-blur">
              <FaMoneyBillWave className="text-3xl mb-2" />
              <p className="text-3xl font-bold">{pendingDividends ? formatEther(pendingDividends) : '0'} ETH</p>
              <p className="text-sm opacity-80">Pending Dividends</p>
            </div>
            <div className="stat-card bg-white/10 backdrop-blur">
              <FaChartLine className="text-3xl mb-2" />
              <p className="text-3xl font-bold">{totalDividends ? formatEther(totalDividends) : '0'} ETH</p>
              <p className="text-sm opacity-80">Total Dividends Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
            { id: 'properties', label: 'Properties', icon: FaBuilding },
            { id: 'invest', label: 'Invest', icon: FaCoins },
            { id: 'compliance', label: 'Compliance', icon: FaShieldAlt },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Investment Dashboard</h2>

            {!isConnected ? (
              <div className="card text-center py-12">
                <FaLock className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Connect your wallet to view your investments</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Holdings Card */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaCoins className="text-primary-600" />
                    Your Holdings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Token Balance</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {tokenBalance ? formatEther(tokenBalance) : '0'} Tokens
                        </p>
                      </div>
                      <FaCoins className="text-4xl text-gray-300" />
                    </div>
                    {propertyInfo && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Property Value</p>
                        <p className="text-xl font-bold">{formatUSD(propertyInfo.totalValue)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dividends Card */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" />
                    Dividend Income
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Pending Dividends</p>
                        <p className="text-2xl font-bold text-green-600">
                          {pendingDividends ? formatEther(pendingDividends) : '0'} ETH
                        </p>
                      </div>
                      <button
                        onClick={handleClaimDividends}
                        disabled={isClaiming || isConfirmingClaim || !pendingDividends || pendingDividends === 0n}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming || isConfirmingClaim ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Dividends Distributed</p>
                      <p className="text-xl font-bold">{totalDividends ? formatEther(totalDividends) : '0'} ETH</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tokenized Properties</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Property Card */}
              <div className="card">
                <div className="h-48 bg-gradient-to-br from-primary-100 to-purple-200 rounded-lg mb-4 flex items-center justify-center">
                  <FaBuilding className="text-6xl text-primary-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">Commercial</span>
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {propertyInfo?.propertyId || 'Mumbai Office Tower'}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  <FaGlobe className="inline mr-1" />
                  {propertyInfo?.propertyAddress || '123 Business Park, Mumbai'}
                </p>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total Value</span>
                    <span className="font-bold">{formatUSD(propertyInfo?.totalValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tokenized</span>
                    <span className="font-bold">{propertyInfo?.tokenizedPercentage ? Number(propertyInfo.tokenizedPercentage) / 100 : 100}%</span>
                  </div>
                </div>
                <button className="w-full btn-primary mt-4">View Details</button>
              </div>

              {/* Add More Properties Placeholder */}
              <div className="card border-dashed border-2 border-gray-300 flex flex-col items-center justify-center py-12">
                <FaBuilding className="text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">More properties coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Invest Tab */}
        {activeTab === 'invest' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Investment Portal</h2>

            {!isConnected ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 mb-4">Connect your wallet to invest in properties</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Investment Options */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4">How It Works</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: 'Complete KYC', desc: 'Verify your identity to become an eligible investor', icon: FaUsers },
                      { step: 2, title: 'Choose Property', desc: 'Browse tokenized properties and select your investment', icon: FaBuilding },
                      { step: 3, title: 'Purchase Tokens', desc: 'Buy fractional ownership tokens representing property shares', icon: FaCoins },
                      { step: 4, title: 'Earn Dividends', desc: 'Receive rental income proportional to your holdings', icon: FaMoneyBillWave },
                    ].map(({ step, title, desc, icon: Icon }) => (
                      <div key={step} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                          {step}
                        </div>
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <Icon className="text-primary-600" />
                            {title}
                          </p>
                          <p className="text-sm text-gray-600">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Form */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4">Quick Invest</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Select Property</label>
                      <select className="input-field">
                        <option>Mumbai Office Tower (MOT)</option>
                        <option disabled>More properties coming soon...</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Investment Amount (ETH)</label>
                      <input type="number" className="input-field" placeholder="0.1" step="0.01" />
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">You will receive approximately:</p>
                      <p className="text-2xl font-bold text-primary-600">~100 Tokens</p>
                    </div>
                    <button className="w-full btn-primary">
                      Invest Now
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      * Requires KYC verification. Investment subject to compliance checks.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Compliance & KYC</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* KYC Status */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-primary-600" />
                  Your Compliance Status
                </h3>
                {!isConnected ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Connect wallet to check status</p>
                    <ConnectButton />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaCheckCircle className="text-2xl text-green-500" />
                        <div>
                          <p className="font-semibold">Wallet Connected</p>
                          <p className="text-xs text-gray-500">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaFileContract className="text-2xl text-yellow-500" />
                        <div>
                          <p className="font-semibold">KYC Verification</p>
                          <p className="text-xs text-gray-500">Identity verification</p>
                        </div>
                      </div>
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaGlobe className="text-2xl text-gray-400" />
                        <div>
                          <p className="font-semibold">Country Verification</p>
                          <p className="text-xs text-gray-500">Jurisdiction check</p>
                        </div>
                      </div>
                      <span className="text-gray-400 font-semibold">Not Started</span>
                    </div>
                    <button className="w-full btn-primary">
                      Complete KYC
                    </button>
                  </div>
                )}
              </div>

              {/* Compliance Info */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4">ERC-3643 Compliance</h3>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    This platform implements ERC-3643 (T-REX) standard for security token compliance:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'KYC/AML verification required for all investors',
                      'Country-based transfer restrictions',
                      'Maximum investor limits per property',
                      'Minimum and maximum holding amounts',
                      'Holding period enforcement',
                      'On-chain identity registry',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> All transfers are validated against the compliance module.
                      Transfers that don't meet compliance requirements will be rejected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold mb-4">RWA Tokenization Platform</h4>
              <p className="text-gray-400 text-sm">
                Democratizing real estate investment through blockchain technology.
                Compliant, secure, and transparent fractional ownership.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>Fractional Ownership</li>
                <li>Automated Dividends</li>
                <li>KYC/AML Compliance</li>
                <li>Secondary Trading</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Standards</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>ERC-3643 Compliant</li>
                <li>ERC-20 Compatible</li>
                <li>Polygon Network</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            Built for demonstration purposes. Not financial advice.
          </div>
        </div>
      </footer>
    </main>
  );
}
