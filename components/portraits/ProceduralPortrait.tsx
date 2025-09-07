import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  bayer4, seededRng, mix, plotPixel,
  skinRamp, hairRamp, outlineColor,
  renderFaceMicroShades, renderStubble,
  renderEnhancedEyes, renderHairHighlightAndFuzz,
  aaConcaveCorners, renderGlassesShine, renderEarring
} from './portraitUtils';

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
      amulet?: { name: string; material?: string; color?: string };
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
      facialHairStyle?: 'full_beard' | 'goatee' | 'mustache' | 'stubble' | 'van_dyke' | 'soul_patch' | 'mutton_chops';
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
  const { age = 30, gender, stats = {}, appearance = {}, wealthLevel, era, culturalZone = 'EUROPEAN' } = character;

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

  // Parse hairstyle name to get actual style and length
  const parseHairstyle = (hairstyle: string): { length: typeof appearanceWithDefaults.hairLength; style: string; texture?: typeof appearanceWithDefaults.hairTexture } => {
    const lower = hairstyle.toLowerCase();
    
    // Check for specific styles first
    if (lower.includes('bald') || lower === 'none') return { length: 'bald', style: 'none' };
    
    // Compound styles - check for combinations first
    if (lower.includes('braided bun') || lower.includes('bun') && lower.includes('braid')) return { length: 'medium', style: 'braided_bun' };
    if (lower.includes('braided_crown') || lower.includes('braided crown')) return { length: 'long', style: 'braided_crown' };
    
    if (lower.includes('elaborate braid')) return { length: 'long', style: 'braided', texture: 'straight' };
    if (lower.includes('braid')) return { length: 'medium', style: 'braided' };
    if (lower.includes('novice')) return { length: 'short', style: 'simple' };
    if (lower.includes('ponytail')) return { length: 'long', style: 'ponytail' };
    if (lower.includes('bun')) return { length: 'medium', style: 'bun' };
    if (lower.includes('mohawk')) return { length: 'short', style: 'mohawk' };
    if (lower.includes('afro')) return { length: 'medium', style: 'afro', texture: 'kinky' };
    if (lower.includes('dreadlock') || lower.includes('locs')) return { length: 'long', style: 'locs', texture: 'coily' };
    if (lower.includes('crew') || lower.includes('military')) return { length: 'very_short', style: 'crew' };
    if (lower.includes('bob')) return { length: 'short', style: 'bob' };
    if (lower.includes('pixie')) return { length: 'very_short', style: 'pixie' };
    if (lower.includes('topknot')) return { length: 'medium', style: 'topknot' };
    if (lower.includes('queue')) return { length: 'long', style: 'queue' };
    
    // Medieval/historical styles
    if (lower.includes('page cut') || lower.includes('pageboy')) return { length: 'short', style: 'pageboy' };
    if (lower.includes('bowl cut') || lower.includes('bowl')) return { length: 'short', style: 'bowl_cut' };
    
    // Renaissance styles
    if (lower.includes('renaissance_rolls') || lower.includes('renaissance rolls')) return { length: 'medium', style: 'renaissance_rolls' };
    if (lower.includes('elaborate_braids')) return { length: 'long', style: 'braided' };
    if (lower.includes('side_curls')) return { length: 'medium', style: 'side_curls' };
    if (lower.includes('high_forehead')) return { length: 'medium', style: 'high_forehead' };
    if (lower.includes('pearl_net')) return { length: 'medium', style: 'covered' };
    if (lower.includes('shoulder_curled')) return { length: 'medium', style: 'curled' };
    if (lower.includes('courtier_locks')) return { length: 'long', style: 'flowing' };
    if (lower.includes('artist_mane')) return { length: 'long', style: 'flowing' };
    if (lower.includes('renaissance_bob')) return { length: 'short', style: 'bob' };
    
    // Antiquity styles
    if (lower.includes('greek_bun')) return { length: 'medium', style: 'bun' };
    if (lower.includes('roman_waves')) return { length: 'medium', style: 'wavy' };
    if (lower.includes('braided_crown')) return { length: 'long', style: 'braided' };
    if (lower.includes('goddess_locks')) return { length: 'long', style: 'flowing' };
    if (lower.includes('priestess_style')) return { length: 'long', style: 'covered' };
    if (lower.includes('short_cropped')) return { length: 'very_short', style: 'simple' };
    if (lower.includes('medium_curled')) return { length: 'medium', style: 'curled' };
    if (lower.includes('senator_style')) return { length: 'short', style: 'formal' };
    
    // Medieval styles
    if (lower.includes('long_plaits')) return { length: 'long', style: 'braided' };
    if (lower.includes('maiden_braids')) return { length: 'long', style: 'braided' };
    if (lower.includes('braided_buns')) return { length: 'medium', style: 'braided_bun' };
    if (lower.includes('covered_hair')) return { length: 'medium', style: 'covered' };
    if (lower.includes('courtly_braids')) return { length: 'long', style: 'braided' };
    if (lower.includes('noble_wimple')) return { length: 'medium', style: 'covered' };
    if (lower.includes('shoulder_length')) return { length: 'medium', style: 'simple' };
    if (lower.includes('monk_style')) return { length: 'short', style: 'tonsure' };
    if (lower.includes('knight_cut')) return { length: 'short', style: 'simple' };
    if (lower.includes('noble_waves')) return { length: 'medium', style: 'wavy' };
    
    // Industrial era styles
    if (lower.includes('gibson_girl')) return { length: 'long', style: 'elaborate_updo' };
    if (lower.includes('victorian_updo')) return { length: 'long', style: 'elaborate_updo' };
    if (lower.includes('elaborate_bun')) return { length: 'medium', style: 'elaborate_bun' };
    if (lower.includes('chignon')) return { length: 'medium', style: 'chignon' };
    if (lower.includes('matron_waves')) return { length: 'medium', style: 'wavy' };
    if (lower.includes('side_part')) return { length: 'short', style: 'parted' };
    if (lower.includes('slicked_back')) return { length: 'short', style: 'slicked' };
    if (lower.includes('gentleman_cut')) return { length: 'short', style: 'formal' };
    if (lower.includes('victorian_waves')) return { length: 'medium', style: 'wavy' };
    
    // Modern era styles
    if (lower.includes('finger_waves')) return { length: 'short', style: 'finger_waves' };
    if (lower.includes('flapper_style')) return { length: 'short', style: 'flapper' };
    if (lower.includes('pin_curls')) return { length: 'short', style: 'pin_curls' };
    if (lower.includes('victory_rolls')) return { length: 'medium', style: 'victory_rolls' };
    if (lower.includes('marcel_waves')) return { length: 'medium', style: 'marcel_waves' };
    if (lower.includes('pompadour')) return { length: 'short', style: 'pompadour' };
    if (lower.includes('professional_cut')) return { length: 'short', style: 'professional' };
    
    // Prehistoric styles
    if (lower.includes('long_wild')) return { length: 'very_long', style: 'wild' };
    if (lower.includes('medium_messy')) return { length: 'medium', style: 'messy' };
    if (lower.includes('tied_back')) return { length: 'long', style: 'tied_back' };
    if (lower.includes('warrior_knot')) return { length: 'medium', style: 'topknot' };
    if (lower.includes('shaman_braids')) return { length: 'long', style: 'braided' };
    if (lower.includes('tribal_braids')) return { length: 'long', style: 'braided' };
    
    // General age/condition styles
    if (lower.includes('balding')) return { length: 'very_short', style: 'balding' };
    if (lower.includes('thin_long')) return { length: 'long', style: 'thin' };
    if (lower.includes('elder_') || lower.includes('old_')) return { length: 'medium', style: 'elder' };
    
    // Check for length indicators
    if (lower.includes('very short')) return { length: 'very_short', style: 'simple' };
    if (lower.includes('very long')) return { length: 'very_long', style: 'flowing' };
    if (lower.includes('short')) return { length: 'short', style: 'simple' };
    if (lower.includes('long')) return { length: 'long', style: 'flowing' };
    if (lower.includes('medium')) return { length: 'medium', style: 'simple' };
    
    // Default fallback
    return { length: appearanceWithDefaults.hairLength || 'medium', style: 'simple' };
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
  // Color ramps are now imported from portraitUtils

  // ---------- Head Geometry ----------
  const headDim = useMemo(() => {
    const faceShape = appearanceWithDefaults.faceShape || 'oval';
    let width = isFemale ? 22 : 26;
    let height = isFemale ? 34 : 36;  // Increased from 28/30 to 34/36 for better proportions

    if (isYoung) { width += 2; height -= 1; }
    if (isOld)   { height += 3; width -= 1; }

    if (stats.strength >= 8) width += isFemale ? 1 : 3;
    else if (stats.strength <= 3) width -= isFemale ? 0 : 2;

    if (appearanceWithDefaults.build === 'imposing') width += 2;
    if (appearanceWithDefaults.build === 'slight') width -= 2;

    if (hairLength === 'bald') height += 4;
    if (hairLength === 'very_short') height += 2;

    switch (faceShape) {
      case 'round':  width += 2; height -= 2; break;
      case 'square': if (!isFemale) width += 1; break;
      case 'long':   width -= 1; height += 3; break;
    }
    return { width, height, shape: faceShape as NonNullable<typeof appearanceWithDefaults.faceShape> };
  }, [appearanceWithDefaults.build, appearanceWithDefaults.faceShape, hairLength, isFemale, isOld, isYoung, stats.strength]);

  const headX = 32 - (headDim.width / 2);
  const headY = 10;

  // ---------- Skin/Hair Palette ----------
  const isSick =
    (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
    (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

  let actualSkinTone = appearanceWithDefaults.skinColor;
  if (isSick) {
    const r = parseInt(actualSkinTone.slice(1, 3), 16);
    const g = parseInt(actualSkinTone.slice(3, 5), 16);
    const b = parseInt(actualSkinTone.slice(5, 7), 16);
    const sickR = Math.max(0, r - 15);
    const sickG = g;
    const sickB = Math.max(0, b - 10);
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

  if (expr) {
    switch (expr) {
      case 'smile':
      case 'approve':
      case 'smirk':
        expressionType = 1; // smile family
        break;
      case 'scowl':
      case 'sad':
        expressionType = 2; // frown family
        break;
      case 'concern':
        expressionType = 4; // pursed/concern
        break;
      case 'surprise':
        expressionType = 0; // eyes widen; mouth neutral (handled in eyes)
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
    return isFemale && isWealthy ? createHighlight(base, 1.2) : base;
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

    if (isFemale) {
      return {
        shoulderWidth: Math.floor(baseHeadWidth * 1.5 * shoulderMod),
        chestWidth: Math.floor(baseHeadWidth * 1.3 * shoulderMod),
        waistWidth: Math.floor(baseHeadWidth * 1.1 * waistMod),
        hipWidth: Math.floor(baseHeadWidth * 1.45 * hipMod),
        armWidth: stats.strength >= 7 ? 5 : 4,
        bodyHeight: Math.floor(30 * heightMod),
        legLength: Math.floor(14 * heightMod)
      };
    } else {
      const shoulderWidth = Math.floor(baseHeadWidth * 2.1 * shoulderMod);
      const chestWidth = Math.floor(shoulderWidth * 0.92);
      return {
        shoulderWidth,
        chestWidth,
        waistWidth: Math.floor(chestWidth * 0.85 * waistMod),
        hipWidth: Math.floor(chestWidth * 0.9 * hipMod),
        armWidth: stats.strength >= 7 ? 7 : 6,
        bodyHeight: Math.floor(30 * heightMod),
        legLength: Math.floor(14 * heightMod)
      };
    }
  }, [appearanceWithDefaults.build, appearanceWithDefaults.height, isFemale, isOld, isYoung, stats.strength]);

  // ---------- Background ----------
  const bgGradientId = `bgGradient-${uniqueId}`;
  const textureId = `texture-${uniqueId}`;

  const BackgroundDefs = useMemo(() => {
    const isDarkSkin = ['dark', 'very_dark'].includes(skinToneType);
    const culturalBackgrounds: Record<NonNullable<typeof culturalZone>, [string, string]> = {
      EUROPEAN: isDarkSkin ? ['#FFF8DC', '#FFEFD5'] : ['#B0E0E6', '#87CEEB'],
      EAST_ASIAN: isDarkSkin ? ['#FFE4E1', '#FFF0F5'] : ['#E0E0E0', '#D3D3D3'],
      MENA: ['#F4E4C1', '#E4D4A1'],
      SOUTH_ASIAN: ['#FFE5CC', '#FFD4B3'],
      SUB_SAHARAN_AFRICAN: ['#F5DEB3', '#FFE4B5'],
      SOUTH_AMERICAN: ['#DEB887', '#D2B48C'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['#CD853F', '#D2B48C'],
      NORTH_AMERICAN_COLONIAL: ['#C7D0D8', '#9FB3C8'],
      OCEANIA: ['#FFE4B5', '#FFDEAD']
    };
    const [bg1, bg2] = culturalBackgrounds[culturalZone] || culturalBackgrounds.EUROPEAN;

    return (
      <>
        <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="50%" stopColor={createHighlight(bg1, 0.95)} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
        <filter id={textureId}>
          <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed={seed} />
          <feComposite operator="over" in2="noise" />
        </filter>
      </>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgGradientId, textureId, culturalZone, seed, skinToneType]);

  // ========================= RENDERERS =========================

  // ----- HEAD -----
const renderHead = useMemo(() => {
  const elements: JSX.Element[] = [];
  const faceShape = appearanceWithDefaults.faceShape || 'oval';
  const jawline = appearanceWithDefaults.jawline || 'soft';
  const cheekbones = appearanceWithDefaults.cheekbones || 'average';
  const skinTexture = appearanceWithDefaults.skinTexture || 'smooth';

  // helpers
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth01 = (x: number) => {
    const t = clamp((x - 0) / 1, 0, 1);
    return t * t * (3 - 2 * t); // classic smoothstep
  };
  const smooth = (a: number, b: number, x: number, x0: number, x1: number) =>
    lerp(a, b, smooth01(clamp((x - x0) / (x1 - x0), 0, 1)));
  const bell = (t: number, m = 0.5, s = 0.22) =>
    Math.exp(-((t - m) * (t - m)) / (2 * s * s));

  // anchor defaults by face shape
  // values are normalized width multipliers (relative to headDim.width)
  let topW   = 0.82;
  let cheekW = 1.00;
  let chinW  = 0.70;
  let tPeak  = 0.54; // where max width occurs (0=top, 1=chin)

  switch (faceShape) {
    case 'round':
      topW = 0.86; cheekW = 1.02; chinW = 0.78; tPeak = 0.52; break;
    case 'oval':
      topW = 0.82; cheekW = 1.00; chinW = 0.70; tPeak = 0.54; break;
    case 'square':
      topW = 0.84; cheekW = 1.02; chinW = 0.84; tPeak = 0.53; break;
    case 'heart':
      topW = 0.86; cheekW = 1.02; chinW = 0.56; tPeak = 0.50; break;
    case 'diamond':
      topW = 0.76; cheekW = 1.06; chinW = 0.68; tPeak = 0.55; break;
    case 'long':
      topW = 0.80; cheekW = 0.96; chinW = 0.66; tPeak = 0.58; break;
  }

  // jawline influence (only widens/narrows lower third anchors)
  if (jawline === 'square') chinW += 0.10;
  else if (jawline === 'sharp') chinW -= 0.08;

  // cheekbone influence (only boosts cheek anchor)
  if (cheekbones === 'high') cheekW += 0.04;
  else if (cheekbones === 'low') cheekW -= 0.03;

  // hair length subtly affects the crown
  if (hairLength === 'bald' || hairLength === 'very_short') topW += 0.02;

  // hard safety clamps on anchors
  topW = clamp(topW, 0.72, 0.92);
  cheekW = clamp(cheekW, 0.92, 1.10);
  chinW = clamp(chinW, 0.52, 0.90);
  tPeak = clamp(tPeak, 0.48, 0.62);

  // precompute row widths with a strictly unimodal baseline
  const H = headDim.height;
  const widthsNorm: number[] = new Array(H);

  for (let y = 0; y < H; y++) {
    const t = H > 1 ? y / (H - 1) : 0.0;

    // piecewise smoothstep from top→cheek, then cheek→chin
    const base =
      t <= tPeak
        ? smooth(topW, cheekW, t, 0, tPeak)
        : smooth(cheekW, chinW, t, tPeak, 1);

    // gentle additive styling that NEVER subtracts width (prevents pinches)
    let styled = base;

    // cheek emphasis
    const cheekBoost =
      faceShape === 'round'   ? 0.06 :
      faceShape === 'diamond' ? 0.08 :
      faceShape === 'square'  ? 0.04 :
      faceShape === 'heart'   ? 0.05 :
      faceShape === 'long'    ? 0.03 :
      0.05;
    styled += cheekBoost * bell(t, tPeak, 0.18);

    // slight crown smoothing (only adds)
    styled += 0.02 * bell(t, 0.12, 0.10);

    // final normalized width with guard rails
    widthsNorm[y] = clamp(styled, 0.50, 1.12);
  }

  // ---- UNIMODAL SWEEP (strictly no waist) ----
  // ensure non-decreasing from top to peak
  const peakY = Math.round(tPeak * (H - 1));
  for (let y = 1; y <= peakY; y++) {
    if (widthsNorm[y] < widthsNorm[y - 1]) widthsNorm[y] = widthsNorm[y - 1];
  }
  // ensure non-increasing from peak to chin
  for (let y = H - 2; y >= peakY; y--) {
    if (widthsNorm[y] < widthsNorm[y + 1]) widthsNorm[y] = widthsNorm[y + 1];
  }

  // draw
  for (let y = 0; y < H; y++) {
    const t = H > 1 ? y / (H - 1) : 0.0;
    const wNorm = widthsNorm[y];
    const rowWidth = Math.max(6, Math.round(headDim.width * wNorm));
    const startX = headX + Math.floor((headDim.width - rowWidth) / 2);

    // outlines
    elements.push(
      <rect key={`outline-outer-l-${y}`} x={startX - 2} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
      <rect key={`outline-outer-r-${y}`} x={startX + rowWidth + 1} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
      <rect key={`outline-l-${y}`}        x={startX - 1} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />,
      <rect key={`outline-r-${y}`}        x={startX + rowWidth} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />
    );

    // fill & shading (kept consistent with your previous logic)
    for (let x = 0; x < rowWidth; x++) {
      let faceColor = skinTone;
      const xRatio = x / rowWidth;

      if (xRatio < 0.15) faceColor = skinBrightHighlight;
      else if (xRatio < 0.25) faceColor = skinHighlight;
      else if (xRatio < 0.4) faceColor = createHighlight(skinTone, 1.08);
      else if (xRatio > 0.85) faceColor = skinDeepShadow;
      else if (xRatio > 0.75) faceColor = skinShadow;
      else if (xRatio > 0.6) faceColor = skinMidtone;

      const relativeY = t;
      if (relativeY > 0.3 && relativeY < 0.5) {
        if (x < 3 || x > rowWidth - 4) faceColor = skinSubsurface;
      }

      if (cheekbones !== 'low' && relativeY > 0.4 && relativeY < 0.65) {
        const cheekboneIntensity = cheekbones === 'high' ? 0.12 : 0.08;
        if (Math.abs(xRatio - 0.22) < cheekboneIntensity || Math.abs(xRatio - 0.78) < cheekboneIntensity) {
          faceColor = createHighlight(faceColor, xRatio < 0.5 ? 1.1 : 1.05);
        }
      }

      if (relativeY > 0.25 && relativeY < 0.65 && Math.abs(x - rowWidth / 2) < 2) {
        faceColor = createHighlight(faceColor, 1.12); // nose bridge
      }

      if (skinTexture === 'freckled' && rand(x * 100 + y * 1000) > 0.92) {
        faceColor = createShadow(faceColor, 0.85);
      } else if (skinTexture === 'weathered' && rand(x * 50 + y * 500) > 0.88) {
        faceColor = createShadow(faceColor, 0.92);
      }
      if (hasAgeSpots && relativeY > 0.3 && relativeY < 0.7 && rand(x * 200 + y * 2000) > 0.96) {
        faceColor = createShadow(faceColor, 0.75);
      }
      if (hasWrinkles) {
        if ((relativeY > 0.18 && relativeY < 0.32) && y % 4 === 0) faceColor = createShadow(faceColor, 0.88);
        if ((relativeY > 0.35 && relativeY < 0.45) && (xRatio < 0.15 || xRatio > 0.85) && ((x + y) % 3 === 0)) faceColor = createShadow(faceColor, 0.9);
        if ((relativeY > 0.55 && relativeY < 0.75) && (xRatio < 0.3 || xRatio > 0.7) && ((x - Math.floor(rowWidth / 2)) % 4 === 0)) faceColor = createShadow(faceColor, 0.89);
      }

      elements.push(
        <rect key={`face-${y}-${x}`} x={startX + x} y={headY + y} width="1" height="1" fill={faceColor} className="pixel" />
      );
    }
  }

  return <g key="head">{elements}</g>;
}, [
  appearanceWithDefaults.cheekbones,
  appearanceWithDefaults.faceShape,
  appearanceWithDefaults.jawline,
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
  skinTone
]);

  // ----- HAIR -----
  const renderHair = useMemo(() => {
    const elements: JSX.Element[] = [];
    const hairLen = hairLength;
    if (hairLen === 'bald') return <g key="hair" />;

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

    // Special style rendering
    const centerX = headX + headDim.width / 2;
    
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

      for (let layer = 0; layer < 3; layer++) {
        const col = layer === 0 ? naturalHairDeepShadow
                  : layer === 1 ? naturalBaseHair
                  :               naturalHairHighlight;

        for (let w = 0; w < braidWidth; w++) {
          const px = Math.round(baseX + w + weave);

          // hard guard: never draw inside the face rectangle
          const insideFace = (px >= headX && px < headX + headDim.width);
          if (insideFace) continue;

          elements.push(
            <rect
              key={`braid-${b}-${layer}-${w}-${y}`}
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
}

    
    // Render bun - needs base hair coverage first, then elevated bun
    if (hairStyle === 'bun') {
      // First render base hair covering the scalp
      for (let layer = 0; layer < 2; layer++) {
        for (let y = hairTop; y < headY + 6; y++) {
          for (let x = headX - 4 + layer; x < headX + headDim.width + 4 - layer; x++) {
            const dist = Math.abs(x - centerX);
            let draw = false;
            const col = layer === 0 ? naturalHairShadow : naturalBaseHair;

            // Cover top and sides of head
            if (y < headY + 2) {
              const allowed = (headDim.width / 2 + 3) * thickness;
              if (dist < allowed - layer) draw = true;
            } else if (y >= headY + 2 && y < headY + 4) {
              if (dist <= headDim.width / 2 + 1 - layer) draw = true;
            }

            // Keep face area clear
            const faceTop = headY + 3;
            const faceCenterWidth = headDim.width / 2 - 2;
            if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              elements.push(<rect key={`bun-base-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
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
        const width = 4 - Math.floor((y - tieY) / 8);
        for (let layer = 0; layer < 3; layer++) {
          const col = layer === 0 ? naturalHairShadow : layer === 1 ? naturalBaseHair : naturalHairHighlight;
          for (let x = -width; x <= width; x++) {
            elements.push(<rect key={`tail-${layer}-${x}-${y}`} x={centerX + x + sway} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
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
        const width = heightProgress < 0.5 ? 2 : 2 - Math.floor(heightProgress * 2);
        for (let layer = 0; layer < 2; layer++) {
          const col = layer === 0 ? naturalHairShadow : naturalBaseHair;
          for (let x = -width; x <= width; x++) {
            elements.push(<rect key={`mohawk-${layer}-${x}-${y}`} x={centerX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
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
            const faceCenterWidth = headDim.width / 2 - 3;
            const isInFaceArea = y >= faceTop && y <= faceBottom && Math.abs(dx) <= faceCenterWidth;
            
            if (!isInFaceArea) {
              const noise = Math.sin(x * 1.5 + y * 1.5) * 0.5 + Math.cos(x * 2.1 - y * 1.8) * 0.3;
              const layer = dist < afroRadius * 0.6 ? 2 : dist < afroRadius * 0.85 ? 1 : 0;
              const col = layer === 0 ? hairDeepShadow : layer === 1 ? baseHair : noise > 0.2 ? hairHighlight : baseHair;
              
              elements.push(<rect key={`afro-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    
    // Render pageboy cut
    if (hairStyle === 'pageboy') {
      for (let layer = 0; layer < 3; layer++) {
        for (let y = hairTop - layer; y < headY + 8; y++) {
          for (let x = headX - 3 + layer; x < headX + headDim.width + 3 - layer; x++) {
            const dist = Math.abs(x - centerX);
            let draw = false;
            const col = layer === 0 ? hairDeepShadow : layer === 1 ? baseHair : hairHighlight;

            // Even bowl-like shape around head
            if (y < headY + 2) {
              const allowed = (headDim.width / 2 + 3) * thickness;
              if (dist < allowed - layer) draw = true;
            } else if (y >= headY + 2 && y < headY + 6) {
              // Straight cut around ears and nape
              if (dist <= headDim.width / 2 + 1 - layer) draw = true;
            }

            // Keep forehead clear
            const faceTop = headY + 1;
            const faceCenterWidth = headDim.width / 2 - 2;
            if (y >= faceTop && y <= headY + 4 && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              elements.push(<rect key={`pageboy-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    
    // Render bowl cut
    if (hairStyle === 'bowl_cut') {
      for (let layer = 0; layer < 2; layer++) {
        for (let y = hairTop - layer; y < headY + 5; y++) {
          for (let x = headX - 4 + layer; x < headX + headDim.width + 4 - layer; x++) {
            const dist = Math.abs(x - centerX);
            let draw = false;
            const col = layer === 0 ? naturalHairShadow : naturalBaseHair;

            // Perfect bowl shape
            const bowlRadius = headDim.width / 2 + 2;
            const dy = y - (headY - 1);
            const bowlDist = Math.sqrt(dist * dist + dy * dy);
            
            if (bowlDist <= bowlRadius && y < headY + 3) {
              draw = true;
            }

            // Clear face area more aggressively
            const faceTop = headY + 2;
            const faceCenterWidth = headDim.width / 2 - 1;
            if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              elements.push(<rect key={`bowl-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    
    // Render braided bun (combination style) - needs base coverage + elevated bun
    if (hairStyle === 'braided_bun') {
      // Base hair coverage
      for (let layer = 0; layer < 2; layer++) {
        for (let y = hairTop; y < headY + 5; y++) {
          for (let x = headX - 4 + layer; x < headX + headDim.width + 4 - layer; x++) {
            const dist = Math.abs(x - centerX);
            const col = layer === 0 ? naturalHairShadow : naturalBaseHair;
            let draw = false;

            if (y < headY + 2) {
              const allowed = (headDim.width / 2 + 3) * thickness;
              if (dist < allowed - layer) draw = true;
            } else if (y >= headY + 2 && y < headY + 4) {
              if (dist <= headDim.width / 2 + 1 - layer) draw = true;
            }

            const faceTop = headY + 3;
            const faceCenterWidth = headDim.width / 2 - 2;
            if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              elements.push(<rect key={`braidbun-base-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
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
            const faceCenterWidth = headDim.width / 2 - 2;
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
            const faceCenterWidth = headDim.width / 2 - 3;
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
    if (hairStyle === 'simple' || hairStyle === 'flowing' || hairStyle === 'bob' || hairStyle === 'pixie' || hairStyle === 'crew') {
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
          const faceCenterWidth = headDim.width / 2 - 2;
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
            const inner = headDim.width / 2 - 3;
            if (Math.abs(x - centerX) < inner) draw = false;
          }

          if (draw && (!isOld || rand(x + y * 100 + layer * 1000) > 0.35)) {
            const p = getHairPattern(x, y);
            if (p > 0.3) col = layer === 2 ? hairBrightHighlight : hairHighlight;
            else if (p < -0.3) col = hairDeepShadow;
            if (rand(x * 10 + y * 100 + layer * 500) > 0.8) col = createHighlight(col, 1.1);
            elements.push(<rect key={`hair-${layer}-${x}-${y}`} x={x + p * 0.3} y={y} width="1" height="1" fill={col} className="pixel" />);
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
              elements.push(<rect key={`hair-left-${strand}-${x}-${y}`} x={x + s * 0.4 + p + flow} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
          for (let x = headX + headDim.width - 4 + strandOffset; x < headX + headDim.width + 6 - widthReduction - strandOffset; x++) {
            const p = getHairPattern(x, y);
            const s = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            let col = strand === 0 ? naturalHairShadow : strand === 1 ? naturalBaseHair : naturalHairHighlight;
            if (s > 0.2 && strand === 2) col = naturalHairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              elements.push(<rect key={`hair-right-${strand}-${x}-${y}`} x={x - s * 0.4 - p - flow} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }

    return <g key="hair">{elements}</g>;
  }, [hairTexture, hairStyle, baseHair, hairBrightHighlight, hairDeepShadow, hairHighlight, hairShadow, headDim.width, headX, headY, hairLength, isOld, isYoung, skinTone, isFemale]);

  // ----- EYES (with expression tweaks) -----
  const renderEyes = () => {
    const elements: JSX.Element[] = [];
    
    // Disabled enhanced eye rendering due to visual artifacts
    // renderEnhancedEyes(elements, headX, headY, headDim.width, headDim.height, appearanceWithDefaults.eyeColor, skinTone);
    
    // Keep existing variables for expression/eyebrow logic
    const eyeShape = appearanceWithDefaults.eyeShape || 'almond';
    const eyebrowShape = appearanceWithDefaults.eyebrowShape || 'arched';
    const eyebrowThickness = appearanceWithDefaults.eyebrowThickness || 'medium';
    const eyelashes = appearanceWithDefaults.eyelashes || 'medium';

    const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
    const eyeY = headY + Math.floor(headDim.height * eyeRatioBase);

    const eyeSpacing = Math.floor(headDim.width * 0.24);
    const centerX = headX + Math.floor(headDim.width / 2);
    const leftEyeX = centerX - eyeSpacing - 2;
    const rightEyeX = centerX + eyeSpacing - 1;

    const isFatigued =
      character.fatigue !== undefined && character.maxFatigue !== undefined &&
      (character.fatigue / character.maxFatigue) < 0.4;

    const isIll =
      (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
      (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    const socketDepth = eyeShape === 'hooded' ? 0.55 : (isFatigued ? 0.45 : 0.7);
    elements.push(
      <rect key="socket-l" x={leftEyeX - 3} y={eyeY - 2} width="7" height="1" fill={createComplementaryShadow(skinTone, socketDepth)} className="pixel" />,
      <rect key="socket-r" x={rightEyeX - 3} y={eyeY - 2} width="7" height="1" fill={createComplementaryShadow(skinTone, socketDepth)} className="pixel" />
    );

    let eyeWidth = 4;
    let eyeHeight = 2;

    if (isFatigued) {
      elements.push(
        <rect key="bag-l1" x={leftEyeX - 2} y={eyeY + eyeHeight + 1} width="6" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
        <rect key="bag-r1" x={rightEyeX - 2} y={eyeY + eyeHeight + 1} width="6" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
        <rect key="bag-l2" x={leftEyeX - 1} y={eyeY + eyeHeight + 2} width="4" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />,
        <rect key="bag-r2" x={rightEyeX - 1} y={eyeY + eyeHeight + 2} width="4" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />
      );
    }

    // Surprise: widen eyes a bit (mouth stays neutral by design)
    if (exprIsSurprised) {
      eyeWidth += 1;
      eyeHeight += 1;
    }

    switch (eyeShape) {
      case 'round': eyeWidth = Math.max(eyeWidth, 4); eyeHeight = Math.max(eyeHeight, 3); break;
      case 'narrow': eyeWidth = Math.max(eyeWidth, 3); eyeHeight = Math.min(eyeHeight, 2); break;
      case 'wide': eyeWidth = Math.max(eyeWidth, 5); break;
      case 'hooded':
        eyeHeight = Math.min(eyeHeight, 2);
        elements.push(
          <rect key="hood-l" x={leftEyeX - 1} y={eyeY - 1} width="5" height="1" fill={createShadow(skinTone, 0.95)} className="pixel" />,
          <rect key="hood-r" x={rightEyeX - 1} y={eyeY - 1} width="5" height="1" fill={createShadow(skinTone, 0.95)} className="pixel" />
        );
        break;
    }

    const eyeWhiteColor = isIll ? 'rgb(255,250,240)' : (stats.constitution >= 8 ? 'rgb(255,255,255)' : 'rgb(250,250,250)');
    elements.push(
      <rect key="eye-white-l" x={leftEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />,
      <rect key="eye-white-r" x={rightEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />
    );

    let irisSize = 2;
    let irisOffset = 1;
    if (gazeDirection === 0) irisOffset = 0;
    else if (gazeDirection === 2) irisOffset = eyeWidth - irisSize;

    const irisY = eyeShape === 'round' ? eyeY + 0.5 : eyeY;
    elements.push(
      <rect key="iris-l" x={leftEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} fill={appearanceWithDefaults.eyeColor} className="pixel" />,
      <rect key="iris-r" x={rightEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} fill={appearanceWithDefaults.eyeColor} className="pixel" />
    );

    const pupilSize = microExpression === 0 ? 1 : 1.5;
    elements.push(
      <rect key="pupil-l" x={leftEyeX + irisOffset + 0.5} y={irisY + 0.5} width={pupilSize} height={pupilSize} fill="rgb(0,0,0)" className="pixel" />,
      <rect key="pupil-r" x={rightEyeX + irisOffset + 0.5} y={irisY + 0.5} width={pupilSize} height={pupilSize} fill="rgb(0,0,0)" className="pixel" />
    );

    // Shine: also show for approve/smile/smirk to feel friendly
    if (stats.constitution >= 6 || microExpression === 1 || exprIsSmileFamily) {
      elements.push(
        <rect key="shine-l" x={leftEyeX + irisOffset} y={irisY} width="1" height="1" fill="rgb(255,255,255)" opacity={0.6} className="pixel" />,
        <rect key="shine-r" x={rightEyeX + irisOffset} y={irisY} width="1" height="1" fill="rgb(255,255,255)" opacity={0.6} className="pixel" />
      );
    }

    // ---------- BROWS ----------
    const browColor = hasGrayHair ? 'rgb(169,169,169)' : baseHair;

    const isSmiling = exprIsSmileFamily || expressionType === 1;
    const browLift = isSmiling ? 2 : 0;
    const scowlDrop = exprIsScowl ? 2 : 0;
    const concernDrop = exprIsConcern ? 1 : 0;

    // Allow asymmetric lift for smirk (lift right a bit)
    const smirkRightLift = exprIsSmirk ? 1 : 0;
    const smirkLeftLift = 0;

    const browYBase = eyeY - 3 - (microExpression === 2 ? 1 : 0);
    const browYLeft = browYBase - browLift + scowlDrop + concernDrop - smirkLeftLift;
    const browYRight = browYBase - browLift + scowlDrop + concernDrop - smirkRightLift;

    const browT = eyebrowThickness === 'thick' ? 2 : eyebrowThickness === 'bushy' ? 3 : 1;

    for (let t = 0; t < browT; t++) {
      switch (eyebrowShape) {
        case 'straight':
          elements.push(
            <rect key={`brow-l-${t}`} x={leftEyeX - 1} y={browYLeft - t} width="5" height="1" fill={browColor} className="pixel" />,
            <rect key={`brow-r-${t}`} x={rightEyeX - 1} y={browYRight - t} width="5" height="1" fill={browColor} className="pixel" />
          );
          break;
        case 'arched':
          for (let x = 0; x < 5; x++) {
            const arch = x < 3 ? x * 0.5 : (4 - x) * 0.5;
            const lY = browYLeft - t - arch;
            const rY = browYRight - t - arch;
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={lY - (exprIsSad ? (x <= 2 ? 1 : 0) : 0)} width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={rY - (exprIsSad ? (x >= 2 ? 1 : 0) : 0)} width="1" height="1" fill={browColor} className="pixel" />
            );
          }
          break;
        case 'angular':
          for (let x = 0; x < 5; x++) {
            const angleY = x < 3 ? 0 : x - 3;
            const lY = browYLeft - t + angleY - (exprIsSad ? 1 : 0);
            const rY = browYRight - t - angleY - (exprIsSad ? 1 : 0);
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={lY} width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={rY} width="1" height="1" fill={browColor} className="pixel" />
            );
          }
          break;
        default:
          elements.push(
            <rect key={`brow-l-def-${t}`} x={leftEyeX - 1} y={browYLeft - t} width="5" height="1" fill={browColor} className="pixel" />,
            <rect key={`brow-r-def-${t}`} x={rightEyeX - 1} y={browYRight - t} width="5" height="1" fill={browColor} className="pixel" />
          );
      }
    }

    // Extra brow/forehead detail for scowl/concern: small furrow between brows
    if (exprIsScowl || exprIsConcern) {
      elements.push(
        <rect key="furrow-1" x={centerX - 1} y={browYBase - 1} width="2" height="1" fill={createShadow(skinTone, 0.7)} className="pixel" />,
        <rect key="furrow-2" x={centerX - 1} y={browYBase} width="2" height="1" fill={createShadow(skinTone, 0.8)} className="pixel" />
      );
    }

    // Subtle droop for sadness: add faint top lid
    if (exprIsSad) {
      const lidColorTop = createShadow(skinTone, 0.94);
      elements.push(
        <rect key="sad-lid-l" x={leftEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={1} fill={lidColorTop} className="pixel" />,
        <rect key="sad-lid-r" x={rightEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={1} fill={lidColorTop} className="pixel" />
      );
    }

    // Lashes
    if (isFemale && eyelashes !== 'short') {
      const lashTop = createShadow(browColor, 0.7);
      elements.push(
        <rect key="lash-l-top" x={leftEyeX} y={eyeY - 1} width={eyeWidth} height="1" fill={lashTop} className="pixel" />,
        <rect key="lash-r-top" x={rightEyeX} y={eyeY - 1} width={eyeWidth} height="1" fill={lashTop} className="pixel" />
      );
      if (eyelashes === 'long') {
        elements.push(
          <rect key="lash-l-side" x={leftEyeX - 1} y={eyeY} width="1" height="1" fill={lashTop} className="pixel" />,
          <rect key="lash-r-side" x={rightEyeX + eyeWidth} y={eyeY} width="1" height="1" fill={lashTop} className="pixel" />
        );
      }
    }

    if (isOld) {
      elements.push(
        <rect key="crow-l1" x={leftEyeX - 3} y={eyeY} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="crow-l2" x={leftEyeX - 3} y={eyeY + 2} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="crow-r1" x={rightEyeX + eyeWidth + 2} y={eyeY} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="crow-r2" x={rightEyeX + eyeWidth + 2} y={eyeY + 2} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="bag-l" x={leftEyeX + 1} y={eyeY + 3} width="2" height="1" fill={createShadow(skinTone, 0.88)} className="pixel" />,
        <rect key="bag-r" x={rightEyeX + 1} y={eyeY + 3} width="2" height="1" fill={createShadow(skinTone, 0.88)} className="pixel" />
      );
    }

    // Blinking eyelids
    if (blinkProgress > 0) {
      const lidH = Math.max(1, Math.floor((eyeHeight + 2) * blinkProgress));
      const lidColorTop = createShadow(skinTone, 0.92);
      const lidColorBot = createShadow(skinTone, 0.97);
      const lashLine = createShadow(hasGrayHair ? 'rgb(90,90,90)' : baseHair, 0.7);

      elements.push(
        // Left
        <rect key="blink-l-top" x={leftEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={lidH} fill={lidColorTop} className="pixel" />,
        <rect key="blink-l-bot" x={leftEyeX - 1} y={eyeY + eyeHeight - Math.max(0, lidH - 1)} width={eyeWidth + 2} height={lidH} fill={lidColorBot} className="pixel" />,
        blinkProgress > 0.7 ? <rect key="blink-l-line" x={leftEyeX - 1} y={eyeY + Math.floor(eyeHeight / 2)} width={eyeWidth + 2} height="1" fill={lashLine} className="pixel" /> : null,
        // Right
        <rect key="blink-r-top" x={rightEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={lidH} fill={lidColorTop} className="pixel" />,
        <rect key="blink-r-bot" x={rightEyeX - 1} y={eyeY + eyeHeight - Math.max(0, lidH - 1)} width={eyeWidth + 2} height={lidH} fill={lidColorBot} className="pixel" />,
        blinkProgress > 0.7 ? <rect key="blink-r-line" x={rightEyeX - 1} y={eyeY + Math.floor(eyeHeight / 2)} width={eyeWidth + 2} height="1" fill={lashLine} className="pixel" /> : null
      );
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
      case 'broad': widthMul += 0.25; break;
      case 'button': tipUp = 1; widthMul -= 0.1; lengthMul -= 0.15; break;
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
      <rect key="nose-body" x={noseX} y={noseStartY} width={noseWidth - 1} height={noseLen} fill={skinTone} className="pixel" />
    );

    elements.push(
      <rect key="nose-side-l" x={noseX - 1} y={noseStartY + 1} width="1" height={Math.max(2, noseLen - 1)} fill={skinShadow} className="pixel" />,
      <rect key="nose-side-r" x={noseX + noseWidth - 1} y={noseStartY + 1} width="1" height={Math.max(1, noseLen - 2)} fill={skinHighlight} className="pixel" />
    );

    const tipY = noseStartY + noseLen - 1;
    const tipHL = tipUp ? skinHighlight : skinBrightHighlight;

    if (isIll) {
      elements.push(
        <rect key="red-nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill="rgba(255, 120, 120, 0.6)" className="pixel" />,
        <rect key="red-nose-area" x={noseX} y={tipY - 1} width={noseWidth} height="2" fill="rgba(255, 140, 140, 0.3)" className="pixel" />
      );
    }

    elements.push(
      <rect key="nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill={isIll ? "rgba(255, 180, 180, 0.8)" : tipHL} className="pixel" />
    );

    const nostrilY = Math.min(tipY + (tipUp ? 0 : 1), mouthY - 2);
    elements.push(
      <rect key="nostril-l" x={noseX} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="nostril-r" x={noseX + noseWidth - 2} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="subnasal-shadow" x={noseX + 1} y={nostrilY + 1} width={Math.max(1, noseWidth - 3)} height="1" fill={isIll ? "rgba(255, 160, 160, 0.4)" : skinShadow} className="pixel" />
    );

    return <g key="nose">{elements}</g>;
  }, [appearanceWithDefaults.noseShape, culturalZone, hairLength, headDim.height, headDim.width, headX, headY, isFemale, isOld, skinBrightHighlight, skinDeepShadow, skinHighlight, skinMidtone, skinShadow, skinTone]);

    // ----- MOUTH (expression-driven, with proper smile/smirk/frown/pursed) -----
  const renderMouth = useMemo(() => {
    const elements: JSX.Element[] = [];
    const lipShape = appearanceWithDefaults.lipShape || 'medium';

    // Mouth anchor
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

    const actualLipColor = isIll ? createShadow(baseLip, 0.85) : baseLip;
    const upperLipColor = createShadow(actualLipColor, 0.85);
    const lowerLipColor = actualLipColor;
    const lipHL = createHighlight(actualLipColor, 1.25);
    const lipShadow = createShadow(actualLipColor, 0.75);

    // Ensure temporary smile wins over "tired auto-frown"
    let actualExpressionType = expressionType;
    if ((isFatigued || isIll) && actualExpressionType !== 1) {
      actualExpressionType = 2;
    }

    // Width baseline + tweaks by lip shape
    let halfW = 3; // 7px total by default (center + 3 left + 3 right)
    if (lipShape === 'wide') halfW = 4;
    if (lipShape === 'thin') halfW = Math.max(2, halfW);

    // Helper to plot a pixel relative to mouth center
    const px = (dx: number, dy: number, fill: string) => {
      elements.push(
        <rect key={`m-${dx}-${dy}-${fill}`} x={mouthX + dx} y={mouthY + dy} width="1" height="1" fill={fill} className="pixel" />
      );
    };

    // Draw curve for each expression
    // For each dx in [-halfW..+halfW], return vertical offset dy for the "center line" of the mouth
    const curve = (dx: number): number => {
      const t = dx / halfW; // -1..1
      switch (actualExpressionType) {
        case 1: // SMILE family
          // gentle upturned ends; smirk lifts the right side more
          if (exprIsSmirk) {
            const rightLift = Math.round(1.5 * (t > 0 ? t : 0));
            return (t < -0.6 ? 0 : t < -0.2 ? 0 : t < 0.2 ? 0 : 1) - rightLift; // raise right corner
          }
          return Math.round(-1.2 * (1 - Math.abs(t))); // up (negative dy)
        case 2: // FROWN family
          return Math.round(1.2 * (1 - Math.abs(t)));  // down (positive dy)
        case 4: // PURSED/CONCERN
          return (Math.abs(dx) <= 1) ? 0 : (Math.abs(dx) === halfW ? 0 : 0);
        default: // NEUTRAL / SURPRISE keeps neutral mouth here
          return 0;
      }
    };

    // First, lightly clear the mouth area so curves don't clash with previous straight bars
    // (small skin-tone patch behind the mouth)
    for (let y = -2; y <= 3; y++) {
      for (let x = -halfW - 1; x <= halfW + 1; x++) {
        px(x, y, skinTone);
      }
    }

    // Upper/lower lip rendering based on curve
    for (let dx = -halfW; dx <= halfW; dx++) {
      const cy = curve(dx);

      // Upper lip pixel
      px(dx, cy, upperLipColor);

      // Lower lip: thicker for full/bow shapes
      px(dx, cy + 1, lowerLipColor);
      if (lipShape === 'full' || lipShape === 'bow') {
        if (actualExpressionType !== 4) px(dx, cy + 2, createShadow(lowerLipColor, 0.9));
      }
    }

    // Expression-specific details
    if (actualExpressionType === 1) {
      // Smile dimples (both for smile/approve; single on raised side for smirk)
      if (exprIsSmirk) {
        px(halfW + 2, -1, createShadow(skinTone, 0.88));
      } else {
        px(-halfW - 2, -1, createShadow(skinTone, 0.88));
        px(halfW + 2, -1, createShadow(skinTone, 0.88));
      }
      // Cheek lift highlights
      px(-halfW - 1, -2, createHighlight(skinTone, 1.05));
      px(halfW + 1, -2, createHighlight(skinTone, 1.05));
    } else if (actualExpressionType === 2) {
      // Extra corner shadows for deeper scowl
      if (temporaryExpression === 'scowl') {
        px(-halfW - 1, 3, createShadow(skinTone, 0.82));
        px(halfW + 1, 3, createShadow(skinTone, 0.82));
      }
    } else if (actualExpressionType === 4) {
      // Pursed center shadow
      px(0, 0, lipShadow);
      px(0, 1, lipShadow);
    }

    // Subtle highlight on lower lip center (not for 'thin')
    if (lipShape !== 'thin') {
      px(0, 1, lipHL);
    }

    // Philtrum
    px(0, -2, createShadow(skinTone, 0.78));

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
      const mustacheY = mouthY - 1;
      const mustacheThickness = thickness === 'thick' ? 2 : 1;
      for (let t = 0; t < mustacheThickness; t++) {
        for (let i = -5; i < 6; i++) {
          const col = Math.abs(i) <= 1 ? beardHighlight : Math.abs(i) >= 4 ? beardShadow : beardColor;
          elements.push(<rect key={`fb-m-${t}-${i}`} x={headX + Math.floor(headDim.width / 2) + i} y={mustacheY + t} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      for (let y = -2; y < 16; y++) {
        const rowY = baseY + y;
        const isNearMouth = y >= 0 && y <= 2;
        let rowWidth;
        if (y < 2) rowWidth = Math.floor(chinWidth * 0.8);
        else if (y < 8) rowWidth = Math.floor(chinWidth * 1.0);
        else rowWidth = Math.floor(chinWidth * (1.0 - (y - 8) / 30));

        const startX = headX + Math.floor((headDim.width - rowWidth) / 2);

        for (let x = 0; x < rowWidth; x++) {
          const xRatio = x / rowWidth;
          if (isNearMouth) {
            const centerDist = Math.abs(xRatio - 0.5);
            if (centerDist < 0.15) continue;
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
      const mustacheThickness = thickness === 'thick' ? 2 : 1;
      for (let t = 0; t < mustacheThickness; t++) {
        const w = style === 'goatee' ? 8 : 9;
        const mx = headX + Math.floor(headDim.width / 2) - Math.floor(w / 2);
        for (let i = 0; i < w; i++) {
          const col = (i < 2 || i >= w - 2) ? beardShadow : (i === Math.floor(w/2)) ? beardHighlight : beardColor;
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
      for (let y = 0; y < 3; y++) {
        for (let x = -1; x < 2; x++) {
          const px = headX + Math.floor(headDim.width / 2) + x;
          elements.push(<rect key={`sp-${x}-${y}`} x={px} y={mouthY + 1 + y} width="1" height="1" fill={beardColor} className="pixel" />);
        }
      }
    } else if (style === 'mustache') {
      const my = mouthY - 1;
      for (let t = 0; t < (thickness === 'thick' ? 2 : 1); t++) {
        const w = 8;
        const mx = headX + Math.floor(headDim.width / 2) - Math.floor(w / 2);
        for (let i = 0; i < w; i++) {
          if (rand(i * 17 + t * 101) < (densityBase * 0.95)) {
            const col = i % 3 === 1 ? beardHighlight : beardColor;
            elements.push(<rect key={`m-${t}-${i}`} x={mx + i} y={my + t} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      const centerX = headX + Math.floor(headDim.width / 2);
      for (let dx = -3; dx <= 3; dx++) {
        if (rand(dx * 23) < densityBase * 0.8) {
          elements.push(<rect key={`m-under-${dx}`} x={centerX + dx} y={my - 1} width="1" height="1" fill={beardShadow} className="pixel" />);
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
      const nw = neckWidth + Math.floor(y * 0.4);
      const nx = headX + Math.floor((headDim.width - nw) / 2);
      for (let x = 0; x < nw; x++) {
        let col = skinTone;
        const xr = x / nw;
        if (xr < 0.25) col = skinHighlight;
        else if (xr > 0.75) col = skinShadow;
        else if (stats.strength >= 7) {
          if (xr > 0.3 && xr < 0.4) col = createHighlight(skinTone, 1.05);
          else if (xr > 0.6 && xr < 0.7) col = createShadow(skinTone, 0.95);
        }
        // small hollow under chin (dithered, not a harsh stripe)
        if (y === 0 && (x % 3 === 0)) col = createShadow(col, 0.9);

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
    if (useEquippedItems && character.equippedItems !== undefined) {
      // Use equipped torso item (which may be undefined if nothing equipped)
      garment = character.equippedItems.torso;
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
        const s = y / 10;
        torsoWidth = Math.floor(headDim.width * 0.55 + (bodyDim.shoulderWidth - headDim.width * 0.55) * s);
      } else if (y < 18) torsoWidth = bodyDim.shoulderWidth;
      else if (y < bodyHeight * 0.55) {
        const s = (y - 18) / (bodyHeight * 0.55 - 18);
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

      const armGap = 2;
      const leftArmX = torsoX - bodyDim.armWidth - armGap;
      const rightArmX = torsoX + torsoWidth + armGap;
      for (let ax = 0; ax < bodyDim.armWidth; ax++) {
        let col = clothingColor;
        if (ax === 0) col = clothingHighlight;
        else if (ax === bodyDim.armWidth - 1) col = clothingShadow;
        if (y % 6 === 0 && isWealthy) col = accentColor;
        elements.push(
          <rect key={`la-${y}-${ax}`} x={leftArmX + ax} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />,
          <rect key={`ra-${y}-${ax}`} x={rightArmX + ax} y={bodyStartY + y} width="1" height="1" fill={col} className="pixel" />
        );
      }

      // Enhanced garment type detection and rendering
      const garmentName = garment?.name?.toLowerCase() || '';
      const isRobe = garmentName.includes('robe') || garmentName.includes('habit') || garmentName.includes('cassock');
      const isDress = garmentName.includes('dress') || garmentName.includes('gown');
      const isArmor = garmentName.includes('armor') || garmentName.includes('mail') || garmentName.includes('plate') || garmentName.includes('cuirass');
      const isApron = garmentName.includes('apron');
      const isVest = garmentName.includes('vest') || garmentName.includes('waistcoat') || garmentName.includes('jerkin');
      const isShirt = garmentName.includes('shirt') || garmentName.includes('blouse') || garmentName.includes('dress shirt');
      const isTunic = garmentName.includes('tunic') || garmentName.includes('tabard');
      const isCoat = garmentName.includes('coat') || garmentName.includes('jacket') || garmentName.includes('doublet');
      const isCape = garmentName.includes('cape') || garmentName.includes('cloak') || garmentName.includes('mantle');
      const isPoncho = garmentName.includes('poncho');
      const isShawl = garmentName.includes('shawl');
      
      // Modern clothing detection
      const isBusinessSuit = garmentName.includes('business suit') || garmentName.includes('suit jacket');
      const isBlazer = garmentName.includes('blazer');
      const isHoodie = garmentName.includes('hoodie') || garmentName.includes('hooded sweatshirt');
      const isTShirt = garmentName.includes('t-shirt') || garmentName.includes('t shirt') || garmentName.includes('tee shirt');
      const isPoloShirt = garmentName.includes('polo shirt') || garmentName.includes('polo');
      const isSweater = garmentName.includes('sweater') || garmentName.includes('pullover') || garmentName.includes('jumper');
      const isTankTop = garmentName.includes('tank top') || garmentName.includes('vest top') || garmentName.includes('sleeveless shirt');
      
      // Collar/neckline rendering based on garment type
      if (y < 3) {
        const collarWidth = Math.floor(torsoWidth * 0.6);
        const collarX = 32 - (collarWidth / 2);
        
        if (isRobe || isDress) {
          // V-neck for robes and dresses
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
        } else if (isCoat && y === 0) {
          // High collar for coats
          for (let cx = 0; cx < collarWidth; cx++) {
            elements.push(<rect key={`coat-collar-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
          }
        } else if ((isBusinessSuit || isBlazer) && y === 0) {
          // Professional suit collar with lapels
          for (let cx = 0; cx < collarWidth; cx++) {
            const isLapel = cx < 3 || cx > collarWidth - 4;
            const lapelColor = isLapel ? clothingDeepShadow : clothingColor;
            elements.push(<rect key={`suit-collar-${cx}`} x={collarX + cx} y={bodyStartY} width="1" height="1" fill={lapelColor} className="pixel" />);
          }
        } else if (isHoodie && y === 0) {
          // Hoodie with visible hood rim
          for (let cx = 0; cx < collarWidth + 2; cx++) {
            elements.push(<rect key={`hoodie-hood-${cx}`} x={collarX + cx - 1} y={bodyStartY - 1} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
          }
        } else if (isTShirt || isTankTop) {
          // Simple rounded neckline for casual wear
          for (let cx = 0; cx < collarWidth; cx++) {
            const roundDepth = Math.abs(cx - collarWidth / 2) < (collarWidth / 4) && y === 1;
            if (roundDepth) elements.push(<rect key={`tshirt-neck-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
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
      
      // Add armor plates/details
      if (isArmor && y % 4 === 0 && y > 5 && y < bodyHeight - 10) {
        const plateWidth = Math.floor(torsoWidth * 0.8);
        const plateX = 32 - (plateWidth / 2);
        for (let px = 0; px < plateWidth; px++) {
          const plateCol = createHighlight(clothingColor, 1.3);
          elements.push(<rect key={`plate-${y}-${px}`} x={plateX + px} y={bodyStartY + y} width="1" height="1" fill={plateCol} className="pixel" />);
        }
      }
      
      // Add cape/cloak flowing effect
      if (isCape && y > 10) {
        const capeWidth = torsoWidth + Math.floor((y - 10) / 3);
        const capeX = 32 - (capeWidth / 2);
        const flow = Math.sin(y * 0.1) * 2;
        for (let cx = 0; cx < capeWidth; cx++) {
          const edgeEffect = cx === 0 || cx === capeWidth - 1 ? createShadow(clothingColor, 0.6) : clothingColor;
          elements.push(<rect key={`cape-${y}-${cx}`} x={capeX + cx + flow} y={bodyStartY + y} width="1" height="1" fill={edgeEffect} className="pixel" />);
        }
      }
      
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
      if ((isBusinessSuit || isBlazer) && y > 5 && y < bodyHeight - 5) {
        // Suit jacket buttons
        if (y % 4 === 0) {
          const buttonX = 32;
          elements.push(<rect key={`suit-button-${y}`} x={buttonX} y={bodyStartY + y} width="1" height="1" fill={clothingDeepShadow} className="pixel" />);
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
      
      if (isTankTop) {
        // Tank top has no sleeves - show more skin on sides
        const skinWidth = 2;
        elements.push(<rect key={`tank-skin-l-${y}`} x={32 - torsoWidth/2 - skinWidth} y={bodyStartY + y} width={skinWidth} height="1" fill={skinTone} className="pixel" />);
        elements.push(<rect key={`tank-skin-r-${y}`} x={32 + torsoWidth/2} y={bodyStartY + y} width={skinWidth} height="1" fill={skinTone} className="pixel" />);
      }
    }

    

    return <g key="body">{elements}</g>;
  }, [appearanceWithDefaults.garment, appearanceWithDefaults.palette.accent, appearanceWithDefaults.palette.primary, appearanceWithDefaults.palette.secondary, bodyDim, culturalZone, headDim.height, headDim.width, headX, headY, isNoble, isWealthy, skinShadow, skinTone, stats?.strength, character.equippedItems, useEquippedItems]);

    // ----- HEADGEAR (improved) -----
  const renderHeadgear = useMemo(() => {
    // Choose source (equipped vs appearance) without changing your prop contract
    let headItem: { name: string; material?: string; color?: string } | null = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      headItem = character.equippedItems.head ?? null;
    } else {
      headItem = appearanceWithDefaults.headgear ?? null;
    }

    if (!headItem || !headItem.name || headItem.name.toLowerCase() === 'none') {
      return <g key="headgear" />;
    }

    const elements: JSX.Element[] = [];
    const name = (headItem.name || '').toLowerCase();
    const material = (headItem.material || '').toLowerCase();

    const centerX = headX + Math.floor(headDim.width / 2);
    const topY = headY - 1;

    // Helpers
    const nameContains = (...keywords: string[]) => keywords.some(k => name.includes(k));

    const resolveHeadgearColor = (): string => {
      // First check if the equipped item has its own color
      if (headItem?.color) {
        // Handle both hex colors and color names
        if (headItem.color.startsWith('#')) {
          return headItem.color;
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
        
        const mappedColor = colorMap[headItem.color];
        if (mappedColor) return mappedColor;
      }
      
      // 1) explicit color tokens in the name
      const tokens: Array<[string, string]> = [
        ['navy', '#000080'], ['crimson', '#DC143C'], ['scarlet', '#FF2400'], ['red', '#DC143C'],
        ['blue', '#4169E1'], ['azure', '#007FFF'], ['green', '#228B22'], ['emerald', '#50C878'],
        ['forest', '#0B6623'], ['gold', '#FFD700'], ['yellow', '#FFD700'], ['purple', '#800080'],
        ['violet', '#8B00FF'], ['indigo', '#4B0082'], ['pink', '#FFC0CB'], ['orange', '#FF8C00'],
        ['brown', '#8B4513'], ['tan', '#D2B48C'], ['black', '#1C1C1C'], ['white', '#F8F8F8'],
        ['gray', '#808080'], ['grey', '#808080'], ['silver', '#C0C0C0'], ['bronze', '#CD7F32'],
        ['brass', '#B5A642'], ['copper', '#B87333'], ['obsidian', '#0C0C0C'], ['ivory', '#FFFFF0'],
        ['pearl', '#FFF8DC'], ['jade', '#00A86B'], ['sapphire', '#0F52BA'], ['amethyst', '#9966CC'],
        ['ruby', '#E0115F'],
      ];
      const tok = tokens.find(([t]) => name.includes(t));
      if (tok) return tok[1];

      // 2) material defaults
      if (material.includes('leather')) return '#8B4513';
      if (material.includes('felt')) return '#6D6D75';
      if (material.includes('wool')) return '#A0A0A8';
      if (material.includes('linen') || material.includes('cotton')) return '#E8E2D1';
      if (material.includes('silk') || material.includes('velvet') || material.includes('satin')) return appearanceWithDefaults.palette.accent;
      if (material.includes('gold')) return '#FFD700';
      if (material.includes('bronze')) return '#CD7F32';
      if (material.includes('brass')) return '#B5A642';
      if (material.includes('iron') || material.includes('steel') || material.includes('mail') || material.includes('plate') || material.includes('metal')) return '#C0C0C0';
      if (material.includes('straw') || material.includes('bamboo') || material.includes('reed') || material.includes('sedge')) return '#D4A76A';

      // 3) fallback to palette
      return appearanceWithDefaults.palette.secondary;
    };

    const base = resolveHeadgearColor();
    const shade = createShadow(base, 0.82);
    const deep = createShadow(base, 0.65);
    const hl = createHighlight(base, 1.18);

    // ========= SHAPES =========

    // CROWNS / CIRCLETS / DIadems / WREATHS
    if (nameContains('crown', 'circlet', 'tiara', 'coronet', 'diadem', 'laurel')) {
      const isLaurel = name.includes('laurel');
      const gold = '#FFD700';
      const wreath = isLaurel ? '#3E8E41' : gold;

      // Band along the top of forehead
      for (let x = headX; x < headX + headDim.width; x++) {
        elements.push(
          <rect key={`crown-band-${x}`} x={x} y={headY - 2} width="1" height="2" fill={wreath} className="pixel" />
        );
        if (!isLaurel && ((x - headX) % 4 === 2) && (isNoble || nameContains('jeweled', 'gem', 'ruby', 'emerald', 'sapphire', 'pearl', 'diamond'))) {
          // small in-band jewels
          let jewel = '#DC143C';
          if (name.includes('emerald')) jewel = '#50C878';
          else if (name.includes('sapphire')) jewel = '#0F52BA';
          else if (name.includes('diamond')) jewel = '#E0FFFF';
          else if (name.includes('pearl')) jewel = '#FFF8DC';
          elements.push(<rect key={`crown-jewel-${x}`} x={x} y={headY - 1} width="1" height="1" fill={jewel} className="pixel" />);
        }
      }

      // Points (skip for circlet)
      if (!nameContains('circlet', 'wreath')) {
        const points = 5;
        for (let i = 0; i < points; i++) {
          const px = headX + 1 + Math.floor(i * ((headDim.width - 2) / (points - 1)));
          const ph = i === Math.floor(points / 2) ? 7 : i === 0 || i === points - 1 ? 4 : 5 + (i % 2);
          for (let h = 0; h < ph; h++) {
            elements.push(
              <rect key={`crown-pt-${i}-${h}`} x={px} y={headY - 3 - h} width="1" height="1" fill={createHighlight(gold, 1 - h * 0.03)} className="pixel" />
            );
          }
          // top jewel on middle point if fancy
          if (i === Math.floor(points / 2) && (isNoble || isWealthy)) {
            elements.push(<rect key="crown-top-j" x={px} y={headY - 3 - ph} width="1" height="1" fill="#0F52BA" className="pixel" />);
          }
        }
      }

      // Laurel leaves detail
      if (isLaurel) {
        for (let i = 0; i < headDim.width; i += 3) {
          const lx = headX + i;
          elements.push(
            <rect key={`leaf-${i}-a`} x={lx} y={headY - 3} width="2" height="1" fill={createHighlight('#2E7D32', 1.05)} className="pixel" />,
            <rect key={`leaf-${i}-b`} x={lx + 1} y={headY - 4} width="1" height="1" fill={'#2E7D32'} className="pixel" />
          );
        }
      }
    }

    // TURBANS / PAGRI / SAFA
    else if (nameContains('turban', 'pagri', 'safa', 'peta')) {
      const layers = isWealthy ? 3 : 2;
      for (let layer = 0; layer < layers; layer++) {
        const radius = Math.floor((headDim.width / 2) + 3 - layer);
        for (let y = headY - 5 - layer; y <= headY + 2 - layer; y++) {
          for (let x = centerX - radius; x <= centerX + radius; x++) {
            const dx = Math.abs(x - centerX);
            const dy = Math.abs(y - (headY - 2));
            const inside = dx + Math.floor(dy * 0.9) <= radius;
            if (inside) {
              const fold = ((x + y + layer) % 4 === 0);
              const col = fold ? shade : base;
              elements.push(<rect key={`turban-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
      // Aigrette / jewel for wealthy
      if (isWealthy) {
        elements.push(
          <rect key="turb-j-base" x={centerX - 2} y={headY - 1} width="4" height="2" fill="#FFD700" className="pixel" />,
          <rect key="turb-j-gem" x={centerX - 1} y={headY} width="2" height="1" fill="#DC143C" className="pixel" />
        );
        for (let f = 0; f < 7; f++) {
          elements.push(<rect key={`turb-feather-${f}`} x={centerX + 5 + Math.floor(f / 3)} y={headY - 7 + f} width="1" height="1" fill={f % 2 === 0 ? createHighlight('#2E7D32', 1.1) : '#2E7D32'} className="pixel" />);
        }
      }
    }

    // VEILS / HIJAB / WRAPS / SCARF / DUPATTA / MANTILLA
    else if (nameContains('veil', 'hijab', 'keffiyeh', 'dupatta', 'gele', 'mantilla', 'ghoonghat', 'head wrap', 'headwrap', 'kerchief', 'scarf', 'coif', 'bonnet')) {
      const fullCover = nameContains('hijab', 'dupatta', 'gele', 'mantilla', 'ghoonghat');
      const depth = fullCover ? 12 : 8;

      for (let y = headY - 4; y < headY + depth; y++) {
        for (let x = headX - 5; x < headX + headDim.width + 5; x++) {
          const dx = Math.abs(x - centerX);
          const faceOpen = (y > headY) && (y < headY + headDim.height - 2) && (dx < headDim.width / 2 - 1);
          if (!faceOpen && dx < headDim.width / 2 + 4) {
            const shadow = (y - headY) % 3 === 0 || dx > headDim.width / 2 + 2;
            elements.push(<rect key={`veil-${x}-${y}`} x={x} y={y} width="1" height="1" fill={shadow ? shade : base} className="pixel" />);
          }
        }
      }
      if (isWealthy) {
        for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
          if (Math.abs(x - centerX) > headDim.width / 2 - 2) {
            elements.push(<rect key={`veil-trim-${x}`} x={x} y={headY + depth - 1} width="1" height="1" fill="#FFD700" className="pixel" />);
          }
        }
      }
    }

    // HOODS / WIMPLE
    else if (nameContains('hood', 'wimple')) {
      const hoodDepth = name.includes('wimple') ? 12 : 10;
      for (let y = headY - 6; y < headY + hoodDepth; y++) {
        for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
          const dx = Math.abs(x - centerX);
          const dTop = y - (headY - 6);
          const hoodW = headDim.width / 2 + 2 + Math.min(4, dTop * 0.3);
          const faceOpen = y > headY && y < headY + headDim.height - 2 && dx < headDim.width / 2 - 1;
          if (!faceOpen && dx < hoodW) {
            const depthFromEdge = hoodW - dx;
            const isDeep = depthFromEdge < 2 || y < headY - 2;
            const isMid = depthFromEdge < 4 || dTop < 3;
            let col = base;
            if (isDeep) col = deep;
            else if (isMid) col = shade;
            // inner rim
            if (dx > hoodW - 2 && y > headY - 2) col = createShadow(base, 0.6);
            elements.push(<rect key={`hood-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      // subtle golden trim for wealthy
      if (isWealthy) {
        for (let y = headY + 2; y < headY + headDim.height - 2; y++) {
          elements.push(
            <rect key={`hood-trim-l-${y}`} x={headX - 3} y={y} width="1" height="1" fill="#FFD700" className="pixel" />,
            <rect key={`hood-trim-r-${y}`} x={headX + headDim.width + 2} y={y} width="1" height="1" fill="#FFD700" className="pixel" />
          );
        }
      }
    }

    // HELMETS (metallic)
    else if (nameContains('helmet', 'helm', 'spangenhelm', 'salet', 'sallet', 'great helm', 'norman', 'knight')) {
      const metal =
        material.includes('bronze') ? '#CD7F32' :
        material.includes('brass') ? '#B5A642' :
        '#AEB4B8';

      // Shell
      for (let y = headY - 3; y < headY + headDim.height - 3; y++) {
        for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
          const dx = Math.abs(x - centerX);
          const faceOpen = y > headY + 2 && y < headY + headDim.height - 4 && dx < headDim.width / 2 - 3;
          if (!faceOpen) {
            const edge = dx < 2 || x === headX - 2 || x === headX + headDim.width + 1;
            const col = edge ? createHighlight(metal, 1.22) : metal;
            elements.push(<rect key={`helm-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }

      // Nose guard for Norman/knight
      if (nameContains('norman', 'knight', 'nasal')) {
        for (let y = headY + 2; y < headY + 10; y++) {
          elements.push(<rect key={`nasal-${y}`} x={centerX} y={y} width="2" height="1" fill={createShadow(metal, 0.9)} className="pixel" />);
        }
      }

      // Crest/plume for nobles
      if (isNoble) {
        for (let p = 0; p < 10; p++) {
          elements.push(<rect key={`plume-${p}`} x={centerX + Math.sin(p * 0.3) * 2} y={headY - 5 - p} width="2" height="1" fill={p % 2 === 0 ? '#DC143C' : '#8B0000'} className="pixel" />);
        }
      }
    }

    // HATS & CAPS (beret, fez/kufi, brimmed, knit/chullo, generic cap)
    else if (nameContains('cap', 'beret', 'fez', 'kufi', 'fedora', 'homburg', 'chullo', 'beanie', 'tuque', 'pith', 'snapback', 'petasos', 'chaperon')) {
      const hatStyle =
        name.includes('top') ? 'top' :
        name.includes('beret') ? 'beret' :
        (name.includes('fez') || name.includes('kufi')) ? 'fez' :
        (nameContains('fedora', 'homburg', 'pith', 'petasos')) ? 'brimmed' :
        (nameContains('chullo', 'beanie', 'tuque')) ? 'knit' :
        'generic';

      switch (hatStyle) {
        case 'top': {
          // Tall crown - much taller and wider to cover hair
          for (let y = headY - 12; y < headY + 1; y++) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(<rect key={`tophat-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" className="pixel" />);
            }
          }
          // Wide brim
          for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
            elements.push(<rect key={`tophat-brim-${x}`} x={x} y={headY} width="1" height="3" fill="#000000" className="pixel" />);
          }
          // Band around middle
          if (isWealthy) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(<rect key={`tophat-band-${x}`} x={x} y={headY - 4} width="1" height="2" fill={appearanceWithDefaults.palette.accent} className="pixel" />);
            }
          }
          break;
        }
        case 'beret': {
          // Beret with proper slouchy shape that covers hair
          const beretRadius = Math.floor(headDim.width * 0.75);
          for (let y = headY - 6; y < headY + 3; y++) {
            const yOffset = y - (headY - 2);
            const width = Math.round(beretRadius * Math.sqrt(Math.max(0, 1 - Math.pow(yOffset / 6, 2))) * 2.2);
            if (width > 0) {
              const startX = centerX - Math.floor(width / 2) + (y > headY ? 2 : 0); // slight tilt
              for (let x = 0; x < width; x++) {
                elements.push(<rect key={`beret-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={base} className="pixel" />);
              }
            }
          }
          // Small stem on top
          elements.push(<rect key="beret-stem" x={centerX + 2} y={headY - 7} width="2" height="2" fill={shade} className="pixel" />);
          break;
        }
        case 'fez': {
          // Cylindrical fez that fully covers head
          const fezColor = name.includes('red') || name.includes('fez') ? '#8B0000' : base;
          for (let y = headY - 8; y < headY + 2; y++) {
            const taper = Math.max(0, (headY - 4 - y) / 4); // slight taper at top
            const width = headDim.width + 2 - Math.floor(taper * 2);
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              elements.push(<rect key={`fez-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={fezColor} className="pixel" />);
            }
          }
          // Tassel hanging from top
          for (let t = 0; t < 5; t++) {
            const tasselX = centerX + Math.floor(Math.sin(t * 0.5));
            elements.push(<rect key={`fez-tassel-${t}`} x={tasselX} y={headY - 8 - t} width="1" height="1" fill="#000000" className="pixel" />);
          }
          break;
        }
        case 'brimmed': {
          // Fedora/Panama crown with center crease, covers all hair
          for (let y = headY - 7; y < headY + 1; y++) {
            for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
              // Center crease effect
              const isCrease = Math.abs(x - centerX) < 2 && y < headY - 2;
              const color = isCrease ? shade : base;
              elements.push(<rect key={`fed-crown-${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} className="pixel" />);
            }
          }
          // Wide brim all around
          for (let y = 0; y < 2; y++) {
            for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
              // Skip center area on second row for depth
              if (y === 1 && Math.abs(x - centerX) < headDim.width / 2 - 1) continue;
              elements.push(<rect key={`fed-brim-${x}-${y}`} x={x} y={headY + 1 + y} width="1" height="1" fill={shade} className="pixel" />);
            }
          }
          // Hat band
          for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
            elements.push(<rect key={`fed-band-${x}`} x={x} y={headY - 1} width="1" height="1" fill={deep} className="pixel" />);
          }
          break;
        }
        case 'knit': {
          // Knit cap that fully covers head and hair
          for (let y = headY - 8; y < headY + 3; y++) {
            const yFromTop = y - (headY - 8);
            // Rounded top
            let width = headDim.width + 4;
            if (yFromTop < 3) {
              width = headDim.width + 4 - (3 - yFromTop) * 2;
            }
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              const knit = (x + y) % 2 === 0;
              elements.push(<rect key={`knit-${startX + x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={knit ? base : shade} className="pixel" />);
            }
          }
          // Pom-pom on top for some styles
          if (name.includes('beanie') || name.includes('tuque')) {
            for (let dy = -2; dy <= 0; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                elements.push(<rect key={`pom-${dx}-${dy}`} x={centerX + dx} y={headY - 10 + dy} width="1" height="1" fill={hl} className="pixel" />);
              }
            }
          }
          // Ear flaps for chullo
          if (name.includes('chullo')) {
            for (let f = 0; f < 6; f++) {
              elements.push(
                <rect key={`flap-l-${f}`} x={headX - 2 - Math.floor(f/3)} y={headY + 2 + f} width="2" height="1" fill={shade} className="pixel" />,
                <rect key={`flap-r-${f}`} x={headX + headDim.width + Math.floor(f/3)} y={headY + 2 + f} width="2" height="1" fill={shade} className="pixel" />
              );
            }
          }
          break;
        }
        default: {
          // Baseball cap style with proper crown
          for (let y = 0; y < 9; y++) {
            const w = y < 3 ? headDim.width + y : headDim.width + 3;
            const sx = centerX - Math.floor(w / 2);
            for (let x = 0; x < w; x++) {
              if (y === 0 && (x === 0 || x === w - 1)) continue; // slight rounding
              elements.push(<rect key={`cap-c-${y}-${x}`} x={sx + x} y={headY - 6 + y} width="1" height="1" fill={base} className="pixel" />);
            }
          }
          // Wider visor
          for (let y = 0; y < 3; y++) {
            const visorW = headDim.width + 4 - y;
            const visorX = centerX - Math.floor(visorW / 2);
            for (let x = 0; x < visorW; x++) {
              elements.push(<rect key={`cap-v-${y}-${x}`} x={visorX + x} y={headY + 2 + y} width="1" height="1" fill={createShadow(base, 0.75)} className="pixel" />);
            }
          }
          // Top button
          elements.push(<rect key="cap-btn" x={centerX - 1} y={headY - 7} width="2" height="2" fill={shade} className="pixel" />);
        }
      }
    }

    // TRICORN / PIRATE / COLONIAL HATS
    else if (nameContains('tricorn', 'pirate', 'colonial hat', 'cocked hat')) {
      const hatColor = name.includes('pirate') ? '#000000' : base;
      const hatShade = createShadow(hatColor, 0.8);
      
      // Crown - larger and covers hair
      for (let y = headY - 6; y < headY + 1; y++) {
        for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
          elements.push(<rect key={`tricorn-crown-${x}-${y}`} x={x} y={y} width="1" height="1" fill={hatColor} className="pixel" />);
        }
      }
      
      // Wide brim base
      for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
        for (let y = 0; y < 2; y++) {
          elements.push(<rect key={`tricorn-brim-${x}-${y}`} x={x} y={headY + y} width="1" height="1" fill={hatShade} className="pixel" />);
        }
      }
      
      // Three upturned corners (cocked hat effect)
      const corners = [
        { x: centerX - headDim.width/2 - 5, y: headY - 2 }, // left corner up
        { x: centerX, y: headY + 3 }, // front corner down
        { x: centerX + headDim.width/2 + 5, y: headY - 2 } // right corner up
      ];
      
      for (let i = 0; i < corners.length; i++) {
        const corner = corners[i];
        for (let dx = -4; dx <= 4; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist <= 4) {
              elements.push(<rect key={`tricorn-corner-${i}-${dx}-${dy}`} x={corner.x + dx} y={corner.y + dy} width="1" height="1" fill={hatShade} className="pixel" />);
            }
          }
        }
      }
      
      // Gold trim and feather for wealthy
      if (isWealthy) {
        // Trim around crown
        for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
          if ((x - headX) % 2 === 0) {
            elements.push(<rect key={`tricorn-trim-${x}`} x={x} y={headY - 1} width="1" height="1" fill="#FFD700" className="pixel" />);
          }
        }
        // Feather
        for (let f = 0; f < 6; f++) {
          elements.push(<rect key={`tricorn-feather-${f}`} x={centerX - 4} y={headY - 7 + f} width="1" height="1" fill={f % 2 === 0 ? '#2E7D32' : createHighlight('#2E7D32', 1.1)} className="pixel" />);
        }
      }
    }
    
    // MILITARY CAPS (officer, garrison, kepi)
    else if (nameContains('officer', 'garrison', 'kepi', 'military cap', 'forage cap')) {
      const capColor = material.includes('blue') ? '#000080' : material.includes('gray') ? '#808080' : base;
      const visorColor = '#000000';
      
      // Crown - taller and covers all hair
      for (let y = 0; y < 9; y++) {
        const width = headDim.width + 2 - Math.floor(y / 3); // gradual taper
        const sx = centerX - Math.floor(width / 2) - (y > 4 ? 1 : 0); // slight forward tilt
        for (let x = 0; x < width; x++) {
          elements.push(<rect key={`mil-crown-${y}-${x}`} x={sx + x} y={headY - 6 + y} width="1" height="1" fill={capColor} className="pixel" />);
        }
      }
      
      // Wider, more prominent visor
      for (let y = 0; y < 3; y++) {
        const visorWidth = headDim.width + 6 - y;
        const visorStartX = centerX - Math.floor(visorWidth / 2);
        for (let x = 0; x < visorWidth; x++) {
          elements.push(<rect key={`mil-visor-${y}-${x}`} x={visorStartX + x} y={headY + 3 + y} width="1" height="1" fill={visorColor} className="pixel" />);
        }
      }
      
      // Chin strap
      elements.push(
        <rect key="mil-strap-l" x={headX - 1} y={headY + headDim.height - 2} width="1" height="2" fill={visorColor} className="pixel" />,
        <rect key="mil-strap-r" x={headX + headDim.width} y={headY + headDim.height - 2} width="1" height="2" fill={visorColor} className="pixel" />
      );
      
      // Badge/insignia for officers
      if (isWealthy || name.includes('officer')) {
        elements.push(
          <rect key="mil-badge-1" x={centerX - 2} y={headY - 2} width="4" height="3" fill="#FFD700" className="pixel" />,
          <rect key="mil-badge-2" x={centerX - 1} y={headY - 1} width="2" height="1" fill="#DC143C" className="pixel" />,
          <rect key="mil-eagle" x={centerX} y={headY} width="1" height="1" fill="#000000" className="pixel" />
        );
      }
    }
    
    // STRAW / CONICAL (rice hat, sedge hat)
    else if (nameContains('straw', 'rice hat', 'conical', 'bamboo hat', 'sedge hat', 'coolie')) {
  // Use the actual item color if available (e.g., black straw hat), otherwise default straw color
  const straw = base;  // base is already the resolved color from resolveHeadgearColor()
  const strawDark = createShadow(straw, 0.78);

  // --- Brim settings - position at top of head ---
  const brimY = headY - 1;            // position at top of head
  const brimThickness = 2;        // 2px brim
  const brimExtra = Math.floor(headDim.width / 2) + 2; // narrow brim extension

  // --- Crown: conical shape, taller and wider to cover all hair ---
  const crownHeight = 12;          // taller crown to cover more
  const crownBaseWidth = headDim.width + 4;  // wider base to cover hair on sides

  // Draw crown from top to bottom (conical shape)
  for (let i = 0; i < crownHeight; i++) {
    const rowY = brimY - crownHeight + i;  // build from top down
    const taper = i / crownHeight;  // 0 at top, 1 at bottom
    const rowW = Math.max(3, Math.floor(crownBaseWidth * (0.4 + 0.6 * taper)));  // wider throughout, still tapered
    const sx = centerX - Math.floor(rowW / 2);

    for (let x = 0; x < rowW; x++) {
      // subtle straw hatching so it doesn't look like a flat plate
      const hatch = ((sx + x + rowY) % 5) === 0;
      const col = hatch ? strawDark : straw;
      elements.push(
        <rect key={`straw-crown-${i}-${x}`} x={sx + x} y={rowY} width="1" height="1" fill={col} className="pixel" />
      );
    }
  }

  // --- Brim: slightly wider on the top row, a touch darker underneath ---
  for (let t = 0; t < brimThickness; t++) {
    const y = brimY + t;
    const innerLeft  = headX - 1;
    const innerRight = headX + headDim.width + 1;
    const left  = innerLeft  - (brimExtra - t);
    const right = innerRight + (brimExtra - t);

    for (let x = left; x < right; x++) {
      const baseCol = ((x + y) % 4 === 1) ? strawDark : straw;
      const col = t === 0 ? baseCol : createShadow(baseCol, 0.92); // underside darker
      elements.push(
        <rect key={`straw-brim-${t}-${x}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />
      );
    }
  }

  // A narrow darker band where crown meets brim
  const bandWidth = Math.floor(crownBaseWidth * 0.9);  // band slightly narrower than full crown base
  for (let x = centerX - Math.floor(bandWidth/2); x < centerX + Math.floor(bandWidth/2); x++) {
    elements.push(
      <rect key={`straw-band-${x}`} x={x} y={brimY - 1} width="1" height="1" fill={strawDark} className="pixel" />
    );
  }

  // Optional tiny “ties” under the brim (short + centered so they don’t look like bars)
  for (let r = -6; r <= 6; r += 6) {
    elements.push(
      <rect key={`straw-tie-${r}`} x={centerX + r} y={brimY + 1} width="1" height="1" fill={strawDark} className="pixel" />
    );
  }
}


    // HAIR ORNAMENTS / TIKKA / FLOWERS / COMB
    else if (nameContains('flower', 'garland', 'lei', 'hairpiece', 'hairpin', 'tikka', 'maang', 'passa', 'rakhdi', 'sheesh', 'comb')) {
      if (nameContains('flower', 'garland', 'lei')) {
        for (let i = 0; i < 3; i++) {
          const fx = headX + 2 + i * Math.floor(headDim.width / 3);
          const fy = headY - 2;
          elements.push(
            <rect key={`flower-${i}-c`} x={fx} y={fy} width="2" height="2" fill="#FF69B4" className="pixel" />,
            <rect key={`flower-${i}-l`} x={fx - 1} y={fy} width="1" height="1" fill={createHighlight('#FF69B4', 1.1)} className="pixel" />,
            <rect key={`flower-${i}-t`} x={fx} y={fy - 1} width="2" height="1" fill={createHighlight('#FF69B4', 1.1)} className="pixel" />
          );
        }
      } else if (nameContains('tikka', 'maang', 'passa')) {
        elements.push(
          <rect key="tikka-chain" x={centerX - 1} y={headY - 1} width="2" height="1" fill="#FFD700" className="pixel" />,
          <rect key="tikka-pendant" x={centerX - 1} y={headY + 2} width="2" height="2" fill="#DC143C" className="pixel" />
        );
      } else {
        const cx = headX + headDim.width - 3;
        const metal = material.includes('gold') ? '#FFD700' : '#C0C0C0';
        elements.push(<rect key="comb-base" x={cx} y={headY - 2} width="3" height="1" fill={metal} className="pixel" />);
        if (nameContains('jewel')) elements.push(<rect key="comb-gem" x={cx + 1} y={headY - 3} width="1" height="1" fill="#DC143C" className="pixel" />);
      }
    }

    // Otherwise, simple band as a safe default
    else {
      for (let x = headX; x < headX + headDim.width; x++) {
        elements.push(<rect key={`band-${x}`} x={x} y={topY} width="1" height="2" fill={base} className="pixel" />);
        if ((x - headX) % 5 === 0) {
          elements.push(<rect key={`band-hl-${x}`} x={x} y={topY} width="1" height="1" fill={hl} className="pixel" />);
        }
      }
    }

    return <g key="headgear">{elements}</g>;
  }, [
    useEquippedItems,
    character.equippedItems,
    appearanceWithDefaults.headgear,
    appearanceWithDefaults.palette.accent,
    appearanceWithDefaults.palette.secondary,
    headDim.width,
    headDim.height,
    headX,
    headY,
    isWealthy,
    isNoble,
  ]);

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
          const necklaceY = headY + headDim.height + 6;
          const centerX = headX + Math.floor(headDim.width / 2);
          const chainPattern = style === 'delicate' ? 2 : style === 'chunky' ? 1 : 3;
          for (let x = centerX - 10; x <= centerX + 10; x++) {
            const distFromCenter = Math.abs(x - centerX);
            const yOffset = Math.floor(distFromCenter * 0.4);
            if (x % chainPattern === 0) {
              elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width={style === 'chunky' ? 2 : 1} height="1" fill={jewelryColor} className="pixel" />);
            }
            if (material === 'gems' && x % 5 === 0) {
              const gemColor = gemColors[Math.abs(Math.floor(x / 5)) % gemColors.length];
              elements.push(<rect key={`necklace-gem-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={gemColor} className="pixel" />);
            }
          }
          if (style === 'ornate') {
            elements.push(
              <rect key={`pendant-base-${index}`} x={centerX - 2} y={necklaceY + 5} width="5" height="4" fill={jewelryColor} className="pixel" />,
              <rect key={`pendant-gem-${index}`} x={centerX} y={necklaceY + 6} width="1" height="2" fill={gemColors[0]} className="pixel" />
            );
          }
          break;
        }
        case 'earrings': {
          const earY = headY + Math.floor(headDim.height * 0.4) + 4;
          if (style === 'simple') {
            elements.push(
              <rect key={`earring-l-${index}`} x={headX - 1} y={earY} width="1" height="1" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-r-${index}`} x={headX + headDim.width} y={earY} width="1" height="1" fill={jewelryColor} className="pixel" />
            );
          } else if (style === 'ornate' || style === 'delicate') {
            const length = style === 'ornate' ? 4 : 3;
            for (let d = 0; d < length; d++) {
              elements.push(
                <rect key={`earring-l-drop-${index}-${d}`} x={headX - 1} y={earY + d} width="1" height="1" fill={d === length - 1 && material === 'gems' ? gemColors[0] : jewelryColor} className="pixel" />,
                <rect key={`earring-r-drop-${index}-${d}`} x={headX + headDim.width} y={earY + d} width="1" height="1" fill={d === length - 1 && material === 'gems' ? gemColors[0] : jewelryColor} className="pixel" />
              );
            }
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
    let amuletItem = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      amuletItem = character.equippedItems.amulet;
    }
    
    if (!amuletItem) return <g key="amulet" />;
    
    const elements: JSX.Element[] = [];
    const centerX = headX + Math.floor(headDim.width / 2);
    const neckY = headY + headDim.height + 3;
    
    // Get amulet color
    const amuletColor = getItemColor(amuletItem);
    const amuletShadow = createShadow(amuletColor, 0.7);
    
    // Chain
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      const distFromCenter = Math.abs(x - centerX);
      const yOffset = Math.floor(distFromCenter * 0.3);
      if (x % 2 === 0) {
        elements.push(<rect key={`amulet-chain-${x}`} x={x} y={neckY + yOffset} width="1" height="1" fill="#C0C0C0" className="pixel" />);
      }
    }
    
    // Pendant shape based on amulet name/material
    const name = amuletItem.name?.toLowerCase() || '';
    const material = amuletItem.material?.toLowerCase() || '';
    
    if (name.includes('cross') || name.includes('crucifix')) {
      // Cross shape
      elements.push(
        <rect key="cross-v" x={centerX} y={neckY + 4} width="1" height="5" fill={amuletColor} className="pixel" />,
        <rect key="cross-h" x={centerX - 1} y={neckY + 6} width="3" height="1" fill={amuletColor} className="pixel" />
      );
    } else if (name.includes('star') || name.includes('pentagram')) {
      // Star shape
      elements.push(
        <rect key="star-c" x={centerX} y={neckY + 5} width="1" height="1" fill={amuletColor} className="pixel" />,
        <rect key="star-t" x={centerX} y={neckY + 3} width="1" height="1" fill={amuletColor} className="pixel" />,
        <rect key="star-bl" x={centerX - 2} y={neckY + 7} width="1" height="1" fill={amuletColor} className="pixel" />,
        <rect key="star-br" x={centerX + 2} y={neckY + 7} width="1" height="1" fill={amuletColor} className="pixel" />,
        <rect key="star-l" x={centerX - 1} y={neckY + 4} width="1" height="1" fill={amuletColor} className="pixel" />,
        <rect key="star-r" x={centerX + 1} y={neckY + 4} width="1" height="1" fill={amuletColor} className="pixel" />
      );
    } else if (name.includes('circle') || name.includes('ring') || name.includes('medallion')) {
      // Circular pendant
      const radius = 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius && dist >= radius - 1) {
            elements.push(<rect key={`circle-${dx}-${dy}`} x={centerX + dx} y={neckY + 5 + dy} width="1" height="1" fill={amuletColor} className="pixel" />);
          }
        }
      }
      // Center gem
      elements.push(<rect key="circle-gem" x={centerX} y={neckY + 5} width="1" height="1" fill="#DC143C" className="pixel" />);
    } else {
      // Default rectangular pendant
      elements.push(
        <rect key="pendant-1" x={centerX - 1} y={neckY + 4} width="3" height="3" fill={amuletColor} className="pixel" />,
        <rect key="pendant-2" x={centerX} y={neckY + 5} width="1" height="1" fill={amuletShadow} className="pixel" />
      );
    }
    
    return <g key="amulet">{elements}</g>;
  }, [character.equippedItems, useEquippedItems, headDim.height, headDim.width, headX, headY]);

  // ----- MARKINGS -----
  const renderMarkings = useMemo(() => {
    if (!appearanceWithDefaults.markings || appearanceWithDefaults.markings.length === 0) return <g key="markings" />;
    const elements: JSX.Element[] = [];

    appearanceWithDefaults.markings.forEach((marking, index) => {
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
          if (marking.location === 'face' && culturalZone === 'OCEANIA') {
            const pattern = marking.pattern || 'lines';
            if (pattern === 'lines') {
              for (let y = 0; y < 4; y++) {
                for (let x = -2; x <= 2; x++) {
                  if (Math.abs(x) + y < 4) {
                    elements.push(
                      <rect key={`tattoo-${index}-${x}-${y}`} x={headX + Math.floor(headDim.width / 2) + x} y={headY + headDim.height - 6 + y} width="1" height="1" fill={markingColor} className="pixel" />
                    );
                  }
                }
              }
            }
          }
          break;
        }
        case 'paint': {
          if (marking.location === 'face') {
            const paintPattern = marking.pattern || 'stripes';
            if (paintPattern === 'stripes') {
              elements.push(
                <rect key={`paint-stripe1-${index}`} x={headX + 2} y={headY + 10} width={headDim.width - 4} height="1" fill={markingColor} className="pixel" />,
                <rect key={`paint-stripe2-${index}`} x={headX + 2} y={headY + 13} width={headDim.width - 4} height="1" fill={markingColor} className="pixel" />
              );
            } else if (paintPattern === 'dots') {
              for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                  if ((x + y) % 2 === 0) {
                    elements.push(
                      <rect key={`paint-dot-${index}-${x}-${y}`} x={headX + Math.floor(headDim.width / 2) - 3 + x * 3} y={headY + 8 + y * 3} width="1" height="1" fill={markingColor} className="pixel" />
                    );
                  }
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
  }, [appearanceWithDefaults.markings, culturalZone, headDim.height, headDim.width, headX, headY, skinTone, skinHighlight]);

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

      {/* Markings */}
      {renderMarkings}

      {/* Headgear & jewelry */}
      {renderHeadgear}
      {renderJewelry}
      {renderAmulet}
    </svg>
  );
};

export default ProceduralPortrait;

