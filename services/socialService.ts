/**
 * services/socialService.ts - Manages procedural social connections between NPCs.
 */
import { NpcEntity, MapData, LifeEvent, PersonalGoal, FamilyMember, HistoricalEra, Gender, CulturalZone } from '../types';
import { ValueNoise } from '../utils/noise';
import { generateNpcName } from '../generation/common/npcUtils';
import { PROFESSIONS, ProfessionDefinition } from '../constants/index';

/**
 * Calculates an opinion modifier between two NPCs based on their personal goals.
 * @param npcA The first NPC.
 * @param npcB The second NPC.
 * @returns A numerical opinion modifier (positive for cooperation, negative for conflict).
 */
export function calculateGoalOpinionModifier(npcA: NpcEntity, npcB: NpcEntity): number {
    const goalA = npcA.personalGoal;
    const goalB = npcB.personalGoal;
    let modifier = 0;

    if (!goalA || !goalB) {
        return 0;
    }

    // Conflict: Both NPCs want to ACQUIRE the same unique STRUCTURE
    if (
        goalA.archetype === 'ACQUIRE' &&
        goalB.archetype === 'ACQUIRE' &&
        goalA.targetType === 'STRUCTURE' &&
        goalA.targetId === goalB.targetId
    ) {
        modifier -= 50; // Strong conflict
    }
    
    // Cooperation: Blacksmith creating something and Miner acquiring ore
    const descA = goalA.description.toLowerCase();
    const descB = goalB.description.toLowerCase();

    const isBlacksmithA = npcA.role === 'Blacksmith';
    const isMinerA = npcA.role === 'Miner';
    const isBlacksmithB = npcB.role === 'Blacksmith';
    const isMinerB = npcB.role === 'Miner';

    if (isBlacksmithA && isMinerB && goalA.archetype === 'CREATE' && goalB.archetype === 'ACQUIRE' && (descB.includes('ore') || descB.includes('metal'))) {
        modifier += 40; // Strong cooperation
    }
    if (isMinerA && isBlacksmithB && goalB.archetype === 'CREATE' && goalA.archetype === 'ACQUIRE' && (descA.includes('ore') || descA.includes('metal'))) {
        modifier += 40; // Strong cooperation
    }

    // Generic cooperation: Shared protection goal for the same location/structure
    if (
        goalA.archetype === 'PROTECT' &&
        goalB.archetype === 'PROTECT' &&
        (goalA.targetType === 'LOCATION' || goalA.targetType === 'STRUCTURE') &&
        goalA.targetId === goalB.targetId
    ) {
        modifier += 30; // Shared duty
    }

    return modifier;
}


/**
 * Finds the most likely friends for a given NPC from a list of all NPCs on the map.
 * Friendship is calculated based on a scoring system that prioritizes proximity,
 * shared affiliations (work, religion, faction), and profession.
 *
 * @param npc The NPC for whom to find friends.
 * @param allNpcs An array of all other NPCs on the map.
 * @param mapData The current map data (used for context, currently unused but good for future expansion).
 * @returns An array of the top 2-3 most likely friend NPCs.
 */
export function findNpcFriends(npc: NpcEntity, allNpcs: NpcEntity[], mapData: MapData): NpcEntity[] {
    if (allNpcs.length <= 1) {
        return [];
    }

    const friendScores: { npc: NpcEntity, score: number }[] = [];

    allNpcs.forEach(otherNpc => {
        if (npc.id === otherNpc.id) return;

        let score = 0;
        const distance = Math.hypot(npc.x - otherNpc.x, npc.y - otherNpc.y);

        // Proximity (strongest factor)
        if (distance < 20) {
            score += (20 - distance) * 5; // Up to 100 points for being very close
        }

        // Shared Religion
        if (npc.religion && otherNpc.religion && npc.religion === otherNpc.religion) {
            score += 30;
        }

        // Shared Allegiance
        if (npc.allegianceGroup && otherNpc.allegianceGroup && npc.allegianceGroup === otherNpc.allegianceGroup && npc.allegianceGroup !== 'NEUTRAL') {
            score += 40;
        }
        
        // Shared Profession/Class
        if (npc.role === otherNpc.role) {
            score += 25;
        } else if (npc.class === otherNpc.class) {
            score += 15;
        }
        
        // Shared Workplace (very strong indicator of friendship)
        if (npc.workplaceId && otherNpc.workplaceId && npc.workplaceId === otherNpc.workplaceId) {
            score += 80;
        }
        
        // NEW: Add goal-based opinion modifier
        score += calculateGoalOpinionModifier(npc, otherNpc);


        friendScores.push({ npc: otherNpc, score });
    });

    // Sort by score and take top 2
    return friendScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(scored => scored.npc);
}

/**
 * Generates a plausible personal goal for an NPC based on their profile.
 * @param npc The NPC to generate a goal for.
 * @param noise A ValueNoise instance for randomness.
 * @returns A PersonalGoal object.
 */
export function generatePersonalGoal(npc: Partial<NpcEntity>, noise: ValueNoise): PersonalGoal {
    // This function is now located in services/goalService.ts
    // This is a deprecated placeholder to avoid breaking old imports.
    // In a future commit, all calls to this should be updated to goalService.generatePersonalGoal.
    return { type: 'PROTECT', archetype: 'PROTECT', targetType: 'CONCEPT', targetId: 'SELF', description: 'Survive.' } as any;
}

/**
 * Generates a family tree and a timeline of life events for an NPC.
 * @param npc The NPC to generate a history for.
 * @param allNpcs A list of all other NPCs on the map to check for potential spouses.
 * @param mapData The current map data.
 * @param noise A ValueNoise instance for randomness.
 * @returns An object containing the family tree and life events.
 */
export function generateNpcFamilyAndLifeEvents(
    npc: NpcEntity, 
    allNpcs: NpcEntity[], 
    mapData: MapData, 
    noise: ValueNoise
): { family: FamilyMember[], lifeEvents: LifeEvent[] } {
    const family: FamilyMember[] = [];
    const lifeEvents: LifeEvent[] = [];
    const currentYear = parseInt(mapData.timeSlice || "1650", 10);

    // Generate Parents
    const fatherName = generateNpcName('Male', npc.culturalZone, undefined, currentYear - npc.age - 25, noise);
    family.push({ name: fatherName, relation: 'father', profession: 'Farmer' });
    const motherName = generateNpcName('Female', npc.culturalZone, undefined, currentYear - npc.age - 25, noise);
    family.push({ name: motherName, relation: 'mother', profession: 'Homemaker' });
    lifeEvents.push({ year: currentYear - npc.age, event: `Born to ${fatherName} and ${motherName}.` });

    // Attempt to find a spouse and generate children
    if (npc.age > 20 && noise.random() > 0.4) { // 60% chance to be married if over 20
        let spouse: NpcEntity | null = null;
        const potentialSpouses = allNpcs.filter(other => 
            other.id !== npc.id &&
            other.gender !== npc.gender &&
            Math.abs(other.age - npc.age) < 8 &&
            !other.family.some(f => f.relation === 'spouse')
        );

        if (potentialSpouses.length > 0) {
            spouse = potentialSpouses[Math.floor(noise.random() * potentialSpouses.length)];
        }

        if (spouse) {
            const marriageYear = currentYear - Math.floor(noise.random() * (npc.age - 18));
            family.push({ name: spouse.name, relation: 'spouse', age: spouse.age, profession: spouse.role });
            lifeEvents.push({ year: marriageYear, event: `Married ${spouse.name}.` });

            // Generate children
            const yearsMarried = currentYear - marriageYear;
            const numChildren = yearsMarried > 5 ? Math.floor(noise.random() * 4) : 0;
            for (let i = 0; i < numChildren; i++) {
                const childAge = Math.floor(noise.random() * (yearsMarried - 1)) + 1;
                if (childAge < 1) continue;
                const childGender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
                const childName = generateNpcName(childGender, npc.culturalZone, undefined, currentYear - childAge, noise);
                const relation = childGender === 'Male' ? 'son' : 'daughter';
                family.push({ name: childName, relation, age: childAge });
                lifeEvents.push({ year: currentYear - childAge, event: `Had a ${relation}, ${childName}.` });
            }
        }
    }
    
    lifeEvents.sort((a, b) => a.year - b.year);
    return { family, lifeEvents };
}
