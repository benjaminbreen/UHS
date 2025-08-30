/**
 * InteriorMapTestMenu.tsx
 * Testing suite for interior map system - allows previewing all cultural variants and building types
 */

import React, { useState } from 'react';
import { X, Building, Eye, Play, Layers } from 'lucide-react';
import { InteriorGenerationConfig } from '../types/interiorMapTypes';
import { CulturalZone, HistoricalEra } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useUI } from '../contexts/UIContext';
import { useGame } from '../contexts/GameContext';

interface InteriorMapTestMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const InteriorMapTestMenu: React.FC<InteriorMapTestMenuProps> = ({ isOpen, onClose }) => {
  const { playerCharacter, enterInteriorMap } = usePlayer();
  const { setCurrentView } = useUI();
  const { gameDate } = useGame();
  
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>('palace');
  const [selectedCulturalZone, setSelectedCulturalZone] = useState<string>('EUROPEAN');
  const [selectedReligion, setSelectedReligion] = useState<string>('Christianity');
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showLayoutPreview, setShowLayoutPreview] = useState(false);
  
  if (!isOpen) return null;
  
  // Building types with their descriptions
  const buildingTypes = [
    { value: 'palace', label: '🏰 Palace', description: 'Royal palaces with throne rooms and private chambers' },
    { value: 'government_district', label: '🏛️ Government Forum', description: 'Council chambers and administrative offices' },
    { value: 'holy_place', label: '⛪ Holy Place', description: 'Temples, churches, mosques, and shrines' },
    { value: 'cathedral', label: '⛪ Cathedral', description: 'Large Christian cathedral with nave and sanctuary' },
    { value: 'church', label: '⛪ Church', description: 'Small village church' },
    { value: 'mosque', label: '🕌 Mosque', description: 'Islamic mosque with prayer hall and mihrab' },
    { value: 'buddhist_temple', label: '🛕 Buddhist Temple', description: 'Buddhist temple with meditation halls' },
    { value: 'synagogue', label: '✡️ Synagogue', description: 'Jewish synagogue with bimah and ark' }
  ];
  
  // Cultural zones for palace variations
  const culturalZones = [
    { value: 'EUROPEAN', label: '🏰 European', description: 'Medieval castles and baroque palaces' },
    { value: 'MENA', label: '🕌 Middle Eastern', description: 'Desert palaces with courtyards' },
    { value: 'EAST_ASIAN', label: '🏯 East Asian', description: 'Imperial palaces with gardens' },
    { value: 'SOUTH_ASIAN', label: '🏛️ South Asian', description: 'Mughal-style palaces' },
    { value: 'AFRICAN', label: '🏛️ African', description: 'Royal compounds with great halls' },
    { value: 'SOUTHEAST_ASIAN', label: '🏛️ Southeast Asian', description: 'Tropical palace complexes' },
    { value: 'NORTH_AMERICAN', label: '🏛️ North American', description: 'Colonial government buildings' },
    { value: 'SOUTH_AMERICAN', label: '🏛️ South American', description: 'Colonial viceregal palaces' }
  ];
  
  // Religions for holy places
  const religions = [
    'Christianity', 'Catholicism', 'Orthodox Christianity', 'Protestantism',
    'Islam', 'Sunni Islam', 'Shia Islam',
    'Buddhism', 'Hinduism', 'Judaism',
    'Shinto', 'Taoism', 'Confucianism',
    'Traditional African', 'Traditional American', 'Norse Paganism'
  ];
  
  const handleEnterInterior = () => {
    const config: InteriorGenerationConfig = {
      buildingType: selectedBuildingType,
      buildingId: `${selectedBuildingType}-test-${Date.now()}`,
      date: String(gameDate.year),
      location: selectedCulturalZone,
      contextTile: {
        x: 0,
        y: 0,
        biome: 0,
        elevation: 0,
        waterBody: false,
        riverDirection: null,
        temperature: 15,
        humidity: 0.5,
        structureType: selectedBuildingType as any,
        explored: true,
        visible: true,
        culturalZone: selectedCulturalZone as CulturalZone,
        historicalEra: 'MEDIEVAL' as HistoricalEra,
        religion: selectedReligion
      }
    };
    
    // Enter the interior map
    enterInteriorMap(config);
    onClose();
  };
  
  // Get layout preview based on selections
  const getLayoutInfo = () => {
    if (selectedBuildingType === 'palace') {
      switch (selectedCulturalZone) {
        case 'EUROPEAN':
          return { name: 'European Palace', rooms: ['Throne Room', 'Great Hall', 'Royal Chambers', 'Chapel'] };
        case 'MENA':
          return { name: 'Middle Eastern Palace', rooms: ['Throne Room', 'Courtyard', 'Harem', 'Treasury'] };
        case 'EAST_ASIAN':
        case 'SOUTH_ASIAN':
          return { name: 'Imperial Palace', rooms: ['Throne Hall', 'Audience Chamber', 'Private Quarters'] };
        case 'AFRICAN':
          return { name: 'Royal Compound', rooms: ['Great Hall', 'Royal Chamber'] };
        default:
          return { name: 'Palace', rooms: ['Throne Room', 'Chambers'] };
      }
    } else if (selectedBuildingType === 'government_district') {
      return { name: 'Government Forum', rooms: ['Council Chamber', 'Public Hall', 'Tax Office', 'Archives'] };
    } else if (selectedBuildingType === 'holy_place' || selectedBuildingType.includes('church') || selectedBuildingType.includes('temple')) {
      if (selectedReligion.includes('Islam') || selectedBuildingType === 'mosque') {
        return { name: 'Mosque', rooms: ['Prayer Hall', 'Ablution Fountain', 'Mihrab'] };
      } else if (selectedReligion.includes('Buddhism') || selectedBuildingType === 'buddhist_temple') {
        return { name: 'Buddhist Temple', rooms: ['Main Hall', 'Meditation Hall', 'Altar'] };
      } else if (selectedReligion.includes('Judaism') || selectedBuildingType === 'synagogue') {
        return { name: 'Synagogue', rooms: ['Prayer Hall', 'Bimah', 'Ark'] };
      } else if (selectedBuildingType === 'cathedral') {
        return { name: 'Cathedral', rooms: ['Nave', 'Transept', 'Sanctuary'] };
      } else {
        return { name: 'Church', rooms: ['Worship Hall', 'Altar'] };
      }
    }
    return { name: 'Building', rooms: [] };
  };
  
  const layoutInfo = getLayoutInfo();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl border border-slate-700/70 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/70 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-100">Interior Map Testing Suite</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Building Type Selection */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-cyan-400 uppercase">
              Building Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {buildingTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedBuildingType(type.value)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedBuildingType === type.value
                      ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Cultural Zone Selection (for palaces) */}
          {(selectedBuildingType === 'palace' || selectedBuildingType === 'government_district') && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold tracking-wider text-cyan-400 uppercase">
                Cultural Zone
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {culturalZones.map(zone => (
                  <button
                    key={zone.value}
                    onClick={() => setSelectedCulturalZone(zone.value)}
                    className={`p-2 rounded-lg border transition-all ${
                      selectedCulturalZone === zone.value
                        ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium">{zone.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Religion Selection (for holy places) */}
          {(selectedBuildingType === 'holy_place' || selectedBuildingType.includes('church') || 
            selectedBuildingType.includes('temple') || selectedBuildingType === 'mosque' || 
            selectedBuildingType === 'synagogue') && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold tracking-wider text-cyan-400 uppercase">
                Religion
              </h3>
              <select
                value={selectedReligion}
                onChange={(e) => setSelectedReligion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500/50"
              >
                {religions.map(religion => (
                  <option key={religion} value={religion}>{religion}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-cyan-400 uppercase">
              Building Size
            </h3>
            <div className="flex gap-3">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                    selectedSize === size
                      ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* Layout Preview */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">
                Layout Preview
              </h3>
              <button
                onClick={() => setShowLayoutPreview(!showLayoutPreview)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Eye className={`w-4 h-4 ${showLayoutPreview ? 'text-cyan-400' : 'text-slate-400'}`} />
              </button>
            </div>
            
            {showLayoutPreview && (
              <div>
                <div className="text-lg font-medium text-slate-200 mb-2">{layoutInfo.name}</div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-400">Rooms:</div>
                  {layoutInfo.rooms.map((room, idx) => (
                    <div key={idx} className="text-sm text-slate-300 pl-4">• {room}</div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Note: Each room will have appropriate furniture, NPCs, and access restrictions based on cultural zone and building type.
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700/70 bg-slate-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              <Layers className="inline w-4 h-4 mr-1" />
              Interior map will use beautiful SVG patterns and room-based architecture
            </div>
            <button
              onClick={handleEnterInterior}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Enter Interior
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteriorMapTestMenu;