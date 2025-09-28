/**
 * Interactive Trade Network Globe - "Silk Roads of the World"
 * Optimized 3D globe showing cities and trade routes through history
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CITIES_DATA as CITIES } from '../constants/gameData/cities';
import {
  X, ZoomIn, ZoomOut, Play, Pause, RotateCw, Search,
  Globe2, Package, Ship, MapPin, Activity, RefreshCw
} from 'lucide-react';

interface TradeNetworkGlobeProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: number;
}

interface CityNode {
  name: string;
  mapArea: string;
  lat: number;
  lng: number;
  foundingYear: number;
  declineYear?: number;
  culturalZone: string;
}

interface TradeRoute {
  source: string;
  target: string;
  goods: string[];
  importance: number;
  type: 'land' | 'sea';
  activeYears: [number, number];
}

// Major city coordinates (expanded list)
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Europe
  'Rome': [41.9, 12.5],
  'Constantinople': [41.0, 28.95],
  'Athens': [37.98, 23.73],
  'Venice': [45.44, 12.32],
  'Milan': [45.46, 9.19],
  'Paris': [48.86, 2.35],
  'London': [51.51, -0.13],
  'Madrid': [40.42, -3.70],
  'Lisbon': [38.72, -9.14],
  'Vienna': [48.21, 16.37],
  'Amsterdam': [52.37, 4.90],
  'Copenhagen': [55.68, 12.57],
  'Stockholm': [59.33, 18.07],
  'Dublin': [53.35, -6.26],
  'Warsaw': [52.23, 21.01],
  'Kiev': [50.45, 30.52],
  'Moscow': [55.75, 37.62],
  'Seville': [37.39, -5.98],

  // Asia
  'Beijing': [39.90, 116.41],
  'Xi\'an': [34.27, 108.90],
  'Nanjing': [32.06, 118.80],
  'Shanghai': [31.23, 121.47],
  'Guangzhou': [23.13, 113.26],
  'Kyoto': [35.01, 135.77],
  'Tokyo': [35.68, 139.69],
  'Seoul': [37.57, 126.98],
  'Delhi': [28.61, 77.21],
  'Varanasi': [25.32, 82.97],
  'Mumbai': [19.08, 72.88],
  'Isfahan': [32.65, 51.67],
  'Baghdad': [33.31, 44.36],
  'Damascus': [33.51, 36.31],
  'Jerusalem': [31.78, 35.23],
  'Mecca': [21.43, 39.83],
  'Cairo': [30.04, 31.24],
  'Alexandria': [31.20, 29.92],
  'Babylon': [32.54, 44.42],
  'Persepolis': [29.93, 52.89],
  'Samarkand': [39.66, 66.98],
  'Bangkok': [13.75, 100.50],

  // Americas
  'Mexico City': [19.43, -99.13],
  'Tenochtitlan': [19.43, -99.13],
  'Cusco': [13.52, -71.97],
  'Lima': [-12.05, -77.04],
  'Montreal': [45.50, -73.57],
  'New York': [40.71, -74.01],
  'Philadelphia': [39.95, -75.16],
  'Boston': [42.36, -71.06],
  'Havana': [23.11, -82.37],

  // Africa & Oceania
  'Timbuktu': [16.78, -3.01],
  'Cape Town': [-33.92, 18.42],
  'Sydney': [-33.87, 151.21]
};

// Historical trade routes
const TRADE_ROUTES: TradeRoute[] = [
  // Silk Road routes
  { source: 'Xi\'an', target: 'Samarkand', goods: ['silk', 'porcelain'], importance: 10, type: 'land', activeYears: [-200, 1500] },
  { source: 'Samarkand', target: 'Baghdad', goods: ['silk', 'spices'], importance: 9, type: 'land', activeYears: [-200, 1500] },
  { source: 'Baghdad', target: 'Damascus', goods: ['silk', 'spices'], importance: 8, type: 'land', activeYears: [-200, 1500] },
  { source: 'Damascus', target: 'Constantinople', goods: ['silk', 'spices'], importance: 8, type: 'land', activeYears: [300, 1453] },
  { source: 'Constantinople', target: 'Venice', goods: ['silk', 'spices'], importance: 9, type: 'sea', activeYears: [800, 1500] },

  // Maritime Spice Routes
  { source: 'Venice', target: 'Alexandria', goods: ['textiles', 'glass'], importance: 8, type: 'sea', activeYears: [1000, 1600] },
  { source: 'Alexandria', target: 'Cairo', goods: ['spices', 'gold'], importance: 7, type: 'land', activeYears: [-300, 1800] },
  { source: 'Cairo', target: 'Mecca', goods: ['textiles', 'grains'], importance: 6, type: 'land', activeYears: [600, 2024] },

  // Indian Ocean Trade
  { source: 'Mumbai', target: 'Cairo', goods: ['spices', 'textiles'], importance: 7, type: 'sea', activeYears: [0, 1800] },
  { source: 'Guangzhou', target: 'Mumbai', goods: ['porcelain', 'silk'], importance: 8, type: 'sea', activeYears: [100, 2024] },

  // Trans-Saharan
  { source: 'Timbuktu', target: 'Cairo', goods: ['gold', 'salt'], importance: 6, type: 'land', activeYears: [800, 1600] },

  // Atlantic Trade
  { source: 'Lisbon', target: 'Mumbai', goods: ['silver', 'spices'], importance: 8, type: 'sea', activeYears: [1500, 1900] },
  { source: 'Seville', target: 'Havana', goods: ['silver', 'sugar'], importance: 9, type: 'sea', activeYears: [1500, 1800] },
  { source: 'London', target: 'New York', goods: ['manufactures', 'cotton'], importance: 9, type: 'sea', activeYears: [1600, 2024] },

  // Mediterranean Trade
  { source: 'Rome', target: 'Athens', goods: ['wine', 'olive oil'], importance: 7, type: 'sea', activeYears: [-500, 500] },
  { source: 'Athens', target: 'Alexandria', goods: ['pottery', 'marble'], importance: 6, type: 'sea', activeYears: [-500, 500] },

  // Northern European Trade
  { source: 'London', target: 'Amsterdam', goods: ['wool', 'grain'], importance: 7, type: 'sea', activeYears: [1200, 2024] },
  { source: 'Stockholm', target: 'Copenhagen', goods: ['timber', 'iron'], importance: 6, type: 'sea', activeYears: [1000, 2024] },
];

const CULTURAL_COLORS: Record<string, string> = {
  'EUROPEAN': '#60a5fa',
  'EAST_ASIAN': '#f87171',
  'MENA': '#fbbf24',
  'SOUTH_ASIAN': '#a78bfa',
  'SUB_SAHARAN_AFRICAN': '#34d399',
  'NORTH_AMERICAN': '#67e8f9',
  'SOUTH_AMERICAN': '#f9a8d4',
  'OCEANIA': '#fdba74'
};

const TradeNetworkGlobe: React.FC<TradeNetworkGlobeProps> = ({ isOpen, onClose, initialYear = 1500 }) => {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [viewMode, setViewMode] = useState<'globe' | 'map'>('globe');
  const [selectedCity, setSelectedCity] = useState<CityNode | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSeaRoutes, setShowSeaRoutes] = useState(true);
  const [showLandRoutes, setShowLandRoutes] = useState(true);
  const [rotation, setRotation] = useState<[number, number, number]>([-30, 0, 0]);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();
  const globeRef = useRef<any>(null);
  const worldDataRef = useRef<any>(null);

  // Process city data
  const cityNodes = useMemo(() => {
    const nodes: CityNode[] = [];
    Object.entries(CITIES).forEach(([mapArea, cities]) => {
      cities.forEach(city => {
        const coords = CITY_COORDINATES[city.name];
        if (coords) {
          let culturalZone = 'EUROPEAN';
          if (mapArea.match(/China|Japan|Korea|Mongolia|Tibet/)) {
            culturalZone = 'EAST_ASIAN';
          } else if (mapArea.match(/India|Bengal|Punjab|Ceylon/)) {
            culturalZone = 'SOUTH_ASIAN';
          } else if (mapArea.match(/Arabia|Egypt|Persia|Turkey|Syria|Iraq|Iran/)) {
            culturalZone = 'MENA';
          } else if (mapArea.match(/Africa|Ethiopia|Mali|Zimbabwe/)) {
            culturalZone = 'SUB_SAHARAN_AFRICAN';
          } else if (mapArea.match(/Mexico|Maya|Aztec/)) {
            culturalZone = 'NORTH_AMERICAN';
          } else if (mapArea.match(/Peru|Inca|Brazil|Chile/)) {
            culturalZone = 'SOUTH_AMERICAN';
          } else if (mapArea.match(/Australia|Zealand|Pacific/)) {
            culturalZone = 'OCEANIA';
          }

          nodes.push({
            name: city.name,
            mapArea,
            lat: coords[0],
            lng: coords[1],
            foundingYear: city.foundingYear,
            declineYear: city.declineYear,
            culturalZone
          });
        }
      });
    });
    return nodes;
  }, []);

  // Filter active cities and routes
  const activeCities = useMemo(() => {
    return cityNodes.filter(city =>
      currentYear >= city.foundingYear &&
      (!city.declineYear || currentYear <= city.declineYear) &&
      (!searchQuery || city.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [cityNodes, currentYear, searchQuery]);

  const activeRoutes = useMemo(() => {
    return TRADE_ROUTES.filter(route =>
      currentYear >= route.activeYears[0] &&
      currentYear <= route.activeYears[1] &&
      ((route.type === 'sea' && showSeaRoutes) || (route.type === 'land' && showLandRoutes)) &&
      activeCities.some(c => c.name === route.source) &&
      activeCities.some(c => c.name === route.target)
    );
  }, [currentYear, showSeaRoutes, showLandRoutes, activeCities]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentYear(prev => {
          const next = prev + 20;
          return next > 2024 ? -1000 : next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Globe rotation
  useEffect(() => {
    if (isRotating && viewMode === 'globe') {
      const interval = setInterval(() => {
        setRotation(prev => [(prev[0] + 0.3) % 360, prev[1], prev[2]]);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRotating, viewMode]);

  // Load world data once
  useEffect(() => {
    if (!worldDataRef.current) {
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(data => {
        worldDataRef.current = data;
      });
    }
  }, []);

  // D3 Visualization (optimized)
  useEffect(() => {
    if (!isOpen || !svgRef.current || !worldDataRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create projection with zoom
    const baseScale = viewMode === 'globe' ? 0.35 : 0.16;
    const projection = viewMode === 'globe'
      ? d3.geoOrthographic()
          .scale(Math.min(width, height) * baseScale * zoom)
          .translate([width / 2, height / 2])
          .rotate(rotation)
          .clipAngle(90)
      : d3.geoNaturalEarth1()
          .scale(Math.min(width, height) * baseScale * zoom)
          .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule();

    // Create main group
    const g = svg.append('g');

    // Background
    if (viewMode === 'globe') {
      // Globe background
      g.append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', Math.min(width, height) * 0.35 * zoom)
        .attr('fill', '#0a0f1b')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2);

      // Add glow effect
      const defs = svg.append('defs');
      const filter = defs.append('filter')
        .attr('id', 'glow');
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // Graticule
    g.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Countries
    const countries = topojson.feature(worldDataRef.current, worldDataRef.current.objects.countries) as any;

    g.append('g')
      .selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', '#1e293b')
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9);

    // Trade routes (without animation for performance)
    const routesGroup = g.append('g').attr('class', 'routes');

    activeRoutes.forEach(route => {
      const sourceCity = activeCities.find(c => c.name === route.source);
      const targetCity = activeCities.find(c => c.name === route.target);

      if (!sourceCity || !targetCity) return;

      // Use great circle path for globe view
      if (viewMode === 'globe') {
        const source = [sourceCity.lng, sourceCity.lat];
        const target = [targetCity.lng, targetCity.lat];

        // Create interpolated points for smooth curve
        const interpolate = d3.geoInterpolate(source, target);
        const points = [];
        for (let t = 0; t <= 1; t += 0.05) {
          points.push(interpolate(t));
        }

        const lineGenerator = d3.geoPath()
          .projection(projection);

        const greatCircle = {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: points
          },
          properties: {}
        };

        routesGroup.append('path')
          .datum(greatCircle)
          .attr('d', lineGenerator)
          .attr('fill', 'none')
          .attr('stroke', route.type === 'sea' ? '#06b6d4' : '#f59e0b')
          .attr('stroke-width', Math.sqrt(route.importance) * 0.5)
          .attr('opacity', 0.6)
          .attr('stroke-dasharray', route.type === 'land' ? '3,2' : 'none');
      } else {
        // Simple lines for map view
        const sourcePoint = projection([sourceCity.lng, sourceCity.lat]);
        const targetPoint = projection([targetCity.lng, targetCity.lat]);

        if (sourcePoint && targetPoint) {
          routesGroup.append('line')
            .attr('x1', sourcePoint[0])
            .attr('y1', sourcePoint[1])
            .attr('x2', targetPoint[0])
            .attr('y2', targetPoint[1])
            .attr('stroke', route.type === 'sea' ? '#06b6d4' : '#f59e0b')
            .attr('stroke-width', Math.sqrt(route.importance) * 0.5)
            .attr('opacity', 0.6)
            .attr('stroke-dasharray', route.type === 'land' ? '3,2' : 'none');
        }
      }
    });

    // City nodes
    const citiesGroup = g.append('g').attr('class', 'cities');

    activeCities.forEach(city => {
      const coords = projection([city.lng, city.lat]);

      if (!coords || (viewMode === 'globe' && d3.geoDistance([city.lng, city.lat], [-rotation[0], -rotation[1]]) > Math.PI / 2)) {
        return; // Skip cities on the back of the globe
      }

      const cityGroup = citiesGroup.append('g')
        .style('cursor', 'pointer');

      // City dot
      cityGroup.append('circle')
        .attr('cx', coords[0])
        .attr('cy', coords[1])
        .attr('r', hoveredCity === city.name ? 6 : 4)
        .attr('fill', CULTURAL_COLORS[city.culturalZone])
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)
        .on('mouseenter', () => setHoveredCity(city.name))
        .on('mouseleave', () => setHoveredCity(null))
        .on('click', () => setSelectedCity(city));

      // City label (only for hovered or major cities)
      if (hoveredCity === city.name || ['Rome', 'Constantinople', 'Beijing', 'Baghdad', 'Cairo'].includes(city.name)) {
        const label = cityGroup.append('g');

        const text = city.name;
        const textWidth = text.length * 6;

        label.append('rect')
          .attr('x', coords[0] - textWidth / 2 - 3)
          .attr('y', coords[1] - 20)
          .attr('width', textWidth + 6)
          .attr('height', 16)
          .attr('fill', '#0f172a')
          .attr('opacity', 0.9)
          .attr('rx', 2);

        label.append('text')
          .attr('x', coords[0])
          .attr('y', coords[1] - 8)
          .attr('fill', '#f1f5f9')
          .attr('font-size', '11px')
          .attr('font-weight', hoveredCity === city.name ? 'bold' : 'normal')
          .attr('text-anchor', 'middle')
          .text(city.name);
      }
    });

    globeRef.current = { projection, g };

  }, [isOpen, viewMode, rotation, activeCities, activeRoutes, hoveredCity, zoom, worldDataRef.current]);

  // Handle drag rotation and mouse wheel zoom
  useEffect(() => {
    if (!svgRef.current || !globeRef.current) return;

    const svg = d3.select(svgRef.current);

    // Drag for rotation (globe only)
    if (viewMode === 'globe') {
      const drag = d3.drag()
        .on('start', () => {
          setIsRotating(false);
          setIsDragging(true);
        })
        .on('drag', (event) => {
          const sensitivity = 0.5 / zoom; // Adjust sensitivity based on zoom
          setRotation(prev => [
            prev[0] + event.dx * sensitivity,
            Math.max(-90, Math.min(90, prev[1] - event.dy * sensitivity)),
            prev[2]
          ]);
        })
        .on('end', () => {
          setIsDragging(false);
        });

      svg.call(drag as any);
    }

    // Mouse wheel for zoom
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = -event.deltaY * 0.002;
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const element = svgRef.current;
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.on('.drag', null);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [viewMode, zoom]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-b border-cyan-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Globe2 className="w-8 h-8 text-cyan-500" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-500">Silk Roads of the World</h1>
              <p className="text-sm text-slate-400">Trade networks and city connections through history</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 rounded-lg text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLandRoutes(!showLandRoutes)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showLandRoutes ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1" />
              Overland
            </button>
            <button
              onClick={() => setShowSeaRoutes(!showSeaRoutes)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSeaRoutes ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Ship className="w-4 h-4 inline mr-1" />
              Maritime
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium min-w-[45px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setViewMode(viewMode === 'globe' ? 'map' : 'globe')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              {viewMode === 'globe' ? 'Map' : 'Globe'}
            </button>
            {viewMode === 'globe' && (
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`p-2 rounded-lg transition-colors ${
                  isRotating ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
                title={isRotating ? 'Stop rotation' : 'Auto rotate'}
              >
                <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-2 bg-gradient-to-r from-slate-800/30 to-slate-900/30 border-b border-slate-800">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-500" />
            <span className="text-slate-400">Active Cities:</span>
            <span className="font-bold text-cyan-500">{activeCities.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <span className="text-slate-400">Trade Routes:</span>
            <span className="font-bold text-orange-500">{activeRoutes.length}</span>
          </div>
          <div className="ml-auto">
            <span className="text-slate-400">Year: </span>
            <span className="font-bold text-amber-500">
              {currentYear > 0 ? `${currentYear} CE` : `${Math.abs(currentYear)} BCE`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: isDragging ? 'grabbing' : viewMode === 'globe' ? 'grab' : 'default' }}
        />

        {/* Legend and Controls Info */}
        <div className="absolute top-4 left-4 space-y-3">
          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">Trade Routes</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-cyan-500" />
                <span className="text-xs text-slate-400">Maritime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-orange-500" style={{ borderBottom: '2px dashed #f59e0b' }} />
                <span className="text-xs text-slate-400">Overland</span>
              </div>
            </div>
          </div>

          {viewMode === 'globe' && (
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Controls</h3>
              <div className="space-y-1 text-xs text-slate-500">
                <p>🖱️ Drag to rotate</p>
                <p>🔍 Scroll to zoom</p>
                <p>🔄 Auto-rotate toggle</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected City Info */}
        {selectedCity && (
          <div className="absolute top-4 right-4 p-4 bg-slate-900/95 rounded-lg border border-slate-700 max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ color: CULTURAL_COLORS[selectedCity.culturalZone] }}>
              {selectedCity.name}
            </h3>
            <div className="space-y-1 text-sm text-slate-400">
              <p>📍 {selectedCity.mapArea}</p>
              <p>📅 Founded: {selectedCity.foundingYear > 0 ? `${selectedCity.foundingYear} CE` : `${Math.abs(selectedCity.foundingYear)} BCE`}</p>
              {selectedCity.declineYear && (
                <p>📉 Declined: {selectedCity.declineYear > 0 ? `${selectedCity.declineYear} CE` : `${Math.abs(selectedCity.declineYear)} BCE`}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="px-6 py-4 bg-gradient-to-t from-slate-950 to-slate-900/50 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg transition-all transform hover:scale-105"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="-1000"
              max="2024"
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((currentYear + 1000) / 3024) * 100}%, #475569 ${((currentYear + 1000) / 3024) * 100}%, #475569 100%)`
              }}
            />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>1000 BCE</span>
              <span>1 CE</span>
              <span>1000 CE</span>
              <span>1500 CE</span>
              <span>2024 CE</span>
            </div>
          </div>

          <div className="px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-800/30">
            <div className="text-xs text-cyan-600 font-medium">Current Year</div>
            <div className="text-lg font-bold text-cyan-500">
              {currentYear > 0 ? `${currentYear} CE` : `${Math.abs(currentYear)} BCE`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeNetworkGlobe;