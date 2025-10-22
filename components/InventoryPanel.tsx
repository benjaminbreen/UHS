import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Item, ItemQuality, PlayerCharacter } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { loadTamedAnimals, TamedAnimal, updateAnimalName } from '../services/animalTamingService';
import AnimalCompanionModal from './AnimalCompanionModal';
import ButcherConfirmModal from './ButcherConfirmModal';
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
                    <p className={`font-semibold text-sm ${
                        item.quality === 'excellent' ? 'text-yellow-300' :
                        item.quality === 'good' ? 'text-blue-300' :
                        item.quality === 'poor' ? 'text-orange-400' :
                        'text-white'
                    }`}>
                        {item.quality === 'excellent' && '✨ '}
                        {item.name}
                        {item.quality === 'excellent' && ' ✨'}
                    </p>
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
                        <span className={`inline-block mt-1 ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            item.quality === 'excellent' ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-yellow-100 border-yellow-400 shadow-md shadow-yellow-500/30' :
                            item.quality === 'good' ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-blue-100 border-blue-400' :
                            item.quality === 'standard' ? 'bg-gray-600 text-gray-200 border-gray-500' :
                            item.quality === 'poor' ? 'bg-gradient-to-r from-orange-700 to-red-700 text-orange-100 border-orange-500' :
                            'bg-gray-500 text-gray-200 border-gray-400'
                        }`}>
                            {item.quality === 'excellent' ? '★ EXCELLENT ★' :
                             item.quality === 'good' ? '◆ GOOD ◆' :
                             item.quality === 'poor' ? '▼ POOR ▼' :
                             item.quality ? item.quality.toUpperCase() : ''}
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
                {item.condition !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Condition:</span>
                        <span className={`${
                            item.condition > 80 ? 'text-green-400' :
                            item.condition > 50 ? 'text-yellow-400' :
                            item.condition > 20 ? 'text-orange-400' :
                            'text-red-400'
                        }`}>
                            {item.condition}%
                            {item.condition < 20 && ' ⚠️'}
                        </span>
                    </div>
                )}
                {item.age !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Age:</span>
                        <span className={`${
                            item.age > 100 ? 'text-purple-400' :
                            item.age > 50 ? 'text-blue-400' :
                            item.age > 10 ? 'text-gray-400' :
                            'text-white'
                        }`}>
                            {item.age > 100 ? `Ancient (${item.age} years)` :
                             item.age > 50 ? `Old (${item.age} years)` :
                             item.age > 10 ? `${item.age} years` :
                             'New'}
                        </span>
                    </div>
                )}
                {item.crafterName && (
                    <div className="flex items-center gap-1 col-span-2">
                        <span className="text-slate-500">Crafted by:</span>
                        <span className="text-amber-400 font-semibold">{item.crafterName}</span>
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
    onStudy?: (items: Item[]) => void; // New prop for study functionality
    onEat?: (item: Item) => void; // New prop for eating functionality
    onInventoryUpdate?: () => void; // Callback to refresh inventory after vessel deployment
    deployVesselToMap?: (vesselItem: Item, playerX: number, playerY: number) => { success: boolean, vesselPosition?: { x: number, y: number } };
    deployBridgeToMap?: (bridgeItem: Item, playerX: number, playerY: number) => { success: boolean, bridgePosition?: { x: number, y: number } };
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

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, playerCharacter, onCraft, onStudy, onEat, onInventoryUpdate, deployVesselToMap, deployBridgeToMap, playerX, playerY, setShipDockPosition, setCurrentVessel, isDraggable = false, onDragStart }) => {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<Set<string>>(new Set());
  const [selectedAnimal, setSelectedAnimal] = useState<TamedAnimal | null>(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [showButcherModal, setShowButcherModal] = useState(false);
  const [animalsToButcher, setAnimalsToButcher] = useState<TamedAnimal[]>([]);

  // Search functionality with debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimerRef = useRef<NodeJS.Timeout>();
  
  // Load tamed animals with forced refresh when modal closes
  const [animalRefresh, setAnimalRefresh] = useState(0);
  const tamedAnimals = useMemo(() => loadTamedAnimals(), [animalRefresh]);

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Memoize filtered inventory to avoid recalculation on every render
  const filteredInventory = useMemo(() => {
    if (!debouncedSearchQuery) return inventory;

    const query = debouncedSearchQuery.toLowerCase();
    return inventory.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.material?.toLowerCase().includes(query)
    );
  }, [inventory, debouncedSearchQuery]);

  // Memoize filtered animals
  const filteredAnimals = useMemo(() => {
    if (!debouncedSearchQuery) return tamedAnimals;

    const query = debouncedSearchQuery.toLowerCase();
    return tamedAnimals.filter(animal =>
      (animal.name || animal.speciesName).toLowerCase().includes(query) ||
      animal.speciesName.toLowerCase().includes(query)
    );
  }, [tamedAnimals, debouncedSearchQuery]);

  // Memoize selected items to avoid re-filtering on every render
  const selectedItems = useMemo(() =>
    inventory.filter(item => selectedItemIds.has(item.id)),
    [inventory, selectedItemIds]
  );

  // Memoize selected animals
  const selectedAnimals = useMemo(() =>
    tamedAnimals.filter(animal => selectedAnimalIds.has(animal.id)),
    [tamedAnimals, selectedAnimalIds]
  );

  const handleItemClick = useCallback((item: Item) => {
      // Always allow selection for crafting
      setSelectedItemIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
              newSet.delete(item.id);
          } else {
              newSet.add(item.id);
          }
          return newSet;
      });
  }, []);
  
  
  const handleCraft = useCallback(() => {
      if (selectedItems.length > 0) {
          // Open crafting modal with selected items
          onCraft(selectedItems, 'COMBINE'); // Pass COMBINE as default, modal will handle mode selection
          setSelectedItemIds(new Set());
      }
  }, [selectedItems, onCraft]);

  const handleStudy = useCallback(() => {

      // Combine selected items and animals for study
      const allSelectedForStudy = [...selectedItems, ...selectedAnimals];

      if (allSelectedForStudy.length > 0 && onStudy) {
          onStudy(allSelectedForStudy);
          setSelectedItemIds(new Set());
          setSelectedAnimalIds(new Set());
      }
  }, [selectedItems, selectedAnimals, onStudy]);

  const handleEat = useCallback(() => {
      if (selectedItemIds.size === 1 && onEat) {
          const item = selectedItems[0];
          onEat(item);
          setSelectedItemIds(new Set());
      }
  }, [selectedItems, selectedItemIds.size, onEat]);

  const handleButcher = useCallback(() => {
      // Handle animal butchering into meat items
      if (selectedAnimalIds.size > 0) {

          // Check if any selected animals are companions (high loyalty or custom names)
          const companionAnimals = selectedAnimals.filter(animal =>
              animal.loyalty >= 70 || (animal.name && animal.name !== animal.speciesName)
          );

          if (companionAnimals.length > 0) {
              // Show confirmation modal for companions
              setAnimalsToButcher(selectedAnimals);
              setShowButcherModal(true);
              return; // Exit early, modal will handle the actual butchering
          }

          // Execute butchering for non-companion animals
          executeButchering(selectedAnimals);
      }
  }, [selectedAnimals, showButcherModal, setAnimalsToButcher, setShowButcherModal]);

  const getMeatNameForAnimal = (species: string): string => {
      const lowerSpecies = species.toLowerCase();
      if (lowerSpecies.includes('cow') || lowerSpecies.includes('cattle')) return 'Beef';
      if (lowerSpecies.includes('pig') || lowerSpecies.includes('swine')) return 'Pork';
      if (lowerSpecies.includes('chicken') || lowerSpecies.includes('hen')) return 'Poultry';
      if (lowerSpecies.includes('sheep') || lowerSpecies.includes('lamb')) return 'Mutton';
      if (lowerSpecies.includes('goat')) return 'Goat Meat';
      if (lowerSpecies.includes('deer') || lowerSpecies.includes('elk')) return 'Venison';
      if (lowerSpecies.includes('rabbit') || lowerSpecies.includes('hare')) return 'Rabbit Meat';
      return 'Meat';
  };
  
  const getMeatQuantityForAnimal = (species: string): number => {
      const lowerSpecies = species.toLowerCase();
      if (lowerSpecies.includes('cow') || lowerSpecies.includes('cattle')) return 8;
      if (lowerSpecies.includes('pig') || lowerSpecies.includes('swine')) return 6;
      if (lowerSpecies.includes('sheep') || lowerSpecies.includes('goat')) return 4;
      if (lowerSpecies.includes('deer') || lowerSpecies.includes('elk')) return 5;
      if (lowerSpecies.includes('chicken') || lowerSpecies.includes('hen')) return 2;
      if (lowerSpecies.includes('rabbit') || lowerSpecies.includes('hare')) return 2;
      return 3;
  };

  const canCraft = selectedItemIds.size >= 1;
  const canStudy = selectedItemIds.size >= 1 || selectedAnimalIds.size >= 1;
  const canEat = selectedItemIds.size === 1 && selectedAnimalIds.size === 0;
  const canButcher = selectedAnimalIds.size === 1;
  const showInfoInsteadOfCraft = selectedAnimalIds.size >= 1 && selectedItemIds.size === 0; // Only animals selected
  // Memoize vessel check
  const hasSelectedVessels = useMemo(() =>
    selectedItems.some(item => item.category === 'Vessel'),
    [selectedItems]
  );
  const canDeploy = selectedItemIds.size === 1 && hasSelectedVessels;
  const canDeployBridge = selectedItemIds.size === 1 && selectedItems.some(item =>
    item.category === 'Bridge' ||
    (item.name?.toLowerCase().includes('bridge') &&
     (item.name?.toLowerCase().includes('log') || item.name?.toLowerCase().includes('rope')))
  );

  const handleAnimalClick = useCallback((animal: TamedAnimal) => {
    setSelectedAnimal(animal);
    setIsAnimalModalOpen(true);
  }, []);

  const handleAnimalSelect = useCallback((animalId: string) => {
    setSelectedAnimalIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(animalId)) {
        newSet.delete(animalId);
      } else {
        newSet.add(animalId);
      }
      return newSet;
    });
  }, []);

  const stopPropagation = useCallback((e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
  }, []);

  const noopHandler = useCallback(() => {}, []);

  const handleAnimalInfo = () => {
    if (selectedAnimalIds.size === 1) {
      const animalId = Array.from(selectedAnimalIds)[0];
      const animal = tamedAnimals.find(a => a.id === animalId);
      if (animal) {
        handleAnimalClick(animal);
      }
    }
  };

  const executeButchering = (animalsToProcess: TamedAnimal[]) => {
    animalsToProcess.forEach(animal => {
      // Create meat items based on animal type
      const meatItems: Item[] = [];
      const meatName = getMeatNameForAnimal(animal.speciesName);
      const meatQuantity = getMeatQuantityForAnimal(animal.speciesName);

      for (let i = 0; i < meatQuantity; i++) {
        meatItems.push({
          id: `${meatName}-${Date.now()}-${i}`,
          baseId: meatName.toUpperCase().replace(' ', '_'),
          name: meatName,
          description: `Fresh meat from a ${animal.speciesName}`,
          emoji: '🥩',
          rarity: 'Common' as const,
          value: Math.floor(animal.value / meatQuantity),
          weight: 2,
          wearable: false,
          stackable: true,
          quantity: 1,
          sustenance: 10,
          category: 'Food',
          material: 'Organic'
        });
      }

      // Add meat items to inventory
      const currentInventory = inventory.slice();
      currentInventory.push(...meatItems);

      // Remove animal from tamed animals
      const savedAnimals = localStorage.getItem('tamedAnimals');
      if (savedAnimals) {
        const animals: TamedAnimal[] = JSON.parse(savedAnimals);
        const updatedAnimals = animals.filter(a => a.id !== animal.id);
        localStorage.setItem('tamedAnimals', JSON.stringify(updatedAnimals));
      }
    });

    // Force refresh of animal data
    setAnimalRefresh(prev => prev + 1);

    // Clear selections
    setSelectedAnimalIds(new Set());
    setSelectedItemIds(new Set());

    // Trigger inventory update
    if (onInventoryUpdate) {
      onInventoryUpdate();
    }
  };

  const handleButcherConfirm = () => {
    executeButchering(animalsToButcher);
    setShowButcherModal(false);
    setAnimalsToButcher([]);
  };

  const handleButcherCancel = () => {
    setShowButcherModal(false);
    setAnimalsToButcher([]);
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

  const handleVesselDeploy = useCallback(() => {
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
  }, [selectedItems, playerCharacter, deployVesselToMap, playerX, playerY, setShipDockPosition, setCurrentVessel, onInventoryUpdate]);

  const handleBridgeDeploy = useCallback(() => {
    const bridges = selectedItems.filter(item =>
      item.category === 'Bridge' ||
      (item.name?.toLowerCase().includes('bridge') &&
       (item.name?.toLowerCase().includes('log') || item.name?.toLowerCase().includes('rope')))
    );

    if (bridges.length === 0) {
      alert('No bridges selected for deployment!');
      return;
    }

    if (bridges.length > 1) {
      alert('You can only deploy one bridge at a time.');
      return;
    }

    const bridge = bridges[0];

    if (deployBridgeToMap && playerX !== null && playerY !== null) {
      const deployResult = deployBridgeToMap(bridge, playerX, playerY);
      if (deployResult.success && deployResult.bridgePosition) {
        // Remove bridge from inventory
        const updatedInventory = inventory.filter(item => item.id !== bridge.id);
        playerCharacter.inventory = updatedInventory;

        setSelectedItemIds(new Set());
        onInventoryUpdate?.();
        alert(`${bridge.name} built! You can now cross the water at that location.`);
      } else {
        alert(`Cannot place bridge here. Need a single water tile with land on opposite sides within 3 tiles.`);
      }
    } else {
      alert('Bridge deployment not available.');
    }
  }, [selectedItems, inventory, playerCharacter, deployBridgeToMap, playerX, playerY, onInventoryUpdate]);

  if (inventory.length === 0 && tamedAnimals.length === 0) {
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
      {/* Search Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-600/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold tracking-wide text-gray-300 uppercase">Inventory</h3>
          <span className="text-xs text-gray-400">
            {filteredInventory.length + filteredAnimals.length} items
          </span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full px-2 py-1 text-xs bg-slate-700/50 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-slate-700"
        />
      </div>
      <div className="flex-1 min-h-0 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
        <div className="space-y-2">
          {/* No results message */}
          {filteredInventory.length === 0 && filteredAnimals.length === 0 && searchQuery && (
            <div className="text-center text-gray-400 text-sm py-8">
              No items found matching "{searchQuery}"
            </div>
          )}
          {/* Animal Companions Section */}
          {filteredAnimals.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold tracking-wide text-amber-400 border-b border-amber-400/30 mb-2">
                ANIMAL COMPANIONS
              </div>
              {filteredAnimals.map(animal => {
                const isSelected = selectedAnimalIds.has(animal.id);
                return (
                  <div 
                    key={`animal-${animal.id}`}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-amber-700/40 border-2 border-amber-400 shadow-lg shadow-amber-500/20' 
                        : 'bg-amber-900/20 border border-amber-600/30 hover:bg-amber-900/30 hover:border-amber-500/50'
                    }`}
                    onClick={() => {
                      handleAnimalSelect(animal.id);
                      if (isSelected) {
                        handleAnimalClick(animal); // Also show details when deselecting
                      }
                    }}
                    title="Click to select/deselect for crafting or view details"
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={noopHandler}
                      className="mr-1"
                      onClick={stopPropagation}
                    />
                    <div className="text-sm flex-shrink-0">{animal.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-amber-200 text-sm truncate">
                        {animal.name || animal.speciesName}
                      </p>
                      <p className="text-xs text-amber-300/70">Loyalty: {animal.loyalty}% • Value: {animal.value} coins</p>
                    </div>
                  </div>
                );
              })}
              <div className="px-2 py-1 text-xs font-semibold tracking-wide  text-gray-400 border-b border-gray-600/30 mb-2 mt-3">
                ITEMS
              </div>
            </>
          )}
          {filteredInventory.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center gap-2 p-2 transition-all duration-200 border rounded-lg cursor-pointer group hover:bg-slate-700/70
              ${selectedItemIds.has(item.id) ? 'bg-blue-800/50 border-blue-500 ring-1 ring-blue-400/50' : 'bg-slate-700/50 border-slate-600/30'}`}
              onClick={() => handleItemClick(item)}
              draggable={isDraggable}
              onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, item) : undefined}
              title={isDraggable ? "Drag to equipment slot or click to select" : "Click to select/deselect for crafting"}
            >
              <input 
                type="checkbox" 
                checked={selectedItemIds.has(item.id)}
                onChange={noopHandler}
                className="mr-1"
                onClick={(e) => e.stopPropagation()}
              />
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
      {/* Crafting Controls - Always Visible */}
      <div className="flex-shrink-0 p-2 border-t surface-muted">
          <div className="flex gap-1">
              {canDeploy ? (
                <button
                    onClick={handleVesselDeploy}
                    className="btn-primary flex-1 text-xs px-2 py-1"
                    title="Deploy vessel for sea travel"
                >
                    🚤 Deploy Vessel
                </button>
              ) : canDeployBridge ? (
                <button
                    onClick={handleBridgeDeploy}
                    className="btn-primary flex-1 text-xs px-2 py-1"
                    title="Deploy bridge to cross water"
                >
                    🌉 Deploy Bridge
                </button>
              ) : (
                <>
                  {showInfoInsteadOfCraft ? (
                    <button
                        onClick={handleAnimalInfo}
                        disabled={selectedAnimalIds.size !== 1}
                        className="btn-secondary flex-1 text-xs px-2 py-1"
                        title="View companion animal info"
                    >
                        ℹ️ Info
                    </button>
                  ) : (
                    <button
                        onClick={handleCraft}
                        disabled={!canCraft}
                        className="btn-primary flex-1 text-xs px-2 py-1 disabled:opacity-60"
                        title="Open crafting interface"
                    >
                        Craft
                    </button>
                  )}
                  <button
                      onClick={handleStudy}
                      disabled={!canStudy}
                      className="btn-secondary flex-1 text-xs px-2 py-1 disabled:opacity-60"
                      title="Study selected items"
                  >
                      Study 🔬
                  </button>
                  <button
                      onClick={handleEat}
                      disabled={!canEat}
                      className="btn-secondary flex-1 text-xs px-2 py-1 disabled:opacity-60"
                      title="Consume selected item"
                  >
                      Eat 🍽️
                  </button>
                  {canButcher && (
                      <button
                          onClick={handleButcher}
                          className="btn-secondary flex-1 text-xs px-2 py-1"
                          title="Process selected animal"
                      >
                          Butcher
                      </button>
                  )}
                </>
              )}
          </div>
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

      {/* Butcher Confirmation Modal */}
      <ButcherConfirmModal
        isOpen={showButcherModal}
        animals={animalsToButcher}
        onConfirm={handleButcherConfirm}
        onCancel={handleButcherCancel}
      />
    </div>
  );
};

export default InventoryPanel;
