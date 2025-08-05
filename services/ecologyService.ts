/**
 * services/ecologyService.ts - Logic for calculating animal spawn likelihoods.
 */
import { Tile, ClimateType, AnimalData } from '../types';
import { ANIMAL_DATA } from '../constants/index';

export interface PotentialWildlife {
  name: string;
  emoji: string;
  likelihood: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  notes: string[];
}

/**
 * Calculates the potential wildlife for a given tile based on its properties.
 * This does not spawn animals, but provides information for UI/modals.
 * @param tile The standard tile object with qualities.
 * @param climate The climate of the map.
 * @returns An array of potential wildlife with their spawn likelihood.
 */
export function getPotentialWildlife(tile: Tile, climate: ClimateType): PotentialWildlife[] {
    const results: PotentialWildlife[] = [];

    for (const key in ANIMAL_DATA) {
        const animal = ANIMAL_DATA[key];
        const notes: string[] = [];
        let score = 0;
        let checks = 0;

        // --- Condition Checks ---
        if (animal.spawnBiomes.includes(tile.biome)) {
            score++;
        } else {
            continue; // Skip if biome doesn't match at all
        }
        checks++;

        if (!animal.spawnConditions.climate || animal.spawnConditions.climate.includes(climate)) {
            score++;
        } else {
            notes.push(`Prefers different climates.`);
        }
        checks++;

        if (animal.spawnConditions.minBiodiversity !== undefined) {
            if (tile.qualities.biodiversity >= animal.spawnConditions.minBiodiversity) score++; else notes.push(`Needs higher biodiversity (needs >${animal.spawnConditions.minBiodiversity.toFixed(2)}, has ${tile.qualities.biodiversity.toFixed(2)})`);
            checks++;
        }
        if (animal.spawnConditions.maxSafety !== undefined) {
            if (tile.qualities.safety <= animal.spawnConditions.maxSafety) score++; else notes.push(`Avoids safe areas (needs <${animal.spawnConditions.maxSafety.toFixed(2)}, has ${tile.qualities.safety.toFixed(2)})`);
            checks++;
        }
        if (animal.spawnConditions.minSafety !== undefined) {
            if (tile.qualities.safety >= animal.spawnConditions.minSafety) score++; else notes.push(`Prefers safer areas (needs >${animal.spawnConditions.minSafety.toFixed(2)}, has ${tile.qualities.safety.toFixed(2)})`);
            checks++;
        }
         if (animal.spawnConditions.minSacrality !== undefined) {
            if (tile.qualities.sacrality >= animal.spawnConditions.minSacrality) score++; else notes.push(`Needs higher sacrality (needs >${animal.spawnConditions.minSacrality.toFixed(2)}, has ${tile.qualities.sacrality.toFixed(2)})`);
            checks++;
        }
        
        const matchRatio = score / checks;
        
        if (matchRatio > 0.6) { // Must meet a threshold of conditions
             let likelihood: PotentialWildlife['likelihood'] = 'Uncommon';
             const finalScore = matchRatio * tile.qualities.biodiversity;

             if(animal.type === "Mythical") {
                 likelihood = "Legendary";
             } else if (finalScore > 0.6) {
                 likelihood = "Common";
             } else if (finalScore > 0.3) {
                 likelihood = "Uncommon";
             } else {
                 likelihood = "Rare";
             }
             
             results.push({ name: animal.name, emoji: animal.emoji, likelihood, notes });
        }
    }
    
    return results.sort((a,b) => {
        const order = { 'Common': 4, 'Uncommon': 3, 'Rare': 2, 'Legendary': 1 };
        return order[b.likelihood] - order[a.likelihood];
    });
}