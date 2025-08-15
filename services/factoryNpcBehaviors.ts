/**
 * Factory NPC Behaviors
 * Defines specific behaviors, schedules, and movement patterns for factory workers
 */

import { NpcEntity, MapData, TerrainStructure, GameDate } from '../types';
import { FactoryType } from '../constants/gameData/factoryTypes';
import { factoryEconomyService } from './factoryEconomyService';

export interface WorkerSchedule {
  wakeTime: number;
  commuteStart: number;
  workStart: number;
  lunchBreak?: number;
  workEnd: number;
  returnHome: number;
  sleepTime: number;
}

export interface WorkerBehavior {
  currentActivity: 'sleeping' | 'commuting' | 'working' | 'break' | 'returning' | 'leisure' | 'strike';
  destination: { x: number; y: number } | null;
  fatigue: number; // 0-1
  morale: number; // 0-1
  productivity: number; // 0-1
}

export class FactoryNpcBehaviorService {
  
  /**
   * Get worker schedule based on factory type and era
   */
  getWorkerSchedule(
    npc: NpcEntity,
    factoryType: FactoryType,
    shift: 'morning' | 'afternoon' | 'night',
    year: number
  ): WorkerSchedule {
    // Base schedules by shift
    const schedules: Record<string, WorkerSchedule> = {
      'morning': {
        wakeTime: 4,
        commuteStart: 5,
        workStart: 6,
        lunchBreak: 12,
        workEnd: 14,
        returnHome: 15,
        sleepTime: 20
      },
      'afternoon': {
        wakeTime: 11,
        commuteStart: 13,
        workStart: 14,
        lunchBreak: 18,
        workEnd: 22,
        returnHome: 23,
        sleepTime: 1
      },
      'night': {
        wakeTime: 19,
        commuteStart: 21,
        workStart: 22,
        lunchBreak: 2,
        workEnd: 6,
        returnHome: 7,
        sleepTime: 9
      }
    };

    let schedule = { ...schedules[shift] };

    // Adjust for historical period
    if (year < 1850) {
      // Longer hours in early industrial period
      schedule.workStart = 5;
      schedule.workEnd = 19;
      delete schedule.lunchBreak; // No formal lunch break
    } else if (year < 1920) {
      // 10-12 hour days
      if (shift === 'morning') {
        schedule.workEnd = 18;
      }
    }

    // Child workers have slightly different schedules
    if (npc.age < 14) {
      schedule.wakeTime = Math.max(3, schedule.wakeTime - 1); // Wake earlier
      schedule.sleepTime = Math.min(19, schedule.sleepTime - 1); // Sleep earlier (exhausted)
    }

    return schedule;
  }

  /**
   * Update NPC behavior based on current time
   */
  updateWorkerBehavior(
    npc: NpcEntity,
    factory: TerrainStructure,
    factoryType: FactoryType,
    currentHour: number,
    currentMinute: number
  ): WorkerBehavior {
    const schedule = this.getWorkerSchedule(
      npc,
      factoryType,
      this.getWorkerShift(npc, factory),
      new Date().getFullYear() // Use current year for now
    );

    const currentTime = currentHour + currentMinute / 60;
    let behavior: WorkerBehavior = {
      currentActivity: 'sleeping',
      destination: null,
      fatigue: npc.fatigue || 0,
      morale: npc.morale || 0.5,
      productivity: 1.0
    };

    // Determine current activity based on schedule
    if (this.isStriking(npc, factory)) {
      behavior.currentActivity = 'strike';
      behavior.destination = this.getStrikeLocation(factory);
    } else if (currentTime >= schedule.wakeTime && currentTime < schedule.commuteStart) {
      behavior.currentActivity = 'leisure';
      behavior.destination = this.getHomeLocation(npc);
    } else if (currentTime >= schedule.commuteStart && currentTime < schedule.workStart) {
      behavior.currentActivity = 'commuting';
      behavior.destination = factory.location ? { x: factory.location[0], y: factory.location[1] } : null;
    } else if (currentTime >= schedule.workStart && currentTime < schedule.workEnd) {
      if (schedule.lunchBreak && Math.abs(currentTime - schedule.lunchBreak) < 0.5) {
        behavior.currentActivity = 'break';
        behavior.destination = this.getBreakLocation(factory);
      } else {
        behavior.currentActivity = 'working';
        behavior.destination = this.getWorkstation(npc, factory, factoryType);
      }
    } else if (currentTime >= schedule.workEnd && currentTime < schedule.returnHome) {
      behavior.currentActivity = 'returning';
      behavior.destination = this.getHomeLocation(npc);
    } else if (currentTime >= schedule.returnHome && currentTime < schedule.sleepTime) {
      behavior.currentActivity = 'leisure';
      behavior.destination = this.getLeisureLocation(npc, factory);
    } else {
      behavior.currentActivity = 'sleeping';
      behavior.destination = this.getHomeLocation(npc);
    }

    // Update fatigue based on activity
    behavior.fatigue = this.calculateFatigue(npc, behavior.currentActivity, factoryType);
    
    // Update morale based on conditions
    behavior.morale = this.calculateMorale(npc, factory, factoryType);
    
    // Calculate productivity
    behavior.productivity = this.calculateProductivity(behavior.fatigue, behavior.morale);

    return behavior;
  }

  /**
   * Get worker's shift assignment
   */
  private getWorkerShift(npc: NpcEntity, factory: TerrainStructure): 'morning' | 'afternoon' | 'night' {
    // This would be retrieved from the workforce assignment
    // For now, return morning as default
    return 'morning';
  }

  /**
   * Check if worker is participating in a strike
   */
  private isStriking(npc: NpcEntity, factory: TerrainStructure): boolean {
    // Check if factory has active strike
    // More intelligent/brave NPCs more likely to strike
    const strikeChance = ((npc.stats?.intelligence || 10) + (npc.stats?.wisdom || 10)) / 40;
    return Math.random() < strikeChance * 0.1; // 10% max chance
  }

  /**
   * Get strike gathering location
   */
  private getStrikeLocation(factory: TerrainStructure): { x: number; y: number } {
    // Gather outside factory gates
    return {
      x: factory.location[0] + 2,
      y: factory.location[1] + 2
    };
  }

  /**
   * Get worker's home location
   */
  private getHomeLocation(npc: NpcEntity): { x: number; y: number } {
    // Workers live in nearby slums or company housing
    // This would be more sophisticated in full implementation
    return {
      x: npc.location.x,
      y: npc.location.y
    };
  }

  /**
   * Get break area location
   */
  private getBreakLocation(factory: TerrainStructure): { x: number; y: number } {
    // Break area near factory
    return {
      x: factory.location[0] + 1,
      y: factory.location[1]
    };
  }

  /**
   * Get specific workstation within factory
   */
  private getWorkstation(
    npc: NpcEntity,
    factory: TerrainStructure,
    factoryType: FactoryType
  ): { x: number; y: number } {
    // Different stations based on job
    const offset = this.getWorkstationOffset(npc.profession || 'Worker', factoryType);
    return {
      x: factory.location[0] + offset.x,
      y: factory.location[1] + offset.y
    };
  }

  /**
   * Get workstation offset based on profession
   */
  private getWorkstationOffset(
    profession: string,
    factoryType: FactoryType
  ): { x: number; y: number } {
    const offsets: Record<string, { x: number; y: number }> = {
      'Overseer': { x: 0, y: 0 },
      'Supervisor': { x: 0, y: 1 },
      'Spinner': { x: -1, y: 0 },
      'Weaver': { x: 1, y: 0 },
      'Cane Cutter': { x: 2, y: 2 },
      'Mill Worker': { x: 0, y: -1 },
      'Assembly Worker': { x: 1, y: 1 },
      'Furnace Worker': { x: -2, y: 0 }
    };
    
    return offsets[profession] || { x: 0, y: 0 };
  }

  /**
   * Get leisure activity location
   */
  private getLeisureLocation(npc: NpcEntity, factory: TerrainStructure): { x: number; y: number } {
    // Workers might go to tavern, home, or stay near factory
    const options = [
      { x: npc.location.x, y: npc.location.y }, // Home
      { x: factory.location[0] + 5, y: factory.location[1] }, // Nearby tavern
      { x: factory.location[0], y: factory.location[1] + 5 } // Company store
    ];
    
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Calculate worker fatigue
   */
  private calculateFatigue(
    npc: NpcEntity,
    activity: WorkerBehavior['currentActivity'],
    factoryType: FactoryType
  ): number {
    let fatigue = npc.fatigue || 0;
    
    const fatigueRates = {
      'sleeping': -0.1, // Recover
      'leisure': -0.05,
      'commuting': 0.02,
      'working': factoryType.workingConditions.hoursPerDay / 100,
      'break': -0.02,
      'returning': 0.02,
      'strike': 0.01
    };
    
    fatigue += fatigueRates[activity] || 0;
    
    // Children fatigue faster
    if (npc.age < 14) {
      fatigue += 0.02;
    }
    
    // Older workers fatigue faster
    if (npc.age > 50) {
      fatigue += 0.01;
    }
    
    return Math.max(0, Math.min(1, fatigue));
  }

  /**
   * Calculate worker morale
   */
  private calculateMorale(
    npc: NpcEntity,
    factory: TerrainStructure,
    factoryType: FactoryType
  ): number {
    let morale = 0.5; // Base morale
    
    // Wage affects morale
    const wageEffect = {
      'subsistence': -0.3,
      'low': -0.1,
      'medium': 0.1,
      'high': 0.3
    };
    morale += wageEffect[factoryType.wageLevel] || 0;
    
    // Working conditions affect morale
    morale -= factoryType.workingConditions.dangerLevel * 0.2;
    morale -= (factoryType.workingConditions.hoursPerDay - 8) * 0.02;
    
    // Child workers have lower morale
    if (npc.age < 14 && factoryType.workingConditions.childLabor) {
      morale -= 0.2;
    }
    
    // Intelligence affects awareness of exploitation
    if ((npc.stats?.intelligence || 10) > 12) {
      morale -= 0.1; // Smart workers more aware of unfairness
    }
    
    return Math.max(0, Math.min(1, morale));
  }

  /**
   * Calculate productivity based on fatigue and morale
   */
  private calculateProductivity(fatigue: number, morale: number): number {
    // Base productivity
    let productivity = 1.0;
    
    // Fatigue reduces productivity
    productivity *= (1 - fatigue * 0.5);
    
    // Morale affects productivity
    productivity *= (0.5 + morale * 0.5);
    
    return Math.max(0.1, Math.min(1, productivity));
  }

  /**
   * Generate worker-specific dialogue based on conditions
   */
  generateWorkerDialogue(
    npc: NpcEntity,
    behavior: WorkerBehavior,
    factoryType: FactoryType,
    year: number
  ): string {
    const dialogues: Record<string, string[]> = {
      'high_fatigue': [
        "I can barely keep my eyes open...",
        "Don't know how much longer I can keep this up.",
        "My hands won't stop shaking from exhaustion."
      ],
      'low_morale': [
        "This ain't living, it's just surviving.",
        "They treat the machines better than us.",
        "Wonder if my children will have a better life..."
      ],
      'child_worker': [
        "Mama says I need to help the family.",
        "I miss playing with the other children.",
        "The overseer hit me when I was too slow."
      ],
      'striking': [
        "We demand fair wages and shorter hours!",
        "United we stand! The bosses can't replace us all!",
        "Eight hours for work, eight hours for rest, eight hours for what we will!"
      ],
      'dangerous_conditions': [
        "Lost another finger yesterday. Doc says I'm lucky.",
        "Jimmy got caught in the machinery last week. Didn't make it.",
        "The fumes make me dizzy, but complaining means no work."
      ]
    };
    
    // Select appropriate dialogue category
    if (behavior.currentActivity === 'strike') {
      return dialogues['striking'][Math.floor(Math.random() * dialogues['striking'].length)];
    }
    
    if (behavior.fatigue > 0.8) {
      return dialogues['high_fatigue'][Math.floor(Math.random() * dialogues['high_fatigue'].length)];
    }
    
    if (behavior.morale < 0.3) {
      return dialogues['low_morale'][Math.floor(Math.random() * dialogues['low_morale'].length)];
    }
    
    if (npc.age < 14) {
      return dialogues['child_worker'][Math.floor(Math.random() * dialogues['child_worker'].length)];
    }
    
    if (factoryType.workingConditions.dangerLevel > 0.3) {
      return dialogues['dangerous_conditions'][Math.floor(Math.random() * dialogues['dangerous_conditions'].length)];
    }
    
    // Default working dialogue
    return "Another day, another dollar... or pennies, more like.";
  }

  /**
   * Handle special events for factory workers
   */
  handleWorkerEvent(
    npc: NpcEntity,
    factory: TerrainStructure,
    factoryType: FactoryType,
    event: 'injury' | 'promotion' | 'layoff' | 'strike_join' | 'strike_break'
  ): void {
    switch (event) {
      case 'injury':
        npc.health = Math.max(0, (npc.health || 100) - 30);
        npc.fatigue = 1.0;
        npc.currentActivity = 'Recovering from injury';
        break;
        
      case 'promotion':
        npc.profession = this.getPromotedProfession(npc.profession || 'Worker');
        npc.morale = Math.min(1, (npc.morale || 0.5) + 0.3);
        break;
        
      case 'layoff':
        npc.workplace = undefined;
        npc.profession = 'Unemployed';
        npc.morale = Math.max(0, (npc.morale || 0.5) - 0.4);
        break;
        
      case 'strike_join':
        npc.currentActivity = 'On strike';
        npc.morale = Math.min(1, (npc.morale || 0.5) + 0.1);
        break;
        
      case 'strike_break':
        // Scab worker
        npc.morale = Math.max(0, (npc.morale || 0.5) - 0.2);
        npc.reputation = Math.max(0, (npc.reputation || 50) - 20);
        break;
    }
  }

  /**
   * Get promoted profession
   */
  private getPromotedProfession(currentProfession: string): string {
    const promotions: Record<string, string> = {
      'Field Hand': 'Field Supervisor',
      'Mill Worker': 'Mill Operator',
      'Spinner': 'Spinning Room Supervisor',
      'Assembly Worker': 'Line Supervisor',
      'Furnace Worker': 'Furnace Boss',
      'Warehouse Clerk': 'Warehouse Manager'
    };
    
    return promotions[currentProfession] || 'Supervisor';
  }
}

// Export singleton instance
export const factoryNpcBehaviorService = new FactoryNpcBehaviorService();