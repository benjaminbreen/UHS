/**
 * Merchant Memory Service
 * Tracks trade history, relationships, and merchant behavior
 */

import { NpcEntity, PlayerCharacter, Item } from '../types';

export interface TradeTransaction {
  itemId: string;
  itemName: string;
  action: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
  marketPrice: number; // What the market price was at time of transaction
  playerProfit?: number; // For sell transactions
}

export interface MerchantMemory {
  merchantId: string;
  merchantName: string;
  playerId: string;
  tradeHistory: TradeTransaction[];
  economicReputation: number; // 0-100, affects prices
  priceModifier: number; // 0.8 = 20% discount, 1.2 = 20% markup
  exclusiveGoods: string[]; // Items only available with high reputation
  totalVolume: number; // Total coins traded
  lastInteraction: number;
  trustLevel: 'stranger' | 'acquaintance' | 'regular' | 'trusted' | 'vip';
  specialOffers: Array<{
    itemId: string;
    discount: number;
    reason: string;
    expiresAt: number;
  }>;
  preferences: {
    favoriteItems: string[]; // Items this merchant particularly wants
    dislikedItems: string[]; // Items they're less interested in
  };
  questsCompleted: number;
  lastMarketEvent?: string; // Last crisis/event that affected them
}

class MerchantMemoryService {
  private memories: Map<string, MerchantMemory> = new Map();
  private readonly STORAGE_KEY = 'merchant_memories';
  private readonly REPUTATION_DECAY_RATE = 0.95; // Reputation decays 5% per week without interaction
  private readonly REPUTATION_THRESHOLDS = {
    stranger: 0,
    acquaintance: 20,
    regular: 40,
    trusted: 60,
    vip: 80
  };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get or create merchant memory
   */
  getMerchantMemory(merchant: NpcEntity, playerId: string): MerchantMemory {
    const key = `${merchant.id}_${playerId}`;
    
    if (!this.memories.has(key)) {
      const memory: MerchantMemory = {
        merchantId: merchant.id,
        merchantName: merchant.name,
        playerId,
        tradeHistory: [],
        economicReputation: 10, // Start with minimal reputation
        priceModifier: 1.0,
        exclusiveGoods: [],
        totalVolume: 0,
        lastInteraction: Date.now(),
        trustLevel: 'stranger',
        specialOffers: [],
        preferences: {
          favoriteItems: this.generateMerchantPreferences(merchant),
          dislikedItems: []
        },
        questsCompleted: 0
      };
      
      this.memories.set(key, memory);
      this.saveToStorage();
    }
    
    const memory = this.memories.get(key)!;
    
    // Apply reputation decay if it's been a while
    this.applyReputationDecay(memory);
    
    return memory;
  }

  /**
   * Record a trade transaction
   */
  recordTransaction(
    merchant: NpcEntity,
    playerId: string,
    item: { id: string; name: string; baseId: string },
    action: 'buy' | 'sell',
    price: number,
    quantity: number,
    marketPrice: number
  ): void {
    const memory = this.getMerchantMemory(merchant, playerId);
    
    const transaction: TradeTransaction = {
      itemId: item.baseId || item.id,
      itemName: item.name,
      action,
      price,
      quantity,
      timestamp: Date.now(),
      marketPrice,
      playerProfit: action === 'sell' ? price - marketPrice : undefined
    };
    
    memory.tradeHistory.push(transaction);
    memory.totalVolume += price * quantity;
    memory.lastInteraction = Date.now();
    
    // Update reputation based on transaction
    this.updateReputationFromTrade(memory, transaction, merchant);
    
    // Check for trust level upgrade
    this.updateTrustLevel(memory);
    
    // Generate special offers if appropriate
    this.checkForSpecialOffers(memory, merchant);
    
    // Keep only last 100 transactions
    if (memory.tradeHistory.length > 100) {
      memory.tradeHistory = memory.tradeHistory.slice(-100);
    }
    
    this.saveToStorage();
    
    console.log(`[MerchantMemory] Recorded ${action} transaction with ${merchant.name}: ${quantity}x ${item.name} for ${price} coins`);
  }

  /**
   * Update reputation from trade
   */
  private updateReputationFromTrade(
    memory: MerchantMemory,
    transaction: TradeTransaction,
    merchant: NpcEntity
  ): void {
    let reputationChange = 0;
    
    // Base reputation for any trade
    reputationChange += 1;
    
    // Bonus for trading favorite items
    if (memory.preferences.favoriteItems.includes(transaction.itemId)) {
      reputationChange += 3;
      console.log(`[MerchantMemory] Bonus reputation for trading favorite item: ${transaction.itemName}`);
    }
    
    // Penalty for unfair prices (buying too cheap or selling too expensive)
    const fairnessRatio = transaction.price / transaction.marketPrice;
    if (transaction.action === 'buy' && fairnessRatio > 1.5) {
      // Player bought at >150% market price, merchant likes this
      reputationChange += 2;
    } else if (transaction.action === 'sell' && fairnessRatio < 0.5) {
      // Player sold at <50% market price, merchant likes getting a deal
      reputationChange += 2;
    } else if (transaction.action === 'sell' && fairnessRatio > 2.0) {
      // Player is price gouging
      reputationChange -= 5;
      console.log(`[MerchantMemory] Reputation penalty for price gouging`);
    }
    
    // Volume bonus for large transactions
    const transactionValue = transaction.price * transaction.quantity;
    if (transactionValue > 500) {
      reputationChange += 2;
    } else if (transactionValue > 1000) {
      reputationChange += 5;
    }
    
    // Apply the change
    memory.economicReputation = Math.max(0, Math.min(100, 
      memory.economicReputation + reputationChange
    ));
    
    // Update price modifier based on reputation
    this.updatePriceModifier(memory);
  }

  /**
   * Update price modifier based on reputation
   */
  private updatePriceModifier(memory: MerchantMemory): void {
    // At 0 reputation: 1.2x prices (20% markup)
    // At 50 reputation: 1.0x prices (normal)
    // At 100 reputation: 0.8x prices (20% discount)
    const repNormalized = memory.economicReputation / 100;
    memory.priceModifier = 1.2 - (0.4 * repNormalized);
    
    // Special discounts for VIP customers
    if (memory.trustLevel === 'vip') {
      memory.priceModifier *= 0.9; // Additional 10% off
    }
  }

  /**
   * Update trust level based on reputation and history
   */
  private updateTrustLevel(memory: MerchantMemory): void {
    const oldLevel = memory.trustLevel;
    
    if (memory.economicReputation >= this.REPUTATION_THRESHOLDS.vip) {
      memory.trustLevel = 'vip';
    } else if (memory.economicReputation >= this.REPUTATION_THRESHOLDS.trusted) {
      memory.trustLevel = 'trusted';
    } else if (memory.economicReputation >= this.REPUTATION_THRESHOLDS.regular) {
      memory.trustLevel = 'regular';
    } else if (memory.economicReputation >= this.REPUTATION_THRESHOLDS.acquaintance) {
      memory.trustLevel = 'acquaintance';
    } else {
      memory.trustLevel = 'stranger';
    }
    
    if (oldLevel !== memory.trustLevel) {
      console.log(`[MerchantMemory] Trust level changed from ${oldLevel} to ${memory.trustLevel}`);
      
      // Unlock exclusive goods at higher trust levels
      if (memory.trustLevel === 'trusted' || memory.trustLevel === 'vip') {
        this.unlockExclusiveGoods(memory);
      }
    }
  }

  /**
   * Generate merchant preferences based on their personality
   */
  private generateMerchantPreferences(merchant: NpcEntity): string[] {
    const preferences: string[] = [];
    
    // Based on merchant wealth level
    if (merchant.wealthLevel === 'wealthy') {
      preferences.push('silk', 'spices', 'jewelry', 'fine_cloth');
    } else if (merchant.wealthLevel === 'poor') {
      preferences.push('food', 'basic_tools', 'cheap_cloth');
    }
    
    // Based on merchant personality (numeric traits)
    if (merchant.personality) {
      // High openness and low agreeableness = ambitious
      if (merchant.personality.openness > 0.7 && merchant.personality.agreeableness < 0.4) {
        preferences.push('luxury_goods', 'rare_items');
      }
      // High conscientiousness = practical
      if (merchant.personality.conscientiousness > 0.7) {
        preferences.push('tools', 'raw_materials');
      }
    }
    
    // Default preferences if none set
    if (preferences.length === 0) {
      preferences.push('grain', 'cloth', 'metal');
    }
    
    return preferences;
  }

  /**
   * Check and generate special offers
   */
  private checkForSpecialOffers(memory: MerchantMemory, merchant: NpcEntity): void {
    // Remove expired offers
    memory.specialOffers = memory.specialOffers.filter(
      offer => offer.expiresAt > Date.now()
    );
    
    // Generate new offers for regular+ customers
    if (memory.trustLevel === 'regular' || memory.trustLevel === 'trusted' || memory.trustLevel === 'vip') {
      // Volume discount
      if (memory.totalVolume > 1000 && Math.random() < 0.3) {
        memory.specialOffers.push({
          itemId: memory.preferences.favoriteItems[0] || 'any',
          discount: 0.2,
          reason: 'Valued customer discount',
          expiresAt: Date.now() + 86400000 // 24 hours
        });
      }
      
      // Loyalty reward
      if (memory.tradeHistory.length > 10 && Math.random() < 0.2) {
        memory.specialOffers.push({
          itemId: 'any',
          discount: 0.15,
          reason: 'Loyalty reward',
          expiresAt: Date.now() + 43200000 // 12 hours
        });
      }
    }
  }

  /**
   * Unlock exclusive goods for trusted customers
   */
  private unlockExclusiveGoods(memory: MerchantMemory): void {
    const exclusiveItems = [
      'rare_spices',
      'master_crafted_weapon',
      'ancient_artifact',
      'exotic_medicine',
      'secret_map'
    ];
    
    // Add 1-2 exclusive items
    const numItems = memory.trustLevel === 'vip' ? 2 : 1;
    for (let i = 0; i < numItems; i++) {
      const item = exclusiveItems[Math.floor(Math.random() * exclusiveItems.length)];
      if (!memory.exclusiveGoods.includes(item)) {
        memory.exclusiveGoods.push(item);
        console.log(`[MerchantMemory] Unlocked exclusive item: ${item}`);
      }
    }
  }

  /**
   * Apply reputation decay over time
   */
  private applyReputationDecay(memory: MerchantMemory): void {
    const timeSinceLastInteraction = Date.now() - memory.lastInteraction;
    const weeksSinceInteraction = timeSinceLastInteraction / (7 * 24 * 60 * 60 * 1000);
    
    if (weeksSinceInteraction > 1) {
      const decayFactor = Math.pow(this.REPUTATION_DECAY_RATE, weeksSinceInteraction);
      const oldRep = memory.economicReputation;
      memory.economicReputation = Math.max(10, memory.economicReputation * decayFactor);
      
      if (oldRep !== memory.economicReputation) {
        console.log(`[MerchantMemory] Reputation decayed from ${oldRep} to ${memory.economicReputation}`);
        this.updatePriceModifier(memory);
        this.updateTrustLevel(memory);
      }
    }
  }

  /**
   * Record quest completion
   */
  recordQuestCompletion(merchantId: string, playerId: string): void {
    const key = `${merchantId}_${playerId}`;
    const memory = this.memories.get(key);
    
    if (memory) {
      memory.questsCompleted++;
      memory.economicReputation = Math.min(100, memory.economicReputation + 10);
      memory.lastInteraction = Date.now();
      
      this.updatePriceModifier(memory);
      this.updateTrustLevel(memory);
      this.saveToStorage();
      
      console.log(`[MerchantMemory] Quest completed for ${memory.merchantName}, reputation +10`);
    }
  }

  /**
   * Get merchant's current offer for the player
   */
  getMerchantOffer(merchant: NpcEntity, playerId: string): {
    priceModifier: number;
    trustLevel: string;
    specialOffers: any[];
    exclusiveGoods: string[];
    greeting: string;
  } {
    const memory = this.getMerchantMemory(merchant, playerId);
    
    // Generate appropriate greeting based on trust level
    const greetings = {
      stranger: `Welcome to my shop, stranger.`,
      acquaintance: `Ah, ${playerId}, back again I see.`,
      regular: `Good to see you, ${playerId}! I have some nice items today.`,
      trusted: `My friend! Always a pleasure to trade with you.`,
      vip: `${playerId}, my most valued customer! I've saved the best for you.`
    };
    
    return {
      priceModifier: memory.priceModifier,
      trustLevel: memory.trustLevel,
      specialOffers: memory.specialOffers,
      exclusiveGoods: memory.exclusiveGoods,
      greeting: greetings[memory.trustLevel]
    };
  }

  /**
   * Get trade statistics for a merchant
   */
  getTradeStatistics(merchantId: string, playerId: string): {
    totalTrades: number;
    totalVolume: number;
    favoriteItem: string | null;
    averageTransactionValue: number;
    trustProgress: number; // 0-100% to next level
  } {
    const key = `${merchantId}_${playerId}`;
    const memory = this.memories.get(key);
    
    if (!memory) {
      return {
        totalTrades: 0,
        totalVolume: 0,
        favoriteItem: null,
        averageTransactionValue: 0,
        trustProgress: 0
      };
    }
    
    // Find most traded item
    const itemCounts = new Map<string, number>();
    memory.tradeHistory.forEach(t => {
      itemCounts.set(t.itemName, (itemCounts.get(t.itemName) || 0) + t.quantity);
    });
    let favoriteItem = null;
    let maxCount = 0;
    itemCounts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteItem = item;
      }
    });
    
    // Calculate trust progress
    let nextThreshold = 100;
    for (const [level, threshold] of Object.entries(this.REPUTATION_THRESHOLDS)) {
      if (threshold > memory.economicReputation) {
        nextThreshold = threshold;
        break;
      }
    }
    const prevThreshold = memory.economicReputation < 20 ? 0 :
                          memory.economicReputation < 40 ? 20 :
                          memory.economicReputation < 60 ? 40 :
                          memory.economicReputation < 80 ? 60 : 80;
    
    const trustProgress = ((memory.economicReputation - prevThreshold) / 
                          (nextThreshold - prevThreshold)) * 100;
    
    return {
      totalTrades: memory.tradeHistory.length,
      totalVolume: memory.totalVolume,
      favoriteItem,
      averageTransactionValue: memory.totalVolume / Math.max(1, memory.tradeHistory.length),
      trustProgress
    };
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.memories.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[MerchantMemory] Failed to save to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const entries = JSON.parse(data);
        this.memories = new Map(entries);
      }
    } catch (error) {
      console.error('[MerchantMemory] Failed to load from storage:', error);
      this.memories = new Map();
    }
  }

  /**
   * Clear all memories (for testing/reset)
   */
  clearAllMemories(): void {
    this.memories.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[MerchantMemory] All memories cleared');
  }
}

// Export singleton instance
export const merchantMemoryService = new MerchantMemoryService();