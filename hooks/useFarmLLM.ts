/**
 * hooks/useFarmLLM.ts
 * Centralize all LLM/AI interactions for farm panel
 *
 * Phase 2 of Farm Panel refactoring - extracts LLM logic
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PlayerCharacter,
  MapData,
  CulturalZone,
  HistoricalEra,
  Season,
  DialogueEntry,
  TimeOfDay,
  NpcEntity,
} from '../types';
import { FarmState, FarmFamilyMember, updateFarmState } from '../services/farmService';
import {
  generateEncounterDialogue,
  generateHistoricalSummary,
  generateFarmDetails as llmGenerateFarmDetails,
  generateFarmWorkSimulation,
  generateFarmerDecision,
} from '../services/llmService';
import { FarmerToast, WorkHistoryEntry } from '../components/farm/types';

interface UseFarmLLMOptions {
  farmState: FarmState | null;
  setFarmState: (state: FarmState) => void;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  season: Season;
  timeOfDay: TimeOfDay;
  gameTimeHours: number;
  validCrops: string[];
  useLlm: boolean;
  onPlayerStateChange?: (changes: any) => void;
}

interface UseFarmLLMReturn {
  // Family chat
  selectedMember: FarmFamilyMember | null;
  setSelectedMember: (member: FarmFamilyMember | null) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  isChatting: boolean;
  chatHistory: DialogueEntry[];
  setChatHistory: (history: DialogueEntry[]) => void;
  useHistoricalLanguage: boolean;
  setUseHistoricalLanguage: (use: boolean) => void;
  handleFarmerChat: () => Promise<void>;

  // Advisor
  advisorSummary: string;
  advisorChat: string;
  setAdvisorChat: (chat: string) => void;
  advisorLog: string[];
  isAdvisorBusy: boolean;
  runAdvisorSummary: () => Promise<void>;
  runAdvisorChat: () => Promise<void>;

  // Farm flavor
  isRefreshingFlavor: boolean;
  refreshFarmFlavor: () => Promise<void>;

  // Farmer messages & toast
  farmerMessage: string;
  setFarmerMessage: (message: string) => void;
  farmerToast: FarmerToast | null;
  setFarmerToast: (toast: FarmerToast | null) => void;
  generateFarmerMessage: () => string;

  // Farm work adventure
  farmWorkHistory: WorkHistoryEntry[];
  setFarmWorkHistory: (history: WorkHistoryEntry[]) => void;
  farmWorkInput: string;
  setFarmWorkInput: (input: string) => void;
  isFarmWorkProcessing: boolean;
  currentFarmTime: number;
  setCurrentFarmTime: (time: number) => void;
  hoursWorkedToday: number;
  setHoursWorkedToday: (hours: number) => void;
  farmActionLog: Array<{ action: string; timeElapsed: number }>;
  setFarmActionLog: (log: Array<{ action: string; timeElapsed: number }>) => void;
  handleFarmWorkCommand: (command: string) => Promise<void>;
  initializeWorkSession: (task: string) => void;
}

export function useFarmLLM({
  farmState,
  setFarmState,
  playerCharacter,
  mapData,
  culturalZone,
  era,
  season,
  timeOfDay,
  gameTimeHours,
  validCrops,
  useLlm,
  onPlayerStateChange,
}: UseFarmLLMOptions): UseFarmLLMReturn {
  // Family chat
  const [selectedMember, setSelectedMember] = useState<FarmFamilyMember | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<DialogueEntry[]>([]);
  const [useHistoricalLanguage, setUseHistoricalLanguage] = useState<boolean>(false);

  // Advisor
  const [advisorSummary, setAdvisorSummary] = useState<string>('');
  const [advisorChat, setAdvisorChat] = useState<string>('');
  const [advisorLog, setAdvisorLog] = useState<string[]>([]);
  const [isAdvisorBusy, setIsAdvisorBusy] = useState(false);

  // Farm flavor
  const [isRefreshingFlavor, setIsRefreshingFlavor] = useState(false);

  // Farmer message/toast
  const [farmerMessage, setFarmerMessage] = useState<string>('');
  const [farmerToast, setFarmerToast] = useState<FarmerToast | null>(null);

  // Farm work adventure
  const [farmWorkHistory, setFarmWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [farmWorkInput, setFarmWorkInput] = useState('');
  const [isFarmWorkProcessing, setIsFarmWorkProcessing] = useState(false);
  const [currentFarmTime, setCurrentFarmTime] = useState(0);
  const [hoursWorkedToday, setHoursWorkedToday] = useState(0);
  const [farmActionLog, setFarmActionLog] = useState<Array<{ action: string; timeElapsed: number }>>([]);

  // Initialize farm work history with context-aware intro message
  useEffect(() => {
    if (farmWorkHistory.length === 0 && era && season) {
      const eraName =
        era === 'MEDIEVAL'
          ? 'medieval'
          : era === 'RENAISSANCE_EARLY_MODERN'
          ? 'early modern'
          : 'ancient';
      const zoneName = culturalZone.toLowerCase().replace(/_/g, ' ');
      setFarmWorkHistory([
        {
          type: 'narrator',
          text: `You stand at the edge of your fields in the ${season} season. The ${eraName} ${zoneName} landscape stretches before you. What will you do? (Try commands like: "plant wheat in field 1", "water the crops", "check field 2", "harvest mature crops")`,
        },
      ]);
    }
  }, [era, season, culturalZone, farmWorkHistory.length]);

  // Generate initial farmer greeting using LLM-driven context awareness
  useEffect(() => {
    if (!useLlm || !farmState || !playerCharacter || farmerToast) return; // Only run once when all deps are ready

    const generateInitialGreeting = async () => {
      const headFarmer = farmState.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
                        farmState.family.members.find(m => m.role === 'Farmer') ||
                        farmState.family.members[0];

      if (!headFarmer) return;

      // Convert head farmer to NPC entity for LLM call
      const farmerNpc: NpcEntity = {
        id: `farmer-${headFarmer.id || Date.now()}`,
        name: headFarmer.name || 'Farmer',
        type: 'npc' as const,
        x: 0,
        y: 0,
        health: headFarmer.health || 80,
        maxHealth: headFarmer.maxHealth || 100,
        age: headFarmer.age || 35,
        gender: headFarmer.gender || 'male',
        culturalZone: culturalZone,
        occupation: 'farmer',
        personality: headFarmer.personality || ['hardworking', 'practical', 'cautious'],
        memory: {
          conversationSummaries: [],
          opinionOfPlayer: 50
        }
      } as NpcEntity;

      // Calculate time-based context - USE GAME TIME, NOT REAL TIME!
      const gameHour = Math.floor(gameTimeHours % 24);
      const isNight = gameHour >= 20 || gameHour <= 5;
      const playerAppearance = playerCharacter.equipment?.weapon ? 'armed' :
                              playerCharacter.inventory?.some((i: any) => i.value > 50) ? 'wealthy' :
                              playerCharacter.health < 30 ? 'injured' : 'peaceful';

      console.log('[useFarmLLM] Generating initial farmer greeting with game time:', gameHour, 'isNight:', isNight);

      try {
        const farmerResponse = await generateFarmerDecision(
          farmerNpc,
          '', // Empty input - this is initial greeting
          {
            timeOfDay: gameHour,
            playerReputation: playerCharacter.reputation || 50,
            playerAppearance,
            farmProsperity: farmState.economicStatus,
            era: era,
            location: mapData?.localArea || mapData?.continent || 'countryside',
            playerHealth: playerCharacter.health || 100,
            isNight,
          }
        );

        // Set initial farmer toast based on LLM response
        const toastType = farmerResponse.action === 'hostile' ? 'warning' :
                         farmerResponse.action === 'suspicious' ? 'admonition' :
                         farmerResponse.action === 'conditional' ? 'quest' : 'greeting';

        setFarmerToast({
          message: farmerResponse.dialogue,
          type: toastType
        });
      } catch (error) {
        console.error('Failed to generate initial farmer greeting:', error);
        // Fallback to simple greeting
        setFarmerToast({
          message: `Welcome to our farm. I'm ${headFarmer.name}.`,
          type: 'greeting'
        });
      }
    };

    generateInitialGreeting();
  }, [useLlm, farmState, playerCharacter, culturalZone, era, mapData, farmerToast]); // Run once when all dependencies are available

  // Generate contextual farmer message
  const generateFarmerMessage = useCallback(() => {
    if (!farmState) return 'Welcome to the farm.';

    const wealth = farmState.economicStatus;
    const fieldCount = farmState.fields.length;
    const activeCrops = farmState.fields.filter(f => f.crop).length;

    if (wealth === 'wealthy') {
      return `Our ${fieldCount} fields are thriving! ${activeCrops} currently under cultivation.`;
    } else if (wealth === 'prosperous') {
      return `We work hard on our ${fieldCount} fields. ${activeCrops} are growing well.`;
    } else {
      return `Times are tough, but we tend our ${fieldCount} fields with care. ${activeCrops} planted.`;
    }
  }, [farmState]);

  // Handle farmer chat
  const handleFarmerChat = useCallback(async () => {
    if (!useLlm || !chatInput.trim() || !selectedMember) return;

    setIsChatting(true);

    try {
      const context = {
        npcName: selectedMember.name,
        npcRole: selectedMember.role,
        playerName: playerCharacter.name,
        location: `${farmState?.family.familyName || 'Unknown'} Farm`,
        culturalZone,
        era,
        useHistoricalLanguage,
      };

      const response = await generateEncounterDialogue({
        playerMessage: chatInput,
        npcCharacter: selectedMember as any,
        playerCharacter,
        context: context as any,
        conversationHistory: chatHistory,
      });

      const newHistory: DialogueEntry[] = [
        ...chatHistory,
        {
          speaker: 'player' as const,
          text: chatInput,
          timestamp: new Date(),
        },
        {
          speaker: 'npc' as const,
          text: response,
          timestamp: new Date(),
        },
      ];

      setChatHistory(newHistory);
      setChatInput('');
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
      setChatHistory([
        ...chatHistory,
        {
          speaker: 'player' as const,
          text: chatInput,
          timestamp: new Date(),
        },
        {
          speaker: 'system' as const,
          text: 'The farmer seems distracted and does not respond.',
          timestamp: new Date(),
        },
      ]);
      setChatInput('');
    } finally {
      setIsChatting(false);
    }
  }, [
    useLlm,
    chatInput,
    selectedMember,
    playerCharacter,
    farmState,
    culturalZone,
    era,
    useHistoricalLanguage,
    chatHistory,
  ]);

  // Run advisor summary
  const runAdvisorSummary = useCallback(async () => {
    if (!useLlm) return;

    setIsAdvisorBusy(true);

    try {
      const summary = await generateHistoricalSummary({
        location: mapData.localArea || mapData.continent || 'Unknown',
        year: mapData.timeSlice || '1650',
        culturalZone,
        topics: ['farming', 'agriculture', 'crops', 'livestock'],
      });

      setAdvisorSummary(summary);
    } catch (error) {
      console.error('Failed to generate advisor summary:', error);
      setAdvisorSummary(
        'The village elder is unavailable at the moment. Please try again later.'
      );
    } finally {
      setIsAdvisorBusy(false);
    }
  }, [useLlm, mapData, culturalZone]);

  // Run advisor chat
  const runAdvisorChat = useCallback(async () => {
    if (!useLlm || !advisorChat.trim()) return;

    setIsAdvisorBusy(true);

    try {
      const elderNPC = {
        name: 'Village Elder',
        role: 'Advisor',
        age: 65,
        gender: 'male' as const,
      };

      const response = await generateEncounterDialogue({
        playerMessage: advisorChat,
        npcCharacter: elderNPC as any,
        playerCharacter,
        context: {
          npcName: 'Village Elder',
          npcRole: 'Farming Advisor',
          playerName: playerCharacter.name,
          location: mapData.localArea || mapData.continent,
          culturalZone,
          era,
          season,
        } as any,
        conversationHistory: [],
      });

      setAdvisorLog(prev => [
        ...prev,
        `You: ${advisorChat}`,
        `Elder: ${response}`,
      ]);
      setAdvisorChat('');
    } catch (error) {
      console.error('Failed to generate advisor chat:', error);
      setAdvisorLog(prev => [
        ...prev,
        `You: ${advisorChat}`,
        'Elder: I cannot advise you at this time.',
      ]);
      setAdvisorChat('');
    } finally {
      setIsAdvisorBusy(false);
    }
  }, [
    useLlm,
    advisorChat,
    playerCharacter,
    mapData,
    culturalZone,
    era,
    season,
  ]);

  // Refresh farm flavor
  const refreshFarmFlavor = useCallback(async () => {
    if (!useLlm || !farmState) return;

    setIsRefreshingFlavor(true);

    try {
      const flavorDetails = await llmGenerateFarmDetails({
        familyName: farmState.family.familyName,
        culturalZone,
        era,
        season,
        wealthLevel: farmState.economicStatus,
        cropType: farmState.fields.find(f => f.crop)?.crop || 'wheat',
      });

      // Update farm state with new flavor text (if your FarmState supports it)
      console.log('Generated farm flavor:', flavorDetails);
      setFarmerMessage(flavorDetails.description || generateFarmerMessage());
    } catch (error) {
      console.error('Failed to refresh farm flavor:', error);
      setFarmerMessage(generateFarmerMessage());
    } finally {
      setIsRefreshingFlavor(false);
    }
  }, [useLlm, farmState, culturalZone, era, season, generateFarmerMessage]);

  // Handle farm work command with full LLM simulation
  const handleFarmWorkCommand = useCallback(
    async (command: string) => {
      if (!useLlm || !farmState || !command.trim() || isFarmWorkProcessing) return;

      setIsFarmWorkProcessing(true);
      setFarmWorkHistory(prev => [...prev, { type: 'player', text: command }]);

      try {
        // Prepare livestock data
        const livestock = farmState.livestock?.map(l => ({
          type: l.type,
          health: l.health,
          productivity: l.productivity,
          lastFed: l.lastFed
        }));

        // Call full farm simulation function
        const result = await generateFarmWorkSimulation(
          command,
          farmState,
          playerCharacter,
          validCrops,
          season,
          timeOfDay,
          currentFarmTime,
          livestock
        );

        // Add narrative to history
        setFarmWorkHistory(prev => [...prev, { type: 'narrator', text: result.narrative }]);

        // Apply state changes
        if (result.stateChanges) {
          let updated = { ...farmState };

          // Apply field changes
          if (result.stateChanges.fields) {
            Object.entries(result.stateChanges.fields).forEach(([fieldId, changes]) => {
              const fieldIndex = parseInt(fieldId) - 1;
              if (fieldIndex >= 0 && fieldIndex < updated.fields.length) {
                updated.fields[fieldIndex] = { ...updated.fields[fieldIndex], ...changes };
              }
            });
          }

          // Apply livestock changes
          if (result.stateChanges.livestock && updated.livestock) {
            Object.entries(result.stateChanges.livestock).forEach(([livestockId, changes]) => {
              const livestockIndex = updated.livestock!.findIndex(l =>
                l.type === livestockId || `${l.type}_${updated.livestock!.indexOf(l) + 1}` === livestockId
              );
              if (livestockIndex >= 0) {
                updated.livestock![livestockIndex] = { ...updated.livestock![livestockIndex], ...changes };
              }
            });
          }

          // Update farm state
          setFarmState(updated);
          updateFarmState(farmState.tileKey, {
            fields: updated.fields,
            livestock: updated.livestock
          });

          // Apply player state changes via callback
          if (result.stateChanges.player && onPlayerStateChange) {
            onPlayerStateChange({
              health: result.stateChanges.player.health,
              fatigue: result.stateChanges.player.fatigue,
              statusEffects: result.stateChanges.player.statusEffects,
              inventory: result.stateChanges.inventory
            });
          }

          // Track time
          const timeElapsed = result.stateChanges.time?.elapsed || 0.5;
          const newHours = hoursWorkedToday + timeElapsed;
          setHoursWorkedToday(newHours);

          const newTime = currentFarmTime + timeElapsed;
          setCurrentFarmTime(newTime);

          // Add to action log (keep last 5)
          setFarmActionLog(prev => {
            const newLog = [{ action: command, timeElapsed }, ...prev].slice(0, 5);
            return newLog;
          });

          // End of day check
          if (newHours >= 8) {
            const headFarmer = farmState.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
                              farmState.family.members.find(m => m.role === 'Farmer') ||
                              farmState.family.members[0];

            setTimeout(() => {
              setFarmerToast({
                message: `The sun sets. ${headFarmer?.name || 'The farmer'} calls you home. A day's work is done.`,
                type: 'news'
              });
              setHoursWorkedToday(0);
            }, 1500);
          }
        }

      } catch (e) {
        console.error('Farm work command failed:', e);
        setFarmWorkHistory(prev => [...prev, {
          type: 'narrator',
          text: 'You struggle to focus on your work...'
        }]);
      } finally {
        setIsFarmWorkProcessing(false);
        setFarmWorkInput('');
      }
    },
    [
      useLlm,
      farmState,
      setFarmState,
      isFarmWorkProcessing,
      season,
      timeOfDay,
      validCrops,
      playerCharacter,
      hoursWorkedToday,
      currentFarmTime,
      onPlayerStateChange
    ]
  );

  // Initialize work session with farmer's assigned task
  const initializeWorkSession = useCallback((task: string) => {
    const headFarmer = farmState?.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
                      farmState?.family.members.find(m => m.role === 'Farmer') ||
                      farmState?.family.members[0];

    const intro: WorkHistoryEntry = {
      type: 'narrator',
      text: `${headFarmer?.name || 'The farmer'} leads you to the fields. "${task}," they say, gesturing toward the work ahead. The ${season.toLowerCase()} sun hangs in the ${timeOfDay.toLowerCase()} sky. What will you do?`
    };

    setFarmWorkHistory([intro]);
    setHoursWorkedToday(0);
    setCurrentFarmTime(new Date().getHours());
  }, [farmState, season, timeOfDay]);

  // Phase 3.4: State persistence for work sessions
  useEffect(() => {
    if (farmWorkHistory.length > 1 && farmState?.tileKey) {
      // Don't save just intro message
      const sessionKey = `farm-work-${farmState.tileKey}`;
      try {
        localStorage.setItem(sessionKey, JSON.stringify({
          history: farmWorkHistory.slice(-20), // Keep last 20 messages
          hoursWorked: hoursWorkedToday,
          actionLog: farmActionLog.slice(-10), // Keep last 10 actions
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to persist farm work session:', e);
      }
    }
  }, [farmWorkHistory, hoursWorkedToday, farmActionLog, farmState?.tileKey]);

  return {
    // Family chat
    selectedMember,
    setSelectedMember,
    chatInput,
    setChatInput,
    isChatting,
    chatHistory,
    setChatHistory,
    useHistoricalLanguage,
    setUseHistoricalLanguage,
    handleFarmerChat,

    // Advisor
    advisorSummary,
    advisorChat,
    setAdvisorChat,
    advisorLog,
    isAdvisorBusy,
    runAdvisorSummary,
    runAdvisorChat,

    // Farm flavor
    isRefreshingFlavor,
    refreshFarmFlavor,

    // Farmer messages
    farmerMessage,
    setFarmerMessage,
    farmerToast,
    setFarmerToast,
    generateFarmerMessage,

    // Farm work
    farmWorkHistory,
    setFarmWorkHistory,
    farmWorkInput,
    setFarmWorkInput,
    isFarmWorkProcessing,
    currentFarmTime,
    setCurrentFarmTime,
    hoursWorkedToday,
    setHoursWorkedToday,
    farmActionLog,
    setFarmActionLog,
    handleFarmWorkCommand,
    initializeWorkSession,
  };
}
