/**
 * services/cropNutrientService.ts
 * Phase 4.1: Crop nutrient effects and rotation logic
 */

import { CROP_DATA } from '../constants/gameData/cropData';

/**
 * Get nutrient effects for a crop, with defaults if not defined in CROP_DATA
 */
export function getCropNutrientEffects(cropName: string): {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  category: 'grain' | 'legume' | 'root' | 'vegetable' | 'fruit';
} {
  const crop = CROP_DATA[cropName];

  // If crop has explicit nutrient data, use it
  if (crop && 'nitrogenEffect' in crop) {
    return {
      nitrogen: crop.nitrogenEffect,
      phosphorus: crop.phosphorusEffect,
      potassium: crop.potassiumEffect,
      category: crop.cropCategory,
    };
  }

  // Default nutrient effects based on crop name patterns
  // Legumes: beans, peas, lentils, clover (nitrogen fixers!)
  if (/bean|pea|lentil|clover/i.test(cropName)) {
    return {
      nitrogen: 30, // RESTORE nitrogen!
      phosphorus: -5,
      potassium: -5,
      category: 'legume',
    };
  }

  // Grains: wheat, barley, rice, oats, rye, corn (heavy nitrogen feeders)
  if (/wheat|barley|rice|oats|rye|corn|millet|sorghum/i.test(cropName)) {
    return {
      nitrogen: -15,
      phosphorus: -8,
      potassium: -5,
      category: 'grain',
    };
  }

  // Root crops: turnips, carrots, potatoes (heavy phosphorus feeders)
  if (/turnip|carrot|potato|beet|radish|parsnip/i.test(cropName)) {
    return {
      nitrogen: -8,
      phosphorus: -15,
      potassium: -10,
      category: 'root',
    };
  }

  // Vegetables: cabbage, lettuce, etc.
  if (/cabbage|lettuce|spinach|kale|onion/i.test(cropName)) {
    return {
      nitrogen: -10,
      phosphorus: -6,
      potassium: -8,
      category: 'vegetable',
    };
  }

  // Fruits/vines: grapes, melons
  if (/grape|melon|pumpkin|squash/i.test(cropName)) {
    return {
      nitrogen: -8,
      phosphorus: -10,
      potassium: -12,
      category: 'fruit',
    };
  }

  // Default: moderate depletion
  return {
    nitrogen: -10,
    phosphorus: -8,
    potassium: -6,
    category: 'vegetable',
  };
}

/**
 * Check if crop rotation is good (following historical rotation systems)
 */
export function evaluateCropRotation(
  currentCrop: string,
  lastCrop: string | null,
  consecutiveSeasons: number
): {
  isGood: boolean;
  reason: string;
  recommendation: string;
} {
  const currentEffects = getCropNutrientEffects(currentCrop);

  // No previous crop - rotation is fine
  if (!lastCrop) {
    return {
      isGood: true,
      reason: 'Fresh field with no rotation history',
      recommendation: 'Any crop is suitable for this field',
    };
  }

  const lastEffects = getCropNutrientEffects(lastCrop);

  // Same crop multiple seasons in a row - BAD
  if (lastCrop === currentCrop && consecutiveSeasons >= 2) {
    return {
      isGood: false,
      reason: `Planting ${currentCrop} for the ${consecutiveSeasons + 1}rd consecutive season severely depletes soil`,
      recommendation: `Rotate to legumes (beans, peas) to restore nitrogen, or let field rest fallow`,
    };
  }

  // Grain after grain - suboptimal (both deplete nitrogen)
  if (currentEffects.category === 'grain' && lastEffects.category === 'grain') {
    return {
      isGood: false,
      reason: `Grains after grains (${lastCrop} → ${currentCrop}) depletes nitrogen heavily`,
      recommendation: `Plant legumes (beans, peas, clover) to restore soil nitrogen`,
    };
  }

  // Legume rotation - EXCELLENT! (nitrogen restoration)
  if (currentEffects.category === 'legume') {
    return {
      isGood: true,
      reason: `Legumes restore nitrogen depleted by previous ${lastCrop}`,
      recommendation: `Excellent rotation! After harvest, plant grains to benefit from restored nitrogen`,
    };
  }

  // Grain after legume - EXCELLENT! (classic rotation)
  if (currentEffects.category === 'grain' && lastEffects.category === 'legume') {
    return {
      isGood: true,
      reason: `Grains benefit from nitrogen restored by previous legume crop`,
      recommendation: `Classic rotation pattern - continue with root crops or fallow next`,
    };
  }

  // Root crops after grains - GOOD (different nutrient demands)
  if (currentEffects.category === 'root' && lastEffects.category === 'grain') {
    return {
      isGood: true,
      reason: `Root crops use phosphorus while grains depleted nitrogen - good balance`,
      recommendation: `Follow with legumes next season to restore nitrogen`,
    };
  }

  // Default: acceptable rotation
  return {
    isGood: true,
    reason: `Rotating from ${lastCrop} (${lastEffects.category}) to ${currentCrop} (${currentEffects.category}) provides decent variety`,
    recommendation: `Consider legumes every 2-3 seasons to maintain nitrogen levels`,
  };
}

/**
 * Calculate soil health penalty based on consecutive same-crop plantings
 */
export function getConsecutiveCropPenalty(consecutiveSeasons: number): number {
  if (consecutiveSeasons === 0) return 0;
  if (consecutiveSeasons === 1) return -5; // First repeat: minor penalty
  if (consecutiveSeasons === 2) return -15; // Second repeat: major penalty
  return -25; // Third+ repeat: severe penalty
}
