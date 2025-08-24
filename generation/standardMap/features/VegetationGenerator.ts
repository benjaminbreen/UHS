/**
 * generation/standardMap/features/VegetationGenerator.ts - Enhanced procedural placement of vegetation.
 */
import { Tile, ClimateType, BiomeType, MapData, VegetationEntity, VegetationBaseType, VegetationSpecies } from '../../../types';
import { ValueNoise } from '../../../utils/noise';
import { VEGETATION_SPECIES_DATA } from '../../../constants/index';

let vegetationIdCounter = 0;

function getSpecificSpecies(
    baseType: VegetationBaseType, 
    climate: ClimateType, 
    noise: ValueNoise
): VegetationSpecies | null {
    const speciesForType = VEGETATION_SPECIES_DATA[baseType];
    if (!speciesForType) {
        console.warn(`No species data found for vegetation type: ${baseType}`);
        return null;
    }
    
    const speciesForClimate = speciesForType[climate];
    if (!speciesForClimate) {
        console.warn(`No species data found for climate: ${climate} and vegetation type: ${baseType}`);
        return null;
    }

    const roll = noise.random();
    
    try {
        // Ultra rare: 1% chance
        if (roll < 0.01 && speciesForClimate.ultraRare && speciesForClimate.ultraRare.length > 0) {
            return speciesForClimate.ultraRare[Math.floor(noise.random() * speciesForClimate.ultraRare.length)];
        }
        // Super rare: 5% chance (1% + 4%)
        else if (roll < 0.06 && speciesForClimate.superRare && speciesForClimate.superRare.length > 0) {
            return speciesForClimate.superRare[Math.floor(noise.random() * speciesForClimate.superRare.length)];
        }
        // Rare: 15% chance (6% + 9%)
        else if (roll < 0.21 && speciesForClimate.rare && speciesForClimate.rare.length > 0) {
            return speciesForClimate.rare[Math.floor(noise.random() * speciesForClimate.rare.length)];
        }
        // Common: 79% chance (remaining)
        else if (speciesForClimate.common && speciesForClimate.common.length > 0) {
            return speciesForClimate.common[Math.floor(noise.random() * speciesForClimate.common.length)];
        }
    } catch (error) {
        console.error(`Error selecting species for ${baseType} in ${climate}:`, error);
        return null;
    }
    
    return null;
}

function determineVegetation(tile: Tile, climate: ClimateType, noise: ValueNoise): { baseType: VegetationBaseType, symbol: string, species: VegetationSpecies } | null {
  try {
    const { biome } = tile;
    const rand = noise.random();
    const elevationFactor = tile.altitude || 0.5; // Use elevation if available

    const unsuitableBiomes = new Set([
      BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
      BiomeType.ACTIVE_LAVA, BiomeType.SNOW, BiomeType.SALT_FLATS,
      BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN,
      BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.PALACE,
      BiomeType.MANGROVE, // Add MANGROVE to unsuitable biomes since it already has its own tree symbol
      BiomeType.ROAD, // Prevent vegetation on modern roads
      BiomeType.PARK, // Parks have their own special vegetation
      BiomeType.PLAZA, // Plazas are paved public spaces
      BiomeType.HARBOR_DISTRICT, // Harbor areas are industrial/commercial
      BiomeType.INDUSTRIAL_DISTRICT // Industrial zones have no vegetation
    ]);
    if (unsuitableBiomes.has(biome)) return null;

    let baseType: VegetationBaseType | null = null;
    let symbol: string | null = null;
    
    // DESERT: Arid-adapted vegetation only
    if (biome === BiomeType.DESERT) {
      if (rand < 0.2) {
        baseType = 'cactus'; symbol = 'cactus';
      } else if (rand < 0.35) {
        baseType = 'generic_bush'; symbol = 'bush';
      }
    }
    
    // SCRUB/STEPPE: Transition zones
    if (!baseType && (biome === BiomeType.SCRUB || biome === BiomeType.STEPPE)) {
      if (climate === ClimateType.ARID) {
        if (rand < 0.15) { baseType = 'cactus'; symbol = 'cactus'; }
        else if (rand < 0.4) { baseType = 'generic_bush'; symbol = 'bush'; }
      } else {
        if (rand < 0.1) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
        else if (rand < 0.35) { baseType = 'generic_bush'; symbol = 'bush'; }
      }
    }
    
    // FORESTED BIOMES: Climate-appropriate trees with elevation effects
    const treeBiomes = new Set([BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.HILLS, BiomeType.MOUNTAIN]);
    if (!baseType && treeBiomes.has(biome)) {
      const treeRoll = noise.random();
      const isHighElevation = elevationFactor > 0.7; // High elevation favors conifers
      
      switch (climate) {
        case ClimateType.COLD: 
          if (treeRoll < 0.92) { baseType = 'coniferous_tree'; symbol = 'pine'; } 
          else { baseType = 'generic_bush'; symbol = 'bush'; }
          break;
          
        case ClimateType.TEMPERATE:
          if (isHighElevation) {
            // High elevation temperate: more conifers
            if (treeRoll < 0.8) { baseType = 'coniferous_tree'; symbol = 'pine'; } 
            else if (treeRoll < 0.9) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          } else {
            // Low elevation temperate: mixed forest
            if (treeRoll < 0.75) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else if (treeRoll < 0.93) { baseType = 'coniferous_tree'; symbol = 'pine'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          }
          break;
          
        case ClimateType.SEMITROPICAL:
          if (isHighElevation) {
            if (treeRoll < 0.5) { baseType = 'coniferous_tree'; symbol = 'pine'; }
            else if (treeRoll < 0.8) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          } else {
            if (treeRoll < 0.5) { baseType = 'palm_tree'; symbol = 'palm'; } 
            else if (treeRoll < 0.85) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          }
          break;
          
        case ClimateType.TROPICAL: 
          if (isHighElevation) {
            // High tropical: cloud forests
            if (treeRoll < 0.6) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else if (treeRoll < 0.8) { baseType = 'palm_tree'; symbol = 'palm'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          } else {
            if (treeRoll < 0.75) { baseType = 'palm_tree'; symbol = 'palm'; } 
            else if (treeRoll < 0.92) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          }
          break;
          
        case ClimateType.ARID:
          // ARID: NO TREES, even in "forest" biomes (these become scrubland)
          if (rand < 0.4) { baseType = 'cactus'; symbol = 'cactus'; } 
          else { baseType = 'generic_bush'; symbol = 'bush'; }
          break;
          
        case ClimateType.MEDITERRANEAN:
          // Mediterranean: Mix of evergreen and deciduous, with many bushes
          if (isHighElevation) {
            // High elevation Mediterranean: more conifers
            if (treeRoll < 0.7) { baseType = 'coniferous_tree'; symbol = 'pine'; }
            else if (treeRoll < 0.85) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
            else { baseType = 'generic_bush'; symbol = 'bush'; }
          } else {
            // Low elevation Mediterranean: evergreen oaks, olives, cork oaks
            if (treeRoll < 0.65) { baseType = 'deciduous_tree'; symbol = 'deciduous'; } // Will pick Mediterranean species
            else if (treeRoll < 0.85) { baseType = 'coniferous_tree'; symbol = 'pine'; } // Mediterranean pines
            else { baseType = 'generic_bush'; symbol = 'bush'; } // Rosemary, lavender, etc.
          }
          break;
      }
    }

    // JUNGLE: Maximum tree density with rich variety
    if (!baseType && biome === BiomeType.JUNGLE) {
      const jungleRoll = noise.random();
      if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
        if (jungleRoll < 0.6) { baseType = 'palm_tree'; symbol = 'palm'; } 
        else if (jungleRoll < 0.95) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
        else { baseType = 'generic_bush'; symbol = 'bush'; }
      } else {
        // Non-tropical jungles are more deciduous
        if (jungleRoll < 0.8) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
        else if (jungleRoll < 0.95) { baseType = 'palm_tree'; symbol = 'palm'; }
        else { baseType = 'generic_bush'; symbol = 'bush'; }
      }
    }
    
    // WETLANDS: Water-adapted vegetation (excluding MANGROVE which has its own symbol)
    if (!baseType && biome === BiomeType.WETLANDS) {
      if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
        if (rand < 0.3) { baseType = 'deciduous_tree'; symbol = 'deciduous'; } // Swamp trees
        else if (rand < 0.6) { baseType = 'generic_bush'; symbol = 'bush'; }
      } else {
        if (rand < 0.2) { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
        else if (rand < 0.5) { baseType = 'generic_bush'; symbol = 'bush'; }
      }
    }
    
    // GRASSLAND: Sparse trees, mostly in temperate/tropical climates
    if (!baseType && biome === BiomeType.GRASSLAND) {
      if (climate === ClimateType.TROPICAL && rand < 0.08) { 
        baseType = 'palm_tree'; symbol = 'palm'; 
      } else if (climate === ClimateType.TEMPERATE && rand < 0.06) { 
        baseType = 'deciduous_tree'; symbol = 'deciduous'; 
      } else if (rand < 0.12) { 
        baseType = 'generic_bush'; symbol = 'bush'; 
      }
    }
    
    // RIVERBANK: Water proximity = more vegetation
    if (!baseType && biome === BiomeType.RIVERBANK) {
      if (climate === ClimateType.TROPICAL && rand < 0.25) { 
        baseType = 'palm_tree'; symbol = 'palm'; 
      } else if (climate !== ClimateType.ARID && rand < 0.2) { 
        baseType = 'deciduous_tree'; symbol = 'deciduous'; 
      } else if (rand < 0.35) { 
        baseType = 'generic_bush'; symbol = 'bush'; 
      }
    }
    
    // TUNDRA: Very sparse, cold-adapted vegetation
    if (!baseType && biome === BiomeType.TUNDRA) {
      if (rand < 0.03) { baseType = 'coniferous_tree'; symbol = 'pine'; } 
      else if (rand < 0.12) { baseType = 'generic_bush'; symbol = 'bush'; }
    }
    
    // OASIS: Desert paradise with concentrated vegetation
    if (!baseType && biome === BiomeType.OASIS) {
      if (rand < 0.6) { baseType = 'palm_tree'; symbol = 'palm'; } // Date palms
      else if (rand < 0.8) { baseType = 'generic_bush'; symbol = 'bush'; }
    }
    
    // BEACH: Coastal-adapted plants
    if (!baseType && biome === BiomeType.BEACH) {
      if ((climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) && rand < 0.15) { 
        baseType = 'palm_tree'; symbol = 'palm'; // Coconut palms
      } else if (rand < 0.08) { 
        baseType = 'generic_bush'; symbol = 'bush'; // Salt-tolerant shrubs
      }
    }

    // FARMLAND: Managed landscapes with occasional trees/hedgerows
    if (!baseType && biome === BiomeType.FARMLAND) {
      if (climate !== ClimateType.ARID && rand < 0.05) {
        baseType = 'deciduous_tree'; symbol = 'deciduous'; // Fruit trees/windbreaks
      } else if (rand < 0.35) { 
        baseType = 'generic_bush'; symbol = 'bush'; // Hedgerows
      }
    }
    
    // HOLY SITES: Special sacred vegetation
    if (!baseType && biome === BiomeType.HOLY_SITE) {
      if (climate !== ClimateType.ARID && rand < 0.4) {
        // Sacred groves - prefer native trees
        if (climate === ClimateType.TROPICAL) { baseType = 'palm_tree'; symbol = 'palm'; }
        else if (climate === ClimateType.COLD) { baseType = 'coniferous_tree'; symbol = 'pine'; }
        else { baseType = 'deciduous_tree'; symbol = 'deciduous'; }
      } else if (rand < 0.6) {
        baseType = 'generic_bush'; symbol = 'bush';
      }
    }
    
    // RUINS: Overgrown abandoned areas
    if (!baseType && biome === BiomeType.RUINS) {
      if (climate !== ClimateType.ARID && rand < 0.3) {
        baseType = 'deciduous_tree'; symbol = 'deciduous'; // Trees reclaiming ruins
      } else if (rand < 0.5) {
        baseType = 'generic_bush'; symbol = 'bush';
      }
    }

    if (baseType && symbol) {
        // CRITICAL: Enforce arid climate restriction
        if (climate === ClimateType.ARID && ['deciduous_tree', 'coniferous_tree', 'palm_tree'].includes(baseType)) {
            // Exception: Allow palm trees in oasis
            if (!(biome === BiomeType.OASIS && baseType === 'palm_tree')) {
                baseType = 'generic_bush';
                symbol = 'bush';
            }
        }
        
        const species = getSpecificSpecies(baseType, climate, noise);
        if (species) {
            return { baseType, symbol, species };
        }
        
        // ENHANCED FALLBACK SPECIES with climate consideration
        if (baseType === 'generic_bush') { 
            const bushName = climate === ClimateType.ARID ? 'Desert Sage' : 
                           climate === ClimateType.COLD ? 'Arctic Willow' :
                           climate === ClimateType.TROPICAL ? 'Tropical Shrub' : 'Wild Shrub';
            const bushLatin = climate === ClimateType.ARID ? 'Artemisia tridentata' :
                            climate === ClimateType.COLD ? 'Salix arctica' :
                            climate === ClimateType.TROPICAL ? 'Ixora coccinea' : 'Arbustum vulgaris';
            return { baseType, symbol, species: { name: bushName, linnaeanName: bushLatin, emoji: '🌿' } }; 
        }
        if (baseType === 'cactus') { 
            return { baseType, symbol, species: { name: 'Desert Prickly Pear', linnaeanName: 'Opuntia humifusa', emoji: '🌵' } }; 
        }
        if (baseType === 'deciduous_tree') { 
            const treeName = climate === ClimateType.TROPICAL ? 'Tropical Mahogany' :
                           climate === ClimateType.COLD ? 'Northern Birch' : 'Common Oak';
            const treeLatin = climate === ClimateType.TROPICAL ? 'Swietenia macrophylla' :
                            climate === ClimateType.COLD ? 'Betula pendula' : 'Quercus robur';
            return { baseType, symbol, species: { name: treeName, linnaeanName: treeLatin, emoji: '🌳' } }; 
        }
        if (baseType === 'coniferous_tree') { 
            const coniferName = climate === ClimateType.COLD ? 'Arctic Spruce' : 'Common Pine';
            const coniferLatin = climate === ClimateType.COLD ? 'Picea glauca' : 'Pinus sylvestris';
            return { baseType, symbol, species: { name: coniferName, linnaeanName: coniferLatin, emoji: '🌲' } }; 
        }
        if (baseType === 'palm_tree') { 
            const palmName = biome === BiomeType.OASIS ? 'Date Palm' :
                           biome === BiomeType.BEACH ? 'Coconut Palm' : 'Royal Palm';
            const palmLatin = biome === BiomeType.OASIS ? 'Phoenix dactylifera' :
                            biome === BiomeType.BEACH ? 'Cocos nucifera' : 'Roystonea regia';
            return { baseType, symbol, species: { name: palmName, linnaeanName: palmLatin, emoji: '🌴' } }; 
        }
    }

    return null;
  } catch (error) {
    console.warn(`Error determining vegetation for biome ${tile.biome} in climate ${climate}:`, error);
    return null;
  }
}

export function generateVegetation(mapData: MapData, noise: ValueNoise): VegetationEntity[] {
  const vegetation: VegetationEntity[] = [];
  const placementNoise = new ValueNoise(noise.random() * 10000);
  const clusterNoise = new ValueNoise(noise.random() * 20000); // For clustering effects
  const { tiles, climate } = mapData;
  
 // CLIMATE-BASED VEGETATION LIMITS (much more realistic)
  const getVegetationLimits = (climate: ClimateType) => {
    switch (climate) {
      case ClimateType.ARID:
        return { maxTrees: 20, maxNonTrees: 15 }; // No trees, sparse cacti/bushes
      case ClimateType.TROPICAL:
        return { maxTrees: 100, maxNonTrees: 25 }; // Lush tropical vegetation
      case ClimateType.SEMITROPICAL:
        return { maxTrees: 80, maxNonTrees: 20 };
      case ClimateType.TEMPERATE:
        return { maxTrees: 100, maxNonTrees: 15 };
      case ClimateType.COLD:
        return { maxTrees: 50, maxNonTrees: 2 }; // Sparse northern forests
      case ClimateType.MEDITERRANEAN:
        return { maxTrees: 70, maxNonTrees: 30 }; // Moderate trees with many herbs/bushes
      default:
        return { maxTrees: 50, maxNonTrees: 25 };
    }
  };

  const { maxTrees, maxNonTrees } = getVegetationLimits(climate);
  
  // BIOME-SPECIFIC DENSITY MULTIPLIERS
  const getBiomeDensityMultiplier = (biome: BiomeType) => {
    switch (biome) {
      case BiomeType.JUNGLE: return 2.5; // Super dense
      case BiomeType.DENSE_FOREST: return 2.0;
      case BiomeType.FOREST: return 1.5;
      case BiomeType.WETLANDS: return 1.4;
      case BiomeType.RIVERBANK: return 1.3; // Water proximity boost
      case BiomeType.OASIS: return 1.2; // Desert oasis density boost
      case BiomeType.GRASSLAND: return 0.3;
      case BiomeType.STEPPE: return 0.2;
      case BiomeType.SCRUB: return 0.4;
      case BiomeType.DESERT: return 0.1; // Very sparse
      case BiomeType.TUNDRA: return 0.15;
      case BiomeType.HILLS: return 0.8;
      case BiomeType.MOUNTAIN: return 0.6;
      case BiomeType.HIGH_PEAK: return 0.2; // Harsh high altitude
      case BiomeType.BEACH: return 0.2;
      case BiomeType.FARMLAND: return 0.5; // Managed agriculture
      default: return 1.0;
    }
  };

  // CLUSTERING LOGIC - vegetation tends to grow in groups
  const getClusterBonus = (x: number, y: number) => {
    const clusterScale = 0.15; // Larger scale for clustering
    const clusterValue = clusterNoise.octaveNoise(x * clusterScale, y * clusterScale, 2, 0.5, 2.0);
    // Strong clustering effect - creates patches of dense vegetation
    return clusterValue > 0.6 ? 0.3 : (clusterValue > 0.4 ? 0.1 : -0.1);
  };

  // WATER PROXIMITY BONUS
  const getWaterProximityBonus = (tile: Tile, tiles: Tile[][]) => {
    const radius = 2;
    let waterTiles = 0;
    let totalChecked = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = tile.x + dx;
        const ny = tile.y + dy;
        if (nx >= 0 && nx < mapData.width && ny >= 0 && ny < mapData.height) {
          const neighbor = tiles[ny][nx];
          if (!neighbor.isLand || [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.OASIS].includes(neighbor.biome)) {
            waterTiles++;
          }
          totalChecked++;
        }
      }
    }
    
    const waterRatio = waterTiles / totalChecked;
    return waterRatio > 0.3 ? 0.2 : (waterRatio > 0.1 ? 0.1 : 0);
  };

  try {
    // ENHANCED PLACEMENT ALGORITHM
    const validPositions: { 
      x: number, 
      y: number, 
      vegData: { baseType: VegetationBaseType, symbol: string, species: VegetationSpecies }, 
      isTree: boolean,
      priority: number // For better placement ordering
    }[] = [];
    
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = tiles[y]?.[x];
        if (!tile || !tile.isLand || tile.vegetationId || !tile.qualities) continue;
        
        try {
          // BASE NOISE for natural variation
          const baseNoise = placementNoise.octaveNoise(x * 0.12, y * 0.12, 3, 0.6, 2.1);
          
          // CLIMATE-ADJUSTED BASE THRESHOLD
          const climateThreshold = (() => {
            switch (climate) {
              case ClimateType.ARID: return 0.75; // Much harder to place vegetation
              case ClimateType.TROPICAL: return 0.35; // Very easy
              case ClimateType.SEMITROPICAL: return 0.45;
              case ClimateType.TEMPERATE: return 0.55;
              case ClimateType.COLD: return 0.65;
              case ClimateType.MEDITERRANEAN: return 0.50; // Moderate vegetation density
              default: return 0.55;
            }
          })();
          
          // APPLY ALL MODIFIERS
          const biodiversityBonus = (tile.qualities.biodiversity - 0.5) * 0.2;
          const biomeMultiplier = getBiomeDensityMultiplier(tile.biome);
          const clusterBonus = getClusterBonus(x, y);
          const waterBonus = getWaterProximityBonus(tile, tiles);
          
          // FINAL THRESHOLD with all factors
          const finalThreshold = climateThreshold - biodiversityBonus - clusterBonus - waterBonus;
          const adjustedNoise = baseNoise * biomeMultiplier;
          
          // SPECIAL BONUSES for valuable/rare locations
          let specialBonus = 0;
          if (tile.biome === BiomeType.HOLY_SITE) specialBonus += 0.15; // Sacred groves
          if (tile.biome === BiomeType.RUINS) specialBonus += 0.1; // Overgrown ruins
          
          if (adjustedNoise > (finalThreshold - specialBonus)) {
            const vegData = determineVegetation(tile, climate, noise);
            if (vegData) {
              const isTree = ['deciduous_tree', 'coniferous_tree', 'palm_tree'].includes(vegData.baseType);
              
              // PRIORITY SYSTEM for better placement
              let priority = adjustedNoise;
              if (tile.biome === BiomeType.JUNGLE) priority += 0.3; // Jungle gets priority
              if (isTree) priority += 0.1; // Trees get slight priority
              if (waterBonus > 0) priority += waterBonus; // Water proximity priority
              
              validPositions.push({ x, y, vegData, isTree, priority });
            }
          }
        } catch (error) {
          console.warn(`Error checking vegetation at tile (${x}, ${y}):`, error);
        }
      }
    }
    
    // SMART SORTING: Sort by priority (highest first) for better distribution
    validPositions.sort((a, b) => b.priority - a.priority);
    
    // ENHANCED PLACEMENT with better distribution
    let treeCount = 0;
    let nonTreeCount = 0;
    
    for (const position of validPositions) {
      if (position.isTree && treeCount >= maxTrees) continue;
      if (!position.isTree && nonTreeCount >= maxNonTrees) continue;
      
      const tile = tiles[position.y][position.x];
      const entity: VegetationEntity = {
        id: `veg-${vegetationIdCounter++}`,
        baseType: position.vegData.baseType,
        speciesName: position.vegData.species.name,
        linnaeanName: position.vegData.species.linnaeanName,
        symbol: position.vegData.symbol,
        x: position.x,
        y: position.y
      };
      
      vegetation.push(entity);
      tile.vegetationId = entity.id;
      
      if (position.isTree) {
        treeCount++;
      } else {
        nonTreeCount++;
      }
    }
    
  } catch (error) {
    console.error("Error in vegetation generation:", error);
  }
  
  const finalTreeCount = vegetation.filter(v => ['deciduous_tree', 'coniferous_tree', 'palm_tree'].includes(v.baseType)).length;
  const finalNonTreeCount = vegetation.length - finalTreeCount;
  
  console.log(`[Gen] Placed ${vegetation.length} vegetation entities (${finalTreeCount} trees, ${finalNonTreeCount} bushes/cacti) for ${climate} climate.`);
  console.log(`[Gen] Climate limits: ${maxTrees} trees, ${maxNonTrees}. Utilization: ${((finalTreeCount/maxTrees)*100).toFixed(1)}% trees, ${((finalNonTreeCount/maxNonTrees)*100).toFixed(1)}% other.`);
  
  return vegetation;
}