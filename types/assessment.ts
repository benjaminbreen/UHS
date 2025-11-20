export type AssessmentSessionId = string;

export interface AssessmentSession {
  id: AssessmentSessionId;
  startedAt: string; // ISO timestamp
  endedAt?: string; // ISO timestamp
  context?: {
    era?: string;
    culturalZone?: string;
    role?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface AssessmentNpcEncounterLog {
  timestamp: string;
  npcId: string;
  npcName?: string;
  location?: { x: number; y: number; mapArea?: string };
  playerAction: string;
  outcome?: string;
  trustDelta?: number;
  notes?: string;
}

export interface AssessmentPrimarySourceLog {
  timestamp: string;
  sourceId: string;
  sourceTitle?: string;
  action: 'open' | 'close' | 'note' | 'highlight' | 'quote';
  metadata?: Record<string, unknown>;
}

export interface AssessmentPlayerInputLog {
  timestamp: string;
  channel: 'narration' | 'helper' | 'quest' | 'other';
  text: string;
  metadata?: {
    language?: string;
    tokens?: number;
    sentiment?: string;
  };
}

export interface AssessmentLogState {
  npcEncounters: AssessmentNpcEncounterLog[];
  primarySources: AssessmentPrimarySourceLog[];
  playerInputs: AssessmentPlayerInputLog[];
}

export interface AssessmentSummary {
  sessionId: AssessmentSessionId;
  durationMs: number | null;
  npcEncounterCount: number;
  uniqueNpcCount: number;
  primarySourceInteractionCount: number;
  primarySourceActionCounts: Record<string, number>;
  playerInputCount: number;
  playerInputWordCount: number;
  notes?: Record<string, unknown>;
}

export interface AssessmentSamples {
  npcEncounters: AssessmentNpcEncounterLog[];
  primarySources: AssessmentPrimarySourceLog[];
  playerInputs: AssessmentPlayerInputLog[];
}

export interface AssessmentRequest {
  session: AssessmentSession;
  summary: AssessmentSummary;
  logs: AssessmentLogState;
  samples: AssessmentSamples;
}

export interface AssessmentLLMScore {
  category: string;
  score: number;
  outOf: number;
  rationale: string;
}

export interface AssessmentLLMResult {
  scores: AssessmentLLMScore[];
  narrativeSummary: string;
  highlights?: string[];
  concerns?: string[];
  rawResponse?: string;
}
