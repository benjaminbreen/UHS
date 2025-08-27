/**
 * components/symbols/ruins/NativeAmericanRuinsSymbol.tsx
 * Renders Native American ruins: Ancestral Puebloan cliff dwellings, Mississippian mounds, Arctic structures
 * Historical accuracy: Based on diverse indigenous architectural traditions across North America
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface NativeAmericanRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  culturalZone?: string;
}

const NativeAmericanRuinsSymbol: React.FC<NativeAmericanRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, culturalZone = 'NORTH_AMERICAN'
}) => {
  const rng = new ValueNoise(seed + tile.x * 79 + tile.y * 83);
  const elements: JSX.Element[] = [];
  
  // Regional architectural styles
  const architectureTypes = [
    'cliff_dwelling', // Southwest - Ancestral Puebloan (Mesa Verde, Canyon de Chelly)
    'platform_mound', // Southeast - Mississippian (Cahokia, Moundville)
    'pueblo', // Southwest - Multi-story adobe/stone buildings
    'longhouse', // Northeast - Iroquois/Algonquian structures
    'earthlodge', // Plains - Mandan, Hidatsa, Arikara
    'plankhouse' // Northwest Coast - Cedar plank houses
  ];
  
  // Select based on random or cultural context
  let architectureType = architectureTypes[Math.floor(rng.random() * architectureTypes.length)];
  
  // Override for specific regions if known
  if (tile.y < 20) architectureType = 'earthlodge'; // Northern regions
  if (tile.x > 80) architectureType = 'longhouse'; // Eastern regions
  
  // Material colors
  const sandstone = '#CD853F';
  const adobe = '#D2691E';
  const darkStone = '#8B7355';
  const wood = '#8B4513';
  const earth = '#A0826D';
  const thatch = '#DAA520';
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.45}
      ry={size * 0.15}
      fill="rgba(0,0,0,0.25)"
    />
  );
  
  if (architectureType === 'cliff_dwelling') {
    // Ancestral Puebloan cliff dwellings
    
    // Cliff overhang
    elements.push(
      <path
        key="cliff-overhang"
        d={`M ${x + size * 0.1} ${y + size * 0.35}
            Q ${x + size * 0.5} ${y + size * 0.25} ${x + size * 0.9} ${y + size * 0.35}
            L ${x + size * 0.9} ${y + size * 0.4}
            Q ${x + size * 0.5} ${y + size * 0.35} ${x + size * 0.1} ${y + size * 0.4}`}
        fill={darkStone}
        opacity={0.6}
      />
    );
    
    // Multi-room structures under overhang
    const numRooms = preservationLevel > 0.5 ? 5 + Math.floor(rng.random() * 3) : 3 + Math.floor(rng.random() * 2);
    const baseY = y + size * 0.65;
    
    for (let i = 0; i < numRooms; i++) {
      const roomX = x + size * (0.2 + (i * 0.5) / numRooms);
      const roomWidth = size * (0.06 + rng.random() * 0.04);
      const roomHeight = size * (0.08 + rng.random() * 0.05);
      const isCollapsed = rng.random() > preservationLevel + 0.3;
      
      if (!isCollapsed) {
        // Room structure
        elements.push(
          <g key={`room-${i}`}>
            <rect
              x={roomX}
              y={baseY - roomHeight}
              width={roomWidth}
              height={roomHeight}
              fill={sandstone}
              stroke={darkStone}
              strokeWidth="0.3"
            />
            
            {/* T-shaped doorway (characteristic of Ancestral Puebloan) */}
            {preservationLevel > 0.4 && (
              <g>
                <rect
                  x={roomX + roomWidth * 0.35}
                  y={baseY - roomHeight * 0.4}
                  width={roomWidth * 0.3}
                  height={roomHeight * 0.4}
                  fill="rgba(0,0,0,0.6)"
                />
                <rect
                  x={roomX + roomWidth * 0.25}
                  y={baseY - roomHeight * 0.5}
                  width={roomWidth * 0.5}
                  height={roomHeight * 0.1}
                  fill="rgba(0,0,0,0.6)"
                />
              </g>
            )}
            
            {/* Stone masonry pattern */}
            {preservationLevel > 0.5 && (
              <>
                {[0.3, 0.6].map((yOff) => (
                  <line
                    key={`masonry-${yOff}`}
                    x1={roomX}
                    y1={baseY - roomHeight * yOff}
                    x2={roomX + roomWidth}
                    y2={baseY - roomHeight * yOff}
                    stroke={darkStone}
                    strokeWidth="0.2"
                    opacity={0.5}
                  />
                ))}
              </>
            )}
          </g>
        );
      } else {
        // Collapsed room
        elements.push(
          <ellipse
            key={`collapsed-room-${i}`}
            cx={roomX + roomWidth / 2}
            cy={baseY}
            rx={roomWidth * 0.7}
            ry={size * 0.02}
            fill={sandstone}
            opacity={0.6}
          />
        );
      }
    }
    
    // Kiva (ceremonial chamber) - circular pit structure
    if (preservationLevel > 0.3 && rng.random() < 0.7) {
      const kivaX = x + size * (0.3 + rng.random() * 0.4);
      const kivaY = baseY + size * 0.05;
      const kivaRadius = size * 0.04;
      
      elements.push(
        <g key="kiva">
          <ellipse
            cx={kivaX}
            cy={kivaY}
            rx={kivaRadius}
            ry={kivaRadius * 0.7}
            fill="rgba(0,0,0,0.4)"
            stroke={darkStone}
            strokeWidth="0.4"
          />
          
          {/* Sipapu (ceremonial hole) */}
          {preservationLevel > 0.5 && (
            <circle
              cx={kivaX}
              cy={kivaY}
              r={size * 0.005}
              fill="rgba(0,0,0,0.8)"
            />
          )}
        </g>
      );
    }
    
  } else if (architectureType === 'platform_mound') {
    // Mississippian platform mounds with structures on top
    
    const moundX = x + size * 0.5;
    const moundY = y + size * 0.7;
    const moundWidth = size * (0.4 + preservationLevel * 0.1);
    const moundHeight = size * (0.12 + preservationLevel * 0.08);
    
    // Mound with stepped/eroded sides
    elements.push(
      <g key="platform-mound">
        {/* Lower tier */}
        <ellipse
          cx={moundX}
          cy={moundY}
          rx={moundWidth}
          ry={moundHeight * 0.5}
          fill={earth}
          opacity={0.8}
        />
        
        {/* Upper platform */}
        <ellipse
          cx={moundX}
          cy={moundY - moundHeight * 0.4}
          rx={moundWidth * 0.7}
          ry={moundHeight * 0.3}
          fill={earth}
        />
        
        {/* Erosion/terracing lines */}
        {[0.2, 0.4, 0.6].map((offset, idx) => (
          <ellipse
            key={`terrace-${idx}`}
            cx={moundX}
            cy={moundY - moundHeight * offset}
            rx={moundWidth * (1 - offset * 0.5)}
            ry={moundHeight * 0.1}
            fill="none"
            stroke={darkStone}
            strokeWidth="0.2"
            opacity={0.4}
          />
        ))}
      </g>
    );
    
    // Structure on top (chief's house/temple)
    if (preservationLevel > 0.4) {
      const structureWidth = size * 0.15;
      const structureHeight = size * 0.1;
      const structureX = moundX - structureWidth / 2;
      const structureY = moundY - moundHeight - structureHeight;
      
      elements.push(
        <g key="mound-structure">
          {/* Posts (if preserved) */}
          {preservationLevel > 0.6 && (
            <>
              {[0.1, 0.9].map((xOff) => (
                <rect
                  key={`post-${xOff}`}
                  x={structureX + structureWidth * xOff - size * 0.005}
                  y={structureY}
                  width={size * 0.01}
                  height={structureHeight}
                  fill={wood}
                  stroke={darkStone}
                  strokeWidth="0.2"
                />
              ))}
            </>
          )}
          
          {/* Thatch roof (partially collapsed) */}
          <polygon
            points={`${structureX},${structureY + structureHeight * 0.3}
                     ${structureX + structureWidth * 0.5},${structureY - size * 0.02}
                     ${structureX + structureWidth},${structureY + structureHeight * 0.3}`}
            fill={thatch}
            stroke={darkStone}
            strokeWidth="0.3"
            opacity={0.7}
          />
        </g>
      );
    }
    
    // Palisade posts around mound base
    if (preservationLevel > 0.5) {
      const numPosts = 8 + Math.floor(rng.random() * 4);
      for (let i = 0; i < numPosts; i++) {
        const angle = (i / numPosts) * Math.PI * 2;
        const postX = moundX + Math.cos(angle) * moundWidth * 1.2;
        const postY = moundY + Math.sin(angle) * moundHeight * 0.8;
        const isStanding = rng.random() < preservationLevel;
        
        if (isStanding) {
          elements.push(
            <rect
              key={`palisade-${i}`}
              x={postX - size * 0.004}
              y={postY - size * 0.04}
              width={size * 0.008}
              height={size * 0.04}
              fill={wood}
              stroke={darkStone}
              strokeWidth="0.1"
              opacity={0.6}
            />
          );
        }
      }
    }
    
  } else if (architectureType === 'pueblo') {
    // Multi-story pueblo structures
    
    const puebloX = x + size * 0.25;
    const puebloY = y + size * 0.5;
    const levels = preservationLevel > 0.6 ? 3 : preservationLevel > 0.3 ? 2 : 1;
    
    for (let level = 0; level < levels; level++) {
      const levelY = puebloY + size * 0.12 * level;
      const levelWidth = size * (0.5 - level * 0.08);
      const numRooms = 3 - level;
      
      for (let room = 0; room < numRooms; room++) {
        const roomX = puebloX + (room * levelWidth) / numRooms;
        const roomWidth = levelWidth / numRooms * 0.9;
        const roomHeight = size * 0.1;
        const isCollapsed = rng.random() > preservationLevel + 0.4 - level * 0.1;
        
        if (!isCollapsed) {
          elements.push(
            <g key={`pueblo-room-${level}-${room}`}>
              <rect
                x={roomX}
                y={levelY}
                width={roomWidth}
                height={roomHeight}
                fill={adobe}
                stroke={darkStone}
                strokeWidth="0.4"
              />
              
              {/* Vigas (roof beams) protruding */}
              {preservationLevel > 0.5 && level < levels - 1 && (
                <>
                  {[0.3, 0.7].map((xOff) => (
                    <line
                      key={`viga-${xOff}`}
                      x1={roomX + roomWidth * xOff}
                      y1={levelY}
                      x2={roomX + roomWidth * xOff + size * 0.02}
                      y2={levelY - size * 0.01}
                      stroke={wood}
                      strokeWidth="0.5"
                    />
                  ))}
                </>
              )}
              
              {/* Window/door opening */}
              {preservationLevel > 0.3 && (
                <rect
                  x={roomX + roomWidth * 0.4}
                  y={levelY + roomHeight * 0.5}
                  width={roomWidth * 0.2}
                  height={roomHeight * 0.35}
                  fill="rgba(0,0,0,0.5)"
                />
              )}
            </g>
          );
        } else {
          // Collapsed adobe
          elements.push(
            <polygon
              key={`collapsed-pueblo-${level}-${room}`}
              points={`${roomX},${levelY + roomHeight}
                       ${roomX + roomWidth * 0.3},${levelY + roomHeight * 0.7}
                       ${roomX + roomWidth * 0.7},${levelY + roomHeight * 0.8}
                       ${roomX + roomWidth},${levelY + roomHeight}`}
              fill={adobe}
              opacity={0.6}
            />
          );
        }
      }
    }
    
    // Plaza area with kiva
    if (preservationLevel > 0.4) {
      const plazaX = puebloX + size * 0.15;
      const plazaY = puebloY + size * 0.2;
      
      elements.push(
        <ellipse
          key="plaza-kiva"
          cx={plazaX}
          cy={plazaY}
          rx={size * 0.035}
          ry={size * 0.025}
          fill="rgba(0,0,0,0.3)"
          stroke={darkStone}
          strokeWidth="0.3"
        />
      );
    }
    
  } else if (architectureType === 'longhouse') {
    // Iroquois longhouse structure
    
    const houseX = x + size * 0.25;
    const houseY = y + size * 0.55;
    const houseLength = size * 0.5;
    const houseWidth = size * 0.15;
    const houseHeight = size * 0.12;
    
    // Main structure (may be partially collapsed)
    const roofIntact = preservationLevel > 0.4;
    
    if (roofIntact) {
      // Barrel-vaulted roof shape
      elements.push(
        <g key="longhouse">
          {/* Walls */}
          <rect
            x={houseX}
            y={houseY}
            width={houseLength}
            height={houseHeight}
            fill={wood}
            stroke={darkStone}
            strokeWidth="0.4"
            opacity={0.8}
          />
          
          {/* Curved roof */}
          <path
            d={`M ${houseX} ${houseY}
                Q ${houseX + houseLength * 0.5} ${houseY - houseHeight * 0.3}
                  ${houseX + houseLength} ${houseY}`}
            fill={thatch}
            stroke={darkStone}
            strokeWidth="0.3"
            opacity={0.7}
          />
          
          {/* Smoke holes */}
          {preservationLevel > 0.6 && (
            <>
              {[0.25, 0.5, 0.75].map((xOff) => (
                <ellipse
                  key={`smoke-hole-${xOff}`}
                  cx={houseX + houseLength * xOff}
                  cy={houseY - houseHeight * 0.15}
                  rx={size * 0.01}
                  ry={size * 0.007}
                  fill="rgba(0,0,0,0.5)"
                />
              ))}
            </>
          )}
        </g>
      );
    } else {
      // Collapsed frame
      elements.push(
        <g key="collapsed-longhouse">
          {/* Frame posts */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((xOff, idx) => {
            const postX = houseX + houseLength * xOff;
            const isStanding = rng.random() < preservationLevel + 0.3;
            const postHeight = isStanding ? houseHeight * (0.5 + rng.random() * 0.3) : size * 0.02;
            
            return (
              <rect
                key={`frame-post-${idx}`}
                x={postX - size * 0.005}
                y={houseY + houseHeight - postHeight}
                width={size * 0.01}
                height={postHeight}
                fill={wood}
                stroke={darkStone}
                strokeWidth="0.2"
                transform={isStanding ? '' : `rotate(${rng.random() * 60 - 30} ${postX} ${houseY + houseHeight})`}
                opacity={0.7}
              />
            );
          })}
        </g>
      );
    }
    
  } else if (architectureType === 'earthlodge') {
    // Plains earthlodge
    
    const lodgeX = x + size * 0.5;
    const lodgeY = y + size * 0.65;
    const lodgeRadius = size * 0.2;
    const lodgeHeight = size * 0.08;
    
    // Earth mound
    elements.push(
      <ellipse
        key="earthlodge-mound"
        cx={lodgeX}
        cy={lodgeY}
        rx={lodgeRadius}
        ry={lodgeHeight}
        fill={earth}
        opacity={0.9}
      />
    );
    
    // Entrance passage
    if (preservationLevel > 0.3) {
      const entranceX = lodgeX - lodgeRadius;
      const entranceY = lodgeY;
      
      elements.push(
        <g key="entrance-passage">
          <rect
            x={entranceX - size * 0.08}
            y={entranceY - size * 0.02}
            width={size * 0.08}
            height={size * 0.04}
            fill={earth}
            stroke={darkStone}
            strokeWidth="0.3"
          />
          <rect
            x={entranceX - size * 0.06}
            y={entranceY - size * 0.015}
            width={size * 0.04}
            height={size * 0.03}
            fill="rgba(0,0,0,0.5)"
          />
        </g>
      );
    }
    
    // Central posts (if visible from collapsed roof)
    if (preservationLevel < 0.6 && preservationLevel > 0.2) {
      const numPosts = 4;
      for (let i = 0; i < numPosts; i++) {
        const angle = (i / numPosts) * Math.PI * 2 + Math.PI / 4;
        const postX = lodgeX + Math.cos(angle) * lodgeRadius * 0.5;
        const postY = lodgeY + Math.sin(angle) * lodgeHeight * 0.5;
        
        elements.push(
          <rect
            key={`center-post-${i}`}
            x={postX - size * 0.006}
            y={postY - size * 0.03}
            width={size * 0.012}
            height={size * 0.03}
            fill={wood}
            stroke={darkStone}
            strokeWidth="0.2"
            opacity={0.7}
          />
        );
      }
    }
    
  } else {
    // Plankhouse (Northwest Coast)
    
    const houseX = x + size * 0.3;
    const houseY = y + size * 0.55;
    const houseWidth = size * 0.4;
    const houseHeight = size * 0.15;
    
    // Cedar plank structure
    elements.push(
      <g key="plankhouse">
        {/* Main structure */}
        <rect
          x={houseX}
          y={houseY}
          width={houseWidth}
          height={houseHeight}
          fill={wood}
          stroke={darkStone}
          strokeWidth="0.5"
        />
        
        {/* Plank texture */}
        {[0.2, 0.4, 0.6, 0.8].map((xOff) => (
          <line
            key={`plank-${xOff}`}
            x1={houseX + houseWidth * xOff}
            y1={houseY}
            x2={houseX + houseWidth * xOff}
            y2={houseY + houseHeight}
            stroke={darkStone}
            strokeWidth="0.2"
            opacity={0.4}
          />
        ))}
        
        {/* Gabled roof (if preserved) */}
        {preservationLevel > 0.4 && (
          <polygon
            points={`${houseX - size * 0.02},${houseY}
                     ${houseX + houseWidth * 0.5},${houseY - houseHeight * 0.4}
                     ${houseX + houseWidth + size * 0.02},${houseY}`}
            fill={wood}
            stroke={darkStone}
            strokeWidth="0.4"
            opacity={0.7}
          />
        )}
        
        {/* Totem pole base (if preserved) */}
        {preservationLevel > 0.5 && rng.random() < 0.5 && (
          <rect
            x={houseX - size * 0.05}
            y={houseY + houseHeight * 0.3}
            width={size * 0.03}
            height={houseHeight * 0.7}
            fill={wood}
            stroke={darkStone}
            strokeWidth="0.3"
          />
        )}
      </g>
    );
  }
  
  // Petroglyphs (rock art) - common across many cultures
  if (preservationLevel > 0.3 && rng.random() < 0.5) {
    const glyphX = x + size * (0.1 + rng.random() * 0.2);
    const glyphY = y + size * (0.4 + rng.random() * 0.2);
    
    elements.push(
      <g key="petroglyphs" opacity={0.4}>
        {/* Spiral */}
        <path
          d={`M ${glyphX} ${glyphY}
              Q ${glyphX + size * 0.01} ${glyphY - size * 0.01}
                ${glyphX + size * 0.02} ${glyphY}
              Q ${glyphX + size * 0.02} ${glyphY + size * 0.02}
                ${glyphX} ${glyphY + size * 0.02}
              Q ${glyphX - size * 0.02} ${glyphY + size * 0.02}
                ${glyphX - size * 0.02} ${glyphY - size * 0.01}`}
          stroke={darkStone}
          strokeWidth="0.5"
          fill="none"
        />
        
        {/* Animal figure */}
        <g transform={`translate(${glyphX + size * 0.04}, ${glyphY})`}>
          <line x1="0" y1="0" x2={size * 0.02} y2="0" stroke={darkStone} strokeWidth="0.4" />
          <line x1={size * 0.005} y1="0" x2={size * 0.005} y2={size * 0.01} stroke={darkStone} strokeWidth="0.3" />
          <line x1={size * 0.015} y1="0" x2={size * 0.015} y2={size * 0.01} stroke={darkStone} strokeWidth="0.3" />
        </g>
      </g>
    );
  }
  
  // Scattered pottery shards and artifacts
  const numArtifacts = 3 + Math.floor((1 - preservationLevel) * 4);
  for (let i = 0; i < numArtifacts; i++) {
    const artifactX = x + size * (0.1 + rng.random() * 0.8);
    const artifactY = y + size * (0.75 + rng.random() * 0.1);
    
    if (i % 2 === 0) {
      // Pottery shard
      const shardSize = size * (0.01 + rng.random() * 0.015);
      elements.push(
        <g key={`pottery-${i}`}>
          <polygon
            points={`${artifactX},${artifactY}
                     ${artifactX + shardSize * 0.7},${artifactY - shardSize * 0.3}
                     ${artifactX + shardSize},${artifactY}
                     ${artifactX + shardSize * 0.5},${artifactY + shardSize * 0.2}`}
            fill="#CD853F"
            stroke="#8B4513"
            strokeWidth="0.1"
            opacity={0.7}
          />
          {/* Decorative pattern */}
          <line
            x1={artifactX + shardSize * 0.2}
            y1={artifactY}
            x2={artifactX + shardSize * 0.8}
            y2={artifactY - shardSize * 0.1}
            stroke="black"
            strokeWidth="0.2"
            opacity={0.3}
          />
        </g>
      );
    } else {
      // Stone artifact
      const stoneSize = size * (0.008 + rng.random() * 0.012);
      elements.push(
        <ellipse
          key={`stone-artifact-${i}`}
          cx={artifactX}
          cy={artifactY}
          rx={stoneSize}
          ry={stoneSize * 0.6}
          fill={darkStone}
          opacity={0.6}
        />
      );
    }
  }
  
  // Desert/prairie grass
  if (preservationLevel < 0.8) {
    const numGrass = 3 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numGrass; i++) {
      const grassX = x + size * (0.1 + rng.random() * 0.8);
      const grassY = y + size * (0.7 + rng.random() * 0.15);
      
      elements.push(
        <g key={`grass-${i}`} opacity={0.3}>
          {[-0.3, 0, 0.3].map((angle) => (
            <line
              key={angle}
              x1={grassX}
              y1={grassY}
              x2={grassX + Math.sin(angle) * size * 0.01}
              y2={grassY - size * 0.025}
              stroke="#DAA520"
              strokeWidth="0.4"
            />
          ))}
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(NativeAmericanRuinsSymbol);