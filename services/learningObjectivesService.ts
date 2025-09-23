/**
 * Learning Objectives Service
 * Tracks educational goals and assessment data for educational mode
 */

export type LearningObjective =
  | 'historical-thinking'
  | 'cultural-comparison'
  | 'economic-systems'
  | 'social-structures'
  | 'primary-sources'
  | 'geographic-impact';

export type AssessmentFrequency = 'none' | 'occasional' | 'frequent';
export type DifficultyLevel = 'forgiving' | 'realistic' | 'hardcore';
export type SessionLength = 'short' | 'extended' | 'unlimited';

export interface LearningObjectiveConfig {
  id: LearningObjective;
  name: string;
  description: string;
  assessmentQuestions?: string[];
}

export interface EducationalSettings {
  learningObjectives: LearningObjective[];
  assessmentFrequency: AssessmentFrequency;
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  trackingEnabled: boolean;
}

export interface LearningProgress {
  objectiveId: LearningObjective;
  progress: number; // 0-100
  evidenceCollected: Evidence[];
  lastUpdated: number;
}

export interface Evidence {
  timestamp: number;
  action: string;
  context: string;
  objectivesMet: LearningObjective[];
}

export interface AssessmentData {
  sessionStartTime: number;
  sessionEndTime?: number;
  objectiveProgress: LearningProgress[];
  keyActions: Evidence[];
  assessmentResults?: AssessmentResult[];
}

export interface AssessmentResult {
  timestamp: number;
  objectiveId: LearningObjective;
  question: string;
  playerResponse?: string;
  correct?: boolean;
  feedback?: string;
}

class LearningObjectivesService {
  private static instance: LearningObjectivesService;
  private settings: EducationalSettings | null = null;
  private assessmentData: AssessmentData | null = null;
  private objectiveConfigs: Map<LearningObjective, LearningObjectiveConfig>;

  private constructor() {
    this.objectiveConfigs = new Map([
      ['historical-thinking', {
        id: 'historical-thinking',
        name: 'Historical Thinking',
        description: 'Analyze cause and effect relationships in historical events',
        assessmentQuestions: [
          'How did the events you witnessed relate to the historical period?',
          'What were the main causes of the conflicts or challenges you faced?',
          'How might different choices have led to different historical outcomes?'
        ]
      }],
      ['cultural-comparison', {
        id: 'cultural-comparison',
        name: 'Cultural Comparison',
        description: 'Understand different worldviews and cultural practices',
        assessmentQuestions: [
          'What cultural differences did you observe in your travels?',
          'How did different cultures approach similar problems?',
          'What surprised you about the cultural practices you encountered?'
        ]
      }],
      ['economic-systems', {
        id: 'economic-systems',
        name: 'Economic Systems',
        description: 'Explore trade, labor, and resource management',
        assessmentQuestions: [
          'How did economic systems differ from modern capitalism?',
          'What role did trade play in the societies you visited?',
          'How were resources distributed in the communities you encountered?'
        ]
      }],
      ['social-structures', {
        id: 'social-structures',
        name: 'Social Structures',
        description: 'Examine class, gender, and power dynamics',
        assessmentQuestions: [
          'How did social class affect opportunities in the historical period?',
          'What power structures did you observe?',
          'How were gender roles different from today?'
        ]
      }],
      ['primary-sources', {
        id: 'primary-sources',
        name: 'Primary Source Analysis',
        description: 'Evaluate historical documents and evidence',
        assessmentQuestions: [
          'Which primary sources were most helpful in understanding the period?',
          'What biases did you notice in the historical documents?',
          'How did primary sources enhance your understanding?'
        ]
      }],
      ['geographic-impact', {
        id: 'geographic-impact',
        name: 'Geographic Impact',
        description: 'Understand how environment shapes human activity',
        assessmentQuestions: [
          'How did geography influence settlement patterns?',
          'What environmental challenges shaped daily life?',
          'How did climate affect economic activities?'
        ]
      }]
    ]);

    this.loadSettings();
  }

  public static getInstance(): LearningObjectivesService {
    if (!LearningObjectivesService.instance) {
      LearningObjectivesService.instance = new LearningObjectivesService();
    }
    return LearningObjectivesService.instance;
  }

  /**
   * Initialize educational settings for a new session
   */
  public initializeSession(settings: EducationalSettings): void {
    this.settings = settings;

    if (settings.trackingEnabled) {
      this.assessmentData = {
        sessionStartTime: Date.now(),
        objectiveProgress: settings.learningObjectives.map(obj => ({
          objectiveId: obj,
          progress: 0,
          evidenceCollected: [],
          lastUpdated: Date.now()
        })),
        keyActions: []
      };
    }

    this.saveSettings();
    console.log('[Learning] Session initialized with objectives:', settings.learningObjectives);
  }

  /**
   * Track an action that demonstrates learning
   */
  public trackAction(action: string, context: string, objectivesMet: LearningObjective[] = []): void {
    if (!this.settings?.trackingEnabled || !this.assessmentData) return;

    const evidence: Evidence = {
      timestamp: Date.now(),
      action,
      context,
      objectivesMet
    };

    // Add to key actions
    this.assessmentData.keyActions.push(evidence);

    // Update progress for relevant objectives
    objectivesMet.forEach(objId => {
      const progress = this.assessmentData!.objectiveProgress.find(p => p.objectiveId === objId);
      if (progress) {
        progress.evidenceCollected.push(evidence);
        progress.progress = Math.min(100, progress.progress + 10); // Increment progress
        progress.lastUpdated = Date.now();
      }
    });

    this.saveAssessmentData();
  }

  /**
   * Get current learning objectives
   */
  public getCurrentObjectives(): LearningObjective[] {
    return this.settings?.learningObjectives || [];
  }

  /**
   * Get objective configuration
   */
  public getObjectiveConfig(id: LearningObjective): LearningObjectiveConfig | undefined {
    return this.objectiveConfigs.get(id);
  }

  /**
   * Get all objective configurations
   */
  public getAllObjectiveConfigs(): LearningObjectiveConfig[] {
    return Array.from(this.objectiveConfigs.values());
  }

  /**
   * Check if educational mode is enabled
   */
  public isEducationalMode(): boolean {
    return this.settings?.trackingEnabled || false;
  }

  /**
   * Get current educational settings
   */
  public getSettings(): EducationalSettings | null {
    return this.settings;
  }

  /**
   * Get assessment frequency
   */
  public getAssessmentFrequency(): AssessmentFrequency {
    return this.settings?.assessmentFrequency || 'none';
  }

  /**
   * Should trigger assessment based on frequency and time
   */
  public shouldTriggerAssessment(): boolean {
    if (!this.settings || this.settings.assessmentFrequency === 'none') return false;
    if (!this.assessmentData) return false;

    const sessionDuration = Date.now() - this.assessmentData.sessionStartTime;
    const minutesElapsed = sessionDuration / (1000 * 60);

    switch (this.settings.assessmentFrequency) {
      case 'occasional':
        // Every 30 minutes
        return minutesElapsed % 30 < 1;
      case 'frequent':
        // Every 15 minutes
        return minutesElapsed % 15 < 1;
      default:
        return false;
    }
  }

  /**
   * Get current progress for all objectives
   */
  public getProgress(): LearningProgress[] {
    return this.assessmentData?.objectiveProgress || [];
  }

  /**
   * Generate assessment report
   */
  public generateReport(): AssessmentData | null {
    if (!this.assessmentData) return null;

    return {
      ...this.assessmentData,
      sessionEndTime: Date.now()
    };
  }

  /**
   * Record assessment result
   */
  public recordAssessmentResult(result: AssessmentResult): void {
    if (!this.assessmentData) return;

    if (!this.assessmentData.assessmentResults) {
      this.assessmentData.assessmentResults = [];
    }

    this.assessmentData.assessmentResults.push(result);
    this.saveAssessmentData();
  }

  /**
   * Clear all educational data
   */
  public clearSession(): void {
    this.settings = null;
    this.assessmentData = null;
    localStorage.removeItem('educationalSettings');
    localStorage.removeItem('assessmentData');
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    if (this.settings) {
      localStorage.setItem('educationalSettings', JSON.stringify(this.settings));
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const savedSettings = localStorage.getItem('educationalSettings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('[Learning] Failed to load settings:', error);
      }
    }

    const savedAssessment = localStorage.getItem('assessmentData');
    if (savedAssessment) {
      try {
        this.assessmentData = JSON.parse(savedAssessment);
      } catch (error) {
        console.error('[Learning] Failed to load assessment data:', error);
      }
    }
  }

  /**
   * Save assessment data to localStorage
   */
  private saveAssessmentData(): void {
    if (this.assessmentData) {
      localStorage.setItem('assessmentData', JSON.stringify(this.assessmentData));
    }
  }
}

export const learningObjectivesService = LearningObjectivesService.getInstance();