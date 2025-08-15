/**
 * components/symbols/buildings/BambooHouse3D.tsx - Renders a detailed bamboo house for tropical regions.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface BambooHouse3DProps {
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

const BambooHouse3D: React.FC<BambooHouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 233 + tile.y * 239);
    const uniqueId = `bamboo-house-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const bambooVariation = Array.from({length: 12}, () => rng.random());
    const leafVariation = Array.from({length: 6}, () => rng.random());
    const platformHeight = rng.random();
    const decorationChance = rng.random();
    
    const cx = x + width / 2;
    const houseWidth = width * 0.9;
    const houseHeight = height * 0.6;
    const houseY = y + height * 0.25;
    const elevation = platformHeight * 8; // Slight elevation
    
    // Color palette
    const bambooGreen = `hsl(60, 40%, ${50 + bambooVariation[0] * 15}%)`;
    const bambooBrown = `hsl(35, 60%, ${40 + bambooVariation[1] * 15}%)`;
    const bambooLight = `hsl(55, 50%, 65%)`;
    const bambooDark = `hsl(30, 50%, 25%)`;
    const leafColor = roofColor || `hsl(80, 60%, ${35 + leafVariation[0] * 15}%)`;
    const leafDark = `hsl(75, 55%, 25%)`;
    const shadowColor = `hsl(25, 40%, 20%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`bambooGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={bambooLight} />
                    <stop offset="30%" stopColor={bambooGreen} />
                    <stop offset="70%" stopColor={bambooBrown} />
                    <stop offset="100%" stopColor={bambooDark} />
                </linearGradient>
                <pattern id={`bambooPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="3" height="8">
                    <rect width="3" height="8" fill={bambooGreen} />
                    <circle cx="1.5" cy="2" r="0.8" fill={bambooLight} opacity="0.6" />
                    <circle cx="1.5" cy="6" r="0.8" fill={bambooLight} opacity="0.6" />
                    <line x1="0" y1="4" x2="3" y2="4" stroke={bambooDark} strokeWidth="0.3" />
                </pattern>
                <pattern id={`leafPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="3">
                    <rect width="4" height="3" fill={leafColor} />
                    <path d="M 0 1.5 L 4 1.5" stroke={leafDark} strokeWidth="0.2" opacity="0.7" />
                    <path d="M 1 0 L 1 3" stroke={leafDark} strokeWidth="0.15" opacity="0.5"/>
                    <path d="M 3 0 L 3 3" stroke={leafDark} strokeWidth="0.15" opacity="0.5"/>
                </pattern>
            </defs>
            
            {/* Ground shadow */}
            <ellipse cx={cx + 2} cy={y + height + 2 + elevation} rx={houseWidth * 0.6} ry={houseWidth * 0.2} 
                fill="rgba(0,0,0,0.3)" />
            
            {/* Platform/foundation */}
            <rect 
                x={cx - houseWidth * 0.55} 
                y={houseY + houseHeight - 5 + elevation} 
                width={houseWidth * 1.1} 
                height={8}
                fill={bambooBrown} 
                stroke={bambooDark} 
                strokeWidth="0.8" 
            />
            
            {/* Platform support posts */}
            {Array.from({length: 4}).map((_, i) => {
                const postX = cx + (i - 1.5) * (houseWidth / 3);
                return (
                    <rect key={`post-${i}`}
                        x={postX - size * 0.01} 
                        y={houseY + houseHeight + 3 + elevation} 
                        width={size * 0.02} 
                        height={12}
                        fill={bambooBrown} 
                        stroke={bambooDark} 
                        strokeWidth="0.3" 
                    />
                );
            })}
            
            {/* Main bamboo wall structure */}
            <rect 
                x={cx - houseWidth/2} 
                y={houseY + elevation} 
                width={houseWidth} 
                height={houseHeight}
                fill={`url(#bambooPattern-${uniqueId})`} 
                stroke={bambooDark} 
                strokeWidth="1.2" 
            />
            
            {/* Vertical bamboo poles detail */}
            {Array.from({length: 12}).map((_, i) => (
                <rect key={`bamboo-${i}`}
                    x={cx - houseWidth/2 + i * (houseWidth / 12)} 
                    y={houseY + elevation} 
                    width={houseWidth / 12 - 1} 
                    height={houseHeight}
                    fill={`url(#bambooGradient-${uniqueId})`} 
                    stroke={bambooDark} 
                    strokeWidth="0.3" 
                    opacity={0.8 + bambooVariation[i] * 0.2}
                />
            ))}
            
            {/* Bamboo joints/nodes */}
            {Array.from({length: 4}).map((_, row) => 
                Array.from({length: 6}).map((_, col) => (
                    <circle key={`node-${row}-${col}`}
                        cx={cx - houseWidth/2 + col * (houseWidth / 6) + houseWidth/12} 
                        cy={houseY + row * (houseHeight / 4) + houseHeight/8 + elevation} 
                        r={size * 0.008}
                        fill={bambooDark} 
                        opacity="0.8"
                    />
                ))
            )}
            
            {/* Thatched roof structure */}
            {/* Main roof triangle */}
            <path 
                d={`M ${cx - houseWidth * 0.7} ${houseY + elevation} 
                    L ${cx} ${houseY - height * 0.4 + elevation} 
                    L ${cx + houseWidth * 0.7} ${houseY + elevation} Z`}
                fill={`url(#leafPattern-${uniqueId})`} 
                stroke={leafDark} 
                strokeWidth="0.8" 
            />
            
            {/* Roof layers for depth */}
            {Array.from({length: 4}).map((_, i) => (
                <path key={`roof-layer-${i}`}
                    d={`M ${cx - houseWidth * (0.65 - i * 0.1)} ${houseY - i * 3 + elevation} 
                        L ${cx} ${houseY - height * 0.35 - i * 2 + elevation} 
                        L ${cx + houseWidth * (0.65 - i * 0.1)} ${houseY - i * 3 + elevation}`}
                    fill="none" 
                    stroke={i % 2 === 0 ? leafColor : leafDark} 
                    strokeWidth="1.2" 
                    opacity="0.7"
                />
            ))}
            
            {/* Roof ridge pole */}
            <rect 
                x={cx - houseWidth * 0.1} 
                y={houseY - height * 0.42 + elevation} 
                width={houseWidth * 0.2} 
                height={size * 0.02}
                fill={bambooBrown} 
                stroke={bambooDark} 
                strokeWidth="0.4" 
            />
            
            {/* Door opening */}
            <rect 
                x={cx - houseWidth * 0.12} 
                y={houseY + houseHeight * 0.3 + elevation} 
                width={houseWidth * 0.24} 
                height={houseHeight * 0.7}
                fill={shadowColor} 
                stroke={bambooDark} 
                strokeWidth="0.8" 
            />
            
            {/* Bamboo door frame */}
            <rect 
                x={cx - houseWidth * 0.14} 
                y={houseY + houseHeight * 0.28 + elevation} 
                width={houseWidth * 0.28} 
                height={houseHeight * 0.74}
                fill="none" 
                stroke={bambooLight} 
                strokeWidth="1.5" 
            />
            
            {/* Door slats */}
            {Array.from({length: 8}).map((_, i) => (
                <rect key={`door-slat-${i}`}
                    x={cx - houseWidth * 0.11} 
                    y={houseY + houseHeight * (0.32 + i * 0.08) + elevation} 
                    width={houseWidth * 0.22} 
                    height={houseHeight * 0.06}
                    fill={bambooBrown} 
                    stroke={bambooDark} 
                    strokeWidth="0.2" 
                    opacity="0.7"
                />
            ))}
            
            {/* Windows */}
            <g>
                {/* Left window */}
                <rect 
                    x={cx - houseWidth * 0.4} 
                    y={houseY + houseHeight * 0.35 + elevation} 
                    width={houseWidth * 0.15} 
                    height={houseHeight * 0.3}
                    fill="rgba(0,0,0,0.7)" 
                    stroke={bambooLight} 
                    strokeWidth="0.8" 
                />
                {/* Right window */}
                <rect 
                    x={cx + houseWidth * 0.25} 
                    y={houseY + houseHeight * 0.35 + elevation} 
                    width={houseWidth * 0.15} 
                    height={houseHeight * 0.3}
                    fill="rgba(0,0,0,0.7)" 
                    stroke={bambooLight} 
                    strokeWidth="0.8" 
                />
                
                {/* Window bamboo slats */}
                {Array.from({length: 4}).map((_, i) => (
                    <g key={`window-slat-${i}`}>
                        <line 
                            x1={cx - houseWidth * 0.4} 
                            y1={houseY + houseHeight * (0.4 + i * 0.05) + elevation} 
                            x2={cx - houseWidth * 0.25} 
                            y2={houseY + houseHeight * (0.4 + i * 0.05) + elevation}
                            stroke={bambooLight} strokeWidth="0.3" 
                        />
                        <line 
                            x1={cx + houseWidth * 0.25} 
                            y1={houseY + houseHeight * (0.4 + i * 0.05) + elevation} 
                            x2={cx + houseWidth * 0.4} 
                            y2={houseY + houseHeight * (0.4 + i * 0.05) + elevation}
                            stroke={bambooLight} strokeWidth="0.3" 
                        />
                    </g>
                ))}
            </g>
            
            {/* Decorative elements */}
            {decorationChance > 0.4 && (
                <g>
                    {/* Woven patterns */}
                    <rect 
                        x={cx - houseWidth * 0.45} 
                        y={houseY + houseHeight * 0.15 + elevation} 
                        width={houseWidth * 0.9} 
                        height={houseHeight * 0.1}
                        fill="none" 
                        stroke={bambooLight} 
                        strokeWidth="0.8" 
                        opacity="0.8"
                    />
                    
                    {/* Geometric diamond pattern */}
                    {Array.from({length: 6}).map((_, i) => (
                        <polygon key={`diamond-${i}`}
                            points={`${cx + (i - 2.5) * (houseWidth / 6)},${houseY + houseHeight * 0.17 + elevation} ${cx + (i - 2.5) * (houseWidth / 6) + 4},${houseY + houseHeight * 0.2 + elevation} ${cx + (i - 2.5) * (houseWidth / 6)},${houseY + houseHeight * 0.23 + elevation} ${cx + (i - 2.5) * (houseWidth / 6) - 4},${houseY + houseHeight * 0.2 + elevation}`}
                            fill={leafColor} 
                            stroke={leafDark} 
                            strokeWidth="0.3" 
                            opacity="0.7"
                        />
                    ))}
                </g>
            )}
            
            {/* Side wall perspective */}
            <path 
                d={`M ${cx + houseWidth/2} ${houseY + elevation} 
                    L ${cx + houseWidth/2 + size * 0.15} ${houseY - size * 0.1 + elevation} 
                    L ${cx + houseWidth/2 + size * 0.15} ${houseY + houseHeight - size * 0.1 + elevation} 
                    L ${cx + houseWidth/2} ${houseY + houseHeight + elevation} Z`}
                fill={bambooBrown} 
                stroke={bambooDark} 
                strokeWidth="0.8" 
                opacity="0.8"
            />
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    <rect 
                        x={cx - houseWidth * 0.4} 
                        y={houseY + houseHeight * 0.35 + elevation} 
                        width={houseWidth * 0.15} 
                        height={houseHeight * 0.3}
                        fill="rgba(255, 200, 80, 0.6)" 
                        opacity={nightIntensity * 0.7}
                    />
                    <rect 
                        x={cx + houseWidth * 0.25} 
                        y={houseY + houseHeight * 0.35 + elevation} 
                        width={houseWidth * 0.15} 
                        height={houseHeight * 0.3}
                        fill="rgba(255, 200, 80, 0.6)" 
                        opacity={nightIntensity * 0.7}
                    />
                </g>
            )}
        </g>
    );
});

export default BambooHouse3D;