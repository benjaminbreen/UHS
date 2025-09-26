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
    const uniqueId = `standing-stone-${tile?.x || 0}-${tile?.y || 0}`;
    const stoneColor = `hsl(0, 0%, ${45 + localRand() * 10}%)`;
    const shadowColor = `hsl(0, 0%, 35%)`;
    const highlightColor = `hsl(0, 0%, ${65 + localRand() * 10}%)`;
    const elements = [];

    // Add stone texture pattern
    elements.push(
        <defs key="defs">
            <pattern id={`stone-texture-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill={stoneColor} />
                <circle cx="1" cy="1" r="0.5" fill={shadowColor} opacity="0.3" />
                <circle cx="4" cy="3" r="0.3" fill={highlightColor} opacity="0.4" />
                <circle cx="3" cy="5" r="0.4" fill={shadowColor} opacity="0.2" />
                <line x1="0" y1="3" x2="6" y2="3" stroke={shadowColor} strokeWidth="0.1" opacity="0.3" />
                <line x1="3" y1="0" x2="3" y2="6" stroke={highlightColor} strokeWidth="0.1" opacity="0.3" />
            </pattern>
            <linearGradient id={`stone-grad-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={highlightColor} />
                <stop offset="50%" stopColor={stoneColor} />
                <stop offset="100%" stopColor={shadowColor} />
            </linearGradient>
        </defs>
    );

    // Ground shadow
    elements.push(
        <ellipse
            key="shadow"
            cx={x + size * 0.5}
            cy={y + size * 0.95}
            rx={size * 0.4}
            ry={size * 0.08}
            fill="rgba(0,0,0,0.25)"
            filter="blur(1px)"
        />
    );

    const numStones = 4 + Math.floor(localRand() * 3);
    for (let i = 0; i < numStones; i++) {
        const stoneX = x + size * 0.15 + localRand(i) * size * 0.7;
        const stoneHeight = size * (0.4 + localRand(i*2) * 0.4);
        const stoneWidth = size * (0.1 + localRand(i*3) * 0.1);
        const stoneY = y + size * 0.9 - stoneHeight;
        const rotation = (localRand(i*4) - 0.5) * 10;

        // Individual stone shadow
        elements.push(
            <ellipse
                key={`stone-shadow-${i}`}
                cx={stoneX + stoneWidth/2 + 1}
                cy={y + size * 0.91}
                rx={stoneWidth * 0.6}
                ry={size * 0.02}
                fill="rgba(0,0,0,0.3)"
            />
        );

        // Main stone with texture
        elements.push(
            <rect
                key={`stone-${i}`}
                x={stoneX}
                y={stoneY}
                width={stoneWidth}
                height={stoneHeight}
                fill={`url(#stone-texture-${uniqueId})`}
                stroke={shadowColor}
                strokeWidth="0.5"
                transform={`rotate(${rotation} ${stoneX + stoneWidth/2} ${stoneY + stoneHeight/2})`}
            />
        );

        // Gradient overlay for depth
        elements.push(
            <rect
                key={`stone-gradient-${i}`}
                x={stoneX}
                y={stoneY}
                width={stoneWidth}
                height={stoneHeight}
                fill={`url(#stone-grad-${uniqueId})`}
                opacity="0.4"
                transform={`rotate(${rotation} ${stoneX + stoneWidth/2} ${stoneY + stoneHeight/2})`}
            />
        );

        // Highlight edge
        elements.push(
            <rect
                key={`stone-highlight-${i}`}
                x={stoneX + 1}
                y={stoneY + 1}
                width={stoneWidth * 0.3}
                height={stoneHeight - 2}
                fill={highlightColor}
                opacity="0.5"
                transform={`rotate(${rotation} ${stoneX + stoneWidth/2} ${stoneY + stoneHeight/2})`}
            />
        );

        // Moss or lichen patches (random)
        if (localRand(i*5) > 0.6) {
            elements.push(
                <ellipse
                    key={`moss-${i}`}
                    cx={stoneX + stoneWidth * 0.7}
                    cy={stoneY + stoneHeight * 0.3}
                    rx={stoneWidth * 0.2}
                    ry={stoneHeight * 0.1}
                    fill="hsl(120, 30%, 40%)"
                    opacity="0.3"
                    transform={`rotate(${rotation} ${stoneX + stoneWidth/2} ${stoneY + stoneHeight/2})`}
                />
            );
        }
    }

    return <g>{elements}</g>;
};

export default React.memo(StandingStoneSymbol);