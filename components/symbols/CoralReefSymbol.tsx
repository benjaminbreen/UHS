/**
 * components/symbols/CoralReefSymbol.tsx - Renders a new, more realistic coral reef symbol.
 */
import React from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface CoralReefSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tileX: number;
  tileY: number;
}

const CoralReefSymbol: React.FC<CoralReefSymbolProps> = React.memo(({ x, y, size, seed, tileX, tileY }) => {
    const uniqueId = `coral-reef-${tileX}-${tileY}`;
    const localRand = () => new ValueNoise(seed + tileX * 43 + tileY * 59).random();
    const elements: JSX.Element[] = [];

    // Gradient for the water effect
    elements.push(
        <defs key="defs">
            <radialGradient id={`grad-${uniqueId}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(28, 200, 238, 0.4)" />
                <stop offset="60%" stopColor="rgba(28, 200, 238, 0.2)" />
                <stop offset="100%" stopColor="rgba(28, 200, 238, 0)" />
            </radialGradient>
            <filter id={`coral-shadow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur"/>
              <feOffset in="blur" dx="0.5" dy="0.5" result="offsetBlur"/>
              <feFlood floodColor="#000" floodOpacity="0.4" result="flood"/>
              <feComposite in="flood" in2="offsetBlur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
        </defs>
    );

    // Rectangle to apply the gradient, extending beyond the tile
    elements.push(
        <rect
            key="water-gradient"
            x={x - size * 0.5}
            y={y - size * 0.5}
            width={size * 2}
            height={size * 2}
            fill={`url(#grad-${uniqueId})`}
        />
    );

    // Generate coral speckles on some tiles
    if (localRand() < 0.45) {
        const numCorals = 5 + Math.floor(localRand() * 8);
        const coralColors = ['#ff4757', '#ffca28', '#ab47bc']; // red, yellow, purple
        const coralGroup = [];

        for (let i = 0; i < numCorals; i++) {
            const cx = x + localRand() * size;
            const cy = y + localRand() * size;
            const r = size * (0.03 + localRand() * 0.04);
            const color = coralColors[Math.floor(localRand() * coralColors.length)];
            
            coralGroup.push(
                <circle
                    key={`coral-${i}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                />
            );
        }
        elements.push(<g key="coral-group" filter={`url(#coral-shadow-${uniqueId})`}>{coralGroup}</g>);
    }
    
     // Add animated fish
    const numFish = Math.floor(localRand() * 3);
    for(let i = 0; i < numFish; i++) {
        const fishSize = size * (0.08 + localRand() * 0.05);
        const startY = y + size * 0.2 + localRand() * size * 0.6;
        const fishColor = `hsl(${180 + localRand() * 60}, 80%, 60%)`;
        elements.push(
            <g key={`fish-${i}`} transform={`translate(${x}, ${startY})`} 
                className="swooping-fish" 
                style={{'--fish-duration': `${6 + localRand()*4}s`, '--fish-delay': `${localRand()*4}s`} as React.CSSProperties}
            >
                <path d={`M 0 0 l ${fishSize} ${fishSize/4} l -${fishSize} ${fishSize/4} Z`} fill={fishColor} />
            </g>
        )
    }

    return <>{elements}</>;
});

export default CoralReefSymbol;