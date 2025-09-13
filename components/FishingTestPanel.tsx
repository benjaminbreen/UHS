/**
 * FishingTestPanel.tsx - Dev panel for testing fishing in different environments
 * Allows testing various combinations of era, culture, climate, and water type
 */

import React, { useState } from 'react';
import FishingHutModal from './FishingHutModal';
import { TerrainStructure } from '../types/structures';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types/ambiance';
import { ClimateType, BiomeType, Season, PlayerCharacter, TimeOfDay } from '../types';
import { Fish } from 'lucide-react';

interface FishingTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FishingTestPanel: React.FC<FishingTestPanelProps> = ({ isOpen, onClose }) => {
  const [showFishingModal, setShowFishingModal] = useState(false);
  
  // Test configuration state
  const [testConfig, setTestConfig] = useState({
    culturalZone: 'EUROPEAN' as CulturalZone,
    historicalEra: HistoricalEra.MEDIEVAL,
    climate: ClimateType.TEMPERATE,
    biome: BiomeType.BEACH,
    season: 'summer' as Season,
    year: 1500,
    isCoastal: true,
    isFreshwater: false,
    timeOfDay: 'Midday' as TimeOfDay,
    locationSeed: 12345,
    playerGold: 100
  });

  // Mock structure for testing
  const mockStructure: TerrainStructure = {
    id: 'test_fishing_hut',
    structureType: 'fishing_hut',
    location: [testConfig.locationSeed % 100, Math.floor(testConfig.locationSeed / 100)],
    state: 'active',
    constructionYear: testConfig.year - 50,
    lastMaintenance: testConfig.year - 1
  };

  // Mock player character for testing
  const mockPlayerCharacter: PlayerCharacter = {
    id: 'test_player',
    name: 'Test Fisher',
    profession: 'Fisher',
    age: 25,
    health: 100,
    maxHealth: 100,
    hunger: 50,
    maxHunger: 100,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    equipment: {
      head: null,
      body: null,
      feet: null,
      weapon: null,
      shield: null,
      accessory: null
    },
    stats: {
      level: 1,
      experience: 0,
      nextLevelExp: 100,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      skillPoints: 0
    },
    position: { x: 50, y: 50 },
    culturalBackground: testConfig.culturalZone,
    gender: 'male',
    socialClass: 'commoner',
    religion: 'Christianity',
    reputation: 0,
    gold: testConfig.playerGold,
    historicalContext: {
      era: testConfig.historicalEra,
      year: testConfig.year,
      location: 'Test Location',
      majorEvents: []
    },
    relationships: [],
    knownLocations: [],
    activeQuests: [],
    completedQuests: [],
    skills: [],
    memories: [],
    personalityTraits: ['curious', 'patient'],
    statusEffects: []
  };

  const culturalZones: CulturalZone[] = [
    'EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 
    'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'
  ];

  const historicalEras = [
    { value: HistoricalEra.PREHISTORY, label: 'Prehistory (< 3000 BCE)' },
    { value: HistoricalEra.ANTIQUITY, label: 'Antiquity (3000 BCE - 500 CE)' },
    { value: HistoricalEra.MEDIEVAL, label: 'Medieval (500 - 1500)' },
    { value: HistoricalEra.RENAISSANCE_EARLY_MODERN, label: 'Renaissance (1500 - 1800)' },
    { value: HistoricalEra.INDUSTRIAL_ERA, label: 'Industrial (1800 - 1950)' },
    { value: HistoricalEra.MODERN_ERA, label: 'Modern (1950+)' }
  ];

  const climates = [
    { value: ClimateType.COLD, label: 'Arctic/Cold' },
    { value: ClimateType.TEMPERATE, label: 'Temperate' },
    { value: ClimateType.MEDITERRANEAN, label: 'Mediterranean' },
    { value: ClimateType.ARID, label: 'Arid/Desert' },
    { value: ClimateType.SEMITROPICAL, label: 'Semitropical' },
    { value: ClimateType.TROPICAL, label: 'Tropical' }
  ];

  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'] as Season[];
  const timesOfDay = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Dusk', 'Night'] as const;

  // Preset scenarios for quick testing
  const presetScenarios = [
    {
      name: 'Medieval European River',
      config: {
        culturalZone: 'EUROPEAN' as CulturalZone,
        historicalEra: HistoricalEra.MEDIEVAL,
        climate: ClimateType.TEMPERATE,
        biome: BiomeType.WETLANDS,
        season: 'summer' as Season,
        year: 1350,
        isCoastal: false,
        isFreshwater: true,
        timeOfDay: 'Morning' as TimeOfDay,
        locationSeed: 123,
        playerGold: 50
      }
    },
    {
      name: 'Tropical Pacific Island',
      config: {
        culturalZone: 'OCEANIA' as CulturalZone,
        historicalEra: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        climate: ClimateType.TROPICAL,
        biome: BiomeType.BEACH,
        season: 'summer' as Season,
        year: 1600,
        isCoastal: true,
        isFreshwater: false,
        timeOfDay: 'Midday' as TimeOfDay,
        locationSeed: 456,
        playerGold: 75
      }
    },
    {
      name: 'Arctic Inuit Fishing',
      config: {
        culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone,
        historicalEra: HistoricalEra.MEDIEVAL,
        climate: ClimateType.COLD,
        biome: BiomeType.SHALLOW_WATER,
        season: 'winter' as Season,
        year: 1200,
        isCoastal: true,
        isFreshwater: false,
        timeOfDay: 'Dawn' as TimeOfDay,
        locationSeed: 789,
        playerGold: 30
      }
    },
    {
      name: 'Japanese Koi Pond',
      config: {
        culturalZone: 'EAST_ASIAN' as CulturalZone,
        historicalEra: HistoricalEra.MEDIEVAL,
        climate: ClimateType.TEMPERATE,
        biome: BiomeType.WETLANDS,
        season: 'spring' as Season,
        year: 1400,
        isCoastal: false,
        isFreshwater: true,
        timeOfDay: 'Afternoon' as TimeOfDay,
        locationSeed: 999,
        playerGold: 200
      }
    },
    {
      name: 'Amazon River Basin',
      config: {
        culturalZone: 'SOUTH_AMERICAN' as CulturalZone,
        historicalEra: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        climate: ClimateType.TROPICAL,
        biome: BiomeType.WETLANDS,
        season: 'summer' as Season,
        year: 1550,
        isCoastal: false,
        isFreshwater: true,
        timeOfDay: 'Morning' as TimeOfDay,
        locationSeed: 777,
        playerGold: 40
      }
    },
    {
      name: 'Modern Industrial Port',
      config: {
        culturalZone: 'EUROPEAN' as CulturalZone,
        historicalEra: HistoricalEra.MODERN_ERA,
        climate: ClimateType.TEMPERATE,
        biome: BiomeType.BEACH,
        season: 'fall' as Season,
        year: 2000,
        isCoastal: true,
        isFreshwater: false,
        timeOfDay: 'Night' as TimeOfDay,
        locationSeed: 555,
        playerGold: 500
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Main Test Panel */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fish className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Fishing System Test Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Preset Scenarios */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">Quick Test Scenarios</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {presetScenarios.map((scenario) => (
                  <button
                    key={scenario.name}
                    onClick={() => setTestConfig(scenario.config)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
                  >
                    {scenario.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300">Custom Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Cultural Zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Cultural Zone
                  </label>
                  <select
                    value={testConfig.culturalZone}
                    onChange={(e) => setTestConfig({ ...testConfig, culturalZone: e.target.value as CulturalZone })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    {culturalZones.map(zone => (
                      <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Historical Era */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Historical Era
                  </label>
                  <select
                    value={testConfig.historicalEra}
                    onChange={(e) => setTestConfig({ ...testConfig, historicalEra: e.target.value as HistoricalEra })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    {historicalEras.map(era => (
                      <option key={era.value} value={era.value}>{era.label}</option>
                    ))}
                  </select>
                </div>

                {/* Climate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Climate
                  </label>
                  <select
                    value={testConfig.climate}
                    onChange={(e) => setTestConfig({ ...testConfig, climate: e.target.value as ClimateType })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    {climates.map(climate => (
                      <option key={climate.value} value={climate.value}>{climate.label}</option>
                    ))}
                  </select>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Season
                  </label>
                  <select
                    value={testConfig.season}
                    onChange={(e) => setTestConfig({ ...testConfig, season: e.target.value as Season })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    {seasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                {/* Time of Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Time of Day
                  </label>
                  <select
                    value={testConfig.timeOfDay}
                    onChange={(e) => setTestConfig({ ...testConfig, timeOfDay: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    {timesOfDay.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={testConfig.year}
                    onChange={(e) => setTestConfig({ ...testConfig, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>

                {/* Water Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Water Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={testConfig.isCoastal}
                        onChange={(e) => setTestConfig({ ...testConfig, isCoastal: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-white">Coastal</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={testConfig.isFreshwater}
                        onChange={(e) => setTestConfig({ ...testConfig, isFreshwater: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-white">Freshwater</span>
                    </label>
                  </div>
                </div>

                {/* Location Seed */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Location Seed
                  </label>
                  <input
                    type="number"
                    value={testConfig.locationSeed}
                    onChange={(e) => setTestConfig({ ...testConfig, locationSeed: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>

                {/* Starting Gold */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Starting Gold
                  </label>
                  <input
                    type="number"
                    value={testConfig.playerGold}
                    onChange={(e) => setTestConfig({ ...testConfig, playerGold: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    min="0"
                    max="10000"
                  />
                </div>
              </div>

              {/* Current Configuration Display */}
              <div className="mt-4 p-4 bg-slate-700/50 rounded">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Test Configuration:</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>🌍 Zone: {testConfig.culturalZone.replace(/_/g, ' ')}</div>
                  <div>📅 Era: {testConfig.historicalEra} (Year {testConfig.year})</div>
                  <div>☀️ Climate: {testConfig.climate}</div>
                  <div>🌊 Water: {testConfig.isCoastal ? 'Coastal' : ''} {testConfig.isFreshwater ? 'Freshwater' : 'Saltwater'}</div>
                  <div>🕐 Time: {testConfig.timeOfDay} in {testConfig.season}</div>
                  <div>💰 Gold: {testConfig.playerGold}</div>
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={() => setShowFishingModal(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Fish className="w-5 h-5" />
                Launch Fishing Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fishing Modal */}
      {showFishingModal && (
        <FishingHutModal
          isOpen={showFishingModal}
          onClose={() => setShowFishingModal(false)}
          structure={mockStructure}
          culturalZone={testConfig.culturalZone}
          historicalEra={testConfig.historicalEra}
          climate={testConfig.climate}
          biome={testConfig.biome}
          season={testConfig.season}
          year={testConfig.year}
          isCoastal={testConfig.isCoastal}
          isFreshwater={testConfig.isFreshwater}
          timeOfDay={testConfig.timeOfDay}
          playerCharacter={mockPlayerCharacter}
          playerGold={testConfig.playerGold}
          onInventoryUpdate={(item) => {
            console.log('Test mode - Fish caught:', item);
            alert(`Caught: ${item.name} (Weight: ${item.quantity}kg)`);
          }}
          onBuy={(itemId, price) => {
            console.log('Test mode - Bought item:', itemId, 'for', price);
            setTestConfig(prev => ({ ...prev, playerGold: prev.playerGold - price }));
          }}
          onSell={(item, price) => {
            console.log('Test mode - Sold item:', item.name, 'for', price);
            setTestConfig(prev => ({ ...prev, playerGold: prev.playerGold + price }));
          }}
        />
      )}
    </>
  );
};

export default FishingTestPanel;