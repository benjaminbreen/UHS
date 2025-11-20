import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, BookOpen, Copy, ExternalLink, Download, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import { getBackgroundPaths, loadBackgroundImage } from '../services/backgroundSelectionService';
import { JournalQuoteTooltip } from './JournalQuoteTooltip';
import { journalQuoteService } from '../services/journalQuoteService';
import { TooltipPosition, GameLogEntry, GameDate } from '../types/journal';
import { LogService } from '../services/logService';
import { AssessmentPrimarySourceLog } from '../types/assessment';

interface PrimarySourceModalProps {
  source: PrimarySourceMetadata;
  onClose: () => void;
  // Current game context for background
  currentTile?: {
    biome: string;
    climate?: any;
    season?: any;
  };
  culturalZone?: string;
  weather?: any;
  gameTime?: { hours: number; minutes: number };
  showToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  // Phase 2: Enhanced logging
  gameDate?: GameDate;
  location?: string;
  timeOfDay?: string;
  formattedTime?: string;
  onLogEvent?: (entry: GameLogEntry) => void;
  // Phase 3: XP rewards and assessment
  onAddXP?: (amount: number) => void;
  onLogAssessment?: (log: AssessmentPrimarySourceLog) => void;
}

interface WikipediaContent {
  extract: string;
  extract_html?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop: {
      page: string;
    };
  };
  description?: string;
}

// Cultural zone gradient colors
const getCulturalGradient = (zones: string[]): string => {
  const zone = zones[0]; // Use first zone if multiple
  const gradients: Record<string, string> = {
    'EUROPEAN': 'from-blue-50 to-indigo-50',
    'EAST_ASIAN': 'from-red-50 to-pink-50',
    'SOUTH_ASIAN': 'from-orange-50 to-amber-50',
    'MENA': 'from-emerald-50 to-teal-50',
    'SUB_SAHARAN_AFRICAN': 'from-yellow-50 to-orange-50',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'from-purple-50 to-pink-50',
    'NORTH_AMERICAN_COLONIAL': 'from-slate-50 to-blue-50',
    'SOUTH_AMERICAN': 'from-green-50 to-lime-50',
    'OCEANIA': 'from-cyan-50 to-blue-50'
  };
  return gradients[zone] || 'from-gray-50 to-gray-100';
};

export const PrimarySourceModal: React.FC<PrimarySourceModalProps> = ({
  source,
  onClose,
  currentTile,
  culturalZone,
  weather,
  gameTime,
  showToast,
  gameDate,
  location,
  timeOfDay,
  formattedTime,
  onLogEvent,
  onAddXP,
  onLogAssessment
}) => {
  // Determine initial tab based on source.defaultTab or fallback logic
  const getInitialTab = (): 'excerpt' | 'fulltext' | 'citation' | 'wikipedia' => {
    if (source.defaultTab) {
      return source.defaultTab;
    }
    // Auto-default to Wikipedia if it exists and excerpt is minimal/placeholder
    if ((source.wikipediaArticle || source.title) &&
        (source.excerpt.includes('[Undeciphered') ||
         source.excerpt.includes('[Unknown') ||
         source.excerpt.length < 50)) {
      return 'wikipedia';
    }
    return 'excerpt';
  };

  const [activeTab, setActiveTab] = useState<'excerpt' | 'fulltext' | 'citation' | 'wikipedia'>(getInitialTab());
  const [wikipediaContent, setWikipediaContent] = useState<WikipediaContent | null>(null);
  const [wikipediaLoading, setWikipediaLoading] = useState(false);
  const [wikipediaError, setWikipediaError] = useState<string | null>(null);
  const [autoDetectedWikipedia, setAutoDetectedWikipedia] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);

  // Journal quote selection state
  const [selectedText, setSelectedText] = useState<string>('');
  const [showQuoteTooltip, setShowQuoteTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  const culturalGradient = getCulturalGradient(source.culturalZones);

  // Log PRIMARY_SOURCE_READ event when modal opens
  useEffect(() => {
    if (onLogEvent && gameDate && formattedTime) {
      const logEntry = LogService.createPrimarySourceReadLog(
        source.title,
        source.author,
        source.year,
        location || 'Unknown Location',
        gameDate,
        formattedTime,
        timeOfDay
      );
      onLogEvent(logEntry);
    }

    // Log to assessment system
    if (onLogAssessment) {
      const assessmentLog: AssessmentPrimarySourceLog = {
        timestamp: new Date().toISOString(),
        sourceId: source.id || source.title,
        sourceTitle: source.title,
        action: 'open',
        metadata: {
          author: source.author,
          year: source.year,
          era: source.era,
          culturalZones: source.culturalZones
        }
      };
      onLogAssessment(assessmentLog);
    }
  }, []); // Only run once on mount

  // Handle text selection for journal quotes
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowQuoteTooltip(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 10) {
      setShowQuoteTooltip(false);
      return;
    }

    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      setShowQuoteTooltip(false);
      return;
    }

    // Position tooltip near the selection
    setSelectedText(selectedText);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowQuoteTooltip(true);
  }, []);

  // Handle adding quote to journal
  const handleAddToJournal = useCallback(() => {
    if (!selectedText) return;

    // Add game context if available
    const gameContext = gameDate ? {
      location: location || 'Unknown Location',
      gameDate: gameDate
    } : undefined;

    const addedQuote = journalQuoteService.addQuote(selectedText, source, gameContext);

    // Dispatch event to notify JournalQuotesPanel
    window.dispatchEvent(new Event('quoteAdded'));

    // Log PRIMARY_SOURCE_QUOTED event
    if (onLogEvent && gameDate && formattedTime) {
      const logEntry = LogService.createPrimarySourceQuotedLog(
        source.title,
        source.author,
        selectedText,
        location || 'Unknown Location',
        gameDate,
        formattedTime,
        timeOfDay
      );
      onLogEvent(logEntry);
    }

    // Award +1 XP for quoting primary source
    if (onAddXP) {
      onAddXP(1);
    }

    // Log to assessment system
    if (onLogAssessment) {
      const assessmentLog: AssessmentPrimarySourceLog = {
        timestamp: new Date().toISOString(),
        sourceId: source.id || source.title,
        sourceTitle: source.title,
        action: 'quote',
        metadata: {
          quoteLength: selectedText.length,
          quotePreview: selectedText.substring(0, 100),
          location: location || 'Unknown Location',
          gameDate: gameDate
        }
      };
      onLogAssessment(assessmentLog);
    }

    // Clear selection and hide tooltip
    setShowQuoteTooltip(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();

    // Show success toast
    if (showToast) {
      showToast(`📖 Quote added to journal from "${source.title}" (+1 XP)`, 'success');
    }
  }, [selectedText, source, gameDate, location, timeOfDay, formattedTime, onLogEvent, onAddXP, onLogAssessment, showToast]);

  // Cancel quote selection
  const handleCancelQuote = useCallback(() => {
    setShowQuoteTooltip(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  }, []);

  // Add event listener for text selection
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleTextSelection, 10);
    };

    contentElement.addEventListener('mouseup', handleMouseUp);

    return () => {
      contentElement.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTextSelection]);

  // Load background image based on current location
  useEffect(() => {
    const loadBackground = async () => {
      if (currentTile?.biome) {
        try {
          const paths = getBackgroundPaths(
            currentTile.biome,
            weather,
            gameTime,
            culturalZone,
            currentTile.climate,
            currentTile.season
          );
          const backgroundUrl = await loadBackgroundImage(paths);
          setBackgroundImageUrl(backgroundUrl);
        } catch (error) {
          setBackgroundImageUrl(null);
        }
      }
    };

    loadBackground();
  }, [currentTile?.biome, weather, gameTime, culturalZone, currentTile?.climate, currentTile?.season]);

  // Auto-detect Wikipedia article
  useEffect(() => {
    if (!source.wikipediaArticle) {
      // Try to auto-detect Wikipedia article based on title
      const tryAutoDetect = async () => {
        try {
          // Clean title for Wikipedia search
          const searchTitle = source.title.replace(/^The /, '').replace(/[,:]/g, '');
          const testUrl = searchTitle.replace(/ /g, '_');

          const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${testUrl}`
          );

          if (response.ok) {
            setAutoDetectedWikipedia(testUrl);
          }
        } catch (e) {
          // Silent fail - no Wikipedia article found
        }
      };

      tryAutoDetect();
    }
  }, [source.title, source.wikipediaArticle]);

  const effectiveWikipediaArticle = source.wikipediaArticle || source.wikisourceTitle || autoDetectedWikipedia;

  useEffect(() => {
    if (effectiveWikipediaArticle && activeTab === 'wikipedia' && !wikipediaContent) {
      fetchWikipediaContent();
    }
  }, [activeTab, source.wikipediaArticle, source.wikisourceTitle]);

  const fetchWikipediaContent = async () => {
    if (!effectiveWikipediaArticle) return;

    setWikipediaLoading(true);
    setWikipediaError(null);

    // Check localStorage cache first
    const cacheKey = `wikipedia_${effectiveWikipediaArticle}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        // Check if cache is less than 24 hours old
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
          setWikipediaContent(cachedData.content);
          setWikipediaLoading(false);
          return;
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    let contentToCache = null;

    try {
      // First try to get mobile-html which has more content
      const mobileResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/mobile-html/${effectiveWikipediaArticle}`
      );

      if (mobileResponse.ok) {
        const htmlText = await mobileResponse.text();

        // Extract paragraphs from the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Get the first 5-7 paragraphs
        const paragraphs = doc.querySelectorAll('p');
        let extractText = '';
        let paraCount = 0;

        for (let i = 0; i < paragraphs.length && paraCount < 7; i++) {
          const text = paragraphs[i].textContent?.trim();
          if (text && text.length > 50) { // Skip very short paragraphs
            extractText += text + '\n\n';
            paraCount++;
          }
        }

        // Also get the summary for the thumbnail
        const summaryResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${effectiveWikipediaArticle}`
        );

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          contentToCache = {
            ...summaryData,
            extract: extractText || summaryData.extract
          };
          setWikipediaContent(contentToCache);
        } else {
          contentToCache = {
            extract: extractText,
            content_urls: {
              desktop: {
                page: `https://en.wikipedia.org/wiki/${effectiveWikipediaArticle}`
              }
            }
          };
          setWikipediaContent(contentToCache);
        }
      } else {
        // Fallback to summary API
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${effectiveWikipediaArticle}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Wikipedia content');
        }

        const data = await response.json();
        contentToCache = data;
        setWikipediaContent(data);
      }

      // Cache the result
      if (contentToCache) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            content: contentToCache,
            timestamp: Date.now()
          }));
        } catch (e) {
          // localStorage might be full - try to clear old cache entries
          if (e.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded. Clearing old Wikipedia cache entries...');

            // Clear old Wikipedia cache entries (older than 1 day to be more aggressive)
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('wikipedia_')) {
                try {
                  const cached = JSON.parse(localStorage.getItem(key) || '{}');
                  if (cached.timestamp && cached.timestamp < oneWeekAgo) {
                    keysToRemove.push(key);
                  }
                } catch (parseError) {
                  // Invalid cache entry, mark for removal
                  keysToRemove.push(key);
                }
              }
            }

            // Remove old entries
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Try caching again if we cleared some space
            if (keysToRemove.length > 0) {
              try {
                localStorage.setItem(cacheKey, JSON.stringify({
                  content: contentToCache,
                  timestamp: Date.now()
                }));
                console.log(`Cleared ${keysToRemove.length} old cache entries and successfully cached new content`);
              } catch (retryError) {
                console.warn('Still unable to cache after cleanup - content too large for localStorage');
              }
            } else {
              console.warn('No old cache entries to clear - content may be too large for localStorage');
            }
          } else {
            console.warn('Failed to cache Wikipedia content:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Wikipedia content:', error);
      setWikipediaError('Unable to load Wikipedia content. Please try again later.');
    } finally {
      setWikipediaLoading(false);
    }
  };

  const copyCitation = () => {
    const citation = formatCitation();
    navigator.clipboard.writeText(citation);
  };

  const formatCitation = () => {
    const year = source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`;
    const translator = source.citation.translator ? `, trans. ${source.citation.translator}` : '';
    const publication = source.citation.originalPublication || '';
    
    return `${source.author}. "${source.title}"${translator}. ${publication} (${year}).`;
  };

  const downloadText = () => {
    const content = source.longExcerpt || source.excerpt;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInWikisource = () => {
    if (source.wikisourceTitle) {
      window.open(`https://en.wikisource.org/wiki/${source.wikisourceTitle}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with background image and cultural gradient overlay */}
        <div
          className={`relative border-b border-gray-200 p-4 md:p-6 overflow-hidden ${!backgroundImageUrl ? `bg-gradient-to-r ${culturalGradient}` : 'bg-gray-600'}`}
          style={{
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: '50% 35%',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Gradient dark overlay - stronger on left, lighter on right */}
          {backgroundImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          )}
          {/* Cultural gradient overlay - very subtle */}
          {backgroundImageUrl && (
            <div className={`absolute inset-0 bg-gradient-to-r ${culturalGradient} opacity-25`} />
          )}

          {/* Content - positioned above overlays */}
          <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
            <div className="flex-1 min-w-0 mb-4 lg:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
                {source.title}
              </h1>
              <div className="text-base md:text-lg text-white/90 mb-2 drop-shadow">
                by <span className="font-medium">{source.author}</span>
                <span className="mx-2 text-white/70">•</span>
                <span className="font-medium">
                  {source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`}
                </span>
              </div>
              {source.citation.translator && (
                <p className="text-sm text-white/80 italic drop-shadow">
                  Translated by {source.citation.translator}
                </p>
              )}
            </div>

            {/* Content Toggle Buttons */}
            <div className="flex flex-row gap-2 justify-start lg:justify-end items-start">
              <div className="flex flex-wrap gap-2">
                {(effectiveWikipediaArticle || source.wikisourceTitle) && (
                  <button
                    onClick={() => setActiveTab('wikipedia')}
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                      activeTab === 'wikipedia'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <Globe className="w-4 h-4 inline mr-2" />
                    Wikipedia
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('excerpt')}
                  className={`px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    activeTab === 'excerpt'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  Brief
                </button>
                <button
                  onClick={() => setActiveTab('fulltext')}
                  className={`px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    activeTab === 'fulltext'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Full Text
                </button>
              </div>

              {/* Close button on desktop */}
              <button
                onClick={onClose}
                className="hidden lg:block text-white hover:text-white/80 transition-colors ml-4 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 text-white hover:text-white/80 transition-colors z-20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'wikipedia' && effectiveWikipediaArticle && (
            <div className="prose prose-lg max-w-none">
              {wikipediaLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="text-gray-600 mt-4">Loading Wikipedia content...</p>
                </div>
              ) : wikipediaError ? (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-red-600">{wikipediaError}</p>
                </div>
              ) : wikipediaContent ? (
                <div className="bg-white rounded-lg p-6 space-y-6">
                  {wikipediaContent.thumbnail && (
                    <div className="flex justify-center mb-6">
                      <img
                        src={wikipediaContent.thumbnail.source}
                        alt={source.title}
                        className="rounded-lg shadow-md max-w-full h-auto"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                  )}

                  <div className="text-gray-900 leading-relaxed">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Wikipedia Article</h3>
                    <div className="max-h-96 overflow-y-auto pr-4 space-y-4 text-gray-700">
                      {wikipediaContent.extract.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-base leading-7">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-gray-900 font-semibold mb-4">Keywords & Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {source.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {wikipediaContent.content_urls && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <a
                        href={wikipediaContent.content_urls.desktop.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Full Article on Wikipedia
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'excerpt' && (
            <div className="bg-white rounded-lg p-6">
              <div className="prose prose-lg max-w-none text-gray-700">
                <ReactMarkdown>{source.excerpt}</ReactMarkdown>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-gray-900 font-semibold mb-4">Keywords & Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {source.keywords.map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(keyword.replace(/ /g, '_'))}`, '_blank')}
                      className="px-3 py-1 bg-gray-200 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-colors cursor-pointer"
                      title={`Search Wikipedia for "${keyword}"`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>

              {source.citation.originalPublication && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-gray-900 font-semibold mb-2">Original Publication</h3>
                  <p className="text-gray-600">{source.citation.originalPublication}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fulltext' && (
            <div className="bg-white rounded-lg p-6">
              {source.longExcerpt ? (
                <div className="prose prose-lg max-w-none text-gray-700">
                  <ReactMarkdown>{source.longExcerpt}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-600 text-center py-12">
                  <BookOpen className="w-12 h-12 mb-4 opacity-50 mx-auto" />
                  <p>Extended excerpt not available for this source.</p>
                  <p className="mt-4 text-sm">Here is the brief excerpt:</p>
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-gray-700 text-left">
                    {source.excerpt}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'citation' && (
            <div className="bg-white rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-gray-900 font-semibold mb-3">Formatted Citation</h3>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-gray-700">{formatCitation()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-3">BibTeX</h3>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-gray-700">{`@book{${source.id.replace(/-/g, '_')},
  title={${source.title}},
  author={${source.author}},
  year={${Math.abs(source.year)}},
  ${source.citation.translator ? `translator={${source.citation.translator}},\n  ` : ''}${source.citation.originalPublication ? `note={${source.citation.originalPublication}}` : ''}
}`}</pre>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyCitation}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  <Copy className="w-4 h-4 inline mr-1" /> Copy Citation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`bg-gradient-to-r ${culturalGradient} border-t border-gray-200 p-4 rounded-b-xl`}>
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {source.wikisourceTitle && (
                <button
                  onClick={openInWikisource}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Wikisource
                </button>
              )}
              {source.scholarSearchTerms && (
                <button
                  onClick={() => window.open(`https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=${encodeURIComponent(source.scholarSearchTerms)}`, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg transition-colors shadow-sm"
                >
                  <Globe className="w-4 h-4" />
                  Google Scholar
                </button>
              )}
              <button
                onClick={downloadText}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setActiveTab('citation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
                  activeTab === 'citation'
                    ? 'bg-white text-gray-900'
                    : 'bg-white/60 hover:bg-white/80 text-gray-700'
                }`}
              >
                <Copy className="w-4 h-4" />
                Citation
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Journal Quote Tooltip */}
        {showQuoteTooltip && (
          <JournalQuoteTooltip
            position={tooltipPosition}
            selectedText={selectedText}
            onAddToJournal={handleAddToJournal}
            onCancel={handleCancelQuote}
          />
        )}
      </div>
    </div>
  );
};