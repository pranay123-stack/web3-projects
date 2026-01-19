'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SearchBar } from '../common/SearchBar';
import { WalletButton } from '../common/WalletButton';
import { LiveIndicator } from '../common/LiveIndicator';

interface NavItem {
  label: string;
  href: string;
  isNew?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Explore', href: '/explore' },
  { label: 'Create', href: '/create', isNew: true },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-300',
          isScrolled
            ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
            : 'bg-transparent'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative w-10 h-10 lg:w-12 lg:h-12"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {/* Logo background glow */}
                <div className="absolute inset-0 bg-neon-green/30 rounded-xl blur-xl group-hover:bg-neon-green/50 transition-colors" />
                {/* Logo container */}
                <div className="relative w-full h-full bg-gradient-to-br from-neon-green to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-neon-green/20">
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              </motion.div>
              <div className="hidden sm:block">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-neon-green via-emerald-400 to-neon-green bg-clip-text text-transparent">
                  PumpClone
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <LiveIndicator size="sm" />
                  <span>Live on Solana</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={cn(
                      'relative px-4 py-2 rounded-xl',
                      'text-gray-400 hover:text-white',
                      'transition-colors duration-200'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 font-medium">{item.label}</span>
                    {item.isNew && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-neon-green text-black rounded-full">
                        NEW
                      </span>
                    )}
                    <motion.div
                      className="absolute inset-0 bg-white/5 rounded-xl opacity-0"
                      whileHover={{ opacity: 1 }}
                    />
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Search and Wallet */}
            <div className="flex items-center gap-3">
              {/* Search (Desktop) */}
              <div className="hidden md:block w-64 lg:w-80">
                <SearchBar />
              </div>

              {/* Wallet Button */}
              <WalletButton />

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Menu Panel */}
            <motion.div
              className="absolute top-16 left-0 right-0 bg-dark-card/95 backdrop-blur-xl border-b border-white/10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-4 space-y-2">
                {/* Mobile Search */}
                <div className="mb-4">
                  <SearchBar />
                </div>

                {/* Navigation Links */}
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl',
                        'text-gray-300 hover:text-white',
                        'hover:bg-white/5 transition-colors'
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.isNew && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-neon-green text-black rounded-full">
                          NEW
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}

                {/* Quick Stats */}
                <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-lg font-bold text-neon-green">1.2M</div>
                    <div className="text-xs text-gray-500">Tokens</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-lg font-bold text-neon-purple">$50M</div>
                    <div className="text-xs text-gray-500">24h Vol</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-lg font-bold text-orange-400">150K</div>
                    <div className="text-xs text-gray-500">Traders</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 lg:h-20" />
    </>
  );
};

export default Header;
