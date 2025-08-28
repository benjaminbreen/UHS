/**
 * components/NpcQuestPanel.tsx
 * Standalone quest panel component for NPCs to offer quests
 * Can be used in EncounterModal or any other NPC interaction context
 */

import React, { useState } from 'react';
import { NpcEntity, PlayerCharacter, MapData } from '../types';
import { generateNpcQuestOffer } from '../services/llmService';
import { questService } from '../services/questService';
import { Quest } from '../types/questTypes';
import { Sparkles, Target, AlertTriangle, Info } from 'lucide-react';

interface NpcQuestPanelProps {
    npc: NpcEntity;
    playerCharacter: PlayerCharacter;
    mapData: MapData | null;
    nearbyStructures?: any[];
    onQuestAccepted?: (quest: Quest) => void;
    onShowToast?: (message: string) => void;
}

/**
 * Reusable quest panel component for NPC quest offers
 * Handles quest generation, display, and acceptance
 */
export const NpcQuestPanel: React.FC<NpcQuestPanelProps> = ({
    npc,
    playerCharacter,
    mapData,
    nearbyStructures = [],
    onQuestAccepted,
    onShowToast
}) => {
    const [questOffer, setQuestOffer] = useState<any>(null);
    const [isLoadingQuest, setIsLoadingQuest] = useState(false);
    const [hasCheckedForQuest, setHasCheckedForQuest] = useState(false);

    const handleGenerateQuest = async () => {
        setIsLoadingQuest(true);
        setHasCheckedForQuest(true);
        
        try {
            // Generate quest offer
            const questData = await generateNpcQuestOffer(npc, {
                playerCharacter,
                mapData: mapData!,
                nearbyStructures,
                gameDate: { 
                    year: parseInt(mapData?.timeSlice || '1500'), 
                    month: 6, 
                    day: 15 
                },
                playerReputation: playerCharacter.mapReputation || 50
            });
            
            setQuestOffer(questData);
        } catch (error) {
            console.error('Failed to generate quest offer:', error);
            setQuestOffer({
                hasQuest: false,
                questDialogue: "I'm afraid I don't have any work for you right now."
            });
        } finally {
            setIsLoadingQuest(false);
        }
    };

    const handleAcceptQuest = () => {
        if (!questOffer || !questOffer.hasQuest) return;

        // Convert LLM quest offer to proper Quest object
        const newQuest: Quest = {
            id: `llm-quest-${Date.now()}`,
            title: questOffer.questTitle || 'Untitled Task',
            description: questOffer.questDescription || questOffer.questDialogue || 'A task for you to complete.',
            category: questOffer.questType === 'delivery' ? 'trade' : 
                     questOffer.questType === 'gathering' ? 'survival' :
                     questOffer.questType === 'investigation' ? 'exploration' :
                     questOffer.questType === 'protection' ? 'survival' :
                     questOffer.questType === 'trade' ? 'trade' :
                     questOffer.questType === 'social' ? 'social' : 'main',
            objectives: [{
                id: `obj-${Date.now()}`,
                type: questOffer.questType === 'delivery' ? 'deliver_item' :
                      questOffer.questType === 'gathering' ? 'collect_item' :
                      questOffer.questType === 'social' ? 'talk_to_npc' : 'visit_location',
                description: questOffer.questDescription || questOffer.questDialogue || 'Complete the requested task',
                completed: false,
                targetLocation: mapData ? { 
                    x: mapData.playerX || 0, 
                    y: mapData.playerY || 0 
                } : undefined
            }],
            currentObjectiveIndex: 0,
            rewards: questOffer.questReward ? [{
                type: 'currency',
                amount: 50,
                description: questOffer.questReward
            }] : [],
            giver: npc.name,
            status: 'active',
            createdTime: Date.now(),
            historicalContext: `Quest from ${npc.name} in ${mapData?.localArea || 'the local area'} during ${mapData?.timeSlice || 'ancient times'}.`,
            isLLMGenerated: true
        };
        
        // Add quest to the service
        questService.addQuest(newQuest);
        
        // Notify parent component
        if (onQuestAccepted) {
            onQuestAccepted(newQuest);
        }
        
        // Show success message
        if (onShowToast) {
            onShowToast(`Quest "${newQuest.title}" accepted! Check your Quests panel to track progress.`);
        }
        
        // Reset state
        setQuestOffer(null);
        setHasCheckedForQuest(false);
    };

    const handleDeclineQuest = () => {
        setQuestOffer(null);
        setHasCheckedForQuest(false);
    };

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Available Work
            </h4>
            
            {!hasCheckedForQuest ? (
                <div className="text-center py-8">
                    <button 
                        onClick={handleGenerateQuest}
                        disabled={isLoadingQuest}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                        {isLoadingQuest ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Thinking...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Ask for Work
                            </>
                        )}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        See if {npc.name} has any tasks or problems you could help with.
                    </p>
                </div>
            ) : questOffer === null && isLoadingQuest ? (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-purple-300">Generating quest offer...</p>
                </div>
            ) : questOffer ? (
                <div className="space-y-4">
                    {questOffer.hasQuest ? (
                        <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h5 className="text-white font-semibold text-lg">{questOffer.questTitle}</h5>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            questOffer.urgency === 'high' ? 'bg-red-600 text-white' :
                                            questOffer.urgency === 'medium' ? 'bg-yellow-600 text-white' :
                                            'bg-green-600 text-white'
                                        }`}>
                                            {questOffer.urgency} priority
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                                            {questOffer.questType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                                    "{questOffer.questDialogue}"
                                </p>
                                
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                    <h6 className="text-sm font-semibold text-amber-300 mb-2">Quest Details:</h6>
                                    <p className="text-sm text-slate-300 mb-2">{questOffer.questDescription}</p>
                                    
                                    {questOffer.questReward && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xs text-amber-400 font-semibold">Reward:</span>
                                            <span className="text-xs text-white">{questOffer.questReward}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleAcceptQuest}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold transition-colors"
                                >
                                    Accept Quest
                                </button>
                                <button 
                                    onClick={handleDeclineQuest}
                                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded font-semibold transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                            <p className="text-slate-300 mb-2">"{questOffer.questDialogue}"</p>
                            <p className="text-xs text-slate-400">
                                {npc.name} doesn't have any work available right now.
                            </p>
                            <button 
                                onClick={handleDeclineQuest}
                                className="mt-3 bg-slate-600 hover:bg-slate-700 text-white py-1 px-3 rounded text-sm transition-colors"
                            >
                                Ask Again Later
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Info className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <p className="text-slate-300">No quest information available.</p>
                </div>
            )}
        </div>
    );
};

export default NpcQuestPanel;