/**
 * ProcessingInterface.tsx - Generic processing UI for POI interactions
 * Handles milling, sawing, polishing, refining, and crafting
 */
import React, { useState, useEffect } from 'react';
import { Item } from '../types';

export interface ProcessingRecipe {
  id: string;
  name: string;
  description: string;
  inputItems: { itemId: string; quantity: number; displayName: string }[];
  outputItems: { itemId: string; quantity: number; displayName: string }[];
  duration: number; // in seconds
  cost: number; // in coins
  skillRequired?: string;
  culturalVariant?: string;
}

interface ProcessingInterfaceProps {
  poiType: 'mill' | 'sawmill' | 'quarry' | 'mine' | 'factory';
  recipes: ProcessingRecipe[];
  playerInventory: Item[];
  playerCoins: number;
  onStartProcessing: (recipe: ProcessingRecipe) => Promise<void>;
  onClose: () => void;
  culturalZone?: string;
  era?: string;
}

export const ProcessingInterface: React.FC<ProcessingInterfaceProps> = ({
  poiType,
  recipes,
  playerInventory,
  playerCoins,
  onStartProcessing,
  onClose,
  culturalZone,
  era
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<ProcessingRecipe | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if player has required items for a recipe
  const hasRequiredItems = (recipe: ProcessingRecipe): boolean => {
    return recipe.inputItems.every(required => {
      const playerCount = playerInventory.filter(
        item => item.baseId === required.itemId || item.name.toLowerCase().includes(required.itemId.toLowerCase())
      ).reduce((sum, item) => sum + (item.quantity || 1), 0);
      return playerCount >= required.quantity;
    });
  };

  // Check if player can afford processing
  const canAfford = (recipe: ProcessingRecipe): boolean => {
    return playerCoins >= recipe.cost && hasRequiredItems(recipe);
  };

  // Handle processing start
  const handleStartProcessing = async () => {
    if (!selectedRecipe || !canAfford(selectedRecipe)) return;

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate processing with progress updates
      const duration = selectedRecipe.duration * 1000; // Convert to ms
      const updateInterval = 100; // Update every 100ms
      const totalUpdates = duration / updateInterval;

      for (let i = 0; i <= totalUpdates; i++) {
        await new Promise(resolve => setTimeout(resolve, updateInterval));
        setProgress((i / totalUpdates) * 100);
      }

      // Complete processing
      await onStartProcessing(selectedRecipe);
      setProcessing(false);
      setSelectedRecipe(null);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessing(false);
      setProgress(0);
    }
  };

  // Get POI-specific UI text
  const getPoiText = () => {
    const texts = {
      mill: {
        title: 'Grain Milling',
        action: 'Mill',
        processing: 'Milling',
        icon: '🌾'
      },
      sawmill: {
        title: 'Wood Processing',
        action: 'Saw',
        processing: 'Sawing',
        icon: '🪵'
      },
      quarry: {
        title: 'Stone Processing',
        action: 'Polish',
        processing: 'Polishing',
        icon: '⛏️'
      },
      mine: {
        title: 'Ore Refining',
        action: 'Refine',
        processing: 'Refining',
        icon: '⛏️'
      },
      factory: {
        title: 'Item Crafting',
        action: 'Craft',
        processing: 'Crafting',
        icon: '⚙️'
      }
    };
    return texts[poiType];
  };

  const poiText = getPoiText();

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <span className="text-2xl">{poiText.icon}</span>
          {poiText.title}
        </h3>

        {/* Recipe Selection */}
        {!processing && (
          <div className="space-y-2">
            {recipes.length === 0 ? (
              <p className="text-gray-400 text-sm">No recipes available</p>
            ) : (
              recipes.map(recipe => {
                const affordable = canAfford(recipe);
                const hasItems = hasRequiredItems(recipe);
                const hasMoney = playerCoins >= recipe.cost;

                return (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    disabled={!affordable}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedRecipe?.id === recipe.id
                        ? 'bg-amber-900/40 border-amber-600'
                        : affordable
                        ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600'
                        : 'bg-slate-800/30 border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{recipe.name}</div>
                        <div className="text-gray-400 text-xs mt-1">{recipe.description}</div>

                        {/* Requirements */}
                        <div className="flex gap-4 mt-2">
                          {/* Input Items */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-xs">Requires:</span>
                            {recipe.inputItems.map((item, i) => (
                              <span
                                key={i}
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  hasItems ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                }`}
                              >
                                {item.quantity}x {item.displayName}
                              </span>
                            ))}
                          </div>

                          {/* Cost */}
                          <div className={`text-xs ${hasMoney ? 'text-amber-400' : 'text-red-400'}`}>
                            💰 {recipe.cost} coins
                          </div>
                        </div>

                        {/* Output */}
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-gray-500 text-xs">Produces:</span>
                          {recipe.outputItems.map((item, i) => (
                            <span key={i} className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
                              {item.quantity}x {item.displayName}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="text-gray-500 text-xs">
                        ⏱️ {recipe.duration}s
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Processing View */}
        {processing && selectedRecipe && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-amber-400 font-medium text-lg mb-2">
                {poiText.processing} {selectedRecipe.name}...
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${progress}%` }}
                >
                  <span className="text-xs text-white font-bold">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Processing Animation */}
              <div className="mt-4 text-4xl animate-spin">
                {poiText.icon}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mt-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!processing && (
          <div className="flex gap-3 mt-4">
            {selectedRecipe && (
              <button
                onClick={handleStartProcessing}
                disabled={!canAfford(selectedRecipe)}
                className="flex-1 px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Start {poiText.action}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingInterface;