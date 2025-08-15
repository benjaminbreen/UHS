/**
 * Trade Service
 * Manages economic simulation, NPC trading, and marketplace dynamics
 */

import { NpcEntity, Item, TerrainStructure, MapData, HistoricalEra } from '../types';
import { ITEM_DEFINITIONS } from '../constants/gameData/itemDefinitions';
import { parseDateString } from '../utils/dateUtils';

export interface TradeGood {
  itemId: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  quantity: number;
  quality: 'poor' | 'standard' | 'fine' | 'exceptional';
  origin?: string; // Where it was produced
  category: 'food' | 'raw_material' | 'manufactured' | 'luxury' | 'tool' | 'weapon';
}

export interface MarketConditions {
  supply: Map<string, number>; // itemId -> quantity available
  demand: Map<string, number>; // itemId -> demand level (0-1)
  priceModifiers: Map<string, number>; // itemId -> price multiplier
  lastUpdate: number;
}

export interface TradeOffer {
  sellerId: string;
  goods: TradeGood[];
  requestedPayment: number;
  requestedGoods?: string[]; // Items they want in barter
  willingToBarter: boolean;
  expiresAt?: number;
}

export interface TradeRoute {
  id: string;
  origin: string; // Structure ID
  destination: string; // Structure ID
  goods: string[]; // Item IDs traded
  frequency: 'daily' | 'weekly' | 'monthly';
  reliability: number; // 0-1, chance of successful delivery
  active: boolean;
}

export class TradeService {
  private marketConditions: Map<string, MarketConditions> = new Map();
  private tradeRoutes: Map<string, TradeRoute> = new Map();
  private merchantInventories: Map<string, TradeGood[]> = new Map();
  
  /**
   * Initialize market conditions for a location
   */
  initializeMarket(
    structureId: string,
    mapData: MapData,
    nearbyStructures: TerrainStructure[]
  ): MarketConditions {
    const supply = new Map<string, number>();
    const demand = new Map<string, number>();
    const priceModifiers = new Map<string, number>();
    
    // Calculate supply from nearby production
    nearbyStructures.forEach(structure => {
      if (structure.outputGoods) {
        structure.outputGoods.forEach(good => {
          const current = supply.get(good) || 0;
          supply.set(good, current + 100); // Base supply per producer
        });
      }
      
      // Factories and farms increase supply of their products
      if (structure.structureType === 'factory' || structure.structureType === 'farm') {
        const production = this.getStructureProduction(structure, mapData);
        production.forEach(item => {
          const current = supply.get(item) || 0;
          supply.set(item, current + 200);
        });
      }
    });
    
    // Calculate demand based on population and era
    const dateInfo = parseDateString(mapData.timeSlice || '1500');
    const populationDensity = this.calculatePopulationDensity(mapData);
    
    // Basic goods always in demand
    const basicGoods = ['FOOD', 'WATER', 'CLOTH', 'TOOLS'];
    basicGoods.forEach(good => {
      demand.set(good, 0.8 + populationDensity * 0.2);
    });
    
    // Era-specific demands
    this.addEraSpecificDemands(demand, dateInfo.era as HistoricalEra, dateInfo.year);
    
    // Calculate price modifiers based on supply/demand
    const allGoods = new Set([...supply.keys(), ...demand.keys()]);
    allGoods.forEach(good => {
      const supplyLevel = supply.get(good) || 0;
      const demandLevel = demand.get(good) || 0.5;
      
      // High demand + low supply = higher prices
      let modifier = 1.0;
      if (supplyLevel < 50 && demandLevel > 0.7) {
        modifier = 1.5 + (demandLevel - 0.7) * 2;
      } else if (supplyLevel > 200 && demandLevel < 0.3) {
        modifier = 0.5 + demandLevel;
      } else {
        modifier = 0.8 + (demandLevel * 0.4);
      }
      
      priceModifiers.set(good, modifier);
    });
    
    const conditions: MarketConditions = {
      supply,
      demand,
      priceModifiers,
      lastUpdate: Date.now()
    };
    
    this.marketConditions.set(structureId, conditions);
    return conditions;
  }
  
  /**
   * Generate trade goods for an NPC based on their profession and context
   */
  generateNpcTradeGoods(
    npc: NpcEntity,
    mapData: MapData
  ): TradeGood[] {
    const goods: TradeGood[] = [];
    const dateInfo = parseDateString(mapData.timeSlice || '1500');
    
    // Generate goods based on NPC profession
    switch (npc.role?.toLowerCase()) {
      case 'merchant':
      case 'trader':
        goods.push(...this.generateMerchantGoods(npc, dateInfo));
        break;
        
      case 'farmer':
      case 'peasant':
        goods.push(...this.generateFarmGoods(npc, dateInfo));
        break;
        
      case 'blacksmith':
      case 'smith':
        goods.push(...this.generateSmithGoods(npc, dateInfo));
        break;
        
      case 'factory worker':
      case 'mill worker':
        if (npc.workplace) {
          goods.push(...this.generateFactoryGoods(npc, dateInfo));
        }
        break;
        
      case 'fisherman':
      case 'fisher':
        goods.push(...this.generateFishingGoods(npc, dateInfo));
        break;
        
      case 'artisan':
      case 'craftsman':
        goods.push(...this.generateArtisanGoods(npc, dateInfo));
        break;
        
      default:
        // Generic goods based on wealth level
        if (npc.wealthLevel === 'wealthy' || npc.wealthLevel === 'noble') {
          goods.push(...this.generateLuxuryGoods(dateInfo));
        } else {
          goods.push(...this.generateBasicGoods(dateInfo));
        }
    }
    
    // Store in merchant inventories for persistence
    if (goods.length > 0) {
      this.merchantInventories.set(npc.id, goods);
    }
    
    return goods;
  }
  
  /**
   * Calculate a fair trade between player and NPC
   */
  evaluateTrade(
    sellerGoods: TradeGood[],
    buyerOffer: { coins?: number; goods?: TradeGood[] },
    marketConditions?: MarketConditions
  ): { fair: boolean; value: number; suggestion?: string } {
    // Calculate total value of seller's goods
    let sellerValue = 0;
    sellerGoods.forEach(good => {
      const basePrice = good.currentPrice || good.basePrice;
      const modifier = marketConditions?.priceModifiers.get(good.itemId) || 1.0;
      sellerValue += basePrice * modifier * good.quantity;
    });
    
    // Calculate buyer's offer value
    let buyerValue = buyerOffer.coins || 0;
    if (buyerOffer.goods) {
      buyerOffer.goods.forEach(good => {
        const basePrice = good.currentPrice || good.basePrice;
        const modifier = marketConditions?.priceModifiers.get(good.itemId) || 1.0;
        buyerValue += basePrice * modifier * good.quantity;
      });
    }
    
    const fairnessRatio = buyerValue / sellerValue;
    const fair = fairnessRatio >= 0.9 && fairnessRatio <= 1.1;
    
    let suggestion: string | undefined;
    if (!fair) {
      if (fairnessRatio < 0.9) {
        const needed = Math.ceil(sellerValue - buyerValue);
        suggestion = `You need to offer ${needed} more coins or additional goods.`;
      } else {
        suggestion = `You're offering too much! They would accept ${Math.floor(sellerValue * 0.95)} coins.`;
      }
    }
    
    return { fair, value: sellerValue, suggestion };
  }
  
  /**
   * Generate merchant-specific goods
   */
  private generateMerchantGoods(npc: NpcEntity, dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    const era = dateInfo.era as HistoricalEra;
    
    // Era-specific merchant goods
    const merchantCatalog: Record<HistoricalEra, string[]> = {
      'PREHISTORY': ['FLINT', 'HIDES', 'SALT', 'SHELLS'],
      'ANTIQUITY': ['BRONZE_INGOT', 'WINE', 'OLIVE_OIL', 'PAPYRUS', 'SILK'],
      'MEDIEVAL': ['WOOL', 'SPICES', 'PARCHMENT', 'IRON_TOOLS', 'CANDLES'],
      'RENAISSANCE_EARLY_MODERN': ['SILK', 'SPICES', 'SUGAR', 'COFFEE', 'TOBACCO', 'PORCELAIN'],
      'INDUSTRIAL_ERA': ['COTTON', 'COAL', 'STEEL', 'MACHINERY_PARTS', 'TEXTILES'],
      'MODERN_ERA': ['ELECTRONICS', 'PETROLEUM', 'PLASTICS', 'PHARMACEUTICALS'],
      'FUTURE_ERA': ['QUANTUM_CHIPS', 'FUSION_CELLS', 'NANO_MATERIALS']
    };
    
    const availableGoods = merchantCatalog[era] || merchantCatalog['MEDIEVAL'];
    
    // Select 3-6 different goods
    const numGoods = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numGoods && i < availableGoods.length; i++) {
      const itemId = availableGoods[Math.floor(Math.random() * availableGoods.length)];
      const item = ITEM_DEFINITIONS[itemId];
      
      if (item) {
        goods.push({
          itemId,
          name: item.name,
          basePrice: item.value || 10,
          currentPrice: (item.value || 10) * (0.8 + Math.random() * 0.4),
          quantity: Math.floor(Math.random() * 10) + 1,
          quality: this.randomQuality(npc.wealthLevel),
          origin: npc.birthplace,
          category: this.categorizeItem(item)
        });
      }
    }
    
    return goods;
  }
  
  /**
   * Generate farm produce
   */
  private generateFarmGoods(npc: NpcEntity, dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    const season = this.getCurrentSeason(dateInfo.year);
    
    const farmProduce: Record<string, string[]> = {
      'spring': ['SEEDS', 'EGGS', 'MILK', 'SPRING_VEGETABLES'],
      'summer': ['WHEAT', 'BARLEY', 'SUMMER_FRUITS', 'HONEY'],
      'autumn': ['CORN', 'APPLES', 'GRAPES', 'PUMPKINS'],
      'winter': ['PRESERVED_MEAT', 'CHEESE', 'ROOT_VEGETABLES']
    };
    
    const seasonal = farmProduce[season] || farmProduce['summer'];
    seasonal.forEach(itemId => {
      const item = ITEM_DEFINITIONS[itemId] || { 
        id: itemId, 
        name: itemId.replace(/_/g, ' ').toLowerCase(),
        value: 5
      };
      
      goods.push({
        itemId,
        name: item.name,
        basePrice: item.value || 5,
        currentPrice: (item.value || 5) * (0.7 + Math.random() * 0.3),
        quantity: Math.floor(Math.random() * 20) + 5,
        quality: 'standard',
        origin: 'Local Farm',
        category: 'food'
      });
    });
    
    return goods;
  }
  
  /**
   * Generate smith goods
   */
  private generateSmithGoods(npc: NpcEntity, dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    const era = dateInfo.era as HistoricalEra;
    
    const smithProducts: Record<string, string[]> = {
      'tools': ['HAMMER', 'PICKAXE', 'HOE', 'SHOVEL', 'AXE'],
      'weapons': ['SWORD', 'SPEAR', 'DAGGER', 'ARROWHEADS'],
      'armor': ['HELMET', 'BREASTPLATE', 'GAUNTLETS', 'HORSESHOES'],
      'misc': ['NAILS', 'HINGES', 'LOCKS', 'CHAINS']
    };
    
    // Select category based on era
    const categories = era === 'MEDIEVAL' || era === 'ANTIQUITY' ? 
      ['weapons', 'armor', 'tools'] : ['tools', 'misc'];
    
    categories.forEach(category => {
      const items = smithProducts[category] || [];
      const item = items[Math.floor(Math.random() * items.length)];
      
      if (item) {
        goods.push({
          itemId: item,
          name: item.replace(/_/g, ' ').toLowerCase(),
          basePrice: 20 + Math.floor(Math.random() * 30),
          currentPrice: 20 + Math.floor(Math.random() * 30),
          quantity: Math.floor(Math.random() * 5) + 1,
          quality: this.randomQuality(npc.wealthLevel),
          origin: 'Local Smithy',
          category: category === 'weapons' || category === 'armor' ? 'weapon' : 'tool'
        });
      }
    });
    
    return goods;
  }
  
  /**
   * Generate factory-produced goods
   */
  private generateFactoryGoods(npc: NpcEntity, dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    
    // Get factory output from workplace
    const factoryOutputs: Record<string, string[]> = {
      'textile_mill': ['COTTON_CLOTH', 'THREAD', 'YARN', 'DYED_FABRIC'],
      'steel_mill': ['STEEL_INGOT', 'STEEL_BEAM', 'RAIL_TRACK'],
      'sugar_refinery': ['REFINED_SUGAR', 'MOLASSES', 'RUM'],
      'automobile_factory': ['CAR_PARTS', 'TIRES', 'ENGINES']
    };
    
    // Default to textile goods if workplace unknown
    const outputs = factoryOutputs[npc.workplace || 'textile_mill'] || factoryOutputs['textile_mill'];
    
    outputs.forEach(itemId => {
      goods.push({
        itemId,
        name: itemId.replace(/_/g, ' ').toLowerCase(),
        basePrice: 15 + Math.floor(Math.random() * 20),
        currentPrice: 15 + Math.floor(Math.random() * 20),
        quantity: Math.floor(Math.random() * 50) + 10,
        quality: 'standard',
        origin: npc.workplaceName || 'Factory',
        category: 'manufactured'
      });
    });
    
    return goods;
  }
  
  /**
   * Generate fishing goods
   */
  private generateFishingGoods(npc: NpcEntity, dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    
    const fishTypes = ['FRESH_FISH', 'DRIED_FISH', 'SALTED_FISH', 'SHELLFISH', 'FISH_OIL'];
    
    fishTypes.slice(0, 2 + Math.floor(Math.random() * 2)).forEach(itemId => {
      goods.push({
        itemId,
        name: itemId.replace(/_/g, ' ').toLowerCase(),
        basePrice: 3 + Math.floor(Math.random() * 7),
        currentPrice: 3 + Math.floor(Math.random() * 7),
        quantity: Math.floor(Math.random() * 30) + 10,
        quality: 'standard',
        origin: 'Local Waters',
        category: 'food'
      });
    });
    
    return goods;
  }
  
  /**
   * Generate artisan goods
   */
  private generateArtisanGoods(npc: NpcEntity, dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    
    const artisanProducts = [
      'POTTERY', 'JEWELRY', 'LEATHER_GOODS', 'CARVED_WOOD',
      'WOVEN_BASKETS', 'DECORATED_CLOTH', 'GLASS_BEADS'
    ];
    
    artisanProducts.slice(0, 2 + Math.floor(Math.random() * 3)).forEach(itemId => {
      goods.push({
        itemId,
        name: itemId.replace(/_/g, ' ').toLowerCase(),
        basePrice: 10 + Math.floor(Math.random() * 40),
        currentPrice: 10 + Math.floor(Math.random() * 40),
        quantity: Math.floor(Math.random() * 10) + 1,
        quality: this.randomQuality(npc.wealthLevel),
        origin: npc.name + "'s Workshop",
        category: 'luxury'
      });
    });
    
    return goods;
  }
  
  /**
   * Generate luxury goods for wealthy NPCs
   */
  private generateLuxuryGoods(dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    const era = dateInfo.era as HistoricalEra;
    
    const luxuries: Record<HistoricalEra, string[]> = {
      'PREHISTORY': ['AMBER', 'JADE', 'RARE_SHELLS'],
      'ANTIQUITY': ['GOLD_JEWELRY', 'IVORY', 'INCENSE', 'PURPLE_DYE'],
      'MEDIEVAL': ['TAPESTRIES', 'ILLUMINATED_MANUSCRIPTS', 'SPICES', 'FURS'],
      'RENAISSANCE_EARLY_MODERN': ['PAINTINGS', 'SCULPTURES', 'RARE_BOOKS', 'PERFUMES'],
      'INDUSTRIAL_ERA': ['POCKET_WATCHES', 'FINE_CLOTHES', 'CIGARS', 'CHAMPAGNE'],
      'MODERN_ERA': ['ELECTRONICS', 'DESIGNER_GOODS', 'ART', 'COLLECTIBLES'],
      'FUTURE_ERA': ['HOLO_ART', 'QUANTUM_JEWELRY', 'SYNTHETIC_GEMS']
    };
    
    const available = luxuries[era] || luxuries['MEDIEVAL'];
    available.slice(0, 1 + Math.floor(Math.random() * 2)).forEach(itemId => {
      goods.push({
        itemId,
        name: itemId.replace(/_/g, ' ').toLowerCase(),
        basePrice: 50 + Math.floor(Math.random() * 200),
        currentPrice: 50 + Math.floor(Math.random() * 200),
        quantity: 1 + Math.floor(Math.random() * 3),
        quality: 'exceptional',
        category: 'luxury'
      });
    });
    
    return goods;
  }
  
  /**
   * Generate basic everyday goods
   */
  private generateBasicGoods(dateInfo: any): TradeGood[] {
    const goods: TradeGood[] = [];
    
    const basics = ['BREAD', 'CHEESE', 'CLOTH', 'CANDLES', 'ROPE', 'LEATHER'];
    
    basics.slice(0, 2 + Math.floor(Math.random() * 2)).forEach(itemId => {
      goods.push({
        itemId,
        name: itemId.replace(/_/g, ' ').toLowerCase(),
        basePrice: 2 + Math.floor(Math.random() * 8),
        currentPrice: 2 + Math.floor(Math.random() * 8),
        quantity: Math.floor(Math.random() * 20) + 5,
        quality: 'standard',
        category: 'food'
      });
    });
    
    return goods;
  }
  
  /**
   * Get production output from a structure
   */
  private getStructureProduction(structure: TerrainStructure, mapData: MapData): string[] {
    if (structure.outputGoods) {
      return structure.outputGoods;
    }
    
    // Default outputs by structure type
    const defaults: Record<string, string[]> = {
      'farm': ['WHEAT', 'VEGETABLES', 'MEAT'],
      'fishing_hut': ['FRESH_FISH', 'DRIED_FISH'],
      'mill': ['FLOUR', 'BREAD'],
      'mining_colony': ['IRON_ORE', 'COPPER_ORE', 'COAL'],
      'lumber_camp': ['TIMBER', 'PLANKS'],
      'factory': ['TEXTILES', 'MANUFACTURED_GOODS']
    };
    
    return defaults[structure.structureType] || [];
  }
  
  /**
   * Calculate population density from map data
   */
  private calculatePopulationDensity(mapData: MapData): number {
    let urbanTiles = 0;
    const totalTiles = mapData.tiles.length * mapData.tiles[0].length;
    
    mapData.tiles.forEach(row => {
      row.forEach(tile => {
        if (tile.biome === 'HAMLET' || tile.biome === 'LOW_DENSITY_CITY' || tile.biome === 'DENSE_CITY') {
          urbanTiles++;
        }
      });
    });
    
    return urbanTiles / totalTiles;
  }
  
  /**
   * Add era-specific demand patterns
   */
  private addEraSpecificDemands(demand: Map<string, number>, era: HistoricalEra, year: number): void {
    switch (era) {
      case 'INDUSTRIAL_ERA':
        demand.set('COAL', 0.9);
        demand.set('STEEL', 0.8);
        demand.set('MACHINERY_PARTS', 0.7);
        break;
        
      case 'RENAISSANCE_EARLY_MODERN':
        demand.set('SPICES', 0.9);
        demand.set('SILK', 0.8);
        demand.set('SUGAR', 0.7);
        demand.set('TOBACCO', 0.6);
        break;
        
      case 'MEDIEVAL':
        demand.set('IRON_TOOLS', 0.8);
        demand.set('WOOL', 0.7);
        demand.set('CANDLES', 0.6);
        break;
        
      case 'ANTIQUITY':
        demand.set('BRONZE_TOOLS', 0.8);
        demand.set('WINE', 0.6);
        demand.set('OLIVE_OIL', 0.7);
        break;
    }
  }
  
  /**
   * Determine quality based on wealth level
   */
  private randomQuality(wealthLevel?: string): 'poor' | 'standard' | 'fine' | 'exceptional' {
    const roll = Math.random();
    
    if (wealthLevel === 'wealthy' || wealthLevel === 'noble') {
      if (roll < 0.3) return 'fine';
      if (roll < 0.5) return 'exceptional';
      return 'standard';
    } else if (wealthLevel === 'comfortable') {
      if (roll < 0.2) return 'fine';
      return 'standard';
    } else {
      if (roll < 0.3) return 'poor';
      return 'standard';
    }
  }
  
  /**
   * Categorize an item
   */
  private categorizeItem(item: any): TradeGood['category'] {
    const itemType = item.type?.toLowerCase() || '';
    
    if (itemType.includes('food') || itemType.includes('consumable')) return 'food';
    if (itemType.includes('weapon') || itemType.includes('armor')) return 'weapon';
    if (itemType.includes('tool')) return 'tool';
    if (itemType.includes('luxury') || item.value > 50) return 'luxury';
    if (itemType.includes('material')) return 'raw_material';
    
    return 'manufactured';
  }
  
  /**
   * Get current season
   */
  private getCurrentSeason(year: number): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  /**
   * Create a trade route between structures
   */
  createTradeRoute(
    origin: TerrainStructure,
    destination: TerrainStructure,
    goods: string[]
  ): TradeRoute {
    const route: TradeRoute = {
      id: `route-${origin.id}-${destination.id}`,
      origin: origin.id,
      destination: destination.id,
      goods,
      frequency: this.determineFrequency(origin, destination),
      reliability: this.calculateReliability(origin, destination),
      active: true
    };
    
    this.tradeRoutes.set(route.id, route);
    return route;
  }
  
  /**
   * Determine trade frequency based on distance and importance
   */
  private determineFrequency(origin: TerrainStructure, destination: TerrainStructure): 'daily' | 'weekly' | 'monthly' {
    const distance = Math.hypot(
      origin.location[0] - destination.location[0],
      origin.location[1] - destination.location[1]
    );
    
    if (distance < 10) return 'daily';
    if (distance < 30) return 'weekly';
    return 'monthly';
  }
  
  /**
   * Calculate trade route reliability
   */
  private calculateReliability(origin: TerrainStructure, destination: TerrainStructure): number {
    // Base reliability
    let reliability = 0.8;
    
    // Reduce for longer distances
    const distance = Math.hypot(
      origin.location[0] - destination.location[0],
      origin.location[1] - destination.location[1]
    );
    reliability -= distance * 0.01;
    
    // Increase for fortified structures
    if (origin.structureType === 'fortress' || destination.structureType === 'fortress') {
      reliability += 0.1;
    }
    
    return Math.max(0.3, Math.min(1.0, reliability));
  }
}

// Export singleton instance
export const tradeService = new TradeService();