/**
 * Factory Economy Service
 * Manages the economic simulation of factories, supply chains, and workforce
 */

import { TerrainStructure, MapData, NpcEntity, HistoricalEra, Item } from '../types';
import { FACTORY_TYPES, FactoryType } from '../constants/gameData/factoryTypes';
import { parseDateString } from '../utils/dateUtils';

export interface FactoryWorkforce {
  factoryId: string;
  workers: string[]; // NPC IDs
  shifts: {
    morning: string[];
    afternoon: string[];
    night?: string[]; // Only for 24-hour operations
  };
  conditions: {
    averageWage: number;
    injuryRate: number;
    turnoverRate: number;
    unionized: boolean;
  };
}

export interface SupplyChain {
  factoryId: string;
  suppliers: {
    structureId: string;
    goods: string[];
    distance: number;
    reliability: number; // 0-1
  }[];
  customers: {
    structureId: string;
    goods: string[];
    demandLevel: number; // 0-1
  }[];
  transportMethod: 'cart' | 'ship' | 'railroad' | 'truck';
}

export interface FactoryProduction {
  factoryId: string;
  currentOutput: number;
  efficiency: number; // 0-1, affected by workforce morale, supply availability
  inventory: Record<string, number>;
  lastProduction: number; // timestamp
}

export class FactoryEconomyService {
  private workforces: Map<string, FactoryWorkforce> = new Map();
  private supplyChains: Map<string, SupplyChain> = new Map();
  private production: Map<string, FactoryProduction> = new Map();

  /**
   * Initialize factory economy for a structure
   */
  initializeFactory(
    structure: TerrainStructure,
    mapData: MapData,
    npcs: NpcEntity[]
  ): void {
    const factoryType = this.getFactoryType(structure);
    if (!factoryType) return;

    // Assign workers from nearby NPCs
    const workforce = this.assignWorkforce(structure, factoryType, npcs, mapData);
    this.workforces.set(structure.id, workforce);

    // Establish supply chains
    const supplyChain = this.establishSupplyChain(structure, factoryType, mapData);
    this.supplyChains.set(structure.id, supplyChain);

    // Initialize production
    this.production.set(structure.id, {
      factoryId: structure.id,
      currentOutput: 0,
      efficiency: 0.5, // Starts at half efficiency
      inventory: {},
      lastProduction: Date.now()
    });
  }

  /**
   * Assign NPCs to work at the factory
   */
  private assignWorkforce(
    structure: TerrainStructure,
    factoryType: FactoryType,
    npcs: NpcEntity[],
    mapData: MapData
  ): FactoryWorkforce {
    const nearbyNpcs = npcs.filter(npc => {
      const distance = Math.hypot(
        npc.location.x - structure.location[0],
        npc.location.y - structure.location[1]
      );
      return distance < 20; // Within 20 tiles
    });

    // Sort by suitability (age, skills, desperation)
    const suitableWorkers = nearbyNpcs
      .filter(npc => this.isEligibleWorker(npc, factoryType, mapData))
      .sort((a, b) => this.getWorkerSuitability(b, factoryType) - this.getWorkerSuitability(a, factoryType))
      .slice(0, factoryType.workersNeeded);

    // Assign to shifts based on factory type and era
    const shifts = this.assignShifts(suitableWorkers, factoryType, mapData);

    // Calculate working conditions based on era and type
    const conditions = this.calculateConditions(factoryType, mapData);

    // Update NPC professions and schedules
    suitableWorkers.forEach(npc => {
      npc.profession = this.getFactoryProfession(factoryType, npc);
      npc.workplace = structure.id;
      npc.socialClass = this.updateSocialClass(factoryType.wageLevel);
    });

    return {
      factoryId: structure.id,
      workers: suitableWorkers.map(w => w.id),
      shifts,
      conditions
    };
  }

  /**
   * Check if NPC is eligible to work at factory
   */
  private isEligibleWorker(
    npc: NpcEntity,
    factoryType: FactoryType,
    mapData: MapData
  ): boolean {
    const dateInfo = parseDateString(mapData.timeSlice || '1850');
    const year = dateInfo.year;

    // Age restrictions vary by era
    let minAge = 14; // Default for industrial era
    if (year < 1850 && factoryType.workingConditions.childLabor) {
      minAge = 8; // Child labor in early industrial period
    } else if (year > 1920) {
      minAge = 16; // Progressive era reforms
    } else if (year > 1970) {
      minAge = 18; // Modern labor laws
    }

    if (npc.age < minAge) return false;

    // Gender restrictions for certain factories/eras
    if (factoryType.id === 'textile_mill' && year < 1920) {
      // Textile mills preferred women and children
      if (npc.gender === 'male' && npc.age > 16) {
        return Math.random() < 0.3; // Only 30% chance for adult men
      }
    }

    // Skill requirements
    if (factoryType.workingConditions.skillRequired === 'skilled' || 
        factoryType.workingConditions.skillRequired === 'master') {
      // Check if NPC has relevant skills (simplified)
      const hasSkills = (npc.stats?.intelligence || 10) > 12 || 
                       (npc.stats?.dexterity || 10) > 12;
      if (!hasSkills) return false;
    }

    return true;
  }

  /**
   * Calculate worker suitability score
   */
  private getWorkerSuitability(npc: NpcEntity, factoryType: FactoryType): number {
    let score = 0;

    // Desperation (poor NPCs more likely to take factory jobs)
    const wealth = npc.inventory?.coins || 0;
    score += wealth < 10 ? 10 : wealth < 50 ? 5 : 0;

    // Physical fitness for demanding work
    score += (npc.stats?.constitution || 10) / 2;
    score += (npc.stats?.dexterity || 10) / 3;

    // Youth preferred for certain jobs
    if (factoryType.workingConditions.childLabor && npc.age < 16) {
      score += 5;
    }

    // Women preferred for textile work
    if (factoryType.id.includes('textile') && npc.gender === 'female') {
      score += 5;
    }

    return score;
  }

  /**
   * Assign workers to shifts
   */
  private assignShifts(
    workers: NpcEntity[],
    factoryType: FactoryType,
    mapData: MapData
  ): FactoryWorkforce['shifts'] {
    const dateInfo = parseDateString(mapData.timeSlice || '1850');
    const workerIds = workers.map(w => w.id);
    
    // Pre-1850: Single long shift
    if (dateInfo.year < 1850) {
      return {
        morning: workerIds,
        afternoon: []
      };
    }
    
    // 1850-1920: Two shifts
    if (dateInfo.year < 1920) {
      const midpoint = Math.floor(workerIds.length / 2);
      return {
        morning: workerIds.slice(0, midpoint),
        afternoon: workerIds.slice(midpoint)
      };
    }
    
    // Modern era: Three shifts for continuous operations
    const third = Math.floor(workerIds.length / 3);
    return {
      morning: workerIds.slice(0, third),
      afternoon: workerIds.slice(third, third * 2),
      night: workerIds.slice(third * 2)
    };
  }

  /**
   * Calculate working conditions based on era and type
   */
  private calculateConditions(
    factoryType: FactoryType,
    mapData: MapData
  ): FactoryWorkforce['conditions'] {
    const dateInfo = parseDateString(mapData.timeSlice || '1850');
    const year = dateInfo.year;
    
    // Base wage from factory type
    const wageMultipliers = {
      'subsistence': 0.1,
      'low': 0.3,
      'medium': 0.6,
      'high': 1.0
    };
    
    let averageWage = wageMultipliers[factoryType.wageLevel] * 10;
    
    // Adjust for era
    if (year > 1880) averageWage *= 1.2; // Progressive era
    if (year > 1920) averageWage *= 1.5; // Post-WWI
    if (year > 1945) averageWage *= 2.0; // Post-WWII boom
    
    // Injury rate decreases over time (safety improvements)
    let injuryRate = factoryType.workingConditions.dangerLevel;
    if (year > 1900) injuryRate *= 0.8;
    if (year > 1930) injuryRate *= 0.6;
    if (year > 1970) injuryRate *= 0.3;
    
    // Unionization more likely in later eras
    const unionized = year > 1880 && Math.random() < (year - 1880) / 140;
    
    // Turnover based on conditions
    const turnoverRate = (1 - averageWage / 10) * 0.3 + injuryRate * 0.5;
    
    return {
      averageWage,
      injuryRate,
      turnoverRate,
      unionized
    };
  }

  /**
   * Get profession name for factory worker
   */
  private getFactoryProfession(factoryType: FactoryType, npc: NpcEntity): string {
    const professions: Record<string, string[]> = {
      'sugar_plantation': ['Field Hand', 'Cane Cutter', 'Mill Worker', 'Overseer'],
      'cotton_plantation': ['Cotton Picker', 'Field Worker', 'Gin Operator'],
      'textile_mill': ['Spinner', 'Weaver', 'Doffer', 'Loom Operator', 'Mill Girl'],
      'steel_mill': ['Furnace Worker', 'Puddler', 'Roller', 'Foundry Worker'],
      'automobile_factory': ['Assembly Worker', 'Machinist', 'Inspector', 'Line Worker'],
      'spice_warehouse': ['Sorter', 'Packer', 'Porter', 'Warehouse Clerk'],
      'silk_workshop': ['Silk Reeler', 'Weaver', 'Dyer', 'Pattern Maker']
    };
    
    const options = professions[factoryType.id] || ['Factory Worker'];
    
    // Higher status jobs for skilled/older workers
    if (npc.age > 30 && (npc.stats?.intelligence || 10) > 12) {
      return options[options.length - 1]; // Usually supervisory role
    }
    
    return options[Math.floor(Math.random() * (options.length - 1))];
  }

  /**
   * Update social class based on wage level
   */
  private updateSocialClass(wageLevel: string): string {
    const classMap = {
      'subsistence': 'laborer',
      'low': 'working_poor',
      'medium': 'working_class',
      'high': 'skilled_worker'
    };
    return classMap[wageLevel] || 'worker';
  }

  /**
   * Establish supply chain connections
   */
  private establishSupplyChain(
    structure: TerrainStructure,
    factoryType: FactoryType,
    mapData: MapData
  ): SupplyChain {
    const suppliers: SupplyChain['suppliers'] = [];
    const customers: SupplyChain['customers'] = [];
    
    // Find potential suppliers
    mapData.terrainStructures?.forEach(otherStructure => {
      if (otherStructure.id === structure.id) return;
      
      // Check if this structure produces inputs we need
      const overlap = otherStructure.outputGoods?.filter(good => 
        factoryType.inputGoods.includes(good)
      );
      
      if (overlap && overlap.length > 0) {
        const distance = Math.hypot(
          structure.location[0] - otherStructure.location[0],
          structure.location[1] - otherStructure.location[1]
        );
        
        suppliers.push({
          structureId: otherStructure.id,
          goods: overlap,
          distance,
          reliability: Math.max(0.3, 1 - distance / 100)
        });
      }
    });
    
    // Determine transport method based on era and infrastructure
    const dateInfo = parseDateString(mapData.timeSlice || '1850');
    let transportMethod: SupplyChain['transportMethod'] = 'cart';
    
    if (dateInfo.year > 1830 && factoryType.requiresNearby?.includes('railroad')) {
      transportMethod = 'railroad';
    } else if (factoryType.requiresNearby?.includes('port')) {
      transportMethod = 'ship';
    } else if (dateInfo.year > 1920) {
      transportMethod = 'truck';
    }
    
    return {
      factoryId: structure.id,
      suppliers,
      customers,
      transportMethod
    };
  }

  /**
   * Simulate daily production
   */
  simulateProduction(
    structure: TerrainStructure,
    currentHour: number,
    mapData: MapData
  ): void {
    const workforce = this.workforces.get(structure.id);
    const production = this.production.get(structure.id);
    const factoryType = this.getFactoryType(structure);
    
    if (!workforce || !production || !factoryType) return;
    
    // Check which shift is active
    const activeShift = this.getActiveShift(currentHour, workforce.shifts);
    if (!activeShift || activeShift.length === 0) return;
    
    // Calculate efficiency based on various factors
    const efficiency = this.calculateEfficiency(workforce, production, factoryType);
    
    // Produce goods
    const outputRate = factoryType.productionRate * efficiency * (activeShift.length / factoryType.workersNeeded);
    
    factoryType.outputGoods.forEach(good => {
      if (!production.inventory[good]) production.inventory[good] = 0;
      production.inventory[good] += outputRate / 24; // Hourly production
    });
    
    // Update production record
    production.currentOutput = outputRate;
    production.efficiency = efficiency;
    production.lastProduction = Date.now();
  }

  /**
   * Get currently active shift
   */
  private getActiveShift(hour: number, shifts: FactoryWorkforce['shifts']): string[] {
    if (hour >= 6 && hour < 14) return shifts.morning;
    if (hour >= 14 && hour < 22) return shifts.afternoon;
    return shifts.night || [];
  }

  /**
   * Calculate production efficiency
   */
  private calculateEfficiency(
    workforce: FactoryWorkforce,
    production: FactoryProduction,
    factoryType: FactoryType
  ): number {
    let efficiency = 1.0;
    
    // Workforce morale (affected by conditions)
    const morale = 1 - (workforce.conditions.injuryRate * 0.3 + workforce.conditions.turnoverRate * 0.2);
    efficiency *= morale;
    
    // Unionization can increase or decrease efficiency
    if (workforce.conditions.unionized) {
      efficiency *= workforce.conditions.averageWage > 5 ? 1.1 : 0.9;
    }
    
    // Supply availability (simplified)
    const supplyChain = this.supplyChains.get(production.factoryId);
    if (supplyChain) {
      const avgReliability = supplyChain.suppliers.reduce((sum, s) => sum + s.reliability, 0) / 
                             (supplyChain.suppliers.length || 1);
      efficiency *= avgReliability;
    }
    
    return Math.max(0.1, Math.min(1.0, efficiency));
  }

  /**
   * Get factory type from structure
   */
  private getFactoryType(structure: TerrainStructure): FactoryType | null {
    const factorySubtype = structure.factorySubtype;
    if (!factorySubtype) return null;
    return FACTORY_TYPES[factorySubtype] || null;
  }

  /**
   * Generate factory-specific events
   */
  generateFactoryEvent(structure: TerrainStructure, mapData: MapData): string | null {
    const workforce = this.workforces.get(structure.id);
    const factoryType = this.getFactoryType(structure);
    
    if (!workforce || !factoryType) return null;
    
    const dateInfo = parseDateString(mapData.timeSlice || '1850');
    const events: string[] = [];
    
    // Strike events
    if (workforce.conditions.unionized && Math.random() < 0.1) {
      events.push(`Workers at ${structure.name} are on strike demanding better wages!`);
    }
    
    // Accident events
    if (Math.random() < workforce.conditions.injuryRate / 10) {
      events.push(`Industrial accident at ${structure.name}! Several workers injured.`);
    }
    
    // Child labor reform (after 1870)
    if (dateInfo.year > 1870 && factoryType.workingConditions.childLabor && Math.random() < 0.05) {
      events.push(`Reformers protest child labor at ${structure.name}.`);
    }
    
    // Production milestone
    const production = this.production.get(structure.id);
    if (production && production.efficiency > 0.8 && Math.random() < 0.1) {
      events.push(`${structure.name} sets production record!`);
    }
    
    return events.length > 0 ? events[Math.floor(Math.random() * events.length)] : null;
  }

  /**
   * Get factory dialogue for NPCs
   */
  getFactoryDialogue(npc: NpcEntity, factoryType: FactoryType, era: HistoricalEra): string[] {
    const dialogues: Record<string, Record<string, string[]>> = {
      'textile_mill': {
        'INDUSTRIAL_ERA': [
          "The looms never stop... twelve hours a day, six days a week.",
          "Lost two fingers to the spinning jenny last month. Still luckier than most.",
          "They dock our pay if we're even a minute late.",
          "The cotton dust makes it hard to breathe. Many get the mill fever.",
          "My little sister works here too. She's only ten.",
        ],
        'MODERN_ERA': [
          "Union got us down to eight hour shifts.",
          "Safety inspector's coming next week. Boss wants everything spotless.",
          "Pay's better than it used to be, but the work's still hard.",
        ]
      },
      'sugar_plantation': {
        'RENAISSANCE_EARLY_MODERN': [
          "The cane cutting season is brutal. Sun up to sun down.",
          "Master says we're lucky to have work and shelter.",
          "The boiling house is dangerous. Many get burned.",
          "We're not allowed to leave the plantation without papers.",
        ],
        'INDUSTRIAL_ERA': [
          "They say we're free now, but we still owe the company store.",
          "Contract says five years, but somehow the debt never goes down.",
        ]
      },
      'steel_mill': {
        'INDUSTRIAL_ERA': [
          "The furnaces run day and night. Heat's unbearable in summer.",
          "Lost three men last month when the crucible burst.",
          "Carnegie's making millions while we can barely feed our families.",
          "Talk of organizing a union, but the Pinkertons are watching.",
        ],
        'MODERN_ERA': [
          "Steel built this country. We built the steel.",
          "Safety equipment's better now, but it's still dangerous work.",
          "Foreign competition's killing us. Mill might close next year.",
        ]
      }
    };
    
    const typeDialogues = dialogues[factoryType.id]?.[era] || [
      "It's honest work, I suppose.",
      "The factory whistle rules our lives.",
      "They say machines are the future.",
    ];
    
    return typeDialogues;
  }
}

// Export singleton instance
export const factoryEconomyService = new FactoryEconomyService();