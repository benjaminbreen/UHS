/**
 * components/symbols/buildings/EuropeanCottage3D.tsx - Renders a detailed, painterly European cottage.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface EuropeanCottage3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const EuropeanCottage3D: React.FC<EuropeanCottage3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 151 + tile.y * 157).random;
    const uniqueId = `cottage-${tile.x}-${tile.y}`;
    const elements = [];

    const wallType = rand() > 0.5 ? 'plaster' : 'stone';
    const plasterColor = `hsl(40, 30%, ${80 + rand() * 10}%)`;
    const stoneColor = `hsl(30, 15%, ${70 + rand() * 10}%)`;
    const woodColor = `hsl(25, 45%, 30%)`;
    const thatchColor = `hsl(40, 45%, 45%)`;
    const thatchHighlight = `hsl(45, 55%, 65%)`;
    const flowerColor = `hsl(${rand()*360}, 60%, 70%)`;
    const outlineColor = `hsl(25, 45%, 20%)`;

    const depth = size * 0.3;
    const roofPitch = height * 0.6;

    // Cast Shadow
    elements.push(
      <path key="shadow-soft" d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} l ${width} 0 l ${-depth*0.5} ${depth*0.3} l ${-width} 0 Z`} fill="rgba(0,0,0,0.2)" />,
      <path key="shadow-hard" d={`M ${x + depth} ${y + height + depth * 0.5} L ${x + width + depth} ${y + height + depth * 0.5} L ${x + width} ${y + height} L ${x} ${y + height} Z`} fill="rgba(0,0,0,0.15)" filter="url(#buildingShadow)" />
    );

    // Main Building Walls
    elements.push(<rect key="wall-main" x={x} y={y} width={width} height={height} fill={wallType === 'plaster' ? plasterColor : `url(#stonePattern-${uniqueId})`} />);
    elements.push(<path key="wall-side" d={`M ${x+width} ${y} L ${x+width+depth} ${y-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={wallType === 'plaster' ? plasterColor : `url(#stonePattern-${uniqueId})`} style={{filter:'brightness(0.7)'}} />);
    
    // Timber Framing
    if (rand() > 0.3) {
      elements.push(<rect key="tf-h1" x={x} y={y} width={width} height={2} fill={woodColor} />);
      elements.push(<rect key="tf-h2" x={x} y={y+height-2} width={width} height={2} fill={woodColor} />);
      elements.push(<rect key="tf-v1" x={x} y={y} width={2} height={height} fill={woodColor} />);
      elements.push(<rect key="tf-v2" x={x+width-2} y={y} width={2} height={height} fill={woodColor} />);
      if(rand() > 0.5) elements.push(<path key="tf-d" d={`M ${x} ${y} L ${x+width} ${y+height}`} stroke={woodColor} strokeWidth="2.5" />);
    }

    // Thatched Roof
    const roofY = y;
    elements.push(<path key="roof-main" d={`M ${x-3} ${roofY} L ${x+width/2} ${roofY-roofPitch} L ${x+width+3} ${roofY} Z`} fill={thatchColor} stroke={outlineColor} strokeWidth="0.2" />);
    elements.push(<path key="roof-side" d={`M ${x+width+3} ${roofY} L ${x+width+3+depth} ${roofY-depth*0.5} L ${x+width/2+depth} ${roofY-roofPitch-depth*0.5} L ${x+width/2} ${roofY-roofPitch} Z`} fill={thatchColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<path key="roof-highlight" d={`M ${x+3} ${roofY-1} L ${x+width/2} ${roofY-roofPitch+1} L ${x+width-3} ${roofY-1}`} fill="none" stroke={thatchHighlight} strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>);
    
    // Door
    const doorHeight = height * 0.5;
    const doorWidth = width * 0.25;
    elements.push(<rect key="door" x={x + width*0.1} y={y+height-doorHeight} width={doorWidth} height={doorHeight} fill={woodColor} stroke={outlineColor} strokeWidth="0.5"/>);
    
    // Window with flower box
    if (rand() > 0.4) {
        const winWidth = width * 0.3;
        const winHeight = height * 0.25;
        const winX = x + width * 0.55;
        const winY = y + height * 0.4;
        elements.push(<rect key="window" x={winX} y={winY} width={winWidth} height={winHeight} fill="#4a3522" stroke={outlineColor} strokeWidth="0.4"/>);
        const flowerboxHeight = height * 0.15;
        elements.push(<rect key="flowerbox" x={winX-1} y={winY+winHeight} width={winWidth+2} height={flowerboxHeight} fill={woodColor} />);
        for(let i=0; i<3; i++) {
             elements.push(<circle key={`flower-${i}`} cx={winX + 1 + i*(winWidth/3)} cy={winY+winHeight-1} r={1.2} fill={flowerColor} />);
        }
    }

    // Chimney with smoke
    if (rand() > 0.5) {
        const chimneyWidth = width * 0.2;
        const chimneyHeight = height * 0.4;
        const chimneyX = x + width * 0.7;
        // Calculate chimney Y based on roof slope
        const roofSlope = -roofPitch / (width/2);
        const chimneyYOnRoof = roofY + roofSlope * (chimneyX - (x-3));

        elements.push(<rect key="chimney" x={chimneyX} y={chimneyYOnRoof - chimneyHeight} width={chimneyWidth} height={chimneyHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3" />);
        if (rand() > 0.3) { // Smoke
             elements.push(<circle key="smoke" cx={chimneyX+chimneyWidth/2} cy={chimneyYOnRoof-chimneyHeight-3} r={3} fill="#e0e0e0" className="animate-smoke" style={{'--delay': rand()} as React.CSSProperties}/>);
        }
    }

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <pattern id={`stonePattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="6">
                    <rect width="6" height="6" fill={stoneColor} />
                    <rect x="0" y="3" width="3" height="3" fill={`hsl(30, 15%, 65%)`} opacity="0.5" />
                    <rect x="3" y="0" width="3" height="3" fill={`hsl(30, 15%, 65%)`} opacity="0.5" />
                    <line x1="0" y1="3" x2="6" y2="3" stroke={outlineColor} strokeWidth="0.1" opacity="0.6"/>
                    <line x1="3" y1="0" x2="3" y2="6" stroke={outlineColor} strokeWidth="0.1" opacity="0.6"/>
                </pattern>
            </defs>
            {elements}
        </g>
    );
});

export default EuropeanCottage3D;
