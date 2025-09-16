/**
 * services/guardPermissionService.ts
 * Manages player permissions to access restricted areas in special maps
 * Integrates with existing guard arrest system to allow dialogue-based access granting
 */

import { eventBus } from './eventBus';

export interface AccessPermission {
  mapId: string;
  grantedBy: string; // NPC ID who granted permission
  grantedByName: string; // NPC name for display
  accessLevel: 'partial' | 'full'; // partial = some areas, full = everywhere
  restrictedAreas?: string[]; // room IDs still restricted (for partial access)
  grantedAt: number; // timestamp when permission was granted
  expiresAt?: number; // timestamp when permission expires (optional)
  reason?: string; // why permission was granted
}

class GuardPermissionService {
  private permissions: Map<string, AccessPermission> = new Map();
  private readonly PERMISSION_DURATION = 30 * 60 * 1000; // 30 minutes default

  /**
   * Grant access to a player for a specific map
   */
  grantAccess(
    mapId: string,
    npcId: string,
    npcName: string,
    level: 'partial' | 'full',
    reason?: string,
    duration?: number,
    restrictedAreas?: string[]
  ): void {
    const now = Date.now();
    const permission: AccessPermission = {
      mapId,
      grantedBy: npcId,
      grantedByName: npcName,
      accessLevel: level,
      restrictedAreas: level === 'partial' ? restrictedAreas : undefined,
      grantedAt: now,
      expiresAt: duration ? now + duration : now + this.PERMISSION_DURATION,
      reason: reason || 'Access granted through dialogue'
    };

    this.permissions.set(mapId, permission);

    // Emit event to notify guards and UI
    eventBus.emit('permission:granted', {
      mapId,
      npcId,
      npcName,
      level,
      reason,
      permission
    });

    console.log(`[GuardPermission] Access granted for map ${mapId} by ${npcName} (${level}): ${reason}`);
  }

  /**
   * Check if player has permission for a specific map and room
   */
  hasPermission(mapId: string, roomId?: string): boolean {
    const permission = this.permissions.get(mapId);
    if (!permission) return false;

    // Check if permission has expired
    if (permission.expiresAt && Date.now() > permission.expiresAt) {
      this.revokeAccess(mapId);
      return false;
    }

    // Full access grants everything
    if (permission.accessLevel === 'full') return true;

    // Partial access - check if specific room is restricted
    if (permission.accessLevel === 'partial' && roomId) {
      return !permission.restrictedAreas?.includes(roomId);
    }

    // Partial access without specific room check
    return permission.accessLevel === 'partial';
  }

  /**
   * Revoke access for a specific map
   */
  revokeAccess(mapId: string): void {
    const permission = this.permissions.get(mapId);
    if (permission) {
      this.permissions.delete(mapId);

      // Emit event to notify guards and UI
      eventBus.emit('permission:revoked', {
        mapId,
        revokedPermission: permission
      });

      console.log(`[GuardPermission] Access revoked for map ${mapId}`);
    }
  }

  /**
   * Get permission details for a specific map
   */
  getPermissionDetails(mapId: string): AccessPermission | null {
    const permission = this.permissions.get(mapId);
    if (!permission) return null;

    // Check expiration
    if (permission.expiresAt && Date.now() > permission.expiresAt) {
      this.revokeAccess(mapId);
      return null;
    }

    return permission;
  }

  /**
   * Check if a specific NPC can grant access
   * Based on their role, profession, and social status
   */
  canNpcGrantAccess(npc: any, mapArchetype?: string): boolean {
    const profession = npc.profession?.toLowerCase() || '';
    const role = npc.role?.toLowerCase() || '';
    const socialClass = npc.socialClass?.toLowerCase() || npc.class?.toLowerCase() || '';

    // High authority NPCs can always grant access
    const highAuthority = [
      'king', 'queen', 'emperor', 'empress', 'pharaoh', 'sultan', 'caliph',
      'lord', 'lady', 'duke', 'duchess', 'baron', 'count', 'earl',
      'high priest', 'archbishop', 'bishop', 'imam', 'rabbi', 'chief',
      'captain', 'commander', 'general', 'admiral'
    ];

    if (highAuthority.some(title => profession.includes(title) || role.includes(title))) {
      return true;
    }

    // Context-specific authority based on map type
    switch (mapArchetype) {
      case 'GOVERNMENT_FORUM':
      case 'GOVERNMENT':
        return profession.includes('official') ||
               profession.includes('magistrate') ||
               profession.includes('bureaucrat') ||
               profession.includes('minister') ||
               socialClass === 'nobility';

      case 'SACRED':
      case 'TEMPLE':
        return profession.includes('priest') ||
               profession.includes('cleric') ||
               profession.includes('monk') ||
               profession.includes('imam') ||
               profession.includes('rabbi');

      case 'ESTATES':
      case 'PALACE':
        return socialClass === 'nobility' ||
               profession.includes('steward') ||
               profession.includes('chamberlain') ||
               profession.includes('courtier');

      case 'MARKET':
        return profession.includes('merchant') ||
               profession.includes('trader') ||
               profession.includes('guild');

      default:
        // Default: only nobility and high-status NPCs
        return socialClass === 'nobility' ||
               profession.includes('guard captain') ||
               profession.includes('officer');
    }
  }

  /**
   * Get all active permissions
   */
  getAllPermissions(): Map<string, AccessPermission> {
    // Filter out expired permissions
    const now = Date.now();
    const activePermissions = new Map<string, AccessPermission>();

    for (const [mapId, permission] of this.permissions.entries()) {
      if (!permission.expiresAt || now <= permission.expiresAt) {
        activePermissions.set(mapId, permission);
      } else {
        this.revokeAccess(mapId); // Clean up expired permissions
      }
    }

    return activePermissions;
  }

  /**
   * Clear all permissions (useful for cleanup)
   */
  clearAllPermissions(): void {
    const mapIds = Array.from(this.permissions.keys());
    for (const mapId of mapIds) {
      this.revokeAccess(mapId);
    }
  }

  /**
   * Get permission status message for display
   */
  getPermissionStatusMessage(mapId: string): string | null {
    const permission = this.getPermissionDetails(mapId);
    if (!permission) return null;

    const timeRemaining = permission.expiresAt ?
      Math.ceil((permission.expiresAt - Date.now()) / (60 * 1000)) : null;

    const levelText = permission.accessLevel === 'full' ? 'Full Access' : 'Partial Access';
    const timeText = timeRemaining ? ` (${timeRemaining}m remaining)` : '';

    return `${levelText} granted by ${permission.grantedByName}${timeText}`;
  }
}

// Export singleton instance
export const guardPermissionService = new GuardPermissionService();

// Export for testing
export { GuardPermissionService };