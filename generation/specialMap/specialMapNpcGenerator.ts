/**
 * generation/specialMap/specialMapNpcGenerator.ts
 * Generates culturally and historically appropriate NPCs for special maps
 */

import { NpcEntity, HistoricalEra, CulturalZone, BiomeType } from '../../types';
import { SpecialMapArchetype, SpecialMapConfig, RoomDefinition, ProfessionCategory } from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';
import { generateBaseProfile } from '../common/npcUtils';
import { getProfessionsByCategory, getCategoryForProfession, getSocialClassForProfession } from '../../constants/specialMaps/professionMapping';
import { getApplicableRules, getHistoricalGenderRestriction, AccessRule } from '../../constants/specialMaps/historicalAccessRules';
import { PROFESSIONS } from '../../constants/characterData/professions';

/**
 * Check if a biome type blocks NPC placement
 */
function isBlockingTerrain(biome: BiomeType): boolean {
  const blockingBiomes = [
    BiomeType.WALL,
    BiomeType.OCEAN,
    BiomeType.LAKE,
    BiomeType.RIVER,
    BiomeType.PILLAR,
    BiomeType.COLUMN,
    BiomeType.STATUE,
    BiomeType.FOUNTAIN,
    BiomeType.ALTAR,
    BiomeType.SHRINE,
    BiomeType.TABLE,
    BiomeType.DESK,
    BiomeType.BED,
    BiomeType.THRONE,
    BiomeType.BOOKSHELF,
    BiomeType.CABINET,
    BiomeType.CHEST,
    BiomeType.BARREL
  ];
  
  return blockingBiomes.includes(biome);
}

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
      { profession: 'MAGISTRATE', count: 1 },
      { profession: 'SCRIBE', count: 2 },
      { profession: 'ADVOCATE', count: 1 },
      { profession: 'LICTOR', count: 1 }
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
 * Generate NPCs for a special map with room awareness
 */
export function generateSpecialMapNpcs(
  config: SpecialMapConfig,
  mapSize: { width: number, height: number },
  noise: ValueNoise,
  tiles: any[][],
  rooms: RoomDefinition[]
): NpcEntity[] {
  const npcs: NpcEntity[] = [];
  let npcId = 1000; // Start with high ID to avoid conflicts
  
  // Special case: No NPCs on vessels (just the player)
  if (config.archetype === SpecialMapArchetype.VESSEL) {
    return [];
  }
  
  // LIMIT: Maximum 10 NPCs per special map
  const MAX_NPCS_PER_MAP = 10;
  const RESERVED_GUARDS = 2; // Always have 2 guards at main entrance
  const MAX_REGULAR_NPCS = MAX_NPCS_PER_MAP - RESERVED_GUARDS;
  
  // If no rooms defined, fall back to old system
  if (!rooms || rooms.length === 0) {
    const legacyNpcs = generateLegacyNpcs(config, mapSize, noise, tiles);
    // Limit legacy NPCs too
    return legacyNpcs.slice(0, MAX_NPCS_PER_MAP);
  }
  
  // First, generate the 2 guards for the main entrance
  const entranceGuards = generateEntranceGuards(config, tiles, noise, npcId);
  npcs.push(...entranceGuards);
  npcId += entranceGuards.length;
  
  // Generate NPCs for each room (limited)
  let regularNpcCount = 0;
  for (const room of rooms) {
    if (regularNpcCount >= MAX_REGULAR_NPCS) break;
    
    const roomNpcs = generateNpcsForRoom(
      room,
      config,
      tiles,
      noise,
      npcId
    );
    
    // Only add as many NPCs as we have room for
    const npcsToAdd = Math.min(roomNpcs.length, MAX_REGULAR_NPCS - regularNpcCount);
    npcs.push(...roomNpcs.slice(0, npcsToAdd));
    regularNpcCount += npcsToAdd;
    npcId += npcsToAdd;
  }
  
  // Skip wandering NPCs if we're at the limit
  if (regularNpcCount < MAX_REGULAR_NPCS) {
    const wanderingNpcs = generateWanderingNpcs(
      config,
      tiles,
      rooms,
      noise,
      npcId,
      MAX_REGULAR_NPCS - regularNpcCount // Only add remaining slots
    );
    npcs.push(...wanderingNpcs);
  }
  
  return npcs;
}

/**
 * Generate NPCs for a specific room
 */
function generateNpcsForRoom(
  room: RoomDefinition,
  config: SpecialMapConfig,
  tiles: any[][],
  noise: ValueNoise,
  startId: number
): NpcEntity[] {
  const npcs: NpcEntity[] = [];
  
  // Get historical rules for this room
  const rules = getApplicableRules(
    config.archetype,
    room.roomType,
    config.culturalZone as CulturalZone,
    config.era as HistoricalEra,
    config.specificYear
  );
  
  // Determine NPC count based on room size and density
  const npcCount = calculateNpcCount(room);
  
  // Get appropriate professions for this room
  const professions = selectProfessionsForRoom(
    room,
    config,
    rules
  );
  
  if (professions.length === 0) {
    return []; // No valid professions for this room
  }
  
  // Find valid positions within room bounds
  const positions = findValidPositionsInRoom(
    tiles,
    room.bounds,
    npcCount
  );
  
  // Create NPCs
  for (let i = 0; i < Math.min(npcCount, positions.length); i++) {
    const profession = professions[i % professions.length];
    const npc = createRoomAppropriateNpc(
      startId + i,
      profession,
      positions[i],
      config,
      rules,
      room,
      noise
    );
    if (npc) {
      npcs.push(npc);
    }
  }
  
  return npcs;
}

/**
 * Select appropriate professions for a room
 */
function selectProfessionsForRoom(
  room: RoomDefinition,
  config: SpecialMapConfig,
  rules: AccessRule | null
): string[] {
  // First try to get room-appropriate professions
  let availableProfessions = getRoomAppropriateProfessions(room, config);
  
  // If no room-specific professions, fall back to filters
  if (availableProfessions.length === 0 && room.professionFilter) {
    // Whitelist takes priority
    if (room.professionFilter.whitelist && room.professionFilter.whitelist.length > 0) {
      availableProfessions = [...room.professionFilter.whitelist];
    } else if (room.professionFilter.category) {
      // Get professions by category
      for (const category of room.professionFilter.category) {
        const catProfs = getProfessionsByCategory(
          category,
          config.culturalZone as CulturalZone,
          config.era as HistoricalEra
        );
        availableProfessions.push(...catProfs);
      }
    }
    
    // Remove blacklisted
    if (room.professionFilter.blacklist) {
      availableProfessions = availableProfessions.filter(
        p => !room.professionFilter!.blacklist!.includes(p)
      );
    }
  }
  
  // Apply historical rules if they exist
  if (rules) {
    if (rules.specificProfessions && rules.specificProfessions.length > 0) {
      // If rules specify professions, use only those that overlap
      availableProfessions = availableProfessions.filter(
        p => rules.specificProfessions!.includes(p)
      );
      // If no overlap, use rule's professions
      if (availableProfessions.length === 0) {
        availableProfessions = [...rules.specificProfessions];
      }
    }
    
    if (rules.professionCategories) {
      // Filter by categories from rules
      const allowedFromCategories: string[] = [];
      for (const category of rules.professionCategories) {
        const catProfs = getProfessionsByCategory(
          category,
          config.culturalZone as CulturalZone,
          config.era as HistoricalEra
        );
        allowedFromCategories.push(...catProfs);
      }
      if (availableProfessions.length > 0) {
        availableProfessions = availableProfessions.filter(
          p => allowedFromCategories.includes(p)
        );
      } else {
        availableProfessions = allowedFromCategories;
      }
    }
  }
  
  // Apply social class filter
  if (room.allowedSocialClasses && room.allowedSocialClasses.length > 0) {
    availableProfessions = availableProfessions.filter(prof => {
      const socialClass = getSocialClassForProfession(
        prof,
        config.culturalZone as CulturalZone,
        config.era as HistoricalEra
      );
      return socialClass && room.allowedSocialClasses!.includes(socialClass);
    });
  }
  
  // If no professions found, use defaults based on room type
  if (availableProfessions.length === 0) {
    switch (room.roomType) {
      case 'throne_room':
        availableProfessions = ['Noble', 'Guard', 'Courtier'];
        break;
      case 'marketplace':
        availableProfessions = ['Merchant', 'Trader', 'Customer'];
        break;
      case 'sanctuary':
        availableProfessions = ['Priest', 'Monk', 'Pilgrim'];
        break;
      case 'barracks':
        availableProfessions = ['Soldier', 'Guard'];
        break;
      case 'library':
        availableProfessions = ['Scholar', 'Scribe', 'Student'];
        break;
      default:
        availableProfessions = ['Citizen', 'Worker'];
    }
  }
  
  return availableProfessions;
}

/**
 * Calculate number of NPCs for a room
 */
function calculateNpcCount(room: RoomDefinition): number {
  const area = room.bounds.width * room.bounds.height;
  const densityMap = {
    'empty': 0,
    'sparse': 0.02,
    'normal': 0.05,
    'crowded': 0.1
  };
  
  const density = densityMap[room.npcDensity || 'normal'];
  let count = Math.floor(area * density);
  
  // Minimum NPCs for certain room types
  if (room.roomType === 'throne_room' && count < 3) {
    count = 3; // At least ruler + 2 guards
  } else if (room.roomType === 'assembly' && count < 5) {
    count = 5; // At least 5 assembly members
  } else if (room.roomType === 'marketplace' && count < 3) {
    count = 3; // At least 3 merchants
  }
  
  // Maximum cap - reduced for performance and focus
  return Math.min(count, 3); // Max 3 NPCs per room to stay under total limit
}

/**
 * Find valid positions within a room
 */
function findValidPositionsInRoom(
  tiles: any[][],
  bounds: { x: number, y: number, width: number, height: number },
  count: number
): { x: number, y: number }[] {
  const positions: { x: number, y: number }[] = [];
  const attempts = count * 10;
  
  for (let i = 0; i < attempts && positions.length < count; i++) {
    const x = bounds.x + 1 + Math.floor(Math.random() * (bounds.width - 2));
    const y = bounds.y + 1 + Math.floor(Math.random() * (bounds.height - 2));
    
    // Check if position is valid
    if (tiles[y] && tiles[y][x] && isWalkableTile(tiles[y][x])) {
      // Check not too close to other NPCs
      const tooClose = positions.some(pos => 
        Math.abs(pos.x - x) < 2 && Math.abs(pos.y - y) < 2
      );
      
      if (!tooClose) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}

/**
 * Create an NPC appropriate for a specific room
 */
function createRoomAppropriateNpc(
  id: number,
  profession: string,
  position: { x: number, y: number },
  config: SpecialMapConfig,
  rules: AccessRule | null,
  room: RoomDefinition,
  noise: ValueNoise
): NpcEntity | null {
  // Generate base profile
  const baseProfile = generateBaseProfile(noise, {
    era: config.era as HistoricalEra,
    culturalZone: normalizeZone(config.culturalZone) as CulturalZone,
    region: config.region || config.culturalZone
  });
  
  if (!baseProfile) return null;
  
  // Determine gender based on restrictions
  let gender = baseProfile.gender;
  if (room.genderRestriction && room.genderRestriction !== 'any') {
    gender = room.genderRestriction === 'male' ? 'Male' : 'Female';
  } else if (rules?.genderRestriction) {
    gender = rules.genderRestriction === 'male' ? 'Male' : 'Female';
  } else {
    // Check historical gender restriction for profession
    const historicalGender = getHistoricalGenderRestriction(
      profession,
      config.culturalZone as CulturalZone,
      config.era as HistoricalEra,
      config.specificYear
    );
    if (historicalGender !== 'any') {
      gender = historicalGender === 'male' ? 'Male' : 'Female';
    }
  }
  
  // Update appearance if gender changed
  if (gender !== baseProfile.gender) {
    const newProfile = generateBaseProfile(noise, {
      era: config.era as HistoricalEra,
      culturalZone: normalizeZone(config.culturalZone) as CulturalZone,
      region: config.region || config.culturalZone
    });
    if (newProfile) {
      baseProfile.appearance = newProfile.appearance;
    }
  }
  
  const age = getAgeForProfession(profession, noise);
  const names = getNamesByProfession(profession, config.culturalZone);
  const firstName = names[Math.floor(noise.random() * names.length)];
  const lastName = getLastNameByCulture(config.culturalZone, noise);
  const fullName = `${firstName} ${lastName}`;
  
  // Get the social class from profession mapping
  const socialClass = getSocialClassForProfession(
    profession,
    normalizeZone(config.culturalZone) as CulturalZone,
    config.era as HistoricalEra
  ) || determineDefaultSocialClass(profession);
  
  // Get profession emoji
  const professionEmoji = getProfessionEmoji(profession, config.culturalZone, config.era);
  
  // Format role (human-readable profession)
  const role = formatProfessionAsRole(profession);
  
  // Generate descriptions
  const descriptions = generateNpcDescriptions(profession, age, gender, config.culturalZone);
  const backstory = generateBackstory(profession, age, config.culturalZone, config.era);
  
  return {
    id: `special_npc_${id}`,
    name: fullName,
    profession: profession.toLowerCase().replace(/_/g, ' '),
    class: socialClass,
    role: role,
    emoji: professionEmoji,
    x: position.x,
    y: position.y,
    health: {
      hp: 100,
      maxHp: 100,
      diseases: [],
      statusEffects: [],
      isImmune: false,
      temperature: 'normal',
      hydration: 'normal',
      energy: 'normal'
    },
    maxHealth: 100,
    dialogue: generateDialogue(profession, config.culturalZone, config.era),
    isAlive: true,
    faction: 'neutral',
    personality: generatePersonality(noise),
    attributes: [],
    inventory: [],
    reputation: 0,
    lastInteraction: null,
    memory: {},
    isSpecialMapNpc: true,
    descriptions: descriptions,
    backstory: backstory,
    
    // From base profile
    appearance: baseProfile.appearance,
    age: age,
    gender: gender,
    direction: 'down',
    walkFrame: 0,
    stats: baseProfile.stats,
    socialContext: baseProfile.socialContext,
    culturalZone: normalizeZone(config.culturalZone) as CulturalZone,
    wealthLevel: determineProfessionWealth(profession),
    religion: baseProfile.religion,
    
    // Movement and activity
    activity: 'idle',
    movement: { type: 'stationary' },
    targetX: position.x,
    targetY: position.y
  } as NpcEntity;
}

/**
 * Generate guards positioned near restricted areas instead of entrance
 */
function generateEntranceGuards(
  config: SpecialMapConfig,
  tiles: any[][],
  noise: ValueNoise,
  startId: number
): NpcEntity[] {
  const guards: NpcEntity[] = [];
  
  const mapHeight = tiles.length;
  const mapWidth = tiles[0]?.length || 0;
  const centerX = Math.floor(mapWidth / 2);
  const centerY = Math.floor(mapHeight / 2);
  
  // Position guards based on map archetype - near restricted zones
  let guardPositions: { x: number; y: number }[] = [];
  
  if (config.archetype === 'ESTATES' || config.archetype === 'GOVERNMENT_FORUM') {
    // Place guards at the boundary of the inner sanctum (center third)
    const innerBoundaryY = Math.floor(mapHeight * 0.65); // Bottom of restricted area
    
    // Guards at the entrance to restricted area
    guardPositions = [
      { x: centerX - 3, y: innerBoundaryY }, // Left guard at bottom of restricted area
      { x: centerX + 3, y: innerBoundaryY }  // Right guard at bottom of restricted area
    ];
  } else if (config.archetype === 'SACRED') {
    // Place guards near altar area (top center)
    const altarAreaY = Math.floor(mapHeight * 0.3); // Near altar but not blocking
    
    guardPositions = [
      { x: centerX - 4, y: altarAreaY }, // Left guard near altar
      { x: centerX + 4, y: altarAreaY }  // Right guard near altar
    ];
  } else if (config.archetype === 'MARKET') {
    // Place guards near valuable merchant areas (center)
    guardPositions = [
      { x: centerX - 5, y: centerY }, // Left patrol
      { x: centerX + 5, y: centerY }  // Right patrol
    ];
  } else {
    // Default: place near center area but not directly blocking
    guardPositions = [
      { x: centerX - 6, y: centerY + 3 },
      { x: centerX + 6, y: centerY + 3 }
    ];
  }
  
  // Select appropriate guard profession based on culture and era
  const guardProfession = getGuardProfession(config.culturalZone, config.era);
  
  guardPositions.forEach((pos, index) => {
    // Make sure position is valid
    if (pos.x >= 0 && pos.x < mapWidth && pos.y >= 0 && pos.y < mapHeight &&
        tiles[pos.y][pos.x] && !isBlockingTerrain(tiles[pos.y][pos.x].biome)) {
      
      const guard = createSpecialMapNpc(
        startId + index,
        guardProfession,
        pos,
        config.culturalZone as string,
        config.era as string,
        noise
      );
      
      // Make guards face toward restricted areas
      if (config.archetype === 'ESTATES' || config.archetype === 'GOVERNMENT_FORUM') {
        guard.direction = 'up'; // Face toward inner sanctum
      } else if (config.archetype === 'SACRED') {
        guard.direction = 'up'; // Face toward altar
      } else {
        guard.direction = index === 0 ? 'right' : 'left'; // Face inward
      }
      guard.movement = { type: 'stationary' };
      
      guards.push(guard);
    }
  });
  
  return guards;
}

/**
 * Get appropriate guard profession for culture and era
 */
function getGuardProfession(culturalZone: string, era: number): string {
  const zone = normalizeZone(culturalZone);
  
  if (era < 500) {
    // Antiquity
    if (zone === 'MENA') return 'Palace Guard';
    if (zone === 'EAST_ASIAN') return 'Imperial Guard';
    return 'Praetorian';
  } else if (era < 1000) {
    // Medieval
    if (zone === 'MENA') return 'Mamluk';
    if (zone === 'EAST_ASIAN') return 'Samurai';
    return 'Knight';
  } else if (era < 1500) {
    // Late Medieval/Renaissance
    if (zone === 'MENA') return 'Janissary';
    if (zone === 'EAST_ASIAN') return 'Samurai';
    return 'Guard Captain';
  } else if (era < 1900) {
    // Early Modern/Industrial
    return 'Guard';
  } else {
    // Modern
    return 'Security Officer';
  }
}

/**
 * Generate wandering NPCs for corridors and undefined spaces
 */
function generateWanderingNpcs(
  config: SpecialMapConfig,
  tiles: any[][],
  rooms: RoomDefinition[],
  noise: ValueNoise,
  startId: number,
  count: number
): NpcEntity[] {
  const npcs: NpcEntity[] = [];
  
  // Common wandering professions
  const wanderingProfessions = ['Guard', 'Servant', 'Messenger', 'Visitor', 'Pilgrim'];
  
  for (let i = 0; i < count; i++) {
    // Find position not in any room
    const position = findPositionOutsideRooms(tiles, rooms, noise);
    if (position) {
      const profession = wanderingProfessions[Math.floor(noise.random() * wanderingProfessions.length)];
      const npc = createSpecialMapNpc(
        startId + i,
        profession,
        position,
        config.culturalZone,
        config.era,
        noise
      );
      if (npc) {
        npcs.push(npc);
      }
    }
  }
  
  return npcs;
}

/**
 * Find position outside of defined rooms
 */
function findPositionOutsideRooms(
  tiles: any[][],
  rooms: RoomDefinition[],
  noise: ValueNoise
): { x: number, y: number } | null {
  const maxAttempts = 50;
  
  for (let i = 0; i < maxAttempts; i++) {
    const x = 2 + Math.floor(noise.random() * (tiles[0].length - 4));
    const y = 2 + Math.floor(noise.random() * (tiles.length - 4));
    
    // Check if walkable
    if (!tiles[y] || !tiles[y][x] || !isWalkableTile(tiles[y][x])) {
      continue;
    }
    
    // Check if inside any room
    const insideRoom = rooms.some(room => 
      x >= room.bounds.x && 
      x < room.bounds.x + room.bounds.width &&
      y >= room.bounds.y && 
      y < room.bounds.y + room.bounds.height
    );
    
    if (!insideRoom) {
      return { x, y };
    }
  }
  
  return null;
}

/**
 * Legacy NPC generation (fallback)
 */
function generateLegacyNpcs(
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
      npcTemplates = getGovernmentNpcs(config.culturalZone, config.era, config.mapSize);
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
    case SpecialMapArchetype.UNIVERSITY:
      npcTemplates = getAcademicNpcs(config.culturalZone, config.era);
      break;
    default:
      npcTemplates = getDefaultNpcs(config.culturalZone, config.era);
  }
  
  // Generate NPCs based on templates
  let npcId = 1000;
  
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
        if (npc) {
          npcs.push(npc);
        }
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
function getGovernmentNpcs(culturalZone: string, era: string, mapSize?: string): { profession: string, count: number }[] {
  const zone = normalizeZone(culturalZone);
  const govNpcs = GOVERNMENT_NPCS[zone]?.[era];
  
  // Determine NPC count multiplier based on map size
  let multiplier = 1;
  switch (mapSize) {
    case 'xs':
    case 'small':
      multiplier = 0.6; // 3-4 NPCs
      break;
    case 'medium':
      multiplier = 0.8; // 4-5 NPCs
      break;
    case 'large':
      multiplier = 1.2; // 6-8 NPCs
      break;
    case 'xl':
      multiplier = 1.5; // 8-12 NPCs
      break;
    default:
      multiplier = 0.8;
  }
  
  let templates: { profession: string, count: number }[];
  
  if (govNpcs) {
    templates = govNpcs.map(npc => ({
      profession: npc.profession,
      count: Math.max(1, Math.round(npc.count * multiplier))
    }));
  } else {
    // Default fallback
    templates = [
      { profession: 'BUREAUCRAT', count: Math.max(1, Math.round(2 * multiplier)) },
      { profession: 'CLERK', count: Math.max(1, Math.round(2 * multiplier)) },
      { profession: 'GUARD', count: Math.max(1, Math.round(1 * multiplier)) }
    ];
  }
  
  // Cap total NPCs to prevent overcrowding
  const totalNpcs = templates.reduce((sum, template) => sum + template.count, 0);
  const maxNpcs = mapSize === 'xs' || mapSize === 'small' ? 5 : 
                  mapSize === 'medium' ? 8 :
                  mapSize === 'large' ? 12 : 15;
  
  if (totalNpcs > maxNpcs) {
    const scaleFactor = maxNpcs / totalNpcs;
    templates = templates.map(template => ({
      profession: template.profession,
      count: Math.max(1, Math.round(template.count * scaleFactor))
    }));
  }
  
  return templates;
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
  const firstName = names[Math.floor(noise.random() * names.length)];
  const lastName = getLastNameByCulture(culturalZone, noise);
  const fullName = `${firstName} ${lastName}`;
  
  // Generate base profile with appearance
  const baseProfile = generateBaseProfile(noise, {
    era: era as HistoricalEra,
    culturalZone: normalizeZone(culturalZone) as CulturalZone,
    region: culturalZone
  });
  
  // Select age based on profession
  const age = getAgeForProfession(profession, noise);
  
  // Get the social class from profession mapping
  const socialClass = getSocialClassForProfession(
    profession,
    normalizeZone(culturalZone) as CulturalZone,
    era as HistoricalEra
  ) || determineDefaultSocialClass(profession);
  
  // Get profession emoji
  const professionEmoji = getProfessionEmoji(profession, culturalZone, era);
  
  // Format role (human-readable profession)
  const role = formatProfessionAsRole(profession);
  
  // Generate descriptions
  const descriptions = generateNpcDescriptions(profession, age, baseProfile.gender, culturalZone);
  const backstory = generateBackstory(profession, age, culturalZone, era);
  
  return {
    id: `special_npc_${id}`,
    name: fullName,
    profession: profession.toLowerCase().replace(/_/g, ' '),
    class: socialClass,
    role: role,
    emoji: professionEmoji,
    x: position.x,
    y: position.y,
    health: {
      hp: 100,
      maxHp: 100,
      diseases: [],
      statusEffects: [],
      isImmune: false,
      temperature: 'normal',
      hydration: 'normal',
      energy: 'normal'
    },
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
    isSpecialMapNpc: true,
    descriptions: descriptions,
    backstory: backstory,
    
    // Add appearance and other required fields from base profile
    appearance: baseProfile.appearance,
    age: age,
    gender: baseProfile.gender,
    direction: 'down',
    walkFrame: 0,
    stats: baseProfile.stats,
    socialContext: baseProfile.socialContext,
    culturalZone: normalizeZone(culturalZone) as CulturalZone,
    wealthLevel: determineProfessionWealth(profession),
    religion: baseProfile.religion,
    
    // Movement and activity
    activity: 'idle',
    movement: { type: 'stationary' },
    targetX: position.x,
    targetY: position.y
  } as NpcEntity;
}

/**
 * Get appropriate age for profession
 */
function getAgeForProfession(profession: string, noise: ValueNoise): number {
  const prof = profession.toLowerCase();
  
  // Young professions
  if (prof.includes('student') || prof.includes('page') || prof.includes('apprentice')) {
    return 15 + Math.floor(noise.random() * 10);
  }
  
  // Middle-aged professions
  if (prof.includes('merchant') || prof.includes('trader') || prof.includes('guard') || 
      prof.includes('soldier') || prof.includes('craftsman')) {
    return 25 + Math.floor(noise.random() * 20);
  }
  
  // Elder professions
  if (prof.includes('senator') || prof.includes('elder') || prof.includes('philosopher') || 
      prof.includes('vizier') || prof.includes('minister') || prof.includes('judge')) {
    return 45 + Math.floor(noise.random() * 20);
  }
  
  // Default adult age
  return 20 + Math.floor(noise.random() * 30);
}

/**
 * Determine wealth level based on profession
 */
function determineProfessionWealth(profession: string): string {
  const prof = profession.toLowerCase();
  
  if (prof.includes('noble') || prof.includes('duke') || prof.includes('duchess') || 
      prof.includes('patrician') || prof.includes('aristocrat') || prof.includes('king') ||
      prof.includes('queen') || prof.includes('prince') || prof.includes('emir') ||
      prof.includes('pasha') || prof.includes('sheikh')) {
    return 'wealthy';
  }
  
  if (prof.includes('merchant') || prof.includes('trader') || prof.includes('official') ||
      prof.includes('minister') || prof.includes('magistrate') || prof.includes('scholar')) {
    return 'comfortable';
  }
  
  if (prof.includes('guard') || prof.includes('soldier') || prof.includes('clerk') ||
      prof.includes('craftsman') || prof.includes('artisan')) {
    return 'modest';
  }
  
  if (prof.includes('servant') || prof.includes('worker') || prof.includes('peasant')) {
    return 'poor';
  }
  
  return 'modest';
}

/**
 * Get professions appropriate for specific room types
 */
function getRoomAppropriateProfessions(
  room: RoomDefinition,
  config: SpecialMapConfig
): string[] {
  const { roomType } = room;
  const { culturalZone, era } = config;
  
  // Map room types to appropriate professions
  const roomProfessionMap: Record<string, string[]> = {
    // Government rooms
    'assembly': ['Senator', 'Minister', 'Official', 'Clerk', 'Scribe'],
    'senator_office': ['Senator', 'Minister', 'Official', 'Secretary'],
    'clerk_office': ['Clerk', 'Scribe', 'Secretary', 'Bureaucrat'],
    'committee_room': ['Official', 'Minister', 'Advisor', 'Scholar'],
    'press_room': ['Scribe', 'Herald', 'Messenger', 'Clerk'],
    
    // Security rooms
    'guard_booth': ['Guard', 'Soldier', 'Security', 'Watchman'],
    'security_checkpoint': ['Guard', 'Inspector', 'Officer'],
    'armory': ['Guard', 'Quartermaster', 'Armorer'],
    
    // Service rooms
    'kitchen': ['Cook', 'Chef', 'Servant', 'Kitchen Staff'],
    'bathroom': [], // Usually empty
    'janitor_closet': ['Janitor', 'Cleaner', 'Servant'],
    'storage': ['Clerk', 'Quartermaster', 'Worker'],
    'coat_room': ['Attendant', 'Servant'],
    
    // Public spaces
    'foyer': ['Receptionist', 'Guard', 'Clerk', 'Guide'],
    'atrium': ['Guard', 'Visitor', 'Official', 'Clerk'],
    'waiting_room': ['Clerk', 'Visitor', 'Petitioner'],
    'reception': ['Receptionist', 'Secretary', 'Clerk'],
    
    // Dining/social
    'restaurant': ['Cook', 'Waiter', 'Server', 'Chef'],
    'dining_hall': ['Servant', 'Server', 'Cook'],
    'break_room': ['Staff', 'Worker', 'Clerk'],
    
    // Archives/records
    'archive': ['Archivist', 'Librarian', 'Scholar', 'Scribe'],
    'library': ['Librarian', 'Scholar', 'Scribe', 'Student'],
    
    // Default for unspecified rooms
    'corridor': ['Guard', 'Servant', 'Messenger'],
    'hall': ['Guard', 'Official', 'Visitor'],
    'chamber': ['Official', 'Clerk', 'Secretary']
  };
  
  // Get base professions for room type
  let professions = roomProfessionMap[roomType] || ['Citizen', 'Worker'];
  
  // Apply room's profession filter if specified
  if (room.professionFilter) {
    if (room.professionFilter.whitelist) {
      professions = room.professionFilter.whitelist;
    } else if (room.professionFilter.blacklist) {
      professions = professions.filter(p => 
        !room.professionFilter!.blacklist!.includes(p)
      );
    }
  }
  
  // Filter by era appropriateness
  professions = filterProfessionsByEra(professions, era);
  
  return professions;
}

/**
 * Filter professions by historical era
 */
function filterProfessionsByEra(professions: string[], era: HistoricalEra): string[] {
  const modernProfessions = ['Secretary', 'Receptionist', 'Security', 'Janitor', 'Inspector'];
  const ancientProfessions = ['Scribe', 'Herald', 'Patrician', 'Senator'];
  
  if (era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) {
    // Remove modern professions
    professions = professions.filter(p => !modernProfessions.includes(p));
    
    // Replace with historical equivalents
    professions = professions.map(p => {
      if (p === 'Secretary') return 'Scribe';
      if (p === 'Receptionist') return 'Clerk';
      if (p === 'Security') return 'Guard';
      if (p === 'Janitor') return 'Servant';
      return p;
    });
  } else if (era === HistoricalEra.MODERN_ERA) {
    // Remove ancient professions
    professions = professions.filter(p => !ancientProfessions.includes(p));
    
    // Replace with modern equivalents
    professions = professions.map(p => {
      if (p === 'Scribe') return 'Secretary';
      if (p === 'Herald') return 'Messenger';
      if (p === 'Patrician') return 'Official';
      return p;
    });
  }
  
  return professions;
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
 * Get culturally appropriate last names
 */
function getLastNameByCulture(culturalZone: string, noise: ValueNoise): string {
  const zone = normalizeZone(culturalZone);
  
  const lastNames = {
    EUROPEAN: ['Aurelius', 'von Habsburg', 'de la Cruz', 'MacDonald', 'O\'Brien', 'Romano', 'Schneider'],
    EAST_ASIAN: ['Wang', 'Zhang', 'Tanaka', 'Kim', 'Nguyen', 'Chen', 'Yamamoto'],
    MENA: ['al-Rashid', 'ibn Khaldun', 'el-Masri', 'al-Hakim', 'ben Yusuf', 'al-Farabi'],
    SUB_SAHARAN_AFRICAN: ['Mbeki', 'Nkrumah', 'Okello', 'Diallo', 'Mensah', 'Kamara'],
    SOUTH_ASIAN: ['Sharma', 'Patel', 'Khan', 'Singh', 'Gupta', 'Reddy'],
    NATIVE_AMERICAN: ['Blackhawk', 'Running Bear', 'Silver Fox', 'White Eagle', 'Morning Star'],
    OCEANIA: ['Kahui', 'Tama', 'Aroha', 'Manu', 'Vega', 'Tui'],
    DEFAULT: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones']
  };
  
  const names = lastNames[zone] || lastNames.DEFAULT;
  return names[Math.floor(noise.random() * names.length)];
}

/**
 * Determine default social class based on profession
 */
function determineDefaultSocialClass(profession: string): string {
  const prof = profession.toLowerCase();
  
  if (prof.includes('noble') || prof.includes('duke') || prof.includes('duchess') || 
      prof.includes('lord') || prof.includes('lady') || prof.includes('prince')) {
    return 'NOBILITY';
  }
  if (prof.includes('merchant') || prof.includes('trader') || prof.includes('artisan')) {
    return 'MERCHANT';
  }
  if (prof.includes('priest') || prof.includes('monk') || prof.includes('imam')) {
    return 'CLERGY';
  }
  if (prof.includes('scholar') || prof.includes('scribe') || prof.includes('philosopher')) {
    return 'SCHOLAR';
  }
  
  return 'COMMONER';
}

/**
 * Get emoji for profession
 */
function getProfessionEmoji(profession: string, culturalZone: string, era: string): string {
  const prof = profession.toLowerCase();
  
  // Try to find from PROFESSIONS data structure
  const profData = PROFESSIONS[normalizeZone(culturalZone)]?.[era as HistoricalEra];
  if (profData) {
    for (const socialClass of Object.values(profData)) {
      if (typeof socialClass === 'object' && socialClass !== null) {
        for (const [profName, profDef] of Object.entries(socialClass)) {
          if (profName.toLowerCase() === prof && typeof profDef === 'object' && 'emoji' in profDef) {
            return (profDef as any).emoji;
          }
        }
      }
    }
  }
  
  // Fallback emojis based on profession type
  if (prof.includes('guard') || prof.includes('soldier') || prof.includes('knight')) return '⚔️';
  if (prof.includes('merchant') || prof.includes('trader')) return '💰';
  if (prof.includes('noble') || prof.includes('lord') || prof.includes('duke')) return '👑';
  if (prof.includes('priest') || prof.includes('monk') || prof.includes('imam')) return '📿';
  if (prof.includes('scholar') || prof.includes('philosopher')) return '📚';
  if (prof.includes('farmer') || prof.includes('peasant')) return '🌾';
  if (prof.includes('artisan') || prof.includes('craftsman')) return '🔨';
  if (prof.includes('servant')) return '🧹';
  
  return '👤'; // Default person emoji
}

/**
 * Format profession string as human-readable role
 */
function formatProfessionAsRole(profession: string): string {
  // Convert UPPER_SNAKE_CASE to Title Case
  return profession
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Generate NPC descriptions
 */
function generateNpcDescriptions(profession: string, age: number, gender: string, culturalZone: string): { short: string, long: string } {
  const ageDesc = age < 25 ? 'young' : age < 45 ? 'middle-aged' : 'elderly';
  const profDesc = formatProfessionAsRole(profession).toLowerCase();
  
  return {
    short: `A ${ageDesc} ${gender.toLowerCase()} ${profDesc}`,
    long: `This ${ageDesc} ${gender.toLowerCase()} serves as a ${profDesc} in the ${culturalZone.toLowerCase().replace(/_/g, ' ')} region. Their bearing suggests years of experience in their role.`
  };
}

/**
 * Generate backstory
 */
function generateBackstory(profession: string, age: number, culturalZone: string, era: string): string {
  const profDesc = formatProfessionAsRole(profession).toLowerCase();
  const years = Math.floor(age / 3); // Years of experience
  
  return `Has served as a ${profDesc} for ${years} years. Born and raised in the ${culturalZone.toLowerCase().replace(/_/g, ' ')} region during the ${era.toLowerCase().replace(/_/g, ' ')} era.`;
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
function normalizeZone(zone: any): string {
  // Handle undefined, null, or non-string input
  if (!zone || typeof zone !== 'string') {
    console.warn('[normalizeZone] Invalid zone input:', zone, 'defaulting to EUROPEAN');
    return 'EUROPEAN';
  }
  
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