/**
 * HexWorldGlobe - 3D globe visualization with regional geography
 * Based on Silk Roads component but using our improved regional data
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { buildRegionalMap, RegionHex } from '../utils/regionalGeography';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { X, Globe, Info, ZoomIn, ZoomOut, RotateCcw, Search } from 'lucide-react';

interface HexWorldGlobeProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GlobePoint {
  position: THREE.Vector3;
  region: RegionHex;
  color: string;
  isWater: boolean;
}

// Convert lat/lng to 3D sphere coordinates
function latLngToSphere(lat: number, lng: number, radius: number = 5): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Globe with regions - must be used inside Canvas
function Globe({ regions, onRegionClick, hoveredRegion, setHoveredRegion }: {
  regions: GlobePoint[];
  onRegionClick: (region: RegionHex) => void;
  hoveredRegion: RegionHex | null;
  setHoveredRegion: (region: RegionHex | null) => void;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  const [textureError, setTextureError] = useState(false);

  // Get Three.js context - this must be inside Canvas
  const { camera, raycaster } = useThree();

  // Load Earth texture using THREE.TextureLoader directly (not in useEffect)
  console.log('[Globe] Component rendering');

  const globeTexture = useMemo(() => {
    console.log('[Globe] Loading Earth texture...');
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      '/8081_earthmap2k.jpg',
      (loadedTexture) => {
        console.log('[Globe] Successfully loaded Earth texture!');
      },
      (progress) => {
        if (progress.total > 0) {
          console.log('[Globe] Loading:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
        }
      },
      (error) => {
        console.error('[Globe] Failed to load Earth texture:', error);
        setTextureError(true);
      }
    );

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return texture;
  }, []);

  // Handle mouse interactions
  const handlePointerMove = useCallback((event: any) => {
    const rect = event.target.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check intersection with region points
    let foundRegion: RegionHex | null = null;
    regions.forEach(point => {
      const distance = raycaster.ray.distanceToPoint(point.position);
      if (distance < 0.3) {
        foundRegion = point.region;
      }
    });

    setHoveredRegion(foundRegion);
  }, [raycaster, camera, regions, setHoveredRegion]);

  const handleClick = useCallback((event: any) => {
    if (hoveredRegion) {
      onRegionClick(hoveredRegion);
    }
  }, [hoveredRegion, onRegionClick]);

  return (
    <group>
      {/* Main globe */}
      <mesh
        ref={globeRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <sphereGeometry args={[5, 64, 32]} />
        {globeTexture ? (
          <meshBasicMaterial
            map={globeTexture}
          />
        ) : (
          <meshBasicMaterial
            color="#1a4d7a"
          />
        )}
      </mesh>

      {/* Region points */}
      {regions.map((point, index) => (
        <group key={index} position={point.position}>
          {/* Region marker */}
          <mesh>
            <sphereGeometry args={[
              hoveredRegion === point.region ? 0.15 : 0.08,
              16, 16
            ]} />
            <meshStandardMaterial
              color={hoveredRegion === point.region ? '#ffd700' : point.color}
              emissive={hoveredRegion === point.region ? '#ffa500' : '#000000'}
              emissiveIntensity={hoveredRegion === point.region ? 0.3 : 0}
            />
          </mesh>

          {/* Region label for hovered region */}
          {hoveredRegion === point.region && (
            <Html distanceFactor={15} position={[0, 0.3, 0]}>
              <div className="bg-slate-800/95 text-white px-3 py-2 rounded-lg text-sm border border-slate-600 pointer-events-none">
                <div className="font-bold">{point.region.name}</div>
                <div className="text-xs text-slate-300">
                  {point.region.areaCount} areas • {point.region.dominantClimate}
                </div>
              </div>
            </Html>
          )}
        </group>
      ))}

      {/* Lighting - balanced to not wash out texture */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.4}
        castShadow
      />
      <pointLight position={[-10, -10, -5]} intensity={0.2} color="#4facfe" />
    </group>
  );
}

// Scene content component - contains all 3D objects
function SceneContent({ regions, onRegionClick }: {
  regions: GlobePoint[];
  onRegionClick: (region: RegionHex) => void;
}) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionHex | null>(null);
  const controlsRef = useRef<any>(null);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={30}
        enablePan={false}
      />

      <Globe
        regions={regions}
        onRegionClick={onRegionClick}
        hoveredRegion={hoveredRegion}
        setHoveredRegion={setHoveredRegion}
      />

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

// Main component
const HexWorldGlobe: React.FC<HexWorldGlobeProps> = ({ isOpen, onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionHex | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Build globe points from regional data
  const globePoints = useMemo(() => {
    const regionHexes = buildRegionalMap();

    return regionHexes.map(region => {
      const position = latLngToSphere(region.lat, region.lng);
      const isWater = region.name.includes('Sea') || region.name.includes('Ocean') ||
                     region.name.includes('Bay') || region.name.includes('Strait') ||
                     region.name.includes('Channel') || region.name.includes('Gulf') ||
                     region.name === 'European Waters' || region.name === 'Major Seas and Oceans';

      // Enhanced color scheme
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
    // You could extend this to show a detail modal or navigate to region view
    console.log('Selected region:', region);
  }, []);

  const resetView = useCallback(() => {
    // Reset functionality removed as controls are now inside Canvas
    console.log('Reset view');
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

          {/* Controls */}
          <button
            onClick={resetView}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>

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
          <SceneContent
            regions={filteredPoints}
            onRegionClick={handleRegionClick}
          />
        </Canvas>

        {/* Info panel */}
        <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">3D Regional Globe</div>
              <div>Regions positioned by real-world coordinates</div>
              <div>Drag to rotate • Scroll to zoom • Hover for details</div>
              <div>Colors represent dominant climate zones</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3">
          <div className="text-xs text-white font-semibold mb-2">Climate Zones</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[
              { climate: 'Tropical', color: '#2d5016' },
              { climate: 'Arid', color: '#d4a574' },
              { climate: 'Temperate', color: '#4a7c59' },
              { climate: 'Continental', color: '#5d8055' },
              { climate: 'Arctic', color: '#e0e7ef' },
              { climate: 'Oceanic', color: '#1e4a7f' }
            ].map(({ climate, color }) => (
              <div key={climate} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300">{climate}</span>
              </div>
            ))}
          </div>
        </div>

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
        <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg p-3">
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

export default HexWorldGlobe;