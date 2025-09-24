/**
 * components/JournalQuoteTooltip.tsx - Tooltip for adding selected text to journal
 */

import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { TooltipPosition } from '../types/journal';

interface JournalQuoteTooltipProps {
    position: TooltipPosition;
    onAddToJournal: () => void;
    onCancel: () => void;
    selectedText: string;
}

export const JournalQuoteTooltip: React.FC<JournalQuoteTooltipProps> = ({
    position,
    onAddToJournal,
    onCancel,
    selectedText
}) => {
    // Truncate very long selections for preview
    const previewText = selectedText.length > 100
        ? selectedText.substring(0, 100) + '...'
        : selectedText;

    return (
        <div
            className="fixed z-[60] bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] max-w-[320px]"
            style={{
                left: `${position.x}px`,
                top: `${position.y - 80}px`, // Position above the selection
                transform: 'translateX(-50%)' // Center horizontally
            }}
        >
            {/* Arrow pointing down */}
            <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-200"
            />

            {/* Preview of selected text */}
            <div className="text-sm text-gray-600 mb-3 italic leading-relaxed">
                "{previewText}"
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 items-center">
                <button
                    onClick={onAddToJournal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex-1"
                >
                    <BookOpen className="w-4 h-4" />
                    Add to Journal
                </button>
                <button
                    onClick={onCancel}
                    className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Cancel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};