/**
 * components/NpcMedicalPanel.tsx
 * Standalone medical treatment panel for NPC healers
 * Can be used in EncounterModal or other healing contexts
 */

import React, { useState } from 'react';
import { NpcEntity, PlayerCharacter, MapData } from '../types';
import DiseaseService from '../services/diseaseService';
import { Heart } from 'lucide-react';

interface NpcMedicalPanelProps {
    npc: NpcEntity;
    playerCharacter: PlayerCharacter;
    mapData: MapData | null;
    onTreatmentApplied?: (message: string) => void;
}

/**
 * Reusable medical panel component for healer NPCs
 * Handles disease display and treatment options
 */
export const NpcMedicalPanel: React.FC<NpcMedicalPanelProps> = ({
    npc,
    playerCharacter,
    mapData,
    onTreatmentApplied
}) => {
    const [treatmentFeedback, setTreatmentFeedback] = useState('');
    const diseaseService = DiseaseService.getInstance();

    const isHealer = npc.role && (
        npc.role.toLowerCase().includes('healer') || 
        npc.role.toLowerCase().includes('physician') || 
        npc.role.toLowerCase().includes('apothecary')
    );

    const handleApplyTreatment = (diseaseId: string, medicineId: string) => {
        const result = diseaseService.applyTreatment(
            playerCharacter,
            diseaseId,
            medicineId,
            parseInt(mapData?.timeSlice || '1500')
        );
        
        setTreatmentFeedback(result.message);
        setTimeout(() => setTreatmentFeedback(''), 3000);
        
        if (onTreatmentApplied) {
            onTreatmentApplied(result.message);
        }
    };

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Medical Treatment
            </h4>
            
            {/* Check if NPC is a healer */}
            {isHealer ? (
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                    <p className="text-green-300 text-sm mb-3">
                        🏥 This {npc.role.toLowerCase()} can provide medical treatment.
                    </p>
                    
                    {/* Show player's current diseases */}
                    {playerCharacter.diseaseHealth?.currentDiseases && playerCharacter.diseaseHealth.currentDiseases.length > 0 ? (
                        <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-red-300">Your Current Ailments:</h5>
                            {playerCharacter.diseaseHealth.currentDiseases.map((activeDisease, index) => {
                                const availableTreatments = mapData ? diseaseService.getAvailableTreatments(
                                    activeDisease.disease.type,
                                    mapData.timeSlice ? 
                                        (parseInt(mapData.timeSlice) < 500 ? 'ANCIENT' :
                                         parseInt(mapData.timeSlice) < 1000 ? 'MEDIEVAL' :
                                         parseInt(mapData.timeSlice) < 1500 ? 'EARLY_MODERN' :
                                         parseInt(mapData.timeSlice) < 1800 ? 'INDUSTRIAL' : 'MODERN') : 'MEDIEVAL',
                                    mapData.culturalZone || 'EUROPEAN'
                                ) : [];
                                
                                return (
                                    <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium flex items-center gap-1">
                                                {activeDisease.disease.badgeIcon} {activeDisease.disease.name}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                activeDisease.stage === 'critical' ? 'bg-red-600 text-white' :
                                                activeDisease.stage === 'symptomatic' ? 'bg-yellow-600 text-white' :
                                                activeDisease.stage === 'recovering' ? 'bg-green-600 text-white' :
                                                'bg-blue-600 text-white'
                                            }`}>
                                                {activeDisease.stage}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-300 mb-2">
                                            Severity: {Math.round(activeDisease.severity * 100)}% • Days remaining: {activeDisease.daysRemaining}
                                        </div>
                                        
                                        {availableTreatments.length > 0 ? (
                                            <div className="space-y-2">
                                                <h6 className="text-xs font-semibold text-green-300">Available Treatments:</h6>
                                                {availableTreatments.map((medicine, medIndex) => (
                                                    <div key={medIndex} className="flex items-center justify-between bg-slate-900/50 rounded p-2">
                                                        <div className="flex-1">
                                                            <div className="text-xs text-white">{medicine.name}</div>
                                                            <div className="text-xs text-slate-400">{medicine.description}</div>
                                                            <div className="text-xs text-green-300">
                                                                Effectiveness: {Math.round((medicine.effectiveness[activeDisease.disease.type] || 0) * 100)}%
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleApplyTreatment(activeDisease.disease.id, medicine.id)}
                                                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                                        >
                                                            Apply (${medicine.cost})
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-red-300">
                                                No treatments available for this disease in this era/region.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-green-300 text-sm">✅ You appear to be in good health.</p>
                    )}
                </div>
            ) : (
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-sm">
                        ⚠️ This person is not a trained healer, but they might know folk remedies or can direct you to someone who can help.
                    </p>
                    
                    {playerCharacter.diseaseHealth?.currentDiseases && playerCharacter.diseaseHealth.currentDiseases.length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm text-slate-300 mb-2">Your current ailments:</p>
                            {playerCharacter.diseaseHealth.currentDiseases.map((activeDisease, index) => (
                                <div key={index} className="text-xs text-red-300 mb-1">
                                    {activeDisease.disease.badgeIcon} {activeDisease.disease.name} ({activeDisease.stage})
                                </div>
                            ))}
                            <p className="text-xs text-slate-400 mt-2 italic">
                                "Perhaps you should seek a trained physician or healer..."
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Treatment feedback */}
            {treatmentFeedback && (
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">{treatmentFeedback}</p>
                </div>
            )}
        </div>
    );
};

export default NpcMedicalPanel;