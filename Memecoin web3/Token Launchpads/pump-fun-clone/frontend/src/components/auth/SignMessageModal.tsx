'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  X,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Fingerprint,
} from 'lucide-react';
import { cn, shortenAddress } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

interface SignMessageModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SignMessageModal({ isOpen, onClose }: SignMessageModalProps) {
  const { publicKey, wallet, disconnect } = useWallet();
  const { isSignMessageModalOpen, closeSignMessageModal } = useAuthStore();
  const { signAndAuthenticate, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const modalOpen = isOpen ?? isSignMessageModalOpen;
  const handleClose = onClose ?? closeSignMessageModal;

  const handleSign = async () => {
    setError(null);
    try {
      const success = await signAndAuthenticate();
      if (success) {
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message');
    }
  };

  const handleCancel = async () => {
    await disconnect();
    handleClose();
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                'shadow-2xl shadow-neon-green/10',
                'overflow-hidden'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neon-green/20 rounded-xl">
                    <Fingerprint className="w-6 h-6 text-neon-green" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Verify Wallet
                    </h2>
                    <p className="text-sm text-gray-400">
                      Sign a message to authenticate
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className={cn(
                    'absolute right-4 top-4 p-2 rounded-lg',
                    'text-gray-400 hover:text-white',
                    'hover:bg-gray-800 transition-colors',
                    'disabled:opacity-50'
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Decorative glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-neon-green/20 rounded-full blur-3xl pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Connected Wallet Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="w-12 h-12 rounded-xl bg-gray-700 p-2.5 flex items-center justify-center">
                    {wallet?.adapter.icon && (
                      <img
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {wallet?.adapter.name}
                    </p>
                    <p className="text-sm text-gray-400 font-mono">
                      {publicKey ? shortenAddress(publicKey.toString(), 6) : ''}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-neon-green" />
                </div>

                {/* Security Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-400">
                        Secure Authentication
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Signing this message proves you own this wallet. It does
                        not trigger any blockchain transaction or cost gas fees.
                      </p>
                    </div>
                  </div>

                  {/* What you're signing */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">
                      You will sign:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        Verification of wallet ownership
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        Unique nonce for security
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        Current timestamp
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">
                        Authentication Failed
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50 space-y-3">
                <Button
                  onClick={handleSign}
                  isLoading={isLoading}
                  fullWidth
                  size="lg"
                  leftIcon={
                    isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Fingerprint className="w-5 h-5" />
                    )
                  }
                >
                  {isLoading ? 'Waiting for signature...' : 'Sign & Authenticate'}
                </Button>

                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className={cn(
                    'w-full py-2 text-sm text-gray-400 hover:text-white',
                    'transition-colors disabled:opacity-50'
                  )}
                >
                  Cancel and disconnect
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SignMessageModal;
