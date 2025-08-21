import { generateDmResponse } from './llmService';
import { PlayerCharacter, NpcEntity, AnimalEntity, MapData, Item, PlayerContext } from '../types';
import { TamedAnimal } from './animalTamingService';

interface NarrationContext {
    playerCharacter: PlayerCharacter;
    mapData?: MapData;
    inventory?: Item[];
    recentNpc?: NpcEntity;
    recentConversation?: string;
    currentZone?: string;
    currentRegion?: string;
    gameDate?: { year: number; month: number; day: number };
    timeOfDay?: string;
    playerX?: number;
    playerY?: number;
    currentTile?: any;
}

/**
 * Generate narration when clicking on a companion animal
 */
export async function generateCompanionNarration(
    animal: TamedAnimal,
    context: NarrationContext
): Promise<string> {
    const { playerCharacter, mapData, currentZone, timeOfDay, playerX = 0, playerY = 0, currentTile: providedTile } = context;
    
    const query = `Describe what my companion ${animal.type.toLowerCase()} named ${animal.name} is doing right now. The ${animal.type} is ${animal.loyalty > 70 ? 'happy and loyal' : animal.loyalty > 40 ? 'content' : 'anxious'}. Keep it to one short, vivid sentence (max 20 words).`;
    
    // Use the provided tile or try to get it from mapData
    const currentTile = providedTile || mapData?.tiles?.[playerY]?.[playerX] || null;
    
    // Create a PlayerContext for generateDmResponse
    const playerContext: PlayerContext = {
        playerCharacter,
        mapData: mapData || {} as MapData,
        npcs: [],
        animals: [],
        terrainStructures: [],
        playerX,
        playerY,
        viewMode: 'standard',
        interiorContext: null,
        currentTile,
        ambianceContext: {
            timeOfDay: timeOfDay || 'morning',
            climate: mapData?.climate || 'TEMPERATE',
            historicalEra: 'MEDIEVAL',
            season: 'SPRING',
            culturalZone: currentZone || 'EUROPEAN'
        }
    };

    try {
        console.log('[generateCompanionNarration] Calling generateDmResponse with query:', query);
        const response = await generateDmResponse(query, playerContext);
        console.log('[generateCompanionNarration] LLM response:', response);
        
        // Extract just the first sentence if multiple were returned
        const firstSentence = response.split(/[.!?]/)[0];
        return firstSentence ? firstSentence + '.' : `${animal.name} stays close by your side.`;
    } catch (error) {
        console.error('[generateCompanionNarration] Failed to generate companion narration:', error);
        return `${animal.name} stays close by your side.`;
    }
}

/**
 * Generate narration when clicking on the player character
 */
export async function generatePlayerThoughtNarration(
    context: NarrationContext
): Promise<string> {
    const { playerCharacter, inventory, recentNpc, recentConversation, currentZone, timeOfDay, mapData, playerX = 0, playerY = 0, currentTile: providedTile } = context;
    
    // Get most valuable or interesting items
    const notableItems = inventory?.slice(0, 3).map(i => i.name).join(', ') || 'nothing of note';
    
    const healthStatus = playerCharacter.health < playerCharacter.maxHealth * 0.3 ? 'badly wounded' :
                        playerCharacter.health < playerCharacter.maxHealth * 0.6 ? 'injured' : 'healthy';
    const fatigueStatus = playerCharacter.fatigue > playerCharacter.maxFatigue * 0.7 ? 'exhausted' :
                         playerCharacter.fatigue > playerCharacter.maxFatigue * 0.4 ? 'tired' : 'rested';
    
    let query = `What is ${playerCharacter.name} thinking right now? They are a ${playerCharacter.occupation} who is ${healthStatus} and ${fatigueStatus}.`;
    
    if (recentNpc) {
        query += ` They recently spoke with ${recentNpc.name}, a ${recentNpc.occupation}.`;
    }
    
    query += ` Write ONE brief inner thought in first person (max 20 words).`;
    
    // Use the provided tile or try to get it from mapData
    const currentTile = providedTile || mapData?.tiles?.[playerY]?.[playerX] || null;
    
    // Create a PlayerContext for generateDmResponse
    const playerContext: PlayerContext = {
        playerCharacter,
        mapData: mapData || {} as MapData,
        npcs: [],
        animals: [],
        terrainStructures: [],
        playerX,
        playerY,
        viewMode: 'standard',
        interiorContext: null,
        currentTile,
        ambianceContext: {
            timeOfDay: timeOfDay || 'morning',
            climate: mapData?.climate || 'TEMPERATE',
            historicalEra: 'MEDIEVAL',
            season: 'SPRING',
            culturalZone: currentZone || 'EUROPEAN'
        }
    };

    try {
        console.log('[generatePlayerThoughtNarration] Calling generateDmResponse with query:', query);
        const response = await generateDmResponse(query, playerContext);
        console.log('[generatePlayerThoughtNarration] LLM response:', response);
        
        // Extract just the first sentence and ensure it's in first person
        const firstSentence = response.split(/[.!?]/)[0];
        // If the response doesn't start with "I", prepend it
        const thought = firstSentence?.trim();
        if (thought && !thought.toLowerCase().startsWith('i ')) {
            console.log('[generatePlayerThoughtNarration] Response doesn\'t start with "I", using fallback');
            return "I wonder what lies ahead...";
        }
        return thought ? thought + '.' : "I wonder what lies ahead...";
    } catch (error) {
        console.error('[generatePlayerThoughtNarration] Failed to generate player thought narration:', error);
        return "The journey continues...";
    }
}

/**
 * Generate narration when entering a new map area
 */
export async function generateNewAreaNarration(
    fromDirection: 'north' | 'south' | 'east' | 'west',
    context: NarrationContext
): Promise<string> {
    const { playerCharacter, mapData, currentZone, currentRegion, timeOfDay, playerX = 0, playerY = 0, currentTile: providedTile } = context;
    
    // Analyze the new map for interesting features
    const features: string[] = [];
    if (mapData) {
        const hasCities = mapData.tiles.some(row => row.some(tile => 
            tile.biome === 'CITY_CENTER' || tile.biome === 'LOW_DENSITY_CITY'
        ));
        const hasWater = mapData.tiles.some(row => row.some(tile => !tile.isLand));
        const hasMountains = mapData.tiles.some(row => row.some(tile => 
            tile.altitude && tile.altitude > 0.7
        ));
        
        if (hasCities) features.push('settlements');
        if (hasWater) features.push('water');
        if (hasMountains) features.push('mountains');
    }
    
    const query = `I just entered a new area from the ${fromDirection}. ${features.length > 0 ? `I can see ${features.join(' and ')}.` : ''} Describe what catches my eye in one atmospheric sentence (max 25 words).`;
    
    // Use the provided tile or try to get it from mapData
    const currentTile = providedTile || mapData?.tiles?.[playerY]?.[playerX] || null;
    
    // Create a PlayerContext for generateDmResponse
    const playerContext: PlayerContext = {
        playerCharacter: playerCharacter || {} as PlayerCharacter,
        mapData: mapData || {} as MapData,
        npcs: [],
        animals: [],
        terrainStructures: [],
        playerX,
        playerY,
        viewMode: 'standard',
        interiorContext: null,
        currentTile,
        ambianceContext: {
            timeOfDay: timeOfDay || 'morning',
            climate: mapData?.climate || 'TEMPERATE',
            historicalEra: 'MEDIEVAL',
            season: 'SPRING',
            culturalZone: currentZone || 'EUROPEAN'
        }
    };

    try {
        const response = await generateDmResponse(query, playerContext);
        // Extract just the first sentence
        const firstSentence = response.split(/[.!?]/)[0];
        return firstSentence ? firstSentence + '.' : `The landscape changes as you travel ${fromDirection}.`;
    } catch (error) {
        console.error('Failed to generate new area narration:', error);
        return `The landscape changes as you travel ${fromDirection}.`;
    }
}

/**
 * Format recent conversation summary for context
 */
export function formatRecentConversation(
    npc: NpcEntity | null,
    conversationSummary: string | null
): { npc: NpcEntity | null; summary: string | null } {
    if (!npc || !conversationSummary) {
        return { npc: null, summary: null };
    }
    
    // Truncate to reasonable length for context
    const maxLength = 100;
    const summary = conversationSummary.length > maxLength 
        ? conversationSummary.substring(0, maxLength) + '...'
        : conversationSummary;
    
    return { npc, summary };
}