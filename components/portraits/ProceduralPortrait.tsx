import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  bayer4, seededRng, mix, plotPixel,
  skinRamp, hairRamp, outlineColor,
  renderFaceMicroShades, renderStubble,
  renderEnhancedEyes, renderHairHighlightAndFuzz,
  aaConcaveCorners, renderGlassesShine, renderEarring
} from './portraitUtils';
import { calculateDiseaseGameplayRestrictions } from '../../services/diseaseProgressionService';
import { HeadgearRenderer } from './renderers/HeadgearRenderer';

interface ProceduralPortraitProps {
  character: {
    age?: number;
    gender: 'Male' | 'Female' | 'Non-binary';
    health?: number;
    maxHealth?: number;
    fatigue?: number;
    maxFatigue?: number;
    diseaseHealth?: {
      currentDiseases?: Array<{
        disease: { name: string };
      }>;
    };
    stats: {
      strength: number;
      intelligence: number;
      charisma: number;
      constitution: number;
    };
    equippedItems?: {
      head?: { name: string; material?: string; color?: string };
      torso?: { name: string; material?: string; color?: string };
      cloak?: { name: string; material?: string; color?: string };
      necklace?: { name: string; material?: string; color?: string };
      [key: string]: any;
    };
    appearance: {
      // Base features
      skinColor: string;
      hairColor: string;
      eyeColor: string;
      hairstyle: string;
      build: 'slight' | 'average' | 'stocky' | 'heavy' | 'athletic' | 'tall' | 'short' | 'imposing';

      // Facial characteristics
      faceShape?: 'oval' | 'round' | 'square' | 'long' | 'heart' | 'diamond';
      eyeShape?: 'almond' | 'round' | 'narrow' | 'wide' | 'hooded';
      noseShape?: 'straight' | 'aquiline' | 'broad' | 'button' | 'roman';
      cheekbones?: 'high' | 'average' | 'low';
      jawline?: 'sharp' | 'soft' | 'square' | 'round' | 'oval';

      // Hair details
      hairTexture?: 'straight' | 'wavy' | 'curly' | 'coily' | 'kinky';
      hairLength?: 'bald' | 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
      facialHair: boolean;
      facialHairStyle?: 'full_beard' | 'goatee' | 'mustache' | 'stubble' | 'van_dyke' | 'soul_patch' | 'mutton_chops' | 'imperial' | 'handlebar' | 'forked_beard' | 'chin_curtain' | 'verdi';
      facialHairThickness?: 'sparse' | 'medium' | 'thick';

      // Skin details
      skinTone?: 'very_pale' | 'pale' | 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'dark' | 'very_dark';
      skinTexture?: 'smooth' | 'rough' | 'weathered' | 'scarred' | 'freckled';

      // Eye details
      eyebrowShape?: 'straight' | 'arched' | 'rounded' | 'angular';
      eyebrowThickness?: 'thin' | 'medium' | 'thick' | 'bushy';
      eyelashes?: 'short' | 'medium' | 'long';

      // Lip details
      lipShape?: 'thin' | 'medium' | 'full' | 'bow' | 'wide';
      lipColor?: string;

      // Clothing
      garment: { name: string; material: string };
      headgear: { name: string; material: string };
      palette: {
        primary: string;
        secondary: string;
        accent: string;
      };

      // Optional features
      hasGlasses?: boolean;
      glassesStyle?: 'round' | 'square' | 'oval' | 'half_rim';
      jewelry?: Array<{
        type: 'necklace' | 'earrings' | 'bracelet' | 'ring' | 'circlet' | 'brooch' | 'chain' | 'anklet';
        material: 'gold' | 'silver' | 'bronze' | 'gems' | 'pearl' | 'bone' | 'wood';
        style: 'simple' | 'ornate' | 'delicate' | 'chunky';
        gems?: string[];
      }>;
      markings?: Array<{
        type: 'scar' | 'tattoo' | 'paint' | 'beauty_mark' | 'freckles' | 'mole' | 'birthmark';
        location: string;
        color: string;
        size: 'small' | 'medium' | 'large';
        pattern?: string;
      }>;
      // Some builds used height in the original body calc (keep permissive)
      // @ts-ignore
      height?: number;
    };
    wealthLevel: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
    class?: string;
    era: string;
    culturalZone?: 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';
    ethnicCulturalZone?: 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';
    portraitSeed?: number;
  };
  size?: number;
  className?: string;

  /** NEW: expanded expression set */
  temporaryExpression?:
    | 'smile'
    | 'surprise'
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

  onExpressionComplete?: () => void;
  useEquippedItems?: boolean;
}

type AgeGroup = 'young' | 'adult' | 'old';

const ProceduralPortrait: React.FC<ProceduralPortraitProps> = ({
  character,
  size = 192,
  className = '',
  temporaryExpression = null,
  onExpressionComplete,
  useEquippedItems = true
}) => {
  // ---------- Seeded RNG ----------
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const generateDefaultSeed = () => {
    if (character.portraitSeed !== undefined && character.portraitSeed !== null) {
      return character.portraitSeed;
    }
    let seedString = '';
    seedString += character.age ?? 30;
    seedString += character.gender ?? 'Male';
    seedString += character.stats?.strength ?? 5;
    seedString += character.stats?.intelligence ?? 5;
    seedString += character.appearance?.skinColor ?? '#f4d1ae';
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const c = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + c;
      hash |= 0;
    }
    return Math.abs(hash) || 12345;
  };

  const seed = generateDefaultSeed();
  const rand = (offset: number = 0) => seededRandom(seed + offset);
  const uniqueId = useMemo(() => 'pp-' + seed.toString(36), [seed]);

  // ---------- Extracted Character Data ----------
  const { age = 30, gender, stats = {}, appearance = {}, wealthLevel, era } = character;

  // Use ethnicCulturalZone if available, otherwise fall back to geographic culturalZone
  const culturalZone = (character as any).ethnicCulturalZone || character.culturalZone || 'EUROPEAN';

  // Provide defaults for appearance properties
  const defaultAppearance = {
    skinColor: '#f4d1ae',
    hairColor: '#8B4513',
    eyeColor: '#5D4E37',
    hairstyle: 'short',
    build: 'average' as const,
    facialHair: false,
    garment: { name: 'simple tunic', material: 'linen' },
    headgear: { name: 'none', material: 'none' },
    palette: {
      primary: '#8B7355',
      secondary: '#A0826D',
      accent: '#D2691E'
    },
    hairLength: 'medium' as const,
    faceShape: 'oval' as const,
    ...appearance
  };

  const appearanceWithDefaults = defaultAppearance;

  const headgearName =
  (
    useEquippedItems
      ? character.equippedItems?.head?.name
      : appearanceWithDefaults.headgear?.name
  ) || 'none';

  // Utility function to get item color from equipped items
  const getItemColor = (item: any): string => {
    if (!item?.color) return appearanceWithDefaults.palette.primary;

    // Handle both hex colors and color names
    if (item.color.startsWith('#')) {
      return item.color;
    }

    // Convert color names to hex
    const colorMap: Record<string, string> = {
      'Navy': '#001f3f',
      'Blue': '#4169e1',
      'Crimson': '#dc143c',
      'Green': '#228b22',
      'Gold': '#ffd700',
      'Purple': '#800080',
      'Black': '#1a1a1a',
      'White': '#f8f8f8',
      'Gray': '#808080',
      'Grey': '#808080',
      'Silver': '#c0c0c0',
      'Bronze': '#cd7f32',
      'Copper': '#b87333',
      'Brown': '#8b4513',
      'Tan': '#d2b48c',
      'Orange': '#ff8c00',
      'Pink': '#ffc0cb',
      'Red': '#dc143c',
      'Yellow': '#ffd700',
      'Burgundy': '#800020',
      'Forest Green': '#228b22',
      'Teal': '#008080',
      'Cyan': '#00ffff',
      'Turquoise': '#40e0d0',
      'Wheat': '#f5deb3',
      'Beige': '#f5f5dc'
    };

    return colorMap[item.color] || appearanceWithDefaults.palette.primary;
  };

  // Parse hairstyle name to get length, style, and texture
const parseHairstyle = (
  hairstyle: string
): {
  length: NonNullable<typeof appearanceWithDefaults.hairLength>;
  style: string;
  texture?: NonNullable<typeof appearanceWithDefaults.hairTexture>;
} => {
  const raw = (hairstyle || '').toLowerCase().trim();

  // fast exits
  if (!raw || raw === 'none') return { length: 'medium', style: 'simple' };
  if (raw.includes('bald')) return { length: 'bald', style: 'none' };

  // detect texture words anywhere
  const hasCurly  = /\bcurly|ringlet|perm(ed)?\b/.test(raw);
  const hasWavy   = /\bwavy|waves\b/.test(raw);
  const hasCoily  = /\bcoily\b/.test(raw);
  const hasKinky  = /\bkinky\b/.test(raw);
  const hasStraight = /\bstraight\b/.test(raw);

  // resolve texture (respect explicit appearance.hairTexture fallback)
  let texture: NonNullable<typeof appearanceWithDefaults.hairTexture> | undefined =
    (hasCurly && 'curly') ||
    (hasWavy && 'wavy') ||
    (hasCoily && 'coily') ||
    (hasKinky && 'kinky') ||
    (hasStraight && 'straight') ||
    appearanceWithDefaults.hairTexture ||
    'straight';

  // resolve length from text, else from appearance, else medium
  let length: NonNullable<typeof appearanceWithDefaults.hairLength> =
    (/\bvery\s*short\b/.test(raw) && 'very_short') ||
    (/\bvery\s*long\b/.test(raw) && 'very_long') ||
    (/\blong\b/.test(raw) && 'long') ||
    (/\bmedium|shoulder\b/.test(raw) && 'medium') ||
    (/\bshort\b/.test(raw) && 'short') ||
    appearanceWithDefaults.hairLength ||
    'medium';

  // choose a style the renderer knows how to paint a scalp for
  // (use flowing for medium/long by default; simple for short)
  let style = 'simple';
  if (/\bafro\b/.test(raw)) style = 'afro';
  else if (/\bloc(s|ks)?\b|dread/.test(raw)) { style = 'locs'; texture = 'coily'; }
  else if (/\bbraid(ed|s)?\b/.test(raw)) style = 'braided';
  else if (/\bbun\b/.test(raw)) style = 'bun';
  else if (/\bponytail\b/.test(raw)) style = 'ponytail';
  else if (/\btopknot\b|warrior_knot/.test(raw)) style = 'topknot';
  else if (/\bmohawk\b/.test(raw)) style = 'mohawk';
  else if (/\bpage(boy| cut)\b/.test(raw)) style = 'pageboy';
  else if (/\bbowl\b/.test(raw)) style = 'bowl_cut';
  else if (/\brenaissance_rolls\b/.test(raw)) style = 'renaissance_rolls';
  else if (/\bbraided[_ ]crown\b/.test(raw)) style = 'braided_crown';
  else if (/\bbraided[_ ]bun\b/.test(raw)) style = 'braided_bun';
  else {
    // generic fallback: make long/very_long “flowing”; short “simple”
    style = (length === 'long' || length === 'very_long' || length === 'medium') ? 'flowing' : 'simple';
    // if text mentions “curly/wavy/...”, keep that texture but still use a style we paint
  }

  return { length, style, texture };
};


  const parsedHair = parseHairstyle(appearanceWithDefaults.hairstyle);
  const hairLength = parsedHair.length;
  const hairStyle = parsedHair.style;
  const hairTexture = parsedHair.texture || appearanceWithDefaults.hairTexture || 'straight';

  const isFemale = gender === 'Female';
  const isWealthy = wealthLevel === 'wealthy' || wealthLevel === 'noble';
  const isNoble = wealthLevel === 'noble';

  const getAgeGroup = (): AgeGroup => (age >= 60 ? 'old' : age >= 25 ? 'adult' : 'young');
  const ageGroup = getAgeGroup();
  const isYoung = ageGroup === 'young';
  const isOld = ageGroup === 'old';
  const hasWrinkles = isOld && rand(200) > 0.2;
  const hasGrayHair = isOld && rand(201) > 0.3;
  const hasAgeSpots = isOld && rand(202) > 0.5;

  // ---------- Color Utilities ----------
  type RGB = { r: number; g: number; b: number };
  const clamp = (n: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, n));
  const toRGB = (color: string): RGB => {
    if (!color) return { r: 0, g: 0, b: 0 };
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    const m = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    return { r: 0, g: 0, b: 0 };
  };
  const rgbStr = ({ r, g, b }: RGB) => `rgb(${clamp(Math.round(r))}, ${clamp(Math.round(g))}, ${clamp(Math.round(b))})`;
  const createShadow = (color: string, amount = 0.8): string => {
    const { r, g, b } = toRGB(color);
    return rgbStr({ r: r * amount, g: g * amount, b: b * amount });
  };
  const createHighlight = (color: string, amount = 1.2): string => {
    const { r, g, b } = toRGB(color);
    return rgbStr({ r: r * amount, g: g * amount, b: b * amount });
  };
  const createComplementaryShadow = (color: string, amount = 0.7): string => {
    const { r, g, b } = toRGB(color);
    return rgbStr({ r: r * amount * 0.85, g: g * amount * 0.9, b: Math.min(255, b * amount + 25) });
  };
  const createSubsurfaceScattering = (color: string, intensity = 0.3): string => {
    const { r, g, b } = toRGB(color);
    return rgbStr({
      r: r + (255 - r) * intensity * 0.8,
      g: g + (255 - g) * intensity * 0.6,
      b: b + (255 - b) * intensity * 0.4
    });
  };
  const getColorTemperature = (color: string): 'warm' | 'cool' | 'neutral' => {
    const { r, b } = toRGB(color);
    const warmth = (r - b) / 255;
    if (warmth > 0.1) return 'warm';
    if (warmth < -0.1) return 'cool';
    return 'neutral';
  };

  // Performance optimization: Batch adjacent pixels of same color
  const batchPixels = (pixels: Array<{x: number, y: number, color: string}>) => {
    const batches: Array<{x: number, y: number, width: number, height: number, color: string}> = [];
    const processed = new Set<string>();

    for (const pixel of pixels) {
      const key = `${pixel.x},${pixel.y}`;
      if (processed.has(key)) continue;

      // Find horizontal run of same color
      let width = 1;
      while (pixels.find(p => p.x === pixel.x + width && p.y === pixel.y && p.color === pixel.color)) {
        processed.add(`${pixel.x + width},${pixel.y}`);
        width++;
      }

      batches.push({x: pixel.x, y: pixel.y, width, height: 1, color: pixel.color});
      processed.add(key);
    }

    return batches;
  };

  // Color ramps are now imported from portraitUtils

  // ---------- Head Geometry ----------
  const headDim = useMemo(() => {
    const faceShape = appearanceWithDefaults.faceShape || 'oval';
    let width = isFemale ? 21 : 25;  // Slightly increased base width from 20/24 to 21/25
    let height = isFemale ? 34 : 36;  // Increased from 28/30 to 34/36 for better proportions

    if (isYoung) { width += 2; height -= 1; }
    if (isOld)   { height += 3; width -= 1; }

    if (stats.strength >= 8) width += isFemale ? 1 : 3;
    else if (stats.strength <= 3) width -= isFemale ? 0 : 2;

    if (appearanceWithDefaults.build === 'imposing') width += 2;
    if (appearanceWithDefaults.build === 'slight') width -= 2;
    if (appearanceWithDefaults.build === 'average') width -= 1;  // Additional reduction for average build

    if (hairLength === 'bald') height += 4;
    if (hairLength === 'very_short') height += 2;

    switch (faceShape) {
      case 'round':  width += 2; height -= 2; break;
      case 'square': if (!isFemale) width += 1; break;
      case 'long':   width += 2; height += 3; break;  // Changed from -1 to +2 to widen long faces
      case 'heart':  width += 1; break;  // Added width for heart faces
      case 'diamond': width += 1; break;  // Added width for diamond faces
    }
    return { width, height, shape: faceShape as NonNullable<typeof appearanceWithDefaults.faceShape> };
  }, [appearanceWithDefaults.build, appearanceWithDefaults.faceShape, hairLength, isFemale, isOld, isYoung, stats.strength]);

  const headX = 32 - (headDim.width / 2);
  const headY = 10;

  // ---------- Disease Analysis & Visual Effects ----------
  const diseaseRestrictions = calculateDiseaseGameplayRestrictions(character.diseaseHealth);
  const currentDiseases = character.diseaseHealth?.currentDiseases || [];

  // Get specific disease effects
  const diseaseEffects = useMemo(() => {
    const effects = {
      hasSmallpox: false,
      hasPlague: false,
      hasTuberculosis: false,
      hasCholera: false,
      hasLeprosy: false,
      hasRabies: false,
      hasSyphilis: false,
      hasMeasles: false,
      hasFever: false,  // Generic fever/infection
      severity: diseaseRestrictions.socialAvoidanceLevel,
      symptomDescription: diseaseRestrictions.symptomDescription
    };

    currentDiseases.forEach(activeDisease => {
      const diseaseId = activeDisease.disease.name?.toLowerCase() || '';
      if (diseaseId.includes('smallpox')) effects.hasSmallpox = true;
      if (diseaseId.includes('plague')) effects.hasPlague = true;
      if (diseaseId.includes('tuberculosis') || diseaseId.includes('consumption')) effects.hasTuberculosis = true;
      if (diseaseId.includes('cholera')) effects.hasCholera = true;
      if (diseaseId.includes('leprosy')) effects.hasLeprosy = true;
      if (diseaseId.includes('rabies')) effects.hasRabies = true;
      if (diseaseId.includes('syphilis')) effects.hasSyphilis = true;
      if (diseaseId.includes('measles')) effects.hasMeasles = true;

      // Check for fever-causing diseases
      if (diseaseId.includes('fever') || diseaseId.includes('influenza') ||
          diseaseId.includes('typhoid') || diseaseId.includes('malaria') ||
          diseaseId.includes('pneumonia') || diseaseId.includes('infection')) {
        effects.hasFever = true;
      }
    });

    return effects;
  }, [currentDiseases, diseaseRestrictions]);

  // ---------- Skin/Hair Palette with Disease Effects ----------
  const isSick =
    (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
    (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

  let actualSkinTone = appearanceWithDefaults.skinColor;
  if (isSick) {
    const r = parseInt(actualSkinTone.slice(1, 3), 16);
    const g = parseInt(actualSkinTone.slice(3, 5), 16);
    const b = parseInt(actualSkinTone.slice(5, 7), 16);

    let sickR = r, sickG = g, sickB = b;

    // Disease-specific skin changes
    if (diseaseEffects.hasTuberculosis) {
      // Pale, gaunt appearance
      sickR = Math.max(0, r - 25);
      sickG = Math.max(0, g - 20);
      sickB = Math.max(0, b - 15);
    } else if (diseaseEffects.hasCholera) {
      // Sunken, dehydrated look - grayish
      sickR = Math.max(0, r - 30);
      sickG = Math.max(0, g - 25);
      sickB = Math.max(0, b - 20);
    } else if (diseaseEffects.hasPlague) {
      // Darkened, blackened appearance
      sickR = Math.max(0, r - 40);
      sickG = Math.max(0, g - 35);
      sickB = Math.max(0, b - 30);
    } else if (diseaseEffects.hasLeprosy) {
      // Patchy, discolored skin
      sickR = Math.max(0, r - 20);
      sickG = Math.max(0, g - 15);
      sickB = Math.max(0, b - 25);
    } else if (diseaseEffects.hasFever || diseaseEffects.hasSmallpox || diseaseEffects.hasMeasles || diseaseEffects.hasSyphilis) {
      // Fever/infection: paler skin (not greenish!)
      sickR = Math.min(255, r + 10);  // Slightly paler
      sickG = Math.min(255, g + 5);   // Less green shift
      sickB = Math.min(255, b + 8);   // Slightly paler
    } else {
      // Generic illness - slight pallor
      sickR = Math.min(255, r + 5);
      sickG = g;
      sickB = Math.min(255, b + 5);
    }

    actualSkinTone = `#${sickR.toString(16).padStart(2, '0')}${sickG.toString(16).padStart(2, '0')}${sickB.toString(16).padStart(2, '0')}`;
  }

  const skinTone = actualSkinTone;
  const skinToneType = appearanceWithDefaults.skinTone || 'medium';
  const skinTemperature = getColorTemperature(skinTone);

  const skinShadow = createComplementaryShadow(skinTone);
  const skinDeepShadow = createComplementaryShadow(skinTone, 0.5);
  const skinHighlight = createHighlight(skinTone, 1.15);
  const skinBrightHighlight = createHighlight(skinTone, 1.3);
  const skinMidtone = createShadow(skinTone, 0.95);
  const skinSubsurface = createSubsurfaceScattering(skinTone);
  const outlineColor = createShadow(skinTone, 0.45);

  const baseHair = hasGrayHair ? 'rgb(192,192,192)' : appearanceWithDefaults.hairColor;
  const hairShadow = createComplementaryShadow(baseHair, 0.6);
  const hairDeepShadow = createComplementaryShadow(baseHair, 0.4);
  const hairHighlight = createHighlight(baseHair, 1.5);
  const hairBrightHighlight = createHighlight(baseHair, 1.8);

    // ---------- Expression Core ----------
  // initial gaze (seeded)
  const initialGazeRoll = rand(51);
  const initialGazeDirection: 0 | 1 | 2 = initialGazeRoll > 0.95 ? 2 : initialGazeRoll > 0.9 ? 0 : 1;
  const [gazeDirection, setGazeDirection] = useState<0 | 1 | 2>(initialGazeDirection);

  // Base mood from stats (kept)
  let baseExpressionType = Math.floor(rand(52) * 5);
  let microExpression = Math.floor(rand(53) * 3);
  if (stats.charisma >= 8) { baseExpressionType = 1; microExpression = 1; }
  else if (stats.charisma <= 2) { baseExpressionType = 3; microExpression = 2; }
  else if (stats.intelligence >= 8) { baseExpressionType = 4; microExpression = 0; }

  // Numeric map used by mouth renderer:
  // 0: neutral, 1: smile (family), 2: frown (family), 3: neutral-ish, 4: pursed/concern
  let expressionType = baseExpressionType;

  // Convenience flags (used by eyes/brows/mouth)
  const expr = temporaryExpression;
  const exprIsSmirk = expr === 'smirk';
  const exprIsApprove = expr === 'approve';
  const exprIsSurprised = expr === 'surprise';
  const exprIsScowl = expr === 'scowl';
  const exprIsSad = expr === 'sad';
  const exprIsConcern = expr === 'concern';
  const exprIsSmileFamily = expr === 'smile' || exprIsApprove || exprIsSmirk;
  const exprIsSkeptical = expr === 'skeptical';
  const exprIsConfused = expr === 'confused';
  const exprIsThinking = expr === 'thinking';
  const exprIsAnnoyed = expr === 'annoyed';
  const exprIsDetermined = expr === 'determined';
  const exprIsTired = expr === 'tired';
  const exprIsExcited = expr === 'excited';

  if (expr) {
    switch (expr) {
      case 'smile':
      case 'approve':
      case 'smirk':
      case 'excited':
        expressionType = 1; // smile family
        break;
      case 'scowl':
      case 'sad':
      case 'annoyed':
      case 'tired':
        expressionType = 2; // frown family
        break;
      case 'concern':
      case 'confused':
      case 'thinking':
        expressionType = 4; // pursed/concern
        break;
      case 'surprise':
        expressionType = 0; // eyes widen; mouth neutral (handled in eyes)
        break;
      case 'skeptical':
      case 'determined':
        expressionType = 3; // neutral-ish with specific brow
        break;
    }
  }

  // Temporary expression timer (unchanged)
  useEffect(() => {
    if (temporaryExpression && onExpressionComplete) {
      const timer = setTimeout(() => onExpressionComplete(), 2000);
      return () => clearTimeout(timer);
    }
  }, [temporaryExpression, onExpressionComplete]);


  // ---------- Blink / Gaze Animation (unchanged) ----------
  const [blinkProgress, setBlinkProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const nextBlinkTimeout = useRef<number | null>(null);
  const nextGazeTimeout = useRef<number | null>(null);

  const jitter = (min: number, max: number) =>
    min + (max - min) * (0.5 + (Math.sin(seed * 13.37 + (performance.now?.() || 0) / 1e4) * 0.5));

  useEffect(() => {
    const pickBlinkDelay = () => {
      const r = rand(Math.floor((performance.now?.() || 0)) % 10007);
      const base = 7000 + r * 11000;
      return (r > 0.875) ? base + 20000 * r : base + jitter(-500, 500);
    };

    let closing = true;
    let start = 0;
    const duration = 120 + Math.floor(80 * rand(777));

    const step = (t: number) => {
      if (!start) start = t;
      const elapsed = t - start;
      let p = Math.min(1, elapsed / duration);
      if (!closing) p = 1 - p;
      setBlinkProgress(p);
      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(step);
      } else {
        if (closing) {
          closing = false; start = 0;
          animRef.current = requestAnimationFrame(step);
        } else {
          setBlinkProgress(0);
          closing = true; start = 0;
          const delay = pickBlinkDelay();
          nextBlinkTimeout.current = window.setTimeout(() => {
            animRef.current = requestAnimationFrame(step);
          }, delay);
        }
      }
    };

    const initialDelay = 2000 + Math.floor(rand(999) * 4000);
    nextBlinkTimeout.current = window.setTimeout(() => {
      animRef.current = requestAnimationFrame(step);
    }, initialDelay);

    const scheduleGaze = () => {
      const r = rand(123456 + Math.floor((performance.now?.() || 0) / 1e4));
      const delay = 120000 + r * 180000;
      nextGazeTimeout.current = window.setTimeout(() => {
        const roll = rand(98765 + (performance.now?.() || 0));
        const dir: 0 | 1 | 2 = roll > 0.95 ? 2 : roll > 0.9 ? 0 : 1;
        setGazeDirection(dir);
        scheduleGaze();
      }, delay);
    };
    scheduleGaze();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (nextBlinkTimeout.current) clearTimeout(nextBlinkTimeout.current);
      if (nextGazeTimeout.current) clearTimeout(nextGazeTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOld, isYoung, stats.constitution]);

  // ---------- Lip Color ----------
  const lipColor = useMemo(() => {
    if (appearanceWithDefaults.lipColor) return appearanceWithDefaults.lipColor;
    const baseLipColors: Record<NonNullable<typeof appearanceWithDefaults.skinTone>, string> = {
      very_pale: '#E8B4B8', pale: '#E0A5A8', fair: '#D89598', light: '#CE8588',
      medium: '#C47578', olive: '#BA6568', tan: '#B05558', dark: '#A64548', very_dark: '#9C3538'
    };
    const base = baseLipColors[skinToneType] || '#C47578';
    return isFemale ? createHighlight(base, isWealthy ? 1.2 : 1.05) : base;
  }, [appearanceWithDefaults.lipColor, isFemale, isWealthy, skinToneType]);

  // ---------- Body Dimensions ----------
  const bodyDim = useMemo(() => {
    const baseHeadWidth = isFemale ? 22 : 26;
    let strengthMod = 1;
    if (stats.strength >= 9) strengthMod = 1.25;
    else if (stats.strength >= 7) strengthMod = 1.15;
    else if (stats.strength <= 2) strengthMod = 0.85;
    else if (stats.strength <= 4) strengthMod = 0.95;

    let shoulderMod = strengthMod;
    let waistMod = 1;
    let hipMod = 1;
    let heightMod = 1;

    if (isYoung) {
      shoulderMod *= 0.85;
      heightMod *= 0.95;
    }
    if (isOld) {
      shoulderMod *= 0.95;
      heightMod *= 0.98;
    }

    switch (appearanceWithDefaults.build) {
      case 'athletic':
        shoulderMod *= 1.1;
        waistMod *= 0.95;
        break;
      case 'slight':
        shoulderMod *= 0.85;
        waistMod *= 0.9;
        hipMod *= 0.9;
        break;
      case 'imposing':
        shoulderMod *= 1.25;
        waistMod *= 1.1;
        heightMod *= 1.1;
        break;
      case 'stocky':
        shoulderMod *= 1.2;
        waistMod *= 1.15;
        hipMod *= 1.1;
        heightMod *= 0.95;
        break;
      case 'heavy':
        shoulderMod *= 1.15;
        waistMod *= 1.25;
        hipMod *= 1.2;
        break;
      case 'tall':
        heightMod *= 1.15;
        shoulderMod *= 0.95;
        break;
      case 'short':
        heightMod *= 0.85;
        shoulderMod *= 1.05;
        break;
    }

    // Optional height support (kept from your original usage)
    // @ts-ignore
    if (appearanceWithDefaults.height) {
      const avgHeight = isFemale ? 165 : 175;
      // @ts-ignore
      heightMod *= (appearanceWithDefaults.height / avgHeight);
    }

    // Enhanced shoulder width based on strength and age
    const strengthBonus = stats.strength >= 8 ? 1.15 : stats.strength >= 6 ? 1.08 : 1.0;
    const ageReduction = isOld ? 0.95 : isYoung ? 0.9 : 1.0;

    if (isFemale) {
      const baseShoulderMult = 1.5;
      const shoulderWidth = Math.floor(baseHeadWidth * baseShoulderMult * shoulderMod * strengthBonus * ageReduction);
      return {
        shoulderWidth,
        chestWidth: Math.floor(baseHeadWidth * 1.3 * shoulderMod),
        waistWidth: Math.floor(baseHeadWidth * 1.1 * waistMod),
        hipWidth: Math.floor(baseHeadWidth * 1.45 * hipMod),
        armWidth: stats.strength >= 7 ? 5 : 4,
        bodyHeight: Math.floor(30 * heightMod),
        legLength: Math.floor(14 * heightMod)
      };
    } else {
      // Males get broader shoulders, especially with higher strength
      const baseShoulderMult = 2.5; // Increased from 2.2 for wider, more prominent shoulders
      const shoulderWidth = Math.floor(baseHeadWidth * baseShoulderMult * shoulderMod * strengthBonus * ageReduction);
      const chestWidth = Math.floor(shoulderWidth * 0.92);
      return {
        shoulderWidth,
        chestWidth,
        waistWidth: Math.floor(chestWidth * 0.85 * waistMod),
        hipWidth: Math.floor(chestWidth * 0.9 * hipMod),
        armWidth: stats.strength >= 8 ? 8 : stats.strength >= 6 ? 7 : 6,
        bodyHeight: Math.floor(30 * heightMod),
        legLength: Math.floor(14 * heightMod)
      };
    }
  }, [appearanceWithDefaults.build, appearanceWithDefaults.height, isFemale, isOld, isYoung, stats.strength]);

  // ---------- Background ----------
  const bgGradientId = `bgGradient-${uniqueId}`;
  const textureId = `texture-${uniqueId}`;

  const BackgroundDefs = useMemo(() => {
    // Enhanced cultural background system with gender and era variations
    const isModernEra = era && ['INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'].includes(era);
    const isHighStatus = isWealthy || stats.charisma >= 8;

    // Cultural color themes: [premodern-male, premodern-female, modern-male, modern-female]
    // More vivid pastels with stronger gender differentiation
    const culturalThemes: Record<NonNullable<typeof culturalZone>, string[]> = {
      // Blue/lavender family - European
      EUROPEAN: [
        '#A8C8F0',  // Premodern male: sky blue pastel
        '#F0B8F0',  // Premodern female: bright lavender
        '#98B8E8',  // Modern male: steel blue
        '#E8A8E8',  // Modern female: violet pastel
      ],
      // Jade/peach family - East Asian
      EAST_ASIAN: [
        '#B8E8C8',  // Premodern male: jade green
        '#FFD0C0',  // Premodern female: bright peach
        '#A8E0B8',  // Modern male: mint green
        '#FFB8B0',  // Modern female: coral peach
      ],
      // Sand/terracotta family - MENA
      MENA: [
        '#F0D8A8',  // Premodern male: golden sand
        '#F0B8A8',  // Premodern female: rose clay
        '#E8D0A0',  // Modern male: desert sand
        '#F0A898',  // Modern female: terracotta pink
      ],
      // Saffron/teal family - South Asian
      SOUTH_ASIAN: [
        '#F8E0A0',  // Premodern male: bright saffron
        '#A8E8E8',  // Premodern female: bright teal
        '#F0D890',  // Modern male: golden yellow
        '#98E0E8',  // Modern female: aqua teal
      ],
      // Earth/amber family - Sub-Saharan African
      SUB_SAHARAN_AFRICAN: [
        '#E0C8A0',  // Premodern male: earth brown
        '#F8D8B0',  // Premodern female: golden amber
        '#D8C098',  // Modern male: deep earth
        '#F0C8A8',  // Modern female: honey gold
      ],
      // Turquoise/ochre family - North American Pre-Columbian
      NORTH_AMERICAN_PRE_COLUMBIAN: [
        '#98E8E8',  // Premodern male: bright turquoise
        '#F0C890',  // Premodern female: ochre gold
        '#88E0E0',  // Modern male: deep turquoise
        '#E8B888',  // Modern female: adobe orange
      ],
      // Slate/rose family - North American Colonial
      NORTH_AMERICAN_COLONIAL: [
        '#B0C0D8',  // Premodern male: blue slate
        '#F8C0D0',  // Premodern female: rose pink
        '#A8B8D0',  // Modern male: gray slate
        '#F0B8C8',  // Modern female: dusty rose
      ],
      // Jungle green/coral family - South American
      SOUTH_AMERICAN: [
        '#A8E8B8',  // Premodern male: bright jungle green
        '#F8B8A8',  // Premodern female: coral orange
        '#98E0A8',  // Modern male: deep green
        '#F0A898',  // Modern female: bright coral
      ],
      // Seafoam/sunset family - Oceania
      OCEANIA: [
        '#A8F0D8',  // Premodern male: bright seafoam
        '#F8C0B8',  // Premodern female: sunset orange
        '#98E8D0',  // Modern male: ocean green
        '#F0B8B0',  // Modern female: coral sunset
      ]
    };

    // Select color based on era and gender
    const colors = culturalThemes[culturalZone] || culturalThemes.EUROPEAN;
    const colorIndex = (isModernEra ? 2 : 0) + (isFemale ? 1 : 0);
    const baseColor = colors[colorIndex];

    // Create gradient colors
    const bg1 = baseColor;
    const bg2 = createShadow(baseColor, 0.95);  // Subtle gradient

    // Special gradient for high-status characters - simple top to bottom
    if (isHighStatus) {
      // Create a richer, more luminous gradient for high status
      const topColor = createHighlight(bg1, 1.15);
      const bottomColor = createShadow(bg2, 0.9);

      return (
        <>
          <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={topColor} />
            <stop offset="40%" stopColor={bg1} />
            <stop offset="60%" stopColor={bg2} />
            <stop offset="100%" stopColor={bottomColor} />
          </linearGradient>
          <filter id={textureId}>
            <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed={seed} />
            <feComposite operator="over" in2="noise" />
          </filter>
        </>
      );
    }

    // Regular gradient for non-elite characters
    return (
      <>
        <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="50%" stopColor={createHighlight(bg1, 0.98)} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
        <filter id={textureId}>
          <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed={seed} />
          <feComposite operator="over" in2="noise" />
        </filter>
      </>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgGradientId, textureId, culturalZone, seed, era, isFemale, isWealthy, stats.charisma]);

  // ========================= RENDERERS =========================

  // ----- HEAD -----
const renderHead = useMemo(() => {
  const elements: JSX.Element[] = [];
  const faceShape = (appearanceWithDefaults.faceShape || 'oval').toLowerCase();
  const jawline = (appearanceWithDefaults.jawline || 'soft').toLowerCase();
  const cheekbones = (appearanceWithDefaults.cheekbones || 'average').toLowerCase();
  const skinTexture = (appearanceWithDefaults.skinTexture || 'smooth').toLowerCase();
  const isMale = appearanceWithDefaults.gender === 'male' || appearanceWithDefaults.gender === 'm';

  // ── helpers ────────────────────────────────────────────────
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth01 = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

  type ShapeParams = {
    crownRoundness: number; // fraction of height to reach near max width
    cheekTop: number;       // cheek band start (fraction of height)
    cheekBot: number;       // cheek band end   (fraction of height)
    chinTaper: number;      // 0..1 smaller = pointier chin (handled below)
    jawSoftness: number;    // extra drop near very bottom (avoids flat line)
    topW: number;           // normalized width at very top
    cheekW: number;         // normalized width at widest rows
    chinW: number;          // normalized width at the chin
  };

  // Base shape curves + anchor widths per face shape
  const baseCurve: Record<string, Omit<ShapeParams, 'topW' | 'cheekW' | 'chinW'>> = {
    oval:     { crownRoundness: 0.34, cheekTop: 0.40, cheekBot: 0.72, chinTaper: 0.36, jawSoftness: 0.08 },
    round:    { crownRoundness: 0.30, cheekTop: 0.45, cheekBot: 0.78, chinTaper: 0.46, jawSoftness: 0.05 },
    square:   { crownRoundness: 0.36, cheekTop: 0.46, cheekBot: 0.70, chinTaper: 0.50, jawSoftness: 0.03 },
    heart:    { crownRoundness: 0.32, cheekTop: 0.40, cheekBot: 0.68, chinTaper: 0.28, jawSoftness: 0.10 },
    diamond:  { crownRoundness: 0.33, cheekTop: 0.42, cheekBot: 0.70, chinTaper: 0.34, jawSoftness: 0.09 },
    long:     { crownRoundness: 0.36, cheekTop: 0.46, cheekBot: 0.76, chinTaper: 0.38, jawSoftness: 0.07 },
  };
  const widthAnchors: Record<string, { topW: number; cheekW: number; chinW: number }> = {
    oval:    { topW: 0.55, cheekW: 1.00, chinW: 0.68 },
    round:   { topW: 0.60, cheekW: 1.04, chinW: 0.78 },
    square:  { topW: 0.65, cheekW: 1.02, chinW: 0.84 },
    heart:   { topW: 0.58, cheekW: 1.02, chinW: 0.58 },
    diamond: { topW: 0.50, cheekW: 1.06, chinW: 0.66 },
    long:    { topW: 0.52, cheekW: 0.98, chinW: 0.64 },
  };

  const W = headDim.width;
  const H = headDim.height;
  const cx = headX + Math.floor(W / 2);

  // Assemble params with feature influences
  let curve = { ...(baseCurve[faceShape] ?? baseCurve.oval) }; // Make mutable copy
  let { topW, cheekW, chinW } = widthAnchors[faceShape] ?? widthAnchors.oval;

  // jawline -> lower third width
  if (jawline === 'square') chinW += 0.10;
  else if (jawline === 'sharp') chinW -= 0.08;

  // Gender-specific jaw modifications - make female jaws more delicate
  if (!isMale) {
    chinW *= 0.58; // Reduce overall chin width for women by 42% (was 0.65/35%)
    cheekW *= 0.88; // Reduce cheek width more for better tapering (was 0.90)

    // Additional reductions based on jawline type for women
    if (jawline === 'square') chinW -= 0.15; // Much more reduction for square jaws (was 0.12)
    else if (jawline === 'sharp') chinW -= 0.10; // More reduction for sharp jaws (was 0.08)
    else if (jawline === 'round') chinW -= 0.12; // More reduction for round jaws (was 0.10)
    else if (jawline === 'oval') chinW -= 0.08; // More reduction for oval (was 0.06)

    // Make chin more pointed/tapered for women (lower chinTaper = more pointed)
    curve.chinTaper *= 0.75; // Reduce by 25% to make chin taper more sharply
    // Increase jaw softness for women (softer transition from cheek to chin)
    curve.jawSoftness *= 1.4; // Increase by 40% for softer, more rounded transition
  }

  // cheekbones -> cheek anchor
  if (cheekbones === 'high') cheekW += 0.04;
  else if (cheekbones === 'low') cheekW -= 0.03;

  // hair length -> crown slightly wider for bald/very short (less lift)
  if (hairLength === 'bald' || hairLength === 'very_short') topW += 0.04;

  // clamp anchors
  topW = clamp(topW, 0.45, 0.70);
  cheekW = clamp(cheekW, 0.94, 1.10);
  chinW = clamp(chinW, isMale ? 0.52 : 0.42, 0.90); // Lower minimum for women (0.42 vs 0.52)

  // lightweight PRNG for stable asymmetry
  const seedVal = ((headX << 2) ^ (headY << 1) ^ (W * 31) ^ (H * 17)) >>> 0;
  const makeRng = (s: number) => {
    let n = s || 1;
    return () => ((n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)) >>> 0) / 0xffffffff;
  };
  const rng = makeRng(seedVal);
  const leftBias = (rng() * 2 - 1) * 0.8;   // pixels
  const rightBias = (rng() * 2 - 1) * 0.8;  // pixels
  const cheekVariance = (rng() * 2 - 1) * 0.5;

  // compute half-width (in px) for a normalized y (0 top → 1 chin)
  const halfWidthAtT = (t: number) => {
    let wNorm: number;

    if (t < curve.crownRoundness) {
      const u = smooth01(t / curve.crownRoundness);
      // Add extra curvature for the very top rows for more natural crown
      const crownCurve = t < 0.1 ? Math.pow(t / 0.1, 0.6) : 1.0;
      wNorm = lerp(topW, cheekW, u) * crownCurve;
    } else if (t < curve.cheekBot) {
      const u = (t - curve.crownRoundness) / (curve.cheekBot - curve.crownRoundness);
      const bulge = 1 - 0.06 * Math.cos(u * Math.PI); // gentle cheek swelling
      wNorm = cheekW * bulge;
    } else {
      const u = smooth01((t - curve.cheekBot) / (1 - curve.cheekBot));
      wNorm = lerp(cheekW, chinW, u);
      // soften jaw near very bottom to avoid a straight bottom edge
      let jawSoftnessMultiplier = isMale ? 1.0 : 1.5; // Increase softness for women by 50%
      wNorm -= curve.jawSoftness * jawSoftnessMultiplier * Math.pow(Math.max(0, t - 0.80), 1.8) * (W / Math.max(W, 24));
    }

    wNorm = clamp(wNorm, 0.50, 1.12);
    const full = Math.max(6, Math.round(W * wNorm * 1.15));  // Increased by 15% for wider heads
    return Math.floor(full / 2);
  };

  // Check if headgear is present to suppress top rows
  let headgearItem: { name: string } | null = null;
  if (useEquippedItems && character.equippedItems !== undefined) {
    headgearItem = character.equippedItems.head ?? null;
  } else {
    headgearItem = appearanceWithDefaults.headgear ?? null;
  }

  const hasHeadgear = headgearItem && headgearItem.name && headgearItem.name.toLowerCase() !== 'none';
  const headgearName = hasHeadgear ? (headgearItem?.name || '').toLowerCase() : '';

  // Determine how many top rows to suppress based on headgear type
  let skipTopRows = 0;
  if (hasHeadgear) {
    if (headgearName.includes('crown') || headgearName.includes('tiara') || headgearName.includes('circlet')) {
      skipTopRows = 0; // These don't cover the top fully
    } else if (headgearName.includes('turban') || headgearName.includes('pagri')) {
      skipTopRows = 5; // These cover more of the head
    } else if (headgearName.includes('coif') || headgearName.includes('hood') || headgearName.includes('helm')) {
      skipTopRows = 3; // Full coverage items
    } else {
      skipTopRows = 2; // Default for most hats, caps, etc.
    }
  }

  // row-by-row fill using per-side edges (allows asymmetry)
  for (let yi = 0; yi < H; yi++) {
    // Skip top rows if headgear is covering them
    if (yi < skipTopRows) continue;

    const y = headY + yi;
    const t = H > 1 ? yi / (H - 1) : 0;
    let hw = halfWidthAtT(t);

    // For women: taper the chin more aggressively in the bottom 3-4 rows for a pointed chin
    if (!isMale && t > 0.85) {
      // Calculate how close to the bottom we are (0 at t=0.85, 1 at t=1.0)
      const bottomProgress = (t - 0.85) / 0.15;
      // Apply aggressive taper: reduce width quadratically as we approach bottom
      const taper = 1 - (bottomProgress * bottomProgress * 0.6); // Reduce by up to 60% at the very bottom
      hw *= taper;
    }

    // asymmetry strength varies with height (more below the cheeks)
    const asymCurve = (t - 0.25) * 1.2;
    const leftX = Math.round(
      cx - hw + leftBias * asymCurve + (t > curve.cheekTop && t < curve.cheekBot ? cheekVariance : 0)
    );
    const rightX = Math.round(cx + hw + rightBias * asymCurve);

    // side outlines with better rim lighting on left
    // Right side keeps original shadow outline
    elements.push(
      <rect key={`outline-outer-r-${yi}`} x={rightX + 2} y={y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
      <rect key={`outline-r-${yi}`}        x={rightX + 1} y={y} width="1" height="1" fill={outlineColor} className="pixel" />
    );

    // Left side gets rim light gradient instead of harsh outline
    if (t > 0.15 && t < 0.85) {  // Only in face area, not top/bottom
      elements.push(
        <rect key={`rim-outer-l-${yi}`} x={leftX - 2} y={y} width="1" height="1" fill={createShadow(skinTone, 0.85)} opacity="0.5" className="pixel" />,
        <rect key={`rim-l-${yi}`}        x={leftX - 1} y={y} width="1" height="1" fill={createShadow(skinTone, 0.92)} className="pixel" />
      );
    } else {
      // Keep original outline at top/bottom
      elements.push(
        <rect key={`outline-outer-l-${yi}`} x={leftX - 2} y={y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-l-${yi}`}        x={leftX - 1} y={y} width="1" height="1" fill={outlineColor} className="pixel" />
      );
    }

    // fill line between leftX..rightX (inclusive)
    const rowWidth = rightX - leftX + 1;
    for (let x = leftX; x <= rightX; x++) {
      const xLocal = x - leftX;
      const xRatio = rowWidth > 1 ? xLocal / (rowWidth - 1) : 0.5;
      let faceColor = skinTone;

      // your existing lateral shading
      if (xRatio < 0.15) faceColor = skinBrightHighlight;
      else if (xRatio < 0.25) faceColor = skinHighlight;
      else if (xRatio < 0.4) faceColor = createHighlight(skinTone, 1.08);
      else if (xRatio > 0.85) faceColor = skinDeepShadow;
      else if (xRatio > 0.75) faceColor = skinShadow;
      else if (xRatio > 0.6) faceColor = skinMidtone;

      // Add better rim light gradient on the left edge (viewer's left)
      if (xLocal < 3 && t > 0.2 && t < 0.8) {
        // Create gradient from edge inward
        if (xLocal === 0) {
          faceColor = skinBrightHighlight;  // Brightest at the very edge
        } else if (xLocal === 1) {
          faceColor = skinHighlight;  // Still bright
        } else if (xLocal === 2) {
          faceColor = createHighlight(skinTone, 1.05);  // Subtle highlight
        }
      }

      // subsurface edge band (temples) with very subtle temple hollows
      if (t > 0.3 && t < 0.5) {
        if (xLocal < 4 || xLocal > rowWidth - 5) {
          // Create very subtle temple hollow effect
          const templeDepth = t > 0.35 && t < 0.45 ? 0.3 : 0.15; // Much more subtle depth
          const edgeDistance = xLocal < 4 ? xLocal : (rowWidth - 1 - xLocal);
          const isRightTemple = xLocal > rowWidth - 5;

          // Much more subtle shadow based on distance from edge
          // Right temple (viewer's right, character's left) should have subtle highlight
          if (isRightTemple) {
            // Right temple - slightly more prominent highlight
            if (edgeDistance === 0) {
              faceColor = createHighlight(faceColor, 1.05); // Increased from 1.03
            } else if (edgeDistance === 1) {
              faceColor = createHighlight(faceColor, 1.03);
            } else if (edgeDistance === 2) {
              faceColor = createHighlight(faceColor, 1.02);
            }
          } else {
            // Left temple - can be slightly lighter
            if (edgeDistance === 0) {
              faceColor = createShadow(skinSubsurface, 0.96 - (templeDepth * 0.02));
            } else if (edgeDistance === 1) {
              faceColor = createShadow(skinSubsurface, 0.98 - (templeDepth * 0.01));
            } else if (edgeDistance === 2) {
              faceColor = createShadow(skinSubsurface, 0.99 - (templeDepth * 0.005));
            } else {
              faceColor = skinSubsurface;
            }
          }
        }
      }

      // cheekbone lift
      if (cheekbones !== 'low' && t > 0.4 && t < 0.65) {
        const cheekboneIntensity = cheekbones === 'high' ? 0.12 : 0.08;
        if (Math.abs(xRatio - 0.22) < cheekboneIntensity || Math.abs(xRatio - 0.78) < cheekboneIntensity) {
          faceColor = createHighlight(faceColor, xRatio < 0.5 ? 1.1 : 1.05);
        }
      }

      // Fever flush on cheeks
      if ((diseaseEffects.hasFever || diseaseEffects.hasSmallpox || diseaseEffects.hasMeasles) && diseaseEffects.severity >= 1) {
        if (t > 0.45 && t < 0.65) { // Cheek area
          const cheekCenterLeft = 0.25;
          const cheekCenterRight = 0.75;
          const isNearCheek = Math.abs(xRatio - cheekCenterLeft) < 0.1 || Math.abs(xRatio - cheekCenterRight) < 0.1;

          if (isNearCheek) {
            // Add reddish flush to cheeks without mix()
            // Create a pinkish tint by adjusting RGB values directly
            const flushIntensity = diseaseEffects.severity >= 2 ? 0.15 : 0.1;
            faceColor = createHighlight(faceColor, 1 + flushIntensity); // Slightly brighter for flush effect
          }
        }
      }

      // nose bridge with subtle glow
      if (t > 0.25 && t < 0.65) {
        const noseDist = Math.abs(xLocal - rowWidth / 2);
        if (noseDist < 2) {
          faceColor = createHighlight(faceColor, 1.12);
        } else if (noseDist < 3) {
          // Subtle glow around nose bridge
          faceColor = createHighlight(faceColor, 1.06);
        }
      }

      // Simplified nasolabial folds - just subtle darkening in cheek area
      if (hasWrinkles && t > 0.55 && t < 0.75 && (xRatio < 0.4 || xRatio > 0.6)) {
        faceColor = createShadow(faceColor, 0.98);  // Very subtle shadow
      }

      // texture / age
      if (skinTexture === 'freckled' && rand(x * 100 + y * 1000) > 0.92) {
        faceColor = createShadow(faceColor, 0.85);
      } else if (skinTexture === 'weathered' && rand(x * 50 + y * 500) > 0.88) {
        faceColor = createShadow(faceColor, 0.92);
      }
      if (hasAgeSpots && t > 0.3 && t < 0.7 && rand(x * 200 + y * 2000) > 0.96) {
        faceColor = createShadow(faceColor, 0.75);
      }
      // Simplified age effects - just subtle overall darkening instead of pixel-by-pixel wrinkles
      if (hasWrinkles && (t > 0.2 && t < 0.8)) {
        faceColor = createShadow(faceColor, 0.96); // Very subtle overall aging effect
      }

      elements.push(
        <rect key={`face-${yi}-${x}`} x={x} y={y} width="1" height="1" fill={faceColor} className="pixel" />
      );
    }
  }

  // ----- ENHANCED EAR RENDERING -----
  // Ears positioned at 32-58% of head height for better visibility
  const earTopRatio = 0.32;  // Start slightly higher
  const earBottomRatio = 0.58; // End slightly lower for larger ears
  const earTopY = headY + Math.floor(H * earTopRatio);
  const earBottomY = headY + Math.floor(H * earBottomRatio);
  const earHeight = earBottomY - earTopY;

  // Calculate ear X positions based on face width at ear level
  const earMidT = 0.45; // Middle of ear range
  const earHW = halfWidthAtT(earMidT);
  const earAsymCurve = (earMidT - 0.25) * 1.2;
  const earLeftBase = Math.round(cx - earHW + leftBias * earAsymCurve);
  const earRightBase = Math.round(cx + earHW + rightBias * earAsymCurve);

  // Position ears just outside the face outline - balanced position
  const earLeftX = earLeftBase - 3;  // Balanced at -3
  const earRightX = earRightBase + 3; // Balanced at +3

  // Create ruddy ear colors - ears tend to be pinker/redder than face
  const createRuddyEarColor = (baseColor: string) => {
    // Parse the base skin color
    const rgb = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgb) {
      const r = parseInt(rgb[1]);
      const g = parseInt(rgb[2]);
      const b = parseInt(rgb[3]);
      // Add red/pink tint to ears (increase red, slightly decrease green/blue)
      const newR = Math.min(255, r + 25);
      const newG = Math.max(0, g - 5);
      const newB = Math.max(0, b - 8);
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    return baseColor;
  };

  const earBaseColor = createRuddyEarColor(skinTone);
  const earHighlightColor = createRuddyEarColor(skinHighlight);
  const earMidColor = createRuddyEarColor(skinMidtone);

  // Left ear - more prominent C-shaped curve
  for (let i = 0; i <= earHeight; i++) {
    const earY = earTopY + i;
    const earT = earHeight > 0 ? i / earHeight : 0.5;

    // Create C-shape curvature - balanced ear width
    let earX = earLeftX;
    let earWidth = 2; // Balanced at 2 for middle section
    if (earT < 0.3) {
      earX = earLeftX + 1; // Top curves inward
      earWidth = 1; // Narrow at top
    } else if (earT > 0.7) {
      earX = earLeftX + 1; // Bottom curves inward
      earWidth = 1; // Narrow at bottom
    }

    // Use lighter, ruddier colors for ears
    const earColor = earT < 0.2 || earT > 0.8
      ? earHighlightColor   // Lighter at edges
      : earBaseColor;       // Ruddy base color in middle

    // Outer ear edge with softer shadow
    elements.push(
      <rect key={`ear-l-outer-${i}`} x={earX - 1} y={earY} width="1" height="1" fill={skinShadow} className="pixel" />,
      <rect key={`ear-l-main-${i}`} x={earX} y={earY} width={earWidth} height="1" fill={earColor} className="pixel" />
    );

    // Enhanced inner ear detail with pink inner areas
    if (earT > 0.3 && earT < 0.7 && earWidth > 1) {
      // Add pinkish highlight on inner curve
      elements.push(
        <rect key={`ear-l-inner-${i}`} x={earX + 1} y={earY} width="1" height="1" fill={earMidColor} opacity="0.9" className="pixel" />
      );
      // Add darker but still ruddy inner canal
      if (earT > 0.4 && earT < 0.6) {
        elements.push(
          <rect key={`ear-l-canal-${i}`} x={earX + 1} y={earY} width="1" height="1" fill={createRuddyEarColor(skinShadow)} opacity="0.8" className="pixel" />
        );
      }
    }
  }

  // Right ear - mirror of left
  for (let i = 0; i <= earHeight; i++) {
    const earY = earTopY + i;
    const earT = earHeight > 0 ? i / earHeight : 0.5;

    // Create C-shape curvature - balanced ear width
    let earX = earRightX;
    let earWidth = 2; // Balanced at 2 for middle section
    if (earT < 0.3) {
      earX = earRightX - 1; // Top curves inward
      earWidth = 1; // Narrow at top
    } else if (earT > 0.7) {
      earX = earRightX - 1; // Bottom curves inward
      earWidth = 1; // Narrow at bottom
    }

    // Use lighter, ruddier colors for ears (same as left ear)
    const earColor = earT < 0.2 || earT > 0.8
      ? earHighlightColor   // Lighter at edges
      : earBaseColor;       // Ruddy base color in middle

    // Outer ear edge with softer shadow
    elements.push(
      <rect key={`ear-r-outer-${i}`} x={earX + earWidth} y={earY} width="1" height="1" fill={skinShadow} className="pixel" />,
      <rect key={`ear-r-main-${i}`} x={earX} y={earY} width={earWidth} height="1" fill={earColor} className="pixel" />
    );

    // Enhanced inner ear detail with pink inner areas
    if (earT > 0.3 && earT < 0.7 && earWidth > 1) {
      // Add pinkish highlight on inner curve
      elements.push(
        <rect key={`ear-r-inner-${i}`} x={earX} y={earY} width="1" height="1" fill={earMidColor} opacity="0.9" className="pixel" />
      );
      // Add darker but still ruddy inner canal
      if (earT > 0.4 && earT < 0.6) {
        elements.push(
          <rect key={`ear-r-canal-${i}`} x={earX} y={earY} width="1" height="1" fill={createRuddyEarColor(skinShadow)} opacity="0.8" className="pixel" />
        );
      }
    }
  }

  // ----- CHIN VARIATIONS & UNDER-CHIN SHADOW -----
  const chinBottomY = headY + H - 1;
  const chinWidth = Math.floor(W * chinW);
  const chinStartX = cx - Math.floor(chinWidth / 2);
  const chinEndX = cx + Math.floor(chinWidth / 2);

  // Add cleft chin for some male characters (based on stable pseudo-random)
  const hasCleftChin = isMale && ((seedVal ^ 0x12345) % 100) < 25; // ~25% of males
  const hasChinDimple = isMale && !hasCleftChin && ((seedVal ^ 0x54321) % 100) < 20; // ~20% of remaining males

  // Add chin features
  if (hasCleftChin) {
    // Cleft chin - vertical indentation in center
    const cleftY = chinBottomY - 2;
    elements.push(
      <rect key="cleft-top" x={cx} y={cleftY} width="1" height="2" fill={createShadow(skinTone, 0.85)} className="pixel" />,
      <rect key="cleft-mid" x={cx} y={cleftY + 1} width="1" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
      // Subtle highlights on either side of cleft
      <rect key="cleft-hl-l" x={cx - 1} y={cleftY + 1} width="1" height="1" fill={createHighlight(skinTone, 1.05)} className="pixel" />,
      <rect key="cleft-hl-r" x={cx + 1} y={cleftY + 1} width="1" height="1" fill={createHighlight(skinTone, 1.05)} className="pixel" />
    );
  } else if (hasChinDimple) {
    // Subtle chin dimple
    const dimpleY = chinBottomY - 1;
    elements.push(
      <rect key="dimple" x={cx} y={dimpleY} width="1" height="1" fill={createShadow(skinTone, 0.88)} className="pixel" />
    );
  }

  // Add prominent chin for square jaws (males only - women get softer square jaws)
  if (jawline === 'square' && isMale) {
    // Add extra width pixels at chin corners for squared look
    elements.push(
      <rect key="chin-corner-l" x={chinStartX - 1} y={chinBottomY} width="1" height="1" fill={skinMidtone} className="pixel" />,
      <rect key="chin-corner-r" x={chinEndX + 1} y={chinBottomY} width="1" height="1" fill={skinMidtone} className="pixel" />
    );
  }

  // Add shadow line under the chin where it meets the neck
  for (let x = chinStartX; x <= chinEndX; x++) {
    const xLocal = x - chinStartX;
    const xRatio = chinWidth > 1 ? xLocal / (chinWidth - 1) : 0.5;

    // Create a curved shadow that's darker in the center
    // Make chin shadows lighter for women to reduce harsh definition
    let shadowIntensity = isMale ? 0.75 : 0.82;
    if (xRatio > 0.2 && xRatio < 0.8) {
      shadowIntensity = isMale ? 0.65 : 0.72; // Darker in the center, but lighter for women
    }

    elements.push(
      <rect
        key={`under-chin-shadow-${x}`}
        x={x}
        y={chinBottomY + 1}
        width="1"
        height="1"
        fill={createShadow(skinTone, shadowIntensity)}
        className="pixel"
      />
    );
  }

  // ----- DYNAMIC CHEEK COLOR (health/emotion indicators) -----
  const health = character.health || 100;
  const maxHealth = character.maxHealth || 100;
  const fatigue = character.fatigue || 0;
  const maxFatigue = character.maxFatigue || 100;
  const affect = appearanceWithDefaults.affect || 'neutral';

  const healthPercent = health / maxHealth;
  const fatiguePercent = fatigue / maxFatigue;

  let cheekFlush: string | null = null;

  if (healthPercent < 0.5) {
    // Pale when sick (no flush)
    cheekFlush = null;
  } else if (fatiguePercent > 0.8) {
    // Flushed when exhausted
    cheekFlush = mix(actualSkinTone, '#FF6B6B', 0.15);
  } else if (affect === 'embarrassed' || affect === 'shy') {
    // Blushing when embarrassed
    cheekFlush = mix(actualSkinTone, '#FFB6C1', 0.25);
  } else if (affect === 'angry' || affect === 'furious') {
    // Red when angry
    cheekFlush = mix(actualSkinTone, '#FF4444', 0.2);
  } else if (healthPercent > 0.9 && fatiguePercent < 0.3) {
    // Healthy glow when in good condition
    cheekFlush = mix(actualSkinTone, '#FFB6C1', 0.1);
  }

  if (cheekFlush) {
    // Left cheek
    elements.push(
      <ellipse
        key="cheek-left"
        cx={headX + Math.floor(W * 0.25)}
        cy={headY + Math.floor(H * 0.6)}
        rx="3"
        ry="2"
        fill={cheekFlush}
        opacity="0.4"
        className="pixel"
      />
    );
    // Right cheek
    elements.push(
      <ellipse
        key="cheek-right"
        cx={headX + Math.floor(W * 0.75)}
        cy={headY + Math.floor(H * 0.6)}
        rx="3"
        ry="2"
        fill={cheekFlush}
        opacity="0.4"
        className="pixel"
      />
    );
  }

  return <g key="head">{elements}</g>;
}, [
  appearanceWithDefaults.cheekbones,
  appearanceWithDefaults.faceShape,
  appearanceWithDefaults.jawline,
  appearanceWithDefaults.skinTexture,
  appearanceWithDefaults.affect,
  character.health,
  character.maxHealth,
  character.fatigue,
  character.maxFatigue,
  hairLength,
  headDim.height,
  headDim.width,
  headX,
  headY,
  hasAgeSpots,
  hasWrinkles,
  outlineColor,
  skinBrightHighlight,
  skinDeepShadow,
  skinHighlight,
  skinMidtone,
  skinShadow,
  skinSubsurface,
  skinTone,
  actualSkinTone,
  useEquippedItems,
  character.equippedItems,
  appearanceWithDefaults.headgear,
  appearanceWithDefaults.gender
]);


  // ----- HAIR -----
  // ----- HAIR -----
const renderHair = useMemo(() => {
  const elements: JSX.Element[] = [];
  const hairLen = hairLength;
  const centerX = headX + headDim.width / 2; // Move centerX to the top
  const isMale = appearanceWithDefaults.gender === 'male' || appearanceWithDefaults.gender === 'm';

  const CLIP_HAIR_TO_HEADGEAR = true;

  // ⬇️ #2: ADD THIS LINE EXACTLY HERE
  const hgName = (headgearName || 'none').toLowerCase();

  if (hairLen === 'bald') return <g key="hair" />;

  // Determine headgear coverage for hair clipping
  const getHeadgearCoverage = () => {
    // ⬇️ use hgName instead of recomputing from appearance
    const name = hgName;

    // Full coverage - no hair visible on top or sides
    if (/(helmet|helm|coif|wimple|hijab|hood|biggins|zukin)/.test(name)) {
      return { top: true, sides: true, back: true, front: true };
    }

    // Top coverage only - sideburns and back visible
    if (/(cap|beret|kippah|yarmulke|fez|kufi|beanie|tuque)/.test(name)) {
      return { top: true, sides: false, back: false, front: true };
    }

    // Partial top - allows some front hair (bangs)
    if (/(crown|tiara|circlet|headband|bandana|flower|garland)/.test(name)) {
      return { top: false, sides: false, back: false, front: false };
    }

    // Wide brim hats - top covered but hair visible at sides
    if (/(hat|panama|fedora|sombrero|tricorn|straw)/.test(name)) {
      return { top: true, sides: false, back: false, front: true };
    }

    // Turbans - wraps around but might show some front
    if (/(turban|pagri)/.test(name)) {
      return { top: true, sides: true, back: true, front: false };
    }

    // Default - no coverage
    return { top: false, sides: false, back: false, front: false };
  };

  const coverage = getHeadgearCoverage();

    // ---- helper: paint scalp cap across the crown (top-of-head) ----
const paintScalpCap = (opts?: { buzz?: boolean }) => {
if (hairLen === 'bald') return;

  const buzz = !!opts?.buzz;
  // Use a fuller thickness for cap; for buzz/crew, make it tight to the scalp
  const capThickness = buzz ? 1.0 : 0.95;

  // Reduced volume for more natural appearance
  const volumeBoost = hairTexture === 'kinky' || hairTexture === 'coily' ? 4 :
                     hairTexture === 'curly' ? 3 :
                     hairTexture === 'wavy' ? 2 : 1;

  const capTop = headY - (hairLen === 'very_short' ? 1 : hairLen === 'short' ? 2 :
                          hairLen === 'medium' ? volumeBoost + 1 : volumeBoost + 2);
  const cx = centerX;

  // Reduced to single layer for performance
  for (let layer = 0; layer < 1; layer++) { // Single layer for better performance
    for (let y = capTop; y < headY + 6; y++) {
      const isTopCrown = y < headY;
      const relY = y - headY;

      // More subtle volume based on texture
      const sideVolume = hairTexture === 'kinky' || hairTexture === 'coily' ? 2 :
                        hairTexture === 'curly' ? 1.5 :
                        hairTexture === 'wavy' ? 1 : 0.5;

      // Natural taper of hair width
      let rowHalf;
      if (y < headY - 2) {
        // Top of head - narrower
        rowHalf = (headDim.width / 2) * 0.8 + sideVolume;
      } else if (y < headY + 2) {
        // Around temples - natural width
        rowHalf = (headDim.width / 2 + 1) + sideVolume;
      } else {
        // Below ears - taper inward
        rowHalf = (headDim.width / 2 - layer) + sideVolume * 0.5;
      }

      const left = Math.round(cx - rowHalf + layer);
      const right = Math.round(cx + rowHalf - layer);

      for (let x = left; x <= right; x++) {
        // Keep face center reasonably clear except at the top hairline
        const relY = y - headY;
        const relX = x - headX;

        // Create more natural hairline with baby hairs and gradual transition
        // Add receding hairline for older men
        const baseHairlineY = isOld && isMale ? 5 : 3; // Higher hairline for old men
        const templeRecession = isOld && isMale && Math.abs(x - cx) > headDim.width * 0.3 ? 2 : 0; // Temple recession
        const hairlineY = baseHairlineY + templeRecession + Math.sin((x - cx) * 0.3) * 0.5; // Slight wave in hairline
        const isHairlineEdge = relY >= hairlineY && relY <= hairlineY + 2;
        const hairlineDensity = isHairlineEdge ? 0.4 + (relY - hairlineY) * 0.3 : 1.0;

        const inFace =
          !buzz &&
          relY >= 4 && relY <= headDim.height - 3 &&
          Math.abs(x - cx) <= (headDim.width / 2 - 4);

        // respect headgear coverage masks
        const isTop = relY < 0;
        const isSides = relX < 2 || relX > headDim.width - 2;
        const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
        const isBack = relY >= headDim.height - 2;

        const masked =
          (coverage.top && isTop) ||
          (coverage.sides && isSides) ||
          (coverage.front && isFront) ||
          (coverage.back && isBack);

        if (!inFace && !masked) {
          // Use density for hairline edge rendering
          if (isHairlineEdge && rand(1631 + x + y) > hairlineDensity) continue;

          const p = getHairPattern(x, y);

          // Enhanced color depth based on layer
          let col = layer === 0 ? naturalHairDeepShadow :
                   layer === 1 ? naturalHairShadow :
                   naturalBaseHair;

          if (p > 0.35) {
            col = layer === 0 ? naturalHairShadow :
                 layer === 1 ? naturalBaseHair :
                 naturalHairHighlight;
          }

          // Add subtle transparency for edge layers to create softer look
          const opacity = layer === 2 && (x === left || x === right) ? 0.8 : 1;

          elements.push(
            <rect key={`cap-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1"
                 fill={col} opacity={opacity} className="pixel" />
          );
        }
      }
    }
  }

  // Add subtle flyaway hairs for natural look
  if (!buzz && hairTexture !== 'straight') {
    const numFlyaways = hairTexture === 'wavy' ? 3 :
                       hairTexture === 'curly' ? 5 : 7;

    for (let i = 0; i < numFlyaways; i++) {
      const angle = (i / numFlyaways) * Math.PI * 2;
      const distance = 0.5 + rand(1665 + i * 13);
      const fx = Math.round(cx + Math.cos(angle) * (headDim.width / 2 + distance));
      const fy = Math.round(headY + Math.sin(angle) * distance);

      if (fy < headY + headDim.height * 0.5 && fy >= headY - 3) { // Only around upper head
        elements.push(
          <rect key={`flyaway-${i}`} x={fx} y={fy} width="1" height="1"
               fill={naturalHairHighlight} opacity="0.3" className="pixel" />
        );
      }
    }
  }
};

// paintScalpCap call moved down after dependencies are defined


    const getHairPattern = (x: number, y: number): number => {
      switch (hairTexture) {
        case 'straight': return Math.sin(x * 0.1) * 0.15 + Math.sin(y * 0.05) * 0.1;
        case 'wavy':    return Math.sin(x * 0.3 + y * 0.15) * 0.4 + Math.cos(x * 0.2) * 0.2;
        case 'curly':   return Math.sin(x * 0.5 + y * 0.3) * 0.7 + Math.cos(x * 0.4 + y * 0.2) * 0.3;
        case 'coily':   return Math.sin(x * 0.8 + y * 0.5) * 0.9 + Math.sin(x * 0.6 + y * 0.4) * 0.4;
        case 'kinky':   return Math.sin(x * 1.2 + y * 0.8) * 1.1 + Math.cos(x * 0.9 + y * 0.6) * 0.5;
        default:        return 0;
      }
    };

    // More subtle volume parameters based on hair texture
    const getVolumeOffset = (texture: string, y: number, side: 'left' | 'right' | 'top'): number => {
      const relY = y - headY;
      const crownArea = relY < 4;

      switch (texture) {
        case 'straight':
          return side === 'top' && crownArea ? 1 : 0;
        case 'wavy':
          return side === 'top' ? 1.5 : 1;
        case 'curly':
          return side === 'top' ? 2 : (side === 'left' || side === 'right' ? 1.5 : 1);
        case 'coily':
        case 'kinky':
          return side === 'top' ? 2.5 : (side === 'left' || side === 'right' ? 2 : 1.5);
        default:
          return 0.5;
      }
    };

    // Buzz/crew shouldn't carve a gap out of the hairline
    const revealForehead = hairLen === 'short' ? 1 : 0;

    // Lower hairTop for very short to hug scalp instead of floating
    const hairTop = headY - (hairLen === 'very_short' ? 2 : hairLen === 'short' ? 4 : 7);
    const thickness = isOld ? 0.7 : isYoung ? 0.95 : 0.85;
    
    // Fix unrealistic hair colors - convert oversaturated reds to natural tones
    const naturalizeHairColor = (color: string): string => {
      const rgb = toRGB(color);
      // If it's an oversaturated red (high red, low green/blue), convert to auburn
      if (rgb.r > 150 && rgb.g < 80 && rgb.b < 80) {
        return '#8B4513'; // Natural auburn/saddle brown
      }
      // If it's bright red, make it more orange-brown
      if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) {
        return '#CD853F'; // Peru/orange-brown
      }
      return color;
    };
    
    const naturalBaseHair = naturalizeHairColor(baseHair);
    const naturalHairShadow = createShadow(naturalBaseHair, 0.7);
    const naturalHairDeepShadow = createShadow(naturalBaseHair, 0.5);
    const naturalHairHighlight = createHighlight(naturalBaseHair, 1.2);
    const naturalHairBrightHighlight = createHighlight(naturalBaseHair, 1.4);

    // Now it's safe to call paintScalpCap (after centerX, getHairPattern, and natural colors are defined)
    const isBuzz = hairLen === 'very_short' || hairStyle === 'crew' || hairStyle === 'pixie' || hairStyle === 'finger_waves';
    paintScalpCap({ buzz: isBuzz });

    // Add subtle texture-specific strand patterns
    if (!isBuzz && hairLen !== 'bald' && hairTexture !== 'straight') {
      const numStrands = hairTexture === 'wavy' ? 8 :
                        hairTexture === 'curly' ? 12 : 15;

      for (let i = 0; i < numStrands; i++) {
        const strandSeed = i * 137; // Prime number for good distribution
        const strandX = headX + 3 + (strandSeed % (headDim.width - 6));
        const strandStartY = headY - 2 + (strandSeed % 3);
        const strandLength = hairLen === 'short' ? 3 :
                            hairLen === 'medium' ? 5 : 7;

        // Draw strand based on texture
        for (let j = 0; j < strandLength; j++) {
          let x = strandX;
          let y = strandStartY + j;

          // Apply texture-specific patterns - more subtle
          if (hairTexture === 'wavy') {
            x += Math.sin(j * 0.5) * 1;
          } else if (hairTexture === 'curly') {
            x += Math.sin(j * 0.8 + i) * 1.5;
            y += Math.cos(j * 0.6) * 0.3;
          } else if (hairTexture === 'kinky' || hairTexture === 'coily') {
            x += ((j + i) % 3) - 1; // Zigzag pattern
            y += Math.sin(j * 1.2) * 0.2;
          }

          // Skip if outside head area or in face
          const relX = x - headX;
          const relY = y - headY;
          if (relX < 0 || relX >= headDim.width || relY < 0) continue;
          if (relY >= 4 && relY <= headDim.height - 3 && Math.abs(relX - headDim.width/2) <= headDim.width/2 - 4) continue;

          // Subtle color variation
          const strandColor = j % 2 === 0 ? naturalBaseHair : naturalHairShadow;

          elements.push(
            <rect key={`strand-${i}-${j}`} x={Math.round(x)} y={Math.round(y)}
                 width="1" height="1" fill={strandColor} opacity="0.4" className="pixel" />
          );
        }
      }

      // Add highlights on crown for shine
      if (hairTexture === 'straight' || hairTexture === 'wavy') {
        const highlightY = headY - 2;
        for (let x = -3; x <= 3; x++) {
          if (Math.abs(x) <= 1 || rand(1792 + x * 7) > 0.5) {
            elements.push(
              <rect key={`crown-highlight-${x}`} x={centerX + x} y={highlightY}
                   width="1" height="1" fill={naturalHairBrightHighlight} opacity="0.6" className="pixel" />
            );
          }
        }
      }
    }

    // Special style rendering
    // (centerX already declared above)
    
  // Render braids (outside the face + behind/around ears)
if (hairStyle === 'braided') {
  const braidWidth = 3;
  const numBraids = isFemale ? 2 : 1;

  // helpers
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth01 = (t: number) => (t = clamp(t, 0, 1), t * t * (3 - 2 * t)); // smoothstep

  // keep the braids a few pixels OUTSIDE the head rect
  const clearance = 3; // try 3–5 if you still see overlap at some sizes
  const leftLaneBase  = headX - clearance - braidWidth;
  const rightLaneBase = headX + headDim.width + clearance;

  // ear bounds (roughly mid-face)
  const earTop    = headY + Math.round(headDim.height * 0.30);
  const earBottom = headY + Math.round(headDim.height * 0.62);

  // start a bit above the ear; length scales with hairLen
  const yStart = headY + Math.round(headDim.height * 0.14);
  const braidLength =
    hairLen === 'long'   ? Math.round(headDim.height * 1.1) :
    hairLen === 'medium' ? Math.round(headDim.height * 0.75) :
                           Math.round(headDim.height * 0.55);

  // choose lanes per braid and gently approach the ear through the ear band
  const laneX = (b: number, y: number) => {
    // 0 at earTop, 1 at earBottom
    const tEar = y <= earTop ? 0 : y >= earBottom ? 1 : (y - earTop) / (earBottom - earTop);
    const ease = smooth01(tEar);

    // as we pass the ear, come slightly closer to the head (still outside)
    const leftApproach  = Math.round(lerp(leftLaneBase,  headX - braidWidth - 1, ease));
    const rightApproach = Math.round(lerp(rightLaneBase, headX + headDim.width + 1, ease));

    if (numBraids === 1) {
      // single braid: keep it to the right side by default (change to leftApproach if you prefer)
      return rightApproach;
    }
    return b === 0 ? leftApproach : rightApproach;
  };

  for (let b = 0; b < numBraids; b++) {
    for (let y = yStart; y < yStart + braidLength; y++) {
      // gentle sway; lower frequency so it doesn’t saw through the outline
      const weave = Math.sin(y * 0.45 + (b * Math.PI / 6)) * 1.2;
      const baseX = laneX(b, y);

      // Single layer with shading for performance
      for (let w = 0; w < braidWidth; w++) {
        const px = Math.round(baseX + w + weave);

        // hard guard: never draw inside the face rectangle
        const insideFace = (px >= headX && px < headX + headDim.width);
        if (insideFace) continue;

        // Determine color based on width position for depth
        const col = w === 0 ? naturalHairDeepShadow
                  : w === braidWidth - 1 ? naturalHairHighlight
                  : naturalBaseHair;

        elements.push(
          <rect
            key={`braid-${b}-${w}-${y}`}
            x={px}
            y={y}
            width="1"
            height="1"
            fill={col}
            className="pixel"
          />
        );
      }
    }
  }
}

    
    // Render bun - needs base hair coverage first, then elevated bun
    if (hairStyle === 'bun') {
      // Render base hair covering the scalp - single layer for performance
      for (let y = hairTop; y < headY + 6; y++) {
        for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
          const dist = Math.abs(x - centerX);
          let draw = false;
          // Use position-based shading for depth instead of layers
          const xNorm = (x - (headX - 4)) / (headDim.width + 8);
          const col = xNorm < 0.2 || xNorm > 0.8 ? naturalHairShadow : naturalBaseHair;

          // Cover top and sides of head
          if (y < headY + 2) {
            const allowed = (headDim.width / 2 + 3) * thickness;
            if (dist < allowed) draw = true;
          } else if (y >= headY + 2 && y < headY + 4) {
            if (dist <= headDim.width / 2 + 1) draw = true;
          }

            // Keep face area clear
            const faceTop = headY + 3;
            const faceCenterWidth = headDim.width / 2 - 4;
            if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              // Check coverage mask
              const relX = x - headX;
              const relY = y - headY;
              const isTop = relY < 0;
              const isSides = relX < 2 || relX > headDim.width - 2;
              const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
              const isBack = relY >= headDim.height - 2;
              
            const shouldSkip =
  CLIP_HAIR_TO_HEADGEAR && (
    (coverage.top && isTop) ||
    (coverage.sides && isSides) ||
    (coverage.front && isFront) ||
    (coverage.back && isBack)
  );

            if (!shouldSkip) {
              elements.push(<rect key={`bun-base-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
      
      // Now render the actual bun above the hairline
      const bunY = headY - 6; // Moved higher above head
      const bunSize = 10; // Made slightly larger
      for (let dy = 0; dy < bunSize; dy++) {
        for (let dx = 0; dx < bunSize; dx++) {
          const dist = Math.sqrt((dx - bunSize/2) ** 2 + (dy - bunSize/2) ** 2);
          if (dist < bunSize/2) {
            const shade = dist / (bunSize/2);
            const col = shade < 0.3 ? naturalHairHighlight : shade < 0.7 ? naturalBaseHair : naturalHairShadow;
            elements.push(<rect key={`bun-${dx}-${dy}`} x={centerX - bunSize/2 + dx} y={bunY + dy} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }
    
    // Render ponytail
    if (hairStyle === 'ponytail') {
      const tieY = headY + 4;
      // Hair tie
      elements.push(<rect key="tie" x={centerX - 2} y={tieY} width="4" height="2" fill={hairDeepShadow} className="pixel" />);
      
      // Ponytail strands
      const tailLength = hairLen === 'long' ? 20 : 12;
      for (let y = tieY + 2; y < tieY + tailLength; y++) {
        const sway = Math.sin(y * 0.2) * 2;
        const width = Math.max(0, 4 - Math.floor((y - tieY) / 8));
        // Single layer with edge shading for performance
        for (let x = -width; x <= width; x++) {
          // Use position-based shading
          const col = x === -width || x === width ? naturalHairShadow
                    : (x === 0) ? naturalHairHighlight
                    : naturalBaseHair;
          elements.push(<rect key={`tail-${x}-${y}`} x={centerX + x + sway} y={y} width="1" height="1" fill={col} className="pixel" />);
        }
      }
    }
    
    // Render topknot
    if (hairStyle === 'topknot') {
      const knotY = headY - 4;
      const knotSize = 6;
      for (let dy = 0; dy < knotSize; dy++) {
        for (let dx = 0; dx < knotSize; dx++) {
          const dist = Math.sqrt((dx - knotSize/2) ** 2 + (dy - knotSize/2) ** 2);
          if (dist < knotSize/2) {
            const col = dist < knotSize/3 ? hairHighlight : baseHair;
            elements.push(<rect key={`knot-${dx}-${dy}`} x={centerX - knotSize/2 + dx} y={knotY + dy} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }
    
    // Render mohawk
    if (hairStyle === 'mohawk') {
      const mohawkHeight = 8;
      for (let y = headY - mohawkHeight; y < headY + 5; y++) {
        const heightProgress = (y - (headY - mohawkHeight)) / (mohawkHeight + 5);
        const width = Math.max(0, heightProgress < 0.5 ? 2 : 2 - Math.floor(heightProgress * 2));
        // Single layer with shading
        for (let x = -width; x <= width; x++) {
          const col = (x === -width || x === width) ? naturalHairShadow : naturalBaseHair;
          elements.push(<rect key={`mohawk-${x}-${y}`} x={centerX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      // Shaved sides
      for (let y = headY; y < headY + 6; y++) {
        elements.push(
          <rect key={`shave-l-${y}`} x={headX - 2} y={y} width="4" height="1" fill={createShadow(skinTone, 0.9)} className="pixel" />,
          <rect key={`shave-r-${y}`} x={headX + headDim.width - 2} y={y} width="4" height="1" fill={createShadow(skinTone, 0.9)} className="pixel" />
        );
      }
    }
    
    // Render afro
    if (hairStyle === 'afro') {
      const afroRadius = headDim.width / 2 + 6;
      for (let y = headY - 8; y < headY + 12; y++) {
        for (let x = centerX - afroRadius; x <= centerX + afroRadius; x++) {
          const dx = x - centerX;
          const dy = y - (headY + 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < afroRadius && dist > 2) {
            // Better face boundary detection - preserve eyes, nose, mouth area
            const faceTop = headY + 3;
            const faceBottom = headY + headDim.height - 3;
            const faceCenterWidth = headDim.width / 2 - 4;
            const isInFaceArea = y >= faceTop && y <= faceBottom && Math.abs(dx) <= faceCenterWidth;
            
            if (!isInFaceArea) {
              const noise = Math.sin(x * 1.5 + y * 1.5) * 0.5 + Math.cos(x * 2.1 - y * 1.8) * 0.3;
              const layer = dist < afroRadius * 0.6 ? 2 : dist < afroRadius * 0.85 ? 1 : 0;
              const col = layer === 0 ? hairDeepShadow : layer === 1 ? baseHair : noise > 0.2 ? hairHighlight : baseHair;
              
              // Check coverage mask
              const relX = x - headX;
              const relY = y - headY;
              const isTop = relY < 0;
              const isSides = relX < 2 || relX > headDim.width - 2;
              const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
              const isBack = relY >= headDim.height - 2;
              
             const shouldSkip =
               CLIP_HAIR_TO_HEADGEAR && (
                 (coverage.top && isTop) ||
                 (coverage.sides && isSides) ||
                 (coverage.front && isFront) ||
                 (coverage.back && isBack)
               );

              
              if (!shouldSkip) {
                elements.push(<rect key={`afro-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
        }
      }
    }
    
    // Render pageboy cut
    if (hairStyle === 'pageboy') {
      // Single layer with position-based shading
      for (let y = hairTop; y < headY + 8; y++) {
        for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
          const dist = Math.abs(x - centerX);
          let draw = false;
          // Position-based shading for depth
          const xNorm = (x - (headX - 3)) / (headDim.width + 6);
          const col = xNorm < 0.15 ? hairDeepShadow
                    : xNorm > 0.85 ? hairHighlight
                    : baseHair;

          // Even bowl-like shape around head
          if (y < headY + 2) {
            const allowed = (headDim.width / 2 + 3) * thickness;
            if (dist < allowed) draw = true;
          } else if (y >= headY + 2 && y < headY + 6) {
            // Straight cut around ears and nape
            if (dist <= headDim.width / 2 + 1) draw = true;
          }

            // Keep forehead clear
            const faceTop = headY + 1;
            const faceCenterWidth = headDim.width / 2 - 4;
            if (y >= faceTop && y <= headY + 4 && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              // Check coverage mask
              const relX = x - headX;
              const relY = y - headY;
              const isTop = relY < 0;
              const isSides = relX < 2 || relX > headDim.width - 2;
              const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
              const isBack = relY >= headDim.height - 2;
              
            const shouldSkip =
  CLIP_HAIR_TO_HEADGEAR && (
    (coverage.top && isTop) ||
    (coverage.sides && isSides) ||
    (coverage.front && isFront) ||
    (coverage.back && isBack)
  );


            if (!shouldSkip) {
              elements.push(<rect key={`pageboy-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    
    // Render bowl cut
    if (hairStyle === 'bowl_cut') {
      // Single layer with shading
      for (let y = hairTop; y < headY + 5; y++) {
        for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
          const dist = Math.abs(x - centerX);
          let draw = false;
          // Edge shading for depth
          const xNorm = (x - (headX - 4)) / (headDim.width + 8);
          const col = xNorm < 0.2 || xNorm > 0.8 ? naturalHairShadow : naturalBaseHair;

          // Perfect bowl shape
          const bowlRadius = headDim.width / 2 + 2;
          const dy = y - (headY - 1);
          const bowlDist = Math.sqrt(dist * dist + dy * dy);

          if (bowlDist <= bowlRadius && y < headY + 3) {
            draw = true;
          }

          // Clear face area more aggressively
          const faceTop = headY + 2;
          const faceCenterWidth = headDim.width / 2 - 3;
          if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
            draw = false;
          }

          if (draw) {
            // Check coverage mask
            const relX = x - headX;
            const relY = y - headY;
            const isTop = relY < 0;
            const isSides = relX < 2 || relX > headDim.width - 2;
            const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
            const isBack = relY >= headDim.height - 2;

            const shouldSkip =
              CLIP_HAIR_TO_HEADGEAR && (
                (coverage.top && isTop) ||
                (coverage.sides && isSides) ||
                (coverage.front && isFront) ||
                (coverage.back && isBack)
              );

            if (!shouldSkip) {
              elements.push(<rect key={`bowl-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    
    // Render braided bun (combination style) - needs base coverage + elevated bun
    if (hairStyle === 'braided_bun') {
      // Base hair coverage - single layer for performance
      for (let y = hairTop; y < headY + 5; y++) {
        for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
          const dist = Math.abs(x - centerX);
          const xNorm = (x - (headX - 4)) / (headDim.width + 8);
          const col = xNorm < 0.2 || xNorm > 0.8 ? naturalHairShadow : naturalBaseHair;
          let draw = false;

          if (y < headY + 2) {
            const allowed = (headDim.width / 2 + 3) * thickness;
            if (dist < allowed) draw = true;
          } else if (y >= headY + 2 && y < headY + 4) {
            if (dist <= headDim.width / 2 + 1) draw = true;
          }

          const faceTop = headY + 3;
          const faceCenterWidth = headDim.width / 2 - 4;
          if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
            draw = false;
          }

          if (draw) {
            elements.push(<rect key={`braidbun-base-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      
      // Small braids leading to central bun
      const bunY = headY - 5; // Moved higher
      const bunSize = 8; // Made larger
      
      // Draw leading braids
      for (let side = 0; side < 2; side++) {
        const braidX = side === 0 ? centerX - 8 : centerX + 8;
        for (let y = headY; y < bunY + bunSize / 2; y++) {
          const weave = Math.sin(y * 0.8) * 1;
          for (let w = 0; w < 2; w++) {
            const col = w === 0 ? naturalHairShadow : naturalBaseHair;
            elements.push(<rect key={`braidbun-lead-${side}-${w}-${y}`} x={braidX + w + weave} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      
      // Central bun
      for (let dy = 0; dy < bunSize; dy++) {
        for (let dx = 0; dx < bunSize; dx++) {
          const dist = Math.sqrt((dx - bunSize/2) ** 2 + (dy - bunSize/2) ** 2);
          if (dist < bunSize/2) {
            const shade = dist / (bunSize/2);
            const col = shade < 0.3 ? naturalHairHighlight : shade < 0.7 ? naturalBaseHair : naturalHairShadow;
            elements.push(<rect key={`braidbun-${dx}-${dy}`} x={centerX - bunSize/2 + dx} y={bunY + dy} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }

    // Render braided crown - MUST have base hair coverage first
    if (hairStyle === 'braided_crown') {
      // First: render FULL base hair covering the entire scalp
      for (let layer = 0; layer < 3; layer++) {
        for (let y = hairTop - layer; y < headY + 8; y++) {
          for (let x = headX - 6 + layer; x < headX + headDim.width + 6 - layer; x++) {
            const dist = Math.abs(x - centerX);
            let draw = false;
            const col = layer === 0 ? naturalHairDeepShadow : layer === 1 ? naturalBaseHair : naturalHairHighlight;

            // FULL scalp coverage - this is the key fix
            if (y < headY + 2) {
              const allowed = (headDim.width / 2 + 5) * thickness * (1 - (y - hairTop) / 10 * 0.3);
              if (dist < allowed - layer) draw = true;
            } else if (y >= headY + 2 && y < headY + 6) {
              if (dist <= headDim.width / 2 + 3 - layer) draw = true;
            }

            // Only clear the center face area, not the entire forehead
            const faceTop = headY + 3;
            const faceBottom = headY + headDim.height - 2;
            const faceCenterWidth = headDim.width / 2 - 4;
            const isInFaceArea = y >= faceTop && y <= faceBottom && Math.abs(x - centerX) <= faceCenterWidth;
            
            if (isInFaceArea) {
              draw = false;
            }

            if (draw && (!isOld || rand(x + y * 100 + layer * 1000) > 0.35)) {
              elements.push(<rect key={`crownbase-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
      
      // Second: Add the decorative crown braid around the head
      const crownRadius = headDim.width / 2 + 2;
      const crownY = headY - 2;
      
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const braidX = centerX + Math.cos(angle) * crownRadius;
        const braidY = crownY + Math.sin(angle) * crownRadius * 0.4; // Flattened circle
        
        // Braid thickness
        for (let thickness = 0; thickness < 3; thickness++) {
          const offsetX = Math.cos(angle + Math.PI/2) * thickness;
          const offsetY = Math.sin(angle + Math.PI/2) * thickness * 0.5;
          const weave = Math.sin(angle * 6) * 0.5; // Braided pattern
          const col = thickness === 0 ? naturalHairHighlight : thickness === 1 ? naturalBaseHair : naturalHairShadow;
          
          elements.push(<rect key={`crown-${Math.floor(angle*10)}-${thickness}`} 
            x={braidX + offsetX + weave} y={braidY + offsetY} 
            width="1" height="1" fill={col} className="pixel" />);
        }
      }
    }
    
    // Render renaissance rolls
    if (hairStyle === 'renaissance_rolls') {
      // Renaissance rolls: hair pulled back with decorative rolls at temples
      for (let layer = 0; layer < 2; layer++) {
        for (let y = hairTop; y < headY + 6; y++) {
          for (let x = headX - 4 + layer; x < headX + headDim.width + 4 - layer; x++) {
            const dist = Math.abs(x - centerX);
            const col = layer === 0 ? naturalHairShadow : naturalBaseHair;
            let draw = false;

            // Base hair coverage
            if (y < headY + 2) {
              const allowed = (headDim.width / 2 + 3) * thickness;
              if (dist < allowed - layer) draw = true;
            } else if (y >= headY + 2 && y < headY + 4) {
              if (dist <= headDim.width / 2 + 1 - layer) draw = true;
            }

            // Keep center forehead clear for high forehead style
            const faceTop = headY + 2;
            const faceCenterWidth = headDim.width / 2 - 4;
            if (y >= faceTop && y <= headY + 5 && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              elements.push(<rect key={`renaissance-base-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
      
      // Temple rolls - decorative spiral rolls at temples
      for (let side = 0; side < 2; side++) {
        const rollX = side === 0 ? centerX - headDim.width/2 - 1 : centerX + headDim.width/2 + 1;
        const rollY = headY + 1;
        
        // Create spiral roll pattern
        for (let r = 0; r < 3; r++) {
          const radius = 2 + r;
          for (let angle = 0; angle < Math.PI * 2; angle += 0.8) {
            const px = rollX + Math.cos(angle) * radius;
            const py = rollY + Math.sin(angle) * radius * 0.6;
            const col = r === 0 ? naturalHairHighlight : r === 1 ? naturalBaseHair : naturalHairShadow;
            elements.push(<rect key={`roll-${side}-${r}-${Math.floor(angle*10)}`} x={px} y={py} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }
    
    // Render locs/dreadlocks
    if (hairStyle === 'locs') {
      const numLocs = 8 + Math.floor(rand(100) * 4);
      const locPositions: number[] = [];
      
      // Generate loc starting positions
      for (let i = 0; i < numLocs; i++) {
        const angle = (i / numLocs) * Math.PI * 2;
        const radius = headDim.width / 2 - 1;
        const locX = centerX + Math.cos(angle) * radius * 0.8;
        locPositions.push(locX);
      }
      
      // Draw each loc
      locPositions.forEach((locX, i) => {
        const locLength = hairLen === 'long' ? 25 : hairLen === 'medium' ? 18 : 12;
        const thickness = 2 + (i % 2);
        
        for (let y = headY; y < headY + locLength; y++) {
          const sway = Math.sin(y * 0.3 + i) * 1.5;
          const taper = y > headY + locLength - 5 ? (headY + locLength - y) / 5 : 1;
          const width = Math.floor(thickness * taper);
          
          for (let w = 0; w < width; w++) {
            const shade = w === 0 ? hairHighlight : w === width - 1 ? hairShadow : baseHair;
            elements.push(<rect key={`loc-${i}-${y}-${w}`} x={locX + sway + w - width/2} y={y} width="1" height="1" fill={shade} className="pixel" />);
          }
        }
      });
    }
    
    // Default hair rendering for simple/flowing styles - FIXED with full scalp coverage
const defaultCapStyles = new Set([
  'simple','flowing','bob','pixie','crew',
  'wavy','curly','formal','parted','slicked',
  'finger_waves','flapper','pin_curls','pompadour','professional','marcel_waves'
]);
if (defaultCapStyles.has(hairStyle)) {
      // Add helpers for buzz cuts
      const isBuzz = hairLen === 'very_short' || hairStyle === 'crew' || hairStyle === 'pixie';
      const coverThickness = isBuzz ? 1 : thickness;   // ignore age thinning for buzz/crew
      
      for (let layer = 0; layer < 3; layer++) {
        for (let y = hairTop - layer; y < headY + 10; y++) {
          for (let x = headX - 7 + layer; x < headX + headDim.width + 7 - layer; x++) {
          const dist = Math.abs(x - centerX);
          let draw = false;
          let col = layer === 0 ? naturalHairDeepShadow : layer === 1 ? naturalBaseHair : naturalHairHighlight;

          // FULL SCALP COVERAGE - using coverThickness instead of thickness
          if (y < headY + 3) {
            const topProgress = (headY + 3 - y) / (headY + 3 - hairTop);
            const allowed = (headDim.width / 2 + 5) * coverThickness * (1 - topProgress * 0.3);
            if (dist < allowed - layer) draw = true;
          } else if (y >= headY + 3 && y < headY + 8 - layer) {
            // Ensure sides are covered too
            if (dist <= headDim.width / 2 + 3 - layer) draw = true;
          }

          // Only clear center facial features for non-buzz cuts
          const faceTop = headY + 4;
          const faceBottom = headY + headDim.height - 3;
          const faceCenterWidth = headDim.width / 2 - 4;
          const isInFaceArea = y >= faceTop && y <= faceBottom && Math.abs(x - centerX) <= faceCenterWidth;
          
          if (!isBuzz && isInFaceArea) {
            draw = false;
          }

          // Continuous cap for very short / crew cuts: no center gap at the hairline
          if (isBuzz && y <= headY + 3) {
            const allowed = headDim.width / 2 + 3 - layer; // full width across crown
            if (dist < allowed) draw = true;
          }

          // Normal forehead reveal for non-buzz cuts
          if (!isBuzz && revealForehead > 0 && y < headY + revealForehead + 2) {
            const inner = headDim.width / 2 - 4;
            if (Math.abs(x - centerX) < inner) draw = false;
          }

          if (draw && (!isOld || rand(x + y * 100 + layer * 1000) > 0.35)) {
            const p = getHairPattern(x, y);
            if (p > 0.3) col = layer === 2 ? hairBrightHighlight : hairHighlight;
            else if (p < -0.3) col = hairDeepShadow;
            if (rand(x * 10 + y * 100 + layer * 500) > 0.8) col = createHighlight(col, 1.1);
            // Check coverage mask
            const relX = x - headX;
            const relY = y - headY;
            const isTop = relY < 0;
            const isSides = relX < 2 || relX > headDim.width - 2;
            const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
            const isBack = relY >= headDim.height - 2;
            
       const shouldSkip =
  CLIP_HAIR_TO_HEADGEAR && (
    (coverage.top && isTop) ||
    (coverage.sides && isSides) ||
    (coverage.front && isFront) ||
    (coverage.back && isBack)
  );

            
            if (!shouldSkip) {
              elements.push(<rect key={`hair-${layer}-${x}-${y}`} x={x + p * 0.3} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    } // End of default hair styles

    if (['medium', 'long', 'very_long'].includes(hairLen) && (hairStyle === 'simple' || hairStyle === 'flowing')) {
      const hairLengthPixels = hairLen === 'very_long' ? 28 : hairLen === 'long' ? 20 : 12;
      for (let y = headY + 5; y < headY + hairLengthPixels; y++) {
        const progress = (y - headY - 5) / hairLengthPixels;
        const widthReduction = Math.floor(progress * 6);
        const flow = Math.sin(y * 0.15) * 2;

        for (let strand = 0; strand < 3; strand++) {
          const strandOffset = strand * 1.5;
          for (let x = headX - 6 + widthReduction + strandOffset; x <= headX + 4 - strandOffset; x++) {
            const p = getHairPattern(x, y);
            const s = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            let col = strand === 0 ? naturalHairShadow : strand === 1 ? naturalBaseHair : naturalHairHighlight;
            if (s > 0.2 && strand === 2) col = naturalHairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              // Check coverage mask for side hair
              const relX = (x + s * 0.4 + p + flow) - headX;
              const relY = y - headY;
              const isSides = relX < 2 || relX > headDim.width - 2;
              
              if (!(coverage.sides && isSides)) {
                elements.push(<rect key={`hair-left-${strand}-${x}-${y}`} x={x + s * 0.4 + p + flow} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
          for (let x = headX + headDim.width - 4 + strandOffset; x < headX + headDim.width + 6 - widthReduction - strandOffset; x++) {
            const p = getHairPattern(x, y);
            const s = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            let col = strand === 0 ? naturalHairShadow : strand === 1 ? naturalBaseHair : naturalHairHighlight;
            if (s > 0.2 && strand === 2) col = naturalHairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              // Check coverage mask for side hair
              const relX = (x - s * 0.4 - p - flow) - headX;
              const relY = y - headY;
              const isSides = relX < 2 || relX > headDim.width - 2;
              
              if (!(coverage.sides && isSides)) {
                elements.push(<rect key={`hair-right-${strand}-${x}-${y}`} x={x - s * 0.4 - p - flow} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
        }
      }
    }

    return <g key="hair">{elements}</g>;
  }, [hairTexture, hairStyle, baseHair, hairBrightHighlight, hairDeepShadow, hairHighlight, hairShadow, headDim.width, headX, headY, hairLength, isOld, isYoung, skinTone, isFemale, headgearName, appearanceWithDefaults.gender]);

  // ----- EYES (with expression tweaks) -----
  const renderEyes = () => {
    const elements: JSX.Element[] = [];

    const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
    const eyeY = headY + Math.floor(headDim.height * eyeRatioBase);

    const eyeSpacing = Math.floor(headDim.width * 0.24);
    const centerX = headX + Math.floor(headDim.width / 2);
    const leftEyeX = centerX - eyeSpacing - 2;
    const rightEyeX = centerX + eyeSpacing - 1;

    const isFatigued = character.fatigue !== undefined && character.maxFatigue !== undefined && (character.fatigue / character.maxFatigue) < 0.4;
    const isIll = (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) || (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    // Simple eye dimensions
    let eyeWidth = 4;
    let eyeHeight = 2;

    // Adjust for expressions
    if (exprIsSurprised) {
      eyeWidth += 1;
      eyeHeight += 1;
    }

    // Eye whites - single rect per eye
    const eyeWhiteColor = isIll ? '#FFF5F0' : (isFatigued ? '#FFF8F5' : '#FFFFFF');
    elements.push(
      <rect key="eye-white-l" x={leftEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />,
      <rect key="eye-white-r" x={rightEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />
    );

    // Iris - single rect per eye
    const irisColor = appearanceWithDefaults.eyeColor || 'rgb(101, 67, 33)';
    const irisSize = 2;
    let irisOffset = 1; // Center iris by default
    if (gazeDirection === 0) irisOffset = 0; // Look left
    else if (gazeDirection === 2) irisOffset = eyeWidth - irisSize; // Look right

    elements.push(
      <rect key="iris-l" x={leftEyeX + irisOffset} y={eyeY} width={irisSize} height={eyeHeight} fill={irisColor} className="pixel" />,
      <rect key="iris-r" x={rightEyeX + irisOffset} y={eyeY} width={irisSize} height={eyeHeight} fill={irisColor} className="pixel" />
    );

    // Pupil - single rect per eye
    const pupilSize = 1;
    elements.push(
      <rect key="pupil-l" x={leftEyeX + irisOffset + 1} y={eyeY} width={pupilSize} height={pupilSize} fill="#000000" className="pixel" />,
      <rect key="pupil-r" x={rightEyeX + irisOffset + 1} y={eyeY} width={pupilSize} height={pupilSize} fill="#000000" className="pixel" />
    );

    // Eye shine - single pixel highlight for life-like appearance
    elements.push(
      <rect key="shine-l" x={leftEyeX + irisOffset} y={eyeY} width="1" height="1" fill="#FFFFFF" opacity={0.8} className="pixel" />,
      <rect key="shine-r" x={rightEyeX + irisOffset} y={eyeY} width="1" height="1" fill="#FFFFFF" opacity={0.8} className="pixel" />
    );

    // Add tear ducts (inner corner pink pixels)
    const tearDuctColor = '#FFB6C1';
    elements.push(
      <rect key="tear-duct-l" x={leftEyeX + eyeWidth} y={eyeY} width="1" height="1" fill={tearDuctColor} className="pixel" />,
      <rect key="tear-duct-r" x={rightEyeX - 1} y={eyeY} width="1" height="1" fill={tearDuctColor} className="pixel" />
    );

    // Add enhanced eyelashes for women
    if (isFemale) {
      const lashColor = hasGrayHair ? 'rgb(90,90,90)' : baseHair;
      const lashShadow = createShadow(lashColor, 0.7);

      // Top lashes - more prominent with 3 pixels wide
      elements.push(
        <rect key="lash-top-l" x={leftEyeX} y={eyeY - 1} width="3" height="1" fill={lashColor} className="pixel" />,
        <rect key="lash-top-r" x={rightEyeX} y={eyeY - 1} width="3" height="1" fill={lashColor} className="pixel" />,
        // Outer top lash extension for longer lashes
        <rect key="lash-top-outer-l" x={leftEyeX + 3} y={eyeY - 1} width="1" height="1" fill={lashShadow} className="pixel" />,
        <rect key="lash-top-outer-r" x={rightEyeX - 1} y={eyeY - 1} width="1" height="1" fill={lashShadow} className="pixel" />
      );

      // Bottom lashes - shorter and more subtle
      elements.push(
        <rect key="lash-bottom-l" x={leftEyeX + 1} y={eyeY + 1} width="2" height="1" fill={lashShadow} className="pixel" />,
        <rect key="lash-bottom-r" x={rightEyeX + 1} y={eyeY + 1} width="2" height="1" fill={lashShadow} className="pixel" />
      );
    }

    // Simple eyebrows - single line per eyebrow
    const browColor = hasGrayHair ? 'rgb(169,169,169)' : baseHair;
    const browY = eyeY - 3;
    elements.push(
      <rect key="brow-l" x={leftEyeX - 1} y={browY} width="5" height="1" fill={browColor} className="pixel" />,
      <rect key="brow-r" x={rightEyeX - 1} y={browY} width="5" height="1" fill={browColor} className="pixel" />
    );

    // Blinking eyelids - cover eyes when blinking
    if (blinkProgress > 0) {
      const lidHeight = Math.max(1, Math.floor((eyeHeight + 2) * blinkProgress));
      const lidColorTop = createShadow(skinTone, 0.92);
      const lidColorBot = createShadow(skinTone, 0.97);

      elements.push(
        <rect key="lid-l-top" x={leftEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={lidHeight} fill={lidColorTop} className="pixel" />,
        <rect key="lid-r-top" x={rightEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={lidHeight} fill={lidColorTop} className="pixel" />
      );

      if (lidHeight > eyeHeight) {
        const botHeight = lidHeight - eyeHeight;
        elements.push(
          <rect key="lid-l-bot" x={leftEyeX - 1} y={eyeY + eyeHeight} width={eyeWidth + 2} height={botHeight} fill={lidColorBot} className="pixel" />,
          <rect key="lid-r-bot" x={rightEyeX - 1} y={eyeY + eyeHeight} width={eyeWidth + 2} height={botHeight} fill={lidColorBot} className="pixel" />
        );
      }
    }

    return <g key="eyes">{elements}</g>;
  };

  // ----- NOSE -----
  const renderNose = useMemo(() => {
    const elements: JSX.Element[] = [];

    const isIll =
      (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
      (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    const zoneBias = (() => {
      switch (culturalZone) {
        case 'MENA': return { longProb: 0.35, broadProb: 0.25 };
        case 'SOUTH_ASIAN': return { longProb: 0.32, broadProb: 0.2 };
        case 'EAST_ASIAN': return { longProb: 0.25, broadProb: 0.18 };
        case 'SUB_SAHARAN_AFRICAN': return { longProb: 0.28, broadProb: 0.3 };
        case 'EUROPEAN': return { longProb: 0.3, broadProb: 0.22 };
        default: return { longProb: 0.3, broadProb: 0.22 };
      }
    })();

    const rW = rand(901) + (isOld ? 0.05 : 0) + (isFemale ? -0.02 : 0);
    const rL = rand(902) + (isOld ? 0.08 : 0);
    const wide = rW < zoneBias.broadProb ? 1 : 0;
    const long = rL < zoneBias.longProb ? 1 : 0;

    const declared = appearanceWithDefaults.noseShape || 'straight';
    let widthMul = 1, lengthMul = 1, bump = 0, tipUp = 0;
    switch (declared) {
      case 'aquiline': bump = 1; lengthMul += 0.2; break;
      case 'broad': widthMul += 0.35; break;  // Increased from 0.25 to make broader noses wider
      case 'button': widthMul += 0.25; break;  // Button noses use old broad nose width
      case 'roman': bump = 1; lengthMul += 0.15; break;
    }
    if (wide) widthMul += 0.15;
    if (long) lengthMul += 0.15;

    const noseX = headX + Math.floor(headDim.width / 2) - 1;
    const mouthY = headY + Math.floor(headDim.height * 0.72);
    const eyeY = headY + Math.floor(headDim.height * (hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35));

    const noseStartY = eyeY + 4;
    const maxLenToPhiltrum = Math.max(3, mouthY - 2 - noseStartY);
    const noseLen = Math.min(maxLenToPhiltrum, Math.round((5 + (long ? 2 : 0) + (isOld ? 1 : 0)) * lengthMul));
    const noseWidth = Math.max(3, Math.round((declared === 'broad' ? 4 : 3) * widthMul));

    // Nose bridge highlights
    for (let i = 0; i < Math.max(1, noseLen - 2); i++) {
      elements.push(
        <rect key={`nbh-${i}`} x={noseX + 1} y={noseStartY - 1 + i} width="1" height="1" fill={i < 2 ? skinHighlight : skinMidtone} className="pixel" />
      );
    }
    if (bump) {
      elements.push(
        <rect key="bump-1" x={noseX + 1} y={noseStartY + Math.floor(noseLen / 3)} width="2" height="1" fill={skinTone} className="pixel" />
      );
    }

    elements.push(
      <rect key="nose-body" x={noseX} y={noseStartY} width={Math.max(1, noseWidth - 1)} height={noseLen} fill={skinTone} className="pixel" />
    );

    // Side shadows for nose
    elements.push(
      <rect key="nose-side-l" x={noseX - 1} y={noseStartY + 1} width="1" height={Math.max(1, noseLen - 1)} fill={skinShadow} className="pixel" />,
      <rect key="nose-side-r" x={noseX + noseWidth - 1} y={noseStartY + 1} width="1" height={Math.max(1, noseLen - 2)} fill={skinHighlight} className="pixel" />
    );

    const tipY = noseStartY + noseLen - 1;
    const tipHL = skinBrightHighlight;

    if (isIll) {
      elements.push(
        <rect key="red-nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill="rgba(255, 120, 120, 0.6)" className="pixel" />,
        <rect key="red-nose-area" x={noseX} y={tipY - 1} width={noseWidth} height="2" fill="rgba(255, 140, 140, 0.3)" className="pixel" />
      );
    }

    elements.push(
      <rect key="nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill={isIll ? "rgba(255, 180, 180, 0.8)" : tipHL} className="pixel" />,
      // Additional highlight pixel for more rounded nose tip
      <rect key="nose-tip-extra" x={noseX + Math.floor(noseWidth / 2) + 1} y={tipY} width="1" height="1" fill={skinHighlight} opacity="0.8" className="pixel" />
    );

    const nostrilY = Math.min(tipY + 1, mouthY - 2);

    elements.push(
      <rect key="nostril-l" x={noseX} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="nostril-r" x={noseX + noseWidth - 2} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="subnasal-shadow" x={noseX + 1} y={nostrilY + 1} width={Math.max(1, noseWidth - 3)} height="1" fill={isIll ? "rgba(255, 160, 160, 0.4)" : skinShadow} className="pixel" />
    );

    // ----- ENHANCED NOSTRIL DEFINITION & NOSE BRIDGE GRADIENT -----
    const nostrilShadow = createShadow(actualSkinTone, 0.85);
    const noseBridgeHighlight = createHighlight(actualSkinTone, 1.15);
    const nostrilSubtle = createShadow(actualSkinTone, 0.92);

    // Enhanced nostril definition with depth - positioned inside nose area
    elements.push(
      <rect key="nostril-depth-l" x={noseX} y={nostrilY - 1} width="1" height="1" fill={nostrilShadow} opacity="0.4" className="pixel" />,
      <rect key="nostril-depth-r" x={noseX + noseWidth - 2} y={nostrilY - 1} width="1" height="1" fill={nostrilShadow} opacity="0.4" className="pixel" />
    );

    // Add sophisticated color-aware shadow directly under the nose (philtrum area)
    const underNoseShadow = createShadow(actualSkinTone, 0.85);  // Darker, more visible shadow
    const underNoseDeepShadow = createShadow(actualSkinTone, 0.78); // Even darker for center

    // Gradient shadow under nose - darker in center, lighter at edges
    for (let dx = 0; dx < noseWidth - 1; dx++) {
      const centerDist = Math.abs(dx - (noseWidth - 1) / 2);
      const isCenter = centerDist < 1;
      const shadowColor = isCenter ? underNoseDeepShadow : underNoseShadow;
      elements.push(
        <rect key={`under-nose-shadow-${dx}`} x={noseX + dx} y={nostrilY + 2} width="1" height="1" fill={shadowColor} className="pixel" />
      );
    }

    // Subtle nostril rim highlighting for more realistic form
    if (!isIll) {
      elements.push(
        <rect key="nostril-rim-l" x={noseX + 1} y={nostrilY} width="1" height="1" fill={nostrilSubtle} opacity="0.3" className="pixel" />,
        <rect key="nostril-rim-r" x={noseX + noseWidth - 3} y={nostrilY} width="1" height="1" fill={nostrilSubtle} opacity="0.3" className="pixel" />
      );
    }

    // Nose bridge highlight gradient for dimensional depth
    const bridgeStartY = noseStartY + 1;
    const bridgeLength = Math.min(3, Math.floor(noseLen * 0.6));
    for (let i = 0; i < bridgeLength; i++) {
      const intensity = 1 - (i / bridgeLength) * 0.6; // Fade from bright to subtle
      elements.push(
        <rect key={`bridge-highlight-${i}`} x={noseX + 1} y={bridgeStartY + i} width="1" height="1"
          fill={noseBridgeHighlight} opacity={0.1 * intensity} className="pixel" />  // Reduced from 0.3 to 0.1
      );
    }

    return <g key="nose">{elements}</g>;
  }, [appearanceWithDefaults.noseShape, culturalZone, hairLength, headDim.height, headDim.width, headX, headY, isFemale, isOld, skinBrightHighlight, skinDeepShadow, skinHighlight, skinMidtone, skinShadow, skinTone, actualSkinTone, character.health, character.maxHealth, character.diseaseHealth]);

    // ----- MOUTH (expression-driven, with proper smile/smirk/frown/pursed) -----
  // ----- MOUTH (expression-driven, with proper smile/smirk/frown/pursed) -----
  const renderMouth = useMemo(() => {
    const elements: JSX.Element[] = [];
    const lipShape = appearanceWithDefaults.lipShape || 'medium';

    const mouthX = headX + Math.floor(headDim.width / 2);
    const mouthY = headY + Math.floor(headDim.height * 0.72);

    const isFatigued =
      character.fatigue !== undefined && character.maxFatigue !== undefined &&
      (character.fatigue / character.maxFatigue) < 0.4;

    const isIll =
      (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
      (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    const baseLip = appearanceWithDefaults.lipColor || ((): string => {
      const map: Record<NonNullable<typeof appearanceWithDefaults.skinTone>, string> = {
        very_pale: '#E8B4B8', pale: '#E0A5A8', fair: '#D89598', light: '#CE8588',
        medium: '#C47578', olive: '#BA6568', tan: '#B05558', dark: '#A64548', very_dark: '#9C3538'
      };
      return map[appearanceWithDefaults.skinTone || 'medium'] || '#C47578';
    })();

    let lipColor = isIll ? createShadow(baseLip, 0.85) : baseLip;

    // Women have slightly redder lips on average
    if (isFemale) {
      lipColor = createHighlight(lipColor, 1.05); // Very subtle red enhancement
    }

    if (isOld) {
      // Lips lose color with age - make them closer to skin tone
      lipColor = createShadow(lipColor, 0.85);
    } else if (isYoung) {
      // Natural pinkish tint for young people
      lipColor = createHighlight(lipColor, 1.1);
    }

    let actualExpressionType = expressionType;
    if ((isFatigued || isIll) && actualExpressionType !== 1) {
      actualExpressionType = 2;
    }

    let halfW = 3;
    if (lipShape === 'wide') halfW = 4;
    if (lipShape === 'thin') halfW = Math.max(2, halfW);

    if (isOld) {
      halfW = Math.max(2, halfW - 1);
    } else if (isYoung) {
      halfW = halfW + 1;
    }

    if (!isFemale) {
      halfW = Math.floor(halfW * 0.9);
    }

    let pixelCounter = 0;
    const px = (dx: number, dy: number, fill: string) => {
      elements.push(
        <rect key={`m-${dx}-${dy}-${pixelCounter++}`} x={mouthX + dx} y={mouthY + dy} width="1" height="1" fill={fill} className="pixel" />
      );
    };

    const curve = (dx: number): number => {
      const t = dx / halfW;
      switch (actualExpressionType) {
        case 1:
          if (exprIsSmirk) {
            const rightLift = Math.round(1.5 * (t > 0 ? t : 0));
            return (t < -0.6 ? 0 : t < -0.2 ? 0 : t < 0.2 ? 0 : 1) - rightLift;
          }
          return Math.round(-1.2 * (1 - Math.abs(t)));
        case 2:
          return Math.round(1.2 * (1 - Math.abs(t)));
        case 4:
          return (Math.abs(dx) <= 1) ? 0 : (Math.abs(dx) === halfW ? 0 : 0);
        default:
          return 0;
      }
    };

    // Clear mouth area but preserve the space above for under-nose shadow
    for (let y = -1; y <= 3; y++) {  // Changed from -2 to -1 to preserve under-nose shadow
      for (let x = -halfW - 1; x <= halfW + 1; x++) {
        px(x, y, skinTone);
      }
    }

    // Use lighter shadows for more natural lip colors
    const upperLipColor = createShadow(lipColor, isFemale ? 0.95 : 0.98);
    const lowerLipColor = lipColor;  // No shadow for lower lip - use base color

    // Enhanced lip rendering with better definition
    for (let dx = -halfW; dx <= halfW; dx++) {
      const cy = curve(dx);

      // Upper lip with proper cupid's bow shape
      const isCenter = Math.abs(dx) <= 1;
      const isSide = Math.abs(dx) >= halfW - 1;

      // Upper lip
      if (isCenter) {
        px(dx, cy - 1, createShadow(upperLipColor, 0.92));  // Philtrum area
      }
      px(dx, cy, upperLipColor);

      // Lower lip with volume
      px(dx, cy + 1, lowerLipColor);

      // Full lips get extra volume (but not extending below lip)
      if ((lipShape === 'full' || lipShape === 'bow' || isYoung) && !isOld) {
        if (actualExpressionType !== 4 && !isSide) {
          px(dx, cy + 2, createShadow(lowerLipColor, 0.98));  // Still lip color but very subtle
        }
      }
    }

    // Philtrum definition
    px(0, -2, createShadow(skinTone, 0.94));
    px(0, -3, createShadow(skinTone, 0.97));
    px(-1, -2, createShadow(skinTone, 0.96));
    px(1, -2, createShadow(skinTone, 0.96));

    // Subtle mouth corners
    px(-halfW - 1, 1, createShadow(skinTone, 0.94));  // Very light corner shadows
    px(halfW + 1, 1, createShadow(skinTone, 0.94));   // Very light corner shadows

    if (actualExpressionType === 1) {
      if (exprIsSmirk) {
        px(halfW + 2, -1, createShadow(skinTone, 0.88));
      } else {
        px(-halfW - 2, -1, createShadow(skinTone, 0.88));
        px(halfW + 2, -1, createShadow(skinTone, 0.88));
      }
      px(-halfW - 1, -2, createHighlight(skinTone, 1.05));
      px(halfW + 1, -2, createHighlight(skinTone, 1.05));
    } else if (actualExpressionType === 2) {
      if (temporaryExpression === 'scowl') {
        px(-halfW - 1, 3, createShadow(skinTone, 0.82));
        px(halfW + 1, 3, createShadow(skinTone, 0.82));
      }
    } else if (actualExpressionType === 4) {
      px(0, 0, createShadow(lipColor, 0.75));
      px(0, 1, createShadow(lipColor, 0.75));
    }

    // Central lip highlights for volume
    if (lipShape !== 'thin' && !isOld) {
      px(0, 1, createHighlight(lipColor, 1.15));  // Center highlight
      px(0, 2, createHighlight(lipColor, 1.08));  // Lower lip center
      if (isFemale || isYoung) {
        // Side highlights for fuller lips
        const sideHighlight = createHighlight(lowerLipColor, 1.08);
        px(-1, 1, sideHighlight);
        px(1, 1, sideHighlight);
        px(-1, 2, sideHighlight);
        px(1, 2, sideHighlight);
      }
    }

    // Add sophisticated under-nose shadow (re-add since mouth area gets cleared)
    // This creates the philtrum shadow between nose and upper lip
    const underNoseShadowLight = createShadow(actualSkinTone, 0.80);  // Medium shadow
    const underNoseShadowDark = createShadow(actualSkinTone, 0.70); // Dark center
    const underNoseShadowDeepest = createShadow(actualSkinTone, 0.60); // Very dark center
    for (let dx = -Math.floor(halfW * 0.7); dx <= Math.floor(halfW * 0.7); dx++) {
      const centerDist = Math.abs(dx);
      let shadowColor: string;
      if (centerDist === 0) shadowColor = underNoseShadowDeepest; // Darkest at center
      else if (centerDist <= 2) shadowColor = underNoseShadowDark; // Dark near center
      else shadowColor = underNoseShadowLight; // Lighter at edges
      px(dx, -2, shadowColor);  // Under nose shadow at y=-2
    }

    // Add sophisticated color-aware shadow under the lower lip with gradient
    const lipBottomY = lipShape === 'full' || lipShape === 'bow' || isYoung ? 3 : 2;
    const underLipShadowLight = createShadow(actualSkinTone, 0.88);  // Light edge shadow
    const underLipShadowMedium = createShadow(actualSkinTone, 0.78); // Medium shadow
    const underLipShadowDark = createShadow(actualSkinTone, 0.68); // Dark center shadow
    const underLipShadowDeepest = createShadow(actualSkinTone, 0.58); // Very dark center

    // Gradient shadow - darkest in center where lip casts most shadow
    for (let dx = -halfW; dx <= halfW; dx++) {
      const centerDist = Math.abs(dx);
      let shadowColor: string;

      if (centerDist === 0) {
        shadowColor = underLipShadowDeepest; // Darkest at exact center
      } else if (centerDist <= 1) {
        shadowColor = underLipShadowDark; // Very dark near center
      } else if (centerDist <= 3) {
        shadowColor = underLipShadowMedium; // Medium dark
      } else {
        shadowColor = underLipShadowLight; // Lighter at edges
      }

      elements.push(
        <rect key={`under-lip-${dx}`} x={mouthX + dx} y={mouthY + lipBottomY} width="1" height="1" fill={shadowColor} className="pixel" />
      );
    }

    return <g key="mouth">{elements}</g>;
  }, [
    appearanceWithDefaults.lipShape,
    appearanceWithDefaults.lipColor,
    appearanceWithDefaults.skinTone,
    character.fatigue,
    character.maxFatigue,
    character.health,
    character.maxHealth,
    character.diseaseHealth,
    expressionType,
    temporaryExpression,
    headDim.height,
    headDim.width,
    headX,
    headY,
    skinTone
  ]);

  // ----- FACIAL HAIR (unchanged) -----
  const renderFacialHair = useMemo(() => {
    if (!appearanceWithDefaults.facialHair || isFemale) return <g key="facial-hair" />;
    const elements: JSX.Element[] = [];
    const style = appearanceWithDefaults.facialHairStyle || 'full_beard';
    const thickness = appearanceWithDefaults.facialHairThickness || 'medium';
    const beardColor = hasGrayHair ? 'rgb(192,192,192)' : baseHair;
    const beardShadow = createShadow(beardColor, 0.7);
    const beardDeepShadow = createShadow(beardColor, 0.5);
    const beardHighlight = createHighlight(beardColor, 1.15);

    const baseY = headY + Math.floor(headDim.height * 0.63);
    const mouthY = headY + Math.floor(headDim.height * 0.72);

    const densityBase = thickness === 'thick' ? 0.85 : thickness === 'sparse' ? 0.45 : 0.65;
    const chinWidth = Math.floor(headDim.width * 0.55);

    // ENHANCED STUBBLE RENDERING
    if (style === 'stubble') {
      const centerX = headX + Math.floor(headDim.width / 2);
      const stubbleDensity = thickness === 'thick' ? 0.7 : thickness === 'sparse' ? 0.3 : 0.5;
      
      renderStubble({
        elements,
        headX,
        headY,
        headW: headDim.width,
        headH: headDim.height,
        centerX,
        skinTone,
        hairColor: beardColor,
        density: stubbleDensity,
        seed: character.portraitSeed || seed || 1234
      });
    } else if (style === 'full_beard') {
      const mustacheY = mouthY - 2;  // Position mustache above mouth, not covering it
      // Improved thickness for full beard mustache
      const mustacheThickness = thickness === 'thick' ? 2 : 1;  // Reduced thickness to not cover nose
      for (let t = 0; t < mustacheThickness; t++) {
        const width = 13 - t; // Wider mustache
        const startI = -Math.floor(width / 2);
        const endI = Math.floor(width / 2);
        for (let i = startI; i <= endI; i++) {
          // Better color gradient
          const centerDist = Math.abs(i);
          const col = centerDist <= 1 ? beardHighlight :
                     centerDist >= 4 ? beardShadow :
                     beardColor;
          elements.push(<rect key={`fb-m-${t}-${i}`} x={headX + Math.floor(headDim.width / 2) + i} y={mustacheY + t} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      // Start beard lower to leave space for mouth
      for (let y = 2; y < 16; y++) {  // Changed from -2 to 2 to start lower
        const rowY = baseY + y;
        const isNearMouth = y >= 2 && y <= 4;  // Adjusted mouth gap area
        let rowWidth;
        if (y < 2) rowWidth = Math.floor(chinWidth * 0.8);
        else if (y < 8) rowWidth = Math.floor(chinWidth * 1.2);  // Wider beard
        else rowWidth = Math.max(0, Math.floor(chinWidth * (1.2 - (y - 8) / 30)));

        const startX = headX + Math.floor((headDim.width - rowWidth) / 2);

        for (let x = 0; x < rowWidth; x++) {
          const xRatio = x / rowWidth;
          if (isNearMouth) {
            const centerDist = Math.abs(xRatio - 0.5);
            if (centerDist < 0.25) continue;  // Wider gap for mouth visibility
          }
          let col = beardColor;
          if (xRatio < 0.15 || xRatio > 0.85) col = beardDeepShadow;
          else if (xRatio < 0.3 || xRatio > 0.7) col = beardShadow;
          else if (xRatio > 0.45 && xRatio < 0.55) col = beardHighlight;
          if (y > 12) col = beardDeepShadow;
          if (y < 1) col = beardShadow;
          elements.push(<rect key={`fb-${x}-${y}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      for (let sy = -6; sy < 6; sy++) {
        const sideWidth = sy < -2 ? 2 : sy < 2 ? 3 : 4;
        for (let sx = 0; sx < sideWidth; sx++) {
          const leftX = headX - sx - 1;
          const rightX = headX + headDim.width + sx;
          const col = sx === 0 ? beardColor : sx === 1 ? beardShadow : beardDeepShadow;
          elements.push(
            <rect key={`sb-l-${sy}-${sx}`} x={leftX} y={baseY + sy} width="1" height="1" fill={col} className="pixel" />,
            <rect key={`sb-r-${sy}-${sx}`} x={rightX} y={baseY + sy} width="1" height="1" fill={col} className="pixel" />
          );
        }
      }
    } else if (style === 'goatee' || style === 'van_dyke') {
      const my = mouthY - 1;
      // Better thickness for goatee/van dyke mustaches
      const mustacheThickness = thickness === 'thick' ? 3 : thickness === 'medium' ? 2 : 1;
      for (let t = 0; t < mustacheThickness; t++) {
        const baseW = style === 'goatee' ? 8 : 10;
        const w = baseW - Math.floor(t * 0.5); // Slight taper
        const mx = headX + Math.floor(headDim.width / 2) - Math.floor(w / 2);
        for (let i = 0; i < w; i++) {
          // Enhanced color variation
          const centerDist = Math.abs(i - w/2);
          const col = centerDist < 1 ? beardHighlight :
                     (i < 2 || i >= w - 2) ? beardShadow :
                     beardColor;
          elements.push(<rect key={`gt-m-${t}-${i}`} x={mx + i} y={my + t} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      for (let y = 0; y < 8; y++) {
        const width = Math.max(2, 8 - y);
        const startX = headX + Math.floor(headDim.width / 2) - Math.floor(width / 2);
        for (let x = 0; x < width; x++) {
          let col = beardColor;
          if (x === 0 || x === width - 1) col = beardShadow;
          else if (x === Math.floor(width/2)) col = beardHighlight;
          else if (y > 5) col = beardDeepShadow;
          elements.push(<rect key={`gt-${x}-${y}`} x={startX + x} y={mouthY + 2 + y} width="1" height="1" fill={col} className="pixel" />);
        }

        // Add shadow blending pixels around goatee edges for softer transition
        if (y >= 5) {
          // Left edge blend
          const leftBlendX = startX - 1;
          const blendColor = mix(skinTone, beardDeepShadow, 0.5);
          elements.push(<rect key={`gt-blend-l-${y}`} x={leftBlendX} y={mouthY + 2 + y} width="1" height="1" fill={blendColor} className="pixel" />);

          // Right edge blend
          const rightBlendX = startX + width;
          elements.push(<rect key={`gt-blend-r-${y}`} x={rightBlendX} y={mouthY + 2 + y} width="1" height="1" fill={blendColor} className="pixel" />);
        }
      }

      // Add under-chin shadow transition for goatee
      const chinBottomY = mouthY + 10;
      for (let x = -3; x <= 3; x++) {
        const shadowIntensity = 0.7 - Math.abs(x) * 0.1;
        const shadowColor = createShadow(skinTone, shadowIntensity);
        elements.push(
          <rect key={`gt-chin-shadow-${x}`} x={headX + Math.floor(headDim.width / 2) + x} y={chinBottomY} width="1" height="1" fill={shadowColor} className="pixel" />
        );
      }
      if (style === 'goatee') {
        for (let side = 0; side < 2; side++) {
          const sideX = side === 0 ?
            headX + Math.floor(headDim.width / 2) - 4 :
            headX + Math.floor(headDim.width / 2) + 3;
          for (let y = 0; y < 2; y++) {
            elements.push(
              <rect key={`gt-conn-${side}-${y}`} x={sideX} y={mouthY + y} width="2" height="1" fill={beardShadow} className="pixel" />
            );
          }
        }
      }
    } else if (style === 'mutton_chops') {
      for (let y = -8; y < 4; y++) {
        for (let side = 0; side < 2; side++) {
          const sideX = side === 0 ? headX - 2 : headX + headDim.width + 1;
          const width = y < -4 ? 2 : y < 0 ? 3 : 4;
          for (let w = 0; w < width; w++) {
            if (rand(w + y * 100 + side * 1000) < densityBase) {
              const cx = side === 0 ? sideX - w : sideX + w;
              elements.push(<rect key={`chop-${side}-${w}-${y}`} x={cx} y={baseY + y} width="1" height="1" fill={y < 0 ? beardHighlight : beardColor} className="pixel" />);
            }
          }
        }
      }
    } else if (style === 'soul_patch') {
      // Position soul patch below the mouth, not overlapping
      const patchStartY = mouthY + 4;  // Start below the lower lip
      for (let y = 0; y < 3; y++) {
        for (let x = -1; x < 2; x++) {
          const px = headX + Math.floor(headDim.width / 2) + x;
          elements.push(<rect key={`sp-${x}-${y}`} x={px} y={patchStartY + y} width="1" height="1" fill={beardColor} className="pixel" />);
        }
      }
    } else if (style === 'mustache') {
      const my = mouthY - 1;
      // Enhanced thickness based on setting
      const mustacheHeight = thickness === 'thick' ? 3 : thickness === 'medium' ? 2 : 1;
      const baseWidth = 11; // Wider base for symmetrical look
      const centerX = headX + Math.floor(headDim.width / 2);

      for (let t = 0; t < mustacheHeight; t++) {
        // Keep width consistent for better shape
        const w = baseWidth - Math.floor(t * 0.5); // Subtle taper

        // Render left and right halves symmetrically
        for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
          const absX = Math.abs(dx);
          const droop = absX > 4 ? 1 : 0; // Natural droop at edges

          // Enhanced shading
          let col = beardColor;
          if (absX <= 1) {
            col = beardHighlight; // Center highlight
          } else if (absX >= 5) {
            col = beardShadow; // Edge shadows
          }

          // Always render pixels for fuller, more consistent mustache
          elements.push(
            <rect key={`mustache-${t}-${dx}`} x={centerX + dx} y={my + t + droop} width="1" height="1" fill={col} className="pixel" />
          );
        }
      }

      // Add subtle underlip shadow for depth
      // centerX already declared above
      for (let dx = -4; dx <= 4; dx++) {
        if (rand(dx * 23) < densityBase * 0.7) {
          const shadowY = my + mustacheHeight;
          elements.push(<rect key={`mustache-shadow-${dx}`} x={centerX + dx} y={shadowY} width="1" height="1" fill={beardDeepShadow} className="pixel" />);
        }
      }
    } else if (style === 'imperial') {
      // Imperial mustache (Napoleon III style) - wide with upward curls
      const my = mouthY - 1;
      const centerX = headX + Math.floor(headDim.width / 2);
      // Main mustache body
      for (let dx = -6; dx <= 6; dx++) {
        const thick = thickness === 'thick' ? 2 : 1;
        for (let t = 0; t < thick; t++) {
          elements.push(<rect key={`imp-m-${dx}-${t}`} x={centerX + dx} y={my + t} width="1" height="1" fill={beardColor} className="pixel" />);
        }
      }
      // Upward curls at ends
      for (let curl = 0; curl < 3; curl++) {
        elements.push(
          <rect key={`imp-curl-l-${curl}`} x={centerX - 7 - curl} y={my - curl} width="1" height="1" fill={beardHighlight} className="pixel" />,
          <rect key={`imp-curl-r-${curl}`} x={centerX + 7 + curl} y={my - curl} width="1" height="1" fill={beardHighlight} className="pixel" />
        );
      }
      // Small chin beard
      for (let y = 0; y < 4; y++) {
        const width = Math.max(1, 3 - y);
        for (let x = 0; x < width; x++) {
          elements.push(<rect key={`imp-chin-${x}-${y}`} x={centerX - Math.floor(width/2) + x} y={mouthY + 2 + y} width="1" height="1" fill={beardColor} className="pixel" />);
        }
      }
    } else if (style === 'handlebar') {
      // Handlebar mustache - thick with dramatic curls
      const my = mouthY - 1;
      const centerX = headX + Math.floor(headDim.width / 2);
      // Thick center
      for (let dx = -5; dx <= 5; dx++) {
        for (let t = 0; t < 2; t++) {
          const col = Math.abs(dx) < 2 ? beardHighlight : beardColor;
          elements.push(<rect key={`hb-m-${dx}-${t}`} x={centerX + dx} y={my + t} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      // Extended curled ends
      for (let ext = 0; ext < 5; ext++) {
        const curve = Math.floor(Math.sin(ext * 0.5) * 2);
        elements.push(
          <rect key={`hb-ext-l-${ext}`} x={centerX - 6 - ext} y={my - curve} width="1" height="1" fill={beardColor} className="pixel" />,
          <rect key={`hb-ext-r-${ext}`} x={centerX + 6 + ext} y={my - curve} width="1" height="1" fill={beardColor} className="pixel" />
        );
      }
    } else if (style === 'forked_beard') {
      // Medieval/Renaissance forked beard
      const centerX = headX + Math.floor(headDim.width / 2);
      // Mustache
      for (let dx = -5; dx <= 5; dx++) {
        elements.push(<rect key={`fork-m-${dx}`} x={centerX + dx} y={mouthY - 1} width="1" height="1" fill={beardColor} className="pixel" />);
      }
      // Main beard that splits
      for (let y = 0; y < 10; y++) {
        if (y < 5) {
          // United upper portion
          const width = 8 - Math.floor(y * 0.5);
          for (let x = 0; x < width; x++) {
            const col = x === Math.floor(width/2) ? beardHighlight : beardColor;
            elements.push(<rect key={`fork-main-${x}-${y}`} x={centerX - Math.floor(width/2) + x} y={mouthY + 1 + y} width="1" height="1" fill={col} className="pixel" />);
          }
        } else {
          // Forked lower portion
          const forkOffset = Math.floor((y - 5) * 0.8) + 2;
          const forkWidth = 4;
          // Left fork
          for (let x = 0; x < forkWidth; x++) {
            elements.push(<rect key={`fork-l-${x}-${y}`} x={centerX - forkOffset - forkWidth + x} y={mouthY + 1 + y} width="1" height="1" fill={beardColor} className="pixel" />);
          }
          // Right fork
          for (let x = 0; x < forkWidth; x++) {
            elements.push(<rect key={`fork-r-${x}-${y}`} x={centerX + forkOffset + x} y={mouthY + 1 + y} width="1" height="1" fill={beardColor} className="pixel" />);
          }
        }
      }
    } else if (style === 'chin_curtain') {
      // Amish/Lincoln style - beard along jawline, no mustache
      const centerX = headX + Math.floor(headDim.width / 2);
      // Sideburns connecting to jaw beard
      for (let y = -5; y < 15; y++) {
        // Side portions
        for (let side = 0; side < 2; side++) {
          const sideX = side === 0 ? headX - 1 : headX + headDim.width;
          const width = y < 0 ? 2 : y < 8 ? 3 : 4;
          for (let w = 0; w < width; w++) {
            const px = side === 0 ? sideX - w : sideX + w;
            if (y > -3 || w < 2) { // Taper at top
              elements.push(<rect key={`curtain-${side}-${w}-${y}`} x={px} y={baseY + y} width="1" height="1" fill={y < 0 ? beardShadow : beardColor} className="pixel" />);
            }
          }
        }
        // Bottom chin connection
        if (y > 8) {
          const chinWidth = headDim.width - 2;
          for (let x = 0; x < chinWidth; x++) {
            if (Math.abs(x - chinWidth/2) > 2) { // Leave center gap for authentic look
              elements.push(<rect key={`curtain-chin-${x}-${y}`} x={headX + 1 + x} y={baseY + y} width="1" height="1" fill={beardDeepShadow} className="pixel" />);
            }
          }
        }
      }
    } else if (style === 'verdi') {
      // Verdi beard - short rounded beard with styled mustache
      const centerX = headX + Math.floor(headDim.width / 2);
      // Styled mustache with slight separation from beard
      for (let dx = -6; dx <= 6; dx++) {
        const col = Math.abs(dx) < 2 ? beardHighlight : beardColor;
        elements.push(<rect key={`verdi-m-${dx}`} x={centerX + dx} y={mouthY - 1} width="1" height="1" fill={col} className="pixel" />);
      }
      // Gap between mustache and beard
      // (intentionally left empty for mouthY row)
      // Short, rounded beard
      for (let y = 1; y < 8; y++) {
        const radius = Math.max(2, 7 - y);
        for (let x = -radius; x <= radius; x++) {
          // Create rounded shape
          const dist = Math.sqrt(x * x + (y - 4) * (y - 4));
          if (dist <= radius) {
            let col = beardColor;
            if (x === 0) col = beardHighlight;
            else if (Math.abs(x) === radius) col = beardShadow;
            elements.push(<rect key={`verdi-b-${x}-${y}`} x={centerX + x} y={mouthY + y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }

    return <g key="facial-hair">{elements}</g>;
  }, [appearanceWithDefaults.facialHair, appearanceWithDefaults.facialHairStyle, appearanceWithDefaults.facialHairThickness, baseHair, hasGrayHair, headDim.height, headDim.width, headX, headY, isFemale]);

  // ----- BODY / CLOTHING -----
  const renderBody = useMemo(() => {
    const elements: JSX.Element[] = [];
    const neckY = headY + headDim.height;
    const neckHeight = 5;
    const bodyStartY = neckY + neckHeight;
    const bodyHeight = 64 - bodyStartY;

    const neckWidth = Math.floor(headDim.width * 0.55);
    for (let y = 0; y < neckHeight; y++) {
      // More gradual neck widening for smoother shoulder transition
      const progressToShoulder = y / neckHeight;
      const nw = Math.floor(neckWidth + (bodyDim.shoulderWidth * 0.7 - neckWidth) * Math.pow(progressToShoulder, 1.5));
      const nx = headX + Math.floor((headDim.width - nw) / 2);

      for (let x = 0; x < nw; x++) {
        let col = skinTone;
        const xr = x / nw;

        // Smoother jaw-to-neck transition
        if (y === 0) {
          // First row of neck gets special blending with jaw
          col = createShadow(col, 0.97);  // Very subtle shadow for smooth transition
        }

        // Smoother shading with more gradual transitions
        if (xr < 0.2) col = skinHighlight;
        else if (xr < 0.35) col = mix(skinHighlight, skinTone, 0.5);
        else if (xr > 0.8) col = skinShadow;
        else if (xr > 0.65) col = mix(skinTone, skinShadow, 0.5);
        else if (stats.strength >= 7) {
          if (xr > 0.3 && xr < 0.4) col = createHighlight(skinTone, 1.05);
          else if (xr > 0.6 && xr < 0.7) col = createShadow(skinTone, 0.95);
        }

        // small hollow under chin (dithered, not a harsh stripe)
        if (y === 0 && (x % 3 === 0)) col = createShadow(col, 0.9);

        // Add subtle transition shading at neck-shoulder junction
        if (y >= neckHeight - 2) {
          col = mix(col, skinMidtone, 0.3);
        }

        elements.push(<rect key={`neck-${x}-${y}`} x={nx + x} y={neckY + y} width="1" height="1" fill={col} className="pixel" />);
      }
    }

    // Debug logging - commented out for production
    /*
    console.log('[Portrait] Garment Debug:', {
      useEquippedItems,
      hasEquippedItems: !!character.equippedItems,
      equippedTorso: character.equippedItems?.torso,
      appearanceGarment: appearanceWithDefaults.garment,
    });
    */
    
    // If we should use equipped items and equippedItems exists, use that (even if slot is empty)
    // Only fall back to appearance if equippedItems doesn't exist at all
    let garment = null;
    let cloakItem = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      // Use equipped torso item (which may be undefined if nothing equipped)
      garment = character.equippedItems.torso;
      // Extract cloak from separate slot
      cloakItem = character.equippedItems.cloak || null;
    } else {
      // Fall back to appearance only if equippedItems doesn't exist
      garment = appearanceWithDefaults.garment;
    }

    // If no garment equipped, show bare torso (skip clothing rendering)
    const isNaked = !garment;
    
    const clothingColor = getItemColor(garment);
    const clothingShadow = createShadow(clothingColor, 0.7);
    const clothingDeepShadow = createShadow(clothingColor, 0.5);
    const clothingHighlight = createHighlight(clothingColor, 1.2);
    const accentColor = appearanceWithDefaults.palette.accent;

    const material = (garment?.material || '').toLowerCase();
    const hasSheen = ['silk', 'satin', 'velvet'].includes(material);
    const isRough = ['wool', 'burlap', 'hemp'].includes(material);
    const isMetallic = ['mail', 'plate', 'bronze'].includes(material);

    // If naked (no torso equipped), render bare skin instead of clothing
    for (let y = 0; y < bodyHeight; y++) {
      let torsoWidth: number;
      if (y < 10) {
        // Smoother shoulder transition, especially important for tank tops
        const s = y / 10;
        const neckBase = headDim.width * 0.55;
        torsoWidth = Math.floor(neckBase + (bodyDim.shoulderWidth - neckBase) * Math.pow(s, 0.8)); // Power curve for more natural slope
      } else if (y < 22) torsoWidth = bodyDim.shoulderWidth; // Extended from 18 to 22 to keep broad shoulders longer
      else if (y < bodyHeight * 0.55) {
        const s = (y - 22) / (bodyHeight * 0.55 - 22); // Updated from 18 to 22
        torsoWidth = Math.floor(bodyDim.shoulderWidth - (bodyDim.shoulderWidth - bodyDim.chestWidth) * s * 0.4);
      } else if (y < bodyHeight * 0.85) torsoWidth = bodyDim.chestWidth;
      else {
        const s = (y - bodyHeight * 0.85) / (bodyHeight * 0.15);
        torsoWidth = Math.floor(bodyDim.chestWidth - (bodyDim.chestWidth - bodyDim.waistWidth) * s);
      }

      const torsoX = 32 - (torsoWidth / 2);
      for (let x = 0; x < torsoWidth + 6; x++) {
        let col;
        const xr = x / (torsoWidth + 6);

        if (isNaked) {
          // Render bare skin
          col = skinTone;
          if (xr < 0.15) col = skinHighlight;
          else if (xr > 0.85) col = skinDeepShadow;
          else if (xr > 0.7) col = skinShadow;
          
          // Add muscle definition for strong characters
          if (stats.strength >= 7) {
            if (y > 5 && y < 15 && Math.abs(xr - 0.5) < 0.1) col = createHighlight(col, 1.05);
            if (y > 15 && y < 25 && (xr > 0.3 && xr < 0.35 || xr > 0.65 && xr < 0.7)) col = createShadow(col, 0.95);
          }
        } else {
          // Render clothing
          col = clothingColor;
          if (xr < 0.15) col = clothingHighlight;
          else if (xr < 0.3) col = createHighlight(clothingColor, 1.1);
          else if (xr > 0.85) col = clothingDeepShadow;
          else if (xr > 0.7) col = clothingShadow;

          if (hasSheen && rand(x + y * 100) > 0.7) col = createHighlight(col, 1.15);
          else if (isRough && rand(x + y * 100) > 0.8) col = createShadow(col, 0.95);
          else if (isMetallic && Math.sin(x * 0.5 + y * 0.3) > 0.3) col = createHighlight(col, 1.25);

          if (isWealthy) {
            if ((x + y) % 12 === 0) col = accentColor;
            else if ((x - y) % 10 === 0) col = appearanceWithDefaults.palette.secondary;
            if (isNoble && y > 10 && y < 20 && Math.abs(x - torsoWidth / 2) < 5 && ((x + y) % 4 === 0)) col = '#FFD700';
          }

          if (culturalZone === 'EAST_ASIAN' && y % 8 === 4) col = createShadow(col, 0.9);
          else if (culturalZone === 'SUB_SAHARAN_AFRICAN' && ((x + y) % 6 < 2)) col = accentColor;
          else if (culturalZone === 'SOUTH_ASIAN' && isWealthy && (x % 4 === 2 && y % 4 === 2)) col = '#FFD700';
        }

        elements.push(<rect key={`cl-${y}-${x}`} x={torsoX + x - 3} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />);
      }

      // Check if garment is sleeveless or short-sleeved BEFORE rendering arms
      const garmentName = garment?.name?.toLowerCase() || '';
      const isTankTop = garmentName.includes('tank top') || garmentName.includes('vest top') || garmentName.includes('sleeveless');
      const isSleevelessDress = garmentName.includes('sleeveless dress') || garmentName.includes('sundress');
      const isSleeveless = isTankTop || isSleevelessDress;
      const isTShirt = garmentName.includes('t-shirt') || garmentName.includes('t shirt') || garmentName.includes('tee shirt') || garmentName.includes('graphic tee');

      // Reduce arm gap for tank tops to show shoulder connection
      const armGap = isTankTop ? 0 : 2;
      const leftArmX = torsoX - bodyDim.armWidth - armGap;
      const rightArmX = torsoX + torsoWidth + armGap;

      // Render arms with appropriate covering
      for (let ax = 0; ax < bodyDim.armWidth; ax++) {
        let col = clothingColor;

        // Determine if this part of arm should be bare
        const isShortSleeveArea = isTShirt && y > 10; // T-shirt shows bare forearms below sleeve line
        const shouldBeBare = isNaked || isSleeveless || isShortSleeveArea;

        if (shouldBeBare) {
          // Render bare arms
          col = skinTone;
          if (ax === 0) col = skinHighlight;
          else if (ax === bodyDim.armWidth - 1) col = skinShadow;

          // Enhanced muscle definition for strong characters
          if (stats.strength >= 8 && y > 3 && y < 20) {
            // Deltoid/shoulder muscle bulge
            if (y < 8 && ax >= bodyDim.armWidth / 2 - 1 && ax <= bodyDim.armWidth / 2 + 1) {
              col = createHighlight(col, 1.05);
            }
            // Bicep definition
            else if (y > 10 && y < 18 && ax === Math.floor(bodyDim.armWidth / 2)) {
              col = createHighlight(col, 1.04);
            }
          } else if (stats.strength >= 6 && y > 5 && y < 15 && ax === Math.floor(bodyDim.armWidth / 2)) {
            col = createHighlight(col, 1.02);
          }
        } else {
          // Render with clothing
          if (ax === 0) col = clothingHighlight;
          else if (ax === bodyDim.armWidth - 1) col = clothingShadow;
          if (y % 6 === 0 && isWealthy) col = accentColor;
        }

        elements.push(
          <rect key={`la-${y}-${ax}`} x={leftArmX + ax} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />,
          <rect key={`ra-${y}-${ax}`} x={rightArmX + ax} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />
        );
      }

      // Enhanced garment type detection and rendering
      // (garmentName, isTankTop, and isSleeveless already declared above for arm rendering)
      const isRobe = garmentName.includes('robe') || garmentName.includes('habit') || garmentName.includes('cassock');
      const isDress = garmentName.includes('dress') || garmentName.includes('gown');
      const isFactoryDress = garmentName.includes('factory dress');
      const isArmor = garmentName.includes('armor') || garmentName.includes('mail') || garmentName.includes('plate') || garmentName.includes('cuirass') || garmentName.includes('breastplate') || garmentName.includes('brigandine');
      const isToga = garmentName.includes('toga');
      const isApron = garmentName.includes('apron');
      const isVest = garmentName.includes('vest') || garmentName.includes('waistcoat') || garmentName.includes('jerkin');
      const isShirt = garmentName.includes('shirt') || garmentName.includes('blouse') || garmentName.includes('dress shirt');
      const isTunic = garmentName.includes('tunic') || garmentName.includes('tabard');
      const isLeatherJacket = garmentName.includes('leather jacket');
      const isCoat = garmentName.includes('coat') || garmentName.includes('jacket') || garmentName.includes('doublet');
      // Note: isCape/isPoncho/isShawl now handled via separate cloak slot, not torso garment
      const isPoncho = garmentName.includes('poncho');
      const isShawl = garmentName.includes('shawl');

      // Modern clothing detection
      const isBusinessSuit = garmentName.includes('business suit') || garmentName.includes('suit jacket') || garmentName === 'suit' || garmentName.includes('three-piece');
      const isThreePieceSuit = garmentName.includes('three-piece');
      const isBlazer = garmentName.includes('blazer');
      const isHoodie = garmentName.includes('hoodie') || garmentName.includes('hooded sweatshirt');
      // isTShirt already defined above for arm rendering
      const isPoloShirt = garmentName.includes('polo shirt') || garmentName.includes('polo');
      const isSweater = garmentName.includes('sweater') || garmentName.includes('pullover') || garmentName.includes('jumper');
      
      // Collar/neckline rendering based on garment type
      if (y < 3) {
        const collarWidth = Math.floor(torsoWidth * 0.6);
        const collarX = 32 - (collarWidth / 2);

        if (isToga) {
          // Toga: Asymmetric, bare right shoulder
          for (let cx = 0; cx < collarWidth; cx++) {
            const isRightShoulder = cx > collarWidth * 0.6;
            if (isRightShoulder && y < 2) {
              // Bare shoulder on right side
              elements.push(<rect key={`toga-skin-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
            } else if (!isRightShoulder) {
              // Draped fabric on left
              const togaColor = y === 1 && cx % 4 === 0 ? clothingDeepShadow : clothingColor;
              elements.push(<rect key={`toga-drape-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={togaColor} className="pixel" />);
            }
          }
          // Purple stripe for senatorial toga
          if (garmentName.includes('senatorial') && y === 2) {
            elements.push(<rect key={`toga-stripe`} x={collarX + 2} y={bodyStartY + y} width="3" height="1" fill="#800080" className="pixel" />);
          }
        } else if (isFactoryDress) {
          // Factory dress: Simple high neckline, no decoration
          for (let cx = 0; cx < collarWidth; cx++) {
            // Simple high collar, mostly covered
            if (y === 0) {
              elements.push(<rect key={`factory-collar-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={clothingColor} className="pixel" />);
            }
          }
        } else if (isRobe || isDress) {
          // V-neck for fancy robes and dresses (but not factory dress)
          for (let cx = 0; cx < collarWidth; cx++) {
            const vDepth = Math.abs(cx - collarWidth / 2) < y * 2;
            if (vDepth) elements.push(<rect key={`collar-v-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
          }
        } else if (isArmor && y === 0) {
          // High collar for armor
          for (let cx = 0; cx < collarWidth + 4; cx++) {
            const metalCol = isMetallic ? createHighlight(clothingColor, 1.4) : clothingDeepShadow;
            elements.push(<rect key={`armor-collar-${cx}`} x={collarX + cx - 2} y={bodyStartY - 1} width="1" height="2" fill={metalCol} className="pixel" />);
          }
        } else if (isVest && y > 0) {
          // Open vest showing shirt underneath
          for (let cx = 0; cx < collarWidth; cx++) {
            if (Math.abs(cx - collarWidth / 2) > 3) {
              elements.push(<rect key={`vest-open-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={clothingColor} className="pixel" />);
            } else {
              // Show shirt underneath
              elements.push(<rect key={`vest-shirt-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={'#f8f8f8'} className="pixel" />);
            }
          }
        } else if (isLeatherJacket) {
          // Leather jacket with wide collar, zipper, and studs
          for (let cx = 0; cx < collarWidth + 2; cx++) {
            const xPos = collarX + cx - 1;
            const centerDist = Math.abs(cx - (collarWidth / 2));

            if (y === 0) {
              // Wide folded collar with leather sheen
              const isEdge = cx < 2 || cx > collarWidth - 1;
              const collarCol = isEdge ? createHighlight(clothingColor, 1.5) : clothingDeepShadow;
              elements.push(<rect key={`leather-collar-${cx}`} x={xPos} y={bodyStartY - 1} width="1" height="2" fill={collarCol} className="pixel" />);
            } else if (y === 1) {
              // Collar fold line with highlights
              const foldCol = cx % 3 === 0 ? createHighlight(clothingColor, 1.3) : clothingColor;
              elements.push(<rect key={`leather-fold-${cx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill={foldCol} className="pixel" />);

              // Metal studs on shoulders
              if (cx === 2 || cx === collarWidth - 2) {
                elements.push(<rect key={`leather-stud-${y}-${cx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill="#C0C0C0" className="pixel" />);
              }
            } else if (y === 2) {
              // Lapel area with texture
              elements.push(<rect key={`leather-lapel-${cx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
            }
          }
        } else if (isCoat && y === 0) {
          // High collar for coats
          for (let cx = 0; cx < collarWidth; cx++) {
            elements.push(<rect key={`coat-collar-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
          }
        } else if ((isBusinessSuit || isBlazer)) {
          // Professional suit with dress shirt and tie - IMPROVED
          for (let cx = 0; cx < collarWidth; cx++) {
            const centerDist = Math.abs(cx - collarWidth / 2);

            if (y === 0) {
              // Wider lapels (7px each side) with highlight
              const isLapel = cx < 7 || cx > collarWidth - 8;
              if (isLapel) {
                const lapelCol = cx === 0 || cx === collarWidth - 1 ? createHighlight(clothingColor, 1.2) : clothingDeepShadow;
                elements.push(<rect key={`suit-lapel-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={lapelCol} className="pixel" />);
              } else {
                // White shirt collar (more visible)
                elements.push(<rect key={`shirt-collar-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill="#FFFFFF" className="pixel" />);
              }
            } else if (y === 1) {
              // Lapel continues, shirt collar visible
              const isLapel = cx < 5 || cx > collarWidth - 6;
              if (isLapel) {
                elements.push(<rect key={`suit-lapel-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={clothingColor} className="pixel" />);
              } else {
                // White shirt visible
                elements.push(<rect key={`shirt-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill="#FFFFFF" className="pixel" />);
              }
            } else if (y === 2) {
              // Tie knot (wider, 4px)
              const isTieKnot = centerDist < 2;
              const isLapel = cx < 4 || cx > collarWidth - 5;

              if (isTieKnot) {
                const tieColor = appearanceWithDefaults.palette.accent || '#DC143C';
                const knotShade = cx === Math.floor(collarWidth / 2) ? createShadow(tieColor, 0.8) : tieColor;
                elements.push(<rect key={`tie-knot-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={knotShade} className="pixel" />);
              } else if (isLapel) {
                elements.push(<rect key={`jacket-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={clothingColor} className="pixel" />);
              } else {
                elements.push(<rect key={`shirt-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill="#FFFFFF" className="pixel" />);
              }
            }
          }
        } else if (isHoodie && y === 0) {
          // Hoodie with visible hood rim
          for (let cx = 0; cx < collarWidth + 2; cx++) {
            elements.push(<rect key={`hoodie-hood-${cx}`} x={collarX + cx - 1} y={bodyStartY - 1} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
          }
        } else if (isTShirt) {
          // T-shirt with crew neck
          for (let cx = 0; cx < collarWidth; cx++) {
            const centerDist = Math.abs(cx - collarWidth / 2);
            const isNeckOpening = centerDist < collarWidth / 3 && y < 2;
            if (isNeckOpening) {
              elements.push(<rect key={`tshirt-neck-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
            } else if (y === 0 && centerDist < collarWidth / 2) {
              // Collar band
              elements.push(<rect key={`tshirt-collar-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={clothingColor} className="pixel" />);
            }
          }
        } else if (isTankTop) {
          // Tank top with wider neck opening and shoulder straps
          for (let cx = 0; cx < collarWidth + 4; cx++) {
            const adjustedCx = cx - 2; // Extend slightly wider for straps
            const centerDist = Math.abs(adjustedCx - collarWidth / 2);
            const isNeckOpening = centerDist < (collarWidth / 2.5) && y < 2;
            const isStrap = !isNeckOpening && centerDist > collarWidth / 2.5 && centerDist < collarWidth / 2 + 2 && y < 3;

            if (isNeckOpening) {
              elements.push(<rect key={`tank-neck-${y}-${cx}`} x={collarX + adjustedCx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
            } else if (isStrap) {
              // Tank top straps
              elements.push(<rect key={`tank-strap-${y}-${cx}`} x={collarX + adjustedCx} y={bodyStartY + y} width="1" height="1" fill={clothingColor} className="pixel" />);
            }
          }
        } else if (isPoloShirt && y < 2) {
          // Polo collar stands up slightly
          for (let cx = 0; cx < collarWidth; cx++) {
            const collarUp = y === 0 && cx > 2 && cx < collarWidth - 3;
            if (collarUp) elements.push(<rect key={`polo-collar-${cx}`} x={collarX + cx} y={bodyStartY - 1} width="1" height="1" fill={clothingColor} className="pixel" />);
          }
        } else if (isSweater) {
          // Crew neck sweater
          for (let cx = 0; cx < collarWidth; cx++) {
            if (y === 0) elements.push(<rect key={`sweater-neck-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
          }
        } else if (isWealthy) {
          // Decorative collar for wealthy characters
          for (let cx = 0; cx < collarWidth; cx++) {
            elements.push(
              <rect key={`collar-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={y === 0 ? accentColor : appearanceWithDefaults.palette.secondary} className="pixel" />
            );
          }
        }
      }
      
      // Add apron overlay if wearing apron
      if (isApron && y > 8 && y < bodyHeight - 5) {
        const apronWidth = Math.floor(torsoWidth * 0.7);
        const apronX = 32 - (apronWidth / 2);
        for (let ax = 0; ax < apronWidth; ax++) {
          if (rand(ax + y * 100) > 0.1) { // Slightly transparent effect
            const apronCol = garment?.color?.startsWith('#') ? garment.color : '#f5f5dc'; // Default to beige
            elements.push(<rect key={`apron-${y}-${ax}`} x={apronX + ax} y={bodyStartY + y} width="1" height="1" fill={apronCol} className="pixel" />);
          }
        }
      }
      
      // Add armor plates/details with historical accuracy
      if (isArmor) {
        const armorType = garmentName.includes('plate') ? 'plate' :
                         garmentName.includes('mail') || garmentName.includes('chain') ? 'chainmail' :
                         garmentName.includes('cuirass') ? 'cuirass' :
                         garmentName.includes('brigandine') ? 'brigandine' :
                         garmentName.includes('lamellar') ? 'lamellar' : 'generic';

        if (armorType === 'plate' && y % 4 === 0 && y > 5 && y < bodyHeight - 10) {
          // Plate armor with articulated segments
          const plateWidth = Math.floor(torsoWidth * 0.8);
          const plateX = 32 - (plateWidth / 2);
          for (let px = 0; px < plateWidth; px++) {
            const isEdge = px === 0 || px === plateWidth - 1;
            const plateCol = isEdge ? createShadow(clothingColor, 0.7) : createHighlight(clothingColor, 1.5);
            elements.push(<rect key={`plate-${y}-${px}`} x={plateX + px} y={bodyStartY + y} width="1" height="1" fill={plateCol} className="pixel" />);
          }
          // Rivet details
          if (y % 8 === 0) {
            elements.push(
              <rect key={`rivet-l-${y}`} x={plateX + 2} y={bodyStartY + y} width="1" height="1" fill="#2F2F2F" className="pixel" />,
              <rect key={`rivet-r-${y}`} x={plateX + plateWidth - 3} y={bodyStartY + y} width="1" height="1" fill="#2F2F2F" className="pixel" />
            );
          }
        } else if (armorType === 'chainmail') {
          // Chainmail ring pattern
          const chainWidth = torsoWidth;
          const chainX = 32 - Math.floor(chainWidth / 2);
          for (let cx = 0; cx < chainWidth; cx++) {
            if ((cx + y) % 2 === 0) {
              const ringCol = ((cx + y) % 4 === 0) ? createHighlight(clothingColor, 1.3) : clothingColor;
              elements.push(<rect key={`mail-${cx}-${y}`} x={chainX + cx} y={bodyStartY + y} width="1" height="1" fill={ringCol} className="pixel" />);
            }
          }
        } else if (armorType === 'cuirass' && y > 3 && y < bodyHeight - 15) {
          // Muscled breastplate
          const chestCenterX = 32;
          const cuirassWidth = torsoWidth;
          const cuirassX = 32 - Math.floor(cuirassWidth / 2);

          if (y < bodyHeight / 3) {
            // Pectoral muscle definition
            const muscleOffset = Math.floor(torsoWidth * 0.25);
            for (let cx = 0; cx < cuirassWidth; cx++) {
              const leftPec = Math.abs(cx - (torsoWidth/2 - muscleOffset)) < 3;
              const rightPec = Math.abs(cx - (torsoWidth/2 + muscleOffset)) < 3;
              if (leftPec || rightPec) {
                const muscleCol = createHighlight(clothingColor, 1.6);
                elements.push(<rect key={`pec-${cx}-${y}`} x={cuirassX + cx} y={bodyStartY + y} width="1" height="1" fill={muscleCol} className="pixel" />);
              }
            }
          }
          // Center ridge
          elements.push(<rect key={`ridge-${y}`} x={chestCenterX} y={bodyStartY + y} width="1" height="1" fill={createShadow(clothingColor, 0.8)} className="pixel" />);
        } else if (armorType === 'brigandine' && y % 3 === 0) {
          // Studded brigandine pattern
          const brigWidth = torsoWidth;
          const brigX = 32 - Math.floor(brigWidth / 2);
          for (let bx = 0; bx < brigWidth; bx++) {
            if (bx % 3 === 0) {
              elements.push(<rect key={`stud-${bx}-${y}`} x={brigX + bx} y={bodyStartY + y} width="1" height="1" fill={createHighlight(clothingColor, 1.8)} className="pixel" />);
            }
          }
        } else if (armorType === 'lamellar' && y % 2 === 0) {
          // Overlapping lamellar plates
          const lameWidth = torsoWidth;
          const lameX = 32 - Math.floor(lameWidth / 2);
          for (let lx = 0; lx < lameWidth; lx++) {
            if (lx % 3 === 0) {
              for (let lxx = 0; lxx < 2 && lx + lxx < lameWidth; lxx++) {
                const lameCol = lxx === 0 ? createHighlight(clothingColor, 1.4) : clothingColor;
                elements.push(<rect key={`lame-${lx}-${y}-${lxx}`} x={lameX + lx + lxx} y={bodyStartY + y} width="1" height="1" fill={lameCol} className="pixel" />);
              }
            }
          }
        } else if (armorType === 'generic' && y % 4 === 0 && y > 5 && y < bodyHeight - 10) {
          // Generic armor plates
          const plateWidth = Math.floor(torsoWidth * 0.8);
          const plateX = 32 - (plateWidth / 2);
          for (let px = 0; px < plateWidth; px++) {
            const plateCol = createHighlight(clothingColor, 1.3);
            elements.push(<rect key={`gen-plate-${y}-${px}`} x={plateX + px} y={bodyStartY + y} width="1" height="1" fill={plateCol} className="pixel" />);
          }
        }

        // Pauldrons (shoulder armor) for all armor types
        if (y >= 0 && y < 6) {
          const shoulderExtend = 4 - Math.floor(y / 2);
          const pauldronWidth = torsoWidth;
          const pauldronX = 32 - Math.floor(pauldronWidth / 2);
          for (let px = 0; px < pauldronWidth; px++) {
            if (px < shoulderExtend || px > pauldronWidth - shoulderExtend) {
              const pauldronCol = createHighlight(clothingColor, 1.4);
              elements.push(<rect key={`pauldron-${px}-${y}`} x={pauldronX + px} y={bodyStartY + y} width="1" height="1" fill={pauldronCol} className="pixel" />);
            }
          }
        }
      }
      
      // Cloak rendering is now handled separately after the torso loop (see below)
      
      // Add poncho draping
      if (isPoncho && y > 8) {
        const ponchoWidth = torsoWidth + 8;
        const ponchoX = 32 - (ponchoWidth / 2);
        // Poncho has characteristic diamond/triangular shape
        const shouldShow = Math.abs(32 - (ponchoX + ponchoWidth/2)) < ponchoWidth/2;
        if (shouldShow) {
          for (let px = 0; px < ponchoWidth; px += 2) { // Slightly transparent effect
            elements.push(<rect key={`poncho-${y}-${px}`} x={ponchoX + px} y={bodyStartY + y} width="1" height="1" fill={clothingColor} className="pixel" />);
          }
        }
      }
      
      // Add shawl draping over shoulders
      if (isShawl && y > 3 && y < 12) {
        const shawlWidth = torsoWidth + 6;
        const shawlX = 32 - (shawlWidth / 2);
        const drape = Math.sin((y - 3) * 0.5) * 1;
        for (let sx = 0; sx < shawlWidth; sx += 2) {
          if (sx < 6 || sx > shawlWidth - 6) { // Only show on shoulders/edges
            elements.push(<rect key={`shawl-${y}-${sx}`} x={shawlX + sx + drape} y={bodyStartY + y} width="1" height="1" fill={clothingColor} className="pixel" />);
          }
        }
      }
      
      // Modern clothing details
      if ((isBusinessSuit || isBlazer) && y >= 3 && y < bodyHeight - 5) {
        const suitThird = Math.floor(torsoWidth / 3);

        // Tie continues down (y 3-6)
        if (y >= 3 && y <= 6) {
          const tieColor = appearanceWithDefaults.palette.accent || '#DC143C';
          const tieX = 32 - 1; // Center, 3px wide
          for (let tx = 0; tx < 3; tx++) {
            const tieShade = tx === 1 ? tieColor : createShadow(tieColor, 0.85);
            elements.push(<rect key={`tie-${y}-${tx}`} x={tieX + tx} y={bodyStartY + y} width="1" height="1" fill={tieShade} className="pixel" />);
          }
        }

        // Jacket panels on left and right thirds, shirt in center
        if (y >= 5) {
          for (let jx = 0; jx < torsoWidth; jx++) {
            const xPos = 32 - Math.floor(torsoWidth / 2) + jx;
            const isLeftPanel = jx < suitThird;
            const isRightPanel = jx > torsoWidth - suitThird;
            const isCenterShirt = !isLeftPanel && !isRightPanel;

            // Jacket panels with optional pinstripe
            if (isLeftPanel || isRightPanel) {
              const hasPinstripe = jx % 4 === 0 && y % 2 === 0;
              const jacketCol = hasPinstripe ? createHighlight(clothingColor, 1.15) : clothingColor;
              elements.push(<rect key={`suit-panel-${y}-${jx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill={jacketCol} className="pixel" />);
            } else if (isCenterShirt && y > 6) {
              // White shirt visible in center
              elements.push(<rect key={`suit-shirt-${y}-${jx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill="#FFFFFF" className="pixel" />);
            }
          }
        }

        // Suit buttons (more frequent, every 3 rows)
        if (y >= 8 && y % 3 === 0) {
          const buttonX = 32 - Math.floor(suitThird / 2);
          elements.push(
            <rect key={`suit-button-${y}`} x={buttonX} y={bodyStartY + y} width="2" height="2" fill={clothingDeepShadow} className="pixel" />,
            <rect key={`suit-button-shine-${y}`} x={buttonX} y={bodyStartY + y} width="1" height="1" fill={createHighlight(clothingColor, 1.3)} className="pixel" />
          );
        }

        // Pocket square (left side, y 6-8)
        if (y >= 6 && y <= 8 && !isBlazer) {
          const pocketX = 32 - Math.floor(torsoWidth / 2) + 3;
          const squareColor = appearanceWithDefaults.palette.secondary || '#FFFFFF';
          if (y === 6) {
            elements.push(<rect key={`pocket-square-${y}`} x={pocketX} y={bodyStartY + y} width="2" height="1" fill={squareColor} className="pixel" />);
          }
        }

        // Three-piece suit: vest peek between jacket panels
        if (isThreePieceSuit && y >= 6 && y <= 12) {
          const vestColor = createShadow(clothingColor, 0.7);
          const vestWidth = Math.floor(torsoWidth / 5);
          const vestX = 32 - Math.floor(vestWidth / 2);

          for (let vx = 0; vx < vestWidth; vx++) {
            const isVestButton = y % 3 === 0 && vx === Math.floor(vestWidth / 2);
            const vestCol = isVestButton ? '#000000' : vestColor;
            elements.push(<rect key={`vest-peek-${y}-${vx}`} x={vestX + vx} y={bodyStartY + y} width="1" height="1" fill={vestCol} className="pixel" />);
          }
        }
      }

      // Leather jacket body details
      if (isLeatherJacket && y >= 3 && y < bodyHeight - 5) {
        // Asymmetric zipper line (off-center left)
        const zipperX = 32 - 3;
        if (y >= 3 && y <= 20) {
          // Zipper teeth
          const zipperCol = y % 2 === 0 ? '#A0A0A0' : '#C0C0C0';
          elements.push(<rect key={`zipper-${y}`} x={zipperX} y={bodyStartY + y} width="1" height="1" fill={zipperCol} className="pixel" />);
          // Zipper pull at top
          if (y === 3) {
            elements.push(<rect key={`zipper-pull`} x={zipperX - 1} y={bodyStartY + y} width="2" height="2" fill="#808080" className="pixel" />);
          }
        }

        // Leather texture (diagonal creases)
        if (y % 6 === 0 || y % 6 === 1) {
          for (let lx = 0; lx < torsoWidth; lx++) {
            if ((lx + y) % 8 === 0) {
              const xPos = 32 - Math.floor(torsoWidth / 2) + lx;
              const creaseCol = createShadow(clothingColor, 0.8);
              elements.push(<rect key={`leather-crease-${y}-${lx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill={creaseCol} className="pixel" />);
            }
          }
        }

        // Metal studs on torso
        if (y === 5 || y === 9) {
          const studPositions = [5, torsoWidth - 5];
          studPositions.forEach((pos, idx) => {
            const xPos = 32 - Math.floor(torsoWidth / 2) + pos;
            elements.push(<rect key={`leather-stud-body-${y}-${idx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill="#C0C0C0" className="pixel" />);
          });
        }

        // Zippered pockets (y 10-12)
        if (y >= 10 && y <= 12) {
          const pocketLeft = 32 - Math.floor(torsoWidth / 2) + 2;
          const pocketRight = 32 + Math.floor(torsoWidth / 2) - 4;

          if (y === 10 || y === 12) {
            // Pocket openings with zipper detail
            for (let px = 0; px < 3; px++) {
              elements.push(
                <rect key={`pocket-l-${y}-${px}`} x={pocketLeft + px} y={bodyStartY + y} width="1" height="1" fill={clothingDeepShadow} className="pixel" />,
                <rect key={`pocket-r-${y}-${px}`} x={pocketRight + px} y={bodyStartY + y} width="1" height="1" fill={clothingDeepShadow} className="pixel" />
              );
            }
          }
        }

        // Leather sheen highlights on edges
        for (let lx = 0; lx < torsoWidth; lx++) {
          const isEdge = lx === 0 || lx === torsoWidth - 1;
          if (isEdge && y % 3 === 0) {
            const xPos = 32 - Math.floor(torsoWidth / 2) + lx;
            const shineCol = createHighlight(clothingColor, 1.5);
            elements.push(<rect key={`leather-shine-${y}-${lx}`} x={xPos} y={bodyStartY + y} width="1" height="1" fill={shineCol} className="pixel" />);
          }
        }
      }

      if (isHoodie && y > 8 && y < 15) {
        // Hoodie front pocket (kangaroo pocket)
        const pocketWidth = Math.floor(torsoWidth * 0.4);
        const pocketX = 32 - (pocketWidth / 2);
        if (y === 12 || y === 13) { // Pocket opening
          for (let px = 0; px < pocketWidth; px++) {
            elements.push(<rect key={`hoodie-pocket-${y}-${px}`} x={pocketX + px} y={bodyStartY + y} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
          }
        }
      }

      // Tank tops now properly show bare arms, so we don't need extra side skin rendering
    }

    // ----- CLOAK RENDERING (separate equipment slot) -----
    // Render cloak AFTER torso/arms so it overlays on top, including shoulder coverage
    if (cloakItem) {
      const cloakName = cloakItem.name?.toLowerCase() || '';
      const cloakColor = getItemColor(cloakItem);
      const cloakShadow = createShadow(cloakColor, 0.7);
      const cloakDeepShadow = createShadow(cloakColor, 0.5);
      const cloakHighlight = createHighlight(cloakColor, 1.2);
      const cloakMaterial = (cloakItem.material || '').toLowerCase();

      // Detect cloak type
      const isCape = cloakName.includes('cape');
      const isPoncho = cloakName.includes('poncho');
      const isShawl = cloakName.includes('shawl');

      // Detect material types for special rendering
      const isFurCloak = cloakMaterial.includes('fur');
      const isFeatherCloak = cloakMaterial.includes('feather');
      const isDesertCloak = cloakMaterial.includes('camel') || cloakMaterial.includes('linen') || cloakName.includes('desert');
      const isWoolCloak = cloakMaterial.includes('wool') || cloakMaterial.includes('alpaca'); // Wool is base texture

      for (let y = 0; y < bodyHeight; y++) {
        // Calculate torso width for this y position (same logic as torso rendering)
        let torsoWidth: number;
        if (y < 10) {
          const s = y / 10;
          const neckBase = headDim.width * 0.55;
          torsoWidth = Math.floor(neckBase + (bodyDim.shoulderWidth - neckBase) * Math.pow(s, 0.8));
        } else if (y < 22) torsoWidth = bodyDim.shoulderWidth; // Extended from 18 to 22 to match torso rendering
        else if (y < bodyHeight * 0.55) {
          const s = (y - 22) / (bodyHeight * 0.55 - 22); // Updated from 18 to 22
          torsoWidth = Math.floor(bodyDim.shoulderWidth - (bodyDim.shoulderWidth - bodyDim.chestWidth) * s * 0.4);
        } else if (y < bodyHeight * 0.85) torsoWidth = bodyDim.chestWidth;
        else {
          const s = (y - bodyHeight * 0.85) / (bodyHeight * 0.15);
          torsoWidth = Math.floor(bodyDim.chestWidth - (bodyDim.chestWidth - bodyDim.waistWidth) * s);
        }

        if (isShawl && y >= 0 && y < 12) {
          // Shawl: covers shoulders area (y 0-12)
          const shawlWidth = torsoWidth + 6;
          const shawlX = 32 - (shawlWidth / 2);
          const drape = Math.sin((y) * 0.5) * 1;
          for (let sx = 0; sx < shawlWidth; sx += 2) {
            if (sx < 6 || sx > shawlWidth - 6) { // Only show on shoulders/edges
              const col = (sx === 0 || sx >= shawlWidth - 2) ? cloakShadow : cloakColor;
              elements.push(<rect key={`cloak-shawl-${y}-${sx}`} x={shawlX + sx + drape} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        } else if (isPoncho) {
          // Poncho: diamond shape, covers shoulders and extends down
          if (y < 25) {
            const ponchoWidth = torsoWidth + 8 + Math.floor(y / 3);
            const ponchoX = 32 - (ponchoWidth / 2);
            for (let px = 0; px < ponchoWidth; px += 2) {
              const col = (px === 0 || px >= ponchoWidth - 2) ? cloakShadow : cloakColor;
              elements.push(<rect key={`cloak-poncho-${y}-${px}`} x={ponchoX + px} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        } else {
          // Full cloak/cape: ONLY covers shoulders/upper arms area (y 0-10), does NOT flow down torso
          if (y < 10) {
            // Shoulder coverage area - extends wider to cover shoulders AND arms
            // Need to cover: torso + armGap + armWidth on each side = torsoWidth + 20
            const shoulderWidth = torsoWidth + (isFurCloak ? 24 : 20); // Wide enough to cover arms
            const shoulderX = 32 - (shoulderWidth / 2);

            // Calculate center cutout (skip front/center of chest and neck)
            const centerCutoutWidth = Math.floor(torsoWidth * 0.6); // Cut out 60% of center
            const centerCutoutStart = 32 - (centerCutoutWidth / 2);
            const centerCutoutEnd = centerCutoutStart + centerCutoutWidth;

            // Thin cord across neck (only render on very top rows)
            const isCordRow = y < 2;
            const cordThickness = 2; // 2 pixels wide
            const cordStart = 32 - (cordThickness / 2);
            const cordEnd = cordStart + cordThickness;

            for (let cx = 0; cx < shoulderWidth; cx++) {
              const xPos = shoulderX + cx;

              // Skip center area (front of chest/neck) EXCEPT for thin cord at top
              const isInCenterCutout = xPos >= centerCutoutStart && xPos < centerCutoutEnd;
              const isCord = isCordRow && xPos >= cordStart && xPos < cordEnd;

              if (isInCenterCutout && !isCord) {
                continue; // Skip rendering center area
              }

              let col = cloakColor;
              const xr = cx / shoulderWidth;

              // Base shading: Edge darkening and center highlight
              if (xr < 0.1 || xr > 0.9) col = cloakDeepShadow;
              else if (xr < 0.2 || xr > 0.8) col = cloakShadow;
              else if (xr > 0.4 && xr < 0.6 && y > 2) col = cloakHighlight; // Center fold highlight

              // ===== MATERIAL-SPECIFIC TEXTURES =====

              // WOOL (base texture): Subtle woven texture with occasional dark threads
              if (isWoolCloak) {
                // Horizontal weave lines (subtle)
                if (y % 3 === 0 && rand(cx + y * 100) > 0.7) col = createShadow(col, 0.95);
                // Random wool fiber texture
                if (rand(cx * 7 + y * 13) > 0.88) col = createShadow(col, 0.97);
              }

              // FUR: Thick, fluffy texture with longer "hairs" and depth
              if (isFurCloak) {
                // Dense random fur texture (more coverage than wool)
                const furRand = rand(cx * 11 + y * 17);
                if (furRand > 0.55) {
                  // Light fur tips (highlights)
                  if (furRand > 0.75) col = createHighlight(col, 1.2);
                  // Dark fur base (shadows)
                  else col = createShadow(col, 0.88);
                }
                // Fur "tufts" - vertical streaks
                if ((cx + Math.floor(y / 2)) % 3 === 0 && rand(cx + y) > 0.6) {
                  col = createShadow(col, 0.85);
                }
              }

              // FEATHER: Distinctive layered feather pattern with iridescent shimmer
              if (isFeatherCloak) {
                // Feather layers (horizontal bands every 2 rows)
                if (y % 2 === 0) {
                  // Individual feather barbs
                  if (cx % 3 === 0) col = createHighlight(col, 1.25);
                  // Feather shafts (darker center lines)
                  else if ((cx + Math.floor(y / 2)) % 6 === 0) col = createShadow(col, 0.8);
                }
                // Iridescent shimmer effect
                if ((cx + y) % 5 === 0 && rand(cx + y) > 0.7) {
                  col = createHighlight(col, 1.3);
                }
              }

              // DESERT (Camel Hair/Linen): Light, flowing, with visible weave pattern
              if (isDesertCloak) {
                // Loose linen weave (more visible than wool)
                if ((y % 2 === 0 && cx % 2 === 0) || (y % 2 === 1 && cx % 2 === 1)) {
                  col = createHighlight(col, 1.05); // Lighter squares
                } else {
                  col = createShadow(col, 0.97); // Darker squares
                }
                // Occasional loose threads
                if (rand(cx * 23 + y * 29) > 0.92) col = createHighlight(col, 1.15);
              }

              elements.push(<rect key={`cloak-shoulder-${y}-${cx}`} x={shoulderX + cx} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
          // Note: No flowing cape section - cloaks only cover shoulders/upper arms, not torso
        }
      }
    }

    return <g key="body">{elements}</g>;
  }, [appearanceWithDefaults.garment, appearanceWithDefaults.palette.accent, appearanceWithDefaults.palette.primary, appearanceWithDefaults.palette.secondary, bodyDim, culturalZone, headDim.height, headDim.width, headX, headY, isNoble, isWealthy, skinShadow, skinTone, stats?.strength, character.equippedItems, useEquippedItems]);

  // ----- HEADGEAR (using modular component) -----
  const renderHeadgear = (
    <HeadgearRenderer
      useEquippedItems={useEquippedItems}
      character={character}
      appearanceWithDefaults={appearanceWithDefaults}
      headX={headX}
      headY={headY}
      headDim={headDim}
      culturalZone={culturalZone}
      era={era}
      baseHair={baseHair}
      isWealthy={isWealthy}
      isNoble={isNoble}
      skinTone={skinTone}
      seed={seed}
    />
  );

  // ----- JEWELRY -----
  const renderJewelry = useMemo(() => {
    if (!appearanceWithDefaults.jewelry || appearanceWithDefaults.jewelry.length === 0) return <g key="jewelry" />;
    const elements: JSX.Element[] = [];

    appearanceWithDefaults.jewelry.forEach((piece, index) => {
      const material = piece.material;
      const style = piece.style;

      const materialColors: Record<string, string> = {
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        pearl: '#FFF8DC',
        bone: '#FFFFF0',
        wood: '#8B4513',
        gems: '#FFD700'
      };
      const jewelryColor = materialColors[material] || '#FFD700';
      const gemColors = piece.gems || ['#DC143C', '#4169E1', '#50C878'];

      switch (piece.type) {
        case 'necklace': {
          const necklaceY = headY + headDim.height + 2; // Closer to neck
          const centerX = headX + Math.floor(headDim.width / 2);
          
          // Different chain styles based on style attribute
          if (style === 'delicate') {
            // Delicate chain - thin links
            for (let x = centerX - 12; x <= centerX + 12; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(144 - distFromCenter * distFromCenter) * 0.12); // Natural curve
              if (x % 2 === 0) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={jewelryColor} className="pixel" />);
              }
            }
          } else if (style === 'chunky') {
            // Chunky chain - thick linked appearance
            for (let x = centerX - 10; x <= centerX + 10; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(100 - distFromCenter * distFromCenter) * 0.15);
              if (x % 3 <= 1) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width="2" height="2" fill={jewelryColor} className="pixel" />);
                if (x % 3 === 0) {
                  elements.push(<rect key={`necklace-sh-${index}-${x}`} x={x + 1} y={necklaceY + yOffset + 1} width="1" height="1" fill={createShadow(jewelryColor, 0.8)} className="pixel" />);
                }
              }
            }
          } else {
            // Standard chain with proper links
            for (let x = centerX - 11; x <= centerX + 11; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(121 - distFromCenter * distFromCenter) * 0.13);
              
              // Create interlocking link pattern
              if (x % 3 === 0) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={jewelryColor} className="pixel" />);
                elements.push(<rect key={`necklace-l-${index}-${x}`} x={x} y={necklaceY + yOffset + 1} width="1" height="1" fill={jewelryColor} className="pixel" />);
              } else if (x % 3 === 1) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset + 1} width="1" height="1" fill={jewelryColor} className="pixel" />);
              }
            }
          }
          
          // Add beads or gems if specified
          if (material === 'gems' || material === 'pearl') {
            for (let x = centerX - 9; x <= centerX + 9; x += 4) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(81 - distFromCenter * distFromCenter) * 0.15);
              const gemColor = material === 'pearl' ? '#FFF8DC' : gemColors[Math.abs(Math.floor(x / 4)) % gemColors.length];
              // Bead/gem with highlight
              elements.push(
                <rect key={`bead-${index}-${x}`} x={x} y={necklaceY + yOffset} width="2" height="2" fill={gemColor} className="pixel" />,
                <rect key={`bead-hl-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={createHighlight(gemColor, 1.3)} className="pixel" />
              );
            }
          }
          
          // Ornate pendant
          if (style === 'ornate') {
            const pendantY = necklaceY + 6;
            // Detailed ornate pendant
            elements.push(
              // Bail (connector to chain)
              <rect key={`bail-${index}`} x={centerX} y={pendantY - 1} width="1" height="2" fill={jewelryColor} className="pixel" />,
              // Pendant body
              <rect key={`pendant-t-${index}`} x={centerX - 2} y={pendantY + 1} width="5" height="1" fill={jewelryColor} className="pixel" />,
              <rect key={`pendant-m-${index}`} x={centerX - 3} y={pendantY + 2} width="7" height="3" fill={jewelryColor} className="pixel" />,
              <rect key={`pendant-b-${index}`} x={centerX - 2} y={pendantY + 5} width="5" height="1" fill={jewelryColor} className="pixel" />,
              // Highlight and shadow
              <rect key={`pendant-hl-${index}`} x={centerX - 2} y={pendantY + 2} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />,
              <rect key={`pendant-sh-${index}`} x={centerX + 2} y={pendantY + 4} width="1" height="1" fill={createShadow(jewelryColor, 0.7)} className="pixel" />,
              // Central gem
              <rect key={`pendant-gem-${index}`} x={centerX - 1} y={pendantY + 3} width="3" height="1" fill={gemColors[0]} className="pixel" />,
              <rect key={`pendant-gem-hl-${index}`} x={centerX} y={pendantY + 3} width="1" height="1" fill={createHighlight(gemColors[0], 1.4)} className="pixel" />
            );
          }
          break;
        }
        case 'earrings': {
          // Calculate ear positions based on face shape
          const earMidRatio = 0.45; // Middle of the ear
          const earY = headY + Math.floor(headDim.height * earMidRatio);

          // Use face shape calculations for accurate ear placement
          const faceShape = (appearanceWithDefaults.faceShape || 'oval').toLowerCase();
          const baseCurve: Record<string, { crownRoundness: number }> = {
            oval:     { crownRoundness: 0.34 },
            round:    { crownRoundness: 0.30 },
            square:   { crownRoundness: 0.36 },
            heart:    { crownRoundness: 0.32 },
            diamond:  { crownRoundness: 0.33 },
            long:     { crownRoundness: 0.36 },
          };
          const widthAnchors: Record<string, { topW: number; cheekW: number; chinW: number }> = {
            oval:    { topW: 0.55, cheekW: 1.00, chinW: 0.68 },
            round:   { topW: 0.60, cheekW: 1.04, chinW: 0.78 },
            square:  { topW: 0.65, cheekW: 1.02, chinW: 0.84 },
            heart:   { topW: 0.58, cheekW: 1.02, chinW: 0.58 },
            diamond: { topW: 0.50, cheekW: 1.06, chinW: 0.66 },
            long:    { topW: 0.52, cheekW: 0.98, chinW: 0.64 },
          };

          const curve = baseCurve[faceShape] ?? baseCurve.oval;
          const { cheekW } = widthAnchors[faceShape] ?? widthAnchors.oval;

          // Calculate face width at ear level
          const earT = 0.45;
          const earWidth = Math.floor(headDim.width * cheekW);
          const centerX = headX + Math.floor(headDim.width / 2);

          const earLX = centerX - Math.floor(earWidth / 2) - 2;
          const earRX = centerX + Math.floor(earWidth / 2) + 2;
          
          if (style === 'simple') {
            // Stud earrings with highlight
            elements.push(
              <rect key={`earring-l-${index}`} x={earLX} y={earY} width="2" height="2" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-l-hl-${index}`} x={earLX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />,
              <rect key={`earring-r-${index}`} x={earRX} y={earY} width="2" height="2" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-r-hl-${index}`} x={earRX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />
            );
            
            if (material === 'gems' || material === 'pearl') {
              const gemCol = material === 'pearl' ? '#FFF8DC' : gemColors[0];
              elements.push(
                <rect key={`earring-l-gem-${index}`} x={earLX} y={earY} width="1" height="1" fill={gemCol} className="pixel" />,
                <rect key={`earring-r-gem-${index}`} x={earRX} y={earY} width="1" height="1" fill={gemCol} className="pixel" />
              );
            }
          } else if (style === 'ornate' || style === 'delicate') {
            // Dangling earrings
            const length = style === 'ornate' ? 5 : 3;
            
            // Hook/post
            elements.push(
              <rect key={`earring-l-hook-${index}`} x={earLX} y={earY - 1} width="1" height="2" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-r-hook-${index}`} x={earRX} y={earY - 1} width="1" height="2" fill={jewelryColor} className="pixel" />
            );
            
            // Dangling elements
            for (let d = 0; d < length; d++) {
              const isGem = d === length - 1 && material === 'gems';
              const col = isGem ? gemColors[0] : jewelryColor;
              const width = (d === length - 1) ? 2 : 1;
              
              elements.push(
                <rect key={`earring-l-drop-${index}-${d}`} x={earLX - Math.floor(d * 0.2)} y={earY + d + 1} width={width} height="1" fill={col} className="pixel" />,
                <rect key={`earring-r-drop-${index}-${d}`} x={earRX - Math.floor(d * 0.2)} y={earY + d + 1} width={width} height="1" fill={col} className="pixel" />
              );
              
              if (isGem) {
                elements.push(
                  <rect key={`earring-l-gem-hl-${index}`} x={earLX} y={earY + d + 1} width="1" height="1" fill={createHighlight(col, 1.4)} className="pixel" />,
                  <rect key={`earring-r-gem-hl-${index}`} x={earRX} y={earY + d + 1} width="1" height="1" fill={createHighlight(col, 1.4)} className="pixel" />
                );
              }
            }
          } else if (style === 'chunky') {
            // Hoop earrings
            const hoopSize = 3;
            for (let h = 0; h < hoopSize; h++) {
              elements.push(
                <rect key={`earring-l-hoop-${index}-${h}`} x={earLX - h} y={earY + h} width="1" height="1" fill={jewelryColor} className="pixel" />,
                <rect key={`earring-l-hoop-b-${index}-${h}`} x={earLX - h + 1} y={earY + hoopSize} width="1" height="1" fill={jewelryColor} className="pixel" />,
                <rect key={`earring-r-hoop-${index}-${h}`} x={earRX + h} y={earY + h} width="1" height="1" fill={jewelryColor} className="pixel" />,
                <rect key={`earring-r-hoop-b-${index}-${h}`} x={earRX + h - 1} y={earY + hoopSize} width="1" height="1" fill={jewelryColor} className="pixel" />
              );
            }
            elements.push(
              <rect key={`earring-l-hoop-hl-${index}`} x={earLX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />,
              <rect key={`earring-r-hoop-hl-${index}`} x={earRX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />
            );
          }
          break;
        }
        case 'bracelet': {
          const wristY = 58;
          const leftWristX = 16;
          const rightWristX = 44;
          const braceletWidth = style === 'chunky' ? 3 : style === 'delicate' ? 1 : 2;
          for (let w = 0; w < braceletWidth; w++) {
            for (let x = 0; x < 6; x++) {
              if (style === 'ornate' && x % 2 === 0) {
                elements.push(
                  <rect key={`bracelet-l-gem-${index}-${w}-${x}`} x={leftWristX + x} y={wristY + w} width="1" height="1" fill={gemColors[0]} className="pixel" />,
                  <rect key={`bracelet-r-gem-${index}-${w}-${x}`} x={rightWristX + x} y={wristY + w} width="1" height="1" fill={gemColors[0]} className="pixel" />
                );
              } else {
                elements.push(
                  <rect key={`bracelet-l-${index}-${w}-${x}`} x={leftWristX + x} y={wristY + w} width="1" height="1" fill={jewelryColor} className="pixel" />,
                  <rect key={`bracelet-r-${index}-${w}-${x}`} x={rightWristX + x} y={wristY + w} width="1" height="1" fill={jewelryColor} className="pixel" />
                );
              }
            }
          }
          break;
        }
        case 'circlet': {
          const circletY = headY + 2;
          for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
            if (style === 'ornate' && (x - headX) % 4 === 0) {
              elements.push(<rect key={`circlet-gem-${index}-${x}`} x={x} y={circletY} width="1" height="1" fill={gemColors[0]} className="pixel" />);
            } else if ((x - headX) % 2 === 0 || style !== 'delicate') {
              elements.push(<rect key={`circlet-${index}-${x}`} x={x} y={circletY} width="1" height="1" fill={jewelryColor} className="pixel" />);
            }
          }
          if (style === 'ornate') {
            const centerX = headX + Math.floor(headDim.width / 2);
            elements.push(
              <rect key={`circlet-center-${index}`} x={centerX - 1} y={circletY - 1} width="3" height="3" fill={jewelryColor} className="pixel" />,
              <rect key={`circlet-center-gem-${index}`} x={centerX} y={circletY} width="1" height="1" fill={gemColors[0]} className="pixel" />
            );
          }
          break;
        }
        case 'ring': {
          const handY = 60;
          const leftHandX = 18;
          const rightHandX = 42;
          elements.push(
            <rect key={`ring-l-${index}`} x={leftHandX} y={handY} width="1" height="1" fill={jewelryColor} className="pixel" />,
            <rect key={`ring-r-${index}`} x={rightHandX} y={handY} width="1" height="1" fill={jewelryColor} className="pixel" />
          );
          break;
        }
      }
    });

    return <g key="jewelry">{elements}</g>;
  }, [appearanceWithDefaults.jewelry, headDim.height, headDim.width, headX, headY, isWealthy]);

  // ----- EQUIPPED AMULET -----
  const renderAmulet = useMemo(() => {
    let necklaceItem = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      necklaceItem = character.equippedItems.necklace;
    }
    
    if (!necklaceItem) return <g key="necklace" />;
    
    const elements: JSX.Element[] = [];
    const centerX = headX + Math.floor(headDim.width / 2);
    const neckY = headY + headDim.height + 1; // Closer to actual neck position
    
    // Get necklace color and material
    const necklaceColor = getItemColor(necklaceItem);
    const necklaceShadow = createShadow(necklaceColor, 0.7);
    const necklaceHighlight = createHighlight(necklaceColor, 1.2);
    const necklaceDeepShadow = createShadow(necklaceColor, 0.5);
    
    // Determine chain material and style
    const material = necklaceItem.material?.toLowerCase() || '';
    const name = necklaceItem.name?.toLowerCase() || '';
    
    // More varied chain colors based on material
    const chainColor = material.includes('gold') ? '#FFD700' : 
                       material.includes('silver') ? '#C0C0C0' : 
                       material.includes('bronze') ? '#CD7F32' :
                       material.includes('copper') ? '#B87333' :
                       material.includes('iron') ? '#708090' :
                       material.includes('leather') ? '#8B4513' :
                       material.includes('rope') || material.includes('cord') ? '#DEB887' :
                       material.includes('beads') || material.includes('bead') ? '#F4A460' :
                       material.includes('wood') ? '#8B4513' : '#C0C0C0';
    const chainShade = createShadow(chainColor, 0.75);
    const chainHighlight = createHighlight(chainColor, 1.15);
    
    // Enhanced chain rendering with different styles
    const isBeaded = material.includes('bead') || name.includes('rosary') || name.includes('prayer');
    const isLeather = material.includes('leather') || material.includes('cord') || material.includes('rope');
    const isChain = !isBeaded && !isLeather;
    
    if (isBeaded) {
      // Beaded necklace/rosary
      for (let x = centerX - 11; x <= centerX + 11; x += 2) {
        const distFromCenter = Math.abs(x - centerX);
        const yOffset = Math.floor(Math.sqrt(121 - distFromCenter * distFromCenter) * 0.13);
        elements.push(
          <rect key={`bead-${x}`} x={x} y={neckY + yOffset} width="2" height="2" fill={chainColor} className="pixel" />,
          <rect key={`bead-hl-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainHighlight} className="pixel" />
        );
      }
    } else if (isLeather) {
      // Leather cord - continuous thick line
      for (let x = centerX - 11; x <= centerX + 11; x++) {
        const distFromCenter = Math.abs(x - centerX);
        const yOffset = Math.floor(Math.sqrt(121 - distFromCenter * distFromCenter) * 0.13);
        elements.push(
          <rect key={`cord-${x}`} x={x} y={neckY + yOffset} width="1" height="2" fill={chainColor} className="pixel" />
        );
        if (x % 4 === 0) {
          elements.push(<rect key={`cord-tex-${x}`} x={x} y={neckY + yOffset + 1} width="1" height="1" fill={chainShade} className="pixel" />);
        }
      }
    } else {
      // Metal chain with realistic interlocking links
      for (let x = centerX - 11; x <= centerX + 11; x++) {
        const distFromCenter = Math.abs(x - centerX);
        const yOffset = Math.floor(Math.sqrt(121 - distFromCenter * distFromCenter) * 0.13);
        
        // Create interlocking oval links pattern
        const linkPhase = x % 4;
        if (linkPhase === 0 || linkPhase === 1) {
          elements.push(
            <rect key={`link-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainColor} className="pixel" />,
            <rect key={`link-b-${x}`} x={x} y={neckY + yOffset + 1} width="1" height="1" fill={chainColor} className="pixel" />
          );
          if (linkPhase === 0) {
            elements.push(<rect key={`link-hl-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainHighlight} className="pixel" />);
          }
        } else if (linkPhase === 2) {
          elements.push(<rect key={`link-mid-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainShade} className="pixel" />);
        }
      }
    }
    
    // Enhanced pendant rendering based on type with beautiful details
    const pendantY = neckY + 5; // Slightly lower for better visibility
    const isGold = material.includes('gold');
    const isSilver = material.includes('silver');
    const isOrnate = name.includes('ornate') || isGold || isSilver || name.includes('jeweled');

    // Enhanced glimmer effect for metallic surfaces
    const glimmerColor = isGold ? '#FFFACD' : isSilver ? '#F0F8FF' : createHighlight(necklaceColor, 1.5);
    const deepShadow = createShadow(necklaceColor, 0.4);
    const midShadow = createShadow(necklaceColor, 0.6);

    if (name.includes('cross') || name.includes('crucifix')) {
      // Beautiful detailed cross with realistic 3D appearance
      const crossWidth = isOrnate ? 8 : 6;
      const crossHeight = isOrnate ? 9 : 7;

      // Cross shadow base (for depth)
      elements.push(
        <rect key="cross-shadow-v" x={centerX + 1} y={pendantY + 1} width="2" height={crossHeight} fill={deepShadow} className="pixel" />,
        <rect key="cross-shadow-h" x={centerX - Math.floor(crossWidth/2) + 1} y={pendantY + Math.floor(crossHeight/3) + 1} width={crossWidth} height="2" fill={deepShadow} className="pixel" />
      );

      // Main cross body with gradient shading
      // Vertical beam
      for (let y = 0; y < crossHeight; y++) {
        for (let x = -1; x <= 1; x++) {
          let crossColor = necklaceColor;
          if (x === -1) crossColor = midShadow; // Left edge shadow
          else if (x === 0) crossColor = y < 2 ? necklaceHighlight : necklaceColor; // Center highlight at top
          else crossColor = createShadow(necklaceColor, 0.8); // Right edge shadow

          elements.push(<rect key={`cross-v-${x}-${y}`} x={centerX + x} y={pendantY + y} width="1" height="1" fill={crossColor} className="pixel" />);
        }
      }

      // Horizontal beam with enhanced detail
      const beamY = pendantY + Math.floor(crossHeight/3);
      for (let x = -Math.floor(crossWidth/2); x <= Math.floor(crossWidth/2); x++) {
        for (let y = -1; y <= 1; y++) {
          let crossColor = necklaceColor;
          if (y === -1) crossColor = necklaceHighlight; // Top highlight
          else if (y === 0) crossColor = Math.abs(x) < 2 ? necklaceHighlight : necklaceColor; // Center highlight
          else crossColor = midShadow; // Bottom shadow

          elements.push(<rect key={`cross-h-${x}-${y}`} x={centerX + x} y={beamY + y} width="1" height="1" fill={crossColor} className="pixel" />);
        }
      }

      // Beautiful glimmer effects
      if (isGold || isSilver) {
        elements.push(
          <rect key="cross-glimmer-1" x={centerX - 1} y={pendantY + 1} width="1" height="1" fill={glimmerColor} className="pixel" />,
          <rect key="cross-glimmer-2" x={centerX + 1} y={beamY} width="1" height="1" fill={glimmerColor} className="pixel" />,
          <rect key="cross-glimmer-3" x={centerX} y={pendantY} width="1" height="1" fill={glimmerColor} className="pixel" />
        );
      }

      if (isOrnate) {
        // Ornate decorative elements
        const gemColor = '#DC143C'; // Ruby red
        elements.push(
          // Corner gems
          <rect key="cross-gem-tl" x={centerX - 2} y={beamY - 1} width="1" height="1" fill={gemColor} className="pixel" />,
          <rect key="cross-gem-tr" x={centerX + 2} y={beamY - 1} width="1" height="1" fill={gemColor} className="pixel" />,
          <rect key="cross-gem-center" x={centerX} y={beamY} width="1" height="1" fill={gemColor} className="pixel" />,
          // Gem highlights
          <rect key="cross-gem-hl-1" x={centerX - 2} y={beamY - 1} width="1" height="1" fill={createHighlight(gemColor, 1.6)} className="pixel" />,
          <rect key="cross-gem-hl-2" x={centerX} y={beamY} width="1" height="1" fill={createHighlight(gemColor, 1.6)} className="pixel" />,
          // Decorative flourishes
          <rect key="cross-dec-1" x={centerX - 3} y={beamY} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
          <rect key="cross-dec-2" x={centerX + 3} y={beamY} width="1" height="1" fill={necklaceHighlight} className="pixel" />
        );
      }

      if (name.includes('crucifix')) {
        // Detailed figure of Christ
        elements.push(
          // Head
          <rect key="fig-head" x={centerX} y={pendantY + 1} width="1" height="1" fill={createShadow(necklaceColor, 0.5)} className="pixel" />,
          // Body
          <rect key="fig-body" x={centerX} y={pendantY + 2} width="1" height="2" fill={createShadow(necklaceColor, 0.5)} className="pixel" />,
          // Arms along horizontal beam
          <rect key="fig-arms" x={centerX - 1} y={beamY} width="3" height="1" fill={createShadow(necklaceColor, 0.5)} className="pixel" />,
          // Legs
          <rect key="fig-legs" x={centerX} y={pendantY + 4} width="1" height="2" fill={createShadow(necklaceColor, 0.5)} className="pixel" />
        );
      }
    } else if (name.includes('ankh')) {
      // Beautiful Egyptian ankh with 3D depth
      // Shadow base
      elements.push(
        <rect key="ankh-shadow" x={centerX - 1} y={pendantY + 1} width="4" height="6" fill={deepShadow} className="pixel" />
      );

      // Main ankh structure with shading
      elements.push(
        // Loop with proper thickness and highlights
        <rect key="ankh-loop-t" x={centerX - 1} y={pendantY} width="3" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="ankh-loop-l" x={centerX - 2} y={pendantY + 1} width="1" height="2" fill={midShadow} className="pixel" />,
        <rect key="ankh-loop-r" x={centerX + 2} y={pendantY + 1} width="1" height="2" fill={createShadow(necklaceColor, 0.8)} className="pixel" />,
        <rect key="ankh-loop-b" x={centerX - 1} y={pendantY + 2} width="3" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="ankh-loop-inner" x={centerX} y={pendantY + 1} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
        // Vertical stem with gradient
        <rect key="ankh-v-1" x={centerX} y={pendantY + 3} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="ankh-v-2" x={centerX} y={pendantY + 4} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="ankh-v-3" x={centerX} y={pendantY + 5} width="1" height="1" fill={midShadow} className="pixel" />,
        // Horizontal crossbar with depth
        <rect key="ankh-h-l" x={centerX - 1} y={pendantY + 4} width="1" height="1" fill={midShadow} className="pixel" />,
        <rect key="ankh-h-c" x={centerX} y={pendantY + 4} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="ankh-h-r" x={centerX + 1} y={pendantY + 4} width="1" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />
      );

      // Glimmer effects for gold/silver
      if (isGold || isSilver) {
        elements.push(
          <rect key="ankh-glimmer" x={centerX} y={pendantY} width="1" height="1" fill={glimmerColor} className="pixel" />
        );
      }

    } else if (name.includes('crescent') || name.includes('moon')) {
      // Beautiful crescent moon with ethereal glow
      // Shadow base
      elements.push(
        <rect key="moon-shadow" x={centerX - 1} y={pendantY + 1} width="4" height="5" fill={deepShadow} className="pixel" />
      );

      // Main crescent with smooth curves and highlights
      elements.push(
        <rect key="moon-tip-t" x={centerX - 1} y={pendantY} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="moon-curve-1" x={centerX - 2} y={pendantY + 1} width="1" height="3" fill={necklaceColor} className="pixel" />,
        <rect key="moon-curve-2" x={centerX - 1} y={pendantY + 4} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="moon-horn-1" x={centerX} y={pendantY + 5} width="1" height="1" fill={midShadow} className="pixel" />,
        <rect key="moon-horn-2" x={centerX + 1} y={pendantY + 5} width="1" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />,
        <rect key="moon-edge" x={centerX + 2} y={pendantY + 2} width="1" height="2" fill={createShadow(necklaceColor, 0.7)} className="pixel" />,
        // Inner highlight for luminous effect
        <rect key="moon-glow" x={centerX - 1} y={pendantY + 2} width="1" height="1" fill={glimmerColor} className="pixel" />
      );

      // Additional glow for silver moons
      if (isSilver) {
        elements.push(
          <rect key="moon-silver-glow" x={centerX - 1} y={pendantY + 1} width="1" height="1" fill={glimmerColor} className="pixel" />
        );
      }

    } else if (name.includes('star') || name.includes('david')) {
      // Magnificent Star of David with perfect geometry
      // Shadow base
      elements.push(
        <rect key="star-shadow" x={centerX - 1} y={pendantY + 1} width="4" height="5" fill={deepShadow} className="pixel" />
      );

      // Upper triangle with shading
      elements.push(
        <rect key="star-t" x={centerX} y={pendantY} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="star-tl" x={centerX - 1} y={pendantY + 1} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="star-tr" x={centerX + 1} y={pendantY + 1} width="1" height="1" fill={midShadow} className="pixel" />,
        <rect key="star-bl1" x={centerX - 2} y={pendantY + 2} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="star-br1" x={centerX + 2} y={pendantY + 2} width="1" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />,
      );

      // Lower triangle (inverted)
      elements.push(
        <rect key="star-bl2" x={centerX - 1} y={pendantY + 3} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="star-br2" x={centerX + 1} y={pendantY + 3} width="1" height="1" fill={midShadow} className="pixel" />,
        <rect key="star-b" x={centerX} y={pendantY + 4} width="1" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />
      );

      // Center hexagon with brilliant highlight
      elements.push(
        <rect key="star-center" x={centerX} y={pendantY + 2} width="1" height="1" fill={glimmerColor} className="pixel" />
      );

      // Ornate gems at points if ornate
      if (isOrnate) {
        elements.push(
          <rect key="star-gem-t" x={centerX} y={pendantY} width="1" height="1" fill={'#4169E1'} className="pixel" />,
          <rect key="star-gem-b" x={centerX} y={pendantY + 4} width="1" height="1" fill={'#4169E1'} className="pixel" />
        );
      }

    } else if (name.includes('heart') || name.includes('locket')) {
      // Romantic heart shape with beautiful curves and depth
      // Shadow base
      elements.push(
        <rect key="heart-shadow" x={centerX - 1} y={pendantY + 2} width="4" height="5" fill={deepShadow} className="pixel" />
      );

      // Heart shape with proper 3D modeling
      elements.push(
        // Top lobes
        <rect key="heart-tl" x={centerX - 2} y={pendantY + 1} width="2" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="heart-tr" x={centerX + 1} y={pendantY + 1} width="2" height="1" fill={necklaceColor} className="pixel" />,
        // Upper body
        <rect key="heart-ul" x={centerX - 2} y={pendantY + 2} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="heart-um" x={centerX - 1} y={pendantY + 2} width="3" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="heart-ur" x={centerX + 2} y={pendantY + 2} width="1" height="1" fill={midShadow} className="pixel" />,
        // Middle body
        <rect key="heart-ml" x={centerX - 1} y={pendantY + 3} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="heart-mm" x={centerX} y={pendantY + 3} width="1" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="heart-mr" x={centerX + 1} y={pendantY + 3} width="1" height="1" fill={midShadow} className="pixel" />,
        // Lower body tapering to point
        <rect key="heart-bl" x={centerX} y={pendantY + 4} width="1" height="1" fill={necklaceColor} className="pixel" />,
        <rect key="heart-point" x={centerX} y={pendantY + 5} width="1" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />
      );

      // Romantic glimmer
      if (isGold || isSilver || name.includes('locket')) {
        elements.push(
          <rect key="heart-glimmer-1" x={centerX - 1} y={pendantY + 1} width="1" height="1" fill={glimmerColor} className="pixel" />,
          <rect key="heart-glimmer-2" x={centerX} y={pendantY + 2} width="1" height="1" fill={glimmerColor} className="pixel" />
        );
      }

      // Locket opening line
      if (name.includes('locket')) {
        elements.push(
          <rect key="locket-seam" x={centerX} y={pendantY + 2} width="1" height="2" fill={createShadow(necklaceColor, 0.6)} className="pixel" />
        );
      }

    } else if (name.includes('amulet') || name.includes('talisman') || name.includes('charm')) {
      // Mystical amulet with intricate design
      // Shadow base
      elements.push(
        <rect key="amulet-shadow" x={centerX - 1} y={pendantY + 1} width="4" height="6" fill={deepShadow} className="pixel" />
      );

      // Circular/oval base
      elements.push(
        <rect key="amulet-t" x={centerX - 1} y={pendantY} width="3" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="amulet-ml" x={centerX - 2} y={pendantY + 1} width="1" height="3" fill={midShadow} className="pixel" />,
        <rect key="amulet-mm" x={centerX - 1} y={pendantY + 1} width="3" height="3" fill={necklaceColor} className="pixel" />,
        <rect key="amulet-mr" x={centerX + 2} y={pendantY + 1} width="1" height="3" fill={createShadow(necklaceColor, 0.8)} className="pixel" />,
        <rect key="amulet-b" x={centerX - 1} y={pendantY + 4} width="3" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />
      );

      // Mystical symbol in center
      const symbolColor = isOrnate ? '#DC143C' : necklaceHighlight;
      elements.push(
        <rect key="amulet-symbol-v" x={centerX} y={pendantY + 1} width="1" height="3" fill={symbolColor} className="pixel" />,
        <rect key="amulet-symbol-h" x={centerX - 1} y={pendantY + 2} width="3" height="1" fill={symbolColor} className="pixel" />,
        <rect key="amulet-center" x={centerX} y={pendantY + 2} width="1" height="1" fill={glimmerColor} className="pixel" />
      );

    } else {
      // Generic pendant with elegant design
      elements.push(
        // Shadow
        <rect key="pendant-shadow" x={centerX} y={pendantY + 1} width="3" height="5" fill={deepShadow} className="pixel" />,
        // Main body
        <rect key="pendant-t" x={centerX - 1} y={pendantY} width="3" height="1" fill={necklaceHighlight} className="pixel" />,
        <rect key="pendant-m" x={centerX - 1} y={pendantY + 1} width="3" height="3" fill={necklaceColor} className="pixel" />,
        <rect key="pendant-b" x={centerX} y={pendantY + 4} width="1" height="1" fill={createShadow(necklaceColor, 0.8)} className="pixel" />,
        // Highlight
        <rect key="pendant-hl" x={centerX - 1} y={pendantY + 1} width="1" height="1" fill={necklaceHighlight} className="pixel" />
      );
    }

    // Enhanced chain connector from pendant to neck
    if (isOrnate || isGold || isSilver) {
      // Beautiful bail (connector piece)
      elements.push(
        <rect key="bail-shadow" x={centerX + 1} y={pendantY - 1} width="1" height="2" fill={deepShadow} className="pixel" />,
        <rect key="bail-main" x={centerX} y={pendantY - 1} width="1" height="2" fill={chainColor} className="pixel" />,
        <rect key="bail-highlight" x={centerX} y={pendantY - 1} width="1" height="1" fill={chainHighlight} className="pixel" />
      );
    }

    return <g key="amulet">{elements}</g>;
  }, [useEquippedItems, character.equippedItems, headDim.height, headDim.width, headX, headY]);

  // ----- ENHANCED CHAINS -----
  const renderChain = useMemo(() => {
    let necklaceItem = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      necklaceItem = character.equippedItems.necklace;
    }

    if (!necklaceItem) return <g key="chain" />;

    const elements: JSX.Element[] = [];
    const centerX = headX + Math.floor(headDim.width / 2);
    const neckY = headY + headDim.height + 1;

    const material = necklaceItem.material?.toLowerCase() || '';
    const name = necklaceItem.name?.toLowerCase() || '';

    // Enhanced chain colors based on material
    const chainColor = material.includes('gold') ? '#FFD700' :
                       material.includes('silver') ? '#C0C0C0' :
                       material.includes('bronze') ? '#CD7F32' :
                       material.includes('copper') ? '#B87333' :
                       material.includes('platinum') ? '#E5E4E2' :
                       '#708090';

    const chainHighlight = createHighlight(chainColor, 1.3);
    const chainShadow = createShadow(chainColor, 0.7);

    const isDelicate = name.includes('delicate') || name.includes('fine');
    const isChunky = name.includes('chunky') || name.includes('thick') || name.includes('heavy');

    // Enhanced chain rendering with realistic links
    for (let x = centerX - 12; x <= centerX + 12; x++) {
      const distFromCenter = Math.abs(x - centerX);
      const yOffset = Math.floor(Math.sqrt(144 - distFromCenter * distFromCenter) * 0.13);

      if (isDelicate) {
        // Delicate chain - fine links with sparkle
        if (x % 3 === 0) {
          elements.push(
            <rect key={`chain-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainColor} className="pixel" />
          );
          // Occasional sparkle on delicate chains
          if (x % 9 === 0) {
            elements.push(
              <rect key={`sparkle-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainHighlight} className="pixel" />
            );
          }
        }
      } else if (isChunky) {
        // Chunky chain - thick interlocked links
        if (x % 4 <= 2) {
          const linkHeight = x % 4 === 1 ? 2 : 1;
          elements.push(
            <rect key={`chain-main-${x}`} x={x} y={neckY + yOffset} width="1" height={linkHeight} fill={chainColor} className="pixel" />,
            <rect key={`chain-shadow-${x}`} x={x} y={neckY + yOffset + linkHeight} width="1" height="1" fill={chainShadow} className="pixel" />
          );
          // Highlight every other link
          if (x % 8 === 1) {
            elements.push(
              <rect key={`chain-hl-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainHighlight} className="pixel" />
            );
          }
        }
      } else {
        // Standard chain with beautiful interlocking pattern
        const linkType = Math.floor(x / 2) % 3;
        if (linkType === 0) {
          // Vertical link
          elements.push(
            <rect key={`chain-v-${x}`} x={x} y={neckY + yOffset} width="1" height="2" fill={chainColor} className="pixel" />,
            <rect key={`chain-v-hl-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill={chainHighlight} className="pixel" />
          );
        } else if (linkType === 1) {
          // Horizontal link
          elements.push(
            <rect key={`chain-h-${x}`} x={x} y={neckY + yOffset + 1} width="2" height="1" fill={chainColor} className="pixel" />,
            <rect key={`chain-h-sh-${x}`} x={x + 1} y={neckY + yOffset + 1} width="1" height="1" fill={chainShadow} className="pixel" />
          );
        }
      }
    }

    return <g key="chain">{elements}</g>;
  }, [useEquippedItems, character.equippedItems, headDim.height, headDim.width, headX, headY]);

  // ----- ACCESSORIES (ring2 slot, cultural ornamentations) -----
  const renderAccessories = useMemo(() => {
    const elements: JSX.Element[] = [];
    
    // Check for accessory slot items
    let accessoryItem = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      accessoryItem = character.equippedItems.accessory;
    }
    
    if (!accessoryItem) return <g key="accessories" />;
    
    const name = accessoryItem.name?.toLowerCase() || '';
    const material = accessoryItem.material?.toLowerCase() || '';
    const centerX = headX + Math.floor(headDim.width / 2);
    
    // Determine accessory color based on material
    const accessoryColor = material.includes('gold') ? '#FFD700' :
                          material.includes('silver') ? '#C0C0C0' :
                          material.includes('bronze') ? '#CD7F32' :
                          material.includes('copper') ? '#B87333' :
                          material.includes('bone') ? '#F5DEB3' :
                          material.includes('jade') ? '#00A86B' :
                          material.includes('turquoise') ? '#40E0D0' :
                          material.includes('obsidian') ? '#1C1C1C' :
                          material.includes('coral') ? '#FF6B6B' :
                          material.includes('ivory') ? '#FFFFF0' :
                          material.includes('wood') ? '#8B4513' :
                          getItemColor(accessoryItem);
    
    const accessoryHighlight = createHighlight(accessoryColor, 1.3);
    
    // Render based on accessory type
    if (name.includes('earring') || name.includes('ear')) {
      // Calculate ear positions based on face shape
      const earMidRatio = 0.45; // Middle of the ear
      const earY = headY + Math.floor(headDim.height * earMidRatio);

      // Use face shape calculations for accurate ear placement
      const faceShape = (appearanceWithDefaults.faceShape || 'oval').toLowerCase();
      const widthAnchors: Record<string, { cheekW: number }> = {
        oval:    { cheekW: 1.00 },
        round:   { cheekW: 1.04 },
        square:  { cheekW: 1.02 },
        heart:   { cheekW: 1.02 },
        diamond: { cheekW: 1.06 },
        long:    { cheekW: 0.98 },
      };

      const { cheekW } = widthAnchors[faceShape] ?? widthAnchors.oval;
      const earWidth = Math.floor(headDim.width * cheekW);
      const centerX = headX + Math.floor(headDim.width / 2);

      const earLX = centerX - Math.floor(earWidth / 2) - 2;
      const earRX = centerX + Math.floor(earWidth / 2) + 2;
      
      if (name.includes('hoop')) {
        // Hoop earrings
        for (let h = 0; h < 4; h++) {
          elements.push(
            <rect key={`acc-hoop-l-${h}`} x={earLX - h} y={earY + h} width="1" height="1" fill={accessoryColor} className="pixel" />,
            <rect key={`acc-hoop-r-${h}`} x={earRX + h} y={earY + h} width="1" height="1" fill={accessoryColor} className="pixel" />
          );
        }
        elements.push(
          <rect key="acc-hoop-l-hl" x={earLX} y={earY} width="1" height="1" fill={accessoryHighlight} className="pixel" />,
          <rect key="acc-hoop-r-hl" x={earRX} y={earY} width="1" height="1" fill={accessoryHighlight} className="pixel" />
        );
      } else {
        // Stud/dangling earrings
        elements.push(
          <rect key="acc-stud-l" x={earLX} y={earY} width="2" height="2" fill={accessoryColor} className="pixel" />,
          <rect key="acc-stud-l-hl" x={earLX} y={earY} width="1" height="1" fill={accessoryHighlight} className="pixel" />,
          <rect key="acc-stud-r" x={earRX} y={earY} width="2" height="2" fill={accessoryColor} className="pixel" />,
          <rect key="acc-stud-r-hl" x={earRX} y={earY} width="1" height="1" fill={accessoryHighlight} className="pixel" />
        );
      }
    } else if (name.includes('nose') || name.includes('septum') || name.includes('nostril')) {
      // Nose piercings
      const noseY = headY + Math.floor(headDim.height * 0.5);
      
      if (name.includes('septum')) {
        // Septum ring
        elements.push(
          <rect key="septum-c" x={centerX} y={noseY + 1} width="1" height="1" fill={accessoryColor} className="pixel" />,
          <rect key="septum-l" x={centerX - 1} y={noseY + 2} width="1" height="1" fill={accessoryColor} className="pixel" />,
          <rect key="septum-r" x={centerX + 1} y={noseY + 2} width="1" height="1" fill={accessoryColor} className="pixel" />,
          <rect key="septum-hl" x={centerX} y={noseY + 1} width="1" height="1" fill={accessoryHighlight} opacity={0.6} className="pixel" />
        );
      } else {
        // Nostril stud
        elements.push(
          <rect key="nostril" x={centerX - 2} y={noseY} width="1" height="1" fill={accessoryColor} className="pixel" />,
          <rect key="nostril-hl" x={centerX - 2} y={noseY} width="1" height="1" fill={accessoryHighlight} opacity={0.7} className="pixel" />
        );
      }
    } else if (name.includes('bindi') || name.includes('tilaka') || name.includes('tikka')) {
      // Forehead ornaments (South Asian)
      const foreheadY = headY + 3;
      
      // Central ornament
      elements.push(
        <rect key="bindi-c" x={centerX} y={foreheadY} width="1" height="1" fill={accessoryColor} className="pixel" />,
        <rect key="bindi-t" x={centerX} y={foreheadY - 1} width="1" height="1" fill={accessoryColor} className="pixel" />,
        <rect key="bindi-b" x={centerX} y={foreheadY + 1} width="1" height="1" fill={accessoryColor} className="pixel" />,
        <rect key="bindi-l" x={centerX - 1} y={foreheadY} width="1" height="1" fill={accessoryColor} className="pixel" />,
        <rect key="bindi-r" x={centerX + 1} y={foreheadY} width="1" height="1" fill={accessoryColor} className="pixel" />,
        <rect key="bindi-hl" x={centerX} y={foreheadY} width="1" height="1" fill={accessoryHighlight} opacity={0.8} className="pixel" />
      );
    }
    
    return <g key="accessories">{elements}</g>;
  }, [useEquippedItems, character.equippedItems, headDim.width, headDim.height, headX, headY, getItemColor]);

  // ----- GLASSES/SPECTACLES (Historical) -----
  const renderGlasses = useMemo(() => {
    if (!appearanceWithDefaults.hasGlasses) return <g key="glasses" />;

    const elements: JSX.Element[] = [];
    const glassesStyle = appearanceWithDefaults.glassesStyle || 'round';
    // Match the exact eye positioning logic
    const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
    const eyeY = headY + Math.floor(headDim.height * eyeRatioBase);
    const eyeSpacing = Math.floor(headDim.width * 0.24); // Match eye spacing exactly
    const centerX = headX + Math.floor(headDim.width / 2);
    const leftX = centerX - eyeSpacing - 2; // Match left eye position
    const rightX = centerX + eyeSpacing - 1; // Match right eye position
    
    // Frame color - historically accurate materials
    const isWealthy = character.wealthLevel === 'wealthy' || character.wealthLevel === 'noble';
    const frameColor = isWealthy ? '#8B7355' : '#2F2F2F'; // tortoiseshell vs iron/steel
    const frameHighlight = createHighlight(frameColor, 1.3);
    const frameShadow = createShadow(frameColor, 0.7);
    
    switch (glassesStyle) {
      case 'round': {
        // Historical round spectacles (14th century onwards)
        const radius = 3; // Reduced from 5 for more realistic sizing
        // Left lens - centered on left eye
        for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
          const lx = Math.round(leftX + 1 + Math.cos(angle) * radius); // +1 to better center on eye
          const ly = Math.round(eyeY + Math.sin(angle) * radius);
          elements.push(<rect key={`glass-l-${angle}`} x={lx} y={ly} width="1" height="1" fill={frameColor} className="pixel" />);
        }
        // Right lens - centered on right eye
        for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
          const rx = Math.round(rightX + 1 + Math.cos(angle) * radius); // +1 to better center on eye
          const ry = Math.round(eyeY + Math.sin(angle) * radius);
          elements.push(<rect key={`glass-r-${angle}`} x={rx} y={ry} width="1" height="1" fill={frameColor} className="pixel" />);
        }
        // Bridge
        for (let bx = leftX + radius + 2; bx <= rightX - radius; bx++) {
          elements.push(<rect key={`bridge-${bx}`} x={bx} y={eyeY} width="1" height="1" fill={frameShadow} className="pixel" />);
        }
        // Lens glare - adjusted for smaller lenses
        elements.push(
          <rect key="glare-l" x={leftX} y={eyeY - 1} width="1" height="1" fill="#FFFFFF" opacity="0.6" className="pixel" />,
          <rect key="glare-r" x={rightX} y={eyeY - 1} width="1" height="1" fill="#FFFFFF" opacity="0.6" className="pixel" />
        );
        break;
      }
      case 'square': {
        // Later period rectangular spectacles
        const size = 3; // Reduced from 5 for more realistic sizing
        // Left frame - centered on left eye
        const leftCenterX = leftX + 1; // Adjust to center on eye
        for (let dx = -size; dx <= size; dx++) {
          elements.push(
            <rect key={`sq-l-t-${dx}`} x={leftCenterX + dx} y={eyeY - size} width="1" height="1" fill={frameColor} className="pixel" />,
            <rect key={`sq-l-b-${dx}`} x={leftCenterX + dx} y={eyeY + size} width="1" height="1" fill={frameShadow} className="pixel" />
          );
        }
        for (let dy = -size; dy <= size; dy++) {
          elements.push(
            <rect key={`sq-l-l-${dy}`} x={leftCenterX - size} y={eyeY + dy} width="1" height="1" fill={frameHighlight} className="pixel" />,
            <rect key={`sq-l-r-${dy}`} x={leftCenterX + size} y={eyeY + dy} width="1" height="1" fill={frameShadow} className="pixel" />
          );
        }
        // Right frame - centered on right eye
        const rightCenterX = rightX + 1; // Adjust to center on eye
        for (let dx = -size; dx <= size; dx++) {
          elements.push(
            <rect key={`sq-r-t-${dx}`} x={rightCenterX + dx} y={eyeY - size} width="1" height="1" fill={frameColor} className="pixel" />,
            <rect key={`sq-r-b-${dx}`} x={rightCenterX + dx} y={eyeY + size} width="1" height="1" fill={frameShadow} className="pixel" />
          );
        }
        for (let dy = -size; dy <= size; dy++) {
          elements.push(
            <rect key={`sq-r-l-${dy}`} x={rightCenterX - size} y={eyeY + dy} width="1" height="1" fill={frameHighlight} className="pixel" />,
            <rect key={`sq-r-r-${dy}`} x={rightCenterX + size} y={eyeY + dy} width="1" height="1" fill={frameShadow} className="pixel" />
          );
        }
        // Bridge
        for (let bx = leftCenterX + size + 1; bx < rightCenterX - size; bx++) {
          elements.push(<rect key={`sq-bridge-${bx}`} x={bx} y={eyeY} width="1" height="1" fill={frameShadow} className="pixel" />);
        }
        // Lens glare - adjusted for smaller lenses and proper centering
        elements.push(
          <rect key="sq-glare-l" x={leftCenterX - 1} y={eyeY - 2} width="1" height="1" fill="#FFFFFF" opacity="0.6" className="pixel" />,
          <rect key="sq-glare-r" x={rightCenterX - 1} y={eyeY - 2} width="1" height="1" fill="#FFFFFF" opacity="0.6" className="pixel" />
        );
        break;
      }
      case 'oval': {
        // Oval pince-nez style (19th century)
        const rx = 5, ry = 4;
        // Left lens
        for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
          const lx = Math.round(leftX + Math.cos(angle) * rx);
          const ly = Math.round(eyeY + Math.sin(angle) * ry);
          elements.push(<rect key={`oval-l-${angle}`} x={lx} y={ly} width="1" height="1" fill={frameColor} className="pixel" />);
        }
        // Right lens
        for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
          const rxp = Math.round(rightX + Math.cos(angle) * rx);
          const ryp = Math.round(eyeY + Math.sin(angle) * ry);
          elements.push(<rect key={`oval-r-${angle}`} x={rxp} y={ryp} width="1" height="1" fill={frameColor} className="pixel" />);
        }
        // Spring bridge (pince-nez)
        const bridgeY = eyeY - 1;
        for (let bx = leftX + rx; bx <= rightX - rx; bx++) {
          const curve = Math.sin((bx - leftX) * 0.3) * 2;
          elements.push(<rect key={`oval-bridge-${bx}`} x={bx} y={bridgeY + Math.round(curve)} width="1" height="1" fill={frameHighlight} className="pixel" />);
        }
        break;
      }
      case 'half_rim': {
        // Half-rim reading glasses (later period)
        const size = 5;
        // Left lens - only bottom half rim
        for (let dx = -size; dx <= size; dx++) {
          const dist = Math.abs(dx);
          if (dist <= size - 1) {
            elements.push(<rect key={`hr-l-b-${dx}`} x={leftX + dx} y={eyeY + size} width="1" height="1" fill={frameColor} className="pixel" />);
          }
        }
        for (let dy = 0; dy <= size; dy++) {
          elements.push(
            <rect key={`hr-l-l-${dy}`} x={leftX - size} y={eyeY + dy} width="1" height="1" fill={frameShadow} className="pixel" />,
            <rect key={`hr-l-r-${dy}`} x={leftX + size} y={eyeY + dy} width="1" height="1" fill={frameShadow} className="pixel" />
          );
        }
        // Right lens - only bottom half rim
        for (let dx = -size; dx <= size; dx++) {
          const dist = Math.abs(dx);
          if (dist <= size - 1) {
            elements.push(<rect key={`hr-r-b-${dx}`} x={rightX + dx} y={eyeY + size} width="1" height="1" fill={frameColor} className="pixel" />);
          }
        }
        for (let dy = 0; dy <= size; dy++) {
          elements.push(
            <rect key={`hr-r-l-${dy}`} x={rightX - size} y={eyeY + dy} width="1" height="1" fill={frameShadow} className="pixel" />,
            <rect key={`hr-r-r-${dy}`} x={rightX + size} y={eyeY + dy} width="1" height="1" fill={frameShadow} className="pixel" />
          );
        }
        // Thin bridge at top
        for (let bx = leftX + size; bx <= rightX - size; bx++) {
          elements.push(<rect key={`hr-bridge-${bx}`} x={bx} y={eyeY - size + 1} width="1" height="1" fill={frameHighlight} opacity="0.7" className="pixel" />);
        }
        break;
      }
    }
    
    // Temple arms (simplified, going behind ears)
    if (glassesStyle !== 'oval') { // pince-nez doesn't have temples
      // Left temple
      for (let tx = 0; tx < 4; tx++) {
        elements.push(<rect key={`temple-l-${tx}`} x={headX - tx} y={eyeY} width="1" height="1" fill={frameShadow} className="pixel" />);
      }
      // Right temple
      for (let tx = 0; tx < 4; tx++) {
        elements.push(<rect key={`temple-r-${tx}`} x={headX + headDim.width + tx} y={eyeY} width="1" height="1" fill={frameShadow} className="pixel" />);
      }
    }
    
    return <g key="glasses">{elements}</g>;
  }, [appearanceWithDefaults.hasGlasses, appearanceWithDefaults.glassesStyle, character.wealthLevel, headDim.width, headDim.height, headX, headY, hairLength]);

  // ----- MARKINGS -----
  const renderMarkings = useMemo(() => {
    const elements: JSX.Element[] = [];
    const centerX = headX + Math.floor(headDim.width / 2); // Define centerX for markings

    // Create a seed value for stable pattern generation
    const seedVal = ((headX << 2) ^ (headY << 1) ^ (headDim.width * 31) ^ (headDim.height * 17)) >>> 0;

    // Calculate body positions for markings (same as in renderBody)
    const neckY = headY + headDim.height;
    const neckHeight = 5;
    const bodyStartY = neckY + neckHeight;
    
    // Process equipped accessories as markings
    const accessoryMarkings: Array<{
      type: 'scar' | 'tattoo' | 'paint' | 'beauty_mark' | 'freckles' | 'mole' | 'birthmark' | 'structural' | 'piercing';
      location: string;
      color: string;
      size: 'small' | 'medium' | 'large';
      pattern?: string;
      name?: string;
      localName?: string;
    }> = [];
    
    if (useEquippedItems && character.equippedItems?.accessory) {
      const accessory = character.equippedItems.accessory;
      const specialType = (accessory as any).specialType;
      const name = accessory.name.toLowerCase();
      
      // Debug logging for special accessories
      if (specialType) {
        console.log('[Portrait] Rendering special accessory:', specialType, name, 'for culture:', culturalZone);
      }
      
      // Check for structural modifications first (neck rings, lip plates, etc.)
      if (name.includes('neck ring') || name.includes('neck coil') || name.includes('dzilla')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'neck',
          color: '#B8860B', // Brass color
          size: 'large',
          pattern: 'coils',
          name: 'Neck Rings'
        });
      } else if (name.includes('lip plate') || name.includes('lip disc')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'chin',
          color: '#8B7355', // Clay color
          size: 'medium',
          pattern: 'plate',
          name: 'Lip Plate'
        });
      } else if (name.includes('ear plug') || name.includes('ear stretch')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'face',
          color: '#000000',
          size: 'medium',
          pattern: 'plug',
          name: 'Ear Plugs'
        });
      } else if (name.includes('blackened teeth') || name.includes('ohaguro')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'face',
          color: '#1C1C1C',
          size: 'small',
          pattern: 'teeth_black',
          name: 'Blackened Teeth'
        });
      } else if (name.includes('filed teeth') || name.includes('tooth filing')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'face',
          color: '#F5F5DC',
          size: 'small',
          pattern: 'teeth_filed',
          name: 'Filed Teeth'
        });
      } else if (name.includes('tooth inlay') || name.includes('jade teeth') || name.includes('gold teeth')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'face',
          color: name.includes('jade') ? '#00A86B' : '#FFD700',
          size: 'small',
          pattern: 'teeth_inlay',
          name: 'Tooth Inlay'
        });
      } else if (name.includes('cheek plug') || name.includes('cheek disc')) {
        accessoryMarkings.push({
          type: 'structural',
          location: 'cheek',
          color: '#8B4513',
          size: 'medium',
          pattern: 'cheek_plug',
          name: 'Cheek Plugs'
        });
      } else if (name.includes('nose ring') || name.includes('septum')) {
        accessoryMarkings.push({
          type: 'piercing',
          location: 'nose',
          color: '#FFD700',
          size: 'small',
          pattern: name.includes('septum') ? 'septum' : 'stud',
          name: 'Nose Ring'
        });
      } else if (specialType === 'tattoo') {
        // Determine pattern from cultural context and name
        let pattern = 'lines';
        if (culturalZone === 'OCEANIA' || name.includes('maori') || name.includes('ta moko')) {
          pattern = 'ta_moko';
        } else if (culturalZone === 'SUB_SAHARAN_AFRICAN' || name.includes('scarification')) {
          pattern = 'scarification';
        } else if (culturalZone === 'MENA' || name.includes('berber') || name.includes('amazigh')) {
          pattern = 'berber';
        } else if (culturalZone === 'EUROPEAN' && (name.includes('norse') || name.includes('celtic'))) {
          pattern = 'celtic';
        }
        
        accessoryMarkings.push({
          type: 'tattoo',
          location: 'face',
          color: '#2F4F4F',
          size: 'medium',
          pattern
        });
      } else if (specialType === 'scarification') {
        accessoryMarkings.push({
          type: 'tattoo',
          location: 'face',
          color: createHighlight(skinTone, 1.2),
          size: 'medium',
          pattern: 'scarification'
        });
      } else if (specialType === 'face_paint') {
        const duration = (accessory as any).duration || 24;
        const paintColor = culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' ? '#B22222' :
                          culturalZone === 'SUB_SAHARAN_AFRICAN' ? '#8B4513' :
                          culturalZone === 'OCEANIA' ? '#000000' : '#4169E1';
        
        accessoryMarkings.push({
          type: 'paint',
          location: 'face',
          color: paintColor,
          size: 'large',
          pattern: name.includes('war') ? 'stripes' : 'dots'
        });
      } else if (specialType === 'henna') {
        const duration = (accessory as any).duration || 72;
        const hennaColor = duration > 48 ? '#8B0000' : duration > 24 ? '#A0522D' : '#D2691E';
        
        accessoryMarkings.push({
          type: 'paint',
          location: 'face',
          color: hennaColor,
          size: 'medium',
          pattern: 'intricate'
        });
      }
    }
    
    // Combine appearance markings with accessory markings
    const allMarkings = [
      ...(appearanceWithDefaults.markings || []),
      ...accessoryMarkings
    ];

    if (allMarkings.length === 0) return <g key="markings" />;

    allMarkings.forEach((marking, index) => {
      const markingColor = marking.color;
      switch (marking.type) {
        case 'scar': {
          if (marking.location === 'face') {
            const scarX = headX + (rand(500 + index) > 0.5 ? 5 : headDim.width - 7);
            const scarY = headY + Math.floor(headDim.height * 0.3);
            const scarLength = marking.size === 'large' ? 5 : marking.size === 'medium' ? 3 : 2;
            for (let i = 0; i < scarLength; i++) {
              elements.push(<rect key={`scar-${index}-${i}`} x={scarX + i} y={scarY + i} width="1" height="1" fill={skinHighlight} className="pixel" />);
            }
          }
          break;
        }
        case 'tattoo': {
          const pattern = marking.pattern || 'lines';
          const tattooOpacity = 0.7; // Tattoos blend with skin
          
          if (marking.location === 'face' || marking.location === 'forehead' || marking.location === 'cheek' || marking.location === 'chin') {
            // Facial tattoos for various cultures
            if (culturalZone === 'OCEANIA' || pattern === 'maori_spiral' || pattern === 'maori_full' || pattern === 'ta_moko') {
              // Maori-style facial tattoos (Ta moko)
              const chinY = headY + headDim.height - 3;
              const cheekY = headY + Math.floor(headDim.height * 0.6);
              
              // Chin spiral patterns
              for (let x = -2; x <= 2; x++) {
                elements.push(
                  <rect key={`tattoo-chin-${index}-${x}`} x={centerX + x} y={chinY} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                  <rect key={`tattoo-chin2-${index}-${x}`} x={centerX + x * 2} y={chinY - 1} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              }
              
              // Cheek curves
              for (let i = 0; i < 3; i++) {
                elements.push(
                  <rect key={`tattoo-cheek-l-${index}-${i}`} x={headX + 2 + i} y={cheekY + i} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                  <rect key={`tattoo-cheek-r-${index}-${i}`} x={headX + headDim.width - 3 - i} y={cheekY + i} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              }
            } else if (culturalZone === 'SUB_SAHARAN_AFRICAN' || pattern === 'scarification' || pattern === 'vertical_lines' || pattern === 'horizontal_lines' || pattern === 'geometric') {
              // African scarification patterns
              const scarColor = createHighlight(skinTone, 1.3); // More prominent than tattoos
              
              if (pattern === 'vertical_lines' && marking.location === 'cheek') {
                // Yoruba-style vertical cheek marks
                const cheekY = headY + Math.floor(headDim.height * 0.5);
                for (let i = 0; i < 3; i++) {
                  elements.push(
                    <rect key={`vlines-l-${index}-${i}`} x={headX + 2} y={cheekY + i * 2} width="1" height="3" fill={scarColor} className="pixel" />,
                    <rect key={`vlines-r-${index}-${i}`} x={headX + headDim.width - 3} y={cheekY + i * 2} width="1" height="3" fill={scarColor} className="pixel" />
                  );
                }
              } else if (pattern === 'horizontal_lines' && marking.location === 'forehead') {
                // Dinka-style forehead marks
                const foreheadY = headY + 2;
                for (let i = 0; i < 4; i++) {
                  elements.push(
                    <rect key={`hlines-${index}-${i}`} x={centerX - 4 + i * 2} y={foreheadY} width="3" height="1" fill={scarColor} className="pixel" />
                  );
                }
              } else if (pattern === 'scarification') {
                // Generic scarification pattern - raised scars on cheeks
                const cheekY = headY + Math.floor(headDim.height * 0.5);
                const scarPattern = [
                  [1, 0], [2, 0], [3, 0], // Horizontal line
                  [1, 2], [2, 2], [3, 2], // Second line
                  [2, 1] // Middle dot
                ];
                scarPattern.forEach(([dx, dy], i) => {
                  elements.push(
                    <rect key={`scar-l-${index}-${i}`} x={headX + dx} y={cheekY + dy} width="1" height="1" fill={scarColor} className="pixel" />,
                    <rect key={`scar-r-${index}-${i}`} x={headX + headDim.width - 4 + dx} y={cheekY + dy} width="1" height="1" fill={scarColor} className="pixel" />
                  );
                });
              } else {
                // Default dot pattern
                const foreheadY = headY + 2;
                const patterns = [
                  [0, 0], [2, 0], [4, 0], // Forehead dots
                  [-1, 2], [1, 2], [3, 2], // Second row
                ];
                patterns.forEach(([dx, dy], i) => {
                  elements.push(
                    <rect key={`scar-${index}-${i}`} x={centerX - 2 + dx} y={foreheadY + dy} width="1" height="1" fill={scarColor} className="pixel" />
                  );
                });
              }
            } else if (pattern === 'norse' || pattern === 'celtic') {
              // Norse/Celtic knotwork on temples
              const templeY = headY + Math.floor(headDim.height * 0.3);
              const knotPattern = [
                [0, 0], [1, 0], [2, 1], [1, 2], [0, 2], [-1, 1]
              ];
              knotPattern.forEach(([dx, dy], i) => {
                elements.push(
                  <rect key={`knot-l-${index}-${i}`} x={headX + 1 + dx} y={templeY + dy} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                  <rect key={`knot-r-${index}-${i}`} x={headX + headDim.width - 2 - dx} y={templeY + dy} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              });
            } else if (pattern === 'berber' || culturalZone === 'MENA') {
              // Berber/Amazigh chin and forehead tattoos
              const foreheadY = headY + 3;
              const chinY = headY + headDim.height - 4;
              
              // Forehead symbol
              elements.push(
                <rect key={`berber-fh-${index}`} x={centerX} y={foreheadY} width="1" height="3" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                <rect key={`berber-fh-l-${index}`} x={centerX - 2} y={foreheadY + 1} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                <rect key={`berber-fh-r-${index}`} x={centerX + 2} y={foreheadY + 1} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
              );
              
              // Chin tattoo
              for (let x = -1; x <= 1; x++) {
                elements.push(
                  <rect key={`berber-chin-${index}-${x}`} x={centerX + x} y={chinY} width="1" height="2" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              }
            } else if (pattern === 'tears' || pattern === 'prison') {
              // Teardrop tattoos
              const tearY = headY + Math.floor(headDim.height * 0.45);
              elements.push(
                <rect key={`tear-${index}`} x={headX + 3} y={tearY} width="1" height="2" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                <rect key={`tear-b-${index}`} x={headX + 3} y={tearY + 2} width="1" height="1" fill={markingColor} opacity={0.5} className="pixel" />
              );
            } else {
              // Default tattoo rendering for any unrecognized patterns
              console.log(`[Portrait] Rendering fallback tattoo pattern: ${pattern} at ${marking.location}`);
              const tattooY = headY + Math.floor(headDim.height * 0.4);
              const tattooX = centerX - 1;
              
              // Simple line tattoo as fallback
              for (let i = 0; i < 3; i++) {
                elements.push(
                  <rect key={`fallback-tattoo-${index}-${i}`} x={tattooX + i} y={tattooY + i} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              }
            }
          } else if (marking.location === 'neck') {
            // Neck tattoos
            const neckY = headY + headDim.height + 2;
            if (pattern === 'barcode' || pattern === 'modern') {
              // Modern style neck tattoo
              for (let x = 0; x < 5; x++) {
                const height = 2 + (x % 2);
                elements.push(
                  <rect key={`neck-bar-${index}-${x}`} x={centerX - 2 + x} y={neckY} width="1" height={height} fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              }
            } else {
              // Traditional neck band
              for (let x = centerX - 6; x <= centerX + 6; x++) {
                if (x % 2 === 0) {
                  elements.push(
                    <rect key={`neck-band-${index}-${x}`} x={x} y={neckY} width="1" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                  );
                }
              }
            }
          } else if (marking.location === 'arm' || marking.location === 'shoulder') {
            // Arm/shoulder tattoos (visible part)
            const shoulderY = bodyStartY + 2;
            const shoulderX = headX - 3;
            
            if (pattern === 'tribal' || pattern === 'polynesian') {
              // Tribal band
              for (let i = 0; i < 4; i++) {
                elements.push(
                  <rect key={`tribal-${index}-${i}`} x={shoulderX} y={shoulderY + i} width="2" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />,
                  <rect key={`tribal-r-${index}-${i}`} x={headX + headDim.width + 2} y={shoulderY + i} width="2" height="1" fill={markingColor} opacity={tattooOpacity} className="pixel" />
                );
              }
            }
          }
          break;
        }
        case 'henna': {
          // Henna designs (show on hands/arms and forehead for Indian celebrations)
          const hennaOpacity = 0.7;
          const hennaColor = markingColor || '#8B4513';
          
          if (marking.location === 'arm') {
            // Show henna on visible hand/wrist area
            const handY = bodyStartY + 8;
            const handX = headX - 2;
            
            if (marking.pattern === 'floral') {
              // Floral henna pattern
              const floralPattern = [
                [0, 0], [1, 0], [2, 0], // Center line
                [1, -1], [1, 1], // Cross
                [0, 1], [2, 1], // Lower dots
                [-1, 0], [3, 0] // Side dots
              ];
              floralPattern.forEach(([dx, dy], i) => {
                elements.push(
                  <rect key={`henna-floral-${index}-${i}`} x={handX + dx} y={handY + dy} width="1" height="1" fill={hennaColor} opacity={hennaOpacity} className="pixel" />
                );
              });
            } else {
              // Geometric henna pattern  
              const geomPattern = [
                [0, 0], [2, 0], [4, 0], // Top line
                [1, 1], [3, 1], // Middle
                [0, 2], [2, 2], [4, 2] // Bottom line
              ];
              geomPattern.forEach(([dx, dy], i) => {
                elements.push(
                  <rect key={`henna-geom-${index}-${i}`} x={handX + dx} y={handY + dy} width="1" height="1" fill={hennaColor} opacity={hennaOpacity} className="pixel" />
                );
              });
            }
          } else if (marking.location === 'forehead') {
            // Bridal henna on forehead (special occasions)
            const foreheadY = headY + 3;
            const foreheadPattern = [
              [0, 0], [-1, 1], [0, 1], [1, 1], // Flower shape
              [-2, 2], [0, 2], [2, 2] // Base dots
            ];
            foreheadPattern.forEach(([dx, dy], i) => {
              elements.push(
                <rect key={`henna-forehead-${index}-${i}`} x={centerX + dx} y={foreheadY + dy} width="1" height="1" fill={hennaColor} opacity={hennaOpacity} className="pixel" />
              );
            });
          }
          break;
        }
        case 'ash': {
          // Sacred ash marks (vibhuti, ash cross)
          const pattern = marking.pattern || 'three_lines';
          if (pattern === 'three_lines' && marking.location === 'forehead') {
            // Three horizontal lines (Shaiva tilaka)
            const foreheadY = headY + 4;
            for (let i = 0; i < 3; i++) {
              elements.push(
                <rect key={`ash-line-${index}-${i}`} x={centerX - 3} y={foreheadY + i * 2} width="7" height="1" fill={markingColor} opacity={0.7} className="pixel" />
              );
            }
          } else if (pattern === 'cross' && marking.location === 'forehead') {
            // Christian ash cross
            const foreheadY = headY + 5;
            elements.push(
              <rect key={`ash-cross-v-${index}`} x={centerX} y={foreheadY - 1} width="1" height="3" fill={markingColor} opacity={0.8} className="pixel" />,
              <rect key={`ash-cross-h-${index}`} x={centerX - 1} y={foreheadY} width="3" height="1" fill={markingColor} opacity={0.8} className="pixel" />
            );
          }
          break;
        }
        case 'structural': {
          // Structural body modifications (neck rings, lip plates, etc.)
          if (marking.location === 'neck') {
            // Neck rings/coils
            const neckStartY = neckY + 1;
            const ringColor = marking.color || '#B8860B'; // Brass/copper
            const highlightColor = '#FFD700'; // Gold highlight
            const numRings = marking.size === 'large' ? 5 : marking.size === 'medium' ? 3 : 2;
            
            for (let i = 0; i < numRings; i++) {
              const ringY = neckStartY + i;
              // Main ring
              elements.push(
                <rect key={`neck-ring-${index}-${i}`} x={headX + 2} y={ringY} width={Math.max(1, headDim.width - 4)} height="1" fill={ringColor} className="pixel" />
              );
              // Metallic highlight on left edge
              elements.push(
                <rect key={`neck-ring-hl-${index}-${i}`} x={headX + 2} y={ringY} width="1" height="1" fill={highlightColor} opacity={0.6} className="pixel" />
              );
              // Shadow on right edge
              elements.push(
                <rect key={`neck-ring-shadow-${index}-${i}`} x={headX + headDim.width - 3} y={ringY} width="1" height="1" fill="#654321" opacity={0.4} className="pixel" />
              );
            }
          } else if (marking.location === 'chin' && marking.pattern === 'plate') {
            // Lip plate
            const chinY = headY + headDim.height - 2;
            const plateSize = marking.size === 'large' ? 4 : marking.size === 'medium' ? 3 : 2;
            const plateColor = marking.color || '#8B7355'; // Clay/wood color
            
            // Draw circular/disc shape
            for (let dy = 0; dy < plateSize; dy++) {
              const width = plateSize - Math.abs(dy - Math.floor(plateSize / 2));
              const xOffset = centerX - Math.floor(width / 2);
              elements.push(
                <rect key={`lip-plate-${index}-${dy}`} x={xOffset} y={chinY + dy} width={width} height="1" fill={plateColor} className="pixel" />
              );
            }
            // Add central decoration
            elements.push(
              <rect key={`lip-plate-center-${index}`} x={centerX} y={chinY + Math.floor(plateSize / 2)} width="1" height="1" fill="#654321" className="pixel" />
            );
            const mouthY = headY + Math.floor(headDim.height * 0.65);
            
          } else if (marking.location === 'face' && marking.pattern === 'plug') {
            // Ear stretching/plugs
            const earY = headY + Math.floor(headDim.height * 0.4);
            const plugSize = marking.size === 'large' ? 3 : marking.size === 'medium' ? 2 : 1;
            const plugColor = marking.color || '#000000';
            
            // Left ear plug
            elements.push(
              <rect key={`ear-plug-l-${index}`} x={headX - 1} y={earY} width={plugSize} height={plugSize} fill={plugColor} className="pixel" />
            );
            // Right ear plug
            elements.push(
              <rect key={`ear-plug-r-${index}`} x={headX + headDim.width} y={earY} width={plugSize} height={plugSize} fill={plugColor} className="pixel" />
            );
          }
          break;
        }
        case 'piercing': {
          // Enhanced piercing visualization
          if (marking.location === 'nose') {
            const noseY = headY + Math.floor(headDim.height * 0.5);
            if (marking.pattern === 'septum' || marking.pattern === 'ring') {
              // Septum ring (center of nose)
              elements.push(
                <rect key={`septum-${index}`} x={centerX} y={noseY + 1} width="1" height="2" fill="#8B7355" className="pixel" />,
                <rect key={`septum-hl-${index}`} x={centerX} y={noseY + 1} width="1" height="1" fill="#FFD700" opacity={0.6} className="pixel" />
              );
            } else if (marking.pattern === 'stud') {
              // Nostril stud (side of nose)
              const noseX = centerX - 2;
              elements.push(
                <rect key={`nose-stud-${index}`} x={noseX} y={noseY} width="1" height="1" fill="#FFD700" className="pixel" />,
                <rect key={`nose-stud-hl-${index}`} x={noseX} y={noseY} width="1" height="1" fill="#FFFFFF" opacity={0.7} className="pixel" />
              );
            } else if (marking.pattern === 'plug') {
              // Larger ear/nose plugs
              elements.push(
                <rect key={`plug-${index}`} x={centerX - 1} y={noseY} width="2" height="2" fill="#8B4513" className="pixel" />,
                <rect key={`plug-center-${index}`} x={centerX - 1} y={noseY} width="2" height="2" fill="#000000" opacity={0.5} className="pixel" />
              );
            }
          } else if (marking.location === 'eyebrow') {
            const browY = headY + Math.floor(headDim.height * 0.3) - 2;
            const browX = marking.pattern === 'left' ? headX + 3 : headX + headDim.width - 4;
            elements.push(
              <rect key={`brow-bar-${index}`} x={browX} y={browY} width="2" height="1" fill="#C0C0C0" className="pixel" />,
              <rect key={`brow-ball-${index}`} x={browX} y={browY} width="1" height="1" fill="#FFFFFF" opacity={0.6} className="pixel" />
            );
          } else if (marking.location === 'lip') {
            const lipY = headY + Math.floor(headDim.height * 0.7);
            elements.push(
              <rect key={`lip-ring-${index}`} x={centerX - 2} y={lipY} width="1" height="1" fill="#C0C0C0" className="pixel" />,
              <rect key={`lip-ring-hl-${index}`} x={centerX - 2} y={lipY} width="1" height="1" fill="#FFFFFF" opacity={0.5} className="pixel" />
            );
          } else if (marking.location === 'chin' && marking.pattern === 'plate') {
            // Lip plate - large disc in lower lip
            const chinY = headY + Math.floor(headDim.height * 0.8);
            const plateColor = marking.color || '#8B7355'; // Clay/wood color
            const plateSize = marking.size === 'large' ? 4 : 3;
            const halfPlateSize = Math.floor(plateSize / 2);
            
            // Draw circular lip plate
            for (let x = -halfPlateSize; x <= halfPlateSize; x++) {
              for (let y = 0; y < plateSize; y++) {
                if (Math.abs(x) + y <= plateSize) {
                  elements.push(
                    <rect key={`lip-plate-${index}-${x}-${y}`} 
                      x={centerX + x} 
                      y={chinY + y} 
                      width="1" 
                      height="1" 
                      fill={plateColor} 
                      className="pixel" />
                  );
                }
              }
            }
            // Add decorative edge
            elements.push(
              <rect key={`lip-plate-edge-${index}`} x={centerX - halfPlateSize} y={chinY} width={plateSize} height="1" fill="#654321" opacity={0.5} className="pixel" />
            );
          } else if (marking.location === 'neck' && marking.pattern === 'coils') {
            // Neck rings/coils - brass or copper coils
            const neckY = headY + headDim.height + 1;
            const coilColor = marking.color || '#B8860B'; // Brass color
            const coilCount = marking.size === 'large' ? 4 : 3;
            
            // Draw stacked neck rings
            for (let i = 0; i < coilCount; i++) {
              const ringY = neckY + i * 2;
              // Main ring
              for (let x = -3; x <= 3; x++) {
                elements.push(
                  <rect key={`neck-ring-${index}-${i}-${x}`} 
                    x={centerX + x} 
                    y={ringY} 
                    width="1" 
                    height="1" 
                    fill={coilColor} 
                    className="pixel" />
                );
              }
              // Highlight on ring
              elements.push(
                <rect key={`neck-ring-hl-${index}-${i}`} x={centerX - 2} y={ringY} width="2" height="1" fill="#FFD700" opacity={0.4} className="pixel" />
              );
            }
          } else if (marking.location === 'cheek' && marking.pattern === 'cheek_plug') {
            // Cheek plugs - wooden discs through cheeks
            const cheekY = headY + Math.floor(headDim.height * 0.55);
            const plugColor = marking.color || '#8B4513';
            
            // Left cheek plug
            elements.push(
              <rect key={`cheek-plug-l-${index}`} x={headX + 1} y={cheekY} width="2" height="2" fill={plugColor} className="pixel" />,
              <rect key={`cheek-plug-l-center-${index}`} x={headX + 1} y={cheekY} width="2" height="2" fill="#000000" opacity={0.3} className="pixel" />
            );
            // Right cheek plug
            elements.push(
              <rect key={`cheek-plug-r-${index}`} x={headX + headDim.width - 3} y={cheekY} width="2" height="2" fill={plugColor} className="pixel" />,
              <rect key={`cheek-plug-r-center-${index}`} x={headX + headDim.width - 3} y={cheekY} width="2" height="2" fill="#000000" opacity={0.3} className="pixel" />
            );
          } else if (marking.location === 'face' && (marking.pattern === 'teeth_inlay' || marking.pattern === 'teeth_filed')) {
            // Tooth modifications - show when mouth is visible
            const mouthY = headY + Math.floor(headDim.height * 0.65);
            
            if (marking.pattern === 'teeth_inlay') {
              // Gold or jade tooth inlay
              const inlayColor = marking.color || '#FFD700';
              elements.push(
                <rect key={`tooth-inlay-${index}`} x={centerX - 1} y={mouthY} width="1" height="1" fill={inlayColor} className="pixel" />,
                <rect key={`tooth-shine-${index}`} x={centerX - 1} y={mouthY} width="1" height="1" fill="#FFFFFF" opacity={0.6} className="pixel" />
              );
            } else if (marking.pattern === 'teeth_filed') {
              // Filed teeth - two white dots indicating filed teeth
              const toothColor = marking.color || '#FFFFFF';
              const actualMouthY = headY + Math.floor(headDim.height * 0.72); // Align with actual mouth position
              // Two dots: one slightly left, one slightly right of center
              elements.push(
                <rect key={`filed-tooth-${index}-left`} x={centerX - 1} y={actualMouthY} width="1" height="1" fill={toothColor} opacity={0.9} className="pixel" />,
                <rect key={`filed-tooth-${index}-right`} x={centerX + 1} y={actualMouthY} width="1" height="1" fill={toothColor} opacity={0.9} className="pixel" />
              );
            }
          }
          break;
        }
        case 'paint': {
          const paintPattern = marking.pattern;

          // Eye band (kohl/mourning paint/eye liner)
          if (paintPattern === 'eye_band' || paintPattern === 'eye_liner') {
            // Use the same eye positioning as renderEyes for accurate placement
            const hairLength = appearanceWithDefaults.hairLength || 'medium';
            const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
            const eyeY = headY + Math.floor(headDim.height * eyeRatioBase);

            if (paintPattern === 'eye_liner' || markingColor === '#000000') {
              // Kohl eye liner - use exact eye positions
              const eyeSpacing = Math.floor(headDim.width * 0.24);
              const centerX = headX + Math.floor(headDim.width / 2);
              const leftEyeX = centerX - eyeSpacing - 2;
              const rightEyeX = centerX + eyeSpacing - 1;

              // Left eye kohl/shadow - surrounding the eye
              elements.push(
                // Upper lid shadow
                <rect key={`kohl-l-top1-${index}`} x={leftEyeX - 2} y={eyeY - 2} width="6" height="1" fill={markingColor} opacity={0.5} className="pixel" />,
                <rect key={`kohl-l-top2-${index}`} x={leftEyeX - 1} y={eyeY - 1} width="4" height="1" fill={markingColor} opacity={0.7} className="pixel" />,
                // Lower lid shadow
                <rect key={`kohl-l-bot1-${index}`} x={leftEyeX - 1} y={eyeY + 2} width="4" height="1" fill={markingColor} opacity={0.6} className="pixel" />,
                <rect key={`kohl-l-bot2-${index}`} x={leftEyeX} y={eyeY + 3} width="2" height="1" fill={markingColor} opacity={0.4} className="pixel" />,
                // Outer corner accent
                <rect key={`kohl-l-corner-${index}`} x={leftEyeX - 3} y={eyeY} width="1" height="2" fill={markingColor} opacity={0.5} className="pixel" />
              );

              // Right eye kohl/shadow - surrounding the eye
              elements.push(
                // Upper lid shadow
                <rect key={`kohl-r-top1-${index}`} x={rightEyeX - 2} y={eyeY - 2} width="6" height="1" fill={markingColor} opacity={0.5} className="pixel" />,
                <rect key={`kohl-r-top2-${index}`} x={rightEyeX - 1} y={eyeY - 1} width="4" height="1" fill={markingColor} opacity={0.7} className="pixel" />,
                // Lower lid shadow
                <rect key={`kohl-r-bot1-${index}`} x={rightEyeX - 1} y={eyeY + 2} width="4" height="1" fill={markingColor} opacity={0.6} className="pixel" />,
                <rect key={`kohl-r-bot2-${index}`} x={rightEyeX} y={eyeY + 3} width="2" height="1" fill={markingColor} opacity={0.4} className="pixel" />,
                // Outer corner accent
                <rect key={`kohl-r-corner-${index}`} x={rightEyeX + 4} y={eyeY} width="1" height="2" fill={markingColor} opacity={0.5} className="pixel" />
              );
            } else {
              // Full eye band (mourning paint or warrior paint)
              elements.push(
                <rect key={`eye-band-${index}`} x={headX + 2} y={eyeY} width={Math.max(1, headDim.width - 4)} height="3" fill={markingColor} opacity={0.9} className="pixel" />
              );
            }
          } else {
            // Other paint patterns
            // Simplified face paint system - just stripes with random colors
            const paintRng = seededRng(seed + index * 777);
            const colorChoice = paintRng();

            // Random paint colors: white (40%), red ochre (30%), black (20%), yellow ochre (10%)
            let paintColor = markingColor || '#FFFFFF'; // Use marking color if provided
            if (!markingColor) {
              if (colorChoice < 0.4) {
                paintColor = '#FFFFFF'; // White clay/chalk
              } else if (colorChoice < 0.7) {
                paintColor = '#CD5C5C'; // Red ochre
              } else if (colorChoice < 0.9) {
                paintColor = '#1C1C1C'; // Charcoal black
              } else {
                paintColor = '#DAA520'; // Yellow ochre
              }
            }

            // Simple pattern selection based on location
            if (marking.location === 'forehead') {
              // Horizontal forehead stripe - clean and bold
              const foreheadY = headY + 4;
              elements.push(
                <rect key={`forehead-stripe-${index}`}
                  x={headX + 3}
                  y={foreheadY}
                  width={headDim.width - 6}
                  height="2"
                  fill={paintColor}
                  opacity={0.85}
                  className="pixel" />
              );
            } else if (marking.location === 'cheek' || marking.location === 'face') {
              // Two vertical stripes on each cheek - clean warrior look
              const cheekY = headY + Math.floor(headDim.height * 0.45);
              for (let side = 0; side < 2; side++) {
                const baseX = side === 0 ? headX + 2 : headX + headDim.width - 4;
                // Two parallel stripes per cheek
                for (let stripe = 0; stripe < 2; stripe++) {
                  elements.push(
                    <rect key={`cheek-stripe-${side}-${stripe}-${index}`}
                      x={baseX + stripe * 2}
                      y={cheekY}
                      width="1"
                      height="5"
                      fill={paintColor}
                      opacity={0.9}
                      className="pixel" />
                  );
                }
              }
            }
          }
          break;
        }
        case 'beauty_mark': {
          const beautyX = headX + (marking.location === 'left' ? 5 : headDim.width - 5);
          const beautyY = headY + Math.floor(headDim.height * 0.6);
          elements.push(<rect key={`beauty-mark-${index}`} x={beautyX} y={beautyY} width="1" height="1" fill="#000000" className="pixel" />);
          break;
        }
        case 'freckles':
          break;
      }
    });

    return <g key="markings">{elements}</g>;
  }, [appearanceWithDefaults.markings, culturalZone, headDim.height, headDim.width, headX, headY, skinTone, skinHighlight, useEquippedItems, character.equippedItems]);

  // ========================= SVG =========================
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ imageRendering: 'pixelated' }}
      className={className}
      role="img"
      aria-label={`Portrait: ${character.class ?? ''} ${era ?? ''}`}
    >
      <defs>
        <style>{`.pixel { shape-rendering: crispEdges; }`}</style>
        {BackgroundDefs}
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="64" height="64" fill={`url(#${bgGradientId})`} />
      <rect x="0" y="0" width="64" height="64" fill={`url(#${bgGradientId})`} style={{ filter: `url(#${textureId})`, opacity: 0.05 }} />

      {/* Body then head so the jaw sits above the collar */}
      {renderBody}
      {renderHead}
      
      {/* Facial micro-shading for depth */}
      {(() => {
        const elements: JSX.Element[] = [];
        renderFaceMicroShades(elements, headX, headY, headDim.width, headDim.height, skinTone);
        return <g key="micro-shading">{elements}</g>;
      })()}

      {/* Hair before headgear */}
      {renderHair}

      {/* Facial features */}
      {renderEyes()}
      {renderNose}
      {renderMouth}
      {renderFacialHair}

      {/* Final facial shadows - rendered after features to ensure visibility */}
      {(() => {
        const elements: JSX.Element[] = [];
        const noseCenterX = headX + Math.floor(headDim.width / 2);

        // Enhanced under-nose shadow (philtrum area between nose and upper lip)
        const mouthY = headY + Math.floor(headDim.height * 0.72);
        const noseBottomY = mouthY - 3;  // Position just above the mouth
        const philtrumShadow = createShadow(actualSkinTone, 0.88);  // More visible shadow
        const deepPhiltrumShadow = createShadow(actualSkinTone, 0.82);  // Darker for center

        // Main philtrum shadow - wider and more defined with gradient
        for (let y = 0; y < 2; y++) {
          const width = y === 0 ? 2 : 3;  // Taper upward
          for (let dx = -width; dx <= width; dx++) {
            // Darker in center, lighter at edges
            const intensity = Math.abs(dx) === 0 ? deepPhiltrumShadow :
                            Math.abs(dx) === 1 ? philtrumShadow :
                            skinMidtone;
            elements.push(
              <rect key={`philtrum-${y}-${dx}`}
                x={noseCenterX + dx}
                y={noseBottomY + y}
                width="1" height="1"
                fill={intensity}
                className="pixel" />
            );
          }
        }

        // Nostril wing shadows for more depth
        const nostrilShadow = createShadow(actualSkinTone, 0.85);
        elements.push(
          <rect key="nostril-wing-l" x={noseCenterX - 3} y={noseBottomY - 1} width="1" height="2" fill={nostrilShadow} className="pixel" />,
          <rect key="nostril-wing-r" x={noseCenterX + 3} y={noseBottomY - 1} width="1" height="2" fill={nostrilShadow} className="pixel" />
        );

        // Under-lip shadow (below lower lip) - warm skin shadow, not lip color
        const lipBottomY = mouthY + 3;
        const lipWidth = appearanceWithDefaults.lipShape === 'wide' ? 4 : 3;

        // Create a warm shadow that's darker than skin but not lip-colored
        const underLipShadow = createShadow(actualSkinTone, 0.88);  // Darker shadow
        const underLipMidtone = createShadow(actualSkinTone, 0.93);  // Lighter edge shadow

        for (let dx = -lipWidth; dx <= lipWidth; dx++) {
          // Gradient shadow - darker in center where lip casts shadow
          const shadowIntensity = Math.abs(dx) <= 1 ? underLipShadow :
                                 Math.abs(dx) <= 2 ? underLipMidtone :
                                 skinMidtone;
          elements.push(
            <rect key={`final-shadow-lip-${dx}`}
              x={noseCenterX + dx}
              y={lipBottomY}
              width="1" height="1"
              fill={shadowIntensity}
              className="pixel" />
          );
        }

        // Add chin cleft shadow for more definition
        elements.push(
          <rect key="chin-cleft" x={noseCenterX} y={lipBottomY + 2} width="1" height="1" fill={underLipMidtone} className="pixel" />
        );

        return <g key="facial-shadows">{elements}</g>;
      })()}

      {/* Disease symptoms */}
      {(() => {
        const elements: JSX.Element[] = [];

        // Smallpox: facial rash/pockmarks
        if (diseaseEffects.hasSmallpox && diseaseEffects.severity >= 1) {
          const rashColor = diseaseEffects.severity >= 2 ? '#8B0000' : '#CD5C5C'; // Dark red for severe, lighter for mild
          const numSpots = diseaseEffects.severity >= 2 ? 12 : 6;

          for (let i = 0; i < numSpots; i++) {
            const spotRng = seededRng(character.stats.constitution + i * 7);
            const x = headX + 2 + Math.floor(spotRng() * (headDim.width - 4));
            const y = headY + 2 + Math.floor(spotRng() * (headDim.height - 4));
            elements.push(
              <rect key={`smallpox-${i}`} x={x} y={y} width="1" height="1" fill={rashColor} className="pixel" />
            );
            // Add larger spots for severe cases
            if (diseaseEffects.severity >= 2 && i < 4) {
              elements.push(
                <rect key={`smallpox-large-${i}`} x={x+1} y={y} width="1" height="1" fill={rashColor} className="pixel" />,
                <rect key={`smallpox-large2-${i}`} x={x} y={y+1} width="1" height="1" fill={rashColor} className="pixel" />
              );
            }
          }
        }

        // Plague: darkened extremities and buboes
        if (diseaseEffects.hasPlague && diseaseEffects.severity >= 2) {
          const buboeColor = '#2F2F2F';
          // Add dark patches around jawline
          elements.push(
            <rect key="plague-jaw1" x={headX + 1} y={headY + headDim.height - 2} width="2" height="1" fill={buboeColor} className="pixel" />,
            <rect key="plague-jaw2" x={headX + headDim.width - 3} y={headY + headDim.height - 2} width="2" height="1" fill={buboeColor} className="pixel" />
          );

          // Severe plague: more extensive darkening
          if (diseaseEffects.severity >= 3) {
            elements.push(
              <rect key="plague-severe1" x={headX} y={headY + headDim.height - 1} width="3" height="1" fill={buboeColor} className="pixel" />,
              <rect key="plague-severe2" x={headX + headDim.width - 3} y={headY + headDim.height - 1} width="3" height="1" fill={buboeColor} className="pixel" />
            );
          }
        }

        // Leprosy: patchy discoloration
        if (diseaseEffects.hasLeprosy && diseaseEffects.severity >= 1) {
          const patchColor = mix(actualSkinTone, '#D3D3D3', 0.6); // Grayish patches
          const numPatches = diseaseEffects.severity >= 2 ? 8 : 4;

          for (let i = 0; i < numPatches; i++) {
            const patchRng = seededRng(character.stats.constitution + i * 11);
            const x = headX + 1 + Math.floor(patchRng() * (headDim.width - 2));
            const y = headY + 1 + Math.floor(patchRng() * (headDim.height - 2));
            elements.push(
              <rect key={`leprosy-${i}`} x={x} y={y} width="2" height="1" fill={patchColor} className="pixel" />
            );
          }
        }

        // Cholera: sunken eyes effect (darkened eye sockets)
        if (diseaseEffects.hasCholera && diseaseEffects.severity >= 2) {
          const sunkenColor = createShadow(actualSkinTone, 0.3);
          elements.push(
            <rect key="cholera-socket1" x={headX + 4} y={headY + 6} width="3" height="1" fill={sunkenColor} className="pixel" />,
            <rect key="cholera-socket2" x={headX + headDim.width - 7} y={headY + 6} width="3" height="1" fill={sunkenColor} className="pixel" />
          );
        }

        // Syphilis: characteristic rash
        if (diseaseEffects.hasSyphilis && diseaseEffects.severity >= 1) {
          const syphilisRashColor = '#B22222'; // Firebrick red
          const numLesions = diseaseEffects.severity >= 2 ? 8 : 4;

          for (let i = 0; i < numLesions; i++) {
            const spotX = headX + 3 + (i * 3) % (headDim.width - 6);
            const spotY = headY + 8 + Math.floor(i / 3) * 4;
            elements.push(
              <rect key={`syphilis-${i}`} x={spotX} y={spotY} width="2" height="2" fill={syphilisRashColor} opacity="0.6" className="pixel" />
            );
          }
        }

        // Measles: characteristic red rash
        if (diseaseEffects.hasMeasles && diseaseEffects.severity >= 1) {
          const measlesRashColor = '#DC143C'; // Crimson
          const numSpots = diseaseEffects.severity >= 2 ? 15 : 8;

          // Use deterministic positioning based on seed
          const measlesRng = seededRng(seed + 9876);
          for (let i = 0; i < numSpots; i++) {
            const spotX = headX + 2 + Math.floor(measlesRng() * (headDim.width - 4));
            const spotY = headY + 4 + Math.floor(measlesRng() * (headDim.height - 8));
            elements.push(
              <rect key={`measles-${i}`} x={spotX} y={spotY} width="1" height="1" fill={measlesRashColor} opacity="0.7" className="pixel" />
            );
          }
        }

        // Rabies: foaming mouth effect
        if (diseaseEffects.hasRabies && diseaseEffects.severity >= 2) {
          const foamColor = '#F5F5F5';
          elements.push(
            <rect key="rabies-foam1" x={headX + headDim.width/2 - 1} y={headY + headDim.height - 3} width="1" height="1" fill={foamColor} className="pixel" />,
            <rect key="rabies-foam2" x={headX + headDim.width/2} y={headY + headDim.height - 3} width="1" height="1" fill={foamColor} className="pixel" />,
            <rect key="rabies-foam3" x={headX + headDim.width/2 + 1} y={headY + headDim.height - 4} width="1" height="1" fill={foamColor} className="pixel" />
          );
        }

        return <g key="disease-symptoms">{elements}</g>;
      })()}

      {/* Glasses (after face but before headgear) */}
      {renderGlasses}

      {/* Markings */}
      {renderMarkings}

      {/* Headgear & jewelry */}
      {renderHeadgear}
      {renderJewelry}
      {renderAmulet}
      {renderAccessories}
    </svg>
  );
};

export default ProceduralPortrait;
