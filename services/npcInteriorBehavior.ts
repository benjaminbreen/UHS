/**
 * NPC behavior system for interior spaces - handles trespassing, confrontations, and reputation
 */
import { NpcEntity } from '../types/npcTypes';
import { InteriorMapData, Room } from '../types/interiorMapTypes';
import { Character } from '../types';

interface TrespassingCheck {
    isTrespassing: boolean;
    severity: 'minor' | 'moderate' | 'severe';
    reason?: string;
    affectedNpcs: NpcEntity[];
}

interface RoomRestriction {
    roomId: string;
    requiredReligion?: string;
    requiredClass?: string[];
    isPrivate: boolean;
    penalty: 'warning' | 'reputation' | 'combat';
}

/**
 * Check if player is trespassing in a restricted area
 */
export function checkTrespassing(
    playerX: number,
    playerY: number,
    player: Character,
    interiorData: InteriorMapData,
    restrictions?: RoomRestriction[]
): TrespassingCheck {
    if (!restrictions || restrictions.length === 0) {
        return { isTrespassing: false, severity: 'minor', affectedNpcs: [] };
    }
    
    // Find which room the player is in
    const playerRoom = interiorData.rooms.find(room => 
        playerX >= room.x && playerX < room.x + room.width &&
        playerY >= room.y && playerY < room.y + room.height
    );
    
    if (!playerRoom) {
        return { isTrespassing: false, severity: 'minor', affectedNpcs: [] };
    }
    
    // Check if this room has restrictions
    const roomRestriction = restrictions.find(r => r.roomId === playerRoom.id.toString());
    if (!roomRestriction) {
        return { isTrespassing: false, severity: 'minor', affectedNpcs: [] };
    }
    
    // Check if player meets requirements
    let isTrespassing = false;
    let reason = '';
    
    if (roomRestriction.requiredReligion && 
        player.religion !== roomRestriction.requiredReligion) {
        isTrespassing = true;
        reason = `This sacred space is reserved for followers of ${roomRestriction.requiredReligion}`;
    }
    
    if (roomRestriction.requiredClass && 
        !roomRestriction.requiredClass.includes(player.socialClass)) {
        isTrespassing = true;
        reason = `Only ${roomRestriction.requiredClass.join(' or ')} may enter here`;
    }
    
    if (roomRestriction.isPrivate) {
        isTrespassing = true;
        reason = reason || 'This is a private area';
    }
    
    if (!isTrespassing) {
        return { isTrespassing: false, severity: 'minor', affectedNpcs: [] };
    }
    
    // Determine severity based on penalty type
    const severity = roomRestriction.penalty === 'combat' ? 'severe' :
                     roomRestriction.penalty === 'reputation' ? 'moderate' : 'minor';
    
    // Find NPCs who would react
    const affectedNpcs = (interiorData.npcs || []).filter(npc => {
        // Guards always react
        if (npc.occupation?.toLowerCase().includes('guard')) return true;
        
        // NPCs in the same room react
        const npcInRoom = npc.x >= playerRoom.x && npc.x < playerRoom.x + playerRoom.width &&
                         npc.y >= playerRoom.y && npc.y < playerRoom.y + playerRoom.height;
        if (npcInRoom) return true;
        
        // Clergy react to religious violations
        if (roomRestriction.requiredReligion && 
            (npc.occupation?.toLowerCase().includes('priest') ||
             npc.occupation?.toLowerCase().includes('imam') ||
             npc.occupation?.toLowerCase().includes('rabbi') ||
             npc.occupation?.toLowerCase().includes('monk'))) {
            return true;
        }
        
        return false;
    });
    
    return {
        isTrespassing: true,
        severity,
        reason,
        affectedNpcs
    };
}

/**
 * Handle NPC confrontation when player is trespassing
 */
export function handleNpcConfrontation(
    npc: NpcEntity,
    player: Character,
    severity: 'minor' | 'moderate' | 'severe',
    reason: string
): {
    dialogue: string[];
    action: 'warn' | 'expel' | 'attack';
    reputationChange: number;
} {
    // Check if this NPC has already confronted the player
    if (npc.hasConfrontedPlayer && severity !== 'severe') {
        return {
            dialogue: [],
            action: 'warn',
            reputationChange: 0
        };
    }
    
    let dialogue: string[] = [];
    let action: 'warn' | 'expel' | 'attack' = 'warn';
    let reputationChange = 0;
    
    switch (severity) {
        case 'minor':
            dialogue = [
                `${npc.name}: "Excuse me, but ${reason.toLowerCase()}."`,
                `${npc.name}: "Please respect our customs and leave this area."`
            ];
            action = 'warn';
            reputationChange = -5;
            break;
            
        case 'moderate':
            dialogue = [
                `${npc.name}: "You there! Stop!"`,
                `${npc.name}: "${reason}!"`,
                `${npc.name}: "Leave immediately or face the consequences!"`
            ];
            action = 'expel';
            reputationChange = -15;
            break;
            
        case 'severe':
            dialogue = [
                `${npc.name}: "INTRUDER!"`,
                `${npc.name}: "How dare you violate this sacred space!"`,
                `${npc.name}: "Guards! Seize this blasphemer!"`
            ];
            action = 'attack';
            reputationChange = -30;
            break;
    }
    
    // Mark that this NPC has confronted the player
    npc.hasConfrontedPlayer = true;
    
    // Update NPC's opinion of player
    if (npc.memory) {
        npc.memory.opinionOfPlayer = Math.max(
            -100,
            (npc.memory.opinionOfPlayer || 0) - reputationChange
        );
        
        // Add this incident to NPC's memory
        npc.memory.knownFactsAboutPlayer.add(`TRESPASSED_${new Date().toISOString()}`);
    }
    
    return {
        dialogue,
        action,
        reputationChange
    };
}

/**
 * Update NPC patrol behavior in interior spaces
 */
export function updateNpcPatrol(npc: NpcEntity, deltaTime: number): void {
    if (!npc.patrolRoute || npc.patrolRoute.length < 2) return;
    
    // Initialize patrol index if not set
    if (npc.currentPatrolIndex === undefined) {
        npc.currentPatrolIndex = 0;
    }
    
    const target = npc.patrolRoute[npc.currentPatrolIndex];
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Move towards target
    if (distance > 0.5) {
        const speed = 2 * deltaTime; // tiles per second
        npc.x += (dx / distance) * speed;
        npc.y += (dy / distance) * speed;
        
        // Update direction for animation
        if (Math.abs(dx) > Math.abs(dy)) {
            npc.direction = dx > 0 ? 'right' : 'left';
        } else {
            npc.direction = dy > 0 ? 'down' : 'up';
        }
        
        // Update walk animation frame
        npc.walkFrame = (npc.walkFrame || 0) + 1;
    } else {
        // Reached patrol point, move to next
        npc.currentPatrolIndex = (npc.currentPatrolIndex + 1) % npc.patrolRoute.length;
    }
}

/**
 * Make NPCs react to player entering restricted areas
 */
export function makeNpcsReactToTrespassing(
    npcs: NpcEntity[],
    player: Character,
    playerX: number,
    playerY: number
): void {
    npcs.forEach(npc => {
        const dx = playerX - npc.x;
        const dy = playerY - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // NPCs within 5 tiles react
        if (distance < 5) {
            // Guards become hostile
            if (npc.occupation?.toLowerCase().includes('guard')) {
                npc.isHostile = true;
                npc.aiState = 'attacking_chasing';
                
                // Move towards player
                npc.targetX = playerX;
                npc.targetY = playerY;
            }
            // Other NPCs become alarmed
            else {
                npc.aiState = 'hostile_fleeing';
                
                // Move away from player
                npc.targetX = npc.x - Math.sign(dx) * 3;
                npc.targetY = npc.y - Math.sign(dy) * 3;
            }
        }
    });
}

/**
 * Generate contextual dialogue for NPCs based on location and situation
 */
export function generateNpcDialogue(
    npc: NpcEntity,
    buildingType: string,
    playerReligion?: string,
    hasBeenWarned?: boolean
): string[] {
    const dialogue: string[] = [];
    
    // Religious NPCs in holy places
    if (buildingType === 'holy_place' || buildingType === 'temple') {
        if (npc.occupation?.includes('Priest') || npc.occupation?.includes('Imam') || 
            npc.occupation?.includes('Rabbi') || npc.occupation?.includes('Monk')) {
            
            if (playerReligion === npc.religion) {
                dialogue.push(
                    `Welcome, ${playerReligion === 'Christianity' ? 'brother' : 'friend'}.`,
                    'May you find peace in this sacred place.',
                    'Please, feel free to pray or meditate.'
                );
            } else {
                dialogue.push(
                    'You are welcome here, traveler.',
                    'Please be respectful of our customs.',
                    'Some areas are reserved for the faithful.'
                );
            }
        } else if (npc.occupation === 'Temple Guard') {
            if (hasBeenWarned) {
                dialogue.push(
                    'I warned you once already.',
                    'Leave now or face the consequences.',
                    'This is your final warning.'
                );
            } else {
                dialogue.push(
                    'State your business here.',
                    'The inner sanctum is off limits.',
                    'Do not disturb the priests at prayer.'
                );
            }
        } else {
            // Worshippers
            dialogue.push(
                'Shh... we must be quiet here.',
                'I come here to find solace.',
                'The priests are very wise.'
            );
        }
    }
    // Palace NPCs
    else if (buildingType === 'palace') {
        if (npc.socialClass === 'nobility') {
            dialogue.push(
                'What is a commoner doing in the palace?',
                'These halls are not for the likes of you.',
                'Guards! Why was this person allowed entry?'
            );
        } else if (npc.occupation === 'Palace Guard') {
            dialogue.push(
                'Move along, no loitering.',
                'The throne room is restricted.',
                'State your business or leave.'
            );
        } else if (npc.occupation === 'Servant') {
            dialogue.push(
                'Please don\'t get me in trouble...',
                'The nobles don\'t like strangers.',
                'You shouldn\'t be here.'
            );
        }
    }
    
    return dialogue;
}

/**
 * Apply reputation changes to player based on actions
 */
export function applyReputationChange(
    player: Character,
    change: number,
    reason: string
): void {
    // Reputation is stored as part of character stats or social context
    if (!player.socialContext) {
        player.socialContext = {
            currentTown: '',
            reputation: 0,
            titles: [],
            achievements: []
        };
    }
    
    player.socialContext.reputation = Math.max(
        -100,
        Math.min(100, player.socialContext.reputation + change)
    );
    
    // Log the reputation change
    console.log(`Reputation ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}: ${reason}`);
}