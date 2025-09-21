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
    name: 'Merchant Background',
    icon: 'FaBalanceScaleLeft',
    rarity: 'common',
    category: 'background',
    description: 'Has experience as a trader',
    effect: '20% better prices',
    // Only for actual merchants or former merchants
    condition: (char) => char.profession?.toLowerCase().includes('merchant') ||
                        char.profession?.toLowerCase().includes('trader') ||
                        char.profession?.toLowerCase().includes('vendor'),
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
  },

  // Additional universal personality/condition attributes
  {
    id: 'alcoholic',
    name: 'Alcoholic',
    icon: 'FaWineBottle',
    rarity: 'common',
    category: 'condition',
    description: 'Dependent on drink',
    effect: '-1 all stats when sober',
    dialogueHint: 'Smells of alcohol'
  },
  {
    id: 'veteran',
    name: 'Veteran',
    icon: 'GiSwordWound',
    rarity: 'uncommon',
    category: 'background',
    description: 'Experienced in combat',
    condition: (char) => char.age > 30,
    effect: '+1 combat, -morale from violence',
    dialogueHint: 'Mentions past battles'
  },
  {
    id: 'street_smart',
    name: 'Street Smart',
    icon: 'FaStreetView',
    rarity: 'common',
    category: 'skill',
    description: 'Knows the city\'s secrets',
    effect: '+perception in urban areas',
    dialogueHint: 'Knows all the shortcuts'
  },
  {
    id: 'pessimist',
    name: 'Pessimist',
    icon: 'FaFrownOpen',
    rarity: 'common',
    category: 'personality',
    description: 'Expects the worst',
    effect: '-morale but +preparation',
    dialogueHint: 'Always expects failure'
  },
  {
    id: 'optimist',
    name: 'Optimist',
    icon: 'FaSmile',
    rarity: 'common',
    category: 'personality',
    description: 'Always hopeful',
    effect: '+morale recovery',
    dialogueHint: 'Sees the bright side'
  },
  {
    id: 'insomniac',
    name: 'Insomniac',
    icon: 'FaMoon',
    rarity: 'common',
    category: 'condition',
    description: 'Cannot sleep well',
    effect: '-fatigue recovery at night',
    dialogueHint: 'Has dark circles under eyes'
  },
  {
    id: 'glutton',
    name: 'Glutton',
    icon: 'FaHamburger',
    rarity: 'common',
    category: 'personality',
    description: 'Overeats constantly',
    effect: 'Consumes double food',
    dialogueHint: 'Always eating something'
  },
  {
    id: 'ascetic',
    name: 'Ascetic',
    icon: 'GiMeditation',
    rarity: 'uncommon',
    category: 'personality',
    description: 'Rejects worldly pleasures',
    effect: 'Needs less food, -charisma',
    dialogueHint: 'Disdains material things'
  },
  {
    id: 'curious',
    name: 'Curious',
    icon: 'FaSearch',
    rarity: 'common',
    category: 'personality',
    description: 'Always investigating',
    effect: '+perception, may trigger events',
    dialogueHint: 'Asks many questions'
  },
  {
    id: 'cautious',
    name: 'Cautious',
    icon: 'FaShieldAlt',
    rarity: 'common',
    category: 'personality',
    description: 'Careful and methodical',
    effect: '-movement speed, +trap avoidance',
    dialogueHint: 'Proceeds carefully'
  },
  {
    id: 'reckless',
    name: 'Reckless',
    icon: 'FaBolt',
    rarity: 'common',
    category: 'personality',
    description: 'Acts without thinking',
    effect: '+movement speed, -defense',
    dialogueHint: 'Rushes into danger'
  },
  {
    id: 'patient',
    name: 'Patient',
    icon: 'FaHourglass',
    rarity: 'uncommon',
    category: 'personality',
    description: 'Willing to wait',
    effect: '+negotiation success',
    dialogueHint: 'Never rushes decisions'
  },
  {
    id: 'impatient',
    name: 'Impatient',
    icon: 'FaRunning',
    rarity: 'common',
    category: 'personality',
    description: 'Always in a hurry',
    effect: '-negotiation, +initiative',
    dialogueHint: 'Taps foot constantly'
  },
  {
    id: 'stubborn',
    name: 'Stubborn',
    icon: 'FaRock',
    rarity: 'common',
    category: 'personality',
    description: 'Refuses to change mind',
    effect: 'Immune to persuasion',
    dialogueHint: 'Will not be swayed'
  },
  {
    id: 'adaptable',
    name: 'Adaptable',
    icon: 'FaWater',
    rarity: 'uncommon',
    category: 'personality',
    description: 'Adjusts to any situation',
    effect: '+1 all skills in new areas',
    dialogueHint: 'Comfortable anywhere'
  },
  {
    id: 'hard_of_hearing',
    name: 'Hard of Hearing',
    icon: 'FaVolumeDown',
    rarity: 'common',
    category: 'physical',
    description: 'Partial hearing loss',
    effect: 'Must be closer to hear dialogue',
    dialogueHint: 'Often asks people to repeat themselves'
  },
  {
    id: 'quarrelsome',
    name: 'Quarrelsome',
    icon: 'GiFist',
    rarity: 'common',
    category: 'personality',
    description: 'Quick to anger and argue',
    effect: '-reputation gain from dialogue',
    dialogueHint: 'Takes offense easily'
  },
  {
    id: 'generous',
    name: 'Generous',
    icon: 'FaGift',
    rarity: 'uncommon',
    category: 'personality',
    description: 'Gives freely to others',
    effect: '+reputation when giving gifts',
    dialogueHint: 'Offers to share'
  },
  {
    id: 'paranoid',
    name: 'Paranoid',
    icon: 'FaEye',
    rarity: 'common',
    category: 'personality',
    description: 'Suspicious of everyone',
    effect: 'Cannot be surprised but -trust',
    dialogueHint: 'Constantly looking over shoulder'
  },
  {
    id: 'devout',
    name: 'Devout',
    icon: 'FaPray',
    rarity: 'common',
    category: 'personality',
    description: 'Deeply religious',
    effect: '+reputation with clergy',
    dialogueHint: 'Frequently mentions faith'
  },
  {
    id: 'gambler',
    name: 'Gambler',
    icon: 'FaDice',
    rarity: 'common',
    category: 'personality',
    description: 'Addicted to games of chance',
    effect: 'Randomly gains or loses money',
    dialogueHint: 'Talks about luck and odds'
  },
  {
    id: 'melancholic',
    name: 'Melancholic',
    icon: 'FaCloudRain',
    rarity: 'common',
    category: 'personality',
    description: 'Prone to sadness',
    effect: '-morale in bad weather',
    dialogueHint: 'Seems perpetually sad'
  },
  {
    id: 'twin',
    name: 'Twin',
    icon: 'FaUsers',
    rarity: 'uncommon',
    category: 'background',
    description: 'Has a twin sibling',
    effect: 'May encounter twin',
    dialogueHint: 'Mentions their twin'
  },
  {
    id: 'orphan',
    name: 'Orphan',
    icon: 'FaHome',
    rarity: 'common',
    category: 'background',
    description: 'Raised without parents',
    effect: '+self reliance',
    dialogueHint: 'Never knew their parents'
  },
  {
    id: 'foreigner',
    name: 'Foreigner',
    icon: 'FaGlobeAmericas',
    rarity: 'common',
    category: 'background',
    description: 'Not from these lands',
    effect: '-local reputation, +languages',
    dialogueHint: 'Has an accent'
  },
  {
    id: 'local',
    name: 'Local',
    icon: 'FaMapMarkerAlt',
    rarity: 'common',
    category: 'background',
    description: 'Born and raised here',
    effect: '+local reputation',
    dialogueHint: 'Knows everyone in town'
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    icon: 'FaWalking',
    rarity: 'common',
    category: 'background',
    description: 'Never stays in one place',
    effect: '+travel speed',
    dialogueHint: 'Has been everywhere'
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
    name: 'Former Knight',
    icon: 'GiMountedKnight',
    rarity: 'epic',
    category: 'background',
    description: 'Once served as a knight',
    yearRange: [1100, 1500],
    // Only for actual knights or soldiers
    condition: (char) => char.profession?.toLowerCase().includes('knight') ||
                        char.profession?.toLowerCase().includes('soldier') ||
                        char.profession?.toLowerCase().includes('warrior') ||
                        char.profession?.toLowerCase().includes('guard'),
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