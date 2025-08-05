/**
 * constants/mapGeneration/features/urban.ts - Urban generation parameters
 */

export const URBAN_AREA_COUNT_BASE = 1;
export const URBAN_AREA_MIN_SIZE_BASE = 2;
export const URBAN_AREA_MAX_SIZE_BASE = 3;

// ===== ENHANCED URBAN GENERATION PARAMETERS =====
export const URBAN_CLUSTER_COUNT_BASE = 2;          // Base number of urban clusters
export const URBAN_CLUSTER_COUNT_MAX = 4;           // Maximum urban clusters
export const URBAN_CLUSTER_RADIUS_MIN = 8;          // Minimum cluster radius
export const URBAN_CLUSTER_RADIUS_MAX = 15;         // Maximum cluster radius

// Urban hierarchy sizing (total tiles in cluster)
export const HAMLET_SIZE_MIN = 1;
export const HAMLET_SIZE_MAX = 3;
export const LOW_DENSITY_CITY_SIZE_MIN = 4;
export const LOW_DENSITY_CITY_SIZE_MAX = 8;
export const DENSE_CITY_SIZE_MIN = 6;
export const DENSE_CITY_SIZE_MAX = 12;

// Strategic location bonuses
export const PROTECTED_HARBOR_BONUS = 2.0;          // Bonus for protected inlets
export const RIVER_MOUTH_BONUS = 1.8;               // Bonus for river mouths
export const DEEP_HARBOR_BONUS = 1.5;               // Bonus for deep water access
export const COASTAL_ACCESS_BONUS = 1.2;            // Bonus for coastal access
export const RIVER_ACCESS_BONUS = 1.3;              // Bonus for river access

// Cluster density gradient parameters
export const DENSITY_GRADIENT_FACTOR = 0.7;         // How much density decreases with distance
export const MIN_INTER_CLUSTER_DISTANCE = 20;       // Minimum distance between cluster centers
