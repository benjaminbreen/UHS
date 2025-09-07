/**
 * Government District Activity Service
 * Handles all government-specific interactions and activities
 */

import { PlayerCharacter, MapData, Tile, HistoricalEra, CulturalZone } from '../types';
import { eventBus } from './eventBus';

export interface GovernmentActivity {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirements?: {
    minReputation?: number;
    minGold?: number;
    hasItem?: string;
    skill?: { name: string; min: number };
  };
  effects: {
    reputation?: number;
    gold?: number;
    health?: number;
    items?: string[];
    quest?: string;
    event?: string;
  };
  cooldownHours?: number;
  available: (player: PlayerCharacter, era: HistoricalEra, zone: CulturalZone) => boolean;
}

class GovernmentActivityService {
  private lastActivityTime: Map<string, number> = new Map();

  private activities: GovernmentActivity[] = [
    {
      id: 'pay_taxes',
      name: 'Pay Taxes',
      description: 'Pay your civic duties to maintain good standing',
      icon: '💰',
      requirements: {
        minGold: 10,
      },
      effects: {
        gold: -10,
        reputation: 5,
      },
      cooldownHours: 168, // Once per week
      available: (player, era, zone) => {
        return player.gold >= 10;
      }
    },
    {
      id: 'register_business',
      name: 'Register a Business',
      description: 'Obtain official permits to trade in this region',
      icon: '📜',
      requirements: {
        minGold: 50,
        minReputation: 20,
      },
      effects: {
        gold: -50,
        items: ['trade_permit'],
        reputation: 10,
      },
      cooldownHours: 0, // One time only
      available: (player, era, zone) => {
        return !player.inventory?.some(item => item.id === 'trade_permit');
      }
    },
    {
      id: 'report_crime',
      name: 'Report a Crime',
      description: 'Alert authorities about criminal activity',
      icon: '⚖️',
      requirements: {},
      effects: {
        reputation: 3,
        quest: 'investigate_crime',
      },
      cooldownHours: 24,
      available: (player, era, zone) => {
        return era !== HistoricalEra.PREHISTORY;
      }
    },
    {
      id: 'seek_audience',
      name: 'Seek Audience with Officials',
      description: 'Request a meeting with government representatives',
      icon: '👥',
      requirements: {
        minReputation: 30,
      },
      effects: {
        event: 'government_audience',
        reputation: 5,
      },
      cooldownHours: 72,
      available: (player, era, zone) => {
        return player.reputation >= 30;
      }
    },
    {
      id: 'join_militia',
      name: 'Join the Local Militia',
      description: 'Enlist in the defense forces',
      icon: '🗡️',
      requirements: {
        skill: { name: 'combat', min: 20 },
      },
      effects: {
        items: ['militia_badge'],
        reputation: 15,
        quest: 'militia_training',
      },
      cooldownHours: 0, // One time
      available: (player, era, zone) => {
        const hasCombatSkill = (player.skills?.combat || 0) >= 20;
        const notEnlisted = !player.inventory?.some(item => item.id === 'militia_badge');
        return hasCombatSkill && notEnlisted;
      }
    },
    {
      id: 'civic_duty',
      name: 'Perform Civic Service',
      description: 'Volunteer for community work',
      icon: '🏛️',
      requirements: {},
      effects: {
        reputation: 8,
        health: -5,
      },
      cooldownHours: 48,
      available: (player, era, zone) => {
        return player.health > 20;
      }
    },
    {
      id: 'request_documents',
      name: 'Request Official Documents',
      description: 'Obtain birth certificates, travel papers, or other documents',
      icon: '📋',
      requirements: {
        minGold: 5,
      },
      effects: {
        gold: -5,
        items: ['official_documents'],
      },
      cooldownHours: 24,
      available: (player, era, zone) => {
        return era !== HistoricalEra.PREHISTORY && player.gold >= 5;
      }
    },
    {
      id: 'attend_trial',
      name: 'Attend Public Trial',
      description: 'Observe judicial proceedings',
      icon: '⚖️',
      requirements: {},
      effects: {
        event: 'public_trial',
      },
      cooldownHours: 24,
      available: (player, era, zone) => {
        // Trials exist in most organized societies
        return era !== HistoricalEra.PREHISTORY;
      }
    },
    {
      id: 'petition_ruler',
      name: 'Petition the Ruler',
      description: 'Submit a formal request to the governing authority',
      icon: '👑',
      requirements: {
        minReputation: 50,
        hasItem: 'official_documents',
      },
      effects: {
        event: 'ruler_petition',
        reputation: 10,
      },
      cooldownHours: 168,
      available: (player, era, zone) => {
        const hasDocuments = player.inventory?.some(item => item.id === 'official_documents');
        return player.reputation >= 50 && hasDocuments;
      }
    },
    {
      id: 'bribe_official',
      name: 'Bribe an Official',
      description: 'Grease the wheels of bureaucracy (illegal)',
      icon: '💸',
      requirements: {
        minGold: 100,
      },
      effects: {
        gold: -100,
        reputation: -20,
        items: ['favor_token'],
      },
      cooldownHours: 72,
      available: (player, era, zone) => {
        // Corruption exists in all eras unfortunately
        return player.gold >= 100;
      }
    },
    // Era-specific activities
    {
      id: 'gladiator_games',
      name: 'Attend Gladiator Games',
      description: 'Watch combat entertainment at the arena',
      icon: '⚔️',
      requirements: {
        minGold: 2,
      },
      effects: {
        gold: -2,
        event: 'gladiator_games',
      },
      cooldownHours: 24,
      available: (player, era, zone) => {
        return era === HistoricalEra.ANTIQUITY && 
               (zone === CulturalZone.EUROPE || zone === CulturalZone.MENA) &&
               player.gold >= 2;
      }
    },
    {
      id: 'feudal_oath',
      name: 'Swear Feudal Oath',
      description: 'Pledge loyalty to the local lord',
      icon: '🛡️',
      requirements: {},
      effects: {
        reputation: 20,
        quest: 'feudal_service',
      },
      cooldownHours: 0, // One time
      available: (player, era, zone) => {
        return era === HistoricalEra.MEDIEVAL && 
               zone === CulturalZone.EUROPE &&
               !player.quests?.some(q => q.id === 'feudal_service');
      }
    },
    {
      id: 'tea_ceremony',
      name: 'Attend Tea Ceremony',
      description: 'Participate in formal government tea ceremony',
      icon: '🍵',
      requirements: {
        minReputation: 25,
      },
      effects: {
        reputation: 10,
        health: 5,
      },
      cooldownHours: 48,
      available: (player, era, zone) => {
        return zone === CulturalZone.EAST_ASIA && 
               era !== HistoricalEra.PREHISTORY &&
               player.reputation >= 25;
      }
    },
    {
      id: 'colonial_protest',
      name: 'Join Colonial Protest',
      description: 'Protest against colonial rule',
      icon: '✊',
      requirements: {},
      effects: {
        reputation: -10, // With authorities
        event: 'colonial_protest',
      },
      cooldownHours: 72,
      available: (player, era, zone) => {
        return era === HistoricalEra.INDUSTRIAL_ERA &&
               (zone === CulturalZone.SOUTH_ASIA || 
                zone === CulturalZone.SUB_SAHARAN_AFRICA ||
                zone === CulturalZone.MENA);
      }
    },
    {
      id: 'vote_election',
      name: 'Vote in Election',
      description: 'Cast your ballot in democratic elections',
      icon: '🗳️',
      requirements: {},
      effects: {
        reputation: 5,
        event: 'election_day',
      },
      cooldownHours: 8760, // Once per year
      available: (player, era, zone) => {
        return era === HistoricalEra.MODERN_ERA;
      }
    }
  ];

  public getAvailableActivities(
    player: PlayerCharacter,
    era: HistoricalEra,
    zone: CulturalZone,
    tile?: Tile
  ): GovernmentActivity[] {
    const now = Date.now();
    
    return this.activities.filter(activity => {
      // Check if activity is available for this era/zone
      if (!activity.available(player, era, zone)) {
        return false;
      }

      // Check cooldown
      if (activity.cooldownHours) {
        const lastTime = this.lastActivityTime.get(`${player.id}-${activity.id}`);
        if (lastTime) {
          const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
          if (hoursPassed < activity.cooldownHours) {
            return false;
          }
        }
      }

      // Check requirements
      if (activity.requirements) {
        const req = activity.requirements;
        
        if (req.minGold && player.gold < req.minGold) {
          return false;
        }
        
        if (req.minReputation && player.reputation < req.minReputation) {
          return false;
        }
        
        if (req.hasItem && !player.inventory?.some(item => item.id === req.hasItem)) {
          return false;
        }
        
        if (req.skill) {
          const playerSkill = player.skills?.[req.skill.name] || 0;
          if (playerSkill < req.skill.min) {
            return false;
          }
        }
      }

      return true;
    });
  }

  public performActivity(
    activityId: string,
    player: PlayerCharacter,
    era: HistoricalEra,
    zone: CulturalZone
  ): { success: boolean; message: string; effects?: any } {
    const activity = this.activities.find(a => a.id === activityId);
    
    if (!activity) {
      return { success: false, message: 'Activity not found' };
    }

    // Double-check availability
    if (!activity.available(player, era, zone)) {
      return { success: false, message: 'Activity not available' };
    }

    // Record activity time
    if (activity.cooldownHours) {
      this.lastActivityTime.set(`${player.id}-${activity.id}`, Date.now());
    }

    // Apply effects
    const effects = { ...activity.effects };

    // Emit events for game systems to handle
    if (effects.gold) {
      eventBus.emit('player:goldChange', { amount: effects.gold });
    }
    
    if (effects.reputation) {
      eventBus.emit('player:reputationChange', { amount: effects.reputation });
    }
    
    if (effects.health) {
      eventBus.emit('player:healthChange', { amount: effects.health });
    }
    
    if (effects.items) {
      effects.items.forEach(itemId => {
        eventBus.emit('player:itemAdd', { itemId });
      });
    }
    
    if (effects.quest) {
      eventBus.emit('quest:start', { questId: effects.quest });
    }
    
    if (effects.event) {
      eventBus.emit('event:trigger', { eventId: effects.event });
    }

    return {
      success: true,
      message: `You ${activity.name.toLowerCase()}`,
      effects
    };
  }

  public getActivityCooldown(activityId: string, playerId: string): number {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity || !activity.cooldownHours) {
      return 0;
    }

    const lastTime = this.lastActivityTime.get(`${playerId}-${activityId}`);
    if (!lastTime) {
      return 0;
    }

    const now = Date.now();
    const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, activity.cooldownHours - hoursPassed);
    
    return hoursRemaining;
  }
}

export const governmentActivityService = new GovernmentActivityService();