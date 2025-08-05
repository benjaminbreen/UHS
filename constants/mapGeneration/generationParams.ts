/**
 * constants/mapGeneration/generationParams.ts - Enhanced with visual effect parameters
 */
import { TILE_SIZE_PX } from './dimensions';

// ===== NOISE GENERATION PARAMETERS =====
export const NOISE_SCALE_LANDMASS = 0.04;
export const NOISE_SCALE_ALTITUDE = 0.08;
export const NOISE_SCALE_BIOME_VARIATION = 0.15;
export const NOISE_SCALE_HUMIDITY = 0.07;
export const NOISE_SCALE_DESERTIFICATION = 0.1;
export const NOISE_SCALE_COASTLINE_PERTURB = 0.4;
export const COASTLINE_PERTURB_AMOUNT = TILE_SIZE_PX * 0.5;

// Noise scales for quality calculations
export const NOISE_SCALE_QUALITIES = 0.12;
export const NOISE_SCALE_MICRO_VARIATION = 0.3;

// Temperature and thermal scales
export const NOISE_SCALE_TEMPERATURE = 0.06;
export const NOISE_SCALE_THERMAL = 0.09;

export const LAND_THRESHOLD_BASE = 0.45;

// Archetype specific ratios
export const RIVER_PORT_WATER_CORRIDOR_RATIO = 0.25;
export const STANDARD_PORT_LAND_SIDE_RATIO = 0.6;
export const ATOLL_LAGOON_RADIUS_RATIO = 0.3;
export const ATOLL_REEF_RING_INNER_RADIUS_RATIO = 0.35;
export const ATOLL_REEF_RING_OUTER_RADIUS_RATIO = 0.55;
export const ATOLL_REEF_DENSITY = 0.7;
export const PENINSULA_LAND_RATIO = 0.6;
export const BAY_WATER_RATIO = 0.7;
export const BAY_OPENING_WIDTH_FACTOR = 0.2;
export const FRESHWATER_LAKE_RADIUS_RATIO = 0.35;
export const SHOALS_ARCHETYPE_LAND_PATCH_CHANCE = 0.15;
export const SHOALS_ARCHETYPE_SHOAL_TILE_DENSITY = 0.3;
export const OPEN_OCEAN_LAND_FALLOFF = 0.1;
export const OPEN_OCEAN_REEF_CHANCE = 0.05;

// ===== NEW VISUAL EFFECT PARAMETERS =====

// Edge dithering parameters
export const DITHER_PATTERNS = {
  ORGANIC: 'organic',      // Natural, irregular pattern
  GEOMETRIC: 'geometric',  // More structured pattern
  FRACTAL: 'fractal',     // Self-similar at different scales
  WAVE: 'wave'           // Wave-like patterns for water edges
} as const;

export const EDGE_DITHER_DENSITY = 0.65; // How dense the dithering is (0-1)
export const EDGE_DITHER_SPREAD = 2.5;   // How many tiles the dithering spreads
export const EDGE_NOISE_SCALE = 0.25;    // Scale of noise for edge variation
export const EDGE_COMPLEXITY = 3;        // Number of octaves for edge noise

// Texture parameters
export const TEXTURE_SCALE = 0.5;        // Scale of texture patterns
export const TEXTURE_OPACITY = 0.3;      // Opacity of texture overlay
export const TEXTURE_VARIETY = 4;        // Number of texture variations per biome

// Shadow parameters
export const SHADOW_DIRECTION = 315;     // Northwest light source (degrees)
export const SHADOW_LENGTH = 0.3;        // Shadow length relative to tile size
export const SHADOW_OPACITY = 0.25;      // Shadow darkness
export const SHADOW_BLUR = 0.2;          // Shadow softness

// Particle effect parameters
export const PARTICLE_DENSITY = {
  SPARSE: 0.05,
  MEDIUM: 0.15,
  DENSE: 0.35
} as const;

export const PARTICLE_TYPES = {
  STEAM: 'steam',
  BIRDS: 'birds',
  LEAVES: 'leaves',
  SAND: 'sand',
  SNOW: 'snow',
  BUBBLES: 'bubbles',
  FIREFLIES: 'fireflies',
  WAVES: 'waves'
} as const;

// Animation parameters
export const WATER_ANIMATION_SPEED = 0.002;  // Speed of water animations
export const PARTICLE_ANIMATION_SPEED = 0.001; // Speed of particle movements
export const WIND_DIRECTION = 45;            // Northeast wind
export const WIND_STRENGTH = 0.3;            // Wind effect strength

// Depth and lighting
export const ELEVATION_SHADOW_SCALE = 0.05;  // How much elevation affects shadows
export const AMBIENT_OCCLUSION_RADIUS = 1.5; // Radius for AO effect
export const AMBIENT_OCCLUSION_STRENGTH = 0.2; // AO darkness

// Color variation parameters
export const COLOR_VARIATION_SCALE = 0.15;   // Scale of color noise
export const COLOR_VARIATION_AMOUNT = 0.08;  // How much colors can vary
export const SEASONAL_TINT_STRENGTH = 0.1;   // Seasonal color overlay strength

// Detail level parameters
export const DETAIL_DISTANCE_NEAR = 5;       // Tiles to show maximum detail
export const DETAIL_DISTANCE_FAR = 15;       // Tiles to show minimum detail
export const LOD_LEVELS = 3;                 // Levels of detail