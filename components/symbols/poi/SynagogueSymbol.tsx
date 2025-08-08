import React from 'react';
import { Tile } from '../../../types';

interface SynagogueSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const SynagogueSymbol: React.FC<SynagogueSymbolProps> = ({ x, y, size }) => {
  const baseX = x * size + size / 2;
  const baseY = y * size + size / 2;
  
  return (
    <g>
      {/* Main building */}
      <rect
        x={baseX - size * 0.35}
        y={baseY - size * 0.1}
        width={size * 0.7}
        height={size * 0.4}
        fill="#DEB887"
        stroke="#8B7355"
        strokeWidth={0.5}
      />
      
      {/* Dome */}
      <ellipse
        cx={baseX}
        cy={baseY - size * 0.1}
        rx={size * 0.25}
        ry={size * 0.2}
        fill="#4682B4"
        stroke="#36648B"
        strokeWidth={0.5}
      />
      
      {/* Star of David on dome */}
      <g transform={`translate(${baseX}, ${baseY - size * 0.15})`}>
        <path
          d={`M 0,${-size * 0.08} 
              L ${size * 0.07},${size * 0.04} 
              L ${-size * 0.07},${size * 0.04} Z
              M 0,${size * 0.08} 
              L ${size * 0.07},${-size * 0.04} 
              L ${-size * 0.07},${-size * 0.04} Z`}
          fill="none"
          stroke="#FFD700"
          strokeWidth={1}
        />
      </g>
      
      {/* Arched windows */}
      {[-0.2, 0, 0.2].map((offset, i) => (
        <g key={i}>
          <ellipse
            cx={baseX + offset * size}
            cy={baseY + size * 0.05}
            rx={size * 0.05}
            ry={size * 0.08}
            fill="#4682B4"
            stroke="#36648B"
            strokeWidth={0.5}
          />
          <rect
            x={baseX + offset * size - size * 0.05}
            y={baseY + size * 0.05}
            width={size * 0.1}
            height={size * 0.1}
            fill="#4682B4"
          />
        </g>
      ))}
      
      {/* Entrance with columns */}
      <rect
        x={baseX - size * 0.08}
        y={baseY + size * 0.15}
        width={size * 0.16}
        height={size * 0.15}
        fill="#2F2F2F"
      />
      
      {/* Columns */}
      <rect
        x={baseX - size * 0.12}
        y={baseY + size * 0.05}
        width={size * 0.02}
        height={size * 0.25}
        fill="#D2B48C"
      />
      <rect
        x={baseX + size * 0.1}
        y={baseY + size * 0.05}
        width={size * 0.02}
        height={size * 0.25}
        fill="#D2B48C"
      />
      
      {/* Tablets of the Law above entrance */}
      <g transform={`translate(${baseX}, ${baseY})`}>
        <rect
          x={-size * 0.04}
          y={-size * 0.02}
          width={size * 0.035}
          height={size * 0.05}
          rx={size * 0.01}
          fill="#8B7355"
          stroke="#654321"
          strokeWidth={0.3}
        />
        <rect
          x={size * 0.005}
          y={-size * 0.02}
          width={size * 0.035}
          height={size * 0.05}
          rx={size * 0.01}
          fill="#8B7355"
          stroke="#654321"
          strokeWidth={0.3}
        />
      </g>
      
      {/* Menorah symbol (simplified) */}
      <g transform={`translate(${baseX}, ${baseY + size * 0.08})`}>
        <path
          d={`M ${-size * 0.06},0 L ${-size * 0.06},${-size * 0.03}
              M ${-size * 0.04},0 L ${-size * 0.04},${-size * 0.03}
              M ${-size * 0.02},0 L ${-size * 0.02},${-size * 0.03}
              M 0,0 L 0,${-size * 0.04}
              M ${size * 0.02},0 L ${size * 0.02},${-size * 0.03}
              M ${size * 0.04},0 L ${size * 0.04},${-size * 0.03}
              M ${size * 0.06},0 L ${size * 0.06},${-size * 0.03}`}
          stroke="#FFD700"
          strokeWidth={0.8}
          fill="none"
        />
      </g>
      
      {/* Foundation */}
      <rect
        x={baseX - size * 0.4}
        y={baseY + size * 0.3}
        width={size * 0.8}
        height={size * 0.05}
        fill="#A0826D"
        stroke="#8B7355"
        strokeWidth={0.5}
      />
    </g>
  );
};

export default React.memo(SynagogueSymbol);