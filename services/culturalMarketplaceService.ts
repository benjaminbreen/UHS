/**
 * services/culturalMarketplaceService.ts - Phase 1: Biome-driven regional economics with cultural specificity
 * 
 * This service integrates with existing systems to create culturally and historically accurate marketplaces:
 * - Biome-specific resource generation using MineralGenerator and FarmlandGenerator data
 * - Cultural zone specialties from faction and profession systems
 * - Historical era appropriate goods from economicSectors and religiousEconomy
 * - NPC profession-based supply chains
 */

import { 
  MapData, 
  HistoricalEra, 
  CulturalZone, 
  BiomeType, 
  NpcEntity, 
  TerrainStructure,
  ClimateType,
  ItemDefinition 
} from '../types';
import { ITEM_DEFINITIONS, getItemDefinition } from '../constants/gameData/itemDefinitions';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { ANIMAL_DATA } from '../constants/gameData/animals';
import { VEGETATION_SPECIES_DATA } from '../constants/gameData/vegetationData';
import { HISTORICAL_MINERALS } from '../constants/gameData/historicalMinerals';
import { RELIGIOUS_ECONOMY, getReligiousEconomy } from '../constants/gameData/religiousEconomy';
import { EconomicSector, getDominantSector, getRegionalIndustries } from '../constants/gameData/economicSectors';
import { FACTION_DATA } from '../constants/gameData/factions';
import { PROFESSIONS } from '../constants/characterData/professions';
import { parseDateString } from '../utils/dateUtils';

export interface CulturalMarketGood {
  itemId: string;
  name: string;
  culturalName?: string; // Local name for the item
  basePrice: number;
  currentPrice: number;
  quantity: number;
  quality: 'poor' | 'standard' | 'fine' | 'exceptional' | 'masterwork';
  origin: 'local' | 'regional' | 'distant' | 'exotic';
  category: 'food' | 'raw_material' | 'manufactured' | 'luxury' | 'religious' | 'military' | 'medicine';
  culturalSignificance?: string; // Why this item is important to this culture
  seasonalModifier?: number; // Seasonal price/availability modifier
  productionChain?: string[]; // What other goods are needed to produce this
}

export interface BiomeMarketData {
  primaryGoods: string[]; // Items this biome produces abundantly
  secondaryGoods: string[]; // Items this biome produces in smaller quantities
  importedGoods: string[]; // Items this biome must import
  specialties: string[]; // Unique items only found in this biome/culture combination
  animalProducts: string[]; // Products from local animals
  plantProducts: string[]; // Products from local vegetation
  mineralProducts: string[]; // Products from local mineral deposits
}

export interface CulturalSpecialties {
  foodSpecialties: string[];
  craftSpecialties: string[];
  luxurySpecialties: string[];
  religiousItems: string[];
  militaryItems: string[];
  medicinalItems: string[];
  tradeSecrets: string[]; // Items this culture produces exceptionally well
}

export class CulturalMarketplaceService {
  private biomeMarketCache = new Map<string, BiomeMarketData>();
  private culturalSpecialtiesCache = new Map<string, CulturalSpecialties>();
  
  /**
   * Generate marketplace inventory with deep cultural and biome integration
   */
  generateCulturalMarketplace(
    mapData: MapData,
    era: HistoricalEra,
    culturalZone: CulturalZone,
    region: string,
    climate: ClimateType,
    npcs: NpcEntity[]
  ): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    const dateInfo = parseDateString(mapData.timeSlice || '1500');
    
    // Get biome-specific production
    const biomeData = this.analyzeBiomeProduction(mapData, culturalZone, region, climate);
    
    // Get cultural specialties
    const culturalSpecialties = this.getCulturalSpecialties(culturalZone, era, region);
    
    // Get profession-based production from local NPCs
    const professionProduction = this.analyzeProfessionProduction(npcs, culturalZone, era);
    
    // Generate local biome goods (most abundant)
    goods.push(...this.generateBiomeGoods(biomeData, culturalZone, era, 'local'));
    
    // Generate regional imports (moderate quantities)
    goods.push(...this.generateBiomeGoods(biomeData, culturalZone, era, 'regional'));
    
    // Generate distant trade goods (small quantities, higher prices)
    goods.push(...this.generateDistantTradeGoods(culturalZone, era));
    
    // Generate exotic goods (very rare, very expensive) 
    goods.push(...this.generateExoticGoods(culturalZone, era));
    
    // Generate cultural specialty goods
    goods.push(...this.generateCulturalGoods(culturalSpecialties, culturalZone, era));
    
    // Generate profession-based goods
    goods.push(...this.generateProfessionGoods(professionProduction, culturalZone, era));
    
    // Generate imported goods based on trade networks
    goods.push(...this.generateImportedGoods(mapData, culturalZone, region, era));
    
    // Generate religious goods if holy sites exist
    const holySites = mapData.terrainStructures?.filter(s => s.structureType === 'holy_site') || [];
    if (holySites.length > 0) {
      goods.push(...this.generateReligiousGoods(holySites, culturalZone, era));
    }
    
    // Apply cultural pricing and availability modifiers
    return goods.map(good => this.applyCulturalModifiers(good, culturalZone, era, climate));
  }
  
  /**
   * Analyze what each biome on the map can produce
   */
  private analyzeBiomeProduction(
    mapData: MapData, 
    culturalZone: CulturalZone, 
    region: string, 
    climate: ClimateType
  ): BiomeMarketData {
    const cacheKey = `${culturalZone}-${region}-${climate}`;
    if (this.biomeMarketCache.has(cacheKey)) {
      return this.biomeMarketCache.get(cacheKey)!;
    }
    
    const biomeData: BiomeMarketData = {
      primaryGoods: [],
      secondaryGoods: [],
      importedGoods: [],
      specialties: [],
      animalProducts: [],
      plantProducts: [],
      mineralProducts: []
    };
    
    // Analyze biome distribution on the map
    const biomes = this.getBiomeDistribution(mapData);
    
    // Generate goods based on dominant biomes
    biomes.forEach((count, biome) => {
      if (count > 50) { // Dominant biome
        biomeData.primaryGoods.push(...this.getBiomePrimaryGoods(biome, culturalZone));
      } else if (count > 10) { // Secondary biome
        biomeData.secondaryGoods.push(...this.getBiomeSecondaryGoods(biome, culturalZone));
      }
    });
    
    // Add animal products from local fauna
    biomeData.animalProducts = this.getLocalAnimalProducts(biomes, culturalZone);
    
    // Add plant products from local vegetation
    biomeData.plantProducts = this.getLocalPlantProducts(biomes, climate, culturalZone);
    
    // Add mineral products from historical mining data
    biomeData.mineralProducts = this.getLocalMineralProducts(region, culturalZone);
    
    // Determine what needs to be imported
    biomeData.importedGoods = this.getImportedGoods(biomeData, culturalZone);
    
    this.biomeMarketCache.set(cacheKey, biomeData);
    return biomeData;
  }
  
  /**
   * Get biome distribution across the map
   */
  private getBiomeDistribution(mapData: MapData): Map<BiomeType, number> {
    const distribution = new Map<BiomeType, number>();
    
    mapData.tiles.flat().forEach(tile => {
      const current = distribution.get(tile.biome) || 0;
      distribution.set(tile.biome, current + 1);
    });
    
    return distribution;
  }
  
  /**
   * Get primary goods produced by a biome in a cultural context
   */
  private getBiomePrimaryGoods(biome: BiomeType, culturalZone: CulturalZone): string[] {
    const goods: string[] = [];
    
    switch (biome) {
      case BiomeType.FARMLAND:
        // Cultural-specific farming goods
        if (culturalZone === 'EAST_ASIAN') {
          goods.push('POLISHED_RICE', 'SOY_FLOUR', 'GREEN_TEA');
        } else if (culturalZone === 'MENA') {
          goods.push('WHEAT', 'DATES', 'OLIVE_OIL');
        } else if (culturalZone === 'EUROPEAN') {
          goods.push('RYE', 'BARLEY', 'OATS');
        } else if (culturalZone === 'SOUTH_AMERICAN') {
          goods.push('MAIZE', 'QUINOA', 'POTATOES');
        }
        goods.push('FLOUR', 'BREAD', 'CHEESE');
        break;
        
      case BiomeType.FOREST:
      case BiomeType.DENSE_FOREST:
        goods.push('TIMBER', 'STICK', 'MEDICINAL_HERBS', 'MUSHROOM', 'HONEY');
        if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
          goods.push('BIRCH_BARK', 'MAPLE_SYRUP');
        } else if (culturalZone === 'EUROPEAN') {
          goods.push('CHARCOAL', 'TAR');
        }
        break;
        
      case BiomeType.GRASSLAND:
      case BiomeType.STEPPE:
        goods.push('CATTLE_HIDE', 'WOOL', 'CHEESE', 'BUTTER');
        if (culturalZone === 'MENA' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
          goods.push('CAMEL_HAIR', 'GOAT_MILK');
        }
        break;
        
      case BiomeType.MOUNTAIN:
        goods.push('STONE_BLOCK', 'IRON_ORE', 'SILVER_ORE');
        if (culturalZone === 'SOUTH_AMERICAN') {
          goods.push('GOLD_ORE', 'SILVER', 'LLAMA_WOOL');
        }
        break;
        
      case BiomeType.COASTAL_WATERS:
      case BiomeType.RIVER:
        goods.push('FISH', 'SALT', 'SEAWEED');
        if (culturalZone === 'OCEANIA') {
          goods.push('PEARLS', 'CORAL');
        } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
          goods.push('SALMON', 'WHALE_OIL');
        }
        break;
        
      case BiomeType.DESERT:
        goods.push('SALT', 'SPICES');
        if (culturalZone === 'MENA') {
          goods.push('FRANKINCENSE', 'MYRRH', 'DATES');
        } else if (culturalZone === 'SOUTH_AMERICAN') {
          goods.push('QUINOA', 'LLAMA_WOOL');
        }
        break;
        
      case BiomeType.JUNGLE:
        goods.push('EXOTIC_SPICES', 'MEDICINAL_HERBS', 'TROPICAL_FRUITS');
        if (culturalZone === 'SOUTH_AMERICAN') {
          goods.push('RUBBER', 'COCA_LEAVES', 'COCOA_BEANS');
        } else if (culturalZone === 'SOUTH_ASIAN') {
          goods.push('PEPPER', 'CINNAMON', 'CARDAMOM');
        }
        break;
    }
    
    return goods;
  }
  
  /**
   * Get secondary goods (smaller quantities) from biomes
   */
  private getBiomeSecondaryGoods(biome: BiomeType, culturalZone: CulturalZone): string[] {
    // Return subset of primary goods for diversity
    return this.getBiomePrimaryGoods(biome, culturalZone).slice(0, 2);
  }
  
  /**
   * Get animal products available in local biomes
   */
  private getLocalAnimalProducts(biomes: Map<BiomeType, number>, culturalZone: CulturalZone): string[] {
    const products: string[] = [];
    
    // Check which animals can spawn in these biomes and cultural zone
    Object.values(ANIMAL_DATA).forEach(animal => {
      // Check if animal spawns in any of our biomes
      const canSpawn = Array.from(biomes.keys()).some(biome => 
        animal.spawnBiomes.includes(biome)
      );
      
      // Check if animal is appropriate for cultural zone
      const culturallyAppropriate = !animal.spawnConditions.zones || 
        animal.spawnConditions.zones.includes(culturalZone);
      
      if (canSpawn && culturallyAppropriate) {
        // Add animal products
        animal.drops?.forEach(drop => {
          if (!products.includes(drop.name)) {
            products.push(drop.name);
          }
        });
      }
    });
    
    return products;
  }
  
  /**
   * Get plant products from local vegetation
   */
  private getLocalPlantProducts(biomes: Map<BiomeType, number>, climate: ClimateType, culturalZone: CulturalZone): string[] {
    const products: string[] = [];
    
    // Get vegetation species for this climate
    const vegetationData = VEGETATION_SPECIES_DATA.deciduous_tree?.[climate];
    if (!vegetationData) return products;
    
    // Add drops from common and rare species
    [...vegetationData.common || [], ...vegetationData.rare || []].forEach(species => {
      species.drops?.forEach(drop => {
        if (!products.includes(drop.name)) {
          products.push(drop.name);
        }
      });
    });
    
    return products;
  }
  
  /**
   * Get mineral products from historical mining data
   */
  private getLocalMineralProducts(region: string, culturalZone: CulturalZone): string[] {
    const products: string[] = [];
    
    const mineralData = HISTORICAL_MINERALS[region];
    if (!mineralData) return products;
    
    mineralData.forEach(mineral => {
      // Add the mineral itself and its processed forms
      products.push(mineral.metalId + '_ORE');
      
      // Add processed forms if they exist
      if (mineral.metalId === 'IRON') {
        products.push('IRON_INGOT', 'STEEL');
      } else if (mineral.metalId === 'COPPER') {
        products.push('COPPER_INGOT');
      } else if (mineral.metalId === 'GOLD') {
        products.push('GOLD_BAR');
      }
    });
    
    return products;
  }
  
  /**
   * Get cultural specialties for a cultural zone and era
   */
  private getCulturalSpecialties(culturalZone: CulturalZone, era: HistoricalEra, region: string): CulturalSpecialties {
    const cacheKey = `${culturalZone}-${era}-${region}`;
    if (this.culturalSpecialtiesCache.has(cacheKey)) {
      return this.culturalSpecialtiesCache.get(cacheKey)!;
    }
    
    const specialties: CulturalSpecialties = {
      foodSpecialties: [],
      craftSpecialties: [],
      luxurySpecialties: [],
      religiousItems: [],
      militaryItems: [],
      medicinalItems: [],
      tradeSecrets: []
    };
    
    // Get specialties based on cultural zone
    switch (culturalZone) {
      case 'EUROPEAN':
        specialties.foodSpecialties = ['CHEESE_VARIETIES', 'WINE', 'BEER', 'CURED_MEATS'];
        specialties.craftSpecialties = ['WOOL_CLOTH', 'METALWORK', 'GLASSWARE'];
        specialties.luxurySpecialties = ['SILK_IMPORTS', 'SPICE_IMPORTS', 'FURS'];
        specialties.tradeSecrets = ['STEEL_PRODUCTION', 'GUILD_CRAFTS'];
        break;
        
      case 'EAST_ASIAN':
        specialties.foodSpecialties = ['TEA', 'RICE_VARIETIES', 'NOODLES', 'SOY_PRODUCTS'];
        specialties.craftSpecialties = ['PORCELAIN', 'SILK_WEAVING', 'PAPER_MAKING'];
        specialties.luxurySpecialties = ['JADE', 'LACQUERWARE', 'FINE_TEAS'];
        specialties.tradeSecrets = ['SILK_PRODUCTION', 'GUNPOWDER', 'COMPASS'];
        break;
        
      case 'MENA':
        specialties.foodSpecialties = ['SPICES', 'DATES', 'PRESERVED_FOODS'];
        specialties.craftSpecialties = ['CARPETS', 'METALWORK', 'LEATHER_GOODS'];
        specialties.luxurySpecialties = ['PERFUMES', 'PRECIOUS_STONES', 'GOLD_JEWELRY'];
        specialties.tradeSecrets = ['SPICE_TRADE', 'MATHEMATICS', 'ASTRONOMY'];
        break;
        
      case 'SUB_SAHARAN_AFRICAN':
        specialties.foodSpecialties = ['MILLET', 'YAMS', 'PALM_OIL'];
        specialties.craftSpecialties = ['IRONWORK', 'WOOD_CARVING', 'TEXTILE_DYEING'];
        specialties.luxurySpecialties = ['GOLD', 'IVORY', 'EXOTIC_WOODS'];
        specialties.tradeSecrets = ['IRON_SMELTING', 'GOLD_WORKING'];
        break;
        
      case 'SOUTH_AMERICAN':
        specialties.foodSpecialties = ['QUINOA', 'POTATOES', 'COCOA'];
        specialties.craftSpecialties = ['TEXTILES', 'METALWORK', 'POTTERY'];
        specialties.luxurySpecialties = ['GOLD', 'SILVER', 'PRECIOUS_FEATHERS'];
        specialties.tradeSecrets = ['TERRACE_FARMING', 'METAL_ALLOYS'];
        break;
        
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
        specialties.foodSpecialties = ['MAIZE', 'BEANS', 'SQUASH', 'WILD_RICE'];
        specialties.craftSpecialties = ['BEADWORK', 'HIDE_WORKING', 'POTTERY'];
        specialties.luxurySpecialties = ['TURQUOISE', 'SHELLS', 'FURS'];
        specialties.tradeSecrets = ['AGRICULTURE_TECHNIQUES', 'HUNTING_METHODS'];
        break;
    }
    
    // Add era-specific modifications
    if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
      specialties.craftSpecialties.push('FACTORY_GOODS', 'MACHINERY', 'CHEMICALS');
      specialties.militaryItems.push('FIREARMS', 'AMMUNITION', 'MILITARY_EQUIPMENT');
    }
    
    this.culturalSpecialtiesCache.set(cacheKey, specialties);
    return specialties;
  }
  
  /**
   * Analyze what goods NPCs can produce based on their professions
   */
  private analyzeProfessionProduction(npcs: NpcEntity[], culturalZone: CulturalZone, era: HistoricalEra): Map<string, string[]> {
    const production = new Map<string, string[]>();
    
    npcs.forEach(npc => {
      const profession = npc.role?.toLowerCase();
      const goods: string[] = [];
      
      switch (profession) {
        case 'blacksmith':
        case 'smith':
          goods.push('IRON_TOOLS', 'HORSESHOES', 'NAILS', 'WEAPONS');
          break;
        case 'farmer':
        case 'peasant':
          goods.push('GRAIN', 'VEGETABLES', 'MILK', 'EGGS');
          break;
        case 'merchant':
        case 'trader':
          goods.push('EXOTIC_GOODS', 'SPICES', 'LUXURY_ITEMS');
          break;
        case 'weaver':
          goods.push('CLOTH', 'ROPE', 'CLOTHING');
          break;
        case 'potter':
          goods.push('POTTERY', 'CLAY_VESSELS', 'STORAGE_JARS');
          break;
        case 'baker':
          goods.push('BREAD', 'PASTRIES', 'FLOUR');
          break;
        case 'butcher':
          goods.push('MEAT', 'SAUSAGES', 'HIDES');
          break;
        case 'carpenter':
          goods.push('FURNITURE', 'TOOLS', 'BUILDING_MATERIALS');
          break;
        case 'herbalist':
        case 'healer':
          goods.push('MEDICINES', 'POTIONS', 'HERBS');
          break;
      }
      
      if (goods.length > 0) {
        production.set(npc.id, goods);
      }
    });
    
    return production;
  }
  
  /**
   * Generate goods that must be imported from other regions
   */
  private getImportedGoods(biomeData: BiomeMarketData, culturalZone: CulturalZone): string[] {
    const imported: string[] = [];
    
    // Items that are rare or absent in local production
    const essentials = ['SALT', 'IRON', 'SPICES', 'PRECIOUS_METALS'];
    
    essentials.forEach(item => {
      const hasLocal = biomeData.primaryGoods.includes(item) || 
                      biomeData.secondaryGoods.includes(item) ||
                      biomeData.mineralProducts.includes(item);
      
      if (!hasLocal) {
        imported.push(item);
      }
    });
    
    // Cultural zone specific imports
    if (culturalZone === 'EUROPEAN') {
      imported.push('TEA', 'SILK', 'EXOTIC_SPICES', 'PRECIOUS_STONES');
    } else if (culturalZone === 'EAST_ASIAN') {
      imported.push('SILVER', 'WOOL', 'EXOTIC_WOODS');
    }
    
    return imported;
  }
  
  /**
   * Generate biome-based market goods
   */
  private generateBiomeGoods(biomeData: BiomeMarketData, culturalZone: CulturalZone, era: HistoricalEra, origin: 'local' | 'regional'): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    // Add primary goods (abundant, cheap)
    biomeData.primaryGoods.forEach(itemId => {
      if (getItemDefinition(itemId)) {
        goods.push(this.createMarketGood(itemId, culturalZone, era, origin, 'standard', 0.8));
      }
    });
    
    // Add secondary goods (less abundant, normal price)
    biomeData.secondaryGoods.forEach(itemId => {
      if (getItemDefinition(itemId)) {
        goods.push(this.createMarketGood(itemId, culturalZone, era, origin, 'standard', 1.0));
      }
    });
    
    return goods;
  }
  
  /**
   * Generate distant trade goods
   */
  private generateDistantTradeGoods(culturalZone: CulturalZone, era: HistoricalEra): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    // Common distant trade items
    const distantItems = ['SILK', 'SPICES', 'PRECIOUS_METALS', 'FINE_CLOTH', 'WINE', 'STEEL_GOODS'];
    
    // Only generate a few distant goods (20% chance each)
    distantItems.forEach(itemId => {
      if (getItemDefinition(itemId) && Math.random() < 0.2) {
        goods.push(this.createMarketGood(itemId, culturalZone, era, 'distant', 'fine', 1.8));
      }
    });
    
    return goods;
  }

  /**
   * Generate exotic goods  
   */
  private generateExoticGoods(culturalZone: CulturalZone, era: HistoricalEra): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    // Rare exotic items
    const exoticItems = ['GOLD', 'GEMS', 'IVORY', 'RARE_SPICES', 'MAGICAL_ITEMS'];
    
    // Only generate one exotic good (10% chance each)
    exoticItems.forEach(itemId => {
      if (getItemDefinition(itemId) && Math.random() < 0.1) {
        goods.push(this.createMarketGood(itemId, culturalZone, era, 'exotic', 'exceptional', 3.0));
      }
    });
    
    return goods;
  }

  /**
   * Generate cultural specialty goods
   */
  private generateCulturalGoods(specialties: CulturalSpecialties, culturalZone: CulturalZone, era: HistoricalEra): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    // Add craft specialties (higher quality, regional origin)
    specialties.craftSpecialties.forEach(itemId => {
      if (getItemDefinition(itemId)) {
        goods.push(this.createMarketGood(itemId, culturalZone, era, 'regional', 'fine', 1.3));
      }
    });
    
    // Add luxury specialties (exceptional quality, expensive)
    specialties.luxurySpecialties.forEach(itemId => {
      if (getItemDefinition(itemId)) {
        goods.push(this.createMarketGood(itemId, culturalZone, era, 'regional', 'exceptional', 2.0));
      }
    });
    
    return goods;
  }
  
  /**
   * Generate profession-based goods
   */
  private generateProfessionGoods(production: Map<string, string[]>, culturalZone: CulturalZone, era: HistoricalEra): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    production.forEach((itemIds, npcId) => {
      itemIds.forEach(itemId => {
        if (getItemDefinition(itemId)) {
          goods.push(this.createMarketGood(itemId, culturalZone, era, 'local', 'standard', 1.1));
        }
      });
    });
    
    return goods;
  }
  
  /**
   * Generate imported goods from distant regions
   */
  private generateImportedGoods(mapData: MapData, culturalZone: CulturalZone, region: string, era: HistoricalEra): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    // Get trade goods from neighboring regions
    const neighboringAreas = this.getNeighboringAreas(region);
    
    neighboringAreas.forEach(area => {
      // Get specialties from neighboring cultural zones
      const neighborSpecialties = this.getCulturalSpecialties(area.culturalZone as CulturalZone, era, area.name);
      
      // Add some luxury goods from neighbors as expensive imports
      neighborSpecialties.luxurySpecialties.slice(0, 2).forEach(itemId => {
        if (getItemDefinition(itemId)) {
          goods.push(this.createMarketGood(itemId, culturalZone, era, 'distant', 'fine', 2.5));
        }
      });
    });
    
    return goods;
  }
  
  /**
   * Generate religious goods from holy sites
   */
  private generateReligiousGoods(holySites: TerrainStructure[], culturalZone: CulturalZone, era: HistoricalEra): CulturalMarketGood[] {
    const goods: CulturalMarketGood[] = [];
    
    holySites.forEach(site => {
      const religion = site.religion || 'default';
      const religiousEconomy = getReligiousEconomy(religion, era);
      
      // Add items produced by religious sites
      religiousEconomy.produces.forEach(item => {
        if (getItemDefinition(item.toUpperCase())) {
          goods.push(this.createMarketGood(item.toUpperCase(), culturalZone, era, 'local', 'fine', 1.2, 'religious'));
        }
      });
      
      // Add some treasury items as rare luxury goods
      religiousEconomy.treasuryItems.slice(0, 2).forEach(item => {
        if (getItemDefinition(item.toUpperCase())) {
          goods.push(this.createMarketGood(item.toUpperCase(), culturalZone, era, 'local', 'exceptional', 3.0, 'religious'));
        }
      });
    });
    
    return goods;
  }
  
  /**
   * Format item names properly (CLOTH -> Cloth, SOUTH_AMERICAN -> South American)
   */
  private formatItemName(name: string): string {
    // First handle cultural zone names (SOUTH_AMERICAN -> South American)
    const formatted = name.replace(/_/g, ' ');
    
    // Capitalize each word properly
    return formatted.split(' ').map(word => {
      // Keep certain acronyms uppercase
      if (['USA', 'UK', 'EU', 'NATO', 'UN'].includes(word)) {
        return word;
      }
      // Otherwise proper case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  /**
   * Create a market good with cultural context
   */
  private createMarketGood(
    itemId: string, 
    culturalZone: CulturalZone, 
    era: HistoricalEra, 
    origin: 'local' | 'regional' | 'distant' | 'exotic',
    quality: 'poor' | 'standard' | 'fine' | 'exceptional' | 'masterwork',
    priceModifier: number,
    category?: string
  ): CulturalMarketGood {
    const definition = getItemDefinition(itemId);
    const basePrice = definition.value || 10;
    const currentPrice = Math.round(basePrice * priceModifier);
    
    // Format the name properly
    const formattedName = this.formatItemName(definition.name);
    
    return {
      itemId,
      name: formattedName,
      culturalName: this.getCulturalName(itemId, culturalZone),
      basePrice,
      currentPrice,
      quantity: this.calculateQuantity(origin, quality),
      quality,
      origin,
      category: (category as any) || definition.category || 'manufactured',
      culturalSignificance: this.getCulturalSignificance(itemId, culturalZone),
      seasonalModifier: this.getSeasonalModifier(itemId, era),
      productionChain: this.getProductionChain(itemId)
    };
  }
  
  /**
   * Get cultural name for an item
   */
  private getCulturalName(itemId: string, culturalZone: CulturalZone): string | undefined {
    // Add culture-specific names for common items
    const culturalNames: Record<string, Record<string, string>> = {
      'TEA': {
        'EAST_ASIAN': 'Cha',
        'MENA': 'Shai',
        'EUROPEAN': 'Tea'
      },
      'BREAD': {
        'EUROPEAN': 'Bread',
        'MENA': 'Khubz',
        'EAST_ASIAN': 'Bread'
      }
    };
    
    return culturalNames[itemId]?.[culturalZone];
  }
  
  /**
   * Get cultural significance explanation
   */
  private getCulturalSignificance(itemId: string, culturalZone: CulturalZone): string | undefined {
    const significance: Record<string, Record<string, string>> = {
      'TEA': {
        'EAST_ASIAN': 'Central to social ceremonies and daily life',
        'EUROPEAN': 'Exotic luxury import from the East'
      },
      'SILK': {
        'EAST_ASIAN': 'Ancient trade secret and symbol of refinement',
        'EUROPEAN': 'Precious import reserved for nobility'
      }
    };
    
    return significance[itemId]?.[culturalZone];
  }
  
  /**
   * Calculate quantity based on origin and quality
   */
  private calculateQuantity(origin: 'local' | 'regional' | 'distant' | 'exotic', quality: string): number {
    let baseQuantity = 10;
    
    // Origin affects quantity with some randomness
    switch (origin) {
      case 'local': baseQuantity = Math.round(12 + Math.random() * 6); break; // 12-18
      case 'regional': baseQuantity = Math.round(5 + Math.random() * 6); break; // 5-11  
      case 'distant': baseQuantity = Math.round(1 + Math.random() * 4); break; // 1-5
      case 'exotic': baseQuantity = 1; break; // Always rare
    }
    
    // Quality affects quantity (inverse relationship)
    switch (quality) {
      case 'poor': return Math.round(baseQuantity * 1.5);
      case 'standard': return baseQuantity;
      case 'fine': return Math.round(baseQuantity * 0.7);
      case 'exceptional': return Math.round(baseQuantity * 0.3);
      case 'masterwork': return 1;
    }
    
    return baseQuantity;
  }
  
  /**
   * Get seasonal price modifier
   */
  private getSeasonalModifier(itemId: string, era: HistoricalEra): number | undefined {
    // Food items have seasonal variations
    if (itemId.includes('GRAIN') || itemId.includes('FRUIT')) {
      return 0.8 + Math.random() * 0.4; // 0.8 to 1.2 modifier
    }
    
    return undefined;
  }
  
  /**
   * Get production chain for an item
   */
  private getProductionChain(itemId: string): string[] | undefined {
    const chains: Record<string, string[]> = {
      'BREAD': ['WHEAT', 'FLOUR'],
      'STEEL': ['IRON_ORE', 'COAL'],
      'CHEESE': ['MILK'],
      'WINE': ['GRAPES'],
      'CLOTH': ['WOOL', 'COTTON']
    };
    
    return chains[itemId];
  }
  
  /**
   * Apply cultural pricing and availability modifiers
   */
  private applyCulturalModifiers(good: CulturalMarketGood, culturalZone: CulturalZone, era: HistoricalEra, climate: ClimateType): CulturalMarketGood {
    let priceModifier = 1.0;
    let quantityModifier = 1.0;
    
    // Era-specific modifiers
    if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
      if (good.category === 'manufactured') {
        priceModifier *= 0.8; // Mass production reduces prices
        quantityModifier *= 2.0; // More available
      }
    }
    
    // Climate affects certain goods
    if (climate === ClimateType.COLD && good.itemId.includes('SPICE')) {
      priceModifier *= 1.5; // Spices more expensive in cold climates
    }
    
    // Apply modifiers
    good.currentPrice = Math.round(good.currentPrice * priceModifier);
    good.quantity = Math.round(good.quantity * quantityModifier);
    
    return good;
  }
  
  /**
   * Get neighboring areas for trade
   */
  private getNeighboringAreas(region: string): Array<{name: string, culturalZone: string}> {
    const neighbors: Array<{name: string, culturalZone: string}> = [];
    
    // Use geographical data to find neighboring regions
    Object.entries(GEOGRAPHICAL_DATA).forEach(([zoneName, zoneData]) => {
      Object.entries(zoneData).forEach(([regionName, regionAreas]) => {
        Object.keys(regionAreas).forEach(areaName => {
          if (areaName !== region) {
            neighbors.push({name: areaName, culturalZone: zoneName});
          }
        });
      });
    });
    
    return neighbors.slice(0, 3); // Limit to 3 neighbors
  }
}

export const culturalMarketplaceService = new CulturalMarketplaceService();