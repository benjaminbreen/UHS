/**
 * Improved Marketplace Modal
 * Enhanced UI, mobile optimization, and economic integration
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tile, PlayerCharacter, Item, MapData, MapAnalysisData, Season, HistoricalEra, ClimateType, CulturalZone, TimeOfDay, NpcEntity, TerrainStructure, BiomeType } from '../types';
import { ITEM_DEFINITIONS, ANIMAL_DATA } from '../constants/index';
import { tradeService, TradeGood, MarketConditions } from '../services/tradeService';
import { culturalMarketplaceService, CulturalMarketGood } from '../services/culturalMarketplaceService';
import { dynamicPricingEngine } from '../services/dynamicPricingEngine';
import MarketplaceBanner, { Condition } from './MarketplaceBanner';
import { generateMarketplaceDescription, CitySize } from '../services/marketplaceDescriptionGenerator';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { loadTamedAnimals, removeFromParty, TamedAnimal } from '../services/animalTamingService';
import { loadFactionData } from '../utils/dataLoader';
import { AllegianceGroup } from '../constants/gameData/factions/types';
import { WeatherState, weatherService } from '../services/weatherService';
import { ProceduralPortrait } from './portraits';
import { AttributeBadgeList } from './AttributeBadge';
import { generateNpcGreeting, generateNpcResponse, generateNpcMonologue, createDialogueContext } from '../services/npcDialogueService';
import { questService } from '../services/questService';
import { llmQuestService } from '../services/llmQuestService';
import { Quest } from '../types/questTypes';
import { unifiedQuestPipeline, QuestGenerationContext } from '../services/unifiedQuestPipeline';
import { worldEntityRegistry } from '../services/worldEntityRegistry';
import { Sparkles, ScrollText, Package, TrendingUp, AlertTriangle, Calendar, Award, Search, X } from 'lucide-react';
import { marketEventSystem } from '../services/marketEventSystem';
import { npcMarketParticipationService } from '../services/npcMarketParticipationService';
import { marketVolatilityService } from '../services/marketVolatilityService';
import { crisisDetectionService, ActiveMarketCrisis } from '../services/crisisDetectionService';
import { merchantMemoryService } from '../services/merchantMemoryService';
import { merchantBehaviorService, MerchantBehavior } from '../services/merchantBehaviorService';
import { priceHistoryService, PriceComparison, MarketTrend } from '../services/priceHistoryService';
import { economicVictoryService, EconomicMilestone, EconomicAchievement } from '../services/economicVictoryService';
import { useUI } from '../contexts/UIContext';

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
  onAddPersistedNpc?: (npc: NpcEntity) => void;
  currentMapSeed: number;
}

type TabType = 'buy' | 'sell' | 'trade' | 'people' | 'info' | 'analysis';
type CategoryFilter = 'all' | 'food' | 'tool' | 'weapon' | 'luxury' | 'raw_material' | 'manufactured' | 'religious' | 'medicine';

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  tile, playerCharacter, mapData, npcs, mapAnalysisData, gameTimeHours, season,
  onClose, onBuy, onSell, weather, onAddPersistedNpc, currentMapSeed
}) => {
  const { showToast } = useUI();
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
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
  const [npcQuests, setNpcQuests] = useState<Map<string, Quest[]>>(new Map());
  const [showQuestOffer, setShowQuestOffer] = useState<{ npc: NpcEntity; quest: Quest } | null>(null);
  const [questGenerating, setQuestGenerating] = useState<Set<string>>(new Set());
  const [volatilityTrends, setVolatilityTrends] = useState<any[]>([]);
  const [volatilityEvents, setVolatilityEvents] = useState<any[]>([]);
  const [marketCycle, setMarketCycle] = useState<any | null>(null);
  const [visitingNpcs, setVisitingNpcs] = useState<NpcEntity[]>([]);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [activeCrises, setActiveCrises] = useState<ActiveMarketCrisis[]>([]);
  const [economicQuests, setEconomicQuests] = useState<Quest[]>([]);
  const [merchantBehaviors, setMerchantBehaviors] = useState<Map<string, MerchantBehavior>>(new Map());
  const [priceComparisons, setPriceComparisons] = useState<PriceComparison[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend | null>(null);
  const [victoryProgress, setVictoryProgress] = useState<any>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [latestAchievement, setLatestAchievement] = useState<EconomicAchievement | null>(null);
  const [latestMilestone, setLatestMilestone] = useState<EconomicMilestone | null>(null);
  const [dismissedCrises, setDismissedCrises] = useState<Set<string>>(new Set());
  const [marketplaceDataLoading, setMarketplaceDataLoading] = useState(true);
  
  // Detect mobile
  const isMobile = useMemo(() => window.innerWidth <= 768, []);
  
  // Load dismissed crises from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissedMarketCrises');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedCrises(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse dismissed crises:', e);
      }
    }
  }, []);
  
  // Check for expired crisis quests periodically
  useEffect(() => {
    const interval = setInterval(() => {
      questService.checkExpiredQuests();
      // Force re-render to update timers
      setEconomicQuests(prev => [...prev]);
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Check if an item is related to any active quest
  const isQuestItem = useCallback((itemId: string): { isQuest: boolean; questName?: string; action?: 'buy' | 'sell' } => {
    const normalizedItemId = itemId.toLowerCase();
    const activeQuests = questService.getActiveQuests();
    
    for (const quest of activeQuests) {
      for (const objective of quest.objectives) {
        if (objective.completed) continue;
        
        const targetItem = ((objective as any).targetItem || (objective as any).itemId || '').toLowerCase();
        
        // Check for buy objectives
        if ((objective.type === 'deliver_item' || objective.type === 'collect_item') && targetItem === normalizedItemId) {
          return { isQuest: true, questName: quest.title, action: 'buy' };
        }
        
        // Check for sell objectives
        if ((objective.type === 'trade' || objective.type === 'sell_item') && targetItem === normalizedItemId) {
          return { isQuest: true, questName: quest.title, action: 'sell' };
        }
        
        // Check economic quest context
        if ((quest as any).isEconomicQuest) {
          const context = (quest as any).economicContext;
          if (context) {
            if (context.itemScarcity && context.itemScarcity.map((id: string) => id.toLowerCase()).includes(normalizedItemId)) {
              return { isQuest: true, questName: quest.title, action: 'buy' };
            }
            if (context.itemSurplus && context.itemSurplus.map((id: string) => id.toLowerCase()).includes(normalizedItemId)) {
              return { isQuest: true, questName: quest.title, action: 'sell' };
            }
          }
        }
      }
    }
    
    return { isQuest: false };
  }, []);
  
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
  
  // Convert gameTimeHours to proper TimeOfDay literal
  const timeOfDay = useMemo((): TimeOfDay => {
    if (gameTimeHours < 6) return 'Dawn';
    else if (gameTimeHours < 10) return 'Morning';
    else if (gameTimeHours < 14) return 'Midday';
    else if (gameTimeHours < 17) return 'Afternoon';
    else if (gameTimeHours < 21) return 'Dusk';
    else return 'Night';
  }, [gameTimeHours]);
  
  // Compute weather if not provided
  const computedWeather = useMemo(() => {
    if (weather) return weather;
    
    // Get a reasonable default biome if tile doesn't have one (shouldn't happen)
    const biome = tile.biome || BiomeType.GRASSLAND;
    const climate = mapData.climate || ClimateType.TEMPERATE;
    const altitude = tile.altitude || 0.5;
    const dayOfYear = 180; // Default to middle of year
    
    return weatherService.getWeather(
      climate,
      biome,
      season,
      timeOfDay,
      altitude,
      dayOfYear,
      { x: tile.x, y: tile.y }
    );
  }, [weather, tile, mapData.climate, season, timeOfDay]);
  
  // Check which NPCs have quests available
  useEffect(() => {
    const generateQuests = async () => {
      try {
        const activeQuests = questService.getActiveQuests();
        const questsByNpc = new Map<string, Quest[]>();
      
      // Check for already active quests from these NPCs
      const activeQuestGivers = new Set(activeQuests.map(q => q.giver).filter(Boolean));
      
      // First, assign economic quests to merchants using merchantId
      for (const quest of economicQuests) {
        const merchantId = (quest as any).merchantId;
        const merchantName = (quest as any).merchantName || quest.giver;
        
        // Try to match by ID first, then by name
        const merchant = merchantId 
          ? merchantNpcs.find(m => m.id === merchantId)
          : merchantNpcs.find(m => m.name === merchantName);
          
        if (merchant && !activeQuestGivers.has(merchant.name)) {
          const existing = questsByNpc.get(merchant.id) || [];
          existing.push(quest);
          questsByNpc.set(merchant.id, existing);
          console.log(`[Marketplace] Assigned quest "${quest.title}" to merchant ${merchant.name}`);
        }
      }
      
      // Generate additional potential quests for merchants without economic quests
      for (const merchant of merchantNpcs) {
        // Skip if merchant already has an active quest or economic quest
        if (activeQuestGivers.has(merchant.name) || questsByNpc.has(merchant.id)) {
          continue;
        }
        
        // Check if merchant could offer a trade quest
        if (Math.random() < 0.2) { // 20% chance (reduced since we have economic quests)
          setQuestGenerating(prev => new Set(prev).add(merchant.id));
          const potentialQuest = await generateMerchantQuest(merchant, tile, mapData);
          setQuestGenerating(prev => {
            const next = new Set(prev);
            next.delete(merchant.id);
            return next;
          });
          
          if (potentialQuest) {
            const existing = questsByNpc.get(merchant.id) || [];
            existing.push(potentialQuest);
            questsByNpc.set(merchant.id, existing);
          }
        }
      }
      
      // Check if any inhabitants have quest opportunities
      for (const npc of inhabitantsNpcs) {
        if (activeQuestGivers.has(npc.name)) {
          continue;
        }
        
        if (Math.random() < 0.2) { // 20% chance for regular NPCs
          const potentialQuest = await generateNpcQuest(npc, tile, mapData);
          if (potentialQuest) {
            const existing = questsByNpc.get(npc.id) || [];
            existing.push(potentialQuest);
            questsByNpc.set(npc.id, existing);
          }
        }
      }
      
        setNpcQuests(questsByNpc);
      } catch (error) {
        console.error('[Marketplace] Error generating NPC quests:', error);
        setNpcQuests(new Map()); // Fallback to empty map
      }
    };
    
    generateQuests();
  }, [merchantNpcs, inhabitantsNpcs, tile, mapData, economicQuests]);
  
  // Generate merchant-specific quest
  const generateMerchantQuest = async (merchant: NpcEntity, location: Tile, map: MapData): Promise<Quest | null> => {
    try {
      // Check if merchant remembers the player
      const memory = llmQuestService.getMerchantMemory(merchant.id, playerCharacter.id);
      
      // Add memory context to merchant
      if (memory) {
        merchant = {
          ...merchant,
          dialogueMemory: memory.notes || [],
          relationship: memory.relationship
        };
      }
      
      // Try LLM generation first
      const llmQuest = await llmQuestService.generateContextualQuest(
        merchant,
        playerCharacter,
        map,
        mapData.terrainStructures || [],
        { x: location.x, y: location.y }
      );
      
      if (llmQuest) {
        // Track API usage
        eventService.trackAPICall('quest_generation', JSON.stringify(llmQuest));
        return llmQuest;
      }
    } catch (error) {
      console.warn('[MarketplaceModal] LLM quest generation failed, falling back to procedural:', error);
    }
    
    // Fallback to procedural quest generation
    const questTypes = [
      {
        title: `${merchant.name}'s Special Order`,
        description: `${merchant.name} needs help acquiring rare goods for an important client.`,
        type: 'trade' as const,
        objectives: [{
          id: 'obj_1',
          type: 'collect_item' as const,
          description: 'Find and bring back 3 units of silk',
          targetItem: 'silk',
          targetAmount: 3,
          completed: false
        }],
        rewards: [{
          type: 'currency' as const,
          amount: 100,
          description: '100 coins'
        }]
      },
      {
        title: 'Delivery Request',
        description: `${merchant.name} needs someone trustworthy to deliver goods to a nearby settlement.`,
        type: 'trade' as const,
        objectives: [{
          id: 'obj_1',
          type: 'deliver_item' as const,
          description: 'Deliver the package to the eastern hamlet',
          targetLocation: { x: location.x + 10, y: location.y },
          completed: false
        }],
        rewards: [{
          type: 'reputation' as const,
          amount: 15,
          description: 'Merchant reputation +15'
        }]
      }
    ];
    
    const questTemplate = questTypes[Math.floor(Math.random() * questTypes.length)];
    
    return {
      id: `quest_merchant_${merchant.id}_${Date.now()}`,
      title: questTemplate.title,
      description: questTemplate.description,
      category: questTemplate.type,
      objectives: questTemplate.objectives,
      currentObjectiveIndex: 0,
      rewards: questTemplate.rewards,
      giver: merchant.name,
      giverLocation: { x: location.x, y: location.y },
      startLocation: { x: location.x, y: location.y },
      startTime: Date.now(),
      status: 'available' as const,
      isLLMGenerated: false
    };
  };
  
  // Generate NPC quest using unified pipeline for historical accuracy
  const generateNpcQuest = async (npc: NpcEntity, location: Tile, map: MapData): Promise<Quest | null> => {
    try {
      // Determine era and cultural zone
      const year = mapData.year || 1500;
      const dateInfo = parseDateString(String(year));
      const currentZone = mapData.zone || 'Europe';
      const culturalZone = mapLocationToCulture(currentZone, year);
      
      // Build quest generation context
      const context: QuestGenerationContext = {
        mapData: map,
        playerLocation: { x: location.x, y: location.y },
        playerStats: {
          health: playerCharacter.health || 50,
          reputation: playerCharacter.reputation || 10,
          wealth: playerCharacter.currency || 10,
          intelligence: playerCharacter.stats?.intelligence || 10,
          strength: playerCharacter.stats?.strength || 10
        },
        zone: culturalZone,
        era: dateInfo.era,
        year: year,
        season: season,
        gameMode: 'commerce', // Marketplace context suggests commerce mode
        triggerType: 'npc',
        triggerEntity: npc.id,
        nearbyStructures: mapData.terrainStructures || [],
        nearbyNPCs: npcs
      };

      // Generate quest through unified pipeline
      const quest = await unifiedQuestPipeline.generateQuest(context);
      
      if (quest) {
        // Customize quest to come from this specific NPC
        quest.giver = npc.name;
        quest.giverLocation = { x: npc.x, y: npc.y };
        quest.status = 'available' as const;
        
        // Ensure the first objective references the NPC if it's a social quest
        if (quest.category === 'social' && quest.objectives.length > 0) {
          quest.objectives[0].targetNpcId = npc.id;
          quest.objectives[0].targetNpcName = npc.name;
        }
        
        return quest;
      }
    } catch (error) {
      console.warn('[MarketplaceModal] Failed to generate unified quest:', error);
    }
    
    // Fallback to simple quest if unified pipeline fails
    return {
      id: `quest_${npc.id}_${Date.now()}`,
      title: 'Local Request',
      description: `${npc.name} needs assistance with a local matter.`,
      historicalContext: `Marketplace interactions often led to opportunities for trade and service.`,
      category: 'social',
      giver: npc.name,
      giverLocation: { x: npc.x, y: npc.y },
      objectives: [{
        id: 'obj_1',
        type: 'talk_to_npc',
        description: `Speak with ${npc.name} about their needs`,
        targetNpcId: npc.id,
        targetNpcName: npc.name,
        targetLocation: { x: npc.x, y: npc.y },
        completed: false
      }],
      currentObjectiveIndex: 0,
      rewards: [{
        type: 'reputation',
        amount: 5,
        description: 'Local reputation +5'
      }],
      startLocation: { x: location.x, y: location.y },
      startTime: Date.now(),
      status: 'available' as const,
      isLLMGenerated: false
    };
  };

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
    console.log('[MarketplaceModal] Total NPCs received:', npcs.length);
    console.log('[MarketplaceModal] NPC roles:', npcs.map(n => ({ name: n.name, role: n.role })));
    
    const merchants = npcs.filter(npc => 
      npc.role?.toLowerCase().includes('merchant') ||
      npc.role?.toLowerCase().includes('trader') ||
      npc.role?.toLowerCase().includes('vendor')
    );
    
    console.log('[MarketplaceModal] Filtered merchants:', merchants.length);
    console.log('[MarketplaceModal] Merchants found:', merchants.map(m => ({ name: m.name, role: m.role })));
    setMerchantNpcs(merchants);
    
    // Load tamed animals
    const animals = loadTamedAnimals();
    setTamedAnimals(animals);
    
    // Load faction data for custom marketplace names and allegiances
    const loadMarketplaceData = async () => {
      setMarketplaceDataLoading(true);
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
      } finally {
        setMarketplaceDataLoading(false);
      }
    };
    
    loadMarketplaceData();
  }, [tile, mapData, npcs, culturalZone, era]);
  
  // Check for active crises affecting this market and record price history
  useEffect(() => {
    const marketLocation = { x: tile.x, y: tile.y };
    const marketId = `market-${tile.x}-${tile.y}`;

    // For current session only - don't use persistent crises from localStorage
    // Get only crises that are currently active and relevant to this specific map location
    const crises = crisisDetectionService.getActiveCrisesForMarket(marketLocation);

    // Filter out old crises - only show those created recently (within last hour)
    const recentCrises = crises.filter(crisis => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
      return crisis.detectedAt > oneHourAgo;
    });

    setActiveCrises(recentCrises);
    console.log(`[Marketplace] Recent crises for current map:`, recentCrises);
    
    // Mark market visit for price comparison
    priceHistoryService.markMarketVisit(marketId);
    
    // Generate economic quests if appropriate
    if (questService.shouldGenerateEconomicQuests(marketLocation) && marketConditions) {
      // We need marketInventory data, but it's in a useMemo - we'll generate after inventory is ready
      console.log(`[Marketplace] Should generate economic quests for crises`);
    }
  }, [tile, marketConditions]);

  // Generate culturally-aware market inventory with biome integration
  const marketInventory = useMemo(() => {
    // Get region name from map data
    const region = mapData.geography || 'Unknown Region';
    const climate = mapData.climate || ClimateType.TEMPERATE;
    
    // Generate comprehensive marketplace using cultural service
    let culturalGoods = culturalMarketplaceService.generateCulturalMarketplace(
      mapData,
      era,
      culturalZone,
      region,
      climate,
      npcs
    );
    
    // Phase 2: Dynamic marketplace features
    
    // Apply seasonal and event-driven changes
    const seasonalChanges = marketEventSystem.processMarketEvents(
      mapData,
      era,
      culturalZone,
      season,
      climate,
      gameTimeHours,
      culturalGoods
    );
    culturalGoods = seasonalChanges.updatedMarketplace;
    
    // Apply market volatility and trends
    const volatilityResults = marketVolatilityService.updateMarketVolatility(
      culturalGoods,
      mapData,
      npcs,
      gameTimeHours,
      culturalZone,
      era,
      climate
    );
    culturalGoods = volatilityResults.updatedMarketplace;
    
    // Process NPC market participation
    const npcParticipation = npcMarketParticipationService.processMarketParticipation(
      npcs,
      culturalGoods,
      mapData,
      season,
      gameTimeHours,
      culturalZone,
      era
    );
    culturalGoods = npcParticipation.updatedMarketplace;
    
    // Store service results to update state later (moved out of useMemo)
    (window as any).__marketServiceResults = {
      volatilityResults,
      npcParticipation
    };
    
    // Apply dynamic pricing to all goods
    culturalGoods = culturalGoods.map(good => {
      const pricingResult = dynamicPricingEngine.calculatePrice(
        good,
        mapData,
        npcs,
        season,
        gameTimeHours,
        culturalZone,
        era
      );
      return {
        ...good,
        basePrice: pricingResult.price,
        pricingFactors: pricingResult.factors,
        priceExplanation: pricingResult.explanation
      };
    });
    
    // Apply crisis effects to prices and quantities
    const marketLocation = { x: tile.x, y: tile.y };
    const crisisEffects = crisisDetectionService.calculateMarketEffects(marketLocation);
    
    if (crisisEffects.size > 0) {
      culturalGoods = culturalGoods.map(good => {
        const effect = crisisEffects.get(good.category);
        if (effect) {
          return {
            ...good,
            basePrice: Math.round(good.basePrice * effect.priceMultiplier),
            currentPrice: Math.round(good.currentPrice * effect.priceMultiplier),
            quantity: Math.round(good.quantity * effect.quantityMultiplier),
            crisisAffected: true
          };
        }
        return good;
      });
    }
    
    // Convert cultural goods to trade goods format and apply filters
    // Track seen item names to handle duplicates
    const seenItems = new Map<string, number>();
    
    const goods: TradeGood[] = culturalGoods.map(culturalGood => {
      let displayName = culturalGood.culturalName || culturalGood.name;
      
      // Check if we've seen this exact name before
      const baseName = displayName.toLowerCase();
      const count = seenItems.get(baseName) || 0;
      seenItems.set(baseName, count + 1);
      
      // If duplicate, differentiate by origin or quality
      if (count > 0) {
        if (culturalGood.origin === 'regional') {
          displayName = `Fine ${displayName}`;
        } else if (culturalGood.origin === 'distant') {
          displayName = `Imported ${displayName}`;
        } else if (culturalGood.origin === 'exotic') {
          displayName = `Exotic ${displayName}`;
        } else if (culturalGood.quality === 'fine' || culturalGood.quality === 'exceptional') {
          displayName = `Superior ${displayName}`;
        } else {
          displayName = `${displayName} (Variant)`;
        }
      }
      
      return {
        itemId: culturalGood.itemId,
        name: displayName,
        basePrice: culturalGood.basePrice,
        currentPrice: culturalGood.currentPrice,
        quantity: culturalGood.quantity,
        quality: culturalGood.quality,
        origin: culturalGood.origin,
        category: culturalGood.category as any
      };
    });
    
    // Add goods from existing merchant NPCs to maintain compatibility
    merchantNpcs.forEach(merchant => {
      const merchantGoods = tradeService.generateNpcTradeGoods(merchant, mapData);
      goods.push(...merchantGoods.map(good => ({
        ...good,
        quality: merchant.wealthLevel === 'wealthy' ? 'fine' : 
                 merchant.wealthLevel === 'poor' ? 'poor' : 'standard'
      })));
    });
    
    // Filter and search
    const filtered = goods.filter(good => {
      if (categoryFilter !== 'all' && good.category !== categoryFilter) return false;
      if (searchQuery && !good.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    
    return filtered;
  }, [marketConditions, merchantNpcs, mapData, categoryFilter, searchQuery, era, culturalZone, season, npcs]);
  
  // Update state from market service results (moved out of useMemo to prevent infinite re-renders)
  useEffect(() => {
    const results = (window as any).__marketServiceResults;
    if (results) {
      try {
        setVolatilityTrends(results.volatilityResults?.trends || []);
        setVolatilityEvents(results.volatilityResults?.volatilityEvents || []);
        setMarketCycle(results.volatilityResults?.marketCycle || null);
        setVisitingNpcs(results.npcParticipation?.visitingNpcs || []);
        
        // Clean up temporary storage
        delete (window as any).__marketServiceResults;
      } catch (error) {
        console.error('[Marketplace] Error updating service results:', error);
        // Set safe defaults
        setVolatilityTrends([]);
        setVolatilityEvents([]);
        setMarketCycle(null);
        setVisitingNpcs([]);
      }
    }
  }, [marketInventory]); // Only depend on marketInventory changes
  
  // Generate economic quests based on market conditions and crises
  useEffect(() => {
    if (!marketConditions || !marketInventory || merchantNpcs.length === 0) return;
    
    const marketLocation = { x: tile.x, y: tile.y };
    
    // First check if there are already active economic quests for this market
    const existingEconomicQuests = questService.getActiveEconomicQuests(marketLocation);
    if (existingEconomicQuests.length > 0) {
      setEconomicQuests(existingEconomicQuests);
      console.log(`[Marketplace] Found ${existingEconomicQuests.length} existing economic quests`);
      return;
    }
    
    // Check if we should generate new economic quests
    if (questService.shouldGenerateEconomicQuests(marketLocation)) {
      const quests = questService.generateEconomicQuests(
        marketConditions,
        marketInventory,
        merchantNpcs,
        mapData,
        marketLocation
      );
      
      // Add economic quests to the active quest system
      quests.forEach(quest => {
        questService.addQuest(quest);
      });
      
      setEconomicQuests(quests);
      questService.markEconomicQuestsGenerated(marketLocation);
      
      if (quests.length > 0) {
        console.log(`[Marketplace] Generated ${quests.length} economic quests and added to active quests`);
      }
    }
  }, [marketInventory, marketConditions, merchantNpcs, mapData, tile, activeCrises]);
  
  // Load merchant behaviors and apply relationship modifiers
  useEffect(() => {
    if (merchantNpcs.length === 0) return;
    
    const behaviors = new Map<string, MerchantBehavior>();
    const marketLocation = { x: tile.x, y: tile.y };
    
    merchantNpcs.forEach(merchant => {
      const behavior = merchantBehaviorService.getMerchantBehavior(
        merchant,
        playerCharacter.id,
        marketLocation
      );
      behaviors.set(merchant.id, behavior);
      
      // Get memory for relationship info
      const memory = merchantMemoryService.getMerchantMemory(merchant, playerCharacter.id);
      const stats = merchantMemoryService.getTradeStatistics(merchant.id, playerCharacter.id);
      
      console.log(`[Marketplace] ${merchant.name}:`, {
        trustLevel: memory.trustLevel,
        reputation: memory.economicReputation,
        strategy: behavior.strategy,
        priceModifier: behavior.priceAdjustment * memory.priceModifier,
        totalTrades: stats.totalTrades
      });
    });
    
    setMerchantBehaviors(behaviors);
  }, [merchantNpcs, playerCharacter.id, tile, activeCrises]);
  
  // Record price snapshot and generate comparisons
  useEffect(() => {
    if (marketInventory.length === 0) return;
    
    const marketId = `market-${tile.x}-${tile.y}`;
    const gameDate = {
      year: parseInt(mapData.timeSlice || '1500'),
      month: Math.floor(gameTimeHours / (24 * 30)) % 12 + 1,
      day: Math.floor(gameTimeHours / 24) % 30 + 1
    };
    
    // Record snapshot
    priceHistoryService.recordSnapshot(
      marketId,
      marketInventory,
      gameDate,
      {
        activeCrises: activeCrises.map(c => c.pattern.id),
        volatilityLevel: volatilityEvents.length,
        marketCycle: marketCycle?.stage || 'stable'
      }
    );
    
    // Get price comparisons
    const comparisons = priceHistoryService.getPriceComparisons(marketId, marketInventory);
    setPriceComparisons(comparisons);
    
    // Get market trends
    const trends = priceHistoryService.getMarketTrends(marketId, '7d');
    setMarketTrends(trends);
    
    console.log(`[PriceHistory] Recorded snapshot, ${comparisons.length} comparisons available`);
  }, [marketInventory, tile, mapData.timeSlice, gameTimeHours, activeCrises, volatilityEvents, marketCycle]);
  
  // Skip economic victory tracking - feature not implemented
  useEffect(() => {
    // Economic victory system is not implemented yet
    // const progress = economicVictoryService.getVictoryProgress();
    // setVictoryProgress(progress);
    
    // Listen for quest completions to show rewards
    const handleQuestCompleted = (e: CustomEvent) => {
      const { quest, rewards } = e.detail;
      
      // Check if it's an economic quest completed in this marketplace
      if ((quest as any).isEconomicQuest) {
        // Show reward notification
        let rewardMessage = `✅ Quest "${quest.title}" completed!`;
        if (rewards && rewards.totalValue > 0) {
          rewardMessage += ` Earned ${rewards.totalValue} coins`;
        }
        if (rewards && rewards.items && rewards.items.length > 0) {
          rewardMessage += ` and ${rewards.items.length} item(s)`;
        }
        
        showToast(rewardMessage);
        
        // Refresh economic quests to remove completed one
        const marketLocation = { x: tile.x, y: tile.y };
        const updatedQuests = questService.getActiveEconomicQuests(marketLocation);
        setEconomicQuests(updatedQuests);
      }
    };
    
    // Only listen for quest completions (economic victory events removed)
    window.addEventListener('questCompleted', handleQuestCompleted as any);

    return () => {
      window.removeEventListener('questCompleted', handleQuestCompleted as any);
    };
  }, [playerCharacter.currency, tile, showToast]);
  
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
  const handleBuy = useCallback((good: TradeGood, merchantId?: string) => {
    if (playerCharacter.currency >= good.currentPrice) {
      onBuy(good.itemId, good.currentPrice);
      
      // Record transaction in merchant memory
      if (merchantId) {
        const merchant = merchantNpcs.find(m => m.id === merchantId);
        if (merchant) {
          merchantMemoryService.recordTransaction(
            merchant,
            playerCharacter.id,
            { id: good.itemId, name: good.name, baseId: good.itemId },
            'buy',
            good.currentPrice,
            1,
            good.basePrice || good.currentPrice
          );
          
          // Update behavior after transaction
          const newBehavior = merchantBehaviorService.getMerchantBehavior(
            merchant,
            playerCharacter.id,
            { x: tile.x, y: tile.y }
          );
          setMerchantBehaviors(prev => new Map(prev).set(merchantId, newBehavior));
          
          // Update economic victory progress
          economicVictoryService.updateTradeProgress(
            'buy',
            good.currentPrice,
            undefined,
            merchantId,
            good.itemId,
            1,
            activeCrises.length > 0
          );
          economicVictoryService.updateMerchantRelationship(merchantId, playerCharacter.id);
        }
      }
      
      // Check if this completes any quest objectives (normalize item ID)
      const normalizedItemId = good.itemId.toLowerCase().replace(/\s+/g, '_');
      questService.checkTradeObjective(
        'buy',
        normalizedItemId,
        1,
        merchantId,
        { x: tile.x, y: tile.y }
      );
      // Also check with original ID in case quest uses that
      questService.checkTradeObjective(
        'buy',
        good.itemId,
        1,
        merchantId,
        { x: tile.x, y: tile.y }
      );
      
      // Update market conditions
      if (marketConditions) {
        const currentSupply = marketConditions.supply.get(good.itemId) || 0;
        marketConditions.supply.set(good.itemId, Math.max(0, currentSupply - 1));
      }
    }
  }, [playerCharacter, onBuy, marketConditions, merchantNpcs, tile, activeCrises]);
  
  // Handle sell action (items and animals)
  const handleSell = useCallback((item: any, merchantId?: string) => {
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
      
      // Record transaction in merchant memory and victory progress
      if (merchantId) {
        const merchant = merchantNpcs.find(m => m.id === merchantId);
        if (merchant) {
          merchantMemoryService.recordTransaction(
            merchant,
            playerCharacter.id,
            item,
            'sell',
            item.sellPrice,
            1,
            item.value || item.sellPrice
          );
          
          // Update economic victory progress
          const profit = item.sellPrice - (item.value || item.sellPrice);
          economicVictoryService.updateTradeProgress(
            'sell',
            item.sellPrice,
            profit,
            merchantId,
            item.baseId,
            1,
            activeCrises.length > 0
          );
        }
      }
    }
    
    // Check if this completes any quest objectives (normalize item ID)
    const itemId = item.baseId || item.id;
    const normalizedItemId = itemId.toLowerCase().replace(/\s+/g, '_');
    questService.checkTradeObjective(
      'sell',
      normalizedItemId,
      1,
      merchantId,
      { x: tile.x, y: tile.y }
    );
    // Also check with original ID in case quest uses that
    questService.checkTradeObjective(
      'sell',
      itemId,
      1,
      merchantId,
      { x: tile.x, y: tile.y }
    );
    
    // Update market conditions
    if (marketConditions) {
      const currentSupply = marketConditions.supply.get(item.baseId) || 0;
      marketConditions.supply.set(item.baseId, currentSupply + 1);
    }
  }, [onSell, marketConditions, tile]);

  // Handle NPC greeting/interaction
  const handleNpcClick = useCallback(async (npc: NpcEntity) => {
    setSelectedNpc(npc);
    setNpcDialogueLoading(true);
    setNpcDialogue('');
    
    try {
      const context = createDialogueContext(mapData, {
        isMarketplace: true,
        timeOfDay: timeOfDay.toLowerCase(),
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
  }, [mapData, timeOfDay, season, playerCharacter]);

  // Handle quest offer
  const handleQuestOffer = useCallback((npc: NpcEntity, quest: Quest) => {
    setShowQuestOffer({ npc, quest });
  }, []);
  
  // Accept quest from NPC
  const acceptQuest = useCallback((quest: Quest) => {
    // Add quest to the quest service
    questService.addQuest({
      ...quest,
      status: 'active',
      acceptedTime: Date.now()
    });
    
    // If this is from a merchant, persist them to the current map
    if (showQuestOffer?.npc && onAddPersistedNpc) {
      // Persist the merchant now that quest is accepted - using current map seed
      llmQuestService.persistMerchant(showQuestOffer.npc, { x: tile.x, y: tile.y }, currentMapSeed);

      // Get the persisted version for this map
      const persistedMerchants = llmQuestService.getPersistedMerchants(currentMapSeed);
      const persistedNpc = persistedMerchants.find(m => m.id === showQuestOffer.npc.id);

      if (persistedNpc) {
        onAddPersistedNpc(persistedNpc);
        console.log(`[MarketplaceModal] Merchant ${persistedNpc.name} will now appear on map ${currentMapSeed}`);
      }
    }
    
    // Close the quest offer modal
    setShowQuestOffer(null);
    
    // Show confirmation
    console.log(`Quest accepted: ${quest.title}`);
  }, [showQuestOffer, onAddPersistedNpc, tile]);

  // Handle portrait click for monologue
  const handlePortraitClick = useCallback(async (npc: NpcEntity) => {
    const currentCount = (portraitClickCounts[npc.id] || 0) + 1;
    setPortraitClickCounts(prev => ({ ...prev, [npc.id]: currentCount }));
    
    if (currentCount <= 3) { // Allow up to 3 clicks
      try {
        const context = createDialogueContext(mapData, {
          isMarketplace: true,
          timeOfDay: timeOfDay.toLowerCase(),
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
  }, [portraitClickCounts, mapData, timeOfDay, season]);
  
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
            {/* Compact category filters with search icon */}
            <div className="px-4 py-2 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-amber-900/30">
              <div className="flex gap-1.5 items-center">
                {/* Category buttons */}
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {[
                    { id: 'all', label: 'All Goods', icon: '📦' },
                    { id: 'food', label: 'Provisions', icon: '🍞' },
                    { id: 'tool', label: 'Tools', icon: '🔨' },
                    { id: 'weapon', label: 'Arms', icon: '⚔️' },
                    { id: 'luxury', label: 'Luxuries', icon: '💎' },
                    { id: 'raw_material', label: 'Raw Goods', icon: '🪵' },
                    { id: 'medicine', label: 'Remedies', icon: '🧪' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all transform hover:scale-105 ${
                        categoryFilter === cat.id
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40'
                          : 'bg-slate-800/70 text-amber-200/70 hover:bg-slate-700/70 hover:text-amber-200 border border-slate-700/50'
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      <span className="hidden sm:inline">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Search section - expandable */}
                {searchExpanded ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-32 sm:w-48 px-3 py-1.5 bg-slate-900/60 border border-amber-900/30 rounded-md text-sm text-amber-50 placeholder-amber-200/40 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setSearchExpanded(false);
                        setSearchQuery('');
                      }}
                      className="p-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchExpanded(true)}
                    className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800/50 rounded-md transition-all"
                    title="Search items"
                  >
                    <Search size={18} />
                  </button>
                )}
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
                  {marketInventory.map((good, index) => {
                    const questInfo = isQuestItem(good.itemId);
                    return (
                    <div
                      key={`${good.itemId}-${index}`}
                      className={`group bg-gradient-to-br from-slate-800/80 to-slate-900/60 border rounded-md p-4 hover:shadow-lg transition-all duration-200 backdrop-blur-sm ${
                        questInfo.isQuest 
                          ? 'border-yellow-600/50 hover:border-yellow-500/70 hover:shadow-yellow-900/30' 
                          : (good as any).crisisAffected 
                            ? 'border-red-600/50 hover:border-red-500/70 hover:shadow-red-900/30' 
                            : 'border-slate-700/50 hover:border-amber-600/50 hover:shadow-amber-900/20'
                      }`}
                    >
                      {questInfo.isQuest && (
                        <div className="bg-gradient-to-r from-yellow-900/50 to-amber-900/30 rounded px-2 py-1 mb-2 flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">📋</span>
                          <span className="text-xs text-yellow-200 font-medium truncate" title={questInfo.questName}>
                            Quest: {questInfo.questName}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-amber-50 capitalize text-sm lg:text-base flex items-center gap-2">
                            {good.name}
                            {(good as any).crisisAffected && (
                              <span className="text-xs text-red-400 animate-pulse" title="Affected by crisis">
                                ⚠️
                              </span>
                            )}
                            {(() => {
                              const comparison = priceComparisons.find(c => c.itemId === good.itemId);
                              if (comparison?.trend && comparison.percentChange) {
                                return comparison.trend === 'up' ? (
                                  <span className="text-xs text-red-400" title={`Price up ${Math.abs(comparison.percentChange).toFixed(0)}% since yesterday`}>
                                    ↑
                                  </span>
                                ) : comparison.trend === 'down' ? (
                                  <span className="text-xs text-green-400" title={`Price down ${Math.abs(comparison.percentChange).toFixed(0)}% since yesterday`}>
                                    ↓
                                  </span>
                                ) : null;
                              }
                              return null;
                            })()}
                          </h4>
                          {good.origin && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span 
                                title={`Origin: ${good.origin === 'local' ? 'Produced locally, fresh and affordable' :
                                               good.origin === 'regional' ? 'From neighboring regions, moderate transport costs' :
                                               good.origin === 'distant' ? 'Imported from far lands, higher prices' :
                                               'Exotic goods from unknown lands, very expensive'}`}
                                className={`text-xs px-1.5 py-0.5 rounded cursor-help ${
                                good.origin === 'local' ? 'bg-green-900/30 text-green-300' :
                                good.origin === 'regional' ? 'bg-blue-900/30 text-blue-300' :
                                good.origin === 'distant' ? 'bg-purple-900/30 text-purple-300' :
                                'bg-orange-900/30 text-orange-300'
                              }`}>
                                {good.origin === 'local' ? '🏠 Local' :
                                 good.origin === 'regional' ? '🗺️ Regional' :
                                 good.origin === 'distant' ? '⛵ Distant' :
                                 '🌟 Exotic'}
                              </span>
                            </div>
                          )}
                        </div>
                        <span 
                          title={`Quality: ${good.quality === 'exceptional' ? 'Exceptional quality items are rare and highly sought after' : 
                                          good.quality === 'fine' ? 'Fine quality items are well-crafted and durable' :
                                          good.quality === 'poor' ? 'Poor quality items may break or spoil quickly' :
                                          'Standard quality items meet basic needs'}`}
                          className={`text-xs px-2 py-1 rounded-full font-medium cursor-help ${
                          good.quality === 'exceptional' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' :
                          good.quality === 'fine' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' :
                          good.quality === 'poor' ? 'bg-red-900/40 text-red-300 border border-red-700/50' :
                          'bg-slate-700/40 text-slate-300 border border-slate-600/50'
                        }`}>
                          {good.quality === 'exceptional' ? '✨ Exceptional' :
                           good.quality === 'fine' ? '⭐ Fine' :
                           good.quality === 'poor' ? '⚠️ Poor' :
                           'Standard'}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900/30 rounded-md p-2 mb-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-amber-200/60">Stock:</span>
                          <span className={`font-medium ${
                            good.quantity <= 5 ? 'text-red-400' :
                            good.quantity <= 15 ? 'text-yellow-400' :
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
                          {playerCharacter.currency >= good.currentPrice ? 'Buy' : 'Too Costly'}
                        </button>
                      </div>
                    </div>
                  )})}
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
                    
                    const questInfo = item.itemType !== 'animal' ? isQuestItem(item.baseId || item.id) : { isQuest: false };
                    
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between p-4 rounded-lg transition-all backdrop-blur-sm hover:shadow-lg ${
                          questInfo.isQuest
                            ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-600/50 hover:border-yellow-500/70 hover:shadow-yellow-900/30'
                            : item.itemType === 'animal' 
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
                              {questInfo.isQuest && questInfo.action === 'sell' && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-600/30 text-yellow-300 rounded-full border border-yellow-600/50">
                                  📋 Quest
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
                    
                    const hasQuest = npcQuests.has(merchant.id);
                    const quests = npcQuests.get(merchant.id) || [];
                    const questCount = quests.length;
                    const isGenerating = questGenerating.has(merchant.id);
                    const hasCrisisQuest = quests.some(q => (q as any).isEconomicQuest && (q as any).economicContext?.crisis);
                    
                    return (
                      <div
                        key={merchant.id}
                        className="group p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/60 border border-purple-700/30 rounded-lg hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-900/20 transition-all cursor-pointer backdrop-blur-sm relative"
                        onClick={() => setSelectedMerchant(merchant)}
                      >
                        {isGenerating && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                        {hasQuest && !isGenerating && (
                          <div className={`absolute -top-2 -right-2 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg ${
                            hasCrisisQuest 
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
                              : 'bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse'
                          }`}>
                            {hasCrisisQuest ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <ScrollText className="w-4 h-4" />
                            )}
                            {questCount > 1 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {questCount}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center border border-purple-700/50 group-hover:scale-110 transition-transform">
                              <span className="text-xl">{wealthIcon}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-amber-50 flex items-center gap-2">
                                {merchant.name}
                                {hasQuest && <span className="text-xs text-yellow-400">(Has Quest!)</span>}
                                {(() => {
                                  const memory = llmQuestService.getMerchantMemory(merchant.id, playerCharacter.id);
                                  if (memory && memory.relationship !== 'stranger') {
                                    const relationshipEmoji = 
                                      memory.relationship === 'trusted' ? '⭐' :
                                      memory.relationship === 'friend' ? '🤝' :
                                      memory.relationship === 'rival' ? '⚔️' : '👋';
                                    return <span className="text-xs" title={`Relationship: ${memory.relationship}`}>{relationshipEmoji}</span>;
                                  }
                                  return null;
                                })()}
                              </p>
                              <p className="text-sm text-amber-200/60">
                                {merchant.role}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 bg-gradient-to-r ${wealthColor} text-white rounded-full`}>
                                  {merchant.wealthLevel} merchant
                                </span>
                                {merchant.personality && typeof merchant.personality === 'string' && (
                                  <span className="text-xs text-purple-300/60">
                                    • {merchant.personality.split(',')[0].trim()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => setSelectedMerchant(merchant)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md text-sm font-medium transition-all transform hover:scale-105 shadow-md shadow-purple-900/30"
                            >
                              Negotiate →
                            </button>
                            {hasQuest && !isGenerating && (
                              <button
                                onClick={() => {
                                  const quests = npcQuests.get(merchant.id) || [];
                                  if (quests.length > 0) {
                                    handleQuestOffer(merchant, quests[0]);
                                  }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-md text-sm font-medium transition-all transform hover:scale-105 shadow-md shadow-yellow-900/30 flex items-center justify-center gap-2"
                              >
                                <ScrollText className="w-4 h-4" />
                                View Quest
                              </button>
                            )}
                          </div>
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
                    <p className="text-sm text-amber-50 font-medium">{culturalZone.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
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
                  {inhabitantsNpcs.map((npc, index) => {
                    const hasQuest = npcQuests.has(npc.id);
                    const quests = npcQuests.get(npc.id) || [];
                    
                    return (
                    <div
                      key={npc.id}
                      className="group p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/60 border border-blue-700/30 rounded-lg hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 transition-all backdrop-blur-sm relative"
                    >
                      {hasQuest && (
                        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                          <span className="text-xs font-bold">!</span>
                        </div>
                      )}
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
                            {npc.personality && typeof npc.personality === 'string' && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-300 rounded-full border border-yellow-700/50">
                                {npc.personality.split(',')[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Interaction button */}
                        <div className="flex flex-col gap-2">
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
                          {hasQuest && (
                            <button
                              onClick={() => handleQuestOffer(npc, quests[0])}
                              className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-md text-sm font-medium transition-all transform hover:scale-105 shadow-md shadow-yellow-900/30 flex items-center gap-1"
                            >
                              <ScrollText className="w-3 h-3" />
                              Quest
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Dialogue display */}
                      {selectedNpc?.id === npc.id && npcDialogue && (
                        <div className="mt-4 p-3 bg-slate-900/40 rounded-md border-l-4 border-blue-500">
                          <p className="text-sm text-amber-100 italic">"{npcDialogue}"</p>
                        </div>
                      )}
                    </div>
                  )})}
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
        
      case 'analysis':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900/50 border-b border-red-900/30">
              <h3 className="text-lg font-semibold text-red-300 mb-1">Market Analysis</h3>
              <p className="text-sm text-amber-200/60">Economic trends, volatility, and market intelligence</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40 space-y-4">
              
              {/* Crisis Quests Card */}
              {economicQuests.length > 0 && economicQuests.some(q => (q as any).economicContext?.crisis) && (
                <div className="bg-gradient-to-br from-orange-900/30 to-red-950/20 border border-orange-700/40 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-orange-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Crisis Opportunities
                  </h4>
                  <div className="space-y-2">
                    {economicQuests.filter(q => (q as any).economicContext?.crisis).map((quest, idx) => {
                      const completedObjectives = quest.objectives.filter(o => o.completed).length;
                      const totalObjectives = quest.objectives.length;
                      const progress = (completedObjectives / totalObjectives) * 100;
                      
                      // Calculate time remaining for crisis quests
                      const timeLimit = (quest as any).timeLimit;
                      const startTime = quest.startTime || Date.now();
                      const elapsed = Date.now() - startTime;
                      const remaining = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
                      const urgencyLevel = remaining 
                        ? remaining < 60000 ? 'critical' 
                        : remaining < 180000 ? 'urgent' 
                        : 'normal'
                        : 'normal';
                      
                      return (
                      <div key={idx} className={`bg-slate-900/40 rounded-md p-2 ${
                        urgencyLevel === 'critical' ? 'border-l-4 border-red-500 animate-pulse' :
                        urgencyLevel === 'urgent' ? 'border-l-4 border-orange-500' :
                        ''
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1">
                            <p className="text-sm text-amber-50 font-medium flex items-center gap-2">
                              {quest.title}
                              {urgencyLevel === 'critical' && (
                                <span className="text-xs bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full animate-pulse">
                                  ⚠️ URGENT
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <p className="text-xs text-amber-200/60">From: {quest.giver}</p>
                              {remaining && (
                                <p className={`text-xs font-medium ${
                                  urgencyLevel === 'critical' ? 'text-red-400' :
                                  urgencyLevel === 'urgent' ? 'text-orange-400' :
                                  'text-amber-300'
                                }`}>
                                  ⏱️ {Math.floor(remaining / 60000)}:{String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-orange-300">Reward:</p>
                            <p className="text-sm text-amber-300 font-medium">
                              {quest.rewards?.[0]?.amount} coins
                              {(quest as any).economicContext?.crisis && (
                                <span className="text-xs text-green-400 block">+50% crisis bonus</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {quest.status === 'active' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-amber-200/60">Progress</span>
                              <span className="text-amber-300">{completedObjectives}/{totalObjectives}</span>
                            </div>
                            <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-amber-200/50 mt-3 italic">
                    Visit merchants to accept these urgent quests
                  </p>
                </div>
              )}
              
              {/* Active Crises Card */}
              {activeCrises.length > 0 && (
                <div className="bg-gradient-to-br from-red-900/30 to-red-950/20 border border-red-700/40 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                    Active Crises
                  </h4>
                  <div className="space-y-3">
                    {activeCrises.map((crisis, idx) => (
                      <div key={idx} className="bg-slate-900/40 rounded-md p-3 border-l-4 border-red-500/50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-amber-50 capitalize">
                              {crisis.pattern.category} Crisis: {crisis.pattern.id.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-red-300 mt-1">
                              Severity: {'⚠️'.repeat(crisis.pattern.severity)}
                            </p>
                          </div>
                          <span className="text-xs text-amber-200/50">
                            {Math.ceil((crisis.expiresAt - Date.now()) / (1000 * 60 * 60))}h remaining
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/70 mb-2">{crisis.pattern.flavorText}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-red-900/20 rounded px-2 py-1">
                            <span className="text-red-400">Prices:</span>
                            <span className="text-amber-200 ml-1">
                              {crisis.pattern.marketEffect.priceMultiplier > 1 ? '+' : ''}
                              {Math.round((crisis.pattern.marketEffect.priceMultiplier - 1) * 100)}%
                            </span>
                          </div>
                          <div className="bg-red-900/20 rounded px-2 py-1">
                            <span className="text-red-400">Supply:</span>
                            <span className="text-amber-200 ml-1">
                              {Math.round(crisis.pattern.marketEffect.quantityMultiplier * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-amber-200/50">
                          Reported by: {crisis.sourceNpcs.map(n => n.npcName).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Price History & Trends Card */}
              {marketTrends && priceComparisons.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-950/20 border border-indigo-700/40 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-indigo-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    📈 Price Trends (Last 7 Days)
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-900/40 rounded-md p-2">
                      <p className="text-xs text-indigo-300 mb-1">Market Trend</p>
                      <p className={`text-sm font-bold ${
                        marketTrends.overallTrend === 'bull' ? 'text-green-400' :
                        marketTrends.overallTrend === 'bear' ? 'text-red-400' :
                        'text-amber-400'
                      }`}>
                        {marketTrends.overallTrend === 'bull' ? '📈 Bull Market' :
                         marketTrends.overallTrend === 'bear' ? '📉 Bear Market' :
                         '➡️ Stable'}
                      </p>
                    </div>
                    <div className="bg-slate-900/40 rounded-md p-2">
                      <p className="text-xs text-indigo-300 mb-1">Avg Change</p>
                      <p className={`text-sm font-bold ${
                        marketTrends.averagePriceChange > 0 ? 'text-green-400' :
                        marketTrends.averagePriceChange < 0 ? 'text-red-400' :
                        'text-amber-400'
                      }`}>
                        {marketTrends.averagePriceChange > 0 ? '+' : ''}
                        {marketTrends.averagePriceChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Most volatile items */}
                  {marketTrends.mostVolatile.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-indigo-300 mb-2">Most Volatile</p>
                      <div className="space-y-1">
                        {marketTrends.mostVolatile.slice(0, 3).map(itemId => {
                          const comparison = priceComparisons.find(c => c.itemId === itemId);
                          if (!comparison) return null;
                          return (
                            <div key={itemId} className="flex items-center justify-between text-xs bg-slate-900/30 rounded px-2 py-1">
                              <span className="text-amber-200">{comparison.name}</span>
                              <span className={comparison.percentChange && comparison.percentChange > 0 ? 'text-red-400' : 'text-green-400'}>
                                {comparison.percentChange ? `${comparison.percentChange > 0 ? '+' : ''}${comparison.percentChange.toFixed(0)}%` : 'N/A'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Since last visit comparison */}
                  {priceComparisons.some(c => c.sinceLastVisit !== undefined) && (
                    <div className="border-t border-indigo-700/30 pt-3">
                      <p className="text-xs text-indigo-300 mb-2">Since Your Last Visit</p>
                      <div className="space-y-1">
                        {priceComparisons
                          .filter(c => c.sinceLastVisit !== undefined && c.sinceLastVisit !== 0)
                          .sort((a, b) => Math.abs(b.sinceLastVisit!) - Math.abs(a.sinceLastVisit!))
                          .slice(0, 3)
                          .map(comparison => (
                            <div key={comparison.itemId} className="flex items-center justify-between text-xs bg-slate-900/30 rounded px-2 py-1">
                              <span className="text-amber-200">{comparison.name}</span>
                              <span className={comparison.sinceLastVisit! > 0 ? 'text-red-400' : 'text-green-400'}>
                                {comparison.sinceLastVisit! > 0 ? '+' : ''}{comparison.sinceLastVisit} coins
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Market Summary Card - Replacing fake victory progress */}
              {marketConditions && (
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-950/20 border border-blue-700/40 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    📊 Market Summary
                  </h4>

                  {/* Current Market Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-900/30 rounded px-2 py-1">
                      <p className="text-xs text-cyan-300">Total Goods</p>
                      <p className="text-sm text-amber-100 font-medium">
                        {marketInventory.length} types
                      </p>
                    </div>
                    <div className="bg-slate-900/30 rounded px-2 py-1">
                      <p className="text-xs text-cyan-300">Active Merchants</p>
                      <p className="text-sm text-amber-100 font-medium">
                        {merchantNpcs.length}
                      </p>
                    </div>
                    <div className="bg-slate-900/30 rounded px-2 py-1">
                      <p className="text-xs text-cyan-300">Your Coins</p>
                      <p className="text-sm text-amber-100 font-medium">
                        {playerCharacter.currency}
                      </p>
                    </div>
                    <div className="bg-slate-900/30 rounded px-2 py-1">
                      <p className="text-xs text-cyan-300">Market Condition</p>
                      <p className="text-sm text-amber-100 font-medium">
                        {marketConditionDesc.includes('Thriving') ? '📈 Good' :
                         marketConditionDesc.includes('Struggling') ? '📉 Poor' : '➡️ Stable'}
                      </p>
                    </div>
                  </div>
                  
                </div>
              )}
              
              {/* Market Cycle Card */}
              {marketCycle && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-red-700/30 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wide">📊 Market Cycle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-900/40 rounded-md p-3">
                      <p className="text-xs text-red-300/60 mb-1">Current Phase</p>
                      <p className="text-lg text-amber-50 font-medium capitalize">{marketCycle.phase}</p>
                      <p className="text-xs text-amber-200/50 mt-1">Day {marketCycle.daysInPhase} of ~{marketCycle.phaseDuration}</p>
                    </div>
                    <div className="bg-slate-900/40 rounded-md p-3">
                      <p className="text-xs text-red-300/60 mb-1">Economic Health</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-red-500 to-green-500"
                            style={{ width: `${marketCycle.economicHealth * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-amber-50">{Math.round(marketCycle.economicHealth * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-700/20">
                    <p className="text-sm text-amber-200/80">{marketCycle.description}</p>
                  </div>
                </div>
              )}
              
              {/* Market Trends Card */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-green-700/30 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">📈 Market Trends</h4>
                {!marketTrends || marketTrends.mostVolatile.length === 0 ? (
                  <p className="text-amber-200/50 italic text-sm">No significant trends detected.</p>
                ) : (
                  <div className="space-y-3">
                    {marketTrends.mostVolatile.slice(0, 5).map(itemId => {
                      const comparison = priceComparisons.find(c => c.itemId === itemId);
                      if (!comparison) return null;
                      return (
                        <div key={itemId} className="bg-slate-900/40 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-amber-50 font-medium">{itemId}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                comparison.priceChange > 0 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
                              }`}>
                                {comparison.priceChange > 0 ? '↗️' : '↘️'} {comparison.priceChange > 0 ? '+' : ''}{comparison.priceChange.toFixed(1)}%
                              </span>
                              <span className="text-xs text-amber-200/60">
                                Volatility: {comparison.volatility.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-amber-200/70">
                            Current: {comparison.currentPrice} coins
                          </p>
                          <p className="text-xs text-amber-200/50 mt-1">
                            Avg: {comparison.averagePrice.toFixed(1)} coins
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Volatility Events Card */}
              {volatilityEvents.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-yellow-700/30 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-3 uppercase tracking-wide">⚡ Market Events</h4>
                  <div className="space-y-3">
                    {volatilityEvents.slice(0, 3).map((event, index) => (
                      <div key={index} className="bg-slate-900/40 rounded-md p-3 border-l-4 border-yellow-500/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-amber-50 font-medium capitalize">{event.type}</span>
                          <span className="text-xs text-yellow-300">
                            {event.priceMultiplier > 1 ? `+${Math.round((event.priceMultiplier - 1) * 100)}%` : 
                             `${Math.round((event.priceMultiplier - 1) * 100)}%`}
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/70 mb-1">{event.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-amber-200/50 capitalize">Affects: {event.goodCategory}</span>
                          <span className="text-xs text-amber-200/50">{Math.round(event.duration / 24)} days left</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Visiting NPCs Card */}
              {visitingNpcs.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-purple-700/30 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide">🚶 Market Visitors</h4>
                  <p className="text-sm text-amber-200/60 mb-3">NPCs currently shopping in the marketplace:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {visitingNpcs.slice(0, 6).map(npc => (
                      <div key={npc.id} className="bg-slate-900/40 rounded-md p-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/30 to-purple-700/20 flex items-center justify-center border border-purple-600/50">
                          <span className="text-xs">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-50 font-medium truncate">{npc.name}</p>
                          <p className="text-xs text-amber-200/60 truncate">{npc.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          </div>
        );
    }
  };
  
  return (
    <>
    {/* Achievement Notification */}
    {latestAchievement && (
      <div className="fixed top-20 right-4 z-[60] animate-pulse">
        <div className={`bg-gradient-to-r ${
          latestAchievement.rarity === 'legendary' ? 'from-purple-900 to-purple-700' :
          latestAchievement.rarity === 'epic' ? 'from-blue-900 to-blue-700' :
          latestAchievement.rarity === 'rare' ? 'from-green-900 to-green-700' :
          'from-slate-900 to-slate-700'
        } border ${
          latestAchievement.rarity === 'legendary' ? 'border-purple-500' :
          latestAchievement.rarity === 'epic' ? 'border-blue-500' :
          latestAchievement.rarity === 'rare' ? 'border-green-500' :
          'border-slate-500'
        } rounded-lg p-4 shadow-2xl min-w-[300px]`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{latestAchievement.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Achievement Unlocked!</p>
              <p className="text-base font-semibold text-amber-100">{latestAchievement.name}</p>
              <p className="text-xs text-gray-200 mt-1">{latestAchievement.description}</p>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Milestone Notification */}
    {latestMilestone && (
      <div className="fixed top-20 left-4 z-[60] animate-pulse">
        <div className="bg-gradient-to-r from-yellow-900 to-amber-700 border border-yellow-500 rounded-lg p-4 shadow-2xl min-w-[300px]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Milestone Achieved!</p>
              <p className="text-base font-semibold text-amber-100">{latestMilestone.name}</p>
              <p className="text-xs text-gray-200 mt-1">{latestMilestone.description}</p>
              {latestMilestone.reward && (
                <p className="text-xs text-yellow-300 mt-2">Reward: {latestMilestone.reward}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Using absolute positioning like FishingHutModal for consistent cross-browser rendering */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', // Safari support
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div className={`bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-900/40 rounded-lg shadow-2xl flex flex-col overflow-hidden relative ${
        isMobile ? 'w-full h-full rounded-none' : 'w-full h-full max-w-full max-h-full rounded-lg'
      }`}>
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 flex items-center justify-center transition-all shadow-lg"
            aria-label="Close marketplace"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        )}
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
              timeOfDay={timeOfDay}
              seed={mapData.seed}
              width={1400}
              height={144}
              weather={computedWeather}
            />


          {/* Optional, super-subtle vignette that WON'T darken the banner */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/0" />

          {/* Merchant count overlay on banner */}
          <div className="absolute bottom-2 right-3 z-20">
            <div className="bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-md border border-amber-700/30">
              <p className="text-sm text-amber-400 font-semibold">
                {merchantNpcs.length} Merchant{merchantNpcs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

        </div>

        
        {/* Crisis warning banner */}
        {activeCrises.length > 0 && !dismissedCrises.has(activeCrises[0].pattern.id) && (
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-b border-red-700/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">Active Crisis</p>
                <p className="text-xs text-amber-200/80">
                  {activeCrises[0].pattern.flavorText}
                  {activeCrises[0].sourceNpcs.length > 0 && (
                    <span className="text-amber-400/60"> (reported by {activeCrises[0].sourceNpcs[0].npcName})</span>
                  )}
                </p>
              </div>
              {activeCrises.length > 1 && (
                <span className="text-xs bg-red-800/50 px-2 py-1 rounded-full text-red-200">
                  +{activeCrises.length - 1} more
                </span>
              )}
              <button
                onClick={() => {
                  const newDismissed = new Set(dismissedCrises);
                  newDismissed.add(activeCrises[0].pattern.id);
                  setDismissedCrises(newDismissed);
                  localStorage.setItem('dismissedMarketCrises', JSON.stringify(Array.from(newDismissed)));
                }}
                className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                aria-label="Dismiss crisis banner"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Compact marketplace header */}
        <div className="px-4 py-2 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-800/90 border-b border-amber-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                {marketplaceDataLoading ? (
                  <>
                    <span className="animate-pulse">⌛</span>
                    <span>Loading...</span>
                  </>
                ) : (
                  marketplaceName
                )}
              </h2>
              {/* Badges moved next to title */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-slate-900/50 text-amber-200/60 rounded border border-slate-700/50">
                  {era} Era
                </span>
                {marketAllegiance && (
                  <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-amber-300 rounded border border-amber-700/50">
                    {marketAllegiance.name}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 bg-cyan-900/30 text-cyan-300 rounded border border-cyan-700/50">
                  {culturalZone.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-amber-200/70">
                {mapData.localArea || mapData.continent || 'Unknown Lands'}
              </p>
              <div className="bg-slate-900/50 rounded-md px-3 py-1 border border-amber-700/30">
                <p className="text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  💰 {playerCharacter.currency} coins
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced tab navigation with historical theming */}
        <div className="flex bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 border-b border-amber-900/30">
          {[
            { id: 'buy', label: 'Buy', icon: '🛒' },
            { id: 'sell', label: 'Sell', icon: '💰' },
            { id: 'trade', label: 'Merchants', icon: '🤝' },
            { id: 'people', label: 'People', icon: '👥' },
            { id: 'info', label: 'Info', icon: '📜' },
            { id: 'analysis', label: 'Trends', icon: '📊' }
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
                    tab.id === 'analysis' ? 'bg-gradient-to-t from-red-900/30 to-transparent text-red-400 border-b-2 border-red-400' :
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
        
      </div>
    </div>
    
    {/* Quest Offer Modal */}
    {showQuestOffer && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-600/50 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600/30 to-amber-600/20 flex items-center justify-center border border-amber-600/50">
              <ScrollText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300">Quest Offer</h3>
              <p className="text-sm text-amber-200/60">From {showQuestOffer.npc.name}</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="text-base font-semibold text-amber-100 flex items-center gap-2">
                {showQuestOffer.quest.title}
                {(showQuestOffer.quest as any).isEconomicQuest && (showQuestOffer.quest as any).economicContext?.crisis && (
                  <span className="text-xs bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full border border-red-600/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Crisis Quest
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-300 mt-1">{showQuestOffer.quest.description}</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-amber-200/70 uppercase tracking-wide mb-2">Objectives:</p>
              <ul className="space-y-1">
                {showQuestOffer.quest.objectives.slice(0, 2).map((obj, idx) => (
                  <li key={obj.id} className="text-sm text-gray-300 flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{obj.description}</span>
                    </div>
                    {obj.targetLocation && (
                      <button
                        onClick={() => {
                          // Dispatch event to center map on location
                          const centerEvent = new CustomEvent('centerMapOnLocation', {
                            detail: { x: obj.targetLocation!.x, y: obj.targetLocation!.y }
                          });
                          window.dispatchEvent(centerEvent);
                          setShowQuestOffer(null);
                          onClose();
                          
                          // Show a notification
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-900/90 text-blue-200 px-4 py-2 rounded-lg border border-blue-700 z-50 animate-fade-in';
                          notification.textContent = `📍 Map centered on location [${Math.floor(obj.targetLocation!.x)}, ${Math.floor(obj.targetLocation!.y)}]`;
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 3000);
                        }}
                        className="ml-5 text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        📍 Tile [{Math.floor(obj.targetLocation.x)}, {Math.floor(obj.targetLocation.y)}]
                      </button>
                    )}
                  </li>
                ))}
                {showQuestOffer.quest.objectives.length > 2 && (
                  <li className="text-sm text-gray-400 italic">
                    ...and {showQuestOffer.quest.objectives.length - 2} more
                  </li>
                )}
              </ul>
            </div>
            
            <div className="bg-green-900/30 rounded-lg p-3 border border-green-700/50">
              <p className="text-xs text-green-400 uppercase tracking-wide mb-2">Rewards:</p>
              <ul className="space-y-1">
                {showQuestOffer.quest.rewards?.map((reward, idx) => (
                  <li key={idx} className="text-sm text-green-300 flex items-center gap-2">
                    <Award className="w-3 h-3" />
                    <span>{reward.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => acceptQuest(showQuestOffer.quest)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-md font-medium transition-all transform hover:scale-105"
            >
              Accept Quest
            </button>
            <button
              onClick={() => setShowQuestOffer(null)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-md font-medium transition-all"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
  if (season === 'winter' && categorizeGood(itemId) === 'food') {
    return 1.3;
  }
  
  // Fuel prices increase in winter
  if (season === 'winter' && (id.includes('wood') || id.includes('coal'))) {
    return 1.4;
  }
  
  // Luxury goods cheaper in summer (more trade)
  if (season === 'summer' && categorizeGood(itemId) === 'luxury') {
    return 0.9;
  }
  
  // Tools more expensive in spring (planting season)
  if (season === 'spring' && categorizeGood(itemId) === 'tool') {
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