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
      description: "Generic description of items needed (e.g. 'medicinal herbs', 'metal ore', 'building materials', 'food supplies'). Be generic, not specific - players bring ANY matching item."
    },
    requiredQuantity: {
      type: Type.NUMBER,
      description: "How many of the item needed (default 1)"
    },
    acceptedCategories: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Item categories accepted: 'ore' (any metal ore), 'wood' (any wood), 'stone', 'hide' (animal hides), 'herb' (medicinal plants), 'food', 'cloth', 'tool', 'weapon'. Use broad categories!"
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
 * Check if NPC is willing to offer work based on reputation and conversation context
 * Returns { willing: boolean, reason?: string }
 */
export function checkWorkOfferWillingness(
  npc: NpcEntity,
  conversationHistory?: Array<{ speaker: string; text: string }>,
  playerReputation?: number
): { willing: boolean; reason?: string; paymentModifier?: number } {
  // Get NPC's opinion of player (default to player reputation or neutral)
  const opinion = npc.memory?.opinionOfPlayer ?? playerReputation ?? 50;

  // Very low opinion = refuse work
  if (opinion < 20) {
    return {
      willing: false,
      reason: "I don't trust you enough to give you work. Perhaps you should reconsider how you treat people."
    };
  }

  // Check for hostile flags in memory
  const knownFacts = npc.memory?.knownFactsAboutPlayer
    ? Array.from(npc.memory.knownFactsAboutPlayer)
    : [];

  const wasAttacked = knownFacts.some(f => f.includes('ATTACKED'));
  const wasThreatened = knownFacts.some(f => f.includes('THREATENED'));
  const wasRobbed = knownFacts.some(f => f.includes('STOLE') || f.includes('THEFT'));

  if (wasAttacked) {
    return {
      willing: false,
      reason: "After what you did to me? I would never give you work. Leave me alone."
    };
  }

  if (wasRobbed) {
    return {
      willing: false,
      reason: "You stole from me! Why would I ever trust you with a task?"
    };
  }

  if (wasThreatened && opinion < 40) {
    return {
      willing: false,
      reason: "You threatened me before. I have no interest in dealing with you."
    };
  }

  // Check recent conversation for red flags
  if (conversationHistory && conversationHistory.length > 0) {
    const recentPlayerMessages = conversationHistory
      .filter(h => h.speaker === 'player')
      .slice(-5) // Last 5 player messages
      .map(h => h.text.toLowerCase())
      .join(' ');

    // Check for bizarre/threatening/offensive content
    const redFlagPatterns = [
      /vampire/i, /demon/i, /kill you/i, /murder/i, /die/i,
      /hate you/i, /stupid/i, /idiot/i, /fool/i, /ugly/i,
      /threat/i, /curse/i, /damn you/i, /shut up/i,
      /rob you/i, /steal/i, /attack/i
    ];

    const hasRedFlags = redFlagPatterns.some(pattern => pattern.test(recentPlayerMessages));

    if (hasRedFlags) {
      return {
        willing: false,
        reason: "Given what you've been saying, I don't think I want to do business with you."
      };
    }

    // Check for generally unfriendly conversation tone
    const unfriendlyPatterns = [
      /don't care/i, /whatever/i, /leave me/i, /go away/i,
      /not interested/i, /waste.*time/i, /boring/i
    ];

    const isUnfriendly = unfriendlyPatterns.some(pattern => pattern.test(recentPlayerMessages));

    if (isUnfriendly && opinion < 50) {
      return {
        willing: false,
        reason: "You don't seem very interested in talking, so I won't bother offering work."
      };
    }
  }

  // Willing to offer work, but adjust payment based on opinion
  let paymentModifier = 1.0;
  if (opinion >= 70) {
    paymentModifier = 1.2; // Better pay for trusted workers
  } else if (opinion < 35) {
    paymentModifier = 0.8; // Lower pay for those they don't fully trust
  }

  return { willing: true, paymentModifier };
}

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
  nearbyAnimals?: AnimalEntity[],
  conversationHistory?: Array<{ speaker: string; text: string }>
): Promise<WorkOffer | null> {
  if (!mapData) return null;

  // Check if NPC is willing to offer work based on relationship/conversation
  const willingness = checkWorkOfferWillingness(npc, conversationHistory, playerCharacter.mapReputation);
  if (!willingness.willing) {
    // Return null - the caller should handle the rejection reason separately
    return null;
  }

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

  // Determine historical era and appropriate materials
  const year = parseInt(mapData.timeSlice || '1500');
  let eraContext = '';
  let materialExamples = '';

  if (year < -3000) {
    eraContext = 'PREHISTORY (Stone Age)';
    materialExamples = 'obsidian, flint, bone tools, animal hides, plant fibers, natural dyes, stone, wood, shells, antler';
  } else if (year < 500) {
    eraContext = 'ANTIQUITY (Ancient Era)';
    materialExamples = 'bronze, copper, iron, clay, wool, linen, papyrus, marble, wood, leather, simple glass';
  } else if (year < 1500) {
    eraContext = 'MEDIEVAL';
    materialExamples = 'iron, steel, wool, leather, parchment, timber, stone, pottery, simple textiles, basic metals';
  } else if (year < 1800) {
    eraContext = 'EARLY MODERN/RENAISSANCE';
    materialExamples = 'steel, fine textiles, paper, gunpowder, complex metalwork, porcelain, spices, books';
  } else if (year < 1920) {
    eraContext = 'INDUSTRIAL ERA';
    materialExamples = 'machine-made goods, coal, steam power, mass-produced textiles, factory products, precision tools';
  } else {
    eraContext = 'MODERN ERA';
    materialExamples = 'industrial products, synthetic materials, electronics, mass-manufactured goods';
  }

  const prompt = `
You are ${npc.name}, a ${npc.profession || 'person'} in ${mapData.localArea || 'this area'}.
${educationalContext}

Your Details:
- Age: ${npc.age}
- Wealth: ${(npc as any).wealthLevel || 'moderate'}
- Profession: ${npc.profession}

**HISTORICAL ERA: ${eraContext} (Year ${year})**
**ERA-APPROPRIATE MATERIALS:** ${materialExamples}

⚠️ **CRITICAL: Use ONLY materials appropriate to ${eraContext}!**
- If you need tools/materials, request items from the list above
- NO anachronistic items (no "fine chisels" in Stone Age, no "gunpowder" in Antiquity, etc.)
- Match your requests to what would ACTUALLY exist in year ${year}

Player Details:
- Name: ${playerCharacter.name}
- Has items: ${inventoryItems || 'nothing'}
- Reputation: ${playerCharacter.mapReputation || 50}/100

Nearby Locations:
${structureContext || '- No major structures nearby'}
${animalContext}${ruinsWarning}

TASK: The player is asking you for work. Create a SIMPLE, SINGLE-OBJECTIVE task that matches YOUR PROFESSION and uses ERA-APPROPRIATE materials from ${eraContext}.

**CRITICAL RESTRICTIONS ON fetch_item:**
fetch_item is a FALLBACK task type that should rarely be used. Most professions have better options:
- ❌ Merchants CANNOT use fetch_item if marketplace nearby (use buy_from_location instead)
- ❌ Scholars CANNOT EVER use fetch_item (use investigate_and_report or explore_location)
- ❌ Scribes CANNOT EVER use fetch_item (use source_analysis or investigate_and_report)
- ❌ Guards CANNOT use fetch_item for weapons/shields (use gather_resource or kill_animal)
- ❌ Craftsmen should prefer gather_resource over fetch_item
- ✅ ONLY use fetch_item if absolutely NO other task type fits

**MANDATORY STRUCTURE MATCHING:**
If you see a structure type below that matches your profession, you MUST use it (not optional):
- Merchant + **MARKETPLACE** nearby → MUST use buy_from_location
- Priest + **RELIGIOUS SITE** nearby → MUST use deliver_to_location
- Crafter + **WORKSHOP** nearby → MUST use deliver_to_location
- Scholar + **RUINS** nearby → MUST use explore_location
Ignoring nearby appropriate structures is WRONG!

**CRITICAL RULES:**
1. **PROFESSION COMES FIRST, NOT LOCATION**
2. **USE GENERIC ITEM DESCRIPTIONS** - Request categories, not specific items!
   - ❌ BAD: "Bring me feverfew" (doesn't exist in game!)
   - ✅ GOOD: "Bring me medicinal herbs" (accepts ANY herb)
   - ❌ BAD: "I need serpent's tongue" (doesn't exist!)
   - ✅ GOOD: "I need healing plants" (accepts ANY medicine)
3. **SET acceptedCategories** - Use broad categories: 'ore', 'wood', 'stone', 'hide', 'herb', 'food', 'cloth', 'tool', 'weapon', 'metal', 'medicine'

Your profession is **${npc.profession}**. Base your work request on what YOUR PROFESSION needs:

**CRAFTSMEN (Blacksmith, Potter, Weaver, Carpenter, Toolmaker):**
- PRIMARY: Use "gather_resource" to request materials **SPECIFIC TO YOUR CRAFT**
  - PREHISTORY Toolmaker → flint, obsidian, bone, antler, stone
  - PREHISTORY Weaver → plant fibers, animal sinew, natural dyes
  - ANTIQUITY Potter → clay, natural glazes, firewood
  - ANTIQUITY Jeweler → gemstones, precious metals, polishing materials (NOT clay!)
  - MEDIEVAL Blacksmith → iron ore, coal, charcoal
  - RENAISSANCE Weaver → wool, silk, fine dyes, cotton
  - INDUSTRIAL Carpenter → machine-cut lumber, nails, precision tools
- **⚠️ AVOID REPETITION**: If you're a Jeweler, request gems/metals (not clay). If you're a Miller, request grain (not clay). Request materials YOU actually use!
- SECONDARY: If workshops/markets nearby, use "deliver_to_location" or "buy_from_location"
- ❌ NEVER use "explore_location" unless you're a scholar/historian
- ❌ NEVER request anachronistic materials!

**TANNERS (special case):**
- PRIMARY: If animals nearby, use "collect_animal_products" for hides/pelts
- SECONDARY: Use "gather_resource" for tanning bark, salt (processing materials)
- ❌ NEVER use "explore_location"

**MERCHANTS/TRADERS:**
- If **MARKETPLACE** is listed above → MUST use "buy_from_location" (REQUIRED!)
- If no marketplace → Use "deliver_to_location" to bring goods to a location
- LAST RESORT: If no structures at all → Use "gather_resource" for trade goods
- ❌ NEVER use "fetch_item" if marketplace exists
- ❌ NEVER use "explore_location" or "kill_animal"

**GUARDS/SOLDIERS:**
- If animals nearby → Use "kill_animal" (hunt dangerous animals)
- If NO animals → Use "investigate_and_report" (patrol routes, check safety, report bandits)
- ALTERNATE: Use "gather_resource" for weapon maintenance (whetstones, oil, leather straps)
- ❌ NEVER use "fetch_item" to get weapons/shields/armor (guards don't work that way!)
- ❌ NEVER use "explore_location" unless investigating ruins for military purposes

**FARMERS (including Bakers, Millers, Brewers):**
- PRIMARY: Use "gather_resource" for crops, seeds, grain, wheat, barley
- Bakers → Request wheat, flour, yeast, salt (NOT clay!)
- Millers → Request grain, wheat to mill (NOT clay!)
- Brewers/Tavern Keepers → Request barley, hops, yeast (NOT clay!)
- SECONDARY: If animals are pests/threats, use "kill_animal"
- FALLBACK: Use "deliver_to_location" for produce to market
- ❌ NEVER use "explore_location"

**SCHOLARS/HISTORIANS:**
You are an EDUCATIONAL profession. Your quests MUST involve intellectual work:
- If **RUINS/ANCIENT SITES** section exists above → MUST use "explore_location" (examine ruins, study artifacts)
- ✅ Can ONLY explore locations under "**RUINS/ANCIENT SITES**" heading
- ❌ CANNOT explore "**OTHER LOCATIONS**" (Abandoned Tower, Derelict Site, Old Building are NOT ruins!)
- If NO ruins → MUST use "investigate_and_report" (study local customs, beliefs, trade patterns, social structures)
- ALTERNATE: Use "compare_perspectives" (interview different social classes about an issue)
- ❌ NEVER EVER use "fetch_item" or "gather_resource" - you're a scholar, not a laborer!

**SCRIBES:**
You are an EDUCATIONAL profession specializing in documents and records:
- PRIMARY: Use "source_analysis" (analyze ancient inscriptions, legal documents, merchant records)
- SECONDARY: Use "investigate_and_report" (record oral histories, document local events)
- TERTIARY: Use "compare_perspectives" (gather different accounts of historical events)
- ❌ NEVER EVER use "fetch_item" or "gather_resource" - you analyze sources, you don't fetch papyrus!

**PRIESTS/CLERGY:**
- If **RELIGIOUS SITE** listed above → MUST use "deliver_to_location" (bring offerings/sacred items to temple)
- If NO religious site nearby → Can use "fetch_item" for sacred objects (incense, amulets, etc.)
- ❌ NEVER use "explore_location"

**NOBLES:**
- PRIMARY: If marketplace nearby, use "buy_from_location" for luxury goods
- FALLBACK: Use "fetch_item" for fine items
- ❌ NEVER use "explore_location" or "kill_animal"

**SERVICE WORKERS (Bathhouse Attendants, Servants, Slaves, etc.):**
- Request materials **YOU actually use in your job**:
  - Bathhouse Attendant → olive oil, soap, clean water, towels (NOT clay!)
  - Servant/Slave → cleaning supplies, water, firewood
  - Architect → building materials (stone, brick, mortar)
- ❌ Don't request random materials like clay unless you actually use it

**IF YOUR PROFESSION IS NOT LISTED ABOVE:**
Look at what your profession actually does and choose the appropriate task type:
- If you make/craft things (Flintknapper, Hide Worker, Basket Weaver, etc.) → Use "gather_resource" for **YOUR SPECIFIC materials**
- If you hunt/fish/gather food (Deer Hunter, Fisher, Berry Gatherer, etc.) → Use "kill_animal" or "collect_animal_products"
- If you heal/perform rituals (Medicine Person, Shaman, Healer, etc.) → Use "fetch_item" for herbs/sacred items
- If you grow/process food (any type of Farmer, Baker, Miller) → Use "gather_resource" for crops/grain (NOT clay!)
- **⚠️ Think about what YOU actually need for YOUR job** - don't just request clay/wood by default
- When in doubt → Use "gather_resource" for materials specific to your profession

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

GOOD EXAMPLES (generic requests with categories):
✓ Toolmaker (PREHISTORY): "I need stone for making tools. Any hard stone will do. Bring me 5 pieces. 15 coins."
   requiredItem: "stone for tools", acceptedCategories: ["stone"]
✓ Hunter (PREHISTORY): "Bring me animal hides for our shelter. 3 hides. 20 coins."
   requiredItem: "animal hides", acceptedCategories: ["hide", "pelt"]
✓ Blacksmith (MEDIEVAL): "I need metal ore for forging. Bring me 5 pieces. 20 coins."
   requiredItem: "metal ore", acceptedCategories: ["ore", "metal"]
✓ Healer (ANTIQUITY): "I'm treating a fever patient. Bring me any medicinal herbs you can find. 3 bundles. 25 coins."
   requiredItem: "medicinal herbs", acceptedCategories: ["herb", "medicine"]
✓ Builder (ANTIQUITY): "I'm building a house. I need construction materials - wood and stone. Bring me 10 units. 30 coins."
   requiredItem: "building materials", acceptedCategories: ["wood", "stone"]
✓ Weaver (PREHISTORY): "I need fibers for weaving. Plant fibers, cloth scraps, anything I can weave with. 10 bundles. 12 coins."
   requiredItem: "weaving materials", acceptedCategories: ["cloth", "fiber"]
✓ Guard + Animals: "Wolves have been attacking travelers. Hunt one down. 30 coins." (kill_animal)
✓ Scholar + ACTUAL RUINS: "Investigate the ancient temple ruins and bring back any artifacts. 40 coins." (explore_location)
✓ Scribe: "Analyze the merchant guild records and tell me about trade patterns. 35 coins." (source_analysis)

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
✗ Healer: "Bring me feverfew" requiredItem: "feverfew" (WRONG - feverfew doesn't exist! Use generic "medicinal herbs" + acceptedCategories: ["herb"])
✗ Healer: "I need serpent's tongue" requiredItem: "serpent's tongue" (WRONG - doesn't exist! Use "healing plants" + ["medicine"])
✗ Blacksmith: "Bring me Damascus steel" requiredItem: "Damascus steel" (WRONG - too specific! Use "metal ore" + ["ore", "metal"])
✗ Builder: "I need mahogany planks" requiredItem: "mahogany planks" (WRONG - too specific! Use "wood" + ["wood"])
✗ Jeweler: "Bring me rubies" requiredItem: "rubies" (WRONG - too specific! Use "gemstones" + ["stone", "metal"])
✗ ANY NPC: Requesting specific item names instead of categories!
✗ ANY NPC: Not setting acceptedCategories field!
✗ Merchant + Marketplace: Using "fetch_item" (WRONG - use buy_from_location!)
✗ Scholar: Using "fetch_item" (WRONG - use investigate_and_report!)
✗ ANY NPC: Requesting items not appropriate to ${eraContext}!

**FINAL TASK TYPE PRIORITY CHECK (by profession):**
- Merchant: buy_from_location (if marketplace) > deliver_to_location > gather_resource >> NEVER fetch_item
- Scholar: explore_location (if ruins) > investigate_and_report > compare_perspectives >> NEVER fetch_item
- Scribe: source_analysis > investigate_and_report > compare_perspectives >> NEVER fetch_item
- Guard: kill_animal (if animals) > investigate_and_report > gather_resource >> NEVER fetch_item for weapons
- Craftsmen: gather_resource > deliver_to_location (if workshop) >> fetch_item (rare)
- Priest: deliver_to_location (if religious site) > fetch_item (sacred objects only)
- Farmers: gather_resource > kill_animal (pests) > deliver_to_location

Create the work offer now. Remember:
1. Check if MANDATORY structure matching applies to your profession
2. Use profession-specific task types (NOT generic fetch_item)
3. Educational professions (Scholar/Scribe) NEVER use fetch_item
4. Use only ERA-APPROPRIATE materials from ${eraContext}
5. **ALWAYS set acceptedCategories** - Use broad categories: 'ore', 'wood', 'stone', 'hide', 'herb', 'food', 'cloth', 'tool', 'weapon', 'metal', 'medicine'
6. **Use GENERIC descriptions** - "medicinal herbs" not "feverfew", "metal ore" not "Damascus steel"
7. **Player can bring ANY item matching your categories** - Be flexible!
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
      acceptedCategories: data.acceptedCategories || [],
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
 * Helper: Check if an item matches accepted categories
 */
function matchesCategory(item: any, acceptedCategories: string[]): boolean {
  for (const category of acceptedCategories) {
    const cat = category.toLowerCase();
    const itemName = (item.name || '').toLowerCase();
    const itemCategory = (item.category || '').toLowerCase();
    const itemMaterial = (item.material || '').toLowerCase();

    // Check by category keyword
    if (cat === 'ore' && itemName.includes('ore')) return true;
    if (cat === 'wood' && (itemMaterial === 'wood' || itemName.includes('wood') || itemName.includes('log') || itemName.includes('timber'))) return true;
    if (cat === 'stone' && (itemMaterial === 'stone' || itemName.includes('stone') || itemName.includes('rock'))) return true;
    if (cat === 'hide' && itemName.includes('hide')) return true;
    if (cat === 'pelt' && itemName.includes('pelt')) return true;
    if (cat === 'herb' && (item.medicineType === 'HERBAL_REMEDY' || itemName.includes('herb'))) return true;
    if (cat === 'food' && itemCategory === 'food') return true;
    if (cat === 'cloth' && (itemMaterial === 'cloth' || itemMaterial === 'wool' || itemMaterial === 'linen')) return true;
    if (cat === 'tool' && itemCategory === 'tool') return true;
    if (cat === 'weapon' && itemCategory === 'weapon') return true;
    if (cat === 'medicine' && item.medicineType) return true;
    if (cat === 'metal' && (itemMaterial === 'iron' || itemMaterial === 'copper' || itemMaterial === 'bronze' || itemMaterial === 'steel')) return true;
  }
  return false;
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
      // Check if player has ANY item matching the accepted categories
      if (offer.acceptedCategories && offer.acceptedCategories.length > 0) {
        const hasMatchingItem = playerCharacter.inventory.some(item =>
          matchesCategory(item, offer.acceptedCategories!) &&
          item.quantity >= (offer.requiredQuantity || 1)
        );
        return hasMatchingItem ? 'completed' : 'in_progress';
      }
      // Fallback: exact name match (for backwards compatibility with old quests)
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
      // Check if player has ANY item matching the accepted categories
      if (offer.acceptedCategories && offer.acceptedCategories.length > 0) {
        const hasMatchingResource = playerCharacter.inventory.some(item =>
          matchesCategory(item, offer.acceptedCategories!) &&
          item.quantity >= (offer.requiredQuantity || 1)
        );
        return hasMatchingResource ? 'completed' : 'in_progress';
      }
      // Fallback: partial name match (for backwards compatibility)
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

  // Payment is handled by caller (adding to character.currency)
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
