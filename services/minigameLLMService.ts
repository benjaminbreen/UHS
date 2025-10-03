/**
 * services/minigameLLMService.ts - Specialized LLM for interactive minigames (farm, marketplace, urban)
 * Provides historically accurate, context-aware interactions for location-based activities
 */

import { GoogleGenAI } from "@google/genai";
import { PlayerCharacter, MapData, Season, HistoricalEra, CulturalZone } from '../types';

export type MinigameContext = 'farm' | 'marketplace' | 'urban';

export interface MinigameState {
  context: MinigameContext;
  location: string;
  season: Season;
  year: number;
  era: HistoricalEra;
  culturalZone: CulturalZone;
  currentActivity?: string;
  recentActions: string[];
  inventory?: any[];
  currency: number;
  reputation?: number;
}

export interface FarmState extends MinigameState {
  crops: CropInfo[];
  livestock: LivestockInfo[];
  workers: number;
  tools: string[];
  buildings: string[];
  soilQuality: 'poor' | 'average' | 'fertile';
  waterAccess: boolean;
}

export interface CropInfo {
  type: string;
  plantedDate?: string;
  growthStage: 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead';
  health: number; // 0-100
  expectedYield: number;
  daysToHarvest?: number;
}

export interface LivestockInfo {
  type: string;
  count: number;
  health: number; // 0-100
  productivity: number; // 0-100
}

/**
 * Generate contextual response for farm activities
 */
export async function generateFarmResponse(
  query: string,
  farmState: FarmState,
  playerCharacter: PlayerCharacter
): Promise<string> {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const historicalContext = getHistoricalFarmingContext(farmState.era, farmState.culturalZone, farmState.season);
  
  const prompt = `
    You are a knowledgeable farm manager in ${farmState.year} ${farmState.location}.
    
    HISTORICAL CONTEXT:
    ${historicalContext}
    
    CURRENT FARM STATUS:
    - Season: ${farmState.season}
    - Crops: ${farmState.crops.map(c => `${c.type} (${c.growthStage})`).join(', ') || 'none'}
    - Livestock: ${farmState.livestock.map(l => `${l.count} ${l.type}`).join(', ') || 'none'}
    - Workers: ${farmState.workers}
    - Soil Quality: ${farmState.soilQuality}
    - Water Access: ${farmState.waterAccess ? 'yes' : 'no'}
    - Available Tools: ${farmState.tools.join(', ') || 'basic hand tools'}
    
    PLAYER:
    - Name: ${playerCharacter.name}
    - Currency: ${farmState.currency} coins
    - Recent Actions: ${farmState.recentActions.slice(-3).join(', ') || 'none'}
    
    PLAYER'S QUERY: "${query}"
    
    Respond as a helpful farm advisor would in this historical period. 
    Be specific about:
    1. Historical farming techniques appropriate to the era
    2. Seasonal considerations
    3. Local agricultural practices
    4. Economic factors (prices, demand)
    5. Practical next steps
    
    Keep response under 100 words. Be encouraging but realistic about challenges.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error('Failed to generate farm response:', error);
    return "The farm work continues as usual.";
  }
}

/**
 * Generate advice for specific farm activities
 */
export async function generateFarmActivityAdvice(
  activity: 'plant' | 'harvest' | 'tend' | 'trade' | 'upgrade',
  farmState: FarmState
): Promise<string> {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const activityPrompts = {
    plant: `What crops should be planted in ${farmState.season} given the ${farmState.soilQuality} soil?`,
    harvest: `Which crops are ready to harvest and what's the best technique?`,
    tend: `What maintenance tasks are most urgent for the farm?`,
    trade: `What farm products would fetch the best prices at market now?`,
    upgrade: `What improvements would most benefit this farm?`
  };
  
  const prompt = `
    As a ${farmState.era} agricultural expert in ${farmState.culturalZone} culture:
    
    Question: ${activityPrompts[activity]}
    
    Current conditions:
    - Season: ${farmState.season}
    - Year: ${farmState.year}
    - Crops: ${farmState.crops.map(c => `${c.type} (${c.growthStage})`).join(', ')}
    - Soil: ${farmState.soilQuality}
    
    Provide specific, historically accurate advice in 2-3 sentences.
    Reference actual farming practices from this era and region.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error('Failed to generate activity advice:', error);
    return "Consider the season and your resources carefully.";
  }
}

/**
 * Simulate farm event or encounter
 */
export async function generateFarmEvent(
  farmState: FarmState
): Promise<{ title: string; description: string; options: string[] }> {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const prompt = `
    Generate a historically accurate random farm event for:
    - Era: ${farmState.era}
    - Location: ${farmState.culturalZone}
    - Season: ${farmState.season}
    - Year: ${farmState.year}
    
    Current farm has: ${farmState.crops.length} crop types, ${farmState.livestock.length} livestock types
    
    Create a brief event that could realistically happen on a farm in this context.
    
    Format your response as JSON:
    {
      "title": "Event Title (max 5 words)",
      "description": "What happened (max 30 words)",
      "options": ["Option 1 (max 10 words)", "Option 2 (max 10 words)", "Option 3 (max 10 words)"]
    }
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });
    
    // Parse the JSON response
    const text = response.text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to generate farm event:', error);
    return {
      title: "Quiet Day",
      description: "The farm work continues peacefully.",
      options: ["Continue working", "Take a break", "Check the fields"]
    };
  }
}

/**
 * Get historical farming context for the era and region
 */
function getHistoricalFarmingContext(era: HistoricalEra, zone: CulturalZone, season: Season): string {
  const contexts = {
    [HistoricalEra.PREHISTORY]: {
      'EUROPEAN': `Early agriculture with basic tools. Slash-and-burn farming, small plots. Growing emmer wheat, barley. Seasonal migration common.`,
      'EAST_ASIAN': `Rice cultivation beginning. Millet is primary crop. Simple irrigation developing.`,
      'MENA': `Oasis agriculture. Date palms, basic grains. Following flood cycles.`,
      default: `Hunter-gatherer transitioning to farming. Basic tools, small gardens.`
    },
    [HistoricalEra.ANTIQUITY]: {
      'EUROPEAN': `Two-field rotation system. Ox-drawn plows. Wheat, barley, peas common. Manor system developing.`,
      'EAST_ASIAN': `Sophisticated rice paddies. Crop rotation with soybeans. Water buffalo for plowing.`,
      'MENA': `Basin irrigation from rivers. Wheat, barley, dates, flax. Shaduf for water lifting.`,
      default: `Established agriculture with metal tools. Crop rotation beginning.`
    },
    [HistoricalEra.MEDIEVAL]: {
      'EUROPEAN': `Three-field system standard. Heavy plows, horses replacing oxen. Wheat, rye, oats, legumes. Manorial obligations.`,
      'EAST_ASIAN': `Intensive cultivation. Double cropping of rice. Tea and silk production. Sophisticated irrigation.`,
      'MENA': `Qanat irrigation systems. Diverse crops: grains, cotton, fruits. Wind-powered mills.`,
      default: `Advanced farming with specialized tools. Market-oriented production beginning.`
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      'EUROPEAN': `Four-field rotation with turnips and clover. Enclosure movement. New World crops arriving. Improved breeds.`,
      'EAST_ASIAN': `High yields through intensive cultivation. Multiple cropping. Cash crops expanding.`,
      'MENA': `Traditional methods persist. Some European techniques adopted. Export crops growing.`,
      default: `Agricultural improvements spreading. New crops from global trade.`
    },
    [HistoricalEra.MODERN_ERA]: {
      default: `Mechanization beginning. Chemical fertilizers introduced. Scientific agriculture developing. Market-oriented farming.`
    }
  };
  
  const eraContext = contexts[era] || contexts[HistoricalEra.MEDIEVAL];
  return eraContext[zone] || eraContext.default || "Traditional farming methods.";
}

/**
 * Calculate crop growth and events
 */
export function updateCropGrowth(crops: CropInfo[], season: Season, daysPassed: number = 1): CropInfo[] {
  return crops.map(crop => {
    const updatedCrop = { ...crop };
    
    // Growth stages progression
    if (crop.growthStage !== 'harvest' && crop.growthStage !== 'dead') {
      if (crop.daysToHarvest) {
        updatedCrop.daysToHarvest = Math.max(0, crop.daysToHarvest - daysPassed);
        
        if (updatedCrop.daysToHarvest <= 0) {
          updatedCrop.growthStage = 'harvest';
        } else if (updatedCrop.daysToHarvest < 10) {
          updatedCrop.growthStage = 'mature';
        } else if (updatedCrop.daysToHarvest < 20) {
          updatedCrop.growthStage = 'growing';
        } else if (updatedCrop.daysToHarvest < 30) {
          updatedCrop.growthStage = 'sprout';
        }
      }
    }
    
    // Seasonal effects
    if (season === 'winter' && crop.type !== 'winter wheat') {
      updatedCrop.health = Math.max(0, updatedCrop.health - 10);
      if (updatedCrop.health <= 0) {
        updatedCrop.growthStage = 'dead';
      }
    }
    
    // Random events (disease, pests, etc.)
    if (Math.random() < 0.05) {
      updatedCrop.health = Math.max(0, updatedCrop.health - 5);
    }
    
    return updatedCrop;
  });
}

/**
 * Generate marketplace response
 */
export async function generateMarketplaceResponse(
  query: string,
  context: MinigameState,
  playerCharacter: PlayerCharacter
): Promise<string> {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const prompt = `
    You are a marketplace trader in ${context.year} ${context.location}.
    Era: ${context.era}, Culture: ${context.culturalZone}
    
    The player asks: "${query}"
    They have ${context.currency} coins.
    
    Respond as a period-appropriate merchant would. Mention:
    - Current market prices and demand
    - Quality of goods available
    - Trade opportunities
    
    Keep under 50 words. Be engaging and historically accurate.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error('Failed to generate marketplace response:', error);
    return "The market bustles with activity.";
  }
}