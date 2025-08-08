import React from 'react';
import { Tile } from '../../../types';

interface HinduTempleSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const HinduTempleSymbol: React.FC<HinduTempleSymbolProps> = ({ x, y, size }) => {
  const baseX = x * size + size / 2;
  const baseY = y * size + size / 2;
  
  return (
    <g>
      {/* Temple base platform */}
      <rect
        x={baseX - size * 0.4}
        y={baseY + size * 0.25}
        width={size * 0.8}
        height={size * 0.15}
        fill="#D2B48C"
        stroke="#8B7355"
        strokeWidth={0.5}
      />
      
      {/* Main temple body (garbhagriha) */}
      <rect
        x={baseX - size * 0.3}
        y={baseY - size * 0.1}
        width={size * 0.6}
        height={size * 0.35}
        fill="#DEB887"
        stroke="#8B7355"
        strokeWidth={0.5}
      />
      
      {/* Shikhara (tower) - characteristic curved tower */}
      <path
        d={`M ${baseX - size * 0.25} ${baseY - size * 0.1}
             Q ${baseX - size * 0.2} ${baseY - size * 0.3}
               ${baseX - size * 0.1} ${baseY - size * 0.45}
             L ${baseX} ${baseY - size * 0.5}
             L ${baseX + size * 0.1} ${baseY - size * 0.45}
             Q ${baseX + size * 0.2} ${baseY - size * 0.3}
               ${baseX + size * 0.25} ${baseY - size * 0.1}
             Z`}
        fill="#CD853F"
        stroke="#8B5A2B"
        strokeWidth={0.5}
      />
      
      {/* Horizontal ridges on shikhara */}
      {[0.2, 0.3, 0.4].map((offset, i) => (
        <ellipse
          key={i}
          cx={baseX}
          cy={baseY - size * offset}
          rx={size * (0.25 - offset/2)}
          ry={2}
          fill="#8B5A2B"
          opacity={0.5}
        />
      ))}
      
      {/* Kalasha (finial) */}
      <circle
        cx={baseX}
        cy={baseY - size * 0.5}
        r={size * 0.04}
        fill="#FFD700"
      />
      
      {/* Trident on top (Trishul) */}
      <path
        d={`M ${baseX - 2} ${baseY - size * 0.54}
             L ${baseX - 2} ${baseY - size * 0.58}
             M ${baseX} ${baseY - size * 0.54}
             L ${baseX} ${baseY - size * 0.6}
             M ${baseX + 2} ${baseY - size * 0.54}
             L ${baseX + 2} ${baseY - size * 0.58}`}
        stroke="#FFD700"
        strokeWidth={0.8}
        fill="none"
      />
      
      {/* Entrance with pillars */}
      <rect
        x={baseX - size * 0.08}
        y={baseY + size * 0.05}
        width={size * 0.16}
        height={size * 0.2}
        fill="#2F2F2F"
      />
      
      {/* Decorative pillars */}
      <rect
        x={baseX - size * 0.12}
        y={baseY - size * 0.05}
        width={size * 0.02}
        height={size * 0.3}
        fill="#8B7355"
      />
      <rect
        x={baseX + size * 0.1}
        y={baseY - size * 0.05}
        width={size * 0.02}
        height={size * 0.3}
        fill="#8B7355"
      />
      
      {/* Om symbol (simplified) */}
      <text
        x={baseX}
        y={baseY + size * 0.02}
        textAnchor="middle"
        fontSize={size * 0.15}
        fill="#8B4513"
        fontWeight="bold"
      >
        ॐ
      </text>
      
      {/* Steps */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={baseX - size * 0.15}
          y={baseY + size * 0.35 + i * 2}
          width={size * 0.3}
          height={2}
          fill="#A0826D"
        />
      ))}
    </g>
  );
};

export default React.memo(HinduTempleSymbol);