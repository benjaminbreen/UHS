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
            emoji: '💼'
        },
        'Politician': {
            statRequirements: { minPersuasion: 8, minIntelligence: 6, minCraftiness: 7 },
            socialRequirements: { minPrivilege: 0.7, minAmbition: 0.9 },
            keywords: 'government power statecraft',
            emoji: '🗳️'
        },
        'Surgeon': {
            statRequirements: { minIntelligence: 8, minDexterity: 9, minStamina: 6 },
            socialRequirements: { minPrivilege: 0.8 },
            keywords: 'medicine specialist hospital',
            emoji: '⚕️'
        },
        'Judge': {
            statRequirements: { minIntelligence: 8, minPersuasion: 6 },
            socialRequirements: { minPrivilege: 0.8 },
            keywords: 'law justice court',
            emoji: '⚖️'
        },
        'Bank President': {
            statRequirements: { minIntelligence: 8, minCraftiness: 7 },
            socialRequirements: { minPrivilege: 0.85, minAmbition: 0.7 },
            keywords: 'finance capital money',
            emoji: '🏦'
        },
        'University Professor': {
            statRequirements: { minIntelligence: 9, minPersuasion: 6 },
            socialRequirements: { minPrivilege: 0.7 },
            keywords: 'academia research education',
            emoji: '🎓'
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
            emoji: '🚬'
        },
        'Drug Dealer': {
            statRequirements: { minCraftiness: 3, minPersuasion: 3 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'narcotics illegal trade',
            emoji: '💊'
        },
        'Pickpocket': {
            statRequirements: { minDexterity: 4, minPerception: 3 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'street crime theft',
            emoji: '👤'
        },
        'Black Panther': {
            statRequirements: { minStrength: 3, minPersuasion: 4 },
            socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.6 },
            keywords: 'revolutionary militant',
            emoji: '✊'
        },
        'IRA Member': {
            statRequirements: { minCraftiness: 3, minConstitution: 3 },
            socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.6 },
            keywords: 'irish republican army',
            emoji: '☘️'
        },
        'Red Brigade': {
            statRequirements: { minIntelligence: 3, minCraftiness: 3 },
            socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.6 },
            keywords: 'communist militant',
            emoji: '⭐'
        },
        'Guerrilla Fighter': {
            statRequirements: { minStamina: 3, minCraftiness: 3 },
            socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.5 },
            keywords: 'insurgent rebel',
            emoji: '🔫'
        },
        'Smuggler': {
            statRequirements: { minCraftiness: 4, minPersuasion: 2 },
            socialRequirements: { maxPrivilege: 0.4, minWanderlust: 0.5 },
            keywords: 'contraband illegal trade',
            emoji: '📦'
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
        'Antifa Member': {
            statRequirements: { minStamina: 3, minPersuasion: 3 },
            socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.5 },
            keywords: 'anti-fascist activist',
            emoji: '🏴'
        },
        'ISIS Fighter': {
            statRequirements: { minConstitution: 3, minCraftiness: 2 },
            socialRequirements: { maxPrivilege: 0.3, minReligiosity: 0.7 },
            genderBias: 'Male',
            keywords: 'extremist militant',
            emoji: '⚔️'
        },
        'Climate Activist': {
            statRequirements: { minPersuasion: 3, minStamina: 2 },
            socialRequirements: { maxPrivilege: 0.5, minAmbition: 0.5 },
            keywords: 'environmental protest',
            emoji: '🌍'
        },
        'BLM Activist': {
            statRequirements: { minPersuasion: 3, minStamina: 3 },
            socialRequirements: { maxPrivilege: 0.4, minAmbition: 0.5 },
            keywords: 'racial justice',
            emoji: '✊'
        },
        'Proud Boy': {
            statRequirements: { minStrength: 3, minCraftiness: 2 },
            socialRequirements: { maxPrivilege: 0.5 },
            genderBias: 'Male',
            keywords: 'far-right militant',
            emoji: '🚩'
        },
        'Anonymous Hacker': {
            statRequirements: { minIntelligence: 5, minCraftiness: 4 },
            socialRequirements: { maxPrivilege: 0.5, minWanderlust: 0.5 },
            keywords: 'hacktivist collective',
            emoji: '🎭'
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
                    emoji: '🗡️'
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
                    emoji: '🔮'
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
                    keywords: 'chivalry',
                    emoji: '⚔️'
                },
                'Squire': {
                    statRequirements: { minStrength: 5, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.4 },
                    genderBias: 'Male',
                    keywords: 'training',
                    emoji: '🛡️'
                },
                'Lady': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { minPrivilege: 0.6 },
                    genderBias: 'Female',
                    keywords: 'noble',
                    emoji: '👸'
                },
                'Page': {
                    statRequirements: { minDexterity: 4 },
                    socialRequirements: { minPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'service',
                    emoji: '👦'
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
                    nameKey: 'JAPANESE'
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
                    nameKey: 'JAPANESE'
                },
                'Temple Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { minReligiosity: 0.5, maxPrivilege: 0.3 },
                    keywords: 'maintenance',
                    emoji: '🧹'
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
                'Courier': {
                    statRequirements: { minStamina: 6, minDexterity: 5 },
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
                    emoji: '⚔️'
                },
                'Yakuza': {
                    statRequirements: { minStrength: 3, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.4 },
                    genderBias: 'Male',
                    keywords: 'organized crime',
                    emoji: '🐉'
                },
                'Opium Smuggler': {
                    statRequirements: { minCraftiness: 4, minPersuasion: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minWanderlust: 0.5 },
                    keywords: 'illegal trade',
                    emoji: '🚬'
                },
                'Triad Member': {
                    statRequirements: { minStrength: 2, minCraftiness: 3 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    genderBias: 'Male',
                    keywords: 'secret society',
                    emoji: '🔺'
                },
                'Boxer Rebel': {
                    statRequirements: { minStrength: 3, minStamina: 3 },
                    socialRequirements: { maxPrivilege: 0.3, minAmbition: 0.5 },
                    genderBias: 'Male',
                    keywords: 'anti-foreign',
                    emoji: '👊'
                },
                'Taiping Soldier': {
                    statRequirements: { minConstitution: 3, minPersuasion: 2 },
                    socialRequirements: { maxPrivilege: 0.3, minReligiosity: 0.5 },
                    keywords: 'heavenly kingdom',
                    emoji: '✝️'
                },
                'Black Flag Fighter': {
                    statRequirements: { minStrength: 3, minCraftiness: 2 },
                    socialRequirements: { maxPrivilege: 0.2, minAmbition: 0.5 },
                    keywords: 'anti-colonial',
                    emoji: '🏴'
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
                'Warrior': {
                    statRequirements: { minStrength: 6, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'dharma',
                    emoji: '⚔️'
                },
                'Chariot Driver': {
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
                    keywords: 'monsoon',
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
                    keywords: 'legal',
                    emoji: '⚖️'
                },
                'Doctor': {
                    statRequirements: { minIntelligence: 7, minDexterity: 5 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'medicine',
                    emoji: '👨‍⚕️'
                },
                'Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    keywords: 'education',
                    emoji: '📰'
                },
                'Journalist': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minAmbition: 0.4 },
                    keywords: 'press',
                    emoji: '📰'
                }
            },
            WORKING_CLASS: {
                'Mill Worker': {
                    statRequirements: { minDexterity: 5, minConstitution: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'textile',
                    emoji: '🏭'
                },
                'Tea Picker': {
                    statRequirements: { minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    keywords: 'plantation',
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
                    keywords: 'cargo',
                    emoji: '⚓'
                },
                'Domestic Servant': {
                    statRequirements: { minStamina: 4 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Female',
                    keywords: 'household',
                    emoji: '🧹'
                },
                'Street Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'selling',
                    emoji: '🛒'
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
            URBAN: {
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
                    keywords: 'journalism',
                    emoji: '📰'
                },
                'Banker': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 6 },
                    socialRequirements: { minPrivilege: 0.5 },
                    keywords: 'finance',
                    emoji: '🏦'
                },
                'Translator': {
                    statRequirements: { minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.4 },
                    keywords: 'languages',
                    emoji: '📚'
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
                    keywords: 'excavation',
                    emoji: '⛏️'
                },
                'Dock Worker': {
                    statRequirements: { minStrength: 7, minConstitution: 6 },
                    socialRequirements: { maxPrivilege: 0.2 },
                    genderBias: 'Male',
                    keywords: 'cargo',
                    emoji: '⚓'
                },
                'Street Vendor': {
                    statRequirements: { minPersuasion: 5 },
                    socialRequirements: { maxPrivilege: 0.3 },
                    keywords: 'selling',
                    emoji: '🛒'
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
                'Fish Weir Builder': {
                    statRequirements: { minCraftiness: 6, minIntelligence: 5 },
                    socialRequirements: { maxPrivilege: 0.4 },
                    keywords: 'fishing',
                    emoji: '🎣'
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
            ISLAND_SETTLERS: {
                'Navigator': {
                    statRequirements: { minPerception: 7, minIntelligence: 5 },
                    socialRequirements: { minWanderlust: 0.8 },
                    keywords: 'seafaring',
                    emoji: '🌊'
                },
                'Fisher': {
                    statRequirements: { minDexterity: 6, minStamina: 5 },
                    keywords: 'ocean',
                    emoji: '🎣'
                },
                'Canoe Builder': {
                    statRequirements: { minStrength: 5, minCraftiness: 6 },
                    socialRequirements: { maxPrivilege: 0.5 },
                    genderBias: 'Male',
                    keywords: 'boats',
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
                    keywords: 'traditional healing',
                    emoji: '🌿'
                }
            }
        },

        [HistoricalEra.ANTIQUITY]: {
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
                }
            }
        },

        [HistoricalEra.INDUSTRIAL_ERA]: {
            COLONIAL: {
                'Pearl Diver': {
                    statRequirements: { minStamina: 7, minConstitution: 6 },
                    keywords: 'underwater',
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
                    emoji: '👑'
                },
                'Queen Mother': {
                    statRequirements: { minPersuasion: 7, minIntelligence: 7 },
                    socialRequirements: { minPrivilege: 0.9 },
                    genderBias: 'Female',
                    keywords: 'matriarch',
                    emoji: '👸🏿'
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
                    emoji: '👳🏿'
                },
                'Oba': {
                    statRequirements: { minPersuasion: 8, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Male',
                    keywords: 'yoruba king',
                    emoji: '👑'
                },
                'Portuguese Factor': {
                    statRequirements: { minPersuasion: 6, minCraftiness: 7 },
                    socialRequirements: { minPrivilege: 0.6 },
                    keywords: 'slave trade',
                    emoji: '⚓'
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
                    emoji: '🎩'
                },
                'Paramount Chief': {
                    statRequirements: { minPersuasion: 7, minIntelligence: 6 },
                    socialRequirements: { minPrivilege: 0.8 },
                    genderBias: 'Male',
                    keywords: 'indirect rule',
                    emoji: '👑'
                },
                'Missionary': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 7 },
                    socialRequirements: { minReligiosity: 0.8 },
                    keywords: 'christianization',
                    emoji: '✝️'
                }
            },
            MIDDLE_CLASS: {
                'Court Interpreter': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    keywords: 'colonial administration',
                    emoji: '🗣️'
                },
                'Railway Worker': {
                    statRequirements: { minStrength: 6, minStamina: 6 },
                    genderBias: 'Male',
                    keywords: 'infrastructure',
                    emoji: '🚂'
                },
                'Mission Teacher': {
                    statRequirements: { minIntelligence: 6, minPersuasion: 5 },
                    keywords: 'education',
                    emoji: '📚'
                },
                'Cash Crop Farmer': {
                    statRequirements: { minStamina: 5, minCraftiness: 5 },
                    keywords: 'cocoa coffee',
                    emoji: '☕'
                }
            },
            LOWER_CLASS: {
                'Mine Worker': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    genderBias: 'Male',
                    keywords: 'gold diamonds',
                    emoji: '⛏️'
                },
                'Porter': {
                    statRequirements: { minStrength: 6, minStamina: 7 },
                    keywords: 'head carrying',
                    emoji: '🎒'
                },
                'Hut Tax Payer': {
                    statRequirements: { minStamina: 5 },
                    keywords: 'colonial subject',
                    emoji: '🛖'
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
                    emoji: '👑'
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
                    emoji: '⚔️'
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
                    emoji: '👑'
                },
                'Coya': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 7 },
                    socialRequirements: { minPrivilege: 0.95 },
                    genderBias: 'Female',
                    keywords: 'queen',
                    emoji: '👸'
                },
                'High Priest': {
                    statRequirements: { minIntelligence: 7, minPersuasion: 6 },
                    socialRequirements: { minReligiosity: 0.9 },
                    keywords: 'sun temple',
                    emoji: '☀️'
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