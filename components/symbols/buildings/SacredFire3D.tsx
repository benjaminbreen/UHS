/**
 * components/symbols/buildings/SacredFire3D.tsx - Renders an animated sacred fire with smoke.
 * Used as a holy site for Zoroastrian fire temples, indigenous North American ceremonies, and other fire-centered religions.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface SacredFire3DProps {
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  size: number; 
  seed: number; 
  tile: Tile;
  nightIntensity?: number;
}

const SacredFire3D: React.FC<SacredFire3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 211 + tile.y * 223);
    const uniqueId = `sacred-fire-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const stoneVariation = Array.from({length: 8}, () => rng.random());
    const flameVariation = Array.from({length: 6}, () => rng.random());
    const sparkVariation = Array.from({length: 12}, () => rng.random());
    const logRotation = Array.from({length: 4}, () => rng.random());
    
    const cx = x + width / 2;
    const cy = y + height * 0.8; // Fire pit positioned lower
    const fireRadius = size * 0.15;
    const stoneRadius = size * 0.25;
    
    // Color palette
    const groundColor = `hsl(30, 30%, 35%)`;
    const ashColor = `hsl(0, 10%, 25%)`;
    const stoneBaseColor = `hsl(0, 0%, 45%)`;
    const logColor = `hsl(25, 40%, 25%)`;
    const emberColor = `hsl(15, 80%, 45%)`;
    
    // Animation time-based values (using seed for consistency)
    const animTime = (Date.now() * 0.003 + seed) % (Math.PI * 2);
    
    // Fire colors with animation
    const fireCore = `hsl(${45 + Math.sin(animTime * 2) * 5}, 90%, 65%)`;
    const fireMiddle = `hsl(${25 + Math.sin(animTime * 1.5) * 8}, 85%, 55%)`;
    const fireOuter = `hsl(${15 + Math.sin(animTime) * 10}, 75%, 45%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                {/* Fire gradient with animation effect */}
                <radialGradient id={`fireGradient-${uniqueId}`} cx="0.4" cy="0.8" r="0.8">
                    <stop offset="0%" stopColor={fireCore} />
                    <stop offset="40%" stopColor={fireMiddle} />
                    <stop offset="80%" stopColor={fireOuter} />
                    <stop offset="100%" stopColor="rgba(255, 100, 0, 0.1)" />
                </radialGradient>
                
                {/* Smoke gradient */}
                <linearGradient id={`smokeGradient-${uniqueId}`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="rgba(200, 200, 200, 0.7)" />
                    <stop offset="50%" stopColor="rgba(180, 180, 180, 0.4)" />
                    <stop offset="100%" stopColor="rgba(160, 160, 160, 0.1)" />
                </linearGradient>
                
                {/* Ember glow filter */}
                <filter id={`emberGlow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {/* Ground clearing and ash circle */}
            <ellipse cx={cx} cy={cy + 2} rx={stoneRadius * 1.8} ry={stoneRadius * 0.6} 
                fill={groundColor} opacity="0.8" />
            <ellipse cx={cx} cy={cy} rx={stoneRadius * 1.1} ry={stoneRadius * 0.4} 
                fill={ashColor} />
            
            {/* Fire pit stone circle */}
            {Array.from({length: 8}).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const stoneX = cx + Math.cos(angle) * stoneRadius;
                const stoneY = cy + Math.sin(angle) * stoneRadius * 0.3;
                const stoneSize = size * (0.04 + stoneVariation[i] * 0.02);
                const stoneColor = `hsl(0, 0%, ${40 + stoneVariation[i] * 15}%)`;
                
                return (
                    <g key={`stone-${i}`}>
                        {/* Stone shadow */}
                        <ellipse 
                            cx={stoneX + 1} cy={stoneY + 2} 
                            rx={stoneSize * 1.2} ry={stoneSize * 0.6} 
                            fill="rgba(0,0,0,0.3)" 
                        />
                        {/* Stone */}
                        <ellipse 
                            cx={stoneX} cy={stoneY} 
                            rx={stoneSize} ry={stoneSize * 0.8} 
                            fill={stoneColor} 
                            stroke={stoneBaseColor} 
                            strokeWidth="0.3" 
                        />
                    </g>
                );
            })}
            
            {/* Burnt logs arranged in fire */}
            {Array.from({length: 4}).map((_, i) => {
                const angle = (i / 4) * Math.PI * 2 + logRotation[i] * 0.5;
                const logLength = size * 0.12;
                const logWidth = size * 0.02;
                const logX1 = cx + Math.cos(angle) * fireRadius * 0.3;
                const logY1 = cy + Math.sin(angle) * fireRadius * 0.1;
                const logX2 = cx + Math.cos(angle) * fireRadius * 1.2;
                const logY2 = cy + Math.sin(angle) * fireRadius * 0.4;
                
                return (
                    <line key={`log-${i}`}
                        x1={logX1} y1={logY1}
                        x2={logX2} y2={logY2}
                        stroke={logColor}
                        strokeWidth={logWidth}
                        strokeLinecap="round"
                    />
                );
            })}
            
            {/* Main fire flames with animation */}
            {Array.from({length: 6}).map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const flameHeight = size * (0.15 + flameVariation[i] * 0.1 + Math.sin(animTime * 3 + i) * 0.03);
                const flameWidth = size * (0.04 + flameVariation[i] * 0.02);
                const flameX = cx + Math.cos(angle) * fireRadius * 0.6;
                const flameY = cy - flameHeight;
                const flameWobble = Math.sin(animTime * 2 + i * 1.2) * size * 0.02;
                
                return (
                    <ellipse key={`flame-${i}`}
                        cx={flameX + flameWobble} 
                        cy={flameY}
                        rx={flameWidth} 
                        ry={flameHeight}
                        fill={`url(#fireGradient-${uniqueId})`}
                        opacity={0.8 + Math.sin(animTime * 4 + i) * 0.2}
                        transform={`rotate(${Math.sin(animTime + i) * 10} ${flameX} ${flameY})`}
                    />
                );
            })}
            
            {/* Central fire core */}
            <ellipse 
                cx={cx} 
                cy={cy - size * 0.1} 
                rx={size * 0.06} 
                ry={size * 0.12}
                fill={fireCore}
                opacity={0.9 + Math.sin(animTime * 5) * 0.1}
            />
            
            {/* Floating sparks/embers */}
            {Array.from({length: 12}).map((_, i) => {
                const sparkX = cx + (sparkVariation[i] - 0.5) * size * 0.3;
                const sparkY = cy - size * (0.2 + sparkVariation[i] * 0.15 + Math.sin(animTime * 1.5 + i) * 0.05);
                const sparkSize = size * (0.008 + sparkVariation[i] * 0.004);
                
                return (
                    <circle key={`spark-${i}`}
                        cx={sparkX}
                        cy={sparkY}
                        r={sparkSize}
                        fill={emberColor}
                        opacity={0.6 + Math.sin(animTime * 6 + i * 2) * 0.4}
                        filter={`url(#emberGlow-${uniqueId})`}
                    />
                );
            })}
            
            {/* Smoke wisps */}
            {Array.from({length: 3}).map((_, i) => {
                const smokeX = cx + (i - 1) * size * 0.03;
                const smokeHeight = size * 0.4;
                const smokeWobble = Math.sin(animTime * 0.8 + i * 2) * size * 0.04;
                
                return (
                    <path key={`smoke-${i}`}
                        d={`M ${smokeX} ${cy - size * 0.15} 
                            Q ${smokeX + smokeWobble} ${cy - smokeHeight * 0.5}, 
                            ${smokeX - smokeWobble * 0.5} ${cy - smokeHeight}
                            Q ${smokeX + smokeWobble * 1.5} ${cy - smokeHeight * 1.3},
                            ${smokeX} ${cy - smokeHeight * 1.6}`}
                        stroke={`url(#smokeGradient-${uniqueId})`}
                        strokeWidth={size * 0.02}
                        fill="none"
                        opacity={0.4 + Math.sin(animTime * 2 + i) * 0.2}
                        strokeLinecap="round"
                    />
                );
            })}
            
            {/* Night glow effect */}
            {nightIntensity > 0 && (
                <circle
                    cx={cx}
                    cy={cy - size * 0.1}
                    r={size * (0.3 + Math.sin(animTime * 2) * 0.05)}
                    fill="rgba(255, 140, 60, 0.3)"
                    opacity={nightIntensity * (0.6 + Math.sin(animTime * 3) * 0.2)}
                    filter="blur(8px)"
                />
            )}
        </g>
    );
});

export default SacredFire3D;