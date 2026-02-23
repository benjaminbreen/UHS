/**
 * components/GovernmentDistrictModalV2.tsx
 * "The Seat of Power" — Two-panel government district modal.
 * Drop-in replacement for GovernmentDistrictModal with identical props.
 */

import React, {
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { gameSounds } from '../services/gameSoundsService';

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
import { generateHistoricalName } from '../constants/characterData/names';
import { generateBaseProfile } from '../generation/common/npcUtils';
import { ValueNoise } from '../utils/noise';
import { isSafari } from '../utils/safariUtils';

import {
  FaTimes,
  FaClock,
  FaLeaf,
  FaChevronRight,
  FaCrown,
  FaLandmark,
  FaScroll,
} from 'react-icons/fa';

import {
  GiCapitol,
  GiThroneKing,
  GiScrollQuill,
} from 'react-icons/gi';

/* ================================================================
   Utilities (same as original)
================================================================ */

const getEraFromYear = (year: number): HistoricalEra => {
  if (year < -3000) return HistoricalEra.PREHISTORY;
  if (year < 500) return HistoricalEra.ANTIQUITY;
  if (year < 1500) return HistoricalEra.MEDIEVAL;
  if (year < 1800) return HistoricalEra.RENAISSANCE_EARLY_MODERN;
  if (year < 1950) return HistoricalEra.INDUSTRIAL_ERA;
  if (year < 2050) return HistoricalEra.MODERN_ERA;
  return HistoricalEra.FUTURE_ERA;
};

const getCulturalZone = (continent?: string, region?: string): CulturalZone => {
  const loc = `${continent || ''} ${region || ''}`.toLowerCase();
  if (loc.includes('east asia') || (loc.includes('asia') && !loc.includes('south'))) return 'EAST_ASIAN';
  if (loc.includes('south asia') || loc.includes('india')) return 'SOUTH_ASIAN';
  if (loc.includes('north africa') || loc.includes('mena') || loc.includes('middle east')) return 'MENA';
  if (loc.includes('sub-saharan') || (loc.includes('africa') && !loc.includes('north'))) return 'SUB_SAHARAN_AFRICAN';
  if (loc.includes('oceania') || loc.includes('polynesia') || loc.includes('melanesia')) return 'OCEANIA';
  if (loc.includes('south america')) return 'SOUTH_AMERICAN';
  if (loc.includes('north america') && !loc.includes('colonial')) return 'NORTH_AMERICAN_PRE_COLUMBIAN';
  if (loc.includes('america') && !loc.includes('north') && !loc.includes('south')) return 'INDIGENOUS_AMERICAN';
  return 'EUROPEAN';
};

const seeded = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  const next = () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
  const rangeInt = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  return { next, rangeInt };
};

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

const formatDisplayDate = (formattedDate?: string | { year: number }): string => {
  if (!formattedDate) return 'Year 1500';
  if (typeof formattedDate === 'object' && typeof formattedDate.year === 'number') {
    return formattedDate.year < 0 ? `${Math.abs(formattedDate.year)} BCE` : `${formattedDate.year} CE`;
  }
  return String(formattedDate);
};

/* ================================================================
   Leader Appearance Helpers (same as original)
================================================================ */

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
  return garments[zone]?.[era] || { name: 'formal robes', material: 'fine cloth' };
};

const getLeaderHeadgear = (zone: CulturalZone | string, era: HistoricalEra, _title: string) => {
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
  return headgear[zone]?.[era] || { name: 'ceremonial cap', material: 'fine cloth' };
};

const getLeaderPalette = (zone: CulturalZone | string, _era: HistoricalEra) => {
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

/* ================================================================
   Charisma / Intelligence descriptions
================================================================ */

const CHARISMA_DESC = [
  "Utterly charmless", "Deeply unpopular", "Rather off-putting", "Socially awkward",
  "Unremarkable presence", "Moderately personable", "Quite likeable", "Natural charm",
  "Magnetic personality", "Extraordinarily charismatic", "Legendary magnetism"
];
const INTELLIGENCE_DESC = [
  "dimwitted", "quite slow", "dull-minded", "simple", "unremarkable wit",
  "reasonably clever", "notably sharp", "highly intelligent", "brilliant mind",
  "genius intellect", "unparalleled brilliance"
];

const describeLeader = (cha: number, int: number): string => {
  const connector = (cha <= 3 && int >= 7) || (cha >= 7 && int <= 3) ? ' but '
    : (cha >= 6 && int >= 6) ? ' and ' : ', ';
  return `${CHARISMA_DESC[cha]}${connector}${INTELLIGENCE_DESC[int]}`;
};

/* ================================================================
   Archive records by culture
================================================================ */

const getArchiveRecords = (culturalZone: CulturalZone, era: HistoricalEra, year: number) => {
  if (culturalZone === 'OCEANIA' && era <= HistoricalEra.MEDIEVAL) {
    return [
      { title: 'Genealogy Chants', date: 'Ongoing', description: 'Oral recitations of lineages and ancestral connections.' },
      { title: 'Songline Maps', date: 'Sacred Knowledge', description: 'Navigation routes encoded in ceremonial songs.' },
      { title: 'Law Stories', date: 'Traditional', description: 'Stories that encode legal precedents and social rules.' },
    ];
  }
  if (culturalZone === 'EAST_ASIAN' && era === HistoricalEra.MEDIEVAL) {
    return [
      { title: 'Civil Examination Results', date: `${year - 3} CE`, description: 'Rankings of scholars who passed imperial examinations.' },
      { title: 'Household Registry', date: `${year - 1} CE`, description: 'Detailed records of families for taxation and conscription.' },
      { title: 'Imperial Edicts', date: 'Current', description: 'Commands from the Son of Heaven to the provinces.' },
    ];
  }
  if (culturalZone === 'MENA' && era === HistoricalEra.MEDIEVAL) {
    return [
      { title: 'Waqf Endowments', date: `${year - 2} CE`, description: 'Religious charitable trusts and their beneficiaries.' },
      { title: 'Qadi Court Rulings', date: 'Recent', description: 'Islamic legal judgments and precedents.' },
      { title: 'Dhimmi Tax Records', date: `${year} CE`, description: 'Jizya payments from protected non-Muslim communities.' },
    ];
  }
  if (culturalZone === 'EUROPEAN' && era === HistoricalEra.ANTIQUITY) {
    return [
      { title: 'Senatus Consulta', date: `${year - 1} CE`, description: 'Decrees issued by the Roman Senate.' },
      { title: 'Census Tablets', date: `${year - 5} CE`, description: 'Bronze tablets recording citizen status and property.' },
      { title: "Praetor's Edicts", date: 'Current', description: 'Legal pronouncements from the magistrates.' },
    ];
  }
  if (culturalZone === 'EUROPEAN' && era === HistoricalEra.MEDIEVAL) {
    return [
      { title: 'Manor Rolls', date: `${year - 1} CE`, description: 'Records of feudal obligations and peasant holdings.' },
      { title: 'Guild Charters', date: `${year - 10} CE`, description: 'Rights and regulations of merchant associations.' },
      { title: 'Royal Writs', date: 'Recent', description: 'Commands from the crown to local officials.' },
    ];
  }
  return [
    { title: 'Tax Rolls', date: `${year - 1} CE`, description: 'Annual assessment of property and trade taxes.' },
    { title: 'Census Records', date: `${year - 5} CE`, description: 'Population count and demographic information.' },
    { title: 'Legal Proclamations', date: 'Current', description: 'Recent laws and regulations issued by the authority.' },
  ];
};

const getArchiveTitle = (culturalZone: CulturalZone, era: HistoricalEra): string => {
  if (culturalZone === 'EAST_ASIAN') return 'Imperial Archives';
  if (culturalZone === 'MENA' && era === HistoricalEra.MEDIEVAL) return 'Diwan Records';
  if (culturalZone === 'EUROPEAN' && era === HistoricalEra.ANTIQUITY) return 'Tabularium';
  if (culturalZone === 'OCEANIA' && era <= HistoricalEra.MEDIEVAL) return 'Oral Histories';
  return 'Public Records';
};

/* ================================================================
   Stat bar component
================================================================ */

const StatBar: React.FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 10 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 18px', alignItems: 'center', gap: '0.4rem' }}>
    <span className="text-xs" style={{ color: 'var(--text-muted)', fontVariant: 'all-small-caps' }}>{label}</span>
    <div className="rounded-full h-1.5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div
        className="rounded-full h-1.5 transition-all"
        style={{
          width: `${(value / max) * 100}%`,
          backgroundColor: value >= 8 ? 'var(--accent-primary)' : value >= 5 ? 'rgba(244,203,120,0.7)' : 'var(--text-muted)',
        }}
      />
    </div>
    <span className="text-xs text-right" style={{ color: 'var(--text-secondary)' }}>{value}</span>
  </div>
);

/* ================================================================
   Props (identical to original)
================================================================ */

interface GovernmentDistrictModalV2Props {
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

/* ================================================================
   Component
================================================================ */

const GovernmentDistrictModalV2: React.FC<GovernmentDistrictModalV2Props> = ({
  structure, tile, playerCharacter, mapData, currentLocation,
  formattedDate, gameTimeHours = 12, season = 'summer',
  onClose, onEnterSpecialMap,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);

  /* ── Derived context ── */

  const year = useMemo(() => parseYear(formattedDate), [formattedDate]);
  const displayDate = useMemo(() => formatDisplayDate(formattedDate), [formattedDate]);
  const era = useMemo(() => getEraFromYear(year), [year]);
  const culturalZone: CulturalZone = useMemo(
    () => getCulturalZone(mapData.continent, mapData.region),
    [mapData.continent, mapData.region],
  );

  const timeOfDay: TimeOfDay = useMemo(() => {
    if (gameTimeHours >= 5 && gameTimeHours < 7) return 'Dawn';
    if (gameTimeHours >= 7 && gameTimeHours < 12) return 'Morning';
    if (gameTimeHours >= 12 && gameTimeHours < 15) return 'Midday';
    if (gameTimeHours >= 15 && gameTimeHours < 18) return 'Afternoon';
    if (gameTimeHours >= 18 && gameTimeHours < 20) return 'Dusk';
    return 'Night';
  }, [gameTimeHours]);

  const weather = useMemo(() => {
    return weatherService.getWeather(
      mapData.climate, tile.biome, season, timeOfDay,
      tile.altitude || 0.5, 180, { x: tile.x, y: tile.y },
    );
  }, [mapData.climate, tile, season, timeOfDay]);

  const seed = structure.location[0] * 997 + structure.location[1] * 577;
  const rnd = useMemo(() => seeded(seed), [seed]);

  /* ── Government type & info ── */

  const governmentType = useMemo(() => {
    return selectGovernmentType(
      mapData.region, culturalZone, era,
      structure.location[0], structure.location[1],
      mapData.seed || 12345,
    );
  }, [culturalZone, era, mapData.region, structure.location, mapData.seed]);

  const factionData = useMemo(() => {
    const regionKey = mapData.region || `${mapData.continent} - ${mapData.localArea}`;
    const zoneData = FACTION_DATA[culturalZone];
    if (zoneData && zoneData[regionKey] && zoneData[regionKey][era]) return zoneData[regionKey][era];
    return null;
  }, [culturalZone, mapData, era]);

  const leaderTitles = useMemo(() => {
    if (factionData?.courtRoles) {
      const roles = factionData.courtRoles.palace || factionData.courtRoles.government_forum
        || factionData.courtRoles.holy_site || factionData.courtRoles.fortress;
      if (roles?.length) return roles;
    }
    return getLeaderTitles(culturalZone, era);
  }, [culturalZone, era, factionData]);

  const governmentInfo = useMemo(() => {
    if (!governmentType) return { type: 'Administrative Center', leader: 'Governor', description: 'A general administrative center.' };
    const idx = (structure.location[0] + structure.location[1]) % Math.max(1, leaderTitles.length);
    return { type: governmentType.name, leader: leaderTitles[idx] || 'Governor', description: governmentType.description };
  }, [governmentType, leaderTitles, structure.location]);

  /* ── Leader ── */

  const governmentLeader = useMemo(() => {
    const L = governmentInfo.leader;
    if (!L) return null;

    const structureIdHash = structure.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const leaderSeed = (structure.location[0] * 7919 + structure.location[1] * 6271 + structureIdHash * 31 + year) % 1000000;
    const rng = seeded(leaderSeed);

    const gender = rng.next() > 0.7 ? 'Female' : 'Male';
    const age = 35 + rng.rangeInt(0, 30);
    const nameData = generateHistoricalName(culturalZone as string, mapData.region || '', year, gender.toLowerCase() as 'male' | 'female');

    const pseudoNoise: ValueNoise = { random: () => rng.next(), get: () => rng.next(), getNormalized: () => rng.next() };
    const baseProfile = generateBaseProfile(pseudoNoise, { era, culturalZone, region: mapData.region || '' });

    return {
      name: `${nameData.firstName} ${nameData.surname}`,
      title: L,
      age, gender: gender as 'Male' | 'Female',
      health: 90 + rng.rangeInt(0, 10), maxHealth: 100,
      stats: { ...baseProfile.stats, intelligence: Math.min(10, baseProfile.stats.intelligence + 2), charisma: Math.min(10, baseProfile.stats.charisma + 3), wisdom: Math.min(10, (baseProfile.stats.wisdom || 5) + 2) },
      appearance: { ...baseProfile.appearance, garment: getLeaderGarment(culturalZone, era, year), headgear: getLeaderHeadgear(culturalZone, era, L), palette: getLeaderPalette(culturalZone, era), facialHair: gender === 'Male' && rng.next() > 0.3 },
      wealthLevel: 'wealthy' as const,
      class: `${L} of ${structure.name}`,
      era: year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`,
      culturalZone, portraitSeed: leaderSeed,
      personality: baseProfile.personality,
      socialContext: baseProfile.socialContext,
    };
  }, [governmentInfo, culturalZone, year, structure, mapData.region, era]);

  /* ── Faction ── */

  const dominantFaction = useMemo(() => {
    if (!factionData) return null;
    return { name: factionData.dominantPower, description: factionData.dominantPowerDescription, context: factionData.eraContextSentence };
  }, [factionData]);

  /* ── Available buildings ── */

  const locationKey = useMemo(() => {
    if (mapData.continent && mapData.region && mapData.localArea)
      return `${mapData.continent.toLowerCase()}.${mapData.region.toLowerCase()}.${mapData.localArea.toLowerCase()}`;
    return null;
  }, [mapData]);

  const availableBuildings = useMemo(() => {
    if (locationKey) {
      const registry = SPECIAL_MAP_REGISTRY[locationKey];
      if (registry?.[era]?.historicalExamples?.length) return registry[era].historicalExamples;
    }
    const generic: any[] = [];
    generic.push({
      name: 'Administrative Center',
      description: `The main ${era === HistoricalEra.MODERN_ERA ? 'government offices' : era === HistoricalEra.MEDIEVAL ? 'royal court' : 'administrative complex'} of ${currentLocation}.`,
      icon: '\u{1F3DB}\uFE0F', archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
    });
    if (era !== HistoricalEra.MODERN_ERA && era !== HistoricalEra.FUTURE_ERA) {
      generic.push({
        name: 'Palace Complex',
        description: `The residence of the local ${era === HistoricalEra.MEDIEVAL ? 'lord' : 'ruler'}.`,
        icon: '\u{1F451}', archetype: SpecialMapArchetype.PALACE_COMPLEX,
      });
    }
    if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generic.push({ name: 'Fortress', description: 'Military stronghold and garrison.', icon: '\u{1F3F0}', archetype: SpecialMapArchetype.MILITARY_FORTRESS });
    }
    return generic;
  }, [locationKey, era, currentLocation]);

  /* ── District details ── */

  const districtDetails = useMemo(() => [
    { label: 'Type', value: governmentInfo.type },
    { label: 'Est.', value: `${rnd.rangeInt(50, 200)} years ago` },
    { label: 'Level', value: rnd.rangeInt(0, 100) > 50 ? 'Regional Capital' : 'Local Seat' },
    { label: 'Officials', value: `${rnd.rangeInt(20, 100)}` },
    { label: 'Security', value: rnd.rangeInt(0, 100) > 70 ? 'High' : 'Moderate' },
  ], [governmentInfo.type, rnd]);

  /* ── Archives ── */

  const archiveRecords = useMemo(() => getArchiveRecords(culturalZone, era, year), [culturalZone, era, year]);
  const archiveTitle = useMemo(() => getArchiveTitle(culturalZone, era), [culturalZone, era]);

  /* ── Build config for entering a building ── */

  const buildConfig = useCallback((building: any): SpecialMapConfig => {
    return {
      archetype: governmentType?.archetype || building.archetype,
      culturalZone: normalizeCulturalZone(culturalZone),
      era, region: mapData.region,
      structureId: structure.id,
      structureName: governmentType?.name || building.name,
      climate: mapData.climate,
      districtType: (structure as any).districtType || governmentType?.districtType,
      specificYear: year,
      authorityContext: governmentLeader && dominantFaction ? {
        leader: {
          name: governmentLeader.name, title: governmentLeader.title,
          age: governmentLeader.age, gender: governmentLeader.gender,
          stats: governmentLeader.stats, appearance: governmentLeader.appearance,
          portraitSeed: governmentLeader.portraitSeed, wealthLevel: governmentLeader.wealthLevel,
          culturalZone: governmentLeader.culturalZone,
          personality: governmentLeader.personality, socialContext: governmentLeader.socialContext,
        },
        faction: {
          name: dominantFaction.name, description: dominantFaction.description,
          contextSentence: dominantFaction.context, color: getFactionData(dominantFaction.name).color,
        },
        governmentType: governmentType?.name || 'Government Building',
        districtType: governmentType?.districtType || 'government',
      } : undefined,
    };
  }, [governmentType, culturalZone, era, mapData, structure, year, governmentLeader, dominantFaction]);

  /* ── Escape key ── */

  useEffect(() => {
    const onKey = (e: any) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { firstFocusRef.current?.focus(); }, []);
  useEffect(() => { gameSounds.playUIClickSound(); }, []);

  /* ================================================================
     Render
  ================================================================ */

  return (
    <div
      data-surface="modal-overlay"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        ...(isSafari() ? {} : { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }),
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000,
      }}
      role="dialog" aria-modal="true" aria-label={structure.name}
    >
      <div
        ref={panelRef}
        className="relative w-[95%] max-w-5xl max-h-[90vh] animate-popIn rounded-xl overflow-hidden flex flex-col shadow-2xl"
        style={{ borderWidth: '1px', borderColor: 'var(--surface-card-border)', backgroundColor: 'var(--bg-primary)' }}
      >
        {/* ── BANNER ── */}
        <header className="relative h-[180px] sm:h-[210px] md:h-[240px] flex-shrink-0">
          <div className="absolute inset-0">
            <TimeAwareBackground timeOfDay={timeOfDay} weather={weather} season={season} />
          </div>
          <GovernmentDistrictBanner
            districtName={structure.name}
            districtType={governmentType?.districtType}
            archetype={governmentType?.archetype || SpecialMapArchetype.GOVERNMENT_FORUM}
            culturalZone={culturalZone} era={era}
            climate={mapData?.climate} season={season} timeOfDay={timeOfDay} weather={weather}
            tile={tile} mapData={mapData} width={1400} height={390}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
        </header>

        {/* ── INFO STRIP ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 shrink-0"
          style={{ backgroundColor: 'var(--bg-secondary)', borderBottomWidth: '1px', borderColor: 'var(--surface-card-border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold truncate"
              style={{ fontFamily: "'Lora', Georgia, serif", color: 'var(--text-primary)' }}>
              {structure.name}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
              {governmentInfo.type}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
              {displayDate}
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
              {culturalZone.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
              <FaClock size={10} /> {Math.floor(gameTimeHours)}:00
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
              <FaLeaf size={10} /> {season}
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
              <FaLandmark size={10} /> Gov
            </span>
            <button ref={firstFocusRef} onClick={onClose} aria-label="Close"
              className="inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-200 hover:scale-110"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)' }}>
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        {/* ── TWO-PANEL GRID ── */}
        <div className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-2" style={{ maxHeight: 520 }}>

          {/* ─── LEFT PANEL: Authority ─── */}
          <div className="overflow-y-auto custom-scrollbar p-4 sm:p-5"
            style={{ backgroundColor: 'var(--bg-primary)', borderRightWidth: '1px', borderColor: 'var(--surface-card-border)', maxHeight: 'inherit' }}>

            {/* Government description */}
            {governmentInfo.description && (
              <div className="mb-5" style={{ borderLeft: '3px solid rgba(244,203,120,0.5)', paddingLeft: '1rem' }}>
                <p style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.8 }}>
                  <span style={{ float: 'left', fontSize: '2.8rem', lineHeight: 1, fontWeight: 700, marginRight: '0.25rem', marginTop: '0.05rem', color: 'rgba(244,203,120,0.9)', fontStyle: 'normal' }}>
                    {governmentInfo.description.charAt(0)}
                  </span>
                  {governmentInfo.description.slice(1)}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--surface-card-border)' }} />
              <span className="text-xs italic" style={{ color: 'var(--text-muted)', fontFamily: "'Lora', Georgia, serif" }}>
                The Authority
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--surface-card-border)' }} />
            </div>

            {/* Leader card */}
            {governmentLeader && (
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--surface-card-border)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <ProceduralPortrait character={governmentLeader} size={80}
                    className="rounded-lg flex-shrink-0"
                    style={{ border: '2px solid var(--surface-card-border)' } as any} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)', fontFamily: "'Lora', Georgia, serif" }}>
                      {governmentLeader.name}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: 'rgba(244,203,120,0.9)' }}>
                      {governmentLeader.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {governmentLeader.age} years old · {governmentLeader.gender}
                    </p>
                    <p className="text-xs mt-1.5 italic" style={{ color: 'var(--text-secondary)', fontFamily: "'Lora', Georgia, serif" }}>
                      "{describeLeader(governmentLeader.stats.charisma, governmentLeader.stats.intelligence)}"
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3">
                  <StatBar label="INT" value={governmentLeader.stats.intelligence} />
                  <StatBar label="CHA" value={governmentLeader.stats.charisma} />
                  <StatBar label="WIS" value={governmentLeader.stats.wisdom || 5} />
                </div>
              </div>
            )}

            {/* Faction card */}
            {dominantFaction && (() => {
              const fd = getFactionData(dominantFaction.name);
              const Icon = fd.icon;
              return (
                <div className="rounded-lg px-3 py-2.5 mb-4 flex items-center gap-3"
                  style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${fd.color}40` }}>
                  <Icon size={22} style={{ color: fd.color, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      <FaCrown size={10} className="inline mr-1" style={{ color: fd.color }} />
                      {dominantFaction.name}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {dominantFaction.description}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* District details */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--surface-card-border)' }} />
              <span className="text-xs italic" style={{ color: 'var(--text-muted)', fontFamily: "'Lora', Georgia, serif" }}>
                District
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--surface-card-border)' }} />
            </div>
            <div className="space-y-1">
              {districtDetails.map((d, i) => (
                <div key={i} className="flex justify-between text-xs px-1">
                  <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT PANEL: Interactive ─── */}
          <div className="overflow-y-auto custom-scrollbar p-4 sm:p-5"
            style={{ backgroundColor: 'var(--bg-secondary)', maxHeight: 'inherit' }}>

            {/* Buildings section header */}
            <div className="flex items-center justify-between mb-3"
              style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'var(--bg-secondary)', paddingBottom: '0.25rem' }}>
              <h3 className="text-sm font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <GiCapitol size={16} style={{ color: 'var(--accent-primary)' }} />
                Enter Buildings
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--accent-primary)' }}>
                {availableBuildings.length} available
              </span>
            </div>

            {availableBuildings.length === 0 ? (
              <p className="text-sm italic mb-4" style={{ color: 'var(--text-muted)' }}>
                No government buildings for this location and era.
              </p>
            ) : (
              <div className="space-y-1.5 mb-4">
                {availableBuildings.map((bld: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg px-3 py-2.5 transition-all duration-200 hover:brightness-110"
                    style={{
                      backgroundColor: 'var(--bg-card)', border: '1px solid var(--surface-card-border)',
                      display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: '0.5rem',
                      cursor: onEnterSpecialMap ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (!onEnterSpecialMap) return;
                      gameSounds.playButtonClickSound();
                      onEnterSpecialMap(buildConfig(bld));
                      onClose();
                    }}
                  >
                    <span className="text-xl text-center">{bld.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {bld.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {bld.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                        <span style={{ color: 'var(--accent-primary)' }}>Open</span>
                      </span>
                      {onEnterSpecialMap && <FaChevronRight size={10} style={{ color: 'var(--accent-primary)' }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="h-px my-3" style={{ backgroundColor: 'var(--surface-card-border)' }} />

            {/* Archives section */}
            <div className="flex items-center justify-between mb-3"
              style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'var(--bg-secondary)', paddingBottom: '0.25rem' }}>
              <h3 className="text-sm font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <GiScrollQuill size={14} style={{ color: 'var(--accent-primary)' }} />
                {archiveTitle}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--surface-chip-bg)', border: '1px solid var(--surface-chip-border)', color: 'var(--text-secondary)' }}>
                {archiveRecords.length} records
              </span>
            </div>

            <div className="space-y-1">
              {archiveRecords.map((r, i) => (
                <div key={i} className="rounded-md px-3 py-2 transition-colors duration-150"
                  style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'start', gap: '0.5rem' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FaScroll size={12} className="mt-0.5" style={{ color: 'rgba(244,203,120,0.6)' }} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.description}</div>
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{r.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="flex justify-end items-center p-3 shrink-0"
          style={{ borderTopWidth: '1px', borderColor: 'var(--surface-card-border)', backgroundColor: 'var(--bg-secondary)' }}>
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: '1px solid var(--button-primary-border)' }}>
            Leave District
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GovernmentDistrictModalV2;
