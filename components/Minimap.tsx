
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

const MINIMAP_MIN_SIZE = 120;
const MINIMAP_MAX_SIZE = 400;
const TILE_SIZE_PX = 20;

const Minimap: React.FC<MinimapProps> = ({ mapData, playerX, playerY, zoomLevel, panX, panY, containerWidth, containerHeight }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState(160);
  const [isResizing, setIsResizing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef(160);

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


  const scale = useMemo(() => size / Math.max(mapData.width * TILE_SIZE_PX, mapData.height * TILE_SIZE_PX), [size, mapData]);

  const minimapContent = useMemo(() => {
     return mapData.tiles.flat().map((tile) => {
        let color = '#1e3a8a'; // Default deep ocean
        if (tile.isLand) {
          switch (tile.biome) {
            case BiomeType.FOREST: case BiomeType.DENSE_FOREST: color = '#166534'; break;
            case BiomeType.MOUNTAIN: case BiomeType.HIGH_PEAK: color = '#6b7280'; break;
            case BiomeType.DESERT: color = '#d97706'; break;
            case BiomeType.DENSE_CITY: case BiomeType.LOW_DENSITY_CITY: color = '#dc2626'; break;
            case BiomeType.GRASSLAND: color = '#65a30d'; break;
            case BiomeType.BEACH: color = '#fbbf24'; break;
            case BiomeType.VOLCANIC_ROCK: color = '#374151'; break;
            default: color = '#84cc16';
          }
        } else if (tile.biome === BiomeType.SHALLOW_OCEAN) {
          color = '#38bdf8';
        } else if ([BiomeType.RIVER, BiomeType.MAJOR_RIVER].includes(tile.biome)) {
          color = '#60a5fa';
        }
        
        const rectSize = scale * TILE_SIZE_PX;
        return (
          <rect
            key={`minimap-${tile.x}-${tile.y}`}
            x={tile.x * rectSize}
            y={tile.y * rectSize}
            width={Math.max(1, rectSize)}
            height={Math.max(1, rectSize)}
            fill={color}
          />
        );
      });
  }, [mapData, scale]);
  
  if (isMinimized) {
    return (
      <div className="absolute top-6 right-6 z-30">
        <button 
            onClick={() => setIsMinimized(false)}
            className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-500/50 bg-gray-800/80 text-2xl font-bold text-white shadow-xl transition-all duration-200 backdrop-blur-sm hover:border-blue-400/50 hover:bg-blue-700/80"
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
        className="absolute top-6 right-6 z-30 bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 border border-gray-600/50 shadow-2xl select-none transition-all duration-200" 
        style={{ width: size + 24, height: size + 48, cursor: isResizing ? 'nwse-resize' : 'default' }}
    >
      <div className="flex justify-between items-center mb-2 cursor-grab">
        <div className="text-xs text-gray-300 font-semibold tracking-wide pl-1">World Overview</div>
        <button onClick={() => setIsMinimized(true)} className="text-gray-400 hover:text-white text-xl leading-none px-1" title="Minimize Map" aria-label="Minimize Map">
            −
        </button>
      </div>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg border border-gray-700/50 shadow-inner bg-slate-800">
          {minimapContent}
          
          {containerWidth > 0 && containerHeight > 0 && (
            <rect
              x={-panX * scale}
              y={-panY * scale}
              width={containerWidth * scale / zoomLevel}
              height={containerHeight * scale / zoomLevel}
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
                cx={(playerX * TILE_SIZE_PX + TILE_SIZE_PX/2) * scale}
                cy={(playerY * TILE_SIZE_PX + TILE_SIZE_PX/2) * scale}
                r="4"
                fill="rgba(239, 68, 68, 0.5)"
              />
              <circle
                cx={(playerX * TILE_SIZE_PX + TILE_SIZE_PX/2) * scale}
                cy={(playerY * TILE_SIZE_PX + TILE_SIZE_PX/2) * scale}
                r="2"
                fill="#ef4444"
                stroke="white"
                strokeWidth="0.5"
              />
            </g>
          )}
        </svg>
        <div 
            onMouseDown={handleResizeMouseDown} 
            className="absolute -bottom-3 -right-3 w-6 h-6 cursor-nwse-resize text-gray-500 hover:text-white p-1"
            title="Resize Map"
        >
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default Minimap;
