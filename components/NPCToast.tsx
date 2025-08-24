/**
 * NPCToast.tsx - Enhanced NPC toast notification component
 * Shows contextual messages from NPCs with portrait, input field, and LLM integration
 */
import React, { useState, useEffect, useRef } from 'react';
import { ProceduralPortrait } from './portraits';
import { MessageSquare, AlertTriangle, Info, Sparkles, X, Send, Check, XIcon } from 'lucide-react';
import { generateEncounterDialogue } from '../services/llmService';
import { DialogueEntry, NpcEntity } from '../types';

interface NPCToastProps {
  character: any; // NPC or FarmFamilyMember
  message: string;
  type?: 'advice' | 'warning' | 'quest' | 'news' | 'greeting' | 'praise' | 'admonition';
  persistent?: boolean;
  position?: 'bottom' | 'top' | 'side';
  onAction?: () => void;
  actionLabel?: string;
  onClose?: () => void;
  autoHideDelay?: number; // milliseconds
  farmProsperity?: 'humble' | 'prosperous';
  era?: string;
  enableLLMChat?: boolean;
  playerCharacter?: any;
  mapData?: any;
  npcs?: NpcEntity[];
}

const NPCToast: React.FC<NPCToastProps> = ({ 
  character, 
  message: initialMessage, 
  type = 'advice',
  persistent = false,
  position = 'bottom',
  onAction,
  actionLabel,
  onClose,
  autoHideDelay = 8000,
  farmProsperity = 'humble',
  era = 'medieval',
  enableLLMChat = false,
  playerCharacter,
  mapData,
  npcs = []
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [playerInput, setPlayerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [chatHistory, setChatHistory] = useState<DialogueEntry[]>([]);
  const [showQuickButtons, setShowQuickButtons] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-hide after delay unless persistent
    if (!persistent && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [persistent, autoHideDelay]);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  // Generate initial greeting with questions based on farm prosperity
  const getInitialGreeting = () => {
    if (hasInteracted) return currentMessage;
    
    const greetings = {
      medieval: {
        humble: [
          "Good morrow, traveler. Our harvest has been modest this season. Would you be willing to help with the fields tomorrow?",
          "Greetings, friend. Times are hard, but we make do. You look weary - would you care to rest here for the night?",
          "Welcome to our humble farm. The rains have been scarce. Do you bring news from the outside world?"
        ],
        prosperous: [
          "Hail and well met! Our lands have been blessed with abundance. Would you care to join us for supper?",
          "Welcome, good traveler! Our fields flourish. Might you be interested in trading for some of our fine produce?",
          "Greetings! Our granaries are full. Are you perhaps looking for work?"
        ]
      },
      renaissance: {
        humble: [
          "Good day to you. We work hard for what little we have. Could you spare a hand with the harvest?",
          "A fair morning to you, stranger. Our plot is small but honest. Do you seek shelter for the night?"
        ],
        prosperous: [
          "A fine day to you! Our estates grow ever more fruitful. Would you be interested in purchasing some of our surplus?",
          "Well met! Our lands prosper under careful stewardship. Are you traveling far?"
        ]
      }
    };
    
    const eraGreetings = greetings[era as keyof typeof greetings] || greetings.medieval;
    const prosperityGreetings = eraGreetings[farmProsperity] || eraGreetings.humble;
    const greeting = prosperityGreetings[Math.floor(Math.random() * prosperityGreetings.length)];
    
    // Check if the greeting contains a question
    setShowQuickButtons(greeting.includes('?'));
    
    return greeting;
  };

  useEffect(() => {
    if (!hasInteracted) {
      const greeting = getInitialGreeting();
      setCurrentMessage(greeting);
      // Add initial message to chat history
      setChatHistory([{ speaker: character.name || 'Farmer', text: greeting, timestamp: Date.now() }]);
    }
  }, [farmProsperity, era, hasInteracted]);
  
  // Check if current message has a question
  useEffect(() => {
    setShowQuickButtons(currentMessage.includes('?'));
  }, [currentMessage]);

  const getTypeIcon = () => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'quest': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'news': return <Info className="w-4 h-4 text-blue-400" />;
      case 'greeting': return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'praise': return <ThumbsUp className="w-4 h-4 text-green-400" />;
      case 'admonition': return <ThumbsDown className="w-4 h-4 text-red-400" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'warning': 
        return 'bg-gradient-to-br from-amber-900/90 via-yellow-900/90 to-orange-900/90 border-yellow-500/40';
      case 'quest': 
        return 'bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-violet-900/90 border-purple-500/40';
      case 'news': 
        return 'bg-gradient-to-br from-blue-900/90 via-cyan-900/90 to-teal-900/90 border-blue-500/40';
      case 'greeting': 
        return 'bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-gray-900/90 border-slate-500/40';
      case 'praise':
        return 'bg-gradient-to-br from-emerald-900/90 via-green-900/90 to-teal-900/90 border-green-500/40';
      case 'admonition':
        return 'bg-gradient-to-br from-rose-900/90 via-red-900/90 to-pink-900/90 border-red-500/40';
      default: 
        return 'bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-gray-900/90 border-slate-500/40';
    }
  };

  const handleLLMResponse = async (input: string) => {
    if (!enableLLMChat || isLoading) return;
    
    setIsLoading(true);
    setHasInteracted(true);
    
    try {
      // Create a proper NPC entity for the farmer
      const farmerNpc: NpcEntity = {
        id: `farmer-${character.id || Date.now()}`,
        name: character.name || 'Farmer',
        type: 'npc' as const,
        x: 0,
        y: 0,
        health: character.health || 80,
        maxHealth: character.maxHealth || 100,
        age: character.age || 35,
        gender: character.gender || 'male',
        culturalZone: character.culturalZone || 'WESTERN_EUROPEAN',
        occupation: character.occupation || 'farmer',
        personality: character.personality || ['hardworking', 'practical', 'cautious'],
        memory: {
          conversationSummaries: [],
          opinionOfPlayer: 50
        }
      } as NpcEntity;
      
      // Add farmer instruction to ask questions
      const contextualInput = farmProsperity === 'humble' 
        ? `${input} (The farmer is struggling and may ask for help or offer lodging in exchange for work. Make sure to ask a follow-up question ending with '?')`
        : `${input} (The farmer is prosperous and may offer trade or hospitality. Make sure to ask a follow-up question ending with '?')`;
      
      const response = await generateEncounterDialogue(
        farmerNpc,
        chatHistory,
        contextualInput,
        playerCharacter,
        npcs,
        mapData,
        false // useRealLanguage
      );
      
      // Update chat history
      const newHistory: DialogueEntry[] = [
        ...chatHistory,
        { speaker: 'player', text: input, timestamp: Date.now() },
        { speaker: character.name || 'Farmer', text: response.text, timestamp: Date.now() }
      ];
      setChatHistory(newHistory);
      setCurrentMessage(response.text);
    } catch (error) {
      console.error('LLM response failed:', error);
      setCurrentMessage("*looks puzzled* I'm not sure how to respond to that.");
    } finally {
      setIsLoading(false);
      setPlayerInput('');
    }
  };

  const handleQuickResponse = (response: 'yes' | 'no') => {
    const input = response === 'yes' 
      ? 'Yes, I would be happy to help.' 
      : 'No, I must be on my way.';
    handleLLMResponse(input);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerInput.trim()) {
      handleLLMResponse(playerInput);
    }
  };

  const getPositionStyles = () => {
    const baseTransform = isAnimating ? 'translate-y-full' : 'translate-y-0';
    switch (position) {
      case 'top':
        return `top-4 left-1/2 -translate-x-1/2 ${isAnimating ? '-translate-y-full' : 'translate-y-0'}`;
      case 'side':
        return `top-1/2 right-4 -translate-y-1/2 ${isAnimating ? 'translate-x-full' : 'translate-x-0'}`;
      default: // bottom
        return `bottom-4 left-1/2 -translate-x-1/2 ${baseTransform}`;
    }
  };

  return (
    <div className={`fixed z-50 ${getPositionStyles()} transition-transform duration-300 ease-out`}>
      <div className={`
        flex items-start gap-6 p-6 rounded-xl border-2 backdrop-blur-md shadow-2xl
        min-w-[500px] max-w-[700px] ${getTypeStyles()}
      `}>
        {/* Portrait - Enhanced to 100x100px */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-slate-500 bg-slate-700 shadow-xl ring-2 ring-slate-600/50">
            <ProceduralPortrait
              character={character}
              size={96}
              trackChanges={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {getTypeIcon()}
            <span className="font-bold text-white text-base">
              {character.name || 'Farmer'}
            </span>
            <span className="text-sm text-gray-300">
              {character.role || character.profession || 'Local Farmer'}
            </span>
          </div>

          {/* Message - Larger text */}
          <div className="text-base text-gray-100 leading-relaxed mb-4 font-medium">
            {isLoading ? (
              <span className="italic text-gray-300 animate-pulse">*considering your words...*</span>
            ) : (
              <p>{currentMessage}</p>
            )}
          </div>

          {/* Interactive Elements */}
          {enableLLMChat && (
            <div className="space-y-3">
              {/* Quick Response Buttons - Only show if there's a question */}
              {showQuickButtons && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleQuickResponse('yes')}
                    disabled={isLoading}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 
                             rounded-lg border border-emerald-500 hover:from-emerald-500 hover:to-emerald-600 
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                             shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Check className="w-4 h-4 inline mr-2" />
                    Yes
                  </button>
                  <button
                    onClick={() => handleQuickResponse('no')}
                    disabled={isLoading}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-700 
                             rounded-lg border border-rose-500 hover:from-rose-500 hover:to-rose-600 
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                             shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <XIcon className="w-4 h-4 inline mr-2" />
                    No
                  </button>
                </div>
              )}
              
              {/* Text Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  placeholder="Type your response..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm bg-black/40 border border-gray-500 rounded-lg 
                           text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none
                           focus:ring-2 focus:ring-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={isLoading || !playerInput.trim()}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 
                           rounded-lg border border-blue-500 hover:from-blue-500 hover:to-blue-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                           shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Action button if provided */}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 
                       rounded border border-blue-500 hover:from-blue-500 hover:to-blue-600 
                       transition-colors duration-200"
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Close button */}
        {!persistent && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NPCToast;