/**
 * Loot and Rewards Service
 * Handles quest rewards, loot tables, and item generation
 */

import { QuestReward } from '../types/questTypes';
import { HistoricalEra } from '../types';

export interface LootItem {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'consumable' | 'valuable' | 'artifact' | 'document' | 'currency' | 'material';
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  culturalOrigin?: string;
  era?: HistoricalEra;
  weight?: number;
  durability?: number;
  effects?: ItemEffect[];
  questItem?: boolean;
  tradeable?: boolean;
  stackable?: boolean;
  maxStack?: number;
}

export interface ItemEffect {
  type: 'health' | 'reputation' | 'knowledge' | 'combat' | 'trade' | 'movement' | 'social';
  value: number;
  duration?: number; // In game minutes, if temporary
  description: string;
}

export interface LootTable {
  id: string;
  name: string;
  description: string;
  minItems: number;
  maxItems: number;
  guaranteedItems?: string[]; // Item IDs that always drop
  possibleItems: LootTableEntry[];
  goldRange?: { min: number; max: number };
  experienceRange?: { min: number; max: number };
}

export interface LootTableEntry {
  itemId?: string;
  itemTemplate?: Partial<LootItem>; // For generating random items
  weight: number; // Higher weight = more likely to drop
  minQuantity?: number;
  maxQuantity?: number;
  conditions?: LootCondition[];
}

export interface LootCondition {
  type: 'playerLevel' | 'reputation' | 'culturalZone' | 'era' | 'difficulty';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: any;
}

export class LootService {
  private itemDatabase: Map<string, LootItem> = new Map();
  private lootTables: Map<string, LootTable> = new Map();
  private playerInventory: LootItem[] = [];
  private culturalItemPrefixes: Record<string, string[]> = {};
  private culturalItemSuffixes: Record<string, string[]> = {};

  constructor() {
    this.initializeItemDatabase();
    this.initializeLootTables();
    this.initializeCulturalModifiers();
  }

  /**
   * Initialize base item database
   */
  private initializeItemDatabase(): void {
    // Common items
    this.addItem({
      id: 'bread',
      name: 'Bread',
      description: 'A loaf of fresh bread',
      category: 'consumable',
      value: 2,
      rarity: 'common',
      effects: [{ type: 'health', value: 5, description: 'Restores 5 health' }],
      stackable: true,
      maxStack: 10
    });

    this.addItem({
      id: 'water_flask',
      name: 'Water Flask',
      description: 'A flask of clean water',
      category: 'consumable',
      value: 1,
      rarity: 'common',
      effects: [{ type: 'health', value: 3, description: 'Restores 3 health' }],
      stackable: true,
      maxStack: 5
    });

    // Weapons
    this.addItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A well-crafted iron sword',
      category: 'weapon',
      value: 50,
      rarity: 'uncommon',
      durability: 100,
      effects: [{ type: 'combat', value: 10, description: 'Combat strength +10' }],
      tradeable: true
    });

    this.addItem({
      id: 'wooden_staff',
      name: 'Wooden Staff',
      description: 'A sturdy wooden staff',
      category: 'weapon',
      value: 20,
      rarity: 'common',
      durability: 80,
      effects: [{ type: 'combat', value: 5, description: 'Combat strength +5' }],
      tradeable: true
    });

    // Valuables
    this.addItem({
      id: 'gold_coin',
      name: 'Gold Coin',
      description: 'A valuable gold coin',
      category: 'currency',
      value: 10,
      rarity: 'common',
      stackable: true,
      maxStack: 999,
      tradeable: true
    });

    this.addItem({
      id: 'silver_coin',
      name: 'Silver Coin',
      description: 'A silver coin',
      category: 'currency',
      value: 5,
      rarity: 'common',
      stackable: true,
      maxStack: 999,
      tradeable: true
    });

    this.addItem({
      id: 'precious_gem',
      name: 'Precious Gem',
      description: 'A sparkling gemstone',
      category: 'valuable',
      value: 100,
      rarity: 'rare',
      tradeable: true
    });

    // Artifacts
    this.addItem({
      id: 'ancient_artifact',
      name: 'Ancient Artifact',
      description: 'A mysterious artifact from ages past',
      category: 'artifact',
      value: 500,
      rarity: 'epic',
      effects: [{ type: 'knowledge', value: 5, description: 'Historical knowledge +5' }],
      questItem: true,
      tradeable: false
    });

    this.addItem({
      id: 'sacred_relic',
      name: 'Sacred Relic',
      description: 'A holy relic of great significance',
      category: 'artifact',
      value: 1000,
      rarity: 'legendary',
      effects: [
        { type: 'reputation', value: 50, description: 'Religious reputation +50' },
        { type: 'social', value: 20, description: 'Social influence +20' }
      ],
      questItem: true,
      tradeable: false
    });

    // Documents
    this.addItem({
      id: 'ancient_scroll',
      name: 'Ancient Scroll',
      description: 'A scroll containing ancient wisdom',
      category: 'document',
      value: 50,
      rarity: 'uncommon',
      effects: [{ type: 'knowledge', value: 2, description: 'Knowledge +2' }],
      tradeable: true
    });

    this.addItem({
      id: 'treasure_map',
      name: 'Treasure Map',
      description: 'A map marking the location of hidden treasure',
      category: 'document',
      value: 200,
      rarity: 'rare',
      questItem: true,
      tradeable: false
    });

    // Trade goods
    this.addItem({
      id: 'silk_cloth',
      name: 'Silk Cloth',
      description: 'Fine silk fabric',
      category: 'material',
      value: 30,
      rarity: 'uncommon',
      stackable: true,
      maxStack: 20,
      tradeable: true
    });

    this.addItem({
      id: 'spices',
      name: 'Exotic Spices',
      description: 'Rare and valuable spices',
      category: 'material',
      value: 25,
      rarity: 'uncommon',
      stackable: true,
      maxStack: 10,
      tradeable: true
    });
  }

  /**
   * Initialize loot tables for different scenarios
   */
  private initializeLootTables(): void {
    // Ruins exploration loot table
    this.addLootTable({
      id: 'ruins_exploration',
      name: 'Ruins Exploration',
      description: 'Loot found when exploring ancient ruins',
      minItems: 1,
      maxItems: 3,
      goldRange: { min: 10, max: 50 },
      possibleItems: [
        { itemId: 'ancient_artifact', weight: 5 },
        { itemId: 'ancient_scroll', weight: 15 },
        { itemId: 'precious_gem', weight: 10 },
        { itemId: 'gold_coin', weight: 30, minQuantity: 5, maxQuantity: 20 },
        { itemId: 'treasure_map', weight: 3 },
        {
          itemTemplate: {
            name: 'Broken Pottery',
            description: 'Fragments of ancient pottery',
            category: 'artifact',
            value: 5,
            rarity: 'common'
          },
          weight: 40
        }
      ]
    });

    // Combat victory loot table
    this.addLootTable({
      id: 'combat_victory',
      name: 'Combat Victory',
      description: 'Loot from defeated enemies',
      minItems: 1,
      maxItems: 2,
      experienceRange: { min: 10, max: 30 },
      possibleItems: [
        { itemId: 'iron_sword', weight: 10 },
        { itemId: 'wooden_staff', weight: 20 },
        { itemId: 'bread', weight: 30, minQuantity: 1, maxQuantity: 3 },
        { itemId: 'water_flask', weight: 25, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'silver_coin', weight: 40, minQuantity: 2, maxQuantity: 10 }
      ]
    });

    // Trade quest reward table
    this.addLootTable({
      id: 'trade_quest_reward',
      name: 'Trade Quest Reward',
      description: 'Rewards for completing trade quests',
      minItems: 2,
      maxItems: 4,
      goldRange: { min: 50, max: 200 },
      guaranteedItems: ['gold_coin'],
      possibleItems: [
        { itemId: 'silk_cloth', weight: 20, minQuantity: 1, maxQuantity: 5 },
        { itemId: 'spices', weight: 25, minQuantity: 1, maxQuantity: 3 },
        { itemId: 'precious_gem', weight: 5 },
        {
          itemTemplate: {
            name: 'Trade Permit',
            description: 'Official permit for conducting trade',
            category: 'document',
            value: 100,
            rarity: 'uncommon',
            effects: [{ type: 'trade', value: 10, description: 'Trade efficiency +10%' }]
          },
          weight: 10
        }
      ]
    });

    // Holy site blessing table
    this.addLootTable({
      id: 'holy_site_blessing',
      name: 'Holy Site Blessing',
      description: 'Blessings and items from holy sites',
      minItems: 1,
      maxItems: 2,
      possibleItems: [
        { itemId: 'sacred_relic', weight: 2 },
        {
          itemTemplate: {
            name: 'Holy Water',
            description: 'Blessed water with healing properties',
            category: 'consumable',
            value: 20,
            rarity: 'uncommon',
            effects: [
              { type: 'health', value: 20, description: 'Restores 20 health' },
              { type: 'social', value: 5, duration: 60, description: 'Temporary charisma boost' }
            ]
          },
          weight: 30
        },
        {
          itemTemplate: {
            name: 'Prayer Beads',
            description: 'Sacred beads used in prayer',
            category: 'artifact',
            value: 40,
            rarity: 'uncommon',
            effects: [{ type: 'reputation', value: 10, description: 'Religious reputation +10' }]
          },
          weight: 25
        }
      ]
    });
  }

  /**
   * Initialize cultural modifiers for procedural item generation
   */
  private initializeCulturalModifiers(): void {
    this.culturalItemPrefixes = {
      'EUROPEAN': ['Royal', 'Noble', 'Knights', 'Lords', 'Ancient'],
      'MENA': ['Sultans', 'Desert', 'Oasis', 'Mystic', 'Golden'],
      'EAST_ASIAN': ['Imperial', 'Jade', 'Dragon', 'Phoenix', 'Celestial'],
      'SOUTH_ASIAN': ['Sacred', 'Divine', 'Lotus', 'Tiger', 'Monsoon'],
      'SUB_SAHARAN_AFRICAN': ['Ancestral', 'Tribal', 'Lions', 'Spirit', 'Ivory'],
      'NORTH_AMERICAN': ['Eagles', 'Thunder', 'Buffalo', 'Sacred', 'Medicine'],
      'SOUTH_AMERICAN': ['Sun', 'Jaguar', 'Feathered', 'Mountain', 'Temple'],
      'OCEANIA': ['Ocean', 'Island', 'Coral', 'Ancestral', 'Wave']
    };

    this.culturalItemSuffixes = {
      'EUROPEAN': ['Crown', 'Blade', 'Shield', 'Scepter', 'Tome'],
      'MENA': ['Scimitar', 'Lamp', 'Carpet', 'Veil', 'Scroll'],
      'EAST_ASIAN': ['Scroll', 'Fan', 'Seal', 'Sword', 'Mirror'],
      'SOUTH_ASIAN': ['Chakra', 'Mantra', 'Jewel', 'Cloth', 'Vessel'],
      'SUB_SAHARAN_AFRICAN': ['Mask', 'Drum', 'Spear', 'Shield', 'Totem'],
      'NORTH_AMERICAN': ['Feather', 'Bow', 'Medicine', 'Pipe', 'Totem'],
      'SOUTH_AMERICAN': ['Mask', 'Gold', 'Obsidian', 'Quipu', 'Textile'],
      'OCEANIA': ['Shell', 'Tiki', 'Net', 'Paddle', 'Lei']
    };
  }

  /**
   * Add item to database
   */
  private addItem(item: LootItem): void {
    this.itemDatabase.set(item.id, item);
  }

  /**
   * Add loot table
   */
  private addLootTable(table: LootTable): void {
    this.lootTables.set(table.id, table);
  }

  /**
   * Generate loot from a loot table
   */
  generateLoot(
    tableId: string,
    modifiers?: {
      luckBonus?: number; // 0-100, affects rarity
      quantityMultiplier?: number;
      culturalZone?: string;
      era?: HistoricalEra;
      playerLevel?: number;
    }
  ): {
    items: Array<{ item: LootItem; quantity: number }>;
    gold?: number;
    experience?: number;
  } {
    const table = this.lootTables.get(tableId);
    if (!table) {
      console.warn(`[LootService] Loot table not found: ${tableId}`);
      return { items: [] };
    }

    const result: {
      items: Array<{ item: LootItem; quantity: number }>;
      gold?: number;
      experience?: number;
    } = { items: [] };

    // Generate gold if specified
    if (table.goldRange) {
      result.gold = Math.floor(
        Math.random() * (table.goldRange.max - table.goldRange.min + 1) + table.goldRange.min
      );
      if (modifiers?.quantityMultiplier) {
        result.gold = Math.floor(result.gold * modifiers.quantityMultiplier);
      }
    }

    // Generate experience if specified
    if (table.experienceRange) {
      result.experience = Math.floor(
        Math.random() * (table.experienceRange.max - table.experienceRange.min + 1) + table.experienceRange.min
      );
    }

    // Add guaranteed items
    if (table.guaranteedItems) {
      table.guaranteedItems.forEach(itemId => {
        const item = this.itemDatabase.get(itemId);
        if (item) {
          result.items.push({ item, quantity: 1 });
        }
      });
    }

    // Determine number of items to generate
    const numItems = Math.floor(Math.random() * (table.maxItems - table.minItems + 1)) + table.minItems;

    // Generate random items
    for (let i = 0; i < numItems; i++) {
      const entry = this.selectWeightedEntry(table.possibleItems, modifiers);
      if (entry) {
        let item: LootItem | null = null;

        if (entry.itemId) {
          item = this.itemDatabase.get(entry.itemId) || null;
        } else if (entry.itemTemplate) {
          item = this.generateProceduralItem(entry.itemTemplate, modifiers);
        }

        if (item) {
          const quantity = entry.minQuantity && entry.maxQuantity
            ? Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity
            : 1;

          // Apply quantity multiplier
          const finalQuantity = modifiers?.quantityMultiplier
            ? Math.ceil(quantity * modifiers.quantityMultiplier)
            : quantity;

          result.items.push({ item, quantity: finalQuantity });
        }
      }
    }

    return result;
  }

  /**
   * Select a weighted entry from loot table
   */
  private selectWeightedEntry(
    entries: LootTableEntry[],
    modifiers?: any
  ): LootTableEntry | null {
    // Filter entries based on conditions
    const validEntries = entries.filter(entry => {
      if (!entry.conditions) return true;
      
      return entry.conditions.every(condition => {
        const value = modifiers?.[condition.type];
        if (value === undefined) return true;

        switch (condition.operator) {
          case '>': return value > condition.value;
          case '<': return value < condition.value;
          case '=': return value === condition.value;
          case '>=': return value >= condition.value;
          case '<=': return value <= condition.value;
          default: return true;
        }
      });
    });

    if (validEntries.length === 0) return null;

    // Calculate total weight
    const totalWeight = validEntries.reduce((sum, entry) => sum + entry.weight, 0);
    
    // Select random entry based on weight
    let random = Math.random() * totalWeight;
    
    for (const entry of validEntries) {
      random -= entry.weight;
      if (random <= 0) {
        return entry;
      }
    }

    return validEntries[0]; // Fallback
  }

  /**
   * Generate a procedural item
   */
  private generateProceduralItem(
    template: Partial<LootItem>,
    modifiers?: {
      culturalZone?: string;
      era?: HistoricalEra;
      luckBonus?: number;
    }
  ): LootItem {
    const id = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate culturally appropriate name if not provided
    let name = template.name;
    if (!name && modifiers?.culturalZone) {
      const prefixes = this.culturalItemPrefixes[modifiers.culturalZone] || this.culturalItemPrefixes['EUROPEAN'];
      const suffixes = this.culturalItemSuffixes[modifiers.culturalZone] || this.culturalItemSuffixes['EUROPEAN'];
      
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      name = `${prefix} ${suffix}`;
    }

    // Determine rarity based on luck
    let rarity = template.rarity || 'common';
    if (modifiers?.luckBonus && !template.rarity) {
      const roll = Math.random() * 100 + (modifiers.luckBonus || 0);
      if (roll > 95) rarity = 'legendary';
      else if (roll > 85) rarity = 'epic';
      else if (roll > 70) rarity = 'rare';
      else if (roll > 50) rarity = 'uncommon';
    }

    // Scale value based on rarity
    const rarityMultipliers = {
      common: 1,
      uncommon: 2,
      rare: 5,
      epic: 10,
      legendary: 25
    };
    const baseValue = template.value || 10;
    const value = Math.floor(baseValue * rarityMultipliers[rarity]);

    return {
      id,
      name: name || 'Unknown Item',
      description: template.description || 'A mysterious item',
      category: template.category || 'valuable',
      value,
      rarity,
      culturalOrigin: modifiers?.culturalZone,
      era: modifiers?.era,
      weight: template.weight,
      durability: template.durability,
      effects: template.effects,
      questItem: template.questItem,
      tradeable: template.tradeable !== false,
      stackable: template.stackable,
      maxStack: template.maxStack
    };
  }

  /**
   * Process quest rewards and add to player inventory
   */
  processQuestRewards(
    rewards: QuestReward[],
    culturalZone?: string,
    era?: HistoricalEra
  ): {
    items: LootItem[];
    otherRewards: Array<{ type: string; value: any; description: string }>;
  } {
    const result = {
      items: [] as LootItem[],
      otherRewards: [] as Array<{ type: string; value: any; description: string }>
    };

    rewards.forEach(reward => {
      // Check if reward should be given based on chance
      if (reward.guaranteed === false && reward.chance) {
        if (Math.random() > reward.chance) {
          return; // Skip this reward
        }
      }

      switch (reward.type) {
        case 'item':
          if (reward.itemId) {
            const item = this.itemDatabase.get(reward.itemId);
            if (item) {
              for (let i = 0; i < (reward.quantity || 1); i++) {
                result.items.push(item);
                this.addToInventory(item);
              }
            }
          } else {
            // Generate procedural item
            const proceduralItem = this.generateProceduralItem(
              {
                name: reward.description,
                value: reward.value as number || 10,
                category: 'valuable'
              },
              { culturalZone, era }
            );
            result.items.push(proceduralItem);
            this.addToInventory(proceduralItem);
          }
          break;

        case 'money':
          const goldReward = Math.floor(reward.value as number);
          const goldItem = this.itemDatabase.get('gold_coin');
          if (goldItem) {
            for (let i = 0; i < goldReward; i++) {
              result.items.push(goldItem);
            }
            this.addToInventory(goldItem, goldReward);
          }
          break;

        default:
          // Non-item rewards (reputation, knowledge, etc.)
          result.otherRewards.push({
            type: reward.type,
            value: reward.value,
            description: reward.description
          });
          break;
      }
    });

    return result;
  }

  /**
   * Add item to player inventory
   */
  addToInventory(item: LootItem, quantity: number = 1): void {
    if (item.stackable) {
      const existingStack = this.playerInventory.find(i => i.id === item.id);
      if (existingStack) {
        // Update quantity in existing stack
        const currentQuantity = (existingStack as any).quantity || 1;
        const maxStack = item.maxStack || 999;
        (existingStack as any).quantity = Math.min(currentQuantity + quantity, maxStack);
        return;
      }
    }

    // Add new item(s) to inventory
    for (let i = 0; i < quantity; i++) {
      this.playerInventory.push({ ...item });
    }
  }

  /**
   * Get player inventory
   */
  getInventory(): LootItem[] {
    return this.playerInventory;
  }

  /**
   * Clear inventory (for new game)
   */
  clearInventory(): void {
    this.playerInventory = [];
  }

  /**
   * Generate treasure based on difficulty and context
   */
  generateTreasure(
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary',
    context: 'ruins' | 'combat' | 'trade' | 'holy_site' | 'random',
    culturalZone?: string,
    era?: HistoricalEra
  ): {
    items: Array<{ item: LootItem; quantity: number }>;
    gold?: number;
    experience?: number;
  } {
    const difficultyModifiers = {
      easy: { luckBonus: 0, quantityMultiplier: 0.5 },
      medium: { luckBonus: 10, quantityMultiplier: 1 },
      hard: { luckBonus: 25, quantityMultiplier: 1.5 },
      legendary: { luckBonus: 50, quantityMultiplier: 2 }
    };

    const contextToTable = {
      ruins: 'ruins_exploration',
      combat: 'combat_victory',
      trade: 'trade_quest_reward',
      holy_site: 'holy_site_blessing',
      random: ['ruins_exploration', 'combat_victory', 'trade_quest_reward'][Math.floor(Math.random() * 3)]
    };

    const tableId = contextToTable[context];
    const modifiers = {
      ...difficultyModifiers[difficulty],
      culturalZone,
      era
    };

    return this.generateLoot(tableId, modifiers);
  }
}

// Export singleton instance
export const lootService = new LootService();