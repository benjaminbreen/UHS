import React, { useEffect } from 'react';
import { Skull, Calendar, MapPin, X } from 'lucide-react';
import { NpcEntity } from '../types/npcTypes';
import { Disease } from '../types/diseaseTypes';

interface NpcDeathModalProps {
  isOpen: boolean;
  npc: NpcEntity;
  disease: Disease;
  onClose: () => void;
}

const NpcDeathModal: React.FC<NpcDeathModalProps> = ({
  isOpen,
  npc,
  disease,
  onClose
}) => {
  // Auto-close after 8 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCauseOfDeathText = () => {
    if (disease.severity === 'critical') {
      return `succumbed to the terrible ${disease.name}`;
    } else if (disease.severity === 'severe') {
      return `died after a struggle with ${disease.name}`;
    } else {
      return `unexpectedly died from ${disease.name}`;
    }
  };

  const getContextualMessage = () => {
    if (disease.severity === 'critical') {
      return `The ${disease.name} claims another victim. Such devastating diseases spare no one in these times.`;
    } else if (disease.severity === 'severe') {
      return `Despite their best efforts to fight the illness, ${npc.name} could not overcome ${disease.name}.`;
    } else {
      return `What seemed like a mild case of ${disease.name} proved fatal. Even minor illnesses can be deadly without proper treatment.`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-gray-900 p-4 rounded-t-lg border-b border-gray-700 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <Skull className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Death Notice</h1>
              <p className="text-gray-300 text-sm">{npc.name} has {getCauseOfDeathText()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* NPC Details */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-300">About {npc.name}</h3>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Profession:</span>
                <span className="text-gray-200">{npc.profession || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Age:</span>
                <span className="text-gray-200">{npc.age || 'Unknown'} years</span>
              </div>
              {npc.culturalBackground && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Origin:</span>
                  <span className="text-gray-200">{npc.culturalBackground}</span>
                </div>
              )}
            </div>
          </div>

          {/* Disease Information */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Disease Details</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                <span className="text-gray-400">Disease:</span>
                <span className="text-gray-200">{disease.name}</span>
              </div>
              <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                <span className="text-gray-400">Type:</span>
                <span className="text-gray-200 capitalize">{disease.type}</span>
              </div>
              <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                <span className="text-gray-400">Severity:</span>
                <span className="text-gray-200 capitalize">{disease.severity}</span>
              </div>
              <div className="flex justify-between bg-gray-900 rounded px-2 py-1">
                <span className="text-gray-400">Mortality:</span>
                <span className="text-red-400">{(disease.mortalityRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Contextual Message */}
          <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/50">
            <p className="text-blue-300 text-sm italic text-center">
              {getContextualMessage()}
            </p>
          </div>

          {/* Auto-close notice */}
          <div className="text-center text-xs text-gray-500">
            This notification will close automatically
          </div>
        </div>
      </div>
    </div>
  );
};

export default NpcDeathModal;