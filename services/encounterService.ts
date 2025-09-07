/**
 * services/encounterService.ts - Logic for generating encounter dialogue.
 */
import { GoogleGenAI } from "@google/genai";
import { AnimalEntity, NpcEntity, DialogueEntry, PlayerContext, PlayerCharacter, MapData } from '../types';
import { SpecialMapData, SpecialMapArchetype } from '../types/specialMapTypes';
import { generateEncounterDialogue as generateLlmDialogue } from './llmService';
import { REGION_SPECIFIC_DISTRICTS, CULTURAL_ZONE_DISTRICTS } from '../constants/gameData/governmentDistricts';
import { augmentGovernmentDistrict } from '../constants/specialMaps/specialMapAugmentation';

type EncounterableEntity = AnimalEntity | NpcEntity;

function isSpecialMapData(mapData: MapData | null): mapData is SpecialMapData {
    return !!(mapData && 'archetype' in mapData && 'displayName' in mapData);
}

/**
 * Get special map context for enhanced NPC behavior
 */
function getSpecialMapContext(mapData: SpecialMapData, npc: NpcEntity): {
    archetype: string;
    displayName: string;
    culturalZone: string;
    year: number;
    location: string;
    mapArea: string;
    districtType?: string;
    description?: string;
} {
    const year = parseInt(mapData.timeSlice || '1500');
    
    // Find the district info from government districts constant
    let districtInfo: any = null;
    
    // Look up the district data for additional context
    const regionDistricts = REGION_SPECIFIC_DISTRICTS[mapData.localArea];
    if (regionDistricts) {
        // Find matching era
        for (const era in regionDistricts) {
            const districts = regionDistricts[era];
            districtInfo = districts.find((d: any) => 
                d.archetype === mapData.archetype || 
                d.name === mapData.displayName
            );
            if (districtInfo) break;
        }
    }
    
    // Fallback to cultural zone districts if region-specific not found
    if (!districtInfo && mapData.culturalZone) {
        const cultureDistricts = CULTURAL_ZONE_DISTRICTS[mapData.culturalZone];
        if (cultureDistricts) {
            for (const era in cultureDistricts) {
                const districts = cultureDistricts[era];
                districtInfo = districts.find((d: any) => 
                    d.archetype === mapData.archetype
                );
                if (districtInfo) break;
            }
        }
    }
    
    return {
        archetype: mapData.archetype || 'ESTATES',
        displayName: mapData.displayName || 'Special Location',
        culturalZone: mapData.culturalZone || 'EUROPEAN',
        year: year,
        location: mapData.localArea || 'Unknown Location',
        mapArea: mapData.region || mapData.continent || 'Unknown Region',
        districtType: districtInfo?.districtType,
        description: districtInfo?.description
    };
}

/**
 * Main entry point for generating encounter dialogue.
 * Dispatches to the correct generator based on the target type and map context.
 */
export function generateEncounterDialogue(
    target: EncounterableEntity,
    history: DialogueEntry[] | string[],
    playerInput: string,
    playerCharacter: PlayerCharacter,
    allNpcs: NpcEntity[],
    mapData: MapData | null,
    useRealLanguage: boolean
): Promise<{ text: string, reputationChange?: number, shouldLeave?: boolean, shouldAttack?: boolean }> {
    
    // Check if this is a special map with enhanced context
    if (isSpecialMapData(mapData)) {
        const specialMapContext = getSpecialMapContext(mapData, target as NpcEntity);
        
        // Enhance the target with special map context
        const enhancedTarget = {
            ...target,
            specialMapContext: {
                ...specialMapContext,
                // Add role-specific context based on archetype
                ...(function() {
                    const npc = target as NpcEntity;
                    const isGuard = npc.profession?.toLowerCase().includes('guard') || 
                                   npc.profession?.toLowerCase().includes('soldier') || 
                                   npc.profession?.toLowerCase().includes('sentry');
                    
                    let roleContext = '';
                    let specialInstructions = '';
                    
                    const archetypeLower = (specialMapContext.archetype || '').toLowerCase();
                    switch (archetypeLower) {
                        case 'estates':
                            if (isGuard) {
                                roleContext = `You are a guard protecting this ${specialMapContext.displayName}. This is private property belonging to nobility.`;
                                specialInstructions = `- Challenge strangers and ask their business\n- Be suspicious of poorly dressed visitors\n- Protect your lord/lady's property and dignity`;
                            } else {
                                roleContext = `You work within the ${specialMapContext.displayName}, serving the noble household.`;
                            }
                            break;
                            
                        case 'government':
                        case 'government_forum':
                            if (isGuard) {
                                roleContext = `You are a guard at this ${specialMapContext.displayName} - the seat of local government.`;
                                specialInstructions = `- Ask visitors to state their official business\n- Check for proper papers or appointments\n- Watch for troublemakers or sedition`;
                            } else {
                                roleContext = `You are an official working in this ${specialMapContext.displayName}.`;
                            }
                            break;
                            
                        case 'sacred':
                        case 'sacred_complex':
                            roleContext = `You serve at this ${specialMapContext.displayName} - a sacred religious site.`;
                            specialInstructions = `- Ensure visitors show proper respect\n- Guide pilgrims appropriately\n- Watch for sacrilege or inappropriate behavior`;
                            break;
                            
                        case 'market':
                        case 'marketplace':
                            roleContext = `You work in this ${specialMapContext.displayName} - a center of commerce and trade.`;
                            specialInstructions = `- Know current market conditions\n- Watch for thieves and pickpockets\n- Understand trade and economic concerns`;
                            break;
                            
                        default:
                            // Fallback for unknown or null archetypes
                            roleContext = `You work in this ${specialMapContext.displayName || 'location'}.`;
                            specialInstructions = `- Perform your duties\n- Assist visitors appropriately`;
                            break;
                    }
                    
                    return { roleContext, specialInstructions };
                })()
            }
        } as any;
        
        return generateLlmDialogue(enhancedTarget, history, playerInput, playerCharacter, allNpcs, mapData, useRealLanguage);
    }
    
    // Regular encounter for non-special maps
    return generateLlmDialogue(target, history, playerInput, playerCharacter, allNpcs, mapData, useRealLanguage);
}