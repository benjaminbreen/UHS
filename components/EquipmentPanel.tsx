import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PlayerCharacter, Item, EquipmentSlot, Rarity } from '../types';
import { getProceduralItemStats } from '../services/combatService';
import ItemStatsPanel from './ItemStatsPanel';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import LazyItemIcon from './LazyItemIcon';
import AccessoryMaintenanceService from '../services/accessoryMaintenanceService';
import {
  Crown,
  Gem,
  Shield,
  Sword,
  Shirt,
  Wind,
  Watch,
  Footprints,
  Sparkles,
  Info,
} from 'lucide-react';
import { FaSearch, FaTimes, FaFilter, FaSortAmountDown, FaTh, FaList, FaMagic } from 'react-icons/fa';

/* ---------------------------- helpers ---------------------------- */

const humanizeSlot = (slot: EquipmentSlot) =>
  slot.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Quality modifiers that appear in item names
const QUALITY_MODIFIERS = [
  'Divine', 'Exquisite', 'Masterwork', 'Superior', 'Fine', 'Quality',
  'Standard', 'Common', 'Crude', 'Poor', 'Damaged', 'Broken',
  'Exceptional', 'Refined', 'Polished', 'Pristine', 'Flawless',
  'Well-made', 'Sturdy', 'Reliable', 'Simple', 'Basic', 'Rough',
  'Worn', 'Used', 'Battered', 'Makeshift', 'Improvised', 'Elegant'
];

// Color words that appear in item names
const COLOR_WORDS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Gray', 'Grey',
  'Brown', 'Tan', 'Beige', 'Crimson', 'Scarlet', 'Navy', 'Teal', 'Turquoise', 'Indigo', 'Violet',
  'Magenta', 'Cyan', 'Maroon', 'Olive', 'Gold', 'Silver', 'Bronze', 'Copper', 'Ivory', 'Pearl',
  'Ruby', 'Emerald', 'Sapphire', 'Amber', 'Jade', 'Onyx', 'Rose', 'Coral', 'Ochre', 'Lavender'
];

const MATERIAL_WORDS = [
  // Textiles
  'Hemp', 'Wool', 'Burlap', 'Linen', 'Cotton', 'Silk', 'Velvet', 'Satin',
  'Fine Wool', 'Fine Linen', 'Smooth Cotton', 'Fine Silk', 'Embroidered Silk',
  'Rough Wool', 'Rough Linen',
  // Metals
  'Bone', 'Copper', 'Bronze', 'Iron', 'Steel', 'Brass', 'Silver', 'Gold',
  // Leather/Hide
  'Hide', 'Leather', 'Raw Hide', 'Rough Leather', 'Treated Hide',
  'Fine Leather', 'Soft Leather', 'Silk-lined Leather', 'Embossed Leather'
];

// Extract quality and color from item name, handling based on slot type
const extractQuality = (itemName: string, equipmentSlot?: EquipmentSlot): { name: string; quality: string | null } => {
  // Safety checks
  if (!itemName || typeof itemName !== 'string') {
    return { name: 'Unknown Item', quality: null };
  }

  let cleanedName = itemName.trim();
  let foundQuality: string | null = null;

  // First, extract quality modifiers
  for (const modifier of QUALITY_MODIFIERS) {
    const regex = new RegExp(`^${modifier}\\s+`, 'i');
    if (regex.test(cleanedName)) {
      cleanedName = cleanedName.replace(regex, '').trim();
      foundQuality = modifier;
      break;
    }
  }

  // Determine if we should strip colors/materials based on equipment slot
  const shouldKeepColor = equipmentSlot &&
    (equipmentSlot === 'torso' || equipmentSlot === 'cloak' || equipmentSlot === 'legs' ||
     equipmentSlot === 'head' || equipmentSlot === 'feet');

  // If it's an accessory (ring, necklace) or non-clothing item, strip color and material words
  if (!shouldKeepColor) {
    // Strip color words
    for (const color of COLOR_WORDS) {
      // Remove color words that appear at the start or with materials (e.g., "Red Velvet")
      const colorPatterns = [
        new RegExp(`^${color}\\s+`, 'i'),  // Color at start
        new RegExp(`\\s+${color}\\s+`, 'i'), // Color in middle
        new RegExp(`^${color}\\s+\\w+\\s+`, 'i') // Color + material (e.g., "Red Velvet")
      ];

      for (const pattern of colorPatterns) {
        if (pattern.test(cleanedName)) {
          cleanedName = cleanedName.replace(pattern, ' ').trim();
          break;
        }
      }
    }

    // Strip material words
    for (const material of MATERIAL_WORDS) {
      // Remove material words that appear at the start or in combination
      const materialPatterns = [
        new RegExp(`^${material}\\s+`, 'i'),  // Material at start (e.g., "Satin Ring")
        new RegExp(`\\s+${material}\\s+`, 'i'), // Material in middle
        // Handle compound materials like "Fine Silk" by checking for the full phrase first
        new RegExp(`^${material.replace(/\s+/g, '\\s+')}\\s+`, 'i')
      ];

      for (const pattern of materialPatterns) {
        if (pattern.test(cleanedName)) {
          cleanedName = cleanedName.replace(pattern, ' ').trim();
          break;
        }
      }
    }
  }

  // Clean up any double spaces or leading/trailing spaces
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

  return { name: cleanedName, quality: foundQuality };
};

// Map quality to color classes
const qualityClass: Record<string, string> = {
  'Divine': 'bg-purple-500 text-purple-100 ring-purple-300/50',
  'Exquisite': 'bg-purple-600 text-purple-100 ring-purple-300/40',
  'Masterwork': 'bg-indigo-600 text-indigo-100 ring-indigo-300/40',
  'Exceptional': 'bg-indigo-500 text-indigo-100 ring-indigo-300/40',
  'Superior': 'bg-blue-500 text-blue-100 ring-blue-300/40',
  'Refined': 'bg-blue-600 text-blue-100 ring-blue-300/40',
  'Fine': 'bg-cyan-600 text-cyan-100 ring-cyan-300/40',
  'Quality': 'bg-teal-600 text-teal-100 ring-teal-300/40',
  'Well-made': 'bg-green-600 text-green-100 ring-green-300/40',
  'Polished': 'bg-emerald-600 text-emerald-100 ring-emerald-300/40',
  'Pristine': 'bg-emerald-500 text-emerald-100 ring-emerald-300/40',
  'Flawless': 'bg-purple-500 text-purple-100 ring-purple-300/40',
  'Sturdy': 'bg-slate-600 text-slate-100 ring-slate-300/40',
  'Reliable': 'bg-gray-600 text-gray-100 ring-gray-300/40',
  'Standard': 'bg-slate-600 text-slate-100 ring-slate-300/40',
  'Common': 'bg-gray-600 text-gray-100 ring-gray-400/40',
  'Simple': 'bg-gray-600 text-gray-100 ring-gray-400/40',
  'Basic': 'bg-gray-600 text-gray-100 ring-gray-400/40',
  'Crude': 'bg-orange-700 text-orange-100 ring-orange-400/40',
  'Poor': 'bg-orange-800 text-orange-100 ring-orange-400/40',
  'Rough': 'bg-amber-700 text-amber-100 ring-amber-400/40',
  'Worn': 'bg-yellow-700 text-yellow-100 ring-yellow-400/40',
  'Used': 'bg-yellow-800 text-yellow-100 ring-yellow-400/40',
  'Damaged': 'bg-red-700 text-red-100 ring-red-400/40',
  'Battered': 'bg-red-800 text-red-100 ring-red-400/40',
  'Broken': 'bg-red-900 text-red-100 ring-red-400/50',
  'Makeshift': 'bg-orange-800 text-orange-100 ring-orange-400/40',
  'Improvised': 'bg-amber-800 text-amber-100 ring-amber-400/40'
};

const slotIconMap: Record<EquipmentSlot, React.ReactNode> = {
  head: <Crown className="w-5 h-5" />,
  necklace: <Gem className="w-5 h-5" />,
  torso: <Shirt className="w-5 h-5" />,
  cloak: <Wind className="w-5 h-5" />,
  main_hand: <Sword className="w-5 h-5" />,
  off_hand: <Shield className="w-5 h-5" />,
  legs: <Watch className="w-5 h-5" />,
  feet: <Footprints className="w-5 h-5" />,
  belt: <Watch className="w-5 h-5" />,
  ring1: <Gem className="w-5 h-5" />,
  accessory: <Sparkles className="w-5 h-5" />,
};

const rarityClass: Record<Rarity, string> = {
  Junk: 'bg-gray-600 text-gray-100 ring-gray-400/50',
  Common: 'bg-slate-600 text-slate-100 ring-slate-300/40',
  Uncommon: 'bg-green-600 text-green-100 ring-green-300/40',
  Rare: 'bg-blue-600 text-blue-100 ring-blue-300/40',
  'Ultra-rare': 'bg-purple-600 text-purple-100 ring-purple-300/40',
  Unique: 'bg-amber-500 text-amber-100 ring-amber-300/50',
};

// Moved inside component to access itemStatsCache
// const scoreOf = (it: Item) => {
//   const s = getProceduralItemStats(it);
//   return (s.attack || 0) + (s.defense || 0);
// };

/* --------------------------- UI bits ----------------------------- */

const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
  const base = rarityClass[rarity] || 'bg-gray-600 text-gray-100 ring-gray-400/50';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ring-1 shadow-sm ${base}`}>
      {rarity.toUpperCase()}
    </span>
  );
};

const QualityTag: React.FC<{ quality: string }> = ({ quality }) => {
  const base = qualityClass[quality] || 'bg-gray-600 text-gray-100 ring-gray-400/50';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ring-1 shadow-sm ${base}`}>
      {quality.toUpperCase()}
    </span>
  );
};

/** Tooltip rendered in a portal + anchored to hovered element’s rect (or mouse fallback) */
const StatComparisonTooltip: React.FC<{
  item: Item | null;
  comparison: { attack: number; defense: number } | null;
  action: 'equip' | 'unequip';
  position: { x: number; y: number };
  anchorRect: DOMRect | null;
}> = ({ item, comparison, action, position, anchorRect }) => {
  if (!item) return null;

  const StatChange: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    if (value === 0) return null;
    const up = value > 0;
    return (
      <div className={`flex justify-between ${up ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-error)]'}`}>
        <span>{label}</span>
        <span>{up ? '+' : ''}{value}</span>
      </div>
    );
  };

  const tooltipWidth = 320;
  const tooltipHeight = 204;
  const pad = 12;

  // Prefer anchoring beside the hovered element; fallback to cursor
  let left = anchorRect ? anchorRect.right + 12 : position.x + 16;
  let top = anchorRect ? anchorRect.top : position.y - 12;

  // Clamp inside viewport
  if (left + tooltipWidth > window.innerWidth - pad) {
    left = (anchorRect ? anchorRect.left : position.x) - tooltipWidth - 12;
  }
  if (top + tooltipHeight > window.innerHeight - pad) {
    top = (anchorRect ? anchorRect.bottom : position.y) - tooltipHeight + 12;
  }
  if (top < pad) top = pad;

  const node = (
    <div
      className="fixed z-[9999] pointer-events-none p-4 w-80 text-xs bg-[var(--surface-tooltip-bg)] border-2 border-[var(--surface-tooltip-border)] rounded-lg shadow-2xl backdrop-blur-sm"
      style={{ top, left, color: 'var(--text-primary)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 flex items-center justify-center bg-[var(--surface-muted-bg)] rounded-lg border border-[var(--border-normal)]">
          <GenerativeItemIcon item={item} size={64} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-[color:var(--accent-primary)]">{action === 'equip' ? 'Equip' : 'Unequip'}</h4>
          <p className="font-semibold mt-0.5 leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
          {item.rarity && <RarityTag rarity={item.rarity} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 text-[11px]">
        {item.equipmentSlot && (
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--text-secondary)' }}>Slot:</span>
            <span className="capitalize" style={{ color: 'var(--text-primary)' }}>{humanizeSlot(item.equipmentSlot as EquipmentSlot)}</span>
          </div>
        )}
        {item.value !== undefined && (
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--text-secondary)' }}>Value:</span>
            <span className="text-[color:var(--color-warning)]">{item.value} 🪙</span>
          </div>
        )}
        {item.weight !== undefined && (
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--text-secondary)' }}>Weight:</span>
            <span style={{ color: 'var(--text-primary)' }}>{item.weight} kg</span>
          </div>
        )}
        {item.throwable && (
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--text-secondary)' }}>Throwable:</span>
            <span className="text-[color:var(--color-success)]">✓</span>
          </div>
        )}
      </div>

      {item.description && (
        <p className="text-[11px] italic mb-2 border-t border-[var(--border-normal)] pt-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
      )}

      {comparison && (
        <div className="space-y-1 font-mono border-t border-[color:var(--border-normal)] pt-2">
          <StatChange label="Attack" value={comparison.attack} />
          <StatChange label="Defense" value={comparison.defense} />
        </div>
      )}
    </div>
  );

  // Render into body to avoid transform/stacking quirks (esp. Safari)
  return createPortal(node, document.body);
};

/** Slot cell with DnD + hover */
const EquipmentSlotDisplay: React.FC<{
  slot: EquipmentSlot;
  item: Item | undefined;
  onUnequip: (slot: EquipmentSlot) => void;
  onHover: (item: Item | null, action: 'unequip') => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onEquipItemToSlot?: (item: Item, slot: EquipmentSlot) => void;
  onAnchor?: (rect: DOMRect | null) => void; // NEW: let parent anchor tooltip to this cell
  getExtractedQuality: (itemName: string, equipmentSlot?: EquipmentSlot) => { name: string; quality: string | null };
}> = ({ slot, item, onUnequip, onHover, onMouseMove, onEquipItemToSlot, onAnchor, getExtractedQuality }) => {
  const [dragOver, setDragOver] = useState<'ok' | 'bad' | null>(null);

  const canDropHere = useCallback((dropped: Item) => {
    const target = slot;
    const s = (dropped.equipmentSlot || '').toString();
    if (s === target) return true;
    if (s === 'ring' && target === 'ring1') return true;
    if (s === 'accessory' && target === 'accessory') return true;
    if (s === 'hand' && (target === 'main_hand' || target === 'off_hand')) return true;
    if ((dropped.wieldable && (target === 'main_hand' || target === 'off_hand')) ||
        (dropped.wearable && !['main_hand', 'off_hand'].includes(target))) {
      return true;
    }
    return false;
  }, [slot]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData('item');
      if (!json) return;
      const dropped = JSON.parse(json) as Item;
      setDragOver(canDropHere(dropped) ? 'ok' : 'bad');
    } catch {
      setDragOver('bad');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const json = e.dataTransfer.getData('item');
    if (!json || !onEquipItemToSlot) return;
    try {
      const droppedItem = JSON.parse(json) as Item;
      onEquipItemToSlot(droppedItem, slot);
    } catch (err) {
      console.error('Failed to parse dropped item:', err);
    }
  };

  const hasBodyModification = item && (item as any).specialType && ['tattoo', 'scarification', 'face_paint'].includes((item as any).specialType);
  
  const borderState =
    dragOver === 'ok'
      ? 'border-green-400 bg-green-900/10'
      : dragOver === 'bad'
      ? 'border-red-400 bg-red-900/10'
      : hasBodyModification
      ? 'border-purple-400 bg-purple-900/20 hover:border-purple-300 shadow-lg shadow-purple-900/30'
      : item
      ? 'border-[var(--border-normal)] bg-[var(--surface-muted-bg)] hover:border-blue-400'
      : 'border-[var(--border-subtle)] bg-[var(--surface-muted-bg)]';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={item ? `${humanizeSlot(slot)}: ${item.name}` : `${humanizeSlot(slot)} (empty)`}
      className={`aspect-square border-2 rounded-xl p-1 transition-colors relative group ${borderState}`}
      onMouseMove={onMouseMove}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(null)}
      onDrop={handleDrop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && item) onUnequip(slot);
      }}
      onMouseEnter={(e) => onAnchor?.(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onAnchor?.(null)}
    >
      {/* Slot label */}
      <div className="absolute -top-2 left-1 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--surface-chip-bg)] border border-[var(--surface-chip-border)] text-text-primary">
        {slotIconMap[slot]}
        <span className="capitalize text-[9px]">{humanizeSlot(slot)}</span>
      </div>

      {item ? (
        <div
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
          onClick={() => {
            // Check if item is permanent (tattoo, scarification, etc.)
            const isPermanent = (item as any).isPermanent;
            if (isPermanent) {
              console.log('This accessory is permanent and cannot be removed.');
              return;
            }
            onUnequip(slot);
          }}
          onMouseEnter={() => onHover(item, 'unequip')}
          onMouseLeave={() => onHover(null, 'unequip')}
          title={(() => {
            const isPermanent = (item as any).isPermanent;
            const duration = (item as any).duration;
            const specialType = (item as any).specialType;
            
            if (isPermanent) {
              const culturalSignificance = AccessoryMaintenanceService.getCulturalSignificance(item);
              return `Permanent - cannot be removed. ${culturalSignificance}`;
            }
            if (duration) {
              const timeRemaining = AccessoryMaintenanceService.getTemporaryAccessoryDisplay(item);
              return `Temporary accessory. ${timeRemaining}. Click to unequip.`;
            }
            return "Click to unequip";
          })()}
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center drop-shadow">
            <LazyItemIcon item={item} size={56} immediate={true} />
          </div>
          <p className="text-[14px] sm:text-[15px] font-bold leading-tight text-text-primary w-full text-center mt-1.5 px-0.5 break-words hyphens-auto shadow-sm" style={{wordBreak: 'break-word'}}>
            {item.name ? getExtractedQuality(item.name, slot).name : 'Unknown'}
          </p>
          {/* Show special indicator for permanent items */}
          {(item as any).isPermanent && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" title="Permanent" />
          )}
          {/* Show special body modification indicator */}
          {(item as any).specialType && ['tattoo', 'scarification', 'face_paint'].includes((item as any).specialType) && (
            <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-purple-600 border border-purple-400 rounded-full text-[8px] font-bold text-white shadow-lg" title={`Body Modification: ${(item as any).specialType?.replace('_', ' ')}`}>
              🖋️
            </div>
          )}
          {/* Show duration for temporary items */}
          {(item as any).duration && (
            <div className="absolute bottom-0 right-0 text-[8px] text-yellow-400 bg-[var(--surface-chip-bg)] px-1 rounded">
              {AccessoryMaintenanceService.getTemporaryAccessoryDisplay(item)}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
          <div className="opacity-60 group-hover:opacity-80">{slotIconMap[slot]}</div>
          <p className="text-[10px] mt-1 opacity-60">Empty</p>
        </div>
      )}
    </div>
  );
};

/* ------------------------- main component ------------------------ */

interface EquipmentPanelProps {
  character: PlayerCharacter;
  onEquipItem: (item: Item, targetSlot?: EquipmentSlot) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
}

const SLOT_ORDER: EquipmentSlot[] = [
  'ring1',
  'head',
  'accessory',
  'necklace',
  'torso',
  'cloak',
  'main_hand',
  'legs',
  'off_hand',
  'belt',
  'feet',
];

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  character,
  onEquipItem,
  onUnequipItem,
}) => {
  // Track component mount for performance logging
  const mountTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);

  const [tooltip, setTooltip] = useState<{ item: Item; action: 'equip' | 'unequip' } | null>(null);
  const [comparisonStats, setComparisonStats] = useState<{ attack: number; defense: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null); // NEW

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [slotFilter, setSlotFilter] = useState<'all' | EquipmentSlot | 'hand' | 'ring'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'name' | 'value'>('rarity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const equipped = character.equippedItems;

  // Log on first render only
  if (renderCountRef.current === 0) {
    console.log(`[EquipmentPanel] Initial mount - Inventory size: ${character.inventory.length}, Equipped slots: ${Object.keys(equipped).length}`);
    renderCountRef.current++;
  }

  // Log mount time after first render
  useEffect(() => {
    const elapsed = performance.now() - mountTimeRef.current;
    console.log(`[EquipmentPanel] Component mounted and rendered in ${elapsed.toFixed(2)}ms`);
  }, []);

  const getEquipmentItem = useCallback(
    (slot: EquipmentSlot): Item | undefined => equipped[slot],
    [equipped]
  );

  const handleMouseMove = (e: React.MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });

  const handleItemHover = (item: Item | null, action: 'equip' | 'unequip') => {
    if (!item) {
      setTooltip(null);
      setComparisonStats(null);
      return;
    }
    setTooltip({ item, action });

    const newStats = getItemStats(item);
    if (action === 'unequip') {
      setComparisonStats({ attack: -newStats.attack, defense: -newStats.defense });
    } else {
      const targetSlot = (newStats as any).equipmentSlot as EquipmentSlot | undefined;
      const current = targetSlot ? getEquipmentItem(targetSlot) : undefined;
      const currentStats = current ? getItemStats(current) : { attack: 0, defense: 0 };
      setComparisonStats({
        attack: newStats.attack - currentStats.attack,
        defense: newStats.defense,
      });
      setComparisonStats({
        attack: newStats.attack - currentStats.attack,
        defense: newStats.defense - currentStats.defense,
      });
    }
  };

  const equippableInventory = useMemo(
    () => character.inventory.filter((i) => i.wearable || i.wieldable),
    [character.inventory]
  );

  // Debounce search query to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Use ref for stats cache to avoid stale closures
  const itemStatsCacheRef = useRef(new Map<string, any>());

  // Add cache for extractQuality results to avoid repeated expensive regex operations
  const extractQualityCacheRef = useRef(new Map<string, { name: string; quality: string | null }>());

  // Helper to get stats with lazy calculation
  const getItemStats = useCallback((item: Item) => {
    const cache = itemStatsCacheRef.current;
    if (cache.has(item.id)) {
      return cache.get(item.id);
    }
    const stats = getProceduralItemStats(item);
    cache.set(item.id, stats);
    return stats;
  }, []);

  // Memoized extractQuality function to avoid repeated regex operations
  const getExtractedQuality = useCallback((itemName: string, equipmentSlot?: EquipmentSlot) => {
    const startTime = performance.now();

    // Safety check: handle invalid item names
    if (!itemName || typeof itemName !== 'string') {
      console.warn('[EquipmentPanel] Invalid item name:', itemName);
      return { name: 'Unknown Item', quality: null };
    }

    const cacheKey = `${itemName}|${equipmentSlot || 'none'}`;
    const cache = extractQualityCacheRef.current;

    if (cache.has(cacheKey)) {
      const elapsed = performance.now() - startTime;
      if (elapsed > 5) {
        console.log(`[EquipmentPanel] Cache hit for "${itemName}" took ${elapsed.toFixed(2)}ms`);
      }
      return cache.get(cacheKey)!;
    }

    const result = extractQuality(itemName, equipmentSlot);
    cache.set(cacheKey, result);

    const elapsed = performance.now() - startTime;
    if (elapsed > 10) {
      console.warn(`[EquipmentPanel] Slow extractQuality for "${itemName}": ${elapsed.toFixed(2)}ms`);
    }

    // Limit cache size to prevent memory bloat
    if (cache.size > 500) {
      console.log(`[EquipmentPanel] Cache size exceeded 500, clearing to 250 entries`);
      const entries = Array.from(cache.entries());
      cache.clear();
      // Keep most recent 250 entries
      entries.slice(-250).forEach(([k, v]) => cache.set(k, v));
    }

    return result;
  }, []);

  // Pre-calculate stats for equipped items only
  useEffect(() => {
    const cache = itemStatsCacheRef.current;
    // Only calculate for currently equipped items
    Object.values(character.equippedItems).forEach(item => {
      if (item && !cache.has(item.id)) {
        cache.set(item.id, getProceduralItemStats(item));
      }
    });
  }, [character.equippedItems]);

  // Score function using cached stats
  const scoreOf = useCallback((it: Item) => {
    const s = getItemStats(it);
    return (s.attack || 0) + (s.defense || 0);
  }, [getItemStats]);

  const filteredInventory = useMemo(() => {
    const filterStartTime = performance.now();
    let items = equippableInventory;

    console.log(`[EquipmentPanel] Starting inventory filter with ${items.length} equippable items`);

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          (i.material || '').toLowerCase().includes(q)
      );
      console.log(`[EquipmentPanel] After query filter: ${items.length} items`);
    }

    if (slotFilter !== 'all') {
      items = items.filter((i) => {
        const s = (i.equipmentSlot || '').toString();
        if (slotFilter === 'hand') return s === 'main_hand' || s === 'off_hand' || s === 'hand' || i.wieldable;
        if (slotFilter === 'ring') return s === 'ring' || s === 'ring1';
        if (slotFilter === 'accessory') return s === 'accessory';
        return s === slotFilter;
      });
      console.log(`[EquipmentPanel] After slot filter: ${items.length} items`);
    }

    const rarityRank: Record<Rarity, number> = { Junk: 0, Common: 1, Uncommon: 2, Rare: 3, 'Ultra-rare': 4, Unique: 5 };
    const byName = (a: Item, b: Item) => a.name.localeCompare(b.name);
    const byValue = (a: Item, b: Item) => (b.value ?? 0) - (a.value ?? 0);
    const byRarity = (a: Item, b: Item) => (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0);

    items = [...items].sort(sortBy === 'name' ? byName : sortBy === 'value' ? byValue : byRarity);

    const filterElapsed = performance.now() - filterStartTime;
    console.log(`[EquipmentPanel] Inventory filtering completed in ${filterElapsed.toFixed(2)}ms, final count: ${items.length}`);

    return items;
  }, [equippableInventory, debouncedQuery, slotFilter, sortBy]);

  /* ---------------------- NEW: Optimize button ---------------------- */
  const optimizeLoadout = () => {
    // Greedy per-slot; prevents double-using the same item; picks two best rings.
    const picks: Partial<Record<EquipmentSlot, Item>> = {};
    const used = new Set<string>();

    // Ring slot
    const ringCands = equippableInventory.filter((it) => {
      const s = (it.equipmentSlot as any) as string;
      return s === 'ring' || s === 'ring1';
    }).sort((a, b) => scoreOf(b) - scoreOf(a));
    if (ringCands[0]) { picks.ring1 = ringCands[0]; used.add(String(ringCands[0].id)); }
    
    // Accessory slot (earrings, nose rings, bindis, etc)
    const accessoryCands = equippableInventory.filter((it) => {
      const s = (it.equipmentSlot as any) as string;
      return s === 'accessory';
    }).sort((a, b) => scoreOf(b) - scoreOf(a));
    if (accessoryCands[0]) { picks.accessory = accessoryCands[0]; used.add(String(accessoryCands[0].id)); }

    // Helper to choose best candidate for a slot
    const chooseBest = (slot: EquipmentSlot, predicate: (it: Item) => boolean) => {
      let best: Item | undefined;
      let bestScore = -Infinity;
      for (const it of equippableInventory) {
        if (used.has(String(it.id))) continue;
        if (!predicate(it)) continue;
        const sc = scoreOf(it);
        if (sc > bestScore) {
          best = it; bestScore = sc;
        }
      }
      if (best) { picks[slot] = best; used.add(String(best.id)); }
    };

    // Exact-slot wearables
    chooseBest('head', (it) => (it.equipmentSlot as any) === 'head');
    chooseBest('necklace', (it) => (it.equipmentSlot as any) === 'necklace');
    chooseBest('torso', (it) => (it.equipmentSlot as any) === 'torso');
    chooseBest('cloak', (it) => (it.equipmentSlot as any) === 'cloak');
    chooseBest('legs', (it) => (it.equipmentSlot as any) === 'legs');
    chooseBest('belt', (it) => (it.equipmentSlot as any) === 'belt');
    chooseBest('feet', (it) => (it.equipmentSlot as any) === 'feet');

    // Hands: accept main/off/hand or wieldable
    chooseBest('main_hand', (it) => {
      const s = (it.equipmentSlot as any) as string;
      return s === 'main_hand' || s === 'hand' || it.wieldable === true;
    });
    chooseBest('off_hand', (it) => {
      const s = (it.equipmentSlot as any) as string;
      return s === 'off_hand' || s === 'hand' || it.wieldable === true;
    });

    // Apply equips
    (Object.keys(picks) as EquipmentSlot[]).forEach((slot) => {
      const it = picks[slot];
      if (it) onEquipItem(it, slot);
    });
  };

  const unequipAll = () => {
    SLOT_ORDER.forEach((s) => {
      if (equipped[s]) onUnequipItem(s);
    });
  };

  /* ------------------------------- UI ------------------------------- */

  return (
    <div className=" grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 h-full select-none" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      {/* LEFT: Paper-doll */}
      <div className="surface-card rounded-xl p-2 sm:p-3 relative overflow-hidden h-full min-h-[480px] shadow-lg">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.2),transparent_60%)]" />
        </div>

        <div className="flex items-center justify-between mb-2 relative z-10 gap-2">
          <div className="flex items-center gap-2 text-text-primary">
            
            <h4 className="font-bold text-base">Equipment</h4>
            <span className="text-[11px] text-text-secondary hidden lg:inline">Drag items to slots</span>
          </div>
          <div className="flex items-center gap-2">
            {/* NEW Optimize button */}
            <button
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border border-[color:var(--color-success)]/60 bg-[color:var(--color-success)]/20 hover:bg-[color:var(--color-success)]/30 text-[color:var(--color-success)]"
              onClick={optimizeLoadout}
              title="Automatically equip the best items by stats"
            >
              <FaMagic className="w-3.5 h-3.5" />
              Optimize
            </button>
            <button
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--border-normal)] bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] tracking-tight text-text-primary"
              onClick={unequipAll}
              title="Unequip everything"
            >
              <FaTimes className="w-3.5 h-3.5" />
              Unequip
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3" style={{ gridTemplateRows: 'repeat(4, minmax(90px, 1fr))' }}>
          {SLOT_ORDER.slice(0, 3).map((s) => (
            <EquipmentSlotDisplay
              key={s}
              slot={s}
              item={getEquipmentItem(s)}
              onUnequip={onUnequipItem}
              onHover={handleItemHover}
              onMouseMove={handleMouseMove}
              onEquipItemToSlot={onEquipItem}
              onAnchor={setAnchorRect}
              getExtractedQuality={getExtractedQuality}
            />
          ))}
          {SLOT_ORDER.slice(3, 6).map((s) => (
            <EquipmentSlotDisplay
              key={s}
              slot={s}
              item={getEquipmentItem(s)}
              onUnequip={onUnequipItem}
              onHover={handleItemHover}
              onMouseMove={handleMouseMove}
              onEquipItemToSlot={onEquipItem}
              onAnchor={setAnchorRect}
              getExtractedQuality={getExtractedQuality}
            />
          ))}
          {SLOT_ORDER.slice(6, 9).map((s) => (
            <EquipmentSlotDisplay
              key={s}
              slot={s}
              item={getEquipmentItem(s)}
              onUnequip={onUnequipItem}
              onHover={handleItemHover}
              onMouseMove={handleMouseMove}
              onEquipItemToSlot={onEquipItem}
              onAnchor={setAnchorRect}
              getExtractedQuality={getExtractedQuality}
            />
          ))}
          {SLOT_ORDER.slice(9, 11).map((s) => (
            <EquipmentSlotDisplay
              key={s}
              slot={s}
              item={getEquipmentItem(s)}
              onUnequip={onUnequipItem}
              onHover={handleItemHover}
              onMouseMove={handleMouseMove}
              onEquipItemToSlot={onEquipItem}
              onAnchor={setAnchorRect}
              getExtractedQuality={getExtractedQuality}
            />
          ))}
          <div className="rounded-xl border-3 p-3 border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted-bg)] flex items-center justify-center text-[11px] text-text-secondary">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5" /> Drag here to auto-equip
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Inventory + Stats */}
      <div className="flex flex-col gap-3 h-full min-h-[480px]">
        {/* Controls */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-[var(--border-normal)] bg-[var(--surface-muted-bg)] text-text-primary flex-1 min-w-0">
            <FaSearch className="w-3.5 h-3.5 opacity-70 text-text-secondary flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="bg-transparent outline-none text-xs placeholder:text-text-secondary flex-1 min-w-0"
            />
            {query && (
              <button className="opacity-70 hover:opacity-100 flex-shrink-0" onClick={() => setQuery('')}>
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value as any)}
              className="text-xs px-2 py-1.5 rounded-md border border-[var(--border-normal)] bg-[var(--surface-muted-bg)] text-text-primary pr-6 appearance-none"
              title="Filter by slot"
            >
              <option value="all">All</option>
              <option value="hand">Hands</option>
              <option value="ring">Rings</option>
              {SLOT_ORDER.map((s) => (
                <option key={s} value={s}>
                  {humanizeSlot(s)}
                </option>
              ))}
            </select>
            <FaFilter className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none text-text-secondary" />
          </div>

          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2 py-1.5 rounded-md border border-[var(--border-normal)] bg-[var(--surface-muted-bg)] text-text-primary pr-6 appearance-none"
              title="Sort items"
            >
              <option value="rarity">Rarity</option>
              <option value="name">Name</option>
              <option value="value">Value</option>
            </select>
            <FaSortAmountDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none text-text-secondary" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--surface-muted-bg)] rounded-md border border-[var(--border-normal)] p-0.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-[color:var(--accent-primary)] text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Grid view"
            >
              <FaTh className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'list' ? 'bg-[color:var(--accent-primary)] text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="List view"
            >
              <FaList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Equippable list */}
        <div className="flex-1 min-h-0 surface-card p-3 rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-text-primary text-base">Equippable Items</h4>
            <span className="text-xs text-text-secondary hidden md:inline">Click to auto-equip or drag to a slot</span>
          </div>
          <div className="h-[280px] sm:h-[320px] lg:h-[420px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin touch-pan-y">
            {filteredInventory.length > 0 ? (
              viewMode === 'grid' ? (
                filteredInventory.map((item) => {
                  const handleDragStart = (e: React.DragEvent) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('item', JSON.stringify(item));
                  };
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3.5 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] cursor-pointer border border-[var(--border-normal)] hover:border-blue-500/40 min-h-[72px] transition-all duration-200 hover:shadow-lg"
                      onMouseEnter={(e) => {
                        setAnchorRect(e.currentTarget.getBoundingClientRect());
                        handleItemHover(item, 'equip');
                      }}
                      onMouseLeave={() => {
                        setAnchorRect(null);
                        handleItemHover(null, 'equip');
                      }}
                      onClick={() => onEquipItem(item)}
                      draggable
                      onDragStart={handleDragStart}
                      title="Click to auto-equip or drag to specific slot"
                    >
                      <div className="flex items-start gap-3 min-w-0 py-0.5">
                        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 mt-0.5 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-subtle)]">
                          <LazyItemIcon item={item} size={48} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xl font-bold text-text-primary leading-tight mb-1.5 break-words tracking-wide shadow-sm">{item.name ? getExtractedQuality(item.name, item.equipmentSlot as EquipmentSlot).name : 'Unknown Item'}</p>
                          <div className="flex items-center gap-2 text-[13px] text-text-secondary font-medium">
                            {item.equipmentSlot && (
                              <span className="capitalize">{humanizeSlot(item.equipmentSlot as EquipmentSlot)}</span>
                            )}
                            {item.value !== undefined && <span className="text-yellow-400">{item.value} 🪙</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        <div className="flex flex-col gap-1 items-end">
                          {(() => {
                            if (!item.name) return null;
                            const extractedQuality = getExtractedQuality(item.name, item.equipmentSlot as EquipmentSlot);
                            return extractedQuality.quality && (
                              <QualityTag quality={extractedQuality.quality} />
                            );
                          })()}
                          <RarityTag rarity={item.rarity} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* List View */
                <div className="space-y-2">
                  {filteredInventory.map((item) => {
                    const stats = getItemStats(item);
                    const handleDragStart = (e: React.DragEvent) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('item', JSON.stringify(item));
                    };
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] cursor-pointer border border-[var(--border-normal)] hover:border-blue-500/40 transition-all duration-200 hover:shadow-lg"
                        onMouseEnter={(e) => {
                          setAnchorRect(e.currentTarget.getBoundingClientRect());
                          handleItemHover(item, 'equip');
                        }}
                        onMouseLeave={() => {
                          setAnchorRect(null);
                          handleItemHover(null, 'equip');
                        }}
                        onClick={() => onEquipItem(item)}
                        draggable
                        onDragStart={handleDragStart}
                        title="Click to auto-equip or drag to specific slot"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-subtle)]">
                            <LazyItemIcon item={item} size={56} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-xl font-bold text-text-primary leading-tight break-words tracking-wide shadow-sm">{item.name ? getExtractedQuality(item.name, item.equipmentSlot as EquipmentSlot).name : 'Unknown Item'}</p>
                              <div className="flex gap-1.5 flex-shrink-0">
                                {(() => {
                                  if (!item.name) return null;
                                  const extractedQuality = getExtractedQuality(item.name, item.equipmentSlot as EquipmentSlot);
                                  return extractedQuality.quality && (
                                    <QualityTag quality={extractedQuality.quality} />
                                  );
                                })()}
                                <RarityTag rarity={item.rarity} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[13px]">
                              {item.equipmentSlot && (
                                <div className="text-text-secondary">
                                  <span className="text-text-tertiary">Slot:</span> <span className="capitalize font-medium">{humanizeSlot(item.equipmentSlot as EquipmentSlot)}</span>
                                </div>
                              )}
                              {stats.attack > 0 && (
                                <div className="text-[color:var(--color-error)]">
                                  <span className="text-text-tertiary">Attack:</span> <span className="font-bold">+{stats.attack}</span>
                                </div>
                              )}
                              {stats.defense > 0 && (
                                <div className="text-[color:var(--accent-primary)]">
                                  <span className="text-text-tertiary">Defense:</span> <span className="font-bold">+{stats.defense}</span>
                                </div>
                              )}
                              {item.value !== undefined && (
                                <div className="text-[color:var(--color-warning)]">
                                  <span className="text-text-tertiary">Value:</span> <span className="font-bold">{item.value} 🪙</span>
                                </div>
                              )}
                              {item.weight !== undefined && (
                                <div className="text-text-muted">
                                  <span className="text-text-tertiary">Weight:</span> <span className="font-medium">{item.weight} kg</span>
                                </div>
                              )}
                              {item.condition !== undefined && (
                                <div className={item.condition > 75 ? 'text-[color:var(--color-success)]' : item.condition > 25 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-error)]'}>
                                  <span className="text-text-tertiary">Condition:</span> <span className="font-medium">{item.condition}%</span>
                                </div>
                              )}
                              {item.material && (
                                <div className="text-text-muted">
                                  <span className="text-text-tertiary">Material:</span> <span className="font-medium capitalize">{item.material}</span>
                                </div>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[12px] text-text-secondary italic mt-2 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <p className="text-center text-text-secondary italic py-8 text-sm">
                No equippable items match your filters.
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <ItemStatsPanel character={character} comparisonStats={comparisonStats} />
        </div>
      </div>

      {tooltip && (
        <StatComparisonTooltip
          item={tooltip.item}
          action={tooltip.action}
          comparison={comparisonStats}
          position={mousePos}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
};

export default EquipmentPanel;
