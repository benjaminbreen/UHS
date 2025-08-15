/**
 * components/symbols/buildings/IncaStoneHouse3D.tsx - Clean Inca stone house with precision-fitted blocks
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface IncaStoneHouse3DProps {
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

const IncaStoneHouse3D: React.FC<IncaStoneHouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 359 + tile.y * 367);
    const uniqueId = `inca-${tile.x}-${tile.y}`;
    
    // Random variations
    const stoneVariation = rng.random();
    const hasWindows = rng.random() > 0.3;
    const roofVariant = rng.random();
    
    // Consistent sizing with other improved buildings
    const houseWidth = width * 0.7;
    const houseHeight = height * 0.6;
    const houseX = x + (width - houseWidth) / 2;
    const houseY = y + height * 0.25;
    
    // Clean Inca color palette
    const stoneColor = `hsl(35, 25%, ${65 + stoneVariation * 10}%)`;
    const stoneDark = `hsl(35, 30%, ${50 + stoneVariation * 8}%)`;
    const thatchColor = roofColor || `hsl(45, 50%, ${58 + roofVariant * 10}%)`;
    const thatchDark = `hsl(40, 45%, 40%)`;
    const windowColor = '#1F1611';
    
    return (
        <g>
            {/* Clean shadow underneath */}
            <ellipse 
                cx={houseX + houseWidth/2} 
                cy={houseY + houseHeight + 2} 
                rx={houseWidth * 0.55} 
                ry={houseHeight * 0.12}
                fill="rgba(0, 0, 0, 0.25)"
                filter="blur(1px)"
            />
            
            <defs>
                {/* Simple stone pattern */}
                <pattern id={`stone-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="6">
                    <rect width="8" height="6" fill={stoneColor} />
                    {/* Clean stone blocks */}
                    <rect x="0" y="0" width="3.8" height="2.8" fill="none" stroke={stoneDark} strokeWidth="0.3" />
                    <rect x="4" y="0" width="3.8" height="2.8" fill="none" stroke={stoneDark} strokeWidth="0.3" />
                    <rect x="0" y="3" width="3.8" height="2.8" fill="none" stroke={stoneDark} strokeWidth="0.3" />
                    <rect x="4" y="3" width="3.8" height="2.8" fill="none" stroke={stoneDark} strokeWidth="0.3" />
                </pattern>
            </defs>
            
            {/* Main stone walls */}
            <rect 
                x={houseX} 
                y={houseY} 
                width={houseWidth} 
                height={houseHeight}
                fill={`url(#stone-${uniqueId})`} 
                stroke={stoneDark} 
                strokeWidth="0.6" 
            />
            
            {/* Simple trapezoidal doorway */}
            <path 
                d={`M ${houseX + houseWidth * 0.35} ${houseY + houseHeight} 
                    L ${houseX + houseWidth * 0.38} ${houseY + houseHeight * 0.5} 
                    L ${houseX + houseWidth * 0.62} ${houseY + houseHeight * 0.5} 
                    L ${houseX + houseWidth * 0.65} ${houseY + houseHeight} 
                    Z`}
                fill={windowColor} 
                stroke={stoneDark} 
                strokeWidth="0.6" 
            />
            
            {/* Simple trapezoidal windows */}
            {hasWindows && (
                <g>
                    <path 
                        d={`M ${houseX + houseWidth * 0.12} ${houseY + houseHeight * 0.5} 
                            L ${houseX + houseWidth * 0.13} ${houseY + houseHeight * 0.25} 
                            L ${houseX + houseWidth * 0.22} ${houseY + houseHeight * 0.25} 
                            L ${houseX + houseWidth * 0.23} ${houseY + houseHeight * 0.5} 
                            Z`}
                        fill={windowColor} 
                        stroke={stoneDark} 
                        strokeWidth="0.5" 
                    />
                    <path 
                        d={`M ${houseX + houseWidth * 0.77} ${houseY + houseHeight * 0.5} 
                            L ${houseX + houseWidth * 0.78} ${houseY + houseHeight * 0.25} 
                            L ${houseX + houseWidth * 0.87} ${houseY + houseHeight * 0.25} 
                            L ${houseX + houseWidth * 0.88} ${houseY + houseHeight * 0.5} 
                            Z`}
                        fill={windowColor} 
                        stroke={stoneDark} 
                        strokeWidth="0.5" 
                    />
                </g>
            )}
            
            {/* Stone detail lines */}
            {[0.2, 0.4, 0.6, 0.8].map((yPos, i) => (
                <line 
                    key={`detail-${i}`}
                    x1={houseX} 
                    y1={houseY + houseHeight * yPos} 
                    x2={houseX + houseWidth} 
                    y2={houseY + houseHeight * yPos}
                    stroke={stoneDark} 
                    strokeWidth="0.2" 
                    opacity="0.4"
                />
            ))}
            
            {/* Clean thatched roof */}
            <path 
                d={`M ${houseX - houseWidth * 0.08} ${houseY} 
                    L ${houseX + houseWidth * 0.5} ${houseY - height * 0.3} 
                    L ${houseX + houseWidth * 1.08} ${houseY} 
                    Z`}
                fill={thatchColor} 
                stroke={stoneDark} 
                strokeWidth="0.6" 
            />
            
            {/* Simple roof texture */}
            {[0.1, 0.2].map((offset, i) => (
                <line 
                    key={`thatch-${i}`}
                    x1={houseX + houseWidth * 0.1} 
                    y1={houseY - height * offset}
                    x2={houseX + houseWidth * 0.9} 
                    y2={houseY - height * offset}
                    stroke={thatchDark} 
                    strokeWidth="0.3" 
                    opacity="0.5"
                />
            ))}
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    {/* Door glow */}
                    <path 
                        d={`M ${houseX + houseWidth * 0.35} ${houseY + houseHeight} 
                            L ${houseX + houseWidth * 0.38} ${houseY + houseHeight * 0.5} 
                            L ${houseX + houseWidth * 0.62} ${houseY + houseHeight * 0.5} 
                            L ${houseX + houseWidth * 0.65} ${houseY + houseHeight} 
                            Z`}
                        fill="rgba(255, 180, 60, 0.6)" 
                        opacity={nightIntensity * 0.7}
                    />
                    {/* Window glows */}
                    {hasWindows && (
                        <g>
                            <path 
                                d={`M ${houseX + houseWidth * 0.12} ${houseY + houseHeight * 0.5} 
                                    L ${houseX + houseWidth * 0.13} ${houseY + houseHeight * 0.25} 
                                    L ${houseX + houseWidth * 0.22} ${houseY + houseHeight * 0.25} 
                                    L ${houseX + houseWidth * 0.23} ${houseY + houseHeight * 0.5} 
                                    Z`}
                                fill="rgba(255, 200, 100, 0.6)" 
                                opacity={nightIntensity * 0.6}
                            />
                            <path 
                                d={`M ${houseX + houseWidth * 0.77} ${houseY + houseHeight * 0.5} 
                                    L ${houseX + houseWidth * 0.78} ${houseY + houseHeight * 0.25} 
                                    L ${houseX + houseWidth * 0.87} ${houseY + houseHeight * 0.25} 
                                    L ${houseX + houseWidth * 0.88} ${houseY + houseHeight * 0.5} 
                                    Z`}
                                fill="rgba(255, 200, 100, 0.6)" 
                                opacity={nightIntensity * 0.6}
                            />
                        </g>
                    )}
                </g>
            )}
        </g>
    );
});

export default IncaStoneHouse3D;