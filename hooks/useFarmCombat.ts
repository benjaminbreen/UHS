/**
 * hooks/useFarmCombat.ts
 * Handle farm NPC to combat entity conversion
 *
 * Phase 2 of Farm Panel refactoring - extracts combat conversion logic
 * from FarmPanelImproved.tsx (lines 196-337)
 */

import { useCallback, useRef } from 'react';
import { PlayerCharacter, CulturalZone } from '../types';
import { FarmFamilyMember } from '../services/farmService';

interface UseFarmCombatOptions {
  playerCharacter: PlayerCharacter;
  culturalZone: CulturalZone;
  onClose: () => void;
  onInitiateEncounter?: (target: any) => void;
}

interface UseFarmCombatReturn {
  handleInitiateEncounter: (farmCharacter: FarmFamilyMember) => void;
  isUnmountingRef: React.MutableRefObject<boolean>;
}

export function useFarmCombat({
  playerCharacter,
  culturalZone,
  onClose,
  onInitiateEncounter,
}: UseFarmCombatOptions): UseFarmCombatReturn {
  const isUnmountingRef = useRef(false);

  const handleInitiateEncounter = useCallback(
    (farmCharacter: FarmFamilyMember) => {
      // Mark component as unmounting to prevent state updates
      isUnmountingRef.current = true;

      // Convert the farm family member to a proper NPC entity structure
      // This is necessary because farm NPCs are virtual entities not in the map's NPC array
      const npcEntity = {
        id: `farm_${farmCharacter.id || farmCharacter.name?.replace(/\s+/g, '_') || 'farmer'}`,
        name: farmCharacter.name || 'Farmer',
        type: 'human' as const,
        x: playerCharacter.x || 0,
        y: playerCharacter.y || 0,
        emoji: farmCharacter.emoji || '👨‍🌾',
        aiType: 'hostile' as const,
        health: farmCharacter.health || 100,
        maxHealth: farmCharacter.maxHealth || 100,
        stats: {
          strength: farmCharacter.stats?.strength || 8,
          dexterity: farmCharacter.stats?.dexterity || 6,
          stamina: farmCharacter.stats?.stamina || 7,
          constitution: farmCharacter.stats?.constitution || 7,
          intelligence: farmCharacter.stats?.intelligence || 5,
          wisdom: farmCharacter.stats?.wisdom || 6,
          charisma: farmCharacter.stats?.charisma || 4,
          perception: farmCharacter.stats?.perception || 5,
          craftiness: farmCharacter.stats?.craftiness || 4,
          persuasion: farmCharacter.stats?.persuasion || 3,
          level: 3,
          speed: 1,
          empathy: 5,
          eloquence: 3,
          humor: 2,
          intimidation: 6,
          loyalty: 8,
          curiosity: 4,
          caution: 7,
          aggression: 8, // High since they're defending their farm
          greed: 3,
          reputation: 5,
          piety: 5,
          education: 2,
        },
        personality: {
          traits: ['protective', 'territorial', 'hardworking'],
          temperament: 'defensive',
          quirks: [],
        },
        socialContext: {
          class: 'COMMONER',
          reputation: 'LOCAL',
          relationships: [],
        },
        class: 'COMMONER',
        role: farmCharacter.role || 'Farmer',
        wealthLevel: 'modest' as const,
        gender: farmCharacter.gender || ('male' as const),
        age: farmCharacter.age || 35,
        appearance: {
          // Base physical features
          skinColor: farmCharacter.skinTone || '#D2A679',
          hairColor: farmCharacter.hairColor || '#4A3C28',
          eyeColor: farmCharacter.eyeColor || '#5A4A3A',
          hairstyle: 'short',
          build: 'stocky' as const,

          // Facial characteristics
          faceShape: 'square' as const,
          eyeShape: 'narrow' as const,
          noseShape: 'broad' as const,
          cheekbones: 'average' as const,
          jawline: 'square' as const,

          // Hair details
          hairTexture: 'wavy' as const,
          hairLength: 'short' as const,
          facialHair: farmCharacter.gender === 'male',
          facialHairStyle: farmCharacter.gender === 'male' ? ('stubble' as const) : undefined,
          facialHairThickness: farmCharacter.gender === 'male' ? ('medium' as const) : undefined,

          // Clothing data
          garment: {
            type: 'TUNIC' as const,
            name: 'simple_tunic',
            color: '#8B4513',
          },
          headgear: {
            type: 'HAT' as const,
            name: 'straw_hat',
            color: '#F4E4C1',
          },
          footwear: {
            type: 'BOOTS' as const,
            name: 'leather_boots',
            color: '#654321',
          },
          belt: {
            type: 'BELT' as const,
            name: 'leather_belt',
            color: '#8B4513',
          },
          accessory: {
            type: 'NONE' as const,
            name: 'none',
            color: '#000000',
          },

          // Color palette for combat sprite
          palette: {
            primary: '#8B4513', // Brown tunic
            secondary: '#F4E4C1', // Light straw hat
            accent: '#654321', // Dark brown boots
          },

          // Legacy properties
          skinTone: farmCharacter.skinTone || '#D2A679',
          height: 'average' as const,
        },
        inventory: farmCharacter.inventory || [],
        equippedItems: {},
        memory: {
          opinionOfPlayer: -100, // Hostile because attacking
          conversationSummaries: [],
          shortTermMemory: ['Player refused to leave', 'Defending the farm'],
          lastInteraction: Date.now(),
        },
        statusEffects: [],
        isHostile: true,
        initialDialogue: farmCharacter.initialDialogue || ['You leave me no choice! Defend the farm!'],
        profession: farmCharacter.role || 'Farmer',
        culturalBackground: culturalZone,
      };

      // Close the farm panel first to ensure clean transition
      onClose();

      // Then initiate combat after a brief delay to allow modal cleanup
      setTimeout(() => {
        if (onInitiateEncounter) {
          onInitiateEncounter(npcEntity);
        }
      }, 100);
    },
    [onInitiateEncounter, playerCharacter, culturalZone, onClose]
  );

  return {
    handleInitiateEncounter,
    isUnmountingRef,
  };
}
