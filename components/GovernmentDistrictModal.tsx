/**
 * components/GovernmentDistrictModal.tsx - Government district exploration modal
 * -----------------------------------------------------------------------------
 * Goals in this replacement:
 *   1) Shift the panel up ~10px to reveal the map's inset border at the bottom.
 *   2) Fix the top tint overlays so they begin exactly at the header's top edge.
 *   3) Make layout more responsive on small screens (header height, paddings, grid).
 *   4) Move allegiance/faction badge to the top-right overlay over the banner.
 *   5) Keep prop signature & integrations intact; do not change external APIs.
 *   6) Add subtle UX boosts: Escape to close, focus trap, ARIA, reduced motion fallbacks.
 *
 * This file is intentionally verbose (heavily commented) as a long-form, drop-in replacement.
 */

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  KeyboardEvent,
  useCallback,
  Fragment,
} from 'react';

import {
  TerrainStructure,
  Tile,
  PlayerCharacter,
  MapData,
  HistoricalEra,
  CulturalZone,
  TimeOfDay,
} from '../types';

import { selectGovernmentType, getLeaderTitles } from '../constants/gameData/governmentDistricts';
import { SpecialMapArchetype, SpecialMapConfig } from '../types/specialMapTypes';
import { SPECIAL_MAP_REGISTRY } from '../constants/specialMaps/specialGeography';
import { normalizeCulturalZone } from '../utils/specialMapUtils';
import GovernmentDistrictBanner from './GovernmentDistrictBanner';
import TimeAwareBackground from './TimeAwareBackground';
import { ProceduralPortrait } from './portraits';
import { getFactionData } from '../constants/gameData/factionIcons';
import { FACTION_DATA } from '../constants/gameData/factions';
import { weatherService } from '../services/weatherService';
import { generateHistoricalName, getHistoricalPeriod } from '../constants/characterData/names';
import { generateBaseProfile } from '../generation/common/npcUtils';
import { ValueNoise } from '../utils/noise';

import {
  FaLandmark,
  FaUniversity,
  FaGavel,
  FaScroll,
  FaBuilding,
  FaCrown,
  FaUsers,
  FaChartLine,
  FaHistory,
  FaMapMarkedAlt,
  FaDoorOpen,
  FaExclamationTriangle,
  FaCompass,
  FaBalanceScale,
  FaRegClock,
  FaTimes,
  FaTheaterMasks,
  FaStore,
  FaTree,
  FaCampground,
  FaBed,
  FaShip,
  FaHome,
} from 'react-icons/fa';

import {
  GiGreekTemple,
  GiCapitol,
  GiCastle,
  GiIndianPalace,
  GiAncientColumns,
  GiScrollQuill,
  GiThroneKing,
  GiLaurelCrown,
  GiScales,
} from 'react-icons/gi';

/* ================================================================================================
   Utilities
================================================================================================ */

const getEraFromYear = (year: number): HistoricalEra => {
  // Keep your original cut points to avoid downstream surprises.
  if (year < -3000) return HistoricalEra.PREHISTORY;
  if (year < 500) return HistoricalEra.ANTIQUITY;
  if (year < 1500) return HistoricalEra.MEDIEVAL;
  if (year < 1800) return HistoricalEra.RENAISSANCE_EARLY_MODERN;
  if (year < 1950) return HistoricalEra.INDUSTRIAL_ERA;
  if (year < 2050) return HistoricalEra.MODERN_ERA;
  return HistoricalEra.FUTURE_ERA;
};

const getCulturalZone = (continent?: string, region?: string): CulturalZone => {
  // Slightly stricter mapping (preserves your defaults)
  const loc = `${continent || ''} ${region || ''}`.toLowerCase();
  if (loc.includes('east asia') || (loc.includes('asia') && !loc.includes('south'))) return 'EAST_ASIAN';
  if (loc.includes('south asia') || loc.includes('india')) return 'SOUTH_ASIAN';
  if (loc.includes('north africa') || loc.includes('mena') || loc.includes('middle east')) return 'MENA';
  if (loc.includes('sub-saharan') || (loc.includes('africa') && !loc.includes('north'))) return 'SUB_SAHARAN_AFRICAN';
  if (loc.includes('oceania') || loc.includes('polynesia') || loc.includes('melanesia')) return 'OCEANIA';
  if (loc.includes('south america')) return 'SOUTH_AMERICAN';  // Fix for South America
  if (loc.includes('north america') && !loc.includes('colonial')) return 'NORTH_AMERICAN_PRE_COLUMBIAN';
  if (loc.includes('america') && !loc.includes('north') && !loc.includes('south')) return 'INDIGENOUS_AMERICAN';
  return 'EUROPEAN';
};

const getArchetypeIcon = (archetype: SpecialMapArchetype): React.ReactNode => {
  switch (archetype) {
    // New simplified archetypes
    case SpecialMapArchetype.ESTATES:
      return <GiThroneKing size={24} className="text-amber-500" />;
    case SpecialMapArchetype.GOVERNMENT:
      return <GiCapitol size={24} className="text-amber-500" />;
    case SpecialMapArchetype.ARENA_THEATER:
      return <FaTheaterMasks size={24} className="text-amber-500" />;
    case SpecialMapArchetype.UNIVERSITY_MONASTERY:
      return <FaUniversity size={24} className="text-amber-500" />;
    case SpecialMapArchetype.MARKET_EXHIBITION:
      return <FaStore size={24} className="text-amber-500" />;
    case SpecialMapArchetype.OPEN_FIELD:
      return <FaTree size={24} className="text-amber-500" />;
    case SpecialMapArchetype.CAMPGROUND:
      return <FaCampground size={24} className="text-amber-500" />;
    case SpecialMapArchetype.RESTAURANT_INN:
      return <FaBed size={24} className="text-amber-500" />;
    case SpecialMapArchetype.VESSEL:
      return <FaShip size={24} className="text-amber-500" />;
    case SpecialMapArchetype.PLAYER_HOME:
      return <FaHome size={24} className="text-amber-500" />;
      
    // Legacy archetypes (map to new ones)
    case SpecialMapArchetype.PALACE_COMPLEX:
      return <GiIndianPalace size={24} className="text-amber-500" />;
    case SpecialMapArchetype.GOVERNMENT_FORUM:
      return <GiCapitol size={24} className="text-amber-500" />;
    case SpecialMapArchetype.SACRED_COMPLEX:
      return <GiGreekTemple size={24} className="text-amber-500" />;
    case SpecialMapArchetype.MILITARY_FORTRESS:
      return <GiCastle size={24} className="text-amber-500" />;
    case SpecialMapArchetype.UNIVERSITY:
      return <FaUniversity size={24} className="text-amber-500" />;
    case SpecialMapArchetype.MARKET_BAZAAR:
      return <FaBuilding size={24} className="text-amber-500" />;
    default:
      return <FaLandmark size={24} className="text-amber-500" />;
  }
};

/** Deterministic seeded "random" for stable UI mock values. */
const seeded = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  const next = () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
  const rangeInt = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  return { next, rangeInt };
};

/** Parse year out of either a string "March 9, 306 BCE" or {year, month, ...}. */
const parseYear = (formattedDate?: string | { year: number; month?: number; day?: number }): number => {
  if (!formattedDate) return 1500;
  if (typeof formattedDate === 'object' && typeof formattedDate.year === 'number') return formattedDate.year;

  if (typeof formattedDate === 'string') {
    const m = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/i);
    if (!m) return 1500;
    let y = parseInt(m[1], 10);
    const era = (m[2] || '').toUpperCase();
    if (era === 'BC' || era === 'BCE') y = -y;
    return y;
  }
  return 1500;
};

/** Format date for subtitle (keeps your display style). */
const formatDisplayDate = (formattedDate?: string | { year: number }): string => {
  if (!formattedDate) return 'Year 1500';
  if (typeof formattedDate === 'object' && typeof formattedDate.year === 'number') {
    return formattedDate.year < 0 ? `${Math.abs(formattedDate.year)} BCE` : `${formattedDate.year} CE`;
  }
  return String(formattedDate);
};

/* ================================================================================================
   Leader Appearance Helper Functions
================================================================================================ */

const getLeaderGarment = (zone: CulturalZone | string, era: HistoricalEra, year: number) => {
  const garments: Record<string, Record<string, { name: string; material: string }>> = {
    'EUROPEAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'toga praetexta', material: 'fine wool' },
      [HistoricalEra.MEDIEVAL]: { name: 'noble tunic', material: 'silk' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'doublet', material: 'velvet' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'formal coat', material: 'wool' },
      [HistoricalEra.MODERN_ERA]: { name: 'business suit', material: 'wool' },
    },
    'EAST_ASIAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'hanfu robes', material: 'silk' },
      [HistoricalEra.MEDIEVAL]: { name: 'court robes', material: 'brocade' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'mandarin robes', material: 'silk' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'changshan', material: 'silk' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal attire', material: 'wool' },
    },
    'MENA': {
      [HistoricalEra.ANTIQUITY]: { name: 'fine tunic', material: 'linen' },
      [HistoricalEra.MEDIEVAL]: { name: 'embroidered robes', material: 'silk' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'kaftan', material: 'brocade' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'formal robes', material: 'wool' },
      [HistoricalEra.MODERN_ERA]: { name: 'thobe', material: 'cotton' },
    },
    'SOUTH_ASIAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'royal dhoti', material: 'silk' },
      [HistoricalEra.MEDIEVAL]: { name: 'court attire', material: 'muslin' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'sherwani', material: 'brocade' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'achkan', material: 'silk' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal kurta', material: 'silk' },
    },
    'SUB_SAHARAN_AFRICAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'leopard skin robe', material: 'fur' },
      [HistoricalEra.MEDIEVAL]: { name: 'royal kente', material: 'woven cloth' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'embroidered robes', material: 'cotton' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'agbada', material: 'embroidered cotton' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal attire', material: 'cotton' },
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'ceremonial robes', material: 'deerskin' },
      [HistoricalEra.MEDIEVAL]: { name: 'decorated tunic', material: 'buffalo hide' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'chief regalia', material: 'decorated leather' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'ceremonial dress', material: 'cloth and leather' },
      [HistoricalEra.MODERN_ERA]: { name: 'traditional regalia', material: 'mixed materials' },
    },
    'SOUTH_AMERICAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'feathered cloak', material: 'feathers and cloth' },
      [HistoricalEra.MEDIEVAL]: { name: 'royal tunic', material: 'vicuña wool' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'decorated poncho', material: 'alpaca wool' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'formal poncho', material: 'wool' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal attire', material: 'wool' },
    },
    'OCEANIA': {
      [HistoricalEra.ANTIQUITY]: { name: 'tapa cloth robes', material: 'bark cloth' },
      [HistoricalEra.MEDIEVAL]: { name: 'chief cloak', material: 'feathers' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'ceremonial cape', material: 'woven fibers' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'formal sarong', material: 'cotton' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal attire', material: 'cotton' },
    },
  };
  
  const defaultGarment = { name: 'formal robes', material: 'fine cloth' };
  return garments[zone]?.[era] || defaultGarment;
};

const getLeaderHeadgear = (zone: CulturalZone | string, era: HistoricalEra, title: string) => {
  const headgear: Record<string, Record<string, { name: string; material: string }>> = {
    'EUROPEAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'laurel wreath', material: 'gold leaf' },
      [HistoricalEra.MEDIEVAL]: { name: 'coronet', material: 'gold' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'velvet cap', material: 'velvet' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'top hat', material: 'felt' },
      [HistoricalEra.MODERN_ERA]: { name: 'none', material: 'none' },
    },
    'EAST_ASIAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'ceremonial crown', material: 'jade and gold' },
      [HistoricalEra.MEDIEVAL]: { name: 'official hat', material: 'silk' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'mandarin cap', material: 'silk' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'formal cap', material: 'silk' },
      [HistoricalEra.MODERN_ERA]: { name: 'none', material: 'none' },
    },
    'MENA': {
      [HistoricalEra.ANTIQUITY]: { name: 'diadem', material: 'gold' },
      [HistoricalEra.MEDIEVAL]: { name: 'turban', material: 'silk' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'ornate turban', material: 'brocade' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'fez', material: 'felt' },
      [HistoricalEra.MODERN_ERA]: { name: 'keffiyeh', material: 'cotton' },
    },
    'SOUTH_ASIAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'crown', material: 'gold' },
      [HistoricalEra.MEDIEVAL]: { name: 'turban', material: 'silk' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'jeweled turban', material: 'silk and gems' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'pagri', material: 'silk' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal turban', material: 'silk' },
    },
    'SUB_SAHARAN_AFRICAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'beaded crown', material: 'beads and gold' },
      [HistoricalEra.MEDIEVAL]: { name: 'royal cap', material: 'woven cloth' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'ceremonial headdress', material: 'cloth and beads' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'kufi', material: 'embroidered cloth' },
      [HistoricalEra.MODERN_ERA]: { name: 'traditional cap', material: 'cloth' },
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'feather headdress', material: 'eagle feathers' },
      [HistoricalEra.MEDIEVAL]: { name: 'ceremonial band', material: 'leather and beads' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'war bonnet', material: 'feathers' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'headband', material: 'beaded leather' },
      [HistoricalEra.MODERN_ERA]: { name: 'traditional headdress', material: 'mixed' },
    },
    'SOUTH_AMERICAN': {
      [HistoricalEra.ANTIQUITY]: { name: 'feathered crown', material: 'tropical feathers' },
      [HistoricalEra.MEDIEVAL]: { name: 'llautu', material: 'colored cord' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'ceremonial band', material: 'woven cloth' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'traditional hat', material: 'wool' },
      [HistoricalEra.MODERN_ERA]: { name: 'formal hat', material: 'felt' },
    },
    'OCEANIA': {
      [HistoricalEra.ANTIQUITY]: { name: 'shell crown', material: 'shells and fiber' },
      [HistoricalEra.MEDIEVAL]: { name: 'feather headdress', material: 'bird feathers' },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { name: 'ceremonial lei', material: 'flowers and leaves' },
      [HistoricalEra.INDUSTRIAL_ERA]: { name: 'traditional headdress', material: 'mixed materials' },
      [HistoricalEra.MODERN_ERA]: { name: 'none', material: 'none' },
    },
  };
  
  const defaultHeadgear = { name: 'ceremonial cap', material: 'fine cloth' };
  return headgear[zone]?.[era] || defaultHeadgear;
};

const getLeaderPalette = (zone: CulturalZone | string, era: HistoricalEra) => {
  const palettes: Record<string, { primary: string; secondary: string; accent: string }> = {
    'EUROPEAN': { primary: '#800020', secondary: '#FFD700', accent: '#FFFFFF' },
    'EAST_ASIAN': { primary: '#FFD700', secondary: '#DC143C', accent: '#000000' },
    'MENA': { primary: '#006400', secondary: '#FFD700', accent: '#FFFFFF' },
    'SOUTH_ASIAN': { primary: '#FF6347', secondary: '#FFD700', accent: '#FFFFFF' },
    'SUB_SAHARAN_AFRICAN': { primary: '#FFD700', secondary: '#8B0000', accent: '#000000' },
    'NORTH_AMERICAN_PRE_COLUMBIAN': { primary: '#8B4513', secondary: '#40E0D0', accent: '#FFD700' },
    'SOUTH_AMERICAN': { primary: '#DC143C', secondary: '#FFD700', accent: '#4B0082' },
    'OCEANIA': { primary: '#8B4513', secondary: '#FF6347', accent: '#F0E68C' },
  };
  
  return palettes[zone] || { primary: '#8B4513', secondary: '#DAA520', accent: '#FFD700' };
};

/* ================================================================================================
   Props
================================================================================================ */

interface GovernmentDistrictModalProps {
  structure: TerrainStructure;
  tile: Tile;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  currentLocation: string;
  formattedDate: string | { year: number; month: number; day: number };
  gameTimeHours?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  onClose: () => void;
  onEnterSpecialMap?: (config: SpecialMapConfig) => void;
}

/* ================================================================================================
   Component
================================================================================================ */

const GovernmentDistrictModal: React.FC<GovernmentDistrictModalProps> = ({
  structure,
  tile,
  playerCharacter,
  mapData,
  currentLocation,
  formattedDate,
  gameTimeHours = 12,
  season = 'summer',
  onClose,
  onEnterSpecialMap,
}) => {
  /* -----------------------------------------------------------------------
     Local State
  ----------------------------------------------------------------------- */
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'archives'>('overview');
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  // focus trap anchors
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  /* -----------------------------------------------------------------------
     Derived Context
  ----------------------------------------------------------------------- */

  const year = useMemo(() => parseYear(formattedDate), [formattedDate]);
  const displayDate = useMemo(() => formatDisplayDate(formattedDate), [formattedDate]);
  const era = useMemo(() => getEraFromYear(year), [year]);
  const culturalZone: CulturalZone = useMemo(
    () => getCulturalZone(mapData.continent, mapData.region),
    [mapData.continent, mapData.region]
  );

  const timeOfDay: TimeOfDay = useMemo(() => {
    const hour = gameTimeHours;
    if (hour >= 5 && hour < 7) return 'Dawn';
    if (hour >= 7 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 15) return 'Midday';
    if (hour >= 15 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 20) return 'Dusk';
    return 'Night';
  }, [gameTimeHours]);

  const weather = useMemo(() => {
    const dayOfYear = 180; // If you wire real date parsing, update this.
    return weatherService.getWeather(
      mapData.climate,
      tile.biome,
      season,
      timeOfDay,
      tile.altitude || 0.5,
      dayOfYear,
      { x: tile.x, y: tile.y }
    );
  }, [mapData.climate, tile, season, timeOfDay]);

  const locationKey = useMemo(() => {
    if (mapData.continent && mapData.region && mapData.localArea) {
      return `${mapData.continent.toLowerCase()}.${mapData.region.toLowerCase()}.${mapData.localArea.toLowerCase()}`;
    }
    return null;
  }, [mapData]);

  const availableSpecialMaps = useMemo(() => {
    if (!locationKey) return [];
    const registry = SPECIAL_MAP_REGISTRY[locationKey];
    if (!registry || !registry[era]) return [];

    const examples = registry[era].historicalExamples || [];
    if (examples.length > 0) return examples;

    // Generic fallback options by era
    const generic: Array<{
      name: string;
      description: string;
      icon: string;
      archetype: SpecialMapArchetype;
      dateRange: any;
    }> = [];

    generic.push({
      name: 'Administrative Center',
      description:
        `The main ${
          era === HistoricalEra.MODERN_ERA
            ? 'government offices'
            : era === HistoricalEra.MEDIEVAL
            ? 'royal court'
            : 'administrative complex'
        } of ${currentLocation}.`,
      icon: '🏛️',
      archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
      dateRange: formattedDate,
    });

    if (era !== HistoricalEra.MODERN_ERA && era !== HistoricalEra.FUTURE_ERA) {
      generic.push({
        name: 'Palace Complex',
        description: `The residence of the local ${era === HistoricalEra.MEDIEVAL ? 'lord' : 'ruler'}.`,
        icon: '👑',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        dateRange: formattedDate,
      });
    }

    if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generic.push({
        name: 'Fortress',
        description: 'Military stronghold and garrison.',
        icon: '🏰',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        dateRange: formattedDate,
      });
    }

    return generic;
  }, [locationKey, era, currentLocation, formattedDate]);

  // Deterministic seeded data for line items
  const seed = structure.location[0] * 997 + structure.location[1] * 577;
  const rnd = useMemo(() => seeded(seed), [seed]);

  const governmentType = useMemo(() => {
    // keep your original call signature to avoid surprises elsewhere
    return selectGovernmentType(
      mapData.region,
      culturalZone,
      era,
      structure.location[0],
      structure.location[1],
      mapData.seed || 12345
    );
  }, [culturalZone, era, mapData.region, structure.location, mapData.seed]);

  // Faction context
  const factionData = useMemo(() => {
    const regionKey = mapData.region || `${mapData.continent} - ${mapData.localArea}`;
    const zoneData = FACTION_DATA[culturalZone];
    if (zoneData && zoneData[regionKey] && zoneData[regionKey][era]) {
      return zoneData[regionKey][era];
    }
    return null;
  }, [culturalZone, mapData, era]);

  // Titles: prefer faction roles if available
  const leaderTitles = useMemo(() => {
    if (factionData && factionData.courtRoles) {
      const roles =
        factionData.courtRoles.palace ||
        factionData.courtRoles.government_forum ||
        factionData.courtRoles.holy_site ||
        factionData.courtRoles.fortress;
      if (roles && roles.length) return roles;
    }
    return getLeaderTitles(culturalZone, era);
  }, [culturalZone, era, factionData]);

  const governmentInfo = useMemo(() => {
    if (!governmentType) {
      return {
        type: 'Administrative Center',
        leader: 'Governor',
        description: 'A general administrative center.',
      };
    }
    const idx = (structure.location[0] + structure.location[1]) % Math.max(1, leaderTitles.length);
    const title = leaderTitles[idx] || 'Governor';
    return {
      type: governmentType.name,
      leader: title,
      description: governmentType.description,
    };
  }, [governmentType, leaderTitles, structure.location]);

  const governmentLeader = useMemo(() => {
    const L = governmentInfo.leader; // This is the title
    if (!L) return null;

    // Better seed generation using structure ID and location
    const structureIdHash = structure.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const leaderSeed = (structure.location[0] * 7919 + structure.location[1] * 6271 + structureIdHash * 31 + year) % 1000000;
    const rng = seeded(leaderSeed);
    
    // Determine gender (with some cultural considerations)
    const gender = rng.next() > 0.7 ? 'Female' : 'Male'; // Most leaders historically male, but not all
    const age = 35 + rng.rangeInt(0, 30); // Leaders tend to be older
    
    // Generate proper name based on cultural zone and time period
    // The generateHistoricalName expects a continent string that matches PERIOD_NAME_MAPPING keys
    // CulturalZone values like 'NORTH_AMERICAN_PRE_COLUMBIAN' should match exactly
    const nameData = generateHistoricalName(
      culturalZone as string, // continent - using CulturalZone directly as it matches mapping keys
      mapData.region || '', // region
      year,
      gender.toLowerCase() as 'male' | 'female'
    );
    
    // Create a pseudo-noise object for NPC generation functions
    const pseudoNoise: ValueNoise = {
      random: () => rng.next(),
      get: (x: number, y: number) => rng.next(),
      getNormalized: (x: number, y: number) => rng.next()
    };
    
    // Generate full NPC profile with culturally appropriate appearance
    const baseProfile = generateBaseProfile(pseudoNoise, { 
      era, 
      culturalZone, 
      region: mapData.region || '' 
    });
    
    // Override certain properties for a leader
    const leaderName = `${nameData.firstName} ${nameData.surname}`;
    
    // Enhance stats for a leader position
    const enhancedStats = {
      ...baseProfile.stats,
      intelligence: Math.min(10, baseProfile.stats.intelligence + 2),
      charisma: Math.min(10, baseProfile.stats.charisma + 3),
      wisdom: Math.min(10, (baseProfile.stats.wisdom || 5) + 2),
    };
    
    // Improve clothing for wealthy leader status
    const leaderAppearance = {
      ...baseProfile.appearance,
      garment: getLeaderGarment(culturalZone, era, year),
      headgear: getLeaderHeadgear(culturalZone, era, L),
      palette: getLeaderPalette(culturalZone, era),
      facialHair: gender === 'Male' && rng.next() > 0.3,
    };

    return {
      name: leaderName,
      title: L,
      age,
      gender: gender as 'Male' | 'Female',
      health: 90 + rng.rangeInt(0, 10),
      maxHealth: 100,
      stats: enhancedStats,
      appearance: leaderAppearance,
      wealthLevel: 'wealthy' as const,
      class: `${L} of ${structure.name}`,
      era: year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`,
      culturalZone,
      portraitSeed: leaderSeed,
      // Include other properties from baseProfile that might be needed
      personality: baseProfile.personality,
      socialContext: baseProfile.socialContext,
    };
  }, [governmentInfo, culturalZone, year, structure, mapData.region, era]);

  const dominantFaction = useMemo(() => {
    if (!factionData) return null;
    return {
      name: factionData.dominantPower,
      description: factionData.dominantPowerDescription,
      context: factionData.eraContextSentence,
      allegianceGroups: factionData.allegianceGroups || [],
    };
  }, [factionData]);

  const districtDetails = useMemo(
    () => [
      { label: 'District Type', value: governmentInfo.type },
      { label: 'Established', value: `${rnd.rangeInt(50, 200)} years ago` },
      { label: 'Administrative Level', value: rnd.rangeInt(0, 100) > 50 ? 'Regional Capital' : 'Local Seat' },
      { label: 'Officials Present', value: `${rnd.rangeInt(20, 100)}` },
      { label: 'Security Level', value: rnd.rangeInt(0, 100) > 70 ? 'High' : 'Moderate' },
      { label: 'Cultural Style', value: governmentType?.districtType || 'Administrative' },
    ],
    [governmentInfo.type, governmentType?.districtType, rnd]
  );

  /* -----------------------------------------------------------------------
     Behavior: ESC to close + focus management
  ----------------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent | KeyboardEventInit | any) => {
      if (e.key === 'Escape') onClose();
      // simple tab-trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          (last as HTMLElement).focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          (first as HTMLElement).focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', onKey as any);
    return () => document.removeEventListener('keydown', onKey as any);
  }, [onClose]);

  useEffect(() => {
    // Autofocus the first interactive item for accessibility
    const t = setTimeout(() => {
      firstFocusRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const enterSelectedBuilding = useCallback(
    (index: number) => {
      if (!onEnterSpecialMap || !availableSpecialMaps[index]) return;
      const building = availableSpecialMaps[index];
      const config: SpecialMapConfig = {
        archetype: governmentType?.archetype || building.archetype,
        culturalZone: normalizeCulturalZone(culturalZone),
        era,
        region: mapData.region,
        // Let the special map generator determine size based on era and archetype
        structureId: structure.id,
        structureName: governmentType?.name || building.name,
        climate: mapData.climate,  // Pass climate to avoid undefined
        districtType: (structure as any).districtType || governmentType?.districtType,  // Use structure's districtType first!
      };
      onEnterSpecialMap(config);
      onClose();
    },
    [availableSpecialMaps, culturalZone, era, governmentType, mapData.region, onClose, onEnterSpecialMap, structure.id]
  );

  /* ============================================================================================
     Render
  ============================================================================================ */

  return (
    <div
      className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Government District"
    >
      {/* Shift whole panel up ~10px to let the map’s bottom inset show */}
      <div
        ref={panelRef}
        className="relative w-full h-[min(78vh,980px)] max-w-[min(100vw,1300px)] md:max-w-6xl translate-y-[-10px] ff-panel animate-popIn rounded-xl overflow-hidden flex flex-col"
      >
        {/* Close Button (accessible, always top-right) */}
        <button
          ref={firstFocusRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 inline-flex items-center justify-center rounded-md p-2 text-slate-200/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Header with TimeAwareBackground + Transparent Banner */}
        <header className="relative h-[280px] xs:h-[300px] sm:h-[360px] md:h-[390px] flex-shrink-0">
          {/* Background: sky/time/weather (sits underneath, fills to top) */}
          <div className="absolute inset-0">
            <TimeAwareBackground timeOfDay={timeOfDay} weather={weather} season={season} />
          </div>

          {/* The pixel-art banner (transparent sky) */}
          <GovernmentDistrictBanner
            districtName={structure.name}
            districtType={governmentType?.districtType}
            archetype={governmentType?.archetype || SpecialMapArchetype.GOVERNMENT_FORUM}
            culturalZone={culturalZone}
            era={era}
            climate={mapData?.climate}
            season={season}
            timeOfDay={timeOfDay}
            weather={weather}
            tile={tile}
            mapData={mapData}
            width={1400}
            height={390}
          />

          

          {/* Tints/overlays: ensure they start at the true top — no gap */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent"></div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

          {/* Title/Sub header pinned to bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-5 md:px-6 pb-4 sm:pb-6 md:pb-7 text-white flex justify-between items-end">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-600/40 to-amber-700/20 backdrop-blur-sm border-2 border-amber-500/40 shadow-lg">
                <GiCapitol className="text-amber-300" size={22} />
              </div>
              <div>
                <p
                  className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300/90 mb-1"
                  style={{ textShadow: '1px 1px 3px #000' }}
                >
                  {governmentInfo.type} • {displayDate}
                </p>
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent"
                  style={{ textShadow: '0 0 30px rgba(251,191,36,0.45)' }}
                >
                  {structure.name}
                </h2>
                <p
                  className="text-sm sm:text-base capitalize text-amber-100/90 mt-1 flex items-center gap-2"
                  style={{ textShadow: '1px 1px 2px #000' }}
                >
                  <FaLandmark className="text-amber-300" /> Government District • {currentLocation}
                </p>
              </div>
            </div>

            {/* Tabs (right-aligned on large; full-width below) */}
            <div className="hidden md:flex gap-2 bg-slate-900/60 backdrop-blur-sm rounded-lg p-1 px-3 border border-amber-700/30">
              {(['overview', 'buildings', 'archives'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                      : 'text-amber-300/80 hover:text-amber-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab === 'overview' && <span className="inline-flex items-center gap-2"><FaLandmark /> Overview</span>}
                  {tab === 'buildings' && <span className="inline-flex items-center gap-2"><FaMapMarkedAlt /> Buildings</span>}
                  {tab === 'archives' && <span className="inline-flex items-center gap-2"><GiScrollQuill /> Archives</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Allegiance/Faction badge — moved to top-right overlay over the banner */}
          {dominantFaction && (
            <div
              className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-3 bg-black/55 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2.5 border-2 cursor-pointer hover:bg-black/70 transition-all z-20"
              style={{ borderColor: getFactionData(dominantFaction.name).color }}
              title="Dominant faction / allegiance"
            >
              {(() => {
                const fd = getFactionData(dominantFaction.name);
                const Icon = fd.icon;
                return (
                  <>
                    <div
                      className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                      style={{ backgroundColor: `${fd.color}33` }}
                    >
                      <Icon size={22} style={{ color: fd.color }} />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Allegiance</span>
                      <span
                        className="text-sm sm:text-base font-bold font-cinzel"
                        style={{ color: fd.color, textShadow: '2px 2px 4px #000' }}
                      >
                        {dominantFaction.name}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Mobile tabs (overlay, below badge) */}
          <div className="md:hidden absolute left-0 right-0 bottom-0 px-3 pb-3">
            <div className="flex gap-2 bg-slate-900/60 backdrop-blur-sm rounded-lg p-1 px-3 border border-amber-700/30">
              {(['overview', 'buildings', 'archives'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs px-2 py-2 rounded-md font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                      : 'text-amber-300/80 hover:text-amber-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'buildings' && 'Buildings'}
                  {tab === 'archives' && 'Archives'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#d97706 #1e293b' }}
        >
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-3">
              {/* Left Column — Leader & Info */}
              <div className="space-y-6">
                {/* Leader Card */}
                {governmentLeader && (
                  <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20 backdrop-blur-sm">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                      <GiThroneKing className="text-amber-400" /> Current Leader
                    </h3>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <ProceduralPortrait
                          character={governmentLeader}
                          size={86}
                          className="rounded-lg border-2 border-amber-500/30"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-amber-200 mb-1">{governmentLeader.name}</h4>
                        <p className="text-sm text-amber-400/90 font-semibold mb-1">
                          {governmentLeader.title}
                        </p>
                        <p className="text-sm text-amber-400/80 mb-2">
                          {governmentLeader.age} years old • {governmentLeader.gender}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Charisma:</span>
                            <span className="text-amber-200">{governmentLeader.stats.charisma}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Intelligence:</span>
                            <span className="text-amber-200">{governmentLeader.stats.intelligence}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* District Information */}
                <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20 backdrop-blur-sm">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                    <FaBuilding className="text-amber-400" /> District Information
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{governmentInfo.description}</p>
                  <dl className="space-y-2 text-sm">
                    {districtDetails.map((d, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-slate-700/50">
                        <dt className="text-amber-400/80">{d.label}</dt>
                        <dd className="text-amber-100">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>

              {/* Middle Column — Faction & Functions */}
              <div className="space-y-6">
                {/* Faction Summary (kept in body too for parity with your prior layout) */}
                {dominantFaction && (
                  <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20 backdrop-blur-sm">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                      <FaCrown className="text-amber-400" /> Ruling Authority
                    </h3>
                    {(() => {
                      const fd = getFactionData(dominantFaction.name);
                      const Icon = fd.icon;
                      return (
                        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border-2 transition-all mb-3"
                             style={{ borderColor: fd.color }}>
                          <Icon size={28} style={{ color: fd.color }} />
                          <div>
                            <div className="font-bold text-amber-200">{dominantFaction.name}</div>
                            <p className="text-xs text-slate-300">{dominantFaction.description}</p>
                          </div>
                        </div>
                      );
                    })()}
                    {dominantFaction.context && (
                      <p className="text-sm text-slate-400 italic border-l-2 border-amber-700/30 pl-3">
                        “{dominantFaction.context}”
                      </p>
                    )}
                  </section>
                )}

                {/* Government Functions */}
                <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20 backdrop-blur-sm">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                    <FaGavel className="text-amber-400" /> Government Functions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <GiScales className="text-amber-400" size={20} />
                      <div>
                        <p className="text-sm font-medium text-amber-200">Courts of Justice</p>
                        <p className="text-xs text-slate-400">Civil and criminal proceedings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <FaScroll className="text-amber-400" size={20} />
                      <div>
                        <p className="text-sm font-medium text-amber-200">Administrative Offices</p>
                        <p className="text-xs text-slate-400">Tax collection and permits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <GiLaurelCrown className="text-amber-400" size={20} />
                      <div>
                        <p className="text-sm font-medium text-amber-200">Council Chambers</p>
                        <p className="text-xs text-slate-400">Legislative assembly</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column — Enter Building & Actions */}
              <div className="space-y-6">
                <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                    <FaDoorOpen className="text-amber-400" /> Enter Building
                  </h3>
                  <button
                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all shadow-lg hover:shadow-amber-500/25 font-bold text-lg flex items-center justify-center gap-3"
                    onClick={() => {
                      if (!onEnterSpecialMap || !governmentType) return;
                      const config: SpecialMapConfig = {
                        archetype: governmentType.archetype,
                        culturalZone: normalizeCulturalZone(culturalZone),
                        era,
                        region: mapData.region,
                        // Let the special map generator determine size based on era and archetype
                        structureId: structure.id,
                        structureName: governmentType.name,
                        climate: mapData.climate,  // Pass climate to avoid undefined
                        districtType: (structure as any).districtType || governmentType.districtType,  // Use structure's districtType first!
                      };
                      onEnterSpecialMap(config);
                      onClose();
                    }}
                  >
                    <FaDoorOpen size={22} />
                    Enter the {governmentType?.name || 'Government Building'}
                  </button>
                  <p className="text-xs text-slate-400 text-center italic mt-2">
                    Explore the interior of this {governmentType?.districtType || 'administrative center'}.
                  </p>
                </section>

                <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                    <FaCompass className="text-amber-400" /> Other Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      className="w-full px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 text-slate-200 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                      onClick={() => console.log('Request audience with', governmentInfo.leader)}
                    >
                      <GiThroneKing /> Request Audience
                    </button>
                    <button
                      className="w-full px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 text-slate-200 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                      onClick={() => setActiveTab('archives')}
                      ref={lastFocusRef}
                    >
                      <FaScroll /> View Records
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* BUILDINGS TAB */}
          {activeTab === 'buildings' && (
            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2">
              <div className="space-y-6">
                <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20">
                  <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                    <FaBuilding className="text-amber-400" /> Government Buildings
                  </h3>
                  {availableSpecialMaps.length ? (
                    <div className="space-y-3">
                      {availableSpecialMaps.map((bld, idx) => (
                        <div
                          key={idx}
                          className={`p-4 bg-slate-900/50 rounded-lg border transition-all cursor-pointer ${
                            selectedBuilding === idx
                              ? 'border-amber-500/50 shadow-lg shadow-amber-500/20'
                              : 'border-slate-700/50 hover:border-amber-600/30'
                          }`}
                          onClick={() => setSelectedBuilding(idx)}
                          onDoubleClick={() => enterSelectedBuilding(idx)}
                          role="button"
                          aria-pressed={selectedBuilding === idx}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-2xl">{bld.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-amber-200">{bld.name}</h4>
                              <p className="text-xs text-slate-400 mt-1">{bld.description}</p>
                              {bld.dateRange && (
                                <p className="text-xs text-amber-400/70 mt-2">{bld.dateRange}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No specific buildings for this location and era.</p>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                {selectedBuilding !== null && availableSpecialMaps[selectedBuilding] && (
                  <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20">
                    <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                      {getArchetypeIcon(availableSpecialMaps[selectedBuilding].archetype)} Building Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-amber-200 mb-2">
                          {availableSpecialMaps[selectedBuilding].name}
                        </h4>
                        <p className="text-sm text-slate-300">
                          {availableSpecialMaps[selectedBuilding].description}
                        </p>
                      </div>
                      <button
                        className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all shadow-lg hover:shadow-amber-500/25 font-bold flex items-center justify-center gap-2"
                        onClick={() => enterSelectedBuilding(selectedBuilding)}
                      >
                        <FaDoorOpen /> Enter the {availableSpecialMaps[selectedBuilding].name}
                      </button>
                    </div>
                  </section>
                )}

                <section className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/30 rounded-xl p-4 sm:p-5 border border-yellow-700/20">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center gap-2">
                    <FaExclamationTriangle className="text-yellow-400" /> Security Notice
                  </h3>
                  <p className="text-sm text-yellow-100/80">
                    Government buildings are protected areas. Unauthorized access or disruptive behavior
                    will result in immediate expulsion and possible legal consequences.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* ARCHIVES TAB */}
          {activeTab === 'archives' && (
            <div className="space-y-6 p-4 sm:p-6">
              <section className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 sm:p-5 border border-amber-700/20">
                <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                  <GiScrollQuill className="text-amber-400" />
                  {(() => {
                    if (culturalZone === 'EAST_ASIAN') return 'Imperial Archives';
                    if (culturalZone === 'MENA' && era === HistoricalEra.MEDIEVAL) return 'Diwan Records';
                    if (culturalZone === 'EUROPEAN' && era === HistoricalEra.ANTIQUITY) return 'Tabularium';
                    if (culturalZone === 'OCEANIA' && era <= HistoricalEra.MEDIEVAL) return 'Oral Histories';
                    return 'Public Records';
                  })()}
                </h3>

                <div className="space-y-3">
                  {(() => {
                    let records: Array<{ title: string; date: string; description: string }> = [];

                    if (culturalZone === 'OCEANIA' && era <= HistoricalEra.MEDIEVAL) {
                      records = [
                        { title: 'Genealogy Chants', date: 'Ongoing', description: 'Oral recitations of lineages and ancestral connections.' },
                        { title: 'Songline Maps', date: 'Sacred Knowledge', description: 'Navigation routes encoded in ceremonial songs.' },
                        { title: 'Law Stories', date: 'Traditional', description: 'Stories that encode legal precedents and social rules.' },
                      ];
                    } else if (culturalZone === 'EAST_ASIAN' && era === HistoricalEra.MEDIEVAL) {
                      records = [
                        { title: 'Civil Examination Results', date: `${year - 3} CE`, description: 'Rankings of scholars who passed imperial examinations.' },
                        { title: 'Household Registry', date: `${year - 1} CE`, description: 'Detailed records of families for taxation and conscription.' },
                        { title: 'Imperial Edicts', date: 'Current', description: 'Commands from the Son of Heaven to the provinces.' },
                      ];
                    } else if (culturalZone === 'MENA' && era === HistoricalEra.MEDIEVAL) {
                      records = [
                        { title: 'Waqf Endowments', date: `${year - 2} CE`, description: 'Religious charitable trusts and their beneficiaries.' },
                        { title: 'Qadi Court Rulings', date: 'Recent', description: 'Islamic legal judgments and precedents.' },
                        { title: 'Dhimmi Tax Records', date: `${year} CE`, description: 'Jizya payments from protected non-Muslim communities.' },
                      ];
                    } else if (culturalZone === 'EUROPEAN' && era === HistoricalEra.ANTIQUITY) {
                      records = [
                        { title: 'Senatus Consulta', date: `${year - 1} CE`, description: 'Decrees issued by the Roman Senate.' },
                        { title: 'Census Tablets', date: `${year - 5} CE`, description: 'Bronze tablets recording citizen status and property.' },
                        { title: "Praetor's Edicts", date: 'Current', description: 'Legal pronouncements from the magistrates.' },
                      ];
                    } else if (culturalZone === 'EUROPEAN' && era === HistoricalEra.MEDIEVAL) {
                      records = [
                        { title: 'Manor Rolls', date: `${year - 1} CE`, description: 'Records of feudal obligations and peasant holdings.' },
                        { title: 'Guild Charters', date: `${year - 10} CE`, description: 'Rights and regulations of merchant associations.' },
                        { title: 'Royal Writs', date: 'Recent', description: 'Commands from the crown to local officials.' },
                      ];
                    } else {
                      records = [
                        { title: 'Tax Rolls', date: `${year - 1} CE`, description: 'Annual assessment of property and trade taxes.' },
                        { title: 'Census Records', date: `${year - 5} CE`, description: 'Population count and demographic information.' },
                        { title: 'Legal Proclamations', date: 'Current', description: 'Recent laws and regulations issued by the authority.' },
                      ];
                    }

                    return records.map((r, i) => (
                      <article key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-semibold text-amber-200">{r.title}</h4>
                          <span className="text-xs text-amber-400/70">{r.date}</span>
                        </div>
                        <p className="text-xs text-slate-400">{r.description}</p>
                      </article>
                    ));
                  })()}
                </div>
              </section>

              {/* Historical Significance */}
              <section className="bg-gradient-to-br from-green-900/20 to-green-950/30 rounded-xl p-4 sm:p-5 border border-green-700/20">
                <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
                  <FaHistory className="text-green-400" /> Historical Significance
                </h3>
                <p className="text-sm text-green-100/80 mb-4">
                  This government district has been the center of local administration for centuries:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <GiAncientColumns className="text-green-400" size={16} />
                    <span className="text-sm text-green-200">Founded in {year - rnd.rangeInt(100, 300)} CE</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <FaCrown className="text-green-400" size={16} />
                    <span className="text-sm text-green-200">Served {rnd.rangeInt(3, 8)} different ruling dynasties</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <FaScroll className="text-green-400" size={16} />
                    <span className="text-sm text-green-200">
                      Archives contain over {rnd.rangeInt(500, 2000)} historical documents
                    </span>
                  </li>
                </ul>
              </section>
            </div>
          )}
        </div>

        {/* Footer — slimmer on small screens, consistent border */}
        <footer className="mt-auto p-3 sm:p-4 border-t border-slate-700 bg-slate-900/50 flex items-center justify-between">
          <div className="text-[11px] sm:text-xs text-slate-400">
            {displayDate} • {mapData?.mapAreaName || currentLocation}
          </div>
          <button
            onClick={onClose}
            className="ff-action-button px-4 sm:px-6 py-2 text-xs sm:text-sm"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GovernmentDistrictModal;
