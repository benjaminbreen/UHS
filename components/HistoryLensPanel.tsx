import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useUI } from '../contexts/UIContext';
import Minimap from './Minimap';
import type { MapData } from '../types';
import { generateHistoryLensResponse } from '../services/historyLensService';
import { applyHistoryLensActions } from '../services/historyLensActionRouter';
import { isMobileDevice } from '../utils/deviceUtils';
import { eventBus } from '../services/eventBus';

const HistoryLensPanel: React.FC = () => {
  const { gameDate, formattedTime, gameTimeHours, setGameTimeHours, setGameDate, currentTimeOfDay, currentZone, currentRegion, season, homeAnchor } = useGame();
  const { mapData, currentMapClimate, npcs, animals, setNpcs, localArea } = useMap();
  const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY, currentVessel, playerMode } = usePlayer();
  const { historyLensMessages, appendHistoryLensMessage, setShowDeathModal } = useUI();

  const [inputValue, setInputValue] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [showTransparency, setShowTransparency] = useState(false);
  const [transparencyEntries, setTransparencyEntries] = useState<Array<{
    id: string;
    prompt: string;
    output: string;
    model: string;
    timestamp: number;
  }>>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

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
    return directionMatch || verbMatch;
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
      // Build a narrative beat using the actual conversation summary
      const sentimentAdverb = data.sentiment === 'positive' ? ' warmly' :
                              data.sentiment === 'negative' ? ' tensely' : '';

      // Format the role for readability, handling empty strings (Issue #2)
      const roleText = data.npcRole?.trim() ? `, a ${data.npcRole.toLowerCase()}` : '';

      // Transform NPC-perspective summary to player-centric third-person (Issue #1)
      // The summarizeConversation returns things like "The player asked me for directions"
      // We need to convert to "You asked them for directions"
      const playerCentricSummary = data.summary
        .replace(/\bThe player\b/gi, 'You')
        .replace(/\bthe player\b/gi, 'you')
        .replace(/\basked me\b/gi, `asked ${data.npcName}`)
        .replace(/\btold me\b/gi, `told ${data.npcName}`)
        .replace(/\bgave me\b/gi, `gave ${data.npcName}`)
        .replace(/\bshowed me\b/gi, `showed ${data.npcName}`)
        .replace(/\bto me\b/gi, `to ${data.npcName}`)
        .replace(/\bwith me\b/gi, `with ${data.npcName}`)
        .replace(/\bfrom me\b/gi, `from ${data.npcName}`)
        .replace(/\bI told\b/g, `${data.npcName} told`)
        .replace(/\bI warned\b/g, `${data.npcName} warned`)
        .replace(/\bI offered\b/g, `${data.npcName} offered`)
        .replace(/\bI explained\b/g, `${data.npcName} explained`)
        .replace(/\bI suggested\b/g, `${data.npcName} suggested`)
        .replace(/\bI said\b/g, `${data.npcName} said`)
        .replace(/\bmy\b/g, 'their');

      const narrativeBeat = `Your conversation with ${data.npcName}${roleText} comes to an end${sentimentAdverb}. ${playerCentricSummary}`;

      appendHistoryLensMessage({
        sender: 'narrator',
        text: narrativeBeat
      });
    };

    eventBus.on('encounter_ended', handleEncounterEnded);
    return () => eventBus.off('encounter_ended', handleEncounterEnded);
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
        if (action.type === 'move' || action.type === 'navigate_nearest') {
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
        npcs
      });

      if (result.moveRequest) {
        eventBus.emit('historylens:move', result.moveRequest);
      }
      if (result.navigateTarget) {
        eventBus.emit('historylens:navigate', result.navigateTarget);
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
        setNpcs(prev => [...prev, ...result.npcAdditions!]);
      }
      if (result.rejections.length) {
        appendHistoryLensMessage({ sender: 'narrator', text: result.rejections.join(' ') });
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
    homeAnchor
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

  // Format full date with BCE/CE
  const formattedFullDate = useMemo(() => {
    if (!gameDate) return 'Unknown date';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[gameDate.month - 1] || 'Unknown';
    const day = gameDate.day;
    const year = gameDate.year < 0
      ? `${Math.abs(gameDate.year)} BCE`
      : `${gameDate.year} CE`;
    return `${month} ${day}, ${year}`;
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
      className="history-lens-panel panel-frame relative flex flex-col h-full lg:h-[calc(100%-12px)] w-full theme-surface overflow-hidden"
      style={{
        fontFamily: "'Iowan Old Style', 'Palatino', 'Garamond', 'Times New Roman', serif",
        backgroundImage:
          'radial-gradient(circle at 15% 10%, rgba(16, 185, 129, 0.12), transparent 25%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.22), transparent 40%)'
      }}
    >
      {/* Header - using Avenir Next for UI elements */}
      <div
        className="px-6 py-1 backdrop-blur-md border-b border-white/15"
        style={{
          fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif",
          background: 'linear-gradient(135deg, rgba(9, 13, 22, 0.88) 0%, rgba(9, 13, 22, 0.82) 100%)',
          backgroundImage: 'radial-gradient(circle at 15% 30%, rgba(16, 50, 129, 0.03), transparent 50%), radial-gradient(circle at 85% 40%, rgba(59, 130, 246, 0.1), transparent 55%), linear-gradient(135deg, rgba(9, 13, 22, 0.79) 0%, rgba(9, 13, 22, 0.8) 100%)'
        }}
      >
        {/* Title row - absolute centered time with left/right elements */}
        <div className="relative mt-2 mb-2" style={{ minHeight: '44px' }}>
          {/* Left: History Lens label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTransparency(true)}
              className="h-9 w-9 rounded-xl bg-slate-900/30 border border-white/10 shadow-sm flex items-center justify-center text-base shadow-inner hover:border-white/30 transition-colors"
              aria-label="Open transparency log"
            >
              📜
            </button>
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary">
              History Lens
            </span>
          </div>

          {/* Center: Time display - always perfectly centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-light tracking-tight text-white/90">
                {formattedTime}
              </span>
              <span className="text-[10px] font-medium text-white/50 uppercase">
                {gameTimeHours >= 12 ? 'pm' : 'am'}
              </span>
            </div>
            <span className="text-[9px] font-medium text-white/40 uppercase tracking-[0.25em]">
              {currentTimeOfDay?.toLowerCase() || ''}
            </span>
          </div>

          {/* Right: Region/climate/season pills */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/50 border border-white/8">
              <span className={getZoneClassName(currentZone)}>{formatZoneName(currentZone)}</span>
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/40 border border-white/6 capitalize text-white/60">
              {climateLabel.toLowerCase()}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/50 border border-white/8">
              <span className={getSeasonClassName(seasonLabel)}>{seasonLabel.toLowerCase()}</span>
            </span>
          </div>
        </div>

        {/* Context strip - location and date */}
        <div className="flex items-center justify-between pb-2.5">
          {/* Location */}
          <p className="text-sm font-semibold text-text-primary leading-tight">
            {primaryLocation}{secondaryLocation}
          </p>

          {/* Date */}
          <p className="text-[17px] font-medium text-white/85 leading-tight tracking-tight">
            {formattedFullDate}
          </p>
        </div>
      </div>

      {isMobile && (
        <div
          className="px-6 py-3 bg-gradient-to-r from-slate-900/20 via-slate-900/10 to-transparent"
          style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-3 py-1 rounded-full border border-white/10 bg-slate-900/30 text-text-secondary">
              Health {playerHealth}
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-slate-900/30 text-text-secondary">
              Fatigue {playerFatigue}
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-slate-900/30 text-text-secondary">
              Season {seasonLabel}
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-slate-900/30 text-text-secondary">
              Climate {climateLabel}
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-slate-900/30 text-text-secondary">
              Terrain {terrainLabel}
            </span>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0">
        <div
          ref={logRef}
          className="h-full overflow-y-auto px-8 py-7 space-y-5 text-[17px] leading-[1.75]"
        >
          {historyLensMessages.map(message => (
            <div
              key={message.id}
              className={`hl-message max-w-[82%] rounded-2xl px-5 py-4 shadow-sm ${
                message.sender === 'player'
                  ? 'hl-message--player ml-auto bg-[var(--surface-card-bg)] text-text-primary border border-white/10'
                  : message.sender === 'narrator'
                  ? 'hl-message--narrator bg-slate-900/50 text-text-primary border border-white/10'
                  : 'hl-message--system bg-slate-900/20 text-text-secondary border border-white/10'
              }`}
            >
              {message.sender === 'system' && (
                <div className="text-[10px] uppercase tracking-[0.25em] text-text-muted mb-2">System</div>
              )}
              <div className={`hl-message__text ${message.style === 'scene' ? 'hl-message__text--scene' : ''}`}>
                {renderMessageText(message.text)}
              </div>
              {message.meta && (
                <div className="hl-message__meta">{message.meta}</div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="max-w-[60%] rounded-2xl px-5 py-4 bg-slate-900/30 text-text-secondary border border-white/10 animate-pulse">
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
      </div>

      {suggestedActions.length > 0 && (
        <div
          className="px-6 py-2"
          style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
        >
          <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-2 block">
            Suggested Actions
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedActions.slice(0, 4).map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                onClick={() => setInputValue(suggestion)}
                className="px-3 py-1.5 rounded-full text-[11px] border border-white/10 bg-slate-900/30 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors flex items-center gap-1.5"
              >
                <kbd className="text-[9px] opacity-50 bg-white/5 px-1.5 py-0.5 rounded">{index + 1}</kbd>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className="p-4 bg-slate-900/50 backdrop-blur-sm border-t border-white/5"
        style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
      >
        <div className="flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your action..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-white/40"
          />
          <button
            onClick={handleSend}
            className="px-5 py-3 rounded-xl text-xs font-semibold border border-emerald-400/40 text-emerald-200 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send history lens command"
            disabled={isLoading}
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>

      {showTransparency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[92vw] max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-text-secondary">AI Transparency</span>
                <span className="text-sm text-text-primary">
                  Model: {transparencyEntries[0]?.model || 'Unknown'}
                </span>
              </div>
              <button
                onClick={() => setShowTransparency(false)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors bg-slate-900/30"
                aria-label="Close transparency log"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6 text-sm text-text-primary">
              {transparencyEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-text-secondary text-center">
                  No History Lens calls yet.
                </div>
              ) : (
                transparencyEntries.map(entry => (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 space-y-4">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
                      Prompt + Context
                    </div>
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-text-primary/90 font-mono bg-black/30 border border-white/5 rounded-lg p-3">
{entry.prompt}
                    </pre>
                    <div className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
                      Model Output
                    </div>
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-text-primary/90 font-mono bg-black/30 border border-white/5 rounded-lg p-3">
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
