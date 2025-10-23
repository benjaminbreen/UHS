import React from 'react';
import { Sparkles, BookOpenCheck, Users, MessageSquareText, Clock3, ArrowRight, X } from 'lucide-react';
import { AssessmentSession, AssessmentSummary } from '../types/assessment';

interface SessionCompletionModalProps {
  isOpen: boolean;
  session: AssessmentSession | null;
  summary: AssessmentSummary | null;
  onClose: () => void;
  onViewAssessment: () => void;
}

const metricCard = (
  label: string,
  value: string | number,
  description: string,
  icon: React.ReactNode
) => (
  <div className="rounded-2xl border border-[color:var(--surface-muted-border)] bg-[color:var(--surface-muted-bg)]/75 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--accent-primary)]/15 text-[color:var(--accent-primary)]">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</p>
        <p className="text-2xl font-semibold text-[color:var(--text-primary)]">{value}</p>
      </div>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">{description}</p>
  </div>
);

const formatDuration = (ms?: number | null) => {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  isOpen,
  session,
  summary,
  onClose,
  onViewAssessment
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,#334155_0%,#0f172a_45%,#020617_100%)] opacity-95"
        onClick={onClose}
      />
      <div className="relative z-[180] w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 shadow-[0_40px_80px_rgba(2,6,23,0.55)]">
        <div className="relative bg-[rgba(15,23,42,0.92)] backdrop-blur-xl">
          <div className="absolute inset-x-0 -top-28 h-56 bg-[radial-gradient(circle,rgba(94,234,212,0.25)_0%,rgba(37,99,235,0)_70%)]" />
          <div className="relative px-8 pt-8 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/80">Session Complete</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {session?.context?.role || 'Educational Playthrough'}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                  You wrapped this session in{' '}
                  <span className="font-semibold text-emerald-200">{formatDuration(summary?.durationMs)}</span>,
                  engaging with the world as a historically grounded character. Review the assessment report for a deeper
                  qualitative analysis before continuing your journey.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-8 pb-8 sm:grid-cols-2">
            {metricCard(
              'Primary Sources',
              summary?.primarySourceInteractionCount ?? 0,
              'Times you opened, annotated, or referenced primary documents.',
              <BookOpenCheck className="h-5 w-5" />
            )}
            {metricCard(
              'NPC Encounters',
              summary?.npcEncounterCount ?? 0,
              'Distinct conversations and interactions recorded with historical actors.',
              <Users className="h-5 w-5" />
            )}
            {metricCard(
              'Player Dialogue',
              summary?.playerInputCount ?? 0,
              'Individual narration entries you contributed to shape events.',
              <MessageSquareText className="h-5 w-5" />
            )}
            {metricCard(
              'Session Length',
              formatDuration(summary?.durationMs),
              'Approximate in-world duration covered during this session.',
              <Clock3 className="h-5 w-5" />
            )}
          </div>

          <div className="border-t border-white/10 bg-white/5 px-8 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">Ready for the assessment summary?</p>
                  <p className="text-xs text-slate-300">
                    View AI-assisted scoring, narrative highlights, and recommendations.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  onClick={onClose}
                >
                  Continue Exploring
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-[0_18px_36px_rgba(52,211,153,0.28)] transition hover:bg-emerald-300"
                  onClick={onViewAssessment}
                >
                  View Assessment
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCompletionModal;

