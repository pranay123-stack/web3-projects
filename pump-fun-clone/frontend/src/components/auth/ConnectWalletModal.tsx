'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import {
  X,
  ExternalLink,
  HelpCircle,
  Wallet,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// Wallet icons (base64 encoded or URLs)
const WALLET_ICONS: Record<string, string> = {
  Phantom: 'https://phantom.app/img/phantom-logo.svg',
  Solflare: 'https://solflare.com/favicon.svg',
  Backpack: 'https://backpack.app/favicon.ico',
  'Coinbase Wallet': 'https://www.coinbase.com/favicon.ico',
  Ledger: 'https://www.ledger.com/favicon.ico',
  'Trust Wallet': 'https://trustwallet.com/favicon.ico',
};

interface ConnectWalletModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { wallets, select, connecting, connected } = useWallet();
  const {
    isConnectWalletModalOpen,
    closeConnectWalletModal,
    openSignMessageModal,
  } = useAuthStore();

  const modalOpen = isOpen ?? isConnectWalletModalOpen;
  const handleClose = onClose ?? closeConnectWalletModal;

  // Filter and sort wallets
  const installedWallets = wallets.filter(
    (wallet) => wallet.readyState === WalletReadyState.Installed
  );

  const notInstalledWallets = wallets.filter(
    (wallet) =>
      wallet.readyState === WalletReadyState.NotDetected ||
      wallet.readyState === WalletReadyState.Loadable
  );

  const handleSelectWallet = useCallback(
    async (walletName: string) => {
      try {
        select(walletName as any);
        // Close this modal and open sign message modal after connection
        handleClose();
        // Small delay to allow wallet connection to complete
        setTimeout(() => {
          openSignMessageModal();
        }, 500);
      } catch (error) {
        console.error('Failed to select wallet:', error);
      }
    },
    [select, handleClose, openSignMessageModal]
  );

  // Close on successful connection
  React.useEffect(() => {
    if (connected) {
      handleClose();
    }
  }, [connected, handleClose]);

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={cn(
                'relative w-full max-w-md',
                'bg-gradient-to-b from-gray-900 to-gray-950',
                'border border-gray-800 rounded-2xl',
                'shadow-2xl shadow-neon-purple/10',
                'overflow-hidden'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neon-purple/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                    <p className="text-sm text-gray-400">
                      Choose your preferred wallet
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className={cn(
                    'absolute right-4 top-4 p-2 rounded-lg',
                    'text-gray-400 hover:text-white',
                    'hover:bg-gray-800 transition-colors'
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Decorative glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Installed Wallets */}
                {installedWallets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Detected Wallets
                    </h3>
                    <div className="space-y-2">
                      {installedWallets.map((wallet) => (
                        <WalletButton
                          key={wallet.adapter.name}
                          name={wallet.adapter.name}
                          icon={
                            WALLET_ICONS[wallet.adapter.name] ||
                            wallet.adapter.icon
                          }
                          onClick={() => handleSelectWallet(wallet.adapter.name)}
                          isConnecting={connecting}
                          isInstalled
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Wallets Detected Warning */}
                {installedWallets.length === 0 && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-500">
                        No wallet detected
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Install a Solana wallet to get started. We recommend
                        Phantom for the best experience.
                      </p>
                    </div>
                  </div>
                )}

                {/* Other Wallets */}
                {notInstalledWallets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      {installedWallets.length > 0
                        ? 'More Wallets'
                        : 'Popular Wallets'}
                    </h3>
                    <div className="space-y-2">
                      {notInstalledWallets.slice(0, 5).map((wallet) => (
                        <WalletButton
                          key={wallet.adapter.name}
                          name={wallet.adapter.name}
                          icon={
                            WALLET_ICONS[wallet.adapter.name] ||
                            wallet.adapter.icon
                          }
                          onClick={() =>
                            window.open(wallet.adapter.url, '_blank')
                          }
                          isInstalled={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50">
                <a
                  href="https://solana.com/ecosystem/explore?categories=wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center justify-center gap-2',
                    'text-sm text-gray-400 hover:text-neon-green',
                    'transition-colors'
                  )}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>What is a wallet?</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface WalletButtonProps {
  name: string;
  icon: string;
  onClick: () => void;
  isConnecting?: boolean;
  isInstalled: boolean;
}

function WalletButton({
  name,
  icon,
  onClick,
  isConnecting,
  isInstalled,
}: WalletButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      disabled={isConnecting}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl',
        'bg-gray-800/50 hover:bg-gray-800',
        'border border-gray-700/50 hover:border-neon-green/30',
        'transition-all duration-200',
        'group',
        isConnecting && 'opacity-50 cursor-wait'
      )}
    >
      {/* Wallet Icon */}
      <div className="w-10 h-10 rounded-xl bg-gray-700 p-2 flex items-center justify-center">
        <img
          src={icon}
          alt={name}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/></svg>';
          }}
        />
      </div>

      {/* Wallet Info */}
      <div className="flex-1 text-left">
        <p className="font-medium text-white group-hover:text-neon-green transition-colors">
          {name}
        </p>
        <p className="text-xs text-gray-500">
          {isInstalled ? 'Detected' : 'Not installed'}
        </p>
      </div>

      {/* Action Indicator */}
      <div className="text-gray-500 group-hover:text-neon-green transition-colors">
        {isInstalled ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 to-transparent rounded-xl" />
      </div>
    </motion.button>
  );
}

export default ConnectWalletModal;
