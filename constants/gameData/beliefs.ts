/**
 * constants/gameData/beliefs.ts - Comprehensive belief systems and worldviews for procedural NPC generation
 */

import { HistoricalEra, CulturalZone } from '../../types';
import { PersonalBelief, Ideology } from '../../types/knowledge';

// =============================================================================
// PERSONAL BELIEFS - Expanded library covering epistemological and worldview diversity
// =============================================================================

export const PERSONAL_BELIEFS: PersonalBelief[] = [
  // Traditional Religious/Spiritual Beliefs
  {
    id: 'DIVINE_RIGHT_OF_KINGS',
    text: 'Believes rulers are chosen by a higher power and deserve absolute obedience',
    tags: ['political', 'traditional', 'religious'],
    icon: '👑'
  },
  {
    id: 'ANCESTOR_WORSHIP',
    text: 'Deeply venerates deceased ancestors who continue to guide the living',
    tags: ['spiritual', 'traditional', 'familial'],
    icon: '🕯️'
  },
  {
    id: 'FOREST_SPIRITS',
    text: 'Believes natural places are inhabited by powerful spirits requiring respect',
    tags: ['spiritual', 'nature', 'traditional'],
    icon: '🌲'
  },
  {
    id: 'CYCLICAL_TIME',
    text: 'Views history as repeating cycles rather than linear progress',
    tags: ['philosophical', 'temporal', 'traditional'],
    icon: '🔄'
  },

  // Epistemological Beliefs
  {
    id: 'EMPIRICAL_KNOWLEDGE',
    text: 'Trusts only what can be observed and tested through experience',
    tags: ['epistemological', 'scientific', 'rational'],
    icon: '🔬'
  },
  {
    id: 'REVEALED_TRUTH',
    text: 'Believes ultimate knowledge comes through divine revelation or scripture',
    tags: ['epistemological', 'religious', 'traditional'],
    icon: '📜'
  },
  {
    id: 'SKEPTIC_OF_THE_DIVINE',
    text: 'Questions supernatural explanations and seeks natural causes',
    tags: ['skeptical', 'rational', 'questioning'],
    icon: '❓'
  },
  {
    id: 'INTUITIVE_WISDOM',
    text: 'Trusts inner knowing and gut feelings over logical analysis',
    tags: ['intuitive', 'emotional', 'personal'],
    icon: '💭'
  },
  {
    id: 'COLLECTIVE_MEMORY',
    text: 'Values traditional knowledge passed down through generations',
    tags: ['traditional', 'collective', 'cultural'],
    icon: '📚'
  },
  {
    id: 'MYSTICAL_EXPERIENCE',
    text: 'Seeks direct spiritual experience as the path to truth',
    tags: ['mystical', 'spiritual', 'experiential'],
    icon: '✨'
  },

  // Nature and Cosmology
  {
    id: 'LIVING_COSMOS',
    text: 'Views the universe as a living, conscious entity',
    tags: ['cosmological', 'spiritual', 'holistic'],
    icon: '🌌'
  },
  {
    id: 'MECHANICAL_UNIVERSE',
    text: 'Sees the cosmos as operating like a great machine following natural laws',
    tags: ['scientific', 'mechanistic', 'rational'],
    icon: '⚙️'
  },
  {
    id: 'ELEMENTAL_HARMONY',
    text: 'Believes in maintaining balance between earth, air, fire, and water',
    tags: ['traditional', 'balance', 'nature'],
    icon: '🔥'
  },
  {
    id: 'NATURE_AS_TEACHER',
    text: 'Looks to natural patterns and animal behavior for life guidance',
    tags: ['nature', 'observational', 'practical'],
    icon: '🦅'
  },
  {
    id: 'HUMAN_DOMINION',
    text: 'Believes humans are meant to control and reshape the natural world',
    tags: ['anthropocentric', 'dominating', 'progressive'],
    icon: '🏗️'
  },

  // Social and Political Worldviews
  {
    id: 'FEUDAL_OBLIGATION',
    text: 'Accepts hierarchical social bonds as natural and necessary',
    tags: ['social', 'hierarchical', 'traditional'],
    icon: '🤝'
  },
  {
    id: 'EGALITARIAN_SPIRIT',
    text: 'Believes all people deserve equal treatment and opportunities',
    tags: ['social', 'egalitarian', 'progressive'],
    icon: '⚖️'
  },
  {
    id: 'TRIBAL_LOYALTY',
    text: 'Places kinship group welfare above individual or universal concerns',
    tags: ['social', 'kinship', 'collective'],
    icon: '👥'
  },
  {
    id: 'INDIVIDUAL_FREEDOM',
    text: 'Prioritizes personal liberty and self-determination',
    tags: ['individualistic', 'freedom', 'personal'],
    icon: '🕊️'
  },
  {
    id: 'COMMERCIAL_ACUMEN',
    text: 'Views trade and profit as beneficial forces that improve society',
    tags: ['economic', 'pragmatic', 'progressive'],
    icon: '💰'
  },
  {
    id: 'HONOR_CULTURE',
    text: 'Believes reputation and personal honor are worth dying for',
    tags: ['cultural', 'personal', 'traditional'],
    icon: '⚔️'
  },

  // East Asian Philosophical Traditions
  {
    id: 'FILIAL_PIETY',
    text: 'Considers respect and care for parents the highest virtue',
    tags: ['confucian', 'familial', 'duty'],
    icon: '👴'
  },
  {
    id: 'MANDATE_OF_HEAVEN',
    text: 'Believes legitimate rule depends on moral virtue and cosmic approval',
    tags: ['chinese', 'political', 'moral'],
    icon: '☰'
  },
  {
    id: 'WU_WEI',
    text: 'Practices non-action and flowing with natural patterns rather than forcing',
    tags: ['taoist', 'natural', 'passive'],
    icon: '💧'
  },
  {
    id: 'MIDDLE_PATH',
    text: 'Seeks balance and moderation, avoiding extremes in all things',
    tags: ['buddhist', 'balance', 'moderate'],
    icon: '⚊'
  },
  {
    id: 'KARMA_CONSCIOUSNESS',
    text: 'Believes actions create consequences that shape future experiences',
    tags: ['karmic', 'moral', 'causal'],
    icon: '🔗'
  },

  // South Asian Worldviews
  {
    id: 'DHARMIC_DUTY',
    text: 'Follows prescribed duties based on social position and life stage',
    tags: ['dharmic', 'duty', 'traditional'],
    icon: '📋'
  },
  {
    id: 'CASTE_CONSCIOUSNESS',
    text: 'Accepts hereditary social categories as reflecting spiritual development',
    tags: ['social', 'hierarchical', 'spiritual'],
    icon: '🏺'
  },
  {
    id: 'AHIMSA_PRINCIPLE',
    text: 'Practices non-violence toward all living beings',
    tags: ['ethical', 'non-violent', 'compassionate'],
    icon: '🕊️'
  },
  {
    id: 'MOKSHA_SEEKING',
    text: 'Pursues liberation from the cycle of death and rebirth',
    tags: ['spiritual', 'liberation', 'transcendent'],
    icon: '🌅'
  },

  // MENA Regional Beliefs
  {
    id: 'SCHOLARLY_TRADITION',
    text: 'Deeply values learning, books, and intellectual discourse',
    tags: ['intellectual', 'scholarly', 'cultural'],
    icon: '📖'
  },
  {
    id: 'HOSPITALITY_SACRED',
    text: 'Considers welcoming strangers a sacred duty and honor',
    tags: ['social', 'traditional', 'hospitable'],
    icon: '🏺'
  },
  {
    id: 'GEOMETRIC_HARMONY',
    text: 'Sees mathematical patterns as reflecting divine order',
    tags: ['mathematical', 'aesthetic', 'spiritual'],
    icon: '🔶'
  },
  {
    id: 'DESERT_WISDOM',
    text: 'Draws spiritual insight from harsh landscapes and scarcity',
    tags: ['environmental', 'spiritual', 'austere'],
    icon: '🏜️'
  },

  // Sub-Saharan African Worldviews
  {
    id: 'UBUNTU_PHILOSOPHY',
    text: 'Believes "I am because we are" - individual identity through community',
    tags: ['communal', 'identity', 'african'],
    icon: '🤲'
  },
  {
    id: 'ANCESTRAL_GUIDANCE',
    text: 'Regularly consults with deceased elders for important decisions',
    tags: ['spiritual', 'traditional', 'communal'],
    icon: '👻'
  },
  {
    id: 'ORAL_TRADITION',
    text: 'Trusts spoken wisdom and storytelling over written records',
    tags: ['cultural', 'traditional', 'narrative'],
    icon: '🗣️'
  },
  {
    id: 'RHYTHMIC_COSMOS',
    text: 'Understands reality through musical and rhythmic patterns',
    tags: ['cultural', 'aesthetic', 'spiritual'],
    icon: '🥁'
  },

  // American Indigenous Worldviews
  {
    id: 'SEVENTH_GENERATION',
    text: 'Considers the impact of decisions on seven generations in the future',
    tags: ['temporal', 'responsibility', 'traditional'],
    icon: '🌱'
  },
  {
    id: 'MEDICINE_WHEEL',
    text: 'Organizes understanding through circular, interconnected relationships',
    tags: ['holistic', 'circular', 'traditional'],
    icon: '⭕'
  },
  {
    id: 'VISION_QUEST',
    text: 'Seeks spiritual guidance through solitary encounters with nature',
    tags: ['spiritual', 'individual', 'nature'],
    icon: '🌄'
  },
  {
    id: 'EARTH_MOTHER',
    text: 'Relates to land as a living maternal presence deserving reverence',
    tags: ['nature', 'spiritual', 'feminine'],
    icon: '🌍'
  },

  // Oceanic Worldviews
  {
    id: 'DREAMTIME_REALITY',
    text: 'Experiences the eternal present of ancestral creation stories',
    tags: ['temporal', 'spiritual', 'aboriginal'],
    icon: '🌈'
  },
  {
    id: 'SONGLINE_NAVIGATION',
    text: 'Uses sacred songs to navigate both physical and spiritual landscapes',
    tags: ['navigational', 'spiritual', 'cultural'],
    icon: '🎵'
  },
  {
    id: 'ISLAND_THINKING',
    text: 'Values self-sufficiency while maintaining ocean connections',
    tags: ['practical', 'balanced', 'environmental'],
    icon: '🏝️'
  },
  {
    id: 'WAVE_KNOWLEDGE',
    text: 'Reads ocean patterns as a complex information system',
    tags: ['environmental', 'practical', 'observational'],
    icon: '🌊'
  },

  // Modern Era Beliefs
  {
    id: 'SCIENTIFIC_METHOD',
    text: 'Relies on hypothesis, experimentation, and peer review for truth',
    tags: ['scientific', 'systematic', 'modern'],
    icon: '🧪'
  },
  {
    id: 'TECHNOLOGICAL_OPTIMISM',
    text: 'Believes technology will solve humanity\'s greatest challenges',
    tags: ['technological', 'optimistic', 'progressive'],
    icon: '🚀'
  },
  {
    id: 'PSYCHOLOGICAL_INSIGHT',
    text: 'Analyzes behavior through unconscious drives and mental patterns',
    tags: ['psychological', 'analytical', 'modern'],
    icon: '🧠'
  },
  {
    id: 'SYSTEMS_THINKING',
    text: 'Understands phenomena through complex interconnected relationships',
    tags: ['systematic', 'holistic', 'analytical'],
    icon: '🕸️'
  },
  {
    id: 'EXISTENTIAL_ANXIETY',
    text: 'Confronts the apparent meaninglessness and absurdity of existence',
    tags: ['existential', 'philosophical', 'modern'],
    icon: '🎭'
  },
  {
    id: 'SURVIVAL_FIRST',
    text: 'Prioritizes immediate survival above all other concerns',
    tags: ['practical', 'individualistic'],
    icon: '🛡️'
  }
];

// =============================================================================
// BASE IDEOLOGIES - Regional and cultural templates
// =============================================================================

const BASE_EUROPEAN_MEDIEVAL: Ideology = {
  id: 'BASE_EUROPEAN_MEDIEVAL',
  name: 'Medieval European',
  description: 'Traditional feudal Christianity with hierarchical worldview',
  eras: [HistoricalEra.MEDIEVAL],
  culturalZones: ['EUROPEAN'],
  religions: ['Roman Catholicism', 'Eastern Orthodoxy'],
  associatedBeliefs: {
    'DIVINE_RIGHT_OF_KINGS': 0.8,
    'FEUDAL_OBLIGATION': 0.9,
    'REVEALED_TRUTH': 0.85,
    'HONOR_CULTURE': 0.7,
    'COLLECTIVE_MEMORY': 0.6,
    'HIERARCHICAL_ORDER': 0.8
  }
};

const BASE_CONFUCIAN: Ideology = {
  id: 'BASE_CONFUCIAN',
  name: 'Confucian Scholar',
  description: 'Classical Chinese emphasis on social harmony, education, and virtue',
  eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
  culturalZones: ['EAST_ASIAN'],
  religions: ['Neo-Confucianism', 'Chinese Traditional Religion'],
  associatedBeliefs: {
    'FILIAL_PIETY': 0.9,
    'MANDATE_OF_HEAVEN': 0.8,
    'SCHOLARLY_TRADITION': 0.85,
    'COLLECTIVE_MEMORY': 0.7,
    'HIERARCHICAL_ORDER': 0.6,
    'MIDDLE_PATH': 0.5
  }
};

const BASE_ISLAMIC_SCHOLAR: Ideology = {
  id: 'BASE_ISLAMIC_SCHOLAR',
  name: 'Islamic Scholar',
  description: 'Synthesis of religious devotion with philosophical inquiry',
  eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
  culturalZones: ['MENA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN'],
  religions: ['Sunni Islam', 'Shia Islam'],
  associatedBeliefs: {
    'REVEALED_TRUTH': 0.8,
    'SCHOLARLY_TRADITION': 0.9,
    'GEOMETRIC_HARMONY': 0.7,
    'HOSPITALITY_SACRED': 0.8,
    'COLLECTIVE_MEMORY': 0.6
  }
};

const BASE_HINDU_DHARMIC: Ideology = {
  id: 'BASE_HINDU_DHARMIC',
  name: 'Dharmic Tradition',
  description: 'Traditional Hindu worldview emphasizing duty, cosmic order, and spiritual progress',
  eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
  culturalZones: ['SOUTH_ASIAN'],
  religions: ['Hinduism', 'Buddhism', 'Jainism'],
  associatedBeliefs: {
    'DHARMIC_DUTY': 0.85,
    'KARMA_CONSCIOUSNESS': 0.8,
    'CASTE_CONSCIOUSNESS': 0.7,
    'MOKSHA_SEEKING': 0.6,
    'AHIMSA_PRINCIPLE': 0.5,
    'CYCLICAL_TIME': 0.7
  }
};

const BASE_INDIGENOUS_AMERICAN: Ideology = {
  id: 'BASE_INDIGENOUS_AMERICAN',
  name: 'Indigenous Wisdom',
  description: 'Traditional Native American worldview emphasizing harmony with nature',
  eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
  culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
  religions: ['Great Spirit Worship', 'Shamanism', 'Animism'],
  associatedBeliefs: {
    'SEVENTH_GENERATION': 0.8,
    'EARTH_MOTHER': 0.85,
    'VISION_QUEST': 0.7,
    'MEDICINE_WHEEL': 0.6,
    'ANCESTOR_WORSHIP': 0.7,
    'NATURE_AS_TEACHER': 0.8
  }
};

const BASE_AFRICAN_COMMUNAL: Ideology = {
  id: 'BASE_AFRICAN_COMMUNAL',
  name: 'African Communalism',
  description: 'Traditional African emphasis on community, ancestors, and oral wisdom',
  eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
  culturalZones: ['SUB_SAHARAN_AFRICAN'],
  religions: ['West African Traditional Religion', 'Ancestral Worship'],
  associatedBeliefs: {
    'UBUNTU_PHILOSOPHY': 0.9,
    'ANCESTRAL_GUIDANCE': 0.85,
    'ORAL_TRADITION': 0.8,
    'RHYTHMIC_COSMOS': 0.7,
    'TRIBAL_LOYALTY': 0.8,
    'COLLECTIVE_MEMORY': 0.7
  }
};

const BASE_ANDEAN: Ideology = {
  id: 'BASE_ANDEAN',
  name: 'Andean Worldview',
  description: 'Mountain-centered spirituality with emphasis on reciprocity and balance',
  eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
  culturalZones: ['SOUTH_AMERICAN'],
  religions: ['Inca Sun Worship', 'Andean Shamanism'],
  associatedBeliefs: {
    'ELEMENTAL_HARMONY': 0.8,
    'ANCESTOR_WORSHIP': 0.7,
    'CYCLICAL_TIME': 0.6,
    'NATURE_AS_TEACHER': 0.75,
    'COLLECTIVE_MEMORY': 0.7,
    'MYSTICAL_EXPERIENCE': 0.6
  }
};

const BASE_DREAMTIME: Ideology = {
  id: 'BASE_DREAMTIME',
  name: 'Dreamtime Consciousness',
  description: 'Australian Aboriginal understanding of eternal present and land connection',
  eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
  culturalZones: ['OCEANIA'],
  religions: ['Aboriginal Dreamtime'],
  associatedBeliefs: {
    'DREAMTIME_REALITY': 0.95,
    'SONGLINE_NAVIGATION': 0.8,
    'NATURE_AS_TEACHER': 0.85,
    'ANCESTOR_WORSHIP': 0.7,
    'ORAL_TRADITION': 0.8,
    'CYCLICAL_TIME': 0.8
  }
};

// =============================================================================
// IDEOLOGY VARIANT CREATION HELPER
// =============================================================================

function createIdeologyVariant(
  base: Ideology,
  modifications: {
    id: string;
    name: string;
    description?: string;
    eras?: HistoricalEra[];
    culturalZones?: CulturalZone[];
    religions?: string[];
    beliefModifications?: Record<string, number>;
    newBeliefs?: Record<string, number>;
  }
): Ideology {
  const beliefs = { ...base.associatedBeliefs };
  
  // Apply belief modifications
  if (modifications.beliefModifications) {
    Object.entries(modifications.beliefModifications).forEach(([belief, value]) => {
      beliefs[belief] = value;
    });
  }
  
  // Add new beliefs
  if (modifications.newBeliefs) {
    Object.entries(modifications.newBeliefs).forEach(([belief, value]) => {
      beliefs[belief] = value;
    });
  }
  
  return {
    id: modifications.id,
    name: modifications.name,
    description: modifications.description || base.description,
    eras: modifications.eras || base.eras,
    culturalZones: modifications.culturalZones || base.culturalZones,
    religions: modifications.religions || base.religions,
    associatedBeliefs: beliefs
  };
}

// =============================================================================
// FALLBACK IDEOLOGIES
// =============================================================================
const ALL_CULTURES: CulturalZone[] = ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN', 'NORTH_AMERICAN_COLONIAL'];

const PREHISTORIC_ANIMISM: Ideology = {
    id: 'PREHISTORIC_ANIMISM',
    name: 'Primal Animism',
    description: 'A worldview where spirits inhabit all natural things.',
    eras: [HistoricalEra.PREHISTORY],
    culturalZones: ALL_CULTURES,
    religions: ['Animism', 'Shamanism', 'Totemism', 'Celtic Druidism', 'Germanic Paganism', 'Slavic Paganism', 'Norse Paganism', 'Local Beliefs'],
    associatedBeliefs: {
        'FOREST_SPIRITS': 0.9,
        'ANCESTOR_WORSHIP': 0.8,
        'NATURE_AS_TEACHER': 0.8,
        'LIVING_COSMOS': 0.7,
        'INTUITIVE_WISDOM': 0.6
    }
};

const MODERN_SECULARISM: Ideology = {
    id: 'MODERN_SECULARISM',
    name: 'Modern Secularism',
    description: 'A worldview skeptical of supernatural claims, focused on the material world.',
    eras: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA],
    culturalZones: ALL_CULTURES,
    religions: ['Atheism', 'Agnosticism'],
    associatedBeliefs: {
        'SCIENTIFIC_METHOD': 0.8,
        'SKEPTIC_OF_THE_DIVINE': 0.9,
        'EMPIRICAL_KNOWLEDGE': 0.7,
        'TECHNOLOGICAL_OPTIMISM': 0.6,
        'INDIVIDUAL_FREEDOM': 0.7
    }
};

const FOLK_BELIEFS_GENERIC: Ideology = {
    id: 'FOLK_BELIEFS_GENERIC',
    name: 'Folk Beliefs',
    description: 'Common traditional beliefs passed down through generations.',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA],
    culturalZones: ALL_CULTURES,
    religions: ['Local Beliefs', 'Folk Religion', 'Animist'],
    associatedBeliefs: {
        'ANCESTOR_WORSHIP': 0.7,
        'FOREST_SPIRITS': 0.6,
        'COLLECTIVE_MEMORY': 0.8,
        'NATURE_AS_TEACHER': 0.7,
        'INTUITIVE_WISDOM': 0.5
    }
};


// =============================================================================
// COMPREHENSIVE IDEOLOGIES ARRAY
// =============================================================================

export const IDEOLOGIES: Ideology[] = [
  // European Variants
  createIdeologyVariant(BASE_EUROPEAN_MEDIEVAL, {
    id: 'FEUDAL_CATHOLICISM_MEDIEVAL',
    name: 'Feudal Catholicism',
    description: 'Medieval European worldview combining feudal hierarchy with Catholic doctrine',
    eras: [HistoricalEra.MEDIEVAL],
    culturalZones: ['EUROPEAN'],
    religions: ['Roman Catholicism'],
    beliefModifications: {
      'DIVINE_RIGHT_OF_KINGS': 0.9,
      'FEUDAL_OBLIGATION': 0.95
    }
  }),

  createIdeologyVariant(BASE_EUROPEAN_MEDIEVAL, {
    id: 'RENAISSANCE_HUMANISM',
    name: 'Renaissance Humanism',
    description: 'European intellectual movement emphasizing human potential and classical learning',
    eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['EUROPEAN'],
    religions: ['Roman Catholicism', 'Protestantism'],
    beliefModifications: {
      'SCHOLARLY_TRADITION': 0.8,
      'INDIVIDUAL_FREEDOM': 0.6,
      'DIVINE_RIGHT_OF_KINGS': 0.4
    },
    newBeliefs: {
      'EMPIRICAL_KNOWLEDGE': 0.5
    }
  }),

  createIdeologyVariant(BASE_EUROPEAN_MEDIEVAL, {
    id: 'PROTESTANT_REFORMATION',
    name: 'Protestant Reformation',
    description: 'Reformed Christianity emphasizing individual relationship with divine',
    eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['EUROPEAN'],
    religions: ['Protestantism'],
    beliefModifications: {
      'INDIVIDUAL_FREEDOM': 0.7,
      'REVEALED_TRUTH': 0.9,
      'FEUDAL_OBLIGATION': 0.5
    }
  }),

  createIdeologyVariant(BASE_EUROPEAN_MEDIEVAL, {
    id: 'ENLIGHTENMENT_RATIONALISM',
    name: 'Enlightenment Rationalism',
    description: 'European intellectual movement emphasizing reason and scientific method',
    eras: [HistoricalEra.INDUSTRIAL_ERA],
    culturalZones: ['EUROPEAN'],
    religions: ['Protestantism', 'Atheism'],
    beliefModifications: {
      'EMPIRICAL_KNOWLEDGE': 0.85,
      'SCIENTIFIC_METHOD': 0.8,
      'SKEPTIC_OF_THE_DIVINE': 0.6,
      'REVEALED_TRUTH': 0.2
    },
    newBeliefs: {
      'MECHANICAL_UNIVERSE': 0.7,
      'INDIVIDUAL_FREEDOM': 0.8
    }
  }),

  createIdeologyVariant(BASE_EUROPEAN_MEDIEVAL, {
    id: 'MODERN_SECULAR_EUROPEAN',
    name: 'Modern Secular European',
    description: 'Contemporary European worldview emphasizing science, democracy, and social welfare',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['EUROPEAN'],
    religions: ['Atheism', 'Protestantism', 'Roman Catholicism'],
    beliefModifications: {
      'SCIENTIFIC_METHOD': 0.8,
      'EGALITARIAN_SPIRIT': 0.7,
      'INDIVIDUAL_FREEDOM': 0.8,
      'REVEALED_TRUTH': 0.2
    },
    newBeliefs: {
      'TECHNOLOGICAL_OPTIMISM': 0.6,
      'SYSTEMS_THINKING': 0.5
    }
  }),

  // East Asian Variants
  createIdeologyVariant(BASE_CONFUCIAN, {
    id: 'CLASSICAL_CONFUCIANISM',
    name: 'Classical Confucianism',
    description: 'Original Confucian teachings emphasizing ritual, virtue, and social harmony',
    eras: [HistoricalEra.ANTIQUITY],
    culturalZones: ['EAST_ASIAN'],
    religions: ['Confucianism', 'Chinese Traditional Religion']
  }),

  createIdeologyVariant(BASE_CONFUCIAN, {
    id: 'NEO_CONFUCIANISM',
    name: 'Neo-Confucianism',
    description: 'Medieval synthesis of Confucian ethics with metaphysical speculation',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['EAST_ASIAN'],
    religions: ['Neo-Confucianism'],
    newBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.4,
      'GEOMETRIC_HARMONY': 0.5
    }
  }),

  {
    id: 'DAOIST_NATURALISM',
    name: 'Daoist Naturalism',
    description: 'Chinese philosophy emphasizing natural harmony and effortless action',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
    culturalZones: ['EAST_ASIAN'],
    religions: ['Taoism', 'Chinese Traditional Religion'],
    associatedBeliefs: {
      'WU_WEI': 0.9,
      'NATURE_AS_TEACHER': 0.85,
      'CYCLICAL_TIME': 0.8,
      'MYSTICAL_EXPERIENCE': 0.7,
      'LIVING_COSMOS': 0.8,
      'INTUITIVE_WISDOM': 0.75
    }
  },

  {
    id: 'CHAN_BUDDHISM',
    name: 'Chan Buddhism',
    description: 'East Asian Buddhist tradition emphasizing direct experience and meditation',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['EAST_ASIAN'],
    religions: ['Buddhism', 'Chinese Traditional Religion'],
    associatedBeliefs: {
      'MIDDLE_PATH': 0.9,
      'MYSTICAL_EXPERIENCE': 0.85,
      'KARMA_CONSCIOUSNESS': 0.8,
      'INTUITIVE_WISDOM': 0.8,
      'CYCLICAL_TIME': 0.7,
      'NATURE_AS_TEACHER': 0.6
    }
  },

  createIdeologyVariant(BASE_CONFUCIAN, {
    id: 'MODERN_EAST_ASIAN',
    name: 'Modern East Asian',
    description: 'Contemporary synthesis of traditional values with technological progress',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['EAST_ASIAN'],
    religions: ['Atheism', 'Buddhism', 'Chinese Traditional Religion'],
    beliefModifications: {
      'SCIENTIFIC_METHOD': 0.8,
      'COLLECTIVE_MEMORY': 0.8
    },
    newBeliefs: {
      'TECHNOLOGICAL_OPTIMISM': 0.85,
      'SYSTEMS_THINKING': 0.7
    }
  }),

  // MENA Variants
  createIdeologyVariant(BASE_ISLAMIC_SCHOLAR, {
    id: 'CLASSICAL_ISLAMIC_GOLDEN_AGE',
    name: 'Islamic Golden Age',
    description: 'Classical Islamic synthesis of religious devotion with philosophical and scientific inquiry',
    eras: [HistoricalEra.MEDIEVAL],
    culturalZones: ['MENA'],
    religions: ['Sunni Islam', 'Shia Islam'],
    newBeliefs: {
      'EMPIRICAL_KNOWLEDGE': 0.6,
      'MYSTICAL_EXPERIENCE': 0.5
    }
  }),

  {
    id: 'PERSIAN_MYSTICISM',
    name: 'Persian Mysticism',
    description: 'Persian cultural tradition emphasizing poetry, mystical experience, and refined aesthetics',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['MENA'],
    religions: ['Shia Islam', 'Zoroastrianism'],
    associatedBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.9,
      'GEOMETRIC_HARMONY': 0.8,
      'SCHOLARLY_TRADITION': 0.7,
      'INTUITIVE_WISDOM': 0.75,
      'REVEALED_TRUTH': 0.6,
      'HOSPITALITY_SACRED': 0.8
    }
  },

  {
    id: 'BEDOUIN_HONOR',
    name: 'Bedouin Honor Culture',
    description: 'Arabian desert tradition emphasizing hospitality, poetry, and tribal loyalty',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
    culturalZones: ['MENA'],
    religions: ['Arabian Polytheism', 'Sunni Islam'],
    associatedBeliefs: {
      'HONOR_CULTURE': 0.9,
      'TRIBAL_LOYALTY': 0.85,
      'HOSPITALITY_SACRED': 0.9,
      'ORAL_TRADITION': 0.8,
      'DESERT_WISDOM': 0.8,
      'INDIVIDUAL_FREEDOM': 0.7
    }
  },

  createIdeologyVariant(BASE_ISLAMIC_SCHOLAR, {
    id: 'MODERN_MENA_SYNTHESIS',
    name: 'Modern MENA Synthesis',
    description: 'Contemporary Middle Eastern worldview balancing tradition with modernity',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['MENA'],
    religions: ['Sunni Islam', 'Shia Islam', 'Christianity'],
    beliefModifications: {
      'SCIENTIFIC_METHOD': 0.6,
      'TECHNOLOGICAL_OPTIMISM': 0.5
    },
    newBeliefs: {
      'SYSTEMS_THINKING': 0.4
    }
  }),

  // South Asian Variants
  createIdeologyVariant(BASE_HINDU_DHARMIC, {
    id: 'CLASSICAL_HINDUISM',
    name: 'Classical Hinduism',
    description: 'Traditional Hindu worldview emphasizing dharma, karma, and cosmic order',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
    culturalZones: ['SOUTH_ASIAN'],
    religions: ['Hinduism', 'Early Hinduism']
  }),

  {
    id: 'BUDDHIST_LIBERATION',
    name: 'Buddhist Liberation',
    description: 'Buddhist path emphasizing liberation from suffering through mindfulness and compassion',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
    culturalZones: ['SOUTH_ASIAN', 'EAST_ASIAN'],
    religions: ['Buddhism', 'Theravada Buddhism', 'Tibetan Buddhism'],
    associatedBeliefs: {
      'MIDDLE_PATH': 0.9,
      'KARMA_CONSCIOUSNESS': 0.85,
      'AHIMSA_PRINCIPLE': 0.8,
      'MOKSHA_SEEKING': 0.8,
      'MYSTICAL_EXPERIENCE': 0.7,
      'CYCLICAL_TIME': 0.7
    }
  },

  {
    id: 'TANTRIC_SYNTHESIS',
    name: 'Tantric Synthesis',
    description: 'Hindu-Buddhist tradition integrating spiritual practice with worldly engagement',
    eras: [HistoricalEra.MEDIEVAL],
    culturalZones: ['SOUTH_ASIAN'],
    religions: ['Hinduism', 'Buddhism'],
    associatedBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.9,
      'LIVING_COSMOS': 0.85,
      'INTUITIVE_WISDOM': 0.8,
      'ELEMENTAL_HARMONY': 0.7,
      'KARMA_CONSCIOUSNESS': 0.75,
      'NATURE_AS_TEACHER': 0.6
    }
  },

  createIdeologyVariant(BASE_HINDU_DHARMIC, {
    id: 'MODERN_SOUTH_ASIAN',
    name: 'Modern South Asian',
    description: 'Contemporary South Asian worldview integrating traditional spirituality with modern values',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['SOUTH_ASIAN'],
    religions: ['Hinduism', 'Buddhism', 'Sunni Islam', 'Christianity'],
    beliefModifications: {
      'SCIENTIFIC_METHOD': 0.7,
      'EGALITARIAN_SPIRIT': 0.6,
      'CASTE_CONSCIOUSNESS': 0.3
    },
    newBeliefs: {
      'TECHNOLOGICAL_OPTIMISM': 0.6,
      'SYSTEMS_THINKING': 0.5
    }
  }),

  // North American Pre-Columbian Variants
  createIdeologyVariant(BASE_INDIGENOUS_AMERICAN, {
    id: 'PLAINS_VISION_CULTURE',
    name: 'Plains Vision Culture',
    description: 'Great Plains spiritual tradition emphasizing individual visions and buffalo spirituality',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    religions: ['Great Spirit Worship', 'Sun Dance Religion', 'Buffalo Shamanism'],
    beliefModifications: {
      'VISION_QUEST': 0.9,
      'INDIVIDUAL_FREEDOM': 0.8
    }
  }),

  createIdeologyVariant(BASE_INDIGENOUS_AMERICAN, {
    id: 'WOODLAND_COUNCIL_WISDOM',
    name: 'Woodland Council Wisdom',
    description: 'Northeastern woodland tradition emphasizing consensus, longhouse, and forest spirits',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    religions: ['Iroquois Longhouse Religion', 'Forest Spirit Worship'],
    beliefModifications: {
      'EGALITARIAN_SPIRIT': 0.8,
      'COLLECTIVE_MEMORY': 0.8
    },
    newBeliefs: {
      'FOREST_SPIRITS': 0.9
    }
  }),

  {
    id: 'PUEBLO_CEREMONIALISM',
    name: 'Pueblo Ceremonialism',
    description: 'Southwestern tradition emphasizing agricultural cycles, kachina spirits, and community ritual',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    religions: ['Pueblo Religion', 'Kachina Worship'],
    associatedBeliefs: {
      'ELEMENTAL_HARMONY': 0.9,
      'COLLECTIVE_MEMORY': 0.85,
      'CYCLICAL_TIME': 0.8,
      'NATURE_AS_TEACHER': 0.8,
      'ANCESTOR_WORSHIP': 0.7,
      'MYSTICAL_EXPERIENCE': 0.6
    }
  },

  {
    id: 'ARCTIC_SHAMANISM',
    name: 'Arctic Shamanism',
    description: 'Arctic spiritual tradition emphasizing survival, animal spirits, and harsh environment wisdom',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    religions: ['Inuit Shamanism', 'Arctic Animism'],
    associatedBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.85,
      'NATURE_AS_TEACHER': 0.9,
      'ANCESTOR_WORSHIP': 0.7,
      'INTUITIVE_WISDOM': 0.8,
      'ORAL_TRADITION': 0.8,
      'INDIVIDUAL_FREEDOM': 0.6
    }
  },

  // Sub-Saharan African Variants
  createIdeologyVariant(BASE_AFRICAN_COMMUNAL, {
    id: 'WEST_AFRICAN_GRIOTS',
    name: 'West African Griot Tradition',
    description: 'West African cultural tradition emphasizing storytelling, music, and historical memory',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    religions: ['West African Traditional Religion', 'Sunni Islam'],
    beliefModifications: {
      'ORAL_TRADITION': 0.95,
      'RHYTHMIC_COSMOS': 0.9
    }
  }),

  {
    id: 'ETHIOPIAN_HIGHLANDS',
    name: 'Ethiopian Highland Christianity',
    description: 'Ancient African Christian tradition with unique theological and cultural synthesis',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    religions: ['Ethiopian Orthodox Christianity', 'Ethiopian Judaism'],
    associatedBeliefs: {
      'REVEALED_TRUTH': 0.8,
      'SCHOLARLY_TRADITION': 0.7,
      'ANCESTRAL_GUIDANCE': 0.6,
      'COLLECTIVE_MEMORY': 0.75,
      'HOSPITALITY_SACRED': 0.8,
      'HONOR_CULTURE': 0.6
    }
  },

  {
    id: 'BANTU_MIGRATION',
    name: 'Bantu Traditional Worldview',
    description: 'Central and Southern African tradition emphasizing kinship, cattle, and ancestral connection',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    religions: ['Central African Traditional Religion', 'Southern African Traditional Religion'],
    associatedBeliefs: {
      'UBUNTU_PHILOSOPHY': 0.9,
      'ANCESTRAL_GUIDANCE': 0.85,
      'TRIBAL_LOYALTY': 0.8,
      'ORAL_TRADITION': 0.8,
      'NATURE_AS_TEACHER': 0.7,
      'CYCLICAL_TIME': 0.6
    }
  },

  createIdeologyVariant(BASE_AFRICAN_COMMUNAL, {
    id: 'MODERN_AFRICAN_SYNTHESIS',
    name: 'Modern African Synthesis',
    description: 'Contemporary African worldview integrating traditional values with post-colonial identity',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    religions: ['Christianity', 'Sunni Islam', 'West African Traditional Religion'],
    beliefModifications: {
      'EGALITARIAN_SPIRIT': 0.7,
      'INDIVIDUAL_FREEDOM': 0.6
    },
    newBeliefs: {
      'TECHNOLOGICAL_OPTIMISM': 0.5,
      'SYSTEMS_THINKING': 0.4
    }
  }),

  // South American Variants
  createIdeologyVariant(BASE_ANDEAN, {
    id: 'INCA_IMPERIAL_CULT',
    name: 'Inca Imperial Cult',
    description: 'Andean imperial tradition emphasizing sun worship, reciprocity, and state organization',
    eras: [HistoricalEra.MEDIEVAL],
    culturalZones: ['SOUTH_AMERICAN'],
    religions: ['Inca Sun Worship'],
    beliefModifications: {
      'DIVINE_RIGHT_OF_KINGS': 0.8,
      'HIERARCHICAL_ORDER': 0.7
    }
  }),

  {
    id: 'AMAZONIAN_SHAMANISM',
    name: 'Amazonian Shamanism',
    description: 'Amazon basin spiritual tradition emphasizing plant teachers and forest wisdom',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['SOUTH_AMERICAN'],
    religions: ['Amazonian Shamanism', 'Forest Spirit Worship'],
    associatedBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.9,
      'NATURE_AS_TEACHER': 0.95,
      'FOREST_SPIRITS': 0.9,
      'INTUITIVE_WISDOM': 0.85,
      'LIVING_COSMOS': 0.8,
      'TRIBAL_LOYALTY': 0.7
    }
  },

  {
    id: 'GUARANI_LAND_WITHOUT_EVIL',
    name: 'Guarani Land Without Evil',
    description: 'Guarani spiritual tradition emphasizing the search for earthly paradise',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['SOUTH_AMERICAN'],
    religions: ['Guarani Shamanism'],
    associatedBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.8,
      'CYCLICAL_TIME': 0.7,
      'NATURE_AS_TEACHER': 0.8,
      'ORAL_TRADITION': 0.8,
      'COLLECTIVE_MEMORY': 0.7,
      'MOKSHA_SEEKING': 0.6
    }
  },

  {
    id: 'MODERN_LATIN_AMERICAN',
    name: 'Modern Latin American',
    description: 'Contemporary Latin American worldview blending indigenous, Catholic, and modern influences',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['SOUTH_AMERICAN'],
    religions: ['Roman Catholicism', 'Pentecostalism', 'Syncretic Christianity'],
    associatedBeliefs: {
      'REVEALED_TRUTH': 0.7,
      'COLLECTIVE_MEMORY': 0.6,
      'EGALITARIAN_SPIRIT': 0.6,
      'MYSTICAL_EXPERIENCE': 0.5,
      'TECHNOLOGICAL_OPTIMISM': 0.5,
      'SYSTEMS_THINKING': 0.4
    }
  },

  // Oceanic Variants
  createIdeologyVariant(BASE_DREAMTIME, {
    id: 'ABORIGINAL_DREAMTIME_CLASSICAL',
    name: 'Classical Dreamtime',
    description: 'Traditional Australian Aboriginal worldview of eternal present and land connection',
    eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
    culturalZones: ['OCEANIA'],
    religions: ['Aboriginal Dreamtime']
  }),

  {
    id: 'POLYNESIAN_NAVIGATION',
    name: 'Polynesian Navigation Culture',
    description: 'Pacific island tradition emphasizing ocean knowledge, celestial navigation, and island wisdom',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['OCEANIA'],
    religions: ['Polynesian Traditional Religion'],
    associatedBeliefs: {
      'WAVE_KNOWLEDGE': 0.9,
      'ISLAND_THINKING': 0.85,
      'NATURE_AS_TEACHER': 0.8,
      'ANCESTOR_WORSHIP': 0.7,
      'ORAL_TRADITION': 0.8,
      'MYSTICAL_EXPERIENCE': 0.6
    }
  },

  {
    id: 'MELANESIAN_CARGO_CULTURE',
    name: 'Melanesian Exchange Culture',
    description: 'Melanesian tradition emphasizing reciprocity, big man leadership, and spiritual exchange',
    eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    culturalZones: ['OCEANIA'],
    religions: ['Melanesian Traditional Religion', 'Ancestor Worship'],
    associatedBeliefs: {
      'TRIBAL_LOYALTY': 0.8,
      'ANCESTRAL_GUIDANCE': 0.8,
      'HONOR_CULTURE': 0.7,
      'MYSTICAL_EXPERIENCE': 0.7,
      'ORAL_TRADITION': 0.8,
      'INDIVIDUAL_FREEDOM': 0.6
    }
  },

  createIdeologyVariant(BASE_DREAMTIME, {
    id: 'MODERN_OCEANIC_SYNTHESIS',
    name: 'Modern Oceanic Synthesis',
    description: 'Contemporary Pacific worldview integrating traditional island wisdom with global awareness',
    eras: [HistoricalEra.MODERN_ERA],
    culturalZones: ['OCEANIA'],
    religions: ['Christianity', 'Aboriginal Dreamtime', 'Polynesian Traditional Religion'],
    beliefModifications: {
      'TECHNOLOGICAL_OPTIMISM': 0.6,
      'EGALITARIAN_SPIRIT': 0.6
    },
    newBeliefs: {
      'SYSTEMS_THINKING': 0.5
    }
  }),

  // Future Era Ideologies
  {
    id: 'TRANSHUMANIST_OPTIMISM',
    name: 'Transhumanist Optimism',
    description: 'Future worldview emphasizing technological enhancement of human capabilities',
    eras: [HistoricalEra.FUTURE_ERA],
    culturalZones: ['EUROPEAN', 'EAST_ASIAN', 'NORTH_AMERICAN_COLONIAL'],
    religions: ['Atheism', 'Transhumanism'],
    associatedBeliefs: {
      'TECHNOLOGICAL_OPTIMISM': 0.95,
      'SCIENTIFIC_METHOD': 0.9,
      'INDIVIDUAL_FREEDOM': 0.8,
      'SYSTEMS_THINKING': 0.85,
      'PSYCHOLOGICAL_INSIGHT': 0.7,
      'SKEPTIC_OF_THE_DIVINE': 0.8
    }
  },

  {
    id: 'NEO_SHAMANIC_SYNTHESIS',
    name: 'Neo-Shamanic Synthesis',
    description: 'Future spiritual movement integrating ancient wisdom with quantum consciousness',
    eras: [HistoricalEra.FUTURE_ERA],
    culturalZones: ['NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_AMERICAN'],
    religions: ['Neo-Shamanism', 'Quantum Spirituality'],
    associatedBeliefs: {
      'MYSTICAL_EXPERIENCE': 0.9,
      'SYSTEMS_THINKING': 0.8,
      'LIVING_COSMOS': 0.85,
      'NATURE_AS_TEACHER': 0.8,
      'INTUITIVE_WISDOM': 0.8,
      'PSYCHOLOGICAL_INSIGHT': 0.7
    }
  },

  {
    id: 'GLOBAL_CONSCIOUSNESS',
    name: 'Global Consciousness',
    description: 'Future planetary awareness integrating all cultural traditions with ecological thinking',
    eras: [HistoricalEra.FUTURE_ERA],
    culturalZones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA', 'NORTH_AMERICAN_COLONIAL'],
    religions: ['Universal Consciousness', 'Gaia Philosophy'],
    associatedBeliefs: {
      'SYSTEMS_THINKING': 0.95,
      'EGALITARIAN_SPIRIT': 0.9,
      'UBUNTU_PHILOSOPHY': 0.8,
      'SEVENTH_GENERATION': 0.85,
      'SCIENTIFIC_METHOD': 0.8,
      'MYSTICAL_EXPERIENCE': 0.6,
      'LIVING_COSMOS': 0.8
    }
  },

  // Add the fallback ideologies
  PREHISTORIC_ANIMISM,
  MODERN_SECULARISM,
  FOLK_BELIEFS_GENERIC,
];