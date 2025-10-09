/**
 * components/factory/FactoryWorkersTab.tsx
 * Workers tab for factory panel - shows fellow workers and social interactions
 */

import React from 'react';
import { Users, Heart, Shield, AlertCircle } from 'lucide-react';
import { NpcEntity } from '../../types';

interface FactoryWorkersTabProps {
  nearbyNpcs: NpcEntity[];
  coworkerRelations?: Record<string, number>; // NPC ID -> relationship score
}

export const FactoryWorkersTab: React.FC<FactoryWorkersTabProps> = ({
  nearbyNpcs,
  coworkerRelations = {}
}) => {
  const getRelationshipLabel = (score: number) => {
    if (score >= 80) return { label: 'Trusted Friend', color: 'text-green-400', bg: 'bg-green-900/20' };
    if (score >= 60) return { label: 'Friendly', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (score >= 40) return { label: 'Neutral', color: 'text-slate-400', bg: 'bg-slate-800/20' };
    if (score >= 20) return { label: 'Wary', color: 'text-amber-400', bg: 'bg-amber-900/20' };
    return { label: 'Hostile', color: 'text-red-400', bg: 'bg-red-900/20' };
  };

  const overseers = nearbyNpcs.filter(npc => npc.occupation?.toLowerCase().includes('overseer') || npc.occupation?.toLowerCase().includes('foreman'));
  const workers = nearbyNpcs.filter(npc => !overseers.includes(npc));

  return (
    <div className="space-y-6">
      {/* Overseers/Management */}
      {overseers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-red-300">Management</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {overseers.map(npc => {
              const relation = getRelationshipLabel(coworkerRelations[npc.id] || 50);
              return (
                <div
                  key={npc.id}
                  className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl p-5 border border-red-700/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{npc.name}</h3>
                      <p className="text-sm text-red-300">{npc.occupation}</p>
                    </div>
                    <div className="text-2xl">👔</div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Age:</span>
                      <span className="text-white">{npc.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="text-white">{npc.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mood:</span>
                      <span className={relation.color}>{relation.label}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-red-700/30">
                    <p className="text-xs text-slate-400 italic">
                      "Keep up the pace or there'll be consequences."
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fellow Workers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-blue-300">Fellow Workers</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {workers.slice(0, 12).map(npc => {
            const relation = getRelationshipLabel(coworkerRelations[npc.id] || 50);
            return (
              <div
                key={npc.id}
                className={`${relation.bg} rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm">{npc.name}</h3>
                    <p className="text-xs text-slate-400">{npc.occupation}</p>
                  </div>
                  <div className="text-xl">
                    {npc.gender === 'Male' ? '👨' : '👩'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Age {npc.age}</span>
                  <div className="flex items-center gap-1">
                    <Heart className={`w-3 h-3 ${relation.color}`} />
                    <span className={relation.color}>{coworkerRelations[npc.id] || 50}</span>
                  </div>
                </div>

                {/* Relationship bar */}
                <div className="mt-2 h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (coworkerRelations[npc.id] || 50) >= 60
                        ? 'bg-green-500'
                        : (coworkerRelations[npc.id] || 50) >= 40
                        ? 'bg-blue-500'
                        : (coworkerRelations[npc.id] || 50) >= 20
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${coworkerRelations[npc.id] || 50}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Dynamics Info */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Social Dynamics</h3>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-slate-300">
            Your relationships with coworkers affect factory life. Helping others builds trust, while ignoring
            their struggles can lead to isolation.
          </p>
          <p className="text-slate-400 text-xs">
            Management relationships determine how strictly rules are enforced and whether you get opportunities
            for advancement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FactoryWorkersTab;
