/**
 * services/npcBehaviorService.ts
 * Comprehensive NPC behavior system for economic activities, travel, and social interactions
 */

import { NpcEntity, TerrainStructure, MapData, Tile, BiomeType } from '../types';
import { TILE_SIZE_PX } from '../constants/gameConstants';

export interface NpcWorkSchedule {
  workplace?: string; // structure ID
  workStart: number; // hour (0-23)
  workEnd: number;
  isWorking: boolean;
  currentActivity?: 'traveling' | 'working' | 'resting' | 'trading';
}

export interface NpcRelationship {
  playerId: string;
  attitude: number; // -100 to 100
  lastInteraction?: Date;
  interactionCount: number;
  memories: Array<{
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    impact: number;
    date: Date;
  }>;
}

export interface NpcTravel {
  destination?: [number, number];
  path?: [number, number][];
  isLeavingMap?: boolean;
  enteredFrom?: 'north' | 'south' | 'east' | 'west';
  tradeRoute?: string;
  speed: number; // tiles per update
}

export interface TamedAnimal {
  type: 'camel' | 'horse' | 'ox' | 'donkey' | 'dog' | 'sheep' | 'goat' | 'chicken';
  name?: string;
  value: number;
  carryingCapacity?: number;
}

export interface NpcShip {
  npcId: string;
  position: [number, number];
  destination?: [number, number];
  cargo: any[];
  shipType: 'merchant' | 'fishing' | 'warship' | 'transport';
  size: 'small' | 'medium' | 'large';
}

export class NpcBehaviorService {
  private workSchedules: Map<string, NpcWorkSchedule> = new Map();
  private relationships: Map<string, NpcRelationship> = new Map();
  private travelData: Map<string, NpcTravel> = new Map();
  private tamedAnimals: Map<string, TamedAnimal[]> = new Map();
  private npcShips: Map<string, NpcShip> = new Map();
  
  // Thresholds for NPC actions
  private readonly CONFRONTATION_THRESHOLD = -50;
  private readonly ATTACK_THRESHOLD = -80;
  private readonly FRIENDLY_THRESHOLD = 30;
  
  /**
   * Initialize NPC with work schedule based on profession
   */
  initializeNpcBehavior(npc: NpcEntity, structures: TerrainStructure[]): void {
    // Assign workplace based on profession
    const workplace = this.findSuitableWorkplace(npc, structures);
    
    const schedule: NpcWorkSchedule = {
      workplace: workplace?.id,
      workStart: this.getWorkStartTime(npc.profession),
      workEnd: this.getWorkEndTime(npc.profession),
      isWorking: false,
      currentActivity: 'resting'
    };
    
    this.workSchedules.set(npc.id, schedule);
    
    // Initialize relationship tracking
    this.relationships.set(npc.id, {
      playerId: 'player',
      attitude: this.getInitialAttitude(npc),
      interactionCount: 0,
      memories: []
    });
    
    // Initialize travel data
    this.travelData.set(npc.id, {
      speed: this.getTravelSpeed(npc),
      path: []
    });
    
    // Assign tamed animals based on profession and culture
    const animals = this.assignTamedAnimals(npc);
    if (animals.length > 0) {
      this.tamedAnimals.set(npc.id, animals);
    }
  }
  
  /**
   * Update NPC behavior each game tick
   */
  updateNpcBehavior(
    npc: NpcEntity, 
    currentHour: number,
    mapData: MapData,
    playerPosition: [number, number]
  ): {
    shouldEnterBuilding?: string;
    shouldExitMap?: 'north' | 'south' | 'east' | 'west';
    shouldInitiateEncounter?: boolean;
    newPosition?: [number, number];
    currentActivity?: string;
  } {
    const result: any = {};
    const schedule = this.workSchedules.get(npc.id);
    const travel = this.travelData.get(npc.id);
    const relationship = this.relationships.get(npc.id);
    
    if (!schedule || !travel) return result;
    
    // Check if NPC should confront player
    if (relationship && this.isPlayerNearby(npc.position, playerPosition)) {
      if (relationship.attitude <= this.CONFRONTATION_THRESHOLD) {
        result.shouldInitiateEncounter = true;
        return result;
      }
    }
    
    // Handle work schedule
    const shouldWork = currentHour >= schedule.workStart && currentHour < schedule.workEnd;
    
    if (shouldWork && !schedule.isWorking && schedule.workplace) {
      // Time to go to work
      schedule.isWorking = true;
      schedule.currentActivity = 'working';
      result.shouldEnterBuilding = schedule.workplace;
      return result;
    } else if (!shouldWork && schedule.isWorking) {
      // Time to leave work
      schedule.isWorking = false;
      schedule.currentActivity = 'resting';
    }
    
    // Handle travel and trade routes
    if (this.shouldTravel(npc) && !schedule.isWorking) {
      const travelResult = this.updateTravel(npc, mapData);
      if (travelResult.shouldExitMap) {
        result.shouldExitMap = travelResult.shouldExitMap;
      } else if (travelResult.newPosition) {
        result.newPosition = travelResult.newPosition;
      }
      schedule.currentActivity = 'traveling';
    }
    
    // Handle hunting behavior
    if (npc.profession === 'Hunter' && !schedule.isWorking) {
      const huntResult = this.handleHunting(npc, mapData);
      if (huntResult.newPosition) {
        result.newPosition = huntResult.newPosition;
      }
      schedule.currentActivity = 'working';
    }
    
    result.currentActivity = schedule.currentActivity;
    return result;
  }
  
  /**
   * Update NPC attitude based on interaction
   */
  updateRelationship(
    npcId: string, 
    interactionType: 'positive' | 'negative' | 'neutral',
    description: string,
    impact: number
  ): void {
    const relationship = this.relationships.get(npcId);
    if (!relationship) return;
    
    relationship.attitude = Math.max(-100, Math.min(100, relationship.attitude + impact));
    relationship.lastInteraction = new Date();
    relationship.interactionCount++;
    
    relationship.memories.push({
      type: interactionType,
      description,
      impact,
      date: new Date()
    });
    
    // Keep only last 10 memories
    if (relationship.memories.length > 10) {
      relationship.memories.shift();
    }
  }
  
  /**
   * Create NPC ship for maritime trade
   */
  createNpcShip(npc: NpcEntity, mapData: MapData): NpcShip | null {
    // Only create ships for certain professions and near water
    if (!['Merchant', 'Fisher', 'Trader', 'Captain'].includes(npc.profession)) {
      return null;
    }
    
    const nearbyWater = this.findNearbyWater(npc.position, mapData);
    if (!nearbyWater) return null;
    
    const ship: NpcShip = {
      npcId: npc.id,
      position: nearbyWater,
      shipType: this.getShipType(npc.profession),
      size: this.getShipSize(npc.wealth),
      cargo: []
    };
    
    this.npcShips.set(npc.id, ship);
    return ship;
  }
  
  /**
   * Get tamed animals for trading
   */
  getTradableAnimals(npcId: string): TamedAnimal[] {
    return this.tamedAnimals.get(npcId) || [];
  }
  
  /**
   * Handle animal purchase
   */
  purchaseAnimal(npcId: string, animalIndex: number): TamedAnimal | null {
    const animals = this.tamedAnimals.get(npcId);
    if (!animals || animalIndex >= animals.length) return null;
    
    const [animal] = animals.splice(animalIndex, 1);
    if (animals.length === 0) {
      this.tamedAnimals.delete(npcId);
    }
    
    return animal;
  }
  
  // Helper methods
  
  private findSuitableWorkplace(npc: NpcEntity, structures: TerrainStructure[]): TerrainStructure | null {
    const professionToStructure: Record<string, string[]> = {
      'Merchant': ['marketplace', 'trading_post'],
      'Farmer': ['farm'],
      'Miller': ['mill'],
      'Miner': ['mining_colony'],
      'Priest': ['holy_site'],
      'Soldier': ['fortress'],
      'Fisherman': ['fishing_hut'],
      'Craftsman': ['factory'],
      'Administrator': ['government_district', 'palace'],
      'Lumberjack': ['lumber_camp']
    };
    
    const suitableTypes = professionToStructure[npc.profession] || [];
    return structures.find(s => suitableTypes.includes(s.structureType)) || null;
  }
  
  private getWorkStartTime(profession: string): number {
    const workTimes: Record<string, number> = {
      'Farmer': 5,
      'Merchant': 8,
      'Miller': 6,
      'Miner': 6,
      'Priest': 7,
      'Soldier': 6,
      'Fisherman': 4,
      'Craftsman': 7,
      'Administrator': 9,
      'Lumberjack': 6
    };
    return workTimes[profession] || 8;
  }
  
  private getWorkEndTime(profession: string): number {
    const workTimes: Record<string, number> = {
      'Farmer': 18,
      'Merchant': 18,
      'Miller': 17,
      'Miner': 16,
      'Priest': 20,
      'Soldier': 18,
      'Fisherman': 14,
      'Craftsman': 18,
      'Administrator': 17,
      'Lumberjack': 16
    };
    return workTimes[profession] || 17;
  }
  
  private getInitialAttitude(npc: NpcEntity): number {
    // Base attitude on personality traits (numeric values)
    let attitude = 0;
    
    // High extraversion and agreeableness = friendly
    if (npc.personality.extraversion > 0.7 && npc.personality.agreeableness > 0.6) attitude += 20;
    // Low agreeableness and high neuroticism = hostile
    if (npc.personality.agreeableness < 0.3 && npc.personality.neuroticism > 0.6) attitude -= 20;
    // Low openness = suspicious
    if (npc.personality.openness < 0.3) attitude -= 10;
    // High agreeableness = generous
    if (npc.personality.agreeableness > 0.7) attitude += 15;
    // Low agreeableness = greedy
    if (npc.personality.agreeableness < 0.3) attitude -= 5;
    
    return attitude;
  }
  
  private getTravelSpeed(npc: NpcEntity): number {
    // Speed based on wealth and profession
    if (npc.wealth === 'rich') return 2;
    if (npc.profession === 'Merchant' || npc.profession === 'Trader') return 1.5;
    return 1;
  }
  
  private assignTamedAnimals(npc: NpcEntity): TamedAnimal[] {
    const animals: TamedAnimal[] = [];
    
    // Assign based on profession and culture
    if (npc.profession === 'Merchant' || npc.profession === 'Trader') {
      if (npc.culture === 'MENA' || npc.culture === 'CENTRAL_ASIAN') {
        // Camel caravan
        const camelCount = npc.wealth === 'rich' ? 3 : 1;
        for (let i = 0; i < camelCount; i++) {
          animals.push({
            type: 'camel',
            value: 100,
            carryingCapacity: 200
          });
        }
      } else {
        // Horse or ox cart
        animals.push({
          type: npc.wealth === 'rich' ? 'horse' : 'donkey',
          value: npc.wealth === 'rich' ? 80 : 30,
          carryingCapacity: 100
        });
      }
    }
    
    if (npc.profession === 'Farmer') {
      animals.push({ type: 'ox', value: 60, carryingCapacity: 150 });
      if (Math.random() < 0.3) {
        animals.push({ type: 'chicken', value: 5 });
      }
    }
    
    if (npc.profession === 'Herder' || npc.profession === 'Shepherd') {
      const sheepCount = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < sheepCount; i++) {
        animals.push({ type: 'sheep', value: 20 });
      }
    }
    
    return animals;
  }
  
  private shouldTravel(npc: NpcEntity): boolean {
    // Certain professions travel more
    const travelingProfessions = ['Merchant', 'Trader', 'Messenger', 'Pilgrim', 'Nomad'];
    return travelingProfessions.includes(npc.profession) && Math.random() < 0.1;
  }
  
  private updateTravel(npc: NpcEntity, mapData: MapData): {
    shouldExitMap?: 'north' | 'south' | 'east' | 'west';
    newPosition?: [number, number];
  } {
    const travel = this.travelData.get(npc.id);
    if (!travel) return {};
    
    // Check if NPC should leave the map
    const [x, y] = npc.position;
    const mapWidth = mapData.tiles[0].length;
    const mapHeight = mapData.tiles.length;
    
    if (x <= 1) return { shouldExitMap: 'west' };
    if (x >= mapWidth - 2) return { shouldExitMap: 'east' };
    if (y <= 1) return { shouldExitMap: 'north' };
    if (y >= mapHeight - 2) return { shouldExitMap: 'south' };
    
    // Otherwise move towards destination
    if (!travel.destination) {
      // Pick a random destination
      travel.destination = [
        Math.floor(Math.random() * mapWidth),
        Math.floor(Math.random() * mapHeight)
      ];
    }
    
    const [dx, dy] = travel.destination;
    const moveX = Math.sign(dx - x) * travel.speed;
    const moveY = Math.sign(dy - y) * travel.speed;
    
    return {
      newPosition: [
        Math.round(x + moveX),
        Math.round(y + moveY)
      ]
    };
  }
  
  private handleHunting(npc: NpcEntity, mapData: MapData): {
    newPosition?: [number, number];
    killedAnimal?: boolean;
  } {
    // Move towards areas with animals
    // This is simplified - in reality you'd check for actual animal entities
    const [x, y] = npc.position;
    const randomMove = [
      x + Math.floor(Math.random() * 3) - 1,
      y + Math.floor(Math.random() * 3) - 1
    ] as [number, number];
    
    return { newPosition: randomMove };
  }
  
  private isPlayerNearby(npcPos: [number, number], playerPos: [number, number]): boolean {
    const distance = Math.sqrt(
      Math.pow(npcPos[0] - playerPos[0], 2) + 
      Math.pow(npcPos[1] - playerPos[1], 2)
    );
    return distance < 3; // Within 3 tiles
  }
  
  private findNearbyWater(position: [number, number], mapData: MapData): [number, number] | null {
    const [x, y] = position;
    const searchRadius = 5;
    
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (checkX >= 0 && checkX < mapData.tiles[0].length &&
            checkY >= 0 && checkY < mapData.tiles.length) {
          const tile = mapData.tiles[checkY][checkX];
          if (!tile.isLand) {
            return [checkX, checkY];
          }
        }
      }
    }
    
    return null;
  }
  
  private getShipType(profession: string): 'merchant' | 'fishing' | 'warship' | 'transport' {
    switch (profession) {
      case 'Fisher': return 'fishing';
      case 'Captain': return 'warship';
      case 'Merchant':
      case 'Trader': return 'merchant';
      default: return 'transport';
    }
  }
  
  private getShipSize(wealth: string): 'small' | 'medium' | 'large' {
    switch (wealth) {
      case 'rich': return 'large';
      case 'moderate': return 'medium';
      default: return 'small';
    }
  }
}

// Export singleton instance
export const npcBehaviorService = new NpcBehaviorService();