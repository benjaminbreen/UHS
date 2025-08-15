/**
 * components/symbols/buildings/SouthAsianTemple3D.tsx - Renders a detailed ornate South Asian building/temple in 2.5D isometric.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface SouthAsianTemple3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const SouthAsianTemple3D: React.FC<SouthAsianTemple3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rng = new ValueNoise(seed + tile.x * 137 + tile.y * 149);
    const uniqueId = `temple-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const rand1 = rng.random();
    const rand2 = rng.random();
    const rand3 = rng.random();
    
    // 2.5D Isometric dimensions
    const buildingWidth = width * 0.75;
    const buildingHeight = height * 0.8;
    const buildingDepth = width * 0.35;
    const buildingX = x - buildingWidth * 0.35;
    const buildingY = y + height * 0.05;
    
    // Color scheme - rich and ornate
    const baseColor = `hsl(30, 45%, ${75 + rand1 * 10}%)`;
    const shadowColor = `hsl(30, 45%, 60%)`;
    const deepShadowColor = `hsl(30, 45%, 45%)`;
    const goldColor = `hsl(45, 85%, 65%)`;
    const redAccent = `hsl(0, 70%, ${50 + rand2 * 10}%)`;
    const greenAccent = `hsl(140, 60%, ${40 + rand3 * 10}%)`;
    const whiteMarble = `hsl(40, 20%, 92%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`templeGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={whiteMarble} />
                    <stop offset="50%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={shadowColor} />
                </linearGradient>
                <pattern id={`ornatePattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6">
                    <circle cx="3" cy="3" r="1" fill={goldColor} opacity="0.7"/>
                    <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke={redAccent} strokeWidth="0.3" opacity="0.5"/>
                </pattern>
            </defs>
            
            {/* Ground shadow for 3D effect */}
            <path 
                d={`M ${buildingX} ${buildingY + buildingHeight} 
                   L ${buildingX + buildingWidth} ${buildingY + buildingHeight}
                   L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight + buildingDepth * 0.3}
                   L ${buildingX + buildingDepth * 0.5} ${buildingY + buildingHeight + buildingDepth * 0.3} Z`}
                fill="rgba(0,0,0,0.3)" 
            />
            
            {/* Multi-tiered base platform */}
            <rect
                x={buildingX - 5}
                y={buildingY + buildingHeight * 0.85}
                width={buildingWidth + 10}
                height={buildingHeight * 0.15}
                fill={shadowColor}
                stroke={deepShadowColor}
                strokeWidth="0.5"
            />
            
            {/* Platform side (3D) */}
            <path
                d={`M ${buildingX + buildingWidth + 5} ${buildingY + buildingHeight * 0.85}
                   L ${buildingX + buildingWidth + 5 + buildingDepth * 0.4} ${buildingY + buildingHeight * 0.85 - buildingDepth * 0.2}
                   L ${buildingX + buildingWidth + 5 + buildingDepth * 0.4} ${buildingY + buildingHeight - buildingDepth * 0.2}
                   L ${buildingX + buildingWidth + 5} ${buildingY + buildingHeight} Z`}
                fill={deepShadowColor}
                stroke={deepShadowColor}
                strokeWidth="0.3"
            />
            
            {/* Main building structure */}
            <rect
                x={buildingX}
                y={buildingY + buildingHeight * 0.4}
                width={buildingWidth}
                height={buildingHeight * 0.45}
                fill={`url(#templeGradient-${uniqueId})`}
                stroke={deepShadowColor}
                strokeWidth="0.5"
            />
            
            {/* Building side wall (3D) */}
            <path
                d={`M ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.4}
                   L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight * 0.4 - buildingDepth * 0.25}
                   L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight * 0.85 - buildingDepth * 0.25}
                   L ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.85} Z`}
                fill={shadowColor}
                stroke={deepShadowColor}
                strokeWidth="0.5"
            />
            
            {/* Ornate columns/pillars */}
            {Array.from({ length: 4 }).map((_, i) => {
                const pillarX = buildingX + buildingWidth * (0.15 + i * 0.23);
                return (
                    <g key={`pillar-${i}`}>
                        <rect
                            x={pillarX}
                            y={buildingY + buildingHeight * 0.45}
                            width={buildingWidth * 0.04}
                            height={buildingHeight * 0.4}
                            fill={whiteMarble}
                            stroke={shadowColor}
                            strokeWidth="0.3"
                        />
                        {/* Pillar capitals */}
                        <ellipse
                            cx={pillarX + buildingWidth * 0.02}
                            cy={buildingY + buildingHeight * 0.45}
                            rx={buildingWidth * 0.03}
                            ry={buildingHeight * 0.02}
                            fill={goldColor}
                        />
                    </g>
                );
            })}
            
            {/* Curved dome/shikhara tower */}
            <path
                d={`M ${buildingX + buildingWidth * 0.2} ${buildingY + buildingHeight * 0.4}
                   Q ${buildingX + buildingWidth * 0.3} ${buildingY - buildingHeight * 0.1}
                   ${buildingX + buildingWidth * 0.5} ${buildingY}
                   Q ${buildingX + buildingWidth * 0.7} ${buildingY - buildingHeight * 0.1}
                   ${buildingX + buildingWidth * 0.8} ${buildingY + buildingHeight * 0.4}
                   Z`}
                fill={redAccent}
                stroke={deepShadowColor}
                strokeWidth="0.5"
            />
            
            {/* Dome side (3D effect) */}
            <path
                d={`M ${buildingX + buildingWidth * 0.8} ${buildingY + buildingHeight * 0.4}
                   Q ${buildingX + buildingWidth * 0.85} ${buildingY - buildingHeight * 0.05}
                   ${buildingX + buildingWidth * 0.5 + buildingDepth * 0.3} ${buildingY - buildingDepth * 0.15}
                   L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight * 0.4 - buildingDepth * 0.25}
                   Z`}
                fill={`hsl(0, 70%, ${40 + rand2 * 10}%)`}
                stroke={deepShadowColor}
                strokeWidth="0.3"
            />
            
            {/* Decorative patterns on dome */}
            <path
                d={`M ${buildingX + buildingWidth * 0.2} ${buildingY + buildingHeight * 0.4}
                   Q ${buildingX + buildingWidth * 0.3} ${buildingY - buildingHeight * 0.1}
                   ${buildingX + buildingWidth * 0.5} ${buildingY}
                   Q ${buildingX + buildingWidth * 0.7} ${buildingY - buildingHeight * 0.1}
                   ${buildingX + buildingWidth * 0.8} ${buildingY + buildingHeight * 0.4}
                   Z`}
                fill={`url(#ornatePattern-${uniqueId})`}
                opacity="0.4"
            />
            
            {/* Golden finial/kalasha on top */}
            <ellipse
                cx={buildingX + buildingWidth * 0.5}
                cy={buildingY - 2}
                rx={buildingWidth * 0.05}
                ry={buildingHeight * 0.03}
                fill={goldColor}
                stroke={deepShadowColor}
                strokeWidth="0.3"
            />
            <line
                x1={buildingX + buildingWidth * 0.5}
                y1={buildingY - 2}
                x2={buildingX + buildingWidth * 0.5}
                y2={buildingY - 8}
                stroke={goldColor}
                strokeWidth="1.5"
            />
            <circle
                cx={buildingX + buildingWidth * 0.5}
                cy={buildingY - 8}
                r="2"
                fill={goldColor}
            />
            
            {/* Ornate entrance arch */}
            <path
                d={`M ${buildingX + buildingWidth * 0.4} ${buildingY + buildingHeight * 0.85}
                   V ${buildingY + buildingHeight * 0.6}
                   Q ${buildingX + buildingWidth * 0.5} ${buildingY + buildingHeight * 0.55}
                   ${buildingX + buildingWidth * 0.6} ${buildingY + buildingHeight * 0.6}
                   V ${buildingY + buildingHeight * 0.85}
                   Z`}
                fill="rgba(0,0,0,0.8)"
                stroke={goldColor}
                strokeWidth="0.5"
            />
            
            {/* Decorative arch frame */}
            <path
                d={`M ${buildingX + buildingWidth * 0.38} ${buildingY + buildingHeight * 0.6}
                   Q ${buildingX + buildingWidth * 0.5} ${buildingY + buildingHeight * 0.53}
                   ${buildingX + buildingWidth * 0.62} ${buildingY + buildingHeight * 0.6}`}
                fill="none"
                stroke={goldColor}
                strokeWidth="1"
            />
            
            {/* Small decorative windows */}
            {Array.from({ length: 2 }).map((_, i) => {
                const windowX = buildingX + buildingWidth * (0.25 + i * 0.5);
                return (
                    <g key={`window-${i}`}>
                        <path
                            d={`M ${windowX - 3} ${buildingY + buildingHeight * 0.5}
                               Q ${windowX} ${buildingY + buildingHeight * 0.47}
                               ${windowX + 3} ${buildingY + buildingHeight * 0.5}
                               V ${buildingY + buildingHeight * 0.55}
                               H ${windowX - 3}
                               Z`}
                            fill="rgba(0,0,0,0.7)"
                            stroke={goldColor}
                            strokeWidth="0.4"
                        />
                    </g>
                );
            })}
            
            {/* Decorative horizontal bands */}
            <rect
                x={buildingX}
                y={buildingY + buildingHeight * 0.38}
                width={buildingWidth}
                height={buildingHeight * 0.02}
                fill={greenAccent}
                opacity="0.8"
            />
            <rect
                x={buildingX}
                y={buildingY + buildingHeight * 0.83}
                width={buildingWidth}
                height={buildingHeight * 0.02}
                fill={greenAccent}
                opacity="0.8"
            />
        </g>
    );
});

export default SouthAsianTemple3D;