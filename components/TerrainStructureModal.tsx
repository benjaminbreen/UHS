/**
 * components/TerrainStructureModal.tsx - A detailed modal for terrain structures.
 */
import React, { useMemo } from 'react';
import { TerrainStructure, MapData, Tile, BiomeType, Season, TimeOfDay, NpcEntity, HistoricalEra } from '../types';
import { calculatePrices } from '../services/economyService';
import { STRUCTURE_BLUEPRINTS } from '../constants/index';
import { getPrimaryIndustry, IndustryData } from '../constants/gameData/economicSectors';
import TerrainStructureBanner from './TerrainStructureBanner';
import GovernmentDistrictModal from './GovernmentDistrictModal';
import FarmModal from './FarmModal';


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
}

const TerrainStructureModal: React.FC<TerrainStructureModalProps> = ({ structure, mapData, npcs, onClose, gameTimeHours, season, playerCharacter, currentLocation, formattedDate }) => {
    
    // Special handling for farms
    if (structure.structureType === 'farm') {
        return (
            <FarmModal
                structure={structure}
                mapData={mapData}
                npcs={npcs}
                onClose={onClose}
                gameTimeHours={gameTimeHours}
                season={season}
            />
        );
    }
    
    // Special handling for government districts
    if (structure.structureType === 'government_district' && playerCharacter && currentLocation && formattedDate) {
        const tileAtLocation = mapData.tiles?.find(t => t.x === structure.location[0] && t.y === structure.location[1]);
        return (
            <GovernmentDistrictModal
                structure={structure}
                tile={tileAtLocation || { x: structure.location[0], y: structure.location[1], elevation: 0 }}
                playerCharacter={playerCharacter}
                mapData={mapData}
                currentLocation={currentLocation}
                formattedDate={formattedDate}
                onClose={onClose}
            />
        );
    }

    const { name, structureType, location, state, economicRole, npcAnchor, allegianceGroup, inputGoods, outputGoods, mineralDeposits } = structure;
    const blueprint = STRUCTURE_BLUEPRINTS[structureType];
    
    const timeOfDay: TimeOfDay = useMemo(() => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);


    const specializationDetails = useMemo(() => {
        switch (structureType) {
            case 'factory':
                // Get region-appropriate industry
                const era = mapData.era || HistoricalEra.MODERN_ERA;
                const region = mapData.mapAreaName || 'Unknown';
                const industry: IndustryData | null = getPrimaryIndustry(era, region);
                
                if (industry) {
                    return (
                        <div>
                            <h4 className="text-base font-semibold text-amber-300 mb-2">{industry.name}</h4>
                            <div className="text-xs space-y-1">
                                <p className="text-slate-300 italic mb-2">{industry.description}</p>
                                {industry.products && (
                                    <p><strong>Products:</strong> {industry.products.join(', ')}</p>
                                )}
                                {industry.requiredResources && (
                                    <p><strong>Resources Needed:</strong> {industry.requiredResources.join(', ')}</p>
                                )}
                                <p><strong>Workers:</strong> {industry.typicalJobs.slice(0, 3).join(', ')}</p>
                                <p><strong>Economic Role:</strong> {economicRole || 'Processing'}</p>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div>
                            <h4 className="text-base font-semibold text-amber-300 mb-2">Factory</h4>
                            <div className="text-xs space-y-1">
                                <p><strong>Type:</strong> General Manufacturing</p>
                                <p><strong>Economic Role:</strong> {economicRole || 'Processing'}</p>
                                <p><strong>Personnel:</strong> Attracts {npcAnchor || 'factory_workers'}</p>
                            </div>
                        </div>
                    );
                }
            case 'mining_colony':
                if (!mineralDeposits) return null;
                const oreType = Object.keys(mineralDeposits)[0] || 'UNKNOWN_ORE';
                const oreItemId = `${oreType}_ORE`;
                const priceInfo = calculatePrices(oreItemId, mapData, npcs);
                const nearestSettlement = findNearestUrbanSettlement(location, mapData.tiles);
                return (
                    <div>
                        <h4 className="text-base font-semibold text-amber-300 mb-2">Mining Operation</h4>
                        <div className="text-xs space-y-1">
                            <p><strong>Resource:</strong> {oreType}</p>
                            <p><strong>Remaining Deposit:</strong> {mineralDeposits[oreType]?.toLocaleString()} units</p>
                            <p><strong>Extraction Rate:</strong> ~15 units/day</p>
                            <p><strong>Market Value (Local):</strong> {priceInfo.sellPrice} 🪙 / unit</p>
                            {nearestSettlement && (
                                 <p><strong>Primary Buyer:</strong> Settlement at ({nearestSettlement.tile.x}, {nearestSettlement.tile.y}) ({nearestSettlement.distance.toFixed(1)} tiles away)</p>
                            )}
                        </div>
                    </div>
                );
            case 'mill':
                 return (
                    <div>
                        <h4 className="text-base font-semibold text-amber-300 mb-2">Processing Details</h4>
                         <div className="text-xs space-y-1">
                            <p><strong>Inputs:</strong> {inputGoods?.join(', ') || 'None'}</p>
                            <p><strong>Outputs:</strong> {outputGoods?.join(', ') || 'None'}</p>
                        </div>
                    </div>
                );
            case 'fortress':
                 const controlledStructures = mapData.terrainStructures?.filter(s => 
                    s.allegianceGroup === allegianceGroup && s.id !== structure.id && Math.hypot(s.location[0] - location[0], s.location[1] - location[1]) < 25
                 ).length || 0;
                 return (
                    <div>
                        <h4 className="text-base font-semibold text-amber-300 mb-2">Military Intel</h4>
                        <div className="text-xs space-y-1">
                            <p><strong>Garrison:</strong> Attracts {npcAnchor} personnel</p>
                            <p><strong>Sphere of Influence:</strong> Controls {controlledStructures} nearby structures.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }, [structure, mapData, location, allegianceGroup, inputGoods, outputGoods, mineralDeposits, npcAnchor, structureType, npcs]);

    const stateColor = state === 'active' ? 'text-green-400' : 'text-red-400';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-primary-lg w-full max-w-xl flex flex-col animate-popIn" onClick={e => e.stopPropagation()}>
               <header className="relative w-full h-[150px] rounded-t-xl overflow-hidden shrink-0">
  <TerrainStructureBanner 
    structure={structure}
    mapData={mapData}
    width={600}
    height={150}
    timeOfDay={timeOfDay}
    season={season}
  />
  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
  <div className="absolute bottom-0 left-0 p-4 text-white">
    <h2 className="text-2xl font-bold" style={{ textShadow: '2px 2px 4px #000' }}>{name}</h2>
    <p className="text-lg capitalize italic text-slate-300" style={{ textShadow: '1px 1px 2px #000' }}>{structureType.replace(/_/g, ' ')}</p>
  </div>
</header>

                <div className="p-5 flex-grow overflow-y-auto scrollbar-thin text-sm">
                     <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                             <div>
                                <h4 className="text-base font-semibold text-amber-300 mb-2">Overview</h4>
                                <div className="text-sm space-y-1">
                                    <p><strong>Location:</strong> ({location[0]}, {location[1]})</p>
                                    <p><strong>State:</strong> <span className={`${stateColor} font-bold capitalize`}>{state}</span></p>
                                    <p><strong>Allegiance:</strong> {allegianceGroup || 'Neutral'}</p>
                                </div>
                            </div>
                             <div>
                                <h4 className="text-base font-semibold text-amber-300 mb-2">Function</h4>
                                 <div className="text-sm space-y-1">
                                    <p><strong>Economic Role:</strong> <span className="capitalize">{economicRole}</span></p>
                                    <p><strong>Personnel:</strong> Attracts <span className="capitalize">{npcAnchor}s</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                           {specializationDetails}
                        </div>
                    </div>
                </div>

                <footer className="mt-4 pt-4 border-t border-blue-500/30 flex justify-end p-4">
                    <button onClick={onClose} className="ff-action-button">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default TerrainStructureModal;