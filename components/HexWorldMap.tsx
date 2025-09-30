/**
 * HexWorldMap - Regional view with drill-down to area details
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { buildRegionalMap, getRegionAreas, getAdjacentRegions, RegionHex } from '../utils/regionalGeography';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { ADJACENCIES } from '../constants/gameData/adjacencies';
import { X, ZoomIn, ZoomOut, Move, Maximize2, Globe, ArrowLeft, Info } from 'lucide-react';

interface HexWorldMapProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'world' | 'region';

interface AreaNode {
  name: string;
  climate: string;
  x: number;
  y: number;
}

const HexWorldMap: React.FC<HexWorldMapProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('world');
  const [selectedRegion, setSelectedRegion] = useState<RegionHex | null>(null);
  const [hoveredItem, setHoveredItem] = useState<RegionHex | AreaNode | null>(null);
  const [transform, setTransform] = useState({ k: 1.2, x: 100, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Calculate real area counts for regions
  const getRegionAreaCount = (regionName: string): number => {
    let count = 0;
    Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
      Object.entries(zoneData).forEach(([regName, regionData]) => {
        if (regName === regionName && typeof regionData === 'object' && !Array.isArray(regionData)) {
          Object.entries(regionData).forEach(([areaKey, area]) => {
            if (area && typeof area === 'object' && 'name' in area) {
              count++;
            }
          });
        }
      });
    });
    return count;
  };

  // Build regional map with updated area counts
  const regions = useMemo(() => {
    const regionHexes = buildRegionalMap();
    return regionHexes.map(region => ({
      ...region,
      areaCount: getRegionAreaCount(region.name)
    }));
  }, []);

  // Get areas for selected region with adjacency-based positioning
  const regionAreas = useMemo(() => {
    if (!selectedRegion) return [];

    const areas = getRegionAreas(selectedRegion.name);
    if (areas.length === 0) return [];

    const positioned: AreaNode[] = [];
    const placed = new Map<string, { x: number; y: number }>();
    const queue: Array<{ area: string; x: number; y: number }> = [];

    // Find a starting area (prefer one with many connections)
    const startArea = areas.reduce((best, area) => {
      const connections = ADJACENCIES[area.name];
      const connectionCount = connections ?
        Object.values(connections).filter(c => c && !c.startsWith('LIMINAL')).length : 0;

      const bestConnections = ADJACENCIES[best.name] ?
        Object.values(ADJACENCIES[best.name]).filter(c => c && !c.startsWith('LIMINAL')).length : 0;

      return connectionCount > bestConnections ? area : best;
    }, areas[0]);

    // Place starting area at center
    queue.push({ area: startArea.name, x: 50, y: 30 });
    placed.set(startArea.name, { x: 50, y: 30 });
    positioned.push({
      name: startArea.name,
      climate: startArea.climate,
      x: 50,
      y: 30
    });

    // Direction offsets for hex grid
    const getNeighborPos = (x: number, y: number, direction: string): { x: number; y: number } => {
      const offsets = {
        'N': { x: 0, y: -2 },
        'S': { x: 0, y: 2 },
        'E': { x: 2, y: 0 },
        'W': { x: -2, y: 0 },
        'NE': { x: 1, y: -1 },
        'NW': { x: -1, y: -1 },
        'SE': { x: 1, y: 1 },
        'SW': { x: -1, y: 1 }
      };
      const offset = offsets[direction as keyof typeof offsets] || { x: 0, y: 0 };
      return { x: x + offset.x, y: y + offset.y };
    };

    // Breadth-first placement using adjacencies
    while (queue.length > 0) {
      const current = queue.shift()!;
      const adjacency = ADJACENCIES[current.area];
      if (!adjacency) continue;

      ['N', 'S', 'E', 'W'].forEach(dir => {
        const neighbor = adjacency[dir as 'N' | 'S' | 'E' | 'W'];
        if (!neighbor || neighbor.startsWith('LIMINAL')) return;

        // Check if this neighbor is in our region
        const neighborInRegion = areas.find(a => a.name === neighbor);
        if (!neighborInRegion || placed.has(neighbor)) return;

        // Calculate position
        const newPos = getNeighborPos(current.x, current.y, dir);

        // Check for conflicts
        let finalPos = newPos;
        let attempts = 0;
        while (attempts < 8 && positioned.some(p =>
          Math.abs(p.x - finalPos.x) < 1.5 && Math.abs(p.y - finalPos.y) < 1.5)) {
          // Try alternative positions
          const altDir = ['NE', 'NW', 'SE', 'SW'][attempts % 4];
          finalPos = getNeighborPos(current.x, current.y, altDir);
          attempts++;
        }

        // Place the area
        placed.set(neighbor, finalPos);
        positioned.push({
          name: neighbor,
          climate: neighborInRegion.climate,
          x: finalPos.x,
          y: finalPos.y
        });

        queue.push({ area: neighbor, x: finalPos.x, y: finalPos.y });
      });
    }

    // Place any remaining areas in a ring around the placed ones
    const unplaced = areas.filter(area => !placed.has(area.name));
    unplaced.forEach((area, index) => {
      const angle = (index * 2 * Math.PI) / unplaced.length;
      const radius = 25;
      positioned.push({
        name: area.name,
        climate: area.climate,
        x: 50 + Math.cos(angle) * radius,
        y: 30 + Math.sin(angle) * radius
      });
    });

    return positioned;
  }, [selectedRegion]);

  // Hex dimensions
  const hexSize = viewMode === 'world' ? 8 : 12;
  const hexWidth = hexSize * Math.sqrt(3);
  const hexHeight = hexSize * 2;

  // Enhanced color schemes with water detection
  const getClimateColor = (climate: string, name?: string): string => {
    // Check if it's a water body
    if (name && (name.includes('Sea') || name.includes('Ocean') ||
        name.includes('Bay') || name.includes('Strait') ||
        name.includes('Channel') || name.includes('Gulf') ||
        name === 'European Waters' || name === 'Major Seas and Oceans')) {
      return '#1e4a7f';
    }

    // Special regions
    if (name === 'Antarctica') return '#e8f5e9';
    if (name === 'Arctic and Subarctic') return '#e1f5fe';

    // Land climates with better differentiation
    const colors: { [key: string]: string } = {
      'temperate': '#4a7c59',
      'mediterranean': '#7fb069',
      'arid': '#d4a574',
      'desert': '#c19a6b',
      'cold': '#b8d4e3',
      'arctic': '#e0e7ef',
      'tropical': '#2d5016',
      'subtropical': '#3d6a3d',
      'continental': '#5d8055',
      'savanna': '#8bc34a',
      'rainforest': '#1b4332',
      'monsoon': '#00695c',
      'steppe': '#9ccc65',
      'tundra': '#cfd8dc',
      'oceanic': '#4db6ac',
      'unknown': '#5a5a5a'
    };
    return colors[climate.toLowerCase()] || '#4a7c59';
  };

  // Get hex center position
  const getHexCenter = (x: number, y: number) => {
    const hx = x * hexWidth * 0.75;
    const hy = y * hexHeight * 0.75 + (x % 2 ? hexHeight * 0.375 : 0);
    return { x: hx, y: hy };
  };

  // Draw hex
  const drawHex = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  };

  // Handle zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(4, transform.k * scaleFactor));

    const worldX = (mouseX - transform.x) / transform.k;
    const worldY = (mouseY - transform.y) / transform.k;

    setTransform({
      k: newScale,
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale
    });
  }, [transform]);

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    } else {
      // Check for hover
      const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
      const mouseY = (e.clientY - rect.top - transform.y) / transform.k;

      let found: any = null;

      if (viewMode === 'world') {
        // Check regions
        for (const region of regions) {
          const pos = getHexCenter(region.x, region.y);
          const dx = mouseX - pos.x;
          const dy = mouseY - pos.y;
          if (Math.sqrt(dx * dx + dy * dy) < hexSize) {
            found = region;
            break;
          }
        }
      } else {
        // Check areas
        for (const area of regionAreas) {
          const pos = getHexCenter(area.x, area.y);
          const dx = mouseX - pos.x;
          const dy = mouseY - pos.y;
          if (Math.sqrt(dx * dx + dy * dy) < hexSize) {
            found = area;
            break;
          }
        }
      }

      setHoveredItem(found);
    }
  }, [isPanning, panStart, transform, viewMode, regions, regionAreas]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isPanning) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.k;

    if (viewMode === 'world') {
      // Check for region click
      for (const region of regions) {
        const pos = getHexCenter(region.x, region.y);
        const dx = mouseX - pos.x;
        const dy = mouseY - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < hexSize) {
          setSelectedRegion(region);
          setViewMode('region');
          setTransform({ k: 1.5, x: 200, y: 100 });
          break;
        }
      }
    }
  }, [isPanning, transform, viewMode, regions]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Ocean gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a2540');
    gradient.addColorStop(0.5, '#0f3658');
    gradient.addColorStop(1, '#0a2540');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    if (viewMode === 'world') {
      // Draw ocean background
      ctx.fillStyle = '#0a1929';
      ctx.globalAlpha = 0.3;
      for (let y = 0; y < 80; y++) {
        for (let x = 0; x < 140; x++) {
          const pos = getHexCenter(x, y);
          drawHex(ctx, pos.x, pos.y, hexSize * 0.9);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Draw region connections
      const adjacencyMap = new Map<string, Set<string>>();
      regions.forEach(region => {
        adjacencyMap.set(region.name, getAdjacentRegions(region.name));
      });

      // Draw connection lines
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1 / transform.k;
      ctx.globalAlpha = 0.3;

      regions.forEach(region => {
        const adjacent = adjacencyMap.get(region.name);
        if (adjacent) {
          adjacent.forEach(adjName => {
            const adjRegion = regions.find(r => r.name === adjName);
            if (adjRegion) {
              const from = getHexCenter(region.x, region.y);
              const to = getHexCenter(adjRegion.x, adjRegion.y);

              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();
            }
          });
        }
      });
      ctx.globalAlpha = 1;

      // Draw regions
      regions.forEach(region => {
        const pos = getHexCenter(region.x, region.y);

        // Determine if water region
        const isWater = region.name.includes('Sea') || region.name.includes('Ocean') ||
                       region.name.includes('Bay') || region.name.includes('Strait') ||
                       region.name.includes('Channel') || region.name.includes('Gulf') ||
                       region.name === 'European Waters' || region.name === 'Major Seas and Oceans';

        // Draw hex with different style for water
        drawHex(ctx, pos.x, pos.y, hexSize);

        if (isWater) {
          // Water regions - semi-transparent
          ctx.fillStyle = getClimateColor(region.dominantClimate, region.name);
          ctx.globalAlpha = 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          // Land regions - solid
          ctx.fillStyle = getClimateColor(region.dominantClimate, region.name);
          ctx.fill();
        }

        // Stroke
        if (hoveredItem === region) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2 / transform.k;
        } else {
          ctx.strokeStyle = isWater ? '#1e3a5f' : '#2c3e50';
          ctx.lineWidth = isWater ? 0.3 / transform.k : 0.5 / transform.k;
        }
        ctx.stroke();

        // Draw label (skip for water regions unless hovered)

        if (transform.k > 0.8 && (!isWater || hoveredItem === region)) {
          ctx.save();

          // Add text shadow for better readability
          if (!isWater) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
          }

          ctx.fillStyle = isWater ? '#9eb8d9' : 'white';
          ctx.font = `bold ${7 / transform.k}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            region.name.length > 15 ? region.name.substring(0, 13) + '...' : region.name,
            pos.x, pos.y - 3 / transform.k
          );

          // Area count (only for land regions with areas)
          if (!isWater && region.areaCount > 0) {
            ctx.font = `${5 / transform.k}px sans-serif`;
            ctx.fillStyle = '#ddd';
            ctx.fillText(`${region.areaCount} areas`, pos.x, pos.y + 5 / transform.k);
          }

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.restore();
        }
      });

    } else {
      // Region detail view
      if (selectedRegion) {
        // Draw connections between areas first
        ctx.strokeStyle = '#3d5a80';
        ctx.lineWidth = 1 / transform.k;
        ctx.globalAlpha = 0.5;

        regionAreas.forEach(area => {
          const adjacency = ADJACENCIES[area.name];
          if (!adjacency) return;

          ['N', 'S', 'E', 'W'].forEach(dir => {
            const neighbor = adjacency[dir as 'N' | 'S' | 'E' | 'W'];
            if (!neighbor || neighbor.startsWith('LIMINAL')) return;

            const neighborArea = regionAreas.find(a => a.name === neighbor);
            if (!neighborArea) return;

            const from = getHexCenter(area.x, area.y);
            const to = getHexCenter(neighborArea.x, neighborArea.y);

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          });
        });
        ctx.globalAlpha = 1;

        // Draw areas
        regionAreas.forEach(area => {
          const pos = getHexCenter(area.x, area.y);

          // Draw hex
          drawHex(ctx, pos.x, pos.y, hexSize);
          ctx.fillStyle = getClimateColor(area.climate, area.name);
          ctx.fill();

          // Stroke
          if (hoveredItem === area) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2 / transform.k;
          } else {
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 1 / transform.k;
          }
          ctx.stroke();

          // Draw label
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.font = `${8 / transform.k}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            area.name.length > 14 ? area.name.substring(0, 12) + '...' : area.name,
            pos.x, pos.y
          );
          ctx.restore();
        });
      }
    }

    ctx.restore();

  }, [isOpen, viewMode, regions, regionAreas, transform, hoveredItem, selectedRegion]);

  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {viewMode === 'world' ? 'World Map - Regional View' : selectedRegion?.name}
            </h2>
            <p className="text-xs text-slate-400">
              {viewMode === 'world'
                ? `${regions.filter(r => !r.name.includes('Sea') && !r.name.includes('Ocean')).length} land regions • ${regions.filter(r => r.name.includes('Sea') || r.name.includes('Ocean')).length} water bodies • Click to explore`
                : `${regionAreas.length} areas in this region`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'region' && (
            <button
              onClick={() => {
                setViewMode('world');
                setSelectedRegion(null);
                setTransform({ k: 1.2, x: 100, y: 50 });
              }}
              className="p-2 bg-blue-700 hover:bg-blue-600 rounded transition-colors"
              title="Back to World"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}

          <button
            onClick={() => setTransform(t => ({ ...t, k: Math.min(4, t.k * 1.2) }))}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setTransform(t => ({ ...t, k: Math.max(0.5, t.k / 1.2) }))}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setTransform(viewMode === 'world'
              ? { k: 1.2, x: 100, y: 50 }
              : { k: 1.5, x: 200, y: 100 })}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>

          <button onClick={onClose} className="ml-3 p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-900">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: isPanning ? 'grabbing' : hoveredItem ? 'pointer' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        />

        {/* Enhanced Hover tooltip */}
        {hoveredItem && (
          <div className="absolute bottom-4 left-4 bg-slate-800/95 border border-slate-600 rounded-lg p-4 pointer-events-none shadow-xl min-w-64">
            <div className="font-bold text-white text-base mb-2">
              {'name' in hoveredItem ? hoveredItem.name : 'Unknown'}
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              {'zone' in hoveredItem && (
                <>
                  <div className="flex justify-between">
                    <span>Cultural Zone:</span>
                    <span className="text-emerald-400 font-medium">{hoveredItem.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Climate:</span>
                    <span className="text-blue-400 capitalize">{hoveredItem.dominantClimate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Areas:</span>
                    <span className="text-amber-400">{hoveredItem.areaCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordinates:</span>
                    <span className="text-gray-400">{hoveredItem.lat.toFixed(1)}°, {hoveredItem.lng.toFixed(1)}°</span>
                  </div>
                  {hoveredItem.areaCount > 0 && (
                    <div className="text-blue-400 mt-2 pt-1 border-t border-slate-600 text-center">
                      Click to explore region's areas →
                    </div>
                  )}
                </>
              )}
              {'climate' in hoveredItem && !('zone' in hoveredItem) && (
                <>
                  <div className="flex justify-between">
                    <span>Climate:</span>
                    <span className="text-blue-400 capitalize">{hoveredItem.climate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parent Region:</span>
                    <span className="text-emerald-400">{selectedRegion?.name}</span>
                  </div>
                  <div className="text-gray-400 mt-2 pt-1 border-t border-slate-600 text-center">
                    Individual area within region
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Info panel */}
        {viewMode === 'world' && (
          <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 max-w-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">Regional View</div>
                <div>Each hex represents a complete region with multiple areas.</div>
                <div>Click any region to see its individual areas.</div>
                <div>Regions are positioned based on real-world geography.</div>
              </div>
            </div>
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 bg-slate-800/90 rounded-lg px-3 py-2 text-xs text-slate-400">
          <Move className="w-3 h-3 inline mr-1" />
          Drag to pan • Scroll to zoom • {viewMode === 'world' ? 'Click region for details' : 'Click back to return'}
        </div>
      </div>
    </div>
  );
};

export default HexWorldMap;