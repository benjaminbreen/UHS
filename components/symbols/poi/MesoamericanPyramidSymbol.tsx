/**
 * components/symbols/poi/MesoamericanPyramidSymbol.tsx - Renders a Mesoamerican-style Pyramid
 */
import React from 'react';
import { Tile } from '../../../types';

interface MesoamericanPyramidSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const MesoamericanPyramidSymbol: React.FC<MesoamericanPyramidSymbolProps> = ({ x, y, size }) => {
    const stoneColor = "#A9A9A9";
    const shadowColor = "#808080";
    const outlineColor = "#696969";
    const depth = size * 0.3;
    const tiers = 4;
    const elements = [];

    for (let i = 0; i < tiers; i++) {
        const tierWidth = size * (0.9 - i * 0.2);
        const tierHeight = (size * 0.7) / tiers;
        const tierX = x + (size - tierWidth) / 2;
        const tierY = y + size * 0.8 - (i + 1) * tierHeight;
        
        elements.push(<rect key={`tier-${i}`} x={tierX} y={tierY} width={tierWidth} height={tierHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2"/>);
    }

    // Top temple
    const topY = y + size * 0.8 - tiers * (size * 0.7 / tiers);
    elements.push(<rect x={x + size*0.4} y={topY - size*0.15} width={size*0.2} height={size*0.15} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2"/>);

    return <g filter="url(#symbolShadow)">{elements}</g>;
};

export default React.memo(MesoamericanPyramidSymbol);