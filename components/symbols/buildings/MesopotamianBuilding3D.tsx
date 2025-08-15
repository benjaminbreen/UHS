/**
 * components/symbols/buildings/MesopotamianBuilding3D.tsx - Clean Mesopotamian building with proper perspective
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface MesopotamianBuilding3DProps {
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

const MesopotamianBuilding3D: React.FC<MesopotamianBuilding3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 257 + tile.y * 263);
    const uniqueId = `mesopotamian-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const hasDecoration = rng.random() > 0.4;
    const windowVariant = Math.floor(rng.random() * 3);
    
    // Clean dimensions
    const buildingWidth = width * 0.7;
    const buildingHeight = height * 0.65;
    const buildingX = x + (width - buildingWidth) / 2;
    const buildingY = y + height * 0.25;
    
    // Proper 3D perspective
    const depthX = width * 0.12;
    const depthY = height * 0.08;
    
    // Mesopotamian color palette - muted and authentic
    const clayBrick = `hsl(25, 35%, 65%)`;
    const darkBrick = `hsl(20, 30%, 45%)`;
    const shadowBrick = `hsl(15, 25%, 35%)`;
    const mortarColor = `hsl(30, 20%, 75%)`;
    const glazedBlue = `hsl(210, 40%, 50%)`;
    const goldAccent = `hsl(45, 65%, 60%)`;
    
    return (
        <g>
            {/* Clean shadow */}
            <ellipse 
                cx={buildingX + buildingWidth/2 + depthX/2} 
                cy={buildingY + buildingHeight + 3} 
                rx={buildingWidth * 0.55} 
                ry={buildingHeight * 0.08} 
                fill="rgba(0,0,0,0.2)" 
            />
            
            {/* Side wall (3D depth) */}
            <path 
                d={`M ${buildingX + buildingWidth} ${buildingY}
                    L ${buildingX + buildingWidth + depthX} ${buildingY - depthY}
                    L ${buildingX + buildingWidth + depthX} ${buildingY + buildingHeight - depthY}
                    L ${buildingX + buildingWidth} ${buildingY + buildingHeight} Z`}
                fill={darkBrick} 
                stroke={shadowBrick} 
                strokeWidth="0.4" 
            />
            
            {/* Top face (3D depth) */}
            <path 
                d={`M ${buildingX} ${buildingY}
                    L ${buildingX + depthX} ${buildingY - depthY}
                    L ${buildingX + buildingWidth + depthX} ${buildingY - depthY}
                    L ${buildingX + buildingWidth} ${buildingY} Z`}
                fill={mortarColor} 
                stroke={shadowBrick} 
                strokeWidth="0.4" 
            />
            
            {/* Main front wall */}
            <rect 
                x={buildingX} 
                y={buildingY} 
                width={buildingWidth} 
                height={buildingHeight}
                fill={clayBrick} 
                stroke={shadowBrick} 
                strokeWidth="0.5" 
            />
            
            {/* Subtle brick texture lines */}
            {[0.2, 0.4, 0.6, 0.8].map((yPos, i) => (
                <line key={`brick-line-${i}`}
                    x1={buildingX} 
                    y1={buildingY + buildingHeight * yPos} 
                    x2={buildingX + buildingWidth} 
                    y2={buildingY + buildingHeight * yPos}
                    stroke={mortarColor} 
                    strokeWidth="0.3" 
                    opacity="0.5"
                />
            ))}
            
            {/* Clean arched entrance with proper perspective */}
            <path 
                d={`M ${buildingX + buildingWidth * 0.4} ${buildingY + buildingHeight}
                    L ${buildingX + buildingWidth * 0.4} ${buildingY + buildingHeight * 0.55}
                    Q ${buildingX + buildingWidth * 0.5} ${buildingY + buildingHeight * 0.45}
                      ${buildingX + buildingWidth * 0.6} ${buildingY + buildingHeight * 0.55}
                    L ${buildingX + buildingWidth * 0.6} ${buildingY + buildingHeight}
                    Z`}
                fill={goldAccent} 
                stroke={shadowBrick} 
                strokeWidth="0.5" 
            />
            
            {/* Inner door */}
            <rect 
                x={buildingX + buildingWidth * 0.43} 
                y={buildingY + buildingHeight * 0.65} 
                width={buildingWidth * 0.14} 
                height={buildingHeight * 0.35}
                fill="rgba(0,0,0,0.7)" 
            />
            
            {/* Windows with clean lattice */}
            {windowVariant !== 2 && (
                <g>
                    {/* Left window */}
                    <rect 
                        x={buildingX + buildingWidth * 0.15} 
                        y={buildingY + buildingHeight * 0.35} 
                        width={buildingWidth * 0.15} 
                        height={buildingHeight * 0.2}
                        fill="rgba(0,0,0,0.6)" 
                        stroke={glazedBlue} 
                        strokeWidth="0.5" 
                    />
                    {/* Window cross */}
                    <line 
                        x1={buildingX + buildingWidth * 0.225} 
                        y1={buildingY + buildingHeight * 0.35}
                        x2={buildingX + buildingWidth * 0.225} 
                        y2={buildingY + buildingHeight * 0.55}
                        stroke={glazedBlue} 
                        strokeWidth="0.3" 
                    />
                    <line 
                        x1={buildingX + buildingWidth * 0.15} 
                        y1={buildingY + buildingHeight * 0.45}
                        x2={buildingX + buildingWidth * 0.3} 
                        y2={buildingY + buildingHeight * 0.45}
                        stroke={glazedBlue} 
                        strokeWidth="0.3" 
                    />
                </g>
            )}
            
            {windowVariant !== 1 && (
                <g>
                    {/* Right window */}
                    <rect 
                        x={buildingX + buildingWidth * 0.7} 
                        y={buildingY + buildingHeight * 0.35} 
                        width={buildingWidth * 0.15} 
                        height={buildingHeight * 0.2}
                        fill="rgba(0,0,0,0.6)" 
                        stroke={glazedBlue} 
                        strokeWidth="0.5" 
                    />
                    {/* Window cross */}
                    <line 
                        x1={buildingX + buildingWidth * 0.775} 
                        y1={buildingY + buildingHeight * 0.35}
                        x2={buildingX + buildingWidth * 0.775} 
                        y2={buildingY + buildingHeight * 0.55}
                        stroke={glazedBlue} 
                        strokeWidth="0.3" 
                    />
                    <line 
                        x1={buildingX + buildingWidth * 0.7} 
                        y1={buildingY + buildingHeight * 0.45}
                        x2={buildingX + buildingWidth * 0.85} 
                        y2={buildingY + buildingHeight * 0.45}
                        stroke={glazedBlue} 
                        strokeWidth="0.3" 
                    />
                </g>
            )}
            
            {/* Decorative frieze - cleaner and simpler */}
            {hasDecoration && (
                <rect 
                    x={buildingX + buildingWidth * 0.1} 
                    y={buildingY + buildingHeight * 0.15} 
                    width={buildingWidth * 0.8} 
                    height={buildingHeight * 0.08}
                    fill={glazedBlue} 
                    stroke={goldAccent} 
                    strokeWidth="0.4" 
                    opacity="0.7"
                />
            )}
            
            {/* Simple crenellations on top */}
            {[0, 0.2, 0.4, 0.6, 0.8].map((xPos, i) => (
                <rect key={`crenel-${i}`}
                    x={buildingX + buildingWidth * xPos} 
                    y={buildingY - 3} 
                    width={buildingWidth * 0.15} 
                    height={4}
                    fill={clayBrick} 
                    stroke={shadowBrick} 
                    strokeWidth="0.3" 
                />
            ))}
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    {/* Window glow */}
                    {windowVariant !== 2 && (
                        <rect 
                            x={buildingX + buildingWidth * 0.15} 
                            y={buildingY + buildingHeight * 0.35} 
                            width={buildingWidth * 0.15} 
                            height={buildingHeight * 0.2}
                            fill="rgba(255, 180, 80, 0.6)" 
                            opacity={nightIntensity * 0.8}
                        />
                    )}
                    {windowVariant !== 1 && (
                        <rect 
                            x={buildingX + buildingWidth * 0.7} 
                            y={buildingY + buildingHeight * 0.35} 
                            width={buildingWidth * 0.15} 
                            height={buildingHeight * 0.2}
                            fill="rgba(255, 180, 80, 0.6)" 
                            opacity={nightIntensity * 0.8}
                        />
                    )}
                    {/* Door glow */}
                    <rect 
                        x={buildingX + buildingWidth * 0.43} 
                        y={buildingY + buildingHeight * 0.65} 
                        width={buildingWidth * 0.14} 
                        height={buildingHeight * 0.35}
                        fill="rgba(255, 200, 100, 0.5)" 
                        opacity={nightIntensity * 0.6}
                    />
                </g>
            )}
        </g>
    );
});

export default MesopotamianBuilding3D;