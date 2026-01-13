import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useUI } from '../contexts/UIContext';
import { useAtmosphereState } from '../hooks/useAtmosphereState';
import Minimap from './Minimap';
import type { MapData } from '../types';
import type { StructureCard, JourneyCard, HistoryLensCard } from '../types/historyLens';
import { generateHistoryLensResponse } from '../services/historyLensService';
import { applyHistoryLensActions } from '../services/historyLensActionRouter';
import { isMobileDevice } from '../utils/deviceUtils';
import { eventBus } from '../services/eventBus';
import HistoryLensStructureCard from './HistoryLensStructureCard';
import HistoryLensJourneyCard from './HistoryLensJourneyCard';

// Weather badge animation styles
const weatherAnimationStyles = `
@keyframes weather-mist {
  0%, 100% { opacity: 0.7; filter: blur(0.5px); }
  50% { opacity: 1; filter: blur(1px); }
}
@keyframes weather-fog {
  0%, 100% { opacity: 0.6; filter: blur(0.8px); transform: translateX(0); }
  33% { opacity: 0.9; filter: blur(1.2px); transform: translateX(1px); }
  66% { opacity: 0.7; filter: blur(0.6px); transform: translateX(-1px); }
}
@keyframes weather-rain {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(1px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(1px); }
}
@keyframes weather-storm {
  0%, 90%, 100% { opacity: 1; text-shadow: none; }
  92%, 96% { opacity: 1; text-shadow: 0 0 8px currentColor, 0 0 12px currentColor; }
}
@keyframes weather-snow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(1px) rotate(1deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(1px) rotate(-1deg); }
}
@keyframes weather-blizzard {
  0%, 100% { transform: translateX(0) translateY(0); filter: blur(0); }
  25% { transform: translateX(2px) translateY(1px); filter: blur(0.3px); }
  50% { transform: translateX(-1px) translateY(0); filter: blur(0); }
  75% { transform: translateX(1px) translateY(1px); filter: blur(0.3px); }
}
@keyframes weather-frost {
  0%, 100% { text-shadow: 0 0 2px #a5f3fc; opacity: 0.9; }
  50% { text-shadow: 0 0 6px #a5f3fc, 0 0 10px #67e8f9; opacity: 1; }
}
@keyframes weather-cold {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-1px); }
  20% { transform: translateX(1px); }
  30% { transform: translateX(-1px); }
  40% { transform: translateX(1px); }
  50%, 100% { transform: translateX(0); }
}
@keyframes weather-heat {
  0%, 100% { transform: translateY(0) scaleY(1); }
  25% { transform: translateY(-0.5px) scaleY(1.02); }
  50% { transform: translateY(0) scaleY(0.98); }
  75% { transform: translateY(0.5px) scaleY(1.02); }
}
@keyframes weather-hot {
  0%, 100% { text-shadow: 0 0 4px #fbbf24; }
  50% { text-shadow: 0 0 8px #f97316, 0 0 12px #fbbf24; }
}
@keyframes weather-humid {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.03); opacity: 1; }
}
@keyframes weather-windy {
  0%, 100% { transform: translateX(0) skewX(0deg); }
  25% { transform: translateX(2px) skewX(2deg); }
  75% { transform: translateX(-1px) skewX(-1deg); }
}
@keyframes weather-clear {
  0%, 100% { text-shadow: 0 0 3px #fde68a; opacity: 0.9; }
  50% { text-shadow: 0 0 8px #fde68a, 0 0 12px #fcd34d; opacity: 1; }
}
@keyframes weather-rainbow {
  0% { color: #ef4444; text-shadow: 0 0 4px #ef4444; }
  16% { color: #f97316; text-shadow: 0 0 4px #f97316; }
  33% { color: #eab308; text-shadow: 0 0 4px #eab308; }
  50% { color: #22c55e; text-shadow: 0 0 4px #22c55e; }
  66% { color: #3b82f6; text-shadow: 0 0 4px #3b82f6; }
  83% { color: #8b5cf6; text-shadow: 0 0 4px #8b5cf6; }
  100% { color: #ef4444; text-shadow: 0 0 4px #ef4444; }
}
@keyframes weather-drizzle {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; transform: translateY(0.5px); }
}
@keyframes weather-sleet {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(1px) translateX(0.5px); }
  50% { transform: translateY(0) translateX(-0.5px); }
  75% { transform: translateY(1px) translateX(0.5px); }
}
`;

const HistoryLensPanel: React.FC = () => {
  const { gameDate, formattedTime, gameTimeHours, setGameTimeHours, setGameDate, currentTimeOfDay, currentZone, currentRegion, season, homeAnchor } = useGame();
  const { mapData, currentMapClimate, npcs, animals, setNpcs, localArea } = useMap();
  const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY, currentVessel, playerMode } = usePlayer();
  const { historyLensMessages, setHistoryLensMessages, appendHistoryLensMessage, setShowDeathModal, handleEncounter } = useUI();
  const { currentWeather } = useAtmosphereState();

  const [inputValue, setInputValue] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showMapOverlay, setShowMapOverlay] = useState(false); // Mobile map overlay
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [conversationEndTrigger, setConversationEndTrigger] = useState(0); // Trigger for conversation end processing
  const [showTransparency, setShowTransparency] = useState(false);
  const [transparencyEntries, setTransparencyEntries] = useState<Array<{
    id: string;
    prompt: string;
    output: string;
    model: string;
    timestamp: number;
  }>>([]);

  // Weather indicator state
  const [weatherBadge, setWeatherBadge] = useState<{ label: string; color: string; animation: string } | null>(null);
  const [weatherVisible, setWeatherVisible] = useState(false);
  const previousWeatherRef = useRef<string | null>(null);
  const weatherTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inject weather animation styles once
  useEffect(() => {
    const styleId = 'weather-badge-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = weatherAnimationStyles;
      document.head.appendChild(style);
    }
  }, []);

  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

  // Track pending interrupted journey for continuation card after encounter ends
  const pendingJourneyRef = useRef<{
    destination: { x: number; y: number; label: string; kind: string };
    interruptedBy: 'npc' | 'animal';
    entityName?: string;
  } | null>(null);

  // Track last position when LLM was called - used to detect significant movement
  const lastLLMPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Track pending animal encounter - when player navigates to an animal
  const pendingAnimalEncounterRef = useRef<{
    animalId: string;
    huntMode: boolean;
  } | null>(null);

  // Track pending NPC encounter - when player navigates to an NPC to talk
  const pendingNpcEncounterRef = useRef<{
    npcId: string;
    npcName: string;
  } | null>(null);

  // Track pending conversation ending for LLM narrative continuation
  const pendingConversationEndRef = useRef<{
    npcName: string;
    npcRole: string;
    summary: string;
    sentiment: string;
    topicsDiscussed: string[];
  } | null>(null);

  const highlightTokens = useMemo(() => {
    const tokens = new Map<string, 'player' | 'npc' | 'location'>();
    const normalize = (value: string) => value.toLowerCase().replace(/[\.,;:!?]/g, '').trim();
    const addLocationToken = (label?: string | null) => {
      if (!label) return;
      const normalized = normalize(label);
      if (normalized.length > 1) {
        tokens.set(normalized, 'location');
      }
      const stripped = normalized.replace(/^(old|ruined|ancient|abandoned|derelict|broken|forgotten|lost|upper|lower|east|west|north|south)\s+/i, '');
      if (stripped && stripped !== normalized) {
        tokens.set(stripped, 'location');
      }
    };
    const playerName = playerCharacter?.name?.trim();
    if (playerName) {
      tokens.set(normalize(playerName), 'player');
    }

    npcs.forEach(npc => {
      const name = npc.name?.trim();
      if (name) {
        tokens.set(normalize(name), 'npc');
      }
    });

    [currentZone, currentRegion, mapData?.localArea, mapData?.majorCity?.name].forEach((label) => {
      addLocationToken(label ? String(label) : null);
    });

    const playerX = controlledIconX ?? null;
    const playerY = controlledIconY ?? null;
    const structureRadius = 8;
    const structures = mapData?.terrainStructures || [];
    if (playerX !== null && playerY !== null && structures.length) {
      structures
        .filter(structure => Math.hypot(structure.location[0] - playerX, structure.location[1] - playerY) <= structureRadius)
        .slice(0, 12)
        .forEach(structure => {
          addLocationToken(structure.name || structure.structureType);
          if (structure.structureType) {
            addLocationToken(structure.structureType.replace(/_/g, ' '));
          }
        });
    }

    const marketplaces = mapData?.marketplaces || [];
    if (playerX !== null && playerY !== null && marketplaces.length) {
      marketplaces
        .filter(market => Math.hypot(market.x - playerX, market.y - playerY) <= structureRadius)
        .slice(0, 8)
        .forEach(market => addLocationToken(market.name));
    }

    return tokens;
  }, [playerCharacter?.name, npcs, currentZone, currentRegion, mapData?.localArea, mapData?.majorCity?.name, mapData?.terrainStructures, mapData?.marketplaces, controlledIconX, controlledIconY]);

  const renderHighlightedText = useCallback(
    (text: string) => {
      if (!text) return text;
      if (!highlightTokens.size) return text;

      const normalizeToken = (value: string) => value.toLowerCase().replace(/[\.,;:!?]/g, '').trim();
      const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const names = Array.from(highlightTokens.keys()).filter(name => name.length > 1);
      if (!names.length) return text;

      const regex = new RegExp(`(${names.map(escapeRegExp).join('|')})`, 'gi');
      return text.split(regex).map((segment, index) => {
        const key = normalizeToken(segment);
        const type = highlightTokens.get(key);
        if (!type) return segment;
        return (
          <span
            key={`${segment}-${index}`}
            className={`hl-name hl-name--${type}`}
          >
            {segment}
          </span>
        );
      });
    },
    [highlightTokens]
  );

  const stripMarkdown = useCallback((value: string) => {
    if (!value) return value;
    return value
      .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
  }, []);

  const renderMessageText = useCallback(
    (text: string) => {
      if (!text) return text;
      const cleaned = stripMarkdown(text);
      const parts = cleaned.split(/(\"[^\"]+\"|“[^”]+”)/g);
      return parts.map((part, index) => {
        const isDialogue = /^\"/.test(part) || /^“/.test(part);
        if (isDialogue) {
          return (
            <span key={`dlg-${index}`} className="hl-dialogue">
              {renderHighlightedText(part)}
            </span>
          );
        }
        return <span key={`txt-${index}`}>{renderHighlightedText(part)}</span>;
      });
    },
    [renderHighlightedText, stripMarkdown]
  );

  const isMovementIntent = useCallback((input: string) => {
    const normalized = input.toLowerCase().trim();
    if (!normalized) return false;
    const directionMatch = /\b(north|south|east|west|northeast|northwest|southeast|southwest|upstream|downstream)\b/.test(normalized);
    const verbMatch = /\b(go|move|walk|travel|head|sail|ride|approach|enter|leave|return|follow|run|climb|cross)\b/.test(normalized);
    const homeMatch = /\b(home|house|dwelling|quarters|residence)\b/.test(normalized);
    return directionMatch || verbMatch || homeMatch;
  }, []);

  const isSeekNpcIntent = useCallback((input: string) => {
    const normalized = input.toLowerCase().trim();
    if (!normalized) return false;
    const talkMatch = /\b(talk|speak|ask|find|meet|approach|call on|seek)\b/.test(normalized);
    const personMatch = /\b(person|someone|npc|fisherman|guard|merchant|trader|woman|man|villager|soldier|priest|monk|elder|stranger)\b/.test(normalized);
    return talkMatch && personMatch;
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [historyLensMessages]);

  // Weather change detection - shows badge when weather changes, fades out after 30s
  useEffect(() => {
    if (!currentWeather) return;

    // Build a weather signature to detect meaningful changes
    const getWeatherSignature = () => {
      const parts: string[] = [];

      // Condition (cold/hot/humid)
      if (currentWeather.condition) parts.push(currentWeather.condition);

      // Precipitation
      if (currentWeather.precipitation !== 'none') {
        const intensity = currentWeather.intensity < 0.3 ? 'light' :
                          currentWeather.intensity > 0.7 ? 'heavy' : '';
        parts.push(`${intensity} ${currentWeather.precipitation}`.trim());
      }

      // Special conditions
      if (currentWeather.special) parts.push(currentWeather.special);

      // High wind
      if (currentWeather.windSpeed > 30) parts.push('windy');

      return parts.join('|') || 'clear';
    };

    const signature = getWeatherSignature();

    // Check if weather has meaningfully changed
    if (signature !== previousWeatherRef.current && previousWeatherRef.current !== null) {
      // Determine primary weather condition for display
      let label = '';
      let color = '';
      let animation = '';

      // Priority: special > precipitation > condition > wind
      // Each condition gets a unique animation
      if (currentWeather.special === 'fog') {
        label = 'FOG'; color = '#94a3b8'; animation = 'weather-fog 4s ease-in-out infinite';
      } else if (currentWeather.special === 'mist') {
        label = 'MIST'; color = '#cbd5e1'; animation = 'weather-mist 3s ease-in-out infinite';
      } else if (currentWeather.special === 'frost') {
        label = 'FROST'; color = '#a5f3fc'; animation = 'weather-frost 2s ease-in-out infinite';
      } else if (currentWeather.special === 'heatwave') {
        label = 'HEAT'; color = '#f97316'; animation = 'weather-heat 1.5s ease-in-out infinite';
      } else if (currentWeather.special === 'rainbow') {
        label = 'RAINBOW'; color = '#c084fc'; animation = 'weather-rainbow 4s linear infinite';
      } else if (currentWeather.precipitation === 'rain') {
        if (currentWeather.intensity > 0.6) {
          label = 'STORM'; color = '#3b82f6'; animation = 'weather-storm 2s ease-in-out infinite';
        } else {
          label = 'RAIN'; color = '#60a5fa'; animation = 'weather-rain 0.8s ease-in-out infinite';
        }
      } else if (currentWeather.precipitation === 'snow') {
        if (currentWeather.intensity > 0.6) {
          label = 'BLIZZARD'; color = '#e2e8f0'; animation = 'weather-blizzard 0.6s ease-in-out infinite';
        } else {
          label = 'SNOW'; color = '#e2e8f0'; animation = 'weather-snow 2s ease-in-out infinite';
        }
      } else if (currentWeather.precipitation === 'drizzle') {
        label = 'DRIZZLE'; color = '#93c5fd'; animation = 'weather-drizzle 1.5s ease-in-out infinite';
      } else if (currentWeather.precipitation === 'sleet') {
        label = 'SLEET'; color = '#a5b4fc'; animation = 'weather-sleet 0.7s ease-in-out infinite';
      } else if (currentWeather.condition === 'cold') {
        label = 'COLD'; color = '#7dd3fc'; animation = 'weather-cold 3s ease-in-out infinite';
      } else if (currentWeather.condition === 'hot') {
        label = 'HOT'; color = '#fbbf24'; animation = 'weather-hot 2s ease-in-out infinite';
      } else if (currentWeather.condition === 'humid') {
        label = 'HUMID'; color = '#6ee7b7'; animation = 'weather-humid 3s ease-in-out infinite';
      } else if (currentWeather.windSpeed > 30) {
        label = 'WINDY'; color = '#d4d4d8'; animation = 'weather-windy 1.2s ease-in-out infinite';
      } else if (currentWeather.cloudCover < 0.2) {
        label = 'CLEAR'; color = '#fde68a'; animation = 'weather-clear 3s ease-in-out infinite';
      }

      if (label) {
        // Clear any existing timeout
        if (weatherTimeoutRef.current) {
          clearTimeout(weatherTimeoutRef.current);
        }

        // Show the badge
        setWeatherBadge({ label, color, animation });
        setWeatherVisible(true);

        // Fade out after 30 seconds
        weatherTimeoutRef.current = setTimeout(() => {
          setWeatherVisible(false);
        }, 30000);
      }
    }

    previousWeatherRef.current = signature;

    return () => {
      if (weatherTimeoutRef.current) {
        clearTimeout(weatherTimeoutRef.current);
      }
    };
  }, [currentWeather]);

  // Keyboard shortcuts for suggested actions (1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in the textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      const key = e.key;
      if (['1', '2', '3', '4'].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (suggestedActions[index]) {
          e.preventDefault();
          setInputValue(suggestedActions[index]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestedActions]);

  // Listen for encounter_ended events to auto-generate narrative continuation
  useEffect(() => {
    const handleEncounterEnded = (data: {
      npcId: string;
      npcName: string;
      npcRole: string;
      summary: string;
      sentiment: string;
      exchangeCount: number;
      topicsDiscussed: string[];
    }) => {
      // Add brief system message about conversation ending
      const sentimentAdverb = data.sentiment === 'positive' ? ' warmly' :
                              data.sentiment === 'negative' ? ' tensely' : '';
      const roleText = data.npcRole?.trim() ? `, a ${data.npcRole.toLowerCase()}` : '';

      appendHistoryLensMessage({
        sender: 'system',
        text: `Your conversation with ${data.npcName}${roleText} comes to an end${sentimentAdverb}.`
      });

      // Store conversation data for LLM narrative continuation
      pendingConversationEndRef.current = {
        npcName: data.npcName,
        npcRole: data.npcRole,
        summary: data.summary,
        sentiment: data.sentiment,
        topicsDiscussed: data.topicsDiscussed
      };
      // Trigger the processing effect
      setConversationEndTrigger(prev => prev + 1);
    };

    eventBus.on('encounter_ended', handleEncounterEnded);
    return () => eventBus.off('encounter_ended', handleEncounterEnded);
  }, [appendHistoryLensMessage]);

  // Process pending conversation end - trigger LLM for narrative continuation
  useEffect(() => {
    if (!pendingConversationEndRef.current) return;
    if (!playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
    if (isLoading) return; // Don't trigger if already loading

    const conversationData = pendingConversationEndRef.current;
    pendingConversationEndRef.current = null; // Clear immediately

    // Build a prompt that asks for narrative continuation based on the conversation
    const topicsText = conversationData.topicsDiscussed.length > 0
      ? ` Topics discussed: ${conversationData.topicsDiscussed.slice(0, 5).join(', ')}.`
      : '';

    const continuationPrompt = `[CONVERSATION ENDED] I just finished talking to ${conversationData.npcName}${conversationData.npcRole ? `, a ${conversationData.npcRole}` : ''}. Here's what happened: ${conversationData.summary}${topicsText} The conversation ended on a ${conversationData.sentiment} note. What happens next? What do I notice or think about after this exchange? Keep it brief (2-3 sentences) and move the narrative forward.`;

    // Trigger LLM with the continuation prompt
    const triggerContinuationLLM = async () => {
      setIsLoading(true);
      try {
        const response = await generateHistoryLensResponse(
          continuationPrompt,
          playerCharacter,
          mapData,
          gameDate,
          gameTimeHours,
          currentZone || '',
          currentRegion || '',
          historyLensMessages.slice(-6), // Recent context
          { x: controlledIconX, y: controlledIconY },
          npcs,
          animals,
          currentWeather || undefined,
          localArea || undefined
        );

        if (response.narrative) {
          appendHistoryLensMessage({
            sender: 'narrator',
            text: response.narrative
          });
        }

        // Handle any suggested actions
        if (response.suggestedActions?.length) {
          setSuggestedActions(response.suggestedActions);
        }
      } catch (error) {
        console.error('[HistoryLens] Failed to generate conversation continuation:', error);
        // Fall back to just the summary
        appendHistoryLensMessage({
          sender: 'narrator',
          text: conversationData.summary
        });
      } finally {
        setIsLoading(false);
      }
    };

    triggerContinuationLLM();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationEndTrigger]);

  // Listen for journey interruption events (from NPC/animal encounters during navigation)
  useEffect(() => {
    const handleJourneyInterrupted = (data: {
      destination: { x: number; y: number; label: string; kind: string };
      interruptedBy: 'npc' | 'animal';
      entityName?: string;
    }) => {
      pendingJourneyRef.current = data;
    };

    eventBus.on('historylens:journey_interrupted', handleJourneyInterrupted);
    return () => eventBus.off('historylens:journey_interrupted', handleJourneyInterrupted);
  }, []);

  // Track pending arrival for LLM description
  const pendingArrivalRef = useRef<{
    target: { x: number; y: number; label: string; kind: string };
  } | null>(null);

  // Listen for destination reached events - trigger full LLM arrival description OR animal encounter
  useEffect(() => {
    const handleDestinationReached = (data: {
      target: { x: number; y: number; label: string; kind: string };
      playerX: number;
      playerY: number;
    }) => {
      // Check if this is an animal encounter
      if ((data.target.kind === 'animal' || data.target.kind === 'hunt_animal') && pendingAnimalEncounterRef.current) {
        const { animalId, huntMode } = pendingAnimalEncounterRef.current;
        pendingAnimalEncounterRef.current = null; // Clear immediately

        // Find the animal in the current animals array
        const animal = animals.find(a => a.id === animalId);
        if (animal) {
          // Check if animal is still close enough (within 3 tiles - it may have moved)
          const distance = Math.hypot(animal.x - data.playerX, animal.y - data.playerY);
          if (distance <= 3) {
            // Trigger the encounter
            console.log(`[HistoryLens] Triggering ${huntMode ? 'hunt' : 'approach'} encounter with ${animal.speciesName || animal.baseId}`);
            appendHistoryLensMessage({
              sender: 'system',
              text: huntMode
                ? `You close in on the ${animal.speciesName || animal.baseId.toLowerCase()}, weapon ready.`
                : `You approach the ${animal.speciesName || animal.baseId.toLowerCase()}.`
            });
            handleEncounter(animal);
            return; // Don't trigger LLM - the encounter modal will handle the interaction
          } else {
            // Animal moved away
            appendHistoryLensMessage({
              sender: 'narrator',
              text: `The ${animal.speciesName || animal.baseId.toLowerCase()} has moved off. You can see it in the distance, but it sensed your approach.`
            });
            return;
          }
        } else {
          // Animal is gone (fled or despawned)
          appendHistoryLensMessage({
            sender: 'narrator',
            text: `The animal has vanished - perhaps it sensed danger and fled into the wilderness.`
          });
          return;
        }
      }

      // Check if this is an NPC encounter
      if (data.target.kind === 'npc' && pendingNpcEncounterRef.current) {
        const { npcId, npcName } = pendingNpcEncounterRef.current;
        pendingNpcEncounterRef.current = null; // Clear immediately

        // Find the NPC in the current npcs array
        const npc = npcs.find(n => n.id === npcId);
        if (npc) {
          // Check if NPC is still close enough (within 2 tiles)
          const distance = Math.hypot(npc.x - data.playerX, npc.y - data.playerY);
          if (distance <= 2) {
            // Trigger the encounter
            console.log(`[HistoryLens] Triggering conversation with ${npc.name || npc.role}`);
            appendHistoryLensMessage({
              sender: 'system',
              text: `You approach ${npc.name || 'the ' + (npc.role || 'traveler')}.`
            });
            handleEncounter(npc);
            return; // Don't trigger LLM - the encounter modal will handle the conversation
          } else {
            // NPC moved away
            appendHistoryLensMessage({
              sender: 'narrator',
              text: `${npcName} seems to have moved on before you could reach them.`
            });
            return;
          }
        } else {
          // NPC is gone
          appendHistoryLensMessage({
            sender: 'narrator',
            text: `${npcName} is no longer here - perhaps they had somewhere to be.`
          });
          return;
        }
      }

      // Regular destination - store the arrival data and trigger LLM call
      pendingArrivalRef.current = { target: data.target };

      // Add a brief system message first
      appendHistoryLensMessage({
        sender: 'system',
        text: `You arrive at ${data.target.label}.`
      });

      // Auto-open modal for enterable structure types
      // Map destination kinds to modal structure types
      const ENTERABLE_KINDS: Record<string, string> = {
        'city': 'city',
        'settlement': 'city',
        'hamlet': 'city',
        'government': 'government',
        'government_district': 'government',
        'ruins': 'ruins',
        'ruin': 'ruins',
        'mine': 'mine',
        'mining_colony': 'mine',
        'quarry': 'quarry',
        'fishing_hut': 'fishing_hut',
        'market': 'market',
        'marketplace': 'market',
        'fortress': 'fortress',
        'palace': 'palace',
        'holy_site': 'holy_site',
      };

      const modalType = ENTERABLE_KINDS[data.target.kind];
      if (modalType) {
        // Find the structure at this location for the modal
        const structure = mapData?.terrainStructures?.find(
          s => Math.hypot(s.location[0] - data.playerX, s.location[1] - data.playerY) < 2
        );

        // Small delay to let the arrival message show first, then auto-open modal
        setTimeout(() => {
          eventBus.emit('historylens:enter_structure', {
            structureType: modalType,
            structureId: structure?.id || `${modalType}-${data.playerX}-${data.playerY}`,
            structureName: data.target.label,
            location: { x: data.playerX, y: data.playerY }
          });
        }, 300);
      }
    };

    eventBus.on('historylens:destination_reached', handleDestinationReached);
    return () => eventBus.off('historylens:destination_reached', handleDestinationReached);
  }, [appendHistoryLensMessage, animals, npcs, handleEncounter, mapData]);

  // Process pending arrival - trigger LLM for arrival description
  // We use a separate effect to avoid async issues in the event handler
  useEffect(() => {
    if (!pendingArrivalRef.current) return;
    if (!playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
    if (isLoading) return; // Don't trigger if already loading

    const arrivalData = pendingArrivalRef.current;
    pendingArrivalRef.current = null; // Clear immediately to prevent re-triggering

    // Build an arrival prompt that asks for a rich description
    const arrivalPrompt = `[ARRIVAL at ${arrivalData.target.label}] Describe what I see, hear, and experience as I arrive at this ${arrivalData.target.kind}. Who is here? What catches my attention? What opportunities or challenges present themselves?`;

    // Trigger LLM with the arrival prompt (don't append player message since this is auto-generated)
    const triggerArrivalLLM = async () => {
      setIsLoading(true);
      try {
        const response = await generateHistoryLensResponse(
          arrivalPrompt,
          {
            playerCharacter,
            mapData,
            gameDate,
            gameTimeHours,
            playerX: controlledIconX,
            playerY: controlledIconY,
            npcs,
            animals,
            terrainStructures: mapData.terrainStructures || [],
            marketplaces: mapData.marketplaces || [],
            playerMode,
            homeAnchor
          },
          historyLensMessages.map(({ sender, text }) => ({ sender, text })),
          { requestType: 'normal' }
        );

        appendHistoryLensMessage({ sender: 'narrator', text: response.narration });
        setSuggestedActions(response.suggestedActions || []);

        if (response.debugPrompt && response.rawResponse && response.model) {
          setTransparencyEntries(prev => [
            {
              id: `hl-arrival-${Date.now()}-${Math.random()}`,
              prompt: response.debugPrompt,
              output: response.rawResponse,
              model: response.model,
              timestamp: Date.now()
            },
            ...prev
          ].slice(0, 5));
        }
      } catch (error) {
        console.error('[HistoryLens] Arrival LLM error:', error);
        appendHistoryLensMessage({
          sender: 'narrator',
          text: `You take in the scene before you at the ${arrivalData.target.label}.`
        });
      } finally {
        setIsLoading(false);
      }
    };

    triggerArrivalLLM();
  }, [
    playerCharacter, mapData, controlledIconX, controlledIconY,
    gameDate, gameTimeHours, npcs, animals, playerMode, homeAnchor,
    historyLensMessages, appendHistoryLensMessage, isLoading
  ]);

  // After any encounter closes, check if there's a pending journey and show continuation card
  useEffect(() => {
    const handleEncounterClosed = () => {
      // Wait a short delay for the narrative beat to be added first
      setTimeout(() => {
        if (pendingJourneyRef.current) {
          const journeyData = pendingJourneyRef.current;
          pendingJourneyRef.current = null; // Clear it

          // Add a journey card message
          appendHistoryLensMessage({
            sender: 'narrator',
            text: '',
            card: {
              type: 'continue_journey',
              destination: journeyData.destination,
              interruptedBy: journeyData.interruptedBy,
              entityName: journeyData.entityName,
              resolved: false
            } as JourneyCard
          });
        }
      }, 100);
    };

    eventBus.on('encounter_ended', handleEncounterClosed);
    eventBus.on('encounter_closed', handleEncounterClosed); // Also listen for animal encounters which may use different event
    return () => {
      eventBus.off('encounter_ended', handleEncounterClosed);
      eventBus.off('encounter_closed', handleEncounterClosed);
    };
  }, [appendHistoryLensMessage]);

  type SendOptions = {
    appendPlayerMessage?: boolean;
    requestType?: 'normal' | 'song';
  };

  const sendHistoryLensPrompt = useCallback(async (rawInput: string, options?: SendOptions) => {
    const trimmed = rawInput.trim();
    if (!trimmed || isLoading || !playerCharacter || !mapData) return;
    if (controlledIconX === null || controlledIconY === null) return;

    setIsLoading(true);

    // Check if player has moved significantly since last LLM call
    const lastPos = lastLLMPositionRef.current;
    const hasMoved = lastPos && (
      Math.abs(controlledIconX - lastPos.x) > 1 ||
      Math.abs(controlledIconY - lastPos.y) > 1
    );

    // If moved, inject a location context update before the player's message
    if (hasMoved) {
      const currentTile = mapData.tiles[controlledIconY]?.[controlledIconX];
      const biomeLabel = currentTile?.biome?.toLowerCase().replace(/_/g, ' ') || 'unknown terrain';
      const areaLabel = localArea || mapData.localArea || 'the area';
      appendHistoryLensMessage({
        sender: 'system',
        text: `[You have moved to a new location: ${biomeLabel} in ${areaLabel}]`
      });
    }

    // Update last position ref
    lastLLMPositionRef.current = { x: controlledIconX, y: controlledIconY };

    const playerEntry = { sender: 'player' as const, text: trimmed };
    const historyForModel = [
      ...historyLensMessages.map(({ sender, text }) => ({ sender, text })),
      playerEntry
    ];
    if (options?.appendPlayerMessage ?? true) {
      appendHistoryLensMessage(playerEntry);
    }

    try {
      const response = await generateHistoryLensResponse(
        trimmed,
        {
          playerCharacter,
          mapData,
          gameDate,
          gameTimeHours,
          playerX: controlledIconX,
          playerY: controlledIconY,
          npcs,
          animals,
          terrainStructures: mapData.terrainStructures || [],
          marketplaces: mapData.marketplaces || [],
          playerMode,
          homeAnchor
        },
        historyForModel,
        { requestType: options?.requestType }
      );

      appendHistoryLensMessage({ sender: 'narrator', text: response.narration });
      setSuggestedActions(response.suggestedActions || []);
      if (response.debugPrompt && response.rawResponse && response.model) {
        setTransparencyEntries(prev => [
          {
            id: `hl-debug-${Date.now()}-${Math.random()}`,
            prompt: response.debugPrompt,
            output: response.rawResponse,
            model: response.model,
            timestamp: Date.now()
          },
          ...prev
        ].slice(0, 5));
      }

      const wantsMovement = isMovementIntent(trimmed);
      const wantsNpc = isSeekNpcIntent(trimmed);
      const rawActions = response.actions || [];
      const filteredActions = rawActions.filter(action => {
        if (action.type === 'move' || action.type === 'navigate_nearest' || action.type === 'navigate_edge' || action.type === 'navigate_home') {
          return wantsMovement;
        }
        if (action.type === 'seek_npc') {
          return wantsNpc;
        }
        return true;
      });

      if (rawActions.length !== filteredActions.length && !wantsMovement && !wantsNpc) {
        appendHistoryLensMessage({
          sender: 'system',
          text: 'Movement requires an explicit command.'
        });
      }

      const result = await applyHistoryLensActions(filteredActions, {
        playerCharacter,
        mapData,
        gameDate,
        gameTimeHours,
        playerX: controlledIconX,
        playerY: controlledIconY,
        hasVessel: Boolean(currentVessel),
        playerMode,
        npcs,
        animals,
        homeAnchor
      });

      if (result.moveRequest) {
        eventBus.emit('historylens:move', result.moveRequest);
      }
      if (result.navigateTarget) {
        eventBus.emit('historylens:navigate', result.navigateTarget);
      }
      // Store pending animal encounter for when we arrive
      if (result.animalTarget) {
        pendingAnimalEncounterRef.current = {
          animalId: result.animalTarget.animal.id,
          huntMode: result.animalTarget.huntMode
        };
        console.log(`[HistoryLens] Stored pending animal encounter: ${result.animalTarget.animal.speciesName || result.animalTarget.animal.baseId}, hunt=${result.animalTarget.huntMode}`);
      }
      // Store pending NPC encounter for when we arrive
      if (result.npcTarget) {
        pendingNpcEncounterRef.current = {
          npcId: result.npcTarget.npc.id,
          npcName: result.npcTarget.npc.name || 'traveler'
        };
        console.log(`[HistoryLens] Stored pending NPC encounter: ${result.npcTarget.npc.name || result.npcTarget.npc.role}`);
      }
      if (result.nextTime) {
        setGameTimeHours(result.nextTime.hours);
        setGameDate(result.nextTime.date);
      }
      if (result.nextInventory || result.playerUpdates) {
        setPlayerCharacter(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(result.playerUpdates || {}),
            inventory: result.nextInventory || prev.inventory
          };
        });
      }
      if (result.npcSpawnRequests?.length) {
        eventBus.emit('historylens:queue_npcs', result.npcSpawnRequests);
      }
      if (result.npcAdditions?.length) {
        console.log(`[HistoryLens] Adding ${result.npcAdditions.length} NPC(s) to game state:`,
          result.npcAdditions.map(npc => ({ id: npc.id, name: npc.name, role: npc.role, x: npc.x, y: npc.y }))
        );
        setNpcs(prev => [...prev, ...result.npcAdditions!]);
      }
      if (result.rejections.length) {
        appendHistoryLensMessage({ sender: 'narrator', text: result.rejections.join(' ') });
      }
      if (result.structureCard) {
        // Add a message with the interactive structure card
        appendHistoryLensMessage({
          sender: 'narrator',
          text: '',
          card: result.structureCard
        });
      }
      if (result.triggerGameOver) {
        appendHistoryLensMessage({ sender: 'narrator', text: 'Your life ends here.' });
        setShowDeathModal(true);
      }
    } catch (error) {
      console.warn('[HistoryLens] Error:', error);
      appendHistoryLensMessage({ sender: 'narrator', text: 'The response is unclear right now. Try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    playerCharacter,
    mapData,
    controlledIconX,
    controlledIconY,
    gameDate,
    gameTimeHours,
    setGameTimeHours,
    setGameDate,
    setPlayerCharacter,
    currentVessel,
    playerMode,
    npcs,
    setNpcs,
    historyLensMessages,
    appendHistoryLensMessage,
    isMovementIntent,
    isSeekNpcIntent,
    animals,
    homeAnchor,
    localArea
  ]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    sendHistoryLensPrompt(trimmed);
    setInputValue('');
  }, [inputValue, sendHistoryLensPrompt]);


  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const mapPeek = useMemo(() => {
    if (!mapData || controlledIconX === null || controlledIconY === null) return null;

    const radius = 12;
    const mapWidth = mapData.tiles?.[0]?.length ?? 0;
    const mapHeight = mapData.tiles?.length ?? 0;
    if (!mapWidth || !mapHeight) return null;

    const minX = Math.max(0, controlledIconX - radius);
    const maxX = Math.min(mapWidth - 1, controlledIconX + radius);
    const minY = Math.max(0, controlledIconY - radius);
    const maxY = Math.min(mapHeight - 1, controlledIconY + radius);

    const tiles = [];
    for (let y = minY; y <= maxY; y += 1) {
      tiles.push(mapData.tiles[y].slice(minX, maxX + 1));
    }

    const localMapData: MapData = {
      ...mapData,
      tiles,
      width: tiles[0]?.length || 0,
      height: tiles.length
    };

    return {
      mapData: localMapData,
      playerX: controlledIconX - minX,
      playerY: controlledIconY - minY
    };
  }, [mapData, controlledIconX, controlledIconY]);

  // Helper to format zone names nicely
  const formatZoneName = (zone: string | undefined) => {
    if (!zone) return 'Unknown';
    return zone
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace('Mena', 'MENA')
      .replace('Pre Columbian', 'Pre-Columbian');
  };

  const getSeasonClassName = (seasonValue: string) => {
    switch (seasonValue.toLowerCase()) {
      case 'spring':
        return 'hl-season hl-season--spring';
      case 'summer':
        return 'hl-season hl-season--summer';
      case 'fall':
      case 'autumn':
        return 'hl-season hl-season--fall';
      case 'winter':
        return 'hl-season hl-season--winter';
      default:
        return 'hl-season hl-season--unknown';
    }
  };

  const getZoneClassName = (zoneValue?: string) => {
    const normalized = zoneValue?.toLowerCase() || '';
    if (normalized.includes('europe')) return 'hl-zone hl-zone--europe';
    if (normalized.includes('asia')) return 'hl-zone hl-zone--asia';
    if (normalized.includes('africa')) return 'hl-zone hl-zone--africa';
    if (normalized.includes('oceania')) return 'hl-zone hl-zone--oceania';
    if (normalized.includes('north america')) return 'hl-zone hl-zone--north-america';
    if (normalized.includes('south america')) return 'hl-zone hl-zone--south-america';
    if (normalized.includes('central america')) return 'hl-zone hl-zone--central-america';
    if (normalized.includes('mena')) return 'hl-zone hl-zone--mena';
    return 'hl-zone hl-zone--unknown';
  };

  // Format full date with BCE/CE split for styling
  const formattedDate = useMemo(() => {
    if (!gameDate) return { dateText: 'Unknown date', era: '' };
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[gameDate.month - 1] || 'Unknown';
    const day = gameDate.day;
    const yearNum = gameDate.year < 0 ? Math.abs(gameDate.year) : gameDate.year;
    const era = gameDate.year < 0 ? 'bce' : 'ce';
    return { dateText: `${month} ${day}, ${yearNum}`, era };
  }, [gameDate]);

  const primaryLocation = localArea || mapData?.localArea || 'Unknown Area';
  const secondaryLocation = currentRegion && currentRegion !== primaryLocation ? `, ${currentRegion}` : '';
  const seasonLabel = mapData?.season || season || 'unknown';
  const climateLabel = mapData?.climate || currentMapClimate || 'unknown';

  useEffect(() => {
    const handleSingEvent = () => {
      appendHistoryLensMessage({
        sender: 'system',
        text: 'You suddenly feel compelled to sing about your situation.'
      });
      const prompt = `Sing a short, creative, historically grounded song about the current situation at ${primaryLocation}. Mention the climate (${climateLabel}) and the season (${seasonLabel}).`;
      sendHistoryLensPrompt(prompt, { appendPlayerMessage: false, requestType: 'song' });
    };
    eventBus.on('historylens:sing', handleSingEvent);
    return () => {
      eventBus.off('historylens:sing', handleSingEvent);
    };
  }, [primaryLocation, climateLabel, seasonLabel, sendHistoryLensPrompt, appendHistoryLensMessage]);
  const terrainLabel = mapData?.tiles?.[controlledIconY ?? 0]?.[controlledIconX ?? 0]?.biome || 'unknown terrain';
  const playerHealth = playerCharacter ? `${playerCharacter.health}/${playerCharacter.maxHealth}` : '—';
  const playerFatigue = playerCharacter ? `${playerCharacter.fatigue}/${playerCharacter.maxFatigue}` : '—';

  return (
    <div
      className={`history-lens-panel relative flex flex-col w-full theme-surface overflow-hidden ${isMobile ? 'h-full' : 'panel-frame h-full lg:h-[calc(100%-12px)]'}`}
      style={{
        fontFamily: "'Iowan Old Style', 'Palatino', 'Garamond', 'Times New Roman', serif",
        backgroundImage:
          'radial-gradient(circle at 15% 10%, rgba(16, 185, 129, 0.12), transparent 25%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.22), transparent 40%)'
      }}
    >
      {/* Header - Responsive design using flexbox */}
      <div
        className="px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 backdrop-blur-md border-b border-white/15"
        style={{
          fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif",
          background: 'linear-gradient(135deg, rgba(9, 13, 22, 0.88) 0%, rgba(9, 13, 22, 0.82) 100%)',
          backgroundImage: 'radial-gradient(circle at 15% 30%, rgba(16, 50, 129, 0.03), transparent 50%), radial-gradient(circle at 85% 40%, rgba(59, 130, 246, 0.1), transparent 55%), linear-gradient(135deg, rgba(9, 13, 22, 0.79) 0%, rgba(9, 13, 22, 0.8) 100%)',
          paddingTop: isMobile ? 'calc(8px + var(--sat, 0px))' : undefined,
        }}
      >
        {/* Row 1: [📜 HISTORY LENS] --- Time --- [Zone] [Season] */}
        <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5">
          {/* Left: Transparency/Map button + label */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => isMobile ? setShowMapOverlay(true) : setShowTransparency(true)}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-900/30 border border-white/10 shadow-sm flex items-center justify-center text-sm shadow-inner hover:border-white/30 transition-colors active:bg-slate-700/80"
              aria-label={isMobile ? "Show map" : "Open transparency log"}
            >
              {isMobile ? (
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              ) : '📜'}
            </button>
            <span className="hidden lg:inline text-[9px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
              History Lens
            </span>
          </div>

          {/* Center: Time with time-of-day below */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] sm:text-[18px] lg:text-[20px] font-light tracking-tight text-white/90">
                {formattedTime}
              </span>
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-medium text-white/40 uppercase">
                {gameTimeHours >= 12 ? 'pm' : 'am'}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-medium text-white/40 uppercase tracking-wider">
              {currentTimeOfDay?.toLowerCase() || ''}
            </span>
          </div>

          {/* Right: Zone + Season pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="hidden sm:inline px-1.5 lg:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] lg:text-[11px] font-semibold bg-slate-800/50 border border-white/8">
              <span className={getZoneClassName(currentZone)}>{formatZoneName(currentZone)}</span>
            </span>
            <span className="px-1.5 lg:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] lg:text-[11px] font-semibold bg-slate-800/50 border border-white/8">
              <span className={getSeasonClassName(seasonLabel)}>{seasonLabel.toLowerCase()}</span>
            </span>
          </div>
        </div>

        {/* Row 2: [Location, Region] --- [Weather] --- [Date] */}
        <div className="flex items-center gap-3 sm:gap-4 pb-1.5 sm:pb-2 lg:pb-2.5">
          {/* Left: Location */}
          <p className="flex-1 text-[13px] sm:text-[14px] lg:text-[16px] leading-tight truncate min-w-0" style={{ color: 'var(--text-primary)' }}>
            <span className="font-bold">{primaryLocation}</span>
            {secondaryLocation && (
              <span className="font-medium text-[11px] sm:text-[12px] lg:text-[14px] hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>{secondaryLocation}</span>
            )}
          </p>

          {/* Center: Weather badge (when visible) */}
          {weatherBadge && weatherVisible && (
            <span
              className="flex-shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded"
              style={{
                color: weatherBadge.color,
                backgroundColor: `${weatherBadge.color}15`,
                border: `1px solid ${weatherBadge.color}30`,
                animation: weatherBadge.animation,
              }}
            >
              {weatherBadge.label}
            </span>
          )}

          {/* Right: Date */}
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-[13px] sm:text-[14px] lg:text-[15px] font-semibold text-white/80 tracking-tight">
              {formattedDate.dateText}
            </span>
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-medium text-white/50 uppercase">
              {formattedDate.era}
            </span>
          </div>
        </div>
      </div>

      {/* Context pills removed on mobile - they wasted 60px of precious vertical space */}

      <div className="relative flex-1 min-h-0">
        <div
          ref={logRef}
          className="h-full overflow-y-auto space-y-2.5 sm:space-y-4 lg:space-y-5 px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-7 text-[13px] sm:text-[15px] lg:text-[17px] leading-[1.55] sm:leading-[1.65] lg:leading-[1.75]"
        >
          {historyLensMessages.map(message => (
            <div
              key={message.id}
              className={`hl-message rounded-xl max-w-[95%] sm:max-w-[88%] lg:max-w-[82%] ${
                message.card ? 'px-0 py-0' : 'px-2.5 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4'
              } shadow-sm ${
                message.sender === 'player'
                  ? 'hl-message--player ml-auto bg-[var(--surface-card-bg)] text-text-primary border border-white/10'
                  : message.sender === 'narrator'
                  ? message.card
                    ? 'hl-message--narrator bg-transparent border-none'
                    : 'hl-message--narrator bg-slate-900/50 text-text-primary border border-white/10'
                  : 'hl-message--system bg-slate-900/20 text-text-secondary border border-white/10'
              }`}
            >
              {message.sender === 'system' && (
                <div className="text-[10px] uppercase tracking-[0.25em] text-text-muted mb-2">System</div>
              )}
              {message.card ? (
                message.card.type === 'continue_journey' ? (
                  <HistoryLensJourneyCard
                    card={message.card as JourneyCard}
                    onResolve={(continued) => {
                      // Mark the card as resolved in the message
                      setHistoryLensMessages(prev => prev.map(msg =>
                        msg.id === message.id && msg.card
                          ? { ...msg, card: { ...msg.card, resolved: true } }
                          : msg
                      ));
                    }}
                  />
                ) : (
                  <HistoryLensStructureCard
                    card={message.card as StructureCard}
                    onResolve={(entered) => {
                      // Mark the card as resolved in the message
                      setHistoryLensMessages(prev => prev.map(msg =>
                        msg.id === message.id && msg.card
                          ? { ...msg, card: { ...msg.card, resolved: true } }
                          : msg
                      ));
                    }}
                  />
                )
              ) : (
                <>
                  <div className={`hl-message__text ${message.style === 'scene' ? 'hl-message__text--scene' : ''}`}>
                    {renderMessageText(message.text)}
                  </div>
                  {message.meta && (
                    <div className="hl-message__meta">{message.meta}</div>
                  )}
                </>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 bg-slate-900/30 text-text-secondary border border-white/10 animate-pulse text-[12px] sm:text-[14px] lg:text-base">
              Listening to the past...
            </div>
          )}
        </div>

        {showMap && mapPeek && (
          <Minimap
            mapData={mapPeek.mapData}
            playerX={mapPeek.playerX}
            playerY={mapPeek.playerY}
            zoomLevel={1}
            panX={0}
            panY={0}
            containerWidth={0}
            containerHeight={0}
          />
        )}

        {/* Mobile Map Overlay - Centered modal with full minimap */}
        {isMobile && showMapOverlay && mapPeek && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowMapOverlay(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative z-10 bg-slate-900/95 rounded-2xl border border-white/20 p-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'calc(100vw - 32px)', maxWidth: '320px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                  {primaryLocation}
                </span>
                <button
                  onClick={() => setShowMapOverlay(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20"
                  aria-label="Close map"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Map */}
              <div className="relative rounded-lg overflow-hidden" style={{ height: '280px' }}>
                <Minimap
                  mapData={mapPeek.mapData}
                  playerX={mapPeek.playerX}
                  playerY={mapPeek.playerY}
                  zoomLevel={1}
                  panX={0}
                  panY={0}
                  containerWidth={0}
                  containerHeight={0}
                />
              </div>
              {/* Quick stats footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-white/50">
                  {formattedDate.dateText} {formattedDate.era.toUpperCase()}
                </span>
                <span className="text-[10px] text-white/50">
                  {seasonLabel} · {climateLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {suggestedActions.length > 0 && (
        <div
          className="px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2"
          style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
        >
          <span className="hidden sm:block text-[9px] sm:text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1.5 sm:mb-2">
            Suggested Actions
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {suggestedActions.slice(0, 4).map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                onClick={() => setInputValue(suggestion)}
                className="rounded-full border border-white/10 bg-slate-900/30 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors flex items-center active:bg-slate-800/50 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] gap-1 sm:gap-1.5"
              >
                <kbd className="hidden sm:inline text-[8px] sm:text-[9px] opacity-50 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">{index + 1}</kbd>
                <span className="truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className="p-2 sm:p-3 lg:p-4 bg-slate-900/50 backdrop-blur-sm border-t border-white/5"
        style={{
          fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif",
          paddingBottom: isMobile ? 'calc(8px + var(--sab, 0px))' : undefined,
        }}
      >
        <div className="flex items-end gap-1.5 sm:gap-2 lg:gap-3">
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="What do you do?"
            rows={1}
            className="flex-1 resize-none rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/40 text-text-primary placeholder-text-muted focus:outline-none focus:border-white/40 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-[13px] sm:text-[14px] lg:text-base"
          />
          <button
            onClick={handleSend}
            className="rounded-lg sm:rounded-xl font-semibold border border-emerald-400/40 text-emerald-200 bg-emerald-400/10 hover:bg-emerald-400/20 active:bg-emerald-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-[11px] sm:text-xs"
            aria-label="Send history lens command"
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Go'}
          </button>
        </div>
      </div>

      {showTransparency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-text-secondary">AI Transparency</span>
                <span className="text-[12px] sm:text-sm text-text-primary">
                  Model: {transparencyEntries[0]?.model || 'Unknown'}
                </span>
              </div>
              <button
                onClick={() => setShowTransparency(false)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors bg-slate-900/30"
                aria-label="Close transparency log"
              >
                Close
              </button>
            </div>
            <div className="max-h-[75vh] sm:max-h-[70vh] overflow-y-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 text-[12px] sm:text-sm text-text-primary">
              {transparencyEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-text-secondary text-center">
                  No History Lens calls yet.
                </div>
              ) : (
                transparencyEntries.map(entry => (
                  <div key={entry.id} className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/40 p-2.5 sm:p-3 lg:p-4 space-y-2.5 sm:space-y-4">
                    <div className="text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-text-secondary">
                      Prompt + Context
                    </div>
                    <pre className="whitespace-pre-wrap text-[10px] sm:text-[11px] lg:text-[12px] leading-relaxed text-text-primary/90 font-mono bg-black/30 border border-white/5 rounded-lg p-2 sm:p-3 overflow-x-auto">
{entry.prompt}
                    </pre>
                    <div className="text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-text-secondary">
                      Model Output
                    </div>
                    <pre className="whitespace-pre-wrap text-[10px] sm:text-[11px] lg:text-[12px] leading-relaxed text-text-primary/90 font-mono bg-black/30 border border-white/5 rounded-lg p-2 sm:p-3 overflow-x-auto">
{entry.output}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryLensPanel;
