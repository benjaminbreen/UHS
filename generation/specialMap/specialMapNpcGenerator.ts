/**
 * generation/specialMap/specialMapNpcGenerator.ts
 * Generates culturally and historically appropriate NPCs for special maps
 */

import { NpcEntity, HistoricalEra, CulturalZone, BiomeType, Gender } from '../../types';
import { SpecialMapArchetype, SpecialMapConfig, RoomDefinition, ProfessionCategory } from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';
import { generateBaseProfile, generateNpcName } from '../common/npcUtils';
import {
  getProfessionsByCategory,
  getCategoryForProfession,
  getSocialClassForProfession,
  getCultureDefaultProfessions
} from '../../constants/specialMaps/professionMapping';
import { getApplicableRules, getHistoricalGenderRestriction, AccessRule } from '../../constants/specialMaps/historicalAccessRules';
import { PROFESSIONS } from '../../constants/characterData/professions';
import { findMultipleValidPositions, isBlockingBiome, isWalkableBiome, findValidPosition } from '../common/npcPositionCalculator';
import { worldWeaverNpcService } from '../../services/worldWeaverNpcService';

// Track if we've assigned a ruler in throne rooms
let hasAssignedRuler = false;

/**
 * Get culturally and temporally appropriate professions for a room
 */
function getCulturallyAppropriateProfessions(
  culturalZone: CulturalZone,
  era: HistoricalEra,
  roomType: string,
  archetype: SpecialMapArchetype
): string[] {
  // Get all professions for this culture/era
  const cultureProfessions = PROFESSIONS[culturalZone]?.[era];
  if (!cultureProfessions) {
    console.warn(`No professions found for ${culturalZone}/${era}, using defaults`);
    return ['Worker', 'Citizen'];
  }

  // Collect all profession names from all social classes with their metadata
  const allProfessions: string[] = [];
  const professionsByPrivilege: { name: string; privilege: number }[] = [];
  
  Object.values(cultureProfessions).forEach((socialClass: any) => {
    if (typeof socialClass === 'object') {
      Object.keys(socialClass).forEach(profName => {
        if (!allProfessions.includes(profName)) {
          allProfessions.push(profName);
          const profDef = socialClass[profName];
          professionsByPrivilege.push({
            name: profName,
            privilege: profDef?.socialRequirements?.minPrivilege || 0
          });
        }
      });
    }
  });
  
  // Sort by privilege for better hierarchy
  professionsByPrivilege.sort((a, b) => b.privilege - a.privilege);

  // Filter by room type and archetype
  let filteredProfessions: string[] = [];

  // Government buildings and throne rooms
  if (archetype === SpecialMapArchetype.GOVERNMENT_FORUM || 
      archetype === SpecialMapArchetype.PALACE_COMPLEX ||
      roomType === 'throne_room' || 
      roomType === 'council_chamber' ||
      roomType === 'assembly') {
    
    // Look for leadership roles
    const leadershipKeywords = ['chief', 'king', 'emperor', 'ruler', 'lord', 'duke', 'prince', 
                                'sultan', 'shah', 'raja', 'daimyo', 'pharaoh', 'consul', 
                                'governor', 'magistrate', 'elder', 'headman'];
    const militaryKeywords = ['general', 'warrior', 'soldier', 'guard', 'captain', 'samurai'];
    const advisorKeywords = ['advisor', 'minister', 'councillor', 'vizier', 'mandarin', 'scribe', 
                             'herald', 'ambassador', 'diplomat'];
    
    // Priority 1: Leaders for throne rooms - ONLY ONE KING/EMPEROR
    if (roomType === 'throne_room') {
      // First try to find the highest ranking leader
      const topLeaders = professionsByPrivilege.filter(p => 
        leadershipKeywords.some(keyword => p.name.toLowerCase().includes(keyword)) &&
        p.privilege >= 0.7
      );
      
      if (topLeaders.length > 0) {
        // Take only the highest ranking leader
        filteredProfessions = [topLeaders[0].name];
        // Add supporting nobles/officials but not more kings
        const supporters = allProfessions.filter(p => {
          const lower = p.toLowerCase();
          return (advisorKeywords.some(k => lower.includes(k)) ||
                  lower.includes('noble') || lower.includes('courtier') ||
                  lower.includes('guard')) &&
                 !leadershipKeywords.some(k => lower.includes(k));
        });
        filteredProfessions.push(...supporters);
      } else {
        // Fallback to high-privilege professions
        filteredProfessions = professionsByPrivilege
          .filter(p => p.privilege >= 0.6)
          .map(p => p.name)
          .slice(0, 5);
      }
    }
    // Priority 2: Officials and advisors for council/assembly
    else if (roomType === 'council_chamber' || roomType === 'assembly') {
      filteredProfessions = allProfessions.filter(p => 
        advisorKeywords.some(keyword => p.toLowerCase().includes(keyword)) ||
        leadershipKeywords.some(keyword => p.toLowerCase().includes(keyword))
      );
    }
    // Priority 3: Mix of officials, guards, and clerks
    else {
      filteredProfessions = allProfessions.filter(p => 
        advisorKeywords.some(keyword => p.toLowerCase().includes(keyword)) ||
        militaryKeywords.some(keyword => p.toLowerCase().includes(keyword)) ||
        p.toLowerCase().includes('clerk') ||
        p.toLowerCase().includes('scribe')
      );
    }
  }

  // Religious buildings
  else if (archetype === SpecialMapArchetype.SACRED_COMPLEX ||
           roomType === 'shrine' || 
           roomType === 'sanctuary' ||
           roomType === 'altar') {
    
    const religiousKeywords = ['priest', 'monk', 'nun', 'cleric', 'imam', 'rabbi', 'shaman', 
                               'medicine', 'healer', 'oracle', 'prophet', 'tohunga', 'druid',
                               'ayatollah', 'bishop', 'cardinal', 'pope', 'lama', 'guru',
                               'brahmin', 'pandit', 'mullah', 'sufi', 'dervish', 'hermit'];
    
    filteredProfessions = allProfessions.filter(p => 
      religiousKeywords.some(keyword => p.toLowerCase().includes(keyword)) ||
      p.toLowerCase().includes('religious') ||
      p.toLowerCase().includes('holy') ||
      p.toLowerCase().includes('sacred')
    );

    // Add some pilgrims and devotees ONLY for religious buildings
    if (filteredProfessions.length > 0 && archetype === SpecialMapArchetype.SACRED_COMPLEX) {
      filteredProfessions.push('Pilgrim', 'Devotee', 'Acolyte');
    }
  }

  // Market buildings
  else if (archetype === SpecialMapArchetype.MARKETPLACE ||
           roomType === 'market' ||
           roomType === 'bazaar' ||
           roomType === 'shop') {
    
    const merchantKeywords = ['merchant', 'trader', 'vendor', 'seller', 'buyer', 'broker',
                             'craftsman', 'artisan', 'smith', 'weaver', 'potter', 'jeweler',
                             'baker', 'butcher', 'fishmonger', 'grocer', 'tailor'];
    
    filteredProfessions = allProfessions.filter(p => 
      merchantKeywords.some(keyword => p.toLowerCase().includes(keyword))
    );
  }

  // Military buildings
  else if (archetype === SpecialMapArchetype.MILITARY_FORTRESS ||
           archetype === SpecialMapArchetype.FORTRESS_COMMANDER_CHAMBER ||
           roomType === 'barracks' ||
           roomType === 'armory' ||
           roomType === 'military_command') {
    
    // For commander chambers, prioritize high-ranking military officials
    if (archetype === SpecialMapArchetype.FORTRESS_COMMANDER_CHAMBER || roomType === 'military_command') {
      const commanderKeywords = ['general', 'commander', 'captain', 'marshal', 'warlord', 'admiral',
                                 'colonel', 'major', 'brigadier', 'centurion', 'strategos'];
      
      filteredProfessions = allProfessions.filter(p => 
        commanderKeywords.some(keyword => p.toLowerCase().includes(keyword))
      );
      
      // If no commanders found, use high-ranking military titles
      if (filteredProfessions.length === 0) {
        filteredProfessions = ['Military Commander', 'Fortress Captain', 'War Chief'];
      }
    } else {
      const militaryKeywords = ['warrior', 'soldier', 'guard', 'captain', 'general', 'knight',
                               'samurai', 'archer', 'cavalry', 'infantry', 'scout', 'ranger'];
      
      filteredProfessions = allProfessions.filter(p => 
        militaryKeywords.some(keyword => p.toLowerCase().includes(keyword))
      );
    }
  }

  // Academic buildings
  else if (archetype === SpecialMapArchetype.ACADEMIC_INSTITUTION ||
           roomType === 'library' ||
           roomType === 'study') {
    
    const academicKeywords = ['scholar', 'scribe', 'teacher', 'professor', 'student', 'librarian',
                             'philosopher', 'mathematician', 'astronomer', 'alchemist', 'sage'];
    
    filteredProfessions = allProfessions.filter(p => 
      academicKeywords.some(keyword => p.toLowerCase().includes(keyword))
    );
  }

  // Default: common professions
  if (filteredProfessions.length === 0) {
    const commonKeywords = ['worker', 'servant', 'guard', 'clerk', 'messenger', 'attendant'];
    filteredProfessions = allProfessions.filter(p => 
      commonKeywords.some(keyword => p.toLowerCase().includes(keyword))
    );
    
    // Last resort: return some basic professions from the culture
    if (filteredProfessions.length === 0) {
      filteredProfessions = allProfessions.slice(0, 5);
    }
  }

  return filteredProfessions;
}

/**
 * Helper to find a profession definition in the nested structure
 */
function findProfessionDefinition(
  culturalZone: CulturalZone,
  era: HistoricalEra,
  professionName: string
): any {
  const cultureProfessions = PROFESSIONS[culturalZone]?.[era];
  if (!cultureProfessions) return null;

  for (const socialClass of Object.values(cultureProfessions)) {
    if (typeof socialClass === 'object' && socialClass[professionName]) {
      return socialClass[professionName];
    }
  }
  return null;
}

/**
 * Check if a position is near a throne
 */
function isNearThrone(x: number, y: number, tiles: any[][]): boolean {
  const checkRadius = 2; // Check within 2 tiles
  
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      const checkY = y + dy;
      const checkX = x + dx;
      
      if (checkY >= 0 && checkY < tiles.length && 
          checkX >= 0 && checkX < tiles[0].length) {
        if (tiles[checkY][checkX].biome === BiomeType.THRONE) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Get appropriate ruler profession for culture and era
 */
function getRulerProfession(culturalZone: string, era: string): string {
  const zone = normalizeZone(culturalZone);
  
  const rulerProfessions: Record<string, Record<string, string[]>> = {
    EUROPEAN: {
      ANTIQUITY: ['EMPEROR', 'CONSUL', 'DICTATOR'],
      MEDIEVAL: ['KING', 'QUEEN', 'DUKE', 'DUCHESS'],
      RENAISSANCE_EARLY_MODERN: ['KING', 'QUEEN', 'PRINCE', 'DUKE'],
      INDUSTRIAL_ERA: ['MONARCH', 'PRIME_MINISTER', 'PRESIDENT'],
      MODERN_ERA: ['PRESIDENT', 'PRIME_MINISTER', 'CHANCELLOR']
    },
    EAST_ASIAN: {
      ANTIQUITY: ['EMPEROR', 'KING'],
      MEDIEVAL: ['EMPEROR', 'SHOGUN', 'DAIMYO'],
      RENAISSANCE_EARLY_MODERN: ['EMPEROR', 'SHOGUN'],
      INDUSTRIAL_ERA: ['EMPEROR', 'REGENT'],
      MODERN_ERA: ['PRESIDENT', 'CHAIRMAN', 'PREMIER']
    },
    MENA: {
      ANTIQUITY: ['PHARAOH', 'KING'],
      MEDIEVAL: ['CALIPH', 'SULTAN', 'EMIR'],
      RENAISSANCE_EARLY_MODERN: ['SULTAN', 'PASHA', 'SHEIKH'],
      INDUSTRIAL_ERA: ['SULTAN', 'KING', 'EMIR'],
      MODERN_ERA: ['KING', 'PRESIDENT', 'EMIR']
    },
    SUB_SAHARAN_AFRICAN: {
      ANTIQUITY: ['CHIEF', 'KING'],
      MEDIEVAL: ['KING', 'EMPEROR', 'CHIEF'],
      RENAISSANCE_EARLY_MODERN: ['KING', 'CHIEF', 'SULTAN'],
      INDUSTRIAL_ERA: ['KING', 'CHIEF', 'PARAMOUNT_CHIEF'],
      MODERN_ERA: ['PRESIDENT', 'PRIME_MINISTER', 'CHIEF']
    },
    SOUTH_ASIAN: {
      ANTIQUITY: ['RAJA', 'MAHARAJA'],
      MEDIEVAL: ['SULTAN', 'RAJA', 'MAHARAJA'],
      RENAISSANCE_EARLY_MODERN: ['MUGHAL_EMPEROR', 'RAJA', 'NAWAB'],
      INDUSTRIAL_ERA: ['MAHARAJA', 'RAJA', 'VICEROY'],
      MODERN_ERA: ['PRESIDENT', 'PRIME_MINISTER']
    },
    NATIVE_AMERICAN: {
      ANTIQUITY: ['CHIEF', 'SACHEM', 'CACIQUE'],
      MEDIEVAL: ['CHIEF', 'SACHEM', 'TLATOANI'],
      RENAISSANCE_EARLY_MODERN: ['CHIEF', 'SACHEM', 'CACIQUE'],
      INDUSTRIAL_ERA: ['CHIEF', 'TRIBAL_CHAIRMAN'],
      MODERN_ERA: ['TRIBAL_CHAIRMAN', 'CHIEF', 'PRESIDENT']
    },
    OCEANIA: {
      ANTIQUITY: ['CHIEF', 'ALI\'I', 'ARIKI'],
      MEDIEVAL: ['CHIEF', 'KING', 'ALI\'I'],
      RENAISSANCE_EARLY_MODERN: ['CHIEF', 'KING', 'PARAMOUNT_CHIEF'],
      INDUSTRIAL_ERA: ['KING', 'QUEEN', 'CHIEF'],
      MODERN_ERA: ['PRESIDENT', 'PRIME_MINISTER', 'CHIEF']
    },
    DEFAULT: ['RULER', 'LEADER', 'CHIEF', 'GOVERNOR']
  };
  
  const eraKey = era.replace('HistoricalEra.', '').toUpperCase();
  const professions = rulerProfessions[zone]?.[eraKey] || rulerProfessions.DEFAULT;
  
  // Return a random ruler profession from the list
  return professions[Math.floor(Math.random() * professions.length)];
}

/**
 * Check if a biome type blocks NPC placement
 * @deprecated Use isBlockingBiome from npcPositionCalculator instead
 */
// Function removed - now using shared isBlockingBiome from npcPositionCalculator

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

  // Reset ruler assignment flag for each new map
  hasAssignedRuler = false;

  // Special case: No NPCs on vessels or campgrounds (just the player)
  if (config.archetype === SpecialMapArchetype.VESSEL || config.archetype === SpecialMapArchetype.CAMPGROUND) {
    return [];
  }

  // If we have a leader from the government modal, create them first
  if (config.authorityContext?.leader) {
    const leaderNpc = createLeaderNpc(
      config.authorityContext.leader,
      findBestPositionForLeader(rooms, tiles, mapSize, noise),
      config,
      npcId++
    );
    npcs.push(leaderNpc);
    hasAssignedRuler = true; // Mark that we've added the ruler
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
 * Load and add quest NPCs to an existing special map
 * Call this after generating the special map to add quest-related NPCs
 */
export async function addQuestNPCsToSpecialMap(
  npcs: NpcEntity[],
  tiles: any[][],
  rooms: RoomDefinition[],
  buildingId: string,
  culturalZone: string,
  era: string
): Promise<void> {
  console.log(`[SpecialMapNpcGenerator] Loading quest NPCs for building ${buildingId}`);

  try {
    const questNpcs = await worldWeaverNpcService.loadQuestNPCsForBuilding(
      buildingId,
      culturalZone,
      era
    );

    if (questNpcs.length > 0) {
      // Position quest NPCs in appropriate rooms using shared calculator
      for (const questNpc of questNpcs) {
        // If NPC doesn't have a position yet, find one
        if (!questNpc.x || !questNpc.y) {
          // Find an appropriate room (prefer public/common rooms for quest NPCs)
          const publicRoom = rooms.find(r =>
            r.purpose === 'gathering' || r.purpose === 'common' || r.purpose === 'entrance'
          ) || rooms[0];

          if (publicRoom) {
            const { x, y } = findValidPosition(
              publicRoom,
              tiles,
              { type: 'random' }
            );

            questNpc.x = x;
            questNpc.y = y;
          } else {
            console.warn(`[SpecialMapNpcGenerator] No suitable room found for quest NPC ${questNpc.name}`);
            continue;
          }
        }

        // Add to NPCs array
        npcs.push(questNpc);
      }

      console.log(`[SpecialMapNpcGenerator] Added ${questNpcs.length} quest NPCs to special map`);
    }
  } catch (error) {
    console.error(`[SpecialMapNpcGenerator] Error loading quest NPCs:`, error);
  }
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
  const { roomType } = room; // Destructure roomType for easier access
  const { archetype, culturalZone, era } = config; // Destructure config properties
  
  // Check for fixed NPC in customData (for commander chambers)
  if ((room as any).customData?.fixedNpc) {
    const fixedNpcData = (room as any).customData.fixedNpc;
    const fixedNpc = createRoomAppropriateNpc(
      startId,
      fixedNpcData.profession,
      fixedNpcData.position,
      config,
      null, // rules will be fetched in createRoomAppropriateNpc
      room,
      noise,
      tiles
    );
    if (fixedNpc) {
      // Mark as special/important NPC
      (fixedNpc as any).isCommander = fixedNpcData.isCommander || false;
      (fixedNpc as any).isFixedPosition = true;
      npcs.push(fixedNpc);
      return npcs; // For commander chamber, only return the fixed commander
    }
  }
  
  // Get historical rules for this room
  const rules = getApplicableRules(
    archetype,
    roomType,
    culturalZone as CulturalZone,
    era as HistoricalEra,
    config.specificYear
  );
  
  // Determine NPC count based on room size and density
  const npcCount = calculateNpcCount(room);
  
  // Get culturally appropriate professions for this room
  const professions = getCulturallyAppropriateProfessions(
    normalizeZone(culturalZone) as CulturalZone,
    era as HistoricalEra,
    roomType || 'default',
    archetype
  );
  
  if (professions.length === 0) {
    return []; // No valid professions for this room
  }
  
  // Find valid positions within room bounds (handle both formats)
  let bounds;
  if (room.bounds) {
    bounds = room.bounds;
  } else if ((room as any).x !== undefined) {
    // Legacy format from palaceVariantGenerator
    bounds = {
      x: (room as any).x,
      y: (room as any).y,
      width: (room as any).width,
      height: (room as any).height
    };
  } else {
    console.warn('[NPCGen] Room missing position data:', room);
    return [];
  }
  
  const positions = findValidPositionsInRoom(
    tiles,
    bounds,
    npcCount
  );
  
  // Sort positions by distance to room center for leadership placement
  const roomCenter = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  };
  
  const sortedPositions = [...positions].sort((a, b) => {
    const distA = Math.abs(a.x - roomCenter.x) + Math.abs(a.y - roomCenter.y);
    const distB = Math.abs(b.x - roomCenter.x) + Math.abs(b.y - roomCenter.y);
    return distA - distB;
  });

  // Identify the single highest ranking leader (if any)
  const kingKeywords = ['king', 'emperor', 'pharaoh', 'sultan', 'raja', 'chief', 'ruler'];
  const religiousLeaderKeywords = ['priest', 'imam', 'rabbi', 'tohunga', 'shaman'];
  
  let singleLeader: string | null = null;
  let hasAssignedSingleLeader = false;
  
  // For throne rooms and sacred sites, identify THE leader
  if (roomType === 'throne_room' || archetype === SpecialMapArchetype.SACRED_COMPLEX) {
    // Find the first (highest ranking) leader profession
    singleLeader = professions.find(p => {
      const lower = p.toLowerCase();
      if (archetype === SpecialMapArchetype.SACRED_COMPLEX) {
        return religiousLeaderKeywords.some(k => lower.includes(k));
      } else {
        return kingKeywords.some(k => lower.includes(k));
      }
    });
  }
  
  // Get non-leader professions
  const commonProfessions = professions.filter(p => p !== singleLeader);

  // Create NPCs
  for (let i = 0; i < Math.min(npcCount, sortedPositions.length); i++) {
    let profession: string;
    
    // Only assign the single leader to the most central position
    if (i === 0 && singleLeader && !hasAssignedSingleLeader) {
      profession = singleLeader;
      hasAssignedSingleLeader = true;
    } else if (commonProfessions.length > 0) {
      // All other positions get common professions
      profession = commonProfessions[i % commonProfessions.length];
    } else {
      // Fallback
      profession = professions[i % professions.length];
    }
    
    const npc = createRoomAppropriateNpc(
      startId + i,
      profession,
      sortedPositions[i],
      config,
      rules,
      room,
      noise,
      tiles
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
          culturalZone as CulturalZone,
          era as HistoricalEra
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
          culturalZone as CulturalZone,
          era as HistoricalEra
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
  
  // If no professions found, use culture-aware defaults
  if (availableProfessions.length === 0) {
    availableProfessions = getCultureDefaultProfessions(
      culturalZone,
      roomType
    );
    console.log(`[NPCGen] Using culture defaults for ${culturalZone}/${roomType}:`, availableProfessions);
  }
  
  return availableProfessions;
}

/**
 * Calculate number of NPCs for a room
 */
function calculateNpcCount(room: RoomDefinition): number {
  const { roomType } = room; // Destructure roomType for easier access
  
  // Handle both formats: room.bounds.x and room.x
  let width: number, height: number;
  
  if (room.bounds) {
    width = room.bounds.width;
    height = room.bounds.height;
  } else if ((room as any).width !== undefined && (room as any).height !== undefined) {
    // Legacy format from palaceVariantGenerator
    width = (room as any).width;
    height = (room as any).height;
  } else {
    console.warn('[NPCGen] Room missing dimensions:', room);
    return 0;
  }
  
  const area = width * height;
  const densityMap = {
    'empty': 0,
    'sparse': 0.02,
    'normal': 0.05,
    'crowded': 0.1
  };
  
  const density = densityMap[room.npcDensity || 'normal'];
  let count = Math.floor(area * density);
  
  // Minimum NPCs for certain room types
  if (roomType === 'throne_room' && count < 3) {
    count = 3; // At least ruler + 2 guards
  } else if (roomType === 'assembly' && count < 5) {
    count = 5; // At least 5 assembly members
  } else if (roomType === 'marketplace' && count < 3) {
    count = 3; // At least 3 merchants
  }
  
  // Maximum cap - reduced for performance and focus
  return Math.min(count, 3); // Max 3 NPCs per room to stay under total limit
}

/**
 * Find valid positions within a room using shared position calculator
 */
function findValidPositionsInRoom(
  tiles: any[][],
  bounds: { x: number, y: number, width: number, height: number },
  count: number
): { x: number, y: number }[] {
  // Use shared calculator with special map format
  // Wrap bounds in expected format for npcPositionCalculator
  const room = { bounds };

  return findMultipleValidPositions(
    room,
    tiles,
    count,
    2  // minDistance = 2 (matches original behavior)
  );
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
  noise: ValueNoise,
  tiles?: any[][]
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
  
  // DEBUG: Log what values we're actually using for name generation
  const normalizedZone = normalizeZone(config.culturalZone);
  console.log('===== NPC NAME GENERATION DEBUG =====');
  console.log('Original culturalZone:', config.culturalZone);
  console.log('Normalized zone:', normalizedZone);
  console.log('Region:', config.region);
  console.log('Year:', config.specificYear || 1500);
  console.log('Profession:', profession);
  console.log('Gender:', gender);
  
  // Use the proper name generation system that handles regional/temporal specificity
  const fullName = generateNpcName(
    gender as Gender,
    normalizedZone as CulturalZone,
    config.region || config.culturalZone,
    config.specificYear || 1500,
    noise
    // Don't pass profession as professionNameKey - let it use cultural zone names
  );
  
  console.log('Generated name:', fullName);
  console.log('===== END DEBUG =====');
  
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
        tiles[pos.y][pos.x] && !isBlockingBiome(tiles[pos.y][pos.x].biome)) {
      
      const guard = createSpecialMapNpc(
        startId + index,
        guardProfession,
        pos,
        config.culturalZone as string,
        config.era as string,
        noise,
        config.region,
        config.specificYear
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
    // Modern - use Guard instead of Security Officer for consistency
    return 'Guard';
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
        noise,
        config.region,
        config.specificYear
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
    
    // Check if inside any room (handle both formats)
    const insideRoom = rooms.some(room => {
      if (room.bounds) {
        return x >= room.bounds.x && 
               x < room.bounds.x + room.bounds.width &&
               y >= room.bounds.y && 
               y < room.bounds.y + room.bounds.height;
      } else if ((room as any).x !== undefined) {
        // Legacy format
        return x >= (room as any).x && 
               x < (room as any).x + (room as any).width &&
               y >= (room as any).y && 
               y < (room as any).y + (room as any).height;
      }
      return false;
    });
    
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
    case SpecialMapArchetype.ESTATES:  // ESTATES should use palace NPCs too!
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
    case SpecialMapArchetype.WORKSHOP:
      npcTemplates = getWorkshopNpcs(config.culturalZone, config.era, config);
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
          noise,
          config.region,
          config.specificYear
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
    { profession: 'MERCHANT', count: 3 },
    { profession: 'TRADER', count: 2 },
    { profession: 'ARTISAN', count: 2 },
    { profession: 'GUARD', count: 1 },
    // Always include elite NPCs
    { profession: 'NOBLE', count: 1 },
    { profession: 'WEALTHY_MERCHANT', count: 1 }
  ];
}

/**
 * Get sacred complex NPCs
 */
function getSacredNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  const zone = normalizeZone(culturalZone);
  
  if (zone === 'EUROPEAN') {
    return [
      { profession: 'PRIEST', count: 2 },
      { profession: 'MONK', count: 2 },
      { profession: 'PILGRIM', count: 1 },
      // Elite religious figures
      { profession: 'BISHOP', count: 1 },
      { profession: 'NOBLE', count: 1 }
    ];
  } else if (zone === 'MENA') {
    return [
      { profession: 'IMAM', count: 2 },
      { profession: 'MUEZZIN', count: 1 },
      { profession: 'SCHOLAR', count: 1 },
      { profession: 'PILGRIM', count: 1 },
      // Elite religious figures
      { profession: 'MUFTI', count: 1 },
      { profession: 'NOBLE', count: 1 }
    ];
  } else if (zone === 'EAST_ASIAN') {
    return [
      { profession: 'MONK', count: 2 },
      { profession: 'PRIEST', count: 1 },
      { profession: 'PILGRIM', count: 1 },
      // Elite religious figures
      { profession: 'ABBOT', count: 1 },
      { profession: 'NOBLE', count: 1 }
    ];
  }
  
  return [
    { profession: 'PRIEST', count: 2 },
    { profession: 'DEVOTEE', count: 2 },
    // Elite religious figures
    { profession: 'HIGH_PRIEST', count: 1 },
    { profession: 'NOBLE', count: 1 }
  ];
}

/**
 * Get military NPCs
 */
function getMilitaryNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'SOLDIER', count: 3 },
    { profession: 'OFFICER', count: 2 },
    { profession: 'GUARD', count: 2 },
    { profession: 'QUARTERMASTER', count: 1 },
    // Elite military figures
    { profession: 'GENERAL', count: 1 },
    { profession: 'NOBLE', count: 1 }
  ];
}

/**
 * Get academic NPCs
 */
function getAcademicNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'SCHOLAR', count: 3 },
    { profession: 'STUDENT', count: 2 },
    { profession: 'LIBRARIAN', count: 1 },
    // Elite academic figures
    { profession: 'PROFESSOR', count: 1 },
    { profession: 'NOBLE', count: 1 },
    { profession: 'PHILOSOPHER', count: 1 }
  ];
}

/**
 * Get workshop NPCs based on business type
 */
function getWorkshopNpcs(culturalZone: string, era: string, config: SpecialMapConfig): { profession: string, count: number }[] {
  // Extract business type from config (passed from CityModal)
  const businessType = (config as any).businessType || 'workshop';
  const businessLower = businessType.toLowerCase();

  // Determine appropriate craftsman based on business type
  // Using generic terms that are more likely to exist in PROFESSIONS data
  let mainCraftsman = 'Craftsman'; // Default (note: using capitalized for better matching)
  let apprentices = 'Apprentice';

  // Try to find specific craftsmen in the actual professions data
  // These are more generic terms that cultures are likely to have
  if (businessLower.includes('smith') || businessLower.includes('forge') || businessLower.includes('metal')) {
    mainCraftsman = 'Blacksmith';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('potter') || businessLower.includes('ceramic') || businessLower.includes('clay')) {
    mainCraftsman = 'Potter';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('weav') || businessLower.includes('textile') || businessLower.includes('cloth')) {
    mainCraftsman = 'Weaver';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('baker') || businessLower.includes('bread') || businessLower.includes('pastry')) {
    mainCraftsman = 'Baker';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('carpenter') || businessLower.includes('wood') || businessLower.includes('furniture')) {
    mainCraftsman = 'Carpenter';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('jewel') || businessLower.includes('gem')) {
    mainCraftsman = 'Jeweler';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('leather') || businessLower.includes('tanner')) {
    mainCraftsman = 'Leatherworker';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('tailor') || businessLower.includes('seamstress')) {
    mainCraftsman = 'Tailor';
    apprentices = 'Apprentice';
  } else if (businessLower.includes('merchant') || businessLower.includes('trader')) {
    mainCraftsman = 'Merchant';
    apprentices = 'Clerk';
  }

  // Check if owner was provided (from CityModal)
  const owner = (config as any).owner;
  const ownerName = owner?.name || (config as any).ownerName;
  const ownerWealth = (config as any).wealthLevel || (config as any).ownerWealth || 'modest';

  // Determine shop size based on wealth level
  if (ownerWealth === 'wealthy') {
    // Wealthy shop - master craftsman + 2 apprentices/workers
    return [
      { profession: mainCraftsman, count: 1 },
      { profession: apprentices, count: 1 },
      { profession: 'Worker', count: 1 }
    ];
  } else if (ownerWealth === 'comfortable') {
    // Comfortable shop - craftsman + apprentice
    return [
      { profession: mainCraftsman, count: 1 },
      { profession: apprentices, count: 1 }
    ];
  } else {
    // Modest/poor shop - just the craftsman
    return [
      { profession: mainCraftsman, count: 1 }
    ];
  }
}

/**
 * Get default NPCs
 */
function getDefaultNpcs(culturalZone: string, era: string): { profession: string, count: number }[] {
  return [
    { profession: 'CITIZEN', count: 2 },
    { profession: 'WORKER', count: 1 },
    { profession: 'GUARD', count: 1 },
    // Elite figures for any special map
    { profession: 'NOBLE', count: 1 },
    { profession: 'WEALTHY_MERCHANT', count: 1 }
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
 * Check if tile is walkable using shared calculator
 */
function isWalkableTile(tile: any): boolean {
  if (!tile || !tile.biome) return false;

  // Use shared calculator for comprehensive walkability check
  return isWalkableBiome(tile.biome) && !isBlockingBiome(tile.biome);
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
  noise: ValueNoise,
  region?: string,
  year?: number
): NpcEntity {
  // Generate base profile with appearance first to get gender
  const baseProfile = generateBaseProfile(noise, {
    era: era as HistoricalEra,
    culturalZone: normalizeZone(culturalZone) as CulturalZone,
    region: region || culturalZone
  });
  
  // Use the proper name generation system
  const fullName = generateNpcName(
    baseProfile.gender as Gender,
    normalizeZone(culturalZone) as CulturalZone,
    region || culturalZone,
    year || 1500, // Use provided year or default
    noise
    // Don't pass profession as professionNameKey - let it use cultural zone names
  );
  
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
    'guard_booth': ['Guard', 'Soldier', 'Watchman'],
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
  const modernProfessions = ['Secretary', 'Receptionist', 'Security Officer', 'Janitor', 'Inspector'];
  const ancientProfessions = ['Scribe', 'Herald', 'Patrician', 'Senator'];
  
  if (era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) {
    // Remove modern professions
    professions = professions.filter(p => !modernProfessions.includes(p));
    
    // Replace with historical equivalents
    professions = professions.map(p => {
      if (p === 'Secretary') return 'Scribe';
      if (p === 'Receptionist') return 'Clerk';
      if (p === 'Security' || p === 'Security Officer') return 'Guard';
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
 * Normalize cultural zone string to valid CulturalZone values
 */
function normalizeZone(zone: any): string {
  // Handle undefined, null, or non-string input
  if (!zone || typeof zone !== 'string') {
    console.warn('[normalizeZone] Invalid zone input:', zone, 'defaulting to EUROPEAN');
    return 'EUROPEAN';
  }
  
  const normalized = zone.toUpperCase().replace(/-/g, '_');
  
  // Map variations to standard CulturalZone values - order matters!
  if (normalized.includes('EUROPE')) return 'EUROPEAN';
  if (normalized.includes('SOUTH_ASIA')) return 'SOUTH_ASIAN'; // Check this before ASIA
  if (normalized.includes('ASIA')) return 'EAST_ASIAN';
  if (normalized.includes('MIDDLE') || normalized.includes('MENA')) return 'MENA';
  if (normalized.includes('SUB_SAHARAN_AFRICAN') || normalized.includes('AFRICA')) return 'SUB_SAHARAN_AFRICAN';
  
  // Handle Americas - map to correct CulturalZone values
  if (normalized.includes('SOUTH_AMERICAN')) return 'SOUTH_AMERICAN'; // Keep SOUTH_AMERICAN as is
  if (normalized.includes('NORTH_AMERICAN_PRE_COLUMBIAN')) return 'NORTH_AMERICAN_PRE_COLUMBIAN';
  if (normalized.includes('NORTH_AMERICAN_COLONIAL')) return 'NORTH_AMERICAN_COLONIAL';
  if (normalized.includes('NORTH_AMERICAN')) return 'NORTH_AMERICAN_PRE_COLUMBIAN'; // Default North American
  
  if (normalized.includes('OCEAN')) return 'OCEANIA';
  
  // Log unknown zones for debugging
  console.warn('[normalizeZone] Unknown zone:', zone, 'normalized:', normalized, 'defaulting to EUROPEAN');
  return 'EUROPEAN'; // Default
}

/**
 * Create an NPC from the leader data passed from the government modal
 */
function createLeaderNpc(
  leaderData: any,
  position: { x: number, y: number },
  config: SpecialMapConfig,
  id: number
): NpcEntity {
  // Create NPC with the exact data from the modal
  return {
    id: `leader_${id}`,
    name: leaderData.name,
    profession: leaderData.title.toLowerCase(),
    class: 'ruler',
    role: leaderData.title,
    emoji: '👑',
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
    dialogue: [`I am ${leaderData.title} ${leaderData.name}, ruler of this ${config.authorityContext?.governmentType || 'domain'}.`],
    isAlive: true,
    faction: config.authorityContext?.faction?.name || 'neutral',
    personality: leaderData.personality || { traits: ['authoritative', 'wise'] },
    attributes: [],
    skills: {},
    socialContext: leaderData.socialContext || { status: 'elite', relationships: {} },
    stats: leaderData.stats,
    appearance: leaderData.appearance,
    gender: leaderData.gender,
    age: leaderData.age,
    portraitSeed: leaderData.portraitSeed,
    wealthLevel: leaderData.wealthLevel as 'poor' | 'modest' | 'comfortable' | 'wealthy',
    customData: {
      isLeader: true,
      authorityRole: leaderData.title,
      factionName: config.authorityContext?.faction?.name,
      factionDescription: config.authorityContext?.faction?.description,
    }
  };
}

/**
 * Find the best position for the leader NPC (throne room, central hall, etc.)
 */
function findBestPositionForLeader(
  rooms: RoomDefinition[],
  tiles: any[][],
  mapSize: { width: number, height: number },
  noise: ValueNoise
): { x: number, y: number } {
  // Look for specific room types that should contain the leader
  const preferredRooms = ['throne_room', 'council_chamber', 'great_hall', 'audience_chamber', 'main_hall'];

  // Try to find a preferred room
  for (const roomType of preferredRooms) {
    const room = rooms.find(r => r.type === roomType);
    if (room && room.bounds) {
      // Place leader in center of the room
      const centerX = Math.floor((room.bounds.minX + room.bounds.maxX) / 2);
      const centerY = Math.floor((room.bounds.minY + room.bounds.maxY) / 2);

      // Ensure the position is walkable
      if (isWalkableTile(tiles[centerY]?.[centerX])) {
        return { x: centerX, y: centerY };
      }

      // Try to find a walkable position near the center
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (x >= room.bounds.minX && x <= room.bounds.maxX &&
              y >= room.bounds.minY && y <= room.bounds.maxY &&
              isWalkableTile(tiles[y]?.[x])) {
            return { x, y };
          }
        }
      }
    }
  }

  // If no preferred room found, place in the largest room
  const largestRoom = rooms.reduce((largest, room) => {
    if (!room.bounds) return largest;
    const roomSize = (room.bounds.maxX - room.bounds.minX) * (room.bounds.maxY - room.bounds.minY);
    const largestSize = largest?.bounds ?
      (largest.bounds.maxX - largest.bounds.minX) * (largest.bounds.maxY - largest.bounds.minY) : 0;
    return roomSize > largestSize ? room : largest;
  }, rooms[0]);

  if (largestRoom?.bounds) {
    const centerX = Math.floor((largestRoom.bounds.minX + largestRoom.bounds.maxX) / 2);
    const centerY = Math.floor((largestRoom.bounds.minY + largestRoom.bounds.maxY) / 2);

    // Try to find walkable position
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < mapSize.width && y >= 0 && y < mapSize.height &&
            isWalkableTile(tiles[y]?.[x])) {
          return { x, y };
        }
      }
    }
  }

  // Fallback to center of map
  return findValidNpcPosition(tiles, mapSize, noise) || { x: Math.floor(mapSize.width / 2), y: Math.floor(mapSize.height / 2) };
}