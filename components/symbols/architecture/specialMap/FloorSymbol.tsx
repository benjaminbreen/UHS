/**
 * FloorSymbol.tsx - Floor tiles
 * Stardew Valley style with default wood pattern
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface FloorSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone;
  era?: HistoricalEra;
  material?: 'wood' | 'stone' | 'marble' | 'tile' | 'carpet';
  seed?: number;
}

export const FloorSymbol: React.FC<FloorSymbolProps> = ({ 
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = HistoricalEra.MEDIEVAL,
  material = 'wood',
  seed = 0
}) => {
  // Default to wood for most cases
  if (material === 'wood') {
    // Stardew Valley style wood floor with planks
    const plankWidth = size / 4;
    const woodBase = '#8B6341';
    const woodDark = '#6B4A31';
    const woodLight = '#AB7A51';
    
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Base wood color */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={woodBase}
        />
        
        {/* Vertical wood planks */}
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            {/* Plank */}
            <rect
              x={i * plankWidth}
              y={0}
              width={plankWidth}
              height={size}
              fill={i % 2 === 0 ? woodBase : woodDark}
            />
            
            {/* Plank edge highlight */}
            <rect
              x={i * plankWidth}
              y={0}
              width={1}
              height={size}
              fill={woodLight}
              opacity={0.3}
            />
            
            {/* Plank edge shadow */}
            <rect
              x={(i * plankWidth) + plankWidth - 1}
              y={0}
              width={1}
              height={size}
              fill={woodDark}
              opacity={0.5}
            />
          </g>
        ))}
        
        {/* Wood grain lines */}
        <line
          x1={size * 0.1}
          y1={size * 0.3}
          x2={size * 0.15}
          y2={size * 0.7}
          stroke={woodDark}
          strokeWidth={0.5}
          opacity={0.3}
        />
        <line
          x1={size * 0.6}
          y1={size * 0.2}
          x2={size * 0.65}
          y2={size * 0.8}
          stroke={woodDark}
          strokeWidth={0.5}
          opacity={0.3}
        />
        
        {/* Random knot based on seed */}
        {seed % 7 === 0 && (
          <ellipse
            cx={size * 0.7}
            cy={size * 0.6}
            rx={size * 0.04}
            ry={size * 0.03}
            fill={woodDark}
            opacity={0.6}
          />
        )}
      </g>
    );
  } else if (material === 'stone') {
    // Stone floor with subtle texture
    const stoneBase = '#8A8A8A';
    const stoneDark = '#6A6A6A';
    const stoneLight = '#AAAAAA';
    
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={stoneBase}
        />
        
        {/* Stone texture */}
        <rect
          x={size * 0.1}
          y={size * 0.1}
          width={size * 0.3}
          height={size * 0.3}
          fill={stoneDark}
          opacity={0.2}
        />
        <rect
          x={size * 0.6}
          y={size * 0.5}
          width={size * 0.3}
          height={size * 0.4}
          fill={stoneLight}
          opacity={0.2}
        />
        
        {/* Grout lines */}
        <line
          x1={0}
          y1={size * 0.5}
          x2={size}
          y2={size * 0.5}
          stroke={stoneDark}
          strokeWidth={0.5}
          opacity={0.3}
        />
        <line
          x1={size * 0.5}
          y1={0}
          x2={size * 0.5}
          y2={size}
          stroke={stoneDark}
          strokeWidth={0.5}
          opacity={0.3}
        />
      </g>
    );
  } else if (material === 'marble') {
    // Marble with veining
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill="#E8E0D8"
        />
        
        {/* Marble veining */}
        <path
          d={`M ${size * 0.1} ${size * 0.2} Q ${size * 0.5} ${size * 0.4} ${size * 0.9} ${size * 0.3}`}
          stroke="#C8BFB8"
          strokeWidth={1}
          fill="none"
          opacity={0.5}
        />
        <path
          d={`M ${size * 0.2} ${size * 0.8} Q ${size * 0.6} ${size * 0.6} ${size * 0.8} ${size * 0.9}`}
          stroke="#C8BFB8"
          strokeWidth={0.5}
          fill="none"
          opacity={0.3}
        />
        
        {/* Highlight */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size * 0.02}
          fill="#F8F0E8"
          opacity={0.5}
        />
      </g>
    );
  } else if (material === 'tile') {
    // Decorative tile
    const tileColor = culturalZone === 'MENA' ? '#2B4C8C' : '#8B4513';
    const accentColor = culturalZone === 'MENA' ? '#D4AF37' : '#D2691E';
    
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={tileColor}
        />
        
        {/* Tile pattern */}
        <rect
          x={size * 0.1}
          y={size * 0.1}
          width={size * 0.8}
          height={size * 0.8}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
        />
        
        {/* Center decoration */}
        <circle
          cx={size * 0.5}
          cy={size * 0.5}
          r={size * 0.15}
          fill={accentColor}
        />
        <circle
          cx={size * 0.5}
          cy={size * 0.5}
          r={size * 0.08}
          fill={tileColor}
        />
      </g>
    );
  }
  
  // Default fallback
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="#8B6341"
      />
    </g>
  );
};