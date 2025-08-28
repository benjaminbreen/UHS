import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PlayerCharacter, Item, EquipmentSlot, Rarity } from '../types';
import { getProceduralItemStats } from '../services/combatService';
import ItemStatsPanel from './ItemStatsPanel';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
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
  Filter,
  SortAsc,
  Search,
  X,
  Info,
  Wand2,
} from 'lucide-react';

/* ---------------------------- helpers ---------------------------- */

const humanizeSlot = (slot: EquipmentSlot) =>
  slot.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const slotIconMap: Record<EquipmentSlot, React.ReactNode> = {
  head: <Crown className="w-5 h-5" />,
  amulet: <Gem className="w-5 h-5" />,
  torso: <Shirt className="w-5 h-5" />,
  cloak: <Wind className="w-5 h-5" />,
  main_hand: <Sword className="w-5 h-5" />,
  off_hand: <Shield className="w-5 h-5" />,
  legs: <Watch className="w-5 h-5" />,
  feet: <Footprints className="w-5 h-5" />,
  belt: <Watch className="w-5 h-5" />,
  ring1: <Gem className="w-5 h-5" />,
  ring2: <Gem className="w-5 h-5" />,
};

const rarityClass: Record<Rarity, string> = {
  Junk: 'bg-gray-600 text-gray-100 ring-gray-400/50',
  Common: 'bg-slate-600 text-slate-100 ring-slate-300/40',
  Uncommon: 'bg-green-600 text-green-100 ring-green-300/40',
  Rare: 'bg-blue-600 text-blue-100 ring-blue-300/40',
  'Ultra-rare': 'bg-purple-600 text-purple-100 ring-purple-300/40',
  Unique: 'bg-amber-500 text-amber-100 ring-amber-300/50',
};

const scoreOf = (it: Item) => {
  const s = getProceduralItemStats(it);
  return (s.attack || 0) + (s.defense || 0);
};

/* --------------------------- UI bits ----------------------------- */

const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
  const base = rarityClass[rarity] || 'bg-gray-600 text-gray-100 ring-gray-400/50';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ring-1 shadow-sm ${base}`}>
      {rarity.toUpperCase()}
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
      <div className={`flex justify-between ${up ? 'text-green-400' : 'text-red-400'}`}>
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
      className="fixed z-[9999] pointer-events-none p-4 w-80 text-xs text-white bg-slate-900/95 border-2 border-blue-400 rounded-lg shadow-2xl backdrop-blur-sm"
      style={{ top, left }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 flex items-center justify-center bg-slate-800/60 rounded-lg border border-slate-600">
          <GenerativeItemIcon item={item} size={64} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-blue-300">{action === 'equip' ? 'Equip' : 'Unequip'}</h4>
          <p className="font-semibold text-white mt-0.5 leading-tight">{item.name}</p>
          {item.rarity && <RarityTag rarity={item.rarity} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 text-[11px] text-slate-300">
        {item.equipmentSlot && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Slot:</span>
            <span className="capitalize">{humanizeSlot(item.equipmentSlot as EquipmentSlot)}</span>
          </div>
        )}
        {item.value !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Value:</span>
            <span className="text-yellow-400">{item.value} 🪙</span>
          </div>
        )}
        {item.weight !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Weight:</span>
            <span>{item.weight} kg</span>
          </div>
        )}
        {item.throwable && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Throwable:</span>
            <span className="text-green-400">✓</span>
          </div>
        )}
      </div>

      {item.description && (
        <p className="text-[11px] text-slate-400 italic mb-2 border-t border-slate-700 pt-2">{item.description}</p>
      )}

      {comparison && (
        <div className="space-y-1 font-mono border-t border-slate-700 pt-2">
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
}> = ({ slot, item, onUnequip, onHover, onMouseMove, onEquipItemToSlot, onAnchor }) => {
  const [dragOver, setDragOver] = useState<'ok' | 'bad' | null>(null);

  const canDropHere = useCallback((dropped: Item) => {
    const target = slot;
    const s = (dropped.equipmentSlot || '').toString();
    if (s === target) return true;
    if (s === 'ring' && (target === 'ring1' || target === 'ring2')) return true;
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

  const borderState =
    dragOver === 'ok'
      ? 'border-green-400 bg-green-900/10'
      : dragOver === 'bad'
      ? 'border-red-400 bg-red-900/10'
      : item
      ? 'border-slate-500 bg-slate-800/30 hover:border-blue-400'
      : 'border-slate-700 bg-slate-900/20';

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
      <div className="absolute -top-2 left-1 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200">
        {slotIconMap[slot]}
        <span className="capitalize">{humanizeSlot(slot)}</span>
      </div>

      {item ? (
        <div
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
          onClick={() => onUnequip(slot)}
          onMouseEnter={() => onHover(item, 'unequip')}
          onMouseLeave={() => onHover(null, 'unequip')}
          title="Click to unequip"
        >
          <div className="w-12 h-12 flex items-center justify-center drop-shadow">
            <GenerativeItemIcon item={item} size={48} />
          </div>
          <p className="text-[10px] leading-tight text-white truncate w-full text-center mt-1 px-1">
            {item.name}
          </p>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
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
  'ring2',
  'amulet',
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
  const [tooltip, setTooltip] = useState<{ item: Item; action: 'equip' | 'unequip' } | null>(null);
  const [comparisonStats, setComparisonStats] = useState<{ attack: number; defense: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null); // NEW

  const [query, setQuery] = useState('');
  const [slotFilter, setSlotFilter] = useState<'all' | EquipmentSlot | 'hand' | 'ring'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'name' | 'value'>('rarity');

  const equipped = character.equippedItems;

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

    const newStats = getProceduralItemStats(item);
    if (action === 'unequip') {
      setComparisonStats({ attack: -newStats.attack, defense: -newStats.defense });
    } else {
      const targetSlot = (newStats as any).equipmentSlot as EquipmentSlot | undefined;
      const current = targetSlot ? getEquipmentItem(targetSlot) : undefined;
      const currentStats = current ? getProceduralItemStats(current) : { attack: 0, defense: 0 };
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

  const filteredInventory = useMemo(() => {
    let items = equippableInventory;

    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          (i.material || '').toLowerCase().includes(q)
      );
    }

    if (slotFilter !== 'all') {
      items = items.filter((i) => {
        const s = (i.equipmentSlot || '').toString();
        if (slotFilter === 'hand') return s === 'main_hand' || s === 'off_hand' || s === 'hand' || i.wieldable;
        if (slotFilter === 'ring') return s === 'ring' || s === 'ring1' || s === 'ring2';
        return s === slotFilter;
      });
    }

    const rarityRank: Record<Rarity, number> = { Junk: 0, Common: 1, Uncommon: 2, Rare: 3, 'Ultra-rare': 4, Unique: 5 };
    const byName = (a: Item, b: Item) => a.name.localeCompare(b.name);
    const byValue = (a: Item, b: Item) => (b.value ?? 0) - (a.value ?? 0);
    const byRarity = (a: Item, b: Item) => (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0);

    items = [...items].sort(sortBy === 'name' ? byName : sortBy === 'value' ? byValue : byRarity);
    return items;
  }, [equippableInventory, query, slotFilter, sortBy]);

  /* ---------------------- NEW: Optimize button ---------------------- */
  const optimizeLoadout = () => {
    // Greedy per-slot; prevents double-using the same item; picks two best rings.
    const picks: Partial<Record<EquipmentSlot, Item>> = {};
    const used = new Set<string>();

    // Rings: take top 2
    const ringCands = equippableInventory.filter((it) => {
      const s = (it.equipmentSlot as any) as string;
      return s === 'ring' || s === 'ring1' || s === 'ring2';
    }).sort((a, b) => scoreOf(b) - scoreOf(a));
    if (ringCands[0]) { picks.ring1 = ringCands[0]; used.add(String(ringCands[0].id)); }
    if (ringCands[1]) { picks.ring2 = ringCands[1]; used.add(String(ringCands[1].id)); }

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
    chooseBest('amulet', (it) => (it.equipmentSlot as any) === 'amulet');
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
    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full select-none" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      {/* LEFT: Paper-doll */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4 relative overflow-hidden h-full min-h-[420px]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.2),transparent_60%)]" />
        </div>

        <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
          <div className="flex items-center gap-2 text-slate-200">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <h4 className="font-semibold">Equipment</h4>
            <span className="text-xs text-slate-400 hidden sm:inline">Drag items to specific slots</span>
          </div>
          <div className="flex items-center gap-2">
            {/* NEW Optimize button */}
            <button
              className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-600/60 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-200"
              onClick={optimizeLoadout}
              title="Automatically equip the best items by stats"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Optimize
            </button>
            <button
              className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-600/70 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200"
              onClick={unequipAll}
              title="Unequip everything"
            >
              <X className="w-3.5 h-3.5" />
              Unequip All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: 'repeat(4, minmax(72px, 1fr))' }}>
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
            />
          ))}
          <div className="rounded-xl border-2 border-dashed border-slate-700/70 bg-slate-900/10 flex items-center justify-center text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Drag here to auto-equip
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Inventory + Stats */}
      <div className="flex flex-col gap-4 h-full min-h-[420px]">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-600/70 bg-slate-800/60 text-slate-200 flex-1">
            <Search className="w-4 h-4 opacity-70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, material, description…"
              className="bg-transparent outline-none text-sm placeholder:text-slate-400 flex-1"
            />
            {query && (
              <button className="opacity-70 hover:opacity-100" onClick={() => setQuery('')}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value as any)}
                className="text-sm px-2.5 py-1.5 rounded-md border border-slate-600/70 bg-slate-800/60 text-slate-200 pr-7"
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
              <Filter className="w-4 h-4 absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm px-2.5 py-1.5 rounded-md border border-slate-600/70 bg-slate-800/60 text-slate-200 pr-7"
                title="Sort items"
              >
                <option value="rarity">Sort: Rarity</option>
                <option value="name">Sort: Name</option>
                <option value="value">Sort: Value</option>
              </select>
              <SortAsc className="w-4 h-4 absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Equippable list */}
        <div className="flex-1 min-h-0 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-300">Equippable Items</h4>
            <span className="text-xs text-slate-400">Click to auto-equip or drag to a slot</span>
          </div>
          <div className="h-[260px] lg:h-[320px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => {
                const handleDragStart = (e: React.DragEvent) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('item', JSON.stringify(item));
                };
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-900/50 hover:bg-slate-700/50 cursor-pointer border border-slate-700/60"
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
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 flex items-center justify-center">
                        <GenerativeItemIcon item={item} size={36} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {item.equipmentSlot && (
                            <span className="capitalize">{humanizeSlot(item.equipmentSlot as EquipmentSlot)}</span>
                          )}
                          {item.value !== undefined && <span className="text-yellow-400">{item.value} 🪙</span>}
                        </div>
                      </div>
                    </div>
                    <RarityTag rarity={item.rarity} />
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 italic py-10 text-sm">
                No equippable items match your filters.
              </p>
            )}
          </div>
        </div>

        <ItemStatsPanel character={character} comparisonStats={comparisonStats} />
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
