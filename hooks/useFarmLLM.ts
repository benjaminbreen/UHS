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
  year: number;
  validCrops: string[];
  useLlm: boolean;
  onPlayerStateChange?: (changes: any) => void;
  onTimeAdvance?: (hours: number) => void;
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

  // Quick NPC talk for roguelike
  handleQuickNpcTalk: (npc: FarmFamilyMember, userMessage?: string) => Promise<string>;
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
  year,
  validCrops,
  useLlm,
  onPlayerStateChange,
  onTimeAdvance,
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

  // Quick NPC dialogue history - track last 10 exchanges for memory
  const [quickNpcDialogueHistory, setQuickNpcDialogueHistory] = useState<Array<{ npcId: string; message: string; response: string; timestamp: number }>>([]);

  // Initialize farm work history with context-aware intro message
  // ALSO update when contract status changes
  useEffect(() => {
    if (!era || !season || !farmState) return;

    // Build context-aware intro based on residency status
    const getContextualIntro = (): string => {
      const farmerName = farmState.family.headOfHousehold || 'the farmer';
      const status = farmState.residencyStatus?.playerStatus || 'visitor';
      const daysWorked = farmState.residencyStatus?.daysWorked || 0;
      const contract = farmState.residencyStatus?.currentContract;

      const eraName =
        era === 'MEDIEVAL'
          ? 'medieval'
          : era === 'RENAISSANCE_EARLY_MODERN'
          ? 'early modern'
          : era === 'ANTIQUITY'
          ? 'ancient'
          : era === 'INDUSTRIAL_ERA'
          ? 'industrial'
          : era === 'MODERN_ERA'
          ? 'modern'
          : 'historical';
      const zoneName = culturalZone.toLowerCase().replace(/_/g, ' ');

      // First-time visitor (no contract, no days worked)
      if (status === 'visitor' && daysWorked === 0 && !contract) {
        return `You've just arrived at ${farmerName}'s farm in the ${season.toLowerCase()} season. The ${eraName} ${zoneName} landscape stretches before you. You haven't yet spoken to ${farmerName} about working here. (Try: "look around", "find ${farmerName}", "examine the fields")`;
      }

      // Guest status (welcomed but not working yet)
      if (status === 'guest' && daysWorked === 0) {
        return `${farmerName} has welcomed you to the farm as a guest. The ${season.toLowerCase()} ${eraName} fields await. Perhaps you could offer to help with the work? (Try: "ask ${farmerName} about work", "look around", "examine the fields")`;
      }

      // Active worker with contract
      if (status === 'worker' && contract) {
        const tasksText = contract.tasksToday && contract.tasksToday.length > 0
          ? `Today's tasks: ${contract.tasksToday.join(', ')}.`
          : 'No specific tasks assigned yet.';

        const paymentText = contract.payment.coins
          ? `${contract.payment.coins} coins${contract.payment.meals ? ' + meals' : ''}${contract.payment.lodging ? ' + lodging' : ''}`
          : contract.payment.meals
          ? 'meals and lodging'
          : 'room and board';

        return `${farmerName} has hired you to work the farm (${contract.type} contract, ${paymentText}). This is day ${daysWorked + 1} of your arrangement. ${tasksText} The ${season.toLowerCase()} fields await your labor. What will you do? (Try: "mend the fence", "water the crops", "feed the animals")`;
      }

      // Worker without contract (unusual case)
      if (status === 'worker' && !contract) {
        return `You've been working at ${farmerName}'s farm for ${daysWorked} day${daysWorked !== 1 ? 's' : ''} now. The ${season.toLowerCase()} work continues. What will you do? (Try: "plant crops", "water fields", "tend livestock")`;
      }

      // Resident status (long-term stay)
      if (status === 'resident') {
        return `You've been living and working at ${farmerName}'s farm for ${daysWorked} days now. The ${season.toLowerCase()} ${eraName} routine has become familiar. What will you do today? (Try: "check the fields", "tend the animals", "talk to ${farmerName}")`;
      }

      // Fallback for any other cases
      return `You stand at ${farmerName}'s farm in the ${season.toLowerCase()} season. The ${eraName} ${zoneName} landscape stretches before you. What will you do? (Try: "look around", "examine the fields", "find ${farmerName}")`;
    };

    const newIntro = getContextualIntro();

    // Only update if history is empty OR if contract status has changed
    if (farmWorkHistory.length === 0) {
      setFarmWorkHistory([{ type: 'narrator', text: newIntro }]);
    } else if (farmWorkHistory.length === 1 && farmWorkHistory[0].type === 'narrator') {
      // Update the intro message if contract was just accepted
      const hasContract = farmState.residencyStatus?.currentContract;
      const currentIntroMentionsContract = farmWorkHistory[0].text.includes('contract') || farmWorkHistory[0].text.includes('hired');

      if (hasContract && !currentIntroMentionsContract) {
        // Contract was just accepted - update intro
        setFarmWorkHistory([{ type: 'narrator', text: newIntro }]);
      }
    }
  }, [era, season, culturalZone, farmState?.residencyStatus?.currentContract, farmState?.residencyStatus?.playerStatus, farmWorkHistory.length]);

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
    if (!useLlm || !chatInput.trim() || !selectedMember || !farmState) return;

    setIsChatting(true);

    try {
      // Convert selectedMember to NpcEntity format
      const npcEntity: NpcEntity = {
        id: selectedMember.id,
        name: selectedMember.name,
        type: 'npc' as const,
        x: 0,
        y: 0,
        health: selectedMember.health,
        maxHealth: selectedMember.maxHealth,
        age: selectedMember.age,
        gender: selectedMember.gender.toLowerCase() as 'male' | 'female',
        culturalZone: culturalZone,
        occupation: selectedMember.role.toLowerCase(),
        personality: selectedMember.traits?.map(t => t.name.toLowerCase()) || ['hardworking', 'practical'],
        memory: {
          conversationSummaries: [],
          opinionOfPlayer: 50
        }
      };

      // Call with correct signature
      const response = await generateEncounterDialogue(
        npcEntity,
        chatHistory,
        chatInput,
        playerCharacter,
        [],
        mapData,
        useHistoricalLanguage
      );

      const newHistory: DialogueEntry[] = [
        ...chatHistory,
        {
          speaker: 'player' as const,
          text: chatInput,
          timestamp: new Date(),
        },
        {
          speaker: 'npc' as const,
          text: response.text,
          timestamp: new Date(),
        },
      ];

      // Keep only last 10 exchanges (20 entries)
      const trimmedHistory = newHistory.slice(-20);

      setChatHistory(trimmedHistory);
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
    mapData,
  ]);

  // Run advisor summary
  const runAdvisorSummary = useCallback(async () => {
    if (!useLlm) return;

    setIsAdvisorBusy(true);

    try {
      const summary = await generateHistoricalSummary({
        location: mapData.localArea || mapData.continent || 'Unknown',
        year: String(year), // Use the actual year passed as parameter
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
  }, [useLlm, mapData, culturalZone, year]);

  // Run advisor chat
  const runAdvisorChat = useCallback(async () => {
    if (!useLlm || !advisorChat.trim()) return;

    setIsAdvisorBusy(true);

    try {
      // Create a proper NPC entity for the village elder
      const elderNPC: NpcEntity = {
        id: 'farm-advisor-elder',
        name: 'Village Elder',
        type: 'npc' as const,
        x: 0,
        y: 0,
        health: 80,
        maxHealth: 100,
        age: 65,
        gender: 'male' as const,
        culturalZone,
        occupation: 'advisor',
        personality: ['wise', 'patient', 'knowledgeable', 'traditional'],
        memory: {
          conversationSummaries: [],
          opinionOfPlayer: 70
        }
      };

      // Call with correct signature: target, history, playerInput, playerCharacter, allNpcs, mapData, useRealLanguage
      const response = await generateEncounterDialogue(
        elderNPC,
        advisorLog.map(line => line.startsWith('You:') ? line.substring(5) : line.substring(7)),
        advisorChat,
        playerCharacter,
        [],
        mapData,
        false
      );

      setAdvisorLog(prev => [
        ...prev,
        `You: ${advisorChat}`,
        `Elder: ${response.text}`,
      ]);
      setAdvisorChat('');
    } catch (error) {
      console.error('Failed to generate advisor chat:', error);
      setAdvisorLog(prev => [
        ...prev,
        `You: ${advisorChat}`,
        'Elder: I cannot advise you at this time. Perhaps try again later.',
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
    advisorLog,
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

        // Call full farm simulation function with conversation history
        const result = await generateFarmWorkSimulation(
          command,
          farmState,
          playerCharacter,
          validCrops,
          season,
          timeOfDay,
          currentFarmTime,
          livestock,
          farmWorkHistory.slice(-10) // Pass last 10 messages for context continuity
        );

        // Add narrative to history with work quality if available
        let narrativeText = result.narrative;
        if (result.workQuality) {
          const qualityColor = result.workQuality.category === 'masterful' ? '🌟' :
                              result.workQuality.category === 'excellent' ? '✨' :
                              result.workQuality.category === 'good' ? '✓' :
                              result.workQuality.category === 'adequate' ? '~' : '✗';
          narrativeText += `\n\n${qualityColor} Work Quality: ${result.workQuality.score}/100 (${result.workQuality.category}) - ${result.workQuality.feedback}`;
        }
        setFarmWorkHistory(prev => [...prev, { type: 'narrator', text: narrativeText }]);

        // Update farmer toast if farmer noticed/reacted to the action
        if (result.farmerNoticed && result.farmerNoticed.shouldReact) {
          setTimeout(() => {
            setFarmerToast({
              message: result.farmerNoticed.dialogue,
              type: result.farmerNoticed.tone === 'pleased' ? 'praise' :
                    result.farmerNoticed.tone === 'concerned' ? 'advice' :
                    result.farmerNoticed.tone === 'suspicious' || result.farmerNoticed.tone === 'angry' ? 'admonition' :
                    result.farmerNoticed.tone === 'hostile' ? 'warning' : 'news'
            });
          }, 800); // Slight delay for dramatic effect
        }

        // Apply state changes
        if (result.stateChanges) {
          let updated = { ...farmState };

          // Apply field changes (LLM uses 0-based array indices) with validation
          // Create new array to ensure UI re-renders
          if (result.stateChanges.fields) {
            const fieldNotifications: string[] = [];
            updated.fields = updated.fields.map((field, idx) => {
              const fieldChanges = result.stateChanges.fields?.[idx.toString()];
              if (!fieldChanges) return field;

              // Validate and clamp numeric values
              const validatedChanges: any = { ...fieldChanges };

              if (fieldChanges.health !== undefined) {
                validatedChanges.health = Math.max(0, Math.min(100, fieldChanges.health));
              }
              if (fieldChanges.soilNitrogen !== undefined) {
                validatedChanges.soilNitrogen = Math.max(0, Math.min(100, fieldChanges.soilNitrogen));
              }
              if (fieldChanges.soilPhosphorus !== undefined) {
                validatedChanges.soilPhosphorus = Math.max(0, Math.min(100, fieldChanges.soilPhosphorus));
              }
              if (fieldChanges.soilPotassium !== undefined) {
                validatedChanges.soilPotassium = Math.max(0, Math.min(100, fieldChanges.soilPotassium));
              }
              if (fieldChanges.pestSeverity !== undefined) {
                validatedChanges.pestSeverity = Math.max(0, Math.min(100, fieldChanges.pestSeverity));
              }
              if (fieldChanges.diseaseSeverity !== undefined) {
                validatedChanges.diseaseSeverity = Math.max(0, Math.min(100, fieldChanges.diseaseSeverity));
              }
              if (fieldChanges.weedDensity !== undefined) {
                validatedChanges.weedDensity = Math.max(0, Math.min(100, fieldChanges.weedDensity));
              }
              if (fieldChanges.daysToHarvest !== undefined) {
                validatedChanges.daysToHarvest = Math.max(0, fieldChanges.daysToHarvest);
              }

              // Detect significant changes for notifications
              if (fieldChanges.crop && !field.crop) {
                fieldNotifications.push(`Field ${idx + 1} planted with ${fieldChanges.crop}!`);
              }
              if (fieldChanges.moisture && fieldChanges.moisture !== field.moisture) {
                if (fieldChanges.moisture === 'wet' || fieldChanges.moisture === 'moist') {
                  fieldNotifications.push(`Field ${idx + 1} watered successfully`);
                }
              }
              if (fieldChanges.crop === null && field.crop) {
                fieldNotifications.push(`Field ${idx + 1} harvested!`);
              }

              return { ...field, ...validatedChanges };
            });

            // Show field change notifications
            if (fieldNotifications.length > 0) {
              setTimeout(() => {
                setFarmerToast({
                  message: fieldNotifications.join(' • '),
                  type: 'news'
                });
              }, 500);
            }
          }

          // Apply livestock changes
          if (result.stateChanges.livestock && updated.livestock) {
            let livestockStateChanged = false;
            updated.livestock = updated.livestock.map((animal, idx) => {
              // Check if this animal has changes (by type name or by type_index)
              const changes = result.stateChanges.livestock?.[animal.type] ||
                             result.stateChanges.livestock?.[`${animal.type}_${idx + 1}`];

              if (changes) {
                livestockStateChanged = true;
                // Apply changes and ensure health/productivity are clamped 0-100
                const updatedAnimal = { ...animal, ...changes };
                if (updatedAnimal.health !== undefined) {
                  updatedAnimal.health = Math.max(0, Math.min(100, updatedAnimal.health));
                }
                if (updatedAnimal.productivity !== undefined) {
                  updatedAnimal.productivity = Math.max(0, Math.min(100, updatedAnimal.productivity));
                }

                // If lastFed was updated, it should be currentFarmTime
                if (changes.lastFed !== undefined) {
                  updatedAnimal.lastFed = currentFarmTime;

                  // Show state change notification for feeding
                  setTimeout(() => {
                    const healthDiff = updatedAnimal.health - animal.health;
                    if (healthDiff > 0) {
                      setFarmerToast({
                        message: `${animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} fed! Health improving (+${healthDiff.toFixed(0)} health)`,
                        type: 'news'
                      });
                    } else {
                      setFarmerToast({
                        message: `${animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} fed successfully!`,
                        type: 'news'
                      });
                    }
                  }, 500);
                }

                return updatedAnimal;
              }
              return animal;
            });
          }

          // Update farm state
          setFarmState(updated);
          updateFarmState(farmState.tileKey, {
            fields: updated.fields,
            livestock: updated.livestock
          });

          // Apply player state changes via callback (deltas, not absolute values)
          if (result.stateChanges.player && onPlayerStateChange) {
            const healthDelta = result.stateChanges.player.health || 0;
            const fatigueDelta = result.stateChanges.player.fatigue || 0;

            const newHealth = Math.max(0, Math.min(
              playerCharacter.maxHealth,
              playerCharacter.health + healthDelta
            ));
            const newFatigue = Math.max(0, Math.min(
              playerCharacter.maxFatigue,
              playerCharacter.fatigue + fatigueDelta
            ));

            onPlayerStateChange({
              health: newHealth,
              fatigue: newFatigue,
              statusEffects: result.stateChanges.player.statusEffects,
            });

            // Show toast notification for significant injuries
            if (healthDelta < -5) {
              setTimeout(() => {
                setFarmerToast({
                  message: `You've been injured! (${healthDelta} HP)`,
                  type: 'warning'
                });
              }, 500);
            }

            // Show toast for exhaustion
            if (fatigueDelta > 20) {
              setTimeout(() => {
                setFarmerToast({
                  message: `You're getting exhausted. Consider resting soon.`,
                  type: 'admonition'
                });
              }, 500);
            }
          }

          // Apply inventory changes (add harvested items, remove consumed tools)
          if (result.stateChanges.inventory && onPlayerStateChange) {
            let updatedInventory = [...playerCharacter.inventory];

            // Add items (harvested crops, etc.)
            if (result.stateChanges.inventory.add) {
              result.stateChanges.inventory.add.forEach(item => {
                updatedInventory.push({
                  id: `farm_harvest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                  name: item.name,
                  category: item.category || 'Material',
                  quantity: item.quantity || 1,
                  weight: 1,
                  value: 5 * (item.quantity || 1),
                  rarity: 'Common' as const,
                  quality: 'standard' as const,
                });
              });

              // Show toast for successful harvest
              const totalHarvested = result.stateChanges.inventory.add.reduce(
                (sum, item) => sum + (item.quantity || 1),
                0
              );
              setTimeout(() => {
                setFarmerToast({
                  message: `Harvested ${totalHarvested} units! Check your inventory.`,
                  type: 'news'
                });
              }, 1000);
            }

            // Remove items (consumed/broken tools)
            if (result.stateChanges.inventory.remove) {
              result.stateChanges.inventory.remove.forEach(itemId => {
                updatedInventory = updatedInventory.filter(i => i.id !== itemId);
              });
            }

            onPlayerStateChange({ inventory: updatedInventory });
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

          // End of day check - trigger rest and advance time
          if (newHours >= 8) {
            const headFarmer = farmState.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
                              farmState.family.members.find(m => m.role === 'Farmer') ||
                              farmState.family.members[0];

            // Apply rest benefits to player
            if (onPlayerStateChange) {
              const fatigueReduction = Math.min(playerCharacter.fatigue, 40); // Rest reduces fatigue by up to 40
              const healthRecovery = Math.min(playerCharacter.maxHealth - playerCharacter.health, 10); // Light healing

              onPlayerStateChange({
                fatigue: Math.max(0, playerCharacter.fatigue - fatigueReduction),
                health: Math.min(playerCharacter.maxHealth, playerCharacter.health + healthRecovery),
              });
            }

            // Advance time to next morning (skip to dawn, ~12 hours)
            if (onTimeAdvance) {
              onTimeAdvance(12);
            }

            setTimeout(() => {
              setFarmerToast({
                message: `The sun sets. ${headFarmer?.name || 'The farmer'} calls you home. You rest for the night and wake refreshed at dawn.`,
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
      onPlayerStateChange,
      onTimeAdvance
    ]
  );

  // Initialize work session with farmer's assigned task
  const initializeWorkSession = useCallback((task: string) => {
    const headFarmer = farmState?.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
                      farmState?.family.members.find(m => m.role === 'Farmer') ||
                      farmState?.family.members[0];

    const farmerName = headFarmer?.name || 'The farmer';
    const contract = farmState?.residencyStatus?.currentContract;
    const daysWorked = farmState?.residencyStatus?.daysWorked || 0;

    // Build context-aware intro message based on contract status
    let introText: string;

    if (contract) {
      // Player has accepted work contract - show contract context
      const tasksText = contract.tasksToday && contract.tasksToday.length > 0
        ? contract.tasksToday.join(', ')
        : task;

      const paymentText = contract.payment.coins
        ? `${contract.payment.coins} coins${contract.payment.meals ? ' + meals' : ''}${contract.payment.lodging ? ' + lodging' : ''}`
        : contract.payment.meals
        ? 'meals and lodging'
        : 'room and board';

      introText = `${farmerName} leads you to the fields. "Alright, let's get started with the work. ${tasksText}," they say. You're working under a ${contract.type} contract (${paymentText}), day ${daysWorked + 1}. The ${season.toLowerCase()} sun hangs in the ${timeOfDay.toLowerCase()} sky. What will you do?`;
    } else {
      // No contract - generic intro
      introText = `${farmerName} leads you to the fields. "${task}," they say, gesturing toward the work ahead. The ${season.toLowerCase()} sun hangs in the ${timeOfDay.toLowerCase()} sky. What will you do?`;
    }

    const intro: WorkHistoryEntry = {
      type: 'narrator',
      text: introText
    };

    setFarmWorkHistory([intro]);
    setHoursWorkedToday(0);
    setCurrentFarmTime(gameTimeHours); // ✅ Use game time instead of real-world time
  }, [farmState, season, timeOfDay, gameTimeHours]);

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

  // Quick NPC talk for roguelike - generates contextual dialogue
  const handleQuickNpcTalk = useCallback(async (npc: FarmFamilyMember, userMessage?: string): Promise<string> => {
    console.log('[useFarmLLM] handleQuickNpcTalk called:', {
      npcName: npc.name,
      userMessage,
      useLlm,
      hasFarmState: !!farmState,
      culturalZone,
      era
    });

    if (!useLlm || !farmState) {
      console.log('[useFarmLLM] Using fallback response - useLlm:', useLlm, 'farmState:', !!farmState);
      // Fallback non-LLM response
      const taskText = npc.currentTask ? ` I'm ${npc.currentTask.toLowerCase()}.` : '';
      return `"Hello there!${taskText}"`;
    }

    try {
      console.log('[useFarmLLM] Calling LLM for NPC dialogue...');

      // Build conversation history for this specific NPC
      const npcHistory = quickNpcDialogueHistory
        .filter(entry => entry.npcId === npc.id)
        .slice(-5) // Last 5 exchanges
        .map(entry => ({
          role: 'player' as const,
          text: entry.message,
          response: entry.response,
          timestamp: entry.timestamp
        }));

      // Build context-aware memory with conversation summaries
      const conversationSummaries: string[] = [];
      if (npcHistory.length > 0) {
        conversationSummaries.push(`Recent exchanges: ${npcHistory.length} previous conversations`);
      }

      // Add contract/residency context to memory
      const residencyStatus = farmState.residencyStatus;
      if (residencyStatus) {
        if (residencyStatus.playerStatus === 'worker') {
          conversationSummaries.push(`Player has a work contract on this farm`);
        } else if (residencyStatus.playerStatus === 'resident') {
          conversationSummaries.push(`Player is a resident of this farm`);
        }

        if (residencyStatus.daysWorked > 0) {
          conversationSummaries.push(`Player has worked here for ${residencyStatus.daysWorked} days`);
        }

        if (residencyStatus.currentContract) {
          const contract = residencyStatus.currentContract;
          conversationSummaries.push(`Active contract: ${contract.taskType} - ${contract.description}`);
          if (contract.deadline) {
            conversationSummaries.push(`Contract deadline: ${contract.deadline} hours remaining`);
          }
        }
      }

      // Convert to NpcEntity format for LLM with enriched memory
      const npcEntity: NpcEntity = {
        id: npc.id,
        name: npc.name,
        type: 'npc' as const,
        x: 0,
        y: 0,
        health: npc.health,
        maxHealth: npc.maxHealth,
        age: npc.age,
        gender: npc.gender.toLowerCase() as 'male' | 'female',
        culturalZone: culturalZone,
        occupation: npc.role.toLowerCase(),
        personality: npc.traits?.map(t => t.name.toLowerCase()) || ['hardworking', 'practical'],
        memory: {
          conversationSummaries,
          opinionOfPlayer: 50 + (residencyStatus?.daysWorked || 0) * 2 // Opinion improves with work
        }
      };

      // Build enriched prompt with contract/residency context
      let contextInfo = '';
      if (residencyStatus?.playerStatus === 'worker' && residencyStatus.currentContract) {
        contextInfo = ` IMPORTANT: The player is currently working on your farm under contract (${residencyStatus.currentContract.description}). Remember this context.`;
      } else if (residencyStatus?.playerStatus === 'resident') {
        contextInfo = ` The player is a resident of your farm.`;
      } else if (residencyStatus?.daysWorked > 0) {
        contextInfo = ` The player has worked on your farm before (${residencyStatus.daysWorked} days).`;
      }

      const prompt = userMessage
        ? `The player says to ${npc.name}: "${userMessage}". Respond naturally in character (1-2 sentences).${
            npc.currentTask ? ` ${npc.name} is currently ${npc.currentTask.toLowerCase()}.` : ''
          }${contextInfo} Keep it contextual to farm life in ${era}, ${culturalZone}.`
        : `The player greets ${npc.name}. Respond with a brief, casual greeting (1-2 sentences) in character.${
            npc.currentTask ? ` ${npc.name} is currently ${npc.currentTask.toLowerCase()}.` : ''
          }${contextInfo} Keep it natural and contextual to farm life in ${era}, ${culturalZone}.`;

      console.log('[useFarmLLM] Prompt:', prompt);
      console.log('[useFarmLLM] Conversation history entries:', npcHistory.length);
      console.log('[useFarmLLM] Memory summaries:', conversationSummaries);

      // Convert all family members to NPC entities for context
      const allNpcs: NpcEntity[] = farmState.family.members.map(member => ({
        id: member.id,
        name: member.name,
        type: 'npc' as const,
        x: 0,
        y: 0,
        health: member.health,
        maxHealth: member.maxHealth,
        age: member.age,
        gender: member.gender.toLowerCase() as 'male' | 'female',
        culturalZone: culturalZone,
        occupation: member.role.toLowerCase(),
        personality: member.traits?.map(t => t.name.toLowerCase()) || ['hardworking'],
        memory: { conversationSummaries: [], opinionOfPlayer: 50 }
      }));

      // Build conversation history array for generateEncounterDialogue
      const conversationHistory: DialogueEntry[] = npcHistory.map(h => ({
        speaker: playerCharacter.name,
        text: h.text,
        timestamp: h.timestamp,
        emotion: 'neutral'
      }));

      // Call LLM with conversation history
      const result = await generateEncounterDialogue(
        npcEntity,
        conversationHistory,  // ✅ Pass actual conversation history
        prompt,
        playerCharacter,
        allNpcs,      // ✅ Array of NPCs
        mapData,      // ✅ MapData object
        false         // ✅ useRealLanguage (false = modern English)
      );

      console.log('[useFarmLLM] LLM response received:', result);

      const responseText = result.text || `"Hello! ${npc.currentTask ? `Just ${npc.currentTask.toLowerCase()}.` : 'Nice day, isn\'t it?'}"`;

      // Store dialogue in history for future context
      setQuickNpcDialogueHistory(prev => {
        const newEntry = {
          npcId: npc.id,
          message: userMessage || '[greeting]',
          response: responseText,
          timestamp: Date.now()
        };

        // Keep last 20 total exchanges across all NPCs
        const updated = [...prev, newEntry];
        return updated.slice(-20);
      });

      return responseText;
    } catch (error) {
      console.error('[useFarmLLM] Quick NPC talk error:', error);
      return `"Hello there! ${npc.currentTask ? `Busy ${npc.currentTask.toLowerCase()}.` : 'How are you?'}"`;
    }
  }, [useLlm, farmState, culturalZone, era, playerCharacter, timeOfDay, mapData, quickNpcDialogueHistory, setQuickNpcDialogueHistory]);

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

    // Quick NPC talk
    handleQuickNpcTalk,
  };
}
