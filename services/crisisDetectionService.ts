/**
 * Crisis Detection Service
 * Detects crises mentioned in NPC dialogue and triggers market events
 */

import { NpcEntity } from '../types';

export interface CrisisPattern {
  id: string;
  keywords: string[];
  category: 'conflict' | 'weather' | 'disease' | 'infrastructure' | 'political' | 'economic';
  severity: 1 | 2 | 3 | 4 | 5; // 1 = minor, 5 = catastrophic
  marketEffect: {
    affectedCategories: string[];
    priceMultiplier: number;      // 1.5 = 50% increase, 0.5 = 50% decrease
    quantityMultiplier: number;    // 0.3 = 70% reduction in quantity
    duration: number;              // hours the effect lasts
    radius: number;                // tiles from crisis center affected
    questTrigger?: string;         // optional quest template ID
  };
  flavorText: string;              // description shown in marketplace
}

export interface DetectedCrisis {
  pattern: CrisisPattern;
  sourceNpcId: string;
  sourceNpcName: string;
  sourceDialogue: string;
  detectedKeywords: string[];
  detectedAt: number;              // timestamp
  location: { x: number; y: number };
  expiresAt: number;
}

export interface ActiveMarketCrisis {
  crisisId: string;
  pattern: CrisisPattern;
  affectedMarkets: Array<{
    marketId: string;
    distance: number;
    effectStrength: number;       // 0-1, based on distance from crisis
  }>;
  sourceNpcs: Array<{
    npcId: string;
    npcName: string;
    reportedAt: number;
  }>;
  startedAt: number;
  expiresAt: number;
}

// Comprehensive crisis patterns covering historical and fantasy scenarios
const CRISIS_PATTERNS: CrisisPattern[] = [
  // CONFLICT CRISES
  {
    id: 'raiders',
    keywords: ['raid', 'raiders', 'raiding', 'attacked', 'pillage', 'marauders', 'bandits', 'brigands', 'highway', 'robbers'],
    category: 'conflict',
    severity: 3,
    marketEffect: {
      affectedCategories: ['luxury', 'manufactured', 'weapon'],
      priceMultiplier: 1.8,
      quantityMultiplier: 0.3,
      duration: 72,
      radius: 30,
      questTrigger: 'DEFEND_AGAINST_RAIDERS'
    },
    flavorText: 'Raiders have been attacking caravans, disrupting trade routes'
  },
  {
    id: 'war',
    keywords: ['war', 'battle', 'siege', 'invasion', 'conquered', 'fighting', 'troops', 'soldiers', 'army', 'conflict'],
    category: 'conflict',
    severity: 5,
    marketEffect: {
      affectedCategories: ['food', 'weapon', 'medicine'],
      priceMultiplier: 2.5,
      quantityMultiplier: 0.2,
      duration: 168,
      radius: 50,
      questTrigger: 'WAR_PROFITEERING'
    },
    flavorText: 'War has broken out, causing widespread shortages and panic'
  },
  {
    id: 'pirates',
    keywords: ['pirates', 'piracy', 'corsairs', 'sea raiders', 'naval', 'ships attacked'],
    category: 'conflict',
    severity: 3,
    marketEffect: {
      affectedCategories: ['luxury', 'raw_material'],
      priceMultiplier: 2.0,
      quantityMultiplier: 0.4,
      duration: 96,
      radius: 40,
      questTrigger: 'SECURE_SHIPPING_LANES'
    },
    flavorText: 'Pirates are disrupting sea trade, imported goods are scarce'
  },

  // WEATHER CRISES
  {
    id: 'drought',
    keywords: ['drought', 'dry', 'no rain', 'crops dying', 'water shortage', 'wells empty', 'parched'],
    category: 'weather',
    severity: 4,
    marketEffect: {
      affectedCategories: ['food'],
      priceMultiplier: 2.2,
      quantityMultiplier: 0.3,
      duration: 240,
      radius: 60
    },
    flavorText: 'Severe drought has destroyed crops, food is becoming scarce'
  },
  {
    id: 'floods',
    keywords: ['flood', 'flooding', 'rivers overflowing', 'heavy rains', 'storms', 'hurricane', 'typhoon', 'monsoon'],
    category: 'weather',
    severity: 3,
    marketEffect: {
      affectedCategories: ['food', 'raw_material'],
      priceMultiplier: 1.6,
      quantityMultiplier: 0.5,
      duration: 120,
      radius: 40
    },
    flavorText: 'Flooding has damaged crops and disrupted transportation'
  },
  {
    id: 'harvest_failure',
    keywords: ['harvest failed', 'crops failed', 'blight', 'locusts', 'famine', 'starving', 'no food'],
    category: 'weather',
    severity: 5,
    marketEffect: {
      affectedCategories: ['food'],
      priceMultiplier: 3.0,
      quantityMultiplier: 0.1,
      duration: 336,
      radius: 80,
      questTrigger: 'FAMINE_RELIEF'
    },
    flavorText: 'Harvest has failed catastrophically, famine threatens the region'
  },

  // DISEASE CRISES
  {
    id: 'plague',
    keywords: ['plague', 'disease', 'sickness', 'epidemic', 'pestilence', 'outbreak', 'contagion', 'dying'],
    category: 'disease',
    severity: 4,
    marketEffect: {
      affectedCategories: ['medicine', 'religious', 'luxury'],
      priceMultiplier: 2.0,
      quantityMultiplier: 0.4,
      duration: 200,
      radius: 50,
      questTrigger: 'FIND_MEDICINE'
    },
    flavorText: 'Disease outbreak has struck, medicine and healing supplies desperately needed'
  },
  {
    id: 'livestock_disease',
    keywords: ['cattle dying', 'animals sick', 'livestock disease', 'murrain', 'sheep dying'],
    category: 'disease',
    severity: 3,
    marketEffect: {
      affectedCategories: ['food', 'raw_material'],
      priceMultiplier: 1.8,
      quantityMultiplier: 0.4,
      duration: 144,
      radius: 35
    },
    flavorText: 'Livestock disease has reduced meat and leather supplies'
  },

  // INFRASTRUCTURE CRISES
  {
    id: 'roads_damaged',
    keywords: ['roads destroyed', 'bridge collapsed', 'muddy roads', 'impassable', 'blocked roads', 'landslide'],
    category: 'infrastructure',
    severity: 2,
    marketEffect: {
      affectedCategories: ['luxury', 'manufactured'],
      priceMultiplier: 1.4,
      quantityMultiplier: 0.6,
      duration: 48,
      radius: 25
    },
    flavorText: 'Damaged roads are slowing trade, deliveries are delayed'
  },
  {
    id: 'port_problems',
    keywords: ['port closed', 'harbor blocked', 'docks destroyed', 'shipwreck', 'storms at sea'],
    category: 'infrastructure',
    severity: 3,
    marketEffect: {
      affectedCategories: ['luxury', 'raw_material'],
      priceMultiplier: 1.7,
      quantityMultiplier: 0.4,
      duration: 96,
      radius: 45
    },
    flavorText: 'Port disruptions have halted sea trade'
  },

  // POLITICAL CRISES
  {
    id: 'rebellion',
    keywords: ['rebellion', 'revolt', 'uprising', 'revolution', 'overthrow', 'coup', 'civil war'],
    category: 'political',
    severity: 4,
    marketEffect: {
      affectedCategories: ['luxury', 'weapon', 'food'],
      priceMultiplier: 2.0,
      quantityMultiplier: 0.3,
      duration: 240,
      radius: 70,
      questTrigger: 'REBELLION_SUPPLIES'
    },
    flavorText: 'Political upheaval has thrown markets into chaos'
  },
  {
    id: 'new_taxes',
    keywords: ['new taxes', 'tariffs', 'heavy taxation', 'tax collectors', 'levies', 'tribute'],
    category: 'political',
    severity: 2,
    marketEffect: {
      affectedCategories: ['luxury', 'manufactured'],
      priceMultiplier: 1.3,
      quantityMultiplier: 0.8,
      duration: 168,
      radius: 40
    },
    flavorText: 'New taxes have increased prices across the board'
  },
  {
    id: 'refugees',
    keywords: ['refugees', 'fleeing', 'displaced', 'evacuating', 'exodus', 'migration'],
    category: 'political',
    severity: 3,
    marketEffect: {
      affectedCategories: ['food', 'medicine'],
      priceMultiplier: 1.6,
      quantityMultiplier: 0.5,
      duration: 120,
      radius: 35
    },
    flavorText: 'Influx of refugees has strained local supplies'
  },

  // ECONOMIC CRISES
  {
    id: 'mine_collapse',
    keywords: ['mine collapsed', 'mine flooded', 'miners trapped', 'no ore', 'metal shortage'],
    category: 'economic',
    severity: 3,
    marketEffect: {
      affectedCategories: ['weapon', 'tool', 'raw_material'],
      priceMultiplier: 1.8,
      quantityMultiplier: 0.3,
      duration: 144,
      radius: 50
    },
    flavorText: 'Mine disaster has cut off metal supplies'
  },
  {
    id: 'guild_strike',
    keywords: ['guild strike', 'workers strike', 'labor dispute', 'boycott', 'work stoppage'],
    category: 'economic',
    severity: 2,
    marketEffect: {
      affectedCategories: ['manufactured', 'tool'],
      priceMultiplier: 1.5,
      quantityMultiplier: 0.4,
      duration: 72,
      radius: 30
    },
    flavorText: 'Guild strike has halted production of manufactured goods'
  },
  {
    id: 'currency_crisis',
    keywords: ['coins debased', 'currency worthless', 'inflation', 'money troubles', 'bank failed'],
    category: 'economic',
    severity: 4,
    marketEffect: {
      affectedCategories: ['luxury', 'manufactured', 'food'],
      priceMultiplier: 2.5,
      quantityMultiplier: 0.6,
      duration: 240,
      radius: 60
    },
    flavorText: 'Currency crisis has sent prices spiraling out of control'
  }
];

class CrisisDetectionService {
  private activeMarketCrises: Map<string, ActiveMarketCrisis> = new Map();
  private crisisHistory: DetectedCrisis[] = [];
  private readonly CRISIS_STORAGE_KEY = 'active_market_crises';
  private readonly HISTORY_STORAGE_KEY = 'crisis_history';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Analyze NPC dialogue for crisis keywords
   */
  detectCrisis(
    dialogue: string,
    npc: NpcEntity,
    location: { x: number; y: number }
  ): DetectedCrisis | null {
    const lowerDialogue = dialogue.toLowerCase();
    
    for (const pattern of CRISIS_PATTERNS) {
      const detectedKeywords = pattern.keywords.filter(keyword => 
        lowerDialogue.includes(keyword.toLowerCase())
      );
      
      if (detectedKeywords.length > 0) {
        const crisis: DetectedCrisis = {
          pattern,
          sourceNpcId: npc.id,
          sourceNpcName: npc.name,
          sourceDialogue: dialogue,
          detectedKeywords,
          detectedAt: Date.now(),
          location,
          expiresAt: Date.now() + (pattern.marketEffect.duration * 3600000) // Convert hours to ms
        };
        
        console.log(`[CrisisDetection] Crisis detected: ${pattern.id} from NPC ${npc.name}`);
        console.log(`[CrisisDetection] Keywords found: ${detectedKeywords.join(', ')}`);
        
        this.recordCrisis(crisis);
        this.createMarketCrisis(crisis);
        
        return crisis;
      }
    }
    
    return null;
  }

  /**
   * Create or update a market crisis from detected crisis
   */
  private createMarketCrisis(crisis: DetectedCrisis): void {
    const crisisKey = `${crisis.pattern.id}_${crisis.location.x}_${crisis.location.y}`;
    
    let marketCrisis = this.activeMarketCrises.get(crisisKey);
    
    if (marketCrisis) {
      // Crisis already exists, add this NPC as additional source
      marketCrisis.sourceNpcs.push({
        npcId: crisis.sourceNpcId,
        npcName: crisis.sourceNpcName,
        reportedAt: crisis.detectedAt
      });
      
      // Extend duration if multiple NPCs report it
      marketCrisis.expiresAt = Math.max(marketCrisis.expiresAt, crisis.expiresAt);
    } else {
      // New crisis
      marketCrisis = {
        crisisId: crisisKey,
        pattern: crisis.pattern,
        affectedMarkets: this.calculateAffectedMarkets(crisis.location, crisis.pattern.marketEffect.radius),
        sourceNpcs: [{
          npcId: crisis.sourceNpcId,
          npcName: crisis.sourceNpcName,
          reportedAt: crisis.detectedAt
        }],
        startedAt: crisis.detectedAt,
        expiresAt: crisis.expiresAt
      };
      
      this.activeMarketCrises.set(crisisKey, marketCrisis);
    }
    
    this.saveToStorage();
  }

  /**
   * Calculate which markets are affected based on crisis location and radius
   */
  private calculateAffectedMarkets(
    crisisLocation: { x: number; y: number },
    radius: number
  ): Array<{ marketId: string; distance: number; effectStrength: number }> {
    const affected = [];
    
    // For now, we'll create a simple model where the crisis location itself is always affected
    // and effect strength diminishes with distance
    const baseMarketId = `market-${crisisLocation.x}-${crisisLocation.y}`;
    affected.push({
      marketId: baseMarketId,
      distance: 0,
      effectStrength: 1.0
    });
    
    // Add nearby markets with diminishing effects
    // This would ideally check actual market locations from the map
    for (let dx = -radius; dx <= radius; dx += 10) {
      for (let dy = -radius; dy <= radius; dy += 10) {
        if (dx === 0 && dy === 0) continue;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const effectStrength = Math.max(0, 1 - (distance / radius));
          if (effectStrength > 0.1) { // Only include if effect is noticeable
            affected.push({
              marketId: `market-${crisisLocation.x + dx}-${crisisLocation.y + dy}`,
              distance,
              effectStrength
            });
          }
        }
      }
    }
    
    return affected;
  }

  /**
   * Get active crises affecting a specific market
   */
  getActiveCrisesForMarket(marketLocation: { x: number; y: number }): ActiveMarketCrisis[] {
    const marketId = `market-${marketLocation.x}-${marketLocation.y}`;
    const now = Date.now();
    const activeCrises: ActiveMarketCrisis[] = [];
    
    // Clean up expired crises
    for (const [key, crisis] of this.activeMarketCrises.entries()) {
      if (crisis.expiresAt < now) {
        this.activeMarketCrises.delete(key);
      } else {
        // Check if this crisis affects the requested market
        const affectedMarket = crisis.affectedMarkets.find(m => m.marketId === marketId);
        if (affectedMarket) {
          activeCrises.push(crisis);
        }
      }
    }
    
    // Also check for crises near this market (within any crisis radius)
    for (const [key, crisis] of this.activeMarketCrises.entries()) {
      if (crisis.expiresAt >= now) {
        // Parse crisis location from key
        const parts = key.split('_');
        const crisisX = parseInt(parts[parts.length - 2]);
        const crisisY = parseInt(parts[parts.length - 1]);
        
        const distance = Math.sqrt(
          Math.pow(marketLocation.x - crisisX, 2) + 
          Math.pow(marketLocation.y - crisisY, 2)
        );
        
        if (distance <= crisis.pattern.marketEffect.radius) {
          // Add this crisis if not already included
          if (!activeCrises.find(c => c.crisisId === crisis.crisisId)) {
            activeCrises.push(crisis);
          }
        }
      }
    }
    
    this.saveToStorage();
    return activeCrises;
  }

  /**
   * Calculate combined market effects from all active crises
   */
  calculateMarketEffects(
    marketLocation: { x: number; y: number }
  ): Map<string, { priceMultiplier: number; quantityMultiplier: number }> {
    const effects = new Map<string, { priceMultiplier: number; quantityMultiplier: number }>();
    const activeCrises = this.getActiveCrisesForMarket(marketLocation);
    
    for (const crisis of activeCrises) {
      // Find how strongly this crisis affects this market
      const marketId = `market-${marketLocation.x}-${marketLocation.y}`;
      let effectStrength = 1.0;
      
      const affectedMarket = crisis.affectedMarkets.find(m => m.marketId === marketId);
      if (affectedMarket) {
        effectStrength = affectedMarket.effectStrength;
      } else {
        // Calculate based on distance if not in pre-calculated list
        const parts = crisis.crisisId.split('_');
        const crisisX = parseInt(parts[parts.length - 2]);
        const crisisY = parseInt(parts[parts.length - 1]);
        const distance = Math.sqrt(
          Math.pow(marketLocation.x - crisisX, 2) + 
          Math.pow(marketLocation.y - crisisY, 2)
        );
        effectStrength = Math.max(0, 1 - (distance / crisis.pattern.marketEffect.radius));
      }
      
      // Apply effects to each affected category
      for (const category of crisis.pattern.marketEffect.affectedCategories) {
        const existing = effects.get(category) || { priceMultiplier: 1.0, quantityMultiplier: 1.0 };
        
        // Compound effects (multiplicative for more dramatic impact)
        const priceEffect = 1 + ((crisis.pattern.marketEffect.priceMultiplier - 1) * effectStrength);
        const quantityEffect = 1 - ((1 - crisis.pattern.marketEffect.quantityMultiplier) * effectStrength);
        
        existing.priceMultiplier *= priceEffect;
        existing.quantityMultiplier *= quantityEffect;
        
        effects.set(category, existing);
      }
    }
    
    return effects;
  }

  /**
   * Get all active crises for display
   */
  getAllActiveCrises(): ActiveMarketCrisis[] {
    const now = Date.now();
    const active: ActiveMarketCrisis[] = [];
    
    for (const [key, crisis] of this.activeMarketCrises.entries()) {
      if (crisis.expiresAt >= now) {
        active.push(crisis);
      } else {
        this.activeMarketCrises.delete(key);
      }
    }
    
    this.saveToStorage();
    return active;
  }

  /**
   * Record crisis in history
   */
  private recordCrisis(crisis: DetectedCrisis): void {
    this.crisisHistory.push(crisis);
    
    // Keep only last 100 crises
    if (this.crisisHistory.length > 100) {
      this.crisisHistory = this.crisisHistory.slice(-100);
    }
    
    this.saveToStorage();
  }

  /**
   * Get crisis history
   */
  getCrisisHistory(): DetectedCrisis[] {
    return this.crisisHistory;
  }

  /**
   * Clear expired crises
   */
  cleanupExpiredCrises(): void {
    const now = Date.now();
    
    for (const [key, crisis] of this.activeMarketCrises.entries()) {
      if (crisis.expiresAt < now) {
        console.log(`[CrisisDetection] Crisis expired: ${crisis.crisisId}`);
        this.activeMarketCrises.delete(key);
      }
    }
    
    this.saveToStorage();
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      const crisesArray = Array.from(this.activeMarketCrises.entries());
      localStorage.setItem(this.CRISIS_STORAGE_KEY, JSON.stringify(crisesArray));
      localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.crisisHistory));
    } catch (error) {
      console.error('[CrisisDetection] Failed to save to storage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const crisesData = localStorage.getItem(this.CRISIS_STORAGE_KEY);
      if (crisesData) {
        const crisesArray = JSON.parse(crisesData);
        this.activeMarketCrises = new Map(crisesArray);
      }
      
      const historyData = localStorage.getItem(this.HISTORY_STORAGE_KEY);
      if (historyData) {
        this.crisisHistory = JSON.parse(historyData);
      }
      
      // Clean up expired crises on load
      this.cleanupExpiredCrises();
    } catch (error) {
      console.error('[CrisisDetection] Failed to load from storage:', error);
      this.activeMarketCrises = new Map();
      this.crisisHistory = [];
    }
  }

  /**
   * Clear all crises (for testing or reset)
   */
  clearAllCrises(): void {
    this.activeMarketCrises.clear();
    this.crisisHistory = [];
    this.saveToStorage();
    console.log('[CrisisDetection] All crises cleared');
  }
}

// Export singleton instance
export const crisisDetectionService = new CrisisDetectionService();