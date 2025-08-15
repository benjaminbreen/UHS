/**
 * components/symbols/poi/PyramidSymbol.tsx - Egyptian Pyramid with proper perspective and detail
 */
import React from 'react';
import { Tile } from '../../../types';

interface PyramidSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const PyramidSymbol: React.FC<PyramidSymbolProps> = ({ x, y, size, seed }) => {
    const uniqueId = `pyramid-${x}-${y}-${seed}`;
    const scaledSize = size * 1.3; // Make it 30% bigger for visibility
    
    // Randomize pyramid characteristics based on seed
    const random = (seed + x * 137 + y * 149) % 100 / 100;
    const hasCapstone = random > 0.3; // 70% chance of golden capstone
    const blockRows = 8 + Math.floor(random * 4); // 8-11 rows of blocks
    
    return (
        <g transform={`translate(${x}, ${y})`}>
            <defs>
                {/* Sandstone gradient */}
                <linearGradient id={`sandstone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8d4b0" />
                    <stop offset="50%" stopColor="#d4b896" />
                    <stop offset="100%" stopColor="#c8a882" />
                </linearGradient>
                
                {/* Shadow gradient for right face */}
                <linearGradient id={`shadow-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b89968" />
                    <stop offset="100%" stopColor="#9c7d4e" />
                </linearGradient>
                
                {/* Golden capstone gradient */}
                <radialGradient id={`gold-${uniqueId}`} cx="50%" cy="30%">
                    <stop offset="0%" stopColor="#fff700" />
                    <stop offset="50%" stopColor="#ffdd00" />
                    <stop offset="100%" stopColor="#daa520" />
                </radialGradient>
                
                {/* Filter for shadow */}
                <filter id={`blur-${uniqueId}`}>
                    <feGaussianBlur stdDeviation="2" />
                </filter>
            </defs>
            
            {/* Ground shadow */}
            <ellipse 
                cx={scaledSize * 0.55} 
                cy={scaledSize * 0.85} 
                rx={scaledSize * 0.35} 
                ry={scaledSize * 0.12} 
                fill="rgba(0,0,0,0.25)" 
                filter={`url(#blur-${uniqueId})`}
            />
            
            {/* Desert sand base */}
            <ellipse 
                cx={scaledSize * 0.5} 
                cy={scaledSize * 0.82} 
                rx={scaledSize * 0.45} 
                ry={scaledSize * 0.08} 
                fill="#e8d4b0" 
                opacity="0.5"
            />
            
            {/* Pyramid base platform */}
            <rect 
                x={scaledSize * 0.15} 
                y={scaledSize * 0.78}
                width={scaledSize * 0.7} 
                height={scaledSize * 0.04}
                fill="#c8a882"
                stroke="#9c7d4e"
                strokeWidth="0.3"
            />
            
            {/* Front face with block pattern */}
            <g>
                <path 
                    d={`M ${scaledSize * 0.15} ${scaledSize * 0.78}
                        L ${scaledSize * 0.5} ${scaledSize * 0.2}
                        L ${scaledSize * 0.85} ${scaledSize * 0.78}
                        Z`}
                    fill={`url(#sandstone-${uniqueId})`}
                    stroke="#9c7d4e"
                    strokeWidth="0.5"
                />
                
                {/* Block lines on front face */}
                {Array.from({ length: blockRows }, (_, i) => {
                    const yPos = scaledSize * (0.78 - (0.58 * (i + 1) / blockRows));
                    const xStart = scaledSize * (0.15 + (0.35 * (i + 1) / blockRows));
                    const xEnd = scaledSize * (0.85 - (0.35 * (i + 1) / blockRows));
                    
                    return (
                        <g key={`blocks-${i}`}>
                            {/* Horizontal lines */}
                            <line 
                                x1={xStart} 
                                y1={yPos}
                                x2={xEnd} 
                                y2={yPos}
                                stroke="#b89968"
                                strokeWidth="0.3"
                                opacity="0.6"
                            />
                            
                            {/* Vertical block divisions */}
                            {Array.from({ length: Math.floor((xEnd - xStart) / (scaledSize * 0.06)) }, (_, j) => {
                                const xPos = xStart + j * scaledSize * 0.06;
                                return (
                                    <line 
                                        key={`vline-${j}`}
                                        x1={xPos} 
                                        y1={yPos}
                                        x2={xPos} 
                                        y2={yPos + scaledSize * 0.058 / blockRows}
                                        stroke="#b89968"
                                        strokeWidth="0.2"
                                        opacity="0.4"
                                    />
                                );
                            })}
                        </g>
                    );
                })}
            </g>
            
            {/* Right face (in shadow) with perspective */}
            <g>
                <path 
                    d={`M ${scaledSize * 0.85} ${scaledSize * 0.78}
                        L ${scaledSize * 0.5} ${scaledSize * 0.2}
                        L ${scaledSize * 0.72} ${scaledSize * 0.15}
                        L ${scaledSize * 0.95} ${scaledSize * 0.73}
                        Z`}
                    fill={`url(#shadow-${uniqueId})`}
                    stroke="#7c5d3e"
                    strokeWidth="0.5"
                />
                
                {/* Block pattern on right face */}
                {Array.from({ length: blockRows }, (_, i) => {
                    const yStart = scaledSize * (0.78 - (0.58 * (i + 1) / blockRows));
                    const yEnd = scaledSize * (0.73 - (0.58 * (i + 1) / blockRows));
                    const xStart = scaledSize * (0.85 - (0.35 * (i + 1) / blockRows));
                    const xEnd = scaledSize * (0.95 - (0.23 * (i + 1) / blockRows));
                    
                    return (
                        <line 
                            key={`shadow-blocks-${i}`}
                            x1={xStart} 
                            y1={yStart}
                            x2={xEnd} 
                            y2={yEnd}
                            stroke="#6c4d2e"
                            strokeWidth="0.3"
                            opacity="0.5"
                        />
                    );
                })}
            </g>
            
            {/* Entrance */}
            <rect 
                x={scaledSize * 0.47} 
                y={scaledSize * 0.65}
                width={scaledSize * 0.06} 
                height={scaledSize * 0.13}
                fill="#1a1a1a"
                stroke="#7c5d3e"
                strokeWidth="0.3"
            />
            
            {/* Entrance shadow/depth */}
            <rect 
                x={scaledSize * 0.48} 
                y={scaledSize * 0.66}
                width={scaledSize * 0.04} 
                height={scaledSize * 0.11}
                fill="#000000"
                opacity="0.7"
            />
            
            {/* Capstone (pyramidion) */}
            {hasCapstone && (
                <g>
                    {/* Capstone shadow */}
                    <path 
                        d={`M ${scaledSize * 0.47} ${scaledSize * 0.23}
                            L ${scaledSize * 0.5} ${scaledSize * 0.18}
                            L ${scaledSize * 0.53} ${scaledSize * 0.23}
                            Z`}
                        fill="rgba(0,0,0,0.3)"
                    />
                    
                    {/* Golden capstone */}
                    <path 
                        d={`M ${scaledSize * 0.47} ${scaledSize * 0.22}
                            L ${scaledSize * 0.5} ${scaledSize * 0.17}
                            L ${scaledSize * 0.53} ${scaledSize * 0.22}
                            Z`}
                        fill={`url(#gold-${uniqueId})`}
                        stroke="#b8860b"
                        strokeWidth="0.3"
                    />
                    
                    {/* Capstone shine */}
                    <circle 
                        cx={scaledSize * 0.5} 
                        cy={scaledSize * 0.19}
                        r={scaledSize * 0.008}
                        fill="rgba(255,255,255,0.8)"
                    />
                </g>
            )}
            
            {/* Hieroglyphics near entrance */}
            <g opacity="0.4">
                <text 
                    x={scaledSize * 0.42} 
                    y={scaledSize * 0.62}
                    fontSize={scaledSize * 0.02}
                    fill="#7c5d3e"
                    fontFamily="serif"
                >𓊖</text>
                <text 
                    x={scaledSize * 0.56} 
                    y={scaledSize * 0.62}
                    fontSize={scaledSize * 0.02}
                    fill="#7c5d3e"
                    fontFamily="serif"
                >𓊗</text>
            </g>
            
            {/* Small palm tree for scale */}
            {random > 0.5 && (
                <g opacity="0.6" transform={`translate(${scaledSize * 0.08}, ${scaledSize * 0.75})`}>
                    <rect x={0} y={0} width={scaledSize * 0.015} height={scaledSize * 0.12} fill="#6a4a3a" />
                    <circle cx={scaledSize * 0.0075} cy={-scaledSize * 0.02} r={scaledSize * 0.05} fill="#4a6a4a" />
                </g>
            )}
        </g>
    );
};

export default React.memo(PyramidSymbol);