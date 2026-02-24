/**
 * components/mobile/MobileNarratorView.tsx
 * Dedicated mobile narrator view - always visible at the bottom of the screen
 * with the text input pinned above the keyboard.
 * This is the core text-mode interaction for mobile.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGame } from '../../contexts/GameContext';
import { useUI } from '../../contexts/UIContext';
import { useMap } from '../../contexts/MapContext';
import { usePlayer } from '../../contexts/PlayerContext';

interface MobileNarratorViewProps {
  /** Whether to expand the narrator to take more screen space */
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const MobileNarratorView: React.FC<MobileNarratorViewProps> = ({
  expanded = false,
  onToggleExpanded,
}) => {
  const { narrationHistory, playerInput, onPlayerInputChange, isNarratorLoading, gameLog } = useGame();
  const { onSend, setIsCampModalOpen } = useUI();
  const { localArea, npcs } = useMap();
  const { playerCharacter } = usePlayer();

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // Track keyboard via visualViewport API
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const handleResize = () => {
      // When keyboard opens, visualViewport height shrinks
      const fullHeight = window.innerHeight;
      const currentHeight = vv.height;
      const kbHeight = fullHeight - currentHeight;
      setKeyboardHeight(kbHeight > 50 ? kbHeight : 0);
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Auto-scroll on new narration
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [narrationHistory, isNarratorLoading]);

  // Send quick action
  const sendQuick = useCallback((q: string) => {
    if (isNarratorLoading) return;
    onPlayerInputChange(q);
    requestAnimationFrame(() => {
      onSend();
    });
  }, [isNarratorLoading, onPlayerInputChange, onSend]);

  const handleSend = useCallback(() => {
    if (isNarratorLoading || !playerInput.trim()) return;
    onSend();
    // Blur input after sending to dismiss keyboard
    inputRef.current?.blur();
  }, [isNarratorLoading, playerInput, onSend]);

  // Location names for markdown rendering
  const locationNames = useMemo(() => {
    const names = new Set<string>();
    const recentMessages = narrationHistory.slice(-10);
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

  const markdownComponents = useMemo(() => ({
    p: ({ node, ...props }: any) => <p className="mb-1.5 last:mb-0" {...props} />,
    strong: ({ node, children, ...props }: any) => {
      const textContent = typeof children === 'string' ? children : String(children);
      const isLocation = locationNames.has(textContent);
      if (isLocation) {
        return (
          <strong className="font-semibold" style={{ color: 'var(--accent-primary)' }} {...props}>
            {children}
          </strong>
        );
      }
      const isDark = document.documentElement.classList.contains('dark');
      const npcColor = isDark ? '#f59e0b' : '#059669';
      return (
        <strong className="font-semibold" style={{ color: npcColor }} {...props}>
          {children}
        </strong>
      );
    },
    em: ({ node, ...props }: any) => <>{props.children}</>,
  }), [locationNames]);

  const isPlaceholderVisible =
    narrationHistory.length === 1 && narrationHistory[0].sender === 'narrator-special';

  const quickActions = [
    { label: '👁️ Look', action: 'look around' },
    { label: '⏱️ Rest', action: 'rest for 1 hour' },
    { label: '🏕️ Camp', action: 'rest until dawn' },
    { label: '⏩ Skip', action: 'skip 1 day' },
  ];

  // Calculate bottom offset: safe area + keyboard
  const bottomOffset = keyboardHeight > 0
    ? keyboardHeight
    : 0;

  return (
    <div
      ref={containerRef}
      className="sm:hidden fixed inset-x-0 z-40 flex flex-col"
      style={{
        bottom: `${bottomOffset}px`,
        top: expanded ? 'calc(48px + env(safe-area-inset-top, 0px))' : 'auto',
        height: expanded ? undefined : (isInputFocused ? '55%' : '45%'),
        maxHeight: expanded ? undefined : '55vh',
        transition: keyboardHeight > 0 ? 'none' : 'height 0.3s ease, bottom 0.2s ease',
      }}
    >
      {/* Expand/collapse handle */}
      <div
        className="flex justify-center py-1.5 cursor-pointer"
        style={{
          background: 'var(--surface-bottom-panel-bg)',
          borderTop: '1px solid var(--surface-bottom-panel-border)',
          borderRadius: '16px 16px 0 0',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        onClick={onToggleExpanded}
      >
        <div className="w-8 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.4 }} />
      </div>

      {/* Narration log */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex-1 min-h-0 px-3 pt-2 pb-2 overflow-y-auto"
        style={{
          background: 'var(--surface-card-bg)',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {isPlaceholderVisible ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Type a command or tap a quick action below to begin.
              </p>
              <div className="mt-3 space-y-2">
                {['What do I see?', 'Look for someone to talk to', 'Search for useful items'].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuick(prompt)}
                    disabled={isNarratorLoading}
                    className="w-full text-left px-3 py-2 text-sm surface-muted rounded-lg disabled:opacity-50"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {narrationHistory.map((msg, index) => {
              const isLatest = index === narrationHistory.length - 1;
              const isPlayer = msg.sender === 'player';
              const isAmbient = msg.sender === 'narrator-ambient';
              const isSpecial = msg.sender === 'narrator-special';

              return (
                <div
                  key={index}
                  className={`
                    px-3 py-2 rounded-xl text-sm
                    ${isPlayer
                      ? 'surface-elevated border border-[var(--border-normal)] ml-6'
                      : isAmbient
                        ? 'surface-muted italic mr-6'
                        : isSpecial
                          ? 'surface-elevated italic text-xs'
                          : 'surface-muted mr-2'
                    }
                    ${isLatest ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}
                  `}
                >
                  {msg.sender === 'narrator' && (
                    <p className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-wide" style={{ color: 'var(--accent-primary)' }}>
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      Narrator
                    </p>
                  )}
                  {isAmbient && (
                    <p className="text-[9px] font-bold mb-0.5 uppercase tracking-wide" style={{ color: 'var(--accent-primary)' }}>
                      ✨ Ambiance
                    </p>
                  )}
                  {msg.sender === 'narrator' || isAmbient ? (
                    <div
                      style={{
                        fontFamily: 'Georgia, "Palatino Linotype", "Book Antiqua", Palatino, serif',
                        lineHeight: '1.5',
                      }}
                    >
                      <ReactMarkdown components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ lineHeight: '1.5' }}>{msg.text}</p>
                  )}
                </div>
              );
            })}

            {isNarratorLoading && (
              <div className="px-3 py-2 surface-muted rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>contemplating…</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick reply buttons - always visible on mobile, not gated on focus */}
      {showQuickReplies && !isPlaceholderVisible && (
        <div
          className="flex-shrink-0 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto"
          style={{
            background: 'var(--surface-bottom-panel-bg)',
            borderTop: '1px solid var(--surface-bottom-panel-border)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-wide flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
            ⚡
          </span>
          {quickActions.map(({ label, action }) => (
            <button
              key={action}
              onClick={() => sendQuick(action)}
              disabled={isNarratorLoading}
              className="flex-shrink-0 px-2.5 py-1.5 text-[11px] font-medium rounded-lg surface-elevated border border-[var(--border-normal)] disabled:opacity-50"
              style={{ minHeight: '32px' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className="flex-shrink-0 px-3 py-2 flex gap-2 items-center"
        style={{
          background: 'var(--surface-bottom-panel-bg)',
          borderTop: '1px solid var(--surface-bottom-panel-border)',
          paddingBottom: keyboardHeight > 0 ? '8px' : 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          aria-label="Player action input"
          disabled={isNarratorLoading}
          placeholder={isNarratorLoading ? 'The narrator contemplates…' : 'What do you do?'}
          value={playerInput}
          onChange={(e) => onPlayerInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="text"
          enterKeyHint="send"
          className="flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-card-bg)',
            borderColor: isInputFocused ? 'var(--accent-primary)' : 'var(--border-normal)',
            color: 'var(--text-primary)',
            fontSize: '16px', /* Prevents iOS zoom on focus */
            lineHeight: '1.4',
            caretColor: 'var(--accent-primary)',
            minHeight: '44px', /* iOS touch target */
          }}
        />
        <button
          onClick={handleSend}
          aria-label="Send action"
          disabled={isNarratorLoading || !playerInput.trim()}
          className="flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={{
            background: isNarratorLoading || !playerInput.trim() ? 'var(--surface-muted-bg)' : '#10b981',
            color: 'white',
            minHeight: '44px', /* iOS touch target */
            minWidth: '60px',
          }}
        >
          {isNarratorLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="flex items-center gap-1">
              Send
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(MobileNarratorView);
