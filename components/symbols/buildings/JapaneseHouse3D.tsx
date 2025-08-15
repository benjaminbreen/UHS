/**
 * components/symbols/buildings/JapaneseHouse3D.tsx - Renders a traditional Japanese house with curved roof and wooden construction.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface JapaneseHouse3DProps {
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

const JapaneseHouse3D: React.FC<JapaneseHouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 331 + tile.y * 337);
    const uniqueId = `japanese-house-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const woodVariation = Array.from({length: 6}, () => rng.random());
    const hasGarden = rng.random();
    const roofStyle = rng.random();
    
    const cx = x + width / 2;
    const houseWidth = width * 0.85;
    const houseHeight = height * 0.7;
    const houseY = y + height * 0.25;
    const depth = size * 0.4;
    
    // Traditional Japanese color palette
    const darkWood = `hsl(25, 40%, ${35 + woodVariation[0] * 15}%)`;
    const lightWood = `hsl(30, 30%, ${60 + woodVariation[1] * 10}%)`;
    const naturalWood = `hsl(28, 35%, 45%)`;
    const paperWhite = `hsl(45, 20%, 92%)`;
    const shadowColor = `hsl(20, 50%, 25%)`;
    const grayRoof = roofColor || `hsl(0, 0%, 35%)`;
    const darkGray = `hsl(0, 0%, 25%)`;
    const gardenGreen = `hsl(80, 45%, 30%)`;
    
    // Determine if it's a gabled or hip roof
    const isGabled = roofStyle > 0.5;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`woodGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={lightWood} />
                    <stop offset="50%" stopColor={naturalWood} />
                    <stop offset="100%" stopColor={darkWood} />
                </linearGradient>
                <pattern id={`woodPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="12">
                    <rect width="8" height="12" fill={naturalWood} />
                    <rect x="0" y="0" width="8" height="2" fill={lightWood} stroke={darkWood} strokeWidth="0.1" />
                    <rect x="0" y="3" width="8" height="2" fill={naturalWood} stroke={darkWood} strokeWidth="0.1" />
                    <rect x="0" y="6" width="8" height="2" fill={darkWood} stroke={shadowColor} strokeWidth="0.1" />
                    <rect x="0" y="9" width="8" height="2" fill={lightWood} stroke={darkWood} strokeWidth="0.1" />
                    <line x1="0" y1="0" x2="0" y2="12" stroke={darkWood} strokeWidth="0.3" />
                    <line x1="4" y1="0" x2="4" y2="12" stroke={darkWood} strokeWidth="0.2" />
                </pattern>
            </defs>
            
            {/* Ground shadow */}
            <ellipse cx={cx + 4} cy={y + height + 4} rx={houseWidth * 0.6} ry={houseWidth * 0.25} 
                fill="rgba(0,0,0,0.3)" />
            
            {/* Raised foundation platform */}
            <rect 
                x={cx - houseWidth * 0.55} 
                y={houseY + houseHeight - 5} 
                width={houseWidth * 1.1} 
                height={8}
                fill={darkWood} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Main house structure */}
            <rect 
                x={cx - houseWidth/2} 
                y={houseY} 
                width={houseWidth} 
                height={houseHeight}
                fill={`url(#woodPattern-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* 3D side wall */}
            <path 
                d={`M ${cx + houseWidth/2} ${houseY} 
                    L ${cx + houseWidth/2 + depth} ${houseY - depth * 0.5} 
                    L ${cx + houseWidth/2 + depth} ${houseY + houseHeight - depth * 0.5} 
                    L ${cx + houseWidth/2} ${houseY + houseHeight} Z`}
                fill={darkWood} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Traditional curved Japanese roof */}
            {isGabled ? (
                // Gabled roof style
                <path 
                    d={`M ${cx - houseWidth * 0.65} ${houseY} 
                        L ${cx} ${houseY - houseHeight * 0.5} 
                        L ${cx + houseWidth * 0.65} ${houseY} Z`}
                    fill={grayRoof} 
                    stroke={shadowColor} 
                    strokeWidth="0.8" 
                />
            ) : (
                // Hip roof style with curve
                <path 
                    d={`M ${cx - houseWidth * 0.65} ${houseY} 
                        Q ${cx - houseWidth * 0.3} ${houseY - houseHeight * 0.4} ${cx} ${houseY - houseHeight * 0.5} 
                        Q ${cx + houseWidth * 0.3} ${houseY - houseHeight * 0.4} ${cx + houseWidth * 0.65} ${houseY} Z`}
                    fill={grayRoof} 
                    stroke={shadowColor} 
                    strokeWidth="0.8" 
                />
            )}
            
            {/* Roof 3D perspective */}
            <path 
                d={`M ${cx + houseWidth * 0.65} ${houseY} 
                    L ${cx} ${houseY - houseHeight * 0.5} 
                    L ${cx + depth} ${houseY - houseHeight * 0.5 - depth * 0.5} 
                    L ${cx + houseWidth * 0.65 + depth} ${houseY - depth * 0.5} Z`}
                fill={darkGray} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Traditional roof tiles */}
            {Array.from({length: 7}).map((_, i) => (
                <path key={`tile-${i}`}
                    d={`M ${cx - houseWidth * (0.6 - i * 0.1)} ${houseY - i * houseHeight * 0.06} 
                        Q ${cx} ${houseY - houseHeight * 0.45 - i * houseHeight * 0.06} 
                        ${cx + houseWidth * (0.6 - i * 0.1)} ${houseY - i * houseHeight * 0.06}`}
                    stroke={darkGray} 
                    strokeWidth="0.3" 
                    fill="none"
                    opacity="0.7"
                />
            ))}
            
            {/* Distinctive roof edge (upturned corners) */}
            <path 
                d={`M ${cx - houseWidth * 0.65} ${houseY} 
                    Q ${cx - houseWidth * 0.7} ${houseY - 3} ${cx - houseWidth * 0.6} ${houseY - 5}`}
                stroke={grayRoof} 
                strokeWidth="1.5" 
                fill="none"
            />
            <path 
                d={`M ${cx + houseWidth * 0.65} ${houseY} 
                    Q ${cx + houseWidth * 0.7} ${houseY - 3} ${cx + houseWidth * 0.6} ${houseY - 5}`}
                stroke={grayRoof} 
                strokeWidth="1.5" 
                fill="none"
            />
            
            {/* Wooden support pillars */}
            {Array.from({length: 4}).map((_, i) => {
                const pillarX = cx - houseWidth * 0.3 + i * (houseWidth * 0.2);
                return (
                    <rect key={`pillar-${i}`}
                        x={pillarX - 1} 
                        y={houseY} 
                        width={2} 
                        height={houseHeight}
                        fill={darkWood} 
                        stroke={shadowColor} 
                        strokeWidth="0.4" 
                    />
                );
            })}
            
            {/* Horizontal structural beams */}
            <rect 
                x={cx - houseWidth * 0.45} 
                y={houseY + houseHeight * 0.2} 
                width={houseWidth * 0.9} 
                height={3}
                fill={naturalWood} 
                stroke={shadowColor} 
                strokeWidth="0.5" 
            />
            <rect 
                x={cx - houseWidth * 0.45} 
                y={houseY + houseHeight * 0.6} 
                width={houseWidth * 0.9} 
                height={3}
                fill={naturalWood} 
                stroke={shadowColor} 
                strokeWidth="0.5" 
            />
            
            {/* Sliding paper doors (shoji) */}
            {Array.from({length: 3}).map((_, doorIdx) => {
                const doorX = cx - houseWidth * 0.25 + doorIdx * (houseWidth * 0.25);
                const doorWidth = houseWidth * 0.2;
                const doorHeight = houseHeight * 0.6;
                const doorY = houseY + houseHeight * 0.25;
                
                return (
                    <g key={`door-${doorIdx}`}>
                        {/* Door frame */}
                        <rect 
                            x={doorX} 
                            y={doorY} 
                            width={doorWidth} 
                            height={doorHeight}
                            fill={paperWhite} 
                            stroke={darkWood} 
                            strokeWidth="0.6" 
                        />
                        
                        {/* Grid pattern (traditional shoji) */}
                        <line 
                            x1={doorX + doorWidth * 0.5} 
                            y1={doorY} 
                            x2={doorX + doorWidth * 0.5} 
                            y2={doorY + doorHeight}
                            stroke={darkWood} 
                            strokeWidth="0.3" 
                        />
                        <line 
                            x1={doorX} 
                            y1={doorY + doorHeight * 0.33} 
                            x2={doorX + doorWidth} 
                            y2={doorY + doorHeight * 0.33}
                            stroke={darkWood} 
                            strokeWidth="0.3" 
                        />
                        <line 
                            x1={doorX} 
                            y1={doorY + doorHeight * 0.66} 
                            x2={doorX + doorWidth} 
                            y2={doorY + doorHeight * 0.66}
                            stroke={darkWood} 
                            strokeWidth="0.3" 
                        />
                    </g>
                );
            })}
            
            {/* Traditional Japanese garden (if present) */}
            {hasGarden > 0.4 && (
                <g>
                    <rect 
                        x={cx - houseWidth * 0.2} 
                        y={houseY + houseHeight + 5} 
                        width={houseWidth * 0.4} 
                        height={size * 0.15}
                        fill={gardenGreen} 
                        stroke={darkWood} 
                        strokeWidth="0.5" 
                        opacity="0.7"
                    />
                    
                    {/* Garden stones */}
                    {Array.from({length: 5}).map((_, stoneIdx) => (
                        <circle key={`stone-${stoneIdx}`}
                            cx={cx + (stoneIdx - 2) * houseWidth * 0.06} 
                            cy={houseY + houseHeight + 8 + stoneIdx * size * 0.02}
                            r={size * 0.02}
                            fill={`hsl(0, 0%, ${40 + woodVariation[stoneIdx] * 20}%)`} 
                            stroke={shadowColor} 
                            strokeWidth="0.3" 
                        />
                    ))}
                    
                    {/* Small bridge or stepping stones */}
                    <rect 
                        x={cx - houseWidth * 0.05} 
                        y={houseY + houseHeight + 10} 
                        width={houseWidth * 0.1} 
                        height={2}
                        fill={lightWood} 
                        stroke={darkWood} 
                        strokeWidth="0.4" 
                    />
                </g>
            )}
            
            {/* Traditional lantern */}
            <g>
                <rect 
                    x={cx + houseWidth * 0.3} 
                    y={houseY + houseHeight * 0.4} 
                    width={3} 
                    height={houseHeight * 0.3}
                    fill={darkWood} 
                    stroke={shadowColor} 
                    strokeWidth="0.4" 
                />
                <rect 
                    x={cx + houseWidth * 0.28} 
                    y={houseY + houseHeight * 0.4} 
                    width={7} 
                    height={houseHeight * 0.15}
                    fill={paperWhite} 
                    stroke={darkWood} 
                    strokeWidth="0.5" 
                />
            </g>
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    {/* Lit shoji screens */}
                    {Array.from({length: 2}).map((_, lightIdx) => (
                        <rect key={`light-${lightIdx}`}
                            x={cx - houseWidth * 0.2 + lightIdx * (houseWidth * 0.4)} 
                            y={houseY + houseHeight * 0.25} 
                            width={houseWidth * 0.2} 
                            height={houseHeight * 0.6}
                            fill="rgba(255, 200, 120, 0.6)" 
                            opacity={nightIntensity * 0.8}
                        />
                    ))}
                    
                    {/* Lantern glow */}
                    <circle 
                        cx={cx + houseWidth * 0.32} 
                        cy={houseY + houseHeight * 0.47}
                        r={size * 0.06}
                        fill="rgba(255, 180, 100, 0.7)" 
                        opacity={nightIntensity * 0.9}
                        filter="blur(2px)"
                    />
                </g>
            )}
        </g>
    );
});

export default JapaneseHouse3D;