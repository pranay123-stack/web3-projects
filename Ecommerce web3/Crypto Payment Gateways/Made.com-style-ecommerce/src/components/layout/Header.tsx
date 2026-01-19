'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { WalletButton } from '@/components/wallet/WalletButton';

const categories = [
  { name: 'Furniture', href: '/categories/furniture' },
  { name: 'Lighting', href: '/categories/lighting' },
  { name: 'Décor', href: '/categories/decor' },
  { name: 'Outdoor', href: '/categories/outdoor' },
  { name: 'Sale', href: '/categories/sale' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart, getItemCount } = useCartStore();
  const { user } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = mounted ? getItemCount() : 0;
  const wishlistCount = mounted ? wishlistItems.length : 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        {/* Top bar */}
        <div className="bg-black text-white text-center py-2 text-sm">
          Free delivery on orders over $150
        </div>

        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href="/" className="text-2xl font-bold tracking-tight">
              MADE
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="text-sm font-medium hover:text-gray-600 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search */}
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Wallet */}
              <div className="hidden md:block">
                <WalletButton />
              </div>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* User */}
              <Link
                href={mounted && user ? '/dashboard' : '/auth/login'}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Account"
              >
                <User size={20} />
              </Link>

              {/* Cart */}
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                onClick={openCart}
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search for furniture, décor, lighting..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-gray-200 overflow-hidden bg-white"
            >
              <nav className="px-4 py-4 space-y-4">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    href={category.href}
                    className="block text-lg font-medium hover:text-gray-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <WalletButton />
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[104px]" />

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
