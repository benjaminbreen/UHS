/**
 * components/charts/MiniLocationMap.tsx
 * World map showing player spawn location with react-simple-maps
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';

interface MiniLocationMapProps {
  continent: string;
  region: string;
  coordinates?: { x: number; y: number };
  mapSeed?: string;
}

// Map regions to approximate coordinates
const regionCoordinates: Record<string, [number, number]> = {
  // Europe
  'Western Europe': [2, 48],
  'Eastern Europe': [30, 52],
  'Mediterranean': [15, 40],
  'Scandinavia': [15, 62],
  'Low Countries': [5, 52],
  'British Isles': [-3, 54],
  'Iberian Peninsula': [-5, 40],
  'Italian Peninsula': [12, 42],
  'Balkans': [22, 44],
  'Central Europe': [15, 50],
  
  // Asia
  'East Asia': [110, 35],
  'South Asia': [78, 23],
  'Central Asia': [70, 45],
  'Southeast Asia': [105, 10],
  'Middle East': [45, 30],
  'Siberia': [90, 60],
  'Japan': [138, 36],
  'China': [105, 35],
  'India': [78, 20],
  
  // Africa
  'North Africa': [15, 25],
  'West Africa': [-5, 10],
  'East Africa': [38, 0],
  'Central Africa': [20, 0],
  'Southern Africa': [25, -25],
  'Sahara': [10, 20],
  'Nile Valley': [32, 25],
  'Madagascar': [47, -20],
  'Madagascar and Islands': [47, -20],
  'Comoros': [43, -12],
  'Comoros Archipelago': [43, -12],
  
  // Americas
  'North America': [-100, 45],
  'Central America': [-90, 15],
  'South America': [-60, -15],
  'Caribbean': [-75, 20],
  'Andes': [-70, -20],
  'Amazon': [-60, -5],
  'Great Plains': [-100, 40],
  'Eastern Woodlands': [-80, 40],
  'Mexico': [-100, 23],
  
  // Oceania
  'Australia': [135, -25],
  'Australia – West and Desert': [120, -25],
  'Australia - West and Desert': [120, -25],
  'Australia – West': [120, -25],
  'West and Desert': [120, -25],
  'Great Sandy Desert': [125, -20],
  'New Zealand': [175, -41],
  'Polynesia': [-150, -15],
  'Melanesia': [155, -10],
  'Micronesia': [160, 7],
  'Pacific & Oceania': [160, -10],
  'Pacific and Oceania': [160, -10],
  
  // Default
  'Unknown': [0, 0]
};

// GeoJSON URL for world topology
const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

const MiniLocationMap: React.FC<MiniLocationMapProps> = ({ continent, region }) => {
  const playerCoords = useMemo(() => {
    // First try exact match
    if (regionCoordinates[region]) {
      return regionCoordinates[region];
    }
    
    // Then try partial match - check if any key includes the region string
    for (const [key, coords] of Object.entries(regionCoordinates)) {
      if (region && (key.includes(region) || region.includes(key))) {
        return coords;
      }
    }
    
    // Fall back to continent
    if (regionCoordinates[continent]) {
      return regionCoordinates[continent];
    }
    
    // Default fallback
    return [0, 0];
  }, [continent, region]);

  // Determine zoom and center based on region or continent
  const mapConfig = useMemo(() => {
    // Check for specific regions first
    if (region?.includes('Australia') || region?.includes('Desert')) {
      return { center: [135, -25], zoom: 2.5 };
    }
    if (region?.includes('Madagascar')) {
      return { center: [47, -20], zoom: 4 };
    }
    if (region?.includes('Pacific')) {
      return { center: [160, -10], zoom: 2 };
    }
    
    // Then check continent
    switch (continent?.toLowerCase()) {
      case 'europe':
        return { center: [15, 50], zoom: 3 };
      case 'asia':
        return { center: [90, 30], zoom: 2 };
      case 'africa':
        return { center: [20, 0], zoom: 2.5 };
      case 'northamerica':
      case 'north america':
        return { center: [-100, 45], zoom: 2.5 };
      case 'southamerica':
      case 'south america':
        return { center: [-60, -15], zoom: 2.5 };
      case 'oceania':
      case 'australia':
        return { center: [135, -25], zoom: 2.5 };
      default:
        return { center: [0, 0], zoom: 1.5 };
    }
  }, [continent, region]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30"
    >
      <div className="mb-3">
        <h3 className="text-amber-400 font-bold text-sm mb-1">Your Location</h3>
        <p className="text-xs text-slate-400">{region}</p>
      </div>

      <div className="relative h-48 rounded-lg overflow-hidden bg-slate-900/50">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: mapConfig.center,
            scale: 100 * mapConfig.zoom
          }}
          style={{
            width: "100%",
            height: "100%"
          }}
        >
          <ZoomableGroup disablePanning disableZooming>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        fill: "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none"
                      },
                      hover: {
                        fill: "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none"
                      },
                      pressed: {
                        fill: "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none"
                      }
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Player location marker */}
            <Marker coordinates={playerCoords}>
              <g>
                {/* Outer glow */}
                <circle
                  r="12"
                  fill="#f59e0b"
                  fillOpacity="0.2"
                  filter="blur(2px)"
                />
                
                {/* Pulsing ring animation */}
                <motion.circle
                  r="10"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.6"
                  initial={{ r: 6, opacity: 0.8 }}
                  animate={{ r: 18, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                
                {/* Second pulsing ring for more glow */}
                <motion.circle
                  r="8"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.5"
                  initial={{ r: 6, opacity: 0.6 }}
                  animate={{ r: 14, opacity: 0 }}
                  transition={{
                    duration: 2,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                
                {/* Main marker - bigger */}
                <circle r="5" fill="#f59e0b" />
                
                {/* Inner bright dot */}
                <circle r="2.5" fill="#fbbf24" />
                
                {/* Center bright spot */}
                <circle r="1" fill="#ffffff" fillOpacity="0.8" />
              </g>
            </Marker>
          </ZoomableGroup>
        </ComposableMap>

        {/* Compass */}
        <div className="absolute top-2 right-2 text-slate-500 text-xs">
          <div className="text-center">N</div>
          <div className="text-center text-[8px]">↑</div>
        </div>
      </div>

      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>Region: <span className="text-amber-400">{region}</span></span>
        <span>Climate: <span className="text-amber-400">
          {getClimateForRegion(region)}
        </span></span>
      </div>
    </motion.div>
  );
};

// Helper function to get climate based on region
function getClimateForRegion(region: string): string {
  const climates: Record<string, string> = {
    'Scandinavia': 'Cold',
    'Siberia': 'Cold',
    'Canada': 'Cold',
    'Sahara': 'Arid',
    'Middle East': 'Arid',
    'Mediterranean': 'Mediterranean',
    'Caribbean': 'Tropical',
    'Amazon': 'Tropical',
    'Southeast Asia': 'Tropical',
    'Central America': 'Tropical',
    'India': 'Tropical',
    'East Africa': 'Tropical',
    'West Africa': 'Tropical',
    'Central Africa': 'Tropical',
    'Western Europe': 'Temperate',
    'Eastern Europe': 'Temperate',
    'Central Europe': 'Temperate',
    'Low Countries': 'Temperate',
    'British Isles': 'Temperate',
    'East Asia': 'Temperate',
    'North America': 'Temperate',
    'Australia': 'Variable',
    'New Zealand': 'Temperate'
  };
  
  for (const [key, climate] of Object.entries(climates)) {
    if (region.includes(key)) return climate;
  }
  
  return 'Variable';
}

export default MiniLocationMap;