/**
 * components/symbols/structures/LumberCampSymbol.tsx - A generic lumber camp symbol
 */
import React from 'react';

interface LumberCampSymbolProps {
  x: number;
  y: number;
  size: number;
  seed?: number;
}

const LumberCampSymbol: React.FC<LumberCampSymbolProps> = ({ x, y, size, seed = 0 }) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  // Simple deterministic variations
  const variation = seed % 3;
  
  return (
    <g>
      {/* Shadow */}
      <ellipse 
        cx={centerX} 
        cy={centerY + size * 0.45} 
        rx={size * 0.35} 
        ry={size * 0.08}
        fill="rgba(0,0,0,0.2)"
      />
      
      {/* Log pile base */}
      <rect
        x={centerX - size * 0.35}
        y={centerY + size * 0.15}
        width={size * 0.7}
        height={size * 0.25}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth={1}
      />
      
      {/* Stacked logs */}
      {[0, 1, 2].map((row) => (
        <g key={row}>
          {[0, 1, 2 - row].map((col) => (
            <circle
              key={`${row}-${col}`}
              cx={centerX - size * 0.2 + col * size * 0.2}
              cy={centerY + size * 0.1 - row * size * 0.08}
              r={size * 0.08}
              fill="#A0522D"
              stroke="#654321"
              strokeWidth={0.5}
            />
          ))}
        </g>
      ))}
      
      {/* Axe stuck in stump */}
      <g transform={`translate(${centerX + size * 0.2}, ${centerY - size * 0.1})`}>
        {/* Stump */}
        <ellipse
          cx={0}
          cy={size * 0.25}
          rx={size * 0.12}
          ry={size * 0.08}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth={0.5}
        />
        
        {/* Axe handle */}
        <rect
          x={-size * 0.02}
          y={-size * 0.15}
          width={size * 0.04}
          height={size * 0.35}
          fill="#654321"
          transform="rotate(-15)"
        />
        
        {/* Axe blade */}
        <path
          d={`M${-size * 0.08} ${-size * 0.12} 
              L${size * 0.08} ${-size * 0.12} 
              L${size * 0.06} ${-size * 0.05} 
              L${-size * 0.06} ${-size * 0.05} Z`}
          fill="#708090"
          stroke="#2F4F4F"
          strokeWidth={0.5}
        />
      </g>
      
      {/* Sawbuck (log holder) if variation allows */}
      {variation === 1 && (
        <g transform={`translate(${centerX - size * 0.25}, ${centerY})`}>
          <line
            x1={0}
            y1={size * 0.2}
            x2={size * 0.1}
            y2={0}
            stroke="#654321"
            strokeWidth={2}
          />
          <line
            x1={size * 0.1}
            y1={size * 0.2}
            x2={0}
            y2={0}
            stroke="#654321"
            strokeWidth={2}
          />
        </g>
      )}
      
      {/* Small roof/shelter */}
      {variation === 2 && (
        <g>
          {/* Roof */}
          <path
            d={`M${centerX - size * 0.4} ${centerY - size * 0.15}
                L${centerX} ${centerY - size * 0.35}
                L${centerX + size * 0.4} ${centerY - size * 0.15}`}
            fill="none"
            stroke="#8B4513"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Support posts */}
          <line
            x1={centerX - size * 0.35}
            y1={centerY - size * 0.15}
            x2={centerX - size * 0.35}
            y2={centerY + size * 0.25}
            stroke="#654321"
            strokeWidth={2}
          />
          <line
            x1={centerX + size * 0.35}
            y1={centerY - size * 0.15}
            x2={centerX + size * 0.35}
            y2={centerY + size * 0.25}
            stroke="#654321"
            strokeWidth={2}
          />
        </g>
      )}
      
      {/* Wood chips/sawdust around base */}
      {[...Array(5)].map((_, i) => (
        <circle
          key={`chip-${i}`}
          cx={centerX + (Math.sin(i * 1.2 + seed) * size * 0.3)}
          cy={centerY + size * 0.35 + (Math.cos(i * 0.8) * size * 0.05)}
          r={size * 0.015}
          fill="#D2691E"
          opacity={0.6}
        />
      ))}
    </g>
  );
};

export default LumberCampSymbol;