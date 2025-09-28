/**
 * Chronicle of Civilizations - Beautiful Interactive Timeline
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { CITIES_DATA as CITIES } from '../constants/gameData/cities';
import { X, Search, Filter, Play, Pause, SkipForward, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import CityDetailPanel from './CityDetailPanel';

interface CityTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: number;
}

interface ProcessedCity {
  name: string;
  mapArea: string;
  foundingYear: number;
  declineYear: number;
  region: string;
  importance: number;
}

// Beautiful color palette
const REGIONS: { [key: string]: { color: string; name: string; gradient: string } } = {
  europe: {
    color: '#3B82F6',
    name: 'Europe',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
  },
  eastAsia: {
    color: '#EF4444',
    name: 'East Asia',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
  },
  middleEast: {
    color: '#F59E0B',
    name: 'Middle East',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  },
  southAsia: {
    color: '#10B981',
    name: 'South Asia',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  },
  africa: {
    color: '#8B5CF6',
    name: 'Africa',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
  },
  americas: {
    color: '#F97316',
    name: 'Americas',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
  },
  oceania: {
    color: '#EC4899',
    name: 'Oceania',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
  }
};

function getRegion(mapArea: string): string {
  const area = mapArea.toLowerCase();

  if (area.includes('europe') || area.includes('britain') || area.includes('france') ||
      area.includes('spain') || area.includes('italy') || area.includes('germany') ||
      area.includes('greece') || area.includes('rome') || area.includes('scandinavia')) {
    return 'europe';
  }
  if (area.includes('china') || area.includes('japan') || area.includes('korea') ||
      area.includes('vietnam') || area.includes('mongol')) {
    return 'eastAsia';
  }
  if (area.includes('egypt') || area.includes('arabia') || area.includes('mesopotamia') ||
      area.includes('babylon') || area.includes('persia') || area.includes('anatolia') ||
      area.includes('levant') || area.includes('fars')) {
    return 'middleEast';
  }
  if (area.includes('india') || area.includes('bengal') || area.includes('ganges') ||
      area.includes('deccan') || area.includes('punjab')) {
    return 'southAsia';
  }
  if (area.includes('africa') || area.includes('mali') || area.includes('ethiopia') ||
      area.includes('sudan') || area.includes('sahara')) {
    return 'africa';
  }
  if (area.includes('america') || area.includes('maya') || area.includes('aztec') ||
      area.includes('inca') || area.includes('andes') || area.includes('mexico')) {
    return 'americas';
  }
  if (area.includes('oceania') || area.includes('australia') || area.includes('java') ||
      area.includes('sydney') || area.includes('philippines')) {
    return 'oceania';
  }

  return 'europe';
}

const CityTimeline: React.FC<CityTimelineProps> = ({ isOpen, onClose }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [hoveredCity, setHoveredCity] = useState<ProcessedCity | null>(null);
  const [currentYear, setCurrentYear] = useState(-3000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const citiesPerPage = 30;
  const [selectedCity, setSelectedCity] = useState<ProcessedCity | null>(null);
  const animationRef = useRef<number>();

  // Process cities with importance calculation
  const cities = useMemo(() => {
    const processed: ProcessedCity[] = [];

    Object.entries(CITIES).forEach(([mapArea, cityList]) => {
      cityList.forEach(city => {
        const lifespan = (city.declineYear || 2024) - city.foundingYear;
        const importance = Math.log(lifespan + 1) * (city.declineYear ? 0.8 : 1.2);

        processed.push({
          name: city.name,
          mapArea,
          foundingYear: city.foundingYear,
          declineYear: city.declineYear || 2024,
          region: getRegion(mapArea),
          importance
        });
      });
    });

    return processed.sort((a, b) => a.foundingYear - b.foundingYear);
  }, []);

  // Filter cities
  const filteredCities = useMemo(() => {
    return cities.filter(city => {
      const matchesSearch = searchQuery === '' ||
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.mapArea.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || city.region === selectedRegion;
      return matchesSearch && matchesRegion;
    }).sort((a, b) => b.importance - a.importance); // Sort by importance for better Y positioning
  }, [cities, searchQuery, selectedRegion]);

  // Calculate smart time bounds
  const timeBounds = useMemo(() => {
    if (filteredCities.length === 0) return { min: -3000, max: 2024 };

    const foundingYears = filteredCities.map(c => c.foundingYear);
    const declineYears = filteredCities.map(c => c.declineYear);

    const minYear = Math.min(...foundingYears);
    const maxYear = Math.max(...declineYears);

    // Add small padding only
    const padding = 100;

    return {
      min: Math.max(-5000, minYear - padding),
      max: Math.min(2100, maxYear + padding)
    };
  }, [filteredCities]);

  // Animation
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentYear(prev => {
          if (prev >= timeBounds.max) {
            setIsPlaying(false);
            return timeBounds.max;
          }
          const yearIncrement = Math.max(1, (timeBounds.max - timeBounds.min) / 200);
          return prev + yearIncrement;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timeBounds]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(10, prev * delta)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current || !isOpen || filteredCities.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 80, right: 200, bottom: 120, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Calculate zoomed domain
    const totalRange = timeBounds.max - timeBounds.min;
    const zoomedRange = totalRange / zoom;
    const centerYear = currentYear || (timeBounds.min + timeBounds.max) / 2;
    const domainMin = Math.max(timeBounds.min, centerYear - zoomedRange / 2 + panX);
    const domainMax = Math.min(timeBounds.max, centerYear + zoomedRange / 2 + panX);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([domainMin, domainMax])
      .range([0, innerWidth]);

    // Paginate cities for Y-axis to prevent overlap
    const paginatedCities = filteredCities.slice(
      pageIndex * citiesPerPage,
      (pageIndex + 1) * citiesPerPage
    );

    const yScale = d3.scaleBand()
      .domain(paginatedCities.map(d => d.name))
      .range([0, innerHeight])
      .paddingInner(0.2)
      .paddingOuter(0.1);

    // Main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Beautiful background with gradient
    const defs = svg.append('defs');

    // Main background gradient
    const bgGradient = defs.append('linearGradient')
      .attr('id', 'bg-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');

    bgGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#0F172A')
      .style('stop-opacity', 0.9);

    bgGradient.append('stop')
      .attr('offset', '50%')
      .style('stop-color', '#1E293B')
      .style('stop-opacity', 0.7);

    bgGradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#334155')
      .style('stop-opacity', 0.9);

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'url(#bg-gradient)')
      .attr('rx', 8);

    // Glow effects for regions
    Object.entries(REGIONS).forEach(([key, region]) => {
      const filter = defs.append('filter')
        .attr('id', `glow-${key}`)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'coloredBlur');

      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // Smart axis with fixed tick formatting
    const yearSpan = domainMax - domainMin;
    let tickInterval = 1000;
    if (yearSpan < 3000) tickInterval = 500;
    if (yearSpan < 1500) tickInterval = 200;
    if (yearSpan < 600) tickInterval = 100;
    if (yearSpan < 300) tickInterval = 50;
    if (yearSpan < 150) tickInterval = 25;

    const tickValues: number[] = [];
    for (let year = Math.ceil(domainMin / tickInterval) * tickInterval; year <= domainMax; year += tickInterval) {
      tickValues.push(year);
    }

    const xAxis = d3.axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat(d => {
        const year = Math.round(d as number);
        if (year === 0) return '1 CE';
        if (year < 0) return `${Math.abs(year)} BCE`;
        return `${year} CE`;
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#CBD5E1')
      .style('font-size', '12px')
      .style('font-weight', '500');

    // Beautiful grid lines
    g.selectAll('.grid-line')
      .data(tickValues)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '3,6')
      .attr('stroke-width', 1);

    // Era background regions
    const eras = [
      { name: 'Ancient', start: -3000, end: 500, color: '#1E293B' },
      { name: 'Medieval', start: 500, end: 1450, color: '#374151' },
      { name: 'Early Modern', start: 1450, end: 1800, color: '#4B5563' },
      { name: 'Modern', start: 1800, end: 2024, color: '#6B7280' }
    ];

    eras.forEach(era => {
      if (era.end >= domainMin && era.start <= domainMax) {
        const startX = Math.max(0, xScale(era.start));
        const endX = Math.min(innerWidth, xScale(era.end));

        g.append('rect')
          .attr('x', startX)
          .attr('y', 0)
          .attr('width', endX - startX)
          .attr('height', innerHeight)
          .attr('fill', era.color)
          .attr('opacity', 0.1)
          .attr('rx', 4);

        if (endX - startX > 80) {
          g.append('text')
            .attr('x', startX + (endX - startX) / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text(era.name)
            .style('fill', '#94A3B8')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('opacity', 0.7);
        }
      }
    });

    // City lifespans with beautiful styling - use paginated cities
    const visibleCities = paginatedCities.filter(d => d.declineYear >= domainMin && d.foundingYear <= domainMax);

    const cityGroups = g.selectAll('.city-group')
      .data(visibleCities)
      .enter()
      .append('g')
      .attr('class', 'city-group');

    // Lifespan bars with gradients and animations
    cityGroups.append('rect')
      .attr('x', d => Math.max(0, xScale(d.foundingYear)))
      .attr('y', d => {
        const y = yScale(d.name);
        return y !== undefined ? y + yScale.bandwidth() / 2 - 3 : 0;
      })
      .attr('width', d => {
        const startX = Math.max(0, xScale(d.foundingYear));
        const endX = Math.min(innerWidth, xScale(Math.min(d.declineYear, currentYear)));
        return Math.max(0, endX - startX);
      })
      .attr('height', 6)
      .attr('rx', 3)
      .attr('fill', d => REGIONS[d.region].color)
      .attr('opacity', d => {
        if (currentYear < d.foundingYear) return 0.2;
        if (currentYear > d.declineYear) return 0.5;
        return 0.9;
      })
      .attr('filter', d => `url(#glow-${d.region})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredCity(d))
      .on('mouseleave', () => setHoveredCity(null))
      .on('click', (event, d) => setSelectedCity(d))
      .transition()
      .duration(300)
      .attr('transform', 'scale(1.05)')
      .selection()
      .on('mouseleave.transition', function() {
        d3.select(this).transition().duration(200).attr('transform', 'scale(1)');
      });

    // Founding markers
    cityGroups.append('circle')
      .attr('cx', d => Math.max(4, xScale(d.foundingYear)))
      .attr('cy', d => {
        const y = yScale(d.name);
        return y !== undefined ? y + yScale.bandwidth() / 2 : 0;
      })
      .attr('r', d => currentYear >= d.foundingYear ? 4 : 0)
      .attr('fill', '#FFFFFF')
      .attr('stroke', d => REGIONS[d.region].color)
      .attr('stroke-width', 2)
      .attr('filter', d => `url(#glow-${d.region})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredCity(d))
      .on('mouseleave', () => setHoveredCity(null))
      .on('click', (event, d) => setSelectedCity(d));

    // Decline markers
    cityGroups.filter(d => d.declineYear < 2024 && currentYear >= d.declineYear)
      .append('path')
      .attr('d', d3.symbol().type(d3.symbolTriangle).size(80))
      .attr('transform', d => {
        const y = yScale(d.name);
        const yPos = y !== undefined ? y + yScale.bandwidth() / 2 : 0;
        return `translate(${Math.min(innerWidth - 6, xScale(d.declineYear))}, ${yPos}) rotate(180)`;
      })
      .attr('fill', '#EF4444')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none');

    // City names with smart positioning
    cityGroups.append('text')
      .attr('x', -10)
      .attr('y', d => {
        const y = yScale(d.name);
        return y !== undefined ? y + yScale.bandwidth() / 2 : 0;
      })
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .text(d => d.name)
      .style('fill', d => {
        if (currentYear >= d.foundingYear && currentYear <= d.declineYear) return '#FFFFFF';
        if (currentYear >= d.foundingYear) return '#CBD5E1';
        return '#64748B';
      })
      .style('font-size', d => `${Math.min(12, 8 + d.importance)}px`)
      .style('font-weight', d => currentYear >= d.foundingYear && currentYear <= d.declineYear ? '700' : '500')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredCity(d))
      .on('mouseleave', () => setHoveredCity(null))
      .on('click', (event, d) => setSelectedCity(d));

    // Current year indicator
    if (currentYear >= domainMin && currentYear <= domainMax) {
      const xPos = xScale(currentYear);

      g.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', -30)
        .attr('y2', innerHeight + 30)
        .attr('stroke', '#10B981')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,4')
        .attr('filter', 'url(#glow-europe)');

      g.append('rect')
        .attr('x', xPos - 50)
        .attr('y', -50)
        .attr('width', 100)
        .attr('height', 24)
        .attr('fill', '#10B981')
        .attr('rx', 12)
        .attr('filter', 'url(#glow-europe)');

      g.append('text')
        .attr('x', xPos)
        .attr('y', -32)
        .attr('text-anchor', 'middle')
        .text(currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`)
        .style('fill', 'white')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)');
    }

    // Active cities counter
    const activeCities = paginatedCities.filter(c =>
      currentYear >= c.foundingYear && currentYear <= c.declineYear
    ).length;

    g.append('text')
      .attr('x', innerWidth)
      .attr('y', -40)
      .attr('text-anchor', 'end')
      .text(`Active Cities: ${activeCities}`)
      .style('fill', '#E2E8F0')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)');

  }, [filteredCities, isOpen, currentYear, zoom, panX, timeBounds]);

  // Reset function
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setCurrentYear(timeBounds.min);
    setIsPlaying(false);
    setSearchQuery('');
    setSelectedRegion('all');
    setPageIndex(0);
  };

  const totalPages = Math.ceil(filteredCities.length / citiesPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-[96vw] h-[92vh] flex flex-col border border-slate-700">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Chronicle of Civilizations
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              Interactive timeline of {cities.length} cities • {Math.abs(timeBounds.min)} BCE to {timeBounds.max} CE
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Enhanced Controls */}
        <div className="px-8 py-4 border-b border-slate-700/50 flex items-center gap-6 bg-slate-800/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cities or regions..."
              className="pl-12 pr-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm w-80 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 bg-slate-800/70 text-white rounded-xl border border-slate-600/50 text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">All Regions</option>
              {Object.entries(REGIONS).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-slate-300" />
            </button>
            <span className="text-slate-400 text-sm w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(10, prev * 1.2))}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-2 ml-4 border-l border-slate-600 pl-4">
            <button
              onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4 text-slate-300 rotate-180" />
            </button>
            <span className="text-slate-400 text-sm">
              Page {pageIndex + 1} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Playback controls */}
          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={() => setCurrentYear(timeBounds.min)}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Reset to beginning"
            >
              <SkipForward className="w-4 h-4 text-slate-300 rotate-180" />
            </button>
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
            <button
              onClick={() => setCurrentYear(timeBounds.max)}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              title="Jump to present"
            >
              <SkipForward className="w-5 h-5 text-slate-300" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors ml-2"
              title="Reset all"
            >
              <RotateCcw className="w-4 h-4 text-slate-300" />
            </button>

            <input
              type="range"
              min={timeBounds.min}
              max={timeBounds.max}
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="w-64 ml-4 accent-blue-500"
            />
            <span className="text-slate-300 text-sm w-24 text-right font-mono">
              {currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}
            </span>
          </div>
        </div>

        {/* Visualization */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />

          {/* Beautiful tooltip */}
          {hoveredCity && (
            <div className="absolute top-6 right-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl p-6 shadow-2xl max-w-sm backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {hoveredCity.name}
              </h3>
              <p className="text-slate-400 text-sm mb-4">{hoveredCity.mapArea}</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Region:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: REGIONS[hoveredCity.region].gradient }}
                    />
                    <span className="text-white font-medium">{REGIONS[hoveredCity.region].name}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Founded:</span>
                  <span className="text-green-400 font-mono">
                    {hoveredCity.foundingYear < 0 ? `${Math.abs(hoveredCity.foundingYear)} BCE` : `${hoveredCity.foundingYear} CE`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-mono ${hoveredCity.declineYear === 2024 ? 'text-green-400' : 'text-red-400'}`}>
                    {hoveredCity.declineYear === 2024 ? 'Still Active' :
                      hoveredCity.declineYear < 0 ? `${Math.abs(hoveredCity.declineYear)} BCE` : `${hoveredCity.declineYear} CE`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="text-blue-400 font-mono">
                    {(hoveredCity.declineYear - hoveredCity.foundingYear).toLocaleString()} years
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Click instruction */}
          {hoveredCity && !selectedCity && (
            <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg animate-pulse">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">Click on {hoveredCity.name} to view details</span>
            </div>
          )}

          {/* Instructions overlay */}
          <div className="absolute bottom-6 left-6 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50">
            <p className="text-slate-300 text-sm">
              <strong>💡 Controls:</strong> Mouse wheel to zoom • Drag timeline • Play button for animation
            </p>
          </div>
        </div>

        {/* Beautiful Legend */}
        <div className="px-8 py-4 border-t border-slate-700/50 bg-slate-800/30 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <span className="text-slate-400 text-sm font-medium">Regions:</span>
              {Object.entries(REGIONS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ background: val.gradient }}
                  />
                  <span className="text-slate-300 text-sm font-medium">{val.name}</span>
                </div>
              ))}
            </div>
            <div className="text-slate-400 text-sm">
              Showing <span className="text-white font-bold">{Math.min(citiesPerPage, filteredCities.length - pageIndex * citiesPerPage)}</span> of <span className="text-white font-bold">{filteredCities.length}</span> cities (Total: {cities.length})
            </div>
          </div>
        </div>

        {/* City Detail Panel */}
        {selectedCity && (
          <CityDetailPanel
            cityName={selectedCity.name}
            mapArea={selectedCity.mapArea}
            foundingYear={selectedCity.foundingYear}
            declineYear={selectedCity.declineYear === 2024 ? undefined : selectedCity.declineYear}
            region={selectedCity.region}
            onClose={() => setSelectedCity(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CityTimeline;