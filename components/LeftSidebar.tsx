/**
 * components/LeftSidebar.tsx
 * Compact, legible sidebar with:
 * - NPC tiles using ProceduralPortrait + badges (class/profession/age/gender)
 * - Quick NPC search
 * - Strategic Lenses as a 2-row grid of buttons (with hover tooltips)
 * - Sticky user prefs for width and last-opened tabs
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Crown, Building, Users, Heart, BookOpen, ChevronLeft, Sun, CloudSun, Cloud, Snowflake, Droplet, Mountain, Grape, Trees, Waves, Castle, Landmark, Flag, Sparkles, Globe2, CloudOff, Building2 } from 'lucide-react';
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
import { MAP_ARCHETYPE_DESCRIPTIONS, FACTION_DATA, STRUCTURE_BLUEPRINTS, METALS } from '../constants/index';
import { applyYearRangeOverrides } from '../constants/gameData/factions';
import { mapLocationToCulture } from '../utils/mapUtils';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import { getDominantSector, getPrimaryIndustry, EconomicSector } from '../constants/gameData/economicSectors';
import { getDisplayZone } from '../utils/zoneDisplayUtils';
import { primarySourceService } from '../services/primarySourceService';
import { VisiblePortrait } from './portraits';
import { FACTION_ICONS, FactionData } from '../constants/gameData/factionIcons';
import { languageVisualizationService } from '../services/languageVisualizationService';
import { LanguageFamilyTree } from './LanguageFamilyTree';
import ContextualTooltip from './ui/ContextualTooltip';
import LiminalProgressBar from './LiminalProgressBar';
import LifeEventsCalendarModal from './LifeEventsCalendarModal';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export type LeftSidebarTab = 'history' | 'overview' | 'analysis' | 'nearby';

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
const LEFT_TAB_KEY = 'uhs.leftSidebarTab';

/* -------------------------------------------------------------------------- */
/* Small shared bits                                                          */
/* -------------------------------------------------------------------------- */

const AnalysisListItem: React.FC<{ icon: string, name: string, subtext: string, onClick: () => void }> = ({ icon, name, subtext, onClick }) => (
  <li
    onClick={onClick}
    className="flex items-center p-2 rounded-md cursor-pointer surface-muted hover:shadow-md"
  >
    <span className="text-xl mr-3">{icon}</span>
    <div className="min-w-0">
      <p className="font-medium text-text-primary text-sm truncate">{name}</p>
      <p className="text-xs text-text-muted truncate">{subtext}</p>
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
        className="w-full flex justify-between items-center text-left font-semibold text-accent mb-1 p-2 rounded-md surface-muted hover:shadow-md"
      >
        <span className="flex items-center gap-2">
          {title}
          {typeof count === 'number' && (
            <span className="text-xs font-mono badge-pill" data-variant="accent">{count}</span>
          )}
        </span>
        <span className={isOpen ? 'rotate-90' : ''}>▶</span>
      </button>
      {isOpen && <div className="pl-2 border-l-2" style={{ borderColor: 'var(--surface-muted-border)' }}>{children}</div>}
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
        className={`flex items-center p-3 rounded-lg cursor-pointer ${isSelected ? 'bg-accent text-white border border-accent-active' : 'surface-muted text-text-primary hover:shadow-md'}`}
      >
        {animal.imagePath ? (
          <img src={animal.imagePath} alt={animal.speciesName} className="w-8 h-8 mr-3 flex-shrink-0" />
        ) : (
          <div className="text-2xl mr-3 flex-shrink-0">{animal.emoji}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{animal.speciesName}</p>
          <div className="text-xs text-text-muted flex items-center mt-1">
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
        className="badge-pill"
        data-variant="accent"
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
            ? "bg-accent border-accent-active text-white"
            : isHighlighted
            ? "bg-amber-200/60 border-amber-400/60 text-text-primary"
            : "surface-muted text-text-primary hover:shadow-md"
        ].join(" ")}
      >
        {/* Portrait - using VisiblePortrait for lazy rendering */}
        <div className="relative shrink-0">
          <VisiblePortrait
            npc={npc}
            size={44}
            className="rounded-md overflow-hidden surface-muted"
          />
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-text-primary truncate">{npc.name}</p>
          </div>

          {/* Profession • Class */}
          <div className="text-xs text-text-secondary truncate">
            <span className="capitalize text-green-300">{npc.role?.replace(/_/g, ' ') || "unknown"}</span>
            <span className="mx-1 text-text-muted">•</span>
            <span className="capitalize">{(npc.class || "commoner").toString().toLowerCase().replace(/_/g, ' ')}</span>
          </div>

          {/* Badges: Age + Gender (+ optional religion trailing) */}
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-secondary">
            <Badge title="Age">{(npc.age ?? "?").toString()}</Badge>
            <Badge title="Gender">{(npc.gender ?? "—").toString()}</Badge>
            {npc.religion ? <span className="text-[11px] text-text-muted truncate">· {npc.religion}</span> : null}
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
    isLeftSidebarExpanded, setIsLeftSidebarExpanded,
    activeLens, setActiveLens,
    setInfoModalTarget, infoModalTarget, useLlmForDescriptions,
    setIsMapDetailsModalOpen, setStructureModalTarget, setActivePoi,
    inMiningRoguelike,
    setCityHistoricalModalData,
    hasSeenTooltip, markTooltipSeen,
    showLanguageTree, setShowLanguageTree, selectedLanguageId, setSelectedLanguageId,
    centralMode
  } = useUI();

  const { mapData, currentMapArchetype, currentMapClimate, animals, npcs, mapAnalysisData, localArea, terrainStructures, societalProfile } = useMap();
  const { gameDate, season, gameTimeHours, gameTimeMinutes, currentTimeOfDay, currentZone, currentRegion, liminalTravelState } = useGame();
  const { playerCharacter } = usePlayer();

  const [activeTab, setActiveTab] = useState<LeftSidebarTab>('overview');
  const [sourceCount, setSourceCount] = useState<number>(0);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => getDefaultSidebarWidth());
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [npcQuery, setNpcQuery] = useState<string>('');
  const [highlightedNpcId, setHighlightedNpcId] = useState<string | null>(null);
  const [isContentCollapsed, setIsContentCollapsed] = useState<boolean>(false);

  // Life events calendar state
  const [showLifeEventsCalendar, setShowLifeEventsCalendar] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(getDefaultSidebarWidth());

  // Memoize main container className for performance
  const sidebarClassName = useMemo(() =>
    getSafariOptimizedClassName(
      `sidebar-left panel-frame theme-surface relative flex-shrink-0 h-full lg:h-[calc(100%-20px)] flex flex-col`
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

  // Season color coding
  const getSeasonColor = (season: string) => {
    const s = season.toLowerCase();
    if (s.includes('spring')) return 'text-green-500 dark:text-green-400';
    if (s.includes('summer')) return 'text-amber-500 dark:text-amber-400';
    if (s.includes('fall') || s.includes('autumn')) return 'text-orange-500 dark:text-orange-400';
    if (s.includes('winter')) return 'text-cyan-400 dark:text-cyan-300';
    return 'text-text-muted';
  };

  // Climate icon mapping
  const getClimateIcon = (climate: string) => {
    const c = climate.toLowerCase();
    if (c.includes('tropical')) return Sun;
    if (c.includes('arid') || c.includes('desert')) return CloudOff;
    if (c.includes('temperate')) return CloudSun;
    if (c.includes('cold') || c.includes('tundra') || c.includes('polar')) return Snowflake;
    if (c.includes('mediterranean')) return Grape;
    if (c.includes('continental')) return Mountain;
    return Cloud;
  };

  // Cultural zone icon mapping
  const getCulturalZoneIcon = (zone: string) => {
    const z = zone.toUpperCase();
    if (z.includes('EUROPEAN')) return Castle;
    if (z.includes('EAST_ASIAN')) return Building2;
    if (z.includes('MENA')) return Landmark;
    if (z.includes('SOUTH_ASIAN')) return Sparkles;
    if (z.includes('SUB_SAHARAN_AFRICAN') || z.includes('AFRICAN')) return Trees;
    if (z.includes('OCEANIA')) return Waves;
    if (z.includes('PRE_COLUMBIAN')) return Mountain;
    if (z.includes('COLONIAL')) return Flag;
    if (z.includes('SOUTH_AMERICAN')) return Mountain;
    return Globe2;
  };

  /* ----- factions for Overview ----- */
  const factionData = useMemo(() => {
    if (!currentZone || !currentRegion || !gameDate) return null;
    try {
      const dateInfo = parseDateString(gameDate.year.toString());
      const culturalZoneEnum = mapLocationToCulture(currentZone, dateInfo.year);
      const baseFactionData = FACTION_DATA[culturalZoneEnum as CulturalZone]?.[currentRegion]?.[dateInfo.era as HistoricalEra];
      // Apply year-specific overrides (e.g., different rulers during ANTIQUITY)
      return applyYearRangeOverrides(baseFactionData, dateInfo.year);
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
      const savedTab = localStorage.getItem(LEFT_TAB_KEY) as LeftSidebarTab | null;
      if (savedTab && ['history', 'overview', 'analysis', 'nearby'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(LEFT_TAB_KEY, activeTab); } catch {} }, [activeTab]);

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

  // Memoize filtered NPCs based on search query
  const filteredNpcs = useMemo(() => {
    const list = (npcs || []);
    if (!npcQuery.trim()) return list;
    return list.filter(n =>
      n.name.toLowerCase().includes(npcQuery.toLowerCase()) ||
      (n.role || '').toLowerCase().includes(npcQuery.toLowerCase()) ||
      (n.class || '').toString().toLowerCase().includes(npcQuery.toLowerCase())
    );
  }, [npcs, npcQuery]);

  // Memoize secondary powers calculation
  const secondaryPowers = useMemo(() => {
    if (!factionData?.allegianceGroups) return [];
    const risingPowers = factionData.allegianceGroups.filter(group => group.type === 'rising') || [];
    const contestedPowers = factionData.allegianceGroups.filter(group => group.type === 'contested') || [];
    const rebelliousPowers = factionData.allegianceGroups.filter(group => group.type === 'rebel') || [];
    return [...risingPowers, ...contestedPowers, ...rebelliousPowers];
  }, [factionData]);

  // Memoize local languages calculation
  const localLanguages = useMemo(() => {
    if (!gameDate?.year) return [];
    return languageVisualizationService.getLanguagesByYear(gameDate.year)
      .filter(lang =>
        // Match by region
        lang.regions?.some(region =>
          currentRegion.toLowerCase().includes(region.toLowerCase()) ||
          region.toLowerCase().includes(currentRegion.toLowerCase())
        ) ||
        // Fallback: Match by cultural zone (check culturalZones array, not family name)
        (playerCharacter?.culturalZone && lang.culturalZones?.includes(playerCharacter.culturalZone))
      )
      .slice(0, 4); // Limit to 4 most relevant
  }, [gameDate?.year, currentRegion, playerCharacter?.culturalZone]);

  // Memoize POI counts
  const poiCounts = useMemo(() => ({
    ruins: pointsOfInterest.filter(poi => poi.structureType?.toLowerCase().includes('ruin')).length,
    fortresses: pointsOfInterest.filter(poi => poi.structureType?.toLowerCase().includes('fortress')).length,
    mills: pointsOfInterest.filter(poi => poi.structureType?.toLowerCase().includes('mill')).length,
    minerals: Array.from(mineralDeposits.values()).reduce((a, b) => a + b, 0),
    people: npcs?.length || 0
  }), [pointsOfInterest, mineralDeposits, npcs?.length]);

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
          "flex items-center justify-center gap-2 px-2 py-2 rounded-md border text-sm transition-all",
          active
            ? "bg-accent border-accent-active text-white shadow-md"
            : "surface-muted text-text-primary hover:shadow-md"
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
          <div className="surface-card rounded-2xl p-3 border" style={{ borderColor: 'var(--surface-card-border)' }}>
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-2 font-bold">
              {currentMapArchetype ? formatEnumString(currentMapArchetype).replace('_', ' ') : 'STANDARD'} MAP
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="surface-muted rounded-lg p-2">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Entities</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-sky-600 dark:text-sky-300">{npcs?.length || 0}</span>
                  <span className="text-xs text-[var(--text-muted)]">NPCs</span>
                </div>
              </div>
              <div className="surface-muted rounded-lg p-2">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Wildlife</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">{animals?.length || 0}</span>
                  <span className="text-xs text-[var(--text-muted)]">Animals</span>
                </div>
              </div>
              <div className="surface-muted rounded-lg p-2">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Water</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-cyan-600 dark:text-cyan-300">{biomeStats.waterPercent}%</span>
                  <span className="text-xs text-[var(--text-muted)]">Coverage</span>
                </div>
              </div>
              <div className="surface-muted rounded-lg p-2">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Urban</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-300">{biomeStats.urbanPercent}%</span>
                  <span className="text-xs text-[var(--text-muted)]">Developed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Lenses - Redesigned */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">STRATEGIC LENSES</span>
              <div className="flex items-center gap-2">
                {activeLens !== 'none' && (
                  <button
                    onClick={() => setActiveLens('none' as LensMode)}
                    className="text-[10px] px-1.5 py-0.5 rounded badge-pill"
                    data-variant="accent"
                    title="Clear active lens"
                  >
                    Clear
                  </button>
                )}
                <span className="text-[10px] text-[var(--text-muted)]">6</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {lensDefs.map(lens => {
                const active = activeLens === lens.id;
                return (
                  <button
                    key={lens.id}
                    title={lens.desc}
                    onClick={() => setActiveLens(lens.id)}
                    className={`
                      flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-colors
                      ${active
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                        : 'surface-muted text-[var(--text-secondary)] hover:shadow-md'}
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
              <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">TERRAIN COMPOSITION</span>
              <span className="text-[10px] text-[var(--text-muted)]">{biomeStats.distribution.length}</span>
            </div>
            <div className="space-y-1">
              {biomeStats.distribution.map(({ biome, percent }) => (
                <div key={biome} className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-primary)] flex-1 truncate">
                    {biome.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-20 h-1 bg-[rgba(189,179,162,0.35)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] w-8 text-right">{percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources & Minerals - Enhanced */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">RESOURCE DEPOSITS</span>
              <span className="text-[10px] text-[var(--text-muted)]">{mineralDeposits.size}</span>
            </div>
            {mineralDeposits.size > 0 ? (
              <div className="space-y-2">
                {Array.from(mineralDeposits.entries()).map(([name, count]) => {
                  const icon = name.toLowerCase().includes('gold') ? '🟡' :
                              name.toLowerCase().includes('silver') ? '⚪' :
                              name.toLowerCase().includes('copper') ? '🟠' :
                              name.toLowerCase().includes('iron') ? '⚫' : '💎';
                  return (
                    <div key={name} className="flex items-center justify-between p-1.5 surface-muted rounded-lg">
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{icon}</span>
                        <span className="text-[11px] text-[var(--text-primary)] font-medium">{name}</span>
                      </span>
                      <span className="text-[10px] badge-pill" data-variant="accent">
                        {count} {count === 1 ? 'tile' : 'tiles'}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(189, 179, 162, 0.35)' }}>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Total resource tiles: {Array.from(mineralDeposits.values()).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)]">No deposits found</p>
            )}
          </div>

          {/* Points of Interest - Grouped */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">LANDMARKS</span>
              <span className="text-[10px] text-[var(--text-muted)]">{pointsOfInterest.length}</span>
            </div>
            {Object.entries(groupedPOIs).map(([type, pois]) => (
              <div key={type} className="mb-3">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {type.replace(/_/g, ' ')}
                </div>
                <div className="space-y-1">
                  {pois.map(poi => (
                    <button
                      key={poi.id}
                      onClick={() => handlePoiClick(poi)}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg surface-muted hover:shadow-md text-left transition-colors"
                    >
                      <span className="text-base">{STRUCTURE_BLUEPRINTS[poi.structureType]?.icon || '📍'}</span>
                      <span className="text-[11px] text-[var(--text-primary)] truncate">{poi.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {pointsOfInterest.length === 0 && (
              <p className="text-[10px] text-[var(--text-muted)]">No landmarks found</p>
            )}
          </div>

          {/* Terrain Analysis Button */}
          <button
            onClick={() => setIsMapDetailsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 btn-secondary text-sm font-medium"
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

      // Use memoized secondary powers, local languages, and counts
      const { ruins: ruinCount, fortresses: fortressCount, mills: millCount, minerals: mineralCount, people: peopleCount } = poiCounts;

      return (
        <div className="left-sidebar-overview flex flex-col h-full">
          <div className="flex-1  space-y-4 text-sm text-[var(--text-primary)]">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)] mb-2 px-1">Dominant Power</h4>
              <button
                type="button"
                className="w-full surface-card rounded-xl px-3 py-2.5 flex items-center gap-3 text-left transition-all hover:shadow-md hover:scale-[1.01]"
                onClick={() => onShowFactionsModal?.(factionData)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onShowFactionTooltip?.(factionData, rect.right, rect.top);
                }}
                onMouseLeave={() => onHideFactionTooltip?.()}
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 dark:bg-white/10">
                  <FactionIcon className="w-8 h-8" style={{ color: factionIconData?.color || '#3f5b64' }} />
                </span>
                <span>
                  <p className="text-base font-semibold text-[var(--text-primary)]">{dominantPower}</p>
                  <span className="text-[11px] text-[var(--text-secondary)]">Tap for faction details</span>
                </span>
              </button>
              {factionData?.dominantPowerDescription && (
                <p className=" mt-3 opacity-90 text-[0.9rem] text-[var(--text-primary)] leading-relaxed italic">
                  {factionData.dominantPowerDescription}
                </p>
              )}

              {/* Rising/Contested Powers */}
              {secondaryPowers.length > 0 && (
                <div className="mt-3 px-1">
                  <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">Other Powers</div>
                  <div className="text-xs text-[var(--text-primary)] mt-1 leading-relaxed">
                    {secondaryPowers.map(power => power.name).join(', ')}
                  </div>
                </div>
              )}

              <div className="mt-4 h-px bg-white/10" />

              {majorCity && (
                <>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">Major City</h4>
                      {majorCity.foundingYear && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Founded {majorCity.foundingYear < 0 ? `${Math.abs(majorCity.foundingYear)} BCE` : `${majorCity.foundingYear}`}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="surface-card rounded-xl px-4 py-2.5 w-full text-left transition-all hover:shadow-md hover:scale-[1.01] mb-3"
                      onClick={() => {
                        setCityHistoricalModalData({
                          cityName: majorCity.name,
                          cityDescription: majorCity.description
                        });
                      }}
                      title="Click to explore historical details"
                    >

                      <p className="text-lg font-semibold text-sky-700 dark:text-sky-300">{majorCity.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">{majorCity.description}</p>
                    </button>

                

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
                              className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] text-[var(--text-secondary)] border ${borderColor} dark:bg-transparent`}
                              title={sector}
                            >
                              {sector.toLowerCase()}
                            </span>
                          );

                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Local Languages */}
              {localLanguages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-2 px-1">
                    Local Languages
                  </h4>
                  <div className="surface-card rounded-xl p-2">
                  <div className="space-y-2">
                    {localLanguages.map((lang, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedLanguageId(lang.id);
                          setShowLanguageTree(true);
                        }}
                        className="block w-full text-left language-tile px-3 py-2 transition-all"
                      >
                        <span className="font-semibold text-base language-tile__name">{lang.name}</span>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <span className="text-xs text-[var(--text-muted)] ml-2">({lang.nativeName})</span>
                        )}
                        <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-0.5">{lang.family}</div>
                      </button>
                    ))}
                  </div>
                  </div>
                </div>
              )}

              <h4 className="text-xs uppercase tracking-wide font-semibold text-[var(--text-secondary)] mb-2 mt-6 px-1">Description</h4>
              <p className="text-[0.85rem] text-[var(--text-primary)] leading-[1.6] px-1 opacity-85">
                {finalDesc}
              </p>

              {/* Summary Counts */}
              <div className="mt-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  {ruinCount > 0 && (
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className="badge-pill text-[10px] opacity-80" data-variant="accent"
                    >
                      <span className="font-bold text-[var(--accent-primary)]">{ruinCount}</span>
                      <span className="ml-1">ruin{ruinCount !== 1 ? 's' : ''}</span>
                    </button>
                  )}
                  {millCount > 0 && (
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className="badge-pill text-[10px] opacity-80" data-variant="accent"
                    >
                      <span className="font-bold text-[var(--accent-primary)]">{millCount}</span>
                      <span className="ml-1">mill{millCount !== 1 ? 's' : ''}</span>
                    </button>
                  )}
                  {fortressCount > 0 && (
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className="badge-pill text-[10px] opacity-80" data-variant="accent"
                    >
                      <span className="font-bold text-[var(--accent-primary)]">{fortressCount}</span>
                      <span className="ml-1">fortress{fortressCount !== 1 ? 'es' : ''}</span>
                    </button>
                  )}
                  {mineralCount > 0 && (
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className="badge-pill text-[10px] opacity-80" data-variant="accent"
                    >
                      <span className="font-bold text-[var(--accent-primary)]">{mineralCount}</span>
                      <span className="ml-1">deposit{mineralCount !== 1 ? 's' : ''}</span>
                    </button>
                  )}
                  {peopleCount > 0 && (
                    <button
                      onClick={() => setActiveTab('nearby')}
                      className="badge-pill text-[10px] opacity-80" data-variant="accent"
                    >
                      <span className="font-bold text-[var(--accent-primary)]">{peopleCount}</span>
                      <span className="ml-1">people</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Sources Banner */}
          {sourceCount > 0 && (
            <div className="relative mt-4 py-2">
              <button
                onClick={() => setActiveTab('history')}
                className="w-full surface-muted rounded-xl px-3 py-2 flex items-center justify-between group hover:shadow-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {sourceCount} historical source{sourceCount !== 1 ? 's' : ''} available
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors">
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

    if (tab === 'nearby') {
      const npcList = (npcs || []).slice(0, 6);
      const animalList = (animals || []).slice(0, 6);

      return (
        <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
          {/* NPCs Section */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary flex justify-between items-center shrink-0">
              <span>Nearby People</span>
              <span className="text-[10px] text-text-muted">
                {npcList.length}{(npcs?.length || 0) > 6 ? `/${npcs?.length}` : ''}
              </span>
            </h4>
            {npcList.length > 0 ? (
              <div className="space-y-1.5">
                {npcList.map(npc => (
                  <NpcListItem
                    key={npc.id}
                    npc={npc}
                    isSelected={selectedNpcId === npc.id}
                    isHighlighted={highlightedNpcId === npc.id}
                    onClick={(clickedNpc) => {
                      if (clickedNpc.x !== undefined && clickedNpc.y !== undefined) {
                        window.dispatchEvent(new CustomEvent('centerMapOnLocation', {
                          detail: { x: clickedNpc.x, y: clickedNpc.y }
                        }));
                        import('../services/eventBus').then(({ eventBus }) => {
                          eventBus.emit('npc:highlight', { npcId: clickedNpc.id });
                        });
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic py-2">No people nearby.</p>
            )}
          </div>

          {/* Animals Section */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary flex justify-between items-center shrink-0">
              <span>Observed Wildlife</span>
              <span className="text-[10px] text-text-muted">
                {animalList.length}{(animals?.length || 0) > 6 ? `/${animals?.length}` : ''}
              </span>
            </h4>
            {animalList.length > 0 ? (
              <div className="space-y-1.5">
                {animalList.map(animal => (
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
              <p className="text-sm text-text-muted italic py-2">No animals observed.</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Flattened tabs - hide Analysis in HistoryLens mode since it's map-specific
  const visibleTabs = useMemo(() => {
    const allTabs: { id: LeftSidebarTab; label: string }[] = [
      { id: 'history', label: 'History' },
      { id: 'overview', label: 'Overview' },
      { id: 'analysis', label: 'Analysis' },
      { id: 'nearby', label: 'Nearby' },
    ];
    if (centralMode === 'historylens') {
      return allTabs.filter(tab => tab.id !== 'analysis');
    }
    return allTabs;
  }, [centralMode]);

  return (
    <>
      <div
        data-surface="sidebar-left"
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
          {/* Collapse button - always visible */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsContentCollapsed(prev => !prev)}
              className="text-[11px] uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary transition-colors"
              aria-label={isContentCollapsed ? 'Expand sidebar content' : 'Collapse sidebar content'}
            >
              {isContentCollapsed ? 'Expand' : 'Collapse'}
            </button>
            <button
              onClick={() => setIsLeftSidebarExpanded(false)}
              className="text-text-secondary hover:text-text-primary transition-colors opacity-60 hover:opacity-100 p-1"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Header card - hidden in HistoryLens mode */}
          {centralMode !== 'historylens' && (
          <div className="p-4 rounded-xl surface-card mb-4 relative">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 items-baseline">
              <div
                className="cursor-pointer sidebar-meta -m-1 pr-3"
                onClick={() => setShowLifeEventsCalendar(true)}
                title="View life events calendar"
              >
                <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-1">Date</p>
                <p className="text-[17px] font-bold text-accent-secondary leading-tight">{formattedFullDate}</p>
                <p className={`text-xs mt-0.5 capitalize font-medium ${getSeasonColor(season)}`}>{season}</p>
              </div>
              <div
                className="cursor-pointer sidebar-meta -m-1"
                onClick={onToggleMapVisibility}
                title="Click to toggle map visibility"
              >
                <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-1">Time</p>
                <p className="text-[17px] font-bold text-accent-secondary leading-tight">{formattedTime}</p>
                <p className="text-xs text-text-muted mt-0.5 capitalize">{currentTimeOfDay.toLowerCase()}</p>
              </div>
              <div className="pr-3 border-r border-[var(--surface-muted-border)]">
                <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-1.5">Zone</p>
                <div className="flex items-center gap-1.5">
                  {React.createElement(getCulturalZoneIcon(currentZone), { className: "w-3.5 h-3.5 text-text-secondary flex-shrink-0" })}
                  <p className="text-sm text-text-primary font-semibold leading-tight truncate">{getDisplayZone(currentZone, currentRegion)}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-1.5">Climate</p>
                <p className="text-sm font-semibold text-accent-primary leading-tight">{formatEnumString(currentMapClimate)}</p>
              </div>
              <div className="pr-3 border-r border-[var(--surface-muted-border)]">
                <p className="text-[11px] text-cyan-500 dark:text-cyan-400 uppercase tracking-wide mb-1.5">Region</p>
                <p className="text-sm font-semibold text-text-primary leading-tight">{currentRegion}</p>
              </div>
              <div>
                <p className="text-[11px] text-emerald-500 dark:text-emerald-400 uppercase tracking-wide mb-1.5">Map Area</p>
                <p className="text-sm font-semibold text-text-primary leading-tight">{localArea}</p>
              </div>
            </div>
          </div>
          )}

          {/* Liminal Progress Bar - only shows during liminal travel */}
          <LiminalProgressBar liminalTravelState={liminalTravelState} />

          {/* Flattened tabs */}
          <div className="tab-strip-flat rounded-xl mb-2">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tab-flat ${activeTab === tab.id ? 'is-active' : ''}`}
                data-tab-type={tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          className={`flex-1 overflow-hidden flex flex-col min-h-0 gap-3 transition-all duration-300 ease-out ${
            isContentCollapsed
              ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
              : 'max-h-[2000px] opacity-100 translate-y-0'
          }`}
        >
          {activeTab === 'history' && (
            <div className="flex-1 overflow-hidden surface-card rounded-2xl">
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
          {(activeTab === 'overview' || activeTab === 'analysis' || activeTab === 'nearby') && (
            <div className="flex-1 surface-card rounded-2xl p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600/60 scrollbar-track-slate-800/30 flex flex-col min-h-0">
              {getSubTabContent(activeTab)}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Life Events Calendar Modal */}
      {showLifeEventsCalendar && playerCharacter && (
        <LifeEventsCalendarModal
          characterName={playerCharacter.name}
          birthYear={gameDate.year - playerCharacter.age}
          currentYear={gameDate.year}
          lifeEvents={playerCharacter.lifeEvents || []}
          onClose={() => setShowLifeEventsCalendar(false)}
        />
      )}
    </>
  );
};

export default React.memo(LeftSidebar);
