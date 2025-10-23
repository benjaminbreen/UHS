import {
  AssessmentSession,
  AssessmentLogState,
  AssessmentSummary,
  AssessmentRequest,
  AssessmentSamples,
  AssessmentLLMResult
} from '../types/assessment';

const SAMPLE_LIMIT = {
  npcEncounters: 100,
  primarySources: 100,
  playerInputs: 200
};

const TEXT_SAMPLE_CHAR_LIMIT = 2000;

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

export async function requestAssessmentAnalysis(request: AssessmentRequest): Promise<AssessmentLLMResult> {
  const { summary, logs } = request;

  const avgWordsPerEntry = summary.playerInputCount > 0
    ? summary.playerInputWordCount / summary.playerInputCount
    : 0;

  const reasoningHits = logs.playerInputs.reduce((count, entry) => {
    const text = entry.text.toLowerCase();
    return count + reasoningKeywords.reduce((inner, keyword) => inner + (text.includes(keyword) ? 1 : 0), 0);
  }, 0);

  const firstPersonHits = logs.playerInputs.reduce(
    (count, entry) => count + (firstPersonRegex.test(entry.text) ? 1 : 0),
    0
  );

  const anachronismHits = logs.playerInputs.reduce((count, entry) => {
    const text = entry.text.toLowerCase();
    return count + (anachronisticKeywords.some(keyword => text.includes(keyword)) ? 1 : 0);
  }, 0);

  const primarySourceFactor = Math.min(1, summary.primarySourceInteractionCount / 6);
  const uniqueNpcFactor = Math.min(1, summary.uniqueNpcCount / 6);
  const reasoningFactor = Math.min(1, reasoningHits / 10);
  const dialogueDepthFactor = Math.min(1, avgWordsPerEntry / 80);
  const inputCadenceFactor = Math.min(1, summary.playerInputCount / 15);
  const firstPersonFactor = logs.playerInputs.length > 0
    ? firstPersonHits / logs.playerInputs.length
    : 0;
  const anachronismFactor = Math.min(1, anachronismHits / 4);

  const historicalAccuracyScore = clampScore(
    1 +
    4 * (
      0.55 * primarySourceFactor +
      0.25 * uniqueNpcFactor +
      0.2 * Math.min(1, summary.playerInputWordCount / 600)
    )
  );

  const criticalThinkingScore = clampScore(
    1 +
    4 * (
      0.45 * reasoningFactor +
      0.3 * dialogueDepthFactor +
      0.25 * inputCadenceFactor
    )
  );

  const historicalReasoningScore = clampScore(
    1 +
    4 * (
      0.5 * primarySourceFactor +
      0.35 * reasoningFactor +
      0.15 * uniqueNpcFactor
    )
  );

  const roleplayingScore = clampScore(
    1 +
    4 * (
      0.5 * Math.min(1, firstPersonFactor + 0.15) +
      0.25 * uniqueNpcFactor +
      0.25 * Math.max(0, 1 - anachronismFactor)
    )
  );

  const highlights: string[] = [];
  const concerns: string[] = [];

  if (summary.primarySourceInteractionCount >= 4) {
    highlights.push('Strong engagement with primary sources helped anchor decisions in historical evidence.');
  }
  if (summary.uniqueNpcCount >= 3) {
    highlights.push('You met a diverse set of historical actors, which generally improves contextual awareness.');
  }
  if (avgWordsPerEntry >= 60 || reasoningHits >= 6) {
    highlights.push('Player narration shows analytical depth, weaving reasoning keywords and longer reflections.');
  }
  if (firstPersonFactor > 0.6) {
    highlights.push('Roleplaying voice stays tightly focused on the character perspective.');
  }

  if (summary.primarySourceInteractionCount <= 1) {
    concerns.push('Primary source usage was limited; consider consulting more documents to triangulate evidence.');
  }
  if (avgWordsPerEntry < 25) {
    concerns.push('Narration entries are quite brief. Expanding descriptions can surface richer historical insight.');
  }
  if (anachronismHits > 0) {
    concerns.push('Detected a few anachronistic references (e.g., modern technologies). Try aligning vocabulary with the period.');
  }
  if (summary.npcEncounterCount === 0) {
    concerns.push('No NPC encounters were logged. Dialogues often expose cultural nuance and situational detail.');
  }

  const narrativeSummary = [
    `Across ${formatDuration(summary.durationMs)}, you recorded ${summary.playerInputCount} narration entries totaling ${summary.playerInputWordCount} words.`,
    `You interacted with ${summary.npcEncounterCount} NPCs (${summary.uniqueNpcCount} unique) and touched ${summary.primarySourceInteractionCount} primary-source artifacts.`,
    `Analytical signals (keywords such as “because” or “therefore”) appeared ${reasoningHits} time${reasoningHits === 1 ? '' : 's'}, and ${
      firstPersonHits
    } entries used first-person framing.`
  ].join(' ');

  const scores = [
    {
      category: 'Historical Accuracy',
      score: historicalAccuracyScore,
      outOf: 5,
      rationale: historicalAccuracyScore >= 4
        ? 'Frequent reference to primary sources and varied NPC encounters grounded decision-making.'
        : 'Increase reliance on period sources and contextual NPC exchanges to bolster accuracy.'
    },
    {
      category: 'Critical Thinking',
      score: criticalThinkingScore,
      outOf: 5,
      rationale: criticalThinkingScore >= 4
        ? 'Narration shows sustained analytical language and reflective pacing.'
        : 'Add more connective reasoning (“because… therefore…”) to make historical logic explicit.'
    },
    {
      category: 'Historical Reasoning',
      score: historicalReasoningScore,
      outOf: 5,
      rationale: historicalReasoningScore >= 4
        ? 'Primary evidence was leveraged to contextualize choices and build causal arguments.'
        : 'Weigh multiple documents or testimonies when explaining outcomes to deepen reasoning.'
    },
    {
      category: 'Roleplaying Fidelity',
      score: roleplayingScore,
      outOf: 5,
      rationale: roleplayingScore >= 4
        ? 'Voice and choices stayed consistent with a historically situated character.'
        : 'Favor first-person, period-aware language and avoid modern references to strengthen immersion.'
    }
  ];

  return {
    scores,
    narrativeSummary,
    highlights: highlights.length ? highlights : undefined,
    concerns: concerns.length ? concerns : undefined,
    rawResponse: JSON.stringify({
      summary,
      metrics: {
        avgWordsPerEntry,
        reasoningHits,
        firstPersonHits,
        anachronismHits
      },
      generatedAt: new Date().toISOString()
    })
  };
}
