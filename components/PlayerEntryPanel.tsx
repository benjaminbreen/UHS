import React, { useState } from 'react';

interface PlayerEntryPanelProps {
    onAddEntry: (text: string) => void;
}

const PlayerEntryPanel: React.FC<PlayerEntryPanelProps> = ({ onAddEntry }) => {
    const [text, setText] = useState('');

    const handleAdd = () => {
        if (text.trim()) {
            onAddEntry(text.trim());
            setText('');
        }
    };

    return (
        <div className="flex flex-col h-full p-4 font-lora">
            <h4 className="text-lg font-semibold text-purple-300 mb-3 shrink-0">New Journal Entry</h4>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Record your thoughts, observations, or plans..."
                className="flex-1 w-full p-3 text-base bg-slate-800/70 border border-slate-600 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-purple-400 text-slate-200 placeholder-slate-500 leading-relaxed scrollbar-thin"
            />
            <button
                onClick={handleAdd}
                disabled={!text.trim()}
                className="mt-3 w-full py-2.5 text-sm font-bold text-white bg-purple-600 rounded-md hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
                Add Entry to Journal
            </button>
        </div>
    );
};

export default PlayerEntryPanel;
