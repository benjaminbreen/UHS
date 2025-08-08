/**
 * components/DevBuildingModeModal.tsx - A comprehensive reference grid of all map symbols
 */
import React from 'react';
import { BiomeType, TerrainStructureType } from '../types';

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
import POISymbol from './POISymbol';

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
  codeName: string;
  component: React.ComponentType<any>;
  category: 'biome' | 'structure' | 'poi_palace' | 'poi_holy' | 'terrain_feature';
  props?: any;
}

// Helper function to create standard props for symbols
const createStandardProps = (biome?: BiomeType, holyPlaceReligion?: string) => ({
  x: 0, 
  y: 0, 
  size: 48, 
  seed: 12345, 
  tile: { 
    biome: biome || BiomeType.GRASSLAND, 
    holyPlaceReligion 
  } as any, 
  date: '1500 CE', 
  zone: 'Europe' 
});

// Helper function for simple POI props (just x, y, size, seed, tile)
const createPOIProps = (biome?: BiomeType) => ({
  x: 0, 
  y: 0, 
  size: 48, 
  seed: 12345, 
  tile: { biome: biome || BiomeType.GRASSLAND } as any
});

const symbolItems: SymbolDisplayItem[] = [
  // Urban/Settlement Symbols
  {
    name: 'Hamlet',
    codeName: 'BiomeType.HAMLET',
    component: UrbanSymbol,
    category: 'biome',
    props: createStandardProps(BiomeType.HAMLET)
  },
  {
    name: 'Low Density City',
    codeName: 'BiomeType.LOW_DENSITY_CITY',
    component: UrbanSymbol,
    category: 'biome',
    props: createStandardProps(BiomeType.LOW_DENSITY_CITY)
  },
  {
    name: 'Dense City',
    codeName: 'BiomeType.DENSE_CITY',
    component: UrbanSymbol,
    category: 'biome',
    props: createStandardProps(BiomeType.DENSE_CITY)
  },
  {
    name: 'Marketplace',
    codeName: 'BiomeType.MARKETPLACE',
    component: MarketplaceSymbol,
    category: 'biome',
    props: createStandardProps(BiomeType.MARKETPLACE)
  },

  // Structure Symbols
  {
    name: 'Palace',
    codeName: 'BiomeType.PALACE',
    component: PalaceSymbol,
    category: 'structure',
    props: createStandardProps(BiomeType.PALACE)
  },
  {
    name: 'Holy Site',
    codeName: 'BiomeType.HOLY_SITE',
    component: HolyPlaceSymbol,
    category: 'structure',
    props: createStandardProps(BiomeType.HOLY_SITE, 'Christianity')
  },
  {
    name: 'Ruins',
    codeName: 'BiomeType.RUINS',
    component: RuinsSymbol,
    category: 'structure',
    props: createStandardProps(BiomeType.RUINS)
  },
  {
    name: 'Farmland',
    codeName: 'BiomeType.FARMLAND',
    component: FarmSymbol,
    category: 'structure',
    props: createStandardProps(BiomeType.FARMLAND)
  },

  // Palace POI Variants
  {
    name: 'Generic Palace',
    codeName: 'GenericPalaceSymbol',
    component: GenericPalaceSymbol,
    category: 'poi_palace',
    props: createPOIProps(BiomeType.PALACE)
  },
  {
    name: 'Japanese Castle',
    codeName: 'JapaneseCastleSymbol',
    component: JapaneseCastleSymbol,
    category: 'poi_palace',
    props: createPOIProps(BiomeType.PALACE)
  },
  {
    name: 'Feudal Keep',
    codeName: 'FeudalKeepSymbol',
    component: FeudalKeepSymbol,
    category: 'poi_palace',
    props: createPOIProps(BiomeType.PALACE)
  },
  {
    name: 'Roman Villa',
    codeName: 'RomanVillaSymbol',
    component: RomanVillaSymbol,
    category: 'poi_palace',
    props: createPOIProps(BiomeType.PALACE)
  },
  {
    name: 'Viking Hall',
    codeName: 'VikingHallSymbol',
    component: VikingHallSymbol,
    category: 'poi_palace',
    props: createPOIProps(BiomeType.PALACE)
  },

  // Holy Site POI Variants
  {
    name: 'Generic Church',
    codeName: 'GenericChurchSymbol',
    component: GenericChurchSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Cathedral',
    codeName: 'CathedralSymbol',
    component: CathedralSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Baroque Church',
    codeName: 'BaroqueChurchSymbol',
    component: BaroqueChurchSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Generic Mosque',
    codeName: 'GenericMosqueSymbol',
    component: GenericMosqueSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Ottoman Mosque',
    codeName: 'OttomanMosqueSymbol',
    component: OttomanMosqueSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Buddhist Temple',
    codeName: 'BuddhistTempleSymbol',
    component: BuddhistTempleSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Hindu Temple',
    codeName: 'HinduTempleSymbol',
    component: HinduTempleSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Shinto Shrine',
    codeName: 'ShintoShrineSymbol',
    component: ShintoShrineSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Synagogue',
    codeName: 'SynagogueSymbol',
    component: SynagogueSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Pagoda',
    codeName: 'PagodaSymbol',
    component: PagodaSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Ziggurat',
    codeName: 'ZigguratSymbol',
    component: ZigguratSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Pyramid',
    codeName: 'PyramidSymbol',
    component: PyramidSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Mesoamerican Pyramid',
    codeName: 'MesoamericanPyramidSymbol',
    component: MesoamericanPyramidSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Shrine',
    codeName: 'ShrineSymbol',
    component: ShrineSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },
  {
    name: 'Standing Stone',
    codeName: 'StandingStoneSymbol',
    component: StandingStoneSymbol,
    category: 'poi_holy',
    props: createPOIProps(BiomeType.HOLY_SITE)
  },

  // Terrain Features
  {
    name: 'Hills',
    codeName: 'BiomeType.HILLS',
    component: HillSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Deciduous Tree',
    codeName: 'DeciduousTreeSymbol',
    component: DeciduousTreeSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Pine Tree',
    codeName: 'PineTreeSymbol',
    component: PineTreeSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Palm Tree',
    codeName: 'PalmTreeSymbol',
    component: PalmTreeSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Mangrove',
    codeName: 'MangroveSymbol',
    component: MangroveSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Cactus',
    codeName: 'CactusSymbol',
    component: CactusSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Bush',
    codeName: 'BushSymbol',
    component: BushSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Salt Flats',
    codeName: 'SaltFlatsSymbol',
    component: SaltFlatsSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Cliff',
    codeName: 'CliffSymbol',
    component: CliffSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Estuary',
    codeName: 'EstuarySymbol',
    component: EstuarySymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  },
  {
    name: 'Coral Reef',
    codeName: 'CoralReefSymbol',
    component: CoralReefSymbol,
    category: 'terrain_feature',
    props: { size: 48 }
  }
];

const categoryLabels = {
  biome: '🏘️ Urban & Settlement Biomes',
  structure: '🏛️ Major Structures',
  poi_palace: '👑 Palace Variants',
  poi_holy: '⛪ Holy Site Variants',
  terrain_feature: '🌿 Terrain Features'
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
            Dev Building Mode - Symbol Reference
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
            This is a comprehensive reference of all map symbols used in the Universal History Simulator.
            Each symbol shows the in-game display name and its corresponding code reference.
          </p>

          {/* Symbol Grid by Category */}
          {Object.entries(categorizedSymbols).map(([category, symbols]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                {categoryLabels[category as keyof typeof categoryLabels]}
                <span className="text-sm text-slate-500">({symbols.length} items)</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {symbols.map((symbol, index) => {
                  const SymbolComponent = symbol.component;
                  return (
                    <div
                      key={index}
                      className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors"
                    >
                      {/* Symbol Display */}
                      <div className="w-12 h-12 mx-auto mb-2 bg-slate-700/30 rounded border border-slate-600 flex items-center justify-center">
                        <SymbolComponent {...(symbol.props || {})} />
                      </div>
                      
                      {/* Symbol Name */}
                      <h4 className="text-xs font-medium text-white text-center mb-1 leading-tight">
                        {symbol.name}
                      </h4>
                      
                      {/* Code Name */}
                      <p className="text-xs text-slate-400 text-center font-mono leading-tight break-all">
                        {symbol.codeName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Total symbols: {symbolItems.length} • Generated for development reference
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DevBuildingModeModal;