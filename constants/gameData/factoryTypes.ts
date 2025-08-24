/**
 * Factory Types Configuration
 * Defines historically accurate pre-industrial and industrial production facilities
 * Only appears in RENAISSANCE_EARLY_MODERN era and later
 */

import { HistoricalEra, CulturalZone } from '../../types';

export interface FactoryType {
  id: string;
  name: string;
  description: string;
  icon: string; // Will be replaced with custom SVG
  npcAnchor: string;
  minEra: HistoricalEra;
  allowedZones: CulturalZone[];
  allowedRegions?: string[]; // Specific regions where this type appears
  inputGoods: string[];
  outputGoods: string[];
  // For custom SVG generation
  symbolType: 'plantation' | 'warehouse' | 'manufactory' | 'mill' | 'refinery' | 'factory19th' | 'factory20th';
  
  // Economic integration
  workersNeeded: number; // How many NPCs work here
  wageLevel: 'subsistence' | 'low' | 'medium' | 'high'; // Affects NPC wealth
  productionRate: number; // Units produced per day
  economicImpact: number; // 1-10, how much it affects local economy
  
  // Working conditions (affects NPC health/happiness)
  workingConditions: {
    hoursPerDay: number;
    dangerLevel: number; // 0-1, chance of injury
    childLabor: boolean;
    skillRequired: 'none' | 'basic' | 'skilled' | 'master';
  };
  
  // Supply chain
  requiresNearby?: string[]; // Other structures needed nearby (e.g., 'port', 'railroad')
  createsMarket?: string[]; // What goods become available in local markets
  
  // Cultural/social impact
  socialEffects?: {
    urbanization: number; // 0-1, how much it promotes city growth
    inequality: number; // 0-1, wealth gap it creates
    pollution: number; // 0-1, environmental impact
    culturalShift: string; // e.g., 'traditional_to_modern', 'rural_to_urban'
  };
}

export const FACTORY_TYPES: Record<string, FactoryType> = {
  // Early Modern (1450-1800)
  sugar_plantation: {
    id: 'sugar_plantation',
    name: 'Sugar Plantation',
    description: 'Large agricultural estate producing sugar cane',
    icon: '🌾', // Temporary
    npcAnchor: 'plantation_worker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN'] as CulturalZone[],
    allowedRegions: ['Greater Antilles', 'Lesser Antilles', 'Brazil', 'Louisiana', 'Guyana Coast'],
    inputGoods: ['LABOR', 'TOOLS'],
    outputGoods: ['SUGAR_CANE', 'MOLASSES'],
    symbolType: 'plantation',
    workersNeeded: 150, // Large enslaved workforce
    wageLevel: 'subsistence',
    productionRate: 100,
    economicImpact: 9,
    workingConditions: {
      hoursPerDay: 14,
      dangerLevel: 0.4, // High injury rate from cane cutting
      childLabor: true,
      skillRequired: 'none'
    },
    requiresNearby: ['port'],
    createsMarket: ['RUM', 'SUGAR_REFINED'],
    socialEffects: {
      urbanization: 0.2,
      inequality: 0.95, // Extreme inequality
      pollution: 0.3,
      culturalShift: 'enslaved_society'
    }
  },
  
  coffee_plantation: {
    id: 'coffee_plantation',
    name: 'Coffee Plantation',
    description: 'Highland estate cultivating coffee',
    icon: '☕', // Temporary
    npcAnchor: 'plantation_worker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN', 'MENA'] as CulturalZone[],
    allowedRegions: ['Brazil', 'Colombia', 'Ethiopia', 'Yemen', 'Java'],
    inputGoods: ['LABOR', 'TOOLS'],
    outputGoods: ['COFFEE_BEANS'],
    symbolType: 'plantation'
  },
  
  tobacco_plantation: {
    id: 'tobacco_plantation',
    name: 'Tobacco Plantation',
    description: 'Estate specializing in tobacco cultivation',
    icon: '🚬', // Temporary
    npcAnchor: 'plantation_worker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['NORTH_AMERICAN_COLONIAL'] as CulturalZone[],
    allowedRegions: ['Virginia', 'Carolinas', 'Maryland', 'Cuba'],
    inputGoods: ['LABOR', 'TOOLS'],
    outputGoods: ['TOBACCO'],
    symbolType: 'plantation'
  },
  
  cotton_plantation: {
    id: 'cotton_plantation',
    name: 'Cotton Plantation',
    description: 'Large estate producing cotton fiber',
    icon: '🌿', // Temporary
    npcAnchor: 'plantation_worker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['NORTH_AMERICAN_COLONIAL', 'SOUTH_ASIAN'] as CulturalZone[],
    allowedRegions: ['Deep South', 'Georgia', 'Alabama', 'Mississippi', 'Gujarat', 'Bengal'],
    inputGoods: ['LABOR', 'TOOLS'],
    outputGoods: ['COTTON'],
    symbolType: 'plantation'
  },
  
  hacienda: {
    id: 'hacienda',
    name: 'Hacienda',
    description: 'Spanish colonial estate with mixed production',
    icon: '🏘️', // Temporary
    npcAnchor: 'hacienda_worker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['SOUTH_AMERICAN', 'NORTH_AMERICAN_COLONIAL'] as CulturalZone[],
    allowedRegions: ['Mexico', 'Peru', 'Argentina', 'Chile', 'Venezuela'],
    inputGoods: ['LABOR', 'LIVESTOCK'],
    outputGoods: ['GRAIN', 'LEATHER', 'WOOL'],
    symbolType: 'plantation'
  },
  
  spice_warehouse: {
    id: 'spice_warehouse',
    name: 'Spice Warehouse',
    description: 'Trading company warehouse for spice storage',
    icon: '🌶️', // Temporary
    npcAnchor: 'warehouse_keeper',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['SOUTH_ASIAN', 'EAST_ASIAN', 'EUROPEAN'] as CulturalZone[],
    allowedRegions: ['Malabar Coast', 'Ceylon', 'Moluccas', 'Java', 'Amsterdam', 'Lisbon'],
    inputGoods: ['SPICES_RAW'],
    outputGoods: ['SPICES_PROCESSED', 'SPICES_PACKAGED'],
    symbolType: 'warehouse'
  },
  
  voc_warehouse: {
    id: 'voc_warehouse',
    name: 'Company Warehouse',
    description: 'Dutch East India Company trading warehouse',
    icon: '📦', // Temporary
    npcAnchor: 'company_agent',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['EAST_ASIAN', 'SOUTH_ASIAN', 'EUROPEAN'] as CulturalZone[],
    allowedRegions: ['Batavia', 'Ceylon', 'Malacca', 'Amsterdam', 'Cape Colony'],
    inputGoods: ['SPICES', 'TEA', 'SILK', 'PORCELAIN'],
    outputGoods: ['TRADE_GOODS'],
    symbolType: 'warehouse'
  },
  
  silk_workshop: {
    id: 'silk_workshop',
    name: 'Silk Workshop',
    description: 'Artisan workshop producing silk textiles',
    icon: '🕷️', // Temporary
    npcAnchor: 'silk_weaver',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['EAST_ASIAN', 'MENA', 'EUROPEAN'] as CulturalZone[],
    allowedRegions: ['China', 'Japan', 'Persia', 'Ottoman Empire', 'Lyon', 'Venice'],
    inputGoods: ['SILK_RAW', 'DYES'],
    outputGoods: ['SILK_CLOTH', 'SILK_GARMENTS'],
    symbolType: 'manufactory'
  },
  
  porcelain_workshop: {
    id: 'porcelain_workshop',
    name: 'Porcelain Manufactory',
    description: 'Workshop producing fine porcelain',
    icon: '🏺', // Temporary
    npcAnchor: 'porcelain_maker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['EAST_ASIAN', 'EUROPEAN'] as CulturalZone[],
    allowedRegions: ['Jingdezhen', 'Japan', 'Meissen', 'Sevres'],
    inputGoods: ['KAOLIN', 'GLAZES'],
    outputGoods: ['PORCELAIN'],
    symbolType: 'manufactory'
  },
  
  sugar_refinery: {
    id: 'sugar_refinery',
    name: 'Sugar Refinery',
    description: 'Facility refining raw sugar into white sugar',
    icon: '🍬', // Temporary
    npcAnchor: 'refinery_worker',
    minEra: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
    allowedZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'] as CulturalZone[],
    allowedRegions: ['London', 'Amsterdam', 'Bordeaux', 'Boston', 'Philadelphia'],
    inputGoods: ['SUGAR_RAW', 'COAL'],
    outputGoods: ['SUGAR_REFINED', 'RUM'],
    symbolType: 'refinery'
  },
  
  // Industrial Era (1800-1920)
  textile_mill: {
    id: 'textile_mill',
    name: 'Textile Mill',
    description: 'Steam-powered cotton mill',
    icon: '🏭', // Temporary
    npcAnchor: 'mill_worker',
    minEra: 'INDUSTRIAL_ERA' as HistoricalEra,
    allowedZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'EAST_ASIAN'] as CulturalZone[],
    allowedRegions: ['Manchester', 'Lancashire', 'New England', 'Osaka', 'Mumbai'],
    inputGoods: ['COTTON', 'COAL', 'WATER_POWER'],
    outputGoods: ['TEXTILES', 'THREAD'],
    symbolType: 'factory19th',
    workersNeeded: 500, // Large workforce, mostly women and children
    wageLevel: 'low',
    productionRate: 200,
    economicImpact: 8,
    workingConditions: {
      hoursPerDay: 12,
      dangerLevel: 0.3, // Machinery accidents
      childLabor: true,
      skillRequired: 'basic'
    },
    requiresNearby: ['railroad', 'canal'],
    createsMarket: ['CLOTHING', 'FABRIC'],
    socialEffects: {
      urbanization: 0.8,
      inequality: 0.7,
      pollution: 0.7,
      culturalShift: 'industrial_revolution'
    }
  },
  
  steel_mill: {
    id: 'steel_mill',
    name: 'Steel Mill',
    description: 'Industrial facility producing steel',
    icon: '🏗️', // Temporary
    npcAnchor: 'steel_worker',
    minEra: 'INDUSTRIAL_ERA' as HistoricalEra,
    allowedZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'EAST_ASIAN'] as CulturalZone[],
    allowedRegions: ['Ruhr Valley', 'Pittsburgh', 'Birmingham', 'Sheffield', 'Yawata'],
    inputGoods: ['IRON_ORE', 'COAL', 'LIMESTONE'],
    outputGoods: ['STEEL', 'STEEL_BEAMS'],
    symbolType: 'factory19th'
  },
  
  railway_workshop: {
    id: 'railway_workshop',
    name: 'Railway Workshop',
    description: 'Factory producing locomotives and rail equipment',
    icon: '🚂', // Temporary
    npcAnchor: 'railway_engineer',
    minEra: 'INDUSTRIAL_ERA' as HistoricalEra,
    allowedZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'] as CulturalZone[],
    allowedRegions: ['Newcastle', 'Berlin', 'Philadelphia', 'Chicago'],
    inputGoods: ['STEEL', 'COAL', 'BRASS'],
    outputGoods: ['LOCOMOTIVES', 'RAIL_CARS'],
    symbolType: 'factory19th'
  },
  
  // Modern Era (1920+)
  automobile_factory: {
    id: 'automobile_factory',
    name: 'Automobile Factory',
    description: 'Assembly line producing automobiles',
    icon: '🚗', // Temporary
    npcAnchor: 'assembly_worker',
    minEra: 'MODERN_ERA' as HistoricalEra,
    allowedZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'EAST_ASIAN'] as CulturalZone[],
    allowedRegions: ['Detroit', 'Turin', 'Stuttgart', 'Toyota City', 'Seoul'],
    inputGoods: ['STEEL', 'RUBBER', 'GLASS', 'ELECTRONICS'],
    outputGoods: ['AUTOMOBILES'],
    symbolType: 'factory20th'
  },
  
  electronics_factory: {
    id: 'electronics_factory',
    name: 'Electronics Factory',
    description: 'Facility producing electronic components',
    icon: '📱', // Temporary
    npcAnchor: 'electronics_worker',
    minEra: 'MODERN_ERA' as HistoricalEra,
    allowedZones: ['EAST_ASIAN', 'NORTH_AMERICAN_COLONIAL'] as CulturalZone[],
    allowedRegions: ['Silicon Valley', 'Shenzhen', 'Taiwan', 'Seoul', 'Tokyo'],
    inputGoods: ['SILICON', 'RARE_EARTH', 'COPPER'],
    outputGoods: ['SEMICONDUCTORS', 'CIRCUIT_BOARDS'],
    symbolType: 'factory20th'
  }
};

/**
 * Get appropriate factory type for a given era, zone, and region
 */
export function getFactoryType(
  era: HistoricalEra, 
  zone: CulturalZone, 
  region: string
): FactoryType | null {
  // No factories before Renaissance
  if (era === 'PREHISTORY' || era === 'ANTIQUITY' || era === 'MEDIEVAL') {
    return null;
  }
  
  // Find all valid factory types for this era/zone/region
  const validTypes = Object.values(FACTORY_TYPES).filter(factory => {
    // Check era
    const eraOrder = ['PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'];
    const currentEraIndex = eraOrder.indexOf(era);
    const minEraIndex = eraOrder.indexOf(factory.minEra);
    
    if (currentEraIndex < minEraIndex) return false;
    
    // Check zone
    if (!factory.allowedZones.includes(zone)) return false;
    
    // Region is now optional - if specified, it gives priority but doesn't exclude
    // This allows factories to spawn anywhere in the appropriate zone/era
    return true;
  });
  
  // If we have region-specific factories, prioritize them
  const regionSpecific = validTypes.filter(f => 
    f.allowedRegions && f.allowedRegions.includes(region)
  );
  
  // Use region-specific if available, otherwise use any valid type
  const finalTypes = regionSpecific.length > 0 ? regionSpecific : validTypes;
  
  // Return random valid type or null
  return finalTypes.length > 0 ? finalTypes[Math.floor(Math.random() * finalTypes.length)] : null;
}