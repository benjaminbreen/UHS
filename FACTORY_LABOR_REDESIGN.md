# Factory Labor Minigame - Revised Design
**Fast, Integrated, & Historically Authentic**

## Core Principle
**"5 Minutes, 5 Choices, 1 Outcome"**

No grinding, no tedium. A focused narrative experience where player choices matter and directly affect the game world.

---

## Visual Layout (Era-Specific Styling)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FACTORY BANNER (matches FactoryBanner.tsx styling)                      │
│ [Cultural/Era-specific factory illustration with workers, machines]     │
│ Lowell Textile Mill • 1845 • Massachusetts • Shift 1/1                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────┬───────────────────────────┐
│ WORK NARRATIVE (Left Panel)                 │ FACTORY STATE (Right)     │
│                                              │                           │
│ [Scrolling History]                         │ ┌───────────────────────┐ │
│ ═══════════════════════════════════          │ │ SHIFT STATUS          │ │
│                                              │ │ Progress: ████░░ 80%  │ │
│ NARRATOR: The morning bell clangs at 5 AM.  │ │ Time: 08:42 / 12:00   │ │
│ You join 300 other workers streaming into   │ │ Choices Made: 4/5     │ │
│ the mill. The air inside is thick with      │ └───────────────────────┘ │
│ cotton lint, and the deafening roar of      │                           │
│ power looms shakes the floorboards.          │ ┌───────────────────────┐ │
│                                              │ │ YOUR STATS            │ │
│ Overseer Carter eyes you coldly. "Loom      │ │ Health: 72 (-8)       │ │
│ #17," he barks. "Quota: 100 yards today."   │ │ Fatigue: 34 (+12)     │ │
│                                              │ │ Wages Earned: $0.42   │ │
│ CHOICE 1/5: Starting Position               │ └───────────────────────┘ │
│ ───────────────────────────────              │                           │
│ The mill is chaotic. What's your approach?  │ ┌───────────────────────┐ │
│                                              │ │ FACTORY EFFICIENCY    │ │
│ ▶ [Keep my head down and work quietly]      │ │ Output: 187 units/hr  │ │
│ ▶ [Introduce myself to nearby workers]      │ │ Worker Morale: 42%    │ │
│ ▶ [Ask the overseer for detailed            │ │ Supply Chain: ████░   │ │
│    instructions about the loom]             │ │ Injury Rate: 0.31     │ │
│                                              │ └───────────────────────┘ │
│                                              │                           │
│ [Input box for custom responses]            │ ┌───────────────────────┐ │
│ Type custom action (optional) ...           │ │ FACTORY WORKERS       │ │
│                                              │ │                       │ │
│                                              │ │ 👨 Mary O'Brien (28)  │ │
│                                              │ │    Spinner • Morale 38│ │
│                                              │ │                       │ │
│                                              │ │ 👧 Sarah Mills (12)   │ │
│                                              │ │    Doffer • Morale 51 │ │
│                                              │ │                       │ │
│                                              │ │ 👨 James Carter (45)  │ │
│                                              │ │    Overseer • Morale 62│ │
│                                              │ └───────────────────────┘ │
│                                              │                           │
└─────────────────────────────────────────────┴───────────────────────────┘
```

### Era-Specific Aesthetic Themes

**Early Modern (1450-1800)** - Plantations, Workshops
- Warm earth tones (sienna, ochre, raw umber)
- Parchment-like backgrounds
- Hand-drawn illustration style
- Soft, organic shapes
- Sepia overlay effect

**Industrial Era (1800-1920)** - Mills, Factories
- Dark grays, blacks, rust reds
- Steam/smoke particles
- Mechanical gear motifs
- Sharp, industrial typography
- High contrast lighting

**Modern Era (1920+)** - Assembly Lines, Electronics
- Bright whites, chrome grays, safety yellows
- Clean lines, minimalist UI
- Fluorescent lighting effects
- Sans-serif typography
- Blueprint grid patterns

---

## Gameplay Structure: 5 Narrative Moments

### Moment 1: Shift Start (Choice 1/5)
**Time: 0:00 - Context Setting**

Pre-generated text establishes:
- Factory type (from `factoryTypes.ts`)
- Historical context (era, cultural zone, working conditions)
- Your role (determined by player profession/skills)
- Today's task

**Choice Type: Social Positioning**
- How do you present yourself to coworkers?
- Affects: NPC relationships, future dialogue options

### Moment 2: Work Challenge (Choice 2/5)
**Time: 0:30 - Core Task**

Pre-generated scenario based on factory type:
- **Textile Mill**: Thread breaks on your loom during a speed test
- **Steel Mill**: Furnace temperature is dangerously high
- **Plantation**: Quota is impossible without overexertion
- **Assembly Line**: Defective part discovered

**Choice Type: Skill vs. Safety**
- Risk injury for better output?
- Affects: Health, wages, factory efficiency, overseer opinion

### Moment 3: Social Dilemma (Choice 3/5)
**Time: 1:30 - Moral Choice**

Generated from `factoryEconomyService.getFactoryDialogue()`:
- Co-worker needs help (child laborer, injured worker, union organizer)
- Each factory type has authentic historical dilemmas
- Pre-written, not LLM-generated (for speed)

**Choice Type: Ethics vs. Self-Interest**
- Help coworker and risk your own position?
- Affects: NPC relationships, potential quest triggers, moral reputation

### Moment 4: Authority Interaction (Choice 4/5)
**Time: 3:00 - Power Dynamics**

Overseer/supervisor interaction based on your prior choices:
- Praise if you've been productive
- Suspicion if you've helped others
- Pressure if you're falling behind quota

**Choice Type: Confrontation Handling**
- How do you respond to authority?
- Affects: Job security, wages, future opportunities

### Moment 5: Shift End Decision (Choice 5/5)
**Time: 4:00 - Consequence Setting**

The shift is ending. Final choice determines immediate outcome:
- Work overtime for extra pay (more fatigue, more coins)?
- Join coworkers at tavern (build relationships, spend coins)?
- Go straight home (rest, save money)?

**Choice Type: Resource Allocation**
- Trade-offs between money, health, social capital
- Affects: Next shift availability, NPC events, inventory

---

## Single LLM Call (at 4:30 mark)

**Function: `generateFactoryShiftAssessment()`**

**Input Context:**
```typescript
{
  factoryType: FactoryType,
  playerChoices: [choice1, choice2, choice3, choice4, choice5],
  playerStats: { health, fatigue, skills },
  factoryState: { efficiency, morale, output },
  coworkerRelationships: NpcRelation[],
  era: HistoricalEra,
  culturalZone: CulturalZone
}
```

**LLM Prompt Template:**
```
You are the overseer at a {factoryName} in {location}, {era}. A worker just completed
their shift. Based on their actions, provide a 2-3 sentence assessment.

WORKER ACTIONS:
- Start: {choice1}
- Work: {choice2}
- Social: {choice3}
- Authority: {choice4}
- End: {choice5}

PERFORMANCE METRICS:
- Output: {outputPercent}% of quota
- Injury avoided: {noInjury}
- Coworker relations: {socialScore}

Respond in character as a {era} {culturalZone} overseer. Be historically authentic.
Include: Performance judgment, wage amount, future employment status.
```

**Output Format:**
```json
{
  "dialogue": "You've proven yourself capable, if a bit soft on the slackers...",
  "tone": "grudging_approval" | "disappointed" | "impressed" | "hostile",
  "wageMultiplier": 0.7 - 1.3,
  "futureOpportunities": ["promoted", "fired", "union_contact", "none"],
  "achievements": ["first_shift_survivor", "quota_crusher", "worker_advocate"]
}
```

---

## Economic Integration

### Factory Production Impact

Player's choices directly modify `FactoryProduction` via `factoryEconomyService.ts`:

**Choice 2 (Work Challenge) affects:**
```typescript
production.efficiency += skillSuccess ? 0.05 : -0.03;
production.currentOutput += outputBonus;
```

**Choice 3 (Social Dilemma) affects:**
```typescript
workforce.conditions.morale += helpedCoworker ? 10 : -5;
workforce.conditions.turnoverRate += helpedCoworker ? -0.05 : 0.02;
```

**Shift Completion:**
```typescript
// Add to factory inventory
factoryType.outputGoods.forEach(good => {
  const quantity = baseProduction * playerContribution * efficiencyMultiplier;
  production.inventory[good] += quantity;
});
```

### NPC Relationship System

**Coworkers Remember Your Actions:**

```typescript
interface WorkerMemory {
  playerHelpedMe: boolean;
  playerSnitchedOnMe: boolean;
  playerSharedFood: boolean;
  timesWorkedTogether: number;
  trustLevel: 0-100;
}
```

**Triggers Future Events:**
- **High trust**: Union organizers contact you, better job offers
- **Low trust**: Coworkers sabotage your work, exclusion from social groups
- **Very low**: Worker confrontations, potential combat encounters

### Procedural Item Generation

**Shift Completion Rewards:**

```typescript
// Wages (in coins)
const baseWage = factoryType.workingConditions.baseWage;
const finalWage = baseWage * llmWageMultiplier * hoursWorked;
player.inventory.coins += finalWage;

// Factory Output (if high performance)
if (playerOutputPercent > 90) {
  const outputItem = generateProceduralItem({
    category: factoryType.outputGoods[0],
    quality: 'standard',
    quantity: randomInt(1, 3),
    era: mapData.era,
    culturalZone: mapData.culturalZone
  });
  player.inventory.push(outputItem);

  // Example: Player at textile mill gets "Bolt of Cotton Cloth (3 units)"
}

// Injury Items (if health < 50)
if (player.health < 50) {
  const injury = {
    name: "Factory Injury",
    category: "StatusEffect",
    duration: randomInt(3, 7), // days
    effect: { speed: -20, dexterity: -10 }
  };
  player.statusEffects.push(injury);
}
```

---

## File Structure

### New Files to Create

```
components/factory/
├── FactoryLaborPanel.tsx          (Main container, like FarmPanelContainer)
├── FactoryWorkArea.tsx            (Left panel narrative display)
├── FactoryStatsSidebar.tsx        (Right panel with real-time stats)
├── FactoryChoiceCard.tsx          (Reusable choice button component)
└── FactoryShiftResults.tsx        (Final assessment modal)

hooks/
├── useFactoryShift.ts             (Main game logic hook)
└── useFactoryLLM.ts               (LLM integration for assessment)

services/
├── factoryShiftService.ts         (Shift state management)
├── factoryChoiceGenerator.ts      (Pre-written choice scenarios)
└── factoryRewardService.ts        (Calculate wages, items, effects)

constants/gameData/
└── factoryScenarios.ts            (Pre-written moments 1-5 per factory type)
```

### Integration Points

**Trigger from Map:**
```typescript
// In MapDisplayOptimized.tsx
if (tile.biomeType === 'INDUSTRIAL_DISTRICT' && tile.terrainStructure?.structureType === 'factory') {
  <button onClick={() => setActiveModal('factoryLabor')}>
    Work Shift
  </button>
}
```

**Pass to Panel:**
```typescript
<FactoryLaborPanel
  factoryStructure={tile.terrainStructure}
  factoryType={getFactoryType(mapData.era, mapData.culturalZone, mapData.region)}
  playerCharacter={playerCharacter}
  mapData={mapData}
  npcs={nearbyNpcs}
  onShiftComplete={(results) => handleFactoryShiftComplete(results)}
  onClose={() => setActiveModal(null)}
/>
```

---

## Pre-Written Scenario Example

### Textile Mill (Industrial Era, North American Colonial)

```typescript
export const TEXTILE_MILL_1845: FactoryShiftScenario = {
  factoryId: 'textile_mill',
  era: 'INDUSTRIAL_ERA',
  culturalZone: 'NORTH_AMERICAN_COLONIAL',

  moment1: {
    narrative: `The morning bell clangs at 5 AM. You join 300 other workers—mostly women and children—streaming into the Lowell Textile Mill. The air inside is thick with cotton lint, and the deafening roar of power looms shakes the wooden floorboards.

Overseer Carter, a stern man with cold eyes, looks you up and down. "Loom #17," he barks. "Quota: 100 yards today. Fall behind and you'll be fined."

The mill is a maze of dangerous machinery. What's your approach?`,

    choices: [
      {
        id: 'head_down',
        text: 'Keep my head down and work quietly',
        effects: { safety: 10, social: -5, overseer: 5 },
        coworkerReaction: 'Mary O\'Brien gives you a wary glance but says nothing.'
      },
      {
        id: 'introduce',
        text: 'Introduce myself to nearby workers',
        effects: { safety: 0, social: 15, overseer: -5 },
        coworkerReaction: 'Sarah Mills, a young doffer, smiles shyly. "I\'m Sarah. Been here three years, since I was nine."'
      },
      {
        id: 'ask_instructions',
        text: 'Ask the overseer for detailed instructions',
        effects: { safety: 15, social: 0, overseer: 10 },
        coworkerReaction: 'Carter seems surprised but explains the loom operation thoroughly.'
      }
    ]
  },

  moment2: {
    narrative: `Two hours into your shift, a thread breaks on your loom during Carter's speed inspection. If you can't fix it quickly, you'll fall behind quota. But the shuttle mechanism is jammed, and forcing it could injure your hands.

Other workers are watching. Carter is approaching.`,

    choices: [
      {
        id: 'force_repair',
        text: 'Force the mechanism—you need to make quota',
        skillCheck: { attribute: 'dexterity', dc: 14 },
        successEffects: { output: 20, safety: 0, health: 0 },
        failureEffects: { output: 0, safety: -20, health: -15 },
        successNarrative: 'You carefully manipulate the shuttle. It clicks back into place. Carter nods approvingly.',
        failureNarrative: 'The mechanism snaps. Blood spurts from your thumb. You cry out in pain as the loom grinds to a halt.'
      },
      {
        id: 'ask_help',
        text: 'Ask Mary, the experienced spinner, for help',
        effects: { output: 10, social: 15, safety: 10 },
        narrative: 'Mary hurries over and expertly unjams the shuttle in seconds. "Happens all the time," she whispers. "Don\'t force it."'
      },
      {
        id: 'call_mechanic',
        text: 'Stop the loom and call the mechanic',
        effects: { output: -10, safety: 20, overseer: -10 },
        narrative: 'Carter glares at you. "That\'ll be docked from your pay." The mechanic takes 15 minutes to arrive.'
      }
    ]
  },

  moment3: {
    narrative: `During the brief lunch break, Sarah (the 12-year-old doffer) approaches you, tears in her eyes. "I can't keep up," she whispers. "My hands are bleeding and Carter said if I slow down again, he'll dock my mother's pay too."

She's visibly exhausted and limping. If she continues at this pace, she could be seriously injured.`,

    choices: [
      {
        id: 'help_sarah',
        text: 'Offer to help her with her work after lunch',
        effects: { output: -15, social: 25, overseer: -15, health: -5, fatigue: 10 },
        narrative: 'You spend the afternoon running between your loom and Sarah\'s work, helping her lift heavy bobbins. Your own quota suffers, but Sarah makes it through the day. She squeezes your hand gratefully.',
        npcEffect: { npcId: 'sarah_mills', relationship: 40, unlocks: 'child_labor_quest' }
      },
      {
        id: 'give_food',
        text: 'Share your lunch with her—she needs energy',
        effects: { output: 0, social: 10, health: -3, fatigue: 5 },
        inventory: { remove: [{ name: 'Bread', quantity: 1 }] },
        narrative: 'Sarah devours the bread hungrily. "Thank you," she whispers. It\'s not much, but it helps.',
        npcEffect: { npcId: 'sarah_mills', relationship: 15 }
      },
      {
        id: 'ignore',
        text: 'Tell her you can't risk your own job',
        effects: { output: 5, social: -20, overseer: 0 },
        narrative: 'Sarah\'s face crumples. She turns away without a word. You hear her crying softly as she limps back to work.',
        npcEffect: { npcId: 'sarah_mills', relationship: -30 }
      },
      {
        id: 'report_carter',
        text: 'Report Carter's treatment to the mill supervisor',
        effects: { output: 0, social: 30, overseer: -40 },
        narrative: 'The supervisor listens but does nothing. Word spreads quickly. Carter glares at you with open hostility. Other workers whisper approvingly.',
        npcEffect: { npcId: 'james_carter', relationship: -50, unlocks: 'overseer_revenge_event' }
      }
    ]
  },

  moment4: {
    // Generated based on previous choices + current output
    dynamic: true,
    generator: (context) => {
      const { overseerRelation, outputPercent, socialScore } = context;

      if (overseerRelation > 15 && outputPercent > 90) {
        return {
          narrative: `Carter approaches as the afternoon bell rings. For once, he's not scowling. "You've got a knack for this work," he says gruffly. "I'm putting you on the new power looms next week. Better pay, but longer hours. You interested?"`,
          choices: [
            {
              id: 'accept_promotion',
              text: 'Accept the promotion',
              effects: { wages: 30, future: 'promoted' }
            },
            {
              id: 'decline_politely',
              text: 'Decline—the hours are already too long',
              effects: { overseer: -10, future: 'remained_laborer' }
            }
          ]
        };
      } else if (overseerRelation < -10 || outputPercent < 60) {
        return {
          narrative: `Carter corners you near the spinning room. "You're not working out," he says coldly. "This is your last shift unless you can prove yourself. Tomorrow, double quota or you're done."`,
          choices: [
            {
              id: 'beg',
              text: 'Beg for another chance',
              effects: { overseer: 5, future: 'on_probation' }
            },
            {
              id: 'challenge',
              text: 'Challenge him—the quota is impossible',
              effects: { overseer: -20, social: 15, future: 'fired_or_union' }
            }
          ]
        };
      } else {
        return {
          narrative: `Carter glances at your loom as he passes. "Adequate," he mutters. "Keep this up and you'll keep your job." He moves on without further comment.`,
          choices: [
            {
              id: 'continue',
              text: 'Continue working',
              effects: {}
            }
          ]
        };
      }
    }
  },

  moment5: {
    narrative: `The 6 PM whistle blows. Your shift is over. You've worked 13 hours with one short break. Your body aches, your lungs burn from cotton dust, and your hands are raw.

Mary and a few other workers are heading to Paddy's Tavern for a drink. Sarah waves goodbye as her mother collects her. Carter is watching from the office window.

What do you do?`,

    choices: [
      {
        id: 'overtime',
        text: 'Volunteer for 2 hours overtime (extra $0.15)',
        effects: { wages: 15, fatigue: 15, health: -5, overseer: 15 },
        narrative: 'Carter looks surprised but nods approval. "Now that\'s the kind of worker I need."'
      },
      {
        id: 'tavern',
        text: 'Join the workers at the tavern ($0.10 cost)',
        effects: { social: 20, fatigue: -5, coins: -10 },
        narrative: 'The workers welcome you warmly. Over ale and song, you hear stories of organizing a union, of strikes in other mills, of hope for change.',
        unlocks: 'union_organizer_contact'
      },
      {
        id: 'home',
        text: 'Go straight home and rest',
        effects: { fatigue: -10, health: 5 },
        narrative: 'You collapse into bed at your boarding house. Tomorrow, you\'ll do it all again.'
      }
    ]
  },

  shiftSummary: {
    baseWage: 0.50, // 50 cents for 13-hour shift in 1845
    quotaTarget: 100,
    maxOutput: 120
  }
};
```

---

## Implementation Priority

### Phase 1: Core Mechanics (Week 1)
- [ ] `FactoryLaborPanel.tsx` - Basic UI layout
- [ ] `useFactoryShift.ts` - State management for 5 choices
- [ ] `factoryScenarios.ts` - Pre-written scenarios for 3 factory types (textile, steel, plantation)
- [ ] Basic stat tracking (health, fatigue, wages, output)

### Phase 2: Integration (Week 2)
- [ ] Connect to `factoryEconomyService.ts`
- [ ] Modify `FactoryProduction` based on player actions
- [ ] NPC relationship system integration
- [ ] Procedural item rewards

### Phase 3: LLM & Polish (Week 3)
- [ ] `useFactoryLLM.ts` - Single assessment call
- [ ] Era-specific UI themes
- [ ] Sound effects (machinery, whistles, ambient)
- [ ] Achievement system

### Phase 4: Expansion (Week 4+)
- [ ] Add 15 more factory types (all eras, all cultural zones)
- [ ] Dynamic moment 4 generator for all scenarios
- [ ] Quest hooks (union organizing, strikes, reforms)
- [ ] Multi-day shift progression system

---

## Why This Design Works

### 1. **Respects Player Time**
- 5 minutes = satisfying gameplay loop
- No waiting, no grinding
- Meaningful from start to finish

### 2. **Creates Real Stakes**
- Health loss persists in main game
- NPCs remember your actions
- Economic impacts affect world
- Moral choices have consequences

### 3. **Historically Educational**
- Each scenario teaches real labor history
- Authentic working conditions
- Cultural differences respected
- Era-appropriate challenges

### 4. **Integrates Seamlessly**
- Uses existing factory infrastructure
- Enhances (doesn't replace) economic system
- Creates new quest opportunities
- Rewards match game's item system

### 5. **Scales Beautifully**
- Easy to add new factory types (just more scenario files)
- Can expand to multi-shift campaigns
- Union organizing minigame could branch from this
- Strike/negotiation mechanics natural extension

---

## Comparison: Prototype vs. Revised

| Feature | Prototype | Revised Design |
|---------|-----------|----------------|
| **Duration** | 6+ hours | 5 minutes |
| **Player Actions** | 20+ tasks | 5 meaningful choices |
| **LLM Calls** | 4 (intro, 2 events, end) | 1 (final assessment only) |
| **Timing Games** | Yes (arcade-style) | No (choice-driven) |
| **Economic Integration** | None | Full (production, supply, NPCs) |
| **Era Coverage** | Industrial USA only | All 3 eras, all 9 zones |
| **Visual Style** | Generic factory | Era/culture-specific |
| **Outcomes Matter** | Only show stats | Affect world, NPCs, quests |

---

## Next Steps

1. **Review this design** - Does this match your vision?
2. **Pick starting factories** - Which 3 types should I implement first?
3. **Write first scenario** - I'll create complete `TEXTILE_MILL_1845` example
4. **Build UI mockup** - Create `FactoryLaborPanel.tsx` with placeholder data
5. **Test gameplay loop** - Make sure 5 minutes feels right

What do you think? Should I proceed with Phase 1 implementation?
