/**
 * constants/gameData/goals.ts - Defines potential goal targets for procedural NPC generation.
 */
import { GoalTarget } from '../../types';

export const GOAL_TARGETS: GoalTarget[] = [
    // --- ACQUIRE ---
    {
        id: 'FOOD_FOR_WINTER',
        targetType: 'RESOURCE',
        archetypes: ['ACQUIRE'],
        descriptionTemplate: "Acquire enough food to survive the coming winter.",
        constraints: { wealthLevels: ['poor', 'modest'] }
    },
    {
        id: 'MEDICINE_FOR_FAMILY',
        targetType: 'ITEM',
        archetypes: ['ACQUIRE'],
        descriptionTemplate: "Acquire rare herbs to create a medicine for a sick family member.",
        constraints: { hasFamily: true, wealthLevels: ['poor', 'modest'] }
    },
    {
        id: 'LAND_OWNERSHIP',
        targetType: 'LOCATION',
        archetypes: ['ACQUIRE', 'ASCEND'],
        descriptionTemplate: "Earn enough coin to purchase my own plot of land.",
        constraints: { classes: ['COMMONER'], socialContext: { minAmbition: 0.6 } }
    },
    {
        id: 'RARE_MATERIAL',
        targetType: 'ITEM',
        archetypes: ['ACQUIRE', 'CREATE'],
        descriptionTemplate: "Acquire a rare material to craft a masterwork.",
        constraints: { classes: ['ARTISAN'], socialContext: { minAmbition: 0.5 } }
    },
    {
        id: 'POLITICAL_OFFICE',
        targetType: 'CONCEPT',
        archetypes: ['ACQUIRE', 'ASCEND'],
        descriptionTemplate: "Gain enough influence to secure a minor political office.",
        constraints: { wealthLevels: ['comfortable', 'wealthy'], socialContext: { minAmbition: 0.8 } }
    },

    // --- PROTECT ---
    {
        id: 'PROTECT_FAMILY',
        targetType: 'NPC',
        archetypes: ['PROTECT'],
        descriptionTemplate: "Protect my family from the dangers of this world.",
        constraints: { hasFamily: true }
    },
    {
        id: 'PROTECT_VILLAGE',
        targetType: 'LOCATION',
        archetypes: ['PROTECT'],
        descriptionTemplate: "Defend my village from monsters and bandits.",
        constraints: { professions: ['Guard', 'Soldier'] }
    },
    {
        id: 'GUARD_HOLY_SITE',
        targetType: 'STRUCTURE',
        archetypes: ['PROTECT'],
        descriptionTemplate: "Guard the sanctity of the local holy site.",
        constraints: { socialContext: { minReligiosity: 0.7 } }
    },
    {
        id: 'PROTECT_HONOR',
        targetType: 'CONCEPT',
        archetypes: ['PROTECT'],
        descriptionTemplate: "Uphold my family's honor at all costs.",
        constraints: { beliefs: ['HONOR_IS_ALL'] }
    },

    // --- CREATE ---
    {
        id: 'CREATE_MASTERWORK',
        targetType: 'ITEM',
        archetypes: ['CREATE'],
        descriptionTemplate: "Create a masterwork that will bring renown to my craft.",
        constraints: { classes: ['ARTISAN'], personality: { minConscientiousness: 0.7 } }
    },
    {
        id: 'BUILD_A_HOME',
        targetType: 'STRUCTURE',
        archetypes: ['CREATE', 'PROTECT'],
        descriptionTemplate: "Build a sturdy home for my family.",
        constraints: { hasFamily: true, professions: ['Carpenter', 'Mason', 'Laborer'] }
    },

    // --- DISCOVER ---
    {
        id: 'DISCOVER_RUINS',
        targetType: 'LOCATION',
        archetypes: ['DISCOVER'],
        descriptionTemplate: "Discover a forgotten ruin said to be in the nearby wilds.",
        constraints: { personality: { minOpenness: 0.8 }, socialContext: { minWanderlust: 0.7 } }
    },
    {
        id: 'DISCOVER_TRUTH',
        targetType: 'CONCEPT',
        archetypes: ['DISCOVER'],
        descriptionTemplate: "Uncover the truth behind a local mystery.",
        constraints: { professions: ['Scholar', 'Scribe'], stats: { minIntelligence: 7 } }
    },

    // --- ASCEND ---
    {
        id: 'JOIN_GUILD',
        targetType: 'FACTION',
        archetypes: ['ASCEND'],
        descriptionTemplate: "Prove my skill and be accepted into the local guild.",
        constraints: { classes: ['ARTISAN'], socialContext: { minAmbition: 0.6 } }
    },
    {
        id: 'GAIN_FAVOR',
        targetType: 'NPC',
        archetypes: ['ASCEND'],
        descriptionTemplate: "Gain the favor of the local lord.",
        constraints: { classes: ['COMMONER', 'ARTISAN'], socialContext: { minAmbition: 0.7, maxPrivilege: 0.6 } }
    },

    // --- AVENGE ---
    {
        id: 'AVENGE_FAMILY',
        targetType: 'NPC',
        archetypes: ['AVENGE'],
        descriptionTemplate: "Avenge the death of a family member.",
        constraints: { beliefs: ['VENGEANCE_IS_A_DUTY'], personality: { maxAgreeableness: 0.3 } }
    }
];