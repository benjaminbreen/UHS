
import React, { useMemo } from 'react';

interface ProceduralPortraitProps {
  character: {
    age?: number;
    gender: 'Male' | 'Female' | 'Non-binary';
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
}

type AgeGroup = 'young' | 'adult' | 'old';

const ProceduralPortrait: React.FC<ProceduralPortraitProps> = ({ 
  character, 
  size = 192,
  className = ''
}) => {
  // Seeded random number generator
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate a default seed from character data if portraitSeed is not provided
  const generateDefaultSeed = () => {
    if (character.portraitSeed !== undefined && character.portraitSeed !== null) {
      return character.portraitSeed;
    }
    
    // Create a seed from character properties
    let seedString = '';
    seedString += character.age || 30;
    seedString += character.gender || 'Male';
    seedString += character.stats?.strength || 5;
    seedString += character.stats?.intelligence || 5;
    seedString += character.appearance?.skinColor || '#f4d1ae';
    
    // Convert string to number
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) || 12345;
  };

  const seed = generateDefaultSeed();
  const rand = (offset: number = 0) => seededRandom(seed + offset);

  // Extract character data with defaults
  const { age = 30, gender, stats, appearance, wealthLevel, era, culturalZone = 'EUROPEAN' } = character;
  const isFemale = gender === 'Female';
  const isWealthy = wealthLevel === 'wealthy' || wealthLevel === 'noble';
  const isNoble = wealthLevel === 'noble';

  // Age determination
  const getAgeGroup = (): AgeGroup => {
    if (age >= 60) return 'old';
    if (age >= 25) return 'adult';
    return 'young';
  };
  const ageGroup = getAgeGroup();
  const isYoung = ageGroup === 'young';
  const isOld = ageGroup === 'old';
  const hasWrinkles = isOld && rand(200) > 0.2;
  const hasGrayHair = isOld && rand(201) > 0.3;
  const hasAgeSpots = isOld && rand(202) > 0.5;

  // Gaze direction (90% center, 5% left, 5% right)
  const gazeRoll = rand(51);
  const gazeDirection = gazeRoll > 0.95 ? 2 : gazeRoll > 0.9 ? 0 : 1;

  // Expression based on stats
  let expressionType = Math.floor(rand(52) * 5);
  let microExpression = Math.floor(rand(53) * 3);
  
  if (stats.charisma >= 8) {
    expressionType = 1; // Confident smile
    microExpression = 1; // Bright eyes
  } else if (stats.charisma <= 2) {
    expressionType = 3; // Withdrawn
    microExpression = 2; // Downcast eyes
  } else if (stats.intelligence >= 8) {
    expressionType = 4; // Thoughtful
    microExpression = 0; // Focused eyes
  }

  // Color utilities
  const createShadow = (color: string, amount: number = 0.8): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `#${Math.floor(r * amount).toString(16).padStart(2, '0')}${Math.floor(g * amount).toString(16).padStart(2, '0')}${Math.floor(b * amount).toString(16).padStart(2, '0')}`;
  };

  const createHighlight = (color: string, amount: number = 1.2): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * amount));
    const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * amount));
    const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const createComplementaryShadow = (color: string, amount: number = 0.7): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Add subtle blue/purple tint to shadows for realism
    const shadowR = Math.floor(r * amount * 0.85);
    const shadowG = Math.floor(g * amount * 0.90);
    const shadowB = Math.floor(Math.min(255, b * amount + 25));
    
    return `rgb(${shadowR}, ${shadowG}, ${shadowB})`;
  };

  const createSubsurfaceScattering = (color: string, intensity: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Simulate light passing through skin (reddish glow)
    const scatteredR = Math.min(255, Math.floor(r + (255 - r) * intensity * 0.8));
    const scatteredG = Math.min(255, Math.floor(g + (255 - g) * intensity * 0.6));
    const scatteredB = Math.min(255, Math.floor(b + (255 - b) * intensity * 0.4));
    
    return `#${scatteredR.toString(16).padStart(2, '0')}${scatteredG.toString(16).padStart(2, '0')}${scatteredB.toString(16).padStart(2, '0')}`;
  };

  // Get color temperature for better shadows
  const getColorTemperature = (color: string): 'warm' | 'cool' | 'neutral' => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const warmth = (r - b) / 255;
    if (warmth > 0.1) return 'warm';
    if (warmth < -0.1) return 'cool';
    return 'neutral';
  };

  // Head dimensions based on face shape
  const headDim = useMemo(() => {
    let width = isFemale ? 22 : 26;
    let height = isFemale ? 28 : 30;
    
    // Age modifications
    if (isYoung) {
      width += 2;
      height -= 1;
    }
    if (isOld) {
      height += 3;
      width -= 1;
    }
    
    // Stats modifications
    if (stats.strength >= 8) {
      width += isFemale ? 1 : 3;
    } else if (stats.strength <= 3) {
      width -= isFemale ? 0 : 2;
    }
    
    // Build modifications
    if (appearance.build === 'imposing') width += 2;
    if (appearance.build === 'slight') width -= 2;
    
    // Face shape modifications
    const faceShape = appearance.faceShape || 'oval';
    switch (faceShape) {
      case 'round': 
        width += 2; 
        height -= 2; 
        break;
      case 'square': 
        if (!isFemale) width += 1; 
        break;
      case 'long': 
        width -= 1; 
        height += 3; 
        break;
      case 'heart': 
        // Wider at top
        break;
      case 'diamond':
        // Wider at cheekbones
        break;
    }
    
    return { width, height, shape: faceShape };
  }, [isFemale, isYoung, isOld, stats.strength, appearance.build, appearance.faceShape]);

  const headX = 32 - (headDim.width / 2);
  const headY = 12;

  // Enhanced color palette based on skin tone
  const skinTone = appearance.skinColor;
  const skinToneType = appearance.skinTone || 'medium';
  const skinTemperature = getColorTemperature(skinTone);
  
  const skinShadow = createComplementaryShadow(skinTone);
  const skinDeepShadow = createComplementaryShadow(skinTone, 0.5);
  const skinHighlight = createHighlight(skinTone, 1.15);
  const skinBrightHighlight = createHighlight(skinTone, 1.3);
  const skinMidtone = createShadow(skinTone, 0.95);
  const skinSubsurface = createSubsurfaceScattering(skinTone);
  const outlineColor = createShadow(skinTone, 0.45);

  const hairColor = hasGrayHair ? '#C0C0C0' : appearance.hairColor;
  const hairShadow = createComplementaryShadow(hairColor, 0.6);
  const hairDeepShadow = createComplementaryShadow(hairColor, 0.4);
  const hairHighlight = createHighlight(hairColor, 1.5);
  const hairBrightHighlight = createHighlight(hairColor, 1.8);

  // Lip color determination
  const getLipColor = () => {
    if (appearance.lipColor) return appearance.lipColor;
    
    // Natural lip colors based on skin tone
    const baseLipColors = {
      'very_pale': '#E8B4B8',
      'pale': '#E0A5A8',
      'fair': '#D89598',
      'light': '#CE8588',
      'medium': '#C47578',
      'olive': '#BA6568',
      'tan': '#B05558',
      'dark': '#A64548',
      'very_dark': '#9C3538'
    };
    
    const baseColor = baseLipColors[skinToneType] || '#C47578';
    
    // Modify for gender and wealth
    if (isFemale && isWealthy) {
      return createHighlight(baseColor, 1.2); // Richer color for wealthy women
    }
    
    return baseColor;
  };

  const lipColor = getLipColor();

  // Body dimensions with more variation
  const getBodyDimensions = () => {
    const baseHeadWidth = isFemale ? 22 : 26;
    let strengthMod = 1;
    
    if (stats.strength >= 9) strengthMod = 1.25;
    else if (stats.strength >= 7) strengthMod = 1.15;
    else if (stats.strength <= 2) strengthMod = 0.85;
    else if (stats.strength <= 4) strengthMod = 0.95;
    
    let shoulderMod = strengthMod;
    if (isYoung) shoulderMod *= 0.85;
    if (isOld) shoulderMod *= 0.95;
    
    // Build influences
    switch (appearance.build) {
      case 'athletic':
        shoulderMod *= 1.1;
        break;
      case 'slight':
        shoulderMod *= 0.9;
        break;
      case 'imposing':
        shoulderMod *= 1.2;
        break;
      case 'stocky':
        shoulderMod *= 1.15;
        break;
    }
    
    if (isFemale) {
      return { 
        shoulderWidth: Math.floor(baseHeadWidth * 1.5 * shoulderMod),
        chestWidth: Math.floor(baseHeadWidth * 1.3 * shoulderMod),
        waistWidth: Math.floor(baseHeadWidth * 1.1),
        hipWidth: Math.floor(baseHeadWidth * 1.45),
        armWidth: stats.strength >= 7 ? 5 : 4
      };
    } else {
      const shoulderWidth = Math.floor(baseHeadWidth * 2.1 * shoulderMod);
      const chestWidth = Math.floor(shoulderWidth * 0.92);
      
      return { 
        shoulderWidth,
        chestWidth,
        waistWidth: Math.floor(chestWidth * 0.85),
        hipWidth: Math.floor(chestWidth * 0.9),
        armWidth: stats.strength >= 7 ? 7 : 6
      };
    }
  };

  const bodyDim = getBodyDimensions();

  // Enhanced background with cultural influences
  const renderBackground = () => {
    const isDarkSkin = ['dark', 'very_dark'].includes(skinToneType);
    const isMediumSkin = ['medium', 'olive', 'tan'].includes(skinToneType);
    
    // Cultural background colors
    const culturalBackgrounds = {
      'EUROPEAN': isDarkSkin ? ['#FFF8DC', '#FFEFD5'] : ['#B0E0E6', '#87CEEB'],
      'EAST_ASIAN': isDarkSkin ? ['#FFE4E1', '#FFF0F5'] : ['#E0E0E0', '#D3D3D3'],
      'MENA': ['#F4E4C1', '#E4D4A1'],
      'SOUTH_ASIAN': ['#FFE5CC', '#FFD4B3'],
      'SUB_SAHARAN_AFRICAN': ['#F5DEB3', '#FFE4B5'],
      'SOUTH_AMERICAN': ['#DEB887', '#D2B48C'],
      'NORTH_AMERICAN_PRE_COLUMBIAN': ['#CD853F', '#D2B48C'],
      'OCEANIA': ['#FFE4B5', '#FFDEAD']
    };
    
    const [bgColor1, bgColor2] = culturalBackgrounds[culturalZone] || culturalBackgrounds['EUROPEAN'];
    
    return (
      <>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bgColor1} />
          <stop offset="50%" stopColor={createHighlight(bgColor1, 0.95)} />
          <stop offset="100%" stopColor={bgColor2} />
        </linearGradient>
        <filter id="texture">
          <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed={seed} />
          <feComposite operator="over" in2="noise" />
        </filter>
      </>
    );
  };

  // Enhanced head rendering with face shape variations
  const renderHead = () => {
    const elements = [];
    const faceShape = appearance.faceShape || 'oval';
    const jawline = appearance.jawline || 'soft';
    
    // Face shape multipliers
    for (let y = 0; y < headDim.height; y++) {
      const relativeY = y / headDim.height;
      let widthMultiplier = 1;
      
      switch (faceShape) {
        case 'oval':
          widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY)) * Math.PI) * 0.92 + 0.08;
          break;
        case 'round':
          const roundness = Math.sqrt(Math.max(0, 1 - Math.pow((relativeY - 0.5) * 2, 2)));
          widthMultiplier = roundness * 0.94 + 0.06;
          break;
        case 'square':
          if (relativeY < 0.15) {
            widthMultiplier = 0.65 + relativeY * 2.3;
          } else if (relativeY > 0.8) {
            widthMultiplier = jawline === 'square' ? 0.95 : 0.9;
          } else {
            widthMultiplier = 1.02;
          }
          break;
        case 'long':
          widthMultiplier = Math.sin(Math.max(0, Math.min(1, relativeY)) * Math.PI) * 0.85 + 0.15;
          break;
        case 'heart':
          widthMultiplier = relativeY < 0.5 ? 
            0.55 + relativeY * 0.9 : 
            0.9 - (relativeY - 0.5) * 0.8;
          break;
        case 'diamond':
          if (relativeY < 0.4) {
            widthMultiplier = 0.7 + relativeY * 0.75;
          } else if (relativeY > 0.6) {
            widthMultiplier = 1 - (relativeY - 0.6) * 0.75;
          } else {
            widthMultiplier = 1;
          }
          break;
      }
      
      const rowWidth = Math.max(6, Math.floor(headDim.width * widthMultiplier));
      const startX = headX + Math.floor((headDim.width - rowWidth) / 2);
      
      // Double outline for depth
      elements.push(
        <rect key={`outline-outer-l-${y}`} x={startX - 2} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-outer-r-${y}`} x={startX + rowWidth + 1} y={headY + y} width="1" height="1" fill={createShadow(outlineColor, 0.7)} className="pixel" />,
        <rect key={`outline-l-${y}`} x={startX - 1} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />,
        <rect key={`outline-r-${y}`} x={startX + rowWidth} y={headY + y} width="1" height="1" fill={outlineColor} className="pixel" />
      );
      
      // Face fill with advanced lighting
      for (let x = 0; x < rowWidth; x++) {
        let faceColor = skinTone;
        const xRatio = x / rowWidth;
        const centerDistance = Math.abs(xRatio - 0.5) * 2;
        
        // Main lighting from top-left
        if (xRatio < 0.15) {
          faceColor = skinBrightHighlight;
        } else if (xRatio < 0.25) {
          faceColor = skinHighlight;
        } else if (xRatio < 0.4) {
          faceColor = createHighlight(skinTone, 1.08);
        } else if (xRatio > 0.85) {
          faceColor = skinDeepShadow;
        } else if (xRatio > 0.75) {
          faceColor = skinShadow;
        } else if (xRatio > 0.6) {
          faceColor = skinMidtone;
        }
        
        // Subsurface scattering on thin areas
        if (relativeY > 0.3 && relativeY < 0.5) {
          if (x < 3 || x > rowWidth - 4) {
            faceColor = skinSubsurface;
          }
        }
        
        // Cheekbone definition
        const cheekbones = appearance.cheekbones || 'average';
        if (cheekbones !== 'low' && relativeY > 0.4 && relativeY < 0.65) {
          const cheekboneIntensity = cheekbones === 'high' ? 0.12 : 0.08;
          if (Math.abs(xRatio - 0.22) < cheekboneIntensity || Math.abs(xRatio - 0.78) < cheekboneIntensity) {
            if (xRatio < 0.5) {
              faceColor = createHighlight(faceColor, 1.1);
            } else {
              faceColor = createHighlight(faceColor, 1.05);
            }
          }
        }
        
        // Nose bridge highlight
        if (relativeY > 0.25 && relativeY < 0.65 && Math.abs(x - rowWidth/2) < 2) {
          faceColor = createHighlight(faceColor, 1.12);
        }
        
        // Skin texture
        const skinTexture = appearance.skinTexture || 'smooth';
        if (skinTexture === 'freckled' && rand(x * 100 + y * 1000) > 0.92) {
          faceColor = createShadow(faceColor, 0.85);
        } else if (skinTexture === 'weathered' && rand(x * 50 + y * 500) > 0.88) {
          faceColor = createShadow(faceColor, 0.92);
        }
        
        // Age spots
        if (hasAgeSpots && relativeY > 0.3 && relativeY < 0.7) {
          if (rand(x * 200 + y * 2000) > 0.96) {
            faceColor = createShadow(faceColor, 0.75);
          }
        }
        
        // Wrinkles
        if (hasWrinkles) {
          // Forehead lines
          if ((relativeY > 0.18 && relativeY < 0.32) && y % 4 === 0) {
            faceColor = createShadow(faceColor, 0.88);
          }
          // Crow's feet area
          if ((relativeY > 0.35 && relativeY < 0.45) && (xRatio < 0.15 || xRatio > 0.85)) {
            if ((x + y) % 3 === 0) {
              faceColor = createShadow(faceColor, 0.9);
            }
          }
          // Laugh lines
          if ((relativeY > 0.55 && relativeY < 0.75) && (xRatio < 0.3 || xRatio > 0.7)) {
            if ((x - Math.floor(rowWidth/2)) % 4 === 0) {
              faceColor = createShadow(faceColor, 0.89);
            }
          }
        }
        
        elements.push(
          <rect key={`face-${y}-${x}`} x={startX + x} y={headY + y} width="1" height="1" fill={faceColor} className="pixel" />
        );
      }
      
      // Under-chin shadow
      if (y === headDim.height - 1) {
        for (let x = 2; x < rowWidth - 2; x++) {
          elements.push(
            <rect key={`chin-shadow-${x}`} x={startX + x} y={headY + y + 1} width="1" height="1" 
              fill={skinDeepShadow} className="pixel" />
          );
        }
      }
    }
    
    return elements;
  };

  // Enhanced hair rendering with texture patterns
  const renderHair = () => {
    const elements = [];
    const hairTexture = appearance.hairTexture || 'straight';
    const hairLength = appearance.hairLength || 'medium';
    const hairStyle = appearance.hairstyle;
    
    if (hairLength === 'bald') return elements;
    
    // Hair texture patterns
    const getHairPattern = (x: number, y: number): number => {
      switch (hairTexture) {
        case 'straight':
          return Math.sin(x * 0.1) * 0.15 + Math.sin(y * 0.05) * 0.1;
        case 'wavy':
          return Math.sin(x * 0.3 + y * 0.15) * 0.4 + Math.cos(x * 0.2) * 0.2;
        case 'curly':
          return Math.sin(x * 0.5 + y * 0.3) * 0.7 + Math.cos(x * 0.4 + y * 0.2) * 0.3;
        case 'coily':
          return Math.sin(x * 0.8 + y * 0.5) * 0.9 + Math.sin(x * 0.6 + y * 0.4) * 0.4;
        case 'kinky':
          return Math.sin(x * 1.2 + y * 0.8) * 1.1 + Math.cos(x * 0.9 + y * 0.6) * 0.5;
        default:
          return 0;
      }
    };
    
    const hairTop = headY - (hairLength === 'very_short' ? 2 : 4);
    const hairThickness = isOld ? 0.7 : isYoung ? 0.95 : 0.85;
    
    // Multi-layer hair rendering
    for (let layer = 0; layer < 3; layer++) {
      const layerOffset = layer * 0.5;
      
      // Top hair
      for (let y = hairTop - layer; y < headY + 10; y++) {
        for (let x = headX - 5 + layer; x < headX + headDim.width + 5 - layer; x++) {
          const centerX = headX + headDim.width / 2;
          const distFromCenter = Math.abs(x - centerX);
          
          let shouldDrawHair = false;
          let hairColorVariant = layer === 0 ? hairDeepShadow : 
                               layer === 1 ? hairColor : hairHighlight;
          
          if (y < headY) {
            const topProgress = (headY - y) / (headY - hairTop);
            const allowedDist = (headDim.width / 2 + 4) * hairThickness * (1 - topProgress * 0.3);
            if (distFromCenter < allowedDist - layer) shouldDrawHair = true;
          } else if (y < headY + 8 - layer) {
            if (x >= headX - 3 + layer && x <= headX + headDim.width + 2 - layer) {
              shouldDrawHair = true;
            }
          }
          
          if (shouldDrawHair && (!isOld || rand(x + y * 100 + layer * 1000) > 0.35)) {
            const pattern = getHairPattern(x, y);
            
            // Apply texture-based coloring
            if (pattern > 0.3) {
              hairColorVariant = layer === 2 ? hairBrightHighlight : hairHighlight;
            } else if (pattern < -0.3) {
              hairColorVariant = hairDeepShadow;
            }
            
            // Add natural variation
            if (rand(x * 10 + y * 100 + layer * 500) > 0.8) {
              hairColorVariant = createHighlight(hairColorVariant, 1.1);
            }
            
            elements.push(
              <rect key={`hair-${layer}-${x}-${y}`} 
                x={x + pattern * 0.3} y={y} width="1" height="1" 
                fill={hairColorVariant} className="pixel" />
            );
          }
        }
      }
    }
    
    // Side hair for longer styles
    if (['medium', 'long', 'very_long'].includes(hairLength)) {
      const hairLengthPixels = hairLength === 'very_long' ? 28 : 
                              hairLength === 'long' ? 20 : 12;
      
      for (let y = headY + 5; y < headY + hairLengthPixels; y++) {
        const progress = (y - headY - 5) / hairLengthPixels;
        const widthReduction = Math.floor(progress * 6);
        const flowOffset = Math.sin(y * 0.15) * 2;
        
        // Multi-strand layers
        for (let strand = 0; strand < 3; strand++) {
          const strandOffset = strand * 1.5;
          
          // Left side
          for (let x = headX - 6 + widthReduction + strandOffset; x <= headX + 4 - strandOffset; x++) {
            const pattern = getHairPattern(x, y);
            const strandPattern = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            
            let hairColorVariant = strand === 0 ? hairShadow : 
                                 strand === 1 ? hairColor : hairHighlight;
            
            if (strandPattern > 0.2 && strand === 2) {
              hairColorVariant = hairBrightHighlight;
            }
            
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              elements.push(
                <rect key={`hair-left-${strand}-${x}-${y}`} 
                  x={x + strandPattern * 0.4 + pattern + flowOffset} y={y} 
                  width="1" height="1" fill={hairColorVariant} className="pixel" />
              );
            }
          }
          
          // Right side
          for (let x = headX + headDim.width - 4 + strandOffset; x < headX + headDim.width + 6 - widthReduction - strandOffset; x++) {
            const pattern = getHairPattern(x, y);
            const strandPattern = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            
            let hairColorVariant = strand === 0 ? hairShadow : 
                                 strand === 1 ? hairColor : hairHighlight;
            
            if (strandPattern > 0.2 && strand === 2) {
              hairColorVariant = hairBrightHighlight;
            }
            
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              elements.push(
                <rect key={`hair-right-${strand}-${x}-${y}`} 
                  x={x - strandPattern * 0.4 - pattern - flowOffset} y={y} 
                  width="1" height="1" fill={hairColorVariant} className="pixel" />
              );
            }
          }
        }
      }
    }
    
    return elements;
  };

  // Enhanced eye rendering with shape variations
  const renderEyes = () => {
    const elements = [];
    const eyeShape = appearance.eyeShape || 'almond';
    const eyebrowShape = appearance.eyebrowShape || 'arched';
    const eyebrowThickness = appearance.eyebrowThickness || 'medium';
    const eyelashes = appearance.eyelashes || 'medium';
    
    const eyeY = headY + Math.floor(headDim.height * 0.35);
    const eyeSpacing = Math.floor(headDim.width * 0.24);
    const centerX = headX + Math.floor(headDim.width / 2);
    
    const leftEyeX = centerX - eyeSpacing - 2;
    const rightEyeX = centerX + eyeSpacing - 1;
    
    // Eye socket shadows
    const socketDepth = eyeShape === 'hooded' ? 0.55 : 0.7;
    elements.push(
      <rect key="socket-l" x={leftEyeX - 3} y={eyeY - 2} width="7" height="1" 
        fill={createComplementaryShadow(skinTone, socketDepth)} className="pixel" />,
      <rect key="socket-r" x={rightEyeX - 3} y={eyeY - 2} width="7" height="1" 
        fill={createComplementaryShadow(skinTone, socketDepth)} className="pixel" />
    );
    
    // Eye whites with shape variations
    let eyeWidth = 4;
    let eyeHeight = 2;
    
    switch (eyeShape) {
      case 'round':
        eyeWidth = 4;
        eyeHeight = 3;
        break;
      case 'narrow':
        eyeWidth = 3;
        eyeHeight = 2;
        break;
      case 'wide':
        eyeWidth = 5;
        eyeHeight = 2;
        break;
      case 'hooded':
        eyeHeight = 2;
        // Add hooded effect
        elements.push(
          <rect key="hood-l" x={leftEyeX - 1} y={eyeY - 1} width="5" height="1" 
            fill={skinMidtone} className="pixel" />,
          <rect key="hood-r" x={rightEyeX - 1} y={eyeY - 1} width="5" height="1" 
            fill={skinMidtone} className="pixel" />
        );
        break;
    }
    
    // Eye whites
    const eyeWhiteColor = stats.constitution >= 8 ? '#ffffff' : '#fafafa';
    elements.push(
      <rect key="eye-white-l" x={leftEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} 
        fill={eyeWhiteColor} className="pixel" />,
      <rect key="eye-white-r" x={rightEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} 
        fill={eyeWhiteColor} className="pixel" />
    );
    
    // Iris position and size
    let irisSize = 2;
    let irisOffset = 1;
    if (gazeDirection === 0) irisOffset = 0;
    else if (gazeDirection === 2) irisOffset = eyeWidth - irisSize;
    
    // Irises with detail
    const irisY = eyeShape === 'round' ? eyeY + 0.5 : eyeY;
    elements.push(
      <rect key="iris-l" x={leftEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} 
        fill={appearance.eyeColor} className="pixel" />,
      <rect key="iris-r" x={rightEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} 
        fill={appearance.eyeColor} className="pixel" />
    );
    
    // Pupils with micro-expressions
    const pupilSize = microExpression === 0 ? 1 : 1.5; // Focused = smaller pupils
    elements.push(
      <rect key="pupil-l" x={leftEyeX + irisOffset + 0.5} y={irisY + 0.5} 
        width={pupilSize} height={pupilSize} fill="#000000" className="pixel" />,
      <rect key="pupil-r" x={rightEyeX + irisOffset + 0.5} y={irisY + 0.5} 
        width={pupilSize} height={pupilSize} fill="#000000" className="pixel" />
    );
    
    // Eye shine and vitality
    if (stats.constitution >= 6 || microExpression === 1) {
      elements.push(
        <rect key="shine-l" x={leftEyeX + irisOffset} y={irisY} width="1" height="1" 
          fill="#ffffff" opacity="0.6" className="pixel" />,
        <rect key="shine-r" x={rightEyeX + irisOffset} y={irisY} width="1" height="1" 
          fill="#ffffff" opacity="0.6" className="pixel" />
      );
    }
    
    // Enhanced eyebrows
    const browColor = hasGrayHair ? '#A9A9A9' : appearance.hairColor;
    const browY = eyeY - 3 - (microExpression === 2 ? 1 : 0); // Raised when uncertain
    const browThicknessValue = eyebrowThickness === 'thick' ? 2 : 
                              eyebrowThickness === 'bushy' ? 3 : 1;
    
    // Eyebrow shapes
    for (let t = 0; t < browThicknessValue; t++) {
      switch (eyebrowShape) {
        case 'straight':
          elements.push(
            <rect key={`brow-l-${t}`} x={leftEyeX - 1} y={browY - t} width="5" height="1" 
              fill={browColor} className="pixel" />,
            <rect key={`brow-r-${t}`} x={rightEyeX - 1} y={browY - t} width="5" height="1" 
              fill={browColor} className="pixel" />
          );
          break;
        case 'arched':
          for (let x = 0; x < 5; x++) {
            const archHeight = x < 3 ? x * 0.5 : (4 - x) * 0.5;
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={browY - t - archHeight} 
                width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={browY - t - archHeight} 
                width="1" height="1" fill={browColor} className="pixel" />
            );
          }
          break;
        case 'angular':
          for (let x = 0; x < 5; x++) {
            const angleY = x < 3 ? 0 : x - 3;
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={browY - t + angleY} 
                width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={browY - t - angleY} 
                width="1" height="1" fill={browColor} className="pixel" />
            );
          }
          break;
      }
    }
    
    // Eyelashes for female characters
    if (isFemale && eyelashes !== 'short') {
      const lashLength = eyelashes === 'long' ? 2 : 1;
      elements.push(
        <rect key="lash-l-top" x={leftEyeX} y={eyeY - 1} width={eyeWidth} height="1" 
          fill={createShadow(browColor, 0.7)} className="pixel" />,
        <rect key="lash-r-top" x={rightEyeX} y={eyeY - 1} width={eyeWidth} height="1" 
          fill={createShadow(browColor, 0.7)} className="pixel" />
      );
      
      if (eyelashes === 'long') {
        elements.push(
          <rect key="lash-l-side" x={leftEyeX - 1} y={eyeY} width="1" height="1" 
            fill={createShadow(browColor, 0.7)} className="pixel" />,
          <rect key="lash-r-side" x={rightEyeX + eyeWidth} y={eyeY} width="1" height="1" 
            fill={createShadow(browColor, 0.7)} className="pixel" />
        );
      }
    }
    
    // Glasses
    if (appearance.hasGlasses) {
      const glassesStyle = appearance.glassesStyle || 'square';
      const glassesColor = '#2F4F4F';
      const metalColor = isWealthy ? '#FFD700' : '#C0C0C0';
      
      switch (glassesStyle) {
        case 'round':
          // Round frames
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const rx = Math.cos(angle) * 3.5;
            const ry = Math.sin(angle) * 3;
            elements.push(
              <rect key={`glasses-l-round-${angle}`} 
                x={leftEyeX + 2 + rx} y={eyeY + 1 + ry} 
                width="1" height="1" fill={glassesColor} className="pixel" />,
              <rect key={`glasses-r-round-${angle}`} 
                x={rightEyeX + 2 + rx} y={eyeY + 1 + ry} 
                width="1" height="1" fill={glassesColor} className="pixel" />
            );
          }
          break;
        case 'square':
          // Square frames
          elements.push(
            <rect key="glasses-l-square" x={leftEyeX - 2} y={eyeY - 1} width="7" height="5" 
              fill="none" stroke={glassesColor} strokeWidth="1" className="pixel" />,
            <rect key="glasses-r-square" x={rightEyeX - 2} y={eyeY - 1} width="7" height="5" 
              fill="none" stroke={glassesColor} strokeWidth="1" className="pixel" />
          );
          break;
        case 'half_rim':
          // Half-rim frames
          elements.push(
            <rect key="glasses-l-half-top" x={leftEyeX - 2} y={eyeY - 1} width="7" height="1" 
              fill={glassesColor} className="pixel" />,
            <rect key="glasses-r-half-top" x={rightEyeX - 2} y={eyeY - 1} width="7" height="1" 
              fill={glassesColor} className="pixel" />,
            <rect key="glasses-l-half-side1" x={leftEyeX - 2} y={eyeY - 1} width="1" height="3" 
              fill={glassesColor} className="pixel" />,
            <rect key="glasses-l-half-side2" x={leftEyeX + 4} y={eyeY - 1} width="1" height="3" 
              fill={glassesColor} className="pixel" />,
            <rect key="glasses-r-half-side1" x={rightEyeX - 2} y={eyeY - 1} width="1" height="3" 
              fill={glassesColor} className="pixel" />,
            <rect key="glasses-r-half-side2" x={rightEyeX + 4} y={eyeY - 1} width="1" height="3" 
              fill={glassesColor} className="pixel" />
          );
          break;
      }
      
      // Bridge and temples
      elements.push(
        <rect key="glasses-bridge" x={leftEyeX + 5} y={eyeY} 
          width={rightEyeX - leftEyeX - 5} height="1" fill={metalColor} className="pixel" />,
        <rect key="glasses-temple-l" x={leftEyeX - 3} y={eyeY} width="1" height="1" 
          fill={metalColor} className="pixel" />,
        <rect key="glasses-temple-r" x={rightEyeX + 5} y={eyeY} width="1" height="1" 
          fill={metalColor} className="pixel" />
      );
      
      // Lens reflections
      elements.push(
        <rect key="lens-reflect-l" x={leftEyeX} y={eyeY} width="2" height="1" 
          fill="#ffffff" opacity="0.3" className="pixel" />,
        <rect key="lens-reflect-r" x={rightEyeX} y={eyeY} width="2" height="1" 
          fill="#ffffff" opacity="0.3" className="pixel" />
      );
    }
    
    // Crow's feet and eye bags for old characters
    if (isOld) {
      elements.push(
        <rect key="crow-l1" x={leftEyeX - 3} y={eyeY} width="1" height="1" 
          fill={skinShadow} className="pixel" />,
        <rect key="crow-l2" x={leftEyeX - 3} y={eyeY + 2} width="1" height="1" 
          fill={skinShadow} className="pixel" />,
        <rect key="crow-r1" x={rightEyeX + eyeWidth + 2} y={eyeY} width="1" height="1" 
          fill={skinShadow} className="pixel" />,
        <rect key="crow-r2" x={rightEyeX + eyeWidth + 2} y={eyeY + 2} width="1" height="1" 
          fill={skinShadow} className="pixel" />,
        <rect key="bag-l" x={leftEyeX + 1} y={eyeY + 3} width="2" height="1" 
          fill={createShadow(skinTone, 0.88)} className="pixel" />,
        <rect key="bag-r" x={rightEyeX + 1} y={eyeY + 3} width="2" height="1" 
          fill={createShadow(skinTone, 0.88)} className="pixel" />
      );
    }
    
    return elements;
  };

  // Enhanced nose rendering
  const renderNose = () => {
    const elements = [];
    const noseShape = appearance.noseShape || 'straight';
    const noseX = headX + Math.floor(headDim.width / 2) - 1;
    const noseY = headY + Math.floor(headDim.height * 0.45);
    
    // Nose bridge
    elements.push(
      <rect key="nose-bridge-highlight" x={noseX + 1} y={noseY - 5} width="1" height="5" 
        fill={skinHighlight} className="pixel" />,
      <rect key="nose-bridge-midtone" x={noseX} y={noseY - 4} width="1" height="4" 
        fill={skinMidtone} className="pixel" />
    );
    
    // Nose shape variations
    switch (noseShape) {
      case 'aquiline':
        // Roman nose with bump
        elements.push(
          <rect key="nose-bump" x={noseX + 1} y={noseY - 2} width="2" height="1" 
            fill={skinTone} className="pixel" />,
          <rect key="nose-bump-shadow" x={noseX} y={noseY - 2} width="1" height="1" 
            fill={skinShadow} className="pixel" />
        );
        break;
      case 'broad':
        // Wider nose
        elements.push(
          <rect key="nose-broad-l" x={noseX - 1} y={noseY} width="1" height="2" 
            fill={skinMidtone} className="pixel" />,
          <rect key="nose-broad-r" x={noseX + 3} y={noseY} width="1" height="2" 
            fill={skinMidtone} className="pixel" />
        );
        break;
      case 'button':
        // Small upturned nose
        elements.push(
          <rect key="nose-button" x={noseX} y={noseY - 1} width="3" height="2" 
            fill={skinTone} className="pixel" />,
          <rect key="nose-button-tip" x={noseX + 1} y={noseY - 2} width="1" height="1" 
            fill={skinHighlight} className="pixel" />
        );
        break;
      case 'roman':
        // Prominent bridge
        for (let i = 0; i < 3; i++) {
          elements.push(
            <rect key={`nose-roman-${i}`} x={noseX + 1 - (i * 0.3)} y={noseY - 4 + i} 
              width="2" height="1" fill={skinTone} className="pixel" />
          );
        }
        break;
    }
    
    // Nose body
    const noseWidth = noseShape === 'broad' ? 5 : noseShape === 'button' ? 3 : 4;
    elements.push(
      <rect key="nose-body" x={noseX} y={noseY - 3} width={noseWidth - 1} height="5" 
        fill={skinTone} className="pixel" />
    );
    
    // Nose sides with proper shading
    elements.push(
      <rect key="nose-shadow-l" x={noseX - 1} y={noseY - 2} width="1" height="4" 
        fill={skinShadow} className="pixel" />,
      <rect key="nose-highlight-r" x={noseX + noseWidth - 1} y={noseY - 2} width="1" height="3" 
        fill={skinHighlight} className="pixel" />
    );
    
    // Nostrils
    const nostrilY = noseY + 1;
    elements.push(
      <rect key="nostril-l" x={noseX} y={nostrilY} width="1" height="1" 
        fill={skinDeepShadow} className="pixel" />,
      <rect key="nostril-r" x={noseX + noseWidth - 2} y={nostrilY} width="1" height="1" 
        fill={skinDeepShadow} className="pixel" />,
      <rect key="nose-bottom-shadow" x={noseX + 1} y={nostrilY + 1} width={noseWidth - 3} height="1" 
        fill={skinShadow} className="pixel" />
    );
    
    // Nose tip highlight
    elements.push(
      <rect key="nose-tip-highlight" x={noseX + Math.floor(noseWidth / 2) - 1} y={noseY - 1} 
        width="1" height="1" fill={skinBrightHighlight} className="pixel" />
    );
    
    return elements;
  };

  // Enhanced mouth rendering with lip shapes
  const renderMouth = () => {
    const elements = [];
    const lipShape = appearance.lipShape || 'medium';
    const mouthX = headX + Math.floor(headDim.width / 2) - 2;
    const mouthY = headY + Math.floor(headDim.height * 0.72);
    
    const upperLipColor = createShadow(lipColor, 0.85);
    const lowerLipColor = lipColor;
    const lipHighlight = createHighlight(lipColor, 1.3);
    const lipShadow = createShadow(lipColor, 0.7);
    
    // Mouth width based on expression
    let mouthWidth = expressionType === 1 ? 6 : // Smile
                    expressionType === 3 ? 3 : // Withdrawn
                    5; // Default
    
    // Lip shape variations
    switch (lipShape) {
      case 'thin':
        elements.push(
          <rect key="mouth-upper-thin" x={mouthX} y={mouthY} width={mouthWidth} height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-thin" x={mouthX} y={mouthY + 1} width={mouthWidth} height="1" 
            fill={lowerLipColor} className="pixel" />
        );
        break;
        
      case 'full':
        // Fuller lips
        elements.push(
          <rect key="mouth-upper-full1" x={mouthX} y={mouthY - 1} width={mouthWidth} height="1" 
            fill={createHighlight(upperLipColor, 1.1)} className="pixel" />,
          <rect key="mouth-upper-full2" x={mouthX - 1} y={mouthY} width={mouthWidth + 2} height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-full1" x={mouthX - 1} y={mouthY + 1} width={mouthWidth + 2} height="2" 
            fill={lowerLipColor} className="pixel" />,
          <rect key="mouth-lower-full2" x={mouthX} y={mouthY + 3} width={mouthWidth} height="1" 
            fill={createShadow(lowerLipColor, 0.9)} className="pixel" />
        );
        break;
        
      case 'bow':
        // Cupid's bow shape
        elements.push(
          <rect key="mouth-bow-peak1" x={mouthX + 1} y={mouthY - 1} width="1" height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-bow-peak2" x={mouthX + 3} y={mouthY - 1} width="1" height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-bow-dip" x={mouthX + 2} y={mouthY} width="1" height="1" 
            fill={createHighlight(upperLipColor, 1.1)} className="pixel" />,
          <rect key="mouth-upper-bow" x={mouthX} y={mouthY} width={mouthWidth} height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-bow" x={mouthX} y={mouthY + 1} width={mouthWidth} height="2" 
            fill={lowerLipColor} className="pixel" />
        );
        break;
        
      case 'wide':
        mouthWidth = 7;
        elements.push(
          <rect key="mouth-upper-wide" x={mouthX - 1} y={mouthY} width={mouthWidth} height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower-wide" x={mouthX - 1} y={mouthY + 1} width={mouthWidth} height="1" 
            fill={lowerLipColor} className="pixel" />
        );
        break;
        
      default: // medium
        elements.push(
          <rect key="mouth-upper" x={mouthX} y={mouthY} width={mouthWidth} height="1" 
            fill={upperLipColor} className="pixel" />,
          <rect key="mouth-lower" x={mouthX} y={mouthY + 1} width={mouthWidth} height="2" 
            fill={lowerLipColor} className="pixel" />
        );
    }
    
    // Expression modifications
    switch (expressionType) {
      case 1: // Confident smile
        elements.push(
          <rect key="smile-l" x={mouthX - 1} y={mouthY + 1} width="1" height="1" 
            fill={skinShadow} className="pixel" />,
          <rect key="smile-r" x={mouthX + mouthWidth} y={mouthY + 1} width="1" height="1" 
            fill={skinShadow} className="pixel" />,
          <rect key="smile-dimple-l" x={mouthX - 2} y={mouthY + 1} width="1" height="1" 
            fill={createShadow(skinTone, 0.92)} className="pixel" />,
          <rect key="smile-dimple-r" x={mouthX + mouthWidth + 1} y={mouthY + 1} width="1" height="1" 
            fill={createShadow(skinTone, 0.92)} className="pixel" />
        );
        break;
        
      case 2: // Frown
        elements.push(
          <rect key="frown-l" x={mouthX - 1} y={mouthY + 2} width="1" height="1" 
            fill={skinShadow} className="pixel" />,
          <rect key="frown-r" x={mouthX + mouthWidth} y={mouthY + 2} width="1" height="1" 
            fill={skinShadow} className="pixel" />
        );
        break;
        
      case 4: // Thoughtful (pursed lips)
        elements.push(
          <rect key="pursed-center" x={mouthX + Math.floor(mouthWidth/2) - 1} y={mouthY} 
            width="2" height="1" fill={lipShadow} className="pixel" />
        );
        break;
    }
    
    // Lip highlights
    if (lipShape !== 'thin') {
      elements.push(
        <rect key="lip-highlight" x={mouthX + Math.floor(mouthWidth/2) - 1} y={mouthY + 1} 
          width="2" height="1" fill={lipHighlight} className="pixel" />
      );
    }
    
    // Philtrum (groove above upper lip)
    elements.push(
      <rect key="philtrum" x={mouthX + Math.floor(mouthWidth/2)} y={mouthY - 2} 
        width="1" height="2" fill={skinShadow} className="pixel" />
    );
    
    return elements;
  };

  // Enhanced facial hair rendering
  const renderFacialHair = () => {
    if (!appearance.facialHair || isFemale) return null;
    
    const elements = [];
    const facialHairStyle = appearance.facialHairStyle || 'full_beard';
    const facialHairThickness = appearance.facialHairThickness || 'medium';
    const beardColor = hasGrayHair ? '#C0C0C0' : appearance.hairColor;
    const beardShadow = createShadow(beardColor, 0.7);
    const beardHighlight = createHighlight(beardColor, 1.2);
    
    const beardY = headY + Math.floor(headDim.height * 0.7) + 2;
    const density = facialHairThickness === 'thick' ? 0.85 : 
                   facialHairThickness === 'sparse' ? 0.4 : 0.65;
    
    switch (facialHairStyle) {
      case 'full_beard':
        // Multi-layer full beard
        for (let layer = 0; layer < 2; layer++) {
          for (let y = 0; y < 8; y++) {
            for (let x = -5; x < headDim.width - 1; x++) {
              const beardX = headX + x + 3;
              const textureVariation = Math.sin(x * 0.4 + y * 0.3 + layer) > 0.2;
              const shouldDraw = rand(x + y * 100 + layer * 1000) < density;
              
              if (textureVariation && shouldDraw) {
                const layerColor = layer === 0 ? beardShadow : 
                                  (y < 3 ? beardColor : beardHighlight);
                elements.push(
                  <rect key={`beard-${layer}-${x}-${y}`} x={beardX} y={beardY + y} 
                    width="1" height="1" fill={layerColor} className="pixel" />
                );
              }
            }
          }
        }
        break;
        
      case 'goatee':
        // Goatee and mustache
        for (let y = 0; y < 6; y++) {
          for (let x = -3; x < 4; x++) {
            const goateeX = headX + Math.floor(headDim.width / 2) + x;
            const shouldDraw = Math.abs(x) + y < 6 && rand(x + y * 100) < density;
            
            if (shouldDraw) {
              elements.push(
                <rect key={`goatee-${x}-${y}`} x={goateeX} y={beardY + y} 
                  width="1" height="1" fill={y < 3 ? beardColor : beardShadow} className="pixel" />
              );
            }
          }
        }
        break;
        
      case 'van_dyke':
        // Pointed beard and separate mustache
        for (let y = 0; y < 7; y++) {
          const width = Math.max(1, 5 - y);
          for (let x = -Math.floor(width/2); x <= Math.floor(width/2); x++) {
            const vdX = headX + Math.floor(headDim.width / 2) + x;
            if (rand(x + y * 100) < density) {
              elements.push(
                <rect key={`vandyke-${x}-${y}`} x={vdX} y={beardY + y} 
                  width="1" height="1" fill={y < 3 ? beardColor : beardShadow} className="pixel" />
              );
            }
          }
        }
        break;
        
      case 'stubble':
        // Dotted stubble effect
        for (let y = -1; y < 5; y++) {
          for (let x = -4; x < headDim.width - 2; x++) {
            const stubbleX = headX + x + 3;
            const stubbleY = beardY + y;
            if (rand(x * 10 + y * 100) < density * 0.6) {
              elements.push(
                <rect key={`stubble-${x}-${y}`} x={stubbleX} y={stubbleY} 
                  width="1" height="1" fill={beardShadow} className="pixel" />
              );
            }
          }
        }
        break;
        
      case 'soul_patch':
        // Small patch below lower lip
        for (let y = 0; y < 3; y++) {
          for (let x = -1; x < 2; x++) {
            const patchX = headX + Math.floor(headDim.width / 2) + x;
            elements.push(
              <rect key={`soul-patch-${x}-${y}`} x={patchX} y={beardY - 1 + y} 
                width="1" height="1" fill={beardColor} className="pixel" />
            );
          }
        }
        break;
        
      case 'mutton_chops':
        // Sideburns connected to mustache
        for (let y = -8; y < 4; y++) {
          for (let side = 0; side < 2; side++) {
            const sideX = side === 0 ? headX - 2 : headX + headDim.width + 1;
            const width = y < -4 ? 2 : y < 0 ? 3 : 4;
            
            for (let w = 0; w < width; w++) {
              const chopX = side === 0 ? sideX - w : sideX + w;
              if (rand(w + y * 100 + side * 1000) < density) {
                elements.push(
                  <rect key={`chop-${side}-${w}-${y}`} x={chopX} y={beardY + y} 
                    width="1" height="1" fill={y < 0 ? beardHighlight : beardColor} className="pixel" />
                );
              }
            }
          }
        }
        break;
    }
    
    // Mustache (for applicable styles)
    if (['full_beard', 'goatee', 'mustache', 'van_dyke', 'mutton_chops'].includes(facialHairStyle)) {
      const mustacheY = headY + Math.floor(headDim.height * 0.7) - 1;
      const mustacheThickness = facialHairThickness === 'thick' ? 2 : 1;
      
      for (let t = 0; t < mustacheThickness; t++) {
        elements.push(
          <rect key={`mustache-${t}`} x={headX + Math.floor(headDim.width / 2) - 4} 
            y={mustacheY + t} width="8" height="1" fill={beardColor} className="pixel" />
        );
        
        // Mustache texture
        for (let i = 0; i < 3; i++) {
          elements.push(
            <rect key={`mustache-texture-${t}-${i}`} 
              x={headX + Math.floor(headDim.width / 2) - 2 + i * 2} 
              y={mustacheY + t} width="1" height="1" 
              fill={beardHighlight} className="pixel" />
          );
        }
      }
    }
    
    return elements;
  };

  // Enhanced body and clothing rendering
  const renderBody = () => {
    const elements = [];
    const neckY = headY + headDim.height;
    const neckHeight = 5;
    const bodyStartY = neckY + neckHeight;
    const bodyHeight = 64 - bodyStartY;
    
    // Detailed neck with muscle definition
    const neckWidth = Math.floor(headDim.width * 0.55);
    const neckX = headX + Math.floor((headDim.width - neckWidth) / 2);
    
    for (let y = 0; y < neckHeight; y++) {
      const neckRowWidth = neckWidth + Math.floor(y * 0.4);
      const neckRowX = headX + Math.floor((headDim.width - neckRowWidth) / 2);
      
      for (let x = 0; x < neckRowWidth; x++) {
        let neckColor = skinTone;
        const xRatio = x / neckRowWidth;
        
        // Neck shading with muscle definition
        if (xRatio < 0.25) {
          neckColor = skinHighlight;
        } else if (xRatio > 0.75) {
          neckColor = skinShadow;
        } else if (stats.strength >= 7) {
          // Muscle definition for strong characters
          if (xRatio > 0.3 && xRatio < 0.4) {
            neckColor = createHighlight(skinTone, 1.05);
          } else if (xRatio > 0.6 && xRatio < 0.7) {
            neckColor = createShadow(skinTone, 0.95);
          }
        }
        
        // Adam's apple for males
        if (!isFemale && y === 2 && Math.abs(x - neckRowWidth/2) < 2) {
          neckColor = createHighlight(neckColor, 1.08);
        }
        
        elements.push(
          <rect key={`neck-${x}-${y}`} x={neckRowX + x} y={neckY + y} 
            width="1" height="1" fill={neckColor} className="pixel" />
        );
      }
    }
    
    // Clothing with material textures
    const garment = appearance.garment;
    const clothingColor = appearance.palette.primary;
    const clothingShadow = createShadow(clothingColor, 0.7);
    const clothingDeepShadow = createShadow(clothingColor, 0.5);
    const clothingHighlight = createHighlight(clothingColor, 1.2);
    const accentColor = appearance.palette.accent;
    
    // Material-based rendering
    const material = garment.material.toLowerCase();
    const hasSheen = ['silk', 'satin', 'velvet'].includes(material);
    const isRough = ['wool', 'burlap', 'hemp'].includes(material);
    const isMetallic = ['mail', 'plate', 'bronze'].includes(material);
    
    for (let y = 0; y < bodyHeight; y++) {
      let torsoWidth;
      
      // Natural torso shape
      if (y < 10) {
        const shoulderProgress = y / 10;
        torsoWidth = Math.floor(neckWidth + (bodyDim.shoulderWidth - neckWidth) * shoulderProgress);
      } else if (y < 18) {
        torsoWidth = bodyDim.shoulderWidth;
      } else if (y < bodyHeight * 0.55) {
        const chestProgress = (y - 18) / (bodyHeight * 0.55 - 18);
        torsoWidth = Math.floor(bodyDim.shoulderWidth - (bodyDim.shoulderWidth - bodyDim.chestWidth) * chestProgress * 0.4);
      } else if (y < bodyHeight * 0.85) {
        torsoWidth = bodyDim.chestWidth;
      } else {
        const waistProgress = (y - bodyHeight * 0.85) / (bodyHeight * 0.15);
        torsoWidth = Math.floor(bodyDim.chestWidth - (bodyDim.chestWidth - bodyDim.waistWidth) * waistProgress);
      }
      
      const torsoX = 32 - (torsoWidth / 2);
      
      // Clothing body
      for (let x = 0; x < torsoWidth + 6; x++) {
        let fillColor = clothingColor;
        const xRatio = x / (torsoWidth + 6);
        const centerDist = Math.abs(xRatio - 0.5) * 2;
        
        // Basic lighting
        if (xRatio < 0.15) {
          fillColor = clothingHighlight;
        } else if (xRatio < 0.3) {
          fillColor = createHighlight(clothingColor, 1.1);
        } else if (xRatio > 0.85) {
          fillColor = clothingDeepShadow;
        } else if (xRatio > 0.7) {
          fillColor = clothingShadow;
        }
        
        // Material effects
        if (hasSheen && rand(x + y * 100) > 0.7) {
          fillColor = createHighlight(fillColor, 1.15);
        } else if (isRough && rand(x + y * 100) > 0.8) {
          fillColor = createShadow(fillColor, 0.95);
        } else if (isMetallic) {
          const metalPattern = Math.sin(x * 0.5 + y * 0.3) > 0.3;
          if (metalPattern) {
            fillColor = createHighlight(fillColor, 1.25);
          }
        }
        
        // Wealth-based patterns
        if (isWealthy) {
          // Embroidery patterns
          if ((x + y) % 12 === 0) {
            fillColor = accentColor;
          } else if ((x - y) % 10 === 0) {
            fillColor = appearance.palette.secondary;
          }
          
          // Noble insignia
          if (isNoble && y > 10 && y < 20 && Math.abs(x - torsoWidth/2) < 5) {
            const insigniaPattern = (x + y) % 4 === 0;
            if (insigniaPattern) {
              fillColor = '#FFD700';
            }
          }
        }
        
        // Cultural patterns
        if (culturalZone === 'EAST_ASIAN' && y % 8 === 4) {
          fillColor = createShadow(fillColor, 0.9); // Horizontal bands
        } else if (culturalZone === 'SUB_SAHARAN_AFRICAN' && ((x + y) % 6 < 2)) {
          fillColor = accentColor; // Geometric patterns
        } else if (culturalZone === 'SOUTH_ASIAN' && isWealthy && (x % 4 === 2 && y % 4 === 2)) {
          fillColor = '#FFD700'; // Gold thread
        }
        
        elements.push(
          <rect key={`clothing-${y}-${x}`} x={torsoX + x - 3} y={bodyStartY + y} 
            width="1" height="1" fill={fillColor} className="pixel" />
        );
      }
      
      // Arms with sleeves
      const armGap = 2;
      const leftArmX = torsoX - bodyDim.armWidth - armGap;
      const rightArmX = torsoX + torsoWidth + armGap;
      
      for (let ax = 0; ax < bodyDim.armWidth; ax++) {
        let armColor = clothingColor;
        
        // Arm lighting
        if (ax === 0) {
          armColor = clothingHighlight;
        } else if (ax === bodyDim.armWidth - 1) {
          armColor = clothingShadow;
        }
        
        // Sleeve details
        if (y % 6 === 0 && isWealthy) {
          armColor = accentColor; // Sleeve bands
        }
        
        elements.push(
          <rect key={`left-arm-${y}-${ax}`} x={leftArmX + ax} y={bodyStartY + y} 
            width="1" height="1" fill={armColor} className="pixel" />,
          <rect key={`right-arm-${y}-${ax}`} x={rightArmX + ax} y={bodyStartY + y} 
            width="1" height="1" fill={armColor} className="pixel" />
        );
      }
      
      // Collar or neckline details
      if (y < 3) {
        const collarWidth = Math.floor(torsoWidth * 0.6);
        const collarX = 32 - (collarWidth / 2);
        
        if (garment.name.toLowerCase().includes('robe') || garment.name.toLowerCase().includes('dress')) {
          // V-neck
          for (let cx = 0; cx < collarWidth; cx++) {
            const vDepth = Math.abs(cx - collarWidth/2) < y * 2;
            if (vDepth) {
              elements.push(
                <rect key={`collar-v-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} 
                  width="1" height="1" fill={skinTone} className="pixel" />
              );
            }
          }
        } else if (isWealthy) {
          // Decorative collar
          for (let cx = 0; cx < collarWidth; cx++) {
            elements.push(
              <rect key={`collar-${y}-${cx}`} x={collarX + cx} y={bodyStartY + y} 
                width="1" height="1" fill={y === 0 ? accentColor : appearance.palette.secondary} className="pixel" />
            );
          }
        }
      }
    }
    
    return elements;
  };

  // Enhanced headgear rendering
  const renderHeadgear = () => {
    const headgear = appearance.headgear;
    if (!headgear || headgear.name === 'None') return null;
    
    const elements = [];
    const material = headgear.material.toLowerCase();
    const name = headgear.name.toLowerCase();
    
    let headgearColor = appearance.palette.secondary;
    if (material.includes('leather')) headgearColor = '#8B4513';
    else if (material.includes('metal')) headgearColor = '#C0C0C0';
    else if (material.includes('gold')) headgearColor = '#FFD700';
    else if (material.includes('silk')) headgearColor = appearance.palette.accent;
    
    const centerX = headX + headDim.width / 2;
    
    // Crown variations
    if (name.includes('crown')) {
      const crownStyle = isNoble ? 'ornate' : 'simple';
      
      if (crownStyle === 'ornate') {
        // Base band
        for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
          elements.push(
            <rect key={`crown-band-${x}`} x={x} y={headY - 2} width="1" height="3" 
              fill="#FFD700" className="pixel" />
          );
          
          // Jewels on band
          if ((x - headX) % 4 === 2) {
            elements.push(
              <rect key={`crown-jewel-band-${x}`} x={x} y={headY - 1} width="1" height="1" 
                fill="#DC143C" className="pixel" />
            );
          }
        }
        
        // Crown points with varying heights
        for (let i = 0; i < 5; i++) {
          const pointX = headX + 2 + i * Math.floor(headDim.width / 5);
          const pointHeight = i === 2 ? 8 : i === 1 || i === 3 ? 6 : 4;
          
          for (let h = 0; h < pointHeight; h++) {
            elements.push(
              <rect key={`crown-point-${i}-${h}`} x={pointX} y={headY - 2 - h} 
                width="2" height="1" fill="#FFD700" className="pixel" />
            );
          }
          
          // Top jewel
          elements.push(
            <rect key={`crown-top-jewel-${i}`} x={pointX} y={headY - 2 - pointHeight} 
              width="2" height="1" fill={i === 2 ? "#4169E1" : "#DC143C"} className="pixel" />
          );
        }
      } else {
        // Simple crown
        for (let x = headX; x < headX + headDim.width; x++) {
          const height = Math.abs(x - centerX) < 2 ? 5 : 3;
          for (let h = 0; h < height; h++) {
            elements.push(
              <rect key={`crown-simple-${x}-${h}`} x={x} y={headY - 2 - h} 
                width="1" height="1" fill={headgearColor} className="pixel" />
            );
          }
        }
      }
    }
    
    // Turban with layers
    else if (name.includes('turban')) {
      const turbanLayers = isWealthy ? 3 : 2;
      
      for (let layer = 0; layer < turbanLayers; layer++) {
        const layerSize = 6 - layer;
        for (let y = -4 - layer; y < 7 - layer; y++) {
          for (let x = -layerSize; x < layerSize; x++) {
            const dist = Math.sqrt(x * x + (y * 0.8) * (y * 0.8));
            if (dist < layerSize) {
              const wrapPattern = (x + y + layer) % 3 === 0;
              const color = wrapPattern ? createShadow(headgearColor, 0.85) : headgearColor;
              
              elements.push(
                <rect key={`turban-${layer}-${x}-${y}`} x={centerX + x} y={headY + y} 
                  width="1" height="1" fill={color} className="pixel" />
              );
            }
          }
        }
      }
      
      // Turban jewel
      if (isWealthy) {
        elements.push(
          <rect key="turban-jewel-setting" x={centerX - 2} y={headY - 1} 
            width="4" height="3" fill="#FFD700" className="pixel" />,
          <rect key="turban-jewel-center" x={centerX - 1} y={headY} 
            width="2" height="1" fill="#DC143C" className="pixel" />
        );
        
        // Feather
        for (let f = 0; f < 8; f++) {
          elements.push(
            <rect key={`turban-feather-${f}`} x={centerX + 5 + Math.floor(f / 4)} 
              y={headY - 8 + f} width="1" height="1" 
              fill={f % 2 === 0 ? "#228B22" : "#32CD32"} className="pixel" />
          );
        }
      }
    }
    
    // Hood/Wimple with fabric folds
    else if (name.includes('hood') || name.includes('wimple')) {
      const hoodDepth = name.includes('wimple') ? 12 : 8;
      
      for (let y = headY - 4; y < headY + hoodDepth; y++) {
        for (let x = headX - 5; x < headX + headDim.width + 5; x++) {
          const distFromCenter = Math.abs(x - centerX);
          const faceArea = y > headY && y < headY + headDim.height - 2 && 
                          distFromCenter < headDim.width / 2 - 2;
          
          if (!faceArea && distFromCenter < headDim.width / 2 + 4) {
            // Fabric fold patterns
            const foldPattern = Math.sin(y * 0.3) * 2;
            const foldOffset = distFromCenter > headDim.width / 2 + 2 + foldPattern;
            
            if (!foldOffset) {
              const shadowed = (y - headY) % 4 === 0 || distFromCenter > headDim.width / 2 + 2;
              elements.push(
                <rect key={`hood-${x}-${y}`} x={x} y={y} width="1" height="1" 
                  fill={shadowed ? createShadow(headgearColor, 0.85) : headgearColor} 
                  className="pixel" />
              );
            }
          }
        }
      }
      
      // Decorative trim for wealthy
      if (isWealthy) {
        for (let y = headY + 2; y < headY + headDim.height - 2; y++) {
          const trimX = headX + Math.floor((headDim.width - 2) * (1 - (y - headY) / headDim.height));
          elements.push(
            <rect key={`hood-trim-l-${y}`} x={trimX - 1} y={y} width="1" height="1" 
              fill="#FFD700" className="pixel" />,
            <rect key={`hood-trim-r-${y}`} x={headX + headDim.width - trimX + headX + 1} y={y} 
              width="1" height="1" fill="#FFD700" className="pixel" />
          );
        }
      }
    }
    
    // Various hat styles
    else if (name.includes('hat') || name.includes('cap')) {
      const hatStyle = name.includes('top') ? 'top' : 
                      name.includes('beret') ? 'beret' :
                      name.includes('fez') ? 'fez' : 'generic';
      
      switch (hatStyle) {
        case 'top':
          // Top hat
          for (let y = headY - 10; y < headY - 2; y++) {
            for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
              elements.push(
                <rect key={`tophat-crown-${x}-${y}`} x={x} y={y} width="1" height="1" 
                  fill="#000000" className="pixel" />
              );
            }
          }
          // Brim
          for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
            elements.push(
              <rect key={`tophat-brim-${x}`} x={x} y={headY - 2} width="1" height="2" 
                fill="#000000" className="pixel" />
            );
          }
          // Band
          if (isWealthy) {
            for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
              elements.push(
                <rect key={`tophat-band-${x}`} x={x} y={headY - 5} width="1" height="1" 
                  fill={appearance.palette.accent} className="pixel" />
              );
            }
          }
          break;
          
        case 'beret':
          // Soft beret shape
          for (let y = headY - 3; y < headY + 4; y++) {
            for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const beretShape = distFromCenter < headDim.width / 2 + 3 - Math.abs(y - headY);
              
              if (beretShape) {
                const tilt = x > centerX ? -1 : 0;
                elements.push(
                  <rect key={`beret-${x}-${y}`} x={x} y={y + tilt} width="1" height="1" 
                    fill={headgearColor} className="pixel" />
                );
              }
            }
          }
          break;
          
        case 'fez':
          // Cylindrical fez
          for (let y = headY - 6; y < headY + 1; y++) {
            for (let x = headX + 3; x < headX + headDim.width - 3; x++) {
              elements.push(
                <rect key={`fez-${x}-${y}`} x={x} y={y} width="1" height="1" 
                  fill="#8B0000" className="pixel" />
              );
            }
          }
          // Tassel
          for (let t = 0; t < 4; t++) {
            elements.push(
              <rect key={`fez-tassel-${t}`} x={centerX} y={headY - 6 - t} 
                width="1" height="1" fill="#000000" className="pixel" />
            );
          }
          break;
          
        default:
          // Generic cap
          elements.push(
            <rect key="cap-crown" x={headX - 1} y={headY - 4} 
              width={headDim.width + 2} height="5" fill={headgearColor} className="pixel" />
          );
          if (name.includes('peaked')) {
            // Add peak/visor
            for (let x = headX; x < headX + headDim.width; x++) {
              elements.push(
                <rect key={`cap-peak-${x}`} x={x} y={headY + 1} width="1" height="1" 
                  fill={createShadow(headgearColor, 0.7)} className="pixel" />
              );
            }
          }
      }
    }
    
    // Helmets
    else if (name.includes('helmet')) {
      const helmetMaterial = material.includes('plate') ? '#C0C0C0' : 
                           material.includes('bronze') ? '#CD7F32' : '#A0A0A0';
      
      // Main helmet shape
      for (let y = headY - 4; y < headY + headDim.height - 2; y++) {
        for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
          const distFromCenter = Math.abs(x - centerX);
          const faceArea = y > headY + 2 && y < headY + headDim.height - 4 && 
                          distFromCenter < headDim.width / 2 - 3;
          
          if (!faceArea) {
            const edgeHighlight = distFromCenter < 2 || x === headX - 2;
            elements.push(
              <rect key={`helmet-${x}-${y}`} x={x} y={y} width="1" height="1" 
                fill={edgeHighlight ? createHighlight(helmetMaterial, 1.3) : helmetMaterial} 
                className="pixel" />
            );
          }
        }
      }
      
      // Nose guard
      if (name.includes('norman') || name.includes('knight')) {
        for (let y = headY + 2; y < headY + 10; y++) {
          elements.push(
            <rect key={`nose-guard-${y}`} x={centerX} y={y} width="2" height="1" 
              fill={helmetMaterial} className="pixel" />
          );
        }
      }
      
      // Plume for officers
      if (isNoble) {
        for (let p = 0; p < 10; p++) {
          const plumeX = centerX + Math.sin(p * 0.3) * 2;
          elements.push(
            <rect key={`plume-${p}`} x={plumeX} y={headY - 5 - p} width="2" height="1" 
              fill={p % 2 === 0 ? "#DC143C" : "#8B0000"} className="pixel" />
          );
        }
      }
    }
    
    return elements;
  };

  // Enhanced jewelry rendering
  const renderJewelry = () => {
    if (!appearance.jewelry || appearance.jewelry.length === 0) return null;
    
    const elements = [];
    
    appearance.jewelry.forEach((piece, index) => {
      const material = piece.material;
      const style = piece.style;
      
      // Material colors
      const materialColors = {
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        pearl: '#FFF8DC',
        bone: '#FFFFF0',
        wood: '#8B4513'
      };
      
      const jewelryColor = materialColors[material] || '#FFD700';
      const gemColors = piece.gems || ['#DC143C', '#4169E1', '#50C878'];
      
      switch (piece.type) {
        case 'necklace':
          const necklaceY = headY + headDim.height + 6;
          const centerX = headX + Math.floor(headDim.width / 2);
          
          // Chain style variations
          const chainPattern = style === 'delicate' ? 2 : 
                             style === 'chunky' ? 1 : 3;
          
          for (let x = centerX - 10; x <= centerX + 10; x++) {
            const distFromCenter = Math.abs(x - centerX);
            const yOffset = Math.floor(distFromCenter * 0.4);
            
            if (x % chainPattern === 0) {
              elements.push(
                <rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} 
                  width={style === 'chunky' ? 2 : 1} height="1" 
                  fill={jewelryColor} className="pixel" />
              );
            }
            
            // Gems or pearls
            if (material === 'gems' && x % 5 === 0) {
              const gemColor = gemColors[Math.abs(x / 5) % gemColors.length];
              elements.push(
                <rect key={`necklace-gem-${index}-${x}`} x={x} y={necklaceY + yOffset} 
                  width="1" height="1" fill={gemColor} className="pixel" />
              );
            }
          }
          
          // Pendant for ornate styles
          if (style === 'ornate') {
            elements.push(
              <rect key={`pendant-base-${index}`} x={centerX - 2} y={necklaceY + 5} 
                width="5" height="4" fill={jewelryColor} className="pixel" />,
              <rect key={`pendant-gem-${index}`} x={centerX} y={necklaceY + 6} 
                width="1" height="2" fill={gemColors[0]} className="pixel" />
            );
          }
          break;
          
        case 'earrings':
          const earY = headY + Math.floor(headDim.height * 0.4) + 4;
          
          if (style === 'simple') {
            // Studs
            elements.push(
              <rect key={`earring-l-${index}`} x={headX - 1} y={earY} 
                width="1" height="1" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-r-${index}`} x={headX + headDim.width} y={earY} 
                width="1" height="1" fill={jewelryColor} className="pixel" />
            );
          } else if (style === 'ornate' || style === 'delicate') {
            // Dangling earrings
            const length = style === 'ornate' ? 4 : 3;
            for (let d = 0; d < length; d++) {
              elements.push(
                <rect key={`earring-l-drop-${index}-${d}`} x={headX - 1} y={earY + d} 
                  width="1" height="1" 
                  fill={d === length - 1 && material === 'gems' ? gemColors[0] : jewelryColor} 
                  className="pixel" />,
                <rect key={`earring-r-drop-${index}-${d}`} x={headX + headDim.width} y={earY + d} 
                  width="1" height="1" 
                  fill={d === length - 1 && material === 'gems' ? gemColors[0] : jewelryColor} 
                  className="pixel" />
              );
            }
          }
          break;
          
        case 'bracelet':
          // Visible on wrists
          const wristY = 58;
          const leftWristX = 16;
          const rightWristX = 44;
          
          const braceletWidth = style === 'chunky' ? 3 : 
                               style === 'delicate' ? 1 : 2;
          
          for (let w = 0; w < braceletWidth; w++) {
            for (let x = 0; x < 6; x++) {
              if (style === 'ornate' && x % 2 === 0) {
                elements.push(
                  <rect key={`bracelet-l-gem-${index}-${w}-${x}`} 
                    x={leftWristX + x} y={wristY + w} 
                    width="1" height="1" fill={gemColors[0]} className="pixel" />,
                  <rect key={`bracelet-r-gem-${index}-${w}-${x}`} 
                    x={rightWristX + x} y={wristY + w} 
                    width="1" height="1" fill={gemColors[0]} className="pixel" />
                );
              } else {
                elements.push(
                  <rect key={`bracelet-l-${index}-${w}-${x}`} 
                    x={leftWristX + x} y={wristY + w} 
                    width="1" height="1" fill={jewelryColor} className="pixel" />,
                  <rect key={`bracelet-r-${index}-${w}-${x}`} 
                    x={rightWristX + x} y={wristY + w} 
                    width="1" height="1" fill={jewelryColor} className="pixel" />
                );
              }
            }
          }
          break;
          
        case 'circlet':
          // Forehead jewelry
          const circletY = headY + 2;
          
          for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
            if (style === 'ornate' && (x - headX) % 4 === 0) {
              elements.push(
                <rect key={`circlet-gem-${index}-${x}`} x={x} y={circletY} 
                  width="1" height="1" fill={gemColors[0]} className="pixel" />
              );
            } else if ((x - headX) % 2 === 0 || style !== 'delicate') {
              elements.push(
                <rect key={`circlet-${index}-${x}`} x={x} y={circletY} 
                  width="1" height="1" fill={jewelryColor} className="pixel" />
              );
            }
          }
          
          // Center piece
          if (style === 'ornate') {
            const centerX = headX + Math.floor(headDim.width / 2);
            elements.push(
              <rect key={`circlet-center-${index}`} x={centerX - 1} y={circletY - 1} 
                width="3" height="3" fill={jewelryColor} className="pixel" />,
              <rect key={`circlet-center-gem-${index}`} x={centerX} y={circletY} 
                width="1" height="1" fill={gemColors[0]} className="pixel" />
            );
          }
          break;
          
        case 'ring':
          // Visible on fingers (simplified)
          const handY = 60;
          const leftHandX = 18;
          const rightHandX = 42;
          
          elements.push(
            <rect key={`ring-l-${index}`} x={leftHandX} y={handY} 
              width="1" height="1" fill={jewelryColor} className="pixel" />,
            <rect key={`ring-r-${index}`} x={rightHandX} y={handY} 
              width="1" height="1" fill={jewelryColor} className="pixel" />
          );
          break;
      }
    });
    
    return elements;
  };

  // Render markings (scars, tattoos, etc.)
  const renderMarkings = () => {
    if (!appearance.markings || appearance.markings.length === 0) return null;
    
    const elements = [];
    
    appearance.markings.forEach((marking, index) => {
      const markingColor = marking.color;
      
      switch (marking.type) {
        case 'scar':
          // Facial scars
          if (marking.location === 'face') {
            const scarX = headX + (rand(500 + index) > 0.5 ? 5 : headDim.width - 7);
            const scarY = headY + Math.floor(headDim.height * 0.3);
            const scarLength = marking.size === 'large' ? 5 : 
                              marking.size === 'medium' ? 3 : 2;
            
            for (let i = 0; i < scarLength; i++) {
              elements.push(
                <rect key={`scar-${index}-${i}`} x={scarX + i} y={scarY + i} 
                  width="1" height="1" fill={skinHighlight} className="pixel" />
              );
            }
          }
          break;
          
        case 'tattoo':
          // Cultural tattoos
          if (marking.location === 'face' && culturalZone === 'OCEANIA') {
            // Polynesian-style face tattoo
            const pattern = marking.pattern || 'lines';
            
            if (pattern === 'lines') {
              for (let y = 0; y < 4; y++) {
                for (let x = -2; x <= 2; x++) {
                  if (Math.abs(x) + y < 4) {
                    elements.push(
                      <rect key={`tattoo-${index}-${x}-${y}`} 
                        x={headX + Math.floor(headDim.width / 2) + x} 
                        y={headY + headDim.height - 6 + y} 
                        width="1" height="1" fill={markingColor} className="pixel" />
                    );
                  }
                }
              }
            }
          }
          break;
          
        case 'paint':
          // War paint or ceremonial paint
          if (marking.location === 'face') {
            const paintPattern = marking.pattern || 'stripes';
            
            if (paintPattern === 'stripes') {
              elements.push(
                <rect key={`paint-stripe1-${index}`} x={headX + 2} y={headY + 10} 
                  width={headDim.width - 4} height="1" fill={markingColor} className="pixel" />,
                <rect key={`paint-stripe2-${index}`} x={headX + 2} y={headY + 13} 
                  width={headDim.width - 4} height="1" fill={markingColor} className="pixel" />
              );
            } else if (paintPattern === 'dots') {
              for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                  if ((x + y) % 2 === 0) {
                    elements.push(
                      <rect key={`paint-dot-${index}-${x}-${y}`} 
                        x={headX + Math.floor(headDim.width / 2) - 3 + x * 3} 
                        y={headY + 8 + y * 3} 
                        width="1" height="1" fill={markingColor} className="pixel" />
                    );
                  }
                }
              }
            }
          }
          break;
          
        case 'beauty_mark':
          // Beauty mark/mole
          const beautyX = headX + (marking.location === 'left' ? 5 : headDim.width - 5);
          const beautyY = headY + Math.floor(headDim.height * 0.6);
          
          elements.push(
            <rect key={`beauty-mark-${index}`} x={beautyX} y={beautyY} 
              width="1" height="1" fill="#000000" className="pixel" />
          );
          break;
          
        case 'freckles':
          // Scattered freckles (already handled in face rendering)
          break;
      }
    });
    
    return elements;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ imageRendering: 'pixelated' }} className={className}>
      <defs>
        <style>{`.pixel { shape-rendering: crispEdges; }`}</style>
        {renderBackground()}
      </defs>
      
      {/* Background gradient */}
      <rect x="0" y="0" width="64" height="64" fill="url(#bgGradient)" />
      
      {/* Subtle texture overlay */}
      <rect x="0" y="0" width="64" height="64" fill="url(#bgGradient)" 
        style={{ filter: 'url(#texture)', opacity: 0.05 }} />
      
      {/* Body and clothing */}
      {renderBody()}
      
      {/* Head */}
      {renderHead()}
      
      {/* Hair (before headgear) */}
      {renderHair()}
      
      {/* Facial features */}
      {renderEyes()}
      {renderNose()}
      {renderMouth()}
      {renderFacialHair()}
      
      {/* Markings (scars, tattoos, etc.) */}
      {renderMarkings()}
      
      {/* Accessories */}
      {renderHeadgear()}
      {renderJewelry()}
    </svg>
  );
};

export default ProceduralPortrait;
