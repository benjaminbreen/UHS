/**
 * services/campingService.ts
 * Handles camp quality calculations and procedural camp descriptions
 */

import { Item } from '../types/itemTypes';
import { BiomeType } from '../types/biomes/base';

export interface CampQuality {
  totalQuality: number;
  shelterQuality: number;
  comfortQuality: number;
  specialQuality: number;
  healingPercent: number;
  fatiguePercent: number;
  description: string;
}

export interface CampEvent {
  id: string;
  name: string;
  description: string;
  available: boolean;
  effect: () => void;
}

class CampingService {
  private static instance: CampingService;

  private constructor() {}

  public static getInstance(): CampingService {
    if (!CampingService.instance) {
      CampingService.instance = new CampingService();
    }
    return CampingService.instance;
  }

  /**
   * Calculate camp quality based on inventory items
   */
  public calculateCampQuality(inventory: Item[]): CampQuality {
    let shelterQuality = 0;
    let comfortQuality = 0;
    let specialQuality = 0;

    // Track what we have for description
    let hasTent = false;
    let hasBedroll = false;
    let hasFirestarter = false;
    let hasBlanket = false;
    let foodCount = 0;
    let hasWater = false;
    let hasInstrument = false;
    let hasMedical = false;

    inventory.forEach(item => {
      const itemNameLower = item.name.toLowerCase();
      const baseId = item.baseId;

      // Shelter items (exact baseId matching for camping equipment)
      if (baseId === 'TENT' || baseId === 'YURT') {
        shelterQuality = Math.max(shelterQuality, 4); // Higher quality for proper tents
        hasTent = true;
      } else if (baseId === 'HIDE_TENT') {
        shelterQuality = Math.max(shelterQuality, 3);
        hasTent = true;
      } else if (baseId === 'LEAN_TO') {
        shelterQuality = Math.max(shelterQuality, 2);
        hasTent = true;
      } else if (baseId === 'BEDROLL' || baseId === 'SLEEPING_FUR' || baseId === 'HAMMOCK') {
        shelterQuality = Math.max(shelterQuality, 2);
        hasBedroll = true;
      } else if (baseId === 'STRAW_MAT') {
        shelterQuality = Math.max(shelterQuality, 1);
        hasBedroll = true;
      } else if (baseId === 'TRAVEL_BLANKET' || baseId === 'OILED_TARP' || itemNameLower.includes('cloak') || itemNameLower.includes('blanket')) {
        shelterQuality = Math.max(shelterQuality, 1);
        hasBlanket = true;
      } else if (itemNameLower.includes('tent')) {
        shelterQuality = Math.max(shelterQuality, 3);
        hasTent = true;
      } else if (itemNameLower.includes('bedroll') || itemNameLower.includes('sleeping')) {
        shelterQuality = Math.max(shelterQuality, 2);
        hasBedroll = true;
      }

      // Fire making items (exact baseId matching)
      if (baseId === 'TINDERBOX') {
        comfortQuality += 3; // Higher quality for proper tinderbox
        hasFirestarter = true;
      } else if (baseId === 'FLINT_AND_STEEL') {
        comfortQuality += 2;
        hasFirestarter = true;
      } else if (baseId === 'FIRE_DRILL' || baseId === 'TINDER_POUCH') {
        comfortQuality += 1;
        hasFirestarter = true;
      } else if (itemNameLower.includes('firestarter') || itemNameLower.includes('torch') ||
          itemNameLower.includes('flint') || itemNameLower.includes('matches')) {
        comfortQuality += 2;
        hasFirestarter = true;
      }

      // Water storage items
      if (baseId === 'WATERSKIN' || baseId === 'BAMBOO_CANTEEN') {
        comfortQuality += 1;
        hasWater = true;
      }

      // Cooking equipment
      if (baseId === 'TRAVEL_POT' || baseId === 'CAMP_KETTLE') {
        comfortQuality += 1;
      }

      // Comfort equipment
      if (baseId === 'CAMP_STOOL') {
        comfortQuality += 0.5;
      }

      if (baseId === 'MOSQUITO_NET') {
        comfortQuality += 1; // Protection from insects
      }

      // Food and water
      if (item.category === 'Food' || itemNameLower.includes('bread') ||
          itemNameLower.includes('meat') || itemNameLower.includes('fruit')) {
        foodCount++;
        comfortQuality += 0.5; // Half point per food item, max 2 points
      }

      if (itemNameLower.includes('water') || itemNameLower.includes('wine') ||
          itemNameLower.includes('ale') || itemNameLower.includes('potion')) {
        hasWater = true;
        comfortQuality += 1;
      }

      // Special items
      if (itemNameLower.includes('lute') || itemNameLower.includes('flute') ||
          itemNameLower.includes('drum') || itemNameLower.includes('harp')) {
        hasInstrument = true;
        specialQuality += 1;
      }

      if (itemNameLower.includes('bandage') || itemNameLower.includes('herbs') ||
          itemNameLower.includes('medicine') || itemNameLower.includes('salve')) {
        hasMedical = true;
        specialQuality += 1;
      }
    });

    // Cap comfort quality from food
    comfortQuality = Math.min(comfortQuality, 5);

    const totalQuality = shelterQuality + comfortQuality + specialQuality;

    // Calculate healing percentages (base 20% + 5% per quality point, max 60%)
    const healingPercent = Math.min(20 + (totalQuality * 5), 60);
    const fatiguePercent = Math.min(25 + (totalQuality * 5), 70); // Fatigue restores better

    // Generate description based on what we have
    const description = this.generateCampDescription(
      hasTent, hasBedroll, hasBlanket, hasFirestarter,
      foodCount > 0, hasWater, hasInstrument, hasMedical
    );

    return {
      totalQuality,
      shelterQuality,
      comfortQuality,
      specialQuality,
      healingPercent,
      fatiguePercent,
      description
    };
  }

  /**
   * Generate procedural camp description based on items
   */
  private generateCampDescription(
    hasTent: boolean, hasBedroll: boolean, hasBlanket: boolean,
    hasFirestarter: boolean, hasFood: boolean, hasWater: boolean,
    hasInstrument: boolean, hasMedical: boolean
  ): string {
    let description = '';

    // Shelter description
    if (hasTent) {
      description += 'Your tent provides excellent shelter from the elements. ';
    } else if (hasBedroll) {
      description += 'You unroll your bedding on the ground. ';
    } else if (hasBlanket) {
      description += 'You wrap yourself in your cloak for warmth. ';
    } else {
      description += 'You find a relatively comfortable spot on the bare ground. ';
    }

    // Fire description
    if (hasFirestarter) {
      description += 'A crackling campfire warms the area and lifts your spirits. ';
    } else {
      description += 'Without fire, the darkness feels oppressive. ';
    }

    // Food and water
    if (hasFood && hasWater) {
      description += 'You enjoy a satisfying meal before resting. ';
    } else if (hasFood) {
      description += 'You eat what provisions you have. ';
    } else if (hasWater) {
      description += 'At least you have something to drink. ';
    }

    // Special items
    if (hasInstrument) {
      description += 'Soft music fills the night air. ';
    }
    if (hasMedical) {
      description += 'You tend to your wounds with medicinal supplies. ';
    }

    return description;
  }

  /**
   * Generate biome-specific camp intro text
   */
  public getBiomeCampIntro(biome: BiomeType): string {
    const intros: Partial<Record<BiomeType, string>> = {
      [BiomeType.FOREST]: 'You make camp beneath the ancient trees, their leaves rustling softly in the evening breeze.',
      [BiomeType.DENSE_FOREST]: 'Deep in the forest, you clear a small area among the thick undergrowth.',
      [BiomeType.GRASSLAND]: 'The open plains stretch endlessly as you settle down for the night under the vast sky.',
      [BiomeType.DESERT]: 'You find shelter beside a rocky outcropping, escaping the desert winds.',
      [BiomeType.MOUNTAIN]: 'High on the mountainside, you establish camp in a protected alcove.',
      [BiomeType.HILLS]: 'You set up camp on a gentle slope with a commanding view of the surrounding land.',
      [BiomeType.BEACH]: 'The sound of waves provides a soothing backdrop as you make camp on the sandy shore.',
      [BiomeType.TUNDRA]: 'In the frozen wasteland, you huddle against the bitter cold.',
      [BiomeType.JUNGLE]: 'The jungle humidity is oppressive as you clear a space among the dense vegetation.',
      [BiomeType.WETLANDS]: 'You find a dry patch of ground to rest in the marshy terrain.',
      [BiomeType.SNOW]: 'You dig a shelter in the snow, creating a small refuge from the elements.',
      [BiomeType.RIVER]: 'The gentle babbling of the river provides a peaceful ambiance for your camp.',
      [BiomeType.RUINS]: 'You take shelter within the crumbling walls of ancient ruins.',
    };

    return intros[biome] || 'You find a suitable spot to make camp for the night.';
  }

  /**
   * Get available camp events based on context
   */
  public getCampEvents(
    biome: BiomeType,
    inventory: Item[],
    hasWaterNearby: boolean
  ): CampEvent[] {
    const events: CampEvent[] = [];

    // Collect water event
    if (hasWaterNearby || biome === BiomeType.RIVER || biome === BiomeType.BEACH) {
      events.push({
        id: 'collect-water',
        name: 'Collect Fresh Water',
        description: 'Gather clean water from the nearby source',
        available: true,
        effect: () => {
          // This will be connected to actual game mechanics
          console.log('Collecting water...');
        }
      });
    }

    // Tend wounds event (if have medical supplies)
    const hasMedical = inventory.some(item =>
      item.name.toLowerCase().includes('bandage') ||
      item.name.toLowerCase().includes('medicine')
    );

    if (hasMedical) {
      events.push({
        id: 'tend-wounds',
        name: 'Tend to Wounds',
        description: 'Use medical supplies for extra healing',
        available: true,
        effect: () => {
          console.log('Tending wounds...');
        }
      });
    }

    // Study stars event (clear night)
    if (biome !== BiomeType.DENSE_FOREST && biome !== BiomeType.JUNGLE) {
      events.push({
        id: 'study-stars',
        name: 'Study the Stars',
        description: 'Contemplate the night sky and gain wisdom',
        available: true,
        effect: () => {
          console.log('Studying stars...');
        }
      });
    }

    return events;
  }
}

export const campingService = CampingService.getInstance();
export default campingService;