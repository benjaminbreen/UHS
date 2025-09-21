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
    const isSafariBrowser = isSafari();
    console.log(`[CoralReef ${tileX},${tileY}] Safari: ${isSafariBrowser}`);

    if (!isSafariBrowser) {
        elements.push(
            <g key="fish-defs">
                <defs>
                    <style>
                        {`
                            @keyframes swimCircle {
                                0% {
                                    transform: rotate(0deg) translateX(8px) rotate(0deg);
                                    opacity: 0.8;
                                }
                                15% {
                                    transform: rotate(54deg) translateX(9px) rotate(-54deg);
                                    opacity: 0.9;
                                }
                                25% {
                                    transform: rotate(90deg) translateX(8px) rotate(-90deg);
                                    opacity: 0.8;
                                }
                                35% {
                                    transform: rotate(126deg) translateX(7px) rotate(-126deg);
                                    opacity: 0.7;
                                }
                                50% {
                                    transform: rotate(180deg) translateX(8px) rotate(-180deg);
                                    opacity: 0.8;
                                }
                                65% {
                                    transform: rotate(234deg) translateX(9px) rotate(-234deg);
                                    opacity: 0.9;
                                }
                                75% {
                                    transform: rotate(270deg) translateX(8px) rotate(-270deg);
                                    opacity: 0.8;
                                }
                                85% {
                                    transform: rotate(306deg) translateX(7px) rotate(-306deg);
                                    opacity: 0.7;
                                }
                                100% {
                                    transform: rotate(360deg) translateX(8px) rotate(-360deg);
                                    opacity: 0.8;
                                }
                            }
                            
                            @keyframes pauseAndSwim {
                                0%, 10% {
                                    transform: rotate(0deg) translateX(6px) rotate(0deg);
                                    opacity: 0.7;
                                }
                                20%, 30% {
                                    transform: rotate(72deg) translateX(7px) rotate(-72deg);
                                    opacity: 0.8;
                                }
                                40% {
                                    transform: rotate(144deg) translateX(6px) rotate(-144deg);
                                    opacity: 0.7;
                                }
                                50%, 60% {
                                    transform: rotate(180deg) translateX(5px) rotate(-180deg);
                                    opacity: 0.6;
                                }
                                70%, 80% {
                                    transform: rotate(252deg) translateX(7px) rotate(-252deg);
                                    opacity: 0.8;
                                }
                                90%, 100% {
                                    transform: rotate(360deg) translateX(6px) rotate(-360deg);
                                    opacity: 0.7;
                                }
                            }
                        `}
                    </style>
                </defs>
            </g>
        );

        // Add swimming fish with circular patterns
        const fishChance = localRand();
        const numFish = fishChance < 0.2 ? 0 : Math.floor(localRand() * 3) + 2; // 20% chance of no fish, otherwise 2-4 fish

        console.log(`[CoralReef ${tileX},${tileY}] Fish count: ${numFish}, chance: ${fishChance.toFixed(2)}`);

            for(let i = 0; i < numFish; i++) {
                const fishSize = size * (0.025 + localRand() * 0.015); // Smaller fish
                const centerX = size * 0.3 + localRand() * size * 0.4; // Center of circular path
                const centerY = size * 0.3 + localRand() * size * 0.4;
                const fishColor = `hsl(${180 + localRand() * 60}, 80%, ${60 + localRand() * 20}%)`; // Brighter tropical colors
                const fishDuration = 12 + localRand() * 8; // Slower circular motion (12-20s)
                const fishDelay = localRand() * fishDuration; // Random start times
                const useAlternateAnimation = localRand() > 0.5; // Mix of continuous and pause-and-swim
                
                // Create arrow-shaped fish that swim in circles
                elements.push(
                    <g key={`fish-${i}`} transform={`translate(${centerX}, ${centerY})`} 
                        style={{
                            animation: `${useAlternateAnimation ? 'pauseAndSwim' : 'swimCircle'} ${fishDuration}s ease-in-out infinite ${fishDelay}s`,
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