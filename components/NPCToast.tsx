/**
 * NPCToast.tsx - Enhanced NPC toast notification component
 * Shows contextual messages from NPCs with portrait, input field, and LLM integration
 */
import React, { useState, useEffect, useRef } from 'react';
import { ProceduralPortrait } from './portraits';
import { MessageSquare, AlertTriangle, Info, Sparkles, X, Send, Check, XIcon, ThumbsUp, ThumbsDown, Sun, Moon, Sunset, Sunrise, Sword, Shield } from 'lucide-react';
import { generateEncounterDialogue, generateFarmerDecision } from '../services/llmService';
import { DialogueEntry, NpcEntity, HistoricalEra } from '../types';

// Farmer decision structure from LLM
interface FarmerDecisions {
  allowRest: boolean;
  restFee: number;
  allowWork: boolean;
  allowResidency: boolean;
  askToLeave: boolean;
  threatenViolence: boolean;
  callForHelp: boolean;
}

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
  // New props for structured farmer interactions
  isFarmContext?: boolean;
  gameTimeHours?: number;
  onRequestRest?: (fee: number) => void;
  onRequestWork?: () => void;
  onAcceptWork?: (tasks: string[], payment: { meals?: boolean; lodging?: boolean; coins?: number }) => void;
  onRequestResidency?: () => void;
  onLeave?: () => void;
  onRefuse?: () => void;
  onInitiateEncounter?: (target: any) => void;
  // Fade-out control
  shouldFadeOut?: boolean;
  activeTab?: string;
  // Farm state for generating specific tasks
  farmState?: any;
  validCrops?: string[];
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
  npcs = [],
  isFarmContext = false,
  gameTimeHours = 12,
  onRequestRest,
  onRequestWork,
  onAcceptWork,
  onRequestResidency,
  onLeave,
  onRefuse,
  onInitiateEncounter,
  shouldFadeOut = false,
  activeTab = 'overview',
  farmState,
  validCrops = []
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [playerInput, setPlayerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [chatHistory, setChatHistory] = useState<DialogueEntry[]>([]);
  const [showQuickButtons, setShowQuickButtons] = useState(false);
  const [farmerDecisions, setFarmerDecisions] = useState<FarmerDecisions | null>(null);
  const [farmerSentiment, setFarmerSentiment] = useState<number>(0);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationRounds, setNegotiationRounds] = useState(0);
  const [workOffer, setWorkOffer] = useState<{
    tasks: string[];
    payment: { meals: boolean; lodging: boolean; coins?: number };
  } | null>(null);
  const [workAccepted, setWorkAccepted] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fade out when on work tab after accepting work
  useEffect(() => {
    if (isFarmContext && workAccepted && activeTab === 'work') {
      // Start fade out after 3 seconds
      const fadeTimer = setTimeout(() => {
        setOpacity(0);
        // Close after fade completes
        setTimeout(() => {
          if (onClose) onClose();
        }, 3000);
      }, 100);
      return () => clearTimeout(fadeTimer);
    }
  }, [isFarmContext, workAccepted, activeTab, onClose]);

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

  // Auto-generate LLM response for farm context when no initial message
  useEffect(() => {
    if (isFarmContext && !initialMessage && !hasInteracted && enableLLMChat) {
      // Automatically generate initial farmer response based on context
      const generateInitialResponse = async () => {
        setIsLoading(true);
        try {
          // Determine what the player would naturally say when approaching
          const approachMessage = gameTimeHours >= 22 || gameTimeHours <= 5
            ? "Hello? Is anyone there?"
            : "Good day! I'm a traveler passing through.";

          // Generate farmer's immediate response
          await handleLLMResponse(approachMessage, true); // true = silent (don't show player message)
        } catch (error) {
          console.error('Failed to generate initial farmer response:', error);
          // Use fallback greeting if LLM fails
          setCurrentMessage(getInitialGreeting());
        }
        setIsLoading(false);
      };

      generateInitialResponse();
    }
  }, [isFarmContext, initialMessage, hasInteracted, enableLLMChat, gameTimeHours]);

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
    // Skip default greeting for farm context - LLM will generate appropriate response
    if (!hasInteracted && !isFarmContext) {
      const greeting = getInitialGreeting();
      setCurrentMessage(greeting);
      // Add initial message to chat history
      setChatHistory([{ speaker: character.name || 'Farmer', text: greeting, timestamp: Date.now() }]);
    }
  }, [farmProsperity, era, hasInteracted, isFarmContext]);
  
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

  const getMoodEmoji = () => {
    switch (type) {
      case 'praise': return '😊';
      case 'admonition': return '🤨';
      case 'warning': return '😠';
      case 'greeting': return '👋';
      case 'quest': return '✨';
      case 'news': return '📰';
      default: return '💬';
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

  const handleLLMResponse = async (input: string, silent: boolean = false) => {
    if (!enableLLMChat || isLoading) return;

    setIsLoading(true);
    setHasInteracted(true);

    try {
      // If this is a farm context, use structured farmer decision
      if (isFarmContext) {
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
          occupation: 'farmer',
          personality: character.personality || ['hardworking', 'practical', 'cautious'],
          memory: {
            conversationSummaries: [],
            opinionOfPlayer: 50
          }
        } as NpcEntity;

        // Calculate context for farmer decision
        const isNight = gameTimeHours >= 20 || gameTimeHours <= 5;
        const isVeryLateNight = gameTimeHours >= 23 || gameTimeHours <= 4;
        const playerAppearance = playerCharacter?.equipment?.weapon ? 'armed' :
                                playerCharacter?.inventory?.some((i: any) => i.value > 50) ? 'wealthy' :
                                playerCharacter?.health < 30 ? 'injured' : 'peaceful';

        try {
          const farmerResponse = await generateFarmerDecision(
            farmerNpc,
            input,
            {
              timeOfDay: gameTimeHours,
              playerReputation: playerCharacter?.reputation || 50,
              playerAppearance,
              farmProsperity: farmProsperity || 'humble',
              era: (mapData?.dateInfo?.era || era || 'MEDIEVAL') as HistoricalEra,
              location: mapData?.localArea || mapData?.continent || 'countryside',
              playerHealth: playerCharacter?.health || 100,
              isNight,
              previousInteraction: currentMessage
            }
          );

          // Update state with farmer's decisions
          setFarmerDecisions(farmerResponse.decisions);
          setFarmerSentiment(farmerResponse.sentiment);
          setCurrentMessage(farmerResponse.dialogue);

          // Update type based on action
          if (farmerResponse.action === 'hostile') {
            type = 'warning';
          } else if (farmerResponse.action === 'suspicious') {
            type = 'admonition';
          }

          // Add to chat history (only include player message if not silent)
          const newHistory: DialogueEntry[] = silent
            ? [...chatHistory, { speaker: character.name || 'Farmer', text: farmerResponse.dialogue, timestamp: Date.now() }]
            : [
                ...chatHistory,
                { speaker: 'player', text: input, timestamp: Date.now() },
                { speaker: character.name || 'Farmer', text: farmerResponse.dialogue, timestamp: Date.now() }
              ];
          setChatHistory(newHistory);

          // Handle immediate actions if needed
          if (farmerResponse.decisions.threatenViolence && input.toLowerCase().includes('refuse')) {
            // Farmer threatened and player refused - initiate combat
            setTimeout(() => {
              if (mountedRef.current && onInitiateEncounter && isVisible) {
                const combatFarmer = {
                  ...farmerNpc,
                  isHostile: true,
                  initialDialogue: ["You leave me no choice! Defend the farm!", "Help! Bandits!"]
                };
                // Don't close NPCToast if in farm context - the handler will close entire panel
                if (!isFarmContext) {
                  handleClose(); // Close before initiating combat
                }
                onInitiateEncounter(combatFarmer);
              }
            }, 2000); // Give player time to read the threat
          }
        } catch (error) {
          console.error('LLM farmer decision failed, using fallback:', error);

          // Fallback logic when LLM service is unavailable
          const playerReputation = playerCharacter?.reputation || 50;
          const isThreatening = isVeryLateNight && playerAppearance === 'armed';
          const isModeratelyDangerous = isNight || playerReputation < 30;

          let farmerResponse;
          if (isThreatening) {
            farmerResponse = {
              dialogue: "Get off my land NOW or I'll run you through! HELP! BANDITS!",
              action: 'hostile',
              sentiment: -90,
              decisions: {
                allowRest: false,
                restFee: 0,
                allowWork: false,
                allowResidency: false,
                askToLeave: true,
                threatenViolence: true,
                callForHelp: true
              }
            };
          } else if (isModeratelyDangerous) {
            farmerResponse = {
              dialogue: "You need to leave. Now. This is private property and I don't know you.",
              action: 'suspicious',
              sentiment: -50,
              decisions: {
                allowRest: false,
                restFee: 0,
                allowWork: false,
                allowResidency: false,
                askToLeave: true,
                threatenViolence: false,
                callForHelp: false
              }
            };
          } else {
            farmerResponse = {
              dialogue: "What brings you to my farm, traveler? We don't get many visitors.",
              action: 'conditional',
              sentiment: 0,
              decisions: {
                allowRest: true,
                restFee: 3,
                allowWork: true,
                allowResidency: false,
                askToLeave: false,
                threatenViolence: false,
                callForHelp: false
              }
            };
          }

          // Update state with fallback decisions
          setFarmerDecisions(farmerResponse.decisions);
          setFarmerSentiment(farmerResponse.sentiment);
          setCurrentMessage(farmerResponse.dialogue);

          // Add to chat history (only include player message if not silent)
          const newHistory: DialogueEntry[] = silent
            ? [...chatHistory, { speaker: character.name || 'Farmer', text: farmerResponse.dialogue, timestamp: Date.now() }]
            : [
                ...chatHistory,
                { speaker: 'player', text: input, timestamp: Date.now() },
                { speaker: character.name || 'Farmer', text: farmerResponse.dialogue, timestamp: Date.now() }
              ];
          setChatHistory(newHistory);

          // Handle combat for threatening scenarios
          if (farmerResponse.decisions.threatenViolence && input.toLowerCase().includes('refuse')) {
            setTimeout(() => {
              if (mountedRef.current && onInitiateEncounter && isVisible) {
                const combatFarmer = {
                  ...farmerNpc,
                  isHostile: true,
                  initialDialogue: ["You leave me no choice! Defend the farm!", "Help! Bandits!"]
                };
                // Don't close NPCToast if in farm context - the handler will close entire panel
                if (!isFarmContext) {
                  handleClose(); // Close before initiating combat
                }
                onInitiateEncounter(combatFarmer);
              }
            }, 2000);
          }
        }

      } else {
        // Original encounter dialogue for non-farm contexts
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
          false
        );

        const newHistory: DialogueEntry[] = [
          ...chatHistory,
          { speaker: 'player', text: input, timestamp: Date.now() },
          { speaker: character.name || 'Farmer', text: response.text, timestamp: Date.now() }
        ];
        setChatHistory(newHistory);
        setCurrentMessage(response.text);
      }
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
    <div
      className={`fixed z-50 ${getPositionStyles()} transition-all duration-3000 ease-out`}
      style={{ opacity, transitionDuration: '3000ms' }}
    >
      <div className={`
        flex items-start gap-6 p-6 rounded-xl border-2 backdrop-blur-md shadow-2xl
        min-w-[500px] max-w-[700px] ${getTypeStyles()}
      `}>
        {/* Portrait - Enhanced to 80px with sentiment-based animations and weapon icons */}
        <div className="flex-shrink-0 relative">
          {/* Sentiment-based glow animation */}
          <div className={`w-20 h-20 rounded-full overflow-hidden border-3 bg-slate-700 shadow-xl transition-all duration-500 ${
            farmerSentiment < -50
              ? 'border-red-500 ring-4 ring-red-500/50 animate-pulse'
              : farmerSentiment > 50
              ? 'border-green-500 ring-2 ring-green-500/30'
              : 'border-slate-500 ring-2 ring-slate-600/50'
          }`}>
            <ProceduralPortrait
              character={character}
              size={80}
              trackChanges={false}
            />
          </div>

          {/* Weapon/threat indicator */}
          {farmerDecisions?.threatenViolence && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg animate-bounce">
              <Sword className="w-4 h-4 text-white" />
            </div>
          )}
          {farmerDecisions?.askToLeave && !farmerDecisions?.threatenViolence && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with contextual indicators */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getTypeIcon()}
                <span className="text-xl">{getMoodEmoji()}</span>
              </div>
              <span className="font-bold text-white text-base">
                {character.name || 'Farmer'}
              </span>
              <span className="text-sm text-gray-300">
                {character.role || character.profession || 'Local Farmer'}
              </span>
            </div>

            {/* Contextual visual cues */}
            {isFarmContext && (
              <div className="flex items-center gap-2">
                {/* Time of day indicator */}
                {gameTimeHours !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-md border border-slate-600/50">
                    {gameTimeHours >= 5 && gameTimeHours < 12 ? (
                      <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                    ) : gameTimeHours >= 12 && gameTimeHours < 17 ? (
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                    ) : gameTimeHours >= 17 && gameTimeHours < 20 ? (
                      <Sunset className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-blue-300" />
                    )}
                    <span className="text-xs text-slate-300">{gameTimeHours}:00</span>
                  </div>
                )}

                {/* Threat level indicator */}
                {farmerDecisions && (
                  <div className={`px-2 py-1 rounded-md border text-xs font-semibold ${
                    farmerDecisions.threatenViolence
                      ? 'bg-red-900/50 border-red-500/50 text-red-200'
                      : farmerDecisions.askToLeave
                      ? 'bg-amber-900/50 border-amber-500/50 text-amber-200'
                      : farmerDecisions.allowRest || farmerDecisions.allowWork
                      ? 'bg-green-900/50 border-green-500/50 text-green-200'
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300'
                  }`}>
                    {farmerDecisions.threatenViolence ? 'HOSTILE' :
                     farmerDecisions.askToLeave ? 'SUSPICIOUS' :
                     farmerDecisions.allowRest || farmerDecisions.allowWork ? 'WELCOMING' : 'NEUTRAL'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sentiment bar */}
          {isFarmContext && farmerSentiment !== 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Sentiment:</span>
                <span className={farmerSentiment < 0 ? 'text-red-400' : 'text-green-400'}>
                  {farmerSentiment > 0 ? '+' : ''}{farmerSentiment}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    farmerSentiment < 0 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-green-400'
                  }`}
                  style={{
                    width: `${Math.abs(farmerSentiment)}%`,
                    marginLeft: farmerSentiment < 0 ? `${100 - Math.abs(farmerSentiment)}%` : '0'
                  }}
                />
              </div>
            </div>
          )}

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
              {/* Structured Action Buttons for Farm Context */}
              {isFarmContext && farmerDecisions && (
                <div className="flex flex-wrap gap-2">
                  {/* If farmer is asking player to leave */}
                  {farmerDecisions.askToLeave && (
                    <>
                      <button
                        onClick={() => {
                          if (onLeave) onLeave();
                          handleClose();
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700
                                 rounded-lg border-2 border-blue-500 hover:from-blue-500 hover:to-blue-600
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
                      >
                        <Check className="w-4 h-4" />
                        Leave Peacefully
                      </button>
                      <button
                        onClick={() => {
                          // If farmer is already threatening violence, go straight to combat
                          if (farmerDecisions.threatenViolence && onInitiateEncounter) {
                            setCurrentMessage("You leave me no choice! Defend the farm!");
                            setTimeout(() => {
                              if (mountedRef.current && isVisible && onInitiateEncounter) {
                                const combatFarmer = {
                                  ...character,
                                  isHostile: true,
                                  initialDialogue: ["You leave me no choice! Defend the farm!", "Help! Bandits!"]
                                };
                                // Don't close NPCToast if in farm context - the handler will close entire panel
                                if (!isFarmContext) {
                                  handleClose(); // Close before initiating combat
                                }
                                onInitiateEncounter(combatFarmer);
                              }
                            }, 1500);
                          } else {
                            // Otherwise, send refusal message for farmer to respond
                            handleLLMResponse("I'm not leaving.");
                          }
                          if (onRefuse) onRefuse();
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700
                                 rounded-lg border-2 border-red-500 hover:from-red-500 hover:to-red-600
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105 animate-pulse"
                      >
                        <Sword className="w-4 h-4" />
                        Refuse to Leave
                      </button>
                    </>
                  )}

                  {/* Rest options */}
                  {!farmerDecisions.askToLeave && farmerDecisions.allowRest && onRequestRest && (
                    <button
                      onClick={() => {
                        const message = farmerDecisions.restFee > 0
                          ? `I'd like to rest here. I can pay ${farmerDecisions.restFee} coins.`
                          : `May I rest here for the night?`;
                        handleLLMResponse(message);
                        onRequestRest(farmerDecisions.restFee);
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700
                               rounded-lg border-2 border-emerald-500 hover:from-emerald-500 hover:to-emerald-600
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                               shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
                    >
                      <Moon className="w-4 h-4" />
                      Request Rest
                      {farmerDecisions.restFee > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-emerald-800/50 rounded-full text-xs font-bold border border-emerald-600">
                          {farmerDecisions.restFee} coins
                        </span>
                      )}
                    </button>
                  )}

                  {/* Work for lodging option - hide if work already accepted */}
                  {!workAccepted && !farmerDecisions.askToLeave && farmerDecisions.allowWork && onRequestWork && !isNegotiating && (
                    <button
                      onClick={() => {
                        setIsNegotiating(true);
                        setNegotiationRounds(1);
                        // Generate work offer based on actual farm state with urgency levels
                        const generateSpecificTasks = () => {
                          const tasks: Array<{text: string; urgent: boolean}> = [];

                          // Check for animals that need feeding (URGENT if >48 hours)
                          if (farmState?.livestock && farmState.livestock.length > 0) {
                            farmState.livestock.forEach((animal: any) => {
                              const lastFed = animal.lastFed || 0;
                              const hoursSinceFed = (gameTimeHours || 0) - lastFed;
                              if (hoursSinceFed > 48) {
                                tasks.push({
                                  text: `[URGENT] Feed the ${animal.type}`,
                                  urgent: true
                                });
                              } else if (hoursSinceFed > 24 || !animal.lastFed) {
                                tasks.push({
                                  text: `Feed the ${animal.type}`,
                                  urgent: false
                                });
                              }
                            });
                          }

                          // Check for fields that need attention
                          if (farmState?.fields && farmState.fields.length > 0) {
                            // Harvest ready crops (URGENT if overdue)
                            const harvestReady = farmState.fields.filter((f: any) =>
                              f.crop && f.daysToHarvest !== undefined && f.daysToHarvest <= 2
                            );
                            harvestReady.forEach((field: any) => {
                              const fieldIdx = farmState.fields.indexOf(field);
                              const isOverdue = field.daysToHarvest <= 0;
                              tasks.push({
                                text: isOverdue
                                  ? `[URGENT] Harvest Field ${fieldIdx + 1} (${field.crop} - overdue!)`
                                  : `Harvest Field ${fieldIdx + 1} (${field.crop})`,
                                urgent: isOverdue
                              });
                            });

                            // Dry fields with crops (URGENT if health < 50%)
                            const dryFields = farmState.fields.filter((f: any) =>
                              f.crop && f.moisture === 'dry'
                            );
                            dryFields.forEach((field: any) => {
                              const fieldIdx = farmState.fields.indexOf(field);
                              const isCritical = field.health < 50;
                              if (tasks.length < 5) {
                                tasks.push({
                                  text: isCritical
                                    ? `[URGENT] Water Field ${fieldIdx + 1} (${field.crop} - wilting!)`
                                    : `Water Field ${fieldIdx + 1} (${field.crop})`,
                                  urgent: isCritical
                                });
                              }
                            });

                            // Empty fields (not urgent) - specify crop type
                            const emptyFields = farmState.fields.filter((f: any) => !f.crop);
                            if (emptyFields.length > 0 && tasks.length < 3) {
                              const fieldIdx = farmState.fields.indexOf(emptyFields[0]);
                              const cropToPlant = validCrops.length > 0 ? validCrops[0] : 'crops';
                              tasks.push({
                                text: `Plant ${cropToPlant} in Field ${fieldIdx + 1}`,
                                urgent: false
                              });
                            }
                          }

                          // Fallback to generic tasks if no specific ones found
                          if (tasks.length === 0) {
                            const genericTasks = farmProsperity === 'humble'
                              ? ['Clear weeds from the fields', 'Mend the fence', 'Fetch water']
                              : ['Organize the barn', 'Repair tools', 'Check the irrigation'];
                            return genericTasks.map(t => ({text: t, urgent: false}));
                          }

                          // Sort: urgent first, then by original order
                          return tasks.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 3);
                        };

                        const taskObjects = generateSpecificTasks();
                        const tasks = taskObjects.map(t => t.text);
                        setWorkOffer({
                          tasks,
                          payment: { meals: true, lodging: true, coins: farmProsperity === 'prosperous' ? 5 : 0 }
                        });
                        setCurrentMessage(
                          `Alright, here's what I need: ${tasks.join(', ')}. ` +
                          `In exchange, you'll get meals and a place to sleep` +
                          (farmProsperity === 'prosperous' ? ' plus 5 coins.' : '.') +
                          ` Fair deal?`
                        );
                        onRequestWork();
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700
                               rounded-lg border-2 border-amber-500 hover:from-amber-500 hover:to-amber-600
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                               shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4" />
                      Offer to Work
                      <span className="ml-1 px-2 py-0.5 bg-amber-800/50 rounded-full text-xs font-bold border border-amber-600">
                        Meals + Bed{farmProsperity === 'prosperous' ? ' + 5 coins' : ''}
                      </span>
                    </button>
                  )}

                  {/* Negotiation buttons - show when negotiating work contract */}
                  {isNegotiating && workOffer && (
                    <>
                      <button
                        onClick={() => {
                          setIsNegotiating(false);
                          setWorkAccepted(true);
                          setCurrentMessage("Good! Let's get started then. I'll show you what needs doing.");
                          // Apply work contract
                          if (onAcceptWork && workOffer) {
                            onAcceptWork(workOffer.tasks, workOffer.payment);
                          }
                          // Clear state to prevent re-showing negotiation buttons
                          setFarmerDecisions(null);
                          setWorkOffer(null);
                        }}
                        disabled={isLoading}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700
                                 rounded-lg border border-green-500 hover:from-green-500 hover:to-green-600
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        Accept Deal ✓
                      </button>
                      {negotiationRounds < 3 && (
                        <button
                          onClick={() => {
                            setNegotiationRounds(negotiationRounds + 1);
                            if (negotiationRounds === 2) {
                              // Final offer
                              const improvedPayment = farmProsperity === 'prosperous'
                                ? { meals: true, lodging: true, coins: 10 }
                                : { meals: true, lodging: true, coins: 2 };
                              setWorkOffer({ ...workOffer, payment: improvedPayment });
                              setCurrentMessage(
                                "Alright, final offer: same work but I'll throw in " +
                                (farmProsperity === 'prosperous' ? '10 coins' : '2 coins') +
                                ". That's the best I can do."
                              );
                            } else {
                              // Counter-offer
                              const improvedPayment = farmProsperity === 'prosperous'
                                ? { meals: true, lodging: true, coins: 7 }
                                : { meals: true, lodging: true, coins: 1 };
                              setWorkOffer({ ...workOffer, payment: improvedPayment });
                              setCurrentMessage(
                                "Hmm, how about this: same work but I'll add " +
                                (farmProsperity === 'prosperous' ? '7 coins' : '1 coin') +
                                " to sweeten the deal?"
                              );
                            }
                          }}
                          disabled={isLoading}
                          className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-yellow-600 to-yellow-700
                                   rounded-lg border border-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                   shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Ask for More 💰
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsNegotiating(false);
                          setWorkOffer(null);
                          setCurrentMessage("No deal then. Maybe another time.");
                          setFarmerDecisions(null);
                        }}
                        disabled={isLoading}
                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700
                                 rounded-lg border border-red-500 hover:from-red-500 hover:to-red-600
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        Decline ✗
                      </button>
                    </>
                  )}

                  {/* Request to live on farm (only if already established trust) */}
                  {!farmerDecisions.askToLeave && farmerDecisions.allowResidency && onRequestResidency && (
                    <button
                      onClick={() => {
                        handleLLMResponse("I've been thinking... could I perhaps live and work on the farm?");
                        onRequestResidency();
                      }}
                      disabled={isLoading}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700
                               rounded-lg border border-purple-500 hover:from-purple-500 hover:to-purple-600
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                               shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Request Residency
                    </button>
                  )}

                  {/* Warning indicator if farmer is threatening */}
                  {farmerDecisions.threatenViolence && (
                    <div className="w-full text-center text-red-400 text-sm font-semibold animate-pulse">
                      ⚠️ The farmer is ready to attack! Choose carefully...
                    </div>
                  )}
                </div>
              )}

              {/* Original Quick Response Buttons for non-farm contexts */}
              {!isFarmContext && showQuickButtons && (
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

export { NPCToast as default };

// Add fade-out prop interface
export interface NPCToastFadeProps {
  shouldFadeOut?: boolean;
  onFadeComplete?: () => void;
}