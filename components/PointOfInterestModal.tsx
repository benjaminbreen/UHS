/**
 * components/PointOfInterestModal.tsx - A specialized modal for unique structures.
 */
import React, { useMemo, useCallback } from 'react';
import { TerrainStructure, MapData, HistoricalEra, CulturalZone, NpcEntity, GameDate, SpecialMapConfig } from '../types';
import { SOCIETAL_PROFILES, ITEM_DEFINITIONS, FACTION_DATA } from '../constants/index';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { useMap } from '../contexts/MapContext';
import { generatePoiDescription } from '../services/poiDescriptionGenerator';
import POISymbol from './POISymbol';
import { LazyPortrait } from './portraits';
import HolySiteInteractions from './HolySiteInteractions';
import { getReligiousEconomy, generateHolySiteTreasury, calculateHolySiteWealth } from '../constants/gameData/religiousEconomy';
import { getClergyRoles } from '../constants/characterData/religionClergyRoles';
import { getReligionDisplay, detectReligion } from '../constants/gameData/religionIcons';
import { getHistoricalEra } from '../constants/gameData/historicalContext';

interface PointOfInterestModalProps {
  structure: TerrainStructure;
  mapData: MapData;
  onClose: () => void;
  onEnterSpecialMap?: (config: SpecialMapConfig) => void;
}

const PointOfInterestModal: React.FC<PointOfInterestModalProps> = ({ structure, mapData, onClose, onEnterSpecialMap }) => {
    const { npcs } = useMap();
    const { name, structureType, state, allegianceGroup, inputGoods, outputGoods, treasury } = structure;

    const gameDate = useMemo(() => {
        const year = parseInt(mapData.timeSlice || '1650', 10);
        return { year, month: 1, day: 1 } as GameDate;
    }, [mapData.timeSlice]);

    const description = useMemo(() => {
        return generatePoiDescription(structure, gameDate, mapData);
    }, [structure, gameDate, mapData]);
    
    const { era, culturalZone } = useMemo(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1650');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [mapData.timeSlice, mapData.continent]);
    
    const societalProfile = useMemo(() => {
        return SOCIETAL_PROFILES[culturalZone]?.[era] || SOCIETAL_PROFILES.DEFAULT;
    }, [culturalZone, era]);

    const factionData = useMemo(() => {
        return FACTION_DATA[culturalZone]?.[mapData.region || '']?.[era];
    }, [culturalZone, mapData.region, era]);

    const anchoredNpcs = useMemo(() => {
        const figures = npcs.filter(npc => npc.workplaceId === structure.id);
        
        // For holy sites, sort by clergy role hierarchy
        if (structure.structureType === 'holy_site') {
            const religion = (structure as any).religion || 'default';
            const clergyRoles = getClergyRoles(religion);
            
            figures.sort((a, b) => {
                const indexA = clergyRoles.indexOf(a.role);
                const indexB = clergyRoles.indexOf(b.role);
                // If a role is not in the list, it's considered lower rank
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        } else {
            // For non-holy sites, use faction data court roles
            const roleOrder = factionData?.courtRoles?.[structure.structureType] || [];
            
            if (roleOrder.length > 0) {
                figures.sort((a, b) => {
                    const indexA = roleOrder.indexOf(a.role);
                    const indexB = roleOrder.indexOf(b.role);
                    // If a role is not in the list, it's considered lower rank
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
        }
        
        return figures;
    }, [npcs, structure.id, structure.structureType, factionData]);

    // Get economic goods for holy sites
    const holySiteEconomy = useMemo(() => {
        if (structureType === 'holy_site') {
            const religion = (structure as any).religion || structure.name || 'default';
            return getReligiousEconomy(religion, era);
        }
        return null;
    }, [structureType, structure, era]);

    // Calculate wealth level for holy sites
    const holySiteWealth = useMemo(() => {
        if (structureType === 'holy_site' && mapData) {
            // Calculate urbanization level (rough approximation)
            const urbanizationLevel = 0.3; // This should be calculated from actual map data
            return calculateHolySiteWealth(urbanizationLevel, era, culturalZone);
        }
        return 5;
    }, [structureType, mapData, era, culturalZone]);

    // Generate treasury for holy sites
    const holySiteTreasury = useMemo(() => {
        if (structureType === 'holy_site') {
            const religion = (structure as any).religion || structure.name || 'default';
            return generateHolySiteTreasury(religion, era, holySiteWealth);
        }
        return treasury;
    }, [structureType, structure, era, holySiteWealth, treasury]);

    const consumedGoods = structureType === 'holy_site' ? holySiteEconomy?.consumes : inputGoods;
    const producedGoods = structureType === 'holy_site' ? holySiteEconomy?.produces : outputGoods;

    // Get religion information for holy sites
    const religion = useMemo(() => {
        if (structureType === 'holy_site') {
            // First try to use the religion directly from the structure
            let detectedReligion = (structure as any).religion;
            
            // If not found, try to detect from name and context
            if (!detectedReligion || detectedReligion === 'generic') {
                detectedReligion = detectReligion(structure.name, culturalZone, era);
            }
            
            console.log('[Holy Site Religion]', {
                structureName: structure.name,
                structureReligion: (structure as any).religion,
                detectedReligion,
                culturalZone,
                era
            });
            
            return getReligionDisplay(detectedReligion);
        }
        return null;
    }, [structureType, structure, culturalZone, era]);

    return (
        <div
            data-surface="modal-overlay"
            className="modal-overlay theme-surface"
            onClick={onClose}
        >
            <div
                data-surface="modal-panel"
                className="ff-panel theme-surface w-full max-w-4xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <header className="flex items-center gap-4 mb-4 pb-4 border-b border-blue-500/30">
                        <div className="w-20 h-20 flex-shrink-0">
                            <POISymbol structure={structure} size={80} mapSeed={mapData.seed} />
                        </div>
                        <div className="flex-1 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-press-start mb-2" style={{ color: 'var(--ff-header-text)' }}>{name}</h3>
                                <p className="text-sm text-slate-300 capitalize">{structureType.replace(/_/g, ' ')}</p>
                            </div>
                            {religion && (
                                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${religion.bgColor} border border-slate-600/50`}>
                                    <span style={{ color: religion.color }} className="text-2xl">
                                        {religion.icon}
                                    </span>
                                    <span className="text-base font-bold" style={{ color: religion.color }}>
                                        {religion.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                        <p className="italic text-slate-300 leading-relaxed mb-4">{description}</p>
                        
                        {/* Dual column layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* Basic Info */}
                                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                    <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                        <span className="text-lg">📍</span> Status
                                    </h4>
                                    <DetailRow label="State" value={state} />
                                    {structureType !== 'ruin' && (
                                        <DetailRow label="Allegiance" value={allegianceGroup || 'Unaligned'} />
                                    )}
                                    {structureType === 'ruin' && structure.customData && (
                                        <>
                                            <DetailRow label="Original Era" value={structure.customData.originalEra || 'Unknown'} />
                                            <DetailRow label="Architecture" value={structure.customData.style || 'Unknown'} />
                                        </>
                                    )}
                                    {structureType === 'holy_site' && (
                                        <DetailRow label="Wealth Level" value={`${holySiteWealth}/10`} />
                                    )}
                                </div>
                                
                                {/* Key Figures */}
                                {anchoredNpcs.length > 0 && (
                                    <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                        <h4 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                            <span className="text-lg">👥</span> Key Figures
                                        </h4>
                                        <div className="space-y-3">
                                            {anchoredNpcs.map(npc => (
                                                <div key={npc.id} className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600 shrink-0 bg-slate-700">
                                                        <LazyPortrait character={npc} size={48} type="procedural" staticMode={true} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{npc.name}</p>
                                                        <p className="text-xs text-slate-400">{npc.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* Economic Activity */}
                                {structureType === 'holy_site' && (
                                    <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                        <h4 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
                                            <span className="text-lg">🕊️</span> Offerings & Blessings
                                        </h4>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Consumes:</p>
                                                <p className="text-sm text-white">
                                                    {consumedGoods?.map(g => g.replace(/_/g, ' ')).join(', ') || 'Various offerings'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Produces:</p>
                                                <p className="text-sm text-white">
                                                    {producedGoods?.map(g => g.replace(/_/g, ' ')).join(', ') || 'Spiritual services'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Treasury */}
                                {((structureType === 'holy_site' && holySiteTreasury && Object.keys(holySiteTreasury).length > 0) || 
                                  (structureType !== 'holy_site' && treasury && Object.keys(treasury).length > 0)) && (
                                    <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                        <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                                            <span className="text-lg">💰</span> Treasury
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(structureType === 'holy_site' ? holySiteTreasury : treasury || {})
                                                .slice(0, 6) // Show max 6 items
                                                .map(([itemId, quantity]) => (
                                                <div key={itemId} className="flex justify-between items-center py-1">
                                                    <span className="text-xs text-slate-400">
                                                        {getItemDefinition(itemId)?.name || itemId.replace(/_/g, ' ')}:
                                                    </span>
                                                    <span className="text-sm font-semibold text-white">
                                                        {quantity.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Holy Site Interactions or Generic Actions */}
                        {structure.structureType === 'holy_site' ? (
                            <div className="mt-4">
                                {/* Add Special Map Exploration Button */}
                                {onEnterSpecialMap && (
                                    <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg border border-purple-600/30">
                                        <h4 className="font-semibold text-lg text-purple-300 mb-3 flex items-center gap-2">
                                            <span>🛐</span> Sacred Complex
                                        </h4>
                                        <button 
                                            onClick={() => {
                                                const config: SpecialMapConfig = {
                                                    // archetype: SimplifiedArchetype.SACRED_COMPLEX, (commented out pending wiring this up to newer specialmap system)
                                                    culturalZone: culturalZone,
                                                    era: era,
                                                    region: mapData.region,
                                                    mapSize: 'medium',
                                                    structureId: structure.id,
                                                    structureName: structure.name || 'Sacred Site',
                                                    climate: mapData.climate,
                                                    customData: {
                                                        religion: religion?.name || 'Local Faith',
                                                        deity: religion?.primaryDeity,
                                                        yearBuilt: structure.customData?.yearBuilt || gameDate.year - Math.floor(Math.random() * 500),
                                                        culturalDetails: structure.customData
                                                    }
                                                };
                                                console.log('[PointOfInterestModal] Entering sacred complex with config:', config);
                                                onEnterSpecialMap(config);
                                                onClose();
                                            }}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/25 font-bold flex items-center justify-center gap-2"
                                        >
                                            <span>🚪</span> Explore Sacred Complex
                                        </button>
                                        <p className="text-xs text-purple-200 text-center italic mt-2">
                                            Enter the sacred interior to explore shrines, altars, and holy relics
                                        </p>
                                    </div>
                                )}
                                <HolySiteInteractions 
                                    structure={structure}
                                    religion={religion?.name || 'Local Faith'}
                                    playerCharacter={npcs.find(npc => npc.isPlayerCharacter)}
                                    onServicePurchased={(service) => {
                                        console.log('Service purchased:', service);
                                    }}
                                />
                            </div>
                        ) : structure.structureType === 'ruin' ? (
                            // Ruins have different interactions
                            <div className="pt-4">
                                <h4 className="font-semibold text-lg text-amber-300 mb-3">🏛️ Exploration Options</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                        <p className="text-sm text-slate-300 mb-2">
                                            {structure.customData?.description || 
                                             `These ruins date back approximately ${structure.customData?.age || '500'} years. ` +
                                             `The ${structure.customData?.material || 'stone'} construction suggests ${structure.customData?.originalStructureType || 'ancient'} origins.`}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                                        <p className="text-xs text-yellow-200 flex items-center gap-2">
                                            <span>⚠️</span>
                                            <span>To explore these ruins, move your character to this tile and select "Enter Ruins"</span>
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-slate-500 mt-3 italic">
                                    Age: ~{structure.customData?.age || Math.floor(Math.random() * 800 + 200)} years • 
                                    Material: {structure.customData?.material || 'weathered stone'}
                                </p>
                            </div>
                        ) : structure.structureType === 'palace' ? (
                            // Palace interactions
                            <div className="pt-4">
                                <h4 className="font-semibold text-lg text-purple-300 mb-3">👑 Court Actions</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="ff-action-button">Seek Royal Audience</button>
                                    <button className="ff-action-button">Offer Tribute</button>
                                    <button className="ff-action-button">Request Patronage</button>
                                    <button className="ff-action-button">Court Gossip</button>
                                </div>
                                <p className="text-xs text-center text-slate-500 mt-3 italic">(Influence and reputation affect available options)</p>
                            </div>
                        ) : structure.structureType === 'fortress' ? (
                            // Fortress interactions
                            <div className="pt-4">
                                <h4 className="font-semibold text-lg text-red-300 mb-3">⚔️ Military Actions</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="ff-action-button">Request Garrison Aid</button>
                                    <button className="ff-action-button">Enlist as Mercenary</button>
                                    <button className="ff-action-button">Trade Military Supplies</button>
                                    <button className="ff-action-button">Gather Intelligence</button>
                                </div>
                                <p className="text-xs text-center text-slate-500 mt-3 italic">(Military structures may require proper credentials)</p>
                            </div>
                        ) : (
                            // Generic fallback for other structures
                            <div className="pt-4">
                                <h4 className="font-semibold text-lg text-blue-300 mb-3">Actions</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="ff-action-button">Investigate</button>
                                    <button className="ff-action-button">Trade</button>
                                    <button className="ff-action-button">Gather Information</button>
                                    <button className="ff-action-button">Rest</button>
                                </div>
                                <p className="text-xs text-center text-slate-500 mt-3 italic">(More actions will be available through the quest system.)</p>
                            </div>
                        )}
                    </main>

                    <footer className="mt-6 flex justify-end">
                        <button onClick={onClose} className="ff-action-button">Leave</button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-slate-400">{label}:</span> 
        <span className="font-semibold text-white capitalize text-right">{value}</span>
    </div>
);


export default PointOfInterestModal;
