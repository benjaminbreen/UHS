/**
 * components/JournalQuotesPanel.tsx - Panel for displaying saved primary source quotes
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Download, Trash2, Calendar, Tag } from 'lucide-react';
import { JournalQuote } from '../types/journal';
import { journalQuoteService } from '../services/journalQuoteService';

interface JournalQuotesPanelProps {}

export const JournalQuotesPanel: React.FC<JournalQuotesPanelProps> = () => {
    const [quotes, setQuotes] = useState<JournalQuote[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEra, setSelectedEra] = useState<string>('all');
    const [filteredQuotes, setFilteredQuotes] = useState<JournalQuote[]>([]);

    // Load quotes on mount
    useEffect(() => {
        const loadQuotes = () => {
            const savedQuotes = journalQuoteService.getQuotes();
            setQuotes(savedQuotes);
        };

        loadQuotes();

        // Set up a simple refresh interval to catch new quotes
        const interval = setInterval(loadQuotes, 2000);
        return () => clearInterval(interval);
    }, []);

    // Filter quotes based on search and era
    useEffect(() => {
        let filtered = quotes;

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = journalQuoteService.searchQuotes(searchQuery);
        }

        // Filter by era
        if (selectedEra !== 'all') {
            filtered = filtered.filter(quote => quote.era === selectedEra);
        }

        // Sort by date added (newest first)
        filtered.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());

        setFilteredQuotes(filtered);
    }, [quotes, searchQuery, selectedEra]);

    // Get unique eras from quotes
    const availableEras = React.useMemo(() => {
        const eras = new Set(quotes.map(quote => quote.era));
        return Array.from(eras).sort();
    }, [quotes]);

    const handleDeleteQuote = (quoteId: string) => {
        if (journalQuoteService.deleteQuote(quoteId)) {
            setQuotes(prev => prev.filter(q => q.id !== quoteId));
        }
    };

    const handleExportQuotes = () => {
        const exportText = journalQuoteService.exportQuotes('markdown');
        const blob = new Blob([exportText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal-quotes.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatYear = (year: number): string => {
        return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
    };

    if (quotes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <BookOpen className="w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Quotes Yet</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                    Select text in primary source documents and add quotes to your personal collection.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header with search and filters */}
            <div className="p-4 border-b border-slate-600/30 space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search quotes, authors, or sources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 text-sm"
                    />
                </div>

                {/* Era filter and export */}
                <div className="flex items-center gap-2">
                    <select
                        value={selectedEra}
                        onChange={(e) => setSelectedEra(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-purple-400/50"
                    >
                        <option value="all">All Eras</option>
                        {availableEras.map(era => (
                            <option key={era} value={era}>
                                {era.charAt(0) + era.slice(1).toLowerCase().replace('_', ' ')}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleExportQuotes}
                        className="px-3 py-1.5 bg-slate-600/50 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm flex items-center gap-1"
                        title="Export quotes as Markdown"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>
            </div>

            {/* Quotes list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredQuotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="bg-slate-800/40 border border-slate-600/30 rounded-lg p-4 hover:bg-slate-800/60 transition-colors"
                    >
                        {/* Quote text */}
                        <blockquote className="text-slate-200 italic text-sm leading-relaxed mb-3 border-l-3 border-purple-400/50 pl-4">
                            "{quote.quote}"
                        </blockquote>

                        {/* Source info */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="text-slate-300 font-medium text-sm truncate">
                                    {quote.sourceTitle}
                                </div>
                                <div className="text-slate-400 text-xs">
                                    by {quote.author} • {formatYear(quote.year)}
                                </div>

                                {/* Tags */}
                                {quote.tags && quote.tags.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                                        <Tag className="w-3 h-3 text-slate-500" />
                                        {quote.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {quote.tags.length > 3 && (
                                            <span className="text-slate-500 text-xs">
                                                +{quote.tags.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Calendar className="w-3 h-3" />
                                <span>{quote.dateAdded.toLocaleDateString()}</span>
                                <button
                                    onClick={() => handleDeleteQuote(quote.id)}
                                    className="ml-2 p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-red-400 transition-colors"
                                    title="Delete quote"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredQuotes.length === 0 && (searchQuery || selectedEra !== 'all') && (
                    <div className="text-center py-8">
                        <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-400">No quotes match your search criteria.</p>
                    </div>
                )}
            </div>

            {/* Footer stats */}
            <div className="p-3 border-t border-slate-600/30 bg-slate-800/20">
                <div className="text-xs text-slate-400 text-center">
                    {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} saved
                    {filteredQuotes.length !== quotes.length && (
                        <span> • {filteredQuotes.length} shown</span>
                    )}
                </div>
            </div>
        </div>
    );
};