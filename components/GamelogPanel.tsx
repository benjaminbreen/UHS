import React, { useState, useMemo, useCallback } from 'react';
import { GameLogEntry, DialogueEntry } from '../types';
import { saveJsonToFile } from '../utils/fileUtils';

const LogEntry: React.FC<{ entry: GameLogEntry }> = ({ entry }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const typeStyles: Record<GameLogEntry['type'], { color: string, borderColor: string }> = {
        'DIALOGUE': { color: 'text-amber-300', borderColor: 'border-amber-500/50' },
        'COMBAT': { color: 'text-red-400', borderColor: 'border-red-500/50' },
        'MAP_ENTRY': { color: 'text-blue-400', borderColor: 'border-blue-500/50' },
        'SKILL_USE': { color: 'text-green-400', borderColor: 'border-green-500/50' },
        'ITEM_ACQUIRED': { color: 'text-purple-400', borderColor: 'border-purple-500/50' },
        'TRADE': { color: 'text-yellow-400', borderColor: 'border-yellow-500/50' },
        'REST': { color: 'text-indigo-400', borderColor: 'border-indigo-500/50' },
        'MILESTONE_COMBAT': { color: 'text-orange-300', borderColor: 'border-yellow-500/50' },
        'MILESTONE_EXPLORATION': { color: 'text-cyan-300', borderColor: 'border-cyan-500/50' },
        'MILESTONE_ACHIEVEMENT': { color: 'text-emerald-300', borderColor: 'border-emerald-500/50' },
        'QUEST_START': { color: 'text-pink-400', borderColor: 'border-pink-500/50' },
        'QUEST_COMPLETE': { color: 'text-lime-400', borderColor: 'border-lime-500/50' },
    };

    const style = typeStyles[entry.type] || { color: 'text-gray-300', borderColor: 'border-gray-600' };
    const isMilestone = entry.type.startsWith('MILESTONE_') || entry.type === 'QUEST_COMPLETE';

    const renderDetails = () => {
        if (!entry.details || !isExpanded) return null;
        if (entry.type === 'DIALOGUE' && Array.isArray(entry.details)) {
            return (
                <div className="mt-2 pl-4 border-l-2 border-slate-600 space-y-2 text-xs">
                    {(entry.details as DialogueEntry[]).map((line, index) => (
                        <p key={index}>
                            <strong className={line.speaker === 'player' ? 'text-emerald-400' : 'text-white'}>{line.speaker === 'player' ? 'You' : 'NPC'}:</strong>
                            <span className="italic text-slate-300"> "{line.text}"</span>
                        </p>
                    ))}
                </div>
            );
        }
        return <pre className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-md whitespace-pre-wrap">{JSON.stringify(entry.details, null, 2)}</pre>;
    };

    return (
        <div className={`p-3 rounded-lg ${isMilestone ? 'bg-gradient-to-r from-yellow-900/30 to-slate-800/50 shadow-lg' : 'bg-slate-800/50'} border-l-4 ${style.borderColor} ${isMilestone ? 'ring-1 ring-yellow-500/20' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className={`font-semibold ${style.color} ${isMilestone ? 'flex items-center gap-2' : ''}`}>
                        <span className="mr-2 text-base">{entry.icon}</span>
                        {isMilestone && <span className="text-yellow-400">🏆</span>}
                        {entry.summary}
                        {isMilestone && <span className="text-xs text-yellow-300 bg-yellow-900/30 px-2 py-0.5 rounded ml-2">MILESTONE</span>}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{entry.timestamp.day}/{entry.timestamp.month}/{entry.timestamp.year} {entry.timeString}</p>
                </div>
                {entry.details && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="ml-2 text-xs text-slate-400 hover:text-white shrink-0 px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                )}
            </div>
            {renderDetails()}
        </div>
    );
};


const GamelogPanel: React.FC<{ entries: GameLogEntry[] }> = ({ entries }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredAndSortedEntries = useMemo(() => {
        return [...entries]
            .filter(entry => entry.summary.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortOrder === 'newest') {
                    if (a.timestamp.year !== b.timestamp.year) return b.timestamp.year - a.timestamp.year;
                    if (a.timestamp.month !== b.timestamp.month) return b.timestamp.month - a.timestamp.month;
                    if (a.timestamp.day !== b.timestamp.day) return b.timestamp.day - a.timestamp.day;
                    return b.timeString.localeCompare(a.timeString);
                } else {
                    if (a.timestamp.year !== b.timestamp.year) return a.timestamp.year - b.timestamp.year;
                    if (a.timestamp.month !== b.timestamp.month) return a.timestamp.month - b.timestamp.month;
                    if (a.timestamp.day !== b.timestamp.day) return a.timestamp.day - b.timestamp.day;
                    return a.timeString.localeCompare(b.timeString);
                }
            });
    }, [entries, searchTerm, sortOrder]);
    
    const handleSave = useCallback(() => {
        saveJsonToFile(entries, 'gamelog.json');
    }, [entries]);

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex gap-2 mb-3 shrink-0">
                <input
                    type="text"
                    placeholder="Search log..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-md placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')} className="px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
                 <button onClick={handleSave} title="Save Gamelog Locally" className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md">
                    💾
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
                {filteredAndSortedEntries.length > 0 ? (
                    filteredAndSortedEntries.map(entry => <LogEntry key={entry.id} entry={entry} />)
                ) : (
                    <div className="text-center text-slate-500 italic pt-10">No log entries found.</div>
                )}
            </div>
        </div>
    );
};

export default GamelogPanel;
