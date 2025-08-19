/**
 * components/symbols/poi/StandingStoneSymbol.tsx - Renders a cluster of standing stones.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface StandingStoneSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const StandingStoneSymbol: React.FC<StandingStoneSymbolProps> = ({ x, y, size, seed, tile }) => {
    // Safety check for undefined tile
    if (!tile) {
        console.warn('[StandingStoneSymbol] Tile is undefined, using fallback');
        return null;
    }
    
    const localRand = (offset = 0) => new ValueNoise(seed + (tile?.x || 0) * 19 + (tile?.y || 0) * 53 + offset).random();
    const stoneColor = "#808080";
    const shadowColor = "#696969";
    const highlightColor = "#A9A9A9";
    const elements = [];

    const numStones = 4 + Math.floor(localRand() * 3);
    for (let i = 0; i < numStones; i++) {
        const stoneX = x + size * 0.15 + localRand(i) * size * 0.7;
        const stoneHeight = size * (0.4 + localRand(i*2) * 0.4);
        const stoneWidth = size * (0.1 + localRand(i*3) * 0.1);
        const stoneY = y + size * 0.9 - stoneHeight;
        
        elements.push(
            <rect 
                key={`stone-${i}`}
                x={stoneX}
                y={stoneY}
                width={stoneWidth}
                height={stoneHeight}
                fill={stoneColor}
                stroke={shadowColor}
                strokeWidth="0.3"
                transform={`rotate(${(localRand(i*4) - 0.5) * 10} ${stoneX + stoneWidth/2} ${stoneY + stoneHeight/2})`}
            />
        );
         elements.push(
            <rect 
                key={`stone-highlight-${i}`}
                x={stoneX + 1}
                y={stoneY + 1}
                width={stoneWidth * 0.3}
                height={stoneHeight - 2}
                fill={highlightColor}
                opacity="0.5"
            />
        );
    }
    
    return <g>{elements}</g>;
};

export default React.memo(StandingStoneSymbol);