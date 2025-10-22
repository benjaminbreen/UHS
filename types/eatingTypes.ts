/**
 * types/eatingTypes.ts - Type definitions for the eating system
 */

export interface EatingResult {
    success: boolean;
    healthChange: number;      // -100 to +100
    fatigueChange: number;     // -100 to +100
    description: string;       // 1-2 sentences about eating experience
    wasEdible: boolean;        // Whether item was safely edible
    itemName: string;
    itemEmoji: string;
}
