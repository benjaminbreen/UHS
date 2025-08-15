/**
 * components/symbols/buildings/NativeTeepee3D.tsx - Renders a detailed, painterly teepee.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface NativeTeepee3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const NativeTeepee3D: React.FC<NativeTeepee3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rng = new ValueNoise(seed + tile.x * 107 + tile.y * 113);
    const cx = x + width/2;
    const uniqueId = `teepee-${tile.x}-${tile.y}`;

    // Pre-calculate all random values to prevent re-rendering
    const rand1 = rng.random();
    const rand2 = rng.random();
    const rand3 = rng.random();
    const rand4 = rng.random();
    const rand5 = rng.random();
    const rand6 = rng.random();

    const baseColor = `hsl(35, 45%, ${65 + rand1*15}%)`;
    const shadowColor = `hsl(35, 50%, 45%)`;
    const poleColor = `hsl(25, 55%, 35%)`;
    // Earth tones and traditional colors for decorations (ochre, sienna, umber)
    const earthTones = [
        `hsl(30, 60%, 35%)`,  // Ochre
        `hsl(20, 55%, 30%)`,  // Sienna
        `hsl(25, 50%, 25%)`,  // Umber
        `hsl(15, 65%, 40%)`,  // Burnt sienna
        `hsl(10, 70%, 35%)`,  // Red ochre
        `hsl(35, 40%, 45%)`   // Yellow ochre
    ];
    const decoColor1 = earthTones[Math.floor(rand2 * earthTones.length)];
    const decoColor2 = earthTones[Math.floor(rand3 * earthTones.length)];
    const outlineColor = `hsl(25, 60%, 25%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`teepeeGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0.5">
                    <stop offset="0%" stopColor={baseColor} />
                    <stop offset="60%" stopColor={`hsl(35, 45%, ${60 + rand1*10}%)`} />
                    <stop offset="100%" stopColor={shadowColor} />
                </linearGradient>
                <filter id={`teepeeFilter-${uniqueId}`}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.15 0.4" numOctaves="2" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
                </filter>
            </defs>
            
            {/* Enhanced shadow */}
            <ellipse cx={cx + 1.5} cy={y+height + 1} rx={width/2 * 0.9} ry={width/4 * 1.2} fill="rgba(0,0,0,0.3)" />

            {/* Background pole bundle */}
            <circle cx={cx} cy={y-3} r="1.5" fill={poleColor} stroke={outlineColor} strokeWidth="0.4"/>

            {/* Extended poles for better visibility */}
            {[...Array(8)].map((_, i) => (
                <line key={`pole-${i}`} 
                    x1={cx + (i-3.5)*0.8} y1={y+2} 
                    x2={cx + (i-3.5)*1.8 + (rand4-0.5)*3} y2={y - 8 - rand5*4} 
                    stroke={poleColor} strokeWidth="1.2" strokeLinecap="round" />
            ))}

            {/* Main cone with enhanced contrast */}
            <path d={`M ${cx - width/2} ${y+height} L ${cx} ${y-2} L ${cx + width/2} ${y+height} Z`} 
                fill={`url(#teepeeGradient-${uniqueId})`} 
                filter={`url(#teepeeFilter-${uniqueId})`} 
                stroke={outlineColor} strokeWidth="1.2"/>

            {/* Inner shadow for depth */}
            <path d={`M ${cx - width/2*0.85} ${y+height*0.95} L ${cx*0.98} ${y*1.02} L ${cx + width/2*0.85} ${y+height*0.95} Z`} 
                fill="rgba(0,0,0,0.1)" />
      
            {/* Enhanced entrance */}
            <path d={`M ${cx - width*0.12} ${y+height} A ${width*0.18} ${height*0.45} 0 0 1 ${cx + width*0.12} ${y+height} Z`} 
                fill="#2d1810" stroke="#1a0f0a" strokeWidth="0.6"/>
            
            {/* Inner entrance detail */}
            <path d={`M ${cx - width*0.08} ${y+height*0.98} A ${width*0.12} ${height*0.3} 0 0 1 ${cx + width*0.08} ${y+height*0.98} Z`} 
                fill="#1a0f0a" />

            {/* Enhanced smoke flaps */}
            <path d={`M ${cx} ${y-2} L ${cx-4} ${y+6} L ${cx-7-rand6*3} ${y+1} Z`} 
                fill={shadowColor} stroke={outlineColor} strokeWidth="0.6"/>
            <path d={`M ${cx} ${y-2} L ${cx+4} ${y+6} L ${cx+7+rand6*3} ${y+1} Z`} 
                fill={baseColor} stroke={outlineColor} strokeWidth="0.6"/>

            {/* Multiple decorative bands with traditional patterns */}
            <path d={`M ${cx - width/2*0.75} ${y+height*0.75} L ${cx+width/2*0.75} ${y+height*0.75}`} 
                stroke={decoColor1} strokeWidth="1.8" strokeLinecap="round" />
            <path d={`M ${cx - width/2*0.8} ${y+height*0.82} L ${cx+width/2*0.8} ${y+height*0.82}`} 
                stroke={decoColor2} strokeWidth="2" strokeLinecap="round" />
            <path d={`M ${cx - width/2*0.85} ${y+height*0.89} L ${cx+width/2*0.85} ${y+height*0.89}`} 
                stroke={earthTones[Math.floor(rand6 * earthTones.length)]} strokeWidth="1.6" strokeLinecap="round" />

            {/* Traditional geometric patterns */}
            {[...Array(4)].map((_, i) => (
                <circle key={`pattern-${i}`} 
                    cx={cx + (i-1.5)*width*0.25} 
                    cy={y+height*0.65} 
                    r="1.5" 
                    fill="none" 
                    stroke={i % 2 === 0 ? decoColor1 : decoColor2} 
                    strokeWidth="0.8" />
            ))}

        </g>
    );
});

export default NativeTeepee3D;
