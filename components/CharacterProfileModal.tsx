/**
 * components/CharacterProfileModal.tsx
 * Fixed-height modal, companion animals in Household (with release), richer timeline with icons,
 * lucide-react icons everywhere, larger inventory preview, and small UX polish.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  PlayerCharacter,
  EquipmentSlot,
  Item,
  Rarity,
} from '../types';
import { useUI } from '../contexts/UIContext';
import LazyPortrait from './portraits/LazyPortrait';
import BeliefsPanel from './BeliefsPanel';
import EquipmentPanel from './EquipmentPanel';
import {
  generateProceduralItemDescription,
  isGenericDescription,
} from '../services/itemDescriptionGenerator';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import DiseaseModal from './DiseaseModal';
import { ActiveDisease } from '../types/diseaseTypes';
import { generateNpcName } from '../generation/common/npcUtils';
import { CHARACTER_NAMES } from '../constants/characterData/names';
import { DISEASE_DATABASE } from '../constants/gameData/diseases';
import { ValueNoise } from '../utils/noise';
import AccessoryMaintenanceService from '../services/accessoryMaintenanceService';
import {
  loadTamedAnimals,
  removeFromParty,
  TamedAnimal,
  updateAnimalName,
} from '../services/animalTamingService';
import { ANIMAL_DATA } from '../constants';
import AnimalCompanionModal from './AnimalCompanionModal';
import { mapLocationToCulture } from '../utils/mapUtils';
import { isSafari } from '../utils/safariUtils';
import {
  generateLifeHistory,
  EventImportance,
  type EnhancedLifeEvent,
  type EventKind
} from '../services/lifeHistoryService';
import { CharacterHistoryTab } from './CharacterHistoryTab';

/* lucide icons */
import {
  X,
  Home,
  Activity,
  Sword,
  Backpack,
  Sparkles,
  Scroll,
  House,
  Heart,
  Moon,
  Star,
  Coins,
  Handshake,
  Biohazard,
  Shield,
  Dumbbell,
  Feather,
  Brain,
  Eye,
  MessageSquare,
  PawPrint,
  Skull,
  HeartCrack,
  Trophy,
  Ship,
  Mountain,
  Compass,
  Users,
  FlaskConical,
  Hammer,
  BookOpen,
  Flame,
  MoreVertical,
  Church,
  Briefcase,
  Baby,
  GraduationCap,
  Wheat,
  Crown,
  Scale,
  Book,
} from 'lucide-react';

/* Attribute Components */
import { AttributeBadgeList } from './AttributeBadge';
import AttributeModal from './AttributeModal';

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const cmToFeetAndInches = (cm?: number): string => {
  if (!cm && cm !== 0) return 'N/A';
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
};

const kgToLbs = (kg?: number): string => {
  if (!kg && kg !== 0) return 'N/A';
  return `${Math.round(kg * 2.20462)} lbs`;
};

const formatItemName = (name = '') =>
  name
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

/* -------------------------------------------------------------------------- */
/* Small UI Bits                                                              */
/* -------------------------------------------------------------------------- */

const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
  const styles: Record<Rarity, string> = {
    Junk: 'bg-slate-600 text-slate-200 border-slate-500',
    Common: 'bg-slate-700 text-slate-200 border-slate-500',
    Uncommon: 'bg-emerald-600 text-emerald-50 border-emerald-400',
    Rare: 'bg-blue-600 text-blue-50 border-blue-400',
    'Ultra-rare': 'bg-violet-600 text-violet-50 border-violet-400',
    Unique: 'bg-amber-500 text-amber-50 border-amber-400',
  };
  return (
    <span className={`px-2 py-0.5 border rounded-full text-[10px] font-press-start ${styles[rarity]}`}>
      {rarity.toUpperCase()}
    </span>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1 text-sm">
    <span className="text-slate-400">{label}:</span>
    <span className="text-white font-semibold text-right">{value}</span>
  </div>
);

// Utility function to get gameplay impact explanations for stats
const getStatImpact = (statName: string, value: number): string => {
  const getThreshold = (val: number): string => {
    if (val <= 3) return "Very Poor";
    if (val <= 5) return "Poor";
    if (val <= 7) return "Average";
    if (val <= 9) return "Good";
    return "Excellent";
  };

  const impacts: Record<string, (val: number) => string> = {
    strength: (val) => `${getThreshold(val)} • Combat damage ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 5)}%, carrying capacity ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 10)}%`,
    dexterity: (val) => `${getThreshold(val)} • Combat hit chance ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 3)}%, crafting precision ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 4)}%`,
    constitution: (val) => `${getThreshold(val)} • Max health ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 8)}%, disease resistance ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 6)}%`,
    intelligence: (val) => `${getThreshold(val)} • Learning speed ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 7)}%, medical knowledge ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 5)}%`,
    persuasion: (val) => `${getThreshold(val)} • Trade prices ${val >= 10 ? 'better' : 'worse'} by ${Math.abs(Math.round((val - 10) * 2))}%, NPC relations ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 4)}%`,
    perception: (val) => `${getThreshold(val)} • Quest discovery ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 6)}%, hidden items ${val >= 10 ? '+' : ''}${Math.round((val - 10) * 8)}%`,
  };

  return impacts[statName.toLowerCase()]?.(value) || `${getThreshold(value)} • Affects various gameplay mechanics based on value of ${value}`;
};

const StatBar: React.FC<{ label: string; value: number; max?: number; Icon: any; color: string; tooltip?: string }> = ({
  label,
  value,
  max = 10,
  Icon,
  color,
  tooltip,
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const impact = tooltip || getStatImpact(label, value);
  
  return (
    <div className="flex items-center gap-3 group relative">
      <div className="w-40 text-sm text-slate-300 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex-1 h-3 rounded-full bg-slate-800/60 border border-slate-700/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}AA)`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="w-8 text-right font-bold text-white">{value}</span>
        {value > 8 && <span className="text-green-400 text-xs">▲</span>}
        {value < 5 && <span className="text-red-400 text-xs">▼</span>}
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-0 bottom-full mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
        <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-xl max-w-xs">
          <div className="font-semibold text-white mb-1">{label} {value}</div>
          <div className="text-slate-300">{impact}</div>
          <div className="absolute top-full left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    </div>
  );
};

const TabBtn: React.FC<{ label: string; active: boolean; onClick: () => void; Icon: any }> = ({
  label,
  active,
  onClick,
  Icon,
}) => (
  <button
    onClick={onClick}
    className={[
      'flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors shrink-0',
      active
        ? 'text-white bg-slate-700/50 border-b-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,.25)]'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/40',
    ].join(' ')}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

/* -------------------------------------------------------------------------- */
/* Life Events Icon and Color Mapping                                         */
/* -------------------------------------------------------------------------- */

const EVENT_ICON: Record<EventKind, any> = {
  birth: Sparkles,
  apprenticeship: Hammer,
  education: GraduationCap,
  romance: Heart,
  marriage: Handshake,
  childbirth: Baby,
  battle: Sword,
  discovery: FlaskConical,
  journey: Ship,
  tragedy: HeartCrack,
  plague: Biohazard,
  achievement: Trophy,
  study: BookOpen,
  guild: Users,
  rival: Skull,
  injury: Activity,
  fire: Flame,
  travel: Compass,
  religious: Church,
  political: Crown,
  trade: Briefcase,
  family: Users,
  legal: Scale,
  artistic: Book,
  agricultural: Wheat,
  maritime: Ship,
  death: Skull
};

// Color scheme for event importance
const EVENT_COLORS: Record<EventImportance, string> = {
  [EventImportance.MILESTONE]: 'bg-yellow-600 border-yellow-500',      // Gold
  [EventImportance.TRAGEDY]: 'bg-red-600 border-red-500',             // Red
  [EventImportance.INJURY]: 'bg-orange-600 border-orange-500',        // Orange
  [EventImportance.OPPORTUNITY]: 'bg-green-600 border-green-500',     // Green
  [EventImportance.RELATIONSHIP]: 'bg-purple-600 border-purple-500',  // Purple
  [EventImportance.MUNDANE]: 'bg-slate-600 border-slate-500'          // Gray
};

interface LifeEvent extends EnhancedLifeEvent {}

// Helper to determine era from year
function getHistoricalEraFromYear(year: number): string {
  if (year < -3000) return 'PREHISTORY';
  if (year < 500) return 'ANTIQUITY';
  if (year < 1450) return 'MEDIEVAL';
  if (year < 1800) return 'RENAISSANCE_EARLY_MODERN';
  if (year < 1950) return 'INDUSTRIAL_ERA';
  if (year < 2050) return 'MODERN_ERA';
  return 'FUTURE_ERA';
}

const generateExpandedLifeEvents = (
  char: PlayerCharacter,
  currentDate: string,
  companions: TamedAnimal[],
  culturalZone?: string,
  era?: string
): LifeEvent[] => {
  const currentYear = parseInt(currentDate || '', 10) || char.year || 1500;
  const nowYear = currentYear; // Keep for compatibility

  // Determine cultural zone from character data
  const zone = (culturalZone || char.culturalZone || 'EUROPEAN') as any;

  // Determine historical era from year
  const historicalEra = era || getHistoricalEraFromYear(currentYear) || 'MEDIEVAL';

  // Generate sophisticated, contextual life history
  const events = generateLifeHistory(
    char,
    currentYear,
    zone,
    historicalEra as any
  ) as LifeEvent[];

  // Add companion acquisitions to generated events
  if (companions?.length > 0) {
    companions.forEach(animal => {
      if (animal.tamingDate && animal.tamingDate.year) {
        events.push({
          year: animal.tamingDate.year,
          kind: 'animal' as EventKind,
          importance: EventImportance.RELATIONSHIP,
          title: `Tamed ${animal.speciesName}`,
          text: `Formed bond with a ${animal.speciesName.toLowerCase()}, gaining a loyal companion.`,
        });
      }
    });
  }

  // Sort chronologically and filter future events
  return events
    .filter((e) => e.year && e.year <= nowYear)
    .sort((a, b) => a.year - b.year);
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  character: PlayerCharacter;
  onCharacterUpdate: React.Dispatch<React.SetStateAction<PlayerCharacter | null>>;
  onRegenerate: () => void;
  isEnhancing?: boolean;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onDropItem: (item: Item) => void;
  onConsumeItem: (item: Item) => void;
  date: string;
  location: string;
}

const CharacterProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  character,
  onRegenerate,
  isEnhancing,
  onEquipItem,
  onUnequipItem,
  onDropItem,
  onConsumeItem,
  date,
  location,
}) => {
  // Early return MUST come before any hooks
  if (!isOpen || !character) return null;

  const { setIsPortraitModalOpen, setPortraitModalCharacter } = useUI();

  const [active, setActive] = useState<
    'overview' | 'health' | 'equipment' | 'inventory' | 'beliefs' | 'history' | 'household'
  >('overview');

  const [inventoryFilter, setInventoryFilter] = useState<'All' | 'Weapons' | 'Clothing' | 'Consumables' | 'Other'>('All');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [selectedDisease, setSelectedDisease] = useState<ActiveDisease | null>(null);
  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);

  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<TamedAnimal | null>(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);

  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [highlightedEventYear, setHighlightedEventYear] = useState<number | null>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Safari performance optimization - remove expensive CSS effects
  useEffect(() => {
    if (isSafari()) {
      const style = document.createElement('style');
      style.id = 'safari-character-modal-optimization';
      style.textContent = `
        .ff-panel button,
        .modal-overlay button {
          filter: none !important;
          text-shadow: none !important;
          -webkit-filter: none !important;
          transition: background-color 0.15s, transform 0.15s !important;
        }
        .ff-panel *,
        .modal-overlay * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        /* Simplify animations for Safari */
        @media (prefers-reduced-motion: no-preference) {
          .ff-panel *, .modal-overlay * {
            animation-duration: 0.2s !important;
          }
        }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('safari-character-modal-optimization');
        if (existingStyle) existingStyle.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen && active === 'profile') {
      setTamedAnimals(loadTamedAnimals());
    }
  }, [isOpen, active]);

  const refreshAnimals = useCallback(() => setTamedAnimals(loadTamedAnimals()), []);

  const handleReleaseAnimal = useCallback((animalId: string) => {
    removeFromParty(animalId);
    refreshAnimals();
  }, [refreshAnimals]);

  // Memoized event handlers to prevent re-creation on every render
  const handleTabChange = useCallback((tab: typeof active) => {
    setActive(tab);
  }, []);

  const handleInventoryFilterChange = useCallback((filter: typeof inventoryFilter) => {
    setInventoryFilter(filter);
  }, []);

  const handleItemSelect = useCallback((item: Item) => {
    setSelectedItem(item);
  }, []);

  const handleOpenDiseaseModal = useCallback((disease: ActiveDisease) => {
    setSelectedDisease(disease);
    setIsDiseaseModalOpen(true);
  }, []);

  const handleCloseDiseaseModal = useCallback(() => {
    setIsDiseaseModalOpen(false);
    setSelectedDisease(null);
  }, []);

  const handleOpenAnimalModal = useCallback((animal: TamedAnimal) => {
    setSelectedAnimal(animal);
    setIsAnimalModalOpen(true);
  }, []);

  const handleCloseAnimalModal = useCallback(() => {
    setIsAnimalModalOpen(false);
    setSelectedAnimal(null);
  }, []);

  const handleOpenPortrait = useCallback(() => {
    setIsPortraitModalOpen(true);
    setPortraitModalCharacter(character);
  }, [character, setIsPortraitModalOpen, setPortraitModalCharacter]);

  const handleToggleAttributeModal = useCallback(() => {
    setShowAttributeModal(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setActive('overview');
      setSelectedItem(null);
    }
  }, [isOpen]);

  // Determine cultural zone and era for life event generation
  const culturalZone = useMemo(() => {
    if (location?.culturalZone) return location.culturalZone;
    if (character.culturalZone) return character.culturalZone;
    // Try to map from location if available
    if (location) {
      const mapped = mapLocationToCulture(location.x, location.y);
      if (mapped) return mapped;
    }
    return 'EUROPEAN'; // default fallback
  }, [location, character.culturalZone]);

  const era = useMemo(() => {
    const year = parseInt(date || '1500', 10);
    return getHistoricalEraFromYear(year);
  }, [date]);

  // Lazy-load life events only when history tab is active
  const [lifeEventsGenerated, setLifeEventsGenerated] = useState(false);
  const [expandedLifeEvents, setExpandedLifeEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    if (active === 'history' && !lifeEventsGenerated && character) {
      // Debounced generation with longer delay to avoid blocking UI
      const timeoutId = setTimeout(() => {
        // Use requestIdleCallback if available for better performance
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            const events = generateExpandedLifeEvents(character, date, tamedAnimals, culturalZone, era);
            setExpandedLifeEvents(events);
            setLifeEventsGenerated(true);
          }, { timeout: 2000 });
        } else {
          // Fallback to setTimeout with longer delay
          const events = generateExpandedLifeEvents(character, date, tamedAnimals, culturalZone, era);
          setExpandedLifeEvents(events);
          setLifeEventsGenerated(true);
        }
      }, 500); // Increased delay from 100ms to 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [active, lifeEventsGenerated, character, date, tamedAnimals, culturalZone, era]);

  // Helper to find events mentioning family members
  const findFamilyEvents = useCallback((familyMemberName: string) => {
    return expandedLifeEvents.filter(event => {
      const textMentions = event.text.toLowerCase().includes(familyMemberName.toLowerCase());
      const titleMentions = event.title.toLowerCase().includes(familyMemberName.toLowerCase());

      // Check for parent death events specifically
      const isFatherDeath = familyMemberName === character.family?.find(f => f.relation === 'father')?.name &&
        (event.title.toLowerCase().includes('father') || event.text.toLowerCase().includes('father'));
      const isMotherDeath = familyMemberName === character.family?.find(f => f.relation === 'mother')?.name &&
        (event.title.toLowerCase().includes('mother') || event.text.toLowerCase().includes('mother'));

      // Check linked characters
      const linkedMention = event.linkedCharacters?.some(char =>
        char.toLowerCase() === familyMemberName.toLowerCase() ||
        (char === 'father' && familyMemberName === character.family?.find(f => f.relation === 'father')?.name) ||
        (char === 'mother' && familyMemberName === character.family?.find(f => f.relation === 'mother')?.name)
      );

      return textMentions || titleMentions || isFatherDeath || isMotherDeath || linkedMention;
    });
  }, [expandedLifeEvents, character.family]);

  // Scroll to and highlight specific event
  const scrollToEvent = useCallback((year: number) => {
    setHighlightedEventYear(year);
    if (timelineRef.current) {
      const eventElement = timelineRef.current.querySelector(`[data-year="${year}"]`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Remove highlight after animation
        setTimeout(() => setHighlightedEventYear(null), 2000);
      }
    }
  }, []);

  const healthHistory = useMemo(() => {
    const res: Array<{ year: number; age: number; disease: string; outcome: string }> = [];
    if (character.diseaseHealth?.pastDiseases) {
      character.diseaseHealth.pastDiseases.forEach(d => {
        const age = Math.max(5, Math.floor(Math.random() * character.age));
        const year = (parseInt(character.birthYear || '0', 10) || (character.year || 1500) - character.age) + age;
        res.push({ year, age, disease: d.name, outcome: Math.random() > 0.3 ? 'Recovered fully' : 'Lingering weakness' });
      });
    }
    return res;
  }, [character?.diseaseHealth?.pastDiseases, character?.age, character?.birthYear]);

  const allItems = useMemo(() => character.inventory || [], [character.inventory]);
  const filtered = useMemo(() => {
    if (inventoryFilter === 'All') return allItems;
    return allItems.filter(i => {
      switch (inventoryFilter) {
        case 'Weapons':
          return i.category === 'Weapon';
        case 'Clothing':
          return i.category === 'Apparel';
        case 'Consumables':
          return i.category === 'Consumable' || i.sustenance > 0 || i.fatigueEffect || i.xpEffect;
        case 'Other':
          return !['Weapon', 'Apparel', 'Consumable'].includes(i.category) && !i.sustenance && !i.fatigueEffect && !i.xpEffect;
      }
    });
  }, [allItems, inventoryFilter]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedItem(null);
      return;
    }
    if (!selectedItem || !filtered.find(i => i.id === selectedItem.id)) {
      setSelectedItem(filtered[0]);
    }
  }, [filtered, selectedItem]);

  // Remove heavy memoization - LazyPortrait handles optimization internally

  // Memoized item description to prevent expensive recalculation
  const memoizedItemDescription = useMemo(() => {
    if (!selectedItem) return '';
    return isGenericDescription(selectedItem.description, selectedItem.name)
      ? generateProceduralItemDescription(selectedItem)
      : selectedItem.description;
  }, [selectedItem?.description, selectedItem?.name, selectedItem?.id]);

  /* ----------------------------- Fixed Heights ---------------------------- */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="ff-panel w-full max-w-7xl h-[93vh] flex flex-col text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_300px_at_50%_-40%,rgba(59,130,246,.25),transparent)] pointer-events-none" />
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900/65 border-b-2 border-slate-700">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600 shadow-lg bg-slate-800">
                  <LazyPortrait
                    character={character}
                    size={44}
                    type="animated"
                    trackChanges
                    immediate={true} // Header portrait should load immediately
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-3xl font-bold text-white truncate">{character.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold capitalize border border-amber-400/40 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {character.profession}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/40 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> Lv. {character.level}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/40 flex items-center gap-1">
                      <Handshake className="w-3.5 h-3.5" /> {character.mapReputation ?? character.reputation ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-xs font-semibold border border-yellow-400/40 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {character.currency ?? 0}
                    </span>
                    {/* Character Attributes - moved to badge row */}
                    {character.attributes && character.attributes.length > 0 && (
                      <button
                        onClick={handleToggleAttributeModal}
                        className="flex-shrink-0 ml-auto rounded-lg hover:bg-slate-700/30 px-1 py-0.5 transition-all"
                        title="View all attributes"
                      >
                        <AttributeBadgeList badges={character.attributes} maxDisplay={2} size="small" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-600
                           bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Left: Party */}
          <aside className="hidden md:flex flex-col gap-4 p-5 border-r-2 border-slate-700 bg-slate-800/30 min-h-0 overflow-y-auto">
            <h3 className="font-press-start text-xl text-slate-300 text-center tracking-wider">PARTY</h3>

            {/* Player card */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/40 border border-slate-600/50">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-500 bg-slate-900 shadow-lg grid place-items-center">
                  <LazyPortrait
                    character={character}
                    size={80}
                    type="procedural"
                    useEquippedItems
                    immediate={false} // Can lazy-load this one
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-lg truncate">{character.name}</div>
                  <div className="text-amber-300 text-sm capitalize truncate">{character.profession}</div>
                  <div className="text-blue-300 text-sm mt-1">Level {character.level}</div>
                </div>
              </div>
            </div>

            {/* Animal Companions (quick actions) */}
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider text-center">Animal Companions</h4>
              {tamedAnimals.length ? (
                tamedAnimals.map(a => {
                  const hp = (a.health / 10) * 100;
                  const data = ANIMAL_DATA[a.baseId];
                  return (
                    <div
                      key={a.id}
                      className="group p-3 rounded-lg bg-gradient-to-br from-green-900/30 to-slate-800/40 border border-green-600/30 hover:border-green-500/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-slate-900/70 border border-slate-600/60 grid place-items-center">
                          <PawPrint className="w-4 h-4 text-green-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate capitalize group-hover:text-green-300">
                            {a.name || a.speciesName}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{data?.type || 'animal'}</div>
                          <div className="h-1 rounded bg-slate-700 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded ${hp > 70 ? 'bg-emerald-500' : hp > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${hp}%` }}
                            />
                          </div>
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-slate-700 text-slate-300"
                          title="More"
                          onClick={() => {
                            setSelectedAnimal(a);
                            setIsAnimalModalOpen(true);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setSelectedAnimal(a);
                            setIsAnimalModalOpen(true);
                          }}
                          className="px-2 py-1 text-xs border border-slate-600 rounded text-slate-300 hover:bg-slate-700"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleReleaseAnimal(a.id)}
                          className="px-2 py-1 text-xs border border-red-500/60 rounded text-red-200 bg-red-800/40 hover:bg-red-700/50"
                        >
                          Release
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm italic">No animal companions</div>
              )}
            </section>
          </aside>

          {/* Right: Tabs + Content */}
          <main className="flex flex-col min-h-0">
            {/* Tabs */}
            <div className="shrink-0 flex border-b-2 border-slate-700 bg-slate-800/60 overflow-x-auto">
              <TabBtn label="Overview" active={active === 'overview'} onClick={() => handleTabChange('overview')} Icon={Home} />
              <TabBtn label="Stats" active={active === 'health'} onClick={() => handleTabChange('health')} Icon={Activity} />
              <TabBtn label="Equipment" active={active === 'equipment'} onClick={() => handleTabChange('equipment')} Icon={Sword} />
              <TabBtn label="Inventory" active={active === 'inventory'} onClick={() => handleTabChange('inventory')} Icon={Backpack} />
              <TabBtn label="Beliefs" active={active === 'beliefs'} onClick={() => handleTabChange('beliefs')} Icon={Sparkles} />
              <TabBtn label="History" active={active === 'history'} onClick={() => handleTabChange('history')} Icon={Scroll} />
              <TabBtn label="Household" active={active === 'household'} onClick={() => handleTabChange('household')} Icon={House} />
            </div>

            {/* Content (scrolls) */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/40">
              {/* OVERVIEW ----------------------------------------------------- */}
              {active === 'overview' && (
                <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Portrait + Vitals */}
                  <div className="space-y-5">
                    <div
                      className="relative group cursor-pointer"
                      title="Click to view full portrait"
                      onClick={handleOpenPortrait}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900/70 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-black/30 pointer-events-none" />
                        <LazyPortrait
                          character={character}
                          size={300}
                          type="animated"
                          trackChanges
                          immediate={false} // Definitely lazy-load this large one
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition text-xs">
                        View
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Vitals</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-red-400"><Heart className="w-4 h-4" /> Health</span>
                            <span className="text-white font-bold">
                              {Math.round(character.health)}/{Math.round(character.maxHealth)}
                            </span>
                          </div>
                          <div className="h-3 rounded bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-600 to-red-400"
                              style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-amber-400"><Moon className="w-4 h-4" /> Fatigue</span>
                            <span className="text-white font-bold">
                              {Math.round(character.fatigue)}/{Math.round(character.maxFatigue || 100)}
                            </span>
                          </div>
                          <div className="h-3 rounded bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                              style={{ width: `${(character.fatigue / (character.maxFatigue || 100)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-cyan-400"><Star className="w-4 h-4" /> Experience</span>
                            <span className="text-white font-bold">
                              {Math.round(character.experience)}/{Math.round(character.maxExperience)}
                            </span>
                          </div>
                          <div className="h-3 rounded bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              style={{ width: `${(character.experience / character.maxExperience) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {character.diseaseHealth?.currentDiseases?.length ? (
                        <div className="pt-4 mt-4 border-t border-slate-700/60">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-pink-300 mb-2">Conditions</h5>
                          <div className="flex flex-wrap gap-2">
                            {character.diseaseHealth.currentDiseases.map((d, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedDisease(d);
                                  setIsDiseaseModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-full border border-pink-400/50 bg-pink-600/70 text-white text-xs font-bold hover:bg-pink-500/80 flex items-center gap-1"
                                title={`View details for ${d.disease.name}`}
                              >
                                <Biohazard className="w-3.5 h-3.5" />
                                {d.disease.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Body Modifications */}
                    {(character.equippedItems?.accessory || character.appearance?.markings?.length > 0) && (
                      (() => {
                        const modifications: Array<{
                          name: string;
                          type: string;
                          isPermanent: boolean;
                          duration?: number;
                          significance?: string;
                        }> = [];
                        
                        // Add equipped accessory if it's a body modification
                        if (character.equippedItems?.accessory) {
                          const accessory = character.equippedItems.accessory;
                          const specialType = (accessory as any).specialType;
                          if (specialType) {
                            modifications.push({
                              name: accessory.name,
                              type: specialType,
                              isPermanent: (accessory as any).isPermanent || false,
                              duration: (accessory as any).duration,
                              significance: AccessoryMaintenanceService.getCulturalSignificance(accessory)
                            });
                          }
                        }
                        
                        // Add cultural markings from appearance
                        if (character.appearance?.markings) {
                          character.appearance.markings.forEach((marking: any) => {
                            modifications.push({
                              name: marking.name || `${marking.type} marking`,
                              type: marking.type,
                              isPermanent: marking.isPermanent !== false,
                              duration: marking.duration,
                              significance: marking.culturalSignificance
                            });
                          });
                        }
                        
                        if (modifications.length === 0) return null;
                        
                        return (
                          <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-800/50">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Body Modifications
                            </h4>
                            <div className="space-y-2">
                              {modifications.map((mod, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                                  <div className="flex items-center gap-2">
                                    {mod.type === 'tattoo' && <span className="text-lg">🖤</span>}
                                    {mod.type === 'scarification' && <span className="text-lg">⚡</span>}
                                    {mod.type === 'face_paint' && <span className="text-lg">🎨</span>}
                                    {mod.type === 'paint' && <span className="text-lg">🎨</span>}
                                    {mod.type === 'henna' && <span className="text-lg">🌿</span>}
                                    {mod.type === 'piercing' && <span className="text-lg">💍</span>}
                                    {mod.type === 'ash' && <span className="text-lg">⚱️</span>}
                                    <div>
                                      <p className="text-sm font-semibold text-white">{mod.name}</p>
                                      <p className="text-xs text-slate-400 capitalize">{mod.type.replace('_', ' ')}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {mod.isPermanent && (
                                      <span className="px-2 py-1 rounded-full bg-red-600/70 text-red-200 text-xs font-bold">
                                        Permanent
                                      </span>
                                    )}
                                    {mod.duration && (
                                      <span className="px-2 py-1 rounded-full bg-yellow-600/70 text-yellow-200 text-xs font-bold">
                                        Temporary ({mod.duration}h)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {modifications[0]?.significance && (
                                <p className="text-xs text-slate-300 italic mt-2">
                                  {modifications[0].significance}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Background */}
                  <div className="space-y-5">
                    <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-800/50 h-full">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">Background</h4>
                      <p className="text-slate-200/90 leading-relaxed italic whitespace-pre-wrap">
                        {character.backstory}
                      </p>
                    </div>
                  </div>

                  {/* Info + Top Stats */}
                  <div className="space-y-5">
                    <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Character Info</h4>
                      <div className="space-y-2">
                        <DetailRow label="Level" value={character.level} />
                        <DetailRow label="Age" value={character.age} />
                        <DetailRow label="Class" value={character.class?.replace(/_/g, ' ') || '—'} />
                        <DetailRow label="Religion" value={character.religion || '—'} />
                        <DetailRow label="Height" value={cmToFeetAndInches(character.appearance?.height)} />
                        <DetailRow label="Weight" value={kgToLbs(character.appearance?.weight)} />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTabChange('equipment')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 text-amber-300">
                            <Sword className="w-4 h-4" />
                            <span className="text-xs font-semibold">Equipment</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleTabChange('inventory')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 text-green-300">
                            <Backpack className="w-4 h-4" />
                            <span className="text-xs font-semibold">Inventory</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleTabChange('health')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 text-red-300">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-semibold">Full Stats</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleTabChange('household')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 text-blue-300">
                            <House className="w-4 h-4" />
                            <span className="text-xs font-semibold">Household</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-700/60 bg-slate-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Top Stats</h4>
                      <div className="space-y-3">
                        {Object.entries(character.stats)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <StatBar
                              key={k}
                              label={k.charAt(0).toUpperCase() + k.slice(1)}
                              value={v}
                              Icon={
                                k === 'strength'
                                  ? Dumbbell
                                  : k === 'dexterity'
                                  ? Feather
                                  : k === 'constitution'
                                  ? Shield
                                  : k === 'intelligence'
                                  ? Brain
                                  : k === 'persuasion'
                                  ? MessageSquare
                                  : Eye
                              }
                              color={
                                k === 'strength'
                                  ? '#ef4444'
                                  : k === 'dexterity'
                                  ? '#22c55e'
                                  : k === 'constitution'
                                  ? '#f97316'
                                  : k === 'intelligence'
                                  ? '#3b82f6'
                                  : k === 'persuasion'
                                  ? '#8b5cf6'
                                  : '#eab308'
                              }
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HEALTH ------------------------------------------------------- */}
              {active === 'health' && (
                <div className="p-6 space-y-8">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/50 border border-slate-700/60">
                    <h3 className="text-pink-400 font-bold uppercase tracking-wider mb-4">Current Health Status</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <DetailRow
                          label="Overall Health"
                          value={
                            <span className="text-white">
                              {Math.round(character.health)}/{Math.round(character.maxHealth)} HP
                            </span>
                          }
                        />
                        <div className="h-4 rounded bg-slate-700 overflow-hidden mb-4">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400"
                            style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                          />
                        </div>
                        <DetailRow
                          label="Fatigue Level"
                          value={
                            <span className="text-white">
                              {Math.round(character.fatigue)}/{Math.round(character.maxFatigue || 100)}
                            </span>
                          }
                        />
                        <div className="h-4 rounded bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                            style={{ width: `${(character.fatigue / character.maxFatigue) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-3">Disease Status</h4>
                        {character.diseaseHealth?.currentDiseases?.length ? (
                          <div className="space-y-2">
                            {character.diseaseHealth.currentDiseases.map((d, i) => (
                              <div key={i} className="p-3 rounded-lg bg-pink-900/25 border border-pink-600/40">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-pink-300 flex items-center gap-1">
                                    <Biohazard className="w-4 h-4" /> {d.disease.name}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedDisease(d);
                                      setIsDiseaseModalOpen(true);
                                    }}
                                    className="text-xs text-pink-300 underline hover:text-pink-200"
                                  >
                                    Details
                                  </button>
                                </div>
                                <div className="text-xs text-slate-300 mt-1">
                                  Severity:{' '}
                                  <span
                                    className={
                                      d.disease.severity === 'severe'
                                        ? 'text-red-400'
                                        : d.disease.severity === 'moderate'
                                        ? 'text-yellow-400'
                                        : 'text-green-400'
                                    }
                                  >
                                    {d.disease.severity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-600/40">
                            <span className="text-emerald-400 font-semibold">✅ Currently Healthy</span>
                            <p className="text-xs text-slate-400 mt-1">No active diseases or infections</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-slate-300 font-bold uppercase tracking-wider mb-4">Core Stats</h3>
                      <div className="space-y-4">
                        <StatBar label="Strength" value={character.stats.strength} Icon={Dumbbell} color="#ef4444" />
                        <StatBar label="Dexterity" value={character.stats.dexterity} Icon={Feather} color="#22c55e" />
                        <StatBar label="Constitution" value={character.stats.constitution} Icon={Shield} color="#f97316" />
                        <StatBar label="Intelligence" value={character.stats.intelligence} Icon={Brain} color="#3b82f6" />
                        <StatBar label="Persuasion" value={character.stats.persuasion} Icon={MessageSquare} color="#8b5cf6" />
                        <StatBar label="Perception" value={character.stats.perception} Icon={Eye} color="#eab308" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-slate-300 font-bold uppercase tracking-wider mb-4">Personality</h3>
                      <div className="space-y-4">
                        <StatBar 
                          label="Openness" 
                          value={Math.round(character.personality.openness * 100)} 
                          max={100} 
                          Icon={Sparkles} 
                          color="#60a5fa"
                          tooltip="Affects curiosity, creativity, and willingness to try new experiences or learn new skills"
                        />
                        <StatBar 
                          label="Conscientiousness" 
                          value={Math.round(character.personality.conscientiousness * 100)} 
                          max={100} 
                          Icon={Shield} 
                          color="#34d399"
                          tooltip="Influences work quality, reliability, and tendency to complete tasks thoroughly"
                        />
                        <StatBar 
                          label="Extraversion" 
                          value={Math.round(character.personality.extraversion * 100)} 
                          max={100} 
                          Icon={Handshake} 
                          color="#a78bfa"
                          tooltip="Determines social energy, leadership tendencies, and comfort in group situations"
                        />
                        <StatBar 
                          label="Agreeableness" 
                          value={Math.round(character.personality.agreeableness * 100)} 
                          max={100} 
                          Icon={Heart} 
                          color="#fb7185"
                          tooltip="Affects cooperation, trust, and willingness to help others or avoid conflict"
                        />
                        <StatBar 
                          label="Neuroticism" 
                          value={Math.round(character.personality.neuroticism * 100)} 
                          max={100} 
                          Icon={Activity} 
                          color="#f59e0b"
                          tooltip="Influences emotional stability, stress response, and susceptibility to anxiety"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EQUIPMENT ---------------------------------------------------- */}
              {active === 'equipment' && (
                <div className="p-5">
                  <EquipmentPanel character={character} onEquipItem={onEquipItem} onUnequipItem={onUnequipItem} />
                </div>
              )}

              {/* INVENTORY (bigger images) ----------------------------------- */}
              {active === 'inventory' && (
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
                  <div className="lg:col-span-2 flex flex-col rounded-lg border border-slate-700/60 bg-slate-800/45 min-h-0">
                    <div className="flex justify-between items-center px-3 py-2 border-b border-slate-700/60">
                      <h4 className="font-semibold text-lg text-green-300 flex items-center gap-2">
                        <Backpack className="w-5 h-5" /> Inventory
                      </h4>
                      <div className="flex gap-1 p-1 rounded bg-slate-900/50">
                        {(['All', 'Weapons', 'Clothing', 'Consumables', 'Other'] as const).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setInventoryFilter(cat)}
                            className={`px-2 py-0.5 text-xs rounded ${
                              inventoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {filtered.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            selectedItem?.id === item.id ? 'bg-blue-800/45 ring-1 ring-blue-500' : 'bg-slate-900/50 hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="w-14 h-14 shrink-0 grid place-items-center"> {/* larger row thumb */}
                            <GenerativeItemIcon item={item} size={56} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-semibold truncate">{formatItemName(item.name)}</div>
                            <div className="text-xs text-slate-400 truncate">{item.category}</div>
                          </div>
                          {item.stackable && item.quantity > 1 ? <span className="text-xs text-slate-400">x{item.quantity}</span> : null}
                          <RarityTag rarity={item.rarity} />
                        </div>
                      ))}
                      {!filtered.length && <p className="text-center text-slate-500 italic py-8 text-sm">No items in this category.</p>}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700/60 bg-slate-800/45 p-3 flex flex-col">
                    {selectedItem ? (
                      <>
                        <div className="w-36 h-36 mx-auto my-3 grid place-items-center"> {/* bigger preview */}
                          <GenerativeItemIcon item={selectedItem} size={140} />
                        </div>
                        <h5 className="text-lg font-bold text-white text-center mb-1">{formatItemName(selectedItem.name)}</h5>
                        <p className="text-sm text-slate-400 italic text-center mb-3">
                          {memoizedItemDescription}
                        </p>
                        <div className="text-xs space-y-1 mb-4 p-2 rounded bg-slate-900/30">
                          <DetailRow label="Category" value={selectedItem.category} />
                          <DetailRow label="Value" value={`${selectedItem.value} 🪙`} />
                          <DetailRow label="Weight" value={`${selectedItem.weight} lbs`} />
                        </div>
                        <div className="mt-auto space-y-2">
                          {(selectedItem.wearable || selectedItem.wieldable) && (
                            <button onClick={() => onEquipItem(selectedItem)} className="w-full ff-action-button">
                              Equip
                            </button>
                          )}
                          {(selectedItem.sustenance > 0 || selectedItem.fatigueEffect || selectedItem.xpEffect) && (
                            <button onClick={() => onConsumeItem(selectedItem)} className="w-full ff-action-button">
                              Consume
                            </button>
                          )}
                          <button
                            onClick={() => onDropItem(selectedItem)}
                            className="w-full ff-action-button bg-red-800/50 border-red-500/50 hover:bg-red-700/60"
                          >
                            Drop
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full grid place-items-center text-slate-500 italic">Select an item</div>
                    )}
                  </div>
                </div>
              )}

              {/* BELIEFS ------------------------------------------------------ */}
              {active === 'beliefs' && (
                <div className="p-6">
                  <BeliefsPanel character={character} />
                </div>
              )}

              {/* HISTORY (enhanced with portraits and interactivity) --------- */}
              {active === 'history' && (
                <CharacterHistoryTab
                  character={character}
                  expandedLifeEvents={expandedLifeEvents}
                  lifeEventsGenerated={lifeEventsGenerated}
                  findFamilyEvents={findFamilyEvents}
                  scrollToEvent={scrollToEvent}
                  timelineRef={timelineRef}
                  highlightedEventYear={highlightedEventYear}
                />
              )}

              {/* HOUSEHOLD (now shows companions with Release) ---------------- */}
              {active === 'household' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-amber-400 font-bold uppercase tracking-wider">Current Household</h3>

                  {/* Summary card */}
                  <div className="p-3 rounded-lg border border-slate-700/60 bg-slate-800/45">
                    <p className="text-sm text-slate-400">
                      Living in a{' '}
                      {character.wealthLevel === 'wealthy'
                        ? 'grand estate'
                        : character.wealthLevel === 'comfortable'
                        ? 'comfortable home'
                        : character.wealthLevel === 'modest'
                        ? 'modest dwelling'
                        : 'humble cottage'}
                      .
                    </p>
                  </div>

                  {/* Human members from character.family (if any) */}
                  {(character.family || []).length > 0 && (
                    <>
                      <h4 className="text-blue-300 font-semibold uppercase tracking-wider text-xs">Household Members</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {(character.family || []).map((m, i) => (
                          <div key={`${m.relation}-${m.name}-${i}`} className="p-4 rounded-lg border border-slate-700/60 bg-gradient-to-br from-slate-800/55 to-slate-900/40">
                            <div className="flex justify-between mb-1">
                              <div>
                                <div className="font-semibold text-white capitalize">{m.name}</div>
                                <div className="text-xs text-blue-300 capitalize">{m.relation}</div>
                              </div>
                              {'age' in m && <div className="text-xs text-slate-400">Age {m.age}</div>}
                            </div>
                            <div className="text-sm space-y-1">
                              {'profession' in m && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Occupation:</span>
                                  <span className="text-slate-300">{(m as any).profession}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Companion animals section */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-green-300 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                      <PawPrint className="w-4 h-4" />
                      Companion Animals
                    </h4>
                    {tamedAnimals.length > 0 && (
                      <span className="text-xs text-slate-400">{tamedAnimals.length} total</span>
                    )}
                  </div>

                  {tamedAnimals.length ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {tamedAnimals.map(a => {
                        const hp = (a.health / 10) * 100;
                        const data = ANIMAL_DATA[a.baseId];
                        return (
                          <div key={a.id} className="p-4 rounded-lg border border-green-700/40 bg-gradient-to-br from-green-900/25 to-slate-900/40">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-white capitalize truncate">
                                  {a.name || a.speciesName}
                                </div>
                                <div className="text-xs text-slate-400 capitalize truncate">{data?.type || 'animal'}</div>
                              </div>
                              <div className="w-9 h-9 rounded-md bg-slate-900/70 border border-slate-600/60 grid place-items-center shrink-0">
                                <PawPrint className="w-5 h-5 text-green-300" />
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-400">Health</span>
                                  <span className="text-white">{Math.round(a.health)}/10</span>
                                </div>
                                <div className="h-2 rounded bg-slate-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded ${hp > 70 ? 'bg-emerald-500' : hp > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${hp}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedAnimal(a);
                                    setIsAnimalModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 text-xs border border-slate-600 rounded text-slate-200 hover:bg-slate-700"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleReleaseAnimal(a.id)}
                                  className="ff-action-button bg-red-800/50 border-red-500/60 hover:bg-red-700/60 text-xs px-3 py-1.5"
                                >
                                  Release
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg border border-slate-700/60 bg-slate-800/45 text-center">
                      <p className="text-sm text-slate-500 italic">No animal companions in your household.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between p-4 border-t-2 border-slate-700 bg-slate-800/75">
          <button onClick={onRegenerate} className="ff-action-button" disabled={isEnhancing}>
            {isEnhancing ? 'Enhancing...' : 'Regenerate Character'}
          </button>
          <button onClick={onClose} className="ff-action-button">Close</button>
        </div>
      </div>

      {/* Disease Modal */}
      {selectedDisease && (
        <DiseaseModal
          disease={selectedDisease}
          isOpen={isDiseaseModalOpen}
          onClose={() => {
            setIsDiseaseModalOpen(false);
            setSelectedDisease(null);
          }}
          currentYear={parseInt(date || '1500', 10)}
          culturalZone={mapLocationToCulture(location, parseInt(date || '1500', 10))}
        />
      )}

      {/* Quick animal detail modal */}
      {selectedAnimal && isAnimalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAnimalModalOpen(false)}>
          <div
            className="bg-modal-bg-gradient border border-slate-600 rounded-2xl text-slate-200 w-full max-w-md p-6 shadow-glow-blue"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-2 mb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-slate-900/70 border border-slate-600/60 grid place-items-center">
                  <PawPrint className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-300 capitalize">{selectedAnimal.speciesName}</h3>
                  <p className="text-xs text-slate-400 capitalize">{ANIMAL_DATA[selectedAnimal.baseId]?.type || 'animal'}</p>
                </div>
              </div>
              <button onClick={() => setIsAnimalModalOpen(false)} className="text-3xl text-slate-400 hover:text-white">
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-amber-400 font-semibold">Tamed:</span>{' '}
                {selectedAnimal.tamingDate.month}/{selectedAnimal.tamingDate.day}/{selectedAnimal.tamingDate.year}
              </div>
              <div>
                <span className="text-amber-400 font-semibold">Market Value:</span> {selectedAnimal.value} coins
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Health</span>
                  <span className="text-white">{Math.round(selectedAnimal.health)}/10</span>
                </div>
                <div className="h-2 rounded bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded ${
                      (selectedAnimal.health / 10) * 100 > 70 ? 'bg-emerald-500' : (selectedAnimal.health / 10) * 100 > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(selectedAnimal.health / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Loyalty</span>
                  <span className="text-white">{Math.round(selectedAnimal.loyalty)}/100</span>
                </div>
                <div className="h-2 rounded bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded ${selectedAnimal.loyalty > 70 ? 'bg-blue-500' : selectedAnimal.loyalty > 40 ? 'bg-purple-500' : 'bg-slate-500'}`}
                    style={{ width: `${selectedAnimal.loyalty}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  removeFromParty(selectedAnimal.id);
                  refreshAnimals();
                  setIsAnimalModalOpen(false);
                }}
                className="px-4 py-2 text-sm bg-red-600/80 hover:bg-red-500 text-white rounded border border-red-400"
              >
                Release Animal
              </button>
              <button onClick={() => setIsAnimalModalOpen(false)} className="px-6 py-2 text-sm font-semibold bg-slate-600 hover:bg-slate-500 rounded text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full companion editor (rename, etc.) */}
      {selectedAnimal && (
        <AnimalCompanionModal
          animal={selectedAnimal}
          isOpen={isAnimalModalOpen}
          onClose={() => {
            setIsAnimalModalOpen(false);
            setSelectedAnimal(null);
          }}
          onUpdateName={(id, name) => {
            updateAnimalName(id, name);
            refreshAnimals();
          }}
        />
      )}

      {/* Attribute Modal */}
      {showAttributeModal && character.attributes && (
        <AttributeModal
          isOpen={showAttributeModal}
          onClose={() => setShowAttributeModal(false)}
          attributes={character.attributes}
          characterName={character.name}
        />
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render if isOpen changes or if character's key data changes
export default React.memo(CharacterProfileModal, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)

  // Always re-render if open/close state changes
  if (prevProps.isOpen !== nextProps.isOpen) return false;

  // If closed, don't bother checking other props
  if (!nextProps.isOpen) return true;

  // Check if character has fundamentally changed
  if (prevProps.character?.id !== nextProps.character?.id) return false;
  if (prevProps.character?.health !== nextProps.character?.health) return false;
  if (prevProps.character?.fatigue !== nextProps.character?.fatigue) return false;
  if (prevProps.character?.experience !== nextProps.character?.experience) return false;
  if (prevProps.character?.inventory?.length !== nextProps.character?.inventory?.length) return false;
  if (prevProps.character?.level !== nextProps.character?.level) return false;

  // Check if date/location changed significantly
  if (prevProps.date !== nextProps.date) return false;
  if (prevProps.location !== nextProps.location) return false;

  // Check if loading state changed
  if (prevProps.isEnhancing !== nextProps.isEnhancing) return false;

  // Otherwise, props are similar enough to skip re-render
  return true;
});
