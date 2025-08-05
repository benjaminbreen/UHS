/**
 * components/symbols/poi/BaroqueChurchSymbol.tsx - Renders an ornate Baroque Cathedral
 */
import React from 'react';
import { Tile } from '../../../types';

interface BaroqueChurchSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const BaroqueChurchSymbol: React.FC<BaroqueChurchSymbolProps> = ({ x, y, size }) => {
    const stoneColor = "#F5F5DC"; // Beige
    const roofColor = "#006400"; // DarkGreen
    const shadowColor = "#D3D3D3"; // LightGray
    const outlineColor = "#696969";
    const depth = size * 0.4;

    return (
        <g filter="url(#symbolShadow)">
            {/* Main Facade */}
            <rect x={x + size * 0.2} y={y + size * 0.4} width={size * 0.6} height={size * 0.5} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Side Wall */}
            <path d={`M ${x + size * 0.8} ${y + size * 0.4} L ${x + size * 0.8 + depth} ${y + size * 0.4 - depth*0.5} L ${x+size*0.8+depth} ${y+size*0.9-depth*0.5} L ${x+size*0.8} ${y+size*0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3"/>
            
            {/* Central Dome */}
            <ellipse cx={x + size * 0.5} cy={y + size * 0.4} rx={size * 0.25} ry={size * 0.2} fill={roofColor} stroke={outlineColor} strokeWidth="0.3" />

            {/* Columns */}
            {Array.from({length: 4}).map((_, i) => (
                <rect key={`col-${i}`} x={x + size * 0.25 + i * (size*0.12)} y={y+size*0.7} width={size*0.05} height={size*0.2} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2" />
            ))}
        </g>
    );
};

export default React.memo(BaroqueChurchSymbol);