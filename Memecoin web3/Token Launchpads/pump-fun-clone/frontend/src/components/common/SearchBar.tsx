'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export const SearchBar = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Search tokens..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
      />
    </div>
  );
};

export default SearchBar;
