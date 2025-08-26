/**
 * components/symbols/CactusSymbol.tsx - Renders realistic cacti with 3D effects
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface CactusSymbolProps {
  seed: number;
}

const CactusSymbol: React.FC<CactusSymbolProps> = ({ seed }) => {
  const localRand = React.useMemo(() => new ValueNoise(seed).random, [seed]);
  
  // Cactus type: 0-0.4 saguaro, 0.4-0.7 barrel, 0.7-1 prickly pear
  const cactusType = localRand();
  
  if (cactusType < 0.4) {
    // Saguaro cactus
    const mainHeight = 12 + localRand() * 6;
    const mainWidth = 3 + localRand() * 1;
    const hasArms = localRand() > 0.3;
    const numArms = hasArms ? 1 + Math.floor(localRand() * 2) : 0;
    
    const baseColor = `hsl(${140 + localRand() * 20}, ${35 + localRand() * 15}%, ${35 + localRand() * 10}%)`;
    const highlightColor = `hsl(${140 + localRand() * 20}, ${30 + localRand() * 10}%, ${50 + localRand() * 10}%)`;
    const shadowColor = `hsl(${140 + localRand() * 20}, ${40 + localRand() * 15}%, ${20 + localRand() * 10}%)`;
    
    const arms = [];
    for (let i = 0; i < numArms; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const armStartY = 22 - mainHeight * (0.4 + localRand() * 0.3);
      const armLength = 3 + localRand() * 2;
      const armHeight = 3 + localRand() * 2;
      
      arms.push(
        <g key={`arm-${i}`}>
          {/* Arm */}
          <path
            d={`
              M ${12 + side * mainWidth/2} ${armStartY}
              Q ${12 + side * (mainWidth/2 + armLength)} ${armStartY}, 
                ${12 + side * (mainWidth/2 + armLength)} ${armStartY - armHeight}
            `}
            stroke={baseColor}
            strokeWidth={mainWidth * 0.8}
            fill="none"
            strokeLinecap="round"
          />
          {/* Arm highlight */}
          <path
            d={`
              M ${12 + side * mainWidth/2} ${armStartY}
              Q ${12 + side * (mainWidth/2 + armLength)} ${armStartY}, 
                ${12 + side * (mainWidth/2 + armLength)} ${armStartY - armHeight}
            `}
            stroke={highlightColor}
            strokeWidth={mainWidth * 0.3}
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
      );
    }
    
    return (
      <g>
        {/* Shadow */}
        <ellipse
          cx="12"
          cy="22"
          rx={mainWidth * 1.2}
          ry={mainWidth * 0.3}
          fill="rgba(0,0,0,0.25)"
        />
        
        {/* Main trunk */}
        <rect
          x={12 - mainWidth/2}
          y={22 - mainHeight}
          width={mainWidth}
          height={mainHeight}
          fill={baseColor}
          rx={mainWidth/2}
          ry={mainWidth/2}
        />
        
        {/* Vertical ribs */}
        {Array.from({ length: 5 }).map((_, i) => {
          const x = 12 - mainWidth/2 + (i + 1) * (mainWidth / 6);
          return (
            <line
              key={`rib-${i}`}
              x1={x}
              y1={22 - mainHeight + 1}
              x2={x}
              y2={22 - 1}
              stroke={shadowColor}
              strokeWidth="0.3"
              opacity="0.5"
            />
          );
        })}
        
        {/* Highlight */}
        <rect
          x={12 - mainWidth/3}
          y={22 - mainHeight}
          width={mainWidth/3}
          height={mainHeight * 0.9}
          fill={highlightColor}
          opacity="0.4"
          rx={mainWidth/6}
        />
        
        {/* Arms */}
        {arms}
        
        {/* Spines */}
        {Array.from({ length: 8 + Math.floor(localRand() * 5) }).map((_, i) => {
          const spineY = 22 - mainHeight + (i + 1) * (mainHeight / 10);
          const side = i % 2 === 0 ? -1 : 1;
          return (
            <line
              key={`spine-${i}`}
              x1={12 + side * mainWidth/2}
              y1={spineY}
              x2={12 + side * (mainWidth/2 + 0.5)}
              y2={spineY - 0.3}
              stroke="hsl(45, 40%, 70%)"
              strokeWidth="0.2"
              opacity="0.7"
            />
          );
        })}
        
        {/* Flower on top (sometimes) */}
        {localRand() > 0.7 && (
          <g>
            <circle
              cx="12"
              cy={22 - mainHeight}
              r="1"
              fill="hsl(350, 70%, 60%)"
            />
            <circle
              cx="12"
              cy={22 - mainHeight}
              r="0.4"
              fill="hsl(50, 80%, 70%)"
            />
          </g>
        )}
      </g>
    );
  } else if (cactusType < 0.7) {
    // Barrel cactus
    const radius = 3 + localRand() * 1.5;
    const height = radius * 1.5;
    const ribs = 8 + Math.floor(localRand() * 4);
    
    const baseColor = `hsl(${135 + localRand() * 25}, ${40 + localRand() * 20}%, ${30 + localRand() * 10}%)`;
    const highlightColor = `hsl(${135 + localRand() * 25}, ${35 + localRand() * 15}%, ${45 + localRand() * 10}%)`;
    
    return (
      <g>
        {/* Shadow */}
        <ellipse
          cx="12"
          cy="22"
          rx={radius * 1.3}
          ry={radius * 0.4}
          fill="rgba(0,0,0,0.25)"
        />
        
        {/* Main body */}
        <ellipse
          cx="12"
          cy={22 - height/2}
          rx={radius}
          ry={height/2}
          fill={baseColor}
        />
        
        {/* Ribs */}
        {Array.from({ length: ribs }).map((_, i) => {
          const angle = (i / ribs) * Math.PI * 2;
          const x = 12 + Math.cos(angle) * radius * 0.9;
          return (
            <ellipse
              key={`rib-${i}`}
              cx={x}
              cy={22 - height/2}
              rx={radius * 0.15}
              ry={height/2 * 0.95}
              fill="hsl(135, 45%, 25%)"
              opacity="0.4"
            />
          );
        })}
        
        {/* Highlight */}
        <ellipse
          cx="11"
          cy={22 - height/2}
          rx={radius * 0.3}
          ry={height/2 * 0.8}
          fill={highlightColor}
          opacity="0.5"
        />
        
        {/* Top detail */}
        <ellipse
          cx="12"
          cy={22 - height + 0.5}
          rx={radius * 0.7}
          ry={radius * 0.2}
          fill={baseColor}
          opacity="0.8"
        />
        
        {/* Spines in clusters */}
        {Array.from({ length: ribs }).map((_, i) => {
          const angle = (i / ribs) * Math.PI * 2;
          const spineX = 12 + Math.cos(angle) * radius;
          const spineY = 22 - height/2;
          return (
            <g key={`spine-cluster-${i}`}>
              {Array.from({ length: 3 }).map((_, j) => (
                <line
                  key={`spine-${i}-${j}`}
                  x1={spineX}
                  y1={spineY + (j - 1) * 2}
                  x2={spineX + Math.cos(angle) * 0.7}
                  y2={spineY + (j - 1) * 2 - 0.3}
                  stroke="hsl(45, 50%, 75%)"
                  strokeWidth="0.15"
                  opacity="0.6"
                />
              ))}
            </g>
          );
        })}
      </g>
    );
  } else {
    // Prickly pear cactus
    const numPads = 3 + Math.floor(localRand() * 3);
    const baseColor = `hsl(${145 + localRand() * 15}, ${45 + localRand() * 15}%, ${40 + localRand() * 10}%)`;
    const highlightColor = `hsl(${145 + localRand() * 15}, ${40 + localRand() * 10}%, ${55 + localRand() * 10}%)`;
    
    const pads = [];
    const padPositions = [
      { x: 12, y: 20, width: 4, height: 3, angle: 0 } // Base pad
    ];
    
    for (let i = 1; i < numPads; i++) {
      const parent = padPositions[Math.floor(localRand() * padPositions.length)];
      const side = localRand() > 0.5 ? 1 : -1;
      const newPad = {
        x: parent.x + side * (parent.width * 0.4 + localRand() * 2),
        y: parent.y - parent.height * 0.5 - localRand() * 2,
        width: 3 + localRand() * 1.5,
        height: 2 + localRand() * 1,
        angle: side * (10 + localRand() * 20)
      };
      padPositions.push(newPad);
    }
    
    padPositions.forEach((pad, i) => {
      pads.push(
        <g key={`pad-${i}`} transform={`rotate(${pad.angle} ${pad.x} ${pad.y})`}>
          {/* Pad shadow */}
          <ellipse
            cx={pad.x + 0.3}
            cy={pad.y + 0.3}
            rx={pad.width/2}
            ry={pad.height/2}
            fill="rgba(0,0,0,0.15)"
          />
          
          {/* Main pad */}
          <ellipse
            cx={pad.x}
            cy={pad.y}
            rx={pad.width/2}
            ry={pad.height/2}
            fill={baseColor}
          />
          
          {/* Highlight */}
          <ellipse
            cx={pad.x - pad.width * 0.15}
            cy={pad.y - pad.height * 0.1}
            rx={pad.width * 0.25}
            ry={pad.height * 0.35}
            fill={highlightColor}
            opacity="0.5"
          />
          
          {/* Dots for spines */}
          {Array.from({ length: 5 + Math.floor(localRand() * 3) }).map((_, j) => {
            const dotAngle = (j / 7) * Math.PI * 2;
            const dotR = (0.3 + localRand() * 0.4) * Math.min(pad.width, pad.height) / 2;
            return (
              <circle
                key={`dot-${j}`}
                cx={pad.x + Math.cos(dotAngle) * dotR}
                cy={pad.y + Math.sin(dotAngle) * dotR * 0.7}
                r="0.1"
                fill="hsl(45, 40%, 20%)"
                opacity="0.5"
              />
            );
          })}
          
          {/* Fruit/flower (sometimes) */}
          {i === numPads - 1 && localRand() > 0.6 && (
            <circle
              cx={pad.x}
              cy={pad.y - pad.height/2}
              r="0.6"
              fill={localRand() > 0.5 ? "hsl(350, 60%, 55%)" : "hsl(50, 70%, 60%)"}
            />
          )}
        </g>
      );
    });
    
    return <g>{pads}</g>;
  }
};

export default React.memo(CactusSymbol);