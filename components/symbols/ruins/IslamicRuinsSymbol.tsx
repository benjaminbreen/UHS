/**
 * components/symbols/ruins/IslamicRuinsSymbol.tsx
 * Renders Islamic/Ottoman ruins with minarets, domes, horseshoe arches, geometric patterns
 * Historical accuracy: Based on architecture from Umayyad, Abbasid, Mamluk, Ottoman periods
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface IslamicRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  era?: string;
}

const IslamicRuinsSymbol: React.FC<IslamicRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, era = 'MEDIEVAL'
}) => {
  const rng = new ValueNoise(seed + tile.x * 61 + tile.y * 67);
  const elements: JSX.Element[] = [];
  
  // Era-specific color palettes
  const colorPalettes = {
    MEDIEVAL: {
      primary: '#F4A460', // Sandy brown
      secondary: '#CD853F', // Peru
      accent: '#8B4513', // Saddle brown
      decorative: '#4682B4', // Steel blue (tiles)
      gold: '#DAA520'
    },
    RENAISSANCE_EARLY_MODERN: { // Ottoman period
      primary: '#DEB887', // Burlywood
      secondary: '#BC9A6A', // Tan
      accent: '#8B7355', // Dark tan
      decorative: '#4169E1', // Royal blue (Iznik tiles)
      gold: '#FFD700'
    },
    MODERN: {
      primary: '#D2B48C', // Tan
      secondary: '#A0826D', // Light brown
      accent: '#8B7D6B', // Bisque
      decorative: '#6495ED', // Cornflower blue
      gold: '#DAA520'
    }
  };
  
  const colors = colorPalettes[era] || colorPalettes.MEDIEVAL;
  
  // Building type variations
  const buildingTypes = ['mosque', 'madrasa', 'caravanserai', 'palace'];
  const buildingType = buildingTypes[Math.floor(rng.random() * buildingTypes.length)];
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.45}
      ry={size * 0.15}
      fill="rgba(0,0,0,0.3)"
    />
  );
  
  if (buildingType === 'mosque' || buildingType === 'madrasa') {
    // Main prayer hall/courtyard structure
    const hallWidth = size * 0.5;
    const hallHeight = size * 0.25;
    const hallX = x + size * 0.25;
    const hallY = y + size * 0.55;
    
    // Main walls
    elements.push(
      <rect
        key="main-hall"
        x={hallX}
        y={hallY}
        width={hallWidth}
        height={hallHeight}
        fill={colors.primary}
        stroke={colors.accent}
        strokeWidth="0.5"
      />
    );
    
    // Horseshoe arches arcade
    const numArches = preservationLevel > 0.5 ? 3 : 2;
    for (let i = 0; i < numArches; i++) {
      const archX = hallX + (i + 0.5) * (hallWidth / numArches);
      const archY = hallY + hallHeight * 0.7;
      const archWidth = hallWidth / numArches * 0.6;
      const archHeight = hallHeight * 0.5;
      
      const isIntact = rng.random() < preservationLevel + 0.3;
      
      if (isIntact) {
        // Horseshoe arch shape
        elements.push(
          <g key={`arch-${i}`}>
            <path
              d={`M ${archX - archWidth/2} ${archY}
                  C ${archX - archWidth/2} ${archY - archHeight * 0.8},
                    ${archX - archWidth * 0.3} ${archY - archHeight},
                    ${archX} ${archY - archHeight}
                  C ${archX + archWidth * 0.3} ${archY - archHeight},
                    ${archX + archWidth/2} ${archY - archHeight * 0.8},
                    ${archX + archWidth/2} ${archY}
                  C ${archX + archWidth * 0.4} ${archY + archHeight * 0.1},
                    ${archX - archWidth * 0.4} ${archY + archHeight * 0.1},
                    ${archX - archWidth/2} ${archY}`}
              fill="rgba(0,0,0,0.5)"
              stroke={colors.accent}
              strokeWidth="0.4"
            />
            
            {/* Decorative voussoirs (arch stones) */}
            {preservationLevel > 0.6 && (
              <>
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, idx) => (
                  <circle
                    key={`voussoir-${idx}`}
                    cx={archX - archWidth/2 + t * archWidth}
                    cy={archY - archHeight * (0.7 - Math.abs(t - 0.5) * 0.4)}
                    r={size * 0.004}
                    fill={idx % 2 === 0 ? colors.secondary : 'white'}
                    opacity={0.7}
                  />
                ))}
              </>
            )}
          </g>
        );
      } else {
        // Collapsed arch
        elements.push(
          <polygon
            key={`collapsed-arch-${i}`}
            points={`${archX - archWidth/2},${archY} ${archX},${archY - archHeight * 0.3} ${archX + archWidth/2},${archY}`}
            fill={colors.primary}
            stroke={colors.accent}
            strokeWidth="0.3"
            opacity={0.7}
          />
        );
      }
    }
    
    // Minaret
    const minaretX = hallX + hallWidth * (buildingType === 'mosque' ? 0.85 : 0.15);
    const minaretHeight = preservationLevel > 0.4 ? size * (0.35 + preservationLevel * 0.15) : size * 0.2;
    const minaretWidth = size * 0.06;
    const minaretY = y + size * 0.8 - minaretHeight;
    
    // Minaret shaft (may be broken)
    if (preservationLevel > 0.2) {
      // Base
      elements.push(
        <g key="minaret">
          {/* Octagonal/square base */}
          <rect
            x={minaretX - minaretWidth/2}
            y={minaretY}
            width={minaretWidth}
            height={minaretHeight}
            fill={colors.secondary}
            stroke={colors.accent}
            strokeWidth="0.4"
          />
          
          {/* Decorative bands */}
          {preservationLevel > 0.5 && (
            <>
              {[0.3, 0.6].map((offset, idx) => (
                <g key={`band-${idx}`}>
                  <rect
                    x={minaretX - minaretWidth/2}
                    y={minaretY + minaretHeight * offset}
                    width={minaretWidth}
                    height={size * 0.01}
                    fill={colors.decorative}
                    opacity={0.7}
                  />
                  {/* Geometric pattern */}
                  <line
                    x1={minaretX - minaretWidth/2}
                    y1={minaretY + minaretHeight * offset + size * 0.005}
                    x2={minaretX + minaretWidth/2}
                    y2={minaretY + minaretHeight * offset + size * 0.005}
                    stroke={colors.gold}
                    strokeWidth="0.2"
                    strokeDasharray={`${size * 0.005} ${size * 0.005}`}
                  />
                </g>
              ))}
            </>
          )}
          
          {/* Muqarnas (honeycomb) balcony if preserved */}
          {preservationLevel > 0.6 && (
            <g>
              <rect
                x={minaretX - minaretWidth * 0.7}
                y={minaretY - size * 0.02}
                width={minaretWidth * 1.4}
                height={size * 0.015}
                fill={colors.secondary}
                stroke={colors.accent}
                strokeWidth="0.3"
              />
              {/* Muqarnas detail */}
              {[-0.5, -0.25, 0, 0.25, 0.5].map((off, idx) => (
                <circle
                  key={`muqarnas-${idx}`}
                  cx={minaretX + minaretWidth * off}
                  cy={minaretY - size * 0.01}
                  r={size * 0.003}
                  fill={colors.accent}
                  opacity={0.5}
                />
              ))}
            </g>
          )}
          
          {/* Broken top */}
          {preservationLevel < 0.7 && (
            <polygon
              points={`${minaretX - minaretWidth/2},${minaretY} 
                       ${minaretX - minaretWidth * 0.3},${minaretY - size * 0.02}
                       ${minaretX + minaretWidth * 0.4},${minaretY - size * 0.015}
                       ${minaretX + minaretWidth/2},${minaretY}`}
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="0.3"
            />
          )}
        </g>
      );
    }
    
    // Dome (if mosque and preserved)
    if (buildingType === 'mosque' && preservationLevel > 0.4) {
      const domeX = hallX + hallWidth * 0.5;
      const domeY = hallY - size * 0.05;
      const domeRadius = size * 0.08;
      
      const isCollapsed = rng.random() > preservationLevel + 0.2;
      
      if (!isCollapsed) {
        elements.push(
          <g key="dome">
            {/* Drum */}
            <rect
              x={domeX - domeRadius}
              y={domeY}
              width={domeRadius * 2}
              height={size * 0.02}
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="0.3"
            />
            
            {/* Dome */}
            <path
              d={`M ${domeX - domeRadius} ${domeY}
                  Q ${domeX - domeRadius} ${domeY - domeRadius * 0.8},
                    ${domeX} ${domeY - domeRadius}
                  Q ${domeX + domeRadius} ${domeY - domeRadius * 0.8},
                    ${domeX + domeRadius} ${domeY}`}
              fill={colors.decorative}
              stroke={colors.accent}
              strokeWidth="0.4"
              opacity={0.8}
            />
            
            {/* Finial */}
            {preservationLevel > 0.7 && (
              <circle
                cx={domeX}
                cy={domeY - domeRadius}
                r={size * 0.006}
                fill={colors.gold}
              />
            )}
          </g>
        );
      } else {
        // Collapsed dome
        elements.push(
          <ellipse
            key="collapsed-dome"
            cx={domeX}
            cy={domeY + size * 0.02}
            rx={domeRadius * 1.2}
            ry={size * 0.03}
            fill={colors.decorative}
            opacity={0.5}
          />
        );
      }
    }
    
  } else if (buildingType === 'caravanserai') {
    // Courtyard structure with surrounding rooms
    const courtWidth = size * 0.5;
    const courtHeight = size * 0.4;
    const courtX = x + size * 0.25;
    const courtY = y + size * 0.45;
    
    // Outer walls
    elements.push(
      <rect
        key="court-walls"
        x={courtX}
        y={courtY}
        width={courtWidth}
        height={courtHeight}
        fill="none"
        stroke={colors.accent}
        strokeWidth="0.8"
      />
    );
    
    // Inner courtyard
    elements.push(
      <rect
        key="courtyard"
        x={courtX + courtWidth * 0.15}
        y={courtY + courtHeight * 0.15}
        width={courtWidth * 0.7}
        height={courtHeight * 0.7}
        fill="rgba(0,0,0,0.2)"
        stroke={colors.secondary}
        strokeWidth="0.3"
      />
    );
    
    // Room cells around courtyard
    const numCells = preservationLevel > 0.5 ? 8 : 4;
    for (let i = 0; i < numCells; i++) {
      const side = Math.floor(i / 2);
      const pos = i % 2;
      
      let cellX, cellY, cellW, cellH;
      
      if (side === 0) { // Top
        cellX = courtX + courtWidth * (0.2 + pos * 0.3);
        cellY = courtY;
        cellW = courtWidth * 0.2;
        cellH = courtHeight * 0.12;
      } else if (side === 1) { // Bottom
        cellX = courtX + courtWidth * (0.2 + pos * 0.3);
        cellY = courtY + courtHeight * 0.88;
        cellW = courtWidth * 0.2;
        cellH = courtHeight * 0.12;
      } else if (side === 2) { // Left
        cellX = courtX;
        cellY = courtY + courtHeight * (0.2 + pos * 0.3);
        cellW = courtWidth * 0.12;
        cellH = courtHeight * 0.2;
      } else { // Right
        cellX = courtX + courtWidth * 0.88;
        cellY = courtY + courtHeight * (0.2 + pos * 0.3);
        cellW = courtWidth * 0.12;
        cellH = courtHeight * 0.2;
      }
      
      const isIntact = rng.random() < preservationLevel + 0.2;
      
      if (isIntact) {
        elements.push(
          <rect
            key={`cell-${i}`}
            x={cellX}
            y={cellY}
            width={cellW}
            height={cellH}
            fill={colors.primary}
            stroke={colors.accent}
            strokeWidth="0.2"
            opacity={0.8}
          />
        );
      }
    }
    
    // Central fountain base (if preserved)
    if (preservationLevel > 0.4) {
      const fountainX = courtX + courtWidth * 0.5;
      const fountainY = courtY + courtHeight * 0.5;
      
      elements.push(
        <g key="fountain">
          <circle
            cx={fountainX}
            cy={fountainY}
            r={size * 0.03}
            fill="none"
            stroke={colors.decorative}
            strokeWidth="0.4"
          />
          <circle
            cx={fountainX}
            cy={fountainY}
            r={size * 0.015}
            fill="rgba(0,0,0,0.3)"
          />
        </g>
      );
    }
  }
  
  // Decorative tile fragments
  if (preservationLevel > 0.3 && rng.random() < 0.7) {
    const numTiles = 2 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numTiles; i++) {
      const tileX = x + size * (0.2 + rng.random() * 0.6);
      const tileY = y + size * (0.65 + rng.random() * 0.15);
      const tileSize = size * (0.02 + rng.random() * 0.02);
      
      // Geometric Islamic pattern (simplified)
      elements.push(
        <g key={`tile-${i}`} opacity={0.6}>
          <rect
            x={tileX}
            y={tileY}
            width={tileSize}
            height={tileSize}
            fill={colors.decorative}
            stroke={colors.accent}
            strokeWidth="0.1"
          />
          {/* 8-pointed star pattern */}
          <polygon
            points={`${tileX + tileSize * 0.5},${tileY + tileSize * 0.2}
                     ${tileX + tileSize * 0.65},${tileY + tileSize * 0.35}
                     ${tileX + tileSize * 0.8},${tileY + tileSize * 0.5}
                     ${tileX + tileSize * 0.65},${tileY + tileSize * 0.65}
                     ${tileX + tileSize * 0.5},${tileY + tileSize * 0.8}
                     ${tileX + tileSize * 0.35},${tileY + tileSize * 0.65}
                     ${tileX + tileSize * 0.2},${tileY + tileSize * 0.5}
                     ${tileX + tileSize * 0.35},${tileY + tileSize * 0.35}`}
            fill="white"
            opacity={0.5}
          />
        </g>
      );
    }
  }
  
  // Arabic calligraphy remnants (decorative lines suggesting text)
  if (preservationLevel > 0.4 && rng.random() < 0.6) {
    const calligX = x + size * (0.3 + rng.random() * 0.4);
    const calligY = y + size * 0.5;
    
    elements.push(
      <g key="calligraphy" opacity={0.4}>
        <path
          d={`M ${calligX} ${calligY} 
              Q ${calligX + size * 0.02} ${calligY - size * 0.01} ${calligX + size * 0.04} ${calligY}
              M ${calligX + size * 0.05} ${calligY} 
              Q ${calligX + size * 0.07} ${calligY + size * 0.01} ${calligX + size * 0.09} ${calligY}`}
          stroke={colors.accent}
          strokeWidth="0.5"
          fill="none"
        />
      </g>
    );
  }
  
  // Fallen rubble and architectural fragments
  const numRubble = 4 + Math.floor((1 - preservationLevel) * 6);
  for (let i = 0; i < numRubble; i++) {
    const rubbleX = x + size * (0.1 + rng.random() * 0.8);
    const rubbleY = y + size * (0.7 + rng.random() * 0.15);
    
    if (i % 3 === 0) {
      // Arch stone
      const stoneSize = size * (0.025 + rng.random() * 0.02);
      elements.push(
        <path
          key={`arch-stone-${i}`}
          d={`M ${rubbleX} ${rubbleY}
              L ${rubbleX + stoneSize * 0.7} ${rubbleY - stoneSize * 0.3}
              L ${rubbleX + stoneSize} ${rubbleY}
              L ${rubbleX + stoneSize * 0.5} ${rubbleY + stoneSize * 0.2}
              Z`}
          fill={colors.secondary}
          stroke={colors.accent}
          strokeWidth="0.1"
          opacity={0.7}
        />
      );
    } else if (i % 3 === 1) {
      // Tile fragment
      const tileSize = size * (0.015 + rng.random() * 0.015);
      elements.push(
        <rect
          key={`tile-rubble-${i}`}
          x={rubbleX}
          y={rubbleY}
          width={tileSize}
          height={tileSize}
          fill={colors.decorative}
          stroke={colors.accent}
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 360} ${rubbleX + tileSize/2} ${rubbleY + tileSize/2})`}
          opacity={0.6}
        />
      );
    } else {
      // Regular stone
      const stoneSize = size * (0.02 + rng.random() * 0.025);
      elements.push(
        <rect
          key={`stone-${i}`}
          x={rubbleX}
          y={rubbleY}
          width={stoneSize}
          height={stoneSize * 0.7}
          fill={colors.primary}
          stroke={colors.accent}
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 360} ${rubbleX + stoneSize/2} ${rubbleY})`}
          opacity={0.6}
        />
      );
    }
  }
  
  // Desert sand accumulation
  elements.push(
    <ellipse
      key="sand"
      cx={x + size * 0.5}
      cy={y + size * 0.83}
      rx={size * 0.5}
      ry={size * 0.06}
      fill="#F4A460"
      opacity={0.2}
    />
  );
  
  return <g>{elements}</g>;
};

export default React.memo(IslamicRuinsSymbol);