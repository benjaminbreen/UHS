/**
 * components/CharacterProfileModal.tsx
 * Fixed-height modal, companion animals in Household (with release), richer timeline with icons,
 * lucide-react icons everywhere, larger inventory preview, and small UX polish.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  PlayerCharacter,
  EquipmentSlot,
  Item,
  Rarity,
} from '../types';
import { useUI } from '../contexts/UIContext';
import { ProceduralPortrait, AnimatedPortrait } from './portraits';
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
import {
  loadTamedAnimals,
  removeFromParty,
  TamedAnimal,
  updateAnimalName,
} from '../services/animalTamingService';
import { ANIMAL_DATA } from '../constants';
import AnimalCompanionModal from './AnimalCompanionModal';
import { mapLocationToCulture } from '../utils/mapUtils';

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
} from 'lucide-react';

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

const StatBar: React.FC<{ label: string; value: number; max?: number; Icon: any; color: string }> = ({
  label,
  value,
  max = 20,
  Icon,
  color,
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
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
      <span className="w-8 text-right font-bold text-white">{value}</span>
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
/* Life Events (Richer, Icon-tagged)                                          */
/* -------------------------------------------------------------------------- */

type EventKind =
  | 'birth'
  | 'apprenticeship'
  | 'romance'
  | 'marriage'
  | 'battle'
  | 'discovery'
  | 'journey'
  | 'tragedy'
  | 'plague'
  | 'achievement'
  | 'study'
  | 'guild'
  | 'rival'
  | 'animal'
  | 'fire'
  | 'travel';

const EVENT_ICON: Record<EventKind, any> = {
  birth: Sparkles,
  apprenticeship: Hammer,
  romance: Heart,
  marriage: Handshake,
  battle: Sword,
  discovery: FlaskConical,
  journey: Ship,
  tragedy: HeartCrack,
  plague: Biohazard,
  achievement: Trophy,
  study: BookOpen,
  guild: Users,
  rival: Skull,
  animal: PawPrint,
  fire: Flame,
  travel: Compass,
};

interface LifeEvent {
  year: number;
  kind: EventKind;
  title: string;
  text: string;
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const generateExpandedLifeEvents = (
  char: PlayerCharacter,
  currentDate: string,
  companions: TamedAnimal[]
): LifeEvent[] => {
  const birthYear = parseInt(char.birthYear || '0', 10) || (char.year ? char.year - char.age : 1500 - char.age);
  const nowYear = parseInt(currentDate || '', 10) || char.year || birthYear + char.age;
  const base: LifeEvent[] = [];

  // Birth (anchor)
  base.push({
    year: birthYear,
    kind: 'birth',
    title: 'Birth',
    text: `Born in ${char.hometown || 'a small village'}, to ${char.family?.length ? 'a known family' : 'humble origins'}.`,
  });

  // Childhood/Apprenticeship
  if (char.age >= 12) {
    base.push({
      year: birthYear + 12 + Math.floor(Math.random() * 3),
      kind: 'apprenticeship',
      title: 'Apprenticeship',
      text: `Began apprenticeship as a ${char.profession?.toLowerCase() || 'craftsman'}.`,
    });
  }

  // Study/Scholarship (stat-weighted)
  if ((char.stats?.intelligence || 0) >= 14) {
    base.push({
      year: birthYear + 15 + Math.floor(Math.random() * 4),
      kind: 'study',
      title: 'Scholarly Pursuits',
      text: `Spent seasons studying rare manuscripts under a patient mentor.`,
    });
  }

  // Romance & Marriage (varied)
  if (char.age >= 16 && Math.random() > 0.5) {
    base.push({
      year: birthYear + 16 + Math.floor(Math.random() * 6),
      kind: 'romance',
      title: 'First Love',
      text: pick([
        'A tender courtship beneath lantern-lit festivals.',
        'An ill-fated romance with a traveling performer.',
        'A quiet affection that never found words.',
      ]),
    });
  }
  const spouse = char.family?.find(f => f.relation === 'spouse');
  if (spouse && char.age >= 18) {
    base.push({
      year: birthYear + 18 + Math.floor(Math.random() * 8),
      kind: 'marriage',
      title: 'Marriage',
      text: `Wed ${spouse.name} in a ${Math.random() > 0.5 ? 'grand' : 'modest'} ceremony.`,
    });
  }

  // Journeys/Travel (profession/zone flavored)
  if (Math.random() > 0.4) {
    base.push({
      year: birthYear + 18 + Math.floor(Math.random() * Math.max(2, char.age - 18)),
      kind: 'journey',
      title: 'Set Forth',
      text: pick([
        'Traveled over mountain passes to trade for rare dyes.',
        'Crossed the delta by ferry to seek new patrons.',
        'Escorted a caravan along wind-carved canyons.',
      ]),
    });
  }

  // Battle/Tragedy/Plague (worldliness)
  if (Math.random() > 0.6) {
    base.push({
      year: birthYear + 17 + Math.floor(Math.random() * Math.max(2, char.age - 17)),
      kind: 'battle',
      title: 'Clash of Steel',
      text: pick([
        'Defended a hamlet from marauders.',
        'Served briefly in a lord’s levy.',
        'Stood watch through a tense siege that never came.',
      ]),
    });
  }
  if (Math.random() > 0.7) {
    base.push({
      year: birthYear + 14 + Math.floor(Math.random() * Math.max(2, char.age - 14)),
      kind: 'tragedy',
      title: 'A Hard Season',
      text: pick([
        'Lost a close friend to the river.',
        'A fire consumed part of the neighborhood.',
        'A poor harvest forced difficult choices.',
      ]),
    });
  }
  if (Math.random() > 0.65) {
    base.push({
      year: birthYear + 13 + Math.floor(Math.random() * Math.max(2, char.age - 13)),
      kind: 'plague',
      title: 'Outbreak',
      text: pick([
        'Kept vigil as illness swept the ward.',
        'Helped distribute herbal tonics door-to-door.',
        'Recovered after weeks of feverish dreams.',
      ]),
    });
  }

  // Guild / Rival / Achievement
  if (Math.random() > 0.5) {
    base.push({
      year: birthYear + 19 + Math.floor(Math.random() * Math.max(2, char.age - 19)),
      kind: 'guild',
      title: 'Guild Oath',
      text: 'Accepted into a local guild, sworn to shared standards.',
    });
  }
  if (Math.random() > 0.55) {
    base.push({
      year: birthYear + 20 + Math.floor(Math.random() * Math.max(2, char.age - 20)),
      kind: 'rival',
      title: 'A Rival Appears',
      text: pick([
        'A rival artisan undercuts your prices.',
        'An officer scoffs at your methods.',
        'A cousin vies for the same patron’s favor.',
      ]),
    });
  }
  if (Math.random() > 0.45) {
    base.push({
      year: birthYear + 21 + Math.floor(Math.random() * Math.max(2, char.age - 21)),
      kind: 'achievement',
      title: 'Notable Deed',
      text: pick([
        'Crafted a piece that drew a crowd to the square.',
        'Brokered peace between feuding neighbors.',
        'Discovered an efficient technique that spread quietly.',
      ]),
    });
  }

  // Discovery / Fire / Travel
  if (Math.random() > 0.5) {
    base.push({
      year: birthYear + 18 + Math.floor(Math.random() * Math.max(2, char.age - 18)),
      kind: 'discovery',
      title: 'Small Discovery',
      text: pick([
        'Perfected a dye that holds its color in rain.',
        'Mapped a shortcut between market stalls.',
        'Learned a healing tisane recipe from a traveler.',
      ]),
    });
  }
  if (Math.random() > 0.7) {
    base.push({
      year: birthYear + 18 + Math.floor(Math.random() * Math.max(2, char.age - 18)),
      kind: 'fire',
      title: 'Embers & Ash',
      text: pick([
        'Helped bucket brigades hold the line.',
        'Lost a shed, saved the workshop.',
        'Took in a neighbor after smoke ruined their stores.',
      ]),
    });
  }
  if (Math.random() > 0.6) {
    base.push({
      year: birthYear + 19 + Math.floor(Math.random() * Math.max(2, char.age - 19)),
      kind: 'travel',
      title: 'Further Afield',
      text: pick([
        'Followed the coast to a lighthouse town.',
        'Rode with a courier over stone bridges slick with moss.',
        'Shared stories at a hilltop shrine.',
      ]),
    });
  }

  // Animal companions → fold taming into timeline
  companions.forEach(a => {
    const y = a?.tamingDate?.year ?? nowYear;
    base.push({
      year: y,
      kind: 'animal',
      title: `Tamed ${a.name || a.speciesName}`,
      text: pick([
        'Patience and a steady hand won its trust.',
        'A morsel and a calm voice sealed the bond.',
        'Found wounded; nursed back to health.',
      ]),
    });
  });

  // Merge with any authored lifeEvents on the character (fallback structure)
  (char.lifeEvents || []).forEach((e: any) => {
    if (!e?.year || !e?.event) return;
    base.push({
      year: e.year,
      kind: 'achievement',
      title: 'Life Event',
      text: e.event,
    });
  });

  return base
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

  useEffect(() => {
    if (isOpen) setTamedAnimals(loadTamedAnimals());
  }, [isOpen]);

  const refreshAnimals = () => setTamedAnimals(loadTamedAnimals());

  const handleReleaseAnimal = (animalId: string) => {
    removeFromParty(animalId);
    refreshAnimals();
  };

  useEffect(() => {
    if (!isOpen) {
      setActive('overview');
      setSelectedItem(null);
    }
  }, [isOpen]);

  const expandedLifeEvents = useMemo(
    () => generateExpandedLifeEvents(character, date, tamedAnimals),
    // regenerate when character id or the set of animal ids changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [character?.id, tamedAnimals.map(a => a.id).join(',')]
  );

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
  }, [character?.id]);

  const allItems = useMemo(() => character.inventory || [], [character]);
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

  if (!isOpen || !character) return null;

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
                  <AnimatedPortrait character={character} size={44} trackChanges />
                </div>
                <div className="min-w-0">
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
                  <ProceduralPortrait character={character} size={80} useEquippedItems />
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
              <TabBtn label="Overview" active={active === 'overview'} onClick={() => setActive('overview')} Icon={Home} />
              <TabBtn label="Stats" active={active === 'health'} onClick={() => setActive('health')} Icon={Activity} />
              <TabBtn label="Equipment" active={active === 'equipment'} onClick={() => setActive('equipment')} Icon={Sword} />
              <TabBtn label="Inventory" active={active === 'inventory'} onClick={() => setActive('inventory')} Icon={Backpack} />
              <TabBtn label="Beliefs" active={active === 'beliefs'} onClick={() => setActive('beliefs')} Icon={Sparkles} />
              <TabBtn label="History" active={active === 'history'} onClick={() => setActive('history')} Icon={Scroll} />
              <TabBtn label="Household" active={active === 'household'} onClick={() => setActive('household')} Icon={House} />
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
                      onClick={() => {
                        setIsPortraitModalOpen(true);
                        setPortraitModalCharacter(character);
                      }}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900/70 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-black/30 pointer-events-none" />
                        <AnimatedPortrait character={character} size={300} trackChanges />
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
                              {Math.ceil(character.health)}/{Math.ceil(character.maxHealth)}
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
                              {Math.ceil(character.fatigue)}/{Math.ceil(character.maxFatigue || 100)}
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
                              {Math.ceil(character.experience)}/{Math.ceil(character.maxExperience)}
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
                              {character.health}/{character.maxHealth} HP
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
                              {character.fatigue}/{character.maxFatigue}
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
                        <StatBar label="Openness" value={Math.round(character.personality.openness * 100)} max={100} Icon={Sparkles} color="#60a5fa" />
                        <StatBar label="Conscientiousness" value={Math.round(character.personality.conscientiousness * 100)} max={100} Icon={Shield} color="#34d399" />
                        <StatBar label="Extraversion" value={Math.round(character.personality.extraversion * 100)} max={100} Icon={Handshake} color="#a78bfa" />
                        <StatBar label="Agreeableness" value={Math.round(character.personality.agreeableness * 100)} max={100} Icon={Heart} color="#fb7185" />
                        <StatBar label="Neuroticism" value={Math.round(character.personality.neuroticism * 100)} max={100} Icon={Activity} color="#f59e0b" />
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
                          {isGenericDescription(selectedItem.description, selectedItem.name)
                            ? generateProceduralItemDescription(selectedItem)
                            : selectedItem.description}
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

              {/* HISTORY (icons per event) ----------------------------------- */}
              {active === 'history' && (
                <div className="p-6 grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-blue-400 font-semibold text-lg mb-3 border-b border-slate-700 pb-2">Family</h4>
                    <div className="space-y-2 text-sm">
                      {(['father', 'mother'] as const).map(rel => {
                        const m = (character.family || []).find(f => f.relation === rel);
                        return m ? (
                          <div key={rel}>
                            <strong className="capitalize">{rel}:</strong> {m.name} ({m.profession})
                          </div>
                        ) : null;
                      })}
                      <div>
                        <strong>Children:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                          {(character.family || [])
                            .filter(f => f.relation === 'son' || f.relation === 'daughter')
                            .map((c, idx) => (
                              <li key={`${c.name}-${idx}`}>{c.name} (age {c.age})</li>
                            ))}
                          {(character.family || []).filter(f => f.relation === 'son' || f.relation === 'daughter').length === 0 && <li>None</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-blue-400 font-semibold text-lg mb-3 border-b border-slate-700 pb-2">Timeline</h4>
                    <div className="relative border-l-2 border-slate-600 pl-6 space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                      {expandedLifeEvents.map((e, i) => {
                        const Icon = EVENT_ICON[e.kind] || Sparkles;
                        return (
                          <div key={`${e.kind}-${e.year}-${i}`} className="relative">
                            <div className="absolute -left-[33px] top-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-slate-900 grid place-items-center text-white">
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">{e.year}</div>
                            <div className="text-sm text-white font-semibold">{e.title}</div>
                            <div className="text-sm text-slate-300">{e.text}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                                  <span className="text-white">{a.health}/10</span>
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
                  <span className="text-white">{selectedAnimal.health}/10</span>
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
                  <span className="text-white">{selectedAnimal.loyalty}/100</span>
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
    </div>
  );
};

export default CharacterProfileModal;
