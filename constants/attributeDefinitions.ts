/**
 * constants/attributeDefinitions.ts - All character attribute definitions
 */

import { AttributeBadge } from '../types/attributeTypes';

// Universal Attributes (can appear in any era/culture)
export const UNIVERSAL_ATTRIBUTES: AttributeBadge[] = [
  // Physical
  {
    id: 'strong',
    name: 'Strong',
    icon: 'FaDumbbell',
    rarity: 'common',
    category: 'physical',
    description: 'Exceptional physical strength',
    condition: (char) => (char.stats?.strength || 0) > 15,
    effect: '+2 to combat rolls',
    dialogueHint: 'Mentions physical prowess'
  },
  {
    id: 'frail',
    name: 'Frail',
    icon: 'GiFragile',
    rarity: 'common',
    category: 'physical',
    description: 'Weak constitution and poor health',
    condition: (char) => char.health < 30,
    effect: '-1 to all physical tasks',
    dialogueHint: 'Shows signs of weakness'
  },
  {
    id: 'blind',
    name: 'Blind',
    icon: 'FaEyeSlash',
    rarity: 'rare',
    category: 'physical',
    description: 'Cannot see, relies on other senses',
    effect: 'Cannot read, -perception in new areas',
    dialogueHint: 'Uses touch and hearing to navigate'
  },
  {
    id: 'deaf',
    name: 'Deaf',
    icon: 'FaDeaf',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Cannot hear spoken words',
    effect: 'Immune to sound-based effects',
    dialogueHint: 'Communicates through gestures'
  },
  {
    id: 'nearsighted',
    name: 'Nearsighted',
    icon: 'FaGlasses',
    rarity: 'common',
    category: 'physical',
    description: 'Poor distance vision',
    effect: '-1 perception at range',
    dialogueHint: 'Squints at distant objects'
  },
  {
    id: 'athletic',
    name: 'Athletic',
    icon: 'FaRunning',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Natural athletic ability',
    condition: (char) => (char.stats?.dexterity || 0) > 14,
    effect: '+1 movement speed',
    dialogueHint: 'Moves with grace and confidence'
  },
  {
    id: 'limping',
    name: 'Limping',
    icon: 'GiLeg',
    rarity: 'common',
    category: 'physical',
    description: 'Injured leg affects movement',
    effect: '-50% movement speed',
    dialogueHint: 'Favors one leg when walking'
  },
  {
    id: 'scarred',
    name: 'Scarred',
    icon: 'GiScars',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Battle scars from past conflicts',
    effect: '+1 intimidation',
    dialogueHint: 'Bears visible marks of violence'
  },
  {
    id: 'giant',
    name: 'Giant',
    icon: 'GiGiant',
    rarity: 'rare',
    category: 'physical',
    description: 'Exceptionally tall and large',
    effect: '+2 strength, -1 dexterity',
    dialogueHint: 'Towers over others'
  },
  {
    id: 'tiny',
    name: 'Tiny',
    icon: 'GiAnt',
    rarity: 'uncommon',
    category: 'physical',
    description: 'Unusually small stature',
    effect: '+2 dexterity, -2 strength',
    dialogueHint: 'Surprisingly small'
  },

  // Mental/Intellectual
  {
    id: 'genius',
    name: 'Genius',
    icon: 'FaBrain',
    rarity: 'epic',
    category: 'mental',
    description: 'Exceptional intelligence',
    condition: (char) => (char.stats?.wisdom || 0) > 18,
    effect: '+3 to all knowledge checks',
    dialogueHint: 'Speaks with remarkable insight'
  },
  {
    id: 'simple',
    name: 'Simple',
    icon: 'FaFeather',
    rarity: 'common',
    category: 'mental',
    description: 'Below average intelligence',
    condition: (char) => (char.stats?.wisdom || 0) < 8,
    effect: '-2 to complex tasks',
    dialogueHint: 'Struggles with complex ideas'
  },
  {
    id: 'scholar',
    name: 'Scholar',
    icon: 'FaBookOpen',
    rarity: 'uncommon',
    category: 'mental',
    description: 'Well-educated and learned',
    condition: (char) => (char.stats?.wisdom || 0) > 14,
    effect: 'Can read all languages',
    dialogueHint: 'Quotes texts and authorities'
  },
  {
    id: 'illiterate',
    name: 'Illiterate',
    icon: 'FaTimesCircle',
    rarity: 'common',
    category: 'mental',
    description: 'Cannot read or write',
    effect: 'Cannot use written items',
    dialogueHint: 'Asks others to read for them'
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    icon: 'FaLanguage',
    rarity: 'rare',
    category: 'mental',
    description: 'Speaks many languages fluently',
    effect: 'No language barriers',
    dialogueHint: 'Switches between languages easily'
  },
  {
    id: 'forgetful',
    name: 'Forgetful',
    icon: 'FaQuestion',
    rarity: 'common',
    category: 'mental',
    description: 'Poor memory retention',
    effect: 'May forget quest details',
    dialogueHint: 'Often repeats questions'
  },
  {
    id: 'sharp_eyed',
    name: 'Sharp-eyed',
    icon: 'FaEye',
    rarity: 'uncommon',
    category: 'mental',
    description: 'Exceptional perception',
    condition: (char) => (char.stats?.perception || 0) > 14,
    effect: '+2 to spot hidden things',
    dialogueHint: 'Notices small details'
  },
  {
    id: 'dreamer',
    name: 'Dreamer',
    icon: 'FaCloud',
    rarity: 'common',
    category: 'mental',
    description: 'Creative and imaginative',
    effect: '+1 to artistic endeavors',
    dialogueHint: 'Often lost in thought'
  },

  // Personality/Social
  {
    id: 'charming',
    name: 'Charming',
    icon: 'FaStar',
    rarity: 'uncommon',
    category: 'social',
    description: 'Naturally charismatic',
    condition: (char) => (char.stats?.charisma || 0) > 15,
    effect: '+2 to social interactions',
    dialogueHint: 'Speaks with natural charm'
  },
  {
    id: 'shy',
    name: 'Shy',
    icon: 'FaUserSecret',
    rarity: 'common',
    category: 'social',
    description: 'Uncomfortable in social situations',
    condition: (char) => (char.stats?.charisma || 0) < 10,
    effect: '-1 to public speaking',
    dialogueHint: 'Avoids eye contact'
  },
  {
    id: 'lucky',
    name: 'Lucky',
    icon: 'FaClover',
    rarity: 'rare',
    category: 'social',
    description: 'Fortune seems to favor them',
    effect: '10% chance to avoid bad events',
    dialogueHint: 'Mentions their good fortune'
  },
  {
    id: 'unlucky',
    name: 'Unlucky',
    icon: 'FaSkull',
    rarity: 'uncommon',
    category: 'social',
    description: 'Plagued by misfortune',
    effect: '10% chance for minor mishaps',
    dialogueHint: 'Complains about bad luck'
  },
  {
    id: 'honest',
    name: 'Honest',
    icon: 'FaBalanceScale',
    rarity: 'common',
    category: 'social',
    description: 'Always tells the truth',
    effect: '+reputation with lawful NPCs',
    dialogueHint: 'Cannot tell lies'
  },
  {
    id: 'liar',
    name: 'Liar',
    icon: 'FaMask',
    rarity: 'uncommon',
    category: 'social',
    description: 'Habitually deceptive',
    effect: '-reputation if caught',
    dialogueHint: 'Stories often contradict'
  },
  {
    id: 'generous',
    name: 'Generous',
    icon: 'FaHandHoldingHeart',
    rarity: 'uncommon',
    category: 'social',
    description: 'Gives freely to others',
    effect: '+reputation, -gold',
    dialogueHint: 'Offers to share resources'
  },
  {
    id: 'greedy',
    name: 'Greedy',
    icon: 'FaCoins',
    rarity: 'common',
    category: 'social',
    description: 'Obsessed with wealth',
    effect: 'Never shares willingly',
    dialogueHint: 'Always asks about payment'
  },
  {
    id: 'brave',
    name: 'Brave',
    icon: 'GiLion',
    rarity: 'uncommon',
    category: 'social',
    description: 'Courageous in danger',
    condition: (char) => (char.stats?.courage || 0) > 14,
    effect: 'Immune to fear',
    dialogueHint: 'Shows no fear'
  },
  {
    id: 'coward',
    name: 'Coward',
    icon: 'GiRabbit',
    rarity: 'common',
    category: 'social',
    description: 'Easily frightened',
    condition: (char) => (char.stats?.courage || 0) < 8,
    effect: 'May flee from combat',
    dialogueHint: 'Shows signs of fear'
  },

  // Spiritual/Mystical
  {
    id: 'spiritual',
    name: 'Spiritual',
    icon: 'FaPray',
    rarity: 'uncommon',
    category: 'spiritual',
    description: 'Deep religious faith',
    effect: '+1 to morale',
    dialogueHint: 'References divine will'
  },
  {
    id: 'prophet',
    name: 'Prophet',
    icon: 'FaStar',
    rarity: 'legendary',
    category: 'spiritual',
    description: 'Claims divine revelation',
    effect: 'Can start religious movements',
    dialogueHint: 'Speaks of visions and prophecies'
  },
  {
    id: 'blessed',
    name: 'Blessed',
    icon: 'FaDove',
    rarity: 'rare',
    category: 'spiritual',
    description: 'Touched by divine favor',
    effect: '+1 to all rolls',
    dialogueHint: 'Radiates serenity'
  },
  {
    id: 'cursed',
    name: 'Cursed',
    icon: 'FaGhost',
    rarity: 'rare',
    category: 'spiritual',
    description: 'Under a terrible curse',
    effect: '-1 to all rolls',
    dialogueHint: 'Speaks of their curse'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    icon: 'GiCrystalBall',
    rarity: 'rare',
    category: 'spiritual',
    description: 'Sees beyond the veil',
    effect: 'Can predict weather',
    dialogueHint: 'Makes cryptic predictions'
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    icon: 'FaQuestionCircle',
    rarity: 'common',
    category: 'spiritual',
    description: 'Doubts religious claims',
    effect: 'Immune to religious conversion',
    dialogueHint: 'Questions beliefs'
  },

  // Skills/Professions
  {
    id: 'survivor',
    name: 'Survivor',
    icon: 'GiCampfire',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Survived extreme hardship',
    condition: (char) => (char.stats?.endurance || 0) > 14 && char.health < 40,
    effect: '+2 to survival checks',
    dialogueHint: 'Has seen hard times'
  },
  {
    id: 'hunter',
    name: 'Hunter',
    icon: 'GiBowArrow',
    rarity: 'common',
    category: 'skill',
    description: 'Skilled at tracking and hunting',
    effect: '+food from wilderness',
    dialogueHint: 'Knows animal behavior'
  },
  {
    id: 'healer',
    name: 'Healer',
    icon: 'FaPlusSquare',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Knowledge of medicine',
    effect: 'Can treat injuries',
    dialogueHint: 'Offers medical advice'
  },
  {
    id: 'merchant',
    name: 'Merchant',
    icon: 'FaBalanceScaleLeft',
    rarity: 'common',
    category: 'skill',
    description: 'Experienced trader',
    effect: '20% better prices',
    dialogueHint: 'Evaluates everything\'s worth'
  },
  {
    id: 'sailor',
    name: 'Sailor',
    icon: 'FaAnchor',
    rarity: 'common',
    category: 'skill',
    description: 'Experienced at sea',
    effect: 'No seasickness, +boat speed',
    dialogueHint: 'Uses nautical terms'
  },
  {
    id: 'farmer',
    name: 'Farmer',
    icon: 'GiWheat',
    rarity: 'common',
    category: 'skill',
    description: 'Knows agriculture',
    effect: '+food from farms',
    dialogueHint: 'Discusses crops and weather'
  },

  // Relationships/Affinities
  {
    id: 'animal_lover',
    name: 'Animal Lover',
    icon: 'FaPaw',
    rarity: 'common',
    category: 'social',
    description: 'Has a way with animals',
    effect: 'Animals less likely to attack',
    dialogueHint: 'Shows kindness to animals'
  },
  {
    id: 'loner',
    name: 'Loner',
    icon: 'FaWalking',
    rarity: 'common',
    category: 'social',
    description: 'Prefers solitude',
    effect: '-1 charisma in groups',
    dialogueHint: 'Uncomfortable in crowds'
  },
  {
    id: 'leader',
    name: 'Leader',
    icon: 'FaCrown',
    rarity: 'rare',
    category: 'social',
    description: 'Natural commander',
    condition: (char) => (char.stats?.charisma || 0) > 16 && (char.stats?.wisdom || 0) > 12,
    effect: 'Can recruit followers',
    dialogueHint: 'Takes charge naturally'
  },
  {
    id: 'follower',
    name: 'Follower',
    icon: 'FaUsers',
    rarity: 'common',
    category: 'social',
    description: 'Prefers to follow others',
    effect: '+1 morale in groups',
    dialogueHint: 'Defers to authority'
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: 'FaHeart',
    rarity: 'common',
    category: 'social',
    description: 'Falls in love easily',
    effect: 'Easily charmed',
    dialogueHint: 'Speaks of love and beauty'
  },
  {
    id: 'orphan',
    name: 'Orphan',
    icon: 'FaHome',
    rarity: 'common',
    category: 'social',
    description: 'Lost family young',
    effect: 'Self-reliant',
    dialogueHint: 'Never mentions family'
  },

  // Unique/Special
  {
    id: 'twin',
    name: 'Twin',
    icon: 'FaUserFriends',
    rarity: 'uncommon',
    category: 'social',
    description: 'Has an identical twin',
    effect: 'May encounter twin',
    dialogueHint: 'Mentions their twin'
  },
  {
    id: 'noble_blood',
    name: 'Noble Blood',
    icon: 'GiCrownedHeart',
    rarity: 'rare',
    category: 'social',
    description: 'Descended from royalty',
    effect: '+reputation with nobility',
    dialogueHint: 'Has aristocratic manners'
  },
  {
    id: 'nightowl',
    name: 'Night Owl',
    icon: 'GiOwl',
    rarity: 'common',
    category: 'physical',
    description: 'Most active at night',
    effect: '+2 all stats at night',
    dialogueHint: 'Complains during daylight'
  },
  {
    id: 'weather_sense',
    name: 'Weather Sense',
    icon: 'FaCloudSun',
    rarity: 'uncommon',
    category: 'skill',
    description: 'Can predict weather changes',
    effect: 'Warns of storms 1 hour early',
    dialogueHint: 'Comments on coming weather'
  }
];

// Culture and Era-specific attributes (continued in next part due to length)
export const CULTURAL_ATTRIBUTES: AttributeBadge[] = [
  // Medieval European
  {
    id: 'crusader',
    name: 'Crusader',
    icon: 'FaCross',
    rarity: 'rare',
    category: 'cultural',
    description: 'Veteran of holy wars',
    yearRange: [1095, 1291],
    requiredCulture: ['european'],
    effect: '+2 combat vs different religions',
    dialogueHint: 'Speaks of Jerusalem and holy duty'
  },
  {
    id: 'plague_survivor',
    name: 'Plague Survivor',
    icon: 'GiDeathSkull',
    rarity: 'uncommon',
    category: 'cultural',
    description: 'Survived the Black Death',
    yearRange: [1347, 1353],
    requiredCulture: ['european'],
    effect: 'Immune to disease for 1 year',
    dialogueHint: 'Lost many to the pestilence'
  },
  {
    id: 'guild_member',
    name: 'Guild Member',
    icon: 'FaHammer',
    rarity: 'common',
    category: 'cultural',
    description: 'Member of trade guild',
    yearRange: [1000, 1600],
    requiredCulture: ['european'],
    effect: '20% better trade prices in cities',
    dialogueHint: 'Mentions guild regulations'
  },
  {
    id: 'excommunicated',
    name: 'Excommunicated',
    icon: 'FaBan',
    rarity: 'rare',
    category: 'cultural',
    description: 'Cast out from the Church',
    yearRange: [800, 1600],
    requiredCulture: ['european'],
    effect: 'Cannot enter churches, -reputation with clergy',
    dialogueHint: 'Bitter about the Church'
  },
  {
    id: 'knight_errant',
    name: 'Knight Errant',
    icon: 'GiMountedKnight',
    rarity: 'epic',
    category: 'cultural',
    description: 'Wandering knight seeking glory',
    yearRange: [1100, 1500],
    requiredCulture: ['european'],
    effect: '+3 combat, can challenge to duels',
    dialogueHint: 'Speaks of honor and chivalry'
  },
  {
    id: 'serf',
    name: 'Serf',
    icon: 'GiWheat',
    rarity: 'common',
    category: 'cultural',
    description: 'Bound to the land',
    yearRange: [800, 1500],
    requiredCulture: ['european'],
    effect: 'Cannot leave region without permission',
    dialogueHint: 'Knows their place in society'
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    icon: 'GiBottledBolt',
    rarity: 'rare',
    category: 'cultural',
    description: 'Studies natural philosophy',
    yearRange: [1200, 1700],
    requiredCulture: ['european'],
    effect: 'Can craft potions',
    dialogueHint: 'Speaks of transmutation'
  },

  // Islamic Golden Age
  {
    id: 'hajji',
    name: 'Hajji',
    icon: 'FaKaaba',
    rarity: 'uncommon',
    category: 'cultural',
    description: 'Completed pilgrimage to Mecca',
    yearRange: [622, 2000],
    requiredCulture: ['islamic', 'mena'],
    effect: '+reputation with Muslims',
    dialogueHint: 'Describes the holy journey'
  },
  {
    id: 'mathematician',
    name: 'Mathematician',
    icon: 'FaCalculator',
    rarity: 'rare',
    category: 'cultural',
    description: 'Master of algebra and geometry',
    yearRange: [750, 1258],
    requiredCulture: ['islamic', 'mena'],
    effect: 'Better trade calculations, +2 wisdom',
    dialogueHint: 'Explains everything with numbers'
  },
  {
    id: 'calligrapher',
    name: 'Calligrapher',
    icon: 'FaPenFancy',
    rarity: 'uncommon',
    category: 'cultural',
    description: 'Creates beautiful writing',
    yearRange: [700, 1600],
    requiredCulture: ['islamic', 'mena', 'persian'],
    effect: 'Can create valuable documents',
    dialogueHint: 'Appreciates beautiful letters'
  },
  {
    id: 'sufi_mystic',
    name: 'Sufi Mystic',
    icon: 'GiMeditation',
    rarity: 'epic',
    category: 'cultural',
    description: 'Seeks divine truth through meditation',
    yearRange: [800, 2000],
    requiredCulture: ['islamic', 'mena', 'persian'],
    effect: 'Never loses morale',
    dialogueHint: 'Speaks in metaphors and poetry'
  },
  {
    id: 'dhimmi',
    name: 'Dhimmi',
    icon: 'FaScroll',
    rarity: 'common',
    category: 'cultural',
    description: 'Protected non-Muslim',
    yearRange: [622, 1900],
    requiredCulture: ['islamic', 'mena'],
    effect: 'Must pay extra taxes',
    dialogueHint: 'Careful about religious topics'
  },
  {
    id: 'mamluk',
    name: 'Mamluk',
    icon: 'GiCrossedSwords',
    rarity: 'rare',
    category: 'cultural',
    description: 'Elite slave soldier',
    yearRange: [800, 1517],
    requiredCulture: ['islamic', 'mena'],
    effect: '+2 combat, cannot refuse orders',
    dialogueHint: 'Bound by duty despite status'
  },

  // More cultural attributes continue...
  // (Truncated for space - would include all 150+ attributes)
];

// Helper function to get all applicable attributes for a character
export function getApplicableAttributes(
  character: any,
  year: number,
  geography: string
): AttributeBadge[] {
  const applicable: AttributeBadge[] = [];
  
  // Check universal attributes
  for (const attr of UNIVERSAL_ATTRIBUTES) {
    if (!attr.condition || attr.condition(character)) {
      applicable.push(attr);
    }
  }
  
  // Check cultural attributes
  for (const attr of CULTURAL_ATTRIBUTES) {
    // Check year range
    if (attr.yearRange) {
      if (year < attr.yearRange[0] || year > attr.yearRange[1]) {
        continue;
      }
    }
    
    // Check culture/geography requirements
    if (attr.requiredGeography && !attr.requiredGeography.includes(geography)) {
      continue;
    }
    
    // Check condition
    if (!attr.condition || attr.condition(character)) {
      applicable.push(attr);
    }
  }
  
  return applicable;
}