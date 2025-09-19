/**
 * entityHealthService.ts - Tracks damaged NPCs and animals within the current map
 */
import { NpcEntity, AnimalEntity } from '../types';

interface DamagedEntity {
  id: string;
  currentHealth: number;
  maxHealth: number;
  lastDamageTime: number;
}

class EntityHealthService {
  private static STORAGE_KEY = 'currentMapDamagedEntities';
  private static instance: EntityHealthService;
  private currentMapSeed: string | null = null;

  private constructor() {}

  public static getInstance(): EntityHealthService {
    if (!EntityHealthService.instance) {
      EntityHealthService.instance = new EntityHealthService();
    }
    return EntityHealthService.instance;
  }

  /**
   * Set the current map seed to track entities for this specific map
   */
  public setCurrentMap(mapSeed: string): void {
    this.currentMapSeed = mapSeed;
  }

  /**
   * Clear all health data when leaving a map
   */
  public clearMapData(): void {
    if (!this.currentMapSeed) return;

    try {
      localStorage.removeItem(`${EntityHealthService.STORAGE_KEY}_${this.currentMapSeed}`);
      console.log(`[EntityHealth] Cleared health data for map ${this.currentMapSeed}`);
    } catch (error) {
      console.error('[EntityHealth] Failed to clear map data:', error);
    }
  }

  /**
   * Record that an entity has taken damage
   */
  public recordDamage(entityId: string, currentHealth: number, maxHealth: number): void {
    if (!this.currentMapSeed) return;

    const damagedEntities = this.getDamagedEntities();

    // Update or add the entity
    const existingIndex = damagedEntities.findIndex(e => e.id === entityId);
    const entityData: DamagedEntity = {
      id: entityId,
      currentHealth,
      maxHealth,
      lastDamageTime: Date.now()
    };

    if (existingIndex >= 0) {
      damagedEntities[existingIndex] = entityData;
    } else {
      damagedEntities.push(entityData);
    }

    // Clean up fully healed entities
    const filteredEntities = damagedEntities.filter(e => e.currentHealth < e.maxHealth);

    this.saveDamagedEntities(filteredEntities);

    console.log(`[EntityHealth] Recorded damage for ${entityId}: ${currentHealth}/${maxHealth} HP`);
  }

  /**
   * Get the current health for an entity, or null if no damage recorded
   */
  public getEntityHealth(entityId: string): { current: number; max: number } | null {
    if (!this.currentMapSeed) return null;

    const damagedEntities = this.getDamagedEntities();
    const entity = damagedEntities.find(e => e.id === entityId);

    if (entity) {
      return {
        current: entity.currentHealth,
        max: entity.maxHealth
      };
    }

    return null;
  }

  /**
   * Apply recorded health to an NPC
   */
  public applyHealthToNpc(npc: NpcEntity): NpcEntity {
    const health = this.getEntityHealth(npc.id);
    if (health) {
      return {
        ...npc,
        health: health.current,
        maxHealth: health.max
      };
    }
    return npc;
  }

  /**
   * Apply recorded health to an animal
   */
  public applyHealthToAnimal(animal: AnimalEntity): AnimalEntity {
    const health = this.getEntityHealth(animal.id);
    if (health) {
      return {
        ...animal,
        health: health.current,
        maxHealth: health.max
      };
    }
    return animal;
  }

  /**
   * Remove an entity from damage tracking (e.g., when they die)
   */
  public removeEntity(entityId: string): void {
    if (!this.currentMapSeed) return;

    const damagedEntities = this.getDamagedEntities();
    const filtered = damagedEntities.filter(e => e.id !== entityId);

    if (filtered.length !== damagedEntities.length) {
      this.saveDamagedEntities(filtered);
      console.log(`[EntityHealth] Removed ${entityId} from damage tracking`);
    }
  }

  /**
   * Heal an entity to full health and remove from tracking
   */
  public healEntity(entityId: string): void {
    this.removeEntity(entityId);
  }

  /**
   * Get all damaged entities for debugging
   */
  public getAllDamagedEntities(): DamagedEntity[] {
    return this.getDamagedEntities();
  }

  private getDamagedEntities(): DamagedEntity[] {
    if (!this.currentMapSeed) return [];

    try {
      const key = `${EntityHealthService.STORAGE_KEY}_${this.currentMapSeed}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const entities = JSON.parse(stored);
      if (!Array.isArray(entities)) return [];

      // Clean up old entries (older than 1 hour)
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      return entities.filter((e: DamagedEntity) =>
        e.id && typeof e.currentHealth === 'number' &&
        typeof e.maxHealth === 'number' &&
        (now - e.lastDamageTime) < oneHour
      );
    } catch (error) {
      console.error('[EntityHealth] Failed to get damaged entities:', error);
      return [];
    }
  }

  private saveDamagedEntities(entities: DamagedEntity[]): void {
    if (!this.currentMapSeed) return;

    try {
      const key = `${EntityHealthService.STORAGE_KEY}_${this.currentMapSeed}`;
      localStorage.setItem(key, JSON.stringify(entities));
    } catch (error) {
      console.error('[EntityHealth] Failed to save damaged entities:', error);
    }
  }
}

export const entityHealthService = EntityHealthService.getInstance();