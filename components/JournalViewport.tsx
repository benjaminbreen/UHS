/**
 * components/JournalViewport.tsx
 * Enhanced journal viewport with documentation features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, Edit3, MapPin, Calendar, Eye } from 'lucide-react';
import { formatGameDate } from '../utils/dateUtils';

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  location: string;
  date: string;
  timestamp: number;
}

interface JournalViewportProps {
  visible: boolean;
  currentLocation?: string;
  currentDate?: string;
  onClose?: () => void;
  onSave?: (entries: JournalEntry[]) => void;
  initialEntries?: JournalEntry[];
  documentationMode?: boolean;
  onDocumentationModeChange?: (enabled: boolean) => void;
}

const JournalViewport: React.FC<JournalViewportProps> = ({
  visible,
  currentLocation = 'Unknown Location',
  currentDate = 'Unknown Date',
  onClose,
  onSave,
  initialEntries = [],
  documentationMode = false,
  onDocumentationModeChange
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSaveRef = useRef<NodeJS.Timeout>();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (lastSaveRef.current) {
      clearTimeout(lastSaveRef.current);
    }
    lastSaveRef.current = setTimeout(() => {
      if (onSave && entries.length > 0) {
        onSave(entries);
      }
    }, 2000); // Save 2 seconds after last change

    return () => {
      if (lastSaveRef.current) {
        clearTimeout(lastSaveRef.current);
      }
    };
  }, [entries, onSave]);

  // Create new entry
  const createNewEntry = useCallback(() => {
    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      content: '',
      location: currentLocation,
      date: currentDate,
      timestamp: Date.now()
    };
    setCurrentEntry(newEntry);
    setIsEditing(true);
  }, [currentLocation, currentDate]);

  // Save current entry
  const saveCurrentEntry = useCallback(() => {
    if (currentEntry && currentEntry.content.trim()) {
      setEntries(prev => {
        const existing = prev.find(e => e.id === currentEntry.id);
        if (existing) {
          return prev.map(e => e.id === currentEntry.id ? currentEntry : e);
        } else {
          return [...prev, currentEntry];
        }
      });
      setIsEditing(false);
    }
  }, [currentEntry]);

  // Select entry
  const selectEntry = useCallback((entry: JournalEntry) => {
    if (isEditing && currentEntry) {
      saveCurrentEntry();
    }
    setCurrentEntry(entry);
    setIsEditing(false);
  }, [isEditing, currentEntry, saveCurrentEntry]);

  // Delete entry
  const deleteEntry = useCallback((entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    if (currentEntry?.id === entryId) {
      setCurrentEntry(null);
      setIsEditing(false);
    }
  }, [currentEntry]);

  // Handle text change
  const handleTextChange = useCallback((value: string) => {
    if (currentEntry) {
      setCurrentEntry(prev => prev ? { ...prev, content: value } : null);
    }
  }, [currentEntry]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentEntry?.content]);

  // Initialize with first entry or create new one
  useEffect(() => {
    if (visible && !currentEntry && entries.length === 0) {
      createNewEntry();
    } else if (visible && !currentEntry && entries.length > 0) {
      setCurrentEntry(entries[0]);
    }
  }, [visible, currentEntry, entries.length, createNewEntry]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
      // Command+Enter (Mac) or Ctrl+Enter (PC) to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        saveCurrentEntry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose, saveCurrentEntry]);

  if (!visible) return null;

  const dateInfo = currentEntry ? {
    location: currentEntry.location,
    date: currentEntry.date
  } : {
    location: currentLocation,
    date: currentDate
  };

  return (
    <div className={`
      absolute top-0 left-0 right-0 z-40
      bg-slate-900/95 backdrop-blur-sm
      border-b border-slate-700/50
      transform transition-transform duration-300
      ${visible ? 'translate-y-0' : '-translate-y-full'}
      ${isMobile ? 'h-1/3' : 'h-80'}
    `}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Field Journal</h2>
            <div className="flex items-center gap-2">
              {documentationMode && (
                <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded">
                  <Eye className="w-3 h-3" />
                  Doc Mode
                </div>
              )}
              {/* Keyboard shortcuts hint */}
              <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                ⌘J • ESC • ⌘↵
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => onDocumentationModeChange?.(!documentationMode)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  documentationMode
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                📝 Documentation
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Writing Area - Left 2/3 on desktop, full width on mobile */}
          <div className={`${isMobile ? 'w-full' : 'w-2/3'} flex flex-col`}>
            {/* Location/Date Header */}
            <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-700/30">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{dateInfo.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{dateInfo.date}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={saveCurrentEntry}
                    className="ml-auto text-green-400 hover:text-green-300 flex items-center gap-1"
                    title="Save entry (⌘↵)"
                  >
                    <Edit3 className="w-3 h-3" />
                    Save
                  </button>
                )}
              </div>
            </div>

            {/* Text Editor */}
            <div className="flex-1 p-4 overflow-hidden">
              {currentEntry ? (
                <textarea
                  ref={textareaRef}
                  value={currentEntry.content}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  placeholder="Record your observations, thoughts, and discoveries... (⌘↵ to save)"
                  className={`
                    w-full h-full resize-none border-none outline-none
                    bg-transparent text-slate-200 placeholder-slate-500
                    ${isMobile ? 'text-sm' : 'text-base'}
                    font-serif leading-relaxed
                  `}
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    lineHeight: '1.6'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <button
                    onClick={createNewEntry}
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    Create your first journal entry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Entries List - Right 1/3 on desktop, hidden on mobile */}
          {!isMobile && (
            <div className="w-1/3 border-l border-slate-700/50 bg-slate-800/30 flex flex-col">
              {/* Mobile documentation toggle */}
              <div className="p-3 border-b border-slate-700/30">
                <button
                  onClick={() => onDocumentationModeChange?.(!documentationMode)}
                  className={`w-full text-xs px-3 py-2 rounded transition-colors ${
                    documentationMode
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {documentationMode ? '📝 Exit Doc Mode' : '📝 Documentation Mode'}
                </button>
              </div>

              {/* Entries Header */}
              <div className="px-3 py-2 border-b border-slate-700/30 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Entries ({entries.length})
                </span>
                <button
                  onClick={createNewEntry}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  + New
                </button>
              </div>

              {/* Entries List */}
              <div className="flex-1 overflow-y-auto">
                {entries.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    No entries yet
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => selectEntry(entry)}
                        className={`
                          p-2 rounded cursor-pointer transition-colors
                          ${currentEntry?.id === entry.id
                            ? 'bg-slate-700/50 border border-slate-600'
                            : 'hover:bg-slate-800/50'
                          }
                        `}
                      >
                        <div className="text-xs font-medium text-white truncate">
                          {entry.title || entry.content.split('\\n')[0] || 'Untitled'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {entry.location}
                        </div>
                        <div className="text-xs text-slate-500">
                          {entry.date}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile bottom bar */}
        {isMobile && (
          <div className="border-t border-slate-700/30 bg-slate-800/60 px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => onDocumentationModeChange?.(!documentationMode)}
              className={`text-xs px-3 py-1 rounded ${
                documentationMode
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              📝 Doc Mode
            </button>
            <div className="text-xs text-slate-400">
              {entries.length} entries
            </div>
            <button
              onClick={createNewEntry}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + New Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalViewport;