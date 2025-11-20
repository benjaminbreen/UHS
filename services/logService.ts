/**
 * services/logService.ts - A service for creating standardized gamelog entries.
 */
import { GameLogEntry, GameLogEntryType, GameLogCategory, GameDate, SkillResult, EncounterableEntity, DialogueEntry, Item } from '../types';

let logIdCounter = 0;

/**
 * Enhanced log entry creation with contextual data
 */
interface LogOptions {
    location?: string;
    npcsInvolved?: string[];
    timeOfDay?: string;
    tags?: string[];
    category?: GameLogCategory;
    educationalValue?: number;
}

const createLogEntry = (
    type: GameLogEntryType,
    icon: string,
    summary: string,
    gameDate: GameDate,
    timeString: string,
    details?: any,
    options?: LogOptions
): GameLogEntry => ({
    id: `log-${Date.now()}-${logIdCounter++}`,
    timestamp: { ...gameDate },
    timeString,
    type,
    icon,
    summary,
    details,
    location: options?.location,
    npcsInvolved: options?.npcsInvolved,
    timeOfDay: options?.timeOfDay,
    tags: options?.tags,
    category: options?.category,
    educationalValue: options?.educationalValue,
});

export const LogService = {
    createDialogueLog: (
        npc: EncounterableEntity,
        location: string,
        date: GameDate,
        time: string,
        history: DialogueEntry[],
        timeOfDay?: string
    ): GameLogEntry => {
        const npcName = 'name' in npc ? npc.name : npc.speciesName;
        return createLogEntry(
            'DIALOGUE',
            '💬',
            `Spoke to ${npcName} in ${location}.`,
            date,
            time,
            history,
            {
                location,
                npcsInvolved: [npcName],
                timeOfDay,
                category: 'social',
                tags: ['dialogue', 'npc', 'conversation'],
            }
        );
    },

    createCombatLog: (
        opponentName: string,
        location: string,
        outcome: 'victory' | 'defeat' | 'fled',
        date: GameDate,
        time: string,
        combatDetails: object,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'COMBAT',
        '⚔️',
        `Combat with ${opponentName} in ${location} ended in ${outcome}.`,
        date,
        time,
        combatDetails,
        {
            location,
            npcsInvolved: [opponentName],
            timeOfDay,
            category: 'combat',
            tags: ['combat', outcome, opponentName.toLowerCase()],
        }
    ),

    createMapEntryLog: (
        direction: string,
        mapName: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'MAP_ENTRY',
        '🗺️',
        `Travelled ${direction} to ${mapName}.`,
        date,
        time,
        undefined,
        {
            location: mapName,
            timeOfDay,
            category: 'exploration',
            tags: ['travel', 'exploration', direction],
        }
    ),

    createSkillUseLog: (
        skillName: string,
        resultMessage: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'SKILL_USE',
        '🛠️',
        `Used ${skillName} in ${location}: ${resultMessage}`,
        date,
        time,
        undefined,
        {
            location,
            timeOfDay,
            category: 'survival',
            tags: ['skill', skillName.toLowerCase()],
        }
    ),

    createItemAcquiredLog: (
        itemName: string,
        quantity: number,
        source: string,
        date: GameDate,
        time: string,
        location?: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'ITEM_ACQUIRED',
        '✨',
        `Acquired ${quantity}x ${itemName} ${source}.`,
        date,
        time,
        undefined,
        {
            location,
            timeOfDay,
            category: 'exploration',
            tags: ['item', 'loot', itemName.toLowerCase()],
        }
    ),

    createTradeLog: (
        action: 'Bought' | 'Sold',
        item: Item,
        price: number,
        location: string,
        date: GameDate,
        time: string,
        npcName?: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'TRADE',
        '💰',
        `${action} ${item.quantity}x ${item.name} for ${price} coin(s) in ${location}.`,
        date,
        time,
        undefined,
        {
            location,
            npcsInvolved: npcName ? [npcName] : undefined,
            timeOfDay,
            category: 'trade',
            tags: ['trade', action.toLowerCase(), item.name.toLowerCase()],
        }
    ),

    createQuestStartLog: (
        questName: string,
        location: string,
        date: GameDate,
        time: string,
        npcName?: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'QUEST_START',
        '📜',
        `Started quest "${questName}" in ${location}.`,
        date,
        time,
        undefined,
        {
            location,
            npcsInvolved: npcName ? [npcName] : undefined,
            timeOfDay,
            category: 'progression',
            tags: ['quest', 'start', questName.toLowerCase()],
        }
    ),

    createQuestCompleteLog: (
        questName: string,
        location: string,
        date: GameDate,
        time: string,
        rewards?: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'QUEST_COMPLETE',
        '✅',
        `Completed quest "${questName}" in ${location}.${rewards ? ` Rewards: ${rewards}` : ''}`,
        date,
        time,
        undefined,
        {
            location,
            timeOfDay,
            category: 'progression',
            tags: ['quest', 'complete', 'achievement', questName.toLowerCase()],
        }
    ),

    // MILESTONE EVENTS
    createMilestoneFirstKillLog: (
        opponentName: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'MILESTONE_COMBAT',
        '💀',
        `First successful hunt: defeated ${opponentName} in ${location}.`,
        date,
        time,
        undefined,
        {
            location,
            npcsInvolved: [opponentName],
            timeOfDay,
            category: 'combat',
            tags: ['milestone', 'combat', 'first-kill'],
        }
    ),

    createMilestoneNpcKillLog: (
        npcName: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'MILESTONE_COMBAT',
        '⚔️',
        `Killed ${npcName} in ${location}.`,
        date,
        time,
        undefined,
        {
            location,
            npcsInvolved: [npcName],
            timeOfDay,
            category: 'combat',
            tags: ['milestone', 'combat', 'npc-kill'],
        }
    ),

    createMilestoneAreasExploredLog: (
        areaCount: number,
        currentArea: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'MILESTONE_EXPLORATION',
        '🗺️',
        `Explored ${areaCount} different areas. Currently in ${currentArea}.`,
        date,
        time,
        undefined,
        {
            location: currentArea,
            timeOfDay,
            category: 'exploration',
            tags: ['milestone', 'exploration', 'areas'],
        }
    ),

    createMilestoneVipMeetingLog: (
        vipName: string,
        vipTitle: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'MILESTONE_ACHIEVEMENT',
        '👑',
        `Met ${vipTitle} ${vipName} in ${location}.`,
        date,
        time,
        undefined,
        {
            location,
            npcsInvolved: [vipName],
            timeOfDay,
            category: 'social',
            tags: ['milestone', 'vip', 'meeting'],
        }
    ),

    // ============================================
    // PHASE 2: NEW EDUCATIONAL LOG TYPES
    // ============================================

    /**
     * Log when player opens/reads a primary source
     */
    createPrimarySourceReadLog: (
        sourceTitle: string,
        author: string,
        year: number,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'PRIMARY_SOURCE_READ',
        '📖',
        `Read primary source: "${sourceTitle}" by ${author} (${year}).`,
        date,
        time,
        { sourceTitle, author, year },
        {
            location,
            timeOfDay,
            category: 'education',
            tags: ['primary-source', 'reading', 'education'],
            educationalValue: 70,
        }
    ),

    /**
     * Log when player adds a quote to journal
     */
    createPrimarySourceQuotedLog: (
        sourceTitle: string,
        author: string,
        quote: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'PRIMARY_SOURCE_QUOTED',
        '✍️',
        `Added quote from "${sourceTitle}" to journal.`,
        date,
        time,
        { sourceTitle, author, quote },
        {
            location,
            timeOfDay,
            category: 'education',
            tags: ['primary-source', 'quote', 'journal', 'education'],
            educationalValue: 90,
        }
    ),

    /**
     * Log when player makes a meaningful dialogue choice
     */
    createDialogueChoiceLog: (
        npcName: string,
        choiceText: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'DIALOGUE_CHOICE',
        '🗣️',
        `Made decision in conversation with ${npcName}: "${choiceText}"`,
        date,
        time,
        { npcName, choiceText },
        {
            location,
            npcsInvolved: [npcName],
            timeOfDay,
            category: 'social',
            tags: ['dialogue', 'choice', 'decision'],
        }
    ),

    /**
     * Log when player has an educational insight/discovery
     */
    createLearningMomentLog: (
        insight: string,
        context: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'LEARNING_MOMENT',
        '💡',
        `Learning moment: ${insight}`,
        date,
        time,
        { insight, context },
        {
            location,
            timeOfDay,
            category: 'education',
            tags: ['learning', 'insight', 'education'],
            educationalValue: 80,
        }
    ),

    /**
     * Log when player discovers historical artifact or learns historical fact
     */
    createHistoricalDiscoveryLog: (
        discoveryName: string,
        description: string,
        historicalPeriod: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => createLogEntry(
        'HISTORICAL_DISCOVERY',
        '🏛️',
        `Historical discovery: ${discoveryName}`,
        date,
        time,
        { discoveryName, description, historicalPeriod },
        {
            location,
            timeOfDay,
            category: 'education',
            tags: ['discovery', 'history', 'artifact', 'education'],
            educationalValue: 85,
        }
    ),

    /**
     * Log when player enters a special location (fortress, palace, market, etc.)
     */
    createLocationEntryLog: (
        locationType: string,
        locationName: string,
        leader: string | null,
        parentLocation: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => {
        const leaderText = leader ? ` (ruled by ${leader})` : '';
        const summary = `Entered ${locationName}${leaderText} in ${parentLocation}.`;

        return createLogEntry(
            'LOCATION_ENTRY',
            locationType.includes('FORTRESS') ? '🏰' :
            locationType.includes('PALACE') ? '👑' :
            locationType.includes('MARKET') ? '🏪' :
            locationType.includes('GOVERNMENT') ? '⚖️' :
            locationType.includes('SACRED') || locationType.includes('HOLY') ? '⛪' :
            locationType.includes('UNIVERSITY') ? '📚' :
            locationType.includes('ARENA') || locationType.includes('THEATER') ? '🎭' :
            locationType.includes('WORKSHOP') ? '🔨' : '🏛️',
            summary,
            date,
            time,
            { locationType, locationName, leader, parentLocation },
            {
                location: parentLocation,
                npcsInvolved: leader ? [leader] : undefined,
                timeOfDay,
                category: 'exploration',
                tags: ['location', 'entry', locationType.toLowerCase(), 'exploration'],
                educationalValue: 60,
            }
        );
    },

    /**
     * Log when player enters a specific building
     */
    createBuildingEntryLog: (
        buildingName: string,
        buildingType: string,
        ownerName: string | null,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => {
        const ownerText = ownerName ? ` (owned by ${ownerName})` : '';
        const summary = `Entered ${buildingName}${ownerText} in ${location}.`;

        return createLogEntry(
            'BUILDING_ENTRY',
            buildingType.toLowerCase().includes('shop') ? '🏪' :
            buildingType.toLowerCase().includes('house') ? '🏠' :
            buildingType.toLowerCase().includes('workshop') ? '🔨' :
            buildingType.toLowerCase().includes('inn') ? '🍺' : '🏢',
            summary,
            date,
            time,
            { buildingName, buildingType, ownerName },
            {
                location,
                npcsInvolved: ownerName ? [ownerName] : undefined,
                timeOfDay,
                category: 'exploration',
                tags: ['building', 'entry', buildingType.toLowerCase()],
                educationalValue: 40,
            }
        );
    },

    /**
     * Log when player opens a container
     */
    createContainerOpenedLog: (
        containerType: string,
        itemsFound: string[],
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => {
        const itemList = itemsFound.length > 0
            ? ` Found: ${itemsFound.slice(0, 3).join(', ')}${itemsFound.length > 3 ? '...' : ''}.`
            : ' It was empty.';
        const summary = `Opened a ${containerType} in ${location}.${itemList}`;

        return createLogEntry(
            'CONTAINER_OPENED',
            containerType.toLowerCase().includes('chest') ? '📦' :
            containerType.toLowerCase().includes('barrel') ? '🛢️' :
            containerType.toLowerCase().includes('crate') ? '📦' : '🗄️',
            summary,
            date,
            time,
            { containerType, itemsFound, itemCount: itemsFound.length },
            {
                location,
                timeOfDay,
                category: 'exploration',
                tags: ['container', 'loot', containerType.toLowerCase()],
                educationalValue: 20,
            }
        );
    },

    /**
     * Log when player encounters an NPC
     */
    createNpcEncounterLog: (
        npcName: string,
        npcRole: string | null,
        encounterType: 'met' | 'spotted' | 'confronted',
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => {
        const roleText = npcRole ? ` (${npcRole})` : '';
        const actionVerb = encounterType === 'met' ? 'Met' :
                          encounterType === 'spotted' ? 'Spotted' : 'Confronted by';
        const summary = `${actionVerb} ${npcName}${roleText} in ${location}.`;

        return createLogEntry(
            'NPC_ENCOUNTER',
            encounterType === 'confronted' ? '⚠️' : '👤',
            summary,
            date,
            time,
            { npcName, npcRole, encounterType },
            {
                location,
                npcsInvolved: [npcName],
                timeOfDay,
                category: 'social',
                tags: ['npc', 'encounter', encounterType],
                educationalValue: 30,
            }
        );
    },

    /**
     * Log when player accepts a work task
     */
    createWorkTaskAcceptedLog: (
        taskDescription: string,
        taskType: string,
        payment: number,
        npcName: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => {
        const summary = `Accepted work task from ${npcName}: "${taskDescription}" (${payment} coins).`;

        return createLogEntry(
            'WORK_TASK_ACCEPTED',
            '📋',
            summary,
            date,
            time,
            { taskDescription, taskType, payment, npcName },
            {
                location,
                npcsInvolved: [npcName],
                timeOfDay,
                category: 'progression',
                tags: ['work', 'task', 'accepted', taskType.toLowerCase()],
                educationalValue: 50,
            }
        );
    },

    /**
     * Log when player completes a work task
     */
    createWorkTaskCompletedLog: (
        taskDescription: string,
        taskType: string,
        payment: number,
        npcName: string,
        location: string,
        date: GameDate,
        time: string,
        timeOfDay?: string
    ): GameLogEntry => {
        const summary = `Completed work task for ${npcName}: "${taskDescription}" (+${payment} coins).`;

        return createLogEntry(
            'WORK_TASK_COMPLETED',
            '✅',
            summary,
            date,
            time,
            { taskDescription, taskType, payment, npcName },
            {
                location,
                npcsInvolved: [npcName],
                timeOfDay,
                category: 'progression',
                tags: ['work', 'task', 'completed', taskType.toLowerCase()],
                educationalValue: 60,
            }
        );
    },
};
