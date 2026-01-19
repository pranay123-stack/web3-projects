'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { shortenAddress } from '@/lib/utils';

export const WalletButton = () => {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl hover:border-neon-green/50 transition-colors"
      >
        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
        <span className="font-mono text-sm">{shortenAddress(publicKey.toBase58())}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Address'}
          </button>
          <button
            onClick={() => {
              disconnect();
              setShowDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-dark-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletButton;
