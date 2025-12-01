/**
 * Color utility functions for procedural portraits
 * Extracted from ProceduralPortrait.tsx for better organization
 */

// RGB color type for calculations
type RGB = { r: number; g: number; b: number };

// Clamp values to valid RGB range
const clamp = (val: number) => Math.max(0, Math.min(255, val));

// Convert RGB object to CSS rgb string
export const rgbStr = ({ r, g, b }: RGB) => `rgb(${clamp(Math.round(r))}, ${clamp(Math.round(g))}, ${clamp(Math.round(b))})`;

// Parse color string to RGB - supports both hex (#RRGGBB) and rgb() formats
export const toRGB = (color: string): RGB => {
  if (!color) return { r: 0, g: 0, b: 0 };

  // Handle hex colors (#RGB or #RRGGBB)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      // Short form #RGB -> #RRGGBB
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
  }

  // Handle rgb() format
  const m = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };

  return { r: 0, g: 0, b: 0 };
};

// Create shadow by darkening a color
export const createShadow = (color: string, amount = 0.8): string => {
  const { r, g, b } = toRGB(color);
  return rgbStr({ r: r * amount, g: g * amount, b: b * amount });
};

// Create highlight by lightening a color (blend toward white to preserve hue)
export const createHighlight = (color: string, amount = 1.2): string => {
  const { r, g, b } = toRGB(color);
  // Blend toward white instead of just multiplying (prevents hue shift on saturated colors)
  const blendAmount = Math.min(1, (amount - 1) * 2);
  return rgbStr({
    r: r + (255 - r) * blendAmount * 0.5,
    g: g + (255 - g) * blendAmount * 0.5,
    b: b + (255 - b) * blendAmount * 0.5
  });
};

// Create complementary shadow with slight warm shift
export const createComplementaryShadow = (color: string, amount = 0.7): string => {
  const { r, g, b } = toRGB(color);
  // Darken with very subtle warm shift (reduce blue slightly more than red)
  return rgbStr({
    r: r * amount,
    g: g * amount * 0.97,
    b: b * amount * 0.94
  });
};

// Base skin tone colors
export const SKIN_TONE_COLORS: Record<string, string> = {
  very_pale: 'rgb(255, 228, 225)',
  pale: 'rgb(245, 218, 215)',
  fair: 'rgb(235, 208, 205)',
  light: 'rgb(225, 198, 195)',
  medium: 'rgb(215, 188, 185)',
  olive: 'rgb(205, 178, 165)',
  tan: 'rgb(195, 168, 155)',
  dark: 'rgb(185, 158, 145)',
  very_dark: 'rgb(175, 148, 135)'
};

// Get skin color variations for a base tone
export const getSkinColors = (baseTone: string) => {
  const skinTone = SKIN_TONE_COLORS[baseTone] || SKIN_TONE_COLORS.medium;
  return {
    base: skinTone,
    highlight: createHighlight(skinTone, 1.15),
    brightHighlight: createHighlight(skinTone, 1.25),
    midtone: createShadow(skinTone, 0.95),
    shadow: createShadow(skinTone, 0.85),
    deepShadow: createShadow(skinTone, 0.7)
  };
};

// Hair color mapping
export const HAIR_COLORS: Record<string, string> = {
  black: 'rgb(40, 32, 30)',
  brown: 'rgb(101, 67, 33)',
  blonde: 'rgb(218, 165, 32)',
  red: 'rgb(165, 42, 42)',
  gray: 'rgb(128, 128, 128)',
  white: 'rgb(245, 245, 245)',
  auburn: 'rgb(139, 69, 19)',
  chestnut: 'rgb(149, 69, 53)',
  strawberry_blonde: 'rgb(238, 203, 173)',
  dirty_blonde: 'rgb(181, 151, 96)',
  light_brown: 'rgb(139, 118, 76)',
  dark_brown: 'rgb(62, 39, 35)',
  platinum_blonde: 'rgb(253, 245, 230)',
  ash_blonde: 'rgb(177, 166, 132)',
  golden_brown: 'rgb(153, 101, 21)',
  mahogany: 'rgb(192, 64, 0)',
  copper: 'rgb(184, 115, 51)',
  silver: 'rgb(192, 192, 192)'
};

// Eye color mapping
export const EYE_COLORS: Record<string, string> = {
  brown: 'rgb(101, 67, 33)',
  blue: 'rgb(70, 130, 180)',
  green: 'rgb(34, 139, 34)',
  hazel: 'rgb(139, 118, 76)',
  gray: 'rgb(112, 128, 144)',
  amber: 'rgb(255, 191, 0)',
  violet: 'rgb(138, 43, 226)',
  black: 'rgb(36, 36, 36)'
};

// Lip color mapping by skin tone
export const LIP_COLORS: Record<string, string> = {
  very_pale: '#E8B4B8',
  pale: '#E0A5A8',
  fair: '#D89598',
  light: '#CE8588',
  medium: '#C47578',
  olive: '#BA6568',
  tan: '#B05558',
  dark: '#A64548',
  very_dark: '#9C3538'
};

// Get appropriate hair color
export const getHairColor = (hairColor: string, hasGrayHair: boolean): string => {
  if (hasGrayHair) return 'rgb(192,192,192)';
  return HAIR_COLORS[hairColor] || HAIR_COLORS.brown;
};

// Get eye color
export const getEyeColor = (eyeColor: string): string => {
  return EYE_COLORS[eyeColor] || EYE_COLORS.brown;
};

// Get lip color
export const getLipColor = (skinTone: string): string => {
  return LIP_COLORS[skinTone] || LIP_COLORS.medium;
};