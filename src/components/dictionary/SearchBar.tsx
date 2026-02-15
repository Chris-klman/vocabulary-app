import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchBar({ onSearch, placeholder = 'Wort eingeben...', disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);

  // Trigger search when debounced query changes
  const handleDebouncedSearch = useCallback(() => {
    if (debouncedQuery.trim().length > 0) {
      onSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, onSearch]);

  // Call handleDebouncedSearch when debouncedQuery changes
  useEffect(() => {
    handleDebouncedSearch();
  }, [handleDebouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
