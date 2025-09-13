/**
 * Economic Victory Service
 * Tracks economic achievements and victory conditions
 */

import { PlayerCharacter } from '../types';
import { merchantMemoryService } from './merchantMemoryService';
import { priceHistoryService } from './priceHistoryService';

export interface EconomicVictoryConditions {
  // Wealth accumulation
  wealthGoal: number;
  currentWealth: number;
  
  // Trade volume
  tradeVolumeGoal: number;
  totalTraded: number;
  
  // Profit tracking
  profitGoal: number;
  totalProfit: number;
  
  // Merchant relationships
  trustedMerchantsGoal: number;
  trustedMerchants: string[];
  vipStatusGoal: number;
  vipStatuses: string[];
  
  // Market domination
  monopolies: Map<string, number>; // itemId -> market share %
  monopolyGoal: number; // Number of monopolies needed
  
  // Trade routes
  tradeRoutesEstablished: Set<string>;
  tradeRouteGoal: number;
  
  // Crisis profiteering
  crisisProfits: number;
  crisisQuestsCompleted: number;
  
  // Economic milestones
  milestones: EconomicMilestone[];
}

export interface EconomicMilestone {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  achievedAt?: number;
  progress: number; // 0-100
  requirement: number;
  current: number;
  reward?: string;
}

export interface EconomicAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
}

export type EconomicVictoryMode = 
  | 'merchant_prince'  // Accumulate vast wealth
  | 'trade_magnate'    // Control multiple trade routes
  | 'monopolist'       // Control markets for specific goods
  | 'crisis_profiteer' // Profit from disasters
  | 'beloved_trader'   // Max reputation with many merchants
  | 'economic_domination'; // Complete all economic goals

class EconomicVictoryService {
  private victoryConditions: EconomicVictoryConditions;
  private achievements: Map<string, EconomicAchievement> = new Map();
  private victoryMode: EconomicVictoryMode = 'merchant_prince';
  private readonly STORAGE_KEY = 'economic_victory_progress';
  private readonly ACHIEVEMENTS_KEY = 'economic_achievements';

  constructor() {
    this.victoryConditions = this.initializeConditions();
    this.initializeAchievements();
    this.loadFromStorage();
  }

  /**
   * Initialize victory conditions based on mode
   */
  private initializeConditions(): EconomicVictoryConditions {
    return {
      wealthGoal: 10000,
      currentWealth: 0,
      tradeVolumeGoal: 50000,
      totalTraded: 0,
      profitGoal: 5000,
      totalProfit: 0,
      trustedMerchantsGoal: 5,
      trustedMerchants: [],
      vipStatusGoal: 2,
      vipStatuses: [],
      monopolies: new Map(),
      monopolyGoal: 3,
      tradeRoutesEstablished: new Set(),
      tradeRouteGoal: 5,
      crisisProfits: 0,
      crisisQuestsCompleted: 0,
      milestones: this.createMilestones()
    };
  }

  /**
   * Create economic milestones
   */
  private createMilestones(): EconomicMilestone[] {
    return [
      {
        id: 'first_hundred',
        name: 'Century of Coins',
        description: 'Accumulate 100 coins',
        achieved: false,
        progress: 0,
        requirement: 100,
        current: 0,
        reward: 'Merchant reputation +5'
      },
      {
        id: 'first_thousand',
        name: 'Thousand Gold Dream',
        description: 'Accumulate 1,000 coins',
        achieved: false,
        progress: 0,
        requirement: 1000,
        current: 0,
        reward: 'Unlock special merchants'
      },
      {
        id: 'ten_thousand',
        name: 'Merchant Prince',
        description: 'Accumulate 10,000 coins',
        achieved: false,
        progress: 0,
        requirement: 10000,
        current: 0,
        reward: 'Economic Victory!'
      },
      {
        id: 'first_monopoly',
        name: 'Market Controller',
        description: 'Control 70% of any market',
        achieved: false,
        progress: 0,
        requirement: 70,
        current: 0,
        reward: 'Price manipulation power'
      },
      {
        id: 'crisis_profiteer',
        name: 'Disaster Capitalist',
        description: 'Earn 1,000 coins during a crisis',
        achieved: false,
        progress: 0,
        requirement: 1000,
        current: 0,
        reward: 'Crisis prediction ability'
      },
      {
        id: 'beloved_merchant',
        name: 'Friend to All',
        description: 'Achieve VIP status with 3 merchants',
        achieved: false,
        progress: 0,
        requirement: 3,
        current: 0,
        reward: 'Universal merchant discount'
      },
      {
        id: 'trade_network',
        name: 'Trade Network Master',
        description: 'Establish 5 trade routes',
        achieved: false,
        progress: 0,
        requirement: 5,
        current: 0,
        reward: 'Caravan fast travel'
      }
    ];
  }

  /**
   * Initialize achievements
   */
  private initializeAchievements(): void {
    const achievementList: EconomicAchievement[] = [
      {
        id: 'first_trade',
        name: 'First Trade',
        description: 'Complete your first transaction',
        icon: '🤝',
        rarity: 'common'
      },
      {
        id: 'profitable_deal',
        name: 'Profitable Deal',
        description: 'Sell an item for twice what you paid',
        icon: '💰',
        rarity: 'common'
      },
      {
        id: 'bulk_trader',
        name: 'Bulk Trader',
        description: 'Buy or sell 10+ items in one transaction',
        icon: '📦',
        rarity: 'rare'
      },
      {
        id: 'crisis_supplier',
        name: 'Crisis Supplier',
        description: 'Complete a crisis quest',
        icon: '🚨',
        rarity: 'rare'
      },
      {
        id: 'market_manipulator',
        name: 'Market Manipulator',
        description: 'Cause a price change of 50% or more',
        icon: '📈',
        rarity: 'epic'
      },
      {
        id: 'monopolist',
        name: 'Monopolist',
        description: 'Control 90% of a specific good',
        icon: '👑',
        rarity: 'legendary'
      },
      {
        id: 'economic_victory',
        name: 'Economic Victory',
        description: 'Achieve victory through economic domination',
        icon: '🏆',
        rarity: 'legendary'
      }
    ];
    
    achievementList.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Set victory mode
   */
  setVictoryMode(mode: EconomicVictoryMode): void {
    this.victoryMode = mode;
    
    // Adjust goals based on mode
    switch (mode) {
      case 'merchant_prince':
        this.victoryConditions.wealthGoal = 10000;
        break;
      case 'trade_magnate':
        this.victoryConditions.tradeRouteGoal = 10;
        this.victoryConditions.tradeVolumeGoal = 100000;
        break;
      case 'monopolist':
        this.victoryConditions.monopolyGoal = 5;
        break;
      case 'crisis_profiteer':
        this.victoryConditions.crisisProfits = 5000;
        break;
      case 'beloved_trader':
        this.victoryConditions.vipStatusGoal = 5;
        this.victoryConditions.trustedMerchantsGoal = 10;
        break;
      case 'economic_domination':
        // Keep all goals active
        break;
    }
    
    this.saveToStorage();
  }

  /**
   * Update victory progress after a trade
   */
  updateTradeProgress(
    action: 'buy' | 'sell',
    amount: number,
    profit?: number,
    merchantId?: string,
    itemId?: string,
    quantity?: number,
    isDuringCrisis?: boolean
  ): void {
    // Update trade volume
    this.victoryConditions.totalTraded += amount;
    
    // Update profit if selling
    if (action === 'sell' && profit) {
      this.victoryConditions.totalProfit += profit;
      
      if (isDuringCrisis) {
        this.victoryConditions.crisisProfits += profit;
      }
      
      // Check for profitable deal achievement
      if (profit >= amount * 0.5) {
        this.unlockAchievement('profitable_deal');
      }
    }
    
    // Check for bulk trader achievement
    if (quantity && quantity >= 10) {
      this.unlockAchievement('bulk_trader');
    }
    
    // First trade achievement
    if (this.victoryConditions.totalTraded > 0) {
      this.unlockAchievement('first_trade');
    }
    
    // Update milestones
    this.updateMilestones();
    
    // Check for victory
    this.checkVictoryConditions();
    
    this.saveToStorage();
  }

  /**
   * Update merchant relationship progress
   */
  updateMerchantRelationship(merchantId: string, playerId: string): void {
    const memory = merchantMemoryService.getMerchantMemory(
      { id: merchantId } as any,
      playerId
    );
    
    // Track trusted merchants
    if (memory.trustLevel === 'trusted' || memory.trustLevel === 'vip') {
      if (!this.victoryConditions.trustedMerchants.includes(merchantId)) {
        this.victoryConditions.trustedMerchants.push(merchantId);
      }
    }
    
    // Track VIP statuses
    if (memory.trustLevel === 'vip') {
      if (!this.victoryConditions.vipStatuses.includes(merchantId)) {
        this.victoryConditions.vipStatuses.push(merchantId);
      }
    }
    
    this.updateMilestones();
    this.checkVictoryConditions();
    this.saveToStorage();
  }

  /**
   * Update wealth tracking
   */
  updateWealth(currentWealth: number): void {
    this.victoryConditions.currentWealth = currentWealth;
    
    // Check wealth milestones
    const wealthMilestones = ['first_hundred', 'first_thousand', 'ten_thousand'];
    wealthMilestones.forEach(id => {
      const milestone = this.victoryConditions.milestones.find(m => m.id === id);
      if (milestone && !milestone.achieved) {
        milestone.current = currentWealth;
        milestone.progress = Math.min(100, (currentWealth / milestone.requirement) * 100);
        
        if (currentWealth >= milestone.requirement) {
          this.achieveMilestone(milestone);
        }
      }
    });
    
    this.checkVictoryConditions();
    this.saveToStorage();
  }

  /**
   * Update market share for monopoly tracking
   */
  updateMarketShare(itemId: string, playerQuantity: number, totalMarketQuantity: number): void {
    const marketShare = (playerQuantity / Math.max(1, totalMarketQuantity)) * 100;
    this.victoryConditions.monopolies.set(itemId, marketShare);
    
    // Check for monopoly achievement
    if (marketShare >= 90) {
      this.unlockAchievement('monopolist');
    }
    
    // Update monopoly milestone
    const monopolyMilestone = this.victoryConditions.milestones.find(m => m.id === 'first_monopoly');
    if (monopolyMilestone && !monopolyMilestone.achieved) {
      const highestShare = Math.max(...Array.from(this.victoryConditions.monopolies.values()));
      monopolyMilestone.current = highestShare;
      monopolyMilestone.progress = Math.min(100, (highestShare / 70) * 100);
      
      if (highestShare >= 70) {
        this.achieveMilestone(monopolyMilestone);
      }
    }
    
    this.checkVictoryConditions();
    this.saveToStorage();
  }

  /**
   * Record crisis quest completion
   */
  completeCrisisQuest(reward: number): void {
    this.victoryConditions.crisisQuestsCompleted++;
    this.victoryConditions.crisisProfits += reward;
    
    this.unlockAchievement('crisis_supplier');
    
    // Update crisis profiteer milestone
    const crisisMilestone = this.victoryConditions.milestones.find(m => m.id === 'crisis_profiteer');
    if (crisisMilestone && !crisisMilestone.achieved) {
      crisisMilestone.current = this.victoryConditions.crisisProfits;
      crisisMilestone.progress = Math.min(100, (this.victoryConditions.crisisProfits / 1000) * 100);
      
      if (this.victoryConditions.crisisProfits >= 1000) {
        this.achieveMilestone(crisisMilestone);
      }
    }
    
    this.checkVictoryConditions();
    this.saveToStorage();
  }

  /**
   * Establish a trade route
   */
  establishTradeRoute(routeId: string): void {
    this.victoryConditions.tradeRoutesEstablished.add(routeId);
    
    const routeCount = this.victoryConditions.tradeRoutesEstablished.size;
    const routeMilestone = this.victoryConditions.milestones.find(m => m.id === 'trade_network');
    if (routeMilestone && !routeMilestone.achieved) {
      routeMilestone.current = routeCount;
      routeMilestone.progress = Math.min(100, (routeCount / 5) * 100);
      
      if (routeCount >= 5) {
        this.achieveMilestone(routeMilestone);
      }
    }
    
    this.checkVictoryConditions();
    this.saveToStorage();
  }

  /**
   * Update all milestones
   */
  private updateMilestones(): void {
    // Update VIP milestone
    const vipMilestone = this.victoryConditions.milestones.find(m => m.id === 'beloved_merchant');
    if (vipMilestone && !vipMilestone.achieved) {
      vipMilestone.current = this.victoryConditions.vipStatuses.length;
      vipMilestone.progress = Math.min(100, (vipMilestone.current / 3) * 100);
      
      if (vipMilestone.current >= 3) {
        this.achieveMilestone(vipMilestone);
      }
    }
  }

  /**
   * Achieve a milestone
   */
  private achieveMilestone(milestone: EconomicMilestone): void {
    milestone.achieved = true;
    milestone.achievedAt = Date.now();
    milestone.progress = 100;
    
    console.log(`[EconomicVictory] Milestone achieved: ${milestone.name}`);
    
    // Trigger notification (will be handled by UI)
    this.notifyMilestoneAchieved(milestone);
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (achievement && !achievement.unlockedAt) {
      achievement.unlockedAt = Date.now();
      console.log(`[EconomicVictory] Achievement unlocked: ${achievement.name}`);
      this.notifyAchievementUnlocked(achievement);
    }
  }

  /**
   * Check if victory conditions are met
   */
  private checkVictoryConditions(): boolean {
    let victoryAchieved = false;
    
    switch (this.victoryMode) {
      case 'merchant_prince':
        victoryAchieved = this.victoryConditions.currentWealth >= this.victoryConditions.wealthGoal;
        break;
        
      case 'trade_magnate':
        victoryAchieved = 
          this.victoryConditions.tradeRoutesEstablished.size >= this.victoryConditions.tradeRouteGoal &&
          this.victoryConditions.totalTraded >= this.victoryConditions.tradeVolumeGoal;
        break;
        
      case 'monopolist':
        const monopolyCount = Array.from(this.victoryConditions.monopolies.values())
          .filter(share => share >= 70).length;
        victoryAchieved = monopolyCount >= this.victoryConditions.monopolyGoal;
        break;
        
      case 'crisis_profiteer':
        victoryAchieved = this.victoryConditions.crisisProfits >= 5000;
        break;
        
      case 'beloved_trader':
        victoryAchieved = 
          this.victoryConditions.vipStatuses.length >= this.victoryConditions.vipStatusGoal &&
          this.victoryConditions.trustedMerchants.length >= this.victoryConditions.trustedMerchantsGoal;
        break;
        
      case 'economic_domination':
        // Check all conditions
        victoryAchieved = 
          this.victoryConditions.currentWealth >= this.victoryConditions.wealthGoal &&
          this.victoryConditions.totalTraded >= this.victoryConditions.tradeVolumeGoal &&
          this.victoryConditions.trustedMerchants.length >= this.victoryConditions.trustedMerchantsGoal;
        break;
    }
    
    if (victoryAchieved) {
      this.unlockAchievement('economic_victory');
      this.notifyVictory();
    }
    
    return victoryAchieved;
  }

  /**
   * Get current victory progress
   */
  getVictoryProgress(): {
    mode: EconomicVictoryMode;
    overallProgress: number;
    conditions: EconomicVictoryConditions;
    milestones: EconomicMilestone[];
    achievements: EconomicAchievement[];
    nearestMilestone: EconomicMilestone | null;
  } {
    // Calculate overall progress based on mode
    let overallProgress = 0;
    
    switch (this.victoryMode) {
      case 'merchant_prince':
        overallProgress = (this.victoryConditions.currentWealth / this.victoryConditions.wealthGoal) * 100;
        break;
      case 'trade_magnate':
        const routeProgress = (this.victoryConditions.tradeRoutesEstablished.size / this.victoryConditions.tradeRouteGoal) * 50;
        const volumeProgress = (this.victoryConditions.totalTraded / this.victoryConditions.tradeVolumeGoal) * 50;
        overallProgress = routeProgress + volumeProgress;
        break;
      case 'monopolist':
        const monopolyCount = Array.from(this.victoryConditions.monopolies.values())
          .filter(share => share >= 70).length;
        overallProgress = (monopolyCount / this.victoryConditions.monopolyGoal) * 100;
        break;
      case 'crisis_profiteer':
        overallProgress = (this.victoryConditions.crisisProfits / 5000) * 100;
        break;
      case 'beloved_trader':
        const vipProgress = (this.victoryConditions.vipStatuses.length / this.victoryConditions.vipStatusGoal) * 50;
        const trustedProgress = (this.victoryConditions.trustedMerchants.length / this.victoryConditions.trustedMerchantsGoal) * 50;
        overallProgress = vipProgress + trustedProgress;
        break;
      case 'economic_domination':
        const wealthProg = (this.victoryConditions.currentWealth / this.victoryConditions.wealthGoal) * 33;
        const tradeProg = (this.victoryConditions.totalTraded / this.victoryConditions.tradeVolumeGoal) * 33;
        const relProg = (this.victoryConditions.trustedMerchants.length / this.victoryConditions.trustedMerchantsGoal) * 34;
        overallProgress = wealthProg + tradeProg + relProg;
        break;
    }
    
    // Find nearest incomplete milestone
    const incompleteMilestones = this.victoryConditions.milestones
      .filter(m => !m.achieved)
      .sort((a, b) => b.progress - a.progress);
    
    return {
      mode: this.victoryMode,
      overallProgress: Math.min(100, overallProgress),
      conditions: this.victoryConditions,
      milestones: this.victoryConditions.milestones,
      achievements: Array.from(this.achievements.values()),
      nearestMilestone: incompleteMilestones[0] || null
    };
  }

  /**
   * Notification handlers (to be connected to UI)
   */
  private notifyMilestoneAchieved(milestone: EconomicMilestone): void {
    // This will be picked up by the UI
    window.dispatchEvent(new CustomEvent('economicMilestone', { detail: milestone }));
  }

  private notifyAchievementUnlocked(achievement: EconomicAchievement): void {
    window.dispatchEvent(new CustomEvent('economicAchievement', { detail: achievement }));
  }

  private notifyVictory(): void {
    window.dispatchEvent(new CustomEvent('economicVictory', { detail: this.victoryMode }));
  }

  /**
   * Save/Load functions
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        mode: this.victoryMode,
        conditions: {
          ...this.victoryConditions,
          monopolies: Array.from(this.victoryConditions.monopolies.entries()),
          tradeRoutesEstablished: Array.from(this.victoryConditions.tradeRoutesEstablished)
        }
      }));
      
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(
        Array.from(this.achievements.entries())
      ));
    } catch (error) {
      console.error('[EconomicVictory] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.victoryMode = parsed.mode;
        this.victoryConditions = {
          ...parsed.conditions,
          monopolies: new Map(parsed.conditions.monopolies),
          tradeRoutesEstablished: new Set(parsed.conditions.tradeRoutesEstablished)
        };
      }
      
      const achievementsData = localStorage.getItem(this.ACHIEVEMENTS_KEY);
      if (achievementsData) {
        this.achievements = new Map(JSON.parse(achievementsData));
      }
    } catch (error) {
      console.error('[EconomicVictory] Failed to load:', error);
    }
  }

  /**
   * Reset all progress
   */
  resetProgress(): void {
    this.victoryConditions = this.initializeConditions();
    this.initializeAchievements();
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACHIEVEMENTS_KEY);
  }
}

// Export singleton
export const economicVictoryService = new EconomicVictoryService();