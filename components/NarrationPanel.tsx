import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { NarrationMessage } from '../types';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';

interface NarrationPanelProps {
  narrationHistory: NarrationMessage[];
  playerInput: string;
  onPlayerInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onOpenCampModal?: () => void;
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
  isLoading,
  onOpenCampModal
}) => {
  const { localArea, mapData, culturalZone, npcs } = useMap();
  const { playerCharacter } = usePlayer();

  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showQuickCommandsDueToWarning, setShowQuickCommandsDueToWarning] = useState(false);
  const [contextualSuggestion, setContextualSuggestion] = useState<{ tip: string; prompts: string[] } | null>(null);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<number>(0);
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

  // Detect rest warning and show quick commands
  useEffect(() => {
    const lastMessage = narrationHistory[narrationHistory.length - 1];
    if (lastMessage?.sender === 'narrator' &&
        lastMessage.text.includes('should rest when you have a chance')) {
      setShowQuickCommandsDueToWarning(true);
      // Auto-hide after 30 seconds
      const timeout = setTimeout(() => {
        setShowQuickCommandsDueToWarning(false);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [narrationHistory]);

  // Generate contextual suggestions when narrator is empty - max once per minute
  useEffect(() => {
    // Only show if narrator history is minimal (just the initial placeholder)
    const isNarratorEmpty = narrationHistory.length <= 1 ||
      (narrationHistory.length === 1 && narrationHistory[0].sender === 'narrator-special');

    if (!isNarratorEmpty) {
      setContextualSuggestion(null);
      return;
    }

    // Rate limiting: max once per minute
    const now = Date.now();
    if (now - lastSuggestionTime < 60000) return;

    // Generate contextual tip and prompts based on game state
    const tips = [
      'Try exploring your surroundings to discover what this place has to offer.',
      'Use the narrator to ask questions about your environment and the people around you.',
      'Your actions shape the story - experiment with different approaches.',
      'Check your inventory to see what resources you have available.'
    ];

    const prompts: string[] = [];

    // Location-based prompts
    if (localArea) {
      const areaLower = localArea.toLowerCase();
      if (areaLower.includes('market') || areaLower.includes('bazaar')) {
        prompts.push('What goods are being sold here?', 'Look for a merchant to trade with');
      } else if (areaLower.includes('temple') || areaLower.includes('shrine') || areaLower.includes('church')) {
        prompts.push('Ask about local religious customs', 'Speak with a priest or monk');
      } else if (areaLower.includes('harbor') || areaLower.includes('port') || areaLower.includes('dock')) {
        prompts.push('Look for ships heading to distant lands', 'Ask sailors about their travels');
      } else if (areaLower.includes('palace') || areaLower.includes('court')) {
        prompts.push('Inquire about the ruler of this land', 'Observe court protocols');
      } else if (areaLower.includes('tavern') || areaLower.includes('inn')) {
        prompts.push('Listen to local gossip', 'Ask the innkeeper about recent events');
      }
    }

    // Profession-based prompts
    if (playerCharacter?.profession) {
      const professionLower = playerCharacter.profession.toLowerCase();
      if (professionLower.includes('merchant') || professionLower.includes('trader')) {
        prompts.push('Seek out profitable trade opportunities');
      } else if (professionLower.includes('scholar') || professionLower.includes('scribe')) {
        prompts.push('Search for books or documents to study');
      } else if (professionLower.includes('guard') || professionLower.includes('soldier')) {
        prompts.push('Look for work protecting caravans or estates');
      }
    }

    // Generic fallback prompts
    if (prompts.length < 3) {
      const generic = [
        'What do I see?',
        'Look for someone to talk to',
        'Search for useful items or resources',
        'Ask about local customs and culture'
      ];
      prompts.push(...generic.slice(0, 3 - prompts.length));
    }

    // Pick a random tip and up to 3 prompts
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    const selectedPrompts = prompts.slice(0, 3);

    setContextualSuggestion({ tip: randomTip, prompts: selectedPrompts });
    setLastSuggestionTime(now);
  }, [narrationHistory, localArea, playerCharacter, lastSuggestionTime]);

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

  const sendQuick = useCallback((q: string) => {
    if (isLoading) return;
    // Set the input text first
    onPlayerInputChange(q);
    // Use requestAnimationFrame to ensure React has completed its render cycle
    // This guarantees onSend will see the updated playerInput value
    requestAnimationFrame(() => {
      onSend();
    });
  }, [isLoading, onPlayerInputChange, onSend]);

  const textSizeClass =
    settings.textSize === 'sm'
      ? 'text-[1.05rem]'
      : settings.textSize === 'lg'
      ? 'text-[1.2rem]'
      : 'text-[1.1rem]';

  const bubblePad = settings.compact ? 'p-2.5' : 'p-4';
  const stackSpace = settings.compact ? 'space-y-2.5' : 'space-y-4';

  // Extract location names from recent messages (memoized separately to reduce re-renders)
  const locationNames = useMemo(() => {
    const names = new Set<string>();
    const recentMessages = narrationHistory.slice(-10); // Check last 10 messages

    for (const msg of recentMessages) {
      if (msg.sender === 'narrator' || msg.sender === 'narrator-ambient') {
        const locationMatches = msg.text.match(/\*\*\*([^*]+)\*\*\*/g);
        if (locationMatches) {
          locationMatches.forEach(match => {
            names.add(match.replace(/\*\*\*/g, ''));
          });
        }
      }
    }

    return names;
  }, [narrationHistory]);

  // Memoize ReactMarkdown components to prevent re-creation and hover flickering
  const markdownComponents = useMemo(() => {
    return {
      p: ({node, ...props}: any) => <p className="mb-3 last:mb-0" {...props} />,
      strong: ({node, children, ...props}: any) => {
        // Get the text content
        const textContent = typeof children === 'string' ? children : String(children);

        // Check if this text is a location (***text***)
        const isLocation = locationNames.has(textContent);

        console.log(`[NarrationPanel] Rendering "${textContent}" as ${isLocation ? 'LOCATION (blue)' : 'NPC (emerald/amber)'}`);

        if (isLocation) {
          // This is a location (***text***) - blue to match narrator theme
          return (
            <strong
              className="font-semibold not-italic"
              style={{ fontStyle: 'normal', color: 'var(--accent-primary)' }}
              {...props}
            >
              {children}
            </strong>
          );
        }

        // This is an NPC (**text**) - emerald in light mode, amber in dark mode, clickable if on map
        const npcName = textContent;
        const matchedNpc = npcs?.find(npc => npc.name === npcName);

        if (matchedNpc && matchedNpc.x !== undefined && matchedNpc.y !== undefined) {
          // Detect theme for color
          const isDark = document.documentElement.classList.contains('dark');
          const npcColor = isDark ? '#f59e0b' : '#059669'; // amber-500 : emerald-600

          return (
            <strong
              className="font-semibold hover:opacity-80 cursor-pointer transition-opacity duration-200 border-b border-transparent hover:border-dotted"
              style={{ color: npcColor }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderBottomColor = npcColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent';
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Center the camera on the NPC
                window.dispatchEvent(new CustomEvent('centerMapOnLocation', {
                  detail: { x: matchedNpc.x, y: matchedNpc.y }
                }));
                // Highlight the NPC
                import('../services/eventBus').then(({ eventBus }) => {
                  eventBus.emit('npc:highlight', { npcId: matchedNpc.id });
                });
              }}
              {...props}
            >
              {children}
            </strong>
          );
        }

        // NPC not found or no coordinates - just style it (not clickable)
        const isDark = document.documentElement.classList.contains('dark');
        const npcColor = isDark ? '#f59e0b' : '#059669'; // amber-500 : emerald-600

        return (
          <strong
            className="font-semibold"
            style={{ color: npcColor }}
            {...props}
          >
            {children}
          </strong>
        );
      },
      // Strip em tags inside strong (they're just markers for locations)
      em: ({node, ...props}: any) => <>{props.children}</>
    };
  }, [npcs, locationNames]);

  return (
    <div
      aria-busy={isLoading}
      className={[
        'group relative flex flex-col h-full overflow-hidden transition-colors',
        isLoading ? 'ring-1 ring-[color:var(--color-warning)]/25' : ''
      ].join(' ')}
    >
      {/* subtle settings gear */}
      <button
        ref={gearRef}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Narration settings"
        className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-80 focus:opacity-100 text-xs px-1.5 py-1 btn-secondary"
      >
        ⚙︎
      </button>

      {/* popover menu (tiny, unobtrusive) */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-10 right-2 z-30 w-60 rounded-xl surface-card shadow-xl p-3 text-xs"
        >
          <div className="px-1 pb-2 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Narration Settings</div>

          <label className="flex items-center justify-between px-1.5 py-1.5 rounded-lg surface-muted hover:shadow-md">
            <span>Quick replies</span>
            <input
              type="checkbox"
              checked={settings.showQuickReplies}
              onChange={(e) => setSettings((s) => ({ ...s, showQuickReplies: e.target.checked }))}
              className="accent-[color:var(--accent-primary)]"
            />
          </label>

          <label className="flex items-center justify-between px-1.5 py-1.5 rounded-lg surface-muted hover:shadow-md mt-1">
            <span>Compact spacing</span>
            <input
              type="checkbox"
              checked={settings.compact}
              onChange={(e) => setSettings((s) => ({ ...s, compact: e.target.checked }))}
              className="accent-[color:var(--accent-primary)]"
            />
          </label>

          <div className="px-1 pt-2 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Text size</div>
          <div className="flex items-center gap-2 px-1 pb-1">
            {(['sm', 'md', 'lg'] as TextSize[]).map((size) => (
              <label key={size} className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 surface-muted hover:shadow-md">
                <input
                  type="radio"
                  name="narr-textsize"
                  value={size}
                  checked={settings.textSize === size}
                  onChange={() => setSettings((s) => ({ ...s, textSize: size }))}
                  className="accent-[color:var(--accent-primary)]"
                />
                <span className="uppercase">{size}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center justify-between px-1.5 py-1.5 rounded-lg surface-muted hover:shadow-md">
            <span>Auto-scroll</span>
            <input
              type="checkbox"
              checked={settings.autoScroll}
              onChange={(e) => setSettings((s) => ({ ...s, autoScroll: e.target.checked }))}
              className="accent-[color:var(--accent-primary)]"
            />
          </label>
        </div>
      )}

      {/* log */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 px-4 pt-5 pb-5 overflow-y-auto text-xs leading-relaxed space-y-3
                   scrollbar-thin scrollbar-thumb-slate-400/60 scrollbar-track-transparent"
        style={{ background: 'var(--surface-card-bg)' }}
      >
        {isPlaceholderVisible ? (
          <>
            {/* Contextual tip at top - inside scrollable area */}
            {contextualSuggestion && (
              <div className="mt-5 mb-4">
                <div className="surface-muted rounded-lg p-3.5">
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                   💡 Tip
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed" style={{ lineHeight: '1.6' }}>
                    {contextualSuggestion.tip}
                  </p>
                </div>
              </div>
            )}
            <div className="text-[var(--text-muted)] italic text-center flex items-center justify-center" style={{ minHeight: contextualSuggestion ? 'auto' : '100%' }}>
              <div className="max-w-xs">
                {/* Contextual prompts */}
                {contextualSuggestion && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-700">
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium mb-1.5 text-left uppercase tracking-wide opacity-70">
                      Try asking...
                    </p>
                    <div className="space-y-2">
                      {contextualSuggestion.prompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendQuick(prompt)}
                          disabled={isLoading}
                          className="w-full text-left px-2.5 py-1.5 text-xs surface-muted rounded-lg transition-all disabled:opacity-50 hover:shadow-md"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={stackSpace}>
            {narrationHistory.map((msg, index) => {
              const isLatest = index === narrationHistory.length - 1;
              const base = `group relative ${bubblePad} rounded-xl transition-all duration-300 ${isLatest ? 'animate-in fade-in slide-in-from-bottom-2 duration-500' : ''}`;
              const kind =
                msg.sender === 'player'
                  ? 'surface-elevated text-[var(--text-primary)] border border-[var(--border-normal)] shadow-sm hover:shadow-md'
                  : msg.sender === 'narrator-special'
                  ? 'surface-elevated text-[var(--text-secondary)] italic text-sm'
                  : msg.sender === 'narrator-ambient'
                  ? 'surface-muted text-[var(--text-secondary)] italic'
                  : 'surface-muted text-[var(--text-primary)] shadow-sm';

              return (
                <div key={index} className={`${base} ${kind}`}>


                  {msg.sender === 'narrator' && (
                    <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-[var(--accent-primary)] tracking-wide">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="uppercase text-[10px] font-extrabold">Narrator</span>
                    </p>
                  )}
                  {msg.sender === 'narrator-ambient' && (
                    <p className="text-xs text-[var(--accent-primary)] font-bold mb-2 flex items-center gap-1.5 tracking-wide">
                      <span className="text-sm">✨</span>
                      <span className="uppercase text-[10px] font-extrabold">Ambiance</span>
                    </p>
                  )}
                  {msg.sender === 'narrator' || msg.sender === 'narrator-ambient' ? (
                    <div
                      className={`leading-relaxed ${textSizeClass}`}
                      style={{
                        fontFamily: 'Georgia, "Palatino Linotype", "Book Antiqua", Palatino, serif',
                        lineHeight: '1.8'
                      }}
                    >
                      <ReactMarkdown components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className={`leading-relaxed tracking-normal ${textSizeClass}`} style={{ lineHeight: '1.65' }}>{msg.text}</p>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className={`${bubblePad} surface-muted rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-[var(--accent-primary)] tracking-wide">
                  <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="uppercase text-[10px] font-extrabold">Narrator</span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] font-medium italic">contemplating your actions…</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Command Buttons - Only show when input is focused OR rest warning appears */}
      {settings.showQuickReplies && (isInputFocused || showQuickCommandsDueToWarning) && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border-normal)] surface-muted animate-in slide-in-from-bottom-3 fade-in duration-300">
          <p className="text-xs text-[var(--text-secondary)] font-bold mb-2.5 flex items-center gap-2 tracking-wide uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px]">Quick Actions</span>
            {showQuickCommandsDueToWarning && (
              <span className="text-[10px] text-[color:var(--color-warning)] animate-pulse ml-1 normal-case">(suggested)</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                sendQuick('look around');
              }}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg surface-elevated border border-[var(--border-normal)]
                         transition-all duration-200 disabled:opacity-50
                         hover:shadow-md hover:scale-105 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]
                         active:scale-95"
            >
              👁️ Look Around
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                sendQuick('rest for 1 hour');
              }}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg surface-elevated border border-[var(--border-normal)]
                         transition-all duration-200 disabled:opacity-50
                         hover:shadow-md hover:scale-105 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]
                         active:scale-95"
            >
              ⏱️ Rest 1 Hour
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                sendQuick('rest until dawn');
              }}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg surface-elevated border border-[var(--border-normal)]
                         transition-all duration-200 disabled:opacity-50
                         hover:shadow-md hover:scale-105 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]
                         active:scale-95"
            >
              🏕️ Camp
            </button>

            <button
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                sendQuick('skip 1 day');
              }}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg surface-elevated border border-[var(--border-normal)]
                         transition-all duration-200 disabled:opacity-50
                         hover:shadow-md hover:scale-105 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]
                         active:scale-95"
            >
              ⏩ Skip Day
            </button>
          </div>
        </div>
      )}

      {/* composer - beautiful design with animations and polish */}
      <div className="flex-shrink-0 px-3 py-3 mx-2 mb-2 rounded-xl border transition-all duration-300 animate-in slide-in-from-bottom-4"
           style={{
             borderColor: isInputFocused ? 'var(--border-hover)' : 'var(--border-normal)',
             background: isLoading
               ? 'linear-gradient(135deg, var(--surface-elevated-bg) 0%, var(--surface-card-bg) 100%)'
               : 'var(--surface-card-bg)',
             boxShadow: isInputFocused
               ? '0 4px 16px rgba(0, 0, 0, 0.08)'
               : isLoading
               ? '0 8px 24px rgba(16, 185, 129, 0.15), 0 0 0 4px rgba(16, 185, 129, 0.08)'
               : '0 2px 8px rgba(0, 0, 0, 0.04)'
           }}>
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            {/* Animated gradient glow during loading */}
            {isLoading && (
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 rounded-lg opacity-20 blur-sm animate-pulse" />
            )}
            <input
              type="text"
              aria-label="Player action input"
              disabled={isLoading}
              placeholder={isLoading ? 'The narrator contemplates…' : 'What do you do?'}
              value={playerInput}
              onChange={(e) => onPlayerInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSend()}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              enterKeyHint="send"
              className="narration-input relative w-full px-4 py-3 text-base font-medium text-[var(--text-primary)] rounded-lg
                         focus:outline-none
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed border-none"
              style={{
                fontSize: '15px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                letterSpacing: '0.01em',
                lineHeight: '1.5',
                caretColor: 'var(--accent-primary)',
                boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            />
            {/* Input and placeholder styling enhancement */}
            <style>{`
              .narration-input {
                background: rgba(255, 255, 255, 0.95);
              }
              .dark .narration-input {
                background: rgba(51, 65, 85, 0.7);
              }
              input::placeholder {
                color: var(--text-secondary);
                opacity: 0.7;
                font-style: italic;
                font-weight: 500;
                letter-spacing: 0.02em;
              }
              input:focus::placeholder {
                opacity: 0.5;
                transform: translateY(-2px);
                transition: all 0.3s ease;
              }
            `}</style>
          </div>
          <button
            onClick={onSend}
            aria-label="Send action"
            disabled={isLoading || !playerInput.trim()}
            className="relative px-6 py-3 text-sm font-bold rounded-lg shadow-lg
                       transition-all duration-300 overflow-hidden group
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                       hover:shadow-xl hover:scale-105 active:scale-95"
            style={{
              background: isLoading || !playerInput.trim()
                ? 'var(--surface-muted-bg)'
                : '#10b981',
              color: 'white',
              boxShadow: playerInput.trim() && !isLoading
                ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                : 'none'
            }}
          >
            {/* Shimmer effect on hover */}
            {!isLoading && playerInput.trim() && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs">Thinking</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NarrationPanel;
