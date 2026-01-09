/**
 * CharacterProfileModalV2.tsx
 * Redesigned character profile using the app's design system
 * - Uses CSS variables for light/dark mode support
 * - Two-panel layout: fixed character card + scrollable content
 * - Visual stat displays
 * - Follows existing UI patterns from LeftSidebar, etc.
 */

import React, { useEffect, useMemo, useState, useCallback, useRef, Suspense, Component, ReactNode } from 'react';

// Simple error boundary for lazy-loaded components
class HistoryErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('[CharacterHistoryTab] Load error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-text-muted mb-3">Failed to load history tab</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 text-xs rounded-lg surface-muted hover:bg-[var(--surface-muted-hover-bg)]"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  PlayerCharacter,
  EquipmentSlot,
  Item,
  Rarity,
} from '../types';
import { useUI } from '../contexts/UIContext';
import LazyPortrait from './portraits/LazyPortrait';
import BeliefsPanel from './BeliefsPanel';
import {
  generateProceduralItemDescription,
  isGenericDescription,
} from '../services/itemDescriptionGenerator';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import DiseaseModal from './DiseaseModal';
import { ActiveDisease } from '../types/diseaseTypes';
import {
  loadTamedAnimals,
  removeFromParty,
  TamedAnimal,
} from '../services/animalTamingService';
import { ANIMAL_DATA } from '../constants';
import { mapLocationToCulture } from '../utils/mapUtils';
import {
  generateLifeHistory,
  EventImportance,
  type EnhancedLifeEvent,
  type EventKind
} from '../services/lifeHistoryService';

const CharacterHistoryTab = React.lazy(() => import('./CharacterHistoryTab').then(m => ({ default: m.CharacterHistoryTab })));

import {
  X,
  Heart,
  Zap,
  Star,
  Shield,
  Sword,
  Shirt,
  Footprints,
  Crown,
  Gem,
  Package,
  Scroll,
  Users,
  Clock,
  Coins,
  Scale,
  PawPrint,
  Skull,
  Sparkles,
  ChevronRight,
  Activity,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const cmToFeetInches = (cm?: number) => {
  if (!cm) return '—';
  const inches = cm / 2.54;
  return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`;
};

const kgToLbs = (kg?: number) => kg ? `${Math.round(kg * 2.205)} lbs` : '—';

const formatName = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const getRarityColor = (r: Rarity) => ({
  'Junk': 'var(--text-muted)',
  'Common': 'var(--text-tertiary)',
  'Uncommon': 'var(--color-success)',
  'Rare': 'var(--accent-primary)',
  'Ultra-rare': '#a855f7',
  'Unique': 'var(--accent-secondary)',
}[r] || 'var(--text-tertiary)');

const getHistoricalEra = (year: number) => {
  if (year < -3000) return 'PREHISTORY';
  if (year < 500) return 'ANTIQUITY';
  if (year < 1450) return 'MEDIEVAL';
  if (year < 1800) return 'RENAISSANCE_EARLY_MODERN';
  if (year < 1950) return 'INDUSTRIAL_ERA';
  return 'MODERN_ERA';
};

/* -------------------------------------------------------------------------- */
/* Stat Visualization                                                         */
/* -------------------------------------------------------------------------- */

const StatHexagon: React.FC<{ stats: PlayerCharacter['stats'] }> = ({ stats }) => {
  const size = 140;
  const center = size / 2;
  const radius = 50;

  const statKeys = ['strength', 'dexterity', 'constitution', 'intelligence', 'persuasion', 'perception'] as const;
  const statLabels = ['STR', 'DEX', 'CON', 'INT', 'PER', 'WIS'];

  const points = statKeys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const value = (stats[key] || 5) / 10;
    const x = center + Math.cos(angle) * radius * value;
    const y = center + Math.sin(angle) * radius * value;
    const labelX = center + Math.cos(angle) * (radius + 20);
    const labelY = center + Math.sin(angle) * (radius + 20);
    return { x, y, labelX, labelY, label: statLabels[i], raw: stats[key] };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="drop-shadow-sm">
      {/* Background rings */}
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <polygon
          key={i}
          points={statKeys.map((_, j) => {
            const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
            return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
          }).join(' ')}
          fill="none"
          className="stroke-[var(--border-subtle)]"
          strokeWidth="1"
        />
      ))}

      {/* Stat fill */}
      <path
        d={pathD}
        className="fill-[var(--accent-primary)] stroke-[var(--accent-primary)]"
        fillOpacity="0.2"
        strokeWidth="2"
      />

      {/* Stat points and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" className="fill-[var(--accent-primary)]" />
          <text
            x={p.labelX}
            y={p.labelY - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] font-bold fill-[var(--text-muted)]"
          >
            {p.label}
          </text>
          <text
            x={p.labelX}
            y={p.labelY + 7}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] font-bold fill-[var(--text-primary)]"
          >
            {p.raw}
          </text>
        </g>
      ))}
    </svg>
  );
};

const VitalBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, max, color, icon }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <span className="text-xs font-medium text-text-secondary">{label}</span>
        </div>
        <span className="text-xs font-semibold text-text-primary">{Math.round(value)}/{max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-track-bg)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Equipment Slot                                                             */
/* -------------------------------------------------------------------------- */

const EquipmentSlotDisplay: React.FC<{
  slot: string;
  item?: Item;
  icon: React.ReactNode;
  onUnequip?: () => void;
}> = ({ slot, item, icon, onUnequip }) => (
  <div className={`relative group p-2.5 rounded-lg border transition-all ${
    item
      ? 'surface-muted border-[var(--accent-primary)]/30'
      : 'surface-muted'
  }`}>
    <div className="flex items-center gap-2">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item ? 'text-[var(--accent-primary)]' : 'text-text-muted'}`}
        style={{ background: item ? 'var(--surface-elevated-bg)' : 'var(--surface-track-bg)' }}>
        {item ? <GenerativeItemIcon item={item} size={28} /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-text-muted">{slot}</div>
        {item ? (
          <div className="text-xs font-medium text-text-primary truncate">{formatName(item.name)}</div>
        ) : (
          <div className="text-xs text-text-muted italic">Empty</div>
        )}
      </div>
    </div>
    {item && onUnequip && (
      <button
        onClick={onUnequip}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-error)] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
      >
        ×
      </button>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Tab Navigation                                                             */
/* -------------------------------------------------------------------------- */

type TabId = 'overview' | 'inventory' | 'social' | 'history';

const NavTab: React.FC<{
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
      active
        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
        : 'surface-muted text-text-secondary hover:text-text-primary'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

/* -------------------------------------------------------------------------- */
/* Item Card                                                                  */
/* -------------------------------------------------------------------------- */

const ItemCard: React.FC<{
  item: Item;
  selected: boolean;
  onClick: () => void;
}> = ({ item, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left border ${
      selected
        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 ring-1 ring-[var(--accent-primary)]/30'
        : 'surface-muted hover:shadow-md'
    }`}
  >
    <div className="w-10 h-10 rounded-lg p-1 flex-shrink-0" style={{ background: 'var(--surface-track-bg)' }}>
      <GenerativeItemIcon item={item} size={32} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-primary font-medium truncate">{formatName(item.name)}</span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getRarityColor(item.rarity) }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>{item.category}</span>
        {item.stackable && item.quantity > 1 && <span>×{item.quantity}</span>}
      </div>
    </div>
    <div className="text-xs font-semibold text-[var(--accent-secondary)]">{item.value}g</div>
  </button>
);

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
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
  defaultTab?: TabId;
}

const CharacterProfileModalV2: React.FC<Props> = (props) => {
  const {
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
  } = props;

  const { setIsPortraitModalOpen, setPortraitModalCharacter } = useUI();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<ActiveDisease | null>(null);
  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [lifeEventsGenerated, setLifeEventsGenerated] = useState(false);
  const [lifeEventsLoading, setLifeEventsLoading] = useState(false);
  const [expandedLifeEvents, setExpandedLifeEvents] = useState<EnhancedLifeEvent[]>([]);
  const [highlightedEventYear, setHighlightedEventYear] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'weapons' | 'apparel' | 'tools' | 'food'>('all');

  useEffect(() => {
    if (isOpen) setTamedAnimals(loadTamedAnimals());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('overview');
      setSelectedItem(null);
      setLifeEventsGenerated(false);
    }
  }, [isOpen]);

  const culturalZone = character?.culturalZone || 'EUROPEAN';
  const era = getHistoricalEra(parseInt(date || '1500', 10));

  useEffect(() => {
    if (activeTab === 'history' && !lifeEventsGenerated && !lifeEventsLoading && character) {
      setLifeEventsLoading(true);
      setTimeout(() => {
        try {
          const currentYear = parseInt(date || '', 10) || character.year || 1500;
          const events = generateLifeHistory(character, currentYear, culturalZone as any, era as any) as EnhancedLifeEvent[];

          tamedAnimals.forEach(animal => {
            if (animal.tamingDate?.year) {
              events.push({
                year: animal.tamingDate.year,
                kind: 'animal' as EventKind,
                importance: EventImportance.RELATIONSHIP,
                title: `Tamed ${animal.speciesName}`,
                text: `Formed bond with a ${animal.speciesName.toLowerCase()}.`,
              });
            }
          });

          setExpandedLifeEvents(events.filter(e => e.year <= currentYear).sort((a, b) => a.year - b.year));
          setLifeEventsGenerated(true);
        } catch {
          setExpandedLifeEvents([]);
          setLifeEventsGenerated(true);
        }
        setLifeEventsLoading(false);
      }, 0);
    }
  }, [activeTab, lifeEventsGenerated, lifeEventsLoading, character, date, tamedAnimals, culturalZone, era]);

  const filteredInventory = useMemo(() => {
    if (!character?.inventory) return [];
    const items = character.inventory;
    switch (inventoryFilter) {
      case 'weapons': return items.filter(i => i.category === 'Weapon');
      case 'apparel': return items.filter(i => i.category === 'Apparel');
      case 'tools': return items.filter(i => i.category === 'Tool');
      case 'food': return items.filter(i => i.category === 'Food' || i.sustenance > 0);
      default: return items;
    }
  }, [character?.inventory, inventoryFilter]);

  const handleOpenPortrait = useCallback(() => {
    if (character) {
      setIsPortraitModalOpen(true);
      setPortraitModalCharacter(character);
    }
  }, [character, setIsPortraitModalOpen, setPortraitModalCharacter]);

  const handleReleaseAnimal = useCallback((animalId: string) => {
    removeFromParty(animalId);
    setTamedAnimals(loadTamedAnimals());
  }, []);

  const findFamilyEvents = useCallback((name: string) => {
    return expandedLifeEvents.filter(e =>
      e.text.toLowerCase().includes(name.toLowerCase()) ||
      e.title.toLowerCase().includes(name.toLowerCase())
    );
  }, [expandedLifeEvents]);

  const scrollToEvent = useCallback((year: number) => {
    setHighlightedEventYear(year);
    const el = timelineRef.current?.querySelector(`[data-year="${year}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedEventYear(null), 2000);
  }, []);

  const itemDescription = useMemo(() => {
    if (!selectedItem) return '';
    return isGenericDescription(selectedItem.description, selectedItem.name)
      ? generateProceduralItemDescription(selectedItem)
      : selectedItem.description;
  }, [selectedItem]);

  if (!isOpen || !character) return null;

  const equipped = character.equippedItems || {};

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      style={{ background: 'var(--surface-modal-overlay-bg)' }}
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-5xl h-[85vh] flex rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          background: 'var(--surface-modal-panel-bg)',
          borderColor: 'var(--surface-modal-panel-border)',
          boxShadow: 'var(--surface-modal-panel-shadow)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT PANEL - Character Card */}
        <div
          className="w-72 flex-shrink-0 flex flex-col border-r"
          style={{
            background: 'var(--surface-sidebar-bg)',
            borderColor: 'var(--border-normal)',
          }}
        >
          {/* Portrait */}
          <div className="p-5 text-center">
            <button
              onClick={handleOpenPortrait}
              className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 shadow-lg hover:shadow-xl transition-all group"
              style={{ borderColor: 'var(--accent-primary)' }}
            >
              <LazyPortrait character={character} size={128} type="animated" immediate />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-white font-medium">View</span>
              </div>
            </button>

            <h2 className="mt-3 text-xl font-bold text-text-primary">{character.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="badge-pill" data-variant="accent">{character.profession}</span>
              <span className="badge-pill">Lv.{character.level}</span>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              Age {character.age} • {character.gender || 'Unknown'}
            </p>
          </div>

          {/* Vitals */}
          <div className="px-5 space-y-3">
            <VitalBar label="Health" value={character.health} max={character.maxHealth} color="var(--color-error)" icon={<Heart className="w-3.5 h-3.5" />} />
            <VitalBar label="Fatigue" value={character.fatigue} max={character.maxFatigue || 100} color="var(--color-warning)" icon={<Zap className="w-3.5 h-3.5" />} />
            <VitalBar label="Experience" value={character.experience} max={character.maxExperience} color="var(--accent-primary)" icon={<Star className="w-3.5 h-3.5" />} />
          </div>

          {/* Stats Hexagon */}
          <div className="flex-1 flex items-center justify-center py-3">
            <StatHexagon stats={character.stats} />
          </div>

          {/* Quick Info */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-normal)', background: 'var(--surface-muted-bg)' }}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Coins className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                <span>{character.currency ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Scale className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Rep: {character.mapReputation ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Activity className="w-3.5 h-3.5 text-[var(--color-success)]" />
                <span>{cmToFeetInches(character.appearance?.height)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Activity className="w-3.5 h-3.5 text-[var(--color-info)]" />
                <span>{kgToLbs(character.appearance?.weight)}</span>
              </div>
            </div>

            {character.diseaseHealth?.currentDiseases?.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5 text-[var(--color-error)] text-xs mb-2">
                  <Skull className="w-3.5 h-3.5" />
                  <span className="font-semibold">Afflictions</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {character.diseaseHealth.currentDiseases.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedDisease(d); setIsDiseaseModalOpen(true); }}
                      className="px-2 py-0.5 rounded text-xs font-medium transition-colors"
                      style={{ background: 'var(--color-error)', color: 'white' }}
                    >
                      {d.disease.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-normal)' }}>
            <nav className="flex gap-2">
              <NavTab label="Overview" icon={<Scroll className="w-4 h-4" />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <NavTab label="Inventory" icon={<Package className="w-4 h-4" />} active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
              <NavTab label="Social" icon={<Users className="w-4 h-4" />} active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
              <NavTab label="History" icon={<Clock className="w-4 h-4" />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            </nav>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-[var(--surface-muted-hover-bg)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-5">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                    <Shield className="w-4 h-4" /> Equipment
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <EquipmentSlotDisplay slot="Head" item={equipped.head} icon={<Crown className="w-4 h-4" />} onUnequip={() => onUnequipItem('head')} />
                    <EquipmentSlotDisplay slot="Body" item={equipped.body} icon={<Shirt className="w-4 h-4" />} onUnequip={() => onUnequipItem('body')} />
                    <EquipmentSlotDisplay slot="Hands" item={equipped.hands} icon={<Gem className="w-4 h-4" />} onUnequip={() => onUnequipItem('hands')} />
                    <EquipmentSlotDisplay slot="Weapon" item={equipped.mainHand} icon={<Sword className="w-4 h-4" />} onUnequip={() => onUnequipItem('mainHand')} />
                    <EquipmentSlotDisplay slot="Off-Hand" item={equipped.offHand} icon={<Shield className="w-4 h-4" />} onUnequip={() => onUnequipItem('offHand')} />
                    <EquipmentSlotDisplay slot="Feet" item={equipped.feet} icon={<Footprints className="w-4 h-4" />} onUnequip={() => onUnequipItem('feet')} />
                  </div>
                </section>

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                    <Scroll className="w-4 h-4" /> Background
                  </h3>
                  <div className="p-4 rounded-xl surface-muted">
                    <p className="text-sm text-text-secondary leading-relaxed italic">
                      "{character.backstory || 'A wanderer with an unknown past...'}"
                    </p>
                  </div>
                </section>

                {character.attributes?.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                      <Sparkles className="w-4 h-4" /> Traits
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {character.attributes.map((attr, i) => (
                        <span key={i} className="badge-pill" data-variant="accent" title={attr.description}>
                          {attr.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {character.personality && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                      <Activity className="w-4 h-4" /> Personality
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(character.personality).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-text-muted w-20 capitalize">{key}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-track-bg)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(value as number) * 100}%`, background: 'var(--accent-primary)' }}
                            />
                          </div>
                          <span className="text-[10px] text-text-muted w-8">{Math.round((value as number) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="flex gap-5 h-full">
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {(['all', 'weapons', 'apparel', 'tools', 'food'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setInventoryFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                          inventoryFilter === f
                            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                            : 'surface-muted text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                    <span className="ml-auto text-xs text-text-muted self-center">{filteredInventory.length} items</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
                    {filteredInventory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-text-muted italic">No items</div>
                    ) : (
                      filteredInventory.map(item => (
                        <ItemCard key={item.id} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} />
                      ))
                    )}
                  </div>
                </div>

                <div className="w-64 flex-shrink-0">
                  <div className="sticky top-0 p-4 rounded-xl surface-muted min-h-[280px]">
                    {selectedItem ? (
                      <>
                        <div className="w-16 h-16 mx-auto mb-3 rounded-lg p-2" style={{ background: 'var(--surface-track-bg)' }}>
                          <GenerativeItemIcon item={selectedItem} size={48} />
                        </div>
                        <h4 className="text-center font-semibold text-text-primary mb-1">{formatName(selectedItem.name)}</h4>
                        <div className="flex justify-center gap-2 mb-3">
                          <span className="badge-pill" style={{ background: getRarityColor(selectedItem.rarity), color: 'white' }}>
                            {selectedItem.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary text-center mb-3 italic">{itemDescription}</p>
                        <div className="space-y-1 text-xs mb-4 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex justify-between"><span className="text-text-muted">Value</span><span className="text-[var(--accent-secondary)] font-medium">{selectedItem.value}g</span></div>
                          <div className="flex justify-between"><span className="text-text-muted">Weight</span><span className="text-text-primary">{selectedItem.weight} lbs</span></div>
                          {selectedItem.damage && <div className="flex justify-between"><span className="text-text-muted">Damage</span><span className="text-[var(--color-error)]">{selectedItem.damage}</span></div>}
                          {selectedItem.defense && <div className="flex justify-between"><span className="text-text-muted">Defense</span><span className="text-[var(--color-info)]">+{selectedItem.defense}</span></div>}
                        </div>
                        <div className="space-y-2">
                          {(selectedItem.wearable || selectedItem.wieldable) && (
                            <button onClick={() => onEquipItem(selectedItem)} className="w-full py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: 'var(--button-primary-bg)' }}>
                              <ChevronRight className="w-4 h-4" /> Equip
                            </button>
                          )}
                          {(selectedItem.sustenance > 0 || selectedItem.fatigueEffect) && (
                            <button onClick={() => onConsumeItem(selectedItem)} className="w-full py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--color-success)' }}>Consume</button>
                          )}
                          <button onClick={() => onDropItem(selectedItem)} className="w-full py-2 rounded-lg text-sm font-medium border surface-muted text-[var(--color-error)]">Drop</button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-text-muted italic">Select an item</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SOCIAL */}
            {activeTab === 'social' && (
              <div className="space-y-5">
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                    <Star className="w-4 h-4" /> Beliefs & Values
                  </h3>
                  <div className="rounded-xl surface-muted p-4">
                    <BeliefsPanel character={character} />
                  </div>
                </section>

                {(character.family?.length ?? 0) > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                      <Users className="w-4 h-4" /> Family
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {character.family?.map((member, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg surface-muted">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted" style={{ background: 'var(--surface-track-bg)' }}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{member.name}</div>
                            <div className="text-xs text-text-muted capitalize">{member.relation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-3">
                    <PawPrint className="w-4 h-4" /> Animal Companions ({tamedAnimals.length})
                  </h3>
                  {tamedAnimals.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {tamedAnimals.map(animal => {
                        const hp = (animal.health / 10) * 100;
                        const data = ANIMAL_DATA[animal.baseId];
                        return (
                          <div key={animal.id} className="flex items-center gap-3 p-3 rounded-lg surface-muted border" style={{ borderColor: 'var(--color-success)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success)', color: 'white' }}>
                              <PawPrint className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-text-primary capitalize truncate">{animal.name || animal.speciesName}</div>
                              <div className="text-xs text-text-muted capitalize">{data?.type || 'animal'}</div>
                              <div className="h-1 mt-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-track-bg)' }}>
                                <div className="h-full rounded-full" style={{ width: `${hp}%`, background: hp > 70 ? 'var(--color-success)' : hp > 40 ? 'var(--color-warning)' : 'var(--color-error)' }} />
                              </div>
                            </div>
                            <button onClick={() => handleReleaseAnimal(animal.id)} className="px-2 py-1 text-xs rounded font-medium" style={{ background: 'var(--color-error)', color: 'white' }}>Release</button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted italic">No companions yet</div>
                  )}
                </section>
              </div>
            )}

            {/* HISTORY */}
            {activeTab === 'history' && (
              <HistoryErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }} /></div>}>
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
                </Suspense>
              </HistoryErrorBoundary>
            )}
          </main>

          {/* Footer */}
          <footer className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-normal)', background: 'var(--surface-muted-bg)' }}>
            <button onClick={onRegenerate} disabled={isEnhancing} className="text-xs text-text-muted hover:text-text-secondary disabled:opacity-50 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isEnhancing ? 'Regenerating...' : 'Regenerate Character'}
            </button>
            <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--button-primary-bg)' }}>Close</button>
          </footer>
        </div>
      </div>

      {selectedDisease && (
        <DiseaseModal
          disease={selectedDisease}
          isOpen={isDiseaseModalOpen}
          onClose={() => { setIsDiseaseModalOpen(false); setSelectedDisease(null); }}
          currentYear={parseInt(date || '1500', 10)}
          culturalZone={mapLocationToCulture(location, parseInt(date || '1500', 10))}
        />
      )}
    </div>
  );
};

export default React.memo(CharacterProfileModalV2);
