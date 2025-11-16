/**
 * Work Offer System Test Suite
 *
 * Tests the work offer generation system by creating realistic scenarios
 * and analyzing what types of quests are generated, their quality, and
 * whether they match expectations.
 *
 * Run with: node scripts/test-work-offers.mjs
 */

import { GoogleGenAI, Type } from "@google/genai";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory of current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load API key from .env.local
let API_KEY = process.env.API_KEY;

if (!API_KEY) {
    try {
        const envPath = join(__dirname, '..', '.env.local');
        const envContent = readFileSync(envPath, 'utf8');
        const match = envContent.match(/API_KEY\s*=\s*(.+)/);
        if (match) {
            API_KEY = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
        }
    } catch (error) {
        // Ignore error, will check below
    }
}

if (!API_KEY) {
    console.error('❌ Error: API_KEY not found in environment or .env.local file');
    console.error('   Please set API_KEY environment variable or add it to .env.local');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// LLM response schema (copied from workOfferService.ts)
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

// Helper function to get direction
function getDirection(playerX, playerY, targetX, targetY) {
    const dx = targetX - playerX;
    const dy = targetY - playerY;

    let direction = '';

    if (Math.abs(dy) > Math.abs(dx)) {
        direction = dy < 0 ? 'North' : 'South';
    } else {
        direction = dx > 0 ? 'East' : 'West';
    }

    if (Math.abs(dx) > 5 && Math.abs(dy) > 5) {
        if (dy < 0 && dx > 0) direction = 'Northeast';
        else if (dy < 0 && dx < 0) direction = 'Northwest';
        else if (dy > 0 && dx > 0) direction = 'Southeast';
        else if (dy > 0 && dx < 0) direction = 'Southwest';
    }

    return direction;
}

function calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

// Test scenarios with different NPCs and environments
const testScenarios = [
    {
        name: "Blacksmith in town with marketplace and workshop",
        npc: {
            name: "Bjorn",
            profession: "Blacksmith",
            age: 45,
            gender: "male",
            personality: "practical",
            wealthLevel: "comfortable",
            socialClass: "Artisan",
            x: 50,
            y: 50
        },
        playerPos: { x: 50, y: 50 },
        structures: [
            { name: "Central Marketplace", structureType: "MARKETPLACE", x: 55, y: 52 },
            { name: "Iron Mine", structureType: "MINE", x: 45, y: 55 },
            { name: "Bjorn's Smithy", structureType: "WORKSHOP", x: 50, y: 51 }
        ],
        animals: [],
        location: "Oslo",
        year: 1350,
        expectedTypes: ["gather_resource", "deliver_to_location", "fetch_item"],
        expectedItems: ["iron ore", "coal", "steel", "tools", "metal"]
    },
    {
        name: "Guard with dangerous animals nearby",
        npc: {
            name: "Marcus",
            profession: "Town Guard",
            age: 32,
            gender: "male",
            personality: "serious",
            wealthLevel: "modest",
            socialClass: "Common",
            x: 60,
            y: 60
        },
        playerPos: { x: 60, y: 60 },
        structures: [
            { name: "Guard Barracks", structureType: "MILITARY_BARRACKS", x: 61, y: 60 },
            { name: "Town Gate", structureType: "CITY_GATE", x: 58, y: 60 }
        ],
        animals: [
            { speciesName: "Wolf", x: 70, y: 65 },
            { speciesName: "Wolf", x: 72, y: 67 },
            { speciesName: "Wolf", x: 68, y: 70 }
        ],
        location: "Roman Outpost",
        year: 200,
        expectedTypes: ["kill_animal", "collect_animal_products"],
        expectedItems: ["wolf", "danger", "patrol"]
    },
    {
        name: "Merchant at marketplace",
        npc: {
            name: "Zhang Wei",
            profession: "Silk Merchant",
            age: 38,
            gender: "male",
            personality: "businesslike",
            wealthLevel: "wealthy",
            socialClass: "Merchant",
            x: 100,
            y: 100
        },
        playerPos: { x: 100, y: 100 },
        structures: [
            { name: "Silk Road Bazaar", structureType: "MARKETPLACE", x: 100, y: 101 },
            { name: "Caravanserai", structureType: "INN", x: 105, y: 100 },
            { name: "Western Market", structureType: "MARKETPLACE", x: 110, y: 105 }
        ],
        animals: [],
        location: "Chang'an",
        year: 800,
        expectedTypes: ["buy_from_location", "deliver_to_location"],
        expectedItems: ["silk", "spices", "tea", "porcelain", "goods"]
    },
    {
        name: "Scholar near ancient ruins",
        npc: {
            name: "Hypatia",
            profession: "Scholar",
            age: 42,
            gender: "female",
            personality: "intellectual",
            wealthLevel: "comfortable",
            socialClass: "Scholar",
            x: 80,
            y: 80
        },
        playerPos: { x: 80, y: 80 },
        structures: [
            { name: "Ancient Temple Ruins", structureType: "RUINS", x: 75, y: 85 },
            { name: "Library of Alexandria Branch", structureType: "LIBRARY", x: 82, y: 81 },
            { name: "Old Forum", structureType: "RUINS", x: 90, y: 88 }
        ],
        animals: [],
        location: "Alexandria",
        year: 350,
        expectedTypes: ["explore_location", "investigate_and_report", "fetch_item"],
        expectedItems: ["artifact", "scroll", "inscription", "document"]
    },
    {
        name: "Farmer with animals and fields",
        npc: {
            name: "John Miller",
            profession: "Wheat Farmer",
            age: 50,
            gender: "male",
            personality: "hardworking",
            wealthLevel: "modest",
            socialClass: "Peasant",
            x: 120,
            y: 120
        },
        playerPos: { x: 120, y: 120 },
        structures: [
            { name: "Miller's Farm", structureType: "FARM", x: 120, y: 121 },
            { name: "Grain Mill", structureType: "MILL", x: 125, y: 120 },
            { name: "Village Market", structureType: "MARKETPLACE", x: 115, y: 118 }
        ],
        animals: [
            { speciesName: "Deer", x: 130, y: 125 },
            { speciesName: "Deer", x: 132, y: 126 },
            { speciesName: "Rabbit", x: 128, y: 122 },
            { speciesName: "Crow", x: 121, y: 123 }
        ],
        location: "English Countryside",
        year: 1450,
        expectedTypes: ["gather_resource", "deliver_to_location", "kill_animal"],
        expectedItems: ["wheat", "grain", "flour", "seed", "pests"]
    },
    {
        name: "Priest at religious site",
        npc: {
            name: "Father Dominic",
            profession: "Catholic Priest",
            age: 55,
            gender: "male",
            personality: "pious",
            wealthLevel: "modest",
            socialClass: "Clergy",
            x: 140,
            y: 140
        },
        playerPos: { x: 140, y: 140 },
        structures: [
            { name: "Cathedral of Saint Mary", structureType: "CHURCH", x: 140, y: 141 },
            { name: "Monastery", structureType: "MONASTERY", x: 145, y: 145 },
            { name: "Village Chapel", structureType: "SHRINE", x: 135, y: 138 }
        ],
        animals: [],
        location: "Paris",
        year: 1200,
        expectedTypes: ["deliver_to_location", "fetch_item", "debate_topic"],
        expectedItems: ["holy", "sacred", "offering", "pilgrimage", "prayer"]
    },
    {
        name: "Potter/Craftsman in workshop district",
        npc: {
            name: "Amina",
            profession: "Potter",
            age: 35,
            gender: "female",
            personality: "creative",
            wealthLevel: "modest",
            socialClass: "Artisan",
            x: 160,
            y: 160
        },
        playerPos: { x: 160, y: 160 },
        structures: [
            { name: "Potter's Workshop", structureType: "WORKSHOP", x: 160, y: 161 },
            { name: "Clay Quarry", structureType: "QUARRY", x: 170, y: 165 },
            { name: "Artisan Market", structureType: "MARKETPLACE", x: 155, y: 158 }
        ],
        animals: [],
        location: "Fez",
        year: 1100,
        expectedTypes: ["gather_resource", "deliver_to_location", "fetch_item"],
        expectedItems: ["clay", "glaze", "firewood", "pottery"]
    },
    {
        name: "Noble with no nearby structures (should adapt)",
        npc: {
            name: "Lady Beatrice",
            profession: "Noblewoman",
            age: 28,
            gender: "female",
            personality: "refined",
            wealthLevel: "noble",
            socialClass: "Noble",
            x: 180,
            y: 180
        },
        playerPos: { x: 180, y: 180 },
        structures: [], // No structures nearby - should still generate work
        animals: [
            { speciesName: "Deer", x: 185, y: 182 },
            { speciesName: "Fox", x: 188, y: 185 }
        ],
        location: "English Estate",
        year: 1500,
        expectedTypes: ["fetch_item", "kill_animal", "gather_resource"],
        expectedItems: ["luxury", "game", "hunt", "delivery"]
    },
    {
        name: "Tanner with animals for pelts",
        npc: {
            name: "Erik the Tanner",
            profession: "Leather Tanner",
            age: 40,
            gender: "male",
            personality: "pragmatic",
            wealthLevel: "modest",
            socialClass: "Artisan",
            x: 200,
            y: 200
        },
        playerPos: { x: 200, y: 200 },
        structures: [
            { name: "Tanning Workshop", structureType: "WORKSHOP", x: 200, y: 201 },
            { name: "Leatherworker's Guild", structureType: "GUILD_HALL", x: 205, y: 202 }
        ],
        animals: [
            { speciesName: "Deer", x: 210, y: 205 },
            { speciesName: "Deer", x: 212, y: 208 },
            { speciesName: "Deer", x: 215, y: 210 },
            { speciesName: "Wolf", x: 218, y: 215 }
        ],
        location: "Scandinavian Village",
        year: 950,
        expectedTypes: ["collect_animal_products", "kill_animal"],
        expectedItems: ["hide", "pelt", "leather", "skin"]
    },
    {
        name: "Scribe/Historian with educational focus",
        npc: {
            name: "Ibn Battuta",
            profession: "Historian and Scribe",
            age: 48,
            gender: "male",
            personality: "intellectual",
            wealthLevel: "comfortable",
            socialClass: "Scholar",
            x: 220,
            y: 220
        },
        playerPos: { x: 220, y: 220 },
        structures: [
            { name: "Great Mosque Library", structureType: "LIBRARY", x: 220, y: 222 },
            { name: "Ancient Kasbah Ruins", structureType: "RUINS", x: 230, y: 230 },
            { name: "Madrasah", structureType: "UNIVERSITY", x: 215, y: 218 }
        ],
        animals: [],
        location: "Tangier",
        year: 1340,
        expectedTypes: ["investigate_and_report", "source_analysis", "explore_location", "debate_topic"],
        expectedItems: ["document", "manuscript", "historical", "analysis"]
    }
];

// Analysis functions
function analyzeTaskType(taskType, expectedTypes) {
    const isExpected = expectedTypes.includes(taskType);
    return {
        isExpected,
        verdict: isExpected ? '✅ EXPECTED' : '⚠️ UNEXPECTED'
    };
}

function analyzeRealism(offer, scenario) {
    const issues = [];
    const strengths = [];

    // Check if task matches NPC profession
    const profession = scenario.npc.profession.toLowerCase();
    const description = offer.description.toLowerCase();
    const taskType = offer.taskType;

    // Profession-specific checks
    if (profession.includes('blacksmith') || profession.includes('smith')) {
        if (taskType === 'explore_location' && !description.includes('iron') && !description.includes('ore')) {
            issues.push('❌ Blacksmith should want metal/ore, not generic exploration');
        }
        if (taskType === 'gather_resource' && (description.includes('iron') || description.includes('ore') || description.includes('metal'))) {
            strengths.push('✅ Blacksmith requesting metal resources - realistic');
        }
    }

    if (profession.includes('merchant') || profession.includes('trader')) {
        if (taskType === 'kill_animal') {
            issues.push('❌ Merchant unlikely to hire for hunting - should want trade goods');
        }
        if (taskType === 'buy_from_location' || taskType === 'deliver_to_location') {
            strengths.push('✅ Merchant requesting commerce/delivery - realistic');
        }
    }

    if (profession.includes('guard') || profession.includes('soldier')) {
        if (scenario.animals.length > 0 && taskType !== 'kill_animal') {
            issues.push('⚠️ Guard with dangerous animals nearby should prioritize hunting quests');
        }
        if (taskType === 'kill_animal') {
            strengths.push('✅ Guard requesting hunting - realistic');
        }
    }

    if (profession.includes('farmer')) {
        if (taskType === 'explore_location') {
            issues.push('❌ Farmer unlikely to care about ruins - should want crops/pest control');
        }
        if (taskType === 'gather_resource' && (description.includes('wheat') || description.includes('grain') || description.includes('seed'))) {
            strengths.push('✅ Farmer requesting agricultural resources - realistic');
        }
    }

    if (profession.includes('scholar') || profession.includes('scribe') || profession.includes('historian')) {
        if (taskType === 'kill_animal' || taskType === 'collect_animal_products') {
            issues.push('❌ Scholar unlikely to want hunting - should want documents/artifacts');
        }
        if (taskType === 'investigate_and_report' || taskType === 'explore_location' || taskType === 'source_analysis') {
            strengths.push('✅ Scholar requesting research/exploration - realistic');
        }
    }

    if (profession.includes('tanner') || profession.includes('leather')) {
        if (scenario.animals.length > 0 && taskType !== 'collect_animal_products' && taskType !== 'kill_animal') {
            issues.push('⚠️ Tanner with animals nearby should want pelts/hides');
        }
        if (taskType === 'collect_animal_products' && (description.includes('hide') || description.includes('pelt') || description.includes('skin'))) {
            strengths.push('✅ Tanner requesting animal products - realistic');
        }
    }

    // Check if ruins are over-represented
    if (taskType === 'explore_location') {
        const hasRuins = scenario.structures.some(s =>
            s.structureType === 'RUINS' || s.name.toLowerCase().includes('ruin')
        );
        if (!hasRuins) {
            issues.push('❌ Exploration quest but no ruins nearby - what are they exploring?');
        } else {
            strengths.push('✅ Exploration quest with ruins available');
        }
    }

    // Check if required item/location is actually available
    if (offer.targetLocationName) {
        const locationExists = scenario.structures.some(s =>
            s.name.toLowerCase().includes(offer.targetLocationName.toLowerCase()) ||
            s.structureType.toLowerCase().includes(offer.targetLocationName.toLowerCase())
        );
        if (!locationExists) {
            issues.push(`❌ Target location "${offer.targetLocationName}" not found in available structures`);
        } else {
            strengths.push(`✅ Target location "${offer.targetLocationName}" exists on map`);
        }
    }

    if (offer.targetAnimal) {
        const animalExists = scenario.animals.some(a =>
            a.speciesName.toLowerCase() === offer.targetAnimal.toLowerCase()
        );
        if (!animalExists) {
            issues.push(`❌ Target animal "${offer.targetAnimal}" not available nearby`);
        } else {
            strengths.push(`✅ Target animal "${offer.targetAnimal}" available nearby`);
        }
    }

    return { issues, strengths };
}

function analyzeDoability(offer, scenario) {
    const checks = [];

    // Check if task is completable with given game state
    if (offer.taskType === 'explore_location' || offer.taskType === 'investigate_and_report') {
        if (scenario.structures.length === 0) {
            checks.push({ pass: false, message: '❌ No structures available to explore' });
        } else {
            checks.push({ pass: true, message: '✅ Structures available for exploration' });
        }
    }

    if (offer.taskType === 'kill_animal' || offer.taskType === 'collect_animal_products') {
        if (scenario.animals.length === 0) {
            checks.push({ pass: false, message: '❌ No animals available for hunting quest' });
        } else {
            checks.push({ pass: true, message: '✅ Animals available for hunting' });
        }
    }

    if (offer.taskType === 'buy_from_location' || offer.taskType === 'deliver_to_location') {
        const hasMarket = scenario.structures.some(s =>
            s.structureType === 'MARKETPLACE' || s.name.toLowerCase().includes('market')
        );
        if (offer.taskType === 'buy_from_location' && !hasMarket) {
            checks.push({ pass: false, message: '⚠️ Buy quest but no marketplace nearby' });
        }
    }

    // Check payment reasonableness
    if (offer.payment < 5 || offer.payment > 50) {
        checks.push({ pass: false, message: `❌ Payment ${offer.payment} outside expected 5-50 range` });
    } else {
        checks.push({ pass: true, message: `✅ Payment ${offer.payment} coins is reasonable` });
    }

    const allPass = checks.every(c => c.pass);
    return { allPass, checks };
}

// Main test function
async function testWorkOffer(scenario, testNumber) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST ${testNumber}: ${scenario.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`NPC: ${scenario.npc.name} (${scenario.npc.profession})`);
    console.log(`Location: ${scenario.location}, Year: ${scenario.year}`);
    console.log(`Structures: ${scenario.structures.length}, Animals: ${scenario.animals.length}`);

    // Build structure context
    const playerPos = scenario.playerPos;
    const nearby = scenario.structures;

    const marketplaces = [];
    const ruins = [];
    const religious = [];
    const workshops = [];
    const other = [];

    nearby.forEach(s => {
        const loc = { x: s.x, y: s.y };
        const distance = calculateDistance(playerPos, loc);
        const direction = getDirection(playerPos.x, playerPos.y, loc.x, loc.y);
        const locationStr = `${s.name || s.structureType} (${direction}, ${Math.round(distance)} tiles away)`;

        const type = (s.structureType || '').toLowerCase();
        const name = (s.name || '').toLowerCase();

        if (type.includes('market') || type.includes('bazaar') || name.includes('market')) {
            marketplaces.push(locationStr);
        } else if (type.includes('ruin') || name.includes('ruin') || type.includes('ancient')) {
            ruins.push(locationStr);
        } else if (type.includes('temple') || type.includes('shrine') || type.includes('church') || type.includes('mosque') || type.includes('monastery') || name.includes('holy')) {
            religious.push(locationStr);
        } else if (type.includes('workshop') || type.includes('smithy') || type.includes('forge') || type.includes('mill')) {
            workshops.push(locationStr);
        } else {
            other.push(locationStr);
        }
    });

    let structureContext = '';
    if (marketplaces.length > 0) {
        structureContext += '**MARKETPLACES** (good for buying goods):\n' + marketplaces.map(s => `- ${s}`).join('\n') + '\n\n';
    }
    if (ruins.length > 0) {
        structureContext += '**RUINS/ANCIENT SITES** (good for exploration/investigation quests):\n' + ruins.map(s => `- ${s}`).join('\n') + '\n\n';
    }
    if (religious.length > 0) {
        structureContext += '**RELIGIOUS SITES** (good for delivery/pilgrimage tasks):\n' + religious.map(s => `- ${s}`).join('\n') + '\n\n';
    }
    if (workshops.length > 0) {
        structureContext += '**WORKSHOPS/CRAFTERS** (good for delivery of materials):\n' + workshops.map(s => `- ${s}`).join('\n') + '\n\n';
    }
    if (other.length > 0) {
        structureContext += '**OTHER LOCATIONS**:\n' + other.map(s => `- ${s}`).join('\n');
    }

    let animalContext = '';
    if (scenario.animals.length > 0) {
        const animalCounts = {};
        scenario.animals.forEach(animal => {
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

    console.log(`\nContext provided to LLM:`);
    console.log(structureContext || '- No major structures');
    if (animalContext) console.log(animalContext);

    const prompt = `
You are ${scenario.npc.name}, a ${scenario.npc.profession || 'person'} in ${scenario.location || 'this area'}.

Your Details:
- Age: ${scenario.npc.age}
- Wealth: ${scenario.npc.wealthLevel || 'moderate'}
- Profession: ${scenario.npc.profession}

Player Details:
- Name: TestPlayer
- Has items: basic supplies
- Reputation: 50/100

Nearby Locations:
${structureContext || '- No major structures nearby'}
${animalContext}

TASK: The player is asking you for work. Create a SIMPLE, SINGLE-OBJECTIVE task for them.

CRITICAL LOCATION RULES:
1. **RUINS/ANCIENT SITES** → Use taskType "explore_location"
   - Create culturally-specific, historically interesting exploration quests
   - Ask player to "investigate" or "explore" and bring back "anything interesting"
   - NEVER ask to "buy" things from ruins
   - Payment: 30-50 coins (exploration is risky)

2. **MARKETPLACES** → Use "buy_from_location"
   - Ask to buy specific trade goods (silk, spices, tools, etc.)
   - NOT basic materials like stone/wood

3. **WORKSHOPS/CRAFTERS** → Use "deliver_to_location"
   - Deliver raw materials they need for their craft

4. **RELIGIOUS SITES** → Use "deliver_to_location" or "fetch_item"
   - Offerings, sacred items, pilgrimage tasks

5. **ANIMALS/WILDLIFE** → Use "kill_animal" or "collect_animal_products"
   - kill_animal: "Hunt the wolf terrorizing travelers" (targetAnimal: "Wolf")
   - collect_animal_products: "Bring me 3 wolf pelts" (requiredItem: "Wolf Pelt", requiredQuantity: 3)
   - ONLY use animals from the NEARBY ANIMALS list above!
   - Products: pelts, hides, meat, antlers, tusks, feathers, bones

TASK VARIETY - Mix it up! Don't always ask for the same thing:
- Scholars/Historians: exploration of ruins, fetch rare books, deliver documents
- Craftsmen: deliver materials, gather specific resources
- Merchants: buy trade goods from markets (NOT stone/wood)
- Guards/Soldiers: hunt dangerous animals, patrol areas
- Farmers: gather crops, scare animals, deliver produce
- Religious: offerings, sacred items, pilgrimage deliveries
- Nobles: luxury goods from markets, investigation of rumors

GOOD EXAMPLES:
✓ Scholar + Ruins: "I've heard tales of the ${ruins.length > 0 ? ruins[0].split('(')[0].trim() : 'ancient ruins'}. Investigate it and bring me any artifacts or writings you find. 40 coins." (explore_location)
✓ Merchant + Market: "Go to the marketplace and buy me 3 bolts of fine silk. I'll pay 25 coins." (buy_from_location)
✓ Blacksmith: "Bring me 5 iron ore from the mines. 20 coins." (gather_resource)
✓ Priest: "Deliver these sacred scrolls to the temple. 15 coins." (deliver_to_location)
✓ Guard + Animals: "Wolves have been attacking travelers on the north road. Hunt one down. 30 coins." (kill_animal, targetAnimal: "Wolf")
✓ Tanner + Animals: "I need 3 deer hides for my leather work. Bring them to me. 25 coins." (collect_animal_products, requiredItem: "Deer Hide", requiredQuantity: 3)

BAD EXAMPLES:
✗ "Buy 3 coils of rope from the ruins" (ruins aren't shops!)
✗ "Fetch me 10 limestone" (too boring, always stone)
✗ "Get stone from quarry" (too generic, overdone)

Create the work offer now. Be creative and profession-appropriate!
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

        console.log(`\n📋 GENERATED WORK OFFER:`);
        console.log(`   Task Type: ${data.taskType}`);
        console.log(`   Description: "${data.description}"`);
        console.log(`   Payment: ${data.payment} coins`);
        if (data.requiredItem) console.log(`   Required Item: ${data.requiredQuantity || 1}x ${data.requiredItem}`);
        if (data.targetLocationName) console.log(`   Target Location: ${data.targetLocationName}`);
        if (data.targetAnimal) console.log(`   Target Animal: ${data.targetAnimal}`);
        if (data.deadlineHours) console.log(`   Deadline: ${data.deadlineHours} hours`);

        // Analysis
        console.log(`\n🔍 ANALYSIS:`);

        const taskAnalysis = analyzeTaskType(data.taskType, scenario.expectedTypes);
        console.log(`   Task Type: ${taskAnalysis.verdict}`);
        console.log(`   Expected: ${scenario.expectedTypes.join(', ')}`);
        console.log(`   Got: ${data.taskType}`);

        const realism = analyzeRealism(data, scenario);
        console.log(`\n   Realism Check:`);
        if (realism.strengths.length > 0) {
            realism.strengths.forEach(s => console.log(`   ${s}`));
        }
        if (realism.issues.length > 0) {
            realism.issues.forEach(i => console.log(`   ${i}`));
        }
        if (realism.strengths.length === 0 && realism.issues.length === 0) {
            console.log(`   ℹ️  No specific issues or strengths identified`);
        }

        const doability = analyzeDoability(data, scenario);
        console.log(`\n   Doability Check:`);
        doability.checks.forEach(c => console.log(`   ${c.message}`));

        return {
            scenario: scenario.name,
            npcProfession: scenario.npc.profession,
            taskType: data.taskType,
            description: data.description,
            payment: data.payment,
            expectedTypes: scenario.expectedTypes,
            wasExpected: taskAnalysis.isExpected,
            realismIssues: realism.issues.length,
            realismStrengths: realism.strengths.length,
            isDoable: doability.allPass,
            fullAnalysis: {
                taskAnalysis,
                realism,
                doability
            }
        };

    } catch (error) {
        console.error(`\n❌ ERROR generating work offer:`, error);
        return {
            scenario: scenario.name,
            npcProfession: scenario.npc.profession,
            error: error.message
        };
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n' + '='.repeat(80));
    console.log('WORK OFFER SYSTEM TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Testing ${testScenarios.length} scenarios\n`);

    const results = [];

    for (let i = 0; i < testScenarios.length; i++) {
        const result = await testWorkOffer(testScenarios[i], i + 1);
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary report
    console.log('\n\n' + '='.repeat(80));
    console.log('SUMMARY REPORT');
    console.log('='.repeat(80));

    const successfulTests = results.filter(r => !r.error);
    const failedTests = results.filter(r => r.error);

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Failed: ${failedTests.length}`);

    if (failedTests.length > 0) {
        console.log(`\n❌ FAILED TESTS:`);
        failedTests.forEach(r => {
            console.log(`   - ${r.scenario}: ${r.error}`);
        });
    }

    if (successfulTests.length > 0) {
        console.log(`\n📊 TASK TYPE DISTRIBUTION:`);
        const taskTypeCounts = {};
        successfulTests.forEach(r => {
            taskTypeCounts[r.taskType] = (taskTypeCounts[r.taskType] || 0) + 1;
        });

        Object.entries(taskTypeCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                const percentage = ((count / successfulTests.length) * 100).toFixed(1);
                const bar = '█'.repeat(Math.round(count));
                console.log(`   ${type.padEnd(25)} ${bar} ${count} (${percentage}%)`);
            });

        console.log(`\n✅ EXPECTED VS UNEXPECTED:`);
        const expectedCount = successfulTests.filter(r => r.wasExpected).length;
        const unexpectedCount = successfulTests.filter(r => !r.wasExpected).length;
        console.log(`   Expected task types: ${expectedCount}/${successfulTests.length} (${((expectedCount/successfulTests.length)*100).toFixed(1)}%)`);
        console.log(`   Unexpected task types: ${unexpectedCount}/${successfulTests.length} (${((unexpectedCount/successfulTests.length)*100).toFixed(1)}%)`);

        console.log(`\n🎯 REALISM SCORES:`);
        const avgIssues = (successfulTests.reduce((sum, r) => sum + r.realismIssues, 0) / successfulTests.length).toFixed(2);
        const avgStrengths = (successfulTests.reduce((sum, r) => sum + r.realismStrengths, 0) / successfulTests.length).toFixed(2);
        console.log(`   Average realism issues per test: ${avgIssues}`);
        console.log(`   Average realism strengths per test: ${avgStrengths}`);

        const doableCount = successfulTests.filter(r => r.isDoable).length;
        console.log(`   Fully doable quests: ${doableCount}/${successfulTests.length} (${((doableCount/successfulTests.length)*100).toFixed(1)}%)`);

        console.log(`\n💰 PAYMENT DISTRIBUTION:`);
        const payments = successfulTests.map(r => r.payment).sort((a, b) => a - b);
        const avgPayment = (payments.reduce((sum, p) => sum + p, 0) / payments.length).toFixed(1);
        console.log(`   Min: ${Math.min(...payments)} coins`);
        console.log(`   Max: ${Math.max(...payments)} coins`);
        console.log(`   Average: ${avgPayment} coins`);

        // Check for over-representation of specific task types
        console.log(`\n⚠️  POTENTIAL ISSUES:`);
        if (taskTypeCounts['explore_location'] > successfulTests.length * 0.5) {
            console.log(`   ❌ "explore_location" is over-represented (${taskTypeCounts['explore_location']}/${successfulTests.length} = ${((taskTypeCounts['explore_location']/successfulTests.length)*100).toFixed(1)}%)`);
            console.log(`      → System may be biased toward ruins/exploration quests`);
        }

        const professionMismatches = successfulTests.filter(r => !r.wasExpected);
        if (professionMismatches.length > 0) {
            console.log(`\n   Profession mismatches detected:`);
            professionMismatches.forEach(r => {
                console.log(`   - ${r.npcProfession}: got "${r.taskType}", expected one of: ${r.expectedTypes.join(', ')}`);
            });
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('END OF REPORT');
    console.log('='.repeat(80) + '\n');
}

// Run the tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
