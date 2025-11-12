import React from 'react';
import { ExpeditionCardState, KnowledgeState, ActiveCardEffects } from '../../engine/ruins/expedition';

interface ExpeditionPanelProps {
    cards: ExpeditionCardState[];
    onPlayCard: (cardId: string) => void;
    knowledge: KnowledgeState;
    activeEffects: ActiveCardEffects;
}

const effectLabels: Partial<Record<keyof ActiveCardEffects, string>> = {
    revealRoom: 'Revealing Rooms',
    translationBoost: 'Translation Boost',
    combatAdvantage: 'Combat Advantage'
};

export const ExpeditionPanel: React.FC<ExpeditionPanelProps> = ({
    cards,
    onPlayCard,
    knowledge,
    activeEffects
}) => {
    const activeEffectList = (Object.keys(activeEffects) as (keyof ActiveCardEffects)[])
        .filter(key => activeEffects[key]);

    return (
        <div className="bg-slate-900/85 border border-amber-700/40 rounded-lg shadow-xl w-70 p-4 text-xs"
             style={{ fontFamily: 'monospace' }}>
            <h3 className="text-lg font-bold text-amber-300 mb-3 tracking-wide">
                Expedition Controls
            </h3>

            <div className="mb-4">
                <div className="flex items-center justify-between text-amber-200 mb-1">
                    <span>Knowledge</span>
                    <span>{knowledge.score}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded">
                    <div
                        className="h-2 rounded bg-amber-400 transition-all"
                        style={{ width: `${Math.min(knowledge.score, 100)}%` }}
                    />
                </div>
                {knowledge.tags.length > 0 && (
                    <div className="mt-2 text-xs text-amber-100">
                        <span className="font-semibold">Focus:</span>{' '}
                        {knowledge.tags.join(', ')}
                    </div>
                )}
            </div>

            {activeEffectList.length > 0 && (
                <div className="mb-3 text-xs text-emerald-300">
                    <div className="font-semibold uppercase tracking-wide text-emerald-200 mb-1">
                        Active Effects
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                        {activeEffectList.map(effect => (
                            <li key={effect}>{effectLabels[effect]}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="space-y-2">
                {cards.map(({ card, unlocked, used }) => (
                    <button
                        key={card.id}
                        onClick={() => onPlayCard(card.id)}
                        disabled={!unlocked || used}
                        className="w-full text-left border border-amber-600/40 rounded px-3 py-2 transition-colors"
                        style={{
                            backgroundColor: used ? 'rgba(100, 116, 139, 0.3)' : unlocked ? 'rgba(251, 191, 36, 0.12)' : 'rgba(30, 41, 59, 0.6)',
                            color: unlocked ? '#fbbf24' : '#64748b',
                            cursor: unlocked && !used ? 'pointer' : 'not-allowed'
                        }}
                    >
                        <div className="text-sm font-semibold flex justify-between items-center">
                            <span>{card.name}</span>
                            {!unlocked && <span className="text-xs text-amber-200">Locked</span>}
                            {used && <span className="text-xs text-amber-200">Used</span>}
                        </div>
                        <div className="text-xs mt-1 text-amber-100/90">
                            {card.description}
                        </div>
                        {card.unlockCondition && (
                            <div className="text-xs mt-2 text-amber-200/80 italic">
                                Unlock: {card.unlockCondition}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
