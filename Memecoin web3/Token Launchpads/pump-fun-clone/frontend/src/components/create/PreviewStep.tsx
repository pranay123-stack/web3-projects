'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  Globe,
  Twitter,
  Send,
  ExternalLink,
  TrendingUp,
  Users,
  Droplets,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenFormData } from '@/lib/validation';

interface PreviewStepProps {
  formData: TokenFormData;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ formData }) => {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Preview Your Token
        </motion.h2>
        <p className="text-gray-400">
          This is how your token will appear to others
        </p>
      </div>

      {/* Token Card Preview */}
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div
          className={cn(
            'relative rounded-2xl overflow-hidden',
            'bg-gradient-to-br from-dark-800 to-dark-900',
            'border border-dark-700 hover:border-neon-green/30',
            'shadow-card hover:shadow-card-hover',
            'transition-all duration-500'
          )}
        >
          {/* Glowing border effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, transparent 50%, rgba(191, 0, 255, 0.1) 100%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Card content */}
          <div className="relative p-6">
            {/* Token header */}
            <div className="flex items-start gap-4 mb-4">
              {/* Token image */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-neon-green/30 shadow-neon-green">
                  {formData.imagePreview ? (
                    <img
                      src={formData.imagePreview}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                      <Hash className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* New badge */}
                <motion.div
                  className="absolute -top-2 -right-2 bg-neon-green text-black text-xs font-bold px-2 py-0.5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  NEW
                </motion.div>
              </motion.div>

              {/* Token info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white truncate">
                  {formData.name || 'Token Name'}
                </h3>
                <p className="text-neon-green font-mono text-sm">
                  ${formData.symbol?.toUpperCase() || 'SYMBOL'}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm line-clamp-3 mb-4">
              {formData.description || 'Token description will appear here...'}
            </p>

            {/* Mock stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-neon-green mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-white font-bold text-sm">$0.00</p>
                <p className="text-gray-500 text-xs">Price</p>
              </div>

              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-neon-purple mb-1">
                  <Droplets className="w-4 h-4" />
                </div>
                <p className="text-white font-bold text-sm">0 SOL</p>
                <p className="text-gray-500 text-xs">Liquidity</p>
              </div>

              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-neon-cyan mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-white font-bold text-sm">0</p>
                <p className="text-gray-500 text-xs">Holders</p>
              </div>
            </div>

            {/* Social links */}
            {(formData.twitter || formData.telegram || formData.website) && (
              <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
                {formData.twitter && (
                  <motion.div
                    className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-neon-green hover:bg-dark-600 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Twitter className="w-4 h-4" />
                  </motion.div>
                )}

                {formData.telegram && (
                  <motion.div
                    className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-neon-green hover:bg-dark-600 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.div>
                )}

                {formData.website && (
                  <motion.div
                    className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-neon-green hover:bg-dark-600 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Globe className="w-4 h-4" />
                  </motion.div>
                )}
              </div>
            )}

            {/* Trade button preview */}
            <motion.div
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-neon-green to-emerald-500 text-black font-bold text-center"
              whileHover={{ scale: 1.02 }}
            >
              Trade Now
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Token details summary */}
      <motion.div
        className="bg-dark-800/50 rounded-xl p-6 border border-dark-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-neon-purple" />
          Token Details
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-dark-700">
            <span className="text-gray-400">Name</span>
            <span className="text-white font-medium">{formData.name || '-'}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-dark-700">
            <span className="text-gray-400">Symbol</span>
            <span className="text-neon-green font-mono">
              ${formData.symbol?.toUpperCase() || '-'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-dark-700">
            <span className="text-gray-400">Decimals</span>
            <span className="text-white font-medium">6</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-dark-700">
            <span className="text-gray-400">Initial Supply</span>
            <span className="text-white font-medium">1,000,000,000</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">Network</span>
            <span className="text-white font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              Solana
            </span>
          </div>
        </div>
      </motion.div>

      {/* What happens next */}
      <motion.div
        className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="text-sm font-semibold text-neon-green mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>1. Your image and metadata will be uploaded to IPFS</li>
          <li>2. A new SPL token will be created on Solana</li>
          <li>3. A bonding curve will be initialized for trading</li>
          <li>4. Your token will be live and tradeable instantly!</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default PreviewStep;
