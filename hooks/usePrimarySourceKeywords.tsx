import React, { useEffect, useState, useCallback } from 'react';
import { HistoricalEra } from '../types';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';

// Define CulturalZone type locally to avoid import issues
type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';

interface KeywordMatch {
  keyword: string;
  sources: PrimarySourceMetadata[];
}

export const usePrimarySourceKeywords = (
  text: string,
  era?: HistoricalEra,
  zone?: CulturalZone,
  enabled: boolean = true
) => {
  const [matches, setMatches] = useState<KeywordMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const scanForKeywords = useCallback(async () => {
    if (!enabled || !text || text.length < 3) {
      setMatches([]);
      return;
    }

    setLoading(true);
    try {
      // Get all loaded sources (we should preload the context first)
      const allSources = primarySourceService.getAllLoadedSources();
      
      // Extract all unique keywords from sources
      const keywordToSources = new Map<string, PrimarySourceMetadata[]>();
      
      allSources.forEach(source => {
        // Check simple keywords
        source.keywords.forEach(keyword => {
          const lowerKeyword = keyword.toLowerCase();
          if (!keywordToSources.has(lowerKeyword)) {
            keywordToSources.set(lowerKeyword, []);
          }
          keywordToSources.get(lowerKeyword)!.push(source);
        });
        
        // Check contextual keywords if context matches
        source.contextualKeywords?.forEach(ck => {
          const contextMatches = 
            (!ck.conditions.era || ck.conditions.era === era) &&
            (!ck.conditions.culturalZone || ck.conditions.culturalZone === zone);
          
          if (contextMatches) {
            const lowerKeyword = ck.keyword.toLowerCase();
            if (!keywordToSources.has(lowerKeyword)) {
              keywordToSources.set(lowerKeyword, []);
            }
            if (!keywordToSources.get(lowerKeyword)!.find(s => s.id === source.id)) {
              keywordToSources.get(lowerKeyword)!.push(source);
            }
          }
        });
      });

      // Find keywords in text
      const textLower = text.toLowerCase();
      const foundMatches: KeywordMatch[] = [];
      
      keywordToSources.forEach((sources, keyword) => {
        // Use word boundary matching to avoid partial matches
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(textLower)) {
          foundMatches.push({ keyword, sources });
        }
      });

      setMatches(foundMatches);
    } catch (error) {
      console.error('Error scanning for keywords:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [text, era, zone, enabled]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      scanForKeywords();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer);
  }, [scanForKeywords]);

  return { matches, loading };
};

/**
 * Component to wrap text and highlight keywords with tooltips
 */
export const HighlightedText: React.FC<{
  text: string;
  era?: HistoricalEra;
  zone?: CulturalZone;
  onKeywordClick?: (source: PrimarySourceMetadata) => void;
}> = ({ text, era, zone, onKeywordClick }) => {
  const { matches } = usePrimarySourceKeywords(text, era, zone);
  
  // Helper function to render text with markdown italics
  const renderWithMarkdown = (str: string): React.ReactNode => {
    const parts = str.split(/\*(.*?)\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <em key={i} className="italic">{part}</em> : part
    );
  };

  if (matches.length === 0) {
    // No keywords to highlight, just parse markdown
    return <>{renderWithMarkdown(text)}</>;
  }

  // Create a map of positions where keywords appear
  const keywordPositions: Array<{
    start: number;
    end: number;
    keyword: string;
    sources: PrimarySourceMetadata[];
  }> = [];

  matches.forEach(({ keyword, sources }) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      keywordPositions.push({
        start: match.index,
        end: match.index + match[0].length,
        keyword: match[0], // Preserve original case
        sources
      });
    }
  });

  // Sort by position
  keywordPositions.sort((a, b) => a.start - b.start);

  // Build the highlighted text
  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  keywordPositions.forEach((pos, index) => {
    // Add text before keyword (with markdown parsing)
    if (pos.start > lastEnd) {
      const textBefore = text.substring(lastEnd, pos.start);
      const parts = textBefore.split(/\*(.*?)\*/g);
      const renderedParts = parts.map((part, i) =>
        i % 2 === 1 ? <em key={`text-${index}-${i}`} className="italic">{part}</em> : part
      );
      elements.push(
        <span key={`text-${index}`}>
          {renderedParts}
        </span>
      );
    }

    // Add highlighted keyword
    elements.push(
      <span
        key={`keyword-${index}`}
        className="underline decoration-amber-500/50 decoration-dotted cursor-pointer hover:decoration-amber-500 hover:bg-amber-500/10 transition-all relative group"
        onClick={() => {
          if (onKeywordClick && pos.sources[0]) {
            onKeywordClick(pos.sources[0]);
          }
        }}
      >
        {pos.keyword}
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-gray-900 border border-amber-500/50 rounded-lg p-2 shadow-xl max-w-xs">
            <div className="text-xs text-amber-400 font-semibold mb-1">
              Primary Sources ({pos.sources.length})
            </div>
            {pos.sources.slice(0, 3).map((source, i) => (
              <div key={i} className="text-xs text-gray-300">
                • {source.title}
              </div>
            ))}
            {pos.sources.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                +{pos.sources.length - 3} more...
              </div>
            )}
          </div>
        </div>
      </span>
    );

    lastEnd = pos.end;
  });

  // Add remaining text (with markdown parsing)
  if (lastEnd < text.length) {
    const remainingText = text.substring(lastEnd);
    const parts = remainingText.split(/\*(.*?)\*/g);
    const renderedParts = parts.map((part, i) =>
      i % 2 === 1 ? <em key={`final-${i}`} className="italic">{part}</em> : part
    );
    elements.push(
      <span key="text-final">
        {renderedParts}
      </span>
    );
  }

  return <>{elements}</>;
};