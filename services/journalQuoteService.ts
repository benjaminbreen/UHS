/**
 * services/journalQuoteService.ts - Service for managing journal quotes from primary sources
 */

import { JournalQuote } from '../types/journal';
import { PrimarySourceMetadata } from './primarySourceService';

interface GameContext {
    location: string;
    gameDate: { year: number; month: number; day: number };
}

class JournalQuoteService {
    private storageKey = 'journal-quotes';

    /**
     * Add a new quote to the journal
     */
    addQuote(
        quote: string,
        source: PrimarySourceMetadata,
        gameContext?: GameContext
    ): JournalQuote {
        const journalQuote: JournalQuote = {
            id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            quote: quote.trim(),
            sourceTitle: source.title,
            author: source.author,
            year: source.year,
            era: source.era,
            culturalZone: source.culturalZones[0] || 'UNKNOWN',
            dateAdded: new Date(),
            gameContext,
            tags: this.extractTags(source, quote)
        };

        const quotes = this.getQuotes();
        quotes.push(journalQuote);
        this.saveQuotes(quotes);

        return journalQuote;
    }

    /**
     * Get all quotes from storage
     */
    getQuotes(): JournalQuote[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return [];

            const quotes = JSON.parse(stored);
            // Convert dateAdded back to Date objects
            return quotes.map((quote: any) => ({
                ...quote,
                dateAdded: new Date(quote.dateAdded)
            }));
        } catch (error) {
            console.error('Error loading journal quotes:', error);
            return [];
        }
    }

    /**
     * Search quotes by content, author, title, or tags
     */
    searchQuotes(query: string): JournalQuote[] {
        const quotes = this.getQuotes();
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) return quotes;

        return quotes.filter(quote =>
            quote.quote.toLowerCase().includes(searchTerm) ||
            quote.author.toLowerCase().includes(searchTerm) ||
            quote.sourceTitle.toLowerCase().includes(searchTerm) ||
            quote.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            quote.era.toLowerCase().includes(searchTerm) ||
            quote.culturalZone.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Delete a quote by ID
     */
    deleteQuote(id: string): boolean {
        const quotes = this.getQuotes();
        const filtered = quotes.filter(quote => quote.id !== id);

        if (filtered.length === quotes.length) {
            return false; // Quote not found
        }

        this.saveQuotes(filtered);
        return true;
    }

    /**
     * Get quotes by source
     */
    getQuotesBySource(sourceTitle: string): JournalQuote[] {
        return this.getQuotes().filter(quote =>
            quote.sourceTitle === sourceTitle
        );
    }

    /**
     * Get quotes by era
     */
    getQuotesByEra(era: string): JournalQuote[] {
        return this.getQuotes().filter(quote =>
            quote.era === era
        );
    }

    /**
     * Export quotes to different formats
     */
    exportQuotes(format: 'text' | 'markdown' = 'text'): string {
        const quotes = this.getQuotes();

        if (format === 'markdown') {
            return quotes.map(quote => {
                const yearDisplay = quote.year < 0 ? `${Math.abs(quote.year)} BCE` : `${quote.year} CE`;
                return `## ${quote.sourceTitle}\n\n> ${quote.quote}\n\n**${quote.author}**, ${yearDisplay}  \n*Added: ${quote.dateAdded.toLocaleDateString()}*\n\n---\n`;
            }).join('\n');
        }

        // Text format
        return quotes.map(quote => {
            const yearDisplay = quote.year < 0 ? `${Math.abs(quote.year)} BCE` : `${quote.year} CE`;
            return `"${quote.quote}"\n\n— ${quote.author}, ${quote.sourceTitle} (${yearDisplay})\nAdded: ${quote.dateAdded.toLocaleDateString()}\n\n`;
        }).join('---\n\n');
    }

    /**
     * Get total number of quotes
     */
    getQuoteCount(): number {
        return this.getQuotes().length;
    }

    /**
     * Private: Save quotes to localStorage
     */
    private saveQuotes(quotes: JournalQuote[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(quotes));
        } catch (error) {
            console.error('Error saving journal quotes:', error);
        }
    }

    /**
     * Private: Extract tags from source and quote content
     */
    private extractTags(source: PrimarySourceMetadata, quote: string): string[] {
        const tags: Set<string> = new Set();

        // Add keywords from source
        if (source.keywords) {
            source.keywords.forEach(keyword => tags.add(keyword.toLowerCase()));
        }

        // Add era and cultural zone as tags
        tags.add(source.era.toLowerCase());
        tags.add(source.culturalZones[0]?.toLowerCase() || 'unknown');

        // Simple content-based tag extraction
        const contentTags = this.extractContentTags(quote);
        contentTags.forEach(tag => tags.add(tag));

        return Array.from(tags);
    }

    /**
     * Private: Extract simple tags from quote content
     */
    private extractContentTags(text: string): string[] {
        const tags: string[] = [];
        const lowerText = text.toLowerCase();

        // Common historical/cultural keywords
        const keywordMap: { [key: string]: string[] } = {
            'trade': ['commerce', 'merchant', 'trading', 'goods', 'market'],
            'religion': ['god', 'prayer', 'temple', 'mosque', 'church', 'faith'],
            'politics': ['king', 'emperor', 'ruler', 'government', 'law', 'court'],
            'travel': ['journey', 'voyage', 'road', 'path', 'destination'],
            'war': ['battle', 'fight', 'army', 'warrior', 'conflict', 'victory'],
            'knowledge': ['learn', 'study', 'wisdom', 'education', 'scholar']
        };

        Object.entries(keywordMap).forEach(([tag, keywords]) => {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                tags.push(tag);
            }
        });

        return tags;
    }
}

// Create singleton instance
export const journalQuoteService = new JournalQuoteService();