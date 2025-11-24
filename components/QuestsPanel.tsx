import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle, Circle, ChevronRight, Target, Award, Clock, Shield, Zap, BookOpen, Navigation, Users, Sparkles, Scroll, Briefcase, AlertTriangle, Package, Send, ShoppingCart, Sword, Wheat } from 'lucide-react';
import { WorkOffer } from '../types/workOffer';
import { getActiveWorkOffers, loadWorkOffers, removeWorkOffer, wasAnimalKilled } from '../services/workOfferStorage';
import { PlayerCharacter } from '../types';

interface QuestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToQuest?: (x: number, y: number) => void;
  highlightedWorkOfferId?: string | null;
  currentGameHours?: number;
  currentMapSeed?: string;
  playerCharacter?: PlayerCharacter;
  onUpdatePlayer?: (updatedPlayer: PlayerCharacter) => void;
}

const QuestsPanel: React.FC<QuestsPanelProps> = ({
  isOpen,
  onClose,
  onNavigateToQuest,
  highlightedWorkOfferId,
  currentGameHours = 0,
  currentMapSeed,
  playerCharacter,
  onUpdatePlayer
}) => {
  const [workOffers, setWorkOffers] = useState<WorkOffer[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [completionAnimation, setCompletionAnimation] = useState<{ offerId: string; show: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkOffers(getActiveWorkOffers());
    }
  }, [isOpen]);

  // Listen for work offer updates and inventory changes
  useEffect(() => {
    const handleWorkOfferUpdate = () => {
      setWorkOffers(getActiveWorkOffers());
    };

    // Refresh work offers when inventory changes (for progress tracking)
    const handleInventoryChange = () => {
      setWorkOffers(getActiveWorkOffers());
    };

    window.addEventListener('workOfferAccepted', handleWorkOfferUpdate);
    window.addEventListener('workOfferCompleted', handleWorkOfferUpdate);
    window.addEventListener('workOfferFailed', handleWorkOfferUpdate);
    window.addEventListener('workOfferAbandoned', handleWorkOfferUpdate);
    window.addEventListener('inventoryUpdated', handleInventoryChange);

    return () => {
      window.removeEventListener('workOfferAccepted', handleWorkOfferUpdate);
      window.removeEventListener('workOfferCompleted', handleWorkOfferUpdate);
      window.removeEventListener('workOfferFailed', handleWorkOfferUpdate);
      window.removeEventListener('workOfferAbandoned', handleWorkOfferUpdate);
      window.removeEventListener('inventoryUpdated', handleInventoryChange);
    };
  }, []);
  
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

  const renderObjective = (objective: QuestObjective, isCurrentObjective: boolean, questId: string) => {
    // Enhanced objective description with actual entity names
    const enhancedDescription = objective.targetNpcName
      ? objective.description.replace(/NPC|npc|person/, objective.targetNpcName)
      : objective.description;

    // Get progress for observation and resource objectives
    let progressDisplay = null;
    if (objective.type === 'make_observations' && !objective.completed) {
      const progressKey = `observations_${questId}_${objective.id}`;
      const currentCount = parseInt(localStorage.getItem(progressKey) || '0');
      const targetCount = objective.targetAmount || objective.total || 3;
      progressDisplay = (
        <div className="mt-1 text-xs text-blue-400">
          📝 {currentCount} / {targetCount} observations
        </div>
      );
    } else if (objective.type === 'collect_resource' && !objective.completed) {
      const progressKey = `resources_${questId}_${objective.id}`;
      const currentAmount = parseInt(localStorage.getItem(progressKey) || '0');
      const targetAmount = objective.targetAmount || objective.total || 5;
      progressDisplay = (
        <div className="mt-1 text-xs text-green-400">
          📦 {currentAmount} / {targetAmount} collected
        </div>
      );
    }

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
          {progressDisplay}
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
                renderObjective(obj, index === quest.currentObjectiveIndex, quest.id)
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

  const renderWorkOffer = (offer: WorkOffer) => {
    const isExpanded = expandedQuest === offer.id;
    const isHighlighted = highlightedWorkOfferId === offer.id;
    const isOnDifferentMap = currentMapSeed && offer.npcLocation && offer.npcLocation.mapSeed && offer.npcLocation.mapSeed !== currentMapSeed;

    // Calculate time remaining if there's a deadline
    const timeRemaining = offer.deadline
      ? Math.max(0, (offer.offerTime + offer.deadline) - currentGameHours)
      : null;
    const isExpiringSoon = timeRemaining !== null && timeRemaining < 3;
    const isUrgent = timeRemaining !== null && timeRemaining < 12;

    // Calculate progress for item-based tasks
    const calculateItemProgress = () => {
      if (!offer.requiredItem || !playerCharacter?.inventory) return null;

      const requiredQty = offer.requiredQuantity || 1;
      const currentQty = playerCharacter.inventory
        .filter(item => item.name.toLowerCase() === offer.requiredItem?.toLowerCase())
        .reduce((sum, item) => sum + (item.quantity || 1), 0);

      return {
        current: Math.min(currentQty, requiredQty),
        required: requiredQty,
        percentage: Math.min(100, (currentQty / requiredQty) * 100)
      };
    };

    const itemProgress = calculateItemProgress();

    // Get category icon based on task type
    const getCategoryIcon = () => {
      switch (offer.taskType) {
        case 'fetch_item':
          return <Package className="w-3 h-3" />;
        case 'deliver_to_location':
          return <Send className="w-3 h-3" />;
        case 'buy_from_location':
          return <ShoppingCart className="w-3 h-3" />;
        case 'kill_animal':
          return <Sword className="w-3 h-3" />;
        case 'gather_resource':
          return <Wheat className="w-3 h-3" />;
        default:
          return <Briefcase className="w-3 h-3" />;
      }
    };

    // Get category label based on task type
    const getCategoryLabel = () => {
      switch (offer.taskType) {
        case 'fetch_item':
          return 'GATHERING';
        case 'deliver_to_location':
          return 'DELIVERY';
        case 'buy_from_location':
          return 'COMMERCE';
        case 'kill_animal':
          return 'COMBAT';
        case 'gather_resource':
          return 'RESOURCE';
        default:
          return 'WORK';
      }
    };

    // Determine work status for badge
    const getStatusBadge = () => {
      if (offer.failed) {
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-900/40 text-red-300 border border-red-600/50">
            ✗ FAILED
          </span>
        );
      }
      if (offer.completed) {
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-900/40 text-green-300 border border-green-600/50 animate-pulse">
            ✓ COMPLETE - Return for Payment
          </span>
        );
      }
      if (offer.accepted) {
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-900/40 text-blue-300 border border-blue-600/50">
            ⏳ IN PROGRESS
          </span>
        );
      }
      return null;
    };

    return (
      <div
        key={offer.id}
        className={`bg-amber-900/30 rounded-lg border overflow-hidden relative transition-all duration-500 ${
          isExpiringSoon
            ? 'border-red-500 animate-pulse ring-2 ring-red-500 ring-opacity-75'
            : isUrgent
              ? 'border-orange-500'
              : 'border-amber-600/40'
        } ${isHighlighted ? 'ring-4 ring-amber-400 ring-opacity-75 shadow-xl shadow-amber-500/50' : ''}`}
      >
        {isHighlighted && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 animate-pulse" />
            <div className="absolute top-2 right-2 text-2xl animate-bounce">💼</div>
          </div>
        )}
        <button
          onClick={() => setExpandedQuest(isExpanded ? null : offer.id)}
          className="w-full p-3 flex items-start gap-3 hover:bg-amber-800/20 transition-colors"
        >
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {getCategoryIcon()}
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-900/40 text-amber-300 border border-amber-600/50">
                {getCategoryLabel()}
              </span>
              {getStatusBadge()}
              {offer.deadline && (
                <span className="flex items-center gap-1 text-[10px] text-orange-400">
                  <Clock className="w-3 h-3" />
                  DEADLINE
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-amber-100 mb-1">
              Work for {offer.npcName}
            </h3>
            <p className="text-xs text-amber-200/80 line-clamp-2">
              {offer.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-amber-300/70">
              <span className="flex items-center gap-1">
                💰 {offer.payment} coins
              </span>
              {offer.targetLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {offer.targetLocation.name}
                </span>
              )}
              {timeRemaining !== null && (
                <span className={`flex items-center gap-1 font-medium ${
                  isExpiringSoon
                    ? 'text-red-400 animate-pulse'
                    : isUrgent
                      ? 'text-orange-400'
                      : 'text-yellow-400'
                }`}>
                  <Clock className="w-3 h-3" />
                  {timeRemaining < 1
                    ? 'EXPIRED'
                    : `${Math.floor(timeRemaining)}h ${Math.floor((timeRemaining % 1) * 60)}m left`
                  }
                </span>
              )}
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 border-t border-amber-700/50 bg-amber-950/30">
            <p className="text-xs text-amber-200 mt-3 mb-3">
              {offer.description}
            </p>

            {offer.requiredItem && (
              <div className="bg-amber-900/20 border border-amber-600/30 rounded p-2 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-amber-300">
                    <strong>Required:</strong> {offer.requiredQuantity || 1}x {offer.requiredItem}
                  </p>
                  {itemProgress && !offer.completed && (
                    <span className={`text-xs font-medium ${
                      itemProgress.current >= itemProgress.required
                        ? 'text-green-400'
                        : 'text-amber-400'
                    }`}>
                      {itemProgress.current}/{itemProgress.required}
                    </span>
                  )}
                </div>
                {itemProgress && !offer.completed && (
                  <div className="w-full bg-amber-950/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        itemProgress.current >= itemProgress.required
                          ? 'bg-green-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${itemProgress.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {offer.targetLocation && (
              <button
                onClick={() => onNavigateToQuest?.(
                  offer.targetLocation!.x,
                  offer.targetLocation!.y
                )}
                className="flex items-center gap-1 mb-2 text-xs text-blue-400 hover:text-blue-300"
              >
                <MapPin className="w-3 h-3" />
                Navigate to {offer.targetLocation.name}
              </button>
            )}

            {offer.targetAnimal && (
              <div className="bg-red-900/20 border border-red-600/30 rounded p-2 mb-2">
                <p className="text-xs text-red-300 mb-2">
                  <strong>Hunt:</strong> {offer.targetAnimal}
                </p>
                {/* Show kill status */}
                {offer.taskType === 'kill_animal' && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {wasAnimalKilled(offer.id, offer.targetAnimal) ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 font-semibold">
                          {offer.targetAnimal} killed! Return to {offer.npcName} to collect payment.
                        </span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-300">
                          Hunt in progress
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NPC Location */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded p-2 mb-2">
              <h4 className="text-xs font-semibold text-blue-400 mb-1">Return to {offer.npcName}:</h4>
              {isOnDifferentMap ? (
                <div className="text-xs text-orange-300">
                  <p className="flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    ⚠️ NPC is on a different map!
                  </p>
                  <p className="text-orange-200/80">Location: ({offer.npcLocation.x}, {offer.npcLocation.y})</p>
                  <p className="text-orange-200/60 text-[10px] mt-1">Travel to the original map to complete this work.</p>
                </div>
              ) : (
                <button
                  onClick={() => onNavigateToQuest?.(
                    offer.npcLocation.x,
                    offer.npcLocation.y
                  )}
                  className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                >
                  <MapPin className="w-3 h-3" />
                  Navigate to ({offer.npcLocation.x}, {offer.npcLocation.y})
                </button>
              )}
            </div>

            <div className="bg-green-900/20 border border-green-600/30 rounded p-2 mb-2">
              <h4 className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Payment:
              </h4>
              <p className="text-xs text-green-300">
                💰 {offer.payment} coins upon completion
              </p>
            </div>

            {/* Abandon Work Button */}
            <button
              onClick={() => {
                const REPUTATION_PENALTY = 10;
                if (window.confirm(
                  `Abandon work from ${offer.npcName}?\n\n` +
                  `This will:\n` +
                  `• Remove this work offer\n` +
                  `• Reduce your reputation by ${REPUTATION_PENALTY} points\n\n` +
                  `This cannot be undone.`
                )) {
                  const offerId = offer.id;

                  // Apply reputation penalty if we have player character
                  if (playerCharacter && onUpdatePlayer) {
                    const updatedCharacter = {
                      ...playerCharacter,
                      mapReputation: Math.max(0, (playerCharacter.mapReputation || 50) - REPUTATION_PENALTY),
                      reputation: Math.max(0, (playerCharacter.reputation || 50) - REPUTATION_PENALTY)
                    };
                    onUpdatePlayer(updatedCharacter);
                  }

                  // Remove work offer
                  removeWorkOffer(offerId);
                  setWorkOffers(getActiveWorkOffers());
                  setExpandedQuest(null);

                  // Dispatch event for quest panel refresh
                  window.dispatchEvent(new CustomEvent('workOfferAbandoned', { detail: { offerId } }));

                  // Show toast notification
                  const event = new CustomEvent('showToast', {
                    detail: { message: `Abandoned work from ${offer.npcName}. -${REPUTATION_PENALTY} reputation.` }
                  });
                  window.dispatchEvent(event);
                }
              }}
              className="w-full px-3 py-2 bg-red-900/30 hover:bg-red-900/40 border border-red-600/40 rounded text-xs text-red-300 transition-colors"
            >
              ✗ Abandon Work
            </button>
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
      fixed top-16 right-0 w-full max-w-lg z-[60]
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
          {selectedTab === 'active' && workOffers.length === 0 && questsToDisplay.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                No active quests or work offers. Explore the world to discover new objectives!
              </p>
            </div>
          ) : selectedTab === 'completed' && questsToDisplay.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                No completed quests yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Work Offers Section - Only shown on active tab */}
              {selectedTab === 'active' && workOffers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                    <Briefcase className="w-3 h-3" />
                    Active Work Offers ({workOffers.length})
                  </h3>
                  {workOffers.map(offer => renderWorkOffer(offer))}
                  <div className="border-t border-slate-700/50 my-3" />
                </div>
              )}

              {/* Quests Section */}
              {questsToDisplay.length > 0 && (
                <div className="space-y-2">
                  {selectedTab === 'active' && workOffers.length > 0 && (
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Quests ({questsToDisplay.length})
                    </h3>
                  )}
                  {questsToDisplay.map(quest => renderQuest(quest))}
                </div>
              )}

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