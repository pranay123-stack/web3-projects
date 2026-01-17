import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Award, Trash2 } from 'lucide-react';

export default function MyCreditsPage() {
  const { connected, account } = useWallet();

  if (!connected) {
    return (
      <div className="text-center py-16">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view your carbon credits
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          My Carbon Credits
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Manage your portfolio and retire credits
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-green-600">0</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Active Credits</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-blue-600">0</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Retired Credits</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-purple-600">0</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Total Offset (tonnes)</div>
        </div>
      </div>

      {/* Credits List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Your Credits
        </h2>
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any carbon credits yet. Visit the marketplace to get started!
          </p>
        </div>
      </div>
    </div>
  );
}
