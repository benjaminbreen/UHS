/**
 * QuestTestingPanel.tsx - Comprehensive testing panel for the quest system
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Circle, MapPin, Package, User, FastForward, RefreshCw, Bug, Zap, FileText, Target } from 'lucide-react';
import { questService } from '../services/questService';
import { questCompletionService } from '../services/questCompletionService';
import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useEventSystem } from '../hooks/useEventSystem';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';

interface QuestTestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuestTestingPanel: React.FC<QuestTestingPanelProps> = ({ isOpen, onClose }) => {
  const { mapData, npcs } = useMap();
  const { playerCharacter, setControlledIconX, setControlledIconY } = usePlayer();
  const { gameDate } = useGame();
  const { currentMode } = useEventSystem();
  
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshQuests();
    }
  }, [isOpen]);

  const refreshQuests = () => {
    setActiveQuests(questService.getActiveQuests());
    setCompletedQuests(questService.getCompletedQuests());
    addTestResult('Refreshed quest lists');
  };

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  // Determine era from game date
  const getEraFromDate = (year: number): HistoricalEra => {
    if (year < -3000) return HistoricalEra.PREHISTORY;
    if (year < 500) return HistoricalEra.ANTIQUITY;
    if (year < 1400) return HistoricalEra.MEDIEVAL;
    if (year < 1800) return HistoricalEra.RENAISSANCE_EARLY_MODERN;
    if (year < 1950) return HistoricalEra.INDUSTRIAL_ERA;
    if (year < 2100) return HistoricalEra.MODERN_ERA;
    return HistoricalEra.FUTURE_ERA;
  };
  
  // Determine cultural zone from map data
  const getCulturalZone = (): CulturalZone => {
    const mapZone = mapData?.culturalZone;
    if (mapZone) return mapZone as CulturalZone;
    
    // Default based on continent/region
    const continent = mapData?.continent || 'Europe';
    const zoneMap: Record<string, CulturalZone> = {
      'Europe': 'EUROPEAN',
      'North America': gameDate?.year && gameDate.year < 1492 ? 'NORTH_AMERICAN_PRE_COLUMBIAN' : 'NORTH_AMERICAN_COLONIAL',
      'South America': 'SOUTH_AMERICAN',
      'MENA': 'MENA',
      'Sub Saharan Africa': 'SUB_SAHARAN_AFRICAN',
      'South Asia': 'SOUTH_ASIAN',
      'East Asia': 'EAST_ASIAN',
      'Oceania': 'OCEANIC'
    };
    return zoneMap[continent] || 'EUROPEAN';
  };

  // Generate test quest with specific type
  const generateTestQuest = (type: 'delivery' | 'talk' | 'exploration' | 'collection' | 'historical') => {
    if (!mapData || !playerCharacter) {
      addTestResult('❌ Cannot generate quest: No map or player data');
      return;
    }

    setIsGenerating(true);
    
    try {
      // For historical type, use the new system
      if (type === 'historical') {
        const era = getEraFromDate(gameDate?.year || 1500);
        const culturalZone = getCulturalZone();
        const gameMode = currentMode || 'exploration';
        
        // Find a quest giver NPC
        const questGiver = npcs && npcs.length > 0 ? npcs[Math.floor(Math.random() * npcs.length)] : undefined;
        
        const quest = questService.generateHistoricalQuest(
          era,
          culturalZone,
          gameMode,
          mapData,
          npcs || [],
          { x: playerCharacter.x, y: playerCharacter.y },
          questGiver
        );
        
        if (quest) {
          addTestResult(`✅ Generated historical quest: ${quest.title} (${era} - ${culturalZone})`);
          refreshQuests();
          setSelectedQuest(quest);
        } else {
          addTestResult('❌ Failed to generate historical quest - no suitable templates or locations');
        }
        
        setIsGenerating(false);
        return;
      }
      
      // Original test quest generation for other types
      const structures = mapData.terrainStructures || [];
      const availableNpcs = npcs || [];
      
      let quest: Quest;
      
      switch (type) {
        case 'delivery': {
          // Find two different NPCs for delivery quest
          const giver = availableNpcs[0];
          const target = availableNpcs.find(n => n.id !== giver?.id) || availableNpcs[1];
          
          if (!giver || !target) {
            addTestResult('❌ Not enough NPCs for delivery quest');
            setIsGenerating(false);
            return;
          }
          
          quest = {
            id: `test_delivery_${Date.now()}`,
            title: 'Test Delivery Quest',
            description: `Deliver a package from ${giver.name} to ${target.name}`,
            category: 'trade',
            giver: giver.name,
            giverLocation: { x: giver.x, y: giver.y },
            objectives: [
              {
                id: 'obj1',
                type: 'talk_to_npc',
                description: `Talk to ${giver.name} to receive the package`,
                targetNPC: giver.name,
                targetLocation: { x: giver.x, y: giver.y },
                completed: false
              },
              {
                id: 'obj2',
                type: 'deliver_item',
                description: `Deliver package to ${target.name}`,
                targetNPC: target.name,
                targetLocation: { x: target.x, y: target.y },
                targetItem: 'QUEST_PACKAGE',
                completed: false
              }
            ],
            rewards: [
              { type: 'currency', amount: 50, description: '50 gold' },
              { type: 'reputation', amount: 10, description: '+10 reputation' }
            ],
            status: 'active',
            currentObjectiveIndex: 0,
            acceptedTime: Date.now(),
            isLLMGenerated: false
          };
          
          // Add quest item to inventory
          questCompletionService.addQuestItem(playerCharacter, quest.title, 'package');
          addTestResult(`✅ Generated delivery quest: ${quest.title}`);
          break;
        }
        
        case 'exploration': {
          // Find interesting structures to explore
          const marketplace = structures.find(s => s.type === 'marketplace');
          const ruins = structures.find(s => s.type === 'ruins');
          
          quest = {
            id: `test_explore_${Date.now()}`,
            title: 'Test Exploration Quest',
            description: 'Explore key locations in the area',
            category: 'exploration',
            giver: 'System',
            giverLocation: { x: playerCharacter.x, y: playerCharacter.y },
            objectives: [
              {
                id: 'obj1',
                type: 'explore_location',
                description: marketplace ? 'Visit the marketplace' : 'Explore the area',
                targetLocation: marketplace ? { x: marketplace.x || 0, y: marketplace.y || 0 } : { x: playerCharacter.x + 5, y: playerCharacter.y + 5 },
                completed: false
              },
              {
                id: 'obj2',
                type: 'explore_location',
                description: ruins ? 'Investigate the ruins' : 'Find something interesting',
                targetLocation: ruins ? { x: ruins.x || 0, y: ruins.y || 0 } : { x: playerCharacter.x - 5, y: playerCharacter.y - 5 },
                completed: false
              }
            ],
            rewards: [
              { type: 'experience', amount: 100, description: '+100 XP' }
            ],
            status: 'active',
            currentObjectiveIndex: 0,
            acceptedTime: Date.now(),
            isLLMGenerated: false
          };
          
          addTestResult(`✅ Generated exploration quest: ${quest.title}`);
          break;
        }
        
        case 'talk': {
          // Simple talk to NPC quest
          const targetNpc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
          
          if (!targetNpc) {
            addTestResult('❌ No NPCs available for talk quest');
            setIsGenerating(false);
            return;
          }
          
          quest = {
            id: `test_talk_${Date.now()}`,
            title: 'Test Conversation Quest',
            description: `Have an important conversation with ${targetNpc.name}`,
            category: 'social',
            giver: 'System',
            giverLocation: { x: playerCharacter.x, y: playerCharacter.y },
            objectives: [
              {
                id: 'obj1',
                type: 'talk_to_npc',
                description: `Speak with ${targetNpc.name}`,
                targetNPC: targetNpc.name,
                targetLocation: { x: targetNpc.x, y: targetNpc.y },
                completed: false
              }
            ],
            rewards: [
              { type: 'reputation', amount: 5, description: '+5 reputation' }
            ],
            status: 'active',
            currentObjectiveIndex: 0,
            acceptedTime: Date.now(),
            isLLMGenerated: false
          };
          
          addTestResult(`✅ Generated talk quest: ${quest.title}`);
          break;
        }
        
        case 'collection': {
          quest = {
            id: `test_collect_${Date.now()}`,
            title: 'Test Collection Quest',
            description: 'Collect resources from the environment',
            category: 'survival',
            giver: 'System',
            giverLocation: { x: playerCharacter.x, y: playerCharacter.y },
            objectives: [
              {
                id: 'obj1',
                type: 'collect_item',
                description: 'Gather 5 pieces of wood',
                targetItem: 'wood',
                requiredAmount: 5,
                currentAmount: 0,
                completed: false
              },
              {
                id: 'obj2',
                type: 'collect_item',
                description: 'Collect 3 herbs',
                targetItem: 'herb',
                requiredAmount: 3,
                currentAmount: 0,
                completed: false
              }
            ],
            rewards: [
              { type: 'item', itemId: 'health_potion', description: 'Health Potion' }
            ],
            status: 'active',
            currentObjectiveIndex: 0,
            acceptedTime: Date.now(),
            isLLMGenerated: false
          };
          
          addTestResult(`✅ Generated collection quest: ${quest.title}`);
          break;
        }
        
        default:
          quest = {} as Quest;
      }
      
      // Add quest to service
      questService.addQuest(quest);
      refreshQuests();
      setSelectedQuest(quest);
      
    } catch (error) {
      addTestResult(`❌ Error generating quest: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Teleport player to quest objective
  const teleportToObjective = (quest: Quest) => {
    const currentObj = quest.objectives[quest.currentObjectiveIndex];
    if (currentObj?.targetLocation) {
      setControlledIconX(currentObj.targetLocation.x);
      setControlledIconY(currentObj.targetLocation.y);
      addTestResult(`📍 Teleported to (${currentObj.targetLocation.x}, ${currentObj.targetLocation.y})`);
      onClose(); // Close panel to see the map
    } else {
      addTestResult('❌ No target location for current objective');
    }
  };

  // Force complete current objective
  const forceCompleteObjective = (quest: Quest) => {
    const currentObj = quest.objectives[quest.currentObjectiveIndex];
    if (currentObj && playerCharacter) {
      const result = questCompletionService.completeObjective(quest, currentObj, playerCharacter);
      addTestResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
      refreshQuests();
    }
  };

  // Skip to specific objective
  const skipToObjective = (quest: Quest, objectiveIndex: number) => {
    quest.currentObjectiveIndex = objectiveIndex;
    // Mark previous objectives as complete
    for (let i = 0; i < objectiveIndex; i++) {
      quest.objectives[i].completed = true;
    }
    addTestResult(`⏭️ Skipped to objective ${objectiveIndex + 1}`);
    refreshQuests();
  };

  // Reset quest progress
  const resetQuest = (quest: Quest) => {
    quest.currentObjectiveIndex = 0;
    quest.objectives.forEach(obj => {
      obj.completed = false;
      if ('currentAmount' in obj) {
        obj.currentAmount = 0;
      }
    });
    quest.status = 'active';
    addTestResult(`🔄 Reset quest: ${quest.title}`);
    refreshQuests();
  };

  // Delete quest
  const deleteQuest = (questId: string) => {
    questService.removeQuest(questId);
    addTestResult(`🗑️ Deleted quest: ${questId}`);
    refreshQuests();
    setSelectedQuest(null);
  };

  // Clear all quests
  const clearAllQuests = () => {
    if (confirm('Are you sure you want to clear ALL quests?')) {
      localStorage.removeItem('activeQuests');
      localStorage.removeItem('completedQuests');
      window.location.reload(); // Refresh to clear quest service state
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Quest Testing Panel</h2>
            <span className="text-xs text-slate-400 ml-2">
              Active: {activeQuests.length} | Completed: {completedQuests.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Quest Generation */}
          <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Generate Test Quests</h3>
            
            <div className="space-y-2 mb-4">
              <button
                onClick={() => generateTestQuest('historical')}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-all flex items-center gap-2 font-semibold"
              >
                <ScrollText className="w-4 h-4" />
                Historical Quest (New System)
              </button>
              
              <div className="text-xs text-slate-500 text-center my-2">— or generate test quests —</div>
              
              <button
                onClick={() => generateTestQuest('delivery')}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Delivery Quest
              </button>
              
              <button
                onClick={() => generateTestQuest('exploration')}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Exploration Quest
              </button>
              
              <button
                onClick={() => generateTestQuest('talk')}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Conversation Quest
              </button>
              
              <button
                onClick={() => generateTestQuest('collection')}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Collection Quest
              </button>
            </div>
            
            {/* Show current context */}
            <div className="bg-slate-800 rounded-lg p-2 mb-3">
              <h4 className="text-xs font-semibold text-slate-400 mb-1">Current Context</h4>
              <div className="space-y-0.5 text-xs text-slate-300">
                <div>Era: {getEraFromDate(gameDate?.year || 1500)}</div>
                <div>Zone: {getCulturalZone()}</div>
                <div>Mode: {currentMode || 'exploration'}</div>
                <div>Year: {gameDate?.year || 1500}</div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Utility Actions</h3>
              
              <div className="space-y-2">
                <button
                  onClick={refreshQuests}
                  className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Quest Lists
                </button>
                
                <button
                  onClick={clearAllQuests}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Quests
                </button>
              </div>
            </div>

            {/* Test Results Log */}
            <div className="mt-4 border-t border-slate-700 pt-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Test Log</h3>
              <div className="bg-slate-800 rounded-lg p-2 h-48 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-xs text-slate-500">No test actions yet</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, i) => (
                      <p key={i} className="text-xs text-slate-400 font-mono">
                        {result}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Panel - Quest List */}
          <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Quests</h3>
            
            <div className="space-y-2">
              {activeQuests.length === 0 ? (
                <p className="text-sm text-slate-500">No active quests</p>
              ) : (
                activeQuests.map(quest => (
                  <button
                    key={quest.id}
                    onClick={() => setSelectedQuest(quest)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedQuest?.id === quest.id
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-white">{quest.title}</span>
                      {quest.isLLMGenerated && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded">
                          LLM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {quest.objectives.filter(o => o.completed).length}/{quest.objectives.length} objectives
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      ID: {quest.id}
                    </div>
                  </button>
                ))
              )}
            </div>

            {completedQuests.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-300 mt-6 mb-3">Completed Quests</h3>
                <div className="space-y-2">
                  {completedQuests.map(quest => (
                    <button
                      key={quest.id}
                      onClick={() => setSelectedQuest(quest)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedQuest?.id === quest.id
                          ? 'bg-green-900/30 border-green-500'
                          : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-slate-300">{quest.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Quest Details & Controls */}
          <div className="w-1/3 p-4 overflow-y-auto">
            {selectedQuest ? (
              <>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Quest Details</h3>
                
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                  <h4 className="text-white font-medium mb-2">{selectedQuest.title}</h4>
                  <p className="text-sm text-slate-400 mb-3">{selectedQuest.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className={selectedQuest.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>
                        {selectedQuest.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className="text-slate-300">{selectedQuest.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giver:</span>
                      <span className="text-slate-300">{selectedQuest.giver}</span>
                    </div>
                    {selectedQuest.giverLocation && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Giver Location:</span>
                        <span className="text-slate-300">
                          ({selectedQuest.giverLocation.x}, {selectedQuest.giverLocation.y})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-300 mb-2">Objectives</h4>
                <div className="space-y-2 mb-4">
                  {selectedQuest.objectives.map((obj, index) => (
                    <div
                      key={obj.id}
                      className={`p-2 rounded-lg border ${
                        index === selectedQuest.currentObjectiveIndex
                          ? 'bg-blue-900/20 border-blue-500/50'
                          : obj.completed
                          ? 'bg-green-900/10 border-green-500/30'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {obj.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-slate-300">{obj.description}</p>
                          {obj.targetLocation && (
                            <p className="text-xs text-slate-500 mt-1">
                              📍 ({obj.targetLocation.x}, {obj.targetLocation.y})
                            </p>
                          )}
                        </div>
                        {!obj.completed && (
                          <button
                            onClick={() => skipToObjective(selectedQuest, index)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                            title="Skip to this objective"
                          >
                            <FastForward className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h4 className="text-sm font-semibold text-slate-300 mb-2">Test Actions</h4>
                <div className="space-y-2">
                  {selectedQuest.status === 'active' && (
                    <>
                      <button
                        onClick={() => teleportToObjective(selectedQuest)}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Teleport to Current Objective
                      </button>
                      
                      <button
                        onClick={() => forceCompleteObjective(selectedQuest)}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Force Complete Objective
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => resetQuest(selectedQuest)}
                    className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Quest Progress
                  </button>
                  
                  <button
                    onClick={() => deleteQuest(selectedQuest.id)}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Quest
                  </button>
                </div>

                {/* Debug Info */}
                <details className="mt-4">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                    Debug Information
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-400 overflow-x-auto">
                    {JSON.stringify(selectedQuest, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <div className="text-center text-slate-500 mt-8">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a quest to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestTestingPanel;