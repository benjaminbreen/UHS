/**
 * components/EncounterModal.tsx - A universal, detailed modal for entity encounters.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EncounterableEntity, NpcEntity, DialogueEntry, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue } from '../services/encounterService';

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
    const [activeTab, setActiveTab] = useState<'dialogue' | 'history'>('dialogue');
    const [useRealLanguage, setUseRealLanguage] = useState(false);
    const hasFetchedInitialDialogue = useRef(false);
    const dialogueLogRef = useRef<HTMLDivElement>(null);

    const targetName = isNpc(target) ? target.name : target.speciesName;
    const handleClose = () => onClose(history);


    useEffect(() => {
        if (!playerCharacter) return;
        if (!hasFetchedInitialDialogue.current && isNpc(target)) {
            hasFetchedInitialDialogue.current = true;
            setIsLoading(true);
            generateEncounterDialogue(target, [], "Hello.", playerCharacter, allNpcs, mapData, useRealLanguage).then(response => {
                const initialEntry: DialogueEntry = { speaker: 'npc', text: response.text, timestamp: new Date() };
                setHistory([initialEntry]);
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
    
    const handleSend = async () => {
        if (!isNpc(target) || !playerInput.trim() || isLoading || !playerCharacter) return;

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
            <div className="ff-panel w-full max-w-xl min-h-[480px] max-h-[90vh] flex flex-col p-4" onClick={e => e.stopPropagation()}>
                <header className="flex items-center gap-4 mb-3 pb-3 border-b border-blue-500/30">
                    <div className="text-5xl flex-shrink-0">{target.emoji}</div>
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

                {isNpc(target) && (
                    <div className="flex bg-slate-800/60 rounded-t-lg border-x border-t border-slate-700/50 shrink-0 shadow-sm">
                        <button onClick={() => setActiveTab('dialogue')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'dialogue' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Dialogue</button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'history' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>History</button>
                    </div>
                )}

                <main className="flex-1 min-h-0 p-3 mb-3 overflow-y-auto bg-black/25 rounded-b-md border-x border-b border-slate-600/50 scrollbar-thin" ref={dialogueLogRef}>
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
                </main>

                {isNpc(target) && activeTab === 'dialogue' && (
                     <div className="flex gap-2 mb-4">
                        <input 
                          type="text" 
                          placeholder={isLoading ? "..." : "Say something..."} 
                          value={playerInput} 
                          onChange={(e) => setPlayerInput(e.target.value)} 
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                          disabled={isLoading}
                          className="flex-1 px-4 py-2 text-base text-gray-200 placeholder-gray-500 transition-all duration-150 bg-slate-900/70 border-2 border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-slate-800"
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

                <footer className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button onClick={() => onOpenInfo(target)} className="ff-action-button">Profile</button>
                    <button className="ff-action-button" disabled={!isNpc(target)}>Trade</button>
                    <button onClick={() => onInitiateCombat(target)} className="ff-action-button">Attack</button>
                    <button onClick={handleClose} className="ff-action-button">Leave</button>
                </footer>
            </div>
        </div>
    );
};

export default EncounterModal;