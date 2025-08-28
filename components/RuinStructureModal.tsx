/**
 * components/RuinStructureModal.tsx - Beautiful ruins exploration modal
 */
import React, { useMemo, useState, useEffect } from 'react';
import { TerrainStructure, MapData, Tile, BiomeType, Season, TimeOfDay, NpcEntity, ClimateType, PlayerCharacter } from '../types';
import RuinBanner from './RuinBanner';
import RoguelikeDisplayEnhanced from './RoguelikeDisplayEnhanced';
import { ruinSourcesService, PrimarySource } from '../services/ruinSourcesService';
import { ruinProgressService } from '../services/ruinProgressService';
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
    onRoguelikeModeChange
}) => {
    const { name, location, state, customData } = structure;
    const [activeTab, setActiveTab] = useState<'overview' | 'exploration' | 'artifacts'>('overview');
    const [discoverableSources, setDiscoverableSources] = useState<PrimarySource[]>([]);
    const [discoveredSources, setDiscoveredSources] = useState<PrimarySource[]>([]);
    const [inRoguelike, setInRoguelike] = useState(false);
    
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
    
    // Load discoverable primary sources when component mounts
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

    // Create ruin type for roguelike
    const ruinTypeForRoguelike = {
        name: ruinType,
        description: `The remains of what was once a ${ruinType.toLowerCase()}. Built from ${ruinMaterial}, its ${ruinStyle} architecture speaks of a lost civilization.`,
        age: state === 'ancient' ? 'Over 1000 years old' : 'Centuries old',
        dangers: hazards
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
            />
        );
    }

    return (
        <div className="fixed inset-0 z-5000 bg-gradient-to-br from-slate-900/90 via-amber-950/80 to-slate-900/90 backdrop-blur-sm flex items-center justify-center px-0">
            <div className="relative w-full h-[80vh] max-w-9xl mx-auto top-6 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-900 shadow-2xl border border-amber-800/30 rounded-xl overflow-hidden">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-10 right-4 z-50 text-slate-400 hover:text-white transition-colors"
                    style={{ fontSize: '10px', lineHeight: '1' }}
                >
                    ×
                </button>
                
                {/* Enhanced Banner Header - Full width, no rounded corners */}
                <header className="relative h-[410px] flex-shrink-0 overflow-hidden border-b-4 border-amber-700/50">
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
                        height={410}
                    />
                    {/* Much lighter overlay - clear in center, light gradient only at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-br  from-amber-900/20 via-transparent to-amber-800/30"></div>

                    
                    {/* Header Content - Clear background */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        {/* Title Section */}
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-600/40 to-amber-700/20 backdrop-blur-sm border-2 border-amber-500/50 shadow-lg">
                                    {getRuinIcon(ruinType, ruinStyle)}
                                </div>
                                <div>
                                    <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-1" style={{ textShadow: '1px 1px 3px #000' }}>
                                        {originalEra} • {age}
                                    </p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent" 
                                        style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
                                        {name}
                                    </h2>
                                    <p className="text-lg capitalize text-amber-100/90 mt-2 flex items-center gap-2" style={{ textShadow: '1px 1px 2px #000' }}>
                                        <GiAncientRuins className="text-amber-400" />
                                        {ruinType} • {mapData.mapAreaName || currentLocation || 'Unknown Region'}
                                    </p>
                                </div>
                            </div>
                            
                            
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 bg-slate-900/60 backdrop-blur-sm rounded-lg p-1 px-4 border border-amber-700/30">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 px-4 py-2 rounded-md font-bold transition-all ${
                                    activeTab === 'overview' 
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' 
                                        : 'text-amber-400/70 hover:text-amber-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <FaLandmark className="inline mr-2" />Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('exploration')}
                                className={`flex-1 px-4 py-2 rounded-md font-bold transition-all ${
                                    activeTab === 'exploration' 
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' 
                                        : 'text-amber-400/70 hover:text-amber-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <FaMap className="inline mr-2" />Exploration
                            </button>
                            <button
                                onClick={() => setActiveTab('artifacts')}
                                className={`flex-1 px-4 py-2 rounded-md font-bold transition-all ${
                                    activeTab === 'artifacts' 
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' 
                                        : 'text-amber-400/70 hover:text-amber-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <GiScrollUnfurled className="inline mr-2" />Artifacts
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
                                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-5 border border-amber-700/20 backdrop-blur-sm">
                                    <h3 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                        <FaLandmark className="text-amber-400" /> Archaeological Site
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                        The remains of what was once a {ruinType.toLowerCase()}. Built from {ruinMaterial}, its {' '}
                                        {ruinStyle} architecture speaks of a lost civilization. Weather and time have taken their 
                                        toll on these ancient stones.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/50">
                                            <p className="text-xs text-amber-400/70">Era</p>
                                            <p className="text-sm font-bold text-amber-200">{originalEra}</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/50">
                                            <p className="text-xs text-amber-400/70">Age</p>
                                            <p className="text-sm font-bold text-amber-200">{age}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Middle Column - Historical Context */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-5 border border-amber-700/20 backdrop-blur-sm">
                                    <h3 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                                        <FaHistory className="text-amber-400" /> Historical Context
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">
                                        This {ruinType.toLowerCase()} dates back to the {originalEra}, built when this region was {seededRandom(0, 100) > 50 ? 'a thriving center of trade' : 'a sacred ceremonial site'}. 
                                        The {ruinStyle} style was characteristic of {seededRandom(0, 100) > 50 ? 'this culture\'s golden age' : 'a period of great artistic achievement'}.
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-slate-700/50">
                                            <span className="text-amber-400/80">Original Purpose</span>
                                            <span className="text-amber-100">{seededRandom(0, 100) > 50 ? 'Religious' : 'Administrative'}</span>
                                        </div>
                                      
                                        <div className="flex justify-between py-2">
                                            <span className="text-amber-400/80">Abandoned</span>
                                            <span className="text-amber-100">{seededRandom(200, 800)} years ago</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column - Exploration Progress */}
                            <div className="space-y-6">
                                

                                {/* Action Buttons */}
                                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-5 border border-amber-700/20 backdrop-blur-sm">
                                    <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                                        <FaCompass className="text-amber-400" /> Available Actions
                                    </h3>
                                    <div className="space-y-3">
                                        <button
                                            className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all shadow-lg hover:shadow-amber-500/25 font-bold flex items-center justify-center gap-2"
                                            onClick={() => {
                                                setInRoguelike(true);
                                                onRoguelikeModeChange?.(true);
                                            }}
                                        >
                                            <FaDungeon /> Enter the Ruins
                                        </button>
                                        <button
                                            className="w-full px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 text-slate-200 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                                            onClick={() => console.log('Search perimeter')}
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
                                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-5 border border-amber-700/20">
                                    <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                                        <GiTreasureMap className="text-amber-400" /> Discovered Chambers
                                    </h3>
                                    {ruinProgress.chambersDiscovered.length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {ruinProgress.chambersDiscovered.map((chamber, idx) => (
                                                <div key={chamber.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-amber-700/30">
                                                    <div>
                                                        <span className="text-sm font-medium text-amber-200">{chamber.name}</span>
                                                        <p className="text-xs text-slate-400">Depth {chamber.depth}</p>
                                                    </div>
                                                    <span className="text-xs text-green-400">✓ Explored</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No chambers discovered yet. Enter the ruins to begin exploration.</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-red-900/20 to-red-950/30 rounded-xl p-5 border border-red-700/20">
                                    <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
                                        <FaExclamationTriangle className="text-red-400" /> Unexplored Areas
                                    </h3>
                                    <div className="space-y-3">
                                        {['Inner Sanctum', 'Crypt', 'Treasury', 'Eastern Wing'].map((area, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-red-700/30">
                                                <span className="text-sm text-red-200">{area}</span>
                                                <span className="text-xs text-red-400">⚠ Dangerous</span>
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
                            <div className="bg-gradient-to-br from-green-900/20 to-green-950/30 rounded-xl p-5 border border-green-700/20 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
                                    <FaBookOpen className="text-green-400" /> Research Potential
                                </h3>
                                <p className="text-sm text-green-100/80 mb-4">
                                    Historical and Archaeological Significance:
                                </p>
                                <div className="space-y-2">
                                    {getHistoricalFinds().map((find, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            {find.icon}
                                            <span className="text-sm text-green-200">{find.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Discoverable Primary Sources */}
                            {discoverableSources.length > 0 && (
                                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-5 border border-amber-700/20">
                                    <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                                        <FaScroll className="text-amber-400" /> Historical Texts
                                    </h3>
                                    <p className="text-sm text-amber-100/80 mb-4">
                                        Analysis suggests up to {Math.min(3, discoverableSources.length)} readable texts may be preserved here:
                                    </p>
                                    <div className="space-y-3">
                                        {discoverableSources.slice(0, 3).map((source, idx) => (
                                            <div key={source.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-sm font-semibold text-amber-200">{source.title}</h4>
                                                    <span className="text-xs text-amber-400/60">{source.year} CE</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mb-1">by {source.author}</p>
                                                <p className="text-xs text-amber-100/60 italic">
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
                            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-5 border border-amber-700/20">
                                <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                                    <GiScrollUnfurled className="text-amber-400" /> Discovered Items
                                </h3>
                                {ruinProgress.artifactsFound.length > 0 ? (
                                    <div className="space-y-2">
                                        {ruinProgress.artifactsFound.map((artifactId, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-amber-700/30">
                                                <div className="w-8 h-8 rounded bg-amber-600/20 flex items-center justify-center">
                                                    <GiScrollUnfurled className="text-amber-400" size={16} />
                                                </div>
                                                <span className="text-sm text-amber-200">{artifactId}</span>
                                                <span className="text-xs text-green-400 ml-auto">✓ Found</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-amber-100/60 italic">
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