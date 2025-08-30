/**
 * BarrelSymbol.tsx - Storage barrels
 * Stardew Valley style with wood grain and metal bands
 */

import React from 'react';

interface BarrelSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: 'wine' | 'ale' | 'water' | 'oil';
}

export const BarrelSymbol: React.FC<BarrelSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'ale'
}) => {
  const colors = {
    wine: '#6B2C3A',    // Wine red stain
    ale: '#8B6341',     // Standard wood
    water: '#7A8B9A',   // Slightly blue-gray
    oil: '#5A4A3A'      // Dark stained
  };
  
  const woodColor = colors[variant];
  const darkWood = variant === 'wine' ? '#4B1C2A' : '#6B4A31';
  const lightWood = variant === 'wine' ? '#8B3C4A' : '#AB7A51';
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.85}
        rx={size * 0.22}
        ry={size * 0.06}
        fill="#000000"
        opacity={0.3}
      />
      
      {/* Barrel body (main cylinder) */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.7}
        rx={size * 0.25}
        ry={size * 0.15}
        fill={darkWood}
      />
      
      <rect
        x={size * 0.25}
        y={size * 0.35}
        width={size * 0.5}
        height={size * 0.35}
        fill={woodColor}
      />
      
      {/* Barrel bulge (middle wider part) */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.52}
        rx={size * 0.28}
        ry={size * 0.05}
        fill={woodColor}
      />
      
      {/* Top surface */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.35}
        rx={size * 0.25}
        ry={size * 0.15}
        fill={lightWood}
      />
      
      {/* Top surface inner ring */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.35}
        rx={size * 0.22}
        ry={size * 0.13}
        fill="none"
        stroke={woodColor}
        strokeWidth={1}
      />
      
      {/* Cork/bung in center */}
      <circle
        cx={size * 0.5}
        cy={size * 0.35}
        r={size * 0.04}
        fill="#4A3F2A"
      />
      
      {/* Vertical wood slats */}
      <line x1={size * 0.35} y1={size * 0.38} x2={size * 0.35} y2={size * 0.67} stroke={darkWood} strokeWidth={0.5} />
      <line x1={size * 0.45} y1={size * 0.36} x2={size * 0.45} y2={size * 0.69} stroke={darkWood} strokeWidth={0.5} />
      <line x1={size * 0.55} y1={size * 0.36} x2={size * 0.55} y2={size * 0.69} stroke={darkWood} strokeWidth={0.5} />
      <line x1={size * 0.65} y1={size * 0.38} x2={size * 0.65} y2={size * 0.67} stroke={darkWood} strokeWidth={0.5} />
      
      {/* Metal bands */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.42}
        rx={size * 0.26}
        ry={size * 0.03}
        fill="#4A4A4A"
      />
      
      <ellipse
        cx={size * 0.5}
        cy={size * 0.62}
        rx={size * 0.27}
        ry={size * 0.03}
        fill="#4A4A4A"
      />
      
      {/* Metal band highlights */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.41}
        rx={size * 0.24}
        ry={size * 0.015}
        fill="#6A6A6A"
      />
      
      <ellipse
        cx={size * 0.5}
        cy={size * 0.61}
        rx={size * 0.25}
        ry={size * 0.015}
        fill="#6A6A6A"
      />
      
      {/* Optional label/marking */}
      {variant === 'wine' && (
        <text
          x={size * 0.5}
          y={size * 0.52}
          fontSize={size * 0.08}
          fill="#D4AF37"
          textAnchor="middle"
          fontFamily="serif"
        >
          W
        </text>
      )}
      {variant === 'oil' && (
        <text
          x={size * 0.5}
          y={size * 0.52}
          fontSize={size * 0.08}
          fill="#FFD700"
          textAnchor="middle"
          fontFamily="serif"
        >
          O
        </text>
      )}
    </g>
  );
};