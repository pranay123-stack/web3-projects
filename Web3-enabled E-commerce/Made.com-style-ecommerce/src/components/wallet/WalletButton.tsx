'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useWalletStore, SUPPORTED_CHAINS } from '@/store/walletStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function WalletButton() {
  const { isConnected, address, balance, chainId, isConnecting, error, connect, disconnect } = useWalletStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="flex items-center space-x-2" disabled>
        <Wallet size={18} />
        <span>Connect Wallet</span>
      </Button>
    );
  }

  const handleConnect = async () => {
    await connect();
    if (error) {
      toast.error(error);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = () => {
    if (!chainId) return 'Unknown';
    return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || `Chain ${chainId}`;
  };

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleConnect}
        loading={isConnecting}
        className="flex items-center space-x-2"
      >
        <Wallet size={18} />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:border-black transition-colors"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="font-medium">{formatAddress(address!)}</span>
        <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 shadow-lg z-50"
            >
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Connected Wallet</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm">{formatAddress(address!)}</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyAddress}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy address"
                    >
                      <Copy size={14} />
                    </button>
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-100 rounded"
                      title="View on Etherscan"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Network</p>
                <p className="font-medium">{getNetworkName()}</p>
              </div>

              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Balance</p>
                <p className="font-semibold text-lg">
                  {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH'}
                </p>
              </div>

              <div className="p-4">
                <button
                  onClick={() => {
                    disconnect();
                    setIsDropdownOpen(false);
                    toast.success('Wallet disconnected');
                  }}
                  className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors w-full"
                >
                  <LogOut size={18} />
                  <span>Disconnect</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
