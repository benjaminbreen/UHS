/**
 * components/symbols/MarketplaceSymbol.tsx - Renders a marketplace area.
 */
import React from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface MarketplaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const MarketplaceSymbol: React.FC<MarketplaceSymbolProps> = React.memo(({ x, y, size, seed, tile }) => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 17 + tile.y * 19 + offset).random();
    const elements: JSX.Element[] = [];
    const stallColors = ["#c11d1d", "#16a34a", "#0369a1", "#ca8a04"];

    const numStalls = 3 + Math.floor(localRand() * 3);
    for (let i = 0; i < numStalls; i++) {
        const stallW = size * (0.2 + localRand(i*2) * 0.1);
        const stallH = size * 0.15;
        const stallX = x + localRand(i*3) * (size - stallW);
        const stallY = y + localRand(i*4) * (size - stallH * 2);
        const awningH = size * 0.1;
        const awningColor = stallColors[i % stallColors.length];

        elements.push(
            <g key={`stall-group-${i}`}>
                {/* Table */}
                <rect 
                    x={stallX} 
                    y={stallY + awningH} 
                    width={stallW} 
                    height={stallH}
                    fill="#a0522d"
                />
                {/* Awning */}
                <path 
                    d={`M ${stallX - size*0.02} ${stallY + awningH} L ${stallX + stallW + size*0.02} ${stallY + awningH} L ${stallX + stallW} ${stallY} L ${stallX} ${stallY} Z`}
                    fill={awningColor}
                />
                {/* Awning Stripes */}
                {Array.from({length: 4}).map((_, j) => (
                    <path
                        key={`stripe-${j}`}
                        d={`M ${stallX + j * (stallW/4)} ${stallY} L ${stallX + j * (stallW/4) + size*0.02} ${stallY + awningH}`}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="0.5"
                    />
                ))}
            </g>
        );
    }
    
    return <>{elements}</>;
});

export default MarketplaceSymbol;
