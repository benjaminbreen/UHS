
import {
  AmbianceContext,
  HistoricalEra,
  Tile,
  BiomeType,
  ClimateType,
  MapArchetype,
  TimeOfDay,
  VisibleLandInfo,
  InteriorEntity,
} from '../types';
import {
  AMBIANCE_BIOME_FRAGMENTS,
  AMBIANCE_CLIMATE_FRAGMENTS,
  AMBIANCE_HISTORICAL_ERA_FRAGMENTS,
  AMBIANCE_NEIGHBORING_BIOME_FRAGMENTS,
  AMBIANCE_QUALITY_FRAGMENTS,
  AMBIANCE_TIMEOFDAY_FRAGMENTS,
  AMBIANCE_INTERIOR_FRAGMENTS,
} from '../constants/ambiance';
import { ValueNoise } from '../utils/noise'; // For seeded random selection

function getRandomFragment(fragments: string[] | undefined, seededRandom: () => number): string {
  if (!fragments || fragments.length === 0) return "";
  return fragments[Math.floor(seededRandom() * fragments.length)];
}

function getQualityPhrase(qualityName: keyof Tile['qualities'], value: number, seededRandom: () => number): string {
    const fragments = AMBIANCE_QUALITY_FRAGMENTS[qualityName];
    if (!fragments) return "";
    if (value > 0.75 && fragments.high) return getRandomFragment(fragments.high, seededRandom);
    if (value < 0.25 && fragments.low) return getRandomFragment(fragments.low, seededRandom);
    return "";
}

const directionMap: Record<string, string> = {
    N: 'north', NE: 'north-east', E: 'east', SE: 'south-east',
    S: 'south', SW: 'south-west', W: 'west', NW: 'north-west'
};

function getDistantLandPhrase(visibleLand: VisibleLandInfo | null, seededRandom: () => number, historicalEra: HistoricalEra, climate: ClimateType): string {
  if (!visibleLand) return "";

  const { biome, direction, distance } = visibleLand;
  let phrase = "";
  const fullDirStr = directionMap[direction] || direction.toLowerCase();


  if (distance > 3.5) { // Far (4-5 tiles)
    phrase = `Far off to the ${fullDirStr}, `;
    switch (biome) {
      case BiomeType.MOUNTAIN:
      case BiomeType.HIGH_PEAK:
        phrase += "a line of distant mountains pierces the horizon."; break;
      case BiomeType.FOREST:
      case BiomeType.DENSE_FOREST:
      case BiomeType.JUNGLE:
        phrase += "a dark smudge of forest or jungle meets the sky."; break;
      case BiomeType.DESERT:
        phrase += "the hazy outline of arid land shimmers."; break;
      default:
        phrase += "a faint line suggests land lies in that direction."; break;
    }
  } else if (distance > 1.5) { // Near (2-3 tiles)
    phrase = `To the ${fullDirStr}, `;
    switch (biome) {
      case BiomeType.MOUNTAIN: phrase += "imposing mountains rise."; break;
      case BiomeType.HIGH_PEAK: phrase += "snow-capped peaks are visible."; break;
      case BiomeType.FOREST: phrase += "a stretch of forest is clearly visible."; break;
      case BiomeType.DENSE_FOREST: phrase += "a dense, dark forest looms."; break;
      case BiomeType.JUNGLE: phrase += "impenetrable jungle meets the water's edge."; break;
      case BiomeType.HILLS: phrase += "rolling hills can be seen."; break;
      case BiomeType.BEACH: phrase += "a sandy beach lines the coast."; break;
      case BiomeType.DESERT: phrase += "arid desert sands stretch out."; break;
      case BiomeType.GRASSLAND: phrase += "open grasslands meet the horizon."; break;
      case BiomeType.DENSE_CITY: 
        phrase += "the distinct silhouette of a large city is visible.";
        if ((historicalEra === HistoricalEra.INDUSTRIAL_ERA || historicalEra === HistoricalEra.MODERN_ERA) && seededRandom() < 0.4) {
            phrase += " Wisps of smoke rise from its chimneys.";
        }
        break;
      case BiomeType.LOW_DENSITY_CITY: phrase += "a scattering of buildings indicates a smaller settlement."; break;
      case BiomeType.HAMLET: phrase += "a few structures suggest a small hamlet."; break;
      case BiomeType.RUINS: phrase += "the crumbling shapes of ancient ruins are visible."; break;
      default: phrase += `land is visible, appearing to be ${biome.toLowerCase().replace(/_/g, ' ')}.`; break;
    }
  } else { // Very Close (1 tile)
    phrase = `Immediately to the ${fullDirStr}, `;
    switch (biome) {
      case BiomeType.FOREST: phrase += "the edge of a forest begins."; break;
      case BiomeType.DENSE_FOREST: phrase += "an imposing dense forest starts here."; break;
      case BiomeType.BEACH: phrase += "a sandy beach is directly ahead."; break;
      case BiomeType.CLIFF: phrase += "sheer cliffs drop into the water."; break; 
      case BiomeType.MOUNTAIN: phrase += "the foothills of a mountain range begin."; break;
      default: phrase += `the terrain changes to ${biome.toLowerCase().replace(/_/g, ' ')}.`; break;
    }
  }
  return phrase;
}

function generateInteriorAmbiance(context: AmbianceContext, seededRandom: () => number): string {
    if (!context.interiorMapData || !context.interiorPlayerPos) return "You are inside a building.";

    const { interiorMapData, interiorPlayerPos } = context;
    const { tiles, entities, rooms } = interiorMapData;
    const playerTile = tiles[interiorPlayerPos.y]?.[interiorPlayerPos.x];

    if (!playerTile) return "You are somewhere inside.";
    
    const fragments: string[] = [];

    // 1. Room purpose
    const currentRoom = rooms?.find(r => 
        playerTile.x >= r.x && playerTile.x < r.x + r.width &&
        playerTile.y >= r.y && playerTile.y < r.y + r.height
    );
    if(currentRoom?.purpose) {
        const purposeFragments = AMBIANCE_INTERIOR_FRAGMENTS.roomPurpose[currentRoom.purpose];
        if(purposeFragments) fragments.push(getRandomFragment(purposeFragments, seededRandom));
    } else {
        fragments.push("You are in a hallway.");
    }

    // 2. Tile Qualities
    if (playerTile.qualities) {
        if (playerTile.qualities.cleanliness < 0.3) {
            fragments.push(getRandomFragment(AMBIANCE_INTERIOR_FRAGMENTS.qualities.dusty, seededRandom));
        } else if (playerTile.qualities.cleanliness > 0.8) {
             fragments.push(getRandomFragment(AMBIANCE_INTERIOR_FRAGMENTS.qualities.clean, seededRandom));
        }
        if (playerTile.qualities.value > 0.7) {
            fragments.push(getRandomFragment(AMBIANCE_INTERIOR_FRAGMENTS.qualities.valuable, seededRandom));
        }
    }


    // 3. Nearby furniture
    let closestEntity: { entity: InteriorEntity; dist: number } | null = null;
    for (const entity of entities) {
        const entityGridX = Math.floor(entity.x / 32);
        const entityGridY = Math.floor(entity.y / 32);
        const dist = Math.hypot(playerTile.x - entityGridX, playerTile.y - entityGridY);
        if (dist < 3 && (!closestEntity || dist < closestEntity.dist)) {
            closestEntity = { entity, dist };
        }
    }

    if (closestEntity) {
        const furnitureFragments = AMBIANCE_INTERIOR_FRAGMENTS.furniture[closestEntity.entity.subType];
        if (furnitureFragments) fragments.push(getRandomFragment(furnitureFragments, seededRandom));
    }
    
    // Assemble
    if (fragments.length === 0) return "You stand inside a building.";

    // Remove duplicates and assemble
    const uniqueFragments = [...new Set(fragments)];
    const finalText = uniqueFragments
        .filter(f => f && f.trim() !== "")
        .slice(0, 2) // Max 2 fragments for concise text
        .map(f => f.charAt(0).toUpperCase() + f.slice(1))
        .join(" ")
        .replace(/ \./g, '.');

    return `${finalText}.`;
}

export function generateAmbianceText(context: AmbianceContext): string {
  const seededRandom = new ValueNoise(context.mapSeed + context.gameHour + context.currentTile.x * 13 + context.currentTile.y * 31).random;

  // Dispatch to interior ambiance generator if applicable
  if (context.interiorMapData) {
      return generateInteriorAmbiance(context, seededRandom);
  }

  const selectedFragments: string[] = [];

  // 1. Time of Day
  const timeFragments = AMBIANCE_TIMEOFDAY_FRAGMENTS[context.timeOfDay];
  selectedFragments.push(getRandomFragment(timeFragments, seededRandom));

  // 2. Biome Specific (incorporating historical context if relevant)
  const biomeKey = context.currentTile.biome;
  let biomeMainFragment = "";
  const biomeTimeSpecificKey = context.timeOfDay.toLowerCase() as keyof typeof AMBIANCE_BIOME_FRAGMENTS[typeof biomeKey];

  if (AMBIANCE_BIOME_FRAGMENTS[biomeKey]?.[biomeTimeSpecificKey] && seededRandom() < 0.7) {
      biomeMainFragment = getRandomFragment(AMBIANCE_BIOME_FRAGMENTS[biomeKey]![biomeTimeSpecificKey]!, seededRandom);
  } else if (AMBIANCE_BIOME_FRAGMENTS[biomeKey]?.general) {
      biomeMainFragment = getRandomFragment(AMBIANCE_BIOME_FRAGMENTS[biomeKey]!.general!, seededRandom);
  }

  // Modify biome fragment with historical context IF applicable and current tile is a settlement
  if (biomeKey === BiomeType.DENSE_CITY || biomeKey === BiomeType.LOW_DENSITY_CITY || biomeKey === BiomeType.HAMLET) {
    if (context.historicalEra === HistoricalEra.INDUSTRIAL_ERA && seededRandom() < 0.5) {
        biomeMainFragment += (biomeMainFragment ? " " : "") + "The distant chuffing of a steam train or the clang of industry can sometimes be heard.";
    } else if (context.historicalEra === HistoricalEra.MODERN_ERA && seededRandom() < 0.3) {
        if(context.currentTile.isLand) {
             biomeMainFragment += (biomeMainFragment ? " " : "") + "The low hum of distant motor traffic is barely perceptible.";
        }
    }
  }
  if (biomeMainFragment) selectedFragments.push(biomeMainFragment);


  // 3. Climate
  const climateGeneralFragments = AMBIANCE_CLIMATE_FRAGMENTS[context.climate];
  if (climateGeneralFragments && climateGeneralFragments.length > 0 && seededRandom() < 0.4) {
      selectedFragments.push(getRandomFragment(climateGeneralFragments, seededRandom));
  }

  // 4. Distant Land Description
  const distantLandPhrase = getDistantLandPhrase(context.visibleLandDirection, seededRandom, context.historicalEra as HistoricalEra, context.climate);
  if (distantLandPhrase && seededRandom() < 0.85) { 
      selectedFragments.push(distantLandPhrase);
  }

  // 5. Qualities (pick one strong quality if no distant land was mentioned or by lower chance)
  if (!distantLandPhrase || seededRandom() < 0.3) {
    const qualities = context.currentTile.qualities;
    const qualityOrder: (keyof Tile['qualities'])[] = ['safety', 'healthiness', 'sacrality', 'biodiversity', 'flammability'];
    for (const qualityName of qualityOrder) {
        if (seededRandom() < 0.25) { 
            const phrase = getQualityPhrase(qualityName, qualities[qualityName], seededRandom);
            if (phrase) {
                selectedFragments.push(phrase);
                break; 
            }
        }
    }
  }
  
  // 6. (Optional) Neighboring Biomes (for very immediate, non-horizon effects, reduced chance if distant land mentioned)
  if ((!distantLandPhrase || seededRandom() < 0.2) && selectedFragments.filter(f => f).length < 3 && context.neighboringTiles.length > 0) {
      const neighborCounts: Partial<Record<BiomeType, number>> = {};
      context.neighboringTiles.forEach(nt => {
          neighborCounts[nt.biome] = (neighborCounts[nt.biome] || 0) + 1;
      });
      let dominantNeighbor: BiomeType | null = null;
      let maxCount = 0;
      for (const biome in neighborCounts) {
          if ((neighborCounts[biome as BiomeType] ?? 0) > maxCount) {
              maxCount = neighborCounts[biome as BiomeType]!;
              dominantNeighbor = biome as BiomeType;
          }
      }
      if (dominantNeighbor && dominantNeighbor !== context.currentTile.biome && dominantNeighbor !== context.visibleLandDirection?.biome &&
          AMBIANCE_NEIGHBORING_BIOME_FRAGMENTS[dominantNeighbor] && seededRandom() < 0.3) { 
          selectedFragments.push(getRandomFragment(AMBIANCE_NEIGHBORING_BIOME_FRAGMENTS[dominantNeighbor], seededRandom));
      }
  }


  // Assemble into sentences
  let nonEmptyFragments = selectedFragments.filter(f => f && f.trim() !== "");
  
  if (nonEmptyFragments.length < 2 && seededRandom() < 0.15) {
      const eraFragments = AMBIANCE_HISTORICAL_ERA_FRAGMENTS[context.historicalEra as HistoricalEra];
      if (eraFragments && eraFragments.length > 0) {
          const eraFragment = getRandomFragment(eraFragments, seededRandom);
          if (!( (context.currentTile.biome === BiomeType.DENSE_CITY || context.currentTile.biome === BiomeType.LOW_DENSITY_CITY) && 
                 (context.historicalEra === HistoricalEra.INDUSTRIAL_ERA || context.historicalEra === HistoricalEra.MODERN_ERA) )) {
            nonEmptyFragments.push(eraFragment);
          }
      }
  }
  nonEmptyFragments = nonEmptyFragments.filter(f => f && f.trim() !== ""); // Re-filter

  if (nonEmptyFragments.length === 0) {
      if (context.currentTile.biome === BiomeType.DEEP_OCEAN) return "The vast ocean stretches in all directions under the open sky.";
      return "The surroundings are quiet and unremarkable at this moment.";
  }

  let finalText = nonEmptyFragments
    .map(f => f.trim().replace(/[.!?]$/, "")) 
    .filter(f => f)
    .map(f => f.charAt(0).toUpperCase() + f.slice(1))
    .join(". ") + ".";
  
  finalText = finalText.replace(/\.\s*\./g, ".").replace(/\s\s+/g, " ");

  return finalText;
}
