/**
 * components/factory/ContractNegotiationModal.tsx
 * Negotiate work contract with factory overseer before starting shift
 */

import React, { useState, useMemo } from 'react';
import { PlayerCharacter, NpcEntity } from '../../types';
import { FactoryType } from '../../constants/gameData/factoryTypes';
import { FactoryContract } from './FactoryLaborPanel';
import { DollarSign, Clock, Target, Coffee, TrendingUp, TrendingDown } from 'lucide-react';

interface ContractNegotiationModalProps {
  factoryType: FactoryType;
  factoryName: string;
  playerCharacter: PlayerCharacter;
  overseerNpc?: NpcEntity; // Optional - will use default if not provided
  onAccept: (contract: FactoryContract) => void;
  onDecline: () => void;
}

export const ContractNegotiationModal: React.FC<ContractNegotiationModalProps> = ({
  factoryType,
  factoryName,
  playerCharacter,
  overseerNpc,
  onAccept,
  onDecline
}) => {
  // Defensive check - ensure overseerNpc is never undefined
  const safeOverseerNpc = overseerNpc || {
    id: 'default-overseer',
    name: 'Factory Overseer',
    occupation: 'overseer',
    gender: 'male' as const,
    age: 45,
    health: 100,
    position: { x: 0, y: 0 },
    socialClass: 'bourgeoisie' as const,
    mood: 'neutral' as const,
    isHostile: false
  } as NpcEntity;

  // Calculate base offer based on factory type and player skills
  const baseOffer = useMemo(() => {
    const wageMap = {
      'subsistence': 0.10,
      'low': 0.25,
      'medium': 0.50,
      'high': 1.00
    };

    const baseWage = wageMap[factoryType.wageLevel] || 0.25;

    // Adjust for player skills/reputation
    const skillBonus = ((playerCharacter.stats?.dexterity || 10) - 10) * 0.02;
    const reputationBonus = ((playerCharacter.reputation || 50) - 50) * 0.001;

    return {
      hourlyWage: Math.max(0.10, baseWage + skillBonus + reputationBonus),
      shiftLength: factoryType.workingConditions?.hoursPerDay || 12,
      breakTime: 30,
      quotaRequired: Math.floor((factoryType.productionRate || 100) * 0.8),
      bonusRate: 1.2,
      penaltyRate: 0.8
    };
  }, [factoryType, playerCharacter]);

  const [counterOffer, setCounterOffer] = useState<Partial<FactoryContract>>({});
  const [negotiationAttempts, setNegotiationAttempts] = useState(0);
  const [overseerMood, setOverseerMood] = useState<'neutral' | 'pleased' | 'annoyed' | 'hostile'>('neutral');

  // Current offer (base + counter adjustments)
  const currentOffer: FactoryContract = {
    ...baseOffer,
    ...counterOffer
  };

  // Calculate negotiation success chance
  const getNegotiationChance = (aspect: keyof FactoryContract, increase: number) => {
    let baseChance = 0.4;

    // Player charisma/intelligence affects success
    if (playerCharacter.stats?.charisma) {
      baseChance += (playerCharacter.stats.charisma - 10) * 0.03;
    }

    // Mood affects success
    const moodModifier = {
      'neutral': 0,
      'pleased': 0.15,
      'annoyed': -0.15,
      'hostile': -0.40
    };
    baseChance += moodModifier[overseerMood];

    // More attempts = harder
    baseChance -= negotiationAttempts * 0.1;

    // Smaller increases = easier
    baseChance -= increase * 0.5;

    return Math.max(0.1, Math.min(0.9, baseChance));
  };

  // Attempt negotiation
  const attemptNegotiation = (aspect: keyof FactoryContract, change: number) => {
    const chance = getNegotiationChance(aspect, Math.abs(change / (currentOffer[aspect] as number)));
    setNegotiationAttempts(prev => prev + 1);

    if (Math.random() < chance) {
      // Success
      setCounterOffer(prev => ({
        ...prev,
        [aspect]: (currentOffer[aspect] as number) + change
      }));

      if (negotiationAttempts === 0) {
        setOverseerMood('pleased');
      }

      return true;
    } else {
      // Failure
      if (negotiationAttempts >= 2) {
        setOverseerMood('hostile');
      } else if (negotiationAttempts >= 1) {
        setOverseerMood('annoyed');
      }

      return false;
    }
  };

  // Overseer dialogue based on mood
  const getOverseerDialogue = () => {
    const name = safeOverseerNpc.name;

    if (overseerMood === 'hostile') {
      return `${name} glares at you coldly. "You're pushing your luck. Take it or leave it—and if you leave, don't come back."`;
    } else if (overseerMood === 'annoyed') {
      return `${name} frowns impatiently. "I've made my offer. You're starting to waste my time."`;
    } else if (overseerMood === 'pleased') {
      return `${name} nods approvingly. "You drive a hard bargain. I respect that."`;
    } else {
      return `${name} looks you over. "Here's what I'm offering. You can try to negotiate if you think you're worth more."`;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-amber-500/40 shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/40 px-6 py-4 border-b border-amber-700/30">
          <h2 className="text-2xl font-bold text-amber-300">Contract Negotiation</h2>
          <p className="text-sm text-slate-300 mt-1">{factoryName}</p>
        </div>

        {/* Overseer */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-3xl">
              👨‍💼
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-lg">{safeOverseerNpc.name}</div>
              <div className="text-sm text-slate-400">{safeOverseerNpc.occupation || 'Factory Overseer'}</div>
              <div className="text-xs text-slate-500 mt-1 italic">{getOverseerDialogue()}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              overseerMood === 'pleased' ? 'bg-green-900/30 text-green-300 border border-green-700/50' :
              overseerMood === 'hostile' ? 'bg-red-900/30 text-red-300 border border-red-700/50' :
              overseerMood === 'annoyed' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' :
              'bg-slate-700/30 text-slate-300 border border-slate-600/50'
            }`}>
              {overseerMood.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Contract Terms */}
        <div className="px-6 py-5 space-y-4">
          {/* Hourly Wage */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-white">Hourly Wage</span>
              </div>
              <span className="text-2xl font-bold text-green-400">
                ${currentOffer.hourlyWage.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => attemptNegotiation('hourlyWage', 0.05)}
                disabled={overseerMood === 'hostile'}
                className="flex-1 py-2 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded text-sm font-semibold border border-green-700/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +$0.05/hr
              </button>
              <button
                onClick={() => attemptNegotiation('hourlyWage', 0.10)}
                disabled={overseerMood === 'hostile' || negotiationAttempts >= 2}
                className="flex-1 py-2 px-3 bg-green-700/20 hover:bg-green-700/30 text-green-300 rounded text-sm font-semibold border border-green-800/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +$0.10/hr (risky)
              </button>
            </div>
          </div>

          {/* Shift Length */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-white">Shift Length</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">
                {currentOffer.shiftLength} hours
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => attemptNegotiation('shiftLength', -1)}
                disabled={overseerMood === 'hostile' || currentOffer.shiftLength <= 8}
                className="flex-1 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-sm font-semibold border border-blue-700/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <TrendingDown className="w-4 h-4 inline mr-1" />
                -1 hour
              </button>
            </div>
          </div>

          {/* Break Time */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white">Break Time</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {currentOffer.breakTime} min
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => attemptNegotiation('breakTime', 15)}
                disabled={overseerMood === 'hostile'}
                className="flex-1 py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded text-sm font-semibold border border-purple-700/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +15 min
              </button>
            </div>
          </div>

          {/* Quota */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">Daily Quota</span>
              </div>
              <span className="text-2xl font-bold text-amber-400">
                {currentOffer.quotaRequired} units
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Bonus: {(currentOffer.bonusRate * 100).toFixed(0)}% pay for exceeding quota •
              Penalty: {(currentOffer.penaltyRate * 100).toFixed(0)}% pay for missing quota
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/30 text-xs text-blue-300">
            <strong>Tip:</strong> Each negotiation attempt is harder. Your charisma and reputation affect success chance.
            Push too hard and the overseer may refuse to hire you!
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
          >
            Decline & Leave
          </button>
          <button
            onClick={() => onAccept(currentOffer)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-semibold transition-all shadow-lg"
          >
            Accept Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractNegotiationModal;
