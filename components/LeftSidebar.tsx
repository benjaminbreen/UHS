/**
 * components/LeftSidebar.tsx
 * Compact, legible sidebar with:
 * - NPC tiles using ProceduralPortrait + badges (class/profession/age/gender)
 * - Quick NPC search
 * - Strategic Lenses as a 2-row grid of buttons (with hover tooltips)
 * - Sticky user prefs for width and last-opened tabs
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Crown, Building, Users, Heart, BookOpen, Globe } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import {
  AnimalEntity, NpcEntity, isAnimal, isNpc, LensMode, MapArchetype, CulturalZone,
  HistoricalEra, TerrainStructure
} from '../types';
import { generateAnimalDescriptions } from '../services/animalDescriptionGenerator';
import { parseDateString } from '../utils/dateUtils';
import HistoryPanel from './HistoryPanel';
import GamelogPanel from './GamelogPanel';
import { MAP_ARCHETYPE_DESCRIPTIONS, FACTION_DATA, STRUCTURE_BLUEPRINTS, METALS } from '../constants/index';
import { mapLocationToCulture } from '../utils/mapUtils';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import { getDominantSector, getPrimaryIndustry, EconomicSector } from '../constants/gameData/economicSectors';
import { primarySourceService } from '../services/primarySourceService';
import { LazyPortrait } from './portraits';
import { FACTION_ICONS, FactionData } from '../constants/gameData/factionIcons';
import { languageVisualizationService } from '../services/languageVisualizationService';
import { LanguageFamilyTree } from './LanguageFamilyTree';
import ContextualTooltip from './ui/ContextualTooltip';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export type LeftSidebarTab = 'analysis' | 'overview' | 'npcs' | 'animals';
type MajorTab = 'map' | 'history' | 'gamelog';

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 500;
const getDefaultSidebarWidth = () => {
  if (typeof window === 'undefined') return 380;
  if (window.innerWidth < 1440) return 320;
  if (window.innerWidth < 1920) return 380;
  return 420;
};
const DEFAULT_SIDEBAR_WIDTH = getDefaultSidebarWidth();

const SIDEBAR_WIDTH_KEY = 'uhs.sidebarWidth';
const MAP_TAB_KEY = 'uhs.mapSubTab';
const MAJOR_TAB_KEY = 'uhs.majorTab';

/* -------------------------------------------------------------------------- */
/* Small shared bits                                                          */
/* -------------------------------------------------------------------------- */

const AnalysisListItem: React.FC<{ icon: string, name: string, subtext: string, onClick: () => void }> = ({ icon, name, subtext, onClick }) => (
  <li
    onClick={onClick}
    className="flex items-center p-2 rounded-md cursor-pointer hover:bg-slate-700/50"
  >
    <span className="text-xl mr-3">{icon}</span>
    <div className="min-w-0">
      <p className="font-medium text-slate-200 text-sm truncate">{name}</p>
      <p className="text-xs text-slate-400 truncate">{subtext}</p>
    </div>
  </li>
);

const CollapsibleSection: React.FC<{ title: string, count?: number, children: React.ReactNode, startOpen?: boolean }> = ({
  title, count, children, startOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(startOpen);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-semibold text-blue-400 dark:text-blue-300 mb-2 p-2 rounded-md hover:bg-slate-800/40"
      >
        <span className="flex items-center gap-2">
          {title}
          {typeof count === 'number' && (
            <span className="text-xs font-mono bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded-md">{count}</span>
          )}
        </span>
        <span className={isOpen ? 'rotate-90' : ''}>▶</span>
      </button>
      {isOpen && <div className="pl-2 border-l-2 border-slate-700/50">{children}</div>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* List Items                                                                 */
/* -------------------------------------------------------------------------- */

const AnimalListItem = React.memo(
  ({ animal, isSelected, onClick, description }: {
    animal: AnimalEntity; isSelected: boolean; onClick: (animal: AnimalEntity) => void; description: string;
  }) => {
    return (
      <div
        onClick={() => onClick(animal)}
        className={`flex items-center p-3 rounded-lg cursor-pointer text-gray-300 hover:bg-slate-700/50 ${isSelected ? 'bg-blue-800/50 text-white border border-blue-400/50' : ''}`}
      >
        <div className="text-2xl mr-3 flex-shrink-0">{animal.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{animal.speciesName}</p>
          <div className="text-xs text-gray-400 flex items-center mt-1">
            <Heart className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{description}</span>
          </div>
        </div>
      </div>
    );
  }
);

/** NPC list item with ProceduralPortrait + compact badges */
const NpcListItem = React.memo(
  ({ npc, isSelected, isHighlighted, onClick }: { npc: NpcEntity; isSelected: boolean; isHighlighted?: boolean; onClick: (npc: NpcEntity) => void }) => {
    const Badge: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
      <span
        title={title}
        className="px-1.5 py-0.5 rounded-md bg-slate-700/60 text-[10px] font-semibold uppercase tracking-wide text-slate-200 border border-slate-600/60"
      >
        {children}
      </span>
    );

    return (
      <button
        onClick={() => onClick(npc)}
        className={[
          "group w-full flex items-center gap-3 p-2.5 rounded-lg text-left border",
          isSelected
            ? "bg-blue-800/50 border-blue-400/50 text-white"
            : isHighlighted
            ? "bg-amber-700/30 border-amber-500/40 text-gray-100"
            : "bg-slate-800/30 hover:bg-slate-700/40 border-slate-700/40 text-gray-200"
        ].join(" ")}
      >
        {/* Portrait */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-md overflow-hidden border border-slate-600/70 bg-slate-700/60">
            <LazyPortrait character={npc} size={44} type="procedural" staticMode={true} />
          </div>
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-slate-100 truncate">{npc.name}</p>
          </div>

          {/* Profession • Class */}
          <div className="text-xs text-slate-300 truncate">
            <span className="capitalize text-green-300">{npc.role?.replace(/_/g, ' ') || "unknown"}</span>
            <span className="mx-1 text-slate-500">•</span>
            <span className="capitalize">{(npc.class || "commoner").toString().toLowerCase().replace(/_/g, ' ')}</span>
          </div>

          {/* Badges: Age + Gender (+ optional religion trailing) */}
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
            <Badge title="Age">{(npc.age ?? "?").toString()}</Badge>
            <Badge title="Gender">{(npc.gender ?? "—").toString()}</Badge>
            {npc.religion ? <span className="text-[11px] text-slate-400 truncate">· {npc.religion}</span> : null}
          </div>
        </div>
      </button>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

const LeftSidebar: React.FC<{
  onShowFactionsModal?: (data: any) => void;
  onShowFactionTooltip?: (data: any, x: number, y: number) => void;
  onHideFactionTooltip?: () => void;
  onToggleMapVisibility?: () => void;
  isProcessingWorldWeaver?: boolean;
}> = ({
  onShowFactionsModal,
  onShowFactionTooltip,
  onHideFactionTooltip,
  onToggleMapVisibility,
  isProcessingWorldWeaver = false
}) => {
  const {
    activeMapSubTab, setActiveMapSubTab,
    isLeftSidebarExpanded, setIsLeftSidebarExpanded,
    activeLens, setActiveLens,
    setInfoModalTarget, infoModalTarget, useLlmForDescriptions,
    setIsMapDetailsModalOpen, setStructureModalTarget, setActivePoi,
    inMiningRoguelike,
    setCityHistoricalModalData,
    hasSeenTooltip, markTooltipSeen
  } = useUI();

  const { mapData, currentMapArchetype, currentMapClimate, animals, npcs, mapAnalysisData, localArea, terrainStructures, societalProfile } = useMap();
  const { gameDate, season, gameTimeHours, gameTimeMinutes, currentTimeOfDay, gameLog, currentZone, currentRegion } = useGame();
  const { character: playerCharacter } = usePlayer();

  const [activeMajorTab, setActiveMajorTab] = useState<MajorTab>('map');
  const [sourceCount, setSourceCount] = useState<number>(0);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => getDefaultSidebarWidth());
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [npcQuery, setNpcQuery] = useState<string>('');
  const [highlightedNpcId, setHighlightedNpcId] = useState<string | null>(null);

  // Language tree modal state
  const [showLanguageTree, setShowLanguageTree] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(getDefaultSidebarWidth());

  // Memoize main container className for performance
  const sidebarClassName = useMemo(() =>
    getSafariOptimizedClassName(
      `relative flex-shrink-0 bg-sidebar-gradient-light dark:bg-sidebar-gradient border-r border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 h-full flex flex-col`
    ), []);

  /* ----- formatters ----- */
  const formattedTime = useMemo(
    () => `${String(gameTimeHours).padStart(2, '0')}:${String(gameTimeMinutes).padStart(2, '0')}`,
    [gameTimeHours, gameTimeMinutes]
  );

  const formatEnumString = (enumString: string) => {
    if (!enumString) return "Unknown";
    return enumString.charAt(0).toUpperCase() + enumString.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  /* ----- factions for Overview ----- */
  const factionData = useMemo(() => {
    if (!currentZone || !currentRegion || !gameDate) return null;
    try {
      const dateInfo = parseDateString(gameDate.year.toString());
      const culturalZoneEnum = mapLocationToCulture(currentZone, dateInfo.year);
      return FACTION_DATA[culturalZoneEnum as CulturalZone]?.[currentRegion]?.[dateInfo.era as HistoricalEra];
    } catch (error) {
      console.error('Error getting faction data:', error);
      return null;
    }
  }, [currentZone, currentRegion, gameDate]);

  const formattedFullDate = useMemo(() => {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    if (gameDate.month < 1 || gameDate.month > 12) return "Invalid Date";
    if (gameDate.year < 0) return `${monthNames[gameDate.month - 1]} ${gameDate.day}, ${Math.abs(gameDate.year)} BCE`;
    return `${monthNames[gameDate.month - 1]} ${gameDate.day}, ${gameDate.year}`;
  }, [gameDate]);

  /* ----- source count ----- */
  useEffect(() => {
    const loadSourceCount = async () => {
      try {
        const dateInfo = parseDateString(String(gameDate.year));
        const culturalZoneEnum = mapLocationToCulture(currentZone, dateInfo.year);
        const sources = await primarySourceService.getSourcesForContext(
          dateInfo.era as HistoricalEra,
          culturalZoneEnum as any
        );
        setSourceCount(sources.length);
      } catch (error) {
        console.error('Error loading source count:', error);
        setSourceCount(0);
      }
    };
    loadSourceCount();
  }, [gameDate.year, currentZone]);

  /* ----- resizing ----- */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
  }, [sidebarWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartX.current;
    const newWidth = resizeStartWidth.current + dx;
    setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth)));
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)); } catch {}
  }, [sidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    } else {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  /* ----- sticky prefs (width/tabs) ----- */
  useEffect(() => {
    try {
      const savedW = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
      if (savedW) setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, savedW)));
      const savedMapTab = (localStorage.getItem(MAP_TAB_KEY) || '') as LeftSidebarTab;
      if (savedMapTab) setActiveMapSubTab(savedMapTab);
      const savedMajor = (localStorage.getItem(MAJOR_TAB_KEY) || '') as MajorTab;
      if (savedMajor) setActiveMajorTab(savedMajor);
    } catch {}
  }, [setActiveMapSubTab]);

  useEffect(() => { try { localStorage.setItem(MAP_TAB_KEY, activeMapSubTab); } catch {} }, [activeMapSubTab]);
  useEffect(() => { try { localStorage.setItem(MAJOR_TAB_KEY, activeMajorTab); } catch {} }, [activeMajorTab]);

  // Listen for NPC highlight events
  useEffect(() => {
    const handleNpcHighlight = (data: { npcId: string }) => {
      setHighlightedNpcId(data.npcId);
    };

    const handleNpcHighlightClear = () => {
      setHighlightedNpcId(null);
    };

    import('../services/eventBus').then(({ eventBus }) => {
      eventBus.on('npc:highlight', handleNpcHighlight);
      eventBus.on('npc:highlight:clear', handleNpcHighlightClear);
    });

    return () => {
      import('../services/eventBus').then(({ eventBus }) => {
        eventBus.off('npc:highlight', handleNpcHighlight);
        eventBus.off('npc:highlight:clear', handleNpcHighlightClear);
      });
    };
  }, []);

  // Auto-collapse when mining is active
  const [previousExpandState, setPreviousExpandState] = useState<boolean | null>(null);

  useEffect(() => {
    if (inMiningRoguelike) {
      // Store current state and collapse
      if (previousExpandState === null) {
        setPreviousExpandState(isLeftSidebarExpanded);
      }
      if (isLeftSidebarExpanded) {
        setIsLeftSidebarExpanded(false);
      }
    } else if (!inMiningRoguelike && previousExpandState !== null) {
      // Restore previous state when mining ends
      setIsLeftSidebarExpanded(previousExpandState);
      setPreviousExpandState(null);
    }
  }, [inMiningRoguelike, isLeftSidebarExpanded, previousExpandState, setIsLeftSidebarExpanded]);

  /* ----- computed lists ----- */
  const mineralDeposits = useMemo(() => {
    if (!terrainStructures || !Array.isArray(terrainStructures)) return new Map<string, number>();
    const counts = new Map<string, number>();
    try {
      terrainStructures.forEach(structure => {
        if (structure?.mineralDeposits) {
          Object.entries(structure.mineralDeposits).forEach(([metalId, quantity]) => {
            const metalName = METALS[metalId]?.name || metalId;
            counts.set(metalName, (counts.get(metalName) || 0) + Math.ceil((quantity as number) / 1000));
          });
        }
      });
    } catch (error) {
      console.error('Error processing mineral deposits:', error);
      return new Map<string, number>();
    }
    return counts;
  }, [terrainStructures]);

  const pointsOfInterest = useMemo(() => {
    if (!terrainStructures || !Array.isArray(terrainStructures)) return [];
    try {
      return terrainStructures.filter(s =>
        s && ['holy_site','palace','ruin','fortress','mill'].includes(s.structureType)
      );
    } catch (error) {
      console.error('Error filtering POIs:', error);
      return [];
    }
  }, [terrainStructures]);

  const selectedAnimalId = isAnimal(infoModalTarget) ? infoModalTarget?.id : undefined;
  const selectedNpcId = isNpc(infoModalTarget) ? infoModalTarget?.id : undefined;

  const animalShortDescriptions = useMemo(() => {
    if (!animals || !Array.isArray(animals)) return new Map();
    return new Map(animals.map(animal => [animal.id, generateAnimalDescriptions(animal).short]));
  }, [animals]);

  const handlePoiClick = (structure: TerrainStructure) => {
    try {
      const poiTypes = new Set(['holy_site', 'palace', 'ruin']);
      if (poiTypes.has(structure.structureType)) setActivePoi(structure);
      else setStructureModalTarget(structure);
    } catch (error) {
      console.error('Error handling POI click:', error);
    }
  };

  /* ----- lenses (grid buttons) ----- */
  type LensDef = { id: LensMode, name: string, icon: string, desc: string };
  const lensDefs: LensDef[] = [
    { id: 'safety' as LensMode,      name: 'Safety',   icon: '🛡️', desc: 'Defensive and secure areas' },
    { id: 'biodiversity' as LensMode,name: 'Wildlife', icon: '🦋', desc: 'Biodiversity and animal habitats' },
    { id: 'sacrality' as LensMode,   name: 'Sacrality',icon: '⛪', desc: 'Religious and holy sites' },
    { id: 'healthiness' as LensMode, name: 'Health',   icon: '💚', desc: 'Disease risk and wellness' },
    { id: 'flammability' as LensMode,name: 'Fire Risk',icon: '🔥', desc: 'Wildfire susceptibility' },
    { id: 'minerals' as LensMode,    name: 'Minerals', icon: '💎', desc: 'Mineral deposit locations' },
  ];

  const LensButton: React.FC<{ lens: LensDef }> = ({ lens }) => {
    const active = activeLens === lens.id;
    return (
      <button
        title={lens.desc}
        onClick={() => setActiveLens(lens.id)}
        aria-pressed={active}
        className={[
          "flex items-center justify-center gap-2 px-2 py-2 rounded-md border text-sm",
          active
            ? "bg-amber-600/25 border-amber-500/60 text-amber-200"
            : "bg-slate-800/45 hover:bg-slate-700/60 border-slate-700/60 text-slate-200"
        ].join(" ")}
      >
        <span className="text-base leading-none">{lens.icon}</span>
        <span className="font-medium">{lens.name}</span>
      </button>
    );
  };

  /* ----- Calculate biome statistics ----- */
  const biomeStats = useMemo(() => {
    if (!mapData?.tiles) return { distribution: [], totalTiles: 0, waterPercent: 0, urbanPercent: 0 };

    const biomeCounts = new Map<string, number>();
    let waterCount = 0;
    let urbanCount = 0;
    const totalTiles = mapData.tiles.length * (mapData.tiles[0]?.length || 0);

    mapData.tiles.forEach(row => {
      row.forEach(tile => {
        const biome = tile.biomeType || tile.biome || 'UNKNOWN';
        biomeCounts.set(biome, (biomeCounts.get(biome) || 0) + 1);

        if (biome && typeof biome === 'string') {
          if (biome.includes('OCEAN') || biome.includes('LAKE') || biome.includes('RIVER')) {
            waterCount++;
          }
          if (biome.includes('CITY') || biome === 'URBAN' || biome === 'MARKETPLACE') {
            urbanCount++;
          }
        }
      });
    });

    const distribution = Array.from(biomeCounts.entries())
      .filter(([biome]) => biome && biome !== 'UNKNOWN')
      .map(([biome, count]) => ({
        biome,
        count,
        percent: Math.round((count / totalTiles) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 biomes

    return {
      distribution,
      totalTiles,
      waterPercent: Math.round((waterCount / totalTiles) * 100),
      urbanPercent: Math.round((urbanCount / totalTiles) * 100)
    };
  }, [mapData]);

  /* ----- Group POIs by type ----- */
  const groupedPOIs = useMemo(() => {
    const groups: Record<string, TerrainStructure[]> = {};
    pointsOfInterest.forEach(poi => {
      const type = poi.structureType;
      if (!groups[type]) groups[type] = [];
      groups[type].push(poi);
    });
    return groups;
  }, [pointsOfInterest]);

  /* ----- tab content ----- */
  const getSubTabContent = (tab: LeftSidebarTab) => {
    if (tab === 'analysis') {
      return (
        <div className="space-y-3">
          {/* Quick Stats Card */}
          <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/40">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
              {currentMapArchetype ? formatEnumString(currentMapArchetype).replace('_', ' ') : 'STANDARD'} MAP
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/40 rounded-md p-2">
                <div className="text-[10px] text-slate-500 uppercase">Entities</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-blue-300">{npcs?.length || 0}</span>
                  <span className="text-xs text-slate-400">NPCs</span>
                </div>
              </div>
              <div className="bg-slate-900/40 rounded-md p-2">
                <div className="text-[10px] text-slate-500 uppercase">Wildlife</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-green-300">{animals?.length || 0}</span>
                  <span className="text-xs text-slate-400">Animals</span>
                </div>
              </div>
              <div className="bg-slate-900/40 rounded-md p-2">
                <div className="text-[10px] text-slate-500 uppercase">Water</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-cyan-300">{biomeStats.waterPercent}%</span>
                  <span className="text-xs text-slate-400">Coverage</span>
                </div>
              </div>
              <div className="bg-slate-900/40 rounded-md p-2">
                <div className="text-[10px] text-slate-500 uppercase">Urban</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-amber-300">{biomeStats.urbanPercent}%</span>
                  <span className="text-xs text-slate-400">Developed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Lenses - Redesigned */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">STRATEGIC LENSES</span>
              <span className="text-[10px] text-slate-500">6</span>
            </div>
            {activeLens !== 'none' && (
              <div className="mb-2 p-2 bg-amber-900/20 border border-amber-500/30 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300">Active: {lensDefs.find(l => l.id === activeLens)?.name}</span>
                  <button
                    onClick={() => setActiveLens('none' as LensMode)}
                    className="text-xs px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600/40 text-red-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {lensDefs.map(lens => {
                const active = activeLens === lens.id;
                return (
                  <button
                    key={lens.id}
                    title={lens.desc}
                    onClick={() => setActiveLens(lens.id)}
                    className={`
                      flex flex-col items-center justify-center p-2 rounded-md border text-xs
                      transition-colors
                      ${active
                        ? 'bg-amber-600/30 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30'
                        : 'bg-slate-800/30 hover:bg-slate-700/40 border-slate-700/40 text-slate-300'}
                    `}
                  >
                    <span className="text-lg mb-0.5">{lens.icon}</span>
                    <span className="font-medium text-[10px]">{lens.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terrain Composition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">TERRAIN COMPOSITION</span>
              <span className="text-[10px] text-slate-500">{biomeStats.distribution.length}</span>
            </div>
            <div className="space-y-1">
              {biomeStats.distribution.map(({ biome, percent }) => (
                <div key={biome} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-300 flex-1 truncate">
                    {biome.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-20 h-1 bg-slate-800/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-8 text-right">{percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources & Minerals - Enhanced */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">RESOURCE DEPOSITS</span>
              <span className="text-[10px] text-slate-500">{mineralDeposits.size}</span>
            </div>
            {mineralDeposits.size > 0 ? (
              <div className="space-y-2">
                {Array.from(mineralDeposits.entries()).map(([name, count]) => {
                  const icon = name.toLowerCase().includes('gold') ? '🟡' :
                              name.toLowerCase().includes('silver') ? '⚪' :
                              name.toLowerCase().includes('copper') ? '🟠' :
                              name.toLowerCase().includes('iron') ? '⚫' : '💎';
                  return (
                    <div key={name} className="flex items-center justify-between p-1.5 bg-slate-800/20 rounded">
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{icon}</span>
                        <span className="text-[11px] text-slate-200 font-medium">{name}</span>
                      </span>
                      <span className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">
                        {count} {count === 1 ? 'tile' : 'tiles'}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-700/30">
                  <div className="text-[10px] text-slate-500">
                    Total resource tiles: {Array.from(mineralDeposits.values()).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500">No deposits found</p>
            )}
          </div>

          {/* Points of Interest - Grouped */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">LANDMARKS</span>
              <span className="text-[10px] text-slate-500">{pointsOfInterest.length}</span>
            </div>
            {Object.entries(groupedPOIs).map(([type, pois]) => (
              <div key={type} className="mb-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {type.replace(/_/g, ' ')}
                </div>
                <div className="space-y-1">
                  {pois.map(poi => (
                    <button
                      key={poi.id}
                      onClick={() => handlePoiClick(poi)}
                      className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-700/30 text-left transition-colors"
                    >
                      <span className="text-base">{STRUCTURE_BLUEPRINTS[poi.structureType]?.icon || '📍'}</span>
                      <span className="text-[11px] text-slate-200 truncate">{poi.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {pointsOfInterest.length === 0 && (
              <p className="text-[10px] text-slate-500">No landmarks found</p>
            )}
          </div>

          {/* Terrain Analysis Button */}
          <button
            onClick={() => setIsMapDetailsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-200 rounded-lg text-sm font-medium transition-colors"
          >
            <BarChart className="w-4 h-4" />
            <span>Full Terrain Analysis</span>
          </button>
        </div>
      );
    }

    if (tab === 'overview') {
      const { majorCity } = mapData || {};

      const sentence1 = `Located in the ${currentRegion}, ${localArea} is a ${currentMapClimate.toLowerCase()} region.`;
      const yearDisplay = gameDate.year < 0 ? `${Math.abs(gameDate.year)} BCE` : `${gameDate.year} CE`;
      const sentence2 = `The year is ${yearDisplay}, ${factionData?.eraContextSentence || 'a time of local conflicts and shifting allegiances.'}`;
      const finalDesc = `${sentence1} ${sentence2}`;
      const dominantPower = factionData?.dominantPower || "Local Tribes";

      // Get faction icon for dominant power
      const factionIconData = FACTION_ICONS[dominantPower];
      const FactionIcon = factionIconData?.icon || Crown;

      // Get rising and contested powers
      const risingPowers = factionData?.allegianceGroups?.filter(group => group.type === 'rising') || [];
      const contestedPowers = factionData?.allegianceGroups?.filter(group => group.type === 'contested') || [];
      const rebelliousPowers = factionData?.allegianceGroups?.filter(group => group.type === 'rebel') || [];
      const secondaryPowers = [...risingPowers, ...contestedPowers, ...rebelliousPowers];

      // Get local languages based on cultural zone and time period
      const localLanguages = languageVisualizationService.getLanguagesByYear(gameDate.year)
        .filter(lang => lang.regions?.some(region =>
          currentRegion.toLowerCase().includes(region.toLowerCase()) ||
          region.toLowerCase().includes(currentRegion.toLowerCase())
        ) || (playerCharacter?.culturalZone && lang.family?.toLowerCase().includes(playerCharacter.culturalZone.toLowerCase())))
        .slice(0, 4); // Limit to 4 most relevant

      // Count map features for summary
      const ruinCount = pointsOfInterest.filter(poi => poi.structureType?.toLowerCase().includes('ruin')).length;
      const fortressCount = pointsOfInterest.filter(poi => poi.structureType?.toLowerCase().includes('fortress')).length;
      const millCount = pointsOfInterest.filter(poi => poi.structureType?.toLowerCase().includes('mill')).length;
      const mineralCount = Array.from(mineralDeposits.values()).reduce((a, b) => a + b, 0);
      const peopleCount = npcs?.length || 0;

      return (
        <div className="flex flex-col h-full">
          <div className="space-y-5 text-sm text-gray-300 flex-1">
            <div>
              <h4 className="font-semibold text-amber-300 mb-2 border-b border-gray-600/50 pb-2">
                Dominant Power
              </h4>
              <div
                className="cursor-pointer hover:bg-white/5 rounded-lg p-2 -mx-2"
                onClick={() => onShowFactionsModal?.(factionData)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onShowFactionTooltip?.(factionData, rect.right, rect.top);
                }}
                onMouseLeave={() => onHideFactionTooltip?.()}
              >
                <div className="flex items-center gap-2">
                  <FactionIcon className="w-4 h-4" style={{ color: factionIconData?.color || '#FCD34D' }} />
                  <p className="text-base font-semibold text-amber-400">{dominantPower}</p>
                </div>
              </div>
              {factionData?.dominantPowerDescription && (
                <blockquote className="border-l-2 border-amber-600/50 pl-3 italic text-gray-300 leading-relaxed text-sm mt-2">
                  {factionData.dominantPowerDescription}
                </blockquote>
              )}

              {/* Rising/Contested Powers */}
              {secondaryPowers.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2">Other Powers</h5>
                  <div className="space-y-1">
                    {secondaryPowers.map((power, idx) => {
                      const powerIconData = FACTION_ICONS[power.name];
                      const PowerIcon = powerIconData?.icon || Crown;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <PowerIcon className="w-3 h-3" style={{ color: powerIconData?.color || '#94A3B8' }} />
                          <span className="text-slate-300">{power.name}</span>
                          <span className="text-slate-500">({power.type})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {majorCity && (
                <>
                  <h4 className="font-semibold text-cyan-300 mb-3 mt-4 border-b border-gray-600/50 pb-2">
                    Major City
                  </h4>
                  <div
                    className="bg-cyan-900/20 px-3 py-2 rounded-lg border border-cyan-700/30 mb-4 cursor-pointer hover:bg-cyan-800/30 hover:border-cyan-600/40"
                    onClick={() => {
                      setCityHistoricalModalData({
                        cityName: majorCity.name,
                        cityDescription: majorCity.description
                      });
                    }}
                    title="Click to explore historical details"
                  >
                    {/* City header with founding year */}
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-lg font-bold text-cyan-400">{majorCity.name}</p>
                      {majorCity.foundingYear && (
                        <span className="text-[10px] text-gray-400 mt-1">
                          est. {majorCity.foundingYear < 0 ? `${Math.abs(majorCity.foundingYear)} BCE` : `${majorCity.foundingYear}`}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 mb-2">{majorCity.description}</p>

                    {/* Economic sectors with minimal colored outlines */}
                    {majorCity.economicFocus && majorCity.economicFocus.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {majorCity.economicFocus.map((sector: string) => {
                          const sectorColors: Record<string, string> = {
                            'agriculture': 'border-green-600/40',
                            'farming': 'border-green-600/40',
                            'whaling': 'border-blue-600/40',
                            'fishing': 'border-blue-600/40',
                            'tourism': 'border-purple-600/40',
                            'shipping': 'border-cyan-600/40',
                            'trade': 'border-amber-600/40',
                            'mining': 'border-stone-500/40',
                            'manufacturing': 'border-gray-500/40',
                            'textiles': 'border-pink-600/40',
                            'finance': 'border-yellow-600/40',
                            'banking': 'border-yellow-600/40',
                            'military': 'border-red-600/40',
                            'education': 'border-indigo-600/40',
                            'arts': 'border-violet-600/40',
                            'religion': 'border-sky-600/40',
                            'government': 'border-slate-500/40',
                            'technology': 'border-teal-600/40',
                            'crafts': 'border-orange-600/40',
                            'wine': 'border-rose-600/40',
                            'oil': 'border-zinc-500/40',
                            'livestock': 'border-amber-600/40',
                            'timber': 'border-emerald-600/40',
                            'shipbuilding': 'border-blue-600/40'
                          };
                          const borderColor = sectorColors[sector.toLowerCase()] || 'border-slate-500/40';

                          return (
                            <span
                              key={sector}
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] text-gray-400 border ${borderColor} bg-transparent`}
                              title={sector}
                            >
                              {sector.toLowerCase()}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-[10px] text-cyan-300/50 mt-2">Click for details →</p>
                  </div>
                </>
              )}

              {/* Local Languages */}
              {localLanguages.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-emerald-300 mb-2 border-b border-gray-600/50 pb-2 flex items-center gap-2">
                    
                    Local Languages
                  </h4>
                  <div className="space-y-1">
                    {localLanguages.map((lang, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedLanguageId(lang.id);
                          setShowLanguageTree(true);
                        }}
                        className="block w-full text-left text-xs text-emerald-200 hover:text-emerald-100 hover:bg-emerald-900/20 rounded px-2 py-1 transition-colors"
                      >
                        <span className="font-medium">{lang.name}</span>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <span className="text-emerald-300/60 ml-1">({lang.nativeName})</span>
                        )}
                        <div className="text-[10px] text-emerald-400/50">{lang.family}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h4 className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2 mt-4">Description</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {finalDesc}
              </p>

              {/* Summary Counts */}
              <div className="mt-4 pt-3">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                  {ruinCount > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setActiveMajorTab('map');
                          setActiveMapSubTab('analysis');
                        }}
                        className="hover:text-slate-300 hover:underline transition-colors"
                      >
                        {ruinCount} ruin{ruinCount !== 1 ? 's' : ''}
                      </button>
                      <span className="text-amber-500/50">|</span>
                    </>
                  )}
                  {millCount > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setActiveMajorTab('map');
                          setActiveMapSubTab('analysis');
                        }}
                        className="hover:text-slate-300 hover:underline transition-colors"
                      >
                        {millCount} mill{millCount !== 1 ? 's' : ''}
                      </button>
                      <span className="text-cyan-500/50">|</span>
                    </>
                  )}
                  {fortressCount > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setActiveMajorTab('map');
                          setActiveMapSubTab('analysis');
                        }}
                        className="hover:text-slate-300 hover:underline transition-colors"
                      >
                        {fortressCount} fortress{fortressCount !== 1 ? 'es' : ''}
                      </button>
                      <span className="text-red-500/50">|</span>
                    </>
                  )}
                  {mineralCount > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setActiveMajorTab('map');
                          setActiveMapSubTab('analysis');
                        }}
                        className="hover:text-slate-300 hover:underline transition-colors"
                      >
                        {mineralCount} mineral deposit{mineralCount !== 1 ? 's' : ''}
                      </button>
                      <span className="text-purple-500/50">|</span>
                    </>
                  )}
                  {peopleCount > 0 && (
                    <button
                      onClick={() => {
                        setActiveMajorTab('map');
                        setActiveMapSubTab('npcs');
                      }}
                      className="hover:text-slate-300 hover:underline transition-colors"
                    >
                      {peopleCount} people
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Sources Banner */}
          {sourceCount > 0 && (
            <div className="relative mt-4">
              <button
                onClick={() => setActiveMajorTab('history')}
                className="w-full bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/40 rounded-lg p-2.5 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-300">
                    {sourceCount} historical source{sourceCount !== 1 ? 's' : ''} available
                  </span>
                </div>
                <span className="text-[10px] text-amber-400/70 group-hover:text-amber-300 transition-colors">
                  View →
                </span>
              </button>
              {!hasSeenTooltip('primarySourcesBanner') && (
                <ContextualTooltip
                  id="primarySourcesBanner"
                  title="Primary Sources"
                  message="These are actual historical documents from this era. Click to read them and add them to your journal for +1 XP (or +5 XP with annotations)!"
                  position="right"
                  onDismiss={() => markTooltipSeen('primarySourcesBanner')}
                  autoDismissDelay={12000}
                />
              )}
            </div>
          )}
        </div>
      );
    }

    if (tab === 'animals') {
      return (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-blue-300 flex justify-between items-center shrink-0">
            <span>Observed Wildlife</span>
            <span className="bg-gray-600 text-gray-200 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {animals?.length || 0}
            </span>
          </h4>
          {animals && animals.length > 0 ? (
            <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 flex-1 pr-1">
              {animals.map(animal => (
                <AnimalListItem
                  key={animal.id}
                  animal={animal}
                  isSelected={selectedAnimalId === animal.id}
                  onClick={setInfoModalTarget}
                  description={animalShortDescriptions.get(animal.id) || ''}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500 italic text-center py-8">No animals observed.</p>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'npcs') {
      const list = (npcs || []);
      const filtered = npcQuery.trim()
        ? list.filter(n =>
            n.name.toLowerCase().includes(npcQuery.toLowerCase()) ||
            (n.role || '').toLowerCase().includes(npcQuery.toLowerCase()) ||
            (n.class || '').toString().toLowerCase().includes(npcQuery.toLowerCase())
          )
        : list;

      return (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-blue-300 flex justify-between items-center shrink-0">
            <span>Nearby People</span>
            <span className="bg-gray-600 text-gray-200 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {list.length}
            </span>
          </h4>

          {/* Search */}
          <div className="shrink-0">
            <input
              value={npcQuery}
              onChange={(e) => setNpcQuery(e.target.value)}
              placeholder="Search name, role, or class…"
              className="w-full text-sm px-2.5 py-1.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* List */}
          {filtered.length > 0 ? (
            <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 flex-1 pr-1">
              {filtered.map(npc => (
                <NpcListItem
                  key={npc.id}
                  npc={npc}
                  isSelected={selectedNpcId === npc.id}
                  isHighlighted={highlightedNpcId === npc.id}
                  onClick={(clickedNpc) => {
                    // Center map on NPC and highlight them
                    if (clickedNpc.x !== undefined && clickedNpc.y !== undefined) {
                      // Center the camera on the NPC without moving the player
                      window.dispatchEvent(new CustomEvent('centerMapOnLocation', {
                        detail: { x: clickedNpc.x, y: clickedNpc.y }
                      }));

                      // Use eventBus to notify MapViewport to highlight this NPC
                      import('../services/eventBus').then(({ eventBus }) => {
                        eventBus.emit('npc:highlight', { npcId: clickedNpc.id });
                      });
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500 italic text-center py-8">No matching people.</p>
            </div>
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
      <div className="flex bg-slate-800/60 rounded-t-lg border-x border-t border-slate-700/50 shrink-0">
        {mapSubTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveMapSubTab(tab.id)}
            className={`flex-1 py-3 px-2 text-center text-sm font-semibold border-b-2
            ${activeMapSubTab === tab.id ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-3 bg-slate-900/40 rounded-b-lg border-x border-b border-slate-700/50 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600/60 scrollbar-track-slate-800/30 flex flex-col min-h-0">
        {getSubTabContent(activeMapSubTab)}
      </div>
    </div>
  );

  const majorTabs: { id: MajorTab, label: string, color: string }[] = [
    { id: 'history', label: 'History', color: 'bg-amber-600' },
    { id: 'map', label: 'Map', color: 'bg-blue-600' },
    { id: 'gamelog', label: 'Gamelog', color: 'bg-purple-600' },
  ];

  return (
    <>
      <div
        className={sidebarClassName}
        style={{
          width: isLeftSidebarExpanded ? `${sidebarWidth}px` : '0px',
          opacity: isProcessingWorldWeaver ? 0 : 1,
          transition: 'opacity 2s ease-out',
          transitionDelay: isProcessingWorldWeaver ? '2s' : '0.5s' // Fade in 0.5s after processing ends
        }}
    >
      {/* Resize handle */}
      {isLeftSidebarExpanded && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-400/30 z-10"
          style={{ width: '4px' }}
        />
      )}

      <div className={`p-3 flex flex-col flex-1 overflow-hidden transition-opacity ${isLeftSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="shrink-0">
          {/* Header card */}
          <div className="p-4 rounded-xl bg-slate-800/70 mb-4 border border-slate-700/50 relative">
            <button onClick={() => setIsLeftSidebarExpanded(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white text-lg leading-none" aria-label="Collapse sidebar">&lt;&lt;</button>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 items-baseline">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm text-amber-300 font-semibold">{formattedFullDate}</p>
                <p className="text-xs text-slate-300">({season})</p>
              </div>
              <div
                className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-1 -m-1"
                onClick={onToggleMapVisibility}
                title="Click to toggle map visibility"
              >
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Time</p>
                <p className="text-sm text-amber-300 font-semibold">{formattedTime}</p>
                <p className="text-xs text-slate-300">({currentTimeOfDay.toLowerCase()})</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Zone</p>
                <p className="text-sm text-white font-semibold">{currentZone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Climate</p>
                <p className="text-sm text-blue-300 font-semibold">{formatEnumString(currentMapClimate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Region</p>
                <p className="text-sm font-semibold text-green-400">{currentRegion}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Map Area</p>
                <p className="text-sm font-semibold text-green-400">{localArea}</p>
              </div>
            </div>
          </div>

          {/* Major tabs */}
          <div className="flex mb-2 bg-slate-800 border border-slate-600/60 rounded-xl p-1 gap-1">
            {majorTabs.map(tab => {
              const isActive = activeMajorTab === tab.id;
              const gradientMap: Record<string, string> = {
                'bg-amber-600': 'from-amber-600 to-amber-700 shadow-amber-600/30',
                'bg-blue-600': 'from-blue-600 to-blue-700 shadow-blue-600/30',
                'bg-purple-600': 'from-purple-600 to-purple-700 shadow-purple-600/30'
              };
              const gradient = gradientMap[tab.color] || 'from-blue-600 to-blue-700 shadow-blue-600/30';

              return (
                <button key={tab.id} onClick={() => setActiveMajorTab(tab.id)}
                  className={`flex-1 py-2.5 px-2 text-center text-xs font-bold rounded-lg transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? `text-white bg-gradient-to-r ${gradient} shadow-lg transform scale-105`
                      : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 active:scale-95'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeMajorTab === 'map' && renderMapTabContent()}
          {activeMajorTab === 'history' && (
            <div className="flex-1 overflow-hidden bg-slate-900/40 rounded-lg border border-slate-700/50">
              <HistoryPanel
                gameDate={gameDate}
                currentZone={currentZone}
                currentRegion={currentRegion}
                localArea={localArea}
                useLlmForDescriptions={useLlmForDescriptions}
                mapData={mapData}
                npcs={npcs}
              />
            </div>
          )}
          {activeMajorTab === 'gamelog' && (
            <div className="flex-1 overflow-hidden bg-slate-900/40 rounded-lg border border-slate-700/50">
              <GamelogPanel entries={gameLog} />
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Language Family Tree Modal */}
      {showLanguageTree && selectedLanguageId && (
        <LanguageFamilyTree
          isOpen={showLanguageTree}
          onClose={() => {
            setShowLanguageTree(false);
            setSelectedLanguageId(null);
          }}
          initialLanguageId={selectedLanguageId}
          currentYear={gameDate.year}
        />
      )}
    </>
  );
};

export default React.memo(LeftSidebar);
