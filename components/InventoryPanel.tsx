import React, { useState, useMemo } from 'react';
import { Item, ItemQuality, PlayerCharacter } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { loadTamedAnimals, TamedAnimal, updateAnimalName } from '../services/animalTamingService';
import AnimalCompanionModal from './AnimalCompanionModal';
import { vesselService } from '../services/vesselService';

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

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, playerCharacter, onCraft, onInventoryUpdate, deployVesselToMap, playerX, playerY, setShipDockPosition, setCurrentVessel }) => {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedAnimal, setSelectedAnimal] = useState<TamedAnimal | null>(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  
  // Load tamed animals with forced refresh when modal closes
  const [animalRefresh, setAnimalRefresh] = useState(0);
  const tamedAnimals = useMemo(() => loadTamedAnimals(), [animalRefresh]);

  const handleItemClick = (item: Item) => {
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
      <div className="flex-shrink-0 p-3 border-b border-slate-600/50 bg-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎒</span>
            <span className="font-semibold text-gray-200 text-sm">Inventory</span>
          </div>
          <span className="px-2 py-1 text-xs font-bold text-blue-100 bg-blue-600/80 rounded-full shadow-sm">
            {inventory.length + tamedAnimals.length}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
        <div className="space-y-2">
          {/* Animal Companions Section */}
          {tamedAnimals.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-amber-400 border-b border-amber-400/30 mb-2">
                🐾 Animal Companions
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
              <div className="px-2 py-1 text-xs font-semibold text-gray-400 border-b border-gray-600/30 mb-2 mt-3">
                📦 Items
              </div>
            </>
          )}
          {inventory.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center gap-2 p-2 transition-all duration-200 border rounded-lg cursor-pointer group hover:bg-slate-700/70
              ${selectedItemIds.has(item.id) ? 'bg-blue-800/50 border-blue-500 ring-1 ring-blue-400/50' : 'bg-slate-700/50 border-slate-600/30'}`}
              title={item.description}
              onClick={() => handleItemClick(item)}
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
