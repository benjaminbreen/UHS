/**
 * services/encounterService.ts - Logic for generating encounter dialogue.
 */
import { GoogleGenAI } from "@google/genai";
import { AnimalEntity, NpcEntity, DialogueEntry, PlayerContext, PlayerCharacter, MapData } from '../types';
import { SpecialMapData, SpecialMapArchetype } from '../types/specialMapTypes';
import { generateEncounterDialogue as generateLlmDialogue } from './llmService';
import { REGION_SPECIFIC_DISTRICTS, CULTURAL_ZONE_DISTRICTS } from '../constants/gameData/governmentDistricts';
// Removed unused import of specialMapAugmentation

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

/**
 * Theft attempt result interface
 */
export interface TheftAttempt {
  success: boolean;
  detected: boolean;
  stolenItem?: any; // Item type from inventory
  npcEscaped: boolean;
  reputationLoss: number;
  dialogueText: string;
}

/**
 * Execute a complete theft attempt by an NPC
 */
export function attemptTheft(
  npc: NpcEntity, 
  playerCharacter: PlayerCharacter
): TheftAttempt {
  
  // Calculate theft success chance based on stats
  const npcDexterity = npc.dexterity || 10;
  const playerPerception = playerCharacter.stats.perception || 10;
  const npcTheftSkill = npc.occupation?.toLowerCase().includes('thief') ? 5 : 0;
  
  // Calculate base probabilities
  const theftChance = Math.min(0.8, 
    (npcDexterity + npcTheftSkill - playerPerception + 10) / 30
  );
  
  const detectionChance = Math.min(0.9,
    (playerPerception - npcDexterity + 15) / 25
  );
  
  // Roll for success and detection
  const success = Math.random() < theftChance;
  const detected = Math.random() < detectionChance;
  
  let stolenItem: any = undefined;
  let reputationLoss = 0;
  let dialogueText = '';
  
  if (success && playerCharacter.inventory && playerCharacter.inventory.length > 0) {
    // Choose item to steal (prefer valuable items)
    const valuableItems = playerCharacter.inventory.filter(item => 
      item.value && item.value > 10 && 
      item.name !== 'Basic Clothing' && 
      !item.name.toLowerCase().includes('equipped')
    );
    
    const targetItems = valuableItems.length > 0 ? valuableItems : playerCharacter.inventory;
    const randomIndex = Math.floor(Math.random() * targetItems.length);
    stolenItem = targetItems[randomIndex];
    
    // Remove from player inventory
    const itemIndex = playerCharacter.inventory.findIndex(item => 
      item.id === stolenItem.id || 
      (item.name === stolenItem.name && item.value === stolenItem.value)
    );
    
    if (itemIndex !== -1) {
      playerCharacter.inventory.splice(itemIndex, 1);
      
      // Add to NPC inventory
      if (!npc.inventory) npc.inventory = [];
      npc.inventory.push(stolenItem);
    }
  }
  
  // Handle different outcome scenarios
  if (detected && success) {
    // Caught red-handed with stolen item
    reputationLoss = 15;
    dialogueText = `You catch ${npc.name} red-handed stealing your ${stolenItem?.name}! "I... I was just looking at it!" they stammer before trying to flee.`;
  } else if (detected && !success) {
    // Caught attempting but failed
    reputationLoss = 5;
    dialogueText = `You notice ${npc.name}'s hand reaching for your belongings! "What do you think you're doing?" you demand. They pull back quickly, looking embarrassed.`;
  } else if (!detected && success) {
    // Successful undetected theft
    dialogueText = `${npc.name} chats with you casually about the weather while subtly examining your belongings. You notice nothing amiss at the time...`;
  } else {
    // Failed undetected attempt
    dialogueText = `${npc.name} approaches you with a friendly greeting, lingering a bit longer than usual before continuing on their way.`;
  }
  
  // Apply reputation loss
  if (detected && reputationLoss > 0) {
    playerCharacter.reputation = Math.max(0, (playerCharacter.reputation || 50) - reputationLoss);
    if (playerCharacter.mapReputation) {
      playerCharacter.mapReputation = Math.max(0, playerCharacter.mapReputation - reputationLoss);
    }
  }
  
  const npcEscaped = success && !detected; // They escape if successful and undetected
  
  return {
    success,
    detected,
    stolenItem,
    npcEscaped,
    reputationLoss,
    dialogueText
  };
}

/**
 * Handle post-theft player actions (pursue, forgive, etc.)
 */
export function handleTheftResponse(
  action: 'pursue' | 'forgive' | 'confront',
  npc: NpcEntity,
  playerCharacter: PlayerCharacter,
  theftResult: TheftAttempt
): string {
  
  switch (action) {
    case 'pursue':
      if (theftResult.npcEscaped) {
        return `You give chase, but ${npc.name} has already melted into the crowd. Your ${theftResult.stolenItem?.name} is gone.`;
      } else {
        return `You grab ${npc.name} by the arm. "Give that back!" you demand. They reluctantly return your ${theftResult.stolenItem?.name}.`;
      }
      
    case 'forgive':
      // Slight reputation gain for showing mercy
      playerCharacter.reputation = Math.min(100, (playerCharacter.reputation || 50) + 2);
      return `You decide to show mercy. "${npc.name}, I forgive you this time, but don't let me catch you again." They look surprised and grateful.`;
      
    case 'confront':
      if (theftResult.detected) {
        return `"I saw what you were trying to do," you say sternly. ${npc.name} looks ashamed. "I'm sorry, I was desperate. Times are hard."`;
      } else {
        return `"Something doesn't feel right about our interaction," you say suspiciously. ${npc.name} tries to look innocent but avoids your gaze.`;
      }
      
    default:
      return `You're not sure how to respond to ${npc.name}'s behavior.`;
  }
}