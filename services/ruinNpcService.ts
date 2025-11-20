/**
 * services/ruinNpcService.ts - Generate historically-accurate NPCs for ruins
 */
import {
    HistoricalEra,
    NpcEntity,
    CulturalZone,
    WealthLevel,
    Gender,
    Appearance,
    Item
} from '../types';
import {
    PROFESSIONS,
    ProfessionDefinition,
    RoleMap
} from '../constants/characterData/professions';
import { generateNpcName } from '../generation/common/npcUtils';
import { generateProceduralItem } from './itemGenerationService';
import { ANIMAL_DATA } from '../constants';

/**
 * Marginal society professions that appear in ruins
 * These are universal outcasts, criminals, and fringe dwellers
 */
const MARGINAL_SOCIETY_PROFESSIONS: Record<HistoricalEra, RoleMap> = {
    [HistoricalEra.PREHISTORY]: {
        'Outcast': {
            statRequirements: { minConstitution: 4 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'exile taboo cursed',
            emoji: '🏴'
        },
        'Cave Hermit': {
            statRequirements: { minConstitution: 5, minPerception: 4 },
            socialRequirements: { minWanderlust: 0.6 },
            keywords: 'solitude spirits meditation',
            emoji: '🧙'
        },
        'Raider': {
            statRequirements: { minStrength: 6, minStamina: 5 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'pillage combat tribal',
            emoji: '⚔️'
        }
    },
    [HistoricalEra.ANTIQUITY]: {
        'Bandit': {
            statRequirements: { minStrength: 5, minDexterity: 5, minCraftiness: 4 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'highway robber outlaw',
            emoji: '🗡️'
        },
        'Grave Robber': {
            statRequirements: { minDexterity: 6, minCraftiness: 6, minLuck: 4 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'tomb thief looter',
            emoji: '💀'
        },
        'Runaway Slave': {
            statRequirements: { minStamina: 5, minConstitution: 5 },
            socialRequirements: { maxPrivilege: 0.1 },
            keywords: 'fugitive escaped freedom',
            emoji: '⛓️'
        },
        'Desert Hermit': {
            statRequirements: { minConstitution: 6, minPerception: 5 },
            socialRequirements: { minReligiosity: 0.7 },
            keywords: 'ascetic mystic solitude',
            emoji: '🏜️'
        },
        'Cultist': {
            statRequirements: { minIntelligence: 4, minPersuasion: 5 },
            socialRequirements: { minReligiosity: 0.8 },
            keywords: 'mystery forbidden ritual',
            emoji: '🕯️'
        }
    },
    [HistoricalEra.MEDIEVAL]: {
        'Brigand': {
            statRequirements: { minStrength: 6, minStamina: 5, minCraftiness: 5 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'highway robber outlaw forest',
            emoji: '🏹'
        },
        'Heretic': {
            statRequirements: { minIntelligence: 5, minPersuasion: 5 },
            socialRequirements: { minReligiosity: 0.6, maxPrivilege: 0.3 },
            keywords: 'forbidden beliefs hunted',
            emoji: '🔥'
        },
        'Poacher': {
            statRequirements: { minDexterity: 6, minPerception: 6, minCraftiness: 5 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'illegal hunting forest',
            emoji: '🦌'
        },
        'Leper': {
            statRequirements: { minConstitution: 3 },
            socialRequirements: { maxPrivilege: 0.1 },
            keywords: 'disease outcast untouchable',
            emoji: '🤒'
        },
        'Deserter': {
            statRequirements: { minStamina: 5, minConstitution: 5 },
            socialRequirements: { maxPrivilege: 0.3 },
            genderBias: 'Male' as Gender,
            keywords: 'military fugitive coward',
            emoji: '🛡️'
        },
        'Witch': {
            statRequirements: { minIntelligence: 6, minCraftiness: 6 },
            socialRequirements: { minReligiosity: 0.3, maxPrivilege: 0.3 },
            genderBias: 'Female' as Gender,
            keywords: 'herbs curse magic',
            emoji: '🧙‍♀️'
        }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
        'Highwayman': {
            statRequirements: { minStrength: 5, minDexterity: 6, minPersuasion: 5 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'gentleman thief robber',
            emoji: '🎩'
        },
        'Pirate': {
            statRequirements: { minStrength: 5, minStamina: 6, minCraftiness: 5 },
            socialRequirements: { minWanderlust: 0.7, maxPrivilege: 0.3 },
            keywords: 'sea raider corsair buccaneer',
            emoji: '🏴‍☠️'
        },
        'Smuggler': {
            statRequirements: { minCraftiness: 7, minPersuasion: 6 },
            socialRequirements: { minWanderlust: 0.5, maxPrivilege: 0.4 },
            keywords: 'contraband illegal trade',
            emoji: '📦'
        },
        'Alchemist': {
            statRequirements: { minIntelligence: 7, minCraftiness: 6 },
            socialRequirements: { minReligiosity: 0.2 },
            keywords: 'transmutation philosopher stone',
            emoji: '⚗️'
        },
        'Rebel': {
            statRequirements: { minConstitution: 5, minPersuasion: 6 },
            socialRequirements: { minAmbition: 0.6, maxPrivilege: 0.4 },
            keywords: 'revolution uprising freedom',
            emoji: '✊'
        }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
        'Anarchist': {
            statRequirements: { minIntelligence: 6, minPersuasion: 6 },
            socialRequirements: { minAmbition: 0.7, maxPrivilege: 0.3 },
            keywords: 'revolution bomb radical',
            emoji: '💣'
        },
        'Revolutionary': {
            statRequirements: { minIntelligence: 5, minPersuasion: 7, minConstitution: 5 },
            socialRequirements: { minAmbition: 0.8, maxPrivilege: 0.4 },
            keywords: 'uprising overthrow liberty equality fraternity',
            emoji: '🚩'
        },
        'Gang Member': {
            statRequirements: { minStrength: 5, minCraftiness: 5 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'criminal underworld thug',
            emoji: '🔪'
        },
        'Opium Addict': {
            statRequirements: { minConstitution: 3 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'laudanum den desperate',
            emoji: '💉'
        },
        'Grave Digger': {
            statRequirements: { minStrength: 5, minConstitution: 5 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'cemetery corpse burial',
            emoji: '⚰️'
        },
        'Treasure Hunter': {
            statRequirements: { minPerception: 6, minLuck: 5, minCraftiness: 6 },
            socialRequirements: { minWanderlust: 0.6 },
            keywords: 'explorer artifact ruins',
            emoji: '🗺️'
        }
    },
    [HistoricalEra.MODERN_ERA]: {
        'Homeless': {
            statRequirements: { minConstitution: 4 },
            socialRequirements: { maxPrivilege: 0.1 },
            keywords: 'vagrant destitute forgotten',
            emoji: '🏚️'
        },
        'Revolutionary': {
            statRequirements: { minIntelligence: 6, minPersuasion: 8, minConstitution: 5 },
            socialRequirements: { minAmbition: 0.8, maxPrivilege: 0.3 },
            keywords: 'radical activist change overthrow system',
            emoji: '✊'
        },
        'Drug Dealer': {
            statRequirements: { minCraftiness: 6, minPersuasion: 5 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'narcotics criminal underground',
            emoji: '💊'
        },
        'Gang Leader': {
            statRequirements: { minStrength: 6, minPersuasion: 7, minCraftiness: 6 },
            socialRequirements: { maxPrivilege: 0.4 },
            keywords: 'organized crime boss mafia',
            emoji: '🔫'
        },
        'Urban Explorer': {
            statRequirements: { minDexterity: 6, minPerception: 6 },
            socialRequirements: { minWanderlust: 0.7 },
            keywords: 'urbex abandoned trespasser',
            emoji: '🏗️'
        },
        'Archaeologist': {
            statRequirements: { minIntelligence: 7, minPerception: 6 },
            socialRequirements: { minPrivilege: 0.5 },
            keywords: 'excavation history artifacts',
            emoji: '🔍'
        }
    },
    [HistoricalEra.FUTURE_ERA]: {
        'Scavenger': {
            statRequirements: { minPerception: 6, minCraftiness: 5 },
            socialRequirements: { maxPrivilege: 0.2 },
            keywords: 'wasteland survivor recycler',
            emoji: '♻️'
        },
        'Hacker': {
            statRequirements: { minIntelligence: 8, minCraftiness: 7 },
            socialRequirements: { maxPrivilege: 0.4 },
            keywords: 'cybercrime darkweb anonymous',
            emoji: '💻'
        },
        'Biohacker': {
            statRequirements: { minIntelligence: 7, minConstitution: 5 },
            socialRequirements: { minWanderlust: 0.5 },
            keywords: 'genetic modification augmented',
            emoji: '🧬'
        },
        'Drone Pilot': {
            statRequirements: { minPerception: 7, minDexterity: 6 },
            socialRequirements: { minWanderlust: 0.4 },
            keywords: 'remote surveillance illegal',
            emoji: '🚁'
        },
        'Data Thief': {
            statRequirements: { minIntelligence: 7, minCraftiness: 7 },
            socialRequirements: { maxPrivilege: 0.3 },
            keywords: 'corporate espionage information',
            emoji: '💾'
        }
    }
};

/**
 * Culture-specific variations for marginal professions
 */
const CULTURAL_MARGINAL_VARIATIONS: Partial<Record<CulturalZone, Record<string, string>>> = {
    EUROPEAN: {
        'Bandit': 'Brigand',
        'Grave Robber': 'Tomb Raider',
        'Desert Hermit': 'Forest Hermit',
        'Gang Member': 'Ruffian'
    },
    EAST_ASIAN: {
        'Bandit': 'Mountain Bandit',
        'Desert Hermit': 'Mountain Hermit',
        'Deserter': 'Ronin',
        'Rebel': 'Peasant Rebel',
        'Gang Member': 'Yakuza'
    },
    MENA: {
        'Bandit': 'Desert Raider',
        'Grave Robber': 'Tomb Thief',
        'Pirate': 'Corsair',
        'Desert Hermit': 'Desert Ascetic',
        'Smuggler': 'Caravan Smuggler'
    },
    OCEANIA: {
        'Bandit': 'Sea Raider',
        'Desert Hermit': 'Island Hermit',
        'Pirate': 'Bugis Pirate',
        'Outcast': 'Taboo Breaker',
        'Gang Member': 'Headhunter'
    },
    SUB_SAHARAN_AFRICAN: {
        'Bandit': 'Bush Raider',
        'Desert Hermit': 'Savannah Hermit',
        'Witch': 'Witch Doctor',
        'Smuggler': 'Ivory Poacher',
        'Rebel': 'Freedom Fighter'
    },
    SOUTH_ASIAN: {
        'Bandit': 'Dacoit',
        'Desert Hermit': 'Sadhu',
        'Outcast': 'Untouchable',
        'Cultist': 'Thug',
        'Gang Member': 'Goonda'
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        'Bandit': 'Raider',
        'Desert Hermit': 'Vision Seeker',
        'Outcast': 'Exile',
        'Witch': 'Medicine Person',
        'Poacher': 'Trespasser'
    },
    SOUTH_AMERICAN: {
        'Grave Robber': 'Huaquero',
        'Desert Hermit': 'Mountain Ascetic',
        'Bandit': 'Bandido',
        'Smuggler': 'Coca Runner',
        'Rebel': 'Guerrilla'
    }
};

/**
 * Get contextual motivations for why an NPC is in ruins
 */
export function getNpcMotivation(profession: string, ruinType: string): string {
    const motivations: Record<string, string[]> = {
        'Bandit': ['using ruins as hideout', 'ambushing travelers', 'hiding from authorities'],
        'Brigand': ['planning raids', 'storing loot', 'hiding from law'],
        'Grave Robber': ['seeking treasures', 'looting tombs', 'following ancient maps'],
        'Treasure Hunter': ['exploring for artifacts', 'documenting finds', 'seeking fortune'],
        'Archaeologist': ['studying inscriptions', 'excavating', 'preserving history'],
        'Hermit': ['seeking solitude', 'meditating', 'escaping society'],
        'Desert Hermit': ['religious contemplation', 'ascetic practices', 'vision quest'],
        'Cultist': ['performing rituals', 'guarding secrets', 'awaiting prophecy'],
        'Witch': ['gathering herbs', 'practicing magic', 'hiding from persecution'],
        'Deserter': ['hiding from military', 'avoiding execution', 'starting new life'],
        'Rebel': ['planning uprising', 'hiding weapons', 'meeting conspirators'],
        'Revolutionary': ['distributing pamphlets', 'organizing resistance', 'hiding from secret police', 'planning overthrow'],
        'Smuggler': ['storing contraband', 'secret meeting', 'avoiding customs'],
        'Pirate': ['burying treasure', 'hiding from navy', 'temporary shelter'],
        'Scholar': ['studying architecture', 'translating inscriptions', 'research'],
        'Merchant': ['shortcut through ruins', 'lost and seeking shelter', 'trading with locals'],
        'Soldier': ['patrolling area', 'hunting criminals', 'desertion'],
        'Homeless': ['seeking shelter', 'scavenging', 'hiding'],
        'Urban Explorer': ['photographing', 'thrill-seeking', 'documenting'],
        'Gang Member': ['territorial claim', 'drug deal', 'hiding from rivals']
    };

    const defaultMotivations = ['exploring ruins', 'seeking shelter', 'lost'];

    // Check for cultural variations
    const variations = Object.values(CULTURAL_MARGINAL_VARIATIONS).flatMap(v => Object.values(v));
    const baseProf = variations.includes(profession) ?
        Object.entries(CULTURAL_MARGINAL_VARIATIONS).find(([_, v]) =>
            Object.values(v).includes(profession))?.[1] || profession :
        profession;

    const profMotivations = motivations[baseProf] || motivations[profession] || defaultMotivations;
    return profMotivations[Math.floor(Math.random() * profMotivations.length)];
}

/**
 * Determine if NPC should be hostile based on profession and context
 */
function determineHostility(profession: string, motivation: string): boolean {
    const hostileProfessions = [
        'Bandit', 'Brigand', 'Raider', 'Pirate', 'Gang Member',
        'Gang Leader', 'Drug Dealer', 'Thug', 'Headhunter'
    ];

    const sometimesHostile = [
        'Deserter', 'Smuggler', 'Poacher', 'Grave Robber',
        'Rebel', 'Cultist', 'Witch'
    ];

    const peacefulProfessions = [
        'Hermit', 'Scholar', 'Archaeologist', 'Leper',
        'Homeless', 'Urban Explorer', 'Merchant'
    ];

    if (hostileProfessions.some(p => profession.includes(p))) {
        return Math.random() > 0.2; // 80% hostile
    }

    if (sometimesHostile.some(p => profession.includes(p))) {
        return Math.random() > 0.5; // 50% hostile
    }

    if (peacefulProfessions.some(p => profession.includes(p))) {
        return Math.random() > 0.9; // 10% hostile
    }

    return Math.random() > 0.6; // 40% hostile default
}

/**
 * Generate appropriate loot for marginal NPCs
 */
function generateMarginalLoot(
    profession: string,
    era: HistoricalEra,
    culturalZone: CulturalZone
): Item[] {
    const loot: Item[] = [];

    // Profession-specific loot
    if (profession.includes('Bandit') || profession.includes('Brigand')) {
        if (Math.random() > 0.5) loot.push(generateProceduralItem('KNIFE', culturalZone, era));
        if (Math.random() > 0.7) loot.push(generateProceduralItem('COIN', culturalZone, era));
    }

    if (profession.includes('Treasure Hunter') || profession.includes('Grave Robber')) {
        if (Math.random() > 0.4) loot.push(generateProceduralItem('BLESSED_ARTIFACT', culturalZone, era));
        if (Math.random() > 0.6) loot.push(generateProceduralItem('SCROLL', culturalZone, era));
    }

    if (profession.includes('Scholar') || profession.includes('Archaeologist')) {
        if (Math.random() > 0.5) loot.push(generateProceduralItem('BOOK', culturalZone, era));
        if (Math.random() > 0.7) loot.push(generateProceduralItem('QUILL', culturalZone, era));
    }

    if (profession.includes('Hermit')) {
        if (Math.random() > 0.6) loot.push(generateProceduralItem('MEDICINAL_HERBS', culturalZone, era));
        if (Math.random() > 0.8) loot.push(generateProceduralItem('RELIGIOUS_TEXT', culturalZone, era));
    }

    // Always chance for basic items
    if (Math.random() > 0.7) loot.push(generateProceduralItem('CLAY_LAMP', culturalZone, era));
    if (Math.random() > 0.8) loot.push(generateProceduralItem('ROPE', culturalZone, era));

    return loot;
}

/**
 * Main function to generate ruin NPCs
 */
export function generateRuinNPCs(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    ruinType: string,
    depth: number,
    count: number = 3
): NpcEntity[] {
    const npcs: NpcEntity[] = [];

    // Get marginal professions for this era
    const marginalProfessions = MARGINAL_SOCIETY_PROFESSIONS[era] || {};

    // Also get some regular professions who might visit ruins
    const regularVisitors = ['Scholar', 'Merchant', 'Soldier', 'Pilgrim', 'Explorer'];
    const existingProfessions = PROFESSIONS[culturalZone]?.[era] || {};

    // Find matching regular professions
    const visitorProfessions: Record<string, ProfessionDefinition> = {};
    for (const socialClass of Object.values(existingProfessions)) {
        for (const [role, def] of Object.entries(socialClass)) {
            if (regularVisitors.some(v => role.includes(v))) {
                visitorProfessions[role] = def;
            }
        }
    }

    // Combine marginal and visitor professions
    const allPossibleProfessions = { ...marginalProfessions, ...visitorProfessions };
    const professionNames = Object.keys(allPossibleProfessions);

    if (professionNames.length === 0) {
        console.warn(`No professions available for ${culturalZone} in ${era}`);
        return [];
    }

    // Generate NPCs
    for (let i = 0; i < count; i++) {
        const professionName = professionNames[Math.floor(Math.random() * professionNames.length)];
        const profDef = allPossibleProfessions[professionName];

        // Apply cultural variations
        const culturalVariations = CULTURAL_MARGINAL_VARIATIONS[culturalZone] || {};
        const displayName = culturalVariations[professionName] || professionName;

        // Get motivation
        const motivation = getNpcMotivation(displayName, ruinType);

        // Determine hostility
        const isHostile = determineHostility(displayName, motivation);

        // Generate name
        const gender = profDef.genderBias || (Math.random() > 0.5 ? 'Male' : 'Female');
        // Create a simple noise function for name generation
        const simpleNoise = {
            random: () => Math.random()
        };
        // Use approximate year based on era
        const year = era === HistoricalEra.PREHISTORY ? -1000 :
                     era === HistoricalEra.ANTIQUITY ? 100 :
                     era === HistoricalEra.MEDIEVAL ? 1200 :
                     era === HistoricalEra.RENAISSANCE_EARLY_MODERN ? 1600 :
                     era === HistoricalEra.INDUSTRIAL_ERA ? 1850 :
                     era === HistoricalEra.MODERN_ERA ? 1980 : 2010;
        const name = generateNpcName(gender as Gender, culturalZone, undefined, year, simpleNoise as any);

        // Generate loot
        const loot = generateMarginalLoot(displayName, era, culturalZone);

        // Calculate stats based on profession requirements and depth
        const baseStats = {
            hp: 20 + (depth * 5) + Math.floor(Math.random() * 10),
            attack: 5 + (depth * 2) + (profDef.statRequirements.minStrength || 3),
            defense: 3 + depth + (profDef.statRequirements.minConstitution || 2),
            accuracy: 50 + (depth * 5) + (profDef.statRequirements.minDexterity || 0) * 3,
            evasion: 10 + (depth * 3) + (profDef.statRequirements.minDexterity || 0) * 2,
            level: depth + Math.floor(Math.random() * 3)
        };

        // Create NPC entity
        const npc: Partial<NpcEntity> = {
            id: `ruin_npc_${i}_${Date.now()}`,
            name: name,
            profession: displayName,
            role: displayName.toLowerCase(),
            gender: gender as Gender,
            wealthLevel: 'poor' as WealthLevel, // Most ruin dwellers are poor
            health: baseStats.hp,
            maxHealth: baseStats.hp,
            combat: {
                level: baseStats.level,
                health: baseStats.hp,
                maxHealth: baseStats.hp,
                attack: baseStats.attack,
                defense: baseStats.defense,
                accuracy: baseStats.accuracy,
                evasion: baseStats.evasion,
                criticalChance: 5 + depth
            },
            inventory: loot,
            isHostile: isHostile,
            dialogue: [
                `*${motivation}*`,
                isHostile ? 'Stay back!' : 'Oh, another explorer...',
                `I'm ${name}, a ${displayName.toLowerCase()}.`
            ],
            emoji: profDef.emoji || '👤',
            keywords: profDef.keywords || displayName.toLowerCase()
        };

        npcs.push(npc as NpcEntity);
    }

    return npcs;
}

/**
 * Get appropriate animals for ruins based on biome
 */
export function getRuinAnimals(
    biome: string,
    climate: string,
    count: number = 2
): any[] {
    const ruinAnimals = [
        // Universal ruin dwellers
        { type: 'rat', hp: 5, attack: 2, hostile: false, description: 'A scurrying rat' },
        { type: 'bat', hp: 4, attack: 1, hostile: false, description: 'A fluttering bat' },
        { type: 'spider', hp: 3, attack: 3, hostile: Math.random() > 0.5, description: 'A lurking spider' },
        { type: 'snake', hp: 8, attack: 5, hostile: Math.random() > 0.3, description: 'A coiled snake' }
    ];

    // Biome-specific additions
    if (climate === 'TROPICAL' || climate === 'SEMITROPICAL') {
        ruinAnimals.push(
            { type: 'scorpion', hp: 6, attack: 4, hostile: true, description: 'A venomous scorpion' },
            { type: 'centipede', hp: 4, attack: 3, hostile: true, description: 'A giant centipede' },
            { type: 'monkey', hp: 10, attack: 3, hostile: false, description: 'A curious monkey' }
        );
    }

    if (climate === 'ARID' || climate === 'SEMIARID') {
        ruinAnimals.push(
            { type: 'scorpion', hp: 6, attack: 4, hostile: true, description: 'A desert scorpion' },
            { type: 'lizard', hp: 5, attack: 2, hostile: false, description: 'A basking lizard' },
            { type: 'vulture', hp: 8, attack: 3, hostile: false, description: 'A waiting vulture' }
        );
    }

    if (climate === 'COLD' || climate === 'POLAR') {
        ruinAnimals.push(
            { type: 'wolf', hp: 15, attack: 6, hostile: Math.random() > 0.4, description: 'A lone wolf' },
            { type: 'bear', hp: 25, attack: 8, hostile: Math.random() > 0.6, description: 'A hibernating bear' },
            { type: 'owl', hp: 6, attack: 2, hostile: false, description: 'A watchful owl' }
        );
    }

    // Return random selection
    const selected = [];
    for (let i = 0; i < count; i++) {
        selected.push(ruinAnimals[Math.floor(Math.random() * ruinAnimals.length)]);
    }

    return selected;
}

/**
 * Extended NPC with backstory and persistence data
 */
export interface PersistentNpc extends NpcEntity {
    fullName?: string;
    backstory?: string;
    locationId: string; // e.g. "ruin_5_10_depth1"
    hasTalkedTo: boolean;
    isHostileOriginal: boolean; // Store original hostility before befriending
    dateEncountered: number; // Timestamp
}

const PERSISTENT_NPC_KEY = 'uhs_ruin_persistent_npcs';

/**
 * Generate culturally appropriate backstories
 */
export function generateNpcBackstory(
    npc: NpcEntity,
    culturalZone: CulturalZone,
    era: HistoricalEra
): { fullName: string; backstory: string } {
    // Cultural surname patterns
    const surnamePatterns: Record<CulturalZone, { male: string[]; female: string[] }> = {
        EUROPEAN: {
            male: ['Smith', 'Johnson', 'Williams', 'von Stein', 'de la Cruz', 'O\'Brien', 'MacDonald', 'Petrov'],
            female: ['Smith', 'Johnson', 'Williams', 'von Stein', 'de la Cruz', 'O\'Brien', 'MacDonald', 'Petrova']
        },
        EAST_ASIAN: {
            male: ['Wang', 'Li', 'Zhang', 'Tanaka', 'Yamamoto', 'Kim', 'Park', 'Nguyen'],
            female: ['Wang', 'Li', 'Zhang', 'Tanaka', 'Yamamoto', 'Kim', 'Park', 'Nguyen']
        },
        MENA: {
            male: ['al-Rahman', 'ibn Khalid', 'el-Hassan', 'Ben Yosef', 'Pasha', 'Effendi'],
            female: ['bint Abdullah', 'el-Hassan', 'Khatun', 'Hanim']
        },
        OCEANIA: {
            male: ['Prasetyo', 'Wijaya', 'Rahman', 'Singh', 'Kumar', 'Malik'],
            female: ['Prasetyo', 'Wijaya', 'Rahman', 'Singh', 'Kumar', 'Malik']
        },
        SUB_SAHARAN_AFRICAN: {
            male: ['Mwangi', 'Okonkwo', 'Diallo', 'Nkomo', 'Mbeki', 'Touré'],
            female: ['Mwangi', 'Okonkwo', 'Diallo', 'Nkomo', 'Mbeki', 'Touré']
        },
        SOUTH_ASIAN: {
            male: ['Sharma', 'Patel', 'Gupta', 'Khan', 'Singh', 'Das', 'Nair'],
            female: ['Sharma', 'Patel', 'Gupta', 'Khan', 'Singh', 'Das', 'Nair']
        },
        NORTH_AMERICAN_PRE_COLUMBIAN: {
            male: ['Running Bear', 'Swift Eagle', 'Strong Oak', 'Grey Wolf'],
            female: ['Morning Star', 'White Dove', 'Singing Wind', 'Dancing Rain']
        },
        NORTH_AMERICAN_COLONIAL: {
            male: ['Smith', 'Washington', 'Jefferson', 'Adams', 'Franklin'],
            female: ['Smith', 'Washington', 'Jefferson', 'Adams', 'Franklin']
        },
        SOUTH_AMERICAN: {
            male: ['García', 'Rodríguez', 'Silva', 'Mendoza', 'Guzmán', 'Bolívar'],
            female: ['García', 'Rodríguez', 'Silva', 'Mendoza', 'Guzmán', 'Bolívar']
        }
    };

    // Get surname based on gender and culture
    const surnames = surnamePatterns[culturalZone] || surnamePatterns.EUROPEAN;
    const genderSurnames = npc.gender === 'Female' ? surnames.female : surnames.male;
    const surname = genderSurnames[Math.floor(Math.random() * genderSurnames.length)];

    // Create full name
    const fullName = `${npc.name} ${surname}`;

    // Generate backstory based on profession
    const backstories = generateProfessionBackstory(npc.profession, culturalZone, era);
    const backstory = backstories[Math.floor(Math.random() * backstories.length)];

    return { fullName, backstory };
}

/**
 * Generate profession-specific backstories
 */
function generateProfessionBackstory(
    profession: string,
    culturalZone: CulturalZone,
    era: HistoricalEra
): string[] {
    const backstories: Record<string, string[]> = {
        'Revolutionary': [
            'A former intellectual who turned to radical politics after witnessing injustice',
            'An idealist who believes in overthrowing the current system for a better world',
            'A disillusioned aristocrat who renounced their title to fight for equality',
            'A worker who became radicalized after years of exploitation',
            'A student of political philosophy seeking to put theory into practice'
        ],
        'Bandit': [
            'A former soldier who turned to crime after being abandoned by their regiment',
            'Born into poverty, turned to banditry as the only means of survival',
            'Once an honest merchant, ruined by corrupt officials and now seeks revenge',
            'Leader of a band of outcasts who rob from the rich',
            'A folk hero to some, a criminal to others'
        ],
        'Scholar': [
            'Devoted their life to studying ancient texts and forgotten knowledge',
            'Travels to ruins seeking lost manuscripts and inscriptions',
            'A former court adviser who fell from grace and now pursues knowledge in solitude',
            'Believes the ruins hold the key to understanding a lost civilization',
            'Writing a comprehensive history of the region'
        ],
        'Hermit': [
            'Retreated from society after a personal tragedy',
            'Seeks spiritual enlightenment through solitude and meditation',
            'Once held a position of power but became disillusioned with worldly affairs',
            'Claims to have visions and prophecies in the isolation of the ruins',
            'Guards ancient secrets passed down through generations'
        ],
        'Archaeologist': [
            'University professor on sabbatical researching ancient civilizations',
            'Self-taught explorer who has dedicated their life to uncovering the past',
            'Funded by wealthy patrons to retrieve specific artifacts',
            'Believes they are close to a major historical discovery',
            'Documenting ruins before they are destroyed by progress'
        ],
        'Treasure Hunter': [
            'Following a family legend about hidden treasure',
            'Has a map inherited from a mysterious stranger',
            'Former archaeologist who turned to treasure hunting for profit',
            'Claims to have found clues to an ancient cache of gold',
            'Competing with rivals to find legendary artifacts'
        ],
        'Smuggler': [
            'Uses the ruins as a waypoint for moving contraband',
            'Knows secret passages that avoid customs and patrols',
            'Deals in forbidden artifacts and ancient relics',
            'Has connections with underground networks across the region',
            'Forced into smuggling to pay off debts'
        ],
        'Deserter': [
            'Fled after refusing to carry out an unjust order',
            'Sole survivor of a military disaster, branded a coward',
            'Discovered corruption in the ranks and had to escape',
            'War-weary veteran who could no longer bear the violence',
            'Hiding from military police who seek their capture'
        ],
        'Witch': [
            'Practices ancient healing arts misunderstood as dark magic',
            'Keeper of herbal knowledge passed down through generations',
            'Fled persecution after being accused of causing crop failure',
            'Can supposedly commune with spirits of the ruins',
            'Uses the isolation to practice forbidden rituals'
        ],
        'Gang Member': [
            'Grew up on the streets with no other options',
            'Joined for protection in a dangerous world',
            'Second-generation criminal following family tradition',
            'Uses violence as the only language they know',
            'Loyal to their crew above all else'
        ]
    };

    // Cultural and era-specific modifications
    let baseBackstories = backstories[profession] || [
        'Has a mysterious past they refuse to discuss',
        'Circumstances led them to this life of solitude',
        'Once lived differently but fate intervened',
        'Seeks something in these ruins but won\'t say what',
        'Claims to be waiting for someone who may never come'
    ];

    // Add cultural flavor
    if (culturalZone === 'EAST_ASIAN' && profession === 'Revolutionary') {
        baseBackstories.push('Student of forbidden Western ideas seeking to modernize the nation');
        baseBackstories.push('Follower of the Taiping movement seeking to establish the Heavenly Kingdom');
    } else if (culturalZone === 'MENA' && profession === 'Revolutionary') {
        baseBackstories.push('Advocate for pan-Arab unity against colonial powers');
        baseBackstories.push('Seeks to restore the caliphate through popular uprising');
    } else if (culturalZone === 'SOUTH_AMERICAN' && profession === 'Revolutionary') {
        baseBackstories.push('Follower of Bolivarian ideals seeking continental liberation');
        baseBackstories.push('Indigenous leader fighting against colonial oppression');
    }

    // Add era-specific details
    if (era === HistoricalEra.INDUSTRIAL_ERA && profession === 'Revolutionary') {
        baseBackstories.push('Inspired by Marx and Engels to fight for the working class');
        baseBackstories.push('Anarchist who believes all government is tyranny');
    } else if (era === HistoricalEra.MODERN_ERA && profession === 'Revolutionary') {
        baseBackstories.push('Environmental radical seeking to dismantle industrial capitalism');
        baseBackstories.push('Hacker-activist exposing government surveillance');
    }

    return baseBackstories;
}

/**
 * Store a befriended NPC
 */
export function storeBefriendedNpc(
    npc: NpcEntity,
    locationId: string,
    culturalZone: CulturalZone,
    era: HistoricalEra
): PersistentNpc {
    const { fullName, backstory } = generateNpcBackstory(npc, culturalZone, era);

    const persistentNpc: PersistentNpc = {
        ...npc,
        fullName,
        backstory,
        locationId,
        hasTalkedTo: true,
        isHostileOriginal: npc.isHostile || false,
        dateEncountered: Date.now()
    };

    // Make non-hostile after befriending
    persistentNpc.isHostile = false;

    // Store in localStorage
    const stored = localStorage.getItem(PERSISTENT_NPC_KEY);
    const npcs: PersistentNpc[] = stored ? JSON.parse(stored) : [];

    // Check if NPC already exists at this location
    const existingIndex = npcs.findIndex(n =>
        n.id === npc.id && n.locationId === locationId
    );

    if (existingIndex >= 0) {
        npcs[existingIndex] = persistentNpc;
    } else {
        npcs.push(persistentNpc);
    }

    localStorage.setItem(PERSISTENT_NPC_KEY, JSON.stringify(npcs));

    return persistentNpc;
}

/**
 * Get befriended NPCs for a specific location
 */
export function getBefriendedNpcsForLocation(locationId: string): PersistentNpc[] {
    const stored = localStorage.getItem(PERSISTENT_NPC_KEY);
    if (!stored) return [];

    const npcs: PersistentNpc[] = JSON.parse(stored);
    return npcs.filter(npc => npc.locationId === locationId);
}

/**
 * Check if an NPC has been befriended
 */
export function isNpcBefriended(npcId: string, locationId: string): boolean {
    const befriended = getBefriendedNpcsForLocation(locationId);
    return befriended.some(npc => npc.id === npcId);
}

/**
 * Clear all befriended NPCs (for new game)
 */
export function clearBefriendedNpcs(): void {
    localStorage.removeItem(PERSISTENT_NPC_KEY);
}

/**
 * Get location ID for a ruin at specific coordinates
 */
export function getRuinLocationId(x: number, y: number, depth: number = 0): string {
    return `ruin_${x}_${y}_${depth}`;
}