import React, { useEffect, useRef } from 'react';
import { NarrationMessage } from '../types';

interface NarrationPanelProps {
    narrationHistory: NarrationMessage[];
    playerInput: string;
    onPlayerInputChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
}

const NarrationPanel: React.FC<NarrationPanelProps> = 
({ narrationHistory, playerInput, onPlayerInputChange, onSend, isLoading }) => {
    const narrationDisplayRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (narrationDisplayRef.current) {
            narrationDisplayRef.current.scrollTop = narrationDisplayRef.current.scrollHeight;
        }
    }, [narrationHistory, isLoading]);

    const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) onSend();
    };

    const isPlaceholderVisible = narrationHistory.length === 1 && narrationHistory[0].sender === 'narrator-special';

    return (
        <div className="flex flex-col h-full bg-slate-800/60 border border-slate-600/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
            <div 
                className="flex-1 min-h-0 p-4 overflow-y-auto text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50" 
                ref={narrationDisplayRef} 
                role="log" 
                aria-live="polite"
            >
                {isPlaceholderVisible ? (
                    <div className="text-gray-400 italic text-center h-full flex items-center justify-center">
                        <div className="max-w-xs">
                            <div className="text-4xl mb-4 opacity-60">💭</div>
                            <p className="leading-relaxed">{narrationHistory[0].text}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {narrationHistory.map((msg, index) => (
                            <div key={index} className={`p-3 rounded-lg ${
                                msg.sender === 'player' 
                                    ? 'text-emerald-300 italic pl-4 border-l-2 border-emerald-500/30 bg-emerald-900/20 rounded-r-lg' 
                                    : msg.sender === 'narrator-special' 
                                    ? 'text-blue-300 bg-blue-900/20' 
                                    : 'text-gray-200 bg-slate-800/30'
                            }`}>
                                {msg.sender === 'narrator' && <p className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1">
                                    <span>📜</span>Narrator:
                                </p>}
                                <p className="leading-relaxed">{msg.text}</p>
                            </div>
                        ))}
                    </div>
                )}
                {isLoading && (
                    <div className="text-gray-200 bg-slate-800/30 rounded-lg p-3 mt-4 animate-pulse">
                        <p className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1">
                            <span>📜</span>Narrator:
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="animate-pulse">●●●</span>
                            <span className="text-xs text-gray-400">thinking...</span>
                        </p>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 flex gap-2 p-3 border-t border-slate-600/50 bg-slate-800/80">
                <input 
                    type="text" 
                    placeholder={isLoading ? "Narrator is thinking..." : "What do you do?"} 
                    value={playerInput} 
                    onChange={(e) => onPlayerInputChange(e.target.value)} 
                    onKeyPress={handleInputKeyPress} 
                    aria-label="Player action input" 
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 text-sm text-gray-200 placeholder-gray-400 transition-all duration-150 bg-slate-700/60 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/60 focus:bg-slate-700/80 focus:ring-2 focus:ring-blue-400/20"
                />
                <button 
                    onClick={onSend} 
                    aria-label="Send action" 
                    disabled={isLoading || !playerInput.trim()} 
                    className="px-4 py-2 text-sm font-semibold text-white transition-all duration-200 bg-amber-600 rounded-lg hover:bg-amber-500 hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg hover:shadow-xl"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                    ) : (
                        <span className="flex items-center gap-1">
                            <span>Send</span>
                            <span className="text-xs">↵</span>
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default NarrationPanel;
