/**
 * Map Context Service
 * Analyzes the map to understand terrain composition and appropriate quest types
 */

import { MapData, MapTile, TerrainType } from '../types';
import { TerrainStructure } from '../types';

export interface MapContext {
  primaryTerrain: 'ocean' | 'land' | 'mixed' | 'island' | 'coastal';
  waterPercentage: number;
  landPercentage: number;
  hasStructures: boolean;
  structureTypes: string[];
  hasCities: boolean;
  hasRoads: boolean;
  hasRuins: boolean;
  hasPorts: boolean;
  climate: 'arctic' | 'temperate' | 'tropical' | 'desert' | 'mediterranean';
  isInhabited: boolean;
  terrainTypes: Set<string>;
}

/**
 * Analyze the map to understand its context
 */
export function analyzeMapContext(mapData: MapData): MapContext {
  if (!mapData || !mapData.tiles) {
    return getDefaultContext();
  }

  const tiles = mapData.tiles.flat();
  const totalTiles = tiles.length;
  
  // Count terrain types
  let waterTiles = 0;
  let landTiles = 0;
  const terrainTypes = new Set<string>();
  
  tiles.forEach(tile => {
    if (!tile) return;
    
    terrainTypes.add(tile.terrain);
    
    // Check if it's water
    if (isWaterTerrain(tile.terrain)) {
      waterTiles++;
    } else {
      landTiles++;
    }
  });
  
  const waterPercentage = (waterTiles / totalTiles) * 100;
  const landPercentage = (landTiles / totalTiles) * 100;
  
  // Determine primary terrain type
  let primaryTerrain: MapContext['primaryTerrain'];
  if (waterPercentage > 85) {
    primaryTerrain = 'ocean';
  } else if (waterPercentage < 15) {
    primaryTerrain = 'land';
  } else if (waterPercentage > 60 && landTiles > 50) {
    primaryTerrain = 'island';
  } else if (waterPercentage > 30 && waterPercentage < 70) {
    primaryTerrain = 'coastal';
  } else {
    primaryTerrain = 'mixed';
  }
  
  // Analyze structures
  const structures = mapData.terrainStructures || [];
  const structureTypes = [...new Set(structures.map(s => s.structureType || s.type))];
  const hasStructures = structures.length > 0;
  const hasCities = structures.some(s => 
    s.structureType === 'city' || 
    s.structureType === 'settlement' ||
    s.structureType === 'hamlet'
  );
  const hasRoads = structures.some(s => 
    s.structureType === 'road' || 
    s.structureType === 'bridge'
  );
  const hasRuins = structures.some(s => 
    s.structureType === 'ruins' ||
    s.structureType === 'ancient_ruins'
  );
  const hasPorts = structures.some(s => 
    s.structureType === 'port' ||
    s.structureType === 'harbor' ||
    s.structureType === 'dock'
  );
  
  // Determine climate based on terrain types
  const climate = determineClimate(terrainTypes);
  
  // Check if inhabited
  const isInhabited = hasCities || 
    (mapData.npcs && mapData.npcs.length > 0) ||
    hasRoads;
  
  return {
    primaryTerrain,
    waterPercentage,
    landPercentage,
    hasStructures,
    structureTypes,
    hasCities,
    hasRoads,
    hasRuins,
    hasPorts,
    climate,
    isInhabited,
    terrainTypes
  };
}

/**
 * Check if a terrain type is water
 */
function isWaterTerrain(terrain: string): boolean {
  // Handle undefined terrain
  if (!terrain || typeof terrain !== 'string') {
    return false;
  }
  
  const waterTerrains = [
    'DEEP_OCEAN',
    'SHALLOW_OCEAN',
    'OPEN_OCEAN',
    'COASTAL_WATER',
    'FRESHWATER_LAKE',
    'RIVER',
    'water',
    'ocean',
    'sea',
    'lake'
  ];
  
  return waterTerrains.some(water => 
    terrain.toLowerCase().includes(water.toLowerCase())
  );
}

/**
 * Determine climate from terrain types
 */
function determineClimate(terrainTypes: Set<string>): MapContext['climate'] {
  const terrainString = Array.from(terrainTypes).join(' ').toLowerCase();
  
  if (terrainString.includes('ice') || terrainString.includes('tundra') || terrainString.includes('arctic')) {
    return 'arctic';
  }
  if (terrainString.includes('desert') || terrainString.includes('sand')) {
    return 'desert';
  }
  if (terrainString.includes('tropical') || terrainString.includes('jungle') || terrainString.includes('rainforest')) {
    return 'tropical';
  }
  if (terrainString.includes('mediterranean') || terrainString.includes('olive')) {
    return 'mediterranean';
  }
  
  return 'temperate';
}

/**
 * Get default context when map data is unavailable
 */
function getDefaultContext(): MapContext {
  return {
    primaryTerrain: 'mixed',
    waterPercentage: 30,
    landPercentage: 70,
    hasStructures: false,
    structureTypes: [],
    hasCities: false,
    hasRoads: false,
    hasRuins: false,
    hasPorts: false,
    climate: 'temperate',
    isInhabited: false,
    terrainTypes: new Set()
  };
}

/**
 * Check if a quest type is appropriate for the map context
 */
export function isQuestAppropriateForContext(
  questCategory: string,
  questTitle: string,
  mapContext: MapContext,
  era: string
): boolean {
  // Ocean maps - only allow ocean-appropriate quests
  if (mapContext.primaryTerrain === 'ocean') {
    const oceanQuests = [
      'exploration',
      'survival',
      'navigation',
      'fishing',
      'weather'
    ];
    
    // Block land-specific quests
    const blockedTerms = [
      'caravan',
      'road',
      'village',
      'farm',
      'mine',
      'forest',
      'mountain',
      'city',
      'settlement'
    ];
    
    const questLower = questTitle.toLowerCase();
    if (blockedTerms.some(term => questLower.includes(term))) {
      return false;
    }
    
    return oceanQuests.includes(questCategory);
  }
  
  // Island maps - allow both ocean and limited land quests
  if (mapContext.primaryTerrain === 'island') {
    const blockedTerms = [
      'caravan route', // Can't have long caravan routes on small islands
      'highway',
      'empire'
    ];
    
    const questLower = questTitle.toLowerCase();
    return !blockedTerms.some(term => questLower.includes(term));
  }
  
  // No cities/settlements - block urban quests
  if (!mapContext.hasCities && !mapContext.isInhabited) {
    const urbanTerms = [
      'market',
      'merchant',
      'guild',
      'noble',
      'palace',
      'court',
      'diplomat'
    ];
    
    const questLower = questTitle.toLowerCase();
    if (urbanTerms.some(term => questLower.includes(term))) {
      return false;
    }
  }
  
  // Ancient era - block anachronistic quests
  if (era === 'ancient' || era === 'antiquity') {
    const anachronisticTerms = [
      'railroad',
      'telegraph',
      'factory',
      'industrial',
      'corporation'
    ];
    
    const questLower = questTitle.toLowerCase();
    if (anachronisticTerms.some(term => questLower.includes(term))) {
      return false;
    }
  }
  
  // No roads - block road-dependent quests
  if (!mapContext.hasRoads) {
    const roadTerms = [
      'highway',
      'road patrol',
      'clear the roads'
    ];
    
    const questLower = questTitle.toLowerCase();
    if (roadTerms.some(term => questLower.includes(term))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get appropriate quest themes for the map context
 */
export function getAppropriateQuestThemes(mapContext: MapContext, era: string): string[] {
  const themes: string[] = [];
  
  // Ocean-based themes
  if (mapContext.primaryTerrain === 'ocean' || mapContext.waterPercentage > 60) {
    themes.push('naval_exploration', 'sea_survival', 'fishing', 'navigation', 'weather_prediction');
    
    if (era !== 'ancient') {
      themes.push('piracy', 'naval_trade');
    }
  }
  
  // Land-based themes
  if (mapContext.landPercentage > 40) {
    themes.push('exploration', 'survival');
    
    if (mapContext.hasCities) {
      themes.push('trade', 'social', 'diplomacy');
    }
    
    if (mapContext.hasRuins) {
      themes.push('archaeology', 'treasure_hunting', 'scholarship');
    }
    
    if (mapContext.hasRoads && era !== 'ancient') {
      themes.push('caravan_protection', 'road_maintenance');
    }
  }
  
  // Climate-specific themes
  switch (mapContext.climate) {
    case 'arctic':
      themes.push('ice_survival', 'hunting', 'shelter_building');
      break;
    case 'desert':
      themes.push('water_finding', 'oasis_discovery', 'desert_navigation');
      break;
    case 'tropical':
      themes.push('disease_prevention', 'jungle_exploration');
      break;
  }
  
  return themes;
}