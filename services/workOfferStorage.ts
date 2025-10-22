/**
 * services/workOfferStorage.ts - Simple localStorage persistence for work offers
 * Bypasses the complex quest system for immediate functionality
 */
import { WorkOffer } from '../types/workOffer';
import { NpcEntity } from '../types';

const STORAGE_KEY = 'activeWorkOffers';

/**
 * Load all work offers from localStorage
 */
export function loadWorkOffers(): WorkOffer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading work offers:', error);
    return [];
  }
}

/**
 * Save all work offers to localStorage
 */
export function saveWorkOffers(offers: WorkOffer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  } catch (error) {
    console.error('Error saving work offers:', error);
  }
}

/**
 * Add a new work offer
 */
export function addWorkOffer(offer: WorkOffer): void {
  const offers = loadWorkOffers();
  offers.push(offer);
  saveWorkOffers(offers);
}

/**
 * Remove a work offer by ID
 */
export function removeWorkOffer(offerId: string): void {
  const offers = loadWorkOffers().filter(o => o.id !== offerId);
  saveWorkOffers(offers);

  // Clean up kill tracking if this was a kill_animal task
  clearKillTracking(offerId);
}

/**
 * Update a work offer
 */
export function updateWorkOffer(updatedOffer: WorkOffer): void {
  const offers = loadWorkOffers().map(o =>
    o.id === updatedOffer.id ? updatedOffer : o
  );
  saveWorkOffers(offers);
}

/**
 * Get work offers for a specific NPC
 */
export function getWorkOffersForNpc(npcId: string): WorkOffer[] {
  return loadWorkOffers().filter(o => o.npcId === npcId);
}

/**
 * Get active (accepted but not completed/failed) work offers
 */
export function getActiveWorkOffers(): WorkOffer[] {
  return loadWorkOffers().filter(o => o.accepted && !o.completed && !o.failed);
}

/**
 * Clear all work offers (for testing or reset)
 */
export function clearAllWorkOffers(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Track animal kill for a work offer
 */
export function recordAnimalKill(offerId: string, animalType: string): void {
  const key = `workOffer_${offerId}_kill`;
  const currentKill = localStorage.getItem(key);

  if (!currentKill) {
    // Record the kill with timestamp
    localStorage.setItem(key, JSON.stringify({
      animalType,
      timestamp: Date.now()
    }));
  }
}

/**
 * Check if animal was killed for a work offer
 */
export function wasAnimalKilled(offerId: string, targetAnimalType: string): boolean {
  const key = `workOffer_${offerId}_kill`;
  const stored = localStorage.getItem(key);

  if (!stored) return false;

  try {
    const data = JSON.parse(stored);
    // Case-insensitive match
    return data.animalType.toLowerCase() === targetAnimalType.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Clear kill tracking for a work offer
 */
export function clearKillTracking(offerId: string): void {
  const key = `workOffer_${offerId}_kill`;
  localStorage.removeItem(key);
}

/**
 * Validate and cleanup orphaned work offers (NPCs that no longer exist)
 * Returns the number of work offers that were auto-failed
 *
 * IMPORTANT: Only cleans up NPCs on the same map to avoid false positives
 * when player travels to different maps (e.g., entering palace interiors)
 */
export function cleanupOrphanedWorkOffers(currentNpcs: NpcEntity[], currentMapSeed?: string): number {
  const offers = loadWorkOffers();
  const validNpcIds = new Set(currentNpcs.map(npc => npc.id));

  let cleanedCount = 0;
  const updatedOffers = offers.map(offer => {
    // ONLY cleanup if we're on the same map as the work offer
    // This prevents false positives when player travels to different maps
    const onSameMap = !currentMapSeed ||
                      !offer.npcLocation.mapSeed ||
                      offer.npcLocation.mapSeed === currentMapSeed;

    // If offer is active, on the same map, and NPC no longer exists, mark as failed
    if (onSameMap && offer.accepted && !offer.completed && !offer.failed && !validNpcIds.has(offer.npcId)) {
      cleanedCount++;
      return {
        ...offer,
        failed: true
      };
    }
    return offer;
  });

  if (cleanedCount > 0) {
    saveWorkOffers(updatedOffers);

    // Dispatch event for UI refresh
    window.dispatchEvent(new CustomEvent('workOfferFailed', {
      detail: { reason: 'npc_disappeared', count: cleanedCount }
    }));
  }

  return cleanedCount;
}
