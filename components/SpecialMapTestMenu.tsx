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
import { 
  WallSymbol,
  FloorSymbol,
  TableSymbol,
  ChairSymbol,
  ThroneSymbol,
  AltarSymbol,
  BedSymbol,
  BookshelfSymbol,
  CarpetSymbol,
  DaisSymbol,
  DeskSymbol,
  FountainSymbol,
  PillarSymbol,
  ShrineSymbol,
  StatueSymbol,
  DoorSymbol,
  ArchwaySymbol,
  WallGateSymbol,
  WallWindowSymbol,
  ColumnSymbol,
  StairsSymbol,
  BenchSymbol,
  CabinetSymbol,
  BathSymbol,
  MirrorSymbol,
  KitchenCounterSymbol,
  KitchenSinkSymbol,
  WeaponRackSymbol,
  ArmorStandSymbol,
  TorchSymbol,
  BrazierSymbol,
  ChestSymbol,
  BarrelSymbol
} from './symbols/architecture/specialMap/index';

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
  
  const eras: HistoricalEra[] = [
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
  
  const specialMapSymbols = [
    // Walls & Structure
    { Component: WallSymbol, name: 'Wall', biome: BiomeType.WALL },
    { Component: DoorSymbol, name: 'Door', biome: BiomeType.DOOR },
    { Component: ArchwaySymbol, name: 'Archway', biome: BiomeType.ARCHWAY },
    { Component: WallGateSymbol, name: 'Gate', biome: BiomeType.GATE },
    { Component: WallWindowSymbol, name: 'Window', biome: BiomeType.WINDOW },
    
    // Floors
    { Component: FloorSymbol, name: 'Stone Floor', biome: BiomeType.FLOOR_STONE, props: { material: 'stone' } },
    { Component: FloorSymbol, name: 'Wood Floor', biome: BiomeType.FLOOR_WOOD, props: { material: 'wood' } },
    { Component: FloorSymbol, name: 'Marble Floor', biome: BiomeType.FLOOR_MARBLE, props: { material: 'marble' } },
    { Component: FloorSymbol, name: 'Tile Floor', biome: BiomeType.FLOOR_TILE, props: { material: 'tile' } },
    { Component: CarpetSymbol, name: 'Carpet', biome: BiomeType.CARPET },
    { Component: DaisSymbol, name: 'Dais', biome: BiomeType.DAIS },
    
    // Furniture
    { Component: TableSymbol, name: 'Table', biome: BiomeType.TABLE },
    { Component: ChairSymbol, name: 'Chair', biome: BiomeType.CHAIR },
    { Component: BenchSymbol, name: 'Bench', biome: BiomeType.BENCH },
    { Component: ThroneSymbol, name: 'Throne', biome: BiomeType.THRONE },
    { Component: BedSymbol, name: 'Bed', biome: BiomeType.BED },
    { Component: DeskSymbol, name: 'Desk', biome: BiomeType.DESK },
    { Component: BookshelfSymbol, name: 'Bookshelf', biome: BiomeType.BOOKSHELF },
    { Component: CabinetSymbol, name: 'Cabinet', biome: BiomeType.CABINET },
    
    // Architectural Elements
    { Component: PillarSymbol, name: 'Pillar', biome: BiomeType.PILLAR },
    { Component: ColumnSymbol, name: 'Column', biome: BiomeType.COLUMN },
    { Component: StairsSymbol, name: 'Stairs', biome: BiomeType.STAIRS_UP },
    
    // Decorative
    { Component: StatueSymbol, name: 'Statue', biome: BiomeType.STATUE },
    { Component: FountainSymbol, name: 'Fountain', biome: BiomeType.FOUNTAIN },
    { Component: AltarSymbol, name: 'Altar', biome: BiomeType.ALTAR },
    { Component: ShrineSymbol, name: 'Shrine', biome: BiomeType.SHRINE },
    
    // Kitchen/Bath
    { Component: BathSymbol, name: 'Bath', biome: BiomeType.BATH },
    { Component: MirrorSymbol, name: 'Mirror', biome: BiomeType.MIRROR },
    { Component: KitchenCounterSymbol, name: 'Counter', biome: BiomeType.COUNTER },
    { Component: KitchenSinkSymbol, name: 'Sink', biome: BiomeType.BASIN },
    
    // Military
    { Component: WeaponRackSymbol, name: 'Weapon Rack', biome: BiomeType.WEAPON_RACK },
    { Component: ArmorStandSymbol, name: 'Armor Stand', biome: BiomeType.ARMOR_STAND },
    
    // Lighting & Storage
    { Component: TorchSymbol, name: 'Torch', biome: BiomeType.TORCH },
    { Component: BrazierSymbol, name: 'Brazier', biome: BiomeType.BRAZIER },
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
                  {eras.map(era => (
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
            </div>
          ) : (
            <div>
              {/* Symbol Grid */}
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Special Map Symbols</h3>
              <div className="grid grid-cols-4 gap-4">
                {specialMapSymbols.map((symbol, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-black/30 border border-gray-700 hover:border-blue-400 transition-all"
                  >
                    <div className="w-full h-24 flex items-center justify-center mb-2">
                      <svg width="60" height="60" viewBox="0 0 60 60">
                        <symbol.Component
                          x={0}
                          y={0}
                          size={60}
                          culturalZone={selectedZone}
                          era={selectedEra}
                          seed={index}
                          {...(symbol.props || {})}
                        />
                      </svg>
                    </div>
                    <div className="text-xs text-center">
                      <div className="text-white font-medium">{symbol.name}</div>
                      <div className="text-gray-500 text-[10px] mt-1">{symbol.biome}</div>
                    </div>
                  </div>
                ))}
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