/**
 * components/symbols/buildings/AztecDwelling3D.tsx - Renders a detailed, painterly Aztec/Mesoamerican pyramid dwelling.
 */
import React from 'react';
import { Tile, BiomeType } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AztecDwelling3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; nightIntensity?: number;
}

const AztecDwelling3D: React.FC<AztecDwelling3DProps> = React.memo(({ x, y, width, height, size, seed, tile, nightIntensity = 0 }) => {
    const rand = new ValueNoise(seed + tile.x * 23 + tile.y * 41).random;
    const isTemple = tile.biome === BiomeType.CITY_CENTER || rand() > 0.8;
    const tiers = isTemple ? 3 : 2;
    const elements: JSX.Element[] = [];
    const uniqueId = `aztec-${tile.x}-${tile.y}`;

    const baseColor = `hsl(35, 20%, ${65 + rand() * 10}%)`;
    const shadowColor = `hsl(35, 25%, 50%)`;
    const highlightColor = `hsl(40, 30%, 80%)`;
    const accentColor = `hsl(10, 60%, 50%)`;
    const stairShadowColor = `hsl(35, 25%, 40%)`;
    const outlineColor = `hsl(35, 25%, 35%)`;

    const depth = size * 0.3;

    // Cast Shadow
    elements.push(
      <path
        key="shadow"
        d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} L ${x + width + depth * 0.5} ${y + height + depth * 0.2} L ${x + width} ${y + height} L ${x} ${y + height} Z`}
        fill="rgba(0,0,0,0.2)"
      />
    );

    for (let i = 0; i < tiers; i++) {
        const tierWidth = width * (1 - i * 0.2);
        const tierHeight = (height * 0.8) / tiers;
        const tierX = x + (width - tierWidth) / 2;
        const tierY = y + height - (i + 1) * tierHeight;
        const sideDepth = depth * (1 - i * 0.2);

        // Main Face
        elements.push(<rect key={`tier-wall-${i}`} x={tierX} y={tierY} width={tierWidth} height={tierHeight} fill={`url(#stonePattern-${uniqueId})`} stroke={outlineColor} strokeWidth="0.2"/>);
        elements.push(<rect key={`tier-overlay-${i}`} x={tierX} y={tierY} width={tierWidth} height={tierHeight} fill={`url(#stoneGradient-${uniqueId})`} />);
        // Side
        elements.push(<path key={`tier-side-${i}`} d={`M ${tierX + tierWidth} ${tierY} L ${tierX + tierWidth + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth + sideDepth} ${tierY + tierHeight - sideDepth*0.5} L ${tierX + tierWidth} ${tierY + tierHeight} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2"/>);
        elements.push(<path key={`tier-side-pattern-${i}`} d={`M ${tierX + tierWidth} ${tierY} L ${tierX + tierWidth + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth + sideDepth} ${tierY + tierHeight - sideDepth*0.5} L ${tierX + tierWidth} ${tierY + tierHeight} Z`} fill={`url(#stonePattern-${uniqueId})`} style={{filter:'brightness(0.7)'}}/>);

        // Top
        elements.push(<path key={`tier-top-${i}`} d={`M ${tierX} ${tierY} L ${tierX + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth + sideDepth} ${tierY - sideDepth*0.5} L ${tierX + tierWidth} ${tierY} Z`} fill={highlightColor} stroke={outlineColor} strokeWidth="0.2" />);
    }

    const topY = y + height - (tiers * (height * 0.8 / tiers));

    // Temple on top
    if (isTemple) {
        const templeWidth = width * 0.4;
        const templeHeight = height * 0.25;
        const templeX = x + (width - templeWidth) / 2;
        const templeY = topY - templeHeight;
        const templeDepth = depth * 0.4;

        elements.push(<rect key="temple-wall" x={templeX} y={templeY} width={templeWidth} height={templeHeight} fill={baseColor} stroke={outlineColor} strokeWidth="0.3" />);
        elements.push(<path key={`temple-side`} d={`M ${templeX + templeWidth} ${templeY} L ${templeX + templeWidth + templeDepth} ${templeY - templeDepth*0.5} L ${templeX + templeWidth + templeDepth} ${templeY + templeHeight - templeDepth*0.5} L ${templeX + templeWidth} ${templeY + templeHeight} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3"/>);
        elements.push(<path key={`temple-top`} d={`M ${templeX} ${templeY} L ${templeX + templeDepth} ${templeY - templeDepth*0.5} L ${templeX + templeWidth + templeDepth} ${templeY - templeDepth*0.5} L ${templeX + templeWidth} ${templeY} Z`} fill={highlightColor} stroke={outlineColor} strokeWidth="0.2"/>);
        elements.push(<rect key="temple-roof-trim" x={templeX-2} y={templeY-2} width={templeWidth+4} height={4} fill={accentColor} stroke={outlineColor} strokeWidth="0.3"/>);
        elements.push(<rect key="temple-door" x={templeX + templeWidth/2 - 3} y={templeY + templeHeight * 0.3} width={6} height={templeHeight*0.7} fill="#2c1e12"/>);
    }
  
    // Stairs
    const stairWidth = width * 0.3;
    const stairX = x + (width - stairWidth) / 2;
    
    for(let i = 0; i < tiers * 6; i++) {
      const stepHeight = (height * 0.8) / (tiers * 6);
      const stepY = y + height - i * stepHeight;
      elements.push(<rect key={`step-${i}`} x={stairX} y={stepY - stepHeight} width={stairWidth} height={stepHeight} fill={i%2 === 0 ? stairShadowColor : highlightColor} opacity="0.8"/>);
    }

    // Add torch braziers for night lighting (33% chance)
    if (nightIntensity >= 0.2 && rand() > 0.67) {
      const numTorches = isTemple ? 2 : 1;
      for (let i = 0; i < numTorches; i++) {
        const torchX = x + width * (0.2 + i * 0.6);
        const torchY = y + height - (tiers * (height * 0.8) / tiers) + size * 0.05;
        const fireColor = 'rgba(255, 120, 40, 0.9)';
        const glowColor = 'rgba(255, 160, 60, 0.7)';
        
        // Fire brazier
        elements.push(
          <g key={`torch-${i}`}>
            {/* Fire glow */}
            <circle
              cx={torchX}
              cy={torchY}
              r={size * 0.1}
              fill={glowColor}
              opacity={nightIntensity * 0.8}
              filter="blur(5px)"
            />
            <circle
              cx={torchX}
              cy={torchY}
              r={size * 0.05}
              fill={fireColor}
              opacity={nightIntensity}
              filter="blur(2px)"
            />
            {/* Stone brazier base */}
            <rect
              x={torchX - size * 0.03}
              y={torchY + size * 0.02}
              width={size * 0.06}
              height={size * 0.04}
              fill={shadowColor}
              opacity={nightIntensity * 0.9}
            />
          </g>
        );
      }
    }
  
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`stoneGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={highlightColor} stopOpacity="0.5" />
                    <stop offset="50%" stopColor={baseColor} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={shadowColor} stopOpacity="0.4" />
                </linearGradient>
                <pattern id={`stonePattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="8">
                    <rect width="8" height="8" fill={baseColor} />
                    <rect x="0" y="4" width="4" height="4" fill={shadowColor} opacity="0.15" />
                    <rect x="4" y="0" width="4" height="4" fill={shadowColor} opacity="0.15" />
                    <line x1="0" y1="4" x2="8" y2="4" stroke={outlineColor} strokeWidth="0.15" opacity="0.5"/>
                    <line x1="4" y1="0" x2="4" y2="8" stroke={outlineColor} strokeWidth="0.15" opacity="0.5"/>
                </pattern>
            </defs>
            {elements}
        </g>
    );
});

export default AztecDwelling3D;