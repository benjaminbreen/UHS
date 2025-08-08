/**
 * components/DevBuildingModeModal.tsx - A simplified reference grid of all map symbols
 * Shows visual representations without complex game logic
 */
import React from 'react';
import { BiomeType } from '../types';

// Import all the symbols we want to display
import UrbanSymbol from './symbols/UrbanSymbol';
import PalaceSymbol from './PalaceSymbol';
import HolyPlaceSymbol from './HolyPlaceSymbol';
import MarketplaceSymbol from './symbols/MarketplaceSymbol';
import RuinsSymbol from './symbols/RuinsSymbol';
import FarmSymbol from './symbols/FarmSymbol';
import EstuarySymbol from './symbols/EstuarySymbol';
import CoralReefSymbol from './symbols/CoralReefSymbol';
import SaltFlatsSymbol from './symbols/SaltFlatsSymbol';
import CliffSymbol from './symbols/CliffSymbol';
import MangroveSymbol from './symbols/MangroveSymbol';
import CactusSymbol from './symbols/CactusSymbol';
import BushSymbol from './symbols/BushSymbol';
import DeciduousTreeSymbol from './symbols/DeciduousTreeSymbol';
import PineTreeSymbol from './symbols/PineTreeSymbol';
import PalmTreeSymbol from './symbols/PalmTreeSymbol';
import HillSymbol from './symbols/HillSymbol';

// POI-specific symbols
import ZigguratSymbol from './symbols/poi/ZigguratSymbol';
import VikingHallSymbol from './symbols/poi/VikingHallSymbol';
import StandingStoneSymbol from './symbols/poi/StandingStoneSymbol';
import ShrineSymbol from './symbols/poi/ShrineSymbol';
import RomanVillaSymbol from './symbols/poi/RomanVillaSymbol';
import PyramidSymbol from './symbols/poi/PyramidSymbol';
import PagodaSymbol from './symbols/poi/PagodaSymbol';
import OttomanMosqueSymbol from './symbols/poi/OttomanMosqueSymbol';
import MesoamericanPyramidSymbol from './symbols/poi/MesoamericanPyramidSymbol';
import JapaneseCastleSymbol from './symbols/poi/JapaneseCastleSymbol';
import GenericPalaceSymbol from './symbols/poi/GenericPalaceSymbol';
import GenericMosqueSymbol from './symbols/poi/GenericMosqueSymbol';
import GenericChurchSymbol from './symbols/poi/GenericChurchSymbol';
import FeudalKeepSymbol from './symbols/poi/FeudalKeepSymbol';
import CathedralSymbol from './symbols/poi/CathedralSymbol';
import BaroqueChurchSymbol from './symbols/poi/BaroqueChurchSymbol';
import BuddhistTempleSymbol from './symbols/poi/BuddhistTempleSymbol';
import HinduTempleSymbol from './symbols/poi/HinduTempleSymbol';
import ShintoShrineSymbol from './symbols/poi/ShintoShrineSymbol';
import SynagogueSymbol from './symbols/poi/SynagogueSymbol';

interface DevBuildingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SymbolDisplayItem {
  name: string;
  component: React.ComponentType<any>;
  category: 'urban' | 'structure' | 'palace' | 'holy' | 'nature' | 'terrain';
}

// Create a simple wrapper to render symbols safely
const SafeSymbolWrapper: React.FC<{ component: React.ComponentType<any>; name: string }> = ({ component: Component, name }) => {
  // Create minimal safe props that won't cause errors
  const safeProps = {
    x: 0,
    y: 0,
    size: 40,
    seed: Math.floor(Math.random() * 10000),
    // Minimal tile data to prevent errors
    tile: {
      x: 0,
      y: 0,
      biome: BiomeType.GRASSLAND,
      isLand: true,
      temperature: 20,
      humidity: 50,
      elevation: 0.5,
      holyPlaceReligion: 'Generic'
    },
    date: '1500 CE',
    zone: 'Europe',
    era: 'MEDIEVAL',
    culture: 'EUROPEAN',
    climate: 'temperate'
  };

  try {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <Component {...safeProps} />
      </svg>
    );
  } catch (error) {
    console.warn(`Failed to render ${name}:`, error);
    return (
      <div className="w-10 h-10 bg-red-900/20 border border-red-500/50 rounded flex items-center justify-center text-xs text-red-400">
        ❌
      </div>
    );
  }
};

const symbolItems: SymbolDisplayItem[] = [
  // Urban Symbols
  { name: 'Hamlet', component: UrbanSymbol, category: 'urban' },
  { name: 'Low Density City', component: UrbanSymbol, category: 'urban' },
  { name: 'Medium Density City', component: UrbanSymbol, category: 'urban' },
  { name: 'High Density City', component: UrbanSymbol, category: 'urban' },
  
  // Major Structures
  { name: 'Marketplace', component: MarketplaceSymbol, category: 'structure' },
  { name: 'Farm', component: FarmSymbol, category: 'structure' },
  { name: 'Ruins', component: RuinsSymbol, category: 'structure' },
  
  // Palace Variants
  { name: 'Generic Palace', component: GenericPalaceSymbol, category: 'palace' },
  { name: 'Japanese Castle', component: JapaneseCastleSymbol, category: 'palace' },
  { name: 'Feudal Keep', component: FeudalKeepSymbol, category: 'palace' },
  { name: 'Roman Villa', component: RomanVillaSymbol, category: 'palace' },
  { name: 'Viking Hall', component: VikingHallSymbol, category: 'palace' },
  
  // Holy Sites
  { name: 'Cathedral', component: CathedralSymbol, category: 'holy' },
  { name: 'Baroque Church', component: BaroqueChurchSymbol, category: 'holy' },
  { name: 'Generic Church', component: GenericChurchSymbol, category: 'holy' },
  { name: 'Generic Mosque', component: GenericMosqueSymbol, category: 'holy' },
  { name: 'Ottoman Mosque', component: OttomanMosqueSymbol, category: 'holy' },
  { name: 'Buddhist Temple', component: BuddhistTempleSymbol, category: 'holy' },
  { name: 'Hindu Temple', component: HinduTempleSymbol, category: 'holy' },
  { name: 'Shinto Shrine', component: ShintoShrineSymbol, category: 'holy' },
  { name: 'Synagogue', component: SynagogueSymbol, category: 'holy' },
  { name: 'Pagoda', component: PagodaSymbol, category: 'holy' },
  { name: 'Ziggurat', component: ZigguratSymbol, category: 'holy' },
  { name: 'Pyramid', component: PyramidSymbol, category: 'holy' },
  { name: 'Mesoamerican Pyramid', component: MesoamericanPyramidSymbol, category: 'holy' },
  { name: 'Shrine', component: ShrineSymbol, category: 'holy' },
  { name: 'Standing Stone', component: StandingStoneSymbol, category: 'holy' },
  
  // Nature Elements
  { name: 'Deciduous Tree', component: DeciduousTreeSymbol, category: 'nature' },
  { name: 'Pine Tree', component: PineTreeSymbol, category: 'nature' },
  { name: 'Palm Tree', component: PalmTreeSymbol, category: 'nature' },
  { name: 'Mangrove', component: MangroveSymbol, category: 'nature' },
  { name: 'Cactus', component: CactusSymbol, category: 'nature' },
  { name: 'Bush', component: BushSymbol, category: 'nature' },
  
  // Terrain Features
  { name: 'Hills', component: HillSymbol, category: 'terrain' },
  { name: 'Cliff', component: CliffSymbol, category: 'terrain' },
  { name: 'Salt Flats', component: SaltFlatsSymbol, category: 'terrain' },
  { name: 'Estuary', component: EstuarySymbol, category: 'terrain' },
  { name: 'Coral Reef', component: CoralReefSymbol, category: 'terrain' },
];

const categoryLabels = {
  urban: '🏘️ Urban & Settlements',
  structure: '🏛️ Major Structures',
  palace: '👑 Palace Variants',
  holy: '⛪ Holy Sites',
  nature: '🌿 Nature Elements',
  terrain: '⛰️ Terrain Features'
};

const DevBuildingModeModal: React.FC<DevBuildingModeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categorizedSymbols = symbolItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SymbolDisplayItem[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-4 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            Dev Building Mode - Visual Symbol Reference
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-white transition-colors"
            aria-label="Close symbol reference"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <p className="text-slate-300 mb-6 text-sm">
            Visual reference of all map symbols. Note: These are simplified representations for development purposes.
          </p>

          {/* Symbol Grid by Category */}
          {Object.entries(categorizedSymbols).map(([category, symbols]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                {categoryLabels[category as keyof typeof categoryLabels]}
                <span className="text-sm text-slate-500">({symbols.length} items)</span>
              </h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {symbols.map((symbol, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="bg-slate-800/40 border border-slate-700 rounded-lg p-2 hover:border-slate-500 transition-colors"
                  >
                    {/* Symbol Display */}
                    <div className="w-full aspect-square mb-2 bg-slate-700/30 rounded border border-slate-600 flex items-center justify-center">
                      <SafeSymbolWrapper component={symbol.component} name={symbol.name} />
                    </div>
                    
                    {/* Symbol Name */}
                    <h4 className="text-xs font-medium text-white text-center leading-tight">
                      {symbol.name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              This is a development tool for viewing all available symbols in the game.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DevBuildingModeModal;