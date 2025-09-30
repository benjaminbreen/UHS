/**
 * System for generating and managing named elites associated with palaces and holy sites
 */
import { NpcEntity } from '../types/npcTypes';
import { CulturalZone, HistoricalEra, FactionData } from '../types';
import { Point } from '../types';
import { FACTION_DATA } from '../constants/gameData/factions';
import { generateHistoricalName } from '../constants/characterData/names';
import { generateBaseProfile } from '../generation/common/npcUtils';
import { ValueNoise } from '../utils/noise';

export interface BuildingElite {
    id: string;
    name: string;
    title: string;
    buildingId: string;
    buildingType: 'palace' | 'holy_place' | 'fortress';
    religion?: string;
    socialClass: 'nobility' | 'clergy' | 'royalty' | 'military_officer';
    personality: 'arrogant' | 'stern' | 'pious' | 'regal' | 'intimidating';
    culturalZone: CulturalZone;
    era: HistoricalEra;
    respectThreshold: number; // How much deference they expect
    dialogueStyle: 'aggressive' | 'condescending' | 'imperious';
    // ✅ NEW: Store rich profile data for sophisticated rendering
    profileData?: {
        appearance: any;
        stats: any;
        gender: 'male' | 'female';
        age: number;
        portraitSeed?: number;
    };
}

/**
 * Generate culturally appropriate titles for building elites using faction data court roles
 */
function generateTitle(
    buildingType: 'palace' | 'holy_place' | 'fortress',
    religion: string | undefined,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    region?: string,
    factionData?: FactionData
): string {
    // First try to use court roles from faction data if available
    if (factionData?.courtRoles) {
        const structureType = buildingType === 'palace' ? 'palace' : 
                            buildingType === 'fortress' ? 'military' : 'holy_site';
        const courtRoles = factionData.courtRoles[structureType];
        if (courtRoles && courtRoles.length > 0) {
            // Use the highest rank court role (first in list)
            return courtRoles[0];
        }
    }
    
    // Fallback to default title generation logic
    if (buildingType === 'palace') {
        // Political/Noble titles
        switch (culturalZone) {
            case 'EUROPE':
                if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
                    return Math.random() > 0.5 ? 'Lord' : Math.random() > 0.5 ? 'Count' : 'Baron';
                } else if (era === 'ANTIQUITY') {
                    return Math.random() > 0.5 ? 'Consul' : 'Patrician';
                } else {
                    return Math.random() > 0.5 ? 'Duke' : 'Marquis';
                }
            case 'MENA':
                if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
                    return Math.random() > 0.5 ? 'Sultan' : Math.random() > 0.5 ? 'Emir' : 'Vizier';
                } else if (era === 'ANTIQUITY') {
                    return Math.random() > 0.5 ? 'Satrap' : 'Governor';
                } else {
                    return Math.random() > 0.5 ? 'Pasha' : 'Bey';
                }
            case 'EAST_ASIA':
                return Math.random() > 0.5 ? 'Daimyo' : Math.random() > 0.5 ? 'Mandarin' : 'Shogun';
            case 'SOUTH_ASIA':
                return Math.random() > 0.5 ? 'Raja' : Math.random() > 0.5 ? 'Maharaja' : 'Nawab';
            case 'AFRICA':
                return Math.random() > 0.5 ? 'King' : Math.random() > 0.5 ? 'Chief' : 'Elder';
            case 'AMERICAS':
                return Math.random() > 0.5 ? 'Cacique' : 'Chief';
            default:
                return 'Lord';
        }
    } else if (buildingType === 'fortress') {
        // Military titles
        switch (culturalZone) {
            case 'EUROPE':
                if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
                    return Math.random() > 0.5 ? 'Knight Commander' : Math.random() > 0.5 ? 'Captain' : 'Fortress Captain';
                } else if (era === 'ANTIQUITY') {
                    return Math.random() > 0.5 ? 'Centurion' : 'Tribune';
                } else if (era === 'INDUSTRIAL_ERA') {
                    return Math.random() > 0.5 ? 'Colonel' : 'Major';
                } else {
                    return Math.random() > 0.5 ? 'Commander' : 'Base Commander';
                }
            case 'MENA':
                if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
                    return Math.random() > 0.5 ? 'Qaid' : Math.random() > 0.5 ? 'Janissary Commander' : 'Garrison Chief';
                } else if (era === 'ANTIQUITY') {
                    return Math.random() > 0.5 ? 'Garrison Chief' : 'Satrap Guard';
                } else {
                    return Math.random() > 0.5 ? 'Military Commander' : 'Colonel';
                }
            case 'EAST_ASIA':
                if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
                    return Math.random() > 0.5 ? 'Samurai Commander' : Math.random() > 0.5 ? 'Fortress Magistrate' : 'Garrison General';
                } else if (era === 'ANTIQUITY') {
                    return Math.random() > 0.5 ? 'Garrison General' : 'Military Governor';
                } else {
                    return Math.random() > 0.5 ? 'Colonel' : 'Base Commander';
                }
            case 'SOUTH_ASIA':
                if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
                    return Math.random() > 0.5 ? 'Rajput Captain' : Math.random() > 0.5 ? 'Mughal Commander' : 'Fort Commander';
                } else if (era === 'ANTIQUITY') {
                    return Math.random() > 0.5 ? 'Fort Commander' : 'Garrison Chief';
                } else {
                    return Math.random() > 0.5 ? 'Military Commander' : 'Colonel';
                }
            case 'AFRICA':
                return Math.random() > 0.5 ? 'War Chief' : Math.random() > 0.5 ? 'Military Chief' : 'Fort Captain';
            case 'AMERICAS':
                if (era === 'ANTIQUITY' || era === 'MEDIEVAL') {
                    return Math.random() > 0.5 ? 'War Chief' : 'War Captain';
                } else {
                    return Math.random() > 0.5 ? 'Fort Commander' : 'Military Chief';
                }
            case 'OCEANIA':
                return Math.random() > 0.5 ? 'War Chief' : Math.random() > 0.5 ? 'Warrior Leader' : 'Fort Captain';
            default:
                return 'Fortress Commander';
        }
    } else {
        // Religious titles
        const lowerReligion = (religion || '').toLowerCase();
        
        if (lowerReligion.includes('islam')) {
            return Math.random() > 0.5 ? 'Grand Imam' : Math.random() > 0.5 ? 'Sheikh' : 'Ayatollah';
        } else if (lowerReligion.includes('catholic')) {
            return Math.random() > 0.5 ? 'Bishop' : Math.random() > 0.5 ? 'Archbishop' : 'Cardinal';
        } else if (lowerReligion.includes('orthodox')) {
            return Math.random() > 0.5 ? 'Metropolitan' : 'Patriarch';
        } else if (lowerReligion.includes('protestant')) {
            return Math.random() > 0.5 ? 'Minister' : 'Pastor';
        } else if (lowerReligion.includes('judaism')) {
            return Math.random() > 0.5 ? 'Chief Rabbi' : 'Rabbi';
        } else if (lowerReligion.includes('buddhism')) {
            return Math.random() > 0.5 ? 'Abbot' : Math.random() > 0.5 ? 'Lama' : 'Master';
        } else if (lowerReligion.includes('hinduism')) {
            return Math.random() > 0.5 ? 'High Priest' : Math.random() > 0.5 ? 'Guru' : 'Pandit';
        } else {
            return Math.random() > 0.5 ? 'High Priest' : 'Priest';
        }
    }
}

/**
 * Helper: Create seeded random number generator
 */
function seeded(seed: number) {
    let s = Math.sin(seed) * 10000;
    const next = () => {
        s = (s + 1) % 10000;
        return (s - Math.floor(s));
    };
    const rangeInt = (min: number, max: number) => Math.floor(next() * (max - min)) + min;
    return { next, rangeInt };
}

/**
 * Helper: Get approximate year from era
 */
function getYearFromEra(era: HistoricalEra): number {
    const eraYears: Record<HistoricalEra, number> = {
        'Prehistory': -3000,
        'Classical': -500,
        'Antiquity': 100,
        'Medieval': 1100,
        'Renaissance': 1450,
        'Early Modern': 1650,
        'Industrial': 1850,
        'Modern': 1950,
        'Future': 2050
    };
    return eraYears[era] || 1500;
}

/**
 * Generate sophisticated elite profile using the same system as government districts
 */
function generateEliteProfile(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    region: string,
    buildingId: string,
    religion?: string
): {
    name: string;
    appearance: any;
    stats: any;
    personality: any;
    gender: 'male' | 'female';
    age: number;
} {
    // Create deterministic seed from buildingId
    const seed = buildingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rng = seeded(seed);

    // Create pseudo-noise for deterministic generation
    const pseudoNoise: ValueNoise = {
        random: () => rng.next(),
        get: (x: number, y: number) => rng.next(),
        getNormalized: (x: number, y: number) => rng.next()
    };

    const year = getYearFromEra(era);
    const gender = rng.next() > 0.5 ? 'male' : 'female';

    // Use sophisticated base profile generator (same as government districts)
    const baseProfile = generateBaseProfile(pseudoNoise, {
        era: era,
        culturalZone,
        region
    });

    // Generate culturally accurate name using the SAME system as government NPCs
    const nameData = generateHistoricalName(culturalZone, region, year, gender);

    return {
        name: `${nameData.firstName} ${nameData.surname}`,
        appearance: {
            ...baseProfile.appearance,
            clothing: {
                ...baseProfile.appearance.clothing,
                quality: 'fine',
                wealth: 'wealthy'
            }
        },
        stats: {
            ...baseProfile.stats,
            // Boost stats for elites
            intelligence: Math.min(10, (baseProfile.stats.intelligence || 5) + 3),
            charisma: Math.min(10, (baseProfile.stats.charisma || 5) + 3),
            wisdom: Math.min(10, (baseProfile.stats.wisdom || 5) + 2),
            strength: Math.min(10, (baseProfile.stats.strength || 5) + 1)
        },
        personality: baseProfile.personality,
        gender,
        age: 35 + rng.rangeInt(0, 25) // 35-60 years old
    };
}

/**
 * Create a building elite NPC
 */
export function createBuildingElite(
    buildingId: string,
    buildingType: 'palace' | 'holy_place' | 'fortress',
    position: Point,
    religion: string | undefined,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    region?: string
): BuildingElite {
    // Get faction data for court roles
    const factionData = FACTION_DATA[culturalZone]?.[region || '']?.[era];

    // ✅ NEW: Use sophisticated profile generation instead of random names
    const profile = generateEliteProfile(culturalZone, era, region || '', buildingId, religion);
    const title = generateTitle(buildingType, religion, culturalZone, era, region, factionData);

    let personality: BuildingElite['personality'];
    let dialogueStyle: BuildingElite['dialogueStyle'];
    let respectThreshold: number;
    let socialClass: BuildingElite['socialClass'];

    if (buildingType === 'palace') {
        personality = Math.random() > 0.5 ? 'arrogant' : Math.random() > 0.5 ? 'regal' : 'intimidating';
        dialogueStyle = Math.random() > 0.5 ? 'condescending' : 'imperious';
        respectThreshold = 70; // High threshold for nobility
        socialClass = title.includes('King') || title.includes('Sultan') || title.includes('Emperor') ? 'royalty' : 'nobility';
    } else if (buildingType === 'fortress') {
        personality = Math.random() > 0.5 ? 'stern' : Math.random() > 0.5 ? 'intimidating' : 'arrogant';
        dialogueStyle = Math.random() > 0.5 ? 'aggressive' : 'condescending';
        respectThreshold = 65; // Military respect threshold
        socialClass = 'military_officer';
    } else {
        personality = Math.random() > 0.5 ? 'pious' : Math.random() > 0.5 ? 'stern' : 'intimidating';
        dialogueStyle = Math.random() > 0.5 ? 'aggressive' : 'condescending';
        respectThreshold = 60; // Moderate threshold for clergy
        socialClass = 'clergy';
    }

    // Generate portrait seed for consistent rendering
    const portraitSeed = buildingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;

    console.log(`🎨 [BuildingElites] Generated elite profile:`, {
        name: profile.name,
        title,
        culturalZone,
        era,
        region,
        buildingType,
        gender: profile.gender,
        age: profile.age,
        portraitSeed
    });

    return {
        id: `elite-${buildingId}`,
        name: profile.name, // ✅ Use sophisticated name
        title,
        buildingId,
        buildingType,
        religion,
        socialClass,
        personality,
        culturalZone,
        era,
        respectThreshold,
        dialogueStyle,
        // ✅ Store profile data for rendering
        profileData: {
            appearance: profile.appearance,
            stats: profile.stats,
            gender: profile.gender,
            age: profile.age,
            portraitSeed
        }
    };
}

/**
 * Convert BuildingElite to NpcEntity for interior rendering
 */
export function convertEliteToNpc(elite: BuildingElite, position: Point): NpcEntity {
    // ✅ Use profileData if available, otherwise fall back to defaults
    const stats = elite.profileData?.stats || {
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 16,
        wisdom: 15,
        charisma: 18,
        maxHealth: 100,
        experience: 1000,
        level: 5,
        fatigue: 0,
        maxFatigue: 120
    };

    const appearance = elite.profileData?.appearance || {
        skinTone: getSkinToneForCulture(elite.culturalZone),
        skinColor: getSkinToneForCulture(elite.culturalZone),
        hairColor: '#4A4A4A',
        eyeColor: '#654321',
        height: 165 + Math.random() * 20,
        build: 'regal',
        hairstyle: 'elaborate',
        affect: 'imperious',
        clothing: [],
        palette: {
            primary: elite.socialClass === 'royalty' ? '#800080' : '#4169E1',
            secondary: '#FFD700',
            accent: '#8B4513'
        }
    };

    return {
        id: elite.id,
        name: `${elite.title} ${elite.name}`,
        x: position.x,
        y: position.y,
        health: 100,
        maxHealth: 100,
        stats,
        personality: {
            openness: elite.personality === 'pious' ? 0.7 : 0.4,
            conscientiousness: 0.8,
            extraversion: elite.personality === 'arrogant' ? 0.9 : 0.6,
            agreeableness: 0.2,
            neuroticism: elite.personality === 'intimidating' ? 0.3 : 0.6,
            traits: [elite.personality, 'prideful', 'demanding']
        },
        socialContext: {
            currentTown: '',
            reputation: 90,
            titles: [elite.title],
            achievements: ['Ruler', 'Authority Figure']
        },
        class: elite.socialClass,
        role: elite.title,
        emoji: elite.buildingType === 'palace' ? '👑' :
               elite.buildingType === 'fortress' ? '⚔️' : '⛪',
        age: elite.profileData?.age || (35 + Math.floor(Math.random() * 25)),
        gender: elite.profileData?.gender || (Math.random() > 0.5 ? 'male' : 'female'),
        wealthLevel: elite.socialClass === 'royalty' ? 'noble' : 'wealthy',
        appearance,
        // ✅ Add portrait info
        portraitType: 'procedural',
        portraitSeed: elite.profileData?.portraitSeed,
        descriptions: {
            short: `The ${elite.title.toLowerCase()} of this ${
                elite.buildingType === 'palace' ? 'palace' : 
                elite.buildingType === 'fortress' ? 'fortress' : 'holy site'
            }`,
            long: `A ${elite.personality} ${elite.title.toLowerCase()} who commands absolute respect and deference`
        },
        backstory: `${elite.title} ${elite.name} rules over this domain with an iron fist, expecting immediate respect from all who enter.`,
        activity: 'idle',
        movement: { type: 'stationary' },
        targetX: position.x,
        targetY: position.y,
        direction: 'down',
        walkFrame: 0,
        onRoad: false,
        aiState: 'idle',
        era: elite.era,
        culturalZone: elite.culturalZone,
        religion: elite.religion || 'Christianity',
        statusEffects: [],
        inventory: [],
        currency: 500 + Math.floor(Math.random() * 1000),
        birthplace: 'Noble Estate',
        occupation: elite.title,
        socialClass: elite.socialClass,
        family: [],
        lifeEvents: [{ year: 1400, event: `Appointed as ${elite.title}` }],
        personalGoal: {
            archetype: 'DOMINATE',
            targetType: 'TERRITORY',
            targetId: elite.buildingId,
            description: `Maintain absolute authority over this ${elite.buildingType}`
        },
        ideology: 'AUTHORITARIANISM',
        beliefs: [],
        memory: {
            opinionOfPlayer: -20, // Default negative opinion
            knownFactsAboutPlayer: new Set(),
            relationships: new Map(),
            conversationSummaries: []
        },
        // Interior-specific behavior
        isHostile: false,
        requiredReligionToPass: elite.buildingType === 'holy_place' ? elite.religion : undefined,
        requiredClassToPass: ['nobility', 'clergy'],
        confrontationDialogue: [
            `How DARE you enter MY domain without permission!`,
            `Kneel before your ${elite.title.toLowerCase()}!`,
            `Your insolence will not be tolerated!`
        ],
        hasConfrontedPlayer: false
    };
}

function getSkinToneForCulture(culturalZone: CulturalZone): string {
    switch (culturalZone) {
        case 'AFRICA': return '#8B4513';
        case 'MENA': return '#D2B48C';
        case 'SOUTH_ASIA': return '#CD853F';
        case 'EAST_ASIA': return '#F5DEB3';
        case 'AMERICAS': return '#A0522D';
        case 'OCEANIA': return '#DEB887';
        default: return '#FDBCB4';
    }
}

/**
 * Generate appropriate dialogue based on player's social standing and behavior
 */
export function generateEliteDialogue(
    elite: BuildingElite,
    playerReligion: string,
    playerClass: string,
    playerReputation: number,
    hasBeenRespectful: boolean
): {
    greeting: string[];
    demandRespect: string[];
    dismissal: string[];
    threat: string[];
} {
    const isWrongReligion = elite.religion && playerReligion !== elite.religion;
    const isWrongClass = !['nobility', 'clergy', 'merchant'].includes(playerClass);
    const isDisrespectful = playerReputation < elite.respectThreshold || !hasBeenRespectful;
    
    let intensity = 'mild';
    if (isWrongReligion && elite.buildingType === 'holy_place') intensity = 'severe';
    else if (isWrongClass && elite.buildingType === 'palace') intensity = 'moderate';
    else if (isDisrespectful) intensity = 'moderate';
    
    const greetings = {
        mild: [
            `I am ${elite.title} ${elite.name}. State your business here.`,
            `You stand before ${elite.title} ${elite.name}. Show proper respect.`
        ],
        moderate: [
            `What is this? A ${playerClass} dares enter my domain?`,
            `${elite.title} ${elite.name} does not receive... commoners.`
        ],
        severe: [
            `GUARDS! How did this ${isWrongReligion ? 'heathen' : 'peasant'} gain entry?`,
            `You DARE defile this sacred space with your presence?!`
        ]
    };
    
    const demands = {
        mild: [
            `You will address me as ${elite.title} ${elite.name}.`,
            `Proper etiquette is expected in my presence.`
        ],
        moderate: [
            `Kneel when you address your ${elite.title.toLowerCase()}!`,
            `Your lack of breeding is showing. Learn your place!`
        ],
        severe: [
            `ON YOUR KNEES, DOG!`,
            `How DARE you show such disrespect! GUARDS!`
        ]
    };
    
    const dismissals = {
        mild: [
            `You may go. Do not linger.`,
            `Your audience is concluded. Leave.`
        ],
        moderate: [
            `Remove yourself from my sight immediately.`,
            `Begone! Your presence offends me.`
        ],
        severe: [
            `GET OUT! Before I have you thrown in chains!`,
            `LEAVE NOW or face the consequences of your insolence!`
        ]
    };
    
    const threats = {
        mild: [
            `Remember where you are and who I am.`,
            `Test my patience at your own peril.`
        ],
        moderate: [
            `Continue this disrespect and you will regret it.`,
            `My guards are very... persuasive.`
        ],
        severe: [
            `I could have you executed for this transgression!`,
            `One word from me and you disappear forever!`
        ]
    };
    
    return {
        greeting: greetings[intensity],
        demandRespect: demands[intensity],
        dismissal: dismissals[intensity],
        threat: threats[intensity]
    };
}

/**
 * Store and retrieve building elites
 */
const buildingElites = new Map<string, BuildingElite>();

export function setBuildingElite(buildingId: string, elite: BuildingElite): void {
    buildingElites.set(buildingId, elite);
}

export function getBuildingElite(buildingId: string): BuildingElite | undefined {
    return buildingElites.get(buildingId);
}

export function createEliteForBuilding(
    buildingId: string,
    buildingType: 'palace' | 'holy_place' | 'fortress',
    position: Point,
    religion?: string,
    culturalZone: CulturalZone = 'EUROPE',
    era: HistoricalEra = 'MEDIEVAL',
    region?: string
): BuildingElite {
    const elite = createBuildingElite(buildingId, buildingType, position, religion, culturalZone, era, region);
    setBuildingElite(buildingId, elite);
    return elite;
}