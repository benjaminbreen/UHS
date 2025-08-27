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
import { loadFactionData } from '../utils/dataLoader';
import { AllegianceGroup } from '../constants/gameData/factions/types';
import { WeatherState } from '../services/weatherService';
import { ProceduralPortrait } from './portraits';
import { AttributeBadgeList } from './AttributeBadge';
import { generateNpcGreeting, generateNpcResponse, generateNpcMonologue, createDialogueContext } from '../services/npcDialogueService';

interface MarketplaceModalProps {
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
  weather?: WeatherState | null;
}

type TabType = 'buy' | 'sell' | 'trade' | 'people' | 'info';
type CategoryFilter = 'all' | 'food' | 'tool' | 'weapon' | 'luxury' | 'raw_material' | 'manufactured';

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  tile, playerCharacter, mapData, npcs, mapAnalysisData, gameTimeHours, season,
  onClose, onBuy, onSell, weather
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<TradeGood | null>(null);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [merchantNpcs, setMerchantNpcs] = useState<NpcEntity[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<NpcEntity | null>(null);
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [marketplaceName, setMarketplaceName] = useState<string>('Marketplace');
  const [marketAllegiance, setMarketAllegiance] = useState<AllegianceGroup | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<NpcEntity | null>(null);
  const [npcDialogue, setNpcDialogue] = useState<string>('');
  const [npcDialogueLoading, setNpcDialogueLoading] = useState(false);
  const [npcMonologue, setNpcMonologue] = useState<string>('');
  const [monologueVisible, setMonologueVisible] = useState(false);
  const [portraitClickCounts, setPortraitClickCounts] = useState<Record<string, number>>({});
  
  // Detect mobile
  const isMobile = useMemo(() => window.innerWidth <= 768, []);
  
  // Filter representative inhabitants (non-merchant NPCs in the area)
  const inhabitantsNpcs = useMemo(() => {
    return npcs.filter(npc => 
      !npc.role?.toLowerCase().includes('merchant') &&
      !npc.role?.toLowerCase().includes('trader') &&
      !npc.role?.toLowerCase().includes('vendor')
    ).slice(0, 8); // Show up to 8 inhabitants
  }, [npcs]);
  
  // Parse era and culture
  const { era, culturalZone } = useMemo(() => {
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const parsedEra = dateInfo.era;
    const parsedCulture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    return { era: parsedEra as HistoricalEra, culturalZone: parsedCulture };
  }, [mapData.timeSlice, mapData.continent]);
  
  // Initialize market conditions and faction data
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
    
    // Load faction data for custom marketplace names and allegiances
    const loadMarketplaceData = async () => {
      try {
        const factionModule = await loadFactionData(culturalZone);
        const factionData = factionModule.default || Object.values(factionModule)[0];
        
        // Get region and local area
        const region = mapData.region || 'Unknown Region';
        const localArea = mapData.localArea || mapData.continent || 'Unknown';
        
        if (factionData && factionData[culturalZone]) {
          const regionData = factionData[culturalZone][region];
          if (regionData && regionData[era]) {
            const eraData = regionData[era];
            
            // Check for map area overrides first
            const areaOverride = eraData.mapAreaOverrides?.[localArea];
            const allegianceGroups = areaOverride?.allegianceGroups || eraData.allegianceGroups;
            
            // Set random allegiance
            if (allegianceGroups && allegianceGroups.length > 0) {
              const randomAllegiance = allegianceGroups[Math.floor(Math.random() * allegianceGroups.length)];
              setMarketAllegiance(randomAllegiance);
            }
            
            // Get custom marketplace name from trading_post structure names
            const tradingPostNames = eraData.structureNames?.trading_post;
            if (tradingPostNames && tradingPostNames.length > 0) {
              const randomName = tradingPostNames[Math.floor(Math.random() * tradingPostNames.length)];
              setMarketplaceName(randomName);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load faction data for marketplace:', error);
      }
    };
    
    loadMarketplaceData();
  }, [tile, mapData, npcs, culturalZone, era]);
  
  // Generate market inventory with dynamic pricing and historical awareness
  const marketInventory = useMemo(() => {
    const goods: TradeGood[] = [];
    
    // Get goods from nearby structures
    const nearbyStructures = mapData.terrainStructures?.filter(s => {
      const distance = Math.hypot(s.location[0] - tile.x, s.location[1] - tile.y);
      return distance < 20;
    }) || [];
    
    // Add historically appropriate goods based on era and culture
    const historicalGoods = getHistoricalGoods(era, culturalZone, season);
    historicalGoods.forEach(good => {
      const priceModifier = marketConditions?.priceModifiers.get(good.itemId) || 1.0;
      const seasonalModifier = getSeasonalPriceModifier(good.itemId, season);
      
      goods.push({
        ...good,
        currentPrice: Math.floor(good.basePrice * priceModifier * seasonalModifier),
        quantity: Math.floor(good.quantity * (0.5 + Math.random())),
      });
    });
    
    nearbyStructures.forEach(structure => {
      if (structure.outputGoods) {
        structure.outputGoods.forEach(goodId => {
          const basePrice = 10 + Math.floor(Math.random() * 20);
          const priceModifier = marketConditions?.priceModifiers.get(goodId) || 1.0;
          const seasonalModifier = getSeasonalPriceModifier(goodId, season);
          
          goods.push({
            itemId: goodId,
            name: goodId.replace(/_/g, ' ').toLowerCase(),
            basePrice,
            currentPrice: Math.floor(basePrice * priceModifier * seasonalModifier),
            quantity: 10 + Math.floor(Math.random() * 40),
            quality: Math.random() > 0.7 ? 'fine' : Math.random() > 0.9 ? 'exceptional' : 'standard',
            origin: structure.name,
            category: categorizeGood(goodId)
          });
        });
      }
    });
    
    // Add goods from merchant NPCs with cultural awareness
    merchantNpcs.forEach(merchant => {
      const merchantGoods = tradeService.generateNpcTradeGoods(merchant, mapData);
      goods.push(...merchantGoods.map(good => ({
        ...good,
        quality: merchant.wealthLevel === 'wealthy' ? 'fine' : 
                 merchant.wealthLevel === 'poor' ? 'poor' : 'standard'
      })));
    });
    
    // Filter and search
    return goods.filter(good => {
      if (categoryFilter !== 'all' && good.category !== categoryFilter) return false;
      if (searchQuery && !good.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [marketConditions, merchantNpcs, mapData, categoryFilter, searchQuery, era, culturalZone, season]);
  
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

  // Handle NPC greeting/interaction
  const handleNpcClick = useCallback(async (npc: NpcEntity) => {
    setSelectedNpc(npc);
    setNpcDialogueLoading(true);
    setNpcDialogue('');
    
    try {
      const context = createDialogueContext(mapData, {
        isMarketplace: true,
        timeOfDay: gameTimeHours < 6 ? 'dawn' : gameTimeHours < 12 ? 'morning' : gameTimeHours < 18 ? 'midday' : gameTimeHours < 21 ? 'evening' : 'night',
        season: season.toLowerCase()
      });
      
      const response = await generateNpcGreeting(npc, context, playerCharacter);
      setNpcDialogue(response.text);
    } catch (error) {
      console.error('Failed to generate NPC dialogue:', error);
      setNpcDialogue("Good day to you, traveler.");
    } finally {
      setNpcDialogueLoading(false);
    }
  }, [mapData, gameTimeHours, season, playerCharacter]);

  // Handle portrait click for monologue
  const handlePortraitClick = useCallback(async (npc: NpcEntity) => {
    const currentCount = (portraitClickCounts[npc.id] || 0) + 1;
    setPortraitClickCounts(prev => ({ ...prev, [npc.id]: currentCount }));
    
    if (currentCount <= 3) { // Allow up to 3 clicks
      try {
        const context = createDialogueContext(mapData, {
          isMarketplace: true,
          timeOfDay: gameTimeHours < 6 ? 'dawn' : gameTimeHours < 12 ? 'morning' : gameTimeHours < 18 ? 'midday' : gameTimeHours < 21 ? 'evening' : 'night',
          season: season.toLowerCase()
        });
        
        const monologue = await generateNpcMonologue(npc, context, currentCount);
        setNpcMonologue(monologue);
        setMonologueVisible(true);
        
        // Auto-hide monologue after 4 seconds
        setTimeout(() => setMonologueVisible(false), 4000);
      } catch (error) {
        console.error('Failed to generate NPC monologue:', error);
        setNpcMonologue("I have much on my mind these days...");
        setMonologueVisible(true);
        setTimeout(() => setMonologueVisible(false), 4000);
      }
    }
  }, [portraitClickCounts, mapData, gameTimeHours, season]);
  
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
            {/* Search and filters with historical styling */}
            <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-amber-900/30 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search wares and goods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-amber-900/30 rounded-md text-amber-50 placeholder-amber-200/40 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30 transition-all"
                />
                <span className="absolute right-3 top-3 text-amber-600/50">🔍</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'All Goods', icon: '📦' },
                  { id: 'food', label: 'Provisions', icon: '🍞' },
                  { id: 'tool', label: 'Tools', icon: '🔨' },
                  { id: 'weapon', label: 'Arms', icon: '⚔️' },
                  { id: 'luxury', label: 'Luxuries', icon: '💎' },
                  { id: 'raw_material', label: 'Raw Goods', icon: '🪵' },
                  { id: 'manufactured', label: 'Crafted', icon: '🏺' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all transform hover:scale-105 ${
                      categoryFilter === cat.id 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40' 
                        : 'bg-slate-800/70 text-amber-200/70 hover:bg-slate-700/70 hover:text-amber-200 border border-slate-700/50'
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Goods grid with enhanced styling */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
              {marketInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-amber-200/50">
                  <span className="text-4xl mb-3">📦</span>
                  <p className="text-lg">No goods match your search</p>
                  <p className="text-sm mt-1">Try different filters or come back later</p>
                </div>
              ) : (
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-3'}`}>
                  {marketInventory.map((good, index) => (
                    <div
                      key={`${good.itemId}-${index}`}
                      className="group bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-lg p-4 hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-200 backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-amber-50 capitalize text-sm lg:text-base">
                            {good.name}
                          </h4>
                          {good.origin && (
                            <p className="text-xs text-amber-200/50 mt-0.5">from {good.origin}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          good.quality === 'exceptional' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' :
                          good.quality === 'fine' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' :
                          good.quality === 'poor' ? 'bg-red-900/40 text-red-300 border border-red-700/50' :
                          'bg-slate-700/40 text-slate-300 border border-slate-600/50'
                        }`}>
                          {good.quality === 'exceptional' ? '✨ Exceptional' :
                           good.quality === 'fine' ? '⭐ Fine' :
                           good.quality === 'poor' ? '⚠️ Poor' :
                           '● Standard'}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900/30 rounded-md p-2 mb-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-amber-200/60">Stock:</span>
                          <span className={`font-medium ${
                            good.quantity < 5 ? 'text-red-400' :
                            good.quantity < 20 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {good.quantity} units
                          </span>
                        </div>
                        {good.currentPrice !== good.basePrice && (
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-amber-200/60">Market:</span>
                            <span className={`font-medium ${
                              good.currentPrice > good.basePrice ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {good.currentPrice > good.basePrice ? '↑' : '↓'} 
                              {Math.abs(Math.round(((good.currentPrice - good.basePrice) / good.basePrice) * 100))}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          {good.basePrice !== good.currentPrice && (
                            <p className="text-xs text-slate-500 line-through">
                              {good.basePrice} coins
                            </p>
                          )}
                          <p className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                            {good.currentPrice} coins
                          </p>
                        </div>
                        <button
                          onClick={() => handleBuy(good)}
                          disabled={playerCharacter.currency < good.currentPrice}
                          className={`px-4 py-2 rounded-md font-medium transition-all transform hover:scale-105 ${
                            playerCharacter.currency >= good.currentPrice
                              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-md shadow-green-900/30'
                              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {playerCharacter.currency >= good.currentPrice ? 'Purchase' : 'Too Costly'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'sell':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-amber-900/30">
              <h3 className="text-lg font-semibold text-amber-300 mb-1">Your Trading Inventory</h3>
              <p className="text-sm text-amber-200/60">Select items to sell at current market rates</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
              {playerSellableItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-amber-200/50">
                  <span className="text-4xl mb-3">🏎</span>
                  <p className="text-lg">Your inventory is empty</p>
                  <p className="text-sm mt-1">Gather items to trade at the market</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {playerSellableItems.map(item => {
                    const profitMargin = item.sellPrice > (item.value || 0) ? 
                      ((item.sellPrice - (item.value || 0)) / (item.value || 1) * 100) : 0;
                    
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between p-4 rounded-lg transition-all backdrop-blur-sm hover:shadow-lg ${
                          item.itemType === 'animal' 
                            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-700/50 hover:border-green-600/70 hover:shadow-green-900/30' 
                            : 'bg-gradient-to-r from-slate-800/80 to-slate-900/60 border border-slate-700/50 hover:border-amber-600/50 hover:shadow-amber-900/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                            {item.emoji}
                          </span>
                          <div>
                            <p className="font-medium text-amber-50">
                              {item.name}
                              {item.itemType === 'animal' && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-green-600/30 text-green-300 rounded-full border border-green-600/50">
                                  🐾 Companion
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-amber-200/60 mt-0.5">
                              {item.itemType === 'animal' 
                                ? item.description 
                                : `Stock: ${item.quantity || 1} unit${(item.quantity || 1) > 1 ? 's' : ''}`
                              }
                            </p>
                            {profitMargin > 0 && (
                              <p className="text-xs text-green-400 mt-1">
                                ↑ {profitMargin.toFixed(0)}% above base value
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-amber-200/50 uppercase tracking-wide">Market Offer</p>
                            <p className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                              {item.sellPrice} coins
                            </p>
                            {item.value && item.value !== item.sellPrice && (
                              <p className="text-xs text-slate-500 line-through">Base: {item.value}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleSell(item)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-md font-medium transition-all transform hover:scale-105 shadow-md shadow-amber-900/30"
                          >
                            Sell
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'trade':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-amber-900/30">
              <h3 className="text-lg font-semibold text-purple-300 mb-1">Traveling Merchants</h3>
              <p className="text-sm text-amber-200/60">Negotiate special deals with wandering traders</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
              {merchantNpcs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-amber-200/50">
                  <span className="text-4xl mb-3">🏕️</span>
                  <p className="text-lg">No merchants are present</p>
                  <p className="text-sm mt-1">They may arrive with the next caravan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {merchantNpcs.map(merchant => {
                    const wealthIcon = merchant.wealthLevel === 'wealthy' ? '💰' : 
                                       merchant.wealthLevel === 'poor' ? '🤙' : '💵';
                    const wealthColor = merchant.wealthLevel === 'wealthy' ? 'from-purple-600 to-purple-700' : 
                                        merchant.wealthLevel === 'poor' ? 'from-gray-600 to-gray-700' : 
                                        'from-blue-600 to-blue-700';
                    
                    return (
                      <div
                        key={merchant.id}
                        className="group p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/60 border border-purple-700/30 rounded-lg hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-900/20 transition-all cursor-pointer backdrop-blur-sm"
                        onClick={() => setSelectedMerchant(merchant)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center border border-purple-700/50 group-hover:scale-110 transition-transform">
                              <span className="text-xl">{wealthIcon}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-amber-50">{merchant.name}</p>
                              <p className="text-sm text-amber-200/60">
                                {merchant.role}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 bg-gradient-to-r ${wealthColor} text-white rounded-full`}>
                                  {merchant.wealthLevel} merchant
                                </span>
                                {merchant.personality && (
                                  <span className="text-xs text-purple-300/60">
                                    • {merchant.personality.split(',')[0].trim()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md text-sm font-medium transition-all transform hover:scale-105 shadow-md shadow-purple-900/30">
                            Negotiate →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'info':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-amber-900/30">
              <h3 className="text-lg font-semibold text-cyan-300 mb-1">Market Intelligence</h3>
              <p className="text-sm text-amber-200/60">Current conditions and trade opportunities</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40 space-y-4">
              {/* Market Status Card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-cyan-700/30 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">🏛️ Market Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 rounded-md p-2">
                    <p className="text-xs text-cyan-300/60 mb-1">Settlement Type</p>
                    <p className="text-sm text-amber-50 font-medium">{marketConditionDesc}</p>
                  </div>
                  <div className="bg-slate-900/40 rounded-md p-2">
                    <p className="text-xs text-cyan-300/60 mb-1">Historical Era</p>
                    <p className="text-sm text-amber-50 font-medium">{era}</p>
                  </div>
                  <div className="bg-slate-900/40 rounded-md p-2">
                    <p className="text-xs text-cyan-300/60 mb-1">Cultural Zone</p>
                    <p className="text-sm text-amber-50 font-medium">{culturalZone}</p>
                  </div>
                </div>
                {marketAllegiance && (
                  <div className="mt-3 pt-3 border-t border-cyan-700/20">
                    <p className="text-xs text-cyan-300/60 mb-1">Political Allegiance</p>
                    <p className="text-sm text-amber-400 font-medium">🏰 {marketAllegiance.name}</p>
                  </div>
                )}
              </div>
              
              {/* Trade Routes Card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-purple-700/30 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide">🗺️ Trade Routes</h4>
                {tradeRoutes.length === 0 ? (
                  <p className="text-amber-200/50 italic text-sm">No established trade routes from this market.</p>
                ) : (
                  <div className="space-y-2">
                    {tradeRoutes.map((route, index) => (
                      <div key={index} className="bg-slate-900/40 rounded-md p-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-50 font-medium">{route.destination}</p>
                          <p className="text-xs text-amber-200/60">
                            {route.frequency} caravans
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-purple-300">{route.distance} tiles</p>
                          <p className="text-xs text-amber-200/40">
                            {route.distance < 20 ? 'Near' : route.distance < 35 ? 'Moderate' : 'Far'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Supply & Demand Card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-amber-700/30 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">📈 Supply & Demand</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-900/40 rounded-md p-3">
                    <p className="text-xs text-green-400 font-medium mb-2">📦 Abundant Supply</p>
                    <p className="text-sm text-amber-50">
                      {Array.from(marketConditions?.supply.entries() || [])
                        .filter(([_, qty]) => qty > 100)
                        .map(([id]) => id.replace(/_/g, ' ').toLowerCase())
                        .slice(0, 3)
                        .join(', ') || 'Standard availability'}
                    </p>
                    {Array.from(marketConditions?.supply.entries() || [])
                      .filter(([_, qty]) => qty > 100).length > 3 && (
                      <p className="text-xs text-amber-200/40 mt-1">
                        +{Array.from(marketConditions?.supply.entries() || [])
                          .filter(([_, qty]) => qty > 100).length - 3} more
                      </p>
                    )}
                  </div>
                  <div className="bg-slate-900/40 rounded-md p-3">
                    <p className="text-xs text-red-400 font-medium mb-2">🔥 High Demand</p>
                    <p className="text-sm text-amber-50">
                      {Array.from(marketConditions?.demand.entries() || [])
                        .filter(([_, level]) => level > 0.7)
                        .map(([id]) => id.replace(/_/g, ' ').toLowerCase())
                        .slice(0, 3)
                        .join(', ') || 'Balanced demand'}
                    </p>
                    {Array.from(marketConditions?.demand.entries() || [])
                      .filter(([_, level]) => level > 0.7).length > 3 && (
                      <p className="text-xs text-amber-200/40 mt-1">
                        +{Array.from(marketConditions?.demand.entries() || [])
                          .filter(([_, level]) => level > 0.7).length - 3} more
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-700/20">
                  <p className="text-xs text-amber-200/60">
                    💡 Tip: Buy low supply items elsewhere and sell them here for profit!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'people':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-amber-900/30">
              <h3 className="text-lg font-semibold text-blue-300 mb-1">Representative Inhabitants</h3>
              <p className="text-sm text-amber-200/60">Local people you might encounter at the marketplace</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
              {inhabitantsNpcs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-amber-200/50">
                  <span className="text-4xl mb-3">👻</span>
                  <p className="text-lg">No inhabitants nearby</p>
                  <p className="text-sm mt-1">The marketplace seems quiet today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inhabitantsNpcs.map((npc, index) => (
                    <div
                      key={npc.id}
                      className="group p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/60 border border-blue-700/30 rounded-lg hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 transition-all backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        {/* Portrait */}
                        <div 
                          className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-slate-700/50 border-2 border-blue-600/30 hover:border-blue-400/60 transition-all cursor-pointer hover:scale-105"
                          onClick={() => handlePortraitClick(npc)}
                          title="Click for inner thoughts..."
                        >
                          <ProceduralPortrait
                            character={npc}
                            size={64}
                          />
                          {/* Attribute badges */}
                          {npc.attributes && npc.attributes.length > 0 && (
                            <div className="absolute -top-1 -left-1 z-20">
                              <AttributeBadgeList
                                badges={npc.attributes}
                                maxDisplay={1}
                                size="small"
                              />
                            </div>
                          )}
                          {/* Click hint */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs text-white font-medium">💭</span>
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-amber-50 truncate">{npc.name}</h4>
                            <span className="text-amber-200/40">•</span>
                            <span className="text-sm text-amber-200/60">{npc.age} years</span>
                          </div>
                          <p className="text-sm text-blue-300 capitalize mb-2">{npc.role}</p>
                          
                          {/* Additional info badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              npc.wealthLevel === 'wealthy' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' :
                              npc.wealthLevel === 'poor' ? 'bg-red-900/40 text-red-300 border border-red-700/50' :
                              'bg-slate-700/40 text-slate-300 border border-slate-600/50'
                            }`}>
                              {npc.wealthLevel || 'modest'} class
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-cyan-900/40 text-cyan-300 rounded-full border border-cyan-700/50">
                              {npc.religion || 'local faith'}
                            </span>
                            {npc.personality && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-300 rounded-full border border-yellow-700/50">
                                {npc.personality.split(',')[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Interaction button */}
                        <button
                          onClick={() => handleNpcClick(npc)}
                          disabled={npcDialogueLoading && selectedNpc?.id === npc.id}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-md font-medium transition-all transform hover:scale-105 shadow-md shadow-blue-900/30 disabled:cursor-not-allowed"
                        >
                          {npcDialogueLoading && selectedNpc?.id === npc.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>...</span>
                            </div>
                          ) : (
                            'Greet'
                          )}
                        </button>
                      </div>
                      
                      {/* Dialogue display */}
                      {selectedNpc?.id === npc.id && npcDialogue && (
                        <div className="mt-4 p-3 bg-slate-900/40 rounded-md border-l-4 border-blue-500">
                          <p className="text-sm text-amber-100 italic">"{npcDialogue}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Monologue overlay */}
            {monologueVisible && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                <div className="bg-black/90 backdrop-blur-sm rounded-lg px-6 py-4 border border-blue-500/50 shadow-2xl max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400">💭</span>
                    <span className="text-xs text-blue-300 uppercase tracking-wide">Inner Thoughts</span>
                  </div>
                  <p className="text-amber-100 italic text-center font-serif leading-relaxed">
                    {npcMonologue}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-900/40 rounded-xl shadow-2xl flex flex-col overflow-hidden ${
        isMobile ? 'w-full h-full rounded-none' : 'w-[97%] max-w-8xl h-[72vh]'
      }`}>
        {/* Enhanced header with animated banner */}
        <div className="relative h-36 overflow-hidden shrink-0">
     
            <MarketplaceBanner
              era={era}
              culturalZone={culturalZone}
              condition={marketConditionDesc.includes('Thriving') || marketConditionDesc.includes('Bustling') ? 'prosperous' : 'humble'}
              climate={mapData.climate}
              season={season}
              tile={tile}
              mapData={mapData}
              timeOfDay={gameTimeHours < 6 ? 'Dawn' : gameTimeHours < 12 ? 'Morning' : gameTimeHours < 18 ? 'Midday' : gameTimeHours < 21 ? 'Evening' : 'Night'}
              seed={mapData.seed}
              width={1400}
              height={144}
              weather={weather}
            />
    

          {/* Optional, super-subtle vignette that WON’T darken the banner */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/10" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 bg-red-600/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg hover:scale-110 transition-all z-20"
            aria-label="Close marketplace"
          >
            ×
          </button>
        </div>

        
        {/* Enhanced marketplace header with better typography */}
        <div className="p-4 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-800/90 border-b border-amber-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                {marketplaceName}
              </h2>
              <p className="text-sm text-amber-200/70 mt-1">
                {mapData.localArea || mapData.continent || 'Unknown Lands'} • {marketConditionDesc}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-1 bg-slate-900/50 text-amber-200/60 rounded-md border border-slate-700/50">
                  🏛️ {era} Era
                </span>
                {marketAllegiance && (
                  <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 rounded-md border border-amber-700/50">
                    🏰 {marketAllegiance.name}
                  </span>
                )}
                <span className="text-xs px-2 py-1 bg-cyan-900/30 text-cyan-300 rounded-md border border-cyan-700/50">
                  🌍 {culturalZone}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-200/50 uppercase tracking-wide">Market Activity</p>
              <p className="text-lg font-bold text-amber-400">
                {merchantNpcs.length} Merchant{merchantNpcs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        
        {/* Enhanced tab navigation with historical theming */}
        <div className="flex bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 border-b border-amber-900/30">
          {[
            { id: 'buy', label: 'Browse Wares', icon: '🛒' },
            { id: 'sell', label: 'Sell Goods', icon: '💰' },
            { id: 'trade', label: 'Merchants', icon: '🤝' },
            { id: 'people', label: 'People', icon: '👥' },
            { id: 'info', label: 'Market Info', icon: '📜' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-3 px-4 font-medium transition-all relative group ${
                activeTab === tab.id
                  ? tab.id === 'buy' ? 'bg-gradient-to-t from-emerald-900/30 to-transparent text-emerald-400 border-b-2 border-emerald-400' :
                    tab.id === 'sell' ? 'bg-gradient-to-t from-amber-900/30 to-transparent text-amber-400 border-b-2 border-amber-400' :
                    tab.id === 'trade' ? 'bg-gradient-to-t from-purple-900/30 to-transparent text-purple-400 border-b-2 border-purple-400' :
                    tab.id === 'people' ? 'bg-gradient-to-t from-blue-900/30 to-transparent text-blue-400 border-b-2 border-blue-400' :
                    'bg-gradient-to-t from-cyan-900/30 to-transparent text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-amber-200/60 hover:text-amber-200 hover:bg-slate-700/30'
              }`}
            >
              <span className="inline-block transform group-hover:scale-110 transition-transform">
                {tab.icon}
              </span>
              <span className="ml-2">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent"></div>
              )}
            </button>
          ))}
        </div>
        
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
        
        {/* Enhanced footer with wallet and time */}
        <div className="p-4 border-t border-amber-900/30 bg-gradient-to-t from-slate-900/90 to-slate-800/70 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900/50 rounded-md px-3 py-2 border border-amber-700/30">
                <p className="text-xs text-amber-200/60 uppercase tracking-wide">Your Purse</p>
                <p className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  💰 {playerCharacter.currency} coins
                </p>
              </div>
              <div className="text-sm text-amber-200/50">
                <p>Season: {season}</p>
                <p>Time: {Math.floor(gameTimeHours)}:00</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-md font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-900/30"
            >
              Leave Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to categorize goods
function categorizeGood(itemId: string): TradeGood['category'] {
  const id = itemId.toLowerCase();
  
  if (id.includes('food') || id.includes('wheat') || id.includes('meat') || id.includes('fish') || 
      id.includes('bread') || id.includes('grain') || id.includes('fruit') || id.includes('vegetable')) {
    return 'food';
  }
  if (id.includes('tool') || id.includes('hammer') || id.includes('axe') || id.includes('shovel') ||
      id.includes('pick') || id.includes('saw') || id.includes('anvil')) {
    return 'tool';
  }
  if (id.includes('weapon') || id.includes('sword') || id.includes('spear') || id.includes('bow') ||
      id.includes('arrow') || id.includes('dagger') || id.includes('shield')) {
    return 'weapon';
  }
  if (id.includes('silk') || id.includes('jewelry') || id.includes('spice') || id.includes('gem') ||
      id.includes('perfume') || id.includes('ivory') || id.includes('fur')) {
    return 'luxury';
  }
  if (id.includes('ore') || id.includes('wood') || id.includes('cotton') || id.includes('wool') ||
      id.includes('leather') || id.includes('stone') || id.includes('clay')) {
    return 'raw_material';
  }
  
  return 'manufactured';
}

// Helper function to get seasonal price modifiers
function getSeasonalPriceModifier(itemId: string, season: Season): number {
  const id = itemId.toLowerCase();
  
  // Food prices increase in winter
  if (season === 'Winter' && categorizeGood(itemId) === 'food') {
    return 1.3;
  }
  
  // Fuel prices increase in winter
  if (season === 'Winter' && (id.includes('wood') || id.includes('coal'))) {
    return 1.4;
  }
  
  // Luxury goods cheaper in summer (more trade)
  if (season === 'Summer' && categorizeGood(itemId) === 'luxury') {
    return 0.9;
  }
  
  // Tools more expensive in spring (planting season)
  if (season === 'Spring' && categorizeGood(itemId) === 'tool') {
    return 1.2;
  }
  
  return 1.0;
}

// Helper function to get historically appropriate goods
function getHistoricalGoods(era: HistoricalEra, culture: CulturalZone, season: Season): TradeGood[] {
  const goods: TradeGood[] = [];
  
  // Base goods available in all eras
  const baseGoods = [
    { itemId: 'bread', name: 'bread', basePrice: 5, quantity: 50, quality: 'standard' as const, category: 'food' as const },
    { itemId: 'water', name: 'water', basePrice: 2, quantity: 100, quality: 'standard' as const, category: 'food' as const },
  ];
  
  // Era-specific goods
  if (era === 'Ancient') {
    goods.push(
      { itemId: 'amphora_wine', name: 'amphora of wine', basePrice: 25, quantity: 10, quality: 'fine' as const, category: 'luxury' as const },
      { itemId: 'bronze_sword', name: 'bronze sword', basePrice: 50, quantity: 5, quality: 'standard' as const, category: 'weapon' as const },
      { itemId: 'papyrus', name: 'papyrus scroll', basePrice: 15, quantity: 20, quality: 'standard' as const, category: 'manufactured' as const }
    );
  } else if (era === 'Medieval') {
    goods.push(
      { itemId: 'ale', name: 'barrel of ale', basePrice: 10, quantity: 30, quality: 'standard' as const, category: 'food' as const },
      { itemId: 'iron_sword', name: 'iron sword', basePrice: 75, quantity: 3, quality: 'standard' as const, category: 'weapon' as const },
      { itemId: 'wool_cloth', name: 'wool cloth', basePrice: 20, quantity: 15, quality: 'standard' as const, category: 'manufactured' as const }
    );
  } else if (era === 'Renaissance') {
    goods.push(
      { itemId: 'spices', name: 'exotic spices', basePrice: 100, quantity: 5, quality: 'fine' as const, category: 'luxury' as const },
      { itemId: 'musket', name: 'musket', basePrice: 150, quantity: 2, quality: 'standard' as const, category: 'weapon' as const },
      { itemId: 'printed_book', name: 'printed book', basePrice: 50, quantity: 8, quality: 'fine' as const, category: 'manufactured' as const }
    );
  } else if (era === 'Modern') {
    goods.push(
      { itemId: 'canned_food', name: 'canned goods', basePrice: 8, quantity: 100, quality: 'standard' as const, category: 'food' as const },
      { itemId: 'rifle', name: 'rifle', basePrice: 200, quantity: 4, quality: 'standard' as const, category: 'weapon' as const },
      { itemId: 'newspaper', name: 'newspaper', basePrice: 1, quantity: 200, quality: 'standard' as const, category: 'manufactured' as const }
    );
  }
  
  // Culture-specific goods
  if (culture === 'Europe') {
    goods.push(
      { itemId: 'cheese', name: 'wheel of cheese', basePrice: 12, quantity: 20, quality: 'standard' as const, category: 'food' as const }
    );
  } else if (culture === 'MENA') {
    goods.push(
      { itemId: 'dates', name: 'basket of dates', basePrice: 8, quantity: 30, quality: 'standard' as const, category: 'food' as const },
      { itemId: 'carpets', name: 'ornate carpet', basePrice: 80, quantity: 3, quality: 'fine' as const, category: 'luxury' as const }
    );
  } else if (culture === 'Asia') {
    goods.push(
      { itemId: 'rice', name: 'sack of rice', basePrice: 10, quantity: 40, quality: 'standard' as const, category: 'food' as const },
      { itemId: 'silk', name: 'bolt of silk', basePrice: 60, quantity: 5, quality: 'fine' as const, category: 'luxury' as const }
    );
  }
  
  return [...baseGoods, ...goods];
}

export default MarketplaceModal;