/**
 * components/HolySiteModal.tsx - Holy site exploration modal
 * Allows players to enter sacred complexes with full cultural specificity
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TerrainStructure, 
  Tile, 
  PlayerCharacter, 
  MapData,
  SpecialMapConfig,
  SimplifiedArchetype,
  CulturalZone,
  HistoricalEra 
} from '../types';
import { FaDoorOpen, FaTimes, FaPray, FaScroll, FaCoins, FaUser } from 'react-icons/fa';
import { HolySiteInteractions } from './HolySiteInteractions';
import { holySiteEconomyService } from '../services/holySiteEconomyService';
import { LazyPortrait } from './portraits';
import { getReligionForStructure } from '../constants/gameData/religions';
import { getHistoricalEra } from '../constants/gameData/historicalContext';

interface HolySiteModalProps {
  structure: TerrainStructure;
  tile: Tile;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  currentLocation: string;
  formattedDate: string | { year: number; month: number; day: number };
  gameTimeHours?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  onClose: () => void;
  onEnterSpecialMap?: (config: SpecialMapConfig) => void;
}

const HolySiteModal: React.FC<HolySiteModalProps> = ({
  structure,
  tile,
  playerCharacter,
  mapData,
  currentLocation,
  formattedDate,
  gameTimeHours = 12,
  season = 'summer',
  onClose,
  onEnterSpecialMap,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'treasury'>('overview');
  const panelRef = useRef<HTMLDivElement | null>(null);
  
  // Extract cultural context
  const culturalZone = (structure.customData?.culturalZone || mapData.culturalZone || 'EUROPEAN') as CulturalZone;
  const yearValue = typeof formattedDate === 'object' ? formattedDate.year : parseInt(formattedDate) || 1000;
  const era = getHistoricalEra(yearValue) as HistoricalEra;
  const religion = getReligionForStructure(structure, culturalZone, era);
  
  // Get economic data
  const [treasury, setTreasury] = useState<Record<string, number>>({});
  const [npcs, setNpcs] = useState<any[]>([]);
  
  useEffect(() => {
    const siteData = holySiteEconomyService.getHolySiteData(structure.id);
    if (siteData) {
      setTreasury(siteData.treasury || {});
      setNpcs(siteData.anchoredNpcs || []);
    }
  }, [structure.id]);

  // Determine sacred complex details based on culture and era
  const getSacredComplexName = () => {
    const baseNames: Record<string, Record<string, string[]>> = {
      EUROPEAN: {
        ancient: ['Temple of', 'Sacred Grove of', 'Stone Circle of'],
        classical: ['Temple of', 'Basilica of', 'Forum of'],
        medieval: ['Cathedral of', 'Abbey of', 'Monastery of'],
        earlyModern: ['Cathedral of', 'Church of', 'Chapel of'],
        modern: ['Cathedral of', 'Church of', 'Temple of'],
        future: ['Unity Temple of', 'Meditation Center of', 'Sacred Space of']
      },
      MENA: {
        ancient: ['Temple of', 'Ziggurat of', 'Sacred Precinct of'],
        classical: ['Temple of', 'Sanctuary of', 'Holy Site of'],
        medieval: ['Mosque of', 'Madrasa of', 'Zawiya of'],
        earlyModern: ['Mosque of', 'Shrine of', 'Tekke of'],
        modern: ['Mosque of', 'Islamic Center of', 'Shrine of'],
        future: ['Mosque of', 'Spiritual Center of', 'Sacred Complex of']
      },
      EAST_ASIAN: {
        ancient: ['Shrine of', 'Sacred Mountain of', 'Spirit Grove of'],
        classical: ['Temple of', 'Pagoda of', 'Monastery of'],
        medieval: ['Temple of', 'Pagoda of', 'Zen Garden of'],
        earlyModern: ['Temple of', 'Shrine of', 'Monastery of'],
        modern: ['Temple of', 'Shrine of', 'Buddhist Center of'],
        future: ['Temple of', 'Meditation Hall of', 'Zen Complex of']
      },
      SOUTH_ASIAN: {
        ancient: ['Temple of', 'Sacred Site of', 'Holy Grove of'],
        classical: ['Temple of', 'Stupa of', 'Vihara of'],
        medieval: ['Temple of', 'Mandir of', 'Gurdwara of'],
        earlyModern: ['Temple of', 'Mandir of', 'Ashram of'],
        modern: ['Temple of', 'Mandir of', 'Ashram of'],
        future: ['Temple of', 'Spiritual Center of', 'Meditation Complex of']
      },
      SUB_SAHARAN_AFRICAN: {
        ancient: ['Sacred Grove of', 'Spirit Site of', 'Ancestral Shrine of'],
        classical: ['Temple of', 'Sacred Site of', 'Holy Ground of'],
        medieval: ['Shrine of', 'Sacred Grove of', 'Spirit House of'],
        earlyModern: ['Church of', 'Mission of', 'Sacred Site of'],
        modern: ['Church of', 'Temple of', 'Sacred Site of'],
        future: ['Unity Temple of', 'Sacred Space of', 'Spiritual Center of']
      },
      INDIGENOUS_AMERICAN: {
        ancient: ['Sacred Mound of', 'Ceremonial Plaza of', 'Medicine Wheel of'],
        classical: ['Temple of', 'Pyramid of', 'Ceremonial Center of'],
        medieval: ['Temple of', 'Sacred Site of', 'Kiva of'],
        earlyModern: ['Mission of', 'Sacred Site of', 'Ceremonial Ground of'],
        modern: ['Sacred Site of', 'Ceremonial Center of', 'Cultural Center of'],
        future: ['Sacred Space of', 'Ceremonial Complex of', 'Spirit Center of']
      },
      OCEANIC: {
        ancient: ['Marae of', 'Sacred Island of', 'Spirit Site of'],
        classical: ['Marae of', 'Temple of', 'Sacred Platform of'],
        medieval: ['Marae of', 'Sacred Site of', 'Temple of'],
        earlyModern: ['Mission of', 'Church of', 'Sacred Site of'],
        modern: ['Church of', 'Temple of', 'Sacred Site of'],
        future: ['Unity Temple of', 'Sacred Space of', 'Spiritual Center of']
      }
    };

    const eraKey = era.toLowerCase().replace(/\s+/g, '');
    const zoneNames = baseNames[culturalZone] || baseNames.EUROPEAN;
    const eraNames = zoneNames[eraKey] || zoneNames.medieval;
    const prefix = eraNames[Math.floor(Math.random() * eraNames.length)];
    
    return `${prefix} ${structure.name || currentLocation}`;
  };

  const complexName = getSacredComplexName();

  const handleEnterSacredComplex = useCallback(() => {
    if (!onEnterSpecialMap) return;
    
    const config: SpecialMapConfig = {
      archetype: SimplifiedArchetype.SACRED_COMPLEX,
      culturalZone,
      era,
      region: mapData.region,
      mapSize: 'medium',
      structureId: structure.id,
      structureName: complexName,
      climate: mapData.climate,
      // Pass religion data for even more specificity
      customData: {
        religion: religion?.name || 'Local Faith',
        deity: religion?.primaryDeity,
        yearBuilt: structure.customData?.yearBuilt || yearValue - Math.floor(Math.random() * 500),
        architecturalStyle: structure.customData?.architecturalStyle
      }
    };
    
    console.log('[HolySiteModal] Entering sacred complex with config:', config);
    onEnterSpecialMap(config);
    onClose();
  }, [onEnterSpecialMap, culturalZone, era, mapData, structure, complexName, religion, yearValue, onClose]);

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Holy Site"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-6xl h-full sm:h-auto sm:max-h-[95vh] md:max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px)',
          marginBottom: 'env(safe-area-inset-bottom)'
        }}
        style={{ transform: 'translateY(-10px)' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 px-3 sm:px-6 py-2 sm:py-4 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-purple-100 flex items-center gap-2">
                <span className="text-2xl">🛐</span>
                {complexName}
              </h2>
              <p className="text-sm text-purple-200 mt-1">
                {religion?.name || 'Sacred Site'} • {culturalZone} • {era}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-purple-800/50 transition-colors text-purple-200"
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 sm:px-6 py-2 bg-slate-800/50 border-b border-purple-700/20">
          {(['overview', 'services', 'treasury'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg transition-all ${
                activeTab === tab
                  ? 'bg-purple-800/30 text-purple-200 border-b-2 border-purple-400'
                  : 'hover:bg-purple-900/20 text-purple-300'
              }`}
            >
              {tab === 'overview' && <><FaPray className="inline mr-2" />Overview</>}
              {tab === 'services' && <><FaScroll className="inline mr-2" />Services</>}
              {tab === 'treasury' && <><FaCoins className="inline mr-2" />Treasury</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sacred Complex Info */}
              <section className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl p-4 sm:p-5 border border-purple-700/20">
                <h3 className="text-lg font-bold text-purple-300 mb-4">Sacred Architecture</h3>
                <p className="text-purple-100 mb-4">
                  {era === 'Ancient' && 'Ancient sacred grounds with stone circles and natural shrines.'}
                  {era === 'Classical' && 'Grand temples with columns and sacred courtyards.'}
                  {era === 'Medieval' && 'Towering religious architecture with intricate stonework.'}
                  {era === 'Early Modern' && 'Ornate religious buildings with detailed craftsmanship.'}
                  {era === 'Modern' && 'Contemporary religious architecture blending tradition and modernity.'}
                  {era === 'Future' && 'Advanced sacred spaces integrating technology and spirituality.'}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Architectural Style:</span>
                    <span className="text-purple-100">
                      {culturalZone === 'EUROPEAN' && (era === 'Medieval' ? 'Gothic' : era === 'Classical' ? 'Greco-Roman' : 'Varied')}
                      {culturalZone === 'MENA' && 'Islamic Geometric'}
                      {culturalZone === 'EAST_ASIAN' && 'Pagoda & Zen'}
                      {culturalZone === 'SOUTH_ASIAN' && 'Mandala-inspired'}
                      {culturalZone === 'SUB_SAHARAN_AFRICAN' && 'Organic Circular'}
                      {culturalZone === 'INDIGENOUS_AMERICAN' && 'Ceremonial Platform'}
                      {culturalZone === 'OCEANIC' && 'Marae Platform'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Sacred Features:</span>
                    <span className="text-purple-100">
                      {culturalZone === 'EUROPEAN' && 'Altar, Pews, Stained Glass'}
                      {culturalZone === 'MENA' && 'Mihrab, Minbar, Fountain'}
                      {culturalZone === 'EAST_ASIAN' && 'Shrine, Incense, Garden'}
                      {culturalZone === 'SOUTH_ASIAN' && 'Shrine, Offerings, Mandala'}
                      {culturalZone === 'SUB_SAHARAN_AFRICAN' && 'Sacred Fire, Drums, Shrines'}
                      {culturalZone === 'INDIGENOUS_AMERICAN' && 'Sacred Fire, Platform, Totems'}
                      {culturalZone === 'OCEANIC' && 'Totem, Stone Circle, Platform'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Enter Button Section */}
              <section className="bg-gradient-to-br from-purple-800/30 to-indigo-800/30 rounded-xl p-4 sm:p-5 border border-purple-600/30">
                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                  <FaDoorOpen className="text-purple-400" /> Enter Sacred Complex
                </h3>
                <button
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/25 font-bold text-lg flex items-center justify-center gap-3"
                  onClick={handleEnterSacredComplex}
                  disabled={!onEnterSpecialMap}
                >
                  <FaDoorOpen size={22} />
                  Enter the {complexName}
                </button>
                <p className="text-xs text-purple-200 text-center italic mt-2">
                  Explore the sacred interior of this {religion?.name || 'holy'} site.
                </p>
              </section>

              {/* NPCs */}
              {npcs.length > 0 && (
                <section className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 sm:p-5 border border-purple-700/20 md:col-span-2">
                  <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <FaUser className="text-purple-400" /> Religious Leaders
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {npcs.slice(0, 6).map((npc) => (
                      <div key={npc.id} className="flex items-center gap-3 p-2 bg-purple-900/20 rounded-lg">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-600">
                          <LazyPortrait character={npc} size={40} type="procedural" staticMode={true} />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-100 text-sm">{npc.name}</p>
                          <p className="text-xs text-purple-300">{npc.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Clergy'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl p-4 sm:p-5 border border-purple-700/20">
              <HolySiteInteractions
                structure={structure}
                religion={religion?.name}
                playerCharacter={playerCharacter}
                onServicePurchased={(service) => {
                  console.log('Service purchased:', service);
                }}
              />
            </div>
          )}

          {activeTab === 'treasury' && (
            <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl p-4 sm:p-5 border border-purple-700/20">
              <h3 className="text-lg font-bold text-purple-300 mb-4">Temple Treasury</h3>
              {Object.keys(treasury).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(treasury).map(([itemId, quantity]) => (
                    <div key={itemId} className="bg-purple-800/20 rounded-lg p-3">
                      <p className="text-purple-100 font-semibold">
                        {itemId.replace(/_/g, ' ')}
                      </p>
                      <p className="text-purple-300 text-2xl">{quantity.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-purple-200 italic">The treasury is empty.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolySiteModal;