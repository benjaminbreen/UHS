/**
 * components/symbols/buildings/RomanVilla3D.tsx - Renders a Roman villa with courtyard and columns.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface RomanVilla3DProps {
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

const RomanVilla3D: React.FC<RomanVilla3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 283 + tile.y * 293);
    const uniqueId = `villa-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const marbleVariation = Array.from({length: 6}, () => rng.random());
    const hasPool = rng.random();
    const columnCount = 4 + Math.floor(rng.random() * 3); // 4-6 columns
    
    const cx = x + width / 2;
    const villaWidth = width * 0.95;
    const villaHeight = height * 0.8;
    const villaY = y + height * 0.15;
    const depth = size * 0.4;
    
    // Roman villa color palette
    const romanMarble = `hsl(40, 20%, ${85 + marbleVariation[0] * 10}%)`;
    const darkMarble = `hsl(35, 25%, 65%)`;
    const lightMarble = `hsl(45, 15%, 95%)`;
    const romanRed = `hsl(15, 70%, 45%)`;
    const romanGold = `hsl(45, 80%, 60%)`;
    const shadowColor = `hsl(30, 30%, 40%)`;
    const tileRed = roofColor || `hsl(10, 65%, 40%)`;
    const courtyardGreen = `hsl(80, 40%, 35%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`marbleGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={lightMarble} />
                    <stop offset="50%" stopColor={romanMarble} />
                    <stop offset="100%" stopColor={darkMarble} />
                </linearGradient>
                <pattern id={`marblePattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="12" height="8">
                    <rect width="12" height="8" fill={romanMarble} />
                    <path d="M 0 4 Q 6 2, 12 4" stroke={lightMarble} strokeWidth="0.5" opacity="0.7" />
                    <path d="M 0 6 Q 6 8, 12 6" stroke={darkMarble} strokeWidth="0.3" opacity="0.5" />
                    <circle cx="3" cy="3" r="0.8" fill={lightMarble} opacity="0.4" />
                    <circle cx="9" cy="6" r="0.6" fill={darkMarble} opacity="0.3" />
                </pattern>
            </defs>
            
            {/* Ground shadow - subtle positioning */}
            <ellipse cx={cx + 1} cy={y + height + 2} rx={villaWidth * 0.8} ry={villaWidth * 0.35}
                fill="rgba(0,0,0,0.25)" filter="blur(1px)" />
            
            {/* Outer walls forming courtyard */}
            {/* North wing */}
            <rect 
                x={cx - villaWidth/2} 
                y={villaY} 
                width={villaWidth} 
                height={villaHeight * 0.25}
                fill={`url(#marblePattern-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* East wing */}
            <rect 
                x={cx + villaWidth * 0.3} 
                y={villaY + villaHeight * 0.25} 
                width={villaWidth * 0.2} 
                height={villaHeight * 0.5}
                fill={`url(#marblePattern-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* West wing */}
            <rect 
                x={cx - villaWidth/2} 
                y={villaY + villaHeight * 0.25} 
                width={villaWidth * 0.2} 
                height={villaHeight * 0.5}
                fill={`url(#marblePattern-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* South wing */}
            <rect 
                x={cx - villaWidth/2} 
                y={villaY + villaHeight * 0.75} 
                width={villaWidth} 
                height={villaHeight * 0.25}
                fill={`url(#marblePattern-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* 3D perspective for main building */}
            <path 
                d={`M ${cx + villaWidth/2} ${villaY} 
                    L ${cx + villaWidth/2 + depth} ${villaY - depth * 0.5} 
                    L ${cx + villaWidth/2 + depth} ${villaY + villaHeight - depth * 0.5} 
                    L ${cx + villaWidth/2} ${villaY + villaHeight} Z`}
                fill={darkMarble} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Central courtyard */}
            <rect 
                x={cx - villaWidth * 0.25} 
                y={villaY + villaHeight * 0.3} 
                width={villaWidth * 0.5} 
                height={villaHeight * 0.4}
                fill={courtyardGreen} 
                stroke={shadowColor} 
                strokeWidth="0.6" 
                opacity="0.7"
            />
            
            {/* Central pool/impluvium */}
            {hasPool > 0.5 && (
                <rect 
                    x={cx - villaWidth * 0.15} 
                    y={villaY + villaHeight * 0.4} 
                    width={villaWidth * 0.3} 
                    height={villaHeight * 0.2}
                    fill="hsl(200, 60%, 50%)" 
                    stroke="hsl(200, 60%, 30%)" 
                    strokeWidth="0.6" 
                    opacity="0.8"
                />
            )}
            
            {/* Colonnade around courtyard */}
            {Array.from({length: columnCount}).map((_, i) => {
                const columnSpacing = villaWidth * 0.8 / (columnCount - 1);
                const columnX = cx - villaWidth * 0.4 + i * columnSpacing;
                const columnY = villaY + villaHeight * 0.25;
                const columnHeight = villaHeight * 0.5;
                
                return (
                    <g key={`column-${i}`}>
                        {/* Column base */}
                        <rect 
                            x={columnX - 2} 
                            y={columnY + columnHeight - 3} 
                            width={4} 
                            height={3}
                            fill={lightMarble} 
                            stroke={shadowColor} 
                            strokeWidth="0.3" 
                        />
                        
                        {/* Column shaft */}
                        <rect 
                            x={columnX - 1.5} 
                            y={columnY} 
                            width={3} 
                            height={columnHeight}
                            fill={`url(#marbleGradient-${uniqueId})`} 
                            stroke={shadowColor} 
                            strokeWidth="0.4" 
                        />
                        
                        {/* Column fluting */}
                        {Array.from({length: 3}).map((_, flute) => (
                            <line key={`flute-${i}-${flute}`}
                                x1={columnX - 1 + flute * 0.7} 
                                y1={columnY} 
                                x2={columnX - 1 + flute * 0.7} 
                                y2={columnY + columnHeight}
                                stroke={darkMarble} 
                                strokeWidth="0.2" 
                                opacity="0.6"
                            />
                        ))}
                        
                        {/* Corinthian capital */}
                        <rect 
                            x={columnX - 2.5} 
                            y={columnY - 3} 
                            width={5} 
                            height={3}
                            fill={romanGold} 
                            stroke={shadowColor} 
                            strokeWidth="0.4" 
                        />
                        
                        {/* Capital decoration */}
                        <circle 
                            cx={columnX - 1} 
                            cy={columnY - 1.5} 
                            r={0.5}
                            fill={lightMarble} 
                        />
                        <circle 
                            cx={columnX + 1} 
                            cy={columnY - 1.5} 
                            r={0.5}
                            fill={lightMarble} 
                        />
                    </g>
                );
            })}
            
            {/* Entablature above columns */}
            <rect 
                x={cx - villaWidth * 0.45} 
                y={villaY + villaHeight * 0.22} 
                width={villaWidth * 0.9} 
                height={4}
                fill={lightMarble} 
                stroke={shadowColor} 
                strokeWidth="0.6" 
            />
            
            {/* Red tile roofs */}
            {/* North wing roof */}
            <path 
                d={`M ${cx - villaWidth * 0.55} ${villaY} 
                    L ${cx + villaWidth * 0.55} ${villaY} 
                    L ${cx + villaWidth * 0.55 + depth} ${villaY - depth * 0.5} 
                    L ${cx - villaWidth * 0.55 + depth} ${villaY - depth * 0.5} Z`}
                fill={tileRed} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* South wing roof */}
            <path 
                d={`M ${cx - villaWidth * 0.55} ${villaY + villaHeight * 0.75} 
                    L ${cx + villaWidth * 0.55} ${villaY + villaHeight * 0.75} 
                    L ${cx + villaWidth * 0.55 + depth} ${villaY + villaHeight * 0.75 - depth * 0.5} 
                    L ${cx - villaWidth * 0.55 + depth} ${villaY + villaHeight * 0.75 - depth * 0.5} Z`}
                fill={tileRed} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Main entrance */}
            <rect 
                x={cx - villaWidth * 0.08} 
                y={villaY + villaHeight * 0.75} 
                width={villaWidth * 0.16} 
                height={villaHeight * 0.25}
                fill={shadowColor} 
                stroke={darkMarble} 
                strokeWidth="0.8" 
            />
            
            {/* Entrance pediment */}
            <path 
                d={`M ${cx - villaWidth * 0.12} ${villaY + villaHeight * 0.75} 
                    L ${cx} ${villaY + villaHeight * 0.7} 
                    L ${cx + villaWidth * 0.12} ${villaY + villaHeight * 0.75} Z`}
                fill={lightMarble} 
                stroke={shadowColor} 
                strokeWidth="0.6" 
            />
            
            {/* Windows in wings */}
            {Array.from({length: 6}).map((_, winIdx) => {
                const isNorth = winIdx < 3;
                const localIdx = winIdx % 3;
                const winX = cx - villaWidth * 0.35 + localIdx * (villaWidth * 0.23);
                const winY = isNorth ? villaY + villaHeight * 0.08 : villaY + villaHeight * 0.82;
                
                return (
                    <g key={`window-${winIdx}`}>
                        <rect 
                            x={winX} 
                            y={winY} 
                            width={villaWidth * 0.08} 
                            height={villaHeight * 0.12}
                            fill="rgba(0,0,0,0.8)" 
                            stroke={lightMarble} 
                            strokeWidth="0.6" 
                        />
                        
                        {/* Window frame decoration */}
                        <rect 
                            x={winX - 1} 
                            y={winY - 1} 
                            width={villaWidth * 0.08 + 2} 
                            height={villaHeight * 0.12 + 2}
                            fill="none" 
                            stroke={romanGold} 
                            strokeWidth="0.4" 
                        />
                    </g>
                );
            })}
            
            {/* Roman decorative elements */}
            {/* Mosaic floor pattern in courtyard */}
            {Array.from({length: 8}).map((_, tileIdx) => (
                <circle key={`mosaic-${tileIdx}`}
                    cx={cx + (tileIdx % 4 - 1.5) * villaWidth * 0.08} 
                    cy={villaY + villaHeight * (0.45 + Math.floor(tileIdx / 4) * 0.1)}
                    r={size * 0.015}
                    fill={tileIdx % 3 === 0 ? romanRed : tileIdx % 3 === 1 ? romanGold : lightMarble} 
                    opacity="0.8"
                />
            ))}
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    {/* Lit windows */}
                    {Array.from({length: 3}).map((_, lightIdx) => (
                        <rect key={`light-${lightIdx}`}
                            x={cx - villaWidth * 0.35 + lightIdx * (villaWidth * 0.23)} 
                            y={villaY + villaHeight * 0.08} 
                            width={villaWidth * 0.08} 
                            height={villaHeight * 0.12}
                            fill="rgba(255, 180, 80, 0.7)" 
                            opacity={nightIntensity * 0.8}
                        />
                    ))}
                    
                    {/* Courtyard torches */}
                    {Array.from({length: 4}).map((_, torchIdx) => (
                        <circle key={`torch-${torchIdx}`}
                            cx={cx + (torchIdx % 2 === 0 ? -villaWidth * 0.2 : villaWidth * 0.2)} 
                            cy={villaY + villaHeight * (torchIdx < 2 ? 0.35 : 0.65)}
                            r={size * 0.06}
                            fill="rgba(255, 140, 60, 0.8)" 
                            opacity={nightIntensity * 0.7}
                            filter="blur(3px)"
                        />
                    ))}
                </g>
            )}
        </g>
    );
});

export default RomanVilla3D;