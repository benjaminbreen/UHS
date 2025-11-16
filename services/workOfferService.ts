/**
 * services/workOfferService.ts - Generate and manage simple work offers
 */
import { GoogleGenAI, Type } from "@google/genai";
import { NpcEntity, PlayerCharacter, MapData, AnimalEntity } from '../types';
import { TerrainStructure } from '../types/structures';
import { WorkOffer, WorkTaskType } from '../types/workOffer';
import { getStructureLocation, calculateDistance, findStructuresInRadius } from './structureUtils';
import { wasAnimalKilled, getActiveWorkOffers } from './workOfferStorage';
import { removeItemFromInventory } from '../utils/inventoryUtils';
import { learningObjectivesService } from './learningObjectivesService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Detect if player is asking for work in their message
 */
export function detectWorkRequest(playerInput: string): boolean {
  const workKeywords = [
    'work', 'job', 'task', 'help', 'earn', 'money',
    'coins', 'hire', 'employ', 'pay', 'quest', 'favor',
    'need', 'gold', 'silver', 'employment'
  ];

  const lowerInput = playerInput.toLowerCase();
  return workKeywords.some(keyword => lowerInput.includes(keyword));
}

/**
 * Get direction from player to a location
 */
function getDirection(playerX: number, playerY: number, targetX: number, targetY: number): string {
  const dx = targetX - playerX;
  const dy = targetY - playerY;

  // Determine primary direction
  let direction = '';

  if (Math.abs(dy) > Math.abs(dx)) {
    direction = dy < 0 ? 'North' : 'South';
  } else {
    direction = dx > 0 ? 'East' : 'West';
  }

  // Add secondary direction for diagonals
  if (Math.abs(dx) > 5 && Math.abs(dy) > 5) {
    if (dy < 0 && dx > 0) direction = 'Northeast';
    else if (dy < 0 && dx < 0) direction = 'Northwest';
    else if (dy > 0 && dx > 0) direction = 'Southeast';
    else if (dy > 0 && dx < 0) direction = 'Southwest';
  }

  return direction;
}

// LLM response schema
const workOfferSchema = {
  type: Type.OBJECT,
  properties: {
    hasWork: {
      type: Type.BOOLEAN,
      description: "Whether the NPC has work to offer (should almost always be true unless NPC is injured/dying)"
    },
    taskType: {
      type: Type.STRING,
      description: "Type of task: fetch_item, deliver_to_location, buy_from_location, kill_animal, gather_resource, explore_location, collect_animal_products, investigate_and_report, compare_perspectives, debate_topic, or source_analysis"
    },
    description: {
      type: Type.STRING,
      description: "The full work request in the NPC's voice, including deadline if applicable"
    },
    requiredItem: {
      type: Type.STRING,
      description: "Item name if task requires fetching/buying an item"
    },
    requiredQuantity: {
      type: Type.NUMBER,
      description: "How many of the item needed (default 1)"
    },
    targetLocationName: {
      type: Type.STRING,
      description: "Name of location if task requires going somewhere (use actual structure names provided)"
    },
    targetAnimal: {
      type: Type.STRING,
      description: "Animal type if task is to hunt/kill an animal"
    },
    payment: {
      type: Type.NUMBER,
      description: "How many coins to pay (5-50 range, based on difficulty)"
    },
    deadlineHours: {
      type: Type.NUMBER,
      description: "Hours until deadline (12-72), 0 if no deadline"
    },
    debateTopic: {
      type: Type.STRING,
      description: "For debate_topic quests: the specific historical topic to discuss"
    },
    targetNpcs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "For compare_perspectives quests: list of NPC profession types to speak with (e.g., ['peasant', 'noble'])"
    },
    historicalContext: {
      type: Type.STRING,
      description: "For educational quests: explanation of why this task matters historically"
    }
  },
  required: ["hasWork", "taskType", "description", "payment"]
};

/**
 * Maximum number of active work offers allowed per NPC
 */
export const MAX_OFFERS_PER_NPC = 2;

/**
 * Generate a work offer using LLM
 */
export async function generateWorkOffer(
  npc: NpcEntity,
  playerCharacter: PlayerCharacter,
  mapData: MapData | null,
  terrainStructures: TerrainStructure[],
  gameTimeHours: number,
  playerPosition?: { x: number; y: number },
  nearbyAnimals?: AnimalEntity[]
): Promise<WorkOffer | null> {
  if (!mapData) return null;

  // Check if NPC already has too many active offers
  const allActiveOffers = getActiveWorkOffers();
  const npcActiveOffers = allActiveOffers.filter(offer => offer.npcId === npc.id);

  if (npcActiveOffers.length >= MAX_OFFERS_PER_NPC) {
    // Return a special "no work available" result
    return null;
  }

  // Find nearby structures
  const playerPos = playerPosition || { x: 0, y: 0 };
  const nearby = findStructuresInRadius(terrainStructures, playerPos, 50); // Within 50 tiles

  // Categorize structures for context-aware task generation
  const marketplaces: string[] = [];
  const ruins: string[] = [];
  const religious: string[] = [];
  const workshops: string[] = [];
  const other: string[] = [];

  nearby.forEach(s => {
    const loc = getStructureLocation(s);
    if (!loc) return;

    const distance = calculateDistance(playerPos, loc);
    const direction = getDirection(playerPos.x, playerPos.y, loc.x, loc.y);
    const locationStr = `${s.name || s.structureType} (${direction}, ${Math.round(distance)} tiles away)`;

    const type = (s.structureType || '').toLowerCase();
    const name = (s.name || '').toLowerCase();

    if (type.includes('market') || type.includes('bazaar') || name.includes('market')) {
      marketplaces.push(locationStr);
    } else if (type === 'ruins' || type.includes('ancient_ruin') || (name.includes('ruin') && type.includes('ancient'))) {
      // STRICT: Only actual ruins, not abandoned buildings
      ruins.push(locationStr);
    } else if (type.includes('temple') || type.includes('shrine') || type.includes('church') || type.includes('mosque') || type.includes('monastery') || name.includes('holy')) {
      religious.push(locationStr);
    } else if (type.includes('workshop') || type.includes('smithy') || type.includes('forge') || type.includes('mill')) {
      workshops.push(locationStr);
    } else {
      other.push(locationStr);
    }
  });

  // Build structured location context
  let structureContext = '';
  if (marketplaces.length > 0) {
    structureContext += '**MARKETPLACES** (good for buying goods):\n' + marketplaces.map(s => `- ${s}`).join('\n') + '\n\n';
  }
  if (ruins.length > 0) {
    structureContext += '**RUINS/ANCIENT SITES** (ONLY these are explorable for scholars):\n' + ruins.map(s => `- ${s}`).join('\n') + '\n\n';
  }
  if (religious.length > 0) {
    structureContext += '**RELIGIOUS SITES** (good for delivery/pilgrimage tasks):\n' + religious.map(s => `- ${s}`).join('\n') + '\n\n';
  }
  if (workshops.length > 0) {
    structureContext += '**WORKSHOPS/CRAFTERS** (good for delivery of materials):\n' + workshops.map(s => `- ${s}`).join('\n') + '\n\n';
  }
  if (other.length > 0) {
    structureContext += '**OTHER LOCATIONS** (NOT explorable - these are NOT ruins):\n' + other.map(s => `- ${s}`).join('\n');
  }

  // Add explicit warning if no ruins exist
  const hasRuins = ruins.length > 0;
  const ruinsWarning = !hasRuins
    ? '\n\n⚠️ **NO RUINS AVAILABLE** - Do NOT use "explore_location" taskType! Use "fetch_item" or "gather_resource" instead.\n'
    : '';

  // Build animal context for hunting quests
  let animalContext = '';
  if (nearbyAnimals && nearbyAnimals.length > 0) {
    // Count animal types
    const animalCounts: Record<string, number> = {};
    nearbyAnimals.forEach(animal => {
      const species = animal.speciesName || 'Unknown';
      animalCounts[species] = (animalCounts[species] || 0) + 1;
    });

    const animalList = Object.entries(animalCounts)
      .map(([species, count]) => `- ${count}x ${species}`)
      .join('\n');

    if (animalList) {
      animalContext = `\n**NEARBY ANIMALS** (available for hunting/collecting quests):\n${animalList}\n`;
    }
  }

  // Build player inventory context
  const inventoryItems = playerCharacter.inventory.map(item => item.name).join(', ');

  // Educational mode enhancement
  const educationalContext = (() => {
    // Check if educational mode is active
    if (!learningObjectivesService.isEducationalMode()) return '';

    const objectives = learningObjectivesService.getCurrentObjectives();
    const settings = learningObjectivesService.getSettings();

    if (!settings) return '';

    const hasHistoricalThinking = objectives.includes('historical-thinking');
    const hasCultural = objectives.includes('cultural-comparison');
    const hasPrimarySources = objectives.includes('primary-sources');

    return `
**🎓 EDUCATIONAL QUEST GENERATION**

You can offer ANALYTICAL QUESTS that require historical thinking:

**New Educational Quest Types:**

1. **investigate_and_report** - Historical Investigation
   - Ask player to visit location AND bring back detailed observations
   - Example: "Explore the ${ruins.length > 0 ? ruins[0].split('(')[0].trim() : 'ancient ruins'} and report what the architecture reveals about past civilizations. Note building materials, layout, decorative elements. Bring back ANY artifact you find. 40 coins for your research."
   - Use with ruins/ancient sites
   - requiredItem: NOT SPECIFIED (acceptsAnyItem: true via explore_location behavior)
   - historicalContext: Explain what we might learn from this investigation

2. **compare_perspectives** - Perspective Quest
   - Ask player to speak with NPCs from different social classes
   - Example: "I need you to ask both a peasant farmer AND a noble about the new tax policy. Return and tell me how their views differ. This will help me understand the full picture. 35 coins."
   - targetNpcs: ["peasant", "noble"] or ["merchant", "priest"] etc.
   - historicalContext: Explain why different perspectives matter

3. **debate_topic** - Debate Quest
   - Ask player to think about a historical issue, then discuss it
   - Example: "Think carefully about whether the king's war is justified. Consider the costs to common folk versus the potential benefits. When you return, we'll discuss your views. 30 coins for serious thought."
   - debateTopic: Specific historical question relevant to ${mapData.timeSlice} ${mapData.localArea}
   - historicalContext: Frame the historical debate

4. **source_analysis** - Primary Source Analysis
   - Ask player to find a document/artifact and analyze it
   - Example: "Find the old land deed in the monastery archives. Study it carefully - what does it tell us about property rights 100 years ago? Bring it here and we'll discuss. 45 coins."
   - requiredItem: Specific document name
   - historicalContext: What historical insights this source provides

**Enhanced Standard Quests:**
When creating fetch/delivery/exploration quests, EXPLAIN the historical significance:
❌ "Go to the ruins and bring me something"
✅ "The ruins were built during the ${parseInt(mapData.timeSlice) - 200}-${parseInt(mapData.timeSlice) - 100} period. Exploring them could reveal ${hasPrimarySources ? 'valuable primary sources about' : 'insights into'} trade networks and religious practices. Bring me any artifact - even a pottery shard can tell us about cultural exchange. 40 coins."

**Quest Dialogue Framing:**
- Frame ALL quests as intellectually engaging
- Explain WHY the task matters historically or socially
- Hint at what the player should observe or consider
- For debate quests, present multiple viewpoints

**Current Learning Objectives:** ${objectives.join(', ')}
${hasHistoricalThinking ? '- Emphasize cause-and-effect, historical context, analysis' : ''}
${hasCultural ? '- Highlight cultural differences, worldviews, comparative perspectives' : ''}
${hasPrimarySources ? '- Include document/artifact analysis tasks, source interpretation' : ''}

**IMPORTANT**: Mix educational and standard quests. Don't make EVERY quest educational - maybe 1 in 3 quests should be educational.
`;
  })();

  const prompt = `
You are ${npc.name}, a ${npc.profession || 'person'} in ${mapData.localArea || 'this area'}.
${educationalContext}

Your Details:
- Age: ${npc.age}
- Wealth: ${(npc as any).wealthLevel || 'moderate'}
- Profession: ${npc.profession}

Player Details:
- Name: ${playerCharacter.name}
- Has items: ${inventoryItems || 'nothing'}
- Reputation: ${playerCharacter.mapReputation || 50}/100

Nearby Locations:
${structureContext || '- No major structures nearby'}
${animalContext}${ruinsWarning}

TASK: The player is asking you for work. Create a SIMPLE, SINGLE-OBJECTIVE task that matches YOUR PROFESSION.

**CRITICAL: PROFESSION COMES FIRST, NOT LOCATION**

Your profession is **${npc.profession}**. Base your work request on what YOUR PROFESSION needs:

**CRAFTSMEN (Blacksmith, Potter, Weaver, Carpenter):**
- PRIMARY: Use "gather_resource" to request materials for your craft
  - Blacksmith → iron ore, coal, metal scraps
  - Potter → clay, glaze materials, firewood
  - Weaver → wool, flax, dyes
  - Carpenter → lumber, nails, wood planks
- SECONDARY: If workshops/markets nearby, use "deliver_to_location" or "buy_from_location"
- ❌ NEVER use "explore_location" unless you're a scholar/historian

**TANNERS (special case):**
- PRIMARY: If animals nearby, use "collect_animal_products" for hides/pelts
- SECONDARY: Use "gather_resource" for tanning bark, salt (processing materials)
- ❌ NEVER use "explore_location"

**MERCHANTS/TRADERS:**
- PRIMARY: Use "buy_from_location" if marketplace nearby
- FALLBACK: Use "fetch_item" for specific trade goods (silk, spices, etc.)
- ❌ NEVER use "explore_location" or "kill_animal"

**GUARDS/SOLDIERS:**
- PRIMARY: If animals nearby, use "kill_animal" or "collect_animal_products"
- FALLBACK: Use "fetch_item" for weapons, armor, supplies
- ❌ NEVER use "explore_location" unless you're investigating specific military threat

**FARMERS:**
- PRIMARY: Use "gather_resource" for crops, seeds, livestock needs
- SECONDARY: If animals are pests/threats, use "kill_animal"
- FALLBACK: Use "deliver_to_location" for produce to market
- ❌ NEVER use "explore_location"

**SCHOLARS/HISTORIANS/SCRIBES:**
- ✅ Can use "explore_location" ONLY IF you see "**RUINS/ANCIENT SITES**" heading above
- ✅ Can ONLY explore locations listed under that SPECIFIC heading
- ❌ CANNOT explore locations under "**OTHER LOCATIONS**" (those are NOT ruins!)
- ❌ "Abandoned Tower", "Derelict Site", "Old Building", "Abandoned Keep" are NOT ruins
- ❌ If you see "⚠️ NO RUINS AVAILABLE" above, use "fetch_item" instead
- Fallback: Use "fetch_item" for books, documents, scrolls, ancient texts

**PRIESTS/CLERGY:**
- PRIMARY: Use "deliver_to_location" for offerings to religious sites
- SECONDARY: Use "fetch_item" for sacred objects
- ❌ NEVER use "explore_location"

**NOBLES:**
- PRIMARY: If marketplace nearby, use "buy_from_location" for luxury goods
- FALLBACK: Use "fetch_item" for fine items
- ❌ NEVER use "explore_location" or "kill_animal"

**EXPLORATION QUESTS ARE EXTREMELY RARE:**
- ✅ ONLY scholars/historians can request exploration
- ✅ ONLY if the **RUINS/ANCIENT SITES** section exists above
- ❌ ABANDONED TOWERS are NOT ruins
- ❌ DERELICT SITES are NOT ruins
- ❌ OLD BUILDINGS are NOT ruins
- ❌ If you're not a scholar, DO NOT use "explore_location" under ANY circumstances

**FALLBACK WHEN NO IDEAL STRUCTURES:**
If there are no nearby structures matching your profession:
- Craftsmen → Request materials anyway (player can gather from wilderness)
- Merchants → Request specific trade goods (player will find them)
- Guards → Request weapons/armor maintenance items
- Farmers → Request seeds, tools, or crop protection
- Use "fetch_item" or "gather_resource", NOT "explore_location"

GOOD EXAMPLES:
✓ Blacksmith (no mine nearby): "Bring me 5 iron ore. I don't care where you get it, just bring it. 20 coins." (gather_resource, requiredItem: "Iron Ore")
✓ Merchant + Market: "Go to the marketplace and buy me 3 bolts of fine silk. I'll pay 25 coins." (buy_from_location)
✓ Guard + Animals: "Wolves have been attacking travelers. Hunt one down. 30 coins." (kill_animal)
✓ Tanner + Animals: "I need 3 deer hides for leather work. 25 coins." (collect_animal_products)
✓ Scholar + ACTUAL RUINS: "Investigate the ancient temple ruins and bring me artifacts. 40 coins." (explore_location)
✓ Farmer (no structures): "Gather 10 bundles of wheat for me. 15 coins." (gather_resource)
✓ Potter (no workshop): "I need 8 clay deposits for my kiln. Find them and I'll pay 18 coins." (gather_resource)

BAD EXAMPLES (DO NOT DO THESE):
✗ Scholar: "Explore the Abandoned Keep" (Abandoned Keep is under OTHER LOCATIONS, not RUINS!)
✗ Scholar: "Investigate the Derelict Site" (Derelict sites are NOT ruins!)
✗ Scholar when no RUINS section exists: Using "explore_location" (NO RUINS = NO EXPLORATION!)
✗ Blacksmith: "Explore the abandoned tower" (not a scholar, shouldn't explore)
✗ Potter: "Investigate the old site" (not a scholar, shouldn't explore)
✗ Farmer: "Explore the derelict building" (not a scholar, shouldn't explore)
✗ Guard: "Go to the ruins" (not a scholar, should hunt animals or fetch supplies)
✗ Merchant: "Hunt wolves" (merchants don't hire for hunting)
✗ Tanner with no animals: "Gather tanning bark" (should use collect_animal_products if animals exist)
✗ Any NPC + structure under "OTHER LOCATIONS": Using "explore_location" (OTHER ≠ RUINS!)

Create the work offer now. Remember: PROFESSION FIRST, then match to nearby locations if helpful. Most NPCs should use gather_resource or fetch_item, NOT explore_location!
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workOfferSchema
      }
    });

    let text = response.text.trim();

    // Remove code fences if present
    const fenceRegex = /^```(\w*)?\s*\n?([\s\S]*?)\n?\s*```$/;
    const match = text.match(fenceRegex);
    if (match && match[2]) {
      text = match[2].trim();
    }

    const data = JSON.parse(text);

    if (!data.hasWork) {
      return null;
    }

    // Find the target location if specified
    let targetLocation: WorkOffer['targetLocation'] | undefined;
    if (data.targetLocationName && nearby.length > 0) {
      const targetStructure = nearby.find(s =>
        s.name?.toLowerCase().includes(data.targetLocationName.toLowerCase()) ||
        s.structureType?.toLowerCase().includes(data.targetLocationName.toLowerCase())
      );

      if (targetStructure) {
        const loc = getStructureLocation(targetStructure);
        if (loc) {
          targetLocation = {
            x: loc.x,
            y: loc.y,
            name: data.targetLocationName,
            radius: 5 // Must be within 5 tiles
          };
        }
      }
    }

    // Create work offer
    const taskType = data.taskType as WorkTaskType;
    const offer: WorkOffer = {
      id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      npcId: npc.id,
      npcName: npc.name,
      npcLocation: {
        x: npc.x,
        y: npc.y,
        mapSeed: mapData.seed.toString()
      },
      taskType,
      description: data.description,
      requiredItem: data.requiredItem,
      requiredQuantity: data.requiredQuantity || 1,
      targetLocation,
      targetAnimal: data.targetAnimal,
      acceptsAnyItem: taskType === 'explore_location' || taskType === 'investigate_and_report', // Exploration/investigation quests accept any item
      payment: Math.max(5, Math.min(50, data.payment || 10)),
      deadline: data.deadlineHours ? data.deadlineHours : undefined,
      offerTime: gameTimeHours,
      accepted: false,
      completed: false,
      failed: false,
      // Educational quest fields
      requiresDialogue: taskType === 'debate_topic' || taskType === 'investigate_and_report' || taskType === 'source_analysis',
      debateTopic: data.debateTopic,
      targetNpcs: data.targetNpcs,
      requiresAnalysis: taskType === 'source_analysis',
      historicalContext: data.historicalContext,
      conversationCount: 0
    };

    return offer;

  } catch (error) {
    console.error('Error generating work offer:', error);
    return null;
  }
}

/**
 * Check if a work offer has been completed
 */
export function checkWorkCompletion(
  offer: WorkOffer,
  playerCharacter: PlayerCharacter,
  playerLocation: { x: number; y: number },
  currentGameHours: number,
  questGiverNpc?: any // Optional NPC for conversation tracking
): 'completed' | 'in_progress' | 'failed' {
  // Check deadline first
  if (offer.deadline && (currentGameHours - offer.offerTime) > offer.deadline) {
    return 'failed';
  }

  switch (offer.taskType) {
    case 'fetch_item':
    case 'buy_from_location':
      // Check if player has required item in inventory
      const hasItem = playerCharacter.inventory.some(item =>
        item.name.toLowerCase() === offer.requiredItem?.toLowerCase() &&
        item.quantity >= (offer.requiredQuantity || 1)
      );
      return hasItem ? 'completed' : 'in_progress';

    case 'deliver_to_location':
      // Check if player is at target location AND has required item
      if (offer.targetLocation) {
        const distance = calculateDistance(playerLocation, offer.targetLocation);
        const atLocation = distance <= offer.targetLocation.radius;

        // If delivery requires an item, verify player has it
        const hasItem = offer.requiredItem
          ? playerCharacter.inventory.some(item =>
              item.name.toLowerCase() === offer.requiredItem?.toLowerCase() &&
              item.quantity >= (offer.requiredQuantity || 1)
            )
          : true; // No item required, just need to reach location

        return (atLocation && hasItem) ? 'completed' : 'in_progress';
      }
      return 'in_progress';

    case 'gather_resource':
      // Similar to fetch_item
      const hasResource = playerCharacter.inventory.some(item =>
        item.name.toLowerCase().includes(offer.requiredItem?.toLowerCase() || '') &&
        item.quantity >= (offer.requiredQuantity || 1)
      );
      return hasResource ? 'completed' : 'in_progress';

    case 'kill_animal':
      // Check if the target animal was killed (tracked in localStorage)
      if (offer.targetAnimal) {
        return wasAnimalKilled(offer.id, offer.targetAnimal) ? 'completed' : 'in_progress';
      }
      return 'in_progress';

    case 'collect_animal_products':
      // Check if player has required animal products (pelts, hides, etc.)
      const hasProducts = playerCharacter.inventory.some(item =>
        item.name.toLowerCase() === offer.requiredItem?.toLowerCase() &&
        item.quantity >= (offer.requiredQuantity || 1)
      );
      return hasProducts ? 'completed' : 'in_progress';

    case 'explore_location':
      // For exploration quests, player needs to visit the location AND have items to bring back
      if (offer.targetLocation) {
        const distance = calculateDistance(playerLocation, offer.targetLocation);
        const atLocation = distance <= offer.targetLocation.radius;
        const hasItems = playerCharacter.inventory && playerCharacter.inventory.length > 0;

        return (atLocation && hasItems) ? 'completed' : 'in_progress';
      }
      // Fallback if no target location specified
      return playerCharacter.inventory && playerCharacter.inventory.length > 0
        ? 'completed'
        : 'in_progress';

    // NEW EDUCATIONAL QUEST TYPES:
    case 'investigate_and_report':
      // Requires visiting location, having an item, AND having talked to the NPC about it
      if (offer.targetLocation) {
        const distance = calculateDistance(playerLocation, offer.targetLocation);
        const atLocation = distance <= offer.targetLocation.radius;
        const hasItemForReport = playerCharacter.inventory && playerCharacter.inventory.length > 0;

        // Use NPC's actual conversation count from memory (not the offer's outdated count)
        const conversationCount = questGiverNpc?.memory?.conversationCount || offer.conversationCount || 0;
        const hasDiscussedFindings = conversationCount >= 2; // At least 2 dialogue exchanges

        return (atLocation && hasItemForReport && hasDiscussedFindings) ? 'completed' : 'in_progress';
      }
      // Fallback if no target location
      const hasItemForReport = playerCharacter.inventory && playerCharacter.inventory.length > 0;
      const conversationCountFallback = questGiverNpc?.memory?.conversationCount || offer.conversationCount || 0;
      const hasDiscussedFindings = conversationCountFallback >= 2;
      return (hasItemForReport && hasDiscussedFindings) ? 'completed' : 'in_progress';

    case 'debate_topic':
      // Requires meaningful dialogue with the quest giver about the topic
      // Use NPC's actual conversation count from memory
      const debateConversations = questGiverNpc?.memory?.conversationCount || offer.conversationCount || 0;
      const debateTopicDiscussed = questGiverNpc?.memory?.topicsDiscussed?.has('politics') ||
                                    questGiverNpc?.memory?.topicsDiscussed?.has('war') ||
                                    questGiverNpc?.memory?.topicsDiscussed?.has('religion') ||
                                    debateConversations >= 3; // Fallback to count
      const hasDebated = debateConversations >= 2 && debateTopicDiscussed;
      return hasDebated ? 'completed' : 'in_progress';

    case 'compare_perspectives':
      // Check if player has talked to the quest giver to report findings
      // Use NPC's actual conversation count from memory
      const perspectiveConversations = questGiverNpc?.memory?.conversationCount || offer.conversationCount || 0;
      const hasGatheredPerspectives = perspectiveConversations >= 2;
      return hasGatheredPerspectives ? 'completed' : 'in_progress';

    case 'source_analysis':
      // Requires having the document AND discussing it with quest giver
      const hasDocument = offer.requiredItem && playerCharacter.inventory.some(
        item => item.name.toLowerCase() === offer.requiredItem?.toLowerCase()
      );
      // Use NPC's actual conversation count from memory
      const analysisConversations = questGiverNpc?.memory?.conversationCount || offer.conversationCount || 0;
      const hasAnalyzed = analysisConversations >= 2;
      return (hasDocument && hasAnalyzed) ? 'completed' : 'in_progress';

    default:
      return 'in_progress';
  }
}

/**
 * Complete a work offer and pay the player
 */
export function completeWorkOffer(
  offer: WorkOffer,
  playerCharacter: PlayerCharacter,
  updateInventory?: (newInventory: any[]) => void
): { success: boolean; message: string; coinsEarned: number; itemTaken?: string } {
  let itemTaken: string | undefined;

  // Handle exploration quests - take any one item from inventory
  if (offer.taskType === 'explore_location' && updateInventory && playerCharacter.inventory) {
    if (playerCharacter.inventory.length === 0) {
      return {
        success: false,
        message: "You need to bring back something from your exploration!",
        coinsEarned: 0
      };
    }

    // Take the most recent (last) item from inventory - more likely to be from the quest location
    const lastItem = playerCharacter.inventory[playerCharacter.inventory.length - 1];
    itemTaken = lastItem.name;

    const result = removeItemFromInventory(
      playerCharacter.inventory,
      lastItem.name,
      1
    );

    updateInventory(result.inventory);

    console.log(
      `[WORK] Exploration quest completed. Removed 1x ${lastItem.name} from inventory. ` +
      `New inventory size: ${result.inventory.length}`
    );

    return {
      success: true,
      message: `Fascinating! This ${lastItem.name} will be very useful. Thank you for exploring!`,
      coinsEarned: offer.payment,
      itemTaken: lastItem.name
    };
  }

  // Handle educational quest types
  if (offer.taskType === 'investigate_and_report' && updateInventory && playerCharacter.inventory) {
    // Similar to explore_location, take the most recent item
    if (playerCharacter.inventory.length === 0) {
      return {
        success: false,
        message: "You need to bring back evidence from your investigation!",
        coinsEarned: 0
      };
    }

    const lastItem = playerCharacter.inventory[playerCharacter.inventory.length - 1];
    itemTaken = lastItem.name;

    const result = removeItemFromInventory(
      playerCharacter.inventory,
      lastItem.name,
      1
    );

    updateInventory(result.inventory);

    return {
      success: true,
      message: `Excellent analysis! Your insights about this ${lastItem.name} are valuable. Here's your payment.`,
      coinsEarned: offer.payment,
      itemTaken: lastItem.name
    };
  }

  if (offer.taskType === 'debate_topic') {
    // No items required, completion based on dialogue
    return {
      success: true,
      message: `Your thoughtful analysis of ${offer.debateTopic || 'this issue'} demonstrates strong historical understanding. Well done!`,
      coinsEarned: offer.payment
    };
  }

  if (offer.taskType === 'compare_perspectives') {
    // No items required, completion based on gathering perspectives
    return {
      success: true,
      message: `Thank you for gathering those different perspectives. Your report helps me understand the complexity of the situation.`,
      coinsEarned: offer.payment
    };
  }

  if (offer.taskType === 'source_analysis' && updateInventory && playerCharacter.inventory) {
    // Source analysis requires specific document
    if (offer.requiredItem) {
      const result = removeItemFromInventory(
        playerCharacter.inventory,
        offer.requiredItem,
        1
      );

      updateInventory(result.inventory);

      return {
        success: true,
        message: `Your analysis of the ${offer.requiredItem} was insightful. You've demonstrated strong primary source interpretation skills.`,
        coinsEarned: offer.payment,
        itemTaken: offer.requiredItem
      };
    }
  }

  // Remove required items if applicable (for standard quests)
  if (offer.requiredItem && updateInventory && playerCharacter.inventory) {
    // Use the new removeItemFromInventory utility that properly handles quantities
    const result = removeItemFromInventory(
      playerCharacter.inventory,
      offer.requiredItem,
      offer.requiredQuantity || 1
    );

    // Update inventory with the new array
    updateInventory(result.inventory);

    console.log(
      `[WORK] Removed ${offer.requiredQuantity || 1}x ${offer.requiredItem}. ` +
      `Items completely removed: ${result.removedIds.length}, ` +
      `New inventory size: ${result.inventory.length}`
    );
  }

  // Payment is handled by caller (adding to character.money)
  // We just return the amount

  return {
    success: true,
    message: `Thank you for completing the task! Here's your payment.`,
    coinsEarned: offer.payment
  };
}

/**
 * Make a partial delivery of items toward a work offer
 * Returns updated offer and whether it's now complete
 */
export function deliverItemsToWorkOffer(
  offer: WorkOffer,
  playerCharacter: PlayerCharacter,
  quantityToDeliver: number,
  updateInventory?: (newInventory: any[]) => void
): { success: boolean; message: string; updatedOffer: WorkOffer; isComplete: boolean } {
  if (!offer.requiredItem) {
    return {
      success: false,
      message: 'This work doesn\'t require items.',
      updatedOffer: offer,
      isComplete: false
    };
  }

  // Check how many the player has
  const playerHas = playerCharacter.inventory?.filter(
    item => item.name.toLowerCase() === offer.requiredItem?.toLowerCase()
  ).reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  if (playerHas < quantityToDeliver) {
    return {
      success: false,
      message: `You don't have ${quantityToDeliver} ${offer.requiredItem}.`,
      updatedOffer: offer,
      isComplete: false
    };
  }

  // Remove items from inventory
  if (updateInventory && playerCharacter.inventory) {
    const result = removeItemFromInventory(
      playerCharacter.inventory,
      offer.requiredItem,
      quantityToDeliver
    );
    updateInventory(result.inventory);
  }

  // Update delivered quantity
  const previouslyDelivered = offer.deliveredQuantity || 0;
  const newDeliveredQuantity = previouslyDelivered + quantityToDeliver;
  const requiredTotal = offer.requiredQuantity || 1;

  const updatedOffer: WorkOffer = {
    ...offer,
    deliveredQuantity: newDeliveredQuantity,
    completed: newDeliveredQuantity >= requiredTotal
  };

  const remaining = requiredTotal - newDeliveredQuantity;
  const isComplete = updatedOffer.completed;

  console.log(
    `[WORK] Delivered ${quantityToDeliver}x ${offer.requiredItem}. ` +
    `Total: ${newDeliveredQuantity}/${requiredTotal}. Complete: ${isComplete}`
  );

  return {
    success: true,
    message: isComplete
      ? `Perfect! That's all ${requiredTotal} ${offer.requiredItem}. The work is complete!`
      : `Thank you. I've received ${quantityToDeliver} ${offer.requiredItem}. I still need ${remaining} more.`,
    updatedOffer,
    isComplete
  };
}

/**
 * Calculate if NPC should proactively offer work in their greeting
 * Uses existing game data to add context hints without additional LLM calls
 */
export function calculateProactiveWorkContext(
  npc: NpcEntity,
  mapData: MapData | null,
  nearbyAnimals: AnimalEntity[],
  nearbyStructures: TerrainStructure[]
): { shouldOffer: boolean; contextHint: string; probability: number } {

  if (!mapData) {
    return { shouldOffer: false, contextHint: "", probability: 0 };
  }

  // Fast checks using existing data
  const dangerousAnimals = nearbyAnimals.filter(a =>
    ['Wolf', 'Bear', 'Tiger', 'Lion', 'Leopard', 'Hyena'].includes(a.speciesName || '')
  );

  const hasRuinsNearby = nearbyStructures.some(s =>
    (s.structureType || '').toLowerCase().includes('ruin') ||
    (s.name || '').toLowerCase().includes('ruin') ||
    (s.structureType || '').toLowerCase().includes('ancient')
  );

  const hasMarketNearby = nearbyStructures.some(s =>
    (s.structureType || '').toLowerCase().includes('market') ||
    (s.structureType || '').toLowerCase().includes('bazaar')
  );

  // Use existing personality traits
  const personality = npc.personality;
  const isBusinesslike = (personality.extraversion > 60 && personality.conscientiousness > 50);
  const isFriendly = personality.agreeableness > 60;
  const profession = (npc.profession || '').toLowerCase();

  // Check profession types
  const isGuard = profession.includes('guard') || profession.includes('soldier');
  const isScholar = profession.includes('scholar') || profession.includes('scribe') || profession.includes('priest');
  const isMerchant = profession.includes('merchant') || profession.includes('trader');
  const isCraftsman = profession.includes('smith') || profession.includes('tanner') ||
                      profession.includes('weaver') || profession.includes('potter');

  let probability = 0;
  let contextHint = "";

  // URGENT: Dangerous animals + Guard/Soldier
  if (dangerousAnimals.length > 0 && isGuard) {
    probability = 80;
    contextHint = "[You notice they look worried, glancing nervously toward the wilderness where dangerous animals have been spotted]";
    return { shouldOffer: true, contextHint, probability };
  }

  // URGENT: Dangerous animals + any NPC if many animals
  if (dangerousAnimals.length >= 3) {
    probability = 60;
    contextHint = "[They seem distressed, clearly troubled by the dangerous wildlife in the area]";
    return { shouldOffer: true, contextHint, probability };
  }

  // OPPORTUNISTIC: Ruins + Scholar
  if (hasRuinsNearby && isScholar) {
    probability = 55;
    contextHint = "[They seem eager to discuss something, their eyes occasionally drifting toward the ancient ruins nearby]";
    return { shouldOffer: true, contextHint, probability };
  }

  // BUSINESSLIKE: Merchant + Market nearby
  if (hasMarketNearby && isMerchant) {
    probability = 45;
    contextHint = "[They size you up with a practiced, businesslike eye]";
    return { shouldOffer: true, contextHint, probability };
  }

  // PRACTICAL: Craftsman sees potential work
  if (isCraftsman && nearbyAnimals.length > 0) {
    probability = 40;
    contextHint = "[They glance at you with professional interest, as if assessing your capabilities]";
    return { shouldOffer: true, contextHint, probability };
  }

  // GENERAL: Very businesslike personality
  if (isBusinesslike && !isFriendly) {
    probability = 30;
    contextHint = "[They regard you with a direct, no-nonsense gaze]";
    return { shouldOffer: true, contextHint, probability };
  }

  // FRIENDLY: High agreeableness, might ask for help casually
  if (isFriendly && personality.extraversion > 50) {
    probability = 25;
    contextHint = "[They seem friendly and open, as if they've been hoping to talk to someone]";
    return { shouldOffer: true, contextHint, probability };
  }

  // No proactive offer
  return { shouldOffer: false, contextHint: "", probability: 0 };
}
