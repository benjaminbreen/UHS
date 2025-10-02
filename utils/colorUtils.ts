import { ClimateType, Tile, BiomeType, ClothingPiece, Item } from '../types';
import { 
    ALTITUDE_TIER_COLOR_ADJUSTMENTS, 
    DESERT_TIER_COLOR_ADJUSTMENTS, 
    HILLS_TIER_COLOR_ADJUSTMENTS, 
    SCRUB_TIER_COLOR_ADJUSTMENTS, 
    DENSE_FOREST_TIER_COLOR_ADJUSTMENTS, 
    RIVERBANK_TIER_COLOR_ADJUSTMENTS,
    TUNDRA_TIER_COLOR_ADJUSTMENTS, 
    STEPPE_TIER_COLOR_ADJUSTMENTS, 
    VOLCANIC_SOIL_TIER_COLOR_ADJUSTMENTS, 
    VOLCANIC_ROCK_TIER_COLOR_ADJUSTMENTS,
    MOUNTAIN_TIER_COLOR_ADJUSTMENTS,
    GRASSLAND_ALTITUDE_BANDS, 
    FOREST_ALTITUDE_BANDS, 
    JUNGLE_ALTITUDE_BANDS, 
    DENSE_FOREST_ALTITUDE_BANDS,
    DESERT_ALTITUDE_BANDS, 
    HILLS_ALTITUDE_BANDS, 
    MOUNTAIN_ALTITUDE_BANDS, 
    SCRUB_ALTITUDE_BANDS, 
    RIVERBANK_ALTITUDE_BANDS,
    TUNDRA_ALTITUDE_BANDS, 
    STEPPE_ALTITUDE_BANDS, 
    VOLCANIC_SOIL_ALTITUDE_BANDS, 
    VOLCANIC_ROCK_ALTITUDE_BANDS
} from '../constants/mapGeneration/biomes/altitude';
import { BIOME_COLORS, CLIMATE_WATER_COLORS } from '../constants/mapGeneration/biomes/colors';
import { ValueNoise } from './noise';

export const getQualityGradientColor = (value: number, reverse: boolean = false): string => {
  const h = reverse ? (1 - value) * 120 : value * 120; // Hue from 0 (red) to 120 (green)
  return `hsl(${h}, 100%, 50%)`;
};

// Enhanced lens-specific color gradients with beautiful, vivid color schemes
export const getLensColor = (lensType: string, value: number): string => {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value));
  
  switch (lensType) {
    case 'safety':
      // Red (dangerous) to bright green (safe) with warm undertones
      if (clampedValue < 0.5) {
        // Red to amber transition for danger zones
        const localValue = clampedValue * 2; // 0-1 within this range
        return `hsl(${localValue * 30}, 90%, ${45 + localValue * 10}%)`; // 0° (red) to 30° (orange-red)
      } else {
        // Amber to bright green for safe zones  
        const localValue = (clampedValue - 0.5) * 2; // 0-1 within this range
        return `hsl(${30 + localValue * 90}, ${85 + localValue * 15}%, ${50 + localValue * 15}%)`; // 30° (amber) to 120° (green)
      }
      
    case 'biodiversity':
    case 'wildlife':
      // Deep purple/blue (barren) to vibrant green (biodiverse)
      return `hsl(${240 + clampedValue * 120}, ${70 + clampedValue * 30}%, ${40 + clampedValue * 25}%)`;
      
    case 'sacrality':
      // Deep blue (mundane) to golden yellow (sacred) with purple midtones
      if (clampedValue < 0.5) {
        const localValue = clampedValue * 2;
        return `hsl(${240 - localValue * 60}, ${80 + localValue * 20}%, ${35 + localValue * 15}%)`; // Blue to purple
      } else {
        const localValue = (clampedValue - 0.5) * 2;
        return `hsl(${180 + localValue * 75}, ${90 + localValue * 10}%, ${45 + localValue * 25}%)`; // Purple to gold
      }
      
    case 'healthiness':
      // Sickly yellow-green (unhealthy) to vibrant cyan-green (healthy)
      return `hsl(${60 + clampedValue * 120}, ${70 + clampedValue * 30}%, ${45 + clampedValue * 20}%)`;
      
    case 'flammability':
      // Cool blue (fire resistant) to intense red-orange (flammable)
      if (clampedValue < 0.3) {
        // Blue to cyan for low flammability
        const localValue = clampedValue / 0.3;
        return `hsl(${200 + localValue * 20}, 85%, ${50 + localValue * 10}%)`;
      } else if (clampedValue < 0.7) {
        // Cyan to yellow for medium flammability
        const localValue = (clampedValue - 0.3) / 0.4;
        return `hsl(${220 - localValue * 160}, ${75 + localValue * 25}%, ${55 + localValue * 10}%)`;
      } else {
        // Yellow to red-orange for high flammability
        const localValue = (clampedValue - 0.7) / 0.3;
        return `hsl(${60 - localValue * 45}, 95%, ${60 + localValue * 15}%)`;
      }
      
    default:
      // Fallback to standard red-green gradient
      return getQualityGradientColor(clampedValue);
  }
};

// Get mineral colors for the mineral deposits lens
export const getMineralColor = (mineralType: string): string => {
  const mineralColors: Record<string, string> = {
    // Primary metals
    'IRON': '#8B4513',      // Rusty brown
    'COPPER': '#B87333',    // Bronze/copper
    'GOLD': '#FFD700',      // Gold
    'SILVER': '#C0C0C0',    // Silver
    'TIN': '#D3D3D3',       // Light gray
    'LEAD': '#606060',      // Dark gray
    
    // Energy minerals
    'COAL': '#1C1C1C',      // Black
    'URANIUM': '#00FF00',   // Bright green (radioactive)
    
    // Common minerals
    'SALT': '#FFFFFF',      // White
    'CLAY': '#CD853F',      // Brown/tan
    'STONE': '#808080',     // Gray
    'FLINT': '#4B4B60',     // Dark bluish-gray
    'OCHRE': '#CC4125',     // Red-orange
    
    // Rare/modern minerals
    'LITHIUM': '#DDA0DD',   // Purple/plum
    'RARE_EARTH': '#40E0D0', // Turquoise
    'GEMS': '#FF1493',      // Deep pink
    
    // Legacy names (for backward compatibility)
    'Iron': '#8B4513',
    'Copper': '#B87333',
    'Gold': '#FFD700',
    'Silver': '#C0C0C0',    // Silver
    'Lead': '#696969',      // Dim gray
    'Tin': '#A8A8A8',       // Light gray
    'Coal': '#36454F',      // Charcoal
    'Salt': '#F8F8FF',      // Ghost white
    'Stone': '#708090',     // Slate gray
    'Clay': '#CD853F',      // Peru
    'Gems': '#FF1493',      // Deep pink
    'Rare Metals': '#9400D3', // Violet
  };
  
  return mineralColors[mineralType] || '#708090'; // Default to slate gray
};

export function interpolateColor(color1: string, color2: string, factor: number) {
    const result = color1.slice();
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    if (!c1 || !c2) return '#000000';
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    return `rgb(${r},${g},${b})`;
}

export const lightenColor = (color: string, amount: number): string => {
    try {
      let usePound = false;
      if (color[0] === "#") {
        color = color.slice(1);
        usePound = true;
      }
      const num = parseInt(color, 16);
      let r = (num >> 16) + Math.floor(255 * amount);
      if (r > 255) r = 255;
      if (r < 0) r = 0;
      let b = ((num >> 8) & 0x00FF) + Math.floor(255 * amount);
      if (b > 255) b = 255;
      if (b < 0) b = 0;
      let g = (num & 0x0000FF) + Math.floor(255 * amount);
      if (g > 255) g = 255;
      if (g < 0) g = 0;
      return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    } catch (e) {
        return color;
    }
};

export const addBlueishShadow = (color: string, amount: number): string => {
    try {
      let usePound = false;
      if (color[0] === "#") {
        color = color.slice(1);
        usePound = true;
      }
      const num = parseInt(color, 16);
      let r = (num >> 16) - Math.floor(127 * amount);
      if (r < 0) r = 0;
      let b = ((num >> 8) & 0x00FF) - Math.floor(100 * amount);
      if (b < 0) b = 0;
      let g = (num & 0x0000FF) - Math.floor(127 * amount);
      if (g < 0) g = 0;
      return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    } catch (e) {
        return color;
    }
};

export const getClimateWaterColors = (climate: ClimateType) => CLIMATE_WATER_COLORS[climate];


export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
};

export const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  let rNum: number, gNum: number, bNum: number;
  if (s === 0) {
    rNum = gNum = bNum = l; 
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rNum = hue2rgb(p, q, h + 1 / 3);
    gNum = hue2rgb(p, q, h);
    bNum = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(rNum * 255), g: Math.round(gNum * 255), b: Math.round(bNum * 255) };
};

export const rgbToString = (rgb: {r: number, g: number, b: number}): string => {
    return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
}

export const shadeColorHSL = (hexColor: string, lightnessMultiplier: number = 1.0, saturationMultiplier: number = 1.0, fixedLightnessAdjust: number = 0): string => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  let { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  l *= lightnessMultiplier;
  l += fixedLightnessAdjust;
  s *= saturationMultiplier;

  l = Math.max(0.05, Math.min(0.95, l)); 
  s = Math.max(0, Math.min(1, s));   

  const newRgb = hslToRgb(h, s, l);
  return rgbToString(newRgb);
};

export const blendColors = (color1Hex: string, color2Hex: string, ratio: number): string => {
    const rgb1 = hexToRgb(color1Hex);
    const rgb2 = hexToRgb(color2Hex);
    if (!rgb1 || !rgb2) return color1Hex; 

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
    return rgbToString({r, g, b});
};

function getTileColorVariation(baseColor: string, x: number, y: number, seed: number, variation: number = 0.06): string {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return baseColor;

    // Simple pseudo-random hash function for deterministic noise without a class instance
    const betterHash = (x_h: number, y_h: number, seed_h: number): number => {
        let h = seed_h + x_h * 374761393 + y_h * 668265263;
        h = (h ^ (h >>> 13)) * 1274126177;
        h = h ^ (h >>> 16);
        return (h & 0x7FFFFFFF) / 0x7FFFFFFF;
    };

    const noise = (betterHash(x, y, seed) - 0.5) * 2; // -1 to 1
    const brightnessFactor = 1 + (noise * variation);
    
    const r = Math.max(0, Math.min(255, Math.round(rgb.r * brightnessFactor)));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g * brightnessFactor)));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b * brightnessFactor)));

    return rgbToString({r, g, b});
}


export const getTileRenderColor = (tile: Tile, climate: ClimateType, seed: number, season?: 'spring' | 'summer' | 'fall' | 'winter', mapAreaName?: string): string => {
    const currentBiome = tile.biome; 
    const waterColors = CLIMATE_WATER_COLORS[climate];
    
    // Winter-specific colors for cold climates
    const isWinterInColdClimate = climate === ClimateType.COLD && season === 'winter';
    const shouldApplyWinterColors = isWinterInColdClimate && tile.isLand;
    
    // Special rendering for ethereal biomes (new system)
    if (tile.biome === BiomeType.AIR) {
        const noise = new ValueNoise(seed + tile.x * 7 + tile.y * 11);
        const variation = noise.octaveNoise(tile.x * 0.05, tile.y * 0.05, 2, 0.5, 2.0);
        
        // AIR rendering depends on climate
        switch (climate) {
            case ClimateType.TEMPERATE:
                // Fluffy white clouds for Heaven
                const cloudBrightness = 240 + Math.floor(variation * 15);
                return `rgb(${cloudBrightness}, ${cloudBrightness}, ${Math.min(255, cloudBrightness + 5)})`;
                
            case ClimateType.ARID:
                // Dark void with stars for Space
                if (noise.random() > 0.98) {
                    // Occasional star
                    const starBrightness = 180 + Math.floor(noise.random() * 75);
                    return `rgb(${starBrightness}, ${starBrightness}, ${starBrightness})`;
                }
                // Deep space darkness
                const darkness = Math.floor(variation * 15);
                return `rgb(${darkness}, ${darkness}, ${darkness + 5})`;
                
            case ClimateType.COLD:
                // Ice crystals - pale blue-white
                const iceBrightness = 220 + Math.floor(variation * 30);
                const blueShift = 10 + Math.floor(variation * 10);
                return `rgb(${iceBrightness - blueShift}, ${iceBrightness - 5}, ${Math.min(255, iceBrightness + blueShift)})`;
                
            case ClimateType.TROPICAL:
                // Hurricane storms - dark swirling grays
                const stormIntensity = 60 + Math.floor(variation * 80);
                return `rgb(${stormIntensity}, ${stormIntensity + 5}, ${stormIntensity + 10})`;
                
            default:
                // Default ethereal white
                return `rgb(250, 250, 255)`;
        }
    } else if (tile.biome === BiomeType.UNDERSEA) {
        // Glowing blue gradient for underwater realms
        const noise = new ValueNoise(seed + tile.x * 13 + tile.y * 17);
        const depth = noise.octaveNoise(tile.x * 0.03, tile.y * 0.03, 3, 0.6, 2.0);
        
        // Glowing blue-green underwater effect
        const blue = 100 + Math.floor(depth * 100);
        const green = 50 + Math.floor(depth * 70);
        const brightness = 30 + Math.floor(depth * 40);
        return `rgb(${brightness}, ${green}, ${blue})`;
    }
    
    // Legacy special rendering for easter egg zones (keeping for backward compatibility)
    if (mapAreaName === 'Outer Space') {
        // Space rendering - deep black with slight variation
        const noise = new ValueNoise(seed + tile.x * 7 + tile.y * 11);
        const starChance = noise.random();
        if (starChance > 0.98) {
            // Bright star
            return '#ffffff';
        } else if (starChance > 0.95) {
            // Dim star
            return '#aaaaff';
        } else {
            // Deep space with slight color variation
            const variation = noise.random() * 20;
            return `rgb(${variation}, ${variation}, ${variation + 10})`;
        }
    } else if (mapAreaName === 'Heaven') {
        // Heaven rendering - pure ethereal glowing white
        const noise = new ValueNoise(seed + tile.x * 13 + tile.y * 17);
        const cloudiness = noise.octaveNoise(tile.x * 0.03, tile.y * 0.03, 3, 0.6, 2.0);
        
        // Everything is bright and ethereal in Heaven
        const baseBrightness = 245;
        const variation = Math.floor(cloudiness * 10);
        
        if (tile.isLand) {
            // Pure glowing white with subtle variations
            const brightness = Math.min(255, baseBrightness + variation);
            // Slight pearl/golden tint
            return `rgb(${brightness}, ${brightness}, ${Math.max(240, brightness - 5)})`;
        } else {
            // Even "water" is just slightly dimmer clouds
            const brightness = Math.min(255, baseBrightness - 5 + variation);
            // Very subtle blue-white tint for variety
            return `rgb(${brightness - 5}, ${brightness - 3}, ${brightness})`;
        }
    } else if (mapAreaName === 'Undersea Kingdom') {
        // Undersea rendering - glowing blue depths
        const noise = new ValueNoise(seed + tile.x * 19 + tile.y * 23);
        const depth = noise.octaveNoise(tile.x * 0.03, tile.y * 0.03, 2, 0.5, 2.0);
        if (tile.isLand) {
            // Coral/underwater terrain - greenish blue
            const green = 80 + depth * 40;
            const blue = 120 + depth * 60;
            return `rgb(${20}, ${green}, ${blue})`;
        } else {
            // Glowing blue water
            const brightness = 40 + depth * 60;
            const blue = 140 + depth * 80;
            return `rgb(${brightness}, ${brightness + 20}, ${blue})`;
        }
    }
    
    let baseColorHex: string;
    
    // Arid mapping - amber-scrub hills, dry yellow-green-brown grasslands
    const aridMapping: Partial<Record<BiomeType, string>> = {
        [BiomeType.HILLS]: '#b2884d',      // Amber version of scrub color
        [BiomeType.MOUNTAIN]: '#b0a49c',
        [BiomeType.SCRUB]: '#c2b280',
        [BiomeType.GRASSLAND]: season === 'winter' ? '#a89668' :  // Slightly greener in winter
                               season === 'spring' ? '#b8a470' :   // Dry yellow-green-brown
                               season === 'summer' ? '#c0a668' :   // More brown/yellow in summer
                               '#b8a268',                          // Fall - dry yellow-brown
    };
    
    // Winter colors for cold climates - snow-covered or frozen variations with warmer, less blue tones
    const winterColdMapping: Partial<Record<BiomeType, string>> = {
        [BiomeType.GRASSLAND]: '#f2f0ed',     // Snow-covered grass (warm cream-white)
        [BiomeType.RIVERBANK]: '#e8e4df',     // Frozen/snowy riverbank (soft warm gray)
        [BiomeType.FOREST]: '#dcd8d2',        // Snow-dusted forest floor (warm stone)
        [BiomeType.DENSE_FOREST]: '#d0ccc6',  // Deeper snow in dense forest (warm gray)
        [BiomeType.HILLS]: '#e4e0db',         // Snow-covered hills (warm pearl)
        [BiomeType.MOUNTAIN]: '#f8f6f4',      // Snow-covered mountains (bright warm white)
        [BiomeType.SCRUB]: '#ece8e2',         // Frozen scrubland (light warm)
        [BiomeType.WETLANDS]: '#d8d4ce',      // Frozen wetlands (warm gray-brown)
        [BiomeType.STEPPE]: '#f0ece6',        // Snow-covered steppe (very light warm)
        [BiomeType.FARMLAND]: '#ebe8e3',      // Snow-covered fields (soft pearl)
        [BiomeType.OASIS]: '#dcd9d4',         // Frozen oasis (warm gray)
        [BiomeType.TAIGA]: '#e0dcd6',         // Heavy snow on taiga (medium warm)
        [BiomeType.ALPINE_MEADOW]: '#e8e4de', // Alpine meadow heavily snow-covered (warm light gray)
    };
    
    // Winter colors for temperate climates - light snow coverage with warmer tones
    const winterTemperateMapping: Partial<Record<BiomeType, string>> = {
        [BiomeType.GRASSLAND]: '#d8d4ce',     // Light snow on grass (warm light gray)
        [BiomeType.FOREST]: '#c4bfb8',        // Snow-dusted forest (warm medium gray)
        [BiomeType.DENSE_FOREST]: '#b8b3ac',  // More snow in dense forest (warm darker gray)
        [BiomeType.HILLS]: '#ccc8c2',         // Snowy hills (warm stone)
        [BiomeType.MOUNTAIN]: '#f4f2f0',      // Snow-covered mountains (bright warm white)
        [BiomeType.SCRUB]: '#dcd8d2',         // Light snow on scrubland (warm light)
        [BiomeType.TAIGA]: '#c8c4be',         // Heavy snow on temperate taiga (medium warm)
        [BiomeType.ALPINE_MEADOW]: '#d4d0ca', // Snow-covered alpine meadow (warm pearl)
        [BiomeType.FARMLAND]: '#d8d4ce',      // Snow on fields (warm light gray)
        [BiomeType.RIVERBANK]: '#c8c4be',     // Partially frozen riverbank (medium warm)
        [BiomeType.WETLANDS]: '#c0bcb6',      // Frozen wetlands (warm gray-brown)
    };

    // Winter colors for semitropical climates - occasional snow on highest peaks only
    const winterSemitropicalMapping: Partial<Record<BiomeType, string>> = {
        [BiomeType.MOUNTAIN]: '#ece8e2',      // Light snow on high mountains (light warm)
        [BiomeType.HIGH_PEAK]: '#f4f2f0',     // Snow on highest peaks (bright warm white)
    };

    // Winter colors for Mediterranean climates - occasional snow at higher elevations
    const winterMediterraneanMapping: Partial<Record<BiomeType, string>> = {
        [BiomeType.MOUNTAIN]: '#f0ede8',      // Snow-capped peaks (warm white)
        [BiomeType.HIGH_PEAK]: '#f8f6f4',     // Heavy snow on peaks (bright warm white)
        [BiomeType.ALPINE_MEADOW]: '#c0bcb6', // Light snow on high meadows (warm gray)
        [BiomeType.HILLS]: '#7a9068',         // Some snow patches on high hills
        [BiomeType.TAIGA]: '#88a898',         // Light frost on Mediterranean conifers
    };

    // Mediterranean-specific colors - realistic seasonal variation (green winter, golden summer)
    const mediterraneanMapping: Partial<Record<BiomeType, string>> = {
        [BiomeType.GRASSLAND]: season === 'winter' ? '#5a9638' :  // Rich green in winter (rainy season)
                               season === 'spring' ? '#7aa850' :   // Bright green in spring
                               season === 'summer' ? '#d4c080' :   // Golden/dry in summer
                               '#c8b474',                          // Fall - turning golden
        [BiomeType.HILLS]: season === 'winter' ? '#6a8850' :      // Green hills in winter
                           season === 'spring' ? '#7a9458' :      // Green-gold transition
                           season === 'summer' ? '#d0b070' :      // Golden California hills
                           '#c4a468',                              // Fall golden
        [BiomeType.SCRUB]: season === 'winter' ? '#5a8040' :      // Mediterranean scrub is green in winter
                           season === 'spring' ? '#6a8848' :      // Still green in spring
                           season === 'summer' ? '#a89860' :      // Dry golden-brown in summer
                           '#9a8858',                              // Fall - drying out
        [BiomeType.FOREST]: season === 'winter' ? '#4a7030' :     // Deep green in winter (evergreens + rain)
                           season === 'spring' ? '#5a7838' :      // Bright green
                           '#7a8756',                              // Olive green summer/fall
        [BiomeType.MOUNTAIN]: '#9e9482',   // Limestone grey-tan
        [BiomeType.BEACH]: '#f4e6d0',      // Sandy white beach
    };

    // Early return for roads - special handling to avoid terrain effects
    if (currentBiome === BiomeType.ROAD) {
        // Roads get slightly different colors based on era/climate but no altitude effects
        const roadBaseColor = BIOME_COLORS[BiomeType.ROAD] || '#505050';
        if (climate === ClimateType.ARID) {
            return getTileColorVariation('#6a5a4a', tile.x, tile.y, seed, 0.03); // Dusty road
        } else if (climate === ClimateType.COLD && season === 'winter') {
            return getTileColorVariation('#707070', tile.x, tile.y, seed, 0.02); // Snow-covered road
        }
        return getTileColorVariation(roadBaseColor, tile.x, tile.y, seed, 0.02); // Less variation for roads
    }
    
    // Plaza tiles - consistent stone color
    if (currentBiome === BiomeType.PLAZA) {
        const plazaBaseColor = BIOME_COLORS[BiomeType.PLAZA] || '#c8b88b';
        return getTileColorVariation(plazaBaseColor, tile.x, tile.y, seed, 0.03);
    }
    
    // Special map architectural biomes - return early to avoid terrain effects
    const specialMapBiomes = [
        BiomeType.WALL, BiomeType.WALL_GATE,
        BiomeType.FLOOR_STONE, BiomeType.FLOOR_WOOD, BiomeType.FLOOR_MARBLE, BiomeType.FLOOR_TILE,
        BiomeType.TABLE, BiomeType.CHAIR, BiomeType.BED, BiomeType.THRONE,
        BiomeType.COLUMN, BiomeType.STATUE, BiomeType.FOUNTAIN, BiomeType.ALTAR,
        BiomeType.SHELF, BiomeType.COUNTER, BiomeType.STALL, BiomeType.DISPLAY,
        BiomeType.GARDEN, BiomeType.POND, BiomeType.TREE_INDOOR,
        BiomeType.CARPET, BiomeType.CURTAIN, BiomeType.WINDOW, BiomeType.DOOR,
        BiomeType.STAIRS, BiomeType.LADDER, BiomeType.BOOKSHELF, BiomeType.DESK,
        BiomeType.PILLAR, BiomeType.SHRINE, BiomeType.BRAZIER, BiomeType.CHEST,
        BiomeType.BARREL, BiomeType.TORCH, BiomeType.STAGE, BiomeType.PAVILION,
        BiomeType.CELL
    ];
    
    if (specialMapBiomes.includes(currentBiome)) {
        const specialColor = BIOME_COLORS[currentBiome];
        if (specialColor) {
            // Less variation for architectural elements
            return getTileColorVariation(specialColor, tile.x, tile.y, seed, 0.02);
        }
    }
    
    // Early return for water tiles
    if (currentBiome === BiomeType.RIVER) return waterColors.RIVER;
    if (currentBiome === BiomeType.MAJOR_RIVER) return waterColors.MAJOR_RIVER;
    if (currentBiome === BiomeType.DEEP_OCEAN) return waterColors.DEEP;
    if (currentBiome === BiomeType.SHALLOW_OCEAN) return waterColors.SHALLOW;
    if (currentBiome === BiomeType.FRESHWATER_LAKE) return waterColors.FRESHWATER_LAKE_DEEP;
    if (currentBiome === BiomeType.REEF) return waterColors.REEF_BASE; 
    if (currentBiome === BiomeType.SHOALS_TILE) return shadeColorHSL(waterColors.REEF_BASE, 1.2, 1.1, 0.05); 
    if (currentBiome === BiomeType.HOT_SPRINGS) return BIOME_COLORS.HOT_SPRINGS; 
    if (currentBiome === BiomeType.ESTUARY) {
        const riverColor = CLIMATE_WATER_COLORS[climate]?.RIVER || BIOME_COLORS.RIVER;
        const shallowOceanColor = CLIMATE_WATER_COLORS[climate]?.SHALLOW || BIOME_COLORS.SHALLOW_OCEAN;
        return shadeColorHSL(blendColors(riverColor, shallowOceanColor, 0.7), 1.05); // More oceanic and lighter
    }
    
    // Climate-specific wetlands colors with seasonal variation
    if (currentBiome === BiomeType.WETLANDS) {
        switch(climate) {
            case ClimateType.TROPICAL:
                return '#4a7a3c'; // Rich variegated green
            case ClimateType.SEMITROPICAL:
                return '#5a6e48'; // Green similar to riverbank but deeper and brownish
            case ClimateType.TEMPERATE:
                return season === 'summer' ? '#5a7048' : // Greener in summer
                       season === 'spring' ? '#5a7048' : // Green in spring
                       '#606850'; // Brownish green in winter/fall
            case ClimateType.ARID:
                return '#7a7058'; // Gray-brown with hint of green
            case ClimateType.COLD:
                return season === 'summer' ? '#6a7858' : // Much greener in summer
                       season === 'spring' ? '#7a8060' : // Green in spring
                       '#9a9088'; // Drab gray in winter/fall
            case ClimateType.MEDITERRANEAN:
                return season === 'winter' ? '#5a6848' : // Greener in winter
                       season === 'spring' ? '#6a7250' : // Still green
                       '#7a7658'; // Drier in summer/fall
            default:
                return BIOME_COLORS[currentBiome]; // Fallback
        }
    }
    
    // Now handle land tiles with climate and seasonal variations
    // Apply climate and seasonal color mappings - check winter in cold climate FIRST
    if (shouldApplyWinterColors && winterColdMapping[currentBiome]) {
        baseColorHex = winterColdMapping[currentBiome]!;
    } else if (climate === ClimateType.TEMPERATE && season === 'winter' && winterTemperateMapping[currentBiome]) {
        // Winter snow for temperate climates
        baseColorHex = winterTemperateMapping[currentBiome]!;
    } else if (climate === ClimateType.SEMITROPICAL && season === 'winter' && winterSemitropicalMapping[currentBiome]) {
        // Winter snow for semitropical climates (only highest peaks)
        baseColorHex = winterSemitropicalMapping[currentBiome]!;
    } else if (climate === ClimateType.MEDITERRANEAN && season === 'winter' && winterMediterraneanMapping[currentBiome]) {
        // Winter snow for Mediterranean climates (mainly high elevations)
        baseColorHex = winterMediterraneanMapping[currentBiome]!;
    } else if (climate === ClimateType.ARID && aridMapping[currentBiome]) {
        baseColorHex = aridMapping[currentBiome]!;
    } else if (climate === ClimateType.MEDITERRANEAN && mediterraneanMapping[currentBiome]) {
        baseColorHex = mediterraneanMapping[currentBiome]!;
    }
    // Apply seasonal variations for grassland in OTHER climates
    else if (currentBiome === BiomeType.GRASSLAND && season === 'summer' &&
        climate !== ClimateType.ARID && climate !== ClimateType.MEDITERRANEAN) {
        // Dead grass color in summer for non-arid/mediterranean climates
        baseColorHex = '#a8a060';
    }
    // Tundra with snow in cold climates - warmer whites, only winter/spring snow
    else if (currentBiome === BiomeType.TUNDRA) {
        if (climate === ClimateType.COLD && season && ['winter', 'spring'].includes(season)) {
            baseColorHex = '#f0ede8'; // Mostly warm white with snow patches
        } else if (climate === ClimateType.COLD && season === 'summer') {
            baseColorHex = '#98a090'; // Summer tundra - greenish gray moss
        } else if (climate === ClimateType.TEMPERATE && season === 'winter') {
            baseColorHex = '#dcd8d2'; // Snow patches in winter for temperate (warm gray)
        } else {
            baseColorHex = BIOME_COLORS[currentBiome];
        }
    }
    // Special handling for TAIGA - shows snow in winter/spring only
    else if (currentBiome === BiomeType.TAIGA) {
        if (climate === ClimateType.COLD && season === 'winter') {
            baseColorHex = '#e0dcd6'; // Heavy snow (warm white)
        } else if (climate === ClimateType.COLD && season === 'spring') {
            baseColorHex = '#c8d0c8'; // Light snow with green showing through
        } else if (climate === ClimateType.TEMPERATE && season === 'winter') {
            baseColorHex = '#c8c4be'; // Moderate snow (warm medium gray)
        } else {
            baseColorHex = BIOME_COLORS[currentBiome] || '#4a6050';
        }
    }
    // Special handling for ALPINE_MEADOW - snowy in winter/spring, flowery in summer/fall
    else if (currentBiome === BiomeType.ALPINE_MEADOW) {
        if (climate === ClimateType.COLD && season && ['winter', 'spring'].includes(season)) {
            baseColorHex = '#e8e4de'; // Very snowy (warm light)
        } else if (climate === ClimateType.COLD && season === 'summer') {
            baseColorHex = '#77a842'; // Vibrant green like riverbank - summer wildflowers
        } else if (climate === ClimateType.COLD && season === 'fall') {
            baseColorHex = '#88b04a'; // Slightly brighter green - fall wildflowers
        } else if (climate === ClimateType.TEMPERATE && season === 'winter') {
            baseColorHex = '#d4d0ca'; // Snowy (warm pearl)
        } else if (climate === ClimateType.TEMPERATE && season === 'summer') {
            baseColorHex = '#7ab844'; // Bright green - temperate summer flowers
        } else if (climate === ClimateType.TEMPERATE && season === 'fall') {
            baseColorHex = '#84b850'; // Golden-green - fall flowers
        } else if (climate === ClimateType.MEDITERRANEAN && season === 'winter') {
            baseColorHex = '#c0bcb6'; // Light snow (warm gray)
        } else {
            baseColorHex = '#77a842'; // Default to vibrant riverbank green
        }
    } else {
        baseColorHex = BIOME_COLORS[currentBiome] || '#ff00ff';
    }
    
    // Special handling for salt flats with complex mineral colors and gradients
    if (currentBiome === BiomeType.SALT_FLATS) {
        // Create noise-based patterns for more realistic salt flat appearance
        const noiseX = tile.x * 0.15;
        const noiseY = tile.y * 0.15;
        const noise = new ValueNoise(seed + 777);
        
        // Generate two layers of noise for complex patterns
        const pattern1 = noise.noise(noiseX * 0.5, noiseY * 0.5);
        const pattern2 = noise.noise(noiseX * 2, noiseY * 2);
        const combinedPattern = (pattern1 * 0.7 + pattern2 * 0.3);
        
        // Base is always mostly white salt
        const baseWhite = '#f8f8f8';
        
        // Mineral streak colors (more subtle, true to life)
        const mineralColors = [
            { color: '#ffded4', threshold: 0.15 },  // Very pale pink (iron oxide traces)
            { color: '#e6f2ff', threshold: 0.1 },   // Very pale blue (mineral deposits)
            { color: '#fff4e6', threshold: 0.1 },   // Very pale orange (sulfur traces)
        ];
        
        // Determine if this area has mineral streaks
        let finalColor = baseWhite;
        const streakChance = Math.abs(combinedPattern);
        
        if (streakChance < 0.25) {  // 25% of tiles have mineral traces
            // Select mineral color based on secondary pattern
            const mineralSelect = ((tile.x * 3 + tile.y * 5) % 3);
            const mineral = mineralColors[mineralSelect];
            
            // Gradient blend - stronger color at center of streak, fading to white
            const streakIntensity = 1 - (streakChance / 0.25);  // Stronger when closer to 0
            finalColor = blendColors(baseWhite, mineral.color, streakIntensity * 0.4);  // Max 40% mineral color
        }
        
        // Add subtle variation to prevent flat appearance
        const microVariation = ((tile.x * 17 + tile.y * 23 + seed * 13) % 100) / 100;
        if (microVariation > 0.7) {
            finalColor = blendColors(finalColor, '#e8e8e8', 0.2);  // Slightly grayer patches
        }
        
        return finalColor;
    }
    
    const fixedColorBiomes = [
        BiomeType.BEACH, BiomeType.SNOW, BiomeType.HIGH_PEAK, BiomeType.URBAN, 
        BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, 
        BiomeType.RUINS, BiomeType.CLIFF, BiomeType.PALACE,
        BiomeType.HOLY_SITE, BiomeType.ACTIVE_LAVA,
        BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.CITY_CENTER,
    ];
    // Check if we should skip altitude adjustments
    const shouldSkipAltitude = fixedColorBiomes.includes(currentBiome) && 
        !(climate === ClimateType.ARID && aridMapping[currentBiome]) &&
        !(shouldApplyWinterColors && winterColdMapping[currentBiome]);
        
    if (shouldSkipAltitude) {
        baseColorHex = BIOME_COLORS[currentBiome];
    } else if (tile.isLand) {
        let tier = 0; 
        let tierAdjustments: Array<[number, number, number]> = ALTITUDE_TIER_COLOR_ADJUSTMENTS;
        let altitudeBands: number[] = [];
        
        switch(currentBiome) {
            case BiomeType.GRASSLAND: altitudeBands = GRASSLAND_ALTITUDE_BANDS; break; // Don't override baseColorHex - it was already set with seasonal/climate variations
            case BiomeType.FOREST: altitudeBands = FOREST_ALTITUDE_BANDS; break; // Don't override
            case BiomeType.DENSE_FOREST: altitudeBands = DENSE_FOREST_ALTITUDE_BANDS; tierAdjustments = DENSE_FOREST_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.JUNGLE: altitudeBands = JUNGLE_ALTITUDE_BANDS; break; // Don't override
            case BiomeType.RIVERBANK: altitudeBands = RIVERBANK_ALTITUDE_BANDS; tierAdjustments = RIVERBANK_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.SCRUB: altitudeBands = SCRUB_ALTITUDE_BANDS; tierAdjustments = SCRUB_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.HILLS: altitudeBands = HILLS_ALTITUDE_BANDS; tierAdjustments = HILLS_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.MOUNTAIN: altitudeBands = MOUNTAIN_ALTITUDE_BANDS; tierAdjustments = MOUNTAIN_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.DESERT: altitudeBands = DESERT_ALTITUDE_BANDS; tierAdjustments = DESERT_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.OASIS: break; // Already set
            case BiomeType.VOLCANIC_SOIL: altitudeBands = VOLCANIC_SOIL_ALTITUDE_BANDS; tierAdjustments = VOLCANIC_SOIL_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.VOLCANIC_ROCK: altitudeBands = VOLCANIC_ROCK_ALTITUDE_BANDS; tierAdjustments = VOLCANIC_ROCK_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.TUNDRA: altitudeBands = TUNDRA_ALTITUDE_BANDS; tierAdjustments = TUNDRA_TIER_COLOR_ADJUSTMENTS; break; // Don't override - already has seasonal snow
            case BiomeType.STEPPE: altitudeBands = STEPPE_ALTITUDE_BANDS; tierAdjustments = STEPPE_TIER_COLOR_ADJUSTMENTS; break; // Don't override
            case BiomeType.WETLANDS: break; // No tier adjustments for wetlands
        }

        if (altitudeBands.length > 0 && altitudeBands[0] !== undefined) { 
             tier = altitudeBands.filter(band => tile.altitude >= band).length;
        }
        tier = Math.min(tier, tierAdjustments.length - 1);
        const [lMult, sMult, lFix] = tierAdjustments[tier];
        baseColorHex = shadeColorHSL(baseColorHex, lMult, sMult, lFix);
    }
    
    let finalColorHex = getTileColorVariation(baseColorHex, tile.x, tile.y, seed);

    // Make arid climates warmer and more saturated
    if (climate === ClimateType.ARID) {
        const rgb = hexToRgb(finalColorHex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            // Shift hue toward warmer colors and increase saturation
            const adjustedHsl = {
                h: (hsl.h * 360 - 10 + 360) % 360 / 360, // Shift hue towards orange/red
                s: Math.min(1, hsl.s * 1.15), // Increase saturation
                l: Math.max(0.15, hsl.l * 0.95) // Slightly darker for heat
            };
            const adjustedRgb = hslToRgb(adjustedHsl.h, adjustedHsl.s, adjustedHsl.l);
            finalColorHex = rgbToString(adjustedRgb);
        }
    }
    
    // Mediterranean climates have warm golden tones
    if (climate === ClimateType.MEDITERRANEAN) {
        const rgb = hexToRgb(finalColorHex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            // Shift hue toward golden/amber colors
            const adjustedHsl = {
                h: (hsl.h * 360 - 5 + 360) % 360 / 360, // Slight shift towards golden
                s: Math.min(1, hsl.s * 0.95), // Slightly less saturated than arid
                l: Math.min(0.85, hsl.l * 1.05) // Slightly brighter, sun-bleached look
            };
            const adjustedRgb = hslToRgb(adjustedHsl.h, adjustedHsl.s, adjustedHsl.l);
            finalColorHex = rgbToString(adjustedRgb);
        }
    }
    
finalColorHex = shadeColorHSL(finalColorHex, 0.9, 0.9); // slightly toned down saturation

    
    return finalColorHex; 
};

export function getBlendCategory(biome: BiomeType): 'water' | 'veg' | 'soil' | 'stone' | 'urban' | 'special' {
  switch(biome) {
    case BiomeType.DEEP_OCEAN:
    case BiomeType.SHALLOW_OCEAN:
    case BiomeType.REEF:
    case BiomeType.SHOALS_TILE:
    case BiomeType.RIVER:
    case BiomeType.MAJOR_RIVER:
    case BiomeType.ESTUARY:
    case BiomeType.FRESHWATER_LAKE:
    case BiomeType.HOT_SPRINGS:
      return 'water';

    case BiomeType.GRASSLAND:
    case BiomeType.FOREST:
    case BiomeType.DENSE_FOREST:
    case BiomeType.JUNGLE:
    case BiomeType.RIVERBANK:
    case BiomeType.WETLANDS:
    case BiomeType.SCRUB:
    case BiomeType.STEPPE:
    case BiomeType.TUNDRA:
    case BiomeType.MANGROVE:
    case BiomeType.OASIS:
    case BiomeType.PRAIRIE:
    case BiomeType.SAVANNA:
    case BiomeType.TAIGA:
    case BiomeType.ALPINE_MEADOW:
    case BiomeType.BADLANDS:
      return 'veg';
      
    case BiomeType.BEACH:
    case BiomeType.DESERT:
    case BiomeType.SALT_FLATS:
    case BiomeType.VOLCANIC_SOIL:
      return 'soil';
      
    case BiomeType.HILLS:
    case BiomeType.MOUNTAIN:
    case BiomeType.HIGH_PEAK:
    case BiomeType.SNOW:
    case BiomeType.VOLCANIC_ROCK:
    case BiomeType.CLIFF:
      return 'stone';

    case BiomeType.HAMLET:
    case BiomeType.LOW_DENSITY_CITY:
    case BiomeType.DENSE_CITY:
    case BiomeType.URBAN:
    case BiomeType.PALACE:
    case BiomeType.FARMLAND:
    case BiomeType.MARKETPLACE:
    case BiomeType.GOVERNMENT_DISTRICT:
    case BiomeType.CITY_CENTER:
      return 'urban';

    case BiomeType.RUINS:
    case BiomeType.HOLY_SITE:
    case BiomeType.ACTIVE_LAVA:
      return 'special';
      
    default:
      return 'veg';
  }
}

const colorNameMapping: { [hex: string]: string } = {
  // Specific Fixes
  '#1A1A1A': 'nearly black',
  '#2C1810': 'dark brown',

  // Primary Brown/Earth
  '#8B4513': 'saddle brown', '#A0522D': 'sienna', '#D2691E': 'chocolate', '#CD853F': 'peru',
  '#800000': 'maroon', '#5A3D31': 'russet', '#654321': 'dark brown', '#4B3A26': 'umber',

  // Primary Red/Orange
  '#8B0000': 'dark red', '#DC143C': 'crimson', '#E34234': 'vermillion', '#FF4500': 'orange-red',
  '#FF6347': 'coral', '#B45309': 'ochre', '#D97706': 'dark orange',

  // Primary Yellow/Gold
  '#FFD700': 'gold', '#DAA520': 'goldenrod', '#FBBF24': 'amber', '#FDE68A': 'pale yellow',

  // Primary Green
  '#006400': 'dark green', '#228B22': 'forest green', '#15803D': 'green', '#32CD32': 'lime green',
  '#2F4F4F': 'dark slate', '#556B2F': 'olive drab',

  // Primary Blue/Purple
  '#000080': 'navy', '#1E40AF': 'cobalt blue', '#4169E1': 'royal blue', '#4B0082': 'indigo',
  '#800080': 'purple', '#483D8B': 'dark slate blue', '#DA70D6': 'orchid',
  
  // Primary Neutrals
  '#000000': 'black', '#696969': 'grey', '#FFFFFF': 'white', '#F5DEB3': 'beige',
  '#D2B48C': 'tan', '#BC8F8F': 'rose brown', '#E5E7EB': 'silver-white', '#C0C0C0': 'silver',
  '#4B5563': 'slate', '#3C362A': 'drab',
};

export function hexToColorName(hex: string): string {
    const upperHex = hex.toUpperCase();
    if (colorNameMapping[upperHex]) {
        return colorNameMapping[upperHex];
    }

    // Fallback to find the closest color name if exact match is not found
    const targetRgb = hexToRgb(upperHex);
    if (!targetRgb) return 'colored';

    let closestName = 'colored';
    let minDistance = Infinity;

    for (const [key, name] of Object.entries(colorNameMapping)) {
        const currentRgb = hexToRgb(key);
        if (currentRgb) {
            const distance = Math.sqrt(
                Math.pow(targetRgb.r - currentRgb.r, 2) +
                Math.pow(targetRgb.g - currentRgb.g, 2) +
                Math.pow(targetRgb.b - currentRgb.b, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestName = name;
            }
        }
    }
    
    // Add a modifier for lightness/darkness
    const { l } = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
    if (l > 0.75) return `light ${closestName}`;
    if (l < 0.25) return `dark ${closestName}`;
    
    return closestName;
}

export function formatAppearanceText(piece: (ClothingPiece | Item) | undefined, colorHex: string | undefined): string {
    if (!piece || !piece.name || piece.name.toLowerCase() === 'none' || piece.name.toLowerCase() === 'barefoot') {
        return 'Nothing Worn';
    }

    const itemName = piece.name.replace(/_/g, ' ');
    const material = piece.material || 'cloth';
    
    // Check if item already has a color in its name
    const colorWords = ['navy', 'red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'gold', 'silver', 
                       'crimson', 'emerald', 'amber', 'bronze', 'copper', 'ivory', 'ebony', 'maroon', 
                       'olive', 'teal', 'turquoise', 'coral', 'brown', 'gray', 'grey', 'royal blue',
                       'forest green', 'dark orange', 'saddle brown', 'burlywood', 'tan', 'wheat', 
                       'antique white', 'indigo', 'orange'];
    
    let hasColor = false;
    for (const color of colorWords) {
        if (itemName.toLowerCase().includes(color)) {
            hasColor = true;
            break;
        }
    }
    
    // If item already has color, just format it nicely
    if (hasColor) {
        // Check if material is already in the name
        if (piece.material && itemName.toLowerCase().includes(piece.material.toLowerCase())) {
            return `A ${itemName}`;
        }
        // Add material if not present
        return `A ${material} ${itemName}`;
    }
    
    // Item doesn't have color, so add it
    const colorName = hexToColorName(colorHex || '#FFFFFF');

    // If the item name already contains the material, just prepend the color.
    if (piece.material && itemName.toLowerCase().includes(piece.material.toLowerCase())) {
        return `A ${colorName} ${itemName}`;
    }

    // Otherwise, construct it fully.
    return `A ${colorName} ${material} ${itemName}`;
}