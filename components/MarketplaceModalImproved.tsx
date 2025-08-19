/**
 * Improved Marketplace Modal
 * Enhanced UI, mobile optimization, and economic integration
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tile, PlayerCharacter, Item, MapData, MapAnalysisData, Season, HistoricalEra, ClimateType, CulturalZone, TimeOfDay, NpcEntity, TerrainStructure } from '../types';
import { ITEM_DEFINITIONS, ANIMAL_DATA } from '../constants/index';
import { tradeService, TradeGood, MarketConditions } from '../services/tradeService';
import MarketplaceBanner, { Condition } from './MarketplaceBanner';
import { generateMarketplaceDescription, CitySize } from '../services/marketplaceDescriptionGenerator';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { loadTamedAnimals, removeFromParty, TamedAnimal } from '../services/animalTamingService';

interface MarketplaceModalImprovedProps {
  tile: Tile;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  npcs: NpcEntity[];
  mapAnalysisData: MapAnalysisData;
  gameTimeHours: number;
  season: Season;
  onClose: () => void;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
}

type TabType = 'buy' | 'sell' | 'trade' | 'info';
type CategoryFilter = 'all' | 'food' | 'tool' | 'weapon' | 'luxury' | 'raw_material' | 'manufactured';

const MarketplaceModalImproved: React.FC<MarketplaceModalImprovedProps> = ({
  tile, playerCharacter, mapData, npcs, mapAnalysisData, gameTimeHours, season,
  onClose, onBuy, onSell
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<TradeGood | null>(null);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [merchantNpcs, setMerchantNpcs] = useState<NpcEntity[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<NpcEntity | null>(null);
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  
  // Detect mobile
  const isMobile = useMemo(() => window.innerWidth <= 768, []);
  
  // Parse era and culture
  const { era, culturalZone } = useMemo(() => {
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const parsedEra = dateInfo.era;
    const parsedCulture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    return { era: parsedEra as HistoricalEra, culturalZone: parsedCulture };
  }, [mapData.timeSlice, mapData.continent]);
  
  // Initialize market conditions
  useEffect(() => {
    const nearbyStructures = mapData.terrainStructures?.filter(s => {
      const distance = Math.hypot(s.location[0] - tile.x, s.location[1] - tile.y);
      return distance < 20;
    }) || [];
    
    const conditions = tradeService.initializeMarket(
      `market-${tile.x}-${tile.y}`,
      mapData,
      nearbyStructures
    );
    setMarketConditions(conditions);
    
    // Find merchant NPCs
    const merchants = npcs.filter(npc => 
      npc.role?.toLowerCase().includes('merchant') ||
      npc.role?.toLowerCase().includes('trader') ||
      npc.role?.toLowerCase().includes('vendor')
    );
    setMerchantNpcs(merchants);
    
    // Load tamed animals
    const animals = loadTamedAnimals();
    setTamedAnimals(animals);
  }, [tile, mapData, npcs]);
  
  // Generate market inventory with dynamic pricing
  const marketInventory = useMemo(() => {
    const goods: TradeGood[] = [];
    
    // Get goods from nearby structures
    const nearbyStructures = mapData.terrainStructures?.filter(s => {
      const distance = Math.hypot(s.location[0] - tile.x, s.location[1] - tile.y);
      return distance < 20;
    }) || [];
    
    nearbyStructures.forEach(structure => {
      if (structure.outputGoods) {
        structure.outputGoods.forEach(goodId => {
          const basePrice = 10 + Math.floor(Math.random() * 20);
          const priceModifier = marketConditions?.priceModifiers.get(goodId) || 1.0;
          
          goods.push({
            itemId: goodId,
            name: goodId.replace(/_/g, ' ').toLowerCase(),
            basePrice,
            currentPrice: Math.floor(basePrice * priceModifier),
            quantity: 10 + Math.floor(Math.random() * 40),
            quality: 'standard',
            origin: structure.name,
            category: categorizeGood(goodId)
          });
        });
      }
    });
    
    // Add goods from merchant NPCs
    merchantNpcs.forEach(merchant => {
      const merchantGoods = tradeService.generateNpcTradeGoods(merchant, mapData);
      goods.push(...merchantGoods);
    });
    
    // Filter and search
    return goods.filter(good => {
      if (categoryFilter !== 'all' && good.category !== categoryFilter) return false;
      if (searchQuery && !good.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [marketConditions, merchantNpcs, mapData, categoryFilter, searchQuery]);
  
  // Player sellable items with dynamic pricing (including tamed animals)
  const playerSellableItems = useMemo(() => {
    // Regular inventory items
    const regularItems = playerCharacter.inventory.map(item => {
      const basePrice = item.value || 10;
      const priceModifier = marketConditions?.priceModifiers.get(item.baseId) || 0.8;
      
      return {
        ...item,
        sellPrice: Math.floor(basePrice * priceModifier * 0.7), // Sell for less than buy
        itemType: 'item' as const
      };
    });
    
    // Tamed animals as sellable items
    const animalItems = tamedAnimals.map(animal => {
      const animalData = ANIMAL_DATA[animal.baseId];
      const basePrice = animal.value;
      // Domestic animals have better prices, wild animals less
      const typeModifier = animalData?.type === 'Domestic' ? 1.2 : 0.9;
      const healthModifier = animal.health / 10; // Health affects price
      const loyaltyModifier = 0.8 + (animal.loyalty / 100) * 0.4; // Loyalty adds 0-40% value
      
      return {
        id: animal.id,
        name: `${animal.speciesName} (Tamed)`,
        baseId: animal.baseId,
        emoji: animal.emoji,
        description: `A tamed ${animal.speciesName}. Health: ${animal.health}/10, Loyalty: ${animal.loyalty}/100`,
        value: basePrice,
        sellPrice: Math.floor(basePrice * typeModifier * healthModifier * loyaltyModifier * 0.8),
        itemType: 'animal' as const,
        animalData: animal
      };
    });
    
    return [...regularItems, ...animalItems];
  }, [playerCharacter.inventory, marketConditions, tamedAnimals]);
  
  // Trade routes from this marketplace
  const tradeRoutes = useMemo(() => {
    const routes: any[] = [];
    const nearbyMarkets = mapData.terrainStructures?.filter(s => 
      s.structureType === 'marketplace' && 
      s.location[0] !== tile.x && 
      s.location[1] !== tile.y
    ) || [];
    
    nearbyMarkets.forEach(market => {
      const distance = Math.hypot(market.location[0] - tile.x, market.location[1] - tile.y);
      if (distance < 50) {
        routes.push({
          destination: market.name,
          distance: Math.floor(distance),
          goods: market.inputGoods || [],
          frequency: distance < 20 ? 'Daily' : distance < 35 ? 'Weekly' : 'Monthly'
        });
      }
    });
    
    return routes;
  }, [mapData, tile]);
  
  // Handle buy action
  const handleBuy = useCallback((good: TradeGood) => {
    if (playerCharacter.currency >= good.currentPrice) {
      onBuy(good.itemId, good.currentPrice);
      
      // Update market conditions
      if (marketConditions) {
        const currentSupply = marketConditions.supply.get(good.itemId) || 0;
        marketConditions.supply.set(good.itemId, Math.max(0, currentSupply - 1));
      }
    }
  }, [playerCharacter.currency, onBuy, marketConditions]);
  
  // Handle sell action (items and animals)
  const handleSell = useCallback((item: any) => {
    if (item.itemType === 'animal') {
      // Selling a tamed animal
      const animal = item.animalData as TamedAnimal;
      
      // Remove animal from party
      removeFromParty(animal.id);
      
      // Update local state
      setTamedAnimals(prev => prev.filter(a => a.id !== animal.id));
      
      // Add coins to player (the parent component should handle this)
      // Create a pseudo-item for the transaction
      const animalAsItem = {
        id: animal.id,
        name: item.name,
        baseId: animal.baseId,
        emoji: animal.emoji,
        value: item.sellPrice,
        quantity: 1
      };
      onSell(animalAsItem as Item, item.sellPrice);
    } else {
      // Regular item sale
      onSell(item, item.sellPrice);
    }
    
    // Update market conditions
    if (marketConditions) {
      const currentSupply = marketConditions.supply.get(item.baseId) || 0;
      marketConditions.supply.set(item.baseId, currentSupply + 1);
    }
  }, [onSell, marketConditions]);
  
  // Market condition description
  const marketConditionDesc = useMemo(() => {
    const urbanCount = mapAnalysisData?.urbanTileCount || 0;
    if (urbanCount > 50) return 'Thriving Metropolis';
    if (urbanCount > 30) return 'Bustling City';
    if (urbanCount > 15) return 'Growing Town';
    if (urbanCount > 5) return 'Small Settlement';
    return 'Trading Post';
  }, [mapAnalysisData]);
  
  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'buy':
        return (
          <div className="flex flex-col h-full">
            {/* Search and filters */}
            <div className="p-3 border-b border-slate-700 space-y-2">
              <input
                type="text"
                placeholder="Search goods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500"
              />
              <div className="flex gap-2 flex-wrap">
                {(['all', 'food', 'tool', 'weapon', 'luxury', 'raw_material', 'manufactured'] as CategoryFilter[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      categoryFilter === cat 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Goods grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {marketInventory.map((good, index) => (
                  <div
                    key={`${good.itemId}-${index}`}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-cyan-600 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white capitalize">{good.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        good.quality === 'exceptional' ? 'bg-purple-900/50 text-purple-400' :
                        good.quality === 'fine' ? 'bg-blue-900/50 text-blue-400' :
                        good.quality === 'poor' ? 'bg-red-900/50 text-red-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {good.quality}
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-400 mb-3">
                      <p>Quantity: {good.quantity}</p>
                      {good.origin && <p>From: {good.origin}</p>}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 line-through">
                          {good.basePrice} coins
                        </p>
                        <p className="text-lg font-bold text-yellow-400">
                          {good.currentPrice} coins
                        </p>
                      </div>
                      <button
                        onClick={() => handleBuy(good)}
                        disabled={playerCharacter.currency < good.currentPrice}
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          playerCharacter.currency >= good.currentPrice
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'sell':
        return (
          <div className="flex flex-col h-full p-3">
            <h3 className="text-lg font-semibold text-orange-400 mb-3">Your Inventory</h3>
            <div className="grid gap-2 overflow-y-auto">
              {playerSellableItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 bg-slate-800 border rounded-lg transition-colors ${
                    item.itemType === 'animal' 
                      ? 'border-green-700 hover:border-green-500 bg-gradient-to-r from-slate-800 to-green-900/20' 
                      : 'border-slate-700 hover:border-orange-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="font-medium text-white">
                        {item.name}
                        {item.itemType === 'animal' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-green-600/30 text-green-400 rounded-full">
                            Companion
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-400">
                        {item.itemType === 'animal' 
                          ? item.description 
                          : `Quantity: ${item.quantity || 1}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Sell for</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {item.sellPrice} coins
                      </p>
                    </div>
                    <button
                      onClick={() => handleSell(item)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'trade':
        return (
          <div className="flex flex-col h-full p-3">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Merchant Traders</h3>
            {merchantNpcs.length === 0 ? (
              <p className="text-slate-500 italic">No merchants present at this time.</p>
            ) : (
              <div className="space-y-3">
                {merchantNpcs.map(merchant => (
                  <div
                    key={merchant.id}
                    className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-purple-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedMerchant(merchant)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{merchant.name}</p>
                        <p className="text-sm text-slate-400">
                          {merchant.role} • {merchant.wealthLevel} wealth
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm">
                        Trade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'info':
        return (
          <div className="flex flex-col h-full p-3 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Market Information</h3>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2">
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Status:</span> {marketConditionDesc}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Era:</span> {era}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Culture:</span> {culturalZone}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Trade Routes</h3>
              <div className="space-y-2">
                {tradeRoutes.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No established trade routes.</p>
                ) : (
                  tradeRoutes.map((route, index) => (
                    <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-2">
                      <p className="text-sm text-white font-medium">{route.destination}</p>
                      <p className="text-xs text-slate-400">
                        {route.distance} tiles away • {route.frequency} traders
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Supply & Demand</h3>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <div className="space-y-1">
                  <p className="text-xs text-green-400">High Supply:</p>
                  <p className="text-sm text-slate-300">
                    {Array.from(marketConditions?.supply.entries() || [])
                      .filter(([_, qty]) => qty > 100)
                      .map(([id]) => id.replace(/_/g, ' ').toLowerCase())
                      .join(', ') || 'None'}
                  </p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-red-400">High Demand:</p>
                  <p className="text-sm text-slate-300">
                    {Array.from(marketConditions?.demand.entries() || [])
                      .filter(([_, level]) => level > 0.7)
                      .map(([id]) => id.replace(/_/g, ' ').toLowerCase())
                      .join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl flex flex-col ${
        isMobile ? 'w-full h-full' : 'w-[90%] max-w-6xl h-[85vh]'
      }`}>
        {/* Header with banner */}
        <div className="relative h-32 rounded-t-lg overflow-hidden shrink-0">
          <MarketplaceBanner
            era={era}
            culturalZone={culturalZone}
            condition={marketConditionDesc.includes('Thriving') ? 'prosperous' : 'humble'}
            climate={mapData.climate}
            season={season}
            timeOfDay={'Midday'}
            seed={mapData.seed}
            width={1200}
            height={128}
            mapData={mapData}
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-red-600/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Marketplace name and description */}
        <div className="p-3 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold text-amber-300">Marketplace of {mapData.continent || 'Unknown Lands'}</h2>
          <p className="text-sm text-slate-400">{marketConditionDesc} • {era} Era</p>
        </div>
        
        {/* Tab navigation */}
        <div className="flex border-b border-slate-700 bg-slate-800/30">
          {(['buy', 'sell', 'trade', 'info'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-slate-700 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab === 'buy' && '🛒 '}
              {tab === 'sell' && '💰 '}
              {tab === 'trade' && '🤝 '}
              {tab === 'info' && 'ℹ️ '}
              {tab}
            </button>
          ))}
        </div>
        
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
        
        {/* Footer with wallet */}
        <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <div className="text-lg font-bold text-yellow-300">
            💰 {playerCharacter.currency} coins
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
          >
            Leave Market
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to categorize goods
function categorizeGood(itemId: string): TradeGood['category'] {
  const id = itemId.toLowerCase();
  
  if (id.includes('food') || id.includes('wheat') || id.includes('meat') || id.includes('fish')) {
    return 'food';
  }
  if (id.includes('tool') || id.includes('hammer') || id.includes('axe')) {
    return 'tool';
  }
  if (id.includes('weapon') || id.includes('sword') || id.includes('spear')) {
    return 'weapon';
  }
  if (id.includes('silk') || id.includes('jewelry') || id.includes('spice')) {
    return 'luxury';
  }
  if (id.includes('ore') || id.includes('wood') || id.includes('cotton')) {
    return 'raw_material';
  }
  
  return 'manufactured';
}

export default MarketplaceModalImproved;