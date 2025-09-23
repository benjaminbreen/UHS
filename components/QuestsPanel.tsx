import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle, Circle, ChevronRight, Target, Award, Clock, Shield, Zap, BookOpen, Navigation, Users, Sparkles, Scroll } from 'lucide-react';
import { questService } from '../services/questService';
import { worldWeaverQuestService } from '../services/worldWeaverQuestService';
import { Quest, QuestObjective } from '../types/questTypes';

interface QuestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToQuest?: (x: number, y: number) => void;
}

const QuestsPanel: React.FC<QuestsPanelProps> = ({ isOpen, onClose, onNavigateToQuest }) => {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [completionAnimation, setCompletionAnimation] = useState<{ questId: string; show: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveQuests(questService.getActiveQuests());
      setCompletedQuests(questService.getCompletedQuests());
    }
  }, [isOpen]);
  
  // Listen for quest updates
  useEffect(() => {
    const handleQuestAdded = () => {
      setActiveQuests(questService.getActiveQuests());
      setCompletedQuests(questService.getCompletedQuests());
    };
    
    const handleQuestCompleted = () => {
      setActiveQuests(questService.getActiveQuests());
      setCompletedQuests(questService.getCompletedQuests());
    };
    
    const handleQuestProgressUpdated = () => {
      // Refresh quests when progress changes (e.g., objective auto-completed)
      setActiveQuests(questService.getActiveQuests());
    };
    
    const handleQuestObjectiveComplete = (event: CustomEvent) => {
      // Show a brief notification when an objective is completed
      console.log('Quest objective completed:', event.detail.message);
      setActiveQuests(questService.getActiveQuests());
    };
    
    const handleQuestComplete = (event: CustomEvent) => {
      // Trigger completion animation
      const questId = event.detail.quest?.id;
      if (questId) {
        setCompletionAnimation({ questId, show: true });
        setTimeout(() => setCompletionAnimation(null), 3000);
      }
      setActiveQuests(questService.getActiveQuests());
      setCompletedQuests(questService.getCompletedQuests());
    };
    
    const handleActiveQuestChanged = () => {
      // Refresh quest data when active quest changes
      setActiveQuests(questService.getActiveQuests());
    };
    
    window.addEventListener('questAdded', handleQuestAdded);
    window.addEventListener('questCompleted', handleQuestCompleted);
    window.addEventListener('questProgressUpdated', handleQuestProgressUpdated);
    window.addEventListener('questObjectiveComplete', handleQuestObjectiveComplete as EventListener);
    window.addEventListener('questComplete', handleQuestComplete as EventListener);
    window.addEventListener('activeQuestChanged', handleActiveQuestChanged);
    
    return () => {
      window.removeEventListener('questAdded', handleQuestAdded);
      window.removeEventListener('questCompleted', handleQuestCompleted);
      window.removeEventListener('questProgressUpdated', handleQuestProgressUpdated);
      window.removeEventListener('questObjectiveComplete', handleQuestObjectiveComplete as EventListener);
      window.removeEventListener('questComplete', handleQuestComplete as EventListener);
      window.removeEventListener('activeQuestChanged', handleActiveQuestChanged);
    };
  }, []);

  // Always render but with conditional visibility for smooth animations
  if (!isOpen) {
    return (
      <div className="fixed top-16 right-0 w-full max-w-lg z-[55] -translate-y-full opacity-0 scale-y-0 transition-all duration-300 ease-out origin-top pointer-events-none" />
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'main': return 'text-yellow-400 bg-yellow-900/20';
      case 'trade': return 'text-green-400 bg-green-900/20';
      case 'exploration': return 'text-blue-400 bg-blue-900/20';
      case 'social': return 'text-purple-400 bg-purple-900/20';
      case 'survival': return 'text-red-400 bg-red-900/20';
      case 'combat': return 'text-orange-400 bg-orange-900/20';
      case 'diplomacy': return 'text-indigo-400 bg-indigo-900/20';
      case 'scholarship': return 'text-cyan-400 bg-cyan-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat': return Shield;
      case 'exploration': return Navigation;
      case 'social': return Users;
      case 'scholarship': return BookOpen;
      case 'survival': return Zap;
      default: return Target;
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const calculateDistance = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    return Math.floor(Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)));
  };

  const renderObjective = (objective: QuestObjective, isCurrentObjective: boolean) => {
    // Enhanced objective description with actual entity names
    const enhancedDescription = objective.targetNpcName 
      ? objective.description.replace(/NPC|npc|person/, objective.targetNpcName)
      : objective.description;
      
    return (
      <div 
        key={objective.id}
        className={`flex items-start gap-2 p-2 rounded ${
          objective.completed 
            ? 'opacity-50' 
            : isCurrentObjective 
              ? 'bg-blue-900/20 border border-blue-500/30' 
              : ''
        }`}
      >
        {objective.completed ? (
          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
        ) : (
          <Circle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            isCurrentObjective ? 'text-blue-400' : 'text-gray-500'
          }`} />
        )}
        <div className="flex-1">
          <p className={`text-xs ${
            objective.completed ? 'line-through text-gray-500' : 'text-gray-300'
          }`}>
            {enhancedDescription}
          </p>
          {objective.targetLocation && !objective.completed && (
            <button
              onClick={() => onNavigateToQuest?.(
                objective.targetLocation!.x,
                objective.targetLocation!.y
              )}
              className="flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <MapPin className="w-3 h-3" />
              {(() => {
                const distance = calculateDistance(
                  { x: 0, y: 0 }, // Would need player position here
                  objective.targetLocation!
                );
                return `Tile [${Math.floor(objective.targetLocation!.x)}, ${Math.floor(objective.targetLocation!.y)}] • ~${distance} tiles away`;
              })()}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuest = (quest: Quest) => {
    const isExpanded = expandedQuest === quest.id;
    const progress = quest.objectives.filter(o => o.completed).length;
    const total = quest.objectives.length;
    const progressPercentage = questService.getQuestProgress(quest);
    const currentObjective = quest.objectives[quest.currentObjectiveIndex];
    const objectiveProgress = currentObjective ? questService.getObjectiveProgress(currentObjective) : '';

    const hasCompletionAnimation = completionAnimation?.questId === quest.id && completionAnimation?.show;
    
    return (
      <div
        key={quest.id}
        className={`bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden relative ${
          hasCompletionAnimation ? 'animate-pulse ring-2 ring-yellow-400 ring-opacity-75' : ''
        }`}
      >
        {/* Completion sparkle effect */}
        {hasCompletionAnimation && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-green-400/20 animate-pulse" />
            <div className="absolute top-2 right-2 text-2xl animate-bounce">🎉</div>
          </div>
        )}
        <button
          onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
          className="w-full p-3 flex items-start gap-3 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                const Icon = getCategoryIcon(quest.category);
                return <Icon className="w-3 h-3 text-gray-400" />;
              })()}
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(quest.category)}`}>
                {quest.category.toUpperCase()}
              </span>
              {quest.difficulty && (
                <span className={`text-[10px] font-medium ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty.toUpperCase()}
                </span>
              )}
              {quest.isLLMGenerated && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-900/20 text-purple-400">
                  DYNAMIC
                </span>
              )}
              {worldWeaverQuestService.isWorldWeaverQuest(quest.id) && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-400 border border-green-500/30 flex items-center gap-1">
                  <Sparkles className="w-2 h-2" />
                  AI QUEST
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{quest.title}</h3>
            
            {/* Progress Bar */}
            {quest.status === 'active' && (
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="h-full rounded-full bg-white/20 animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {progress}/{total} objectives
              </span>
              {quest.status === 'completed' && quest.completedTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(quest.completedTime).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {/* Current Objective Progress (for collection quests) */}
            {objectiveProgress && quest.status === 'active' && (
              <div className="mt-1 text-xs text-blue-400">
                Progress: {objectiveProgress}
              </div>
            )}
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 border-t border-slate-700/50">
            <p className="text-xs text-gray-300 mt-3 mb-3">
              {quest.description}
            </p>
            
            {/* Quest Activation Button */}
            {selectedTab === 'active' && (
              <div className="mb-3">
                <button
                  onClick={() => {
                    if (quest.isActiveQuest) {
                      questService.deactivateAllQuests();
                    } else {
                      questService.setActiveQuest(quest.id);
                    }
                    // Refresh quest data
                    setActiveQuests(questService.getActiveQuests());
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    quest.isActiveQuest
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-500'
                      : 'bg-slate-600 hover:bg-slate-500 text-slate-300 border border-slate-500'
                  }`}
                >
                  {quest.isActiveQuest ? 'Active Quest' : 'Activate'}
                </button>
              </div>
            )}

            {/* WorldWeaver Quest Journal Button */}
            {worldWeaverQuestService.isWorldWeaverQuest(quest.id) && (
              <div className="mb-3">
                <button
                  onClick={() => {
                    // Open journal to quest entry
                    window.dispatchEvent(new CustomEvent('openJournal', {
                      detail: { questId: quest.id }
                    }));
                  }}
                  className="px-3 py-1 rounded text-xs font-medium transition-colors bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white border border-green-500/50 flex items-center gap-1"
                >
                  <Scroll className="w-3 h-3" />
                  View Quest Details in Journal
                </button>
              </div>
            )}

            {quest.historicalContext && (
              <div className="bg-amber-900/10 border border-amber-600/20 rounded p-2 mb-3">
                <p className="text-xs text-amber-400/80 italic">
                  📜 {quest.historicalContext}
                </p>
              </div>
            )}

            <div className="space-y-1 mb-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Objectives:</h4>
              {quest.objectives.map((obj, index) => 
                renderObjective(obj, index === quest.currentObjectiveIndex)
              )}
            </div>

            {quest.rewards.length > 0 && (
              <div className="bg-green-900/10 border border-green-600/20 rounded p-2">
                <h4 className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Rewards:
                </h4>
                <div className="space-y-1">
                  {quest.rewards.map((reward, index) => (
                    <p key={index} className="text-xs text-green-300">
                      • {reward.description}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Sort quests by category for better organization
  const sortQuests = (quests: Quest[]) => {
    const categoryOrder = ['main', 'survival', 'exploration', 'trade', 'social', 'combat', 'diplomacy', 'scholarship'];
    return [...quests].sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category) !== -1 ? categoryOrder.indexOf(a.category) : 999;
      const bIndex = categoryOrder.indexOf(b.category) !== -1 ? categoryOrder.indexOf(b.category) : 999;
      return aIndex - bIndex;
    });
  };
  
  const questsToDisplay = sortQuests(selectedTab === 'active' ? activeQuests : completedQuests);

  return (
    <div className={`
      fixed top-16 right-0 w-full max-w-lg z-[55]
      bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 
      backdrop-blur-md shadow-2xl border-l border-slate-600 border-b border-slate-600
      transition-all duration-300 ease-out origin-top
      ${isOpen 
        ? 'translate-y-0 opacity-100 scale-y-100' 
        : '-translate-y-full opacity-0 scale-y-0'
      }
    `}>
      <div className="max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-300" />
              Quests & Objectives
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setSelectedTab('active')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              selectedTab === 'active'
                ? 'text-white bg-slate-700/50 border-b-2 border-slate-400'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Active ({activeQuests.length})
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              selectedTab === 'completed'
                ? 'text-white bg-slate-700/50 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Completed ({completedQuests.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
          {questsToDisplay.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {selectedTab === 'active' 
                  ? 'No active quests. Explore the world to discover new objectives!'
                  : 'No completed quests yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {questsToDisplay.map(quest => renderQuest(quest))}
              
              {selectedTab === 'completed' && completedQuests.length > 0 && (
                <button
                  onClick={() => {
                    questService.clearCompletedQuests();
                    setCompletedQuests([]);
                  }}
                  className="w-full mt-4 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-600/30 rounded text-xs text-red-400 transition-colors"
                >
                  Clear All Completed Quests
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestsPanel;