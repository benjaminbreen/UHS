/**
 * constants/specialMaps/historicalAccessRules.ts
 * Historical access rules for different room types based on era, culture, and social norms
 */

import { SpecialMapArchetype, ProfessionCategory } from '../../types/specialMapTypes';
import { HistoricalEra } from '../../types';

// Import CulturalZone as a type but use string literals for runtime
type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'SUB_SAHARAN_AFRICAN' | 
                    'SOUTH_ASIAN' | 'NATIVE_AMERICAN' | 'OCEANIA';

export interface AccessRule {
  roomType: string;
  era?: HistoricalEra;
  year?: { before?: number; after?: number };
  culture?: CulturalZone;
  genderRestriction?: 'male' | 'female' | 'any';
  professionCategories?: ProfessionCategory[];
  specificProfessions?: string[];
  socialClasses?: string[];
}

/**
 * Historical access rules for different archetypes
 */
export const HISTORICAL_ACCESS_RULES: Record<SpecialMapArchetype, AccessRule[]> = {
  [SpecialMapArchetype.GOVERNMENT_FORUM]: [
    // Pre-modern parliaments were male-only
    {
      roomType: 'assembly',
      year: { before: 1900 },
      genderRestriction: 'male',
      professionCategories: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL],
      socialClasses: ['NOBILITY', 'UPPER_CLASS', 'SCHOLAR_OFFICIAL']
    },
    // Public galleries allowed mixed gender
    {
      roomType: 'gallery',
      professionCategories: [ProfessionCategory.COMMONER, ProfessionCategory.MERCHANT],
      socialClasses: ['COMMONER', 'MERCHANT', 'ARTISAN']
    },
    // Committee rooms for officials
    {
      roomType: 'chamber',
      professionCategories: [ProfessionCategory.OFFICIAL, ProfessionCategory.NOBILITY],
      specificProfessions: ['Magistrate', 'Judge', 'Minister', 'Senator']
    },
    // Archives for scholars and clerks
    {
      roomType: 'library',
      professionCategories: [ProfessionCategory.SCHOLAR, ProfessionCategory.OFFICIAL],
      specificProfessions: ['Scribe', 'Clerk', 'Librarian', 'Scholar']
    }
  ],
  
  [SpecialMapArchetype.PALACE_COMPLEX]: [
    // Throne room - nobility and high officials only
    {
      roomType: 'throne_room',
      professionCategories: [ProfessionCategory.NOBILITY, ProfessionCategory.CLERGY],
      specificProfessions: ['Guard Captain', 'Royal Guard', 'Vizier', 'Chancellor', 'Ambassador'],
      socialClasses: ['NOBILITY', 'UPPER_CLASS', 'CLERGY']
    },
    // Harem in Ottoman/Islamic palaces
    {
      roomType: 'private_chamber',
      culture: 'MENA' as CulturalZone,
      era: HistoricalEra.MEDIEVAL,
      genderRestriction: 'female',
      specificProfessions: ['Concubine', 'Eunuch', 'Servant', 'Lady-in-Waiting']
    },
    {
      roomType: 'private_chamber',
      culture: 'MENA' as CulturalZone,
      era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
      genderRestriction: 'female',
      specificProfessions: ['Concubine', 'Eunuch', 'Servant', 'Lady-in-Waiting']
    },
    // Servants' quarters
    {
      roomType: 'servants_quarters',
      professionCategories: [ProfessionCategory.SERVANT],
      socialClasses: ['COMMONER', 'WORKING_CLASS']
    },
    // Gardens - mixed but upper class
    {
      roomType: 'garden',
      professionCategories: [ProfessionCategory.NOBILITY, ProfessionCategory.CLERGY, ProfessionCategory.SERVANT],
      socialClasses: ['NOBILITY', 'UPPER_CLASS', 'CLERGY']
    },
    // Public courtyard
    {
      roomType: 'courtyard',
      professionCategories: [ProfessionCategory.COMMONER, ProfessionCategory.MERCHANT, ProfessionCategory.ARTISAN],
      socialClasses: ['COMMONER', 'MERCHANT', 'ARTISAN', 'CITIZEN']
    },
    // Treasury - restricted
    {
      roomType: 'treasury',
      professionCategories: [ProfessionCategory.OFFICIAL],
      specificProfessions: ['Treasurer', 'Chancellor', 'Tax Collector', 'Accountant']
    },
    // Kitchen
    {
      roomType: 'kitchen',
      professionCategories: [ProfessionCategory.SERVANT],
      specificProfessions: ['Cook', 'Chef', 'Servant', 'Butler']
    }
  ],
  
  [SpecialMapArchetype.SACRED_COMPLEX]: [
    // Main prayer hall in mosque - men only
    {
      roomType: 'sanctuary',
      culture: 'MENA' as CulturalZone,
      genderRestriction: 'male',
      professionCategories: [ProfessionCategory.CLERGY, ProfessionCategory.COMMONER]
    },
    // Women's gallery in mosque
    {
      roomType: 'gallery',
      culture: 'MENA' as CulturalZone,
      genderRestriction: 'female',
      professionCategories: [ProfessionCategory.COMMONER]
    },
    // Medieval church sanctuary - clergy dominated
    {
      roomType: 'sanctuary',
      culture: 'EUROPEAN' as CulturalZone,
      era: HistoricalEra.MEDIEVAL,
      professionCategories: [ProfessionCategory.CLERGY],
      specificProfessions: ['Priest', 'Bishop', 'Monk', 'Friar', 'Abbot']
    },
    // Buddhist temple
    {
      roomType: 'sanctuary',
      culture: 'EAST_ASIAN' as CulturalZone,
      professionCategories: [ProfessionCategory.CLERGY],
      specificProfessions: ['Buddhist Monk', 'Priest', 'Pilgrim']
    },
    // Hindu temple - Brahmin only areas
    {
      roomType: 'sanctuary',
      culture: 'SOUTH_ASIAN' as CulturalZone,
      socialClasses: ['BRAHMIN'],
      specificProfessions: ['Hindu Priest', 'Priest', 'Scholar']
    },
    // Library/scriptorium
    {
      roomType: 'library',
      professionCategories: [ProfessionCategory.CLERGY, ProfessionCategory.SCHOLAR],
      specificProfessions: ['Monk', 'Scribe', 'Scholar', 'Librarian']
    }
  ],
  
  [SpecialMapArchetype.MILITARY_FORTRESS]: [
    // Armory - military only
    {
      roomType: 'armory',
      professionCategories: [ProfessionCategory.MILITARY],
      genderRestriction: 'male',
      socialClasses: ['MILITARY', 'SAMURAI_CLASS', 'KSHATRIYA']
    },
    // Barracks - soldiers
    {
      roomType: 'barracks',
      professionCategories: [ProfessionCategory.MILITARY],
      genderRestriction: 'male',
      specificProfessions: ['Soldier', 'Guard', 'Archer', 'Cavalry']
    },
    // Command center
    {
      roomType: 'hall',
      professionCategories: [ProfessionCategory.MILITARY, ProfessionCategory.NOBILITY],
      specificProfessions: ['General', 'Captain', 'Colonel', 'Commander', 'Knight']
    },
    // Prison cells
    {
      roomType: 'chamber',
      professionCategories: [ProfessionCategory.MILITARY],
      specificProfessions: ['Guard', 'Jailer', 'Interrogator']
    }
  ],
  
  [SpecialMapArchetype.UNIVERSITY]: [
    // Library - scholars and students
    {
      roomType: 'library',
      year: { before: 1800 },
      genderRestriction: 'male',
      professionCategories: [ProfessionCategory.SCHOLAR, ProfessionCategory.CLERGY],
      socialClasses: ['SCHOLAR_OFFICIAL', 'CLERGY', 'UPPER_CLASS']
    },
    {
      roomType: 'library',
      year: { after: 1800 },
      professionCategories: [ProfessionCategory.SCHOLAR],
      socialClasses: ['UPPER_CLASS', 'MIDDLE_CLASS']
    },
    // Lecture halls
    {
      roomType: 'hall',
      professionCategories: [ProfessionCategory.SCHOLAR],
      specificProfessions: ['Professor', 'Teacher', 'Scholar', 'Student', 'Philosopher']
    },
    // Private study chambers
    {
      roomType: 'chamber',
      professionCategories: [ProfessionCategory.SCHOLAR],
      specificProfessions: ['Professor', 'Scholar', 'Philosopher', 'Scientist']
    }
  ],
  
  [SpecialMapArchetype.MARKET_BAZAAR]: [
    // Market stalls - merchants
    {
      roomType: 'marketplace',
      professionCategories: [ProfessionCategory.MERCHANT, ProfessionCategory.ARTISAN],
      socialClasses: ['MERCHANT', 'ARTISAN', 'COMMONER']
    },
    // Entrance - everyone
    {
      roomType: 'entrance',
      // No restrictions - public space
    },
    // Storage areas
    {
      roomType: 'chamber',
      professionCategories: [ProfessionCategory.MERCHANT, ProfessionCategory.SERVANT],
      specificProfessions: ['Merchant', 'Trader', 'Porter', 'Worker']
    }
  ],
  
  [SpecialMapArchetype.THEATER]: [
    // Stage - performers only
    {
      roomType: 'hall',
      professionCategories: [ProfessionCategory.ARTISAN],
      specificProfessions: ['Actor', 'Musician', 'Dancer', 'Bard', 'Entertainer']
    },
    // Gallery - upper class seating
    {
      roomType: 'gallery',
      socialClasses: ['NOBILITY', 'UPPER_CLASS', 'MERCHANT']
    },
    // Ground floor - commoners
    {
      roomType: 'courtyard',
      socialClasses: ['COMMONER', 'ARTISAN', 'WORKING_CLASS']
    }
  ],
  
  [SpecialMapArchetype.ARENA]: [
    // Arena floor - gladiators/athletes
    {
      roomType: 'courtyard',
      professionCategories: [ProfessionCategory.COMMONER],
      specificProfessions: ['Gladiator', 'Athlete', 'Warrior', 'Fighter']
    },
    // Royal box
    {
      roomType: 'gallery',
      socialClasses: ['NOBILITY', 'UPPER_CLASS']
    },
    // Common seating
    {
      roomType: 'entrance',
      socialClasses: ['COMMONER', 'CITIZEN', 'PLEBEIAN']
    }
  ],
  
  [SpecialMapArchetype.EXHIBITION]: [
    // Display halls - open to public but curated
    {
      roomType: 'hall',
      professionCategories: [ProfessionCategory.SCHOLAR, ProfessionCategory.ARTISAN, ProfessionCategory.MERCHANT]
    },
    // Workshop areas
    {
      roomType: 'workshop',
      professionCategories: [ProfessionCategory.ARTISAN],
      specificProfessions: ['Craftsman', 'Artist', 'Sculptor', 'Painter']
    }
  ],
  
  [SpecialMapArchetype.OPEN_FIELD]: [
    // Festival grounds - public
    {
      roomType: 'courtyard',
      // No restrictions - public gathering space
    }
  ]
};

/**
 * Get applicable access rules for a specific room
 */
export function getApplicableRules(
  archetype: SpecialMapArchetype,
  roomType: string,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  year?: number
): AccessRule | null {
  const archetypeRules = HISTORICAL_ACCESS_RULES[archetype];
  if (!archetypeRules) return null;
  
  // Find the most specific matching rule
  let bestMatch: AccessRule | null = null;
  let bestScore = 0;
  
  for (const rule of archetypeRules) {
    if (rule.roomType !== roomType) continue;
    
    let score = 1; // Base score for room type match
    
    // Check year constraints
    if (rule.year) {
      if (year) {
        if (rule.year.before && year >= rule.year.before) continue;
        if (rule.year.after && year <= rule.year.after) continue;
        score += 2; // Year match is specific
      }
    }
    
    // Check culture match
    if (rule.culture) {
      if (rule.culture !== culturalZone) continue;
      score += 3; // Culture match is very specific
    }
    
    // Check era match
    if (rule.era) {
      if (rule.era !== era) continue;
      score += 2; // Era match is specific
    }
    
    // This rule matches and is more specific than previous best
    if (score > bestScore) {
      bestMatch = rule;
      bestScore = score;
    }
  }
  
  return bestMatch;
}

/**
 * Apply historical gender restrictions based on profession and context
 */
export function getHistoricalGenderRestriction(
  profession: string,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  year?: number
): 'male' | 'female' | 'any' {
  // Female-only professions
  const femaleOnlyProfessions = [
    'Concubine', 'Lady-in-Waiting', 'Midwife', 'Wet Nurse',
    'Geisha', 'Courtesan', 'Nun', 'Abbess', 'Queen Mother'
  ];
  
  if (femaleOnlyProfessions.includes(profession)) {
    return 'female';
  }
  
  // Male-only professions (historically)
  const maleOnlyProfessions = [
    'Knight', 'Samurai', 'Soldier', 'Guard', 'Priest', 'Monk',
    'Rabbi', 'Imam', 'Bishop', 'Pope', 'General', 'Admiral'
  ];
  
  if (maleOnlyProfessions.includes(profession)) {
    // Some exceptions in modern era
    if (era === HistoricalEra.MODERN_ERA || (year && year > 1950)) {
      if (!['Priest', 'Monk', 'Rabbi', 'Imam', 'Bishop', 'Pope'].includes(profession)) {
        return 'any'; // Military opened to women in modern era
      }
    }
    return 'male';
  }
  
  // Special case: Eunuch
  if (profession === 'Eunuch') {
    return 'male'; // Technically male but castrated
  }
  
  // Default: any gender (though historical accuracy may vary)
  return 'any';
}