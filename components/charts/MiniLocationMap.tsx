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
  'Italy': [12, 42],
  'Balkans': [22, 44],
  'Central Europe': [15, 50],
  'France': [2, 46],
  'Germanic Lands': [10, 51],
  'Greece and Aegean': [23, 38],
  'Ural and Arctic Europe': [60, 65],
  
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
  'Korea': [127, 37],
  'Mongolia and Manchuria': [110, 45],
  'North China Plain': [115, 38],
  'South China': [110, 23],
  'West China and Tibet': [85, 32],
  'Xinjiang': [85, 42],
  'Taiwan and East China Sea': [121, 24],
  'Taiwan and Ryukyu': [122, 25],
  'Central Asian Oases': [65, 40],
  'Kazakh Steppes': [70, 50],
  'Indochina Interior': [102, 18],
  'Mainland Southeast Asia': [100, 15],
  'Maritime Southeast Asia': [115, -2],
  'Philippines': [122, 12],
  'Indonesian and Melanesian Islands': [130, -5],
  'Himalayas and Northeast': [88, 28],
  'Central India': [78, 22],
  'Deccan Plateau': [77, 17],
  'Gangetic Plain': [82, 26],
  'Indus Valley': [70, 28],
  'Sri Lanka': [80, 7],
  
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
  'Maghreb': [-2, 32],
  'Sahel': [5, 15],
  'Upper Guinea': [-10, 10],
  'Lower Guinea and Congo Basin': [15, -5],
  'West African Forests': [-7, 6],
  'Horn of Africa': [45, 8],
  'East African Rift': [35, -3],
  'Nubian Corridor': [32, 20],
  
  // Americas
  'North America': [-100, 45],
  'Central America': [-90, 15],
  'South America': [-60, -15],
  'Caribbean': [-75, 20],
  'The Caribbean': [-75, 20],
  'Andes': [-70, -20],
  'Amazon': [-60, -5],
  'Great Plains': [-100, 40],
  'Eastern Woodlands': [-80, 40],
  'Mexico': [-100, 23],
  'Mexico and Central Highlands': [-100, 20],
  'Canada': [-95, 55],
  'Arctic and Subarctic': [-100, 65],
  'Northeastern Seaboard': [-73, 42],
  'Mississippi Valley': [-90, 35],
  'Southeast': [-85, 32],
  'Southwest': [-108, 35],
  'Northern Rockies': [-115, 48],
  'Pacific Coast': [-122, 45],
  'Northern California': [-122, 40],
  'Central California Coast': [-121, 36],
  'Southern California': [-118, 34],
  
  // South America regions
  'Patagonia': [-68, -45],
  'Andes North': [-75, -5],
  'Andes South': [-70, -25],
  'Amazon Basin': [-60, -5],
  'Gran Chaco and Pampas': [-60, -32],
  'Atlantic Coast': [-45, -20],
  'Guiana Shield': [-62, 5],
  'Southern Highlands': [-65, -18],
  'Llanos and Orinoco': [-68, 7],
  
  // Oceania
  'Australia': [135, -25],
  'Australia – West and Desert': [120, -25],
  'Australia - West and Desert': [120, -25],
  'Australia – West': [120, -25],
  'Australia – North and Queensland': [142, -18],
  'Australia – Outback and Center': [134, -24],
  'Australia – Southeast': [145, -35],
  'West and Desert': [120, -25],
  'Great Sandy Desert': [125, -20],
  'New Zealand': [175, -41],
  'Polynesia': [-150, -15],
  'Melanesia': [155, -10],
  'Micronesia': [160, 7],
  'Pacific & Oceania': [160, -10],
  'Pacific and Oceania': [160, -10],
  'New Guinea and Melanesia': [145, -6],
  'Hawaii and Central Pacific': [-157, 21],
  
  // Middle East (MENA)
  'Arabian Peninsula': [45, 23],
  'Mesopotamia': [44, 33],
  'Levant': [35, 32],
  'Anatolia': [35, 39],
  'Persian Plateau': [53, 32],
  'Caucasus': [45, 42],
  
  // Other regions
  'Atlantic Islands': [-20, 30],
  'European Waters': [0, 50],
  
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

  // Determine zoom level based on region specificity
  const zoomLevel = useMemo(() => {
    // Higher zoom for smaller/more specific regions
    if (region?.includes('Madagascar') || region?.includes('Sri Lanka')) {
      return 8;
    }
    if (region?.includes('Japan') || region?.includes('Korea') || region?.includes('Philippines')) {
      return 6;
    }
    if (region?.includes('British Isles') || region?.includes('Italy') || region?.includes('Greece')) {
      return 5;
    }
    if (region?.includes('France') || region?.includes('Germanic Lands') || region?.includes('Iberian')) {
      return 4;
    }
    if (region?.includes('Pacific') || region?.includes('Ocean') || region?.includes('Sea')) {
      return 3;
    }
    // Medium zoom for most regions
    if (region?.includes('Desert') || region?.includes('Basin') || region?.includes('Valley')) {
      return 4;
    }
    // Default zoom for larger regions
    if (continent?.toLowerCase() === 'europe') {
      return 4;
    }
    if (continent?.toLowerCase().includes('america')) {
      return 3;
    }
    if (continent?.toLowerCase() === 'asia') {
      return 3;
    }
    return 4; // Default regional zoom
  }, [continent, region]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30"
    >
      <div className="mb-3">
        <h3 className="text-amber-400 font-bold text-sm">
          Your Location: <span className="text-emerald-400 font-medium ml-1">{region}</span>
        </h3>
      </div>

      <div className="relative h-48 rounded-lg overflow-hidden bg-slate-900/50">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: playerCoords,
            scale: 100 * zoomLevel
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

      <div className="mt-3 text-xs text-slate-400 text-center">
        <span
          className="cursor-help"
          title={`${getClimateForRegion(region)} climate typical of this region - affects agriculture, settlement patterns, and daily life`}
        >
          Climate: <span className="text-amber-400 border-b border-dotted border-amber-400/40 hover:border-amber-400 transition-colors">
            {getClimateForRegion(region)}
          </span>
        </span>
      </div>
    </motion.div>
  );
};

// Helper function to get climate based on region
function getClimateForRegion(region: string): string {
  const climates: Record<string, string> = {
    // Cold regions
    'Scandinavia': 'Cold',
    'Siberia': 'Cold',
    'Canada': 'Cold',
    'Arctic and Subarctic': 'Cold',
    'Patagonia': 'Cold',
    'Southern Highlands': 'Cold',
    'Northern Rockies': 'Cold',
    'Ural and Arctic Europe': 'Cold',
    'Himalayas and Northeast': 'Cold',
    'West China and Tibet': 'Cold',
    
    // Arid regions
    'Sahara': 'Arid',
    'Middle East': 'Arid',
    'Arabian Peninsula': 'Arid',
    'Atacama': 'Arid',
    'Gran Chaco': 'Arid',
    'Sahel': 'Arid',
    'Nubian Corridor': 'Arid',
    'Persian Plateau': 'Arid',
    'Xinjiang': 'Arid',
    'Central Asian Oases': 'Arid',
    'Kazakh Steppes': 'Arid',
    'Australia – Outback': 'Arid',
    'Southwest': 'Arid',
    
    // Mediterranean regions
    'Mediterranean': 'Mediterranean',
    'Maghreb': 'Mediterranean',
    'Levant': 'Mediterranean',
    'Southern California': 'Mediterranean',
    'Greece and Aegean': 'Mediterranean',
    'Anatolia': 'Mediterranean',
    
    // Tropical regions
    'Caribbean': 'Tropical',
    'The Caribbean': 'Tropical',
    'Amazon': 'Tropical',
    'Amazon Basin': 'Tropical',
    'Guiana Shield': 'Tropical',
    'Llanos and Orinoco': 'Tropical',
    'Southeast Asia': 'Tropical',
    'Maritime Southeast Asia': 'Tropical',
    'Mainland Southeast Asia': 'Tropical',
    'Indochina Interior': 'Tropical',
    'Philippines': 'Tropical',
    'Indonesian and Melanesian Islands': 'Tropical',
    'Central America': 'Tropical',
    'Mexico and Central Highlands': 'Tropical',
    'India': 'Tropical',
    'Central India': 'Tropical',
    'Deccan Plateau': 'Tropical',
    'Sri Lanka': 'Tropical',
    'East Africa': 'Tropical',
    'East African Rift': 'Tropical',
    'Horn of Africa': 'Tropical',
    'West Africa': 'Tropical',
    'West African Forests': 'Tropical',
    'Upper Guinea': 'Tropical',
    'Lower Guinea and Congo Basin': 'Tropical',
    'Central Africa': 'Tropical',
    'Atlantic Coast': 'Tropical',
    'Hawaii and Central Pacific': 'Tropical',
    'Polynesia': 'Tropical',
    'Melanesia': 'Tropical',
    'New Guinea and Melanesia': 'Tropical',
    'Micronesia': 'Tropical',
    'Australia – North and Queensland': 'Tropical',
    
    // Temperate regions
    'Western Europe': 'Temperate',
    'Eastern Europe': 'Temperate',
    'Central Europe': 'Temperate',
    'Low Countries': 'Temperate',
    'British Isles': 'Temperate',
    'France': 'Temperate',
    'Germanic Lands': 'Temperate',
    'Italy': 'Temperate',
    'Balkans': 'Temperate',
    'Caucasus': 'Temperate',
    'East Asia': 'Temperate',
    'North China Plain': 'Temperate',
    'South China': 'Temperate',
    'Korea': 'Temperate',
    'Japan': 'Temperate',
    'Taiwan and Ryukyu': 'Temperate',
    'Mongolia and Manchuria': 'Temperate',
    'North America': 'Temperate',
    'Northeastern Seaboard': 'Temperate',
    'Mississippi Valley': 'Temperate',
    'Southeast': 'Temperate',
    'Pacific Coast': 'Temperate',
    'Northern California': 'Temperate',
    'Central California Coast': 'Temperate',
    'Great Plains': 'Temperate',
    'Eastern Woodlands': 'Temperate',
    'Andes North': 'Temperate',
    'Andes South': 'Temperate',
    'Gran Chaco and Pampas': 'Temperate',
    'Gangetic Plain': 'Temperate',
    'Indus Valley': 'Temperate',
    'Mesopotamia': 'Temperate',
    'New Zealand': 'Temperate',
    'Australia – Southeast': 'Temperate',
    'Southern Africa': 'Temperate',
    'Madagascar': 'Temperate',
    'Atlantic Islands': 'Temperate',
    
    // Variable climate
    'Australia': 'Variable',
    'Australia – West and Desert': 'Variable'
  };
  
  for (const [key, climate] of Object.entries(climates)) {
    if (region.includes(key)) return climate;
  }
  
  return 'Variable';
}

export default MiniLocationMap;