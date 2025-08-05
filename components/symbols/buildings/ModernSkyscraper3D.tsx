/**
 * components/symbols/buildings/ModernSkyscraper3D.tsx - Renders a detailed, painterly modern skyscraper.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface ModernSkyscraper3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const ModernSkyscraper3D: React.FC<ModernSkyscraper3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 101 + tile.y * 103).random;
    const uniqueId = `skyscraper-${tile.x}-${tile.y}`;
    
    const skyColor1 = `hsl(200, 80%, ${70 + rand()*20}%)`;
    const skyColor2 = `hsl(220, 70%, ${50 + rand()*20}%)`;
    const frameColor = `hsl(210, 15%, ${30 + rand()*10}%)`;
    const shadowColor = `hsl(220, 30%, 20%)`;
    const outlineColor = `hsl(220, 30%, 10%)`;

    const depth = size * 0.3;
    const buildingHeight = height * (1.2 + rand() * 0.8);
    const buildingY = y + height - buildingHeight;

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`skyReflection-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={skyColor1} />
                    <stop offset="60%" stopColor={skyColor2} />
                    <stop offset="100%" stopColor={frameColor} />
                </linearGradient>
            </defs>
            {/* Cast Shadow */}
            <path
                key="shadow-soft"
                d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} l ${width} 0 l ${-depth*0.5} ${depth*0.3} l ${-width} 0 Z`}
                fill="rgba(0,0,0,0.25)"
            />

            {/* Main Building */}
            <rect x={x} y={buildingY} width={width} height={buildingHeight} fill={`url(#skyReflection-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>
            {/* Side */}
            <path d={`M ${x + width} ${buildingY} L ${x + width + depth} ${buildingY - depth*0.5} L ${x + width + depth} ${y + height - depth*0.5} L ${x + width} ${y + height} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3"/>
            {/* Top */}
            <path d={`M ${x} ${buildingY} L ${x + depth} ${buildingY - depth*0.5} L ${x + width + depth} ${buildingY - depth*0.5} L ${x + width} ${buildingY} Z`} fill={frameColor} stroke={outlineColor} strokeWidth="0.3"/>
      
            {/* Window Grid */}
            {[...Array(Math.floor(buildingHeight/4))].map((_, i) => (
                <line key={`h-${i}`} x1={x} y1={buildingY + i*4} x2={x+width} y2={buildingY + i*4} stroke={frameColor} strokeWidth="0.4" opacity="0.7" />
            ))}
            {[...Array(Math.floor(width/4))].map((_, i) => (
                <line key={`v-${i}`} x1={x + i*4} y1={buildingY} x2={x+i*4} y2={y+height} stroke={frameColor} strokeWidth="0.4" opacity="0.7" />
            ))}

            {/* Top feature */}
            {rand() > 0.6 ? (
                // Antenna
                <line x1={x+width/2} y1={buildingY} x2={x+width/2} y2={buildingY-10} stroke="#a0a0a0" strokeWidth="1.5" />
            ) : (
                // Helipad
                <ellipse cx={x+width/2+depth/2} cy={buildingY-depth*0.25} rx={width/3} ry={width/8} fill="#555" stroke="white" strokeWidth="0.5"/>
            )}
        </g>
    );
});

export default ModernSkyscraper3D;
