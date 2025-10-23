import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  X,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  MapPin,
  MessageSquare,
  Swords,
  Hammer,
  Flame,
  PawPrint,
  Timer
} from 'lucide-react';
import {
  AssessmentSession,
  AssessmentSummary,
  AssessmentLogState,
  AssessmentRequest,
  AssessmentLLMResult
} from '../types/assessment';
import { requestAssessmentAnalysis } from '../services/assessmentService';
import { PlayerCharacter } from '../types/playerCharacter';

type AssessmentTab = 'assessment' | 'activity' | 'history' | 'raw';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: (restartSession?: boolean) => void;
  session: AssessmentSession | null;
  summary: AssessmentSummary | null;
  logs: AssessmentLogState;
  buildRequest: () => AssessmentRequest | null;
  player?: PlayerCharacter | null;
  gameDateString?: string;
}

interface TimelineEvent {
  timestamp: string;
  type: 'npc' | 'primary' | 'input';
  title: string;
  detail: string;
  meta?: string;
}

interface HistoryEvent {
  timestamp: string;
  title: string;
  description?: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const formatTimestamp = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (ms?: number | null) => {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const formatTimelineTime = (iso?: string) => {
  if (!iso) return 'Unknown moment';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown moment';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const buildPrimarySourceCountSummary = (counts: Record<string, number>) => {
  const entries = Object.entries(counts);
  if (entries.length === 0) return 'None';
  return entries
    .map(([action, count]) => `${action}: ${count}`)
    .join(' · ');
};

const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  session,
  summary,
  logs,
  buildRequest,
  player,
  gameDateString
}) => {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('assessment');
  const [analysisState, setAnalysisState] = useState<{
    status: 'idle' | 'loading' | 'ready' | 'error';
    sessionId?: string;
    request?: AssessmentRequest | null;
    result?: AssessmentLLMResult | null;
    error?: string;
  }>({
    status: 'idle'
  });
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const playerInputKeywordGroups = useMemo(
    () => [
      {
        title: 'Explored Ruins or Ancient Sites',
        icon: MapPin,
        accent: 'bg-amber-500 border-amber-400',
        keywords: ['ruin', 'catacomb', 'tomb', 'crypt', 'temple', 'ancient site', 'dig site']
      },
      {
        title: 'Visited Landmark or POI',
        icon: MapPin,
        accent: 'bg-cyan-500 border-cyan-400',
        keywords: ['point of interest', 'landmark', 'monument', 'poi', 'site', 'observatory']
      },
      {
        title: 'Crafting & Production',
        icon: Hammer,
        accent: 'bg-indigo-500 border-indigo-400',
        keywords: ['craft', 'forge', 'smith', 'fletch', 'weave', 'brew', 'tailor', 'constructed', 'build']
      },
      {
        title: 'Hunted or Fought',
        icon: Swords,
        accent: 'bg-red-500 border-red-400',
        keywords: ['hunt', 'hunted', 'ambush', 'fight', 'battle', 'combat', 'slay', 'kill', 'defend']
      },
      {
        title: 'Tamed or Befriended Animal',
        icon: PawPrint,
        accent: 'bg-emerald-500 border-emerald-400',
        keywords: ['tame', 'tamed', 'befriend', 'train', 'animal companion', 'domesticate']
      },
      {
        title: 'Trade & Negotiation',
        icon: Users,
        accent: 'bg-blue-500 border-blue-400',
        keywords: ['trade', 'market', 'barter', 'bargain', 'sell', 'buy', 'merchant']
      },
      {
        title: 'Journey or Expedition',
        icon: MapPin,
        accent: 'bg-teal-500 border-teal-400',
        keywords: ['journey', 'travel', 'voyage', 'crossed', 'expedition', 'trek', 'traveled']
      },
      {
        title: 'Fire or Disaster',
        icon: Flame,
        accent: 'bg-orange-500 border-orange-400',
        keywords: ['fire', 'blaze', 'burn', 'inferno', 'conflagration']
      }
    ],
    []
  );

  const classifyPlayerInput = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      return playerInputKeywordGroups.find(group =>
        group.keywords.some(keyword => lower.includes(keyword))
      ) || null;
    },
    [playerInputKeywordGroups]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !session) return;
    setActiveTab('assessment');

    const request = buildRequest();
    if (!request) {
      setAnalysisState({
        status: 'error',
        sessionId: session.id,
        request: null,
        error: 'Assessment data is incomplete.'
      });
      return;
    }

    if (analysisState.sessionId === session.id && analysisState.status === 'ready') {
      return;
    }

    let cancelled = false;
    setAnalysisState({
      status: 'loading',
      sessionId: session.id,
      request
    });

    requestAssessmentAnalysis(request)
      .then(result => {
        if (!cancelled) {
          setAnalysisState({
            status: 'ready',
            sessionId: session.id,
            request,
            result
          });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setAnalysisState({
            status: 'error',
            sessionId: session.id,
            request,
            error: error instanceof Error ? error.message : 'Failed to fetch assessment.'
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session, buildRequest]);

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];

    logs.npcEncounters.forEach(encounter => {
      events.push({
        timestamp: encounter.timestamp,
        type: 'npc',
        title: encounter.npcName || encounter.npcId,
        detail: encounter.playerAction,
        meta: encounter.outcome || undefined
      });
    });

    logs.primarySources.forEach(source => {
      events.push({
        timestamp: source.timestamp,
        type: 'primary',
        title: source.sourceTitle || source.sourceId,
        detail: `Primary source ${source.action}`,
        meta: source.metadata?.note ? String(source.metadata.note) : undefined
      });
    });

    logs.playerInputs.forEach(input => {
      events.push({
        timestamp: input.timestamp,
        type: 'input',
        title: 'Player narration',
        detail: input.text,
        meta: input.channel !== 'narration' ? `Channel: ${input.channel}` : undefined
      });
    });

    return events.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return aTime - bTime;
    });
  }, [logs]);

  const historyEvents: HistoryEvent[] = useMemo(() => {
    const events: HistoryEvent[] = [];

    logs.npcEncounters.forEach(encounter => {
      events.push({
        timestamp: encounter.timestamp,
        title: encounter.npcName ? `Dialogue with ${encounter.npcName}` : 'Encountered an NPC',
        description: [encounter.playerAction, encounter.outcome].filter(Boolean).join('. '),
        category: 'NPC Encounter',
        icon: Users,
        accent: 'bg-emerald-500 border-emerald-400'
      });
    });

    logs.primarySources.forEach(source => {
      events.push({
        timestamp: source.timestamp,
        title: source.sourceTitle ? `Studied ${source.sourceTitle}` : `Primary source ${source.action}`,
        description: `Action: ${source.action}${source.metadata?.note ? `. Notes: ${source.metadata.note}` : ''}`,
        category: 'Primary Source',
        icon: BookOpen,
        accent: 'bg-sky-500 border-sky-400'
      });
    });

    logs.playerInputs.forEach(input => {
      const classification = classifyPlayerInput(input.text);
      if (classification) {
        events.push({
          timestamp: input.timestamp,
          title: classification.title,
          description: input.text,
          category: classification.title,
          icon: classification.icon,
          accent: classification.accent
        });
      }
    });

    return events
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 120);
  }, [logs, classifyPlayerInput]);

  const quickStats = useMemo(
    () => [
      {
        label: 'Duration',
        value: formatDuration(summary?.durationMs),
        icon: Timer
      },
      {
        label: 'Primary Sources',
        value: summary?.primarySourceInteractionCount ?? 0,
        icon: BookOpen
      },
      {
        label: 'NPC Encounters',
        value: summary?.npcEncounterCount ?? 0,
        icon: Users
      },
      {
        label: 'Player Inputs',
        value: summary?.playerInputCount ?? 0,
        icon: MessageSquare
      }
    ],
    [summary]
  );

  const portraitNode = useMemo(() => {
    if (!player) {
      return (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white/60 text-sm">
          No Portrait
        </div>
      );
    }

    if (player.profileImage) {
      return (
        <img
          src={player.profileImage}
          alt={player.name}
          className="h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-lg"
        />
      );
    }

    const initials = player.name
      ? player.name
          .split(' ')
          .filter(Boolean)
          .map(part => part[0]?.toUpperCase())
          .slice(0, 2)
          .join('') || 'P'
      : 'P';

    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white text-xl font-semibold shadow-lg">
        {initials}
      </div>
    );
  }, [player]);

  useEffect(() => {
    if (!saveMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#assessment-save-menu') && !target.closest('#assessment-save-trigger')) {
        setSaveMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [saveMenuOpen]);

  const refreshAnalysis = () => {
    if (!session) return;
    const request = buildRequest();
    if (!request) {
      setAnalysisState({
        status: 'error',
        sessionId: session.id,
        request: null,
        error: 'Assessment data is incomplete.'
      });
      return;
    }

    setAnalysisState({
      status: 'loading',
      sessionId: session.id,
      request
    });

    requestAssessmentAnalysis(request)
      .then(result => {
        setAnalysisState({
          status: 'ready',
          sessionId: session.id,
          request,
          result
        });
      })
      .catch(error => {
        setAnalysisState({
          status: 'error',
          sessionId: session.id,
          request,
          error: error instanceof Error ? error.message : 'Failed to fetch assessment.'
        });
    });
  };

  const buildTextReport = useCallback(() => {
    if (!analysisState.result) return '';
    const lines: string[] = [];
    lines.push('Universal History Simulator — Assessment Report');
    lines.push(`Player: ${player?.name ?? 'Unknown'}`);
    if (player?.profession) lines.push(`Profession: ${player.profession}`);
    if (session?.context?.role) lines.push(`Scenario Role: ${session.context.role}`);
    lines.push(`Session ID: ${session?.id ?? '—'}`);
    lines.push(`Duration: ${formatDuration(summary?.durationMs)}`);
    if (session?.startedAt) lines.push(`Started: ${formatTimelineTime(session.startedAt)}`);
    if (session?.endedAt) lines.push(`Ended: ${formatTimelineTime(session.endedAt)}`);
    lines.push('');
    lines.push('Narrative Summary:');
    lines.push(analysisState.result.narrativeSummary);
    lines.push('');
    lines.push('Scores:');
    analysisState.result.scores.forEach(score => {
      lines.push(`- ${score.category}: ${score.score}/${score.outOf} — ${score.rationale}`);
    });
    if (analysisState.result.highlights?.length) {
      lines.push('');
      lines.push('Highlights:');
      analysisState.result.highlights.forEach(item => lines.push(`• ${item}`));
    }
    if (analysisState.result.concerns?.length) {
      lines.push('');
      lines.push('Concerns:');
      analysisState.result.concerns.forEach(item => lines.push(`• ${item}`));
    }
    lines.push('');
    lines.push(`Primary Source Interactions: ${summary?.primarySourceInteractionCount ?? 0}`);
    lines.push(`NPC Encounters: ${summary?.npcEncounterCount ?? 0}`);
    lines.push(`Player Inputs: ${summary?.playerInputCount ?? 0} (${summary?.playerInputWordCount ?? 0} words)`);
    return lines.join('\n');
  }, [analysisState.result, player, session, summary]);

  const handleSave = useCallback((format: 'txt' | 'pdf') => {
    if (analysisState.status !== 'ready' || !analysisState.result) return;
    const textReport = buildTextReport();
    if (!textReport) return;
    const filenameBase = `uhs-assessment-${session?.id ?? 'session'}`;

    if (format === 'txt') {
      const blob = new Blob([textReport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filenameBase}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const win = window.open('', '_blank');
    if (!win) return;
    const htmlReport = textReport
      .split('\n')
      .map(line => (line.trim().length === 0 ? '<br />' : `<p>${line}</p>`))
      .join('\n');

    win.document.write(`
      <html>
        <head>
          <title>Assessment Report</title>
          <style>
            body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #111827; background: #f9fafb; }
            h1 { font-size: 24px; margin-bottom: 12px; }
            p { margin: 6px 0; line-height: 1.5; }
            .muted { color: #6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Universal History Simulator — Assessment Report</h1>
          <div class="muted">Generated ${new Date().toLocaleString()}</div>
          ${htmlReport}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }, [analysisState, buildTextReport, session]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center">
      <div
        className="absolute inset-0"
        data-surface="modal-overlay"
        onClick={() => onClose(true)}
      />
      <div className="relative z-[170] w-full max-w-6xl px-4 py-6 sm:px-6">
        <div
          className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border"
          data-surface="modal-panel"
        >
          <div className="relative overflow-hidden border-b border-[color:var(--surface-muted-border)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22)_0%,rgba(15,23,42,0)_70%)]" />
            <div className="relative px-6 py-6 space-y-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  {portraitNode}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-semibold tracking-tight text-white">
                        {player?.name || session?.context?.role || 'Session Assessment'}
                      </h2>
                      {session?.context?.role && (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                          {session.context.role}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
                      {player?.profession && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Profession: {player.profession}
                        </span>
                      )}
                      {session?.context?.culturalZone && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Zone: {session.context.culturalZone}
                        </span>
                      )}
                      {gameDateString && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Game Date: {gameDateString}
                        </span>
                      )}
                      {session?.context?.era && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Era: {session.context.era}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {analysisState.status === 'ready' && (
                    <button
                      type="button"
                      onClick={refreshAnalysis}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  )}
                  {analysisState.status === 'ready' && (
                    <div className="relative" id="assessment-save-trigger">
                      <button
                        type="button"
                        onClick={() => setSaveMenuOpen(prev => !prev)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                      >
                        <Download className="h-4 w-4" />
                        Save
                      </button>
                      {saveMenuOpen && (
                        <div
                          id="assessment-save-menu"
                          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-muted-bg)]/95 shadow-xl backdrop-blur"
                        >
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-xs font-medium text-white/90 hover:bg-white/10"
                            onClick={() => {
                              handleSave('txt');
                              setSaveMenuOpen(false);
                            }}
                          >
                            Export as .txt
                          </button>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-xs font-medium text-white/90 hover:bg-white/10"
                            onClick={() => {
                              handleSave('pdf');
                              setSaveMenuOpen(false);
                            }}
                          >
                            Export as PDF
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onClose(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close assessment"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {quickStats.map(stat => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80"
                  >
                    <stat.icon className="h-4 w-4 text-white/70" />
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-white/60">{stat.label}</div>
                      <div className="text-sm font-semibold text-white">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setDetailsExpanded(prev => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
                >
                  {detailsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {detailsExpanded ? 'Hide Session Details' : 'Show Session Details'}
                </button>
                {detailsExpanded && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50">Session ID</p>
                      <p className="mt-1 text-sm font-semibold text-white break-all">{session?.id ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50">Started</p>
                      <p className="mt-1 text-sm font-semibold text-white">{session?.startedAt ? formatTimelineTime(session.startedAt) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50">Ended</p>
                      <p className="mt-1 text-sm font-semibold text-white">{session?.endedAt ? formatTimelineTime(session.endedAt) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/50">Primary Source Actions</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {summary ? buildPrimarySourceCountSummary(summary.primarySourceActionCounts) : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-[color:var(--surface-muted-border)] px-6 py-3">
            {[
              { id: 'assessment', label: 'Assessment' },
              { id: 'activity', label: 'Activity Log' },
              { id: 'history', label: 'History' },
              { id: 'raw', label: 'Raw Data' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AssessmentTab)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-transparent bg-[color:var(--surface-chip-active-bg)] text-[color:var(--surface-chip-active-text)] shadow-[0_14px_32px_rgba(75,119,104,0.24)]'
                    : 'border-transparent text-slate-600 hover:bg-[color:var(--surface-muted-bg)] hover:text-[color:var(--text-primary)] dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
            {activeTab === 'assessment' && (
              <div className="space-y-6">
                {analysisState.status === 'loading' && (
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-[color:var(--surface-muted-border)] bg-[color:var(--surface-muted-bg)]/80 p-10 text-[color:var(--text-secondary)]">
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Generating assessment summary…
                  </div>
                )}

                {analysisState.status === 'error' && (
                  <div className="rounded-2xl border border-red-300/60 bg-red-100/70 p-6 text-sm text-red-900 dark:border-red-500/60 dark:bg-red-500/20 dark:text-red-200">
                    <p className="font-semibold">Unable to fetch analysis</p>
                    <p className="mt-1 text-sm opacity-80">{analysisState.error}</p>
                  </div>
                )}

                {analysisState.status === 'ready' && analysisState.result && (
                  <>
                    <div className="rounded-3xl border border-transparent bg-[color:var(--surface-card-bg)] p-6 shadow-[0_24px_48px_rgba(63,50,33,0.12)]">
                      <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                        LLM Narrative Summary
                      </p>
                      <p className="mt-3 text-base leading-relaxed text-[color:var(--text-primary)]">
                        {analysisState.result.narrativeSummary}
                      </p>
                      {(analysisState.result.highlights?.length || analysisState.result.concerns?.length) && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {analysisState.result.highlights && analysisState.result.highlights.length > 0 && (
                            <div className="rounded-2xl border border-transparent bg-emerald-500/10 p-4 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                                Highlights
                              </p>
                              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                                {analysisState.result.highlights.map((item, index) => (
                                  <li key={`highlight-${index}`} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysisState.result.concerns && analysisState.result.concerns.length > 0 && (
                            <div className="rounded-2xl border border-transparent bg-amber-500/10 p-4 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/80">
                                Concerns
                              </p>
                              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                                {analysisState.result.concerns.map((item, index) => (
                                  <li key={`concern-${index}`} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {analysisState.result.scores.map(score => (
                        <div
                          key={score.category}
                          className="rounded-2xl border border-transparent bg-[color:var(--surface-muted-bg)] p-5 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                            {score.category}
                          </p>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-[color:var(--text-primary)]">
                              {Number.isInteger(score.score) ? score.score : score.score.toFixed(1)}
                            </span>
                            <span className="text-sm text-[color:var(--text-secondary)]">
                              / {score.outOf}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                            {score.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {timelineEvents.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[color:var(--surface-muted-border)] bg-[color:var(--surface-muted-bg)]/70 p-8 text-center text-sm text-[color:var(--text-secondary)]">
                    No logged events for this session yet.
                  </div>
                )}
                {timelineEvents.map((event, index) => (
                  <div
                    key={`${event.type}-${event.timestamp}-${index}`}
                    className="rounded-2xl border border-transparent bg-[color:var(--surface-muted-bg)] p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                          {event.type === 'npc' && 'NPC Encounter'}
                          {event.type === 'primary' && 'Primary Source'}
                          {event.type === 'input' && 'Player Input'}
                        </p>
                        <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
                          {event.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[color:var(--text-secondary)]">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-primary)]">
                      {event.detail}
                    </p>
                    {event.meta && (
                      <p className="mt-2 text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">
                        {event.meta}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white/80 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {portraitNode}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{player?.name ?? 'Player Character'}</h3>
                        <p className="text-sm text-white/70">
                          {[player?.profession, session?.context?.role, gameDateString].filter(Boolean).join(' • ') || 'Session overview'}
                        </p>
                      </div>
                    </div>
                    <div className="grid w-full gap-3 text-sm text-white/70 sm:w-auto sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Encounters</p>
                        <p className="text-lg font-semibold text-white">{logs.npcEncounters.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Sources</p>
                        <p className="text-lg font-semibold text-white">{logs.primarySources.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Key Moments</p>
                        <p className="text-lg font-semibold text-white">{historyEvents.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 border-l border-white/10" />
                  {historyEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-white/70">
                      We didn’t detect notable milestones from this session yet. Once you explore, craft, or record more narrative choices, they’ll appear here.
                    </div>
                  ) : (
                    historyEvents.map((event, index) => (
                      <div key={`${event.title}-${event.timestamp}-${index}`} className="relative pb-6 last:pb-0">
                        <div
                          className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border ${event.accent} shadow-lg`}
                        >
                          <event.icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="ml-6 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/50">{event.category}</p>
                            <p className="text-xs text-white/50">{formatTimelineTime(event.timestamp)}</p>
                          </div>
                          <h4 className="mt-2 text-sm font-semibold text-white">{event.title}</h4>
                          {event.description && (
                            <p className="mt-1 text-sm leading-relaxed text-white/80">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[color:var(--surface-muted-border)] bg-[color:var(--surface-muted-bg)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Assessment request payload
                  </p>
                  <pre className="mt-2 max-h-[280px] overflow-auto rounded-xl bg-black/5 p-4 text-xs leading-relaxed text-[color:var(--text-primary)] dark:bg-white/5">
                    {analysisState.request
                      ? JSON.stringify(analysisState.request, null, 2)
                      : 'No request payload available.'}
                  </pre>
                </div>
                <div className="rounded-2xl border border-[color:var(--surface-muted-border)] bg-[color:var(--surface-muted-bg)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Assessment response
                  </p>
                  <pre className="mt-2 max-h-[280px] overflow-auto rounded-xl bg-black/5 p-4 text-xs leading-relaxed text-[color:var(--text-primary)] dark:bg-white/5">
                    {analysisState.result
                      ? JSON.stringify(analysisState.result, null, 2)
                      : 'Assessment has not been generated yet.'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
