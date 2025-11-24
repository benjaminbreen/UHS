import React, { useState, useEffect } from 'react';
import { X, Activity, TrendingUp, Heart, AlertTriangle, Zap, BookOpen, CheckCircle, Scroll } from 'lucide-react';
import { ActiveDisease } from '../types/diseaseTypes';
import { primarySourceService } from '../services/primarySourceService';
import { culturalMedicalKnowledge } from '../services/culturalMedicalKnowledge';
import { HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';

interface DiseaseModalProps {
  disease?: ActiveDisease;
  isOpen: boolean;
  onClose: () => void;
  currentYear?: number;
  culturalZone?: string;
  historicalEra?: HistoricalEra;
  mode?: 'active' | 'recovery';
  recoveredDiseaseName?: string;
}

const DiseaseModal: React.FC<DiseaseModalProps> = ({ 
  disease, 
  isOpen, 
  onClose,
  currentYear = 1500,
  culturalZone = 'EUROPEAN',
  historicalEra = 'MEDIEVAL',
  mode = 'active',
  recoveredDiseaseName
}) => {
  const [primarySource, setPrimarySource] = useState<string>('');
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  useEffect(() => {
    if (isOpen && disease) {
      loadPrimarySource();
    }
  }, [isOpen, disease]);

  const loadPrimarySource = async () => {
    setIsLoadingSource(true);
    try {
      // Get a real historical quote about fever/disease
      const historicalQuote = culturalMedicalKnowledge.getHistoricalQuote(historicalEra);
      setPrimarySource(historicalQuote);
    } catch (error) {
      console.error('Failed to load primary source:', error);
      setPrimarySource('The fever burns within you.');
    }
    setIsLoadingSource(false);
  };

  if (!isOpen) return null;
  
  // Recovery mode - show recovery announcement
  if (mode === 'recovery') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border border-green-600">
          {/* Recovery Header */}
          <div className="bg-gradient-to-r from-green-900/50 to-gray-900 p-6 rounded-t-lg border-b border-gray-700">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Recovery!</h2>
                <p className="text-green-300 mt-1">You have recovered from {recoveredDiseaseName || 'your illness'}</p>
              </div>
            </div>
          </div>

          {/* Recovery Content */}
          <div className="p-6 space-y-4">
            <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/50">
              <p className="text-green-300 text-center">
                Your body has fought off the disease. You feel weak but alive.
              </p>
            </div>

            {/* Historical Note */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 italic text-sm text-center">
                "Recovery from illness was often seen as divine providence in historical times. 
                Many survivors gained natural immunity to the disease."
              </p>
            </div>

            {/* Recovery Stats */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Recovery Effects</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Health Status:</span>
                  <span className="text-green-400">Recovering</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Immunity Gained:</span>
                  <span className="text-blue-400">Temporary Protection</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fatigue:</span>
                  <span className="text-yellow-400">Still Weakened</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Continue Your Journey
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Active disease mode - original functionality
  if (!disease) return null;

  // Generate random virality rating (0-100)
  const viralityRating = Math.floor(disease.disease.baseTransmissionRate * 100 * (1 + Math.random()));
  
  // Map severity to numeric value
  const severityMap = { mild: 20, moderate: 50, severe: 80, critical: 95 };
  const severityRating = severityMap[disease.disease.severity] || 50;

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'severe': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get virality color
  const getViralityColor = (rating: number) => {
    if (rating < 25) return 'text-blue-400';
    if (rating < 50) return 'text-yellow-400';
    if (rating < 75) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-red-950/90 to-gray-900 border-b border-red-800/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-300">
              <div className="text-2xl">{disease.disease.badgeIcon}</div>
              <div className="text-sm font-semibold uppercase tracking-wider">DISEASE CONTRACTED!</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{disease.disease.name}</h2>
            <p className="text-sm text-yellow-400 uppercase mt-1">
              {disease.disease.severity.toUpperCase()} {disease.disease.type.toUpperCase()} DISEASE
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Historical Quote */}
          <div className="bg-gradient-to-r from-amber-900/20 to-gray-800/50 rounded-lg p-4 border border-amber-700/30">
            {isLoadingSource ? (
              <p className="text-gray-400 italic">Loading historical account...</p>
            ) : (
              <div>
                <p className="text-amber-100 italic text-sm leading-relaxed mb-2">{primarySource}</p>
                <p className="text-xs text-amber-600">— Historical Account, {historicalEra === 'MEDIEVAL' ? 'Medieval' : historicalEra === 'ANCIENT' ? 'Ancient' : historicalEra === 'EARLY_MODERN' ? 'Early Modern' : historicalEra} Period</p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Severity */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-4 h-4 ${getSeverityColor(disease.disease.severity)}`} />
                <h3 className="text-sm font-semibold text-gray-300">Severity</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getSeverityColor(disease.disease.severity)}`}>
                  {severityRating}%
                </span>
                <span className="text-xs text-gray-500 capitalize">{disease.disease.severity}</span>
              </div>
              <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${disease.disease.severity === 'mild' ? 'bg-green-500' : 
                             disease.disease.severity === 'moderate' ? 'bg-yellow-500' :
                             disease.disease.severity === 'severe' ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${severityRating}%` }}
                />
              </div>
            </div>

            {/* Virality */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-4 h-4 ${getViralityColor(viralityRating)}`} />
                <h3 className="text-sm font-semibold text-gray-300">Virality</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getViralityColor(viralityRating)}`}>
                  {viralityRating}%
                </span>
                <span className="text-xs text-gray-500">Transmission Rate</span>
              </div>
              <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${viralityRating < 25 ? 'bg-blue-500' : 
                             viralityRating < 50 ? 'bg-yellow-500' :
                             viralityRating < 75 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${viralityRating}%` }}
                />
              </div>
            </div>
          </div>

          {/* Disease Info */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-300">Disease Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Transmission:</span>
                <span className="text-gray-200 capitalize">{disease.disease.transmissionVector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stage:</span>
                <span className="text-gray-200 capitalize">{disease.stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-gray-200">{Math.ceil(disease.daysRemaining)} days remaining</span>
              </div>
              {disease.daysSinceContraction !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Day of Illness:</span>
                  <span className="text-gray-200">Day {Math.floor(disease.daysSinceContraction) + 1}</span>
                </div>
              )}
              {disease.disease.mortalityRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Mortality Rate:</span>
                  <span className="text-red-400">{(disease.disease.mortalityRate * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Disease Progression Timeline (if available) */}
          {disease.disease.progressionStages && disease.disease.progressionStages.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-gray-300">Disease Progression</h3>
              </div>
              <div className="space-y-2">
                {disease.disease.progressionStages.map((stage, index) => {
                  const isPast = disease.daysSinceContraction !== undefined && disease.daysSinceContraction >= stage.day;
                  const isCurrent = isPast && (
                    index === disease.disease.progressionStages!.length - 1 ||
                    (disease.daysSinceContraction! < disease.disease.progressionStages![index + 1].day)
                  );
                  
                  return (
                    <div key={index} className={`flex items-start gap-2 ${isCurrent ? 'bg-gray-700/50 p-2 rounded' : ''}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        isCurrent ? 'bg-yellow-400 animate-pulse' : 
                        isPast ? 'bg-green-400' : 'bg-gray-600'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${
                          isCurrent ? 'text-yellow-300' : 
                          isPast ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Day {stage.day < 1 ? `${Math.round(stage.day * 24)} hours` : Math.round(stage.day)}
                        </p>
                        <p className={`text-xs ${
                          isCurrent ? 'text-gray-200' : 
                          isPast ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {stage.symptoms.join(', ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Symptoms */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-gray-300">Symptoms You May Experience</h3>
            </div>
            <div className="space-y-2">
              {disease.disease.symptoms.map((symptom, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-gray-200 text-sm font-medium">{symptom.name}</p>
                    <p className="text-gray-400 text-xs">{symptom.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Perception - How the character understands their illness */}
          {(() => {
            const medicalResponse = culturalMedicalKnowledge.getCulturalMedicalResponse({
              era: historicalEra,
              zone: culturalZone as CulturalZone,
              year: currentYear,
              disease: disease.disease,
              severity: disease.disease.severity
            });
            const urgency = culturalMedicalKnowledge.getUrgencyModifier(disease.disease.severity);
            
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

          {/* Immunity Info */}
          {disease.disease.grantsImmunity && (
            <div className="bg-green-900/20 rounded-lg p-3 border border-green-700/50">
              <p className="text-green-400 text-xs">
                Recovery grants immunity for {disease.disease.immunityDuration} days
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseModal;