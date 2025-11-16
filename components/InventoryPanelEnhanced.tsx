import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Item, ItemQuality, PlayerCharacter } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { FaTh, FaList, FaSortAmountDown } from 'react-icons/fa';
import { loadTamedAnimals, TamedAnimal, updateAnimalName } from '../services/animalTamingService';
import AnimalCompanionModal from './AnimalCompanionModal';
import ButcherConfirmModal from './ButcherConfirmModal';
import { vesselService } from '../services/vesselService';

/**
 * Get rarity colors and effects
 */
const getRarityColors = (rarity: string) => {
  switch (rarity) {
    case 'Unique':
      return {
        primary: '#f59e0b', // amber-500
        light: '#fbbf24', // amber-400
        glow: 'rgba(245, 158, 11, 0.4)',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)'
      };
    case 'Ultra-rare':
      return {
        primary: '#a855f7', // purple-500
        light: '#c084fc', // purple-400
        glow: 'rgba(168, 85, 247, 0.4)',
        bg: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 0.3)'
      };
    case 'Rare':
      return {
        primary: '#3b82f6', // blue-500
        light: '#60a5fa', // blue-400
        glow: 'rgba(59, 130, 246, 0.4)',
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)'
      };
    case 'Uncommon':
      return {
        primary: '#10b981', // emerald-500
        light: '#34d399', // emerald-400
        glow: 'rgba(16, 185, 129, 0.4)',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.3)'
      };
    case 'Common':
      return {
        primary: '#64748b', // slate-500
        light: '#94a3b8', // slate-400
        glow: 'rgba(100, 116, 139, 0.2)',
        bg: 'rgba(100, 116, 139, 0.08)',
        border: 'rgba(100, 116, 139, 0.2)'
      };
    case 'Junk':
    default:
      return {
        primary: '#78716c', // stone-500
        light: '#a8a29e', // stone-400
        glow: 'rgba(120, 113, 108, 0.15)',
        bg: 'rgba(120, 113, 108, 0.05)',
        border: 'rgba(120, 113, 108, 0.15)'
      };
  }
};

/**
 * Get quality label and color
 */
const getQualityInfo = (quality?: ItemQuality) => {
  if (!quality || quality === 'standard') return null;

  switch (quality) {
    case 'excellent':
      return { label: 'Exceptional', color: '#a855f7' };
    case 'good':
      return { label: 'Quality', color: '#8b5cf6' };
    case 'poor':
      return { label: 'Poor', color: '#6b7280' };
    default:
      return null;
  }
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
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<TamedAnimal | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [animalRefresh, setAnimalRefresh] = useState(0);

  const inventory = playerCharacter.inventory || [];
  const tamedAnimals = useMemo(() => loadTamedAnimals(), [animalRefresh]);

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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

  if (inventory.length === 0 && tamedAnimals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <div className="text-6xl mb-3 opacity-20">🎒</div>
        <p className="text-base font-semibold mb-2" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
          Inventory is Empty
        </p>
        <p className="text-sm opacity-60 max-w-xs" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
          Forage, trade, or explore to discover items
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Enhanced Header with Controls */}
      <div className="flex-shrink-0 px-3 py-3 border-b" style={{
        borderColor: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.4)'
      }}>
        {/* Top row - Title and Count */}
        <div className="flex items-center justify-between mb-2.5">
          <h3
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
          >
            Inventory
          </h3>
          <div className="flex items-center gap-2">
            {/* Sort dropdown (only in list view) */}
            {viewMode === 'list' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs px-2 py-1 rounded-md transition-all duration-200 border-none outline-none"
                style={{
                  background: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.4)',
                  color: isDark ? '#94a3b8' : '#64748b'
                }}
              >
                <option value="name">Name</option>
                <option value="quantity">Quantity</option>
                <option value="rarity">Rarity</option>
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-md" style={{
              background: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(229, 231, 235, 0.4)'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-1.5 rounded transition-all duration-200"
                style={{
                  background: viewMode === 'grid'
                    ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                    : 'transparent',
                  color: viewMode === 'grid' ? '#10b981' : (isDark ? '#94a3b8' : '#64748b')
                }}
                title="Grid view"
              >
                <FaTh className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-1.5 rounded transition-all duration-200"
                style={{
                  background: viewMode === 'list'
                    ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                    : 'transparent',
                  color: viewMode === 'list' ? '#10b981' : (isDark ? '#94a3b8' : '#64748b')
                }}
                title="List view"
              >
                <FaList className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Item count */}
            <span
              className="text-xs font-mono font-semibold px-2 py-1 rounded-md"
              style={{
                background: isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(229, 231, 235, 0.4)',
                color: isDark ? '#94a3b8' : '#64748b'
              }}
            >
              {filteredInventory.length + filteredAnimals.length}
            </span>
          </div>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full px-3 py-1.5 text-xs rounded-lg transition-all duration-200 placeholder:opacity-60 border"
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.4)',
            color: isDark ? '#e2e8f0' : '#1e293b'
          }}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              No items found matching "{searchQuery}"
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-3 gap-2">
            {sortedInventory.map((item, idx) => {
              const colors = getRarityColors(item.rarity);
              const qualityInfo = getQualityInfo(item.quality);
              const isHighlighted = item.id === highlightedItemId;

              return (
                <div
                  key={item.id}
                  className="relative rounded-xl cursor-pointer group overflow-hidden transition-all duration-300 animate-cascade-in"
                  onClick={() => handleItemClick(item)}
                  draggable={isDraggable}
                  onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, item) : undefined}
                  title={`${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(15, 23, 42, 0.85) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(252, 250, 247, 0.99) 50%, rgba(249, 245, 235, 0.95) 100%)',
                    backdropFilter: 'blur(12px) saturate(110%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                    border: isHighlighted
                      ? `3px solid ${colors.light}`
                      : `2px solid ${colors.border}`,
                    boxShadow: isHighlighted
                      ? `0 0 32px ${colors.glow}, inset 0 0 24px rgba(255, 255, 255, 0.2)`
                      : `0 0 16px ${colors.glow}, 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)`,
                    animationDelay: `${idx * 50}ms`
                  }}
                >

                  {/* Rarity-colored hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, ${colors.glow} 0%, ${colors.bg} 30%, transparent 70%)`,
                      backdropFilter: 'blur(16px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(150%)'
                    }}
                  />

                  {/* Quantity Badge */}
                  {item.quantity > 1 && (
                    <div
                      className="absolute top-1 right-1 z-20 min-w-[1.15rem] h-[1.1rem] px-1 flex items-center justify-center rounded-xl text-[0.7rem] font-mono font-semibold shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.primary} 100%)`,
                        color: '#fff',
                        border: `1px solid ${colors.light}`,
                        boxShadow: `0 3px 8px ${colors.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 1px rgba(0, 0, 0, 0.2)`,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
                      }}
                    >
                      {item.quantity}
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 gap-2">
                    {/* Icon */}
                    <div className="flex items-center justify-center flex-1">
                      <div
                        className="group-hover:scale-110 transition-transform duration-300"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                        }}
                      >
                        <GenerativeItemIcon item={item} size={72} />
                      </div>
                    </div>

                    {/* Item Name */}
                    <div className="text-center w-full">
                      <p
                        className="text-[0.75rem] font-semibold leading-tight"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.1',
                          minHeight: '1.65rem',
                          color: isDark ? '#ffffff' : '#1e293b',
                          textTransform: 'capitalize'
                        }}
                      >
                        {qualityInfo && (
                          <span style={{ color: qualityInfo.color, textTransform: 'capitalize' }}>{qualityInfo.label} </span>
                        )}
                        {item.name.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Hover border glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `0 0 24px ${colors.glow}, inset 0 0 20px rgba(255, 255, 255, 0.4)`,
                      border: `2px solid ${colors.light}`
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-1.5">
            {sortedInventory.map((item, idx) => {
              const colors = getRarityColors(item.rarity);
              const qualityInfo = getQualityInfo(item.quality);
              const isHighlighted = item.id === highlightedItemId;

              // Convert hex to RGB for gradient
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16)
                } : { r: 100, g: 116, b: 139 };
              };

              const rgb = hexToRgb(colors.primary);

              return (
                <div
                  key={item.id}
                  className="rounded-lg p-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] group relative overflow-hidden"
                  onClick={() => handleItemClick(item)}
                  style={{
                    background: isDark
                      ? `linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) 0%, rgba(30, 41, 59, 0.95) 30%, rgba(51, 65, 85, 0.9) 100%)`
                      : `linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) 0%, rgba(255, 253, 248, 1) 30%, rgba(252, 248, 242, 0.98) 100%)`,
                    border: `2px solid ${colors.border}`,
                    boxShadow: isHighlighted
                      ? `0 0 20px ${colors.glow}, 0 2px 6px rgba(0, 0, 0, 0.2)`
                      : `0 0 12px ${colors.glow}, 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 0% 50%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 0%, transparent 60%)`
                    }}
                  />

                  <div className="relative z-10 flex items-center gap-2.5">
                    {/* Icon with glow */}
                    <div
                      className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                      }}
                    >
                      <GenerativeItemIcon item={item} size={56} />
                    </div>

                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h5
                          className="text-sm font-bold truncate"
                          style={{
                            color: isDark ? '#f1f5f9' : '#1e293b',
                            textTransform: 'capitalize'
                          }}
                        >
                          {qualityInfo && (
                            <span style={{ color: qualityInfo.color, textTransform: 'capitalize' }}>{qualityInfo.label} </span>
                          )}
                          {item.name.toLowerCase()}
                        </h5>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Quantity badge */}
                          {item.quantity > 1 && (
                            <span
                              className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                              style={{
                                background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.primary} 100%)`,
                                color: '#fff',
                                border: `1px solid ${colors.light}`,
                                boxShadow: `0 2px 6px ${colors.glow}`,
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
                              }}
                            >
                              ×{item.quantity}
                            </span>
                          )}
                          {/* Value badge */}
                          {item.value && (
                            <span
                              className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: isDark
                                  ? 'rgba(251, 191, 36, 0.2)'
                                  : 'rgba(251, 191, 36, 0.15)',
                                color: isDark ? '#fbbf24' : '#b45309',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                              }}
                            >
                              ${item.value}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description (truncated) */}
                      {item.description && (
                        <p
                          className="text-[0.7rem] leading-snug line-clamp-1"
                          style={{
                            color: isDark ? '#cbd5e1' : '#475569'
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      <style>{`
        @keyframes cascade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-cascade-in {
          animation: cascade-in 0.3s ease-out backwards;
        }
      `}</style>
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
