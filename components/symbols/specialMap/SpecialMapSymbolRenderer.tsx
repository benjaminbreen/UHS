/**
 * components/symbols/specialMap/SpecialMapSymbolRenderer.tsx
 * Renders appropriate symbols for special map architectural biomes
 */

import React from 'react';
import { BiomeType } from '../../../types/biomes/base';
import { CulturalZone } from '../../../types/characterData';
import { HistoricalEra } from '../../../types/ambiance';
import { SpecialMapArchetype } from '../../../types/specialMapTypes';
import { getFurnitureMaterial, getMaterialStyle } from '../../../services/materialMappingService';
import { isFurnitureBiome } from '../../../utils/tileConversion';

// Import all special map symbols from the consolidated location
import { 
  TableSymbol,
  TableLeft,
  TableCenter,
  TableRight,
  ChairSymbol,
  BenchSymbol,
  BedSymbol,
  ThroneSymbol,
  DeskSymbol,
  BookshelfSymbol,
  CabinetSymbol,
  WallSymbol,
  DoorSymbol,
  ArchwaySymbol,
  WallGateSymbol,
  WallWindowSymbol,
  ColumnSymbol,
  PillarSymbol,
  StairsSymbol,
  StatueSymbol,
  FountainSymbol,
  AltarSymbol,
  ShrineSymbol,
  CarpetSymbol,
  DaisSymbol,
  FloorSymbol,
  BathSymbol,
  MirrorSymbol,
  KitchenCounterSymbol,
  KitchenSinkSymbol,
  WeaponRackSymbol,
  ArmorStandSymbol,
  TorchSymbol,
  LanternSymbol,
  EntrancePortalSymbol,
  PathSymbol
} from '../architecture/specialMap/index';

// Import back wall symbol for 3/4 perspective
import { BackWallSymbol } from '../architecture/specialMap/BackWallSymbol';

// Import multi-tile components
import { PillarBase } from '../architecture/specialMap/PillarBase';

// Import new 2.5D symbols (Phase 1 implementations)
import { 
  FloorTileSymbol2D,
  TableSymbol2D,
  ChairSymbol2D
} from '../architecture/specialMap/index2D';

// Import general architectural symbols that can be used in special maps
import { 
  MosaicFloorSymbol, 
  ToiletSymbol, 
  BasinSymbol, 
  FilingCabinetSymbol, 
  KitchenStoveSymbol, 
  GuardPostSymbol, 
  PodiumSymbol
} from '../architecture';

// Import fire pit symbol
import FirePitSymbol from '../FirePitSymbol';

// Import Persian rug symbol
import PersianRugSymbol from '../architecture/specialMap/PersianRugSymbol';

interface SpecialMapSymbolRendererProps {
  x: number;
  y: number;
  size: number;
  biome: BiomeType;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  year?: number; // Add year for components that need numeric year
  seed?: number;
  nightIntensity?: number;
  multiTileData?: {
    objectId: string;
    isBase: boolean;
    material: string;
    height: number;
  };
  specialArchetype?: SpecialMapArchetype;
  tile?: any; // Add tile prop to check for overlays
}

export const SpecialMapSymbolRenderer: React.FC<SpecialMapSymbolRendererProps> = ({
  x,
  y,
  size,
  biome,
  culturalZone,
  era,
  year,
  seed = 0,
  nightIntensity = 0,
  multiTileData
}) => {
  // Apply night filter if needed
  const nightFilter = nightIntensity > 0 ? `brightness(${1 - nightIntensity * 0.5})` : undefined;
  
  const renderSymbol = () => {
    // Check if this is a floor tile that should only render floors (overlays handled separately)
    const isFloorTile = [
      BiomeType.FLOOR_STONE, BiomeType.FLOOR_WOOD, BiomeType.FLOOR_MARBLE,
      BiomeType.FLOOR_TILE, BiomeType.FLOOR_CHECKERED, BiomeType.FLOOR_PATTERN,
      BiomeType.FLOOR_MOSAIC, BiomeType.FLOOR_MAT, BiomeType.CARPET,
      BiomeType.DIRT, BiomeType.GRASS
    ].includes(biome);
    
    // For floor tiles, just render the floor and let MapDisplayOptimized handle overlays
    if (isFloorTile) {
      // Floor rendering is handled in the switch statement below
    }
    
    switch (biome) {
      case BiomeType.TABLE:
        return <TableSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} variant="dining" seed={seed} />;
      
      case BiomeType.TABLE_LEFT:
        return <TableLeft x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material="wood" />;
      
      case BiomeType.TABLE_CENTER:
        return <TableCenter x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material="wood" />;
      
      case BiomeType.TABLE_RIGHT:
        return <TableRight x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material="wood" />;
      
      case BiomeType.CHAIR:
        return <ChairSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case BiomeType.BENCH:
        return <BenchSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.STATUE:
        return <StatueSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={year || 1500} />;
      
      case BiomeType.FOUNTAIN:
        return <FountainSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case BiomeType.THRONE:
        return <ThroneSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.BED:
        return <BedSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.BOOKSHELF:
        return <BookshelfSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.DESK:
        return <DeskSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
        
      case BiomeType.PILLAR:
        // Check if this is part of a multi-tile pillar
        if (multiTileData && multiTileData.isBase) {
          // For base tiles, render the PillarBase
          return <PillarBase 
            x={0} 
            y={0} 
            material={multiTileData.material as any}
            tileWidth={size}
            tileHeight={size}
            offsetX={0}
            offsetY={0}
          />;
        } else if (multiTileData) {
          // For non-base tiles that are part of multi-tile pillar, render nothing (pillar renders from top)
          return null;
        } else {
          // Regular single-tile pillar
          return <PillarSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
        }
      
      case BiomeType.COLUMN:
        return <ColumnSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.CARPET:
        return <CarpetSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.RUG:
        // Use Persian rug for MENA zones, regular carpet for others
        if (culturalZone === 'MENA' || culturalZone === 'CENTRAL_ASIAN' || culturalZone === 'SOUTH_ASIAN') {
          return <PersianRugSymbol x={0} y={0} size={size} variant="center" colorScheme="red" />;
        }
        return <CarpetSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.ALTAR:
        return <AltarSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.DAIS:
        return <DaisSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.CABINET:
        return <CabinetSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
        
      case BiomeType.SHRINE:
        return <ShrineSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      // Additional architectural biomes that might be in the map
      case BiomeType.WALL:
        return <WallSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      case BiomeType.WALL_GATE:
        return <WallGateSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.WALL_WINDOW:
        return <WallWindowSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      // Back wall biomes for 3/4 perspective
      case BiomeType.WALL_BACK:
        return <BackWallSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} variant="plain" seed={seed} />;
      case BiomeType.WALL_BACK_WINDOW:
        return <BackWallSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} variant="window" seed={seed} />;
      case BiomeType.WALL_BACK_DOOR:
        return <BackWallSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} variant="door" seed={seed} />;
      
      case BiomeType.DOOR:
        return <DoorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} isLocked={false} seed={seed} />;
      case BiomeType.DOOR_LOCKED:
        return <DoorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} isLocked={true} seed={seed} />;
      case BiomeType.ARCHWAY:
        return <ArchwaySymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.FLOOR_STONE:
        return <FloorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} floorType="stone" seed={seed} />;
      case BiomeType.FLOOR_WOOD:
        return <FloorTileSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} floorType="wood" seed={seed} />;
      case BiomeType.FLOOR_MARBLE:
        return <FloorTileSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} floorType="marble" seed={seed} />;
      case BiomeType.FLOOR_TILE:
      case BiomeType.FLOOR_PATTERN:
      case BiomeType.FLOOR_CHECKERED:
        return <FloorTileSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} floorType="tile" seed={seed} />;
      case BiomeType.FLOOR_CARPET:
        return <FloorTileSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} floorType="carpet" seed={seed} />;
      
      // Mosaic floors
      case BiomeType.FLOOR_MOSAIC:
        return <MosaicFloorSymbol culturalZone={culturalZone as CulturalZone} variant="regular" size={size} />;
      case BiomeType.FLOOR_MOSAIC_CENTER:
        return <MosaicFloorSymbol culturalZone={culturalZone as CulturalZone} variant="center" size={size} />;
      case BiomeType.FLOOR_MOSAIC_BORDER:
        return <MosaicFloorSymbol culturalZone={culturalZone as CulturalZone} variant="border" size={size} />;
      
      // Bathroom fixtures
      case BiomeType.TOILET:
        return <ToiletSymbol culturalZone={culturalZone as CulturalZone} />;
      case BiomeType.BASIN:
        return <BasinSymbol culturalZone={culturalZone as CulturalZone} />;
      case BiomeType.BATH:
        return <BathSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.MIRROR:
        return <MirrorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      // Office/Administrative
      case BiomeType.FILING_CABINET:
        return <FilingCabinetSymbol culturalZone={culturalZone as CulturalZone} era={era} />;
      case BiomeType.PODIUM:
        return <PodiumSymbol culturalZone={culturalZone as CulturalZone} />;
        
      // Kitchen
      case BiomeType.KITCHEN_STOVE:
        return <KitchenStoveSymbol culturalZone={culturalZone as CulturalZone} era={era} />;
      case BiomeType.KITCHEN_COUNTER:
        return <KitchenCounterSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.KITCHEN_SINK:
        return <KitchenSinkSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      // Security
      case BiomeType.GUARD_POST:
        return <GuardPostSymbol culturalZone={culturalZone as CulturalZone} />;
      case BiomeType.WEAPON_RACK:
        return <WeaponRackSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.ARMOR_STAND:
        return <ArmorStandSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      // Additional special map biomes
      case BiomeType.BRAZIER:
        return <TorchSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="brazier" lit={true} />;
        
      case BiomeType.TORCH:
        return <TorchSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="torch" lit={true} />;
      
      case BiomeType.LANTERN:
        return <LanternSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} lit={true} />;
      
      case BiomeType.FIRE_PIT:
        return <FirePitSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="pit" lit={true} />;
      
      case BiomeType.HEARTH:
        return <FirePitSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="hearth" lit={true} />;
      
      // Portal and path symbols
      case BiomeType.ENTRANCE_PORTAL:
        return <EntrancePortalSymbol x={0} y={0} size={size} isNight={nightIntensity > 0.3} />;
      
      case BiomeType.PATH:
        // Choose path variant based on culture and era
        let pathVariant: 'stone' | 'dirt' | 'brick' | 'marble' = 'stone';
        if (culturalZone === 'EUROPEAN' && era >= 1500) pathVariant = 'brick';
        else if (culturalZone === 'MENA') pathVariant = 'marble';
        else if (era < 1000) pathVariant = 'dirt';
        return <PathSymbol x={0} y={0} size={size} variant={pathVariant} isNight={nightIntensity > 0.3} />;
        
      // Furniture - Storage
      case BiomeType.CHEST:
        return (
          <g>
            <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.3} fill="#654321" stroke="#3a2317" strokeWidth="1" />
            <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.15} rx={size * 0.05} fill="#8b4513" stroke="#654321" strokeWidth="1" />
            <rect x={size * 0.45} y={size * 0.55} width={size * 0.1} height={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
          </g>
        );
        
      case BiomeType.BARREL:
        return (
          <g>
            <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.2} ry={size * 0.08} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
            <rect x={size * 0.3} y={size * 0.4} width={size * 0.4} height={size * 0.3} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
            <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.2} ry={size * 0.08} fill="#a0522d" stroke="#8b4513" strokeWidth="0.5" />
            <line x1={size * 0.3} y1={size * 0.5} x2={size * 0.7} y2={size * 0.5} stroke="#654321" strokeWidth="1" />
            <line x1={size * 0.3} y1={size * 0.6} x2={size * 0.7} y2={size * 0.6} stroke="#654321" strokeWidth="1" />
          </g>
        );
        
      case BiomeType.PLAZA:
        // Plaza is just decorative flooring, render as patterned stone
        return (
          <g>
            <rect x={0} y={0} width={size} height={size} fill="#d4d4d8" />
            <rect x={size * 0.1} y={size * 0.1} width={size * 0.8} height={size * 0.8} fill="#e5e5e5" stroke="#a3a3a3" strokeWidth="0.5" />
            <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.15} fill="none" stroke="#a3a3a3" strokeWidth="0.5" />
          </g>
        );
        
      // Functional
      case BiomeType.STAIRS_UP:
        return <StairsSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} direction="up" seed={seed} />;
      case BiomeType.STAIRS_DOWN:
        return <StairsSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} direction="down" seed={seed} />;
      
      // Landscape biomes - return null to let canvas handle them properly
      case BiomeType.PARK:
      case BiomeType.FOREST:
      case BiomeType.GRASSLAND:
      case BiomeType.DESERT:
      case BiomeType.SNOW:
      case BiomeType.BEACH:
      case BiomeType.RIVER:
      case BiomeType.RIVERBANK:
      case BiomeType.SCRUB:
      case BiomeType.HILLS:
      case BiomeType.TUNDRA:
      case BiomeType.JUNGLE:
      case BiomeType.WETLANDS:
      case BiomeType.MANGROVE:
      case BiomeType.OASIS:
        // Don't render these in SpecialMapSymbolRenderer - let MapCanvasPerformance handle them
        return null;
        
      default:
        // Return null for biomes that don't need special symbols
        return null;
    }
  };
  
  const symbol = renderSymbol();
  
  if (!symbol) {
    return null;
  }
  
  return (
    <g 
      transform={`translate(${x}, ${y})`}
      style={{ filter: nightFilter }}
    >
      {symbol}
    </g>
  );
};