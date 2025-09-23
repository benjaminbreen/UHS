/**
 * Service for analyzing submitted sources and detecting anachronisms
 */

import { SubmittedSource } from '../types/primarySource';
import { HistoricalEra, CulturalZone } from '../types';

export interface SourceAnalysis {
  detectedEra?: HistoricalEra;
  detectedRegion?: string;
  language?: string;
  sourceType: 'legal' | 'religious' | 'personal' | 'commercial' | 'literary' | 'scientific' | 'unknown';
  anachronisms: Anachronism[];
  authenticityScore: number; // 0-100
  keyTerms: string[];
  historicalContext: string;
}

export interface Anachronism {
  term: string;
  type: 'technology' | 'concept' | 'institution' | 'language' | 'date';
  earliestPossibleDate: number;
  explanation: string;
  severity: 'minor' | 'major' | 'critical';
}

/**
 * Analyzes a submitted source for historical context and anachronisms
 */
export function analyzeSource(source: SubmittedSource, contextYear: number): SourceAnalysis {
  const content = source.content.toLowerCase();
  const words = content.split(/\s+/);

  // Detect anachronisms
  const anachronisms = detectAnachronisms(content, contextYear);

  // Detect source type
  const sourceType = detectSourceType(content);

  // Extract key terms
  const keyTerms = extractKeyTerms(content);

  // Calculate authenticity score
  const authenticityScore = calculateAuthenticityScore(content, contextYear, anachronisms);

  // Generate historical context
  const historicalContext = generateHistoricalContext(sourceType, contextYear, keyTerms);

  return {
    sourceType,
    anachronisms,
    authenticityScore,
    keyTerms,
    historicalContext
  };
}

/**
 * Detects potential anachronisms in the text
 */
function detectAnachronisms(content: string, contextYear: number): Anachronism[] {
  const anachronisms: Anachronism[] = [];

  // Technology anachronisms
  const techTerms = [
    { term: 'electricity', date: 1879, type: 'technology' as const, severity: 'critical' as const },
    { term: 'telephone', date: 1876, type: 'technology' as const, severity: 'critical' as const },
    { term: 'steam engine', date: 1712, type: 'technology' as const, severity: 'major' as const },
    { term: 'printing press', date: 1440, type: 'technology' as const, severity: 'major' as const },
    { term: 'gunpowder', date: 1000, type: 'technology' as const, severity: 'major' as const },
    { term: 'compass', date: 1100, type: 'technology' as const, severity: 'minor' as const },
    { term: 'paper', date: 100, type: 'technology' as const, severity: 'minor' as const },
    { term: 'automobile', date: 1885, type: 'technology' as const, severity: 'critical' as const },
    { term: 'railroad', date: 1825, type: 'technology' as const, severity: 'major' as const },
    { term: 'photography', date: 1826, type: 'technology' as const, severity: 'major' as const }
  ];

  // Concept anachronisms
  const conceptTerms = [
    { term: 'democracy', date: -500, type: 'concept' as const, severity: 'minor' as const },
    { term: 'capitalism', date: 1600, type: 'concept' as const, severity: 'major' as const },
    { term: 'nationalism', date: 1800, type: 'concept' as const, severity: 'major' as const },
    { term: 'socialism', date: 1830, type: 'concept' as const, severity: 'major' as const },
    { term: 'human rights', date: 1789, type: 'concept' as const, severity: 'major' as const },
    { term: 'scientific method', date: 1600, type: 'concept' as const, severity: 'major' as const }
  ];

  // Check all terms
  [...techTerms, ...conceptTerms].forEach(({ term, date, type, severity }) => {
    if (content.includes(term) && contextYear < date) {
      anachronisms.push({
        term,
        type,
        earliestPossibleDate: date,
        explanation: `"${term}" was not available or conceptualized until around ${date}`,
        severity
      });
    }
  });

  return anachronisms;
}

/**
 * Detects the type of source document
 */
function detectSourceType(content: string): SourceAnalysis['sourceType'] {
  // Legal documents
  if (/\b(law|statute|decree|edict|charter|contract|treaty|will|testament)\b/i.test(content)) {
    return 'legal';
  }

  // Religious documents
  if (/\b(god|lord|prayer|blessing|sin|salvation|divine|holy|sacred|scripture)\b/i.test(content)) {
    return 'religious';
  }

  // Personal documents
  if (/\b(dear|love|family|home|today|yesterday|feel|think|remember)\b/i.test(content)) {
    return 'personal';
  }

  // Commercial documents
  if (/\b(sell|buy|trade|merchant|goods|price|coin|silver|gold|market)\b/i.test(content)) {
    return 'commercial';
  }

  // Literary documents
  if (/\b(story|tale|poem|verse|song|ballad|epic|hero|adventure)\b/i.test(content)) {
    return 'literary';
  }

  // Scientific documents
  if (/\b(observe|experiment|theory|hypothesis|natural|philosophy|medicine|astronomy)\b/i.test(content)) {
    return 'scientific';
  }

  return 'unknown';
}

/**
 * Extracts key historical terms
 */
function extractKeyTerms(content: string): string[] {
  const historicalTerms = [
    'king', 'queen', 'lord', 'noble', 'peasant', 'serf', 'knight', 'castle',
    'church', 'monastery', 'priest', 'bishop', 'pope', 'crusade',
    'guild', 'merchant', 'artisan', 'blacksmith', 'farmer',
    'plague', 'harvest', 'famine', 'war', 'battle', 'siege',
    'viking', 'saxon', 'norman', 'byzantine', 'mongol',
    'silk road', 'spice', 'caravan', 'ship', 'voyage'
  ];

  const found = historicalTerms.filter(term =>
    content.toLowerCase().includes(term.toLowerCase())
  );

  return found.slice(0, 10); // Return top 10 matches
}

/**
 * Calculates authenticity score based on content analysis
 */
function calculateAuthenticityScore(content: string, contextYear: number, anachronisms: Anachronism[]): number {
  let score = 100;

  // Deduct points for anachronisms
  anachronisms.forEach(anachronism => {
    switch (anachronism.severity) {
      case 'critical':
        score -= 30;
        break;
      case 'major':
        score -= 15;
        break;
      case 'minor':
        score -= 5;
        break;
    }
  });

  // Deduct points for modern language patterns
  const modernPhrases = [
    'okay', 'ok', 'yeah', 'awesome', 'cool', 'totally', 'literally',
    'guys', 'dude', 'stuff', 'things', 'whatever', 'basically'
  ];

  modernPhrases.forEach(phrase => {
    if (content.includes(phrase)) {
      score -= 10;
    }
  });

  // Bonus points for period-appropriate language
  const periodTerms = [
    'thee', 'thou', 'thy', 'verily', 'forsooth', 'hath', 'doth',
    'wherefore', 'thus', 'hence', 'thence', 'whilst', 'amongst'
  ];

  let periodTermCount = 0;
  periodTerms.forEach(term => {
    if (content.includes(term)) {
      periodTermCount++;
    }
  });

  if (periodTermCount > 0) {
    score += Math.min(periodTermCount * 5, 20); // Up to 20 bonus points
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generates historical context description
 */
function generateHistoricalContext(sourceType: SourceAnalysis['sourceType'], year: number, keyTerms: string[]): string {
  const contexts = {
    legal: `Legal documents from ${year} would typically involve formal language and established procedures of the time period.`,
    religious: `Religious texts from ${year} would reflect the dominant theological beliefs and practices of the era.`,
    personal: `Personal writings from ${year} would show individual experiences within the social and cultural context of the time.`,
    commercial: `Commercial documents from ${year} would detail trade practices and economic relationships of the period.`,
    literary: `Literary works from ${year} would embody the artistic and cultural expressions characteristic of the era.`,
    scientific: `Scientific writings from ${year} would reflect the state of natural philosophy and empirical knowledge of the time.`,
    unknown: `This document type from ${year} would be influenced by the general social and cultural conditions of the period.`
  };

  let context = contexts[sourceType];

  if (keyTerms.length > 0) {
    context += ` Key themes include: ${keyTerms.slice(0, 5).join(', ')}.`;
  }

  return context;
}

/**
 * Provides suggestions for improving source authenticity
 */
export function generateAuthenticityFeedback(analysis: SourceAnalysis): string[] {
  const feedback: string[] = [];

  if (analysis.authenticityScore < 70) {
    feedback.push("Consider using more period-appropriate language and terminology.");
  }

  if (analysis.anachronisms.length > 0) {
    feedback.push(`Detected ${analysis.anachronisms.length} potential anachronism(s). Review for historical accuracy.`);
  }

  if (analysis.keyTerms.length < 3) {
    feedback.push("Adding more historical context and period-specific details could enhance authenticity.");
  }

  if (analysis.authenticityScore >= 80) {
    feedback.push("This document shows good historical awareness and period-appropriate content.");
  }

  return feedback;
}