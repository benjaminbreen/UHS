/**
 * services/holyPlaceInteriorService.ts
 * Service for managing holy place interior interactions and access control
 */

import { HolyPlaceRoom, hasRoomPermission, getAccessDeniedMessage } from '../generation/interiorMap/holyPlaceLayouts';
import { NpcEntity } from '../types';

export interface HolyPlaceAccessResult {
  allowed: boolean;
  message?: string;
  requiredAction?: 'quest' | 'donation' | 'reputation' | 'role_change';
  requiredValue?: number;
}

/**
 * Check if player can access a specific room in a holy place
 */
export function checkHolyPlaceAccess(
  room: HolyPlaceRoom,
  player: NpcEntity,
  activeQuests?: string[],
  holyPlaceReligion?: string
): HolyPlaceAccessResult {
  // Check basic permission
  const hasPermission = hasRoomPermission(
    room,
    player.role,
    activeQuests && activeQuests.length > 0,
    player.socialContext?.reputation
  );
  
  if (hasPermission) {
    return { allowed: true };
  }
  
  // Generate appropriate denial message and suggestion
  const denialMessage = getAccessDeniedMessage(room);
  
  // Determine what the player needs to do to gain access
  let requiredAction: HolyPlaceAccessResult['requiredAction'];
  let requiredValue: number | undefined;
  
  switch (room.requiredPermission) {
    case 'clergy':
    case 'high_clergy':
      requiredAction = 'role_change';
      break;
    case 'nobility':
      if ((player.socialContext?.reputation || 0) < 75) {
        requiredAction = 'reputation';
        requiredValue = 75;
      } else {
        requiredAction = 'role_change';
      }
      break;
    case 'quest':
      requiredAction = 'quest';
      break;
  }
  
  return {
    allowed: false,
    message: denialMessage,
    requiredAction,
    requiredValue
  };
}

/**
 * Generate interaction options for a holy place room
 */
export function getHolyPlaceRoomInteractions(
  room: HolyPlaceRoom,
  player: NpcEntity
): string[] {
  const interactions: string[] = [];
  
  // Public rooms have basic interactions
  if (room.type === 'public') {
    interactions.push('Pray', 'Make Offering', 'Speak with Clergy');
    
    if (room.features.includes('altar')) {
      interactions.push('Approach Altar');
    }
    if (room.features.includes('holy_water') || room.features.includes('purification_fountain')) {
      interactions.push('Ritual Cleansing');
    }
  }
  
  // Private rooms have specialized interactions
  if (room.type === 'private') {
    if (room.name.toLowerCase().includes('confession')) {
      interactions.push('Confess Sins', 'Seek Guidance');
    }
    if (room.name.toLowerCase().includes('study') || room.name.toLowerCase().includes('library')) {
      interactions.push('Study Texts', 'Copy Manuscripts');
    }
    if (room.name.toLowerCase().includes('treasury')) {
      interactions.push('Donate Wealth', 'View Treasures');
    }
  }
  
  // Restricted rooms have quest-related interactions
  if (room.type === 'restricted') {
    if (room.name.toLowerCase().includes('crypt')) {
      interactions.push('Explore Tombs', 'Read Inscriptions');
    }
    if (room.name.toLowerCase().includes('relic')) {
      interactions.push('Examine Relics', 'Seek Blessing');
    }
    if (room.name.toLowerCase().includes('oracle') || room.name.toLowerCase().includes('divination')) {
      interactions.push('Seek Prophecy', 'Divine Future');
    }
  }
  
  return interactions;
}

/**
 * Get NPCs that should be present in a holy place room
 */
export function getHolyPlaceRoomNPCs(
  room: HolyPlaceRoom,
  culturalZone: string,
  era: string
): { role: string; personality: string; dialogue: string[] }[] {
  const npcs: { role: string; personality: string; dialogue: string[] }[] = [];
  
  if (room.npcs) {
    room.npcs.forEach(npcType => {
      let dialogue: string[] = [];
      let personality = 'devout';
      
      switch (npcType) {
        case 'priest':
        case 'imam':
        case 'monk':
        case 'rabbi':
          dialogue = [
            'May the divine light guide your path.',
            'Have you come to seek spiritual guidance?',
            'The sacred texts speak of times like these.',
            'Your faith will be rewarded in time.'
          ];
          personality = 'wise';
          break;
          
        case 'pilgrim':
        case 'worshipper':
        case 'devotee':
          dialogue = [
            'I've traveled far to reach this holy place.',
            'The journey here has strengthened my faith.',
            'Have you also come seeking blessings?',
            'This sacred ground brings peace to my soul.'
          ];
          personality = 'humble';
          break;
          
        case 'guard':
        case 'temple_guard':
        case 'royal_guard':
          dialogue = [
            'State your business in this sacred place.',
            'These halls are not for the uninitiated.',
            'Move along if you have no purpose here.',
            'The inner sanctum is forbidden to outsiders.'
          ];
          personality = 'stern';
          break;
          
        case 'scholar':
        case 'librarian':
        case 'scribe':
          dialogue = [
            'The ancient texts hold many secrets.',
            'Knowledge is the path to enlightenment.',
            'I've spent years studying these manuscripts.',
            'Perhaps you'd be interested in learning?'
          ];
          personality = 'scholarly';
          break;
          
        default:
          dialogue = [
            'Welcome to this sacred place.',
            'May you find what you seek here.',
            'The divine presence is strong in these halls.'
          ];
      }
      
      npcs.push({
        role: npcType,
        personality,
        dialogue
      });
    });
  }
  
  return npcs;
}

/**
 * Calculate reputation change from holy place interactions
 */
export function calculateHolyPlaceReputationChange(
  action: string,
  donation?: number
): number {
  switch (action) {
    case 'pray':
      return 1;
    case 'offering':
      return donation ? Math.min(10, Math.floor(donation / 10)) : 2;
    case 'confession':
      return 3;
    case 'pilgrimage':
      return 5;
    case 'sacrilege':
      return -20;
    case 'theft':
      return -50;
    default:
      return 0;
  }
}

/**
 * Generate quest hooks for holy places
 */
export function generateHolyPlaceQuests(
  culturalZone: string,
  era: string,
  religion: string
): { title: string; description: string; reward: string }[] {
  const quests: { title: string; description: string; reward: string }[] = [];
  
  // Universal quest types
  quests.push({
    title: 'Pilgrimage of Faith',
    description: `Visit three holy sites of the ${religion} faith to receive a divine blessing.`,
    reward: 'Divine Blessing (+10 all stats for 30 days)'
  });
  
  quests.push({
    title: 'Sacred Relic Recovery',
    description: 'A sacred relic has been stolen. Track down the thieves and return it.',
    reward: 'Access to Inner Sanctum + Gold Reward'
  });
  
  // Culture-specific quests
  if (culturalZone === 'EUROPEAN') {
    quests.push({
      title: 'Illuminate the Manuscript',
      description: 'Help the monks complete an illuminated manuscript by gathering rare pigments.',
      reward: 'Scriptorium Access + Writing Skills'
    });
  }
  
  if (culturalZone === 'MENA') {
    quests.push({
      title: 'The Call to Prayer',
      description: 'The muezzin is ill. Climb the minaret and perform the call to prayer.',
      reward: 'Community Respect + Prayer Mat'
    });
  }
  
  if (culturalZone === 'EAST_ASIAN') {
    quests.push({
      title: 'Tea Ceremony Mastery',
      description: 'Learn the ancient art of the tea ceremony from the temple master.',
      reward: 'Tea Ceremony Skills + Meditation Bonus'
    });
  }
  
  if (culturalZone === 'SOUTH_ASIAN') {
    quests.push({
      title: 'Festival Preparations',
      description: 'Help prepare the temple for the upcoming religious festival.',
      reward: 'Festival Blessings + Reputation'
    });
  }
  
  return quests;
}

// Export singleton service
export const holyPlaceInteriorService = {
  checkAccess: checkHolyPlaceAccess,
  getRoomInteractions: getHolyPlaceRoomInteractions,
  getRoomNPCs: getHolyPlaceRoomNPCs,
  calculateReputationChange: calculateHolyPlaceReputationChange,
  generateQuests: generateHolyPlaceQuests
};