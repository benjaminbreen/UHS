/**
 * components/symbols/specialMap/OverlayRenderer.tsx
 * Renders overlay objects (furniture, decorations) on top of floor tiles
 */

import React from 'react';
import { Tile, OverlayObjectType } from '../../../../types/core/tile';
import { CulturalZone, HistoricalEra } from '../../../../types';
import { SpecialMapArchetype } from '../../../../types/specialMapTypes';

// Import all furniture symbols from the same folder
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
  FountainSymbol,
  AltarSymbol,
  BathSymbol,
  MirrorSymbol,
  KitchenCounterSymbol,
  KitchenSinkSymbol,
  WeaponRackSymbol,
  TorchSymbol,
  DoorSymbol,
  ToiletSymbol, 
  BasinSymbol, 
  FilingCabinetSymbol, 
  KitchenStoveSymbol, 
  GuardPostSymbol, 
  PodiumSymbol,
  // Phase 1.3 Directional Variants
  BenchEastWest,
  BenchNorthSouth,
  DeskFacingNorth,
  DeskFacingSouth,
  DeskFacingEast,
  DeskFacingWest,
  BedHorizontal,
  BedVertical,
  BookshelfAgainstNorthWall,
  BookshelfAgainstSouthWall,
  BookshelfAgainstEastWall,
  BookshelfAgainstWestWall,
  // Phase 1.3 Cultural Decorations
  EuropeanHeraldicShield,
  EastAsianDecorativeScroll,
  MenaDecorativeTilePanel,
  AfricanDecorativeMask,
  IndigenousDecorativeDreamcatcher
} from './index';

// Import fire pit symbol from the correct location
import FirePitSymbol from '../../FirePitSymbol';

// Phase 2.1 & 2.2 Advanced Furniture and Lighting
import RoundTableSymbol from './RoundTableSymbol';
import ChandelierSymbol from './ChandelierSymbol';
import FireplaceSymbol from './FireplaceSymbol';

// Import new overlay symbols
import {
  ArmorStandOverlay,
  BellOverlay,
  CandelabraOverlay,
  ColumnOverlay,
  CushionOverlay,
  IdolOverlay,
  IncenseBurnerOverlay,
  PillarOverlay,
  ShrineOverlay,
  StatueOverlay,
  VaseOverlay
} from '../../overlays';

interface OverlayRendererProps {
  tile: Tile;
  x: number;
  y: number;
  size: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
  nightIntensity?: number;
  specialArchetype?: SpecialMapArchetype;
}

export const OverlayRenderer: React.FC<OverlayRendererProps> = ({
  tile,
  x,
  y,
  size,
  culturalZone,
  era,
  seed = 0,
  nightIntensity = 0,
  specialArchetype
}) => {
  // Check if tile has an overlay object
  if (!tile.overlayObject) {
    return null;
  }

  const { type, rotation = 0, material = 'wood', variant } = tile.overlayObject;
  
  // Apply night filter if needed
  const nightFilter = nightIntensity > 0 ? `brightness(${1 - nightIntensity * 0.5})` : undefined;
  
  const renderOverlaySymbol = () => {
    switch (type) {
      case OverlayObjectType.TABLE:
        return <TableSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.TABLE_LEFT:
        return <TableLeft x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material={material} />;
      
      case OverlayObjectType.TABLE_CENTER:
        return <TableCenter x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material={material} />;
      
      case OverlayObjectType.TABLE_RIGHT:
        return <TableRight x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material={material} />;
      
      case OverlayObjectType.CHAIR:
        return <ChairSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.BENCH:
        return <BenchSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.BED:
        return <BedSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.THRONE:
        return <ThroneSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.DESK:
        return <DeskSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.BOOKSHELF:
        return <BookshelfSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.CABINET:
        return <CabinetSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.CHEST:
        // Simple chest rendering
        return (
          <g>
            <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.3} fill="#654321" stroke="#3a2317" strokeWidth="1" />
            <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.15} rx={size * 0.05} fill="#8b4513" stroke="#654321" strokeWidth="1" />
            <rect x={size * 0.45} y={size * 0.55} width={size * 0.1} height={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
          </g>
        );
      
      case OverlayObjectType.BRAZIER:
        return <TorchSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="brazier" lit={true} />;
      
      case OverlayObjectType.TORCH:
        return <TorchSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="torch" lit={true} />;
      
      case OverlayObjectType.FIRE_PIT:
        return <FirePitSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="pit" lit={true} />;
      
      case OverlayObjectType.STATUE:
        return <StatueOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} year={era as number} />;
      
      case OverlayObjectType.FOUNTAIN:
        return <FountainSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.PODIUM:
        return <PodiumSymbol culturalZone={culturalZone as CulturalZone} />;
      
      case OverlayObjectType.ALTAR:
        return <AltarSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.DOOR:
        return <DoorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} isLocked={false} seed={seed} />;
      
      case OverlayObjectType.WEAPON_RACK:
        return <WeaponRackSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.ARMOR_STAND:
        return <ArmorStandOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.MIRROR:
        return <MirrorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.BASIN:
        return <BasinSymbol culturalZone={culturalZone as CulturalZone} />;
      
      case OverlayObjectType.KITCHEN_STOVE:
        return <KitchenStoveSymbol culturalZone={culturalZone as CulturalZone} era={era} />;
      
      case OverlayObjectType.KITCHEN_COUNTER:
        return <KitchenCounterSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.KITCHEN_SINK:
        return <KitchenSinkSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.BARREL:
        return (
          <g>
            <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.2} ry={size * 0.08} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
            <rect x={size * 0.3} y={size * 0.4} width={size * 0.4} height={size * 0.3} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
            <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.2} ry={size * 0.08} fill="#a0522d" stroke="#8b4513" strokeWidth="0.5" />
            <line x1={size * 0.3} y1={size * 0.5} x2={size * 0.7} y2={size * 0.5} stroke="#654321" strokeWidth="1" />
            <line x1={size * 0.3} y1={size * 0.6} x2={size * 0.7} y2={size * 0.6} stroke="#654321" strokeWidth="1" />
          </g>
        );
      
      case OverlayObjectType.FILING_CABINET:
        return <FilingCabinetSymbol culturalZone={culturalZone as CulturalZone} era={era} />;
      
      case OverlayObjectType.PILLAR_BASE:
        return <PillarOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} isTop={false} />;
      
      case OverlayObjectType.PILLAR_TOP:
        return <PillarOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} isTop={true} />;
      
      case OverlayObjectType.COLUMN:
        return <ColumnOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.SHRINE:
        return <ShrineOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} />;
      
      case OverlayObjectType.VASE:
        return <VaseOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} />;
      
      case OverlayObjectType.CUSHION:
        return <CushionOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} />;
      
      case OverlayObjectType.CANDELABRA:
        return <CandelabraOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} />;
      
      case OverlayObjectType.INCENSE_BURNER:
        return <IncenseBurnerOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} />;
      
      case OverlayObjectType.BELL:
        return <BellOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      case OverlayObjectType.IDOL:
        return <IdolOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      // Phase 1.3 Directional Furniture Variants
      case OverlayObjectType.BENCH_EAST_WEST:
        return <BenchEastWest x={0} y={0} size={size} culturalZone={culturalZone as string} variant="simple" />;
      
      case OverlayObjectType.BENCH_NORTH_SOUTH:
        return <BenchNorthSouth x={0} y={0} size={size} culturalZone={culturalZone as string} variant="simple" />;
      
      case OverlayObjectType.DESK_FACING_NORTH:
        return <DeskFacingNorth x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.DESK_FACING_SOUTH:
        return <DeskFacingSouth x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.DESK_FACING_EAST:
        return <DeskFacingEast x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.DESK_FACING_WEST:
        return <DeskFacingWest x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.BED_HORIZONTAL:
        return <BedHorizontal x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'simple'} />;
      
      case OverlayObjectType.BED_VERTICAL:
        return <BedVertical x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'simple'} />;
      
      case OverlayObjectType.BOOKSHELF_AGAINST_NORTH_WALL:
        return <BookshelfAgainstNorthWall x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.BOOKSHELF_AGAINST_SOUTH_WALL:
        return <BookshelfAgainstSouthWall x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.BOOKSHELF_AGAINST_EAST_WALL:
        return <BookshelfAgainstEastWall x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      case OverlayObjectType.BOOKSHELF_AGAINST_WEST_WALL:
        return <BookshelfAgainstWestWall x={0} y={0} size={size} culturalZone={culturalZone as string} variant={variant || 'scholar'} />;
      
      // Phase 1.3 Cultural Decoration Symbols
      case OverlayObjectType.EUROPEAN_HERALDIC_SHIELD:
        return <EuropeanHeraldicShield x={0} y={0} size={size} variant={variant || 'noble'} />;
      
      case OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL:
        return <EastAsianDecorativeScroll x={0} y={0} size={size} variant={variant || 'calligraphy'} />;
      
      case OverlayObjectType.MENA_DECORATIVE_TILE_PANEL:
        return <MenaDecorativeTilePanel x={0} y={0} size={size} variant={variant || 'geometric'} />;
      
      case OverlayObjectType.AFRICAN_DECORATIVE_MASK:
        return <AfricanDecorativeMask x={0} y={0} size={size} variant={variant || 'ceremonial'} />;
      
      case OverlayObjectType.INDIGENOUS_DECORATIVE_DREAMCATCHER:
        return <IndigenousDecorativeDreamcatcher x={0} y={0} size={size} variant={variant || 'traditional'} />;
      
      // Phase 2.1 Advanced Multi-Tile Furniture
      case OverlayObjectType.TABLE_CORNER:
      case OverlayObjectType.TABLE_ROUND_SMALL:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_CENTER:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_TOP:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_BOTTOM:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_LEFT:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_RIGHT:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_TOP_LEFT:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_TOP_RIGHT:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_BOTTOM_LEFT:
      case OverlayObjectType.TABLE_ROUND_MEDIUM_BOTTOM_RIGHT:
      case OverlayObjectType.TABLE_ROUND_LARGE:
        const tableVariant = type === OverlayObjectType.TABLE_ROUND_SMALL ? 'small' :
                            type.includes('MEDIUM') ? type.toLowerCase().replace('table_round_', '') :
                            'large';
        return <RoundTableSymbol x={0} y={0} size={size} variant={tableVariant} material={material} isLit={nightIntensity < 0.5} />;
      
      case OverlayObjectType.BANQUET_TABLE_TOP_LEFT:
      case OverlayObjectType.BANQUET_TABLE_TOP_CENTER:
      case OverlayObjectType.BANQUET_TABLE_TOP_RIGHT:
      case OverlayObjectType.BANQUET_TABLE_BOTTOM_LEFT:
      case OverlayObjectType.BANQUET_TABLE_BOTTOM_CENTER:
      case OverlayObjectType.BANQUET_TABLE_BOTTOM_RIGHT:
        // For now, use existing table parts - could create specific banquet table symbol later
        const banquetPart = type.includes('LEFT') ? 'left' : type.includes('RIGHT') ? 'right' : 'center';
        if (banquetPart === 'left') return <TableLeft x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material={material} />;
        if (banquetPart === 'right') return <TableRight x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material={material} />;
        return <TableCenter x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} material={material} />;
      
      // Phase 2.2 Lighting Systems
      case OverlayObjectType.CHANDELIER:
      case OverlayObjectType.CHANDELIER_CRYSTAL:
      case OverlayObjectType.CHANDELIER_IRON:
      case OverlayObjectType.CHANDELIER_WOODEN:
        const chandelierVariant = type === OverlayObjectType.CHANDELIER_CRYSTAL ? 'crystal' :
                                  type === OverlayObjectType.CHANDELIER_IRON ? 'iron' :
                                  type === OverlayObjectType.CHANDELIER_WOODEN ? 'wooden' : 'basic';
        return <ChandelierSymbol x={0} y={0} size={size} variant={chandelierVariant} scale={variant as any || 'medium'} isLit={nightIntensity < 0.8} culturalZone={culturalZone as string} />;
      
      case OverlayObjectType.FIREPLACE:
      case OverlayObjectType.FIREPLACE_STONE:
      case OverlayObjectType.FIREPLACE_BRICK:
      case OverlayObjectType.FIREPLACE_MARBLE:
      case OverlayObjectType.HEARTH:
      case OverlayObjectType.HEARTH_COOKING:
        const fireplaceVariant = type === OverlayObjectType.FIREPLACE_STONE ? 'stone' :
                                 type === OverlayObjectType.FIREPLACE_BRICK ? 'brick' :
                                 type === OverlayObjectType.FIREPLACE_MARBLE ? 'marble' :
                                 type.includes('HEARTH') ? 'hearth' : 'stone';
        return <FireplaceSymbol x={0} y={0} size={size} variant={fireplaceVariant} position={variant as any || 'center'} isLit={true} />;
      
      // For other Phase 2 furniture that don't have symbols yet, use placeholders
      case OverlayObjectType.FOUR_POSTER_BED_TOP_LEFT:
      case OverlayObjectType.FOUR_POSTER_BED_TOP_RIGHT:
      case OverlayObjectType.FOUR_POSTER_BED_MIDDLE_LEFT:
      case OverlayObjectType.FOUR_POSTER_BED_MIDDLE_RIGHT:
      case OverlayObjectType.FOUR_POSTER_BED_BOTTOM_LEFT:
      case OverlayObjectType.FOUR_POSTER_BED_BOTTOM_RIGHT:
        // Use existing bed symbol as placeholder
        return <BedSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.DAYBED_HEAD:
      case OverlayObjectType.DAYBED_MIDDLE:
      case OverlayObjectType.DAYBED_FOOT:
        // Use bench as placeholder for daybed
        return <BenchSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.BOOTH_BACK:
      case OverlayObjectType.BOOTH_FRONT:
      case OverlayObjectType.THEATER_SEAT_LEFT:
      case OverlayObjectType.THEATER_SEAT_CENTER:
      case OverlayObjectType.THEATER_SEAT_RIGHT:
        // Use bench as placeholder for seating
        return <BenchSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case OverlayObjectType.HANGING_LANTERN:
      case OverlayObjectType.PAPER_LANTERN:
      case OverlayObjectType.CANDLE:
      case OverlayObjectType.CANDELABRA_FLOOR:
      case OverlayObjectType.CANDELABRA_TABLE:
      case OverlayObjectType.OIL_LAMP:
      case OverlayObjectType.ELECTRIC_LAMP:
      case OverlayObjectType.FLOOR_LAMP:
      case OverlayObjectType.WALL_SCONCE:
      case OverlayObjectType.WALL_TORCH:
      case OverlayObjectType.STOVE_WOOD:
      case OverlayObjectType.STOVE_COAL:
        // Use torch/candelabra as placeholder for lighting
        return type === OverlayObjectType.CANDELABRA_FLOOR || type === OverlayObjectType.CANDELABRA_TABLE ? 
               <CandelabraOverlay x={0} y={0} size={size} culturalZone={culturalZone as string} /> :
               <TorchSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} type="torch" lit={true} />;
      
      case OverlayObjectType.OFFERING_TABLE:
        // Sacred offering table for ceremonial sites
        return <TableSymbol x={0} y={0} size={size} culturalZone={culturalZone as string} era={era as number} />;
      
      default:
        // Return a placeholder for unimplemented types
        return (
          <g>
            <rect x={size * 0.2} y={size * 0.2} width={size * 0.6} height={size * 0.6} 
                  fill="#808080" stroke="#606060" strokeWidth="1" opacity="0.5" />
            <text x={size * 0.5} y={size * 0.5} textAnchor="middle" fontSize={size * 0.15} fill="#fff">
              {type}
            </text>
          </g>
        );
    }
  };
  
  const symbol = renderOverlaySymbol();
  
  if (!symbol) {
    return null;
  }
  
  return (
    <g 
      transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}
      style={{ filter: nightFilter }}
    >
      {symbol}
    </g>
  );
};