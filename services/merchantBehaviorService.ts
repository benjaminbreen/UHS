/**
 * Merchant Behavior Service
 * Manages dynamic merchant behavior based on crises, relationships, and market conditions
 */

import { NpcEntity } from '../types';
import { merchantMemoryService, MerchantMemory } from './merchantMemoryService';
import { crisisDetectionService, ActiveMarketCrisis } from './crisisDetectionService';
import { TradeGood } from './tradeService';

export type MerchantStrategy = 
  | 'hoarder'      // Stockpiles during crisis
  | 'opportunist'  // Price gouges during crisis
  | 'community'    // Keeps prices stable, helps community
  | 'panicker'     // Dumps inventory and flees
  | 'neutral'      // Normal behavior

export interface MerchantBehavior {
  strategy: MerchantStrategy;
  priceAdjustment: number; // Multiplier on top of base prices
  inventoryAdjustment: number; // Multiplier on quantities
  dialogueModifier: string; // Additional dialogue context
  willingToTrade: boolean;
  specialBehaviors: string[];
}

class MerchantBehaviorService {
  /**
   * Determine merchant's behavior based on personality, crisis, and relationship
   */
  getMerchantBehavior(
    merchant: NpcEntity,
    playerId: string,
    marketLocation: { x: number; y: number }
  ): MerchantBehavior {
    const memory = merchantMemoryService.getMerchantMemory(merchant, playerId);
    const activeCrises = crisisDetectionService.getActiveCrisesForMarket(marketLocation);
    
    // Determine base strategy from personality
    let strategy: MerchantStrategy = this.determineStrategy(merchant, activeCrises);
    
    // Modify based on relationship
    strategy = this.modifyStrategyByRelationship(strategy, memory);
    
    // Calculate behavior parameters
    const behavior = this.calculateBehaviorParameters(strategy, activeCrises, memory);
    
    console.log(`[MerchantBehavior] ${merchant.name} using ${strategy} strategy`);
    
    return behavior;
  }

  /**
   * Determine base strategy from merchant personality
   */
  private determineStrategy(
    merchant: NpcEntity,
    crises: ActiveMarketCrisis[]
  ): MerchantStrategy {
    if (crises.length === 0) {
      return 'neutral';
    }
    
    // Check merchant personality traits - it's an object with numeric values
    const personality = merchant.personality;
    const wealth = merchant.wealthLevel;
    
    // Wealthy merchants tend to be opportunists
    if (wealth === 'wealthy') {
      // High neuroticism and low agreeableness = greedy/ambitious
      if (personality.neuroticism > 0.6 && personality.agreeableness < 0.4) {
        return 'opportunist';
      }
      // High agreeableness = generous/kind
      if (personality.agreeableness > 0.7) {
        return 'community';
      }
      return 'hoarder';
    }
    
    // Poor merchants might panic or try to help
    if (wealth === 'poor') {
      // High neuroticism = nervous/fearful
      if (personality.neuroticism > 0.7) {
        return 'panicker';
      }
      // High conscientiousness and agreeableness = brave/generous
      if (personality.conscientiousness > 0.6 && personality.agreeableness > 0.6) {
        return 'community';
      }
      return 'neutral';
    }
    
    // Middle class merchants vary more
    // High conscientiousness and low openness = calculating/shrewd
    if (personality.conscientiousness > 0.7 && personality.openness < 0.4) {
      return 'hoarder';
    }
    // Low agreeableness = greedy
    if (personality.agreeableness < 0.3) {
      return 'opportunist';
    }
    // High agreeableness = kind/helpful
    if (personality.agreeableness > 0.7) {
      return 'community';
    }
    
    // Random assignment for undefined personalities
    const rand = Math.random();
    if (rand < 0.25) return 'hoarder';
    if (rand < 0.5) return 'opportunist';
    if (rand < 0.75) return 'community';
    return 'panicker';
  }

  /**
   * Modify strategy based on player relationship
   */
  private modifyStrategyByRelationship(
    baseStrategy: MerchantStrategy,
    memory: MerchantMemory
  ): MerchantStrategy {
    // Trusted customers get better treatment
    if (memory.trustLevel === 'trusted' || memory.trustLevel === 'vip') {
      if (baseStrategy === 'opportunist') {
        // Even opportunists are fairer to good customers
        return 'neutral';
      }
      if (baseStrategy === 'panicker') {
        // Trust gives them confidence
        return 'community';
      }
    }
    
    // Strangers might get worse treatment
    if (memory.trustLevel === 'stranger' && baseStrategy === 'neutral') {
      // More likely to take advantage of strangers
      return Math.random() < 0.3 ? 'opportunist' : 'neutral';
    }
    
    return baseStrategy;
  }

  /**
   * Calculate specific behavior parameters
   */
  private calculateBehaviorParameters(
    strategy: MerchantStrategy,
    crises: ActiveMarketCrisis[],
    memory: MerchantMemory
  ): MerchantBehavior {
    const maxSeverity = Math.max(...crises.map(c => c.pattern.severity), 1);
    const behavior: MerchantBehavior = {
      strategy,
      priceAdjustment: 1.0,
      inventoryAdjustment: 1.0,
      dialogueModifier: '',
      willingToTrade: true,
      specialBehaviors: []
    };
    
    switch (strategy) {
      case 'hoarder':
        behavior.priceAdjustment = 1.0 + (0.2 * maxSeverity); // Up to 2x for severity 5
        behavior.inventoryAdjustment = 0.3; // Only show 30% of inventory
        behavior.dialogueModifier = 'seems reluctant to sell, claiming shortages';
        behavior.specialBehaviors.push('refuses_bulk_sales', 'limits_per_customer');
        break;
        
      case 'opportunist':
        behavior.priceAdjustment = 1.0 + (0.3 * maxSeverity); // Up to 2.5x for severity 5
        behavior.inventoryAdjustment = 1.2; // Shows more to attract buyers
        behavior.dialogueModifier = 'eagerly pushes goods at inflated prices';
        behavior.specialBehaviors.push('aggressive_sales', 'no_refunds');
        
        // Less gouging for good customers
        if (memory.trustLevel === 'trusted' || memory.trustLevel === 'vip') {
          behavior.priceAdjustment *= 0.8;
        }
        break;
        
      case 'community':
        behavior.priceAdjustment = 0.9; // 10% discount during crisis
        behavior.inventoryAdjustment = 1.0;
        behavior.dialogueModifier = 'expresses concern for the community';
        behavior.specialBehaviors.push('offers_credit', 'shares_information');
        
        // Extra discounts for regulars
        if (memory.trustLevel === 'regular' || memory.trustLevel === 'trusted' || memory.trustLevel === 'vip') {
          behavior.priceAdjustment *= 0.9;
          behavior.specialBehaviors.push('priority_access');
        }
        break;
        
      case 'panicker':
        behavior.priceAdjustment = 0.6; // Dumps inventory at 40% off
        behavior.inventoryAdjustment = 1.5; // Shows everything
        behavior.dialogueModifier = 'appears extremely anxious and eager to sell';
        behavior.specialBehaviors.push('accepts_any_offer', 'may_leave_soon');
        
        // Might refuse to trade with strangers
        if (memory.trustLevel === 'stranger' && Math.random() < 0.3) {
          behavior.willingToTrade = false;
          behavior.dialogueModifier = 'too panicked to negotiate with strangers';
        }
        break;
        
      case 'neutral':
      default:
        // Apply standard crisis adjustments
        if (crises.length > 0) {
          behavior.priceAdjustment = 1.0 + (0.1 * maxSeverity);
          behavior.inventoryAdjustment = 0.8;
        }
        break;
    }
    
    return behavior;
  }

  /**
   * Generate crisis-aware dialogue for merchant
   */
  generateCrisisDialogue(
    merchant: NpcEntity,
    behavior: MerchantBehavior,
    crisis?: ActiveMarketCrisis
  ): string[] {
    const dialogues: string[] = [];
    
    if (!crisis) {
      return [`Business as usual at ${merchant.name}'s shop.`];
    }
    
    switch (behavior.strategy) {
      case 'hoarder':
        dialogues.push(
          `"With the ${crisis.pattern.id.replace(/_/g, ' ')}, I must preserve stock for regular customers."`,
          `"I can only sell small quantities during these troubled times."`,
          `"My supplies are... limited. Very limited."`
        );
        break;
        
      case 'opportunist':
        dialogues.push(
          `"Prices have gone up due to the ${crisis.pattern.id.replace(/_/g, ' ')}. Supply and demand!"`,
          `"These are rare goods now. The price reflects their scarcity."`,
          `"If you don't buy now, prices will only go higher!"`
        );
        break;
        
      case 'community':
        dialogues.push(
          `"We must help each other through this ${crisis.pattern.id.replace(/_/g, ' ')}."`,
          `"I'm keeping prices fair despite the shortages."`,
          `"Take what you need. We'll settle payment when times improve."`
        );
        break;
        
      case 'panicker':
        dialogues.push(
          `"Take it all! I'm leaving before the ${crisis.pattern.id.replace(/_/g, ' ')} gets worse!"`,
          `"Everything must go! I can't stay here!"`,
          `"Please, just take what you want and go!"`
        );
        break;
        
      default:
        dialogues.push(
          `"These are difficult times with the ${crisis.pattern.id.replace(/_/g, ' ')}."`,
          `"I'm doing my best to maintain supply."`
        );
    }
    
    return dialogues;
  }

  /**
   * Apply behavior to market goods
   */
  applyBehaviorToGoods(
    goods: TradeGood[],
    behavior: MerchantBehavior,
    memory: MerchantMemory
  ): TradeGood[] {
    return goods.map(good => {
      const modifiedGood = { ...good };
      
      // Apply price adjustments
      modifiedGood.currentPrice = Math.round(
        good.currentPrice * behavior.priceAdjustment * memory.priceModifier
      );
      
      // Apply inventory adjustments
      modifiedGood.quantity = Math.round(good.quantity * behavior.inventoryAdjustment);
      
      // Apply special offers
      const applicableOffer = memory.specialOffers.find(
        offer => offer.itemId === good.itemId || offer.itemId === 'any'
      );
      if (applicableOffer) {
        modifiedGood.currentPrice = Math.round(
          modifiedGood.currentPrice * (1 - applicableOffer.discount)
        );
        (modifiedGood as any).specialOffer = applicableOffer.reason;
      }
      
      // Mark exclusive goods
      if (memory.exclusiveGoods.includes(good.itemId)) {
        (modifiedGood as any).exclusive = true;
        (modifiedGood as any).requiredTrust = 'trusted';
      }
      
      // Apply behavior-specific modifications
      if (behavior.specialBehaviors.includes('limits_per_customer')) {
        modifiedGood.quantity = Math.min(modifiedGood.quantity, 5);
        (modifiedGood as any).purchaseLimit = 5;
      }
      
      return modifiedGood;
    });
  }

  /**
   * Check if merchant will leave market due to crisis
   */
  checkMerchantFlight(
    merchant: NpcEntity,
    behavior: MerchantBehavior,
    crisisStartTime: number
  ): boolean {
    if (behavior.strategy !== 'panicker') {
      return false;
    }
    
    // Panickers leave after 24-48 hours
    const timeSinceCrisis = Date.now() - crisisStartTime;
    const flightTime = 24 + (Math.random() * 24); // 24-48 hours
    
    return timeSinceCrisis > flightTime * 3600000;
  }

  /**
   * Generate behavior-based quest priorities
   */
  getQuestPriorities(behavior: MerchantBehavior): {
    preferredQuestTypes: string[];
    questUrgency: number; // 1-5
    rewardMultiplier: number;
  } {
    switch (behavior.strategy) {
      case 'hoarder':
        return {
          preferredQuestTypes: ['collect_item', 'find_supplier'],
          questUrgency: 3,
          rewardMultiplier: 0.8 // Stingy with rewards
        };
        
      case 'opportunist':
        return {
          preferredQuestTypes: ['deliver_item', 'smuggle'],
          questUrgency: 4,
          rewardMultiplier: 1.5 // Pays well for profit opportunities
        };
        
      case 'community':
        return {
          preferredQuestTypes: ['help_citizens', 'distribute_supplies'],
          questUrgency: 5,
          rewardMultiplier: 1.0 // Fair rewards
        };
        
      case 'panicker':
        return {
          preferredQuestTypes: ['escort', 'evacuate'],
          questUrgency: 5,
          rewardMultiplier: 2.0 // Desperate, pays anything
        };
        
      default:
        return {
          preferredQuestTypes: ['trade', 'deliver_item'],
          questUrgency: 2,
          rewardMultiplier: 1.0
        };
    }
  }
}

// Export singleton instance
export const merchantBehaviorService = new MerchantBehaviorService();