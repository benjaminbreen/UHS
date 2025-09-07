/**
 * services/marketplaceInfoService.ts - Helper for displaying cultural marketplace information
 * This service provides user-friendly descriptions of the cultural marketplace system
 */

import { CulturalZone, HistoricalEra, BiomeType, ClimateType } from '../types';

export interface MarketplaceInfo {
  title: string;
  description: string;
  culturalHighlights: string[];
  biomeSpecialties: string[];
  historicalContext: string;
  tradeNetworks: string[];
}

export class MarketplaceInfoService {
  
  /**
   * Generate informative description about the current marketplace
   */
  getMarketplaceInfo(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    region: string,
    climate: ClimateType,
    dominantBiomes: BiomeType[]
  ): MarketplaceInfo {
    
    const info: MarketplaceInfo = {
      title: this.getMarketplaceTitle(culturalZone, era),
      description: this.getMarketplaceDescription(culturalZone, era, region),
      culturalHighlights: this.getCulturalHighlights(culturalZone, era),
      biomeSpecialties: this.getBiomeSpecialties(dominantBiomes, culturalZone),
      historicalContext: this.getHistoricalContext(era, culturalZone, region),
      tradeNetworks: this.getTradeNetworks(culturalZone, era, region)
    };
    
    return info;
  }
  
  private getMarketplaceTitle(culturalZone: CulturalZone, era: HistoricalEra): string {
    const cultureNames: Record<CulturalZone, string> = {
      'EUROPEAN': 'European',
      'EAST_ASIAN': 'East Asian',
      'MENA': 'Middle Eastern',
      'SUB_SAHARAN_AFRICAN': 'African',
      'SOUTH_AMERICAN': 'South American',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'North American',
      'SOUTH_ASIAN': 'South Asian',
      'OCEANIA': 'Oceanic',
      'NORTH_AMERICAN_COLONIAL': 'Colonial American'
    };
    
    const eraNames: Record<HistoricalEra, string> = {
      [HistoricalEra.PREHISTORY]: 'Prehistoric',
      [HistoricalEra.ANTIQUITY]: 'Ancient',
      [HistoricalEra.MEDIEVAL]: 'Medieval',
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Renaissance',
      [HistoricalEra.INDUSTRIAL_ERA]: 'Industrial',
      [HistoricalEra.MODERN_ERA]: 'Modern',
      [HistoricalEra.FUTURE_ERA]: 'Futuristic'
    };
    
    return `${eraNames[era]} ${cultureNames[culturalZone]} Marketplace`;
  }
  
  private getMarketplaceDescription(culturalZone: CulturalZone, era: HistoricalEra, region: string): string {
    const descriptions: Partial<Record<CulturalZone, string>> = {
      'EUROPEAN': 'A bustling marketplace where guild craftsmen, traveling merchants, and local farmers gather to trade their wares.',
      'EAST_ASIAN': 'An organized market square where silk merchants, tea traders, and skilled artisans display their refined goods.',
      'MENA': 'A vibrant bazaar filled with spice merchants, carpet weavers, and traders from distant lands.',
      'SUB_SAHARAN_AFRICAN': 'A lively trading post where gold traders, ivory merchants, and skilled metalworkers conduct business.',
      'SOUTH_AMERICAN': 'A mountain marketplace where precious metals, exotic textiles, and highland crops exchange hands.',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'A seasonal gathering place for hunters, gatherers, and traders to exchange goods across vast territories.',
      'SOUTH_ASIAN': 'A colorful market where spice merchants, textile dealers, and craftsmen offer goods from across the subcontinent.',
      'OCEANIA': 'A coastal trading hub where seafarers, pearl divers, and island craftsmen meet to exchange maritime goods.'
    };
    
    return descriptions[culturalZone] || 'A marketplace where local traders gather to exchange goods and share news.';
  }
  
  private getCulturalHighlights(culturalZone: CulturalZone, era: HistoricalEra): string[] {
    const highlights: Partial<Record<CulturalZone, string[]>> = {
      'EUROPEAN': [
        'Guild-crafted metalwork and textiles',
        'Monastery-produced manuscripts and medicines',
        'Imported spices and luxury goods from the East',
        'Local agricultural products and preserved foods'
      ],
      'EAST_ASIAN': [
        'Exquisite silk fabrics and porcelain',
        'Premium teas and exotic delicacies',
        'Paper goods and scholarly texts',
        'Lacquerware and jade ornaments'
      ],
      'MENA': [
        'Aromatic spices and precious frankincense',
        'Hand-woven carpets and textiles',
        'Mathematical instruments and astronomy tools',
        'Gold jewelry and precious stones'
      ],
      'SUB_SAHARAN_AFRICAN': [
        'Expertly worked iron and bronze goods',
        'Gold dust and precious ivory',
        'Vibrant textiles and natural dyes',
        'Traditional medicines and herbs'
      ],
      'SOUTH_AMERICAN': [
        'Silver and gold from mountain mines',
        'Alpaca wool and fine textiles',
        'Quinoa, potatoes, and highland crops',
        'Precious feathers and ceremonial items'
      ],
      'NORTH_AMERICAN_PRE_COLUMBIAN': [
        'Buffalo hides and fur pelts',
        'Obsidian tools and arrowheads',
        'Turquoise and shell ornaments',
        'Corn, beans, and wild rice'
      ]
    };
    
    return highlights[culturalZone] || [
      'Local crafted goods',
      'Regional specialties',
      'Trading commodities',
      'Essential supplies'
    ];
  }
  
  private getBiomeSpecialties(biomes: BiomeType[], culturalZone: CulturalZone): string[] {
    const specialties: string[] = [];
    
    biomes.forEach(biome => {
      switch (biome) {
        case BiomeType.FARMLAND:
          specialties.push('Fresh grains, dairy products, and seasonal vegetables');
          break;
        case BiomeType.FOREST:
        case BiomeType.DENSE_FOREST:
          specialties.push('Timber, medicinal herbs, honey, and forest game');
          break;
        case BiomeType.MOUNTAIN:
          specialties.push('Metal ores, precious stones, and mountain crafts');
          break;
        case BiomeType.COASTAL_WATERS:
        case BiomeType.RIVER:
          specialties.push('Fresh fish, salt, and marine goods');
          break;
        case BiomeType.GRASSLAND:
        case BiomeType.STEPPE:
          specialties.push('Livestock products, wool, and pastoral goods');
          break;
        case BiomeType.DESERT:
          specialties.push('Salt, preserved foods, and hardy textiles');
          break;
        case BiomeType.JUNGLE:
          specialties.push('Exotic spices, tropical medicines, and rare woods');
          break;
      }
    });
    
    return specialties.length > 0 ? specialties : ['Local regional products'];
  }
  
  private getHistoricalContext(era: HistoricalEra, culturalZone: CulturalZone, region: string): string {
    const contexts: Partial<Record<HistoricalEra, string>> = {
      [HistoricalEra.ANTIQUITY]: 'Trade routes connect distant civilizations, bringing exotic goods and new technologies.',
      [HistoricalEra.MEDIEVAL]: 'Guild systems regulate craftsmanship while long-distance trade expands cultural exchange.',
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Global exploration opens new markets and introduces revolutionary goods.',
      [HistoricalEra.INDUSTRIAL_ERA]: 'Mechanization transforms production, making manufactured goods more accessible.',
      [HistoricalEra.MODERN_ERA]: 'Mass production and global supply chains create unprecedented variety and availability.'
    };
    
    return contexts[era] || 'Local and regional trade networks facilitate the exchange of essential goods.';
  }
  
  private getTradeNetworks(culturalZone: CulturalZone, era: HistoricalEra, region: string): string[] {
    const networks: Partial<Record<CulturalZone, string[]>> = {
      'EUROPEAN': [
        'Mediterranean trade routes',
        'Baltic Sea commerce',
        'Hanseatic League connections',
        'Overland routes to Asia'
      ],
      'EAST_ASIAN': [
        'Silk Road connections',
        'Maritime spice routes',
        'Tributary trading systems',
        'Coastal merchant networks'
      ],
      'MENA': [
        'Trans-Saharan caravan routes',
        'Red Sea and Persian Gulf trade',
        'Central Asian connections',
        'Indian Ocean networks'
      ],
      'SOUTH_AMERICAN': [
        'Highland-lowland trade routes',
        'Pacific coastal networks',
        'Amazon river commerce',
        'Inter-mountain passages'
      ]
    };
    
    return networks[culturalZone] || [
      'Local trading networks',
      'Regional merchant routes',
      'Seasonal trading paths'
    ];
  }
}

export const marketplaceInfoService = new MarketplaceInfoService();