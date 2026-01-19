'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Palette,
  Sliders,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  Twitter,
  MessageCircle,
  Globe,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function SettingsPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [activeTab, setActiveTab] = useState<'profile' | 'trading' | 'notifications' | 'display'>('profile');
  const [copied, setCopied] = useState(false);

  // Profile settings
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');

  // Trading settings
  const [defaultSlippage, setDefaultSlippage] = useState(1);
  const [priorityFee, setPriorityFee] = useState('medium');
  const [confirmTrades, setConfirmTrades] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  // Notification settings
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [tradeNotifications, setTradeNotifications] = useState(true);
  const [newTokenAlerts, setNewTokenAlerts] = useState(false);
  const [graduationAlerts, setGraduationAlerts] = useState(true);

  // Display settings
  const [theme, setTheme] = useState('dark');
  const [compactMode, setCompactMode] = useState(false);
  const [showPnLPercent, setShowPnLPercent] = useState(true);
  const [currency, setCurrency] = useState('USD');

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-6xl mb-6">⚙️</div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            Connect your wallet to access settings and customize your experience.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">
          <span className="gradient-text">Settings</span>
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <User className="w-5 h-5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'trading'
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Sliders className="w-5 h-5" />
              Trading
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'display'
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Palette className="w-5 h-5" />
              Display
            </button>

            {/* Wallet Info */}
            <div className="mt-6 p-4 bg-dark-800/50 border border-dark-700 rounded-xl">
              <div className="text-sm text-gray-400 mb-2">Connected Wallet</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-sm">
                  {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
                </span>
                <button onClick={copyAddress} className="text-gray-400 hover:text-white">
                  {copied ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://solscan.io/account/${publicKey?.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
                <button
                  onClick={() => disconnect()}
                  className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-neon-green"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be displayed on your profile and leaderboard</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-neon-green resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="@username"
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-neon-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Telegram
                      </label>
                      <input
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="@username"
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-neon-green"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl focus:outline-none focus:border-neon-green"
                    />
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity">
                    Save Profile
                  </button>
                </div>
              </div>
            )}

            {/* Trading Tab */}
            {activeTab === 'trading' && (
              <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Sliders className="w-5 h-5" />
                  Trading Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Default Slippage</label>
                    <div className="flex gap-2">
                      {[0.5, 1, 2, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setDefaultSlippage(s)}
                          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                            defaultSlippage === s
                              ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                              : 'bg-dark-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Priority Fee</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high', 'turbo'].map((fee) => (
                        <button
                          key={fee}
                          onClick={() => setPriorityFee(fee)}
                          className={`flex-1 py-3 rounded-xl font-medium capitalize transition-colors ${
                            priorityFee === fee
                              ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                              : 'bg-dark-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {fee}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Higher priority = faster confirmation but more fees</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                      <div>
                        <div className="font-medium">Confirm Before Trading</div>
                        <div className="text-sm text-gray-400">Show confirmation dialog before trades</div>
                      </div>
                      <button
                        onClick={() => setConfirmTrades(!confirmTrades)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          confirmTrades ? 'bg-neon-green' : 'bg-dark-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            confirmTrades ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                      <div>
                        <div className="font-medium">Auto-Approve Transactions</div>
                        <div className="text-sm text-gray-400">Skip wallet approval for small trades</div>
                      </div>
                      <button
                        onClick={() => setAutoApprove(!autoApprove)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          autoApprove ? 'bg-neon-green' : 'bg-dark-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            autoApprove ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                    <div>
                      <div className="font-medium">Price Alerts</div>
                      <div className="text-sm text-gray-400">Get notified when token prices change significantly</div>
                    </div>
                    <button
                      onClick={() => setPriceAlerts(!priceAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        priceAlerts ? 'bg-neon-green' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          priceAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                    <div>
                      <div className="font-medium">Trade Notifications</div>
                      <div className="text-sm text-gray-400">Get notified when your trades are executed</div>
                    </div>
                    <button
                      onClick={() => setTradeNotifications(!tradeNotifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        tradeNotifications ? 'bg-neon-green' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          tradeNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                    <div>
                      <div className="font-medium">New Token Alerts</div>
                      <div className="text-sm text-gray-400">Get notified when new tokens are created</div>
                    </div>
                    <button
                      onClick={() => setNewTokenAlerts(!newTokenAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        newTokenAlerts ? 'bg-neon-green' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          newTokenAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                    <div>
                      <div className="font-medium">Graduation Alerts</div>
                      <div className="text-sm text-gray-400">Get notified when tokens you hold graduate</div>
                    </div>
                    <button
                      onClick={() => setGraduationAlerts(!graduationAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        graduationAlerts ? 'bg-neon-green' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          graduationAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Display Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Theme</label>
                    <div className="flex gap-2">
                      {['dark', 'light', 'system'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex-1 py-3 rounded-xl font-medium capitalize transition-colors ${
                            theme === t
                              ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                              : 'bg-dark-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Currency</label>
                    <div className="flex gap-2">
                      {['USD', 'SOL', 'EUR', 'GBP'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCurrency(c)}
                          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                            currency === c
                              ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                              : 'bg-dark-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                      <div>
                        <div className="font-medium">Compact Mode</div>
                        <div className="text-sm text-gray-400">Show more content with smaller UI elements</div>
                      </div>
                      <button
                        onClick={() => setCompactMode(!compactMode)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          compactMode ? 'bg-neon-green' : 'bg-dark-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            compactMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl">
                      <div>
                        <div className="font-medium">Show P&L Percentage</div>
                        <div className="text-sm text-gray-400">Display percentage change alongside dollar amounts</div>
                      </div>
                      <button
                        onClick={() => setShowPnLPercent(!showPnLPercent)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          showPnLPercent ? 'bg-neon-green' : 'bg-dark-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            showPnLPercent ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
