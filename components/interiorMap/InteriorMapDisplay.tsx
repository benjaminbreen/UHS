/**
 * components/interiorMap/InteriorMapDisplay.tsx - Renders the Interior Map view.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InteriorMapData, InteriorTile, InteriorEntity, Point, DevTooltipDisplayData } from '../../types';

import InteriorTooltip from './InteriorTooltip';
import FloorNavigator from './FloorNavigator';
import { FurnitureSymbol } from '../symbols';

interface InteriorMapDisplayProps {
  interiorMapData: InteriorMapData;
  discoveredFloors: Set<number>;
  onExit: () => void;
  playerPos: Point;
  onPlayerMove: (newPos: Point) => void;
  onEntityClick: (entity: InteriorEntity) => void;
  onDevHover: (data: DevTooltipDisplayData | null) => void;
  onDevCommandClick: (data: DevTooltipDisplayData) => void;
}

const INTERIOR_TILE_SIZE = 32;

// A simple throttle utility function to limit the rate of function execution.
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const InteriorMapDisplay: React.FC<InteriorMapDisplayProps> = ({ 
    interiorMapData, 
    discoveredFloors,
    onExit, 
    playerPos, 
    onPlayerMove, 
    onEntityClick,
    onDevHover,
    onDevCommandClick
}) => {
  const { width, height, description, tiles, entities, player, floor, entrance } = interiorMapData;
  const svgWidth = width * INTERIOR_TILE_SIZE;
  const svgHeight = height * INTERIOR_TILE_SIZE;

  const [hoveredEntity, setHoveredEntity] = useState<InteriorEntity | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onExit();
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let newX = playerPos.x;
        let newY = playerPos.y;
        if (e.key === 'ArrowUp') newY -= 1;
        if (e.key === 'ArrowDown') newY += 1;
        if (e.key === 'ArrowLeft') newX -= 1;
        if (e.key === 'ArrowRight') newX += 1;
        onPlayerMove({ x: newX, y: newY });
    }
  }, [onExit, playerPos, onPlayerMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);
  
  const throttledOnDevHover = useCallback(throttle(onDevHover, 100), [onDevHover]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
    if (!hoveredEntity) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const svgX = e.clientX - rect.left;
        const svgY = e.clientY - rect.top;
        const tileX = Math.floor(svgX / INTERIOR_TILE_SIZE);
        const tileY = Math.floor(svgY / INTERIOR_TILE_SIZE);

        if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
            const tile = tiles[tileY]?.[tileX];
            if (tile) {
                throttledOnDevHover({ viewMode: 'interior', tile });
            }
        } else {
            throttledOnDevHover(null);
        }
    }
  }, [hoveredEntity, throttledOnDevHover, tiles, width, height]);

  const handleEntityClick = (e: React.MouseEvent, entity: InteriorEntity) => {
     if (e.metaKey || e.ctrlKey) { 
        const tile = tiles[Math.floor(entity.y / INTERIOR_TILE_SIZE)]?.[Math.floor(entity.x / INTERIOR_TILE_SIZE)];
        if (tile) {
            onDevCommandClick({ viewMode: 'interior', tile, entity });
        }
     } else if (entity.isInteractable) { 
        onEntityClick(entity); 
     }
  };
  
  return (
    <div className="relative w-full h-full flex flex-col bg-gray-800 text-white shadow-lg overflow-hidden">
        <FloorNavigator
            currentFloor={floor}
            discoveredFloors={discoveredFloors}
            onFloorChange={() => {}} // Floor changing is disabled for now
        />
        <div className="p-4 border-b border-gray-600 bg-gray-900/50 shrink-0">
            <h3 className="capitalize text-lg font-semibold">{interiorMapData.buildingType} Interior - Floor {floor + 1}</h3>
            <p className="text-sm text-gray-400 italic">{description}</p>
        </div>
        <div 
            ref={containerRef}
            className="w-full h-full relative" 
            style={{backgroundColor: '#374151'}}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => throttledOnDevHover(null)}
        >
           <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                    <pattern id="wood_plank_light" patternUnits="userSpaceOnUse" width="64" height="8" patternTransform="rotate(45)">
                        <rect width="64" height="8" fill="#a08a70"/>
                        <line x1="0" y1="0" x2="64" y2="0" stroke="#8c6e54" strokeWidth="1"/>
                    </pattern>
                    <pattern id="wood_plank_dark" patternUnits="userSpaceOnUse" width="64" height="8" patternTransform="rotate(45)">
                        <rect width="64" height="8" fill="#856a5d"/>
                        <line x1="0" y1="0" x2="64" y2="0" stroke="#654321" strokeWidth="1"/>
                    </pattern>
                     <pattern id="wood_plank_hall" patternUnits="userSpaceOnUse" width="64" height="8" patternTransform="rotate(45)">
                        <rect width="64" height="8" fill="#9d876a"/>
                        <line x1="0" y1="0" x2="64" y2="0" stroke="#7f6a54" strokeWidth="1"/>
                    </pattern>
                    <pattern id="stone_wall" patternUnits="userSpaceOnUse" width="32" height="32">
                        <rect width="32" height="32" fill="#6b7280"/>
                        <rect x="0" y="16" width="16" height="16" fill="#717a87"/>
                        <rect x="16" y="0" width="16" height="16" fill="#717a87"/>
                        <line x1="0" y1="16" x2="32" y2="16" stroke="#5a626f" strokeWidth="0.5"/>
                        <line x1="16" y1="0" x2="16" y2="32" stroke="#5a626f" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                {/* Floor and Walls */}
                {tiles.map((row, y) => row.map((tile: InteriorTile, x: number) => (
                    <rect key={`interior-tile-${x}-${y}`}
                        x={x * INTERIOR_TILE_SIZE} y={y * INTERIOR_TILE_SIZE}
                        width={INTERIOR_TILE_SIZE} height={INTERIOR_TILE_SIZE}
                        fill={tile.type === 'wall' ? 'url(#stone_wall)' : `url(#${tile.texture})`}
                    />
                )))}

                {/* Render Entrance Door separately for glowing effect */}
                {entrance && (
                  <rect
                    key={`entrance-door`}
                    x={entrance.x * INTERIOR_TILE_SIZE}
                    y={entrance.y * INTERIOR_TILE_SIZE}
                    width={INTERIOR_TILE_SIZE}
                    height={INTERIOR_TILE_SIZE}
                    fill="#f59e0b"
                    className="animate-glowing-door-anim"
                  />
                )}

                {/* Furniture */}
                {entities.map(entity => (
                    <g key={entity.id}
                        onMouseEnter={() => {
                            setHoveredEntity(entity);
                            const tile = tiles[Math.floor(entity.y/INTERIOR_TILE_SIZE)]?.[Math.floor(entity.x/INTERIOR_TILE_SIZE)];
                            if (tile) throttledOnDevHover({ viewMode: 'interior', tile, entity });
                        }}
                        onMouseLeave={() => {
                            setHoveredEntity(null);
                            throttledOnDevHover(null);
                        }}
                        onClick={(e) => handleEntityClick(e, entity)}
                        style={{ cursor: (entity.isInteractable || entity.subType === 'staircase') ? 'pointer' : 'default' }}
                    >
                         <FurnitureSymbol {...entity} />
                    </g>
                ))}

                 {/* Player */}
                <text
                    x={playerPos.x * INTERIOR_TILE_SIZE + INTERIOR_TILE_SIZE / 2}
                    y={playerPos.y * INTERIOR_TILE_SIZE + INTERIOR_TILE_SIZE / 2}
                    fontSize={INTERIOR_TILE_SIZE * 0.9}
                    textAnchor="middle" dominantBaseline="central"
                >
                    {player.emoji}
                </text>
            </svg>
        </div>
        <button
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-red-600/80 text-white text-2xl font-bold rounded-full hover:bg-red-500 transition-colors shadow-lg"
            onClick={onExit}
            aria-label="Exit building"
            title="Return to Detail Map (Esc)"
        >
            &times;
        </button>
        {hoveredEntity && <InteriorTooltip entity={hoveredEntity} position={tooltipPos} />}
    </div>
  );
};

export default InteriorMapDisplay;