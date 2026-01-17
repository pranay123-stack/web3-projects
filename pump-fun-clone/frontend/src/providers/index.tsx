'use client';

import { FC, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './WalletProvider';
import { QueryProvider } from './QueryProvider';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryProvider>
      <WalletProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid #252540',
              borderRadius: '12px',
              padding: '16px',
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
      </WalletProvider>
    </QueryProvider>
  );
};

export default Providers;
