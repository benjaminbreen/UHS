import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Item, ItemQuality, PlayerCharacter } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { FaTh, FaList, FaSortAmountDown } from 'react-icons/fa';
import { loadTamedAnimals, TamedAnimal, updateAnimalName } from '../services/animalTamingService';
import AnimalCompanionModal from './AnimalCompanionModal';
import ButcherConfirmModal from './ButcherConfirmModal';
import { vesselService } from '../services/vesselService';
import { useIsDarkMode } from '../hooks/useIsMobile';

// PERFORMANCE: Pre-computed color maps for O(1) lookup instead of switch statements
const RARITY_COLORS_MAP: Record<string, { primary: string; light: string; glow: string; bg: string; border: string }> = {
  'Unique': {
    primary: '#f59e0b', // amber-500
    light: '#fbbf24', // amber-400
    glow: 'rgba(245, 158, 11, 0.4)',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  'Ultra-rare': {
    primary: '#a855f7', // purple-500
    light: '#c084fc', // purple-400
    glow: 'rgba(168, 85, 247, 0.4)',
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.3)'
  },
  'Rare': {
    primary: '#3b82f6', // blue-500
    light: '#60a5fa', // blue-400
    glow: 'rgba(59, 130, 246, 0.4)',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  'Uncommon': {
    primary: '#10b981', // emerald-500
    light: '#34d399', // emerald-400
    glow: 'rgba(16, 185, 129, 0.4)',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  'Common': {
    primary: '#64748b', // slate-500
    light: '#94a3b8', // slate-400
    glow: 'rgba(100, 116, 139, 0.2)',
    bg: 'rgba(100, 116, 139, 0.08)',
    border: 'rgba(100, 116, 139, 0.2)'
  },
  'Junk': {
    primary: '#78716c', // stone-500
    light: '#a8a29e', // stone-400
    glow: 'rgba(120, 113, 108, 0.15)',
    bg: 'rgba(120, 113, 108, 0.05)',
    border: 'rgba(120, 113, 108, 0.15)'
  }
};

const DEFAULT_RARITY_COLORS = RARITY_COLORS_MAP['Junk'];

/**
 * Get rarity colors and effects - O(1) lookup
 */
const getRarityColors = (rarity: string) => {
  return RARITY_COLORS_MAP[rarity] || DEFAULT_RARITY_COLORS;
};

// PERFORMANCE: Pre-computed quality info map
const QUALITY_INFO_MAP: Record<string, { label: string; color: string } | null> = {
  'excellent': { label: 'Exceptional', color: '#a855f7' },
  'good': { label: 'Quality', color: '#8b5cf6' },
  'poor': { label: 'Poor', color: '#6b7280' },
  'standard': null
};

/**
 * Get quality label and color - O(1) lookup
 */
const getQualityInfo = (quality?: ItemQuality) => {
  if (!quality) return null;
  return QUALITY_INFO_MAP[quality] ?? null;
};

interface InventoryPanelEnhancedProps {
  playerCharacter: PlayerCharacter;
  onItemClick?: (item: Item) => void;
  onInventoryUpdate?: () => void;
  highlightedItemId?: string | null;
  onCraft?: (items: Item[], method: 'COMBINE' | 'DISAGGREGATE') => void;
  onStudy?: (items: Item[]) => void;
  onEat?: (item: Item) => void;
  onDrop?: (item: Item) => void;
  deployVesselToMap?: (vesselItem: Item, playerX: number, playerY: number) => { success: boolean, vesselPosition?: { x: number, y: number } };
  deployBridgeToMap?: (bridgeItem: Item, playerX: number, playerY: number) => { success: boolean, bridgePosition?: { x: number, y: number } };
  playerX?: number | null;
  playerY?: number | null;
  setShipDockPosition?: (x: number | null, y: number | null) => void;
  setCurrentVessel?: (vessel: Item | null) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, item: Item) => void;
}

/**
 * InventoryPanelEnhanced - Beautiful inventory with grid/list views, rarity glows, and animations
 */
export default function InventoryPanelEnhanced({
  playerCharacter,
  onItemClick,
  onInventoryUpdate,
  highlightedItemId,
  onCraft,
  onStudy,
  onEat,
  onDrop,
  deployVesselToMap,
  deployBridgeToMap,
  playerX,
  playerY,
  setShipDockPosition,
  setCurrentVessel,
  isDraggable = false,
  onDragStart
}: InventoryPanelEnhancedProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'rarity'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = useIsDarkMode(); // Efficient hook replaces MutationObserver
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<TamedAnimal | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [animalRefresh, setAnimalRefresh] = useState(0);

  const inventory = playerCharacter.inventory || [];
  const tamedAnimals = useMemo(() => loadTamedAnimals(), [animalRefresh]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventory;
    const query = searchQuery.toLowerCase();
    return inventory.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [inventory, searchQuery]);

  // Filter animals
  const filteredAnimals = useMemo(() => {
    if (!searchQuery) return tamedAnimals;
    const query = searchQuery.toLowerCase();
    return tamedAnimals.filter(animal =>
      (animal.name || animal.speciesName).toLowerCase().includes(query) ||
      animal.speciesName.toLowerCase().includes(query)
    );
  }, [tamedAnimals, searchQuery]);

  // Sort inventory
  const sortedInventory = useMemo(() => {
    const sorted = [...filteredInventory];

    switch (sortBy) {
      case 'quantity':
        return sorted.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
      case 'rarity':
        const rarityOrder = { 'Unique': 6, 'Ultra-rare': 5, 'Rare': 4, 'Uncommon': 3, 'Common': 2, 'Junk': 1 };
        return sorted.sort((a, b) => {
          const aVal = rarityOrder[a.rarity as keyof typeof rarityOrder] || 0;
          const bVal = rarityOrder[b.rarity as keyof typeof rarityOrder] || 0;
          return bVal - aVal;
        });
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredInventory, sortBy]);

  // Action handlers
  const handleItemClick = useCallback((item: Item) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  }, []);

  const handleAnimalClick = useCallback((animal: TamedAnimal) => {
    setSelectedAnimal(animal);
    setIsAnimalModalOpen(true);
  }, []);

  const handleAnimalModalClose = () => {
    setIsAnimalModalOpen(false);
    setSelectedAnimal(null);
    setAnimalRefresh(prev => prev + 1);
  };

  const handleAnimalNameUpdate = (animalId: string, newName: string) => {
    updateAnimalName(animalId, newName);
    setAnimalRefresh(prev => prev + 1);
  };

  const handleItemModalClose = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };

  // Number of grid slots to show (always show at least this many for visual consistency)
  const GRID_SLOTS = 16;
  const emptySlots = Math.max(0, GRID_SLOTS - sortedInventory.length);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Clean Header */}
      <div className="flex-shrink-0 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Inventory</span>
            <span className="text-[10px] text-white/30">{filteredInventory.length} items</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}
              title="Grid view"
            >
              <FaTh className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}
              title="List view"
            >
              <FaList className="w-3 h-3" />
            </button>
            {viewMode === 'list' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="ml-1 text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60 outline-none"
              >
                <option value="name">Name</option>
                <option value="quantity">Qty</option>
                <option value="rarity">Rarity</option>
              </select>
            )}
          </div>
        </div>

        {/* Search - only show if we have items */}
        {inventory.length > 0 && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg bg-black/20 border border-white/5 text-white/80 placeholder:text-white/30 outline-none focus:border-white/20"
          />
        )}
      </div>

      <div className="h-px w-full bg-white/5" />

      {/* Content Area */}
      <div className="flex-1 min-h-0 p-2 overflow-y-auto">
        {searchQuery && filteredInventory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-white/40">No items matching "{searchQuery}"</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW with empty slots */
          <div className="grid grid-cols-4 gap-1.5">
            {/* Filled slots */}
            {sortedInventory.map((item, idx) => {
              const colors = getRarityColors(item.rarity);
              const qualityInfo = getQualityInfo(item.quality);
              const isHighlighted = item.id === highlightedItemId;

              return (
                <div
                  key={item.id}
                  className="relative rounded-lg cursor-pointer group overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => handleItemClick(item)}
                  draggable={isDraggable}
                  onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, item) : undefined}
                  title={`${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: isHighlighted
                      ? `2px solid ${colors.light}`
                      : `1px solid ${colors.border}`,
                    boxShadow: isHighlighted
                      ? `0 0 20px ${colors.glow}`
                      : 'none'
                  }}
                >
                  {/* Subtle rarity indicator line at top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: colors.primary, opacity: 0.6 }}
                  />

                  {/* Quantity Badge */}
                  {item.quantity > 1 && (
                    <div
                      className="absolute top-1 right-1 z-20 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded text-[9px] font-bold"
                      style={{
                        background: colors.primary,
                        color: '#fff'
                      }}
                    >
                      {item.quantity}
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-1">
                    <div className="group-hover:scale-105 transition-transform duration-200">
                      <GenerativeItemIcon item={item} size={44} />
                    </div>
                    <p
                      className="text-[9px] text-center text-white/70 mt-1 leading-tight line-clamp-2"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {item.name.toLowerCase()}
                    </p>
                  </div>

                  {/* Hover highlight */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-white/5" />
                </div>
              );
            })}

            {/* Empty slots to fill the grid */}
            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="rounded-lg"
                style={{
                  aspectRatio: '1 / 1',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px dashed rgba(255, 255, 255, 0.06)'
                }}
              />
            ))}
          </div>
        ) : (
          /* LIST VIEW - cleaner */
          <div className="space-y-1">
            {sortedInventory.map((item) => {
              const colors = getRarityColors(item.rarity);
              const isHighlighted = item.id === highlightedItemId;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-white/5 group"
                  onClick={() => handleItemClick(item)}
                  style={{
                    background: isHighlighted ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    borderLeft: `2px solid ${colors.primary}`
                  }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 group-hover:scale-105 transition-transform">
                    <GenerativeItemIcon item={item} size={36} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/80 truncate capitalize">
                        {item.name.toLowerCase()}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: colors.primary, color: '#fff' }}>
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-white/40 truncate">{item.description}</p>
                    )}
                  </div>

                  {/* Value */}
                  {item.value !== undefined && (
                    <span className="text-[10px] text-amber-400/70 font-medium">{item.value}c</span>
                  )}
                </div>
              );
            })}

            {/* Empty state for list view */}
            {sortedInventory.length === 0 && !searchQuery && (
              <div className="text-center py-8">
                <p className="text-xs text-white/30">Empty inventory</p>
                <p className="text-[10px] text-white/20 mt-1">Explore to find items</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animal Companion Modal */}
      {selectedAnimal && (
        <AnimalCompanionModal
          animal={selectedAnimal}
          isOpen={isAnimalModalOpen}
          onClose={handleAnimalModalClose}
          onUpdateName={handleAnimalNameUpdate}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && isItemModalOpen && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={isItemModalOpen}
          onClose={handleItemModalClose}
          onCraft={onCraft ? (item) => {
            onCraft([item], 'COMBINE');
            handleItemModalClose();
          } : undefined}
          onEat={onEat ? (item) => {
            onEat(item);
            handleItemModalClose();
          } : undefined}
          onStudy={onStudy ? (item) => {
            onStudy([item]);
            handleItemModalClose();
          } : undefined}
          onDeployVessel={
            deployVesselToMap && playerX !== null && playerY !== null && selectedItem.category === 'Vessel'
              ? () => {
                  const vesselServiceSuccess = vesselService.deployVessel(selectedItem, playerCharacter);
                  if (vesselServiceSuccess && deployVesselToMap) {
                    const deployResult = deployVesselToMap(selectedItem, playerX, playerY);
                    if (deployResult.success && deployResult.vesselPosition) {
                      setShipDockPosition?.(deployResult.vesselPosition.x, deployResult.vesselPosition.y);
                      setCurrentVessel?.(selectedItem);
                      alert(`${selectedItem.name} deployed on the map! Walk onto it to embark.`);
                    } else {
                      alert(`${selectedItem.name} was removed from inventory but couldn't be placed on the map.`);
                    }
                  }
                  onInventoryUpdate?.();
                  handleItemModalClose();
                }
              : undefined
          }
          onDeployBridge={
            deployBridgeToMap && playerX !== null && playerY !== null &&
            selectedItem.name?.toLowerCase().includes('bridge')
              ? () => {
                  if (deployBridgeToMap) {
                    const deployResult = deployBridgeToMap(selectedItem, playerX, playerY);
                    if (deployResult.success) {
                      alert(`${selectedItem.name} built! You can now cross the water at that location.`);
                    } else {
                      alert(`Cannot place bridge here. Need a single water tile with land on opposite sides within 3 tiles.`);
                    }
                  }
                  onInventoryUpdate?.();
                  handleItemModalClose();
                }
              : undefined
          }
          onDrop={onDrop}
          isDark={isDark}
        />
      )}

    </div>
  );
}

/**
 * ItemDetailModal - Beautiful modal showing all item details and actions
 */
interface ItemDetailModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onCraft?: (item: Item) => void;
  onEat?: (item: Item) => void;
  onStudy?: (item: Item) => void;
  onDrop?: (item: Item) => void;
  onDeployVessel?: () => void;
  onDeployBridge?: () => void;
  isDark: boolean;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onCraft,
  onEat,
  onStudy,
  onDrop,
  onDeployVessel,
  onDeployBridge,
  isDark
}) => {
  if (!isOpen) return null;

  const colors = getRarityColors(item.rarity);
  const qualityInfo = getQualityInfo(item.quality);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)',
          border: `2px solid ${colors.primary}`,
          boxShadow: `0 0 60px ${colors.glow}`,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Rarity Glow */}
        <div
          className="relative p-6 pb-4"
          style={{
            background: `linear-gradient(135deg, ${colors.bg} 0%, transparent 100%)`,
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full transition-all duration-200 hover:scale-110"
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(229, 231, 235, 0.8)',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '24px',
              lineHeight: '1',
              fontWeight: 'bold',
              padding: 0,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ×
          </button>

          {/* Icon and Name */}
          <div className="flex items-start gap-6">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '140px',
                height: '140px',
                filter: isDark
                  ? 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.4)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))'
                  : 'drop-shadow(0 0 16px rgba(0, 0, 0, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))'
              }}
            >
              <GenerativeItemIcon item={item} size={140} />
            </div>

            <div className="flex-1 min-w-0">
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  textTransform: 'capitalize'
                }}
              >
                {qualityInfo && (
                  <span style={{ color: qualityInfo.color, textTransform: 'capitalize' }}>{qualityInfo.label} </span>
                )}
                {item.name.toLowerCase()}
              </h2>

              {/* Rarity and Quality Badges */}
              <div className="flex items-center gap-2 mb-3">
                {item.rarity && (
                  <span
                    className="px-3 py-1 text-xs font-bold rounded-full"
                    style={{
                      background: colors.primary,
                      color: '#fff',
                      boxShadow: `0 2px 8px ${colors.glow}`
                    }}
                  >
                    {item.rarity.toUpperCase()}
                  </span>
                )}
                {item.category && (
                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{
                      background: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(229, 231, 235, 0.7)',
                      color: isDark ? '#cbd5e1' : '#475569'
                    }}
                  >
                    {item.category}
                  </span>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? '#cbd5e1' : '#475569' }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {item.value !== undefined && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Value
              </div>
              <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>
                {item.value} 🪙
              </div>
            </div>
          )}

          {item.weight !== undefined && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Weight
              </div>
              <div className="text-lg font-bold" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {item.weight} kg
              </div>
            </div>
          )}

          {item.quantity > 1 && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Quantity
              </div>
              <div className="text-lg font-bold" style={{ color: colors.primary }}>
                {item.quantity}
              </div>
            </div>
          )}

          {item.attack !== undefined && item.attack > 0 && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Attack
              </div>
              <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
                +{item.attack}
              </div>
            </div>
          )}

          {item.defense !== undefined && item.defense > 0 && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Defense
              </div>
              <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>
                +{item.defense}
              </div>
            </div>
          )}

          {item.condition !== undefined && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Condition
              </div>
              <div
                className="text-lg font-bold"
                style={{
                  color:
                    item.condition > 80 ? '#10b981' :
                    item.condition > 50 ? '#fbbf24' :
                    item.condition > 20 ? '#f59e0b' : '#ef4444'
                }}
              >
                {item.condition}%
              </div>
            </div>
          )}

          {item.material && (
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Material
              </div>
              <div className="text-lg font-semibold" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {item.material}
              </div>
            </div>
          )}

          {item.crafterName && (
            <div className="col-span-2">
              <div
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Crafted By
              </div>
              <div className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                {item.crafterName}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          {onCraft && (
            <button
              onClick={() => onCraft(item)}
              className="flex-1 px-5 py-4 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: '#10b981',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Craft
            </button>
          )}

          {onDrop && (
            <button
              onClick={() => {
                onDrop(item);
                setIsItemModalOpen(false);
              }}
              className="flex-1 px-5 py-4 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: '#ef4444',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Drop
            </button>
          )}

          {onEat && item.category === 'Food' && (
            <button
              onClick={() => onEat(item)}
              className="flex-1 px-5 py-4 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: '#f59e0b',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Eat
            </button>
          )}

          {onStudy && (
            <button
              onClick={() => onStudy(item)}
              className="flex-1 px-5 py-4 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: '#8b5cf6',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Study
            </button>
          )}

          {onDeployVessel && (
            <button
              onClick={onDeployVessel}
              className="flex-1 px-5 py-4 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: '#3b82f6',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Deploy Vessel
            </button>
          )}

          {onDeployBridge && (
            <button
              onClick={onDeployBridge}
              className="flex-1 px-5 py-4 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105"
              style={{
                background: '#06b6d4',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Deploy Bridge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
