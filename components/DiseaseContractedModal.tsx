import React, { useEffect, useState } from 'react';
import { Disease, PlayerCharacter } from '../types';
import { DISEASE_QUOTES } from '../constants/gameData/diseaseQuotes';

interface DiseaseContractedModalProps {
  isOpen: boolean;
  onClose: () => void;
  disease: Disease;
  playerCharacter: PlayerCharacter;
}

const DiseaseContractedModal: React.FC<DiseaseContractedModalProps> = ({ 
  isOpen, 
  onClose, 
  disease, 
  playerCharacter 
}) => {
  const [survivalRate, setSurvivalRate] = useState<number>(50);
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    if (!disease || !playerCharacter) return;

    // Calculate historically accurate survival rate
    let baseRate = 100 - (disease.mortalityRate * 100);
    
    // Age factors
    const age = playerCharacter.age;
    if (age < 5) {
      baseRate *= 0.5; // Young children had much lower survival rates
    } else if (age < 10) {
      baseRate *= 0.7;
    } else if (age > 60) {
      baseRate *= 0.6; // Elderly also vulnerable
    } else if (age > 50) {
      baseRate *= 0.8;
    }
    
    // Constitution affects survival
    const constitution = playerCharacter.stats?.constitution || 10;
    if (constitution < 8) {
      baseRate *= 0.7; // Weak constitution
    } else if (constitution > 14) {
      baseRate *= 1.2; // Strong constitution
    }
    
    // Social class affects access to care
    if (playerCharacter.class === 'Noble' || playerCharacter.class === 'Merchant') {
      baseRate *= 1.3; // Better care and nutrition
    } else if (playerCharacter.class === 'Peasant') {
      baseRate *= 0.8; // Poor nutrition and no medical care
    }
    
    // Era affects medical knowledge
    const era = playerCharacter.era || playerCharacter.historicalEra;
    if (era === 'Medieval' || era === 'Classical' || era === 'Ancient') {
      baseRate *= 0.8; // Less medical knowledge
    } else if (era === 'Modern' || era === 'Contemporary') {
      baseRate *= 1.5; // Modern medicine
    }
    
    // Cap between 1% and 99%
    setSurvivalRate(Math.max(1, Math.min(99, Math.round(baseRate))));
    
    // Get a relevant quote if available
    const diseaseQuotes = DISEASE_QUOTES?.[disease.id] || [];
    if (diseaseQuotes.length > 0) {
      setQuote(diseaseQuotes[Math.floor(Math.random() * diseaseQuotes.length)]);
    } else {
      // Fallback quotes
      const fallbackQuotes = [
        "The pestilence spread through the town like wildfire, sparing neither rich nor poor.",
        "Many fell ill with the terrible disease, and the physicians could offer no remedy.",
        "The sickness came upon them suddenly, and within days many were confined to their beds.",
        "It was a plague most grievous, and all who could fled from the afflicted areas."
      ];
      setQuote(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]);
    }
  }, [disease, playerCharacter]);

  if (!isOpen || !disease) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'severe': return 'text-orange-500';
      case 'moderate': return 'text-yellow-500';
      case 'mild': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div 
        className="modal-content max-w-2xl p-0 overflow-hidden bg-gradient-to-b from-red-950/95 to-slate-900/95 border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Emergency Header */}
        <div className="bg-red-900/80 border-b-2 border-red-600 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">{disease.badgeIcon || '⚠️'}</span>
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                  Disease Contracted!
                </h2>
                <p className="text-red-200 text-sm">Immediate Medical Attention Required</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Disease Information */}
        <div className="p-6 space-y-4">
          {/* Disease Name and Type */}
          <div className="text-center pb-4 border-b border-red-800/50">
            <h3 className="text-3xl font-bold text-red-400 mb-2">
              {disease.name}
            </h3>
            <p className={`text-lg font-semibold ${getSeverityColor(disease.severity)} uppercase tracking-wider`}>
              {disease.severity} {disease.type} disease
            </p>
          </div>

          {/* Historical Quote */}
          {quote && (
            <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-amber-600">
              <p className="text-amber-200 italic text-sm leading-relaxed">
                "{quote}"
              </p>
              <p className="text-amber-600 text-xs mt-2">
                — Historical Account, {playerCharacter.era || 'Historical'} Period
              </p>
            </div>
          )}

          {/* Symptoms */}
          <div className="bg-slate-800/30 p-4 rounded-lg">
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-yellow-500">🩺</span> Symptoms You Are Experiencing:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {disease.symptoms?.map((symptom, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{symptom.name}</p>
                    <p className="text-gray-400 text-xs">{symptom.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Survival Rate */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-4 rounded-lg border border-slate-700">
              <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Historical Survival Rate</h5>
              <p className={`text-2xl font-bold ${
                survivalRate > 70 ? 'text-green-400' : 
                survivalRate > 40 ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {survivalRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Based on your age ({playerCharacter.age}), {playerCharacter.class} class, and constitution
              </p>
            </div>

            {/* Virality */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-4 rounded-lg border border-slate-700">
              <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Transmission Rate</h5>
              <p className="text-2xl font-bold text-orange-400">
                {Math.round((disease.baseTransmissionRate || 0.1) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {disease.transmissionVector} transmission
              </p>
            </div>

            {/* Duration */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-4 rounded-lg border border-slate-700">
              <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Expected Duration</h5>
              <p className="text-2xl font-bold text-blue-400">
                {disease.durationDays} days
              </p>
              <p className="text-xs text-gray-500 mt-1">
                If you survive the illness
              </p>
            </div>
          </div>

          {/* Stat Effects */}
          <div className="bg-red-950/30 p-4 rounded-lg border border-red-800/50">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-red-500">📉</span> Effects on Your Abilities:
            </h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {disease.statEffects && Object.entries(disease.statEffects).map(([stat, effect]) => (
                effect !== 0 && (
                  <div key={stat} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{stat}:</span>
                    <span className={effect < 0 ? 'text-red-400' : 'text-green-400'}>
                      {effect > 0 ? '+' : ''}{effect}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-900/20 border border-red-600/50 p-4 rounded-lg">
            <p className="text-red-300 text-sm text-center font-semibold">
              ⚠️ Seek immediate treatment! Avoid contact with others to prevent spreading the disease.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg"
          >
            I Understand the Risks
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiseaseContractedModal;