import React, { useMemo, useState, useEffect } from 'react';
import { BookOpen, User, Calendar, ChevronRight } from 'lucide-react';
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
}> = ({ sources, onSourceClick, currentYear }) => {
    if (sources.length === 0) {
        return (
            <div className="p-4 text-slate-400 italic text-sm text-center">
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

    return (
        <div className="p-3 space-y-3">
            <div className="text-xs text-slate-500 text-center mb-2">
                Showing 5 closest sources to year {currentYear}
            </div>
            {sources.map((source, index) => (
                <div 
                    key={source.id} 
                    className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 hover:border-amber-500/50 transition-all cursor-pointer group relative"
                    onClick={() => onSourceClick(source)}
                >
                    {/* Proximity badge */}
                    {index === 0 && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Closest
                        </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
                            {source.title}
                        </h4>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {source.author}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`}
                        </span>
                        {currentYear && (
                            <span className="text-amber-600 font-medium">
                                {getYearDifference(source.year)}
                            </span>
                        )}
                    </div>
                    
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                        {source.excerpt}
                    </p>
                    
                    {source.citation.translator && (
                        <p className="text-xs text-slate-600 mt-2 italic">
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
                            className="underline decoration-amber-500/60 hover:decoration-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
                            style={{ textShadow: '0 0 8px rgba(251, 191, 36, 0.3)' }}
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
            <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-700/50">
                <div className="p-4 shrink-0">
                    <h3 className="text-lg font-semibold text-amber-300 mb-2">Historical Context</h3>
                    <p className="text-sm italic text-slate-400">{renderHistoricalSummary(historicalSummary)}</p>
                </div>
                
                <div className="flex bg-slate-800/60 border-y border-slate-700/50 shrink-0">
                    {(['primary_sources', 'wikipedia'] as HistorySubTab[]).map(tab => (
                         <button
                            key={tab}
                            className={`flex-1 py-2 px-1 text-center text-xs font-semibold transition-colors duration-200 border-b-2 ${
                                activeSubTab === tab 
                                    ? 'text-white border-amber-400' 
                                    : 'text-slate-300 border-transparent hover:bg-slate-700/50 hover:text-white'
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
                            <div className="p-4 text-center text-slate-400">
                                <div className="animate-pulse">Loading sources...</div>
                            </div>
                        ) : (
                            <PrimarySourceDisplay 
                                sources={primarySources} 
                                onSourceClick={setSelectedPrimarySource}
                                currentYear={gameDate.year}
                            />
                        )
                    )}
                </div>
            </div>
        </>
    );
};

export default HistoryPanel;