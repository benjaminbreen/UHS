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
    
    // Add hot spring pool water effect
    elements.push(
        <g key="hot-spring-pool">
            {/* Outer pool edge */}
            <ellipse
                cx={size * 0.5}
                cy={size * 0.7}
                rx={size * 0.35}
                ry={size * 0.25}
                fill="#8B7355"
                opacity={0.4}
            />
            {/* Inner pool water */}
            <ellipse
                cx={size * 0.5}
                cy={size * 0.7}
                rx={size * 0.3}
                ry={size * 0.2}
                fill="#6BAED6"
                opacity={0.6}
            />
            {/* Water shimmer */}
            <ellipse
                cx={size * 0.52}
                cy={size * 0.68}
                rx={size * 0.25}
                ry={size * 0.15}
                fill="#87CEEB"
                opacity={0.3}
            />
            {/* Mineral deposits around edge */}
            <ellipse
                cx={size * 0.45}
                cy={size * 0.72}
                rx={size * 0.04}
                ry={size * 0.03}
                fill="#F5DEB3"
                opacity={0.5}
            />
            <ellipse
                cx={size * 0.55}
                cy={size * 0.68}
                rx={size * 0.03}
                ry={size * 0.025}
                fill="#F5DEB3"
                opacity={0.4}
            />
        </g>
    );
    
    // Create steam wisps rising from the water
    for (let i = 0; i < numWisps; i++) {
        const wispX = size * (0.35 + localRand() * 0.3); // Center over pool
        const wispY = size * 0.65; // Start from water surface
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
                    rx={size * 0.06}
                    ry={size * 0.1}
                    fill="rgba(230, 240, 250, 0.4)"
                />
                <ellipse
                    cx={size * 0.02}
                    cy={-size * 0.05}
                    rx={size * 0.05}
                    ry={size * 0.07}
                    fill="rgba(245, 250, 255, 0.35)"
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