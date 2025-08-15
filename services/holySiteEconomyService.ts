/**
 * Holy Site Economy Service
 * Manages tithes, offerings, blessings, and religious economic flows
 */

import { TerrainStructure, MapData, NpcEntity, HistoricalEra, Item, GameDate } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { FACTION_DATA } from '../constants';
import { CulturalZone } from '../constants';
import { getReligionDisplay, detectReligion } from '../constants/gameData/religionIcons';

export interface ReligiousEconomy {
  holySiteId: string;
  tithes: {
    weekly: number;
    monthly: number;
    annual: number;
  };
  offerings: {
    items: Record<string, number>; // Item ID to quantity
    coins: number;
  };
  blessings: {
    type: 'health' | 'luck' | 'wisdom' | 'protection' | 'prosperity';
    cost: number;
    duration: number; // in hours
  }[];
  pilgrims: {
    current: number;
    maxCapacity: number;
    averageOffering: number;
  };
}

export interface ReligiousService {
  id: string;
  name: string;
  description: string;
  cost: number;
  effects: {
    type: 'blessing' | 'healing' | 'prophecy' | 'absolution' | 'conversion';
    potency: number; // 0-1
    duration?: number; // hours
  };
  requirements?: {
    allegianceGroup?: string;
    minReputation?: number;
    items?: string[];
  };
}

export class HolySiteEconomyService {
  private economies: Map<string, ReligiousEconomy> = new Map();
  private services: Map<string, ReligiousService[]> = new Map();

  /**
   * Initialize holy site economy based on allegiance and faction
   */
  initializeHolySite(
    structure: TerrainStructure,
    mapData: MapData,
    npcs: NpcEntity[]
  ): void {
    if (structure.structureType !== 'holy_site') return;

    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const { era, year } = dateInfo;
    const culturalZone = mapData.culturalZone as CulturalZone;
    const region = mapData.region || '';

    // Get faction data for allegiance groups
    const factionData = FACTION_DATA[culturalZone]?.[region]?.[era as HistoricalEra];
    const allegianceGroup = structure.allegianceGroup || factionData?.dominantPower || 'Independent';

    // Calculate tithes based on allegiance group control
    const tithes = this.calculateTithes(structure, allegianceGroup, npcs, year);
    
    // Initialize offerings storage
    const offerings = {
      items: {},
      coins: 0
    };

    // Define available blessings based on religion/era
    const blessings = this.generateBlessings(culturalZone, era as HistoricalEra, year);

    // Calculate pilgrim capacity
    const pilgrims = this.calculatePilgrimCapacity(structure, culturalZone, year);

    this.economies.set(structure.id, {
      holySiteId: structure.id,
      tithes,
      offerings,
      blessings,
      pilgrims
    });

    // Get the actual religion for this holy site
    const religion = (structure as any).religion || structure.name || allegianceGroup;

    // Generate available religious services
    const services = this.generateReligiousServices(culturalZone, era as HistoricalEra, allegianceGroup, religion);
    this.services.set(structure.id, services);

    // Update structure treasury if not already set
    if (!structure.treasury) {
      structure.treasury = {
        coins: Math.floor(tithes.monthly * 3), // Start with 3 months of tithes
        incense: 10,
        candles: 20
      };
    }
  }

  /**
   * Calculate tithes based on allegiance control and population
   */
  private calculateTithes(
    structure: TerrainStructure,
    allegianceGroup: string,
    npcs: NpcEntity[],
    year: number
  ): ReligiousEconomy['tithes'] {
    // Count NPCs loyal to this allegiance group within influence radius
    const loyalNpcs = npcs.filter(npc => {
      // Skip NPCs without location data
      if (!npc.location || typeof npc.location.x === 'undefined' || typeof npc.location.y === 'undefined') {
        console.warn('[HolySite] NPC missing location data:', npc.id);
        return false;
      }
      const distance = Math.hypot(
        npc.location.x - structure.location[0],
        npc.location.y - structure.location[1]
      );
      return distance < 30 && npc.allegianceGroup === allegianceGroup;
    });

    // Base tithe per loyal NPC varies by era
    let baseTithe = 1;
    if (year < 500) baseTithe = 0.5; // Ancient times - less monetary economy
    else if (year < 1500) baseTithe = 1; // Medieval - standard tithes
    else if (year < 1800) baseTithe = 1.5; // Early modern - growing wealth
    else if (year < 1950) baseTithe = 2; // Industrial - more disposable income
    else baseTithe = 3; // Modern - highest donations

    const weeklyTithes = loyalNpcs.length * baseTithe;
    
    return {
      weekly: weeklyTithes,
      monthly: weeklyTithes * 4,
      annual: weeklyTithes * 52
    };
  }

  /**
   * Generate blessings available based on culture and era
   */
  private generateBlessings(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    year: number
  ): ReligiousEconomy['blessings'] {
    const blessings: ReligiousEconomy['blessings'] = [];

    // Universal blessings
    blessings.push({
      type: 'health',
      cost: 5,
      duration: 24
    });

    blessings.push({
      type: 'protection',
      cost: 10,
      duration: 48
    });

    // Era-specific blessings
    if (year < 1500) {
      blessings.push({
        type: 'luck',
        cost: 8,
        duration: 36
      });
    }

    if (year >= 500 && year < 1800) {
      blessings.push({
        type: 'wisdom',
        cost: 15,
        duration: 72
      });
    }

    if (year >= 1500) {
      blessings.push({
        type: 'prosperity',
        cost: 20,
        duration: 168 // 1 week
      });
    }

    return blessings;
  }

  /**
   * Calculate pilgrim capacity and offerings
   */
  private calculatePilgrimCapacity(
    structure: TerrainStructure,
    culturalZone: CulturalZone,
    year: number
  ): ReligiousEconomy['pilgrims'] {
    // Base capacity varies by structure importance
    let baseCapacity = 20;
    
    // Major holy sites have more capacity
    if (structure.name?.includes('Cathedral') || 
        structure.name?.includes('Temple') ||
        structure.name?.includes('Mosque')) {
      baseCapacity = 50;
    }

    // Pilgrimage was more common in medieval times
    if (year >= 800 && year <= 1600) {
      baseCapacity *= 1.5;
    }

    // Average offering varies by era
    let averageOffering = 2;
    if (year < 500) averageOffering = 1;
    else if (year < 1500) averageOffering = 2;
    else if (year < 1900) averageOffering = 5;
    else averageOffering = 10;

    return {
      current: Math.floor(baseCapacity * 0.3), // Start at 30% capacity
      maxCapacity: Math.floor(baseCapacity),
      averageOffering
    };
  }

  /**
   * Generate religious services available at this holy site
   */
  private generateReligiousServices(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    allegianceGroup: string,
    religion?: string
  ): ReligiousService[] {
    const services: ReligiousService[] = [];

    // Basic blessing service
    services.push({
      id: 'basic_blessing',
      name: 'Receive Blessing',
      description: 'Receive a blessing from the clergy',
      cost: 5,
      effects: {
        type: 'blessing',
        potency: 0.5,
        duration: 24
      }
    });

    // Healing service (if pre-modern medicine)
    const year = parseInt(era);
    if (isNaN(year) || year < 1800) {
      services.push({
        id: 'healing_prayer',
        name: 'Healing Prayer',
        description: 'Seek divine intervention for ailments',
        cost: 10,
        effects: {
          type: 'healing',
          potency: 0.3
        }
      });
    }

    // Prophecy/divination (culture-specific)
    if (culturalZone === 'MEDITERRANEAN' || culturalZone === 'MENA' || culturalZone === 'EAST_ASIAN') {
      services.push({
        id: 'divine_prophecy',
        name: 'Seek Prophecy',
        description: 'Learn what the future holds',
        cost: 20,
        effects: {
          type: 'prophecy',
          potency: 0.7
        },
        requirements: {
          minReputation: 10
        }
      });
    }

    // Absolution (Christian cultures)
    if ((culturalZone === 'EUROPEAN' || culturalZone === 'SOUTH_AMERICAN') && 
        (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN)) {
      services.push({
        id: 'absolution',
        name: 'Confession & Absolution',
        description: 'Confess sins and receive forgiveness',
        cost: 15,
        effects: {
          type: 'absolution',
          potency: 1
        },
        requirements: {
          allegianceGroup: allegianceGroup
        }
      });
    }

    // Conversion service - use actual religion name
    const religionName = this.getReligionName(religion || allegianceGroup, culturalZone);
    services.push({
      id: 'conversion',
      name: `Convert to ${religionName}`,
      description: `Join the ${religionName} faith and adopt its practices`,
      cost: 0,
      effects: {
        type: 'conversion',
        potency: 1
      }
    });

    return services;
  }

  /**
   * Get proper religion name from various inputs
   */
  private getReligionName(religion: string, culturalZone: CulturalZone): string {
    // Try to get proper display name
    const display = getReligionDisplay(religion);
    if (display && display.name !== 'Local Faith') {
      return display.name;
    }
    
    // Try to detect from structure name
    const detected = detectReligion(religion, culturalZone, 'medieval');
    const detectedDisplay = getReligionDisplay(detected);
    if (detectedDisplay) {
      return detectedDisplay.name;
    }
    
    // Fallback to cleaning up the input
    return religion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Process a tithe payment from an NPC
   */
  processTithe(holySiteId: string, npc: NpcEntity, amount: number): boolean {
    const economy = this.economies.get(holySiteId);
    if (!economy) return false;

    // Deduct from NPC inventory
    const npcCoins = npc.inventory?.find(item => item.id === 'coins');
    if (!npcCoins || npcCoins.quantity < amount) return false;

    npcCoins.quantity -= amount;
    
    // Add to offerings
    economy.offerings.coins += amount;
    
    return true;
  }

  /**
   * Process an offering of items
   */
  processOffering(holySiteId: string, items: Item[]): void {
    const economy = this.economies.get(holySiteId);
    if (!economy) return;

    items.forEach(item => {
      economy.offerings.items[item.id] = (economy.offerings.items[item.id] || 0) + (item.quantity || 1);
    });
  }

  /**
   * Purchase a religious service
   */
  purchaseService(
    holySiteId: string,
    serviceId: string,
    npc: NpcEntity
  ): { success: boolean; message: string } {
    const services = this.services.get(holySiteId);
    if (!services) return { success: false, message: 'No services available' };

    const service = services.find(s => s.id === serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    // Check requirements
    if (service.requirements) {
      if (service.requirements.allegianceGroup && 
          npc.allegianceGroup !== service.requirements.allegianceGroup) {
        return { success: false, message: 'Wrong faith' };
      }
      
      if (service.requirements.minReputation !== undefined) {
        // TODO: Check reputation when system is implemented
      }
    }

    // Check payment
    const npcCoins = npc.inventory?.find(item => item.id === 'coins');
    if (!npcCoins || npcCoins.quantity < service.cost) {
      return { success: false, message: 'Insufficient funds' };
    }

    // Process payment
    npcCoins.quantity -= service.cost;
    const economy = this.economies.get(holySiteId);
    if (economy) {
      economy.offerings.coins += service.cost;
    }

    // Apply effects
    this.applyServiceEffects(npc, service);

    return { success: true, message: `${service.name} granted` };
  }

  /**
   * Apply the effects of a religious service to an NPC
   */
  private applyServiceEffects(npc: NpcEntity, service: ReligiousService): void {
    switch (service.effects.type) {
      case 'blessing':
        // Add temporary stat boost
        if (!npc.temporaryEffects) npc.temporaryEffects = [];
        npc.temporaryEffects.push({
          type: 'blessing',
          endTime: Date.now() + (service.effects.duration || 24) * 3600000,
          statModifiers: {
            luck: Math.floor(3 * service.effects.potency),
            charisma: Math.floor(2 * service.effects.potency)
          }
        });
        break;

      case 'healing':
        // Restore health
        if (npc.health) {
          const healAmount = Math.floor(20 * service.effects.potency);
          npc.health.current = Math.min(npc.health.max, npc.health.current + healAmount);
        }
        break;

      case 'conversion':
        // Change allegiance
        // This would need to be handled by the main game logic
        break;

      case 'absolution':
        // Remove negative effects or reset karma
        npc.temporaryEffects = npc.temporaryEffects?.filter(e => e.type !== 'curse');
        break;

      case 'prophecy':
        // Add quest hint or future knowledge
        // This would integrate with quest system
        break;
    }
  }

  /**
   * Update holy site economy each game day
   */
  updateDailyEconomy(holySiteId: string, gameDate: GameDate): void {
    const economy = this.economies.get(holySiteId);
    if (!economy) return;

    // Process pilgrim offerings
    const dailyPilgrims = Math.floor(economy.pilgrims.current / 7); // Weekly pilgrims / 7
    const dailyOfferings = dailyPilgrims * economy.pilgrims.averageOffering;
    economy.offerings.coins += dailyOfferings;

    // Fluctuate pilgrim numbers
    const change = (Math.random() - 0.5) * 0.2; // ±20% change
    economy.pilgrims.current = Math.floor(
      Math.max(0, Math.min(economy.pilgrims.maxCapacity, 
        economy.pilgrims.current * (1 + change)))
    );
  }

  /**
   * Get economic summary for display
   */
  getEconomySummary(holySiteId: string): string {
    const economy = this.economies.get(holySiteId);
    if (!economy) return 'No economic data available';

    return `Weekly Tithes: ${economy.tithes.weekly} coins
Current Pilgrims: ${economy.pilgrims.current}/${economy.pilgrims.maxCapacity}
Offerings: ${economy.offerings.coins} coins`;
  }

  /**
   * Get available services for a holy site
   */
  getServices(holySiteId: string): ReligiousService[] | undefined {
    return this.services.get(holySiteId);
  }
}

export const holySiteEconomyService = new HolySiteEconomyService();