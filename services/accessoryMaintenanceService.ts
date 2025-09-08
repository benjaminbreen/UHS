/**
 * services/accessoryMaintenanceService.ts
 * Handles temporary accessory expiration and special accessory mechanics
 */

import { PlayerCharacter, Item } from '../types';
import { updateTemporaryAccessories } from './culturalAccessoryService';

class AccessoryMaintenanceService {
  private static instance: AccessoryMaintenanceService;
  private lastUpdateTime: number = Date.now();

  private constructor() {}

  static getInstance(): AccessoryMaintenanceService {
    if (!AccessoryMaintenanceService.instance) {
      AccessoryMaintenanceService.instance = new AccessoryMaintenanceService();
    }
    return AccessoryMaintenanceService.instance;
  }

  /**
   * Update temporary accessories based on elapsed time
   */
  updateAccessories(character: PlayerCharacter, currentTime: number): boolean {
    const hoursElapsed = (currentTime - this.lastUpdateTime) / (1000 * 60 * 60); // Convert ms to hours
    this.lastUpdateTime = currentTime;

    if (hoursElapsed <= 0) return false;

    let hasChanges = false;

    // Check equipped accessory
    if (character.equippedItems.accessory) {
      const accessory = character.equippedItems.accessory;
      if ((accessory as any).duration) {
        (accessory as any).duration -= hoursElapsed;
        if ((accessory as any).duration <= 0) {
          // Remove expired accessory
          console.log(`[AccessoryMaintenance] ${accessory.name} has faded away.`);
          delete character.equippedItems.accessory;
          hasChanges = true;
        }
      }
    }

    // Check inventory for temporary accessories
    const updatedInventory = character.inventory.filter(item => {
      if ((item as any).duration) {
        (item as any).duration -= hoursElapsed;
        if ((item as any).duration <= 0) {
          console.log(`[AccessoryMaintenance] ${item.name} has expired and been removed from inventory.`);
          hasChanges = true;
          return false; // Remove from inventory
        }
      }
      return true;
    });

    if (hasChanges) {
      character.inventory = updatedInventory;
    }

    return hasChanges;
  }

  /**
   * Apply face paint or temporary marking
   */
  applyTemporaryAccessory(character: PlayerCharacter, accessory: Item): boolean {
    // Check if character already has face paint
    if (character.equippedItems.accessory) {
      const existing = character.equippedItems.accessory;
      if ((existing as any).specialType === 'face_paint' && 
          (accessory as any).specialType === 'face_paint') {
        console.log('[AccessoryMaintenance] Already wearing face paint. Remove it first.');
        return false;
      }
    }

    // Apply the accessory
    character.equippedItems.accessory = accessory;
    
    // Set default duration if not specified
    if (!(accessory as any).duration && (accessory as any).specialType === 'face_paint') {
      (accessory as any).duration = 24; // 24 hours default
    } else if (!(accessory as any).duration && (accessory as any).specialType === 'henna') {
      (accessory as any).duration = 72; // 72 hours for henna
    }

    console.log(`[AccessoryMaintenance] Applied ${accessory.name} for ${(accessory as any).duration} hours.`);
    return true;
  }

  /**
   * Check if an accessory can be removed
   */
  canRemoveAccessory(accessory: Item): { canRemove: boolean; reason?: string; requiredItem?: string } {
    const specialType = (accessory as any).specialType;
    const isPermanent = (accessory as any).isPermanent;

    if (isPermanent) {
      switch (specialType) {
        case 'tattoo':
          return { 
            canRemove: false, 
            reason: 'Tattoos are permanent markings that cannot be removed.',
            requiredItem: 'TATTOO_REMOVAL_SALVE' // Future item
          };
        case 'scarification':
          return { 
            canRemove: false, 
            reason: 'Scarification is a permanent body modification.'
          };
        case 'permanent_piercing':
          return { 
            canRemove: false, 
            reason: 'This piercing has become permanent. The hole will not close.'
          };
        default:
          return { 
            canRemove: false, 
            reason: 'This accessory cannot be removed normally.'
          };
      }
    }

    return { canRemove: true };
  }

  /**
   * Get display information for temporary accessories
   */
  getTemporaryAccessoryDisplay(accessory: Item): string {
    const duration = (accessory as any).duration;
    if (!duration) return '';

    if (duration < 1) {
      return 'Fading...';
    } else if (duration < 6) {
      return `${Math.floor(duration)}h remaining`;
    } else if (duration < 24) {
      return `${Math.floor(duration)}h`;
    } else {
      const days = Math.floor(duration / 24);
      return `${days}d`;
    }
  }

  /**
   * Refresh face paint or henna (extends duration)
   */
  refreshTemporaryAccessory(accessory: Item, refreshItem: Item): boolean {
    const specialType = (accessory as any).specialType;
    
    if (specialType === 'face_paint' && refreshItem.name.toLowerCase().includes('paint')) {
      (accessory as any).duration = Math.min((accessory as any).duration + 24, 48); // Max 48 hours
      console.log(`[AccessoryMaintenance] Refreshed face paint. New duration: ${(accessory as any).duration}h`);
      return true;
    }
    
    if (specialType === 'henna' && refreshItem.name.toLowerCase().includes('henna')) {
      (accessory as any).duration = Math.min((accessory as any).duration + 72, 144); // Max 144 hours
      console.log(`[AccessoryMaintenance] Refreshed henna. New duration: ${(accessory as any).duration}h`);
      return true;
    }

    return false;
  }

  /**
   * Get cultural significance of an accessory
   */
  getCulturalSignificance(accessory: Item): string {
    const culturalOrigin = (accessory as any).culturalOrigin;
    const quality = (accessory as any).quality;
    const specialType = (accessory as any).specialType;

    let significance = '';

    // Add cultural origin info
    if (culturalOrigin) {
      significance += `This is a traditional ${culturalOrigin} accessory. `;
    }

    // Add quality-based significance
    if (quality === 'legendary') {
      significance += 'It carries immense cultural and historical importance. ';
    } else if (quality === 'masterwork') {
      significance += 'It represents the pinnacle of traditional craftsmanship. ';
    }

    // Add type-specific significance
    if (specialType === 'tattoo') {
      significance += 'These markings tell a story of identity and belonging. ';
    } else if (specialType === 'scarification') {
      significance += 'These scars mark important life transitions. ';
    } else if (accessory.name.toLowerCase().includes('wedding') || 
               accessory.name.toLowerCase().includes('bridal')) {
      significance += 'This piece signifies marital status. ';
    } else if (accessory.name.toLowerCase().includes('religious') || 
               accessory.name.toLowerCase().includes('sacred')) {
      significance += 'This item has deep spiritual meaning. ';
    }

    return significance || 'A piece of cultural ornamentation.';
  }
}

export default AccessoryMaintenanceService.getInstance();