/**
 * components/symbols/buildings/Igloo3D.tsx - Renders a detailed, painterly Igloo.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface Igloo3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const Igloo3D: React.FC<Igloo3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 43 + tile.y * 47).random;
    const cx = x + width / 2;
    const cy = y + height * 0.9;
    const rx = width * 0.45;
    const ry = height * 0.4;
    const uniqueId = `igloo-${tile.x}-${tile.y}`;

    const baseColor = `hsl(200, 80%, 95%)`;
    const shadowColor = `hsl(210, 50%, 80%)`;
    const highlightColor = `hsl(190, 30%, 98%)`;
    const deepShadowColor = `hsl(220, 30%, 40%)`;
    const lineShadowColor = `hsla(210, 50%, 70%, 0.8)`;
    const outlineColor = `hsl(210, 50%, 60%)`;

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <radialGradient id={`iglooGradient-${uniqueId}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={highlightColor} />
                    <stop offset="60%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={shadowColor} />
                </radialGradient>
                 <pattern id={`iceBlockPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="10" height="10">
                    <path d="M 0 5 C 2.5 2.5, 7.5 2.5, 10 5" stroke={lineShadowColor} strokeWidth="0.5" fill="none" />
                    <path d="M -2.5 10 C 0 7.5, 5 7.5, 7.5 10" stroke={lineShadowColor} strokeWidth="0.5" fill="none" />
                 </pattern>
            </defs>
            {/* Cast Shadow */}
            <ellipse cx={cx + 3} cy={y + height+1} rx={rx*1.2} ry={rx * 0.35} fill="rgba(0,0,0,0.15)" />
      
            {/* Main Dome */}
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#iglooGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.2"/>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#iceBlockPattern-${uniqueId})`} opacity="0.6"/>

            {/* Block Lines */}
            {[...Array(4)].map((_, i) => (
                <ellipse 
                  key={`ring-${i}`} 
                  cx={cx} 
                  cy={cy - i*2.8} 
                  rx={rx * (1 - i*0.12)} 
                  ry={ry * (1 - i*0.22)} 
                  fill="none" 
                  stroke={shadowColor} 
                  strokeWidth="0.4" 
                  opacity={1 - i * 0.2}
                />
            ))}
            
            {/* Entrance Tunnel */}
            <path d={`M ${cx + rx*0.2} ${cy + ry*0.5} C ${cx + rx*0.5} ${cy+ry*0.6}, ${cx+rx*0.7} ${cy+ry*0.5}, ${cx+rx*0.8} ${cy+ry*0.2} L ${cx+rx*0.8} ${cy-ry*0.1} C ${cx+rx*0.7} ${cy-ry*0.2}, ${cx+rx*0.5} ${cy-ry*0.1}, ${cx+rx*0.2} ${cy} Z`} fill={baseColor} stroke={outlineColor} strokeWidth="0.2"/>
            <path d={`M ${cx + rx*0.8} ${cy+ry*0.2} L ${cx+rx*0.8} ${cy-ry*0.1}`} stroke={shadowColor} strokeWidth="2.5"/>
            <ellipse cx={cx + rx*0.8} cy={cy + ry*0.05} rx={rx*0.15} ry={ry*0.3} fill={deepShadowColor} stroke="black" strokeWidth="0.2"/>
        </g>
    );
});

export default Igloo3D;
