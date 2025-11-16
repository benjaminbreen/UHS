/**
 * components/farm/FarmRoguelikeWorkTab.tsx
 * ASCII/Unicode roguelike-style farm work interface
 *
 * Features:
 * - Procedurally generated farm layout from FarmState data
 * - Direct player movement and interaction (like mining roguelike)
 * - Real-time visual feedback for all actions
 * - Full integration with existing farm data and contract system
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Season, CulturalZone, HistoricalEra } from '../../types';
import { FarmState, FarmFamilyMember, FieldState } from '../../services/farmService';
import { CROP_EMOJIS } from './types';

interface FarmRoguelikeWorkTabProps {
  farmState: FarmState;
  setFarmState: (state: FarmState | ((prev: FarmState) => FarmState)) => void;
  headFarmer: FarmFamilyMember | null;
  llmHooks: {
    hoursWorkedToday: number;
    farmActionLog: Array<{ action: string; timeElapsed: number }>;
    currentFarmTime: number;
    handleQuickNpcTalk: (npc: FarmFamilyMember) => Promise<string>;
  };
  fieldHooks: {
    validCrops: string[];
  };
  season: Season;
  useLlm: boolean;
  onPlayerStateChange?: (changes: {
    health?: number;
    fatigue?: number;
    statusEffects?: Array<{ type: string; name: string; duration: number }>;
  }) => void;
  onTimeAdvance?: (hours: number) => void;
}

// Tile types for the farm
type FarmTileType =
  | 'farmhouse' | 'barn' | 'shed' | 'well' | 'fence' | 'gate'
  | 'path' | 'grass' | 'field' | 'water' | 'tree' | 'livestock_pen'
  | 'empty';

interface FarmTile {
  type: FarmTileType;
  symbol: string;
  color: string;
  backgroundColor?: string;
  walkable: boolean;
  fieldId?: number; // Links to farmState.fields[n]
  interactable?: boolean;
  interactionType?: 'water_source' | 'plant' | 'water_field' | 'harvest' | 'feed_livestock' | 'talk_npc';
  cropType?: string;
  growthStage?: 'fallow' | 'planted' | 'sprouting' | 'growing' | 'mature';
  moisture?: 'dry' | 'moist' | 'wet' | 'flooded';
  health?: number;
  npcId?: string; // Family member standing here
}

interface FarmPlayer {
  x: number;
  y: number;
  hasWaterBucket: boolean;
  waterBucketFull: boolean;
  hasSeedBag: boolean;
  selectedSeed?: string;
  fatigue: number;
  maxFatigue: number;
}

// Map dimensions
const MAP_WIDTH = 45;
const MAP_HEIGHT = 28;
const TILE_SIZE = 20; // pixels - increased from 16 for better visibility

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// Hash string to number for seed
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Field layout patterns based on culture and era
type FieldPattern = 'strips' | 'squares' | 'paddies' | 'scattered' | 'terraced' | 'rows';

function getFieldPattern(culture: CulturalZone, era: HistoricalEra, cropTypes: string[], rng: SeededRandom): FieldPattern {
  // Rice always uses paddies in Asian cultures
  if (cropTypes.some(c => c === 'rice') && (culture === 'EAST_ASIAN' || culture === 'SOUTH_ASIAN')) {
    return 'paddies';
  }

  // Medieval European uses strip farming
  if (culture === 'EUROPEAN' && (era === 'MEDIEVAL' || era === 'ANTIQUITY')) {
    return 'strips';
  }

  // MENA scattered plots with irrigation
  if (culture === 'MENA') {
    return 'scattered';
  }

  // Modern era uses efficient squares
  if (era === 'INDUSTRIAL_ERA' || era === 'MODERN_ERA') {
    return 'squares';
  }

  // Terraced for South Asian/American cultures
  if (culture === 'SOUTH_ASIAN' || culture === 'SOUTH_AMERICAN') {
    return rng.next() > 0.5 ? 'terraced' : 'rows';
  }

  return 'rows';
}

// Cultural farm styles - complete set for all 9 zones
const FARM_STYLES = {
  EUROPEAN: {
    farmhouse: { symbol: '🏠', color: '#8B4513' },
    barn: { symbol: '🚪', color: '#654321' },
    fence: { symbol: '═', color: '#8B7355' },
    well: { symbol: '💧', color: '#4169E1' },
    grass: { symbol: '·', color: '#556B2F', bg: '#1a2a1a' },
    path: { symbol: '▒', color: '#A0826D' },
  },
  EAST_ASIAN: {
    farmhouse: { symbol: '🏯', color: '#DC143C' },
    barn: { symbol: '⛩️', color: '#8B0000' },
    fence: { symbol: '│', color: '#228B22' },
    well: { symbol: '井', color: '#1E90FF' },
    grass: { symbol: '·', color: '#4A7C59', bg: '#1a2a1a' },
    path: { symbol: '░', color: '#CD853F' },
  },
  MENA: {
    farmhouse: { symbol: '🕌', color: '#DAA520' },
    barn: { symbol: '🏚️', color: '#CD853F' },
    fence: { symbol: '▬', color: '#D2691E' },
    well: { symbol: '◉', color: '#4682B4' },
    grass: { symbol: '·', color: '#8B7355', bg: '#2a2410' },
    path: { symbol: '▒', color: '#DEB887' },
  },
  SOUTH_ASIAN: {
    farmhouse: { symbol: '🏘️', color: '#FF6347' },
    barn: { symbol: '🏚️', color: '#CD5C5C' },
    fence: { symbol: '║', color: '#8B4513' },
    well: { symbol: '◎', color: '#4682B4' },
    grass: { symbol: '·', color: '#6B8E23', bg: '#1a2a1a' },
    path: { symbol: '░', color: '#BC8F8F' },
  },
  SUB_SAHARAN_AFRICAN: {
    farmhouse: { symbol: '🛖', color: '#CD853F' },
    barn: { symbol: '🏚️', color: '#8B4513' },
    fence: { symbol: '│', color: '#A0522D' },
    well: { symbol: '◉', color: '#4682B4' },
    grass: { symbol: '·', color: '#9ACD32', bg: '#1a2a1a' },
    path: { symbol: '▒', color: '#D2691E' },
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    farmhouse: { symbol: '⛺', color: '#8B4513' },
    barn: { symbol: '🏚️', color: '#A0522D' },
    fence: { symbol: '│', color: '#654321' },
    well: { symbol: '◎', color: '#4682B4' },
    grass: { symbol: '·', color: '#6B8E23', bg: '#1a2a1a' },
    path: { symbol: '░', color: '#BC8F8F' },
  },
  NORTH_AMERICAN_COLONIAL: {
    farmhouse: { symbol: '🏠', color: '#8B4513' },
    barn: { symbol: '🚪', color: '#654321' },
    fence: { symbol: '═', color: '#8B7355' },
    well: { symbol: '💧', color: '#4169E1' },
    grass: { symbol: '·', color: '#556B2F', bg: '#1a2a1a' },
    path: { symbol: '▒', color: '#A0826D' },
  },
  SOUTH_AMERICAN: {
    farmhouse: { symbol: '🏘️', color: '#CD853F' },
    barn: { symbol: '🏚️', color: '#8B4513' },
    fence: { symbol: '▬', color: '#A0522D' },
    well: { symbol: '◎', color: '#4682B4' },
    grass: { symbol: '·', color: '#6B8E23', bg: '#1a2a1a' },
    path: { symbol: '░', color: '#D2691E' },
  },
  OCEANIA: {
    farmhouse: { symbol: '🛖', color: '#8B4513' },
    barn: { symbol: '🏚️', color: '#CD853F' },
    fence: { symbol: '│', color: '#654321' },
    well: { symbol: '◎', color: '#4682B4' },
    grass: { symbol: '·', color: '#9ACD32', bg: '#1a2a1a' },
    path: { symbol: '▒', color: '#BC8F8F' },
  },
  // Fallback
  DEFAULT: {
    farmhouse: { symbol: '🏠', color: '#8B4513' },
    barn: { symbol: '🚪', color: '#654321' },
    fence: { symbol: '═', color: '#8B7355' },
    well: { symbol: '💧', color: '#4169E1' },
    grass: { symbol: '·', color: '#556B2F', bg: '#1a2a1a' },
    path: { symbol: '▒', color: '#A0826D' },
  }
};

// Growth stage visuals
const GROWTH_VISUALS = {
  fallow: { symbol: '░', color: '#8B7355' },
  planted: { symbol: '·', color: '#228B22' },
  sprouting: { symbol: '🌱', color: '#32CD32' },
  growing: { symbol: '🌿', color: '#228B22' },
  mature: { symbol: '🌾', color: '#FFD700' },
};

// Culture-specific decorations
function getCulturalDecorations(culture: CulturalZone): string[] {
  switch (culture) {
    case 'EUROPEAN':
      return ['🌳', '🌲', '🪨', '🌿', '🍄'];
    case 'EAST_ASIAN':
      return ['🎋', '🌸', '🪨', '🌿', '🏮'];
    case 'MENA':
      return ['🌴', '🏜️', '🪨', '🌵', '🐪'];
    case 'SOUTH_ASIAN':
      return ['🌴', '🌺', '🪨', '🌿', '🦚'];
    case 'SUB_SAHARAN_AFRICAN':
      return ['🌴', '🌳', '🪨', '🌿', '🦒'];
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      return ['🌲', '🪨', '🌿', '🦬', '🏔️'];
    case 'NORTH_AMERICAN_COLONIAL':
      return ['🌳', '🌲', '🪨', '🌿', '🦌'];
    case 'SOUTH_AMERICAN':
      return ['🌴', '🌺', '🪨', '🌿', '🦜'];
    case 'OCEANIA':
      return ['🌴', '🌺', '🪨', '🌿', '🐚'];
    default:
      return ['🌳', '🌲', '🪨', '🌿'];
  }
}

// Helper function to draw a path between two points
function drawPath(
  map: FarmTile[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  style: any,
  rng: SeededRandom
) {
  const points: Array<{ x: number; y: number }> = [];

  // Use Manhattan path with some randomization
  let currentX = fromX;
  let currentY = fromY;

  while (currentX !== toX || currentY !== toY) {
    points.push({ x: currentX, y: currentY });

    // Randomly choose to move horizontally or vertically
    const moveHorizontally = rng.next() > 0.5;

    if (moveHorizontally && currentX !== toX) {
      currentX += currentX < toX ? 1 : -1;
    } else if (currentY !== toY) {
      currentY += currentY < toY ? 1 : -1;
    } else if (currentX !== toX) {
      currentX += currentX < toX ? 1 : -1;
    }
  }
  points.push({ x: toX, y: toY });

  // Draw the path tiles
  for (const point of points) {
    if (point.y >= 0 && point.y < MAP_HEIGHT && point.x >= 0 && point.x < MAP_WIDTH) {
      const tile = map[point.y][point.x];
      // Only overwrite grass or existing paths
      if (tile.type === 'grass' || tile.type === 'path') {
        map[point.y][point.x] = {
          type: 'path',
          symbol: style.path.symbol,
          color: style.path.color,
          backgroundColor: '#1a1a1a',
          walkable: true,
        };
      }
    }
  }
}

// Generate farm layout from FarmState with procedural variation
function generateFarmLayout(
  farmState: FarmState,
  culturalZone: CulturalZone,
  era: HistoricalEra
): FarmTile[][] {
  // Create seed from farm data for consistent regeneration
  const seedString = `${farmState.farmName || 'farm'}_${farmState.fields.length}_${farmState.fields.map(f => f.crop || 'empty').join('')}`;
  const seed = hashString(seedString);
  const rng = new SeededRandom(seed);

  const style = FARM_STYLES[culturalZone] || FARM_STYLES.DEFAULT;
  const cropTypes = farmState.fields.map(f => f.crop || '').filter(Boolean);
  const pattern = getFieldPattern(culturalZone, era, cropTypes, rng);

  // Initialize empty map with cultural grass styling
  const map: FarmTile[][] = Array(MAP_HEIGHT).fill(null).map(() =>
    Array(MAP_WIDTH).fill(null).map(() => ({
      type: 'grass' as FarmTileType,
      symbol: style.grass.symbol,
      color: style.grass.color,
      backgroundColor: style.grass.bg,
      walkable: true,
    }))
  );

  // Track key locations for path drawing
  const pathPoints: Array<{ x: number; y: number; type: string }> = [];

  // Randomize building placement within cultural norms
  const farmhouseX = rng.nextInt(2, 5);
  const farmhouseY = rng.nextInt(2, 4);
  const farmhouseDoorX = farmhouseX + 2;
  const farmhouseDoorY = farmhouseY + 2;
  pathPoints.push({ x: farmhouseDoorX, y: farmhouseDoorY, type: 'farmhouse' });

  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      const x = farmhouseX + dx;
      const y = farmhouseY + dy;
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        map[y][x] = {
          type: 'farmhouse',
          symbol: dy === 1 && dx === 1 ? style.farmhouse.symbol : '▓',
          color: style.farmhouse.color,
          backgroundColor: '#0d0d0d',
          walkable: dy === 2 && dx === 2, // Door
        };
      }
    }
  }

  // Place well (randomized near farmhouse)
  const wellX = farmhouseX + rng.nextInt(5, 8);
  const wellY = farmhouseY + rng.nextInt(0, 2);
  if (wellY >= 0 && wellY < MAP_HEIGHT && wellX >= 0 && wellX < MAP_WIDTH) {
    map[wellY][wellX] = {
      type: 'well',
      symbol: style.well.symbol,
      color: style.well.color,
      backgroundColor: '#1a2a3a',
      walkable: false,
      interactable: true,
      interactionType: 'water_source',
    };
    pathPoints.push({ x: wellX, y: wellY, type: 'well' });
  }

  // Place barn if livestock exists (randomized placement)
  if (farmState.livestock && farmState.livestock.length > 0) {
    const barnX = farmhouseX + rng.nextInt(-1, 2);
    const barnY = farmhouseY + rng.nextInt(7, 10);
    const barnDoorX = barnX + 2;
    const barnDoorY = barnY + 3;
    pathPoints.push({ x: barnDoorX, y: barnDoorY, type: 'barn' });

    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        const x = barnX + dx;
        const y = barnY + dy;
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
          map[y][x] = {
            type: dy === 0 || dy === 3 || dx === 0 || dx === 4 ? 'barn' : 'livestock_pen',
            symbol: dy === 3 && dx === 2 ? style.barn.symbol : (dy === 0 || dy === 3 || dx === 0 || dx === 4 ? '▓' : '🐄'),
            color: dy === 0 || dy === 3 || dx === 0 || dx === 4 ? style.barn.color : '#FF6347',
            backgroundColor: '#0d0d0d',
            walkable: dy === 3 && dx === 2, // Door
            interactable: !(dy === 0 || dy === 3 || dx === 0 || dx === 4),
            interactionType: 'feed_livestock',
          };
        }
      }
    }
  }

  // Place fields based on pattern type
  switch (pattern) {
    case 'strips':
      placeFieldsStrips(map, farmState, style, rng, farmhouseX, farmhouseY);
      break;
    case 'squares':
      placeFieldsSquares(map, farmState, style, rng, farmhouseX, farmhouseY);
      break;
    case 'paddies':
      placeFieldsPaddies(map, farmState, style, rng, farmhouseX, farmhouseY);
      break;
    case 'scattered':
      placeFieldsScattered(map, farmState, style, rng, farmhouseX, farmhouseY);
      break;
    case 'terraced':
      placeFieldsTerraced(map, farmState, style, rng, farmhouseX, farmhouseY);
      break;
    case 'rows':
    default:
      placeFieldsRows(map, farmState, style, rng, farmhouseX, farmhouseY);
      break;
  }

  // Add culturally-appropriate decorative elements randomly
  const decorations = getCulturalDecorations(culturalZone);
  for (let i = 0; i < rng.nextInt(5, 12); i++) {
    const x = rng.nextInt(0, MAP_WIDTH - 1);
    const y = rng.nextInt(0, MAP_HEIGHT - 1);
    if (map[y][x].type === 'grass') {
      map[y][x] = {
        ...map[y][x],
        symbol: rng.choice(decorations),
        walkable: false,
      };
    }
  }

  // Generate connecting paths between key locations
  const farmhousePoint = pathPoints.find(p => p.type === 'farmhouse');
  const wellPoint = pathPoints.find(p => p.type === 'well');
  const barnPoint = pathPoints.find(p => p.type === 'barn');

  // Path from farmhouse to well
  if (farmhousePoint && wellPoint) {
    drawPath(map, farmhousePoint.x, farmhousePoint.y, wellPoint.x, wellPoint.y, style, rng);
  }

  // Path from farmhouse to barn
  if (farmhousePoint && barnPoint) {
    drawPath(map, farmhousePoint.x, farmhousePoint.y, barnPoint.x, barnPoint.y, style, rng);
  }

  return map;
}

// Pattern-specific field placement functions
function placeFieldsStrips(
  map: FarmTile[][],
  farmState: FarmState,
  style: any,
  rng: SeededRandom,
  farmhouseX: number,
  farmhouseY: number
) {
  // Medieval European strip farming - long narrow fields
  const startX = 12;
  const startY = 2;
  const stripWidth = 3;
  const stripLength = rng.nextInt(18, 22);

  farmState.fields.forEach((field, index) => {
    const fx = startX + index * (stripWidth + 1);
    const fy = startY;

    createFieldArea(map, field, index, fx, fy, stripWidth, stripLength, style, 'strips', rng);
  });
}

function placeFieldsSquares(
  map: FarmTile[][],
  farmState: FarmState,
  style: any,
  rng: SeededRandom,
  farmhouseX: number,
  farmhouseY: number
) {
  // Modern efficient squares
  const fieldSize = rng.nextInt(7, 9);
  const spacing = 2;
  const startX = 14;
  const startY = 2;

  farmState.fields.forEach((field, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const fx = startX + col * (fieldSize + spacing);
    const fy = startY + row * (fieldSize + spacing);

    createFieldArea(map, field, index, fx, fy, fieldSize, fieldSize, style, 'squares', rng);
  });
}

function placeFieldsPaddies(
  map: FarmTile[][],
  farmState: FarmState,
  style: any,
  rng: SeededRandom,
  farmhouseX: number,
  farmhouseY: number
) {
  // Asian rice paddies with water channels
  const paddySize = rng.nextInt(6, 8);
  const spacing = 1; // Narrow channels between
  const startX = 13;
  const startY = 3;

  farmState.fields.forEach((field, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const fx = startX + col * (paddySize + spacing);
    const fy = startY + row * (paddySize + spacing);

    createFieldArea(map, field, index, fx, fy, paddySize, paddySize, style, 'paddies', rng);

    // Add water channels between paddies
    if (col < 2) {
      for (let y = fy; y < fy + paddySize; y++) {
        const channelX = fx + paddySize;
        if (y >= 0 && y < MAP_HEIGHT && channelX >= 0 && channelX < MAP_WIDTH) {
          map[y][channelX] = {
            type: 'water',
            symbol: '~',
            color: '#4169E1',
            backgroundColor: '#1a2a4a',
            walkable: false,
          };
        }
      }
    }
  });
}

function placeFieldsScattered(
  map: FarmTile[][],
  farmState: FarmState,
  style: any,
  rng: SeededRandom,
  farmhouseX: number,
  farmhouseY: number
) {
  // MENA scattered plots with central irrigation
  // Track placed field positions to prevent overlaps
  const placedFields: Array<{ x: number; y: number; width: number; height: number }> = [];

  farmState.fields.forEach((field, index) => {
    let fx = 0;
    let fy = 0;
    let width = 0;
    let height = 0;
    let attempts = 0;
    let overlaps = true;

    // Try to find a non-overlapping position (max 20 attempts)
    while (overlaps && attempts < 20) {
      fx = rng.nextInt(12, 35);
      fy = rng.nextInt(3, 20);
      width = rng.nextInt(4, 7);
      height = rng.nextInt(4, 7);

      // Check for overlaps with existing fields (with 2-tile buffer)
      overlaps = placedFields.some(existing => {
        const buffer = 2;
        return !(fx + width + buffer < existing.x ||
                fx - buffer > existing.x + existing.width ||
                fy + height + buffer < existing.y ||
                fy - buffer > existing.y + existing.height);
      });

      attempts++;
    }

    // Place the field even if we couldn't find a perfect spot after 20 attempts
    placedFields.push({ x: fx, y: fy, width, height });
    createFieldArea(map, field, index, fx, fy, width, height, style, 'scattered', rng);
  });

  // Add central irrigation channel
  const channelY = 12;
  for (let x = 10; x < MAP_WIDTH - 5; x++) {
    if (map[channelY][x].type === 'grass') {
      map[channelY][x] = {
        type: 'water',
        symbol: '═',
        color: '#4169E1',
        backgroundColor: '#1a2a4a',
        walkable: false,
      };
    }
  }
}

function placeFieldsTerraced(
  map: FarmTile[][],
  farmState: FarmState,
  style: any,
  rng: SeededRandom,
  farmhouseX: number,
  farmhouseY: number
) {
  // Terraced fields ascending
  const startX = 12;
  const terraceHeight = 5;

  farmState.fields.forEach((field, index) => {
    const fy = 4 + index * (terraceHeight + 2);
    const fx = startX + (index % 2) * 2; // Slight zigzag
    const width = rng.nextInt(12, 18);

    createFieldArea(map, field, index, fx, fy, width, terraceHeight, style, 'terraced', rng);

    // Add terrace wall below each field
    for (let x = fx; x < fx + width; x++) {
      const wallY = fy + terraceHeight;
      if (wallY >= 0 && wallY < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        map[wallY][x] = {
          type: 'fence',
          symbol: '▬',
          color: '#8B7355',
          backgroundColor: '#1a1a1a',
          walkable: false,
        };
      }
    }
  });
}

function placeFieldsRows(
  map: FarmTile[][],
  farmState: FarmState,
  style: any,
  rng: SeededRandom,
  farmhouseX: number,
  farmhouseY: number
) {
  // Standard rows pattern
  const fieldWidth = rng.nextInt(7, 10);
  const fieldHeight = rng.nextInt(5, 7);
  const spacing = 2;
  const startX = 14;
  const startY = 2;

  farmState.fields.forEach((field, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const fx = startX + col * (fieldWidth + spacing);
    const fy = startY + row * (fieldHeight + spacing);

    createFieldArea(map, field, index, fx, fy, fieldWidth, fieldHeight, style, 'rows', rng);
  });
}

// Shared field creation with fences and crop display
function createFieldArea(
  map: FarmTile[][],
  field: FieldState,
  index: number,
  fx: number,
  fy: number,
  width: number,
  height: number,
  style: any,
  pattern: string,
  rng: SeededRandom
) {
  for (let dy = -1; dy <= height; dy++) {
    for (let dx = -1; dx <= width; dx++) {
      const x = fx + dx;
      const y = fy + dy;
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        // Fence border (except paddies which use different style)
        if (dy === -1 || dy === height || dx === -1 || dx === width) {
          // Multiple gates for wider fields or specific patterns
          let isGate = false;

          if (pattern === 'strips') {
            // Gate at top for strip farming
            isGate = dy === 0 && dx === Math.floor(width / 2);
          } else if (pattern === 'terraced') {
            // Gates at both ends for terraced fields
            isGate = (dy === -1 && (dx === Math.floor(width / 4) || dx === Math.floor(3 * width / 4))) ||
                     (dy === height && dx === Math.floor(width / 2));
          } else if (width > 10) {
            // Wide fields get 2 gates on bottom
            isGate = dy === height && (dx === Math.floor(width / 3) || dx === Math.floor(2 * width / 3));
          } else {
            // Standard: gate at bottom center
            isGate = dy === height && dx === Math.floor(width / 2);
          }

          // Also add side gate for very large fields
          if (!isGate && (width > 12 || height > 12)) {
            isGate = dx === -1 && dy === Math.floor(height / 2);
          }

          if (isGate) {
            map[y][x] = {
              type: 'gate',
              symbol: '╬',
              color: style.fence.color,
              backgroundColor: '#1a1a1a',
              walkable: true,
            };
          } else if (pattern !== 'paddies') {
            map[y][x] = {
              type: 'fence',
              symbol: style.fence.symbol,
              color: style.fence.color,
              backgroundColor: '#1a1a1a',
              walkable: false,
            };
          }
        }
        // Field interior
        else {
          const growthStage = field.growthStage || 'fallow';
          const visual = field.crop && growthStage !== 'fallow'
            ? GROWTH_VISUALS[growthStage]
            : GROWTH_VISUALS.fallow;

          let bgColor = '#1a1a1a';
          if (field.moisture === 'wet') bgColor = '#1a2a3a';
          if (field.moisture === 'flooded') bgColor = '#2a4a6a';
          if (field.moisture === 'moist') bgColor = '#1a2520';
          if (field.diseaseSeverity > 50) bgColor = '#3a1a1a';

          map[y][x] = {
            type: 'field',
            symbol: field.crop && CROP_EMOJIS[field.crop] ? CROP_EMOJIS[field.crop] : visual.symbol,
            color: visual.color,
            backgroundColor: bgColor,
            walkable: true,
            fieldId: index,
            interactable: true,
            interactionType: growthStage === 'mature' ? 'harvest' : (growthStage === 'fallow' ? 'plant' : 'water_field'),
            cropType: field.crop || undefined,
            growthStage,
            moisture: field.moisture,
            health: field.health,
          };
        }
      }
    }
  }
}

export const FarmRoguelikeWorkTab: React.FC<FarmRoguelikeWorkTabProps> = ({
  farmState,
  setFarmState,
  headFarmer,
  llmHooks,
  fieldHooks,
  season,
  useLlm,
  onPlayerStateChange,
  onTimeAdvance,
}) => {
  const { hoursWorkedToday, farmActionLog, currentFarmTime, handleQuickNpcTalk } = llmHooks;
  const { validCrops } = fieldHooks;

  // Player state
  const [player, setPlayer] = useState<FarmPlayer>({
    x: 7, // Start at farmhouse door
    y: 5,
    hasWaterBucket: true,
    waterBucketFull: false,
    hasSeedBag: true,
    selectedSeed: validCrops[0] || 'wheat',
    fatigue: 0,
    maxFatigue: 100,
  });

  // UI state
  const [message, setMessage] = useState<string>('Use Arrows to move. Space: Interact | W: Water | P: Plant | H: Harvest | F: Feed | T: Talk');
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptData, setPromptData] = useState<{
    message: string;
    onConfirm: () => void;
    riskText?: string;
  } | null>(null);

  // Toast notification system (now shows in right sidebar)
  const [toastMessages, setToastMessages] = useState<Array<{ message: string; type: 'success' | 'info' | 'warning'; id: number }>>([]);

  // NPC dialogue state
  const [activeNpcChat, setActiveNpcChat] = useState<{ npc: FarmFamilyMember; messages: Array<{ from: 'player' | 'npc'; text: string }> } | null>(null);
  const [npcChatInput, setNpcChatInput] = useState('');

  // Harvested crops tracking
  const [harvestedCrops, setHarvestedCrops] = useState<Array<{ crop: string; fieldId: number; timestamp: number }>>([]);

  // Particle effects
  const [particles, setParticles] = useState<Array<{ x: number; y: number; symbol: string; id: number }>>([]);

  // Water ripple effects
  const [waterRipples, setWaterRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  // Tile flash effects (for satisfying feedback)
  const [flashingTiles, setFlashingTiles] = useState<Set<string>>(new Set());

  // Hovered tile for context display
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Time progression tracking
  const [localGameDay, setLocalGameDay] = useState(Math.floor(currentFarmTime / 24));
  const [localGameHour, setLocalGameHour] = useState(currentFarmTime % 24);

  // Barn storage (crops harvested and stored)
  const [barnStorage, setBarnStorage] = useState<{ [crop: string]: number }>({});

  // NPC positions (family members on the map)
  const [npcPositions, setNpcPositions] = useState<{ [id: string]: { x: number; y: number } }>({});

  // Animated stat values for smooth transitions
  const [displayedFatigue, setDisplayedFatigue] = useState(0);
  const [displayedDay, setDisplayedDay] = useState(localGameDay);
  const [displayedHour, setDisplayedHour] = useState(localGameHour);

  // Initialize NPC positions when farm loads
  useEffect(() => {
    if (!farmState || !farmState.family || npcPositions && Object.keys(npcPositions).length > 0) return;

    const initialPositions: { [id: string]: { x: number; y: number } } = {};
    farmState.family.members.forEach((member, idx) => {
      // Place NPCs in different starting locations based on their role
      const baseX = 10 + (idx * 5);
      const baseY = 10 + (idx % 2) * 5;
      initialPositions[member.id] = {
        x: Math.min(baseX, MAP_WIDTH - 2),
        y: Math.min(baseY, MAP_HEIGHT - 2),
      };
    });
    setNpcPositions(initialPositions);
  }, [farmState, npcPositions]);

  // Generate farm map from state
  const farmMap = React.useMemo(() => {
    return generateFarmLayout(
      farmState,
      farmState.historicalContext.culturalZone,
      farmState.historicalContext.era
    );
  }, [farmState]);

  // Helper function to show toast (must be defined before processDailyGrowth)
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setToastMessages(prev => [...prev, { message, type, id }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Process daily crop growth
  const processDailyGrowth = useCallback(() => {
    setFarmState(prev => {
      const newFields = prev.fields.map(field => {
        if (!field.crop || field.growthStage === 'fallow' || field.growthStage === 'mature') {
          return field;
        }

        // Decrement days to harvest
        const newDaysToHarvest = Math.max(0, (field.daysToHarvest || 30) - 1);

        // Calculate growth percentage
        const totalGrowthDays = 30; // Could vary by crop type
        const growthPercent = ((totalGrowthDays - newDaysToHarvest) / totalGrowthDays) * 100;

        // Determine growth stage
        let newGrowthStage: 'fallow' | 'planted' | 'sprouting' | 'growing' | 'mature' = 'planted';
        if (growthPercent >= 100) newGrowthStage = 'mature';
        else if (growthPercent >= 60) newGrowthStage = 'growing';
        else if (growthPercent >= 20) newGrowthStage = 'sprouting';

        // Growth affected by conditions
        let healthChange = 0;

        // Dry fields lose health
        if (field.moisture === 'dry') {
          healthChange = -5;
        }
        // Flooded fields lose health
        else if (field.moisture === 'flooded') {
          healthChange = -3;
        }
        // Optimal moisture (moist/wet)
        else {
          healthChange = 2;
        }

        // Disease affects health
        if (field.diseaseSeverity > 30) {
          healthChange -= 3;
        }

        const newHealth = Math.max(0, Math.min(100, field.health + healthChange));

        // Fields dry out over time
        const moistureLevels = ['dry', 'moist', 'wet', 'flooded'];
        const currentMoistureIndex = moistureLevels.indexOf(field.moisture);
        const newMoistureIndex = Math.max(0, currentMoistureIndex - 1);
        const newMoisture = moistureLevels[newMoistureIndex] as any;

        return {
          ...field,
          daysToHarvest: newDaysToHarvest,
          growthStage: newGrowthStage,
          health: newHealth,
          moisture: newMoisture,
        };
      });

      return { ...prev, fields: newFields };
    });

    showToast('🌅 New day! Crops have grown.', 'info');
  }, [setFarmState, showToast]);

  // Detect day changes
  useEffect(() => {
    const newDay = Math.floor(currentFarmTime / 24);
    const newHour = currentFarmTime % 24;

    if (newDay > localGameDay) {
      // Day has advanced!
      setLocalGameDay(newDay);
      setLocalGameHour(newHour);
      processDailyGrowth();
    } else if (newHour !== localGameHour) {
      setLocalGameHour(newHour);
    }
  }, [currentFarmTime, localGameDay, localGameHour, processDailyGrowth]);

  // Handle player movement with interactive obstacles
  const handleMove = useCallback((dx: number, dy: number) => {
    const newX = player.x + dx;
    const newY = player.y + dy;

    // Bounds check
    if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
      return;
    }

    // Check if trying to walk into NPC
    if (farmState && farmState.family) {
      const npcAtTarget = farmState.family.members.find(member => {
        const npcPos = npcPositions[member.id];
        return npcPos && npcPos.x === newX && npcPos.y === newY;
      });

      if (npcAtTarget) {
        // Trigger dialogue instead of moving
        setActiveNpcChat({ npc: npcAtTarget, messages: [] });
        showToast(`💬 Talking with ${npcAtTarget.name}...`, 'info');
        setMessage(`You approach ${npcAtTarget.name}. Type a message or press Esc to leave.`);
        return;
      }
    }

    const targetTile = farmMap[newY][newX];

    // Interactive collision handling
    if (!targetTile.walkable) {
      // Fence - offer to climb
      if (targetTile.type === 'fence') {
        setPromptData({
          message: "There's a fence here. Climb over it?",
          riskText: "⚠️ 5% chance to damage the fence",
          onConfirm: () => {
            const roll = Math.random();
            if (roll < 0.05) {
              // Broke the fence!
              setMessage('💥 You damaged the fence while climbing!');
              setPlayer(prev => ({ ...prev, x: newX, y: newY, fatigue: Math.min(prev.fatigue + 2, prev.maxFatigue) }));
              // Could update farm state to track broken fences
            } else {
              setMessage('You carefully climb over the fence.');
              setPlayer(prev => ({ ...prev, x: newX, y: newY, fatigue: Math.min(prev.fatigue + 1, prev.maxFatigue) }));
            }
            setShowPrompt(false);
          }
        });
        setShowPrompt(true);
        return;
      }

      // Farmhouse/Barn - offer to enter
      if (targetTile.type === 'farmhouse' || targetTile.type === 'barn') {
        setPromptData({
          message: `Enter the ${targetTile.type}?`,
          onConfirm: () => {
            setMessage(`You step into the ${targetTile.type}.`);
            setPlayer(prev => ({ ...prev, x: newX, y: newY }));
            setShowPrompt(false);
          }
        });
        setShowPrompt(true);
        return;
      }

      // Well - can't walk through but show message
      if (targetTile.type === 'well') {
        setMessage("The well is in the way. Stand next to it and press W to fill your bucket.");
        return;
      }

      // Generic obstacle
      setMessage(`Can't walk through ${targetTile.type.replace(/_/g, ' ')}!`);
      return;
    }

    // Movement successful
    setPlayer(prev => ({ ...prev, x: newX, y: newY }));
  }, [player, farmMap, farmState, npcPositions, showToast]);

  // Send message to NPC (LLM-powered)
  const sendNpcMessage = useCallback(async () => {
    if (!activeNpcChat || !npcChatInput.trim()) return;

    const userMessage = npcChatInput.trim();
    console.log('[FarmRoguelike] Sending message to NPC:', activeNpcChat.npc.name, 'Message:', userMessage);
    setNpcChatInput('');

    // Add user message to chat
    setActiveNpcChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, { from: 'player', text: userMessage }]
    } : null);

    showToast('Waiting for response...', 'info');

    try {
      // Call LLM
      console.log('[FarmRoguelike] Calling handleQuickNpcTalk...');
      const response = await handleQuickNpcTalk(activeNpcChat.npc);
      console.log('[FarmRoguelike] Received response:', response);

      // Add NPC response to chat
      setActiveNpcChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, { from: 'npc', text: response }]
      } : null);

      showToast(`${activeNpcChat.npc.name} responded`, 'success');
    } catch (error) {
      console.error('[FarmRoguelike] NPC chat error:', error);
      const fallback = `"I'm sorry, I didn't quite catch that. ${activeNpcChat.npc.currentTask ? `I'm busy ${activeNpcChat.npc.currentTask.toLowerCase()}.` : 'Can we talk later?'}"`;

      setActiveNpcChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, { from: 'npc', text: fallback }]
      } : null);

      showToast('Response error', 'warning');
    }
  }, [activeNpcChat, npcChatInput, handleQuickNpcTalk, showToast]);

  // Handle watering
  const handleWater = useCallback(() => {
    const currentTile = farmMap[player.y][player.x];

    // Check if standing on or adjacent to well
    let wellTile = null;
    if (currentTile.interactionType === 'water_source') {
      wellTile = currentTile;
    } else {
      // Check adjacent tiles for well
      const adjacentOffsets = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
      ];
      for (const { dx, dy } of adjacentOffsets) {
        const checkX = player.x + dx;
        const checkY = player.y + dy;
        if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
          const tile = farmMap[checkY][checkX];
          if (tile.interactionType === 'water_source') {
            wellTile = tile;
            break;
          }
        }
      }
    }

    // Refill at well
    if (wellTile) {
      if (!player.waterBucketFull) {
        setPlayer(prev => ({ ...prev, waterBucketFull: true }));

        // Create water filling effect (blue particles from well)
        const wellX = player.x * TILE_SIZE;
        const wellY = player.y * TILE_SIZE;
        const fillParticles = Array.from({ length: 8 }, (_, i) => ({
          x: wellX + Math.random() * TILE_SIZE - TILE_SIZE / 2,
          y: wellY - 10 - Math.random() * 20,
          symbol: '💧',
          id: Date.now() + i,
        }));
        setParticles(fillParticles);

        setMessage('💧 Filled water bucket at well');
        showToast('💧 Bucket filled!', 'success');
      } else {
        setMessage('Water bucket is already full');
        showToast('Bucket already full', 'info');
      }
      return;
    }

    // Water field
    if (currentTile.type === 'field' && currentTile.fieldId !== undefined) {
      if (!player.waterBucketFull) {
        setMessage('⚠️ Water bucket is empty! Go to the well (💧) to refill.');
        showToast('⚠️ Bucket empty!', 'warning');
        return;
      }

      const fieldId = currentTile.fieldId;
      const field = farmState.fields[fieldId];

      if (field.moisture === 'flooded') {
        setMessage('⚠️ This field is already flooded!');
        showToast('Already flooded!', 'warning');
        return;
      }

      // Update field moisture
      const moistureLevels = ['dry', 'moist', 'wet', 'flooded'];
      const currentIndex = moistureLevels.indexOf(field.moisture);
      const newMoisture = moistureLevels[Math.min(currentIndex + 1, moistureLevels.length - 1)] as any;

      setFarmState(prev => {
        const newFields = [...prev.fields];
        newFields[fieldId] = {
          ...newFields[fieldId],
          moisture: newMoisture,
          lastWatered: Math.floor(currentFarmTime / 24), // Current game day
        };

        return { ...prev, fields: newFields };
      });

      // Consume water and add fatigue
      setPlayer(prev => ({ ...prev, waterBucketFull: false, fatigue: Math.min(prev.fatigue + 3, prev.maxFatigue) }));

      // Create satisfying water ripple effect
      const rippleId = Date.now();
      setWaterRipples(prev => [...prev, { x: player.x, y: player.y, id: rippleId }]);
      setTimeout(() => {
        setWaterRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 800);

      // Flash the tile for feedback
      const tileKey = `${player.x}-${player.y}`;
      setFlashingTiles(prev => new Set(prev).add(tileKey));
      setTimeout(() => {
        setFlashingTiles(prev => {
          const next = new Set(prev);
          next.delete(tileKey);
          return next;
        });
      }, 300);

      // Create water droplet particles
      const dropletCount = 12;
      const newDroplets = Array.from({ length: dropletCount }, (_, i) => ({
        x: player.x * TILE_SIZE + Math.random() * TILE_SIZE - TILE_SIZE / 2,
        y: player.y * TILE_SIZE + Math.random() * TILE_SIZE - TILE_SIZE / 2,
        symbol: '💧',
        id: Date.now() + i,
      }));
      setParticles(newDroplets);

      // Time passes - ADVANCE TIME
      if (onTimeAdvance) {
        onTimeAdvance(0.5);
      }

      if (onPlayerStateChange) {
        onPlayerStateChange({ fatigue: 3 });
      }

      setMessage(`💧 Watered Field ${fieldId + 1}! (0.5 hours)`);
      showToast(`✅ Watered (now ${newMoisture})`, 'success');
    } else {
      setMessage('Nothing to water here. Stand on a field to water it.');
    }
  }, [player, farmMap, farmState.fields, setFarmState, currentFarmTime, onPlayerStateChange, onTimeAdvance, showToast]);

  // Handle planting
  const handlePlant = useCallback(() => {
    const currentTile = farmMap[player.y][player.x];

    if (currentTile.type === 'field' && currentTile.fieldId !== undefined) {
      const fieldId = currentTile.fieldId;
      const field = farmState.fields[fieldId];

      if (field.growthStage !== 'fallow') {
        setMessage(`⚠️ Field ${fieldId + 1} already has ${field.crop}! Harvest first.`);
        return;
      }

      // Open crop selector
      setSelectedFieldId(fieldId);
      setShowCropSelector(true);
    } else {
      setMessage('You need to be standing on a fallow field to plant.');
    }
  }, [player, farmMap, farmState.fields]);

  // Confirm crop selection
  const confirmPlant = useCallback((crop: string) => {
    if (selectedFieldId === null) return;

    const cropEmoji = CROP_EMOJIS[crop] || '🌱';

    setFarmState(prev => {
      const newFields = [...prev.fields];
      newFields[selectedFieldId] = {
        ...newFields[selectedFieldId],
        crop,
        growthStage: 'planted',
        lastWorked: Math.floor(currentFarmTime / 24),
        daysToHarvest: 30, // Simplified for demo
      };
      return { ...prev, fields: newFields };
    });

    setPlayer(prev => ({ ...prev, fatigue: Math.min(prev.fatigue + 5, prev.maxFatigue) }));

    // Time passes - ADVANCE TIME
    if (onTimeAdvance) {
      onTimeAdvance(1);
    }

    if (onPlayerStateChange) {
      onPlayerStateChange({ fatigue: 5 });
    }

    setMessage(`🌱 Planted ${crop} in Field ${selectedFieldId + 1}! (1 hour)`);
    showToast(`✅ Planted ${cropEmoji} ${crop}`, 'success');
    setShowCropSelector(false);
    setSelectedFieldId(null);
  }, [selectedFieldId, setFarmState, currentFarmTime, onPlayerStateChange, onTimeAdvance, showToast]);

  // Handle harvest with yield calculation
  const handleHarvest = useCallback(() => {
    const currentTile = farmMap[player.y][player.x];

    if (currentTile.type === 'field' && currentTile.fieldId !== undefined) {
      const fieldId = currentTile.fieldId;
      const field = farmState.fields[fieldId];

      if (field.growthStage !== 'mature') {
        const daysLeft = field.daysToHarvest || 0;
        setMessage(`⚠️ Field ${fieldId + 1} crops aren't ready yet! ${daysLeft} days left (${field.growthStage})`);
        showToast(`Not ready (${daysLeft} days left)`, 'warning');
        return;
      }

      const cropName = field.crop || 'crops';
      const cropEmoji = field.crop && CROP_EMOJIS[field.crop] ? CROP_EMOJIS[field.crop] : '🌾';

      // Calculate yield based on field health and size
      const baseYield = {
        wheat: 12,
        barley: 10,
        rice: 18,
        millet: 15,
        corn: 14,
        cotton: 8,
        flax: 10,
        beans: 10,
        peas: 11,
        lentils: 9,
      };

      const cropBaseYield = baseYield[field.crop as keyof typeof baseYield] || 10;
      const healthMultiplier = field.health / 100; // 100% health = 1.0x, 50% = 0.5x
      const yieldAmount = Math.max(1, Math.floor(cropBaseYield * healthMultiplier));

      // Create particle effects at harvest location
      const particleCount = 8;
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        x: player.x * TILE_SIZE + Math.random() * TILE_SIZE - TILE_SIZE / 2,
        y: player.y * TILE_SIZE + Math.random() * TILE_SIZE - TILE_SIZE / 2,
        symbol: cropEmoji,
        id: Date.now() + i,
      }));
      setParticles(newParticles);

      // Add to harvested crops log
      setHarvestedCrops(prev => [...prev, {
        crop: cropName,
        fieldId: fieldId,
        timestamp: Date.now(),
      }]);

      // Add to barn storage
      setBarnStorage(prev => ({
        ...prev,
        [cropName]: (prev[cropName] || 0) + yieldAmount,
      }));

      // Harvest the field
      setFarmState(prev => {
        const newFields = [...prev.fields];
        newFields[fieldId] = {
          ...newFields[fieldId],
          crop: null,
          growthStage: 'fallow',
          health: 100,
        };
        return { ...prev, fields: newFields };
      });

      setPlayer(prev => ({ ...prev, fatigue: Math.min(prev.fatigue + 8, prev.maxFatigue) }));

      // Time passes - ADVANCE TIME
      if (onTimeAdvance) {
        onTimeAdvance(2);
      }

      if (onPlayerStateChange) {
        onPlayerStateChange({ fatigue: 8 });
      }

      setMessage(`🌾 Harvested ${yieldAmount} ${cropName} from Field ${fieldId + 1}! (2 hours)`);
      showToast(`✅ +${yieldAmount} ${cropEmoji} ${cropName}!`, 'success');
    } else {
      setMessage('Nothing ready to harvest here.');
    }
  }, [player, farmMap, farmState.fields, setFarmState, onPlayerStateChange, onTimeAdvance, showToast]);

  // Handle livestock feeding
  const handleFeed = useCallback(() => {
    const currentTile = farmMap[player.y][player.x];

    if (currentTile.interactionType === 'feed_livestock') {
      if (!farmState.livestock || farmState.livestock.length === 0) {
        setMessage('No livestock to feed.');
        showToast('No livestock here', 'info');
        return;
      }

      const livestockCount = farmState.livestock.length;

      // Feed all livestock
      setFarmState(prev => {
        const newLivestock = prev.livestock.map(animal => ({
          ...animal,
          lastFed: currentFarmTime,
          health: Math.min(animal.health + 10, 100),
          productivity: Math.min(animal.productivity + 5, 100),
        }));
        return { ...prev, livestock: newLivestock };
      });

      setPlayer(prev => ({ ...prev, fatigue: Math.min(prev.fatigue + 4, prev.maxFatigue) }));

      // Time passes - ADVANCE TIME
      if (onTimeAdvance) {
        onTimeAdvance(0.75);
      }

      if (onPlayerStateChange) {
        onPlayerStateChange({ fatigue: 4 });
      }

      setMessage(`🐄 Fed all livestock! (0.75 hours)`);
      showToast(`✅ Fed ${livestockCount} animal${livestockCount > 1 ? 's' : ''}`, 'success');
    } else {
      setMessage('No livestock nearby. Go to the barn.');
    }
  }, [player, farmMap, farmState.livestock, setFarmState, currentFarmTime, onPlayerStateChange, onTimeAdvance, showToast]);

  // Smart interaction handler (space bar) - detects context and performs appropriate action
  const handleSmartInteraction = useCallback(() => {
    const currentTile = farmMap[player.y][player.x];

    // Check for nearby NPCs first
    if (farmState && farmState.family) {
      const adjacentNpc = farmState.family.members.find(member => {
        const npcPos = npcPositions[member.id];
        if (!npcPos) return false;
        const distance = Math.abs(player.x - npcPos.x) + Math.abs(player.y - npcPos.y);
        return distance === 1;
      });

      if (adjacentNpc) {
        // Show loading state
        showToast('💬 Talking...', 'info');
        setMessage(`You greet ${adjacentNpc.name}...`);

        // Call LLM for dialogue
        handleQuickNpcTalk(adjacentNpc).then(response => {
          showToast(`${adjacentNpc.name}: ${response}`, 'info');
          setMessage(`${adjacentNpc.name} says: ${response}`);
        }).catch(error => {
          console.error('Talk error:', error);
          const fallback = `"Hello! ${adjacentNpc.currentTask ? `Busy ${adjacentNpc.currentTask.toLowerCase()}.` : 'How are you?'}"`;
          showToast(`${adjacentNpc.name}: ${fallback}`, 'info');
          setMessage(`${adjacentNpc.name} says: ${fallback}`);
        });
        return;
      }
    }

    // At water source - refill bucket
    if (currentTile.interactionType === 'water_source') {
      handleWater();
      return;
    }

    // At livestock pen - feed animals
    if (currentTile.interactionType === 'feed_livestock') {
      handleFeed();
      return;
    }

    // On field - detect what action makes sense
    if (currentTile.type === 'field' && currentTile.fieldId !== undefined) {
      const field = farmState.fields[currentTile.fieldId];

      // Mature crop - harvest
      if (field.growthStage === 'mature') {
        handleHarvest();
        return;
      }

      // Fallow field - plant
      if (field.growthStage === 'fallow') {
        handlePlant();
        return;
      }

      // Growing crop - water
      if (field.crop) {
        handleWater();
        return;
      }
    }

    // Default - show helpful message
    setMessage('Nothing to interact with here. Try standing on a field, near an NPC, or at the well.');
  }, [player, farmMap, farmState, npcPositions, showToast, handleWater, handleFeed, handleHarvest, handlePlant, handleQuickNpcTalk]);

  // Keyboard controls - with aggressive event capture to prevent overworld movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Handle NPC chat separately
      if (activeNpcChat) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setActiveNpcChat(null);
          setNpcChatInput('');
          showToast('Ended conversation', 'info');
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          sendNpcMessage();
          return;
        }
        // Let other keys through for typing
        return;
      }

      // Check if this is a movement or action key we handle
      const isOurKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'p', 'h', 'f', 't'].includes(key);

      // ALWAYS prevent default and stop propagation for our keys, even if modals are open
      // This prevents overworld from capturing the events
      if (isOurKey) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Don't process the action if crop selector or prompt is open, but still block the event
      if (showCropSelector || showPrompt) return;

      if (!isOurKey) return;

      // Movement (arrow keys only)
      if (key === 'arrowup') {
        handleMove(0, -1);
        return;
      }
      if (key === 'arrowdown') {
        handleMove(0, 1);
        return;
      }
      if (key === 'arrowleft') {
        handleMove(-1, 0);
        return;
      }
      if (key === 'arrowright') {
        handleMove(1, 0);
        return;
      }

      // Smart interaction (Space bar) - context-aware
      if (key === ' ') {
        handleSmartInteraction();
        return;
      }

      // Direct action keys
      if (key === 'w') {
        handleWater();
        return;
      }
      if (key === 'p') {
        handlePlant();
        return;
      }
      if (key === 'h') {
        handleHarvest();
        return;
      }
      if (key === 'f') {
        handleFeed();
        return;
      }
      if (key === 't') {
        // Talk to nearby NPC
        if (farmState && farmState.family) {
          const adjacentNpc = farmState.family.members.find(member => {
            const npcPos = npcPositions[member.id];
            if (!npcPos) return false;
            const distance = Math.abs(player.x - npcPos.x) + Math.abs(player.y - npcPos.y);
            return distance === 1;
          });

          if (adjacentNpc) {
            // Show loading state
            showToast('💬 Talking...', 'info');
            setMessage(`You greet ${adjacentNpc.name}...`);

            // Call LLM for dialogue
            handleQuickNpcTalk(adjacentNpc).then(response => {
              showToast(`${adjacentNpc.name}: ${response}`, 'info');
              setMessage(`${adjacentNpc.name} says: ${response}`);
            }).catch(error => {
              console.error('Talk error:', error);
              const fallback = `"Hello! ${adjacentNpc.currentTask ? `Busy ${adjacentNpc.currentTask.toLowerCase()}.` : 'How are you?'}"`;
              showToast(`${adjacentNpc.name}: ${fallback}`, 'info');
              setMessage(`${adjacentNpc.name} says: ${fallback}`);
            });
          } else {
            showToast('No one nearby to talk to', 'warning');
          }
        }
        return;
      }
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleMove, handleWater, handlePlant, handleHarvest, handleFeed, handleSmartInteraction, showCropSelector, showPrompt, player, npcPositions, farmState, showToast, activeNpcChat, sendNpcMessage]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  // Cleanup particles after animation
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  // Animate fatigue changes smoothly
  useEffect(() => {
    const target = player.fatigue;
    if (displayedFatigue === target) return;

    const diff = target - displayedFatigue;
    const step = diff > 0 ? Math.ceil(diff / 10) : Math.floor(diff / 10);

    const interval = setInterval(() => {
      setDisplayedFatigue(prev => {
        const next = prev + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
          clearInterval(interval);
          return target;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [player.fatigue, displayedFatigue]);

  // Animate day/hour changes smoothly
  useEffect(() => {
    if (displayedDay !== localGameDay) {
      const timer = setTimeout(() => setDisplayedDay(localGameDay), 100);
      return () => clearTimeout(timer);
    }
  }, [localGameDay, displayedDay]);

  useEffect(() => {
    if (displayedHour !== localGameHour) {
      const timer = setTimeout(() => setDisplayedHour(localGameHour), 100);
      return () => clearTimeout(timer);
    }
  }, [localGameHour, displayedHour]);

  // Get current tile info
  const currentTile = farmMap[player.y]?.[player.x];
  const currentField = currentTile?.fieldId !== undefined ? farmState.fields[currentTile.fieldId] : null;

  return (
    <div className="flex gap-4 h-full">
      {/* Main game area */}
      <div className="flex-1 flex flex-col gap-3">
        {/* HUD */}
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-400">📅 Day:</span>
                <span className="ml-2 font-semibold text-purple-400 transition-all duration-200">{displayedDay}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">🕐 Time:</span>
                <span className="ml-2 font-semibold text-cyan-400 transition-all duration-200">{Math.floor(displayedHour)}:00</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">⏱️ Worked:</span>
                <span className="ml-2 font-semibold text-amber-400 transition-all duration-200">{hoursWorkedToday.toFixed(1)}h</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">😓 Fatigue:</span>
                <span className={`ml-2 font-semibold transition-all duration-200 ${
                  displayedFatigue > 70 ? 'text-red-500' : displayedFatigue > 40 ? 'text-orange-400' : 'text-red-400'
                }`}>{displayedFatigue}/{player.maxFatigue}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">🪣 Water:</span>
                <span className={`ml-2 font-semibold ${player.waterBucketFull ? 'text-blue-400' : 'text-slate-500'}`}>
                  {player.waterBucketFull ? 'Full' : 'Empty'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex flex-col gap-0.5">
              <div>Arrows: Move | Space: Interact (smart)</div>
              <div>W: Water | P: Plant | H: Harvest | F: Feed | T: Talk</div>
            </div>
          </div>
        </div>

        {/* Hover context tooltip */}
        {hoveredTile && (
          <div className="bg-slate-800/95 border border-slate-600/60 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-lg">
            {(() => {
              const tile = farmMap[hoveredTile.y]?.[hoveredTile.x];
              if (!tile) return null;

              // Check for NPC
              const adjacentNpc = farmState?.family?.members.find(member => {
                const npcPos = npcPositions[member.id];
                return npcPos && Math.abs(player.x - npcPos.x) + Math.abs(player.y - npcPos.y) === 1;
              });
              if (adjacentNpc && hoveredTile.x === npcPositions[adjacentNpc.id]?.x && hoveredTile.y === npcPositions[adjacentNpc.id]?.y) {
                return <span>💬 Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Space</kbd> to talk</span>;
              }

              if (tile.interactionType === 'water_source') {
                return <span>💧 Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Space</kbd> to fill bucket</span>;
              }

              if (tile.interactionType === 'feed_livestock') {
                return <span>🐄 Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Space</kbd> to feed animals</span>;
              }

              if (tile.type === 'field' && tile.fieldId !== undefined) {
                const field = farmState.fields[tile.fieldId];
                if (field.growthStage === 'mature') {
                  return <span>🌾 Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Space</kbd> or <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">H</kbd> to harvest</span>;
                }
                if (field.growthStage === 'fallow') {
                  return <span>🌱 Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Space</kbd> or <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">P</kbd> to plant</span>;
                }
                if (field.crop) {
                  return <span>💧 Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Space</kbd> or <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">W</kbd> to water ({field.moisture})</span>;
                }
              }

              return <span className="text-slate-400">{tile.type.replace(/_/g, ' ')}</span>;
            })()}
          </div>
        )}

        {/* Message bar */}
        {message && (
          <div className="bg-amber-900/30 border border-amber-600/40 rounded-lg px-4 py-2 text-sm text-amber-200 animate-in slide-in-from-top">
            {message}
          </div>
        )}

        {/* Farm map */}
        <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800/60 overflow-auto relative">
          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: `repeat(${MAP_WIDTH}, ${TILE_SIZE}px)`,
              gridTemplateRows: `repeat(${MAP_HEIGHT}, ${TILE_SIZE}px)`,
              gap: 0,
              fontFamily: 'monospace',
              fontSize: `${TILE_SIZE - 2}px`,
              lineHeight: `${TILE_SIZE}px`,
            }}
          >
            {farmMap.map((row, y) =>
              row.map((tile, x) => {
                const isPlayer = player.x === x && player.y === y;
                const tileKey = `${x}-${y}`;
                const isFlashing = flashingTiles.has(tileKey);
                const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;

                // Check if NPC is at this position
                const npcAtPosition = farmState && farmState.family ?
                  farmState.family.members.find(member =>
                    npcPositions[member.id]?.x === x && npcPositions[member.id]?.y === y
                  ) : null;

                // Determine what to display
                let displaySymbol = tile.symbol;
                let displayColor = tile.color;
                let bgColor = tile.backgroundColor;

                // Flashing tile effect (for watering feedback)
                if (isFlashing) {
                  bgColor = '#4169E1'; // Bright blue flash
                }

                // Hover effect - brighten background
                if (isHovered && !isPlayer) {
                  const rgb = bgColor || '#1a1a1a';
                  bgColor = rgb.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, (match, r, g, b) => {
                    return `rgb(${Math.min(255, parseInt(r) + 30)}, ${Math.min(255, parseInt(g) + 30)}, ${Math.min(255, parseInt(b) + 30)})`;
                  });
                  if (bgColor.startsWith('#')) {
                    // Simple brightening for hex colors
                    const brightness = isHovered ? '40' : '1a';
                    bgColor = bgColor.replace(/1a/g, brightness);
                  }
                }

                if (isPlayer) {
                  displaySymbol = '@';
                  displayColor = '#FFD700';
                } else if (npcAtPosition) {
                  displaySymbol = '@';
                  // Different colors for different roles
                  displayColor = npcAtPosition.role === 'Farmer' ? '#00FFFF' :
                                npcAtPosition.role === 'Laborer' ? '#FFA500' :
                                npcAtPosition.role === 'Child' ? '#FF69B4' :
                                '#FFFFFF';
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      width: `${TILE_SIZE}px`,
                      height: `${TILE_SIZE}px`,
                      backgroundColor: bgColor,
                      color: displayColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isPlayer ? '2px solid #FFD700' :
                              (tile.interactable || npcAtPosition) ? '1px solid rgba(255, 215, 0, 0.3)' : 'none',
                      cursor: (tile.interactable || npcAtPosition) ? 'pointer' : 'default',
                      boxShadow: isPlayer ? '0 0 12px rgba(255, 215, 0, 0.6)' :
                                 isFlashing ? '0 0 16px rgba(65, 105, 225, 0.8)' : 'none',
                      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onMouseEnter={() => setHoveredTile({ x, y })}
                    onMouseLeave={() => setHoveredTile(null)}
                    onClick={() => {
                      // Allow clicking to move player
                      if (Math.abs(x - player.x) <= 1 && Math.abs(y - player.y) <= 1 && tile.walkable) {
                        setPlayer(prev => ({ ...prev, x, y }));
                      }
                    }}
                    title={npcAtPosition ? `${npcAtPosition.name} (${npcAtPosition.role})` : undefined}
                  >
                    {displaySymbol}
                  </div>
                );
              })
            )}

            {/* Particle effects overlay */}
            {particles.map(particle => (
              <div
                key={particle.id}
                className="particle-float"
                style={{
                  position: 'absolute',
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  fontSize: `${TILE_SIZE}px`,
                  pointerEvents: 'none',
                  animation: 'floatUp 1s ease-out forwards',
                  zIndex: 1000,
                }}
              >
                {particle.symbol}
              </div>
            ))}

            {/* Water ripple effects */}
            {waterRipples.map(ripple => (
              <div
                key={ripple.id}
                className="water-ripple"
                style={{
                  position: 'absolute',
                  left: `${ripple.x * TILE_SIZE}px`,
                  top: `${ripple.y * TILE_SIZE}px`,
                  width: `${TILE_SIZE}px`,
                  height: `${TILE_SIZE}px`,
                  border: '2px solid rgba(65, 105, 225, 0.6)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  animation: 'rippleExpand 0.8s ease-out forwards',
                  zIndex: 999,
                }}
              />
            ))}
          </div>

          {/* Add particle animation styles */}
          <style>{`
            @keyframes floatUp {
              0% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              100% {
                opacity: 0;
                transform: translateY(-40px) scale(1.5);
              }
            }
            @keyframes rippleExpand {
              0% {
                transform: scale(0.5);
                opacity: 1;
                border-width: 3px;
              }
              50% {
                opacity: 0.6;
              }
              100% {
                transform: scale(2.5);
                opacity: 0;
                border-width: 1px;
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px) translateX(-50%);
              }
              to {
                opacity: 1;
                transform: translateY(0) translateX(-50%);
              }
            }
          `}</style>
        </div>

        {/* Current tile info */}
        {currentField && (
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-amber-400">Field {(currentTile.fieldId || 0) + 1}</span>
                <span className="text-xs text-slate-400 ml-3">
                  {currentField.crop || 'Fallow'} • {currentField.growthStage} • {currentField.moisture}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Health: <span className={currentField.health > 70 ? 'text-green-400' : currentField.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                  {currentField.health}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar - contract tasks and field overview */}
      <div className="w-80 flex flex-col gap-3">
        {/* Contract tasks */}
        {farmState.residencyStatus?.currentContract && (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-3">
            <h4 className="text-sm font-semibold text-amber-400 mb-2 uppercase">Contract Tasks</h4>
            <div className="space-y-1">
              {farmState.residencyStatus.currentContract.tasksToday?.map((task, idx) => {
                const isCompleted = farmActionLog.some(log =>
                  log.action.toLowerCase().includes(task.toLowerCase().split(' ')[0])
                );

                return (
                  <div
                    key={idx}
                    className={`text-xs px-2 py-1 rounded border ${
                      isCompleted
                        ? 'text-green-400 bg-green-900/30 border-green-600/30 line-through'
                        : 'text-slate-200 bg-amber-900/30 border-amber-600/30'
                    }`}
                  >
                    {isCompleted && '✓ '}{task}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fields overview */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 p-3 flex-1 overflow-auto">
          <h4 className="text-sm font-semibold text-amber-400 mb-2 uppercase">Fields Status</h4>
          <div className="space-y-2">
            {farmState.fields.map((field, idx) => {
              const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
              const healthColor = field.health > 70 ? 'text-green-400' :
                                 field.health > 40 ? 'text-yellow-400' :
                                 'text-red-400';

              return (
                <div key={idx} className="bg-slate-800/40 rounded p-2 border border-slate-700/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cropEmoji}</span>
                      <div>
                        <div className="text-xs font-medium text-slate-200">Field {idx + 1}</div>
                        <div className="text-xs text-slate-400">
                          {field.crop ? (
                            <span>
                              {field.crop}
                              {field.growthStage !== 'mature' && field.daysToHarvest !== undefined && (
                                <span className="text-amber-400 ml-1">({field.daysToHarvest}d)</span>
                              )}
                              {field.growthStage === 'mature' && (
                                <span className="text-green-400 ml-1">✓ Ready!</span>
                              )}
                            </span>
                          ) : (
                            'Empty'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-semibold ${healthColor}`}>
                      {field.health}%
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {['dry', 'moist', 'wet', 'flooded'].map((level, i) => {
                      const moistureLevels = ['dry', 'moist', 'wet', 'flooded'];
                      const currentIndex = moistureLevels.indexOf(field.moisture);
                      return (
                        <div
                          key={i}
                          className={`w-full h-1 rounded-full ${
                            currentIndex >= i ? 'bg-blue-400' : 'bg-slate-600'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barn Storage section */}
          {Object.keys(barnStorage).length > 0 && (
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-3 mt-3">
              <h4 className="text-sm font-semibold text-blue-400 mb-2 uppercase flex items-center gap-2">
                <span>🏚️</span>
                Barn Storage
              </h4>
              <div className="space-y-1.5">
                {Object.entries(barnStorage).map(([cropName, quantity]) => {
                  const cropEmoji = CROP_EMOJIS[cropName] || '🌾';
                  return (
                    <div
                      key={cropName}
                      className="bg-blue-900/30 border border-blue-600/20 rounded px-2 py-1.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cropEmoji}</span>
                        <span className="text-xs font-medium text-blue-200 capitalize">{cropName}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-300">×{quantity}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-blue-600/20">
                <div className="text-xs text-blue-400 text-center font-semibold">
                  Total Storage: {Object.values(barnStorage).reduce((sum, qty) => sum + qty, 0)} units
                </div>
              </div>
            </div>
          )}

          {/* Harvested Crops section */}
          {harvestedCrops.length > 0 && (
            <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-3 mt-3">
              <h4 className="text-sm font-semibold text-green-400 mb-2 uppercase">🌾 Recent Harvests</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {harvestedCrops.slice(-10).reverse().map((harvest, idx) => {
                  const cropEmoji = CROP_EMOJIS[harvest.crop] || '🌾';
                  return (
                    <div
                      key={`harvest-${harvest.timestamp}-${idx}`}
                      className="text-xs px-2 py-1 bg-green-900/30 border border-green-600/20 rounded flex items-center gap-2"
                    >
                      <span className="text-lg">{cropEmoji}</span>
                      <span className="text-green-300 font-medium">{harvest.crop}</span>
                      <span className="text-green-600 text-[10px]">Field {harvest.fieldId + 1}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-green-500 text-center">
                Harvest count: {harvestedCrops.length}
              </div>
            </div>
          )}

          {/* Toast notifications in sidebar */}
          {toastMessages.length > 0 && (
            <div className="mt-3 space-y-2">
              {toastMessages.map(toast => (
                <div
                  key={toast.id}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium animate-in slide-in-from-right ${
                    toast.type === 'success' ? 'bg-green-900/30 border-green-600/40 text-green-200' :
                    toast.type === 'warning' ? 'bg-amber-900/30 border-amber-600/40 text-amber-200' :
                    'bg-blue-900/30 border-blue-600/40 text-blue-200'
                  }`}
                >
                  {toast.message}
                </div>
              ))}
            </div>
          )}

          {/* NPC Chat Interface */}
          {activeNpcChat && (
            <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-purple-400 uppercase">💬 Chat with {activeNpcChat.npc.name}</h4>
                <button
                  onClick={() => {
                    setActiveNpcChat(null);
                    setNpcChatInput('');
                    showToast('Ended conversation', 'info');
                  }}
                  className="text-xs px-2 py-0.5 bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Chat messages */}
              <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                {activeNpcChat.messages.length === 0 ? (
                  <div className="text-xs text-purple-300/60 text-center py-2">
                    Type a message to start the conversation...
                  </div>
                ) : (
                  activeNpcChat.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-xs px-2 py-1.5 rounded ${
                        msg.from === 'player'
                          ? 'bg-blue-900/40 border border-blue-600/30 text-blue-200 ml-4'
                          : 'bg-purple-900/40 border border-purple-600/30 text-purple-200 mr-4'
                      }`}
                    >
                      <div className="font-semibold text-[10px] mb-0.5 opacity-70">
                        {msg.from === 'player' ? 'You' : activeNpcChat.npc.name}
                      </div>
                      <div className="leading-relaxed">{msg.text}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Input area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={npcChatInput}
                  onChange={(e) => setNpcChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendNpcMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-2 py-1.5 bg-slate-800/60 border border-slate-600/40 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  autoFocus
                />
                <button
                  onClick={sendNpcMessage}
                  disabled={!npcChatInput.trim()}
                  className="px-3 py-1.5 bg-purple-700/50 hover:bg-purple-600/60 disabled:bg-slate-700/30 disabled:text-slate-500 text-purple-100 text-xs font-medium rounded transition-colors"
                >
                  Send
                </button>
              </div>

              <div className="mt-2 text-[10px] text-purple-400/60 text-center">
                Press Esc to close • Enter to send
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Crop selector modal */}
      {showCropSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border-2 border-amber-600 rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Select Crop to Plant</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {validCrops.map(crop => (
                <button
                  key={crop}
                  onClick={() => confirmPlant(crop)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                >
                  <span className="text-2xl">{CROP_EMOJIS[crop] || '🌱'}</span>
                  <span className="text-sm font-medium text-slate-200 capitalize">{crop}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowCropSelector(false);
                setSelectedFieldId(null);
              }}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Prompt modal for interactive decisions */}
      {showPrompt && promptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border-2 border-amber-600 rounded-xl p-6 max-w-md">
            <div className="mb-4">
              <p className="text-lg font-medium text-slate-200 mb-2">{promptData.message}</p>
              {promptData.riskText && (
                <p className="text-sm text-amber-400 bg-amber-900/30 border border-amber-600/30 rounded px-3 py-2">
                  {promptData.riskText}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  promptData.onConfirm();
                }}
                className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setShowPrompt(false);
                  setPromptData(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmRoguelikeWorkTab;
