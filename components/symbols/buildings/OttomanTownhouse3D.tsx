/**
 * components/symbols/buildings/OttomanTownhouse3D.tsx - Renders a detailed, painterly Ottoman/MENA style townhouse.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface OttomanTownhouse3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const OttomanTownhouse3D: React.FC<OttomanTownhouse3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 127 + tile.y * 131).random;
    const uniqueId = `ottoman-${tile.x}-${tile.y}`;
    const elements = [];
    
    const wallColor = `hsl(45, 40%, ${85 + rand() * 10}%)`;
    const woodColor = `hsl(25, 45%, 35%)`;
    const roofColor = `hsl(10, 60%, 45%)`;
    const stoneColor = `hsl(30, 20%, 75%)`;
    const outlineColor = `hsl(25, 45%, 20%)`;

    const depth = size * 0.3;

    // Upper Floor (Jettied)
    const jettyWidth = width + size*0.15;
    const jettyX = x - size*0.075;
    const jettyY = y;
    const jettyHeight = height * 0.55;
    const jettyDepth = depth * 1.15;

    // Cast Shadow
    elements.push(
      <path key="shadow-soft" d={`M ${jettyX + jettyDepth * 0.5} ${y + height + jettyDepth * 0.2} l ${jettyWidth} 0 l ${-jettyDepth*0.5} ${jettyDepth*0.3} l ${-jettyWidth} 0 Z`} fill="rgba(0,0,0,0.2)" />,
      <path key="shadow-hard" d={`M ${jettyX + jettyDepth} ${y + height + jettyDepth * 0.5} L ${jettyX + jettyWidth + jettyDepth} ${y + height + jettyDepth * 0.5} L ${jettyX+jettyWidth} ${y+height} L ${jettyX} ${y+height} Z`} fill="rgba(0,0,0,0.15)" filter="url(#buildingShadow)" />
    );

    // Ground Floor (Stone)
    const groundHeight = height * 0.45;
    const groundY = y + height - groundHeight;
    elements.push(<rect key="ground-wall" x={x} y={groundY} width={width} height={groundHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<path key="ground-side" d={`M ${x+width} ${groundY} L ${x+width+depth} ${groundY-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={`hsl(30, 20%, 65%)`} stroke={outlineColor} strokeWidth="0.2"/>);
    
    const doorHeight = groundHeight * 0.8;
    const doorWidth = width * 0.3;
    elements.push(<rect key="ground-door" x={x + width/2 - doorWidth/2} y={y+height-doorHeight} width={doorWidth} height={doorHeight} fill={woodColor} stroke="black" strokeWidth="0.4"/>);
  
    // Upper Floor
    elements.push(<rect key="upper-wall" x={jettyX} y={jettyY} width={jettyWidth} height={jettyHeight} fill={wallColor} stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<path key="upper-side" d={`M ${jettyX+jettyWidth} ${jettyY} L ${jettyX+jettyWidth+jettyDepth} ${jettyY-jettyDepth*0.5} L ${jettyX+jettyWidth+jettyDepth} ${jettyY+jettyHeight-jettyDepth*0.5} L ${jettyX+jettyWidth} ${jettyY+jettyHeight} Z`} fill={`hsl(45, 40%, 75%)`} stroke={outlineColor} strokeWidth="0.2"/>);

    // Mashrabiya window
    elements.push(<rect key={`window`} x={jettyX + jettyWidth/2 - 8} y={jettyY + 4} width="16" height="8" fill={`url(#mashrabiya-${uniqueId})`} />);
    elements.push(<rect key={`window-frame`} x={jettyX + jettyWidth/2 - 9} y={jettyY + 3} width="18" height="10" fill="none" stroke={woodColor} strokeWidth="1.2"/>);

    // Jetty supports
    elements.push(<rect key="jetty-support-main" x={x-1} y={y+jettyHeight} width={width+2} height={3} fill={woodColor} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path key="jetty-support-side" d={`M ${x+width+1} ${y+jettyHeight} L ${x+width+1+depth} ${y+jettyHeight-depth*0.5} L ${x+width+1+depth} ${y+jettyHeight+3-depth*0.5} L ${x+width+1} ${y+jettyHeight+3} Z`} fill={`hsl(25,45%,25%)`} stroke={outlineColor} strokeWidth="0.2"/>);

    // Roof
    const roofY = y;
    const roofOverhang = 4;
    const roofHeight = 8;
    const correctedSideRoofPath = `M ${jettyX+jettyWidth+roofOverhang} ${roofY} L ${jettyX+jettyWidth+roofOverhang+jettyDepth} ${roofY-jettyDepth*0.5} L ${jettyX+jettyWidth+jettyDepth} ${roofY-roofHeight-jettyDepth*0.5} L ${jettyX+jettyWidth} ${roofY-roofHeight} Z`;
    elements.push(<path key="roof-main" d={`M ${jettyX - roofOverhang} ${roofY} L ${jettyX + jettyWidth + roofOverhang} ${roofY} L ${jettyX + jettyWidth} ${roofY-roofHeight} L ${jettyX} ${roofY-roofHeight} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path key="roof-side" d={correctedSideRoofPath} fill={`hsl(10,60%,35%)`} stroke={outlineColor} strokeWidth="0.3"/>);
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <pattern id={`mashrabiya-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill={woodColor} />
                    <circle cx="2" cy="2" r="1.2" fill={wallColor} />
                </pattern>
            </defs>
            {elements}
        </g>
    );
});

export default OttomanTownhouse3D;
