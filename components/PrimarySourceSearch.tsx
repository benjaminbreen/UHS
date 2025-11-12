import React, { useState, useRef, useEffect } from 'react';
import { Search, X, BookOpen, Clock, Globe } from 'lucide-react';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import { useUI } from '../contexts/UIContext';

export const PrimarySourceSearch: React.FC = () => {
  const { setSelectedPrimarySource } = useUI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PrimarySourceMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await primarySourceService.searchByKeyword(query);
      setSearchResults(results.slice(0, 10)); // Show top 10 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceClick = (source: PrimarySourceMetadata) => {
    setSelectedPrimarySource(source);
    setIsExpanded(false);
  };

  const formatYear = (year: number) => {
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  return (
    <>
      <div ref={searchRef} className="relative">
        {/* Search Button/Input */}
        <div
          className={`
            flex items-center bg-[var(--surface-muted-bg)] rounded-lg transition-all duration-300 ease-in-out
            ${isExpanded ? 'w-96' : 'w-10'}
          `}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Search primary sources"
            title="Search historical documents"
          >
            <Search className="w-5 h-5" />
          </button>

          {isExpanded && (
            <>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search primary sources..."
                className="flex-1 bg-transparent text-text-primary placeholder-text-muted px-2 py-1 outline-none"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    inputRef.current?.focus();
                  }}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isExpanded && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-card-bg)] rounded-lg shadow-xl border border-[var(--border-normal)] max-h-96 overflow-y-auto z-50">
            {isLoading ? (
              <div className="p-4 text-center text-text-secondary">
                <div className="animate-pulse">Searching...</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wide">
                  Found {searchResults.length} source{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => handleSourceClick(source)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--surface-muted-hover-bg)] transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary group-hover:text-amber-400 transition-colors">
                          {source.title}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                          <span>{source.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatYear(source.year)}
                          </span>
                          {source.culturalZones && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {source.culturalZones[0]}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-text-secondary mt-1 line-clamp-1">
                          {source.excerpt}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-text-muted">
                No sources found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};