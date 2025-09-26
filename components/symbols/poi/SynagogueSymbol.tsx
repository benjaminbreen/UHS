import React from 'react';
import { Tile } from '../../../types';

interface SynagogueSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const SynagogueSymbol: React.FC<SynagogueSymbolProps> = ({ x, y, size, seed, tile }) => {
  const baseX = x * size + size / 2;
  const baseY = y * size + size / 2;
  const uniqueId = `synagogue-${tile?.x || 0}-${tile?.y || 0}`;

  return (
    <g>
      <defs>
        <linearGradient id={`star-grad-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#DAA520" />
        </linearGradient>
        <linearGradient id={`dome-grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A92D1" />
          <stop offset="100%" stopColor="#36648B" />
        </linearGradient>
      </defs>
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
      
      {/* Dome with gradient */}
      <ellipse
        cx={baseX}
        cy={baseY - size * 0.1}
        rx={size * 0.25}
        ry={size * 0.2}
        fill={`url(#dome-grad-${uniqueId})`}
        stroke="#36648B"
        strokeWidth={0.5}
      />
      
      {/* Star of David with 3D effect */}
      <g transform={`translate(${baseX}, ${baseY - size * 0.15})`}>
        {/* Shadow/depth layer */}
        <path
          d={`M 0,${-size * 0.08}
              L ${size * 0.07},${size * 0.04}
              L ${-size * 0.07},${size * 0.04} Z
              M 0,${size * 0.08}
              L ${size * 0.07},${-size * 0.04}
              L ${-size * 0.07},${-size * 0.04} Z`}
          fill="rgba(0,0,0,0.2)"
          transform="translate(1,1)"
        />
        {/* Main star with gradient */}
        <path
          d={`M 0,${-size * 0.08}
              L ${size * 0.07},${size * 0.04}
              L ${-size * 0.07},${size * 0.04} Z`}
          fill={`url(#star-grad-${uniqueId})`}
          stroke="#DAA520"
          strokeWidth={0.8}
          opacity="0.9"
        />
        <path
          d={`M 0,${size * 0.08}
              L ${size * 0.07},${-size * 0.04}
              L ${-size * 0.07},${-size * 0.04} Z`}
          fill={`url(#star-grad-${uniqueId})`}
          stroke="#DAA520"
          strokeWidth={0.8}
          opacity="0.9"
        />
        {/* Highlight on top triangle */}
        <path
          d={`M 0,${-size * 0.08}
              L ${size * 0.03},${-size * 0.02}
              L ${-size * 0.03},${-size * 0.02} Z`}
          fill="#FFFF00"
          opacity="0.4"
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