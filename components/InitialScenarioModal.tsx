import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { X, User, Calendar, Globe, Trophy, MapPin, Crown, Scroll, Link, ChevronDown, ChevronUp, Copy, Check, Share2, RefreshCw, QrCode } from 'lucide-react';
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
import { getSafariOptimizedClassName, getOptimizedButtonClassName } from '../utils/safariUtils';
import { dialectContinuumService } from '../services/dialectContinuumService';
import { FACTION_DATA } from '../constants/gameData/factions';
import { FACTION_ICONS } from '../constants/gameData/factionIcons';
import SimplePopulationChart from './charts/SimplePopulationChart';
import { PROFESSIONS } from '../constants/characterData/professions';

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

// Game mode color configuration - Theme-aware, professional palette
const GAME_MODE_COLORS = {
    survival: {
        bg: 'surface-elevated border border-[color:var(--color-error)]/20',
        hover: 'hover:border-[color:var(--color-error)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--color-error)]'
    },
    exploration: {
        bg: 'surface-elevated border border-[color:var(--accent-primary)]/20',
        hover: 'hover:border-[color:var(--accent-primary)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--accent-primary)]'
    },
    commerce: {
        bg: 'surface-elevated border border-[color:var(--color-warning)]/20',
        hover: 'hover:border-[color:var(--color-warning)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--color-warning)]'
    },
    scholarship: {
        bg: 'surface-elevated border border-[color:var(--accent-secondary)]/20',
        hover: 'hover:border-[color:var(--accent-secondary)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--accent-secondary)]'
    },
    leadership: {
        bg: 'surface-elevated border border-[color:var(--color-warning)]/20',
        hover: 'hover:border-[color:var(--color-warning)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--color-warning)]'
    },
    livelihood: {
        bg: 'surface-elevated border border-[color:var(--color-success)]/20',
        hover: 'hover:border-[color:var(--color-success)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--color-success)]'
    },
    diplomacy: {
        bg: 'surface-elevated border border-[color:var(--accent-primary)]/20',
        hover: 'hover:border-[color:var(--accent-primary)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--accent-primary)]'
    },
    legal: {
        bg: 'surface-elevated border border-[color:var(--accent-secondary)]/20',
        hover: 'hover:border-[color:var(--accent-secondary)]/40 hover:shadow-lg',
        icon: 'text-[color:var(--accent-secondary)]'
    }
};

// Season color configuration
function getSeasonColors(season: string): string {
    switch (season.toLowerCase()) {
        case 'winter': return 'text-blue-800 dark:text-blue-300';
        case 'spring': return 'text-green-600 dark:text-green-400';
        case 'summer': return 'bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent';
        case 'autumn': case 'fall': return 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent';
        default: return 'text-text-secondary';
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

function getProfessionKeyword(professionName: string, culturalZone: CulturalZone, era: HistoricalEra): string | null {
    try {
        const cultureData = PROFESSIONS[culturalZone];
        if (!cultureData) return null;

        const eraData = cultureData[era];
        if (!eraData) return null;

        // Search through all social classes
        for (const socialClass of Object.values(eraData)) {
            if (socialClass[professionName]) {
                return socialClass[professionName].keywords || null;
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting profession keyword:', error);
        return null;
    }
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
        }
    }, [isOpen, isSafari]);
    
    if (!isOpen) return null;

    const modalAnimationClass = contentVisible
        ? `opacity-100 ${!isSafari ? 'scale-100 translate-y-0' : ''}`
        : `opacity-0 ${!isSafari ? 'scale-95 translate-y-4' : ''}`;

    // Combine related computations into single memoized object
    const scenarioData = useMemo(() => {
        const dateInfo = parseDateString(String(gameDate.year));
        const culturalZone = mapLocationToCulture(currentZone, dateInfo.year) as CulturalZone;
        const era = dateInfo.era as HistoricalEra;
        const gameSeed = SeedManager.getInstance().getSeed();

        return {
            dateInfo,
            culturalZone,
            era,
            gameSeed
        };
    }, [gameDate.year, currentZone]);

    // Get faction data directly (already imported at top of file)
    const factionData = useMemo(() => {
        try {
            const result = FACTION_DATA[scenarioData.culturalZone]?.[currentRegion]?.[scenarioData.era];

            console.log('InitialScenarioModal faction debug:', {
                currentZone,
                currentRegion,
                culturalZone: scenarioData.culturalZone,
                era: scenarioData.era,
                factionData: result,
                dominantPower: result?.dominantPower
            });

            return result;
        } catch (error) {
            console.error('Error getting faction data in InitialScenarioModal:', error);
            return null;
        }
    }, [scenarioData.culturalZone, scenarioData.era, currentRegion, currentZone]);

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

    const [showShareLink, setShowShareLink] = React.useState(false);
    const [shareableURL, setShareableURL] = React.useState('');
    const [copiedToClipboard, setCopiedToClipboard] = React.useState(false);
    const [dialectContinuumEnabled, setDialectContinuumEnabled] = React.useState(true);
    const [showModeDetails, setShowModeDetails] = React.useState(false);
    const [showCharacterDetails, setShowCharacterDetails] = React.useState(false);
    const [portraitExpression, setPortraitExpression] = React.useState<'neutral' | 'smile' | 'surprise' | 'scowl' | 'annoyed'>('neutral');
    const [showBottomSheet, setShowBottomSheet] = React.useState(false);
    const [expandedContext, setExpandedContext] = React.useState(false);
    const [showProfessionTooltip, setShowProfessionTooltip] = React.useState(false);
    
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
                mapSeed: scenarioData.gameSeed,
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
    }, [showShareLink, gameDate, localArea, currentZone, currentRegion, gameMode, playerCharacter, scenarioData.gameSeed]);
    
    // Load historical context using regional history service
    const [historicalContext, setHistoricalContext] = useState<string>(
        "Loading historical context..."
    );

    useEffect(() => {
        const loadHistoricalContext = async () => {
            try {
                const description = await regionalHistoryService.getHistoricalContext(
                    scenarioData.culturalZone,
                    currentRegion,
                    gameDate.year,
                    scenarioData.era
                );
                setHistoricalContext(description);
            } catch (error) {
                console.error('Error loading historical context:', error);
                // Fallback to era-level description
                const fallback = HISTORY_GUIDE_DATA[scenarioData.culturalZone]?.[scenarioData.era] ||
                    "This is a time of great change and opportunity. The world is full of challenges and adventures waiting to be discovered.";
                setHistoricalContext(fallback);
            }
        };

        loadHistoricalContext();
    }, [scenarioData.culturalZone, currentRegion, gameDate.year, scenarioData.era]);

    const modeDescription = useMemo(() =>
        getModeDescription(gameMode, scenarioData.era, scenarioData.culturalZone, playerCharacter),
        [gameMode, scenarioData.era, scenarioData.culturalZone, playerCharacter]
    );

    // Get profession keyword for tooltip
    const professionKeyword = useMemo(() => {
        const professionName = playerCharacter.occupation || playerCharacter.profession;
        if (!professionName) return null;
        return getProfessionKeyword(professionName, scenarioData.culturalZone, scenarioData.era);
    }, [playerCharacter.occupation, playerCharacter.profession, scenarioData.culturalZone, scenarioData.era]);

    // Handle native share if available
    const handleNativeShare = async () => {
        if (navigator.share && shareableURL) {
            try {
                await navigator.share({
                    title: 'Universal History Simulator',
                    text: `Play as ${playerCharacter.name}, a ${playerCharacter.occupation || playerCharacter.profession} in ${formatYear(gameDate.year)}`,
                    url: shareableURL
                });
            } catch (err) {
                // User cancelled or share failed
                console.log('Share cancelled or failed:', err);
            }
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/70 flex items-center justify-center z-500 p-2 md:p-4 pb-7 md:pb-3 transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
            <div
                data-surface="modal-panel"
                className={getSafariOptimizedClassName(
                    `theme-surface border rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col transition-all duration-700 ${modalAnimationClass}`
                )}
            >

                {/* Sticky Header - Professional, theme-aware */}
                <div className="sticky top-0 z-20 surface-elevated border-b-2 border-[color:var(--border-normal)] backdrop-blur-sm">
                    <div className="flex items-center justify-between p-2.5">
                        <div className="flex items-center gap-5">
                            <div className="p-2 surface-muted rounded-lg shadow-sm">
                                <DominantFactionIcon className="w-9 h-9 text-text-primary" />
                            </div>
                            <div className="text-text-primary">
                                <div className="text-md font-medium">
                                    {formatYear(gameDate.year)} • {formatEra(scenarioData.era)} • <span className="font-bold">{currentRegion}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Desktop Share Button */}
                            <button
                                onClick={() => setShowShareLink(!showShareLink)}
                                className={getOptimizedButtonClassName(`hidden md:flex items-center gap-2 nav-button nav-button--compact ${showShareLink ? 'nav-button--active' : ''}`)}
                                data-active={showShareLink}
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm">Share</span>
                            </button>
                            <button
                                onClick={onClose}
                                className={getOptimizedButtonClassName('nav-button nav-button--compact flex items-center justify-center')}
                                >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pb-32 md:pb-6">

                    {/* Hero Section */}
                    <div className="mb-4 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-1">
                            You are <span className="text-[color:var(--accent-primary)] font-bold">{playerCharacter.name}</span>
                        </h1>
                        <p className="text-xl text-text-secondary">
                            A <span
                                className="relative inline-block"
                                onMouseEnter={() => setShowProfessionTooltip(true)}
                                onMouseLeave={() => setShowProfessionTooltip(false)}
                            >
                                <span className="text-[color:var(--color-success)] font-medium cursor-help border-b border-dotted border-[color:var(--color-success)]/40 hover:border-[color:var(--color-success)] transition-colors">
                                    {playerCharacter.occupation || playerCharacter.profession || 'traveler'}
                                </span>
                                {professionKeyword && showProfessionTooltip && (
                                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-slate-800 dark:bg-slate-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-600 dark:border-slate-700">
                                        <span className="italic">"{professionKeyword}"</span>
                                        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-slate-900"></span>
                                    </span>
                                )}
                            </span> in the <span className={getSeasonColors(getSeasonFromDate(gameDate)) + ' font-semibold'}>{getSeasonFromDate(gameDate)}</span> of {formatYear(gameDate.year)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                        {/* Left Column - Main Content (3/5) */}
                        <div className="lg:col-span-4 space-y-3">
                        {/* Historical Context */}
                            <div className={getSafariOptimizedClassName('surface-card rounded-2xl p-4 shadow-sm')}>
                                <div className="flex items-center gap-3 mb-1">
                                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                                        {localArea}
                                    </h3>
                                </div>
                                <div className="relative">
                                    <p className={`text-text-secondary leading-relaxed text-base transition-all duration-300 ${
                                        expandedContext ? '' : 'line-clamp-3'
                                    }`}>
                                        {isProcessingWorldWeaver ? (
                                            <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <span className="inline-block w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
                                                WorldWeaver is creating your custom scenario...
                                            </span>
                                        ) : (
                                            worldWeaverData?.settingDescription || historicalContext
                                        )}
                                    </p>
                                    {!isProcessingWorldWeaver && (worldWeaverData?.settingDescription || historicalContext).length > 150 && (
                                        <button
                                            onClick={() => setExpandedContext(!expandedContext)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm mt-2 flex items-center gap-1 transition-colors"
                                        >
                                            <span>{expandedContext ? 'Read less' : 'Read more'}</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedContext ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Character Info */}
                            <div className={getSafariOptimizedClassName('surface-card rounded-2xl p-4 shadow-sm')}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <h3 className="text-lg font-semibold text-slate-400 dark:text-green-400">Your Character</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowCharacterDetails(!showCharacterDetails)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 text-text-secondary rounded-full text-xs transition-colors"
                                    >
                                        <span>{showCharacterDetails ? 'Less Info' : 'More Info'}</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showCharacterDetails ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {/* Portrait and Info Layout */}
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Portrait Column */}
                                    <div className="flex-shrink-0 w-50">
                                        <div className="relative cursor-pointer"
                                            onClick={() => {
                                                if (shouldRenderPortrait) {
                                                    const expressions: Array<'neutral' | 'smile' | 'surprise' | 'scowl' | 'annoyed'> = ['neutral', 'smile', 'surprise', 'scowl', 'annoyed'];
                                                    const currentIndex = expressions.indexOf(portraitExpression);
                                                    const filteredExpressions = expressions.filter((_, i) => i !== currentIndex);
                                                    const newExpression = filteredExpressions[Math.floor(Math.random() * filteredExpressions.length)];
                                                    setPortraitExpression(newExpression);
                                                }
                                            }}
                                            title="Click to change expression"
                                        >
                                            <div className="w-50 h-40 rounded-xl border-2 border-amber-400/50 overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-600/20 transition-all hover:border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.4)]">
                                                {shouldRenderPortrait ? (
                                                    <ProceduralPortrait
                                                        character={playerCharacter}
                                                        size={160}
                                                        temporaryExpression={portraitExpression === 'neutral' ? null : portraitExpression}
                                                        className="w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-200/50 dark:bg-slate-700/50">
                                                        <div className="animate-pulse">
                                                            <User className="w-16 h-16 text-text-muted" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Expression indicator - directly under portrait */}
                                        <div className="text-center mt-2 text-xs text-text-secondary">
                                            Expression: <span className="text-amber-600 dark:text-amber-400 capitalize">{portraitExpression}</span>
                                        </div>

                                        {/* Health Status below portrait */}
                                        {playerCharacter.diseaseHealth?.currentDiseases?.length > 0 && (
                                            <div className="mt-2 p-2 border border-[color:var(--color-error)]/30 rounded text-center">
                                                <span className="text-[color:var(--color-error)] text-xs tracking-wide font-medium block mb-1">HEALTH</span>
                                                {playerCharacter.diseaseHealth.currentDiseases.map((disease, idx) => {
                                                    const isCritical = disease.disease.mortalityRate > 0.3 || disease.severity > 0.7;
                                                    return (
                                                        <span key={idx} className={`block text-xs ${isCritical ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-warning)]'}`}>
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
                                                <div className="mt-1 p-2 rounded text-center max-w-[260px]">
                                                    <p className="text-text-secondary text-xs italic break-words whitespace-normal leading-relaxed">
                                                        {attributeSentence}
                                                    </p>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* Character Info Column */}
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Name</div>
                                                <div className="text-text-primary font-medium">{playerCharacter.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Occupation</div>
                                                <div className="relative inline-block">
                                                    <div
                                                        className="text-text-primary font-medium cursor-help hover:text-[color:var(--color-success)] transition-colors"
                                                        onMouseEnter={() => setShowProfessionTooltip(true)}
                                                        onMouseLeave={() => setShowProfessionTooltip(false)}
                                                    >
                                                        {playerCharacter.occupation || playerCharacter.profession || 'Unknown'}
                                                    </div>
                                                    {professionKeyword && showProfessionTooltip && (
                                                        <span className="absolute left-0 top-full mt-1 px-3 py-1.5 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-600 dark:border-slate-700">
                                                            <span className="italic">"{professionKeyword}"</span>
                                                            <span className="absolute left-4 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-800 dark:border-b-slate-900"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Social Class</div>
                                                <div className="text-text-primary font-medium">
                                                    {playerCharacter.class ?
                                                        playerCharacter.class
                                                            .replace(/_/g, ' ')
                                                            .split(' ')
                                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                            .join(' ')
                                                        : 'Common'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Region
                                                </div>
                                                <div className="text-emerald-600 dark:text-emerald-400 font-bold">{currentRegion}</div>
                                            </div>
                                        </div>

                                        {/* Character Description - WorldWeaver or Standard */}
                                        {isProcessingWorldWeaver ? (
                                            <div className="p-3 bg-slate-200/30 dark:bg-slate-700/30 rounded-lg border border-slate-400/30 dark:border-slate-600/30">
                                                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                                                    <span className="inline-block w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
                                                    Creating character background...
                                                </p>
                                            </div>
                                        ) : worldWeaverData?.characterDescription ? (
                                            <div className="p-3 bg-slate-200/30 dark:bg-slate-700/30 rounded-lg border border-slate-400/30 dark:border-slate-600/30">
                                                <p className="text-text-secondary text-sm italic">
                                                    {worldWeaverData.characterDescription}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Brief Character Description */}
                                                <div className="p-3  rounded-lg border border-slate-400/30 dark:border-slate-600/30">
                                                    <p className="text-text-secondary text-sm italic">
                                                        {extractPersonalityTrait(playerCharacter)}
                                                    </p>
                                                </div>

                                                {/* Prized Possession */}
                                                <div className="p-3 rounded-lg border border-slate-400/30 dark:border-slate-600/30">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium uppercase">Prized Possession</span>
                                                    </div>
                                                    <p className="text-text-secondary text-sm">
                                                        {getPrizedPossession(playerCharacter)}
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                </div>

                                {/* Expandable Character Details - Full width across panel */}
                                <div className={`overflow-hidden transition-all duration-300 ease-out ${
                                    showCharacterDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                    <div className="pt-4 border-t border-slate-700/50 space-y-3">
                                        <div>
                                            <div className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-2">FULL BACKGROUND</div>
                                            <p className="text-text-secondary text-sm leading-relaxed">
                                                {playerCharacter.backstory || 'No detailed background available.'}
                                            </p>
                                        </div>
                                        {playerCharacter.religion && (
                                            <div>
                                                <div className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-2">RELIGION</div>
                                                <p className="text-text-secondary text-sm">{playerCharacter.religion}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                    {/* Game Mode & Mission */}
                    <div className={getSafariOptimizedClassName('surface-card rounded-2xl p-4 shadow-sm')}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Crown className={`w-5 h-5 shrink-0 ${
                                    gameMode ? GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.icon || 'text-[color:var(--accent-primary)]' : 'text-[color:var(--accent-primary)]'
                                }`} />
                                <h3 className={`font-semibold text-base ${
                                    gameMode ? GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.icon || 'text-[color:var(--accent-primary)]' : 'text-[color:var(--accent-primary)]'
                                }`}>
                                    {gameMode ? gameMode.name : 'Game Mode: Selecting...'}
                                </h3>
                            </div>
                            {gameMode && (
                                <button
                                    onClick={() => setShowModeDetails(!showModeDetails)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 text-text-secondary rounded-full text-xs transition-colors"
                                >
                                    <span>{showModeDetails ? 'Less Info' : 'More Info'}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showModeDetails ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                        <p className="text-text-secondary leading-relaxed text-sm">
                            {gameMode ? modeDescription : 'Your game mode is being determined based on your character\'s background and skills. This will shape your adventure and goals.'}
                        </p>

                        {/* Expandable Mode Details - with smooth animation */}
                        {gameMode && (
                            <div className={`overflow-hidden transition-all duration-300 ease-out ${
                                showModeDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                                <div className="pt-4 border-t border-slate-700/50 space-y-3">
                                    {gameMode.victoryConditions.length > 0 && (
                                        <div>
                                            <div className="text-green-600 dark:text-green-400 text-xs font-medium mb-2">VICTORY CONDITIONS</div>
                                            <ul className="space-y-1">
                                                {gameMode.victoryConditions.map((condition, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                                                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                                                        <span>{condition.description}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {gameMode.challenges && gameMode.challenges.length > 0 && (
                                        <div>
                                            <div className="text-[color:var(--color-warning)] text-xs font-medium mb-2">KEY CHALLENGES</div>
                                            <ul className="space-y-1">
                                                {gameMode.challenges.slice(0, 3).map((challenge, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                                                        <span className="text-[color:var(--color-warning)] mt-0.5">•</span>
                                                        <span>{challenge}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings Section */}
                    <div className={getSafariOptimizedClassName('surface-card rounded-2xl p-4 shadow-sm')}>
                        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Settings</h4>
                        <label className="flex flex-col md:flex-row items-start md:items-center gap-3 cursor-pointer group">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={dialectContinuumEnabled}
                                    onChange={(e) => setDialectContinuumEnabled(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 bg-[var(--bg-elevated)] border"
                                    style={{ borderColor: 'var(--surface-card-border)' }}
                                />
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Enable Dialect Continuum</div>
                            </div>
                            <p className="text-xs text-text-secondary md:ml-auto md:text-right">
                                Gradually introduces foreign languages as you travel.
                            </p>
                        </label>
                    </div>

                        </div>

                        {/* Right Column - Charts (2/5) */}
                        <div className="lg:col-span-2 space-y-2 md:space-y-2">
                            {/* Population Chart - Static SVG version for better performance */}
                            <SimplePopulationChart
                                currentYear={gameDate.year}
                                culturalZone={scenarioData.culturalZone.toString()}
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
                                    mapSeed={scenarioData.gameSeed}
                                />
                            </Suspense>

                            {/* Desktop Action Buttons */}
                            <div className="hidden lg:block space-y-3">
                                <button
                                    onClick={() => {
                                        if (dialectContinuumEnabled) {
                                            dialectContinuumService.setEnabled(true);
                                            dialectContinuumService.initialize(localArea, { x: 0, y: 0 });
                                            dialectContinuumService.saveState();
                                        } else {
                                            dialectContinuumService.setEnabled(false);
                                        }
                                        onClose();
                                    }}
                                    className={`w-full px-5 py-4 text-text-primary font-bold rounded-lg shadow-lg transition-all duration-300 ease-out text-lg ${
                                        gameMode ? `${GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.bg || 'surface-elevated'} ${GAME_MODE_COLORS[gameMode.id as keyof typeof GAME_MODE_COLORS]?.hover || 'hover:shadow-xl'}` : 'surface-elevated hover:shadow-xl'
                                    } bg-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/90`}
                                >
                                    Begin the Simulation
                                </button>

                                <button
                                    onClick={() => {
                                        setShowShareLink(!showShareLink);
                                        setCopiedToClipboard(false);
                                    }}
                                    className={getOptimizedButtonClassName(`w-full px-6 py-3 nav-button nav-button--compact flex items-center justify-center gap-2 ${showShareLink ? 'nav-button--active' : ''}`)}
                                    data-active={showShareLink}
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>{showShareLink ? 'Hide Share Options' : 'Share This Scenario'}</span>
                                </button>

                                {/* Share Options (Desktop) */}
                                <div className={`overflow-hidden transition-all duration-300 ease-out ${
                                    showShareLink ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-4 surface-muted rounded-xl shadow-sm space-y-3">
                                        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Share this scenario:</div>

                                        {/* URL Copy */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={shareableURL}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-[var(--bg-elevated)] text-text-primary text-sm rounded border font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                style={{ borderColor: 'var(--surface-card-border)' }}
                                                onClick={(e) => e.currentTarget.select()}
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(shareableURL);
                                                    setCopiedToClipboard(true);
                                                    setTimeout(() => setCopiedToClipboard(false), 3000);
                                                }}
                                                className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                                                    copiedToClipboard ? 'bg-green-600 text-text-primary' : 'bg-blue-600 hover:bg-blue-700 text-text-primary'
                                                }`}
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

                                        <div className="text-xs text-text-secondary">
                                            This link preserves: character, location, date, game mode, and map seed
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar with safe area support */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 surface-bottom-panel z-20 p-4"
                    style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                if (dialectContinuumEnabled) {
                                    dialectContinuumService.setEnabled(true);
                                    dialectContinuumService.initialize(localArea, { x: 0, y: 0 });
                                    dialectContinuumService.saveState();
                                } else {
                                    dialectContinuumService.setEnabled(false);
                                }
                                onClose();
                            }}
                            className="w-full px-6 py-4 text-white font-bold rounded-xl shadow-lg text-lg bg-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/90 transition-all"
                        >
                            Begin the Simulation
                        </button>
                        <button
                            onClick={() => setShowBottomSheet(true)}
                            className={getOptimizedButtonClassName('w-full px-6 py-3 nav-button nav-button--compact flex items-center justify-center gap-2')}
                        >
                            <Share2 className="w-5 h-5" />
                            Share This Scenario
                        </button>
                    </div>
                </div>

                {/* Mobile Bottom Sheet */}
                {showBottomSheet && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="lg:hidden fixed inset-0 bg-black/60 z-40"
                            onClick={() => setShowBottomSheet(false)}
                        />

                        {/* Bottom Sheet */}
                        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out"
                            style={{
                                transform: showBottomSheet ? 'translateY(0)' : 'translateY(100%)',
                                paddingBottom: 'env(safe-area-inset-bottom, 1rem)'
                            }}>
                            <div className="surface-card rounded-t-3xl border-t shadow-2xl" style={{ borderColor: 'var(--surface-card-border)' }}>
                                {/* Handle */}
                                <div className="flex justify-center pt-3 pb-2">
                                    <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-text-primary mb-4">Share Scenario</h3>

                                    {/* Native Share Button */}
                                    {navigator.share && (
                                        <button
                                            onClick={() => {
                                                handleNativeShare();
                                                setShowBottomSheet(false);
                                            }}
                                            className="w-full px-6 py-3 bg-blue-600 active:bg-blue-700 text-text-primary font-medium rounded-xl flex items-center justify-center gap-2 mb-3"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            Share via...
                                        </button>
                                    )}

                                    {/* Copy Link */}
                                    <button
                                        onClick={() => {
                                            if (shareableURL) {
                                                navigator.clipboard.writeText(shareableURL);
                                                setCopiedToClipboard(true);
                                                setTimeout(() => {
                                                    setCopiedToClipboard(false);
                                                    setShowBottomSheet(false);
                                                }, 2000);
                                            }
                                        }}
                                        className={getOptimizedButtonClassName('w-full px-6 py-3 nav-button nav-button--compact flex items-center justify-center gap-2')}
                                        data-active={copiedToClipboard}
                                    >
                                        {copiedToClipboard ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                Copy Link
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setShowBottomSheet(false)}
                                        className="w-full mt-3 px-6 py-3 text-text-secondary font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default React.memo(InitialScenarioModal);
