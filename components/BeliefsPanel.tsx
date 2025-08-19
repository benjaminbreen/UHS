/**
 * components/BeliefsPanel.tsx - A reusable component to display character beliefs.
 */
import React from 'react';
import { PlayerCharacter, NpcEntity } from '../types';
import { IDEOLOGIES, PERSONAL_BELIEFS } from '../constants/index';

interface BeliefsPanelProps {
    character: PlayerCharacter | NpcEntity | null;
}

const BeliefsPanel: React.FC<BeliefsPanelProps> = ({ character }) => {
    if (!character || !character.ideology) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-slate-800/60 border border-slate-600/50 rounded-xl">
            <div className="mb-3 text-4xl opacity-50">🤔</div>
            <p className="text-sm font-semibold mb-2">No Beliefs Yet</p>
            <p className="text-xs opacity-75 text-center max-w-xs">Your character's beliefs and ideology will develop through gameplay.</p>
          </div>
        );
    }
    
    const ideology = IDEOLOGIES.find(ideo => ideo.id === character.ideology);
    const personalBeliefs = character.beliefs
        .map(b => {
            const beliefDef = PERSONAL_BELIEFS.find(pb => pb.id === b.beliefId);
            return beliefDef ? { ...beliefDef, conviction: b.conviction } : null;
        })
        .filter(b => b !== null) as (typeof PERSONAL_BELIEFS[0] & { conviction: number })[];

    return (
        <div className="h-full flex flex-col bg-slate-800/60 border border-slate-600/50 rounded-xl overflow-hidden">
            <div className="flex-1 min-h-0 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 space-y-3">
                {ideology && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                        <h4 className="pb-1 mb-2 text-xs font-bold tracking-wider text-amber-300 uppercase border-b border-amber-400/30 flex items-center gap-2">
                            Core Ideology
                        </h4>
                        <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-700/30">
                            <h5 className="font-semibold text-sm text-amber-400 mb-1">{ideology.name}</h5>
                            <p className="text-xs italic text-slate-300 leading-relaxed">{ideology.description}</p>
                        </div>
                    </div>
                )}
                
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                    <h4 className="pb-1 mb-2 text-xs font-bold tracking-wider text-blue-300 uppercase border-b border-blue-400/30 flex items-center gap-2">
                        Personal Beliefs
                    </h4>
                    <div className="space-y-2">
                        {personalBeliefs.length > 0 ? personalBeliefs.map(belief => (
                            <div key={belief.id} className="p-2 rounded-lg bg-slate-700/30 border border-slate-600/40 hover:bg-slate-700/50 transition-colors duration-200">
                                <p className="font-semibold text-slate-200 flex items-center gap-2 mb-2 text-xs">
                                    <span className="text-sm">{belief.icon}</span>
                                    <span className="leading-relaxed">{belief.text?.replace('Believes that', '').replace('Believes in', '').trim().replace(/^\w/, c => c.toUpperCase())}</span>
                                </p>
                                <div className="text-xs">
                                    <div className="flex justify-between items-center text-slate-400 mb-1">
                                        <span className="font-medium">Conviction</span>
                                        <span className="font-bold text-blue-300">{belief.conviction}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out" 
                                            style={{ width: `${belief.conviction}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-6">
                                <div className="text-2xl mb-2 opacity-50">💭</div>
                                <p className="italic text-slate-500 text-xs">No strong personal beliefs recorded yet.</p>
                                <p className="text-xs text-slate-600 mt-1">Beliefs develop through your actions and choices.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BeliefsPanel;
