'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Droplets,
  Wallet,
  BarChart3,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/formatters';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pools', href: '/pools', icon: Droplets },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected, connect, disconnect } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cypher-darker/95 backdrop-blur-md border-b border-cypher-border">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cypher-gradient rounded-lg flex items-center justify-center">
                <span className="text-cypher-dark font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Cypher
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-cypher-yellow/10 text-cypher-yellow'
                        : 'text-cypher-gray-400 hover:text-white hover:bg-cypher-card'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Network Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cypher-card rounded-lg border border-cypher-border">
              <div className="w-2 h-2 bg-cypher-green rounded-full animate-pulse" />
              <span className="text-sm text-cypher-gray-300">Ethereum</span>
            </div>

            {/* Connect Wallet Button */}
            {isConnected ? (
              <Button
                variant="secondary"
                onClick={disconnect}
                className="hidden sm:flex"
              >
                <span className="w-2 h-2 bg-cypher-green rounded-full" />
                {formatAddress(address || '')}
              </Button>
            ) : (
              <Button onClick={connect} className="hidden sm:flex">
                Connect Wallet
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-cypher-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-cypher-border">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-cypher-yellow/10 text-cypher-yellow'
                        : 'text-cypher-gray-400 hover:text-white hover:bg-cypher-card'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile wallet button */}
              <div className="pt-4 border-t border-cypher-border mt-2">
                {isConnected ? (
                  <Button variant="secondary" onClick={disconnect} className="w-full">
                    <span className="w-2 h-2 bg-cypher-green rounded-full" />
                    {formatAddress(address || '')}
                  </Button>
                ) : (
                  <Button onClick={connect} className="w-full">
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// Sub-header for pages with additional controls
interface SubHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SubHeader({ title, description, action }: SubHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-cypher-gray-400 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Breadcrumb component
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-cypher-gray-600">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="text-cypher-gray-400 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
