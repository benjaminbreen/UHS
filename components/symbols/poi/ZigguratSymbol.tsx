/**
 * components/symbols/poi/ZigguratSymbol.tsx - Renders a detailed Ziggurat
 */
import React from 'react';
import { Tile } from '../../../types';

interface ZigguratSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const ZigguratSymbol: React.FC<ZigguratSymbolProps> = ({ x, y, size }) => {
    const baseColor = "#D2B48C"; // Tan
    const shadowColor = "#B8860B"; // DarkGoldenRod
    const highlightColor = "#F5DEB3"; // Wheat
    const outlineColor = "#8B4513"; // SaddleBrown
    const depth = size * 0.4;

    const tiers = 4;
    const elements = [];

    for (let i = 0; i < tiers; i++) {
        const tierWidth = size * (0.8 - i * 0.15);
        const tierHeight = (size * 0.7) / tiers;
        const tierX = x + (size - tierWidth) / 2;
        const tierY = y + size * 0.8 - (i + 1) * tierHeight;
        const sideDepth = depth * (1 - i * 0.15);

        // Side
        elements.push(<path key={`tier-side-${i}`} d={`M ${tierX + tierWidth} ${tierY} L ${tierX + tierWidth + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth + sideDepth} ${tierY + tierHeight - sideDepth*0.5} L ${tierX + tierWidth} ${tierY + tierHeight} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2"/>);
        // Main Face
        elements.push(<rect key={`tier-wall-${i}`} x={tierX} y={tierY} width={tierWidth} height={tierHeight} fill={baseColor} stroke={outlineColor} strokeWidth="0.2"/>);
        // Top
        elements.push(<path key={`tier-top-${i}`} d={`M ${tierX} ${tierY} L ${tierX + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth} ${tierY} Z`} fill={highlightColor} stroke={outlineColor} strokeWidth="0.2" />);
    }

    // Top temple
    const topTierY = y + size * 0.8 - tiers * ((size * 0.7) / tiers);
    const templeWidth = size * 0.2;
    const templeHeight = size * 0.15;
    const templeX = x + (size - templeWidth) / 2;
    const templeY = topTierY - templeHeight;
    const templeDepth = depth * 0.2;
    
    elements.push(<rect key="temple-wall" x={templeX} y={templeY} width={templeWidth} height={templeHeight} fill={baseColor} stroke={outlineColor} strokeWidth="0.3" />);
    elements.push(<path key={`temple-side`} d={`M ${templeX + templeWidth} ${templeY} L ${templeX + templeWidth + templeDepth} ${templeY - templeDepth*0.5} L ${templeX + templeWidth + templeDepth} ${templeY + templeHeight - templeDepth*0.5} L ${templeX + templeWidth} ${templeY + templeHeight} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3"/>);
    
    // Stairs
    const stairWidth = size * 0.2;
    const stairX = x + (size - stairWidth) / 2;
    elements.push(<path key="stairs" d={`M ${stairX} ${y + size * 0.8} L ${stairX + stairWidth} ${y + size * 0.8} L ${x + size/2} ${topTierY} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2" />);

    return <g filter="url(#symbolShadow)">{elements}</g>;
};

export default React.memo(ZigguratSymbol);