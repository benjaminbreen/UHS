/**
 * components/symbols/buildings/IndustrialBuilding3D.tsx - Renders a detailed, painterly industrial building.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface IndustrialBuilding3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const IndustrialBuilding3D: React.FC<IndustrialBuilding3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 53 + tile.y * 61).random;
    const hasSmokestacks = rand() > 0.3;
    const uniqueId = `industrial-${tile.x}-${tile.y}`;
    const elements = [];

    const brickColor1 = `hsl(15, 55%, ${45 + rand() * 10}%)`;
    const brickColor2 = `hsl(12, 50%, ${40 + rand() * 10}%)`;
    const mortarColor = `hsl(20, 15%, 70%)`;
    const roofColor = `hsl(210, 10%, 40%)`;
    const roofHighlight = `hsl(210, 10%, 60%)`;
    const windowColor = `hsl(200, 30%, 20%)`;
    const metalColor = `hsl(210, 10%, 50%)`;
    const smokeColor = `hsl(210, 5%, 60%)`;
    const outlineColor = `hsl(15, 55%, 25%)`;
    const wallShadowColor = `hsl(15, 55%, 35%)`;

    const wallFill = `url(#brickPattern-${uniqueId})`;
    const depth = size * 0.3;
    const buildingY = y + height * 0.2;
    const buildingHeight = height * 0.8;

    // Cast Shadow
     elements.push(
      <path key="shadow" d={`M ${x + depth * 0.5} ${y + height + depth * 0.25} l ${width} 0 l ${depth*0.5} ${-depth*0.3} l ${-width} 0 Z`} fill="rgba(0,0,0,0.2)" />
    );


    // Main Building
    elements.push(<rect key="main-wall" x={x} y={buildingY} width={width} height={buildingHeight} fill={wallFill} stroke={outlineColor} strokeWidth="0.2"/>);
    // Side
    elements.push(<path key="side-wall" d={`M ${x + width} ${buildingY} L ${x + width + depth} ${buildingY - depth*0.5} L ${x + width + depth} ${y + height - depth*0.5} L ${x + width} ${y + height} Z`} fill={wallShadowColor} stroke={outlineColor} strokeWidth="0.2"/>);
    // Roof
    elements.push(<path key="roof" d={`M ${x} ${buildingY} L ${x + depth} ${buildingY - depth*0.5} L ${x + width + depth} ${buildingY - depth*0.5} L ${x + width} ${buildingY} Z`} fill={`url(#roofGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.2"/>);

    // Windows
    for(let i=0; i < 3; i++) {
        const winX = x + 5 + i * (width/3.5);
        const winY = buildingY + buildingHeight*0.2;
        const winW = width*0.15;
        const winH = buildingHeight*0.6;
        elements.push(<rect key={`win-${i}`} x={winX} y={winY} width={winW} height={winH} fill={windowColor} stroke="black" strokeWidth="0.6" />);
        // Panes
        elements.push(<line key={`pane-v-${i}`} x1={winX + winW/2} y1={winY} x2={winX + winW/2} y2={winY+winH} stroke={metalColor} strokeWidth="0.4" opacity="0.6"/>);
        elements.push(<line key={`pane-h-${i}`} x1={winX} y1={winY+winH/2} x2={winX+winW} y2={winY+winH/2} stroke={metalColor} strokeWidth="0.4" opacity="0.6"/>);
    }
      
    // Smokestack
    if (hasSmokestacks) {
        const stackX = x + width * 0.1;
        const stackY = buildingY - height * 0.5;
        const stackW = width * 0.15;
        const stackH = height * 0.6;
        const stackDepth = depth * 0.2;

        elements.push(
            <g key="smokestack-group">
                <rect x={stackX} y={stackY} width={stackW} height={stackH} fill={wallFill} style={{filter: 'brightness(0.8)'}} stroke={outlineColor} strokeWidth="0.3"/>
                <path d={`M ${stackX+stackW} ${stackY} L ${stackX+stackW+stackDepth} ${stackY-stackDepth*0.5} L ${stackX+stackW+stackDepth} ${stackY+stackH-stackDepth*0.5} L ${stackX+stackW} ${stackY+stackH} Z`} fill={wallShadowColor} stroke={outlineColor} strokeWidth="0.3" />
                <ellipse cx={stackX + stackW/2} cy={stackY} rx={stackW/2} ry={2} fill="#333" stroke="black" strokeWidth="0.2"/>
                {rand() > 0.4 && ( // smoke
                    <circle cx={stackX + stackW/2} cy={stackY-5} r={4} fill={smokeColor} className="animate-smoke" style={{'--delay': rand()} as React.CSSProperties}/>
                )}
            </g>
        );
    }

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <pattern id={`brickPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="8">
                    <rect width="8" height="8" fill={mortarColor}/>
                    <rect width="7.5" height="3" x="0.25" y="0.25" fill={brickColor1}/>
                    <rect x="4.25" y="4.25" width="3.5" height="3" fill={brickColor2}/>
                    <rect y="4.25" width="3.5" height="3" x="0.25" fill={brickColor1}/>
                </pattern>
                <linearGradient id={`roofGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={roofHighlight} />
                    <stop offset="100%" stopColor={roofColor} />
                </linearGradient>
            </defs>
            {elements}
        </g>
    );
});

export default IndustrialBuilding3D;
