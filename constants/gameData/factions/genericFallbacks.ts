/**
 * constants/gameData/factions/genericFallbacks.ts
 * Generic fallback faction system for regions without specific historical faction data.
 * Provides culturally appropriate default factions based on geography, climate, and era.
 */
import { HistoricalEra } from '../../../types/ambiance';
import { ClimateType } from '../../../types/biomes/climate';
import { MapArchetype } from '../../../types/core/map';
import { FactionFile } from './types';

interface GenericFactionTemplate {
  name: string;
  type: 'primary' | 'secondary' | 'rebel';
  description: string;
  requirements?: {
    climate?: ClimateType[];
    archetype?: MapArchetype[];
    coastal?: boolean;
    desert?: boolean;
    mountain?: boolean;
    forest?: boolean;
  };
}

// Generic faction templates organized by cultural pattern
const GENERIC_FACTION_TEMPLATES = {
  // Nomadic/Steppe peoples
  steppe: {
    PREHISTORY: [
      { name: 'Hunter-Gatherer Bands', type: 'primary', description: 'Small mobile groups following seasonal migrations.' },
      { name: 'Rival Clans', type: 'rebel', description: 'Competing groups vying for hunting territories.' }
    ],
    ANTIQUITY: [
      { name: 'Nomadic Confederations', type: 'primary', description: 'Horse-riding peoples organized under war leaders.' },
      { name: 'Settled Villages', type: 'secondary', description: 'Agricultural communities at oasis points.' },
      { name: 'Raider Warbands', type: 'rebel', description: 'Independent warrior groups conducting raids.' }
    ],
    MEDIEVAL: [
      { name: 'Khanate', type: 'primary', description: 'Organized nomadic state under a supreme khan.' },
      { name: 'Tributary Tribes', type: 'secondary', description: 'Allied nomadic groups paying tribute.' },
      { name: 'Breakaway Hordes', type: 'rebel', description: 'Rebellious tribal groups seeking independence.' }
    ],
    RENAISSANCE_EARLY_MODERN: [
      { name: 'Nomadic Remnants', type: 'primary', description: 'Traditional herders adapting to settled neighbors.' },
      { name: 'Trading Posts', type: 'secondary', description: 'Permanent settlements facilitating trade.' },
      { name: 'Brigand Bands', type: 'rebel', description: 'Outlaws preying on caravan routes.' }
    ],
    MODERN_ERA: [
      { name: 'Modern State', type: 'primary', description: 'Contemporary national government.' },
      { name: 'Regional Authorities', type: 'secondary', description: 'Local administrative divisions.' },
      { name: 'Separatist Groups', type: 'rebel', description: 'Ethnic or political independence movements.' }
    ]
  },

  // Desert peoples
  desert: {
    PREHISTORY: [
      { name: 'Desert Nomads', type: 'primary', description: 'Hardy peoples adapted to arid survival.' },
      { name: 'Oasis Dwellers', type: 'secondary', description: 'Small communities around water sources.' }
    ],
    ANTIQUITY: [
      { name: 'Bedouin Tribes', type: 'primary', description: 'Mobile desert peoples controlling trade routes.' },
      { name: 'Oasis City-States', type: 'secondary', description: 'Wealthy trading centers in fertile areas.' },
      { name: 'Desert Raiders', type: 'rebel', description: 'Fierce warriors living by plunder.' }
    ],
    MEDIEVAL: [
      { name: 'Tribal Confederation', type: 'primary', description: 'United desert clans under traditional leadership.' },
      { name: 'Merchant Guilds', type: 'secondary', description: 'Wealthy traders dominating commerce.' },
      { name: 'Zealot Sects', type: 'rebel', description: 'Religious movements challenging authority.' }
    ],
    RENAISSANCE_EARLY_MODERN: [
      { name: 'Desert Emirates', type: 'primary', description: 'Traditional rulers adapting to global trade.' },
      { name: 'Colonial Outposts', type: 'secondary', description: 'Foreign powers establishing presence.' },
      { name: 'Resistance Fighters', type: 'rebel', description: 'Local groups opposing foreign control.' }
    ],
    MODERN_ERA: [
      { name: 'National Government', type: 'primary', description: 'Modern state with oil or mineral wealth.' },
      { name: 'Tribal Councils', type: 'secondary', description: 'Traditional authorities with local influence.' },
      { name: 'Extremist Groups', type: 'rebel', description: 'Radical organizations opposing modernization.' }
    ]
  },

  // Forest/jungle peoples
  forest: {
    PREHISTORY: [
      { name: 'Forest Hunters', type: 'primary', description: 'Skilled woodsmen living in harmony with nature.' },
      { name: 'Competing Bands', type: 'rebel', description: 'Rival groups fighting over territory.' }
    ],
    ANTIQUITY: [
      { name: 'Woodland Tribes', type: 'primary', description: 'Organized forest peoples with shamanic traditions.' },
      { name: 'River Trading Posts', type: 'secondary', description: 'Communities controlling waterway commerce.' },
      { name: 'Wild Clans', type: 'rebel', description: 'Fierce forest dwellers resisting outsiders.' }
    ],
    MEDIEVAL: [
      { name: 'Forest Kingdoms', type: 'primary', description: 'Sophisticated societies hidden in deep woods.' },
      { name: 'Logging Settlements', type: 'secondary', description: 'Communities exploiting forest resources.' },
      { name: 'Bandit Gangs', type: 'rebel', description: 'Outlaws using forest cover for raids.' }
    ],
    RENAISSANCE_EARLY_MODERN: [
      { name: 'Colonial Administration', type: 'primary', description: 'Foreign powers extracting resources.' },
      { name: 'Native Communities', type: 'secondary', description: 'Indigenous peoples maintaining traditions.' },
      { name: 'Freedom Fighters', type: 'rebel', description: 'Resistance movements fighting colonialism.' }
    ],
    MODERN_ERA: [
      { name: 'National Forest Service', type: 'primary', description: 'Government agencies managing resources.' },
      { name: 'Indigenous Groups', type: 'secondary', description: 'Native peoples with recognized rights.' },
      { name: 'Guerrilla Movements', type: 'rebel', description: 'Armed groups using terrain advantages.' }
    ]
  },

  // Coastal/island peoples
  coastal: {
    PREHISTORY: [
      { name: 'Coastal Foragers', type: 'primary', description: 'Sea-peoples living from ocean bounty.' },
      { name: 'Inland Tribes', type: 'secondary', description: 'Land-based groups trading with coast dwellers.' }
    ],
    ANTIQUITY: [
      { name: 'Maritime Confederation', type: 'primary', description: 'Sea-faring peoples united by trade.' },
      { name: 'Fishing Villages', type: 'secondary', description: 'Coastal communities harvesting the sea.' },
      { name: 'Pirate Fleets', type: 'rebel', description: 'Raiders terrorizing merchant shipping.' }
    ],
    MEDIEVAL: [
      { name: 'Merchant Republic', type: 'primary', description: 'Wealthy trading cities dominating seas.' },
      { name: 'Island Principalities', type: 'secondary', description: 'Small island rulers maintaining autonomy.' },
      { name: 'Corsair Brotherhoods', type: 'rebel', description: 'Organized piracy with hidden bases.' }
    ],
    RENAISSANCE_EARLY_MODERN: [
      { name: 'Colonial Trading Company', type: 'primary', description: 'Commercial enterprises with government backing.' },
      { name: 'Local Chieftains', type: 'secondary', description: 'Traditional rulers adapting to trade.' },
      { name: 'Smuggling Syndicates', type: 'rebel', description: 'Criminal networks avoiding taxes.' }
    ],
    MODERN_ERA: [
      { name: 'Maritime Nation', type: 'primary', description: 'Modern state with strong naval traditions.' },
      { name: 'Port Authorities', type: 'secondary', description: 'Commercial bodies managing trade.' },
      { name: 'Organized Crime', type: 'rebel', description: 'Criminal syndicates exploiting shipping.' }
    ]
  },

  // Mountain peoples
  mountain: {
    PREHISTORY: [
      { name: 'Highland Clans', type: 'primary', description: 'Hardy mountain folk adapted to harsh terrain.' },
      { name: 'Valley Settlements', type: 'secondary', description: 'Communities in sheltered lowlands.' }
    ],
    ANTIQUITY: [
      { name: 'Mountain Kingdoms', type: 'primary', description: 'Independent peoples controlling alpine passes.' },
      { name: 'Mining Communities', type: 'secondary', description: 'Settlements extracting mineral wealth.' },
      { name: 'Highland Raiders', type: 'rebel', description: 'Warriors using terrain for guerrilla warfare.' }
    ],
    MEDIEVAL: [
      { name: 'Alpine Confederations', type: 'primary', description: 'Mountain cantons united for defense.' },
      { name: 'Monastic Orders', type: 'secondary', description: 'Religious communities in remote locations.' },
      { name: 'Outlaw Bands', type: 'rebel', description: 'Brigands hiding in mountain strongholds.' }
    ],
    RENAISSANCE_EARLY_MODERN: [
      { name: 'Mountain Republic', type: 'primary', description: 'Independent highland state maintaining autonomy.' },
      { name: 'Trading Guilds', type: 'secondary', description: 'Merchants controlling mountain passes.' },
      { name: 'Separatist Militias', type: 'rebel', description: 'Armed groups seeking independence.' }
    ],
    MODERN_ERA: [
      { name: 'Regional Government', type: 'primary', description: 'Autonomous highland administration.' },
      { name: 'Tourism Industry', type: 'secondary', description: 'Commercial interests exploiting scenery.' },
      { name: 'Isolationist Movements', type: 'rebel', description: 'Groups opposing outside influence.' }
    ]
  },

  // River/agricultural peoples
  agricultural: {
    PREHISTORY: [
      { name: 'Farming Villages', type: 'primary', description: 'Early agricultural communities along fertile rivers.' },
      { name: 'Herder Tribes', type: 'secondary', description: 'Pastoral peoples in surrounding areas.' }
    ],
    ANTIQUITY: [
      { name: 'River Valley Kingdoms', type: 'primary', description: 'Organized states controlling fertile lands.' },
      { name: 'Tributary Cities', type: 'secondary', description: 'Urban centers paying homage to kings.' },
      { name: 'Barbarian Invaders', type: 'rebel', description: 'Outside groups threatening civilization.' }
    ],
    MEDIEVAL: [
      { name: 'Feudal Lords', type: 'primary', description: 'Noble houses controlling agricultural lands.' },
      { name: 'Peasant Communities', type: 'secondary', description: 'Village communes working the soil.' },
      { name: 'Peasant Rebels', type: 'rebel', description: 'Uprising against feudal oppression.' }
    ],
    RENAISSANCE_EARLY_MODERN: [
      { name: 'Agricultural Empire', type: 'primary', description: 'Centralized state based on farming wealth.' },
      { name: 'Merchant Classes', type: 'secondary', description: 'Urban traders and artisans.' },
      { name: 'Religious Sects', type: 'rebel', description: 'Movements challenging established order.' }
    ],
    MODERN_ERA: [
      { name: 'Agricultural Republic', type: 'primary', description: 'Democratic state with farming base.' },
      { name: 'Corporate Farms', type: 'secondary', description: 'Industrial agriculture enterprises.' },
      { name: 'Populist Movements', type: 'rebel', description: 'Rural groups opposing urbanization.' }
    ]
  }
};

/**
 * Generate generic faction data for a region based on its characteristics
 */
export function generateGenericFactions(
  mapAreaName: string,
  climate: ClimateType,
  archetype: MapArchetype,
  culturalZone: string
): FactionFile[string][string] {
  const result: FactionFile[string][string] = {};
  
  // Determine faction pattern based on geographic characteristics
  const pattern = determineFactionPattern(climate, archetype);
  
  // Generate faction data for each era
  Object.values(HistoricalEra).forEach(era => {
    const templates = GENERIC_FACTION_TEMPLATES[pattern][era] || [];
    
    result[era] = {
      dominantPower: generateDominantPowerName(pattern, era, culturalZone),
      dominantPowerDescription: generatePowerDescription(pattern, era, mapAreaName),
      eraContextSentence: generateContextSentence(pattern, era),
      allegianceGroups: templates.map(template => ({
        name: localizeGenericName(template.name, culturalZone, era),
        type: template.type,
        description: template.description
      })),
      structureNames: generateStructureNames(pattern, era),
      courtRoles: generateCourtRoles(pattern, era)
    };
  });
  
  return result;
}

function determineFactionPattern(climate: ClimateType, archetype: MapArchetype): keyof typeof GENERIC_FACTION_TEMPLATES {
  // Coastal/island patterns
  if (archetype === MapArchetype.BAY || 
      archetype === MapArchetype.STRAITS || 
      archetype === MapArchetype.ISLAND || 
      archetype === MapArchetype.ATOLL) {
    return 'coastal';
  }
  
  // Desert patterns
  if (climate === ClimateType.ARID) {
    return 'desert';
  }
  
  // Forest/jungle patterns
  if (archetype === MapArchetype.ALL_LAND && 
      (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL)) {
    return 'forest';
  }
  
  // Mountain patterns
  if (archetype === MapArchetype.ALL_LAND && climate === ClimateType.COLD) {
    return 'mountain';
  }
  
  // Steppe patterns
  if (archetype === MapArchetype.ALL_LAND && climate === ClimateType.TEMPERATE) {
    // Could be steppe or agricultural - default to agricultural for river areas
    return 'steppe';
  }
  
  // River/agricultural patterns
  if (archetype === MapArchetype.RIVER_PORT || 
      archetype === MapArchetype.DELTA || 
      archetype === MapArchetype.FRESHWATER_LAKE) {
    return 'agricultural';
  }
  
  // Default fallback
  return 'agricultural';
}

function generateDominantPowerName(pattern: string, era: HistoricalEra, culturalZone: string): string {
  const templates = GENERIC_FACTION_TEMPLATES[pattern][era];
  const primary = templates.find(t => t.type === 'primary');
  return primary ? localizeGenericName(primary.name, culturalZone, era) : 'Local Rulers';
}

function generatePowerDescription(pattern: string, era: HistoricalEra, mapAreaName: string): string {
  const baseDescriptions = {
    steppe: `The ${mapAreaName} is controlled by nomadic peoples who move seasonally across the grasslands.`,
    desert: `The ${mapAreaName} is ruled by desert peoples adapted to the harsh arid environment.`,
    forest: `The ${mapAreaName} is inhabited by woodland peoples who live in harmony with the forest.`,
    coastal: `The ${mapAreaName} is dominated by sea-faring peoples who derive their wealth from maritime trade.`,
    mountain: `The ${mapAreaName} is controlled by hardy mountain folk who use the terrain to their advantage.`,
    agricultural: `The ${mapAreaName} is ruled by settled peoples who have built their civilization on fertile lands.`
  };
  
  return baseDescriptions[pattern] || `The ${mapAreaName} is controlled by local peoples adapted to their environment.`;
}

function generateContextSentence(pattern: string, era: HistoricalEra): string {
  const contexts = {
    steppe: 'an age where mounted warriors roam vast grasslands, following ancient migration routes.',
    desert: 'a time when oasis cities prosper from caravan trade across endless sands.',
    forest: 'an era when deep woodlands hide sophisticated societies living close to nature.',
    coastal: 'a period of maritime prosperity, with wealth flowing from sea trade and fishing.',
    mountain: 'an age where high peaks shelter independent peoples in their mountain strongholds.',
    agricultural: 'a time of settled prosperity, with fertile fields supporting growing civilizations.'
  };
  
  return contexts[pattern] || 'an era of local adaptation to environmental challenges.';
}

function localizeGenericName(genericName: string, culturalZone: string, era: HistoricalEra): string {
  // Add cultural flavor to generic names based on zone
  const culturalPrefixes = {
    'Europe': ['Northern', 'Celtic', 'Germanic', 'Alpine'],
    'North America': ['Woodland', 'Plains', 'Coastal', 'Arctic'],
    'South America': ['Andean', 'Amazonian', 'Pampean', 'Patagonian'],
    'MENA': ['Bedouin', 'Mesopotamian', 'Levantine', 'Maghreb'],
    'Sub Saharan Africa': ['Savanna', 'Forest', 'Highland', 'Sahel'],
    'South Asia': ['Gangetic', 'Deccan', 'Himalayan', 'Dravidian'],
    'East Asia': ['Steppe', 'Han', 'Mongol', 'Siberian'],
    'Oceania': ['Polynesian', 'Melanesian', 'Aboriginal', 'Islander']
  };
  
  const prefixes = culturalPrefixes[culturalZone] || ['Local'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  return `${prefix} ${genericName}`;
}

function generateStructureNames(pattern: string, era: HistoricalEra) {
  const structures = {
    steppe: {
      fortress: ['War Camp', 'Fortified Enclosure', 'Tribal Stronghold'],
      quarry: ['Seasonal Mine', 'Stone Circle', 'Sacred Quarry'],
      holy_site: ['Sky Shrine', 'Ancestral Grove', 'Spirit Mound'],
      palace: ['Khan\'s Yurt', 'Great Tent', 'Assembly Ground']
    },
    desert: {
      fortress: ['Oasis Fort', 'Desert Citadel', 'Caravan Stronghold'],
      quarry: ['Salt Works', 'Desert Mine', 'Stone Cutting'],
      holy_site: ['Desert Shrine', 'Sacred Oasis', 'Star Temple'],
      palace: ['Emir\'s Palace', 'Desert Court', 'Oasis Villa']
    },
    forest: {
      fortress: ['Tree Fort', 'Wooden Palisade', 'Forest Stronghold'],
      quarry: ['Forest Quarry', 'Timber Works', 'Stone Grove'],
      holy_site: ['Sacred Grove', 'Forest Shrine', 'Druid Circle'],
      palace: ['Great Lodge', 'Forest Hall', 'Tree Palace']
    },
    coastal: {
      fortress: ['Coastal Fort', 'Harbor Citadel', 'Island Stronghold'],
      quarry: ['Coastal Quarry', 'Pearl Beds', 'Salt Works'],
      holy_site: ['Sea Temple', 'Lighthouse Shrine', 'Tidal Pool'],
      palace: ['Harbor Palace', 'Admiral\'s House', 'Trading Hall']
    },
    mountain: {
      fortress: ['Mountain Keep', 'Alpine Fort', 'Peak Citadel'],
      quarry: ['Mountain Mine', 'High Quarry', 'Peak Cutting'],
      holy_site: ['Mountain Shrine', 'Sky Temple', 'Peak Sacred Site'],
      palace: ['Mountain Hall', 'Alpine Palace', 'Peak Residence']
    },
    agricultural: {
      fortress: ['River Fort', 'Valley Keep', 'Farming Citadel'],
      quarry: ['Valley Quarry', 'River Stone', 'Field Mining'],
      holy_site: ['Harvest Shrine', 'River Temple', 'Field Sacred Site'],
      palace: ['Great Hall', 'River Palace', 'Valley Court']
    }
  };
  
  return structures[pattern] || structures.agricultural;
}

function generateCourtRoles(pattern: string, era: HistoricalEra) {
  const roles = {
    steppe: ['Khan', 'War Chief', 'Shaman', 'Horse Master', 'Scout Leader'],
    desert: ['Emir', 'Caravan Master', 'Desert Guide', 'Oasis Keeper', 'Sand Reader'],
    forest: ['Forest Lord', 'Hunt Master', 'Tree Keeper', 'Path Finder', 'Grove Tender'],
    coastal: ['Sea Lord', 'Harbor Master', 'Navigator', 'Ship Builder', 'Trade Master'],
    mountain: ['Mountain King', 'Peak Lord', 'Stone Master', 'Pass Keeper', 'High Priest'],
    agricultural: ['River King', 'Harvest Lord', 'Field Master', 'Grain Keeper', 'Valley Elder']
  };
  
  return { palace: roles[pattern] || roles.agricultural };
}

// Main fallback system integration
export const GENERIC_FALLBACK_FACTIONS: FactionFile = {};

// This would be populated programmatically based on missing regions
export function addGenericFallbackForRegion(
  mapAreaName: string, 
  climate: ClimateType, 
  archetype: MapArchetype,
  culturalZone: string
) {
  if (!GENERIC_FALLBACK_FACTIONS[culturalZone]) {
    GENERIC_FALLBACK_FACTIONS[culturalZone] = {};
  }
  
  GENERIC_FALLBACK_FACTIONS[culturalZone][mapAreaName] = 
    generateGenericFactions(mapAreaName, climate, archetype, culturalZone);
}