/**
 * services/singingService.ts - Handles song generation and performance evaluation
 */

import { PlayerCharacter, MapData, Tile, NPC } from '../types';
import { GoogleGenAI } from "@google/genai";
import { weatherService } from './weatherService';
import { eventService } from './eventService';

interface SongContext {
  era: string;
  culture: string;
  biome: string;
  weather: string;
  timeOfDay: string;
  nearbyNPCs: string[];
  nearbyAnimals: string[];
  playerProfession: string;
  playerMood: string;
  location: string;
}

interface SongResult {
  song: string;
  quality: number;
  finalScore: number;
  reputationChange: number;
  audienceReaction: string;
}

/**
 * Gathers contextual information about the player's surroundings
 */
function gatherSongContext(
  player: PlayerCharacter,
  mapData: MapData | null,
  currentTile: Tile | null,
  nearbyNPCs: NPC[],
  timeOfDay: string,
  season: string
): SongContext {
  // Determine player mood based on health and fatigue
  const healthPercent = player.health / player.maxHealth;
  const fatiguePercent = player.fatigue / player.maxFatigue;
  
  let playerMood = 'content';
  if (healthPercent < 0.3) playerMood = 'pained';
  else if (healthPercent < 0.5) playerMood = 'weary';
  else if (fatiguePercent > 0.8) playerMood = 'exhausted';
  else if (healthPercent > 0.9 && fatiguePercent < 0.2) playerMood = 'joyful';
  
  // Get weather description
  let weatherDesc = 'clear';
  if (mapData && currentTile) {
    const weather = weatherService.getWeather(
      mapData.climate,
      currentTile.biome,
      season as any,
      timeOfDay as any,
      currentTile.altitude || 0.5,
      180, // default day of year
      { x: 0, y: 0 }
    );
    
    if (weather.precipitation === 'rain') weatherDesc = 'rainy';
    else if (weather.precipitation === 'snow') weatherDesc = 'snowy';
    else if (weather.cloudCover > 0.7) weatherDesc = 'overcast';
    else if (weather.temperature > 30) weatherDesc = 'hot';
    else if (weather.temperature < 5) weatherDesc = 'cold';
  }
  
  // Extract NPC and animal information
  const npcDescriptions = nearbyNPCs.slice(0, 3).map(npc => 
    `${npc.name} the ${npc.profession}`
  );
  
  const animalDescriptions = nearbyNPCs
    .filter(npc => npc.type === 'animal')
    .slice(0, 3)
    .map(npc => npc.species || 'creature');
  
  // Determine location type
  let location = 'wilderness';
  if (currentTile?.structure?.type === 'city') location = 'city streets';
  else if (currentTile?.structure?.type === 'marketplace') location = 'marketplace';
  else if (currentTile?.structure?.type === 'farm') location = 'farmland';
  else if (currentTile?.structure?.type === 'holy_site') location = 'sacred ground';
  else if (currentTile?.biome === 'forest') location = 'forest';
  else if (currentTile?.biome === 'desert') location = 'desert';
  else if (currentTile?.biome === 'grassland') location = 'grassland';
  else if (currentTile?.biome === 'mountain') location = 'mountains';
  else if (currentTile?.biome === 'coast') location = 'coastline';
  
  return {
    era: mapData?.timeSlice || '1500 CE',
    culture: mapData?.continent || 'European',
    biome: currentTile?.biome || 'grassland',
    weather: weatherDesc,
    timeOfDay: timeOfDay.toLowerCase(),
    nearbyNPCs: npcDescriptions,
    nearbyAnimals: animalDescriptions,
    playerProfession: player.profession,
    playerMood,
    location
  };
}

/**
 * Calculates the final performance score based on LLM rating and player stats
 */
function calculatePerformanceScore(
  baseQuality: number,
  player: PlayerCharacter
): number {
  // Get charisma modifier (0.5 to 1.5 multiplier based on charisma)
  const charisma = player.stats?.charisma || 5;
  const charismaModifier = 0.5 + (charisma / 10); // 5 charisma = 1.0x, 10 = 1.5x, 0 = 0.5x
  
  // Get wisdom bonus for clever lyrics (0 to 0.2 bonus)
  const wisdom = player.stats?.wisdom || 5;
  const wisdomBonus = (wisdom / 50); // max 0.2 bonus at 10 wisdom
  
  // Get fatigue penalty (0 to -0.3 penalty)
  const fatiguePercent = player.fatigue / player.maxFatigue;
  const fatiguePenalty = fatiguePercent > 0.5 ? -(fatiguePercent - 0.5) * 0.6 : 0;
  
  // Calculate final score
  const finalScore = (baseQuality * charismaModifier) + wisdomBonus + fatiguePenalty;
  
  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, finalScore));
}

/**
 * Determines reputation change based on performance score
 */
function calculateReputationChange(score: number): number {
  if (score >= 9) return 3;  // Masterful performance
  if (score >= 8) return 2;  // Excellent performance
  if (score >= 7) return 1;  // Good performance
  if (score >= 5) return 0;  // Adequate performance
  if (score >= 4) return -1; // Poor performance
  if (score >= 3) return -2; // Bad performance
  return -3;                  // Terrible performance
}

/**
 * Generates audience reaction based on performance
 */
function getAudienceReaction(score: number, hasAudience: boolean): string {
  if (!hasAudience) {
    if (score >= 7) return "Your voice echoes beautifully through the empty landscape.";
    if (score >= 5) return "You sing to yourself, finding comfort in the melody.";
    return "Your voice cracks and falters in the silence.";
  }
  
  if (score >= 9) return "The audience erupts in thunderous applause! Some even toss coins!";
  if (score >= 8) return "Everyone stops to listen, clearly impressed by your performance.";
  if (score >= 7) return "Several people smile and nod appreciatively at your song.";
  if (score >= 6) return "A few listeners clap politely when you finish.";
  if (score >= 5) return "Your audience listens without much reaction.";
  if (score >= 4) return "Some people turn away, trying to ignore your singing.";
  if (score >= 3) return "People grimace and cover their ears as you sing.";
  return "Someone shouts 'Please stop!' Dogs begin to howl in protest.";
}

/**
 * Main function to generate and perform a song
 */
export async function performSong(
  player: PlayerCharacter,
  mapData: MapData | null,
  currentTile: Tile | null,
  nearbyNPCs: NPC[],
  timeOfDay: string = 'day',
  season: string = 'summer'
): Promise<SongResult> {
  // Gather context
  const context = gatherSongContext(player, mapData, currentTile, nearbyNPCs, timeOfDay, season);
  
  // Build the prompt
  const prompt = `You are a talented bard in ${context.era} ${context.culture} culture. 
Create a SHORT song (4-8 lines) that a ${context.playerProfession} would sing while feeling ${context.playerMood}.

Context:
- Location: ${context.location} (${context.biome} biome)
- Weather: ${context.weather} ${context.timeOfDay}
- Audience: ${context.nearbyNPCs.length > 0 ? context.nearbyNPCs.join(', ') : 'singing alone'}
${context.nearbyAnimals.length > 0 ? `- Animals nearby: ${context.nearbyAnimals.join(', ')}` : ''}

Requirements:
1. Make it culturally and historically authentic to ${context.era} ${context.culture}
2. Reference the immediate environment (weather, location, time of day)
3. Keep it simple and memorable - this is an impromptu performance
4. Match the mood to the character's state (${context.playerMood})
5. Use period-appropriate language and themes

After the song, on a new line starting with "QUALITY:", rate your song's quality from 1-10 based on:
- Historical authenticity (1-3 points)
- Rhyme and rhythm (1-3 points)  
- Relevance to setting (1-2 points)
- Emotional impact (1-2 points)

Format your response as:
[Song text here]

QUALITY: [number]/10`;

  try {
    // Initialize Gemini API - exactly like in llmService
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Call LLM - exactly like generateObservationText does it
    const result = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash-lite', 
      contents: prompt 
    });
    
    const response = result.text;
    
    // Track API call
    eventService.trackAPICall(prompt, response);
    
    // Parse response
    const lines = response.split('\n');
    const qualityLine = lines.find(line => line.startsWith('QUALITY:'));
    const qualityMatch = qualityLine?.match(/(\d+)/);
    const baseQuality = qualityMatch ? parseInt(qualityMatch[1]) : 5;
    
    // Get song text (everything before QUALITY line)
    const qualityIndex = lines.findIndex(line => line.startsWith('QUALITY:'));
    const songText = lines.slice(0, qualityIndex > 0 ? qualityIndex : lines.length)
      .filter(line => line.trim())
      .join('\n');
    
    // Calculate final score with player modifiers
    const finalScore = calculatePerformanceScore(baseQuality, player);
    const reputationChange = calculateReputationChange(finalScore);
    const hasAudience = context.nearbyNPCs.length > 0;
    const audienceReaction = getAudienceReaction(finalScore, hasAudience);
    
    return {
      song: songText || "♪ La la la... ♪\n(You hum a simple tune)",
      quality: baseQuality,
      finalScore: Math.round(finalScore * 10) / 10,
      reputationChange,
      audienceReaction
    };
  } catch (error) {
    console.error('Error generating song:', error);
    
    // Fallback song
    return {
      song: "♪ Oh, the road is long and winding,\n" +
            "Through the " + context.biome + " I roam,\n" +
            "The " + context.weather + " sky above me,\n" +
            "Far from my distant home. ♪",
      quality: 5,
      finalScore: 5,
      reputationChange: 0,
      audienceReaction: "You sing a simple traveling song."
    };
  }
}

/**
 * Formats the song result for display
 */
export function formatSongDisplay(result: SongResult, playerName: string): string {
  const performanceRating = result.finalScore >= 7 ? '⭐' : result.finalScore >= 5 ? '👍' : '👎';
  
  return `${playerName} begins to sing:\n\n` +
         `🎵 ${result.song} 🎵\n\n` +
         `${result.audienceReaction}\n\n` +
         `Performance: ${performanceRating} ${result.finalScore}/10` +
         (result.reputationChange !== 0 ? 
           `\nReputation ${result.reputationChange > 0 ? '+' : ''}${result.reputationChange}` : '');
}