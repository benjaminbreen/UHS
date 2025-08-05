/**
 * components/symbols/CliffSymbol.tsx - Renders a stylized cliff face.
 */
import React from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';
import { shadeColorHSL } from '../../utils/colorUtils';

interface CliffSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const CliffSymbol: React.FC<CliffSymbolProps> = React.memo(({ x, y, size, seed, tile }) => {
    const localRand = () => new ValueNoise(seed + tile.x * 19 + tile.y * 53).random();
    const elements: JSX.Element[] = [];
    const baseColor = "#a08c7d";
    const darkColor = shadeColorHSL(baseColor, 0.75);
    const lightColor = shadeColorHSL(baseColor, 1.15);

    const topEdgeY = y + size * 0.1;
    const bottomEdgeY = y + size * 0.9;
    
    let pathD = `M ${x} ${topEdgeY + (localRand() - 0.5) * size * 0.1}`;

    // Jagged top edge
    for (let i = 1; i <= 4; i++) {
        const segX = x + i * (size / 4);
        const segY = topEdgeY + (localRand() - 0.5) * size * 0.15;
        pathD += ` L ${segX} ${segY}`;
    }

    // Jagged bottom edge
    pathD += ` L ${x + size} ${bottomEdgeY + (localRand() - 0.5) * size * 0.1}`;
    for (let i = 3; i >= 0; i--) {
        const segX = x + i * (size / 4);
        const segY = bottomEdgeY - (localRand() - 0.5) * size * 0.2;
        pathD += ` L ${segX} ${segY}`;
    }
    pathD += " Z";

    elements.push(<path key="cliff-base" d={pathD} fill={baseColor} />);

    // Vertical lines for texture
    for (let i = 0; i < 8; i++) {
        const lineX = x + size * (0.1 + localRand() * 0.8);
        const startY = topEdgeY + localRand() * size * 0.2;
        const endY = bottomEdgeY - localRand() * size * 0.2;
        const stroke = localRand() < 0.5 ? darkColor : lightColor;
        elements.push(<line key={`crack-${i}`} x1={lineX} y1={startY} x2={lineX + (localRand() - 0.5) * 5} y2={endY} stroke={stroke} strokeWidth="0.6" opacity="0.7"/>);
    }
    
    return <g>{elements}</g>;
});

export default CliffSymbol;
