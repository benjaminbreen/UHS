/**
 * components/symbols/SteamSymbol.tsx - Renders rising steam animation for hot springs and volcanic areas
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface SteamSymbolProps {
    x: number;
    y: number;
    size: number;
    seed: number;
    intensity?: 'light' | 'medium' | 'heavy'; // For different steam amounts
}

const SteamSymbol: React.FC<SteamSymbolProps> = React.memo(({ x, y, size, seed, intensity = 'medium' }) => {
    const localRand = () => new ValueNoise(seed + 1337).random();
    
    // Number of steam wisps based on intensity
    const numWisps = intensity === 'light' ? 1 : intensity === 'heavy' ? 3 : 2;
    const elements: JSX.Element[] = [];
    
    // Create animation keyframes
    elements.push(
        <defs key="steam-defs">
            <style>
                {`
                    @keyframes risingSteam {
                        0% {
                            transform: translateY(0) scale(0.3);
                            opacity: 0;
                        }
                        20% {
                            transform: translateY(-${size * 0.2}px) scale(0.6);
                            opacity: 0.4;
                        }
                        50% {
                            transform: translateY(-${size * 0.5}px) scale(0.9) translateX(${size * 0.05}px);
                            opacity: 0.3;
                        }
                        80% {
                            transform: translateY(-${size * 0.8}px) scale(1.2) translateX(-${size * 0.05}px);
                            opacity: 0.1;
                        }
                        100% {
                            transform: translateY(-${size}px) scale(1.5);
                            opacity: 0;
                        }
                    }
                `}
            </style>
        </defs>
    );
    
    // Create steam wisps
    for (let i = 0; i < numWisps; i++) {
        const wispX = size * (0.4 + localRand() * 0.2);
        const wispY = size * 0.7;
        const animDuration = 4 + localRand() * 2;
        const animDelay = localRand() * animDuration;
        const scale = 0.8 + localRand() * 0.4;
        
        elements.push(
            <g 
                key={`steam-wisp-${i}`}
                transform={`translate(${wispX}, ${wispY}) scale(${scale})`}
                style={{
                    animation: `risingSteam ${animDuration}s ease-out infinite`,
                    animationDelay: `${animDelay}s`
                } as React.CSSProperties}
            >
                <ellipse
                    cx={0}
                    cy={0}
                    rx={size * 0.08}
                    ry={size * 0.12}
                    fill="rgba(220, 220, 220, 0.5)"
                />
                <ellipse
                    cx={size * 0.02}
                    cy={-size * 0.05}
                    rx={size * 0.06}
                    ry={size * 0.08}
                    fill="rgba(240, 240, 240, 0.4)"
                />
            </g>
        );
    }
    
    return (
        <g transform={`translate(${x}, ${y})`}>
            {elements}
        </g>
    );
});

export default SteamSymbol;