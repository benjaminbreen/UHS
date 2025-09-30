/**
 * HexWorldGlobe3D - Refactored 3D globe visualization with proper component boundaries
 * Ensures all React Three Fiber hooks are only used within Canvas context
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { buildRegionalMap, RegionHex } from '../utils/regionalGeography';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { X, Globe, Info, Search, RotateCcw } from 'lucide-react';

interface HexWorldGlobe3DProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GlobePoint {
  position: [number, number, number];
  region: RegionHex;
  color: string;
  isWater: boolean;
}

// Convert lat/lng to 3D sphere coordinates - with correct rotation
function latLngToSphere(lat: number, lng: number, radius: number = 5): [number, number, number] {
  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  // Standard spherical to Cartesian conversion
  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return [x, y, z];
}

/**
 * INNER 3D COMPONENTS - These use React Three Fiber hooks and MUST be inside Canvas
 */

// Individual region marker component with glow effect
function RegionMarker({ point, isHovered, onClick, onHover }: {
  point: GlobePoint;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  return (
    <group position={point.position}>
      {/* Outer glow sphere */}
      {isHovered && (
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial
            color={point.color}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      {/* Main marker */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
        }}
      >
        <sphereGeometry args={[isHovered ? 0.1 : 0.05, 16, 16]} />
        <meshStandardMaterial
          color={isHovered ? '#ffffff' : point.color}
          emissive={point.color}
          emissiveIntensity={isHovered ? 0.8 : 0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

// Globe mesh component with realistic world map
function GlobeMesh() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // Create world map texture
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ocean background - medium blue
    ctx.fillStyle = '#2c5f8d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper function to convert lat/lng to canvas coordinates
    const latLngToCanvas = (lat: number, lng: number) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      return { x, y };
    };

    // Draw continents with realistic shapes (simplified but accurate)
    ctx.fillStyle = '#6b8e6f';
    ctx.strokeStyle = '#8faf93';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;

    // Draw major landmasses using path approximations
    // North America
    ctx.beginPath();
    const na = latLngToCanvas(45, -100);
    ctx.moveTo(na.x, na.y);
    const naPoints = [
      [70, -170], [71, -157], [69, -141], [60, -140], [54, -130],
      [48, -125], [32, -117], [23, -110], [15, -97], [19, -90],
      [21, -86], [30, -85], [25, -80], [35, -76], [45, -70],
      [47, -67], [45, -65], [50, -60], [52, -56], [60, -64],
      [64, -52], [60, -45], [72, -40], [76, -20], [71, -8],
      [82, -30], [83, -60], [76, -70], [74, -90], [70, -170]
    ];
    naPoints.forEach(([lat, lng]) => {
      const p = latLngToCanvas(lat, lng);
      ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // South America
    ctx.beginPath();
    const sa = latLngToCanvas(0, -70);
    ctx.moveTo(sa.x, sa.y);
    const saPoints = [
      [12, -71], [10, -75], [5, -77], [0, -80], [-5, -81],
      [-18, -70], [-23, -70], [-27, -71], [-33, -72], [-38, -73],
      [-41, -73], [-45, -74], [-50, -74], [-54, -70], [-55, -67],
      [-54, -64], [-52, -68], [-47, -65], [-41, -63], [-35, -58],
      [-30, -57], [-27, -55], [-23, -54], [-20, -52], [-15, -50],
      [-10, -48], [-5, -45], [-3, -40], [-1, -50], [2, -50],
      [5, -52], [8, -58], [10, -62], [11, -68], [12, -71]
    ];
    saPoints.forEach(([lat, lng]) => {
      const p = latLngToCanvas(lat, lng);
      ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Africa
    ctx.beginPath();
    const af = latLngToCanvas(0, 20);
    ctx.moveTo(af.x, af.y);
    const afPoints = [
      [37, 10], [36, 15], [33, 20], [31, 25], [30, 32],
      [32, 35], [31, 37], [27, 36], [20, 39], [12, 44],
      [11, 51], [5, 47], [0, 49], [-4, 40], [-10, 40],
      [-17, 37], [-22, 35], [-26, 33], [-30, 31], [-34, 26],
      [-34, 18], [-30, 16], [-22, 14], [-16, 12], [-12, 10],
      [-8, 8], [-4, 6], [0, 9], [5, 5], [10, 0],
      [12, -5], [15, -5], [20, -1], [25, 0], [30, 0],
      [32, 5], [35, 5], [37, 10]
    ];
    afPoints.forEach(([lat, lng]) => {
      const p = latLngToCanvas(lat, lng);
      ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Europe
    ctx.beginPath();
    const eu = latLngToCanvas(50, 10);
    ctx.moveTo(eu.x, eu.y);
    const euPoints = [
      [71, 28], [70, 31], [66, 33], [65, 40], [60, 50],
      [55, 55], [50, 40], [45, 40], [42, 42], [40, 40],
      [37, 37], [36, 36], [35, 33], [36, 28], [37, 23],
      [38, 21], [40, 19], [41, 15], [42, 12], [43, 10],
      [44, 7], [43, 0], [46, -1], [48, -3], [50, -5],
      [52, -2], [54, -1], [55, 3], [58, 5], [60, 5],
      [62, 5], [64, 10], [68, 15], [70, 20], [71, 28]
    ];
    euPoints.forEach(([lat, lng]) => {
      const p = latLngToCanvas(lat, lng);
      ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Asia
    ctx.beginPath();
    const asia = latLngToCanvas(30, 100);
    ctx.moveTo(asia.x, asia.y);
    const asiaPoints = [
      [70, 180], [71, 170], [68, 165], [65, 170], [60, 170],
      [55, 165], [50, 155], [45, 150], [43, 145], [40, 140],
      [35, 140], [35, 135], [30, 130], [25, 125], [22, 120],
      [20, 115], [20, 110], [15, 105], [10, 104], [5, 103],
      [1, 100], [0, 98], [2, 95], [5, 93], [8, 88],
      [10, 85], [12, 80], [15, 75], [20, 70], [25, 68],
      [28, 65], [30, 60], [32, 55], [35, 50], [38, 48],
      [40, 45], [42, 42], [45, 40], [50, 40], [55, 45],
      [60, 50], [65, 60], [70, 70], [73, 80], [75, 90],
      [77, 100], [75, 110], [73, 120], [71, 140], [70, 180]
    ];
    asiaPoints.forEach(([lat, lng]) => {
      const p = latLngToCanvas(lat, lng);
      ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Australia
    ctx.beginPath();
    const au = latLngToCanvas(-25, 135);
    ctx.moveTo(au.x, au.y);
    const auPoints = [
      [-10, 142], [-11, 143], [-14, 144], [-17, 146], [-20, 149],
      [-25, 153], [-28, 153], [-32, 152], [-35, 151], [-37, 150],
      [-38, 147], [-38, 145], [-37, 140], [-35, 137], [-32, 135],
      [-28, 132], [-26, 128], [-24, 124], [-22, 121], [-20, 119],
      [-18, 122], [-16, 124], [-14, 127], [-12, 130], [-11, 135],
      [-10, 142]
    ];
    auPoints.forEach(([lat, lng]) => {
      const p = latLngToCanvas(lat, lng);
      ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Add grid lines for debugging
    ctx.strokeStyle = '#4a7a9a';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;

    // Draw latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.needsUpdate = true;
    setTexture(newTexture);

    return () => {
      newTexture.dispose();
    };
  }, []);

  // Show loading state while texture is being created
  if (!texture) {
    return (
      <mesh rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[5, 128, 64]} />
        <meshStandardMaterial
          color="#4a7c9f"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    );
  }

  return (
    <mesh rotation={[0, Math.PI, 0]}>
      <sphereGeometry args={[5, 128, 64]} />
      <meshStandardMaterial
        map={texture}
        color="#ffffff"
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// Complete 3D scene component - all R3F hooks are contained here
function Globe3DScene({
  regions,
  selectedRegion,
  onRegionClick,
  onRegionHover
}: {
  regions: GlobePoint[];
  selectedRegion: RegionHex | null;
  onRegionClick: (region: RegionHex) => void;
  onRegionHover: (region: RegionHex | null) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={30}
        enablePan={false}
      />

      {/* Lighting - brighter for better texture visibility */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={0.9} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#87ceeb" />

      {/* Globe sphere */}
      <GlobeMesh />

      {/* Region markers - only show non-water regions */}
      {regions.filter(p => !p.isWater).map((point, index) => (
        <RegionMarker
          key={index}
          point={point}
          isHovered={hoveredIndex === index}
          onClick={() => onRegionClick(point.region)}
          onHover={(hovered) => {
            setHoveredIndex(hovered ? index : null);
            onRegionHover(hovered ? point.region : null);
          }}
        />
      ))}

      {/* Background stars */}
      <mesh>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial
          color="#000511"
          side={THREE.BackSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
}

/**
 * MAIN COMPONENT - Handles UI and state, no R3F hooks here
 */
const HexWorldGlobe3D: React.FC<HexWorldGlobe3DProps> = ({ isOpen, onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionHex | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionHex | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate area counts for regions
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

  // Build globe points from regional data
  const globePoints = useMemo(() => {
    const regionHexes = buildRegionalMap();

    return regionHexes.map(region => {
      const position = latLngToSphere(region.lat, region.lng);
      const isWater = region.name.includes('Sea') || region.name.includes('Ocean') ||
                     region.name.includes('Bay') || region.name.includes('Strait') ||
                     region.name.includes('Channel') || region.name.includes('Gulf') ||
                     region.name === 'European Waters' || region.name === 'Major Seas and Oceans';

      const getRegionColor = (climate: string, name: string, isWater: boolean): string => {
        if (isWater) return '#1e4a7f';
        if (name === 'Antarctica') return '#e8f5e9';
        if (name === 'Arctic and Subarctic') return '#e1f5fe';

        const colors: { [key: string]: string } = {
          'temperate': '#4a7c59',
          'mediterranean': '#7fb069',
          'arid': '#d4a574',
          'desert': '#c19a6b',
          'tropical': '#2d5016',
          'subtropical': '#3d6a3d',
          'continental': '#5d8055',
          'savanna': '#8bc34a',
          'rainforest': '#1b4332',
          'monsoon': '#00695c',
          'steppe': '#9ccc65',
          'tundra': '#cfd8dc',
          'oceanic': '#4db6ac',
          'arctic': '#e0e7ef',
          'cold': '#b8d4e3'
        };
        return colors[climate.toLowerCase()] || '#4a7c59';
      };

      return {
        position,
        region: {
          ...region,
          areaCount: getRegionAreaCount(region.name)
        },
        color: getRegionColor(region.dominantClimate, region.name, isWater),
        isWater
      };
    });
  }, []);

  // Filter regions based on search
  const filteredPoints = useMemo(() => {
    if (!searchTerm) return globePoints;

    return globePoints.filter(point =>
      point.region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.region.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.region.dominantClimate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [globePoints, searchTerm]);

  const handleRegionClick = useCallback((region: RegionHex) => {
    setSelectedRegion(region);
    console.log('Selected region:', region.name, 'at', region.lat + '°, ' + region.lng + '°');
  }, []);

  const handleRegionHover = useCallback((region: RegionHex | null) => {
    setHoveredRegion(region);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900/95">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-white">World Geography Globe</h2>
            <p className="text-xs text-slate-400">
              Interactive 3D visualization of {globePoints.length} regions • Drag to rotate • Scroll to zoom
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button onClick={onClose} className="ml-3 p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 3D Globe Container */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 50 }}
          style={{ background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)' }}
        >
          <Globe3DScene
            regions={filteredPoints}
            selectedRegion={selectedRegion}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
          />
        </Canvas>

        {/* Info panel */}
        <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">3D Regional Globe</div>
              <div>Click on regions for details</div>
              <div>Drag to rotate • Scroll to zoom</div>
            </div>
          </div>
        </div>

        {/* Hovered region tooltip */}
        {hoveredRegion && (
          <div className="absolute top-4 left-4 bg-slate-800/95 text-white px-3 py-2 rounded-lg text-sm border border-slate-600 pointer-events-none">
            <div className="font-bold">{hoveredRegion.name}</div>
            <div className="text-xs text-slate-300">
              {hoveredRegion.areaCount} areas • {hoveredRegion.dominantClimate}
            </div>
          </div>
        )}

        {/* Selected region details */}
        {selectedRegion && (
          <div className="absolute bottom-4 right-4 bg-slate-800/95 border border-slate-600 rounded-lg p-4 min-w-64">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-white">{selectedRegion.name}</h3>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Cultural Zone:</span>
                <span className="text-emerald-400">{selectedRegion.zone}</span>
              </div>
              <div className="flex justify-between">
                <span>Climate:</span>
                <span className="text-blue-400">{selectedRegion.dominantClimate}</span>
              </div>
              <div className="flex justify-between">
                <span>Areas:</span>
                <span className="text-amber-400">{selectedRegion.areaCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-gray-400">{selectedRegion.lat.toFixed(1)}°, {selectedRegion.lng.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3">
          <div className="text-xs text-slate-300 space-y-1">
            <div className="text-white font-semibold">World Statistics</div>
            <div>Total Regions: <span className="text-emerald-400">{globePoints.length}</span></div>
            <div>Land Regions: <span className="text-green-400">{globePoints.filter(p => !p.isWater).length}</span></div>
            <div>Water Bodies: <span className="text-blue-400">{globePoints.filter(p => p.isWater).length}</span></div>
            {searchTerm && (
              <div>Filtered: <span className="text-yellow-400">{filteredPoints.length}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HexWorldGlobe3D;