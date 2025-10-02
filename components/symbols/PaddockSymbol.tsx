/**
 * components/symbols/PaddockSymbol.tsx - Renders animal paddock fences and features.
 * Fences run along tile edges/seams to properly contain animals.
 */
import React from 'react';
import { Tile, CulturalZone } from '../../types/index';

interface PaddockSymbolProps {
  x: number;
  y: number;
  size: number;
  tile: Tile;
  adjacentTiles: {
    north?: Tile;
    south?: Tile;
    east?: Tile;
    west?: Tile;
  };
  culturalZone?: CulturalZone;
}

const PaddockSymbol: React.FC<PaddockSymbolProps> = React.memo(({ x, y, size, tile, adjacentTiles, culturalZone }) => {
  if (tile.paddockType !== 'Livestock') return null;

  const fenceColor = '#664126'; // Saddle brown
  const postColor = '#654321'; // Dark brown
  const fenceWidth = 2;
  const postSize = 3;
  const gateWidth = size * 0.3;

  // Only show decorations (water trough, hay) on 10% of paddock tiles
  // Use tile coordinates as seed for consistent randomization
  const showDecorations = ((tile.x * 7 + tile.y * 13) % 10) === 0;

  // Deterministic randomization based on tile coordinates - use larger multipliers for more variation
  const seed1 = (tile.x * 37 + tile.y * 73) % 100;
  const seed2 = (tile.x * 53 + tile.y * 97) % 100;
  const seed3 = (tile.x * 67 + tile.y * 113) % 100;
  const seed4 = (tile.x * 41 + tile.y * 83) % 100;

  // Randomize position more aggressively (4 quadrants: NW, NE, SW, SE)
  const quadrant = seed1 % 4;
  const baseOffsetX = quadrant % 2 === 0 ? 0.15 : 0.65;
  const baseOffsetY = quadrant < 2 ? 0.15 : 0.65;

  // Increase jitter for more visible variation
  const jitterX = ((seed2 % 30) - 15) / 100; // -0.15 to +0.15
  const jitterY = ((seed3 % 30) - 15) / 100;

  // Cultural variations for trough material/style
  const getCulturalTroughStyle = () => {
    if (!culturalZone) {
      return { bodyColor: '#8B7355', waterColor: '#4682B4', material: 'wood' as const };
    }

    switch (culturalZone) {
      case 'EAST_ASIAN':
        return { bodyColor: '#A0826D', waterColor: '#5F9EA0', material: 'stone' as const };
      case 'MENA':
        return { bodyColor: '#C19A6B', waterColor: '#4682B4', material: 'clay' as const };
      case 'SOUTH_AMERICAN':
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
        return { bodyColor: '#8B7355', waterColor: '#5F9EA0', material: 'stone' as const };
      default:
        return { bodyColor: '#8B7355', waterColor: '#4682B4', material: 'wood' as const };
    }
  };

  const troughStyle = getCulturalTroughStyle();

  // Increase size variation for more noticeable differences
  const sizeVariation = 1 + ((seed1 % 40) - 20) / 100; // 0.8 to 1.2
  const troughWidth = size * 0.25 * sizeVariation;
  const troughHeight = size * 0.15 * sizeVariation;
  const troughX = x + size * (baseOffsetX + jitterX);
  const troughY = y + size * (baseOffsetY + jitterY);

  // Randomize hay appearance with more variation
  const hayCount = 2 + (seed2 % 4); // 2-5 hay pieces
  const hayRotationOffset = seed3 % 50; // 0-50 degrees base rotation

  return (
    <>
      {/* Draw fences along tile edges where there's no adjacent paddock */}
      
      {/* North fence */}
      {(!adjacentTiles.north || adjacentTiles.north.paddockType !== 'Livestock') && (
        <>
          <line 
            x1={x} y1={y} 
            x2={x + size} y2={y} 
            stroke={fenceColor} 
            strokeWidth={fenceWidth} 
          />
          {/* Fence posts */}
          <rect x={x - postSize/2} y={y - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size/2 - postSize/2} y={y - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size - postSize/2} y={y - postSize/2} width={postSize} height={postSize} fill={postColor} />
        </>
      )}
      
      {/* South fence */}
      {(!adjacentTiles.south || adjacentTiles.south.paddockType !== 'Livestock') && (
        <>
          <line 
            x1={x} y1={y + size} 
            x2={x + size} y2={y + size} 
            stroke={fenceColor} 
            strokeWidth={fenceWidth} 
          />
          {/* Fence posts */}
          <rect x={x - postSize/2} y={y + size - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size/2 - postSize/2} y={y + size - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size - postSize/2} y={y + size - postSize/2} width={postSize} height={postSize} fill={postColor} />
        </>
      )}
      
      {/* West fence - with gate if it's at the edge */}
      {(!adjacentTiles.west || adjacentTiles.west.paddockType !== 'Livestock') && (
        <>
          {/* Top part of fence */}
          <line 
            x1={x} y1={y} 
            x2={x} y2={y + (size - gateWidth)/2} 
            stroke={fenceColor} 
            strokeWidth={fenceWidth} 
          />
          {/* Bottom part of fence (after gate) */}
          <line 
            x1={x} y1={y + (size + gateWidth)/2} 
            x2={x} y2={y + size} 
            stroke={fenceColor} 
            strokeWidth={fenceWidth} 
          />
          {/* Gate posts */}
          <rect x={x - postSize/2} y={y + (size - gateWidth)/2 - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x - postSize/2} y={y + (size + gateWidth)/2 - postSize/2} width={postSize} height={postSize} fill={postColor} />
          {/* Corner posts */}
          <rect x={x - postSize/2} y={y - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x - postSize/2} y={y + size - postSize/2} width={postSize} height={postSize} fill={postColor} />
        </>
      )}
      
      {/* East fence */}
      {(!adjacentTiles.east || adjacentTiles.east.paddockType !== 'Livestock') && (
        <>
          <line 
            x1={x + size} y1={y} 
            x2={x + size} y2={y + size} 
            stroke={fenceColor} 
            strokeWidth={fenceWidth} 
          />
          {/* Fence posts */}
          <rect x={x + size - postSize/2} y={y - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size - postSize/2} y={y + size/3 - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size - postSize/2} y={y + 2*size/3 - postSize/2} width={postSize} height={postSize} fill={postColor} />
          <rect x={x + size - postSize/2} y={y + size - postSize/2} width={postSize} height={postSize} fill={postColor} />
        </>
      )}
      
      {/* Water trough and hay - only on 10% of tiles */}
      {showDecorations && (
        <>
          <g>
            {/* Trough shadow */}
            <ellipse
              cx={troughX + troughWidth/2}
              cy={troughY + troughHeight + 1}
              rx={troughWidth/2 + 1}
              ry={2}
              fill="rgba(0,0,0,0.2)"
            />
            {/* Trough body - culturally styled */}
            <rect
              x={troughX}
              y={troughY}
              width={troughWidth}
              height={troughHeight}
              fill={troughStyle.bodyColor}
              stroke="#654321"
              strokeWidth="0.5"
            />
            {/* Water - culturally styled */}
            <rect
              x={troughX + 1}
              y={troughY + 2}
              width={troughWidth - 2}
              height={troughHeight - 3}
              fill={troughStyle.waterColor}
              opacity="0.8"
            />
            {/* Water highlight */}
            <rect
              x={troughX + 2}
              y={troughY + 2}
              width={troughWidth/3}
              height={1}
              fill="#87CEEB"
              opacity="0.6"
            />
            {/* Cultural detail - texture for stone/clay */}
            {(troughStyle.material === 'stone' || troughStyle.material === 'clay') && (
              <>
                <line
                  x1={troughX}
                  y1={troughY + troughHeight/2}
                  x2={troughX + troughWidth}
                  y2={troughY + troughHeight/2}
                  stroke="#654321"
                  strokeWidth="0.3"
                  opacity="0.3"
                />
              </>
            )}
          </g>

          {/* Scattered hay - randomized count and positions */}
          {[...Array(hayCount)].map((_, i) => {
            // Position hay more scattered around trough
            const hayOffsetX = ((seed1 + i * 11) % (troughWidth * 5)) - troughWidth * 2;
            const hayOffsetY = ((seed2 + i * 13) % 15);
            const hayX = troughX + hayOffsetX;
            const hayY = troughY + troughHeight + 2 + hayOffsetY;
            const rotation = hayRotationOffset + i * 35 - 30; // More varied rotations (-30 to +140)
            const hayLength = 2 + ((seed3 + i) % 4); // 2-5 pixels

            return (
              <g key={`hay-${i}`}>
                <rect
                  x={hayX}
                  y={hayY}
                  width={hayLength}
                  height="1.5"
                  fill="#DAA520"
                  opacity={0.6 + (seed4 + i) % 20 / 100}
                  transform={`rotate(${rotation} ${hayX + hayLength/2} ${hayY})`}
                />
              </g>
            );
          })}
        </>
      )}
    </>
  );
});

export default PaddockSymbol;