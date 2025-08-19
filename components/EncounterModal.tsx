/**
 * components/EncounterModal.tsx - A universal, detailed modal for entity encounters.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EncounterableEntity, NpcEntity, DialogueEntry, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue } from '../services/encounterService';
import { summarizeConversation } from '../services/llmService';
import NpcTradeInterface from './NpcTradeInterface';
import { ProceduralPortrait } from './portraits';
import { questService } from '../services/questService';
import { Quest } from '../types/questTypes';
import { Sparkles, Target, MapPin, Info, AlertTriangle } from 'lucide-react';
import DiseaseService from '../services/diseaseService';

function isNpc(target: EncounterableEntity): target is NpcEntity {
    return 'role' in target;
}

function getHistoricalLanguage(npc: NpcEntity, mapData: MapData | null): string {
    if (!mapData) return 'Native';
    
    const year = parseInt(mapData.timeSlice || '1500');
    const location = mapData.localArea || '';
    const continent = mapData.continent || '';
    const culturalZone = npc.culturalZone;
    
    // Ancient languages (Pre-500 CE)
    if (year < 500) {
        if (continent === 'Europe') {
            if (location.includes('Rome') || location.includes('Roman')) return 'Latin';
            if (location.includes('Greece') || location.includes('Greek')) return 'Ancient Greek';
            if (location.includes('Gaul') || location.includes('Celtic')) return 'Gaulish';
            if (location.includes('German')) return 'Proto-Germanic';
            return 'Latin'; // Default for ancient Europe
        }
        if (continent === 'Asia') {
            if (location.includes('China')) return 'Classical Chinese';
            if (location.includes('India')) return 'Sanskrit';
            if (location.includes('Mesopotamia') || location.includes('Babylon')) return 'Akkadian';
            return 'Ancient Language';
        }
        if (continent === 'Africa') {
            if (location.includes('Egypt')) return 'Ancient Egyptian';
            return 'Ancient African';
        }
        if (continent === 'North America') {
            if (location.includes('Columbia') || location.includes('River Valley')) return 'Chinookan';
            if (location.includes('Pacific') || location.includes('Coast')) return 'Coast Salish';
            if (location.includes('Plains')) return 'Proto-Siouan';
            if (location.includes('Great Lakes')) return 'Proto-Algonquian';
            if (location.includes('Southwest') || location.includes('Desert')) return 'Ancestral Puebloan';
            if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
                // More specific based on region
                if (location.includes('Alaska')) return 'Proto-Inuit';
                if (location.includes('Eastern')) return 'Proto-Iroquoian';
                return 'Indigenous Language';
            }
            return 'Native American';
        }
        if (continent === 'South America') {
            if (location.includes('Andes')) return 'Quechua';
            if (culturalZone === 'SOUTH_AMERICAN') return 'Indigenous';
            return 'Native Language';
        }
    }
    
    // Medieval languages (500-1500 CE)
    if (year >= 500 && year < 1500) {
        if (continent === 'Europe') {
            if (location.includes('England')) {
                if (year < 1100) return 'Old English';
                return 'Middle English';
            }
            if (location.includes('France')) return 'Old French';
            if (location.includes('Spain') || location.includes('Iberia')) return 'Old Spanish';
            if (location.includes('Scandinavia') || location.includes('Norse')) return 'Old Norse';
            if (location.includes('Russia')) return 'Old Slavonic';
            return 'Medieval Language';
        }
        if (continent === 'Asia') {
            if (location.includes('Japan')) return 'Classical Japanese';
            if (location.includes('China')) return 'Middle Chinese';
            if (location.includes('Mongolia')) return 'Middle Mongolian';
            if (location.includes('Arab') || location.includes('Middle East')) return 'Classical Arabic';
            return 'Medieval Asian';
        }
        if (continent === 'North America' || continent === 'South America') {
            if (culturalZone === 'MESOAMERICAN') return 'Nahuatl';
            if (location.includes('Andes')) return 'Quechua';
            if (location.includes('Maya')) return 'Mayan';
            return 'Indigenous Language';
        }
    }
    
    // Early Modern (1500-1800)
    if (year >= 1500 && year < 1800) {
        if (continent === 'Europe') {
            if (location.includes('England')) return 'Early Modern English';
            if (location.includes('France')) return 'Early French';
            if (location.includes('Spain')) return 'Early Spanish';
            if (location.includes('Germany')) return 'Early German';
            return 'Early Modern Language';
        }
        if (continent === 'Asia') {
            if (location.includes('Japan')) return 'Early Modern Japanese';
            if (location.includes('China')) return 'Early Mandarin';
            return 'Early Modern Asian';
        }
    }
    
    // Modern era fallback
    if (year >= 1800) {
        return 'Historical ' + (continent || 'Language');
    }
    
    return 'Native Language';
}

interface EncounterModalProps {
  target: EncounterableEntity;
  playerCharacter: PlayerCharacter;
  allNpcs: NpcEntity[];
  mapData: MapData | null;
  onClose: (history: DialogueEntry[]) => void;
  onInitiateCombat: (target: EncounterableEntity) => void;
  onOpenInfo: (target: EncounterableEntity) => void;
}

const EncounterModal: React.FC<EncounterModalProps> = ({ target, playerCharacter, allNpcs, mapData, onClose, onInitiateCombat, onOpenInfo }) => {
    const [history, setHistory] = useState<DialogueEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playerInput, setPlayerInput] = useState('');
    const [activeTab, setActiveTab] = useState<'dialogue' | 'history' | 'trade' | 'medical' | 'household'>('dialogue');
    const [useRealLanguage, setUseRealLanguage] = useState(false);
    const [showTradeInterface, setShowTradeInterface] = useState(false);
    const [showNegotiationPanel, setShowNegotiationPanel] = useState(false);
    const [negotiationResponse, setNegotiationResponse] = useState('');
    const [reputationChange, setReputationChange] = useState<number | null>(null);
    const [npcWantsToLeave, setNpcWantsToLeave] = useState(false);
    const [diseaseTransmissionResult, setDiseaseTransmissionResult] = useState<{
        transmitted: boolean;
        exposures: any[];
        symptomDescriptions: string[];
    } | null>(null);
    const [showDiseaseWarning, setShowDiseaseWarning] = useState(false);
    const hasFetchedInitialDialogue = useRef(false);
    const dialogueLogRef = useRef<HTMLDivElement>(null);
    
    const diseaseService = DiseaseService.getInstance();

    const targetName = isNpc(target) ? target.name : target.speciesName;
    
    // Generate household data once using useMemo
    const npcHousehold = useMemo(() => {
        if (!isNpc(target)) return [];
        
        const household = [];
        const age = target.age || 30;
        const seed = target.id ? target.id.charCodeAt(0) : 0; // Use NPC id as seed for consistency
        
        // Use seeded random for consistency
        const seededRandom = (index: number) => {
            const x = Math.sin(seed + index) * 10000;
            return x - Math.floor(x);
        };
        
        // Spouse (50% chance if over 20)
        if (age > 20 && seededRandom(1) > 0.5) {
            household.push({
                relation: 'Spouse',
                name: `${target.name}'s spouse`,
                age: age + Math.floor(seededRandom(2) * 10 - 5),
                profession: 'Homemaker',
                health: seededRandom(3) < 0.33 ? 'Sick (Common Cold)' : 'Healthy'
            });
        }
        
        // Children (if over 25)
        if (age > 25) {
            const numChildren = Math.floor(seededRandom(4) * 4);
            for (let i = 0; i < numChildren; i++) {
                const childAge = Math.max(1, Math.min(age - 18, Math.floor(seededRandom(5 + i) * (age - 20))));
                household.push({
                    relation: seededRandom(6 + i) > 0.5 ? 'Son' : 'Daughter',
                    name: `Child ${i + 1}`,
                    age: childAge,
                    profession: childAge > 14 ? 'Apprentice' : 'Child',
                    health: seededRandom(7 + i) < 0.33 ? 'Sick (Common Cold)' : 'Healthy'
                });
            }
        }
        
        // Parents (30% chance if under 40)
        if (age < 40 && seededRandom(20) > 0.7) {
            household.push({
                relation: 'Mother',
                name: `${target.name}'s mother`,
                age: age + 20 + Math.floor(seededRandom(21) * 10),
                profession: 'Elder',
                health: seededRandom(22) < 0.4 ? 'Sick (Chronic illness)' : 'Frail'
            });
        }
        
        return household;
    }, [target.id, target.age, target.name]);
    
    const handleClose = useCallback(() => {
        // Close immediately for better UX
        onClose(history);
        
        // Generate summary asynchronously after modal closes
        if (isNpc(target) && history.length > 1) {
            // Use setTimeout to ensure this happens after the modal closes
            setTimeout(async () => {
                try {
                    const summary = await summarizeConversation(history);
                    if (!target.memory.conversationSummaries) {
                        target.memory.conversationSummaries = [];
                    }
                    target.memory.conversationSummaries.push(summary.summary);
                    // Keep only last 5 conversations
                    if (target.memory.conversationSummaries.length > 5) {
                        target.memory.conversationSummaries = target.memory.conversationSummaries.slice(-5);
                    }
                    
                    // Update opinion based on sentiment
                    if (summary.sentiment === 'positive') {
                        target.memory.opinionOfPlayer = Math.min(100, (target.memory.opinionOfPlayer || 50) + 10);
                    } else if (summary.sentiment === 'negative') {
                        target.memory.opinionOfPlayer = Math.max(0, (target.memory.opinionOfPlayer || 50) - 10);
                    }
                } catch (error) {
                    console.error('Failed to save conversation summary:', error);
                }
            }, 0);
        }
    }, [target, history, onClose]);


    useEffect(() => {
        if (!playerCharacter) return;
        if (!hasFetchedInitialDialogue.current && isNpc(target)) {
            hasFetchedInitialDialogue.current = true;
            setIsLoading(true);
            
            // Generate appropriate greeting based on whether NPC knows the player
            const hasMetBefore = target.memory.conversationSummaries && target.memory.conversationSummaries.length > 0;
            const greeting = hasMetBefore ? 
                "I approach again." : 
                "Hello.";
            
            generateEncounterDialogue(target, target.memory.conversationSummaries || [], greeting, playerCharacter, allNpcs, mapData, useRealLanguage).then(response => {
                const initialEntry: DialogueEntry = { speaker: 'npc', text: response.text, timestamp: new Date() };
                setHistory([initialEntry]);
                
                // Check for hostile or dismissive response
                checkNpcReaction(response);
                setIsLoading(false);
            }).catch(err => {
                console.error("Failed to get initial dialogue:", err);
                const fallbackText = isNpc(target) ? `${targetName} watches you silently.` : `The ${targetName.toLowerCase()} lets out a low growl.`;
                setHistory([{ speaker: 'npc', text: fallbackText, timestamp: new Date() }]);
                setIsLoading(false);
            });
        } else if (!isNpc(target)) {
            const fallbackText = `The ${targetName.toLowerCase()} watches you warily.`;
            setHistory([{ speaker: 'npc', text: fallbackText, timestamp: new Date() }]);
            setIsLoading(false);
        }
    }, [target, targetName, playerCharacter, allNpcs, mapData, useRealLanguage]);

    useEffect(() => {
        if (dialogueLogRef.current) {
            dialogueLogRef.current.scrollTop = dialogueLogRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    // Check for disease transmission on encounter start
    useEffect(() => {
        if (!playerCharacter || !mapData || !isNpc(target)) return;
        
        const currentYear = parseInt(mapData.timeSlice || '1500');
        
        // Check for direct contact transmission
        try {
            const result = diseaseService.checkDirectContactTransmission(
                target,
                playerCharacter,
                currentYear
            );
            
            setDiseaseTransmissionResult(result);
            
            // Show warning if there are visible symptoms or transmission occurred
            if (result.symptomDescriptions.length > 0 || result.transmitted) {
                setShowDiseaseWarning(true);
                setTimeout(() => setShowDiseaseWarning(false), 5000);
            }
        } catch (error) {
            console.error('Error checking disease transmission:', error);
        }
    }, [target, playerCharacter, mapData]);
    
    // Check NPC reaction for hostility or desire to leave
    const checkNpcReaction = (response: { text: string, reputationChange?: number, shouldLeave?: boolean, shouldAttack?: boolean }) => {
        // Check for reputation change
        if (response.reputationChange) {
            setReputationChange(response.reputationChange);
            if (playerCharacter) {
                playerCharacter.mapReputation = Math.max(0, Math.min(100, 
                    (playerCharacter.mapReputation || 50) + response.reputationChange
                ));
            }
            // Clear reputation display after 3 seconds
            setTimeout(() => setReputationChange(null), 3000);
        }
        
        // Check if NPC wants to leave
        const leaveKeywords = ['leave me be', 'go away', 'begone', 'I\'m done talking', 'this conversation is over', 'we\'re done here', 'get out of my sight'];
        const attackKeywords = ['guards!', 'I\'ll kill you', 'you\'ll pay for', 'how dare you', 'insolent', 'draw your weapon'];
        
        const lowerText = response.text.toLowerCase();
        
        if (response.shouldAttack || attackKeywords.some(keyword => lowerText.includes(keyword))) {
            // NPC attacks!
            setTimeout(() => {
                onInitiateCombat(target);
            }, 1500);
        } else if (response.shouldLeave || leaveKeywords.some(keyword => lowerText.includes(keyword))) {
            // NPC ends conversation
            setNpcWantsToLeave(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        }
    };
    
    const handleSend = async () => {
        if (!isNpc(target) || !playerInput.trim() || isLoading || !playerCharacter || npcWantsToLeave) return;

        const newPlayerEntry: DialogueEntry = { speaker: 'player', text: playerInput, timestamp: new Date() };
        const newHistory = [...history, newPlayerEntry];
        setHistory(newHistory);
        const currentInput = playerInput;
        setPlayerInput('');
        setIsLoading(true);
        
        try {
            const response = await generateEncounterDialogue(target, newHistory, currentInput, playerCharacter, allNpcs, mapData, useRealLanguage);
            const newNpcEntry: DialogueEntry = { speaker: 'npc', text: response.text, timestamp: new Date() };
            setHistory(prev => [...prev, newNpcEntry]);
            
            // Check NPC's reaction
            checkNpcReaction(response);
        } catch(e) {
            console.error("Error generating dialogue:", e);
            const fallbackEntry: DialogueEntry = { speaker: 'npc', text: "...", timestamp: new Date() };
            setHistory(prev => [...prev, fallbackEntry]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className={`ff-panel ${showNegotiationPanel ? 'max-w-5xl' : 'max-w-2xl'} w-full h-[80vh] max-h-[700px] flex ${showNegotiationPanel ? 'flex-row gap-4' : 'flex-col'} p-4 transition-all duration-300 overflow-hidden`} onClick={e => e.stopPropagation()}>
                {/* Main content area */}
                <div className={`flex-1 flex flex-col min-h-0 ${showNegotiationPanel ? '' : 'w-full'}`}>
                <header className="flex items-center gap-4 mb-3 pb-3 border-b border-blue-500/30">
                    {/* Replace emoji with procedural portrait */}
                    {isNpc(target) ? (
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-slate-600">
                            <ProceduralPortrait character={target as any} size={70} />
                        </div>
                    ) : (
                        <div className="text-5xl flex-shrink-0">{target.emoji}</div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-2xl font-press-start" style={{ color: 'var(--ff-header-text)' }}>{targetName}</h3>
                        <p className="text-sm text-slate-300 capitalize">
                            {isNpc(target) ? `${target.class} - ${target.role}${target.religion ? ` • ${target.religion}` : ''}` : target.type}
                        </p>
                    </div>
                    {isNpc(target) && (
                        <button 
                            onClick={() => setUseRealLanguage(p => !p)} 
                            className="ff-action-button text-xs"
                            title={`Toggle between English and ${getHistoricalLanguage(target, mapData)}`}
                        >
                            {useRealLanguage ? `🌐 ${getHistoricalLanguage(target, mapData)}` : '🇬🇧 English'}
                        </button>
                    )}
                </header>

                {/* Disease Warning and Symptoms Display */}
                {diseaseTransmissionResult && (diseaseTransmissionResult.symptomDescriptions.length > 0 || diseaseTransmissionResult.transmitted) && (
                    <div className={`mb-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                        diseaseTransmissionResult.transmitted 
                            ? 'border-red-500 bg-red-900/20' 
                            : 'border-yellow-500 bg-yellow-900/20'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-4 h-4 ${diseaseTransmissionResult.transmitted ? 'text-red-400' : 'text-yellow-400'}`} />
                            <h4 className={`text-sm font-semibold ${diseaseTransmissionResult.transmitted ? 'text-red-400' : 'text-yellow-400'}`}>
                                {diseaseTransmissionResult.transmitted ? 'Disease Exposure!' : 'Visible Symptoms'}
                            </h4>
                        </div>
                        
                        {diseaseTransmissionResult.symptomDescriptions.length > 0 && (
                            <div className="mb-2">
                                <p className="text-xs text-slate-300 mb-1">You notice:</p>
                                {diseaseTransmissionResult.symptomDescriptions.map((symptom, index) => (
                                    <p key={index} className="text-sm text-slate-200 ml-2">• {symptom}</p>
                                ))}
                            </div>
                        )}
                        
                        {diseaseTransmissionResult.transmitted && (
                            <p className="text-xs text-red-300">
                                ⚠️ You may have been exposed to disease through close contact.
                            </p>
                        )}
                    </div>
                )}

                {/* Disease Transmission Animation */}
                {showDiseaseWarning && diseaseTransmissionResult?.transmitted && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-semibold">Disease Transmission Risk!</span>
                        </div>
                    </div>
                )}

                {isNpc(target) && (
                    <div className="flex bg-slate-800/60 rounded-t-lg border-x border-t border-slate-700/50 shrink-0 shadow-sm">
                        <button onClick={() => setActiveTab('dialogue')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'dialogue' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Dialogue</button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'history' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>History</button>
                        <button onClick={() => setActiveTab('household')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'household' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Household</button>
                        <button onClick={() => setActiveTab('trade')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'trade' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Trade</button>
                        {/* Show medical tab if NPC is a healer or player has diseases */}
                        {((target.role && (target.role.toLowerCase().includes('healer') || target.role.toLowerCase().includes('physician') || target.role.toLowerCase().includes('apothecary'))) || 
                          (playerCharacter?.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0)) && (
                            <button onClick={() => setActiveTab('medical')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'medical' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>
                                <span className="flex items-center justify-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    Medical
                                </span>
                            </button>
                        )}
                    </div>
                )}

                <main className="flex-1 min-h-0 max-h-[400px] p-3 mb-3 overflow-y-auto bg-black/25 rounded-b-md border-x border-b border-slate-600/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800" ref={dialogueLogRef}>
                     {activeTab === 'dialogue' && (
                        <>
                            {isLoading && history.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
                                    Loading...
                                </div>
                            ) : history.map((msg, index) => (
                                <div key={index} className="mb-3">
                                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/40">
                                        <strong className="block mb-1 text-sm font-semibold" style={{color: msg.speaker === 'player' ? '#81e6d9' : 'var(--ff-header-text)'}}>{msg.speaker === 'player' ? (playerCharacter?.name || 'You') : targetName}</strong>
                                        <p className="text-base leading-relaxed text-slate-200">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && history.length > 0 && (
                                <div className="mb-3">
                                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/40">
                                        <strong className="block mb-1 text-sm font-semibold" style={{color: 'var(--ff-header-text)'}}>{targetName}</strong>
                                        <p className="text-base text-slate-200"><span className="animate-pulse">●●●</span></p>
                                    </div>
                                </div>
                            )}
                        </>
                     )}
                     {activeTab === 'history' && isNpc(target) && (
                         <div className="space-y-3">
                             <h4 className="text-lg font-semibold text-amber-300">Conversation History</h4>
                             {(target.memory.conversationSummaries && target.memory.conversationSummaries.length > 0) ? (
                                 target.memory.conversationSummaries.map((summary, index) => (
                                    <div key={index} className="p-3 text-sm italic text-slate-400 border-l-2 border-amber-500/50 bg-slate-800/40 rounded-r-md">
                                        "{summary}"
                                    </div>
                                 ))
                             ) : (
                                <p className="text-slate-500 italic">You have no significant past conversations with {targetName}.</p>
                             )}
                         </div>
                     )}
                     {activeTab === 'household' && isNpc(target) && (
                         <div className="space-y-3">
                             <h4 className="text-lg font-semibold text-blue-300">Household Members</h4>
                             {npcHousehold.length === 0 ? (
                                 <p className="text-slate-500 italic">{targetName} lives alone.</p>
                             ) : (
                                 <div className="space-y-2">
                                     {npcHousehold.map((member, idx) => (
                                         <div key={`${member.relation}-${idx}`} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                             <div className="flex justify-between items-start">
                                                 <div>
                                                     <span className="font-semibold text-white">{member.relation}</span>
                                                     <span className="text-slate-400 ml-2">{member.name}</span>
                                                 </div>
                                                 <span className="text-xs text-slate-500">Age {member.age}</span>
                                             </div>
                                             <div className="text-xs mt-1">
                                                 <span className="text-slate-400">{member.profession}</span>
                                                 {member.health !== 'Healthy' && (
                                                     <span className={`ml-2 ${member.health.includes('Sick') ? 'text-orange-500' : 'text-yellow-500'}`}>
                                                         • {member.health}
                                                     </span>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     )}
                     {activeTab === 'trade' && isNpc(target) && playerCharacter && (
                         <NpcTradeInterface
                             npc={target}
                             player={playerCharacter}
                             mapData={mapData}
                             onTrade={(traded) => {
                                 if (traded) {
                                     // Successful trade
                                     // Update NPC relationship after successful trade
                                     if (target.memory) {
                                         target.memory.opinionOfPlayer = Math.min(100, 
                                             (target.memory.opinionOfPlayer || 50) + 5
                                         );
                                     }
                                     setNegotiationResponse("Pleasure doing business with you!");
                                     setReputationChange(5);
                                     setTimeout(() => setReputationChange(null), 3000);
                                 } else {
                                     // Failed trade - open negotiation panel
                                     setShowNegotiationPanel(true);
                                     setNegotiationResponse("That offer is insulting! You'll need to do better than that.");
                                 }
                             }}
                             onClose={() => setActiveTab('dialogue')}
                             onUpdatePlayer={(updates) => {
                                 // Update player state
                                 if (updates.currency !== undefined) {
                                     playerCharacter.currency = updates.currency;
                                 }
                                 if (updates.inventory) {
                                     playerCharacter.inventory = updates.inventory;
                                 }
                             }}
                         />
                     )}
                     {activeTab === 'medical' && isNpc(target) && playerCharacter && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                Medical Treatment
                            </h4>
                            
                            {/* Check if NPC is a healer */}
                            {target.role && (target.role.toLowerCase().includes('healer') || 
                                           target.role.toLowerCase().includes('physician') || 
                                           target.role.toLowerCase().includes('apothecary')) ? (
                                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                                    <p className="text-green-300 text-sm mb-3">
                                        🏥 This {target.role.toLowerCase()} can provide medical treatment.
                                    </p>
                                    
                                    {/* Show player's current diseases */}
                                    {playerCharacter.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0 ? (
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-semibold text-red-300">Your Current Ailments:</h5>
                                            {playerCharacter.health.currentDiseases.map((activeDisease, index) => {
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
                                                                            onClick={() => {
                                                                                const result = diseaseService.applyTreatment(
                                                                                    playerCharacter,
                                                                                    activeDisease.disease.id,
                                                                                    medicine.id,
                                                                                    parseInt(mapData?.timeSlice || '1500')
                                                                                );
                                                                                console.log(result.message);
                                                                                // Force re-render by updating state
                                                                                setNegotiationResponse(result.message);
                                                                                setTimeout(() => setNegotiationResponse(''), 3000);
                                                                            }}
                                                                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                                                        >
                                                                            Apply (${medicine.cost})
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-red-300">No treatments available for this disease in this era/region.</p>
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
                                    
                                    {playerCharacter.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm text-slate-300 mb-2">Your current ailments:</p>
                                            {playerCharacter.health.currentDiseases.map((activeDisease, index) => (
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
                            {negotiationResponse && (
                                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                                    <p className="text-blue-300 text-sm">{negotiationResponse}</p>
                                </div>
                            )}
                        </div>
                     )}
                </main>

                {isNpc(target) && activeTab === 'dialogue' && (
                     <div className="flex gap-2 mb-4 flex-shrink-0">
                        <input 
                          type="text" 
                          placeholder={isLoading ? "..." : "Say something..."} 
                          value={playerInput} 
                          onChange={(e) => setPlayerInput(e.target.value)} 
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                          disabled={isLoading}
                          className="flex-1 px-4 py-3 text-base text-white placeholder-gray-400 transition-all duration-150 bg-slate-800/80 border-2 border-slate-600/60 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-slate-700/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button 
                          onClick={handleSend} 
                          disabled={isLoading || !playerInput.trim()}
                          className="px-4 py-2 text-sm font-semibold text-white transition-all duration-150 bg-amber-600 rounded-lg hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                    </div>
                )}

                {/* Quest Hints Section - Contextually Dependent */}
                {(() => {
                    const activeQuests = questService.getActiveQuests();
                    const relevantQuests = activeQuests.filter(quest => {
                        // Check if this NPC or location is relevant to any quest
                        if (isNpc(target)) {
                            const npcName = target.name.toLowerCase();
                            const npcRole = target.role?.toLowerCase() || '';
                            
                            return quest.objectives.some(obj => {
                                if (obj.description.toLowerCase().includes(npcName)) return true;
                                if (obj.description.toLowerCase().includes(npcRole)) return true;
                                if (obj.type === 'talk_to_npc' && !obj.completed) return true;
                                if (obj.type === 'deliver_item' && npcRole.includes('merchant')) return true;
                                return false;
                            });
                        } else {
                            // For animals, check if they're relevant to hunting quests
                            const animalType = target.behavior?.toLowerCase() || '';
                            return quest.objectives.some(obj => {
                                if (obj.type === 'collect_item' && animalType) return true;
                                if (obj.description.toLowerCase().includes('hunt')) return true;
                                if (obj.description.toLowerCase().includes('animal')) return true;
                                return false;
                            });
                        }
                    });

                    // Generate contextual hints based on entity type and quests
                    const generateHints = () => {
                        const hints = [];
                        
                        if (isNpc(target)) {
                            // NPC-specific hints
                            if (target.role?.includes('merchant') || target.role?.includes('trader')) {
                                hints.push({ icon: '💰', text: 'This merchant might have valuable items for trade' });
                            }
                            if (target.role?.includes('scholar') || target.role?.includes('sage')) {
                                hints.push({ icon: '📚', text: 'Scholars often know about local history and secrets' });
                            }
                            if (target.role?.includes('guard') || target.role?.includes('soldier')) {
                                hints.push({ icon: '⚔️', text: 'Guards might have information about local threats' });
                            }
                            if (target.specialKnowledge) {
                                hints.push({ icon: '✨', text: 'This person seems to have special knowledge' });
                            }
                        } else {
                            // Animal-specific hints
                            if (target.behavior === 'aggressive') {
                                hints.push({ icon: '⚠️', text: 'This creature is dangerous - prepare for combat' });
                            }
                            if (target.behavior === 'peaceful') {
                                hints.push({ icon: '🕊️', text: 'This animal seems peaceful and might be tameable' });
                            }
                            if (target.species?.includes('rare')) {
                                hints.push({ icon: '💎', text: 'Rare creatures often drop valuable materials' });
                            }
                        }
                        
                        return hints;
                    };

                    const hints = generateHints();
                    const hasContent = relevantQuests.length > 0 || hints.length > 0;

                    if (!hasContent) return null;

                    return (
                        <div className="mb-3 p-3 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-lg border border-slate-700/50">
                            {relevantQuests.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        Related Quests
                                    </h4>
                                    <div className="space-y-1">
                                        {relevantQuests.slice(0, 2).map(quest => (
                                            <div key={quest.id} className="text-xs text-slate-300 bg-slate-800/50 rounded px-2 py-1 flex items-start gap-1">
                                                <MapPin className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium text-white">{quest.title}:</span>
                                                    {' '}
                                                    {quest.objectives.find(o => !o.completed)?.description || 'Quest in progress'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {hints.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Hints & Tips
                                    </h4>
                                    <div className="space-y-1">
                                        {hints.map((hint, index) => (
                                            <div key={index} className="text-xs text-slate-400 flex items-center gap-2">
                                                <span className="text-sm">{hint.icon}</span>
                                                <span>{hint.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isNpc(target) && playerCharacter && (
                                <div className="mt-2 pt-2 border-t border-slate-700/50">
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        <span>
                                            Reputation: {playerCharacter.mapReputation || 0} | 
                                            {playerCharacter.mapReputation >= 50 ? ' Friendly' : 
                                             playerCharacter.mapReputation >= 0 ? ' Neutral' : ' Hostile'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <footer className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
                    <button onClick={() => onOpenInfo(target)} className="ff-action-button">Profile</button>
                    <button 
                        onClick={() => setActiveTab('trade')} 
                        className="ff-action-button" 
                        disabled={!isNpc(target)}
                    >
                        Trade
                    </button>
                    <button onClick={() => onInitiateCombat(target)} className="ff-action-button">Attack</button>
                    <button onClick={handleClose} className="ff-action-button" disabled={npcWantsToLeave}>
                        {npcWantsToLeave ? 'Leaving...' : 'Leave'}
                    </button>
                </footer>
                </div>
                
                {/* Reputation change indicator */}
                {reputationChange !== null && (
                    <div className={`absolute top-20 right-8 animate-in fade-in slide-in-from-right duration-300 font-mono text-sm font-bold ${reputationChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {reputationChange > 0 ? '+' : ''}{reputationChange} reputation
                    </div>
                )}
                
                {/* Trade Negotiation Panel */}
                {showNegotiationPanel && (
                    <div className="w-80 flex flex-col bg-slate-800/50 rounded-lg border border-slate-600/50 p-4">
                        <h3 className="text-lg font-semibold text-amber-400 mb-3">Negotiation</h3>
                        <div className="flex-1 overflow-y-auto mb-3">
                            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                                <strong className="block mb-2 text-sm text-white">{targetName}:</strong>
                                <p className="text-sm text-slate-200">{negotiationResponse || "Make me an offer..."}</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Convince them..."
                            className="px-3 py-2 mb-2 text-sm bg-slate-700/50 border border-slate-600 rounded focus:outline-none focus:border-blue-400"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    // Handle negotiation
                                    setNegotiationResponse("Hmm, let me think about that...");
                                }
                            }}
                        />
                        <button
                            onClick={() => setShowNegotiationPanel(false)}
                            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                        >
                            Close Negotiation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EncounterModal;