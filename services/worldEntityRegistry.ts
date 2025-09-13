/**
 * World Entity Registry Service
 * Tracks all named entities in the game world for quest reality binding
 */

import { NpcEntity } from '../types/npcTypes';
import { Structure } from '../types/structureTypes';
import { Ruler } from '../types/rulerTypes';
import { Settlement } from '../types/settlementTypes';

export interface RegisteredEntity {
  id: string;
  type: 'npc' | 'ruler' | 'structure' | 'settlement' | 'landmark';
  name: string;
  location: { x: number; y: number };
  zone?: string;
  era?: string;
  attributes: Record<string, any>;
  lastSeen: number; // timestamp
  active: boolean;
}

export interface EntityQuery {
  type?: RegisteredEntity['type'] | RegisteredEntity['type'][];
  zone?: string;
  maxDistance?: number; // from player or specified point
  attributes?: Record<string, any>; // partial match
  namePattern?: string | RegExp;
  active?: boolean;
}

class WorldEntityRegistry {
  private entities: Map<string, RegisteredEntity> = new Map();
  private entitiesByType: Map<RegisteredEntity['type'], Set<string>> = new Map();
  private entitiesByZone: Map<string, Set<string>> = new Map();
  private playerLocation: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    // Initialize type maps
    ['npc', 'ruler', 'structure', 'settlement', 'landmark'].forEach(type => {
      this.entitiesByType.set(type as RegisteredEntity['type'], new Set());
    });
  }

  /**
   * Register an NPC entity
   */
  public registerNpc(npc: NpcEntity): string {
    const id = `npc_${npc.id}`;
    const entity: RegisteredEntity = {
      id,
      type: 'npc',
      name: npc.name,
      location: { x: npc.x, y: npc.y },
      zone: npc.culturalBackground?.zone,
      era: npc.culturalBackground?.era,
      attributes: {
        profession: npc.profession,
        socialClass: npc.socialClass,
        personality: npc.personality,
        health: npc.health,
        specialRole: npc.specialRole,
        culturalBackground: npc.culturalBackground
      },
      lastSeen: Date.now(),
      active: true
    };

    this.addEntity(entity);
    return id;
  }

  /**
   * Register a ruler entity
   */
  public registerRuler(ruler: Ruler): string {
    const id = `ruler_${ruler.id || Date.now()}`;
    const entity: RegisteredEntity = {
      id,
      type: 'ruler',
      name: ruler.name,
      location: ruler.location || { x: 0, y: 0 },
      zone: ruler.zone,
      era: ruler.era,
      attributes: {
        title: ruler.title,
        dynasty: ruler.dynasty,
        faction: ruler.faction,
        personality: ruler.personality,
        policies: ruler.policies
      },
      lastSeen: Date.now(),
      active: true
    };

    this.addEntity(entity);
    return id;
  }

  /**
   * Register a structure entity
   */
  public registerStructure(structure: Structure): string {
    const id = `structure_${structure.id || `${structure.x}_${structure.y}`}`;
    const entity: RegisteredEntity = {
      id,
      type: 'structure',
      name: structure.name || structure.type,
      location: { 
        x: structure.location?.[0] ?? structure.x ?? 0,
        y: structure.location?.[1] ?? structure.y ?? 0
      },
      attributes: {
        structureType: structure.type,
        subtype: structure.subtype,
        owner: structure.owner,
        culturalStyle: structure.culturalStyle,
        size: structure.size
      },
      lastSeen: Date.now(),
      active: true
    };

    this.addEntity(entity);
    return id;
  }

  /**
   * Register a settlement entity
   */
  public registerSettlement(settlement: Settlement): string {
    const id = `settlement_${settlement.id || settlement.name.replace(/\s+/g, '_')}`;
    const entity: RegisteredEntity = {
      id,
      type: 'settlement',
      name: settlement.name,
      location: settlement.location,
      zone: settlement.zone,
      era: settlement.era,
      attributes: {
        population: settlement.population,
        settlementType: settlement.type,
        culture: settlement.culture,
        importance: settlement.importance,
        resources: settlement.resources
      },
      lastSeen: Date.now(),
      active: true
    };

    this.addEntity(entity);
    return id;
  }

  /**
   * Register a landmark entity
   */
  public registerLandmark(name: string, location: { x: number; y: number }, attributes: Record<string, any> = {}): string {
    const id = `landmark_${name.replace(/\s+/g, '_')}_${Date.now()}`;
    const entity: RegisteredEntity = {
      id,
      type: 'landmark',
      name,
      location,
      attributes,
      lastSeen: Date.now(),
      active: true
    };

    this.addEntity(entity);
    return id;
  }

  /**
   * Update player location for distance calculations
   */
  public updatePlayerLocation(location: { x: number; y: number }): void {
    this.playerLocation = location;
  }

  /**
   * Query entities based on criteria
   */
  public queryEntities(query: EntityQuery): RegisteredEntity[] {
    let results = Array.from(this.entities.values());

    // Filter by type
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      results = results.filter(e => types.includes(e.type));
    }

    // Filter by zone
    if (query.zone) {
      results = results.filter(e => e.zone === query.zone);
    }

    // Filter by active status
    if (query.active !== undefined) {
      results = results.filter(e => e.active === query.active);
    }

    // Filter by name pattern
    if (query.namePattern) {
      const pattern = query.namePattern instanceof RegExp 
        ? query.namePattern 
        : new RegExp(query.namePattern, 'i');
      results = results.filter(e => pattern.test(e.name));
    }

    // Filter by attributes (partial match)
    if (query.attributes) {
      results = results.filter(e => {
        for (const [key, value] of Object.entries(query.attributes!)) {
          if (e.attributes[key] !== value) return false;
        }
        return true;
      });
    }

    // Filter by distance
    if (query.maxDistance !== undefined) {
      const center = this.playerLocation;
      results = results.filter(e => {
        const distance = Math.sqrt(
          Math.pow(e.location.x - center.x, 2) + 
          Math.pow(e.location.y - center.y, 2)
        );
        return distance <= query.maxDistance!;
      });
    }

    // Sort by distance from player
    results.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.location.x - this.playerLocation.x, 2) + 
        Math.pow(a.location.y - this.playerLocation.y, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.location.x - this.playerLocation.x, 2) + 
        Math.pow(b.location.y - this.playerLocation.y, 2)
      );
      return distA - distB;
    });

    return results;
  }

  /**
   * Get nearest entity of a specific type
   */
  public getNearestEntity(
    type: RegisteredEntity['type'], 
    maxDistance?: number
  ): RegisteredEntity | null {
    const results = this.queryEntities({ type, maxDistance, active: true });
    return results[0] || null;
  }

  /**
   * Get entity by ID
   */
  public getEntity(id: string): RegisteredEntity | null {
    return this.entities.get(id) || null;
  }

  /**
   * Update entity attributes
   */
  public updateEntity(id: string, updates: Partial<RegisteredEntity>): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Update fields
    if (updates.name !== undefined) entity.name = updates.name;
    if (updates.location !== undefined) entity.location = updates.location;
    if (updates.active !== undefined) entity.active = updates.active;
    if (updates.attributes !== undefined) {
      entity.attributes = { ...entity.attributes, ...updates.attributes };
    }

    entity.lastSeen = Date.now();
    return true;
  }

  /**
   * Mark entity as inactive (e.g., NPC died, structure destroyed)
   */
  public deactivateEntity(id: string): boolean {
    return this.updateEntity(id, { active: false });
  }

  /**
   * Remove entity completely
   */
  public removeEntity(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    this.entities.delete(id);
    this.entitiesByType.get(entity.type)?.delete(id);
    if (entity.zone) {
      this.entitiesByZone.get(entity.zone)?.delete(id);
    }

    return true;
  }

  /**
   * Get statistics about registered entities
   */
  public getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {
      total: this.entities.size,
      active: 0
    };

    for (const [type, ids] of this.entitiesByType.entries()) {
      stats[type] = ids.size;
    }

    for (const entity of this.entities.values()) {
      if (entity.active) stats.active++;
    }

    return stats;
  }

  /**
   * Clear all entities
   */
  public clear(): void {
    this.entities.clear();
    this.entitiesByType.forEach(set => set.clear());
    this.entitiesByZone.clear();
  }

  /**
   * Helper: Add entity to all relevant maps
   */
  private addEntity(entity: RegisteredEntity): void {
    this.entities.set(entity.id, entity);
    this.entitiesByType.get(entity.type)?.add(entity.id);
    
    if (entity.zone) {
      if (!this.entitiesByZone.has(entity.zone)) {
        this.entitiesByZone.set(entity.zone, new Set());
      }
      this.entitiesByZone.get(entity.zone)?.add(entity.id);
    }
  }

  /**
   * Export registry state for saving
   */
  public exportState(): RegisteredEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Import registry state from save
   */
  public importState(entities: RegisteredEntity[]): void {
    this.clear();
    entities.forEach(entity => this.addEntity(entity));
  }
}

// Export singleton instance
export const worldEntityRegistry = new WorldEntityRegistry();

// Also export class for testing
export default WorldEntityRegistry;