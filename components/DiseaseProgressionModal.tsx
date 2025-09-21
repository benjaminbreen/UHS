import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DiseaseProgressionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon: string;
  diseaseName: string;
  stage: 'moderate' | 'severe' | 'critical' | 'terminal';
  onClose: () => void;
}

const DiseaseProgressionModal: React.FC<DiseaseProgressionModalProps> = ({
  isOpen,
  title,
  description,
  icon,
  diseaseName,
  stage,
  onClose
}) => {
  // Auto-close after 6 seconds for early stages, 8 seconds for critical/terminal
  useEffect(() => {
    if (isOpen) {
      const delay = stage === 'critical' || stage === 'terminal' ? 8000 : 6000;
      const timer = setTimeout(() => {
        onClose();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, stage, onClose]);

  if (!isOpen) return null;

  const getStageColor = () => {
    switch (stage) {
      case 'moderate':
        return 'from-yellow-900/50 to-orange-900/50';
      case 'severe':
        return 'from-orange-900/50 to-red-900/50';
      case 'critical':
        return 'from-red-900/50 to-red-800/50';
      case 'terminal':
        return 'from-red-900/60 to-black/50';
      default:
        return 'from-gray-900/50 to-gray-800/50';
    }
  };

  const getStageText = () => {
    switch (stage) {
      case 'moderate':
        return 'Symptoms Worsening';
      case 'severe':
        return 'Severe Symptoms';
      case 'critical':
        return 'Critical Condition';
      case 'terminal':
        return 'Terminal Stage';
      default:
        return 'Disease Progress';
    }
  };

  const getBorderColor = () => {
    switch (stage) {
      case 'moderate':
        return 'border-yellow-600';
      case 'severe':
        return 'border-orange-600';
      case 'critical':
        return 'border-red-600';
      case 'terminal':
        return 'border-red-800';
      default:
        return 'border-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-md w-full border-2 ${getBorderColor()}`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${getStageColor()} p-4 rounded-t-lg border-b border-gray-700 relative`}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <p className="text-gray-200 text-sm">{getStageText()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Disease Information */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🦠</span>
              <h3 className="text-sm font-semibold text-gray-300">Disease Status</h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Disease:</span>
                <span className="text-gray-200">{diseaseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stage:</span>
                <span className={`capitalize font-medium ${
                  stage === 'terminal' ? 'text-red-400' :
                  stage === 'critical' ? 'text-red-300' :
                  stage === 'severe' ? 'text-orange-300' :
                  'text-yellow-300'
                }`}>
                  {stage}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-gray-300 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Stage-specific warnings */}
          {stage === 'critical' && (
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-700/50">
              <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <p className="text-red-300 text-sm font-medium">
                  Your condition is becoming severe. Seek treatment if available.
                </p>
              </div>
            </div>
          )}

          {stage === 'terminal' && (
            <div className="bg-red-900/30 rounded-lg p-3 border border-red-800/50">
              <div className="flex items-center gap-2">
                <span className="text-red-400">💀</span>
                <p className="text-red-300 text-sm font-medium">
                  Warning: Your movement will now be severely limited. Death is approaching.
                </p>
              </div>
            </div>
          )}

          {/* Auto-close notice */}
          <div className="text-center text-xs text-gray-500">
            This notification will close automatically
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseProgressionModal;