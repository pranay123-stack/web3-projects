'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Rocket, Info, Twitter, Send, Globe } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function CreateTokenPage() {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null as File | null,
    imagePreview: '',
    twitter: '',
    telegram: '',
    website: '',
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // TODO: Implement actual token creation
    console.log('Creating token:', formData);

    setTimeout(() => {
      setIsCreating(false);
      alert('Token creation coming soon! Connect your wallet to create tokens.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Create Your Token</span>
          </h1>
          <p className="text-gray-400">
            Launch your token in seconds. No coding required.
          </p>
        </div>

        {/* Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Image *
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-2xl bg-dark-800 border-2 border-dashed border-dark-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-neon-green/50 transition-colors"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                {formData.imagePreview ? (
                  <img
                    src={formData.imagePreview}
                    alt="Token preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="text-sm text-gray-500">
                <p>Click to upload</p>
                <p>PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Token Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Doge Moon"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={32}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.name.length}/32 characters</p>
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Symbol *
            </label>
            <input
              type="text"
              placeholder="e.g., DMOON"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              maxLength={10}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.symbol.length}/10 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              placeholder="Describe your token..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Social Links (Optional)
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Twitter */}
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Twitter handle"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
                />
              </div>

              {/* Telegram */}
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Telegram group"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
                />
              </div>

              {/* Website */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  placeholder="Website URL"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Cost Info */}
          <div className="p-4 bg-dark-800/50 border border-dark-700 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white mb-1">Token Creation Cost</p>
                <p className="text-sm text-gray-400">
                  Creating a token costs approximately <span className="text-neon-green font-bold">0.02 SOL</span> for
                  account rent and transaction fees. This is a one-time cost.
                </p>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="p-4 bg-dark-800/50 border border-dark-700 rounded-xl">
            <p className="text-sm font-medium text-white mb-3">How it works:</p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-neon-green">1.</span>
                Your token is created with a bonding curve
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green">2.</span>
                Anyone can buy/sell on the curve - price rises with demand
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-green">3.</span>
                At ~$69K market cap, liquidity moves to Raydium
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || !formData.name || !formData.symbol || !formData.description}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                Creating Token...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Create Token
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
