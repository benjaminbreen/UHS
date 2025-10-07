/**
 * components/LifeEventsCalendarModal.tsx
 * Simple calendar showing character's major life events
 */

import React, { useMemo } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface LifeEvent {
  year: number;
  event: string;
}

interface LifeEventsCalendarModalProps {
  characterName: string;
  birthYear: number;
  currentYear: number;
  lifeEvents: LifeEvent[];
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const LifeEventsCalendarModal: React.FC<LifeEventsCalendarModalProps> = ({
  characterName,
  birthYear,
  currentYear,
  lifeEvents,
  onClose,
}) => {
  const [selectedYear, setSelectedYear] = React.useState(currentYear);

  // Get events for selected year
  const eventsThisYear = useMemo(() => {
    return lifeEvents.filter(e => e.year === selectedYear);
  }, [lifeEvents, selectedYear]);

  // Get age in selected year
  const ageInYear = selectedYear - birthYear;

  // Determine year range based on life events
  const yearRange = useMemo(() => {
    const years = lifeEvents.map(e => e.year);
    const minYear = Math.min(birthYear, ...years);
    const maxYear = Math.max(currentYear, ...years);
    return { minYear, maxYear };
  }, [lifeEvents, birthYear, currentYear]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-slate-900/85 to-black/80 backdrop-blur-md" />

      {/* Modal Container */}
      <div
        className="relative bg-gradient-to-br from-slate-800/95 via-slate-850/95 to-slate-900/95 rounded-3xl shadow-2xl border border-blue-500/20 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Elegant glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-purple-900/40 border-b border-blue-500/20 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-xl shadow-lg border border-blue-400/30">
                <Calendar className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  Life Events
                </h2>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {characterName}'s Journey
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group relative p-3 bg-slate-700/40 hover:bg-red-600/60 rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-red-500/40"
            >
              <X className="w-5 h-5 text-slate-300 group-hover:text-red-200 transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Year Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedYear(Math.max(yearRange.minYear, selectedYear - 1))}
                disabled={selectedYear <= yearRange.minYear}
                className="group p-3 bg-slate-700/40 hover:bg-slate-600/60 disabled:bg-slate-800/20 disabled:cursor-not-allowed rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-blue-500/40"
              >
                <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-300 transition-colors" />
              </button>

              <div className="text-center">
                <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  {Math.abs(selectedYear)} {selectedYear < 0 ? 'BCE' : 'CE'}
                </h3>
                {selectedYear >= birthYear && (
                  <p className="text-sm text-slate-400 mt-2">
                    Age {ageInYear} {selectedYear === currentYear ? '(Current)' : ''}
                  </p>
                )}
                {selectedYear === birthYear && (
                  <p className="text-xs text-blue-400 mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Birth Year
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedYear(Math.min(yearRange.maxYear, selectedYear + 1))}
                disabled={selectedYear >= yearRange.maxYear}
                className="group p-3 bg-slate-700/40 hover:bg-slate-600/60 disabled:bg-slate-800/20 disabled:cursor-not-allowed rounded-xl transition-all duration-300 border border-slate-600/40 hover:border-blue-500/40"
              >
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-300 transition-colors" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{
                  width: `${((selectedYear - yearRange.minYear) / (yearRange.maxYear - yearRange.minYear)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Events for this year */}
          <div className="space-y-4">
            {eventsThisYear.length > 0 ? (
              eventsThisYear.map((event, idx) => (
                <div
                  key={idx}
                  className="group relative bg-gradient-to-r from-slate-700/40 to-slate-700/20 hover:from-slate-700/60 hover:to-slate-700/40 rounded-xl p-6 border border-slate-600/40 hover:border-blue-500/40 transition-all duration-300 shadow-lg"
                >
                  {/* Animated shimmer on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-xl" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/40 flex items-center justify-center">
                      <span className="text-lg">📅</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-slate-200 leading-relaxed">
                        {event.event}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                  <Calendar className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400">
                  No recorded events for this year
                </p>
              </div>
            )}
          </div>

          {/* Timeline overview */}
          {lifeEvents.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Timeline Overview
              </h4>
              <div className="flex flex-wrap gap-2">
                {lifeEvents.map((event, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedYear(event.year)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedYear === event.year
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                        : 'bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50 hover:text-slate-300'
                    }`}
                  >
                    {Math.abs(event.year)} {event.year < 0 ? 'BCE' : 'CE'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LifeEventsCalendarModal;
