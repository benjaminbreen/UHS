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
    const rand = new ValueNoise(seed + tile.x * 107 + tile.y * 113).random;
    const cx = x + width/2;
    const uniqueId = `teepee-${tile.x}-${tile.y}`;

    const baseColor = `hsl(35, 40%, ${75 + rand()*10}%)`;
    const shadowColor = `hsl(35, 40%, 60%)`;
    const poleColor = `hsl(30, 45%, 40%)`;
    const decoColor1 = `hsl(${rand()*360}, 60%, 50%)`;
    const decoColor2 = `hsl(${rand()*360}, 60%, 50%)`;
    const outlineColor = `hsl(35, 40%, 30%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`teepeeGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0.5">
                    <stop offset="0%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={shadowColor} />
                </linearGradient>
                 <filter id={`teepeeFilter-${uniqueId}`}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.2 0.5" numOctaves="2" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
                </filter>
            </defs>
            {/* Shadow */}
            <ellipse cx={cx + 2} cy={y+height} rx={width/2 * 0.8} ry={width/4} fill="rgba(0,0,0,0.2)" />

            {/* Poles */}
            {[...Array(6)].map((_, i) => (
                <line key={`pole-${i}`} x1={cx} y1={y+2} x2={cx + (i-2.5)*1.5 + (rand()-0.5)*2} y2={y - 5 - rand()*3} stroke={poleColor} strokeWidth="1" />
            ))}

            {/* Main Cone */}
            <path d={`M ${cx - width/2} ${y+height} L ${cx} ${y} L ${cx + width/2} ${y+height} Z`} fill={`url(#teepeeGradient-${uniqueId})`} filter={`url(#teepeeFilter-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>

      
            {/* Entrance */}
            <path d={`M ${cx - width*0.1} ${y+height} A ${width*0.15} ${height*0.4} 0 0 1 ${cx + width*0.1} ${y+height} Z`} fill="#4a2c17" stroke="black" strokeWidth="0.3"/>

            {/* Smoke Flaps */}
            <path d={`M ${cx} ${y} L ${cx-3} ${y+5} L ${cx-5-rand()*2} ${y+2} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2"/>
            <path d={`M ${cx} ${y} L ${cx+3} ${y+5} L ${cx+5+rand()*2} ${y+2} Z`} fill={baseColor} stroke={outlineColor} strokeWidth="0.2"/>

            {/* Decorative Bands */}
            <path d={`M ${cx - width/2*0.8} ${y+height*0.8} L ${cx+width/2*0.8} ${y+height*0.8}`} stroke={decoColor1} strokeWidth="1.2" />
            <path d={`M ${cx - width/2*0.85} ${y+height*0.85} L ${cx+width/2*0.85} ${y+height*0.85}`} stroke={decoColor2} strokeWidth="1.5" />

        </g>
    );
});

export default NativeTeepee3D;
