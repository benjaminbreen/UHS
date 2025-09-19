/**
 * Throwable Weapon Service - Enhanced damage calculation and physics for thrown items
 * Supports both ad-hoc thrown items and proper throwable weapons
 */

import { Item } from '../types/itemTypes';
import { PlayerCharacter } from '../types/playerCharacter';
import { EncounterableEntity } from '../types/npcTypes';

export interface ThrowResult {
  damage: number;
  accuracy: number;
  criticalChance: number;
  physicsMultiplier: number;
  weaponType: ThrowableWeaponType;
  flavorText: string;
  animationDuration: number;
  trajectoryStyle: 'arc' | 'straight' | 'spinning';
}

export type ThrowableWeaponType =
  | 'improvised'       // Random items (books, rocks, tools)
  | 'throwing_weapon'  // Designed for throwing (javelins, throwing knives)
  | 'ranged_weapon'    // Bows, crossbows, slings (fire projectiles)
  | 'melee_throwable'  // Swords, axes that can be thrown
  | 'projectile'       // Arrows, bolts, stones for slings
  | 'explosive';       // Bombs, grenades

/**
 * Determine what type of throwable weapon this item is
 */
export function getThrowableWeaponType(item: Item): ThrowableWeaponType {
  const name = item.name.toLowerCase();
  const category = item.category?.toLowerCase();

  // Explosive items
  if (name.includes('bomb') || name.includes('grenade') || name.includes('explosive')) {
    return 'explosive';
  }

  // Designed throwing weapons
  if (name.includes('javelin') || name.includes('spear') || name.includes('dart') ||
      name.includes('throwing') || name.includes('atlatl') || name.includes('pilum') ||
      name.includes('assegai') || name.includes('boomerang') || name.includes('chakram') ||
      name.includes('shuriken') || name.includes('bolas')) {
    return 'throwing_weapon';
  }

  // Ranged weapons (bows need arrows, but can be thrown as improvised)
  if (name.includes('bow') || name.includes('crossbow') || name.includes('sling') ||
      name.includes('blowgun')) {
    return 'ranged_weapon';
  }

  // Projectiles/ammunition
  if (name.includes('arrow') || name.includes('bolt') || name.includes('bullet') ||
      (name.includes('stone') && category === 'ammunition') ||
      (name.includes('dart') && category === 'ammunition') ||
      item.baseId?.includes('ARROW') || item.baseId?.includes('BOLT') ||
      item.baseId?.includes('DART') || item.baseId?.includes('BULLET')) {
    return 'projectile';
  }

  // Melee weapons that can be thrown
  if (category === 'weapon' && (name.includes('sword') || name.includes('axe') ||
      name.includes('knife') || name.includes('dagger') || name.includes('tomahawk') ||
      name.includes('katana') || name.includes('scimitar') || name.includes('gladius'))) {
    return 'melee_throwable';
  }

  // Everything else is improvised
  return 'improvised';
}

/**
 * Calculate base damage for thrown item based on its properties
 */
export function calculateThrowDamage(
  item: Item,
  thrower: PlayerCharacter,
  target: EncounterableEntity,
  weaponType: ThrowableWeaponType
): number {
  const weight = item.weight || 1;
  const baseAttack = item.attack || 0;
  const throwerStr = thrower.stats?.strength || thrower.strength || 10;
  const throwerDex = thrower.stats?.dexterity || thrower.dexterity || 10;

  let baseDamage = 0;

  switch (weaponType) {
    case 'throwing_weapon':
      // Designed for throwing - use item's attack value + strength bonus
      baseDamage = baseAttack + Math.floor(throwerStr / 3) + Math.floor(weight);
      break;

    case 'melee_throwable':
      // Throwing a sword/axe - less effective than melee but still good
      baseDamage = Math.floor(baseAttack * 0.7) + Math.floor(throwerStr / 4);
      break;

    case 'projectile':
      // Arrows, bolts - designed for ranged combat
      baseDamage = baseAttack + Math.floor(throwerDex / 3);
      break;

    case 'explosive':
      // Bombs - fixed high damage regardless of stats
      baseDamage = item.damage || 20;
      break;

    case 'ranged_weapon':
      // Throwing a bow - very ineffective
      baseDamage = Math.floor(weight / 2) + 1;
      break;

    case 'improvised':
    default:
      // Random items - based on weight and material hardness
      const materialMultiplier = getMaterialHardness(item.material);
      baseDamage = Math.floor(weight * materialMultiplier) + Math.floor(throwerStr / 5);
      break;
  }

  // Apply target armor reduction
  const targetDefense = target.stats?.defense || target.defense || 0;
  return Math.max(1, baseDamage - Math.floor(targetDefense / 2));
}

/**
 * Calculate accuracy for thrown item
 */
export function calculateThrowAccuracy(
  item: Item,
  thrower: PlayerCharacter,
  weaponType: ThrowableWeaponType,
  distance: number = 1
): number {
  const throwerDex = thrower.stats?.dexterity || thrower.dexterity || 10;
  const weight = item.weight || 1;

  let baseAccuracy = 0.65; // Default throwing accuracy

  switch (weaponType) {
    case 'throwing_weapon':
      baseAccuracy = 0.85; // Designed for throwing
      break;
    case 'projectile':
      baseAccuracy = 0.80; // Arrows/bolts are accurate
      break;
    case 'melee_throwable':
      baseAccuracy = 0.60; // Swords aren't balanced for throwing
      break;
    case 'explosive':
      baseAccuracy = 0.70; // Area effect, easier to hit
      break;
    case 'ranged_weapon':
      baseAccuracy = 0.40; // Very poor
      break;
    case 'improvised':
      baseAccuracy = 0.50; // Random items
      break;
  }

  // Dexterity bonus
  const dexBonus = (throwerDex - 10) * 0.02;

  // Weight penalty (very heavy items are much harder to throw accurately)
  let weightPenalty = 0;
  if (weight > 3) {
    weightPenalty = (weight - 3) * 0.1; // Increased penalty
  }
  if (weight > 10) {
    weightPenalty += (weight - 10) * 0.2; // Severe penalty for very heavy items
  }
  if (weight > 20) {
    weightPenalty += (weight - 20) * 0.5; // Extreme penalty for extremely heavy items
  }

  // Distance penalty
  const distancePenalty = (distance - 1) * 0.1;

  return Math.max(0.1, baseAccuracy + dexBonus - weightPenalty - distancePenalty);
}

/**
 * Calculate critical hit chance for thrown item
 */
export function calculateThrowCriticalChance(
  item: Item,
  thrower: PlayerCharacter,
  weaponType: ThrowableWeaponType
): number {
  const throwerDex = thrower.stats?.dexterity || thrower.dexterity || 10;

  let baseCrit = 0.05; // 5% base

  switch (weaponType) {
    case 'throwing_weapon':
      baseCrit = 0.12; // 12% - designed for precision
      break;
    case 'projectile':
      baseCrit = 0.10; // 10% - sharp points
      break;
    case 'melee_throwable':
      baseCrit = 0.08; // 8% - still sharp
      break;
    case 'explosive':
      baseCrit = 0.15; // 15% - devastating explosions
      break;
    case 'improvised':
    case 'ranged_weapon':
      baseCrit = 0.03; // 3% - lucky hits
      break;
  }

  // Dexterity bonus
  const dexBonus = (throwerDex - 10) * 0.005;

  return Math.min(0.25, baseCrit + dexBonus);
}

/**
 * Get material hardness multiplier for damage calculation
 */
function getMaterialHardness(material?: string): number {
  if (!material) return 1.0;

  const hardness: { [key: string]: number } = {
    // Metals (hardest)
    'steel': 1.8,
    'iron': 1.6,
    'bronze': 1.4,
    'copper': 1.2,
    'gold': 1.0,
    'silver': 1.0,
    'lead': 0.8,

    // Stone/Mineral
    'stone': 1.5,
    'flint': 1.7,
    'obsidian': 1.9,
    'diamond': 2.0,
    'emerald': 1.3,
    'jade': 1.3,
    'amber': 0.8,
    'coal': 0.6,

    // Organic Hard
    'bone': 1.2,
    'ivory': 1.3,
    'coral': 1.1,
    'horn': 1.2,

    // Wood/Plant
    'wood': 1.0,
    'bamboo': 1.1,
    'straw': 0.3,

    // Soft Materials
    'leather': 0.5,
    'cloth': 0.2,
    'silk': 0.2,
    'felt': 0.3,
    'paper': 0.1
  };

  return hardness[material.toLowerCase()] || 1.0;
}

/**
 * Get trajectory style for animation
 */
export function getTrajectoryStyle(item: Item, weaponType: ThrowableWeaponType): 'arc' | 'straight' | 'spinning' {
  const weight = item.weight || 1;

  switch (weaponType) {
    case 'projectile':
      return 'straight'; // Arrows fly straight
    case 'throwing_weapon':
      return weight > 2 ? 'arc' : 'straight'; // Heavy spears arc, light darts fly straight
    case 'melee_throwable':
      return 'spinning'; // Spinning axes, tumbling swords
    case 'explosive':
      return 'arc'; // Bombs arc through air
    case 'improvised':
    case 'ranged_weapon':
    default:
      return weight > 1 ? 'arc' : 'spinning'; // Heavy items arc, light items tumble
  }
}

/**
 * Get animation duration based on weapon type and weight
 */
export function getAnimationDuration(item: Item, weaponType: ThrowableWeaponType): number {
  const weight = item.weight || 1;

  switch (weaponType) {
    case 'projectile':
      return 800; // Fast arrows/bolts
    case 'throwing_weapon':
      return 1200; // Medium speed for designed weapons
    case 'explosive':
      return 1500; // Slower arc for bombs
    case 'melee_throwable':
      return 1800; // Slow tumbling weapons
    case 'improvised':
    case 'ranged_weapon':
    default:
      // Scale with weight - heavier = slower
      return Math.min(2500, 1000 + (weight * 200));
  }
}

/**
 * Generate flavor text for throwing action
 */
export function getThrowFlavorText(item: Item, weaponType: ThrowableWeaponType, hit: boolean, critical: boolean): string {
  const name = item.name;

  if (critical) {
    switch (weaponType) {
      case 'throwing_weapon':
        return `The ${name} strikes with perfect precision!`;
      case 'projectile':
        return `The ${name} finds its mark flawlessly!`;
      case 'explosive':
        return `The ${name} explodes with devastating force!`;
      case 'melee_throwable':
        return `The spinning ${name} strikes a vital point!`;
      default:
        return `The ${name} hits with surprising effectiveness!`;
    }
  }

  if (!hit) {
    switch (weaponType) {
      case 'ranged_weapon':
        return `The ${name} tumbles awkwardly through the air and misses.`;
      case 'improvised':
        return `The ${name} flies wide of its target.`;
      default:
        return `The ${name} misses its mark.`;
    }
  }

  // Regular hits
  switch (weaponType) {
    case 'throwing_weapon':
      return `The ${name} strikes true!`;
    case 'projectile':
      return `The ${name} pierces the target!`;
    case 'explosive':
      return `The ${name} explodes on impact!`;
    case 'melee_throwable':
      return `The ${name} tumbles through the air and connects!`;
    case 'improvised':
      return `The ${name} strikes the target!`;
    default:
      return `The ${name} hits!`;
  }
}

/**
 * Main function to calculate complete throw result
 */
export function calculateThrowResult(
  item: Item,
  thrower: PlayerCharacter,
  target: EncounterableEntity,
  distance: number = 1
): ThrowResult {
  const weaponType = getThrowableWeaponType(item);
  const damage = calculateThrowDamage(item, thrower, target, weaponType);
  const accuracy = calculateThrowAccuracy(item, thrower, weaponType, distance);
  const criticalChance = calculateThrowCriticalChance(item, thrower, weaponType);

  const hit = Math.random() < accuracy;
  const critical = hit && Math.random() < criticalChance;

  const finalDamage = hit ? (critical ? Math.floor(damage * 1.5) : damage) : 0;

  return {
    damage: finalDamage,
    accuracy,
    criticalChance,
    physicsMultiplier: getMaterialHardness(item.material),
    weaponType,
    flavorText: getThrowFlavorText(item, weaponType, hit, critical),
    animationDuration: getAnimationDuration(item, weaponType),
    trajectoryStyle: getTrajectoryStyle(item, weaponType)
  };
}

/**
 * Check if an item can be thrown (everything can be thrown, but effectiveness varies)
 */
export function canThrowEffectively(item: Item): boolean {
  // Everything can be thrown now - this function determines if it's worth trying
  // Very heavy items will have extremely low accuracy but can still be attempted
  return true;
}

/**
 * Check if an item is a ranged weapon that enables ranged attack mode
 */
export function isRangedWeapon(item: Item): boolean {
  const weaponType = getThrowableWeaponType(item);
  return weaponType === 'ranged_weapon';
}

/**
 * Get list of equipped throwable weapons for quick access
 */
export function getEquippedThrowableWeapons(character: PlayerCharacter): Item[] {
  const throwables: Item[] = [];

  // Check equipped items
  if (character.equippedItems?.main_hand?.throwable) {
    throwables.push(character.equippedItems.main_hand);
  }

  if (character.equippedItems?.off_hand?.throwable) {
    throwables.push(character.equippedItems.off_hand);
  }

  // Check inventory for throwing weapons and projectiles
  const inventoryThrowables = character.inventory?.filter(item =>
    item.throwable && canThrowEffectively(item) &&
    ['throwing_weapon', 'projectile'].includes(getThrowableWeaponType(item))
  ) || [];

  throwables.push(...inventoryThrowables);

  return throwables;
}