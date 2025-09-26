/**
 * components/symbols/buildings/MedievalBuilding3D.tsx - Renders a detailed, painterly medieval building.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface MedievalBuilding3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; roofColor: string; hasTimberFrame: boolean;
}

const MedievalBuilding3D: React.FC<MedievalBuilding3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, hasTimberFrame }) => {
    const rand = new ValueNoise(seed + tile.x * 89 + tile.y * 97).random;
    const uniqueId = `medieval-${tile.x}-${tile.y}`;
    const hasJetty = rand() > 0.5 && height > size * 0.5;
    const elements = [];
    
    // Validate dimensions to prevent negative values
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const safeSize = Math.max(1, size);

    const wallColor = `hsl(45, 30%, ${85 + rand() * 10}%)`;
    const woodColor = `hsl(25, 45%, 30%)`;
    const thatchHighlight = `hsl(45, 50%, 70%)`;
    const outlineColor = `hsl(25, 45%, 20%)`;
    const depth = safeSize * 0.3;
    const roofPitch = safeHeight * 0.5;
    
    // Cast Shadow - single unified shadow
    elements.push(
      <ellipse key="shadow" cx={x + safeWidth/2} cy={y + safeHeight + 2} rx={safeWidth * 0.55} ry={safeHeight * 0.12} fill="rgba(0,0,0,0.25)" filter="blur(1px)" />
    );

    const groundFloorHeight = hasJetty ? safeHeight * 0.5 : safeHeight;
    const groundFloorY = y + (hasJetty ? safeHeight * 0.5 : 0);

    // Ground Floor
    elements.push(<rect key="g-wall" x={x} y={groundFloorY} width={safeWidth} height={groundFloorHeight} fill={`url(#wattlePattern-${uniqueId})`} />);
    elements.push(<path key="g-side" d={`M ${x+safeWidth} ${groundFloorY} L ${x+safeWidth+depth} ${groundFloorY-depth*0.5} L ${x+safeWidth+depth} ${y+safeHeight-depth*0.5} L ${x+safeWidth} ${y+safeHeight} Z`} fill={`url(#wattlePattern-${uniqueId})`} style={{filter: 'brightness(0.7)'}} />);
    
    // Upper Floor (Jettied)
    if (hasJetty) {
        const jettyWidth = safeWidth * 1.15;
        const jettyX = x - (jettyWidth - safeWidth)/2;
        const jettyY = y;
        const jettyHeight = safeHeight * 0.5;
        const jettyDepth = depth * 1.15;

        elements.push(<rect key="u-wall" x={jettyX} y={jettyY} width={jettyWidth} height={jettyHeight} fill={`url(#wattlePattern-${uniqueId})`} />);
        elements.push(<path key="u-side" d={`M ${jettyX+jettyWidth} ${jettyY} L ${jettyX+jettyWidth+jettyDepth} ${jettyY-jettyDepth*0.5} L ${jettyX+jettyWidth+jettyDepth} ${jettyY+jettyHeight-jettyDepth*0.5} L ${jettyX+jettyWidth} ${jettyY+jettyHeight} Z`} fill={`url(#wattlePattern-${uniqueId})`} style={{filter: 'brightness(0.7)'}} />);
        
        // Jetty supports
        elements.push(<rect key="jetty-support" x={x-1} y={y+jettyHeight} width={safeWidth+2} height={3} fill={woodColor} stroke={outlineColor} strokeWidth="0.3"/>);
    }
    
    const roofY = hasJetty ? y : y;
    const roofWidth = hasJetty ? safeWidth * 1.25 : safeWidth + 6;
    const roofX = hasJetty ? x - (roofWidth - width) / 2 : x - 3;
    const roofDepth = hasJetty ? depth * 1.15 : depth;

    // Roof
    elements.push(<path key="roof" d={`M ${roofX} ${roofY} L ${roofX+roofWidth/2} ${roofY-roofPitch} L ${roofX+roofWidth} ${roofY} Z`} fill={`url(#thatchGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path key="roof-side" d={`M ${roofX+roofWidth} ${roofY} L ${roofX+roofWidth+roofDepth} ${roofY-roofDepth*0.5} L ${roofX+roofWidth/2+roofDepth} ${roofY-roofPitch-roofDepth*0.5} L ${roofX+roofWidth/2} ${roofY-roofPitch} Z`} fill={roofColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.3"/>);

    // Timber Framing
    if (hasTimberFrame) {
        const timberStroke = `hsl(25, 45%, 15%)`;
        // Ground Floor
        elements.push(<rect key="g-tf-h1" x={x} y={groundFloorY} width={safeWidth} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        elements.push(<rect key="g-tf-h2" x={x} y={y+safeHeight-2} width={safeWidth} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        elements.push(<rect key="g-tf-v1" x={x} y={groundFloorY} width={2} height={groundFloorHeight} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        elements.push(<rect key="g-tf-v2" x={x+safeWidth-2} y={groundFloorY} width={2} height={groundFloorHeight} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        if(rand() > 0.5) elements.push(<path key="g-tf-d" d={`M ${x} ${y+safeHeight} L ${x+safeWidth} ${groundFloorY}`} stroke={woodColor} strokeWidth="2.5" />);
        
        if(hasJetty) {
            const jettyWidth = width * 1.15;
            const jettyX = x - (jettyWidth - width)/2;
            elements.push(<rect key="u-tf-h1" x={jettyX} y={y} width={jettyWidth} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            elements.push(<rect key="u-tf-h2" x={jettyX} y={y+safeHeight*0.5-2} width={jettyWidth} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            elements.push(<rect key="u-tf-v1" x={jettyX} y={y} width={2} height={safeHeight*0.5} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            elements.push(<rect key="u-tf-v2" x={jettyX+jettyWidth-2} y={y} width={2} height={safeHeight*0.5} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            if(rand() > 0.5) elements.push(<path key="u-tf-d" d={`M ${jettyX} ${y} L ${jettyX+jettyWidth} ${y+safeHeight*0.5}`} stroke={woodColor} strokeWidth="2.5" />);
        }
    }
      
    // Door
    const doorHeight = Math.max(1, groundFloorHeight * 0.6);
    const doorWidth = Math.max(1, safeWidth * 0.25);
    elements.push(<rect key="door" x={x + safeWidth/2 - doorWidth/2} y={y + safeHeight - doorHeight} width={doorWidth} height={doorHeight} fill={woodColor} stroke="black" strokeWidth="0.4"/>);
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`thatchGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={thatchHighlight} />
                    <stop offset="100%" stopColor={roofColor} />
                </linearGradient>
                <pattern id={`wattlePattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill={wallColor} />
                    <path d="M 0 2 L 4 2 M 2 0 L 2 4" stroke={`hsl(45, 30%, 75%)`} strokeWidth="0.6" />
                </pattern>
            </defs>
            {elements}
        </g>
    );
});

export default MedievalBuilding3D;
