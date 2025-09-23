/**
 * services/goalService.ts - Manages the procedural generation of NPC personal goals.
 */
import { GoalTarget, GoalArchetype, GoalConstraint, NpcEntity, PersonalGoal } from '../types';
import { GOAL_TARGETS } from '../constants/gameData/goals';
import { ValueNoise } from '../utils/noise';

function checkConstraints(npc: Partial<NpcEntity>, constraints: GoalConstraint): boolean {
    const { professions, classes, wealthLevels, beliefs, personality, socialContext, hasFamily, stats } = constraints;

    if (professions && npc.role && !professions.includes(npc.role)) return false;
    if (classes && npc.class && !classes.includes(npc.class)) return false;
    if (wealthLevels && npc.wealthLevel && !wealthLevels.includes(npc.wealthLevel)) return false;
    if (hasFamily && (!npc.family || npc.family.length === 0)) return false;

    if (beliefs && npc.beliefs) {
        if (!beliefs.some(b => npc.beliefs!.some(npcB => npcB.beliefId === b))) return false;
    }

    if (personality && npc.personality) {
        for (const key in personality) {
            const trait = key as keyof typeof personality;
            const npcValue = npc.personality[trait.replace(/min|max/, '').toLowerCase() as keyof typeof npc.personality]!;
            if (trait.startsWith('min') && npcValue < personality[trait]!) return false;
            if (trait.startsWith('max') && npcValue > personality[trait]!) return false;
        }
    }
    
    if (stats && npc.stats) {
        for (const key in stats) {
            const trait = key as keyof typeof stats;
            const npcValue = npc.stats[trait.replace(/min|max/, '').toLowerCase() as keyof typeof npc.stats]!;
            if (trait.startsWith('min') && npcValue < stats[trait]!) return false;
            if (trait.startsWith('max') && npcValue > stats[trait]!) return false;
        }
    }
    
    if (socialContext && npc.socialContext) {
         for (const key in socialContext) {
            const trait = key as keyof typeof socialContext;
            const npcValue = npc.socialContext[trait as keyof typeof npc.socialContext]!;
            if (trait.startsWith('min') && npcValue < socialContext[trait]!) return false;
            if (trait.startsWith('max') && npcValue > socialContext[trait]!) return false;
        }
    }

    return true;
}

export function generatePersonalGoal(npc: Partial<NpcEntity>, noise: ValueNoise): PersonalGoal {
    if (!npc.stats || !npc.personality || !npc.socialContext) {
        return { archetype: 'PROTECT', targetType: 'CONCEPT', targetId: 'SELF', description: 'Survive.' };
    }

    // 1. Calculate archetype weights
    const weights: Record<GoalArchetype, number> = {
        ACQUIRE: 10, PROTECT: 10, CREATE: 5, DISCOVER: 5, ASCEND: 5, AVENGE: 1
    };

    if (npc.wealthLevel === 'poor' || npc.wealthLevel === 'modest') weights.ACQUIRE += 20;
    if (npc.socialContext?.ambition > 0.7) weights.ASCEND += 25;
    if (npc.socialContext?.privilege < 0.3) weights.ASCEND += 10;
    if (npc.class === 'ARTISAN' || (npc.stats.craftiness > 7)) weights.CREATE += 20;
    if (npc.personality.openness > 0.8 || npc.socialContext?.wanderlust > 0.7) weights.DISCOVER += 20;
    if (npc.family && npc.family.length > 0) weights.PROTECT += 25;
    if (npc.personality.agreeableness < 0.2) weights.AVENGE += 15;
    if (npc.allegianceGroup && npc.allegianceGroup !== 'Neutral') weights.PROTECT += 10;
    
    // 2. Filter possible goals
    const possibleGoals = GOAL_TARGETS.filter(goal => checkConstraints(npc, goal.constraints));

    if (possibleGoals.length === 0) {
        return { archetype: 'PROTECT', targetType: 'CONCEPT', targetId: 'SELF', description: 'Provide for my family and live a peaceful life.' };
    }

    // 3. Select an archetype based on weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let roll = noise.random() * totalWeight;
    let chosenArchetype: GoalArchetype = 'PROTECT';

    for (const archetype in weights) {
        roll -= weights[archetype as GoalArchetype];
        if (roll <= 0) {
            chosenArchetype = archetype as GoalArchetype;
            break;
        }
    }

    // 4. Find a goal that matches the chosen archetype
    let matchingGoals = possibleGoals.filter(g => g.archetypes.includes(chosenArchetype));
    
    // Fallback if no exact match
    if (matchingGoals.length === 0) {
        matchingGoals = possibleGoals;
        chosenArchetype = matchingGoals[0].archetypes[0];
    }
    
    const chosenGoal = matchingGoals[Math.floor(noise.random() * matchingGoals.length)];

    if (!chosenGoal) { // Absolute fallback
        console.warn("[Goal Service] Could not select a goal despite fallbacks. Returning survival goal.");
        return { archetype: 'PROTECT', targetType: 'CONCEPT', targetId: 'SELF', description: 'Survive and see another day.' };
    }

    return {
        archetype: chosenArchetype,
        targetType: chosenGoal.targetType,
        targetId: chosenGoal.id,
        description: chosenGoal.descriptionTemplate,
    };
}