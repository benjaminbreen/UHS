/**
 * services/poiServiceHandler.ts - Handles POI service interactions
 */
import { TerrainStructure, PlayerCharacter, Item, BiomeType, HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';

export interface POIServiceResult {
  success: boolean;
  message: string;
  itemsReceived?: Item[];
  itemsConsumed?: Item[];
  currencyChange?: number;
  skillLearned?: string;
  reputationChange?: number;
  questProgress?: string;
}

// Material processing ratios for different services
const PROCESSING_RATIOS = {
  mill: {
    wheat: { output: 'flour', ratio: 0.8 },
    barley: { output: 'barley_flour', ratio: 0.75 },
    oats: { output: 'oat_flour', ratio: 0.7 },
    corn: { output: 'cornmeal', ratio: 0.85 },
    rice: { output: 'rice_flour', ratio: 0.9 }
  },
  quarry: {
    raw_stone: { output: 'cut_stone', ratio: 0.6 },
    marble: { output: 'marble_block', ratio: 0.5 },
    granite: { output: 'granite_block', ratio: 0.55 },
    obsidian: { output: 'obsidian_blade', ratio: 0.4 }
  },
  mine: {
    iron_ore: { output: 'iron_ingot', ratio: 0.3 },
    copper_ore: { output: 'copper_ingot', ratio: 0.35 },
    gold_ore: { output: 'gold_ingot', ratio: 0.2 },
    silver_ore: { output: 'silver_ingot', ratio: 0.25 },
    coal: { output: 'refined_coal', ratio: 0.8 }
  },
  factory: {
    iron_ingot: { output: 'iron_tools', ratio: 0.5 },
    copper_ingot: { output: 'copper_tools', ratio: 0.6 },
    wood: { output: 'wooden_goods', ratio: 0.7 },
    cloth: { output: 'clothing', ratio: 0.8 },
    leather: { output: 'leather_goods', ratio: 0.75 }
  }
};

// Service costs based on era and type
const SERVICE_COSTS = {
  [HistoricalEra.PREHISTORIC]: { base: 2, multiplier: 1 },
  [HistoricalEra.ANTIQUITY]: { base: 5, multiplier: 1.5 },
  [HistoricalEra.MEDIEVAL]: { base: 10, multiplier: 2 },
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { base: 20, multiplier: 2.5 },
  [HistoricalEra.INDUSTRIAL_ERA]: { base: 50, multiplier: 3 },
  [HistoricalEra.MODERN_ERA]: { base: 100, multiplier: 4 },
  [HistoricalEra.FUTURE_ERA]: { base: 500, multiplier: 5 }
};

// Item definitions for POI outputs
const POI_ITEMS: Record<string, Partial<Item>> = {
  // Quarry products
  cut_stone: {
    name: 'Cut Stone',
    description: 'Precisely cut building stone',
    value: 10,
    weight: 50,
    stackable: true
  },
  obsidian_blade: {
    name: 'Obsidian Blade',
    description: 'Razor-sharp volcanic glass blade',
    value: 25,
    weight: 2,
    stackable: true
  },
  marble_block: {
    name: 'Marble Block',
    description: 'Polished marble for construction',
    value: 50,
    weight: 100,
    stackable: true
  },
  
  // Mine products
  iron_ingot: {
    name: 'Iron Ingot',
    description: 'Refined iron ready for smithing',
    value: 20,
    weight: 10,
    stackable: true
  },
  copper_ingot: {
    name: 'Copper Ingot',
    description: 'Pure copper ingot',
    value: 15,
    weight: 8,
    stackable: true
  },
  gold_ingot: {
    name: 'Gold Ingot',
    description: 'Precious gold ingot',
    value: 100,
    weight: 12,
    stackable: true
  },
  
  // Mill products
  flour: {
    name: 'Flour',
    description: 'Finely ground wheat flour',
    value: 5,
    weight: 2,
    stackable: true
  },
  cornmeal: {
    name: 'Cornmeal',
    description: 'Ground corn for cooking',
    value: 4,
    weight: 2,
    stackable: true
  },
  rice_flour: {
    name: 'Rice Flour',
    description: 'Fine rice powder',
    value: 6,
    weight: 2,
    stackable: true
  },
  
  // Factory products
  iron_tools: {
    name: 'Iron Tools',
    description: 'Set of iron implements',
    value: 40,
    weight: 15,
    stackable: false
  },
  wooden_goods: {
    name: 'Wooden Goods',
    description: 'Crafted wooden items',
    value: 15,
    weight: 5,
    stackable: true
  },
  clothing: {
    name: 'Clothing',
    description: 'Woven garments',
    value: 20,
    weight: 3,
    stackable: true
  }
};

class POIServiceHandler {
  /**
   * Handle the main service interaction
   */
  public handleService(
    serviceId: string,
    structure: TerrainStructure,
    player: PlayerCharacter,
    culturalZone: CulturalZone,
    era: HistoricalEra
  ): POIServiceResult {
    switch (serviceId) {
      case 'buy_raw':
        return this.handleBuyRaw(structure, player, era);
      
      case 'commission_tools':
        return this.handleCommissionTools(structure, player, era);
      
      case 'grind_grain':
      case 'process_materials':
        return this.handleProcessMaterials(structure, player, era);
      
      case 'learn_technique':
      case 'learn_skill':
        return this.handleLearnSkill(structure, player, culturalZone, era);
      
      case 'buy_flour':
      case 'buy_processed':
        return this.handleBuyProcessed(structure, player, era);
      
      case 'blessing_tools':
      case 'earth_blessing':
        return this.handleRitualBlessing(structure, player, culturalZone);
      
      case 'mining_rights':
      case 'water_rights':
        return this.handleResourceRights(structure, player, era);
      
      default:
        return this.handleGenericService(structure, player, era);
    }
  }

  /**
   * Handle purchasing raw materials
   */
  private handleBuyRaw(
    structure: TerrainStructure,
    player: PlayerCharacter,
    era: HistoricalEra
  ): POIServiceResult {
    const baseCost = SERVICE_COSTS[era]?.base || 5;
    const materialType = this.getMaterialType(structure);
    
    // Check if player has enough currency
    if ((player.currency || 0) < baseCost) {
      return {
        success: false,
        message: `You need at least ${baseCost} coins to purchase raw ${materialType}.`
      };
    }

    // Create the raw material item
    const rawItem: Item = {
      id: `${materialType}_${Date.now()}`,
      baseId: materialType.toUpperCase().replace(' ', '_'),
      name: `Raw ${materialType}`,
      description: `Unprocessed ${materialType} from ${structure.name || 'the quarry'}`,
      value: baseCost,
      weight: 10,
      quantity: Math.floor(Math.random() * 3) + 2, // 2-4 pieces
      stackable: true,
      category: 'material'
    };

    return {
      success: true,
      message: `You purchased ${rawItem.quantity} pieces of raw ${materialType}.`,
      itemsReceived: [rawItem],
      currencyChange: -baseCost
    };
  }

  /**
   * Handle commissioning tools/items
   */
  private handleCommissionTools(
    structure: TerrainStructure,
    player: PlayerCharacter,
    era: HistoricalEra
  ): POIServiceResult {
    const cost = SERVICE_COSTS[era]?.base * 3 || 15;
    const materialType = this.getMaterialType(structure);
    
    if ((player.currency || 0) < cost) {
      return {
        success: false,
        message: `Commissioning tools requires ${cost} coins.`
      };
    }

    // Check if player has materials
    const hasMaterials = player.inventory?.some(item => 
      item.name?.toLowerCase().includes(materialType.toLowerCase())
    );

    if (!hasMaterials) {
      return {
        success: false,
        message: `You need ${materialType} materials to commission tools.`
      };
    }

    // Create commissioned tool
    const tool: Item = {
      id: `tool_${Date.now()}`,
      baseId: `${materialType.toUpperCase()}_TOOL`,
      name: `${materialType} Tool`,
      description: `A finely crafted tool made from ${materialType}`,
      value: cost * 2,
      weight: 5,
      quantity: 1,
      stackable: false,
      category: 'tool',
      durability: 100
    };

    return {
      success: true,
      message: `The craftsman creates a fine ${materialType} tool for you.`,
      itemsReceived: [tool],
      currencyChange: -cost,
      reputationChange: 2
    };
  }

  /**
   * Handle processing materials (mill, etc.)
   */
  private handleProcessMaterials(
    structure: TerrainStructure,
    player: PlayerCharacter,
    era: HistoricalEra
  ): POIServiceResult {
    const poiType = structure.type || 'mill';
    const processingRatios = PROCESSING_RATIOS[poiType as keyof typeof PROCESSING_RATIOS];
    
    if (!processingRatios) {
      return {
        success: false,
        message: 'This facility cannot process materials.'
      };
    }

    // Find processable items in inventory
    const processableItem = player.inventory?.find(item => {
      const itemKey = item.baseId?.toLowerCase() || item.name?.toLowerCase() || '';
      return Object.keys(processingRatios).some(material => 
        itemKey.includes(material)
      );
    });

    if (!processableItem) {
      return {
        success: false,
        message: 'You have no materials that can be processed here.'
      };
    }

    // Calculate processing cost (fraction of grain value)
    const processingCost = Math.ceil((processableItem.value || 5) * 0.2);
    
    if ((player.currency || 0) < processingCost) {
      return {
        success: false,
        message: `Processing requires ${processingCost} coins.`
      };
    }

    // Find the processing ratio
    const itemKey = processableItem.baseId?.toLowerCase() || processableItem.name?.toLowerCase() || '';
    const materialType = Object.keys(processingRatios).find(material => 
      itemKey.includes(material)
    );
    
    if (!materialType) {
      return {
        success: false,
        message: 'Cannot process this material.'
      };
    }

    const processInfo = processingRatios[materialType as keyof typeof processingRatios];
    const outputQuantity = Math.floor((processableItem.quantity || 1) * processInfo.ratio);
    
    // Create processed item
    const processedItem: Item = {
      id: `processed_${Date.now()}`,
      baseId: processInfo.output.toUpperCase(),
      name: POI_ITEMS[processInfo.output]?.name || processInfo.output,
      description: POI_ITEMS[processInfo.output]?.description || `Processed ${materialType}`,
      value: (POI_ITEMS[processInfo.output]?.value || 10),
      weight: (POI_ITEMS[processInfo.output]?.weight || 5),
      quantity: outputQuantity,
      stackable: true,
      category: 'processed'
    };

    return {
      success: true,
      message: `Successfully processed ${processableItem.quantity} ${processableItem.name} into ${outputQuantity} ${processedItem.name}.`,
      itemsReceived: [processedItem],
      itemsConsumed: [processableItem],
      currencyChange: -processingCost
    };
  }

  /**
   * Handle learning skills
   */
  private handleLearnSkill(
    structure: TerrainStructure,
    player: PlayerCharacter,
    culturalZone: CulturalZone,
    era: HistoricalEra
  ): POIServiceResult {
    const skillMap: Record<string, string> = {
      quarry: 'Stone Working',
      mine: 'Mining',
      mill: 'Grain Processing',
      factory: 'Manufacturing',
      fortress: 'Combat Training'
    };

    const skill = skillMap[structure.type || 'quarry'];
    
    // Check intelligence requirement
    if ((player.intelligence || 10) < 12) {
      return {
        success: false,
        message: 'You need Intelligence 12 or higher to learn this skill.'
      };
    }

    // Check if already knows skill
    const hasSkill = player.skills?.some(s => s.name === skill);
    if (hasSkill) {
      return {
        success: false,
        message: `You already know ${skill}.`
      };
    }

    return {
      success: true,
      message: `After hours of practice, you learn the basics of ${skill}.`,
      skillLearned: skill,
      reputationChange: 5
    };
  }

  /**
   * Handle buying processed goods
   */
  private handleBuyProcessed(
    structure: TerrainStructure,
    player: PlayerCharacter,
    era: HistoricalEra
  ): POIServiceResult {
    const cost = SERVICE_COSTS[era]?.base * 2 || 10;
    
    if ((player.currency || 0) < cost) {
      return {
        success: false,
        message: `You need ${cost} coins to purchase processed goods.`
      };
    }

    const poiType = structure.type || 'mill';
    const products = this.getProcessedProducts(poiType);
    const product = products[Math.floor(Math.random() * products.length)];

    const item: Item = {
      id: `bought_${Date.now()}`,
      baseId: product.baseId,
      name: product.name,
      description: product.description,
      value: product.value,
      weight: product.weight,
      quantity: Math.floor(Math.random() * 3) + 1,
      stackable: true,
      category: 'processed'
    };

    return {
      success: true,
      message: `You purchased ${item.quantity} ${item.name}.`,
      itemsReceived: [item],
      currencyChange: -cost
    };
  }

  /**
   * Handle ritual blessings
   */
  private handleRitualBlessing(
    structure: TerrainStructure,
    player: PlayerCharacter,
    culturalZone: CulturalZone
  ): POIServiceResult {
    // Check wisdom requirement
    if ((player.wisdom || 10) < 10) {
      return {
        success: false,
        message: 'You lack the spiritual wisdom for this blessing.'
      };
    }

    // Check for ritual items (herbs, offerings)
    const hasOffering = player.inventory?.some(item => 
      item.category === 'herb' || item.category === 'ritual' || item.value > 20
    );

    if (!hasOffering) {
      return {
        success: false,
        message: 'You need a suitable offering for the blessing ritual.'
      };
    }

    return {
      success: true,
      message: 'The blessing is complete. You feel spiritually fortified.',
      reputationChange: 3,
      // Could add buff effects here
    };
  }

  /**
   * Handle resource rights negotiations
   */
  private handleResourceRights(
    structure: TerrainStructure,
    player: PlayerCharacter,
    era: HistoricalEra
  ): POIServiceResult {
    const cost = SERVICE_COSTS[era]?.base * 10 || 50;
    
    if ((player.currency || 0) < cost) {
      return {
        success: false,
        message: `Securing resource rights requires ${cost} coins as initial payment.`
      };
    }

    // Check reputation
    if ((player.reputation || 0) < 20) {
      return {
        success: false,
        message: 'You need better standing with the local community (Reputation 20+).'
      };
    }

    return {
      success: true,
      message: 'You negotiate rights to work a section of the site. Return daily to harvest resources.',
      currencyChange: -cost,
      reputationChange: 10,
      questProgress: 'resource_rights_acquired'
    };
  }

  /**
   * Handle generic/fallback service
   */
  private handleGenericService(
    structure: TerrainStructure,
    player: PlayerCharacter,
    era: HistoricalEra
  ): POIServiceResult {
    const cost = SERVICE_COSTS[era]?.base || 5;
    
    if ((player.currency || 0) < cost) {
      return {
        success: false,
        message: `This service requires ${cost} coins.`
      };
    }

    return {
      success: true,
      message: 'Service completed successfully.',
      currencyChange: -cost,
      reputationChange: 1
    };
  }

  /**
   * Helper: Get material type from structure
   */
  private getMaterialType(structure: TerrainStructure): string {
    const materialMap: Record<string, string[]> = {
      quarry: ['stone', 'marble', 'granite', 'obsidian', 'slate'],
      mine: ['iron', 'copper', 'gold', 'silver', 'coal'],
      mill: ['wheat', 'barley', 'oats', 'corn', 'rice'],
      factory: ['iron', 'wood', 'cloth', 'leather', 'steel']
    };

    const materials = materialMap[structure.type || 'quarry'] || ['stone'];
    return materials[Math.floor(Math.random() * materials.length)];
  }

  /**
   * Helper: Get processed products for a POI type
   */
  private getProcessedProducts(poiType: string): Array<Partial<Item>> {
    const productMap: Record<string, Array<Partial<Item>>> = {
      mill: [POI_ITEMS.flour, POI_ITEMS.cornmeal, POI_ITEMS.rice_flour],
      quarry: [POI_ITEMS.cut_stone, POI_ITEMS.marble_block, POI_ITEMS.obsidian_blade],
      mine: [POI_ITEMS.iron_ingot, POI_ITEMS.copper_ingot, POI_ITEMS.gold_ingot],
      factory: [POI_ITEMS.iron_tools, POI_ITEMS.wooden_goods, POI_ITEMS.clothing]
    };

    return productMap[poiType] || [POI_ITEMS.cut_stone];
  }
}

export const poiServiceHandler = new POIServiceHandler();