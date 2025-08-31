/**
 * SpecialMapTestMenu.tsx
 * Testing suite for special map system - allows entering any archetype and viewing all symbols
 */

import React, { useState } from 'react';
import { X, MapIcon, Grid3x3, Play, Eye } from 'lucide-react';
import { SpecialMapArchetype, SpecialMapConfig } from '../types/specialMapTypes';
import { BiomeType, CulturalZone, HistoricalEra } from '../types';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';

// Import all special map symbols for preview
import WallSymbol from './symbols/WallSymbol';
import { FloorSymbol } from './symbols/architecture/specialMap/FloorSymbol';
import { TableSymbol } from './symbols/architecture/specialMap/TableSymbol';
import ChairSymbol from './symbols/ChairSymbol';
import { ThroneSymbol } from './symbols/architecture/specialMap/ThroneSymbol';
import { AltarSymbol } from './symbols/architecture/specialMap/AltarSymbol';
import { BedSymbol } from './symbols/architecture/specialMap/BedSymbol';
import BookshelfSymbol from './symbols/BookshelfSymbol';
import { CarpetSymbol } from './symbols/architecture/specialMap/CarpetSymbol';
import { DaisSymbol } from './symbols/architecture/specialMap/DaisSymbol';
import DeskSymbol from './symbols/DeskSymbol';
import FountainSymbol from './symbols/FountainSymbol';
import PillarSymbol from './symbols/PillarSymbol';
import ShrineSymbol from './symbols/ShrineSymbol';
import StatueSymbol from './symbols/StatueSymbol';
import { DoorSymbol } from './symbols/architecture/specialMap/DoorSymbol';
import { ArchwaySymbol } from './symbols/architecture/specialMap/ArchwaySymbol';
import { WallGateSymbol } from './symbols/architecture/specialMap/WallGateSymbol';
import { WallWindowSymbol } from './symbols/architecture/specialMap/WallWindowSymbol';
import { ColumnSymbol } from './symbols/architecture/specialMap/ColumnSymbol';
import { StairsSymbol } from './symbols/architecture/specialMap/StairsSymbol';
import { BenchSymbol } from './symbols/architecture/specialMap/BenchSymbol';
import CabinetSymbol from './symbols/CabinetSymbol';
import { BathSymbol } from './symbols/architecture/specialMap/BathSymbol';
import { MirrorSymbol } from './symbols/architecture/specialMap/MirrorSymbol';
import { KitchenCounterSymbol } from './symbols/architecture/specialMap/KitchenCounterSymbol';
import { KitchenSinkSymbol } from './symbols/architecture/specialMap/KitchenSinkSymbol';
import WeaponRackSymbol from './symbols/WeaponRackSymbol';
import ArmorStandSymbol from './symbols/ArmorStandSymbol';
import TorchSymbol from './symbols/TorchSymbol';
import { ChestSymbol } from './symbols/architecture/specialMap/ChestSymbol';
import { BarrelSymbol } from './symbols/architecture/specialMap/BarrelSymbol';

interface SpecialMapTestMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpecialMapTestMenu: React.FC<SpecialMapTestMenuProps> = ({ isOpen, onClose }) => {
  const { enterSpecialMap } = useMap();
  const { gameDate } = useGame();
  
  const [selectedArchetype, setSelectedArchetype] = useState<SpecialMapArchetype>(SpecialMapArchetype.ESTATES);
  const [selectedZone, setSelectedZone] = useState<CulturalZone>('EUROPEAN' as CulturalZone);
  const [selectedEra, setSelectedEra] = useState<HistoricalEra>('MEDIEVAL');
  const [selectedSize, setSelectedSize] = useState<'xs' | 'small' | 'medium' | 'large' | 'xl'>('large');
  const [hasLandscape, setHasLandscape] = useState(true);
  const [showSymbolGrid, setShowSymbolGrid] = useState(false);
  
  // State for cycling through variants
  const [symbolVariants, setSymbolVariants] = useState<Record<number, { zone: string; era: number }>>({});
  
  if (!isOpen) return null;
  
  const archetypes = [
    // New simplified archetypes
    { value: SpecialMapArchetype.ESTATES, label: '🏛️ Estate', description: 'Palaces, villas, and noble residences' },
    { value: SpecialMapArchetype.CAMPGROUND, label: '🏕️ Campground', description: 'Temporary settlements and camps' },
    { value: SpecialMapArchetype.RESTAURANT_INN, label: '🍺 Restaurant/Inn', description: 'Taverns, inns, and eating establishments' },
    { value: SpecialMapArchetype.VESSEL, label: '⛵ Vessel', description: 'Ships, boats, and floating structures' },
    
    // Core government/civic (these remain but streamlined)
    { value: SpecialMapArchetype.GOVERNMENT_FORUM, label: '⚖️ Government', description: 'Council chambers and forums' },
    { value: SpecialMapArchetype.SACRED_COMPLEX, label: '⛪ Sacred', description: 'Temples, churches, and shrines' },
    { value: SpecialMapArchetype.MILITARY_FORTRESS, label: '🏰 Fortress', description: 'Castles, forts, and bunkers' },
    { value: SpecialMapArchetype.UNIVERSITY, label: '🎓 University', description: 'Libraries and lecture halls' },
    { value: SpecialMapArchetype.THEATER, label: '🎭 Theater', description: 'Performance venues' },
    { value: SpecialMapArchetype.OPEN_FIELD, label: '🌾 Open Field', description: 'Festival and parade grounds' }
  ];
  
  const culturalZones = [
    'EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN', 'SOUTHEAST_ASIAN',
    'AFRICAN', 'NORTH_AMERICAN', 'SOUTH_AMERICAN', 'OCEANIAN'
  ];
  
  const historicalEras: HistoricalEra[] = [
    'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN',
    'INDUSTRIAL_ERA', 'MODERN_ERA'
  ];
  
  // Determine default size based on archetype and era
  const getDefaultSize = () => {
    // Government districts are always XL
    if (selectedArchetype === SpecialMapArchetype.GOVERNMENT_FORUM) return 'xl';
    
    // Estates are large from medieval onward
    if (selectedArchetype === SpecialMapArchetype.ESTATES) {
      if (selectedEra === 'PREHISTORY') return 'xs';
      if (selectedEra === 'ANTIQUITY') return 'small';
      return 'large'; // Medieval and later
    }
    
    // Vessels have specific sizes
    if (selectedArchetype === SpecialMapArchetype.VESSEL) {
      if (selectedEra === 'PREHISTORY') return 'xs';
      if (selectedEra === 'ANTIQUITY') return 'small';
      return 'medium';
    }
    
    // Campgrounds are usually small
    if (selectedArchetype === SpecialMapArchetype.CAMPGROUND) {
      return 'small';
    }
    
    // Default to selected size
    return selectedSize;
  };
  
  const handleEnterMap = () => {
    const config: SpecialMapConfig = {
      archetype: selectedArchetype,
      culturalZone: selectedZone as CulturalZone,
      era: selectedEra,
      specificYear: gameDate.year,
      region: 'Test Region',
      mapSize: getDefaultSize(),
      hasLandscape: hasLandscape
    };
    
    // Call enterSpecialMap directly
    // The MapContext will handle caching the current map
    enterSpecialMap(config);
    onClose();
  };
  
  // Render simplified archetype layout mockups
  const renderArchetypeMockup = (pattern: string) => {
    const size = 40; // Small square mockup
    
    switch (pattern) {
      case 'estates':
        // Symmetrical throne room with side chambers
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <rect x={10} y={5} width={20} height={15} fill="#2a2a2a" /> {/* Throne room */}
            <rect x={18} y={7} width={4} height={3} fill="#8b4513" /> {/* Throne */}
            <rect x={5} y={25} width={10} height={10} fill="#2a2a2a" /> {/* Left chamber */}
            <rect x={25} y={25} width={10} height={10} fill="#2a2a2a" /> {/* Right chamber */}
            <rect x={18} y={35} width={4} height={3} fill="#654321" /> {/* Door */}
          </svg>
        );
      
      case 'government':
        // Semicircular seating arrangement
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <rect x={18} y={5} width={4} height={4} fill="#8b4513" /> {/* Podium */}
            <path d={`M 10,25 Q 20,15 30,25`} fill="none" stroke="#4a4a4a" strokeWidth={2} /> {/* Seating arc */}
            <circle cx={15} cy={22} r={1} fill="#3a3a3a" />
            <circle cx={20} cy={20} r={1} fill="#3a3a3a" />
            <circle cx={25} cy={22} r={1} fill="#3a3a3a" />
            <rect x={15} y={30} width={10} height={6} fill="#2a2a2a" /> {/* Foyer */}
          </svg>
        );
      
      case 'sacred':
        // Central altar with radiating pattern
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <circle cx={20} cy={20} r={12} fill="none" stroke="#3a3a3a" strokeWidth={1} />
            <rect x={17} y={17} width={6} height={6} fill="#d4af37" /> {/* Altar */}
            <line x1={20} y1={8} x2={20} y2={14} stroke="#4a4a4a" strokeWidth={1} />
            <line x1={20} y1={26} x2={20} y2={32} stroke="#4a4a4a" strokeWidth={1} />
            <line x1={8} y1={20} x2={14} y2={20} stroke="#4a4a4a" strokeWidth={1} />
            <line x1={26} y1={20} x2={32} y2={20} stroke="#4a4a4a" strokeWidth={1} />
          </svg>
        );
      
      case 'fortress':
        // Thick walls with corner towers
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={4} y={4} width={32} height={32} fill="none" stroke="#666" strokeWidth={3} />
            <rect x={2} y={2} width={8} height={8} fill="#4a4a4a" /> {/* Corner tower */}
            <rect x={30} y={2} width={8} height={8} fill="#4a4a4a" />
            <rect x={2} y={30} width={8} height={8} fill="#4a4a4a" />
            <rect x={30} y={30} width={8} height={8} fill="#4a4a4a" />
            <rect x={15} y={15} width={10} height={10} fill="#2a2a2a" /> {/* Keep */}
          </svg>
        );
      
      case 'university':
        // Library with reading rooms
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <rect x={10} y={5} width={20} height={10} fill="#2a2a2a" /> {/* Main hall */}
            <rect x={5} y={20} width={8} height={8} fill="#2a2a2a" /> {/* Study */}
            <rect x={16} y={20} width={8} height={8} fill="#2a2a2a" /> {/* Study */}
            <rect x={27} y={20} width={8} height={8} fill="#2a2a2a" /> {/* Study */}
            <rect x={12} y={7} width={2} height={6} fill="#3a3a3a" /> {/* Bookshelf */}
            <rect x={16} y={7} width={2} height={6} fill="#3a3a3a" />
            <rect x={20} y={7} width={2} height={6} fill="#3a3a3a" />
            <rect x={24} y={7} width={2} height={6} fill="#3a3a3a" />
          </svg>
        );
      
      case 'theater':
        // Stage with audience seating
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <rect x={8} y={5} width={24} height={8} fill="#3a3a3a" /> {/* Stage */}
            <rect x={18} y={7} width={4} height={4} fill="#8b4513" /> {/* Props */}
            {/* Seating rows */}
            <rect x={10} y={18} width={20} height={2} fill="#2a2a2a" />
            <rect x={10} y={22} width={20} height={2} fill="#2a2a2a" />
            <rect x={10} y={26} width={20} height={2} fill="#2a2a2a" />
            <rect x={10} y={30} width={20} height={2} fill="#2a2a2a" />
          </svg>
        );
      
      case 'field':
        // Open space with minimal structures
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <circle cx={20} cy={20} r={15} fill="none" stroke="#2a2a2a" strokeWidth={1} strokeDasharray="2,2" />
            <rect x={5} y={18} width={4} height={4} fill="#3a3a3a" /> {/* Small structure */}
            <rect x={31} y={18} width={4} height={4} fill="#3a3a3a" />
          </svg>
        );
      
      case 'camp':
        // Scattered tents around fire
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <circle cx={20} cy={20} r={3} fill="#ff6b35" /> {/* Campfire */}
            <polygon points="8,12 12,8 16,12" fill="#3a3a3a" /> {/* Tent */}
            <polygon points="24,12 28,8 32,12" fill="#3a3a3a" />
            <polygon points="8,28 12,24 16,28" fill="#3a3a3a" />
            <polygon points="24,28 28,24 32,28" fill="#3a3a3a" />
          </svg>
        );
      
      case 'restaurant':
        // Bar counter with seating area
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <rect x={5} y={5} width={30} height={4} fill="#4a4a4a" /> {/* Bar counter */}
            <circle cx={10} cy={7} r={1} fill="#8b4513" /> {/* Bar stool */}
            <circle cx={15} cy={7} r={1} fill="#8b4513" />
            <circle cx={20} cy={7} r={1} fill="#8b4513" />
            <circle cx={25} cy={7} r={1} fill="#8b4513" />
            <circle cx={30} cy={7} r={1} fill="#8b4513" />
            {/* Tables */}
            <rect x={8} y={15} width={4} height={4} fill="#3a3a3a" />
            <rect x={18} y={15} width={4} height={4} fill="#3a3a3a" />
            <rect x={28} y={15} width={4} height={4} fill="#3a3a3a" />
            <rect x={8} y={25} width={4} height={4} fill="#3a3a3a" />
            <rect x={18} y={25} width={4} height={4} fill="#3a3a3a" />
            <rect x={28} y={25} width={4} height={4} fill="#3a3a3a" />
          </svg>
        );
      
      case 'vessel':
        // Ship deck with ocean border
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a3a4a" /> {/* Ocean */}
            <rect x={10} y={10} width={20} height={20} fill="#2a2a2a" /> {/* Deck */}
            <rect x={18} y={12} width={4} height={4} fill="#8b4513" /> {/* Helm */}
            <rect x={13} y={20} width={3} height={6} fill="#3a3a3a" /> {/* Cargo */}
            <rect x={24} y={20} width={3} height={6} fill="#3a3a3a" />
            <line x1={20} y1={14} x2={20} y2={8} stroke="#666" strokeWidth={1} /> {/* Mast */}
          </svg>
        );
      
      default:
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#1a1a1a" />
            <rect x={2} y={2} width={size-4} height={size-4} fill="none" stroke="#444" strokeWidth={1} />
            <text x={20} y={20} textAnchor="middle" fill="#666" fontSize={8}>?</text>
          </svg>
        );
    }
  };
  
  // Cultural zones for cycling variants
  const zones = ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'AFRICAN', 'AMERICAS', 'OCEANIA'];
  const eraYears = [-3000, 0, 500, 1000, 1500, 1800, 1950, 2020];
  
  const handleSymbolClick = (index: number) => {
    setSymbolVariants(prev => {
      const current = prev[index] || { zone: 'EUROPEAN', era: 1500 };
      const currentZoneIndex = zones.indexOf(current.zone);
      const currentEraIndex = eraYears.indexOf(current.era);
      
      // Cycle to next zone, and if at end, cycle era too
      let nextZoneIndex = (currentZoneIndex + 1) % zones.length;
      let nextEraIndex = currentEraIndex;
      
      if (nextZoneIndex === 0) {
        nextEraIndex = (currentEraIndex + 1) % eraYears.length;
      }
      
      return {
        ...prev,
        [index]: {
          zone: zones[nextZoneIndex],
          era: eraYears[nextEraIndex]
        }
      };
    });
  };
  
  const specialMapSymbols = [
    // Walls & Structure
    { Component: WallSymbol, name: 'Wall', biome: BiomeType.WALL, hasVariants: true },
    { Component: DoorSymbol, name: 'Door', biome: BiomeType.DOOR },
    { Component: ArchwaySymbol, name: 'Archway', biome: BiomeType.ARCHWAY },
    { Component: WallGateSymbol, name: 'Gate', biome: BiomeType.GATE },
    { Component: WallWindowSymbol, name: 'Window', biome: BiomeType.WINDOW },
    
    // Floors
    { Component: FloorSymbol, name: 'Stone Floor', biome: BiomeType.FLOOR_STONE, props: { floorType: 'stone' } },
    { Component: FloorSymbol, name: 'Wood Floor', biome: BiomeType.FLOOR_WOOD, props: { floorType: 'wood' } },
    { Component: FloorSymbol, name: 'Marble Floor', biome: BiomeType.FLOOR_MARBLE, props: { floorType: 'marble' } },
    { Component: FloorSymbol, name: 'Tile Floor', biome: BiomeType.FLOOR_TILE, props: { floorType: 'tile' } },
    { Component: CarpetSymbol, name: 'Carpet', biome: BiomeType.CARPET },
    { Component: DaisSymbol, name: 'Dais', biome: BiomeType.DAIS },
    
    // Furniture (with cultural variants)
    { Component: TableSymbol, name: 'Table', biome: BiomeType.TABLE },
    { Component: ChairSymbol, name: 'Chair', biome: BiomeType.CHAIR, hasVariants: true },
    { Component: BenchSymbol, name: 'Bench', biome: BiomeType.BENCH },
    { Component: ThroneSymbol, name: 'Throne', biome: BiomeType.THRONE },
    { Component: BedSymbol, name: 'Bed', biome: BiomeType.BED },
    { Component: DeskSymbol, name: 'Desk', biome: BiomeType.DESK, hasVariants: true },
    { Component: BookshelfSymbol, name: 'Bookshelf', biome: BiomeType.BOOKSHELF, hasVariants: true },
    { Component: CabinetSymbol, name: 'Cabinet', biome: BiomeType.CABINET, hasVariants: true },
    
    // Architectural Elements (with variants)
    { Component: PillarSymbol, name: 'Pillar (Base)', biome: BiomeType.PILLAR, hasVariants: true, props: { section: 'base' } },
    { Component: PillarSymbol, name: 'Pillar (Middle)', biome: BiomeType.PILLAR, hasVariants: true, props: { section: 'middle' } },
    { Component: PillarSymbol, name: 'Pillar (Top)', biome: BiomeType.PILLAR, hasVariants: true, props: { section: 'top' } },
    { Component: ColumnSymbol, name: 'Column', biome: BiomeType.COLUMN },
    { Component: StairsSymbol, name: 'Stairs', biome: BiomeType.STAIRS_UP },
    
    // Decorative
    { Component: StatueSymbol, name: 'Statue', biome: BiomeType.STATUE, hasVariants: true },
    { Component: FountainSymbol, name: 'Fountain', biome: BiomeType.FOUNTAIN, hasVariants: true },
    { Component: AltarSymbol, name: 'Altar', biome: BiomeType.ALTAR, hasVariants: true },
    { Component: ShrineSymbol, name: 'Shrine', biome: BiomeType.SHRINE, hasVariants: true },
    
    // Kitchen/Bath
    { Component: BathSymbol, name: 'Bath', biome: BiomeType.BATH },
    { Component: MirrorSymbol, name: 'Mirror', biome: BiomeType.MIRROR },
    { Component: KitchenCounterSymbol, name: 'Counter', biome: BiomeType.COUNTER },
    { Component: KitchenSinkSymbol, name: 'Sink', biome: BiomeType.BASIN },
    
    // Military
    { Component: WeaponRackSymbol, name: 'Weapon Rack', biome: BiomeType.WEAPON_RACK, hasVariants: true },
    { Component: ArmorStandSymbol, name: 'Armor Stand', biome: BiomeType.ARMOR_STAND, hasVariants: true },
    
    // Lighting & Storage
    { Component: TorchSymbol, name: 'Torch', biome: BiomeType.TORCH, hasVariants: true, props: { type: 'torch' } },
    { Component: TorchSymbol, name: 'Brazier', biome: BiomeType.BRAZIER, hasVariants: true, props: { type: 'brazier' } },
    { Component: ChestSymbol, name: 'Chest', biome: BiomeType.CHEST },
    { Component: BarrelSymbol, name: 'Barrel', biome: BiomeType.BARREL }
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl shadow-2xl border border-blue-400/30 w-[90%] max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-400/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Special Map Testing Suite
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowSymbolGrid(false)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                !showSymbolGrid 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Play className="w-4 h-4" />
              Enter Special Map
            </button>
            <button
              onClick={() => setShowSymbolGrid(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                showSymbolGrid 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              View All Symbols
            </button>
          </div>
          
          {!showSymbolGrid ? (
            <div className="space-y-6">
              {/* Archetype Selection */}
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Select Archetype
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {archetypes.map(arch => (
                    <button
                      key={arch.value}
                      onClick={() => setSelectedArchetype(arch.value)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedArchetype === arch.value
                          ? 'border-blue-400 bg-blue-600/20 shadow-lg'
                          : 'border-gray-600 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-lg font-semibold text-white">{arch.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{arch.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Cultural Zone Selection */}
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Cultural Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-blue-400 focus:outline-none"
                >
                  {culturalZones.map(zone => (
                    <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              
              {/* Era Selection */}
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Historical Era
                </label>
                <select
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value as HistoricalEra)}
                  className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-blue-400 focus:outline-none"
                >
                  {historicalEras.map(era => (
                    <option key={era} value={era}>{era.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              
              {/* Map Size Selection */}
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Map Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg bg-black/30 border border-gray-600 text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="xs">XS (8×8)</option>
                  <option value="small">Small (10×10)</option>
                  <option value="medium">Medium (16×16)</option>
                  <option value="large">Large (20×20)</option>
                  <option value="xl">XL (25×25)</option>
                </select>
              </div>
              
              {/* Landscape Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLandscape}
                    onChange={(e) => setHasLandscape(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-black/30 text-blue-500 focus:ring-blue-400 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-blue-300">
                    Has Landscape Border
                  </span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-8">
                  Add climate-appropriate landscape border around the building
                </p>
              </div>
              
              {/* Configuration Preview */}
              <div className="p-4 rounded-lg bg-black/30 border border-gray-700">
                <h3 className="text-sm font-semibold text-purple-400 mb-2">Configuration Preview</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Archetype:</span>
                    <span className="text-white">{selectedArchetype.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cultural Zone:</span>
                    <span className="text-white">{selectedZone.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Era:</span>
                    <span className="text-white">{selectedEra.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Year:</span>
                    <span className="text-white">{gameDate.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{getDefaultSize().toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Landscape:</span>
                    <span className="text-white">{hasLandscape ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              {/* Enter Button */}
              <button
                onClick={handleEnterMap}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Enter Special Map
              </button>
              
              {/* Archetype Layout Mockups */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Archetype Layout Patterns</h3>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { name: 'Estate', pattern: 'estates' },
                    { name: 'Government', pattern: 'government' },
                    { name: 'Sacred', pattern: 'sacred' },
                    { name: 'Fortress', pattern: 'fortress' },
                    { name: 'University', pattern: 'university' },
                    { name: 'Theater', pattern: 'theater' },
                    { name: 'Open Field', pattern: 'field' },
                    { name: 'Campground', pattern: 'camp' },
                    { name: 'Restaurant', pattern: 'restaurant' },
                    { name: 'Vessel', pattern: 'vessel' }
                  ].map(arch => (
                    <div key={arch.pattern} className="text-center">
                      <div className="w-full aspect-square bg-black/30 border border-gray-700 rounded p-1">
                        {renderArchetypeMockup(arch.pattern)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">{arch.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Symbol Grid */}
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Special Map Symbols</h3>
              <div className="grid grid-cols-4 gap-4">
                {specialMapSymbols.map((symbol, index) => {
                  const variant = symbolVariants[index] || { zone: 'EUROPEAN', era: 1500 };
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg bg-black/30 border border-gray-700 hover:border-blue-400 transition-all ${
                        symbol.hasVariants ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => symbol.hasVariants && handleSymbolClick(index)}
                    >
                      <div className="w-full h-24 flex items-center justify-center mb-2">
                        <svg width="60" height="60" viewBox="0 0 60 60">
                          <symbol.Component
                            x={0}
                            y={0}
                            size={60}
                            culturalZone={symbol.hasVariants ? variant.zone : selectedZone}
                            era={symbol.hasVariants ? variant.era : (selectedEra === 'MEDIEVAL' ? 1200 : 1500)}
                            seed={index}
                            {...(symbol.props || {})}
                          />
                        </svg>
                      </div>
                      <div className="text-xs text-center">
                        <div className="text-white font-medium">{symbol.name}</div>
                        <div className="text-gray-500 text-[10px] mt-1">{symbol.biome}</div>
                        {symbol.hasVariants && (
                          <div className="text-blue-400 text-[9px] mt-1">
                            {variant.zone} • {variant.era}
                            <br />
                            <span className="text-gray-400">(click to cycle)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Additional Test Symbols */}
              <h3 className="text-xl font-semibold text-blue-300 mt-8 mb-4">Procedural Symbols</h3>
              <div className="p-4 rounded-lg bg-black/30 border border-gray-700">
                <p className="text-sm text-gray-400 mb-3">
                  The following symbols are generated procedurally in the map:
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <span className="text-gray-300">WALL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-700 rounded"></div>
                    <span className="text-gray-300">BRAZIER</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                    <span className="text-gray-300">TORCH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-800 rounded"></div>
                    <span className="text-gray-300">CHEST</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-700 rounded"></div>
                    <span className="text-gray-300">BARREL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-stone-400 rounded"></div>
                    <span className="text-gray-300">PLAZA</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialMapTestMenu;