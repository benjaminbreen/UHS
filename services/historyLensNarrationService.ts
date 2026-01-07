import type { MapData, PlayerCharacter, TerrainStructure } from '../types';

type Direction = 'north' | 'south' | 'east' | 'west';

type LocationContext = {
  mapData: MapData;
  playerCharacter: PlayerCharacter;
  playerMode: 'ship' | 'onFoot' | string;
  playerX: number;
  playerY: number;
  localArea?: string | null;
  currentZone?: string | null;
  currentRegion?: string | null;
};

type MovementContext = LocationContext & {
  direction: Direction;
};

const directionLabel = (dx: number, dy: number): Direction => {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
  return dy >= 0 ? 'south' : 'north';
};

const biomePhrase = (biome?: string) => {
  if (!biome) return 'uncertain ground';
  const normalized = biome.toUpperCase();
  switch (normalized) {
    case 'MAJOR_RIVER':
      return 'the broad river';
    case 'RIVER':
      return 'the river';
    case 'RIVERBANK':
      return 'the riverbank';
    case 'SHALLOW_OCEAN':
    case 'DEEP_OCEAN':
      return 'open water';
    case 'BEACH':
      return 'the beach';
    case 'FOREST':
    case 'DENSE_FOREST':
      return 'the forest edge';
    case 'GRASSLAND':
    case 'PRAIRIE':
      return 'open grassland';
    case 'HILLS':
      return 'low hills';
    case 'MOUNTAIN':
    case 'HIGH_PEAK':
      return 'rocky high ground';
    case 'DESERT':
      return 'dry scrub and sand';
    case 'SNOW':
      return 'snow-covered ground';
    case 'TUNDRA':
      return 'tundra';
    case 'JUNGLE':
      return 'dense jungle';
    case 'URBAN':
    case 'DENSE_CITY':
    case 'LOW_DENSITY_CITY':
      return 'settled streets';
    default:
      return biome.toLowerCase().replace(/_/g, ' ');
  }
};

const climatePhrase = (climate?: string, season?: string) => {
  const bits = [season, climate].filter(Boolean);
  if (!bits.length) return '';
  return `The air is ${bits.join(' and ').toLowerCase()}.`;
};

const nearestLandmark = (mapData: MapData, playerX: number, playerY: number, maxDistance = 8) => {
  const structures = mapData.terrainStructures || [];
  let closest: { structure: TerrainStructure; distance: number; dx: number; dy: number } | null = null;
  for (const structure of structures) {
    const dx = structure.location[0] - playerX;
    const dy = structure.location[1] - playerY;
    const distance = Math.hypot(dx, dy);
    if (distance <= maxDistance && (!closest || distance < closest.distance)) {
      closest = { structure, distance, dx, dy };
    }
  }
  if (!closest) return null;
  return {
    name: closest.structure.name || closest.structure.structureType,
    direction: directionLabel(closest.dx, closest.dy),
    distance: Math.round(closest.distance)
  };
};

export const describeCurrentLocation = (context: LocationContext): string => {
  const tile = context.mapData.tiles[context.playerY]?.[context.playerX];
  const biome = tile?.biome;
  const landmark = nearestLandmark(context.mapData, context.playerX, context.playerY);
  const area = context.localArea || context.currentRegion || context.currentZone || 'the region';
  const climateLine = climatePhrase(context.mapData.climate, context.mapData.season);
  const identity = context.playerCharacter.name
    ? `You are ${context.playerCharacter.name}, a ${context.playerCharacter.age}-year-old ${context.playerCharacter.profession}${context.playerCharacter.birthplace ? ` from ${context.playerCharacter.birthplace}` : ''}.`
    : `You are a ${context.playerCharacter.profession}.`;

  if (context.playerMode === 'ship') {
    const landmarkLine = landmark ? ` ${landmark.name} lies to the ${landmark.direction}.` : '';
    return [
      identity,
      `You stand aboard a vessel on ${biomePhrase(biome)} near ${area}.${landmarkLine}`,
      climateLine,
      'What matters now is simple: keep to the channel, choose a landing, and mind who sees you.'
    ].filter(Boolean).join(' ');
  }

  const landmarkLine = landmark ? ` ${landmark.name} is to the ${landmark.direction}.` : '';
  return [
    identity,
    `You are on ${biomePhrase(biome)} in ${area}.${landmarkLine}`,
    climateLine,
    'The next hours turn on shelter, water, and the first person willing to deal honestly with you.'
  ].filter(Boolean).join(' ');
};

export const describeMovement = (context: MovementContext): string => {
  const verb = context.playerMode === 'ship' ? 'sail' : 'travel';
  const landmark = nearestLandmark(context.mapData, context.playerX, context.playerY);
  if (landmark) {
    return `You ${verb} ${context.direction}, angling toward ${landmark.name} to the ${landmark.direction}.`;
  }
  return `You ${verb} ${context.direction}, keeping to the terrain ahead.`;
};

export const describeEmbark = (context: LocationContext): string => {
  const area = context.localArea || context.currentRegion || context.currentZone || 'the shore';
  return `You embark and push off from ${area}.`;
};

export const describeDisembark = (context: LocationContext): string => {
  const area = context.localArea || context.currentRegion || context.currentZone || 'the shore';
  return `You make landfall near ${area} and disembark.`;
};

export const describeArrival = (context: LocationContext): string => {
  const area = context.localArea || context.currentRegion || context.currentZone || 'the region';
  const climate = context.mapData.climate || 'local';
  return `You arrive in ${area}, and the ${climate.toLowerCase()} air marks the change before the people do.`;
};

export const describePoi = (structure: TerrainStructure, context: LocationContext): string => {
  const name = structure.name || structure.structureType;
  return `You come upon ${name}, a place that pulls the eye and sets the tone for this stretch of country.`;
};
