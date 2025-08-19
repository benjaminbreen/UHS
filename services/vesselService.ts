/**
 * services/vesselService.ts - Handles vessel usage for sea travel
 */
import { Item, PlayerCharacter } from '../types';

export interface VesselInfo {
  vessel: Item;
  capacity: number; // How many additional people/cargo it can carry
  speed: number; // Movement speed modifier (1.0 = normal)
  durability: number; // How long it lasts before needing repairs
  seaworthiness: number; // How well it handles rough seas (0-100)
}

export class VesselService {
  private static instance: VesselService;
  private playerVessels: VesselInfo[] = [];

  private constructor() {
    // Load saved vessels from localStorage
    const saved = localStorage.getItem('playerVessels');
    if (saved) {
      try {
        this.playerVessels = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load player vessels:', e);
      }
    }
  }

  static getInstance(): VesselService {
    if (!VesselService.instance) {
      VesselService.instance = new VesselService();
    }
    return VesselService.instance;
  }

  /**
   * Add a vessel to the player's available vessels for sea travel
   */
  addVessel(vessel: Item): VesselInfo {
    const vesselInfo = this.createVesselInfo(vessel);
    this.playerVessels.push(vesselInfo);
    this.saveVessels();
    return vesselInfo;
  }

  /**
   * Get all available vessels for the player
   */
  getAvailableVessels(): VesselInfo[] {
    return [...this.playerVessels];
  }

  /**
   * Remove a vessel (e.g., if it's destroyed or sold)
   */
  removeVessel(vesselId: string): boolean {
    const initialLength = this.playerVessels.length;
    this.playerVessels = this.playerVessels.filter(v => v.vessel.id !== vesselId);
    if (this.playerVessels.length !== initialLength) {
      this.saveVessels();
      return true;
    }
    return false;
  }

  /**
   * Get vessel info by ID
   */
  getVesselById(vesselId: string): VesselInfo | null {
    return this.playerVessels.find(v => v.vessel.id === vesselId) || null;
  }

  /**
   * Convert a vessel item to embark mode (removes from inventory, adds to available vessels)
   * This is now just for the VesselService registry - actual map deployment happens elsewhere
   */
  deployVessel(vessel: Item, playerCharacter: PlayerCharacter): boolean {
    if (vessel.category !== 'Vessel') {
      console.warn('Attempted to deploy non-vessel item:', vessel.name);
      return false;
    }

    // Remove from inventory
    const inventoryIndex = playerCharacter.inventory.findIndex(item => item.id === vessel.id);
    if (inventoryIndex === -1) {
      console.warn('Vessel not found in inventory:', vessel.name);
      return false;
    }

    playerCharacter.inventory.splice(inventoryIndex, 1);
    
    // Add to available vessels (for the embarkation UI)
    this.addVessel(vessel);
    
    console.log(`[VesselService] Deployed ${vessel.name} for sea travel`);
    return true;
  }

  /**
   * Create vessel info from item definition
   */
  private createVesselInfo(vessel: Item): VesselInfo {
    const vesselType = vessel.name.toLowerCase();
    
    // Determine vessel characteristics based on type
    if (vesselType.includes('kayak') || vesselType.includes('canoe')) {
      return {
        vessel,
        capacity: 1, // Single person
        speed: 1.2, // Fast and nimble
        durability: 80, // Fragile
        seaworthiness: 40 // Not great in rough seas
      };
    }
    
    if (vesselType.includes('raft') || vesselType.includes('log')) {
      return {
        vessel,
        capacity: 3, // Can carry more cargo/people
        speed: 0.7, // Slow
        durability: 90, // Very sturdy
        seaworthiness: 60 // Decent stability
      };
    }
    
    if (vesselType.includes('sailboat') || vesselType.includes('sail')) {
      return {
        vessel,
        capacity: 2, // Medium capacity
        speed: 1.5, // Fast with wind
        durability: 85, // Good construction
        seaworthiness: 85 // Excellent sea handling
      };
    }
    
    if (vesselType.includes('rowboat') || vesselType.includes('row') || vesselType.includes('dinghy')) {
      return {
        vessel,
        capacity: 2, // Medium capacity
        speed: 1.0, // Average speed
        durability: 90, // Well-built
        seaworthiness: 70 // Good sea handling
      };
    }
    
    // Default vessel characteristics
    return {
      vessel,
      capacity: 2,
      speed: 1.0,
      durability: 85,
      seaworthiness: 65
    };
  }

  /**
   * Save vessels to localStorage
   */
  private saveVessels(): void {
    localStorage.setItem('playerVessels', JSON.stringify(this.playerVessels));
  }

  /**
   * Clear all vessels (for new game)
   */
  clearVessels(): void {
    this.playerVessels = [];
    this.saveVessels();
  }
}

export const vesselService = VesselService.getInstance();