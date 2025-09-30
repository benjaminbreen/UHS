/**
 * services/npcMarketParticipationService.ts - Phase 2: NPC market participation system
 * 
 * This service handles:
 * - NPCs actively buying and selling in markets
 * - Dynamic inventory changes based on NPC behavior
 * - NPC-driven price fluctuations
 * - Market memory and reputation systems
 * - NPC trading schedules and patterns
 */

import { 
  NpcEntity, 
  MapData, 
  Season, 
  HistoricalEra, 
  CulturalZone,
  Item 
} from '../types';
import { CulturalMarketGood } from './culturalMarketplaceService';
import { dynamicPricingEngine, NPCMarketBehavior, PricingFactors } from './dynamicPricingEngine';
import { ITEM_DEFINITIONS, getItemDefinition } from '../constants/gameData/itemDefinitions';

export interface NPCTransaction {
  npcId: string;
  npcName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
  timestamp: number;
  location: { x: number, y: number };
}

export interface NPCMarketMemory {
  npcId: string;
  recentTransactions: NPCTransaction[];
  favoriteVendors: Map<string, number>; // vendorId -> reputation
  priceMemory: Map<string, number[]>; // itemId -> recent prices seen
  marketVisitSchedule: number[]; // hours when NPC visits market
  lastVisit: number;
  successfulDeals: number;
  failedNegotiations: number;
}

export interface MarketActivity {
  currentVisitors: NpcEntity[];
  recentTransactions: NPCTransaction[];
  busyHours: number[]; // Hours when market is most active
  marketSentiment: 'bullish' | 'bearish' | 'stable';
  dominantTraders: { npcId: string, volume: number }[];
}

export class NPCMarketParticipationService {
  private npcMemories = new Map<string, NPCMarketMemory>();
  private transactionHistory: NPCTransaction[] = [];
  private marketActivity: MarketActivity = {
    currentVisitors: [],
    recentTransactions: [],
    busyHours: [9, 10, 11, 14, 15, 16], // Typical market hours
    marketSentiment: 'stable',
    dominantTraders: []
  };
  
  /**
   * Process NPCs participating in market
   */
  processMarketParticipation(
    npcs: NpcEntity[],
    marketplace: CulturalMarketGood[],
    mapData: MapData,
    season: Season,
    gameTimeHours: number,
    culturalZone: CulturalZone,
    era: HistoricalEra
  ): {
    updatedMarketplace: CulturalMarketGood[],
    transactions: NPCTransaction[],
    visitingNpcs: NpcEntity[]
  } {
    
    const transactions: NPCTransaction[] = [];
    const visitingNpcs: NpcEntity[] = [];
    let updatedMarketplace = [...marketplace];
    
    // Determine which NPCs visit the market this hour
    const marketVisitors = this.determineMarketVisitors(npcs, gameTimeHours);
    visitingNpcs.push(...marketVisitors);
    
    // Process each visitor's market activities
    for (const npc of marketVisitors) {
      const npcMemory = this.getNpcMemory(npc.id);
      
      // Update pricing engine with NPC behavior
      dynamicPricingEngine.updateNpcBehavior(npc);
      
      // Determine what NPC wants to buy
      const buyingInterests = this.determineNpcBuyingInterests(npc, marketplace, npcMemory);
      
      // Process buying transactions
      for (const interest of buyingInterests) {
        const transaction = this.attemptNpcPurchase(npc, interest, npcMemory, gameTimeHours);
        if (transaction) {
          transactions.push(transaction);
          updatedMarketplace = this.updateMarketplaceStock(updatedMarketplace, transaction);
          this.recordTransaction(transaction, npcMemory);
        }
      }
      
      // Determine what NPC wants to sell
      const sellingItems = this.determineNpcSellingItems(npc, marketplace, npcMemory);
      
      // Process selling transactions
      for (const item of sellingItems) {
        const transaction = this.attemptNpcSale(npc, item, marketplace, gameTimeHours);
        if (transaction) {
          transactions.push(transaction);
          updatedMarketplace = this.addToMarketplaceStock(updatedMarketplace, transaction, npc);
          this.recordTransaction(transaction, npcMemory);
        }
      }
      
      // Update visit time and memory
      npcMemory.lastVisit = gameTimeHours;
      this.updateNpcPriceMemory(npcMemory, marketplace);
    }
    
    // Update market activity
    this.updateMarketActivity(transactions, visitingNpcs);
    
    // Apply market sentiment effects
    updatedMarketplace = this.applyMarketSentiment(updatedMarketplace);
    
    return {
      updatedMarketplace,
      transactions,
      visitingNpcs
    };
  }
  
  /**
   * Determine which NPCs visit the market this hour
   */
  private determineMarketVisitors(npcs: NpcEntity[], gameTimeHours: number): NpcEntity[] {
    const visitors: NpcEntity[] = [];
    const currentHour = gameTimeHours % 24;
    
    for (const npc of npcs) {
      const memory = this.getNpcMemory(npc.id);
      
      // Check if it's a scheduled visit time
      const isScheduledTime = memory.marketVisitSchedule.includes(currentHour);
      
      // Check if enough time has passed since last visit
      const timeSinceLastVisit = gameTimeHours - memory.lastVisit;
      const minTimeBetweenVisits = this.calculateMinTimeBetweenVisits(npc);
      
      // Check if NPC has urgent needs
      const hasUrgentNeeds = this.hasUrgentNeeds(npc);
      
      // Random chance for spontaneous visits
      const spontaneousChance = this.calculateSpontaneousVisitChance(npc);
      
      if ((isScheduledTime && timeSinceLastVisit >= minTimeBetweenVisits) ||
          hasUrgentNeeds ||
          (Math.random() < spontaneousChance && timeSinceLastVisit >= 6)) {
        visitors.push(npc);
      }
    }
    
    return visitors;
  }
  
  /**
   * Determine what NPC is interested in buying
   */
  private determineNpcBuyingInterests(
    npc: NpcEntity, 
    marketplace: CulturalMarketGood[], 
    memory: NPCMarketMemory
  ): CulturalMarketGood[] {
    const interests: CulturalMarketGood[] = [];
    const buyingPower = this.calculateNpcBuyingPower(npc);
    
    // Priority 1: Essential needs (health, profession requirements)
    if (npc.health < npc.maxHealth * 0.8) {
      const medicines = marketplace.filter(item => 
        item.category === 'medicine' && item.currentPrice <= buyingPower * 0.5
      );
      interests.push(...medicines.slice(0, 2));
    }
    
    // Priority 2: Professional needs
    const professionalNeeds = this.getProfessionalNeeds(npc);
    for (const need of professionalNeeds) {
      const availableItems = marketplace.filter(item => 
        item.itemId.includes(need) && item.currentPrice <= buyingPower * 0.3
      );
      interests.push(...availableItems.slice(0, 1));
    }
    
    // Priority 3: Personal goals
    if (npc.personalGoal?.archetype === 'ACQUIRE' && npc.personalGoal.targetId) {
      const goalItem = marketplace.find(item => 
        item.itemId === npc.personalGoal?.targetId
      );
      if (goalItem && goalItem.currentPrice <= buyingPower * 0.8) {
        interests.push(goalItem);
      }
    }
    
    // Priority 4: Luxury items for wealthy NPCs
    if (npc.wealthLevel === 'wealthy' || npc.wealthLevel === 'noble') {
      const luxuries = marketplace.filter(item => 
        item.category === 'luxury' && item.currentPrice <= buyingPower * 0.4
      );
      interests.push(...luxuries.slice(0, 1));
    }
    
    // Priority 5: Good deals (items significantly below remembered price)
    for (const item of marketplace) {
      const rememberedPrices = memory.priceMemory.get(item.itemId) || [];
      if (rememberedPrices.length > 0) {
        const averagePrice = rememberedPrices.reduce((a, b) => a + b, 0) / rememberedPrices.length;
        if (item.currentPrice < averagePrice * 0.8) { // 20% below average
          interests.push(item);
        }
      }
    }
    
    return interests.slice(0, 5); // Limit to prevent overwhelming
  }
  
  /**
   * Attempt NPC purchase
   */
  private attemptNpcPurchase(
    npc: NpcEntity, 
    item: CulturalMarketGood, 
    memory: NPCMarketMemory,
    gameTimeHours: number
  ): NPCTransaction | null {
    const buyingPower = this.calculateNpcBuyingPower(npc);
    const maxPrice = buyingPower * this.getNpcPriceThreshold(npc);
    
    // Check if NPC can afford and willing to pay
    if (item.currentPrice > maxPrice) {
      memory.failedNegotiations++;
      return null;
    }
    
    // Check if item is available
    if (item.quantity <= 0) {
      return null;
    }
    
    // Determine quantity to buy (based on NPC needs and wealth)
    let quantityToBuy = 1;
    if (this.isEssentialForNpc(npc, item)) {
      quantityToBuy = Math.min(3, item.quantity);
    } else if (npc.wealthLevel === 'wealthy' || npc.wealthLevel === 'noble') {
      quantityToBuy = Math.min(2, item.quantity);
    }
    
    // Final affordability check
    const totalCost = item.currentPrice * quantityToBuy;
    if (totalCost > buyingPower) {
      quantityToBuy = Math.floor(buyingPower / item.currentPrice);
    }
    
    if (quantityToBuy <= 0) return null;
    
    memory.successfulDeals++;
    
    return {
      npcId: npc.id,
      npcName: npc.name,
      itemId: item.itemId,
      itemName: item.name,
      quantity: quantityToBuy,
      price: item.currentPrice,
      type: 'buy',
      timestamp: gameTimeHours,
      location: { x: npc.x, y: npc.y }
    };
  }
  
  /**
   * Determine what NPC wants to sell
   */
  private determineNpcSellingItems(
    npc: NpcEntity, 
    marketplace: CulturalMarketGood[], 
    memory: NPCMarketMemory
  ): { itemId: string, quantity: number, quality: string }[] {
    const sellingItems: { itemId: string, quantity: number, quality: string }[] = [];
    
    // Sell items based on NPC profession
    const professionalGoods = this.getProfessionalGoods(npc);
    for (const good of professionalGoods) {
      // Determine quality based on NPC skills and wealth
      const quality = this.determineNpcCraftQuality(npc);
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      sellingItems.push({
        itemId: good,
        quantity,
        quality
      });
    }
    
    // Occasionally sell excess inventory items
    if (npc.inventory && Math.random() < 0.3) {
      const excessItems = npc.inventory.filter(item => 
        Math.random() < 0.2 // Random chance to sell
      );
      
      for (const item of excessItems.slice(0, 2)) {
        sellingItems.push({
          itemId: item.baseId,
          quantity: 1,
          quality: 'standard'
        });
      }
    }
    
    return sellingItems;
  }
  
  /**
   * Attempt NPC sale
   */
  private attemptNpcSale(
    npc: NpcEntity,
    item: { itemId: string, quantity: number, quality: string },
    marketplace: CulturalMarketGood[],
    gameTimeHours: number
  ): NPCTransaction | null {
    
    // Check if there's demand for this item
    const existingItem = marketplace.find(good => good.itemId === item.itemId);
    const baseDemand = existingItem ? (existingItem.quantity < 5 ? 1.2 : 0.8) : 1.0;
    
    // Random chance of sale based on demand
    if (Math.random() > baseDemand * 0.7) {
      return null; // No buyer found
    }
    
    // Calculate selling price
    const basePrice = getItemDefinition(item.itemId)?.value || 10;
    const qualityMultiplier = this.getQualityMultiplier(item.quality);
    const sellingPrice = Math.round(basePrice * qualityMultiplier * baseDemand);
    
    const itemName = getItemDefinition(item.itemId)?.name || item.itemId.replace(/_/g, ' ');
    
    return {
      npcId: npc.id,
      npcName: npc.name,
      itemId: item.itemId,
      itemName,
      quantity: item.quantity,
      price: sellingPrice,
      type: 'sell',
      timestamp: gameTimeHours,
      location: { x: npc.x, y: npc.y }
    };
  }
  
  /**
   * Update marketplace stock after NPC purchase
   */
  private updateMarketplaceStock(
    marketplace: CulturalMarketGood[], 
    transaction: NPCTransaction
  ): CulturalMarketGood[] {
    return marketplace.map(item => {
      if (item.itemId === transaction.itemId) {
        return {
          ...item,
          quantity: Math.max(0, item.quantity - transaction.quantity)
        };
      }
      return item;
    });
  }
  
  /**
   * Add to marketplace stock after NPC sale
   */
  private addToMarketplaceStock(
    marketplace: CulturalMarketGood[], 
    transaction: NPCTransaction,
    seller: NpcEntity
  ): CulturalMarketGood[] {
    const existingItemIndex = marketplace.findIndex(item => item.itemId === transaction.itemId);
    
    if (existingItemIndex >= 0) {
      // Add to existing stock
      const updatedMarketplace = [...marketplace];
      updatedMarketplace[existingItemIndex] = {
        ...updatedMarketplace[existingItemIndex],
        quantity: updatedMarketplace[existingItemIndex].quantity + transaction.quantity
      };
      return updatedMarketplace;
    } else {
      // Add new item to marketplace
      const basePrice = getItemDefinition(transaction.itemId)?.value || 10;
      const newItem: CulturalMarketGood = {
        itemId: transaction.itemId,
        name: transaction.itemName,
        basePrice,
        currentPrice: transaction.price,
        quantity: transaction.quantity,
        quality: 'standard' as any,
        origin: 'local' as any,
        category: getItemDefinition(transaction.itemId)?.category as any || 'manufactured' as any
      };
      
      return [...marketplace, newItem];
    }
  }
  
  /**
   * Record transaction in NPC memory
   */
  private recordTransaction(transaction: NPCTransaction, memory: NPCMarketMemory): void {
    memory.recentTransactions.push(transaction);
    
    // Keep only recent transactions
    if (memory.recentTransactions.length > 20) {
      memory.recentTransactions.shift();
    }
    
    // Update price memory
    if (!memory.priceMemory.has(transaction.itemId)) {
      memory.priceMemory.set(transaction.itemId, []);
    }
    
    const prices = memory.priceMemory.get(transaction.itemId)!;
    prices.push(transaction.price);
    
    // Keep only recent prices
    if (prices.length > 10) {
      prices.shift();
    }
  }
  
  /**
   * Update market activity tracking
   */
  private updateMarketActivity(transactions: NPCTransaction[], visitors: NpcEntity[]): void {
    this.marketActivity.currentVisitors = visitors;
    this.marketActivity.recentTransactions = transactions;
    
    // Update trader volumes
    const traderVolumes = new Map<string, number>();
    transactions.forEach(transaction => {
      const current = traderVolumes.get(transaction.npcId) || 0;
      traderVolumes.set(transaction.npcId, current + transaction.price * transaction.quantity);
    });
    
    this.marketActivity.dominantTraders = Array.from(traderVolumes.entries())
      .map(([npcId, volume]) => ({ npcId, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
    
    // Update market sentiment
    this.updateMarketSentiment(transactions);
  }
  
  /**
   * Update market sentiment based on recent activity
   */
  private updateMarketSentiment(transactions: NPCTransaction[]): void {
    if (transactions.length === 0) return;
    
    const buyTransactions = transactions.filter(t => t.type === 'buy');
    const sellTransactions = transactions.filter(t => t.type === 'sell');
    
    const buyVolume = buyTransactions.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const sellVolume = sellTransactions.reduce((sum, t) => sum + t.price * t.quantity, 0);
    
    const ratio = sellVolume > 0 ? buyVolume / sellVolume : 2;
    
    if (ratio > 1.3) {
      this.marketActivity.marketSentiment = 'bullish'; // More buying than selling
    } else if (ratio < 0.7) {
      this.marketActivity.marketSentiment = 'bearish'; // More selling than buying
    } else {
      this.marketActivity.marketSentiment = 'stable';
    }
  }
  
  /**
   * Apply market sentiment to pricing
   */
  private applyMarketSentiment(marketplace: CulturalMarketGood[]): CulturalMarketGood[] {
    const sentimentMultiplier = this.marketActivity.marketSentiment === 'bullish' ? 1.05 :
                               this.marketActivity.marketSentiment === 'bearish' ? 0.95 : 1.0;
    
    return marketplace.map(item => ({
      ...item,
      currentPrice: Math.round(item.currentPrice * sentimentMultiplier)
    }));
  }
  
  /**
   * Get or create NPC memory
   */
  private getNpcMemory(npcId: string): NPCMarketMemory {
    if (!this.npcMemories.has(npcId)) {
      const memory: NPCMarketMemory = {
        npcId,
        recentTransactions: [],
        favoriteVendors: new Map(),
        priceMemory: new Map(),
        marketVisitSchedule: this.generateVisitSchedule(),
        lastVisit: -24, // Allow immediate first visit
        successfulDeals: 0,
        failedNegotiations: 0
      };
      this.npcMemories.set(npcId, memory);
    }
    
    return this.npcMemories.get(npcId)!;
  }
  
  // Helper methods
  private generateVisitSchedule(): number[] {
    const schedule: number[] = [];
    const numVisits = 1 + Math.floor(Math.random() * 3); // 1-3 visits per day
    
    for (let i = 0; i < numVisits; i++) {
      // Prefer morning and afternoon hours
      const hour = Math.random() < 0.7 ? 
        (9 + Math.floor(Math.random() * 8)) : // 9-16 (business hours)
        (6 + Math.floor(Math.random() * 18)); // 6-23 (any time)
      
      if (!schedule.includes(hour)) {
        schedule.push(hour);
      }
    }
    
    return schedule.sort();
  }
  
  private calculateMinTimeBetweenVisits(npc: NpcEntity): number {
    // Wealthy NPCs visit more frequently
    const wealthMultiplier = npc.wealthLevel === 'wealthy' ? 0.7 : 
                           npc.wealthLevel === 'poor' ? 1.3 : 1.0;
    
    return Math.round(12 * wealthMultiplier); // 12 hours base, adjusted by wealth
  }
  
  private hasUrgentNeeds(npc: NpcEntity): boolean {
    return npc.health < npc.maxHealth * 0.5 || // Very low health
           npc.personalGoal?.archetype === 'ACQUIRE'; // Has acquisition goal
  }
  
  private calculateSpontaneousVisitChance(npc: NpcEntity): number {
    let chance = 0.1; // Base 10% chance
    
    // Personality affects spontaneity
    chance += npc.personality.extraversion * 0.1;
    chance += npc.personality.openness * 0.05;
    
    // Wealth affects frequency
    if (npc.wealthLevel === 'wealthy') chance += 0.05;
    if (npc.wealthLevel === 'poor') chance -= 0.03;
    
    return Math.max(0.02, Math.min(0.3, chance));
  }
  
  private calculateNpcBuyingPower(npc: NpcEntity): number {
    const baseWealth: Record<string, number> = {
      'poor': 15,
      'modest': 35,
      'comfortable': 70,
      'wealthy': 150,
      'noble': 300
    };
    
    let buyingPower = baseWealth[npc.wealthLevel] || 35;
    
    // Reduce buying power if NPC has been spending a lot recently
    const memory = this.getNpcMemory(npc.id);
    const recentSpending = memory.recentTransactions
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + t.price * t.quantity, 0);
    
    buyingPower = Math.max(5, buyingPower - recentSpending * 0.1);
    
    return buyingPower;
  }
  
  private getNpcPriceThreshold(npc: NpcEntity): number {
    // How much above base price NPC will pay
    const thresholds: Record<string, number> = {
      'poor': 0.8,
      'modest': 1.0,
      'comfortable': 1.2,
      'wealthy': 1.5,
      'noble': 2.0
    };
    
    return thresholds[npc.wealthLevel] || 1.0;
  }
  
  private getProfessionalNeeds(npc: NpcEntity): string[] {
    const needs: Record<string, string[]> = {
      'blacksmith': ['IRON_ORE', 'COAL', 'TOOLS'],
      'farmer': ['SEEDS', 'TOOLS', 'ANIMALS'],
      'merchant': ['LUXURY_GOODS', 'EXOTIC_ITEMS'],
      'baker': ['FLOUR', 'GRAIN', 'SALT'],
      'herbalist': ['HERBS', 'MEDICINAL_PLANTS'],
      'weaver': ['WOOL', 'COTTON', 'DYES']
    };
    
    return needs[npc.role?.toLowerCase() || ''] || [];
  }
  
  private isEssentialForNpc(npc: NpcEntity, item: CulturalMarketGood): boolean {
    if (item.category === 'medicine' && npc.health < npc.maxHealth * 0.8) {
      return true;
    }
    
    const professionalNeeds = this.getProfessionalNeeds(npc);
    return professionalNeeds.some(need => item.itemId.includes(need));
  }
  
  private getProfessionalGoods(npc: NpcEntity): string[] {
    const goods: Record<string, string[]> = {
      'blacksmith': ['IRON_TOOLS', 'WEAPONS', 'HORSESHOES', 'NAILS'],
      'farmer': ['GRAIN', 'VEGETABLES', 'DAIRY', 'EGGS'],
      'baker': ['BREAD', 'PASTRIES', 'FLOUR'],
      'herbalist': ['MEDICINES', 'POTIONS', 'HERBS'],
      'weaver': ['CLOTH', 'CLOTHING', 'ROPE'],
      'potter': ['POTTERY', 'VESSELS', 'CLAY_ITEMS'],
      'carpenter': ['FURNITURE', 'TOOLS', 'WOOD_ITEMS']
    };
    
    return goods[npc.role?.toLowerCase() || ''] || [];
  }
  
  private determineNpcCraftQuality(npc: NpcEntity): string {
    // Quality based on NPC level and wealth
    const baseQuality = npc.stats.level || 1;
    const wealthBonus = npc.wealthLevel === 'wealthy' ? 2 : 
                       npc.wealthLevel === 'poor' ? -1 : 0;
    
    const qualityScore = baseQuality + wealthBonus;
    
    if (qualityScore >= 8) return 'exceptional';
    if (qualityScore >= 6) return 'fine';
    if (qualityScore >= 4) return 'standard';
    return 'poor';
  }
  
  private getQualityMultiplier(quality: string): number {
    const multipliers: Record<string, number> = {
      'poor': 0.7,
      'standard': 1.0,
      'fine': 1.3,
      'exceptional': 1.8,
      'masterwork': 2.5
    };
    
    return multipliers[quality] || 1.0;
  }
  
  private updateNpcPriceMemory(memory: NPCMarketMemory, marketplace: CulturalMarketGood[]): void {
    // NPCs remember current prices for future reference
    for (const item of marketplace) {
      if (!memory.priceMemory.has(item.itemId)) {
        memory.priceMemory.set(item.itemId, []);
      }
      
      const prices = memory.priceMemory.get(item.itemId)!;
      
      // Only add if significantly different from last remembered price
      if (prices.length === 0 || Math.abs(prices[prices.length - 1] - item.currentPrice) > item.currentPrice * 0.1) {
        prices.push(item.currentPrice);
        
        if (prices.length > 5) {
          prices.shift();
        }
      }
    }
  }
  
  /**
   * Get market activity for UI display
   */
  getMarketActivity(): MarketActivity {
    return { ...this.marketActivity };
  }
  
  /**
   * Get NPC transaction history for a specific NPC
   */
  getNpcTransactionHistory(npcId: string): NPCTransaction[] {
    const memory = this.npcMemories.get(npcId);
    return memory ? [...memory.recentTransactions] : [];
  }
  
  /**
   * Get market reputation for an NPC
   */
  getNpcMarketReputation(npcId: string): { 
    successRate: number, 
    totalDeals: number, 
    averageTransactionValue: number 
  } {
    const memory = this.npcMemories.get(npcId);
    if (!memory) return { successRate: 0, totalDeals: 0, averageTransactionValue: 0 };
    
    const totalAttempts = memory.successfulDeals + memory.failedNegotiations;
    const successRate = totalAttempts > 0 ? memory.successfulDeals / totalAttempts : 0;
    
    const avgValue = memory.recentTransactions.length > 0 ?
      memory.recentTransactions.reduce((sum, t) => sum + t.price * t.quantity, 0) / memory.recentTransactions.length :
      0;
    
    return {
      successRate,
      totalDeals: memory.successfulDeals,
      averageTransactionValue: avgValue
    };
  }
}

export const npcMarketParticipationService = new NPCMarketParticipationService();