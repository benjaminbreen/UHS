/**
 * components/symbols/buildings/AboriginalHut3D.tsx - Renders a detailed, painterly Aboriginal circular dome hut.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AboriginalHut3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; roofColor?: string; nightIntensity?: number;
}

const AboriginalHut3D: React.FC<AboriginalHut3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 }) => {
    const rng = new ValueNoise(seed + tile.x * 127 + tile.y * 131);
    const cx = x + width/2;
    const uniqueId = `aboriginal-hut-${tile.x}-${tile.y}`;

    // Pre-calculate all random values to prevent re-rendering
    const rand1 = rng.random();
    const rand2 = rng.random();
    const rand3 = rng.random();
    const rand4 = rng.random();
    const rand5 = rng.random();
    const rand6 = rng.random();
    const fireChance = rng.random();
    const decorationChance = rng.random();

    // Dome dimensions - lower and more circular than regular huts
    const domeRadius = width * 0.45;
    const domeHeight = height * 0.35; // Much lower profile
    const baseY = y + height - domeHeight * 0.3; // Sits closer to ground

    // Earth tone colors for bark and mud construction
    const barkColor = `hsl(30, 35%, ${45 + rand1*15}%)`;
    const mudColor = `hsl(25, 40%, ${40 + rand2*12}%)`;
    const shadowColor = `hsl(25, 45%, 25%)`;
    const highlightColor = `hsl(35, 50%, ${55 + rand3*10}%)`;
    const entranceColor = '#2d1810';
    
    // Small fire pit outside for cooking (40% chance)
    const renderFirePit = () => {
        if (nightIntensity < 0.1 || fireChance < 0.6) return null;
        
        const fireX = cx + domeRadius * 1.2;
        const fireY = baseY + domeHeight * 0.8;
        const fireColor = 'rgba(255, 120, 40, 0.9)';
        const smokeColor = 'rgba(200, 200, 200, 0.4)';
        
        return (
            <g>
                {/* Fire glow */}
                <circle
                    cx={fireX}
                    cy={fireY}
                    r={size * 0.08}
                    fill={fireColor}
                    opacity={nightIntensity * 0.8}
                    filter="blur(4px)"
                />
                {/* Fire pit stones */}
                {[...Array(6)].map((_, i) => (
                    <circle key={`stone-${i}`}
                        cx={fireX + Math.cos(i * Math.PI / 3) * size * 0.04}
                        cy={fireY + Math.sin(i * Math.PI / 3) * size * 0.04}
                        r={size * 0.015}
                        fill="#555"
                        opacity={0.8}
                    />
                ))}
                {/* Smoke wisps */}
                <path d={`M ${fireX} ${fireY - size * 0.02} Q ${fireX + size * 0.03} ${fireY - size * 0.08} ${fireX - size * 0.02} ${fireY - size * 0.12}`}
                    stroke={smokeColor} strokeWidth="1" fill="none" opacity={nightIntensity * 0.6} />
            </g>
        );
    };

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <radialGradient id={`domeGradient-${uniqueId}`} cx="0.3" cy="0.2" r="0.8">
                    <stop offset="0%" stopColor={highlightColor} />
                    <stop offset="40%" stopColor={barkColor} />
                    <stop offset="80%" stopColor={mudColor} />
                    <stop offset="100%" stopColor={shadowColor} />
                </radialGradient>
                <pattern id={`barkTexture-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="3">
                    <rect width="4" height="3" fill={barkColor} />
                    <path d="M 0 1.5 L 4 1.5" stroke={shadowColor} strokeWidth="0.3" opacity="0.6" />
                    <path d="M 2 0 L 2 3" stroke={mudColor} strokeWidth="0.2" opacity="0.4"/>
                    <circle cx="1" cy="1.5" r="0.4" fill={shadowColor} opacity="0.3"/>
                    <circle cx="3" cy="1.5" r="0.3" fill={highlightColor} opacity="0.2"/>
                </pattern>
                <filter id={`organicTexture-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feTurbulence baseFrequency="0.6" numOctaves="2" result="noise" seed="7"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
                </filter>
            </defs>
            
            {/* Enhanced ground shadow */}
            <ellipse cx={cx + 1.5} cy={baseY + domeHeight + 2} rx={domeRadius * 1.2} ry={domeRadius * 0.4} fill="rgba(0,0,0,0.3)" />

            {/* Main dome structure - circular and low */}
            <ellipse cx={cx} cy={baseY + domeHeight * 0.7} 
                rx={domeRadius} ry={domeHeight * 0.9} 
                fill={`url(#domeGradient-${uniqueId})`} 
                stroke={shadowColor} strokeWidth="1"
                filter={`url(#organicTexture-${uniqueId})`} />

            {/* Bark/mud texture overlay */}
            <ellipse cx={cx} cy={baseY + domeHeight * 0.7} 
                rx={domeRadius * 0.95} ry={domeHeight * 0.85} 
                fill={`url(#barkTexture-${uniqueId})`} 
                opacity="0.7" />

            {/* Entrance - low and arched */}
            <path d={`M ${cx - domeRadius * 0.25} ${baseY + domeHeight} 
                A ${domeRadius * 0.25} ${domeHeight * 0.4} 0 0 1 ${cx + domeRadius * 0.25} ${baseY + domeHeight} 
                Z`} 
                fill={entranceColor} stroke={shadowColor} strokeWidth="0.8"/>

            {/* Entrance frame - natural materials */}
            <path d={`M ${cx - domeRadius * 0.3} ${baseY + domeHeight} 
                A ${domeRadius * 0.3} ${domeHeight * 0.45} 0 0 1 ${cx + domeRadius * 0.3} ${baseY + domeHeight}`}
                fill="none" stroke="#654321" strokeWidth="1.5" />

            {/* Structural details - visible bark strips */}
            {[...Array(5)].map((_, i) => (
                <path key={`bark-strip-${i}`} 
                    d={`M ${cx - domeRadius * 0.8} ${baseY + domeHeight * (0.3 + i * 0.15)} 
                        Q ${cx} ${baseY + domeHeight * (0.25 + i * 0.15)}, 
                        ${cx + domeRadius * 0.8} ${baseY + domeHeight * (0.3 + i * 0.15)}`} 
                    fill="none" stroke={i % 2 === 0 ? barkColor : mudColor} 
                    strokeWidth="0.8" opacity="0.8" strokeLinecap="round"/>
            ))}

            {/* Natural ventilation holes */}
            <circle cx={cx - domeRadius * 0.6} cy={baseY + domeHeight * 0.4} r={size * 0.02} 
                fill="rgba(0,0,0,0.8)" stroke={shadowColor} strokeWidth="0.4"/>
            <circle cx={cx + domeRadius * 0.5} cy={baseY + domeHeight * 0.5} r={size * 0.015} 
                fill="rgba(0,0,0,0.7)" stroke={shadowColor} strokeWidth="0.3"/>

            {/* Traditional decorative elements (ochre paintings) */}
            {decorationChance > 0.4 && [...Array(3)].map((_, i) => (
                <g key={`decoration-${i}`}>
                    {/* Dot paintings */}
                    <circle cx={cx + (i - 1) * domeRadius * 0.4} 
                        cy={baseY + domeHeight * 0.6} 
                        r={size * 0.02} 
                        fill={i % 3 === 0 ? "#dc2626" : i % 3 === 1 ? "#f59e0b" : "#fbbf24"} 
                        opacity="0.8" />
                    <circle cx={cx + (i - 1) * domeRadius * 0.4} 
                        cy={baseY + domeHeight * 0.6} 
                        r={size * 0.01} 
                        fill="white" opacity="0.6"/>
                    
                    {/* Connecting lines - traditional dot art style */}
                    {i < 2 && (
                        <line x1={cx + (i - 1) * domeRadius * 0.4} 
                            y1={baseY + domeHeight * 0.6}
                            x2={cx + i * domeRadius * 0.4} 
                            y2={baseY + domeHeight * 0.6}
                            stroke="#dc2626" strokeWidth="0.6" opacity="0.6"/>
                    )}
                </g>
            ))}

            {/* Supporting structure - minimal wooden frame visible */}
            <rect x={cx - domeRadius - size * 0.03} y={baseY + domeHeight * 0.6} 
                width={size * 0.02} height={domeHeight * 0.3} 
                fill="#8b4513" stroke={shadowColor} strokeWidth="0.3" opacity="0.7"/>
            <rect x={cx + domeRadius + size * 0.01} y={baseY + domeHeight * 0.7} 
                width={size * 0.015} height={domeHeight * 0.25} 
                fill="#8b4513" stroke={shadowColor} strokeWidth="0.3" opacity="0.6"/>

            {/* Surrounding vegetation/materials */}
            {[...Array(4)].map((_, i) => (
                <circle key={`bush-${i}`}
                    cx={cx + (rand4 - 0.5) * domeRadius * 2.5 + (i - 2) * domeRadius * 0.6}
                    cy={baseY + domeHeight + (rand5 - 0.5) * size * 0.1}
                    r={size * (0.02 + rand6 * 0.02)}
                    fill={`hsl(${80 + i * 20}, 40%, ${35 + rand1 * 15}%)`}
                    opacity="0.6"
                />
            ))}

            {/* Fire pit lighting */}
            {renderFirePit()}
        </g>
    );
});

export default AboriginalHut3D;