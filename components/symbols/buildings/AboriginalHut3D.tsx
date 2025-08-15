/**
 * components/symbols/buildings/AboriginalHut3D.tsx - Traditional bark hut with 3D perspective
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AboriginalHut3DProps {
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

const AboriginalHut3D: React.FC<AboriginalHut3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 127 + tile.y * 131);
    const uniqueId = `aboriginal-${tile.x}-${tile.y}`;
    
    // Random values for variation
    const hasSmoke = rng.random() > 0.8; // 20% chance of smoke
    const hutVariant = rng.random();
    const barkVariation = rng.random();
    
    // Proper 3D dimensions - much larger and more prominent
    const hutWidth = width * 0.95;  // Increased from 0.7
    const hutHeight = height * 0.85; // Increased from 0.6
    const hutX = x + (width - hutWidth) / 2;
    const hutY = y + height * 0.4;  // Adjusted for taller height
    
    // Natural bark colors
    const barkBase = `hsl(25, 28%, ${38 + barkVariation * 10}%)`;
    const barkDark = `hsl(25, 35%, ${25 + barkVariation * 5}%)`;
    const barkLight = `hsl(30, 25%, ${48 + barkVariation * 8}%)`;
    const shadowColor = 'rgba(0, 0, 0, 0.3)';
    
    return (
        <g>
            {/* Shadow underneath */}
            <ellipse 
                cx={hutX + hutWidth/2} 
                cy={hutY + hutHeight + 2} 
                rx={hutWidth * 0.55} 
                ry={hutHeight * 0.15}
                fill="rgba(0, 0, 0, 0.25)"
                filter="blur(1px)"
            />
            
            {/* Main dome structure - simplified for clarity */}
            <defs>
                <linearGradient id={`hutGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={barkLight} />
                    <stop offset="50%" stopColor={barkBase} />
                    <stop offset="100%" stopColor={barkDark} />
                </linearGradient>
                
                {/* Bark texture pattern */}
                <pattern id={`bark-${uniqueId}`} patternUnits="userSpaceOnUse" width="3" height="4">
                    <rect width="3" height="4" fill={barkBase} />
                    <line x1="0" y1="2" x2="3" y2="2" stroke={barkDark} strokeWidth="0.3" opacity="0.5" />
                    <line x1="1.5" y1="0" x2="1.5" y2="4" stroke={barkDark} strokeWidth="0.2" opacity="0.4" />
                </pattern>
            </defs>
            
            {/* Base/floor */}
            <ellipse 
                cx={hutX + hutWidth/2} 
                cy={hutY + hutHeight} 
                rx={hutWidth * 0.5} 
                ry={hutHeight * 0.12}
                fill={barkDark}
                opacity="0.8"
            />
            
            {/* Main dome body */}
            <path 
                d={`M ${hutX} ${hutY + hutHeight}
                    C ${hutX} ${hutY + hutHeight * 0.3}, 
                      ${hutX + hutWidth * 0.2} ${hutY}, 
                      ${hutX + hutWidth/2} ${hutY}
                    C ${hutX + hutWidth * 0.8} ${hutY}, 
                      ${hutX + hutWidth} ${hutY + hutHeight * 0.3},
                      ${hutX + hutWidth} ${hutY + hutHeight}
                    Z`}
                fill={`url(#hutGrad-${uniqueId})`}
                stroke={barkDark}
                strokeWidth="0.8"
            />
            
            {/* Bark texture overlay */}
            <path 
                d={`M ${hutX + hutWidth * 0.05} ${hutY + hutHeight * 0.9}
                    C ${hutX + hutWidth * 0.05} ${hutY + hutHeight * 0.4}, 
                      ${hutX + hutWidth * 0.25} ${hutY + hutHeight * 0.1}, 
                      ${hutX + hutWidth/2} ${hutY + hutHeight * 0.1}
                    C ${hutX + hutWidth * 0.75} ${hutY + hutHeight * 0.1}, 
                      ${hutX + hutWidth * 0.95} ${hutY + hutHeight * 0.4},
                      ${hutX + hutWidth * 0.95} ${hutY + hutHeight * 0.9}
                    Z`}
                fill={`url(#bark-${uniqueId})`}
                opacity="0.6"
            />
            
            {/* Framework lines for structure */}
            {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
                <line 
                    key={i}
                    x1={hutX + hutWidth * pos} 
                    y1={hutY + hutHeight}
                    x2={hutX + hutWidth/2} 
                    y2={hutY}
                    stroke={barkDark}
                    strokeWidth="0.4"
                    opacity="0.5"
                />
            ))}
            
            {/* Horizontal bands */}
            {[0.3, 0.6].map((yPos, i) => (
                <ellipse 
                    key={i}
                    cx={hutX + hutWidth/2} 
                    cy={hutY + hutHeight * yPos}
                    rx={hutWidth * (0.5 - yPos * 0.3)} 
                    ry={hutHeight * 0.08}
                    fill="none"
                    stroke={barkDark}
                    strokeWidth="0.5"
                    opacity="0.4"
                />
            ))}
            
            {/* Entrance */}
            <path 
                d={`M ${hutX + hutWidth * 0.35} ${hutY + hutHeight}
                    C ${hutX + hutWidth * 0.35} ${hutY + hutHeight * 0.7},
                      ${hutX + hutWidth * 0.4} ${hutY + hutHeight * 0.6},
                      ${hutX + hutWidth/2} ${hutY + hutHeight * 0.6}
                    C ${hutX + hutWidth * 0.6} ${hutY + hutHeight * 0.6},
                      ${hutX + hutWidth * 0.65} ${hutY + hutHeight * 0.7},
                      ${hutX + hutWidth * 0.65} ${hutY + hutHeight}
                    Z`}
                fill="rgba(0, 0, 0, 0.8)"
                stroke={barkDark}
                strokeWidth="0.6"
            />
            
            {/* Top highlight for 3D effect */}
            <ellipse 
                cx={hutX + hutWidth * 0.45} 
                cy={hutY + hutHeight * 0.2}
                rx={hutWidth * 0.15} 
                ry={hutHeight * 0.08}
                fill={barkLight}
                opacity="0.4"
            />
            
            {/* Smoke effect (20% of huts) */}
            {hasSmoke && (
                <g opacity="0.5">
                    {/* Smoke puffs */}
                    <circle 
                        cx={hutX + hutWidth/2} 
                        cy={hutY - hutHeight * 0.1}
                        r={hutWidth * 0.08}
                        fill="rgba(150, 150, 150, 0.4)"
                        filter="blur(2px)"
                    >
                        <animate 
                            attributeName="cy" 
                            from={hutY - hutHeight * 0.1}
                            to={hutY - hutHeight * 0.4}
                            dur="4s"
                            repeatCount="indefinite"
                        />
                        <animate 
                            attributeName="opacity" 
                            from="0.4"
                            to="0"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    
                    <circle 
                        cx={hutX + hutWidth/2 + hutWidth * 0.05} 
                        cy={hutY - hutHeight * 0.05}
                        r={hutWidth * 0.06}
                        fill="rgba(150, 150, 150, 0.3)"
                        filter="blur(2px)"
                    >
                        <animate 
                            attributeName="cy" 
                            from={hutY - hutHeight * 0.05}
                            to={hutY - hutHeight * 0.35}
                            dur="4s"
                            begin="1s"
                            repeatCount="indefinite"
                        />
                        <animate 
                            attributeName="opacity" 
                            from="0.3"
                            to="0"
                            dur="4s"
                            begin="1s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    
                    <circle 
                        cx={hutX + hutWidth/2 - hutWidth * 0.03} 
                        cy={hutY}
                        r={hutWidth * 0.05}
                        fill="rgba(150, 150, 150, 0.3)"
                        filter="blur(1.5px)"
                    >
                        <animate 
                            attributeName="cy" 
                            from={hutY}
                            to={hutY - hutHeight * 0.3}
                            dur="4s"
                            begin="2s"
                            repeatCount="indefinite"
                        />
                        <animate 
                            attributeName="opacity" 
                            from="0.3"
                            to="0"
                            dur="4s"
                            begin="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>
            )}
            
            {/* Night time interior glow */}
            {nightIntensity > 0 && (
                <path 
                    d={`M ${hutX + hutWidth * 0.35} ${hutY + hutHeight}
                        C ${hutX + hutWidth * 0.35} ${hutY + hutHeight * 0.7},
                          ${hutX + hutWidth * 0.4} ${hutY + hutHeight * 0.6},
                          ${hutX + hutWidth/2} ${hutY + hutHeight * 0.6}
                        C ${hutX + hutWidth * 0.6} ${hutY + hutHeight * 0.6},
                          ${hutX + hutWidth * 0.65} ${hutY + hutHeight * 0.7},
                          ${hutX + hutWidth * 0.65} ${hutY + hutHeight}
                        Z`}
                    fill="rgba(255, 180, 60, 0.6)"
                    opacity={nightIntensity * 0.7}
                />
            )}
        </g>
    );
});

export default AboriginalHut3D;