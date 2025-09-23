import React, { useState } from 'react';
import { X, MapPin, Calendar, User, Sparkles, Target, Scroll, Users, ChevronRight, Award } from 'lucide-react';
import { GameMode, SpecialNPC } from '../types/eventTypes';
import { CharacterSpecification, WorldWeaverQuest } from '../services/worldWeaverService';
import { worldWeaverQuestService } from '../services/worldWeaverQuestService';
import { worldWeaverNpcService } from '../services/worldWeaverNpcService';
import { worldWeaverNotificationService } from '../services/worldWeaverNotificationService';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';

interface WorldWeaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  location: string;
  explanation: string;
  reasoning?: string;
  suggestion?: string;
  characterSpec?: CharacterSpecification;
  gameMode?: GameMode;
  specialNPCs?: SpecialNPC[];
  customEventsCount?: number;
  quest?: WorldWeaverQuest;
}

const WorldWeaverModal: React.FC<WorldWeaverModalProps> = ({
  isOpen,
  onClose,
  year,
  location,
  explanation,
  reasoning,
  suggestion,
  characterSpec,
  gameMode,
  specialNPCs,
  customEventsCount = 0,
  quest
}) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get game context
  const { mapData, currentLocation } = useMap();
  const { playerCharacter } = usePlayer();
  const { year: currentYear } = useGame();

  if (!isOpen) return null;

  // Enhanced journey handler with quest integration
  const handleBeginJourney = async () => {
    if (!quest) {
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Add quest to quest system
      const questId = worldWeaverQuestService.addWorldWeaverQuest(quest);
      console.log('[WorldWeaverModal] Added quest to system:', questId);

      // 2. Spawn quest NPCs if we have valid context
      if (mapData && currentLocation && playerCharacter) {
        const spawnContext = {
          mapData,
          playerLocation: currentLocation,
          culturalZone: playerCharacter.culturalZone || 'EUROPEAN',
          era: playerCharacter.historicalEra || 'RENAISSANCE_EARLY_MODERN'
        };

        const spawnedNPCIds = await worldWeaverNpcService.spawnQuestNPCs(quest.specialNPCs, spawnContext);
        console.log('[WorldWeaverModal] Spawned NPCs with AI portraits:', spawnedNPCIds);

        // Track spawned NPCs in quest service
        spawnedNPCIds.forEach(npcId => {
          worldWeaverQuestService.addSpawnedNPC(questId, npcId);
        });
      }

      // 3. Show success notification
      worldWeaverNotificationService.showQuestIntegrationSuccess(quest.title);

      // Emit quest added event
      window.dispatchEvent(new CustomEvent('worldWeaverQuestAdded', {
        detail: { quest }
      }));

      // 4. Close modal
      onClose();

    } catch (error) {
      console.error('[WorldWeaverModal] Failed to integrate quest:', error);
      // TODO: Show error notification
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-green-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 px-6 py-4 border-b border-green-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-400" />
              World Created by WorldWeaver
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Setting Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                Year
              </div>
              <div className="text-lg font-semibold text-white">
                {year > 0 ? year : `${Math.abs(year)} BCE`}
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              <div className="text-lg font-semibold text-white">
                {location}
              </div>
            </div>
          </div>

          {/* Game Mode */}
          {gameMode && (
            <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                <Target className="w-4 h-4" />
                Game Mode
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                {gameMode.name}
              </div>
              <p className="text-sm text-gray-300">
                {gameMode.description}
              </p>
            </div>
          )}

          {/* Character */}
          {characterSpec && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <User className="w-4 h-4" />
                Your Character
              </div>
              <div className="space-y-1 text-sm">
                {characterSpec.name && (
                  <div>
                    <span className="text-gray-400">Name:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.name}</span>
                  </div>
                )}
                {characterSpec.age && (
                  <div>
                    <span className="text-gray-400">Age:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.age}</span>
                  </div>
                )}
                {characterSpec.gender && (
                  <div>
                    <span className="text-gray-400">Gender:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.gender}</span>
                  </div>
                )}
                {characterSpec.profession && (
                  <div>
                    <span className="text-gray-400">Profession:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.profession}</span>
                  </div>
                )}
                {characterSpec.socialClass && (
                  <div>
                    <span className="text-gray-400">Social Class:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.socialClass}</span>
                  </div>
                )}
                {characterSpec.health && (
                  <div>
                    <span className="text-gray-400">Health:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.health}</span>
                  </div>
                )}
                {characterSpec.traits && characterSpec.traits.length > 0 && (
                  <div>
                    <span className="text-gray-400">Traits:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.traits.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Historical Context</h3>
            <p className="text-sm text-gray-200">
              {explanation}
            </p>
          </div>

          {/* Reasoning */}
          {reasoning && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Why This Setting?</h3>
              <p className="text-sm text-gray-200">
                {reasoning}
              </p>
            </div>
          )}

          {/* Special NPCs */}
          {specialNPCs && specialNPCs.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Special Characters Created
              </h3>
              <div className="space-y-2">
                {specialNPCs.map((npc, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-green-400 font-medium">{npc.name}</span>
                    <span className="text-gray-400"> - {npc.occupation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quest Section - THE MAIN FEATURE */}
          {quest && (
            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Scroll className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-amber-400">Quest: {quest.title}</h3>
              </div>
              
              <p className="text-sm text-gray-200 mb-3">{quest.description}</p>
              
              {quest.historicalContext && (
                <p className="text-xs text-gray-400 italic mb-3 border-l-2 border-amber-600/30 pl-2">
                  {quest.historicalContext}
                </p>
              )}
              
              {/* Quest Stages */}
              <div className="space-y-2 mt-3">
                <h4 className="text-sm font-semibold text-amber-300 mb-2">Quest Stages:</h4>
                {quest.stages.map((stage, index) => (
                  <div 
                    key={stage.id}
                    className="bg-slate-800/50 rounded p-2 border border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
                    onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{index + 1}.</span>
                        <span className="text-sm text-white font-medium">{stage.objective}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedStage === stage.id ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {expandedStage === stage.id && (
                      <div className="mt-2 pl-6 space-y-1">
                        <p className="text-xs text-gray-300">{stage.description}</p>
                        {stage.locationHint && (
                          <p className="text-xs text-blue-400">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {stage.locationHint}
                          </p>
                        )}
                        {stage.rewards && stage.rewards.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <Award className="w-3 h-3" />
                            <span>Rewards: {stage.rewards.map(r => r.value).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Quest NPCs */}
              {quest.specialNPCs && quest.specialNPCs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-600/30">
                  <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Key Characters:
                  </h4>
                  <div className="space-y-1">
                    {quest.specialNPCs.map((npc) => (
                      <div key={npc.id} className="text-xs">
                        <span className="text-amber-400 font-medium">{npc.name}</span>
                        <span className="text-gray-400"> - {npc.role}</span>
                        {npc.profession && <span className="text-gray-500"> ({npc.profession})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Branches indication */}
              {quest.branches && Object.keys(quest.branches).length > 0 && (
                <div className="mt-2 text-xs text-purple-400 italic">
                  ⚡ This quest features branching paths based on your choices
                </div>
              )}
            </div>
          )}
          
          {/* Custom Events (now less prominent) */}
          {customEventsCount > 0 && !quest && (
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-3 border border-green-500/30">
              <p className="text-sm text-green-400">
                ✨ {customEventsCount} historically accurate events have been generated for this scenario
              </p>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg p-4 border border-blue-500/30">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">What to Try</h3>
              <p className="text-sm text-gray-200">
                {suggestion}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={handleBeginJourney}
            disabled={isProcessing}
            className={`w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/20 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Integrating Quest...
              </div>
            ) : (
              quest ? 'Begin Your Journey' : 'Start Game'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldWeaverModal;