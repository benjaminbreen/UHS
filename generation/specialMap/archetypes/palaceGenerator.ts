/**
 * generation/specialMap/archetypes/palaceGenerator.ts
 * Generator for palace complex special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generatePalaceComplex(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Number of concentric courts (default 3)
  const concentricCourts = config.concentricCourts || 3;
  
  // Generate concentric rectangular courts
  for (let courtLevel = 0; courtLevel < concentricCourts; courtLevel++) {
    const margin = courtLevel * Math.floor(Math.min(size.width, size.height) / (concentricCourts * 2.5));
    const courtX = margin;
    const courtY = margin;
    const courtWidth = size.width - (margin * 2);
    const courtHeight = size.height - (margin * 2);
    
    if (courtWidth <= 10 || courtHeight <= 10) continue; // Skip if too small
    
    // Place walls for this court
    const gates = generateGatePositions(courtLevel, concentricCourts, courtWidth, courtHeight);
    placeWallRectangle(tiles, courtX, courtY, courtWidth, courtHeight, gates);
    
    // Fill court with appropriate flooring
    const floorType = getCourtFloorType(courtLevel, config);
    fillArea(tiles, courtX + 1, courtY + 1, courtWidth - 2, courtHeight - 2, floorType);
    
    // Add court-specific features
    if (courtLevel === concentricCourts - 1) {
      // Inner court - throne room
      generateThroneRoom(tiles, config, courtX, courtY, courtWidth, courtHeight, interactionZones);
    } else if (courtLevel === 0) {
      // Outer court - public areas
      generateOuterCourtFeatures(tiles, config, courtX, courtY, courtWidth, courtHeight, noise);
    }
  }
  
  // Add gardens if configured
  if (config.hasGardens) {
    generateGardens(tiles, config, noise, size);
  }
  
  // Add water features
  if (config.waterFeature && config.waterFeature !== 'none') {
    generateWaterFeatures(tiles, config, noise, size);
  }
  
  // Cultural customizations
  applyCulturalCustomizations(tiles, config, size);
  
  // Add exit zones at main gates
  exitZones.push({
    id: 'main_exit',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Exit Palace',
    destination: 'parent_map'
  });
  
  exitZones.push({
    id: 'north_exit',
    location: [Math.floor(size.width / 2), 0],
    label: 'North Gate',
    destination: 'parent_map'
  });
  
  return { tiles, interactionZones, exitZones };
}

/**
 * Generate gate positions for a court level
 */
function generateGatePositions(
  courtLevel: number, 
  totalCourts: number,
  width: number, 
  height: number
): { side: 'north' | 'south' | 'east' | 'west', offset: number }[] {
  const gates: { side: 'north' | 'south' | 'east' | 'west', offset: number }[] = [];
  
  // Main entrance always at south for outer court
  if (courtLevel === 0) {
    gates.push({ side: 'south', offset: Math.floor(width / 2) });
    gates.push({ side: 'north', offset: Math.floor(width / 2) });
    gates.push({ side: 'east', offset: Math.floor(height / 2) });
    gates.push({ side: 'west', offset: Math.floor(height / 2) });
  } else if (courtLevel < totalCourts - 1) {
    // Middle courts - fewer gates
    gates.push({ side: 'south', offset: Math.floor(width / 2) });
    gates.push({ side: 'north', offset: Math.floor(width / 2) });
  } else {
    // Inner court - single entrance
    gates.push({ side: 'south', offset: Math.floor(width / 2) });
  }
  
  return gates;
}

/**
 * Get appropriate floor type for court level
 */
function getCourtFloorType(courtLevel: number, config: SpecialMapConfig): BiomeType {
  if (courtLevel === 0) {
    // Outer court - basic flooring
    return BiomeType.FLOOR_STONE;
  } else if (courtLevel === 1) {
    // Middle court - nicer flooring
    return BiomeType.FLOOR_TILE;
  } else {
    // Inner court - luxury flooring
    if (config.culturalZone === 'EUROPEAN' && 
        (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN || 
         config.era === HistoricalEra.INDUSTRIAL_ERA)) {
      return BiomeType.FLOOR_MARBLE;
    } else if (config.culturalZone === 'EAST_ASIAN') {
      return config.region === 'japan' ? BiomeType.FLOOR_WOOD : BiomeType.FLOOR_TILE;
    }
    return BiomeType.FLOOR_MARBLE;
  }
}

/**
 * Generate throne room in inner court
 */
function generateThroneRoom(
  tiles: Tile[][],
  config: SpecialMapConfig,
  courtX: number,
  courtY: number,
  courtWidth: number,
  courtHeight: number,
  interactionZones: InteractionZone[]
) {
  // Throne at north center of inner court
  const throneX = courtX + Math.floor(courtWidth / 2);
  const throneY = courtY + 2; // Near north wall
  
  // Place throne
  if (throneY < tiles.length && throneX < tiles[0].length) {
    tiles[throneY][throneX].biome = BiomeType.THRONE;
    
    // Create throne interaction zone
    interactionZones.push({
      id: 'throne',
      bounds: { 
        x: throneX - 1, 
        y: throneY - 1, 
        width: 3, 
        height: 3 
      },
      type: 'throne',
      interactions: ['audience', 'ceremony', 'decree'],
      requiredStatus: config.culturalZone === 'EUROPEAN' ? ['noble', 'knight'] : ['official', 'courtier']
    });
  }
  
  // Add columns along the throne room
  for (let x = courtX + 3; x < courtX + courtWidth - 3; x += 4) {
    if (courtY + 5 < tiles.length) {
      tiles[courtY + 5][x].biome = BiomeType.COLUMN;
    }
    if (courtY + courtHeight - 5 < tiles.length) {
      tiles[courtY + courtHeight - 5][x].biome = BiomeType.COLUMN;
    }
  }
}

/**
 * Generate features for outer court
 */
function generateOuterCourtFeatures(
  tiles: Tile[][],
  config: SpecialMapConfig,
  courtX: number,
  courtY: number,
  courtWidth: number,
  courtHeight: number,
  noise: ValueNoise
) {
  // Add some statues or monuments
  const numStatues = 2 + Math.floor(noise.random() * 3);
  for (let i = 0; i < numStatues; i++) {
    const x = courtX + 3 + Math.floor(noise.random() * (courtWidth - 6));
    const y = courtY + 3 + Math.floor(noise.random() * (courtHeight - 6));
    if (y < tiles.length && x < tiles[0].length) {
      tiles[y][x].biome = BiomeType.STATUE;
    }
  }
  
  // Add plaza area
  const plazaSize = 8;
  const plazaX = courtX + Math.floor((courtWidth - plazaSize) / 2);
  const plazaY = courtY + courtHeight - plazaSize - 3;
  fillArea(tiles, plazaX, plazaY, plazaSize, plazaSize, BiomeType.PLAZA);
}

/**
 * Generate palace gardens
 */
function generateGardens(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
) {
  // Gardens in corners
  const gardenSize = 8;
  const positions = [
    { x: 2, y: 2 }, // NW
    { x: size.width - gardenSize - 2, y: 2 }, // NE
    { x: 2, y: size.height - gardenSize - 2 }, // SW
    { x: size.width - gardenSize - 2, y: size.height - gardenSize - 2 } // SE
  ];
  
  positions.forEach(pos => {
    // Check if area is not already occupied by walls
    let canPlace = true;
    for (let dy = 0; dy < gardenSize && canPlace; dy++) {
      for (let dx = 0; dx < gardenSize && canPlace; dx++) {
        if (tiles[pos.y + dy]?.[pos.x + dx]?.biome === BiomeType.WALL) {
          canPlace = false;
        }
      }
    }
    
    if (canPlace) {
      fillArea(tiles, pos.x, pos.y, gardenSize, gardenSize, BiomeType.PARK);
    }
  });
}

/**
 * Generate water features
 */
function generateWaterFeatures(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
) {
  if (config.waterFeature === 'fountains') {
    // Central fountain
    const centerX = Math.floor(size.width / 2);
    const centerY = Math.floor(size.height / 2);
    
    // Check if center is not wall
    if (tiles[centerY]?.[centerX]?.biome !== BiomeType.WALL) {
      tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
      
      // Surround with water
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx !== 0 || dy !== 0) && 
              tiles[centerY + dy]?.[centerX + dx] &&
              tiles[centerY + dy][centerX + dx].biome !== BiomeType.WALL) {
            tiles[centerY + dy][centerX + dx].biome = BiomeType.WATER;
          }
        }
      }
    }
  } else if (config.waterFeature === 'ponds') {
    // Small ponds in gardens
    for (let y = 4; y < size.height - 4; y += 12) {
      for (let x = 4; x < size.width - 4; x += 12) {
        if (tiles[y][x].biome === BiomeType.PARK) {
          // Create a small pond
          fillArea(tiles, x, y, 3, 3, BiomeType.WATER);
        }
      }
    }
  }
}

/**
 * Apply cultural customizations
 */
function applyCulturalCustomizations(
  tiles: Tile[][],
  config: SpecialMapConfig,
  size: { width: number, height: number }
) {
  if (config.culturalZone === 'EAST_ASIAN') {
    if (config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      // Add specific color scheme for Chinese palaces
      if (config.region === 'china' && config.colorScheme === 'imperial-yellow') {
        // This would be handled by the rendering system
        // Here we just mark special tiles
        for (let y = 0; y < size.height; y++) {
          for (let x = 0; x < size.width; x++) {
            if (tiles[y][x].biome === BiomeType.FLOOR_TILE || 
                tiles[y][x].biome === BiomeType.FLOOR_MARBLE) {
              // Mark as imperial zone (renderer will use yellow)
              tiles[y][x].materialSubtype = 'imperial';
            }
          }
        }
      }
    }
    
    // Japanese sliding screens instead of some walls
    if (config.region === 'japan') {
      for (let y = 1; y < size.height - 1; y++) {
        for (let x = 1; x < size.width - 1; x++) {
          if (tiles[y][x].biome === BiomeType.WALL && noise.random() < 0.3) {
            // Check if it's an interior wall (not perimeter)
            const hasAdjacentFloor = 
              tiles[y-1][x].biome.includes('FLOOR') ||
              tiles[y+1][x].biome.includes('FLOOR') ||
              tiles[y][x-1].biome.includes('FLOOR') ||
              tiles[y][x+1].biome.includes('FLOOR');
            
            if (hasAdjacentFloor) {
              tiles[y][x].materialSubtype = 'shoji'; // Renderer will show as paper screen
            }
          }
        }
      }
    }
  } else if (config.culturalZone === 'MENA') {
    // Islamic geometric patterns - mark floor tiles
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        if (tiles[y][x].biome === BiomeType.FLOOR_TILE) {
          tiles[y][x].materialSubtype = 'geometric';
        }
      }
    }
  }
}