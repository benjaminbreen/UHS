/**
 * Spatial Description Service
 * Generates natural language descriptions of locations relative to the player
 * Avoids coordinate references and uses landmarks/directions instead
 */

import { MapData, TerrainStructure, BiomeType } from '../types';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types';

interface Landmark {
  type: 'structure' | 'terrain' | 'water';
  name: string;
  distance: number;
  direction: string;
  x: number;
  y: number;
}

interface SpatialDescription {
  direction: string;
  distance: string;
  landmarks: string[];
  fullDescription: string;
}

export class SpatialDescriptionService {
  private static instance: SpatialDescriptionService;

  static getInstance(): SpatialDescriptionService {
    if (!SpatialDescriptionService.instance) {
      SpatialDescriptionService.instance = new SpatialDescriptionService();
    }
    return SpatialDescriptionService.instance;
  }

  /**
   * Generate a natural description of a location relative to the player
   */
  describeLocationRelativeToPlayer(
    targetX: number,
    targetY: number,
    playerX: number,
    playerY: number,
    mapData: MapData,
    culturalZone: CulturalZone,
    targetStructure?: TerrainStructure
  ): string {
    const direction = this.getCardinalDirection(targetX, targetY, playerX, playerY);
    const distance = this.calculateDistance(targetX, targetY, playerX, playerY);
    const culturalDistance = this.getCulturalDistanceDescription(distance, culturalZone);
    const landmarks = this.getNearbyLandmarks(targetX, targetY, mapData);
    
    // Build description
    const parts: string[] = [];
    
    // Add structure name if available
    if (targetStructure) {
      const structureName = this.getStructureName(targetStructure, culturalZone);
      parts.push(structureName);
    } else {
      parts.push('the location');
    }
    
    // Add distance and direction
    if (distance < 3) {
      parts.push('very close by');
    } else {
      parts.push(`${culturalDistance} ${direction}`);
    }
    
    // Add landmark references
    if (landmarks.length > 0) {
      const landmarkDesc = this.describeLandmarks(landmarks, targetX, targetY);
      if (landmarkDesc) {
        parts.push(landmarkDesc);
      }
    }
    
    return parts.join(', ');
  }

  /**
   * Get compass direction from player to target
   */
  private getCardinalDirection(
    targetX: number,
    targetY: number,
    playerX: number,
    playerY: number
  ): string {
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Convert angle to compass direction
    if (angle >= -22.5 && angle < 22.5) return 'to the east';
    if (angle >= 22.5 && angle < 67.5) return 'to the southeast';
    if (angle >= 67.5 && angle < 112.5) return 'to the south';
    if (angle >= 112.5 && angle < 157.5) return 'to the southwest';
    if (angle >= -67.5 && angle < -22.5) return 'to the northeast';
    if (angle >= -112.5 && angle < -67.5) return 'to the north';
    if (angle >= -157.5 && angle < -112.5) return 'to the northwest';
    return 'to the west';
  }

  /**
   * Calculate distance in tiles
   */
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Get culturally appropriate distance description
   */
  private getCulturalDistanceDescription(tiles: number, zone: CulturalZone): string {
    // Convert tiles to approximate travel time
    // Assuming 1 tile = ~1km, walking speed ~5km/h
    const hoursWalking = tiles / 5;
    
    const distanceTerms: Record<CulturalZone, (hours: number) => string> = {
      EUROPEAN: (h) => {
        if (h < 0.5) return 'a short walk';
        if (h < 1) return 'half an hour\'s walk';
        if (h < 2) return 'an hour\'s walk';
        if (h < 4) return 'a morning\'s journey';
        if (h < 8) return 'half a day\'s travel';
        if (h < 16) return 'a day\'s journey';
        return 'several days\' travel';
      },
      MENA: (h) => {
        if (h < 0.5) return 'nearby';
        if (h < 2) return 'one prayer\'s time';
        if (h < 4) return 'two prayers\' journey';
        if (h < 8) return 'from dawn to noon';
        if (h < 16) return 'a day\'s caravan';
        return 'many days by caravan';
      },
      EAST_ASIAN: (h) => {
        if (h < 0.5) return 'very near';
        if (h < 1) return 'one li away';
        if (h < 2) return 'three li distant';
        if (h < 4) return 'ten li away';
        if (h < 8) return 'half a day\'s walk';
        if (h < 16) return 'a day\'s journey';
        return 'several days distant';
      },
      SOUTH_ASIAN: (h) => {
        if (h < 0.5) return 'close by';
        if (h < 1) return 'one kos away';
        if (h < 4) return 'a morning\'s walk';
        if (h < 8) return 'half a day\'s journey';
        if (h < 16) return 'a day\'s travel';
        return 'many days\' journey';
      },
      NORTH_AMERICAN_PRE_COLUMBIAN: (h) => {
        if (h < 0.5) return 'very close';
        if (h < 2) return 'a short journey';
        if (h < 4) return 'from sunrise to midday';
        if (h < 8) return 'from dawn to dusk';
        if (h < 16) return 'one day\'s travel';
        return 'many suns\' journey';
      },
      NORTH_AMERICAN_COLONIAL: (h) => {
        if (h < 0.5) return 'a stone\'s throw';
        if (h < 1) return 'a mile hence';
        if (h < 2) return 'two miles distant';
        if (h < 4) return 'half a day\'s ride';
        if (h < 8) return 'a day\'s ride';
        return 'several days by horse';
      },
      SOUTH_AMERICAN: (h) => {
        if (h < 0.5) return 'very near';
        if (h < 2) return 'a short walk';
        if (h < 4) return 'morning\'s journey';
        if (h < 8) return 'sun\'s journey';
        if (h < 16) return 'one day distant';
        return 'many days away';
      },
      SUB_SAHARAN_AFRICAN: (h) => {
        if (h < 0.5) return 'nearby';
        if (h < 2) return 'a short walk';
        if (h < 4) return 'morning\'s travel';
        if (h < 8) return 'until the sun sets';
        if (h < 16) return 'a day\'s walk';
        return 'many days\' journey';
      },
      OCEANIC: (h) => {
        if (h < 0.5) return 'close by';
        if (h < 2) return 'short paddle away';
        if (h < 4) return 'morning\'s voyage';
        if (h < 8) return 'day\'s sailing';
        if (h < 16) return 'overnight voyage';
        return 'many days by sea';
      }
    };
    
    const describer = distanceTerms[zone] || distanceTerms.EUROPEAN;
    return describer(hoursWalking);
  }

  /**
   * Find notable landmarks near the target location
   */
  private getNearbyLandmarks(
    targetX: number,
    targetY: number,
    mapData: MapData
  ): Landmark[] {
    const landmarks: Landmark[] = [];
    const searchRadius = 5;
    
    // Check for structures
    if (mapData.terrainStructures) {
      for (const structure of mapData.terrainStructures) {
        if (!structure.x || !structure.y) continue;
        
        const distance = this.calculateDistance(targetX, targetY, structure.x, structure.y);
        if (distance <= searchRadius && distance > 0) {
          landmarks.push({
            type: 'structure',
            name: this.getStructureTypeName(structure.type),
            distance,
            direction: this.getRelativeDirection(targetX, targetY, structure.x, structure.y),
            x: structure.x,
            y: structure.y
          });
        }
      }
    }
    
    // Check for water features
    const tiles = mapData.tiles;
    const waterBodies = this.findWaterBodies(targetX, targetY, tiles, searchRadius);
    landmarks.push(...waterBodies);
    
    // Check for terrain features
    const terrainFeatures = this.findTerrainFeatures(targetX, targetY, tiles, searchRadius);
    landmarks.push(...terrainFeatures);
    
    // Sort by distance and return top 2
    return landmarks
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
  }

  /**
   * Find water bodies near location
   */
  private findWaterBodies(
    targetX: number,
    targetY: number,
    tiles: any[][],
    radius: number
  ): Landmark[] {
    const waterLandmarks: Landmark[] = [];
    const waterTypes = new Set<BiomeType>();
    
    for (let y = Math.max(0, targetY - radius); y < Math.min(tiles.length, targetY + radius); y++) {
      for (let x = Math.max(0, targetX - radius); x < Math.min(tiles[0].length, targetX + radius); x++) {
        const tile = tiles[y][x];
        if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.LAKE || tile.biome === BiomeType.OCEAN) {
          waterTypes.add(tile.biome);
        }
      }
    }
    
    // Add appropriate water landmarks
    if (waterTypes.has(BiomeType.RIVER)) {
      waterLandmarks.push({
        type: 'water',
        name: 'the river',
        distance: 0,
        direction: '',
        x: targetX,
        y: targetY
      });
    }
    if (waterTypes.has(BiomeType.LAKE)) {
      waterLandmarks.push({
        type: 'water',
        name: 'the lake',
        distance: 0,
        direction: '',
        x: targetX,
        y: targetY
      });
    }
    if (waterTypes.has(BiomeType.OCEAN)) {
      waterLandmarks.push({
        type: 'water',
        name: 'the coast',
        distance: 0,
        direction: '',
        x: targetX,
        y: targetY
      });
    }
    
    return waterLandmarks;
  }

  /**
   * Find terrain features near location
   */
  private findTerrainFeatures(
    targetX: number,
    targetY: number,
    tiles: any[][],
    radius: number
  ): Landmark[] {
    const features: Landmark[] = [];
    const featureTypes = new Set<BiomeType>();
    
    for (let y = Math.max(0, targetY - radius); y < Math.min(tiles.length, targetY + radius); y++) {
      for (let x = Math.max(0, targetX - radius); x < Math.min(tiles[0].length, targetX + radius); x++) {
        const tile = tiles[y][x];
        
        // Check for notable terrain
        if (tile.biome === BiomeType.MOUNTAIN || tile.altitude > 0.8) {
          featureTypes.add(BiomeType.MOUNTAIN);
        }
        if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) {
          featureTypes.add(BiomeType.FOREST);
        }
        if (tile.biome === BiomeType.DESERT) {
          featureTypes.add(BiomeType.DESERT);
        }
      }
    }
    
    // Add terrain landmarks
    if (featureTypes.has(BiomeType.MOUNTAIN)) {
      features.push({
        type: 'terrain',
        name: 'the mountains',
        distance: 0,
        direction: '',
        x: targetX,
        y: targetY
      });
    }
    if (featureTypes.has(BiomeType.FOREST)) {
      features.push({
        type: 'terrain',
        name: 'the forest',
        distance: 0,
        direction: '',
        x: targetX,
        y: targetY
      });
    }
    
    return features;
  }

  /**
   * Get relative direction between two points
   */
  private getRelativeDirection(fromX: number, fromY: number, toX: number, toY: number): string {
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return 'near';
    
    if (dy < 0) return 'north';
    if (dy > 0) return 'south';
    if (dx < 0) return 'west';
    if (dx > 0) return 'east';
    
    return '';
  }

  /**
   * Describe landmarks in natural language
   */
  private describeLandmarks(landmarks: Landmark[], targetX: number, targetY: number): string {
    if (landmarks.length === 0) return '';
    
    const parts: string[] = [];
    
    // Water features are most notable
    const water = landmarks.find(l => l.type === 'water');
    if (water) {
      if (water.name === 'the river') {
        parts.push('by the river');
      } else if (water.name === 'the lake') {
        parts.push('near the lake');
      } else if (water.name === 'the coast') {
        parts.push('along the coast');
      }
    }
    
    // Then structures
    const structure = landmarks.find(l => l.type === 'structure');
    if (structure && structure.distance > 0) {
      if (structure.distance < 3) {
        parts.push(`near ${structure.name}`);
      } else {
        parts.push(`past ${structure.name}`);
      }
    }
    
    // Then terrain
    const terrain = landmarks.find(l => l.type === 'terrain');
    if (terrain && parts.length < 2) {
      if (terrain.name === 'the forest') {
        parts.push('at the forest edge');
      } else if (terrain.name === 'the mountains') {
        parts.push('in the foothills');
      }
    }
    
    return parts.join(' ');
  }

  /**
   * Get structure name based on type and culture
   */
  private getStructureName(structure: TerrainStructure, culturalZone: CulturalZone): string {
    const structureNames: Record<string, Record<CulturalZone, string>> = {
      mill: {
        EUROPEAN: 'the watermill',
        MENA: 'the grain mill',
        EAST_ASIAN: 'the rice mill',
        SOUTH_ASIAN: 'the chakki mill',
        NORTH_AMERICAN_PRE_COLUMBIAN: 'the grinding stones',
        NORTH_AMERICAN_COLONIAL: 'the grist mill',
        SOUTH_AMERICAN: 'the mill',
        SUB_SAHARAN_AFRICAN: 'the grinding house',
        OCEANIC: 'the processing hut'
      },
      fishing_hut: {
        EUROPEAN: 'the fisherman\'s hut',
        MENA: 'the fishing dock',
        EAST_ASIAN: 'the fishing pavilion',
        SOUTH_ASIAN: 'the fisherman\'s shelter',
        NORTH_AMERICAN_PRE_COLUMBIAN: 'the fishing camp',
        NORTH_AMERICAN_COLONIAL: 'the fishing shack',
        SOUTH_AMERICAN: 'the fishing station',
        SUB_SAHARAN_AFRICAN: 'the fishing village',
        OCEANIC: 'the fishing outrigger'
      },
      fortress: {
        EUROPEAN: 'the castle',
        MENA: 'the citadel',
        EAST_ASIAN: 'the fortress',
        SOUTH_ASIAN: 'the fort',
        NORTH_AMERICAN_PRE_COLUMBIAN: 'the palisade',
        NORTH_AMERICAN_COLONIAL: 'the fort',
        SOUTH_AMERICAN: 'the stronghold',
        SUB_SAHARAN_AFRICAN: 'the fortified compound',
        OCEANIC: 'the pa'
      },
      mine: {
        EUROPEAN: 'the mine',
        MENA: 'the quarry',
        EAST_ASIAN: 'the mine',
        SOUTH_ASIAN: 'the excavation',
        NORTH_AMERICAN_PRE_COLUMBIAN: 'the quarry',
        NORTH_AMERICAN_COLONIAL: 'the mine shaft',
        SOUTH_AMERICAN: 'the mineral deposit',
        SUB_SAHARAN_AFRICAN: 'the mine',
        OCEANIC: 'the stone quarry'
      },
      marketplace: {
        EUROPEAN: 'the market square',
        MENA: 'the bazaar',
        EAST_ASIAN: 'the market street',
        SOUTH_ASIAN: 'the bazaar',
        NORTH_AMERICAN_PRE_COLUMBIAN: 'the trading post',
        NORTH_AMERICAN_COLONIAL: 'the general store',
        SOUTH_AMERICAN: 'the market',
        SUB_SAHARAN_AFRICAN: 'the market',
        OCEANIC: 'the trading beach'
      }
    };
    
    const names = structureNames[structure.type] || {};
    return names[culturalZone] || `the ${structure.type}`;
  }

  /**
   * Get generic structure type name
   */
  private getStructureTypeName(type: string): string {
    const names: Record<string, string> = {
      mill: 'the mill',
      fishing_hut: 'the fishing hut',
      fortress: 'the fortress',
      mine: 'the mine',
      marketplace: 'the marketplace',
      palace: 'the palace',
      holy_site: 'the temple',
      ruins: 'the ruins',
      farm: 'the farm'
    };
    
    return names[type] || `the ${type}`;
  }

  /**
   * Generate a route description for multi-step journeys
   */
  describeRoute(
    waypoints: Array<{ x: number; y: number; description?: string }>,
    mapData: MapData,
    culturalZone: CulturalZone
  ): string[] {
    const steps: string[] = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      const direction = this.getCardinalDirection(to.x, to.y, from.x, from.y);
      const distance = this.calculateDistance(to.x, to.y, from.x, from.y);
      const culturalDistance = this.getCulturalDistanceDescription(distance, culturalZone);
      
      let step = `Travel ${culturalDistance} ${direction}`;
      
      if (to.description) {
        step += ` to ${to.description}`;
      }
      
      // Add landmarks for orientation
      const landmarks = this.getNearbyLandmarks(to.x, to.y, mapData);
      if (landmarks.length > 0) {
        const landmarkDesc = this.describeLandmarks(landmarks, to.x, to.y);
        if (landmarkDesc) {
          step += ` (${landmarkDesc})`;
        }
      }
      
      steps.push(step);
    }
    
    return steps;
  }
}

export const spatialDescriptionService = SpatialDescriptionService.getInstance();