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

const HistoryLensPanel: React.FC = () => {
  const { gameDate, formattedTime, gameTimeHours, setGameTimeHours, setGameDate } = useGame();
  const { mapData, currentZone, currentRegion, npcs, animals, setNpcs } = useMap();
  const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY, setControlledIconX, setControlledIconY, currentVessel, playerMode } = usePlayer();
  const { historyLensMessages, appendHistoryLensMessage, setShowDeathModal } = useUI();

  const [inputValue, setInputValue] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [historyLensMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || !playerCharacter || !mapData) return;
    if (controlledIconX === null || controlledIconY === null) return;

    setIsLoading(true);
    const playerEntry = { sender: 'player' as const, text: trimmed };
    const historyForModel = [
      ...historyLensMessages.map(({ sender, text }) => ({ sender, text })),
      { sender: 'player' as const, text: trimmed }
    ];
    appendHistoryLensMessage(playerEntry);
    setInputValue('');

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
          terrainStructures: mapData.terrainStructures || []
        },
        historyForModel
      );

      appendHistoryLensMessage({ sender: 'narrator', text: response.narration });
      setSuggestedActions(response.suggestedActions || []);

      const result = await applyHistoryLensActions(response.actions || [], {
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

      if (result.nextPosition) {
        setControlledIconX(result.nextPosition.x);
        setControlledIconY(result.nextPosition.y);
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
    inputValue,
    isLoading,
    playerCharacter,
    mapData,
    controlledIconX,
    controlledIconY,
    gameDate,
    gameTimeHours,
    setGameTimeHours,
    setGameDate,
    setControlledIconX,
    setControlledIconY,
    setPlayerCharacter,
    currentVessel,
    playerMode,
    npcs,
    setNpcs,
    historyLensMessages,
    appendHistoryLensMessage
  ]);

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

  const locationLabel = [currentZone, currentRegion].filter(Boolean).join(' - ') || 'Unknown location';
  const dateLabel = gameDate ? `${gameDate.year}-${String(gameDate.month).padStart(2, '0')}-${String(gameDate.day).padStart(2, '0')}` : 'Unknown date';
  const timeLabel = formattedTime || `${gameTimeHours}:00`;
  const seasonLabel = mapData?.season || 'unknown season';
  const climateLabel = mapData?.climate || 'unknown climate';
  const terrainLabel = mapData?.tiles?.[controlledIconY ?? 0]?.[controlledIconX ?? 0]?.biome || 'unknown terrain';
  const playerHealth = playerCharacter ? `${playerCharacter.health}/${playerCharacter.maxHealth}` : '—';
  const playerFatigue = playerCharacter ? `${playerCharacter.fatigue}/${playerCharacter.maxFatigue}` : '—';

  return (
    <div
      className="history-lens-panel relative flex flex-col h-full w-full theme-surface overflow-hidden"
      style={{
        fontFamily: "'Iowan Old Style', 'Palatino', 'Garamond', 'Times New Roman', serif",
        backgroundImage:
          'radial-gradient(circle at 15% 10%, rgba(16, 185, 129, 0.12), transparent 45%), radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.12), transparent 40%)'
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-5 bg-[var(--surface-card-bg)]/80 backdrop-blur-md"
        style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900/30 border border-white/10 flex items-center justify-center text-lg shadow-inner">
            📜
          </div>
          <div className="flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">History Lens</div>
            <div className="text-base text-text-primary font-semibold">{locationLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-text-secondary">{dateLabel}</div>
          <div className="text-xs text-text-secondary">{timeLabel}</div>
          <button
            onClick={() => setShowMap(prev => !prev)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors bg-slate-900/30"
            aria-pressed={showMap}
            aria-label="Toggle map peek"
          >
            Map
          </button>
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
          className="h-full overflow-y-auto px-6 py-5 space-y-4 text-[16px] leading-relaxed"
        >
          {historyLensMessages.map(message => (
            <div
              key={message.id}
              className={`max-w-[82%] rounded-2xl px-5 py-4 shadow-sm ${
                message.sender === 'player'
                  ? 'ml-auto bg-[var(--surface-card-bg)] text-text-primary border border-white/10'
                  : message.sender === 'narrator'
                  ? 'bg-slate-900/50 text-text-primary border border-white/10'
                  : 'bg-slate-900/20 text-text-secondary border border-white/10'
              }`}
            >
              {message.sender === 'system' && (
                <div className="text-[10px] uppercase tracking-[0.25em] text-text-muted mb-2">System</div>
              )}
              {message.text}
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
          className="px-6 py-2 flex flex-wrap gap-2"
          style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
        >
          {suggestedActions.slice(0, 4).map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1 rounded-full text-[11px] border border-white/10 bg-slate-900/30 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div
        className="p-4 bg-[var(--surface-card-bg)]/70 backdrop-blur-md"
        style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
      >
        <div className="flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your action..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-900/30 px-4 py-3 text-base text-text-primary placeholder-text-muted focus:outline-none focus:border-white/30"
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
    </div>
  );
};

export default HistoryLensPanel;
