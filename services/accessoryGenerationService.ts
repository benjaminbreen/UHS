import { HistoricalEra, CulturalZone, SocialClass } from '../types/characterData';

const accessoriesByEraAndCulture: Record<HistoricalEra, Record<CulturalZone, Record<string, string[]>>> = {
  PREHISTORY: {
    EUROPEAN: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      chief: ['BONE_NECKLACE', 'AMBER_PENDANT']
    },
    EAST_ASIAN: {
      default: ['ROPE_NECKLACE', 'JADE_PENDANT'],
      shaman: ['JADE_PENDANT', 'BONE_NECKLACE'],
      chief: ['JADE_PENDANT']
    },
    MENA: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      chief: ['SHELL_NECKLACE', 'AMBER_PENDANT']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      chief: ['SHELL_NECKLACE', 'TURQUOISE_PENDANT']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      chief: ['SHELL_NECKLACE']
    },
    OCEANIA: {
      default: ['ROPE_NECKLACE', 'SHELL_NECKLACE'],
      shaman: ['SHELL_NECKLACE', 'BONE_NECKLACE'],
      chief: ['SHELL_NECKLACE', 'PEARL_NECKLACE']
    },
    SOUTH_ASIAN: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      chief: ['AMBER_PENDANT', 'JADE_PENDANT']
    },
    SOUTH_AMERICAN: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'TURQUOISE_PENDANT'],
      chief: ['TURQUOISE_PENDANT', 'OBSIDIAN_AMULET']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['ROPE_NECKLACE', 'BONE_NECKLACE'],
      shaman: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      chief: ['SHELL_NECKLACE', 'IVORY_PENDANT']
    }
  },
  ANTIQUITY: {
    EUROPEAN: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS'],
      soldier: ['SIMPLE_RING', 'IRON_RING'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN'],
      aristocrat: ['GOLD_RING', 'GOLD_CHAIN', 'EMERALD_RING'],
      scholar: ['SIMPLE_RING', 'SILVER_RING'],
      priest: ['WOODEN_CROSS', 'SILVER_CROSS']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_RING', 'JADE_PENDANT'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['JADE_PENDANT', 'SILVER_RING'],
      aristocrat: ['JADE_PENDANT', 'GOLD_RING', 'PEARL_NECKLACE'],
      scholar: ['JADE_PENDANT', 'SIMPLE_RING']
    },
    MENA: {
      default: ['SIMPLE_RING', 'HAMSA_HAND'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN'],
      aristocrat: ['GOLD_RING', 'EMERALD_RING', 'SAPPHIRE_RING'],
      scholar: ['SIMPLE_RING', 'SILVER_RING']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['BONE_NECKLACE', 'TURQUOISE_PENDANT'],
      warrior: ['BONE_NECKLACE', 'OBSIDIAN_AMULET'],
      trader: ['TURQUOISE_PENDANT', 'SHELL_NECKLACE'],
      chief: ['TURQUOISE_PENDANT', 'JADE_PENDANT']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN']
    },
    OCEANIA: {
      default: ['SHELL_NECKLACE', 'ROPE_NECKLACE'],
      warrior: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      trader: ['SHELL_NECKLACE', 'PEARL_NECKLACE'],
      chief: ['PEARL_NECKLACE', 'JADE_PENDANT']
    },
    SOUTH_ASIAN: {
      default: ['SIMPLE_RING', 'HINDU_OM'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['SILVER_RING', 'JADE_PENDANT'],
      aristocrat: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING'],
      scholar: ['SIMPLE_RING', 'JADE_PENDANT'],
      priest: ['HINDU_OM', 'BUDDHIST_WHEEL']
    },
    SOUTH_AMERICAN: {
      default: ['TURQUOISE_PENDANT', 'BONE_NECKLACE'],
      warrior: ['OBSIDIAN_AMULET', 'BONE_NECKLACE'],
      trader: ['TURQUOISE_PENDANT', 'JADE_PENDANT'],
      noble: ['JADE_PENDANT', 'GOLD_RING'],
      priest: ['OBSIDIAN_AMULET', 'TURQUOISE_PENDANT']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      warrior: ['BONE_NECKLACE', 'IVORY_PENDANT'],
      trader: ['SHELL_NECKLACE', 'AMBER_PENDANT'],
      chief: ['IVORY_PENDANT', 'GOLD_RING'],
      griot: ['SHELL_NECKLACE', 'BONE_NECKLACE']
    }
  },
  MEDIEVAL: {
    EUROPEAN: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS'],
      knight: ['IRON_RING', 'SILVER_CROSS'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN'],
      aristocrat: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING'],
      scholar: ['SIMPLE_RING', 'SILVER_RING'],
      monk: ['WOODEN_CROSS', 'SIMPLE_RING'],
      priest: ['SILVER_CROSS', 'GOLD_CROSS']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_RING', 'JADE_PENDANT'],
      samurai: ['IRON_RING', 'JADE_PENDANT'],
      merchant: ['JADE_PENDANT', 'SILVER_RING'],
      daimyo: ['JADE_PENDANT', 'GOLD_RING', 'PEARL_NECKLACE'],
      scholar: ['JADE_PENDANT', 'SIMPLE_RING'],
      monk: ['BUDDHIST_WHEEL', 'SIMPLE_RING']
    },
    MENA: {
      default: ['SIMPLE_RING', 'HAMSA_HAND'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN'],
      emir: ['GOLD_RING', 'EMERALD_RING', 'SAPPHIRE_RING'],
      scholar: ['SIMPLE_RING', 'SILVER_RING'],
      imam: ['HAMSA_HAND', 'SILVER_RING']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['BONE_NECKLACE', 'TURQUOISE_PENDANT'],
      warrior: ['BONE_NECKLACE', 'OBSIDIAN_AMULET'],
      trader: ['TURQUOISE_PENDANT', 'SHELL_NECKLACE'],
      chief: ['TURQUOISE_PENDANT', 'JADE_PENDANT'],
      shaman: ['OBSIDIAN_AMULET', 'BONE_NECKLACE']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN'],
      aristocrat: ['GOLD_RING', 'EMERALD_RING']
    },
    OCEANIA: {
      default: ['SHELL_NECKLACE', 'ROPE_NECKLACE'],
      warrior: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      trader: ['SHELL_NECKLACE', 'PEARL_NECKLACE'],
      chief: ['PEARL_NECKLACE', 'JADE_PENDANT'],
      navigator: ['SHELL_NECKLACE', 'ROPE_NECKLACE']
    },
    SOUTH_ASIAN: {
      default: ['SIMPLE_RING', 'HINDU_OM'],
      soldier: ['IRON_RING', 'SIMPLE_RING'],
      merchant: ['SILVER_RING', 'JADE_PENDANT'],
      raja: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING', 'DIAMOND_RING'],
      scholar: ['SIMPLE_RING', 'JADE_PENDANT'],
      priest: ['HINDU_OM', 'BUDDHIST_WHEEL']
    },
    SOUTH_AMERICAN: {
      default: ['TURQUOISE_PENDANT', 'BONE_NECKLACE'],
      warrior: ['OBSIDIAN_AMULET', 'BONE_NECKLACE'],
      trader: ['TURQUOISE_PENDANT', 'JADE_PENDANT'],
      noble: ['JADE_PENDANT', 'GOLD_RING', 'EMERALD_RING'],
      priest: ['OBSIDIAN_AMULET', 'TURQUOISE_PENDANT']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['BONE_NECKLACE', 'SHELL_NECKLACE'],
      warrior: ['BONE_NECKLACE', 'IVORY_PENDANT'],
      trader: ['SHELL_NECKLACE', 'AMBER_PENDANT'],
      king: ['IVORY_PENDANT', 'GOLD_RING', 'EMERALD_RING'],
      griot: ['SHELL_NECKLACE', 'BONE_NECKLACE']
    }
  },
  RENAISSANCE_EARLY_MODERN: {
    EUROPEAN: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS', 'SILVER_RING'],
      soldier: ['IRON_RING', 'SILVER_CROSS'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN', 'GOLD_RING'],
      aristocrat: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING', 'DIAMOND_RING'],
      scholar: ['SILVER_RING', 'SIMPLE_RING'],
      artisan: ['SIMPLE_RING', 'SILVER_RING'],
      priest: ['SILVER_CROSS', 'GOLD_CROSS']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_RING', 'JADE_PENDANT'],
      samurai: ['IRON_RING', 'JADE_PENDANT'],
      merchant: ['JADE_PENDANT', 'SILVER_RING', 'GOLD_RING'],
      daimyo: ['JADE_PENDANT', 'GOLD_RING', 'PEARL_NECKLACE', 'RUBY_RING'],
      scholar: ['JADE_PENDANT', 'SILVER_RING']
    },
    MENA: {
      default: ['SIMPLE_RING', 'HAMSA_HAND'],
      soldier: ['IRON_RING', 'SILVER_RING'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN', 'GOLD_RING'],
      pasha: ['GOLD_RING', 'EMERALD_RING', 'SAPPHIRE_RING', 'DIAMOND_RING'],
      scholar: ['SILVER_RING', 'SIMPLE_RING']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['TURQUOISE_PENDANT', 'SILVER_RING'],
      warrior: ['OBSIDIAN_AMULET', 'IRON_RING'],
      trader: ['TURQUOISE_PENDANT', 'SILVER_RING'],
      chief: ['TURQUOISE_PENDANT', 'JADE_PENDANT', 'GOLD_RING']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS'],
      soldier: ['IRON_RING', 'SILVER_CROSS'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN', 'GOLD_RING'],
      planter: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING'],
      slave: ['ROPE_NECKLACE']
    },
    OCEANIA: {
      default: ['SHELL_NECKLACE', 'SILVER_RING'],
      warrior: ['BONE_NECKLACE', 'IRON_RING'],
      trader: ['PEARL_NECKLACE', 'SILVER_RING'],
      chief: ['PEARL_NECKLACE', 'JADE_PENDANT', 'GOLD_RING']
    },
    SOUTH_ASIAN: {
      default: ['SIMPLE_RING', 'HINDU_OM'],
      soldier: ['IRON_RING', 'SILVER_RING'],
      merchant: ['SILVER_RING', 'JADE_PENDANT', 'GOLD_RING'],
      nawab: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING', 'DIAMOND_RING', 'SAPPHIRE_RING'],
      scholar: ['SILVER_RING', 'JADE_PENDANT'],
      priest: ['HINDU_OM', 'BUDDHIST_WHEEL']
    },
    SOUTH_AMERICAN: {
      default: ['SIMPLE_RING', 'WOODEN_CROSS'],
      soldier: ['IRON_RING', 'SILVER_CROSS'],
      merchant: ['SILVER_RING', 'SILVER_CHAIN', 'GOLD_RING'],
      hacienda_owner: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING'],
      slave: ['ROPE_NECKLACE'],
      indigenous: ['TURQUOISE_PENDANT', 'OBSIDIAN_AMULET']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['BONE_NECKLACE', 'SHELL_NECKLACE', 'SIMPLE_RING'],
      warrior: ['BONE_NECKLACE', 'IVORY_PENDANT'],
      trader: ['AMBER_PENDANT', 'SILVER_RING', 'GOLD_RING'],
      king: ['IVORY_PENDANT', 'GOLD_RING', 'EMERALD_RING', 'DIAMOND_RING'],
      griot: ['SHELL_NECKLACE', 'AMBER_PENDANT']
    }
  },
  INDUSTRIAL_ERA: {
    EUROPEAN: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      worker: ['SIMPLE_RING', 'IRON_RING'],
      industrialist: ['GOLD_RING', 'DIAMOND_RING', 'EMERALD_RING'],
      aristocrat: ['DIAMOND_RING', 'RUBY_RING', 'SAPPHIRE_RING', 'PEARL_NECKLACE'],
      clerk: ['SILVER_RING', 'SIMPLE_RING']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_RING', 'JADE_PENDANT'],
      worker: ['SIMPLE_RING', 'IRON_RING'],
      merchant: ['SILVER_RING', 'JADE_PENDANT', 'GOLD_RING'],
      official: ['GOLD_RING', 'JADE_PENDANT', 'PEARL_NECKLACE']
    },
    MENA: {
      default: ['SIMPLE_RING', 'HAMSA_HAND'],
      worker: ['SIMPLE_RING', 'IRON_RING'],
      merchant: ['SILVER_RING', 'GOLD_RING'],
      official: ['GOLD_RING', 'EMERALD_RING', 'SAPPHIRE_RING']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['TURQUOISE_PENDANT', 'SILVER_RING'],
      trader: ['TURQUOISE_PENDANT', 'SILVER_RING', 'GOLD_RING']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      worker: ['SIMPLE_RING', 'IRON_RING'],
      businessman: ['GOLD_RING', 'DIAMOND_RING'],
      industrialist: ['DIAMOND_RING', 'RUBY_RING', 'EMERALD_RING', 'SAPPHIRE_RING']
    },
    OCEANIA: {
      default: ['SHELL_NECKLACE', 'SILVER_RING'],
      trader: ['PEARL_NECKLACE', 'SILVER_RING', 'GOLD_RING'],
      official: ['GOLD_RING', 'PEARL_NECKLACE']
    },
    SOUTH_ASIAN: {
      default: ['SIMPLE_RING', 'HINDU_OM'],
      worker: ['SIMPLE_RING', 'IRON_RING'],
      merchant: ['SILVER_RING', 'JADE_PENDANT', 'GOLD_RING'],
      official: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING']
    },
    SOUTH_AMERICAN: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      worker: ['SIMPLE_RING', 'IRON_RING'],
      merchant: ['SILVER_RING', 'GOLD_RING'],
      landowner: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['SIMPLE_RING', 'SHELL_NECKLACE'],
      worker: ['SIMPLE_RING', 'BONE_NECKLACE'],
      trader: ['SILVER_RING', 'AMBER_PENDANT', 'GOLD_RING'],
      official: ['GOLD_RING', 'IVORY_PENDANT', 'EMERALD_RING']
    }
  },
  MODERN_ERA: {
    EUROPEAN: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'DIAMOND_RING'],
      artist: ['SILVER_RING', 'SIMPLE_RING']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_RING', 'JADE_PENDANT'],
      professional: ['SILVER_RING', 'JADE_PENDANT'],
      executive: ['GOLD_RING', 'JADE_PENDANT', 'DIAMOND_RING']
    },
    MENA: {
      default: ['SIMPLE_RING', 'HAMSA_HAND'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'EMERALD_RING', 'DIAMOND_RING']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['TURQUOISE_PENDANT', 'SILVER_RING'],
      professional: ['SILVER_RING', 'TURQUOISE_PENDANT']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'DIAMOND_RING']
    },
    OCEANIA: {
      default: ['SHELL_NECKLACE', 'SILVER_RING'],
      professional: ['SILVER_RING', 'PEARL_NECKLACE']
    },
    SOUTH_ASIAN: {
      default: ['SIMPLE_RING', 'HINDU_OM'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING']
    },
    SOUTH_AMERICAN: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'EMERALD_RING']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['SIMPLE_RING', 'SHELL_NECKLACE'],
      professional: ['SILVER_RING', 'AMBER_PENDANT'],
      executive: ['GOLD_RING', 'IVORY_PENDANT', 'DIAMOND_RING']
    }
  },
  FUTURE_ERA: {
    EUROPEAN: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'DIAMOND_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING'],
      artist: ['SILVER_RING', 'SIMPLE_RING']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_RING', 'JADE_PENDANT'],
      professional: ['SILVER_RING', 'JADE_PENDANT'],
      executive: ['GOLD_RING', 'JADE_PENDANT', 'DIAMOND_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    },
    MENA: {
      default: ['SIMPLE_RING', 'HAMSA_HAND'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'EMERALD_RING', 'DIAMOND_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['TURQUOISE_PENDANT', 'SILVER_RING'],
      professional: ['SILVER_RING', 'TURQUOISE_PENDANT'],
      traditional: ['TURQUOISE_PENDANT', 'OBSIDIAN_AMULET']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'DIAMOND_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    },
    OCEANIA: {
      default: ['SHELL_NECKLACE', 'SILVER_RING'],
      professional: ['SILVER_RING', 'PEARL_NECKLACE'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    },
    SOUTH_ASIAN: {
      default: ['SIMPLE_RING', 'HINDU_OM'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    },
    SOUTH_AMERICAN: {
      default: ['SIMPLE_RING', 'SILVER_RING'],
      professional: ['SILVER_RING', 'GOLD_RING'],
      executive: ['GOLD_RING', 'EMERALD_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['SIMPLE_RING', 'SHELL_NECKLACE'],
      professional: ['SILVER_RING', 'AMBER_PENDANT'],
      executive: ['GOLD_RING', 'IVORY_PENDANT', 'DIAMOND_RING'],
      tech_worker: ['SIMPLE_RING', 'SILVER_RING']
    }
  }
};

const socialClassAccessories: Record<SocialClass, string[]> = {
  slave: ['ROPE_NECKLACE'],
  serf: ['ROPE_NECKLACE', 'SIMPLE_RING'],
  peasant: ['SIMPLE_RING', 'ROPE_NECKLACE', 'BONE_NECKLACE'],
  commoner: ['SIMPLE_RING', 'IRON_RING', 'WOODEN_CROSS', 'SHELL_NECKLACE'],
  merchant: ['SILVER_RING', 'SILVER_CHAIN', 'JADE_PENDANT', 'AMBER_PENDANT'],
  noble: ['GOLD_RING', 'EMERALD_RING', 'RUBY_RING', 'PEARL_NECKLACE'],
  royalty: ['DIAMOND_RING', 'SAPPHIRE_RING', 'RUBY_RING', 'EMERALD_RING', 'PEARL_NECKLACE']
};

export function generateContextualAccessory(
  profession: string,
  options: {
    era?: HistoricalEra;
    culture?: CulturalZone;
    socialClass?: SocialClass;
    privilege?: number;
    slot?: 'ring' | 'amulet';
  } = {}
): string | null {
  const era = options.era || 'MEDIEVAL';
  const culture = options.culture || 'EUROPEAN';
  const socialClass = options.socialClass || 'commoner';
  
  const eraAccessories = accessoriesByEraAndCulture[era]?.[culture];
  if (!eraAccessories) {
    return 'SIMPLE_RING';
  }

  const normalizedProfession = profession.toLowerCase();
  
  let candidates: string[] = [];
  
  for (const [key, items] of Object.entries(eraAccessories)) {
    if (normalizedProfession.includes(key) || key === 'default') {
      candidates.push(...items);
    }
  }
  
  if (options.socialClass && socialClassAccessories[options.socialClass]) {
    const classItems = socialClassAccessories[options.socialClass];
    const classMatches = candidates.filter(item => classItems.includes(item));
    if (classMatches.length > 0) {
      candidates = classMatches;
    } else {
      candidates.push(...classItems);
    }
  }
  
  if (options.slot === 'ring') {
    candidates = candidates.filter(item => item.includes('RING'));
    if (candidates.length === 0) {
      candidates = ['SIMPLE_RING', 'IRON_RING', 'SILVER_RING', 'GOLD_RING'];
    }
  } else if (options.slot === 'amulet') {
    candidates = candidates.filter(item => 
      !item.includes('RING') && 
      (item.includes('NECKLACE') || item.includes('PENDANT') || 
       item.includes('AMULET') || item.includes('CHAIN') || 
       item.includes('CROSS') || item.includes('WHEEL') || 
       item.includes('OM') || item.includes('HAMSA'))
    );
    if (candidates.length === 0) {
      candidates = ['ROPE_NECKLACE', 'SHELL_NECKLACE', 'BONE_NECKLACE'];
    }
  }
  
  if (candidates.length === 0) {
    candidates = eraAccessories.default || ['SIMPLE_RING'];
  }
  
  const uniqueCandidates = [...new Set(candidates)];
  
  if (options.privilege !== undefined) {
    const sortedByValue = uniqueCandidates.sort((a, b) => {
      const aValue = getAccessoryValue(a);
      const bValue = getAccessoryValue(b);
      return options.privilege! > 50 ? bValue - aValue : aValue - bValue;
    });
    return sortedByValue[0] || 'SIMPLE_RING';
  }
  
  return uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)] || 'SIMPLE_RING';
}

function getAccessoryValue(accessoryId: string): number {
  const valueMap: Record<string, number> = {
    'DIAMOND_RING': 500,
    'SAPPHIRE_RING': 250,
    'RUBY_RING': 200,
    'EMERALD_RING': 150,
    'PEARL_NECKLACE': 80,
    'GOLD_RING': 50,
    'GOLD_CHAIN': 45,
    'GOLD_CROSS': 40,
    'JADE_PENDANT': 35,
    'IVORY_PENDANT': 30,
    'SILVER_RING': 20,
    'SILVER_CHAIN': 18,
    'SILVER_CROSS': 15,
    'AMBER_PENDANT': 12,
    'TURQUOISE_PENDANT': 10,
    'IRON_RING': 8,
    'OBSIDIAN_AMULET': 8,
    'HINDU_OM': 5,
    'BUDDHIST_WHEEL': 5,
    'HAMSA_HAND': 5,
    'WOODEN_CROSS': 3,
    'SHELL_NECKLACE': 2,
    'BONE_NECKLACE': 2,
    'SIMPLE_RING': 10,
    'ROPE_NECKLACE': 1
  };
  
  return valueMap[accessoryId] || 5;
}

export const GENERIC_ACCESSORIES = [
  'SIMPLE_RING',
  'ROPE_NECKLACE'
];