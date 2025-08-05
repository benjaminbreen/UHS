import { GoogleGenAI, Type } from "@google/genai";
import { Item, CraftingResult, ItemDefinition } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let itemIdCounter = 5000; // a high number to avoid collisions with predefined items

const craftingSchema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN },
        outcome: {
            type: Type.OBJECT,
            properties: {
                newItems: {
                    type: Type.ARRAY,
                    nullable: true,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            baseId: { type: Type.STRING },
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            emoji: { type: Type.STRING },
                            rarity: { type: Type.STRING, enum: ['Junk', 'Common', 'Uncommon', 'Rare', 'Ultra-rare', 'Unique'] },
                            value: { type: Type.NUMBER },
                            weight: { type: Type.NUMBER },
                            category: { type: Type.STRING, enum: ['Tool', 'Weapon', 'Material', 'Apparel', 'Food', 'Special', 'Document', 'Consumable'] },
                            attack: { type: Type.NUMBER },
                            defense: { type: Type.NUMBER, nullable: true },
                            sustenance: { type: Type.NUMBER },
                            wearable: { type: Type.BOOLEAN },
                            stackable: { type: Type.BOOLEAN },
                            wieldable: { type: Type.BOOLEAN },
                            throwable: { type: Type.BOOLEAN },
                            craftingValue: { type: Type.NUMBER },
                            equipmentSlot: { type: Type.STRING, nullable: true, enum: ['head', 'torso', 'legs', 'feet', 'main_hand', 'off_hand', 'cloak', 'belt', 'amulet', 'ring1', 'ring2', 'accessory'] },
                            material: { type: Type.STRING, nullable: true },
                        },
                        required: ["baseId", "name", "description", "emoji", "rarity", "value", "weight", "category", "attack", "sustenance", "wearable", "stackable", "wieldable", "throwable", "craftingValue"]
                    }
                },
                consumedItemIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                message: { type: Type.STRING }
            },
            required: ["newItems", "consumedItemIds", "message"]
        }
    },
    required: ["success", "outcome"]
};


export async function executeCrafting(method: 'COMBINE' | 'DISAGGREGATE', items: Item[], playerText?: string): Promise<CraftingResult> {
    const inputItems = items.map(({ id, quantity, ...definition }) => ({ ...definition, instanceId: id }));

    const prompt = `
        ROLE: You are a logical and creative Crafting Master for a realistic, historical RPG. Your goal is to determine the outcome of a player's crafting attempt based on the provided items and their intent.

        INPUTS:
        - Method: ${method}
        - Input Items: ${JSON.stringify(inputItems)}
        - Player's Intent: "${playerText || ''}"

        TASK:
        1. Analyze the inputs. Is the player's action plausible based on the items and their intent? For COMBINE, consider if the items can logically form something new. For DISAGGREGATE, consider if the item can be broken into useful components.
        2. If plausible, determine the most logical outcome. This could be a new item or multiple new items. The 'baseId' for new items should be the item name in uppercase with spaces replaced by underscores. The new items must be logical results of the inputs.
        3. If not plausible, explain why in a witty, in-character message. Consumed items should be an empty array on failure.
        4. You MUST respond ONLY with a single, valid JSON object matching the provided schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: craftingSchema,
            }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);

        // Basic validation
        if (typeof parsedData.success !== 'boolean' || !parsedData.outcome) {
            throw new Error("Invalid JSON structure from LLM");
        }

        // Ensure consumedItemIds only contains IDs from the input items
        if (parsedData.success && parsedData.outcome.consumedItemIds) {
            const inputItemIds = new Set(items.map(item => item.id));
            parsedData.outcome.consumedItemIds = parsedData.outcome.consumedItemIds.filter((id: string) => inputItemIds.has(id));
        }

        // FIX: Directly create item instances from the LLM-provided definition
        if (parsedData.success && parsedData.outcome.newItems) {
            parsedData.outcome.newItems = parsedData.outcome.newItems.map((itemDef: ItemDefinition) => ({
                ...itemDef,
                id: `item-${itemIdCounter++}-${Date.now()}`,
                quantity: 1
            }));
        }

        return parsedData as CraftingResult;
        
    } catch (error) {
        console.error("Error executing crafting with Gemini:", error);
        return {
            success: false,
            outcome: {
                newItems: null,
                consumedItemIds: [],
                message: "You fiddle with the items, but nothing of consequence happens. The laws of physics seem to forbid it."
            }
        };
    }
}