/**
 * Hook for managing NPC behavior in special maps
 * Connects the behavior service to actual NPCs and updates their state
 */

import { useEffect, useCallback, useRef } from 'react';
import { NpcEntity, PlayerCharacter, Tile, BiomeType, OverlayObjectType } from '../types';
import { SpecialMapArchetype } from '../types/specialMapTypes';
import { 
  specialMapNpcBehaviorService, 
  NpcMood, 
  NpcActivity, 
  NpcAttitude,
  isGuardType,
  getGuardAlertRadius
} from '../services/specialMapNpcBehaviorService';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { eventBus } from '../services/eventBus';
import { guardPermissionService } from '../services/guardPermissionService';

interface NpcBehaviorState {
  mood: NpcMood;
  activity: NpcActivity;
  attitude: NpcAttitude;
  currentDialogue: string;
  isMoving: boolean;
  targetLocation?: { x: number; y: number };
}

export function useSpecialMapNpcBehavior(
  mapArchetype: SpecialMapArchetype | null,
  npcs: NpcEntity[],
  player: PlayerCharacter,
  tiles: Tile[][]
) {
  const { timeOfDay, weather, era, culturalZone } = useGame();
  const { mapData } = useMap();
  const npcStates = useRef<Map<string, NpcBehaviorState>>(new Map());
  const playerActions = useRef<string[]>([]);
  const updateInterval = useRef<NodeJS.Timeout>();

  // Track player actions for NPC reactions
  useEffect(() => {
    const handlePlayerAction = (action: string) => {
      playerActions.current.push(action);
      // Keep only last 10 actions
      if (playerActions.current.length > 10) {
        playerActions.current.shift();
      }
    };

    eventBus.on('player:action', handlePlayerAction);
    return () => {
      eventBus.off('player:action', handlePlayerAction);
    };
  }, []);

  // Apply behavior state to NPC entity - Define this BEFORE updateNpcBehavior
  const applyBehaviorToNpc = useCallback((npc: NpcEntity, state: NpcBehaviorState, npcs: NpcEntity[], player: PlayerCharacter) => {
    // Update NPC dialogue
    if (npc.dialogue && state.currentDialogue) {
      npc.dialogue[0] = state.currentDialogue;
    }

    // Update NPC movement
    if (state.isMoving && state.targetLocation) {
      const dx = Math.sign(state.targetLocation.x - npc.x);
      const dy = Math.sign(state.targetLocation.y - npc.y);
      
      // Check if target location is walkable
      if (tiles && tiles[npc.y + dy] && tiles[npc.y + dy][npc.x + dx]) {
        const targetTile = tiles[npc.y + dy][npc.x + dx];
        const targetX = npc.x + dx;
        const targetY = npc.y + dy;
        
        // Check both biome blocking, explicit isBlocking flag, and overlay objects
        const isBlockingTerrain = targetTile.biome === BiomeType.WALL || 
                                  targetTile.biome === BiomeType.WATER || 
                                  targetTile.biome === BiomeType.DEEP_WATER ||
                                  targetTile.biome === BiomeType.MOUNTAIN ||
                                  targetTile.biome === BiomeType.LAVA;
        
        const hasBlockingOverlay = targetTile.overlayObjects?.some(obj => 
          obj.type === OverlayObjectType.WALL ||
          obj.type === OverlayObjectType.PILLAR ||
          obj.type === OverlayObjectType.FOUNTAIN
        );
        
        // Check for other NPC collisions
        const hasNpcCollision = npcs.some(otherNpc => 
          otherNpc.id !== npc.id && 
          otherNpc.x === targetX && 
          otherNpc.y === targetY
        );
        
        // Check if player is at the target location
        const hasPlayerCollision = player.x === targetX && player.y === targetY;
        
        // Special handling for guards - they can enter player tile to confront
        if (hasPlayerCollision && isGuardType(npc)) {
          // Check if player has permission before confronting
          const mapId = `${mapData?.area || 'unknown'}_${mapData?.seed || 'default'}`;
          if (guardPermissionService.hasPermission(mapId)) {
            console.log(`[Guard Encounter] ${npc.name} recognizes player has permission - no confrontation`);
            return; // Player has permission, don't confront
          }

          // Guard is confronting player - emit encounter event
          eventBus.emit('guard:encounter', {
            npcId: npc.id,
            guardNpc: npc,
            position: { x: targetX, y: targetY },
            reason: 'confrontation'
          });
          // Don't actually move into player tile yet
          return;
        }
        
        // Regular NPCs still avoid player
        if (!isBlockingTerrain && 
            !targetTile.isBlocking && 
            !hasBlockingOverlay && 
            !hasNpcCollision && 
            !hasPlayerCollision) {
          // Move NPC
          npc.x = targetX;
          npc.y = targetY;
          
          // Update direction
          if (dx > 0) npc.direction = 'right';
          else if (dx < 0) npc.direction = 'left';
          else if (dy > 0) npc.direction = 'down';
          else if (dy < 0) npc.direction = 'up';
        } else {
          // Can't move, stop trying
          state.isMoving = false;
          state.targetLocation = undefined;
        }
      }
    }
  }, [tiles, npcs, player]);

  // Update NPC behavior based on context
  const updateNpcBehavior = useCallback((npc: NpcEntity) => {
    if (!mapArchetype || !tiles || !tiles[npc.y] || !tiles[npc.y][npc.x]) return;
    
    // Check if player position is valid
    if (player.x === undefined || player.y === undefined) {
      console.log(`[Guard Detection] Player position undefined - x: ${player.x}, y: ${player.y}`);
      return;
    }

    const tile = tiles[npc.y][npc.x];
    const distanceToPlayer = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
    const playerNearby = distanceToPlayer <= 5;
    
    // Check if this is a guard and if player is in detection range
    if (isGuardType(npc)) {
      const alertRadius = getGuardAlertRadius(npc, mapArchetype);
      
      // Determine if player is in a restricted area
      // For special maps, consider the center area and certain rooms as restricted
      const mapWidth = tiles[0]?.length || 0;
      const mapHeight = tiles.length || 0;
      const centerX = Math.floor(mapWidth / 2);
      const centerY = Math.floor(mapHeight / 2);
      
      // Check if player is in restricted zone (center third of the map or near important areas)
      const isInRestrictedArea = (() => {
        // Define restricted zones based on map archetype
        if (mapArchetype === 'ESTATES' || mapArchetype === 'GOVERNMENT_FORUM') {
          // Inner sanctum is the center area
          const innerBoundaryX = mapWidth * 0.35;
          const outerBoundaryX = mapWidth * 0.65;
          const innerBoundaryY = mapHeight * 0.35;
          const outerBoundaryY = mapHeight * 0.65;
          
          return player.x >= innerBoundaryX && player.x <= outerBoundaryX &&
                 player.y >= innerBoundaryY && player.y <= outerBoundaryY;
        } else if (mapArchetype === 'SACRED') {
          // Altar area is typically in the center-back
          const altarAreaY = mapHeight * 0.2; // Top 20% of map
          const altarAreaX1 = mapWidth * 0.3;
          const altarAreaX2 = mapWidth * 0.7;
          
          return (player.y <= altarAreaY && player.x >= altarAreaX1 && player.x <= altarAreaX2) ||
                 (Math.abs(player.x - centerX) <= 5 && Math.abs(player.y - centerY) <= 5);
        } else {
          // For other maps, just check if very close to center
          return Math.abs(player.x - centerX) <= 8 && Math.abs(player.y - centerY) <= 8;
        }
      })();
      
      console.log(`[Guard Detection] NPC ${npc.name} - Distance: ${distanceToPlayer}, Restricted Area: ${isInRestrictedArea}`);
      
      // Only react if player is in restricted area AND within detection range
      if (isInRestrictedArea && distanceToPlayer <= alertRadius) {
        // Check if player has permission to be here
        const mapId = `${mapData?.area || 'unknown'}_${mapData?.seed || 'default'}`;
        if (guardPermissionService.hasPermission(mapId)) {
          console.log(`[Guard Detection] ${npc.name} recognizes player has permission - no alert`);
          return; // Player has permission, don't detect/arrest
        }

        // Emit guard detection event
        console.log(`[Guard Alert] Player in restricted area! Emitting guard:detecting for ${npc.name}`);
        eventBus.emit('guard:detecting', {
          npcId: npc.id,
          distance: distanceToPlayer,
          alertRadius: alertRadius
        });
      } else if (distanceToPlayer > alertRadius * 2 || !isInRestrictedArea) {
        // Player has moved far away or left restricted area, emit event to reset this guard's warning state
        eventBus.emit('guard:reset', {
          npcId: npc.id
        });
      }
    }

    // Determine mood
    const mood = specialMapNpcBehaviorService.determineNpcMood(
      npc,
      tile,
      mapArchetype,
      timeOfDay,
      weather,
      playerNearby,
      era,
      culturalZone
    );

    // Determine activity
    let activity = specialMapNpcBehaviorService.determineNpcActivity(
      npc,
      tile,
      mapArchetype,
      timeOfDay
    );
    
    // Override activity for guards who detected the player in restricted areas
    if (isGuardType(npc)) {
      const alertRadius = getGuardAlertRadius(npc, mapArchetype);
      const mapWidth = tiles[0]?.length || 0;
      const mapHeight = tiles.length || 0;
      const centerX = Math.floor(mapWidth / 2);
      const centerY = Math.floor(mapHeight / 2);
      
      // Check if player is in restricted zone (same logic as above)
      const isInRestrictedArea = (() => {
        if (mapArchetype === 'ESTATES' || mapArchetype === 'GOVERNMENT_FORUM') {
          const innerBoundaryX = mapWidth * 0.35;
          const outerBoundaryX = mapWidth * 0.65;
          const innerBoundaryY = mapHeight * 0.35;
          const outerBoundaryY = mapHeight * 0.65;
          return player.x >= innerBoundaryX && player.x <= outerBoundaryX &&
                 player.y >= innerBoundaryY && player.y <= outerBoundaryY;
        } else if (mapArchetype === 'SACRED') {
          const altarAreaY = mapHeight * 0.2;
          const altarAreaX1 = mapWidth * 0.3;
          const altarAreaX2 = mapWidth * 0.7;
          return (player.y <= altarAreaY && player.x >= altarAreaX1 && player.x <= altarAreaX2) ||
                 (Math.abs(player.x - centerX) <= 5 && Math.abs(player.y - centerY) <= 5);
        } else {
          return Math.abs(player.x - centerX) <= 8 && Math.abs(player.y - centerY) <= 8;
        }
      })();
      
      // Only pursue if player is in restricted area AND within detection range
      if (isInRestrictedArea && distanceToPlayer <= alertRadius) {
        activity = {
          action: 'pursuing_player',
          location: { x: player.x, y: player.y }, // Move toward player
          duration: 1,
          interruptible: false,
          dialogue: 'Stop right there! This area is restricted!'
        };
      }
    }

    // Determine attitude toward player
    const attitude = specialMapNpcBehaviorService.determineNpcAttitude(
      npc,
      player,
      mapArchetype,
      playerActions.current
    );

    // Generate contextual dialogue
    const dialogues = specialMapNpcBehaviorService.generateContextualDialogue(
      npc,
      mood,
      activity,
      attitude,
      mapArchetype
    );

    // Update NPC state
    const currentState = npcStates.current.get(npc.id) || {
      mood,
      activity,
      attitude,
      currentDialogue: dialogues[0] || '',
      isMoving: false
    };

    // Check if NPC should move based on activity
    if (activity.location.x !== npc.x || activity.location.y !== npc.y) {
      currentState.isMoving = true;
      currentState.targetLocation = activity.location;
    }

    // Update dialogue periodically
    if (Math.random() < 0.1) {
      currentState.currentDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
    }

    currentState.mood = mood;
    currentState.activity = activity;
    currentState.attitude = attitude;

    npcStates.current.set(npc.id, currentState);

    // Apply behavior to actual NPC
    applyBehaviorToNpc(npc, currentState, npcs, player);
  }, [mapArchetype, tiles, player, timeOfDay, weather, era, culturalZone, npcs, applyBehaviorToNpc]);

  // Apply visual/behavioral effects based on mood
  const applyMoodEffects = useCallback((npc: NpcEntity, mood: NpcMood) => {
    switch (mood.emotion) {
      case 'angry':
        // Add red tint or anger indicator
        eventBus.emit('npc:effect', { npcId: npc.id, effect: 'angry', intensity: mood.intensity });
        break;
      case 'fearful':
        // Add trembling effect
        eventBus.emit('npc:effect', { npcId: npc.id, effect: 'trembling', intensity: mood.intensity });
        break;
      case 'happy':
        // Add bounce or smile
        eventBus.emit('npc:effect', { npcId: npc.id, effect: 'happy', intensity: mood.intensity });
        break;
      case 'suspicious':
        // Add eye-tracking player
        eventBus.emit('npc:effect', { npcId: npc.id, effect: 'watching', intensity: mood.intensity });
        break;
      case 'reverential':
        // Add praying animation
        eventBus.emit('npc:effect', { npcId: npc.id, effect: 'praying', intensity: mood.intensity });
        break;
    }
  }, []);

  // Check if overlay object blocks movement
  const isBlockingOverlayObject = (objectType: OverlayObjectType): boolean => {
    const blockingObjects = [
      OverlayObjectType.TABLE,
      OverlayObjectType.TABLE_LEFT,
      OverlayObjectType.TABLE_CENTER,
      OverlayObjectType.TABLE_RIGHT,
      OverlayObjectType.CHAIR,
      OverlayObjectType.DESK,
      OverlayObjectType.BED,
      OverlayObjectType.THRONE,
      OverlayObjectType.BENCH,
      OverlayObjectType.BOOKSHELF,
      OverlayObjectType.CHEST,
      OverlayObjectType.CABINET,
      OverlayObjectType.BRAZIER,
      OverlayObjectType.STATUE,
      OverlayObjectType.FOUNTAIN,
      OverlayObjectType.PODIUM,
      OverlayObjectType.ALTAR,
      OverlayObjectType.PILLAR_BASE,
      OverlayObjectType.PILLAR_TOP,
      OverlayObjectType.WEAPON_RACK,
      OverlayObjectType.ARMOR_STAND,
      OverlayObjectType.KITCHEN_STOVE,
      OverlayObjectType.KITCHEN_COUNTER,
      OverlayObjectType.KITCHEN_SINK,
      OverlayObjectType.BARREL,
      OverlayObjectType.FILING_CABINET,
      OverlayObjectType.BASIN,
      OverlayObjectType.DOOR  // Doors block unless opened
    ];
    return blockingObjects.includes(objectType);
  };

  // Check if terrain blocks movement
  const isBlockingTerrain = (biome: BiomeType): boolean => {
    const blockingBiomes = [
      // Walls and structural elements
      BiomeType.WALL,
      BiomeType.WALL_BACK,
      BiomeType.WALL_BACK_WINDOW,
      BiomeType.WALL_BACK_DOOR,
      BiomeType.WALL_GATE,
      BiomeType.WALL_WINDOW,
      
      // Doors (NPCs shouldn't walk through closed doors)
      BiomeType.DOOR,
      BiomeType.DOOR_LOCKED,
      
      // Water features
      BiomeType.OCEAN,
      BiomeType.LAKE,
      BiomeType.RIVER,
      BiomeType.FOUNTAIN,
      BiomeType.BATH,
      BiomeType.BASIN,
      
      // Structural pillars and decorations
      BiomeType.PILLAR,
      BiomeType.PILLAR_BASE,
      BiomeType.PILLAR_TOP,
      BiomeType.COLUMN,
      BiomeType.STATUE,
      
      // Large furniture that blocks movement
      BiomeType.TABLE,
      BiomeType.TABLE_LEFT,
      BiomeType.TABLE_CENTER,
      BiomeType.TABLE_RIGHT,
      BiomeType.DESK,
      BiomeType.BED,
      BiomeType.THRONE,
      BiomeType.BOOKSHELF,
      BiomeType.CABINET,
      BiomeType.CHEST,
      BiomeType.ALTAR,
      BiomeType.SHRINE,
      BiomeType.WEAPON_RACK,
      BiomeType.ARMOR_STAND,
      BiomeType.PODIUM,
      BiomeType.DAIS,
      BiomeType.STAGE,
      
      // Kitchen furniture
      BiomeType.STOVE,
      BiomeType.KITCHEN_STOVE,
      BiomeType.KITCHEN_COUNTER,
      BiomeType.KITCHEN_SINK,
      BiomeType.FILING_CABINET,
      
      // Other blocking elements
      BiomeType.GUARD_POST,
      BiomeType.TOILET,
      BiomeType.MIRROR,
      BiomeType.COAT_RACK
    ];
    return blockingBiomes.includes(biome);
  };

  // Main update loop
  useEffect(() => {
    // Only log when we actually have a special map and NPCs to avoid spam
    if (!mapArchetype || !npcs || npcs.length === 0) {
      return; // Skip silently when not in special map
    }
    
    console.log('[useSpecialMapNpcBehavior] Starting behavior updates for', npcs.length, 'NPCs in', mapArchetype, 'archetype');

    const updateAllNpcs = () => {
      npcs.forEach(npc => {
        updateNpcBehavior(npc);
      });
    };

    // Initial update
    updateAllNpcs();

    // Set up periodic updates (every 2 seconds)
    updateInterval.current = setInterval(updateAllNpcs, 2000);

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [npcs, mapArchetype, updateNpcBehavior]);

  // Get behavior state for a specific NPC
  const getNpcBehaviorState = useCallback((npcId: string): NpcBehaviorState | undefined => {
    return npcStates.current.get(npcId);
  }, []);

  // Check if NPC will interact with player
  const willNpcInteract = useCallback((npcId: string): boolean => {
    const state = npcStates.current.get(npcId);
    return state?.attitude?.willInteract ?? true;
  }, []);

  // Get NPC's current mood
  const getNpcMood = useCallback((npcId: string): NpcMood | undefined => {
    return npcStates.current.get(npcId)?.mood;
  }, []);

  // Get NPC's current activity
  const getNpcActivity = useCallback((npcId: string): NpcActivity | undefined => {
    return npcStates.current.get(npcId)?.activity;
  }, []);

  // Force update a specific NPC
  const forceUpdateNpc = useCallback((npcId: string) => {
    const npc = npcs.find(n => n.id === npcId);
    if (npc) {
      updateNpcBehavior(npc);
    }
  }, [npcs, updateNpcBehavior]);

  // Player performs action that affects NPCs
  const playerPerformAction = useCallback((action: string) => {
    playerActions.current.push(action);
    
    // Immediately update nearby NPCs
    npcs.forEach(npc => {
      const distance = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
      if (distance <= 5) {
        updateNpcBehavior(npc);
      }
    });
  }, [npcs, player, updateNpcBehavior]);

  return {
    getNpcBehaviorState,
    willNpcInteract,
    getNpcMood,
    getNpcActivity,
    forceUpdateNpc,
    playerPerformAction,
    npcStates: npcStates.current
  };
}

export default useSpecialMapNpcBehavior;