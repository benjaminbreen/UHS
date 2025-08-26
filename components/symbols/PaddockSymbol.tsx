/**
 * components/symbols/PaddockSymbol.tsx - Renders animal paddock fences and features.
 * Fences run along tile edges/seams to properly contain animals.
 */
import React from 'react';
import { Tile } from '../../types/index';

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
}

const PaddockSymbol: React.FC<PaddockSymbolProps> = React.memo(({ x, y, size, tile, adjacentTiles }) => {
  if (tile.paddockType !== 'Livestock') return null;

  const fenceColor = '#8B4513'; // Saddle brown
  const postColor = '#654321'; // Dark brown
  const fenceWidth = 2;
  const postSize = 3;
  const gateWidth = size * 0.3;
  
  // Only show decorations (water trough, hay) on 10% of paddock tiles
  // Use tile coordinates as seed for consistent randomization
  const showDecorations = ((tile.x * 7 + tile.y * 13) % 10) === 0;
  
  // Water trough dimensions
  const troughWidth = size * 0.25;
  const troughHeight = size * 0.15;
  const troughX = x + size * 0.65;
  const troughY = y + size * 0.7;

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
            {/* Trough body */}
            <rect 
              x={troughX} 
              y={troughY} 
              width={troughWidth} 
              height={troughHeight} 
              fill="#8B7355" 
              stroke="#654321" 
              strokeWidth="0.5"
            />
            {/* Water */}
            <rect 
              x={troughX + 1} 
              y={troughY + 2} 
              width={troughWidth - 2} 
              height={troughHeight - 3} 
              fill="#4682B4" 
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
          </g>
          
          {/* Some scattered hay */}
          {[...Array(3)].map((_, i) => (
            <g key={`hay-${i}`}>
              <rect 
                x={x + 5 + i * 8} 
                y={y + size * 0.8 + (i % 2) * 3} 
                width="4" 
                height="1" 
                fill="#DAA520" 
                opacity="0.7"
                transform={`rotate(${15 - i * 10} ${x + 7 + i * 8} ${y + size * 0.8 + (i % 2) * 3})`}
              />
            </g>
          ))}
        </>
      )}
    </>
  );
});

export default PaddockSymbol;