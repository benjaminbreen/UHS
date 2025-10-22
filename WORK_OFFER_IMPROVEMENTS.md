# Work Offer System Improvements

## Issues Fixed (October 17, 2025)

### 1. **Task Variety Problem**
**Before**: NPCs constantly asked for stone, limestone, and other boring materials
**After**: Tasks are now profession-specific and varied:
- Scholars → exploration quests, rare books, historical documents
- Merchants → trade goods (silk, spices, tools) NOT basic materials
- Craftsmen → materials for their specific craft
- Guards → hunt dangerous animals, patrol
- Farmers → crops, animal control, produce delivery
- Religious → offerings, sacred items, pilgrimages

### 2. **Location Context Awareness**
**Before**: NPCs asked players to "buy 3 coils of rope from ruins" (nonsensical)
**After**: Location types now generate appropriate quests:

#### **RUINS/ANCIENT SITES** → Exploration Quests (`explore_location`)
- "I've heard tales of the Ancient Temple. Investigate it and bring me any artifacts or writings you find. 40 coins."
- Culturally-specific, historically interesting
- NEVER "buy" tasks for ruins
- Payment: 30-50 coins (exploration is risky)
- **ANY item brought back completes the quest**

#### **MARKETPLACES** → Buy quests (`buy_from_location`)
- Trade goods only (silk, spices, tools, luxury items)
- NOT basic materials like stone/wood

#### **WORKSHOPS/CRAFTERS** → Delivery quests (`deliver_to_location`)
- Raw materials they need for their craft

#### **RELIGIOUS SITES** → Delivery/Fetch quests
- Offerings, sacred items, pilgrimage tasks

## New Task Type: `explore_location`

### Features:
- Used for ruins, ancient sites, mysterious locations
- Player explores the location
- **Accepts ANY item** brought back (no specific requirement)
- Higher payment (30-50 coins) to reflect risk
- Creates interesting, culture-specific narratives

### Example:
```
Scholar: "The old Sumerian ruins to the North fascinate me.
Explore them and bring back any artifacts or inscriptions you find.
I'll pay 45 coins for whatever you discover."
```

Player goes to ruins, picks up literally anything (pottery shard, ancient coin, scroll fragment), returns → quest complete!

## Technical Changes

### Type System (`types/workOffer.ts`)
```typescript
export type WorkTaskType =
  | 'fetch_item'
  | 'deliver_to_location'
  | 'buy_from_location'
  | 'kill_animal'
  | 'gather_resource'
  | 'explore_location';  // NEW

export interface WorkOffer {
  // ... existing fields
  acceptsAnyItem?: boolean;  // NEW - for explore_location quests
}
```

### Work Offer Generation (`services/workOfferService.ts`)

#### Location Categorization
Nearby structures are now categorized:
- **Marketplaces** - bazaars, markets
- **Ruins** - ancient sites, ruins
- **Religious Sites** - temples, shrines, churches, mosques
- **Workshops** - smithies, forges, mills
- **Other** - everything else

#### Improved LLM Prompt
New prompt includes:
1. **CRITICAL LOCATION RULES** - Clear guidance on which task types for which locations
2. **TASK VARIETY** - Profession-specific examples
3. **GOOD vs BAD EXAMPLES** - Shows NPCs what NOT to do

#### Completion Logic
```typescript
case 'explore_location':
  // Player just needs items in inventory
  return playerCharacter.inventory && playerCharacter.inventory.length > 0
    ? 'completed'
    : 'in_progress';
```

#### Payment Logic
```typescript
if (offer.taskType === 'explore_location') {
  // Take the first item from inventory (any item)
  const firstItem = playerCharacter.inventory[0];
  // ... remove it
  return {
    success: true,
    message: `Fascinating! This ${firstItem.name} will be very useful. Thank you for exploring!`,
    coinsEarned: offer.payment,
    itemTaken: firstItem.name
  };
}
```

## Examples of Improved Work Offers

### ✅ GOOD (New System)
- **Scholar + Ruins**: "Investigate the Temple of Athena and bring me any historical artifacts. 40 coins."
- **Merchant + Market**: "Buy 3 bolts of silk from the Eastern Bazaar. 25 coins."
- **Blacksmith + Mines**: "Bring me 5 iron ore from the northern mines. 20 coins."
- **Priest + Temple**: "Deliver these sacred scrolls to the Temple. 15 coins."
- **Guard + Wildlife**: "There's a wolf terrorizing travelers. Hunt it down. 30 coins."

### ❌ BAD (Old System)
- "Buy 3 coils of rope from the ruins" ← Ruins aren't shops!
- "Fetch me 10 limestone" ← Boring, overdone
- "Get stone from quarry" ← Too generic
- "Bring me wood" ← Every third quest

## Benefits

1. **Immersion** - Tasks make sense in historical context
2. **Variety** - No more endless stone requests
3. **Exploration Incentive** - Ruins become interesting to explore
4. **Cultural Authenticity** - Tasks reflect profession and culture
5. **Flexibility** - Exploration quests accept any item (reduces frustration)

## Testing Checklist

- [ ] Ask NPC near ruins for work → Should get exploration quest
- [ ] Ask merchant for work → Should get market buying quest (NOT stone/wood)
- [ ] Complete exploration quest with random item → Should work
- [ ] Verify variety across multiple work requests
- [ ] Check culturally-appropriate task generation
