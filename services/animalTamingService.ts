/**
 * Animal Taming Service
 * Handles taming mechanics, ownership detection, and party management for animals
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AnimalEntity, NpcEntity, PlayerCharacter, MapData } from '../types';
import { ANIMAL_DATA } from '../constants';
import { debouncedStorage } from './debouncedStorageService';

export interface TamingResult {
    success: 'tamed' | 'partial' | 'failed';
    message: string;
    animalResponse: string;
    reputationChange?: number;
    ownerName?: string;
    ownerWarning?: string;
}

export interface TamedAnimal extends AnimalEntity {
    isTamed: boolean;
    owner: string; // Player name who tamed it
    tamingDate: { year: number; month: number; day: number };
    loyalty: number; // 0-100
    value: number; // Market value
    name?: string; // Custom name given by player
}

/**
 * Check if an animal is owned by a nearby NPC
 */
export function checkAnimalOwnership(
    animal: AnimalEntity,
    npcs: NpcEntity[],
    mapWidth: number = 100
): { isOwned: boolean; owner?: NpcEntity; distance?: number } {
    // Domestic animals are likely owned if near settlements
    const isDomestic = ANIMAL_DATA[animal.baseId]?.type === 'domestic';
    if (!isDomestic) return { isOwned: false };
    
    // Find NPCs within 10 tiles
    const nearbyNpcs = npcs.filter(npc => {
        const dx = Math.abs(npc.x - animal.x);
        const dy = Math.abs(npc.y - animal.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 10;
    });
    
    if (nearbyNpcs.length === 0) return { isOwned: false };
    
    // Find the closest NPC who could be the owner
    let closestNpc: NpcEntity | undefined;
    let minDistance = Infinity;
    
    nearbyNpcs.forEach(npc => {
        const dx = Math.abs(npc.x - animal.x);
        const dy = Math.abs(npc.y - animal.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Farmers, herders, and merchants are more likely to own animals
        const isLikelyOwner = npc.role && (
            npc.role.toLowerCase().includes('farm') ||
            npc.role.toLowerCase().includes('herd') ||
            npc.role.toLowerCase().includes('merchant') ||
            npc.role.toLowerCase().includes('peasant')
        );
        
        if (distance < minDistance && (isLikelyOwner || distance <= 5)) {
            closestNpc = npc;
            minDistance = distance;
        }
    });
    
    // 80% chance the animal is owned if a suitable NPC is within 5 tiles
    // 50% chance if within 10 tiles
    const ownershipChance = minDistance <= 5 ? 0.8 : 0.5;
    const isOwned = closestNpc && Math.random() < ownershipChance;
    
    return {
        isOwned: !!isOwned,
        owner: isOwned ? closestNpc : undefined,
        distance: minDistance
    };
}

/**
 * Calculate the market value of an animal
 */
export function calculateAnimalValue(animal: AnimalEntity, year: number): number {
    const baseData = ANIMAL_DATA[animal.baseId];
    if (!baseData) return 10;
    
    let baseValue = 10;
    
    // Domestic animals are more valuable
    if (baseData.type === 'domestic') {
        switch (animal.baseId) {
            case 'COW': baseValue = 100; break;
            case 'HORSE': baseValue = 200; break;
            case 'SHEEP': baseValue = 50; break;
            case 'PIG': baseValue = 60; break;
            case 'CHICKEN': baseValue = 15; break;
            case 'GOAT': baseValue = 40; break;
            case 'DOG': baseValue = 30; break;
            case 'CAT': baseValue = 20; break;
            default: baseValue = 50;
        }
    } else {
        // Wild animals have value based on rarity and danger
        switch (baseData.type) {
            case 'mythical': baseValue = 500; break;
            case 'predator': baseValue = 150; break;
            case 'megafauna': baseValue = 300; break;
            case 'exotic': baseValue = 200; break;
            default: baseValue = 30;
        }
    }
    
    // Adjust for health
    if (animal.diseaseHealth?.currentDiseases && animal.diseaseHealth.currentDiseases.length > 0) {
        baseValue *= 0.5; // Sick animals worth half
    }
    
    // Historical price adjustment
    if (year < 0) baseValue *= 0.8; // Ancient times
    else if (year < 1000) baseValue *= 0.9; // Medieval
    else if (year > 1800) baseValue *= 1.2; // Industrial+
    
    return Math.round(baseValue);
}

/**
 * Use LLM to determine taming outcome
 */
export async function attemptTaming(
    animal: AnimalEntity,
    approach: string,
    player: PlayerCharacter,
    isSecondAttempt: boolean = false
): Promise<TamingResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const animalData = ANIMAL_DATA[animal.baseId];
    const isDomestic = animalData?.type === 'domestic';
    const isPredator = animalData?.type === 'predator';
    const isMythical = animalData?.type === 'mythical';
    
    // Calculate taming difficulty
    let difficulty = 'moderate';
    if (isDomestic) difficulty = 'very easy';
    else if (isPredator) difficulty = 'very hard';
    else if (isMythical) difficulty = 'nearly impossible';
    
    const prompt = `
        You are simulating an animal taming attempt in a historical game.
        
        THE ANIMAL:
        - Species: ${animal.speciesName}
        - Type: ${animalData?.type || 'wild'}
        - Temperament: ${animalData?.temperament || 'unknown'}
        - Current health: ${animal.diseaseHealth?.currentDiseases?.length ? 'sick/weak' : 'healthy'}
        - Difficulty to tame: ${difficulty}
        
        THE PLAYER:
        - Name: ${player.name}
        - Stats: Intelligence ${player.stats.intelligence}/20, Charisma ${player.stats.charisma}/20
        - Reputation: ${player.mapReputation}/100
        - Approach: "${approach}"
        ${isSecondAttempt ? '- This is their SECOND attempt (animal is already somewhat receptive)' : ''}
        
        TAMING RULES:
        1. **Domestic animals (cow, sheep, goat, chicken, etc.) are VERY EASY to tame** - they are already used to humans and will respond well to almost any gentle approach
        2. For domestic animals, success rate should be 90%+ unless the approach is extremely hostile
        3. Wild animals require patience and the right offering (food, calm demeanor)
        4. Predators are very dangerous and rarely tameable
        5. Intelligence helps with understanding animal behavior
        6. Charisma helps with calming and bonding
        7. Sick/weak animals are easier to approach but may not survive taming
        
        Evaluate the approach and determine the outcome. Consider:
        - Is the approach appropriate for this animal type?
        - Does the player show understanding of animal behavior?
        - Are they being gentle/forceful/clever?
        - For domestic animals: they might already be somewhat used to humans
        - For wild animals: they're naturally fearful
        - For predators: they're dangerous and may attack
        
        ${isSecondAttempt ? 'The animal has already shown some interest. Be more lenient.' : ''}
        
        Respond with a JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        success: { 
                            type: Type.STRING, 
                            enum: ['tamed', 'partial', 'failed'],
                            description: "tamed = success, partial = try again, failed = animal flees/attacks"
                        },
                        animalResponse: {
                            type: Type.STRING,
                            description: "What the animal does (1-2 sentences, vivid and specific)"
                        },
                        message: {
                            type: Type.STRING,
                            description: "Description of the outcome for the player"
                        }
                    },
                    required: ["success", "animalResponse", "message"]
                }
            }
        });
        
        const result = JSON.parse(response.text);
        
        // Add congratulations for successful taming
        if (result.success === 'tamed') {
            const value = calculateAnimalValue(animal, player.year || 1500);
            result.message = `🎉 Success! ${result.message}\n\nThe ${animal.speciesName} is now yours! This ${animalData?.type || 'animal'} is worth approximately ${value} coins and will follow you loyally. You can see it in your Party tab and sell it at markets if needed.`;
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in taming attempt:', error);
        return {
            success: 'failed',
            message: 'The animal seems confused by your approach.',
            animalResponse: `The ${animal.speciesName} backs away nervously.`
        };
    }
}

/**
 * Convert animal to tamed version
 */
export function createTamedAnimal(
    animal: AnimalEntity,
    player: PlayerCharacter,
    gameDate: { year: number; month: number; day: number }
): TamedAnimal {
    const value = calculateAnimalValue(animal, gameDate.year);
    
    return {
        ...animal,
        isTamed: true,
        owner: player.name,
        tamingDate: { ...gameDate },
        loyalty: 50, // Starts at medium loyalty
        value
    };
}

/**
 * Load tamed animals from storage
 */
export function loadTamedAnimals(): TamedAnimal[] {
    try {
        // Use debounced storage which checks pending writes first
        const animals = debouncedStorage.getItem<TamedAnimal[]>('tamedAnimals');
        if (animals) {
            return animals;
        }
    } catch (error) {
        console.error('Error loading tamed animals:', error);
    }
    return [];
}

/**
 * Save tamed animals to storage
 */
export function saveTamedAnimals(animals: TamedAnimal[]): void {
    try {
        // Use debounced storage to prevent performance issues
        debouncedStorage.setItem('tamedAnimals', animals);
        // Logging removed - too frequent
    } catch (error) {
        console.error('Error saving tamed animals:', error);
    }
}

/**
 * Add tamed animal to player's party (max 3 animals)
 */
export function addToParty(animal: TamedAnimal): void {
    const current = loadTamedAnimals();
    
    // Limit to 3 tamed animals maximum
    if (current.length >= 3) {
        console.warn(`Cannot add ${animal.speciesName} to party - maximum of 3 animals allowed (currently have ${current.length})`);
        return;
    }
    
    current.push(animal);
    saveTamedAnimals(current);
    console.log(`Added ${animal.speciesName} to party (${current.length}/3 animals)`);
}

/**
 * Remove tamed animal from party (when sold or dies)
 */
export function removeFromParty(animalId: string): void {
    const current = loadTamedAnimals();
    const filtered = current.filter(a => a.id !== animalId);
    saveTamedAnimals(filtered);
}

/**
 * Update the name of a tamed animal
 */
export function updateAnimalName(animalId: string, newName: string): void {
    const current = loadTamedAnimals();
    const animalIndex = current.findIndex(a => a.id === animalId);
    
    if (animalIndex !== -1) {
        current[animalIndex].name = newName.trim() || undefined;
        saveTamedAnimals(current);
        console.log(`Updated animal name: ${current[animalIndex].speciesName} -> ${newName}`);
    }
}