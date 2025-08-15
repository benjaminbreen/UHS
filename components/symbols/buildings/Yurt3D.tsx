/**
 * components/symbols/buildings/Yurt3D.tsx - Simplified traditional yurt with clean lines
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface Yurt3DProps {
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

const Yurt3D: React.FC<Yurt3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile,  nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 349 + tile.y * 353);
    const uniqueId = `yurt-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const feltVariation = rng.random();
    const hasDecorations = rng.random() > 0.6;
    
    const cx = x + width / 2;
    const yurtRadius = width * 0.45;  // Increased from 0.35 to 0.45
    const yurtHeight = height * 0.65;  // Increased from 0.5 to 0.65
    const yurtY = y + height * 0.2;    // Moved up from 0.35 to 0.2 to center better
    
    // Clean color palette
    const feltColor = `hsl(45, 18%, ${88 + feltVariation * 8}%)`; // Off-white felt
    const roofColor = `hsl(40, 22%, ${82 + feltVariation * 6}%)`; // Slightly darker roof
    const frameColor = '#8B6F47'; // Wood frame
    const doorColor = '#2C1810'; // Dark entrance
    const decorColor = '#B8860B'; // Golden decoration
    
    return (
        <g>
            {/* Gradient shadow directly underneath */}
            <defs>
                <radialGradient id={`yurtShadow-${uniqueId}`}>
                    <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
            </defs>
            
            {/* Clean gradient shadow */}
            <ellipse 
                cx={cx} 
                cy={yurtY + yurtHeight + 2} 
                rx={yurtRadius * 1.1} 
                ry={yurtRadius * 0.35}
                fill={`url(#yurtShadow-${uniqueId})`}
            />
            
            {/* Main yurt body - simplified cylinder */}
            {/* Base */}
            <ellipse 
                cx={cx} 
                cy={yurtY + yurtHeight} 
                rx={yurtRadius} 
                ry={yurtRadius * 0.2}
                fill={feltColor} 
                stroke={frameColor} 
                strokeWidth="0.5" 
            />
            
            {/* Cylindrical walls */}
            <rect 
                x={cx - yurtRadius} 
                y={yurtY + yurtHeight * 0.4} 
                width={yurtRadius * 2} 
                height={yurtHeight * 0.6}
                fill={feltColor} 
            />
            
            {/* Wall vertical edge lines for 3D effect */}
            <line 
                x1={cx - yurtRadius} 
                y1={yurtY + yurtHeight * 0.4}
                x2={cx - yurtRadius} 
                y2={yurtY + yurtHeight}
                stroke={frameColor} 
                strokeWidth="0.5"
            />
            <line 
                x1={cx + yurtRadius} 
                y1={yurtY + yurtHeight * 0.4}
                x2={cx + yurtRadius} 
                y2={yurtY + yurtHeight}
                stroke={frameColor} 
                strokeWidth="0.5"
            />
            
            {/* Roof - clean cone shape */}
            <path 
                d={`M ${cx - yurtRadius * 1.05} ${yurtY + yurtHeight * 0.4} 
                    L ${cx} ${yurtY} 
                    L ${cx + yurtRadius * 1.05} ${yurtY + yurtHeight * 0.4} 
                    Q ${cx} ${yurtY + yurtHeight * 0.3} ${cx - yurtRadius * 1.05} ${yurtY + yurtHeight * 0.4}`}
                fill={roofColor} 
                stroke={frameColor} 
                strokeWidth="0.6" 
            />
            
            {/* Simple roof ribs */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const endX = cx + Math.cos(rad) * yurtRadius * 0.95;
                const endY = yurtY + yurtHeight * 0.4 + Math.sin(rad) * yurtRadius * 0.15;
                
                return (
                    <line key={angle}
                        x1={cx} 
                        y1={yurtY + size * 0.02} 
                        x2={endX} 
                        y2={endY}
                        stroke={frameColor} 
                        strokeWidth="0.3" 
                        opacity="0.5"
                    />
                );
            })}
            
            {/* Crown/smoke hole at top */}
            <ellipse 
                cx={cx} 
                cy={yurtY} 
                rx={yurtRadius * 0.12} 
                ry={yurtRadius * 0.06}
                fill={feltColor}
                stroke={frameColor} 
                strokeWidth="0.5" 
            />
            
            {/* Simple lattice pattern on walls */}
            <g opacity="0.3">
                {/* Diagonal lattice lines */}
                {[-2, -1, 0, 1, 2].map(i => (
                    <g key={i}>
                        <line
                            x1={cx - yurtRadius + (i + 2) * yurtRadius * 0.3}
                            y1={yurtY + yurtHeight * 0.4}
                            x2={cx - yurtRadius + (i + 3) * yurtRadius * 0.3}
                            y2={yurtY + yurtHeight}
                            stroke={frameColor}
                            strokeWidth="0.3"
                            opacity="0.6"
                        />
                        <line
                            x1={cx - yurtRadius + (i + 2) * yurtRadius * 0.3}
                            y1={yurtY + yurtHeight}
                            x2={cx - yurtRadius + (i + 3) * yurtRadius * 0.3}
                            y2={yurtY + yurtHeight * 0.4}
                            stroke={frameColor}
                            strokeWidth="0.3"
                            opacity="0.6"
                        />
                    </g>
                ))}
            </g>
            
            {/* Single horizontal band */}
            <ellipse 
                cx={cx} 
                cy={yurtY + yurtHeight * 0.7} 
                rx={yurtRadius * 1.01} 
                ry={yurtRadius * 0.22}
                fill="none" 
                stroke={frameColor} 
                strokeWidth="0.6" 
                opacity="0.4"
            />
            
            {/* Door - simple and clean */}
            <rect 
                x={cx - yurtRadius * 0.12} 
                y={yurtY + yurtHeight * 0.65} 
                width={yurtRadius * 0.24} 
                height={yurtHeight * 0.35}
                fill={doorColor} 
                stroke={frameColor} 
                strokeWidth="0.6" 
            />
            
            {/* Optional decoration band */}
            {hasDecorations && (
                <ellipse 
                    cx={cx} 
                    cy={yurtY + yurtHeight * 0.55} 
                    rx={yurtRadius * 1.005} 
                    ry={yurtRadius * 0.21}
                    fill="none" 
                    stroke={decorColor} 
                    strokeWidth="1" 
                    opacity="0.6"
                />
            )}
            
            {/* Night lighting - simplified */}
            {nightIntensity > 0 && (
                <g>
                    {/* Light from door */}
                    <rect 
                        x={cx - yurtRadius * 0.12} 
                        y={yurtY + yurtHeight * 0.65} 
                        width={yurtRadius * 0.24} 
                        height={yurtHeight * 0.35}
                        fill="rgba(255, 200, 100, 0.6)" 
                        opacity={nightIntensity * 0.7}
                    />
                    
                    {/* Subtle glow from smoke hole */}
                    <ellipse 
                        cx={cx} 
                        cy={yurtY} 
                        rx={yurtRadius * 0.15} 
                        ry={yurtRadius * 0.08}
                        fill="rgba(255, 180, 80, 0.4)" 
                        opacity={nightIntensity * 0.5}
                        filter="blur(1px)"
                    />
                </g>
            )}
        </g>
    );
});

export default Yurt3D;