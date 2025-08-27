/**
 * components/symbols/ruins/ClassicalRuinsSymbol.tsx
 * Renders classical ruins (Greek/Roman style) with columns, arches, and mosaics
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';
import { getRuinArchitecture } from '../../../services/ruinArchitectureService';

interface ClassicalRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
}

const ClassicalRuinsSymbol: React.FC<ClassicalRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel 
}) => {
  const rng = new ValueNoise(seed + tile.x * 13 + tile.y * 17);
  const elements: JSX.Element[] = [];
  
  // Material colors
  const marbleColor = preservationLevel > 0.5 ? '#F5F5DC' : '#D4C5B9';
  const shadowColor = 'rgba(0,0,0,0.3)';
  const accentColor = '#8B7355';
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.8}
      rx={size * 0.45}
      ry={size * 0.15}
      fill={shadowColor}
      opacity={0.5}
    />
  );
  
  // Generate columns based on preservation
  const numColumns = preservationLevel > 0.7 ? 4 + Math.floor(rng.random() * 2) :
                     preservationLevel > 0.4 ? 2 + Math.floor(rng.random() * 2) :
                     1 + Math.floor(rng.random() * 2);
  
  for (let i = 0; i < numColumns; i++) {
    const colX = x + size * (0.15 + (i * 0.7) / Math.max(1, numColumns - 1));
    const intact = rng.random() > (1 - preservationLevel);
    const colHeight = intact ? 
      size * (0.5 + preservationLevel * 0.2) : 
      size * (0.15 + rng.random() * 0.25);
    const colY = y + size * 0.8 - colHeight;
    const colWidth = size * 0.06;
    
    // Column shaft with fluting
    elements.push(
      <g key={`column-${i}`}>
        {/* Base */}
        <rect 
          x={colX - colWidth * 0.1} 
          y={y + size * 0.78} 
          width={colWidth * 1.2} 
          height={size * 0.02}
          fill={accentColor}
        />
        
        {/* Shaft */}
        <rect 
          x={colX} 
          y={colY} 
          width={colWidth} 
          height={colHeight}
          fill={marbleColor}
          stroke={accentColor}
          strokeWidth="0.3"
        />
        
        {/* Fluting lines */}
        {[0.2, 0.4, 0.6, 0.8].map((offset, idx) => (
          <line
            key={`flute-${idx}`}
            x1={colX + colWidth * offset}
            y1={colY}
            x2={colX + colWidth * offset}
            y2={colY + colHeight}
            stroke={accentColor}
            strokeWidth="0.2"
            opacity={0.3}
          />
        ))}
        
        {/* Capital (if intact) */}
        {intact && (
          <>
            <rect 
              x={colX - colWidth * 0.2} 
              y={colY - size * 0.03} 
              width={colWidth * 1.4} 
              height={size * 0.03}
              fill={marbleColor}
              stroke={accentColor}
              strokeWidth="0.3"
            />
            {/* Ionic volutes */}
            <circle cx={colX - colWidth * 0.1} cy={colY - size * 0.015} r={colWidth * 0.15} 
              fill="none" stroke={accentColor} strokeWidth="0.2" />
            <circle cx={colX + colWidth * 1.1} cy={colY - size * 0.015} r={colWidth * 0.15} 
              fill="none" stroke={accentColor} strokeWidth="0.2" />
          </>
        )}
      </g>
    );
  }
  
  // Broken architrave/entablature if preservation is high enough
  if (preservationLevel > 0.5 && numColumns > 2) {
    const archY = y + size * 0.25;
    const archWidth = size * 0.7;
    const archX = x + size * 0.15;
    
    elements.push(
      <g key="entablature">
        <rect 
          x={archX} 
          y={archY} 
          width={archWidth * (0.4 + preservationLevel * 0.6)} 
          height={size * 0.04}
          fill={marbleColor}
          stroke={accentColor}
          strokeWidth="0.4"
        />
        {/* Triglyph pattern */}
        {[0.1, 0.3, 0.5, 0.7].map((offset, idx) => (
          <rect
            key={`triglyph-${idx}`}
            x={archX + archWidth * offset}
            y={archY}
            width={size * 0.02}
            height={size * 0.04}
            fill={accentColor}
            opacity={0.4}
          />
        ))}
      </g>
    );
  }
  
  // Mosaic floor fragments
  if (rng.random() < 0.6) {
    const mosaicX = x + size * (0.2 + rng.random() * 0.5);
    const mosaicY = y + size * 0.75;
    const mosaicSize = size * (0.1 + rng.random() * 0.15);
    
    elements.push(
      <g key="mosaic" opacity={0.6}>
        <rect 
          x={mosaicX} 
          y={mosaicY} 
          width={mosaicSize} 
          height={mosaicSize * 0.6}
          fill="#CD853F"
          stroke={accentColor}
          strokeWidth="0.2"
        />
        {/* Tessellation pattern */}
        {[0, 0.33, 0.66].map((xOff) => 
          [0, 0.5].map((yOff) => (
            <rect
              key={`tile-${xOff}-${yOff}`}
              x={mosaicX + mosaicSize * xOff}
              y={mosaicY + mosaicSize * 0.6 * yOff}
              width={mosaicSize * 0.3}
              height={mosaicSize * 0.25}
              fill={yOff === 0 ? '#8B4513' : '#D2691E'}
              stroke="#6B4423"
              strokeWidth="0.1"
            />
          ))
        )}
      </g>
    );
  }
  
  // Rubble and fallen stones
  const numRubble = 3 + Math.floor(rng.random() * 4);
  for (let i = 0; i < numRubble; i++) {
    const rubbleSize = size * (0.03 + rng.random() * 0.06);
    const rubbleX = x + rng.random() * (size - rubbleSize);
    const rubbleY = y + size * (0.65 + rng.random() * 0.15);
    const rotation = rng.random() * 360;
    
    elements.push(
      <rect
        key={`rubble-${i}`}
        x={rubbleX}
        y={rubbleY}
        width={rubbleSize}
        height={rubbleSize * (0.6 + rng.random() * 0.4)}
        fill={i % 2 === 0 ? marbleColor : accentColor}
        stroke="#696969"
        strokeWidth="0.1"
        transform={`rotate(${rotation} ${rubbleX + rubbleSize/2} ${rubbleY + rubbleSize/2})`}
        opacity={0.7 + rng.random() * 0.3}
      />
    );
  }
  
  // Vegetation overgrowth
  if (preservationLevel < 0.7) {
    const numVines = 2 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numVines; i++) {
      const vineX = x + size * (0.1 + rng.random() * 0.8);
      const vineY = y + size * (0.2 + rng.random() * 0.4);
      
      elements.push(
        <path
          key={`vine-${i}`}
          d={`M ${vineX} ${vineY} Q ${vineX + size * 0.1} ${vineY + size * 0.15} ${vineX + size * 0.05} ${vineY + size * 0.3}`}
          stroke="#4A5D23"
          strokeWidth="1"
          fill="none"
          opacity={0.5}
        />
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(ClassicalRuinsSymbol);