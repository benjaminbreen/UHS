/**
 * Quest Reward Notification Component
 * Displays animated notifications when quest rewards are received
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, Coins, Heart, Brain, Map, Scroll, Sword, 
  Shield, Gem, Package, Star, Trophy, CheckCircle
} from 'lucide-react';

interface RewardNotification {
  id: string;
  questTitle: string;
  items: Array<{
    name: string;
    description: string;
    value: number;
    rarity: string;
    category: string;
    quantity?: number;
  }>;
  otherRewards: Array<{
    type: string;
    value: any;
    description: string;
  }>;
  totalValue: number;
  timestamp: number;
}

const QuestRewardNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);

  useEffect(() => {
    const handleQuestRewards = (event: CustomEvent) => {
      const notification: RewardNotification = {
        id: `reward_${Date.now()}`,
        ...event.detail,
        timestamp: Date.now()
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 10 seconds if not expanded
      setTimeout(() => {
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id || n.id === expandedNotification)
        );
      }, 10000);
    };

    window.addEventListener('questRewardsReceived', handleQuestRewards as EventListener);
    
    return () => {
      window.removeEventListener('questRewardsReceived', handleQuestRewards as EventListener);
    };
  }, [expandedNotification]);

  const getItemIcon = (category: string) => {
    switch (category) {
      case 'weapon': return <Sword className="w-4 h-4" />;
      case 'armor': return <Shield className="w-4 h-4" />;
      case 'valuable': return <Gem className="w-4 h-4" />;
      case 'artifact': return <Star className="w-4 h-4" />;
      case 'document': return <Scroll className="w-4 h-4" />;
      case 'currency': return <Coins className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'reputation': return <Award className="w-4 h-4" />;
      case 'knowledge': return <Brain className="w-4 h-4" />;
      case 'health': return <Heart className="w-4 h-4" />;
      case 'map_reveal': return <Map className="w-4 h-4" />;
      case 'experience': return <Trophy className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-orange-400 bg-orange-900/20 border-orange-600';
      case 'epic': return 'text-purple-400 bg-purple-900/20 border-purple-600';
      case 'rare': return 'text-blue-400 bg-blue-900/20 border-blue-600';
      case 'uncommon': return 'text-green-400 bg-green-900/20 border-green-600';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-600';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (expandedNotification === id) {
      setExpandedNotification(null);
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map(notification => {
        const isExpanded = expandedNotification === notification.id;
        
        return (
          <div
            key={notification.id}
            className={`
              bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl 
              border border-slate-700 overflow-hidden pointer-events-auto
              transition-all duration-300 ease-out
              ${isExpanded ? 'w-96' : 'w-80'}
            `}
          >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Quest Complete!</p>
                      <h3 className="text-sm font-semibold text-white">
                        {notification.questTitle}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {/* Summary */}
                {!isExpanded && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Rewards received:</span>
                      <span className="text-yellow-400 font-medium">
                        {notification.items.length} items
                      </span>
                    </div>
                    {notification.totalValue > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total value:</span>
                        <span className="text-yellow-400 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {notification.totalValue}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedNotification(notification.id)}
                      className="w-full mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 
                        text-xs text-gray-300 rounded transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {/* Items */}
                    {notification.items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Items Received</h4>
                        <div className="space-y-1">
                          {notification.items.map((item, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded border ${getRarityColor(item.rarity)}`}
                            >
                              <div className="flex items-start gap-2">
                                {getItemIcon(item.category)}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                      {item.name}
                                      {item.quantity && item.quantity > 1 && (
                                        <span className="ml-1 text-xs text-gray-400">
                                          x{item.quantity}
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Coins className="w-3 h-3" />
                                      <span>{item.value}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Rewards */}
                    {notification.otherRewards.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Other Rewards</h4>
                        <div className="space-y-1">
                          {notification.otherRewards.map((reward, index) => (
                            <div
                              key={index}
                              className="p-2 bg-slate-800/50 rounded flex items-center gap-2"
                            >
                              {getRewardIcon(reward.type)}
                              <p className="text-sm text-gray-300">
                                {reward.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedNotification(null)}
                      className="w-full mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 
                        text-xs text-gray-300 rounded transition-colors"
                    >
                      Collapse
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default QuestRewardNotification;