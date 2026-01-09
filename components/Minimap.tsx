import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapData, BiomeType } from '../types/index';

interface MinimapProps {
  mapData: MapData;
  playerX: number | null;
  playerY: number | null;
  zoomLevel: number;
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
}

const MINIMAP_MIN_SIZE = 100;
const MINIMAP_MAX_SIZE = 300;
const TILE_SIZE_PX = 18;

const Minimap: React.FC<MinimapProps> = ({ mapData, playerX, playerY, zoomLevel, panX, panY, containerWidth, containerHeight }) => {
  // Check if mobile on mount
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [isMinimized, setIsMinimized] = useState(isMobile);
  const [size, setSize] = useState(110);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 6, y: 6 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef(140);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartElementPos = useRef({ x: 0, y: 0 });

  // Calculate the aspect ratio of the actual map
  const mapAspectRatio = useMemo(() => {
    return mapData.width / mapData.height;
  }, [mapData]);

  // Calculate display dimensions to fit the map without black bars
  const displayDimensions = useMemo(() => {
    if (mapAspectRatio > 1) {
      // Map is wider than tall
      return {
        width: size,
        height: size / mapAspectRatio
      };
    } else {
      // Map is taller than wide or square
      return {
        width: size * mapAspectRatio,
        height: size
      };
    }
  }, [size, mapAspectRatio]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = size;
  };

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const dx = resizeStartPos.current.x - e.clientX;
    const dy = resizeStartPos.current.y - e.clientY;
    const newSize = resizeStartSize.current + Math.max(dx, dy);
    setSize(Math.max(MINIMAP_MIN_SIZE, Math.min(MINIMAP_MAX_SIZE, newSize)));
  }, [isResizing]);

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartElementPos.current = { x: position.x, y: position.y };
  };

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Get viewport dimensions to prevent dragging off screen
    const maxX = window.innerWidth - (displayDimensions.width + 24);
    const maxY = window.innerHeight - (displayDimensions.height + 24);
    
    // Calculate new position with bounds checking
    const newX = Math.max(0, Math.min(maxX, dragStartElementPos.current.x - dx));
    const newY = Math.max(0, Math.min(maxY, dragStartElementPos.current.y + dy));
    
    setPosition({
      x: newX,
      y: newY
    });
  }, [isDragging, displayDimensions]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Scale calculation based on the larger dimension
  const scale = useMemo(() => {
    const mapWidth = mapData.width * TILE_SIZE_PX;
    const mapHeight = mapData.height * TILE_SIZE_PX;
    return Math.min(displayDimensions.width / mapWidth, displayDimensions.height / mapHeight);
  }, [displayDimensions, mapData]);

  const minimapContent = useMemo(() => {
     // Instead of using .flat() which relies on tile.x and tile.y being correct,
     // iterate through the 2D array directly with indices
     const tiles: JSX.Element[] = [];
     for (let y = 0; y < mapData.height; y++) {
       for (let x = 0; x < mapData.width; x++) {
         const tile = mapData.tiles[y][x];
         let color = '#1e3a8a'; // Default deep ocean
        
        // Comprehensive biome color mapping
        switch (tile.biome) {
          // Water biomes
          case BiomeType.DEEP_OCEAN: color = '#294aa6'; break;
          case BiomeType.SHALLOW_OCEAN: color = '#38b8f8'; break;
          case BiomeType.RIVER: color = '#38b8f8'; break;
          case BiomeType.MAJOR_RIVER: color = '#3b82f6'; break;
          case BiomeType.FRESHWATER_LAKE: color = '#38b8f8'; break;
          case BiomeType.ESTUARY: color = '#4ea1f5'; break;
          case BiomeType.REEF: color = '#3ed2f0'; break;
          case BiomeType.HOT_SPRINGS: color = '#f0abfc'; break;
          
          // Cold biomes
          case BiomeType.TUNDRA: color = '#e0e7ff'; break;
          case BiomeType.SNOW: color = '#f8fafc'; break;
          case BiomeType.ICE: color = '#e5e7eb'; break;
          
          // Forest biomes
          case BiomeType.FOREST: color = '#166534'; break;
          case BiomeType.DENSE_FOREST: color = '#14532d'; break;
          case BiomeType.JUNGLE: color = '#064e3b'; break;
          case BiomeType.BAMBOO: color = '#84cc16'; break;
          
          // Arid biomes
          case BiomeType.DESERT: color = '#d97706'; break;
          case BiomeType.SAND_DUNES: color = '#fbbf24'; break;
          case BiomeType.SCRUB: color = '#a16207'; break;
          case BiomeType.SAVANNA: color = '#ca8a04'; break;
          case BiomeType.STEPPE: color = '#eab308'; break;
          
          // Grasslands
          case BiomeType.GRASSLAND: color = '#65a30d'; break;
          case BiomeType.MEADOW: color = '#84cc16'; break;
          case BiomeType.RAINFOREST: color = '#15803d'; break;
          
          // Wetlands
          case BiomeType.WETLANDS: color = '#059669'; break;
          case BiomeType.SWAMP: color = '#047857'; break;
          case BiomeType.MANGROVE: color = '#10b981'; break;
          case BiomeType.SALT_FLATS: color = '#d4d4d8'; break;
          
          // Mountain biomes
          case BiomeType.MOUNTAIN: color = '#6b7280'; break;
          case BiomeType.HIGH_PEAK: color = '#4b5563'; break;
          case BiomeType.HILLS: color = '#65a30d'; break;
          case BiomeType.CLIFF: color = '#525252'; break;
          
          // Volcanic biomes
          case BiomeType.VOLCANIC_ROCK: color = '#374151'; break;
          case BiomeType.VOLCANIC_SOIL: color = '#1f2937'; break;
          
          // Beach and coastal
          case BiomeType.BEACH: color = '#fbbf24'; break;
          case BiomeType.RIVERBANK: color = '#fde047'; break;
          
          // Urban biomes
          case BiomeType.DENSE_CITY: color = '#dc2626'; break;
          case BiomeType.LOW_DENSITY_CITY: color = '#ef4444'; break;
          case BiomeType.CITY_CENTER: color = '#b91c1c'; break;
          case BiomeType.HAMLET: color = '#f87171'; break;
          case BiomeType.GOVERNMENT_DISTRICT: color = '#ba11f2'; break;
          case BiomeType.MARKETPLACE: color = '#f97316'; break;
          case BiomeType.PLAZA: color = '#e4d5b7'; break;
          case BiomeType.PARK: color = '#86efac'; break;
          case BiomeType.ROAD: color = '#737373'; break;
          
          // Agricultural
          case BiomeType.FARMLAND: color = '#a3e635'; break;
          case BiomeType.PADDOCK: color = '#bef264'; break;
          
          // Special biomes
          case BiomeType.RUINS: color = '#a8a29e'; break;
          case BiomeType.PALACE: color = '#fcd34d'; break;
          case BiomeType.OASIS: color = '#34d399'; break;
          case BiomeType.SHOALS: color = '#67e8f9'; break;
          case BiomeType.HARBOR: color = '#94a3b8'; break;
          
          // Ethereal/Special realms
          case BiomeType.AIR: color = '#dbeafe'; break;
          case BiomeType.UNDERSEA: color = '#172554'; break;
          
          default: color = '#84cc16'; // Fallback green
        }

        const rectSize = TILE_SIZE_PX;
        tiles.push(
          <rect
            key={`minimap-${x}-${y}`}
            x={x * rectSize}
            y={y * rectSize}
            width={rectSize}
            height={rectSize}
            fill={color}
          />
        );
       }
     }
     return tiles;
  }, [mapData]);
  
  if (isMinimized) {
    return (
      <div className="absolute z-30" style={{ top: `${position.y}px`, right: `${position.x}px` }}>
        <button
            onClick={() => setIsMinimized(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-base text-white/80 shadow-md transition-all duration-150 backdrop-blur-sm hover:bg-slate-800/90 hover:text-white"
            title="Show Minimap"
            aria-label="Show Minimap"
        >
            🗺️
        </button>
      </div>
    );
  }

  return (
    <div
        ref={wrapperRef}
        className="absolute z-30 bg-slate-900/85 backdrop-blur-sm rounded-lg p-2 border border-white/10 shadow-lg select-none overflow-hidden"
        style={{
          top: `${position.y}px`,
          right: `${position.x}px`,
          width: displayDimensions.width + 16,   // padding p-2 = 8px each side
          cursor: isResizing ? 'nwse-resize' : isDragging ? 'grabbing' : 'grab',
          transition: isDragging || isResizing ? 'none' : 'all 0.15s'
        }}
        onMouseDown={handleDragStart}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-[10px] text-white/70 font-semibold tracking-wide uppercase" style={{ pointerEvents: 'none' }}>Overview</div>
        <button
          onClick={() => setIsMinimized(true)}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-white/50 hover:text-white text-sm leading-none px-0.5 -mr-0.5"
          title="Minimize Map"
          aria-label="Minimize Map"
        >
            −
        </button>
      </div>
      <div className="relative" style={{ width: displayDimensions.width, height: displayDimensions.height }}>
        <svg
          width={displayDimensions.width}
          height={displayDimensions.height}
          viewBox={`0 0 ${mapData.width * TILE_SIZE_PX} ${mapData.height * TILE_SIZE_PX}`}
          className="rounded-md"
          style={{ backgroundColor: '#1e293b' }}
        >
          {minimapContent}
          
          {containerWidth > 0 && containerHeight > 0 && (
            <rect
              x={-panX / zoomLevel}
              y={-panY / zoomLevel}
              width={containerWidth / zoomLevel}
              height={containerHeight / zoomLevel}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              opacity="0.8"
              rx="2"
            />
          )}
          
          {playerX !== null && playerY !== null && (
            <g>
              <circle
                cx={playerX * TILE_SIZE_PX + TILE_SIZE_PX/2}
                cy={playerY * TILE_SIZE_PX + TILE_SIZE_PX/2}
                r="6"
                fill="rgba(239, 68, 68, 0.3)"
              />
              <circle
                cx={playerX * TILE_SIZE_PX + TILE_SIZE_PX/2}
                cy={playerY * TILE_SIZE_PX + TILE_SIZE_PX/2}
                r="3"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
        <div
            onMouseDown={handleResizeMouseDown}
            className="resize-handle absolute bottom-0.5 right-0.5 w-4 h-4 cursor-nwse-resize text-white/30 hover:text-white/60 p-0.5"
            title="Resize Map"
        >
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default Minimap;