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

    const wallColor = `hsl(45, 30%, ${85 + rand() * 10}%)`;
    const woodColor = `hsl(25, 45%, 30%)`;
    const thatchHighlight = `hsl(45, 50%, 70%)`;
    const outlineColor = `hsl(25, 45%, 20%)`;
    const depth = size * 0.3;
    const roofPitch = height * 0.5;
    
    // Cast Shadow
    elements.push(
      <path key="shadow-soft" d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} l ${width} 0 l ${-depth*0.5} ${depth*0.3} l ${-width} 0 Z`} fill="rgba(0,0,0,0.2)" />,
      <path key="shadow-hard" d={`M ${x + depth} ${y + height + depth * 0.5} L ${x + width + depth} ${y + height + depth * 0.5} L ${x + width} ${y + height} L ${x} ${y + height} Z`} fill="rgba(0,0,0,0.15)" filter="url(#buildingShadow)" />
    );

    const groundFloorHeight = hasJetty ? height * 0.5 : height;
    const groundFloorY = y + (hasJetty ? height * 0.5 : 0);

    // Ground Floor
    elements.push(<rect key="g-wall" x={x} y={groundFloorY} width={width} height={groundFloorHeight} fill={`url(#wattlePattern-${uniqueId})`} />);
    elements.push(<path key="g-side" d={`M ${x+width} ${groundFloorY} L ${x+width+depth} ${groundFloorY-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={`url(#wattlePattern-${uniqueId})`} style={{filter: 'brightness(0.7)'}} />);
    
    // Upper Floor (Jettied)
    if (hasJetty) {
        const jettyWidth = width * 1.15;
        const jettyX = x - (jettyWidth - width)/2;
        const jettyY = y;
        const jettyHeight = height * 0.5;
        const jettyDepth = depth * 1.15;

        elements.push(<rect key="u-wall" x={jettyX} y={jettyY} width={jettyWidth} height={jettyHeight} fill={`url(#wattlePattern-${uniqueId})`} />);
        elements.push(<path key="u-side" d={`M ${jettyX+jettyWidth} ${jettyY} L ${jettyX+jettyWidth+jettyDepth} ${jettyY-jettyDepth*0.5} L ${jettyX+jettyWidth+jettyDepth} ${jettyY+jettyHeight-jettyDepth*0.5} L ${jettyX+jettyWidth} ${jettyY+jettyHeight} Z`} fill={`url(#wattlePattern-${uniqueId})`} style={{filter: 'brightness(0.7)'}} />);
        
        // Jetty supports
        elements.push(<rect key="jetty-support" x={x-1} y={y+jettyHeight} width={width+2} height={3} fill={woodColor} stroke={outlineColor} strokeWidth="0.3"/>);
    }
    
    const roofY = hasJetty ? y : y;
    const roofWidth = hasJetty ? width * 1.25 : width + 6;
    const roofX = hasJetty ? x - (roofWidth - width) / 2 : x - 3;
    const roofDepth = hasJetty ? depth * 1.15 : depth;

    // Roof
    elements.push(<path key="roof" d={`M ${roofX} ${roofY} L ${roofX+roofWidth/2} ${roofY-roofPitch} L ${roofX+roofWidth} ${roofY} Z`} fill={`url(#thatchGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path key="roof-side" d={`M ${roofX+roofWidth} ${roofY} L ${roofX+roofWidth+roofDepth} ${roofY-roofDepth*0.5} L ${roofX+roofWidth/2+roofDepth} ${roofY-roofPitch-roofDepth*0.5} L ${roofX+roofWidth/2} ${roofY-roofPitch} Z`} fill={roofColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.3"/>);

    // Timber Framing
    if (hasTimberFrame) {
        const timberStroke = `hsl(25, 45%, 15%)`;
        // Ground Floor
        elements.push(<rect key="g-tf-h1" x={x} y={groundFloorY} width={width} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        elements.push(<rect key="g-tf-h2" x={x} y={y+height-2} width={width} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        elements.push(<rect key="g-tf-v1" x={x} y={groundFloorY} width={2} height={groundFloorHeight} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        elements.push(<rect key="g-tf-v2" x={x+width-2} y={groundFloorY} width={2} height={groundFloorHeight} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
        if(rand() > 0.5) elements.push(<path key="g-tf-d" d={`M ${x} ${y+height} L ${x+width} ${groundFloorY}`} stroke={woodColor} strokeWidth="2.5" />);
        
        if(hasJetty) {
            const jettyWidth = width * 1.15;
            const jettyX = x - (jettyWidth - width)/2;
            elements.push(<rect key="u-tf-h1" x={jettyX} y={y} width={jettyWidth} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            elements.push(<rect key="u-tf-h2" x={jettyX} y={y+height*0.5-2} width={jettyWidth} height={2} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            elements.push(<rect key="u-tf-v1" x={jettyX} y={y} width={2} height={height*0.5} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            elements.push(<rect key="u-tf-v2" x={jettyX+jettyWidth-2} y={y} width={2} height={height*0.5} fill={woodColor} stroke={timberStroke} strokeWidth="0.2"/>);
            if(rand() > 0.5) elements.push(<path key="u-tf-d" d={`M ${jettyX} ${y} L ${jettyX+jettyWidth} ${y+height*0.5}`} stroke={woodColor} strokeWidth="2.5" />);
        }
    }
      
    // Door
    const doorHeight = groundFloorHeight * 0.6;
    const doorWidth = width * 0.25;
    elements.push(<rect x={x + width/2 - doorWidth/2} y={y + height - doorHeight} width={doorWidth} height={doorHeight} fill={woodColor} stroke="black" strokeWidth="0.4"/>);
    
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
