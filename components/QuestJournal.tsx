/**
 * Quest Journal Component
 * Detailed quest tracking with lore, progression, and rewards
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, X, MapPin, Clock, Award, ChevronRight, 
  AlertCircle, CheckCircle2, Circle, Lock, Eye,
  Scroll, Sword, Coins, Heart, Brain, Map
} from 'lucide-react';
import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { questService } from '../services/questService';

interface QuestJournalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToQuest?: (x: number, y: number) => void;
  playerCharacter?: any;
}

const QuestJournal: React.FC<QuestJournalProps> = ({ 
  isOpen, 
  onClose, 
  onNavigateToQuest,
  playerCharacter 
}) => {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [failedQuests, setFailedQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'failed'>('active');

  useEffect(() => {
    if (isOpen) {
      const allQuests = questService.getActiveQuests();
      const completed = questService.getCompletedQuests();
      
      setActiveQuests(allQuests);
      setCompletedQuests(completed.filter(q => q.status === 'completed'));
      setFailedQuests(completed.filter(q => q.status === 'failed'));
      
      // Auto-select first active quest
      if (!selectedQuest && allQuests.length > 0) {
        setSelectedQuest(allQuests[0]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat': return <Sword className="w-4 h-4" />;
      case 'exploration': return <Map className="w-4 h-4" />;
      case 'trade': return <Coins className="w-4 h-4" />;
      case 'social': return <Heart className="w-4 h-4" />;
      case 'scholarship': return <Brain className="w-4 h-4" />;
      case 'mystery': return <Eye className="w-4 h-4" />;
      default: return <Scroll className="w-4 h-4" />;
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'money': return <Coins className="w-3 h-3" />;
      case 'reputation': return <Award className="w-3 h-3" />;
      case 'knowledge': return <Brain className="w-3 h-3" />;
      case 'item': return <Award className="w-3 h-3" />;
      case 'health': return <Heart className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const renderObjective = (obj: QuestObjective, isActive: boolean) => {
    if (obj.hidden) {
      return (
        <div key={obj.id} className="flex items-center gap-2 p-2 opacity-50">
          <Lock className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500 italic">Hidden objective</span>
        </div>
      );
    }

    return (
      <div 
        key={obj.id}
        className={`flex items-start gap-2 p-2 rounded transition-all ${
          obj.completed 
            ? 'opacity-50 bg-green-900/10' 
            : isActive 
              ? 'bg-blue-900/20 border-l-2 border-blue-400' 
              : 'hover:bg-slate-700/30'
        }`}
      >
        {obj.completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
        ) : obj.optional ? (
          <Circle className="w-4 h-4 text-yellow-400 mt-0.5" />
        ) : (
          <Circle className="w-4 h-4 text-gray-400 mt-0.5" />
        )}
        
        <div className="flex-1">
          <p className={`text-sm ${obj.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
            {obj.description}
            {obj.optional && <span className="text-xs text-yellow-400 ml-2">(Optional)</span>}
          </p>
          
          {obj.progress !== undefined && obj.total && !obj.completed && (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{obj.progress}/{obj.total}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(obj.progress / obj.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {obj.timeLimit && !obj.completed && (
            <div className="flex items-center gap-1 mt-1 text-xs text-orange-400">
              <Clock className="w-3 h-3" />
              <span>Time limit: {Math.floor(obj.timeLimit / 60)} minutes</span>
            </div>
          )}
          
          {obj.targetLocation && !obj.completed && (
            <button
              onClick={() => onNavigateToQuest?.(obj.targetLocation!.x, obj.targetLocation!.y)}
              className="flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <MapPin className="w-3 h-3" />
              <span>Show on map</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReward = (reward: QuestReward) => {
    return (
      <div key={`${reward.type}-${reward.value}`} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
        {getRewardIcon(reward.type)}
        <span className="text-xs text-gray-300">{reward.description}</span>
        {!reward.guaranteed && reward.chance && (
          <span className="text-xs text-gray-500">({Math.round(reward.chance * 100)}% chance)</span>
        )}
      </div>
    );
  };

  const renderQuestList = (quests: Quest[]) => {
    return (
      <div className="space-y-2">
        {quests.map(quest => {
          const progress = quest.objectives.filter(o => o.completed && !o.optional).length;
          const total = quest.objectives.filter(o => !o.optional).length;
          const isSelected = selectedQuest?.id === quest.id;

          return (
            <button
              key={quest.id}
              onClick={() => setSelectedQuest(quest)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isSelected 
                  ? 'bg-slate-700/50 border border-blue-500/50' 
                  : 'bg-slate-800/30 hover:bg-slate-700/30 border border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-1">{getCategoryIcon(quest.category)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">{quest.title}</h4>
                    {quest.difficulty && (
                      <span className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty}
                      </span>
                    )}
                  </div>
                  
                  {quest.status === 'active' && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Progress</span>
                        <span>{progress}/{total}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${(progress / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {quest.status === 'failed' && (
                    <p className="text-xs text-red-400 mt-1">Failed</p>
                  )}
                  
                  {quest.status === 'completed' && (
                    <p className="text-xs text-green-400 mt-1">Completed</p>
                  )}
                </div>
                {isSelected && <ChevronRight className="w-4 h-4 text-blue-400 mt-1" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const getQuestsByTab = () => {
    switch (selectedTab) {
      case 'active': return activeQuests;
      case 'completed': return completedQuests;
      case 'failed': return failedQuests;
      default: return [];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-800/80 p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Book className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Quest Journal</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                {(['active', 'completed', 'failed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="ml-2 text-xs opacity-70">
                      ({tab === 'active' ? activeQuests.length : 
                        tab === 'completed' ? completedQuests.length : 
                        failedQuests.length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex h-[calc(100%-120px)]">
              {/* Quest List */}
              <div className="w-1/3 p-4 border-r border-slate-700 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  {selectedTab === 'active' ? 'Active Quests' : 
                   selectedTab === 'completed' ? 'Completed Quests' : 
                   'Failed Quests'}
                </h3>
                {renderQuestList(getQuestsByTab())}
              </div>

              {/* Quest Details */}
              <div className="flex-1 p-4 overflow-y-auto">
                {selectedQuest ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-white">{selectedQuest.title}</h3>
                        <div className="flex items-center gap-2">
                          {selectedQuest.difficulty && (
                            <span className={`text-sm ${getDifficultyColor(selectedQuest.difficulty)}`}>
                              {selectedQuest.difficulty}
                            </span>
                          )}
                          {getCategoryIcon(selectedQuest.category)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{selectedQuest.description}</p>
                      {selectedQuest.historicalContext && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          {selectedQuest.historicalContext}
                        </p>
                      )}
                    </div>

                    {/* Objectives */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Objectives</h4>
                      <div className="space-y-1">
                        {selectedQuest.objectives.map((obj, index) => 
                          renderObjective(obj, index === selectedQuest.currentObjectiveIndex)
                        )}
                      </div>
                    </div>

                    {/* Rewards */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Rewards</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedQuest.rewards.map(renderReward)}
                      </div>
                      
                      {selectedQuest.bonusRewards && selectedQuest.bonusRewards.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-yellow-400 mb-2">Bonus Rewards (Complete all optional objectives)</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedQuest.bonusRewards.map(renderReward)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Failure Conditions */}
                    {selectedQuest.failureConditions && selectedQuest.failureConditions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Failure Conditions</h4>
                        <div className="space-y-1">
                          {selectedQuest.failureConditions.map((condition, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-red-900/20 rounded text-xs text-red-300">
                              <AlertCircle className="w-3 h-3" />
                              <span>{condition.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quest Chain Info */}
                    {selectedQuest.chainId && (
                      <div className="p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                        <p className="text-xs text-purple-300">
                          This quest is part of a larger quest chain
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Select a quest to view details</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuestJournal;