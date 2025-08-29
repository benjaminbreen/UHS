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
import { WallSymbol } from './symbols/government/specialMap/WallSymbol';
import { FloorSymbol } from './symbols/government/specialMap/FloorSymbol';
import { TableSymbol } from './symbols/government/specialMap/TableSymbol';
import { ChairSymbol } from './symbols/government/specialMap/ChairSymbol';
import { ThroneSymbol } from './symbols/government/specialMap/ThroneSymbol';
import { AltarSymbol } from './symbols/government/specialMap/AltarSymbol';
import { BedSymbol } from './symbols/government/specialMap/BedSymbol';
import { BookshelfSymbol } from './symbols/government/specialMap/BookshelfSymbol';
import { CarpetSymbol } from './symbols/government/specialMap/CarpetSymbol';
import { DeskSymbol } from './symbols/government/specialMap/DeskSymbol';
import { FountainSymbol } from './symbols/government/specialMap/FountainSymbol';
import { PillarSymbol } from './symbols/government/specialMap/PillarSymbol';
import { ShrineSymbol } from './symbols/government/specialMap/ShrineSymbol';
import { StatueSymbol } from './symbols/government/specialMap/StatueSymbol';

interface SpecialMapTestMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpecialMapTestMenu: React.FC<SpecialMapTestMenuProps> = ({ isOpen, onClose }) => {
  const { enterSpecialMap } = useMap();
  const { gameDate } = useGame();
  
  const [selectedArchetype, setSelectedArchetype] = useState<SpecialMapArchetype>(SpecialMapArchetype.PALACE_COMPLEX);
  const [selectedZone, setSelectedZone] = useState<CulturalZone>('EUROPEAN' as CulturalZone);
  const [selectedEra, setSelectedEra] = useState<HistoricalEra>('MEDIEVAL');
  const [showSymbolGrid, setShowSymbolGrid] = useState(false);
  
  if (!isOpen) return null;
  
  const archetypes = [
    { value: SpecialMapArchetype.PALACE_COMPLEX, label: '🏛️ Palace Complex', description: 'Royal palaces and imperial courts' },
    { value: SpecialMapArchetype.MARKET_BAZAAR, label: '🏪 Market Bazaar', description: 'Trading markets and merchant quarters' },
    { value: SpecialMapArchetype.GOVERNMENT_FORUM, label: '⚖️ Government Forum', description: 'Senate houses and council chambers' },
    { value: SpecialMapArchetype.SACRED_COMPLEX, label: '⛪ Sacred Complex', description: 'Temples, churches, and shrines' },
    { value: SpecialMapArchetype.MILITARY_FORTRESS, label: '🏰 Military Fortress', description: 'Castles, forts, and bunkers' },
    { value: SpecialMapArchetype.UNIVERSITY, label: '🎓 University Academy', description: 'Libraries and lecture halls' },
    { value: SpecialMapArchetype.THEATER, label: '🎭 Theater', description: 'Performance venues and amphitheaters' },
    { value: SpecialMapArchetype.ARENA, label: '⚔️ Arena', description: 'Colosseums and sports venues' },
    { value: SpecialMapArchetype.EXHIBITION, label: '🖼️ Exhibition', description: 'Museums and world fairs' },
    { value: SpecialMapArchetype.OPEN_FIELD, label: '🌾 Open Field', description: 'Parade grounds and festival spaces' }
  ];
  
  const culturalZones = [
    'EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN', 'SOUTHEAST_ASIAN',
    'AFRICAN', 'NORTH_AMERICAN', 'SOUTH_AMERICAN', 'OCEANIAN'
  ];
  
  const eras: HistoricalEra[] = [
    'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN',
    'INDUSTRIAL_ERA', 'MODERN_ERA'
  ];
  
  const handleEnterMap = () => {
    const config: SpecialMapConfig = {
      archetype: selectedArchetype,
      culturalZone: selectedZone as CulturalZone,
      era: selectedEra,
      specificYear: gameDate.year,
      region: 'Test Region',
      mapSize: 'medium'
    };
    
    // Call enterSpecialMap directly
    // The MapContext will handle caching the current map
    enterSpecialMap(config);
    onClose();
  };
  
  const specialMapSymbols = [
    { Component: WallSymbol, name: 'Wall', biome: BiomeType.WALL },
    { Component: FloorSymbol, name: 'Stone Floor', biome: BiomeType.FLOOR_STONE, props: { material: 'stone' } },
    { Component: FloorSymbol, name: 'Wood Floor', biome: BiomeType.FLOOR_WOOD, props: { material: 'wood' } },
    { Component: FloorSymbol, name: 'Marble Floor', biome: BiomeType.FLOOR_MARBLE, props: { material: 'marble' } },
    { Component: FloorSymbol, name: 'Tile Floor', biome: BiomeType.FLOOR_TILE, props: { material: 'tile' } },
    { Component: TableSymbol, name: 'Table', biome: BiomeType.TABLE },
    { Component: ChairSymbol, name: 'Chair', biome: BiomeType.CHAIR },
    { Component: ThroneSymbol, name: 'Throne', biome: BiomeType.THRONE },
    { Component: AltarSymbol, name: 'Altar', biome: BiomeType.ALTAR },
    { Component: BedSymbol, name: 'Bed', biome: BiomeType.BED },
    { Component: BookshelfSymbol, name: 'Bookshelf', biome: BiomeType.BOOKSHELF },
    { Component: CarpetSymbol, name: 'Carpet', biome: BiomeType.CARPET },
    { Component: DeskSymbol, name: 'Desk', biome: BiomeType.DESK },
    { Component: FountainSymbol, name: 'Fountain', biome: BiomeType.FOUNTAIN },
    { Component: PillarSymbol, name: 'Pillar', biome: BiomeType.PILLAR },
    { Component: ShrineSymbol, name: 'Shrine', biome: BiomeType.SHRINE },
    { Component: StatueSymbol, name: 'Statue', biome: BiomeType.STATUE }
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