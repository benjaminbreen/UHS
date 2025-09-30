/**
 * services/dynamicPricingEngine.ts - Phase 2: Advanced multi-factor pricing system
 * 
 * This engine calculates prices based on:
 * - Supply/demand fluctuations
 * - NPC behavior and needs
 * - Seasonal variations
 * - Historical events and crises
 * - Trade route disruptions
 * - Cultural preferences and taboos
 * - Political/faction relationships
 */

import {
  MapData,
  HistoricalEra,
  CulturalZone,
  NpcEntity,
  TerrainStructure,
  BiomeType,
  ClimateType,
  Season
} from '../types';
import { CulturalMarketGood } from './culturalMarketplaceService';
import { parseDateString } from '../utils/dateUtils';
import { FACTION_DATA } from '../constants/gameData/factions';

export interface PricingFactors {
  basePrice: number;
  supplyFactor: number; // 0.1 (scarce) to 2.0 (abundant)
  demandFactor: number; // 0.1 (no demand) to 2.0 (high demand)
  seasonalFactor: number; // 0.5 to 1.5
  culturalFactor: number; // 0.5 (taboo) to 2.0 (highly valued)
  politicalFactor: number; // 0.3 (war/embargo) to 1.2 (good relations)
  qualityFactor: number; // 0.5 (poor) to 3.0 (masterwork)
  distanceFactor: number; // 1.0 (local) to 2.5 (exotic)
  eventFactor: number; // 0.2 (market crash) to 3.0 (crisis commodity)
  volatility: number; // Price change tendency
}

export interface MarketEvent {
  id: string;
  name: string;
  description: string;
  startTime: number;
  duration: number; // in game hours
  affectedCategories: string[];
  priceMultipliers: Map<string, number>;
  supplyMultipliers: Map<string, number>;
  demandMultipliers: Map<string, number>;
}

export interface NPCMarketBehavior {
  npcId: string;
  buyingPower: number; // How much they can spend
  needs: string[]; // Items they want to buy
  selling: string[]; // Items they want to sell
  preferences: Map<string, number>; // Item preference weights
  patience: number; // How long they'll wait for good prices
  priceThreshold: number; // Won't buy above this multiplier
}

export class DynamicPricingEngine {
  private priceHistory = new Map<string, number[]>(); // Track price trends
  private marketEvents: MarketEvent[] = [];
  private npcBehaviors = new Map<string, NPCMarketBehavior>();
  private lastUpdate = 0;
  private supplyLevels = new Map<string, number>();
  private demandLevels = new Map<string, number>();
  
  /**
   * Calculate comprehensive pricing for a market good
   */
  calculatePrice(
    good: CulturalMarketGood,
    mapData: MapData,
    npcs: NpcEntity[],
    season: Season,
    gameTimeHours: number,
    culturalZone: CulturalZone,
    era: HistoricalEra
  ): { price: number, factors: PricingFactors, explanation: string[] } {
    
    const factors: PricingFactors = {
      basePrice: good.basePrice,
      supplyFactor: this.calculateSupplyFactor(good, mapData, npcs),
      demandFactor: this.calculateDemandFactor(good, mapData, npcs),
      seasonalFactor: this.calculateSeasonalFactor(good, season, era),
      culturalFactor: this.calculateCulturalFactor(good, culturalZone, era),
      politicalFactor: this.calculatePoliticalFactor(good, mapData, culturalZone),
      qualityFactor: this.calculateQualityFactor(good.quality),
      distanceFactor: this.calculateDistanceFactor(good.origin),
      eventFactor: this.calculateEventFactor(good, gameTimeHours),
      volatility: this.calculateVolatility(good.itemId)
    };
    
    // Apply compound pricing
    const finalPrice = Math.round(
      factors.basePrice * 
      factors.supplyFactor * 
      factors.demandFactor * 
      factors.seasonalFactor * 
      factors.culturalFactor * 
      factors.politicalFactor * 
      factors.qualityFactor * 
      factors.distanceFactor * 
      factors.eventFactor *
      (1 + (Math.random() - 0.5) * factors.volatility * 0.1) // Small random variation
    );
    
    const explanation = this.generatePriceExplanation(factors, good);
    
    // Update price history
    this.updatePriceHistory(good.itemId, finalPrice);
    
    return {
      price: Math.max(1, finalPrice),
      factors,
      explanation
    };
  }
  
  /**
   * Calculate supply factor based on local production
   */
  private calculateSupplyFactor(good: CulturalMarketGood, mapData: MapData, npcs: NpcEntity[]): number {
    let supply = 1.0;
    
    // Check for producing structures
    const producingStructures = mapData.terrainStructures?.filter(s => 
      s.outputGoods?.includes(good.itemId) && s.state !== 'ruined'
    ) || [];
    
    // Each producing structure increases supply
    supply += producingStructures.length * 0.3;
    
    // Check for producing NPCs
    const producingNpcs = npcs.filter(npc => this.canNpcProduce(npc, good.itemId));
    supply += producingNpcs.length * 0.2;
    
    // Production chain considerations
    if (good.productionChain) {
      const missingInputs = good.productionChain.filter(input => 
        !this.isItemAvailable(input, mapData, npcs)
      );
      // Each missing input reduces supply
      supply *= Math.max(0.3, 1.0 - (missingInputs.length * 0.2));
    }
    
    // Biome suitability affects supply
    const biomeMultiplier = this.getBiomeSupplyMultiplier(good, mapData);
    supply *= biomeMultiplier;
    
    // Store current supply level
    this.supplyLevels.set(good.itemId, supply);
    
    return Math.max(0.1, Math.min(2.0, supply));
  }
  
  /**
   * Calculate demand factor based on NPC needs and population
   */
  private calculateDemandFactor(good: CulturalMarketGood, mapData: MapData, npcs: NpcEntity[]): number {
    let demand = 0.5; // Base demand
    
    // Population-based demand
    const populationTiles = mapData.tiles.flat().filter(tile => 
      tile.biome === BiomeType.HAMLET ||
      tile.biome === BiomeType.LOW_DENSITY_CITY ||
      tile.biome === BiomeType.DENSE_CITY
    ).length;
    
    demand += populationTiles * 0.05;
    
    // NPC personal goals create demand
    npcs.forEach(npc => {
      if (npc.personalGoal?.archetype === 'ACQUIRE' && 
          npc.personalGoal?.targetId === good.itemId) {
        demand += 0.3; // Strong personal demand
      }
      
      // Profession-based demand
      if (this.doesNpcNeed(npc, good.itemId)) {
        demand += 0.1;
      }
    });
    
    // Essential goods have baseline demand
    if (this.isEssentialGood(good)) {
      demand += 0.5;
    }
    
    // Luxury goods have wealth-dependent demand
    if (good.category === 'luxury') {
      const wealthyNpcs = npcs.filter(npc => 
        npc.wealthLevel === 'wealthy' || npc.wealthLevel === 'noble'
      ).length;
      demand += wealthyNpcs * 0.1;
    }
    
    // Store current demand level
    this.demandLevels.set(good.itemId, demand);
    
    return Math.max(0.1, Math.min(2.0, demand));
  }
  
  /**
   * Calculate seasonal pricing factors
   */
  private calculateSeasonalFactor(good: CulturalMarketGood, season: Season, era: HistoricalEra): number {
    let factor = 1.0;
    
    // Food items have strong seasonal variations
    if (good.category === 'food') {
      switch (season) {
        case 'spring':
          // Stored food expensive, fresh food cheap
          if (good.itemId.includes('PRESERVED') || good.itemId.includes('DRIED')) {
            factor = 1.3;
          } else if (good.itemId.includes('FRESH') || good.itemId.includes('GREEN')) {
            factor = 0.7;
          }
          break;
          
        case 'summer':
          // Peak growing season, most food cheap
          if (good.itemId.includes('GRAIN') || good.itemId.includes('FRUIT')) {
            factor = 0.8;
          }
          break;
          
        case 'autumn':
          // Harvest time, staples cheap but preservation costs
          if (good.itemId.includes('GRAIN') || good.itemId.includes('HARVEST')) {
            factor = 0.7;
          } else if (good.itemId.includes('SALT') || good.itemId.includes('PRESERVATION')) {
            factor = 1.2;
          }
          break;
          
        case 'winter':
          // Stored food premium, fresh food scarce
          if (good.itemId.includes('PRESERVED') || good.itemId.includes('STORED')) {
            factor = 0.9;
          } else if (good.itemId.includes('FRESH')) {
            factor = 1.4;
          }
          break;
      }
    }
    
    // Fuel and warming goods more expensive in winter
    if (season === 'winter') {
      if (good.itemId.includes('WOOD') || good.itemId.includes('COAL') || 
          good.itemId.includes('WOOL') || good.itemId.includes('FUR')) {
        factor *= 1.2;
      }
    }
    
    // Travel goods cheaper in good weather
    if (season === 'summer' || season === 'spring') {
      if (good.origin === 'distant' || good.origin === 'exotic') {
        factor *= 0.9;
      }
    }
    
    return Math.max(0.5, Math.min(1.5, factor));
  }
  
  /**
   * Calculate cultural value factors
   */
  private calculateCulturalFactor(good: CulturalMarketGood, culturalZone: CulturalZone, era: HistoricalEra): number {
    let factor = 1.0;
    
    // Cultural preferences
    const preferences: Partial<Record<CulturalZone, Record<string, number>>> = {
      'EAST_ASIAN': {
        'TEA': 1.5,
        'SILK': 1.3,
        'PORCELAIN': 1.4,
        'RICE': 1.2,
        'JADE': 1.6
      },
      'EUROPEAN': {
        'WINE': 1.3,
        'WOOL': 1.2,
        'BREAD': 1.1,
        'SPICES': 1.4,
        'SILVER': 1.3
      },
      'MENA': {
        'SPICES': 1.6,
        'FRANKINCENSE': 1.5,
        'GOLD': 1.4,
        'DATES': 1.2,
        'CARPETS': 1.3
      },
      'SUB_SAHARAN_AFRICAN': {
        'GOLD': 1.5,
        'IVORY': 1.4,
        'IRON': 1.3,
        'KOLA_NUTS': 1.2
      }
    };
    
    const culturalPrefs = preferences[culturalZone];
    if (culturalPrefs) {
      // Check if this item has cultural significance
      for (const [item, multiplier] of Object.entries(culturalPrefs)) {
        if (good.itemId.includes(item)) {
          factor *= multiplier;
          break;
        }
      }
    }
    
    // Religious items more valuable in religious eras
    if (good.category === 'religious') {
      if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.ANTIQUITY) {
        factor *= 1.3;
      } else if (era === HistoricalEra.MODERN_ERA) {
        factor *= 0.8; // Secularization
      }
    }
    
    return Math.max(0.5, Math.min(2.0, factor));
  }
  
  /**
   * Calculate political/faction relationship factors
   */
  private calculatePoliticalFactor(good: CulturalMarketGood, mapData: MapData, culturalZone: CulturalZone): number {
    let factor = 1.0;
    
    // Check if there are hostile factions that would disrupt trade
    const factionData = FACTION_DATA[culturalZone];
    if (factionData) {
      // In times of conflict, military goods more expensive, luxury goods cheaper
      if (good.category === 'military') {
        factor *= 1.3;
      } else if (good.category === 'luxury') {
        factor *= 0.8;
      }
      
      // Imported goods affected by political tensions
      if (good.origin === 'distant' || good.origin === 'exotic') {
        // Random chance of trade disruption
        if (Math.random() < 0.1) {
          factor *= 1.5; // Trade route disrupted
        }
      }
    }
    
    return Math.max(0.3, Math.min(1.5, factor));
  }
  
  /**
   * Calculate quality-based pricing
   */
  private calculateQualityFactor(quality: string): number {
    const qualityMultipliers: Record<string, number> = {
      'poor': 0.5,
      'standard': 1.0,
      'fine': 1.4,
      'exceptional': 2.2,
      'masterwork': 3.0
    };
    
    return qualityMultipliers[quality] || 1.0;
  }
  
  /**
   * Calculate distance-based pricing
   */
  private calculateDistanceFactor(origin: string): number {
    const distanceMultipliers: Record<string, number> = {
      'local': 1.0,
      'regional': 1.2,
      'distant': 1.8,
      'exotic': 2.5
    };
    
    return distanceMultipliers[origin] || 1.0;
  }
  
  /**
   * Calculate event-based pricing modifiers
   */
  private calculateEventFactor(good: CulturalMarketGood, gameTimeHours: number): number {
    let factor = 1.0;
    
    // Check active market events
    const activeEvents = this.marketEvents.filter(event => 
      gameTimeHours >= event.startTime && 
      gameTimeHours < (event.startTime + event.duration)
    );
    
    activeEvents.forEach(event => {
      if (event.affectedCategories.includes(good.category)) {
        const multiplier = event.priceMultipliers.get(good.itemId) || 
                          event.priceMultipliers.get(good.category) || 1.0;
        factor *= multiplier;
      }
    });
    
    return Math.max(0.2, Math.min(3.0, factor));
  }
  
  /**
   * Calculate price volatility based on historical fluctuations
   */
  private calculateVolatility(itemId: string): number {
    const history = this.priceHistory.get(itemId) || [];
    
    if (history.length < 3) return 0.1; // New items have low volatility
    
    // Calculate coefficient of variation
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / history.length;
    const standardDev = Math.sqrt(variance);
    
    const coefficientOfVariation = standardDev / mean;
    
    return Math.max(0.05, Math.min(0.3, coefficientOfVariation));
  }
  
  /**
   * Generate human-readable price explanation
   */
  private generatePriceExplanation(factors: PricingFactors, good: CulturalMarketGood): string[] {
    const explanation: string[] = [];
    
    if (factors.supplyFactor > 1.3) {
      explanation.push("📈 Abundant local supply keeps prices low");
    } else if (factors.supplyFactor < 0.7) {
      explanation.push("📉 Limited supply drives prices up");
    }
    
    if (factors.demandFactor > 1.3) {
      explanation.push("🔥 High demand from local population");
    } else if (factors.demandFactor < 0.7) {
      explanation.push("💤 Low demand in this market");
    }
    
    if (factors.seasonalFactor > 1.2) {
      explanation.push("🌟 Seasonal premium applies");
    } else if (factors.seasonalFactor < 0.8) {
      explanation.push("🍂 Seasonal abundance reduces price");
    }
    
    if (factors.culturalFactor > 1.3) {
      explanation.push("⭐ Highly valued by local culture");
    } else if (factors.culturalFactor < 0.7) {
      explanation.push("🚫 Limited cultural demand");
    }
    
    if (factors.eventFactor > 1.5) {
      explanation.push("⚡ Market events increase demand");
    } else if (factors.eventFactor < 0.7) {
      explanation.push("📊 Market conditions suppress price");
    }
    
    if (good.origin === 'exotic') {
      explanation.push("🌟 Exotic origin commands premium");
    }
    
    if (good.quality === 'exceptional' || good.quality === 'masterwork') {
      explanation.push("✨ Superior craftsmanship");
    }
    
    return explanation;
  }
  
  /**
   * Add a market event that affects pricing
   */
  addMarketEvent(event: MarketEvent): void {
    this.marketEvents.push(event);
  }
  
  /**
   * Update NPC market behavior
   */
  updateNpcBehavior(npc: NpcEntity): void {
    const behavior: NPCMarketBehavior = {
      npcId: npc.id,
      buyingPower: this.calculateBuyingPower(npc),
      needs: this.determineNpcNeeds(npc),
      selling: this.determineNpcSelling(npc),
      preferences: this.calculateNpcPreferences(npc),
      patience: this.calculateNpcPatience(npc),
      priceThreshold: this.calculatePriceThreshold(npc)
    };
    
    this.npcBehaviors.set(npc.id, behavior);
  }
  
  // Helper methods
  private canNpcProduce(npc: NpcEntity, itemId: string): boolean {
    const role = npc.role?.toLowerCase();
    const productionMap: Record<string, string[]> = {
      'blacksmith': ['IRON_TOOLS', 'WEAPONS', 'HORSESHOES'],
      'farmer': ['GRAIN', 'VEGETABLES', 'MILK'],
      'baker': ['BREAD', 'PASTRIES'],
      'weaver': ['CLOTH', 'CLOTHING'],
      'potter': ['POTTERY', 'VESSELS']
    };
    
    const canProduce = productionMap[role || ''] || [];
    return canProduce.some(product => itemId.includes(product));
  }
  
  private isItemAvailable(itemId: string, mapData: MapData, npcs: NpcEntity[]): boolean {
    // Check if item is produced locally
    return mapData.terrainStructures?.some(s => s.outputGoods?.includes(itemId)) ||
           npcs.some(npc => this.canNpcProduce(npc, itemId));
  }
  
  private getBiomeSupplyMultiplier(good: CulturalMarketGood, mapData: MapData): number {
    // Count relevant biomes for this good type
    const tiles = mapData.tiles.flat();
    let suitableTiles = 0;
    
    tiles.forEach(tile => {
      if (this.isBiomeSuitableForGood(tile.biome, good)) {
        suitableTiles++;
      }
    });
    
    const suitabilityRatio = suitableTiles / tiles.length;
    return 0.8 + (suitabilityRatio * 0.4); // 0.8 to 1.2 multiplier
  }
  
  private isBiomeSuitableForGood(biome: BiomeType, good: CulturalMarketGood): boolean {
    const suitability: Record<string, BiomeType[]> = {
      'food': [BiomeType.FARMLAND, BiomeType.GRASSLAND, BiomeType.RIVER],
      'raw_material': [BiomeType.FOREST, BiomeType.MOUNTAIN, BiomeType.RIVER],
      'luxury': [BiomeType.MOUNTAIN, BiomeType.COASTAL_WATERS]
    };
    
    return suitability[good.category]?.includes(biome) || false;
  }
  
  private doesNpcNeed(npc: NpcEntity, itemId: string): boolean {
    // NPCs need items based on their role and health
    if (npc.health < npc.maxHealth * 0.7 && itemId.includes('MEDICINE')) {
      return true;
    }
    
    const role = npc.role?.toLowerCase();
    const needs: Record<string, string[]> = {
      'blacksmith': ['COAL', 'IRON_ORE', 'TOOLS'],
      'farmer': ['SEEDS', 'TOOLS', 'ANIMALS'],
      'merchant': ['LUXURY_GOODS', 'EXOTIC_ITEMS']
    };
    
    return needs[role || '']?.some(need => itemId.includes(need)) || false;
  }
  
  private isEssentialGood(good: CulturalMarketGood): boolean {
    const essentials = ['FOOD', 'WATER', 'CLOTH', 'TOOLS', 'MEDICINE'];
    return essentials.some(essential => 
      good.category === essential.toLowerCase() || good.itemId.includes(essential)
    );
  }
  
  private updatePriceHistory(itemId: string, price: number): void {
    if (!this.priceHistory.has(itemId)) {
      this.priceHistory.set(itemId, []);
    }
    
    const history = this.priceHistory.get(itemId)!;
    history.push(price);
    
    // Keep only last 20 prices
    if (history.length > 20) {
      history.shift();
    }
  }
  
  private calculateBuyingPower(npc: NpcEntity): number {
    const baseWealth: Record<string, number> = {
      'poor': 10,
      'modest': 25,
      'comfortable': 50,
      'wealthy': 150,
      'noble': 300
    };
    
    return baseWealth[npc.wealthLevel] || 25;
  }
  
  private determineNpcNeeds(npc: NpcEntity): string[] {
    const needs: string[] = [];
    
    // Health-based needs
    if (npc.health < npc.maxHealth * 0.8) {
      needs.push('MEDICINE', 'HEALING_POTIONS');
    }
    
    // Role-based needs
    const roleNeeds: Record<string, string[]> = {
      'blacksmith': ['COAL', 'IRON_ORE'],
      'farmer': ['SEEDS', 'TOOLS'],
      'merchant': ['LUXURY_GOODS'],
      'scholar': ['BOOKS', 'PAPER']
    };
    
    const role = npc.role?.toLowerCase();
    if (role && roleNeeds[role]) {
      needs.push(...roleNeeds[role]);
    }
    
    return needs;
  }
  
  private determineNpcSelling(npc: NpcEntity): string[] {
    const selling: string[] = [];
    
    // Role-based selling
    const roleSelling: Record<string, string[]> = {
      'blacksmith': ['WEAPONS', 'TOOLS', 'HORSESHOES'],
      'farmer': ['GRAIN', 'VEGETABLES', 'DAIRY'],
      'merchant': ['EXOTIC_GOODS', 'SPICES'],
      'herbalist': ['MEDICINES', 'HERBS']
    };
    
    const role = npc.role?.toLowerCase();
    if (role && roleSelling[role]) {
      selling.push(...roleSelling[role]);
    }
    
    return selling;
  }
  
  private calculateNpcPreferences(npc: NpcEntity): Map<string, number> {
    const preferences = new Map<string, number>();
    
    // Personality affects preferences
    if (npc.personality.openness > 0.7) {
      preferences.set('EXOTIC_GOODS', 1.3);
    }
    
    if (npc.socialContext.religiosity > 0.7) {
      preferences.set('RELIGIOUS_ITEMS', 1.4);
    }
    
    return preferences;
  }
  
  private calculateNpcPatience(npc: NpcEntity): number {
    // Patient NPCs wait for better prices
    return npc.personality.conscientiousness * 10 + Math.random() * 5;
  }
  
  private calculatePriceThreshold(npc: NpcEntity): number {
    // Wealthy NPCs pay higher prices
    const wealthMultipliers: Record<string, number> = {
      'poor': 0.8,
      'modest': 0.9,
      'comfortable': 1.1,
      'wealthy': 1.3,
      'noble': 1.5
    };
    
    return wealthMultipliers[npc.wealthLevel] || 1.0;
  }
  
  /**
   * Get current supply/demand levels for market analysis
   */
  getMarketAnalysis(): { supply: Map<string, number>, demand: Map<string, number> } {
    return {
      supply: new Map(this.supplyLevels),
      demand: new Map(this.demandLevels)
    };
  }
  
  /**
   * Get price trend for an item
   */
  getPriceTrend(itemId: string): 'rising' | 'falling' | 'stable' {
    const history = this.priceHistory.get(itemId);
    if (!history || history.length < 5) return 'stable';
    
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'rising';
    if (change < -0.1) return 'falling';
    return 'stable';
  }
}

export const dynamicPricingEngine = new DynamicPricingEngine();