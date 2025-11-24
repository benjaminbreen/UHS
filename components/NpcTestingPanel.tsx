import React, { useState, useEffect } from 'react';
import { X, Users, RefreshCw, Eye, Sparkles, Palette, Settings } from 'lucide-react';
import { NpcEntity } from '../types';
import { ProceduralPortrait } from './portraits';
import { generateCharacter } from '../services/characterGenerator';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types';
import { CULTURAL_MARKINGS } from '../constants/characterData/culturalMarkings';

interface NpcTestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestNpcConfig {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  profession: string;
  gender: 'Male' | 'Female';
  age: number;
  socialClass: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
  forceMarkings: boolean;
  markingTypes: string[];
}

const NpcTestingPanel: React.FC<NpcTestingPanelProps> = ({ isOpen, onClose }) => {
  const [testNpc, setTestNpc] = useState<NpcEntity | null>(null);
  const [showNpcModal, setShowNpcModal] = useState(false);
  const [config, setConfig] = useState<TestNpcConfig>({
    culturalZone: 'OCEANIA',
    era: 'MEDIEVAL',
    profession: 'Warrior',
    gender: 'Male',
    age: 30,
    socialClass: 'modest',
    forceMarkings: true,
    markingTypes: ['tattoo', 'paint']
  });

  const culturalZones: CulturalZone[] = [
    'OCEANIA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SUB_SAHARAN_AFRICAN', 
    'SOUTH_AMERICAN', 'SOUTH_ASIAN', 'MENA', 'EAST_ASIAN', 'EUROPEAN', 
    'NORTH_AMERICAN_COLONIAL'
  ];

  const eras: HistoricalEra[] = [
    'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN', 
    'INDUSTRIAL_ERA', 'MODERN_ERA'
  ];

  const markingTypes = ['tattoo', 'scarification', 'paint', 'henna', 'piercing', 'ash'];

  const professionsByZone = {
    'OCEANIA': ['Warrior', 'Navigator', 'Fisher', 'Chief', 'Shaman'],
    'NORTH_AMERICAN_PRE_COLUMBIAN': ['Warrior', 'Hunter', 'Shaman', 'Chief', 'Medicine Man'],
    'SUB_SAHARAN_AFRICAN': ['Warrior', 'Herder', 'Trader', 'Priest', 'Blacksmith'],
    'SOUTH_AMERICAN': ['Warrior', 'Hunter', 'Shaman', 'Farmer', 'Noble'],
    'SOUTH_ASIAN': ['Priest', 'Merchant', 'Farmer', 'Warrior', 'Scholar'],
    'MENA': ['Merchant', 'Nomad', 'Priest', 'Warrior', 'Scholar'],
    'EAST_ASIAN': ['Scholar', 'Farmer', 'Merchant', 'Monk', 'Warrior'],
    'EUROPEAN': ['Farmer', 'Merchant', 'Priest', 'Knight', 'Craftsman'],
    'NORTH_AMERICAN_COLONIAL': ['Farmer', 'Merchant', 'Preacher', 'Soldier', 'Craftsman']
  };

  const generateTestNpc = async () => {
    try {
      // Create generation context
      const generationContext = {
        date: config.era === 'MEDIEVAL' ? '1300-01-01' : '1500-01-01',
        culturalZone: config.culturalZone,
        era: config.era,
        location: 'Test Location',
        mapSeed: Math.random().toString()
      };

      // Generate character with test specifications
      const spec = {
        profession: config.profession,
        gender: config.gender,
        age: config.age,
        socialClass: config.socialClass,
        customBackstory: `Test character for ${config.culturalZone} culture in ${config.era} era.`
      };

      const character = generateCharacter(generationContext, spec);

      // Force specific markings if requested
      if (config.forceMarkings && character.appearance) {
        const forcedMarkings: any[] = [];
        
        config.markingTypes.forEach((type, index) => {
          // Find a matching marking type for this culture
          const availableMarkings = CULTURAL_MARKINGS.filter(m => 
            m.culturalZones.includes(config.culturalZone) && m.type === type
          );
          
          if (availableMarkings.length > 0) {
            const marking = availableMarkings[0];
            const pattern = marking.patterns[0];
            if (pattern) {
              forcedMarkings.push({
                type: marking.type,
                location: pattern.locations[0] || 'face',
                color: pattern.colors[0] || '#000000',
                size: pattern.size,
                pattern: pattern.pattern,
                name: pattern.localName || pattern.name,
                isPermanent: marking.isPermanent,
                duration: marking.duration,
                culturalSignificance: marking.culturalSignificance
              });
            }
          }
        });

        character.appearance.markings = forcedMarkings;
      }

      setTestNpc(character);
    } catch (error) {
      console.error('Failed to generate test NPC:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateTestNpc();
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Test Panel */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-600 w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
          {/* Left Panel - Controls */}
          <div className="w-1/3 bg-slate-900 p-6 overflow-y-auto border-r border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">NPC Testing</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Cultural Zone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cultural Zone</label>
                <select
                  value={config.culturalZone}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    culturalZone: e.target.value as CulturalZone,
                    profession: professionsByZone[e.target.value as CulturalZone][0]
                  }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                >
                  {culturalZones.map(zone => (
                    <option key={zone} value={zone}>
                      {zone.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Era */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Historical Era</label>
                <select
                  value={config.era}
                  onChange={(e) => setConfig(prev => ({ ...prev, era: e.target.value as HistoricalEra }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                >
                  {eras.map(era => (
                    <option key={era} value={era}>
                      {era.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Profession</label>
                <select
                  value={config.profession}
                  onChange={(e) => setConfig(prev => ({ ...prev, profession: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                >
                  {professionsByZone[config.culturalZone]?.map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                  <select
                    value={config.gender}
                    onChange={(e) => setConfig(prev => ({ ...prev, gender: e.target.value as 'Male' | 'Female' }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                  <input
                    type="number"
                    min="16"
                    max="80"
                    value={config.age}
                    onChange={(e) => setConfig(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Social Class */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Social Class</label>
                <select
                  value={config.socialClass}
                  onChange={(e) => setConfig(prev => ({ ...prev, socialClass: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="poor">Poor</option>
                  <option value="modest">Modest</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="wealthy">Wealthy</option>
                  <option value="noble">Noble</option>
                </select>
              </div>

              {/* Body Modifications */}
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={config.forceMarkings}
                    onChange={(e) => setConfig(prev => ({ ...prev, forceMarkings: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-slate-300">Force Body Modifications</span>
                </label>
                
                {config.forceMarkings && (
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400 mb-2">Modification Types</label>
                    <div className="grid grid-cols-2 gap-2">
                      {markingTypes.map(type => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.markingTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig(prev => ({
                                  ...prev,
                                  markingTypes: [...prev.markingTypes, type]
                                }));
                              } else {
                                setConfig(prev => ({
                                  ...prev,
                                  markingTypes: prev.markingTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                            className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs text-slate-300 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={generateTestNpc}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generate New NPC
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 p-6 overflow-y-auto">
            {testNpc ? (
              <div className="space-y-6">
                {/* Portrait and Basic Info */}
                <div className="flex gap-6">
                  <div className="shrink-0">
                    <div className="w-64 h-64 bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
                      <ProceduralPortrait character={testNpc} size={256} />
                    </div>
                    <button
                      onClick={() => setShowNpcModal(true)}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Modal
                    </button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{testNpc.name}</h3>
                      <p className="text-slate-400">{testNpc.role} • {testNpc.gender} • Age {testNpc.age}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Culture:</span>
                        <span className="ml-2 text-white">{config.culturalZone.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Era:</span>
                        <span className="ml-2 text-white">{config.era.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Class:</span>
                        <span className="ml-2 text-white capitalize">{config.socialClass}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Health:</span>
                        <span className="ml-2 text-white">{testNpc.health}/{testNpc.maxHealth}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Modifications */}
                {testNpc.appearance?.markings && testNpc.appearance.markings.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Body Modifications
                    </h4>
                    <div className="space-y-3">
                      {testNpc.appearance.markings.map((marking: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                          <div className="flex items-center gap-3">
                            {marking.type === 'tattoo' && <span className="text-xl">🖤</span>}
                            {marking.type === 'paint' && <span className="text-xl">🎨</span>}
                            {marking.type === 'scarification' && <span className="text-xl">⚡</span>}
                            {marking.type === 'henna' && <span className="text-xl">🌿</span>}
                            {marking.type === 'piercing' && <span className="text-xl">💍</span>}
                            {marking.type === 'ash' && <span className="text-xl">⚱️</span>}
                            <div>
                              <p className="text-white font-medium">{marking.name}</p>
                              <p className="text-slate-400 text-sm capitalize">{marking.type} • {marking.location}</p>
                              {marking.culturalSignificance && (
                                <p className="text-slate-500 text-xs italic mt-1">{marking.culturalSignificance}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {marking.isPermanent ? (
                              <span className="px-2 py-1 bg-red-600/70 text-red-200 text-xs font-bold rounded-full">
                                Permanent
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-600/70 text-yellow-200 text-xs font-bold rounded-full">
                                Temporary
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {testNpc.equippedItems && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Equipment & Clothing
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(testNpc.equippedItems).map(([slot, item]) => (
                        item && (
                          <div key={slot} className="flex justify-between p-2 bg-slate-800 rounded border border-slate-700">
                            <span className="text-slate-400 capitalize">{slot}:</span>
                            <span className="text-white">{(item as any).name}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4" />
                  <p>Configure settings and generate an NPC to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NPC Modal */}
      {showNpcModal && testNpc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-600 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">NPC Modal Preview</h3>
              <button
                onClick={() => setShowNpcModal(false)}
                className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* This would show the actual NPC modal content */}
              <div className="text-center text-slate-400">
                <p>Full NPC modal would appear here</p>
                <p className="text-sm mt-2">This simulates how the NPC would appear in the actual game</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NpcTestingPanel;