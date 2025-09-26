import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { GameLogEntry, DialogueEntry } from '../types';
import { saveJsonToFile } from '../utils/fileUtils';
import { Search, Download, Filter, ChevronRight, ChevronDown, Clock, Calendar } from 'lucide-react';

// Enhanced type configuration with better visuals
const TYPE_CONFIG: Record<GameLogEntry['type'], {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    label: string;
}> = {
    'DIALOGUE': {
        color: 'text-amber-300',
        bgColor: 'bg-amber-900/10',
        borderColor: 'border-amber-500/30',
        icon: '💬',
        label: 'Dialogue'
    },
    'COMBAT': {
        color: 'text-red-400',
        bgColor: 'bg-red-900/10',
        borderColor: 'border-red-500/30',
        icon: '⚔️',
        label: 'Combat'
    },
    'MAP_ENTRY': {
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/10',
        borderColor: 'border-blue-500/30',
        icon: '🗺️',
        label: 'Location'
    },
    'SKILL_USE': {
        color: 'text-green-400',
        bgColor: 'bg-green-900/10',
        borderColor: 'border-green-500/30',
        icon: '🎯',
        label: 'Skill'
    },
    'ITEM_ACQUIRED': {
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/10',
        borderColor: 'border-purple-500/30',
        icon: '📦',
        label: 'Item'
    },
    'TRADE': {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/10',
        borderColor: 'border-yellow-500/30',
        icon: '🤝',
        label: 'Trade'
    },
    'REST': {
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-900/10',
        borderColor: 'border-indigo-500/30',
        icon: '🏕️',
        label: 'Rest'
    },
    'MILESTONE_COMBAT': {
        color: 'text-orange-300',
        bgColor: 'bg-gradient-to-r from-orange-900/20 to-red-900/10',
        borderColor: 'border-orange-500/50',
        icon: '🏆',
        label: 'Combat Milestone'
    },
    'MILESTONE_EXPLORATION': {
        color: 'text-cyan-300',
        bgColor: 'bg-gradient-to-r from-cyan-900/20 to-blue-900/10',
        borderColor: 'border-cyan-500/50',
        icon: '🌟',
        label: 'Exploration Milestone'
    },
    'MILESTONE_ACHIEVEMENT': {
        color: 'text-emerald-300',
        bgColor: 'bg-gradient-to-r from-emerald-900/20 to-green-900/10',
        borderColor: 'border-emerald-500/50',
        icon: '✨',
        label: 'Achievement'
    },
    'QUEST_START': {
        color: 'text-pink-400',
        bgColor: 'bg-pink-900/10',
        borderColor: 'border-pink-500/30',
        icon: '📜',
        label: 'Quest Started'
    },
    'QUEST_COMPLETE': {
        color: 'text-lime-400',
        bgColor: 'bg-gradient-to-r from-lime-900/20 to-green-900/10',
        borderColor: 'border-lime-500/50',
        icon: '✅',
        label: 'Quest Complete'
    },
    'STUDY': {
        color: 'text-violet-400',
        bgColor: 'bg-violet-900/10',
        borderColor: 'border-violet-500/30',
        icon: '🔬',
        label: 'Study'
    },
};

// Single log entry component with enhanced visuals
const LogEntry: React.FC<{
    entry: GameLogEntry;
    isCompact?: boolean;
}> = ({ entry, isCompact = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG['MAP_ENTRY'];
    const isMilestone = entry.type.startsWith('MILESTONE_') || entry.type === 'QUEST_COMPLETE';

    const formatTime = (timeString: string, timestamp: any) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[timestamp.month - 1] || 'Unknown';
        return {
            date: `${month} ${timestamp.day}, ${timestamp.year}`,
            time: timeString
        };
    };

    const timeInfo = formatTime(entry.timeString, entry.timestamp);

    const renderDetails = () => {
        if (!entry.details || !isExpanded) return null;

        if (entry.type === 'DIALOGUE' && Array.isArray(entry.details)) {
            return (
                <div className="mt-3 space-y-2 pl-10">
                    {(entry.details as DialogueEntry[]).map((line, index) => (
                        <div key={index} className="flex gap-2">
                            <span className={`shrink-0 text-xs font-semibold ${
                                line.speaker === 'player' ? 'text-emerald-400' : 'text-violet-400'
                            }`}>
                                {line.speaker === 'player' ? 'You:' : `${line.speaker}:`}
                            </span>
                            <span className="text-xs text-slate-300 italic">"{line.text}"</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof entry.details === 'string') {
            return (
                <div className="mt-3 pl-10 text-xs text-slate-400">
                    {entry.details}
                </div>
            );
        }

        return (
            <pre className="mt-3 ml-10 text-xs text-slate-500 bg-slate-900/50 p-2 rounded-md overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
            </pre>
        );
    };

    if (isCompact) {
        return (
            <div className={`group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-slate-800/30 cursor-pointer`}
                 onClick={() => setIsExpanded(!isExpanded)}>
                <span className="text-base mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{entry.summary}</p>
                    <p className="text-[10px] text-slate-500">{timeInfo.time}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`
            relative overflow-hidden rounded-lg border
            ${isMilestone ? 'ring-1 ring-yellow-500/20' : ''}
            ${config.bgColor} ${config.borderColor}
            transition-all duration-150 hover:border-opacity-60
        `}>
            {/* Milestone badge */}
            {isMilestone && (
                <div className="absolute top-2 right-2">
                    <span className="text-xs text-yellow-300 bg-yellow-900/50 px-2 py-0.5 rounded-full font-semibold">
                        MILESTONE
                    </span>
                </div>
            )}

            <div className="p-3">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        <span className="text-xl">{entry.icon || config.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Type label and summary */}
                        <div className="flex items-start gap-2 mb-1">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color} opacity-70`}>
                                {config.label}
                            </span>
                        </div>
                        <p className={`text-sm font-medium ${config.color} leading-relaxed`}>
                            {entry.summary}
                        </p>

                        {/* Timestamp */}
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {timeInfo.date}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeInfo.time}
                            </span>
                        </div>
                    </div>

                    {/* Expand button */}
                    {entry.details && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`
                                flex-shrink-0 p-1.5 rounded-md
                                bg-slate-800/50 hover:bg-slate-700/50
                                text-slate-400 hover:text-slate-200
                                transition-colors
                            `}
                        >
                            {isExpanded ?
                                <ChevronDown className="w-4 h-4" /> :
                                <ChevronRight className="w-4 h-4" />
                            }
                        </button>
                    )}
                </div>

                {/* Expanded details */}
                {renderDetails()}
            </div>
        </div>
    );
};

// Main gamelog panel with enhanced functionality
const GamelogPanel: React.FC<{ entries: GameLogEntry[] }> = ({ entries }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [filterType, setFilterType] = useState<GameLogEntry['type'] | 'all'>('all');
    const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
    const [showFilters, setShowFilters] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Get unique entry types for filter
    const availableTypes = useMemo(() => {
        const types = new Set(entries.map(e => e.type));
        return Array.from(types).sort();
    }, [entries]);

    // Group entries by date
    const groupedEntries = useMemo(() => {
        const filtered = entries
            .filter(entry => {
                const matchesSearch = entry.summary.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = filterType === 'all' || entry.type === filterType;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                const aDate = `${a.timestamp.year}-${a.timestamp.month}-${a.timestamp.day}`;
                const bDate = `${b.timestamp.year}-${b.timestamp.month}-${b.timestamp.day}`;

                if (sortOrder === 'newest') {
                    if (aDate !== bDate) return bDate.localeCompare(aDate);
                    return b.timeString.localeCompare(a.timeString);
                } else {
                    if (aDate !== bDate) return aDate.localeCompare(bDate);
                    return a.timeString.localeCompare(b.timeString);
                }
            });

        // Group by date
        const groups: Record<string, GameLogEntry[]> = {};
        filtered.forEach(entry => {
            const key = `${entry.timestamp.year}-${entry.timestamp.month}-${entry.timestamp.day}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(entry);
        });

        return groups;
    }, [entries, searchTerm, sortOrder, filterType]);

    const handleSave = useCallback(() => {
        saveJsonToFile(entries, `gamelog_${Date.now()}.json`);
    }, [entries]);

    const formatDateHeader = (dateKey: string) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        return `${monthNames[month - 1]} ${day}, ${year}`;
    };

    // Stats summary
    const stats = useMemo(() => {
        const typeCount: Record<string, number> = {};
        entries.forEach(entry => {
            typeCount[entry.type] = (typeCount[entry.type] || 0) + 1;
        });
        return typeCount;
    }, [entries]);

    return (
        <div className="flex flex-col h-full bg-slate-900/40">
            {/* Header with controls */}
            <div className="shrink-0 p-3 border-b border-slate-700/50 bg-slate-800/30">
                {/* Search and primary controls */}
                <div className="flex gap-2 mb-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search entries..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/50 border border-slate-600/50 rounded-md
                                     placeholder-slate-500 text-slate-200
                                     focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors
                                  ${showFilters
                                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                                    : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-slate-500/50'}`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleSave}
                        title="Export Gamelog"
                        className="px-3 py-2 text-sm bg-slate-800/50 hover:bg-slate-700/50
                                 border border-slate-600/50 hover:border-slate-500/50
                                 rounded-md transition-colors text-slate-300"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter controls (collapsible) */}
                {showFilters && (
                    <div className="pt-2 border-t border-slate-700/50 space-y-2 animate-fadeIn">
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value as any)}
                                className="flex-1 px-2 py-1.5 text-xs bg-slate-800/50 border border-slate-600/50 rounded-md
                                         text-slate-200 focus:outline-none focus:border-purple-400/50"
                            >
                                <option value="all">All Types</option>
                                {availableTypes.map(type => (
                                    <option key={type} value={type}>
                                        {TYPE_CONFIG[type]?.label || type}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                className="px-2 py-1.5 text-xs bg-slate-800/50 border border-slate-600/50 rounded-md
                                         text-slate-200 focus:outline-none focus:border-purple-400/50"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>

                            <select
                                value={viewMode}
                                onChange={e => setViewMode(e.target.value as 'detailed' | 'compact')}
                                className="px-2 py-1.5 text-xs bg-slate-800/50 border border-slate-600/50 rounded-md
                                         text-slate-200 focus:outline-none focus:border-purple-400/50"
                            >
                                <option value="detailed">Detailed View</option>
                                <option value="compact">Compact View</option>
                            </select>
                        </div>

                        {/* Quick stats */}
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(stats).slice(0, 5).map(([type, count]) => (
                                <span
                                    key={type}
                                    className="text-[10px] px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50"
                                >
                                    {TYPE_CONFIG[type as GameLogEntry['type']]?.icon} {count}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable content area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-slate-800/30"
            >
                {Object.keys(groupedEntries).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(groupedEntries).map(([dateKey, dateEntries]) => (
                            <div key={dateKey}>
                                {/* Date header */}
                                <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm mb-2">
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                                        <span className="text-xs font-semibold text-slate-400 px-2">
                                            {formatDateHeader(dateKey)}
                                        </span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                                    </div>
                                </div>

                                {/* Entries for this date */}
                                <div className={viewMode === 'compact' ? 'space-y-1' : 'space-y-3'}>
                                    {dateEntries.map(entry => (
                                        <LogEntry
                                            key={entry.id}
                                            entry={entry}
                                            isCompact={viewMode === 'compact'}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-4xl mb-3 opacity-20">📜</div>
                        <p className="text-sm text-slate-500">No entries found</p>
                        <p className="text-xs text-slate-600 mt-1">
                            {searchTerm && 'Try adjusting your search terms'}
                            {filterType !== 'all' && ' or filters'}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer with entry count */}
            <div className="shrink-0 px-3 py-2 border-t border-slate-700/50 bg-slate-800/20">
                <p className="text-xs text-slate-500 text-center">
                    {Object.values(groupedEntries).flat().length} of {entries.length} entries shown
                </p>
            </div>
        </div>
    );
};

export default GamelogPanel;