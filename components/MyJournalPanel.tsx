import React, { useState, useMemo, useCallback } from 'react';
import { PlayerJournalEntry } from '../types';
import { saveJsonToFile } from '../utils/fileUtils';

const MyJournalPanel: React.FC<{ entries: PlayerJournalEntry[] }> = ({ entries }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredAndSortedEntries = useMemo(() => {
        return [...entries]
            .filter(entry => entry.text.toLowerCase().includes(searchTerm.toLowerCase()))
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
        saveJsonToFile(entries, 'my_journal.json');
    }, [entries]);

    return (
        <div className="flex flex-col h-full p-4 font-lora">
            <div className="flex gap-2 mb-3 shrink-0">
                <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-md placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                 <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')} className="px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
                <button onClick={handleSave} title="Save Journal Locally" className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md">
                    💾
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {filteredAndSortedEntries.length > 0 ? (
                    filteredAndSortedEntries.map(entry => (
                        <div key={entry.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                            <p className="text-xs text-slate-400 font-mono mb-2">
                                {entry.timestamp.day}/{entry.timestamp.month}/{entry.timestamp.year} - {entry.timeString}
                            </p>
                            <p className="text-slate-200 whitespace-pre-wrap">{entry.text}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-500 italic pt-10">
                        {entries.length > 0 ? "No entries match your search." : "You haven't written any journal entries yet."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyJournalPanel;
