/**
 * components/symbols/FishingHutSymbol.tsx - Renders beautiful fishing hut structures with period-appropriate designs
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface FishingHutSymbolProps {
    x: number;
    y: number;
    size: number;
    seed: number;
    date?: string;
    isModern?: boolean; // Determined by date/era
}

const FishingHutSymbol: React.FC<FishingHutSymbolProps> = React.memo(({ x, y, size, seed, date, isModern = false }) => {
    const elements: JSX.Element[] = [];
    const hutSize = size * 0.6;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Check if neon signs should appear (post-1940)
    const year = date ? parseInt(date.split(' ')[0]) : 1800;
    const hasNeonSign = isModern && year >= 1940;

    // Simple 2.5D building like other structures in the game
    elements.push(
        <g key="fishing-hut-2.5d">
            {/* Ground shadow */}
            <ellipse
                cx={centerX}
                cy={centerY + hutSize/2.5}
                rx={hutSize/1.8}
                ry={hutSize/8}
                fill="rgba(0,0,0,0.2)"
            />
            
            {/* Main building - simple rectangular hut */}
            <rect
                x={centerX - hutSize/2.5}
                y={centerY - hutSize/3}
                width={hutSize/1.25}
                height={hutSize/1.5}
                fill={isModern ? "#8B7D6B" : "#CD853F"} // Dark wood for modern, lighter for premodern
                stroke={isModern ? "#654321" : "#8B4513"}
                strokeWidth={size * 0.01}
                rx={size * 0.01}
            />
            
            {/* Front wall - lighter to show 3D depth */}
            <rect
                x={centerX - hutSize/2.5}
                y={centerY - hutSize/3}
                width={hutSize/1.25}
                height={hutSize/1.5}
                fill={isModern ? "#A0826D" : "#D2B48C"}
                stroke={isModern ? "#654321" : "#8B4513"}
                strokeWidth={size * 0.008}
                rx={size * 0.01}
            />
            
            {/* Roof - simple peaked */}
            <path
                d={`M ${centerX - hutSize/2.2} ${centerY - hutSize/3} L ${centerX} ${centerY - hutSize/1.8} L ${centerX + hutSize/2.2} ${centerY - hutSize/3} Z`}
                fill={isModern ? "#7F8C8D" : "#DAA520"} // Tin for modern, thatch for premodern
                stroke={isModern ? "#5D6D7E" : "#B8860B"}
                strokeWidth={size * 0.008}
            />
            
            {/* Door */}
            <rect
                x={centerX - hutSize/8}
                y={centerY}
                width={hutSize/4}
                height={hutSize/3}
                fill="#654321"
                stroke="#4A4A4A"
                strokeWidth={size * 0.006}
                rx={size * 0.008}
            />
            
            {/* Window */}
            <rect
                x={centerX + hutSize/8}
                y={centerY - hutSize/8}
                width={hutSize/6}
                height={hutSize/8}
                fill="#87CEEB"
                stroke="#4A4A4A"
                strokeWidth={size * 0.005}
                opacity={0.9}
            />
            
            {/* Simple neon sign (only post-1940) */}
            {hasNeonSign && (
                <g>
                    <rect
                        x={centerX - hutSize/4}
                        y={centerY - hutSize/2.5}
                        width={hutSize/2}
                        height={hutSize/12}
                        fill="#2C3E50"
                        stroke="#1A252F"
                        strokeWidth={size * 0.003}
                        rx={size * 0.003}
                    />
                    <text
                        x={centerX}
                        y={centerY - hutSize/2.8}
                        fontSize={size * 0.05}
                        textAnchor="middle"
                        fill="#00FFFF"
                        fontFamily="monospace"
                        style={{ filter: 'drop-shadow(0 0 2px #00FFFF)' }}
                    >
                        FISH
                    </text>
                </g>
            )}
        </g>
    );

    // Simple rowboat beside hut
    const boatX = centerX + hutSize/1.5;
    const boatY = centerY + hutSize/3;
    
    elements.push(
        <g key="simple-boat">
            {/* Boat shadow */}
            <ellipse 
                cx={boatX} 
                cy={boatY + size * 0.02} 
                rx={size * 0.12} 
                ry={size * 0.02} 
                fill="rgba(0,0,0,0.2)" 
            />
            
            {/* Simple boat hull */}
            <ellipse
                cx={boatX}
                cy={boatY}
                rx={size * 0.12}
                ry={size * 0.04}
                fill="#8B4513"
                stroke="#654321"
                strokeWidth={size * 0.004}
            />
            
            {/* Single oar */}
            <line 
                x1={boatX - size * 0.08} 
                y1={boatY} 
                x2={boatX - size * 0.15} 
                y2={boatY + size * 0.06} 
                stroke="#8B4513" 
                strokeWidth={size * 0.008} 
            />
        </g>
    );

    return <>{elements}</>;
});

export default FishingHutSymbol;