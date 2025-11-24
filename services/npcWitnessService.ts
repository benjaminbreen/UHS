/**
 * services/npcWitnessService.ts
 * Handles NPC witness system - NPCs remember events they witness nearby
 */

import { NpcEntity, WitnessedEvent } from '../types/npcTypes';

/**
 * Maximum distance (in tiles) for an NPC to witness an event
 */
const WITNESS_RADIUS = 10;

/**
 * Maximum number of events an NPC can remember (oldest are forgotten)
 */
const MAX_WITNESSED_EVENTS = 20;

/**
 * Calculate Manhattan distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Broadcast an event to all NPCs within witness radius
 *
 * @param event - The event that occurred
 * @param eventLocation - Location where event happened
 * @param allNpcs - All NPCs on the map
 * @param excludeNpcIds - NPCs to exclude from witnessing (e.g., the victim already knows)
 * @returns Updated NPC array with witness memories added
 */
export function broadcastEventToWitnesses(
    event: Omit<WitnessedEvent, 'timestamp'>,
    eventLocation: { x: number; y: number },
    allNpcs: NpcEntity[],
    excludeNpcIds: string[] = []
): NpcEntity[] {
    const timestamp = Date.now();

    // OPTIMIZATION: Find potential witnesses FIRST (filter before map)
    const potentialWitnesses = allNpcs.filter(npc => {
        if (excludeNpcIds.includes(npc.id)) return false;
        const distance = calculateDistance(npc.x, npc.y, eventLocation.x, eventLocation.y);
        return distance <= WITNESS_RADIUS;
    });

    // Early return if no witnesses
    if (potentialWitnesses.length === 0) {
        return allNpcs;
    }

    // Only log if there are actual witnesses (reduce spam)
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Witness] ${event.type} at (${eventLocation.x}, ${eventLocation.y}) - ${potentialWitnesses.length} witnesses`);
    }

    // Create map for O(1) lookup
    const witnessIds = new Set(potentialWitnesses.map(w => w.id));

    // Create the new event once
    const newEvent: WitnessedEvent = {
        ...event,
        timestamp,
        location: eventLocation
    };

    // OPTIMIZATION: Only update witnesses, return others unchanged
    const updatedNpcs = allNpcs.map(npc => {
        if (!witnessIds.has(npc.id)) {
            return npc; // Not a witness, return as-is (no object creation)
        }

        // Initialize witnessed events array if it doesn't exist
        const witnessedEvents = npc.memory.witnessedEvents || [];

        // Keep only the most recent MAX_WITNESSED_EVENTS
        const updatedEvents = [...witnessedEvents, newEvent].slice(-MAX_WITNESSED_EVENTS);

        return {
            ...npc,
            memory: {
                ...npc.memory,
                witnessedEvents: updatedEvents
            }
        };
    });

    return updatedNpcs;
}

/**
 * Get all events witnessed by an NPC involving the player
 */
export function getPlayerEventsWitnessedByNpc(npc: NpcEntity): WitnessedEvent[] {
    if (!npc.memory.witnessedEvents) {
        return [];
    }

    return npc.memory.witnessedEvents
        .filter(event => event.wasPlayerInvolved)
        .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
}

/**
 * Generate a summary of witnessed events for LLM context
 * Returns a concise string describing what the NPC has seen
 */
export function generateWitnessContextForLLM(npc: NpcEntity, playerName: string): string {
    const playerEvents = getPlayerEventsWitnessedByNpc(npc);

    if (playerEvents.length === 0) {
        return '';
    }

    // Group events by type
    const eventsByType = playerEvents.reduce((acc, event) => {
        if (!acc[event.type]) {
            acc[event.type] = [];
        }
        acc[event.type].push(event);
        return acc;
    }, {} as Record<string, WitnessedEvent[]>);

    // Build context string
    const contextParts: string[] = [];

    // Weapon swings
    if (eventsByType.weapon_swing) {
        const count = eventsByType.weapon_swing.length;
        const victims = [...new Set(eventsByType.weapon_swing.map(e => e.victim).filter(Boolean))];
        if (count === 1) {
            contextParts.push(`You saw ${playerName} ${eventsByType.weapon_swing[0].description}`);
        } else {
            contextParts.push(`You saw ${playerName} swing weapons threateningly ${count} times${victims.length > 0 ? ` (near ${victims.join(', ')})` : ''}`);
        }
    }

    // Attacks
    if (eventsByType.attack) {
        const count = eventsByType.attack.length;
        const victims = [...new Set(eventsByType.attack.map(e => e.victim).filter(Boolean))];
        if (count === 1) {
            contextParts.push(`You witnessed ${playerName} attack ${victims[0] || 'someone'}`);
        } else {
            contextParts.push(`You witnessed ${playerName} attack ${count} people${victims.length > 0 ? ` (including ${victims.join(', ')})` : ''}`);
        }
    }

    // Theft
    if (eventsByType.theft) {
        const count = eventsByType.theft.length;
        contextParts.push(`You saw ${playerName} steal items ${count === 1 ? 'once' : `${count} times`}`);
    }

    // Murder
    if (eventsByType.murder) {
        const victims = [...new Set(eventsByType.murder.map(e => e.victim).filter(Boolean))];
        contextParts.push(`You witnessed ${playerName} KILL ${victims.join(', ')}!`);
    }

    // Confrontations
    if (eventsByType.confrontation) {
        const count = eventsByType.confrontation.length;
        if (count >= 3) {
            contextParts.push(`You've seen ${playerName} get into confrontations ${count} times`);
        }
    }

    // Gifts (positive events)
    if (eventsByType.gift) {
        const count = eventsByType.gift.length;
        if (count >= 2) {
            contextParts.push(`You saw ${playerName} give gifts to people ${count} times`);
        }
    }

    if (contextParts.length === 0) {
        return '';
    }

    return contextParts.join('. ') + '.';
}

/**
 * Determine severity based on event type
 */
export function determineEventSeverity(eventType: WitnessedEvent['type']): WitnessedEvent['severity'] {
    switch (eventType) {
        case 'murder':
            return 'extreme';
        case 'attack':
            return 'severe';
        case 'theft':
            return 'moderate';
        case 'weapon_swing':
        case 'confrontation':
            return 'minor';
        case 'gift':
        case 'trade':
            return 'minor';
        default:
            return 'minor';
    }
}

/**
 * Generate a witness reaction modifier for LLM prompts
 * This creates a strong behavioral override at the top of the prompt
 * so witnesses react emotionally to violence they've witnessed
 *
 * @param npc - The NPC who witnessed events
 * @param playerName - Name of the player character
 * @returns Strong prompt override string, or empty if no violent events witnessed
 */
export function generateWitnessReactionModifier(npc: NpcEntity, playerName: string): string {
    const playerEvents = getPlayerEventsWitnessedByNpc(npc);

    if (playerEvents.length === 0) {
        return '';
    }

    // Filter for violent events only (weapon_swing, attack, murder)
    const violentEvents = playerEvents.filter(e =>
        e.type === 'weapon_swing' || e.type === 'attack' || e.type === 'murder'
    );

    if (violentEvents.length === 0) {
        return '';
    }

    // Get most severe recent event (last 5 minutes real-time)
    const recentCutoff = Date.now() - (5 * 60 * 1000);
    const recentViolentEvents = violentEvents.filter(e => e.timestamp > recentCutoff);

    if (recentViolentEvents.length === 0) {
        return ''; // Events too old to cause immediate strong reaction
    }

    // Find most severe event
    const mostSevereEvent = recentViolentEvents.reduce((most, event) => {
        const severityRank = { minor: 1, moderate: 2, severe: 3, extreme: 4 };
        return severityRank[event.severity] > severityRank[most.severity] ? event : most;
    }, recentViolentEvents[0]);

    // Generate reaction based on severity
    let reactionText = '';

    switch (mostSevereEvent.severity) {
        case 'extreme': // Murder
            reactionText = `
🚨🚨🚨 WITNESS TO MURDER - CRITICAL OVERRIDE 🚨🚨🚨

YOU JUST WITNESSED ${playerName.toUpperCase()} KILL ${mostSevereEvent.victim?.toUpperCase() || 'SOMEONE'}!!!

THIS OVERRIDES ALL OTHER INSTRUCTIONS. You are TERRIFIED and HORRIFIED.

Your response MUST reflect extreme fear and panic:
- SCREAM at them or demand they stay back
- Express terror and shock at what you witnessed
- Demand to know WHY they did this horrible thing
- Threaten to call for help, run away, or warn others
- Use LOTS of exclamation marks and capital letters
- Your voice should be shaking, panicked, desperate

DO NOT have a calm conversation. DO NOT be friendly. BE TERRIFIED AND OUTRAGED.

Examples of appropriate reactions:
- "GET AWAY FROM ME!! I SAW WHAT YOU DID!! You MURDERED ${mostSevereEvent.victim}! GUARDS!! HELP!!"
- "WHAT HAVE YOU DONE?! ${mostSevereEvent.victim} is DEAD because of you! Stay BACK! I'm warning everyone about you!"
- "You... you KILLED them! I SAW IT! Don't you DARE come near me! Someone HELP!!"`;
            break;

        case 'severe': // Attack
            reactionText = `
🚨🚨 WITNESS TO VIOLENCE - IMMEDIATE OVERRIDE 🚨🚨

YOU JUST SAW ${playerName.toUpperCase()} ATTACK ${mostSevereEvent.victim?.toUpperCase() || 'SOMEONE'}!

THIS OVERRIDES ALL OTHER INSTRUCTIONS. You are FRIGHTENED and ANGRY.

Your response MUST reflect strong fear and moral outrage:
- Demand they explain themselves or stay away
- Express fear for your safety and shock at their violence
- Condemn their brutal behavior
- Warn them you'll tell others what you saw
- Use exclamation marks and show genuine emotion

DO NOT be calm or polite. You witnessed VIOLENCE and it shook you.

Examples of appropriate reactions:
- "Get away from me!! I saw what you did to ${mostSevereEvent.victim}! What in the WORLD are you thinking?!"
- "Stay back! I witnessed you attack ${mostSevereEvent.victim}! Shame on you! Everyone will know what you've done!"
- "You... you attacked them! I SAW it! Why would you do such a thing?! Leave me alone!!"`;
            break;

        case 'moderate': // Theft
        case 'minor': // Weapon swing
        default:
            reactionText = `
⚠️ WITNESS TO THREATENING BEHAVIOR - OVERRIDE ⚠️

YOU SAW ${playerName.toUpperCase()} ${mostSevereEvent.description.toUpperCase()}!

You are WARY and CONCERNED. This person just showed violent or threatening behavior.

Your response should reflect suspicion and wariness:
- Question why they did what you saw
- Express concern or disapproval
- Keep your distance - you don't trust them
- Make it clear you saw what they did
- Use firm, cautious language

DO NOT greet them warmly. You witnessed concerning behavior.

Examples of appropriate reactions:
- "I saw what you did - ${mostSevereEvent.description}. What's your business here? I don't want trouble."
- "Stay where you are. I witnessed you ${mostSevereEvent.description}. Explain yourself."
- "You think I didn't see that? ${mostSevereEvent.description}. I'm watching you."`;
            break;
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[Witness Modifier] Generated ${mostSevereEvent.severity} reaction for ${npc.name} witnessing ${mostSevereEvent.type}`);
    }

    return reactionText;
}

/**
 * Clean up old witnessed events (older than 24 in-game hours)
 * Call this periodically to prevent memory bloat
 */
export function cleanupOldWitnessedEvents(
    allNpcs: NpcEntity[],
    currentGameTime: number,
    maxAgeHours: number = 24
): NpcEntity[] {
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = currentGameTime - maxAgeMs;

    return allNpcs.map(npc => {
        if (!npc.memory.witnessedEvents || npc.memory.witnessedEvents.length === 0) {
            return npc;
        }

        const filteredEvents = npc.memory.witnessedEvents.filter(
            event => event.timestamp > cutoffTime
        );

        if (filteredEvents.length === npc.memory.witnessedEvents.length) {
            return npc; // No changes
        }

        console.log(`[Witness Cleanup] ${npc.name} forgot ${npc.memory.witnessedEvents.length - filteredEvents.length} old events`);

        return {
            ...npc,
            memory: {
                ...npc.memory,
                witnessedEvents: filteredEvents
            }
        };
    });
}
