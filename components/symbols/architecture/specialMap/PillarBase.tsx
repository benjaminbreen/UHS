/**
 * PillarBase.tsx
 * Renders the base tile of a pillar (blocking tile)
 * Used for tiles occupied by multi-tile pillars
 */

import React from 'react';

interface PillarBaseProps {
  x: number;
  y: number;
  material: 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';
  tileWidth: number;
  tileHeight: number;
  offsetX: number;
  offsetY: number;
}

const MATERIAL_COLORS = {
  white_marble: {
    base: '#f8f8f6',
    shadow: '#d4d4d0'
  },
  grey_stone: {
    base: '#8a8a8a',
    shadow: '#5a5a5a'
  },
  red_lacquer: {
    base: '#8b2222',
    shadow: '#5b1212'
  },
  sandstone: {
    base: '#c4a572',
    shadow: '#947852'
  },
  wood: {
    base: '#8b6f47',
    shadow: '#6b4f37'
  },
  steel: {
    base: '#b0b0c0',
    shadow: '#808090'
  }
};

export const PillarBase: React.FC<PillarBaseProps> = ({
  x,
  y,
  material,
  tileWidth,
  tileHeight,
  offsetX,
  offsetY
}) => {
  const colors = MATERIAL_COLORS[material];
  const worldX = x * tileWidth + offsetX;
  const worldY = y * tileHeight + offsetY;
  
  // Base dimensions - smaller than full tile
  const baseSize = Math.min(tileWidth, tileHeight) * 0.7;
  const baseX = worldX + (tileWidth - baseSize) / 2;
  const baseY = worldY + (tileHeight - baseSize) / 2;
  
  return (
    <g className="pillar-base">
      {/* Gray background to prevent terrain bleed */}
      <rect
        x={worldX}
        y={worldY}
        width={tileWidth}
        height={tileHeight}
        fill="#8a8a8a"
      />
      
      {/* Base platform */}
      <rect
        x={baseX}
        y={baseY}
        width={baseSize}
        height={baseSize}
        fill={colors.base}
      />
      
      {/* Top edge highlight */}
      <rect
        x={baseX}
        y={baseY}
        width={baseSize}
        height={2}
        fill={colors.shadow}
        opacity="0.3"
      />
      
      {/* Shadow for depth */}
      <rect
        x={baseX + 2}
        y={baseY + baseSize - 4}
        width={baseSize - 2}
        height={4}
        fill={colors.shadow}
        opacity="0.5"
      />
      
      {/* Center detail - small square */}
      <rect
        x={baseX + baseSize * 0.35}
        y={baseY + baseSize * 0.35}
        width={baseSize * 0.3}
        height={baseSize * 0.3}
        fill={colors.shadow}
        opacity="0.2"
      />
    </g>
  );
};