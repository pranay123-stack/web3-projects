'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaHome, FaBuilding, FaStore, FaMapMarkerAlt, FaBed, FaBath, FaRuler } from 'react-icons/fa';

// Contract addresses - Update after deployment
const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || '0x0';
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '0x0';

// ABIs (simplified for demo)
const NFT_ABI = [
  {
    name: 'mintProperty',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' },
      { name: 'propertyAddress', type: 'string' },
      { name: 'propertyType', type: 'string' },
      { name: 'squareFeet', type: 'uint256' },
      { name: 'bedrooms', type: 'uint256' },
      { name: 'bathrooms', type: 'uint256' },
      { name: 'yearBuilt', type: 'uint256' },
      { name: 'legalDocumentHash', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'mintingFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalProperties',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getProperty',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'propertyAddress', type: 'string' },
          { name: 'propertyType', type: 'string' },
          { name: 'squareFeet', type: 'uint256' },
          { name: 'bedrooms', type: 'uint256' },
          { name: 'bathrooms', type: 'uint256' },
          { name: 'yearBuilt', type: 'uint256' },
          { name: 'legalDocumentHash', type: 'string' },
          { name: 'isVerified', type: 'bool' },
          { name: 'originalOwner', type: 'address' },
          { name: 'mintedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

const MARKETPLACE_ABI = [
  {
    name: 'listProperty',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'buyProperty',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getListing',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'seller', type: 'address' },
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'paymentToken', type: 'address' },
          { name: 'isActive', type: 'bool' },
          { name: 'listedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'totalListings',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'explore' | 'mint' | 'my-properties'>('explore');

  // Mint form state
  const [mintForm, setMintForm] = useState({
    propertyAddress: '',
    propertyType: 'house',
    squareFeet: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    metadataURI: '',
  });

  // Contract reads
  const { data: mintingFee } = useReadContract({
    address: NFT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'mintingFee',
  });

  const { data: totalProperties } = useReadContract({
    address: NFT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'totalProperties',
  });

  // Contract writes
  const { writeContract: mintNFT, data: mintHash, isPending: isMinting } = useWriteContract();
  const { isLoading: isConfirmingMint, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  useEffect(() => {
    if (isMintSuccess) {
      toast.success('Property NFT minted successfully!');
      setMintForm({
        propertyAddress: '',
        propertyType: 'house',
        squareFeet: '',
        bedrooms: '',
        bathrooms: '',
        yearBuilt: '',
        metadataURI: '',
      });
    }
  }, [isMintSuccess]);

  const handleMint = async () => {
    if (!address || !mintingFee) return;

    try {
      mintNFT({
        address: NFT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mintProperty',
        args: [
          address,
          mintForm.metadataURI || 'ipfs://default',
          mintForm.propertyAddress,
          mintForm.propertyType,
          BigInt(mintForm.squareFeet || 0),
          BigInt(mintForm.bedrooms || 0),
          BigInt(mintForm.bathrooms || 0),
          BigInt(mintForm.yearBuilt || 2024),
          'QmLegalDocHash',
        ],
        value: mintingFee,
      });
    } catch (error) {
      toast.error('Failed to mint property');
      console.error(error);
    }
  };

  const propertyTypes = [
    { value: 'house', label: 'House', icon: FaHome },
    { value: 'apartment', label: 'Apartment', icon: FaBuilding },
    { value: 'office', label: 'Office', icon: FaBuilding },
    { value: 'retail', label: 'Retail Store', icon: FaStore },
    { value: 'land', label: 'Land', icon: FaMapMarkerAlt },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaHome className="text-3xl text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-800">Real Estate NFT Marketplace</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Stats Banner */}
      <div className="bg-primary-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold">{totalProperties?.toString() || '0'}</p>
            <p className="text-sm opacity-80">Properties Listed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{mintingFee ? formatEther(mintingFee) : '0'} ETH</p>
            <p className="text-sm opacity-80">Minting Fee</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">2.5%</p>
            <p className="text-sm opacity-80">Platform Fee</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 border-b border-gray-200">
          {['explore', 'mint', 'my-properties'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-3 font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Explore Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Property Cards */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card">
                  <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center">
                    <FaHome className="text-6xl text-primary-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Property #{i}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    <FaMapMarkerAlt className="inline mr-1" />
                    123 Sample Street, City
                  </p>
                  <div className="flex gap-4 text-gray-500 text-sm mb-4">
                    <span><FaBed className="inline mr-1" />3</span>
                    <span><FaBath className="inline mr-1" />2</span>
                    <span><FaRuler className="inline mr-1" />1,500 sqft</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xl text-primary-600">0.5 ETH</span>
                    <button className="btn-primary text-sm px-4 py-2">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mint Tab */}
        {activeTab === 'mint' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Mint Property NFT</h2>
            {!isConnected ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 mb-4">Connect your wallet to mint property NFTs</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="card">
                <div className="space-y-4">
                  {/* Property Address */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Property Address *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="123 Main Street, Mumbai, India"
                      value={mintForm.propertyAddress}
                      onChange={(e) => setMintForm({ ...mintForm, propertyAddress: e.target.value })}
                    />
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Property Type *</label>
                    <div className="grid grid-cols-5 gap-2">
                      {propertyTypes.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setMintForm({ ...mintForm, propertyType: value })}
                          className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                            mintForm.propertyType === value
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="text-xl" />
                          <span className="text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Square Feet *</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="1500"
                        value={mintForm.squareFeet}
                        onChange={(e) => setMintForm({ ...mintForm, squareFeet: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Year Built</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="2020"
                        value={mintForm.yearBuilt}
                        onChange={(e) => setMintForm({ ...mintForm, yearBuilt: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Bedrooms/Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bedrooms</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="3"
                        value={mintForm.bedrooms}
                        onChange={(e) => setMintForm({ ...mintForm, bedrooms: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bathrooms</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="2"
                        value={mintForm.bathrooms}
                        onChange={(e) => setMintForm({ ...mintForm, bathrooms: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Metadata URI */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Metadata URI (IPFS)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ipfs://Qm..."
                      value={mintForm.metadataURI}
                      onChange={(e) => setMintForm({ ...mintForm, metadataURI: e.target.value })}
                    />
                  </div>

                  {/* Fee Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Minting Fee: <span className="font-bold">{mintingFee ? formatEther(mintingFee) : '0'} ETH</span>
                    </p>
                  </div>

                  {/* Mint Button */}
                  <button
                    onClick={handleMint}
                    disabled={isMinting || isConfirmingMint || !mintForm.propertyAddress || !mintForm.squareFeet}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMinting || isConfirmingMint ? 'Minting...' : 'Mint Property NFT'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Properties Tab */}
        {activeTab === 'my-properties' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Properties</h2>
            {!isConnected ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 mb-4">Connect your wallet to view your properties</p>
                <ConnectButton />
              </div>
            ) : (
              <div className="card text-center py-12">
                <FaHome className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No properties yet. Mint your first property NFT!</p>
                <button
                  onClick={() => setActiveTab('mint')}
                  className="btn-primary mt-4"
                >
                  Mint Property
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">Real Estate NFT Marketplace - Tokenizing Property Ownership</p>
          <p className="text-sm text-gray-500 mt-2">Built on Polygon Network</p>
        </div>
      </footer>
    </main>
  );
}
