import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { X, User, Calendar, Globe, Trophy, MapPin, Crown, Scroll, Link, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import ProceduralPortrait from './portraits/ProceduralPortrait';
import { GameDate, HistoricalEra, CulturalZone } from '../types';
import { PlayerCharacter } from '../types/playerCharacter';
import { generateAttributeSentence } from '../services/characterGenerator';
import { GameMode } from '../types/eventTypes';
import { HISTORY_GUIDE_DATA } from '../constants/gameData/historyguide';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString, formatDateWithSeason, getSeasonFromDate } from '../utils/dateUtils';
import { regionalHistoryService } from '../services/regionalHistoryService';
import { URLGameConfig } from '../services/urlConfigService';
import { SeedManager } from '../services/seedService';
import { shareableStateService } from '../services/shareableStateService';
import { findZoneForMapArea } from '../services/zoneDetectionService';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import { dialectContinuumService } from '../services/dialectContinuumService';
// FACTION_DATA will be lazy-loaded for better performance
import { FACTION_ICONS } from '../constants/gameData/factionIcons';
import SimplePopulationChart from './charts/SimplePopulationChart';

// Lazy load heavy chart components
// PopulationChart replaced with SimplePopulationChart (no D3/Recharts dependency)
const MiniLocationMap = lazy(() => import('./charts/MiniLocationMap'));

// Loading skeleton component for charts
const ChartSkeleton = ({ height = "200px" }: { height?: string }) => (
    <div
        className="animate-pulse bg-gray-700 rounded-lg"
        style={{ height }}
    />
);

interface InitialScenarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerCharacter: PlayerCharacter;
    gameDate: GameDate;
    currentZone: string;
    currentRegion: string;
    localArea: string;
    gameMode: GameMode | null;
    urlConfig?: URLGameConfig | null;
    worldWeaverData?: {
        settingDescription?: string;
        characterDescription?: string;
        quest?: any;
    } | null;
    isProcessingWorldWeaver?: boolean;
}

// Mode-specific descriptions combining game mode, era, and culture
function getModeDescription(
    mode: GameMode | null, 
    era: HistoricalEra, 
    culturalZone: CulturalZone,
    playerCharacter: PlayerCharacter
): string {
    if (!mode) return "Begin your historical adventure.";
    
    const modeDescriptions: Record<string, Record<HistoricalEra, Record<CulturalZone, string>>> = {
        survival: {
            [HistoricalEra.ANTIQUITY]: {
                EUROPEAN: "Survive in the harsh wilderness of ancient Europe, where Roman legions march distant roads and barbarian tribes control vast forests.",
                EAST_ASIAN: "Navigate the dangers of ancient China's borderlands, where dynasties rise and fall and bandits roam the mountain passes.",
                MENA: "Endure the desert's trials in the shadow of great Persian and Babylonian empires.",
                SOUTH_ASIAN: "Weather monsoons and tigers in the jungles between emerging Hindu kingdoms.",
                SUB_SAHARAN_AFRICAN: "Face the challenges of the African savanna as great migrations reshape the continent.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Survive in pre-Columbian North America.",
                NORTH_AMERICAN_COLONIAL: "Do your best to survive North America after the Columbian Exchange.",
                SOUTH_AMERICAN: "Navigate the dangers of the Andes and Amazon in an age of emerging civilizations.",
                OCEANIA: "Master the challenges of island life as Polynesian navigators spread across the Pacific."
            },
            [HistoricalEra.MEDIEVAL]: {
                EUROPEAN: "Survive the Dark Ages, where plague, war, and famine stalk feudal lands.",
                EAST_ASIAN: "Endure the upheavals of medieval Asia, where Mongol invasions and dynastic wars reshape empires.",
                MENA: "Weather the storms of Crusades and conquests in the medieval Islamic world.",
                SOUTH_ASIAN: "Navigate the complex politics and dangers of medieval India's warring sultanates.",
                SUB_SAHARAN_AFRICAN: "Survive in the great kingdoms of medieval Africa, where trade and warfare shape daily life.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Face the challenges of life in the great mound-building civilizations of North America.",
                NORTH_AMERICAN_COLONIAL: "Survive in the developing medieval colonial territories of North America.",
                SOUTH_AMERICAN: "Endure the trials of life in the shadow of emerging Inca power.",
                OCEANIA: "Master survival in the sophisticated chiefdoms of Polynesia and Australia."
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                EUROPEAN: "Survive the upheavals of the Renaissance, where plague, war, and religious conflict reshape Europe.",
                EAST_ASIAN: "Endure the challenges of early modern Asia, where European traders bring new diseases and conflicts.",
                MENA: "Navigate the declining Ottoman Empire's struggles with plague, war, and European encroachment.",
                SOUTH_ASIAN: "Survive in Mughal India as European trading companies establish their first footholds.",
                SUB_SAHARAN_AFRICAN: "Face the disruptions of the early slave trade and European coastal settlements.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Survive the catastrophic arrival of European diseases and colonization.",
                NORTH_AMERICAN_COLONIAL: "Endure life in the harsh early colonial settlements of North America.",
                SOUTH_AMERICAN: "Endure the collapse of the Inca Empire and Spanish colonial brutality.",
                OCEANIA: "Face the first encounters with European explorers and their devastating diseases."
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                EUROPEAN: "Survive industrial Europe's smoke-filled cities, where factory work and urban poverty create new challenges.",
                EAST_ASIAN: "Navigate the upheavals of forced modernization and foreign intervention in East Asia.",
                MENA: "Endure the collapse of traditional empires under European colonial pressure.",
                SOUTH_ASIAN: "Survive under British colonial rule, where famines and exploitation devastate communities.",
                SUB_SAHARAN_AFRICAN: "Face the brutal realities of the 'Scramble for Africa' and colonial conquest.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Survive the Indian Wars and forced relocation to reservations.",
                NORTH_AMERICAN_COLONIAL: "Navigate industrial colonial expansion and westward migration in North America.",
                SOUTH_AMERICAN: "Navigate the chaos of independence wars and unstable new republics.",
                OCEANIA: "Endure European colonization and the destruction of traditional ways of life."
            },
            [HistoricalEra.MODERN_ERA]: {
                EUROPEAN: "Survive the 20th century's world wars, economic collapse, and social upheaval.",
                EAST_ASIAN: "Navigate modern Asia's wars, revolutions, and rapid industrialization.",
                MENA: "Endure the collapse of empires, world wars, and the struggle for independence.",
                SOUTH_ASIAN: "Survive partition, independence movements, and the end of colonial rule.",
                SUB_SAHARAN_AFRICAN: "Face the challenges of decolonization and building new nations.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Navigate the modern struggle for indigenous rights and cultural survival.",
                NORTH_AMERICAN_COLONIAL: "Survive in the modern North American society built on colonial foundations.",
                SOUTH_AMERICAN: "Survive political instability, military coups, and economic crises.",
                OCEANIA: "Face the challenges of independence and preserving indigenous cultures."
            }
        },
        exploration: {
            [HistoricalEra.ANTIQUITY]: {
                EUROPEAN: "Explore the ancient world beyond Rome's borders, where Celtic druids and Germanic tribes guard ancient secrets.",
                EAST_ASIAN: "Journey through ancient China's vast territories, from the Silk Road to unexplored southern lands.",
                MENA: "Chart new trade routes across the ancient Persian Empire and beyond to India.",
                SOUTH_ASIAN: "Discover new kingdoms and trading ports along India's vast coastlines.",
                SUB_SAHARAN_AFRICAN: "Map the great rivers and kingdoms of ancient Africa, following gold and salt trades.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Pioneer new territories as small bands explore the vast American continent.",
                SOUTH_AMERICAN: "Venture into uncharted Amazonian territories and Andean highlands.",
                OCEANIA: "Master oceanic navigation as Polynesian explorers find new island homes."
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                EUROPEAN: "Join the Age of Exploration, mapping new trade routes and discovering distant continents.",
                EAST_ASIAN: "Explore the vast Chinese Empire's frontiers and new maritime trade opportunities.",
                MENA: "Navigate Ottoman territorial expansions and discover new trade connections.",
                SOUTH_ASIAN: "Chart Mughal India's internal territories and coastal trading networks.",
                SUB_SAHARAN_AFRICAN: "Explore Africa's great kingdoms before European colonization changes everything.",
                NORTH_AMERICAN_PRE_COLUMBIAN: "Pioneer confederate territories as indigenous nations expand their influence.",
                SOUTH_AMERICAN: "Map the vast Inca road network and explore Amazonian territories.",
                OCEANIA: "Perfect traditional navigation techniques in the Pacific's golden age of exploration."
            }
        },
        commerce: {
            [HistoricalEra.MEDIEVAL]: {
                EUROPEAN: "Build trading networks across medieval Europe, from Venetian spice routes to Hanseatic League connections.",
                EAST_ASIAN: "Profit from the Silk Road's golden age, trading between Chinese cities and Central Asian kingdoms.",
                MENA: "Establish profitable ventures in the Islamic world's great commercial centers.",
                SOUTH_ASIAN: "Trade in medieval India's wealthy port cities and overland caravan routes.",
                SUB_SAHARAN_AFRICAN: "Prosper in the trans-Saharan gold and salt trade that enriches African kingdoms."
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                EUROPEAN: "Capitalize on Renaissance Europe's expanding global trade networks and banking innovations.",
                EAST_ASIAN: "Navigate China's complex commercial regulations while building trading empires.",
                MENA: "Adapt Ottoman trade networks to compete with emerging European maritime commerce.",
                SOUTH_ASIAN: "Establish profitable enterprises as European trading companies enter Indian markets.",
                SUB_SAHARAN_AFRICAN: "Develop new trade relationships as European demand transforms African commerce."
            }
        },
        scholarship: {
            [HistoricalEra.MEDIEVAL]: {
                EUROPEAN: "Pursue knowledge in medieval Europe's monastery schools and emerging universities.",
                EAST_ASIAN: "Study in China's imperial academies during a golden age of learning and innovation.",
                MENA: "Research in the Islamic world's great libraries and centers of learning in Baghdad and Cairo.",
                SOUTH_ASIAN: "Investigate India's mathematical and astronomical traditions in temple schools.",
                SUB_SAHARAN_AFRICAN: "Study in centers of Islamic learning like Timbuktu's renowned universities."
            }
        },
        leadership: {
            [HistoricalEra.MEDIEVAL]: {
                EUROPEAN: "Lead communities through feudal Europe's challenges of war, plague, and social upheaval.",
                EAST_ASIAN: "Govern territories in medieval China's complex administrative system.",
                MENA: "Guide communities through the Islamic world's political and religious complexities.",
                SOUTH_ASIAN: "Rule wisely in medieval India's diverse and politically fragmented landscape."
            }
        },
        livelihood: {
            [HistoricalEra.MEDIEVAL]: {
                EUROPEAN: "Make an honest living as a craftsperson, farmer, or tradesman in medieval Europe's growing towns.",
                EAST_ASIAN: "Work the land or practice a trade in medieval China's prosperous rural communities.",
                MENA: "Earn your bread in the Islamic world's bustling markets and agricultural villages.",
                SOUTH_ASIAN: "Support your family through traditional crafts and farming in medieval India."
            }
        }
    };
    
    // Get mode-specific description or fallback to general description
    const modeDesc = modeDescriptions[mode.id]?.[era]?.[culturalZone];
    if (modeDesc) return modeDesc;
    
    // Fallback to mode context description only (historical context shown separately)
    const modeContext = getModeContextDescription(mode, playerCharacter);
    
    return modeContext;
}

function getModeContextDescription(mode: GameMode, character: PlayerCharacter): string {
    const contextMap: Record<string, string> = {
        survival: `As a ${character.profession}, you must overcome existential threats through resourcefulness and determination.`,
        exploration: `Your role as a ${character.profession} leads you to discover new territories and opportunities.`,
        commerce: `Working as a ${character.profession}, you seek to build wealth through trade and business ventures.`,
        scholarship: `Your position as a ${character.profession} drives you to pursue knowledge and intellectual achievement.`,
        leadership: `As a ${character.profession}, you must guide others through challenges and crises.`,
        livelihood: `Your life as a ${character.profession} focuses on honest work and supporting your community.`,
        diplomacy: `Your role as a ${character.profession} involves navigating complex political relationships.`,
        legal: `Working as a ${character.profession}, you must uphold justice and navigate legal complexities.`
    };
    
    return contextMap[mode.id] || `Your role as a ${character.profession} shapes your approach to the challenges ahead.`;
}

function formatEra(era: HistoricalEra): string {
    const eraNames: Record<HistoricalEra, string> = {
        [HistoricalEra.PREHISTORY]: "Prehistoric Times",
        [HistoricalEra.ANTIQUITY]: "Ancient World",
        [HistoricalEra.MEDIEVAL]: "Medieval Period",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "Early Modern",
        [HistoricalEra.INDUSTRIAL_ERA]: "Industrial Age",
        [HistoricalEra.MODERN_ERA]: "Modern Era"
    };
    return eraNames[era] || era;
}

function formatYear(year: number): string {
    if (year < 0) {
        return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
}

function extractPersonalityTrait(character: PlayerCharacter): string {
    // Prioritize religion if it exists
    if (character.religion && character.religion !== '') {
        return `Follows ${character.religion}.`;
    }

    // Extract from backstory if available
    const backstory = character.backstory;
    if (!backstory) return "A person of many talents and hidden depths.";

    // Extract sentences that describe personality traits
    const sentences = backstory.split('.').map(s => s.trim()).filter(s => s.length > 0);

    // Look for sentences with personality indicators
    const personalityIndicators = ['personality', 'character', 'temperament', 'nature', 'known for', 'reputation', 'believes', 'faith'];
    const traitSentence = sentences.find(sentence =>
        personalityIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    );

    if (traitSentence) {
        return traitSentence.trim() + '.';
    }

    // Fallback: return the second sentence if it exists (often contains character traits)
    if (sentences.length > 1) {
        return sentences[1].trim() + '.';
    }

    // Final fallback
    return "A person of many talents and hidden depths.";
}

// Game mode color configuration
const GAME_MODE_COLORS = {
    survival: { bg: 'from-red-600 to-red-700', hover: 'from-red-700 to-red-800', icon: 'text-red-400', headerBg: 'from-red-500 to-red-600' },
    exploration: { bg: 'from-blue-600 to-blue-700', hover: 'from-blue-700 to-blue-800', icon: 'text-blue-400', headerBg: 'from-blue-500 to-blue-600' },
    commerce: { bg: 'from-yellow-600 to-yellow-700', hover: 'from-yellow-700 to-yellow-800', icon: 'text-yellow-400', headerBg: 'from-yellow-500 to-yellow-600' },
    scholarship: { bg: 'from-purple-600 to-purple-700', hover: 'from-purple-700 to-purple-800', icon: 'text-purple-400', headerBg: 'from-purple-500 to-purple-600' },
    leadership: { bg: 'from-amber-600 to-amber-700', hover: 'from-amber-700 to-amber-800', icon: 'text-amber-400', headerBg: 'from-amber-500 to-amber-600' },
    livelihood: { bg: 'from-green-600 to-green-700', hover: 'from-green-700 to-green-800', icon: 'text-green-400', headerBg: 'from-green-500 to-green-600' },
    diplomacy: { bg: 'from-cyan-600 to-cyan-700', hover: 'from-cyan-700 to-cyan-800', icon: 'text-cyan-400', headerBg: 'from-cyan-500 to-cyan-600' },
    legal: { bg: 'from-indigo-600 to-indigo-700', hover: 'from-indigo-700 to-indigo-800', icon: 'text-indigo-400', headerBg: 'from-indigo-500 to-indigo-600' }
};

// Season color configuration
function getSeasonColors(season: string): string {
    switch (season.toLowerCase()) {
        case 'winter': return 'text-blue-800 dark:text-blue-300';
        case 'spring': return 'text-green-600 dark:text-green-400';
        case 'summer': return 'bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent';
        case 'autumn': case 'fall': return 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent';
        default: return 'text-slate-600 dark:text-slate-300';
    }
}

function getPrizedPossession(playerCharacter: PlayerCharacter): string {
    const equippedItems = playerCharacter.equippedItems || {};
    const equippedValues = Object.values(equippedItems).filter(Boolean);

    if (equippedValues.length === 0) return "A small personal memento";

    // Prioritize high-value or unique equipped items
    const valuableEquipped = equippedValues.filter(item =>
        item && (
            (item.value && item.value > 20) ||
            item.quality === 'excellent' ||
            item.category === 'jewelry' ||
            item.category === 'weapon'
        )
    );

    if (valuableEquipped.length > 0) {
        // Use character name and first letter as stable seed
        const seed = playerCharacter.name.length + playerCharacter.name.charCodeAt(0);
        const item = valuableEquipped[seed % valuableEquipped.length];
        return item.name;
    }

    // Fallback to any equipped item, using stable seed
    const seed = playerCharacter.name.length + playerCharacter.name.charCodeAt(0);
    const item = equippedValues[seed % equippedValues.length];
    return item ? item.name : "A small personal memento";
}

function formatCulturalZone(zone: CulturalZone): string {
    const zoneNames: Record<CulturalZone, string> = {
        EUROPEAN: "Europea",
        EAST_ASIAN: "East Asia", 
        MENA: "Middle East & North Africa",
        SOUTH_ASIAN: "Indian Ocean World",
        SUB_SAHARAN_AFRICAN: "Sub-Saharan Africa",
        NORTH_AMERICAN_PRE_COLUMBIAN: "Pre-Columbian North America",
        NORTH_AMERICAN_COLONIAL: "Colonial North America", 
        SOUTH_AMERICAN: "South America",
        OCEANIA: "Pacific & Oceania"
    };
    return zoneNames[zone] || zone;
}

const InitialScenarioModal: React.FC<InitialScenarioModalProps> = ({
    isOpen,
    onClose,
    playerCharacter,
    gameDate,
    currentZone,
    currentRegion,
    localArea,
    gameMode,
    urlConfig,
    worldWeaverData,
    isProcessingWorldWeaver
}) => {
    // Animation states for stylish fade-in
    const [isVisible, setIsVisible] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);
    const [shouldRenderPortrait, setShouldRenderPortrait] = useState(false);
    const [factionDataCache, setFactionDataCache] = useState<any>(null);
    const [isFactionDataLoading, setIsFactionDataLoading] = useState(false);

    // Detect Safari for performance optimizations
    const isSafari = useMemo(() => {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Start the fade-in animation sequence
            setTimeout(() => setIsVisible(true), 10);
            setTimeout(() => setContentVisible(true), 100);

            // Defer portrait rendering until after modal animation completes
            // This prevents blocking the main thread during modal open
            const portraitDelay = isSafari ? 400 : 300;
            const portraitTimer = setTimeout(() => setShouldRenderPortrait(true), portraitDelay);

            return () => {
                clearTimeout(portraitTimer);
            };
        } else {
            setIsVisible(false);
            setContentVisible(false);
            setShouldRenderPortrait(false);
            // Reset faction data cache when modal closes
            setFactionDataCache(null);
            setIsFactionDataLoading(false);
        }
    }, [isOpen, isSafari]);
    
    if (!isOpen) return null;

    // Memoize expensive computations
    const dateInfo = useMemo(() => parseDateString(String(gameDate.year)), [gameDate.year]);
    const culturalZone = useMemo(() => mapLocationToCulture(currentZone, dateInfo.year) as CulturalZone, [currentZone, dateInfo.year]);
    const era = useMemo(() => dateInfo.era as HistoricalEra, [dateInfo.era]);

    // Lazy load faction data for better performance (especially on Safari)
    useEffect(() => {
        if (!currentZone || !currentRegion || !gameDate || factionDataCache) return;

        setIsFactionDataLoading(true);

        // Dynamically import FACTION_DATA only when needed
        import('../constants/gameData/factions').then((module) => {
            try {
                const dateInfo = parseDateString(gameDate.year.toString());
                const culturalZoneEnum = mapLocationToCulture(currentZone, dateInfo.year);
                const result = module.FACTION_DATA[culturalZoneEnum as CulturalZone]?.[currentRegion]?.[dateInfo.era as HistoricalEra];

                console.log('InitialScenarioModal faction debug:', {
                    currentZone,
                    currentRegion,
                    culturalZoneEnum,
                    era: dateInfo.era,
                    factionData: result,
                    dominantPower: result?.dominantPower
                });

                setFactionDataCache(result);
                setIsFactionDataLoading(false);
            } catch (error) {
                console.error('Error getting faction data in InitialScenarioModal:', error);
                setFactionDataCache(null);
                setIsFactionDataLoading(false);
            }
        });
    }, [currentZone, currentRegion, gameDate, factionDataCache]);

    // Use cached faction data
    const factionData = factionDataCache;

    // Get dominant faction icon
    const { dominantFactionIcon: DominantFactionIcon } = useMemo(() => {
        const dominantPower = factionData?.dominantPower;
        const factionIconData = dominantPower ? FACTION_ICONS[dominantPower] : null;
        console.log('Faction icon debug:', {
            dominantPower,
            factionIconData,
            hasIcon: !!factionIconData?.icon
        });
        return {
            dominantFactionIcon: factionIconData?.icon || Scroll
        };
    }, [factionData]);

    // Get the current seed from SeedManager (memoized)
    const gameSeed = useMemo(() => {
        const seedManager = SeedManager.getInstance();
        return seedManager.getSeed();
    }, []);
    const [showShareLink, setShowShareLink] = React.useState(false);
    const [shareableURL, setShareableURL] = React.useState('');
    const [copiedToClipboard, setCopiedToClipboard] = React.useState(false);
    const [dialectContinuumEnabled, setDialectContinuumEnabled] = React.useState(true);
    const [showModeDetails, setShowModeDetails] = React.useState(false);
    const [showCharacterDetails, setShowCharacterDetails] = React.useState(false);
    const [portraitExpression, setPortraitExpression] = React.useState<'neutral' | 'smile' | 'frown' | 'surprise' | 'angry'>('neutral');
    
    // Generate shareable URL when requested
    React.useEffect(() => {
        if (showShareLink) {
            // Detect zone from map area if currentZone is empty or invalid
            let finalZone = currentZone;
            let finalRegion = currentRegion;
            
            if (!currentZone || currentZone === '' || currentZone === '...') {
                const detected = findZoneForMapArea(localArea);
                if (detected) {
                    finalZone = detected.zone;
                    finalRegion = detected.region;
                } else {
                    console.error('[ShareableState] Could not detect zone for map area:', localArea);
                    finalZone = 'Europe'; // Fallback
                    finalRegion = '';
                }
            }
            
            // Create comprehensive shareable state with validated zone
            const shareableState = {
                year: gameDate.year,
                month: gameDate.month || 1,
                day: gameDate.day || 1,
                mapArea: localArea,
                zone: finalZone,
                region: finalRegion,
                gameMode: gameMode?.id || 'survival',
                character: {
                    name: playerCharacter.name,
                    profession: playerCharacter.occupation || playerCharacter.profession || 'traveler',
                    gender: playerCharacter.gender?.toLowerCase() as 'male' | 'female' || 'male',
                    age: playerCharacter.age || 25,
                    socialClass: playerCharacter.class || 'commoner',
                    health: playerCharacter.diseaseHealth?.overallHealthStatus || 'healthy'
                },
                mapSeed: gameSeed,
                scenarioType: 'procedural' as const,
                version: '2.0', // Bump version to indicate improved format
                _validated: true // Flag to indicate this state has been validated
            };
            
            // Generate the shareable URL with full state
            const url = shareableStateService.generateShareableURL(shareableState);
            setShareableURL(url);
            
            // Also save to localStorage for recovery
            shareableStateService.saveStateToLocal(shareableState);
        }
    }, [showShareLink, gameDate, localArea, currentZone, currentRegion, gameMode, playerCharacter, gameSeed]);
    
    // Load historical context using regional history service
    const [historicalContext, setHistoricalContext] = useState<string>(
        "Loading historical context..."
    );

    useEffect(() => {
        const loadHistoricalContext = async () => {
            try {
                const description = await regionalHistoryService.getHistoricalContext(
                    culturalZone,
                    currentRegion,
                    gameDate.year,
                    era
                );
                setHistoricalContext(description);
            } catch (error) {
                console.error('Error loading historical context:', error);
                // Fallback to era-level description
                const fallback = HISTORY_GUIDE_DATA[culturalZone]?.[era] ||
                    "This is a time of great change and opportunity. The world is full of challenges and adventures waiting to be discovered.";
                setHistoricalContext(fallback);
            }
        };

        loadHistoricalContext();
    }, [culturalZone, currentRegion, gameDate.year, era]);

    const modeDescription = useMemo(() =>
        getModeDescription(gameMode, era, culturalZone, playerCharacter),
        [gameMode, era, culturalZone, playerCharacter]
    );

    return (
        <div className={`fixed inset-0 bg-slate-400/60 dark:bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 pb-8 md:pb-4 transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
            <div className={`bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-700 dark:to-slate-900
                border border-slate-300/50 dark:border-slate-700/50 rounded-2xl shadow-2xl max-w-5xl w-full
                max-h-[90vh] md:max-h-[85vh] overflow-y-auto
                ${isSafari ? 'transition-opacity duration-700' : 'transition-all duration-700 transform'} ${
                    contentVisible
                        ? `opacity-100 ${!isSafari ? 'scale-100 translate-y-0' : ''}`
                        : `opacity-0 ${!isSafari ? 'scale-95 translate-y-4' : ''}`
                }`}>
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-5 border-b border-slate-300/50 dark:border-slate-700/50">
                    <div className="flex items-start sm:items-center gap-2 md:gap-4 w-full sm:w-auto">
                        <div className={`p-2 md:p-3 bg-gradient-to-br rounded-lg shrink-0 ${
                        gameMode ? GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.headerBg || 'from-amber-500 to-amber-600' : 'from-amber-500 to-amber-600'
                    }`}>
                            {isFactionDataLoading ? (
                                <Globe className="w-5 h-5 md:w-7 md:h-7 text-white animate-pulse" />
                            ) : (
                                <DominantFactionIcon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-0.5 md:mb-1 break-words">
                                You are {playerCharacter.name}, a {playerCharacter.occupation || playerCharacter.profession || 'traveler'}, and the year is {formatYear(gameDate.year)}
                            </h2>
                            <p className="text-xs sm:text-sm md:text-lg text-slate-600 dark:text-slate-300 break-words">
                                <span className="block sm:inline">{formatEra(era)} • {formatCulturalZone(culturalZone)}</span>
                                <span className="block sm:inline sm:ml-1 text-emerald-700 dark:text-emerald-400 font-medium">• {currentRegion}</span>
                                <span className={`block sm:inline sm:ml-1 font-medium ${getSeasonColors(getSeasonFromDate(gameDate))}`}>• {formatDateWithSeason(gameDate, getSeasonFromDate(gameDate))}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={getSafariOptimizedClassName("absolute top-3 right-3 p-1.5 md:p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors")}
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                <div className="p-2 md:p-3 pb-4 md:pb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 mb-4">
                        {/* Left Column - Main Content (3/5) */}
                        <div className="lg:col-span-3 space-y-2 md:space-y-3">
                            {/* Historical Context */}
                            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 border border-slate-700/30">
                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                    <Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-400 shrink-0" />
                                    <h3 className="text-base md:text-xl font-semibold text-blue-600 dark:text-blue-400 break-words">
                                        It is <span className={getSeasonColors(getSeasonFromDate(gameDate))}>{getSeasonFromDate(gameDate)}</span> in the {localArea}
                                    </h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                    {isProcessingWorldWeaver ? (
                                        <span className="flex items-center gap-2 text-green-400">
                                            <span className="inline-block w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
                                            WorldWeaver is creating your custom scenario...
                                        </span>
                                    ) : (
                                        worldWeaverData?.settingDescription || historicalContext
                                    )}
                                </p>
                            </div>

                            {/* Character Info */}
                            <div className="bg-slate-800/50 rounded-lg p-2 md:p-4 border border-slate-700/30">
                                <div className="flex items-center justify-between mb-2 md:mb-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                                        <h3 className="text-sm md:text-lg font-semibold text-green-600 dark:text-green-400">Your Character</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowCharacterDetails(!showCharacterDetails)}
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                                    >
                                        More Info
                                        {showCharacterDetails ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>

                                {/* Portrait and Info Layout */}
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                    {/* Portrait Column */}
                                    <div className="flex-shrink-0 flex flex-col items-center sm:items-start w-24 md:w-32">
                                        <div className="relative">
                                            <div
                                                className="w-24 h-24 md:w-32 md:h-32 rounded-lg border-2 border-amber-400/50 shadow-lg overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-600/20 cursor-pointer hover:border-amber-400 transition-colors"
                                                onClick={() => {
                                                    if (shouldRenderPortrait) {
                                                        const expressions: Array<'neutral' | 'smile' | 'frown' | 'surprise' | 'angry'> = ['neutral', 'smile', 'frown', 'surprise', 'angry'];
                                                        const currentIndex = expressions.indexOf(portraitExpression);
                                                        const filteredExpressions = expressions.filter((_, i) => i !== currentIndex);
                                                        const newExpression = filteredExpressions[Math.floor(Math.random() * filteredExpressions.length)];
                                                        setPortraitExpression(newExpression);
                                                    }
                                                }}
                                                title={shouldRenderPortrait ? "Click to change expression" : "Loading portrait..."}
                                            >
                                                {shouldRenderPortrait ? (
                                                    <ProceduralPortrait
                                                        character={playerCharacter}
                                                        size={128}
                                                        expression={portraitExpression}
                                                        className="w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-700/50">
                                                        <div className="animate-pulse">
                                                            <User className="w-12 h-12 text-slate-500" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-amber-400/30 to-amber-600/30 blur-sm -z-10" />
                                        </div>

                                        {/* Health Status below portrait */}
                                        {playerCharacter.diseaseHealth?.currentDiseases?.length > 0 && (
                                            <div className="mt-2 p-2 bg-red-900/20 border border-red-600/30 rounded w-full text-center">
                                                <span className="text-red-400 text-xs font-medium block mb-1">HEALTH</span>
                                                {playerCharacter.diseaseHealth.currentDiseases.map((disease, idx) => {
                                                    const isCritical = disease.disease.mortalityRate > 0.3 || disease.severity > 0.7;
                                                    return (
                                                        <span key={idx} className={`block text-xs ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>
                                                            {disease.disease.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Attribute Sentence (only if attributes exist) */}
                                        {(() => {
                                            const attributeSentence = generateAttributeSentence(playerCharacter);
                                            return attributeSentence ? (
                                                <div className="mt-2 p-2 bg-slate-800/30 rounded text-center w-full">
                                                    <p className="text-slate-300 text-xs italic break-words leading-relaxed">
                                                        {attributeSentence}
                                                    </p>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* Character Info Column */}
                                    <div className="flex-grow space-y-2">
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">Name</span>
                                                <span className="text-white font-medium break-words">
                                                    {playerCharacter.name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">Occupation</span>
                                                <span className="text-white font-medium break-words">
                                                    {playerCharacter.occupation || playerCharacter.profession || 'Unknown'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1">Social Class</span>
                                                <span className="text-white font-medium break-words">
                                                    {playerCharacter.class ?
                                                        playerCharacter.class
                                                            .replace(/_/g, ' ')
                                                            .split(' ')
                                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                            .join(' ')
                                                        : 'Common'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Region
                                                </span>
                                                <span className="text-emerald-400 font-medium break-words">{currentRegion}</span>
                                            </div>
                                        </div>

                                        {/* Character Description - WorldWeaver or Standard */}
                                        {isProcessingWorldWeaver ? (
                                            <div className="mt-3 p-2 bg-slate-700/30 rounded border border-slate-600/30">
                                                <p className="text-green-400 text-xs md:text-sm flex items-center gap-2">
                                                    <span className="inline-block w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
                                                    Creating character background...
                                                </p>
                                            </div>
                                        ) : worldWeaverData?.characterDescription ? (
                                            <div className="mt-3 p-2 bg-slate-700/30 rounded border border-slate-600/30">
                                                <p className="text-slate-300 text-xs md:text-sm italic">
                                                    {worldWeaverData.characterDescription}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Brief Character Description */}
                                                <div className="mt-3 p-2 bg-slate-700/30 rounded border border-slate-600/30">
                                                    <p className="text-slate-300 text-xs md:text-sm italic">
                                                        {extractPersonalityTrait(playerCharacter)}
                                                    </p>
                                                </div>

                                                {/* Prized Possession */}
                                                <div className="mt-1 p-2 bg-slate-700/30 rounded border border-slate-600/30">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Trophy className="w-3 h-3 text-amber-400" />
                                                        <span className="text-amber-400 text-xs font-medium">PRIZED POSSESSION:</span>
                                                    </div>
                                                    <p className="text-slate-300 text-xs md:text-sm">
                                                        {getPrizedPossession(playerCharacter)}
                                                    </p>
                                                </div>
                                            </>
                                        )}


                                        {/* Expandable Character Details */}
                                        {showCharacterDetails && (
                                            <div className="mt-2 p-2 bg-slate-700/30 rounded border border-slate-600/30 space-y-2">
                                                <div>
                                                    <span className="text-blue-400 text-xs font-medium block mb-1">FULL BACKGROUND:</span>
                                                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                                                        {playerCharacter.backstory || 'No detailed background available.'}
                                                    </p>
                                                </div>
                                                {playerCharacter.religion && (
                                                    <div>
                                                        <span className="text-blue-400 text-xs font-medium block mb-1">RELIGION:</span>
                                                        <p className="text-slate-300 text-xs">
                                                            {playerCharacter.religion}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                    {/* Game Mode & Mission */}
                    <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 border border-slate-700/30">
                        <div className="space-y-1 md:space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Crown className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${
                                        gameMode ? GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.icon || 'text-amber-400' : 'text-amber-400'
                                    }`} />
                                    <span className={`font-semibold text-sm md:text-base ${
                                        gameMode ? GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.icon || 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'
                                    }`}>
                                        {gameMode ? gameMode.name : 'Game Mode: Selecting...'}
                                    </span>
                                </div>
                                {gameMode && (
                                    <button
                                        onClick={() => setShowModeDetails(!showModeDetails)}
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                                    >
                                        More Info
                                        {showModeDetails ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-300 leading-relaxed text-xs md:text-sm">
                                {gameMode ? modeDescription : 'Your game mode is being determined based on your character\'s background and skills. This will shape your adventure and goals.'}
                            </p>

                            {/* Collapsible Mode Details */}
                            {gameMode && showModeDetails && (
                                <div className="mt-2 p-2 bg-slate-700/30 rounded border border-slate-600/30 space-y-1">
                                    {gameMode.victoryConditions.length > 0 && (
                                        <div>
                                            <span className="text-xs font-medium text-green-400 block mb-1">Victory Conditions:</span>
                                            <ul className="text-xs text-slate-300 space-y-1">
                                                {gameMode.victoryConditions.map((condition, idx) => (
                                                    <li key={idx} className="flex items-start gap-1">
                                                        <span className="text-green-400 mt-0.5">•</span>
                                                        <span>{condition.description}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {gameMode.challenges && gameMode.challenges.length > 0 && (
                                        <div>
                                            <span className="text-xs font-medium text-orange-400 block mb-1">Key Challenges:</span>
                                            <ul className="text-xs text-slate-300 space-y-1">
                                                {gameMode.challenges.slice(0, 3).map((challenge, idx) => (
                                                    <li key={idx} className="flex items-start gap-1">
                                                        <span className="text-orange-400 mt-0.5">•</span>
                                                        <span>{challenge}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/30">
                        <h4 className="text-xs font-medium text-slate-400 mb-2">Settings</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dialectContinuumEnabled}
                                onChange={(e) => setDialectContinuumEnabled(e.target.checked)}
                                className="w-3 h-3 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-1"
                            />
                            <div className="flex-1">
                                <span className="text-xs font-medium text-blue-400">Enable Dialect Continuum</span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Gradually introduces foreign languages as you travel.
                                </p>
                            </div>
                        </label>
                    </div>

                        </div>

                        {/* Right Column - Charts (2/5) */}
                        <div className="lg:col-span-2 space-y-2 md:space-y-3">
                            {/* Population Chart - Static SVG version for better performance */}
                            <SimplePopulationChart
                                currentYear={gameDate.year}
                                culturalZone={culturalZone.toString()}
                            />

                            {/* Mini Location Map */}
                            <Suspense fallback={<ChartSkeleton height="300px" />}>
                                <MiniLocationMap
                                    continent={currentZone === 'North America' || currentZone === 'Central America' ? 'northAmerica' :
                                             currentZone === 'South America' ? 'southAmerica' :
                                             currentZone === 'Europe' ? 'europe' :
                                             currentZone === 'Asia' ? 'asia' :
                                             currentZone === 'Africa' ? 'africa' :
                                             currentZone === 'Oceania' ? 'oceania' : 'northAmerica'}
                                    region={currentRegion}
                                    mapSeed={gameSeed}
                                />
                            </Suspense>

                            {/* Start Button positioned under right column content */}
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        // Initialize dialect continuum if enabled
                                        if (dialectContinuumEnabled) {
                                            dialectContinuumService.setEnabled(true);
                                            dialectContinuumService.initialize(localArea, { x: 0, y: 0 });
                                            dialectContinuumService.saveState();
                                        } else {
                                            dialectContinuumService.setEnabled(false);
                                        }
                                        onClose();
                                    }}
                                    className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl text-sm md:text-base ${
                                        gameMode ? (
                                            gameMode.id === 'survival' ? 'bg-red-600 hover:bg-red-700' :
                                            gameMode.id === 'exploration' ? 'bg-blue-600 hover:bg-blue-700' :
                                            gameMode.id === 'commerce' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                            gameMode.id === 'scholarship' ? 'bg-purple-600 hover:bg-purple-700' :
                                            gameMode.id === 'leadership' ? 'bg-amber-600 hover:bg-amber-700' :
                                            gameMode.id === 'livelihood' ? 'bg-green-600 hover:bg-green-700' :
                                            gameMode.id === 'diplomacy' ? 'bg-cyan-600 hover:bg-cyan-700' :
                                            gameMode.id === 'legal' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                            'bg-amber-600 hover:bg-amber-700'
                                        ) : 'bg-amber-600 hover:bg-amber-700'
                                    }`}
                                >
                                    Begin the Simulation
                                </button>

                                {/* Share Button */}
                                <button
                                    onClick={() => {
                                        setShowShareLink(!showShareLink);
                                        setCopiedToClipboard(false);
                                    }}
                                    className={`w-full mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600
                                               text-slate-200 font-medium rounded-lg transition-colors
                                               flex items-center justify-center gap-2 text-sm md:text-base`}
                                >
                                    <Link className="w-4 h-4" />
                                    {showShareLink ? 'Hide Share Link' : 'Share This Scenario'}
                                </button>

                                {/* Share URL Display */}
                                {showShareLink && shareableURL && (
                                    <div className="mt-3 p-3 bg-slate-800/80 rounded-lg border border-slate-600/50 animate-fade-in">
                                        <label className="text-xs font-medium text-slate-400 block mb-2">
                                            Share this URL to recreate this exact scenario:
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={shareableURL}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-slate-900 text-slate-200 text-xs md:text-sm
                                                          rounded border border-slate-600 font-mono focus:outline-none
                                                          focus:ring-2 focus:ring-blue-500"
                                                onClick={(e) => e.currentTarget.select()}
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(shareableURL);
                                                    setCopiedToClipboard(true);
                                                    // Reset after 2 seconds
                                                    setTimeout(() => setCopiedToClipboard(false), 2000);
                                                }}
                                                className={`px-4 py-2 rounded transition-all flex items-center gap-2 text-sm
                                                    ${copiedToClipboard
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                            >
                                                {copiedToClipboard ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">
                                            This link preserves: character, location, date, game mode, and map seed
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default React.memo(InitialScenarioModal);