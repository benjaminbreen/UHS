import React, { useEffect, useState } from 'react';
import { Disease, PlayerCharacter } from '../types';
import { DISEASE_QUOTES } from '../constants/gameData/diseaseQuotes';
import { culturalMedicalKnowledge } from '../services/culturalMedicalKnowledge';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import { Scroll } from 'lucide-react';

interface DiseaseContractedModalProps {
  isOpen: boolean;
  onClose: () => void;
  disease: Disease;
  playerCharacter: PlayerCharacter;
  gameDate?: { year: number; month: number; day: number };
}

const DiseaseContractedModal: React.FC<DiseaseContractedModalProps> = ({ 
  isOpen, 
  onClose, 
  disease, 
  playerCharacter,
  gameDate 
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
    
    // Get a real historical quote based on era
    const historicalEra = (era || 'Medieval').toUpperCase().replace(' ', '_') as HistoricalEra;
    const historicalQuote = culturalMedicalKnowledge.getHistoricalQuote(historicalEra);
    setQuote(historicalQuote);
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
    <div
      data-surface="modal-overlay"
      className="modal-overlay theme-surface z-[9999]"
      onClick={onClose}
    >
      <div 
        data-surface="modal-panel"
        className="modal-content theme-surface max-w-2xl p-0 overflow-hidden bg-gradient-to-b from-red-950/95 to-slate-900/95 border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]" 
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
            <div className="bg-gradient-to-r from-amber-900/20 to-gray-800/50 rounded-lg p-4 border border-amber-700/30">
              <p className="text-amber-100 italic text-sm leading-relaxed">
                {quote}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                — Historical Account, {playerCharacter.era || 'Medieval'} Period
              </p>
            </div>
          )}

          {/* Symptoms */}
          <div className="bg-slate-800/30 p-4 rounded-lg">
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-yellow-500">🩺</span> Symptoms You May Experience:
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

          {/* Historical Perception - How the character understands their illness */}
          {(() => {
            // Determine cultural zone from player character location or default
            const culturalZone = (playerCharacter.culturalZone || playerCharacter.culture || 'EUROPEAN') as CulturalZone;
            const historicalEra = ((playerCharacter.era || 'Medieval').toUpperCase().replace(' ', '_')) as HistoricalEra;
            const year = gameDate?.year || parseInt(playerCharacter.birthYear || '1500') || 1500;
            
            const medicalResponse = culturalMedicalKnowledge.getCulturalMedicalResponse({
              era: historicalEra,
              zone: culturalZone,
              year: year,
              disease: disease,
              severity: disease.severity
            });
            const urgency = culturalMedicalKnowledge.getUrgencyModifier(disease.severity);
            
            return (
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Scroll className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-purple-400">Historical Perception</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Your Understanding:</p>
                    <p className="text-gray-200 text-sm italic">"{medicalResponse.characterPerception}"</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3 border border-yellow-800/30">
                    <p className="text-yellow-300 text-xs font-semibold mb-1">⚠️ Seek Treatment {urgency.toUpperCase()}</p>
                    <p className="text-gray-300 text-sm">{medicalResponse.recommendedAction}</p>
                    <p className="text-gray-400 text-xs mt-1">Look for: <span className="text-gray-200">{medicalResponse.practitionerTitle}</span></p>
                  </div>
                </div>
              </div>
            );
          })()}

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
