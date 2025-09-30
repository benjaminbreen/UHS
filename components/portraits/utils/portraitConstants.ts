/**
 * Constants and type definitions for procedural portraits
 */

// Age group classifications
export type AgeGroup = 'young' | 'adult' | 'old';

// Expression types
export type ExpressionType =
  | 'smile'
  | 'approve'
  | 'scowl'
  | 'sad'
  | 'smirk'
  | 'concern'
  | 'excited'
  | 'annoyed'
  | 'tired'
  | 'confused'
  | 'thinking'
  | 'skeptical'
  | 'determined'
  | null;

// Seeded random number generator
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Create seeded rand function
export const createRandFunction = (baseSeed: number) => {
  return (offset: number) => seededRandom(baseSeed + offset);
};

// Determine age group from age
export const getAgeGroup = (age?: number): AgeGroup => {
  if (!age || age < 16) return 'young';
  if (age > 50) return 'old';
  return 'adult';
};

// Check if character has gray hair based on age
export const hasGrayHair = (age?: number): boolean => {
  if (!age) return false;
  if (age > 60) return true;
  if (age > 45) return Math.random() > 0.7; // 30% chance
  return false;
};

// Wealth status determination
export const isWealthy = (character: any): boolean => {
  return character.wealth === 'wealthy' || character.wealth === 'noble';
};

// Gender checks
export const isFemale = (gender: string): boolean => {
  return gender === 'female' || gender === 'Female';
};

// Common dimension calculations
export const calculateHeadDimensions = (
  isFemale: boolean,
  stats: { strength: number },
  faceShape?: string
) => {
  const baseHeadWidth = isFemale ? 22 : 26;
  let strengthMod = 1;

  if (stats.strength >= 9) strengthMod = 1.25;
  else if (stats.strength >= 7) strengthMod = 1.15;
  else if (stats.strength <= 2) strengthMod = 0.85;
  else if (stats.strength <= 4) strengthMod = 0.95;

  const headWidth = Math.round(baseHeadWidth * strengthMod);

  // Adjust height based on face shape
  let headHeight = isFemale ? 24 : 28;
  if (faceShape === 'long') headHeight += 4;
  else if (faceShape === 'round') headHeight -= 2;

  return { width: headWidth, height: headHeight };
};

// Default appearance values
export const DEFAULT_APPEARANCE = {
  skinTone: 'medium',
  hairColor: 'brown',
  eyeColor: 'brown',
  hairstyle: 'short',
  hairLength: 'short',
  hairTexture: 'straight',
  faceShape: 'oval',
  eyeShape: 'almond',
  noseShape: 'straight',
  jawline: 'soft',
  build: 'average',
  facialHair: false,
  facialHairStyle: 'none',
  facialHairThickness: 'medium',
  lipShape: 'medium',
  eyebrowShape: 'straight',
  eyebrowThickness: 'medium',
  cheekbones: 'average'
} as const;

// Expression family checks
export const isSmileFamily = (expr: ExpressionType): boolean => {
  return expr === 'smile' || expr === 'approve' || expr === 'smirk';
};

export const isScowlFamily = (expr: ExpressionType): boolean => {
  return expr === 'scowl' || expr === 'annoyed';
};

export const isSadFamily = (expr: ExpressionType): boolean => {
  return expr === 'sad' || expr === 'concern';
};

// Material colors for clothing and accessories
export const MATERIAL_COLORS = {
  // Metals
  iron: '#8C7853',
  steel: '#71797E',
  bronze: '#CD7F32',
  copper: '#B87333',
  silver: '#C0C0C0',
  gold: '#FFD700',

  // Fabrics
  linen: '#F5F5DC',
  cotton: '#FFFDD0',
  wool: '#F0F8FF',
  silk: '#FFF8DC',
  leather: '#8B4513',
  fur: '#D2B48C',

  // Colors
  red: '#DC143C',
  blue: '#4169E1',
  green: '#228B22',
  yellow: '#FFD700',
  purple: '#8A2BE2',
  orange: '#FF8C00',
  brown: '#8B4513',
  black: '#2F2F2F',
  white: '#F5F5F5',
  gray: '#808080'
} as const;