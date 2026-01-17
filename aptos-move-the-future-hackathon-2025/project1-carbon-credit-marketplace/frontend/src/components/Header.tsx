import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Link } from 'react-router-dom';
import { Leaf, Wallet } from 'lucide-react';

export default function Header() {
  const { connected, account, connect, disconnect, wallets } = useWallet();

  const handleConnect = async () => {
    if (wallets && wallets.length > 0) {
      await connect(wallets[0].name);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Carbon Credits
            </span>
          </Link>

          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Home
            </Link>
            <Link
              to="/marketplace"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Marketplace
            </Link>
            <Link
              to="/my-credits"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              My Credits
            </Link>
            <Link
              to="/verification"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Verification
            </Link>
          </div>

          <div>
            {connected && account ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
