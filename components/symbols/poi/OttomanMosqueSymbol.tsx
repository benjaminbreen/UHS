/**
 * components/symbols/poi/OttomanMosqueSymbol.tsx - Renders a grand Ottoman-style Mosque
 */
import React from 'react';
import { Tile } from '../../../types';

interface OttomanMosqueSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const OttomanMosqueSymbol: React.FC<OttomanMosqueSymbolProps> = ({ x, y, size }) => {
    const wallColor = "#F5F5DC";
    const domeColor = "#4682B4"; // SteelBlue
    const shadowColor = "#DCDCDC";
    const outlineColor = "#696969";
    const depth = size * 0.4;

    return (
        <g filter="url(#symbolShadow)">
            {/* Main Building */}
            <rect x={x + size * 0.1} y={y + size * 0.4} width={size * 0.8} height={size * 0.5} fill={wallColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Main Dome */}
            <ellipse cx={x + size * 0.5} cy={y + size * 0.4} rx={size * 0.3} ry={size * 0.25} fill={domeColor} stroke={outlineColor} strokeWidth="0.3" />

            {/* Smaller Domes */}
            <ellipse cx={x + size * 0.2} cy={y + size * 0.45} rx={size * 0.1} ry={size * 0.08} fill={domeColor} />
            <ellipse cx={x + size * 0.8} cy={y + size * 0.45} rx={size * 0.1} ry={size * 0.08} fill={domeColor} />

            {/* Minarets */}
            <rect x={x} y={y + size * 0.1} width={size * 0.1} height={size * 0.8} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />
            <rect x={x + size * 0.9} y={y + size * 0.1} width={size * 0.1} height={size * 0.8} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x} ${y + size * 0.1} L ${x + size * 0.05} ${y} L ${x + size * 0.1} ${y + size * 0.1} Z`} fill={domeColor} />
            <path d={`M ${x + size * 0.9} ${y + size * 0.1} L ${x + size * 0.95} ${y} L ${x + size * 1.0} ${y + size * 0.1} Z`} fill={domeColor} />
        </g>
    );
};

export default React.memo(OttomanMosqueSymbol);