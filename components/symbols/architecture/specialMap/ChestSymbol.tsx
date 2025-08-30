/**
 * ChestSymbol.tsx - Storage chests
 * Stardew Valley style with dollhouse perspective
 */

import React from 'react';

interface ChestSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: 'wood' | 'iron' | 'gold';
  open?: boolean;
}

export const ChestSymbol: React.FC<ChestSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'wood',
  open = false
}) => {
  const colors = {
    wood: {
      main: '#8B6341',
      dark: '#6B4A31',
      light: '#AB7A51',
      metal: '#4A4A4A'
    },
    iron: {
      main: '#5A5A5A',
      dark: '#3A3A3A',
      light: '#7A7A7A',
      metal: '#8A8A8A'
    },
    gold: {
      main: '#8B6341',
      dark: '#6B4A31',
      light: '#AB7A51',
      metal: '#D4AF37'
    }
  };
  
  const palette = colors[variant];
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <rect
        x={size * 0.15}
        y={size * 0.75}
        width={size * 0.7}
        height={size * 0.1}
        fill="#000000"
        opacity={0.3}
      />
      
      {/* Chest base (front face) */}
      <rect
        x={size * 0.1}
        y={size * 0.5}
        width={size * 0.8}
        height={size * 0.25}
        fill={palette.dark}
      />
      
      {/* Chest base (top surface) */}
      <rect
        x={size * 0.1}
        y={size * 0.45}
        width={size * 0.8}
        height={size * 0.05}
        fill={palette.main}
      />
      
      {open ? (
        <>
          {/* Open lid (angled back) */}
          <path
            d={`M ${size * 0.1} ${size * 0.45}
                L ${size * 0.15} ${size * 0.25}
                L ${size * 0.85} ${size * 0.25}
                L ${size * 0.9} ${size * 0.45}
                Z`}
            fill={palette.main}
          />
          
          {/* Inside darkness */}
          <rect
            x={size * 0.15}
            y={size * 0.47}
            width={size * 0.7}
            height={size * 0.2}
            fill="#1A1A1A"
          />
          
          {/* Gold coins visible inside */}
          {variant === 'gold' && (
            <>
              <ellipse cx={size * 0.3} cy={size * 0.55} rx={size * 0.04} ry={size * 0.03} fill="#FFD700" />
              <ellipse cx={size * 0.5} cy={size * 0.58} rx={size * 0.04} ry={size * 0.03} fill="#FFD700" />
              <ellipse cx={size * 0.7} cy={size * 0.56} rx={size * 0.04} ry={size * 0.03} fill="#FFD700" />
            </>
          )}
        </>
      ) : (
        <>
          {/* Closed lid (front face) */}
          <rect
            x={size * 0.1}
            y={size * 0.3}
            width={size * 0.8}
            height={size * 0.15}
            fill={palette.dark}
          />
          
          {/* Closed lid (top surface) */}
          <path
            d={`M ${size * 0.1} ${size * 0.3}
                L ${size * 0.15} ${size * 0.25}
                L ${size * 0.85} ${size * 0.25}
                L ${size * 0.9} ${size * 0.3}
                Z`}
            fill={palette.main}
          />
          
          {/* Lid highlight */}
          <rect
            x={size * 0.15}
            y={size * 0.27}
            width={size * 0.7}
            height={size * 0.01}
            fill={palette.light}
          />
        </>
      )}
      
      {/* Metal lock/clasp */}
      <rect
        x={size * 0.45}
        y={size * 0.42}
        width={size * 0.1}
        height={size * 0.12}
        fill={palette.metal}
      />
      
      {/* Lock keyhole */}
      <circle
        cx={size * 0.5}
        cy={size * 0.48}
        r={size * 0.02}
        fill="#1A1A1A"
      />
      
      {/* Metal corner reinforcements */}
      <rect x={size * 0.1} y={size * 0.5} width={size * 0.05} height={size * 0.05} fill={palette.metal} />
      <rect x={size * 0.85} y={size * 0.5} width={size * 0.05} height={size * 0.05} fill={palette.metal} />
      <rect x={size * 0.1} y={size * 0.7} width={size * 0.05} height={size * 0.05} fill={palette.metal} />
      <rect x={size * 0.85} y={size * 0.7} width={size * 0.05} height={size * 0.05} fill={palette.metal} />
    </g>
  );
};