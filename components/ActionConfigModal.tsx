import React, { useState, useEffect } from 'react';
import { SkillID, SkillDefinition } from '../types';
import { SKILL_DATA } from '../constants/gameData/skills';
import { X, Settings, Info, ChevronUp, ChevronDown, Save } from 'lucide-react';

interface ActionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentActions: SkillID[];
  onSave: (actions: SkillID[]) => void;
}

const ActionConfigModal: React.FC<ActionConfigModalProps> = ({
  isOpen,
  onClose,
  currentActions,
  onSave
}) => {
  const [selectedActions, setSelectedActions] = useState<SkillID[]>(currentActions);
  const [availableSkills] = useState<SkillID[]>(Object.keys(SKILL_DATA) as SkillID[]);

  useEffect(() => {
    setSelectedActions(currentActions);
  }, [currentActions]);

  if (!isOpen) return null;

  const handleAddSkill = (skillId: SkillID) => {
    if (selectedActions.length < 4 && !selectedActions.includes(skillId)) {
      setSelectedActions([...selectedActions, skillId]);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSelectedActions(selectedActions.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newActions = [...selectedActions];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      setSelectedActions(newActions);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedActions.length - 1) {
      const newActions = [...selectedActions];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      setSelectedActions(newActions);
    }
  };

  const handleSave = () => {
    onSave(selectedActions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-slate-800 to-slate-900 
                      rounded-2xl shadow-2xl border border-slate-600/50 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Configure Action Buttons</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Current Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Current Action Slots</h3>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((slot) => {
                const skillId = selectedActions[slot];
                const skill = skillId ? SKILL_DATA[skillId] : null;
                
                return (
                  <div
                    key={slot}
                    className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600/20 rounded-lg border border-blue-500/50">
                      <span className="text-sm font-bold text-blue-400">{slot + 1}</span>
                    </div>
                    
                    {skill ? (
                      <>
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-2xl">{skill.icon}</span>
                          <div>
                            <p className="font-semibold text-white">{skill.name}</p>
                            <p className="text-xs text-gray-400">{skill.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveUp(slot)}
                            disabled={slot === 0}
                            className="p-1 text-gray-400 hover:text-white hover:bg-slate-600/50 rounded 
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(slot)}
                            disabled={slot === selectedActions.length - 1}
                            className="p-1 text-gray-400 hover:text-white hover:bg-slate-600/50 rounded 
                                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveSkill(slot)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded ml-2 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 text-gray-500 italic">Empty slot - Add an action below</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Skills */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Available Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableSkills.map((skillId) => {
                const skill = SKILL_DATA[skillId];
                const isSelected = selectedActions.includes(skillId);
                const isFull = selectedActions.length >= 4;
                
                return (
                  <button
                    key={skillId}
                    onClick={() => !isSelected && !isFull && handleAddSkill(skillId)}
                    disabled={isSelected || isFull}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all
                              ${isSelected 
                                ? 'bg-green-900/20 border-green-600/50 opacity-50 cursor-not-allowed' 
                                : isFull
                                  ? 'bg-slate-800/30 border-slate-700/30 opacity-50 cursor-not-allowed'
                                  : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer'
                              }`}
                  >
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white text-sm">{skill.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{skill.description}</p>
                      {skill.type === 'llm' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded-full">
                          AI-Powered
                        </span>
                      )}
                      {skill.fatigueCost && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-orange-600/30 text-orange-300 text-xs rounded-full">
                          {skill.fatigueCost} Fatigue
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">How to Use Action Buttons:</p>
                <ul className="space-y-1 text-xs text-blue-300">
                  <li>• Click the buttons or press hotkeys 1-4 to activate actions</li>
                  <li>• Drag actions up/down to reorder them</li>
                  <li>• Different actions work better in different situations</li>
                  <li>• Some actions consume fatigue or require specific items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-300 hover:text-white bg-slate-700/50 hover:bg-slate-700/70 
                     rounded-lg transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-500 rounded-lg 
                     transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionConfigModal;