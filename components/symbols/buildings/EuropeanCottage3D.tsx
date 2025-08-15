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
    const rng = new ValueNoise(seed + tile.x * 151 + tile.y * 157);
    const uniqueId = `cottage-${tile.x}-${tile.y}`;
    const elements = [];

    // Pre-calculate all random values to prevent re-rendering changes
    const wallTypeRand = rng.random();
    const plasterBrightness = rng.random();
    const stoneBrightness = rng.random();
    const flowerHue = rng.random();
    const hasTimberFraming = rng.random();
    const hasDiagonalTimber = rng.random();
    const hasWindow = rng.random();
    const hasChimney = rng.random();
    const hasSmoke = rng.random();
    const smokeDelay = rng.random();
    
    const rand = rng.random; // Keep for compatibility if needed

    const wallType = wallTypeRand > 0.5 ? 'plaster' : 'stone';
    const plasterColor = `hsl(40, 30%, ${80 + plasterBrightness * 10}%)`;
    const stoneColor = `hsl(30, 15%, ${70 + stoneBrightness * 10}%)`;
    const woodColor = `hsl(25, 45%, 30%)`;
    const thatchColor = `hsl(40, 45%, 45%)`;
    const thatchHighlight = `hsl(45, 55%, 65%)`;
    const flowerColor = `hsl(${flowerHue*360}, 60%, 70%)`;
    const outlineColor = `hsl(25, 45%, 20%)`;

    const depth = size * 0.3;
    const roofPitch = height * 0.5; // Reduced for better proportions
    const wallY = y + height * 0.3; // Start walls lower to accommodate roof
    const wallHeight = height * 0.7;

    // Clean shadow underneath
    elements.push(
      <ellipse 
        key="shadow" 
        cx={x + width/2} 
        cy={y + height + 2} 
        rx={width * 0.55} 
        ry={height * 0.12}
        fill="rgba(0, 0, 0, 0.25)"
        filter="blur(1px)"
      />
    );

    // Main Building Walls - properly positioned
    elements.push(<rect key="wall-main" x={x} y={wallY} width={width} height={wallHeight} fill={wallType === 'plaster' ? plasterColor : `url(#stonePattern-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3" />);
    elements.push(<path key="wall-side" d={`M ${x+width} ${wallY} L ${x+width+depth} ${wallY-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={wallType === 'plaster' ? `hsl(40, 30%, ${70 + plasterBrightness * 10}%)` : stoneColor} stroke={outlineColor} strokeWidth="0.3" />);
    
    // Timber Framing - adjusted for new wall position
    if (hasTimberFraming > 0.3) {
      elements.push(<rect key="tf-h1" x={x} y={wallY} width={width} height={2} fill={woodColor} />);
      elements.push(<rect key="tf-h2" x={x} y={y+height-2} width={width} height={2} fill={woodColor} />);
      elements.push(<rect key="tf-v1" x={x} y={wallY} width={2} height={wallHeight} fill={woodColor} />);
      elements.push(<rect key="tf-v2" x={x+width-2} y={wallY} width={2} height={wallHeight} fill={woodColor} />);
      if(hasDiagonalTimber > 0.5) elements.push(<path key="tf-d" d={`M ${x} ${wallY} L ${x+width} ${y+height}`} stroke={woodColor} strokeWidth="2.5" />);
    }

    // Thatched Roof - properly positioned above walls
    const roofY = wallY + 2;
    const roofOverhang = 4;
    elements.push(<path key="roof-main" d={`M ${x-roofOverhang} ${roofY} L ${x+width/2} ${roofY-roofPitch} L ${x+width+roofOverhang} ${roofY} Z`} fill={thatchColor} stroke={outlineColor} strokeWidth="0.3" />);
    elements.push(<path key="roof-side" d={`M ${x+width+roofOverhang} ${roofY} L ${x+width+roofOverhang+depth} ${roofY-depth*0.5} L ${x+width/2+depth} ${roofY-roofPitch-depth*0.5} L ${x+width/2} ${roofY-roofPitch} Z`} fill={`hsl(40, 45%, 38%)`} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path key="roof-highlight" d={`M ${x+3} ${roofY-2} L ${x+width/2} ${roofY-roofPitch+2} L ${x+width-3} ${roofY-2}`} fill="none" stroke={thatchHighlight} strokeWidth="1.5" opacity="0.6" strokeLinecap="round"/>);
    
    // Door - adjusted for new wall position
    const doorHeight = wallHeight * 0.6;
    const doorWidth = width * 0.25;
    elements.push(<rect key="door" x={x + width*0.1} y={y+height-doorHeight} width={doorWidth} height={doorHeight} fill={woodColor} stroke={outlineColor} strokeWidth="0.5"/>);
    
    // Window with flower box - adjusted position
    if (hasWindow > 0.4) {
        const winWidth = width * 0.25;
        const winHeight = wallHeight * 0.25;
        const winX = x + width * 0.6;
        const winY = wallY + wallHeight * 0.3;
        elements.push(<rect key="window" x={winX} y={winY} width={winWidth} height={winHeight} fill="rgba(30,30,35,0.9)" stroke={woodColor} strokeWidth="0.8"/>);
        // Window cross bars
        elements.push(<line key="win-h" x1={winX} y1={winY+winHeight/2} x2={winX+winWidth} y2={winY+winHeight/2} stroke={woodColor} strokeWidth="0.6"/>);
        elements.push(<line key="win-v" x1={winX+winWidth/2} y1={winY} x2={winX+winWidth/2} y2={winY+winHeight} stroke={woodColor} strokeWidth="0.6"/>);
        // Flower box
        const flowerboxHeight = wallHeight * 0.08;
        elements.push(<rect key="flowerbox" x={winX-1} y={winY+winHeight} width={winWidth+2} height={flowerboxHeight} fill={woodColor} stroke={outlineColor} strokeWidth="0.3" />);
        for(let i=0; i<3; i++) {
             elements.push(<circle key={`flower-${i}`} cx={winX + 3 + i*(winWidth/3)} cy={winY+winHeight+1} r={1.5} fill={flowerColor} />);
        }
    }

    // Chimney with smoke - properly positioned on roof
    if (hasChimney > 0.5) {
        const chimneyWidth = width * 0.15;
        const chimneyHeight = roofPitch * 0.6;
        const chimneyX = x + width * 0.75;
        // Calculate chimney Y position on the sloped roof
        const distFromRoofCenter = Math.abs(chimneyX - (x + width/2));
        const chimneyYOnRoof = roofY - roofPitch + (distFromRoofCenter * roofPitch / (width/2));

        elements.push(<rect key="chimney" x={chimneyX} y={chimneyYOnRoof - chimneyHeight} width={chimneyWidth} height={chimneyHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.4" />);
        // Chimney cap
        elements.push(<rect key="chimney-cap" x={chimneyX-1} y={chimneyYOnRoof - chimneyHeight - 2} width={chimneyWidth+2} height={3} fill={`hsl(30, 15%, 50%)`} stroke={outlineColor} strokeWidth="0.3" />);
        
        if (hasSmoke > 0.3) { // Smoke
             elements.push(<circle key="smoke1" cx={chimneyX+chimneyWidth/2} cy={chimneyYOnRoof-chimneyHeight-5} r={2} fill="rgba(150,150,150,0.4)" />);
             elements.push(<circle key="smoke2" cx={chimneyX+chimneyWidth/2 + 1} cy={chimneyYOnRoof-chimneyHeight-8} r={2.5} fill="rgba(150,150,150,0.3)" />);
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
