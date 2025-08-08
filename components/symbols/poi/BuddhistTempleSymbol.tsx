import React from 'react';
import { Tile } from '../../../types';

interface BuddhistTempleSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const BuddhistTempleSymbol: React.FC<BuddhistTempleSymbolProps> = ({ x, y, size }) => {
  const baseX = x * size + size / 2;
  const baseY = y * size + size / 2;
  
  // Multi-tiered pagoda design
  const tiers = 5;
  const tierHeight = size * 0.15;
  const baseWidth = size * 0.8;
  
  return (
    <g>
      {/* Foundation */}
      <rect
        x={baseX - baseWidth/2}
        y={baseY + size * 0.3}
        width={baseWidth}
        height={size * 0.1}
        fill="#8B7355"
        stroke="#5C4A3F"
        strokeWidth={0.5}
      />
      
      {/* Pagoda tiers */}
      {Array.from({ length: tiers }).map((_, i) => {
        const width = baseWidth * (1 - i * 0.15);
        const yPos = baseY + size * 0.2 - i * tierHeight;
        
        return (
          <g key={i}>
            {/* Tier body */}
            <rect
              x={baseX - width/2}
              y={yPos}
              width={width}
              height={tierHeight * 0.8}
              fill={i % 2 === 0 ? '#CD5C5C' : '#8B4513'}
              stroke="#654321"
              strokeWidth={0.5}
            />
            
            {/* Roof */}
            <path
              d={`M ${baseX - width * 0.6} ${yPos}
                   L ${baseX} ${yPos - tierHeight * 0.3}
                   L ${baseX + width * 0.6} ${yPos}
                   Z`}
              fill="#2F4F2F"
              stroke="#1C3A1C"
              strokeWidth={0.5}
            />
            
            {/* Roof ornaments */}
            <circle
              cx={baseX - width * 0.6}
              cy={yPos}
              r={1}
              fill="#FFD700"
            />
            <circle
              cx={baseX + width * 0.6}
              cy={yPos}
              r={1}
              fill="#FFD700"
            />
          </g>
        );
      })}
      
      {/* Spire */}
      <line
        x1={baseX}
        y1={baseY - tiers * tierHeight}
        x2={baseX}
        y2={baseY - tiers * tierHeight - size * 0.2}
        stroke="#FFD700"
        strokeWidth={1}
      />
      
      {/* Golden top ornament */}
      <circle
        cx={baseX}
        cy={baseY - tiers * tierHeight - size * 0.2}
        r={2}
        fill="#FFD700"
      />
      
      {/* Entrance */}
      <rect
        x={baseX - size * 0.08}
        y={baseY + size * 0.2}
        width={size * 0.16}
        height={size * 0.2}
        fill="#1C1C1C"
      />
      
      {/* Bell (common in Buddhist temples) */}
      <ellipse
        cx={baseX + size * 0.3}
        cy={baseY + size * 0.1}
        rx={size * 0.05}
        ry={size * 0.08}
        fill="#CD7F32"
        stroke="#8B5A2B"
        strokeWidth={0.5}
      />
    </g>
  );
};

export default React.memo(BuddhistTempleSymbol);