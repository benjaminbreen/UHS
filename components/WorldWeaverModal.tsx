import React from 'react';
import { X, MapPin, Calendar, User, Sparkles, Target } from 'lucide-react';
import { GameMode, SpecialNPC } from '../types/eventTypes';
import { CharacterSpecification } from '../services/worldWeaverService';

interface WorldWeaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  location: string;
  explanation: string;
  reasoning?: string;
  suggestion?: string;
  characterSpec?: CharacterSpecification;
  gameMode?: GameMode;
  specialNPCs?: SpecialNPC[];
  customEventsCount?: number;
}

const WorldWeaverModal: React.FC<WorldWeaverModalProps> = ({
  isOpen,
  onClose,
  year,
  location,
  explanation,
  reasoning,
  suggestion,
  characterSpec,
  gameMode,
  specialNPCs,
  customEventsCount = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-green-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 px-6 py-4 border-b border-green-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-400" />
              World Created by WorldWeaver
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Setting Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                Year
              </div>
              <div className="text-lg font-semibold text-white">
                {year > 0 ? year : `${Math.abs(year)} BCE`}
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              <div className="text-lg font-semibold text-white">
                {location}
              </div>
            </div>
          </div>

          {/* Game Mode */}
          {gameMode && (
            <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                <Target className="w-4 h-4" />
                Game Mode
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                {gameMode.name}
              </div>
              <p className="text-sm text-gray-300">
                {gameMode.description}
              </p>
            </div>
          )}

          {/* Character */}
          {characterSpec && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <User className="w-4 h-4" />
                Your Character
              </div>
              <div className="space-y-1 text-sm">
                {characterSpec.name && (
                  <div>
                    <span className="text-gray-400">Name:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.name}</span>
                  </div>
                )}
                {characterSpec.age && (
                  <div>
                    <span className="text-gray-400">Age:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.age}</span>
                  </div>
                )}
                {characterSpec.gender && (
                  <div>
                    <span className="text-gray-400">Gender:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.gender}</span>
                  </div>
                )}
                {characterSpec.profession && (
                  <div>
                    <span className="text-gray-400">Profession:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.profession}</span>
                  </div>
                )}
                {characterSpec.socialClass && (
                  <div>
                    <span className="text-gray-400">Social Class:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.socialClass}</span>
                  </div>
                )}
                {characterSpec.health && (
                  <div>
                    <span className="text-gray-400">Health:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.health}</span>
                  </div>
                )}
                {characterSpec.traits && characterSpec.traits.length > 0 && (
                  <div>
                    <span className="text-gray-400">Traits:</span>{' '}
                    <span className="text-white font-medium">{characterSpec.traits.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Historical Context</h3>
            <p className="text-sm text-gray-200">
              {explanation}
            </p>
          </div>

          {/* Reasoning */}
          {reasoning && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Why This Setting?</h3>
              <p className="text-sm text-gray-200">
                {reasoning}
              </p>
            </div>
          )}

          {/* Special NPCs */}
          {specialNPCs && specialNPCs.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Special Characters Created
              </h3>
              <div className="space-y-2">
                {specialNPCs.map((npc, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-green-400 font-medium">{npc.name}</span>
                    <span className="text-gray-400"> - {npc.occupation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Events */}
          {customEventsCount > 0 && (
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-3 border border-green-500/30">
              <p className="text-sm text-green-400">
                ✨ {customEventsCount} historically accurate events have been generated for this scenario
              </p>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg p-4 border border-blue-500/30">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">What to Try</h3>
              <p className="text-sm text-gray-200">
                {suggestion}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-green-500/20"
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldWeaverModal;