/**
 * components/symbols/ruins/IndustrialRuinsSymbol.tsx
 * Renders industrial era ruins: factories, mills, mines, railways (1800-1950)
 * Historical accuracy: Based on Industrial Revolution architecture from various regions
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface IndustrialRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  region?: string;
}

const IndustrialRuinsSymbol: React.FC<IndustrialRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, region = 'EUROPEAN'
}) => {
  const rng = new ValueNoise(seed + tile.x * 89 + tile.y * 97);
  const elements: JSX.Element[] = [];
  
  // Industrial structure types
  const buildingTypes = ['factory', 'mill', 'foundry', 'power_plant', 'mine_head', 'railway_depot'];
  const buildingType = buildingTypes[Math.floor(rng.random() * buildingTypes.length)];
  
  // Material colors
  const brick = '#8B4513';
  const darkBrick = '#654321';
  const concrete = '#808080';
  const rust = '#B7410E';
  const steel = '#71797E';
  const soot = '#36454F';
  const glass = '#87CEEB';
  
  // Regional variations
  const materials = {
    EUROPEAN: { primary: brick, secondary: darkBrick, accent: steel },
    NORTH_AMERICAN: { primary: brick, secondary: concrete, accent: steel },
    EAST_ASIAN: { primary: concrete, secondary: steel, accent: rust },
    SOUTH_AMERICAN: { primary: concrete, secondary: brick, accent: rust }
  };
  
  const colors = materials[region] || materials.EUROPEAN;
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.5}
      ry={size * 0.15}
      fill="rgba(0,0,0,0.35)"
    />
  );
  
  if (buildingType === 'factory' || buildingType === 'mill') {
    // Multi-story factory building with smokestacks
    
    const factoryX = x + size * 0.2;
    const factoryY = y + size * 0.45;
    const factoryWidth = size * 0.5;
    const factoryHeight = size * (0.3 + preservationLevel * 0.1);
    
    // Main building
    const isCollapsed = preservationLevel < 0.3;
    
    if (!isCollapsed) {
      elements.push(
        <g key="factory-building">
          <rect
            x={factoryX}
            y={factoryY}
            width={factoryWidth}
            height={factoryHeight}
            fill={colors.primary}
            stroke={colors.secondary}
            strokeWidth="0.5"
          />
          
          {/* Window rows - many broken */}
          {[0.2, 0.4, 0.6, 0.8].map((yOff) => (
            <g key={`window-row-${yOff}`}>
              {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((xOff) => {
                const isBroken = rng.random() > preservationLevel + 0.2;
                return (
                  <rect
                    key={`window-${xOff}`}
                    x={factoryX + factoryWidth * xOff}
                    y={factoryY + factoryHeight * yOff}
                    width={size * 0.025}
                    height={size * 0.03}
                    fill={isBroken ? "rgba(0,0,0,0.7)" : glass}
                    stroke={colors.secondary}
                    strokeWidth="0.2"
                    opacity={isBroken ? 0.8 : 0.4}
                  />
                );
              })}
            </g>
          ))}
          
          {/* Sawtooth roof (if preserved) */}
          {preservationLevel > 0.5 && buildingType === 'mill' && (
            <g>
              {[0, 0.25, 0.5, 0.75].map((xOff, idx) => (
                <polygon
                  key={`sawtooth-${idx}`}
                  points={`${factoryX + factoryWidth * xOff},${factoryY}
                           ${factoryX + factoryWidth * (xOff + 0.2)},${factoryY - size * 0.04}
                           ${factoryX + factoryWidth * (xOff + 0.25)},${factoryY}`}
                  fill={colors.secondary}
                  stroke={soot}
                  strokeWidth="0.3"
                  opacity={0.8}
                />
              ))}
            </g>
          )}
        </g>
      );
    } else {
      // Collapsed walls
      elements.push(
        <g key="collapsed-factory">
          <polygon
            points={`${factoryX},${factoryY + factoryHeight}
                     ${factoryX + factoryWidth * 0.3},${factoryY + factoryHeight * 0.6}
                     ${factoryX + factoryWidth * 0.6},${factoryY + factoryHeight * 0.7}
                     ${factoryX + factoryWidth},${factoryY + factoryHeight}`}
            fill={colors.primary}
            stroke={colors.secondary}
            strokeWidth="0.4"
            opacity={0.7}
          />
        </g>
      );
    }
    
    // Smokestacks (may be broken)
    const numStacks = preservationLevel > 0.4 ? 2 : 1;
    for (let i = 0; i < numStacks; i++) {
      const stackX = factoryX + factoryWidth * (0.7 + i * 0.15);
      const stackHeight = size * (0.25 + preservationLevel * 0.2);
      const stackWidth = size * 0.04;
      const stackY = y + size * 0.75 - stackHeight;
      const isBroken = rng.random() > preservationLevel + 0.4;
      
      if (!isBroken) {
        elements.push(
          <g key={`smokestack-${i}`}>
            {/* Stack shaft */}
            <rect
              x={stackX}
              y={stackY}
              width={stackWidth}
              height={stackHeight}
              fill={colors.primary}
              stroke={colors.secondary}
              strokeWidth="0.4"
            />
            
            {/* Brick pattern */}
            {[0.2, 0.4, 0.6, 0.8].map((yOff) => (
              <line
                key={`brick-line-${yOff}`}
                x1={stackX}
                y1={stackY + stackHeight * yOff}
                x2={stackX + stackWidth}
                y2={stackY + stackHeight * yOff}
                stroke={colors.secondary}
                strokeWidth="0.2"
                opacity={0.4}
              />
            ))}
            
            {/* Metal bands */}
            {preservationLevel > 0.6 && (
              <>
                {[0.3, 0.7].map((yOff) => (
                  <rect
                    key={`band-${yOff}`}
                    x={stackX - stackWidth * 0.1}
                    y={stackY + stackHeight * yOff}
                    width={stackWidth * 1.2}
                    height={size * 0.01}
                    fill={rust}
                    opacity={0.7}
                  />
                ))}
              </>
            )}
            
            {/* Soot staining */}
            <ellipse
              cx={stackX + stackWidth / 2}
              cy={stackY - size * 0.01}
              rx={stackWidth * 0.8}
              ry={size * 0.02}
              fill={soot}
              opacity={0.4}
            />
          </g>
        );
      } else {
        // Broken stack
        elements.push(
          <g key={`broken-stack-${i}`}>
            <rect
              x={stackX}
              y={y + size * 0.75 - stackHeight * 0.4}
              width={stackWidth}
              height={stackHeight * 0.4}
              fill={colors.primary}
              stroke={colors.secondary}
              strokeWidth="0.4"
            />
            <polygon
              points={`${stackX},${y + size * 0.75 - stackHeight * 0.4}
                       ${stackX + stackWidth * 0.3},${y + size * 0.75 - stackHeight * 0.5}
                       ${stackX + stackWidth * 0.7},${y + size * 0.75 - stackHeight * 0.45}
                       ${stackX + stackWidth},${y + size * 0.75 - stackHeight * 0.4}`}
              fill={colors.primary}
              stroke={colors.secondary}
              strokeWidth="0.3"
            />
          </g>
        );
      }
    }
    
  } else if (buildingType === 'power_plant') {
    // Power plant with cooling tower
    
    const towerX = x + size * 0.4;
    const towerY = y + size * 0.4;
    const towerBottomRadius = size * 0.15;
    const towerTopRadius = size * (preservationLevel > 0.5 ? 0.1 : 0.12);
    const towerHeight = size * (0.3 + preservationLevel * 0.1);
    
    // Hyperboloid cooling tower shape
    elements.push(
      <g key="cooling-tower">
        <path
          d={`M ${towerX - towerBottomRadius} ${towerY + towerHeight}
              Q ${towerX - towerTopRadius * 0.7} ${towerY + towerHeight * 0.5}
                ${towerX - towerTopRadius} ${towerY}
              L ${towerX + towerTopRadius} ${towerY}
              Q ${towerX + towerTopRadius * 0.7} ${towerY + towerHeight * 0.5}
                ${towerX + towerBottomRadius} ${towerY + towerHeight}`}
          fill={concrete}
          stroke={colors.secondary}
          strokeWidth="0.5"
        />
        
        {/* Vertical ribs */}
        {[0.2, 0.4, 0.6, 0.8].map((xOff) => {
          const ribX = towerX - towerBottomRadius + towerBottomRadius * 2 * xOff;
          return (
            <line
              key={`rib-${xOff}`}
              x1={ribX}
              y1={towerY + towerHeight}
              x2={towerX - towerTopRadius + towerTopRadius * 2 * xOff}
              y2={towerY}
              stroke={colors.secondary}
              strokeWidth="0.2"
              opacity={0.5}
            />
          );
        })}
        
        {/* Damage/cracks */}
        {preservationLevel < 0.7 && (
          <path
            d={`M ${towerX - towerTopRadius * 0.5} ${towerY + towerHeight * 0.3}
                L ${towerX - towerTopRadius * 0.3} ${towerY + towerHeight * 0.5}
                L ${towerX - towerTopRadius * 0.4} ${towerY + towerHeight * 0.7}`}
            stroke="black"
            strokeWidth="0.5"
            fill="none"
            opacity={0.3}
          />
        )}
      </g>
    );
    
    // Control building
    if (preservationLevel > 0.3) {
      const buildingX = towerX - towerBottomRadius - size * 0.15;
      const buildingY = towerY + towerHeight * 0.7;
      
      elements.push(
        <rect
          key="control-building"
          x={buildingX}
          y={buildingY}
          width={size * 0.12}
          height={size * 0.08}
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="0.3"
        />
      );
    }
    
  } else if (buildingType === 'mine_head') {
    // Mine headframe and winding house
    
    const headframeX = x + size * 0.45;
    const headframeY = y + size * 0.35;
    const headframeHeight = size * (0.35 + preservationLevel * 0.1);
    const headframeWidth = size * 0.08;
    
    // A-frame headframe
    elements.push(
      <g key="mine-headframe">
        {/* Left leg */}
        <line
          x1={headframeX - headframeWidth}
          y1={headframeY + headframeHeight}
          x2={headframeX}
          y2={headframeY}
          stroke={steel}
          strokeWidth="1.2"
        />
        {/* Right leg */}
        <line
          x1={headframeX + headframeWidth}
          y1={headframeY + headframeHeight}
          x2={headframeX}
          y2={headframeY}
          stroke={steel}
          strokeWidth="1.2"
        />
        
        {/* Cross braces */}
        {preservationLevel > 0.4 && (
          <>
            {[0.3, 0.6].map((yOff) => (
              <line
                key={`brace-${yOff}`}
                x1={headframeX - headframeWidth * (1 - yOff)}
                y1={headframeY + headframeHeight * yOff}
                x2={headframeX + headframeWidth * (1 - yOff)}
                y2={headframeY + headframeHeight * yOff}
                stroke={steel}
                strokeWidth="0.8"
              />
            ))}
          </>
        )}
        
        {/* Winding wheel (if preserved) */}
        {preservationLevel > 0.5 && (
          <circle
            cx={headframeX}
            cy={headframeY + size * 0.05}
            r={size * 0.025}
            fill="none"
            stroke={rust}
            strokeWidth="0.5"
          />
        )}
        
        {/* Shaft opening */}
        <ellipse
          cx={headframeX}
          cy={headframeY + headframeHeight}
          rx={size * 0.03}
          ry={size * 0.015}
          fill="rgba(0,0,0,0.8)"
        />
      </g>
    );
    
    // Winding house
    if (preservationLevel > 0.3) {
      const houseX = headframeX - headframeWidth - size * 0.08;
      const houseY = headframeY + headframeHeight * 0.6;
      
      elements.push(
        <rect
          key="winding-house"
          x={houseX}
          y={houseY}
          width={size * 0.15}
          height={size * 0.1}
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="0.4"
        />
      );
    }
    
  } else if (buildingType === 'railway_depot') {
    // Railway roundhouse and turntable
    
    const depotX = x + size * 0.5;
    const depotY = y + size * 0.6;
    const depotRadius = size * 0.25;
    
    // Roundhouse segments
    const numBays = preservationLevel > 0.5 ? 5 : 3;
    const arcAngle = Math.PI; // Semi-circular
    
    for (let i = 0; i < numBays; i++) {
      const startAngle = -arcAngle / 2 + (i / numBays) * arcAngle;
      const endAngle = -arcAngle / 2 + ((i + 1) / numBays) * arcAngle;
      const isCollapsed = rng.random() > preservationLevel + 0.3;
      
      if (!isCollapsed) {
        const x1 = depotX + Math.cos(startAngle) * depotRadius;
        const y1 = depotY + Math.sin(startAngle) * depotRadius * 0.6;
        const x2 = depotX + Math.cos(endAngle) * depotRadius;
        const y2 = depotY + Math.sin(endAngle) * depotRadius * 0.6;
        
        elements.push(
          <g key={`bay-${i}`}>
            <path
              d={`M ${depotX} ${depotY}
                  L ${x1} ${y1}
                  L ${x2} ${y2}
                  Z`}
              fill={colors.primary}
              stroke={colors.secondary}
              strokeWidth="0.4"
              opacity={0.8}
            />
            
            {/* Bay door */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1"
            />
          </g>
        );
      }
    }
    
    // Turntable pit
    elements.push(
      <circle
        key="turntable"
        cx={depotX}
        cy={depotY}
        r={size * 0.08}
        fill="none"
        stroke={rust}
        strokeWidth="0.5"
      />
    );
    
    // Rails radiating out
    if (preservationLevel > 0.4) {
      for (let i = 0; i < numBays; i++) {
        const angle = -arcAngle / 2 + ((i + 0.5) / numBays) * arcAngle;
        const railX = depotX + Math.cos(angle) * size * 0.08;
        const railY = depotY + Math.sin(angle) * size * 0.08 * 0.6;
        const railEndX = depotX + Math.cos(angle) * depotRadius;
        const railEndY = depotY + Math.sin(angle) * depotRadius * 0.6;
        
        elements.push(
          <g key={`rails-${i}`}>
            <line
              x1={railX}
              y1={railY}
              x2={railEndX}
              y2={railEndY}
              stroke={rust}
              strokeWidth="0.3"
            />
            <line
              x1={railX + Math.sin(angle) * size * 0.003}
              y1={railY - Math.cos(angle) * size * 0.003}
              x2={railEndX + Math.sin(angle) * size * 0.003}
              y2={railEndY - Math.cos(angle) * size * 0.003}
              stroke={rust}
              strokeWidth="0.3"
            />
          </g>
        );
      }
    }
  }
  
  // Industrial debris and machinery
  const numDebris = 5 + Math.floor((1 - preservationLevel) * 7);
  for (let i = 0; i < numDebris; i++) {
    const debrisX = x + size * (0.1 + rng.random() * 0.8);
    const debrisY = y + size * (0.72 + rng.random() * 0.13);
    
    if (i % 4 === 0) {
      // Gear wheel
      const gearRadius = size * (0.015 + rng.random() * 0.01);
      elements.push(
        <g key={`gear-${i}`}>
          <circle
            cx={debrisX}
            cy={debrisY}
            r={gearRadius}
            fill="none"
            stroke={rust}
            strokeWidth="0.5"
            opacity={0.6}
          />
          <circle
            cx={debrisX}
            cy={debrisY}
            r={gearRadius * 0.3}
            fill={rust}
            opacity={0.5}
          />
        </g>
      );
    } else if (i % 4 === 1) {
      // I-beam
      const beamLength = size * (0.03 + rng.random() * 0.02);
      elements.push(
        <g key={`beam-${i}`}>
          <rect
            x={debrisX}
            y={debrisY}
            width={beamLength}
            height={size * 0.005}
            fill={steel}
            transform={`rotate(${rng.random() * 180} ${debrisX + beamLength/2} ${debrisY})`}
            opacity={0.7}
          />
        </g>
      );
    } else if (i % 4 === 2) {
      // Pipe section
      elements.push(
        <g key={`pipe-${i}`}>
          <ellipse
            cx={debrisX}
            cy={debrisY}
            rx={size * 0.01}
            ry={size * 0.006}
            fill="none"
            stroke={rust}
            strokeWidth="0.4"
            opacity={0.6}
          />
        </g>
      );
    } else {
      // Brick rubble
      const brickSize = size * (0.012 + rng.random() * 0.008);
      elements.push(
        <rect
          key={`brick-${i}`}
          x={debrisX}
          y={debrisY}
          width={brickSize}
          height={brickSize * 0.5}
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 360} ${debrisX + brickSize/2} ${debrisY})`}
          opacity={0.6}
        />
      );
    }
  }
  
  // Rust and oil stains
  elements.push(
    <g key="stains" opacity={0.2}>
      {/* Oil puddle */}
      <ellipse
        cx={x + size * (0.3 + rng.random() * 0.4)}
        cy={y + size * 0.82}
        rx={size * 0.06}
        ry={size * 0.02}
        fill="black"
      />
      {/* Rust streaks */}
      {[0.2, 0.5, 0.7].map((xOff) => (
        <rect
          key={`rust-streak-${xOff}`}
          x={x + size * xOff}
          y={y + size * 0.6}
          width={size * 0.01}
          height={size * 0.2}
          fill={rust}
          opacity={0.3}
        />
      ))}
    </g>
  );
  
  // Weeds and vegetation reclaiming the site
  if (preservationLevel < 0.7) {
    const numWeeds = 4 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numWeeds; i++) {
      const weedX = x + size * (0.1 + rng.random() * 0.8);
      const weedY = y + size * (0.65 + rng.random() * 0.2);
      
      elements.push(
        <g key={`weed-${i}`} opacity={0.4}>
          {[0, 0.2, -0.2].map((offset) => (
            <line
              key={offset}
              x1={weedX + offset * size * 0.005}
              y1={weedY}
              x2={weedX + offset * size * 0.005}
              y2={weedY - size * 0.03}
              stroke="#556B2F"
              strokeWidth="0.5"
            />
          ))}
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(IndustrialRuinsSymbol);