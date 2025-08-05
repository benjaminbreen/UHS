/**
 * components/symbols/buildings/Longhouse3D.tsx - Renders a detailed, painterly longhouse.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface Longhouse3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; roofColor: string;
}

const Longhouse3D: React.FC<Longhouse3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor }) => {
    const rand = new ValueNoise(seed + tile.x * 73 + tile.y * 83).random;
    const uniqueId = `longhouse-${tile.x}-${tile.y}`;

    const wallColor = `hsl(30, 30%, ${50 + rand() * 10}%)`;
    const thatchHighlight = `hsl(45, 50%, 70%)`;
    const outlineColor = `hsl(30, 30%, 25%)`;

    const depth = size * 0.4;
    const roofHeight = height * 0.5;

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <pattern id={`woodPlank-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height={height}>
                    <rect width="4" height={height} fill={wallColor} />
                    <line x1="0" y1="0" x2="0" y2={height} stroke={`hsl(30, 30%, 30%)`} strokeWidth="0.6" />
                </pattern>
                <linearGradient id={`thatchGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={thatchHighlight} />
                    <stop offset="100%" stopColor={roofColor} />
                </linearGradient>
            </defs>

            {/* Cast Shadow */}
            <path
                key="shadow-soft"
                d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} l ${width} 0 l ${-depth*0.5} ${depth*0.3} l ${-width} 0 Z`}
                fill="rgba(0,0,0,0.2)"
            />

            {/* Main wall */}
            <rect x={x} y={y} width={width} height={height} fill={`url(#woodPlank-${uniqueId})`} stroke={outlineColor} strokeWidth="0.2"/>
            {/* Side wall */}
            <path d={`M ${x + width} ${y} L ${x + width + depth} ${y - depth*0.5} L ${x + width + depth} ${y + height - depth*0.5} L ${x + width} ${y + height} Z`} fill={`url(#woodPlank-${uniqueId})`} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.2"/>
            
            {/* Roof */}
            <path d={`M ${x-2} ${y} Q ${x + width/2} ${y - roofHeight}, ${x + width+2} ${y} L ${x+width+2+depth} ${y-depth*0.5} Q ${x+width/2+depth} ${y-roofHeight-depth*0.5}, ${x-2+depth} ${y-depth*0.5} Z`} fill={`url(#thatchGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>
            
            {/* Smoke Hole */}
            <rect x={x + width*0.5 - 2} y={y - roofHeight*0.8} width="4" height="2" fill="#4a2c17" stroke={outlineColor} strokeWidth="0.2"/>

            {/* Door */}
            <rect x={x + width*0.1} y={y + height*0.4} width={width*0.15} height={height*0.6} fill="#4a2c17" stroke="black" strokeWidth="0.3"/>
        </g>
    );
});

export default Longhouse3D;
