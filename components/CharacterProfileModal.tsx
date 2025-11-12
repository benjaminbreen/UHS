/**
 * components/CharacterProfileModal.tsx
 * Fixed-height modal, companion animals in Household (with release), richer timeline with icons,
 * lucide-react icons everywhere, larger inventory preview, and small UX polish.
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  PlayerCharacter,
  EquipmentSlot,
  Item,
  Rarity,
} from '../types';
import { useUI } from '../contexts/UIContext';
import { useSimpleTabNavigation } from '../hooks/useTabNavigation';
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

// Lazy-load heavy tab components for better performance
const CharacterHistoryTab = React.lazy(() => import('./CharacterHistoryTab').then(m => ({ default: m.CharacterHistoryTab })));

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
    <span className="text-text-secondary">{label}:</span>
    <span className="text-text-primary font-semibold text-right">{value}</span>
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
      <div className="w-40 text-sm text-text-primary flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex-1 h-3 rounded-full bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
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
        <span className="w-8 text-right font-bold text-text-primary">{value}</span>
        {value > 8 && <span className="text-green-400 text-xs">▲</span>}
        {value < 5 && <span className="text-red-400 text-xs">▼</span>}
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-0 bottom-full mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-[100]">
        <div className="tooltip-surface px-3 py-2 text-xs shadow-xl max-w-xs">
          <div className="font-semibold text-text-primary mb-1">{label} {value}</div>
          <div className="text-text-secondary">{impact}</div>
          <div className="absolute top-full left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--surface-tooltip-bg)]"></div>
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
    role="tab"
    aria-selected={active}
    aria-label={`${label} tab`}
    tabIndex={active ? 0 : -1}
    className={[
      'relative flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold transition-all duration-200 shrink-0',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      active
        ? [
            // Active tab - folder style with rounded top
            'text-text-primary rounded-t-lg -mb-px z-10',
            'surface-card border-t-2 border-x-2',
            // Themed border
            'border-[color:var(--accent-primary)]/40',
            'shadow-[0_-2px_8px_rgba(0,0,0,0.08)]',
            'dark:shadow-[0_-2px_12px_rgba(0,0,0,0.3)]',
            'focus:ring-[color:var(--accent-primary)]',
          ].join(' ')
        : [
            // Inactive tab - subtle, sits behind
            'text-text-secondary bg-transparent',
            'hover:text-text-primary hover:bg-[var(--surface-muted-bg)]',
            'rounded-t-md border-b border-[var(--border-subtle)]',
            'focus:ring-[var(--border-normal)]',
          ].join(' '),
    ].join(' ')}
  >
    <Icon className="w-4 h-4" aria-hidden="true" />
    <span className="whitespace-nowrap">{label}</span>
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
  console.log('[generateExpandedLifeEvents] Starting generation for', char.name);
  const currentYear = parseInt(currentDate || '', 10) || char.year || 1500;
  const nowYear = currentYear; // Keep for compatibility

  // Determine cultural zone from character data
  const zone = (culturalZone || char.culturalZone || 'EUROPEAN') as any;

  // Determine historical era from year
  const historicalEra = era || getHistoricalEraFromYear(currentYear) || 'MEDIEVAL';

  console.log('[generateExpandedLifeEvents] Calling generateLifeHistory with zone:', zone, 'era:', historicalEra);
  // Generate sophisticated, contextual life history
  const events = generateLifeHistory(
    char,
    currentYear,
    zone,
    historicalEra as any
  ) as LifeEvent[];

  console.log('[generateExpandedLifeEvents] generateLifeHistory returned', events.length, 'events');

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
  console.log('[generateExpandedLifeEvents] Sorting and filtering events');
  const filtered = events
    .filter((e) => e.year && e.year <= nowYear)
    .sort((a, b) => a.year - b.year);

  console.log('[generateExpandedLifeEvents] Returning', filtered.length, 'events');
  return filtered;
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
  defaultTab?: 'overview' | 'health' | 'equipment' | 'inventory' | 'beliefs' | 'history' | 'household';
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
  defaultTab = 'overview'
}) => {
  // Early return MUST come before any hooks
  if (!isOpen || !character) return null;

  const { setIsPortraitModalOpen, setPortraitModalCharacter } = useUI();

  const [active, setActive] = useState<
    'overview' | 'health' | 'equipment' | 'inventory' | 'beliefs' | 'history' | 'household'
  >(defaultTab);

  // Arrow key navigation for tabs (Left/Right to switch, Home/End for first/last)
  useSimpleTabNavigation<typeof active>({
    tabs: ['overview', 'health', 'equipment', 'inventory', 'beliefs', 'history', 'household'],
    activeTab: active,
    onChange: setActive,
    enabled: isOpen,
    loop: true
  });

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

  // Performance tracking with refs to avoid re-renders
  const modalStartTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  // Track when modal opens
  if (isOpen && modalStartTimeRef.current === 0) {
    modalStartTimeRef.current = performance.now();
    renderCountRef.current = 0;
    console.log(`[CharacterProfileModal] Opening modal for ${character.name}`);
  }

  // Count renders
  renderCountRef.current++;
  if (renderCountRef.current > 2) {
    console.warn(`[CharacterProfileModal] Excessive re-renders: ${renderCountRef.current} times`);
  }

  // Safari performance optimization - remove expensive CSS effects
  useEffect(() => {
    if (isSafari()) {
      console.log('[CharacterProfileModal] Applying Safari-specific optimizations');
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
        /* Disable expensive shadow effects */
        .ff-panel .shadow-xl,
        .ff-panel .shadow-lg,
        .ff-panel .shadow-glow-blue {
          box-shadow: none !important;
        }
        /* Reduce gradient complexity */
        .ff-panel .bg-gradient-to-br,
        .ff-panel .bg-gradient-to-r {
          background-image: none !important;
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
    console.log(`[CharacterProfileModal] Switching to tab: ${tab}`);
    const startTime = performance.now();
    setActive(tab);
    // Log completion after state update
    requestAnimationFrame(() => {
      const elapsed = performance.now() - startTime;
      console.log(`[CharacterProfileModal] Tab switch to ${tab} completed in ${elapsed.toFixed(2)}ms`);
    });
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
      // Reset performance tracking
      modalStartTimeRef.current = 0;
      renderCountRef.current = 0;
    } else {
      // Log modal render completion
      requestAnimationFrame(() => {
        if (modalStartTimeRef.current > 0) {
          const elapsed = performance.now() - modalStartTimeRef.current;
          console.log(`[CharacterProfileModal] Modal fully rendered in ${elapsed.toFixed(2)}ms after ${renderCountRef.current} renders`);
        }
      });
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
  const [lifeEventsLoading, setLifeEventsLoading] = useState(false);
  const [expandedLifeEvents, setExpandedLifeEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    if (active === 'history' && !lifeEventsGenerated && !lifeEventsLoading && character) {
      console.log('[CharacterProfileModal] Starting life events generation...');
      setLifeEventsLoading(true);

      // Use setTimeout to defer generation and prevent UI blocking
      // This is more reliable than Web Workers which have module loading issues in dev mode
      const timeoutId = setTimeout(() => {
        const startTime = performance.now();
        try {
          console.log('[CharacterProfileModal] Generating life events...');
          const events = generateExpandedLifeEvents(character, date, tamedAnimals, culturalZone, era);
          const generationTime = performance.now() - startTime;
          console.log(`[CharacterProfileModal] Life events generated in ${generationTime.toFixed(2)}ms (${events.length} events)`);
          setExpandedLifeEvents(events);
          setLifeEventsGenerated(true);
          setLifeEventsLoading(false);
        } catch (error) {
          console.error('[CharacterProfileModal] Error generating life events:', error);
          setExpandedLifeEvents([]);
          setLifeEventsGenerated(true);
          setLifeEventsLoading(false);
        }
      }, 0);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [active, lifeEventsGenerated, lifeEventsLoading, character, date, tamedAnimals, culturalZone, era]);

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

  // Use JSON.stringify for deep comparison to prevent unnecessary recalcs
  const inventoryKey = useMemo(() => {
    const items = character.inventory || [];
    // Create a stable key based on item IDs and count
    return `${items.length}-${items.map(i => i.id).join(',')}`;
  }, [character.inventory]);

  const allItems = useMemo(() => {
    console.log(`[CharacterProfileModal] Recalculating allItems, inventory size: ${character.inventory?.length || 0}`);
    return character.inventory || [];
  }, [inventoryKey]);

  const filtered = useMemo(() => {
    const filterStart = performance.now();
    let result;
    if (inventoryFilter === 'All') {
      result = allItems;
    } else {
      result = allItems.filter(i => {
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
    }
    const elapsed = performance.now() - filterStart;
    if (elapsed > 10) {
      console.warn(`[CharacterProfileModal] Slow inventory filter: ${elapsed.toFixed(2)}ms for ${result.length} items`);
    }
    return result;
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

  // Memoized backstory with color highlighting (performant - only runs on character change)
  const highlightedBackstory = useMemo(() => {
    if (!character.backstory) return null;

    const text = character.backstory;

    // Performant approach - split on word boundaries and check each segment
    const segments = text.split(/\b/);

    return segments.map((segment, i) => {
      const lowerSegment = segment.toLowerCase();

      // 1. RELIGIONS (amber/gold) - most distinctive
      if (/^(sunni islam|shia islam|sufi islam|buddhism|zen buddhism|hinduism|christianity|roman catholicism|protestantism|eastern orthodoxy|judaism|islam|confucianism|taoism|shinto|shamanism|animism|zoroastrianism|atheism|agnosticism|celtic christianity|celtic druidism|norse paganism|greek polytheism|roman polytheism|germanic paganism|slavic paganism|early christianity|vodou|santería|tengrism|zoroastrianism|deism|secularism|great spirit worship|sun dance religion|pueblo religion|iroquois longhouse religion)$/i.test(segment)) {
        return <span key={i} className="text-amber-300 font-semibold">{segment}</span>;
      }

      // 2. PROFESSIONS (emerald green)
      if (/^(tea picker|blacksmith|merchant|scholar|farmer|weaver|potter|baker|carpenter|guard|priest|scribe|healer|hunter|fisher|miner|mason|sailor|soldier|cook|tailor|cobbler|innkeeper|brewer|tanner|cooper|fletcher|jeweler|painter|musician|artist|dancer|performer|herbalist|midwife|wet nurse|nanny|servant|laborer|porter|messenger|ferryman|teamster|peddler|trader|banker|lawyer|judge|tax collector|administrator|clerk|teacher|tutor|librarian|philosopher|alchemist|astrologer|cartographer|navigator|explorer|pilgrim|hermit|monk|nun|beggar|thief|smuggler|pirate|assassin|mercenary|bodyguard|gladiator|courtesan|slave|prisoner|mother|father)$/i.test(segment)) {
        return <span key={i} className="text-emerald-300 font-semibold">{segment}</span>;
      }

      // 3. ATTRIBUTES & SPECIAL TRAITS (purple/violet) - personality/conditions
      if (/^(exceptionally strong|physically frail|completely blind|deaf|nearsighted|naturally athletic|walking with a limp|covered in scars|unusually tall|remarkably small|brilliant|simple-minded|well-educated|unable to read|speak many languages|terribly forgetful|have keen eyesight|prone to daydreaming|naturally charming|painfully shy|remarkably lucky|plagued by bad luck|compulsively honest|a habitual liar|exceptionally generous|consumed by greed|fearless|cowardly|deeply spiritual|gifted with divine visions|blessed by fortune|believed to be cursed|blessed with mystical insights|doubtful of all religions|a hardened survivor|an experienced hunter|a skilled healer|good with money|experienced at sea|an experienced farmer|a former soldier|dependent on drink|hard of hearing|quick to anger|deeply paranoid|devoutly religious|addicted to gambling|chronically sad|constantly eating|disdainful of worldly pleasures|insatiably curious|extremely cautious|dangerously reckless|endlessly patient|terribly impatient|incredibly stubborn|highly adaptable|an animal lover|one who prefers solitude|a natural leader|prefer to follow|hopelessly romantic|an orphan|a twin|of ancient but fallen family|most active at night|able to predict weather|a skilled calligrapher|an artist|a poet|a musician|a craftsman|a veteran of war|street smart|deeply pessimistic|eternally optimistic|an insomniac|a foreigner here|a local|a wanderer|a hajji)$/i.test(segment)) {
        return <span key={i} className="text-purple-300 font-semibold">{segment}</span>;
      }

      // 4. Special religious/cultural titles (rose/pink)
      if (/^(hajji|sheikh|imam|rabbi|priest|monk|nun|lama|guru)$/i.test(segment)) {
        return <span key={i} className="text-rose-300 font-semibold">{segment}</span>;
      }

      // 5. CITIES/REGIONS (cyan) - check if preceded by location words
      if (/^[A-Z][a-z]+/.test(segment) && i > 2) {
        const prevWord = segments[i - 2]?.toLowerCase();
        if (prevWord && /^(city|village|region|town|settlement|of|near|from|in)$/.test(prevWord)) {
          return <span key={i} className="text-cyan-400 font-semibold">{segment}</span>;
        }
      }

      return segment;
    });
  }, [character.backstory]);

  /* ----------------------------- Fixed Heights ---------------------------- */
  return (
    <div
      data-surface="modal-overlay"
      className="modal-overlay theme-surface z-[700]"
      onClick={onClose}
    >
      <div
        data-surface="modal-panel"
        className="ff-panel theme-surface w-full max-w-7xl h-[95vh] flex flex-col text-text-primary"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0">
          <div className="relative overflow-hidden surface-elevated">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_300px_at_50%_-40%,var(--accent-primary-rgb,.25),transparent)] pointer-events-none" />
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[color:var(--border-normal)]">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[color:var(--border-normal)] shadow-lg surface-muted">
                  <LazyPortrait
                    character={character}
                    size={44}
                    type="animated"
                    trackChanges
                    immediate={true} // Header portrait should load immediately
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-2xl font-bold text-text-primary truncate">{character.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2 py-1 rounded bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)] text-sm font-semibold capitalize border border-[color:var(--color-warning)]/40 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {character.profession}
                    </span>
                    <span className="px-2 py-1 rounded bg-[color:var(--accent-primary)]/20 text-[color:var(--accent-primary)] text-sm font-semibold border border-[color:var(--accent-primary)]/40 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> Lv. {character.level}
                    </span>
                    <span className="px-2 py-1 rounded bg-[color:var(--color-success)]/20 text-[color:var(--color-success)] text-sm font-semibold border border-[color:var(--color-success)]/40 flex items-center gap-1">
                      <Handshake className="w-3.5 h-3.5" /> {character.mapReputation ?? character.reputation ?? 0}
                    </span>
                    <span className="px-2 py-1 rounded bg-[color:var(--color-warning)]/30 text-[color:var(--color-warning)] text-sm font-semibold border border-[color:var(--color-warning)]/40 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {character.currency ?? 0}
                    </span>
                    {/* Character Attributes - moved to badge row */}
                    {character.attributes && character.attributes.length > 0 && (
                      <div
                        onClick={handleToggleAttributeModal}
                        className="flex-shrink-0 ml-auto rounded-lg hover:bg-[var(--surface-muted-hover-bg)] px-1 py-0.5 transition-all cursor-pointer"
                        title="View all attributes"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleAttributeModal();
                          }
                        }}
                      >
                        <AttributeBadgeList badges={character.attributes} maxDisplay={2} size="small" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-normal)]
                           bg-[var(--surface-muted-bg)] text-text-secondary hover:text-text-primary hover:bg-[var(--surface-muted-hover-bg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Left: Party */}
          <aside className="hidden md:flex flex-col gap-4 p-5 border-r-2 border-surface-border surface-muted min-h-0 overflow-y-auto">
            <h3 className="font-press-start text-lg text-text-secondary text-center tracking-wider">PARTY</h3>

            {/* Player card */}
            <div className="p-4 rounded-lg surface-card">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border-normal)] bg-[var(--bg-secondary)] shadow-lg grid place-items-center">
                  <LazyPortrait
                    character={character}
                    size={80}
                    type="procedural"
                    useEquippedItems
                    immediate={false} // Can lazy-load this one
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-text-primary font-bold text-lg truncate">{character.name}</div>
                  <div className="text-[color:var(--color-warning)] text-sm capitalize truncate">{character.profession}</div>
                  <div className="text-[color:var(--accent-primary)] text-sm mt-1">Level {character.level}</div>
                </div>
              </div>
            </div>

            {/* Animal Companions (quick actions) */}
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider text-center">Animal Companions</h4>
              {tamedAnimals.length ? (
                tamedAnimals.map(a => {
                  const hp = (a.health / 10) * 100;
                  const data = ANIMAL_DATA[a.baseId];
                  return (
                    <div
                      key={a.id}
                      className="group p-3 rounded-lg bg-gradient-to-br from-green-900/30 to-blue-900/40 border border-green-600/30 hover:border-green-500/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] grid place-items-center">
                          <PawPrint className="w-4 h-4 text-green-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-text-primary truncate capitalize group-hover:text-green-400">
                            {a.name || a.speciesName}
                          </div>
                          <div className="text-xs text-text-secondary truncate">{data?.type || 'animal'}</div>
                          <div className="h-1 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded ${hp > 70 ? 'bg-emerald-500' : hp > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${hp}%` }}
                            />
                          </div>
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-[var(--surface-muted-hover-bg)] text-text-secondary"
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
                          className="px-2 py-1 text-xs border border-[var(--border-normal)] rounded text-text-secondary hover:bg-[var(--surface-muted-hover-bg)]"
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
                <div className="text-center py-4 text-text-tertiary text-sm italic">No animal companions</div>
              )}
            </section>
          </aside>

          {/* Right: Tabs + Content */}
          <main className="flex flex-col min-h-0">
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Character profile sections"
              className="shrink-0 flex border-b-2 border-[var(--border-normal)] bg-[var(--surface-muted-bg)] overflow-x-auto"
            >
              <TabBtn label="Overview" active={active === 'overview'} onClick={() => handleTabChange('overview')} Icon={Home} />
              <TabBtn label="Stats" active={active === 'health'} onClick={() => handleTabChange('health')} Icon={Activity} />
              <TabBtn label="Equipment" active={active === 'equipment'} onClick={() => handleTabChange('equipment')} Icon={Sword} />
              <TabBtn label="Inventory" active={active === 'inventory'} onClick={() => handleTabChange('inventory')} Icon={Backpack} />
              <TabBtn label="Beliefs" active={active === 'beliefs'} onClick={() => handleTabChange('beliefs')} Icon={Sparkles} />
              <TabBtn label="History" active={active === 'history'} onClick={() => handleTabChange('history')} Icon={Scroll} />
              <TabBtn label="Household" active={active === 'household'} onClick={() => handleTabChange('household')} Icon={House} />
            </div>

            {/* Content (scrolls) */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              {/* OVERVIEW ----------------------------------------------------- */}
              {active === 'overview' && (
                <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Portrait + Vitals */}
                  <div className="space-y-5">
                    {active === 'overview' && (
                      <div
                        className="relative group cursor-pointer"
                        title="Click to view full portrait"
                        onClick={handleOpenPortrait}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-[var(--border-normal)] bg-[var(--bg-secondary)] shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />
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
                    )}

                    <div className="p-4 rounded-lg surface-card">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Vitals</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-red-400"><Heart className="w-4 h-4" /> Health</span>
                            <span className="text-text-primary font-bold">
                              {Math.round(character.health)}/{Math.round(character.maxHealth)}
                            </span>
                          </div>
                          <div className="h-3 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-600 to-red-400"
                              style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-amber-400"><Moon className="w-4 h-4" /> Fatigue</span>
                            <span className="text-text-primary font-bold">
                              {Math.round(character.fatigue)}/{Math.round(character.maxFatigue || 100)}
                            </span>
                          </div>
                          <div className="h-3 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                              style={{ width: `${(character.fatigue / (character.maxFatigue || 100)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-cyan-400"><Star className="w-4 h-4" /> Experience</span>
                            <span className="text-text-primary font-bold">
                              {Math.round(character.experience)}/{Math.round(character.maxExperience)}
                            </span>
                          </div>
                          <div className="h-3 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              style={{ width: `${(character.experience / character.maxExperience) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {character.diseaseHealth?.currentDiseases?.length ? (
                        <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
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
                          <div className="p-4 rounded-lg surface-card">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Body Modifications
                            </h4>
                            <div className="space-y-2">
                              {modifications.map((mod, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded bg-[var(--surface-muted-bg)]">
                                  <div className="flex items-center gap-2">
                                    {mod.type === 'tattoo' && <span className="text-lg">🖤</span>}
                                    {mod.type === 'scarification' && <span className="text-lg">⚡</span>}
                                    {mod.type === 'face_paint' && <span className="text-lg">🎨</span>}
                                    {mod.type === 'paint' && <span className="text-lg">🎨</span>}
                                    {mod.type === 'henna' && <span className="text-lg">🌿</span>}
                                    {mod.type === 'piercing' && <span className="text-lg">💍</span>}
                                    {mod.type === 'ash' && <span className="text-lg">⚱️</span>}
                                    <div>
                                      <p className="text-sm font-semibold text-text-primary">{mod.name}</p>
                                      <p className="text-xs text-text-secondary capitalize">{mod.type.replace('_', ' ')}</p>
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
                                <p className="text-xs text-text-secondary italic mt-2">
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
                    <div className="p-4 rounded-lg border border-[var(--border-normal)] surface-card h-full">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3">Background</h4>
                      <p className="text-text-primary leading-relaxed italic whitespace-pre-wrap">
                        {highlightedBackstory || character.backstory}
                      </p>
                    </div>
                  </div>

                  {/* Info + Top Stats */}
                  <div className="space-y-5">
                    <div className="p-4 rounded-lg surface-card">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Character Info</h4>
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
                    <div className="p-4 rounded-lg surface-card">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTabChange('equipment')}
                          className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Sword className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-text-primary">Equipment</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleTabChange('inventory')}
                          className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Backpack className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-semibold text-text-primary">Inventory</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleTabChange('health')}
                          className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold text-text-primary">Full Stats</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleTabChange('household')}
                          className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <House className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-semibold text-text-primary">Household</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg surface-card">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Top Stats</h4>
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
                  <div className="p-5 rounded-xl surface-card">
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
                        <div className="h-4 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden mb-4">
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
                        <div className="h-4 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                            style={{ width: `${(character.fatigue / character.maxFatigue) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-text-primary mb-3">Disease Status</h4>
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
                                <div className="text-xs text-text-secondary mt-1">
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
                            <p className="text-xs text-text-secondary mt-1">No active diseases or infections</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-text-primary font-bold uppercase tracking-wider mb-4">Core Stats</h3>
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
                      <h3 className="text-text-primary font-bold uppercase tracking-wider mb-4">Personality</h3>
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
                  <div className="lg:col-span-2 flex flex-col rounded-lg surface-card min-h-0">
                    <div className="flex justify-between items-center px-3 py-2 border-b border-slate-700/60">
                      <h4 className="font-semibold text-lg text-blue-300 flex items-center gap-2">
                        <Backpack className="w-5 h-5" /> Inventory
                      </h4>
                      <div className="flex gap-1 p-1 rounded bg-[var(--surface-muted-bg)]">
                        {(['All', 'Weapons', 'Clothing', 'Consumables', 'Other'] as const).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setInventoryFilter(cat)}
                            className={`px-2 py-0.5 text-xs rounded ${
                              inventoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-[var(--surface-muted-bg)] text-text-secondary hover:bg-[var(--surface-muted-hover-bg)]'
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
                            selectedItem?.id === item.id ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)]'
                          }`}
                        >
                          <div className="w-14 h-14 shrink-0 grid place-items-center"> {/* larger row thumb */}
                            <GenerativeItemIcon item={item} size={56} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-text-primary font-semibold truncate">{formatItemName(item.name)}</div>
                            <div className="text-xs text-text-secondary truncate">{item.category}</div>
                          </div>
                          {item.stackable && item.quantity > 1 ? <span className="text-xs text-text-secondary">x{item.quantity}</span> : null}
                          <RarityTag rarity={item.rarity} />
                        </div>
                      ))}
                      {!filtered.length && <p className="text-center text-text-tertiary italic py-8 text-sm">No items in this category.</p>}
                    </div>
                  </div>

                  <div className="rounded-lg surface-card p-3 flex flex-col">
                    {selectedItem ? (
                      <>
                        <div className="w-36 h-36 mx-auto my-3 grid place-items-center"> {/* bigger preview */}
                          <GenerativeItemIcon item={selectedItem} size={140} />
                        </div>
                        <h5 className="text-lg font-bold text-text-primary text-center mb-1">{formatItemName(selectedItem.name)}</h5>
                        <p className="text-sm text-text-secondary italic text-center mb-3">
                          {memoizedItemDescription}
                        </p>
                        <div className="text-xs space-y-1 mb-4 p-2 rounded bg-[var(--surface-muted-bg)]">
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
                      <div className="h-full grid place-items-center text-text-tertiary italic">Select an item</div>
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
                <React.Suspense fallback={
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-3"></div>
                    <p className="text-text-secondary text-sm">Loading history...</p>
                  </div>
                }>
                  <CharacterHistoryTab
                    character={character}
                    expandedLifeEvents={expandedLifeEvents}
                    lifeEventsGenerated={lifeEventsGenerated}
                    lifeEventsLoading={lifeEventsLoading}
                    findFamilyEvents={findFamilyEvents}
                    scrollToEvent={scrollToEvent}
                    timelineRef={timelineRef}
                    highlightedEventYear={highlightedEventYear}
                  />
                </React.Suspense>
              )}

              {/* HOUSEHOLD (now shows companions with Release) ---------------- */}
              {active === 'household' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-amber-400 font-bold uppercase tracking-wider">Current Household</h3>

                  {/* Summary card */}
                  <div className="p-3 rounded-lg surface-card">
                    <p className="text-sm text-text-secondary">
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
                          <div key={`${m.relation}-${m.name}-${i}`} className="p-4 rounded-lg surface-card">
                            <div className="flex justify-between mb-1">
                              <div>
                                <div className="font-semibold text-text-primary capitalize">{m.name}</div>
                                <div className="text-xs text-blue-300 capitalize">{m.relation}</div>
                              </div>
                              {'age' in m && <div className="text-xs text-text-secondary">Age {m.age}</div>}
                            </div>
                            <div className="text-sm space-y-1">
                              {'profession' in m && (
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Occupation:</span>
                                  <span className="text-text-primary">{(m as any).profession}</span>
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
                    <h4 className="text-blue-300 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                      <PawPrint className="w-4 h-4" />
                      Companion Animals
                    </h4>
                    {tamedAnimals.length > 0 && (
                      <span className="text-xs text-text-secondary">{tamedAnimals.length} total</span>
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
                                <div className="font-semibold text-text-primary capitalize truncate">
                                  {a.name || a.speciesName}
                                </div>
                                <div className="text-xs text-text-secondary capitalize truncate">{data?.type || 'animal'}</div>
                              </div>
                              <div className="w-9 h-9 rounded-md bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] grid place-items-center shrink-0">
                                <PawPrint className="w-5 h-5 text-green-300" />
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-text-secondary">Health</span>
                                  <span className="text-text-primary">{Math.round(a.health)}/10</span>
                                </div>
                                <div className="h-2 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
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
                                  className="px-3 py-1.5 text-xs border border-[var(--border-normal)] rounded text-text-secondary hover:bg-[var(--surface-muted-hover-bg)]"
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
                    <div className="p-6 rounded-lg surface-card text-center">
                      <p className="text-sm text-text-tertiary italic">No animal companions in your household.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-2 border-t border-[var(--border-normal)] bg-[var(--bg-secondary)]">
          <button onClick={onClose} className="btn-secondary" type="button">
            Close
          </button>
          <button onClick={onRegenerate} className="btn-primary" disabled={isEnhancing} type="button">
            {isEnhancing ? 'Enhancing...' : 'Regenerate Character'}
          </button>
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
        <div
          data-surface="modal-overlay"
          className="modal-overlay theme-surface"
          onClick={() => setIsAnimalModalOpen(false)}
        >
          <div
            data-surface="modal-panel"
            className="theme-surface bg-modal-bg-gradient border border-[var(--border-normal)] rounded-2xl text-text-primary w-full max-w-md p-6 shadow-glow-blue"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-2 mb-4 border-b border-[var(--border-normal)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[var(--surface-muted-bg)] border border-[var(--border-normal)] grid place-items-center">
                  <PawPrint className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-300 capitalize">{selectedAnimal.speciesName}</h3>
                  <p className="text-xs text-text-secondary capitalize">{ANIMAL_DATA[selectedAnimal.baseId]?.type || 'animal'}</p>
                </div>
              </div>
              <button onClick={() => setIsAnimalModalOpen(false)} className="text-3xl text-text-secondary hover:text-text-primary">
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
                  <span className="text-text-secondary">Health</span>
                  <span className="text-text-primary">{Math.round(selectedAnimal.health)}/10</span>
                </div>
                <div className="h-2 rounded bg-[var(--surface-track-bg)] overflow-hidden">
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
                  <span className="text-text-secondary">Loyalty</span>
                  <span className="text-text-primary">{Math.round(selectedAnimal.loyalty)}/100</span>
                </div>
                <div className="h-2 rounded bg-[var(--surface-track-bg)] overflow-hidden">
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
              <button onClick={() => setIsAnimalModalOpen(false)} className="btn-secondary">
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
