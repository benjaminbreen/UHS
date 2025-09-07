/**
 * services/marketEventSystem.ts - Phase 2: Seasonal and event-driven market changes
 * 
 * This system handles:
 * - Seasonal market variations and cycles
 * - Historical events affecting trade
 * - Natural disasters and their economic impact
 * - Political events and trade disruptions
 * - Festival and cultural events
 * - Economic bubbles and crashes
 */

import { 
  MapData, 
  HistoricalEra, 
  CulturalZone, 
  Season, 
  NpcEntity,
  ClimateType,
  BiomeType 
} from '../types';
import { CulturalMarketGood } from './culturalMarketplaceService';
import { MarketEvent } from './dynamicPricingEngine';
import { parseDateString } from '../utils/dateUtils';

export interface SeasonalEffect {
  season: Season;
  category: string;
  itemIds: string[];
  supplyMultiplier: number;
  demandMultiplier: number;
  priceMultiplier: number;
  description: string;
}

export interface HistoricalMarketEvent {
  id: string;
  name: string;
  description: string;
  era: HistoricalEra;
  culturalZones: CulturalZone[];
  triggerConditions: {
    yearRange?: { start: number, end: number };
    season?: Season;
    biomes?: BiomeType[];
    populationThreshold?: number;
  };
  effects: {
    categories: string[];
    itemSpecific?: Map<string, number>;
    supplyChanges: Map<string, number>;
    demandChanges: Map<string, number>;
    priceChanges: Map<string, number>;
    durationHours: number;
  };
  probability: number; // Chance of occurring when conditions are met
  cooldownHours: number; // Minimum time before event can repeat
}

export interface CulturalFestival {
  name: string;
  culturalZone: CulturalZone;
  season: Season;
  duration: number; // in game hours
  effects: {
    increasedDemand: string[];
    decreasedDemand: string[];
    specialGoods: string[];
    priceMultipliers: Map<string, number>;
  };
  description: string;
}

export class MarketEventSystem {
  private activeEvents: MarketEvent[] = [];
  private eventHistory: { eventId: string, timestamp: number }[] = [];
  private seasonalEffects: SeasonalEffect[] = [];
  private historicalEvents: HistoricalMarketEvent[] = [];
  private culturalFestivals: CulturalFestival[] = [];
  
  constructor() {
    this.initializeSeasonalEffects();
    this.initializeHistoricalEvents();
    this.initializeCulturalFestivals();
  }
  
  /**
   * Process all market events and seasonal effects
   */
  processMarketEvents(
    mapData: MapData,
    era: HistoricalEra,
    culturalZone: CulturalZone,
    season: Season,
    climate: ClimateType,
    gameTimeHours: number,
    marketplace: CulturalMarketGood[]
  ): {
    updatedMarketplace: CulturalMarketGood[],
    newEvents: MarketEvent[],
    activeEvents: MarketEvent[],
    seasonalEffects: string[]
  } {
    
    // Clean up expired events
    this.cleanupExpiredEvents(gameTimeHours);
    
    // Check for new historical events
    const newHistoricalEvents = this.checkHistoricalEvents(mapData, era, culturalZone, season, gameTimeHours);
    
    // Check for cultural festivals
    const newFestivals = this.checkCulturalFestivals(culturalZone, season, gameTimeHours);
    
    // Check for random market events
    const newRandomEvents = this.generateRandomMarketEvents(mapData, era, culturalZone, gameTimeHours);
    
    // Combine all new events
    const newEvents = [...newHistoricalEvents, ...newFestivals, ...newRandomEvents];
    this.activeEvents.push(...newEvents);
    
    // Apply seasonal effects
    let updatedMarketplace = this.applySeasonalEffects(marketplace, season, era, culturalZone);
    
    // Apply active event effects
    updatedMarketplace = this.applyEventEffects(updatedMarketplace, this.activeEvents);
    
    // Get seasonal effect descriptions
    const seasonalEffectDescriptions = this.getSeasonalEffectDescriptions(season, era, culturalZone);
    
    return {
      updatedMarketplace,
      newEvents,
      activeEvents: [...this.activeEvents],
      seasonalEffects: seasonalEffectDescriptions
    };
  }
  
  /**
   * Initialize seasonal market effects
   */
  private initializeSeasonalEffects(): void {
    this.seasonalEffects = [
      // Spring effects
      {
        season: 'spring',
        category: 'food',
        itemIds: ['FRESH_VEGETABLES', 'HERBS', 'DAIRY'],
        supplyMultiplier: 1.3,
        demandMultiplier: 1.1,
        priceMultiplier: 0.9,
        description: 'Fresh spring produce becomes abundant'
      },
      {
        season: 'spring',
        category: 'raw_material',
        itemIds: ['WOOL', 'HIDES', 'LEATHER'],
        supplyMultiplier: 1.2,
        demandMultiplier: 0.8,
        priceMultiplier: 0.9,
        description: 'Animal products from breeding season'
      },
      
      // Summer effects
      {
        season: 'summer',
        category: 'food',
        itemIds: ['FRUITS', 'GRAIN', 'VEGETABLES'],
        supplyMultiplier: 1.5,
        demandMultiplier: 1.0,
        priceMultiplier: 0.8,
        description: 'Peak harvest season brings abundance'
      },
      {
        season: 'summer',
        category: 'luxury',
        itemIds: ['SPICES', 'EXOTIC_GOODS', 'PERFUMES'],
        supplyMultiplier: 1.2,
        demandMultiplier: 1.3,
        priceMultiplier: 1.1,
        description: 'Trading season brings exotic goods'
      },
      
      // Autumn effects
      {
        season: 'autumn',
        category: 'food',
        itemIds: ['PRESERVED_FOODS', 'SALT', 'HONEY'],
        supplyMultiplier: 0.9,
        demandMultiplier: 1.4,
        priceMultiplier: 1.2,
        description: 'Preservation goods in high demand'
      },
      {
        season: 'autumn',
        category: 'raw_material',
        itemIds: ['WOOD', 'STONE', 'COAL'],
        supplyMultiplier: 1.1,
        demandMultiplier: 1.3,
        priceMultiplier: 1.1,
        description: 'Preparation for winter increases demand'
      },
      
      // Winter effects
      {
        season: 'winter',
        category: 'food',
        itemIds: ['PRESERVED_MEAT', 'DRIED_GOODS', 'STORED_GRAIN'],
        supplyMultiplier: 0.8,
        demandMultiplier: 1.5,
        priceMultiplier: 1.3,
        description: 'Stored provisions command premium prices'
      },
      {
        season: 'winter',
        category: 'manufactured',
        itemIds: ['WARM_CLOTHING', 'BLANKETS', 'FUEL'],
        supplyMultiplier: 0.9,
        demandMultiplier: 1.6,
        priceMultiplier: 1.4,
        description: 'Winter necessities in high demand'
      }
    ];
  }
  
  /**
   * Initialize historical market events
   */
  private initializeHistoricalEvents(): void {
    this.historicalEvents = [
      // Medieval events
      {
        id: 'black_death_trade_disruption',
        name: 'Plague Trade Disruption',
        description: 'Disease outbreak disrupts trade routes and creates labor shortages',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        triggerConditions: {
          yearRange: { start: 1347, end: 1351 },
          populationThreshold: 100
        },
        effects: {
          categories: ['medicine', 'luxury', 'food'],
          supplyChanges: new Map([
            ['MEDICINE', 0.3],
            ['LUXURY_GOODS', 0.6],
            ['LABOR_INTENSIVE_GOODS', 0.5]
          ]),
          demandChanges: new Map([
            ['MEDICINE', 2.5],
            ['RELIGIOUS_ITEMS', 1.8],
            ['PRESERVED_FOODS', 1.4]
          ]),
          priceChanges: new Map([
            ['MEDICINE', 3.0],
            ['RELIGIOUS_ITEMS', 2.0],
            ['LUXURY_GOODS', 0.7]
          ]),
          durationHours: 720 // 30 days
        },
        probability: 0.3,
        cooldownHours: 2160 // 90 days
      },
      
      // Renaissance events
      {
        id: 'new_world_silver_influx',
        name: 'New World Silver Influx',
        description: 'Massive silver imports cause inflation and change trade patterns',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN', 'SOUTH_AMERICAN'],
        triggerConditions: {
          yearRange: { start: 1500, end: 1650 }
        },
        effects: {
          categories: ['luxury', 'manufactured', 'food'],
          supplyChanges: new Map([
            ['SILVER', 3.0],
            ['GOLD', 1.5]
          ]),
          demandChanges: new Map([
            ['EXOTIC_SPICES', 1.6],
            ['MANUFACTURED_GOODS', 1.3]
          ]),
          priceChanges: new Map([
            ['SILVER', 0.4],
            ['BASIC_GOODS', 1.5], // Inflation
            ['LUXURY_IMPORTS', 0.8]
          ]),
          durationHours: 1440 // 60 days
        },
        probability: 0.4,
        cooldownHours: 4320 // 180 days
      },
      
      // Industrial era events
      {
        id: 'railway_construction_boom',
        name: 'Railway Construction Boom',
        description: 'Massive infrastructure projects drive demand for materials',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
        triggerConditions: {
          yearRange: { start: 1830, end: 1890 }
        },
        effects: {
          categories: ['raw_material', 'manufactured'],
          supplyChanges: new Map([
            ['MANUFACTURED_GOODS', 1.4]
          ]),
          demandChanges: new Map([
            ['IRON', 2.2],
            ['STEEL', 2.5],
            ['COAL', 1.8],
            ['TOOLS', 1.6]
          ]),
          priceChanges: new Map([
            ['IRON', 1.7],
            ['STEEL', 2.0],
            ['COAL', 1.4]
          ]),
          durationHours: 2160 // 90 days
        },
        probability: 0.5,
        cooldownHours: 1440 // 60 days
      },
      
      // Natural disasters
      {
        id: 'harvest_failure',
        name: 'Harvest Failure',
        description: 'Poor weather destroys crops, causing food shortages',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN', 'EAST_ASIAN', 'MENA'],
        triggerConditions: {
          season: 'autumn',
          biomes: [BiomeType.FARMLAND]
        },
        effects: {
          categories: ['food'],
          supplyChanges: new Map([
            ['GRAIN', 0.3],
            ['VEGETABLES', 0.4],
            ['FRUITS', 0.5]
          ]),
          demandChanges: new Map([
            ['PRESERVED_FOODS', 1.8],
            ['IMPORTED_FOODS', 2.0]
          ]),
          priceChanges: new Map([
            ['FOOD', 2.5],
            ['GRAIN', 3.0]
          ]),
          durationHours: 1440 // 60 days
        },
        probability: 0.15,
        cooldownHours: 4320 // 180 days
      },
      
      // War and conflict
      {
        id: 'trade_route_blockade',
        name: 'Trade Route Blockade',
        description: 'Military conflict disrupts major trade routes',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN', 'MENA', 'EAST_ASIAN'],
        triggerConditions: {},
        effects: {
          categories: ['luxury', 'exotic'],
          supplyChanges: new Map([
            ['EXOTIC_GOODS', 0.4],
            ['SPICES', 0.3],
            ['LUXURY_IMPORTS', 0.5]
          ]),
          demandChanges: new Map([
            ['WEAPONS', 1.6],
            ['MILITARY_SUPPLIES', 1.8],
            ['LOCAL_GOODS', 1.3]
          ]),
          priceChanges: new Map([
            ['EXOTIC_GOODS', 2.2],
            ['SPICES', 2.8],
            ['WEAPONS', 1.4]
          ]),
          durationHours: 720 // 30 days
        },
        probability: 0.2,
        cooldownHours: 2160 // 90 days
      }
    ];
  }
  
  /**
   * Initialize cultural festivals
   */
  private initializeCulturalFestivals(): void {
    this.culturalFestivals = [
      // European festivals
      {
        name: 'Harvest Festival',
        culturalZone: 'EUROPEAN',
        season: 'autumn',
        duration: 72, // 3 days
        effects: {
          increasedDemand: ['BEER', 'WINE', 'MEAT', 'BREAD'],
          decreasedDemand: ['LUXURY_GOODS'],
          specialGoods: ['FESTIVAL_FOODS', 'DECORATIONS'],
          priceMultipliers: new Map([
            ['ALCOHOL', 1.3],
            ['FOOD', 1.2],
            ['ENTERTAINMENT', 1.5]
          ])
        },
        description: 'Celebration of the autumn harvest brings feasting and merrymaking'
      },
      
    
      
      // East Asian festivals
      {
        name: 'Lunar New Year Market',
        culturalZone: 'EAST_ASIAN',
        season: 'winter',
        duration: 168, // 7 days
        effects: {
          increasedDemand: ['SILK', 'TEA', 'FIREWORKS', 'RED_ITEMS'],
          decreasedDemand: [],
          specialGoods: ['FESTIVAL_DECORATIONS', 'LUCKY_CHARMS'],
          priceMultipliers: new Map([
            ['SILK', 1.5],
            ['TEA', 1.3],
            ['RED_CLOTH', 1.8],
            ['GOLD_ITEMS', 1.4]
          ])
        },
        description: 'Lunar New Year celebrations drive demand for auspicious items'
      },
      
      // MENA festivals
      {
        name: 'Pilgrimage Season',
        culturalZone: 'MENA',
        season: 'spring',
        duration: 240, // 10 days
        effects: {
          increasedDemand: ['TRAVEL_SUPPLIES', 'RELIGIOUS_ITEMS', 'WATER', 'PRESERVED_FOODS'],
          decreasedDemand: ['LUXURY_GOODS'],
          specialGoods: ['PILGRIMAGE_GEAR', 'BLESSED_ITEMS'],
          priceMultipliers: new Map([
            ['RELIGIOUS_ITEMS', 1.6],
            ['TRAVEL_GEAR', 1.4],
            ['WATER_CONTAINERS', 1.8]
          ])
        },
        description: 'Pilgrimage season increases demand for religious and travel items'
      }
    ];
  }
  
  /**
   * Check for new historical events
   */
  private checkHistoricalEvents(
    mapData: MapData,
    era: HistoricalEra,
    culturalZone: CulturalZone,
    season: Season,
    gameTimeHours: number
  ): MarketEvent[] {
    const newEvents: MarketEvent[] = [];
    const dateInfo = parseDateString(mapData.timeSlice || '1500');
    
    for (const historicalEvent of this.historicalEvents) {
      // Check if event applies to current context
      if (historicalEvent.era !== era) continue;
      if (!historicalEvent.culturalZones.includes(culturalZone)) continue;
      
      // Check if event is on cooldown
      const lastOccurrence = this.eventHistory
        .filter(h => h.eventId === historicalEvent.id)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (lastOccurrence && 
          gameTimeHours - lastOccurrence.timestamp < historicalEvent.cooldownHours) {
        continue;
      }
      
      // Check trigger conditions
      let canTrigger = true;
      
      if (historicalEvent.triggerConditions.yearRange) {
        const { start, end } = historicalEvent.triggerConditions.yearRange;
        if (dateInfo.year < start || dateInfo.year > end) {
          canTrigger = false;
        }
      }
      
      if (historicalEvent.triggerConditions.season && 
          historicalEvent.triggerConditions.season !== season) {
        canTrigger = false;
      }
      
      if (historicalEvent.triggerConditions.biomes) {
        const mapBiomes = mapData.tiles.flat().map(tile => tile.biome);
        const hasRequiredBiome = historicalEvent.triggerConditions.biomes.some(biome =>
          mapBiomes.includes(biome)
        );
        if (!hasRequiredBiome) {
          canTrigger = false;
        }
      }
      
      // Check probability
      if (canTrigger && Math.random() < historicalEvent.probability) {
        const marketEvent: MarketEvent = {
          id: historicalEvent.id,
          name: historicalEvent.name,
          description: historicalEvent.description,
          startTime: gameTimeHours,
          duration: historicalEvent.effects.durationHours,
          affectedCategories: historicalEvent.effects.categories,
          priceMultipliers: historicalEvent.effects.priceChanges,
          supplyMultipliers: historicalEvent.effects.supplyChanges,
          demandMultipliers: historicalEvent.effects.demandChanges
        };
        
        newEvents.push(marketEvent);
        this.eventHistory.push({ eventId: historicalEvent.id, timestamp: gameTimeHours });
      }
    }
    
    return newEvents;
  }
  
  /**
   * Check for cultural festivals
   */
  private checkCulturalFestivals(
    culturalZone: CulturalZone,
    season: Season,
    gameTimeHours: number
  ): MarketEvent[] {
    const newEvents: MarketEvent[] = [];
    
    for (const festival of this.culturalFestivals) {
      if (festival.culturalZone !== culturalZone) continue;
      if (festival.season !== season) continue;
      
      // Random chance of festival occurring (20% chance per season)
      if (Math.random() < 0.2) {
        const marketEvent: MarketEvent = {
          id: `festival_${festival.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: festival.name,
          description: festival.description,
          startTime: gameTimeHours,
          duration: festival.duration,
          affectedCategories: [...festival.effects.increasedDemand, ...festival.effects.decreasedDemand],
          priceMultipliers: festival.effects.priceMultipliers,
          supplyMultipliers: new Map(), // Festivals don't typically affect supply
          demandMultipliers: new Map([
            ...festival.effects.increasedDemand.map(item => [item, 1.5] as [string, number]),
            ...festival.effects.decreasedDemand.map(item => [item, 0.7] as [string, number])
          ])
        };
        
        newEvents.push(marketEvent);
      }
    }
    
    return newEvents;
  }
  
  /**
   * Generate random market events
   */
  private generateRandomMarketEvents(
    mapData: MapData,
    era: HistoricalEra,
    culturalZone: CulturalZone,
    gameTimeHours: number
  ): MarketEvent[] {
    const newEvents: MarketEvent[] = [];
    
    // Small chance of random events each hour
    if (Math.random() < 0.05) {
      const randomEvents = [
        {
          name: 'Merchant Caravan Arrival',
          description: 'A large merchant caravan brings exotic goods to market',
          categories: ['luxury', 'exotic'],
          effects: new Map([['EXOTIC_GOODS', 1.3], ['SPICES', 1.2]]),
          duration: 48
        },
        {
          name: 'Workshop Fire',
          description: 'A fire destroys a major workshop, reducing supply',
          categories: ['manufactured'],
          effects: new Map([['CRAFTED_GOODS', 0.7], ['TOOLS', 0.8]]),
          duration: 168
        },
        {
          name: 'Noble Wedding',
          description: 'A noble wedding creates high demand for luxury items',
          categories: ['luxury'],
          effects: new Map([['LUXURY_GOODS', 1.6], ['FINE_CLOTHING', 1.8]]),
          duration: 72
        },
        {
          name: 'Guild Strike',
          description: 'Craftsmen strike for better wages, reducing production',
          categories: ['manufactured'],
          effects: new Map([['GUILD_GOODS', 0.6], ['CRAFTED_ITEMS', 0.7]]),
          duration: 120
        }
      ];
      
      const randomEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      
      const marketEvent: MarketEvent = {
        id: `random_${Date.now()}`,
        name: randomEvent.name,
        description: randomEvent.description,
        startTime: gameTimeHours,
        duration: randomEvent.duration,
        affectedCategories: randomEvent.categories,
        priceMultipliers: randomEvent.effects,
        supplyMultipliers: randomEvent.effects,
        demandMultipliers: randomEvent.effects
      };
      
      newEvents.push(marketEvent);
    }
    
    return newEvents;
  }
  
  /**
   * Apply seasonal effects to marketplace
   */
  private applySeasonalEffects(
    marketplace: CulturalMarketGood[],
    season: Season,
    era: HistoricalEra,
    culturalZone: CulturalZone
  ): CulturalMarketGood[] {
    const relevantEffects = this.seasonalEffects.filter(effect => effect.season === season);
    
    return marketplace.map(good => {
      let updatedGood = { ...good };
      
      for (const effect of relevantEffects) {
        const affectsItem = effect.category === good.category ||
                           effect.itemIds.some(id => good.itemId.includes(id));
        
        if (affectsItem) {
          updatedGood.quantity = Math.round(updatedGood.quantity * effect.supplyMultiplier);
          updatedGood.currentPrice = Math.round(updatedGood.currentPrice * effect.priceMultiplier);
        }
      }
      
      return updatedGood;
    });
  }
  
  /**
   * Apply active event effects to marketplace
   */
  private applyEventEffects(marketplace: CulturalMarketGood[], events: MarketEvent[]): CulturalMarketGood[] {
    let updatedMarketplace = [...marketplace];
    
    for (const event of events) {
      updatedMarketplace = updatedMarketplace.map(good => {
        let updatedGood = { ...good };
        
        // Check if this item is affected by the event
        const isAffected = event.affectedCategories.includes(good.category) ||
                          event.priceMultipliers.has(good.itemId) ||
                          event.supplyMultipliers.has(good.itemId) ||
                          event.demandMultipliers.has(good.itemId);
        
        if (isAffected) {
          // Apply specific item multipliers first, then category multipliers
          const priceMultiplier = event.priceMultipliers.get(good.itemId) ||
                                 event.priceMultipliers.get(good.category) ||
                                 1.0;
          
          const supplyMultiplier = event.supplyMultipliers.get(good.itemId) ||
                                  event.supplyMultipliers.get(good.category) ||
                                  1.0;
          
          updatedGood.currentPrice = Math.round(updatedGood.currentPrice * priceMultiplier);
          updatedGood.quantity = Math.max(0, Math.round(updatedGood.quantity * supplyMultiplier));
        }
        
        return updatedGood;
      });
    }
    
    return updatedMarketplace;
  }
  
  /**
   * Clean up expired events
   */
  private cleanupExpiredEvents(gameTimeHours: number): void {
    this.activeEvents = this.activeEvents.filter(event =>
      gameTimeHours < (event.startTime + event.duration)
    );
  }
  
  /**
   * Get descriptions of active seasonal effects
   */
  private getSeasonalEffectDescriptions(season: Season, era: HistoricalEra, culturalZone: CulturalZone): string[] {
    const relevantEffects = this.seasonalEffects.filter(effect => effect.season === season);
    return relevantEffects.map(effect => effect.description);
  }
  
  /**
   * Get current market events for UI display
   */
  getActiveEvents(): MarketEvent[] {
    return [...this.activeEvents];
  }
  
  /**
   * Get event history for analysis
   */
  getEventHistory(): { eventId: string, timestamp: number }[] {
    return [...this.eventHistory];
  }
  
  /**
   * Force trigger a specific event (for testing or special scenarios)
   */
  triggerEvent(eventId: string, gameTimeHours: number): boolean {
    const historicalEvent = this.historicalEvents.find(e => e.id === eventId);
    if (!historicalEvent) return false;
    
    const marketEvent: MarketEvent = {
      id: historicalEvent.id,
      name: historicalEvent.name,
      description: historicalEvent.description,
      startTime: gameTimeHours,
      duration: historicalEvent.effects.durationHours,
      affectedCategories: historicalEvent.effects.categories,
      priceMultipliers: historicalEvent.effects.priceChanges,
      supplyMultipliers: historicalEvent.effects.supplyChanges,
      demandMultipliers: historicalEvent.effects.demandChanges
    };
    
    this.activeEvents.push(marketEvent);
    this.eventHistory.push({ eventId: historicalEvent.id, timestamp: gameTimeHours });
    
    return true;
  }
  
  /**
   * Get market sentiment based on active events
   */
  getMarketSentiment(): 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' {
    if (this.activeEvents.length === 0) return 'neutral';
    
    let sentimentScore = 0;
    
    for (const event of this.activeEvents) {
      // Positive events (festivals, good harvests, etc.)
      if (event.name.includes('Festival') || event.name.includes('Harvest') || 
          event.name.includes('Caravan') || event.name.includes('Wedding')) {
        sentimentScore += 2;
      }
      // Negative events (disasters, strikes, etc.)
      else if (event.name.includes('Failure') || event.name.includes('Fire') || 
               event.name.includes('Strike') || event.name.includes('Plague')) {
        sentimentScore -= 2;
      }
      // Neutral events (trade disruptions, blockades)
      else {
        sentimentScore -= 1;
      }
    }
    
    if (sentimentScore >= 4) return 'very_positive';
    if (sentimentScore >= 2) return 'positive';
    if (sentimentScore <= -4) return 'very_negative';
    if (sentimentScore <= -2) return 'negative';
    return 'neutral';
  }
}

export const marketEventSystem = new MarketEventSystem();