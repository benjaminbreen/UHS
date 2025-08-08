/**
 * System for generating and managing named elites associated with palaces and holy sites
 */
import { NpcEntity } from '../types/npcTypes';
import { CulturalZone, HistoricalEra, FactionData } from '../types';
import { Point } from '../types';
import { FACTION_DATA } from '../constants';

export interface BuildingElite {
    id: string;
    name: string;
    title: string;
    buildingId: string;
    buildingType: 'palace' | 'holy_place';
    religion?: string;
    socialClass: 'nobility' | 'clergy' | 'royalty';
    personality: 'arrogant' | 'stern' | 'pious' | 'regal' | 'intimidating';
    culturalZone: CulturalZone;
    era: HistoricalEra;
    respectThreshold: number; // How much deference they expect
    dialogueStyle: 'aggressive' | 'condescending' | 'imperious';
}

/**
 * Generate culturally appropriate titles for building elites using faction data court roles
 */
function generateTitle(
    buildingType: 'palace' | 'holy_place',
    religion: string | undefined,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    region?: string,
    factionData?: FactionData
): string {
    // First try to use court roles from faction data if available
    if (factionData?.courtRoles) {
        const structureType = buildingType === 'palace' ? 'palace' : 'holy_site';
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
 * Generate culturally appropriate names
 */
function generateEliteName(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    religion?: string
): string {
    const namesByZone: Record<CulturalZone, string[]> = {
        EUROPE: ['Wilhelm', 'Godwin', 'Eleanor', 'Aldric', 'Matilda', 'Conrad', 'Adelaide', 'Roderick'],
        MENA: ['Hassan', 'Fatima', 'Omar', 'Aisha', 'Khalid', 'Zara', 'Mustafa', 'Layla'],
        EAST_ASIA: ['Hiroshi', 'Akiko', 'Takeshi', 'Yuki', 'Kenji', 'Mei', 'Ryu', 'Sakura'],
        SOUTH_ASIA: ['Raj', 'Priya', 'Arjun', 'Devi', 'Krishna', 'Sita', 'Vikram', 'Lakshmi'],
        AFRICA: ['Kwame', 'Amina', 'Kofi', 'Asha', 'Jengo', 'Nala', 'Bakari', 'Zuri'],
        AMERICAS: ['Itzel', 'Cuauhtemoc', 'Xochitl', 'Tlacaelel', 'Citlali', 'Necalli', 'Zyanya', 'Milintica'],
        OCEANIA: ['Kai', 'Leilani', 'Akamu', 'Nalani', 'Keoni', 'Mahina', 'Kalani', 'Pika'],
        ARCTIC: ['Yutu', 'Siku', 'Nanook', 'Tala', 'Kaskae', 'Nayeli', 'Atuat', 'Kesuk'],
        NORTH_AMERICAN_PRE_COLUMBIAN: ['Running Bear', 'White Eagle', 'Morning Star', 'Red Cloud', 'Swift River', 'Golden Hawk', 'Bright Moon', 'Strong Wolf']
    };
    
    const names = namesByZone[culturalZone] || namesByZone.EUROPE;
    return names[Math.floor(Math.random() * names.length)];
}

/**
 * Create a building elite NPC
 */
export function createBuildingElite(
    buildingId: string,
    buildingType: 'palace' | 'holy_place',
    position: Point,
    religion: string | undefined,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    region?: string
): BuildingElite {
    // Get faction data for court roles
    const factionData = FACTION_DATA[culturalZone]?.[region || '']?.[era];
    
    const name = generateEliteName(culturalZone, era, religion);
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
    } else {
        personality = Math.random() > 0.5 ? 'pious' : Math.random() > 0.5 ? 'stern' : 'intimidating';
        dialogueStyle = Math.random() > 0.5 ? 'aggressive' : 'condescending';
        respectThreshold = 60; // Moderate threshold for clergy
        socialClass = 'clergy';
    }
    
    return {
        id: `elite-${buildingId}`,
        name,
        title,
        buildingId,
        buildingType,
        religion,
        socialClass,
        personality,
        culturalZone,
        era,
        respectThreshold,
        dialogueStyle
    };
}

/**
 * Convert BuildingElite to NpcEntity for interior rendering
 */
export function convertEliteToNpc(elite: BuildingElite, position: Point): NpcEntity {
    return {
        id: elite.id,
        name: `${elite.title} ${elite.name}`,
        x: position.x,
        y: position.y,
        health: 100,
        maxHealth: 100,
        stats: {
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
        },
        personality: {
            openness: elite.personality === 'pious' ? 0.7 : 0.4,
            conscientiousness: 0.8,
            extraversion: elite.personality === 'arrogant' ? 0.9 : 0.6,
            agreeableness: 0.2, // Generally not agreeable
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
        emoji: elite.buildingType === 'palace' ? '👑' : '⛪',
        age: 35 + Math.floor(Math.random() * 25),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        wealthLevel: elite.socialClass === 'royalty' ? 'noble' : 'wealthy',
        appearance: {
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
                primary: elite.socialClass === 'royalty' ? '#800080' : '#4169E1', // Purple for royalty, blue for nobility
                secondary: '#FFD700', // Gold accents
                accent: '#8B4513'
            }
        },
        descriptions: {
            short: `The ${elite.title.toLowerCase()} of this ${elite.buildingType === 'palace' ? 'palace' : 'holy site'}`,
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
    buildingType: 'palace' | 'holy_place',
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