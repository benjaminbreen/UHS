import React, { useEffect, useMemo, useRef, useState } from 'react';

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
      head?: { name: string; material?: string };
      torso?: { name: string; material?: string };
      cloak?: { name: string; material?: string };
      amulet?: { name: string; material?: string };
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

  // ---------- Head Geometry ----------
  const hairLength = appearanceWithDefaults.hairLength || 'medium';
  const headDim = useMemo(() => {
    const faceShape = appearanceWithDefaults.faceShape || 'oval';
    let width = isFemale ? 22 : 26;
    let height = isFemale ? 28 : 30;

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

    for (let y = 0; y < headDim.height; y++) {
      const relativeY = y / headDim.height;
      let widthMultiplier = 1;

      switch (faceShape) {
        case 'oval':
          widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY)) * Math.PI) * 0.95 + 0.05;
          if (relativeY < 0.05) widthMultiplier *= (0.7 + relativeY * 6);
          break;
        case 'round':
          const roundness = Math.sqrt(Math.max(0, 1 - Math.pow((relativeY - 0.5) * 2, 2)));
          widthMultiplier = roundness * 0.95 + 0.05;
          if (relativeY < 0.05) widthMultiplier *= (0.75 + relativeY * 5);
          break;
        case 'square':
          if (relativeY < 0.2) {
            widthMultiplier = 0.85 + 0.15 * Math.cos((relativeY / 0.2 - 1) * Math.PI);
          } else if (relativeY > 0.8) {
            widthMultiplier = jawline === 'square' ? 0.96 : 0.9;
          } else {
            widthMultiplier = 1.0;
          }
          break;
        case 'long':
          widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY)) * Math.PI) * 0.85 + 0.15;
          if (relativeY < 0.05) widthMultiplier *= (0.65 + relativeY * 7);
          break;
        case 'heart':
          if (relativeY < 0.3) {
            widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY / 0.3)) * Math.PI * 0.5) * 0.95 + 0.05;
          } else {
            widthMultiplier = relativeY < 0.5 ? 0.58 + relativeY * 0.9 : 0.9 - (relativeY - 0.5) * 0.78;
          }
          break;
        case 'diamond':
          if (relativeY < 0.1) widthMultiplier = 0.4 + relativeY * 6;
          else if (relativeY < 0.4) widthMultiplier = 0.72 + relativeY * 0.75;
          else if (relativeY > 0.6) widthMultiplier = 1 - (relativeY - 0.6) * 0.75;
          else widthMultiplier = 1;
          break;
      }

      if (hairLength === 'bald' || hairLength === 'very_short') {
        if (relativeY < 0.2) widthMultiplier *= 1.02;
      }

      const rowWidth = Math.max(6, Math.floor(headDim.width * widthMultiplier));
      const startX = headX + Math.floor((headDim.width - rowWidth) / 2);

      elements.push(
        <rect key={`outline-outer-l-${y}`} x={startX - 2} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-outer-r-${y}`} x={startX + rowWidth + 1} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-l-${y}`} x={startX - 1} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />,
        <rect key={`outline-r-${y}`} x={startX + rowWidth} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />
      );

      for (let x = 0; x < rowWidth; x++) {
        let faceColor = skinTone;
        const xRatio = x / rowWidth;

        if (xRatio < 0.15) faceColor = skinBrightHighlight;
        else if (xRatio < 0.25) faceColor = skinHighlight;
        else if (xRatio < 0.4) faceColor = createHighlight(skinTone, 1.08);
        else if (xRatio > 0.85) faceColor = skinDeepShadow;
        else if (xRatio > 0.75) faceColor = skinShadow;
        else if (xRatio > 0.6) faceColor = skinMidtone;

        if (relativeY > 0.3 && relativeY < 0.5) {
          if (x < 3 || x > rowWidth - 4) faceColor = skinSubsurface;
        }

        const cheekbones = appearanceWithDefaults.cheekbones || 'average';
        if (cheekbones !== 'low' && relativeY > 0.4 && relativeY < 0.65) {
          const cheekboneIntensity = cheekbones === 'high' ? 0.12 : 0.08;
          if (Math.abs(xRatio - 0.22) < cheekboneIntensity || Math.abs(xRatio - 0.78) < cheekboneIntensity) {
            faceColor = createHighlight(faceColor, xRatio < 0.5 ? 1.1 : 1.05);
          }
        }

        if (relativeY > 0.25 && relativeY < 0.65 && Math.abs(x - rowWidth / 2) < 2) {
          faceColor = createHighlight(faceColor, 1.12); // nose bridge
        }

        const skinTexture = appearanceWithDefaults.skinTexture || 'smooth';
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

        elements.push(<rect key={`face-${y}-${x}`} x={startX + x} y={headY + y} width="1" height="1" fill={faceColor} className="pixel" />);
      }
    }
    return <g key="head">{elements}</g>;
  }, [appearanceWithDefaults.cheekbones, appearanceWithDefaults.faceShape, appearanceWithDefaults.jawline, hairLength, headDim.height, headDim.width, headX, headY, hasAgeSpots, hasWrinkles, outlineColor, skinBrightHighlight, skinDeepShadow, skinHighlight, skinMidtone, skinShadow, skinSubsurface, skinTone]);

  // ----- HAIR -----
  const renderHair = useMemo(() => {
    const elements: JSX.Element[] = [];
    const hairTexture = appearanceWithDefaults.hairTexture || 'straight';
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

    const revealForehead = hairLen === 'very_short' ? 4 : hairLen === 'short' ? 2 : 0;

    const hairTop = headY - (hairLen === 'very_short' ? 3 : 6);
    const thickness = isOld ? 0.7 : isYoung ? 0.95 : 0.85;

    for (let layer = 0; layer < 3; layer++) {
      for (let y = hairTop - layer; y < headY + 10; y++) {
        for (let x = headX - 5 + layer; x < headX + headDim.width + 5 - layer; x++) {
          const centerX = headX + headDim.width / 2;
          const dist = Math.abs(x - centerX);
          let draw = false;
          let col = layer === 0 ? hairDeepShadow : layer === 1 ? baseHair : hairHighlight;

          if (y < headY + 2) {
            const topProgress = (headY + 2 - y) / (headY + 2 - hairTop);
            const allowed = (headDim.width / 2 + 4) * thickness * (1 - topProgress * 0.4);
            if (dist < allowed - layer) draw = true;
          } else if (y < headY + 8 - layer) {
            if (x >= headX - 3 + layer && x <= headX + headDim.width + 2 - layer) draw = true;
          }

          if (hairLen === 'very_short') {
            if (y >= headY && y < headY + 3) {
              const frontForehead = headDim.width / 2 - 3;
              if (Math.abs(x - centerX) < frontForehead) {
                draw = false;
              }
            }
            if (y < headY && y >= hairTop) {
              if (dist < headDim.width / 2 + 3) {
                draw = true;
              }
            }
          } else if (revealForehead > 0 && y < headY + revealForehead) {
            const inner = headDim.width / 2 - 2;
            if (Math.abs(x - centerX) < inner - 1) draw = false;
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

    if (['medium', 'long', 'very_long'].includes(hairLen)) {
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
            let col = strand === 0 ? hairShadow : strand === 1 ? baseHair : hairHighlight;
            if (s > 0.2 && strand === 2) col = hairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              elements.push(<rect key={`hair-left-${strand}-${x}-${y}`} x={x + s * 0.4 + p + flow} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
          for (let x = headX + headDim.width - 4 + strandOffset; x < headX + headDim.width + 6 - widthReduction - strandOffset; x++) {
            const p = getHairPattern(x, y);
            const s = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            let col = strand === 0 ? hairShadow : strand === 1 ? baseHair : hairHighlight;
            if (s > 0.2 && strand === 2) col = hairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              elements.push(<rect key={`hair-right-${strand}-${x}-${y}`} x={x - s * 0.4 - p - flow} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }

    return <g key="hair">{elements}</g>;
  }, [appearanceWithDefaults.hairTexture, baseHair, hairBrightHighlight, hairDeepShadow, hairHighlight, hairShadow, headDim.width, headX, headY, hairLength, isOld, isYoung]);

  // ----- EYES (with expression tweaks) -----
  const renderEyes = () => {
    const elements: JSX.Element[] = [];
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

    if (style === 'full_beard') {
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
    } else if (style === 'stubble') {
           // STUBBLE = soft tonal darkening along jaw + above lip (no black dots)
      {
        const density = thickness === 'thick' ? 1.0 : thickness === 'sparse' ? 0.6 : 0.8;

        // 1) Above-lip shadow (short, centered)
        const centerX = headX + Math.floor(headDim.width / 2);
        const moustW = 8;
        const moustY = mouthY - 1; // just above upper lip
        for (let i = -Math.floor(moustW / 2); i <= Math.floor(moustW / 2); i++) {
          // Dither skip to keep it soft
          const skip = ((i + moustY) % 2) !== 0 && density < 0.9;
          if (!skip) {
            elements.push(
              <rect
                key={`stubble-m-${i}`}
                x={centerX + i}
                y={moustY}
                width="1"
                height="1"
                fill={createShadow(skinTone, 0.88)}
                className="pixel"
              />
            );
          }
        }

        // 2) Jaw band: a curved, softly darkened region from under lip to chin
        // Use skin-tone shadows, slightly stronger at edges to imply hair density
        const chinWidth = Math.floor(headDim.width * 0.55);
        const startY = baseY - 1;          // just below the mouth line
        const endY = baseY + 8;            // fade out toward the neck
        for (let y = startY; y <= endY; y++) {
          const t = (y - startY) / (endY - startY); // 0..1
          const rowW = Math.floor(chinWidth * (0.65 + 0.35 * Math.min(1, t * 1.4)));
          const rowX = headX + Math.floor(headDim.width / 2) - Math.floor(rowW / 2);

          // Shade ramp: darker near the sides & chin, lighter near the center
          for (let x = 0; x < rowW; x++) {
            const xr = x / Math.max(1, rowW - 1); // 0..1 across the band
            // Center stays a bit lighter; edges a bit darker
            const edgeBoost = 0.86 - 0.06 * Math.abs(0.5 - xr) * 2; // ~0.80..0.86
            // Vertical fade: stronger near top/middle, fades out by endY
            const vFade = 0.86 + (1 - t) * 0.06; // ~0.86..0.92
            const amount = Math.max(0.80, Math.min(0.92, Math.min(edgeBoost, vFade)));

            // light blue-noise dither so it doesn't look painted
            const noise = rand(x * 917 + y * 613);
            const shouldDraw = noise < density; // thicker -> more coverage
            if (shouldDraw) {
              elements.push(
                <rect
                  key={`stubble-j-${x}-${y}`}
                  x={rowX + x}
                  y={y}
                  width="1"
                  height="1"
                  fill={createShadow(skinTone, amount)}
                  className="pixel"
                />
              );
            }
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
    const clothingColor = appearanceWithDefaults.palette.primary;
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

      if (y < 3) {
        const collarWidth = Math.floor(torsoWidth * 0.6);
        const collarX = 32 - (collarWidth / 2);
        const name = garment?.name?.toLowerCase() || '';
        if (name.includes('robe') || name.includes('dress')) {
          for (let cx = 0; cx < collarWidth; cx++) {
            const vDepth = Math.abs(cx - collarWidth / 2) < y * 2;
            if (vDepth) elements.push(<rect key={`collar-v-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
          }
        } else if (isWealthy) {
          for (let cx = 0; cx < collarWidth; cx++) {
            elements.push(
              <rect key={`collar-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={y === 0 ? accentColor : appearanceWithDefaults.palette.secondary} className="pixel" />
            );
          }
        }
      }
    }

    

    return <g key="body">{elements}</g>;
  }, [appearanceWithDefaults.garment, appearanceWithDefaults.palette.accent, appearanceWithDefaults.palette.primary, appearanceWithDefaults.palette.secondary, bodyDim, culturalZone, headDim.height, headDim.width, headX, headY, isNoble, isWealthy, skinShadow, skinTone, stats?.strength, character.equippedItems, useEquippedItems]);

    // ----- HEADGEAR (improved) -----
  const renderHeadgear = useMemo(() => {
    // Choose source (equipped vs appearance) without changing your prop contract
    let headItem: { name: string; material?: string } | null = null;
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
    else if (nameContains('hat', 'cap', 'beret', 'fez', 'kufi', 'fedora', 'homburg', 'chullo', 'beanie', 'tuque', 'pith', 'snapback', 'petasos', 'chaperon')) {
      const hatStyle =
        name.includes('top') ? 'top' :
        name.includes('beret') ? 'beret' :
        (name.includes('fez') || name.includes('kufi')) ? 'fez' :
        (nameContains('fedora', 'homburg', 'pith', 'petasos')) ? 'brimmed' :
        (nameContains('chullo', 'beanie', 'tuque')) ? 'knit' :
        'generic';

      switch (hatStyle) {
        case 'top': {
          // Tall crown
          for (let y = headY - 10; y < headY - 2; y++) {
            for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
              elements.push(<rect key={`tophat-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" className="pixel" />);
            }
          }
          // Brim
          for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
            elements.push(<rect key={`tophat-brim-${x}`} x={x} y={headY - 2} width="1" height="2" fill="#000000" className="pixel" />);
          }
          // Band
          if (isWealthy) {
            for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
              elements.push(<rect key={`tophat-band-${x}`} x={x} y={headY - 5} width="1" height="1" fill={appearanceWithDefaults.palette.accent} className="pixel" />);
            }
          }
          break;
        }
        case 'beret': {
          for (let y = headY - 4; y < headY + 2; y++) {
            for (let x = headX - 2; x < headX + headDim.width + 3; x++) {
              const dx = Math.abs(x - centerX);
              const shape = dx < headDim.width / 2 + 3 - Math.max(0, (y - headY));
              if (shape) {
                const tilt = x > centerX ? -1 : 0;
                elements.push(<rect key={`beret-${x}-${y}`} x={x} y={y + tilt} width="1" height="1" fill={base} className="pixel" />);
              }
            }
          }
          break;
        }
        case 'fez': {
          for (let y = headY - 6; y < headY; y++) {
            for (let x = headX + 3; x < headX + headDim.width - 3; x++) {
              elements.push(<rect key={`fez-${x}-${y}`} x={x} y={y} width="1" height="1" fill={createShadow('#8B0000', 0.95)} className="pixel" />);
            }
          }
          for (let t = 0; t < 4; t++) {
            elements.push(<rect key={`fez-tassel-${t}`} x={centerX} y={headY - 6 - t} width="1" height="1" fill="#000000" className="pixel" />);
          }
          break;
        }
        case 'brimmed': {
          // Crown
          for (let y = headY - 5; y < headY; y++) {
            for (let x = headX; x < headX + headDim.width; x++) {
              elements.push(<rect key={`fed-crown-${x}-${y}`} x={x} y={y} width="1" height="1" fill={base} className="pixel" />);
            }
          }
          // Brim
          for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
            elements.push(<rect key={`fed-brim-${x}`} x={x} y={headY} width="1" height="1" fill={shade} className="pixel" />);
          }
          break;
        }
        case 'knit': {
          for (let y = headY - 6; y < headY + 1; y++) {
            for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
              const knit = (x + y) % 2 === 0;
              elements.push(<rect key={`knit-${x}-${y}`} x={x} y={y} width="1" height="1" fill={knit ? base : shade} className="pixel" />);
            }
          }
          // optional ear flaps for chullo
          if (name.includes('chullo')) {
            for (let f = 0; f < 4; f++) {
              elements.push(
                <rect key={`flap-l-${f}`} x={headX - 1} y={headY + f} width="1" height="1" fill={shade} className="pixel" />,
                <rect key={`flap-r-${f}`} x={headX + headDim.width} y={headY + f} width="1" height="1" fill={shade} className="pixel" />
              );
            }
          }
          break;
        }
        default: {
          // Generic cap with visor
          for (let y = 0; y < 7; y++) {
            const w = y < 3 ? headDim.width - 2 + y : headDim.width + 2;
            const sx = centerX - Math.floor(w / 2);
            for (let x = 0; x < w; x++) {
              if (y === 0 && (x === 0 || x === w - 1)) continue; // slight rounding
              elements.push(<rect key={`cap-c-${y}-${x}`} x={sx + x} y={headY - 6 + y} width="1" height="1" fill={base} className="pixel" />);
            }
          }
          // Visor
          for (let y = 0; y < 2; y++) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(<rect key={`cap-v-${y}-${x}`} x={x} y={headY + y} width="1" height="1" fill={createShadow(base, 0.75)} className="pixel" />);
            }
          }
          // Top button
          elements.push(<rect key="cap-btn" x={centerX - 1} y={headY - 7} width="2" height="1" fill={shade} className="pixel" />);
        }
      }
    }

    // STRAW / CONICAL (rice hat, sedge hat)
    else if (nameContains('straw', 'rice hat', 'conical', 'bamboo hat', 'sedge hat', 'coolie')) {
      const straw = '#D4A76A';
      const strawDark = createShadow(straw, 0.78);

      // Conical crown
      const crownHeight = 8;
      for (let i = 0; i < crownHeight; i++) {
        const rowY = headY - 6 - i;
        const rowW = headDim.width + 6 - i * 2;
        const sx = centerX - Math.floor(rowW / 2);
        for (let x = 0; x < rowW; x++) {
          const col = (x % 4 === 1) ? strawDark : straw;
          elements.push(<rect key={`cone-${i}-${x}`} x={sx + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Super-wide brim (very visible)
      const brimExtra = 12;
      for (let y = 0; y < 2; y++) {
        for (let x = headX - brimExtra; x < headX + headDim.width + brimExtra; x++) {
          const col = (x % 3 === 0) ? strawDark : straw;
          elements.push(<rect key={`straw-brim-${y}-${x}`} x={x} y={headY + y} width="1" height="1" fill={col} className="pixel" />);
        }
      }
      // Radial ties detail beneath brim
      for (let r = -10; r <= 10; r += 5) {
        elements.push(
          <rect key={`straw-tie-${r}`} x={centerX + r} y={headY + 1} width="1" height="2" fill={strawDark} className="pixel" />
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
    </svg>
  );
};

export default ProceduralPortrait;

