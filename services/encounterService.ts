/**
 * services/encounterService.ts - Logic for generating encounter dialogue.
 */
import { GoogleGenAI } from "@google/genai";
import { AnimalEntity, NpcEntity, DialogueEntry, PlayerContext, PlayerCharacter, MapData } from '../types';
import { SpecialMapData, SpecialMapArchetype } from '../types/specialMapTypes';
import { generateEncounterDialogue as generateLlmDialogue } from './llmService';
import type { HistoryLensMessage } from '../types/historyLens';
import { REGION_SPECIFIC_DISTRICTS, CULTURAL_ZONE_DISTRICTS } from '../constants/gameData/governmentDistricts';
import { calculateDiseaseGameplayRestrictions } from './diseaseProgressionService';
import { getWorkOffersForNpc, removeWorkOffer } from './workOfferStorage';
import { completeWorkOffer } from './workOfferService';
import { removeItemFromInventory } from '../utils/inventoryUtils';
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
    useRealLanguage: boolean,
    historyLensContext?: HistoryLensMessage[]
): Promise<{ text: string, reputationChange?: number, shouldLeave?: boolean, shouldAttack?: boolean }> {

    // Check for completed work offers when conversation starts
    if ('id' in target && target.id) {
        const workOffers = getWorkOffersForNpc(target.id);
        const completedOffer = workOffers.find(offer => offer.completed && offer.accepted && !offer.failed);

        if (completedOffer) {
            // Player is talking to the NPC who gave them work - they exist!
            // No need to validate NPC existence since we're literally interacting with them.
            // The work offer system already ensures players can only collect payment from
            // the specific NPC who gave them the work (via target.id matching).

            // ANTI-EXPLOIT: Verify required items were actually removed
            // Items should have been removed when task completed in useCoreLoops
            // If player still has them, it indicates a potential exploit or bug
            if (completedOffer.requiredItem && playerCharacter.inventory) {
                const stillHasItems = playerCharacter.inventory.some(item =>
                    item.name.toLowerCase() === completedOffer.requiredItem?.toLowerCase() &&
                    item.quantity >= (completedOffer.requiredQuantity || 1)
                );

                if (stillHasItems) {
                    // Suspicious! Items weren't removed. Log warning
                    console.warn(
                        '[WORK EXPLOIT DETECTED] Player still has required items at payment time.',
                        'Work ID:', completedOffer.id,
                        'Required:', completedOffer.requiredItem,
                        'Quantity:', completedOffer.requiredQuantity
                    );

                    // Remove the items now (they should have been removed at completion)
                    const result = removeItemFromInventory(
                        playerCharacter.inventory,
                        completedOffer.requiredItem,
                        completedOffer.requiredQuantity || 1
                    );

                    // Update inventory with the corrected inventory
                    playerCharacter.inventory = result.inventory;

                    // Still pay them, but log the exploit attempt
                    console.warn(
                        `[WORK] Items removed at payment (should have been removed earlier). ` +
                        `Removed ${result.removedIds.length} item stacks`
                    );
                }
            }

            // Remove the work offer
            removeWorkOffer(completedOffer.id);

            // Return payment dialogue with data for EncounterModalUpdated to process
            const npc = target as NpcEntity;
            const paymentMessage = `Excellent work, ${playerCharacter.name}! I can see you've completed the task. Here's your payment of ${completedOffer.payment} coins as promised.`;

            // Calculate NPC trust boost based on payment (higher pay = harder task = more trust)
            const trustBoost = Math.min(30, Math.floor(completedOffer.payment / 2) + 15); // 15-30 trust boost

            return Promise.resolve({
                text: paymentMessage,
                reputationChange: 5, // Area reputation boost (kept small)
                npcTrustChange: trustBoost, // Significant NPC-specific trust boost
                coinsEarned: completedOffer.payment,
                workTaskCompleted: {
                    taskDescription: completedOffer.description,
                    taskType: completedOffer.taskType,
                    payment: completedOffer.payment,
                    npcName: npc.name,
                    trustGained: trustBoost
                }
            } as any);
        }
    }

    // Calculate disease visibility for NPC reactions
    const diseaseRestrictions = calculateDiseaseGameplayRestrictions(playerCharacter?.diseaseHealth);
    const playerIllnessLevel = diseaseRestrictions.socialAvoidanceLevel;
    const visibleSymptoms = diseaseRestrictions.symptomDescription;

    // Disease-based interaction modifications
    let diseaseModifier = '';
    if (playerIllnessLevel >= 3) {
        // Severe/contagious illness - NPC wants to flee
        diseaseModifier = `CRITICAL: The player appears severely ill with visible symptoms: ${visibleSymptoms}. You are frightened and want to stay far away. Keep responses very short and try to end the conversation quickly. Show fear and concern about contagion.`;
    } else if (playerIllnessLevel >= 2) {
        // Obviously ill - NPC is wary
        diseaseModifier = `IMPORTANT: The player appears visibly ill with symptoms: ${visibleSymptoms}. You are concerned about their health and worried about getting sick yourself. Keep some distance and mention their appearance.`;
    } else if (playerIllnessLevel >= 1) {
        // Mild symptoms - NPC shows concern
        diseaseModifier = `NOTE: The player looks somewhat unwell. You notice they don't look entirely healthy and may show mild concern.`;
    }

    // Check for hostile/threatened state
    let hostileModifier = '';

    // Debug: Log the NPC's state
    if ('name' in target) {
        console.log(`[Encounter Service] Checking hostile state for ${target.name}:`);
        console.log(`  - aiState: ${('aiState' in target) ? target.aiState : 'N/A'}`);
        console.log(`  - isHostile: ${('isHostile' in target) ? target.isHostile : 'N/A'}`);
        console.log(`  - wasThreatenedByWeapon: ${('wasThreatenedByWeapon' in target) ? target.wasThreatenedByWeapon : 'N/A'}`);
        console.log(`  - threatenedByPlayerTimestamp: ${('threatenedByPlayerTimestamp' in target) ? target.threatenedByPlayerTimestamp : 'N/A'}`);
    }

    if ('aiState' in target && target.aiState === 'attacking_chasing') {
        // NPC is actively hostile and chasing the player
        console.log(`[Encounter Service] 🔥 APPLYING FURIOUS ATTACKING MODIFIER`);
        hostileModifier = `🔥 CRITICAL - YOU ARE FURIOUS AND ATTACKING: This person just attacked you or threatened you with a weapon! You are ENRAGED and want to FIGHT or PUNISH them. YELL at them in ALL CAPS! Demand to know why they attacked you! Threaten them with violence or justice! Be extremely angry and aggressive!`;
    } else if ('isHostile' in target && target.isHostile) {
        // NPC is marked as hostile
        console.log(`[Encounter Service] ⚠️ APPLYING HOSTILE MODIFIER`);
        hostileModifier = `⚠️ IMPORTANT - YOU ARE HOSTILE: You are hostile toward this person. Be aggressive, threatening, or confrontational. You may yell (use CAPS for emphasis). Show your anger or hostility clearly.`;
    } else if ('wasThreatenedByWeapon' in target && target.wasThreatenedByWeapon) {
        const timeSinceThreat = target.threatenedByPlayerTimestamp
            ? (Date.now() - target.threatenedByPlayerTimestamp) / 1000
            : Infinity;

        if (timeSinceThreat < 300) { // Within 5 minutes
            console.log(`[Encounter Service] ⚠️ APPLYING WEAPON THREAT MODIFIER (${Math.floor(timeSinceThreat)}s ago)`);
            hostileModifier = `⚠️ VERY IMPORTANT: This person just swung a weapon at you ${Math.floor(timeSinceThreat)} seconds ago! You are still VERY ANGRY, FRIGHTENED, or BOTH. YELL at them (use CAPS)! Demand an explanation! You might threaten to call for help or fight back!`;
        }
    }

    if (!hostileModifier) {
        console.log(`[Encounter Service] ℹ️ No hostile modifier applied - NPC appears calm`);
    }

    // Check for available work offers for this NPC
    let workOfferContext = '';
    if ('id' in target && target.id) {
        const npc = target as NpcEntity;
        const workOffers = getWorkOffersForNpc(target.id);
        const availableOffers = workOffers.filter(offer => !offer.accepted && !offer.completed && !offer.failed);

        if (availableOffers.length > 0 && npc.memory) {
            const opinion = npc.memory.opinionOfPlayer || 0;

            // Check for spontaneous offer factors (even for strangers)
            const highPayingTask = availableOffers.some(offer => offer.payment >= 30);
            const multipleTasksBacklog = availableOffers.length >= 3;
            const isDesperateRole = npc.role?.toLowerCase().includes('merchant') ||
                                   npc.role?.toLowerCase().includes('trader') ||
                                   npc.role?.toLowerCase().includes('farmer');
            const isFriendlyPersonality = npc.personality?.traits?.includes('friendly') ||
                                         npc.personality?.traits?.includes('helpful');

            // Calculate spontaneous offer chance (0-100)
            let spontaneousChance = 0;
            if (opinion < 20) {
                // Base 15% chance for strangers
                spontaneousChance = 15;
                if (highPayingTask) spontaneousChance += 20; // Urgent/valuable work
                if (multipleTasksBacklog) spontaneousChance += 15; // Overwhelmed with tasks
                if (isDesperateRole) spontaneousChance += 15; // Roles that need workers
                if (isFriendlyPersonality) spontaneousChance += 20; // Naturally outgoing
            }

            const shouldOfferSpontaneously = Math.random() * 100 < spontaneousChance;

            // NPCs with high opinion (50+) always proactively mention work
            if (opinion >= 50) {
                workOfferContext = `IMPORTANT: You trust ${playerCharacter.name} and have work available for them. ` +
                    `You have ${availableOffers.length} task${availableOffers.length > 1 ? 's' : ''} that need doing. ` +
                    `Proactively mention you have work available if appropriate in the conversation. ` +
                    `Be friendly and encouraging since you trust them (trust level: ${opinion}/100).`;
            } else if (opinion >= 20) {
                // Moderate opinion - mention work if asked
                workOfferContext = `NOTE: You have ${availableOffers.length} task${availableOffers.length > 1 ? 's' : ''} available. ` +
                    `Mention it if the player asks about work or jobs. ` +
                    `Your trust in them is growing (trust level: ${opinion}/100).`;
            } else if (shouldOfferSpontaneously) {
                // Stranger with spontaneous offer
                let offerReason = '';
                if (highPayingTask) offerReason = 'You have an urgent, high-paying task that needs doing. ';
                if (multipleTasksBacklog) offerReason = 'You are overwhelmed with work and desperate for help. ';
                if (isDesperateRole) offerReason = 'Your business needs workers. ';
                if (isFriendlyPersonality) offerReason = 'You are naturally friendly and outgoing. ';

                workOfferContext = `SPONTANEOUS WORK OFFER: ${offerReason}` +
                    `You have ${availableOffers.length} task${availableOffers.length > 1 ? 's' : ''} available. ` +
                    `Even though you don't know ${playerCharacter.name} well (trust: ${opinion}/100), ` +
                    `you're willing to mention the work early in the conversation if it comes up naturally. ` +
                    `Don't force it, but bring it up if they seem capable or if the conversation allows. ` +
                    `You might say something like "Say, you wouldn't be looking for work, would you?" or ` +
                    `"I don't suppose you'd be interested in earning some coins?"`;
            } else {
                // Low opinion - still have work but don't offer unless asked
                workOfferContext = `You have work available but don't fully trust ${playerCharacter.name} yet (trust level: ${opinion}/100). ` +
                    `Only mention it if directly asked about work.`;
            }
        }
    }

    // Check if this is a special map with enhanced context
    if (isSpecialMapData(mapData)) {
        const specialMapContext = getSpecialMapContext(mapData, target as NpcEntity);

        // Enhance the target with special map context
        const enhancedTarget = {
            ...target,
            diseaseModifier, // Add disease awareness to NPC context
            hostileModifier, // Add hostile/threatened state context
            workOfferContext, // Add work offer context
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
        
        return generateLlmDialogue(enhancedTarget, history, playerInput, playerCharacter, allNpcs, mapData, useRealLanguage, historyLensContext);
    }

    // Regular encounter for non-special maps - add disease awareness, hostile state, and work context
    const enhancedTarget = {
        ...target,
        diseaseModifier, // Add disease awareness to regular encounters too
        hostileModifier, // Add hostile/threatened state context
        workOfferContext // Add work offer context
    } as any;

    return generateLlmDialogue(enhancedTarget, history, playerInput, playerCharacter, allNpcs, mapData, useRealLanguage, historyLensContext);
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
 * Determine if an NPC should escalate to direct combat based on reputation
 */
export function shouldEscalateToCombat(
    npc: NpcEntity,
    reputationChange: number,
    currentReputation: number
): boolean {
    console.log(`[Escalation Check] ${npc.name}: rep=${currentReputation}, change=${reputationChange}, level=${npc.escalationLevel}`);

    // Immediate combat triggers:
    // 1. Reputation drops below -50 (extreme hostility)
    if (currentReputation < -50) {
        console.log('[Escalation] → ATTACK (reputation < -50)');
        return true;
    }

    // 2. Single interaction drops reputation by -40 or more (extreme insult/threat)
    if (reputationChange <= -40) {
        console.log('[Escalation] → ATTACK (single drop >= -40)');
        return true;
    }

    // 3. NPC is already furious and reputation drops further
    if (npc.escalationLevel === 'furious' && reputationChange < -10) {
        console.log('[Escalation] → ATTACK (already furious, further provoked)');
        return true;
    }

    console.log('[Escalation] → DIALOGUE (not escalating to combat)');
    return false;
}

/**
 * Update NPC's escalation level based on current reputation
 */
export function updateNpcEscalationLevel(
    npc: NpcEntity,
    reputationChange: number,
    currentReputation: number
): NpcEntity {
    let escalationLevel: 'calm' | 'angry' | 'furious' | 'attacking';

    if (currentReputation < -50 || npc.aiState === 'attacking_chasing') {
        escalationLevel = 'attacking';
    } else if (currentReputation < -30 || reputationChange <= -20) {
        escalationLevel = 'furious';
    } else if (currentReputation < -10 || reputationChange <= -10) {
        escalationLevel = 'angry';
    } else {
        escalationLevel = 'calm';
    }

    console.log(`[Escalation Level] ${npc.name}: ${npc.escalationLevel || 'none'} → ${escalationLevel}`);

    return {
        ...npc,
        escalationLevel
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