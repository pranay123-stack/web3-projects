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
  Settings,
  HelpCircle,
  ExternalLink,
  Github,
  Twitter,
} from 'lucide-react';

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pools', href: '/pools', icon: Droplets },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: 'Settings', href: '#', icon: Settings },
  { name: 'Help', href: '#', icon: HelpCircle },
];

const externalLinks = [
  { name: 'Docs', href: '#', icon: ExternalLink },
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'Twitter', href: '#', icon: Twitter },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 bottom-0 w-64 bg-cypher-darker border-r border-cypher-border',
        'hidden lg:flex flex-col',
        className
      )}
    >
      <div className="flex-1 overflow-y-auto py-6 px-4">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-cypher-yellow/10 text-cypher-yellow border border-cypher-yellow/20'
                    : 'text-cypher-gray-400 hover:text-white hover:bg-cypher-card'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-cypher-yellow rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-6 border-t border-cypher-border" />

        {/* Secondary Navigation */}
        <nav className="space-y-1">
          {secondaryNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-cypher-gray-400 hover:text-white hover:bg-cypher-card transition-all"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-6 border-t border-cypher-border" />

        {/* External Links */}
        <nav className="space-y-1">
          {externalLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-cypher-gray-400 hover:text-white hover:bg-cypher-card transition-all"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Stats Card at Bottom */}
      <div className="p-4 border-t border-cypher-border">
        <div className="bg-cypher-card rounded-xl p-4 border border-cypher-border">
          <div className="text-xs text-cypher-gray-400 mb-2">Protocol TVL</div>
          <div className="text-lg font-bold text-white">$876.89M</div>
          <div className="text-xs text-cypher-green mt-1">+5.23% (24h)</div>
        </div>
      </div>
    </aside>
  );
}

// Mobile Bottom Navigation (optional alternative to sidebar)
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cypher-darker border-t border-cypher-border lg:hidden">
      <div className="flex items-center justify-around py-2">
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all',
                isActive ? 'text-cypher-yellow' : 'text-cypher-gray-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
