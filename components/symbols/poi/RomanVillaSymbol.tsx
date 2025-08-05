/**
 * components/symbols/poi/RomanVillaSymbol.tsx - Renders a Roman Villa
 */
import React from 'react';
import { Tile } from '../../../types';

interface RomanVillaSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const RomanVillaSymbol: React.FC<RomanVillaSymbolProps> = ({ x, y, size }) => {
    const wallColor = "#FDF5E6";
    const roofColor = "#B22222";
    const columnColor = "#FFF8DC";
    const shadowColor = "#D2B48C";
    const outlineColor = "#8B4513";
    const depth = size * 0.4;

    return (
        <g filter="url(#symbolShadow)">
            {/* Main Building Side Wall */}
            <path d={`M ${x + size * 0.9} ${y + size * 0.4} L ${x + size * 0.9 + depth} ${y + size * 0.4 - depth * 0.5} L ${x + size * 0.9 + depth} ${y + size * 0.9 - depth * 0.5} L ${x + size * 0.9} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Main Building Front Wall */}
            <rect x={x + size * 0.1} y={y + size * 0.4} width={size * 0.8} height={size * 0.5} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Tiled Roof */}
            <path d={`M ${x + size * 0.05} ${y + size * 0.4} L ${x + size * 0.5} ${y + size * 0.2} L ${x + size * 0.95} ${y + size * 0.4} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x + size * 0.95} ${y + size * 0.4} L ${x + size * 0.95 + depth} ${y+size*0.4-depth*0.5} L ${x+size*0.5+depth} ${y+size*0.2-depth*0.5} L ${x+size*0.5} ${y+size*0.2} Z`} fill={roofColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.2"/>
            
            {/* Columns */}
            {Array.from({ length: 4 }, (_, i) => (
                <rect key={`col-${i}`} x={x + size * 0.2 + i * (size * 0.15)} y={y + size * 0.7} width={size * 0.05} height={size * 0.2} fill={columnColor} stroke={outlineColor} strokeWidth="0.15" />
            ))}
        </g>
    );
};

export default React.memo(RomanVillaSymbol);