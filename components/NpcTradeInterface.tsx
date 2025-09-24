/**
 * NPC Trade Interface Component
 * Provides trading functionality in the encounter modal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { NpcEntity, Item, PlayerCharacter } from '../types';
import { tradeService, TradeGood } from '../services/tradeService';
import { npcBehaviorService } from '../services/npcBehaviorService';
import { generateTradeNegotiation } from '../services/llmService';

interface NpcTradeInterfaceProps {
  npc: NpcEntity;
  playerCharacter: PlayerCharacter;
  mapData: any;
  onTrade?: (traded: boolean) => void;
  onClose?: () => void;
  onTradeComplete?: (tradeDetails?: { bought?: string[], sold?: string[], coins?: number }) => void;
}

// Helper type for compatibility
type PlayerCharacterForTrade = PlayerCharacter;

const NpcTradeInterface: React.FC<NpcTradeInterfaceProps> = ({
  npc,
  playerCharacter,
  mapData,
  onTrade,
  onClose,
  onTradeComplete
}) => {
  const player = playerCharacter; // Alias for backward compatibility
  const onUpdatePlayer = onTradeComplete; // Map to new callback
  const [npcGoods, setNpcGoods] = useState<TradeGood[]>([]);
  const [selectedNpcGoods, setSelectedNpcGoods] = useState<Set<number>>(new Set());
  const [selectedPlayerItems, setSelectedPlayerItems] = useState<Set<string>>(new Set());
  const [offeredCoins, setOfferedCoins] = useState(0);
  const [tradeMessage, setTradeMessage] = useState('');
  const [isBartering, setIsBartering] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState<{
    dialogue: string;
    counterOffer?: string;
    willNegotiate: boolean;
  } | null>(null);

  // New state for buy/sell mode
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [selectedSellItems, setSelectedSellItems] = useState<Set<string>>(new Set());
  const [npcBuyingPrice, setNpcBuyingPrice] = useState(0);
  
  // Generate NPC trade goods on mount, including animals
  useEffect(() => {
    const goods = tradeService.generateNpcTradeGoods(npc, mapData);
    
    // Add tamed animals as tradable goods
    const animals = npcBehaviorService.getTradableAnimals(npc.id);
    const animalGoods: TradeGood[] = animals.map((animal, index) => ({
      itemId: `animal-${npc.id}-${index}`,
      name: `${animal.name || animal.type.charAt(0).toUpperCase() + animal.type.slice(1)}`,
      basePrice: animal.value,
      currentPrice: animal.value,
      quantity: 1,
      category: 'livestock',
      description: `A ${animal.type}${animal.carryingCapacity ? ` (can carry ${animal.carryingCapacity} kg)` : ''}`,
      emoji: getAnimalEmoji(animal.type)
    }));
    
    setNpcGoods([...goods, ...animalGoods]);
  }, [npc, mapData]);
  
  // Helper function to get animal emoji
  const getAnimalEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      'camel': '🐪',
      'horse': '🐴',
      'ox': '🐂',
      'donkey': '🫏',
      'dog': '🐕',
      'sheep': '🐑',
      'goat': '🐐',
      'chicken': '🐓'
    };
    return emojiMap[type] || '🐾';
  };
  
  // Calculate trade values
  const tradeEvaluation = useMemo(() => {
    const selectedGoods = Array.from(selectedNpcGoods).map(i => npcGoods[i]).filter(Boolean);
    const playerGoods = Array.from(selectedPlayerItems).map(id => {
      const item = player?.inventory?.find((i: Item) => i.id === id);
      if (item) {
        return {
          itemId: item.id,
          name: item.name,
          basePrice: item.value || 10,
          currentPrice: item.value || 10,
          quantity: 1,
          quality: 'standard' as const,
          category: 'manufactured' as const
        };
      }
      return null;
    }).filter(Boolean) as TradeGood[];
    
    return tradeService.evaluateTrade(
      selectedGoods,
      { coins: offeredCoins, goods: playerGoods },
      undefined // Could pass market conditions here
    );
  }, [selectedNpcGoods, selectedPlayerItems, offeredCoins, npcGoods, player]);
  
  // Handle trade execution with LLM negotiation
  const executeTrade = async () => {
    if (!tradeEvaluation.fair && !player) {
      setTradeMessage('Unable to complete trade.');
      return;
    }

    if (!tradeEvaluation.fair) {
      // Use LLM to generate negotiation response
      setIsNegotiating(true);
      setTradeMessage('');
      
      try {
        const selectedGoods = Array.from(selectedNpcGoods).map(i => npcGoods[i]).filter(Boolean);
        const playerGoods = Array.from(selectedPlayerItems).map(id => {
          const item = player?.inventory?.find((i: Item) => i.id === id);
          if (item) {
            return {
              name: item.name,
              value: item.value || 10
            };
          }
          return null;
        }).filter(Boolean) as Array<{ name: string; value: number; }>;

        const result = await generateTradeNegotiation(npc, player, {
          npcGoods: selectedGoods.map(g => ({ name: g.name, value: g.currentPrice })),
          playerOffer: { coins: offeredCoins, goods: playerGoods },
          fairValue: tradeEvaluation.value,
          playerValue: offeredCoins + playerGoods.reduce((sum, g) => sum + g.value, 0)
        });
        
        setNegotiationResult(result);
        setTradeMessage(result.dialogue);
        setIsNegotiating(false);
        
        if (!result.willNegotiate) {
          if (onTrade) onTrade(false);
        }
        
        return;
      } catch (error) {
        console.error('Error in trade negotiation:', error);
        setTradeMessage(tradeEvaluation.suggestion || 'The trader refuses your offer.');
        setIsNegotiating(false);
        if (onTrade) onTrade(false);
        return;
      }
    }
    
    // Successful trade!
    // Remove coins from player
    if (offeredCoins > 0 && player) {
      player.currency = Math.max(0, (player.currency || 0) - offeredCoins);
    }

    // Remove selected items from player inventory
    const itemsToRemove = Array.from(selectedPlayerItems);
    if (player?.inventory) {
      player.inventory = player.inventory.filter((item: Item) =>
        !itemsToRemove.includes(item.id)
      );
    }

    // Add NPC goods to player inventory
    const itemsToAdd = Array.from(selectedNpcGoods).map(i => {
      const good = npcGoods[i];
      return {
        id: `${good.itemId}_${Date.now()}`, // Ensure unique ID
        baseId: good.itemId,
        name: good.name,
        emoji: good.emoji || '📦',
        description: good.description || `Trade good from ${npc.name}`,
        category: good.category === 'livestock' ? 'Animal' : 'Trade Good',
        value: good.currentPrice,
        weight: 1,
        quantity: good.quantity
      } as Item;
    });

    if (player?.inventory) {
      player.inventory = [...player.inventory, ...itemsToAdd];
    }
    
    // Update NPC relationship
    if (npc.memory) {
      npc.memory.opinionOfPlayer = Math.min(100, 
        (npc.memory.opinionOfPlayer || 50) + 10
      );
    }
    
    setTradeMessage('Trade successful!');
    if (onTrade) onTrade(true);

    // Pass trade details to parent
    if (onTradeComplete) {
      const boughtItems = Array.from(selectedNpcGoods).map(i => npcGoods[i].name);
      const soldItems = player?.inventory
        ?.filter((item: Item) => itemsToRemove.includes(item.id))
        .map((item: Item) => item.name) || [];

      onTradeComplete({
        bought: boughtItems,
        sold: soldItems,
        coins: offeredCoins
      });
    }

    // Clear selections
    setSelectedNpcGoods(new Set());
    setSelectedPlayerItems(new Set());
    setOfferedCoins(0);
  };
  
  // Toggle NPC good selection
  const toggleNpcGood = (index: number) => {
    const newSelection = new Set(selectedNpcGoods);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedNpcGoods(newSelection);
  };
  
  // Toggle player item selection
  const togglePlayerItem = (itemId: string) => {
    const newSelection = new Set(selectedPlayerItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedPlayerItems(newSelection);
  };
  
  // Accept counter-offer from NPC
  const acceptCounterOffer = () => {
    if (!negotiationResult?.counterOffer) return;
    
    // Parse counter-offer (e.g., "Add 15 more coins")
    const match = negotiationResult.counterOffer.match(/(\d+)/);
    if (match) {
      const additionalCoins = parseInt(match[1]);
      setOfferedCoins(prev => prev + additionalCoins);
      setNegotiationResult(null);
      setTradeMessage('');
    }
  };
  
  // Decline negotiation
  const declineNegotiation = () => {
    setNegotiationResult(null);
    setTradeMessage('Trade declined.');
    if (onTrade) onTrade(false);
  };
  
  // Calculate selling prices (NPCs usually buy at 60-80% of value)
  const calculateSellingPrice = (item: Item): number => {
    const basePrice = item.value || 10;
    const wealthMultiplier = npc.wealthLevel === 'wealthy' ? 0.8 :
                              npc.wealthLevel === 'modest' ? 0.7 : 0.6;
    return Math.floor(basePrice * wealthMultiplier);
  };

  // Calculate total selling price
  const totalSellingPrice = useMemo(() => {
    return Array.from(selectedSellItems).reduce((total, itemId) => {
      const item = player?.inventory?.find(i => i.id === itemId);
      return total + (item ? calculateSellingPrice(item) : 0);
    }, 0);
  }, [selectedSellItems, player?.inventory]);

  // Execute selling transaction
  const executeSale = async () => {
    if (selectedSellItems.size === 0) return;

    // Remove sold items from player inventory
    const itemsToRemove = Array.from(selectedSellItems);
    if (player?.inventory) {
      player.inventory = player.inventory.filter(
        item => !itemsToRemove.includes(item.id)
      );
    }

    // Add coins to player directly
    if (player) {
      player.currency = (player.currency || 0) + totalSellingPrice;
    }

    setTradeMessage(`Sold items for ${totalSellingPrice} coins!`);
    setSelectedSellItems(new Set());

    // Improve NPC relationship slightly
    if (npc.memory) {
      npc.memory.opinionOfPlayer = Math.min(100,
        (npc.memory.opinionOfPlayer || 50) + 5
      );
    }

    if (onTrade) onTrade(true);
    if (onTradeComplete) onTradeComplete();
  };

  // Mobile-friendly layout
  const isMobile = window.innerWidth <= 768;

  return (
    <div className={`trade-interface ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Header */}
      <div className="trade-header bg-slate-800 p-3 rounded-t-lg border-b border-slate-600">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-2xl">💰</span>
          Trading with {npc.name}
        </h3>
        <p className="text-sm text-slate-300 mt-1">
          {npc.role?.replace(/_/g, ' ')} • {npc.wealthLevel} wealth level
        </p>
      </div>

      {/* Trade Mode Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-900">
        <button
          onClick={() => setTradeMode('buy')}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            tradeMode === 'buy'
              ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          🛒 Buy from {npc.name}
        </button>
        <button
          onClick={() => setTradeMode('sell')}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            tradeMode === 'sell'
              ? 'bg-slate-800 text-green-400 border-b-2 border-green-400'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          💵 Sell to {npc.name}
        </button>
      </div>
      
      {/* Trade panels - different layout for buy vs sell */}
      {tradeMode === 'buy' ? (
        <div className={`trade-panels ${isMobile ? 'flex-col' : 'flex-row'} flex gap-4 p-4 bg-slate-900`}>

          {/* NPC Goods (Buy Mode) */}
          <div className="trade-panel flex-1">
            <h4 className="text-md font-semibold text-cyan-400 mb-3">
              Available Goods
            </h4>
            <div className="goods-list space-y-2 max-h-60 overflow-y-auto">
              {npcGoods.length === 0 ? (
                <p className="text-slate-500 italic">No goods available</p>
              ) : (
                npcGoods.map((good, index) => (
                  <div
                    key={index}
                    onClick={() => toggleNpcGood(index)}
                    className={`good-item p-2 rounded cursor-pointer transition-colors ${
                      selectedNpcGoods.has(index)
                        ? 'bg-cyan-900/50 border border-cyan-500'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">
                          {good.emoji && <span className="mr-1">{good.emoji}</span>}
                          {good.name}
                          {good.category === 'livestock' && (
                            <span className="ml-2 text-xs bg-green-900/50 text-green-400 px-1 rounded">
                              Livestock
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {good.category === 'livestock' ? good.description : `Qty: ${good.quantity} • Quality: ${good.quality}`}
                        </p>
                        {good.origin && (
                          <p className="text-xs text-slate-500">From: {good.origin}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold">
                          {Math.floor(good.currentPrice)} coins
                        </p>
                        {good.category !== 'livestock' && (
                          <p className="text-xs text-slate-500">
                            per unit
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        
        {/* Player Offer */}
        <div className="trade-panel flex-1">
          <h4 className="text-md font-semibold text-green-400 mb-3">
            Your Offer
          </h4>
          
          {/* Coins offer */}
          <div className="mb-3">
            <label className="text-sm text-slate-300">Coins:</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min="0"
                max={player?.currency || 0}
                value={offeredCoins}
                onChange={(e) => setOfferedCoins(parseInt(e.target.value) || 0)}
                className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
              />
              <span className="text-slate-400 text-sm">
                / {player?.currency || 0} available
              </span>
            </div>
          </div>
          
          {/* Barter toggle */}
          <div className="mb-3">
            <button
              onClick={() => setIsBartering(!isBartering)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isBartering ? '▼' : '▶'} Barter with items
            </button>
          </div>
          
          {/* Player items for barter */}
          {isBartering && (
            <div className="goods-list space-y-2 max-h-40 overflow-y-auto">
              {(!player?.inventory || player.inventory.length === 0) ? (
                <p className="text-slate-500 italic text-sm">No items to trade</p>
              ) : (
                player.inventory.map((item: Item) => (
                  <div
                    key={item.id}
                    onClick={() => togglePlayerItem(item.id)}
                    className={`item p-2 rounded cursor-pointer transition-colors text-sm ${
                      selectedPlayerItems.has(item.id)
                        ? 'bg-green-900/50 border border-green-500'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="text-white">{item.name}</span>
                      <span className="text-yellow-400">
                        {item.value || 10} coins
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      ) : (
        // Sell Mode
        <div className="p-4 bg-slate-900">
          <h4 className="text-md font-semibold text-green-400 mb-3">
            Your Items to Sell
          </h4>
          <div className="goods-list space-y-2 max-h-80 overflow-y-auto">
            {(!player?.inventory || player.inventory.length === 0) ? (
              <p className="text-slate-500 italic">No items to sell</p>
            ) : (
              player.inventory.map((item: Item) => {
                const sellPrice = calculateSellingPrice(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      const newSelection = new Set(selectedSellItems);
                      if (newSelection.has(item.id)) {
                        newSelection.delete(item.id);
                      } else {
                        newSelection.add(item.id);
                      }
                      setSelectedSellItems(newSelection);
                    }}
                    className={`item p-3 rounded cursor-pointer transition-colors ${
                      selectedSellItems.has(item.id)
                        ? 'bg-green-900/50 border border-green-500'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {item.emoji && <span className="mr-2">{item.emoji}</span>}
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.description || `${item.category} • Weight: ${item.weight}kg`}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-slate-500 line-through">
                          Value: {item.value || 10}
                        </p>
                        <p className="text-green-400 font-bold">
                          Sells for: {sellPrice} coins
                        </p>
                        <p className="text-xs text-slate-400">
                          ({Math.round((sellPrice / (item.value || 10)) * 100)}% of value)
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedSellItems.size > 0 && (
            <div className="mt-4 p-3 bg-slate-800 rounded border border-slate-600">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-400">Selected Items: {selectedSellItems.size}</p>
                  <p className="text-lg font-bold text-green-400">
                    Total: {totalSellingPrice} coins
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSellItems(new Set())}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Trade evaluation */}
      {tradeMode === 'buy' && (
        <div className="trade-evaluation p-3 bg-slate-800 border-t border-slate-600">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm text-slate-400">Trade Value:</p>
              <p className="text-lg font-bold text-white">
                {Math.floor(tradeEvaluation.value)} coins
              </p>
            </div>
            <div className={`text-sm px-3 py-1 rounded ${
              tradeEvaluation.fair
                ? 'bg-green-900/50 text-green-400 border border-green-600'
                : 'bg-red-900/50 text-red-400 border border-red-600'
            }`}>
              {tradeEvaluation.fair ? 'Fair Trade' : 'Unfair Trade'}
            </div>
          </div>
        
        {isNegotiating && (
          <p className="text-sm text-blue-400 mb-2 animate-pulse">
            💬 The trader is considering your offer...
          </p>
        )}
        
        {tradeMessage && !isNegotiating && (
          <p className="text-sm text-yellow-400 mb-2">{tradeMessage}</p>
        )}
        
        {negotiationResult && negotiationResult.counterOffer && (
          <div className="mb-2 p-2 bg-orange-900/50 border border-orange-600/50 rounded">
            <p className="text-sm text-orange-300 mb-2">
              💰 Counter-offer: {negotiationResult.counterOffer}
            </p>
            <div className="flex gap-2">
              <button
                onClick={acceptCounterOffer}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              >
                Accept
              </button>
              <button
                onClick={declineNegotiation}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        )}
        
        {tradeEvaluation.suggestion && !tradeMessage && !negotiationResult && (
          <p className="text-sm text-slate-400 italic mb-2">
            {tradeEvaluation.suggestion}
          </p>
        )}
        </div>
      )}

      {/* Action buttons */}
      <div className="trade-actions flex gap-2 p-3 bg-slate-900 rounded-b-lg border-t border-slate-700">
        {tradeMode === 'buy' ? (
          <button
            onClick={executeTrade}
            disabled={selectedNpcGoods.size === 0 || isNegotiating}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              selectedNpcGoods.size === 0 || isNegotiating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : tradeEvaluation.fair
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
            }`}
          >
            {isNegotiating ? 'Negotiating...' : tradeEvaluation.fair ? 'Execute Trade' : 'Make Offer'}
          </button>
        ) : (
          <button
            onClick={executeSale}
            disabled={selectedSellItems.size === 0}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              selectedSellItems.size === 0
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            Sell Selected Items ({totalSellingPrice} coins)
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          Cancel
        </button>
      </div>
      
      {/* Mobile-specific styles */}
      <style jsx="true">{`
        .trade-interface.mobile .trade-panels {
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .trade-interface.mobile .goods-list {
          max-height: 30vh;
        }
        
        .trade-interface.desktop .trade-panels {
          max-height: 400px;
        }
        
        .goods-list::-webkit-scrollbar {
          width: 4px;
        }
        
        .goods-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .goods-list::-webkit-scrollbar-thumb {
          background: rgba(100, 100, 100, 0.5);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default NpcTradeInterface;