/**
 * components/symbols/poi/GenericPalaceSymbol.tsx - Renders a generic palace
 */
import React from 'react';
import { Tile } from '../../../types';

interface GenericPalaceSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const GenericPalaceSymbol: React.FC<GenericPalaceSymbolProps> = ({ x, y, size }) => {
    const wallColor = "#F0E68C";
    const roofColor = "#B22222";
    const shadowColor = "#D2B48C";
    const outlineColor = "#8B4513";
    const depth = size * 0.4;

    return (
        <g>
            {/* Main Building */}
            <rect x={x + size * 0.1} y={y + size * 0.3} width={size * 0.8} height={size * 0.6} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x + size * 0.9} ${y + size * 0.3} L ${x + size * 0.9 + depth} ${y + size * 0.3 - depth * 0.5} L ${x + size * 0.9 + depth} ${y + size * 0.9 - depth * 0.5} L ${x + size * 0.9} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Roof */}
            <rect x={x + size * 0.05} y={y + size * 0.25} width={size * 0.9} height={size * 0.1} fill={roofColor} stroke={outlineColor} strokeWidth="0.2" />
        </g>
    );
};

export default React.memo(GenericPalaceSymbol);