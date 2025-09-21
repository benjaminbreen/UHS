/**
 * hooks/useStudyActions.ts - Hook for managing study actions and journal integration
 */
import { useState } from 'react';
import { StudyAction, StudyContext } from '../types/studyTypes';
import { generateStudyAnalysis } from '../services/llmService';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { formatDateWithSeason } from '../utils/dateUtils';

// Use the same JournalEntry interface as JournalViewport
interface JournalEntry {
    id: string;
    title?: string;
    content: string;
    location: string;
    date: string;
    timestamp: number;
    type?: 'study';
    action?: string;
    actionEmoji?: string;
    itemName?: string;
    itemEmoji?: string;
    studentInput?: string;
}

export function useStudyActions() {
    const [isProcessing, setIsProcessing] = useState(false);
    const { gameDate, season } = useGame();
    const { localArea, culturalZone } = useMap();

    const executeStudyAction = async (
        item: any,
        action: StudyAction,
        studentInput: string
    ): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> => {
        setIsProcessing(true);

        try {
            // Build study context
            const context: StudyContext = {
                item,
                action,
                studentInput,
                historicalContext: {
                    year: gameDate.year,
                    location: localArea || 'Unknown location',
                    culturalZone: culturalZone || 'EUROPEAN',
                    season: season || 'SPRING'
                }
            };

            // Get LLM analysis
            const analysisResponse = await generateStudyAnalysis(context);

            // Create journal entry in format compatible with JournalViewport
            const entry: JournalEntry = {
                id: `study-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                title: `${action.emoji} ${action.name}: ${item.name || 'Unknown specimen'}`,
                content: studentInput ? `${studentInput}\n\n${analysisResponse}` : analysisResponse,
                location: localArea || 'Unknown location',
                date: formatDateWithSeason(gameDate, season),

                // Study-specific metadata
                type: 'study',
                action: action.name,
                actionEmoji: action.emoji,
                itemName: item.name || 'Unknown specimen',
                itemEmoji: item.emoji,
                studentInput
            };

            return { success: true, entry };

        } catch (error) {
            console.error('Study action failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        } finally {
            setIsProcessing(false);
        }
    };

    return { executeStudyAction, isProcessing };
}