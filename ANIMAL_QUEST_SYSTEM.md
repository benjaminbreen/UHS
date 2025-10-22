# Animal Quest System - Implementation Complete

## Overview
NPCs can now offer two types of animal-related work:
1. **Hunt Quests** (`kill_animal`) - "Kill the wolf terrorizing the roads"
2. **Gathering Quests** (`collect_animal_products`) - "Bring me 3 deer hides"

## Key Features

### ✅ Animal Awareness
- System detects animals within 50 tiles of the NPC
- Counts animals by species (e.g., "5x Wolf", "3x Deer", "2x Bear")
- Only offers quests for animals that actually exist nearby
- LLM receives detailed animal context for quest generation

### ✅ Two Quest Types

#### **Kill Animal Quests** (`kill_animal`)
**Example**: "Wolves have been attacking travelers. Hunt one down. 30 coins."

**Mechanics**:
- NPC specifies target animal species
- Quest completes when player kills that animal type
- Tracked via localStorage (wasAnimalKilled)
- Payment: 20-40 coins depending on danger level

**Good For**:
- Guards/Soldiers
- Hunters
- Farmers (pest control)
- Anyone concerned about dangerous wildlife

#### **Collect Animal Products** (`collect_animal_products`)
**Example**: "I need 3 deer hides for my leather work. 25 coins."

**Mechanics**:
- NPC specifies product type (pelts, hides, meat, antlers, tusks, feathers, bones)
- Quest completes when player has required quantity in inventory
- Items removed from inventory upon completion
- Payment: 15-35 coins depending on quantity and rarity

**Good For**:
- Tanners
- Leatherworkers
- Butchers
- Craftsmen needing materials
- Merchants trading animal goods

### ✅ Context-Aware Generation

**LLM Prompt includes**:
```
**NEARBY ANIMALS** (available for hunting/collecting quests):
- 5x Wolf
- 3x Deer
- 2x Rabbit
- 1x Bear
```

**LLM Guidelines**:
- ONLY use animals from the nearby list
- kill_animal for hunting dangerous/nuisance animals
- collect_animal_products for gathering specific materials
- Match profession appropriately (guards hunt, tanners need hides)

## Technical Implementation

### Type System Changes

#### `types/workOffer.ts`
```typescript
export type WorkTaskType =
  | 'fetch_item'
  | 'deliver_to_location'
  | 'buy_from_location'
  | 'kill_animal'           // Hunt specific animal
  | 'gather_resource'
  | 'explore_location'
  | 'collect_animal_products';  // NEW - Gather pelts/hides/etc
```

### Service Changes

#### `services/workOfferService.ts`
1. **New Parameter**: `nearbyAnimals?: AnimalEntity[]`
2. **Animal Context Generation**: Counts and lists nearby animals by species
3. **LLM Schema Update**: Includes `collect_animal_products` task type
4. **Completion Logic**: Checks inventory for animal products
5. **Prompt Guidelines**: Explicit rules for animal quests

### Component Changes

#### `components/EncounterModalUpdated.tsx`
```typescript
// Get nearby animals for hunting quests (use NPC position as reference)
const npcPos = { x: (currentTarget as NpcEntity).x, y: (currentTarget as NpcEntity).y };
const nearbyAnimals = mapData?.animals?.filter(animal => {
    const dx = animal.x - npcPos.x;
    const dy = animal.y - npcPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= 50; // Within 50 tiles
}) || [];

const offer = await generateWorkOffer(
    currentTarget as NpcEntity,
    playerCharacter,
    mapData,
    mapData?.terrainStructures || [],
    gameTimeHours,
    npcPos,
    nearbyAnimals  // NEW parameter
);
```

## Quest Completion Flow

### Kill Animal Quest
1. Player accepts quest to hunt wolf
2. Quest stored in localStorage with `targetAnimal: "Wolf"`
3. Player kills a wolf → `wasAnimalKilled(offerId, "Wolf")` returns true
4. Player returns to NPC → Quest completes, payment awarded

### Collect Animal Products Quest
1. Player accepts quest for "3 deer hides"
2. Quest stored with `requiredItem: "Deer Hide"`, `requiredQuantity: 3`
3. Player hunts deer, obtains hides (via combat loot system)
4. `checkWorkCompletion()` detects 3+ deer hides in inventory
5. Player talks to NPC → Items removed, payment awarded

## Animal Product Types

The system supports various animal products:
- **Pelts** - Wolf Pelt, Bear Pelt, Fox Pelt
- **Hides** - Deer Hide, Elk Hide, Buffalo Hide
- **Meat** - Venison, Boar Meat, Rabbit Meat
- **Bones** - Antlers, Tusks, Bones
- **Feathers** - Bird Feathers, Eagle Feathers
- **Other** - Claws, Teeth, Horns

*Note: Actual product generation depends on combat loot system*

## Examples

### Good Quest Generation

✅ **Guard near wolves**:
"There's a wolf pack terrorizing the roads. Hunt down at least one wolf. 30 coins."
- `taskType: "kill_animal"`
- `targetAnimal: "Wolf"`
- `payment: 30`

✅ **Tanner near deer**:
"I need deer hides for a new set of leather armor. Bring me 4 hides. 28 coins."
- `taskType: "collect_animal_products"`
- `requiredItem: "Deer Hide"`
- `requiredQuantity: 4`
- `payment: 28`

✅ **Butcher near various animals**:
"Fresh meat is always in demand. Bring me 5 portions of any meat. 20 coins."
- `taskType: "collect_animal_products"`
- `requiredItem: "Meat"` (generic)
- `requiredQuantity: 5`
- `payment: 20`

### Bad Quest Generation (Prevented by System)

❌ **No animals nearby**:
System prevents: If no animals within 50 tiles, LLM is instructed not to offer animal quests

❌ **Wrong animal species**:
Prevented: "Hunt a dragon" when only deer/wolves nearby
- LLM explicitly told to ONLY use animals from nearby list

❌ **Unrealistic requests**:
Prevented: Blacksmith asking for bird feathers
- LLM uses profession context to generate appropriate quests

## Integration with Existing Systems

### Combat Loot System
When player kills an animal, combat system should:
1. Check for active `collect_animal_products` quests
2. Drop appropriate products (pelts, hides, meat, etc.)
3. Add to player inventory

### Quest Markers
- `kill_animal` quests show animal icon on map
- `collect_animal_products` show gathering icon
- Both display progress (e.g., "2/3 hides collected")

### Partial Delivery
Animal product quests support the partial delivery system:
- Can deliver 2 of 5 hides, then return with 3 more later
- Progress tracked via `deliveredQuantity`

## Benefits

1. **Dynamic Content** - Quest availability based on actual animal spawns
2. **Profession Variety** - Guards hunt, tanners gather, butchers need meat
3. **Emergent Gameplay** - Dangerous animal spawns create natural quest opportunities
4. **Economic Loop** - Animal products → crafting materials → economic activity
5. **World Cohesion** - NPCs react to their actual environment

## Testing Checklist

- [ ] Talk to guard near wolves → Should offer wolf hunting quest
- [ ] Talk to tanner near deer → Should offer hide gathering quest
- [ ] Complete kill quest → Verify completion after killing animal
- [ ] Complete gathering quest → Verify items removed from inventory
- [ ] Test with no animals nearby → Should not offer animal quests
- [ ] Test partial delivery → Deliver 2 of 5 hides, complete with 3 more later
- [ ] Verify profession-appropriate quests (guards hunt, not collect feathers)
