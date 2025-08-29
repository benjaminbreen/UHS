/**
 * components/symbols/specialMap/SpecialMapSymbolRenderer.tsx
 * Renders appropriate symbols for special map architectural biomes
 */

import React from 'react';
import { BiomeType, CulturalZone, HistoricalEra } from '../../../types';
import { TableSymbol } from '../government/specialMap/TableSymbol';
import { ChairSymbol } from '../government/specialMap/ChairSymbol';
import { StatueSymbol } from '../government/specialMap/StatueSymbol';
import { WallSymbol } from '../government/specialMap/WallSymbol';
import { FloorSymbol } from '../government/specialMap/FloorSymbol';
import { FountainSymbol } from '../government/specialMap/FountainSymbol';
import { BedSymbol } from '../government/specialMap/BedSymbol';
import { ThroneSymbol } from '../government/specialMap/ThroneSymbol';
import { BookshelfSymbol } from '../government/specialMap/BookshelfSymbol';
import { DeskSymbol } from '../government/specialMap/DeskSymbol';
import { PillarSymbol } from '../government/specialMap/PillarSymbol';
import { CarpetSymbol } from '../government/specialMap/CarpetSymbol';
import { AltarSymbol } from '../government/specialMap/AltarSymbol';
import { ShrineSymbol } from '../government/specialMap/ShrineSymbol';

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
        return <TableSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.CHAIR:
        return <ChairSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
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
        
      case BiomeType.CARPET:
        return <CarpetSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      case BiomeType.ALTAR:
        return <AltarSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.SHRINE:
        return <ShrineSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
      
      // Additional architectural biomes that might be in the map
      case BiomeType.WALL:
        return <WallSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} seed={seed} />;
        
      case BiomeType.FLOOR_STONE:
      case BiomeType.FLOOR_WOOD:
      case BiomeType.FLOOR_MARBLE:
      case BiomeType.FLOOR_TILE:
        return <FloorSymbol x={0} y={0} size={size} culturalZone={culturalZone} era={era} biomeType={biome} seed={seed} />;
      
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