/**
 * components/TerrainStructureModal.tsx - Enhanced modal for terrain structures with larger banner display
 */
import React, { useMemo, useState, useCallback } from 'react';
import { TerrainStructure, MapData, Tile, BiomeType, Season, TimeOfDay, NpcEntity, HistoricalEra, ClimateType } from '../types';
import { calculatePrices } from '../services/economyService';
import { STRUCTURE_BLUEPRINTS } from '../constants/index';
import { getPrimaryIndustry, getRegionalIndustries, IndustryData } from '../constants/gameData/economicSectors';
import TerrainStructureBanner from './TerrainStructureBanner';
// GovernmentDistrictModal is now handled directly in MapViewport
import { getFactionData } from '../constants/gameData/factionIcons';
import FactionsModal from './FactionsModal';
import RuinStructureModal from './RuinStructureModal';
import FishingHutModal from './FishingHutModal';
import { CulturalZone } from '../types/characterData';

// Helper to find the nearest urban center to a given point.
const findNearestUrbanSettlement = (startPoint: [number, number], tiles: Tile[][]): { tile: Tile, distance: number } | null => {
    const urbanBiomes = new Set([BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET, BiomeType.CITY_CENTER]);
    let closest: { tile: Tile, distance: number } | null = null;
    let minDistance = Infinity;

    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            const tile = tiles[y][x];
            if (urbanBiomes.has(tile.biome)) {
                const distance = Math.hypot(startPoint[0] - x, startPoint[1] - y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = { tile, distance };
                }
            }
        }
    }
    return closest;
};

// Helper to get NPCs at this structure
const getNPCsAtStructure = (structure: TerrainStructure, npcs: NpcEntity[]): NpcEntity[] => {
    return npcs.filter(npc => 
        Math.abs(npc.x - structure.location[0]) <= 2 && 
        Math.abs(npc.y - structure.location[1]) <= 2
    );
};

// Helper to get structure statistics
const getStructureStats = (structure: TerrainStructure, mapData: MapData): any => {
    const stats: any = {};
    
    // Get biome at location
    const tileY = Math.min(structure.location[1], mapData.tiles.length - 1);
    const tileX = Math.min(structure.location[0], mapData.tiles[0]?.length - 1 || 0);
    const tile = mapData.tiles[tileY]?.[tileX];
    if (tile) {
        stats.biome = tile.biome;
        stats.elevation = tile.elevation;
    }
    
    // Calculate distance to nearest city
    const nearestCity = findNearestUrbanSettlement(structure.location, mapData.tiles);
    if (nearestCity) {
        stats.distanceToCity = Math.round(nearestCity.distance);
    }
    
    return stats;
};

interface TerrainStructureModalProps {
  structure: TerrainStructure;
  mapData: MapData;
  npcs: NpcEntity[];
  onClose: () => void;
  gameTimeHours: number;
  season: Season;
  playerCharacter?: any;
  currentLocation?: string;
  formattedDate?: string;
  onEnterSpecialMap?: (config: any) => void;
  onCharacterUpdate?: (character: any) => void;
}

const TerrainStructureModal: React.FC<TerrainStructureModalProps> = ({
    structure,
    mapData,
    npcs,
    onClose,
    gameTimeHours,
    season,
    playerCharacter,
    currentLocation,
    formattedDate,
    onEnterSpecialMap,
    onCharacterUpdate 
}) => {
    // State for factions modal
    const [showFactionsModal, setShowFactionsModal] = useState(false);
    // State for fishing modal
    const [showFishingModal, setShowFishingModal] = useState(false);

    // Callbacks to avoid inline functions
    const handleShowFactionsModal = useCallback(() => {
        setShowFactionsModal(true);
    }, []);

    const handleShowFishingModal = useCallback(() => {
        setShowFishingModal(true);
    }, []);

    // Parse era from formatted date
    const getEraFromDate = (dateInput?: any): string => {
        if (!dateInput) return '1500';
        
        if (typeof dateInput === 'object' && dateInput.year) {
            return dateInput.year.toString();
        }
        
        if (typeof dateInput === 'string') {
            const yearMatch = dateInput.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
            if (yearMatch) {
                let year = parseInt(yearMatch[1]);
                if (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE') {
                    year = -year;
                }
                return year.toString();
            }
        }
        
        return '1500';
    };
    
    // Government districts are now handled directly in MapViewport with activeGovernmentModal
    // They should not reach this component anymore
    if (structure.structureType === 'government_district') {
        console.warn('[TerrainStructureModal] Government district reached modal hub - should be handled by MapViewport');
        onClose();
        return null;
    }
    
    // Special handling for ruins
    if (structure.structureType === 'ruin') {
        return (
            <RuinStructureModal
                structure={structure}
                mapData={mapData}
                npcs={npcs}
                onClose={onClose}
                gameTimeHours={gameTimeHours}
                season={season}
                playerCharacter={playerCharacter}
                currentLocation={currentLocation}
                formattedDate={formattedDate}
            />
        );
    }

    const { name, structureType, location, state, economicRole, npcAnchor, allegianceGroup, inputGoods, outputGoods, mineralDeposits, treasury, constructionYear, cropType } = structure;
    const blueprint = STRUCTURE_BLUEPRINTS[structureType];
    
    const timeOfDay: TimeOfDay = useMemo(() => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);

    const stats = getStructureStats(structure, mapData);
    const localNPCs = getNPCsAtStructure(structure, npcs);
    const era = getEraFromDate(formattedDate);
    const year = parseInt(era);
    
    // Use structure location as seed for consistent random values
    const structureSeed = structure.location[0] * 1000 + structure.location[1];
    const seededRandom = (min: number, max: number) => {
        const x = Math.sin(structureSeed) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min) + min);
    };

    // Get state color
    const stateColor = state === 'active' ? 'text-green-400' : state === 'ruined' ? 'text-red-400' : 'text-yellow-400';

    // Get structure-specific details
    const getStructureSpecificData = () => {
        switch (structureType) {
            case 'fortress':
                return {
                    title: 'Military Stronghold',
                    icon: '🏰',
                    details: [
                        { label: 'Garrison Size', value: `${15 + seededRandom(0, 35)} soldiers` },
                        { label: 'Defense Rating', value: state === 'active' ? 'High' : 'Compromised' },
                        { label: 'Strategic Value', value: stats.distanceToCity < 10 ? 'Critical' : 'Moderate' },
                        { label: 'Fortification Type', value: year < 1500 ? 'Medieval Keep' : year < 1700 ? 'Star Fort' : 'Modern Base' }
                    ]
                };
            
            case 'mining_colony':
                const oreType = mineralDeposits ? Object.keys(mineralDeposits)[0] : 'Unknown';
                const reserves = mineralDeposits ? mineralDeposits[oreType] : 0;
                if (state === 'ruined') {
                    return {
                        title: 'Abandoned Mine',
                        icon: '⛏️',
                        details: [
                            { label: 'Primary Resource', value: oreType },
                            { label: 'Status', value: 'Collapsed/Abandoned' },
                            { label: 'Mining Depth', value: `${50 + seededRandom(0, 450)}m` },
                            { label: 'Workers', value: 'None' },
                            { label: 'Abandoned Since', value: constructionYear ? `Year ${constructionYear + 30}` : 'Unknown' },
                            { label: 'Hazard Level', value: 'Dangerous - Do Not Enter' }
                        ]
                    };
                }
                return {
                    title: 'Mining Operation',
                    icon: '⛏️',
                    details: [
                        { label: 'Primary Resource', value: oreType },
                        { label: 'Estimated Reserves', value: `${(reserves / 1000).toFixed(1)}k units` },
                        { label: 'Mining Depth', value: `${50 + seededRandom(0, 450)}m` },
                        { label: 'Workers', value: `${localNPCs.length} miners` },
                        { label: 'Daily Output', value: state === 'active' ? '50-100 units' : 'Inactive' }
                    ]
                };
            
            case 'lumber_camp':
                return {
                    title: 'Forestry Operation',
                    icon: '🪵',
                    details: [
                        { label: 'Forest Type', value: stats.biome === BiomeType.RAINFOREST ? 'Tropical Hardwood' : 'Temperate Forest' },
                        { label: 'Timber Quality', value: 'Grade A' },
                        { label: 'Workers', value: `${5 + seededRandom(0, 15)} lumberjacks` },
                        { label: 'Equipment', value: year < 1800 ? 'Hand Tools' : 'Steam Powered' },
                        { label: 'Production', value: state === 'active' ? '20-40 logs/day' : 'Halted' }
                    ]
                };
            
            case 'quarry':
                const stoneType = mineralDeposits ? Object.keys(mineralDeposits)[0] : 'Limestone';
                if (state === 'ruined') {
                    return {
                        title: 'Abandoned Stone Quarry',
                        icon: '🪨',
                        details: [
                            { label: 'Stone Type', value: stoneType },
                            { label: 'Status', value: 'Abandoned' },
                            { label: 'Quarry Depth', value: `${10 + seededRandom(0, 30)}m` },
                            { label: 'Workers', value: 'None' },
                            { label: 'Ruined Since', value: constructionYear ? `Year ${constructionYear + 50}` : 'Unknown' },
                            { label: 'Salvageable Materials', value: 'Some stone blocks remain' }
                        ]
                    };
                }
                return {
                    title: 'Stone Quarry',
                    icon: '🪨',
                    details: [
                        { label: 'Stone Type', value: stoneType },
                        { label: 'Quality', value: 'Construction Grade' },
                        { label: 'Quarry Depth', value: `${10 + seededRandom(0, 30)}m` },
                        { label: 'Workers', value: `${localNPCs.length} stonecutters` },
                        { label: 'Extraction Method', value: year < 1850 ? 'Manual Cutting' : 'Explosive Blasting' }
                    ]
                };
            
            case 'fishing_hut':
                return {
                    title: 'Fishing Village',
                    icon: '🎣',
                    details: [
                        { label: 'Fleet Size', value: `${2 + seededRandom(0, 8)} boats` },
                        { label: 'Daily Catch', value: state === 'active' ? '50-200 fish' : 'No activity' },
                        { label: 'Fishing Method', value: year < 1900 ? 'Net & Line' : 'Trawling' },
                        { label: 'Season', value: season === 'winter' ? 'Off-season' : 'Peak season' },
                        { label: 'Workers', value: `${localNPCs.length} fishermen` }
                    ]
                };
            
            case 'farm':
                return {
                    title: 'Agricultural Estate',
                    icon: '🌾',
                    details: [
                        { label: 'Primary Crop', value: cropType || 'Mixed Crops' },
                        { label: 'Farm Size', value: `${10 + seededRandom(0, 90)} hectares` },
                        { label: 'Harvest Season', value: season === 'fall' ? 'Active' : season === 'winter' ? 'Dormant' : 'Growing' },
                        { label: 'Workers', value: `${localNPCs.length} farmers` },
                        { label: 'Technology', value: year < 1700 ? 'Manual Labor' : year < 1900 ? 'Animal Power' : 'Mechanized' }
                    ]
                };
            
            case 'marketplace':
                return {
                    title: 'Trading Hub',
                    icon: '🏪',
                    details: [
                        { label: 'Market Size', value: stats.distanceToCity < 5 ? 'Major' : 'Local' },
                        { label: 'Vendor Stalls', value: `${5 + seededRandom(0, 25)}` },
                        { label: 'Trading Volume', value: state === 'active' ? 'High' : 'Low' },
                        { label: 'Specialty', value: 'General Goods' },
                        { label: 'Market Day', value: timeOfDay === 'Morning' || timeOfDay === 'Midday' ? 'Open' : 'Closing Soon' }
                    ]
                };
            
            case 'factory':
                // Use seeded random to get consistent industry type
                const industries = getRegionalIndustries(mapData.era || HistoricalEra.MODERN_ERA, mapData.mapAreaName || 'Unknown');
                const industryIndex = industries.length > 0 ? seededRandom(0, industries.length - 1) : 0;
                const industry = industries[industryIndex] || null;
                return {
                    title: industry?.name || 'Manufacturing Plant',
                    icon: '🏭',
                    details: [
                        { label: 'Industry Type', value: industry?.name || 'General Manufacturing' },
                        { label: 'Production', value: industry?.products?.join(', ') || 'Various Goods' },
                        { label: 'Workers', value: `${50 + seededRandom(0, 450)} employees` },
                        { label: 'Shift', value: timeOfDay === 'Night' ? 'Night Shift' : 'Day Shift' },
                        { label: 'Output', value: state === 'active' ? 'Full Capacity' : 'Reduced' }
                    ]
                };
            
            case 'palace':
                return {
                    title: 'Royal Palace',
                    icon: '👑',
                    details: [
                        { label: 'Ruling House', value: allegianceGroup || 'Unknown Dynasty' },
                        { label: 'Court Size', value: `${20 + seededRandom(0, 80)} nobles` },
                        { label: 'Treasury', value: treasury ? `${Object.values(treasury).reduce((a, b) => a + b, 0)} gold` : 'Unknown' },
                        { label: 'Influence', value: 'Regional Power' },
                        { label: 'Built', value: constructionYear ? `Year ${constructionYear}` : 'Ancient' }
                    ]
                };
            
            case 'holy_site':
                return {
                    title: 'Sacred Ground',
                    icon: '⛪',
                    details: [
                        { label: 'Religion', value: 'Local Faith' },
                        { label: 'Pilgrims', value: `${10 + seededRandom(0, 90)}/day` },
                        { label: 'Clergy', value: `${localNPCs.length} priests` },
                        { label: 'Sacred Status', value: state === 'active' ? 'Consecrated' : 'Desecrated' },
                        { label: 'Established', value: constructionYear ? `Year ${constructionYear}` : 'Time Immemorial' }
                    ]
                };
            
            case 'ruin':
                return {
                    title: 'Ancient Ruins',
                    icon: '🏛️',
                    details: [
                        { label: 'Original Purpose', value: 'Unknown' },
                        { label: 'Age', value: 'Centuries Old' },
                        { label: 'Exploration Status', value: 'Partially Explored' },
                        { label: 'Artifacts Found', value: `${seededRandom(0, 20)}` },
                        { label: 'Danger Level', value: 'Moderate' }
                    ]
                };
            
            default:
                return {
                    title: 'Structure',
                    icon: '🏗️',
                    details: [
                        { label: 'Type', value: structureType.replace(/_/g, ' ') },
                        { label: 'Status', value: state },
                        { label: 'Workers', value: `${localNPCs.length}` }
                    ]
                };
        }
    };

    const structureData = getStructureSpecificData();
    
    // Get faction data for the badge
    const factionData = getFactionData(allegianceGroup);
    const FactionIcon = factionData.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl h-[80vh] flex flex-col ff-panel animate-popIn">
                {/* Enhanced Banner Header - Full Height */}
                <header className="relative h-[340px] rounded-t-lg overflow-hidden">
                    <TerrainStructureBanner
                        structure={structure}
                        mapData={mapData}
                        width={1180}
                        height={340}
                        timeOfDay={timeOfDay}
                        season={season}
                        era={era}
                        culturalZone={currentLocation}
                        zoomLevel={1.0}
                        isRuined={state === 'ruined'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex justify-between items-end">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">{structureData.icon}</span>
                            <div>
                                <h2 className="text-3xl font-bold font-lora" style={{ textShadow: '3px 3px 6px #000' }}>
                                    {name}
                                </h2>
                                <p className="text-xl capitalize italic text-amber-300 mt-1" style={{ textShadow: '2px 2px 4px #000' }}>
                                    {state === 'ruined' ? 'Ruined ' : ''}{structureData.title} in {mapData.mapAreaName || currentLocation || 'Unknown Region'} on {stats.biome?.replace(/_/g, ' ').toLowerCase() || 'unknown'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Faction Badge - Clickable */}
                        {allegianceGroup && allegianceGroup !== 'Independent' && (
                            <div 
                                className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border-2 cursor-pointer hover:bg-black/80 transition-all" 
                                style={{ borderColor: factionData.color }}
                                onClick={handleShowFactionsModal}
                                title="Click for more faction information"
                            >
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Allegiance</span>
                                    <h3 className="text-xl font-bold font-cinzel" 
                                        style={{ color: factionData.color, textShadow: '2px 2px 4px #000' }}>
                                        {factionData.name}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-full"
                                     style={{ backgroundColor: `${factionData.color}33` }}>
                                    <FactionIcon size={28} style={{ color: factionData.color }} />
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Body with Better Typography */}
                <div className="p-6 flex-grow overflow-y-auto scrollbar-thin">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Overview */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <span className="text-xl">📍</span> Location Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Coordinates:</span>
                                        <span className="font-mono text-slate-200">({location[0]}, {location[1]})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Biome:</span>
                                        <span className="text-slate-200 capitalize">{stats.biome?.replace(/_/g, ' ') || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Elevation:</span>
                                        <span className="text-slate-200">{stats.elevation || 0}m</span>
                                    </div>
                                    {stats.distanceToCity && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Nearest City:</span>
                                            <span className="text-slate-200">{stats.distanceToCity} tiles</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <span className="text-xl">⚙️</span> Status
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Condition:</span>
                                        <span className={`font-bold capitalize ${stateColor}`}>{state}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Allegiance:</span>
                                        <span className="text-slate-200">{allegianceGroup || 'Independent'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Economic Role:</span>
                                        <span className="text-slate-200 capitalize">{economicRole}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Structure Specific */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <span className="text-xl">📊</span> {structureData.title} Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {structureData.details.map((detail, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-slate-400">{detail.label}:</span>
                                            <span className="text-slate-200 text-right">{detail.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resources if applicable - hide for ruined structures */}
                            {(inputGoods || outputGoods) && state !== 'ruined' && (
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                        <span className="text-xl">📦</span> Trade Goods
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        {inputGoods && (
                                            <div>
                                                <span className="text-slate-400">Imports:</span>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {inputGoods.map((good, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-900/50 rounded text-xs">
                                                            {good}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {outputGoods && (
                                            <div>
                                                <span className="text-slate-400">Exports:</span>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {outputGoods.map((good, i) => (
                                                        <span key={i} className="px-2 py-1 bg-green-900/50 rounded text-xs">
                                                            {good}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - NPCs and Activity */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <span className="text-xl">👥</span> Personnel
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Primary Workers:</span>
                                        <span className="text-slate-200 capitalize">{npcAnchor?.replace(/_/g, ' ')}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">NPCs Present:</span>
                                        <span className="text-slate-200">{localNPCs.length}</span>
                                    </div>
                                    {localNPCs.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-700">
                                            <span className="text-slate-400 text-xs">Workers at location:</span>
                                            <div className="mt-1 max-h-32 overflow-y-auto">
                                                {localNPCs.slice(0, 5).map((npc, i) => (
                                                    <div key={i} className="text-xs text-slate-300 py-1">
                                                        • {npc.name} - {npc.occupation?.replace(/_/g, ' ')}
                                                    </div>
                                                ))}
                                                {localNPCs.length > 5 && (
                                                    <div className="text-xs text-slate-500 italic">
                                                        +{localNPCs.length - 5} more...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                                    <span className="text-xl">🕐</span> Current Activity
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Time of Day:</span>
                                        <span className="text-slate-200">{timeOfDay}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Season:</span>
                                        <span className="text-slate-200 capitalize">{season}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Activity Level:</span>
                                        <span className="text-slate-200">
                                            {state === 'active' && (timeOfDay === 'Morning' || timeOfDay === 'Midday' || timeOfDay === 'Afternoon') 
                                                ? 'Busy' 
                                                : state === 'active' && timeOfDay === 'Night' 
                                                ? 'Minimal' 
                                                : 'None'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto p-4 border-t border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <div className="text-xs text-slate-500">
                        {formattedDate && <span>Year {era} • {currentLocation}</span>}
                    </div>
                    <div className="flex gap-2">
                        {structureType === 'fishing_hut' && (
                            <button 
                                onClick={handleShowFishingModal} 
                                className="ff-action-button px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700"
                            >
                                🎣 Enter Fishing Hut
                            </button>
                        )}
                        <button onClick={onClose} className="ff-action-button px-6 py-2 text-sm">
                            Close
                        </button>
                    </div>
                </footer>
            </div>
            
            {/* Factions Modal */}
            {showFactionsModal && (
                <FactionsModal
                    onClose={() => setShowFactionsModal(false)}
                    currentZone={mapData?.localArea}
                    currentRegion={mapData?.region}
                    dominantPower={allegianceGroup}
                    allegianceGroups={[]} // Could be expanded to include other local powers
                />
            )}
            
            {/* Fishing Hut Modal */}
            {showFishingModal && (() => {
                const inventoryUpdateCallback = (newItem: any) => {
                    console.log('🎣 TerrainStructureModal: onInventoryUpdate called with:', newItem);
                    console.log('🎣 playerCharacter exists:', !!playerCharacter);
                    console.log('🎣 onCharacterUpdate exists:', !!onCharacterUpdate);
                    // Add item to player inventory and update character
                    if (playerCharacter && onCharacterUpdate) {
                        const updatedInventory = [...(playerCharacter.inventory || []), newItem];
                        console.log('🎣 Current inventory length:', playerCharacter.inventory?.length || 0);
                        console.log('🎣 Updated inventory length:', updatedInventory.length);
                        const updatedCharacter = {
                            ...playerCharacter,
                            inventory: updatedInventory
                        };
                        onCharacterUpdate(updatedCharacter);
                        console.log('🎣 onCharacterUpdate called successfully');
                    }
                };
                console.log('🎣 TerrainStructureModal: Creating FishingHutModal with onInventoryUpdate:', !!inventoryUpdateCallback);
                return (
                    <FishingHutModal
                        isOpen={showFishingModal}
                        onClose={() => setShowFishingModal(false)}
                        structure={structure}
                        culturalZone={mapData?.localArea as CulturalZone || 'EUROPEAN'}
                        historicalEra={
                            year < 500 ? HistoricalEra.ANTIQUITY :
                            year < 1500 ? HistoricalEra.MEDIEVAL :
                            year < 1800 ? HistoricalEra.RENAISSANCE_EARLY_MODERN :
                            year < 1900 ? HistoricalEra.INDUSTRIAL_ERA :
                            HistoricalEra.MODERN_ERA
                        }
                        climate={mapData?.climate || ClimateType.TEMPERATE}
                        biome={stats.biome || BiomeType.PLAINS}
                        season={season}
                        year={year}
                        isCoastal={stats.biome === BiomeType.BEACH || stats.biome === BiomeType.SHALLOW_WATER}
                        isFreshwater={stats.biome === BiomeType.WETLANDS || stats.biome === BiomeType.RAINFOREST}
                        timeOfDay={timeOfDay}
                        playerCharacter={playerCharacter}
                        onCharacterUpdate={onCharacterUpdate}
                        onInventoryUpdate={inventoryUpdateCallback}
                    />
                );
            })()}
        </div>
    );
};

export default TerrainStructureModal;