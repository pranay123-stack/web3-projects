import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ShoppingCart, Filter, TrendingUp } from 'lucide-react';

// Mock data for demonstration
const mockListings = [
  {
    id: 1,
    projectName: 'Amazon Rainforest REDD+',
    projectType: 'REDD+ Reforestation',
    location: 'Amazon Basin, Brazil',
    creditAmount: 100,
    vintage: 2024,
    standard: 'Verra VCS',
    price: 25.50,
    seller: '0x1234...5678',
  },
  {
    id: 2,
    projectName: 'Texas Wind Farm',
    projectType: 'Renewable Energy',
    location: 'Texas, USA',
    creditAmount: 50,
    vintage: 2024,
    standard: 'Gold Standard',
    price: 18.75,
    seller: '0xabcd...ef12',
  },
  {
    id: 3,
    projectName: 'Kenya Cookstove Distribution',
    projectType: 'Energy Efficiency',
    location: 'Kenya',
    creditAmount: 75,
    vintage: 2023,
    standard: 'Verra VCS',
    price: 22.00,
    seller: '0x9876...4321',
  },
  {
    id: 4,
    projectName: 'Indonesian Mangrove Restoration',
    projectType: 'Blue Carbon',
    location: 'Indonesia',
    creditAmount: 120,
    vintage: 2024,
    standard: 'Plan Vivo',
    price: 30.00,
    seller: '0x5555...6666',
  },
];

export default function MarketplacePage() {
  const { connected } = useWallet();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handlePurchase = (listingId: number) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    alert(`Purchasing credit #${listingId}. Transaction would be submitted here.`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Carbon Credit Marketplace
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Browse and purchase verified carbon credits from projects worldwide
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 font-semibold">Filter by:</span>
          <div className="flex space-x-2">
            {['all', 'REDD+', 'Renewable Energy', 'Blue Carbon'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedFilter === filter
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {filter === 'all' ? 'All Projects' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
          >
            {/* Project Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-white text-6xl opacity-20">🌿</span>
            </div>

            {/* Project Details */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {listing.projectName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {listing.location}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                  {listing.projectType}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Vintage: {listing.vintage}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Standard:</span>
                  <span className="font-semibold">{listing.standard}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credits:</span>
                  <span className="font-semibold">{listing.creditAmount} tonnes CO2</span>
                </div>
                <div className="flex justify-between">
                  <span>Seller:</span>
                  <span className="font-mono text-xs">{listing.seller}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 dark:text-gray-400">Price per tonne:</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${listing.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(listing.id)}
                  disabled={!connected}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
                    connected
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{connected ? 'Purchase Credit' : 'Connect Wallet'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockListings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No listings found. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
