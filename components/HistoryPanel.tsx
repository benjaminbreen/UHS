import React, { useMemo, useState, useEffect } from 'react';
import { BookOpen, User, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { suggestHistoricalPrimarySource } from '../services/llmService';
import ReactMarkdown from 'react-markdown';
import { GameDate, HistoricalEra, MapData, NpcEntity } from '../types';

// Define CulturalZone type locally to avoid import issues
type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';
// Heavy data files - import directly to avoid loading on app startup
import { HISTORY_GUIDE_DATA } from '../constants/gameData/historyguide';
import WikipediaArticle from './WikipediaArticle';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import { regionalHistoryService } from '../services/regionalHistoryService';
import { useUI } from '../contexts/UIContext';

interface HistoryPanelProps {
    gameDate: GameDate;
    currentZone: string;
    currentRegion: string;
    localArea: string;
    useLlmForDescriptions: boolean;
    mapData: MapData | null;
    npcs: NpcEntity[];
}

type HistorySubTab = 'primary_sources' | 'wikipedia';

const PrimarySourceDisplay: React.FC<{
    sources: PrimarySourceMetadata[];
    onSourceClick: (source: PrimarySourceMetadata) => void;
    currentYear?: number;
    currentZone?: string;
    localArea?: string;
}> = ({ sources, onSourceClick, currentYear, currentZone, localArea }) => {
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [aiSuggestedSource, setAiSuggestedSource] = useState<{
        description: string;
        excerpt: string;
        wikipediaLink: string;
        scholarSearchTerms: string;
    } | null>(null);

    if (sources.length === 0) {
        return (
            <div className="p-4 text-text-muted italic text-sm text-center">
                <BookOpen className="w-8 h-8 mb-2 opacity-50 mx-auto" />
                <p>No primary sources available for this era and region.</p>
                <p className="text-xs mt-2">Try exploring different time periods or locations!</p>
            </div>
        );
    }

    // Calculate year difference for display
    const getYearDifference = (sourceYear: number) => {
        if (!currentYear) return '';
        const diff = Math.abs(sourceYear - currentYear);
        if (diff === 0) return 'Contemporary';
        if (diff === 1) return '1 year away';
        if (diff < 10) return `${diff} years away`;
        if (diff < 100) return `~${Math.round(diff/10)*10} years away`;
        return `~${Math.round(diff/100)} centuries away`;
    };

    const handleSuggestSource = async () => {
        if (!currentYear || !localArea || !currentZone) {
            console.warn('Missing context for AI source suggestion');
            return;
        }

        setIsSuggesting(true);
        const result = await suggestHistoricalPrimarySource(
            currentYear,
            localArea,
            currentZone
        );
        setIsSuggesting(false);

        if (!result.error) {
            setAiSuggestedSource(result);
        }
    };

    // Display sources: AI suggestion first (if exists), then regular sources
    const displaySources = aiSuggestedSource
        ? [aiSuggestedSource, ...sources.slice(1)]
        : sources;

    return (
        <div className="p-3 space-y-3">
            <button
                onClick={handleSuggestSource}
                disabled={isSuggesting}
                className="w-full px-3 py-1.5 surface-muted hover:surface-card
                           disabled:opacity-50 disabled:cursor-not-allowed
                           text-text-secondary hover:text-[var(--color-warning)] text-xs font-medium rounded-lg
                           border border-surface-muted hover:border-[var(--color-warning)]/30
                           transition-all duration-200 flex items-center justify-center gap-2 mb-2"
            >
                {isSuggesting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-[var(--color-warning)]/50 border-t-[var(--color-warning)] rounded-full animate-spin" />
                        <span className="text-[var(--color-warning)]">Identifying sources...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Identify more relevant historical sources</span>
                    </>
                )}
            </button>

            {/* AI-suggested source (if exists) */}
            {aiSuggestedSource && (
                <div
                    className="surface-muted p-4 rounded-lg border-2 border-accent/50 hover:border-[var(--color-warning)]/50 transition-all cursor-pointer group relative"
                    onClick={() => {
                        // Convert AI suggestion to PrimarySourceMetadata format for modal
                        const aiSourceForModal: PrimarySourceMetadata = {
                            id: 'ai-suggested',
                            title: 'AI-Identified Historical Source',
                            author: 'AI Research Assistant',
                            year: currentYear || 0,
                            era: '',
                            culturalZones: [currentZone || ''],
                            excerpt: `${aiSuggestedSource.description}\n\n${aiSuggestedSource.excerpt}`,
                            keywords: [],
                            citation: {
                                translator: 'AI-generated suggestion',
                                modernSource: aiSuggestedSource.wikipediaLink
                            },
                            wikisourceTitle: aiSuggestedSource.wikipediaLink.replace('https://en.wikipedia.org/wiki/', ''),
                            scholarSearchTerms: aiSuggestedSource.scholarSearchTerms
                        };
                        onSourceClick(aiSourceForModal);
                    }}
                >
                    <div className="absolute -top-2 -right-2 bg-accent/90 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                        AI Suggested
                    </div>

                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-accent group-hover:text-accent/80 transition-colors">
                            AI-Identified Historical Source
                        </h4>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-[var(--color-warning)] transition-colors" />
                    </div>

                    <div className="text-sm text-text-secondary leading-relaxed line-clamp-2 prose prose-sm max-w-none">
                        <ReactMarkdown>{aiSuggestedSource.description}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Regular sources (skip first if AI source exists) */}
            {sources.slice(aiSuggestedSource ? 1 : 0).map((source, index) => (
                <div
                    key={source.id}
                    className="surface-muted p-4 rounded-lg border border-surface-muted hover:border-[var(--color-warning)]/50 transition-all cursor-pointer group relative"
                    onClick={() => onSourceClick(source)}
                >
                    {/* Proximity badge */}
                    {index === 0 && !aiSuggestedSource && (
                        <div className="absolute -top-2 -right-2 bg-[var(--color-warning)] text-white text-xs px-2 py-0.5 rounded-full">
                            Closest
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-[var(--color-warning)] group-hover:opacity-80 transition-colors">
                            {source.title}
                        </h4>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-[var(--color-warning)] transition-colors" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {source.author}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`}
                        </span>
                        {currentYear && (
                            <span className="text-[var(--color-warning)] font-medium">
                                {getYearDifference(source.year)}
                            </span>
                        )}
                    </div>

                    <div className="text-sm text-text-secondary leading-relaxed line-clamp-2 prose prose-sm max-w-none">
                        <ReactMarkdown>{source.excerpt}</ReactMarkdown>
                    </div>

                    {source.citation?.translator && (
                        <p className="text-xs text-text-muted mt-2 italic">
                            Translated by {source.citation.translator}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({
    gameDate,
    currentZone,
    currentRegion,
    localArea,
    useLlmForDescriptions,
    mapData,
    npcs
}) => {
    const { setSelectedPrimarySource } = useUI();
    const [activeSubTab, setActiveSubTab] = useState<HistorySubTab>('primary_sources'); // Default to primary sources
    const [primarySources, setPrimarySources] = useState<PrimarySourceMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [wikipediaOverrideTerm, setWikipediaOverrideTerm] = useState<string | null>(null);
    const [isContextExpanded, setIsContextExpanded] = useState(false);

    const { era, culturalZone } = useMemo(() => {
        const dateInfo = parseDateString(String(gameDate.year));
        const culture = mapLocationToCulture(currentZone, dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [gameDate.year, currentZone]);

    const [historicalSummary, setHistoricalSummary] = useState<string>(
        "Loading historical context..."
    );

    // Load historical context using new regional system
    useEffect(() => {
        const loadHistoricalContext = async () => {
            try {
                // Try to get region-specific description
                const description = await regionalHistoryService.getHistoricalContext(
                    culturalZone,
                    currentRegion,
                    gameDate.year,
                    era
                );
                setHistoricalSummary(description);
            } catch (error) {
                console.error('Error loading historical context:', error);
                // Fallback to era-level description
                const fallback = HISTORY_GUIDE_DATA[culturalZone]?.[era] ||
                    "No specific historical context is available for this time and place. The world is yours to discover.";
                setHistoricalSummary(fallback);
            }
        };

        loadHistoricalContext();
    }, [culturalZone, currentRegion, gameDate.year, era]);

    // Load primary sources when era/zone changes - filtered by temporal proximity
    useEffect(() => {
        const loadSources = async () => {
            setLoading(true);
            try {
                // We need to load sources from multiple eras to find the closest ones
                // Load sources from current era and adjacent eras
                const allEras: HistoricalEra[] = ['PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA', 'MODERN', 'FUTURE'];
                const currentEraIndex = allEras.indexOf(era);
                
                // Load current era plus adjacent eras for better coverage
                const erasToLoad: HistoricalEra[] = [];
                if (currentEraIndex > 0) erasToLoad.push(allEras[currentEraIndex - 1]);
                erasToLoad.push(era);
                if (currentEraIndex < allEras.length - 1) erasToLoad.push(allEras[currentEraIndex + 1]);
                
                // Collect all sources from relevant eras
                let allSources: PrimarySourceMetadata[] = [];
                for (const loadEra of erasToLoad) {
                    await primarySourceService.preloadContext(loadEra, culturalZone);
                    const eraSources = await primarySourceService.getSourcesForContext(loadEra, culturalZone);
                    allSources = allSources.concat(eraSources);
                }
                
                // Filter to only sources matching the cultural zone
                const zoneFilteredSources = allSources.filter(source => 
                    source.culturalZones.includes(culturalZone)
                );
                
                // Remove duplicates (in case same source appears in multiple eras)
                const uniqueSources = Array.from(new Map(
                    zoneFilteredSources.map(source => [source.id, source])
                ).values());
                
                // Sort by temporal proximity to current game year
                const currentYear = gameDate.year;
                const sortedByProximity = uniqueSources.sort((a, b) => {
                    const distanceA = Math.abs(a.year - currentYear);
                    const distanceB = Math.abs(b.year - currentYear);
                    return distanceA - distanceB;
                });
                
                // Take only the top 5 closest sources
                const top5Sources = sortedByProximity.slice(0, 5);
                
                setPrimarySources(top5Sources);
            } catch (error) {
                console.error('Error loading primary sources:', error);
                setPrimarySources([]);
            } finally {
                setLoading(false);
            }
        };

        loadSources();
    }, [era, culturalZone, gameDate.year]);

    // Parse historical summary and make capitalized words/phrases clickable
    const renderHistoricalSummary = (text: string) => {
        // Split by sentences to preserve sentence-initial capitals
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        return sentences.map((sentence, sentenceIdx) => {
            const parts: React.ReactNode[] = [];
            const words = sentence.split(/(\s+)/); // Keep whitespace

            let skipNext = 0; // Track if we should skip next word (part of multi-word phrase)

            words.forEach((word, wordIdx) => {
                if (skipNext > 0) {
                    skipNext--;
                    return;
                }

                const trimmed = word.trim();
                const isFirstWord = wordIdx === 0 || (wordIdx === 1 && words[0].trim() === '');

                // Match capitalized words (excluding sentence-initial and common words)
                const commonWords = new Set(['The', 'A', 'An', 'In', 'On', 'At', 'By', 'For', 'To', 'From', 'With', 'And', 'Or', 'But', 'As', 'This', 'That', 'These', 'Those', 'It', 'Its', 'Their', 'There', 'Where', 'When', 'How', 'Why', 'What', 'Which', 'Who']);
                const hasCapital = /^[A-Z][a-z]+/.test(trimmed);
                const isClickable = hasCapital && !isFirstWord && !commonWords.has(trimmed);

                if (isClickable) {
                    // Look ahead to see if next word(s) are also capitalized (multi-word proper nouns)
                    const phrase: string[] = [trimmed];
                    let lookahead = wordIdx + 2; // Start 2 ahead (skip the whitespace after current word)

                    while (lookahead < words.length) {
                        const nextWord = words[lookahead].trim();

                        // If we hit empty string (whitespace-only), skip it
                        if (!nextWord) {
                            lookahead++;
                            continue;
                        }

                        const nextHasCapital = /^[A-Z][a-z]+/.test(nextWord);

                        // Stop if non-capitalized word
                        if (!nextHasCapital) break;

                        phrase.push(nextWord);
                        lookahead += 2; // Skip to next word (past whitespace)
                    }

                    // Calculate how many indices to skip
                    const phraseLength = phrase.length;
                    if (phraseLength > 1) {
                        skipNext = (phraseLength - 1) * 2; // Each additional word has whitespace before it
                    }

                    // Reconstruct the full phrase with original whitespace
                    let fullPhrase = word;
                    for (let i = 1; i < phraseLength; i++) {
                        const whitespaceIdx = wordIdx + (i * 2) - 1;
                        const wordIndex = wordIdx + (i * 2);
                        if (whitespaceIdx < words.length) fullPhrase += words[whitespaceIdx];
                        if (wordIndex < words.length) fullPhrase += words[wordIndex];
                    }

                    // Clean phrase for Wikipedia (underscores between words)
                    const cleanPhrase = phrase.map(w => w.replace(/[.,;:!?()]/g, '').replace(/'s$/i, '')).join('_');

                    parts.push(
                        <span
                            key={`${sentenceIdx}-${wordIdx}`}
                            onClick={() => {
                                setWikipediaOverrideTerm(cleanPhrase);
                                setActiveSubTab('wikipedia');
                            }}
                            className="underline decoration-[var(--color-warning)]/60 hover:decoration-[var(--color-warning)] hover:opacity-80 cursor-pointer transition-colors"
                            style={{ textShadow: '0 0 8px var(--color-warning-glow, rgba(251, 191, 36, 0.3))' }}
                        >
                            {fullPhrase}
                        </span>
                    );
                } else {
                    parts.push(<span key={`${sentenceIdx}-${wordIdx}`}>{word}</span>);
                }
            });

            return <span key={sentenceIdx}>{parts}</span>;
        });
    };

    return (
        <>
            <div className="flex flex-col h-full surface-card rounded-lg">
                <div className="p-4 shrink-0">
                    <h3 className="text-lg font-semibold text-[var(--color-warning)] mb-2">Historical Context</h3>
                    <div className="relative">
                        <div className={`text-sm italic text-text-secondary ${!isContextExpanded ? 'line-clamp-4' : ''}`}>
                            {renderHistoricalSummary(historicalSummary)}
                        </div>
                        {!isContextExpanded && historicalSummary.length > 200 && (
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background-primary/90 to-transparent pointer-events-none" />
                        )}
                        {historicalSummary.length > 200 && (
                            <button
                                onClick={() => setIsContextExpanded(!isContextExpanded)}
                                className="mt-2 text-xs text-[var(--color-warning)] hover:opacity-80 flex items-center gap-1 font-medium"
                            >
                                {isContextExpanded ? (
                                    <>
                                        <span>▲</span>
                                        <span>Show less</span>
                                    </>
                                ) : (
                                    <>
                                        <span>▼</span>
                                        <span>Read more</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex surface-muted border-y border-surface-muted shrink-0">
                    {(['primary_sources', 'wikipedia'] as HistorySubTab[]).map(tab => (
                         <button
                            key={tab}
                            className={`flex-1 py-2 px-1 text-center text-xs font-semibold transition-colors duration-200 border-b-2 ${
                                activeSubTab === tab
                                    ? 'text-text-primary border-[var(--color-warning)]'
                                    : 'text-text-muted border-transparent hover:surface-card hover:text-text-primary'
                            }`}
                            onClick={() => setActiveSubTab(tab)}
                            aria-selected={activeSubTab === tab}
                         >
                             {tab === 'primary_sources' ? 'Primary Sources' : 'Wikipedia'}
                         </button>
                    ))}
                </div>

                <div className="flex-grow overflow-y-auto scrollbar-thin">
                    {activeSubTab === 'wikipedia' && (
                        <WikipediaArticle
                            gameDate={gameDate}
                            currentRegion={currentRegion}
                            localArea={localArea}
                            useLlm={useLlmForDescriptions}
                            overrideSearchTerm={wikipediaOverrideTerm}
                            onTermUsed={() => setWikipediaOverrideTerm(null)}
                        />
                    )}
                    {activeSubTab === 'primary_sources' && (
                        loading ? (
                            <div className="p-4 text-center text-text-muted">
                                <div className="animate-pulse">Loading sources...</div>
                            </div>
                        ) : (
                            <PrimarySourceDisplay
                                sources={primarySources}
                                onSourceClick={setSelectedPrimarySource}
                                currentYear={gameDate.year}
                                currentZone={currentZone}
                                localArea={localArea}
                            />
                        )
                    )}
                </div>
            </div>
        </>
    );
};

export default HistoryPanel;