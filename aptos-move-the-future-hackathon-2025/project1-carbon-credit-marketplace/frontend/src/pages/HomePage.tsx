import { Leaf, Shield, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
          Trade Verified Carbon Credits
          <br />
          <span className="text-green-600">on Aptos Blockchain</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          The first decentralized marketplace for Real-World Asset tokenized carbon credits.
          Transparent, secure, and accessible to everyone.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/marketplace"
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            Explore Marketplace
          </Link>
          <Link
            to="/verification"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700 transition text-lg font-semibold"
          >
            Submit Project
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-bold text-green-600">1,247</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Credits Issued</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-bold text-blue-600">524</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Tonnes Retired</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-bold text-purple-600">38</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Verified Projects</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-bold text-orange-600">$52k</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Trading Volume</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Real Carbon Offsets
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Each credit represents 1 tonne of CO2 equivalent from verified climate projects
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Verified Standards
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Projects verified by Verra, Gold Standard, and other leading certification bodies
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Transparent Trading
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All transactions recorded on-chain with full audit trail and price discovery
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Instant Retirement
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Retire credits with immutable on-chain proof and get instant certificates
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="text-5xl font-bold text-green-600">1</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Project Verification
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Carbon offset projects submit for verification by authorized verifiers
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="text-5xl font-bold text-green-600">2</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Credit Tokenization
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Approved projects mint carbon credits as NFTs on Aptos blockchain
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="text-5xl font-bold text-green-600">3</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Trade & Retire
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Buy, sell, or retire credits to offset your carbon footprint
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-12 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">
          Ready to Make an Impact?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join the carbon credit revolution on Aptos blockchain
        </p>
        <Link
          to="/marketplace"
          className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition text-lg font-semibold"
        >
          Start Trading Now
        </Link>
      </section>
    </div>
  );
}
