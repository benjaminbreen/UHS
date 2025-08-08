import React from 'react';
import { Tile } from '../../../types';

interface ShintoShrineSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const ShintoShrineSymbol: React.FC<ShintoShrineSymbolProps> = ({ x, y, size }) => {
  const baseX = x * size + size / 2;
  const baseY = y * size + size / 2;
  
  return (
    <g>
      {/* Torii gate */}
      <g>
        {/* Horizontal beams */}
        <rect
          x={baseX - size * 0.45}
          y={baseY - size * 0.3}
          width={size * 0.9}
          height={size * 0.04}
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth={0.5}
        />
        <rect
          x={baseX - size * 0.4}
          y={baseY - size * 0.2}
          width={size * 0.8}
          height={size * 0.03}
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth={0.5}
        />
        
        {/* Vertical pillars */}
        <rect
          x={baseX - size * 0.35}
          y={baseY - size * 0.2}
          width={size * 0.05}
          height={size * 0.5}
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth={0.5}
        />
        <rect
          x={baseX + size * 0.3}
          y={baseY - size * 0.2}
          width={size * 0.05}
          height={size * 0.5}
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth={0.5}
        />
      </g>
      
      {/* Main shrine building (honden) */}
      <g>
        {/* Building base */}
        <rect
          x={baseX - size * 0.2}
          y={baseY}
          width={size * 0.4}
          height={size * 0.25}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth={0.5}
        />
        
        {/* Characteristic curved roof */}
        <path
          d={`M ${baseX - size * 0.3} ${baseY}
               Q ${baseX - size * 0.25} ${baseY - size * 0.15}
                 ${baseX - size * 0.15} ${baseY - size * 0.2}
               L ${baseX + size * 0.15} ${baseY - size * 0.2}
               Q ${baseX + size * 0.25} ${baseY - size * 0.15}
                 ${baseX + size * 0.3} ${baseY}
               Z`}
          fill="#4B4B4B"
          stroke="#2F2F2F"
          strokeWidth={0.5}
        />
        
        {/* Roof ornaments (chigi) */}
        <path
          d={`M ${baseX - size * 0.15} ${baseY - size * 0.2}
               L ${baseX - size * 0.12} ${baseY - size * 0.28}
               M ${baseX + size * 0.15} ${baseY - size * 0.2}
               L ${baseX + size * 0.12} ${baseY - size * 0.28}`}
          stroke="#654321"
          strokeWidth={1}
          fill="none"
        />
        
        {/* Entrance */}
        <rect
          x={baseX - size * 0.05}
          y={baseY + size * 0.1}
          width={size * 0.1}
          height={size * 0.15}
          fill="#1C1C1C"
        />
        
        {/* Sacred rope (shimenawa) */}
        <path
          d={`M ${baseX - size * 0.2} ${baseY - size * 0.05}
               Q ${baseX} ${baseY - size * 0.08}
                 ${baseX + size * 0.2} ${baseY - size * 0.05}`}
          stroke="#D4AF37"
          strokeWidth={1.5}
          fill="none"
        />
        
        {/* Paper streamers (shide) */}
        {[-0.1, 0, 0.1].map((offset, i) => (
          <path
            key={i}
            d={`M ${baseX + offset * size} ${baseY - size * 0.06}
                 L ${baseX + offset * size - 2} ${baseY + size * 0.02}
                 L ${baseX + offset * size + 2} ${baseY + size * 0.02}
                 Z`}
            fill="white"
            stroke="#E0E0E0"
            strokeWidth={0.3}
          />
        ))}
      </g>
      
      {/* Stone lantern (tōrō) */}
      <g>
        <rect
          x={baseX - size * 0.4}
          y={baseY + size * 0.2}
          width={size * 0.06}
          height={size * 0.08}
          fill="#808080"
          stroke="#696969"
          strokeWidth={0.3}
        />
        <rect
          x={baseX - size * 0.41}
          y={baseY + size * 0.18}
          width={size * 0.08}
          height={size * 0.02}
          fill="#808080"
        />
        <rect
          x={baseX - size * 0.41}
          y={baseY + size * 0.28}
          width={size * 0.08}
          height={size * 0.02}
          fill="#808080"
        />
      </g>
    </g>
  );
};

export default React.memo(ShintoShrineSymbol);