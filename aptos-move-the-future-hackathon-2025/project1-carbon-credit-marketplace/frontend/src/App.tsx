import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import MyCreditsPage from './pages/MyCreditsPage';
import VerificationPage from './pages/VerificationPage';

const wallets = [new PetraWallet()];

function App() {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      onError={(error) => {
        console.error('Wallet connection error:', error);
      }}
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/my-credits" element={<MyCreditsPage />} />
              <Route path="/verification" element={<VerificationPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AptosWalletAdapterProvider>
  );
}

export default App;
