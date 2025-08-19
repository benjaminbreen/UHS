import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle, Circle, ChevronRight, Target, Award, Clock } from 'lucide-react';
import { questService } from '../services/questService';
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
    
    window.addEventListener('questAdded', handleQuestAdded);
    window.addEventListener('questCompleted', handleQuestCompleted);
    
    return () => {
      window.removeEventListener('questAdded', handleQuestAdded);
      window.removeEventListener('questCompleted', handleQuestCompleted);
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
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const renderObjective = (objective: QuestObjective, isCurrentObjective: boolean) => {
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
            {objective.description}
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
              Show on map ({objective.targetLocation.x}, {objective.targetLocation.y})
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

    return (
      <div
        key={quest.id}
        className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
      >
        <button
          onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
          className="w-full p-3 flex items-start gap-3 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(quest.category)}`}>
                {quest.category.toUpperCase()}
              </span>
              {quest.isLLMGenerated && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-900/20 text-purple-400">
                  DYNAMIC
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{quest.title}</h3>
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

            {quest.historicalContext && (
              <div className="bg-amber-900/10 border border-amber-600/20 rounded p-2 mb-3">
                <p className="text-xs text-amber-400/80 italic">
                  Historical Context: {quest.historicalContext}
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

  const questsToDisplay = selectedTab === 'active' ? activeQuests : completedQuests;

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestsPanel;