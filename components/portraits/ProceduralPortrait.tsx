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
    };
    wealthLevel: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
    class?: string;
    era: string;
    culturalZone?: 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';
    portraitSeed?: number;
  };
  size?: number;
  className?: string;
  temporaryExpression?: 'smile' | 'surprise' | null;
  onExpressionComplete?: () => void;
}

type AgeGroup = 'young' | 'adult' | 'old';

const ProceduralPortrait: React.FC<ProceduralPortraitProps> = ({
  character,
  size = 192,
  className = '',
  temporaryExpression = null,
  onExpressionComplete
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
  const { age = 30, gender, stats, appearance, wealthLevel, era, culturalZone = 'EUROPEAN' } = character;
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

  // ---------- Color Utilities (robust for #hex or rgb(...)) ----------
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

  // ---------- Head Geometry (with bald/short adjustments) ----------
  const hairLength = appearance.hairLength || 'medium';
  const headDim = useMemo(() => {
    const faceShape = appearance.faceShape || 'oval';
    let width = isFemale ? 22 : 26;
    let height = isFemale ? 28 : 30;

    if (isYoung) { width += 2; height -= 1; }
    if (isOld)   { height += 3; width -= 1; }

    if (stats.strength >= 8) width += isFemale ? 1 : 3;
    else if (stats.strength <= 3) width -= isFemale ? 0 : 2;

    if (appearance.build === 'imposing') width += 2;
    if (appearance.build === 'slight') width -= 2;

    // More skull height when hair is missing/very short (fixes "no forehead")
    if (hairLength === 'bald') height += 4;
    if (hairLength === 'very_short') height += 2;

    switch (faceShape) {
      case 'round':  width += 2; height -= 2; break;
      case 'square': if (!isFemale) width += 1; break;
      case 'long':   width -= 1; height += 3; break;
    }
    return { width, height, shape: faceShape as NonNullable<typeof appearance.faceShape> };
  }, [appearance.build, appearance.faceShape, hairLength, isFemale, isOld, isYoung, stats.strength]);

  const headX = 32 - (headDim.width / 2);
  const headY = 10; // Moved up by 2 pixels to give more room for head shape

  // ---------- Skin/Hair Palette ----------
  // Check if character is sick for skin tone adjustments
  const isSick = (character.health !== undefined && character.maxHealth !== undefined && 
                  (character.health / character.maxHealth) < 0.6) ||
                 (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);
  
  // Add greenish/pale tinge when sick
  let actualSkinTone = appearance.skinColor;
  if (isSick) {
    // Parse the hex color and add a greenish/grayish tinge
    const r = parseInt(actualSkinTone.slice(1, 3), 16);
    const g = parseInt(actualSkinTone.slice(3, 5), 16);
    const b = parseInt(actualSkinTone.slice(5, 7), 16);
    // Reduce red slightly, keep green, reduce blue for sickly appearance
    const sickR = Math.max(0, r - 15);
    const sickG = g;
    const sickB = Math.max(0, b - 10);
    actualSkinTone = `#${sickR.toString(16).padStart(2, '0')}${sickG.toString(16).padStart(2, '0')}${sickB.toString(16).padStart(2, '0')}`;
  }
  
  const skinTone = actualSkinTone;
  const skinToneType = appearance.skinTone || 'medium';
  const skinTemperature = getColorTemperature(skinTone);

  const skinShadow = createComplementaryShadow(skinTone);
  const skinDeepShadow = createComplementaryShadow(skinTone, 0.5);
  const skinHighlight = createHighlight(skinTone, 1.15);
  const skinBrightHighlight = createHighlight(skinTone, 1.3);
  const skinMidtone = createShadow(skinTone, 0.95);
  const skinSubsurface = createSubsurfaceScattering(skinTone);
  const outlineColor = createShadow(skinTone, 0.45);

  const baseHair = hasGrayHair ? 'rgb(192,192,192)' : appearance.hairColor;
  const hairShadow = createComplementaryShadow(baseHair, 0.6);
  const hairDeepShadow = createComplementaryShadow(baseHair, 0.4);
  const hairHighlight = createHighlight(baseHair, 1.5);
  const hairBrightHighlight = createHighlight(baseHair, 1.8);

  // ---------- Expression ----------
  // initial gaze (seeded)
  const initialGazeRoll = rand(51);
  const initialGazeDirection: 0 | 1 | 2 = initialGazeRoll > 0.95 ? 2 : initialGazeRoll > 0.9 ? 0 : 1;
  const [gazeDirection, setGazeDirection] = useState<0 | 1 | 2>(initialGazeDirection);

  let baseExpressionType = Math.floor(rand(52) * 5);
  let microExpression = Math.floor(rand(53) * 3);
  if (stats.charisma >= 8) { baseExpressionType = 1; microExpression = 1; }
  else if (stats.charisma <= 2) { baseExpressionType = 3; microExpression = 2; }
  else if (stats.intelligence >= 8) { baseExpressionType = 4; microExpression = 0; }
  
  // Override with temporary expression if provided
  let expressionType = baseExpressionType;
  if (temporaryExpression === 'smile') {
    expressionType = 1; // smile
  } else if (temporaryExpression === 'surprise') {
    expressionType = 0; // neutral with wide eyes (we'll modify eyes later)
  }
  
  // Handle temporary expression timer
  useEffect(() => {
    if (temporaryExpression && onExpressionComplete) {
      const timer = setTimeout(() => {
        onExpressionComplete();
      }, 2000); // 2 second duration for temporary expressions
      
      return () => clearTimeout(timer);
    }
  }, [temporaryExpression, onExpressionComplete]);

  // ---------- Blink Animation (rarer, more randomized) ----------
  const [blinkProgress, setBlinkProgress] = useState(0); // 0=open, 1=closed
  const animRef = useRef<number | null>(null);
  const nextBlinkTimeout = useRef<number | null>(null);
  const nextGazeTimeout = useRef<number | null>(null);

  // helper seeded jitter
  const jitter = (min: number, max: number) => min + (max - min) * (0.5 + (Math.sin(seed * 13.37 + (performance.now?.() || 0) / 1e4) * 0.5));

  useEffect(() => {
    // Blink less often: base window ~7–18s, with rare long gaps up to ~40s.
    const pickBlinkDelay = () => {
      const r = rand(Math.floor((performance.now?.() || 0)) % 10007);
      const base = 7000 + r * 11000; // 7–18s
      // 1 in ~8 chance to push into 20–40s to avoid robotic regularity
      return (r > 0.875) ? base + 20000 * r : base + jitter(-500, 500);
    };

    let closing = true;
    let start = 0;
    const duration = 120 + Math.floor(80 * rand(777)); // 120–200ms

    const step = (t: number) => {
      if (!start) start = t;
      const elapsed = t - start;
      let p = Math.min(1, elapsed / duration);
      if (!closing) p = 1 - p; // opening
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

    const initialDelay = 2000 + Math.floor(rand(999) * 4000); // 2–6s first blink
    nextBlinkTimeout.current = window.setTimeout(() => {
      animRef.current = requestAnimationFrame(step);
    }, initialDelay);

    // Very rare gaze shifts (every 2–5 minutes), seeded
    const scheduleGaze = () => {
      const r = rand(123456 + Math.floor((performance.now?.() || 0) / 1e4));
      const delay = 120000 + r * 180000; // 2–5 minutes
      nextGazeTimeout.current = window.setTimeout(() => {
        // 90% center, 5% left, 5% right on each change
        const roll = rand(98765 + (performance.now?.() || 0));
        const dir: 0 | 1 | 2 = roll > 0.95 ? 2 : roll > 0.9 ? 0 : 1;
        setGazeDirection(dir);
        scheduleGaze(); // reschedule
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
    if (appearance.lipColor) return appearance.lipColor;
    const baseLipColors: Record<NonNullable<typeof appearance.skinTone>, string> = {
      very_pale: '#E8B4B8', pale: '#E0A5A8', fair: '#D89598', light: '#CE8588',
      medium: '#C47578', olive: '#BA6568', tan: '#B05558', dark: '#A64548', very_dark: '#9C3538'
    };
    const base = baseLipColors[skinToneType] || '#C47578';
    return isFemale && isWealthy ? createHighlight(base, 1.2) : base;
  }, [appearance.lipColor, isFemale, isWealthy, skinToneType]);

  // ---------- Body Dimensions (Enhanced for build types) ----------
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

    // More comprehensive build modifications
    switch (appearance.build) {
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
    
    // Use actual height from appearance if available
    if (appearance.height) {
      const avgHeight = isFemale ? 165 : 175;
      heightMod *= (appearance.height / avgHeight);
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
  }, [appearance.build, appearance.height, isFemale, isOld, isYoung, stats.strength]);

  // ---------- Background (unique IDs) ----------
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
    const faceShape = appearance.faceShape || 'oval';
    const jawline = appearance.jawline || 'soft';

    for (let y = 0; y < headDim.height; y++) {
      const relativeY = y / headDim.height;
      let widthMultiplier = 1;

      switch (faceShape) {
        case 'oval':
          // Smooth sine-based curve for natural head shape
          widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY)) * Math.PI) * 0.95 + 0.05;
          // Slightly narrower at the very top for realistic skull shape
          if (relativeY < 0.05) widthMultiplier *= (0.7 + relativeY * 6);
          break;
        case 'round':
          // Circular shape using circle equation
          const roundness = Math.sqrt(Math.max(0, 1 - Math.pow((relativeY - 0.5) * 2, 2)));
          widthMultiplier = roundness * 0.95 + 0.05;
          if (relativeY < 0.05) widthMultiplier *= (0.75 + relativeY * 5);
          break;
        case 'square':
          // More angular but still smooth transitions
          if (relativeY < 0.2) {
            // Smooth curve at top using cosine
            widthMultiplier = 0.85 + 0.15 * Math.cos((relativeY / 0.2 - 1) * Math.PI);
          } else if (relativeY > 0.8) {
            widthMultiplier = jawline === 'square' ? 0.96 : 0.9;
          } else {
            widthMultiplier = 1.0;
          }
          break;
        case 'long':
          // Elongated oval shape
          widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY)) * Math.PI) * 0.85 + 0.15;
          if (relativeY < 0.05) widthMultiplier *= (0.65 + relativeY * 7);
          break;
        case 'heart':
          // Wider at forehead, tapers to chin
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

      // Slightly fuller upper skull for bald/very_short
      if (hairLength === 'bald' || hairLength === 'very_short') {
        if (relativeY < 0.2) widthMultiplier *= 1.02;
      }

      const rowWidth = Math.max(6, Math.floor(headDim.width * widthMultiplier));
      const startX = headX + Math.floor((headDim.width - rowWidth) / 2);

      // Outer depth outline + inner outline
      elements.push(
        <rect key={`outline-outer-l-${y}`} x={startX - 2} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-outer-r-${y}`} x={startX + rowWidth + 1} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-l-${y}`} x={startX - 1} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />,
        <rect key={`outline-r-${y}`} x={startX + rowWidth} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />
      );

      for (let x = 0; x < rowWidth; x++) {
        let faceColor = skinTone;
        const xRatio = x / rowWidth;

        // Key light from top-left
        if (xRatio < 0.15) faceColor = skinBrightHighlight;
        else if (xRatio < 0.25) faceColor = skinHighlight;
        else if (xRatio < 0.4) faceColor = createHighlight(skinTone, 1.08);
        else if (xRatio > 0.85) faceColor = skinDeepShadow;
        else if (xRatio > 0.75) faceColor = skinShadow;
        else if (xRatio > 0.6) faceColor = skinMidtone;

        // Subsurface near edges (ears/temples)
        if (relativeY > 0.3 && relativeY < 0.5) {
          if (x < 3 || x > rowWidth - 4) faceColor = skinSubsurface;
        }

        const cheekbones = appearance.cheekbones || 'average';
        if (cheekbones !== 'low' && relativeY > 0.4 && relativeY < 0.65) {
          const cheekboneIntensity = cheekbones === 'high' ? 0.12 : 0.08;
          if (Math.abs(xRatio - 0.22) < cheekboneIntensity || Math.abs(xRatio - 0.78) < cheekboneIntensity) {
            faceColor = createHighlight(faceColor, xRatio < 0.5 ? 1.1 : 1.05);
          }
        }

        if (relativeY > 0.25 && relativeY < 0.65 && Math.abs(x - rowWidth / 2) < 2) {
            faceColor = createHighlight(faceColor, 1.12); // nose bridge
        }

        const skinTexture = appearance.skinTexture || 'smooth';
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

      // NOTE: removed the solid under-chin strip that was bisecting necks.
    }
    return <g key="head">{elements}</g>;
  }, [appearance.cheekbones, appearance.faceShape, appearance.jawline, hairLength, headDim.height, headDim.width, headX, headY, hasAgeSpots, hasWrinkles, outlineColor, skinBrightHighlight, skinDeepShadow, skinHighlight, skinMidtone, skinShadow, skinSubsurface, skinTone]);

  // ----- HAIR (with hairline for short hair so it doesn't look like a hat) -----
  const renderHair = useMemo(() => {
    const elements: JSX.Element[] = [];
    const hairTexture = appearance.hairTexture || 'straight';
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

    // Hairline control: reveal some forehead on short hair
    const revealForehead = hairLen === 'very_short' ? 3 : hairLen === 'short' ? 2 : 0;

    const hairTop = headY - (hairLen === 'very_short' ? 1 : 6); // Adjusted for new head position
    const thickness = isOld ? 0.7 : isYoung ? 0.95 : 0.85;

    for (let layer = 0; layer < 3; layer++) {
      for (let y = hairTop - layer; y < headY + 10; y++) {
        for (let x = headX - 5 + layer; x < headX + headDim.width + 5 - layer; x++) {
          const centerX = headX + headDim.width / 2;
          const dist = Math.abs(x - centerX);
          let draw = false;
          let col = layer === 0 ? hairDeepShadow : layer === 1 ? baseHair : hairHighlight;

          if (y < headY + 2) { // Adjusted to cover the more rounded top
            const topProgress = (headY + 2 - y) / (headY + 2 - hairTop);
            const allowed = (headDim.width / 2 + 4) * thickness * (1 - topProgress * 0.4); // More gradual taper
            if (dist < allowed - layer) draw = true;
          } else if (y < headY + 8 - layer) {
            if (x >= headX - 3 + layer && x <= headX + headDim.width + 2 - layer) draw = true;
          }

          // Carve back hairline for short/very_short near the forehead center
          if (revealForehead > 0 && y < headY + revealForehead) {
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
  }, [appearance.hairTexture, baseHair, hairBrightHighlight, hairDeepShadow, hairHighlight, hairShadow, headDim.width, headX, headY, hairLength, isOld, isYoung]);

  // ----- EYES (animate) -----
  const renderEyes = () => {
    const elements: JSX.Element[] = [];
    const eyeShape = appearance.eyeShape || 'almond';
    const eyebrowShape = appearance.eyebrowShape || 'arched';
    const eyebrowThickness = appearance.eyebrowThickness || 'medium';
    const eyelashes = appearance.eyelashes || 'medium';

    // Lower eyes a bit on bald/very_short to create more forehead
    const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
    const eyeY = headY + Math.floor(headDim.height * eyeRatioBase);

    const eyeSpacing = Math.floor(headDim.width * 0.24);
    const centerX = headX + Math.floor(headDim.width / 2);
    const leftEyeX = centerX - eyeSpacing - 2;
    const rightEyeX = centerX + eyeSpacing - 1;

    // Sockets
    // Add fatigue indicators - dark bags under eyes when tired
    const isFatigued = character.fatigue !== undefined && character.maxFatigue !== undefined && 
                       (character.fatigue / character.maxFatigue) < 0.4;
    const isSick = (character.health !== undefined && character.maxHealth !== undefined && 
                    (character.health / character.maxHealth) < 0.6) ||
                   (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);
    
    const socketDepth = eyeShape === 'hooded' ? 0.55 : (isFatigued ? 0.45 : 0.7);
    elements.push(
      <rect key="socket-l" x={leftEyeX - 3} y={eyeY - 2} width="7" height="1" fill={createComplementaryShadow(skinTone, socketDepth)} className="pixel" />,
      <rect key="socket-r" x={rightEyeX - 3} y={eyeY - 2} width="7" height="1" fill={createComplementaryShadow(skinTone, socketDepth)} className="pixel" />
    );
    
    // Add dark bags under eyes when fatigued
    if (isFatigued) {
      elements.push(
        <rect key="bag-l1" x={leftEyeX - 2} y={eyeY + eyeHeight + 1} width="6" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
        <rect key="bag-r1" x={rightEyeX - 2} y={eyeY + eyeHeight + 1} width="6" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
        <rect key="bag-l2" x={leftEyeX - 1} y={eyeY + eyeHeight + 2} width="4" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />,
        <rect key="bag-r2" x={rightEyeX - 1} y={eyeY + eyeHeight + 2} width="4" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />
      );
    }

    let eyeWidth = 4;
    let eyeHeight = 2;
    
    // Make eyes wider for surprise expression
    if (temporaryExpression === 'surprise') {
      eyeWidth += 1;
      eyeHeight += 1;
    }
    
    switch (eyeShape) {
      case 'round': eyeWidth = 4; eyeHeight = 3; break;
      case 'narrow': eyeWidth = 3; eyeHeight = 2; break;
      case 'wide': eyeWidth = 5; eyeHeight = 2; break;
      case 'hooded':
        eyeHeight = 2;
        elements.push(
          <rect key="hood-l" x={leftEyeX - 1} y={eyeY - 1} width="5" height="1" fill={createShadow(skinTone, 0.95)} className="pixel" />,
          <rect key="hood-r" x={rightEyeX - 1} y={eyeY - 1} width="5" height="1" fill={createShadow(skinTone, 0.95)} className="pixel" />
        );
        break;
    }

    // Bloodshot or yellowish eyes when sick
    const eyeWhiteColor = isSick ? 'rgb(255,250,240)' : 
                          stats.constitution >= 8 ? 'rgb(255,255,255)' : 'rgb(250,250,250)';
    elements.push(
      <rect key="eye-white-l" x={leftEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />,
      <rect key="eye-white-r" x={rightEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />
    );

    // Iris + pupils
    let irisSize = 2;
    let irisOffset = 1;
    if (gazeDirection === 0) irisOffset = 0;
    else if (gazeDirection === 2) irisOffset = eyeWidth - irisSize;

    const irisY = eyeShape === 'round' ? eyeY + 0.5 : eyeY;
    elements.push(
      <rect key="iris-l" x={leftEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} fill={appearance.eyeColor} className="pixel" />,
      <rect key="iris-r" x={rightEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} fill={appearance.eyeColor} className="pixel" />
    );

    const pupilSize = microExpression === 0 ? 1 : 1.5;
    elements.push(
      <rect key="pupil-l" x={leftEyeX + irisOffset + 0.5} y={irisY + 0.5} width={pupilSize} height={pupilSize} fill="rgb(0,0,0)" className="pixel" />,
      <rect key="pupil-r" x={rightEyeX + irisOffset + 0.5} y={irisY + 0.5} width={pupilSize} height={pupilSize} fill="rgb(0,0,0)" className="pixel" />
    );

    if (stats.constitution >= 6 || microExpression === 1) {
      elements.push(
        <rect key="shine-l" x={leftEyeX + irisOffset} y={irisY} width="1" height="1" fill="rgb(255,255,255)" opacity={0.6} className="pixel" />,
        <rect key="shine-r" x={rightEyeX + irisOffset} y={irisY} width="1" height="1" fill="rgb(255,255,255)" opacity={0.6} className="pixel" />
      );
    }

    // Brows
    const browColor = hasGrayHair ? 'rgb(169,169,169)' : baseHair;
    // Lift eyebrows when smiling (and make them slightly more arched)
    const isSmiling = temporaryExpression === 'smile' || expressionType === 1;
    const browLift = isSmiling ? 2 : 0;
    const browY = eyeY - 3 - (microExpression === 2 ? 1 : 0) - browLift;
    const browT = eyebrowThickness === 'thick' ? 2 : eyebrowThickness === 'bushy' ? 3 : 1;
    for (let t = 0; t < browT; t++) {
      switch (eyebrowShape) {
        case 'straight':
          elements.push(
            <rect key={`brow-l-${t}`} x={leftEyeX - 1} y={browY - t} width="5" height="1" fill={browColor} className="pixel" />,
            <rect key={`brow-r-${t}`} x={rightEyeX - 1} y={browY - t} width="5" height="1" fill={browColor} className="pixel" />
          ); break;
        case 'arched':
          for (let x = 0; x < 5; x++) {
            const arch = x < 3 ? x * 0.5 : (4 - x) * 0.5;
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={browY - t - arch} width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={browY - t - arch} width="1" height="1" fill={browColor} className="pixel" />
            );
          } break;
        case 'angular':
          for (let x = 0; x < 5; x++) {
            const angleY = x < 3 ? 0 : x - 3;
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={browY - t + angleY} width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={browY - t - angleY} width="1" height="1" fill={browColor} className="pixel" />
            );
          } break;
      }
    }

    // Lashes (subtle)
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

    // ----- Blinking eyelids (overlay) -----
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

  // ----- NOSE (more variety + length toward philtrum; mild cultural weighting) -----
  const renderNose = useMemo(() => {
    const elements: JSX.Element[] = [];
    
    // Check if character is sick for red nose
    const isSick = (character.health !== undefined && character.maxHealth !== undefined && 
                    (character.health / character.maxHealth) < 0.6) ||
                   (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);
    
    // cultural weighting (very mild; all shapes possible everywhere)
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

    // pick param set
    const rW = rand(901) + (isOld ? 0.05 : 0) + (isFemale ? -0.02 : 0);
    const rL = rand(902) + (isOld ? 0.08 : 0);
    const wide = rW < zoneBias.broadProb ? 1 : 0;
    const long = rL < zoneBias.longProb ? 1 : 0;

    // baseline from declared noseShape
    const declared = appearance.noseShape || 'straight';
    // Map to width/length multipliers
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
    // anchor nose so it ends above philtrum
    const mouthY = headY + Math.floor(headDim.height * 0.72);
    const eyeY = headY + Math.floor(headDim.height * (hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35));

    const noseStartY = eyeY + 4; // just below eyes
    const maxLenToPhiltrum = Math.max(3, mouthY - 2 - noseStartY); // stop ~2px above upper lip
    const noseLen = Math.min(maxLenToPhiltrum, Math.round((5 + (long ? 2 : 0) + (isOld ? 1 : 0)) * lengthMul));
    const noseWidth = Math.max(3, Math.round((declared === 'broad' ? 4 : 3) * widthMul));

    // bridge
    for (let i = 0; i < Math.max(1, noseLen - 2); i++) {
      elements.push(
        <rect key={`nbh-${i}`} x={noseX + 1} y={noseStartY - 1 + i} width="1" height="1" fill={i < 2 ? skinHighlight : skinMidtone} className="pixel" />
      );
    }
    // subtle bump or straight
    if (bump) {
      elements.push(
        <rect key="bump-1" x={noseX + 1} y={noseStartY + Math.floor(noseLen / 3)} width="2" height="1" fill={skinTone} className="pixel" />
      );
    }

    // main body
    elements.push(
      <rect key="nose-body" x={noseX} y={noseStartY} width={noseWidth - 1} height={noseLen} fill={skinTone} className="pixel" />
    );

    // side shading + rim light
    elements.push(
      <rect key="nose-side-l" x={noseX - 1} y={noseStartY + 1} width="1" height={Math.max(2, noseLen - 1)} fill={skinShadow} className="pixel" />,
      <rect key="nose-side-r" x={noseX + noseWidth - 1} y={noseStartY + 1} width="1" height={Math.max(1, noseLen - 2)} fill={skinHighlight} className="pixel" />
    );

    // tip + nostrils
    const tipY = noseStartY + noseLen - 1;
    const tipHL = tipUp ? skinHighlight : skinBrightHighlight;
    
    // Red nose when sick
    if (isSick) {
      // Add reddish areas around nose tip and nostrils
      elements.push(
        <rect key="red-nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill="rgba(255, 120, 120, 0.6)" className="pixel" />,
        <rect key="red-nose-area" x={noseX} y={tipY - 1} width={noseWidth} height="2" fill="rgba(255, 140, 140, 0.3)" className="pixel" />
      );
    }
    
    elements.push(
      <rect key="nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill={isSick ? "rgba(255, 180, 180, 0.8)" : tipHL} className="pixel" />
    );

    const nostrilY = Math.min(tipY + (tipUp ? 0 : 1), mouthY - 2);
    elements.push(
      <rect key="nostril-l" x={noseX} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="nostril-r" x={noseX + noseWidth - 2} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="subnasal-shadow" x={noseX + 1} y={nostrilY + 1} width={Math.max(1, noseWidth - 3)} height="1" fill={isSick ? "rgba(255, 160, 160, 0.4)" : skinShadow} className="pixel" />
    );

    return <g key="nose">{elements}</g>;
  }, [appearance.noseShape, culturalZone, hairLength, headDim.height, headDim.width, headX, headY, isFemale, isOld, skinBrightHighlight, skinDeepShadow, skinHighlight, skinMidtone, skinShadow, skinTone]);

  // ----- MOUTH -----
  const renderMouth = useMemo(() => {
    const elements: JSX.Element[] = [];
    const lipShape = appearance.lipShape || 'medium';
    const mouthX = headX + Math.floor(headDim.width / 2) - 2;
    const mouthY = headY + Math.floor(headDim.height * 0.72);
    
    // Check if tired or sick for downturned mouth
    const isFatigued = character.fatigue !== undefined && character.maxFatigue !== undefined && 
                       (character.fatigue / character.maxFatigue) < 0.4;
    const isSick = (character.health !== undefined && character.maxHealth !== undefined && 
                    (character.health / character.maxHealth) < 0.6) ||
                   (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);
    
    // Paler lips when sick
    const actualLipColor = isSick ? createShadow(lipColor, 0.85) : lipColor;
    const upperLipColor = createShadow(actualLipColor, 0.85);
    const lowerLipColor = actualLipColor;
    const lipHL = createHighlight(actualLipColor, 1.3);
    const lipShadow = createShadow(actualLipColor, 0.7);

    // Override expression if tired or sick - downturned mouth
    let actualExpressionType = expressionType;
    if (isFatigued || isSick) {
      actualExpressionType = 2; // frown expression
    }
    
    let mouthWidth = actualExpressionType === 1 ? 6 : actualExpressionType === 3 ? 3 : 5;

    switch (lipShape) {
      case 'thin':
        elements.push(
          <rect key="mouth-upper-thin" x={mouthX} y={mouthY} width={mouthWidth} height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-thin" x={mouthX} y={mouthY + 1} width={mouthWidth} height="1" fill={lowerLipColor} className="pixel" />
        ); break;
      case 'full':
        elements.push(
          <rect key="mouth-upper-full1" x={mouthX} y={mouthY - 1} width={mouthWidth} height="1" fill={createHighlight(upperLipColor, 1.1)} className="pixel" />,
          <rect key="mouth-upper-full2" x={mouthX - 1} y={mouthY} width={mouthWidth + 2} height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-full1" x={mouthX - 1} y={mouthY + 1} width={mouthWidth + 2} height="2" fill={lowerLipColor} className="pixel" />,
          <rect key="mouth-lower-full2" x={mouthX} y={mouthY + 3} width={mouthWidth} height="1" fill={createShadow(lowerLipColor, 0.9)} className="pixel" />
        ); break;
      case 'bow':
        elements.push(
          <rect key="mouth-bow-peak1" x={mouthX + 1} y={mouthY - 1} width="1" height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-bow-peak2" x={mouthX + 3} y={mouthY - 1} width="1" height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-bow-dip" x={mouthX + 2} y={mouthY} width="1" height="1" fill={createHighlight(upperLipColor, 1.1)} className="pixel" />,
          <rect key="mouth-upper-bow" x={mouthX} y={mouthY} width={mouthWidth} height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-bow" x={mouthX} y={mouthY + 1} width={mouthWidth} height="2" fill={lowerLipColor} className="pixel" />
        ); break;
      case 'wide':
        mouthWidth = 7;
        elements.push(
          <rect key="mouth-upper-wide" x={mouthX - 1} y={mouthY} width={mouthWidth} height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-wide" x={mouthX - 1} y={mouthY + 1} width={mouthWidth} height="1" fill={lowerLipColor} className="pixel" />
        ); break;
      default:
        elements.push(
          <rect key="mouth-upper" x={mouthX} y={mouthY} width={mouthWidth} height="1" fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower" x={mouthX} y={mouthY + 1} width={mouthWidth} height="2" fill={lowerLipColor} className="pixel" />
        );
    }

    switch (actualExpressionType) {
      case 1:
        // ENHANCED SMILE - lift corners and curve mouth
        // Clear the normal mouth first by overwriting with skin color in smile area
        for (let i = 0; i < mouthWidth; i++) {
          elements.push(
            <rect key={`clear-mouth-${i}`} x={mouthX + i} y={mouthY} width="1" height="3" fill={skinTone} className="pixel" />
          );
        }
        
        // Draw curved smile shape
        // Center of mouth stays at normal position
        const smileCurve = [
          { x: -1, y: -1 }, // Left corner lifted
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 4, y: 0 },
          { x: 5, y: -1 }, // Right corner lifted
        ];
        
        // Draw the smile curve
        smileCurve.forEach((point, i) => {
          if (i < mouthWidth + 2) {
            // Upper lip of smile
            elements.push(
              <rect key={`smile-upper-${i}`} x={mouthX - 1 + point.x} y={mouthY + point.y} width="1" height="1" fill={upperLipColor} className="pixel" />
            );
            // Lower lip of smile
            elements.push(
              <rect key={`smile-lower-${i}`} x={mouthX - 1 + point.x} y={mouthY + point.y + 1} width="1" height="1" fill={lowerLipColor} className="pixel" />
            );
          }
        });
        
        // Add dimples at the lifted corners
        elements.push(
          <rect key="dimple-l" x={mouthX - 2} y={mouthY - 1} width="1" height="2" fill={createShadow(skinTone, 0.88)} className="pixel" />,
          <rect key="dimple-r" x={mouthX + mouthWidth + 1} y={mouthY - 1} width="1" height="2" fill={createShadow(skinTone, 0.88)} className="pixel" />
        );
        
        // Add slight cheek lift effect
        elements.push(
          <rect key="cheek-l" x={mouthX - 3} y={mouthY - 2} width="2" height="1" fill={createHighlight(skinTone, 1.05)} className="pixel" />,
          <rect key="cheek-r" x={mouthX + mouthWidth + 1} y={mouthY - 2} width="2" height="1" fill={createHighlight(skinTone, 1.05)} className="pixel" />
        );
        break;
      case 2:
        elements.push(
          <rect key="frown-l" x={mouthX - 1} y={mouthY + 2} width="1" height="1" fill={skinShadow} className="pixel" />,
          <rect key="frown-r" x={mouthX + mouthWidth} y={mouthY + 2} width="1" height="1" fill={skinShadow} className="pixel" />
        );
        // Add deeper frown lines when very tired or sick
        if (isFatigued && isSick) {
          elements.push(
            <rect key="deep-frown-l" x={mouthX - 2} y={mouthY + 3} width="1" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />,
            <rect key="deep-frown-r" x={mouthX + mouthWidth + 1} y={mouthY + 3} width="1" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />
          );
        }
        break;
      case 4:
        elements.push(<rect key="pursed-center" x={mouthX + Math.floor(mouthWidth / 2) - 1} y={mouthY} width="2" height="1" fill={lipShadow} className="pixel" />); break;
    }

    if (lipShape !== 'thin') {
      elements.push(<rect key="lip-highlight" x={mouthX + Math.floor(mouthWidth / 2) - 1} y={mouthY + 1} width="2" height="1" fill={lipHL} className="pixel" />);
    }
    elements.push(<rect key="philtrum" x={mouthX + Math.floor(mouthWidth / 2)} y={mouthY - 2} width="1" height="2" fill={skinShadow} className="pixel" />);
    return <g key="mouth">{elements}</g>;
  }, [appearance.lipShape, headDim.height, headDim.width, headX, headY, lipColor, skinShadow, skinTone, expressionType]);

  // ----- FACIAL HAIR (clean silhouettes, density falloff near edges) -----
  const renderFacialHair = useMemo(() => {
    if (!appearance.facialHair || isFemale) return <g key="facial-hair" />;
    const elements: JSX.Element[] = [];
    const style = appearance.facialHairStyle || 'full_beard';
    const thickness = appearance.facialHairThickness || 'medium';
    const beardColor = hasGrayHair ? 'rgb(192,192,192)' : baseHair;
    const beardShadow = createShadow(beardColor, 0.7);
    const beardHighlight = createHighlight(beardColor, 1.15);

    const baseY = headY + Math.floor(headDim.height * 0.63);
    const mouthY = headY + Math.floor(headDim.height * 0.72);

    // helper: falloff from centerline (softer edges)
    const falloff = (dx: number, max: number) => Math.max(0, 1 - Math.abs(dx) / max);

    const densityBase = thickness === 'thick' ? 0.85 : thickness === 'sparse' ? 0.45 : 0.65;
    const chinWidth = Math.floor(headDim.width * 0.55);

  if (style === 'full_beard') {
      // Full, thick beard covering cheeks, jaw, and chin
      
      // Main beard body - fuller coverage
      for (let y = -2; y < 18; y++) { // Start higher up on cheeks
        const rowY = baseY + y;
        
        // Shape the beard width - wider at jaw, tapers slightly at bottom
        let rowWidth;
        if (y < 2) {
          // Cheek area - narrower
          rowWidth = Math.floor(chinWidth * 0.7);
        } else if (y < 8) {
          // Jaw area - widest
          rowWidth = Math.floor(chinWidth * (0.9 + Math.min(0.2, y / 40)));
        } else {
          // Chin area - slightly tapered
          rowWidth = Math.floor(chinWidth * (1.0 - (y - 8) / 40));
        }
        
        const startX = headX + Math.floor((headDim.width - rowWidth) / 2);

        for (let x = 0; x < rowWidth; x++) {
          // Higher density for fuller appearance
          const centerDist = Math.abs(x - rowWidth / 2) / (rowWidth / 2);
          const density = thickness === 'thick' ? 0.95 : thickness === 'sparse' ? 0.65 : 0.85;
          const prob = density * (1 - centerDist * 0.3); // Less falloff at edges
          
          if (rand(x * 31 + y * 131) < prob) {
            // Color variation for texture
            let col = beardColor;
            if (y < 1) col = beardShadow; // Darker at top blend
            else if (y > 14) col = beardShadow; // Darker at bottom
            else if (rand(x * 7 + y * 13) > 0.8) col = beardHighlight; // Random highlights
            else if (rand(x * 11 + y * 17) < 0.2) col = beardShadow; // Random shadows
            
            elements.push(<rect key={`fb-${x}-${y}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      
      // Sideburns connection - thicker and more prominent
      for (let sy = -6; sy < 5; sy++) {
        const sideWidth = 2; // Wider sideburns
        for (let sx = 0; sx < sideWidth; sx++) {
          const leftX = headX - sx - 1;
          const rightX = headX + headDim.width + sx;
          
          if (rand(sy * 17 + sx * 23) < densityBase * 0.8) {
            const col = sx === 0 ? beardColor : beardShadow;
            elements.push(<rect key={`sb-l-${sy}-${sx}`} x={leftX} y={baseY + sy} width="1" height="1" fill={col} className="pixel" />);
          }
          if (rand((sy + 1) * 19 + sx * 29) < densityBase * 0.8) {
            const col = sx === 0 ? beardColor : beardShadow;
            elements.push(<rect key={`sb-r-${sy}-${sx}`} x={rightX} y={baseY + sy} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    } else if (style === 'goatee' || style === 'van_dyke') {
      // chin patch
      for (let y = 0; y < 7; y++) {
        const width = Math.max(3, 7 - y);
        const startX = headX + Math.floor(headDim.width / 2) - Math.floor(width / 2);
        for (let x = 0; x < width; x++) {
          if (rand(x * 13 + y * 97) < densityBase) {
            elements.push(<rect key={`gt-${x}-${y}`} x={startX + x} y={mouthY + 2 + y} width="1" height="1" fill={y < 2 ? beardColor : beardShadow} className="pixel" />);
          }
        }
      }
      // separate mustache for van dyke; connected for goatee
      const connect = style === 'goatee';
      const my = mouthY - 1;
      for (let t = 0; t < (thickness === 'thick' ? 2 : 1); t++) {
        const w = connect ? 6 : 7;
        const mx = headX + Math.floor(headDim.width / 2) - Math.floor(w / 2);
        for (let i = 0; i < w; i++) {
          if (rand(i * 17 + t * 101) < (densityBase * 0.9)) {
            elements.push(<rect key={`gt-m-${t}-${i}`} x={mx + i} y={my + t} width="1" height="1" fill={i % 3 === 0 ? beardHighlight : beardColor} className="pixel" />);
          }
        }
      }
      if (connect) {
        // thin connector lines at mouth corners
        elements.push(
          <rect key="gt-conn-l" x={headX + Math.floor(headDim.width / 2) - 3} y={mouthY} width="1" height="1" fill={beardShadow} className="pixel" />,
          <rect key="gt-conn-r" x={headX + Math.floor(headDim.width / 2) + 3} y={mouthY} width="1" height="1" fill={beardShadow} className="pixel" />
        );
      }
    } else if (style === 'stubble') {
      for (let y = -1; y < 6; y++) {
        const rowWidth = Math.floor(chinWidth * (0.6 + Math.min(1, (y + 1) / 7)));
        const startX = headX + Math.floor(headDim.width / 2) - Math.floor(rowWidth / 2);
        for (let x = 0; x < rowWidth; x++) {
          if (rand(x * 11 + y * 137) < densityBase * 0.5) {
            elements.push(<rect key={`stb-${x}-${y}`} x={startX + x} y={baseY + y} width="1" height="1" fill={beardShadow} className="pixel" />);
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
      // Standalone mustache
      const my = mouthY - 1;
      for (let t = 0; t < (thickness === 'thick' ? 2 : 1); t++) {
        const w = 8; // Wider than goatee mustache
        const mx = headX + Math.floor(headDim.width / 2) - Math.floor(w / 2);
        for (let i = 0; i < w; i++) {
          if (rand(i * 17 + t * 101) < (densityBase * 0.95)) {
            const col = i % 3 === 1 ? beardHighlight : beardColor;
            elements.push(<rect key={`m-${t}-${i}`} x={mx + i} y={my + t} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      // Add some thickness under the nose
      const centerX = headX + Math.floor(headDim.width / 2);
      for (let dx = -3; dx <= 3; dx++) {
        if (rand(dx * 23) < densityBase * 0.8) {
          elements.push(<rect key={`m-under-${dx}`} x={centerX + dx} y={my - 1} width="1" height="1" fill={beardShadow} className="pixel" />);
        }
      }
    }

    return <g key="facial-hair">{elements}</g>;
  }, [appearance.facialHair, appearance.facialHairStyle, appearance.facialHairThickness, baseHair, hasGrayHair, headDim.height, headDim.width, headX, headY, isFemale]);

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

    const garment = appearance.garment;
    const clothingColor = appearance.palette.primary;
    const clothingShadow = createShadow(clothingColor, 0.7);
    const clothingDeepShadow = createShadow(clothingColor, 0.5);
    const clothingHighlight = createHighlight(clothingColor, 1.2);
    const accentColor = appearance.palette.accent;

    const material = garment.material.toLowerCase();
    const hasSheen = ['silk', 'satin', 'velvet'].includes(material);
    const isRough = ['wool', 'burlap', 'hemp'].includes(material);
    const isMetallic = ['mail', 'plate', 'bronze'].includes(material);

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
        let col = clothingColor;
        const xr = x / (torsoWidth + 6);
        if (xr < 0.15) col = clothingHighlight;
        else if (xr < 0.3) col = createHighlight(clothingColor, 1.1);
        else if (xr > 0.85) col = clothingDeepShadow;
        else if (xr > 0.7) col = clothingShadow;

        if (hasSheen && rand(x + y * 100) > 0.7) col = createHighlight(col, 1.15);
        else if (isRough && rand(x + y * 100) > 0.8) col = createShadow(col, 0.95);
        else if (isMetallic && Math.sin(x * 0.5 + y * 0.3) > 0.3) col = createHighlight(col, 1.25);

        if (isWealthy) {
          if ((x + y) % 12 === 0) col = accentColor;
          else if ((x - y) % 10 === 0) col = appearance.palette.secondary;
          if (isNoble && y > 10 && y < 20 && Math.abs(x - torsoWidth / 2) < 5 && ((x + y) % 4 === 0)) col = '#FFD700';
        }

        if (culturalZone === 'EAST_ASIAN' && y % 8 === 4) col = createShadow(col, 0.9);
        else if (culturalZone === 'SUB_SAHARAN_AFRICAN' && ((x + y) % 6 < 2)) col = accentColor;
        else if (culturalZone === 'SOUTH_ASIAN' && isWealthy && (x % 4 === 2 && y % 4 === 2)) col = '#FFD700';

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
        const name = garment.name.toLowerCase();
        if (name.includes('robe') || name.includes('dress')) {
          for (let cx = 0; cx < collarWidth; cx++) {
            const vDepth = Math.abs(cx - collarWidth / 2) < y * 2;
            if (vDepth) elements.push(<rect key={`collar-v-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={skinTone} className="pixel" />);
          }
        } else if (isWealthy) {
          for (let cx = 0; cx < collarWidth; cx++) {
            elements.push(
              <rect key={`collar-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} width="1" height="1" fill={y === 0 ? accentColor : appearance.palette.secondary} className="pixel" />
            );
          }
        }
      }
    }

    // IMPORTANT: removed the harsh single-pixel "ambient occlusion" stripe that bisected the neck.

    return <g key="body">{elements}</g>;
  }, [appearance.garment, appearance.palette.accent, appearance.palette.primary, appearance.palette.secondary, bodyDim, culturalZone, headDim.height, headDim.width, headX, headY, isNoble, isWealthy, skinShadow, skinTone, stats.strength]);

  // ----- HEADGEAR (from your original, unchanged except for scoping) -----
  const renderHeadgear = useMemo(() => {
    const headgear = appearance.headgear;
    if (!headgear || headgear.name === 'None') return <g key="headgear" />;

    const elements: JSX.Element[] = [];
    const material = headgear.material.toLowerCase();
    const name = headgear.name.toLowerCase();
    
    // Debug logging
    console.log(`[Portrait] Rendering headgear: "${name}" (material: ${material})`)

    // Parse color from name first, fall back to material colors
    let headgearColor = appearance.palette.secondary;
    
    // Check for color descriptors in the name - PRIORITIZE name colors over material
    const colorMap: Record<string, string> = {
      // Basic colors
      'navy': '#000080',
      'red': '#DC143C',
      'crimson': '#DC143C',
      'scarlet': '#FF2400',
      'blue': '#4169E1',
      'azure': '#007FFF',
      'navy': '#000080',
      'green': '#228B22',
      'emerald': '#50C878',
      'forest': '#0B6623',
      'yellow': '#FFD700',
      'gold': '#FFD700',
      'golden': '#FFD700',
      'purple': '#800080',
      'violet': '#8B00FF',
      'indigo': '#4B0082',
      'pink': '#FFC0CB',
      'rose': '#FF007F',
      'orange': '#FF8C00',
      'brown': '#8B4513',
      'tan': '#D2B48C',
      'black': '#1C1C1C',
      'white': '#F8F8F8',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#C0C0C0',
      // Compound colors
      'silver-white': '#E8E8E8',
      'golden-brown': '#B8860B',
      'dark brown': '#654321',
      'light brown': '#A0826D',
      'dark green': '#006400',
      'light green': '#90EE90',
      'dark blue': '#00008B',
      'light blue': '#ADD8E6',
      'orchid': '#DA70D6',
      'ruby': '#E0115F',
      'sapphire': '#0F52BA',
      'amethyst': '#9966CC',
      'jade': '#00A86B',
      'ivory': '#FFFFF0',
      'pearl': '#FFF8DC',
      'obsidian': '#0C0C0C',
      'copper': '#B87333',
      'bronze': '#CD7F32',
      'brass': '#B5A642',
      'platinum': '#E5E4E2',
    };
    
    // Check if any color name appears in the headgear name
    let colorFound = false;
    for (const [colorName, colorHex] of Object.entries(colorMap)) {
      if (name.includes(colorName)) {
        headgearColor = colorHex;
        colorFound = true;
        break;
      }
    }
    
    // ONLY use material colors as fallback if NO color found in name
    if (!colorFound) {
      // Material fallbacks - only apply if no color specified
      if (material.includes('leather')) headgearColor = '#8B4513';
      else if (material.includes('metal')) headgearColor = '#C0C0C0';
      else if (material.includes('gold')) headgearColor = '#FFD700';
      else if (material.includes('silk')) headgearColor = appearance.palette.accent;
      else if (material.includes('straw')) headgearColor = '#F4E68C';
      else if (material.includes('felt')) headgearColor = '#708090';
      else if (material.includes('velvet')) headgearColor = '#4B0082';
      else if (material.includes('cotton')) headgearColor = '#F5F5DC';
      else if (material.includes('wool')) headgearColor = '#D3D3D3';
      else if (material.includes('linen')) headgearColor = '#FAF0E6';
    }

    const centerX = headX + headDim.width / 2;
    
    // Helper function to check if name contains any of the keywords
    const nameContains = (...keywords: string[]) => {
      return keywords.some(keyword => name.includes(keyword));
    };

    // Check if headgear has jewels or diamonds in name
    const hasJewels = nameContains('jewel', 'jeweled', 'jewelled', 'diamond', 'gem', 'gemstone', 'ruby', 'emerald', 'sapphire', 'pearl');
    
    // CROWNS, CIRCLETS, TIARAS, CORONETS, DIADEMS
    if (nameContains('crown', 'circlet', 'tiara', 'coronet', 'diadem', 'laurel wreath')) {
      const crownStyle = (isNoble || hasJewels) ? 'ornate' : 'simple';
      if (crownStyle === 'ornate') {
        for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
          elements.push(
            <rect key={`crown-band-${x}`} x={x} y={headY - 2} width="1" height="3" fill="#FFD700" className="pixel" />
          );
          if ((x - headX) % 4 === 2) {
            // Use different jewel colors based on name
            let jewelColor = "#DC143C"; // Default ruby
            if (name.includes('diamond')) jewelColor = "#E0FFFF";
            else if (name.includes('emerald')) jewelColor = "#50C878";
            else if (name.includes('sapphire')) jewelColor = "#0F52BA";
            else if (name.includes('pearl')) jewelColor = "#FFF8DC";
            
            elements.push(
              <rect key={`crown-jewel-band-${x}`} x={x} y={headY - 1} width="1" height="1" fill={jewelColor} className="pixel" />
            );
          }
        }
        for (let i = 0; i < 5; i++) {
          const pointX = headX + 2 + i * Math.floor(headDim.width / 5);
          const pointHeight = i === 2 ? 8 : i === 1 || i === 3 ? 6 : 4;
          for (let h = 0; h < pointHeight; h++) {
            elements.push(
              <rect key={`crown-point-${i}-${h}`} x={pointX} y={headY - 2 - h} width="2" height="1" fill="#FFD700" className="pixel" />
            );
          }
          elements.push(
            <rect key={`crown-top-jewel-${i}`} x={pointX} y={headY - 2 - pointHeight} width="2" height="1" fill={i === 2 ? "#4169E1" : "#DC143C"} className="pixel" />
          );
        }
      } else {
        for (let x = headX; x < headX + headDim.width; x++) {
          const height = Math.abs(x - centerX) < 2 ? 5 : 3;
          for (let h = 0; h < height; h++) {
            elements.push(
              <rect key={`crown-simple-${x}-${h}`} x={x} y={headY - 2 - h} width="1" height="1" fill={headgearColor} className="pixel" />
            );
          }
        }
      }
    // TURBANS, PAGRI, SAFA
    } else if (nameContains('turban', 'pagri', 'safa', 'peta')) {
      const turbanLayers = isWealthy ? 3 : 2;
      for (let layer = 0; layer < turbanLayers; layer++) {
        const layerSize = 6 - layer;
        for (let y = -4 - layer; y < 7 - layer; y++) {
          for (let x = -layerSize; x < layerSize; x++) {
            const dist = Math.sqrt(x * x + (y * 0.8) * (y * 0.8));
            if (dist < layerSize) {
              const wrapPattern = (x + y + layer) % 3 === 0;
              const color = wrapPattern ? createShadow(headgearColor, 0.85) : headgearColor;
              elements.push(<rect key={`turban-${layer}-${x}-${y}`} x={centerX + x} y={headY + y} width="1" height="1" fill={color} className="pixel" />);
            }
          }
        }
      }
      if (isWealthy) {
        elements.push(
          <rect key="turban-jewel-setting" x={centerX - 2} y={headY - 1} width="4" height="3" fill="#FFD700" className="pixel" />,
          <rect key="turban-jewel-center" x={centerX - 1} y={headY} width="2" height="1" fill="#DC143C" className="pixel" />
        );
        for (let f = 0; f < 8; f++) {
          elements.push(
            <rect key={`turban-feather-${f}`} x={centerX + 5 + Math.floor(f / 4)} y={headY - 8 + f} width="1" height="1" fill={f % 2 === 0 ? "#228B22" : "#32CD32"} className="pixel" />
          );
        }
      }
    // VEILS, WRAPS, COVERINGS (hijab, keffiyeh, dupatta, etc)
    } else if (nameContains('veil', 'hijab', 'keffiyeh', 'dupatta', 'gele', 'mantilla', 'ghoonghat', 'head cloth', 'head cover', 'head wrap', 'headwrap', 'kerchief', 'scarf', 'coif', 'bonnet')) {
      const isFullCovering = nameContains('hijab', 'dupatta', 'gele', 'mantilla', 'ghoonghat');
      const coverageDepth = isFullCovering ? 12 : 8;
      
      // Render as draped fabric with varying coverage
      for (let y = headY - 4; y < headY + coverageDepth; y++) {
        for (let x = headX - 5; x < headX + headDim.width + 5; x++) {
          const distFromCenter = Math.abs(x - centerX);
          const faceArea = y > headY && y < headY + headDim.height - 2 && distFromCenter < headDim.width / 2 - 1;
          
          if (!faceArea && distFromCenter < headDim.width / 2 + 4) {
            const foldPattern = Math.sin(y * 0.3) * 2;
            const shadowed = (y - headY) % 3 === 0 || distFromCenter > headDim.width / 2 + 2;
            elements.push(<rect key={`veil-${x}-${y}`} x={x} y={y} width="1" height="1" fill={shadowed ? createShadow(headgearColor, 0.85) : headgearColor} className="pixel" />);
          }
        }
      }
      // Add decorative edge for wealthy characters
      if (isWealthy) {
        for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
          if (Math.abs(x - centerX) > headDim.width / 2 - 2) {
            elements.push(<rect key={`veil-edge-${x}`} x={x} y={headY + coverageDepth - 1} width="1" height="1" fill="#FFD700" className="pixel" />);
          }
        }
      }
    // HOODS, WIMPLES
    } else if (nameContains('hood', 'wimple')) {
      const hoodDepth = name.includes('wimple') ? 12 : 10;
      
      // Enhanced hood with better depth and shadowing
      for (let y = headY - 6; y < headY + hoodDepth; y++) {
        for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
          const distFromCenter = Math.abs(x - centerX);
          const distFromTop = y - (headY - 6);
          
          // Create hood opening shape - narrower at top, wider at bottom
          const hoodWidth = headDim.width / 2 + 2 + Math.min(4, distFromTop * 0.3);
          const faceArea = y > headY && y < headY + headDim.height - 2 && distFromCenter < headDim.width / 2 - 1;
          
          if (!faceArea && distFromCenter < hoodWidth) {
            // Create depth with multiple shadow layers
            const depthFromEdge = hoodWidth - distFromCenter;
            const isDeepShadow = depthFromEdge < 2 || y < headY - 2;
            const isMidShadow = depthFromEdge < 4 || distFromTop < 3;
            
            // Add fold patterns for realism
            const foldPattern = Math.sin((y + x * 0.5) * 0.3) * 1.5;
            const hasFold = Math.abs(foldPattern) > 1;
            
            let pixelColor = headgearColor;
            if (isDeepShadow || hasFold) {
              pixelColor = createShadow(headgearColor, 0.7);
            } else if (isMidShadow) {
              pixelColor = createShadow(headgearColor, 0.85);
            }
            
            // Inner hood lining shadow for depth
            if (distFromCenter > hoodWidth - 2 && y > headY - 2) {
              pixelColor = createShadow(headgearColor, 0.6);
            }
            
            elements.push(<rect key={`hood-${x}-${y}`} x={x} y={y} width="1" height="1" fill={pixelColor} className="pixel" />);
          }
        }
      }
      
      // Add inner shadow rim for more depth
      for (let y = headY - 2; y < headY + headDim.height; y++) {
        const rimX = headX - 4;
        const rimX2 = headX + headDim.width + 3;
        elements.push(
          <rect key={`hood-rim-l-${y}`} x={rimX} y={y} width="1" height="1" fill={createShadow(headgearColor, 0.5)} className="pixel" />,
          <rect key={`hood-rim-r-${y}`} x={rimX2} y={y} width="1" height="1" fill={createShadow(headgearColor, 0.5)} className="pixel" />
        );
      }
      if (isWealthy) {
        for (let y = headY + 2; y < headY + headDim.height - 2; y++) {
          const trimX = headX + Math.floor((headDim.width - 2) * (1 - (y - headY) / headDim.height));
          elements.push(
            <rect key={`hood-trim-l-${y}`} x={trimX - 1} y={y} width="1" height="1" fill="#FFD700" className="pixel" />,
            <rect key={`hood-trim-r-${y}`} x={headX + headDim.width - trimX + headX + 1} y={y} width="1" height="1" fill="#FFD700" className="pixel" />
          );
        }
      }
    // HATS AND CAPS (expanded categories)
    } else if (nameContains('hat', 'cap', 'beret', 'fez', 'fedora', 'homburg', 'chullo', 'kufi', 'gandhi', 'topi', 'pith', 'snapback', 'petasos', 'chaperon', 'barbette')) {
      const hatStyle = name.includes('top') ? 'top' : 
                      name.includes('beret') ? 'beret' : 
                      name.includes('fez') || name.includes('kufi') ? 'fez' : 
                      nameContains('fedora', 'homburg', 'pith') ? 'brimmed' :
                      nameContains('chullo') ? 'knit' :
                      'generic';
      switch (hatStyle) {
        case 'top':
          for (let y = headY - 10; y < headY - 2; y++) {
            for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
              elements.push(<rect key={`tophat-crown-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" className="pixel" />);
            }
          }
          for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
            elements.push(<rect key={`tophat-brim-${x}`} x={x} y={headY - 2} width="1" height="2" fill="#000000" className="pixel" />);
          }
          if (isWealthy) {
            for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
              elements.push(<rect key={`tophat-band-${x}`} x={x} y={headY - 5} width="1" height="1" fill={appearance.palette.accent} className="pixel" />);
            }
          }
          break;
        case 'beret':
          for (let y = headY - 3; y < headY + 4; y++) {
            for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const beretShape = distFromCenter < headDim.width / 2 + 3 - Math.abs(y - headY);
              if (beretShape) {
                const tilt = x > centerX ? -1 : 0;
                elements.push(<rect key={`beret-${x}-${y}`} x={x} y={y + tilt} width="1" height="1" fill={headgearColor} className="pixel" />);
              }
            }
          }
          break;
        case 'fez':
          for (let y = headY - 6; y < headY + 1; y++) {
            for (let x = headX + 3; x < headX + headDim.width - 3; x++) {
              elements.push(<rect key={`fez-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#8B0000" className="pixel" />);
            }
          }
          for (let t = 0; t < 4; t++) {
            elements.push(<rect key={`fez-tassel-${t}`} x={centerX} y={headY - 6 - t} width="1" height="1" fill="#000000" className="pixel" />);
          }
          break;
        case 'brimmed':
          // Fedora/Homburg style with brim
          for (let y = headY - 5; y < headY; y++) {
            for (let x = headX; x < headX + headDim.width; x++) {
              elements.push(<rect key={`fedora-crown-${x}-${y}`} x={x} y={y} width="1" height="1" fill={headgearColor} className="pixel" />);
            }
          }
          // Wide brim
          for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
            elements.push(<rect key={`fedora-brim-${x}`} x={x} y={headY} width="1" height="1" fill={createShadow(headgearColor, 0.85)} className="pixel" />);
          }
          break;
        case 'knit':
          // Chullo/knit cap with ear flaps
          for (let y = headY - 6; y < headY + 2; y++) {
            for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
              const knit = (x + y) % 2 === 0;
              elements.push(<rect key={`knit-${x}-${y}`} x={x} y={y} width="1" height="1" fill={knit ? headgearColor : createShadow(headgearColor, 0.9)} className="pixel" />);
            }
          }
          break;
        default:
          // Better cap rendering - proper baseball cap style
          // Crown of cap (rounded top)
          for (let y = 0; y < 7; y++) {
            const width = y < 3 ? headDim.width - 2 + y : headDim.width + 2;
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              // Add slight rounding at top
              if (y === 0 && (x === 0 || x === width - 1)) continue;
              elements.push(
                <rect key={`cap-crown-${y}-${x}`} x={startX + x} y={headY - 6 + y} width="1" height="1" fill={headgearColor} className="pixel" />
              );
            }
          }
          
          // Visor/brim (always present on caps)
          for (let y = 0; y < 2; y++) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(
                <rect key={`cap-visor-${y}-${x}`} x={x} y={headY + y} width="1" height="1" fill={createShadow(headgearColor, 0.75)} className="pixel" />
              );
            }
          }
          
          // Button on top
          elements.push(
            <rect key="cap-button" x={centerX - 1} y={headY - 7} width="2" height="1" fill={createShadow(headgearColor, 0.85)} className="pixel" />
          );
      }
    // HAIR ORNAMENTS AND DECORATIONS
    } else if (nameContains('flower', 'garland', 'lei', 'hairpiece', 'hairpin', 'tikka', 'maang', 'passa', 'rakhdi', 'sheesh', 'comb', 'hair')) {
      // Render decorative elements in hair
      if (nameContains('flower', 'garland', 'lei')) {
        // Flowers in hair
        for (let i = 0; i < 3; i++) {
          const flowerX = headX + 2 + i * Math.floor(headDim.width / 3);
          const flowerY = headY - 2;
          // Flower petals
          elements.push(
            <rect key={`flower-${i}-c`} x={flowerX} y={flowerY} width="2" height="2" fill="#FF69B4" className="pixel" />,
            <rect key={`flower-${i}-l`} x={flowerX - 1} y={flowerY} width="1" height="1" fill="#FFB6C1" className="pixel" />,
            <rect key={`flower-${i}-r`} x={flowerX + 2} y={flowerY} width="1" height="1" fill="#FFB6C1" className="pixel" />,
            <rect key={`flower-${i}-t`} x={flowerX} y={flowerY - 1} width="2" height="1" fill="#FFB6C1" className="pixel" />
          );
        }
      } else if (nameContains('tikka', 'maang', 'passa')) {
        // Forehead jewelry
        elements.push(
          <rect key="tikka-chain" x={centerX - 1} y={headY - 1} width="2" height="1" fill="#FFD700" className="pixel" />,
          <rect key="tikka-pendant" x={centerX - 1} y={headY + 2} width="2" height="2" fill="#DC143C" className="pixel" />
        );
      } else if (nameContains('comb', 'hairpin')) {
        // Decorative comb/pin
        const combX = headX + headDim.width - 3;
        elements.push(
          <rect key="comb-base" x={combX} y={headY - 2} width="3" height="1" fill={material.includes('jewel') ? '#FFD700' : '#C0C0C0'} className="pixel" />
        );
        if (material.includes('jewel')) {
          elements.push(<rect key="comb-jewel" x={combX + 1} y={headY - 3} width="1" height="1" fill="#DC143C" className="pixel" />);
        }
      }
    // HEADBANDS AND BANDS
    } else if (nameContains('headband', 'band', 'fascinator', 'hennin')) {
      // Simple band across forehead
      for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
        elements.push(<rect key={`band-${x}`} x={x} y={headY} width="1" height="2" fill={headgearColor} className="pixel" />);
      }
      if (material.includes('jewel') || material.includes('pearl')) {
        // Add jewels/decorations
        for (let i = 0; i < 3; i++) {
          const jewelX = headX + 2 + i * Math.floor((headDim.width - 2) / 3);
          elements.push(<rect key={`band-jewel-${i}`} x={jewelX} y={headY} width="1" height="1" fill="#DC143C" className="pixel" />);
        }
      }
      if (nameContains('feather')) {
        // Add feathers
        for (let f = 0; f < 5; f++) {
          elements.push(<rect key={`feather-${f}`} x={centerX + 3} y={headY - 2 - f} width="1" height="1" fill={f % 2 === 0 ? "#8B4513" : "#D2691E"} className="pixel" />);
        }
      }
    // HELMETS
    } else if (nameContains('helmet')) {
      const helmetMaterial = material.includes('plate') ? '#C0C0C0' : material.includes('bronze') ? '#CD7F32' : '#A0A0A0';
      for (let y = headY - 4; y < headY + headDim.height - 2; y++) {
        for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
          const distFromCenter = Math.abs(x - centerX);
          const faceArea = y > headY + 2 && y < headY + headDim.height - 4 && distFromCenter < headDim.width / 2 - 3;
          if (!faceArea) {
            const edgeHighlight = distFromCenter < 2 || x === headX - 2;
            elements.push(<rect key={`helmet-${x}-${y}`} x={x} y={y} width="1" height="1" fill={edgeHighlight ? createHighlight(helmetMaterial, 1.3) : helmetMaterial} className="pixel" />);
          }
        }
      }
      if (name.includes('norman') || name.includes('knight')) {
               for (let y = headY + 2; y < headY + 10; y++) {
          elements.push(<rect key={`nose-guard-${y}`} x={centerX} y={y} width="2" height="1" fill={helmetMaterial} className="pixel" />);
        }
      }
      if (isNoble) {
        for (let p = 0; p < 10; p++) {
          const plumeX = centerX + Math.sin(p * 0.3) * 2;
          elements.push(<rect key={`plume-${p}`} x={plumeX} y={headY - 5 - p} width="2" height="1" fill={p % 2 === 0 ? "#DC143C" : "#8B0000"} className="pixel" />);
        }
      }
    // SUNGLASSES (modern touch)
    } else if (nameContains('sunglasses', 'glasses', 'spectacles')) {
      // Render sunglasses
      const eyeY = headY + Math.floor(headDim.height * 0.35);
      const leftLensX = headX + Math.floor(headDim.width * 0.25) - 2;
      const rightLensX = headX + Math.floor(headDim.width * 0.75) - 2;
      
      // Lenses
      for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 3; y++) {
          elements.push(
            <rect key={`lens-l-${x}-${y}`} x={leftLensX + x} y={eyeY + y} width="1" height="1" fill="#000000" opacity="0.8" className="pixel" />,
            <rect key={`lens-r-${x}-${y}`} x={rightLensX + x} y={eyeY + y} width="1" height="1" fill="#000000" opacity="0.8" className="pixel" />
          );
        }
      }
      // Bridge
      for (let x = leftLensX + 4; x < rightLensX; x++) {
        elements.push(<rect key={`bridge-${x}`} x={x} y={eyeY + 1} width="1" height="1" fill="#333333" className="pixel" />);
      }
    // STRAW HAT - Wide brimmed agricultural hat
    } else if (nameContains('straw', 'rice hat', 'conical', 'bamboo hat', 'sedge hat')) {
      // Much larger, more visible straw hat
      const strawColor = '#D4A76A'; // More visible wheat/straw color
      const darkStraw = createShadow(strawColor, 0.8);
      
      // VERY wide and thick brim - make it super obvious
      // First layer - outermost brim
      for (let x = headX - 16; x < headX + headDim.width + 16; x++) {
        elements.push(
          <rect key={`straw-brim-outer-${x}`} x={x} y={headY + 2} width="1" height="1" fill={darkStraw} className="pixel" />
        );
      }
      
      // Second layer - main brim (thicker)
      for (let x = headX - 14; x < headX + headDim.width + 14; x++) {
        elements.push(
          <rect key={`straw-brim-main-${x}`} x={x} y={headY + 1} width="1" height="2" fill={strawColor} className="pixel" />
        );
      }
      
      // Third layer - inner brim with texture
      for (let x = headX - 12; x < headX + headDim.width + 12; x++) {
        const isWeave = x % 3 === 0;
        elements.push(
          <rect key={`straw-brim-inner-${x}`} x={x} y={headY} width="1" height="2" fill={isWeave ? darkStraw : strawColor} className="pixel" />
        );
      }
      
      // Larger, more prominent conical crown
      for (let y = 0; y < 14; y++) {
        const width = Math.floor((14 - y) * 2.5);
        const startX = centerX - Math.floor(width / 2);
        for (let x = 0; x < width; x++) {
          // Add woven texture
          const isWeave = (x + y) % 2 === 0;
          const color = isWeave ? strawColor : darkStraw;
          elements.push(
            <rect key={`straw-crown-${y}-${x}`} x={startX + x} y={headY - 12 + y} width="1" height="1" fill={color} className="pixel" />
          );
        }
      }
      
      // Strong shadow under brim for depth
      for (let x = headX - 8; x < headX + headDim.width + 8; x++) {
        elements.push(
          <rect key={`straw-shadow-${x}`} x={x} y={headY + 3} width="1" height="2" fill={createShadow(skinTone, 0.6)} className="pixel" />
        );
      }
    // DEFAULT FALLBACK - Better generic hat/cap
    } else {
      // Check if it's meant to be a hat based on name
      const isHat = nameContains('hat', 'cap', 'beret', 'beanie', 'bonnet');
      
      if (isHat || material.includes('felt') || material.includes('wool')) {
        // Render a better hat shape
        // Crown
        for (let y = 0; y < 6; y++) {
          const width = headDim.width - Math.floor(y / 2);
          const startX = headX + Math.floor((headDim.width - width) / 2);
          for (let x = 0; x < width; x++) {
            elements.push(
              <rect key={`hat-crown-${y}-${x}`} x={startX + x} y={headY - 5 + y} width="1" height="1" fill={headgearColor} className="pixel" />
            );
          }
        }
        // Small brim if it's a hat
        if (nameContains('hat')) {
          for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
            elements.push(
              <rect key={`hat-brim-${x}`} x={x} y={headY + 1} width="1" height="1" fill={createShadow(headgearColor, 0.8)} className="pixel" />
            );
          }
        }
      } else {
        // Simple headband or cloth
        elements.push(<rect key="default-band" x={headX - 1} y={headY - 1} width={headDim.width + 2} height="3" fill={headgearColor} className="pixel" />);
      }
      
      // Add jewels if mentioned in name for any generic headgear
      if (hasJewels) {
        const jewelX = centerX - 1;
        let jewelColor = "#DC143C";
        if (name.includes('diamond')) jewelColor = "#E0FFFF";
        else if (name.includes('emerald')) jewelColor = "#50C878";
        else if (name.includes('sapphire')) jewelColor = "#0F52BA";
        else if (name.includes('pearl')) jewelColor = "#FFF8DC";
        elements.push(
          <rect key="default-jewel-center" x={jewelX} y={headY - 2} width="2" height="2" fill={jewelColor} className="pixel" />,
          <rect key="default-jewel-sparkle1" x={jewelX - 1} y={headY - 2} width="1" height="1" fill="#FFFFFF" opacity="0.6" className="pixel" />,
          <rect key="default-jewel-sparkle2" x={jewelX + 2} y={headY - 2} width="1" height="1" fill="#FFFFFF" opacity="0.6" className="pixel" />
        );
      }
    }

    return <g key="headgear">{elements}</g>;
  }, [appearance.headgear, isNoble, isWealthy, headDim.width, headX, headY, appearance.palette]);

  // ----- JEWELRY -----
  const renderJewelry = useMemo(() => {
    if (!appearance.jewelry || appearance.jewelry.length === 0) return <g key="jewelry" />;
    const elements: JSX.Element[] = [];

    appearance.jewelry.forEach((piece, index) => {
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
  }, [appearance.jewelry, headDim.height, headDim.width, headX, headY, isWealthy]);

  // ----- MARKINGS -----
  const renderMarkings = useMemo(() => {
    if (!appearance.markings || appearance.markings.length === 0) return <g key="markings" />;
    const elements: JSX.Element[] = [];

    appearance.markings.forEach((marking, index) => {
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
  }, [appearance.markings, culturalZone, headDim.height, headDim.width, headX, headY, skinTone, skinHighlight]);

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

