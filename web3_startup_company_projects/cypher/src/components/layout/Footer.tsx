'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, MessageCircle, ExternalLink } from 'lucide-react';

const footerLinks = {
  protocol: [
    { name: 'About', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Governance', href: '#' },
    { name: 'Blog', href: '#' },
  ],
  developers: [
    { name: 'GitHub', href: '#' },
    { name: 'SDK', href: '#' },
    { name: 'Contracts', href: '#' },
    { name: 'Bug Bounty', href: '#' },
  ],
  community: [
    { name: 'Discord', href: '#' },
    { name: 'Twitter', href: '#' },
    { name: 'Forum', href: '#' },
    { name: 'Newsletter', href: '#' },
  ],
};

const socialLinks = [
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'Discord', href: '#', icon: MessageCircle },
];

export function Footer() {
  return (
    <footer className="bg-cypher-darker border-t border-cypher-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cypher-gradient rounded-lg flex items-center justify-center">
                <span className="text-cypher-dark font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-white">Cypher</span>
            </Link>
            <p className="mt-4 text-sm text-cypher-gray-400 max-w-xs">
              A concentrated liquidity AMM for capital-efficient trading on Ethereum.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-cypher-card rounded-lg text-cypher-gray-400 hover:text-white hover:bg-cypher-card/80 transition-all"
                  aria-label={link.name}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Protocol Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Protocol</h3>
            <ul className="space-y-3">
              {footerLinks.protocol.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-cypher-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Developers</h3>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-cypher-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    {link.name}
                    {link.name === 'GitHub' && (
                      <ExternalLink className="w-3 h-3" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Community</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-cypher-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-cypher-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cypher-gray-500">
            &copy; {new Date().getFullYear()} Cypher Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-cypher-gray-500 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-sm text-cypher-gray-500 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Compact footer for minimal pages
export function CompactFooter() {
  return (
    <footer className="py-4 border-t border-cypher-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-cypher-gray-500">
            &copy; {new Date().getFullYear()} Cypher Protocol
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cypher-gray-500 hover:text-white transition-colors"
                aria-label={link.name}
              >
                <link.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
