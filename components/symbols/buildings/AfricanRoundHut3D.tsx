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
    
    // Adjusted for proper hut proportions like 🛖 emoji
    const scaleFactor = 1.05;
    const cx = x + width / 2;
    const wallRadius = width * 0.4 * scaleFactor; // Smaller, round base
    const wallHeight = height * 0.35 * scaleFactor; // Lower walls
    const wallY = y + height - wallHeight - height * 0.1; // Raised off ground
    const roofRadius = wallRadius * 1.4; // Significant roof overhang
    const roofHeight = height * 0.55 * scaleFactor; // Tall conical roof
    const roofY = wallY + wallHeight * 0.05; // Roof sits on walls
    const uniqueId = `hut-${tile.x}-${tile.y}`;

    // More authentic mud/clay walls and golden thatch
    const wallBaseColor = `hsl(30, 25%, ${55 + wallColorVariation * 10}%)`; // Clay/mud color
    const wallShadowColor = `hsl(30, 25%, 35%)`;
    const thatchColor1 = `hsl(45, 65%, ${60 + thatchColor1Variation * 10}%)`; // Golden straw
    const thatchColor2 = `hsl(42, 60%, ${45 + thatchColor2Variation * 10}%)`;
    const thatchHighlight = `hsl(48, 70%, 75%)`;
    const doorColor = '#2c1810';
    const outlineColor = '#3a2818';

    // Enhanced torch lighting for bigger huts (40% chance)
    const renderTorchLighting = () => {
        if (nightIntensity < 0.15 || torchChance < 0.6) return null; // Slightly more common
        
        const torchX = cx + wallRadius * 0.9;
        const torchY = wallY + wallHeight * 0.5;
        const torchColor = 'rgba(255, 140, 60, 0.95)';
        const torchGlow = 'rgba(255, 160, 80, 0.7)';
        
        return (
            <g>
                {/* Multiple glow layers for depth */}
                <circle
                    cx={torchX}
                    cy={torchY}
                    r={size * 0.18}
                    fill={torchGlow}
                    opacity={nightIntensity * 0.5}
                    filter="blur(8px)"
                />
                <circle
                    cx={torchX}
                    cy={torchY}
                    r={size * 0.12}
                    fill={torchGlow}
                    opacity={nightIntensity * 0.7}
                    filter="blur(5px)"
                />
                <circle
                    cx={torchX}
                    cy={torchY}
                    r={size * 0.08}
                    fill={torchColor}
                    opacity={nightIntensity * 0.9}
                    filter="blur(2px)"
                />
                {/* Enhanced torch post */}
                <rect
                    x={torchX - size * 0.012}
                    y={torchY}
                    width={size * 0.024}
                    height={size * 0.2}
                    fill="#654321"
                    stroke="#4a2c17"
                    strokeWidth="0.3"
                    opacity={nightIntensity * 0.8}
                />
                {/* Torch holder bracket */}
                <path
                    d={`M ${torchX - size * 0.02} ${torchY + size * 0.05} L ${torchX + size * 0.02} ${torchY + size * 0.05}`}
                    stroke="#8b4513"
                    strokeWidth="1.5"
                    opacity={nightIntensity * 0.7}
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
            
            {/* Multi-layered enhanced shadows with blur */}
            <ellipse cx={cx + 4} cy={y + height + 4} rx={roofRadius * 1.3} ry={roofRadius * 0.45} fill="rgba(0,0,0,0.3)" filter="blur(3px)" />
            <ellipse cx={cx + 2} cy={y + height + 2} rx={roofRadius * 1.15} ry={roofRadius * 0.4} fill="rgba(0,0,0,0.25)" filter="blur(2px)" />
            <ellipse cx={cx + 1} cy={y + height + 1} rx={roofRadius * 1.05} ry={roofRadius * 0.35} fill="rgba(0,0,0,0.4)" filter="blur(1px)" />
      
            {/* Simple cylindrical mud walls */}
            {/* Wall cylinder */}
            <ellipse cx={cx} cy={wallY} rx={wallRadius} ry={wallRadius * 0.15} 
                fill={wallShadowColor} opacity="0.5"/>
            
            <rect x={cx - wallRadius} y={wallY} width={wallRadius * 2} height={wallHeight} 
                fill={`url(#wallGradient-${uniqueId})`} 
                stroke={outlineColor} strokeWidth="0.8"
                rx={wallRadius * 0.02} />
            
            {/* Wall texture bands for realism */}
            {[...Array(3)].map((_, i) => (
                <rect key={`wall-band-${i}`}
                    x={cx - wallRadius * 0.95} y={wallY + wallHeight * (0.2 + i * 0.25)} 
                    width={wallRadius * 1.9} height={wallHeight * 0.05} 
                    fill="none" stroke={wallShadowColor} strokeWidth="0.8" opacity="0.6" />
            ))}
            
            {/* Front wall arc (3D effect) - enhanced depth */}
            <path d={`M ${cx - wallRadius} ${wallY + wallHeight} a ${wallRadius} ${wallRadius * 0.25} 0 0 0 ${wallRadius * 2} 0`} 
                fill={wallShadowColor} stroke={outlineColor} strokeWidth="1.2"/>
            
            {/* Simple arched doorway */}
            <path d={`M ${cx - wallRadius * 0.2} ${wallY + wallHeight} 
                v -${wallHeight * 0.65} 
                a ${wallRadius * 0.2} ${wallRadius * 0.15} 0 0 1 ${wallRadius * 0.4} 0 
                v ${wallHeight * 0.65} Z`} 
                fill={doorColor} 
                stroke={outlineColor} 
                strokeWidth="0.8" />
            
            {/* Interior shadow */}
            <path d={`M ${cx - wallRadius * 0.2} ${wallY + wallHeight} 
                v -${wallHeight * 0.6} 
                a ${wallRadius * 0.2} ${wallRadius * 0.15} 0 0 1 ${wallRadius * 0.4} 0 
                v ${wallHeight * 0.6} Z`} 
                fill="rgba(0,0,0,0.7)" />
            
            {/* Enhanced door frame with lintel */}
            <path d={`M ${cx - wallRadius * 0.35} ${wallY + wallHeight * 0.3} 
                a ${wallRadius * 0.35} ${wallRadius * 0.3} 0 0 1 ${wallRadius * 0.7} 0`}
                fill="none" stroke="#654321" strokeWidth="2.5" />
            
            {/* Wooden lintel beam */}
            <rect x={cx - wallRadius * 0.3} y={wallY + wallHeight * 0.25} 
                width={wallRadius * 0.6} height={size * 0.04} 
                fill="#8b4513" stroke="#654321" strokeWidth="0.8" />
            
            {/* Small round window */}
            <circle cx={cx + wallRadius * 0.5} cy={wallY + wallHeight * 0.4} r={size * 0.025} 
                fill="rgba(0,0,0,0.8)" 
                stroke={outlineColor} 
                strokeWidth="0.6"/>
            
            {/* Prominent conical thatched roof like 🛖 */}
            {/* Roof base shadow */}
            <ellipse cx={cx} cy={roofY + 2} rx={roofRadius * 1.1} ry={roofRadius * 0.25} 
                fill="rgba(0,0,0,0.4)" />
            
            {/* Main conical roof - tall and pointed */}
            <path d={`M ${cx - roofRadius} ${roofY} 
                      L ${cx} ${roofY - roofHeight * 1.4} 
                      L ${cx + roofRadius} ${roofY} 
                      Q ${cx} ${roofY + roofRadius * 0.15} ${cx - roofRadius} ${roofY}`} 
                fill={`url(#thatchGradient-${uniqueId})`} 
                stroke={outlineColor} 
                strokeWidth="0.6" />
            
            {/* Layered thatch effect */}
            <path d={`M ${cx - roofRadius * 0.9} ${roofY - roofHeight * 0.1} 
                      L ${cx} ${roofY - roofHeight * 1.3} 
                      L ${cx + roofRadius * 0.9} ${roofY - roofHeight * 0.1} 
                      Q ${cx} ${roofY - roofHeight * 0.05 + roofRadius * 0.12} ${cx - roofRadius * 0.9} ${roofY - roofHeight * 0.1}`} 
                fill={`url(#thatchPattern-${uniqueId})`} 
                opacity="0.85" />
            
            {/* Roof ridge cap */}
            <line x1={cx - roofRadius * 0.1} y1={roofY - roofHeight * 1.15} 
                x2={cx + roofRadius * 0.1} y2={roofY - roofHeight * 1.15} 
                stroke={thatchHighlight} strokeWidth="3" strokeLinecap="round" />
            
            {/* Horizontal thatch layers for authentic look */}
            {[...Array(6)].map((_, i) => {
                const layerY = roofY - roofHeight * (i * 0.2 + 0.1);
                const layerWidth = roofRadius * (1 - i * 0.15);
                return (
                    <g key={`thatch-layer-${i}`}>
                        <ellipse 
                            cx={cx} 
                            cy={layerY} 
                            rx={layerWidth} 
                            ry={layerWidth * 0.08}
                            fill={i % 2 === 0 ? thatchColor1 : thatchColor2}
                            opacity="0.9"
                        />
                        {/* Thatch texture lines */}
                        <path 
                            d={`M ${cx - layerWidth * 0.8} ${layerY} 
                                Q ${cx} ${layerY - 2} ${cx + layerWidth * 0.8} ${layerY}`}
                            stroke={thatchHighlight}
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.6"
                        />
                    </g>
                );
            })}

            {/* Simple geometric wall patterns */}
            {decorationChance > 0.4 && (
                <g>
                    {/* Single decorative band with triangular pattern */}
                    <rect x={cx - wallRadius * 0.8} y={wallY + wallHeight * 0.5} 
                        width={wallRadius * 1.6} height={wallHeight * 0.08} 
                        fill="none" stroke="#8B4513" strokeWidth="1" opacity="0.7"/>
                    
                    {/* Simple triangle pattern */}
                    {[...Array(3)].map((_, i) => (
                        <polygon key={`triangle-${i}`}
                            points={`${cx + (i - 1) * wallRadius * 0.5},${wallY + wallHeight * 0.48} 
                                     ${cx + (i - 1) * wallRadius * 0.5 - size * 0.025},${wallY + wallHeight * 0.58} 
                                     ${cx + (i - 1) * wallRadius * 0.5 + size * 0.025},${wallY + wallHeight * 0.58}`}
                            fill={i === 1 ? "#CD853F" : "#A0522D"} 
                            opacity="0.8"/>
                    ))}
                </g>
            )}
            
            {/* Night torch lighting */}
            {renderTorchLighting()}
        </g>
    );
});

export default AfricanRoundHut3D;
