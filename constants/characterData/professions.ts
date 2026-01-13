/**
 * constants/characterData/professions.ts
 * ---------------------------------------------------------------------------
 * A single, authoritative database of professions / social roles, organised by
 * CulturalZone → HistoricalEra → SocialClass → Role.
 * ---------------------------------------------------------------------------
 *  • Only plain data; no functions.
 *  • No TypeScript‑breaking placeholders.
 *  • Every era represented for each CulturalZone with at least a minimal set.
 */

import { HistoricalEra } from '../../types';
import { type CulturalZone } from './names';

export type { CulturalZone };

/* ---------- Core definition type ---------------------------------------- */

/**
 * Profession frequency affects spawn probability:
 * - common (default): Standard professions (farmers, laborers, servants)
 * - uncommon: Skilled trades, merchants, soldiers
 * - rare: Scholars, officials, specialists
 * - very_rare: Elite positions, outlaws, revolutionaries
 *
 * Weights: common=6, uncommon=3, rare=1.5, very_rare=1
 * This means common roles are 6x more likely than very_rare ones.
 */
export type ProfessionFrequency = 'common' | 'uncommon' | 'rare' | 'very_rare';

export interface ProfessionDefinition {
    statRequirements: {
        minStrength?: number;  maxStrength?: number;
        minDexterity?: number; maxDexterity?: number;
        minStamina?: number;   maxStamina?: number;
        minConstitution?: number; maxConstitution?: number;
        minIntelligence?: number; maxIntelligence?: number;
        minPerception?: number;   maxPerception?: number;
        minCraftiness?: number;   maxCraftiness?: number;
        minPersuasion?: number;   maxPersuasion?: number;
        minLuck?: number;         maxLuck?: number;
    };
    socialRequirements?: {
        minPrivilege?: number;  maxPrivilege?: number;
        minWanderlust?: number; maxWanderlust?: number;
        minReligiosity?: number;maxReligiosity?: number;
        minAmbition?: number;   maxAmbition?: number;
    };
    genderBias?: 'Male' | 'Female';
    keywords?: string;
    emoji: string;
    nameKey?: string;          // culture‑specific name lists (optional)
    frequency?: ProfessionFrequency;  // defaults to 'common' if not specified
}

/* ---------- Helper alias types ----------------------------------------- */
export type RoleMap        = { [role: string]: ProfessionDefinition };
export type SocialClassMap = { [className: string]: RoleMap };
type EraMap                = { [key in HistoricalEra]?: SocialClassMap };
export type ProfessionData = { [key in CulturalZone]?: EraMap };

/* ======================================================================= */
/*                            PROFESSION TABLE                             */
/* ======================================================================= */

/* ======================================================================= */
/*                      SHARED MODERN/FUTURE PROFESSIONS                   */
/* ======================================================================= */
const SHARED_MODERN_PROFESSIONS = {
    UPPER_CLASS: {
        'CEO': {
            statRequirements: { minIntelligence: 7, minPersuasion: 8, minCraftiness: 7 },
            socialRequirements: { minPrivilege: 0.9, minAmbition: 0.8 },
            keywords: 'corporate leadership business',
            emoji: '💼',
            frequency: 'very_rare' as const
        },
        'Politician': {
            statRequirements: { minPersuasion: 8, minIntelligence: 6, minCraftiness: 7 },
            socialRequirements: { minPrivilege: 0.7, minAmbition: 0.9 },
            keywords: 'government power statecraft',
            emoji: '🗳️',
            frequency: 'very_rare' as const
        },
        'Surgeon': {
            statRequirements: { minIntelligence: 8, minDexterity: 9, minStamina: 6 },
            socialRequirements: { minPrivilege: 0.8 },
            keywords: 'medicine specialist hospital',
            emoji: '⚕️',
            frequency: 'rare' as const
        },
        'Judge': {
            statRequirements: { minIntelligence: 8, minPersuasion: 6 },
            socialRequirements: { minPrivilege: 0.8 },
            keywords: 'law justice court',
            emoji: '⚖️',
            frequency: 'rare' as const
        },
        'Bank President': {
            statRequirements: { minIntelligence: 8, minCraftiness: 7 },
            socialRequirements: { minPrivilege: 0.85, minAmbition: 0.7 },
            keywords: 'finance capital money',
            emoji: '🏦',
            frequency: 'very_rare' as const
        },
        'University Professor': {
            statRequirements: { minIntelligence: 9, minPersuasion: 6 },
            socialRequirements: { minPrivilege: 0.7 },
            keywords: 'academia research education',
            emoji: '🎓',
            frequency: 'rare' as const
        }
    },
    MIDDLE_CLASS: {
        'Teacher': {
            statRequirements: { minIntelligence: 6, minPersuasion: 6, minStamina: 5 },
            keywords: 'education school learning',
            emoji: '👩‍🏫'
        },
        'Nurse': {
            statRequirements: { minStamina: 6, minDexterity: 6, minPersuasion: 5 },
            socialRequirements: { maxPrivilege: 0.7 },
            genderBias: 'Female',
            keywords: 'healthcare hospital medicine',
            emoji: '👩‍⚕️'
        },
        'Accountant': {
            statRequirements: { minIntelligence: 6, minPerception: 6 },
            keywords: 'finance taxes bookkeeping',
            emoji: '🧮'
        },
        'Police Officer': {
            statRequirements: { minStrength: 6, minPerception: 6, minStamina: 6 },
            keywords: 'law enforcement security',
            emoji: '👮'
        },
        'Office Manager': {
            statRequirements: { minIntelligence: 5, minPersuasion: 6 },
            keywords: 'administration business paperwork',
            emoji: '📊'
        },
        'Civil Engineer': {
            statRequirements: { minIntelligence: 7, minCraftiness: 6 },
            socialRequirements: { minPrivilege: 0.5 },
            keywords: 'building infrastructure design',
            emoji: '🏗️'
        },
        'Mechanic': {
            statRequirements: { minCraftiness: 7, minStrength: 5, minIntelligence: 5 },
            keywords: 'repair engine automobile',
            emoji: '🛠️'
        },
        'Journalist': {
            statRequirements: { minIntelligence: 6, minPersuasion: 6 },
            socialRequirements: { minWanderlust: 0.4 },
            keywords: 'news writing reporting',
            emoji: '📰'
        },
        'Librarian': {
            statRequirements: { minIntelligence: 6, minPerception: 5 },
            keywords: 'books records archive',
            emoji: '📚'
        },
        'Secretary': {
            statRequirements: { minDexterity: 6, minPerception: 5 },
            socialRequirements: { maxPrivilege: 0.6 },
            genderBias: 'Female',
            keywords: 'typing office administration',
            emoji: '📊'
        },
        'Salesman': {
            statRequirements: { minPersuasion: 7, minStamina: 5 },
            socialRequirements: { minWanderlust: 0.5, minAmbition: 0.5 },
            keywords: 'retail commerce travel',
            emoji: '📈'
        },
        'Small Business Owner': {
            statRequirements: { minCraftiness: 6, minPersuasion: 5 },
            socialRequirements: { minAmbition: 0.6 },
            keywords: 'shopkeeper retail entrepreneur',
            emoji: '🏪'
        }
    },
    WORKING_CLASS: {
        'Factory Worker': {
            statRequirements: { minStamina: 6, minConstitution: 6 },
            keywords: 'manufacturing assembly line labor',
            emoji: '🏭'
        },
        'Truck Driver': {
            statRequirements: { minStamina: 7, minPerception: 6 },
            keywords: 'transport logistics driving',
            emoji: '🚚'
        },
        'Construction Worker': {
            statRequirements: { minStrength: 7, minStamina: 7, minConstitution: 7 },
            keywords: 'building labor trades',
            emoji: '👷'
        },
        'Cashier': {
            statRequirements: { minStamina: 5, minPersuasion: 4 },
            keywords: 'retail service money',
            emoji: '🛒'
        },
        'Janitor': {
            statRequirements: { minStamina: 6, minConstitution: 5 },
            keywords: 'cleaning maintenance custodian',
            emoji: '🧹'
        },
        'Security Guard': {
            statRequirements: { minStrength: 5, minPerception: 6 },
            keywords: 'protection safety watchman',
            emoji: '🛡️'
        },
        'Farm Worker': {
            statRequirements: { minStamina: 7, minConstitution: 6, minStrength: 5 },
            keywords: 'agriculture harvest farming',
            emoji: '🌾'
        },
        'Warehouse Worker': {
            statRequirements: { minStrength: 6, minStamina: 6 },
            keywords: 'logistics shipping stocking',
            emoji: '📦'
        },
        'Cook': {
            statRequirements: { minDexterity: 6, minStamina: 6 },
            keywords: 'restaurant food service',
            emoji: '👨‍🍳'
        },
        'Miner': {
            statRequirements: { minStrength: 7, minStamina: 8, minConstitution: 7 },
            genderBias: 'Male',
            keywords: 'coal extraction digging labor',
            emoji: '⛏️'
        },
        'Railroad Worker': {
            statRequirements: { minStrength: 7, minStamina: 6, minConstitution: 6 },
            genderBias: 'Male',
            keywords: 'transport tracks railway labor',
            emoji: '🚂'
        },
        'Dock Worker': {
            statRequirements: { minStrength: 8, minStamina: 7 },
            genderBias: 'Male',
            keywords: 'shipping cargo port longshoreman',
            emoji: '⚓'
        },
        'Textile Worker': {
            statRequirements: { minDexterity: 6, minStamina: 6 },
            genderBias: 'Female',
            keywords: 'mill sewing garment factory',
            emoji: '🧵'
        },
        'Telephone Operator': {
            statRequirements: { minDexterity: 2, minPersuasion: 2 },
            genderBias: 'Female',
            keywords: 'communication switchboard service',
            emoji: '📞'
        },
        'Postal Worker': {
            statRequirements: { minStamina: 6, minPerception: 3 },
            keywords: 'mail delivery postman',
            emoji: '📮'
        },
        'Butcher': {
            statRequirements: { minStrength: 6, minDexterity: 3 },
            keywords: 'meat food processing',
            emoji: '🔪'
        },
        'Baker': {
            statRequirements: { minStamina: 5, minCraftiness: 5 },
            keywords: 'bread food baking',
            emoji: '🍞'
        },
        'Waiter': {
            statRequirements: { minStamina: 5, minDexterity: 5, minPersuasion: 3 },
            keywords: 'service restaurant food',
            emoji: '🤵'
        },
        'Bartender': {
            statRequirements: { minPersuasion: 7, minStamina: 1 },
            keywords: 'service drinks alcohol',
            emoji: '🍺'
        },
        'Taxi Driver': {
            statRequirements: { minStamina: 6, minPerception: 6 },
            keywords: 'driving transport service',
            emoji: '🚕'
        },
        'Welder': {
            statRequirements: { minDexterity: 7, minConstitution: 6 },
            keywords: 'trades metalwork manufacturing',
            emoji: '🔥'
        },
        'Lumberjack': {
            statRequirements: { minStrength: 8, minStamina: 7 },
            genderBias: 'Male',
            keywords: 'forestry logging wood',
            emoji: '🪓'
        },
        'Fisherman': {
            statRequirements: { minStrength: 5, minConstitution: 6, minPerception: 6 },
            genderBias: 'Male',
            keywords: 'fishing sea food',
            emoji: '🎣'
        }
    },
    OUTLAWS_AND_REVOLUTIONARIES: {
        'Mobster': {
            statRequirements: { minStrength: 3, minCraftiness: 3 },
            socialRequirements: { maxPrivilege: 0.4 },
            genderBias: 'Male',
            keywords: 'organized crime mafia',
            emoji: '🚬',
            frequency: 'very_rare' as const
        },
        'Numbers Runner': {
            statRequirements: { minCraftiness: 3, minPersuasion: 3 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'numbers lottery gambling betting',
            emoji: '🎲',
            frequency: 'very_rare' as const
        },
        'Pickpocket': {
            statRequirements: { minDexterity: 4, minPerception: 3 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'street crime theft',
            emoji: '👤',
            frequency: 'rare' as const
        },
        'Militant': {
            statRequirements: { minStrength: 3, minPersuasion: 4 },
            socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.6 },
            keywords: 'revolutionary militant',
            emoji: '✊',
            frequency: 'very_rare' as const
        },

        'Red Brigade': {
            statRequirements: { minIntelligence: 3, minCraftiness: 3 },
            socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.6 },
            keywords: 'communist militant',
            emoji: '⭐',
            frequency: 'very_rare' as const
        },
        'Guerrilla Fighter': {
            statRequirements: { minStamina: 3, minCraftiness: 3 },
            socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.5 },
            keywords: 'insurgent rebel',
            emoji: '🔫',
            frequency: 'very_rare' as const
        },
        'Smuggler': {
            statRequirements: { minCraftiness: 4, minPersuasion: 2 },
            socialRequirements: { maxPrivilege: 0.4, minWanderlust: 0.5 },
            keywords: 'contraband illegal trade',
            emoji: '📦',
            frequency: 'rare' as const
        }
    }
};

const SHARED_FUTURE_PROFESSIONS = {
    UPPER_CLASS: {
        'Tech CEO': {
            statRequirements: { minIntelligence: 8, minCraftiness: 8, minPersuasion: 7 },
            socialRequirements: { minPrivilege: 0.9, minAmbition: 0.9 },
            keywords: 'startup founder',
            emoji: '💻'
        },
        'Surgeon': {
            statRequirements: { minIntelligence: 9, minDexterity: 9, minStamina: 6 },
            socialRequirements: { minPrivilege: 0.8 },
            keywords: 'medical specialist',
            emoji: '🏥'
        },
        'Investment Banker': {
            statRequirements: { minIntelligence: 8, minCraftiness: 7, minStamina: 6 },
            socialRequirements: { minPrivilege: 0.8, minAmbition: 0.9 },
            keywords: 'finance capital',
            emoji: '📈'
        }
    },
    MIDDLE_CLASS: {
        'Software Developer': {
            statRequirements: { minIntelligence: 8, minDexterity: 6, minPerception: 6 },
            keywords: 'programming coding',
            emoji: '💻'
        },
        'Marketing Manager': {
            statRequirements: { minPersuasion: 7, minCraftiness: 6, minIntelligence: 6 },
            keywords: 'advertising sales',
            emoji: '📊'
        },
        'Physical Therapist': {
            statRequirements: { minDexterity: 7, minIntelligence: 6, minStamina: 6 },
            keywords: 'healthcare rehabilitation',
            emoji: '🏥'
        },
        'Real Estate Agent': {
            statRequirements: { minPersuasion: 7, minCraftiness: 6 },
            keywords: 'property sales',
            emoji: '🏠'
        },
        'Pharmacist': {
            statRequirements: { minIntelligence: 7, minPerception: 7 },
            keywords: 'medicine drugs',
            emoji: '💊'
        },
        'Firefighter': {
            statRequirements: { minStrength: 7, minStamina: 7, minConstitution: 7 },
            keywords: 'emergency rescue',
            emoji: '🚒'
        },
        'Dental Hygienist': {
            statRequirements: { minDexterity: 7, minPersuasion: 5 },
            keywords: 'dental health',
            emoji: '🦷'
        },
        'Handyman': {
            statRequirements: { minCraftiness: 7, minStrength: 5 },
            keywords: 'repair maintenance',
            emoji: '🔨'
        }
    },
    SERVICE_ECONOMY: {
        'Uber Driver': {
            statRequirements: { minStamina: 6, minPerception: 6 },
            keywords: 'rideshare transport',
            emoji: '🚗'
        },
        'Delivery Driver': {
            statRequirements: { minStamina: 7, minPerception: 6 },
            keywords: 'packages food',
            emoji: '📦'
        },
        'Barista': {
            statRequirements: { minDexterity: 5, minPersuasion: 5 },
            keywords: 'coffee service',
            emoji: '☕'
        },
        'Customer Service Rep': {
            statRequirements: { minPersuasion: 6, minStamina: 5 },
            keywords: 'support helpdesk',
            emoji: '🎧'
        },
        'Personal Trainer': {
            statRequirements: { minStrength: 6, minPersuasion: 6 },
            keywords: 'fitness gym',
            emoji: '💪'
        },
        'Hair Stylist': {
            statRequirements: { minDexterity: 7, minPersuasion: 6 },
            keywords: 'beauty salon',
            emoji: '💇'
        },
        'Hotel Clerk': {
            statRequirements: { minPersuasion: 5, minStamina: 5 },
            keywords: 'hospitality service',
            emoji: '🏨'
        },
        'Grocery Clerk': {
            statRequirements: { minStamina: 5, minPersuasion: 4 },
            keywords: 'retail stock',
            emoji: '🛒'
        },
        'Call Center Worker': {
            statRequirements: { minPersuasion: 5, minStamina: 5 },
            keywords: 'phone support',
            emoji: '📞'
        },
        'Content Creator': {
            statRequirements: { minCraftiness: 6, minPersuasion: 6 },
            keywords: 'social media influencer',
            emoji: '📱'
        }
    },
    OUTLAWS_AND_ACTIVISTS: {
        'Cybercriminal': {
            statRequirements: { minIntelligence: 4, minCraftiness: 4 },
            socialRequirements: { maxPrivilege: 0.5 },
            keywords: 'hacker dark web',
            emoji: '💻'
        },
        'Crypto Scammer': {
            statRequirements: { minCraftiness: 3, minPersuasion: 3 },
            socialRequirements: { maxPrivilege: 0.4 },
            keywords: 'cryptocurrency fraud',
            emoji: '₿'
        },
        'Cartel Member': {
            statRequirements: { minStrength: 3, minCraftiness: 3 },
            socialRequirements: { maxPrivilege: 0.3 },
            genderBias: 'Male',
            keywords: 'drug trafficking',
            emoji: '💀'
        },
        'Human Trafficker': {
            statRequirements: { minCraftiness: 4, minPersuasion: 2 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'smuggling criminal',
            emoji: '⛓️'
        },
  
        'Climate Activist': {
            statRequirements: { minPersuasion: 3, minStamina: 2 },
            socialRequirements: { maxPrivilege: 0.5, minAmbition: 0.5 },
            keywords: 'environmental protest',
            emoji: '🌍'
        },
      
        'Fentanyl Dealer': {
            statRequirements: { minCraftiness: 3, minPersuasion: 2 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'opioid crisis',
            emoji: '💉'
        }
    }
};

export const PROFESSIONS: ProfessionData = {
    /* =================================================================== */
    /*                              EUROPE                                 */
    /* =================================================================== */
    EUROPEAN: {
        /* ------- PREHISTORY (Palaeolithic / Neolithic) ----------------- */
        [HistoricalEra.PREHISTORY]: {
            HUNTER_GATHERER: {
                'Hunter': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    keywords: 'tracking',
                    emoji: '🏹'
                },
                'Gatherer': {
                    statRequirements: { minDexterity: 5, minPerception: 6 },
                    genderBias: 'Female',
                    keywords: 'foraging',
                    emoji: '🍇'
                },
                'Shaman': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.7 },
                    keywords: 'spirits',
                    emoji: '🪄'
                },
                'Toolmaker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'flintknapping',
                    emoji: '🪨'
                },
                'Funditor': {
                    statRequirements: { minDexterity: 3, minPerception: 4 },
                    genderBias: 'Male',
                    keywords: 'stone throwing',
                    emoji: '🪃'
                },
                'Healer': {
                    statRequirements: { minIntelligence: 6, minPerception: 5 },
                    socialRequirements: { minReligiosity: 0.4 },
                    genderBias: 'Female',
                    keywords: 'herbs',
                    emoji: '🌿'
                },
                'Cave Painter': {
                    statRequirements: { minDexterity: 6, minPerception: 7 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'ritual',
                    emoji: '🎨'
                },
                'Fire Keeper': {
                    statRequirements: { minConstitution: 5, minPerception: 6 },
                    keywords: 'ember',
                    emoji: '🔥'
                },
                'Skin Dresser': {
                    statRequirements: { minDexterity: 5, minConstitution: 4 },
                    genderBias: 'Female',
                    keywords: 'hides',
                    emoji: '🦌'
                },
                'Fisher': {
                    statRequirements: { minDexterity: 5, minPerception: 5 },
                    keywords: 'rivers',
                    emoji: '🎣'
                },
                'Bone Carver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    keywords: 'carving',
                    emoji: '🦴'
                }
            },
            MARGINAL_SOCIETY: {
                'Outcast': {
                    statRequirements: { minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'exile taboo',
                    emoji: '🏴'
                },
                'Cave Hermit': {
                    statRequirements: { minConstitution: 5, minPerception: 4 },
                    socialRequirements: { minWanderlust: 0.6 },
                    keywords: 'solitude spirits',
                    emoji: '🧙'
                },
                'Raider': {
                    statRequirements: { minStrength: 6, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'pillage combat',
                    emoji: '⚔️'
                }
            }
        },

        /* ------- ANTIQUITY (Greco‑Roman baseline) ---------------------- */
        [HistoricalEra.ANTIQUITY]: {
            CITIZEN: {
                'Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minWanderlust: 0.4 },
                    keywords: 'trading',
                    emoji: '🪙'
                },
                'Potter': {
                    statRequirements: { minDexterity: 5, minCraftiness: 6 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Baker': {
                    statRequirements: { minStamina: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'bread',
                    emoji: '🍞'
                },
                'Physician': {
                    statRequirements: { minIntelligence: 7, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'medicine',
                    emoji: '⚕️'
                },
                'Scribe': {
                    statRequirements: { minIntelligence: 6, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'writing',
                    emoji: '📜'
                },
                'Lawyer': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'rhetoric',
                    emoji: '⚖️'
                },
                'Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'pedagogy',
                    emoji: '📚'
                },
                'Architect': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'building',
                    emoji: '🏛️'
                }
            },
            MILITARY: {
                'Legionary': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { minAmbition: 0.3 },
                    keywords: 'disciplined',
                    emoji: '⚔️'
                },
                'Auxiliary': {
                    statRequirements: { minDexterity: 6, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'skirmishing',
                    emoji: '🏹'
                },
                'Centurion': {
                    statRequirements: { minStrength: 7, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'commanding',
                    emoji: '🛡️'
                },
                'Sailor': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { minWanderlust: 0.5 },
                    genderBias: 'Male',
                    keywords: 'naval',
                    emoji: '⚓'
                },
                'Engineer': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'siege',
                    emoji: '🏗️'
                }
            },
            ARTISAN: {
                'Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'metalwork',
                    emoji: '🔨'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'textiles',
                    emoji: '🧶'
                },
                'Carpenter': {
                    statRequirements: { minStrength: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'woodwork',
                    emoji: '🪚'
                },
                'Stonemason': {
                    statRequirements: { minStrength: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'stonework',
                    emoji: '🧱'
                },
                'Glassblower': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'glasswork',
                    emoji: '🍷'
                },
                'Jeweler': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.6 },
                    keywords: 'precious',
                    emoji: '💍'
                },
                'Tanner': {
                    statRequirements: { minConstitution: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'leather',
                    emoji: '👜'
                },
                'Fuller': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'cloth',
                    emoji: '🧽'
                }
            },
            COMMONER: {
                'Slave': {
                    statRequirements: {},
                    socialRequirements: { maxPrivilege: 0.05 },
                    keywords: 'bonded',
                    emoji: '⛓️'
                },
                'Farmer': {
                    statRequirements: { minStrength: 4, minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'agriculture',
                    emoji: '🧑‍🌾'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Shepherd': {
                    statRequirements: { minConstitution: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'flocks',
                    emoji: '🐑'
                },
                'Vintner': {
                    statRequirements: { minIntelligence: 4, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'wine',
                    emoji: '🍇'
                },
                'Miller': {
                    statRequirements: { minStrength: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'grain',
                    emoji: '⚙️'
                },
                'Highwayman': {
                    statRequirements: { minDexterity: 4, minStrength: 3 },
                    socialRequirements: { maxPrivilege: 0.2, minWanderlust: 0.6 },
                    genderBias: 'Male',
                    keywords: 'highway robbery',
                    emoji: '🗡️'
                },
                'Tavern Keeper': {
                    statRequirements: { minPersuasion: 5, minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'hospitality',
                    emoji: '🍺'
                },
                'Gladiator': {
                    statRequirements: { minStrength: 7, minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'arena',
                    emoji: '🗡️',
                    frequency: 'rare' as const
                },
                'Street Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'selling',
                    emoji: '🛒'
                },
                'Bathhouse Attendant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'service',
                    emoji: '🛁'
                }
            },
            RELIGIOUS: {
                'Priest': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.7, minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'ritual',
                    emoji: '⛪'
                },
                'Temple Keeper': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.6, maxPrivilege: 0.4 },
                    keywords: 'maintenance',
                    emoji: '🏛️'
                },
                'Oracle': {
                    statRequirements: { minPerception: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.8 },
                    genderBias: 'Female',
                    keywords: 'prophecy',
                    emoji: '🔮',
                    frequency: 'rare' as const
                }
            }
        },

        /* ------- MEDIEVAL (c. 500‑1400) -------------------------------- */
        [HistoricalEra.MEDIEVAL]: {
            NOBILITY: {
                'Knight': {
                    statRequirements: { minStrength: 7, minDexterity: 5, minConstitution: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '⚔️',
                    frequency: 'rare' as const
                },
                 'Man-at-Arms': {
                    statRequirements: { minStrength: 7, minDexterity: 3, minConstitution: 3 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '⚔️'
                },
                  'Crossbowman': {
                    statRequirements: { minStrength: 5, minDexterity: 7, minConstitution: 3 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '⚔️'
                },
                'Squire': {
                    statRequirements: { minStrength: 5, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '🛡️'
                },
                'Sergeant': {
                    statRequirements: { minStrength: 5, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '🛡️'
                },
                'Lady': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Female',
                    keywords: 'noble',
                    emoji: '👸',
                    frequency: 'rare' as const
                },
                'Page': {
                    statRequirements: { minDexterity: 4 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'service',
                    emoji: '👦'
                }
            },
            MILITARY: {
                'Viking Raider': {
                    statRequirements: { minStrength: 7, minDexterity: 6, minConstitution: 7 },
                    socialRequirements: { minAmbition: 0.6, minWanderlust: 0.7 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '⚔️',
                    frequency: 'rare' as const
                },
                'Byzantine Archer': {
                    statRequirements: { minDexterity: 7, minPerception: 6, minConstitution: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'crossbow military',
                    emoji: '🏹'
                }
            },
            CLERGY: {
                'Priest': {
                    statRequirements: { minIntelligence: 4, minPersuasion: 4 },
                    socialRequirements: { minReligiosity: 0.7 },
                    genderBias: 'Male',
                    keywords: 'prayers',
                    emoji: '⛪'
                },
                'Monk': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.8, maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'contemplation',
                    emoji: '🙏'
                },
                'Nun': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.8, maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'devotion',
                    emoji: '🙏'
                },
                'Pilgrim': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { minReligiosity: 0.6, minWanderlust: 0.5 },
                    keywords: 'journey',
                    emoji: '🚶'
                },
                'Friar': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.8, maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'preaching',
                    emoji: '👨‍🦲'
                },
                'Pardoner': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.4, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'indulgences',
                    emoji: '📜'
                },
                'Hermit': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { minReligiosity: 0.9, maxPrivilege: 0.2 },
                    keywords: 'solitude',
                    emoji: '🧙'
                }
            },
            ARTISAN: {
                'Blacksmith': {
                    statRequirements: { minStrength: 7, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'forge',
                    emoji: '🔨'
                },
                'Smelter Worker': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'smelting',
                    emoji: '🔥'
                },
                'Carpenter': {
                    statRequirements: { minStrength: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'woodwork',
                    emoji: '🪚'
                },
                'Mason': {
                    statRequirements: { minStrength: 6, minConstitution: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'stonework',
                    emoji: '🧱'
                },
                'Potter': {
                    statRequirements: { minDexterity: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'clay',
                    emoji: '🏺'
                },
                'Tanner': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'leather',
                    emoji: '👜'
                },
                'Cobbler': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'shoes',
                    emoji: '👞'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'loom',
                    emoji: '🧶'
                },
                'Goldsmith': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.4, maxPrivilege: 0.7 },
                    keywords: 'precious',
                    emoji: '💍'
                },
                'Scribe': {
                    statRequirements: { minIntelligence: 7, minDexterity: 4, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.7 },
                    keywords: 'manuscripts',
                    emoji: '📜'
                },
                'Illuminator': {
                    statRequirements: { minDexterity: 8, minPerception: 7 },
                    socialRequirements: { minReligiosity: 0.5, maxPrivilege: 0.6 },
                    keywords: 'decoration',
                    emoji: '📖'
                },
                'Bell Founder': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'bronze',
                    emoji: '🔔'
                },
                'Chandler': {
                    statRequirements: { minDexterity: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'candles',
                    emoji: '🕯️'
                },
                'Dyer': {
                    statRequirements: { minIntelligence: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'colors',
                    emoji: '🎨'
                }
            },
            MERCHANT: {
                'Guild Master': {
                    statRequirements: { minPersuasion: 7, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.6, minAmbition: 0.6 },
                    genderBias: 'Male',
                    keywords: 'commerce',
                    emoji: '🏛️'
                },
                'Wool Merchant': {
                    statRequirements: { minPersuasion: 6, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.4, minAmbition: 0.4 },
                    keywords: 'trading',
                    emoji: '🐑'
                },
                'Spice Trader': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minWanderlust: 0.5, minPrivilege: 0.4 },
                    keywords: 'exotic',
                    emoji: '🌶️'
                },
                'Money Changer': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'currency',
                    emoji: '💰'
                }
            },
            COMMONER: {
                'Farmer': {
                    statRequirements: { minStrength: 4, minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.4, maxWanderlust: 0.3 },
                    keywords: 'crops',
                    emoji: '🧑‍🌾'
                },
                'Serf': {
                    statRequirements: { minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.2, maxWanderlust: 0.2 },
                    keywords: 'bound',
                    emoji: '👨‍🌾'
                },
                'Miller': {
                    statRequirements: { minStrength: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'grain',
                    emoji: '⚙️'
                },
                'Baker': {
                    statRequirements: { minStamina: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'bread',
                    emoji: '🍞'
                },
                'Brewer': {
                    statRequirements: { minCraftiness: 5, minIntelligence: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'ale',
                    emoji: '🍺'
                },
                'Innkeeper': {
                    statRequirements: { minPersuasion: 4, minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'hospitality',
                    emoji: '🏠'
                },
                'Guard': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxAmbition: 0.5, maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'watchful',
                    emoji: '🛡️'
                },
                'Cutpurse': {
                    statRequirements: { minDexterity: 4, minPerception: 3 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'pickpocket',
                    emoji: '👤'
                },
                'Brigand': {
                    statRequirements: { minStrength: 4, minDexterity: 3 },
                    socialRequirements: { maxPrivilege: 0.2, minWanderlust: 0.5 },
                    genderBias: 'Male',
                    keywords: 'highway robbery',
                    emoji: '🏹'
                },
                'Beggar': {
                    statRequirements: {},
                    socialRequirements: { maxPrivilege: 0.1 },
                    keywords: 'poverty',
                    emoji: '🥺'
                },
                'Midwife': {
                    statRequirements: { minIntelligence: 5, minPerception: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'childbirth',
                    emoji: '🤱'
                },
                'Herbalist': {
                    statRequirements: { minIntelligence: 6 },
                    keywords: 'remedies',
                    emoji: '🌿'
                },
                'Peddler': {
                    statRequirements: { minPersuasion: 5, minStamina: 5 },
                    socialRequirements: { minWanderlust: 0.4, maxPrivilege: 0.5 },
                    keywords: 'traveling',
                    emoji: '🎒'
                },
                'Executioner': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'punishment',
                    emoji: '🪓'
                },
                'Jester': {
                    statRequirements: { minPersuasion: 6, minDexterity: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'entertainment',
                    emoji: '🃏'
                },
                'Falconer': {
                    statRequirements: { minDexterity: 6, minPerception: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'hunting',
                    emoji: '🦅'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Shepherd': {
                    statRequirements: { minConstitution: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'flocks',
                    emoji: '🐑'
                },
                'Charcoal Burner': {
                    statRequirements: { minConstitution: 6, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'charcoal',
                    emoji: '🔥'
                },
                'Woodcutter': {
                    statRequirements: { minStrength: 6, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'lumber',
                    emoji: '🪓'
                },
                'Washerwoman': {
                    statRequirements: { minStrength: 4, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'laundry',
                    emoji: '🧽'
                },
                'Wet Nurse': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'nursing',
                    emoji: '👶'
                }
            }
        },

        /* ------- RENAISSANCE / EARLY‑MODERN (1400‑1700) ----------------- */
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            MERCHANT_CLASS: {
                'Merchant': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.4, minAmbition: 0.6 },
                    keywords: 'commerce',
                    emoji: '💰'
                },
                'Banker': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.6, minAmbition: 0.5 },
                    keywords: 'finance',
                    emoji: '🏦'
                },
                'Ship Owner': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minAmbition: 0.6 },
                    keywords: 'maritime',
                    emoji: '🚢'
                },
                'Silk Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minWanderlust: 0.4 },
                    keywords: 'luxury',
                    emoji: '🪡'
                }
            },
            PROFESSIONAL: {
                'Lawyer': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'litigation',
                    emoji: '⚖️'
                },
                'Physician': {
                    statRequirements: { minIntelligence: 7, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'healing',
                    emoji: '🧑‍⚕️'
                },
                'Clerk': {
                    statRequirements: { minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'records',
                    emoji: '💼'
                },
                'Accountant': {
                    statRequirements: { minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.4, maxPrivilege: 0.7 },
                    keywords: 'bookkeeping',
                    emoji: '📊'
                },
                'Surveyor': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'mapping',
                    emoji: '🗺️'
                }
            },
            ARTISAN: {
                'Painter': {
                    statRequirements: { minDexterity: 6, minPerception: 7 },
                    socialRequirements: { maxPrivilege: 0.7 },
                    keywords: 'artistic',
                    emoji: '🎨'
                },
                'Clockmaker': {
                    statRequirements: { minIntelligence: 7, minDexterity: 8, minCraftiness: 8 },
                    socialRequirements: { maxPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'precision',
                    emoji: '🕰️'
                },
                'Gunsmith': {
                    statRequirements: { minCraftiness: 7, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'firearms',
                    emoji: '🔫'
                },
                'Printer': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'books',
                    emoji: '📰'
                },
                'Lens Grinder': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    keywords: 'optics',
                    emoji: '🔍'
                },
                'Sculptor': {
                    statRequirements: { minStrength: 6, minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'marble',
                    emoji: '🗿'
                },
                'Instrument Maker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'musical',
                    emoji: '🎻'
                },
                'Tapestry Weaver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Female',
                    keywords: 'tapestry',
                    emoji: '🖼️'
                }
            },
            COMMONER: {
                'City Guard': {
                    statRequirements: { minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'patrol',
                    emoji: '🛡️'
                },
                'Sailor': {
                    statRequirements: { minConstitution: 5, minStrength: 5 },
                    socialRequirements: { minWanderlust: 0.6, maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'seafaring',
                    emoji: '⚓'
                },
                'Alchemist': {
                    statRequirements: { minIntelligence: 8 },
                    socialRequirements: { maxReligiosity: 0.4 },
                    keywords: 'experiments',
                    emoji: '⚗️'
                },
                'Witch': {
                    statRequirements: { minIntelligence: 6, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3, maxReligiosity: 0.2 },
                    genderBias: 'Female',
                    keywords: 'superstition',
                    emoji: '🧙‍♀️'
                },
                'Mercenary': {
                    statRequirements: { minStrength: 6, minDexterity: 5 },
                    socialRequirements: { minWanderlust: 0.5, maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'soldier',
                    emoji: '⚔️'
                },
                'Innkeeper': {
                    statRequirements: { minPersuasion: 5, minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'hospitality',
                    emoji: '🏠'
                },
                'Coach Driver': {
                    statRequirements: { minDexterity: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'transport',
                    emoji: '🐎'
                },
                'Plague Doctor': {
                    statRequirements: { minConstitution: 7, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'pestilence',
                    emoji: '🦅'
                },
                'Barber Surgeon': {
                    statRequirements: { minDexterity: 6, minIntelligence: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'surgery',
                    emoji: '💈'
                },
                'Apothecary': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'medicines',
                    emoji: '🧪'
                }
            }
        },

        /* ------- INDUSTRIAL ERA (1700‑1900) ----------------------------- */
        [HistoricalEra.INDUSTRIAL_ERA]: {
            BOURGEOISIE: {
                'Factory Owner': {
                    statRequirements: { minIntelligence: 6 },
                    socialRequirements: { minAmbition: 0.7, minPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'capital',
                    emoji: '🎩'
                },
                'Railway Investor': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minAmbition: 0.8, minPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'railways',
                    emoji: '🚂'
                },
                'Banker': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.6, minAmbition: 0.5 },
                    keywords: 'finance',
                    emoji: '🏦'
                }
            },
            MIDDLE_CLASS: {
                'Shopkeeper': {
                    statRequirements: { minIntelligence: 4, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.7 },
                    keywords: 'retail',
                    emoji: '🏪'
                },
                'Engineer': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.4, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'machinery',
                    emoji: '⚙️'
                },
                'Clerk': {
                    statRequirements: { minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'paperwork',
                    emoji: '💼'
                },
                'Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'education',
                    emoji: '👩‍🏫'
                },
                'Doctor': {
                    statRequirements: { minIntelligence: 7, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'medicine',
                    emoji: '👨‍⚕️'
                },
                'Lawyer': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.5, minAmbition: 0.6 },
                    keywords: 'legal',
                    emoji: '⚖️'
                },
                'Journalist': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    keywords: 'news',
                    emoji: '📰'
                },
                'Pharmacist': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'chemistry',
                    emoji: '💊'
                },
                'Architect': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'building',
                    emoji: '📐'
                }
            },
            WORKING_CLASS: {
                'Factory Worker': {
                    statRequirements: { minDexterity: 4, minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'industrial',
                    emoji: '🏭'
                },
                'Coal Miner': {
                    statRequirements: { minStrength: 6, minConstitution: 7 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'underground',
                    emoji: '⛏️'
                },
                'Seamstress': {
                    statRequirements: { minDexterity: 7 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'sewing',
                    emoji: '🪡'
                },
                'Cab Driver': {
                    statRequirements: { minDexterity: 5, minPerception: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'transport',
                    emoji: '🐎'
                },
                'Police Constable': {
                    statRequirements: { minStrength: 5, minPerception: 6, minConstitution: 5 },
                    socialRequirements: { minAmbition: 0.2, maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'order',
                    emoji: '👮'
                },
                'Docker': {
                    statRequirements: { minStrength: 8, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'cargo',
                    emoji: '⚓'
                },
                'Railway Worker': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'tracks',
                    emoji: '🔨'
                },
                'Chimney Sweep': {
                    statRequirements: { minDexterity: 6, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.1 },
                    keywords: 'soot',
                    emoji: '🧹'
                },
                'Domestic Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'household',
                    emoji: '🧹'
                },
                'Telegraph Operator': {
                    statRequirements: { minDexterity: 6, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'communication',
                    emoji: '📠'
                },
                'Gas Lamp Lighter': {
                    statRequirements: { minDexterity: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'lighting',
                    emoji: '🕯️'
                },
                'Rag Picker': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.1 },
                    keywords: 'scavenging',
                    emoji: '🗑️'
                },
                'Flower Seller': {
                    statRequirements: { minPersuasion: 4 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'flowers',
                    emoji: '🌸'
                },
                'Street Sweeper': {
                    statRequirements: { minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'cleaning',
                    emoji: '🧹'
                },
                'Governess': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.6 },
                    genderBias: 'Female',
                    keywords: 'children',
                    emoji: '👩‍🏫'
                },
                'Footpad': {
                    statRequirements: { minDexterity: 3, minCraftiness: 2 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'street thief',
                    emoji: '🦹'
                },
                'Peaky Blinder': {
                    statRequirements: { minStrength: 3, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.4 },
                    genderBias: 'Male',
                    keywords: 'gang member',
                    emoji: '🧢'
                },
                'Resurrectionist': {
                    statRequirements: { minStrength: 4, minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.1 },
                    genderBias: 'Male',
                    keywords: 'body snatcher',
                    emoji: '⚰️'
                },
                'Chartist': {
                    statRequirements: { minIntelligence: 4, minPersuasion: 4 },
                    socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.5 },
                    keywords: 'political reformer',
                    emoji: '📜'
                },
                'Luddite': {
                    statRequirements: { minStrength: 3, minCraftiness: 2 },
                    socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.4 },
                    genderBias: 'Male',
                    keywords: 'machine breaker',
                    emoji: '🔨'
                },
                'Fenian': {
                    statRequirements: { minPersuasion: 3, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.5 },
                    keywords: 'irish nationalist',
                    emoji: '☘️'
                },
                'Anarchist': {
                    statRequirements: { minIntelligence: 4, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.6 },
                    keywords: 'revolutionary',
                    emoji: '🏴'
                }
            }
        },
        /* ------- MODERN ERA ------------------------------------------------ */
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        /* ------- FUTURE ERA (2025) ---------------------------------------- */
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                             EAST ASIA                               */
    /* =================================================================== */
    EAST_ASIAN: {
        [HistoricalEra.PREHISTORY]: {
            TRIBAL: {
                'Gatherer': {
                    statRequirements: { minDexterity: 5 },
                    keywords: 'shellfish',
                    emoji: '🐚'
                },
                'Toolmaker': {
                    statRequirements: { minCraftiness: 6, minDexterity: 6 },
                    keywords: 'obsidian',
                    emoji: '🪨'
                },
                'Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Farmer': {
                    statRequirements: { minConstitution: 5 },
                    keywords: 'rice',
                    emoji: '🌾'
                },
                'Fisher': {
                    statRequirements: { minDexterity: 5, minPerception: 5 },
                    keywords: 'coastal',
                    emoji: '🎣'
                },
                'Jade Carver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    keywords: 'ritual',
                    emoji: '💎'
                },
                'Bone Oracle': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.7 },
                    keywords: 'divination',
                    emoji: '🐢'
                }
            }
        },

        [HistoricalEra.ANTIQUITY]: {
            SCHOLAR_OFFICIAL: {
                'County Magistrate': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'administration',
                    emoji: '📜',
                    nameKey: 'CHINESE'
                },
                'Court Scribe': {
                    statRequirements: { minIntelligence: 6, minDexterity: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'calligraphy',
                    emoji: '🖌️',
                    nameKey: 'CHINESE'
                },
                'Tax Collector': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'revenue',
                    emoji: '📋'
                },
                'Village Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'classics',
                    emoji: '📚'
                }
            },
            MILITARY: {
                'Infantry': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    keywords: 'crossbow',
                    emoji: '🛡️'
                },
                'Cavalry': {
                    statRequirements: { minDexterity: 6, minStrength: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'mounted',
                    emoji: '🐎'
                },
                'Border Guard': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'frontier',
                    emoji: '🏹'
                },
                'Navy Sailor': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { minWanderlust: 0.4 },
                    genderBias: 'Male',
                    keywords: 'naval',
                    emoji: '⚓'
                }
            },
            PEASANTRY: {
                'Rice Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'paddies',
                    emoji: '🌾'
                },
                'Silk Farmer': {
                    statRequirements: { minDexterity: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'silkworm',
                    emoji: '🪡'
                },
                'Tea Grower': {
                    statRequirements: { minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'leaves',
                    emoji: '🍵'
                },
                'Vegetable Farmer': {
                    statRequirements: { minConstitution: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'vegetables',
                    emoji: '🥬'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Duck Herder': {
                    statRequirements: { minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'waterfowl',
                    emoji: '🦆'
                }
            },
            ARTISAN: {
                'Bronze Caster': {
                    statRequirements: { minCraftiness: 7, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'foundry',
                    emoji: '🔥'
                },
                'Porcelain Potter': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    keywords: 'kiln',
                    emoji: '🏺'
                },
                'Lacquerware Maker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'lacquer',
                    emoji: '🪄'
                },
                'Silk Weaver': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'silk',
                    emoji: '🧶'
                },
                'Bamboo Worker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'bamboo',
                    emoji: '🎋'
                },
                'Paper Maker': {
                    statRequirements: { minDexterity: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'paper',
                    emoji: '📄'
                }
            },
            MERCHANT: {
                'Salt Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minWanderlust: 0.4, maxPrivilege: 0.6 },
                    keywords: 'salt',
                    emoji: '🧂'
                },
                'Tea Trader': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minWanderlust: 0.4 },
                    keywords: 'trade',
                    emoji: '🍵'
                },
                'Silk Trader': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minWanderlust: 0.5, minPrivilege: 0.4 },
                    keywords: 'luxury',
                    emoji: '🪡'
                }
            }
        },

        [HistoricalEra.MEDIEVAL]: {
            SAMURAI_CLASS: {
                'Samurai': {
                    statRequirements: { minStrength: 6, minDexterity: 6, minConstitution: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'bushido',
                    emoji: '👹',
                    nameKey: 'JAPANESE',
                    frequency: 'rare' as const
                },
                'Ashigaru': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'footsoldier',
                    emoji: '⚔️',
                    nameKey: 'JAPANESE'
                },
                'Retainer': {
                    statRequirements: { minPersuasion: 5, minStrength: 4 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'service',
                    emoji: '🏹',
                    nameKey: 'JAPANESE'
                },
                'Ninja': {
                    statRequirements: { minDexterity: 8, minPerception: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'stealth espionage shuriken',
                    emoji: '🥷',
                    nameKey: 'JAPANESE',
                    frequency: 'very_rare' as const
                },
                'Mongol Archer': {
                    statRequirements: { minDexterity: 8, minPerception: 7, minConstitution: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    genderBias: 'Male',
                    keywords: 'composite bow mounted',
                    emoji: '🏹',
                    frequency: 'rare' as const
                }
            },
            CLERGY: {
                'Buddhist Monk': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.8, maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'meditation',
                    emoji: '🧘'
                },
                'Shinto Priest': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.7 },
                    genderBias: 'Male',
                    keywords: 'ritual',
                    emoji: '⛩️',
                    nameKey: 'JAPANESE'
                },
                'Zen Master': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minReligiosity: 0.9, maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'enlightenment',
                    emoji: '🧘‍♂️',
                    nameKey: 'JAPANESE',
                    frequency: 'rare' as const
                },
                'Temple Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { minReligiosity: 0.5, maxPrivilege: 0.3 },
                    keywords: 'maintenance',
                    emoji: '🧹'
                },
                'Kampo Practitioner': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'traditional japanese medicine herbal',
                    emoji: '🌿',
                    nameKey: 'JAPANESE'
                },
                'Moxibustion Specialist': {
                    statRequirements: { minDexterity: 6, minPerception: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'heat therapy healing',
                    emoji: '🔥'
                },
                'Pulse Diagnostician': {
                    statRequirements: { minPerception: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'traditional diagnosis medical',
                    emoji: '🫱'
                },
                'Herbal Pharmacist': {
                    statRequirements: { minIntelligence: 5, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'medicine preparation apothecary',
                    emoji: '🏺'
                },
                'Bone Setter': {
                    statRequirements: { minStrength: 5, minDexterity: 6 },
                    keywords: 'orthopedist fractures joints',
                    emoji: '🦴'
                }
            },
            ARTISAN: {
                'Swordsmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 8 },
                    socialRequirements: { maxPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'forging',
                    emoji: '⚔️',
                    nameKey: 'JAPANESE'
                },
                'Potter': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'ceramics',
                    emoji: '🍵'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'silk',
                    emoji: '🧶'
                },
                'Carpenter': {
                    statRequirements: { minStrength: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'woodwork',
                    emoji: '🪚'
                },
                'Lacquerware Artisan': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'lacquer',
                    emoji: '🖌️'
                },
                'Tatami Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'tatami',
                    emoji: '🪴'
                },
                'Fan Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'fans',
                    emoji: '🪭'
                }
            },
            COMMONER: {
                'Rice Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'paddy',
                    emoji: '🌾'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.4 },
                    keywords: 'trading',
                    emoji: '🪙'
                },
                'Innkeeper': {
                    statRequirements: { minPersuasion: 5, minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'hospitality',
                    emoji: '🏠'
                },
                'Porter': {
                    statRequirements: { minStrength: 6, minStamina: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'carrying',
                    emoji: '🎒'
                },
                'Tea House Servant': {
                    statRequirements: { minDexterity: 5, minPersuasion: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'service',
                    emoji: '🍵'
                },
                'Charcoal Maker': {
                    statRequirements: { minConstitution: 6, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'charcoal',
                    emoji: '🔥'
                },
                'Tofu Maker': {
                    statRequirements: { minDexterity: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'tofu',
                    emoji: '🥛'
                }
            }
        },

        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            IMPERIAL_SERVICE: {
                'Local Magistrate': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'administration',
                    emoji: '🎴',
                    nameKey: 'CHINESE'
                },
                 'Eunuch': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'administration',
                    emoji: '🎴',
                    nameKey: 'CHINESE'
                },
                'Courier': {
                    statRequirements: { minStamina: 5, minDexterity: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'messages',
                    emoji: '🏮'
                },
                'Census Taker': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 4 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'recording',
                    emoji: '📋'
                },
                'Granary Keeper': {
                    statRequirements: { minIntelligence: 5, minCraftiness: 4 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'storage',
                    emoji: '🌾'
                }
            },
            ARTISAN: {
                'Porcelain Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 7 },
                    keywords: 'kiln',
                    emoji: '🏺'
                },
                'Silk Weaver': {
                    statRequirements: { minDexterity: 7 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'luxury',
                    emoji: '🪡'
                },
                'Jade Carver': {
                    statRequirements: { minDexterity: 8, minCraftiness: 8 },
                    socialRequirements: { maxPrivilege: 0.7 },
                    keywords: 'jade',
                    emoji: '💎'
                },
                'Woodblock Printer': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'printing',
                    emoji: '🖨️'
                },
                'Paper Maker': {
                    statRequirements: { minDexterity: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'paper',
                    emoji: '📄'
                },
                'Inkstick Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'ink',
                    emoji: '🖌️'
                }
            },
            MERCHANT: {
                'Tea Trader': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minWanderlust: 0.4 },
                    keywords: 'caravan',
                    emoji: '🍵'
                },
                'Silk Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.3, minWanderlust: 0.4 },
                    keywords: 'wealth',
                    emoji: '🐪'
                },
                'Porcelain Dealer': {
                    statRequirements: { minPersuasion: 5, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'export',
                    emoji: '🏺'
                },
                'Rice Merchant': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'grain',
                    emoji: '🌾'
                }
            },
            COMMONER: {
                'Rice Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'paddy',
                    emoji: '🌾'
                },
                'Tea Picker': {
                    statRequirements: { minDexterity: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'harvest',
                    emoji: '🍃'
                },
                'Boatman': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'waterways',
                    emoji: '🛶'
                },
                'Market Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'selling',
                    emoji: '🛒'
                },
                'Noodle Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'noodles',
                    emoji: '🍜'
                }
            }
        },

        [HistoricalEra.INDUSTRIAL_ERA]: {
            MODERNIZING_CLASS: {
                'Telegraph Operator': {
                    statRequirements: { minDexterity: 6, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'communication',
                    emoji: '📠'
                },
                'Railway Engineer': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minAmbition: 0.6 },
                    keywords: 'locomotive',
                    emoji: '🚂'
                },
                'Newspaper Editor': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    keywords: 'journalism',
                    emoji: '📰'
                },
                'Translator': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'languages',
                    emoji: '📚'
                },
                'Photographer': {
                    statRequirements: { minDexterity: 6, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'photography',
                    emoji: '📷'
                },
                'Comprador': {
                    statRequirements: { minPersuasion: 7, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.5, minAmbition: 0.6 },
                    keywords: 'foreign trade treaty port middleman',
                    emoji: '🤝',
                    frequency: 'uncommon' as const
                },
                'Banker': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'money lending finance',
                    emoji: '🏦',
                    frequency: 'uncommon' as const
                }
            },
            MERCHANT_CLASS: {
                'Tea Merchant': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'tea trade export',
                    emoji: '🍵'
                },
                'Silk Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'silk trade luxury',
                    emoji: '🪡'
                },
                'Rice Dealer': {
                    statRequirements: { minPersuasion: 5, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'grain trade',
                    emoji: '🍚'
                },
                'Pawnshop Owner': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'pawn money lending',
                    emoji: '🏪'
                },
                'Teahouse Owner': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'hospitality social gathering',
                    emoji: '🏠'
                },
                'Porcelain Dealer': {
                    statRequirements: { minPersuasion: 6, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'ceramics export trade',
                    emoji: '🏺'
                }
            },
            TRADITIONAL_PROFESSIONS: {
                'Scholar': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'classics examination confucian',
                    emoji: '📜'
                },
                'Traditional Doctor': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'medicine herbs acupuncture',
                    emoji: '🌿'
                },
                'Fortune Teller': {
                    statRequirements: { minPersuasion: 6, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'divination fate',
                    emoji: '🔮'
                },
                'Temple Keeper': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.6, maxPrivilege: 0.4 },
                    keywords: 'buddhist taoist shrine',
                    emoji: '🏯'
                },
                'Calligrapher': {
                    statRequirements: { minDexterity: 7, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'brush writing art',
                    emoji: '🖌️'
                },
                'Opera Performer': {
                    statRequirements: { minDexterity: 6, minPersuasion: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'peking opera theater',
                    emoji: '🎭'
                }
            },
            URBAN_WORKERS: {
                'Factory Worker': {
                    statRequirements: { minDexterity: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'textile',
                    emoji: '🧵'
                },
                'Rickshaw Puller': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'transport',
                    emoji: '🛺'
                },
                'Stevedore': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'cargo',
                    emoji: '⚓'
                },
                'Police Officer': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'order',
                    emoji: '👮'
                },
                'Fireman': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'firefighting',
                    emoji: '🔥'
                },
                'Machinist': {
                    statRequirements: { minDexterity: 6, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'machinery',
                    emoji: '⚙️'
                },
                'Ronin': {
                    statRequirements: { minStrength: 3, minDexterity: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.6 },
                    genderBias: 'Male',
                    keywords: 'masterless samurai',
                    emoji: '⚔️',
                    frequency: 'rare' as const
                },
                'Yakuza': {
                    statRequirements: { minStrength: 3, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.4 },
                    genderBias: 'Male',
                    keywords: 'organized crime',
                    emoji: '🐉',
                    frequency: 'very_rare' as const
                },
                'Opium Smuggler': {
                    statRequirements: { minCraftiness: 4, minPersuasion: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.5 },
                    keywords: 'illegal trade',
                    emoji: '🚬',
                    frequency: 'rare' as const
                },
                'Triad Member': {
                    statRequirements: { minStrength: 2, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'secret society',
                    emoji: '🔺',
                    frequency: 'very_rare' as const
                },
                'Boxer Rebel': {
                    statRequirements: { minStrength: 3, minStamina: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'anti-foreign',
                    emoji: '👊',
                    frequency: 'very_rare' as const
                },
                'Taiping Soldier': {
                    statRequirements: { minConstitution: 3, minPersuasion: 2 },
                    socialRequirements: { maxPrivilege: 0.3, minReligiosity: 0.5 },
                    keywords: 'heavenly kingdom',
                    emoji: '✝️',
                    frequency: 'very_rare' as const
                },
                'Black Flag Fighter': {
                    statRequirements: { minStrength: 3, minCraftiness: 2 },
                    socialRequirements: { maxPrivilege: 0.2, minAmbition: 0.5 },
                    keywords: 'anti-colonial',
                    emoji: '🏴',
                    frequency: 'very_rare' as const
                },
                'Coolie': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'labor porter carrying',
                    emoji: '💪'
                },
                'Sedan Chair Carrier': {
                    statRequirements: { minStrength: 7, minStamina: 7 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'transport palanquin',
                    emoji: '🪑'
                },
                'Night Soil Collector': {
                    statRequirements: { minConstitution: 6, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.1 },
                    genderBias: 'Male',
                    keywords: 'sanitation waste',
                    emoji: '🪣'
                }
            },
            RURAL: {
                'Rice Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'paddy agriculture',
                    emoji: '🌾'
                },
                'Tea Picker': {
                    statRequirements: { minDexterity: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'harvest plantation',
                    emoji: '🍵'
                },
                'Silk Farmer': {
                    statRequirements: { minDexterity: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'silkworm mulberry',
                    emoji: '🐛'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'fishing nets boat',
                    emoji: '🎣'
                },
                'Water Buffalo Herder': {
                    statRequirements: { minPerception: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'livestock plowing',
                    emoji: '🐃'
                },
                'Village Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'metal tools',
                    emoji: '⚒️'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                             SOUTH ASIA                              */
    /* =================================================================== */
    SOUTH_ASIAN: {
        [HistoricalEra.PREHISTORY]: {
            HARAPPAN: {
                'Brick Maker': {
                    statRequirements: { minStrength: 5, minCraftiness: 5 },
                    keywords: 'construction',
                    emoji: '🧱'
                },
                'Seal Carver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'seals',
                    emoji: '🪧'
                },
                'Trader': {
                    statRequirements: { minPersuasion: 5, minIntelligence: 5 },
                    socialRequirements: { minWanderlust: 0.4 },
                    keywords: 'commerce',
                    emoji: '⚖️'
                },
                'Bead Maker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'jewelry',
                    emoji: '📿'
                }
            }
        },

        [HistoricalEra.ANTIQUITY]: {
            BRAHMIN: {
                'Priest': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'rituals',
                    emoji: '🕉️'
                },
                'Scholar': {
                    statRequirements: { minIntelligence: 8 },
                    socialRequirements: { minReligiosity: 0.7, minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'vedas',
                    emoji: '📚'
                },
                'Astrologer': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.6, minPrivilege: 0.5 },
                    keywords: 'astrology',
                    emoji: '🔯'
                }
            },
            KSHATRIYA: {
                'Kshatriya Warrior': {
                    statRequirements: { minStrength: 6, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'dharma',
                    emoji: '⚔️'
                },
                'Kshatriya Chariot Driver': {
                    statRequirements: { minDexterity: 7, minStrength: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'chariot',
                    emoji: '🏇'
                }
            },
            VAISHYA: {
                'Merchant': {
                    statRequirements: { minPersuasion: 6, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.4, minWanderlust: 0.4 },
                    keywords: 'trading',
                    emoji: '🛒'
                },
                'Banker': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'money',
                    emoji: '💰'
                }
            },
            SHUDRA: {
                'Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'monsoon rice farmer',
                    emoji: '🪻'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'cotton',
                    emoji: '🧶'
                },
                'Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'metalwork',
                    emoji: '🔨'
                },
                'Carpenter': {
                    statRequirements: { minStrength: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'woodwork',
                    emoji: '🪚'
                }
            },
            DALITS: {
                'Fisherwoman': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'fishing nets coastal',
                    emoji: '🎣'
                },
                'Salt Worker': {
                    statRequirements: { minConstitution: 6, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'salt pans evaporation',
                    emoji: '🧂'
                },
                'Toddy Tapper': {
                    statRequirements: { minDexterity: 6, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'palm wine climbing',
                    emoji: '🥥'
                }
            }
        },

        [HistoricalEra.MEDIEVAL]: {
            RELIGIOUS: {
                'Hindu Priest': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'temple',
                    emoji: '🕉️'
                },
                'Buddhist Monk': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.8, maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'monastery',
                    emoji: '🧘'
                },
                'Ascetic': {
                    statRequirements: {},
                    socialRequirements: { minReligiosity: 0.9, maxPrivilege: 0.4 },
                    keywords: 'renunciation',
                    emoji: '🧘‍♂️'
                },
                'Temple Dancer': {
                    statRequirements: { minDexterity: 8, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.6, maxPrivilege: 0.6 },
                    genderBias: 'Female',
                    keywords: 'devotional',
                    emoji: '💃'
                }
            },
            ARTISAN: {
                'Carpet Weaver': {
                    statRequirements: { minDexterity: 7 },
                    keywords: 'intricate',
                    emoji: '🧶'
                },
                'Bronze Caster': {
                    statRequirements: { minCraftiness: 7, minStrength: 5 },
                    keywords: 'foundry',
                    emoji: '🔥'
                },
                'Jeweler': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.4, maxPrivilege: 0.7 },
                    keywords: 'precious',
                    emoji: '💎'
                },
                'Stone Carver': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'temple',
                    emoji: '🗿'
                },
                'Textile Dyer': {
                    statRequirements: { minDexterity: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'colors',
                    emoji: '🎨'
                },
                'Incense Maker': {
                    statRequirements: { minDexterity: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'fragrance',
                    emoji: '🪔'
                },
                'Vaidya': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'ayurvedic physician medicine healing',
                    emoji: '🧘'
                },
                'Hakim': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'unani medicine healing',
                    emoji: '⚕️'
                },
                'Dai': {
                    statRequirements: { minPerception: 6, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'traditional midwife birthing',
                    emoji: '👶'
                },
                'Jadi Booti Wala': {
                    statRequirements: { minPerception: 6, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.2 },
                    keywords: 'herb collector seller medicine',
                    emoji: '🌿'
                },
                'Nadi Vaidya': {
                    statRequirements: { minPerception: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'pulse diagnosis specialist',
                    emoji: '🫱'
                }
            },
            COMMONER: {
                'Rice Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'irrigation',
                    emoji: '🌾'
                },
                'Spice Grower': {
                    statRequirements: { minConstitution: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'spices',
                    emoji: '🌶️'
                },
                'Cotton Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'cotton',
                    emoji: '🪴'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Cowherd': {
                    statRequirements: { minPerception: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'cattle',
                    emoji: '🐄'
                },
                'Village Headman': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4, maxPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'leadership',
                    emoji: '👨‍💼'
                },
                'Village Scribe': {
                    statRequirements: { minIntelligence: 6, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'writing documents records',
                    emoji: '✍️'
                },
                'Brick Layer': {
                    statRequirements: { minStrength: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'construction buildings',
                    emoji: '🧱'
                },
                'Basket Weaver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'baskets weaving',
                    emoji: '🧺'
                },
                'Oil Presser': {
                    statRequirements: { minStrength: 6, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'oil pressing seeds',
                    emoji: '🫒'
                }
            }
        },

        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            MUGHAL_COURT: {
                'Court Musician': {
                    statRequirements: { minDexterity: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4, maxPrivilege: 0.7 },
                    keywords: 'music',
                    emoji: '🎵'
                },
                'Court Painter': {
                    statRequirements: { minDexterity: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4, maxPrivilege: 0.7 },
                    keywords: 'miniatures',
                    emoji: '🎨'
                },
                'Translator': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'languages',
                    emoji: '📚'
                }
            },
            COMPANY_SERVICE: {
                'Sepoy': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'colonial',
                    emoji: '🔫'
                },
                'Clerk': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    keywords: 'administration',
                    emoji: '📔'
                },
                'Interpreter': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'translation',
                    emoji: '🗣️'
                },
                'Tax Collector': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'revenue',
                    emoji: '💰'
                }
            },
            MILITARY: {
                'Sikh Warrior': {
                    statRequirements: { minStrength: 7, minConstitution: 6, minDexterity: 6 },
                    socialRequirements: { minAmbition: 0.5, minReligiosity: 0.6 },
                    genderBias: 'Male',
                    keywords: 'chakram sword turban',
                    emoji: '⚔️'
                }
            },
            ARTISAN: {
                'Textile Weaver': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'handloom',
                    emoji: '🧶'
                },
                'Metalworker': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    keywords: 'damascene',
                    emoji: '⚔️'
                },
                'Carpet Maker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'carpets',
                    emoji: '🧶'
                },
                'Jeweler': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'precious gems gold',
                    emoji: '💍'
                },
                'Tailor': {
                    statRequirements: { minDexterity: 7, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'sewing clothing',
                    emoji: '🪡'
                }
            },
            COMMONER: {
                'Well Keeper': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'water well maintenance',
                    emoji: '🪣'
                },
                'Barber': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'grooming shaving',
                    emoji: '✂️'
                },
                'Village Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'ceramics pottery',
                    emoji: '🏺'
                },
                'Milk Seller': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'dairy milk selling',
                    emoji: '🥛'
                },
                'Vegetable Seller': {
                    statRequirements: { minPersuasion: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'market vegetables',
                    emoji: '🥬'
                },
                'Flour Miller': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'grinding flour mill',
                    emoji: '🌾'
                }
            }
        },

        [HistoricalEra.INDUSTRIAL_ERA]: {
            PROFESSIONAL: {
                'Civil Engineer': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minAmbition: 0.5 },
                    keywords: 'infrastructure',
                    emoji: '🛤️'
                },
                'Lawyer': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    keywords: 'legal barrister',
                    emoji: '⚖️'
                },
                'Doctor': {
                    statRequirements: { minIntelligence: 7, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'medicine western',
                    emoji: '👨‍⚕️'
                },
                'Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    keywords: 'education school',
                    emoji: '📚'
                },
                'Journalist': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    keywords: 'press newspaper',
                    emoji: '📰'
                },
                'Clerk': {
                    statRequirements: { minIntelligence: 5, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'office administration babu',
                    emoji: '📋'
                }
            },
            MERCHANT_CLASS: {
                'Cloth Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'textile trade bazaar',
                    emoji: '🧵'
                },
                'Grain Dealer': {
                    statRequirements: { minPersuasion: 5, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'rice wheat trade',
                    emoji: '🌾'
                },
                'Money Lender': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'finance lending',
                    emoji: '💰'
                },
                'Spice Merchant': {
                    statRequirements: { minPersuasion: 6, minPerception: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'spice trade',
                    emoji: '🫚'
                },
                'Shopkeeper': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'retail shop',
                    emoji: '🏪'
                }
            },
            TRADITIONAL_PROFESSIONS: {
                'Brahmin Priest': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.7, minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'hindu ritual temple',
                    emoji: '🙏'
                },
                'Ayurvedic Doctor': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'traditional medicine herbs',
                    emoji: '🌿'
                },
                'Astrologer': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'jyotish horoscope',
                    emoji: '⭐'
                },
                'Goldsmith': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'jewelry gold',
                    emoji: '💍'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'handloom cloth',
                    emoji: '🧶'
                },
                'Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'clay ceramics',
                    emoji: '🏺'
                }
            },
            WORKING_CLASS: {
                'Mill Worker': {
                    statRequirements: { minDexterity: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'textile factory',
                    emoji: '🏭'
                },
                'Tea Picker': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'plantation assam',
                    emoji: '🍃'
                },
                'Railway Worker': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'construction',
                    emoji: '🔨'
                },
                'Dock Worker': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'cargo port',
                    emoji: '⚓'
                },
                'Domestic Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'household ayah',
                    emoji: '🧹'
                },
                'Street Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'selling hawker',
                    emoji: '🛒'
                },
                'Jute Mill Worker': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'jute factory bengal',
                    emoji: '🏭'
                },
                'Railway Porter': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'railway station coolie',
                    emoji: '🚂'
                },
                'Dhobi': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'laundry washing',
                    emoji: '🧺'
                },
                'Rickshaw Puller': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'transport',
                    emoji: '🛺'
                }
            },
            RURAL: {
                'Rice Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'paddy agriculture',
                    emoji: '🌾'
                },
                'Cotton Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'cotton agriculture',
                    emoji: '☁️'
                },
                'Indigo Worker': {
                    statRequirements: { minStamina: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'dye plantation',
                    emoji: '🔵'
                },
                'Village Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'metal tools',
                    emoji: '⚒️'
                },
                'Water Carrier': {
                    statRequirements: { minStrength: 5, minStamina: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'bhishti water',
                    emoji: '🫗'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                          MENA (Middle East & N. Africa)             */
    /* =================================================================== */
    MENA: {
        [HistoricalEra.PREHISTORY]: {
            MESOPOTAMIAN: {
                'Farmer': {
                    statRequirements: { minStrength: 4, minConstitution: 5 },
                    keywords: 'irrigation',
                    emoji: '🌾'
                },
                'Scribe': {
                    statRequirements: { minIntelligence: 6, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'cuneiform',
                    emoji: '📝'
                },
                'Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Maqla': {
                    statRequirements: { minDexterity: 3, minPerception: 3 },
                    genderBias: 'Male',
                    keywords: 'sling warrior',
                    emoji: '🪃'
                },
                'Builder': {
                    statRequirements: { minStrength: 6, minCraftiness: 5 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'ziggurat',
                    emoji: '🏗️'
                },
                'Shepherd': {
                    statRequirements: { minConstitution: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'flocks',
                    emoji: '🐑'
                }
            }
        },

        [HistoricalEra.ANTIQUITY]: {
            PERSIAN_ADMIN: {
                'Local Governor': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'provincial',
                    emoji: '🏺'
                },
                'Courier': {
                    statRequirements: { minStamina: 7, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'messages',
                    emoji: '🏃'
                },
                'Tax Assessor': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'tribute',
                    emoji: '📋'
                }
            },
            MILITARY: {
                'Persian Archer': {
                    statRequirements: { minDexterity: 7, minPerception: 7, minConstitution: 6 },
                    socialRequirements: { minPrivilege: 0.3, minAmbition: 0.4 },
                    genderBias: 'Male',
                    keywords: 'composite bow immortal',
                    emoji: '🏹'
                }
            },
            RELIGIOUS: {
                'Priest': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'fire',
                    emoji: '🔥'
                },
                'Temple Keeper': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { minReligiosity: 0.6, maxPrivilege: 0.4 },
                    keywords: 'maintenance',
                    emoji: '🏛️'
                }
            },
            COMMONER: {
                'Farmer': {
                    statRequirements: { minStrength: 4, minConstitution: 5 },
                    keywords: 'irrigation',
                    emoji: '🌾'
                },
                'Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'textiles',
                    emoji: '🧶'
                },
                'Metalworker': {
                    statRequirements: { minStrength: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'metalwork',
                    emoji: '🔨'
                },
                'Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minWanderlust: 0.4, maxPrivilege: 0.6 },
                    keywords: 'trading',
                    emoji: '🪙'
                }
            }
        },

        [HistoricalEra.MEDIEVAL]: {
            SCHOLAR: {
                'Physician': {
                    statRequirements: { minIntelligence: 8, minDexterity: 5 },
                    keywords: 'medicine',
                    emoji: '🧑‍⚕️'
                },
                'Astronomer': {
                    statRequirements: { minIntelligence: 9 },
                    socialRequirements: { maxReligiosity: 0.6 },
                    keywords: 'observatory',
                    emoji: '🔭'
                },
                'Translator': {
                    statRequirements: { minIntelligence: 8 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'scholarship',
                    emoji: '📚'
                },
                'Mathematician': {
                    statRequirements: { minIntelligence: 9 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'calculation',
                    emoji: '🔢'
                },
                'Librarian': {
                    statRequirements: { minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'manuscripts',
                    emoji: '📚'
                }
            },
            ARTISAN: {
                'Calligrapher': {
                    statRequirements: { minDexterity: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'calligraphy',
                    emoji: '🖋️'
                },
                'Carpet Weaver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'carpet',
                    emoji: '🧶'
                },
                'Metalworker': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'damascene',
                    emoji: '⚔️'
                },
                'Perfumer': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'fragrance',
                    emoji: '🌹'
                },
                'Glassblower': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'glass',
                    emoji: '🍶'
                }
            },
            COMMONER: {
                'Spice Merchant': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.6, minWanderlust: 0.4 },
                    keywords: 'bazaar',
                    emoji: '🌶️'
                },
                'Nomad': {
                    statRequirements: { minConstitution: 6, minPerception: 6 },
                    socialRequirements: { minWanderlust: 0.8 },
                    keywords: 'desert',
                    emoji: '🏜️'
                },
                'Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'oasis',
                    emoji: '🌾'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Date Farmer': {
                    statRequirements: { minConstitution: 5, minDexterity: 4 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'dates',
                    emoji: '🌴'
                },
                'Camel Herder': {
                    statRequirements: { minConstitution: 6, minPerception: 6 },
                    socialRequirements: { minWanderlust: 0.6, maxPrivilege: 0.3 },
                    keywords: 'camels',
                    emoji: '🐪'
                },
                'Water Carrier': {
                    statRequirements: { minStrength: 5, minStamina: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'water',
                    emoji: '🪣'
                },
                'Baker': {
                    statRequirements: { minStamina: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'bread',
                    emoji: '🍞'
                }
            },
            RELIGIOUS: {
                'Imam': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'prayer',
                    emoji: '🕌'
                },
                'Muezzin': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8 },
                    genderBias: 'Male',
                    keywords: 'call',
                    emoji: '🕌'
                },
                'Pilgrim': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { minReligiosity: 0.7, minWanderlust: 0.6 },
                    keywords: 'pilgrimage',
                    emoji: '🕋'
                },
                'Quranic Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.7, maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'recitation',
                    emoji: '📖'
                },
                'Hakim': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'islamic medicine',
                    emoji: '⚕️'
                },
                'Tabib': {
                    statRequirements: { minIntelligence: 6, minWisdom: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'general physician healing',
                    emoji: '👨‍⚕️'
                },
                'Jarrah': {
                    statRequirements: { minDexterity: 7, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'surgeon surgical',
                    emoji: '🔪'
                },
                'Attar': {
                    statRequirements: { minIntelligence: 5, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'perfumer medicine seller apothecary',
                    emoji: '🏺'
                },
                'Kahhal': {
                    statRequirements: { minPerception: 8, minDexterity: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'eye doctor ophthalmologist',
                    emoji: '👁️'
                }
            }
        },

        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            OTTOMAN_SERVICE: {
                'Janissary': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    genderBias: 'Male',
                    keywords: 'elite',
                    emoji: '🗡️'
                },
                'Provincial Governor': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.7, minAmbition: 0.6 },
                    genderBias: 'Male',
                    keywords: 'administration',
                    emoji: '📜'
                },
                'Tax Farmer': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minAmbition: 0.6 },
                    keywords: 'revenue',
                    emoji: '💰'
                },
                'Court Interpreter': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minWanderlust: 0.4 },
                    keywords: 'languages',
                    emoji: '🗣️'
                }
            },
            MERCHANT: {
                'Coffeehouse Keeper': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'social',
                    emoji: '☕'
                },
                'Silk Road Trader': {
                    statRequirements: { minPersuasion: 6, minIntelligence: 5 },
                    socialRequirements: { minWanderlust: 0.6 },
                    keywords: 'caravan',
                    emoji: '🐪'
                },
                'Carpet Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4, minWanderlust: 0.4 },
                    keywords: 'luxury',
                    emoji: '🧶'
                }
            },
            ARTISAN: {
                'Tile Maker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'ceramics',
                    emoji: '🎨'
                },
                'Weapon Smith': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'weapons',
                    emoji: '⚔️'
                }
            }
        },

        [HistoricalEra.INDUSTRIAL_ERA]: {
            MODERNIZING_CLASS: {
                'Telegraph Operator': {
                    statRequirements: { minDexterity: 5, minIntelligence: 6 },
                    keywords: 'modernization',
                    emoji: '📠'
                },
                'Oil Worker': {
                    statRequirements: { minPerception: 6, minConstitution: 6 },
                    socialRequirements: { minAmbition: 0.5 },
                    keywords: 'petroleum',
                    emoji: '🛢️'
                },
                'Railway Engineer': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 6 },
                    socialRequirements: { minAmbition: 0.5 },
                    keywords: 'locomotive',
                    emoji: '🚂'
                },
                'Newspaper Editor': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minAmbition: 0.4 },
                    keywords: 'journalism reform',
                    emoji: '📰'
                },
                'Banker': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'finance',
                    emoji: '🏦',
                    frequency: 'uncommon' as const
                },
                'Translator': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'languages dragoman',
                    emoji: '📚'
                },
                'Army Officer': {
                    statRequirements: { minStrength: 5, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'military tanzimat',
                    emoji: '🎖️',
                    frequency: 'uncommon' as const
                },
                'Civil Servant': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'government bureaucracy',
                    emoji: '📋'
                }
            },
            MERCHANT_CLASS: {
                'Coffeehouse Keeper': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'social gathering',
                    emoji: '☕'
                },
                'Carpet Merchant': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'luxury trade',
                    emoji: '🧶'
                },
                'Spice Trader': {
                    statRequirements: { minPersuasion: 6, minPerception: 5 },
                    socialRequirements: { minPrivilege: 0.4, minWanderlust: 0.4 },
                    keywords: 'bazaar trade',
                    emoji: '🫚'
                },
                'Cotton Merchant': {
                    statRequirements: { minPersuasion: 6, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'export trade egypt',
                    emoji: '🧵'
                },
                'Money Changer': {
                    statRequirements: { minIntelligence: 6, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'currency exchange',
                    emoji: '💱'
                }
            },
            TRADITIONAL_PROFESSIONS: {
                'Imam': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'prayer mosque',
                    emoji: '🕌'
                },
                'Qadi': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.7, minPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'islamic law judge',
                    emoji: '⚖️',
                    frequency: 'uncommon' as const
                },
                'Hakeem': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'traditional medicine unani',
                    emoji: '🌿'
                },
                'Calligrapher': {
                    statRequirements: { minDexterity: 7, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'arabic script art',
                    emoji: '🖌️'
                },
                'Bazaar Shopkeeper': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'retail souk',
                    emoji: '🏪'
                }
            },
            WORKING_CLASS: {
                'Factory Worker': {
                    statRequirements: { minDexterity: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'textile',
                    emoji: '🏭'
                },
                'Canal Worker': {
                    statRequirements: { minStrength: 6, minConstitution: 7 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'excavation suez',
                    emoji: '⛏️'
                },
                'Dock Worker': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'cargo port',
                    emoji: '⚓'
                },
                'Street Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'selling hawker',
                    emoji: '🛒'
                },
                'Water Carrier': {
                    statRequirements: { minStrength: 6, minStamina: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'saqqa water delivery',
                    emoji: '🫗'
                },
                'Donkey Driver': {
                    statRequirements: { minPerception: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'transport',
                    emoji: '🫏'
                }
            },
            RURAL: {
                'Fellah': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'peasant farmer egypt',
                    emoji: '🌾'
                },
                'Date Farmer': {
                    statRequirements: { minStamina: 5, minDexterity: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'palm oasis',
                    emoji: '🌴'
                },
                'Shepherd': {
                    statRequirements: { minPerception: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'goats sheep bedouin',
                    emoji: '🐑'
                },
                'Olive Grower': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'orchard levant',
                    emoji: '🫒'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                     NORTH AMERICA (Pre-Columbian)                   */
    /* =================================================================== */
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        [HistoricalEra.PREHISTORY]: {
            PALEOLITHIC: {
                'Hunter': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    keywords: 'tracking',
                    emoji: '🪨'
                },
                'Gatherer': {
                    statRequirements: { minDexterity: 5, minPerception: 6 },
                    genderBias: 'Female',
                    keywords: 'foraging',
                    emoji: '🧺'
                },
                'Toolmaker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'flintknapping',
                    emoji: '🔪'
                },
                'Fisher': {
                    statRequirements: { minDexterity: 6, minPerception: 5 },
                    keywords: 'rivers',
                    emoji: '🎣'
                },
                'Hide Dresser': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    genderBias: 'Female',
                    keywords: 'hides',
                    emoji: '🦌'
                },
                'Medicine Person': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'healing spirits',
                    emoji: '🌿'
                },
                'Corn Grower': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'corn maize cultivation',
                    emoji: '🌽'
                },
                'Three Sisters Farmer': {
                    statRequirements: { minConstitution: 5, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'corn beans squash',
                    emoji: '🌾'
                },
                'Hide Worker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'leather tanning hides',
                    emoji: '🦌'
                },
                'Flintknapper': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'stone tools flint',
                    emoji: '🪨'
                },
                'Deer Hunter': {
                    statRequirements: { minDexterity: 6, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'deer hunting forest',
                    emoji: '🦌'
                },
                'Fish Smoker': {
                    statRequirements: { minConstitution: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'fish preservation smoking',
                    emoji: '🐟'
                },
                'Berry Gatherer': {
                    statRequirements: { minPerception: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'berries foraging',
                    emoji: '🫐'
                },
                'Root Digger': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'roots tubers gathering',
                    emoji: '🥔'
                },
                'Wild Rice Harvester': {
                    statRequirements: { minDexterity: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'wild rice harvesting',
                    emoji: '🌾'
                }
            }
        },

        [HistoricalEra.ANTIQUITY]: {
            Commoner: {
                'Farmer': {
                    statRequirements: { minStrength: 4, minConstitution: 5 },
                    keywords: 'maize',
                    emoji: '🌽'
                },
                'Porter': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'carrying',
                    emoji: '🎒'
                },
                'Obsidian Knapper': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'blades',
                    emoji: '🔪'
                },
                'Featherworker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    keywords: 'featherwork',
                    emoji: '🪶'
                },
                'Ball Court Player': {
                    statRequirements: { minStrength: 6, minDexterity: 7 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'ritual',
                    emoji: '⚽'
                },
                'Cacao Grower': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'chocolate',
                    emoji: '🍫'
                },
                'Jade Carver': {
                    statRequirements: { minDexterity: 8, minCraftiness: 8 },
                    socialRequirements: { maxPrivilege: 0.7 },
                    keywords: 'precious',
                    emoji: '💎'
                },
                'Market Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'selling',
                    emoji: '🛒'
                },
                'Chinampero': {
                    statRequirements: { minStrength: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'agriculture',
                    emoji: '🌱'
                },
                'Tribute Collector': {
                    statRequirements: { minPersuasion: 5, minStrength: 4 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'taxation',
                    emoji: '📋'
                },
                'Curandero': {
                    statRequirements: { minIntelligence: 6, minPerception: 5 },
                    socialRequirements: { minReligiosity: 0.4 },
                    keywords: 'medicinal plants',
                    emoji: '🌿'
                }
            }
        },

        [HistoricalEra.MEDIEVAL]: {
            Woodlands: {
                'Basket Maker': {
                    statRequirements: { minDexterity: 6 },
                    genderBias: 'Female',
                    keywords: 'weaving',
                    emoji: '🧺'
                },
                'Wampum Maker': {
                    statRequirements: { minDexterity: 6 },
                    keywords: 'diplomacy',
                    emoji: '🟣'
                },
                'Canoe Builder': {
                    statRequirements: { minStrength: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'birchbark',
                    emoji: '🛶'
                },
                'Maple Sugar Maker': {
                    statRequirements: { minDexterity: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'sweetening',
                    emoji: '🍁'
                },
                'Medicine Gatherer': {
                    statRequirements: { minIntelligence: 6, minPerception: 7 },
                    socialRequirements: { minReligiosity: 0.6 },
                    genderBias: 'Female',
                    keywords: 'healing',
                    emoji: '🌿'
                },
                'Paqo': {
                    statRequirements: { minIntelligence: 7, minWisdom: 6 },
                    socialRequirements: { minReligiosity: 0.7, minPrivilege: 0.5 },
                    keywords: 'ritual healer inca medicine',
                    emoji: '🏔️'
                },
                'Ticitl': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'aztec physician medicine professional',
                    emoji: '🌵'
                },
                'Herbatero': {
                    statRequirements: { minPerception: 7, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'plant medicine specialist herbs',
                    emoji: '🌱'
                },
                'Sobador': {
                    statRequirements: { minStrength: 5, minDexterity: 6 },
                    keywords: 'massage manipulation healer bones',
                    emoji: '🤲'
                },
                'Fish Weir Builder': {
                    statRequirements: { minCraftiness: 6, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'fishing',
                    emoji: '🎣'
                },
                'Clan Mother': {
                    statRequirements: { minWisdom: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Female',
                    keywords: 'leadership matriarch clan',
                    emoji: '👵'
                },
                'Canoe Maker': {
                    statRequirements: { minCraftiness: 7, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'canoe woodwork',
                    emoji: '🛶'
                },
                'Pemmican Maker': {
                    statRequirements: { minCraftiness: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'pemmican preservation food',
                    emoji: '🥩'
                },
                'Maple Syrup Maker': {
                    statRequirements: { minPerception: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'maple syrup tapping',
                    emoji: '🍁'
                },
                'Fur Trader': {
                    statRequirements: { minPersuasion: 5, minConstitution: 5 },
                    socialRequirements: { minWanderlust: 0.5, maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'fur trading commerce',
                    emoji: '🦫'
                },
                'Scout': {
                    statRequirements: { minPerception: 7, minDexterity: 6, minConstitution: 6 },
                    socialRequirements: { minWanderlust: 0.6 },
                    genderBias: 'Male',
                    keywords: 'scouting tracking',
                    emoji: '👁️'
                },
                'Corn Grinder': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'corn grinding food',
                    emoji: '🌽'
                },
                'Turquoise Worker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'turquoise jewelry stone',
                    emoji: '💎'
                }
            },
            Plains: {
                'Buffalo Hunter': {
                    statRequirements: { minStrength: 6, minPerception: 7 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'hunting',
                    emoji: '🦬'
                },
                'Hide Processor': {
                    statRequirements: { minDexterity: 6, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'tanning',
                    emoji: '🦌'
                },
                'Horse Trainer': {
                    statRequirements: { minDexterity: 6, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'horses',
                    emoji: '🐎'
                },
                'Tipi Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'shelter',
                    emoji: '⛺'
                },
                'Medicine Man': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.6 },
                    genderBias: 'Male',
                    keywords: 'healing ceremony',
                    emoji: '🦅'
                },
                'Apache Scout': {
                    statRequirements: { minDexterity: 7, minPerception: 8, minConstitution: 7 },
                    socialRequirements: { minWanderlust: 0.6 },
                    genderBias: 'Male',
                    keywords: 'tracking bow stealth',
                    emoji: '🏹'
                }
            },
            SOUTHWEST: {
                'Potter': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Corn Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'agriculture',
                    emoji: '🌽'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 7 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'textiles',
                    emoji: '🧶'
                },
                'Cliff Dweller': {
                    statRequirements: { minStrength: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'building',
                    emoji: '🏔️'
                },
                'Pueblo Healer': {
                    statRequirements: { minIntelligence: 6, minPerception: 5 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'kiva medicine',
                    emoji: '🌵'
                }
            },
            Northwest: {
                'Salmon Fisher': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'salmon',
                    emoji: '🐟'
                },
                'Cedar Worker': {
                    statRequirements: { minStrength: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'woodwork',
                    emoji: '🌲'
                },
                'Totem Carver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    socialRequirements: { minReligiosity: 0.6 },
                    genderBias: 'Male',
                    keywords: 'carving',
                    emoji: '🗿'
                },
                'Whale Hunter': {
                    statRequirements: { minStrength: 7, minConstitution: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'whaling',
                    emoji: '🐋'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                     NORTH AMERICA (Colonial)                        */
    /* =================================================================== */
    NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            SPANISH_COLONIAL: {
                'Vaquero': {
                    statRequirements: { minDexterity: 6, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.4, minWanderlust: 0.4 },
                    genderBias: 'Male',
                    keywords: 'cattle',
                    emoji: '🤠'
                },
                'Mission Indian': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2, minReligiosity: 0.5 },
                    keywords: 'conversion',
                    emoji: '⛪'
                },
                'Presidio Soldier': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'frontier',
                    emoji: '⚔️'
                },
                'Ranchero': {
                    statRequirements: { minPersuasion: 5, minStrength: 5 },
                    socialRequirements: { minPrivilege: 0.5, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'landowner',
                    emoji: '🏇'
                },
                'Desperado': {
                    statRequirements: { minDexterity: 4, minStrength: 3 },
                    socialRequirements: { maxPrivilege: 0.2, minWanderlust: 0.7 },
                    genderBias: 'Male',
                    keywords: 'outlaw gunslinger',
                    emoji: '🔫'
                }
            },
            ENGLISH_COLONIAL: {
                'Tobacco Farmer': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'plantation',
                    emoji: '🚬'
                },
                'Indentured Servant': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'bondage',
                    emoji: '⛓️'
                },
                'Enslaved Person': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.05 },
                    keywords: 'plantation',
                    emoji: '⛓️'
                },
                'Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'metalwork',
                    emoji: '🔨'
                },
                'Miller': {
                    statRequirements: { minStrength: 5, minCraftiness: 4 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'grain',
                    emoji: '⚙️'
                },
                'Shipwright': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'shipbuilding',
                    emoji: '🚢'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'cod',
                    emoji: '🎣'
                },
                'Tavern Keeper': {
                    statRequirements: { minPersuasion: 5, minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'hospitality',
                    emoji: '🍺'
                }
            },
            FRENCH_COLONIAL: {
                'Voyageur': {
                    statRequirements: { minStamina: 6, minStrength: 5 },
                    socialRequirements: { minWanderlust: 0.6 },
                    genderBias: 'Male',
                    keywords: 'canoe',
                    emoji: '🛶'
                },
                'Fur Trapper': {
                    statRequirements: { minPerception: 6 },
                    socialRequirements: { minWanderlust: 0.5 },
                    genderBias: 'Male',
                    keywords: 'beaver',
                    emoji: '🦫'
                },
                'Habitant': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'farming',
                    emoji: '🧑‍🌾'
                },
                'Coureur de Bois': {
                    statRequirements: { minStamina: 6, minPerception: 6 },
                    socialRequirements: { minWanderlust: 0.7, maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'wilderness',
                    emoji: '🌲'
                }
            }
        },

        [HistoricalEra.INDUSTRIAL_ERA]: {
            FRONTIER: {
                'Homesteader': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { minWanderlust: 0.5, maxPrivilege: 0.4 },
                    keywords: 'frontier',
                    emoji: '🏚️'
                },
                'Cowboy': {
                    statRequirements: { minDexterity: 6, minStamina: 6 },
                    socialRequirements: { minWanderlust: 0.5, maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'cattle',
                    emoji: '🤠'
                },
                'Gold Prospector': {
                    statRequirements: { minConstitution: 6, minPerception: 6 },
                    socialRequirements: { minWanderlust: 0.6 },
                    keywords: 'prospecting',
                    emoji: '🥇'
                },
                'Mountain Man': {
                    statRequirements: { minStrength: 6, minConstitution: 7 },
                    socialRequirements: { minWanderlust: 0.8, maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'wilderness',
                    emoji: '🏔️'
                },
                'Lumberjack': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'logging',
                    emoji: '🪓'
                },
                'Railroad Worker': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'construction',
                    emoji: '🔨'
                },
                'Sod Buster': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'farming',
                    emoji: '🌾'
                },
                'Stagecoach Driver': {
                    statRequirements: { minDexterity: 6, minPerception: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'transport',
                    emoji: '🐎'
                }
            },
            URBAN: {
                'Factory Worker': {
                    statRequirements: { minDexterity: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'industrial',
                    emoji: '🏭'
                },
                'Seamstress': {
                    statRequirements: { minDexterity: 7 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'sewing',
                    emoji: '🪡'
                },
                'Newsboy': {
                    statRequirements: { minPersuasion: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'newspapers',
                    emoji: '📰'
                },
                'Police Officer': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    socialRequirements: { minAmbition: 0.3, maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'order',
                    emoji: '👮'
                },
                'Streetcar Conductor': {
                    statRequirements: { minPersuasion: 5, minDexterity: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'transport',
                    emoji: '🚋'
                }
            },
            NATIVE_AMERICAN: {
                'Reservation Farmer': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'adaptation',
                    emoji: '🌾'
                },
                'Indian Agent': {
                    statRequirements: { minPersuasion: 5, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'administration',
                    emoji: '📋'
                },
                'Boarding School Student': {
                    statRequirements: { minIntelligence: 4 },
                    socialRequirements: { maxPrivilege: 0.2, minReligiosity: 0.5 },
                    keywords: 'assimilation',
                    emoji: '📚'
                },
                'Traditional Crafter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'tradition',
                    emoji: '🏺'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                               OCEANIA                               */
    /* =================================================================== */
    OCEANIA: {
        [HistoricalEra.PREHISTORY]: {
            ABORIGINAL_AUSTRALIAN: {
                'Hunter': {
                    statRequirements: { minPerception: 7, minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'tracking kangaroo emu spear',
                    emoji: '🏹'
                },
                'Gatherer': {
                    statRequirements: { minPerception: 6, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'bush tucker seeds roots witchetty',
                    emoji: '🧺'
                },
                'Songline Keeper': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minReligiosity: 0.7 },
                    keywords: 'dreaming navigation oral tradition',
                    emoji: '🎵',
                    frequency: 'uncommon' as const
                },
                'Firestick Farmer': {
                    statRequirements: { minPerception: 6, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'burning land management',
                    emoji: '🔥'
                },
                'Stone Knapper': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    keywords: 'tools flint axe',
                    emoji: '🪨'
                },
                'Ngangkari': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.5 },
                    keywords: 'healer spiritual clever person',
                    emoji: '✨',
                    frequency: 'uncommon' as const
                },
                'Elder': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'law keeper wisdom',
                    emoji: '👴',
                    frequency: 'uncommon' as const
                },
                'Bark Painter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'art ochre dreaming',
                    emoji: '🎨'
                },
                'Basket Weaver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'dilly bag weaving',
                    emoji: '🧺'
                },
                'Fisherman': {
                    statRequirements: { minDexterity: 6, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'coastal fish trap spear',
                    emoji: '🎣'
                },
                'Message Runner': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    socialRequirements: { minWanderlust: 0.5 },
                    keywords: 'messenger travel',
                    emoji: '🏃'
                },
                'Boomerang Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'hunting tool carving',
                    emoji: '🪃'
                }
            },
            ISLAND_SETTLERS: {
                'Navigator': {
                    statRequirements: { minPerception: 7, minIntelligence: 5 },
                    socialRequirements: { minWanderlust: 0.8 },
                    keywords: 'seafaring polynesian',
                    emoji: '🌊'
                },
                'Fisher': {
                    statRequirements: { minDexterity: 6, minStamina: 5 },
                    keywords: 'ocean polynesian',
                    emoji: '🎣'
                },
                'Canoe Builder': {
                    statRequirements: { minStrength: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'boats polynesian',
                    emoji: '🛶'
                },
                'Shell Diver': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    keywords: 'diving',
                    emoji: '🐚'
                },
                'Fire Keeper': {
                    statRequirements: { minPerception: 6, minConstitution: 5 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'flame',
                    emoji: '🔥'
                },
                'Toolmaker': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'obsidian',
                    emoji: '🪨'
                },
                'Tohunga': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'traditional healing polynesian',
                    emoji: '🌿'
                },
                'Net Weaver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'fishing nets weaving',
                    emoji: '🕸️'
                },
                'Shell Fisher': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'shellfish diving',
                    emoji: '🐚'
                }
            }
        },

        [HistoricalEra.ANTIQUITY]: {
            ABORIGINAL_AUSTRALIAN: {
                'Hunter': {
                    statRequirements: { minPerception: 7, minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'tracking kangaroo emu spear',
                    emoji: '🏹'
                },
                'Gatherer': {
                    statRequirements: { minPerception: 6, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'bush tucker seeds roots',
                    emoji: '🧺'
                },
                'Songline Keeper': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minReligiosity: 0.7 },
                    keywords: 'dreaming navigation',
                    emoji: '🎵',
                    frequency: 'uncommon' as const
                },
                'Firestick Farmer': {
                    statRequirements: { minPerception: 6, minIntelligence: 5 },
                    keywords: 'burning land management',
                    emoji: '🔥'
                },
                'Ngangkari': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8 },
                    keywords: 'healer spiritual',
                    emoji: '✨',
                    frequency: 'uncommon' as const
                },
                'Stone Knapper': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'tools flint',
                    emoji: '🪨'
                }
            },
            POLYNESIAN: {
                'Tapa Maker': {
                    statRequirements: { minDexterity: 6 },
                    genderBias: 'Female',
                    keywords: 'barkcloth',
                    emoji: '🪢'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'reef',
                    emoji: '🎣'
                },
                'Taro Farmer': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'cultivation',
                    emoji: '🍠'
                },
                'Coconut Harvester': {
                    statRequirements: { minDexterity: 6, minStrength: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'climbing',
                    emoji: '🥥'
                },
                'Kava Preparer': {
                    statRequirements: { minDexterity: 5 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'ceremonial',
                    emoji: '🥥'
                },
                'Dancer': {
                    statRequirements: { minDexterity: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.5 },
                    genderBias: 'Female',
                    keywords: 'storytelling',
                    emoji: '💃'
                },
                'Stone Carver': {
                    statRequirements: { minStrength: 6, minCraftiness: 8 },
                    socialRequirements: { maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'monuments',
                    emoji: '🗿'
                },
                'Pearl Diver': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'pearls',
                    emoji: '🦪'
                },
                'Kahuna Lapaʻau': {
                    statRequirements: { minIntelligence: 7, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'medicinal plants',
                    emoji: '🌿'
                }
            }
        },

        [HistoricalEra.MEDIEVAL]: {
            ABORIGINAL_AUSTRALIAN: {
                'Hunter': {
                    statRequirements: { minPerception: 7, minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'tracking kangaroo wallaby',
                    emoji: '🏹'
                },
                'Gatherer': {
                    statRequirements: { minPerception: 6, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'bush tucker yams',
                    emoji: '🧺'
                },
                'Songline Keeper': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minReligiosity: 0.7 },
                    keywords: 'dreaming country',
                    emoji: '🎵',
                    frequency: 'uncommon' as const
                },
                'Clever Person': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8 },
                    keywords: 'healer spiritual ngangkari',
                    emoji: '✨',
                    frequency: 'uncommon' as const
                },
                'Elder': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'law keeper ceremony',
                    emoji: '👴',
                    frequency: 'uncommon' as const
                },
                'Fisherman': {
                    statRequirements: { minDexterity: 6, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'coastal fish trap',
                    emoji: '🎣'
                }
            },
            POLYNESIAN_EXPANSION: {
                'Master Navigator': {
                    statRequirements: { minIntelligence: 8, minPerception: 8 },
                    socialRequirements: { minWanderlust: 0.8, minPrivilege: 0.6 },
                    keywords: 'stars',
                    emoji: '🧭'
                },
                'Warrior': {
                    statRequirements: { minStrength: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4, minAmbition: 0.6 },
                    genderBias: 'Male',
                    keywords: 'battle',
                    emoji: '🛡️'
                },
                'Maori Warrior': {
                    statRequirements: { minStrength: 7, minDexterity: 6, minConstitution: 6 },
                    socialRequirements: { minAmbition: 0.5, minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'mere taiaha haka',
                    emoji: '⚔️'
                },
                'Tattoo Artist': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'sacred',
                    emoji: '🎨'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'nets',
                    emoji: '🎣'
                },
                'Breadfruit Cultivator': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'orchards',
                    emoji: '🌳'
                },
                'Canoe Paddler': {
                    statRequirements: { minStrength: 6, minStamina: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'voyaging',
                    emoji: '🛶'
                },
                'Priest': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minReligiosity: 0.8, minPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'ritual',
                    emoji: '🌺'
                },
                'Tohunga': {
                    statRequirements: { minIntelligence: 7, minWisdom: 7 },
                    socialRequirements: { minReligiosity: 0.7, minPrivilege: 0.6 },
                    keywords: 'sacred healer priest medicine',
                    emoji: '🌿'
                },
                'Taulasea': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'traditional healer samoan medicine',
                    emoji: '🌴'
                },
                'Clever Woman': {
                    statRequirements: { minWisdom: 7, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.6 },
                    genderBias: 'Female',
                    keywords: 'aboriginal spiritual healer',
                    emoji: '✨'
                },
                'Bone Singer': {
                    statRequirements: { minPersuasion: 6, minWisdom: 6 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'healing chant song medicine',
                    emoji: '🎵'
                },
                'Kava Grower': {
                    statRequirements: { minConstitution: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'kava cultivation ceremony',
                    emoji: '🌿'
                },
                'Tapa Cloth Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Female',
                    keywords: 'tapa bark cloth beating',
                    emoji: '👘'
                },
                'Coconut Gatherer': {
                    statRequirements: { minStrength: 5, minDexterity: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'coconut climbing harvesting',
                    emoji: '🥥'
                },
                'Fish Trap Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'fishing traps weaving',
                    emoji: '🐟'
                },
                'Village Fisher': {
                    statRequirements: { minDexterity: 5, minPerception: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'fishing nets reef',
                    emoji: '🎣'
                },
                'Mat Weaver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'mat weaving pandanus',
                    emoji: '🧺'
                },
                'Pig Keeper': {
                    statRequirements: { minStrength: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'pigs livestock husbandry',
                    emoji: '🐷'
                },
                'Bush Medicine Woman': {
                    statRequirements: { minPerception: 7, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Female',
                    keywords: 'herbal specialist plants',
                    emoji: '🍃'
                }
            }
        },

        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            CONTACT: {
                'Interpreter': {
                    statRequirements: { minPersuasion: 5, minIntelligence: 5 },
                    keywords: 'pidgin',
                    emoji: '🏝️'
                },
                'Sandalwood Cutter': {
                    statRequirements: { minStrength: 6, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'SpiceHarvester',
                    emoji: '🌳'
                },
                'Trading Post Worker': {
                    statRequirements: { minPersuasion: 4, minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'exchange',
                    emoji: '🏪'
                },
                'Beche-de-mer Diver': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'diving',
                    emoji: '🌊'
                },
                'Ship Provisioner': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'supplies',
                    emoji: '🚢'
                },
                'Whaler': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { minWanderlust: 0.6 },
                    genderBias: 'Male',
                    keywords: 'hunting',
                    emoji: '🐋'
                },
                'Copra Worker': {
                    statRequirements: { minStrength: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'coconut drying copra',
                    emoji: '🥥'
                },
                'Mission Worker': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { minReligiosity: 0.5, maxPrivilege: 0.4 },
                    keywords: 'church labor convert',
                    emoji: '⛪'
                }
            }
        },

        [HistoricalEra.INDUSTRIAL_ERA]: {
            ABORIGINAL_COLONIAL: {
                'Stockman': {
                    statRequirements: { minDexterity: 6, minPerception: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'cattle station drover',
                    emoji: '🐄'
                },
                'Tracker': {
                    statRequirements: { minPerception: 8, minIntelligence: 6 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'police tracking bush',
                    emoji: '👣'
                },
                'Mission Worker': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'church labor mission',
                    emoji: '⛪'
                },
                'Domestic Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'household station',
                    emoji: '🧹'
                },
                'Station Hand': {
                    statRequirements: { minStrength: 5, minStamina: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'pastoral labor sheep',
                    emoji: '🐑'
                },
                'Pearl Diver': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'diving pearling lugger',
                    emoji: '🦪'
                },
                'Fringe Dweller': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.1 },
                    keywords: 'camp town edge displaced',
                    emoji: '🏕️'
                }
            },
            COLONIAL: {
                'Pearl Diver': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    keywords: 'underwater polynesian',
                    emoji: '🦪'
                },
                'Plantation Worker': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'copra',
                    emoji: '🥥'
                },
                'Indentured Labourer': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'contract',
                    emoji: '🌱'
                },
                'Trading Post Clerk': {
                    statRequirements: { minIntelligence: 4, minPersuasion: 4 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'commerce',
                    emoji: '📊'
                },
                'Mission Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.8, maxPrivilege: 0.5 },
                    keywords: 'conversion',
                    emoji: '📖'
                },
                'Native Constable': {
                    statRequirements: { minStrength: 5, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3, maxPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'enforcement',
                    emoji: '👮'
                },
                'Fisherman': {
                    statRequirements: { minStrength: 5, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'subsistence',
                    emoji: '🎣'
                },
                'Domestic Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'household',
                    emoji: '🧹'
                },
                'Village Chief': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5, minReligiosity: 0.5 },
                    genderBias: 'Male',
                    keywords: 'leadership',
                    emoji: '👑'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                         SUB-SAHARAN AFRICA                          */
    /* =================================================================== */
    SUB_SAHARAN_AFRICAN: {
        /* ------- PREHISTORY ------------------------------------------------ */
        [HistoricalEra.PREHISTORY]: {
            HUNTER_GATHERER: {
                'Hunter': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    keywords: 'tracking',
                    emoji: '🏹'
                },
                'Gatherer': {
                    statRequirements: { minDexterity: 5, minPerception: 6 },
                    genderBias: 'Female',
                    keywords: 'foraging',
                    emoji: '🌿'
                },
                'Spirit Medium': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.7 },
                    keywords: 'ancestors',
                    emoji: '👻'
                },
                'Rock Painter': {
                    statRequirements: { minDexterity: 6, minPerception: 7 },
                    keywords: 'ritual art',
                    emoji: '🎨'
                },
                'Honey Gatherer': {
                    statRequirements: { minDexterity: 6, minStamina: 5 },
                    keywords: 'climbing',
                    emoji: '🍯'
                },
                'Ishihori': {
                    statRequirements: { minDexterity: 4, minPerception: 3 },
                    genderBias: 'Male',
                    keywords: 'stone thrower',
                    emoji: '🪃'
                },
                'Fire Keeper': {
                    statRequirements: { minConstitution: 5, minPerception: 6 },
                    keywords: 'sacred flame',
                    emoji: '🔥'
                },
                'Sangoma': {
                    statRequirements: { minIntelligence: 6, minPerception: 6 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'traditional healing',
                    emoji: '🌿'
                }
            }
        },
        /* ------- ANTIQUITY ------------------------------------------------ */
        [HistoricalEra.ANTIQUITY]: {
            UPPER_CLASS: {
                'Chief': {
                    statRequirements: { minPersuasion: 7, minStrength: 5 },
                    socialRequirements: { minPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'leadership',
                    emoji: '👑'
                },
                'Rain Maker': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8 },
                    keywords: 'weather magic',
                    emoji: '🌧️'
                },
                'War Leader': {
                    statRequirements: { minStrength: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '⚔️'
                }
            },
            CRAFTSPEOPLE: {
                'Iron Smelter': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    keywords: 'metallurgy',
                    emoji: '🔨'
                },
                'Potter': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Ivory Carver': {
                    statRequirements: { minDexterity: 8, minPerception: 7 },
                    keywords: 'luxury',
                    emoji: '🦣'
                },
                'Salt Trader': {
                    statRequirements: { minPersuasion: 6, minStamina: 5 },
                    keywords: 'trans-saharan',
                    emoji: '🧂'
                },
                'Mganga': {
                    statRequirements: { minIntelligence: 6, minWisdom: 6 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'traditional medicine healer',
                    emoji: '🌿'
                },
                'Bone Setter': {
                    statRequirements: { minStrength: 5, minDexterity: 6 },
                    keywords: 'fractures orthopedist',
                    emoji: '🦴'
                },
                'Snake Doctor': {
                    statRequirements: { minPerception: 7, minDexterity: 6 },
                    keywords: 'venom antivenom bites',
                    emoji: '🐍'
                },
                'Birth Attendant': {
                    statRequirements: { minWisdom: 6, minDexterity: 5 },
                    genderBias: 'Female',
                    keywords: 'midwife birthing',
                    emoji: '👶'
                }
            },
            COMMONERS: {
                'Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    keywords: 'agriculture',
                    emoji: '🌾'
                },
                'Cattle Herder': {
                    statRequirements: { minStamina: 5, minPerception: 5 },
                    keywords: 'pastoralist',
                    emoji: '🐄'
                },
                'Village Elder': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'wisdom',
                    emoji: '👴🏿'
                },
                'Medicine Woman': {
                    statRequirements: { minIntelligence: 6, minPerception: 5 },
                    socialRequirements: { minReligiosity: 0.4 },
                    genderBias: 'Female',
                    keywords: 'herbal remedies',
                    emoji: '🌿'
                }
            }
        },
        /* ------- MEDIEVAL ------------------------------------------------- */
        [HistoricalEra.MEDIEVAL]: {
            UPPER_CLASS: {
                'King': {
                    statRequirements: { minPersuasion: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Male',
                    keywords: 'royalty',
                    emoji: '👑',
                    frequency: 'very_rare' as const
                },
                'Queen Mother': {
                    statRequirements: { minPersuasion: 7, minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.9 },
                    genderBias: 'Female',
                    keywords: 'matriarch',
                    emoji: '👸🏿',
                    frequency: 'very_rare' as const
                },
                'Griot': {
                    statRequirements: { minIntelligence: 8, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'historian storyteller',
                    emoji: '🎭'
                },
                'Islamic Scholar': {
                    statRequirements: { minIntelligence: 8, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.8 },
                    keywords: 'madrasa',
                    emoji: '📖'
                }
            },
            Craftspeople: {
                'Gold Trader': {
                    statRequirements: { minPersuasion: 7, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'trans-saharan wealth',
                    emoji: '🪙'
                },
                'Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    keywords: 'sacred craft',
                    emoji: '⚒️'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    keywords: 'kente cloth',
                    emoji: '🧵'
                },
                'Caravan Guide': {
                    statRequirements: { minStamina: 7, minPerception: 7 },
                    keywords: 'desert navigation',
                    emoji: '🐪'
                }
            },
            Commoners: {
                'Millet Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    keywords: 'subsistence',
                    emoji: '🌾'
                },
                'Goat Herder': {
                    statRequirements: { minStamina: 5, minPerception: 5 },
                    keywords: 'pastoralist',
                    emoji: '🐐'
                },
                'Diviner': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'fortune telling',
                    emoji: '🔮'
                }
            }
        },
        /* ------- RENAISSANCE / EARLY MODERN ------------------------------- */
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            UPPER_CLASS: {
                'Sultan': {
                    statRequirements: { minPersuasion: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Male',
                    keywords: 'islamic ruler',
                    emoji: '👳🏿',
                    frequency: 'very_rare' as const
                },
                'Oba': {
                    statRequirements: { minPersuasion: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Male',
                    keywords: 'yoruba king',
                    emoji: '👑',
                    frequency: 'very_rare' as const
                },
                'Portuguese Factor': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'slave trade',
                    emoji: '⚓'
                }
            },
            MILITARY: {
                'Zulu Warrior': {
                    statRequirements: { minStrength: 8, minDexterity: 7, minConstitution: 8 },
                    socialRequirements: { minAmbition: 0.6 },
                    genderBias: 'Male',
                    keywords: 'iklwa assegai shield',
                    emoji: '⚔️',
                    frequency: 'rare' as const
                }
            },
            CRAFTSPEOPLE: {
                'Slave Trader': {
                    statRequirements: { minPersuasion: 5, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'atlantic trade',
                    emoji: '⛓️'
                },
                'Brass Caster': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    keywords: 'benin bronze',
                    emoji: '🗿'
                },
                'Musket Bearer': {
                    statRequirements: { minStrength: 6, minDexterity: 5 },
                    genderBias: 'Male',
                    keywords: 'firearms',
                    emoji: '🔫'
                },
                'Cowrie Counter': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    keywords: 'currency',
                    emoji: '🐚'
                }
            },
            COMMONERS: {
                'Rice Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    keywords: 'wetland agriculture',
                    emoji: '🌾'
                },
                'Palm Wine Tapper': {
                    statRequirements: { minDexterity: 6, minStamina: 5 },
                    keywords: 'tree climbing',
                    emoji: '🌴'
                },
                'War Captive': {
                    statRequirements: { minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.1 },
                    keywords: 'enslaved',
                    emoji: '⛓️'
                }
            }
        },
        /* ------- INDUSTRIAL ERA ------------------------------------------- */
        [HistoricalEra.INDUSTRIAL_ERA]: {
            UPPER_CLASS: {
                'Colonial Governor': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.9 },
                    genderBias: 'Male',
                    keywords: 'european rule',
                    emoji: '🎩',
                    frequency: 'very_rare' as const
                },
                'Paramount Chief': {
                    statRequirements: { minPersuasion: 7, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'indirect rule',
                    emoji: '👑',
                    frequency: 'rare' as const
                },
                'Missionary': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minReligiosity: 0.8 },
                    keywords: 'christianization',
                    emoji: '✝️',
                    frequency: 'uncommon' as const
                },
                'European Trader': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'trading post factory',
                    emoji: '🏪',
                    frequency: 'uncommon' as const
                }
            },
            EDUCATED_CLASS: {
                'Court Interpreter': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    keywords: 'colonial administration translator',
                    emoji: '🗣️'
                },
                'Mission Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    keywords: 'education school',
                    emoji: '📚'
                },
                'Catechist': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'church teaching',
                    emoji: '📖'
                },
                'Clerk': {
                    statRequirements: { minIntelligence: 5, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'office colonial administration',
                    emoji: '📋'
                }
            },
            MERCHANT_CLASS: {
                'Groundnut Trader': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.3 },
                    keywords: 'peanut export trade',
                    emoji: '🥜'
                },
                'Palm Oil Trader': {
                    statRequirements: { minPersuasion: 5, minCraftiness: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'oil trade',
                    emoji: '🛢️'
                },
                'Cloth Trader': {
                    statRequirements: { minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'textile trade',
                    emoji: '🧵'
                },
                'Market Woman': {
                    statRequirements: { minPersuasion: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Female',
                    keywords: 'market trade',
                    emoji: '🛒'
                }
            },
            TRADITIONAL_PROFESSIONS: {
                'Traditional Healer': {
                    statRequirements: { minIntelligence: 6, minPerception: 5 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'medicine herbs',
                    emoji: '🌿'
                },
                'Blacksmith': {
                    statRequirements: { minStrength: 6, minCraftiness: 7 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'metal sacred craft',
                    emoji: '⚒️'
                },
                'Weaver': {
                    statRequirements: { minDexterity: 6, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'kente cloth',
                    emoji: '🧶'
                },
                'Griot': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'storyteller historian',
                    emoji: '🎭'
                },
                'Diviner': {
                    statRequirements: { minPerception: 6, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.6 },
                    keywords: 'fortune spiritual',
                    emoji: '🔮'
                }
            },
            WORKING_CLASS: {
                'Railway Worker': {
                    statRequirements: { minStrength: 6, minStamina: 6 },
                    genderBias: 'Male',
                    keywords: 'infrastructure construction',
                    emoji: '🚂'
                },
                'Mine Worker': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    genderBias: 'Male',
                    keywords: 'gold diamonds copper',
                    emoji: '⛏️'
                },
                'Porter': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    keywords: 'head carrying caravan',
                    emoji: '🎒'
                },
                'Plantation Worker': {
                    statRequirements: { minStamina: 6, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'rubber cocoa sisal',
                    emoji: '🌴'
                },
                'Dock Worker': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'cargo port',
                    emoji: '⚓'
                }
            },
            RURAL: {
                'Cash Crop Farmer': {
                    statRequirements: { minStamina: 5, minCraftiness: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'cocoa coffee groundnut',
                    emoji: '☕'
                },
                'Subsistence Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'millet cassava yam',
                    emoji: '🌾'
                },
                'Cattle Herder': {
                    statRequirements: { minPerception: 5, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'pastoralist fulani',
                    emoji: '🐄'
                },
                'Palm Wine Tapper': {
                    statRequirements: { minDexterity: 6, minStamina: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'tree climbing palm',
                    emoji: '🌴'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    },

    /* =================================================================== */
    /*                          SOUTH AMERICA                              */
    /* =================================================================== */
    SOUTH_AMERICAN: {
        /* ------- PREHISTORY ------------------------------------------------ */
        [HistoricalEra.PREHISTORY]: {
            HUNTER_GATHERER: {
                'Hunter': {
                    statRequirements: { minStrength: 5, minPerception: 6 },
                    keywords: 'tracking',
                    emoji: '🏹'
                },
                'Gatherer': {
                    statRequirements: { minDexterity: 5, minPerception: 6 },
                    genderBias: 'Female',
                    keywords: 'foraging',
                    emoji: '🌿'
                },
                'Shaman': {
                    statRequirements: { minIntelligence: 5, minPersuasion: 5 },
                    socialRequirements: { minReligiosity: 0.7 },
                    keywords: 'ayahuasca',
                    emoji: '🍄'
                },
                'Poison Maker': {
                    statRequirements: { minIntelligence: 6, minDexterity: 6 },
                    keywords: 'curare darts',
                    emoji: '☠️'
                },
                'Canoe Carver': {
                    statRequirements: { minStrength: 5, minCraftiness: 7 },
                    keywords: 'river transport',
                    emoji: '🛶'
                },
                'Feather Worker': {
                    statRequirements: { minDexterity: 7, minPerception: 6 },
                    keywords: 'ritual adornment',
                    emoji: '🦜'
                }
            }
        },
        /* ------- ANTIQUITY ------------------------------------------------ */
        [HistoricalEra.ANTIQUITY]: {
            UPPER_CLASS: {
                'Priest-King': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.9, minReligiosity: 0.8 },
                    genderBias: 'Male',
                    keywords: 'theocracy',
                    emoji: '👑',
                    frequency: 'very_rare' as const
                },
                'Oracle': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.9 },
                    keywords: 'divination',
                    emoji: '🔮'
                },
                'War Chief': {
                    statRequirements: { minStrength: 7, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.7 },
                    genderBias: 'Male',
                    keywords: 'military',
                    emoji: '⚔️',
                    frequency: 'rare' as const
                }
            },
            CRAFTSPEOPLE: {
                'Gold Worker': {
                    statRequirements: { minDexterity: 8, minCraftiness: 7 },
                    keywords: 'metallurgy',
                    emoji: '🪙'
                },
                'Textile Weaver': {
                    statRequirements: { minDexterity: 7, minCraftiness: 6 },
                    genderBias: 'Female',
                    keywords: 'cotton wool',
                    emoji: '🧵'
                },
                'Pottery Maker': {
                    statRequirements: { minDexterity: 6, minCraftiness: 6 },
                    keywords: 'ceramics',
                    emoji: '🏺'
                },
                'Coca Cultivator': {
                    statRequirements: { minStamina: 5, minPerception: 5 },
                    keywords: 'sacred plant',
                    emoji: '🍃'
                }
            },
            MILITARY: {
                'Amazon Warrior': {
                    statRequirements: { minStrength: 6, minDexterity: 7, minConstitution: 6 },
                    socialRequirements: { minAmbition: 0.5 },
                    genderBias: 'Female',
                    keywords: 'blowgun ranged warrior',
                    emoji: '🏹',
                    frequency: 'rare' as const
                }
            },
            COMMONERS: {
                'Maize Farmer': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    keywords: 'agriculture',
                    emoji: '🌽'
                },
                'Llama Herder': {
                    statRequirements: { minStamina: 5, minPerception: 5 },
                    keywords: 'camelids',
                    emoji: '🦙'
                },
                'Fisherman': {
                    statRequirements: { minDexterity: 5, minPerception: 5 },
                    keywords: 'coastal',
                    emoji: '🎣'
                }
            }
        },
        /* ------- MEDIEVAL ------------------------------------------------- */
        [HistoricalEra.MEDIEVAL]: {
            UPPER_CLASS: {
                'Sapa Inca': {
                    statRequirements: { minIntelligence: 8, minPersuasion: 8 },
                    socialRequirements: { minPrivilege: 1.0 },
                    genderBias: 'Male',
                    keywords: 'divine ruler',
                    emoji: '👑',
                    frequency: 'very_rare' as const
                },
                'Coya': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Female',
                    keywords: 'queen',
                    emoji: '👸',
                    frequency: 'very_rare' as const
                },
                'High Priest': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.9 },
                    keywords: 'sun temple',
                    emoji: '☀️',
                    frequency: 'rare' as const
                },
                'Curaca': {
                    statRequirements: { minPersuasion: 6, minIntelligence: 5 },
                    socialRequirements: { minPrivilege: 0.7 },
                    keywords: 'local lord',
                    emoji: '🎖️'
                }
            },
            CRAFTSPEOPLE: {
                'Quipu Keeper': {
                    statRequirements: { minIntelligence: 8, minDexterity: 7 },
                    keywords: 'record keeping',
                    emoji: '🪢'
                },
                'Master Builder': {
                    statRequirements: { minIntelligence: 7, minStrength: 6 },
                    keywords: 'stone architecture',
                    emoji: '🏗️'
                },
                'Chasqui Runner': {
                    statRequirements: { minStamina: 9, minConstitution: 7 },
                    keywords: 'messenger',
                    emoji: '🏃'
                },
                'Metalsmith': {
                    statRequirements: { minDexterity: 7, minCraftiness: 7 },
                    keywords: 'bronze silver',
                    emoji: '🔨'
                }
            },
            MILITARY: {
                'Inca Slinger': {
                    statRequirements: { minDexterity: 7, minPerception: 6, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.4 },
                    genderBias: 'Male',
                    keywords: 'sling lead bullet ranged',
                    emoji: '🪃'
                }
            },
            COMMONERS: {
                'Terrace Farmer': {
                    statRequirements: { minStamina: 6, minConstitution: 5 },
                    keywords: 'mountain agriculture',
                    emoji: '⛰️'
                },
                'Ayllu Member': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    keywords: 'community',
                    emoji: '👥'
                },
                'Mita Worker': {
                    statRequirements: { minStamina: 6, minConstitution: 6 },
                    keywords: 'labor tax',
                    emoji: '⚒️'
                }
            }
        },
        /* ------- RENAISSANCE / EARLY MODERN ------------------------------- */
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            UPPER_CLASS: {
                'Spanish Viceroy': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Male',
                    keywords: 'colonial ruler',
                    emoji: '👑'
                },
                'Encomendero': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'land grant',
                    emoji: '🏛️'
                },
                'Bishop': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minReligiosity: 0.9 },
                    genderBias: 'Male',
                    keywords: 'catholic church',
                    emoji: '✝️'
                }
            },
            CRAFTSPEOPLE: {
                'Silver Miner': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    genderBias: 'Male',
                    keywords: 'potosi',
                    emoji: '⛏️'
                },
                'Mestizo Trader': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 6 },
                    keywords: 'mixed heritage',
                    emoji: '🤝'
                },
                'Mission Indian': {
                    statRequirements: { minStamina: 5, minConstitution: 5 },
                    socialRequirements: { minReligiosity: 0.5 },
                    keywords: 'reduction',
                    emoji: '⛪'
                },
                'Muleteer': {
                    statRequirements: { minStamina: 6, minPerception: 5 },
                    keywords: 'transport',
                    emoji: '🫏'
                }
            },
            COMMONERS: {
                'Hacienda Peon': {
                    statRequirements: { minStamina: 6, minConstitution: 5 },
                    keywords: 'estate labor',
                    emoji: '🌾'
                },
                'Coca Chewer': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    keywords: 'mine worker',
                    emoji: '🍃'
                },
                'Market Woman': {
                    statRequirements: { minPersuasion: 5, minStamina: 5 },
                    genderBias: 'Female',
                    keywords: 'chola',
                    emoji: '🧺'
                }
            }
        },
        /* ------- INDUSTRIAL ERA ------------------------------------------- */
        [HistoricalEra.INDUSTRIAL_ERA]: {
            UPPER_CLASS: {
                'President': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 8 },
                    socialRequirements: { minPrivilege: 0.9 },
                    genderBias: 'Male',
                    keywords: 'republic',
                    emoji: '🎖️'
                },
                'Landowner': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 6 },
                    socialRequirements: { minPrivilege: 0.85 },
                    keywords: 'latifundio',
                    emoji: '🏛️'
                },
                'British Engineer': {
                    statRequirements: { minIntelligence: 7, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Male',
                    keywords: 'railway',
                    emoji: '🚂'
                }
            },
            MIDDLE_CLASS: {
                'Nitrate Worker': {
                    statRequirements: { minStrength: 6, minStamina: 6 },
                    genderBias: 'Male',
                    keywords: 'saltpeter',
                    emoji: '🧂'
                },
                'Rubber Tapper': {
                    statRequirements: { minStamina: 7, minDexterity: 6 },
                    genderBias: 'Male',
                    keywords: 'amazon boom',
                    emoji: '🌳'
                },
                'Coffee Planter': {
                    statRequirements: { minStamina: 5, minCraftiness: 5 },
                    keywords: 'export crop',
                    emoji: '☕'
                },
                'Telegraph Operator': {
                    statRequirements: { minIntelligence: 6, minDexterity: 6 },
                    keywords: 'communications',
                    emoji: '📡'
                },
                'Gaucho': {
                    statRequirements: { minDexterity: 7, minStrength: 6, minPerception: 6 },
                    socialRequirements: { minWanderlust: 0.5 },
                    genderBias: 'Male',
                    keywords: 'pampas bolas horseman',
                    emoji: '🤠'
                }
            },
            LOWER_CLASS: {
                'Guano Digger': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    genderBias: 'Male',
                    keywords: 'fertilizer',
                    emoji: '🦤'
                },
                'Canal Worker': {
                    statRequirements: { minStrength: 7, minStamina: 7 },
                    genderBias: 'Male',
                    keywords: 'panama',
                    emoji: '🚧'
                },
                'Indigenous Laborer': {
                    statRequirements: { minStamina: 6, minConstitution: 5 },
                    keywords: 'exploitation',
                    emoji: '⛏️'
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: SHARED_MODERN_PROFESSIONS,
        [HistoricalEra.FUTURE_ERA]: SHARED_FUTURE_PROFESSIONS
    }
};