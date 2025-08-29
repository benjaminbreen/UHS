/**
 * constants/specialMaps/specialGeography.ts
 * Maps specific locations and eras to their special map configurations
 */

import { 
  SpecialMapArchetype, 
  SpecialMapRegistry,
  GovernmentDistrictConfig 
} from '../../types/specialMapTypes';
import { HistoricalEra } from '../../types';

/**
 * Registry of special maps available for each map area and era
 */
export const SPECIAL_MAP_REGISTRY: SpecialMapRegistry = {
  // Europe - Britain - London
  'europe.britain.london': {
    [HistoricalEra.MEDIEVAL]: {
      mapAreaName: 'london',
      era: HistoricalEra.MEDIEVAL,
      availableArchetypes: [
        SpecialMapArchetype.MILITARY_FORTRESS,
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.SACRED_COMPLEX
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.MILITARY_FORTRESS,
          name: 'Tower of London',
          description: 'Royal fortress and prison on the Thames',
          yearRange: [1066, 1500]
        },
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Palace of Westminster',
          description: 'Royal palace and seat of parliament',
          yearRange: [1097, 1500]
        },
        {
          archetype: SpecialMapArchetype.SACRED_COMPLEX,
          name: 'Westminster Abbey',
          description: 'Coronation church and royal necropolis',
          yearRange: [960, 1500]
        }
      ]
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      mapAreaName: 'london',
      era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
      availableArchetypes: [
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.PALACE_COMPLEX,
        SpecialMapArchetype.THEATER
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Whitehall Palace',
          description: 'Main royal residence and government center',
          yearRange: [1530, 1698]
        },
        {
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Hampton Court Palace',
          description: 'Tudor palace on the Thames',
          yearRange: [1515, 1700]
        },
        {
          archetype: SpecialMapArchetype.THEATER,
          name: 'Globe Theatre',
          description: 'Shakespeare\'s playhouse',
          yearRange: [1599, 1642]
        }
      ]
    },
    [HistoricalEra.MODERN_ERA]: {
      mapAreaName: 'london',
      era: HistoricalEra.MODERN_ERA,
      availableArchetypes: [
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.PALACE_COMPLEX,
        SpecialMapArchetype.MILITARY_FORTRESS
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Palace of Westminster',
          description: 'Houses of Parliament and Big Ben',
          yearRange: [1840, 2024]
        },
        {
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Buckingham Palace',
          description: 'Primary royal residence',
          yearRange: [1837, 2024]
        },
        {
          archetype: SpecialMapArchetype.MILITARY_FORTRESS,
          name: 'Churchill War Rooms',
          description: 'Underground WWII command bunker',
          yearRange: [1939, 1945]
        }
      ]
    }
  },

  // Asia - China - Beijing
  'asia.china.beijing': {
    [HistoricalEra.MEDIEVAL]: {
      mapAreaName: 'beijing',
      era: HistoricalEra.MEDIEVAL,
      availableArchetypes: [
        SpecialMapArchetype.PALACE_COMPLEX,
        SpecialMapArchetype.SACRED_COMPLEX
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Dadu Imperial Palace',
          description: 'Yuan Dynasty palace complex',
          yearRange: [1271, 1368]
        },
        {
          archetype: SpecialMapArchetype.SACRED_COMPLEX,
          name: 'Temple of Heaven',
          description: 'Imperial temple for harvest prayers',
          yearRange: [1420, 1500]
        }
      ]
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      mapAreaName: 'beijing',
      era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
      availableArchetypes: [
        SpecialMapArchetype.PALACE_COMPLEX,
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.SACRED_COMPLEX
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Forbidden City',
          description: 'Imperial palace with 9,999 rooms',
          yearRange: [1420, 1912]
        },
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Hall of Supreme Harmony',
          description: 'Imperial throne hall for ceremonies',
          yearRange: [1420, 1912]
        },
        {
          archetype: SpecialMapArchetype.SACRED_COMPLEX,
          name: 'Temple of Heaven',
          description: 'Imperial temple complex',
          yearRange: [1420, 1700]
        }
      ]
    }
  },

  // MENA - Anatolia - Istanbul/Constantinople
  'mena.anatolia.constantinople': {
    [HistoricalEra.ANTIQUITY]: {
      mapAreaName: 'constantinople',
      era: HistoricalEra.ANTIQUITY,
      availableArchetypes: [
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.ARENA,
        SpecialMapArchetype.SACRED_COMPLEX
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Great Palace of Constantinople',
          description: 'Byzantine imperial palace',
          yearRange: [330, 500]
        },
        {
          archetype: SpecialMapArchetype.ARENA,
          name: 'Hippodrome',
          description: 'Chariot racing stadium',
          yearRange: [203, 500]
        },
        {
          archetype: SpecialMapArchetype.SACRED_COMPLEX,
          name: 'Hagia Sophia',
          description: 'Cathedral of Holy Wisdom',
          yearRange: [360, 500]
        }
      ]
    },
    [HistoricalEra.MEDIEVAL]: {
      mapAreaName: 'constantinople',
      era: HistoricalEra.MEDIEVAL,
      availableArchetypes: [
        SpecialMapArchetype.SACRED_COMPLEX,
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.MILITARY_FORTRESS
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.SACRED_COMPLEX,
          name: 'Hagia Sophia',
          description: 'Greatest Byzantine cathedral',
          yearRange: [537, 1453]
        },
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Blachernae Palace',
          description: 'Later Byzantine imperial palace',
          yearRange: [1081, 1453]
        },
        {
          archetype: SpecialMapArchetype.MILITARY_FORTRESS,
          name: 'Theodosian Walls',
          description: 'Triple wall defensive system',
          yearRange: [413, 1453]
        }
      ]
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      mapAreaName: 'istanbul',
      era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
      availableArchetypes: [
        SpecialMapArchetype.PALACE_COMPLEX,
        SpecialMapArchetype.MARKET_BAZAAR,
        SpecialMapArchetype.SACRED_COMPLEX
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Topkapı Palace',
          description: 'Ottoman imperial palace with four courts',
          yearRange: [1465, 1700]
        },
        {
          archetype: SpecialMapArchetype.MARKET_BAZAAR,
          name: 'Grand Bazaar',
          description: '61 covered streets, 4000 shops',
          yearRange: [1455, 1700]
        },
        {
          archetype: SpecialMapArchetype.SACRED_COMPLEX,
          name: 'Süleymaniye Mosque',
          description: 'Imperial mosque complex',
          yearRange: [1557, 1700]
        }
      ]
    }
  },

  // North America - Colonial - Washington DC
  'north_america.usa.washington': {
    [HistoricalEra.INDUSTRIAL_ERA]: {
      mapAreaName: 'washington',
      era: HistoricalEra.INDUSTRIAL_ERA,
      availableArchetypes: [
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.EXHIBITION
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'US Capitol',
          description: 'Senate and House chambers',
          yearRange: [1800, 1900]
        },
        {
          archetype: SpecialMapArchetype.EXHIBITION,
          name: 'Smithsonian Castle',
          description: 'First national museum',
          yearRange: [1855, 1900]
        }
      ]
    },
    [HistoricalEra.MODERN_ERA]: {
      mapAreaName: 'washington',
      era: HistoricalEra.MODERN_ERA,
      availableArchetypes: [
        SpecialMapArchetype.GOVERNMENT_FORUM,
        SpecialMapArchetype.EXHIBITION,
        SpecialMapArchetype.OPEN_FIELD
      ],
      historicalExamples: [
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'US Capitol Complex',
          description: 'Capitol building and office buildings',
          yearRange: [1900, 2024]
        },
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'White House',
          description: 'Executive mansion and West Wing',
          yearRange: [1900, 2024]
        },
        {
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Supreme Court',
          description: 'Highest court of the United States',
          yearRange: [1935, 2024]
        },
        {
          archetype: SpecialMapArchetype.EXHIBITION,
          name: 'National Mall Museums',
          description: 'Smithsonian complex',
          yearRange: [1900, 2024]
        },
        {
          archetype: SpecialMapArchetype.OPEN_FIELD,
          name: 'National Mall',
          description: 'Grand ceremonial avenue',
          yearRange: [1900, 2024]
        }
      ]
    }
  },

  // Add more locations as needed...
};

/**
 * Get the appropriate special map configs for a location and era
 */
export function getSpecialMapsForLocation(
  mapAreaName: string, 
  era: HistoricalEra
): GovernmentDistrictConfig | null {
  return SPECIAL_MAP_REGISTRY[mapAreaName]?.[era] || null;
}

/**
 * Get a generic government district config based on cultural zone and era
 */
export function getGenericGovernmentDistrict(
  culturalZone: string,
  era: HistoricalEra
): GovernmentDistrictConfig {
  // Default configurations by cultural zone and era
  const defaults: Record<string, Record<string, Partial<GovernmentDistrictConfig>>> = {
    'EUROPEAN': {
      [HistoricalEra.MEDIEVAL]: {
        availableArchetypes: [SpecialMapArchetype.MILITARY_FORTRESS, SpecialMapArchetype.GOVERNMENT_FORUM],
        historicalExamples: [{
          archetype: SpecialMapArchetype.MILITARY_FORTRESS,
          name: 'Royal Keep',
          description: 'Fortified castle and administrative center',
          yearRange: [1000, 1500]
        }]
      },
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
        availableArchetypes: [SpecialMapArchetype.PALACE_COMPLEX, SpecialMapArchetype.GOVERNMENT_FORUM],
        historicalExamples: [{
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Royal Palace',
          description: 'Baroque palace and government seat',
          yearRange: [1500, 1800]
        }]
      },
      [HistoricalEra.MODERN_ERA]: {
        availableArchetypes: [SpecialMapArchetype.GOVERNMENT_FORUM],
        historicalExamples: [{
          archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
          name: 'Parliament Building',
          description: 'Democratic assembly hall',
          yearRange: [1800, 2024]
        }]
      }
    },
    'EAST_ASIAN': {
      [HistoricalEra.MEDIEVAL]: {
        availableArchetypes: [SpecialMapArchetype.PALACE_COMPLEX, SpecialMapArchetype.GOVERNMENT_FORUM],
        historicalExamples: [{
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Imperial Palace',
          description: 'Emperor\'s residence and court',
          yearRange: [500, 1500]
        }]
      }
    },
    'MENA': {
      [HistoricalEra.MEDIEVAL]: {
        availableArchetypes: [SpecialMapArchetype.PALACE_COMPLEX, SpecialMapArchetype.MILITARY_FORTRESS],
        historicalExamples: [{
          archetype: SpecialMapArchetype.PALACE_COMPLEX,
          name: 'Sultan\'s Palace',
          description: 'Palace with courtyards and gardens',
          yearRange: [700, 1500]
        }]
      }
    }
  };

  const zoneDefaults = defaults[culturalZone]?.[era];
  
  return {
    mapAreaName: 'generic',
    era,
    availableArchetypes: zoneDefaults?.availableArchetypes || [SpecialMapArchetype.GOVERNMENT_FORUM],
    historicalExamples: zoneDefaults?.historicalExamples || [{
      archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
      name: 'Government Building',
      description: 'Administrative center',
      yearRange: [0, 2024]
    }]
  } as GovernmentDistrictConfig;
}