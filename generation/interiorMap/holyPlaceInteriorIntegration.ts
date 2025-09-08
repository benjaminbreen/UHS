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
  spaces.push({
    id: 'main_hall',
    name: mainHall.name,
    type: 'altar',
    bounds: { x: 10, y: 8, width: 20, height: 16 },
    floorType: getFloorTypeForCulture(holyLayout.culturalZone, holyLayout.era),
    wallHeight: 8,
    lightingSources: getLightingForRoom(mainHall, holyLayout.culturalZone),
    furniture: getFurnitureForRoom(mainHall, holyLayout.culturalZone),
    accessibility: 'public',
    requiredReligion: undefined,
    requiredClass: undefined
  });
  
  // Private Rooms - Smaller, restricted access
  holyLayout.privateRooms.forEach((room, index) => {
    const xOffset = index % 2 === 0 ? 2 : 32; // Left or right side
    const yOffset = 26 + Math.floor(index / 2) * 10;
    
    spaces.push({
      id: `private_${index}`,
      name: room.name,
      type: 'room',
      bounds: { x: xOffset, y: yOffset, width: 6, height: 8 },
      floorType: getFloorTypeForCulture(holyLayout.culturalZone, holyLayout.era),
      wallHeight: 5,
      lightingSources: getLightingForRoom(room, holyLayout.culturalZone),
      furniture: getFurnitureForRoom(room, holyLayout.culturalZone),
      accessibility: room.type as 'public' | 'restricted' | 'sacred',
      requiredReligion: room.requiredPermission === 'clergy' ? religion : undefined,
      requiredClass: getRequiredClassForPermission(room.requiredPermission)
    });
  });
  
  // Restricted Rooms - Medium-sized, special access
  holyLayout.restrictedRooms.forEach((room, index) => {
    const yOffset = 2 + index * 6;
    const xOffset = index % 2 === 0 ? 8 : 24;
    
    spaces.push({
      id: `restricted_${index}`,
      name: room.name,
      type: 'room',
      bounds: { x: xOffset, y: yOffset, width: 8, height: 5 },
      floorType: getFloorTypeForCulture(holyLayout.culturalZone, holyLayout.era),
      wallHeight: 6,
      lightingSources: getLightingForRoom(room, holyLayout.culturalZone),
      furniture: getFurnitureForRoom(room, holyLayout.culturalZone),
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
 * Get lighting for a room based on its features and culture
 */
function getLightingForRoom(room: HolyPlaceRoom, culture: CulturalZone): ArchitecturalSpace['lightingSources'] {
  const lights: ArchitecturalSpace['lightingSources'] = [];
  
  // Map room features to lighting
  if (room.features.includes('candles')) {
    lights.push({ type: 'candle', position: { x: 0, y: 0 }, intensity: 0.3, color: '#FFD700' });
  }
  if (room.features.includes('oil_lamps')) {
    lights.push({ type: 'candle', position: { x: 0, y: 0 }, intensity: 0.4, color: '#FFA500' });
  }
  if (room.features.includes('brazier') || room.features.includes('incense_burners')) {
    lights.push({ type: 'brazier', position: { x: 0, y: 0 }, intensity: 0.5, color: '#FF6347' });
  }
  if (room.features.includes('chandelier') || room.features.includes('crystal_chandeliers')) {
    lights.push({ type: 'chandelier', position: { x: 0, y: 0 }, intensity: 0.8, color: '#FFD700' });
  }
  if (room.features.includes('stained_glass')) {
    lights.push({ type: 'window', position: { x: 0, y: 0 }, intensity: 0.6, color: '#87CEEB' });
  }
  if (room.features.includes('sacred_flame') || room.features.includes('eternal_flame')) {
    lights.push({ type: 'altar_glow', position: { x: 0, y: 0 }, intensity: 0.7, color: '#FF4500' });
  }
  
  // Default lighting if none specified
  if (lights.length === 0) {
    lights.push({ type: 'torch', position: { x: 0, y: 0 }, intensity: 0.5, color: '#FFA500' });
  }
  
  return lights;
}

/**
 * Get furniture for a room based on its features
 */
function getFurnitureForRoom(room: HolyPlaceRoom, culture: CulturalZone): ArchitecturalSpace['furniture'] {
  const furniture: ArchitecturalSpace['furniture'] = [];
  
  // Map room features to furniture
  if (room.features.includes('altar') || room.features.includes('offering_altar')) {
    furniture.push({ type: 'altar', position: { x: 0, y: 0 } });
  }
  if (room.features.includes('pews') || room.features.includes('prayer_rugs')) {
    furniture.push({ type: 'pew', position: { x: 0, y: 0 } });
  }
  if (room.features.includes('throne') || room.features.includes('golden_stool')) {
    furniture.push({ type: 'throne', position: { x: 0, y: 0 } });
  }
  if (room.features.includes('columns') || room.features.includes('pillars') || room.features.includes('ornate_pillars')) {
    furniture.push({ type: 'pillar', position: { x: 0, y: 0 } });
  }
  if (room.features.includes('carpet') || room.features.includes('silk_carpets') || room.features.includes('persian_rugs')) {
    furniture.push({ type: 'rug', position: { x: 0, y: 0 }, scale: 2 });
  }
  if (room.features.includes('treasure_chests') || room.features.includes('donation_chest')) {
    furniture.push({ type: 'chest', position: { x: 0, y: 0 } });
  }
  if (room.features.includes('tapestries')) {
    furniture.push({ type: 'tapestry', position: { x: 0, y: 0 } });
  }
  if (room.features.includes('statue') || room.features.includes('buddha_statue') || room.features.includes('deity_statue')) {
    furniture.push({ type: 'statue', position: { x: 0, y: 0 } });
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