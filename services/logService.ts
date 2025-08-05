/**
 * services/logService.ts - A service for creating standardized gamelog entries.
 */
import { GameLogEntry, GameLogEntryType, GameDate, SkillResult, EncounterableEntity, DialogueEntry, Item } from '../types';

let logIdCounter = 0;

const createLogEntry = (
    type: GameLogEntryType, 
    icon: string, 
    summary: string, 
    gameDate: GameDate, 
    timeString: string, 
    details?: any
): GameLogEntry => ({
    id: `log-${Date.now()}-${logIdCounter++}`,
    timestamp: { ...gameDate },
    timeString,
    type,
    icon,
    summary,
    details,
});

export const LogService = {
    createDialogueLog: (
        npc: EncounterableEntity, 
        location: string, 
        date: GameDate, 
        time: string, 
        history: DialogueEntry[]
    ): GameLogEntry => createLogEntry(
        'DIALOGUE', '💬', `Spoke to ${'name' in npc ? npc.name : npc.speciesName} in ${location}.`, date, time, history
    ),

    createCombatLog: (
        opponentName: string, 
        location: string, 
        outcome: 'victory' | 'defeat' | 'fled', 
        date: GameDate, 
        time: string, 
        combatDetails: object
    ): GameLogEntry => createLogEntry(
        'COMBAT', '⚔️', `Combat with ${opponentName} in ${location} ended in ${outcome}.`, date, time, combatDetails
    ),

    createMapEntryLog: (
        direction: string, 
        mapName: string, 
        date: GameDate, 
        time: string
    ): GameLogEntry => createLogEntry(
        'MAP_ENTRY', '🗺️', `Travelled ${direction} to ${mapName}.`, date, time
    ),

    createSkillUseLog: (
        skillName: string, 
        resultMessage: string, 
        location: string, 
        date: GameDate, 
        time: string
    ): GameLogEntry => createLogEntry(
        'SKILL_USE', '🛠️', `Used ${skillName} in ${location}: ${resultMessage}`, date, time
    ),
    
    createItemAcquiredLog: (
        itemName: string,
        quantity: number,
        source: string, // e.g., "from a chest", "by trading"
        date: GameDate,
        time: string
    ): GameLogEntry => createLogEntry(
        'ITEM_ACQUIRED', '✨', `Acquired ${quantity}x ${itemName} ${source}.`, date, time
    ),
    
    createTradeLog: (
        action: 'Bought' | 'Sold',
        item: Item,
        price: number,
        location: string,
        date: GameDate,
        time: string
    ): GameLogEntry => createLogEntry(
        'TRADE', '💰', `${action} ${item.quantity}x ${item.name} for ${price} coin(s) in ${location}.`, date, time
    )
};
