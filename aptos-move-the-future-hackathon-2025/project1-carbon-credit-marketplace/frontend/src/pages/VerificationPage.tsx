import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { CheckCircle, Upload } from 'lucide-react';

export default function VerificationPage() {
  const { connected } = useWallet();
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'REDD+',
    location: '',
    creditAmount: '',
    standard: 'Verra VCS',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    alert('Project submitted for verification!');
    console.log('Submitting project:', formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Project Verification
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Submit your carbon offset project for verification
        </p>
      </div>

      {/* Verification Process */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Verification Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1</div>
            <div className="font-semibold text-gray-900 dark:text-white mb-2">Submit</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Fill out the project application form
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">2</div>
            <div className="font-semibold text-gray-900 dark:text-white mb-2">Review</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Authorized verifiers assess your project
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">3</div>
            <div className="font-semibold text-gray-900 dark:text-white mb-2">Mint</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Approved projects can mint carbon credits
            </div>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Submit New Project
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Amazon Rainforest REDD+"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Type
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option>REDD+</option>
                <option>Renewable Energy</option>
                <option>Energy Efficiency</option>
                <option>Blue Carbon</option>
                <option>Afforestation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Standard
              </label>
              <select
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option>Verra VCS</option>
                <option>Gold Standard</option>
                <option>Plan Vivo</option>
                <option>American Carbon Registry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Amazon Basin, Brazil"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Carbon Credits (tonnes CO2)
            </label>
            <input
              type="number"
              required
              value={formData.creditAmount}
              onChange={(e) => setFormData({ ...formData, creditAmount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="Describe your carbon offset project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Documentation
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Upload project documents, verification reports, and supporting evidence
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Choose Files
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!connected}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition ${
              connected
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>{connected ? 'Submit for Verification' : 'Connect Wallet First'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
