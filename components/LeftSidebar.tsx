
import React, { useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { AnimalEntity, NpcEntity, isAnimal, isNpc, LensMode, MapArchetype, ClimateType, MapAnalysisData, MapData, GameDate, Season, HistoricalEra, CulturalZone, TerrainStructure } from '../types';
import { generateAnimalDescriptions } from '../services/animalDescriptionGenerator';
import { formatDateWithSeason, parseDateString } from '../utils/dateUtils';
import HistoryPanel from './HistoryPanel';
import JournalPanel from './JournalPanel';
import { MAP_ARCHETYPE_DESCRIPTIONS, FACTION_DATA, STRUCTURE_BLUEPRINTS, METALS } from '../constants/index';
import { mapLocationToCulture } from '../utils/mapUtils';


export type LeftSidebarTab = 'analysis' | 'overview' | 'npcs' | 'animals';
type MajorTab = 'map' | 'history' | 'journal';

const AnimalListItem = React.memo(({ animal, isSelected, onClick, description }: { animal: AnimalEntity; isSelected: boolean; onClick: (animal: AnimalEntity) => void; description: string; }) => {
    return (
        <div onClick={() => onClick(animal)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-gray-300 hover:bg-slate-700/60 hover:shadow-sm ${isSelected ? 'bg-blue-800/70 text-white shadow-md ring-1 ring-blue-400/50' : ''}`}>
            <div className="text-2xl mr-3 flex-shrink-0">{animal.emoji}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{animal.speciesName}</p>
                <div className="text-xs text-gray-400 flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.53-2.475M15 19.128v-3.867m-1.371 3.267c-.24-.02-.48-.052-.728-.082m-4.5-4.243a4.5 4.5 0 118.27 2.135A4.5 4.5 0 0110.5 18c-1.554 0-2.923-.746-3.71-1.867m-1.371-3.267a4.5 4.5 0 015.426-3.318 4.5 4.5 0 011.88 4.041m-5.426-3.318a4.5 4.5 0 00-1.88-2.288M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{description}</span>
                </div>
            </div>
        </div>
    );
});

const NpcListItem = React.memo(({ npc, isSelected, onClick }: { npc: NpcEntity; isSelected: boolean; onClick: (npc: NpcEntity) => void; }) => {
    return (
        <div onClick={() => onClick(npc)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-gray-300 hover:bg-slate-700/60 hover:shadow-sm ${isSelected ? 'bg-blue-800/70 text-white shadow-md ring-1 ring-blue-400/50' : ''}`}>
            <div className="text-2xl mr-3 flex-shrink-0">{npc.emoji}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{npc.name}</p>
                <div className="text-xs text-gray-400 flex items-center mt-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.028.658a.78.78 0 01-.357.901l-1.444.722a.78.78 0 01-1.002-.215zM12 11a5 5 0 015 5v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="truncate">{npc.descriptions.short}</span>
                </div>
            </div>
        </div>
    );
});

const AnalysisListItem: React.FC<{ icon: string, name: string, subtext: string, onClick: () => void }> = ({ icon, name, subtext, onClick }) => (
    <li 
        onClick={onClick}
        className="flex items-center p-2 rounded-md cursor-pointer transition-colors duration-150 hover:bg-slate-700/50"
    >
        <span className="text-xl mr-3">{icon}</span>
        <div>
            <p className="font-medium text-slate-200 text-sm">{name}</p>
            <p className="text-xs text-slate-400">{subtext}</p>
        </div>
    </li>
);


const CollapsibleSection: React.FC<{ title: string, count: number, children: React.ReactNode }> = ({ title, count, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    if (count === 0) return null;

    return (
        <div>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left font-semibold text-blue-300 mb-2 p-2 rounded-md hover:bg-slate-800/40"
            >
                <span className="flex items-center gap-2">
                    {title} <span className="text-xs font-mono bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded-md">{count}</span>
                </span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
            </button>
            {isOpen && <div className="pl-2 border-l-2 border-slate-700/50">{children}</div>}
        </div>
    );
};

const LeftSidebar: React.FC = () => {
    const { 
        activeMapSubTab, setActiveMapSubTab,
        isLeftSidebarExpanded, setIsLeftSidebarExpanded,
        activeLens, setActiveLens,
        setInfoModalTarget, infoModalTarget, useLlmForDescriptions,
        setIsMapDetailsModalOpen, setStructureModalTarget, setActivePoi
    } = useUI();
  
    const { mapData, currentMapArchetype, currentMapClimate, animals, npcs, mapAnalysisData, localArea, terrainStructures, societalProfile } = useMap();
    const { gameDate, season, gameTimeHours, gameTimeMinutes, currentTimeOfDay, gameLog, playerJournal, onAddPlayerJournalEntry, currentZone, currentRegion } = useGame();
  
    const [activeMajorTab, setActiveMajorTab] = useState<MajorTab>('map');
  
    const formattedTime = useMemo(() => `${String(gameTimeHours).padStart(2, '0')}:${String(gameTimeMinutes).padStart(2, '0')}`, [gameTimeHours, gameTimeMinutes]);
    
    const formattedFullDate = useMemo(() => {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const dateObj = new Date(gameDate.year, gameDate.month - 1, gameDate.day);
      return dateObj.toLocaleDateString(undefined, options);
    }, [gameDate]);

    // MOVED: Move all useMemo hooks to top level
    const mineralDeposits = useMemo(() => {
        if (!mapData || !mapData.tiles) return new Map<string, number>();
        const counts = new Map<string, number>();
        
        try {
            mapData.tiles.flat().forEach(tile => {
                if (tile?.mineralDeposit?.metalId) {
                    const metalName = METALS[tile.mineralDeposit.metalId]?.name || tile.mineralDeposit.metalId;
                    counts.set(metalName, (counts.get(metalName) || 0) + 1);
                }
            });
        } catch (error) {
            console.error('Error processing mineral deposits:', error);
            return new Map<string, number>();
        }
        
        return counts;
    }, [mapData]);

    const pointsOfInterest = useMemo(() => {
        if (!terrainStructures || !Array.isArray(terrainStructures)) {
            return [];
        }
        
        try {
            return terrainStructures.filter(s => {
                // More defensive checks
                if (!s || typeof s !== 'object') return false;
                if (typeof s.id !== 'string' || !s.id) return false;
                if (typeof s.name !== 'string' || !s.name) return false;
                if (typeof s.structureType !== 'string' || !s.structureType) return false;
                
                return ['holy_site', 'palace', 'ruin', 'fortress', 'mill'].includes(s.structureType);
            });
        } catch (error) {
            console.error('Error filtering points of interest:', error);
            return [];
        }
    }, [terrainStructures]);

    const societyDescription = useMemo(() => {
        if (!societalProfile || !mapData || !mapAnalysisData) return "Analyzing...";

        // 1. Determine base societal description
        let baseDesc = '';
        if (societalProfile.isAgricultural && societalProfile.isPastoral) {
            baseDesc = "This is a society built on both farming and herding.";
        } else if (societalProfile.isAgricultural) {
            baseDesc = "This appears to be a settled, agricultural society.";
        } else if (societalProfile.isPastoral) {
            baseDesc = "This is a society centered around pastoralism and herding animals.";
        } else {
            if (mapAnalysisData.urbanTileCount === 0) {
                baseDesc = "The people here appear to be nomadic hunter-gatherers.";
            } else {
                baseDesc = "This society seems to rely on non-agricultural means, like fishing or trade.";
            }
        }

        // 2. Add urbanization context
        let urbanDesc = '';
        const urbanRatio = mapAnalysisData.urbanTileCount / (mapData.width * mapData.height);
        if (urbanRatio > 0.1) {
            urbanDesc = 'It features a number of large, dense urban centers.';
        } else if (urbanRatio > 0.05) {
            urbanDesc = 'Several towns serve as local hubs for trade and craft.';
        } else if (urbanRatio > 0.02) {
            urbanDesc = 'Settlements are few and far between, consisting of small towns or large villages.';
        } else if (mapAnalysisData.urbanTileCount > 0) {
            urbanDesc = 'Permanent settlements are limited to small hamlets and villages.';
        } else {
            urbanDesc = 'There are no signs of permanent settlements.';
        }

        // 3. Add mineral resource context
        let mineralDesc = '';
        const mineralCount = mapData.tiles.flat().filter(t => t.mineralDeposit).length;
        if (mineralCount > 15) {
            mineralDesc = 'The land is rich with accessible mineral resources.';
        } else if (mineralCount > 5) {
            mineralDesc = 'Mineral resources appear to be present, but not widespread.';
        } else {
            mineralDesc = 'There are scarce mineral resources in this area.';
        }

        return `${baseDesc} ${urbanDesc} ${mineralDesc}`;
    }, [societalProfile, mapData, mapAnalysisData]);

    const primaryResourceDescription = useMemo(() => {
        if (!societalProfile || !mapData) return "";

        if (societalProfile.isAgricultural) {
            const crops = mapData.tiles.flat().map(t => t.cropType).filter((c): c is string => !!c);
            if (crops.length === 0) return "Primary subsistence is foraging.";

            const cropCounts = crops.reduce((acc: Record<string, number>, crop) => {
                acc[crop] = (acc[crop] || 0) + 1;
                return acc;
            }, {});
            
            const cropKeys = Object.keys(cropCounts);
            if (cropKeys.length === 0) {
                 return "Primary subsistence is foraging.";
            }

            const primaryCrop = cropKeys.sort((a, b) => cropCounts[b] - cropCounts[a])[0];
            return `The primary crop is ${primaryCrop.toLowerCase()}.`;
        }
        
        return "Primary subsistence is hunting and foraging.";
    }, [societalProfile, mapData]);

    const selectedAnimalId = isAnimal(infoModalTarget) ? infoModalTarget?.id : undefined;
    const selectedNpcId = isNpc(infoModalTarget) ? infoModalTarget?.id : undefined;

    const animalShortDescriptions = useMemo(() => new Map(animals.map(animal => [animal.id, generateAnimalDescriptions(animal).short])), [animals]);
    
    const formatEnumString = (enumString: string) => {
      if (!enumString) return "Unknown";
      return enumString.charAt(0).toUpperCase() + enumString.slice(1).toLowerCase().replace(/_/g, ' ');
    };

    // FIXED: Handler function defined at component level
    const handlePoiClick = (structure: TerrainStructure) => {
        try {
            const poiTypes = new Set(['holy_site', 'palace', 'ruin']);
            if (poiTypes.has(structure.structureType)) {
                setActivePoi(structure);
            } else {
                setStructureModalTarget(structure);
            }
        } catch (error) {
            console.error('Error handling POI click:', error);
        }
    };
    
    const getSubTabContent = (tab: LeftSidebarTab) => {
        if (tab === 'analysis') {
            return (
                <div className="space-y-4">
                    <CollapsibleSection title="Mineral Deposits" count={mineralDeposits.size}>
                         <ul className="space-y-1">
                           {Array.from(mineralDeposits.entries()).map(([name, count]) => (
                               <li key={name} className="flex items-center justify-between p-2 rounded-md">
                                   <span className="text-sm text-slate-200">{name}</span>
                                   <span className="text-xs font-mono bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded-md">{count} tiles</span>
                               </li>
                           ))}
                        </ul>
                    </CollapsibleSection>
                    <CollapsibleSection title="Points of Interest" count={pointsOfInterest.length}>
                        <ul className="space-y-1">
                             {pointsOfInterest.map(poi => (
                                <AnalysisListItem
                                    key={poi.id}
                                    icon={STRUCTURE_BLUEPRINTS[poi.structureType]?.icon || '📍'}
                                    name={poi.name}
                                    subtext={`(${poi.structureType.replace(/_/g, ' ')})`}
                                    onClick={() => handlePoiClick(poi)}
                                />
                             ))}
                        </ul>
                    </CollapsibleSection>
                </div>
            );
        }
        // ... rest of your existing tab content logic for other tabs
        if (tab === 'overview') {
            const dateInfo = parseDateString(gameDate.year.toString());
            const culturalZoneEnum = mapLocationToCulture(currentZone, dateInfo.year);
            const factionData = FACTION_DATA[culturalZoneEnum as CulturalZone]?.[currentRegion]?.[dateInfo.era as HistoricalEra];
            const { majorCity } = mapData || {};
          
            const getArchetypePhrase = (archetype: MapArchetype): string => {
              const phrases: Record<MapArchetype, string> = {
                [MapArchetype.ALL_LAND]: "is characterized by its vast inland territories, carved by winding rivers and rolling hills.",
                [MapArchetype.ISLAND]: "is defined by its isolation, a solitary landmass rising from the surrounding ocean.",
                [MapArchetype.RIVER_PORT]: "is dominated by a major navigable river, serving as a vital artery for trade and settlement.",
                [MapArchetype.BAY]: "features a great bay, offering sheltered waters and strategic access to the open sea.",
                [MapArchetype.PENINSULA]: "is a strip of land projecting into the sea, defined by its extensive coastline and maritime opportunities.",
                [MapArchetype.ATOLL]: "consists of a ring-shaped coral reef encircling a sheltered lagoon, a haven in the open ocean.",
                [MapArchetype.FRESHWATER_LAKE]: "is centered around a vast freshwater lake, with life and trade clinging to its shores.",
                [MapArchetype.DELTA]: "is a fertile, marshy landscape where a great river splinters into a network of distributaries before meeting the sea.",
                [MapArchetype.SHOALS]: "is a treacherous expanse of shallow waters, sandbars, and small, low-lying islands.",
                [MapArchetype.STRAITS]: "is a narrow, strategic waterway connecting two larger seas, a chokepoint for naval traffic.",
                [MapArchetype.OPEN_OCEAN]: "is a vast expanse of open water."
              };
              return phrases[archetype] || `resembles a ${archetype.toLowerCase().replace(/_/g, ' ')}.`;
            };
          
            const climateStr = currentMapClimate.toLowerCase();
            const archetypePhrase = getArchetypePhrase(currentMapArchetype);
          
            const sentence1 = `Located in the ${currentRegion}, ${localArea} is a ${climateStr} region which ${archetypePhrase}`;
            const sentence2 = `The year is ${gameDate.year}, ${factionData?.eraContextSentence || 'a time of local conflicts and shifting allegiances.'}`;
            
            const finalDesc = `${sentence1} ${sentence2}`;
           
            const structures = terrainStructures || [];
            const localNpcs = npcs || [];
            const dominantPower = factionData?.dominantPower || "Local Tribes";
          
            return (
              <div className="space-y-5 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-amber-300 mb-2 border-b border-gray-600/50 pb-2 flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    Dominant Power
                  </h4>
                  <p className="text-lg font-bold text-amber-400 mb-2">
                    {dominantPower}
                  </p>
                  {factionData?.dominantPowerDescription && (
                      <blockquote className="border-l-2 border-amber-600/50 pl-3 italic text-amber-200/80 leading-relaxed text-xs">
                          {factionData.dominantPowerDescription}
                      </blockquote>
                  )}
          
                  {majorCity && (
                    <>
                      <h4 className="font-semibold text-cyan-300 mb-3 mt-4 border-b border-gray-600/50 pb-2 flex items-center gap-2">
                        <span className="text-lg">🏛️</span>
                        Major City
                      </h4>
                      <div className="bg-cyan-900/20 px-3 py-2 rounded-lg border border-cyan-700/30 mb-4">
                        <p className="text-lg font-bold text-cyan-400 mb-1">{majorCity.name}</p>
                        <p className="text-xs italic text-gray-400">{majorCity.description}</p>
                      </div>
                    </>
                  )}
          
                  <h4 className="font-semibold text-blue-300 mb-3 mt-4 border-b border-gray-600/50 pb-2">Description</h4>
                  <p className="italic text-gray-300 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                    {finalDesc}
                  </p>
                </div>
              </div>
            );
        }
        if (tab === 'animals') {
            return (
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <h4 className="text-sm font-semibold text-blue-300 flex justify-between items-center shrink-0">
                        <span>Observed Wildlife</span>
                        <span className="bg-gray-600 text-gray-200 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
                            {animals.length}
                        </span>
                    </h4>
                    {animals.length > 0 ? (
                        <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 flex-1 pr-1">
                            {animals.map(animal => (
                                <AnimalListItem key={animal.id} animal={animal} isSelected={selectedAnimalId === animal.id} onClick={setInfoModalTarget} description={animalShortDescriptions.get(animal.id) || ''} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center"><p className="text-sm text-gray-500 italic text-center py-8">No animals observed.</p></div>
                    )}
                </div>
            );
        }
        if (tab === 'npcs') {
            return (
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <h4 className="text-sm font-semibold text-blue-300 flex justify-between items-center shrink-0">
                        <span>Nearby People</span>
                        <span className="bg-gray-600 text-gray-200 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
                            {npcs.length}
                        </span>
                    </h4>
                    {npcs.length > 0 ? (
                        <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 flex-1 pr-1">
                            {npcs.map(npc => (
                                <NpcListItem key={npc.id} npc={npc} isSelected={selectedNpcId === npc.id} onClick={setInfoModalTarget} />
                            ))}
                        </div>
                    ) : (
                         <div className="flex-1 flex items-center justify-center"><p className="text-sm text-gray-500 italic text-center py-8">No people observed nearby.</p></div>
                    )}
                </div>
            );
        }
        return null;
    };


    const mapSubTabs: { id: LeftSidebarTab, label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'analysis', label: 'Analysis' },
        { id: 'npcs', label: 'NPCs' },
        { id: 'animals', label: 'Animals' },
    ];

    const renderMapTabContent = () => (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
             <div className="flex bg-slate-800/60 rounded-t-lg border-x border-t border-slate-700/50 shrink-0 shadow-sm">
                {mapSubTabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveMapSubTab(tab.id)}
                        className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2
                        ${activeMapSubTab === tab.id ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 p-3 bg-slate-900/40 rounded-b-lg border-x border-b border-slate-700/50 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600/60 scrollbar-track-slate-800/30 flex flex-col min-h-0 shadow-inner">
                {getSubTabContent(activeMapSubTab)}
            </div>
        </div>
    );

    const majorTabs: { id: MajorTab, label: string, color: string, glow: string }[] = [
        { id: 'history', label: 'History', color: 'bg-amber-600', glow: 'shadow-glow-amber' },
        { id: 'map', label: 'Map', color: 'bg-blue-600', glow: 'shadow-glow-blue' },
        { id: 'journal', label: 'Journal', color: 'bg-purple-600', glow: 'shadow-glow-purple' },
    ];
  
    return (
        <div className={`flex-shrink-0 bg-sidebar-gradient shadow-sidebar-left backdrop-blur-xl border-r border-slate-700/80 flex flex-col text-slate-200 transition-all duration-300 h-full ${isLeftSidebarExpanded ? 'w-[400px]' : 'w-0 p-0 border-none'}`}>
            <div className={`p-3 flex flex-col flex-1 overflow-hidden transition-opacity duration-200 ${isLeftSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
                <div className="shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"></h2>
                        <button onClick={() => setIsLeftSidebarExpanded(false)} className="text-slate-400 hover:text-white text-xl leading-none">&lt;&lt;</button>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/70 mb-4 shadow-lg border border-slate-700/50">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                            <div>
                                <p className="text-xs text-slate-400">Date:</p>
                                <p className="text-lg text-amber-300 font-bold">{formattedFullDate}</p>
                                <p className="text-sm text-slate-300">({season})</p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-400">Time:</p>
                                <p className="text-lg text-amber-300 font-bold">{formattedTime}</p>
                                <p className="text-sm text-slate-300">({currentTimeOfDay.toLowerCase()})</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Zone:</p>
                                <p className="text-base text-white font-semibold">{currentZone}</p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-400">Climate:</p>
                                <p className="text-base text-blue-300 font-semibold">{formatEnumString(currentMapClimate)}</p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-400">Region:</p>
                                <p className="text-base font-bold text-green-400">{currentRegion}</p>
                            </div>
                             <div className="text-amber-200/80 leading-relaxed text-xs">
                                {societyDescription}
                             </div>
                              <div>
                                <p className="text-xs text-slate-400">Map Area:</p>
                                <p className="text-base font-bold text-green-400">{localArea}</p>
                            </div>
                             <div className="text-amber-200/80 leading-relaxed text-xs">
                               {primaryResourceDescription}
                             </div>
                        </div>
                    </div>
                     <div className="flex mb-2 bg-slate-800/60 rounded-lg p-1 border border-slate-700/50 shadow-sm">
                        {majorTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveMajorTab(tab.id)}
                                className={`flex-1 py-2.5 px-2 text-center text-sm font-semibold rounded-md transition-all duration-200 ${activeMajorTab === tab.id ? `${tab.color} text-white shadow-lg ${tab.glow} transform scale-105` : 'text-slate-300 hover:bg-slate-700/60 hover:text-white hover:shadow-sm'}`} >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {activeMajorTab === 'map' && renderMapTabContent()}
                    {activeMajorTab === 'history' && (
                        <div className="flex-1 overflow-hidden bg-slate-900/40 rounded-lg border border-slate-700/50 shadow-inner">
                            <HistoryPanel gameDate={gameDate} currentZone={currentZone} currentRegion={currentRegion} localArea={localArea} useLlmForDescriptions={useLlmForDescriptions} mapData={mapData} npcs={npcs}/>
                        </div>
                    )}
                    {activeMajorTab === 'journal' && (
                        <div className="flex-1 overflow-hidden bg-slate-900/40 rounded-lg border border-slate-700/50 shadow-inner">
                            <JournalPanel gameLog={gameLog} playerJournal={playerJournal} onAddPlayerEntry={onAddPlayerJournalEntry} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(LeftSidebar);
