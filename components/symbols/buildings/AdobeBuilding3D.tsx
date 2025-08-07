/**
 * components/symbols/buildings/AdobeBuilding3D.tsx - Renders a detailed, painterly, and randomized Adobe/Pueblo style building.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AdobeBuilding3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const AdobeBuilding3D: React.FC<AdobeBuilding3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rng = new ValueNoise(seed + tile.x * 13 + tile.y * 31);
    const rand = rng.random;
    
    // Pre-calculate all random values to prevent re-rendering changes
    const storiesRandom = rng.random();
    const baseColorVariation = rng.random();
    const storyRandoms = Array.from({length: 3}, () => ({
        width: rng.random(),
        height: rng.random(),
        xOffset: rng.random(),
        vigasCount: rng.random(),
        vigasOffset: rng.random(),
        windowCount: rng.random(),
        windowOffset: rng.random(),
        ladderChance: rng.random(),
        ladderWidth: rng.random()
    }));
    const doorRandoms = {
        width: rng.random(),
        height: rng.random(),
        arch: rng.random()
    };
    const potteryRandoms = Array.from({length: 2}, () => ({
        chance: rng.random(),
        x: rng.random(),
        size: rng.random()
    }));
    const chiliRandoms = {
        chance: rng.random(),
        x: rng.random(),
        y: rng.random()
    };
    
    const stories = 1 + Math.floor(storiesRandom * 2.5);
    const elements: JSX.Element[] = [];
    const uniqueId = `adobe-${tile.x}-${tile.y}`;

    const baseColor = `hsl(28, 45%, ${75 + baseColorVariation * 10}%)`;
    const shadowColor = `hsl(28, 48%, 60%)`;
    const highlightColor = `hsl(35, 55%, 88%)`;
    const woodColor = `hsl(25, 40%, 30%)`;
    const potteryColor = `hsl(15, 60%, 55%)`;
    const chiliColor = `hsl(5, 70%, 45%)`;
    const outlineColor = `hsl(28, 48%, 45%)`;

    const depth = size * 0.25;

    // Cast shadow
     elements.push(
        <path
          key="shadow"
          d={`M ${x + depth * 0.5} ${y + height + depth * 0.25} L ${x + width + depth * 0.5} ${y + height + depth * 0.25} L ${x + width} ${y + height} L ${x} ${y + height} Z`}
          fill="rgba(0,0,0,0.2)"
        />
    );


    for (let i = 0; i < stories; i++) {
        const storyWidth = width * (1 - i * 0.25) * (0.9 + storyRandoms[i].width * 0.2);
        const storyHeight = (height / stories) * (1.2 - i * 0.15) + (i > 0 ? storyRandoms[i].height * 4 - 2 : 0);
        const storyX = x + (width - storyWidth) / 2 + (i > 0 ? (storyRandoms[i].xOffset - 0.5) * width * 0.1 : 0);
        const storyY = y + height - (i * (height / stories) * 0.9) - storyHeight;

        const sideDepth = depth * (1 - i * 0.25);

        // Main Wall
        elements.push(<rect key={`wall-${i}`} x={storyX} y={storyY} width={storyWidth} height={storyHeight} fill={`url(#adobeGradient-${uniqueId})`} rx="1" ry="1" stroke={outlineColor} strokeWidth="0.3"/>);
        // Side Wall
        elements.push(
          <path
            key={`side-${i}`}
            d={`M ${storyX + storyWidth} ${storyY} L ${storyX + storyWidth + sideDepth} ${storyY - sideDepth * 0.5} L ${storyX + storyWidth + sideDepth} ${storyY + storyHeight - sideDepth * 0.5} L ${storyX + storyWidth} ${storyY + storyHeight} Z`}
            fill={shadowColor}
            stroke={outlineColor}
            strokeWidth="0.3"
          />
        );
        // Roof
        elements.push(
          <path
            key={`roof-${i}`}
            d={`M ${storyX} ${storyY} L ${storyX + sideDepth} ${storyY - sideDepth * 0.5} L ${storyX + storyWidth + sideDepth} ${storyY - sideDepth * 0.5} L ${storyX + storyWidth} ${storyY} Z`}
            fill={highlightColor}
            stroke={outlineColor}
            strokeWidth="0.2"
          />
        );

        // Vigas (beams)
        for (let j = 0; j < 3 + storyRandoms[i].vigasCount*2; j++) {
            if (storyRandoms[i].vigasOffset > 0.2) {
              const vigaY = storyY + 2 + storyRandoms[i].vigasOffset * 4;
              elements.push(<circle key={`viga-${i}-${j}`} cx={storyX + storyWidth + sideDepth * (0.2 + storyRandoms[i].vigasOffset*0.6)} cy={vigaY - sideDepth*0.5} r={size*0.03} fill={woodColor} stroke="#000" strokeWidth="0.2" opacity="0.8"/>)
            }
        }

        // Ladder if not ground floor and random chance
        if (i > 0 && storyRandoms[i].ladderChance > 0.3) {
            const ladderX = storyX - size * 0.1 * (storyRandoms[i].ladderWidth > 0.5 ? 1 : -1) + (storyRandoms[i].ladderWidth > 0.5 ? storyWidth : 0);
            const ladderY = storyY + storyHeight * 0.1;
            const ladderHeight = (height / stories) + 5 + storyRandoms[i].ladderWidth*3;
            elements.push(<rect key={`ladder-l-${i}`} x={ladderX} y={ladderY} width={1} height={ladderHeight} fill={woodColor} />);
            elements.push(<rect key={`ladder-r-${i}`} x={ladderX + size * 0.06} y={ladderY} width={1} height={ladderHeight} fill={woodColor} />);
            for (let r = 0; r < 4; r++) {
                elements.push(<rect key={`rung-${i}-${r}`} x={ladderX} y={ladderY + r * (ladderHeight / 4)} width={size * 0.06 + 1} height={0.8} fill={woodColor} />);
            }
        }
        
        // Add door to ground floor
        if (i === 0) {
            const doorHeight = storyHeight * (0.6 * doorRandoms.height);
            const doorWidth = storyWidth * (0.2 * doorRandoms.width);
            elements.push(<rect key={`door-${i}`} x={storyX + storyWidth/2 - doorWidth/2} y={storyY + storyHeight - doorHeight} width={doorWidth} height={doorHeight} fill="#2c1e12" stroke={outlineColor} strokeWidth="0.3" rx={doorRandoms.arch > 0.5 ? "0.5" : "0"}/>);
        } else if (storyRandoms[i].windowCount > 0.5) { // Small windows on upper floors
            const winX = storyX + storyWidth * (0.2 + storyRandoms[i].windowOffset * 0.6);
            const winY = storyY + storyHeight * (0.3 + storyRandoms[i].windowOffset * 0.4);
            elements.push(<rect key={`win-${i}`} x={winX} y={winY} width={storyWidth * 0.15} height={storyHeight*0.25} fill="#2c1e12" stroke={outlineColor} strokeWidth="0.2"/>);
        }

        // Rooftop details
        if (i === stories - 1) {
            if (potteryRandoms[0].chance > 0.6) { // Pottery
                const potX = storyX + storyWidth * 0.2 + potteryRandoms[0].x * storyWidth * 0.6;
                const potSize = 2 * potteryRandoms[0].size;
                elements.push(<ellipse key={`pot-${i}`} cx={potX} cy={storyY-2} rx={potSize} ry={potSize * 1.25} fill={potteryColor} stroke="#000" strokeWidth="0.2" />);
            }
            if (chiliRandoms.chance > 0.7) { // Chili ristra
                 elements.push(<rect key={`chili-${i}`} x={storyX + storyWidth * chiliRandoms.x} y={storyY + chiliRandoms.y * 4} width={2} height={8} fill={chiliColor} />);
            }
        }
    }

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`adobeGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={highlightColor} />
                    <stop offset="50%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={shadowColor} />
                </linearGradient>
            </defs>
            {elements}
        </g>
    );
});

export default AdobeBuilding3D;
