/**
 * Historical Context Engine
 * Ensures historical accuracy in quest generation
 */

import { CulturalZone, HistoricalEra } from '../types/characterData';

export interface HistoricalContext {
  zone: string;
  era: string;
  year: number;
  summary: string;
  questContext: string;
  availableResources: string[];
  commonProfessions: string[];
  socialStructure: string[];
  conflicts: string[];
  technology: string[];
  inappropriateElements: string[]; // Things that shouldn't appear
  culturalTaboos: string[];
  tradeGoods: string[];
  currency: string;
  politicalSystem: string;
  religiousContext: string;
}

interface EraData {
  dateRange: [number, number];
  summary: string;
  technology: string[];
  conflicts: string[];
  inappropriateElements: string[];
}

interface ZoneData {
  resources: string[];
  professions: string[];
  socialStructure: string[];
  culturalTaboos: string[];
  tradeGoods: string[];
  currency: string;
  politicalSystems: Record<string, string>;
  religiousContext: Record<string, string>;
}

class HistoricalContextEngine {
  private eraData: Record<string, EraData> = {
    'ANTIQUITY': {
      dateRange: [-3000, 500],
      summary: 'Ancient civilizations flourish with bronze and iron technology',
      technology: ['bronze weapons', 'iron tools', 'writing', 'wheel', 'sailing ships'],
      conflicts: ['tribal raids', 'city-state wars', 'empire expansion'],
      inappropriateElements: ['gunpowder', 'printing press', 'compass', 'firearms', 'steam power']
    },
    'MEDIEVAL': {
      dateRange: [500, 1450],
      summary: 'Feudal societies dominated by nobility and religious institutions',
      technology: ['steel weapons', 'windmills', 'heavy plows', 'castle fortifications', 'crossbows'],
      conflicts: ['crusades', 'feudal wars', 'viking raids', 'mongol invasions'],
      inappropriateElements: ['firearms', 'printing press', 'new world crops', 'steam power']
    },
    'RENAISSANCE_EARLY_MODERN': {
      dateRange: [1450, 1750],
      summary: 'Age of exploration and scientific revolution',
      technology: ['early firearms', 'printing press', 'navigation tools', 'telescopes', 'clocks'],
      conflicts: ['religious wars', 'colonial expansion', 'dynastic wars'],
      inappropriateElements: ['steam engines', 'electricity', 'railroads', 'telegraphs']
    },
    'INDUSTRIAL': {
      dateRange: [1750, 1900],
      summary: 'Industrial revolution transforms society',
      technology: ['steam power', 'factories', 'railroads', 'telegraphs', 'early photography'],
      conflicts: ['napoleonic wars', 'colonial wars', 'civil wars', 'labor strikes'],
      inappropriateElements: ['computers', 'aircraft', 'radio', 'automobiles', 'antibiotics']
    },
    'MODERN': {
      dateRange: [1900, 2100],
      summary: 'Technological advancement and globalization',
      technology: ['electricity', 'automobiles', 'aircraft', 'computers', 'internet'],
      conflicts: ['world wars', 'cold war', 'terrorism', 'cyber warfare'],
      inappropriateElements: ['magic', 'medieval weapons as primary arms']
    }
  };

  private zoneData: Record<string, ZoneData> = {
    'EUROPEAN': {
      resources: ['wheat', 'barley', 'iron', 'timber', 'wool'],
      professions: ['blacksmith', 'farmer', 'merchant', 'priest', 'soldier'],
      socialStructure: ['nobility', 'clergy', 'merchants', 'artisans', 'peasants'],
      culturalTaboos: ['blasphemy', 'witchcraft', 'heresy'],
      tradeGoods: ['wool', 'wine', 'salt', 'furs', 'amber'],
      currency: 'coins (gold, silver, copper)',
      politicalSystems: {
        'ANTIQUITY': 'city-states and empires',
        'MEDIEVAL': 'feudal kingdoms',
        'RENAISSANCE_EARLY_MODERN': 'absolutist monarchies',
        'INDUSTRIAL': 'constitutional monarchies and republics',
        'MODERN': 'democracies and republics'
      },
      religiousContext: {
        'ANTIQUITY': 'polytheistic religions',
        'MEDIEVAL': 'Christian dominance',
        'RENAISSANCE_EARLY_MODERN': 'Christian with reformation conflicts',
        'INDUSTRIAL': 'Christian with growing secularism',
        'MODERN': 'secular with diverse beliefs'
      }
    },
    'MENA': {
      resources: ['dates', 'olives', 'copper', 'gold', 'incense'],
      professions: ['merchant', 'scholar', 'craftsman', 'nomad', 'soldier'],
      socialStructure: ['rulers', 'scholars', 'merchants', 'artisans', 'farmers'],
      culturalTaboos: ['idol worship', 'usury', 'dishonoring guests'],
      tradeGoods: ['spices', 'silk', 'carpets', 'perfumes', 'gems'],
      currency: 'dinars and dirhams',
      politicalSystems: {
        'ANTIQUITY': 'kingdoms and empires',
        'MEDIEVAL': 'caliphates and emirates',
        'RENAISSANCE_EARLY_MODERN': 'ottoman empire and local dynasties',
        'INDUSTRIAL': 'ottoman control and European influence',
        'MODERN': 'nation states and monarchies'
      },
      religiousContext: {
        'ANTIQUITY': 'various polytheistic and monotheistic',
        'MEDIEVAL': 'Islamic golden age',
        'RENAISSANCE_EARLY_MODERN': 'Islamic with minority communities',
        'INDUSTRIAL': 'Islamic with modernization tensions',
        'MODERN': 'Islamic with diverse interpretations'
      }
    },
    'EAST_ASIAN': {
      resources: ['rice', 'silk', 'tea', 'porcelain', 'jade'],
      professions: ['scholar', 'farmer', 'artisan', 'merchant', 'official'],
      socialStructure: ['emperor', 'officials', 'scholars', 'farmers', 'merchants'],
      culturalTaboos: ['disrespecting ancestors', 'disrupting harmony', 'losing face'],
      tradeGoods: ['silk', 'tea', 'porcelain', 'lacquerware', 'paper'],
      currency: 'copper coins and silver taels',
      politicalSystems: {
        'ANTIQUITY': 'dynasties and kingdoms',
        'MEDIEVAL': 'imperial dynasties',
        'RENAISSANCE_EARLY_MODERN': 'ming and qing dynasties',
        'INDUSTRIAL': 'declining empires and modernization',
        'MODERN': 'republics and communist states'
      },
      religiousContext: {
        'ANTIQUITY': 'ancestor worship and early philosophies',
        'MEDIEVAL': 'buddhism, taoism, confucianism',
        'RENAISSANCE_EARLY_MODERN': 'syncretic practices',
        'INDUSTRIAL': 'traditional with western influence',
        'MODERN': 'secular with traditional elements'
      }
    },
    'SOUTH_ASIAN': {
      resources: ['rice', 'cotton', 'spices', 'gems', 'textiles'],
      professions: ['priest', 'warrior', 'merchant', 'farmer', 'artisan'],
      socialStructure: ['brahmins', 'kshatriyas', 'vaishyas', 'shudras'],
      culturalTaboos: ['eating beef', 'caste violations', 'ritual impurity'],
      tradeGoods: ['spices', 'textiles', 'gems', 'indigo', 'cotton'],
      currency: 'rupees and gold mohurs',
      politicalSystems: {
        'ANTIQUITY': 'kingdoms and republics',
        'MEDIEVAL': 'regional kingdoms and sultanates',
        'RENAISSANCE_EARLY_MODERN': 'mughal empire and kingdoms',
        'INDUSTRIAL': 'british colonial rule',
        'MODERN': 'independent democracies'
      },
      religiousContext: {
        'ANTIQUITY': 'vedic and early buddhism',
        'MEDIEVAL': 'hinduism, buddhism, jainism',
        'RENAISSANCE_EARLY_MODERN': 'hindu-muslim synthesis',
        'INDUSTRIAL': 'diverse with colonial influence',
        'MODERN': 'secular states with religious diversity'
      }
    },
    'SUB_SAHARAN_AFRICAN': {
      resources: ['gold', 'ivory', 'salt', 'copper', 'cattle'],
      professions: ['herder', 'farmer', 'blacksmith', 'trader', 'warrior'],
      socialStructure: ['chiefs', 'elders', 'warriors', 'farmers', 'craftsmen'],
      culturalTaboos: ['disrespecting elders', 'breaking oaths', 'violating sacred spaces'],
      tradeGoods: ['gold', 'ivory', 'salt', 'slaves', 'kola nuts'],
      currency: 'cowrie shells and gold dust',
      politicalSystems: {
        'ANTIQUITY': 'chiefdoms and early kingdoms',
        'MEDIEVAL': 'kingdoms and empires',
        'RENAISSANCE_EARLY_MODERN': 'kingdoms with trade networks',
        'INDUSTRIAL': 'colonial administration',
        'MODERN': 'independent nations'
      },
      religiousContext: {
        'ANTIQUITY': 'traditional african religions',
        'MEDIEVAL': 'traditional with islamic influence',
        'RENAISSANCE_EARLY_MODERN': 'diverse traditional and islamic',
        'INDUSTRIAL': 'traditional, islamic, and christian',
        'MODERN': 'christian, islamic, and traditional'
      }
    },
    'OCEANIA': {
      resources: ['fish', 'coconuts', 'taro', 'shells', 'wood'],
      professions: ['fisher', 'navigator', 'farmer', 'craftsman', 'chief'],
      socialStructure: ['chiefs', 'priests', 'warriors', 'commoners'],
      culturalTaboos: ['violating tapu', 'disrespecting mana', 'breaking hospitality'],
      tradeGoods: ['shells', 'mats', 'tools', 'canoes', 'preserved fish'],
      currency: 'shell money and barter',
      politicalSystems: {
        'ANTIQUITY': 'tribal chiefdoms',
        'MEDIEVAL': 'island kingdoms',
        'RENAISSANCE_EARLY_MODERN': 'confederations and kingdoms',
        'INDUSTRIAL': 'colonial administration',
        'MODERN': 'independent nations and territories'
      },
      religiousContext: {
        'ANTIQUITY': 'animistic and ancestor worship',
        'MEDIEVAL': 'traditional polynesian religions',
        'RENAISSANCE_EARLY_MODERN': 'traditional with early contact',
        'INDUSTRIAL': 'christian missions and traditional',
        'MODERN': 'christian majority with traditional elements'
      }
    },
    'AMERICAS': {
      resources: ['maize', 'potatoes', 'gold', 'silver', 'furs'],
      professions: ['farmer', 'hunter', 'priest', 'warrior', 'trader'],
      socialStructure: ['rulers', 'priests', 'warriors', 'farmers', 'slaves'],
      culturalTaboos: ['desecrating sacred sites', 'breaking peace pipes', 'violating hospitality'],
      tradeGoods: ['furs', 'tobacco', 'maize', 'obsidian', 'turquoise'],
      currency: 'cacao beans and wampum',
      politicalSystems: {
        'ANTIQUITY': 'tribes and chiefdoms',
        'MEDIEVAL': 'empires and confederations',
        'RENAISSANCE_EARLY_MODERN': 'colonial conquest period',
        'INDUSTRIAL': 'colonial and new republics',
        'MODERN': 'independent nations'
      },
      religiousContext: {
        'ANTIQUITY': 'diverse indigenous religions',
        'MEDIEVAL': 'complex pantheons and rituals',
        'RENAISSANCE_EARLY_MODERN': 'forced conversion period',
        'INDUSTRIAL': 'christian with indigenous survival',
        'MODERN': 'christian with indigenous revival'
      }
    },
    'CENTRAL_ASIAN': {
      resources: ['horses', 'wool', 'furs', 'gold', 'jade'],
      professions: ['nomad', 'herder', 'warrior', 'trader', 'shaman'],
      socialStructure: ['khans', 'nobles', 'warriors', 'herders', 'slaves'],
      culturalTaboos: ['betraying hospitality', 'dishonoring horses', 'breaking oaths'],
      tradeGoods: ['horses', 'furs', 'jade', 'silk', 'carpets'],
      currency: 'silver coins and barter',
      politicalSystems: {
        'ANTIQUITY': 'nomadic confederations',
        'MEDIEVAL': 'khanates and empires',
        'RENAISSANCE_EARLY_MODERN': 'khanates under pressure',
        'INDUSTRIAL': 'russian and chinese influence',
        'MODERN': 'soviet and independent republics'
      },
      religiousContext: {
        'ANTIQUITY': 'shamanism and tengrism',
        'MEDIEVAL': 'buddhism, islam, and traditional',
        'RENAISSANCE_EARLY_MODERN': 'islamic with buddhist minorities',
        'INDUSTRIAL': 'islamic and buddhist',
        'MODERN': 'islamic with secular influence'
      }
    }
  };

  /**
   * Get historical context for a specific zone, era, and year
   */
  public async getContext(zone: string, era: string, year: number): Promise<HistoricalContext> {
    const eraInfo = this.eraData[era] || this.eraData['MEDIEVAL'];
    const zoneInfo = this.zoneData[zone] || this.zoneData['EUROPEAN'];

    // Build quest context based on era and zone
    const questContext = this.generateQuestContext(zone, era, year);

    return {
      zone,
      era,
      year,
      summary: eraInfo.summary,
      questContext,
      availableResources: zoneInfo.resources,
      commonProfessions: zoneInfo.professions,
      socialStructure: zoneInfo.socialStructure,
      conflicts: eraInfo.conflicts,
      technology: eraInfo.technology,
      inappropriateElements: eraInfo.inappropriateElements,
      culturalTaboos: zoneInfo.culturalTaboos,
      tradeGoods: zoneInfo.tradeGoods,
      currency: zoneInfo.currency,
      politicalSystem: zoneInfo.politicalSystems[era] || 'traditional governance',
      religiousContext: zoneInfo.religiousContext[era] || 'traditional beliefs'
    };
  }

  /**
   * Generate specific quest context based on historical period
   */
  private generateQuestContext(zone: string, era: string, year: number): string {
    const contexts: Record<string, Record<string, string>> = {
      'EUROPEAN': {
        'ANTIQUITY': 'Roman legions patrol the roads. City-states vie for power. Mystery cults promise salvation.',
        'MEDIEVAL': 'Knights seek glory in tournaments. Monasteries preserve knowledge. Vikings raid coastal settlements.',
        'RENAISSANCE_EARLY_MODERN': 'Explorers seek new trade routes. Artists create masterpieces. Religious wars divide nations.',
        'INDUSTRIAL': 'Factories transform cities. Railways connect nations. Social reformers fight for workers\' rights.',
        'MODERN': 'Technology rapidly advances. Global conflicts reshape borders. Environmental concerns grow.'
      },
      'MENA': {
        'ANTIQUITY': 'Pharaohs rule the Nile. Caravans cross vast deserts. Ancient gods demand tribute.',
        'MEDIEVAL': 'Scholars translate ancient texts. Merchants trade along the Silk Road. Caliphs patronize the arts.',
        'RENAISSANCE_EARLY_MODERN': 'Ottoman armies expand westward. Coffee houses buzz with debate. Sufi mystics seek divine truth.',
        'INDUSTRIAL': 'European powers seek influence. Oil discoveries change fortunes. Modernizers clash with traditionalists.',
        'MODERN': 'Nations seek independence. Oil wealth transforms societies. Ancient and modern coexist.'
      },
      'EAST_ASIAN': {
        'ANTIQUITY': 'Warring states compete for supremacy. Philosophers debate governance. The Silk Road begins.',
        'MEDIEVAL': 'Dynasties rise and fall. Buddhism spreads through the land. Scholar-officials govern provinces.',
        'RENAISSANCE_EARLY_MODERN': 'The emperor rules from the Forbidden City. European traders arrive at ports. Traditional arts flourish.',
        'INDUSTRIAL': 'Western gunboats force open ports. Reformers seek to modernize. Traditional values are questioned.',
        'MODERN': 'Rapid industrialization transforms society. Ancient traditions meet modern technology. Economic miracles unfold.'
      },
      'SOUTH_ASIAN': {
        'ANTIQUITY': 'Great empires rise in the Ganges valley. Trade routes connect to Rome. Buddha achieves enlightenment.',
        'MEDIEVAL': 'Temple cities display architectural wonders. Sultanates establish power. Classical arts develop.',
        'RENAISSANCE_EARLY_MODERN': 'Mughal emperors build magnificent monuments. European traders establish factories. Diverse cultures blend.',
        'INDUSTRIAL': 'Colonial rule transforms society. Railways connect the subcontinent. Independence movements grow.',
        'MODERN': 'New nations emerge from partition. Technology sectors boom. Ancient and modern cultures blend.'
      },
      'SUB_SAHARAN_AFRICAN': {
        'ANTIQUITY': 'Iron-working spreads across the continent. Trade kingdoms control gold routes. Oral traditions preserve history.',
        'MEDIEVAL': 'Great empires control trans-Saharan trade. Islamic scholars establish centers of learning. Traditional kingdoms flourish.',
        'RENAISSANCE_EARLY_MODERN': 'Coastal trading posts connect to global markets. Kingdoms adapt to new threats. The slave trade intensifies.',
        'INDUSTRIAL': 'Colonial powers divide the continent. Resistance movements form. Traditional structures are challenged.',
        'MODERN': 'New nations gain independence. Resources attract global interest. Traditional and modern worlds meet.'
      },
      'OCEANIA': {
        'ANTIQUITY': 'Navigators discover new islands. Complex societies develop. Sacred sites are established.',
        'MEDIEVAL': 'Island kingdoms trade across vast distances. Navigation techniques are perfected. Oral histories are maintained.',
        'RENAISSANCE_EARLY_MODERN': 'First European contact occurs. Traditional societies face new diseases. Island confederations form.',
        'INDUSTRIAL': 'Colonial administrations are established. Missionaries spread Christianity. Traditional culture is suppressed.',
        'MODERN': 'Island nations gain independence. Climate change threatens low islands. Cultural revival movements grow.'
      },
      'AMERICAS': {
        'ANTIQUITY': 'Complex civilizations build monuments. Trade networks span continents. Astronomical knowledge advances.',
        'MEDIEVAL': 'Great empires dominate regions. City-states compete for resources. Religious ceremonies maintain cosmic order.',
        'RENAISSANCE_EARLY_MODERN': 'European diseases devastate populations. Colonial systems are imposed. Resistance movements emerge.',
        'INDUSTRIAL': 'New republics gain independence. Westward expansion displaces natives. Industrialization begins.',
        'MODERN': 'Superpowers emerge. Indigenous rights movements grow. Multicultural societies develop.'
      },
      'CENTRAL_ASIAN': {
        'ANTIQUITY': 'Nomadic tribes control the steppes. The Silk Road enriches oasis cities. Shamans communicate with spirits.',
        'MEDIEVAL': 'Mongol hordes conquer vast territories. Islamic conversion spreads. Trade cities flourish.',
        'RENAISSANCE_EARLY_MODERN': 'Gunpowder empires pressure nomads. Trade routes shift to sea. Traditional life continues.',
        'INDUSTRIAL': 'Russian expansion limits autonomy. Modernization attempts begin. Traditional nomadism declines.',
        'MODERN': 'Soviet rule transforms society. Independence brings new challenges. Ancient traditions are revived.'
      }
    };

    return contexts[zone]?.[era] || 'A time of change and uncertainty. Old ways meet new challenges.';
  }

  /**
   * Validate if a quest element is historically appropriate
   */
  public isHistoricallyAppropriate(
    element: string,
    zone: string,
    era: string
  ): boolean {
    const eraInfo = this.eraData[era];
    
    if (!eraInfo) return true; // If we don't have data, allow it
    
    // Check if element is in inappropriate list
    const elementLower = element.toLowerCase();
    for (const inappropriate of eraInfo.inappropriateElements) {
      if (elementLower.includes(inappropriate.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get appropriate quest themes for a historical context
   */
  public getAppropriateThemes(
    zone: string,
    era: string,
    year: number
  ): string[] {
    const themes: string[] = [];
    
    // Era-specific themes
    switch (era) {
      case 'ANTIQUITY':
        themes.push('honor the gods', 'expand territory', 'preserve knowledge');
        break;
      case 'MEDIEVAL':
        themes.push('defend the faith', 'seek glory', 'maintain feudal order');
        break;
      case 'RENAISSANCE_EARLY_MODERN':
        themes.push('explore new lands', 'patron the arts', 'navigate politics');
        break;
      case 'INDUSTRIAL':
        themes.push('modernize society', 'workers\' rights', 'colonial expansion');
        break;
      case 'MODERN':
        themes.push('technological progress', 'environmental protection', 'social justice');
        break;
    }
    
    // Zone-specific themes
    const zoneInfo = this.zoneData[zone];
    if (zoneInfo) {
      if (zoneInfo.culturalTaboos.includes('blasphemy')) {
        themes.push('defend religious orthodoxy');
      }
      if (zoneInfo.tradeGoods.includes('silk') || zoneInfo.tradeGoods.includes('spices')) {
        themes.push('establish trade routes');
      }
      if (zoneInfo.socialStructure.includes('warriors')) {
        themes.push('prove martial prowess');
      }
    }
    
    return themes;
  }

  /**
   * Get historically accurate rewards for quests
   */
  public getAppropriateRewards(
    zone: string,
    era: string,
    questDifficulty: string
  ): any[] {
    const rewards: any[] = [];
    const zoneInfo = this.zoneData[zone];
    
    // Currency reward
    const currencyAmount = questDifficulty === 'hard' ? 50 : 
                          questDifficulty === 'medium' ? 20 : 5;
    
    rewards.push({
      type: 'currency',
      amount: currencyAmount,
      description: `${currencyAmount} ${zoneInfo?.currency || 'coins'}`
    });
    
    // Reputation based on social structure
    if (zoneInfo?.socialStructure) {
      const reputationGroup = zoneInfo.socialStructure[Math.floor(Math.random() * 3)];
      rewards.push({
        type: 'reputation',
        amount: questDifficulty === 'hard' ? 15 : 5,
        description: `Reputation with ${reputationGroup}`
      });
    }
    
    // Item rewards based on trade goods
    if (questDifficulty !== 'easy' && zoneInfo?.tradeGoods) {
      const tradeGood = zoneInfo.tradeGoods[Math.floor(Math.random() * zoneInfo.tradeGoods.length)];
      rewards.push({
        type: 'item',
        item: tradeGood,
        description: `A valuable ${tradeGood}`
      });
    }
    
    return rewards;
  }
}

// Export singleton instance
export const historicalContextEngine = new HistoricalContextEngine();

// Also export class for testing
export default HistoricalContextEngine;