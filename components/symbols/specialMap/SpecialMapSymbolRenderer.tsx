/**
 * components/symbols/specialMap/SpecialMapSymbolRenderer.tsx
 * Renders appropriate symbols for special map architectural biomes
 */

import React from 'react';
import { BiomeType, CulturalZone, HistoricalEra } from '../../../types';

// Import all special map symbols from the consolidated location
import { 
  TableSymbol,
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
  FloorSymbol,
  BathSymbol,
  MirrorSymbol,
  KitchenCounterSymbol,
  KitchenSinkSymbol,
  WeaponRackSymbol,
  ArmorStandSymbol
} from '../architecture/specialMap/index';

// Import new 2.5D symbols (Phase 1 implementations)
import { 
  WallSymbol2D,
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

interface SpecialMapSymbolRendererProps {
  x: number;
  y: number;
  size: number;
  biome: BiomeType;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
  nightIntensity?: number;
}

export const SpecialMapSymbolRenderer: React.FC<SpecialMapSymbolRendererProps> = ({
  x,
  y,
  size,
  biome,
  culturalZone,
  era,
  seed = 0,
  nightIntensity = 0
}) => {
  // Apply night filter if needed
  const nightFilter = nightIntensity > 0 ? `brightness(${1 - nightIntensity * 0.5})` : undefined;
  
  const renderSymbol = () => {
    switch (biome) {
      case BiomeType.TABLE:
        return <TableSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.CHAIR:
        return <ChairSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.BENCH:
        return <BenchSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.STATUE:
        return <StatueSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.FOUNTAIN:
        return <FountainSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.THRONE:
        return <ThroneSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.BED:
        return <BedSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.BOOKSHELF:
        return <BookshelfSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.DESK:
        return <DeskSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.PILLAR:
        return <PillarSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.COLUMN:
        return <ColumnSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.CARPET:
        return <CarpetSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.ALTAR:
        return <AltarSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.SHRINE:
        return <ShrineSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      // Additional architectural biomes that might be in the map
      case BiomeType.WALL:
        return <WallSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.WALL_GATE:
        return <WallGateSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.WALL_WINDOW:
        return <WallWindowSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      case BiomeType.DOOR:
        return <DoorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} isLocked={false} seed={seed} />;
      case BiomeType.DOOR_LOCKED:
        return <DoorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} isLocked={true} seed={seed} />;
      case BiomeType.ARCHWAY:
        return <ArchwaySymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.FLOOR_STONE:
        return <FloorTileSymbol2D x={0} y={0} size={size} culturalZone={culturalZone} era={era} floorType="stone" seed={seed} />;
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
        return <MosaicFloorSymbol culturalZone={culturalZone as CulturalZone} variant="regular" />;
      case BiomeType.FLOOR_MOSAIC_CENTER:
        return <MosaicFloorSymbol culturalZone={culturalZone as CulturalZone} variant="center" />;
      case BiomeType.FLOOR_MOSAIC_BORDER:
        return <MosaicFloorSymbol culturalZone={culturalZone as CulturalZone} variant="border" />;
      
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
        return (
          <g>
            <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.3} ry={size * 0.1} fill="#696969" stroke="#404040" strokeWidth="1" />
            <rect x={size * 0.4} y={size * 0.5} width={size * 0.2} height={size * 0.2} fill="#696969" stroke="#404040" strokeWidth="1" />
            <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.25} ry={size * 0.08} fill="#404040" />
            <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.2} ry={size * 0.15} fill="#ff4500" opacity="0.8" />
            <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.15} ry={size * 0.12} fill="#ffa500" opacity="0.6" />
          </g>
        );
        
      case BiomeType.TORCH:
        return (
          <g>
            <rect x={size * 0.45} y={size * 0.5} width={size * 0.1} height={size * 0.35} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
            <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.12} ry={size * 0.15} fill="#ff6347" opacity="0.9" />
            <ellipse cx={size * 0.5} cy={size * 0.32} rx={size * 0.08} ry={size * 0.12} fill="#ffd700" opacity="0.7" />
          </g>
        );
        
      // Furniture - Storage
      case BiomeType.CABINET:
        return <CabinetSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
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