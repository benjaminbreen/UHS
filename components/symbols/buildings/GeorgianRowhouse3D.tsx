/**
 * components/symbols/buildings/GeorgianRowhouse3D.tsx - Renders a detailed, painterly Georgian-style row house.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface GeorgianRowhouse3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const GeorgianRowhouse3D: React.FC<GeorgianRowhouse3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rng = new ValueNoise(seed + tile.x * 163 + tile.y * 167);
    const uniqueId = `georgian-${tile.x}-${tile.y}`;
    const elements = [];
    
    // Pre-calculate all random values to prevent re-rendering
    const rand1 = rng.random();
    const rand2 = rng.random();
    const rand3 = rng.random();
    const rand4 = rng.random();
    const rand5 = rng.random();
    
    const isBrick = rand1 > 0.4;
    const brickColor = `hsl(15, 50%, ${55 + rand2 * 10}%)`;
    const stuccoColor = `hsl(45, 35%, ${85 + rand3 * 10}%)`;
    const roofColor = `hsl(210, 15%, 40%)`;
    const roofHighlight = `hsl(210, 15%, 60%)`;
    const trimColor = `hsl(40, 20%, 95%)`;
    const doorColors = ['#2c5282', '#97266d', '#2f855a', '#2d3748'];
    const doorColor = doorColors[Math.floor(rand4 * doorColors.length)];
    const outlineColor = `hsl(15, 50%, 30%)`;
    const wallShadowColor = isBrick ? `hsl(15, 50%, 45%)` : `hsl(45, 35%, 75%)`;

    const wallFill = isBrick ? `url(#georgianBrick-${uniqueId})` : stuccoColor;
    const depth = size * 0.3;
    const stories = 2 + Math.floor(rand5 * 2);
    const storyHeight = height / stories;
    const wallHeight = height;
    const wallY = y;
    const roofPitch = height * 0.25;
    
    // Cast Shadow
    elements.push(
      <path key="shadow" d={`M ${x + depth * 0.5} ${y + height + depth * 0.25} l ${width} 0 l ${depth*0.5} ${-depth*0.3} l ${-width} 0 Z`} fill="rgba(0,0,0,0.2)" />
    );

    // Main Building Walls
    elements.push(<rect key="wall-main" x={x} y={wallY} width={width} height={wallHeight} fill={wallFill} stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<path key="wall-side" d={`M ${x+width} ${wallY} L ${x+width+depth} ${wallY-depth*0.5} L ${x+width+depth} ${wallY+wallHeight-depth*0.5} L ${x+width} ${wallY+wallHeight} Z`} fill={wallShadowColor} stroke={outlineColor} strokeWidth="0.2"/>);
    
    // Pitched Roof
    const roofY = y;
    elements.push(<path key="roof-main" d={`M ${x-2} ${roofY} L ${x+width/2} ${roofY-roofPitch} L ${x+width+2} ${roofY} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<path key="roof-side" d={`M ${x+width+2} ${roofY} L ${x+width+2+depth} ${roofY-depth*0.5} L ${x+width/2+depth} ${roofY-roofPitch-depth*0.5} L ${x+width/2} ${roofY-roofPitch} Z`} fill={roofHighlight} stroke={outlineColor} strokeWidth="0.2"/>);

    // Windows & Door
    for(let i=0; i < stories; i++) {
        const currentY = wallY + i * storyHeight;
        const isGroundFloor = i === stories - 1;
        
        const renderWindow = (wx: number, wy: number, key: string) => {
            const winWidth = width * 0.3;
            const winHeight = storyHeight * 0.6;
            return (
                <g key={key}>
                    <rect x={wx-1} y={wy-1} width={winWidth+2} height={winHeight+2} fill={trimColor} rx="0.5"/>
                    <rect x={wx} y={wy} width={winWidth} height={winHeight} fill="#2d3748" stroke={outlineColor} strokeWidth="0.3"/>
                    <line x1={wx+winWidth/2} y1={wy} x2={wx+winWidth/2} y2={wy+winHeight} stroke={trimColor} strokeWidth="0.4" opacity="0.7"/>
                    <line x1={wx} y1={wy+winHeight/2} x2={wx+winWidth} y2={wy+winHeight/2} stroke={trimColor} strokeWidth="0.4" opacity="0.7"/>
                </g>
            );
        };

        if (isGroundFloor) { // Door on ground floor
            const doorWidth = width * 0.25;
            const doorHeight = storyHeight * 0.85;
            const doorX = x + width * 0.2;
            const doorY = currentY + storyHeight * 0.1;
            elements.push(<rect key="door-frame" x={doorX-1} y={doorY-1} width={doorWidth+2} height={doorHeight+2} fill="none" stroke={trimColor} strokeWidth="1.2"/>);
            elements.push(<rect key="door" x={doorX} y={doorY} width={doorWidth} height={doorHeight} fill={doorColor}/>);
            elements.push(renderWindow(x+width*0.6, currentY+storyHeight*0.2, "win-ground"));
        } else { // Windows on upper floors
            elements.push(renderWindow(x+width*0.2, currentY+storyHeight*0.2, `win-${i}-1`));
            elements.push(renderWindow(x+width*0.6, currentY+storyHeight*0.2, `win-${i}-2`));
        }
    }
    
    // Details
    elements.push(<rect key="base-trim" x={x} y={y+height-2} width={width} height={2} fill={trimColor} stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<rect key="roof-trim" x={x-2} y={y-1} width={width+4} height={1.5} fill={trimColor} stroke={outlineColor} strokeWidth="0.2"/>);
    const stoopWidth = width * 0.25 + 4;
    const stoopX = x+width*0.2-2;
    const stoopY = y+height;
    elements.push(<path key="stoop-top" d={`M ${stoopX} ${stoopY} L ${stoopX+depth*0.5} ${stoopY-depth*0.25} L ${stoopX+stoopWidth+depth*0.5} ${stoopY-depth*0.25} L ${stoopX+stoopWidth} ${stoopY} Z`} fill="#999" stroke={outlineColor} strokeWidth="0.2"/>);
    elements.push(<rect key="stoop-front" x={stoopX} y={stoopY} width={stoopWidth} height={2} fill="#aaa" stroke={outlineColor} strokeWidth="0.2"/>);


    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <pattern id={`georgianBrick-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="4">
                    <rect width="8" height="4" fill="#d1d5db" />
                    <rect x="0" y="0" width="8" height="1.8" fill={brickColor} />
                    <rect x="0" y="2" width="3.8" height="1.8" fill={brickColor} />
                    <rect x="4.2" y="2" width="3.8" height="1.8" fill={brickColor} />
                </pattern>
            </defs>
            {elements}
        </g>
    );
});

export default GeorgianRowhouse3D;
