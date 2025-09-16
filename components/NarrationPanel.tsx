import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NarrationMessage } from '../types';

interface NarrationPanelProps {
  narrationHistory: NarrationMessage[];
  playerInput: string;
  onPlayerInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

type TextSize = 'sm' | 'md' | 'lg';
type Settings = {
  showQuickReplies: boolean;
  compact: boolean;
  textSize: TextSize;
  autoScroll: boolean;
};

const SETTINGS_KEY = 'narration.panel.settings';
const commonSuggestions = ['Look around', 'Talk to the nearest person', 'Check inventory'];

const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { showQuickReplies: true, compact: false, textSize: 'md', autoScroll: true };
};

const NarrationPanel: React.FC<NarrationPanelProps> = ({
  narrationHistory,
  playerInput,
  onPlayerInputChange,
  onSend,
  isLoading
}) => {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // click-outside to close the tiny menu
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || gearRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  // auto-scroll on new narration (if enabled)
  useEffect(() => {
    if (!settings.autoScroll) return;
    const el = logRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [narrationHistory, isLoading, settings.autoScroll]);

  const isPlaceholderVisible =
    narrationHistory.length === 1 && narrationHistory[0].sender === 'narrator-special';

  const suggestions = useMemo(() => {
    const last = [...narrationHistory].reverse().find((m) => m.sender !== 'player');
    const picks = new Set<string>(commonSuggestions);
    if (last?.text) {
      const t = last.text.toLowerCase();
      if (t.includes('village')) picks.add('Enter the village');
      if (t.includes('market')) picks.add('Browse the market');
      if (t.includes('harbor') || t.includes('dock')) picks.add('Walk to the docks');
      if (t.includes('temple')) picks.add('Approach the temple');
      if (t.includes('guard')) picks.add('Speak to the guard');
    }
    return Array.from(picks).slice(0, 4);
  }, [narrationHistory]);

  const sendQuick = (q: string) => {
    if (isLoading) return;
    onPlayerInputChange(q);
    setTimeout(() => onSend(), 0);
  };

  const textSizeClass =
    settings.textSize === 'sm'
      ? 'text-[0.9rem]'
      : settings.textSize === 'lg'
      ? 'text-[1.05rem]'
      : 'text-[0.95rem]';

  const bubblePad = settings.compact ? 'p-2' : 'p-3';
  const stackSpace = settings.compact ? 'space-y-2' : 'space-y-3';

  return (
    <div
      aria-busy={isLoading}
      className={[
        'group relative flex flex-col h-full rounded-xl overflow-hidden shadow-xl border transition-colors',
        'bg-gradient-to-b from-slate-700/30 to-slate-800/55',
        'border-slate-500/40 backdrop-blur-md',
        'focus-within:ring-2 focus-within:ring-blue-400/25',
        isLoading ? 'ring-1 ring-amber-400/25' : ''
      ].join(' ')}
    >
      {/* subtle settings gear */}
      <button
        ref={gearRef}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Narration settings"
        className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-80 focus:opacity-100
                   text-xs px-1.5 py-1 rounded-md border
                   bg-slate-800/60 border-slate-600/50 text-slate-200
                   hover:text-white hover:bg-slate-800/80 transition-opacity"
      >
        ⚙︎
      </button>

      {/* popover menu (tiny, unobtrusive) */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-10 right-2 z-30 w-56 rounded-md border
                     bg-slate-900/95 border-slate-600/60 text-slate-200
                     shadow-xl p-2 text-xs"
        >
          <div className="px-1 pb-1 text-[11px] font-semibold text-slate-300">Narration Settings</div>

          <label className="flex items-center justify-between px-1 py-1 rounded hover:bg-slate-800/60">
            <span>Quick replies</span>
            <input
              type="checkbox"
              checked={settings.showQuickReplies}
              onChange={(e) => setSettings((s) => ({ ...s, showQuickReplies: e.target.checked }))}
              className="accent-blue-500"
            />
          </label>

          <label className="flex items-center justify-between px-1 py-1 rounded hover:bg-slate-800/60">
            <span>Compact spacing</span>
            <input
              type="checkbox"
              checked={settings.compact}
              onChange={(e) => setSettings((s) => ({ ...s, compact: e.target.checked }))}
              className="accent-blue-500"
            />
          </label>

          <div className="px-1 pt-1">Text size</div>
          <div className="flex items-center gap-2 px-1 pb-1">
            {(['sm', 'md', 'lg'] as TextSize[]).map((size) => (
              <label key={size} className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-800/60">
                <input
                  type="radio"
                  name="narr-textsize"
                  value={size}
                  checked={settings.textSize === size}
                  onChange={() => setSettings((s) => ({ ...s, textSize: size }))}
                  className="accent-blue-500"
                />
                <span className="uppercase">{size}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center justify-between px-1 py-1 rounded hover:bg-slate-800/60">
            <span>Auto-scroll</span>
            <input
              type="checkbox"
              checked={settings.autoScroll}
              onChange={(e) => setSettings((s) => ({ ...s, autoScroll: e.target.checked }))}
              className="accent-blue-500"
            />
          </label>
        </div>
      )}

      {/* log */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 p-3 overflow-y-auto text-sm leading-relaxed
                   scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/40"
      >
        {isPlaceholderVisible ? (
          <div className="text-gray-400 italic text-center h-full flex items-center justify-center">
            <div className="max-w-xs">
              <div className="text-4xl mb-4 opacity-60">💭</div>
              <p className="leading-relaxed">{narrationHistory[0].text}</p>
            </div>
          </div>
        ) : (
          <div className={stackSpace}>
            {narrationHistory.map((msg, index) => {
              const base = `group relative ${bubblePad} rounded-lg transition-colors border border-transparent`;
              const kind =
                msg.sender === 'player'
                  ? 'text-emerald-300 italic pl-4 border-l-2 border-emerald-500/30 bg-emerald-900/15 rounded-r-lg'
                  : msg.sender === 'narrator-special'
                  ? 'text-blue-300 bg-blue-900/15 border-blue-500/20'
                  : 'text-slate-100 bg-slate-700/35 border-slate-500/30';

              return (
                <div key={index} className={`${base} ${kind}`}>
                

                  {msg.sender === 'narrator' && (
                    <p className="text-xs text-amber-300 font-semibold mb-1 flex items-center gap-1">
                      <span>📜</span> Narrator
                    </p>
                  )}
                  <p className={`leading-relaxed ${textSizeClass}`}>{msg.text}</p>
                </div>
              );
            })}

            {isLoading && (
              <div className={`${bubblePad} text-slate-100 bg-slate-700/35 border border-slate-500/30 rounded-lg animate-pulse`}>
                <p className="text-xs text-amber-300 font-semibold mb-1 flex items-center gap-1">📜 The Narrator</p>
                <p className="flex items-center gap-2">
                  <span className="animate-pulse">● ● ●</span>
                  <span className="text-xs text-slate-300">thinking…</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      

      {/* composer */}
      <div className="flex-shrink-0 flex gap-2 p-3 border-t border-slate-600/40
                      bg-slate-800/70 supports-[backdrop-filter]:bg-slate-800/60 backdrop-blur-sm">
        <input
          type="text"
          aria-label="Player action input"
          disabled={isLoading}
          placeholder={isLoading ? 'Narrator is thinking…' : 'What do you do?'}
          value={playerInput}
          onChange={(e) => onPlayerInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSend()}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="text"
          enterKeyHint="send"
          className="flex-1 px-3 py-2 text-sm text-slate-100 placeholder-slate-400
                     bg-slate-700/50 border border-slate-600/50 rounded-lg
                     focus:outline-none focus:border-blue-400/60 focus:bg-slate-700/70
                     focus:ring-2 focus:ring-blue-400/20 transition-all
                     min-h-[44px] touch-manipulation"
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={onSend}
          aria-label="Send action"
          disabled={isLoading || !playerInput.trim()}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg
                     bg-amber-600 hover:bg-amber-500 hover:scale-105
                     disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100
                     shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin" />
          ) : (
            <span className="flex items-center gap-1">
              <span>Send</span>
              <span className="text-xs">↵</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default NarrationPanel;
