# Universal History Simulator - Development Roadmap

## Overview
This document outlines the implementation plan for enhancing the game with profession-based gameplay, home bases, and deeper narrative interactions while maintaining simplicity and educational value.

---

## 🎯 Core Design Principles
1. **Educational First**: Every feature should teach historical context
2. **Simple Interactions**: Complex outcomes from simple choices
3. **Narrative-Driven**: Use LLM to create emergent storytelling
4. **Performance Conscious**: Minimize API calls, cache when possible
5. **Historically Accurate**: Ground all mechanics in real historical practices

---

## 📋 Feature Implementation Plan

### 1. Profession-Based Quest System

#### 1.1 URL-Based Profession Selection
**URL Pattern**: `/[date]/[location]/[gamemode]/[seed]/[profession]`
- Example: `/1492/europe/commerce/ABC123/spice-trader`
- Example: `/1750/asia/scholarship/DEF456/apothecary`

**Implementation**:
```typescript
// services/professionService.ts
interface ProfessionConfig {
  id: string;
  name: string;
  startingItems: string[];
  startingLocation: 'marketplace' | 'urban' | 'palace' | 'rural';
  questLine: QuestTemplate[];
  specialMechanics: string[]; // e.g., 'brewing', 'trading', 'healing'
}

const PROFESSIONS: Record<string, ProfessionConfig> = {
  'spice-trader': {
    id: 'spice-trader',
    name: 'Spice Trader',
    startingItems: ['pepper', 'cinnamon', 'trade_ledger'],
    startingLocation: 'marketplace',
    questLine: [
      { id: 'find-supplier', name: 'Find Reliable Supplier' },
      { id: 'establish-route', name: 'Establish Trade Route' },
      { id: 'corner-market', name: 'Corner the Market' }
    ],
    specialMechanics: ['price-negotiation', 'route-planning', 'inventory-management']
  },
  'apothecary': {
    id: 'apothecary',
    name: 'Apothecary',
    startingItems: ['herbs', 'mortar_pestle', 'recipe_book'],
    startingLocation: 'urban',
    questLine: [
      { id: 'gather-herbs', name: 'Gather Medicinal Herbs' },
      { id: 'cure-plague', name: 'Develop Plague Remedy' },
      { id: 'royal-physician', name: 'Become Royal Physician' }
    ],
    specialMechanics: ['brewing', 'diagnosis', 'herb-gathering']
  }
};
```

#### 1.2 Profession Quests Integration
- Each profession has 3-5 milestone quests
- Quests use existing location-based system but with profession-specific objectives
- MinigameLLM provides contextual guidance based on profession
- Completion unlocks new abilities or recipes

**Quest Examples**:
- **Spice Trader**: "Negotiate with 3 different suppliers" → "Establish route to India" → "Survive pirate attack"
- **Apothecary**: "Cure 5 villagers" → "Create new remedy" → "Treat the lord's illness"
- **Blacksmith**: "Forge 10 tools" → "Create masterwork sword" → "Supply the army"

---

### 2. Home Base System

#### 2.1 Home Assignment Logic
```typescript
interface HomeBase {
  tileId: string;
  type: 'marketplace' | 'urban' | 'hamlet' | 'poi';
  structureId?: string; // For POIs like fortresses
  familyMembers: FamilyMember[];
  improvements: HomeImprovement[];
  storage: Item[];
  reputation: number;
}

// Assign home based on profession and starting conditions
function assignHomeBase(
  playerCharacter: PlayerCharacter,
  mapData: MapData
): HomeBase {
  // Find suitable tile based on profession
  // Wanderers get no home (null)
  // Others get nearest appropriate structure
}
```

#### 2.2 Home Modal Interface
**Tabs**:
1. **Overview**: Show home condition, family status, storage
2. **Family**: Interactive family members with dialogue
3. **Workshop**: Profession-specific crafting/activities
4. **Storage**: Manage items kept at home
5. **Improvements**: Upgrade home with earned wealth

**Family Interactions**:
- Spouse provides emotional support and advice
- Children can be taught skills (education mini-game)
- Elderly parents share historical knowledge (primary sources)
- Each family member has personality and can generate quests

#### 2.3 Dynamic Home Events
```typescript
// Use MinigameLLM to generate contextual home events
async function generateHomeEvent(
  homeBase: HomeBase,
  season: Season,
  recentEvents: string[]
): Promise<HomeEvent> {
  // Events based on:
  // - Family member personalities
  // - Season and weather
  // - Political situation
  // - Economic conditions
  // Examples: "Your son wants to learn your trade"
  //          "Roof needs repair before winter"
  //          "Neighbor asks to hide from authorities"
}
```

---

### 3. Enhanced Narration Panel

#### 3.1 State Modification Commands
**Command Parser**:
```typescript
interface NarrationCommand {
  type: 'time' | 'craft' | 'rest' | 'travel' | 'trade';
  parameters: Record<string, any>;
}

// Parse natural language into commands
function parseNarrationInput(input: string): NarrationCommand | null {
  // Examples:
  // "rest until morning" → { type: 'time', parameters: { advance: 'morning' } }
  // "carve a whistle from this stick" → { type: 'craft', parameters: { item: 'whistle', material: 'stick' } }
  // "travel to the nearest city" → { type: 'travel', parameters: { destination: 'nearest-city' } }
}
```

#### 3.2 Time Acceleration
**Implementation**:
- Allow advancing time by hours, days, or until specific events
- Update all time-dependent systems (crops, quests, NPCs)
- Generate summary of what happened during time skip
- Consume resources (food, fatigue) appropriately

**UI Enhancement**:
```typescript
// Add time control buttons to narration panel
<div className="time-controls">
  <button onClick={() => advanceTime('1-hour')}>Rest 1 Hour</button>
  <button onClick={() => advanceTime('until-dawn')}>Sleep Until Dawn</button>
  <button onClick={() => advanceTime('1-day')}>Skip Day</button>
</div>
```

#### 3.3 Complex Crafting
**Narrative Crafting System**:
```typescript
interface NarrativeCraftingRecipe {
  input: string; // Natural language description
  materials: string[];
  skill: string;
  difficulty: number;
  output: Item;
  narrativeSteps: string[]; // LLM generates these
}

// Example: "I want to carve a flute from this bamboo"
// 1. Check if player has bamboo and knife
// 2. LLM generates crafting narrative
// 3. Skill check determines quality
// 4. Create unique item with description
```

---

### 4. Enhanced Marketplace & Government Modals

#### 4.1 Marketplace Modal Redesign
**Tabs**:
1. **Trade Hall**: Buy/sell with multiple merchants
2. **Contracts**: Accept trade missions and deliveries
3. **Black Market**: Illegal goods (with risk mechanics)
4. **Information**: Hear rumors and news
5. **Services**: Hire workers, guides, guards

**MinigameLLM Integration**:
- Each merchant has personality and negotiation style
- Dynamic pricing based on relationship and events
- Haggling mini-game with cultural variations
- Trade route planning with risk/reward

#### 4.2 Government Center Modal
**Tabs**:
1. **Audience Chamber**: Meet officials, request permits
2. **Court**: Resolve disputes, witness trials
3. **Tax Office**: Pay taxes, bribe officials
4. **Military**: Enlist, supply army, get protection
5. **Archives**: Access historical documents

**Political Mechanics**:
- Reputation with different factions
- Permit system for certain activities
- Legal status (criminal, citizen, noble)
- Participation in historical events

---

### 5. Camp/Rest System

#### 5.1 Camp Mechanics
```typescript
interface CampSite {
  safety: number; // 0-100
  comfort: number; // affects rest quality
  resources: string[]; // available foraging
  encounters: CampEncounter[]; // possible events
}

// Different camp options based on location
function getCampOptions(tile: Tile): CampOption[] {
  // Forest: Hidden camp (safe but uncomfortable)
  // Road: Roadside camp (moderate both)
  // City: Inn (expensive but safe)
  // Wilderness: Rough camp (dangerous but free)
}
```

#### 5.2 Rest Benefits
- Restore health and fatigue
- Process recent events (gain experience/wisdom)
- Dream sequences that provide hints or visions
- Morning activities (forage, hunt, pray)

---

## 🔄 Integration Strategy

### Phase 1: Foundation (Week 1)
1. ✅ Create minigameLLM service (COMPLETE)
2. Add profession URL parsing
3. Create profession service with configs
4. Implement basic home assignment

### Phase 2: Home Base (Week 2)
1. Create HomeModal component with tabs
2. Implement family member interactions
3. Add home storage system
4. Create home improvement mechanics

### Phase 3: Narration Enhancement (Week 3)
1. Add command parser to narration panel
2. Implement time acceleration
3. Create narrative crafting system
4. Add camp/rest UI buttons

### Phase 4: Modal Upgrades (Week 4)
1. Redesign marketplace with tabs
2. Add contract system
3. Create government center modal
4. Implement reputation mechanics

### Phase 5: Quest Integration (Week 5)
1. Create profession quest templates
2. Link quests to home events
3. Add quest rewards and progression
4. Implement special profession abilities

---

## 💡 Simplification Strategies

### 1. Reuse Existing Systems
- Use existing quest location system for profession quests
- Leverage current NPC dialogue for family members
- Extend current crafting for narrative crafting
- Build on existing reputation system

### 2. Progressive Disclosure
- Start with basic home (just storage and rest)
- Unlock features through gameplay
- Hide complexity behind simple UI
- Use tooltips for education

### 3. Smart Defaults
- Auto-assign appropriate home based on profession
- Pre-select common crafting recipes
- Suggest next quest steps
- Provide quick action buttons for common tasks

### 4. Caching & Performance
- Cache family dialogue for 10 minutes
- Pre-generate home events during idle time
- Batch LLM calls when possible
- Use local state for frequent updates

---

## 📚 Educational Integration

### 1. Historical Accuracy
- Each profession based on real historical roles
- Home life reflects period-appropriate customs
- Crafting uses historically accurate techniques
- Government interactions teach civic history

### 2. Primary Sources
- Family members share relevant documents
- Government archives contain real texts
- Craft recipes from historical sources
- Trade routes based on actual paths

### 3. Learning Moments
- Tooltips explain historical context
- Success/failure messages teach cause-effect
- NPC dialogue includes period details
- Quest completion provides historical facts

---

## 🎮 Fun Factor Optimization

### 1. Meaningful Choices
- Every decision affects multiple systems
- No "correct" path, multiple solutions
- Consequences create emergent stories
- Risk/reward balanced carefully

### 2. Progression Feeling
- Visual home improvements
- Growing family relationships
- Expanding trade networks
- Rising social status

### 3. Surprise Elements
- Random home events
- Unexpected family requests
- Market fluctuations
- Political upheavals

### 4. Personal Investment
- Named family members with personalities
- Customizable home decorations
- Unique crafted items with history
- Reputation that matters

---

## 🚀 Quick Wins (Implement First)

1. **Profession URL parsing** (2 hours)
   - Modify urlConfigService.ts
   - Add profession to initial state

2. **Basic home assignment** (3 hours)
   - Find nearest appropriate structure
   - Store in player state
   - Add "Go Home" button

3. **Simple camp button** (2 hours)
   - Add to UI action bar
   - Basic rest mechanics
   - Time advance by 8 hours

4. **Narration time commands** (4 hours)
   - Parse "rest until [time]"
   - Update game calendar
   - Show time passage effect

5. **Family in home modal** (4 hours)
   - Display family members
   - Basic dialogue options
   - Simple mood system

---

## 📈 Success Metrics

1. **Engagement**: Players spend 30%+ time at home/profession activities
2. **Education**: Players can describe their profession's historical role
3. **Progression**: 80% complete at least one profession quest line
4. **Performance**: All features load in <2 seconds
5. **Accessibility**: All features work on mobile devices

---

## 🔍 Technical Considerations

### State Management
```typescript
// Extend existing GameState
interface ExtendedGameState {
  playerProfession?: ProfessionConfig;
  homeBase?: HomeBase;
  professionProgress: QuestProgress[];
  familyRelationships: Record<string, number>;
  campSupplies: CampingGear[];
}
```

### API Optimization
- Batch MinigameLLM calls
- Cache responses for 10 minutes
- Use quick responses for common queries
- Fallback to local generation if API fails

### Mobile Compatibility
- Touch-friendly tab navigation
- Responsive modal layouts
- Simplified controls for small screens
- Reduced animation on low-power devices

---

## 🎯 End Goal

Create an immersive historical life simulation where players:
1. Live as authentic historical professions
2. Manage realistic family relationships
3. Navigate period-appropriate challenges
4. Learn through engaging gameplay
5. Create unique emergent narratives

The system should feel deep but not overwhelming, educational but not preachy, challenging but not frustrating. Every feature should enhance the core loop of exploration, interaction, and growth.