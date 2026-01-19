'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamically import WalletProvider to avoid SSR issues
const WalletProviderComponent = dynamic(
  () => import('@/providers/WalletProvider').then(mod => mod.WalletProvider),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="en">
      <head>
        <title>PumpFun Clone - Launch Your Token</title>
        <meta name="description" content="Create and trade tokens on Solana" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <WalletProviderComponent>
            <div className="min-h-screen bg-dark-950">
              {children}
            </div>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                },
                success: {
                  iconTheme: {
                    primary: '#00ff88',
                    secondary: '#1a1a2e',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff3366',
                    secondary: '#1a1a2e',
                  },
                },
              }}
            />
          </WalletProviderComponent>
        </QueryClientProvider>
      </body>
    </html>
  );
}
