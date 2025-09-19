/**
 * services/urbanTileRegistryService.ts
 *
 * Registry for tracking NPCs' homes and workplaces in urban tiles.
 * This enables proper city simulation with residents and businesses.
 *
 * ENHANCED VERSION: Integrates with comprehensive workplace generation
 */

import { NpcEntity, Tile, Point, HistoricalEra } from '../types';
import { BiomeType } from '../types/biomes';
import { CulturalZone } from '../constants/characterData/names';
import {
  generateBusinessForUrbanTile,
  shouldHaveIndividualWorkplace,
  generateWorkplaceName,
  generateWorkingHours,
  detectProfessionCategory,
  getSupplyChainConnections
} from './workplaceGenerationService';

export interface BusinessInfo {
  id: string;
  name: string;
  type: string; // bakery, smithy, tavern, etc.
  ownerId: string; // NPC ID who owns this
  employees: string[]; // Other NPCs who work here
  location: Point; // Which tile this business is in
  openHours: [number, number]; // [6, 18] for 6am-6pm
}

export interface ResidenceInfo {
  id: string;
  type: 'house' | 'apartment' | 'room' | 'camp' | 'insula' | 'domus' | 'burgage' | 'siheyuan' | 'riad';
  occupants: string[]; // NPC IDs who live here
  primaryOccupant?: string; // Owner/head of household
  wealthLevel: 'poor' | 'modest' | 'comfortable' | 'wealthy';
}

interface TileUrbanData {
  businesses: BusinessInfo[];
  residences: ResidenceInfo[];
  lastUpdated: number;
}

class UrbanTileRegistry {
  private tileData: Map<string, TileUrbanData> = new Map();

  /**
   * Get a unique key for a tile position
   */
  private getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Add a business to a specific tile
   */
  addBusiness(tile: Tile | Point, business: BusinessInfo): void {
    const key = this.getTileKey(tile.x, tile.y);
    const data = this.tileData.get(key) || {
      businesses: [],
      residences: [],
      lastUpdated: Date.now()
    };

    // Check for duplicates
    const existingIndex = data.businesses.findIndex(b => b.id === business.id);
    if (existingIndex !== -1) {
      // Update existing business
      data.businesses[existingIndex] = business;
    } else {
      // Add new business
      data.businesses.push(business);
    }

    data.lastUpdated = Date.now();
    this.tileData.set(key, data);
  }

  /**
   * Add or update a resident in a specific tile
   */
  addResident(tile: Tile | Point, npcId: string, residenceId?: string, residenceType?: ResidenceInfo['type'], wealthLevel?: ResidenceInfo['wealthLevel']): string {
    const key = this.getTileKey(tile.x, tile.y);
    const data = this.tileData.get(key) || {
      businesses: [],
      residences: [],
      lastUpdated: Date.now()
    };

    // Find or create residence
    let residence: ResidenceInfo | undefined;

    if (residenceId) {
      residence = data.residences.find(r => r.id === residenceId);
    }

    // If no specific residence, try to find one with space
    if (!residence && data.residences.length > 0) {
      // Look for a residence of appropriate wealth level with space
      residence = data.residences.find(r =>
        r.wealthLevel === (wealthLevel || 'modest') &&
        r.occupants.length < this.getResidenceCapacity(r.type)
      );
    }

    // Create new residence if needed
    if (!residence) {
      residence = {
        id: `res_${key}_${data.residences.length}`,
        type: residenceType || 'house',
        occupants: [],
        wealthLevel: wealthLevel || 'modest'
      };
      data.residences.push(residence);
    }

    // Add NPC to residence if not already there
    if (!residence.occupants.includes(npcId)) {
      residence.occupants.push(npcId);
    }

    data.lastUpdated = Date.now();
    this.tileData.set(key, data);

    return residence.id;
  }

  /**
   * Get capacity based on residence type
   */
  private getResidenceCapacity(type: ResidenceInfo['type']): number {
    switch(type) {
      case 'room': return 2;
      case 'apartment': return 4;
      case 'insula': return 8; // Roman apartment block
      case 'house': return 6;
      case 'domus': return 10; // Roman house
      case 'burgage': return 8; // Medieval townhouse
      case 'siheyuan': return 12; // Chinese courtyard house
      case 'riad': return 10; // Islamic courtyard house
      case 'camp': return 4;
      default: return 4;
    }
  }

  /**
   * Remove an NPC from all registries (when they die or leave)
   */
  removeNpc(npcId: string): void {
    this.tileData.forEach((data, key) => {
      // Remove from residences
      data.residences.forEach(residence => {
        residence.occupants = residence.occupants.filter(id => id !== npcId);
        if (residence.primaryOccupant === npcId) {
          // Assign new primary occupant if needed
          residence.primaryOccupant = residence.occupants[0];
        }
      });

      // Remove empty residences
      data.residences = data.residences.filter(r => r.occupants.length > 0);

      // Remove or update businesses
      data.businesses = data.businesses.filter(b => {
        if (b.ownerId === npcId) {
          // Business owner died/left - could transfer to employee
          if (b.employees.length > 0) {
            b.ownerId = b.employees[0];
            b.employees = b.employees.slice(1);
            return true; // Keep business with new owner
          }
          return false; // Remove business
        }
        // Remove from employees list
        b.employees = b.employees.filter(id => id !== npcId);
        return true;
      });

      data.lastUpdated = Date.now();
    });
  }

  /**
   * Get all data for a specific tile
   */
  getTileData(x: number, y: number): TileUrbanData | null {
    return this.tileData.get(this.getTileKey(x, y)) || null;
  }

  /**
   * Get all NPCs living in a tile
   */
  getTileResidents(x: number, y: number): string[] {
    const data = this.getTileData(x, y);
    if (!data) return [];

    return data.residences.flatMap(r => r.occupants);
  }

  /**
   * Get all businesses in a tile
   */
  getTileBusinesses(x: number, y: number): BusinessInfo[] {
    const data = this.getTileData(x, y);
    return data?.businesses || [];
  }

  /**
   * Find which tile an NPC lives in
   */
  findNpcHome(npcId: string): Point | null {
    for (const [key, data] of this.tileData) {
      const hasNpc = data.residences.some(r => r.occupants.includes(npcId));
      if (hasNpc) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }
    }
    return null;
  }

  /**
   * Find which tile an NPC works in
   */
  findNpcWorkplace(npcId: string): Point | null {
    for (const [key, data] of this.tileData) {
      const hasNpc = data.businesses.some(b =>
        b.ownerId === npcId || b.employees.includes(npcId)
      );
      if (hasNpc) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }
    }
    return null;
  }

  /**
   * Clear all data (for testing or reset)
   */
  clear(): void {
    this.tileData.clear();
  }

  /**
   * Save registry to localStorage
   */
  save(): void {
    try {
      const serialized = JSON.stringify([...this.tileData]);
      localStorage.setItem('urbanTileRegistry', serialized);
    } catch (error) {
      console.error('[UrbanTileRegistry] Failed to save:', error);
    }
  }

  /**
   * Load registry from localStorage
   */
  load(): void {
    try {
      const saved = localStorage.getItem('urbanTileRegistry');
      if (saved) {
        this.tileData = new Map(JSON.parse(saved));
        console.log('[UrbanTileRegistry] Loaded', this.tileData.size, 'tiles from storage');
      }
    } catch (error) {
      console.error('[UrbanTileRegistry] Failed to load:', error);
      this.tileData.clear();
    }
  }

  /**
   * Get statistics about the registry
   */
  getStats(): { tiles: number; businesses: number; residences: number; npcs: number } {
    let businesses = 0;
    let residences = 0;
    let npcs = new Set<string>();

    this.tileData.forEach(data => {
      businesses += data.businesses.length;
      residences += data.residences.length;
      data.residences.forEach(r => r.occupants.forEach(id => npcs.add(id)));
      data.businesses.forEach(b => {
        npcs.add(b.ownerId);
        b.employees.forEach(id => npcs.add(id));
      });
    });

    return {
      tiles: this.tileData.size,
      businesses,
      residences,
      npcs: npcs.size
    };
  }

  /**
   * ENHANCED: Automatically generate and register a culturally appropriate business for an NPC
   * Uses the comprehensive workplace generation system
   */
  generateAndRegisterBusiness(
    npc: NpcEntity,
    tile: Tile | Point,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    biome: BiomeType
  ): BusinessInfo | null {
    // Use the enhanced workplace generation
    const businessData = generateBusinessForUrbanTile(npc, culturalZone, era, biome);

    if (!businessData) {
      // This NPC shouldn't have a workplace (e.g., guard, noble, serf)
      return null;
    }

    // Create BusinessInfo with unique ID
    const business: BusinessInfo = {
      id: `biz_${tile.x}_${tile.y}_${Date.now()}`,
      name: businessData.name,
      type: businessData.type,
      ownerId: npc.id,
      employees: businessData.employees,
      location: { x: tile.x, y: tile.y },
      openHours: businessData.openHours
    };

    // Register the business
    this.addBusiness(tile, business);

    // Log for debugging
    console.log(`[UrbanRegistry] Generated ${culturalZone} ${era} business: "${business.name}" (${business.type}) for ${npc.name} the ${npc.profession}`);

    return business;
  }

  /**
   * Generate appropriate residence type based on culture and era
   */
  getResidenceType(culturalZone: CulturalZone, era: HistoricalEra, wealthLevel: ResidenceInfo['wealthLevel']): ResidenceInfo['type'] {
    // Cultural residence patterns
    if (culturalZone === 'EUROPEAN') {
      if (era === HistoricalEra.ANTIQUITY) {
        return wealthLevel === 'wealthy' ? 'domus' : 'insula';
      } else if (era === HistoricalEra.MEDIEVAL) {
        return 'burgage';
      }
    } else if (culturalZone === 'EAST_ASIAN') {
      if (era !== HistoricalEra.MODERN_ERA && era !== HistoricalEra.FUTURE_ERA) {
        return 'siheyuan'; // Traditional courtyard house
      }
    } else if (culturalZone === 'MENA') {
      if (era !== HistoricalEra.MODERN_ERA && era !== HistoricalEra.FUTURE_ERA) {
        return 'riad'; // Traditional courtyard house
      }
    }

    // Default based on wealth
    if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
      return wealthLevel === 'wealthy' ? 'house' : 'apartment';
    }

    return wealthLevel === 'poor' ? 'room' : 'house';
  }

  /**
   * ENHANCED: Process NPCs in urban tiles - generate businesses and residences
   */
  processUrbanNpcs(
    npcs: NpcEntity[],
    tile: Tile,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    biome: BiomeType
  ): void {
    npcs.forEach(npc => {
      // Determine wealth level based on profession
      const wealthLevel = this.determineWealthLevel(npc.profession || '');

      // Add residence
      const residenceType = this.getResidenceType(culturalZone, era, wealthLevel);
      this.addResident(tile, npc.id, undefined, residenceType, wealthLevel);

      // Generate workplace if appropriate
      if (shouldHaveIndividualWorkplace(npc.profession || '', era, culturalZone)) {
        this.generateAndRegisterBusiness(npc, tile, culturalZone, era, biome);
      }
    });
  }

  /**
   * Determine wealth level based on profession
   */
  private determineWealthLevel(profession: string): ResidenceInfo['wealthLevel'] {
    const profLower = profession.toLowerCase();

    // Wealthy professions
    if (profLower.includes('merchant') || profLower.includes('banker') ||
        profLower.includes('goldsmith') || profLower.includes('physician') ||
        profLower.includes('lawyer') || profLower.includes('guild master')) {
      return 'wealthy';
    }

    // Comfortable professions
    if (profLower.includes('smith') || profLower.includes('master') ||
        profLower.includes('scribe') || profLower.includes('clerk')) {
      return 'comfortable';
    }

    // Poor professions
    if (profLower.includes('beggar') || profLower.includes('serf') ||
        profLower.includes('slave') || profLower.includes('laborer')) {
      return 'poor';
    }

    // Default modest
    return 'modest';
  }

  /**
   * Get supply chain connections for businesses in a tile
   * Shows economic relationships between businesses
   */
  getTileSupplyChains(x: number, y: number): Map<string, string[]> {
    const businesses = this.getTileBusinesses(x, y);
    const connections = new Map<string, string[]>();

    businesses.forEach(business => {
      const chains = getSupplyChainConnections(business.type);

      // Find actual businesses that match supplier/customer types
      const actualSuppliers = businesses.filter(b =>
        chains.suppliers.includes(b.type)
      ).map(b => b.name);

      const actualCustomers = businesses.filter(b =>
        chains.customers.includes(b.type)
      ).map(b => b.name);

      if (actualSuppliers.length > 0 || actualCustomers.length > 0) {
        connections.set(business.name, [...actualSuppliers, ...actualCustomers]);
      }
    });

    return connections;
  }
}

// Export singleton instance
export const urbanTileRegistry = new UrbanTileRegistry();