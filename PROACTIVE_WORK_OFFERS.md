# Proactive Work Offers - Context-Aware NPC Greetings

## Overview
NPCs now intelligently offer work in their initial greetings based on context, personality, and surrounding conditions - without requiring additional LLM calls or adding lag to dialogue generation.

## Key Features

### ✅ Zero Performance Impact
- **No additional LLM calls** - Context calculation is pure JavaScript
- **Uses existing data** - Animals, structures, personality already loaded
- **Fast computation** - Simple checks, no complex algorithms
- **Cached in useMemo** - Calculated once when modal opens

### ✅ Leverages Existing Systems
- **Existing dialogue generation** - Same LLM call, just enhanced greeting
- **Existing work offer system** - Player can accept, decline, or ignore naturally
- **Existing personality traits** - Uses NPC's extraversion, conscientiousness, agreeableness
- **Existing game data** - Nearby animals, structures, profession

### ✅ Natural Player Experience
- NPCs proactively mention work opportunities when contextually appropriate
- Player can engage with the offer or ignore it and talk about something else
- Fallback to manual "do you have work?" still available
- No forced UI elements or interruptions

## How It Works

### Context Calculation (`calculateProactiveWorkContext`)

Simple function that checks existing game state:

```typescript
function calculateProactiveWorkContext(
  npc: NpcEntity,
  mapData: MapData | null,
  nearbyAnimals: AnimalEntity[],
  nearbyStructures: TerrainStructure[]
): { shouldOffer: boolean; contextHint: string; probability: number }
```

**What it checks (all instant)**:
1. Dangerous animals nearby? (wolves, bears, tigers)
2. Ruins/ancient sites nearby?
3. Markets nearby?
4. NPC profession (guard, scholar, merchant, craftsman)
5. NPC personality (businesslike, friendly, shy)

**Returns**:
- `shouldOffer`: Boolean - Should add context hint?
- `contextHint`: String - The subtle context to add to greeting
- `probability`: Number - For debugging/analytics

### Context Hints

Instead of generating full work offers, we add subtle hints that the LLM naturally responds to:

**Format**: `"Hello. [Context hint in brackets]"`

These hints nudge the dialogue without forcing it.

## Context Scenarios

### 1. URGENT - Dangerous Animals + Guard (80% probability)
**Trigger**:
- Wolves/bears/tigers within 50 tiles
- NPC is guard or soldier

**Context Hint**:
> `[You notice they look worried, glancing nervously toward the wilderness where dangerous animals have been spotted]`

**Expected LLM Response**:
> "Thank goodness! Wolves have been terrorizing the roads. Can you hunt one down? I'll pay 30 coins."

---

### 2. URGENT - Many Dangerous Animals (60% probability)
**Trigger**:
- 3+ dangerous animals nearby
- Any NPC profession

**Context Hint**:
> `[They seem distressed, clearly troubled by the dangerous wildlife in the area]`

**Expected LLM Response**:
> "You... you've seen the wolves, haven't you? We need help. Someone capable. I can pay..."

---

### 3. OPPORTUNISTIC - Ruins + Scholar (55% probability)
**Trigger**:
- Ancient ruins or archaeological site nearby
- NPC is scholar, scribe, or priest

**Context Hint**:
> `[They seem eager to discuss something, their eyes occasionally drifting toward the ancient ruins nearby]`

**Expected LLM Response**:
> "Ah, those ruins to the north... fascinating, aren't they? I'd investigate myself, but at my age... If you explore them and bring back any artifacts or writings, I'll pay handsomely. 40 coins."

---

### 4. BUSINESSLIKE - Merchant + Market (45% probability)
**Trigger**:
- Market or bazaar nearby
- NPC is merchant or trader

**Context Hint**:
> `[They size you up with a practiced, businesslike eye]`

**Expected LLM Response**:
> "You look capable. I need someone to fetch goods from the marketplace. Interested? 20 coins."

---

### 5. PRACTICAL - Craftsman (40% probability)
**Trigger**:
- Any animals nearby
- NPC is craftsman (smith, tanner, weaver, potter)

**Context Hint**:
> `[They glance at you with professional interest, as if assessing your capabilities]`

**Expected LLM Response**:
> "A traveler, eh? I could use someone like you. I need deer hides - bring me 3 and I'll pay 25 coins."

---

### 6. BUSINESSLIKE - High Conscientiousness (30% probability)
**Trigger**:
- NPC personality: extraversion > 60 AND conscientiousness > 50
- Low agreeableness (not overly friendly)

**Context Hint**:
> `[They regard you with a direct, no-nonsense gaze]`

**Expected LLM Response**:
> "I don't waste time. I have work that needs doing. You interested or not?"

---

### 7. FRIENDLY - High Agreeableness (25% probability)
**Trigger**:
- NPC personality: agreeableness > 60 AND extraversion > 50

**Context Hint**:
> `[They seem friendly and open, as if they've been hoping to talk to someone]`

**Expected LLM Response**:
> "Oh, hello! It's so nice to have someone to talk to. Actually, I could use some help if you're not too busy..."

---

### 8. DEFAULT - No Match (0% probability)
**Trigger**: None of the above conditions met

**Context Hint**: None - normal greeting

**LLM Response**: Standard greeting based on personality/context

## Technical Implementation

### Files Modified

#### 1. `services/workOfferService.ts` (+100 lines)
Added `calculateProactiveWorkContext()` function that performs fast context checks.

#### 2. `components/EncounterModalUpdated.tsx` (+30 lines)
- Import new function (line 56)
- Add useMemo for context calculation (lines 373-392)
- Modify greeting generation (lines 513-523)

### Integration Flow

```
Player encounters NPC
     ↓
useMemo calculates work context (instant, JavaScript only)
- Gets nearby animals (within 50 tiles)
- Gets nearby structures (from mapData)
- Checks NPC profession & personality
- Returns context hint if appropriate
     ↓
Initial dialogue generation
- Base greeting: "Hello." or "I approach again."
- If context.shouldOffer: Add context hint
- Example: "Hello. [They look worried about wolves nearby]"
     ↓
SAME LLM call as before (no extra latency!)
- LLM receives enhanced greeting
- Naturally responds to context hint
- Generates work offer in dialogue
     ↓
Player sees natural conversation
- NPC mentions work opportunity contextually
- Player can accept, decline, discuss, or ignore
```

### Code Example

```typescript
// In EncounterModalUpdated.tsx

// Calculate context once when modal opens (fast!)
const workContext = useMemo(() => {
    if (!isNpc(currentTarget) || !mapData) {
        return { shouldOffer: false, contextHint: "", probability: 0 };
    }

    const npcPos = { x: currentTarget.x, y: currentTarget.y };
    const nearbyAnimals = mapData.animals?.filter(animal => {
        const dx = animal.x - npcPos.x;
        const dy = animal.y - npcPos.y;
        return Math.sqrt(dx * dx + dy * dy) <= 50;
    }) || [];

    const nearbyStructures = mapData.terrainStructures || [];

    return calculateProactiveWorkContext(
        currentTarget,
        mapData,
        nearbyAnimals,
        nearbyStructures
    );
}, [currentTarget, mapData]);

// Enhance greeting with context
const baseGreeting = hasMetBefore ? "I approach again." : "Hello.";
const greeting = workContext.shouldOffer
    ? `${baseGreeting} ${workContext.contextHint}`
    : baseGreeting;

// SAME dialogue generation call - no changes!
generateEncounterDialogue(currentTarget, [], greeting, ...)
```

## Benefits

### Immersion
- World feels reactive and alive
- NPCs have agency and awareness
- Natural storytelling emerges from context

### Player Experience
- No tedious "do you have work?" every time
- Important work opportunities surface naturally
- Player choice preserved - can ignore and talk normally

### Performance
- **Zero latency added** - Pure JavaScript calculation
- **No extra LLM calls** - Same dialogue generation
- **Minimal memory** - Uses existing loaded data

### Simplicity
- **~130 lines total** across 2 files
- **No new types** needed
- **No new storage** required
- **No new UI components**
- **Builds on existing systems** rather than adding complexity

## Example Player Experiences

### Scenario 1: Guard with Wolf Problem
```
[Player encounters guard near wolf pack]

Guard: "Thank goodness! Wolves have been terrorizing the roads.
Hunt one down and I'll pay 30 coins. We need someone capable."

Player options:
- "I'll do it." → Work offer accepted
- "That's a lot of wolves..." → Continue conversation
- "Tell me more about these attacks." → Gather info
- "Not my problem." → Decline and leave
```

### Scenario 2: Scholar Near Ruins
```
[Player encounters elderly scholar near ancient temple]

Scholar: "Ah, those ruins to the north fascinate me. I'd explore
them myself, but at my age... If you investigate and bring back
any artifacts or writings, I'll pay 40 coins."

Player options:
- "I'll explore them." → Work offer accepted
- "What do you know about them?" → Lore discussion
- "Maybe later." → Defer decision
- Ignore and ask something else → Normal conversation
```

### Scenario 3: Shy Farmer (No Proactive Offer)
```
[Player encounters farmer, low extraversion]

Farmer: "Oh, uh... hello. Nice weather."

[Player must ask about work]
Player: "Do you need any help?"

Farmer: "Well... now that you mention it..."
```

## Debugging

Console logs show when proactive offers occur:

```
[Proactive Work] Marcus (Guard) offering work at 80% probability
```

Check console to see:
- Which NPCs are making proactive offers
- What profession triggered it
- The calculated probability

## Future Enhancements

Potential improvements (not implemented yet):

1. **Reputation gating** - Higher rep = more proactive offers
2. **Time of day** - Urgent offers at certain hours
3. **Player appearance** - Well-armed player gets hunting offers
4. **Economic conditions** - Trade offers when markets are busy
5. **Seasonal patterns** - Harvest quests in autumn
6. **Relationship memory** - Past work completion affects offers

All of these would just modify the `calculateProactiveWorkContext` function - no changes needed elsewhere!

## Testing Checklist

- [ ] Talk to guard near wolves → Should mention wolf problem
- [ ] Talk to scholar near ruins → Should mention exploration opportunity
- [ ] Talk to merchant near market → Should mention trade goods
- [ ] Talk to tanner (any location) → Might mention need for hides
- [ ] Talk to shy/low extraversion NPC → Should NOT proactively offer (normal greeting)
- [ ] Decline proactive offer → Should allow normal conversation
- [ ] Ignore proactive offer, ask about work → Should still generate work normally
- [ ] Check console logs → Should show probability for debugging

## Notes

- System is **additive, not replacing** - Manual work requests still work
- Context hints are **subtle suggestions**, not commands - LLM can respond naturally
- No changes to **existing work offer generation** system
- No changes to **quest tracking** or **completion mechanics**
- Completely **backwards compatible** - If context system fails, defaults to normal greeting
