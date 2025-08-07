/**
 * components/symbols/buildings/AfricanRoundHut3D.tsx - Renders a detailed, painterly African round hut.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AfricanRoundHut3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; roofColor: string; nightIntensity?: number;
}

const AfricanRoundHut3D: React.FC<AfricanRoundHut3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 }) => {
    const rng = new ValueNoise(seed + tile.x * 5 + tile.y * 7);
    
    // Pre-calculate all random values to prevent re-rendering changes
    const wallColorVariation = rng.random();
    const thatchColor1Variation = rng.random();
    const thatchColor2Variation = rng.random();
    const torchChance = rng.random();
    const decorationChance = rng.random();
    const decorationOffsets = Array.from({length: 3}, () => rng.random());
    
    // Keep compatibility with existing rand() calls
    const rand = rng.random;
    
    const cx = x + width / 2;
    const wallRadius = width * 0.4;
    const wallHeight = height * 0.5;
    const wallY = y + height - wallHeight;
    const roofRadius = wallRadius * 1.3;
    const roofHeight = height * 0.6;
    const roofY = wallY;
    const uniqueId = `hut-${tile.x}-${tile.y}`;

    const wallBaseColor = `hsl(25, 35%, ${65 + wallColorVariation * 10}%)`;
    const wallShadowColor = `hsl(25, 35%, 45%)`;
    const thatchColor1 = `hsl(40, 50%, ${50 + thatchColor1Variation * 10}%)`;
    const thatchColor2 = `hsl(40, 55%, ${35 + thatchColor2Variation * 10}%)`;
    const thatchHighlight = `hsl(45, 60%, 65%)`;
    const doorColor = '#4a2c17';
    const outlineColor = '#4a2c17';

    // Torch lighting for windowless huts (33% chance)
    const renderTorchLighting = () => {
        if (nightIntensity < 0.2 || torchChance < 0.67) return null; // Only 1 in 3 huts have torches
        
        const torchX = cx + wallRadius * 0.8;
        const torchY = wallY + wallHeight * 0.6;
        const torchColor = 'rgba(255, 140, 60, 0.9)';
        const torchGlow = 'rgba(255, 160, 80, 0.6)';
        
        return (
            <g>
                {/* Torch glow */}
                <circle
                    cx={torchX}
                    cy={torchY}
                    r={size * 0.12}
                    fill={torchGlow}
                    opacity={nightIntensity * 0.7}
                    filter="blur(6px)"
                />
                <circle
                    cx={torchX}
                    cy={torchY}
                    r={size * 0.06}
                    fill={torchColor}
                    opacity={nightIntensity * 0.9}
                    filter="blur(3px)"
                />
                {/* Torch post */}
                <rect
                    x={torchX - size * 0.008}
                    y={torchY}
                    width={size * 0.016}
                    height={size * 0.15}
                    fill="#654321"
                    opacity={nightIntensity * 0.8}
                />
            </g>
        );
    };

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                {/* Enhanced gradients and textures */}
                <radialGradient id={`wallGradient-${uniqueId}`} cx="0.3" cy="0.3" r="0.8">
                    <stop offset="0%" stopColor={wallBaseColor} />
                    <stop offset="60%" stopColor={`hsl(25, 35%, ${55 + wallColorVariation * 8}%)`} />
                    <stop offset="100%" stopColor={wallShadowColor} />
                </radialGradient>
                <linearGradient id={`thatchGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={thatchHighlight} />
                    <stop offset="25%" stopColor={thatchColor1} />
                    <stop offset="70%" stopColor={thatchColor2} />
                    <stop offset="100%" stopColor={`hsl(40, 55%, 25%)`} />
                </linearGradient>
                <pattern id={`thatchPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="3" height="2">
                    <rect width="3" height="2" fill={thatchColor2} />
                    <path d="M 0 1 L 3 1" stroke={thatchColor1} strokeWidth="0.3" opacity="0.7" />
                    <path d="M 1.5 0 L 1.5 2" stroke={`hsl(40, 50%, 35%)`} strokeWidth="0.2" opacity="0.5"/>
                </pattern>
                <filter id={`mudTexture-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feTurbulence baseFrequency="0.8" numOctaves="3" result="noise" seed="3"/>
                    <feColorMatrix in="noise" type="saturate" values="0"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/>
                </filter>
            </defs>
            
            {/* Enhanced shadow */}
            <ellipse cx={cx + 2} cy={y + height + 1.5} rx={roofRadius * 1.1} ry={roofRadius * 0.35} fill="rgba(0,0,0,0.35)" />
      
            {/* Enhanced 3D cylindrical wall with proper perspective */}
            {/* Back wall arc */}
            <path d={`M ${cx - wallRadius} ${wallY} a ${wallRadius} ${wallRadius * 0.2} 0 0 1 ${wallRadius * 2} 0`} 
                fill={`hsl(25, 30%, 45%)`} stroke={outlineColor} strokeWidth="0.5"/>
            
            {/* Main wall cylinder */}
            <rect x={cx - wallRadius} y={wallY} width={wallRadius * 2} height={wallHeight} 
                fill={`url(#wallGradient-${uniqueId})`} 
                stroke={outlineColor} strokeWidth="0.8"
                filter={`url(#mudTexture-${uniqueId})`} />
            
            {/* Front wall arc (3D effect) */}
            <path d={`M ${cx - wallRadius} ${wallY + wallHeight} a ${wallRadius} ${wallRadius * 0.2} 0 0 0 ${wallRadius * 2} 0`} 
                fill={wallShadowColor} stroke={outlineColor} strokeWidth="0.8"/>
            
            {/* Enhanced arched doorway */}
            <path d={`M ${cx - wallRadius * 0.3} ${wallY + wallHeight} 
                v -${wallHeight * 0.75} 
                a ${wallRadius * 0.3} ${wallRadius * 0.25} 0 0 1 ${wallRadius * 0.6} 0 
                v ${wallHeight * 0.75} Z`} 
                fill={doorColor} stroke={outlineColor} strokeWidth="0.8" />
            
            {/* Door frame details */}
            <path d={`M ${cx - wallRadius * 0.35} ${wallY + wallHeight * 0.25} 
                a ${wallRadius * 0.35} ${wallRadius * 0.28} 0 0 1 ${wallRadius * 0.7} 0`}
                fill="none" stroke="#654321" strokeWidth="1.2" />
            
            {/* Small windows */}
            <circle cx={cx + wallRadius * 0.6} cy={wallY + wallHeight * 0.4} r={size * 0.03} 
                fill="rgba(0,0,0,0.9)" stroke={outlineColor} strokeWidth="0.6"/>
            <circle cx={cx - wallRadius * 0.6} cy={wallY + wallHeight * 0.5} r={size * 0.025} 
                fill="rgba(0,0,0,0.8)" stroke={outlineColor} strokeWidth="0.5"/>
            
            {/* Enhanced conical thatched roof */}
            <path d={`M ${cx - roofRadius} ${roofY} Q ${cx} ${roofY - roofHeight * 1.15}, ${cx + roofRadius} ${roofY} Z`} 
                fill={`url(#thatchGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.4" />
            <path d={`M ${cx - roofRadius} ${roofY} Q ${cx} ${roofY - roofHeight}, ${cx + roofRadius} ${roofY} Z`} 
                fill={`url(#thatchPattern-${uniqueId})`} opacity="0.85" />
            
            {/* Detailed roof thatch lines */}
            {[...Array(6)].map((_, i) => (
                <path key={`thatch-line-${i}`} 
                    d={`M ${cx - roofRadius * (0.85 - i * 0.12)} ${roofY - roofHeight * (i * 0.08)} 
                        Q ${cx} ${roofY - roofHeight * (0.95 - i * 0.08)}, 
                        ${cx + roofRadius * (0.85 - i * 0.12)} ${roofY - roofHeight * (i * 0.08)}`} 
                    fill="none" stroke={i % 2 === 0 ? thatchHighlight : thatchColor1} 
                    strokeWidth="0.6" opacity="0.7" strokeLinecap="round"/>
            ))}

            {/* Enhanced decorative wall patterns */}
            {decorationChance > 0.3 && [...Array(4)].map((_, i) => (
                <g key={`pattern-${i}`}>
                    {/* Traditional geometric patterns */}
                    <circle cx={cx + wallRadius * 0.5 + (decorationOffsets[i] - 0.5) * 6} 
                        cy={wallY + wallHeight * (0.2 + i * 0.18)} 
                        r={size * 0.03} 
                        fill={i % 3 === 0 ? "#dc2626" : i % 3 === 1 ? "#f59e0b" : "#65a30d"} 
                        opacity="0.9" stroke="#2d1b07" strokeWidth="0.4"/>
                    <circle cx={cx + wallRadius * 0.5 + (decorationOffsets[i] - 0.5) * 6} 
                        cy={wallY + wallHeight * (0.2 + i * 0.18)} 
                        r={size * 0.018} 
                        fill="white" opacity="0.7"/>
                </g>
            ))}
            
            {/* Support posts and structural details */}
            <rect x={cx + wallRadius + 2} y={wallY + wallHeight * 0.3} 
                width={size * 0.03} height={wallHeight * 0.5} 
                fill="#8b4513" stroke={outlineColor} strokeWidth="0.5"/>
            <rect x={cx - wallRadius - size * 0.05} y={wallY + wallHeight * 0.25} 
                width={size * 0.025} height={wallHeight * 0.55} 
                fill="#8b4513" stroke={outlineColor} strokeWidth="0.4"/>
            
            {/* Night torch lighting */}
            {renderTorchLighting()}
        </g>
    );
});

export default AfricanRoundHut3D;
