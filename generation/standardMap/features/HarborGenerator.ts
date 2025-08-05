/**
 * generation/standardMap/features/HarborGenerator.ts - Generates harbors for Standard Maps
 */
import { Tile, BiomeType, Point, MapArchetype } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS,
    HARBOR_MIN_WIDTH_FACTOR, HARBOR_MAX_WIDTH_FACTOR, HARBOR_MIN_DEPTH_FACTOR, HARBOR_MAX_DEPTH_FACTOR
} from '../../../constants/index';
import { isNearWaterBody } from './EcologicalFeatureGenerator'; // Helper function

export function generateHarbor(
  tiles: Tile[][], 
  archetype: MapArchetype, 
  standardHarborSide: number | undefined, 
  harborNoise: ValueNoise,
  featurePlacementNoise: ValueNoise
) {
  let harborCenterX = 0;
  let harborCenterY = 0;
  let harborWidth = 0;
  let harborDepth = 0; 

  const mainDim = archetype === MapArchetype.RIVER_PORT || (standardHarborSide !== undefined && standardHarborSide >=2) ? MAP_WIDTH_TILES : MAP_HEIGHT_TILES;
  const secondaryDim = archetype === MapArchetype.RIVER_PORT || (standardHarborSide !== undefined && standardHarborSide >=2) ? MAP_HEIGHT_TILES : MAP_WIDTH_TILES;

  harborWidth = Math.floor(mainDim * (HARBOR_MIN_WIDTH_FACTOR + harborNoise.random() * (HARBOR_MAX_WIDTH_FACTOR - HARBOR_MIN_WIDTH_FACTOR)));
  harborDepth = Math.floor(secondaryDim * (HARBOR_MIN_DEPTH_FACTOR + harborNoise.random() * (HARBOR_MAX_DEPTH_FACTOR - HARBOR_MIN_DEPTH_FACTOR)));

  if (archetype === MapArchetype.ALL_LAND && standardHarborSide !== undefined) {
    const landConcentrationRatio = 0.40;
    if (standardHarborSide === 0) { 
      harborCenterX = Math.floor(MAP_WIDTH_TILES * landConcentrationRatio + harborDepth / 2 - 2); 
      harborCenterY = Math.floor(MAP_HEIGHT_TILES * (0.3 + featurePlacementNoise.random() * 0.4));
    } else if (standardHarborSide === 1) { 
      harborCenterX = Math.floor(MAP_WIDTH_TILES * (1 - landConcentrationRatio) - harborDepth / 2 + 2);
      harborCenterY = Math.floor(MAP_HEIGHT_TILES * (0.3 + featurePlacementNoise.random() * 0.4));
    } else if (standardHarborSide === 2) { 
      harborCenterY = Math.floor(MAP_HEIGHT_TILES * landConcentrationRatio + harborDepth / 2 - 2);
      harborCenterX = Math.floor(MAP_WIDTH_TILES * (0.3 + featurePlacementNoise.random() * 0.4));
    } else { 
      harborCenterY = Math.floor(MAP_HEIGHT_TILES * (1 - landConcentrationRatio) - harborDepth / 2 + 2);
      harborCenterX = Math.floor(MAP_WIDTH_TILES * (0.3 + featurePlacementNoise.random() * 0.4));
    }

    for (let i = 0; i < harborDepth; i++) {
      const currentDepthProgress = i / harborDepth; 
      const widthAtThisDepth = harborWidth * (1 - currentDepthProgress * currentDepthProgress * 0.7); 

      if (standardHarborSide <= 1) { 
        const currentX = (standardHarborSide === 0) ? harborCenterX - i : harborCenterX + i;
        if (currentX < 0 || currentX >= MAP_WIDTH_TILES) continue;

        const currentHarborHalfWidth = Math.floor(widthAtThisDepth / 2);
        for (let y = Math.max(0, harborCenterY - currentHarborHalfWidth); y <= Math.min(MAP_HEIGHT_TILES - 1, harborCenterY + currentHarborHalfWidth); y++) {
          if (tiles[y][currentX] && tiles[y][currentX].biome !== BiomeType.FRESHWATER_LAKE) {
            tiles[y][currentX].isLand = false;
            tiles[y][currentX].biome = BiomeType.SHALLOW_OCEAN;
            tiles[y][currentX].altitude = ALTITUDE_LEVELS.SEA * (0.3 + harborNoise.random() * 0.2); 
            tiles[y][currentX].isCoast = false; 
          }
        }
      } else { 
        const currentY = (standardHarborSide === 2) ? harborCenterY - i : harborCenterY + i;
        if (currentY < 0 || currentY >= MAP_HEIGHT_TILES) continue;
        
        const currentHarborHalfWidth = Math.floor(widthAtThisDepth / 2);
        for (let x = Math.max(0, harborCenterX - currentHarborHalfWidth); x <= Math.min(MAP_WIDTH_TILES -1, harborCenterX + currentHarborHalfWidth); x++) {
             if (tiles[currentY][x] && tiles[currentY][x].biome !== BiomeType.FRESHWATER_LAKE) {
                tiles[currentY][x].isLand = false;
                tiles[currentY][x].biome = BiomeType.SHALLOW_OCEAN;
                tiles[currentY][x].altitude = ALTITUDE_LEVELS.SEA * (0.3 + harborNoise.random() * 0.2);
                tiles[currentY][x].isCoast = false;
             }
        }
      }
    }

  } else if (archetype === MapArchetype.ISLAND || archetype === MapArchetype.ATOLL) {
    const coastalPoints: Point[] = [];
    for (let y=0; y < MAP_HEIGHT_TILES; y++) {
        for (let x=0; x < MAP_WIDTH_TILES; x++) {
            if (tiles[y][x].isCoast && tiles[y][x].isLand && tiles[y][x].biome !== BiomeType.MANGROVE && tiles[y][x].biome !== BiomeType.ESTUARY && tiles[y][x].biome !== BiomeType.FRESHWATER_LAKE && tiles[y][x].biome !== BiomeType.CLIFF) coastalPoints.push({x,y});
        }
    }
    if (coastalPoints.length === 0) return; 

    const {x:coastX, y:coastY} = coastalPoints[Math.floor(featurePlacementNoise.random() * coastalPoints.length)];
    
    harborCenterX = coastX;
    harborCenterY = coastY;
    const carveRadius = Math.floor((harborWidth + harborDepth) / (archetype === MapArchetype.ATOLL ? 5.0 : 3.5) ); 

    for(let y = harborCenterY - carveRadius; y <= harborCenterY + carveRadius; y++) {
        for(let x = harborCenterX - carveRadius; x <= harborCenterX + carveRadius; x++) {
            if(x < 0 || x >= MAP_WIDTH_TILES || y < 0 || y >= MAP_HEIGHT_TILES) continue;
            const distSq = (x - harborCenterX)*(x-harborCenterX) + (y - harborCenterY)*(y-harborCenterY);
            if(distSq <= carveRadius * carveRadius * (0.8 + harborNoise.random() * 0.4) ) { 
                 if(tiles[y][x].isLand && tiles[y][x].biome !== BiomeType.ESTUARY && tiles[y][x].biome !== BiomeType.FRESHWATER_LAKE && tiles[y][x].biome !== BiomeType.CLIFF){ 
                    tiles[y][x].isLand = false;
                    tiles[y][x].biome = BiomeType.SHALLOW_OCEAN;
                    tiles[y][x].altitude = ALTITUDE_LEVELS.SEA * (0.2 + harborNoise.random() * 0.3);
                    tiles[y][x].isCoast = false;
                 }
            }
        }
    }

  } else if (archetype === MapArchetype.RIVER_PORT) {
    // Harbor logic for River Port is now implicitly handled by the main river generation
  } else if (archetype === MapArchetype.BAY && standardHarborSide !== undefined) {
    let bayEdgeX = Math.floor(MAP_WIDTH_TILES / 2);
    let bayEdgeY = Math.floor(MAP_HEIGHT_TILES / 2);
    if(standardHarborSide === 0) bayEdgeX = Math.floor(MAP_WIDTH_TILES * 0.25);
    else if(standardHarborSide === 1) bayEdgeX = Math.floor(MAP_WIDTH_TILES * 0.75);
    else if(standardHarborSide === 2) bayEdgeY = Math.floor(MAP_HEIGHT_TILES * 0.25);
    else bayEdgeY = Math.floor(MAP_HEIGHT_TILES * 0.75);

    const carveRadius = Math.floor(Math.min(harborWidth, harborDepth) / 2.5);
     for(let y = bayEdgeY - carveRadius; y <= bayEdgeY + carveRadius; y++) {
        for(let x = bayEdgeX - carveRadius; x <= bayEdgeX + carveRadius; x++) {
             if(x < 0 || x >= MAP_WIDTH_TILES || y < 0 || y >= MAP_HEIGHT_TILES) continue;
             if (tiles[y][x].isLand && isNearWaterBody(tiles,x,y,1) && tiles[y][x].biome !== BiomeType.ESTUARY && tiles[y][x].biome !== BiomeType.FRESHWATER_LAKE && tiles[y][x].biome !== BiomeType.CLIFF) { 
                tiles[y][x].isLand = false;
                tiles[y][x].biome = BiomeType.SHALLOW_OCEAN; 
                tiles[y][x].altitude = ALTITUDE_LEVELS.SEA * (0.25 + harborNoise.random() * 0.2);
             }
        }
    }
  }
}