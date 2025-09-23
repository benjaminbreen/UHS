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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMobileEntries, setShowMobileEntries] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSaveRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Animate on visibility change with proper cleanup
  useEffect(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    if (visible) {
      setIsClosing(false);
      // Small delay to ensure DOM is ready
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        // Focus textarea after animation completes
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 400);
      }, 10);
    } else {
      // Don't immediately hide - let closing animation play
      setIsAnimating(false);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
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

  // Handle smooth closing
  const handleClose = useCallback(() => {
    if (isEditing && currentEntry) {
      saveCurrentEntry();
    }
    setIsClosing(true);
    setIsAnimating(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose?.();
      setIsClosing(false);
    }, 300);
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

  if (!visible && !isAnimating && !isClosing) return null;

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
      className={`
        fixed top-0 left-0 right-0 z-40 flex justify-center
        transition-all duration-500 ease-in-out
      `}
      style={{
        transform: isAnimating && !isClosing
          ? (isSafari ? 'translateY(0)' : 'translate3d(0, 0, 0)')
          : (isSafari ? 'translateY(-100%)' : 'translate3d(0, -100%, 0)'),
        opacity: isAnimating && !isClosing ? 1 : 0,
        willChange: 'transform, opacity'
      }}
    >
      <div className={`${getLayoutClass()} max-w-[1400px]`}>
        <div className={`
          rounded-b-2xl shadow-2xl
          transform transition-all duration-500
          ${isMobile ? 'h-[50vh]' : isTablet ? 'h-[48vh]' : isLargeScreen ? 'h-[45vh]' : 'h-[50vh]'}
        `}
        style={{
          contain: 'layout style',
          backdropFilter: 'blur(24px) saturate(1.1)',
          // Premium leather cover with sophisticated layering
          background: `
            linear-gradient(135deg, #1a0f0a 0%, #2d1810 15%, #3d2318 30%, #2d1810 60%, #3d2318 85%, #1a0f0a 100%),
            radial-gradient(ellipse 800px 600px at 25% 10%, rgba(139, 96, 54, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse 600px 800px at 75% 90%, rgba(92, 51, 23, 0.12) 0%, transparent 40%),
            repeating-linear-gradient(45deg,
              transparent,
              transparent 3px,
              rgba(139, 96, 54, 0.03) 3px,
              rgba(139, 96, 54, 0.03) 6px),
            repeating-linear-gradient(-45deg,
              transparent,
              transparent 2px,
              rgba(62, 39, 20, 0.08) 2px,
              rgba(62, 39, 20, 0.08) 4px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 8px 8px, 6px 6px',
          border: '2px solid rgba(92, 66, 48, 0.6)',
          borderRadius: '16px',
          boxShadow: `
            0 32px 80px -20px rgba(0, 0, 0, 0.9),
            0 16px 40px -10px rgba(26, 15, 10, 0.7),
            inset 0 4px 8px rgba(255, 248, 220, 0.08),
            inset 0 2px 4px rgba(139, 96, 54, 0.15),
            inset 0 -4px 8px rgba(0, 0, 0, 0.6),
            inset 0 0 0 1px rgba(139, 96, 54, 0.2)
          `,
          maxHeight: isMobile ? '48vh' : '46vh',
          position: 'relative'
        }}
        >
          <div className="h-full flex flex-col">
            {/* Header - Premium leather binding */}
            <div className="
              px-6 py-4
              flex items-center justify-between
              rounded-t-2xl
            "
            style={{
              background: `
                linear-gradient(135deg, rgba(26, 15, 10, 0.98) 0%, rgba(45, 24, 16, 0.95) 25%, rgba(61, 35, 23, 0.93) 50%, rgba(45, 24, 16, 0.95) 75%, rgba(26, 15, 10, 0.98) 100%),
                repeating-linear-gradient(90deg,
                  transparent,
                  transparent 2px,
                  rgba(139, 96, 54, 0.05) 2px,
                  rgba(139, 96, 54, 0.05) 4px)
              `,
              borderBottom: '2px solid rgba(139, 96, 54, 0.3)',
              boxShadow: `
                0 4px 12px rgba(0, 0, 0, 0.4),
                inset 0 2px 4px rgba(255, 248, 220, 0.08),
                inset 0 -1px 2px rgba(0, 0, 0, 0.3)
              `,
              borderTopLeftRadius: '14px',
              borderTopRightRadius: '14px'
            }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 96, 54, 0.2) 0%, rgba(92, 51, 23, 0.25) 100%)',
                      border: '1px solid rgba(139, 96, 54, 0.3)',
                      boxShadow: 'inset 0 1px 2px rgba(255, 248, 220, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <ScrollText size={20} className="text-amber-200" />
                  </div>
                  <h2 className="text-lg font-bold text-amber-100 tracking-wide"
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 8px rgba(139, 96, 54, 0.3)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Field Journal
                  </h2>
                </div>
                {/* Subtle keyboard hints */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-700/30 rounded text-[11px]">⌘J</span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 bg-slate-700/30 rounded text-[11px]">ESC</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Search button */}
                <button
                  onClick={() => {
                    setShowSearch(!showSearch);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-700/40 transition-all duration-200"
                  title="Search (⌘/)"
                >
                  <Search size={18} className="text-slate-400" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-slate-700/40 transition-all duration-200 group"
                  title="Close (Esc)"
                >
                  <X size={19} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
                </button>
              </div>
            </div>

            {/* Search bar (slides down when active) */}
            <div className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${showSearch ? 'max-h-16' : 'max-h-0'}
            `}>
              <div className="px-5 py-2.5 bg-slate-750/40 border-b border-slate-600/20">
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
                    w-full px-3 py-1.5 text-sm
                    bg-slate-700/30 border border-slate-600/30 rounded-lg
                    text-slate-200 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-transparent
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`
              flex-1 flex overflow-hidden p-4 gap-4
              ${isMobile ? 'flex-col p-3 gap-3' : ''}
            `}>
              {/* Writing Area - Dark parchment aesthetic */}
              <div className={`
                ${isMobile ? 'flex-1' : isTablet ? 'flex-[2]' : 'flex-[2.5]'}
                flex flex-col
                rounded-xl
                relative
                overflow-hidden
                transition-all duration-300
              `}
              style={{
                // Premium aged parchment with sophisticated texture layering
                background: `
                  radial-gradient(ellipse 400px 300px at 20% 30%, rgba(250, 245, 220, 0.95) 0%, transparent 70%),
                  radial-gradient(ellipse 300px 400px at 80% 70%, rgba(248, 238, 210, 0.9) 0%, transparent 60%),
                  linear-gradient(135deg, #f4f1e8 0%, #e8d4b0 15%, #dbc69a 30%, #e8d4b0 50%, #dbc69a 70%, #e8d4b0 85%, #f4f1e8 100%),
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 1px,
                    rgba(180, 140, 90, 0.04) 1px,
                    rgba(180, 140, 90, 0.04) 2px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(139, 111, 78, 0.02) 2px,
                    rgba(139, 111, 78, 0.02) 4px
                  )
                `,
                backgroundSize: '100% 100%, 100% 100%, 100% 100%, 3px 3px, 6px 6px',
                boxShadow: `
                  inset 0 12px 32px 0 rgba(139, 111, 78, 0.35),
                  inset 0 6px 16px 0 rgba(92, 66, 48, 0.4),
                  inset 0 2px 8px 0 rgba(61, 43, 31, 0.3),
                  inset 0 -3px 6px 0 rgba(255, 250, 235, 0.6),
                  inset 0 0 0 2px rgba(180, 140, 90, 0.2),
                  0 0 0 1px rgba(139, 111, 78, 0.4),
                  0 2px 8px rgba(0, 0, 0, 0.15)
                `,
                border: '1px solid rgba(139, 111, 78, 0.6)',
                borderRadius: '12px'
              }}
              >
                {/* Subtle decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-slate-200/10 pointer-events-none" />

                {/* Entry header bar */}
                <div className="px-4 py-2 rounded-t-xl"
                  style={{
                    background: 'linear-gradient(to right, rgba(232, 212, 176, 0.95), rgba(217, 194, 159, 0.95), rgba(232, 212, 176, 0.95))',
                    borderBottom: '1px solid rgba(139, 111, 78, 0.3)',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-amber-700/60" />
                        <span className="font-semibold text-amber-900">{locationInfo.primary}</span>
                        {locationInfo.region && (
                          <span className="text-amber-700/60 text-xs ml-1">• {locationInfo.region}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-amber-700/50" />
                        <span className="text-amber-800 font-medium text-xs tracking-wide">{formattedDate}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        {documentationMode !== undefined && (
                          <button
                            onClick={() => onDocumentationModeChange?.(!documentationMode)}
                            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                              documentationMode
                                ? 'bg-amber-800/30 text-amber-900 shadow-inner'
                                : 'bg-amber-700/15 hover:bg-amber-700/25 text-amber-800'
                            }`}
                            style={{
                              boxShadow: documentationMode
                                ? 'inset 0 2px 4px rgba(92, 66, 48, 0.3)'
                                : '0 1px 3px rgba(0, 0, 0, 0.1)'
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
                            className="px-3 py-1 text-xs rounded-full transition-all duration-200 flex items-center gap-1.5"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.25))',
                              color: '#14532d',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            <Save size={13} />
                            <span className="font-semibold">Save</span>
                          </button>
                        ) : (
                          <button
                            onClick={createNewEntry}
                            className="px-3 py-1 text-xs rounded-full transition-all duration-200 flex items-center gap-1.5"
                            style={{
                              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15), rgba(180, 83, 9, 0.2))',
                              color: '#451a03',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
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

                {/* Writing area with image support */}
                <div className="flex-1 p-5 overflow-y-auto"
                  style={{
                    background: `
                      repeating-linear-gradient(
                        180deg,
                        transparent,
                        transparent 28px,
                        rgba(139, 111, 78, 0.08) 28px,
                        rgba(139, 111, 78, 0.08) 29px
                      )
                    `,
                    backgroundSize: '100% 29px',
                    backgroundPosition: '0 10px'
                  }}
                >
                  {currentEntry ? (
                    <div className="flex flex-col gap-4">
                      {/* Study observation header if applicable */}
                      {currentEntry.isStudyObservation && currentEntry.studiedItem && (
                        <div className="px-3 py-2 rounded-lg"
                          style={{
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            border: '1px solid rgba(217, 119, 6, 0.2)',
                            boxShadow: 'inset 0 1px 2px rgba(217, 119, 6, 0.1)'
                          }}
                        >
                          <div className="text-xs font-medium mb-0.5" style={{ color: '#92400e' }}>Study Observation</div>
                          <div className="text-sm font-semibold" style={{ color: '#78350f' }}>{currentEntry.studiedItem}</div>
                        </div>
                      )}

                      {/* Image display if present */}
                      {currentEntry.imageUrl && (
                        <div className="relative rounded-lg overflow-hidden"
                          style={{
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                            background: 'white',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 3px rgba(217, 119, 6, 0.1)'
                          }}
                        >
                          <img
                            src={currentEntry.imageUrl}
                            alt={currentEntry.imageCaption || 'Journal image'}
                            className="w-full h-auto object-contain"
                            style={{
                              maxHeight: '280px',
                              backgroundColor: 'rgba(255, 255, 255, 0.95)'
                            }}
                          />
                          {currentEntry.imageCaption && (
                            <div className="px-3 py-2"
                              style={{
                                background: 'linear-gradient(to bottom, rgba(254, 252, 232, 0.9), rgba(254, 249, 195, 0.9))',
                                borderTop: '1px solid rgba(217, 119, 6, 0.2)'
                              }}
                            >
                              <p className="text-xs italic text-center" style={{ color: '#713f12' }}>
                                {currentEntry.imageCaption}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main text area */}
                    <textarea
                      ref={textareaRef}
                      value={currentEntry.content}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      disabled={!isEditing}
                      placeholder="Begin writing your journal entry..."
                      className={`
                        w-full h-full resize-none
                        bg-transparent
                        focus:outline-none
                        leading-relaxed
                        disabled:opacity-70
                        transition-all duration-300
                        ${isEditing ? 'ring-2 ring-amber-600/20 rounded-lg p-4 bg-white/30' : 'p-1'}
                        ${isSafari ? '' : 'selection:bg-amber-200/50'}
                      `}
                      style={{
                        minHeight: '120px',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        fontFamily: '"Playfair Display", "Crimson Text", Baskerville, "Libre Baskerville", Georgia, "Times New Roman", serif',
                        fontSize: '18px',
                        fontWeight: 400,
                        lineHeight: '1.75',
                        letterSpacing: '0.02em',
                        color: '#1a0f0a', // Deep rich ink color
                        textShadow: '0 0 1px rgba(26, 15, 10, 0.2), 0 1px 2px rgba(139, 96, 54, 0.08)',
                        textRendering: 'optimizeLegibility',
                        fontFeatureSettings: '"liga" 1, "kern" 1, "calt" 1',
                        fontVariantLigatures: 'common-ligatures',
                        wordSpacing: '0.05em'
                      }}
                    />
                    </div>
                  ) : (
                    <div className="text-amber-800/70 text-center py-8">
                      <Feather size={36} className="mx-auto mb-3 text-amber-700/40" />
                      <p className="text-sm mb-3 text-amber-700/60">Begin your journal to document your journey</p>
                      <button
                        onClick={createNewEntry}
                        className="px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium"
                        style={{
                          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15), rgba(180, 83, 9, 0.2))',
                          color: '#451a03',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        Create First Entry
                      </button>
                    </div>
                  )}

                  {/* Premium decorative corner flourishes */}
                  <div className="absolute top-3 left-3 w-6 h-6 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(135deg, transparent 40%, rgba(139, 96, 54, 0.15) 50%, transparent 60%),
                        linear-gradient(45deg, transparent 40%, rgba(180, 140, 90, 0.1) 50%, transparent 60%)
                      `,
                      border: '1px solid rgba(139, 96, 54, 0.2)',
                      borderBottomColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderRadius: '3px 0 0 0',
                      boxShadow: 'inset 1px 1px 2px rgba(255, 248, 220, 0.3)'
                    }}
                  />
                  <div className="absolute top-3 right-3 w-6 h-6 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(45deg, transparent 40%, rgba(139, 96, 54, 0.15) 50%, transparent 60%),
                        linear-gradient(135deg, transparent 40%, rgba(180, 140, 90, 0.1) 50%, transparent 60%)
                      `,
                      border: '1px solid rgba(139, 96, 54, 0.2)',
                      borderBottomColor: 'transparent',
                      borderLeftColor: 'transparent',
                      borderRadius: '0 3px 0 0',
                      boxShadow: 'inset -1px 1px 2px rgba(255, 248, 220, 0.3)'
                    }}
                  />
                  <div className="absolute bottom-3 left-3 w-6 h-6 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(45deg, transparent 40%, rgba(139, 96, 54, 0.15) 50%, transparent 60%),
                        linear-gradient(135deg, transparent 40%, rgba(180, 140, 90, 0.1) 50%, transparent 60%)
                      `,
                      border: '1px solid rgba(139, 96, 54, 0.2)',
                      borderTopColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderRadius: '0 0 0 3px',
                      boxShadow: 'inset 1px -1px 2px rgba(255, 248, 220, 0.3)'
                    }}
                  />
                  <div className="absolute bottom-3 right-3 w-6 h-6 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(135deg, transparent 40%, rgba(139, 96, 54, 0.15) 50%, transparent 60%),
                        linear-gradient(45deg, transparent 40%, rgba(180, 140, 90, 0.1) 50%, transparent 60%)
                      `,
                      border: '1px solid rgba(139, 96, 54, 0.2)',
                      borderTopColor: 'transparent',
                      borderLeftColor: 'transparent',
                      borderRadius: '0 0 3px 0',
                      boxShadow: 'inset -1px -1px 2px rgba(255, 248, 220, 0.3)'
                    }}
                  />
                </div>

                {/* Status bar */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs rounded-b-xl"
                  style={{
                    background: 'rgba(245, 242, 232, 0.8)',
                    borderTop: '1px solid rgba(180, 170, 150, 0.2)'
                  }}
                >
                  <span className="flex items-center gap-2 text-amber-800/70">
                    <span className="font-medium">{wordCount}</span>
                    <span className="text-amber-700/50">words</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {lastSaveStatus === 'saving' ? (
                      <span className="flex items-center gap-1.5 text-amber-700/70">
                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" />
                        <span className="text-[10px]">Saving...</span>
                      </span>
                    ) : lastSaveStatus === 'unsaved' ? (
                      <span className="flex items-center gap-1.5 text-orange-700/70">
                        <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
                        <span className="text-[10px]">Unsaved changes</span>
                      </span>
                    ) : (
                      <span className="text-amber-600/50 text-[10px]">All changes saved</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Entry List Sidebar - Full opacity dark theme */}
              {!isMobile && (
                <div className={`
                  ${isTablet ? 'w-64' : 'w-72'}
                  rounded-xl
                  flex flex-col
                  transition-all duration-300
                `}
                style={{
                  background: 'linear-gradient(to bottom, rgba(61, 51, 41, 0.98), rgba(46, 38, 31, 0.98))',
                  border: '1px solid rgba(92, 77, 61, 0.4)',
                  boxShadow: `
                    inset 0 2px 4px 0 rgba(0, 0, 0, 0.3),
                    0 1px 3px 0 rgba(0, 0, 0, 0.2)
                  `
                }}>
                  <div className="p-3.5 rounded-t-xl"
                    style={{
                      background: 'rgba(71, 59, 48, 0.8)',
                      borderBottom: '1px solid rgba(107, 88, 71, 0.3)',
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-amber-200/90">Journal Entries</h3>
                      <button
                        onClick={createNewEntry}
                        className="text-xs text-amber-300/70 hover:text-amber-200 transition-colors duration-200 font-medium"
                      >
                        + New
                      </button>
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-slate-500 mt-1">
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
                      <div className="text-slate-500 text-sm text-center py-8">
                        {searchQuery ? 'No matching entries' : 'No entries yet'}
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredEntries.map((entry) => (
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
                            className={`
                              w-full p-3 text-left
                              rounded-lg
                              transition-all duration-200
                              relative group
                              ${currentEntry?.id === entry.id
                                ? 'bg-amber-900/20 border border-amber-700/30 shadow-sm'
                                : 'hover:bg-amber-900/10 border border-transparent'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between mb-0.5">
                              <div className="text-sm text-slate-100 font-medium truncate flex-1">
                                {entry.title || entry.content.split('\n')[0].slice(0, 50) || 'Untitled'}
                              </div>
                              {entry.isStudyObservation && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-600/20 text-blue-300 rounded font-medium">Study</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-2 mb-1.5">
                              {entry.content.slice(0, 60)}...
                            </div>
                            {entry.imageUrl && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span>📷</span>
                                <span>Image attached</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 truncate mr-2">{formatLocationWithRegion(entry.location).primary}</span>
                              <span className="text-slate-600 text-[11px]">{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                            {entry.wordCount && entry.wordCount > 0 && (
                              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="text-[10px] text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded">
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
                    background: 'rgba(51, 65, 85, 0.98)',
                    border: '1px solid rgba(100, 116, 139, 0.3)'
                  }}
                >
                  <button
                    onClick={() => setShowMobileEntries(!showMobileEntries)}
                    className="w-full p-3 flex items-center justify-between text-sm text-slate-200 font-medium"
                  >
                    <span>Entries ({filteredEntries.length})</span>
                    {showMobileEntries ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {showMobileEntries && (
                    <div className="max-h-32 overflow-y-auto border-t border-slate-600/20">
                      <div className="p-2 space-y-1">
                        {filteredEntries.map(entry => (
                          <button
                            key={entry.id}
                            onClick={() => {
                              setCurrentEntry(entry);
                              setIsEditing(false);
                              setShowMobileEntries(false);
                            }}
                            className={`
                              w-full p-2 text-left text-xs rounded-lg
                              transition-all duration-200
                              ${currentEntry?.id === entry.id
                                ? 'bg-slate-600/30 border border-slate-500/40'
                                : 'hover:bg-slate-700/20'
                              }
                            `}
                          >
                            <div className="font-medium text-slate-200 truncate">
                              {entry.title || entry.content.split('\n')[0].slice(0, 30) || 'Untitled'}
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {formatRelativeTime(entry.timestamp)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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