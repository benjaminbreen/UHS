/**
 * hooks/useFactoryShift.ts
 * Main game logic for factory labor minigame
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PlayerCharacter, MapData } from '../types';
import { FactoryType } from '../constants/gameData/factoryTypes';
import { FactoryContract } from '../components/factory/FactoryLaborPanel';
import { FactoryTask } from '../components/factory/FactoryTaskCard';
import { FactoryEvent } from '../components/factory/FactoryEventModal';
import { getTasksForFactoryType } from '../constants/gameData/factoryTasks';
import { validateFactoryTasks } from '../services/factoryDataService';
import { MinigameResult, getScoringInfo } from '../components/factory/minigameConstants';

interface UseFactoryShiftProps {
  factoryType: FactoryType;
  contract: FactoryContract | null;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  onPlayerStateChange?: (changes: Partial<PlayerCharacter>) => void;
  onTimeAdvance?: (hours: number) => void;
  onEventTriggered?: (event: FactoryEvent) => void;
}

export function useFactoryShift({
  factoryType,
  contract,
  playerCharacter,
  mapData,
  onPlayerStateChange,
  onTimeAdvance,
  onEventTriggered
}: UseFactoryShiftProps) {
  // Shift state
  const [isActive, setIsActive] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [currentTime, setCurrentTime] = useState(0); // hour of day

  // Player state (tracks changes during shift)
  const [playerHealth, setPlayerHealth] = useState(playerCharacter.health);
  const [playerFatigue, setPlayerFatigue] = useState(playerCharacter.fatigue || 0);

  // Output tracking
  const [outputProgress, setOutputProgress] = useState(0);
  const [wagesEarned, setWagesEarned] = useState(0);

  // Task management
  const [activeTask, setActiveTask] = useState<(FactoryTask & {
    progress: number;
    remainingSeconds: number;
    timedActionResult?: MinigameResult; // Changed from boolean to graded result
  }) | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Events
  const [eventLog, setEventLog] = useState<Array<{
    type: 'success' | 'warning' | 'danger' | 'info';
    message: string;
  }>>([]);
  const [taskHistory, setTaskHistory] = useState<Array<{
    action: string;
    timeElapsed: number;
  }>>([]);

  const taskIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shiftIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventCheckRef = useRef(0);

  // Generate available tasks based on factory type
  const availableTasks = useMemo((): FactoryTask[] => {
    if (!factoryType) {
      console.error('[FactoryShift] No factory type provided!');
      return [];
    }

    // Use single source of truth for tasks
    const tasks = getTasksForFactoryType(factoryType.id);

    // Validate that tasks match factory type
    validateFactoryTasks(factoryType, tasks);

    console.log(`[FactoryShift] Loaded ${tasks.length} tasks for ${factoryType.name} (${factoryType.id})`);

    return tasks;
  }, [factoryType]);

  // Old hardcoded tasks (REMOVED - now using factoryTasks.ts)
  /*
  const availableTasks = useMemo((): FactoryTask[] => {
    const taskTemplates: Record<string, FactoryTask[]> = {
      textile_mill: [
        {
          id: 'operate_loom',
          name: 'Operate Loom',
          description: 'Run the power loom to weave cloth',
          icon: '🧵',
          duration: 8,
          outputValue: 12,
          fatigueIncrease: 10,
          injuryRisk: 0.08,
          requiresTimedAction: true
        },
        {
          id: 'thread_bobbin',
          name: 'Thread Bobbin',
          description: 'Wind thread onto bobbins',
          icon: '🪡',
          duration: 5,
          outputValue: 6,
          fatigueIncrease: 5,
          injuryRisk: 0.03,
          requiresTimedAction: true
        },
        {
          id: 'clean_machine',
          name: 'Clean Machine',
          description: 'Remove cotton lint from machinery',
          icon: '🧹',
          duration: 6,
          outputValue: 3,
          fatigueIncrease: 8,
          injuryRisk: 0.12
        },
        {
          id: 'package_cloth',
          name: 'Package Cloth',
          description: 'Bundle finished cloth for shipment',
          icon: '📦',
          duration: 4,
          outputValue: 8,
          fatigueIncrease: 6,
          injuryRisk: 0.01
        },
        {
          id: 'repair_thread',
          name: 'Repair Broken Thread',
          description: 'Tie broken threads quickly',
          icon: '🔗',
          duration: 3,
          outputValue: 4,
          fatigueIncrease: 4,
          injuryRisk: 0.05,
          requiresTimedAction: true
        },
        {
          id: 'fetch_materials',
          name: 'Fetch Materials',
          description: 'Bring raw cotton to looms',
          icon: '🏃',
          duration: 5,
          outputValue: 2,
          fatigueIncrease: 12,
          injuryRisk: 0.02
        }
      ],
      steel_mill: [
        {
          id: 'pour_ladle',
          name: 'Pour Ladle',
          description: 'Pour molten steel carefully',
          icon: '🥄',
          duration: 12,
          outputValue: 18,
          fatigueIncrease: 18,
          injuryRisk: 0.22,
          requiresTimedAction: true,
          skillCheck: { attribute: 'strength', difficulty: 14 }
        },
        {
          id: 'load_furnace',
          name: 'Load Furnace',
          description: 'Add coal and ore to furnace',
          icon: '🔥',
          duration: 10,
          outputValue: 14,
          fatigueIncrease: 16,
          injuryRisk: 0.15
        },
        {
          id: 'move_ingots',
          name: 'Move Ingots',
          description: 'Transport hot steel ingots',
          icon: '📦',
          duration: 8,
          outputValue: 10,
          fatigueIncrease: 14,
          injuryRisk: 0.12,
          requiresTimedAction: true
        },
        {
          id: 'clear_slag',
          name: 'Clear Slag',
          description: 'Remove slag from crucibles',
          icon: '⚒️',
          duration: 7,
          outputValue: 8,
          fatigueIncrease: 12,
          injuryRisk: 0.18
        },
        {
          id: 'check_temp',
          name: 'Check Temperature',
          description: 'Monitor furnace heat',
          icon: '🌡️',
          duration: 4,
          outputValue: 4,
          fatigueIncrease: 6,
          injuryRisk: 0.08
        },
        {
          id: 'shovel_coal',
          name: 'Shovel Coal',
          description: 'Feed coal into the furnace',
          icon: '⛏️',
          duration: 6,
          outputValue: 6,
          fatigueIncrease: 20,
          injuryRisk: 0.05
        }
      ],
      sugar_plantation: [
        {
          id: 'cut_cane',
          name: 'Cut Cane',
          description: 'Harvest sugar cane stalks',
          icon: '🌾',
          duration: 10,
          outputValue: 15,
          fatigueIncrease: 22,
          injuryRisk: 0.25,
          requiresTimedAction: true
        },
        {
          id: 'load_cart',
          name: 'Load Cart',
          description: 'Stack cut cane into carts',
          icon: '🛒',
          duration: 6,
          outputValue: 10,
          fatigueIncrease: 16,
          injuryRisk: 0.08
        },
        {
          id: 'operate_press',
          name: 'Operate Press',
          description: 'Crush cane to extract juice',
          icon: '⚙️',
          duration: 8,
          outputValue: 12,
          fatigueIncrease: 14,
          injuryRisk: 0.18
        },
        {
          id: 'boil_juice',
          name: 'Boil Juice',
          description: 'Tend the boiling house',
          icon: '🔥',
          duration: 12,
          outputValue: 16,
          fatigueIncrease: 18,
          injuryRisk: 0.28
        },
        {
          id: 'fetch_water',
          name: 'Fetch Water',
          description: 'Carry water to the boiling house',
          icon: '💧',
          duration: 5,
          outputValue: 3,
          fatigueIncrease: 12,
          injuryRisk: 0.02
        },
        {
          id: 'clear_field',
          name: 'Clear Field',
          description: 'Remove debris and weeds',
          icon: '🪓',
          duration: 8,
          outputValue: 6,
          fatigueIncrease: 20,
          injuryRisk: 0.12
        }
      ]
    };

    // Default tasks if factory type not found
    const defaultTasks: FactoryTask[] = [
      {
        id: 'basic_work',
        name: 'Work',
        description: 'Perform factory tasks',
        icon: '⚙️',
        duration: 10,
        outputValue: 10,
        fatigueIncrease: 12,
        injuryRisk: 0.10
      }
    ];

    return taskTemplates[factoryType.id] || defaultTasks;
  }, [factoryType.id]);
  */

  // Start shift
  const startShift = useCallback(() => {
    setIsActive(true);
    setElapsedMinutes(0);
    setCurrentTime(6); // 6 AM start time
    setOutputProgress(0);
    setWagesEarned(0);
    setEventLog([{ type: 'info', message: 'Shift started. Report to your station.' }]);

    // Start shift clock (1 minute in real time = 1 minute in game, but accelerated)
    shiftIntervalRef.current = setInterval(() => {
      setElapsedMinutes(prev => prev + 1);
      setCurrentTime(prev => {
        const newTime = prev + (1 / 60);
        return newTime >= 24 ? newTime - 24 : newTime;
      });
    }, 1000); // Every second = 1 minute
  }, []);

  // Start a task
  const startTask = useCallback((task: FactoryTask) => {
    if (activeTask) return;

    setActiveTask({
      ...task,
      progress: 0,
      remainingSeconds: task.duration * 10, // 10 seconds per "minute"
      timedActionResult: undefined // Will be set when minigame completes
    });

    setEventLog(prev => [...prev, {
      type: 'info',
      message: `Started: ${task.name}`
    }]);

    // Task countdown
    taskIntervalRef.current = setInterval(() => {
      setActiveTask(current => {
        if (!current) return null;

        const newRemaining = current.remainingSeconds - 1;
        const newProgress = ((task.duration * 10 - newRemaining) / (task.duration * 10)) * 100;

        if (newRemaining <= 0) {
          // Task complete - use result or undefined if no minigame
          completeTask(task, current.timedActionResult);
          return null;
        }

        return {
          ...current,
          remainingSeconds: newRemaining,
          progress: newProgress
        };
      });
    }, 1000);
  }, [activeTask]);

  // Complete task with graded result
  const completeTask = useCallback((task: FactoryTask, result?: MinigameResult) => {
    if (taskIntervalRef.current) {
      clearInterval(taskIntervalRef.current);
      taskIntervalRef.current = null;
    }

    // Calculate results
    let outputGained = task.outputValue;
    let fatigueGained = task.fatigueIncrease;
    let healthLost = 0;
    let eventType: 'success' | 'warning' | 'danger' = 'success';
    let message = `Completed: ${task.name}`;

    // Apply graded scoring if minigame was completed
    if (task.requiresTimedAction && result) {
      const scoringInfo = getScoringInfo(result);

      outputGained = Math.floor(outputGained * scoringInfo.outputMultiplier);
      fatigueGained = Math.floor(fatigueGained * scoringInfo.fatigueMultiplier);

      // Message based on result
      switch (result) {
        case MinigameResult.PERFECT:
          message += ' (PERFECT! ⭐⭐)';
          eventType = 'success';
          break;
        case MinigameResult.GREAT:
          message += ' (Great timing! ⭐)';
          eventType = 'success';
          break;
        case MinigameResult.GOOD:
          message += ' (Good work 👍)';
          eventType = 'success';
          break;
        case MinigameResult.OKAY:
          message += ' (Okay...)';
          eventType = 'warning';
          break;
        case MinigameResult.MISS:
          message += ' (Missed timing ✗)';
          eventType = 'warning';
          break;
      }
    } else if (task.requiresTimedAction && !result) {
      // No minigame result - player skipped or timed out
      message += ' (Standard output)';
    }

    // Check for injury
    if (Math.random() < task.injuryRisk * (1 + playerFatigue / 100)) {
      healthLost = Math.floor(Math.random() * 15) + 5;
      setPlayerHealth(prev => Math.max(0, prev - healthLost));
      setEventLog(prev => [...prev, {
        type: 'danger',
        message: `⚠️ Injured during ${task.name}! (-${healthLost} health)`
      }]);
    }

    // Apply results
    setOutputProgress(prev => prev + outputGained);
    setPlayerFatigue(prev => Math.min(playerCharacter.maxFatigue, prev + fatigueGained));
    setCompletedTasks(prev => [...prev, task.id]);
    setEventLog(prev => [...prev, { type: eventType, message }]);
    setTaskHistory(prev => [...prev, { action: task.name, timeElapsed: task.duration }]);

    // Calculate wages
    if (contract) {
      const wageForTask = (contract.hourlyWage * task.duration) / 60;
      setWagesEarned(prev => prev + wageForTask);
    }

    setActiveTask(null);
  }, [contract, playerFatigue, playerCharacter.maxFatigue]);

  // Perform timed action with graded result
  const performTimedAction = useCallback((result: MinigameResult) => {
    setActiveTask(current => {
      if (!current) return null;
      return {
        ...current,
        timedActionResult: result
      };
    });

    // Add log message based on result
    const messages = {
      [MinigameResult.PERFECT]: '⭐⭐ PERFECT timing!',
      [MinigameResult.GREAT]: '⭐ Great timing!',
      [MinigameResult.GOOD]: '👍 Good work!',
      [MinigameResult.OKAY]: '~ Okay...',
      [MinigameResult.MISS]: '✗ Missed timing'
    };

    setEventLog(prev => [...prev, {
      type: result === MinigameResult.MISS || result === MinigameResult.OKAY ? 'warning' : 'success',
      message: messages[result]
    }]);
  }, []);

  // Check for random events
  useEffect(() => {
    if (!isActive || !onEventTriggered) return;

    // Check every 2 minutes
    if (elapsedMinutes - lastEventCheckRef.current >= 2) {
      lastEventCheckRef.current = elapsedMinutes;

      // 20% chance of event
      if (Math.random() < 0.2) {
        triggerRandomEvent();
      }
    }
  }, [elapsedMinutes, isActive, onEventTriggered]);

  // Random event generation
  const triggerRandomEvent = useCallback(() => {
    if (!onEventTriggered) return;

    // Factory-specific events
    const eventPool: Record<string, FactoryEvent[]> = {
      textile_mill: [
        {
          id: 'thread_break_timed',
          type: 'timed',
          title: 'Thread Breakage!',
          description: 'Multiple threads have broken on your loom. The overseer is watching. Fix it quickly or face penalties!',
          icon: '⚠️',
          timeLimit: 8,
          choices: [
            {
              id: 'fix_fast',
              text: 'Try to fix it yourself quickly',
              effects: { output: 5, fatigue: 5, health: -3 }
            },
            {
              id: 'call_help',
              text: 'Call for the mechanic',
              effects: { output: -5, wages: -0.10 }
            }
          ]
        },
        {
          id: 'child_worker_help',
          type: 'choice',
          title: 'Child Worker Struggling',
          description: 'A young girl working nearby is falling behind. She looks exhausted and frightened. The overseer hasn\'t noticed yet.',
          icon: '👧',
          choices: [
            {
              id: 'help_child',
              text: 'Help her with her work',
              effects: { output: -8, fatigue: 8, coworkerRelation: 30 }
            },
            {
              id: 'ignore',
              text: 'Focus on your own work',
              effects: { output: 5, coworkerRelation: -15 }
            },
            {
              id: 'report',
              text: 'Tell the overseer she needs rest',
              effects: { wages: -0.15, coworkerRelation: 20 }
            }
          ]
        }
      ],
      steel_mill: [
        {
          id: 'furnace_emergency',
          type: 'button_mash',
          title: 'FURNACE EMERGENCY!',
          description: 'The blast furnace temperature is spiking dangerously! Pump the water valve repeatedly to cool it down before it explodes!',
          icon: '🔥',
          buttonMashTarget: 20
        },
        {
          id: 'injury_choice',
          type: 'choice',
          title: 'Worker Injured',
          description: 'A coworker has been burned by molten metal. He\'s screaming in pain. The foreman is on the other side of the mill.',
          icon: '🩹',
          choices: [
            {
              id: 'help_injured',
              text: 'Stop work and help him immediately',
              effects: { output: -15, fatigue: 5, coworkerRelation: 40, wages: -0.20 }
            },
            {
              id: 'call_foreman',
              text: 'Run to get the foreman',
              effects: { output: -8, fatigue: 10 }
            },
            {
              id: 'keep_working',
              text: 'Let someone else handle it',
              effects: { output: 8, coworkerRelation: -30 }
            }
          ]
        }
      ],
      sugar_plantation: [
        {
          id: 'heat_exhaustion',
          type: 'timed',
          title: 'Heat Exhaustion',
          description: 'The sun is brutal. You\'re feeling dizzy and nauseous. The overseer is approaching.',
          icon: '☀️',
          timeLimit: 6,
          choices: [
            {
              id: 'rest',
              text: 'Ask for water and rest',
              effects: { output: -10, fatigue: -15, wages: -0.10 }
            },
            {
              id: 'push_through',
              text: 'Keep working through it',
              effects: { output: 5, health: -12, fatigue: 10 }
            }
          ]
        }
      ]
    };

    const events = eventPool[factoryType.id] || [];
    if (events.length > 0) {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      onEventTriggered(randomEvent);
    }
  }, [factoryType.id, onEventTriggered]);

  // Handle event choice
  const handleEventChoice = useCallback((choiceId: string) => {
    // Apply effects based on choice
    // This is a placeholder - effects would be applied based on the choice made
    setEventLog(prev => [...prev, {
      type: 'info',
      message: `Event resolved: ${choiceId}`
    }]);
  }, []);

  // Calculate final wages
  const calculateWages = useCallback(() => {
    if (!contract) return 0;

    let finalWages = wagesEarned;

    // Quota bonus/penalty
    const quotaPercent = outputProgress / contract.quotaRequired;
    if (quotaPercent >= 1) {
      finalWages *= contract.bonusRate;
    } else if (quotaPercent < 0.8) {
      finalWages *= contract.penaltyRate;
    }

    return Math.max(0, finalWages);
  }, [contract, wagesEarned, outputProgress]);

  // Check for shift completion
  const shiftComplete = useMemo(() => {
    return contract ? elapsedMinutes >= (contract.shiftLength * 60) : false;
  }, [contract, elapsedMinutes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (taskIntervalRef.current) clearInterval(taskIntervalRef.current);
      if (shiftIntervalRef.current) clearInterval(shiftIntervalRef.current);
    };
  }, []);

  // Apply player state changes
  useEffect(() => {
    if (onPlayerStateChange) {
      onPlayerStateChange({
        health: playerHealth,
        fatigue: playerFatigue
      });
    }
  }, [playerHealth, playerFatigue, onPlayerStateChange]);

  return {
    // State
    isActive,
    elapsedMinutes,
    currentTime,
    playerHealth,
    playerFatigue,
    outputProgress,
    wagesEarned,
    activeTask,
    availableTasks,
    eventLog,
    taskHistory,
    shiftComplete,

    // Actions
    startShift,
    startTask,
    performTimedAction,
    handleEventChoice,
    calculateWages
  };
}
