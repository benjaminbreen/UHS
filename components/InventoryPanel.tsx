import React, { useState, useMemo } from 'react';
import { Item, ItemQuality, PlayerCharacter } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { loadTamedAnimals, TamedAnimal, updateAnimalName } from '../services/animalTamingService';
import AnimalCompanionModal from './AnimalCompanionModal';
import { vesselService } from '../services/vesselService';

// Enhanced tooltip component
const ItemTooltip: React.FC<{ 
    item: Item | null;
    position: { x: number; y: number };
}> = ({ item, position }) => {
    if (!item) return null;
    
    // Calculate position to be next to cursor
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 10;
    
    let finalX = position.x + 15;
    let finalY = position.y - 10;
    
    // Adjust if tooltip would go off right edge
    if (finalX + tooltipWidth > window.innerWidth - padding) {
        finalX = position.x - tooltipWidth - 15;
    }
    
    // Adjust if tooltip would go off bottom edge
    if (finalY + tooltipHeight > window.innerHeight - padding) {
        finalY = position.y - tooltipHeight + 10;
    }
    
    // Adjust if tooltip would go off top edge
    if (finalY < padding) {
        finalY = padding;
    }
    
    return (
        <div 
            className="fixed z-[9999] pointer-events-none p-4 w-80 text-xs text-white transition-opacity duration-100 bg-slate-900/95 border-2 rounded-lg shadow-2xl border-blue-400 backdrop-blur-sm animate-popIn"
            style={{ 
                top: finalY, 
                left: finalX,
                transform: 'translateZ(0)'
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                {/* Large icon */}
                <div className="w-16 h-16 flex items-center justify-center bg-slate-800/50 rounded-lg border border-slate-600">
                    <GenerativeItemIcon item={item} size={64} />
                </div>
                
                {/* Item name and rarity */}
                <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    {item.rarity && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.rarity === 'Common' ? 'bg-slate-600 text-slate-200' :
                            item.rarity === 'Uncommon' ? 'bg-green-600 text-green-100' :
                            item.rarity === 'Rare' ? 'bg-blue-600 text-blue-100' :
                            item.rarity === 'Ultra-rare' ? 'bg-purple-600 text-purple-100' :
                            item.rarity === 'Unique' ? 'bg-amber-500 text-amber-100' :
                            'bg-gray-500 text-gray-200'
                        }`}>
                            {item.rarity.toUpperCase()}
                        </span>
                    )}
                    {item.quality && (
                        <span className={`inline-block mt-1 ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.quality === 'excellent' ? 'bg-purple-600 text-purple-100' :
                            item.quality === 'good' ? 'bg-blue-600 text-blue-100' :
                            item.quality === 'standard' ? 'bg-gray-600 text-gray-200' :
                            item.quality === 'poor' ? 'bg-orange-600 text-orange-100' :
                            'bg-gray-500 text-gray-200'
                        }`}>
                            {item.quality.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Item properties */}
            <div className="grid grid-cols-2 gap-2 mb-2 text-[11px] text-slate-300">
                {item.equipmentSlot && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Slot:</span>
                        <span className="capitalize">{item.equipmentSlot.replace('_', ' ')}</span>
                    </div>
                )}
                {(() => {
                    // Extract color from item name if present
                    const colorWords = ['navy', 'blue', 'royal', 'red', 'crimson', 'green', 'forest', 'yellow', 'gold', 
                                       'purple', 'orange', 'brown', 'black', 'white', 'silver', 'gray', 'grey',
                                       'teal', 'turquoise', 'coral', 'tan', 'ivory', 'amber', 'bronze', 'copper'];
                    
                    // Materials that are their own color - don't need color prefix
                    const materialColors = ['leather', 'hide', 'fur', 'straw', 'iron', 'steel', 'bronze', 'copper', 
                                           'brass', 'gold', 'silver', 'wood', 'oak', 'pine', 'bamboo'];
                    
                    // Check if item has a material that is its own color
                    const material = (item.material || '').toLowerCase();
                    const hasMaterialColor = materialColors.some(mat => material.includes(mat));
                    
                    if (!hasMaterialColor) {
                        // Look for color in the name
                        const nameLower = item.name.toLowerCase();
                        for (const color of colorWords) {
                            if (nameLower.includes(color)) {
                                // Extract the color word with proper capitalization
                                const colorIndex = nameLower.indexOf(color);
                                const extractedColor = item.name.substring(colorIndex, colorIndex + color.length);
                                return (
                                    <div className="flex items-center gap-1">
                                        <span className="text-slate-500">Color:</span>
                                        <span className="capitalize">{extractedColor}</span>
                                    </div>
                                );
                            }
                        }
                    }
                    return null;
                })()}
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
                {item.stackable && item.quantity > 1 && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Quantity:</span>
                        <span className="text-blue-400">{item.quantity}</span>
                    </div>
                )}
                {item.throwable && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Throwable:</span>
                        <span className="text-green-400">✓</span>
                    </div>
                )}
                {item.wearable && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Wearable:</span>
                        <span className="text-green-400">✓</span>
                    </div>
                )}
                {item.attack !== undefined && item.attack > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Attack:</span>
                        <span className="text-red-400">+{item.attack}</span>
                    </div>
                )}
                {item.defense !== undefined && item.defense > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Defense:</span>
                        <span className="text-blue-400">+{item.defense}</span>
                    </div>
                )}
            </div>
            
            {/* Description */}
            {item.description && (
                <p className="text-[11px] text-slate-400 italic border-t border-slate-700 pt-2">
                    {item.description}
                </p>
            )}
        </div>
    );
};

interface InventoryPanelProps {
    inventory: Item[];
    playerCharacter: PlayerCharacter;
    onCraft: (items: Item[], method: 'COMBINE' | 'DISAGGREGATE') => void;
    onInventoryUpdate?: () => void; // Callback to refresh inventory after vessel deployment
    deployVesselToMap?: (vesselItem: Item, playerX: number, playerY: number) => { success: boolean, vesselPosition?: { x: number, y: number } };
    playerX?: number | null;
    playerY?: number | null;
    setShipDockPosition?: (x: number | null, y: number | null) => void;
    setCurrentVessel?: (vessel: Item | null) => void;
    isDraggable?: boolean; // Only enable drag in Equipment tab
    onDragStart?: (e: React.DragEvent, item: Item) => void; // Custom drag handler
}

// Helper function to get quality color
const getQualityColor = (quality?: ItemQuality): string => {
    switch (quality) {
        case 'excellent':
            return 'text-purple-400 border-purple-400/50 bg-purple-900/20';
        case 'good':
            return 'text-blue-400 border-blue-400/50 bg-blue-900/20';
        case 'standard':
            return 'text-gray-400 border-gray-400/50 bg-gray-900/20';
        case 'poor':
            return 'text-orange-400 border-orange-400/50 bg-orange-900/20';
        default:
            return '';
    }
};

// Helper to get quality label
const getQualityLabel = (quality?: ItemQuality): string => {
    switch (quality) {
        case 'excellent':
            return '★★★';
        case 'good':
            return '★★';
        case 'standard':
            return '★';
        case 'poor':
            return '◇';
        default:
            return '';
    }
};

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, playerCharacter, onCraft, onInventoryUpdate, deployVesselToMap, playerX, playerY, setShipDockPosition, setCurrentVessel, isDraggable = false, onDragStart }) => {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedAnimal, setSelectedAnimal] = useState<TamedAnimal | null>(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  
  // Load tamed animals with forced refresh when modal closes
  const [animalRefresh, setAnimalRefresh] = useState(0);
  const tamedAnimals = useMemo(() => loadTamedAnimals(), [animalRefresh]);

  const handleItemClick = (item: Item) => {
      // Only use the selection system for crafting
      setSelectedItemIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
              newSet.delete(item.id);
          } else {
              newSet.add(item.id);
          }
          return newSet;
      });
  };
  
  
  const handleCraft = (method: 'COMBINE' | 'DISAGGREGATE') => {
      const selectedItems = inventory.filter(item => selectedItemIds.has(item.id));
      onCraft(selectedItems, method);
      setSelectedItemIds(new Set());
  };

  const canCombine = selectedItemIds.size >= 2;
  const canDisaggregate = selectedItemIds.size === 1;
  
  // Check if selected items contain vessels for deployment
  const selectedItems = inventory.filter(item => selectedItemIds.has(item.id));
  const hasSelectedVessels = selectedItems.some(item => item.category === 'Vessel');
  const canDeploy = selectedItemIds.size === 1 && hasSelectedVessels;

  const handleAnimalClick = (animal: TamedAnimal) => {
    setSelectedAnimal(animal);
    setIsAnimalModalOpen(true);
  };

  const handleAnimalModalClose = () => {
    setIsAnimalModalOpen(false);
    setSelectedAnimal(null);
    setAnimalRefresh(prev => prev + 1); // Force refresh to show name changes
  };

  const handleAnimalNameUpdate = (animalId: string, newName: string) => {
    updateAnimalName(animalId, newName);
    setAnimalRefresh(prev => prev + 1); // Force refresh
  };

  const handleVesselDeploy = () => {
    const selectedItems = inventory.filter(item => selectedItemIds.has(item.id));
    const vessels = selectedItems.filter(item => item.category === 'Vessel');
    
    if (vessels.length === 0) {
      alert('No vessels selected for deployment!');
      return;
    }
    
    if (vessels.length > 1) {
      alert('You can only deploy one vessel at a time.');
      return;
    }
    
    const vessel = vessels[0];
    
    // First, deploy to vesselService for the UI registry
    const vesselServiceSuccess = vesselService.deployVessel(vessel, playerCharacter);
    
    if (!vesselServiceSuccess) {
      alert(`Failed to deploy ${vessel.name}.`);
      return;
    }
    
    // Then, if deployVesselToMap is available, deploy to the actual map
    if (deployVesselToMap && playerX !== null && playerY !== null) {
      const deployResult = deployVesselToMap(vessel, playerX, playerY);
      if (deployResult.success && deployResult.vesselPosition) {
        // Set the vessel position as the ship dock location
        if (setShipDockPosition) {
          setShipDockPosition(deployResult.vesselPosition.x, deployResult.vesselPosition.y);
        }
        
        // Store the vessel information for when player embarks
        if (setCurrentVessel) {
          setCurrentVessel(vessel);
        }
        
        setSelectedItemIds(new Set());
        onInventoryUpdate?.();
        alert(`${vessel.name} deployed on the map! Walk onto it to embark.`);
      } else {
        // If map deployment failed, we should add the vessel back to inventory
        // For now, just show an error
        alert(`${vessel.name} was removed from inventory but couldn't be placed on the map. No suitable water found nearby.`);
      }
    } else {
      // Fallback for when map deployment is not available
      setSelectedItemIds(new Set());
      onInventoryUpdate?.();
      alert(`${vessel.name} deployed! You can now use it for sea travel.`);
    }
  };

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-slate-800/60 border border-slate-600/50 rounded-xl">
        <div className="mb-4 text-6xl opacity-50">🎒</div>
        <p className="mb-2 text-lg font-semibold">Inventory is Empty</p>
        <p className="text-sm opacity-75 text-center max-w-xs">Forage, trade, or explore to discover items and equipment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-800/60 border border-slate-600/50 rounded-xl shadow-lg">
    
      <div className="flex-1 min-h-0 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
        <div className="space-y-2">
          {/* Animal Companions Section */}
          {tamedAnimals.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold tracking-wide text-amber-400 border-b border-amber-400/30 mb-2">
                ANIMAL COMPANIONS
              </div>
              {tamedAnimals.map(animal => (
                <div 
                  key={`animal-${animal.id}`}
                  className="flex items-center gap-2 p-2 bg-amber-900/20 border border-amber-600/30 rounded-lg cursor-pointer hover:bg-amber-900/30 hover:border-amber-500/50 transition-all"
                  onClick={() => handleAnimalClick(animal)}
                  title="Click to view companion details"
                >
                  <div className="text-sm flex-shrink-0">{animal.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-amber-200 text-sm truncate">
                      {animal.name || animal.speciesName}
                    </p>
                    <p className="text-xs text-amber-300/70">Loyalty: {animal.loyalty}% • Value: {animal.value} coins</p>
                  </div>
                </div>
              ))}
              <div className="px-2 py-1 text-xs font-semibold tracking-wide  text-gray-400 border-b border-gray-600/30 mb-2 mt-3">
                ITEMS
              </div>
            </>
          )}
          {inventory.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center gap-2 p-2 transition-all duration-200 border rounded-lg cursor-pointer group hover:bg-slate-700/70
              ${selectedItemIds.has(item.id) ? 'bg-blue-800/50 border-blue-500 ring-1 ring-blue-400/50' : 'bg-slate-700/50 border-slate-600/30'}`}
              onClick={() => handleItemClick(item)}
              draggable={isDraggable}
              onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, item) : undefined}
              title={isDraggable ? "Drag to equipment slot or click to select" : "Click to select for crafting"}
            >
              <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                <GenerativeItemIcon item={item} size={32} />
                {item.stackable && item.quantity > 1 && (
                  <span className="absolute flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-600 rounded-full -bottom-1 -right-1 shadow-lg ring-1 ring-slate-800">
                    {item.quantity}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-200 transition-colors duration-150 truncate group-hover:text-white text-sm">
                    {item.name}
                  </p>
                  {item.quality && (
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-md border ${getQualityColor(item.quality)}`}>
                      {getQualityLabel(item.quality)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400 line-clamp-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 p-2 border-t border-slate-600/50 bg-slate-800/80 flex gap-1">
          {canDeploy ? (
            <button
                onClick={handleVesselDeploy}
                className="ff-action-button flex-1 text-xs px-2 py-1 bg-blue-600/80 hover:bg-blue-700 border-blue-500"
                title="Deploy vessel for sea travel"
            >
                🚤 Deploy Vessel
            </button>
          ) : (
            <>
              <button
                  onClick={() => handleCraft('COMBINE')}
                  disabled={!canCombine}
                  className="ff-action-button flex-1 text-xs px-2 py-1"
                  title="Combine 2 or more selected items"
              >
                  Combine
              </button>
              <button
                  onClick={() => handleCraft('DISAGGREGATE')}
                  disabled={!canDisaggregate}
                  className="ff-action-button flex-1 text-xs px-2 py-1"
                  title="Break down 1 selected item"
              >
                  Disaggregate
              </button>
            </>
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
    </div>
  );
};

export default InventoryPanel;
