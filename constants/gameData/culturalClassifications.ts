/**
 * Cultural classification data for accessory generation
 * Replaces hardcoded cultural percentages and complex accessory logic
 */
import { CulturalZone, HistoricalEra } from '../../types';

/**
 * Cultural accessory probability rates
 * Higher values = more likely to have cultural accessories/tattoos/markings
 */
export const CULTURAL_ACCESSORY_RATES = new Map<CulturalZone, number>([
  ['OCEANIA', 1.0],                        // Universal tattoos in Polynesian/Maori culture
  ['NORTH_AMERICAN_PRE_COLUMBIAN', 0.85],  // Very common tattoos and face paint
  ['SUB_SAHARAN_AFRICAN', 0.80],           // Scarification, tattoos, ornaments
  ['SOUTH_AMERICAN', 0.75],                // Body modifications common
  ['SOUTH_ASIAN', 0.70],                   // Bindis, nose rings, henna (especially women)
  ['MENA', 0.60],                          // Kohl, henna, tattoos
  ['EAST_ASIAN', 0.45],                    // Hair ornaments, cultural markings
  ['EUROPEAN', 0.35],                      // Lower rate, more jewelry than markings
  ['NORTH_AMERICAN_COLONIAL', 0.30]        // Western colonial culture
]);

/**
 * Get cultural accessory chance for a culture
 */
export function getCulturalAccessoryChance(culture: CulturalZone): number {
  return CULTURAL_ACCESSORY_RATES.get(culture) ?? 0.30;
}

/**
 * Era-based necklace/amulet probability modifiers
 */
export const ERA_AMULET_MODIFIERS = new Map<HistoricalEra, number>([
  ['PREHISTORY', 0.25],           // Fewer luxury items
  ['ANTIQUITY', 0.35],            // Growing jewelry culture
  ['MEDIEVAL', 0.45],             // Religious items common
  ['RENAISSANCE_EARLY_MODERN', 0.40], // Wealth concentration
  ['INDUSTRIAL_ERA', 0.30],       // Mass production, but less religious
  ['MODERN_ERA', 0.25],           // Secular society
  ['FUTURE_ERA', 0.20]            // Minimalist future
]);

/**
 * Profession-based amulet probability modifiers
 */
export const PROFESSION_AMULET_MODIFIERS = new Map<string, number>([
  // Religious professions - very high chance
  ['priest', 0.90], ['monk', 0.90], ['nun', 0.90], ['pilgrim', 0.95],
  ['cleric', 0.85], ['shaman', 0.85], ['druid', 0.80],

  // Wealthy professions - high chance
  ['merchant', 0.65], ['noble', 0.70], ['scholar', 0.60], ['banker', 0.65],
  ['physician', 0.55], ['scribe', 0.50],

  // Children and vulnerable - higher chance (protection)
  ['child', 0.60], ['orphan', 0.65], ['student', 0.45],

  // Military - moderate chance
  ['soldier', 0.35], ['guard', 0.30], ['knight', 0.50], ['officer', 0.45],

  // Common folk - base chance
  ['farmer', 0.25], ['peasant', 0.25], ['artisan', 0.30], ['craftsman', 0.30],

  // Criminal/outcast - lower chance
  ['thief', 0.15], ['bandit', 0.10], ['outlaw', 0.10]
]);

/**
 * Calculate necklace/amulet chance for a character
 */
export function calculateAmuletChance(
  era?: HistoricalEra,
  culture?: CulturalZone,
  profession?: string
): number {
  let baseChance = 0.35; // 35% base

  // Apply era modifier
  if (era) {
    const eraModifier = ERA_AMULET_MODIFIERS.get(era) ?? 0.35;
    baseChance = eraModifier;
  }

  // Apply culture modifier (small boost for jewelry-focused cultures)
  if (culture) {
    const culturalBoost = getCulturalAccessoryChance(culture) > 0.6 ? 0.1 : 0.0;
    baseChance += culturalBoost;
  }

  // Apply profession modifier
  if (profession) {
    const professionLower = profession.toLowerCase();
    for (const [profKey, modifier] of PROFESSION_AMULET_MODIFIERS) {
      if (professionLower.includes(profKey)) {
        baseChance = modifier;
        break;
      }
    }
  }

  return Math.min(baseChance, 0.95); // Cap at 95%
}

/**
 * Quality levels based on privilege
 */
export const PRIVILEGE_QUALITY_MAP = new Map<number, string>([
  [0.9, 'excellent'],
  [0.7, 'good'],
  [0.4, 'standard'],
  [0.0, 'poor']
]);

/**
 * Get quality level based on privilege
 */
export function getQualityFromPrivilege(privilege: number = 0.5): string {
  for (const [threshold, quality] of PRIVILEGE_QUALITY_MAP) {
    if (privilege >= threshold) {
      return quality;
    }
  }
  return 'poor';
}

/**
 * Wealth level mapping for accessories
 */
export const PRIVILEGE_WEALTH_MAP = new Map<number, string>([
  [0.7, 'wealthy'],
  [0.5, 'comfortable'],
  [0.3, 'modest'],
  [0.0, 'poor']
]);

/**
 * Get wealth level from privilege
 */
export function getWealthFromPrivilege(privilege: number = 0.5): string {
  for (const [threshold, wealth] of PRIVILEGE_WEALTH_MAP) {
    if (privilege >= threshold) {
      return wealth;
    }
  }
  return 'poor';
}