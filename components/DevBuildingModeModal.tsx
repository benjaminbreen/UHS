/**
 * components/DevBuildingModeModal.tsx - A simplified reference grid of all map symbols
 * Shows visual representations without complex game logic
 */
import React, { useState } from 'react';
import { BiomeType, ClimateType, TimeOfDay } from '../types';
import HorizonLayer from './HorizonLayer';

// Import all the symbols we want to display - Using the ACTUAL symbols from the game
import UrbanSymbolSimplified from './symbols/UrbanSymbolSimplified';
import { getPalaceSymbol } from './symbols/poi/PalaceSymbolsImproved';
import { getHolySiteSymbol } from './symbols/poi/HolySiteSymbolsImproved';
import LumberCampSymbol from './symbols/structures/LumberCampSymbol';
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
import FishingHutSymbol from './symbols/FishingHutSymbol';
import GovernmentDistrictSymbol from './symbols/GovernmentDistrictSymbol';

// Import mining and quarry symbols
import { getMineSymbol } from './symbols/mines/MineSymbols';
import { getQuarrySymbol } from './symbols/quarries/QuarrySymbols';

// Government building symbols - using individual modular files
import CityHallSymbol from './symbols/government/CityHallSymbol';
import TownHallSymbol from './symbols/government/TownHallSymbol';
import AdminCenterSymbol from './symbols/government/AdminCenterSymbol';
import TribalCouncilSymbol from './symbols/government/TribalCouncilSymbol';
import MandateHallSymbol from './symbols/government/MandateHallSymbol';
import CaliphCourtSymbol from './symbols/government/CaliphCourtSymbol';
import ColonialOfficeSymbol from './symbols/government/ColonialOfficeSymbol';
import RomanForumSymbol from './symbols/government/RomanForumSymbol';
import FeudalHallSymbol from './symbols/government/FeudalHallSymbol';
import SovietMinistrySymbol from './symbols/government/SovietMinistrySymbol';
import AztecPalaceSymbol from './symbols/government/AztecPalaceSymbol';
import OceanianMeetingHouseSymbol from './symbols/government/OceanianMeetingHouseSymbol';
import AgoraSymbol from './symbols/government/AgoraSymbol';
import ShogunateSymbol from './symbols/government/ShogunateSymbol';

// Building types from buildings folder - ALL current building types
import {
  AboriginalHut3D,
  AdobeBuilding3D,
  AfricanRoundHut3D,
  AfricanSacredGrove3D,
  AfricanStoneBuilding3D,
  AztecDwelling3D,
  BambooHouse3D,
  BarkLonghouse3D,
  BuddhistTemple3D,
  ChristianChurch3D,
  EastAsianPagoda3D,
  EgyptianBuilding3D,
  EuropeanCottage3D,
  GeorgianRowhouse3D,
  GreekHouse3D,
  HinduTemple3D,
  Igloo3D,
  IncaStoneHouse3D,
  IndustrialBuilding3D,
  IndustrialRowhouse3D,
  IslamicMosque3D,
  JapaneseHouse3D,
  Longhouse3D,
  MedievalBuilding3D,
  MediterraneanBuilding3D,
  MesopotamianBuilding3D,
  ModernCivic3D,
  ModernSkyscraper3D,
  NativeTeepee3D,
  OttomanTownhouse3D,
  PolynesianHouse3D,
  PrehistoricShelter3D,
  RomanInsula3D,
  RomanVilla3D,
  SouthAsianBuilding3D,
  SouthAsianTemple3D,
  StiltHouse3D,
  SacredFire3D,
  VikingLonghouse3D,
  Yurt3D,
} from './symbols/buildings';

// Factory symbols
import { 
  PlantationSymbol, 
  WarehouseSymbol, 
  ManufactorySymbol, 
  RefinerySymbol, 
  Factory19thSymbol, 
  Factory20thSymbol 
} from './symbols/factories/FactorySymbols';

// Mill symbols
import {
  HandQuernSymbol,
  AnimalMillSymbol,
  WaterMillSymbol,
  WindmillSymbol,
  TidalMillSymbol,
  SteamMillSymbol,
  ElectricMillSymbol,
  SugarMillSymbol
} from './symbols/mills/MillSymbols';

// Fortress symbols - using improved versions
import {
  HillfortSymbol,
  CastrumSymbol,
  MedievalCastleSymbol,
  StarFortSymbol,
  PresidioSymbol,
  ModernFortSymbol,
  JapaneseFortressSymbol
} from './symbols/fortresses/FortressSymbolsImproved';

interface DevBuildingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SymbolDisplayItem {
  name: string;
  component: React.ComponentType<any> | ((props: any) => JSX.Element);
  category: 'urban' | 'structure' | 'palace' | 'holy' | 'nature' | 'terrain' | 'government' | 'buildings' | 'factory' | 'mill' | 'fortress';
  biomeType?: string; // For urban symbols to specify density
  customProps?: any; // For components that need specific props
  sizeOverride?: number; // Override the default size for specific symbols
}

// Create a simple wrapper to render symbols safely
const SafeSymbolWrapper: React.FC<{ 
  component: React.ComponentType<any> | ((props: any) => JSX.Element); 
  name: string;
  customProps?: any;
  sizeOverride?: number;
}> = ({ component: Component, name, customProps, sizeOverride }) => {
  // Determine appropriate size based on category
  const getSize = () => {
    if (sizeOverride) return sizeOverride;
    if (name.includes('Dense City')) return 50;
    if (name.includes('Low Density')) return 40;
    if (name.includes('Hamlet')) return 30;
    if (name.includes('Palace') || name.includes('Holy')) return 45;
    if (name.includes('Building')) return 35;
    return 40; // default size
  };
  
  const size = getSize();
  
  // Create minimal safe props that won't cause errors
  const safeProps = {
    x: 0,
    y: 0,
    size,
    seed: Math.floor(Math.random() * 10000),
    // Minimal tile data to prevent errors
    tile: {
      x: 0,
      y: 0,
      biome: name.includes('Hamlet') ? BiomeType.HAMLET :
             name.includes('Low Density') ? BiomeType.LOW_DENSITY_CITY :
             name.includes('Dense City') ? BiomeType.DENSE_CITY :
             BiomeType.GRASSLAND,
      isLand: true,
      temperature: 20,
      humidity: 50,
      elevation: 0.5,
      holyPlaceReligion: 'Generic',
      altitude: 0.5,
      qualities: {
        flammability: 0.5,
        biodiversity: 0.5,
        healthiness: 0.5,
        sacrality: 0.5,
        safety: 0.5
      }
    },
    date: '1500 CE',
    zone: 'Europe',
    era: 'MEDIEVAL',
    culture: 'EUROPEAN',
    climate: 'temperate',
    // Additional props for building symbols
    sizeModifier: 1,
    height: 10,
    width: 8,
    nightIntensity: 0,
    // Props specifically for 3D building symbols
    baseColor: '#8b7355',
    variant: 0,
    density: name.includes('Dense') ? 'high' : name.includes('Low') ? 'low' : 'medium'
  };

  try {
    // Handle function components that return elements directly
    if (typeof Component === 'function' && customProps) {
      const element = Component(customProps);
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
          <g transform="translate(40, 40)">
            {element}
          </g>
        </svg>
      );
    }
    
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
        <g transform="translate(40, 40)">
          <Component {...safeProps} />
        </g>
      </svg>
    );
  } catch (error) {
    console.warn(`Failed to render ${name}:`, error);
    return (
      <div className="w-[80px] h-[80px] bg-red-900/20 border border-red-500/50 rounded flex items-center justify-center text-xs text-red-400">
        ❌
      </div>
    );
  }
};

// Helper components for palace and holy site symbols
const PalaceWrapper = (props: any) => getPalaceSymbol(props);
const HolySiteWrapper = (props: any) => getHolySiteSymbol(props);

const symbolItems: SymbolDisplayItem[] = [
  // Urban Symbols - Using the actual simplified urban symbol from the game
  { name: 'Hamlet', component: UrbanSymbolSimplified, category: 'urban', biomeType: 'HAMLET', sizeOverride: 30 },
  { name: 'Low Density City', component: UrbanSymbolSimplified, category: 'urban', biomeType: 'LOW_DENSITY_CITY', sizeOverride: 40 },
  { name: 'Dense City', component: UrbanSymbolSimplified, category: 'urban', biomeType: 'DENSE_CITY', sizeOverride: 50 },
  
  // Major Structures - From the actual game
  { name: 'Marketplace', component: MarketplaceSymbol, category: 'structure', sizeOverride: 40 },
  { name: 'Farm', component: FarmSymbol, category: 'structure', sizeOverride: 35 },
  { name: 'Ruins', component: RuinsSymbol, category: 'structure', sizeOverride: 40 },
  { name: 'Fishing Hut', component: FishingHutSymbol, category: 'structure', sizeOverride: 35 },
  { name: 'Government District', component: GovernmentDistrictSymbol, category: 'structure', sizeOverride: 45 },
  { name: 'Lumber Camp', component: LumberCampSymbol, category: 'structure', sizeOverride: 40 },
  { name: 'Medieval Mine', component: getMineSymbol('MEDIEVAL'), category: 'structure', sizeOverride: 40 },
  { name: 'Industrial Mine', component: getMineSymbol('INDUSTRIAL_ERA'), category: 'structure', sizeOverride: 40 },
  { name: 'Medieval Quarry', component: getQuarrySymbol('MEDIEVAL'), category: 'structure', sizeOverride: 40 },
  { name: 'Industrial Quarry', component: getQuarrySymbol('INDUSTRIAL_ERA'), category: 'structure', sizeOverride: 40 },
  
  // Palace Variants - Using the improved palace symbols from the game
  { name: 'European Palace', component: PalaceWrapper, category: 'palace', 
    customProps: { x: 0, y: 0, size: 45, zone: 'Europe', era: 'MEDIEVAL', culture: 'EUROPEAN' }, sizeOverride: 45 },
  { name: 'Asian Palace', component: PalaceWrapper, category: 'palace',
    customProps: { x: 0, y: 0, size: 45, zone: 'East Asia', era: 'MEDIEVAL', culture: 'EAST_ASIAN' }, sizeOverride: 45 },
  { name: 'Middle Eastern Palace', component: PalaceWrapper, category: 'palace',
    customProps: { x: 0, y: 0, size: 45, zone: 'Middle East', era: 'MEDIEVAL', culture: 'MENA' }, sizeOverride: 45 },
  { name: 'African Palace', component: PalaceWrapper, category: 'palace',
    customProps: { x: 0, y: 0, size: 45, zone: 'West Africa', era: 'MEDIEVAL', culture: 'SUB_SAHARAN_AFRICAN' }, sizeOverride: 45 },
  { name: 'American Palace', component: PalaceWrapper, category: 'palace',
    customProps: { x: 0, y: 0, size: 45, zone: 'Mexico', era: 'RENAISSANCE_EARLY_MODERN', culture: 'NORTH_AMERICAN_PRE_COLUMBIAN' }, sizeOverride: 45 },
  
  // Holy Sites - Using the improved holy site symbols from the game
  { name: 'Christian Church', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'Europe', era: 'MEDIEVAL', culture: 'EUROPEAN', religion: 'christian' }, sizeOverride: 40 },
  { name: 'Cathedral', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 45, zone: 'Europe', era: 'RENAISSANCE_EARLY_MODERN', culture: 'EUROPEAN', religion: 'christian', isLarge: true }, sizeOverride: 45 },
  { name: 'Islamic Mosque', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'Middle East', era: 'MEDIEVAL', culture: 'MENA', religion: 'islamic' }, sizeOverride: 40 },
  { name: 'Buddhist Temple', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'East Asia', era: 'MEDIEVAL', culture: 'EAST_ASIAN', religion: 'buddhist' }, sizeOverride: 40 },
  { name: 'Hindu Temple', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'South Asia', era: 'MEDIEVAL', culture: 'SOUTH_ASIAN', religion: 'hindu' }, sizeOverride: 40 },
  { name: 'Shinto Shrine', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'Japan', era: 'MEDIEVAL', culture: 'EAST_ASIAN', religion: 'shinto' }, sizeOverride: 40 },
  { name: 'Jewish Synagogue', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'Europe', era: 'MEDIEVAL', culture: 'EUROPEAN', religion: 'jewish' }, sizeOverride: 40 },
  { name: 'African Sacred Grove', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'West Africa', era: 'MEDIEVAL', culture: 'SUB_SAHARAN_AFRICAN', religion: 'traditional_african' }, sizeOverride: 40 },
  { name: 'Mesoamerican Pyramid', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 45, zone: 'Mexico', era: 'MEDIEVAL', culture: 'NORTH_AMERICAN_PRE_COLUMBIAN', religion: 'mesoamerican' }, sizeOverride: 45 },
  { name: 'Standing Stones', component: HolySiteWrapper, category: 'holy',
    customProps: { x: 0, y: 0, size: 40, zone: 'Europe', era: 'PREHISTORY', culture: 'EUROPEAN', religion: 'pagan' }, sizeOverride: 40 },
  
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
  
  // Government Buildings - All current modular symbols
  { name: 'City Hall', component: CityHallSymbol, category: 'government' },
  { name: 'Town Hall', component: TownHallSymbol, category: 'government' },
  { name: 'Admin Center', component: AdminCenterSymbol, category: 'government' },
  { name: 'Tribal Council', component: TribalCouncilSymbol, category: 'government' },
  { name: 'Mandate Hall', component: MandateHallSymbol, category: 'government' },
  { name: 'Caliph Court', component: CaliphCourtSymbol, category: 'government' },
  { name: 'Colonial Office', component: ColonialOfficeSymbol, category: 'government' },
  { name: 'Roman Forum', component: RomanForumSymbol, category: 'government' },
  { name: 'Feudal Hall', component: FeudalHallSymbol, category: 'government' },
  { name: 'Soviet Ministry', component: SovietMinistrySymbol, category: 'government' },
  { name: 'Aztec Palace', component: AztecPalaceSymbol, category: 'government' },
  { name: 'Oceanian Meeting House', component: OceanianMeetingHouseSymbol, category: 'government' },
  { name: 'Agora', component: AgoraSymbol, category: 'government' },
  { name: 'Shogunate', component: ShogunateSymbol, category: 'government' },
  
  // Cultural Buildings - ALL current types
  { name: 'Aboriginal Hut', component: AboriginalHut3D, category: 'buildings' },
  { name: 'Adobe Building', component: AdobeBuilding3D, category: 'buildings' },
  { name: 'African Round Hut', component: AfricanRoundHut3D, category: 'buildings' },
  { name: 'African Sacred Grove', component: AfricanSacredGrove3D, category: 'buildings' },
  { name: 'African Stone Building', component: AfricanStoneBuilding3D, category: 'buildings' },
  { name: 'Aztec Dwelling', component: AztecDwelling3D, category: 'buildings' },
  { name: 'Bamboo House', component: BambooHouse3D, category: 'buildings' },
  { name: 'Bark Longhouse', component: BarkLonghouse3D, category: 'buildings' },
  { name: 'Buddhist Temple', component: BuddhistTemple3D, category: 'buildings' },
  { name: 'Christian Church', component: ChristianChurch3D, category: 'buildings' },
  { name: 'East Asian Pagoda', component: EastAsianPagoda3D, category: 'buildings' },
  { name: 'Egyptian Building', component: EgyptianBuilding3D, category: 'buildings' },
  { name: 'European Cottage', component: EuropeanCottage3D, category: 'buildings' },
  { name: 'Georgian Rowhouse', component: GeorgianRowhouse3D, category: 'buildings' },
  { name: 'Greek House', component: GreekHouse3D, category: 'buildings' },
  { name: 'Hindu Temple', component: HinduTemple3D, category: 'buildings' },
  { name: 'Igloo', component: Igloo3D, category: 'buildings' },
  { name: 'Inca Stone House', component: IncaStoneHouse3D, category: 'buildings' },
  { name: 'Industrial Building', component: IndustrialBuilding3D, category: 'buildings' },
  { name: 'Industrial Rowhouse', component: IndustrialRowhouse3D, category: 'buildings' },
  { name: 'Islamic Mosque', component: IslamicMosque3D, category: 'buildings' },
  { name: 'Japanese House', component: JapaneseHouse3D, category: 'buildings' },
  { name: 'Longhouse', component: Longhouse3D, category: 'buildings' },
  { name: 'Medieval Building', component: MedievalBuilding3D, category: 'buildings' },
  { name: 'Mediterranean Building', component: MediterraneanBuilding3D, category: 'buildings' },
  { name: 'Mesopotamian Building', component: MesopotamianBuilding3D, category: 'buildings' },
  { name: 'Modern Civic', component: ModernCivic3D, category: 'buildings' },
  { name: 'Modern Skyscraper', component: ModernSkyscraper3D, category: 'buildings' },
  { name: 'Native Teepee', component: NativeTeepee3D, category: 'buildings' },
  { name: 'Ottoman Townhouse', component: OttomanTownhouse3D, category: 'buildings' },
  { name: 'Polynesian House', component: PolynesianHouse3D, category: 'buildings' },
  { name: 'Prehistoric Shelter', component: PrehistoricShelter3D, category: 'buildings' },
  { name: 'Roman Insula', component: RomanInsula3D, category: 'buildings' },
  { name: 'Roman Villa', component: RomanVilla3D, category: 'buildings' },
  { name: 'South Asian Building', component: SouthAsianBuilding3D, category: 'buildings' },
  { name: 'South Asian Temple', component: SouthAsianTemple3D, category: 'buildings' },
  { name: 'Stilt House', component: StiltHouse3D, category: 'buildings' },
  { name: 'Sacred Fire', component: SacredFire3D, category: 'buildings' },
  { name: 'Viking Longhouse', component: VikingLonghouse3D, category: 'buildings' },
  { name: 'Yurt', component: Yurt3D, category: 'buildings' },
  
  // Factory Types
  { name: 'Plantation', component: PlantationSymbol, category: 'factory' },
  { name: 'Warehouse', component: WarehouseSymbol, category: 'factory' },
  { name: 'Manufactory', component: ManufactorySymbol, category: 'factory' },
  { name: 'Refinery', component: RefinerySymbol, category: 'factory' },
  { name: '19th Century Factory', component: Factory19thSymbol, category: 'factory' },
  { name: '20th Century Factory', component: Factory20thSymbol, category: 'factory' },
  
  // Mill Types
  { name: 'Hand Quern', component: HandQuernSymbol, category: 'mill' },
  { name: 'Animal Mill', component: AnimalMillSymbol, category: 'mill' },
  { name: 'Water Mill', component: WaterMillSymbol, category: 'mill' },
  { name: 'Windmill', component: WindmillSymbol, category: 'mill' },
  { name: 'Tidal Mill', component: TidalMillSymbol, category: 'mill' },
  { name: 'Steam Mill', component: SteamMillSymbol, category: 'mill' },
  { name: 'Electric Mill', component: ElectricMillSymbol, category: 'mill' },
  { name: 'Sugar Mill', component: SugarMillSymbol, category: 'mill' },
  
  // Fortress Types
  { name: 'Hillfort', component: HillfortSymbol, category: 'fortress' },
  { name: 'Roman Castrum', component: CastrumSymbol, category: 'fortress' },
  { name: 'Medieval Castle', component: MedievalCastleSymbol, category: 'fortress' },
  { name: 'Star Fort', component: StarFortSymbol, category: 'fortress' },
  { name: 'Colonial Presidio', component: PresidioSymbol, category: 'fortress' },
  { name: 'Modern Fort', component: ModernFortSymbol, category: 'fortress' },
  { name: 'Japanese Fortress', component: JapaneseFortressSymbol, category: 'fortress' },
];

const categoryLabels = {
  urban: '🏘️ Urban & Settlements',
  structure: '🏛️ Major Structures',
  palace: '👑 Palace Variants',
  holy: '⛪ Holy Sites',
  nature: '🌿 Nature Elements',
  terrain: '⛰️ Terrain Features',
  government: '🏛️ Government Buildings',
  buildings: '🏠 Cultural Buildings',
  factory: '🏭 Production Facilities',
  mill: '⚙️ Mills & Processing',
  fortress: '🏰 Fortresses & Defense'
};

const DevBuildingModeModal: React.FC<DevBuildingModeModalProps> = ({ isOpen, onClose }) => {
  // State for horizon preview controls
  const [selectedClimate, setSelectedClimate] = useState<ClimateType>(ClimateType.TEMPERATE);
  const [selectedTime, setSelectedTime] = useState<TimeOfDay>('Day');
  const [hasWater, setHasWater] = useState(false);
  
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
          
          {/* Horizon Layer Preview Section */}
          <div className="mb-8 bg-slate-800/40 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-400 mb-4">Horizon Layer Previews</h3>
            
            {/* Controls for testing */}
            <div className="flex gap-4 mb-4 flex-wrap">
              <select 
                className="bg-slate-700 text-white px-3 py-1 rounded"
                onChange={(e) => setSelectedClimate(e.target.value as ClimateType)}
                defaultValue={ClimateType.TEMPERATE}
              >
                <option value={ClimateType.TEMPERATE}>Temperate</option>
                <option value={ClimateType.TROPICAL}>Tropical</option>
                <option value={ClimateType.ARID}>Arid</option>
                <option value={ClimateType.COLD}>Cold</option>
                <option value={ClimateType.MEDITERRANEAN}>Mediterranean</option>
                <option value={ClimateType.SEMITROPICAL}>Semitropical</option>
              </select>
              
              <select 
                className="bg-slate-700 text-white px-3 py-1 rounded"
                onChange={(e) => setSelectedTime(e.target.value as TimeOfDay)}
                defaultValue="Day"
              >
                <option value="Dawn">Dawn</option>
                <option value="Day">Day</option>
                <option value="Midday">Midday</option>
                <option value="Dusk">Dusk</option>
                <option value="Night">Night</option>
              </select>
              
              <label className="flex items-center gap-2 text-white">
                <input 
                  type="checkbox" 
                  onChange={(e) => setHasWater(e.target.checked)}
                  className="rounded"
                />
                Has Water
              </label>
            </div>
            
            {/* Horizon preview grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Current configuration */}
              <div className="bg-slate-900/50 border border-slate-600 rounded p-2">
                <div className="text-xs text-cyan-400 mb-1">
                  {selectedClimate} - {selectedTime} - {hasWater ? 'Water' : 'Land'}
                </div>
                <div className="w-full h-24 bg-gradient-to-b from-slate-700 to-slate-800 rounded relative overflow-hidden">
                  <HorizonLayer
                    climate={selectedClimate}
                    timeOfDay={selectedTime}
                    hasWater={hasWater}
                    width={800}
                    height={96}
                  />
                </div>
              </div>
              
              {/* Show all climate variants in a grid */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">All Climate Variants:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    ClimateType.TEMPERATE,
                    ClimateType.TROPICAL, 
                    ClimateType.ARID,
                    ClimateType.COLD,
                    ClimateType.MEDITERRANEAN,
                    ClimateType.SEMITROPICAL
                  ].map(climate => (
                    <div key={climate} className="bg-slate-900/50 border border-slate-600 rounded p-2">
                      <div className="text-xs text-cyan-400 mb-1">{climate}</div>
                      <div className="w-full h-16 bg-gradient-to-b from-slate-700 to-slate-800 rounded relative overflow-hidden">
                        <HorizonLayer
                          climate={climate}
                          timeOfDay={selectedTime}
                          hasWater={hasWater}
                          width={300}
                          height={64}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
                    <div className="w-full aspect-square mb-2 bg-slate-700/30 rounded border border-slate-600 flex items-center justify-center overflow-hidden">
                      <SafeSymbolWrapper 
                        component={symbol.component} 
                        name={symbol.name} 
                        customProps={symbol.customProps}
                        sizeOverride={symbol.sizeOverride}
                      />
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