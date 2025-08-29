/**
 * generation/specialMap/archetypes/universityGenerator.ts
 * Generator for university and academy special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateUniversityAcademy(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // University type varies by culture and era
  if (config.culturalZone === 'EUROPEAN') {
    if (config.era === HistoricalEra.MEDIEVAL) {
      generateMedievalUniversity(tiles, size, config, interactionZones, noise);
    } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generateRenaissanceAcademy(tiles, size, config, interactionZones, noise);
    } else if (config.era === HistoricalEra.INDUSTRIAL_ERA || 
               config.era === HistoricalEra.MODERN_ERA) {
      generateModernUniversity(tiles, size, config, interactionZones, noise);
    } else {
      generateClassicalAcademy(tiles, size, config, interactionZones, noise);
    }
  } else if (config.culturalZone === 'MENA') {
    generateMadrasa(tiles, size, config, interactionZones, noise);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    if (config.region === 'china') {
      generateConfucianAcademy(tiles, size, config, interactionZones, noise);
    } else {
      generateBuddhistMonastery(tiles, size, config, interactionZones, noise);
    }
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    generateGurukula(tiles, size, config, interactionZones, noise);
  } else {
    // Default scholarly institution
    generateLibrary(tiles, size, config, interactionZones, noise);
  }
  
  // Main exit
  exitZones.push({
    id: 'main_entrance',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  return { tiles, interactionZones, exitZones };
}

/**
 * Generate a medieval European university
 */
function generateMedievalUniversity(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Cloister-style layout
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Central courtyard (quadrangle)
  const quadSize = Math.min(size.width - 20, size.height - 20);
  const quadX = Math.floor((size.width - quadSize) / 2);
  const quadY = Math.floor((size.height - quadSize) / 2);
  
  // Covered walkway (cloister) around quad
  placeWallRectangle(tiles, quadX, quadY, quadSize, quadSize);
  fillArea(tiles, quadX + 3, quadY + 3, quadSize - 6, quadSize - 6, BiomeType.PARK);
  
  // Columns along the cloister
  for (let x = quadX + 3; x < quadX + quadSize - 3; x += 3) {
    tiles[quadY + 2][x].biome = BiomeType.COLUMN;
    tiles[quadY + quadSize - 3][x].biome = BiomeType.COLUMN;
  }
  for (let y = quadY + 3; y < quadY + quadSize - 3; y += 3) {
    tiles[y][quadX + 2].biome = BiomeType.COLUMN;
    tiles[y][quadX + quadSize - 3].biome = BiomeType.COLUMN;
  }
  
  // Lecture hall (north)
  const hallWidth = 16;
  const hallHeight = 10;
  const hallX = Math.floor((size.width - hallWidth) / 2);
  const hallY = 3;
  
  placeWallRectangle(tiles, hallX, hallY, hallWidth, hallHeight);
  fillArea(tiles, hallX + 1, hallY + 1, hallWidth - 2, hallHeight - 2, BiomeType.FLOOR_WOOD);
  
  // Lectern
  tiles[hallY + 2][hallX + Math.floor(hallWidth / 2)].biome = BiomeType.TABLE;
  tiles[hallY + 2][hallX + Math.floor(hallWidth / 2)].materialSubtype = 'lectern';
  
  // Student benches
  for (let y = hallY + 4; y < hallY + hallHeight - 2; y += 2) {
    for (let x = hallX + 2; x < hallX + hallWidth - 2; x++) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Library (west wing)
  const libX = 3;
  const libY = Math.floor(size.height / 2) - 5;
  const libWidth = 10;
  const libHeight = 10;
  
  placeWallRectangle(tiles, libX, libY, libWidth, libHeight);
  fillArea(tiles, libX + 1, libY + 1, libWidth - 2, libHeight - 2, BiomeType.FLOOR_WOOD);
  
  // Book shelves (tables)
  for (let y = libY + 2; y < libY + libHeight - 2; y += 2) {
    tiles[y][libX + 2].biome = BiomeType.TABLE;
    tiles[y][libX + 2].materialSubtype = 'bookshelf';
    tiles[y][libX + libWidth - 3].biome = BiomeType.TABLE;
    tiles[y][libX + libWidth - 3].materialSubtype = 'bookshelf';
  }
  
  // Scriptorium (east wing)
  const scripX = size.width - 13;
  const scripY = Math.floor(size.height / 2) - 5;
  
  placeWallRectangle(tiles, scripX, scripY, libWidth, libHeight);
  fillArea(tiles, scripX + 1, scripY + 1, libWidth - 2, libHeight - 2, BiomeType.FLOOR_WOOD);
  
  // Writing desks
  for (let y = scripY + 2; y < scripY + libHeight - 2; y += 2) {
    for (let x = scripX + 2; x < scripX + libWidth - 2; x += 2) {
      tiles[y][x].biome = BiomeType.TABLE;
      tiles[y][x].materialSubtype = 'desk';
    }
  }
  
  interactionZones.push(
    {
      id: 'lecture_hall',
      bounds: { x: hallX, y: hallY, width: hallWidth, height: hallHeight },
      type: 'academic',
      interactions: ['lecture', 'debate', 'examination']
    },
    {
      id: 'library',
      bounds: { x: libX, y: libY, width: libWidth, height: libHeight },
      type: 'academic',
      interactions: ['study', 'research', 'read']
    },
    {
      id: 'scriptorium',
      bounds: { x: scripX, y: scripY, width: libWidth, height: libHeight },
      type: 'academic',
      interactions: ['copy', 'illuminate', 'write']
    }
  );
}

/**
 * Generate an Islamic madrasa
 */
function generateMadrasa(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  
  // Central courtyard with fountain
  const courtSize = Math.min(size.width - 20, size.height - 20);
  const courtX = Math.floor((size.width - courtSize) / 2);
  const courtY = Math.floor((size.height - courtSize) / 2);
  
  fillArea(tiles, courtX, courtY, courtSize, courtSize, BiomeType.PLAZA);
  
  // Central fountain
  const fountainX = Math.floor(size.width / 2);
  const fountainY = Math.floor(size.height / 2);
  tiles[fountainY][fountainX].biome = BiomeType.FOUNTAIN;
  
  // Water around fountain
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) === 2) {
        tiles[fountainY + dy][fountainX + dx].biome = BiomeType.WATER;
      }
    }
  }
  
  // Four iwans (vaulted halls) on each side
  const iwanDepth = 8;
  const iwanWidth = 12;
  
  // North iwan - main lecture hall
  const northIwanX = Math.floor((size.width - iwanWidth) / 2);
  const northIwanY = courtY - iwanDepth;
  placeWallRectangle(tiles, northIwanX, northIwanY, iwanWidth, iwanDepth);
  fillArea(tiles, northIwanX + 1, northIwanY + 1, iwanWidth - 2, iwanDepth - 2, BiomeType.FLOOR_MARBLE);
  
  // Teacher's position
  tiles[northIwanY + 2][fountainX].biome = BiomeType.THRONE;
  tiles[northIwanY + 2][fountainX].materialSubtype = 'teacher_seat';
  
  // Student mats
  for (let y = northIwanY + 4; y < northIwanY + iwanDepth - 1; y++) {
    for (let x = northIwanX + 2; x < northIwanX + iwanWidth - 2; x += 2) {
      tiles[y][x].biome = BiomeType.BED;
      tiles[y][x].materialSubtype = 'mat';
    }
  }
  
  // South iwan - library
  const southIwanX = northIwanX;
  const southIwanY = courtY + courtSize;
  placeWallRectangle(tiles, southIwanX, southIwanY, iwanWidth, iwanDepth);
  fillArea(tiles, southIwanX + 1, southIwanY + 1, iwanWidth - 2, iwanDepth - 2, BiomeType.FLOOR_MARBLE);
  
  // Book niches
  for (let x = southIwanX + 2; x < southIwanX + iwanWidth - 2; x += 2) {
    tiles[southIwanY + iwanDepth - 2][x].biome = BiomeType.TABLE;
    tiles[southIwanY + iwanDepth - 2][x].materialSubtype = 'bookshelf';
  }
  
  // East and West iwans - study cells
  const eastIwanX = courtX + courtSize;
  const eastIwanY = Math.floor((size.height - iwanWidth) / 2);
  placeWallRectangle(tiles, eastIwanX, eastIwanY, iwanDepth, iwanWidth);
  fillArea(tiles, eastIwanX + 1, eastIwanY + 1, iwanDepth - 2, iwanWidth - 2, BiomeType.FLOOR_TILE);
  
  const westIwanX = courtX - iwanDepth;
  const westIwanY = eastIwanY;
  placeWallRectangle(tiles, westIwanX, westIwanY, iwanDepth, iwanWidth);
  fillArea(tiles, westIwanX + 1, westIwanY + 1, iwanDepth - 2, iwanWidth - 2, BiomeType.FLOOR_TILE);
  
  // Geometric patterns on floor tiles
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (tiles[y][x].biome === BiomeType.FLOOR_TILE) {
        tiles[y][x].materialSubtype = 'geometric';
      }
    }
  }
  
  interactionZones.push(
    {
      id: 'lecture_iwan',
      bounds: { x: northIwanX, y: northIwanY, width: iwanWidth, height: iwanDepth },
      type: 'academic',
      interactions: ['teach', 'recite', 'discuss']
    },
    {
      id: 'library_iwan',
      bounds: { x: southIwanX, y: southIwanY, width: iwanWidth, height: iwanDepth },
      type: 'academic',
      interactions: ['read', 'copy', 'study']
    }
  );
}

/**
 * Generate a Confucian academy
 */
function generateConfucianAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Main axis with ceremonial path
  const axisX = Math.floor(size.width / 2);
  for (let y = size.height - 5; y > 5; y--) {
    tiles[y][axisX].biome = BiomeType.ROAD;
  }
  
  // Main lecture hall (Ming Tang)
  const hallSize = 14;
  const hallX = Math.floor((size.width - hallSize) / 2);
  const hallY = 5;
  
  placeWallRectangle(tiles, hallX, hallY, hallSize, hallSize);
  fillArea(tiles, hallX + 1, hallY + 1, hallSize - 2, hallSize - 2, BiomeType.FLOOR_WOOD);
  
  // Confucius shrine
  tiles[hallY + 2][axisX].biome = BiomeType.STATUE;
  tiles[hallY + 2][axisX].materialSubtype = 'confucius';
  
  // Altar for offerings
  tiles[hallY + 4][axisX].biome = BiomeType.ALTAR;
  
  // Study pavilions on sides
  const pavilionSize = 8;
  // East pavilion
  const eastPavX = size.width - pavilionSize - 5;
  const eastPavY = Math.floor(size.height / 2) - 4;
  placeWallRectangle(tiles, eastPavX, eastPavY, pavilionSize, pavilionSize);
  fillArea(tiles, eastPavX + 1, eastPavY + 1, pavilionSize - 2, pavilionSize - 2, BiomeType.FLOOR_WOOD);
  
  // West pavilion
  const westPavX = 5;
  const westPavY = eastPavY;
  placeWallRectangle(tiles, westPavX, westPavY, pavilionSize, pavilionSize);
  fillArea(tiles, westPavX + 1, westPavY + 1, pavilionSize - 2, pavilionSize - 2, BiomeType.FLOOR_WOOD);
  
  // Study desks
  for (let i = 0; i < 4; i++) {
    tiles[eastPavY + 2 + i][eastPavX + 2].biome = BiomeType.TABLE;
    tiles[eastPavY + 2 + i][eastPavX + 2].materialSubtype = 'desk';
    tiles[westPavY + 2 + i][westPavX + pavilionSize - 3].biome = BiomeType.TABLE;
    tiles[westPavY + 2 + i][westPavX + pavilionSize - 3].materialSubtype = 'desk';
  }
  
  // Examination hall
  const examY = size.height - 15;
  const examWidth = 20;
  const examHeight = 10;
  const examX = Math.floor((size.width - examWidth) / 2);
  
  placeWallRectangle(tiles, examX, examY, examWidth, examHeight);
  fillArea(tiles, examX + 1, examY + 1, examWidth - 2, examHeight - 2, BiomeType.FLOOR_TILE);
  
  // Individual examination cells
  for (let y = examY + 2; y < examY + examHeight - 2; y += 2) {
    for (let x = examX + 2; x < examX + examWidth - 2; x += 3) {
      tiles[y][x].biome = BiomeType.TABLE;
      tiles[y][x].materialSubtype = 'exam_desk';
    }
  }
  
  interactionZones.push(
    {
      id: 'main_hall',
      bounds: { x: hallX, y: hallY, width: hallSize, height: hallSize },
      type: 'academic',
      interactions: ['ceremony', 'lecture', 'worship']
    },
    {
      id: 'examination_hall',
      bounds: { x: examX, y: examY, width: examWidth, height: examHeight },
      type: 'academic',
      interactions: ['examination', 'test', 'compete']
    }
  );
}

/**
 * Generate a Renaissance academy
 */
function generateRenaissanceAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_MARBLE);
  
  // Grand entrance hall
  const entranceWidth = 16;
  const entranceHeight = 8;
  const entranceX = Math.floor((size.width - entranceWidth) / 2);
  const entranceY = size.height - entranceHeight - 3;
  
  fillArea(tiles, entranceX, entranceY, entranceWidth, entranceHeight, BiomeType.PLAZA);
  
  // Columns at entrance
  for (let x = entranceX; x <= entranceX + entranceWidth; x += 4) {
    tiles[entranceY][x].biome = BiomeType.COLUMN;
  }
  
  // Central rotunda (inspired by Pantheon)
  const rotundaRadius = 8;
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2) - 3;
  
  // Draw circular rotunda
  for (let y = centerY - rotundaRadius; y <= centerY + rotundaRadius; y++) {
    for (let x = centerX - rotundaRadius; x <= centerX + rotundaRadius; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist <= rotundaRadius && dist > rotundaRadius - 1) {
        tiles[y][x].biome = BiomeType.WALL;
      } else if (dist < rotundaRadius - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  // Central statue
  tiles[centerY][centerX].biome = BiomeType.STATUE;
  tiles[centerY][centerX].materialSubtype = 'scholar';
  
  // Lecture theater (anatomical theater style)
  const theaterX = 5;
  const theaterY = 5;
  const theaterSize = 12;
  
  placeWallRectangle(tiles, theaterX, theaterY, theaterSize, theaterSize);
  fillArea(tiles, theaterX + 1, theaterY + 1, theaterSize - 2, theaterSize - 2, BiomeType.FLOOR_WOOD);
  
  // Demonstration table at center
  tiles[theaterY + Math.floor(theaterSize / 2)][theaterX + Math.floor(theaterSize / 2)].biome = BiomeType.TABLE;
  tiles[theaterY + Math.floor(theaterSize / 2)][theaterX + Math.floor(theaterSize / 2)].materialSubtype = 'demonstration';
  
  // Tiered seating
  for (let r = 2; r < 5; r++) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
      const seatX = theaterX + Math.floor(theaterSize / 2) + Math.floor(Math.cos(angle) * r);
      const seatY = theaterY + Math.floor(theaterSize / 2) + Math.floor(Math.sin(angle) * r);
      if (seatX > theaterX && seatX < theaterX + theaterSize - 1 &&
          seatY > theaterY && seatY < theaterY + theaterSize - 1) {
        tiles[seatY][seatX].biome = BiomeType.CHAIR;
      }
    }
  }
  
  // Art gallery
  const galleryX = size.width - 17;
  const galleryY = 5;
  const galleryWidth = 12;
  const galleryHeight = 15;
  
  placeWallRectangle(tiles, galleryX, galleryY, galleryWidth, galleryHeight);
  fillArea(tiles, galleryX + 1, galleryY + 1, galleryWidth - 2, galleryHeight - 2, BiomeType.FLOOR_MARBLE);
  
  // Artworks (statues along walls)
  for (let y = galleryY + 2; y < galleryY + galleryHeight - 2; y += 3) {
    tiles[y][galleryX + 1].biome = BiomeType.STATUE;
    tiles[y][galleryX + 1].materialSubtype = 'artwork';
    tiles[y][galleryX + galleryWidth - 2].biome = BiomeType.STATUE;
    tiles[y][galleryX + galleryWidth - 2].materialSubtype = 'artwork';
  }
  
  interactionZones.push(
    {
      id: 'rotunda',
      bounds: { x: centerX - rotundaRadius, y: centerY - rotundaRadius, width: rotundaRadius * 2, height: rotundaRadius * 2 },
      type: 'academic',
      interactions: ['discuss', 'philosophize', 'meet']
    },
    {
      id: 'anatomical_theater',
      bounds: { x: theaterX, y: theaterY, width: theaterSize, height: theaterSize },
      type: 'academic',
      interactions: ['demonstrate', 'dissect', 'observe']
    },
    {
      id: 'art_gallery',
      bounds: { x: galleryX, y: galleryY, width: galleryWidth, height: galleryHeight },
      type: 'cultural',
      interactions: ['admire', 'sketch', 'critique']
    }
  );
}

/**
 * Generate a Buddhist monastery school
 */
function generateBuddhistMonastery(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  // Main temple
  const templeSize = 12;
  const templeX = Math.floor((size.width - templeSize) / 2);
  const templeY = 5;
  
  placeWallRectangle(tiles, templeX, templeY, templeSize, templeSize);
  fillArea(tiles, templeX + 1, templeY + 1, templeSize - 2, templeSize - 2, BiomeType.FLOOR_WOOD);
  
  // Buddha statue
  tiles[templeY + 2][Math.floor(size.width / 2)].biome = BiomeType.STATUE;
  tiles[templeY + 2][Math.floor(size.width / 2)].materialSubtype = 'buddha';
  
  // Meditation hall
  const medHallY = templeY + templeSize + 5;
  const medHallWidth = 20;
  const medHallHeight = 10;
  const medHallX = Math.floor((size.width - medHallWidth) / 2);
  
  placeWallRectangle(tiles, medHallX, medHallY, medHallWidth, medHallHeight);
  fillArea(tiles, medHallX + 1, medHallY + 1, medHallWidth - 2, medHallHeight - 2, BiomeType.FLOOR_WOOD);
  
  // Meditation cushions
  for (let y = medHallY + 2; y < medHallY + medHallHeight - 2; y += 2) {
    for (let x = medHallX + 2; x < medHallX + medHallWidth - 2; x += 2) {
      tiles[y][x].biome = BiomeType.BED;
      tiles[y][x].materialSubtype = 'cushion';
    }
  }
  
  // Library/Sutra hall
  const libX = 5;
  const libY = Math.floor(size.height / 2);
  const libSize = 10;
  
  placeWallRectangle(tiles, libX, libY, libSize, libSize);
  fillArea(tiles, libX + 1, libY + 1, libSize - 2, libSize - 2, BiomeType.FLOOR_WOOD);
  
  // Sutra shelves
  for (let x = libX + 2; x < libX + libSize - 2; x += 2) {
    tiles[libY + 2][x].biome = BiomeType.TABLE;
    tiles[libY + 2][x].materialSubtype = 'sutra_shelf';
  }
  
  interactionZones.push(
    {
      id: 'temple',
      bounds: { x: templeX, y: templeY, width: templeSize, height: templeSize },
      type: 'religious',
      interactions: ['pray', 'offer', 'chant']
    },
    {
      id: 'meditation_hall',
      bounds: { x: medHallX, y: medHallY, width: medHallWidth, height: medHallHeight },
      type: 'academic',
      interactions: ['meditate', 'contemplate', 'teach']
    }
  );
}

/**
 * Generate Indian gurukula
 */
function generateGurukula(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Open-air school with natural elements
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.SAVANNA);
  
  // Sacred tree where teaching happens
  const treeX = Math.floor(size.width / 2);
  const treeY = Math.floor(size.height / 3);
  tiles[treeY][treeX].biome = BiomeType.FOREST;
  tiles[treeY][treeX].materialSubtype = 'banyan';
  
  // Teacher's seat
  tiles[treeY + 2][treeX].biome = BiomeType.THRONE;
  tiles[treeY + 2][treeX].materialSubtype = 'guru_seat';
  
  // Student seating area (in semicircle)
  const radius = 5;
  for (let angle = 0; angle < Math.PI; angle += 0.3) {
    const x = Math.floor(treeX + Math.cos(angle) * radius);
    const y = Math.floor(treeY + 3 + Math.sin(angle) * radius);
    if (x > 0 && x < size.width && y > 0 && y < size.height) {
      tiles[y][x].biome = BiomeType.BED;
      tiles[y][x].materialSubtype = 'mat';
    }
  }
  
  // Simple huts for students
  const hutSize = 4;
  for (let i = 0; i < 3; i++) {
    const hutX = 5 + i * (hutSize + 3);
    const hutY = size.height - hutSize - 5;
    placeWallRectangle(tiles, hutX, hutY, hutSize, hutSize);
    fillArea(tiles, hutX + 1, hutY + 1, hutSize - 2, hutSize - 2, BiomeType.FLOOR_WOOD);
    tiles[hutY + 1][hutX + 1].biome = BiomeType.BED;
  }
  
  // Sacred fire for ceremonies
  tiles[treeY + 8][treeX].biome = BiomeType.BRAZIER;
  tiles[treeY + 8][treeX].materialSubtype = 'sacred_fire';
  
  interactionZones.push({
    id: 'teaching_tree',
    bounds: { x: treeX - radius, y: treeY, width: radius * 2, height: radius + 5 },
    type: 'academic',
    interactions: ['learn', 'recite', 'discuss']
  });
}

/**
 * Generate a modern university building
 */
function generateModernUniversity(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  
  // Hallway down the middle
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = Math.floor(size.width / 2) - 2; x <= Math.floor(size.width / 2) + 2; x++) {
      tiles[y][x].biome = BiomeType.ROAD;
    }
  }
  
  // Lecture halls on left
  const lectureWidth = 12;
  const lectureHeight = 8;
  for (let i = 0; i < 3; i++) {
    const lectureX = 3;
    const lectureY = 5 + i * (lectureHeight + 2);
    if (lectureY + lectureHeight < size.height - 3) {
      placeWallRectangle(tiles, lectureX, lectureY, lectureWidth, lectureHeight);
      fillArea(tiles, lectureX + 1, lectureY + 1, lectureWidth - 2, lectureHeight - 2, BiomeType.FLOOR_TILE);
      
      // Podium
      tiles[lectureY + 1][lectureX + Math.floor(lectureWidth / 2)].biome = BiomeType.TABLE;
      tiles[lectureY + 1][lectureX + Math.floor(lectureWidth / 2)].materialSubtype = 'podium';
      
      // Seats
      for (let y = lectureY + 3; y < lectureY + lectureHeight - 1; y++) {
        for (let x = lectureX + 2; x < lectureX + lectureWidth - 2; x++) {
          tiles[y][x].biome = BiomeType.CHAIR;
        }
      }
    }
  }
  
  // Computer lab on right
  const labX = size.width - 15;
  const labY = 5;
  const labWidth = 12;
  const labHeight = 10;
  
  placeWallRectangle(tiles, labX, labY, labWidth, labHeight);
  fillArea(tiles, labX + 1, labY + 1, labWidth - 2, labHeight - 2, BiomeType.FLOOR_TILE);
  
  // Computer desks
  for (let y = labY + 2; y < labY + labHeight - 2; y += 2) {
    for (let x = labX + 2; x < labX + labWidth - 2; x += 2) {
      tiles[y][x].biome = BiomeType.TABLE;
      tiles[y][x].materialSubtype = 'computer';
    }
  }
  
  // Library
  const libX = size.width - 15;
  const libY = labY + labHeight + 3;
  
  placeWallRectangle(tiles, libX, libY, labWidth, labHeight);
  fillArea(tiles, libX + 1, libY + 1, labWidth - 2, labHeight - 2, BiomeType.FLOOR_TILE);
  
  // Book stacks
  for (let x = libX + 2; x < libX + labWidth - 2; x += 3) {
    for (let y = libY + 2; y < libY + labHeight - 2; y++) {
      tiles[y][x].biome = BiomeType.TABLE;
      tiles[y][x].materialSubtype = 'bookshelf';
    }
  }
  
  interactionZones.push(
    {
      id: 'lecture_halls',
      bounds: { x: 3, y: 5, width: lectureWidth, height: size.height - 10 },
      type: 'academic',
      interactions: ['lecture', 'present', 'discuss']
    },
    {
      id: 'computer_lab',
      bounds: { x: labX, y: labY, width: labWidth, height: labHeight },
      type: 'academic',
      interactions: ['research', 'compute', 'program']
    }
  );
}

/**
 * Generate classical academy (Greek/Roman)
 */
function generateClassicalAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Stoa-style covered walkway
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PLAZA);
  
  // Peristyle courtyard
  const courtSize = Math.min(size.width - 10, size.height - 10);
  const courtX = Math.floor((size.width - courtSize) / 2);
  const courtY = Math.floor((size.height - courtSize) / 2);
  
  // Columns around courtyard
  for (let x = courtX; x < courtX + courtSize; x += 3) {
    tiles[courtY][x].biome = BiomeType.COLUMN;
    tiles[courtY + courtSize - 1][x].biome = BiomeType.COLUMN;
  }
  for (let y = courtY; y < courtY + courtSize; y += 3) {
    tiles[y][courtX].biome = BiomeType.COLUMN;
    tiles[y][courtX + courtSize - 1].biome = BiomeType.COLUMN;
  }
  
  // Garden in center
  fillArea(tiles, courtX + 3, courtY + 3, courtSize - 6, courtSize - 6, BiomeType.PARK);
  
  // Philosopher's walk (covered path)
  for (let x = courtX + 1; x < courtX + courtSize - 1; x++) {
    tiles[courtY + 1][x].biome = BiomeType.FLOOR_MARBLE;
    tiles[courtY + courtSize - 2][x].biome = BiomeType.FLOOR_MARBLE;
  }
  
  // Exedra (semicircular seating for discussions)
  const exedraX = Math.floor(size.width / 2);
  const exedraY = courtY - 5;
  const exedraRadius = 4;
  
  for (let angle = 0; angle < Math.PI; angle += 0.2) {
    const x = Math.floor(exedraX + Math.cos(angle) * exedraRadius);
    const y = Math.floor(exedraY - Math.sin(angle) * exedraRadius);
    if (x > 0 && x < size.width && y > 0 && y < size.height) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Statues of philosophers
  tiles[courtY + 5][courtX + 5].biome = BiomeType.STATUE;
  tiles[courtY + 5][courtX + 5].materialSubtype = 'plato';
  tiles[courtY + 5][courtX + courtSize - 5].biome = BiomeType.STATUE;
  tiles[courtY + 5][courtX + courtSize - 5].materialSubtype = 'aristotle';
  
  interactionZones.push({
    id: 'peristyle',
    bounds: { x: courtX, y: courtY, width: courtSize, height: courtSize },
    type: 'academic',
    interactions: ['walk', 'discuss', 'philosophize']
  });
}

/**
 * Generate a library (fallback)
 */
function generateLibrary(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_WOOD);
  
  // Reading room
  const readingX = Math.floor((size.width - 16) / 2);
  const readingY = Math.floor((size.height - 10) / 2);
  
  // Central reading tables
  for (let y = readingY; y < readingY + 10; y += 3) {
    for (let x = readingX; x < readingX + 16; x += 4) {
      tiles[y][x].biome = BiomeType.TABLE;
      tiles[y][x + 1].biome = BiomeType.CHAIR;
    }
  }
  
  // Bookshelves along walls
  for (let y = 3; y < size.height - 3; y += 2) {
    tiles[y][2].biome = BiomeType.TABLE;
    tiles[y][2].materialSubtype = 'bookshelf';
    tiles[y][size.width - 3].biome = BiomeType.TABLE;
    tiles[y][size.width - 3].materialSubtype = 'bookshelf';
  }
  
  interactionZones.push({
    id: 'reading_room',
    bounds: { x: readingX, y: readingY, width: 16, height: 10 },
    type: 'academic',
    interactions: ['read', 'study', 'research']
  });
}