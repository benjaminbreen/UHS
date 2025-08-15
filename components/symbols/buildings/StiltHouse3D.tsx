/**
 * components/symbols/buildings/StiltHouse3D.tsx - Clean stilt house for coastal/wetland areas
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface StiltHouse3DProps {
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

const StiltHouse3D: React.FC<StiltHouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 227 + tile.y * 229);
    const uniqueId = `stilt-${tile.x}-${tile.y}`;
    
    // Random variations
    const hasWindows = rng.random() > 0.3;
    const roofVariation = rng.random();
    const stiltCount = 4; // Simplified to 4 main stilts
    
    // Consistent sizing with other improved buildings
    const houseWidth = width * 0.7;  // Match other buildings at 70%
    const houseHeight = height * 0.35;
    const stiltHeight = height * 0.35;
    const houseX = x + (width - houseWidth) / 2;
    const houseY = y + height * 0.15;
    
    // Simplified color palette
    const woodColor = `hsl(30, 35%, ${52 + roofVariation * 8}%)`;
    const woodDark = `hsl(30, 40%, ${38 + roofVariation * 5}%)`;
    const thatchColor = roofColor || `hsl(40, 45%, ${58 + roofVariation * 10}%)`;
    const stiltColor = '#6B4E3D';
    const windowColor = '#1F1611';
    
    return (
        <g>
            {/* Clean shadow underneath */}
            <ellipse 
                cx={houseX + houseWidth/2} 
                cy={houseY + houseHeight + stiltHeight + 2} 
                rx={houseWidth * 0.55} 
                ry={houseHeight * 0.12}
                fill="rgba(0, 0, 0, 0.25)"
                filter="blur(1px)"
            />
            
            {/* Simplified support stilts - 4 clean posts */}
            {[0.2, 0.4, 0.6, 0.8].map((xPos, i) => {
                const stiltX = houseX + houseWidth * xPos;
                const stiltTop = houseY + houseHeight;
                const stiltBottom = stiltTop + stiltHeight;
                
                return (
                    <rect 
                        key={`stilt-${i}`}
                        x={stiltX - 1.5} 
                        y={stiltTop} 
                        width="3" 
                        height={stiltHeight}
                        fill={stiltColor} 
                        stroke={woodDark} 
                        strokeWidth="0.5" 
                    />
                );
            })}
            
            {/* Simple cross braces */}
            <line 
                x1={houseX + houseWidth * 0.2} 
                y1={houseY + houseHeight + stiltHeight * 0.5}
                x2={houseX + houseWidth * 0.8} 
                y2={houseY + houseHeight + stiltHeight * 0.5}
                stroke={stiltColor} 
                strokeWidth="0.6" 
            />
            <line 
                x1={houseX + houseWidth * 0.2} 
                y1={houseY + houseHeight + stiltHeight * 0.5}
                x2={houseX + houseWidth * 0.4} 
                y2={houseY + houseHeight + stiltHeight * 0.7}
                stroke={stiltColor} 
                strokeWidth="0.5" 
                opacity="0.6"
            />
            <line 
                x1={houseX + houseWidth * 0.8} 
                y1={houseY + houseHeight + stiltHeight * 0.5}
                x2={houseX + houseWidth * 0.6} 
                y2={houseY + houseHeight + stiltHeight * 0.7}
                stroke={stiltColor} 
                strokeWidth="0.5" 
                opacity="0.6"
            />
            
            {/* House platform */}
            <rect 
                x={houseX} 
                y={houseY + houseHeight - 2} 
                width={houseWidth} 
                height="4"
                fill={woodDark} 
                stroke={stiltColor} 
                strokeWidth="0.6" 
            />
            
            {/* Main house body - clean and simple */}
            <rect 
                x={houseX} 
                y={houseY} 
                width={houseWidth} 
                height={houseHeight}
                fill={woodColor} 
                stroke={woodDark} 
                strokeWidth="0.8" 
            />
            
            {/* Subtle wood grain lines */}
            {[0.25, 0.5, 0.75].map((yPos, i) => (
                <line 
                    key={`grain-${i}`}
                    x1={houseX} 
                    y1={houseY + houseHeight * yPos} 
                    x2={houseX + houseWidth} 
                    y2={houseY + houseHeight * yPos}
                    stroke={woodDark} 
                    strokeWidth="0.3" 
                    opacity="0.4"
                />
            ))}
            
            {/* Clean pitched roof */}
            <path 
                d={`M ${houseX - houseWidth * 0.05} ${houseY} 
                    L ${houseX + houseWidth * 0.5} ${houseY - height * 0.25} 
                    L ${houseX + houseWidth * 1.05} ${houseY} 
                    Z`}
                fill={thatchColor} 
                stroke={woodDark} 
                strokeWidth="0.8" 
            />
            
            {/* Roof edge line */}
            <line 
                x1={houseX - houseWidth * 0.05} 
                y1={houseY}
                x2={houseX + houseWidth * 1.05} 
                y2={houseY}
                stroke={woodDark} 
                strokeWidth="0.6" 
            />
            
            {/* Simple thatch texture */}
            {[0.15, 0.3].map((offset, i) => (
                <line 
                    key={`thatch-${i}`}
                    x1={houseX + houseWidth * 0.05} 
                    y1={houseY - height * offset}
                    x2={houseX + houseWidth * 0.95} 
                    y2={houseY - height * offset}
                    stroke={woodDark} 
                    strokeWidth="0.3" 
                    opacity="0.5"
                />
            ))}
            
            {/* Simple door */}
            <rect 
                x={houseX + houseWidth * 0.4} 
                y={houseY + houseHeight * 0.5} 
                width={houseWidth * 0.2} 
                height={houseHeight * 0.5}
                fill={windowColor} 
                stroke={woodDark} 
                strokeWidth="0.8" 
            />
            
            {/* Simple windows */}
            {hasWindows && (
                <g>
                    <rect 
                        x={houseX + houseWidth * 0.15} 
                        y={houseY + houseHeight * 0.3} 
                        width={houseWidth * 0.15} 
                        height={houseHeight * 0.3}
                        fill={windowColor} 
                        stroke={woodDark} 
                        strokeWidth="0.6" 
                    />
                    <rect 
                        x={houseX + houseWidth * 0.7} 
                        y={houseY + houseHeight * 0.3} 
                        width={houseWidth * 0.15} 
                        height={houseHeight * 0.3}
                        fill={windowColor} 
                        stroke={woodDark} 
                        strokeWidth="0.6" 
                    />
                </g>
            )}
            
            {/* Simple ladder */}
            <g>
                {/* Ladder sides */}
                <line 
                    x1={houseX + houseWidth * 0.85} 
                    y1={houseY + houseHeight} 
                    x2={houseX + houseWidth * 0.85} 
                    y2={houseY + houseHeight + stiltHeight}
                    stroke={stiltColor} 
                    strokeWidth="0.8" 
                />
                <line 
                    x1={houseX + houseWidth * 0.9} 
                    y1={houseY + houseHeight} 
                    x2={houseX + houseWidth * 0.9} 
                    y2={houseY + houseHeight + stiltHeight}
                    stroke={stiltColor} 
                    strokeWidth="0.8" 
                />
                
                {/* Ladder rungs */}
                {[0.2, 0.4, 0.6, 0.8].map((yPos, i) => (
                    <line 
                        key={`rung-${i}`}
                        x1={houseX + houseWidth * 0.85} 
                        y1={houseY + houseHeight + stiltHeight * yPos} 
                        x2={houseX + houseWidth * 0.9} 
                        y2={houseY + houseHeight + stiltHeight * yPos}
                        stroke={stiltColor} 
                        strokeWidth="0.5" 
                    />
                ))}
            </g>
            
            {/* Night lighting */}
            {nightIntensity > 0 && hasWindows && (
                <g>
                    <rect 
                        x={houseX + houseWidth * 0.15} 
                        y={houseY + houseHeight * 0.3} 
                        width={houseWidth * 0.15} 
                        height={houseHeight * 0.3}
                        fill="rgba(255, 200, 100, 0.6)" 
                        opacity={nightIntensity * 0.7}
                    />
                    <rect 
                        x={houseX + houseWidth * 0.7} 
                        y={houseY + houseHeight * 0.3} 
                        width={houseWidth * 0.15} 
                        height={houseHeight * 0.3}
                        fill="rgba(255, 200, 100, 0.6)" 
                        opacity={nightIntensity * 0.7}
                    />
                </g>
            )}
        </g>
    );
});

export default StiltHouse3D;