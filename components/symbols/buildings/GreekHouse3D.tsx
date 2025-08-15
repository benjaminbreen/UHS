/**
 * components/symbols/buildings/GreekHouse3D.tsx - Renders a classical Greek house with columns and courtyard.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface GreekHouse3DProps {
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

const GreekHouse3D: React.FC<GreekHouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 307 + tile.y * 311);
    const uniqueId = `greek-house-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const stoneVariation = Array.from({length: 6}, () => rng.random());
    const hasCourtyard = rng.random();
    const columnStyle = rng.random();
    
    const cx = x + width / 2;
    const houseWidth = width * 0.9;
    const houseHeight = height * 0.75;
    const houseY = y + height * 0.2;
    const depth = size * 0.35;
    
    // Classical Greek color palette
    const whiteMarble = `hsl(40, 15%, ${90 + stoneVariation[0] * 8}%)`;
    const creamStone = `hsl(45, 25%, ${80 + stoneVariation[1] * 10}%)`;
    const darkStone = `hsl(35, 30%, 55%)`;
    const shadowColor = `hsl(30, 35%, 40%)`;
    const terracottaRoof = roofColor || `hsl(15, 70%, 50%)`;
    const terracottaDark = `hsl(15, 70%, 35%)`;
    const courtyardGreen = `hsl(80, 40%, 30%)`;
    
    // Determine if Doric or Ionic columns
    const isDoric = columnStyle > 0.5;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`stoneGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={whiteMarble} />
                    <stop offset="50%" stopColor={creamStone} />
                    <stop offset="100%" stopColor={darkStone} />
                </linearGradient>
                <pattern id={`greekStone-${uniqueId}`} patternUnits="userSpaceOnUse" width="10" height="6">
                    <rect width="10" height="6" fill={creamStone} />
                    <rect x="0" y="0" width="4.8" height="2.8" fill={whiteMarble} stroke={darkStone} strokeWidth="0.1" />
                    <rect x="5.2" y="0" width="4.8" height="2.8" fill={creamStone} stroke={darkStone} strokeWidth="0.1" />
                    <rect x="2.6" y="3.2" width="4.8" height="2.8" fill={darkStone} stroke={shadowColor} strokeWidth="0.1" />
                </pattern>
            </defs>
            
            {/* Ground shadow */}
            <ellipse cx={cx + 4} cy={y + height + 4} rx={houseWidth * 0.7} ry={houseWidth * 0.3} 
                fill="rgba(0,0,0,0.3)" />
            
            {/* Main house structure */}
            <rect 
                x={cx - houseWidth/2} 
                y={houseY} 
                width={houseWidth} 
                height={houseHeight}
                fill={`url(#greekStone-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* 3D side wall */}
            <path 
                d={`M ${cx + houseWidth/2} ${houseY} 
                    L ${cx + houseWidth/2 + depth} ${houseY - depth * 0.5} 
                    L ${cx + houseWidth/2 + depth} ${houseY + houseHeight - depth * 0.5} 
                    L ${cx + houseWidth/2} ${houseY + houseHeight} Z`}
                fill={darkStone} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Raised foundation/platform */}
            <rect 
                x={cx - houseWidth * 0.55} 
                y={houseY + houseHeight - 4} 
                width={houseWidth * 1.1} 
                height={6}
                fill={darkStone} 
                stroke={shadowColor} 
                strokeWidth="0.6" 
            />
            
            {/* Front colonnade/portico */}
            {Array.from({length: 4}).map((_, i) => {
                const columnX = cx - houseWidth * 0.3 + i * (houseWidth * 0.2);
                const columnHeight = houseHeight * 0.8;
                const columnY = houseY + houseHeight * 0.1;
                
                return (
                    <g key={`column-${i}`}>
                        {/* Column base */}
                        <rect 
                            x={columnX - 2} 
                            y={columnY + columnHeight - 3} 
                            width={4} 
                            height={3}
                            fill={whiteMarble} 
                            stroke={shadowColor} 
                            strokeWidth="0.3" 
                        />
                        
                        {/* Column shaft */}
                        <rect 
                            x={columnX - 1.5} 
                            y={columnY} 
                            width={3} 
                            height={columnHeight}
                            fill={`url(#stoneGradient-${uniqueId})`} 
                            stroke={shadowColor} 
                            strokeWidth="0.5" 
                        />
                        
                        {/* Column fluting (Greek characteristic) */}
                        {Array.from({length: 4}).map((_, flute) => (
                            <line key={`flute-${i}-${flute}`}
                                x1={columnX - 1.2 + flute * 0.8} 
                                y1={columnY + 2} 
                                x2={columnX - 1.2 + flute * 0.8} 
                                y2={columnY + columnHeight - 2}
                                stroke={darkStone} 
                                strokeWidth="0.2" 
                                opacity="0.7"
                            />
                        ))}
                        
                        {/* Capital - Doric or Ionic */}
                        {isDoric ? (
                            // Doric capital (simple)
                            <rect 
                                x={columnX - 2.5} 
                                y={columnY - 3} 
                                width={5} 
                                height={3}
                                fill={whiteMarble} 
                                stroke={shadowColor} 
                                strokeWidth="0.4" 
                            />
                        ) : (
                            // Ionic capital (with scrolls)
                            <g>
                                <rect 
                                    x={columnX - 3} 
                                    y={columnY - 3} 
                                    width={6} 
                                    height={3}
                                    fill={whiteMarble} 
                                    stroke={shadowColor} 
                                    strokeWidth="0.4" 
                                />
                                {/* Ionic scrolls */}
                                <circle 
                                    cx={columnX - 2} 
                                    cy={columnY - 1.5} 
                                    r={0.8}
                                    fill="none" 
                                    stroke={darkStone} 
                                    strokeWidth="0.4"
                                />
                                <circle 
                                    cx={columnX + 2} 
                                    cy={columnY - 1.5} 
                                    r={0.8}
                                    fill="none" 
                                    stroke={darkStone} 
                                    strokeWidth="0.4"
                                />
                            </g>
                        )}
                    </g>
                );
            })}
            
            {/* Entablature above columns */}
            <rect 
                x={cx - houseWidth * 0.4} 
                y={houseY + houseHeight * 0.05} 
                width={houseWidth * 0.8} 
                height={5}
                fill={whiteMarble} 
                stroke={shadowColor} 
                strokeWidth="0.6" 
            />
            
            {/* Frieze decoration */}
            {Array.from({length: 6}).map((_, i) => (
                <rect key={`triglyphs-${i}`}
                    x={cx - houseWidth * 0.35 + i * (houseWidth * 0.12)} 
                    y={houseY + houseHeight * 0.06} 
                    width={houseWidth * 0.04} 
                    height={3}
                    fill={darkStone} 
                    opacity="0.7"
                />
            ))}
            
            {/* Pediment (triangular roof element) */}
            <path 
                d={`M ${cx - houseWidth * 0.45} ${houseY + houseHeight * 0.05} 
                    L ${cx} ${houseY - houseHeight * 0.15} 
                    L ${cx + houseWidth * 0.45} ${houseY + houseHeight * 0.05} Z`}
                fill={whiteMarble} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Terracotta roof */}
            <path 
                d={`M ${cx - houseWidth * 0.6} ${houseY} 
                    L ${cx} ${houseY - houseHeight * 0.4} 
                    L ${cx + houseWidth * 0.6} ${houseY} Z`}
                fill={terracottaRoof} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Roof 3D perspective */}
            <path 
                d={`M ${cx + houseWidth * 0.6} ${houseY} 
                    L ${cx} ${houseY - houseHeight * 0.4} 
                    L ${cx + depth} ${houseY - houseHeight * 0.4 - depth * 0.5} 
                    L ${cx + houseWidth * 0.6 + depth} ${houseY - depth * 0.5} Z`}
                fill={terracottaDark} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Roof tile pattern */}
            {Array.from({length: 5}).map((_, i) => (
                <path key={`tile-${i}`}
                    d={`M ${cx - houseWidth * (0.55 - i * 0.1)} ${houseY - i * houseHeight * 0.07} 
                        L ${cx + houseWidth * (0.55 - i * 0.1)} ${houseY - i * houseHeight * 0.07}`}
                    stroke={terracottaDark} 
                    strokeWidth="0.4" 
                    opacity="0.7"
                />
            ))}
            
            {/* Central doorway */}
            <rect 
                x={cx - houseWidth * 0.08} 
                y={houseY + houseHeight * 0.4} 
                width={houseWidth * 0.16} 
                height={houseHeight * 0.5}
                fill={shadowColor} 
                stroke={darkStone} 
                strokeWidth="0.8" 
            />
            
            {/* Door lintel */}
            <rect 
                x={cx - houseWidth * 0.1} 
                y={houseY + houseHeight * 0.38} 
                width={houseWidth * 0.2} 
                height={3}
                fill={whiteMarble} 
                stroke={shadowColor} 
                strokeWidth="0.5" 
            />
            
            {/* Small courtyard (if present) */}
            {hasCourtyard > 0.4 && (
                <g>
                    <rect 
                        x={cx - houseWidth * 0.15} 
                        y={houseY + houseHeight + 3} 
                        width={houseWidth * 0.3} 
                        height={size * 0.1}
                        fill={courtyardGreen} 
                        stroke={darkStone} 
                        strokeWidth="0.5" 
                        opacity="0.7"
                    />
                    
                    {/* Small altar in courtyard */}
                    <rect 
                        x={cx - size * 0.02} 
                        y={houseY + houseHeight + 4} 
                        width={size * 0.04} 
                        height={size * 0.06}
                        fill={whiteMarble} 
                        stroke={shadowColor} 
                        strokeWidth="0.4" 
                    />
                </g>
            )}
            
            {/* Windows */}
            {Array.from({length: 2}).map((_, winIdx) => (
                <g key={`window-${winIdx}`}>
                    <rect 
                        x={cx + (winIdx === 0 ? -houseWidth * 0.3 : houseWidth * 0.15)} 
                        y={houseY + houseHeight * 0.3} 
                        width={houseWidth * 0.1} 
                        height={houseHeight * 0.2}
                        fill="rgba(0,0,0,0.8)" 
                        stroke={whiteMarble} 
                        strokeWidth="0.6" 
                    />
                    
                    {/* Window frame */}
                    <rect 
                        x={cx + (winIdx === 0 ? -houseWidth * 0.32 : houseWidth * 0.13)} 
                        y={houseY + houseHeight * 0.28} 
                        width={houseWidth * 0.14} 
                        height={houseHeight * 0.24}
                        fill="none" 
                        stroke={darkStone} 
                        strokeWidth="0.8" 
                    />
                </g>
            ))}
            
            {/* Greek key pattern decoration */}
            <g stroke={darkStone} strokeWidth="0.4" fill="none" opacity="0.6">
                <path d={`M ${cx - houseWidth * 0.2} ${houseY + houseHeight * 0.15} 
                         L ${cx - houseWidth * 0.15} ${houseY + houseHeight * 0.15} 
                         L ${cx - houseWidth * 0.15} ${houseY + houseHeight * 0.2} 
                         L ${cx - houseWidth * 0.1} ${houseY + houseHeight * 0.2} 
                         L ${cx - houseWidth * 0.1} ${houseY + houseHeight * 0.15}`} />
                <path d={`M ${cx + houseWidth * 0.1} ${houseY + houseHeight * 0.15} 
                         L ${cx + houseWidth * 0.15} ${houseY + houseHeight * 0.15} 
                         L ${cx + houseWidth * 0.15} ${houseY + houseHeight * 0.2} 
                         L ${cx + houseWidth * 0.2} ${houseY + houseHeight * 0.2} 
                         L ${cx + houseWidth * 0.2} ${houseY + houseHeight * 0.15}`} />
            </g>
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    {/* Lit windows */}
                    <rect 
                        x={cx - houseWidth * 0.3} 
                        y={houseY + houseHeight * 0.3} 
                        width={houseWidth * 0.1} 
                        height={houseHeight * 0.2}
                        fill="rgba(255, 180, 100, 0.7)" 
                        opacity={nightIntensity * 0.8}
                    />
                    
                    {/* Oil lamps in colonnade */}
                    {Array.from({length: 2}).map((_, lampIdx) => (
                        <circle key={`lamp-${lampIdx}`}
                            cx={cx + (lampIdx === 0 ? -houseWidth * 0.2 : houseWidth * 0.2)} 
                            cy={houseY + houseHeight * 0.25}
                            r={size * 0.04}
                            fill="rgba(255, 160, 80, 0.8)" 
                            opacity={nightIntensity * 0.7}
                            filter="blur(2px)"
                        />
                    ))}
                </g>
            )}
        </g>
    );
});

export default GreekHouse3D;