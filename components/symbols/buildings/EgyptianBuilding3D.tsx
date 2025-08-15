/**
 * components/symbols/buildings/EgyptianBuilding3D.tsx - Renders a detailed ancient Egyptian building.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface EgyptianBuilding3DProps {
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  size: number; 
  seed: number; 
  tile: Tile; 
  roofColor?: string; 
  nightIntensity?: number;
}

const EgyptianBuilding3D: React.FC<EgyptianBuilding3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 241 + tile.y * 251);
    const uniqueId = `egyptian-building-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const stoneVariation = Array.from({length: 12}, () => rng.random());
    const columnVariation = Array.from({length: 4}, () => rng.random());
    const hieroglyphChance = rng.random();
    const palmDecoration = rng.random();
    
    const cx = x + width / 2;
    const buildingWidth = width * 0.9;
    const buildingHeight = height * 0.8;
    const buildingY = y + height * 0.15;
    const depth = size * 0.3;
    
    // Egyptian color palette
    const sandstone = `hsl(40, 45%, ${70 + stoneVariation[0] * 15}%)`;
    const darkStone = `hsl(35, 40%, 45%)`;
    const lightStone = `hsl(45, 50%, 85%)`;
    const shadowStone = `hsl(30, 40%, 35%)`;
    const goldColor = `hsl(45, 85%, 60%)`;
    const redOchre = `hsl(15, 70%, 45%)`;
    const blueEgyptian = `hsl(210, 60%, 40%)`;
    const greenMalachite = `hsl(160, 50%, 35%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`stoneGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={lightStone} />
                    <stop offset="50%" stopColor={sandstone} />
                    <stop offset="100%" stopColor={darkStone} />
                </linearGradient>
                <pattern id={`stoneBlocks-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="6">
                    <rect width="8" height="6" fill={sandstone} />
                    <rect x="0" y="0" width="7.5" height="5.5" fill="none" stroke={darkStone} strokeWidth="0.3" />
                    <rect x="0" y="3" width="7.5" height="2.5" fill="none" stroke={shadowStone} strokeWidth="0.2" />
                </pattern>
                <filter id={`sandTexture-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence baseFrequency="0.6" numOctaves="2" result="noise" seed="5"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/>
                </filter>
            </defs>
            
            {/* Ground shadow */}
            <ellipse cx={cx + 3} cy={y + height + 4} rx={buildingWidth * 0.6} ry={buildingWidth * 0.25} 
                fill="rgba(0,0,0,0.4)" />
            
            {/* Main building base platform */}
            <rect 
                x={cx - buildingWidth * 0.6} 
                y={buildingY + buildingHeight - 8} 
                width={buildingWidth * 1.2} 
                height={12}
                fill={`url(#stoneGradient-${uniqueId})`} 
                stroke={shadowStone} 
                strokeWidth="1" 
            />
            
            {/* Platform 3D perspective */}
            <path 
                d={`M ${cx + buildingWidth * 0.6} ${buildingY + buildingHeight - 8} 
                    L ${cx + buildingWidth * 0.6 + depth} ${buildingY + buildingHeight - 8 - depth * 0.5} 
                    L ${cx + buildingWidth * 0.6 + depth} ${buildingY + buildingHeight + 4 - depth * 0.5} 
                    L ${cx + buildingWidth * 0.6} ${buildingY + buildingHeight + 4} Z`}
                fill={darkStone} 
                stroke={shadowStone} 
                strokeWidth="0.8" 
            />
            
            {/* Main building wall */}
            <rect 
                x={cx - buildingWidth/2} 
                y={buildingY} 
                width={buildingWidth} 
                height={buildingHeight}
                fill={`url(#stoneBlocks-${uniqueId})`} 
                stroke={shadowStone} 
                strokeWidth="1.2" 
                filter={`url(#sandTexture-${uniqueId})`}
            />
            
            {/* Building 3D side wall */}
            <path 
                d={`M ${cx + buildingWidth/2} ${buildingY} 
                    L ${cx + buildingWidth/2 + depth} ${buildingY - depth * 0.5} 
                    L ${cx + buildingWidth/2 + depth} ${buildingY + buildingHeight - depth * 0.5} 
                    L ${cx + buildingWidth/2} ${buildingY + buildingHeight} Z`}
                fill={darkStone} 
                stroke={shadowStone} 
                strokeWidth="1" 
            />
            
            {/* Papyrus columns */}
            {Array.from({length: 4}).map((_, i) => {
                const columnX = cx + (i - 1.5) * (buildingWidth / 4);
                const columnHeight = buildingHeight * 0.9;
                const columnWidth = size * 0.04;
                
                return (
                    <g key={`column-${i}`}>
                        {/* Column base */}
                        <rect 
                            x={columnX - columnWidth} 
                            y={buildingY + buildingHeight - 8} 
                            width={columnWidth * 2} 
                            height={6}
                            fill={lightStone} 
                            stroke={shadowStone} 
                            strokeWidth="0.4" 
                        />
                        
                        {/* Column shaft */}
                        <rect 
                            x={columnX - columnWidth * 0.6} 
                            y={buildingY + buildingHeight - columnHeight} 
                            width={columnWidth * 1.2} 
                            height={columnHeight - 8}
                            fill={`url(#stoneGradient-${uniqueId})`} 
                            stroke={shadowStone} 
                            strokeWidth="0.6" 
                        />
                        
                        {/* Papyrus capital */}
                        <ellipse 
                            cx={columnX} 
                            cy={buildingY + buildingHeight - columnHeight} 
                            rx={columnWidth * 1.5} 
                            ry={columnWidth}
                            fill={greenMalachite} 
                            stroke={shadowStone} 
                            strokeWidth="0.4" 
                        />
                        
                        {/* Papyrus leaves */}
                        {Array.from({length: 6}).map((_, j) => {
                            const leafAngle = (j / 6) * Math.PI * 2;
                            const leafX = columnX + Math.cos(leafAngle) * columnWidth * 1.2;
                            const leafY = buildingY + buildingHeight - columnHeight - columnWidth * 0.5;
                            
                            return (
                                <line key={`leaf-${i}-${j}`}
                                    x1={columnX} y1={buildingY + buildingHeight - columnHeight}
                                    x2={leafX} y2={leafY}
                                    stroke={greenMalachite} 
                                    strokeWidth="0.8" 
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </g>
                );
            })}
            
            {/* Architrave/lintel above columns */}
            <rect 
                x={cx - buildingWidth * 0.55} 
                y={buildingY + buildingHeight * 0.1} 
                width={buildingWidth * 1.1} 
                height={size * 0.05}
                fill={lightStone} 
                stroke={shadowStone} 
                strokeWidth="0.8" 
            />
            
            {/* Central doorway */}
            <rect 
                x={cx - buildingWidth * 0.15} 
                y={buildingY + buildingHeight * 0.3} 
                width={buildingWidth * 0.3} 
                height={buildingHeight * 0.7}
                fill={shadowStone} 
                stroke={darkStone} 
                strokeWidth="1" 
            />
            
            {/* Door frame with Egyptian molding */}
            <rect 
                x={cx - buildingWidth * 0.18} 
                y={buildingY + buildingHeight * 0.27} 
                width={buildingWidth * 0.36} 
                height={buildingHeight * 0.76}
                fill="none" 
                stroke={goldColor} 
                strokeWidth="2" 
            />
            
            {/* Door lintel */}
            <rect 
                x={cx - buildingWidth * 0.2} 
                y={buildingY + buildingHeight * 0.25} 
                width={buildingWidth * 0.4} 
                height={size * 0.04}
                fill={lightStone} 
                stroke={goldColor} 
                strokeWidth="0.8" 
            />
            
            {/* Hieroglyphic decorations */}
            {hieroglyphChance > 0.4 && (
                <g>
                    {/* Cartouche above door */}
                    <ellipse 
                        cx={cx} 
                        cy={buildingY + buildingHeight * 0.15} 
                        rx={buildingWidth * 0.12} 
                        ry={size * 0.03}
                        fill="none" 
                        stroke={goldColor} 
                        strokeWidth="1.5" 
                    />
                    
                    {/* Hieroglyphic symbols */}
                    {Array.from({length: 8}).map((_, i) => {
                        const symbolX = cx + (i - 3.5) * (buildingWidth / 8);
                        const symbolY = buildingY + buildingHeight * 0.6;
                        const colors = [redOchre, blueEgyptian, goldColor, greenMalachite];
                        const color = colors[i % 4];
                        
                        return (
                            <g key={`hieroglyph-${i}`}>
                                {/* Various Egyptian symbols */}
                                {i % 4 === 0 && (
                                    <circle cx={symbolX} cy={symbolY} r={size * 0.015} 
                                        fill={color} stroke={shadowStone} strokeWidth="0.3" />
                                )}
                                {i % 4 === 1 && (
                                    <rect x={symbolX - size * 0.01} y={symbolY - size * 0.02} 
                                        width={size * 0.02} height={size * 0.04} 
                                        fill={color} stroke={shadowStone} strokeWidth="0.2" />
                                )}
                                {i % 4 === 2 && (
                                    <polygon points={`${symbolX},${symbolY - size * 0.015} ${symbolX + size * 0.015},${symbolY + size * 0.015} ${symbolX - size * 0.015},${symbolY + size * 0.015}`}
                                        fill={color} stroke={shadowStone} strokeWidth="0.2" />
                                )}
                                {i % 4 === 3 && (
                                    <line x1={symbolX - size * 0.015} y1={symbolY} 
                                        x2={symbolX + size * 0.015} y2={symbolY}
                                        stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                                )}
                            </g>
                        );
                    })}
                </g>
            )}
            
            {/* Palm leaf cornice decoration */}
            {palmDecoration > 0.5 && (
                <g>
                    {Array.from({length: 10}).map((_, i) => (
                        <path key={`palm-${i}`}
                            d={`M ${cx - buildingWidth * 0.45 + i * (buildingWidth * 0.9 / 10)} ${buildingY - 2} 
                                C ${cx - buildingWidth * 0.45 + i * (buildingWidth * 0.9 / 10)} ${buildingY - 8}, 
                                ${cx - buildingWidth * 0.45 + i * (buildingWidth * 0.9 / 10) + 3} ${buildingY - 6}`}
                            stroke={greenMalachite} 
                            strokeWidth="1" 
                            fill="none"
                            opacity="0.8"
                        />
                    ))}
                </g>
            )}
            
            {/* Side windows */}
            <g>
                <rect 
                    x={cx - buildingWidth * 0.4} 
                    y={buildingY + buildingHeight * 0.4} 
                    width={buildingWidth * 0.12} 
                    height={buildingHeight * 0.25}
                    fill="rgba(0,0,0,0.8)" 
                    stroke={goldColor} 
                    strokeWidth="0.8" 
                />
                <rect 
                    x={cx + buildingWidth * 0.28} 
                    y={buildingY + buildingHeight * 0.4} 
                    width={buildingWidth * 0.12} 
                    height={buildingHeight * 0.25}
                    fill="rgba(0,0,0,0.8)" 
                    stroke={goldColor} 
                    strokeWidth="0.8" 
                />
            </g>
            
            {/* Roof details */}
            <rect 
                x={cx - buildingWidth * 0.6} 
                y={buildingY - 5} 
                width={buildingWidth * 1.2} 
                height={8}
                fill={lightStone} 
                stroke={shadowStone} 
                strokeWidth="0.8" 
            />
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    <rect 
                        x={cx - buildingWidth * 0.4} 
                        y={buildingY + buildingHeight * 0.4} 
                        width={buildingWidth * 0.12} 
                        height={buildingHeight * 0.25}
                        fill="rgba(255, 180, 80, 0.6)" 
                        opacity={nightIntensity * 0.8}
                    />
                    <rect 
                        x={cx + buildingWidth * 0.28} 
                        y={buildingY + buildingHeight * 0.4} 
                        width={buildingWidth * 0.12} 
                        height={buildingHeight * 0.25}
                        fill="rgba(255, 180, 80, 0.6)" 
                        opacity={nightIntensity * 0.8}
                    />
                    {/* Torch lighting on columns */}
                    {Array.from({length: 2}).map((_, i) => (
                        <circle key={`torch-${i}`}
                            cx={cx + (i === 0 ? -buildingWidth * 0.3 : buildingWidth * 0.3)} 
                            cy={buildingY + buildingHeight * 0.3}
                            r={size * 0.08}
                            fill="rgba(255, 140, 60, 0.7)" 
                            opacity={nightIntensity * 0.6}
                            filter="blur(4px)"
                        />
                    ))}
                </g>
            )}
        </g>
    );
});

export default EgyptianBuilding3D;