/**
 * BrazierSymbol.tsx - Standing fire braziers
 * Stardew Valley style with metal bowl and fire
 */

import React from 'react';

interface BrazierSymbolProps {
  x: number;
  y: number;
  size: number;
  lit?: boolean;
}

export const BrazierSymbol: React.FC<BrazierSymbolProps> = ({ 
  x, 
  y, 
  size,
  lit = true
}) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.85}
        rx={size * 0.25}
        ry={size * 0.08}
        fill="#000000"
        opacity={0.3}
      />
      
      {/* Tripod legs */}
      <line
        x1={size * 0.35}
        y1={size * 0.8}
        x2={size * 0.45}
        y2={size * 0.55}
        stroke="#3A3A3A"
        strokeWidth={2}
      />
      <line
        x1={size * 0.65}
        y1={size * 0.8}
        x2={size * 0.55}
        y2={size * 0.55}
        stroke="#3A3A3A"
        strokeWidth={2}
      />
      <line
        x1={size * 0.5}
        y1={size * 0.82}
        x2={size * 0.5}
        y2={size * 0.55}
        stroke="#3A3A3A"
        strokeWidth={2}
      />
      
      {/* Metal bowl */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.5}
        rx={size * 0.22}
        ry={size * 0.12}
        fill="#4A4A4A"
      />
      
      {/* Bowl rim highlight */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.48}
        rx={size * 0.2}
        ry={size * 0.1}
        fill="none"
        stroke="#6A6A6A"
        strokeWidth={1}
      />
      
      {/* Inner bowl */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.48}
        rx={size * 0.18}
        ry={size * 0.08}
        fill="#2A2A2A"
      />
      
      {lit && (
        <>
          {/* Coals */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.48}
            rx={size * 0.15}
            ry={size * 0.06}
            fill="#8B2500"
          />
          
          {/* Fire glow */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.35}
            rx={size * 0.2}
            ry={size * 0.15}
            fill="#FF4500"
            opacity={0.5}
          />
          
          {/* Fire */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.38}
            rx={size * 0.12}
            ry={size * 0.18}
            fill="#FF6B35"
          />
          
          {/* Fire core */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.4}
            rx={size * 0.06}
            ry={size * 0.12}
            fill="#FFD700"
          />
          
          {/* Fire tip */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.32}
            rx={size * 0.03}
            ry={size * 0.08}
            fill="#FFFACD"
          />
        </>
      )}
    </g>
  );
};