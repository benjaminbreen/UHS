import {
  AssessmentSession,
  AssessmentLogState,
  AssessmentSummary,
  AssessmentRequest,
  AssessmentSamples,
  AssessmentLLMResult
} from '../types/assessment';
import { learningObjectivesService } from './learningObjectivesService';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const SAMPLE_LIMIT = {
  npcEncounters: 100,
  primarySources: 100,
  playerInputs: 200
};

const TEXT_SAMPLE_CHAR_LIMIT = 4000;

function clampSamples<T>(items: T[], limit: number): T[] {
  return items.length > limit ? items.slice(0, limit) : items;
}

function clipText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
}

export function buildAssessmentSummary(session: AssessmentSession, logs: AssessmentLogState): AssessmentSummary {
  const start = new Date(session.startedAt);
  const end = session.endedAt ? new Date(session.endedAt) : null;
  const durationMs = end ? Math.max(0, end.getTime() - start.getTime()) : null;

  const npcEncounterCount = logs.npcEncounters.length;
  const uniqueNpcCount = new Set(logs.npcEncounters.map(enc => enc.npcId)).size;

  const primarySourceInteractionCount = logs.primarySources.length;
  const primarySourceActionCounts = logs.primarySources.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.action] = (acc[entry.action] || 0) + 1;
    return acc;
  }, {});

  const playerInputCount = logs.playerInputs.length;
  const playerInputWordCount = logs.playerInputs.reduce((sum, entry) => sum + entry.text.trim().split(/\s+/).filter(Boolean).length, 0);

  return {
    sessionId: session.id,
    durationMs,
    npcEncounterCount,
    uniqueNpcCount,
    primarySourceInteractionCount,
    primarySourceActionCounts,
    playerInputCount,
    playerInputWordCount
  };
}

export function buildAssessmentSamples(logs: AssessmentLogState): AssessmentSamples {
  const npcEncounters = clampSamples(logs.npcEncounters, SAMPLE_LIMIT.npcEncounters);
  const primarySources = clampSamples(logs.primarySources, SAMPLE_LIMIT.primarySources);
  const playerInputs = clampSamples(logs.playerInputs.map(entry => ({
    ...entry,
    text: clipText(entry.text, TEXT_SAMPLE_CHAR_LIMIT)
  })), SAMPLE_LIMIT.playerInputs);

  return {
    npcEncounters,
    primarySources,
    playerInputs
  };
}

export function buildAssessmentRequest(session: AssessmentSession, logs: AssessmentLogState): AssessmentRequest {
  const summary = buildAssessmentSummary(session, logs);
  const samples = buildAssessmentSamples(logs);

  return {
    session,
    summary,
    logs,
    samples
  };
}

const reasoningKeywords = [
  'because',
  'therefore',
  'since',
  'evidence',
  'source',
  'document',
  'context',
  'consequence',
  'interpret',
  'suggests',
  'implies',
  'signifies',
  'compare',
  'contrast'
];

const anachronisticKeywords = [
  'internet',
  'phone',
  'smartphone',
  'wifi',
  'airplane',
  'rocket',
  'google',
  'email',
  'instagram',
  'tiktok',
  'twitter',
  'computer',
  'robot',
  'electricity',
  'gunpowder',
  'submarine',
  'train',
  'car',
  'engine'
];

const firstPersonRegex = /\b(i|me|my|mine|we|our|ours|us)\b/i;

const clampScore = (value: number) => Math.max(1, Math.min(5, Math.round(value * 10) / 10));

const formatDuration = (ms?: number | null) => {
  if (!ms || ms <= 0) return 'an open-ended window of time';
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes >= 120) {
    const hours = Math.round(totalMinutes / 60);
    return `${hours} in-game hours`;
  }
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m of in-game time`;
  }
  return `${totalMinutes}m of in-game time`;
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function requestAssessmentAnalysis(request: AssessmentRequest): Promise<AssessmentLLMResult> {
  const { summary, logs, session } = request;

  // Calculate basic metrics for the prompt
  const avgWordsPerEntry = summary.playerInputCount > 0
    ? summary.playerInputWordCount / summary.playerInputCount
    : 0;

  const reasoningHits = logs.playerInputs.reduce((count, entry) => {
    const text = entry.text.toLowerCase();
    return count + reasoningKeywords.reduce((inner, keyword) => inner + (text.includes(keyword) ? 1 : 0), 0);
  }, 0);

  const anachronismHits = logs.playerInputs.reduce((count, entry) => {
    const text = entry.text.toLowerCase();
    return count + (anachronisticKeywords.some(keyword => text.includes(keyword)) ? 1 : 0);
  }, 0);

  const isEducationalMode = learningObjectivesService.isEducationalMode();

  // Sample player inputs for concrete examples (limit to 10 most substantial)
  const playerInputSamples = logs.playerInputs
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 10)
    .map(input => input.text);

  // Sample NPC encounters for context
  const npcSamples = logs.npcEncounters
    .slice(0, 10)
    .map(enc => `${enc.npcName || 'NPC'}: ${enc.playerAction}`);

  // Build educational context if applicable
  const eduContext = isEducationalMode ? learningObjectivesService.getProgress() : null;

  const prompt = `You are an expert historian and tough-but-fair professor grading a student's performance in a historical simulation game. ${isEducationalMode ? 'This is EDUCATIONAL MODE - be especially demanding, as you would be with a graduate student. This student signed up for a challenge.' : 'Be constructive but don\'t hold back your honest critique.'}

**SESSION OVERVIEW:**
- Duration: ${formatDuration(summary.durationMs)}
- Player inputs: ${summary.playerInputCount} entries (${summary.playerInputWordCount} words, avg ${avgWordsPerEntry.toFixed(1)} words/entry)
- NPC encounters: ${summary.npcEncounterCount} total (${summary.uniqueNpcCount} unique NPCs)
- Primary sources consulted: ${summary.primarySourceInteractionCount}
- Anachronisms detected: ${anachronismHits}
- Analytical keywords used: ${reasoningHits} occurrences
- Historical period: ${session.context?.era || 'Unknown'}
- Cultural zone: ${session.context?.culturalZone || 'Unknown'}
- Player role: ${session.context?.role || 'Unknown'}

${playerInputSamples.length > 0 ? `
**SAMPLE PLAYER INPUTS:**
${playerInputSamples.map((input, i) => `${i+1}. "${input.substring(0, 200)}${input.length > 200 ? '...' : ''}"`).join('\n')}
` : ''}

${npcSamples.length > 0 ? `
**SAMPLE NPC INTERACTIONS:**
${npcSamples.map((enc, i) => `${i+1}. ${enc}`).join('\n')}
` : ''}

${isEducationalMode && eduContext ? `
**EDUCATIONAL OBJECTIVES TRACKING:**
${eduContext.map(obj => `- ${obj.objectiveId}: ${obj.progress}% (${obj.evidenceCollected.length} pieces of evidence)`).join('\n')}
` : ''}

**YOUR TASK:**
Write a 2-3 paragraph assessment that is:
1. **Witty and engaging** - use metaphors, historical analogies, dry humor
2. **Specific and concrete** - reference actual player choices and actions from the samples above
3. **Critical but constructive** - point out exactly what they did wrong/right with examples
4. **Opinionated** - don't hedge. If they half-assed something, say so. If they impressed you, say so.
5. **Historically informed** - show your expertise by referencing what a historian would expect
${isEducationalMode ? '\n6. **UNCOMPROMISING** - Educational mode means high standards. Be harsh but fair. Make them work for praise.' : ''}

Then provide 4 scores (1-5) with brief, pointed rationales:
- **Historical Accuracy**: Did they engage with primary sources, talk to diverse NPCs, demonstrate period knowledge?
- **Critical Thinking**: Did they analyze causes/effects, ask "why", connect dots, or just drift through?
- **Historical Reasoning**: Did they build arguments from evidence or just go with gut feelings?
- **Roleplaying Fidelity**: Did they stay in character and period, or constantly break immersion?

${isEducationalMode ? `Then add 3 additional educational scores based on their learning objective progress.` : ''}

Format your response as JSON:
{
  "narrativeSummary": "Your 2-3 paragraph witty, critical assessment here...",
  "scores": [
    {"category": "Historical Accuracy", "score": 3.5, "outOf": 5, "rationale": "Brief pointed critique"},
    {"category": "Critical Thinking", "score": 2.0, "outOf": 5, "rationale": "Brief pointed critique"},
    {"category": "Historical Reasoning", "score": 4.0, "outOf": 5, "rationale": "Brief pointed critique"},
    {"category": "Roleplaying Fidelity", "score": 3.0, "outOf": 5, "rationale": "Brief pointed critique"}
  ],
  "highlights": ["Specific thing they did well with example"],
  "concerns": ["Specific thing they need to improve with example"]
}

Be specific. Be witty. Be harsh${isEducationalMode ? ' (ESPECIALLY harsh - this is educational mode!)' : ''}. But be fair.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });

    const text = response.text || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[1] || jsonMatch[0];
    }

    const result = JSON.parse(jsonText);

    let scores = result.scores || [];
    let highlights = result.highlights || [];
    let concerns = result.concerns || [];
    let narrativeSummary = result.narrativeSummary || '';

    // Add educational mode scores if applicable
    if (isEducationalMode && eduContext) {
      const objectives = learningObjectivesService.getCurrentObjectives();

      objectives.forEach(objId => {
        const objProgress = eduContext.find(p => p.objectiveId === objId);
        const config = learningObjectivesService.getObjectiveConfig(objId);

        if (objProgress && config) {
          const evidenceCount = objProgress.evidenceCollected.length;
          const score = clampScore(1 + (objProgress.progress / 100) * 4);

          scores.push({
            category: config.name,
            score: score,
            outOf: 5,
            rationale: evidenceCount > 3
              ? `${evidenceCount} pieces of evidence. Actually engaged with this objective.`
              : `Only ${evidenceCount} pieces of evidence. Expected more.`
          });
        }
      });
    }

    return {
      scores,
      narrativeSummary,
      highlights: highlights.length ? highlights : undefined,
      concerns: concerns.length ? concerns : undefined,
      rawResponse: JSON.stringify({
        summary,
        llmAnalysis: result,
        educationalMode: isEducationalMode,
        objectiveProgress: eduContext,
        generatedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('[Assessment] LLM call failed:', error);

    // Fallback to basic analysis if LLM fails
    return {
      scores: [
        {
          category: 'Session Overview',
          score: 3,
          outOf: 5,
          rationale: 'Assessment generation failed. Please try again.'
        }
      ],
      narrativeSummary: `Session lasted ${formatDuration(summary.durationMs)} with ${summary.npcEncounterCount} NPC encounters and ${summary.primarySourceInteractionCount} primary sources consulted. Assessment analysis unavailable due to technical error.`,
      rawResponse: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        summary,
        generatedAt: new Date().toISOString()
      })
    };
  }
}
