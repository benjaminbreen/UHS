/**
 * generation/interiorMap/holyPlaceInteriorIntegration.ts
 * Integrates the holy place layouts with the interior map generation system
 */

import { BuildingLayout, ArchitecturalSpace } from './architecturalLayouts';
import { getHolyPlaceLayout, HolyPlaceLayout, HolyPlaceRoom } from './holyPlaceLayouts';
import { CulturalZone, HistoricalEra } from '../../types';

/**
 * Convert a HolyPlaceLayout to a BuildingLayout for the interior map system
 */
export function convertHolyPlaceLayoutToBuildingLayout(
  holyLayout: HolyPlaceLayout,
  religion?: string
): BuildingLayout {
  const spaces: ArchitecturalSpace[] = [];
  const totalWidth = 40;
  const totalHeight = 48;
  
  // Main Hall - Large central public space
  const mainHall = holyLayout.mainHall;
  const mainHallBounds = { x: 10, y: 8, width: 20, height: 16 };
  spaces.push({
    id: 'main_hall',
    name: mainHall.name,
    type: 'altar',
    bounds: mainHallBounds,
    floorType: getFloorTypeForCulture(holyLayout.culturalZone, holyLayout.era),
    wallHeight: 8,
    lightingSources: getLightingForRoomWithPositions(mainHall, holyLayout.culturalZone, mainHallBounds),
    furniture: getFurnitureForRoomWithPositions(mainHall, holyLayout.culturalZone, mainHallBounds),
    accessibility: 'public',
    requiredReligion: undefined,
    requiredClass: undefined
  });
  
  // Private Rooms - Smaller, restricted access
  holyLayout.privateRooms.forEach((room, index) => {
    const xOffset = index % 2 === 0 ? 2 : 32; // Left or right side
    const yOffset = 26 + Math.floor(index / 2) * 10;
    const privateBounds = { x: xOffset, y: yOffset, width: 6, height: 8 };

    spaces.push({
      id: `private_${index}`,
      name: room.name,
      type: 'room',
      bounds: privateBounds,
      floorType: getFloorTypeForCulture(holyLayout.culturalZone, holyLayout.era),
      wallHeight: 5,
      lightingSources: getLightingForRoomWithPositions(room, holyLayout.culturalZone, privateBounds),
      furniture: getFurnitureForRoomWithPositions(room, holyLayout.culturalZone, privateBounds),
      accessibility: room.type as 'public' | 'restricted' | 'sacred',
      requiredReligion: room.requiredPermission === 'clergy' ? religion : undefined,
      requiredClass: getRequiredClassForPermission(room.requiredPermission)
    });
  });

  // Restricted Rooms - Medium-sized, special access
  holyLayout.restrictedRooms.forEach((room, index) => {
    const yOffset = 2 + index * 6;
    const xOffset = index % 2 === 0 ? 8 : 24;
    const restrictedBounds = { x: xOffset, y: yOffset, width: 8, height: 5 };

    spaces.push({
      id: `restricted_${index}`,
      name: room.name,
      type: 'room',
      bounds: restrictedBounds,
      floorType: getFloorTypeForCulture(holyLayout.culturalZone, holyLayout.era),
      wallHeight: 6,
      lightingSources: getLightingForRoomWithPositions(room, holyLayout.culturalZone, restrictedBounds),
      furniture: getFurnitureForRoomWithPositions(room, holyLayout.culturalZone, restrictedBounds),
      accessibility: 'restricted',
      requiredReligion: room.requiredPermission === 'clergy' || room.requiredPermission === 'high_clergy' ? religion : undefined,
      requiredClass: getRequiredClassForPermission(room.requiredPermission)
    });
  });
  
  // Add entrance corridor
  spaces.push({
    id: 'entrance',
    name: 'Entrance',
    type: 'entrance',
    bounds: { x: 18, y: 42, width: 4, height: 6 },
    floorType: 'stone',
    wallHeight: 4,
    lightingSources: [
      { type: 'torch', position: { x: 19, y: 44 }, intensity: 0.5, color: '#FFA500' },
      { type: 'torch', position: { x: 21, y: 44 }, intensity: 0.5, color: '#FFA500' }
    ],
    furniture: [],
    accessibility: 'public'
  });
  
  // Add connecting corridors
  spaces.push({
    id: 'corridor_north',
    name: 'North Corridor',
    type: 'corridor',
    bounds: { x: 16, y: 24, width: 8, height: 2 },
    floorType: 'stone',
    wallHeight: 4,
    lightingSources: [
      { type: 'torch', position: { x: 18, y: 25 }, intensity: 0.4, color: '#FFA500' },
      { type: 'torch', position: { x: 22, y: 25 }, intensity: 0.4, color: '#FFA500' }
    ],
    furniture: [],
    accessibility: 'public'
  });
  
  spaces.push({
    id: 'corridor_south',
    name: 'South Corridor',
    type: 'corridor',
    bounds: { x: 16, y: 40, width: 8, height: 2 },
    floorType: 'stone',
    wallHeight: 4,
    lightingSources: [
      { type: 'torch', position: { x: 18, y: 41 }, intensity: 0.4, color: '#FFA500' },
      { type: 'torch', position: { x: 22, y: 41 }, intensity: 0.4, color: '#FFA500' }
    ],
    furniture: [],
    accessibility: 'public'
  });
  
  return {
    name: `${holyLayout.culturalZone} ${holyLayout.era} Holy Site`,
    totalBounds: { width: totalWidth, height: totalHeight },
    spaces,
    entrance: { x: 20, y: 46 },
    backgroundPattern: getBackgroundPattern(holyLayout.culturalZone),
    ambientLighting: getAmbientLighting(holyLayout.culturalZone, holyLayout.era)
  };
}

/**
 * Get floor type based on culture and era
 */
function getFloorTypeForCulture(culture: CulturalZone, era: HistoricalEra): ArchitecturalSpace['floorType'] {
  const floorMapping: Partial<Record<CulturalZone, Partial<Record<HistoricalEra, ArchitecturalSpace['floorType']>>>> = {
    EUROPEAN: {
      Classical: 'marble',
      Medieval: 'stone',
      Renaissance: 'marble',
      'Early Modern': 'marble',
      Industrial: 'tile',
      Modern: 'tile'
    },
    MENA: {
      Classical: 'stone',
      Medieval: 'mosaic',
      'Early Modern': 'mosaic',
      Modern: 'marble'
    },
    EAST_ASIAN: {
      Classical: 'wood',
      Medieval: 'wood',
      'Early Modern': 'wood',
      Modern: 'wood'
    },
    SOUTH_ASIAN: {
      Classical: 'stone',
      Medieval: 'marble',
      'Early Modern': 'marble',
      Modern: 'marble'
    },
    AFRICAN: {
      Classical: 'stone',
      Medieval: 'stone',
      Modern: 'tile'
    },
    OCEANIC: {
      Classical: 'wood',
      Medieval: 'wood',
      Modern: 'wood'
    },
    INDIGENOUS_AMERICAN: {
      Classical: 'stone',
      Medieval: 'stone',
      'Early Modern': 'stone',
      Modern: 'wood'
    }
  };
  
  return floorMapping[culture]?.[era] || 'stone';
}

/**
 * Get lighting for a room based on its features and culture WITH PROPER POSITIONS
 */
function getLightingForRoomWithPositions(
  room: HolyPlaceRoom,
  culture: CulturalZone,
  bounds: { x: number; y: number; width: number; height: number }
): ArchitecturalSpace['lightingSources'] {
  const lights: ArchitecturalSpace['lightingSources'] = [];
  const centerX = bounds.x + Math.floor(bounds.width / 2);
  const centerY = bounds.y + Math.floor(bounds.height / 2);

  // Map room features to lighting with ACTUAL positions
  if (room.features.includes('chandelier') || room.features.includes('crystal_chandeliers')) {
    lights.push({ type: 'chandelier', position: { x: centerX, y: centerY }, intensity: 0.8, color: '#FFD700' });
  }

  if (room.features.includes('brazier') || room.features.includes('incense_burners')) {
    lights.push({ type: 'brazier', position: { x: bounds.x + 2, y: bounds.y + 2 }, intensity: 0.5, color: '#FF6347' });
    lights.push({ type: 'brazier', position: { x: bounds.x + bounds.width - 2, y: bounds.y + 2 }, intensity: 0.5, color: '#FF6347' });
  }

  if (room.features.includes('stained_glass')) {
    lights.push({ type: 'window', position: { x: bounds.x + 1, y: centerY }, intensity: 0.6, color: '#87CEEB' });
    lights.push({ type: 'window', position: { x: bounds.x + bounds.width - 1, y: centerY }, intensity: 0.6, color: '#87CEEB' });
  }

  if (room.features.includes('sacred_flame') || room.features.includes('eternal_flame') || room.features.includes('altar')) {
    lights.push({ type: 'altar_glow', position: { x: centerX, y: bounds.y + 3 }, intensity: 1.0, color: '#FFD700' });
  }

  if (room.features.includes('candles') || room.features.includes('oil_lamps')) {
    // Add corner lighting
    lights.push({ type: 'candle', position: { x: bounds.x + 2, y: bounds.y + 2 }, intensity: 0.4, color: '#FFD700' });
    lights.push({ type: 'candle', position: { x: bounds.x + bounds.width - 2, y: bounds.y + 2 }, intensity: 0.4, color: '#FFD700' });
  }

  // Default: torches in corners if no other lighting
  if (lights.length === 0) {
    lights.push({ type: 'torch', position: { x: bounds.x + 2, y: bounds.y + 2 }, intensity: 0.6, color: '#FFA500' });
    lights.push({ type: 'torch', position: { x: bounds.x + bounds.width - 2, y: bounds.y + 2 }, intensity: 0.6, color: '#FFA500' });
  }

  return lights;
}

/**
 * Get furniture for a room based on its features WITH PROPER POSITIONS
 */
function getFurnitureForRoomWithPositions(
  room: HolyPlaceRoom,
  culture: CulturalZone,
  bounds: { x: number; y: number; width: number; height: number }
): ArchitecturalSpace['furniture'] {
  const furniture: ArchitecturalSpace['furniture'] = [];
  const centerX = bounds.x + Math.floor(bounds.width / 2);
  const centerY = bounds.y + Math.floor(bounds.height / 2);

  // ALTAR - always at the front/top of the room
  if (room.features.includes('altar') || room.features.includes('offering_altar')) {
    furniture.push({ type: 'altar', position: { x: centerX, y: bounds.y + 2 }, rotation: 0, scale: 1.2 });
  }

  // PILLARS - in corners or flanking altar
  if (room.features.includes('columns') || room.features.includes('pillars') || room.features.includes('ornate_pillars')) {
    furniture.push({ type: 'pillar', position: { x: bounds.x + 2, y: bounds.y + 2 }, rotation: 0, scale: 1 });
    furniture.push({ type: 'pillar', position: { x: bounds.x + bounds.width - 2, y: bounds.y + 2 }, rotation: 0, scale: 1 });

    // Add more pillars if room is large enough
    if (bounds.width > 15) {
      furniture.push({ type: 'pillar', position: { x: bounds.x + 2, y: bounds.y + bounds.height - 2 }, rotation: 0, scale: 1 });
      furniture.push({ type: 'pillar', position: { x: bounds.x + bounds.width - 2, y: bounds.y + bounds.height - 2 }, rotation: 0, scale: 1 });
    }
  }

  // PEWS/SEATING - rows in the middle/back area
  if (room.features.includes('pews') || room.features.includes('prayer_rugs')) {
    const pewY = bounds.y + Math.floor(bounds.height * 0.5);
    furniture.push({ type: 'pew', position: { x: bounds.x + 4, y: pewY }, rotation: 0, scale: 1 });
    furniture.push({ type: 'pew', position: { x: bounds.x + bounds.width - 4, y: pewY }, rotation: 0, scale: 1 });

    if (bounds.height > 12) {
      furniture.push({ type: 'pew', position: { x: bounds.x + 4, y: pewY + 3 }, rotation: 0, scale: 1 });
      furniture.push({ type: 'pew', position: { x: bounds.x + bounds.width - 4, y: pewY + 3 }, rotation: 0, scale: 1 });
    }
  }

  // THRONE - center back or near altar
  if (room.features.includes('throne') || room.features.includes('golden_stool')) {
    furniture.push({ type: 'throne', position: { x: centerX, y: bounds.y + bounds.height - 3 }, rotation: 0, scale: 1.1 });
  }

  // RUG - center floor
  if (room.features.includes('carpet') || room.features.includes('silk_carpets') || room.features.includes('persian_rugs')) {
    furniture.push({ type: 'rug', position: { x: centerX, y: centerY + 2 }, rotation: 0, scale: 1.5 });
  }

  // TAPESTRY - on back wall
  if (room.features.includes('tapestries')) {
    furniture.push({ type: 'tapestry', position: { x: centerX - 4, y: bounds.y + 1 }, rotation: 0, scale: 0.9 });
    furniture.push({ type: 'tapestry', position: { x: centerX + 4, y: bounds.y + 1 }, rotation: 0, scale: 0.9 });
  }

  // STATUE - flanking altar or in corners
  if (room.features.includes('statue') || room.features.includes('buddha_statue') || room.features.includes('deity_statue')) {
    furniture.push({ type: 'statue', position: { x: bounds.x + 3, y: bounds.y + 4 }, rotation: 0, scale: 1 });
    furniture.push({ type: 'statue', position: { x: bounds.x + bounds.width - 3, y: bounds.y + 4 }, rotation: 0, scale: 1 });
  }

  // CHEST - near entrance or side room
  if (room.features.includes('treasure_chests') || room.features.includes('donation_chest')) {
    furniture.push({ type: 'chest', position: { x: bounds.x + 2, y: bounds.y + bounds.height - 2 }, rotation: 0, scale: 1 });
  }

  return furniture;
}

/**
 * Get required classes for a permission type
 */
function getRequiredClassForPermission(permission?: string): string[] | undefined {
  switch (permission) {
    case 'clergy':
    case 'high_clergy':
      return ['clergy', 'priest', 'monk', 'bishop', 'abbot'];
    case 'nobility':
      return ['nobility', 'noble', 'lord', 'duke', 'prince'];
    case 'quest':
      return undefined; // Quest-based access handled elsewhere
    default:
      return undefined;
  }
}

/**
 * Get background pattern for culture
 */
function getBackgroundPattern(culture: CulturalZone): string {
  const patterns: Record<CulturalZone, string> = {
    EUROPEAN: 'stone_gothic',
    MENA: 'geometric_islamic',
    EAST_ASIAN: 'wood_temple',
    SOUTH_ASIAN: 'marble_mandala',
    AFRICAN: 'mud_brick',
    OCEANIC: 'woven_tapa',
    INDIGENOUS_AMERICAN: 'adobe_stone',
    NORTH_AMERICAN: 'wood_lodge',
    LATIN_AMERICAN: 'adobe_colonial'
  };
  
  return patterns[culture] || 'stone_official';
}

/**
 * Get ambient lighting for culture and era
 */
function getAmbientLighting(culture: CulturalZone, era: HistoricalEra): { color: string; intensity: number } {
  // Medieval and earlier - dimmer, warmer light
  if (era === 'Classical' || era === 'Medieval') {
    return { color: '#FFA500', intensity: 0.3 };
  }
  
  // Renaissance and Early Modern - brighter, golden light
  if (era === 'Renaissance' || era === 'Early Modern') {
    return { color: '#FFD700', intensity: 0.5 };
  }
  
  // Industrial and Modern - brightest, whiter light
  if (era === 'Industrial' || era === 'Modern') {
    return { color: '#F5E6D3', intensity: 0.6 };
  }
  
  // Default
  return { color: '#F5E6D3', intensity: 0.4 };
}

/**
 * Main function to get a culturally appropriate holy place layout
 */
export function getHolyPlaceBuildingLayout(
  culturalZone: CulturalZone,
  era: HistoricalEra,
  religion?: string
): BuildingLayout | null {
  const holyLayout = getHolyPlaceLayout(culturalZone, era);
  
  if (!holyLayout) {
    console.warn(`No holy place layout found for ${culturalZone} in ${era}`);
    return null;
  }
  
  return convertHolyPlaceLayoutToBuildingLayout(holyLayout, religion);
}