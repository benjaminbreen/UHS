/**
 * City Map - Beautiful Interactive Geographic Network Visualization
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CITIES_DATA } from '../constants/gameData/cities';
import { ADJACENCIES } from '../constants/gameData/adjacencies';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import CityDetailPanel from './CityDetailPanel';
import {
  X, ZoomIn, ZoomOut, Compass, Calendar, Play, Pause,
  Map, Hexagon, Info, Navigation, Maximize2, Filter,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home
} from 'lucide-react';

interface CityMapProps {
  isOpen: boolean;
  onClose: () => void;
  currentGameYear?: number; // From game state
  playerLocation?: string; // Current player map area
}

interface CityNode {
  id: string;
  name: string;
  mapArea: string;
  x: number;
  y: number;
  foundingYear: number;
  declineYear?: number;
  zone: string;
  region: string;
  isActive: boolean;
  importance: number;
  urbanDensity: string;
  neighbors: string[];
}

interface MapEdge {
  source: string;
  target: string;
  type: 'land' | 'sea' | 'strait';
}

// Map region names to approximate coordinates [longitude, latitude]
const REGION_COORDINATES: Record<string, [number, number]> = {
  // Europe
  'London': [-0.1276, 51.5074],
  'Paris Basin': [2.3522, 48.8566],
  'Rome': [12.4964, 41.9028],
  'Rhine Valley': [7.5886, 50.1109],
  'Iberian Peninsula': [-3.7038, 40.4168],
  'Scandinavia': [18.0686, 59.3293],
  'Eastern Europe': [21.0122, 52.2297],
  'Greece': [23.7275, 37.9838],

  // North America
  'Eastern Seaboard': [-74.0060, 40.7128],
  'Great Lakes': [-87.6298, 41.8781],
  'Mississippi River': [-90.0715, 29.9511],
  'Southwest': [-112.0740, 33.4484],
  'California Coast': [-118.2437, 34.0522],
  'Pacific Northwest': [-122.3321, 47.6062],

  // South America
  'Amazon Basin': [-60.0217, -3.1190],
  'Andes Mountains': [-71.5430, -33.4489],
  'Pampas': [-58.3816, -34.6037],
  'Caribbean Coast': [-74.7813, 10.9685],

  // Africa
  'North Africa': [3.0588, 36.7538],
  'West Africa': [-1.5247, 12.3714],
  'East Africa': [36.8219, -1.2921],
  'Southern Africa': [28.0473, -26.2041],

  // Middle East
  'Mesopotamia': [44.3661, 33.3152],
  'Levant': [35.2137, 31.7683],
  'Arabian Peninsula': [46.6753, 24.7136],

  // Asia
  'North China Plain': [116.4074, 39.9042],
  'Yangtze River': [121.4737, 31.2304],
  'Ganges River': [78.9629, 20.5937],
  'Deccan Plateau': [78.4867, 17.3850],
  'Southeast Asia': [106.8650, 10.8231],
  'Japan': [139.6503, 35.6762],
  'Central Asia': [71.4389, 51.1694],

  // Oceania
  'Australia': [133.7751, -25.2744],
  'New Zealand': [174.7633, -36.8485],
  'Indonesia': [106.8456, -6.2088],

  // Default fallback
  'default': [0, 0]
};

// Beautiful color palettes for regions
const REGION_COLORS: { [key: string]: { primary: string; secondary: string; glow: string } } = {
  'Europe': { primary: '#4F46E5', secondary: '#6366F1', glow: 'rgba(79, 70, 229, 0.4)' },
  'North America': { primary: '#059669', secondary: '#10B981', glow: 'rgba(5, 150, 105, 0.4)' },
  'South America': { primary: '#DC2626', secondary: '#EF4444', glow: 'rgba(220, 38, 38, 0.4)' },
  'MENA': { primary: '#D97706', secondary: '#F59E0B', glow: 'rgba(217, 119, 6, 0.4)' },
  'Sub Saharan Africa': { primary: '#7C3AED', secondary: '#8B5CF6', glow: 'rgba(124, 58, 237, 0.4)' },
  'South Asia': { primary: '#0891B2', secondary: '#06B6D4', glow: 'rgba(8, 145, 178, 0.4)' },
  'East Asia': { primary: '#DB2777', secondary: '#EC4899', glow: 'rgba(219, 39, 119, 0.4)' },
  'Oceania': { primary: '#EA580C', secondary: '#F97316', glow: 'rgba(234, 88, 12, 0.4)' }
};

const CityMap: React.FC<CityMapProps> = ({
  isOpen,
  onClose,
  currentGameYear = 2024,
  playerLocation
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedCity, setSelectedCity] = useState<CityNode | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityNode | null>(null);
  const [currentYear, setCurrentYear] = useState(currentGameYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'globe' | 'hexgrid'>('globe');
  const [globeRotation, setGlobeRotation] = useState<[number, number, number]>([0, 0, 0]);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [focusedNode, setFocusedNode] = useState<string | null>(playerLocation || null);

  const animationRef = useRef<number>();
  const simulationRef = useRef<d3.Simulation<CityNode, undefined> | null>(null);

  // Process cities into nodes
  const cityNodes = useMemo(() => {
    const nodes: CityNode[] = [];
    const nodeMap: { [key: string]: CityNode } = {};

    // Create nodes from cities
    Object.entries(CITIES_DATA).forEach(([mapArea, cities]) => {
      // Determine region from map area
      let region = 'Europe'; // default
      for (const [zone, zoneData] of Object.entries(GEOGRAPHICAL_DATA)) {
        for (const [subregion, areas] of Object.entries(zoneData)) {
          if (areas && typeof areas === 'object' && mapArea in areas) {
            region = zone;
            break;
          }
        }
      }

      cities.forEach(city => {
        const node: CityNode = {
          id: `${mapArea}-${city.name}`,
          name: city.name,
          mapArea,
          x: 0, // Will be calculated by force simulation
          y: 0,
          foundingYear: city.foundingYear,
          declineYear: city.declineYear,
          zone: region,
          region: mapArea,
          isActive: currentYear >= city.foundingYear && (!city.declineYear || currentYear <= city.declineYear),
          importance: Math.log((city.populationPeak || 10000) / 1000),
          urbanDensity: city.urbanDensity,
          neighbors: []
        };

        nodes.push(node);
        nodeMap[mapArea] = node; // Store by mapArea for adjacency lookup
      });
    });

    // Add neighbor relationships from adjacencies
    Object.entries(ADJACENCIES).forEach(([area, adjacencyData]) => {
      const node = nodeMap[area];
      if (node && adjacencyData) {
        const neighbors = [adjacencyData.N, adjacencyData.S, adjacencyData.E, adjacencyData.W]
          .filter(n => n && !n.startsWith('LIMINAL') && nodeMap[n]);
        node.neighbors = neighbors;
      }
    });

    return nodes;
  }, [currentYear]);

  // Filter nodes based on settings
  const filteredNodes = useMemo(() => {
    return cityNodes.filter(node => {
      if (filterRegion !== 'all' && node.zone !== filterRegion) return false;
      if (showOnlyActive && !node.isActive) return false;
      return true;
    });
  }, [cityNodes, filterRegion, showOnlyActive]);

  // Create edges from adjacencies
  const edges = useMemo(() => {
    const edgeSet = new Set<string>();
    const edgeList: MapEdge[] = [];

    filteredNodes.forEach(node => {
      node.neighbors.forEach(neighbor => {
        const neighborNode = filteredNodes.find(n => n.mapArea === neighbor);
        if (neighborNode) {
          const edgeId = [node.id, neighborNode.id].sort().join('-');
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            edgeList.push({
              source: node.id,
              target: neighborNode.id,
              type: neighbor.includes('Sea') || neighbor.includes('Ocean') ? 'sea' : 'land'
            });
          }
        }
      });
    });

    return edgeList;
  }, [filteredNodes]);

  // Auto-select closest city on load
  useEffect(() => {
    if (!selectedCity && filteredNodes.length > 0) {
      // Select player location city if available, otherwise first city
      const playerCity = filteredNodes.find(n => n.mapArea === playerLocation);
      setSelectedCity(playerCity || filteredNodes[0]);
    }
  }, [filteredNodes.length, playerLocation]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentYear(prev => {
          const next = prev + 10;
          if (next > 2024) {
            setIsPlaying(false);
            return 2024;
          }
          return next;
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

  // Helper function to create hex coordinates in world map shape
  const createHexGrid = useCallback((cities: CityNode[], width: number, height: number) => {
    const hexRadius = 15; // Smaller hexes for more detail
    const hexHeight = Math.sqrt(3) * hexRadius;
    const hexWidth = 2 * hexRadius;

    // Define approximate geographic positions for regions (normalized 0-1)
    const regionPositions: Record<string, { x: number; y: number; spread: number }> = {
      // North America (left-upper)
      'North America': { x: 0.2, y: 0.35, spread: 0.15 },

      // South America (left-lower)
      'South America': { x: 0.25, y: 0.65, spread: 0.1 },

      // Europe (center-upper)
      'Europe': { x: 0.48, y: 0.3, spread: 0.08 },

      // Africa (center)
      'Sub-Saharan Africa': { x: 0.5, y: 0.55, spread: 0.12 },

      // Middle East (center-right)
      'MENA': { x: 0.55, y: 0.4, spread: 0.1 },

      // Asia (right)
      'East Asia': { x: 0.75, y: 0.35, spread: 0.12 },
      'South Asia': { x: 0.65, y: 0.45, spread: 0.1 },

      // Oceania (bottom-right)
      'Oceania': { x: 0.8, y: 0.7, spread: 0.08 }
    };

    // Map cities to their geographic positions
    const hexNodes: (CityNode & { hexX: number; hexY: number })[] = [];

    cities.forEach((city) => {
      const regionPos = regionPositions[city.zone] || { x: 0.5, y: 0.5, spread: 0.1 };

      // Add some random variation within the region to avoid perfect clustering
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * regionPos.spread;

      // Calculate position with some geographic spread
      const baseX = regionPos.x * width;
      const baseY = regionPos.y * height;

      // Snap to hex grid
      const offsetX = Math.cos(angle) * distance * width;
      const offsetY = Math.sin(angle) * distance * height;

      const col = Math.round((baseX + offsetX) / (hexWidth * 0.75));
      const row = Math.round((baseY + offsetY) / hexHeight);

      const hexX = col * hexWidth * 0.75;
      const hexY = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);

      hexNodes.push({
        ...city,
        hexX,
        hexY
      });
    });

    return hexNodes;
  }, []);

  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current || !isOpen || filteredNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous
    svg.selectAll('*').remove();

    // Create container groups
    const g = svg.append('g');

    // Add zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
        setPan({ x: event.transform.x, y: event.transform.y });
      });

    svg.call(zoomBehavior);

    // Beautiful gradient definitions
    const defs = svg.append('defs');

    // Create gradients for each region
    Object.entries(REGION_COLORS).forEach(([region, colors]) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${region.replace(/\s+/g, '-')}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      gradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', colors.secondary)
        .style('stop-opacity', 1);

      gradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', colors.primary)
        .style('stop-opacity', 0.8);

      // Create glow filter
      const filter = defs.append('filter')
        .attr('id', `glow-${region.replace(/\s+/g, '-')}`)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur');

      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // Background pattern
    const pattern = defs.append('pattern')
      .attr('id', 'map-texture')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 200)
      .attr('height', 200);

    pattern.append('rect')
      .attr('width', 200)
      .attr('height', 200)
      .attr('fill', '#0F172A')
      .attr('opacity', 0.05);

    // Apply background
    g.append('rect')
      .attr('x', -width * 2)
      .attr('y', -height * 2)
      .attr('width', width * 4)
      .attr('height', height * 4)
      .attr('fill', 'url(#map-texture)');

    // Render based on view mode
    if (viewMode === 'network') {
      // NETWORK VIEW MODE
      // Initialize node positions by region to create better clustering
      const regionGroups = d3.groups(filteredNodes, d => d.zone);
      const regionCenters: Record<string, { x: number; y: number }> = {};

      // Define region positions on screen
      const regionPositions = [
        { zone: 'Europe', x: width * 0.45, y: height * 0.3 },
        { zone: 'North America', x: width * 0.2, y: height * 0.4 },
        { zone: 'South America', x: width * 0.25, y: height * 0.7 },
        { zone: 'Sub-Saharan Africa', x: width * 0.45, y: height * 0.6 },
        { zone: 'MENA', x: width * 0.55, y: height * 0.45 },
        { zone: 'South Asia', x: width * 0.7, y: height * 0.5 },
        { zone: 'East Asia', x: width * 0.85, y: height * 0.3 },
        { zone: 'Oceania', x: width * 0.8, y: height * 0.7 }
      ];

      regionPositions.forEach(rp => {
        regionCenters[rp.zone] = { x: rp.x, y: rp.y };
      });

      // Initialize nodes around their region centers
      filteredNodes.forEach((node, i) => {
        if (node.x === undefined || node.y === undefined) {
          const center = regionCenters[node.zone] || { x: width / 2, y: height / 2 };
          const angle = Math.random() * Math.PI * 2;
          const radius = 50 + Math.random() * 100;
          node.x = center.x + Math.cos(angle) * radius;
          node.y = center.y + Math.sin(angle) * radius;
        }
      });

      // Filter edges to only include those with both nodes in filteredNodes
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = edges.filter(e =>
        nodeIds.has(typeof e.source === 'string' ? e.source : e.source.id) &&
        nodeIds.has(typeof e.target === 'string' ? e.target : e.target.id)
      );

      // Force simulation with region clustering
      const simulation = d3.forceSimulation(filteredNodes)
        .force('link', d3.forceLink<CityNode, MapEdge>(filteredEdges)
          .id(d => d.id)
          .distance(80)
          .strength(d => {
            // Stronger links for same region
            const source = filteredNodes.find(n => n.id === (d.source as any).id || n.id === d.source);
            const target = filteredNodes.find(n => n.id === (d.target as any).id || n.id === d.target);
            return source?.zone === target?.zone ? 0.5 : 0.1;
          }))
        .force('charge', d3.forceManyBody()
          .strength(d => -50 - (d.importance || 1) * 20)
          .distanceMax(300))
        .force('collision', d3.forceCollide()
          .radius(d => 12 + (d.importance || 1) * 3))
        .force('x', d3.forceX(d => regionCenters[d.zone]?.x || width / 2).strength(0.1))
        .force('y', d3.forceY(d => regionCenters[d.zone]?.y || height / 2).strength(0.1))
        .alphaDecay(0.02)
        .velocityDecay(0.4);

      simulationRef.current = simulation;

      // Draw edges
      const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(filteredEdges)
        .enter()
        .append('line')
        .attr('stroke', '#475569')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 2);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => setSelectedCity(d))
      .on('mouseenter', (event, d) => setHoveredCity(d))
      .on('mouseleave', () => setHoveredCity(null));

    // Node circles with gradient
    node.append('circle')
      .attr('r', d => {
        const baseSize = 8;
        const importanceBonus = (d.importance || 1) * 2;
        const activeBonus = d.isActive ? 2 : 0;
        return baseSize + importanceBonus + activeBonus;
      })
      .attr('fill', d => `url(#gradient-${d.zone.replace(/\s+/g, '-')})`)
      .attr('stroke', d => REGION_COLORS[d.zone]?.primary || '#6B7280')
      .attr('stroke-width', d => d.isActive ? 2 : 1)
      .attr('opacity', d => d.isActive ? 1 : 0.4)
      .attr('filter', d => d.isActive ? `url(#glow-${d.zone.replace(/\s+/g, '-')})` : 'none')
      .transition()
      .duration(1000)
      .attr('opacity', d => {
        if (!d.isActive) return 0.3;
        if (d.id === focusedNode) return 1;
        return 0.8;
      });

      // City labels
      node.append('text')
        .attr('dy', -20)
        .attr('text-anchor', 'middle')
        .text(d => d.name)
        .style('fill', '#FFFFFF')
        .style('font-size', '11px')
        .style('font-weight', d => d.isActive ? 'bold' : 'normal')
        .style('text-shadow', '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)')
        .style('pointer-events', 'none');

      // Update positions on simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as any).x)
          .attr('y1', d => (d.source as any).y)
          .attr('x2', d => (d.target as any).x)
          .attr('y2', d => (d.target as any).y);

          node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
      });

      // Focus on player location if available
      if (focusedNode) {
        const focusNode = filteredNodes.find(n => n.mapArea === focusedNode);
        if (focusNode && focusNode.x !== undefined && focusNode.y !== undefined) {
          setTimeout(() => {
            const transform = d3.zoomIdentity
              .translate(width / 2 - focusNode.x, height / 2 - focusNode.y)
              .scale(1.5);
            svg.transition().duration(750).call(zoomBehavior.transform, transform);
          }, 500);
        }
      }

      return () => {
        simulation.stop();
      };
    } else {
      // HEX GRID VIEW MODE
      const hexNodes = createHexGrid(filteredNodes, width, height);

      // Function to create hexagon path
      const hexPath = (x: number, y: number, r: number) => {
        const angles = [0, 60, 120, 180, 240, 300].map(a => a * Math.PI / 180);
        return angles.map(angle => {
          const px = x + r * Math.cos(angle);
          const py = y + r * Math.sin(angle);
          return `${px},${py}`;
        }).join(' ');
      };

      // Draw continental outlines as visual guides
      const continentOutlines = g.append('g')
        .attr('class', 'continent-outlines')
        .style('opacity', 0.1);

      // Approximate continent shapes (simplified)
      const continents = [
        // North America
        { x: width * 0.15, y: height * 0.25, width: width * 0.2, height: height * 0.25, fill: '#ef4444' },
        // South America
        { x: width * 0.2, y: height * 0.55, width: width * 0.12, height: height * 0.25, fill: '#fb923c' },
        // Europe
        { x: width * 0.43, y: height * 0.22, width: width * 0.12, height: height * 0.15, fill: '#3b82f6' },
        // Africa
        { x: width * 0.45, y: height * 0.4, width: width * 0.15, height: height * 0.3, fill: '#f3f4f6' },
        // Asia
        { x: width * 0.55, y: height * 0.25, width: width * 0.3, height: height * 0.35, fill: '#eab308' },
        // Oceania
        { x: width * 0.75, y: height * 0.65, width: width * 0.15, height: height * 0.15, fill: '#22c55e' }
      ];

      continentOutlines.selectAll('ellipse')
        .data(continents)
        .join('ellipse')
        .attr('cx', d => d.x + d.width / 2)
        .attr('cy', d => d.y + d.height / 2)
        .attr('rx', d => d.width / 2)
        .attr('ry', d => d.height / 2)
        .attr('fill', d => d.fill)
        .style('opacity', 0.05);

      // Draw hexagons
      const hexGroup = g.append('g')
        .selectAll('g')
        .data(hexNodes)
        .join('g')
        .attr('transform', d => `translate(${d.hexX},${d.hexY})`)
        .attr('cursor', 'pointer')
        .on('click', (event, d) => setSelectedCity(d))
        .on('mouseenter', (event, d) => setHoveredCity(d))
        .on('mouseleave', () => setHoveredCity(null));

      // Main hexagon (smaller for world map effect)
      hexGroup.append('polygon')
        .attr('points', d => hexPath(0, 0, 14))
        .attr('fill', d => {
          const color = REGION_COLORS[d.zone]?.primary || '#64748B';
          return d.isActive ? color : '#475569';
        })
        .attr('stroke', d => {
          const color = REGION_COLORS[d.zone]?.secondary || '#94A3B8';
          return d.isActive ? color : '#64748B';
        })
        .attr('stroke-width', 2)
        .style('filter', d => d.isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none')
        .style('opacity', d => d.isActive ? 1 : 0.4);

      // City names - only show for important cities at this zoom level
      hexGroup
        .filter(d => d.importance > 2)
        .append('text')
        .text(d => d.name)
        .attr('text-anchor', 'middle')
        .attr('y', 3)
        .attr('fill', 'white')
        .attr('font-size', 8)
        .attr('font-weight', 'bold')
        .style('text-shadow', '0 0 3px rgba(0,0,0,0.9)')
        .style('pointer-events', 'none');

      // Add importance indicator as inner circle for major cities
      hexGroup
        .filter(d => d.importance > 3)
        .append('circle')
        .attr('r', 3)
        .attr('fill', 'white')
        .style('opacity', 0.8);

      // Center on player location for hex grid
      if (focusedNode) {
        const focusNode = hexNodes.find(n => n.mapArea === focusedNode);
        if (focusNode) {
          setTimeout(() => {
            const transform = d3.zoomIdentity
              .translate(width / 2 - focusNode.hexX, height / 2 - focusNode.hexY)
              .scale(1.5);
            svg.transition().duration(750).call(zoomBehavior.transform, transform);
          }, 500);
        }
      }
    }
  }, [filteredNodes, edges, isOpen, zoom, focusedNode, viewMode, createHexGrid]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedCity) {
        const neighbors = filteredNodes.filter(n =>
          selectedCity.neighbors.includes(n.mapArea) ||
          n.neighbors.includes(selectedCity.mapArea)
        );

        switch(e.key) {
          case 'ArrowUp':
            const northNeighbor = neighbors.sort((a, b) => a.y - b.y)[0];
            if (northNeighbor) setSelectedCity(northNeighbor);
            break;
          case 'ArrowDown':
            const southNeighbor = neighbors.sort((a, b) => b.y - a.y)[0];
            if (southNeighbor) setSelectedCity(southNeighbor);
            break;
          case 'ArrowLeft':
            const westNeighbor = neighbors.sort((a, b) => a.x - b.x)[0];
            if (westNeighbor) setSelectedCity(westNeighbor);
            break;
          case 'ArrowRight':
            const eastNeighbor = neighbors.sort((a, b) => b.x - a.x)[0];
            if (eastNeighbor) setSelectedCity(eastNeighbor);
            break;
          case 'Escape':
            setSelectedCity(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCity, filteredNodes, isOpen]);

  // Handle zoom controls
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(4, prev + delta)));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCurrentYear(currentGameYear);
    setFilterRegion('all');
    setShowOnlyActive(false);
  }, [currentGameYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-[98vw] h-[95vh] flex flex-col border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-700/50">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              City Map
            </h2>
            <div className="text-slate-400">
              <span className="text-white font-bold">{filteredNodes.filter(n => n.isActive).length}</span> active cities
              in <span className="text-white font-bold">{currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View mode toggle */}
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('globe')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  viewMode === 'globe'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-4 h-4" />
                Globe
              </button>
              <button
                onClick={() => setViewMode('hexgrid')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  viewMode === 'hexgrid'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Hexagon className="w-4 h-4" />
                Hex Grid
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-8 py-4 border-b border-slate-700/50 flex items-center gap-6 bg-slate-800/30">

          {/* Region Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-600/50 text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">All Regions</option>
              {Object.keys(REGION_COLORS).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Active filter */}
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Only active cities</span>
          </label>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-slate-300" />
            </button>
            <span className="text-slate-400 text-sm w-16 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors ml-2"
            >
              <Home className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Time controls */}
          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                isPlaying
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <input
              type="range"
              min={-3000}
              max={2024}
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="w-64 accent-blue-500"
            />

            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-white font-mono font-semibold min-w-[100px] text-center">
                {currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}
              </span>
            </div>
          </div>
        </div>

        {/* Main Visualization */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />

          {/* Hover Info */}
          {hoveredCity && !selectedCity && (
            <div className="absolute top-6 left-6 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-xl max-w-sm pointer-events-none">
              <h3 className="text-lg font-bold text-white mb-2">
                {hoveredCity.name}
              </h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Region:</span>
                  <span className="text-white">{hoveredCity.mapArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Founded:</span>
                  <span className="text-white">
                    {hoveredCity.foundingYear < 0
                      ? `${Math.abs(hoveredCity.foundingYear)} BCE`
                      : `${hoveredCity.foundingYear} CE`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={hoveredCity.isActive ? 'text-green-400' : 'text-red-400'}>
                    {hoveredCity.isActive ? 'Active' : 'Historical'}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Click to view details
              </div>
            </div>
          )}

          {/* Navigation hint */}
          {selectedCity && (
            <div className="absolute bottom-6 left-6 bg-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3 text-sm">
                <Navigation className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">Use arrow keys to navigate to neighboring cities</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 right-6 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-xl">
            <h4 className="text-white font-semibold mb-3 text-sm">Regions</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(REGION_COLORS).slice(0, 6).map(([region, colors]) => (
                <div key={region} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <span className="text-slate-300">{region}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* City Detail Panel */}
        {selectedCity && (
          <CityDetailPanel
            cityName={selectedCity.name}
            mapArea={selectedCity.mapArea}
            foundingYear={selectedCity.foundingYear}
            declineYear={selectedCity.declineYear}
            region={selectedCity.zone}
            onClose={() => setSelectedCity(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CityMap;