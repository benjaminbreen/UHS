/**
 * components/JournalViewport.tsx
 * Enhanced journal viewport with documentation features
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, FileText, Edit3, MapPin, Calendar, Eye, Search, Book, Save, ChevronDown, ChevronUp, Feather, ScrollText, PenTool } from 'lucide-react';
import type { CulturalZone } from '../types/characterData';
import { journalService } from '../services/journalService';

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  location: string;
  date: string;
  timestamp: number;
  wordCount?: number;
  lastModified?: number;
  culturalZone?: CulturalZone;
  imageUrl?: string;
  imageCaption?: string;
  isStudyObservation?: boolean;
  studiedItem?: string;
}

interface JournalViewportProps {
  visible: boolean;
  currentLocation?: string;
  currentDate?: string;
  currentCulturalZone?: CulturalZone;
  onClose?: () => void;
  onSave?: (entries: JournalEntry[]) => void;
  initialEntries?: JournalEntry[];
  documentationMode?: boolean;
  onDocumentationModeChange?: (enabled: boolean) => void;
}

// Detect Safari for performance optimizations
const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
};

// Format historical date with proper BCE/CE notation
const formatHistoricalDate = (dateStr: string): string => {
  if (!dateStr || dateStr === 'Unknown Date') return dateStr;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Try to extract components from the date string
  const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/([-]?\d+)/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const monthIndex = parseInt(month) - 1;
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    const monthName = monthNames[monthIndex] || 'Unknown';
    const yearSuffix = yearNum < 0 ? ' BCE' : ' CE';
    const absYear = Math.abs(yearNum);

    return `${monthName} ${dayNum}, ${absYear}${yearSuffix}`;
  }

  return dateStr;
};

// Extract region info from location string
const formatLocationWithRegion = (location: string): { primary: string; region?: string } => {
  if (!location) return { primary: location };

  const parts = location.split(',').map(p => p.trim());
  if (parts.length > 1) {
    return {
      primary: parts[0],
      region: parts.slice(1).join(', ')
    };
  }

  return { primary: location };
};

const JournalViewport: React.FC<JournalViewportProps> = ({
  visible,
  currentLocation = 'Unknown Location',
  currentDate = 'Unknown Date',
  currentCulturalZone,
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
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showMobileEntries, setShowMobileEntries] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSaveRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for viewport size
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsLargeScreen(width >= 1440);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Focus textarea when journal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  // Calculate word count
  const wordCount = useMemo(() => {
    if (!currentEntry?.content) return 0;
    return currentEntry.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [currentEntry?.content]);

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.content.toLowerCase().includes(query) ||
      entry.title?.toLowerCase().includes(query) ||
      entry.location.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  // Auto-save functionality with status
  useEffect(() => {
    if (lastSaveRef.current) {
      clearTimeout(lastSaveRef.current);
    }

    if (currentEntry && currentEntry.content) {
      setLastSaveStatus('saving');

      lastSaveRef.current = setTimeout(() => {
        if (onSave && entries.length > 0) {
          onSave(entries);
          setLastSaveStatus('saved');
        }
      }, 2000); // Save 2 seconds after last change
    }

    return () => {
      if (lastSaveRef.current) {
        clearTimeout(lastSaveRef.current);
      }
    };
  }, [entries, onSave, currentEntry]);

  // Create new entry
  const createNewEntry = useCallback(() => {
    // Save current entry if editing
    if (isEditing && currentEntry) {
      saveCurrentEntry();
    }

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      content: '',
      location: currentLocation,
      date: currentDate,
      timestamp: Date.now(),
      wordCount: 0,
      lastModified: Date.now(),
      culturalZone: currentCulturalZone
    };
    setCurrentEntry(newEntry);
    setIsEditing(true);
    setSearchQuery(''); // Clear search when creating new entry

    // Focus textarea
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [currentLocation, currentDate, currentCulturalZone, isEditing, currentEntry]);

  // Save current entry with auto-title generation
  const saveCurrentEntry = useCallback(() => {
    if (currentEntry && currentEntry.content.trim()) {
      // Auto-generate title from first line if not set
      const updatedEntry = {
        ...currentEntry,
        title: currentEntry.title || currentEntry.content.split('\n')[0].slice(0, 50),
        wordCount: currentEntry.content.trim().split(/\s+/).filter(word => word.length > 0).length,
        lastModified: Date.now()
      };

      setEntries(prev => {
        const existing = prev.find(e => e.id === updatedEntry.id);
        if (existing) {
          return prev.map(e => e.id === updatedEntry.id ? updatedEntry : e).sort((a, b) => b.timestamp - a.timestamp);
        } else {
          return [updatedEntry, ...prev].sort((a, b) => b.timestamp - a.timestamp);
        }
      });
      setCurrentEntry(updatedEntry);
      setIsEditing(false);
      setLastSaveStatus('saved');
    }
  }, [currentEntry]);

  // Handle text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (currentEntry) {
      setCurrentEntry(prev => prev ? {
        ...prev,
        content: value,
        wordCount: value.trim().split(/\s+/).filter(word => word.length > 0).length
      } : null);
      setLastSaveStatus('unsaved');
    }
  }, [currentEntry]);

  // Handle keyboard shortcuts for text formatting
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Bold shortcut (Cmd/Ctrl + B)
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const newText = `**${selectedText}**`;
        const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        handleTextChange({ target: { value: newValue } } as any);
        // Reset cursor position
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
        }, 0);
      }
    }
    // Italic shortcut (Cmd/Ctrl + I)
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const newText = `*${selectedText}*`;
        const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        handleTextChange({ target: { value: newValue } } as any);
        // Reset cursor position
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
        }, 0);
      }
    }
  }, [handleTextChange]);

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

  // Listen for new journal entries from study observations
  useEffect(() => {
    const unsubscribe = journalService.onNewEntry((entry) => {
      console.log('[JournalViewport] Received new study entry:', entry.title);

      // Add the new entry to the list
      setEntries(prev => [entry, ...prev].sort((a, b) => b.timestamp - a.timestamp));

      // Set it as the current entry for immediate viewing
      setCurrentEntry(entry);
      setIsEditing(false); // View mode for auto-added entries
    });

    return unsubscribe;
  }, []);

  // Handle closing
  const handleClose = useCallback(() => {
    if (isEditing && currentEntry) {
      saveCurrentEntry();
    }
    onClose?.();
  }, [isEditing, currentEntry, saveCurrentEntry, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visible && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (visible) {
      // Small delay to avoid closing immediately on open
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, handleClose]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      // Escape to close
      if (e.key === 'Escape' && !showSearch) {
        e.preventDefault();
        handleClose();
      }
      // Command+Enter (Mac) or Ctrl+Enter (PC) to save and close
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        saveCurrentEntry();
        if (e.shiftKey) {
          onClose?.();
        }
      }
      // Command+N for new entry
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewEntry();
      }
      // Command+/ for search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowSearch(!showSearch);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Command+S to force save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentEntry();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [visible, handleClose, saveCurrentEntry, createNewEntry, showSearch]);

  if (!visible) return null;

  // Determine layout based on device
  const getLayoutClass = () => {
    if (isMobile) return 'w-full';
    if (isTablet) return 'w-[90%]';
    if (isLargeScreen) return 'w-[70%]'; // Narrower on large screens
    return 'w-[80%]'; // Default desktop
  };

  const dateInfo = currentEntry ? {
    location: currentEntry.location,
    date: currentEntry.date,
    culturalZone: currentEntry.culturalZone
  } : {
    location: currentLocation,
    date: currentDate,
    culturalZone: currentCulturalZone
  };

  const formattedDate = formatHistoricalDate(dateInfo.date);
  const locationInfo = formatLocationWithRegion(dateInfo.location);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 right-0 z-[60] flex justify-center animate-slideDown"
      style={{
        animationDuration: '0.4s',
        animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className={`${getLayoutClass()} max-w-[1400px]`}>
        <div className={`
          rounded-b-2xl shadow-2xl
          ${isMobile ? 'h-[50vh]' : isTablet ? 'h-[48vh]' : isLargeScreen ? 'h-[45vh]' : 'h-[50vh]'}
        `}
        style={{
          contain: 'layout style',
          backdropFilter: isSafari ? 'none' : 'blur(24px) saturate(1.1)',
          backgroundColor: 'var(--bg-primary)',
          borderWidth: '2px',
          borderColor: 'var(--border-normal)',
          borderRadius: '16px',
          boxShadow: `
            0 32px 80px -20px rgba(0, 0, 0, 0.6),
            0 16px 40px -10px rgba(0, 0, 0, 0.4)
          `,
          maxHeight: isMobile ? '48vh' : '46vh',
          position: 'relative'
        }}
        >
          <div className="h-full flex flex-col">
            {/* Header - Minimalist Modern */}
            <div className="
              px-6 py-4
              flex items-center justify-between
              rounded-t-2xl
              animate-popIn
            "
            style={{
              background: 'var(--surface-elevated)',
              borderBottomWidth: '1px',
              borderColor: 'var(--border-normal)',
              borderTopLeftRadius: '14px',
              borderTopRightRadius: '14px',
              animationDelay: '0.1s',
              animationDuration: '0.3s'
            }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderWidth: '1px',
                      borderColor: 'var(--border-normal)'
                    }}
                  >
                    <ScrollText size={20} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <h2 className="text-lg font-bold tracking-wide"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Field Journal
                  </h2>
                </div>
                {/* Keyboard hints */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="px-2 py-0.5 rounded text-[11px]"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderWidth: '1px',
                      borderColor: 'var(--border-normal)'
                    }}
                  >⌘J</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded text-[11px]"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderWidth: '1px',
                      borderColor: 'var(--border-normal)'
                    }}
                  >ESC</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Search button */}
                <button
                  onClick={() => {
                    setShowSearch(!showSearch);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: 'var(--surface-muted)' }}
                  title="Search (⌘/)"
                >
                  <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 group"
                  style={{ backgroundColor: 'var(--surface-muted)' }}
                  title="Close (Esc)"
                >
                  <X size={19} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* Search bar (slides down when active) */}
            <div className={`
              overflow-hidden transition-all duration-500 ease-out
              ${showSearch ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className={`
                px-5 py-2.5 transform transition-all duration-500 ease-out
                ${showSearch ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
              `}
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderBottomWidth: '1px',
                  borderColor: 'var(--border-normal)',
                  willChange: 'transform, opacity'
                }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearch(false);
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Search journal entries..."
                  className="
                    w-full px-3 py-2 text-sm rounded-lg
                    focus:outline-none focus:ring-2 focus:scale-[1.01]
                    transition-all duration-300 ease-out
                  "
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    borderWidth: '1px',
                    borderColor: 'var(--border-normal)',
                    color: 'var(--text-primary)',
                    ['--tw-ring-color' as any]: 'var(--accent-primary)'
                  }}
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`
              flex-1 flex overflow-hidden p-4 gap-4
              ${isMobile ? 'flex-col p-3 gap-3' : ''}
            `}>
              {/* Writing Area - Elegant with Subtle Hierarchy */}
              <div className={`
                ${isMobile ? 'flex-1' : isTablet ? 'flex-[2]' : 'flex-[2.5]'}
                flex flex-col
                rounded-xl
                relative
                overflow-hidden
                animate-popIn
              `}
              style={{
                backgroundColor: 'var(--surface-muted)',
                borderWidth: '1px',
                borderColor: 'var(--border-normal)',
                borderRadius: '12px',
                boxShadow: `
                  inset 0 1px 2px 0 rgba(0, 0, 0, 0.05),
                  0 2px 8px 0 rgba(0, 0, 0, 0.08)
                `,
                animationDelay: '0.15s',
                animationDuration: '0.4s'
              }}
              >
                {/* Entry header bar */}
                <div className="px-4 py-2 rounded-t-xl"
                  style={{
                    backgroundColor: 'var(--surface-muted)',
                    borderBottomWidth: '1px',
                    borderColor: 'var(--border-normal)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} style={{ color: 'var(--text-secondary)' }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{locationInfo.primary}</span>
                        {locationInfo.region && (
                          <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>• {locationInfo.region}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} style={{ color: 'var(--text-secondary)' }} />
                        <span className="font-medium text-xs tracking-wide" style={{ color: 'var(--text-primary)' }}>{formattedDate}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        {documentationMode !== undefined && (
                          <button
                            onClick={() => onDocumentationModeChange?.(!documentationMode)}
                            className="px-3 py-1.5 text-xs rounded-full transition-all duration-300 flex items-center gap-1.5 hover:scale-110 hover:shadow-md active:scale-95 animate-in fade-in slide-in-from-right-1 duration-300"
                            style={{
                              backgroundColor: documentationMode ? 'var(--accent-primary)' : 'var(--surface-card)',
                              color: documentationMode ? 'white' : 'var(--text-secondary)',
                              borderWidth: '1px',
                              borderColor: documentationMode ? 'transparent' : 'var(--border-normal)',
                              boxShadow: documentationMode ? '0 2px 8px -2px var(--accent-primary)' : 'none'
                            }}
                            title="Toggle documentation mode"
                          >
                            <Eye size={13} />
                            <span className="font-medium">Doc</span>
                          </button>
                        )}
                        {isEditing ? (
                          <button
                            onClick={saveCurrentEntry}
                            className="px-3 py-1.5 text-xs rounded-full transition-all duration-300 flex items-center gap-1.5 hover:scale-110 hover:shadow-lg active:scale-95 animate-in fade-in slide-in-from-right-2 duration-300"
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'white',
                              borderWidth: '1px',
                              borderColor: 'transparent',
                              boxShadow: '0 2px 8px -2px var(--color-success)'
                            }}
                          >
                            <Save size={13} />
                            <span className="font-semibold">Save</span>
                          </button>
                        ) : (
                          <button
                            onClick={createNewEntry}
                            className="px-3 py-1.5 text-xs rounded-full transition-all duration-300 flex items-center gap-1.5 hover:scale-110 hover:shadow-lg active:scale-95 animate-in fade-in slide-in-from-right-2 duration-300"
                            style={{
                              backgroundColor: 'var(--accent-primary)',
                              color: 'white',
                              borderWidth: '1px',
                              borderColor: 'transparent',
                              boxShadow: '0 2px 8px -2px var(--accent-primary)'
                            }}
                            title="New Entry (⌘N)"
                          >
                            <Edit3 size={13} />
                            <span className="font-semibold">New</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Writing area with image support - Lighter background */}
                <div className="flex-1 p-5 overflow-y-auto relative animate-in fade-in duration-700 delay-150"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    borderRadius: '8px',
                    margin: '10px',
                    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {currentEntry ? (
                    <div className="flex flex-col gap-4">
                      {/* Study observation header if applicable */}
                      <div className={`
                        overflow-hidden transition-all duration-500 ease-out
                        ${currentEntry.isStudyObservation && currentEntry.studiedItem ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
                      `}>
                        <div className={`
                          px-3 py-2.5 rounded-lg relative overflow-hidden transform transition-all duration-500 ease-out
                          hover:shadow-md hover:scale-[1.01]
                          ${currentEntry.isStudyObservation && currentEntry.studiedItem ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
                        `}
                          style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderWidth: '1px',
                            borderColor: 'var(--accent-primary)',
                            boxShadow: '0 0 8px -4px var(--accent-primary)',
                            willChange: 'transform, opacity'
                          }}
                        >
                          {/* Subtle gradient accent on left edge */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50"
                            style={{
                              background: `linear-gradient(180deg, var(--accent-primary), transparent)`
                            }}
                          />
                          <div className="text-xs font-medium mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                            Study Observation
                          </div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{currentEntry.studiedItem}</div>
                        </div>
                      </div>

                      {/* Image display if present */}
                      <div className={`
                        overflow-hidden transition-all duration-500 ease-out
                        ${currentEntry.imageUrl ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                      `}>
                        <div className={`
                          relative rounded-lg overflow-hidden transform transition-all duration-500 ease-out
                          hover:shadow-xl hover:-translate-y-0.5 group
                          ${currentEntry.imageUrl ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
                        `}
                          style={{
                            borderWidth: '1px',
                            borderColor: 'var(--border-normal)',
                            backgroundColor: 'var(--surface-elevated)',
                            willChange: 'transform, opacity'
                          }}
                        >
                          <img
                            src={currentEntry.imageUrl}
                            alt={currentEntry.imageCaption || 'Journal image'}
                            className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                            style={{
                              maxHeight: '280px',
                              backgroundColor: 'var(--surface-elevated)'
                            }}
                          />
                          {currentEntry.imageCaption && (
                            <div className="px-3 py-2"
                              style={{
                                backgroundColor: 'var(--surface-muted)',
                                borderTopWidth: '1px',
                                borderColor: 'var(--border-normal)'
                              }}
                            >
                              <p className="text-xs italic text-center" style={{ color: 'var(--text-secondary)' }}>
                                {currentEntry.imageCaption}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main text area */}
                    <textarea
                      ref={textareaRef}
                      value={currentEntry.content}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      disabled={!isEditing}
                      placeholder="Begin your entry here..."
                      className={`
                        w-full h-full resize-none
                        focus:outline-none
                        leading-relaxed
                        disabled:opacity-70
                        transition-all duration-500 ease-out
                        animate-in fade-in duration-700 delay-200
                        ${isEditing ? 'p-4 scale-[1.00]' : 'p-1 scale-100'}
                        placeholder:text-sm placeholder:italic placeholder:transition-all placeholder:duration-300
                      `}
                      style={{
                        minHeight: '120px',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        fontFamily: 'serif',
                        fontSize: '20px',
                        fontWeight: 400,
                        lineHeight: '1.75',
                        letterSpacing: '0.01em',
                        color: 'var(--text-primary)',
                        backgroundColor: 'transparent',
                        borderWidth: isEditing ? '0px' : '0',
                        borderStyle: isEditing ? 'dotted' : 'solid',
                        borderColor: isEditing ? 'var(--accent-primary)' : 'transparent',
                        borderRadius: isEditing ? '8px' : '0',
                        opacity: isEditing ? 0.95 : 0.55
                      }}
                    />
                    </div>
                  ) : (
                    <div className="text-center py-8 animate-in fade-in duration-500">
                      <div className="relative inline-block mb-4">
                        <Feather
                          size={36}
                          className="mx-auto transition-all duration-700 hover:scale-110 hover:rotate-12"
                          style={{ color: 'var(--text-muted)' }}
                        />
                        {/* Subtle pulsing ring around icon */}
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            animationDuration: '3s'
                          }}
                        />
                      </div>
                      <p className="text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Begin your journal
                      </p>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                        Document your journey through history
                      </p>
                      <button
                        onClick={createNewEntry}
                        className="px-5 py-2.5 rounded-full transition-all duration-300 text-sm font-medium hover:scale-110 hover:shadow-lg active:scale-95"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'white',
                          boxShadow: '0 4px 12px -2px var(--accent-primary)'
                        }}
                      >
                        Create First Entry
                      </button>
                    </div>
                  )}
                </div>

                {/* Status bar */}
                <div className="px-4 py-2 flex items-center justify-between text-xs rounded-b-xl relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface-muted)',
                    borderTopWidth: '1px',
                    borderColor: 'var(--border-normal)'
                  }}
                >
                  {/* Subtle animated progress bar when saving */}
                  {lastSaveStatus === 'saving' && (
                    <div className="absolute top-0 left-0 h-[2px] w-full animate-pulse"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, var(--accent-primary) 50%, transparent 100%)`,
                        opacity: 0.0
                      }}
                    />
                  )}

                  <span className="flex items-center gap-2 transition-all duration-300" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold tabular-nums">{wordCount}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>words</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {lastSaveStatus === 'saving' ? (
                      <span className="flex items-center gap-1.5 animate-in fade-in duration-200" style={{ color: 'var(--text-secondary)' }}>
                        <div className="relative">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-primary)' }} />
                        </div>
                        <span className="text-[10px] font-medium">Saving...</span>
                      </span>
                    ) : lastSaveStatus === 'unsaved' ? (
                      <span className="flex items-center gap-1.5 animate-in fade-in duration-200" style={{ color: 'var(--color-warning)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-warning)' }} />
                        <span className="text-[10px] font-medium">Unsaved</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 animate-in fade-in duration-200" style={{ color: 'var(--color-success)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
                        <span className="text-[10px] font-medium">Saved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Entry List Sidebar - Theme-aware */}
              {!isMobile && (
                <div className={`
                  ${isTablet ? 'w-64' : 'w-72'}
                  rounded-xl
                  flex flex-col
                  animate-popIn
                `}
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderWidth: '1px',
                  borderColor: 'var(--border-normal)',
                  boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
                  animationDelay: '0.2s',
                  animationDuration: '0.4s'
                }}>
                  <div className="p-3.5 rounded-t-xl"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderBottomWidth: '1px',
                      borderColor: 'var(--border-normal)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Journal Entries</h3>
                      <button
                        onClick={createNewEntry}
                        className="text-xs transition-all duration-200 font-medium hover:scale-105"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        + New
                      </button>
                    </div>
                    {searchQuery && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {filteredEntries.length} matching "{searchQuery}"
                      </p>
                    )}
                  </div>
                  <div
                    className="flex-1 overflow-y-auto rounded-b-xl"
                    style={{
                      WebkitOverflowScrolling: isSafari ? 'auto' : 'touch',
                      contain: 'layout style'
                    }}
                  >
                    {filteredEntries.length === 0 ? (
                      <div className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        {searchQuery ? 'No matching entries' : 'No entries yet'}
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredEntries.map((entry, index) => (
                          <button
                            key={entry.id}
                            onClick={() => {
                              if (isEditing && currentEntry) {
                                saveCurrentEntry();
                              }
                              setCurrentEntry(entry);
                              setIsEditing(false);
                              setTimeout(() => textareaRef.current?.focus(), 100);
                            }}
                            className="w-full p-3 text-left rounded-lg transition-all duration-300 relative group hover:scale-[1.02] hover:shadow-md hover:-translate-y-0.5 animate-in slide-in-from-bottom-2 fade-in"
                            style={{
                              backgroundColor: currentEntry?.id === entry.id ? 'var(--surface-elevated)' : 'transparent',
                              borderWidth: '1px',
                              borderColor: currentEntry?.id === entry.id ? 'var(--accent-primary)' : 'var(--border-normal)',
                              animationDelay: `${index * 50}ms`,
                              animationDuration: '400ms'
                            }}
                          >
                            <div className="flex items-start justify-between mb-0.5">
                              <div className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                                {entry.title || entry.content.split('\n')[0].slice(0, 50) || 'Untitled'}
                              </div>
                              {entry.isStudyObservation && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded font-medium"
                                  style={{
                                    backgroundColor: 'var(--surface-muted)',
                                    color: 'var(--accent-primary)',
                                    borderWidth: '1px',
                                    borderColor: 'var(--accent-primary)'
                                  }}
                                >Study</span>
                              )}
                            </div>
                            <div className="text-xs line-clamp-2 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                              {entry.content.slice(0, 60)}...
                            </div>
                            {entry.imageUrl && (
                              <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <span>📷</span>
                                <span>Image attached</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate mr-2" style={{ color: 'var(--text-muted)' }}>{formatLocationWithRegion(entry.location).primary}</span>
                              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                            {entry.wordCount && entry.wordCount > 0 && (
                              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'var(--surface-muted)'
                                  }}
                                >
                                  {entry.wordCount}w
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile: Expandable entry list */}
              {isMobile && (
                <div className="rounded-xl"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    borderWidth: '1px',
                    borderColor: 'var(--border-normal)'
                  }}
                >
                  <button
                    onClick={() => setShowMobileEntries(!showMobileEntries)}
                    className="w-full p-3 flex items-center justify-between text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>Entries ({filteredEntries.length})</span>
                    {showMobileEntries ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className={`
                    overflow-hidden transition-all duration-500 ease-out
                    ${showMobileEntries ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                  `}>
                    <div className={`
                      max-h-32 overflow-y-auto transform transition-all duration-500 ease-out
                      ${showMobileEntries ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
                    `}
                      style={{
                        borderTopWidth: '1px',
                        borderColor: 'var(--border-normal)',
                        willChange: 'transform, opacity'
                      }}
                    >
                      <div className="p-2 space-y-1">
                        {filteredEntries.map(entry => (
                          <button
                            key={entry.id}
                            onClick={() => {
                              setCurrentEntry(entry);
                              setIsEditing(false);
                              setShowMobileEntries(false);
                            }}
                            className="w-full p-2 text-left text-xs rounded-lg transition-all duration-200"
                            style={{
                              backgroundColor: currentEntry?.id === entry.id ? 'var(--surface-elevated)' : 'transparent',
                              borderWidth: '1px',
                              borderColor: currentEntry?.id === entry.id ? 'var(--accent-primary)' : 'transparent'
                            }}
                          >
                            <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {entry.title || entry.content.split('\n')[0].slice(0, 30) || 'Untitled'}
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {formatRelativeTime(entry.timestamp)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalViewport;