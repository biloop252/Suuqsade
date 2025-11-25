'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, XIcon } from 'lucide-react';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand';
  image?: string;
  slug?: string;
}

interface SearchSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  loading?: boolean;
}

export default function SearchSuggestions({
  value,
  onChange,
  onSubmit,
  placeholder = "Search products, categories, or brands...",
  className = "",
  suggestions = [],
  onSuggestionSelect,
  loading = false
}: SearchSuggestionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          onSubmit(value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Navigate based on suggestion type
    if (suggestion.type === 'product') {
      router.push(`/products/${suggestion.slug || suggestion.id}`);
    } else if (suggestion.type === 'category') {
      router.push(`/categories/${suggestion.id}`);
    } else if (suggestion.type === 'brand') {
      // Navigate to products page with brand filter
      router.push(`/products?brand=${suggestion.id}`);
    }
    
    // Call custom handler if provided
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
    setIsOpen(false);
  };

  const clearSearch = () => {
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-3 bg-gray-100 rounded-l-lg">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => value.length > 0 && setIsOpen(true)}
            className="w-full pl-12 pr-20 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-200 text-sm transition-colors"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-0 top-0 bottom-0 bg-primary-500 text-white px-3 rounded-r-lg hover:bg-primary-600 flex items-center justify-center"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mx-auto"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {suggestion.image ? (
                        <img
                          src={suggestion.image}
                          alt={suggestion.text}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          suggestion.type === 'product' ? 'bg-blue-100 text-blue-600' :
                          suggestion.type === 'category' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        } ${suggestion.image ? 'hidden' : 'flex'}`}
                      >
                        {suggestion.type === 'product' ? 'P' :
                         suggestion.type === 'category' ? 'C' : 'B'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.text}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {suggestion.type}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : value.length > 0 ? (
            <div className="p-3 text-center text-gray-500">
              No suggestions found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
