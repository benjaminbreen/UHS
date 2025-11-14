/**
 * components/RuinStructureModal.tsx - Beautiful ruins exploration modal
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { TerrainStructure, MapData, Tile, BiomeType, Season, TimeOfDay, NpcEntity, ClimateType, PlayerCharacter, HistoricalEra } from '../types';
import RuinBanner from './RuinBanner';
import RoguelikeDisplayEnhanced from './RoguelikeDisplayEnhanced';
import { ruinSourcesService, PrimarySource } from '../services/ruinSourcesService';
import { ruinProgressService } from '../services/ruinProgressService';
import { questService } from '../services/questService';
import { generateCulturalRuinName } from '../services/roguelikeService';
import { generateRuinQuest } from '../constants/questTemplates/ruinQuestTemplates';
import { parseDateString } from '../utils/dateUtils';
import { 
    FaSkull, 
    FaScroll, 
    FaMountain, 
    FaKey,
    FaGem,
    FaCoins,
    FaLandmark,
    FaMap,
    FaHistory,
    FaDungeon,
    FaExclamationTriangle,
    FaBookOpen,
    FaCompass,
    FaHourglass,
    FaUniversity,
    FaCampground,
    FaHome,
    FaChurch,
    FaMosque,
    FaSynagogue,
    FaPrayingHands,
    FaFortAwesome
} from 'react-icons/fa';
import { 
    GiGreekTemple, 
    GiMayanPyramid, 
    GiEgyptianPyramids,
    GiStonePile,
    GiCastle,
    GiAncientRuins,
    GiTreasureMap,
    GiTempleGate,
    GiPagoda,
    GiAncientSword,
    GiScrollUnfurled,
    GiStoneTablet,
    GiBrokenPottery,
    GiCrackedHelm,
    GiFallingRocks,
    GiSpiderWeb,
    GiPoisonBottle,
    GiSandsOfTime
} from 'react-icons/gi';

// Helper to get ruin type icon
const getRuinIcon = (ruinType?: string, ruinStyle?: string): React.ReactNode => {
    const type = (ruinType || '').toLowerCase();
    const style = (ruinStyle || '').toLowerCase();
    
    // Check specific types first
    if (type.includes('pyramid')) return <GiEgyptianPyramids size={24} className="text-amber-500" />;
    if (type.includes('temple') && style.includes('mayan')) return <GiMayanPyramid size={24} className="text-amber-500" />;
    if (type.includes('temple')) return <GiGreekTemple size={24} className="text-amber-500" />;
    if (type.includes('mound') || type.includes('earthwork')) return <GiStonePile size={24} className="text-amber-500" />;
    if (type.includes('castle') || type.includes('fortress')) return <GiCastle size={24} className="text-amber-500" />;
    if (type.includes('kiva')) return <FaCampground size={24} className="text-amber-500" />;
    if (type.includes('cliff dwelling')) return <FaMountain size={24} className="text-amber-500" />;
    if (type.includes('longhouse')) return <FaHome size={24} className="text-amber-500" />;
    if (type.includes('church') || type.includes('cathedral')) return <FaChurch size={24} className="text-amber-500" />;
    if (type.includes('mosque') || type.includes('minaret')) return <FaMosque size={24} className="text-amber-500" />;
    if (type.includes('synagogue')) return <FaSynagogue size={24} className="text-amber-500" />;
    if (type.includes('pagoda') || style.includes('pagoda')) return <GiPagoda size={24} className="text-amber-500" />;
    if (type.includes('palace')) return <FaLandmark size={24} className="text-amber-500" />;
    if (type.includes('ballcourt')) return <FaDungeon size={24} className="text-amber-500" />;
    if (type.includes('holy') || type.includes('sacred')) return <FaPrayingHands size={24} className="text-amber-500" />;
    if (type.includes('fort')) return <FaFortAwesome size={24} className="text-amber-500" />;
    
    // Default
    return <GiAncientRuins size={24} className="text-amber-500" />;
};

interface RuinStructureModalProps {
    structure: TerrainStructure;
    mapData: MapData;
    npcs: NpcEntity[];
    onClose: () => void;
    gameTimeHours: number;
    season: Season;
    playerCharacter?: PlayerCharacter;
    currentLocation?: string;
    formattedDate?: string;
    onRoguelikeModeChange?: (inRoguelike: boolean) => void;
    onPlayerDeath?: (deathInfo: any) => void;
}

const RuinStructureModal: React.FC<RuinStructureModalProps> = ({
    structure,
    mapData,
    npcs,
    onClose,
    gameTimeHours,
    season,
    playerCharacter,
    currentLocation,
    formattedDate,
    onRoguelikeModeChange,
    onPlayerDeath
}) => {
    const { name, location, state, customData } = structure;
    const [activeTab, setActiveTab] = useState<'overview' | 'exploration' | 'artifacts'>('overview');
    const [discoverableSources, setDiscoverableSources] = useState<PrimarySource[]>([]);
    const [discoveredSources, setDiscoveredSources] = useState<PrimarySource[]>([]);
    const [inRoguelike, setInRoguelike] = useState(false);

    // Callbacks to avoid inline functions
    const handleTabChange = useCallback((tab: 'overview' | 'exploration' | 'artifacts') => {
        setActiveTab(tab);
    }, []);

    const handleEnterRuins = useCallback(() => {
        setInRoguelike(true);
        onRoguelikeModeChange?.(true);
    }, [onRoguelikeModeChange]);

    const handleSearchPerimeter = useCallback(() => {
        console.log('Search perimeter');
    }, []);

    // Get ruin exploration progress
    const structureId = `${structure.location[0]}-${structure.location[1]}`;
    const ruinProgress = ruinProgressService.getProgress(structureId);
    
    const timeOfDay: TimeOfDay = useMemo(() => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);

    // Get tile at location for biome info
    const tileAtLocation = mapData.tiles?.find(row => 
        row.find(t => t.x === location[0] && t.y === location[1])
    )?.find(t => t.x === location[0] && t.y === location[1]);

    const biome = tileAtLocation?.biome || BiomeType.RUINS;
    const elevation = tileAtLocation?.altitude || 0;
    
    // Extract ruin data from customData
    const ruinType = customData?.originalStructureType || tileAtLocation?.ruinType || 'Unknown Structure';
    const ruinStyle = customData?.style || tileAtLocation?.ruinStyle || 'ancient';
    const ruinMaterial = customData?.material || tileAtLocation?.ruinMaterial || 'stone';
    const originalEra = customData?.originalEra || 'Unknown Era';
    const age = customData?.age || 'Centuries old';
    
    // Load discoverable primary sources and generate quest when component mounts
    useEffect(() => {
        const loadSources = async () => {
            try {
                const sources = await ruinSourcesService.getSourcesForRuin(mapData, age);
                setDiscoverableSources(sources);
            } catch (error) {
                console.warn('Could not load primary sources for ruin:', error);
            }
        };
        
        loadSources();
    }, [mapData, age]);
    
    // Generate automatic ruin exploration quest when entering ruins
    useEffect(() => {
        // Check if we should generate a ruin quest for this location
        const ruinLocation = { x: location[0], y: location[1] };
        const hasExistingRuinQuest = questService.getActiveQuests().some(quest => {
            const isRuinQuest = (quest as any).isRuinQuest;
            if (!isRuinQuest) return false;
            
            // Check if quest is for this ruin location
            if (quest.startLocation) {
                const distance = Math.sqrt(
                    Math.pow(quest.startLocation.x - ruinLocation.x, 2) +
                    Math.pow(quest.startLocation.y - ruinLocation.y, 2)
                );
                return distance < 1; // Exact location match
            }
            return false;
        });
        
        if (!hasExistingRuinQuest) {
            // Get the current era from the map data
            const dateInfo = parseDateString(mapData.timeSlice || '1500');
            const era = dateInfo.era;
            
            // Generate an automatic ruin exploration quest
            const ruinQuest = generateRuinQuest(
                era,
                ruinType,
                true, // isAutomatic
                undefined, // no NPC for automatic quests
                ruinLocation
            );
            
            if (ruinQuest) {
                // Add quest metadata
                const completeQuest = {
                    ...ruinQuest,
                    id: ruinQuest.id || `ruin_quest_${Date.now()}`,
                    status: 'available' as const,
                    startTime: Date.now(),
                    isRuinQuest: true
                };
                
                // Add the quest to the quest service
                questService.addQuest(completeQuest as any);
                console.log('[RuinStructureModal] Generated automatic ruin exploration quest:', completeQuest.title);
                
                // Show a notification
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-900/90 text-amber-200 px-6 py-3 rounded-lg border border-amber-700 z-50 animate-fade-in shadow-xl';
                notification.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🏛️</span>
                        <div>
                            <div class="font-bold">New Quest: ${completeQuest.title}</div>
                            <div class="text-sm opacity-90">Explore these ancient ruins</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 4000);
            }
        }
    }, [location, ruinType, mapData.timeSlice]);
    
    // Use structure location as seed for consistent random values
    const structureSeed = structure.location[0] * 1000 + structure.location[1];
    const seededRandom = (min: number, max: number) => {
        const x = Math.sin(structureSeed) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min) + min);
    };

    // Exploration status (for now, placeholder)
    const explorationStatus = seededRandom(0, 100) > 50 ? 'Unexplored' : 'Explored';
    const explorationColor = explorationStatus === 'Unexplored' ? 'text-amber-400' : 'text-green-400';
    
    // Generate ruin-specific details
    const ruinDetails = [
        { label: 'Original Structure', value: ruinType },
        { label: 'Architectural Style', value: ruinStyle },
        { label: 'Construction Material', value: ruinMaterial },
        { label: 'Era of Origin', value: originalEra },
        { label: 'Estimated Age', value: age },

        { label: 'Excavation Progress', value: `${seededRandom(0, 30)}%` }
    ];

    // Generate historically accurate exploration details based on ruin type and era
    const explorationDetails = useMemo(() => {
        const details = [];
        
        // Structure-specific exploration data
        if (ruinType.includes('temple') || ruinType.includes('church')) {
            details.push(
                { label: 'Chambers Found', value: `${seededRandom(2, 5)} of ${seededRandom(8, 12)}` },
                { label: 'Notable Features', value: 'Prayer halls, altar remains' }
            );
        } else if (ruinType.includes('fortress') || ruinType.includes('castle')) {
            details.push(
                { label: 'Chambers Found', value: `${seededRandom(3, 8)} of ${seededRandom(12, 20)}` },
                { label: 'Notable Features', value: 'Defensive walls, guard towers' }
            );
        } else if (ruinType.includes('palace')) {
            details.push(
                { label: 'Chambers Found', value: `${seededRandom(4, 10)} of ${seededRandom(15, 25)}` },
                { label: 'Notable Features', value: 'Throne room, audience chambers' }
            );
        } else {
            details.push(
                { label: 'Areas Mapped', value: `${seededRandom(20, 60)}%` },
                { label: 'Notable Features', value: 'Foundation walls, collapsed structures' }
            );
        }
        
        details.push(
            { label: 'Structural Stability', value: seededRandom(0, 100) > 70 ? 'Unstable' : seededRandom(0, 100) > 40 ? 'Partially safe' : 'Stable' },
            { label: 'Last Survey', value: explorationStatus === 'Explored' ? `${seededRandom(1, 30)} days ago` : 'Never documented' },
            { label: 'Archaeological Value', value: seededRandom(0, 100) > 60 ? 'High' : 'Moderate' }
        );
        
        return details;
    }, [ruinType, explorationStatus, structureSeed]);

    // Generate period-appropriate hazards based on structure type
    const hazards = useMemo(() => {
        const baseHazards = ['Structural collapse risk', 'Unstable flooring'];
        
        // Add environment-specific hazards
        if (mapData.climate === ClimateType.TROPICAL || mapData.climate === ClimateType.SEMITROPICAL) {
            baseHazards.push('Venomous fauna', 'Dense vegetation');
        } else if (mapData.climate === ClimateType.ARID) {
            baseHazards.push('Sand accumulation', 'Extreme temperatures');
        } else if (mapData.climate === ClimateType.COLD) {
            baseHazards.push('Ice formation', 'Snow load on structures');
        } else {
            baseHazards.push('Water damage', 'Root intrusion');
        }
        
        return baseHazards;
    }, [mapData.climate]);
    
    // Generate historically accurate potential finds based on structure type and era
    const getHistoricalFinds = () => {
        const finds = [];
        const era = customData?.originalEra || originalEra;
        
        // Era and structure-specific finds
        if (ruinType.includes('temple') || ruinType.includes('church') || ruinType.includes('mosque')) {
            finds.push(
                { icon: <GiScrollUnfurled className="text-green-400" size={16} />, text: 'Religious manuscripts and prayer texts' },
                { icon: <FaBookOpen className="text-green-400" size={16} />, text: 'Stone inscriptions and dedicatory plaques' }
            );
        }
        
        if (ruinType.includes('palace') || ruinType.includes('fortress')) {
            finds.push(
                { icon: <GiStoneTablet className="text-green-400" size={16} />, text: 'Administrative records and royal decrees' },
                { icon: <FaScroll className="text-green-400" size={16} />, text: 'Military dispatches and garrison logs' }
            );
        }
        
        if (ruinType.includes('marketplace') || ruinType.includes('trading')) {
            finds.push(
                { icon: <FaCoins className="text-green-400" size={16} />, text: 'Merchant tokens and trade weights' },
                { icon: <GiBrokenPottery className="text-green-400" size={16} />, text: 'Storage vessels with residue traces' }
            );
        }
        
        // Default archaeological finds for any ruin
        if (finds.length === 0) {
            finds.push(
                { icon: <GiBrokenPottery className="text-green-400" size={16} />, text: 'Ceramic fragments and household items' },
                { icon: <GiStoneTablet className="text-green-400" size={16} />, text: 'Foundation stones with mason marks' }
            );
        }
        
        // Add period-appropriate building materials
        finds.push(
            { icon: <GiStonePile className="text-green-400" size={16} />, text: `${ruinMaterial} architectural fragments` }
        );
        
        return finds;
    };

    // Generate culturally-specific ruin name
    const culturalRuinName = useMemo(() => {
        const zone = mapData?.culturalZone || 'EUROPEAN';
        const era = mapData?.era || HistoricalEra.MEDIEVAL;
        return generateCulturalRuinName(ruinType, zone, era, ruinMaterial);
    }, [ruinType, mapData?.culturalZone, mapData?.era, ruinMaterial]);

    // Create ruin type for roguelike with cultural name
    const ruinTypeForRoguelike = {
        name: culturalRuinName,
        description: `The remains of what was once a ${ruinType.toLowerCase()}. Built from ${ruinMaterial}, its ${ruinStyle} architecture speaks of a lost civilization.`,
        age: state === 'ancient' ? 'Over 1000 years old' : 'Centuries old',
        dangers: hazards,
        material: ruinMaterial,
        originalType: ruinType
    };

    // Handle roguelike mode
    if (inRoguelike && playerCharacter) {
        return (
            <RoguelikeDisplayEnhanced
                ruinType={ruinTypeForRoguelike}
                playerCharacter={playerCharacter}
                mapData={mapData}
                onExit={() => {
                    setInRoguelike(false);
                    onRoguelikeModeChange?.(false);
                }}
                structureLocation={structure.location}
                onHealthChange={(newHealth) => {
                    if (playerCharacter) playerCharacter.health = newHealth;
                }}
                onInventoryAdd={(item) => {
                    if (playerCharacter) {
                        if (!playerCharacter.inventory) playerCharacter.inventory = [];
                        playerCharacter.inventory.push(item);
                    }
                }}
                onGoldChange={(newGold) => {
                    if (playerCharacter) {
                        playerCharacter.currency = (playerCharacter.currency || 0) + newGold;
                    }
                }}
                onPlayerDeath={onPlayerDeath}
            />
        );
    }

    return (
        <div
            data-surface="modal-overlay"
            className="modal-overlay theme-surface flex items-center justify-center px-0"
        >
            <div
                data-surface="modal-panel"
                className="relative w-full h-[80vh] max-w-9xl mx-auto top-6 flex flex-col ff-panel theme-surface shadow-2xl border border-amber-800/30 rounded-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-10 right-4 z-50 transition-colors"
                    style={{ fontSize: '10px', lineHeight: '1', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                    ×
                </button>
                
                {/* Enhanced Banner Header - Full width, no rounded corners */}
                <header className="relative h-[240px] sm:h-[260px] md:h-[280px] flex-shrink-0 overflow-hidden border-b-4 border-amber-700/50">
                    <RuinBanner
                        ruinName={name}
                        ruinAge={age}
                        tile={{
                            x: location[0],
                            y: location[1],
                            biome: biome,
                            altitude: elevation,
                            isLand: true,
                            isCoast: false,
                            qualities: {
                                flammability: 0,
                                biodiversity: 0.5,
                                healthiness: 0.3,
                                sacrality: 0.8,
                                safety: 0.2
                            },
                            ruinType: ruinType,
                            ruinStyle: ruinStyle,
                            ruinMaterial: ruinMaterial
                        } as Tile}
                        mapData={mapData}
                        ruinType={ruinType}
                        ruinStyle={ruinStyle}
                        ruinMaterial={ruinMaterial}
                        originalStructureType={ruinType}
                        width={1400}
                        height={280}
                    />
                    {/* Banner gradient overlay */}
                  <div className="absolute inset-0 banner-gradient-overlay"></div>


                    {/* Header Content - Clear background */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
                        {/* Title Section */}
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-600/40 to-amber-700/20 backdrop-blur-sm border-2 border-amber-500/50 shadow-lg">
                                    {getRuinIcon(ruinType, ruinStyle)}
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5" style={{ textShadow: '1px 1px 3px #000', color: '#fbbf24' }}>
                                        {originalEra} • {age}
                                    </p>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent"
                                        style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
                                        {name}
                                    </h2>
                                    <p className="text-xs sm:text-sm capitalize text-amber-100/90 mt-0.5 flex items-center gap-1.5" style={{ textShadow: '1px 1px 2px #000' }}>
                                        <GiAncientRuins className="text-amber-400" size={12} />
                                        {ruinType} • {mapData.mapAreaName || currentLocation || 'Unknown Region'}
                                    </p>
                                </div>
                            </div>


                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-1.5 backdrop-blur-sm rounded-lg p-1 px-2 border border-amber-700/30" style={{ backgroundColor: 'var(--surface-overlay-strong)' }}>
                            <button
                                onClick={() => handleTabChange('overview')}
                                className={`flex-1 px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    activeTab === 'overview'
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                                        : ''
                                }`}
                                style={activeTab !== 'overview' ? {
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'transparent'
                                } : undefined}
                                onMouseEnter={e => {
                                    if (activeTab !== 'overview') {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (activeTab !== 'overview') {
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <FaLandmark className="inline mr-1.5" size={12} />Overview
                            </button>
                            <button
                                onClick={() => handleTabChange('exploration')}
                                className={`flex-1 px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    activeTab === 'exploration'
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                                        : ''
                                }`}
                                style={activeTab !== 'exploration' ? {
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'transparent'
                                } : undefined}
                                onMouseEnter={e => {
                                    if (activeTab !== 'exploration') {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (activeTab !== 'exploration') {
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <FaMap className="inline mr-1.5" size={12} />Exploration
                            </button>
                            <button
                                onClick={() => handleTabChange('artifacts')}
                                className={`flex-1 px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    activeTab === 'artifacts'
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                                        : ''
                                }`}
                                style={activeTab !== 'artifacts' ? {
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'transparent'
                                } : undefined}
                                onMouseEnter={e => {
                                    if (activeTab !== 'artifacts') {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (activeTab !== 'artifacts') {
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <GiScrollUnfurled className="inline mr-1.5" size={12} />Artifacts
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Body with Tabs */}
                <div className="flex-1 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#d97706 #1e293b'}}>
                    {activeTab === 'overview' && (
                        <div className="grid lg:grid-cols-3 gap-6 p-6">
                            {/* Left Column - Archaeological Site Info */}
                            <div className="space-y-6">
                                {/* Site Card */}
                                <div className="rounded-xl p-5 border backdrop-blur-sm" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                        <FaLandmark className="text-amber-600 dark:text-amber-400" /> Archaeological Site
                                    </h3>
                                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
                                        The remains of what was once a {ruinType.toLowerCase()}. Built from {ruinMaterial}, its {' '}
                                        {ruinStyle} architecture speaks of a lost civilization. Weather and time have taken their
                                        toll on these ancient stones.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg px-3 py-2 border" style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-subtle)' }}>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Era</p>
                                            <p className="text-sm font-bold text-amber-700 dark:text-amber-200">{originalEra}</p>
                                        </div>
                                        <div className="rounded-lg px-3 py-2 border" style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-subtle)' }}>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Age</p>
                                            <p className="text-sm font-bold text-amber-700 dark:text-amber-200">{age}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Middle Column - Historical Context */}
                            <div className="space-y-6">
                                <div className="rounded-xl p-5 border backdrop-blur-sm" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                        <FaHistory className="text-amber-600 dark:text-amber-400" /> Historical Context
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 italic">
                                        This {ruinType.toLowerCase()} dates back to the {originalEra}, built when this region was {seededRandom(0, 100) > 50 ? 'a thriving center of trade' : 'a sacred ceremonial site'}.
                                        The {ruinStyle} style was characteristic of {seededRandom(0, 100) > 50 ? 'this culture\'s golden age' : 'a period of great artistic achievement'}.
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-slate-300 dark:border-slate-700/50">
                                            <span className="text-amber-600 dark:text-amber-400/80">Original Purpose</span>
                                            <span className="text-amber-800 dark:text-amber-100">{seededRandom(0, 100) > 50 ? 'Religious' : 'Administrative'}</span>
                                        </div>

                                        <div className="flex justify-between py-2">
                                            <span className="text-amber-600 dark:text-amber-400/80">Abandoned</span>
                                            <span className="text-amber-800 dark:text-amber-100">{seededRandom(200, 800)} years ago</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column - Exploration Progress */}
                            <div className="space-y-6">
                                

                                {/* Action Buttons */}
                                <div className="rounded-xl p-5 border backdrop-blur-sm" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                        <FaCompass className="text-amber-600 dark:text-amber-400" /> Available Actions
                                    </h3>
                                    <div className="space-y-3">
                                        <button
                                            className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all shadow-lg hover:shadow-amber-500/25 font-bold flex items-center justify-center gap-2"
                                            onClick={handleEnterRuins}
                                        >
                                            <FaDungeon /> Enter the Ruins
                                        </button>
                                        <button
                                            className="w-full px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 text-slate-200 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                                            onClick={handleSearchPerimeter}
                                        >
                                            <FaMap /> Search Perimeter
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                    
                    {/* Exploration Tab */}
                    {activeTab === 'exploration' && (
                        <div className="grid lg:grid-cols-2 gap-6 p-6">
                            <div className="space-y-6">
                                {/* Discovered Chambers */}
                                <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                        <GiTreasureMap className="text-amber-600 dark:text-amber-400" /> Discovered Chambers
                                    </h3>
                                    {ruinProgress.chambersDiscovered.length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {ruinProgress.chambersDiscovered.map((chamber, idx) => (
                                                <div key={chamber.id} className="flex items-center justify-between p-3 bg-slate-200 dark:bg-slate-900/50 rounded-lg border border-amber-700/30">
                                                    <div>
                                                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{chamber.name}</span>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">Depth {chamber.depth}</p>
                                                    </div>
                                                    <span className="text-xs text-green-600 dark:text-green-400">✓ Explored</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">No chambers discovered yet. Enter the ruins to begin exploration.</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-red-100/50 dark:bg-gradient-to-br dark:from-red-900/20 dark:to-red-950/30 rounded-xl p-5 border border-red-600/30 dark:border-red-700/20">
                                    <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                                        <FaExclamationTriangle className="text-red-600 dark:text-red-400" /> Unexplored Areas
                                    </h3>
                                    <div className="space-y-3">
                                        {['Inner Sanctum', 'Crypt', 'Treasury', 'Eastern Wing'].map((area, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-slate-900/50 rounded-lg border border-red-600/30 dark:border-red-700/30">
                                                <span className="text-sm text-red-800 dark:text-red-200">{area}</span>
                                                <span className="text-xs text-red-600 dark:text-red-400">⚠ Dangerous</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Artifacts Tab */}
                    {activeTab === 'artifacts' && (
                        <div className="space-y-6 p-6">
                            {/* Research Potential - Moved from overview */}
                            <div className="bg-green-100/50 dark:bg-gradient-to-br dark:from-green-900/20 dark:to-green-950/30 rounded-xl p-5 border border-green-600/30 dark:border-green-700/20 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                                    <FaBookOpen className="text-green-600 dark:text-green-400" /> Research Potential
                                </h3>
                                <p className="text-sm text-green-800 dark:text-green-100/80 mb-4">
                                    Historical and Archaeological Significance:
                                </p>
                                <div className="space-y-2">
                                    {getHistoricalFinds().map((find, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            {find.icon}
                                            <span className="text-sm text-green-800 dark:text-green-200">{find.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Discoverable Primary Sources */}
                            {discoverableSources.length > 0 && (
                                <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                        <FaScroll className="text-amber-600 dark:text-amber-400" /> Historical Texts
                                    </h3>
                                    <p className="text-sm text-amber-800 dark:text-amber-100/80 mb-4">
                                        Analysis suggests up to {Math.min(3, discoverableSources.length)} readable texts may be preserved here:
                                    </p>
                                    <div className="space-y-3">
                                        {discoverableSources.slice(0, 3).map((source, idx) => (
                                            <div key={source.id} className="bg-slate-200 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-400 dark:border-slate-700/50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">{source.title}</h4>
                                                    <span className="text-xs text-amber-600 dark:text-amber-400/60">{source.year} CE</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">by {source.author}</p>
                                                <p className="text-xs text-amber-700 dark:text-amber-100/60 italic">
                                                    {discoveredSources.includes(source)
                                                        ? '✓ Recovered'
                                                        : 'Not yet found'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Discovered Artifacts Section */}
                            <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                    <GiScrollUnfurled className="text-amber-600 dark:text-amber-400" /> Discovered Items
                                </h3>
                                {ruinProgress.artifactsFound.length > 0 ? (
                                    <div className="space-y-2">
                                        {ruinProgress.artifactsFound.map((artifactId, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-200 dark:bg-slate-900/50 rounded-lg border border-amber-600/30 dark:border-amber-700/30">
                                                <div className="w-8 h-8 rounded bg-amber-200 dark:bg-amber-600/20 flex items-center justify-center">
                                                    <GiScrollUnfurled className="text-amber-700 dark:text-amber-400" size={16} />
                                                </div>
                                                <span className="text-sm text-amber-800 dark:text-amber-200">{artifactId}</span>
                                                <span className="text-xs text-green-600 dark:text-green-400 ml-auto">✓ Found</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-amber-800 dark:text-amber-100/60 italic">
                                        No items have been discovered yet. Begin exploration to uncover historical artifacts.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default RuinStructureModal;