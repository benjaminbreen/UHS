/**
 * Service for handling primary source discussions with VIP NPCs
 */

import { NpcEntity } from '../types';
import { SpecialMapArchetype } from '../types/specialMapTypes';
import { SubmittedSource, SourceDiscussion } from '../types/primarySource';
import { generateDmResponse } from './llmService';
import { v4 as uuidv4 } from 'uuid';
import { analyzeSource, generateAuthenticityFeedback } from './sourceAnalysisService';

/**
 * Enhanced VIP detection for special maps with multiple NPC scenarios
 */
export function getVIPNpcsForDiscussion(npcs: NpcEntity[], mapArchetype: SpecialMapArchetype | null): NpcEntity[] {
  if (!mapArchetype || !npcs || npcs.length === 0) return [];

  const vipPatterns: Record<string, string[]> = {
    GOVERNMENT_FORUM: ['king', 'queen', 'emperor', 'sultan', 'pharaoh', 'raja', 'chief', 'magistrate', 'governor', 'mayor', 'official', 'minister', 'senator'],
    TRIBAL_COUNCIL: ['chief', 'elder', 'shaman', 'medicine man', 'wise woman', 'council member'],
    COURT_CHAMBER: ['king', 'queen', 'prince', 'princess', 'duke', 'duchess', 'judge', 'magistrate', 'chancellor'],
    SACRED: ['high priest', 'priest', 'priestess', 'abbot', 'bishop', 'imam', 'rabbi', 'monk', 'religious leader', 'holy'],
    PALACE: ['king', 'queen', 'emperor', 'empress', 'prince', 'princess', 'noble', 'ruler', 'sovereign', 'monarch'],
    ESTATES: ['lord', 'lady', 'baron', 'count', 'earl', 'noble', 'estate owner'],
    UNIVERSITY: ['professor', 'dean', 'scholar', 'rector', 'master', 'doctor', 'philosopher'],
    THEATER: ['director', 'playwright', 'master', 'impresario'],
  };

  const patterns = vipPatterns[mapArchetype] || [];
  const vips: NpcEntity[] = [];

  // Find all matching VIPs
  for (const pattern of patterns) {
    const matchingNpcs = npcs.filter(npc =>
      npc.profession.toLowerCase().includes(pattern.toLowerCase()) ||
      npc.name.toLowerCase().includes(pattern.toLowerCase())
    );
    vips.push(...matchingNpcs);
  }

  // Remove duplicates and limit to top 3
  const uniqueVips = Array.from(new Map(vips.map(npc => [npc.id, npc])).values());
  return uniqueVips.slice(0, 3);
}

/**
 * Detects the highest-ranking NPC in a special map who can discuss sources
 */
export function getVIPNpc(npcs: NpcEntity[], mapArchetype: SpecialMapArchetype | null): NpcEntity | null {
  if (!mapArchetype || !npcs || npcs.length === 0) return null;

  // Priority order for different archetypes
  const vipPatterns: Record<string, string[]> = {
    GOVERNMENT_FORUM: ['king', 'queen', 'emperor', 'sultan', 'pharaoh', 'raja', 'chief', 'magistrate', 'governor', 'mayor', 'official', 'minister', 'senator'],
    TRIBAL_COUNCIL: ['chief', 'elder', 'shaman', 'medicine man', 'wise woman', 'council member'],
    COURT_CHAMBER: ['king', 'queen', 'prince', 'princess', 'duke', 'duchess', 'judge', 'magistrate', 'chancellor'],
    SACRED: ['high priest', 'priest', 'priestess', 'abbot', 'bishop', 'imam', 'rabbi', 'monk', 'religious leader', 'holy'],
    PALACE: ['king', 'queen', 'emperor', 'empress', 'prince', 'princess', 'noble', 'ruler', 'sovereign', 'monarch'],
    ESTATES: ['lord', 'lady', 'baron', 'count', 'earl', 'noble', 'estate owner'],
    UNIVERSITY: ['professor', 'dean', 'scholar', 'rector', 'master', 'doctor', 'philosopher'],
    THEATER: ['director', 'playwright', 'master', 'impresario'],
  };

  const patterns = vipPatterns[mapArchetype] || [];

  // Find the highest ranking NPC based on profession
  for (const pattern of patterns) {
    const vip = npcs.find(npc =>
      npc.profession.toLowerCase().includes(pattern.toLowerCase()) ||
      npc.name.toLowerCase().includes(pattern.toLowerCase())
    );
    if (vip) return vip;
  }

  // Fallback: return the first NPC with a non-generic profession
  return npcs.find(npc =>
    !npc.profession.toLowerCase().includes('guard') &&
    !npc.profession.toLowerCase().includes('servant')
  ) || npcs[0];
}

/**
 * Generates a contextual discussion about a submitted source
 */
export async function generateSourceDiscussion(
  source: SubmittedSource,
  vipNpc: NpcEntity,
  playerNotes: string = '',
  mapArea: string,
  year: number,
  playerCharacter?: any,
  mapData?: any
): Promise<string> {
  // Analyze the source for anachronisms and context
  const analysis = analyzeSource(source, year);

  // Build enhanced prompt with analysis insights
  let prompt = `You are ${vipNpc.name}, a ${vipNpc.profession} in ${source.era} ${source.culturalZone} (year ${year}, ${mapArea}).

A visitor has presented this ${analysis.sourceType} document for your consideration:
"${source.content.slice(0, 500)}${source.content.length > 500 ? '...' : ''}"

${playerNotes ? `Their explanation: "${playerNotes}"` : ''}

HISTORICAL CONTEXT: ${analysis.historicalContext}

Respond as your character would, considering:
1. Your era's knowledge, beliefs, and worldview (you have no knowledge beyond ${year})
2. Your position and authority as ${vipNpc.profession}
3. Your cultural context (${source.culturalZone})
4. Whether this document seems relevant, suspicious, or meaningful to you`;

  // Add anachronism detection to prompt
  if (analysis.anachronisms.length > 0) {
    const criticalAnachronisms = analysis.anachronisms.filter(a => a.severity === 'critical');
    if (criticalAnachronisms.length > 0) {
      prompt += `\n5. IMPORTANT: This document contains concepts/terms that would be completely foreign or impossible in ${year}: ${criticalAnachronisms.map(a => a.term).join(', ')}. React with appropriate confusion, suspicion, or disbelief.`;
    }
  }

  prompt += `\n\nBe educational but stay completely in character. If the source seems anachronistic or strange, react with authentic confusion or suspicion.
Keep your response to 2-3 sentences that feel like natural dialogue.

Focus on ONE specific aspect of the document that would catch your attention most.`;

  console.log('[SourceDiscussionService] Starting discussion generation with:', {
    npc: vipNpc.name,
    sourceType: source.type,
    era: source.era,
    year,
    mapArea,
    hasPlayerCharacter: !!playerCharacter,
    hasMapData: !!mapData
  });

  try {
    const response = await generateDmResponse(prompt, {
      playerCharacter: playerCharacter || {
        name: 'Traveler',
        profession: 'Visitor',
        age: 25,
        gender: 'unknown'
      },
      mapData: mapData || {},
      npcs: [vipNpc],
      animals: [],
      terrainStructures: [],
      playerX: 0,
      playerY: 0,
      viewMode: 'standard',
      interiorContext: {
        type: 'special_map',
        archetype: mapArea,
        description: `Inside a ${mapArea.toLowerCase().replace('_', ' ')}`
      },
      currentTile: {
        biomeType: 'GOVERNMENT_DISTRICT',
        isLand: true,
        elevation: 0.5
      },
      ambianceContext: {
        currentTile: { biomeType: 'GOVERNMENT_DISTRICT', isLand: true, elevation: 0.5 },
        neighboringTiles: [],
        mapArchetype: 'SETTLEMENT',
        climate: 'TEMPERATE',
        timeOfDay: 'morning',
        historicalEra: source.era,
        century: Math.floor(year / 100),
        decade: Math.floor((year % 100) / 10),
        locationString: mapArea,
        mapSeed: 0,
        season: 'SPRING',
        culturalZone: source.culturalZone
      } as any
    });

    console.log('[SourceDiscussionService] Generated response:', response);
    return response || `${vipNpc.name} examines the document carefully but seems puzzled by its contents.`;
  } catch (error) {
    console.error('[SourceDiscussionService] Failed to generate discussion:', error);
    console.error('[SourceDiscussionService] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Fallback responses based on archetype
    const fallbackResponses: Record<string, string> = {
      GOVERNMENT_FORUM: `This is an interesting document. I shall have my scribes examine it further and consider its implications for our governance.`,
      SACRED: `The sacred texts speak of many mysteries. This document requires prayer and contemplation to understand its divine meaning.`,
      PALACE: `An intriguing submission. We shall consider its merits and whether it serves the interests of the realm.`,
      UNIVERSITY: `Fascinating! This text raises questions that deserve scholarly examination. Let us discuss its philosophical implications.`,
    };

    return fallbackResponses[mapArea] || `${vipNpc.name} studies the document with interest.`;
  }
}

/**
 * Creates a source discussion record
 */
export function createSourceDiscussion(
  source: SubmittedSource,
  npc: NpcEntity,
  dialogue: string,
  location: string
): SourceDiscussion {
  return {
    sourceId: source.id,
    npcId: npc.id,
    npcName: npc.name,
    npcProfession: npc.profession,
    dialogue: [dialogue],
    timestamp: Date.now(),
    location
  };
}

/**
 * Creates a new submitted source
 */
export function createSubmittedSource(
  title: string,
  content: string,
  type: 'pasted_text' | 'journal_entry',
  playerNotes: string,
  era: any,
  culturalZone: any
): SubmittedSource {
  return {
    id: uuidv4(),
    title,
    content,
    type,
    playerNotes,
    submittedAt: Date.now(),
    era,
    culturalZone
  };
}