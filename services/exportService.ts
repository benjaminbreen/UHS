/**
 * services/exportService.ts
 * Handles exporting game session data for teachers and assessment purposes
 */

import { GameLogEntry } from '../types/journal';
import { PlayerCharacter } from '../types';
import {
  AssessmentSession,
  AssessmentLogState,
  AssessmentSummary,
  AssessmentResult
} from '../types/assessment';
import { LearningProgress } from './learningObjectivesService';

export interface SessionExport {
  // Session metadata
  sessionId: string;
  exportedAt: string;
  sessionDuration: number; // milliseconds
  gameVersion: string;

  // Player info
  player: {
    name: string;
    age: number;
    profession: string;
    culturalZone: string;
    finalLocation: string;
    daysAlive: number;
    causeOfDeath?: string;
    deathDetails?: string;
  };

  // Educational data
  assessmentSession: AssessmentSession | null;
  assessmentLogs: AssessmentLogState;
  assessmentSummary: AssessmentSummary | null;
  llmAnalysis: AssessmentResult | null;

  // Activity logs
  gameLog: GameLogEntry[];
  playerJournal: Array<{
    id: string;
    timestamp: any;
    timeString: string;
    text: string;
  }>;

  // Learning objectives (if educational mode)
  learningProgress?: LearningProgress[];
  objectivesCompleted?: string[];

  // Stats
  stats: {
    npcsEncountered: number;
    uniqueNpcs: number;
    primarySourcesViewed: number;
    primarySourcesQuoted: number;
    questsCompleted: number;
    itemsCollected: number;
    distanceTraveled: number;
    wordsWritten: number;
    totalXP: number;
  };
}

export interface TeacherGradingExport {
  studentName: string;
  sessionDate: string;
  sessionDuration: string;
  primarySourcesViewed: number;
  primarySourcesQuoted: number;
  npcsEncountered: number;
  questsCompleted: number;
  assessmentScores?: {
    historicalAccuracy?: number;
    criticalThinking?: number;
    historicalReasoning?: number;
    roleplayingFidelity?: number;
  };
  llmSummary?: string;
  teacherNotes: string;
}

class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Generate full session export from current game state
   */
  public generateSessionExport(data: {
    playerCharacter: PlayerCharacter;
    gameLog: GameLogEntry[];
    playerJournal: any[];
    assessmentSession: AssessmentSession | null;
    assessmentLogs: AssessmentLogState;
    assessmentSummary: AssessmentSummary | null;
    llmAnalysis: AssessmentResult | null;
    learningProgress?: LearningProgress[];
    causeOfDeath?: {
      type: string;
      description?: string;
      opponent?: string;
      terrain?: string;
    };
    playerStats?: {
      daysAlive: number;
      location?: string;
      distanceTraveled?: number;
      itemsCollected?: number;
      questsCompleted?: number;
      npcsMetTotal?: number;
    };
  }): SessionExport {
    const now = new Date().toISOString();
    const sessionDuration = data.assessmentSession
      ? Date.now() - new Date(data.assessmentSession.startedAt).getTime()
      : 0;

    // Calculate stats
    const uniqueNpcs = new Set(
      data.assessmentLogs.npcEncounters.map(e => e.npcId)
    ).size;

    const primarySourcesViewed = data.assessmentLogs.primarySources.filter(
      e => e.action === 'open'
    ).length;

    const primarySourcesQuoted = data.gameLog.filter(
      log => log.type === 'PRIMARY_SOURCE_QUOTED'
    ).length;

    const questsCompleted = data.gameLog.filter(
      log => log.type === 'QUEST_COMPLETE'
    ).length;

    const itemsCollected = data.gameLog.filter(
      log => log.type === 'ITEM_ACQUIRED'
    ).length;

    const wordsWritten = data.assessmentLogs.playerInputs.reduce(
      (total, input) => total + input.text.split(/\s+/).length,
      0
    );

    return {
      sessionId: data.assessmentSession?.id || `session-${Date.now()}`,
      exportedAt: now,
      sessionDuration,
      gameVersion: '1.0.0',

      player: {
        name: data.playerCharacter.name,
        age: data.playerCharacter.age,
        profession: data.playerCharacter.profession,
        culturalZone: data.playerCharacter.culturalZone || 'Unknown',
        finalLocation: data.playerStats?.location || 'Unknown',
        daysAlive: data.playerStats?.daysAlive || 0,
        causeOfDeath: data.causeOfDeath?.type,
        deathDetails: data.causeOfDeath?.description ||
                     data.causeOfDeath?.opponent ||
                     data.causeOfDeath?.terrain,
      },

      assessmentSession: data.assessmentSession,
      assessmentLogs: data.assessmentLogs,
      assessmentSummary: data.assessmentSummary,
      llmAnalysis: data.llmAnalysis,

      gameLog: data.gameLog,
      playerJournal: data.playerJournal,

      learningProgress: data.learningProgress,
      objectivesCompleted: data.learningProgress
        ?.filter(p => p.progress >= 80)
        .map(p => p.objectiveId),

      stats: {
        npcsEncountered: data.assessmentLogs.npcEncounters.length,
        uniqueNpcs,
        primarySourcesViewed,
        primarySourcesQuoted,
        questsCompleted,
        itemsCollected,
        distanceTraveled: data.playerStats?.distanceTraveled || 0,
        wordsWritten,
        totalXP: data.playerCharacter.xp || 0,
      }
    };
  }

  /**
   * Export session as JSON string
   */
  public exportAsJSON(sessionExport: SessionExport): string {
    return JSON.stringify(sessionExport, null, 2);
  }

  /**
   * Download JSON file
   */
  public downloadJSON(sessionExport: SessionExport): void {
    const json = this.exportAsJSON(sessionExport);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const filename = `uhs-session-${sessionExport.player.name}-${
      new Date(sessionExport.exportedAt).toISOString().split('T')[0]
    }.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export for teacher grading (simplified CSV-friendly format)
   */
  public exportForGrading(sessionExport: SessionExport): TeacherGradingExport {
    const duration = this.formatDuration(sessionExport.sessionDuration);

    return {
      studentName: sessionExport.player.name,
      sessionDate: new Date(sessionExport.exportedAt).toLocaleDateString(),
      sessionDuration: duration,
      primarySourcesViewed: sessionExport.stats.primarySourcesViewed,
      primarySourcesQuoted: sessionExport.stats.primarySourcesQuoted,
      npcsEncountered: sessionExport.stats.uniqueNpcs,
      questsCompleted: sessionExport.stats.questsCompleted,
      assessmentScores: sessionExport.llmAnalysis ? {
        historicalAccuracy: sessionExport.llmAnalysis.scores?.find(s => s.category === 'Historical Accuracy')?.score,
        criticalThinking: sessionExport.llmAnalysis.scores?.find(s => s.category === 'Critical Thinking')?.score,
        historicalReasoning: sessionExport.llmAnalysis.scores?.find(s => s.category === 'Historical Reasoning')?.score,
        roleplayingFidelity: sessionExport.llmAnalysis.scores?.find(s => s.category === 'Roleplaying Fidelity')?.score,
      } : undefined,
      llmSummary: sessionExport.llmAnalysis?.summary || '',
      teacherNotes: '',
    };
  }

  /**
   * Export as CSV
   */
  public exportAsCSV(sessionExport: SessionExport): string {
    const grading = this.exportForGrading(sessionExport);

    const headers = [
      'Student Name',
      'Date',
      'Duration',
      'Sources Viewed',
      'Sources Quoted',
      'NPCs Met',
      'Quests Completed',
      'Historical Accuracy',
      'Critical Thinking',
      'Historical Reasoning',
      'Roleplaying',
      'Summary'
    ];

    const values = [
      grading.studentName,
      grading.sessionDate,
      grading.sessionDuration,
      grading.primarySourcesViewed,
      grading.primarySourcesQuoted,
      grading.npcsEncountered,
      grading.questsCompleted,
      grading.assessmentScores?.historicalAccuracy || '',
      grading.assessmentScores?.criticalThinking || '',
      grading.assessmentScores?.historicalReasoning || '',
      grading.assessmentScores?.roleplayingFidelity || '',
      `"${grading.llmSummary.replace(/"/g, '""')}"` // Escape quotes for CSV
    ];

    return headers.join(',') + '\n' + values.join(',');
  }

  /**
   * Download CSV file
   */
  public downloadCSV(sessionExport: SessionExport): void {
    const csv = this.exportAsCSV(sessionExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const filename = `uhs-grading-${sessionExport.player.name}-${
      new Date(sessionExport.exportedAt).toISOString().split('T')[0]
    }.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy summary to clipboard
   */
  public async copyToClipboard(sessionExport: SessionExport): Promise<boolean> {
    const summary = this.generateTextSummary(sessionExport);

    try {
      await navigator.clipboard.writeText(summary);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Generate human-readable text summary
   */
  private generateTextSummary(sessionExport: SessionExport): string {
    const lines: string[] = [];

    lines.push('=== Universal History Simulator - Session Report ===');
    lines.push('');
    lines.push(`Student: ${sessionExport.player.name}`);
    lines.push(`Date: ${new Date(sessionExport.exportedAt).toLocaleDateString()}`);
    lines.push(`Duration: ${this.formatDuration(sessionExport.sessionDuration)}`);
    lines.push('');

    lines.push('--- Character Info ---');
    lines.push(`Age: ${sessionExport.player.age}`);
    lines.push(`Profession: ${sessionExport.player.profession}`);
    lines.push(`Cultural Zone: ${sessionExport.player.culturalZone}`);
    lines.push(`Days Survived: ${sessionExport.player.daysAlive}`);
    if (sessionExport.player.causeOfDeath) {
      lines.push(`Cause of Death: ${sessionExport.player.causeOfDeath}`);
    }
    lines.push('');

    lines.push('--- Activity Summary ---');
    lines.push(`Primary Sources Viewed: ${sessionExport.stats.primarySourcesViewed}`);
    lines.push(`Primary Sources Quoted: ${sessionExport.stats.primarySourcesQuoted}`);
    lines.push(`NPCs Encountered: ${sessionExport.stats.uniqueNpcs} unique`);
    lines.push(`Quests Completed: ${sessionExport.stats.questsCompleted}`);
    lines.push(`Items Collected: ${sessionExport.stats.itemsCollected}`);
    lines.push(`Words Written: ${sessionExport.stats.wordsWritten}`);
    lines.push(`Total XP: ${sessionExport.stats.totalXP}`);
    lines.push('');

    if (sessionExport.learningProgress && sessionExport.learningProgress.length > 0) {
      lines.push('--- Learning Objectives ---');
      sessionExport.learningProgress.forEach(obj => {
        lines.push(`${obj.objectiveId}: ${obj.progress}%`);
      });
      lines.push('');
    }

    if (sessionExport.llmAnalysis) {
      lines.push('--- AI Assessment ---');
      lines.push(sessionExport.llmAnalysis.summary || 'No summary available');
      lines.push('');

      if (sessionExport.llmAnalysis.scores) {
        lines.push('Scores:');
        sessionExport.llmAnalysis.scores.forEach(score => {
          lines.push(`  ${score.category}: ${score.score}/100`);
        });
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

export const exportService = ExportService.getInstance();
