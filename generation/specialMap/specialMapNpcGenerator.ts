/**
 * generation/specialMap/specialMapNpcGenerator.ts
 * Generates culturally and historically appropriate NPCs for special maps
 */

import { NpcEntity, HistoricalEra, CulturalZone } from '../../types';
import { SpecialMapArchetype, SpecialMapConfig } from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';

// Elite professions for different cultures and eras
const PALACE_NPCS = {
  EUROPEAN: {
    [HistoricalEra.ANTIQUITY]: [
      { profession: 'SENATOR', count: 2 },
      { profession: 'PRAETORIAN', count: 3 },
      { profession: 'PATRICIAN', count: 2 },
      { profession: 'AUGUR', count: 1 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { profession: 'KNIGHT', count: 3 },
      { profession: 'NOBLE', count: 4 },
      { profession: 'COURTIER', count: 3 },
      { profession: 'BARD', count: 1 },
      { profession: 'CHAPLAIN', count: 1 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { profession: 'DUKE', count: 2 },
      { profession: 'DUCHESS', count: 2 },
      { profession: 'COURTIER', count: 4 },
      { profession: 'ARTIST', count: 2 },
      { profession: 'PHILOSOPHER', count: 1 },
      { profession: 'GUARD_CAPTAIN', count: 2 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { profession: 'ARISTOCRAT', count: 4 },
      { profession: 'MINISTER', count: 3 },
      { profession: 'AMBASSADOR', count: 2 },
      { profession: 'GENERAL', count: 1 },
      { profession: 'BUTLER', count: 2 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { profession: 'POLITICIAN', count: 3 },
      { profession: 'DIPLOMAT', count: 2 },
      { profession: 'ADVISOR', count: 3 },
      { profession: 'SECURITY_CHIEF', count: 2 }
    ]
  },
  EAST_ASIAN: {
    [HistoricalEra.ANTIQUITY]: [
      { profession: 'MANDARIN', count: 3 },
      { profession: 'SCHOLAR', count: 2 },
      { profession: 'GENERAL', count: 1 },
      { profession: 'COURT_MUSICIAN', count: 2 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { profession: 'DAIMYO', count: 2 },
      { profession: 'SAMURAI', count: 4 },
      { profession: 'SCHOLAR', count: 2 },
      { profession: 'TEA_MASTER', count: 1 },
      { profession: 'CALLIGRAPHER', count: 1 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { profession: 'MANDARIN', count: 4 },
      { profession: 'EUNUCH', count: 2 },
      { profession: 'CONCUBINE', count: 3 },
      { profession: 'IMPERIAL_GUARD', count: 3 },
      { profession: 'COURT_PAINTER', count: 1 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { profession: 'GOVERNOR', count: 2 },
      { profession: 'OFFICIAL', count: 4 },
      { profession: 'MODERNIZER', count: 2 },
      { profession: 'WESTERN_ADVISOR', count: 1 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { profession: 'BUREAUCRAT', count: 4 },
      { profession: 'PARTY_OFFICIAL', count: 3 },
      { profession: 'ECONOMIST', count: 2 },
      { profession: 'SECURITY_OFFICER', count: 2 }
    ]
  },
  MENA: {
    [HistoricalEra.ANTIQUITY]: [
      { profession: 'VIZIER', count: 2 },
      { profession: 'PRIEST', count: 2 },
      { profession: 'SCRIBE', count: 3 },
      { profession: 'GUARD', count: 3 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { profession: 'EMIR', count: 2 },
      { profession: 'VIZIER', count: 2 },
      { profession: 'IMAM', count: 1 },
      { profession: 'SCHOLAR', count: 3 },
      { profession: 'MAMLUK', count: 3 },
      { profession: 'POET', count: 1 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { profession: 'PASHA', count: 2 },
      { profession: 'JANISSARY', count: 3 },
      { profession: 'MERCHANT_PRINCE', count: 2 },
      { profession: 'ASTRONOMER', count: 1 },
      { profession: 'CALLIGRAPHER', count: 1 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { profession: 'SHEIKH', count: 2 },
      { profession: 'MODERNIST', count: 2 },
      { profession: 'OFFICER', count: 3 },
      { profession: 'ENGINEER', count: 2 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { profession: 'MINISTER', count: 3 },
      { profession: 'OIL_EXECUTIVE', count: 2 },
      { profession: 'DIPLOMAT', count: 2 },
      { profession: 'ROYAL_GUARD', count: 3 }
    ]
  },
  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.ANTIQUITY]: [
      { profession: 'CHIEF', count: 2 },
      { profession: 'ELDER', count: 3 },
      { profession: 'WARRIOR', count: 3 },
      { profession: 'GRIOT', count: 1 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { profession: 'KING', count: 1 },
      { profession: 'QUEEN_MOTHER', count: 1 },
      { profession: 'NOBLE', count: 3 },
      { profession: 'GRIOT', count: 2 },
      { profession: 'WARRIOR', count: 4 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { profession: 'OBA', count: 1 },
      { profession: 'CHIEF', count: 3 },
      { profession: 'TRADER', count: 2 },
      { profession: 'WARRIOR', count: 3 },
      { profession: 'CRAFTSMAN', count: 2 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { profession: 'CHIEF', count: 2 },
      { profession: 'COLONIAL_ADMINISTRATOR', count: 2 },
      { profession: 'INTERPRETER', count: 2 },
      { profession: 'SOLDIER', count: 3 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { profession: 'PRESIDENT', count: 1 },
      { profession: 'MINISTER', count: 3 },
      { profession: 'GENERAL', count: 2 },
      { profession: 'BUSINESSMAN', count: 3 }
    ]
  }
};

// Government district NPCs
const GOVERNMENT_NPCS = {
  EUROPEAN: {
    [HistoricalEra.ANTIQUITY]: [
      { profession: 'MAGISTRATE', count: 2 },
      { profession: 'SCRIBE', count: 3 },
      { profession: 'ADVOCATE', count: 2 },
      { profession: 'LICTOR', count: 2 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { profession: 'BAILIFF', count: 2 },
      { profession: 'CLERK', count: 3 },
      { profession: 'JUDGE', count: 1 },
      { profession: 'TOWN_CRIER', count: 1 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { profession: 'MAGISTRATE', count: 2 },
      { profession: 'NOTARY', count: 2 },
      { profession: 'CLERK', count: 4 },
      { profession: 'GUARD', count: 2 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { profession: 'BUREAUCRAT', count: 4 },
      { profession: 'POLICEMAN', count: 3 },
      { profession: 'CLERK', count: 3 },
      { profession: 'LAWYER', count: 2 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { profession: 'CIVIL_SERVANT', count: 5 },
      { profession: 'POLICE_OFFICER', count: 2 },
      { profession: 'ADMINISTRATOR', count: 3 }
    ]
  }
  // Add other cultures...
};

/**
 * Generate NPCs for a special map
 */
export function generateSpecialMapNpcs(
  config: SpecialMapConfig,
  mapSize: { width: number, height: number },
  noise: ValueNoise,
  tiles: any[][]
): NpcEntity[] {
  const npcs: NpcEntity[] = [];
  let npcTemplates: { profession: string, count: number }[] = [];
  
  // Select NPC templates based on archetype and culture
  switch (config.archetype) {
    case SpecialMapArchetype.PALACE_COMPLEX:
      npcTemplates = getPalaceNpcs(config.culturalZone, config.era);
      break;
    case SpecialMapArchetype.GOVERNMENT_FORUM:
      npcTemplates = getGovernmentNpcs(config.culturalZone, config.era);
      break;
    case SpecialMapArchetype.MARKET_BAZAAR:
      npcTemplates = getMarketNpcs(config.culturalZone, config.era);
      break;
    case SpecialMapArchetype.SACRED_COMPLEX:
      npcTemplates = getSacredNpcs(config.culturalZone, config.era);
      break;
    case SpecialMapArchetype.MILITARY_FORTRESS:
      npcTemplates = getMilitaryNpcs(config.culturalZone, config.era);
      break;
    case SpecialMapArchetype.UNIVERSITY_ACADEMY:
      npcTemplates = getAcademicNpcs(config.culturalZone, config.era);
      break;
    default:
      npcTemplates = getDefaultNpcs(config.culturalZone, config.era);
  }
  
  // Generate NPCs based on templates
  let npcId = 1000; // Start with high ID to avoid conflicts
  
  npcTemplates.forEach(template => {
    for (let i = 0; i < template.count; i++) {
      const position = findValidNpcPosition(tiles, mapSize, noise);
      if (position) {
        const npc = createSpecialMapNpc(
          npcId++,
          template.profession,
          position,
          config.culturalZone,
          config.era,
          noise
        );
        npcs.push(npc);
      }
    }
  });
  
  return npcs;
}

/**
 * Get palace NPCs for culture/era
 */
function getPalaceNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  const zone = normalizeZone(culturalZone);
  const palaceNpcs = PALACE_NPCS[zone]?.[era];
  
  if (palaceNpcs) {
    return palaceNpcs;
  }
  
  // Default fallback
  return [
    { profession: 'NOBLE', count: 3 },
    { profession: 'GUARD', count: 3 },
    { profession: 'SERVANT', count: 2 }
  ];
}

/**
 * Get government NPCs for culture/era
 */
function getGovernmentNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  const zone = normalizeZone(culturalZone);
  const govNpcs = GOVERNMENT_NPCS[zone]?.[era];
  
  if (govNpcs) {
    return govNpcs;
  }
  
  // Default fallback
  return [
    { profession: 'BUREAUCRAT', count: 3 },
    { profession: 'CLERK', count: 3 },
    { profession: 'GUARD', count: 2 }
  ];
}

/**
 * Get market NPCs
 */
function getMarketNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'MERCHANT', count: 4 },
    { profession: 'TRADER', count: 3 },
    { profession: 'ARTISAN', count: 2 },
    { profession: 'GUARD', count: 1 }
  ];
}

/**
 * Get sacred complex NPCs
 */
function getSacredNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  const zone = normalizeZone(culturalZone);
  
  if (zone === 'EUROPEAN') {
    return [
      { profession: 'PRIEST', count: 3 },
      { profession: 'MONK', count: 2 },
      { profession: 'PILGRIM', count: 2 }
    ];
  } else if (zone === 'MENA') {
    return [
      { profession: 'IMAM', count: 2 },
      { profession: 'MUEZZIN', count: 1 },
      { profession: 'SCHOLAR', count: 2 },
      { profession: 'PILGRIM', count: 2 }
    ];
  } else if (zone === 'EAST_ASIAN') {
    return [
      { profession: 'MONK', count: 3 },
      { profession: 'PRIEST', count: 2 },
      { profession: 'PILGRIM', count: 2 }
    ];
  }
  
  return [
    { profession: 'PRIEST', count: 3 },
    { profession: 'DEVOTEE', count: 3 }
  ];
}

/**
 * Get military NPCs
 */
function getMilitaryNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'SOLDIER', count: 5 },
    { profession: 'OFFICER', count: 2 },
    { profession: 'GUARD', count: 3 },
    { profession: 'QUARTERMASTER', count: 1 }
  ];
}

/**
 * Get academic NPCs
 */
function getAcademicNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'SCHOLAR', count: 4 },
    { profession: 'STUDENT', count: 3 },
    { profession: 'LIBRARIAN', count: 1 },
    { profession: 'PHILOSOPHER', count: 1 }
  ];
}

/**
 * Get default NPCs
 */
function getDefaultNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'CITIZEN', count: 3 },
    { profession: 'WORKER', count: 2 },
    { profession: 'GUARD', count: 1 }
  ];
}

/**
 * Find valid position for NPC
 */
function findValidNpcPosition(
  tiles: any[][],
  mapSize: { width: number, height: number },
  noise: ValueNoise
): { x: number, y: number } | null {
  const maxAttempts = 50;
  
  for (let i = 0; i < maxAttempts; i++) {
    const x = Math.floor(noise.random() * (mapSize.width - 4)) + 2;
    const y = Math.floor(noise.random() * (mapSize.height - 4)) + 2;
    
    const tile = tiles[y]?.[x];
    if (tile && isWalkableTile(tile)) {
      return { x, y };
    }
  }
  
  return null;
}

/**
 * Check if tile is walkable
 */
function isWalkableTile(tile: any): boolean {
  const walkableBiomes = [
    'FLOOR_STONE', 'FLOOR_WOOD', 'FLOOR_MARBLE', 'FLOOR_TILE',
    'PLAZA', 'PARK', 'CARPET', 'DIRT', 'GRASS'
  ];
  
  return walkableBiomes.some(biome => tile.biome?.includes(biome));
}

/**
 * Create an NPC for special map
 */
function createSpecialMapNpc(
  id: number,
  profession: string,
  position: { x: number, y: number },
  culturalZone: string,
  era: string,
  noise: ValueNoise
): NpcEntity {
  const names = getNamesByProfession(profession, culturalZone);
  const name = names[Math.floor(noise.random() * names.length)];
  
  return {
    id: `special_npc_${id}`,
    name: name,
    profession: profession.toLowerCase().replace(/_/g, ' '),
    x: position.x,
    y: position.y,
    health: 100,
    maxHealth: 100,
    dialogue: generateDialogue(profession, culturalZone, era),
    isAlive: true,
    faction: 'neutral',
    personality: generatePersonality(noise),
    attributes: [],
    inventory: [],
    reputation: 0,
    lastInteraction: null,
    memory: {},
    isSpecialMapNpc: true // Mark as special map NPC
  } as NpcEntity;
}

/**
 * Get culturally appropriate names by profession
 */
function getNamesByProfession(profession: string, culturalZone: string): string[] {
  const zone = normalizeZone(culturalZone);
  
  // Sample names by culture
  const names = {
    EUROPEAN: ['Marcus', 'Julia', 'Wilhelm', 'Isabella', 'Charles', 'Eleanor', 'Philip', 'Catherine'],
    EAST_ASIAN: ['Li Wei', 'Mei Chen', 'Takeshi', 'Sakura', 'Jin', 'Yuki', 'Hiro', 'Ming'],
    MENA: ['Ahmad', 'Fatima', 'Omar', 'Aisha', 'Hassan', 'Leila', 'Khalid', 'Zahra'],
    SUB_SAHARAN_AFRICAN: ['Kwame', 'Amara', 'Juma', 'Nia', 'Kofi', 'Zara', 'Malik', 'Imani'],
    SOUTH_ASIAN: ['Raj', 'Priya', 'Arjun', 'Kavya', 'Dev', 'Ananya', 'Vikram', 'Sita'],
    NATIVE_AMERICAN: ['Aiyana', 'Chayton', 'Winona', 'Takoda', 'Nayeli', 'Kai', 'Nova', 'Mika'],
    OCEANIA: ['Aroha', 'Tane', 'Moana', 'Koa', 'Leilani', 'Rangi', 'Hana', 'Kahu'],
    DEFAULT: ['Alexander', 'Sofia', 'Dmitri', 'Natasha', 'Ivan', 'Elena', 'Mikhail', 'Anastasia']
  };
  
  return names[zone] || names.DEFAULT;
}

/**
 * Generate dialogue for NPC
 */
function generateDialogue(profession: string, culturalZone: string, era: string): string[] {
  const prof = profession.toLowerCase();
  
  if (prof.includes('guard') || prof.includes('soldier')) {
    return [
      "Halt! State your business in the palace.",
      "Move along, citizen.",
      "The palace is secure, I assure you."
    ];
  } else if (prof.includes('noble') || prof.includes('courtier')) {
    return [
      "The court is abuzz with intrigue today.",
      "Have you heard the latest gossip from the throne room?",
      "One must always dress appropriately for palace life."
    ];
  } else if (prof.includes('merchant') || prof.includes('trader')) {
    return [
      "I have the finest goods from distant lands!",
      "Trade is the lifeblood of civilization.",
      "Perhaps we can strike a deal?"
    ];
  } else if (prof.includes('scholar') || prof.includes('philosopher')) {
    return [
      "Knowledge is the greatest treasure.",
      "Have you studied the ancient texts?",
      "The pursuit of wisdom never ends."
    ];
  }
  
  return [
    "Greetings, visitor.",
    "Welcome to this place.",
    "May your journey be prosperous."
  ];
}

/**
 * Generate personality traits
 */
function generatePersonality(noise: ValueNoise): any {
  const traits = [
    'friendly', 'suspicious', 'curious', 'proud', 'humble',
    'ambitious', 'cautious', 'bold', 'scholarly', 'practical'
  ];
  
  const selectedTraits = [];
  for (let i = 0; i < 2; i++) {
    const trait = traits[Math.floor(noise.random() * traits.length)];
    if (!selectedTraits.includes(trait)) {
      selectedTraits.push(trait);
    }
  }
  
  return {
    traits: selectedTraits,
    greed: noise.random(),
    honesty: noise.random(),
    bravery: noise.random(),
    intelligence: 0.5 + noise.random() * 0.5 // Elites are smarter
  };
}

/**
 * Normalize cultural zone string
 */
function normalizeZone(zone: string): string {
  const normalized = zone.toUpperCase().replace(/-/g, '_');
  
  // Map variations to standard zones
  if (normalized.includes('EUROPE')) return 'EUROPEAN';
  if (normalized.includes('ASIA') && !normalized.includes('SOUTH')) return 'EAST_ASIAN';
  if (normalized.includes('MIDDLE') || normalized.includes('MENA')) return 'MENA';
  if (normalized.includes('AFRICA')) return 'SUB_SAHARAN_AFRICAN';
  if (normalized.includes('SOUTH_ASIA')) return 'SOUTH_ASIAN';
  if (normalized.includes('AMERICA')) return 'NATIVE_AMERICAN';
  if (normalized.includes('OCEAN')) return 'OCEANIA';
  
  return 'EUROPEAN'; // Default
}