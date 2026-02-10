import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (name: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <div className="w-full relative z-10">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="block w-full pl-11 pr-24 py-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg 
                     text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 
                     transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
          placeholder="Enter a name (e.g., 'Sophia', 'Alexander')..."
        />
        <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl 
                       text-sm font-medium transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
            Explore
        </button>
      </form>
    </div>
  );
};

export default SearchBar;