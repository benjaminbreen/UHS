/**
 * components/LeftSidebar.tsx
 * Compact, legible sidebar with:
 * - NPC tiles using ProceduralPortrait + badges (class/profession/age/gender)
 * - Quick NPC search
 * - Strategic Lenses as a 2-row grid of buttons (with hover tooltips)
 * - Sticky user prefs for width and last-opened tabs
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Crown, Building, Users, Heart, BookOpen } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import {
  AnimalEntity, NpcEntity, isAnimal, isNpc, LensMode, MapArchetype, CulturalZone,
  HistoricalEra, TerrainStructure
} from '../types';
import { generateAnimalDescriptions } from '../services/animalDescriptionGenerator';
import { parseDateString } from '../utils/dateUtils';
import HistoryPanel from './HistoryPanel';
import JournalPanel from './JournalPanel';
import { MAP_ARCHETYPE_DESCRIPTIONS, FACTION_DATA, STRUCTURE_BLUEPRINTS, METALS } from '../constants/index';
import { mapLocationToCulture } from '../utils/mapUtils';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import { getDominantSector, getPrimaryIndustry, EconomicSector } from '../constants/gameData/economicSectors';
import { primarySourceService } from '../services/primarySourceService';
import { ProceduralPortrait } from './portraits';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export type LeftSidebarTab = 'analysis' | 'overview' | 'npcs' | 'animals';
type MajorTab = 'map' | 'history' | 'journal';

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 380;

const SIDEBAR_WIDTH_KEY = 'uhs.sidebarWidth';
const MAP_TAB_KEY = 'uhs.mapSubTab';
const MAJOR_TAB_KEY = 'uhs.majorTab';

/* -------------------------------------------------------------------------- */
/* Small shared bits                                                          */
/* -------------------------------------------------------------------------- */

const AnalysisListItem: React.FC<{ icon: string, name: string, subtext: string, onClick: () => void }> = ({ icon, name, subtext, onClick }) => (
  <li
    onClick={onClick}
    className="flex items-center p-2 rounded-md cursor-pointer transition-colors duration-150 hover:bg-slate-700/50"
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
        className="w-full flex justify-between items-center text-left font-semibold text-blue-300 mb-2 p-2 rounded-md hover:bg-slate-800/40"
      >
        <span className="flex items-center gap-2">
          {title}
          {typeof count === 'number' && (
            <span className="text-xs font-mono bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded-md">{count}</span>
          )}
        </span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
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
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-gray-300 hover:bg-slate-700/60 hover:shadow-sm ${isSelected ? 'bg-blue-800/70 text-white shadow-md ring-1 ring-blue-400/50' : ''}`}
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
  ({ npc, isSelected, onClick }: { npc: NpcEntity; isSelected: boolean; onClick: (npc: NpcEntity) => void }) => {
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
          "group w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all border",
          isSelected
            ? "bg-blue-800/60 border-blue-400/50 text-white shadow-md ring-1 ring-blue-400/40"
            : "bg-slate-800/40 hover:bg-slate-700/50 border-slate-700/40 hover:border-slate-600/60 text-gray-200"
        ].join(" ")}
      >
        {/* Portrait */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-md overflow-hidden border border-slate-600/70 shadow-sm bg-slate-700/60">
            <ProceduralPortrait character={npc} size={44} />
          </div>
        </div>

        {/* Text block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-slate-100 truncate">{npc.name}</p>
          </div>

          {/* Profession • Class */}
          <div className="text-xs text-slate-300 truncate">
            <span className="capitalize text-green-300">{npc.role || "unknown"}</span>
            <span className="mx-1 text-slate-500">•</span>
            <span className="capitalize">{(npc.class || "commoner").toString().toLowerCase()}</span>
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
}> = ({
  onShowFactionsModal,
  onShowFactionTooltip,
  onHideFactionTooltip,
  onToggleMapVisibility
}) => {
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
  const [sourceCount, setSourceCount] = useState<number>(0);
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [npcQuery, setNpcQuery] = useState<string>('');
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(DEFAULT_SIDEBAR_WIDTH);

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
          "flex items-center justify-center gap-2 px-2 py-2 rounded-md border text-sm transition-all",
          active
            ? "bg-amber-600/25 border-amber-500/60 text-amber-200 shadow-md"
            : "bg-slate-800/45 hover:bg-slate-700/60 border-slate-700/60 text-slate-200"
        ].join(" ")}
      >
        <span className="text-base leading-none">{lens.icon}</span>
        <span className="font-medium">{lens.name}</span>
      </button>
    );
  };

  /* ----- tab content ----- */
  const getSubTabContent = (tab: LeftSidebarTab) => {
    if (tab === 'analysis') {
      return (
        <div className="space-y-4">
          {/* Map Archetype */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-3">
            <div className="text-xs text-blue-200 uppercase tracking-wide mb-1">Map Archetype</div>
            <div className="text-sm font-semibold text-blue-100">
              {currentMapArchetype ? formatEnumString(currentMapArchetype) : 'Unknown'}
            </div>
          </div>

          {/* Strategic Lenses — compact 2-row grid */}
          <CollapsibleSection title="🔍 Strategic Lenses" count={6} startOpen>
            <div className="text-xs text-slate-400 mb-2">
              Visualize complex data directly on the map
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {lensDefs.slice(0, 3).map(l => <LensButton key={l.id} lens={l} />)}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {lensDefs.slice(3, 6).map(l => <LensButton key={l.id} lens={l} />)}
            </div>

            {activeLens !== 'none' && (
              <div className="mt-2">
                <button
                  onClick={() => setActiveLens('none' as LensMode)}
                  className="text-xs px-2 py-1 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-200 transition-colors"
                >
                  Clear Active Lens
                </button>
              </div>
            )}
          </CollapsibleSection>

          {/* Map Details */}
          <div className="space-y-2">
            <button
              onClick={() => setIsMapDetailsModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/50 text-emerald-200 rounded-lg transition-all duration-200 font-medium"
            >
              <BarChart className="w-5 h-5" />
              <span>Detailed Terrain Analysis</span>
            </button>
          </div>

          {/* Minerals */}
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

          {/* POIs */}
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

    if (tab === 'overview') {
      const { majorCity } = mapData || {};

      const sentence1 = `Located in the ${currentRegion}, ${localArea} is a ${currentMapClimate.toLowerCase()} region.`;
      const yearDisplay = gameDate.year < 0 ? `${Math.abs(gameDate.year)} BCE` : `${gameDate.year} CE`;
      const sentence2 = `The year is ${yearDisplay}, ${factionData?.eraContextSentence || 'a time of local conflicts and shifting allegiances.'}`;
      const finalDesc = `${sentence1} ${sentence2}`;
      const dominantPower = factionData?.dominantPower || "Local Tribes";

      return (
        <div className="flex flex-col h-full">
          <div className="space-y-5 text-sm text-gray-300 flex-1">
            <div>
              <h4 className="font-semibold text-amber-300 mb-2 border-b border-gray-600/50 pb-2 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Dominant Power
              </h4>
              <div
                className="cursor-pointer hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
                onClick={() => onShowFactionsModal?.(factionData)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onShowFactionTooltip?.(factionData, rect.right, rect.top);
                }}
                onMouseLeave={() => onHideFactionTooltip?.()}
              >
                <p className="text-lg font-bold text-amber-400">{dominantPower}</p>
              </div>
              {factionData?.dominantPowerDescription && (
                <blockquote className="border-l-2 border-amber-600/50 pl-3 italic text-amber-200/80 leading-relaxed text-xs">
                  {factionData.dominantPowerDescription}
                </blockquote>
              )}

              {majorCity && (
                <>
                  <h4 className="font-semibold text-cyan-300 mb-3 mt-4 border-b border-gray-600/50 pb-2 flex items-center gap-2">
                    <Building className="w-5 h-5" />
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

          {/* Primary Sources Banner */}
          {sourceCount > 0 && (
            <button
              onClick={() => setActiveMajorTab('history')}
              className="mt-4 w-full bg-gradient-to-r from-amber-600/20 to-amber-500/20 hover:from-amber-600/30 hover:to-amber-500/30 border border-amber-500/50 rounded-lg p-3 flex items-center justify-between group transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">
                  {sourceCount} historical source{sourceCount !== 1 ? 's' : ''} available
                </span>
              </div>
              <span className="text-xs text-amber-400/80 group-hover:text-amber-300 transition-colors">
                Click to view →
              </span>
            </button>
          )}
        </div>
      );
    }

    if (tab === 'animals') {
      return (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-blue-300 flex justify-between items-center shrink-0">
            <span>Observed Wildlife</span>
            <span className="bg-gray-600 text-gray-200 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
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
            <span className="bg-gray-600 text-gray-200 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
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
                  onClick={setInfoModalTarget}
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
    <div
      className={getSafariOptimizedClassName(`relative flex-shrink-0 bg-sidebar-gradient shadow-sidebar-left backdrop-blur-xl border-r border-slate-700/80 flex flex-col text-slate-200 transition-all duration-300 h-full`)}
      style={{ width: isLeftSidebarExpanded ? `${sidebarWidth}px` : '0px' }}
    >
      {/* Resize handle */}
      {isLeftSidebarExpanded && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-400/30 transition-colors z-10"
          style={{ width: '4px' }}
        />
      )}

      <div className={`p-3 flex flex-col flex-1 overflow-hidden transition-opacity duration-200 ${isLeftSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="shrink-0">
          {/* Header card */}
          <div className="p-4 rounded-xl bg-slate-800/70 mb-4 shadow-lg border border-slate-700/50 relative">
            <button onClick={() => setIsLeftSidebarExpanded(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white text-lg leading-none">&lt;&lt;</button>
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div>
                <p className="text-xs text-slate-400">Date:</p>
                <p className="text-lg text-amber-300 font-bold">{formattedFullDate}</p>
                <p className="text-sm text-slate-300">({season})</p>
              </div>
              <div 
                className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-1 -m-1 transition-colors"
                onClick={onToggleMapVisibility}
                title="Click to toggle map visibility"
              >
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
                {/* quick society summary (kept from your original logic if computed elsewhere) */}
              </div>
              <div>
                <p className="text-xs text-slate-400">Map Area:</p>
                <p className="text-base font-bold text-green-400">{localArea}</p>
              </div>
              <div className="text-amber-200/80 leading-relaxed text-xs">
                {/* primary resource description placeholder */}
              </div>
            </div>
          </div>

          {/* Major tabs */}
          <div className="flex mb-2 bg-slate-800/60 rounded-lg p-1 border border-slate-700/50 shadow-sm">
            {majorTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveMajorTab(tab.id)}
                className={`flex-1 py-2.5 px-2 text-center text-sm font-semibold rounded-md transition-all duration-200 ${activeMajorTab === tab.id ? `${tab.color} text-white shadow-lg ${tab.glow} transform scale-105` : 'text-slate-300 hover:bg-slate-700/60 hover:text-white hover:shadow-sm'}`} >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeMajorTab === 'map' && renderMapTabContent()}
          {activeMajorTab === 'history' && (
            <div className="flex-1 overflow-hidden bg-slate-900/40 rounded-lg border border-slate-700/50 shadow-inner">
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
