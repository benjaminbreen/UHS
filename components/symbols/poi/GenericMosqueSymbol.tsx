/**
 * components/symbols/poi/GenericMosqueSymbol.tsx - Renders a simple mosque
 */
import React from 'react';
import { Tile } from '../../../types';

interface GenericMosqueSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const GenericMosqueSymbol: React.FC<GenericMosqueSymbolProps> = ({ x, y, size }) => {
    const wallColor = "#F5DEB3";
    const domeColor = "#20B2AA";
    const shadowColor = "#DEB887";
    const outlineColor = "#CD853F";
    const depth = size * 0.3;

    return (
        <g>
            {/* Main Building */}
            <rect x={x + size * 0.2} y={y + size * 0.4} width={size * 0.6} height={size * 0.5} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x + size * 0.8} ${y + size * 0.4} L ${x + size * 0.8 + depth} ${y + size * 0.4 - depth * 0.5} L ${x + size * 0.8 + depth} ${y + size * 0.9 - depth * 0.5} L ${x + size * 0.8} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2" />

            {/* Dome */}
            <ellipse cx={x + size * 0.5} cy={y + size * 0.4} rx={size * 0.2} ry={size * 0.15} fill={domeColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Minaret */}
            <rect x={x + size * 0.05} y={y + size * 0.2} width={size * 0.1} height={size * 0.7} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />
            <ellipse cx={x + size * 0.1} cy={y + size * 0.2} rx={size * 0.05} ry={size * 0.03} fill={domeColor} />
        </g>
    );
};

export default React.memo(GenericMosqueSymbol);