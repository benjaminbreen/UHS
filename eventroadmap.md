# Event System Roadmap

## Overview
A dual-mode event generation system that creates dynamic, contextual events based on 8 distinct game modes. The system operates in two versions:
1. **Pure Procedural**: Template-based events with variable substitution - no LLM required
2. **LLM-Enhanced**: WorldWeaver integration for historically specific scenarios and custom events

## Architecture Overview

### Core Event System
```typescript
// File: types/eventTypes.ts (to be created)
interface GameMode {
  id: string;
  name: string;
  description: string;
  eventArchetypes: EventArchetype[];  // Only 3-4 per mode
  victoryConditions: VictoryCondition[];
  defaultWeight: number;  // How often events trigger (0.1 - 1.0)
}

interface EventArchetype {
  id: string;
  template: string;  // Base description with [PLACEHOLDER] variables
  triggers: EventTrigger[];  // Simple conditions
  outcomes: EventOutcome[];  // 2-3 possible results per archetype
  variables: TemplateVariable[];  // What can be substituted
}

interface EventTrigger {
  type: 'low_resource' | 'near_location' | 'time_based' | 'stat_check' | 'random';
  condition: string;  // e.g., "health < 30", "near_city", "day % 7 == 0"
  probability: number;  // 0.0 to 1.0
}

interface EventOutcome {
  id: string;
  description: string;
  statChecks?: string[];  // e.g., ["wisdom > 12", "charisma > 10"]
  effects: EventEffect[];
  weight: number;  // For random selection when no stat check
}

interface EventEffect {
  type: 'stat_change' | 'item_add' | 'reputation' | 'location' | 'quest';
  target: string;
  value: number | string;
}
```

## The 8 Game Modes

### Mode 1: Survival Mode
**Theme**: Overcome existential threats through resourcefulness
**Victory Conditions**: 
- Survive X days 
- Reach safety location
- Cure critical condition

**Event Archetypes (3)**:

1. **Resource Crisis**
   - Template: "Your [RESOURCE] is running dangerously low. [CONTEXT]"
   - Variables: RESOURCE (food/water/fuel/medicine), CONTEXT (weather/situation specific)
   - Triggers: Resource < 20%, Random daily
   - Outcomes:
     - Find/forage (Wisdom check): Gain 10-30 resource
     - Trade/barter (Charisma check): Exchange items
     - Steal/take (Dexterity check): Risk reputation
     - Go without: Lose health

2. **Environmental Threat**
   - Template: "[HAZARD] threatens your survival. You must act quickly."
   - Variables: HAZARD (storm/fire/flood/avalanche/heat/cold)
   - Triggers: Season-based, Random
   - Outcomes:
     - Seek shelter (Intelligence): Avoid damage
     - Flee area (Constitution): Change location
     - Endure (Strength): Take damage, gain experience

3. **Health Emergency**
   - Template: "You are suffering from [CONDITION]. [SYMPTOMS]"
   - Variables: CONDITION (fever/injury/infection/exhaustion), SYMPTOMS
   - Triggers: Low health, Combat result, Random
   - Outcomes:
     - Seek treatment (Find healer/medicine)
     - Rest and recover (Time cost)
     - Push through (Risk worsening)

### Mode 2: Exploration Mode
**Theme**: Document and understand new places and peoples
**Victory Conditions**: 
- Map X tiles
- Make major discovery
- Complete expedition goals

**Event Archetypes (3)**:

1. **Discovery Opportunity**
   - Template: "You notice [SIGNS] indicating [DISCOVERY] nearby."
   - Variables: SIGNS (tracks/ruins/vegetation), DISCOVERY (settlement/resource/landmark)
   - Triggers: Enter new tile, Perception check
   - Outcomes:
     - Investigate thoroughly (Time cost, full reward)
     - Quick survey (Partial information)
     - Mark and continue (Add to map, no reward)

2. **Navigation Challenge**
   - Template: "Your path is blocked by [OBSTACLE]. [DESCRIPTION]"
   - Variables: OBSTACLE (river/mountain/dense forest/swamp), DESCRIPTION
   - Triggers: Terrain type, Weather
   - Outcomes:
     - Find alternate route (Wisdom): Extra time
     - Force through (Strength): Risk injury
     - Turn back: Lose progress

3. **Local Encounter**
   - Template: "[GROUP] approach your expedition. They appear [DEMEANOR]."
   - Variables: GROUP (hunters/traders/warriors/pilgrims), DEMEANOR (curious/suspicious/friendly)
   - Triggers: Near settlements, Random
   - Outcomes:
     - Trade and learn (Charisma): Information + items
     - Share knowledge (Intelligence): Reputation gain
     - Avoid contact (Dexterity): No effect

### Mode 3: Commerce Mode
**Theme**: Build prosperity through trade and business
**Victory Conditions**: 
- Accumulate X wealth
- Establish trade monopoly
- Build successful business

**Event Archetypes (4)**:

1. **Market Opportunity**
   - Template: "[GOODS] prices have [CHANGED] due to [REASON]."
   - Variables: GOODS (grain/silk/spices/metals), CHANGED (risen/fallen), REASON (war/harvest/discovery)
   - Triggers: Location change, Time-based
   - Outcomes:
     - Buy in bulk (Invest heavily)
     - Modest investment (Safe profit)
     - Wait and observe (Information gain)

2. **Competition**
   - Template: "A rival merchant [ACTION] affecting your business."
   - Variables: ACTION (undercuts prices/spreads rumors/blocks suppliers)
   - Triggers: Success threshold reached
   - Outcomes:
     - Compete directly (Wealth check)
     - Form alliance (Charisma)
     - Find new market (Intelligence)

3. **Investment Offer**
   - Template: "Opportunity to invest in [VENTURE]. [RISK_LEVEL] risk."
   - Variables: VENTURE (new route/workshop/ship/mine), RISK_LEVEL (low/moderate/high)
   - Triggers: Have sufficient wealth
   - Outcomes:
     - Full investment (High risk/reward)
     - Partial investment (Moderate risk/reward)
     - Decline (No change)

4. **Regulatory Issue**
   - Template: "Authorities demand [REQUIREMENT] for your [BUSINESS_ASPECT]."
   - Variables: REQUIREMENT (taxes/permits/bribes), BUSINESS_ASPECT (goods/route/shop)
   - Triggers: Periodic, Success-based
   - Outcomes:
     - Full compliance (Cost)
     - Negotiate (Charisma check)
     - Relocate (Change location)

### Mode 4: Scholarship Mode
**Theme**: Advance human knowledge and understanding
**Victory Conditions**: 
- Make significant discovery
- Publish influential work
- Establish school/library

**Event Archetypes (3)**:

1. **Research Progress**
   - Template: "Your study of [SUBJECT] reveals [FINDING]. This could be [SIGNIFICANCE]."
   - Variables: SUBJECT (astronomy/medicine/mathematics/nature), FINDING, SIGNIFICANCE (revolutionary/controversial/profitable)
   - Triggers: Time studying, Intelligence checks
   - Outcomes:
     - Pursue further (Deep discovery)
     - Publish immediately (Quick fame)
     - Keep secret (Avoid controversy)

2. **Academic Politics**
   - Template: "A colleague [INTERACTION] regarding your work on [TOPIC]."
   - Variables: INTERACTION (offers collaboration/challenges/steals), TOPIC
   - Triggers: Reputation level, Publication
   - Outcomes:
     - Collaborate (Share credit)
     - Compete (Winner takes all)
     - Ignore (Maintain independence)

3. **Funding Crisis**
   - Template: "Your patron [SITUATION]. Your research funding is [STATUS]."
   - Variables: SITUATION (dies/loses interest/demands results), STATUS (threatened/reduced/withdrawn)
   - Triggers: Periodic, Lack of progress
   - Outcomes:
     - Find new patron (Charisma)
     - Commercialize research (Compromise)
     - Continue unfunded (Hardship)

### Mode 5: Leadership Mode
**Theme**: Guide a community through challenges
**Victory Conditions**: 
- Community survives crisis
- Implement X reforms
- Maintain peace for X years

**Event Archetypes (4)**:

1. **Crisis Decision**
   - Template: "Your community faces [CRISIS]. The people look to you for guidance."
   - Variables: CRISIS (famine/disease/invasion/disaster)
   - Triggers: Random, Seasonal
   - Outcomes:
     - Authoritarian response (Force)
     - Democratic consultation (Time)
     - Personal sacrifice (Resources)

2. **Resource Allocation**
   - Template: "[GROUP] demands more [RESOURCE]. Others will suffer if you agree."
   - Variables: GROUP (farmers/soldiers/clergy/merchants), RESOURCE (food/funds/labor)
   - Triggers: Scarcity conditions
   - Outcomes:
     - Grant request (Group happy, others angry)
     - Refuse (Group angry, others neutral)
     - Compromise (All slightly unhappy)

3. **External Threat**
   - Template: "[EXTERNAL_FORCE] threatens your people. They demand [DEMAND]."
   - Variables: EXTERNAL_FORCE (empire/raiders/rival city), DEMAND (tribute/submission/territory)
   - Triggers: Periodic, Weakness
   - Outcomes:
     - Military resistance (Strength)
     - Diplomatic solution (Charisma)
     - Strategic retreat (Wisdom)

4. **Internal Conflict**
   - Template: "[FACTION] challenges your authority over [ISSUE]."
   - Variables: FACTION (nobles/clergy/merchants/military), ISSUE (taxes/laws/succession)
   - Triggers: Low morale, Policy changes
   - Outcomes:
     - Suppress dissent (Force)
     - Accommodate demands (Compromise)
     - Call for unity (Charisma)

### Mode 6: Livelihood Mode
**Theme**: Excel at your profession and support your household
**Victory Conditions**: 
- Master your craft
- Support family successfully
- Complete masterwork

**Event Archetypes (3)**:

1. **Work Challenge**
   - Template: "A client requests [DIFFICULT_TASK] by [DEADLINE]. The pay is [QUALITY]."
   - Variables: DIFFICULT_TASK (complex item/dangerous job/rare service), DEADLINE, QUALITY (excellent/fair/poor)
   - Triggers: Skill level, Reputation
   - Outcomes:
     - Accept challenge (Risk vs reward)
     - Negotiate terms (Charisma)
     - Refer to colleague (Reputation trade)

2. **Professional Advancement**
   - Template: "Opportunity to [ADVANCE] in your profession. [REQUIREMENT] required."
   - Variables: ADVANCE (join guild/get promotion/learn technique), REQUIREMENT (fee/test/sponsor)
   - Triggers: Time + skill threshold
   - Outcomes:
     - Pursue immediately (Cost/risk)
     - Prepare further (Delay)
     - Decline (Stay current level)

3. **Work-Life Balance**
   - Template: "Your [FAMILY/COMMUNITY] needs you for [OBLIGATION], but work demands [CONFLICT]."
   - Variables: FAMILY/COMMUNITY (spouse/children/parents/neighbors), OBLIGATION, CONFLICT
   - Triggers: Random, Success level
   - Outcomes:
     - Prioritize work (Family unhappy)
     - Prioritize family (Work suffers)
     - Attempt both (Exhaustion risk)

### Mode 7: Diplomacy Mode
**Theme**: Build bridges between peoples and navigate cultural differences
**Victory Conditions**: 
- Broker major peace
- Establish lasting alliance
- Prevent war

**Event Archetypes (3)**:

1. **Cultural Misunderstanding**
   - Template: "Your [ACTION] has offended [GROUP]. They interpret it as [MEANING]."
   - Variables: ACTION (gesture/gift/words), GROUP, MEANING (insult/threat/disrespect)
   - Triggers: Different culture interaction
   - Outcomes:
     - Apologize sincerely (Humility)
     - Explain intent (Intelligence)
     - Stand by action (Risk escalation)

2. **Negotiation Round**
   - Template: "[PARTY] proposes [TERMS]. Your side expects you to [EXPECTATION]."
   - Variables: PARTY, TERMS (trade/territory/marriage/tribute), EXPECTATION (accept/reject/counter)
   - Triggers: Reputation threshold, Mission
   - Outcomes:
     - Accept terms (Quick resolution)
     - Counter-propose (Charisma)
     - Walk away (Reset negotiations)

3. **Trust Test**
   - Template: "[PARTY] requests [PROOF] of good faith before proceeding."
   - Variables: PARTY, PROOF (hostage/payment/demonstration/secret)
   - Triggers: New relationship, After conflict
   - Outcomes:
     - Provide proof (Build trust)
     - Refuse (Maintain position)
     - Deceive (Risk if discovered)

### Mode 8: Legal Mode
**Theme**: Navigate justice systems and resolve moral dilemmas
**Victory Conditions**: 
- Win landmark case
- Reform unjust law
- Achieve justice for wronged party

**Event Archetypes (4)**:

1. **Case Dilemma**
   - Template: "Evidence in the [CASE_TYPE] case suggests [CONFLICT]. The law says [LAW], but justice might require [ALTERNATIVE]."
   - Variables: CASE_TYPE (theft/murder/contract/heresy), CONFLICT, LAW, ALTERNATIVE
   - Triggers: New case assignment
   - Outcomes:
     - Follow letter of law (Safe)
     - Seek true justice (Risky)
     - Find compromise (Complex)

2. **Ethical Challenge**
   - Template: "[PARTY] offers [INDUCEMENT] to influence the [CASE_ASPECT]."
   - Variables: PARTY (noble/merchant/official), INDUCEMENT (gold/favor/threat), CASE_ASPECT (verdict/evidence/witness)
   - Triggers: High-stakes cases
   - Outcomes:
     - Accept (Corruption path)
     - Refuse (Maintain integrity)
     - Report (Make enemy)

3. **Precedent Decision**
   - Template: "Your ruling on [ISSUE] will affect [SCOPE]. There is no clear precedent."
   - Variables: ISSUE (inheritance/trade/punishment), SCOPE (city/region/empire)
   - Triggers: Novel cases
   - Outcomes:
     - Conservative ruling (Maintain status quo)
     - Progressive ruling (Create change)
     - Defer decision (Avoid responsibility)

4. **Reform Opportunity**
   - Template: "You have chance to change [LAW/PRACTICE]. [SUPPORTERS] support you, [OPPONENTS] resist."
   - Variables: LAW/PRACTICE, SUPPORTERS, OPPONENTS
   - Triggers: Authority level, Crisis
   - Outcomes:
     - Push hard (High risk/reward)
     - Incremental change (Slow progress)
     - Maintain status quo (Safe)

## Implementation Status & Updated Roadmap

### ✅ Phase 1: Core Infrastructure (COMPLETED)
**Status**: Successfully implemented with full functionality

#### 1.1 Event Type Definitions ✅
- Created comprehensive type system in `types/eventTypes.ts`
- All interfaces defined and integrated
- Full TypeScript support across event system

#### 1.2 Event Service ✅
- Fully functional `eventService.ts` with all core methods
- Trigger checking system operational
- Event history tracking implemented
- Victory condition monitoring active
- Custom event support for WorldWeaver scenarios

#### 1.3 Event UI Components ✅
- `EventModal.tsx` - Full modal with choice display
- `EventNotification.tsx` - Toast notifications with auto-dismiss
- `EventBadge.tsx` - Pulsing indicator for pending events
- `GameModeSelector.tsx` - Mode selection interface
- All components styled and responsive

### ✅ Phase 2: Mode Implementation (COMPLETED)
**Status**: All 8 game modes defined and procedural selection working

#### 2.1 Game Mode Definitions ✅
- All 8 modes fully defined in `gameModes.ts`
- Each mode has 3-4 event archetypes
- Victory conditions specified per mode
- **NEW**: Sophisticated weighted probability system for automatic mode selection
- **NEW**: Character attribute-based mode suggestion algorithm

#### 2.2 WorldWeaver Integration ✅
- Mode detection from prompts implemented
- Custom event generation for WorldWeaver scenarios
- Seamless fallback to procedural events
- **NEW**: Automatic mode selection for ALL game types (not just WorldWeaver)

#### 2.3 Game State Connection ✅
- `useEventSystem` hook fully operational
- Event effects apply to player stats
- Quest progress tracking integrated
- **NEW**: Initial event generation on game start
- **NEW**: 1-3 procedural quests generated for EVERY game
- **FIXED**: Proper context hook usage (usePlayer/useMap instead of direct hooks)

### ⚠️ Phase 3: Procedural Generation (PARTIAL)
**Status**: Basic implementation complete, needs enhancement

#### 3.1 Template Variable System ⚠️
**Status**: Basic structure in place
- Template substitution logic implemented
- Context-aware variable selection working
- **TODO**: Expand variable banks for all placeholders
- **TODO**: Add era-specific variations
```typescript
// File: utils/eventTemplates.ts (new file)
export function fillTemplate(template: string, variables: Record<string, string[]>): string {
  let filled = template;
  
  // Replace each [VARIABLE] with random selection from options
  Object.entries(variables).forEach(([key, options]) => {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    filled = filled.replace(regex, randomOption);
  });
  
  return filled;
}

// Variable banks for each placeholder type
export const TEMPLATE_VARIABLES = {
  RESOURCE: ['food', 'water', 'fuel', 'medicine', 'ammunition'],
  HAZARD: ['a violent storm', 'wildfire', 'flash flood', 'avalanche', 'extreme cold'],
  GOODS: ['grain', 'silk', 'spices', 'metals', 'wine', 'salt'],
  GROUP: ['local hunters', 'traveling merchants', 'armed warriors', 'religious pilgrims'],
  // ... etc for all variable types
};
```

#### 3.2 Context-Aware Generation
```typescript
// File: services/eventContextService.ts (new file)
import { PlayerCharacter } from '../types/playerCharacter';
import { MapTile } from '../types';

export function getContextVariables(
  player: PlayerCharacter, 
  tile: MapTile, 
  season: string
): Record<string, string[]> {
  const variables: Record<string, string[]> = {};
  
  // Adjust variables based on context
  if (tile.biome === 'DESERT') {
    variables.RESOURCE = ['water', 'shade', 'food'];
    variables.HAZARD = ['sandstorm', 'extreme heat', 'scorpions'];
  } else if (tile.biome === 'TUNDRA') {
    variables.RESOURCE = ['fuel', 'warm clothing', 'food'];
    variables.HAZARD = ['blizzard', 'extreme cold', 'wolves'];
  }
  
  // Add era-specific options
  if (player.era === 'medieval') {
    variables.GROUP = ['knights', 'peasants', 'monks', 'bandits'];
  } else if (player.era === 'classical') {
    variables.GROUP = ['legionaries', 'slaves', 'senators', 'barbarians'];
  }
  
  return variables;
}
```

### 🔄 Phase 4: LLM Enhancement (IN PROGRESS)
**Status**: Foundation laid, needs expansion

#### 4.1 Custom Event Generation 🔄
**Status**: Basic WorldWeaver integration exists
- LLM service connected
- Custom archetypes supported
- **TODO**: Implement full event generation from prompts
- **TODO**: Add historical accuracy validation
```typescript
// File: services/llmEventService.ts (new file)
import { GoogleGenAI } from "@google/genai";
import { EventArchetype } from '../types/eventTypes';

export async function generateCustomEvents(
  gameMode: string,
  historicalContext: string,
  playerContext: string
): Promise<EventArchetype[]> {
  const prompt = `
    Generate 3 historically accurate events for ${gameMode} mode.
    Historical context: ${historicalContext}
    Player context: ${playerContext}
    
    Each event should have:
    - A description with specific historical details
    - 3 meaningful choices
    - Realistic outcomes based on what actually happened in history
    
    Format as JSON matching EventArchetype interface.
  `;
  
  // Call LLM and parse response
  const response = await genAI.generateContent(prompt);
  return parseEventArchetypes(response);
}
```

#### 4.2 Historical Accuracy Layer
```typescript
// File: services/historicalAccuracyService.ts (new file)
export function validateHistoricalAccuracy(
  event: EventArchetype,
  era: string,
  culture: string
): boolean {
  // Check if event makes sense for time/place
  // Flag anachronisms
  // Suggest corrections
}

export function addHistoricalContext(
  event: EventInstance,
  sources: PrimarySource[]
): EventInstance {
  // Enhance event with relevant primary source quotes
  // Add "what really happened" notes
  // Link to educational content
}
```

### ⚠️ Phase 5: Victory Conditions (PARTIAL)
**Status**: Basic tracking implemented

#### 5.1 Victory Tracking ⚠️
**Status**: Foundation in place
- Victory conditions defined per mode
- Progress tracking started
- **TODO**: Implement actual victory detection
- **TODO**: Add victory UI/celebration
```typescript
// File: services/victoryService.ts (new file)
import { GameMode, VictoryCondition } from '../types/eventTypes';
import { PlayerCharacter } from '../types/playerCharacter';

export class VictoryService {
  checkVictoryConditions(
    mode: GameMode,
    player: PlayerCharacter,
    gameState: GameState
  ): VictoryStatus {
    // Check each victory condition for current mode
    // Track progress toward each condition
    // Return status and progress percentage
  }
}
```

#### 5.2 Mode Switching
```typescript
// File: hooks/useGameMode.ts (new file)
export function useGameMode() {
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [modeProgress, setModeProgress] = useState<Map<string, number>>(new Map());
  
  const switchMode = (newMode: GameMode) => {
    // Save progress for current mode
    // Initialize new mode
    // Reset relevant game state
  };
  
  return { currentMode, modeProgress, switchMode };
}
```

## File Structure Summary

### New Files to Create:
```
types/
  eventTypes.ts              # All event system interfaces

services/
  eventService.ts           # Core event logic
  eventContextService.ts    # Context-aware generation
  llmEventService.ts        # LLM enhancement
  historicalAccuracyService.ts  # Historical validation
  victoryService.ts         # Victory condition tracking

components/
  EventModal.tsx            # Event display UI
  ModeSelector.tsx          # Game mode selection UI
  VictoryProgress.tsx       # Victory condition tracker

hooks/
  useEventSystem.ts         # Event system state management
  useGameMode.ts            # Game mode management

constants/gameData/
  gameModes.ts              # All 8 mode definitions
  eventTemplates.ts         # Procedural event templates

utils/
  eventTemplates.ts         # Template filling utilities
```

### Files to Modify:
```
services/worldWeaverService.ts    # Add mode detection
components/TopNavBar.tsx           # Add mode display
hooks/usePlayerState.ts            # Add event effects
components/LeftSidebar.tsx         # Add victory progress
```

## Testing Strategy

### Unit Tests:
- Template variable substitution
- Trigger condition evaluation
- Effect application
- Victory condition checking

### Integration Tests:
- Event triggering in game loop
- Mode switching
- Save/load with events
- LLM fallback to procedural

### Playtesting Focus:
- Event frequency balance
- Choice meaningfulness
- Mode distinctiveness
- Educational value

## Performance Considerations

### Optimizations:
- Lazy load mode definitions
- Cache filled templates
- Batch trigger checks
- Debounce UI updates

### Scalability:
- Events in JSON for modding
- Async LLM calls with timeout
- Progressive event complexity
- Efficient history storage

## Success Metrics

### Gameplay:
- Players experience 3-5 events per hour
- 80% of choices feel meaningful
- Each mode feels distinct
- Victory conditions achievable in 2-4 hours

### Educational:
- Players learn historical context
- Choices reflect real dilemmas
- Primary sources referenced
- Accurate cause-effect relationships

### Technical:
- < 50ms trigger check time
- < 2s LLM generation time
- < 100KB event data size
- No memory leaks

## Future Expansions

## Recent Accomplishments (August 2025)

### ✅ Completed Features
1. **Automatic Game Mode Selection**
   - ALL games now procedurally select appropriate mode
   - Weighted probability based on character attributes:
     - Health, Intelligence, Privilege levels heavily weighted
     - Profession and era influence selection
     - Character stats create realistic mode choices

2. **Universal Quest Generation**
   - 1-3 quests generated at start for EVERY game
   - Quest types match selected game mode
   - Location-based objectives using map structures

3. **UI Polish**
   - Game mode display moved to TopNavBar
   - Removed all floating UI elements
   - Professional gradient styling
   - Tooltip and dropdown for mode information

4. **Bug Fixes**
   - Fixed context hook usage errors
   - Removed VictoryProgressBar overlay
   - Corrected icon imports

## Updated Phase Plan

### Phase 6: Event Content Expansion (Next Priority)
**Goal**: Rich, varied events for all modes

1. **Expand Event Templates**
   - Create 10+ templates per mode (currently 3-4)
   - Add branching event chains
   - Implement consequence cascades

2. **Historical Specificity**
   - Era-specific event variations
   - Culture-specific choices
   - Historically accurate items/resources

3. **Dynamic Difficulty**
   - Scale challenges to player skill
   - Adaptive event frequency
   - Progressive complexity

### Phase 7: Quest System Enhancement
**Goal**: Meaningful objectives tied to events

1. **Quest Integration**
   - Events can spawn quests
   - Quest completion triggers events
   - Multi-stage quest chains

2. **Location-Based Objectives**
   - Use actual map structures
   - Dynamic waypoint system
   - Exploration rewards

3. **Quest UI Improvements**
   - Quest log in sidebar
   - Progress indicators on map
   - Completion notifications

### Phase 8: Educational Layer
**Goal**: Seamless learning integration

1. **Primary Source Integration**
   - Link events to sources
   - Quote relevant passages
   - "What really happened" notes

2. **Historical Context**
   - Tooltips with period info
   - Anachronism warnings
   - Educational achievements

3. **Assessment Features**
   - Track historical accuracy
   - Learning objectives
   - Progress reports

### Phase 9: Multiplayer Events
**Goal**: Shared historical experiences

1. **Cooperative Events**
   - Trade negotiations
   - Joint expeditions
   - Alliance management

2. **Competitive Modes**
   - Merchant rivalries
   - Scholarly debates
   - Legal disputes

3. **Asynchronous Play**
   - Leave messages/items
   - Affect others' worlds
   - Persistent consequences

### Phase 10: User-Generated Content
**Goal**: Community-driven expansion

1. **Event Editor**
   - Visual template builder
   - Historical validation
   - Community sharing

2. **Scenario Workshop**
   - Custom starting conditions
   - Historical campaigns
   - Alternative histories

3. **Moderation System**
   - Historical accuracy rating
   - Community voting
   - Featured content

## Technical Improvements Needed

### Performance
- [ ] Lazy load event archetypes
- [ ] Implement event caching
- [ ] Optimize trigger checking
- [ ] Reduce re-renders

### Code Quality
- [ ] Add comprehensive tests
- [ ] Document all systems
- [ ] Refactor large components
- [ ] Type safety improvements

### User Experience
- [ ] Tutorial for event system
- [ ] Accessibility improvements
- [ ] Mobile gesture support
- [ ] Offline mode support

### Planned Features:
- Event chains (multi-part stories)
- Multiplayer event cooperation
- User-created events
- Achievement system
- Daily challenges
- Historical campaigns

### Potential Modes:
- Artisan Mode (create masterworks)
- Maritime Mode (naval focus)
- Espionage Mode (spycraft)
- Religious Mode (faith-based)
- Family Mode (dynasty building)

## UI Design & User Experience

### Core Design Philosophy
This is a **historically accurate educational simulation**, not a fantasy game. All UI elements, choices, and items must reflect what ordinary people actually experienced in history. Most people throughout history owned very few possessions - tools, clothing, cooking implements, and perhaps livestock. Weapons were rare outside of military contexts.

### Default Start Flow (Procedural - No LLM)

#### 1. Initial Game Load
- Player spawns in random location with era-appropriate starting inventory
- **Auto-selected game mode** based on starting conditions:
  - Wilderness/rural → **Survival** or **Livelihood Mode**
  - Near city → **Livelihood** or **Commerce Mode**  
  - High education stat → **Scholarship Mode**
  - Leadership role → **Leadership Mode**

#### 2. Event Notification System
Events appear via:
- **Subtle toast notification** (bottom-right corner)
- **Pulsing event icon** in top navigation bar
- **Keyboard shortcut**: Press 'E' to open pending event
- **Auto-pause option**: Game can pause when event triggers

### Event Modal Interface

#### Procedural Event Example
```
┌─────────────────────────────────────┐
│ 📜 Resource Shortage                │
│                                     │
│ Your grain stores are nearly empty. │
│ The next harvest is months away.   │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🌾 Forage for wild edibles   │    │
│ │    (Wisdom 10+)              │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🐐 Trade your goat            │    │
│ │    (Lose livestock)           │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🍞 Reduce rations             │    │
│ │    (-5 Health, -10 Fatigue)   │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Historically Accurate Trade Items by Era/Culture

#### Dynamic Item Generation
Items for trading/bartering are generated based on `historicalEra + culturalZone`:

**Ancient Era Examples**:
- Mediterranean: Amphora of olive oil, laying hens, wool cloth
- East Asian: Rice stores, silk cloth, bronze tools
- Sub-Saharan: Cattle, iron tools, salt blocks
- Americas: Maize stores, obsidian blades, llama/alpaca

**Medieval Era Examples**:
- European: Milk cow, wool fleece, iron plow
- MENA: Date palms, carpets, copper vessels
- South Asian: Water buffalo, cotton cloth, spices
- East Asian: Rice paddies, lacquerware, tea

**Early Modern Examples**:
- European: Pocket watch, printed books, sugar
- Colonial Americas: Musket, beaver pelts, tobacco
- East Asian: Porcelain, silk, silver
- African: Ivory, gold dust, enslaved persons (with educational context)

**Modern Era Examples**:
- 1920s America: Model T Ford, radio, shares of stock
- 1960s Soviet: Apartment allocation, car waitlist position, western goods
- 1980s Japan: Electronics, company shares, real estate
- 2000s Global: Laptop, car, cryptocurrency

### WorldWeaver LLM Enhancement

#### Activation Flow
1. **User enters prompt** in top nav search bar
2. **System analyzes** for historical context and game mode
3. **Confirmation dialog**: 
   ```
   "Enhance your experience with: [Prompt Summary]
   This will customize events and add special NPCs.
   Note: Uses AI features (may incur costs)"
   [Proceed] [Stay Procedural]
   ```

#### LLM-Generated Special NPCs

**Example**: Prompt "Venetian merchant during plague, 1348"

Generated NPCs appear with **golden map markers**:
```
┌─────────────────────────────────────┐
│ 🌟 Widow Benedetti                 │
│ Herbalist and Healer               │
│                                     │
│ "The miasma grows worse each day.  │
│  I've heard the Jews' quarter has  │
│  fewer deaths - they wash more     │
│  frequently. Perhaps cleanliness   │
│  fights the corruption?"           │
│                                     │
│ [Quest: Investigate Quarantine]    │
│ [Trade: Herbal Remedies]           │
│ [Learn: Medieval Medicine]         │
└─────────────────────────────────────┘
```

**Key NPC Features**:
- Historically accurate roles (not "quest givers" but real occupations)
- Period-appropriate dialogue and concerns
- Educational opportunities (learn actual historical practices)
- Persistent memory of interactions

#### Enhanced Event Descriptions

**Procedural Version**:
"A merchant offers to buy your goods."

**LLM-Enhanced Version** (Venice 1348):
"Giovanni di Paolo, a spice merchant from the Rialto, approaches cautiously, a pomander held to his nose. 'I'll pay double for any theriac or camphor - the nobles believe it wards off the pestilence. Though between us, I suspect fleeing to the countryside would serve better than all the unicorn horn in Christendom.'"

### Mode & Victory Progress Display

#### Left Sidebar Addition
```
┌─────────────────────────────────────┐
│ 📊 Current Objective                │
│ ────────────────────                │
│ Commerce Mode: Plague Profiteer    │
│                                     │
│ Victory Progress:                  │
│ ☐ Accumulate 500 florins  [120/500]│
│ ☐ Establish trade route   [60%]    │
│ ☐ Survive plague          [Day 43] │
│                                     │
│ Recent Decisions:                  │
│ • Sold grain at inflated price     │
│ • Helped monastery with supplies   │
│ • Avoided infected district        │
│                                     │
│ Reputation: Opportunist            │
└─────────────────────────────────────┘
```

### Historical Context Integration

#### Educational Tooltips
When hovering over choices, show historical context:
```
[Trade your ox]
    ↓
"In medieval Europe, an ox was often a
family's most valuable possession, worth
multiple years of earnings. Losing it
meant inability to plow fields effectively."
```

#### Primary Source Connection
Events can reference discovered primary sources:
```
┌─────────────────────────────────────┐
│ 📚 Historical Context Available     │
│                                     │
│ This event relates to:             │
│ • "Chronicle of the Black Death"   │
│   by Agnolo di Tura (1348)        │
│                                     │
│ [Read Excerpt] [Continue]          │
└─────────────────────────────────────┘
```

### Cost Management & Mode Indicators

#### Top Navigation Bar
```
┌────────────────────────────────────────────────┐
│ 🎲 Procedural Mode | [Enter historical prompt] │
│                                                │
│ When WorldWeaver Active:                      │
│ ✨ Venice 1348: Merchant | API calls: 3       │
└────────────────────────────────────────────────┘
```

#### Settings Panel
```
Event Settings:
├─ Frequency: [Realistic | Moderate | Frequent]
├─ Historical Accuracy: [Strict | Balanced | Relaxed]
├─ Show Real Outcomes: [Always | On Completion | Never]
├─ Anachronism Warnings: [On | Off]
└─ API Usage Limit: [10/day | 50/day | Unlimited]
```

### Mobile UI Adaptations

#### Responsive Event Modal
- Full screen on mobile devices
- Swipe between choices instead of buttons
- Larger touch targets (minimum 44px)
- Choice consequences shown as icons

#### Gesture Controls
- Swipe up: Open event
- Swipe down: Dismiss notification
- Long press: Historical context
- Pinch: Show mode overview

### Example Complete User Journey

#### Procedural Start
1. **New game**: Spawns as farmer in medieval England
2. **First event** (5 min): "Your barley harvest is poor"
3. **Choices**: 
   - Pay taxes anyway (lose resources)
   - Hide grain (risk punishment)
   - Seek lord's mercy (charisma check)
4. **Consequence**: Reduced rations through winter

#### WorldWeaver Enhancement
1. **User types**: "Irish tenant farmer, 1847"
2. **System generates**:
   - Special NPC: "Patrick O'Brien" (Local priest documenting famine)
   - Special NPC: "Captain Morris" (Workhouse administrator)
   - Custom events about potato blight, emigration, workhouses
3. **First enhanced event**: "The Blight Returns"
   - Choices reflect actual historical options:
     - "Take the soup" (Protestant charity with conversion pressure)
     - "Try for passage to America" (requires selling everything)
     - "Enter the workhouse" (family separation)
     - "Forage for nettles and seaweed" (actual famine foods)

### Historical Accuracy Validators

#### Anachronism Detection
System flags historically impossible choices:
```
⚠️ Historical Note: 
Potatoes weren't available in medieval Europe.
This crop arrived from the Americas in the 1570s.
[Learn More] [Adjust Setting]
```

#### Period-Appropriate Language
- Medieval: "grain stores", "livestock", "tillage"
- Industrial: "wages", "factory shift", "tenement"
- Modern: "unemployment benefits", "mortgage", "credit"

### Victory Condition Examples

#### Historically Authentic Victory Conditions

**Survival Mode** (Irish Famine):
- ✓ Survive until next harvest
- ✓ Keep family together
- ✓ Maintain health above starvation

**Commerce Mode** (Silk Road Merchant):
- ✓ Complete journey to Constantinople
- ✓ Profit margin over 200%
- ✓ Establish regular trade partnership

**Scholarship Mode** (Islamic Golden Age):
- ✓ Translate 3 Greek texts
- ✓ Teach 10 students
- ✓ Gain patronage from caliph

### Performance & Technical Considerations

#### Event Frequency Balancing
- **Realistic mode**: 1-2 events per game hour (historical pace)
- **Moderate mode**: 3-4 events per hour (balanced gameplay)
- **Frequent mode**: 5-6 events per hour (action-focused)

#### Caching Strategy
- Cache procedural templates locally
- Store LLM responses for session
- Preload likely next events
- Keep special NPC dialogue in memory

This UI design ensures historical authenticity while providing engaging gameplay, with seamless scaling from free procedural events to premium LLM-enhanced historical scenarios.