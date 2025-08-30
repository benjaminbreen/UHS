/**
 * TorchSymbol.tsx - Wall-mounted torches
 * Stardew Valley style with flame animation potential
 */

import React from 'react';

interface TorchSymbolProps {
  x: number;
  y: number;
  size: number;
  lit?: boolean;
}

export const TorchSymbol: React.FC<TorchSymbolProps> = ({ 
  x, 
  y, 
  size,
  lit = true
}) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Wall mount bracket */}
      <rect
        x={size * 0.4}
        y={size * 0.5}
        width={size * 0.2}
        height={size * 0.05}
        fill="#4A3F2A"
      />
      
      {/* Torch handle */}
      <rect
        x={size * 0.45}
        y={size * 0.35}
        width={size * 0.1}
        height={size * 0.3}
        fill="#6B4A31"
      />
      
      {/* Wrapped cloth/pitch */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.32}
        rx={size * 0.08}
        ry={size * 0.06}
        fill="#2A2416"
      />
      
      {lit && (
        <>
          {/* Flame glow */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.25}
            rx={size * 0.15}
            ry={size * 0.12}
            fill="#FF6B35"
            opacity={0.4}
          />
          
          {/* Flame core */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.26}
            rx={size * 0.06}
            ry={size * 0.1}
            fill="#FFD700"
          />
          
          {/* Flame tip */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.22}
            rx={size * 0.03}
            ry={size * 0.06}
            fill="#FFF8DC"
          />
        </>
      )}
      
      {/* Shadow */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.55}
        rx={size * 0.1}
        ry={size * 0.03}
        fill="#000000"
        opacity={0.2}
      />
    </g>
  );
};