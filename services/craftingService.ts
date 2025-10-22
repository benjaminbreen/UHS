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
                            category: { type: Type.STRING, enum: ['Tool', 'Weapon', 'Material', 'Apparel', 'Food', 'Special', 'Document', 'Consumable', 'Vessel'] },
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
        ROLE: You are a logical and creative Crafting Master for a realistic, historical RPG. You understand that almost anything can be taken apart (disaggregated) into component pieces, and many things can be combined in sensible ways.

        INPUTS:
        - Method: ${method}
        - Input Items: ${JSON.stringify(inputItems)}
        - Player's Intent: "${playerText || ''}"

        TASK:
        ${method === 'DISAGGREGATE' ? `
        DISAGGREGATION RULES:
        - ALMOST ALL items can be disaggregated in some way. Be creative and logical.
        - Food items (like "bag of grain") break into smaller portions: "pile of grain" (multiple units) + "empty bag"
        - Cloth items break into "cloth pieces" + "thread" (of appropriate color)
        - Weapons break into components: "metal blade" + "wooden handle" + "binding material"
        - Animals/creatures break into parts: "earthworm" → "half an earthworm" (2 pieces)
        - Tools break into materials: "wooden bowl" → "wood chips" + "bowl fragments"
        - Complex items yield multiple components: "spinning wheel" → "wooden parts" + "metal components" + "spindle"
        
        CREATE MULTIPLE ITEMS when disaggregating (typically 2-10 items). Use stackable:true for small similar items.
        ALWAYS consume the original item and create logical component items.` : `
        
        COMBINATION RULES - BE CREATIVE AND PERMISSIVE:
        - ALMOST EVERYTHING can be combined to create something! Even unexpected combinations should produce results.
        - Default to SUCCESS - only say "no" if physically impossible (e.g., combining two abstract concepts)
        - Think like a creative craftsperson, alchemist, cook, and inventor rolled into one
        - Unusual combinations are ENCOURAGED - they make the game fun and emergent!

        CREATIVE COMBINATION EXAMPLES:

        LIQUIDS + ORGANIC MATERIALS (infusions, extracts, waters):
        - Water + rose petals = rose water (fragrant liquid, beauty/cooking uses)
        - Water + lavender = lavender water (calming infusion)
        - Water + herbs = herbal tea or tincture
        - Water + fruit = fruit juice or flavored water
        - Wine + flowers = floral wine
        - Oil + flowers = perfumed oil
        - Water + anything organic = some kind of infusion, soup, or extract

        FOOD COMBINATIONS (be very permissive):
        - Any food + any food = mixed dish, salad, stew, or strange combination
        - Flour + water = dough
        - Grain + water = porridge
        - Meat + vegetables = stew
        - Any ingredients = experimental dish (even if odd-tasting!)

        MATERIALS + MATERIALS:
        - Fabric + fabric = larger cloth, patchwork, or bandages
        - Wood + wood = larger wooden object, bundle of sticks
        - Metal + metal = metal ingot or combined piece
        - Rope + rope = longer rope
        - Similar materials always combine into more of that material

        TOOLS + MATERIALS:
        - Knife + wood = carved wood, wood shavings, wooden object
        - Knife + cloth = cut cloth pieces, strips, patterns
        - Hammer + metal = shaped metal, flattened metal
        - Needle + thread + cloth = sewn item
        - Any tool can be used creatively on any material

        PRACTICAL CRAFTING:
        - Wood + pelt/hide/rope = kayak, canoe, raft (category: "Vessel")
        - Logs + rope = raft or bridge (category: "Vessel" or "Bridge")
        - Metal + wood = tools, weapons, or implements
        - Plant fibers = rope, cordage, or fabric

        EXPERIMENTAL COMBINATIONS:
        - Powder + liquid = paste, mixture, potion
        - Container + contents = filled container
        - Two similar items = better version or more quantity
        - Decorative items + practical items = decorated practical item

        IMPORTANT: If items CAN physically touch/mix/combine in any way, CREATE SOMETHING.
        Only return failure for truly impossible combinations (like "idea + number").`}

        1. For ${method}, determine: What can be created from these items?
        2. Be creative! Almost everything should produce SOMETHING, even if unusual or experimental.
        3. Create logical resulting items. BaseId should be item name in UPPERCASE with spaces as underscores.
        4. Only return success=false for physically impossible combinations (very rare).
        5. RESPOND ONLY with valid JSON matching the schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
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
            // Group similar stackable items together
            const itemGroups = new Map<string, { def: ItemDefinition, count: number }>();
            
            for (const itemDef of parsedData.outcome.newItems) {
                if (itemDef.stackable) {
                    const key = `${itemDef.name}-${itemDef.material || 'default'}`;
                    const existing = itemGroups.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        itemGroups.set(key, { def: itemDef, count: 1 });
                    }
                } else {
                    // Non-stackable items get individual entries
                    const uniqueKey = `${itemDef.name}-${itemIdCounter++}`;
                    itemGroups.set(uniqueKey, { def: itemDef, count: 1 });
                }
            }
            
            // Convert groups back to item instances
            parsedData.outcome.newItems = Array.from(itemGroups.values()).map(({ def, count }) => ({
                ...def,
                id: `item-${itemIdCounter++}-${Date.now()}`,
                quantity: def.stackable ? count : 1
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