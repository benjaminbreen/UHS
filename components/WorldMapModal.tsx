import React, { useState } from 'react';
import { MapData, ClimateType, AnimalEntity, NpcEntity, MapArchetype } from '../types';
import { getTileRenderColor } from '../utils/colorUtils';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants/index';

interface CachedMapEntry {
  mapData: MapData;
  animals: AnimalEntity[];
  npcs: NpcEntity[];
  seed: number;
  archetype: MapArchetype;
  climate: ClimateType;
  worldX: number;
  worldY: number;
  region: string;
  localArea: string;
}

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedMaps: Map<string, CachedMapEntry>;
  currentWorldCoords: { x: number; y: number };
}

const WorldMapThumbnail: React.FC<{
  mapData: MapData;
  climate: ClimateType;
  isCurrent: boolean;
}> = ({ mapData, climate, isCurrent }) => {
  return (
    <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${mapData.width} ${mapData.height}`}
        className={`border ${isCurrent ? 'border-blue-400 ring-2 ring-blue-400' : 'border-slate-600'} bg-slate-700 shadow-md`}
        preserveAspectRatio="none"
    >
      {mapData.tiles.map((row, y) =>
        row.map((tile, x) => (
          <rect
            key={`thumb-${tile.x}-${tile.y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={getTileRenderColor(tile, climate, mapData.seed)}
          />
        ))
      )}
       {isCurrent && (
         <text 
            x={mapData.width / 2} y={mapData.height / 2} 
            fill="rgba(251, 191, 36, 0.9)" 
            fontSize={Math.min(mapData.width, mapData.height) * 0.4} 
            textAnchor="middle" 
            dominantBaseline="central"
            style={{pointerEvents: "none", userSelect: "none", filter: 'drop-shadow(0 0 2px black)'}}
        >
           ★
        </text>
       )}
    </svg>
  );
};


const WorldMapModal: React.FC<WorldMapModalProps> = ({ isOpen, onClose, cachedMaps, currentWorldCoords }) => {
  const [hoveredMap, setHoveredMap] = useState<{
    entry: CachedMapEntry;
    pos: { x: number; y: number };
  } | null>(null);

  if (!isOpen) return null;

  const worldCoords = Array.from(cachedMaps.values()).map(entry => ({ x: entry.worldX, y: entry.worldY }));
  if (worldCoords.length === 0) {
    worldCoords.push({ x: currentWorldCoords.x, y: currentWorldCoords.y });
  }

  const minWorldX = Math.min(...worldCoords.map(wc => wc.x));
  const maxWorldX = Math.max(...worldCoords.map(wc => wc.x));
  const minWorldY = Math.min(...worldCoords.map(wc => wc.y));
  const maxWorldY = Math.max(...worldCoords.map(wc => wc.y));

  const gridWidth = maxWorldX - minWorldX + 1;
  const gridHeight = maxWorldY - minWorldY + 1;

  const handleMouseEnter = (entry: CachedMapEntry, e: React.MouseEvent) => {
    setHoveredMap({ entry, pos: { x: e.clientX, y: e.clientY } });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredMap) {
      setHoveredMap(prev => prev ? { ...prev, pos: { x: e.clientX, y: e.clientY } } : null);
    }
  };
  const handleMouseLeave = () => {
    setHoveredMap(null);
  };
  
  const formatEnumString = (enumString: string) => {
    if (!enumString) return "Unknown";
    return enumString.charAt(0).toUpperCase() + enumString.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div 
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-map-title"
    >
      <div 
        className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-blue text-slate-200 flex flex-col w-full h-full max-w-6xl max-h-[90vh] p-6 animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-500/30">
          <h2 id="world-map-title" className="text-2xl font-semibold text-blue-300">World Map</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl font-thin leading-none transition-colors duration-150"
            aria-label="Close world map"
          >&times;</button>
        </div>
        <div className="flex-grow overflow-auto p-2 bg-slate-900/50 rounded-lg shadow-inner scrollbar-thin">
          <div 
            className="grid gap-1 p-1"
            style={{
              gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: gridHeight }).map((_, rIdx) =>
              Array.from({ length: gridWidth }).map((_, cIdx) => {
                const worldX = minWorldX + cIdx;
                const worldY = minWorldY + rIdx;
                const cacheKey = `${worldX},${worldY}`;
                const mapEntry = cachedMaps.get(cacheKey);
                
                return (
                  <div 
                    key={cacheKey} 
                    className="flex items-center justify-center aspect-[40/35]"
                  >
                    {mapEntry ? (
                      <div
                        className="relative w-full h-full transition-transform duration-150 ease-in-out cursor-pointer group hover:scale-105"
                        onMouseEnter={(e) => handleMouseEnter(mapEntry, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        <WorldMapThumbnail
                          mapData={mapEntry.mapData}
                          climate={mapEntry.climate}
                          isCurrent={worldX === currentWorldCoords.x && worldY === currentWorldCoords.y}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-1 text-white text-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-sm">
                            <p className="text-[10px] font-bold truncate leading-tight">{mapEntry.localArea}</p>
                            <p className="text-[9px] text-slate-300 truncate leading-tight">{mapEntry.region}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded bg-slate-800/50 border border-slate-700/50" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {hoveredMap && (
        <div
          className="fixed pointer-events-none p-3 max-w-xs text-xs text-white transition-opacity duration-100 bg-slate-900/90 border rounded-lg shadow-2xl border-slate-600 backdrop-blur-sm"
          style={{ top: hoveredMap.pos.y + 20, left: hoveredMap.pos.x + 20, zIndex: 100 }}
        >
          <h4 className="mb-2 text-sm font-bold text-blue-300">{hoveredMap.entry.localArea}</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p><strong className="text-slate-400">Coords:</strong></p><p>({hoveredMap.entry.worldX}, {hoveredMap.entry.worldY})</p>
            <p><strong className="text-slate-400">Archetype:</strong></p><p>{formatEnumString(hoveredMap.entry.archetype)}</p>
            <p><strong className="text-slate-400">Climate:</strong></p><p>{formatEnumString(hoveredMap.entry.climate)}</p>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-700 grid grid-cols-2 gap-x-4 gap-y-1">
             <p><strong className="text-slate-400">NPCs:</strong></p><p>{hoveredMap.entry.npcs.length}</p>
             <p><strong className="text-slate-400">Animals:</strong></p><p>{hoveredMap.entry.animals.length}</p>
             <p><strong className="text-slate-400">Structures:</strong></p><p>{hoveredMap.entry.mapData.terrainStructures?.length || 0}</p>
          </div>
           {hoveredMap.entry.mapData.majorCity && 
            <p className="pt-2 mt-2 font-semibold border-t border-slate-700 text-yellow-300">🏛️ Major City Present</p>
           }
        </div>
      )}
    </div>
  );
};

export default WorldMapModal;