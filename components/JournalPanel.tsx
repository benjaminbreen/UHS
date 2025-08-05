import React, { useState } from 'react';
import { GameLogEntry, PlayerJournalEntry } from '../types';
import GamelogPanel from './GamelogPanel';
import PlayerEntryPanel from './PlayerEntryPanel';
import MyJournalPanel from './MyJournalPanel';

type JournalSubTab = 'gamelog' | 'new_entry' | 'my_journal';

interface JournalPanelProps {
    gameLog: GameLogEntry[];
    playerJournal: PlayerJournalEntry[];
    onAddPlayerEntry: (text: string) => void;
}

const JournalPanel: React.FC<JournalPanelProps> = ({ gameLog, playerJournal, onAddPlayerEntry }) => {
    const [activeSubTab, setActiveSubTab] = useState<JournalSubTab>('gamelog');

    const subTabs: { id: JournalSubTab; label: string }[] = [
        { id: 'gamelog', label: 'Gamelog' },
        { id: 'new_entry', label: 'New Entry' },
        { id: 'my_journal', label: 'My Journal' },
    ];

    const renderContent = () => {
        switch (activeSubTab) {
            case 'gamelog':
                return <GamelogPanel entries={gameLog} />;
            case 'new_entry':
                return <PlayerEntryPanel onAddEntry={onAddPlayerEntry} />;
            case 'my_journal':
                return <MyJournalPanel entries={playerJournal} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex bg-slate-800/60 rounded-t-lg border-x border-t border-slate-700/50 shrink-0">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 py-2.5 px-1 text-center text-sm font-semibold transition-colors duration-200 border-b-2
                        ${activeSubTab === tab.id ? 'text-white border-purple-400' : 'text-slate-300 border-transparent hover:bg-slate-700/50 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 bg-slate-900/30 rounded-b-lg border-x border-b border-slate-700/50 overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
};

export default JournalPanel;
