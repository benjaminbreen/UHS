/**
 * components/BeliefsPanel.tsx
 * Simple, elegant beliefs UI (core ideology + personal beliefs).
 * - Minimal controls (none).
 * - Lucide icons (auto-mapped by belief text/id), with graceful fallback.
 * - Optional `dense` prop for right sidebar.
 */

import React from 'react';
import { PlayerCharacter, NpcEntity } from '../types';
import { IDEOLOGIES, PERSONAL_BELIEFS } from '../constants/index';
import {
  BookOpen,
  Leaf,
  Skull,
  Sparkles,
  Star,
  Eye,
  Shield,
  Users,
  Coins,
  Hammer,
  Swords,
  Info,
} from 'lucide-react';

interface BeliefsPanelProps {
  character: PlayerCharacter | NpcEntity | null;
  /** Tighten paddings and font sizes (nice for the sidebar) */
  dense?: boolean;
}

/* ------------------------------ Icon Mapping ------------------------------ */

type BeliefDef = typeof PERSONAL_BELIEFS[number];

const iconForBelief = (belief?: BeliefDef) => {
  if (!belief) return Info;
  const id = (belief.id || '').toLowerCase();
  const text = (belief.text || '').toLowerCase();

  const has = (...keys: string[]) => keys.some(k => id.includes(k) || text.includes(k));

  if (has('nature', 'animal', 'forest', 'river', 'wild')) return Leaf;
  if (has('ancestor', 'spirit', 'death', 'afterlife')) return Skull;
  if (has('knowledge', 'learning', 'wisdom', 'tradition', 'lore')) return BookOpen;
  if (has('truth', 'vision', 'clarity', 'honest')) return Eye;
  if (has('community', 'society', 'kin', 'clan', 'people')) return Users;
  if (has('wealth', 'trade', 'commerce', 'coin')) return Coins;
  if (has('craft', 'work', 'labor', 'forge', 'artisan')) return Hammer;
  if (has('valor', 'war', 'battle', 'strength')) return Swords;
  if (has('zeal', 'ardor', 'mystic', 'magic', 'omen')) return Sparkles;
  if (has('hope', 'virtue', 'ideal')) return Star;
  if (has('duty', 'order', 'law', 'oath')) return Shield;

  return Info;
};

const normalizeText = (t: string) =>
  (t || '')
    .replace(/^believes that/i, '')
    .replace(/^believes in/i, '')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());

/* ------------------------------- Component -------------------------------- */

const BeliefsPanel: React.FC<BeliefsPanelProps> = ({ character, dense = false }) => {
  if (!character || !character.ideology) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-800/60 border border-slate-600/50 rounded-xl">
        <Info className="w-8 h-8 mb-2 opacity-60" />
        <p className="text-sm font-semibold mb-1">No Beliefs Yet</p>
        <p className="text-xs opacity-75 text-center max-w-xs">
          Your character’s beliefs and ideology will develop through gameplay.
        </p>
      </div>
    );
  }

  const ideology = IDEOLOGIES.find(i => i.id === character.ideology);

  const personalBeliefs = (character.beliefs || [])
    .map(b => {
      const def = PERSONAL_BELIEFS.find(pb => pb.id === b.beliefId);
      if (!def) return null;
      return {
        id: def.id,
        Icon: iconForBelief(def),
        text: normalizeText(def.text || ''),
        conviction: Math.max(0, Math.min(100, b.conviction ?? 0)),
      };
    })
    .filter(Boolean) as Array<{ id: string; Icon: React.ComponentType<any>; text: string; conviction: number }>;

  const sectionPad = dense ? 'p-3' : 'p-4';
  const cardPad = dense ? 'p-3' : 'p-4';
  const titleSize = dense ? 'text-[11px]' : 'text-xs';
  const bodySize = dense ? 'text-[13px]' : 'text-sm';

  return (
    <div className="h-full flex flex-col bg-slate-800/60 border border-slate-600/50 rounded-xl overflow-hidden">
      <div className={`flex-1 min-h-0 ${dense ? 'p-2' : 'p-3'} overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 space-y-3`}>

        {/* Core Ideology */}
        <section className={`rounded-2xl border border-amber-400/20 ${sectionPad} bg-slate-900/40`}>
          <h4 className={`font-bold tracking-wider text-amber-300 uppercase ${titleSize} pb-2 border-b border-amber-400/20`}>
            Core Ideology
          </h4>
          <div className={`mt-3 rounded-xl bg-slate-900/60 border border-slate-700/50 ${cardPad}`}>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className={`font-semibold text-amber-300 ${dense ? 'text-base' : 'text-lg'} mb-1`}>
                  {ideology?.name || '—'}
                </div>
                <p className={`italic text-slate-300 ${bodySize} leading-relaxed`}>
                  {ideology?.description || '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Beliefs */}
        <section className={`rounded-2xl  ${sectionPad} bg-slate-900/30`}>
          <h4 className={`font-bold tracking-wider text-blue-300 uppercase ${titleSize} pb-2 border-b border-slate-700/60`}>
            Personal Beliefs
          </h4>

          <div className="mt-3 space-y-3">
            {personalBeliefs.length > 0 ? (
              personalBeliefs.map(b => {
                const { Icon } = b;
                return (
                  <div
                    key={b.id}
                    className={`rounded-xl border border-slate-700/60 bg-slate-900/50 shadow-sm ${cardPad}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 mt-0.5 shrink-0 text-slate-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-slate-100 font-semibold leading-snug ${dense ? 'text-[14px]' : 'text-base'}`}>
                          {b.text}
                        </div>

                        {/* Conviction */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className={`${dense ? 'text-[11px]' : 'text-sm'} font-medium`}>Conviction</span>
                            <span className={`${dense ? 'text-[12px]' : 'text-sm'} font-bold text-slate-100`}>{b.conviction}%</span>
                          </div>
                          <div className="h-2 mt-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${b.conviction}%`,
                                background:
                                  'linear-gradient(90deg, rgba(59,130,246,0.85), rgba(34,211,238,0.95))',
                                boxShadow: '0 0 10px rgba(59,130,246,0.35)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`rounded-xl border border-slate-700/60 bg-slate-900/40 ${cardPad} text-center`}>
                <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-60" />
                <p className={`italic text-slate-500 ${dense ? 'text-[12px]' : 'text-sm'}`}>
                  No strong personal beliefs recorded yet.
                </p>
                {!dense && (
                  <p className="text-xs text-slate-600 mt-1">
                    Beliefs develop through your actions and choices.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BeliefsPanel;
