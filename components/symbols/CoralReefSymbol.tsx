/**
 * components/symbols/CoralReefSymbol.tsx - Renders a new, more realistic coral reef symbol.
 */
import React from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';
import { isSafari } from '../../utils/safariUtils';

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
            x={-size * 0.5}
            y={-size * 0.5}
            width={size * 2}
            height={size * 2}
            fill={`url(#grad-${uniqueId})`}
        />
    );

    // Generate stationary coral formations - smaller and more spread out
    // Disable coral blobs on Safari for performance
    if (!isSafari() && localRand() < 0.4) {
        const numCorals = 2 + Math.floor(localRand() * 4); // Fewer coral formations (2-5)
        const coralColors = ['#ff4757', '#ffca28', '#ab47bc', '#ff6b9d', '#70a1ff']; // More coral colors
        const coralGroup = [];

        for (let i = 0; i < numCorals; i++) {
            const cx = size * 0.1 + localRand() * size * 0.8; // Spread across more of the tile
            const cy = size * 0.1 + localRand() * size * 0.8;
            const r = size * (0.02 + localRand() * 0.03); // Much smaller coral formations
            const color = coralColors[Math.floor(localRand() * coralColors.length)];
            
            coralGroup.push(
                <circle
                    key={`coral-${i}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    opacity={0.8}
                />
            );
        }
        elements.push(<g key="coral-group" filter={`url(#coral-shadow-${uniqueId})`}>{coralGroup}</g>);
    }
    
     // Add inline keyframes for darting arrow fish animation
    // Only add fish animations on non-Safari browsers
    if (!isSafari()) {
        elements.push(
            <g key="fish-defs">
                <defs>
                    <style>
                        {`
                            @keyframes dartFish {
                            0% {
                                transform: translateX(0) translateY(0) rotate(0deg);
                                opacity: 0.7;
                            }
                            20% {
                                transform: translateX(3px) translateY(-2px) rotate(15deg);
                                opacity: 0.8;
                            }
                            40% {
                                transform: translateX(5px) translateY(1px) rotate(-10deg);
                                opacity: 0.9;
                            }
                            60% {
                                transform: translateX(2px) translateY(3px) rotate(5deg);
                                opacity: 0.8;
                            }
                            80% {
                                transform: translateX(-2px) translateY(2px) rotate(-20deg);
                                opacity: 0.7;
                            }
                            100% {
                                transform: translateX(0) translateY(0) rotate(0deg);
                                opacity: 0.7;
                            }
                        }
                        `}
                    </style>
                </defs>
            </g>
        );

        // Add darting arrow-fish - small, fast moving fish that dart in and out
        const fishChance = localRand();
        const numFish = fishChance < 0.8 ? 0 : Math.floor(localRand() * 3) + 1; // 80% chance of no fish, otherwise 1-3
        
            for(let i = 0; i < numFish; i++) {
                const fishSize = size * (0.03 + localRand() * 0.02); // Smaller fish
                const startX = size * 0.3 + localRand() * size * 0.4;
                const startY = size * 0.3 + localRand() * size * 0.4;
                const fishColor = `hsl(${180 + localRand() * 60}, 80%, ${60 + localRand() * 20}%)`; // Brighter tropical colors
                const fishDuration = 8 + localRand() * 6; // Much slower random walk
                const fishDelay = localRand() * fishDuration; // Random start times
                
                // Create arrow-shaped fish that dart
                elements.push(
                    <g key={`fish-${i}`} transform={`translate(${startX}, ${startY})`} 
                        style={{
                            animation: `dartFish ${fishDuration}s ease-in-out infinite ${fishDelay}s`,
                            transformOrigin: 'center center'
                        } as React.CSSProperties}
                    >
                        {/* Arrow-shaped fish body */}
                        <path 
                            d={`M 0 0 L ${fishSize} -${fishSize*0.4} L ${fishSize*0.7} 0 L ${fishSize} ${fishSize*0.4} Z`}
                            fill={fishColor}
                            opacity="0.9"
                        />
                        {/* Small tail detail */}
                        <path 
                            d={`M ${fishSize*0.7} -${fishSize*0.2} L ${fishSize*0.5} 0 L ${fishSize*0.7} ${fishSize*0.2} Z`}
                            fill={fishColor}
                            opacity="0.7"
                        />
                        {/* Tiny eye */}
                        <circle cx={fishSize*0.8} cy={-fishSize*0.1} r={fishSize*0.1} fill="white" opacity="0.8" />
                    </g>
                )
            }
        }

    // Return properly positioned group with all elements
    return (
        <g transform={`translate(${x}, ${y})`}>
            {elements}
        </g>
    );
});

export default CoralReefSymbol;