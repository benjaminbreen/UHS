/**
 * components/symbols/poi/PagodaSymbol.tsx - Renders a multi-tiered Pagoda
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface PagodaSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const PagodaSymbol: React.FC<PagodaSymbolProps> = ({ x, y, size, seed, tile }) => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 19 + tile.y * 53 + offset).random();
    const tiers = 3 + Math.floor(localRand() * 3);
    const wallColor = "#F5DEB3";
    const roofColor = "#B22222";
    const outlineColor = "#8B4513";

    const elements = [];

    for (let i = 0; i < tiers; i++) {
        const tierY = y + size * 0.9 - (i + 1) * (size * 0.8 / tiers);
        const tierWidth = size * (0.6 - i * 0.08);
        const tierX = x + (size - tierWidth) / 2;

        // Roof
        const roofHeight = size * 0.15;
        const roofWidth = tierWidth * 1.4;
        const roofX = x + (size - roofWidth) / 2;
        elements.push(
            <path 
                key={`roof-${i}`}
                d={`M ${roofX} ${tierY} Q ${roofX + roofWidth/2} ${tierY - roofHeight*0.4}, ${roofX + roofWidth} ${tierY} Q ${roofX + roofWidth/2} ${tierY - roofHeight*0.6}, ${roofX} ${tierY} L ${roofX + roofWidth/2} ${tierY - roofHeight} Z`}
                fill={roofColor}
                stroke={outlineColor}
                strokeWidth="0.3"
            />
        );
    }
    
    return <g filter="url(#symbolShadow)">{elements}</g>;
};

export default React.memo(PagodaSymbol);