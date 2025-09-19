import React, { useEffect, useState, useMemo } from 'react';
import { X, User, Calendar, Globe, Trophy, MapPin, Crown, Scroll, Link } from 'lucide-react';
import { GameDate, HistoricalEra, CulturalZone } from '../types';
import { PlayerCharacter } from '../types/playerCharacter';
import { GameMode } from '../types/eventTypes';
import { HISTORY_GUIDE_DATA } from '../constants/gameData/historyguide';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString, formatDateWithSeason, getSeasonFromDate } from '../utils/dateUtils';
import { getDetailedHistoricalDescription } from '../utils/historicalPeriodUtils';
import { URLGameConfig } from '../services/urlConfigService';
import { SeedManager } from '../services/seedService';
import { shareableStateService } from '../services/shareableStateService';
import { findZoneForMapArea } from '../services/zoneDetectionService';
import PopulationChart from './charts/PopulationChart';
import MiniLocationMap from './charts/MiniLocationMap';
import { getSafariOptimizedClassName } from '../utils/safariUtils';

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
                NORTH_AMERICAN_PRE_COLUMBIAN: "Survive the untamed wilderness of ancient America, where small bands hunt mammoth and gather wild foods.",
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
    urlConfig
}) => {
    // Animation states for stylish fade-in
    const [isVisible, setIsVisible] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);

    // Detect Safari for performance optimizations
    const isSafari = useMemo(() => {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Start the fade-in animation sequence
            setTimeout(() => setIsVisible(true), 10);
            setTimeout(() => setContentVisible(true), 100);
        } else {
            setIsVisible(false);
            setContentVisible(false);
        }
    }, [isOpen]);
    
    if (!isOpen) return null;
    
    const dateInfo = parseDateString(String(gameDate.year));
    const culturalZone = mapLocationToCulture(currentZone, dateInfo.year) as CulturalZone;
    const era = dateInfo.era as HistoricalEra;
    
    // Get the current seed from SeedManager
    const seedManager = SeedManager.getInstance();
    const gameSeed = seedManager.getSeed();
    const [showShareLink, setShowShareLink] = React.useState(false);
    const [shareableURL, setShareableURL] = React.useState('');
    
    // Generate shareable URL when requested
    React.useEffect(() => {
        if (showShareLink) {
            // Detect zone from map area if currentZone is empty or invalid
            let finalZone = currentZone;
            let finalRegion = currentRegion;
            
            if (!currentZone || currentZone === '' || currentZone === '...') {
                console.log('[ShareableState] Current zone is empty, detecting from map area:', localArea);
                const detected = findZoneForMapArea(localArea);
                if (detected) {
                    finalZone = detected.zone;
                    finalRegion = detected.region;
                    console.log('[ShareableState] Detected zone:', finalZone, 'region:', finalRegion);
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
    
    // Try to get a more specific historical description based on the exact year
    const detailedDescription = getDetailedHistoricalDescription(culturalZone, era, gameDate.year);
    const historicalContext = detailedDescription || 
        HISTORY_GUIDE_DATA[culturalZone]?.[era] || 
        "This is a time of great change and opportunity. The world is full of challenges and adventures waiting to be discovered.";
    
    const modeDescription = getModeDescription(gameMode, era, culturalZone, playerCharacter);

    return (
        <div className={`fixed inset-0 bg-slate-400/60 dark:bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
            <div className={`bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-700 dark:to-slate-900
                border border-slate-300/50 dark:border-slate-700/50 rounded-2xl shadow-2xl max-w-5xl w-full
                max-h-[95vh] md:max-h-[90vh] md:mt-[8px] overflow-y-auto
                ${isSafari ? 'transition-opacity duration-700' : 'transition-all duration-700 transform'} ${
                    contentVisible
                        ? `opacity-100 ${!isSafari ? 'scale-100 translate-y-0' : ''}`
                        : `opacity-0 ${!isSafari ? 'scale-95 translate-y-4' : ''}`
                }`}>
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-5 border-b border-slate-300/50 dark:border-slate-700/50">
                    <div className="flex items-start sm:items-center gap-2 md:gap-4 w-full sm:w-auto">
                        <div className="p-2 md:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shrink-0">
                            <Scroll className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-0.5 md:mb-1 break-words">
                                You are {playerCharacter.name}, and the year is {gameDate.year}
                            </h2>
                            <p className="text-xs sm:text-sm md:text-lg text-slate-600 dark:text-slate-300 break-words">
                                <span className="block sm:inline">{formatEra(era)} • {formatCulturalZone(culturalZone)}</span>
                                <span className="block sm:inline sm:ml-1">• {currentRegion}</span>
                                <span className="block sm:inline sm:ml-1">• {formatDateWithSeason(gameDate, getSeasonFromDate(gameDate))}</span>
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

                <div className="p-3 md:p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
                        {/* Left Column - Main Content (3/5) */}
                        <div className="lg:col-span-3 space-y-3 md:space-y-4">
                            {/* Historical Context */}
                            <div className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-700/30">
                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                    <Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-400 shrink-0" />
                                    <h3 className="text-base md:text-xl font-semibold text-blue-600 dark:text-blue-400 break-words">
                                        It is {getSeasonFromDate(gameDate)} in the {localArea}
                                    </h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                    {historicalContext}
                                </p>
                            </div>

                            {/* Character Info */}
                            <div className="bg-slate-800/50 rounded-lg p-3 md:p-6 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-2 md:mb-3">
                                    <User className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                                    <h3 className="text-base md:text-xl font-semibold text-green-600 dark:text-green-400">Your Character</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-1 text-sm md:text-base">
                            <div className="col-span-1 sm:col-span-2 md:col-span-1">
                                <span className="text-slate-400 text-xs md:text-base">Name:</span>
                                <span className="text-white ml-2 md:ml-3 font-medium text-sm md:text-base break-words">
                                    {playerCharacter.name}
                                </span>
                            </div>
                            <div className="col-span-1 sm:col-span-2 md:col-span-1">
                                <span className="text-slate-400 text-xs md:text-base">Occupation:</span>
                                <span className="text-white ml-2 md:ml-3 font-medium text-sm md:text-base break-words">
                                    {playerCharacter.occupation || playerCharacter.profession || 'Unknown'}
                                </span>
                            </div>
                            <div className="col-span-1 sm:col-span-2 md:col-span-1">
                                <span className="text-slate-400 text-xs md:text-base">Social Class:</span>
                                <span className="text-white ml-2 md:ml-3 font-medium text-sm md:text-base break-words">
                                    {playerCharacter.class ? 
                                        playerCharacter.class
                                            .replace(/_/g, ' ')
                                            .split(' ')
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                            .join(' ') 
                                        : 'Common'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2 col-span-1 sm:col-span-2 md:col-span-1">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
                                <span className="text-slate-400 text-xs md:text-base">Region:</span>
                                <span className="text-white font-medium text-sm md:text-base break-words">{currentRegion}</span>
                            </div>
                          
                            {playerCharacter.diseaseHealth?.currentDiseases?.length > 0 && (
                                <div className="col-span-1 sm:col-span-2">
                                    <span className="text-slate-400 text-xs md:text-base">Health:</span>
                                    {playerCharacter.diseaseHealth.currentDiseases.map((disease, idx) => {
                                        const isCritical = disease.disease.mortalityRate > 0.3 || disease.severity > 0.7;
                                        return (
                                            <span key={idx} className={`ml-2 md:ml-3 font-medium text-sm md:text-lg ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>
                                                Currently suffering from {disease.disease.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Game Mode & Mission */}
                    {gameMode && (
                        <div className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-700/30">
                            <div className="space-y-2 md:space-y-4">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Crown className="w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0" />
                                    <span className="font-semibold text-amber-600 dark:text-amber-400 text-sm md:text-lg">{gameMode.name}</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-xs md:text-base">
                                    {modeDescription}
                                </p>
                                {gameMode.victoryConditions.length > 0 && (
                                    <div className="mt-2 md:mt-3">
                                        <span className="text-xs md:text-sm font-medium text-slate-400">Victory Conditions: </span>
                                        <span className="text-xs md:text-sm text-green-400">
                                            {gameMode.victoryConditions.slice(0, 3).map((condition, idx) => (
                                                <span key={idx}>
                                                    {idx > 0 && ' • '}
                                                    {condition.description}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Game Seed Section */}
                    <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 md:gap-3">
                                <Link className="w-4 h-4 md:w-5 md:h-5 text-purple-400 shrink-0" />
                                <h3 className="text-sm md:text-base font-semibold text-purple-600 dark:text-purple-400">Game Seed</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="px-2 py-1 bg-slate-200 dark:bg-slate-900 rounded text-xs md:text-sm font-mono text-purple-700 dark:text-purple-300">
                                    {gameSeed}
                                </code>
                                <button
                                    onClick={() => setShowShareLink(!showShareLink)}
                                    className="px-2 py-1 text-xs md:text-sm bg-purple-600/20 hover:bg-purple-600/30 
                                        text-purple-400 rounded transition-colors"
                                >
                                    {showShareLink ? 'Hide' : 'Share'}
                                </button>
                            </div>
                        </div>
                        
                        {showShareLink && (
                            <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-900 rounded">
                                <p className="text-xs text-slate-400 mb-1">Share this link to play the same world:</p>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        value={shareableURL}
                                        readOnly
                                        className="flex-1 px-2 py-1 bg-slate-800 text-xs md:text-sm text-slate-300 
                                            rounded border border-slate-700 font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareableURL);
                                        }}
                                        className="px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 
                                            text-green-400 rounded transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <p className="text-xs md:text-sm text-slate-400 mt-2">
                            This seed ensures the same world generation for all players who use it.
                        </p>
                    </div>
                        </div>

                        {/* Right Column - Charts (2/5) */}
                        <div className="lg:col-span-2 space-y-3 md:space-y-4">
                            {/* Population Chart */}
                            <PopulationChart
                                currentYear={gameDate.year}
                                region={currentRegion}
                                culturalZone={culturalZone.toString()}
                            />
                            
                            {/* Mini Location Map */}
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
                        </div>
                    </div>
                </div>

                {/* Footer - Sticky on mobile */}
                <div className={getSafariOptimizedClassName("sticky bottom-0 p-3 md:p-3 border-t border-slate-300/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm")}>
                    <button
                        onClick={onClose}
                        className={`w-full px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-amber-600 to-amber-700
                            hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg
                            ${isSafari ? 'transition-colors duration-200' : 'transition-all duration-200'} shadow-lg hover:shadow-xl ${!isSafari ? 'hover:scale-[1.02]' : ''}
                            text-sm md:text-lg`}
                    >
                        Begin the Simulation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InitialScenarioModal;