import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, TrendingUp, Award, Target } from 'lucide-react';
import { questService } from '../services/questService';

interface QuestNotification {
  id: string;
  type: 'completed' | 'progress' | 'new' | 'failed';
  message: string;
  questTitle?: string;
  timestamp: number;
}

const QuestNotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<QuestNotification[]>([]);
  
  useEffect(() => {
    // Listen for quest progress notifications - only show for active quests
    const handleQuestProgress = (event: CustomEvent) => {
      const { type, message, questTitle, questId } = event.detail;
      
      const activeQuest = questService.getCurrentlyActiveQuest();
      if (activeQuest && activeQuest.id === questId) {
        const notification: QuestNotification = {
          id: `quest_notif_${Date.now()}_${Math.random()}`,
          type: type === 'completed' ? 'completed' : 'progress',
          message,
          questTitle,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      }
    };
    
    // Listen for quest completion
    const handleQuestComplete = (event: CustomEvent) => {
      const quest = event.detail.quest;
      if (quest) {
        const notification: QuestNotification = {
          id: `quest_complete_${Date.now()}_${Math.random()}`,
          type: 'completed',
          message: `🎉 Quest Complete: ${quest.title}`,
          questTitle: quest.title,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
        
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 6000);
      }
    };
    
    // Listen for new quest added - only show notification if it's the active quest
    const handleQuestAdded = (event: CustomEvent) => {
      const quest = event.detail.quest;
      if (quest && quest.isActiveQuest) {
        const notification: QuestNotification = {
          id: `quest_new_${Date.now()}_${Math.random()}`,
          type: 'new',
          message: `📜 New Quest: ${quest.title}`,
          questTitle: quest.title,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
        
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 4000);
      }
    };

    // Listen for active quest changes
    const handleActiveQuestChanged = (event: CustomEvent) => {
      const { quest } = event.detail;
      if (quest) {
        const notification: QuestNotification = {
          id: `quest_activated_${Date.now()}_${Math.random()}`,
          type: 'new',
          message: `📍 Now Tracking: ${quest.title}`,
          questTitle: quest.title,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
        
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 3000);
      }
    };
    
    window.addEventListener('questProgressNotification', handleQuestProgress as EventListener);
    window.addEventListener('questComplete', handleQuestComplete as EventListener);
    window.addEventListener('questAdded', handleQuestAdded as EventListener);
    window.addEventListener('activeQuestChanged', handleActiveQuestChanged as EventListener);
    
    return () => {
      window.removeEventListener('questProgressNotification', handleQuestProgress as EventListener);
      window.removeEventListener('questComplete', handleQuestComplete as EventListener);
      window.removeEventListener('questAdded', handleQuestAdded as EventListener);
      window.removeEventListener('activeQuestChanged', handleActiveQuestChanged as EventListener);
    };
  }, []);
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'progress':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'new':
        return <Target className="w-5 h-5 text-yellow-400" />;
      default:
        return <Award className="w-5 h-5 text-purple-400" />;
    }
  };
  
  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'bg-gradient-to-r from-green-900/95 to-green-800/95';
      case 'progress':
        return 'bg-gradient-to-r from-blue-900/95 to-blue-800/95';
      case 'new':
        return 'bg-gradient-to-r from-yellow-900/95 to-amber-800/95';
      default:
        return 'bg-gradient-to-r from-purple-900/95 to-purple-800/95';
    }
  };
  
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: index * 70, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              delay: index * 0.05 
            }}
            className={`
              ${getBackgroundColor(notification.type)}
              backdrop-blur-md rounded-lg shadow-2xl border border-white/10
              px-4 py-3 mb-2 min-w-[300px] max-w-[400px]
              pointer-events-auto cursor-pointer
            `}
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            <div className="flex items-center gap-3">
              {getIcon(notification.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {notification.message}
                </p>
                {notification.questTitle && notification.type === 'progress' && (
                  <p className="text-xs text-gray-300 mt-0.5">
                    Quest: {notification.questTitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Progress bar animation for completed quests */}
            {notification.type === 'completed' && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-b-lg"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default QuestNotificationToast;