# Universal History Simulator - Development Notes

## Project Overview
- **Creator**: Benjamin Breen, Historian at UCSC
- **Purpose**: Educational history simulation game for casual players and history students
- **Current Phase**: Core Systems Complete - Focus on Polish & Educational Features

## Current State Summary (December 2024)

### ✅ Fully Implemented Systems
- **Event System**: 8 game modes, procedural + LLM generation, victory tracking
- **URL Sharing**: Complete state encoding/decoding with character preservation
- **Quest System**: Location-based quests tied to map structures (resets on reload as intended)
- **Special Maps**: 5+ new government archetypes with cultural variations (TRIBAL_COUNCIL, COURT_CHAMBER, etc.)
- **NPC Generation**: Culturally accurate names, professions, appearances
- **Primary Sources**: 42 shards covering all zones/eras with smart search
- **NPC Internal Monologue**: Click NPC portraits up to 3 times for LLM-generated inner thoughts
- **Professions System**: 4000+ lines of culturally-specific professions across all eras/zones

### ⚠️ Partially Implemented
- **NPC Testing Panel**: Basic testing works, missing dialogue/trade testing
- **World Weaver**: Basic prompt interpretation, needs scenario expansion
- **Theft Mechanic**: NPCs can approach with theft intent, but actual stealing not fully implemented

### ❌ Not Yet Implemented
- **Save/Load System**: Planned for future (currently resets on reload)
- **Educational Assessment**: Not started
- **Learning Objectives**: Not started
- **Complete Theft Mechanic**: Only approach behavior exists, no item stealing

## ✅ COMPLETED: Event System (December 2024)

### Phase 1: Core Infrastructure - COMPLETE
- ✅ Created comprehensive type system (`types/eventTypes.ts`)
- ✅ Built event service with trigger evaluation (`services/eventService.ts`)
- ✅ Implemented event modal UI with stat checks
- ✅ Added LLM API tracker to navigation bar
- ✅ Created event notification system (toast + badge)

### Phase 2: Game Modes & Templates - COMPLETE
- ✅ Defined all 8 historically accurate game modes
- ✅ Created 3-4 event archetypes per mode (total 28 archetypes)
- ✅ Built context-aware template system with era/culture variables
- ✅ Integrated event system into main app
- ✅ Added mode selector UI with beautiful gradient cards
- ✅ Implemented victory progress tracking

### Phase 3: LLM Enhancement - COMPLETE
- ✅ Created LLM event service for custom event generation
- ✅ Built context service for historically accurate events
- ✅ Enhanced WorldWeaver to generate complete scenarios:
  - Auto-selects appropriate game mode
  - Generates 3 custom events per scenario
  - Creates 2 special NPCs with historical roles
- ✅ Integrated custom events with procedural system
- ✅ Added caching to reduce API calls

### Event System Features Working:
1. **8 Game Modes**: Survival, Exploration, Commerce, Scholarship, Leadership, Livelihood, Diplomacy, Legal
2. **Procedural Generation**: Template-based events with historically accurate variables
3. **LLM Enhancement**: Custom events based on specific historical scenarios
4. **Special NPCs**: Generated with period-appropriate names, occupations, dialogue
5. **API Tracking**: Real-time usage monitoring with cost estimates
6. **Performance**: Optimized with 10-second checks, event caching, minimal re-renders

### Historical Accuracy Examples:
- Medieval Europe: Trade milk cows, face plague/famine
- Ancient China: Trade rice/silk, face floods/drought
- 1847 Ireland: Everything for ship passage, workhouse dilemmas
- Modern era: Unemployment, recession, technology challenges


## Implementation Report - December 10, 2024

### COMPLETED: Full Seed/URL Sharing System Implementation

#### Problem Identified
The seed sharing system was completely broken:
- URLs showed `random/random/random` instead of actual game values
- Seeds didn't encode character information
- Sharing a URL didn't reproduce the same game setup
- Character name, profession, date, and location weren't preserved

#### Solution Implemented

**1. Created Comprehensive Shareable State Service** (`services/shareableStateService.ts`)
- Encodes complete game state including:
  - Year, month, day
  - Map area, zone, region
  - Game mode
  - Character details (name, profession, age, gender, social class)
  - Map generation seed
  - Scenario type (procedural/worldweaver)
- Uses URL-safe base64 encoding with JSON
- Supports both encoding and decoding
- Includes localStorage backup for recovery

**2. Updated URL Generation** (InitialScenarioModal.tsx)
- Share button now generates URLs with full state: `/1473/north-china-plain/survival?state=ENCODED_DATA`
- Character data is properly captured and encoded
- URLs show actual values instead of "random"
- Automatic localStorage backup when sharing

**3. Fixed URL Parsing** (App.tsx)
- Checks for `?state=` query parameter first
- Decodes full game state from URL
- Falls back to legacy path-based parsing
- Stores character data for restoration during generation

**4. Character Restoration** (characterGenerator.ts)
- Checks for URL character data during generation
- Restores exact character specifications (name, age, profession, etc.)
- Uses existing `generateCharacterWithSpec` function
- Clears data after use to prevent reuse

#### How It Works Now

1. **Sharing a Game**:
   - Player clicks "Share" in Initial Scenario Modal
   - System encodes full game state to base64
   - Generates URL like: `/1473/north-china-plain/survival?state=eyJ2IjoxLCJ5IjoxNDczLC...`
   - URL contains all data needed to reproduce the exact scenario

2. **Loading from URL**:
   - App.tsx detects state parameter
   - Decodes full game state
   - Sets map seed, date, location
   - Stores character data
   - Character generator uses stored data to recreate exact character

3. **Backwards Compatibility**:
   - Old URLs still work via path parsing
   - Simple 8-character seeds still function for map generation
   - Graceful fallback for malformed URLs

#### Technical Details

**Encoded State Structure**:
```typescript
{
  v: 1,              // version
  y: 1473,           // year
  m: 11,             // month
  d: 29,             // day
  ma: "NCP",         // map area (abbreviated)
  gm: "surv",        // game mode (abbreviated)
  cn: "Min Li",      // character name
  cp: "Tea Picker",  // character profession
  cg: "f",           // character gender
  ca: 35,            // character age
  ms: "DV032DBK",    // map seed
  st: "p"            // scenario type
}
```

**Benefits**:
- Teachers can share exact historical scenarios with students
- Players can share interesting setups with friends
- Developers can reproduce bugs with shared URLs
- Character customization is preserved

**Limitations**:
- Very long character names/professions are truncated
- Some procedural elements (NPC positions) may vary
- URLs can be long with full encoding

## Implementation Report - December 9, 2024

### PHASE 1-5 COMPLETED: Comprehensive URL State Sharing System

#### Overview
Implemented a complete shareable game state system that encodes all game parameters (character, location, date, mode) into URLs for perfect reproducibility.

#### What Was Implemented

**Phase 1: Shareable State Service ✅**
- **Created `shareableStateService.ts`**: Complete service for encoding/decoding game state
  - Base64 encoding of comprehensive game state
  - Map area abbreviation system (no truncation)
  - Support for character data, date, location, game mode
  - LocalStorage persistence for recovery

**Phase 2: Enhanced Encoding System ✅**
- **Fixed Truncation Issues**: Map areas and character names now preserved in full
- **Expanded Abbreviations**: Added 20+ common map area abbreviations
- **Fallback Handling**: Non-abbreviated areas stored as full names
- **Character Preservation**: All character attributes encoded (name, profession, age, gender)

**Phase 3: App.tsx Integration ✅**
- **URL State Detection**: Checks for `?state=` parameter on load
- **Full State Restoration**: Decodes and applies all game parameters
- **Character Data Flow**: Stores character spec in localStorage for generator
- **Zone/Region Mapping**: Correctly maps zones to geographical data

**Phase 4: Map Generation Fix ✅**
- **Fixed Location Selection**: Changed from `onStartNewWorldAtZoneRegion` to `onStartNewWorldAtLocation`
- **Proper Zone Handling**: Uses exact map area names instead of region keys
- **Year Override**: Passes year directly to map generation

**Phase 5: Game Mode Restoration ✅**
- **LocalStorage Bridge**: Stores game mode for post-character-creation restoration
- **Backward Compatibility**: Checks both `pendingGameMode` and `urlConfigGameMode` keys
- **Event System Sync**: Game mode properly initialized in event system

#### How It Works

1. **URL Generation**:
   - Player clicks "Share" button in InitialScenarioModal
   - System encodes current game state to base64
   - Generates URL like: `/262/ancestral-puebloan-lands/survival?state=eyJ2IjoxLC...`
   - URL contains human-readable path + encoded state parameter

2. **URL Restoration**:
   - App.tsx detects `?state=` parameter on load
   - Decodes full game state from base64
   - Stores character data in localStorage
   - Calls `onStartNewWorldAtLocation` with exact map area
   - Character generator uses stored spec
   - Game mode restored after character creation

3. **Data Flow**:
   ```
   URL → shareableStateService.decode() → fullState object
   ↓
   Character data → localStorage → characterGenerator
   Map area → onStartNewWorldAtLocation(zone, mapArea)
   Game mode → localStorage → eventSystem.setGameMode()
   ```

#### Files Modified

- **`services/shareableStateService.ts`** (NEW): Complete encoding/decoding service
- **`App.tsx`**: Added URL state detection and proper map generation calls
- **`components/InitialScenarioModal.tsx`**: Integrated share button and URL generation
- **`services/characterGenerator.ts`**: Added URL character restoration logic
- **`hooks/useMapState.ts`**: Already had proper location handling

#### Technical Solutions

**Problem 1: Map Area Truncation**
- **Issue**: "Ancestral Puebloan Lands" truncated to "Ancestral "
- **Solution**: Removed substring limits, use full names when no abbreviation exists

**Problem 2: Wrong Map Generation Function**
- **Issue**: `onStartNewWorldAtZoneRegion` expects region key, not map area name
- **Solution**: Use `onStartNewWorldAtLocation` which takes exact map area name

**Problem 3: Game Mode Not Persisting**
- **Issue**: Game mode lost after character creation
- **Solution**: Store in localStorage, restore in event system initialization

**Problem 4: Character Data Loss**
- **Issue**: Generated character didn't match URL specification
- **Solution**: Pass character spec through localStorage to generator

#### Testing the Implementation

1. **Generate a shareable URL**:
   - Start a game with specific settings
   - Click "Share" button in scenario modal
   - Copy the generated URL

2. **Test restoration**:
   - Open URL in new browser/incognito
   - Verify: Same character name, profession, age
   - Verify: Correct map area loaded
   - Verify: Correct game mode active
   - Verify: Same date/year

3. **Edge cases tested**:
   - Long character names: ✅ Preserved
   - Unusual map areas: ✅ Full names stored
   - All game modes: ✅ Correctly restored
   - Special characters: ✅ Base64 handles them

### Update: URL Sharing System Complete - December 9, 2024

#### Overview: Complete URL-Based Game State Sharing

The game now supports comprehensive URL-based state sharing, allowing players to share exact game configurations including character details, map location, date, and game mode through shareable URLs.

#### URL Format

URLs use a dual format for maximum compatibility:

**Human-readable path + encoded state query parameter:**
```
https://game.com/[year]/[location]/[mode]?state=[encoded-state]

Example:
https://game.com/1348/sulawesi/livelihood?state=eyJ2IjoxLCJ5IjoxMzQ4...
```

The encoded state contains:
- Complete character data (name, profession, age, gender)
- Exact map area name
- Game mode
- Map generation seed
- Date (year, month, day)
- Scenario type

#### How the System Works

**1. Creating a Shareable URL:**
- Player clicks "Share" button in InitialScenarioModal
- System creates ShareableGameState object with all game data
- Data is encoded to base64 URL-safe format
- URL is generated with both human-readable path and encoded state

**2. Restoring from URL:**
```
URL → App.tsx → shareableStateService.decodeGameState()
      ↓
validateAndRepairState() [NEW - validates and fixes any issues]
      ↓
- Zone detection from map area if missing
- Seed validation/generation if invalid  
- Game mode validation with localStorage fallbacks
- Character data completion with defaults
      ↓
Initialize game with validated state
```

**3. Zone Detection Service:**
- Automatically detects geographic zone from map area names
- Handles cases where zone is missing or invalid
- Provides intelligent fallbacks and fuzzy matching
- Example: "Sulawesi" → detects zone "Oceania", region "Indonesia"

#### Key Components

**Services:**
- `shareableStateService.ts`: Encoding/decoding and validation
- `zoneDetectionService.ts`: Zone detection from map areas
- `characterGenerator.ts`: Character restoration from URL data

**Validation & Repair (NEW):**
- `validateAndRepairState()`: Ensures all fields are valid
- Auto-detects zones from map areas
- Generates seeds if missing
- Validates game modes
- Completes character data

#### Testing the System

**Test URLs with Full State:**
```html
<!-- Year 1348, Sulawesi, Fisherman character -->
/1348/sulawesi/livelihood?state=eyJ2IjoxLCJ5IjoxMzQ4LCJtIjoxLCJkIjoxLCJtYSI6IlN1bGF3ZXNpIiwiZ20iOiJsaXZlIiwiY24iOiJLdW5jb3JvIFN1cnlhbnRvIiwiY3AiOiJmaXNoZXJtYW4iLCJjZyI6Im0iLCJjYSI6MjMsIm1zIjoiQUJDRDEyMzQiLCJzdCI6InAifQ

<!-- Year 262, Thar Desert, Herder character -->
/262/thar-desert-margin/survival?state=eyJ2IjoxLCJ5IjoyNjIsIm0iOjEsImQiOjEsIm1hIjoiVGhhciBEZXNlcnQgTWFyZ2luIiwiZ20iOiJzdXJ2IiwiY24iOiJCaWtyYW0gRGVvbCIsImNwIjoiaGVyZGVyIiwiY2ciOiJtIiwiY2EiOjI4LCJtcyI6IlhZWjk4NzY1Iiwic3QiOiJwIn0
```

**What Gets Preserved:**
✅ Exact character name and profession
✅ Specific map area (e.g., "Thar Desert Margin")
✅ Map generation seed for identical terrain
✅ Game date (year, month, day)
✅ Selected game mode
✅ Character age and gender

#### Recent Fixes (December 9, 2024)

1. **Zone Detection Issues:**
   - Fixed empty zone fields causing restoration failures
   - Added intelligent zone detection from map area names
   - Implemented validation and repair layer

2. **JavaScript Environment Errors:**
   - Fixed `require is not defined` error in browser
   - Changed to ES6 imports at module level
   - Fixed `mode is not defined` reference error

3. **Character Restoration:**
   - Character data now properly persists through URL
   - Generation context correctly passed to character generator
   - URL character specs override random generation

#### Success Metrics

✅ **Map areas preserved exactly** (e.g., "Ancestral Puebloan Lands")
✅ **Characters restored with correct names** and professions
✅ **Dates maintained accurately** from URLs
✅ **Map seeds generate identical terrain**
✅ **Game modes properly restored** after character creation
✅ **Zone detection working** when zone is missing
✅ **Validation prevents crashes** from invalid data

## Update Log

### August 19, 2025
- **COMPLETED PHASE 1**: URL-based game configuration system
  - Integrated React Router for URL parsing
  - Created comprehensive URL configuration service
  - Support for date ranges, geography, game modes, and seeds
  - Updated App.tsx and InitialScenarioModal for URL handling

- **COMPLETED PHASE 2**: Game seed system
  - Implemented deterministic SeededRandom generator
  - Created SeedManager for global seed management
  - Added seed display and sharing UI
  - Integrated with map and NPC generation
  - Shareable URLs with embedded seeds now functional

- **Technical Notes**:
  - Used Linear Congruential Generator for deterministic randomness
  - Hash string seeds to numeric values for map compatibility
  - Context-based random streams prevent interference
  - All core systems now use seeded randomness

**Historical Accuracy Notes**:
- All faction data written with strict attention to historical accuracy and specificity
- Where specific powers were unclear, provided best educated speculation based on historical patterns
- Maintained consistency with existing game date ranges and political entities
- Every region now has complete faction coverage across all historical eras

## Healing System Plan (Multi-Stage Implementation)

### Stage 1: Profession-Based Healing Unlocks
- Allow any character to become healer/herbalist on level up
- Make healing professions available in ALL eras/zones
- Unlock basic healing abilities with profession change

### Stage 2: Diagnosis Mechanics
- Create HealingModal component for medical interactions
- Implement symptom investigation mini-game
- Add Intelligence/Wisdom checks for diagnosis accuracy
- Risk of misdiagnosis leading to wrong treatments

### Stage 3: Treatment System
- Expand medicine crafting from herbs/materials
- Dosage selection (too little/much has consequences)
- Era-appropriate treatments (bloodletting → antibiotics)
- Track treatment outcomes and patient follow-ups

### Stage 4: Medical Quests
- Transform fetch quests into full medical scenarios
- "Diagnose illness" → "Gather ingredients" → "Prepare remedy" → "Monitor recovery"
- Epidemic response quests for disease outbreaks
- Build medical reputation through successful treatments

### Stage 5: Advanced Features
- Medical skill progression tree
- Specializations (surgeon, herbalist, plague doctor)
- Medical equipment crafting/trading
- Teaching/apprentice system for spreading medical knowledge

## Quest System Implementation - Phase 1 Complete (Latest Session)

### Phase 1: Fix Critical Bugs & Expand Location Types ✅

**Completed in this session:**

1. **✅ Expanded Valid Quest Locations**:
   - Modified `useCoreLoops.ts` to include ALL structure types: hamlets, bridges, mills, fortresses, wells, watchtowers
   - Added fallback detection for structures with keywords in names (e.g., "Military Base" detected as fortress)
   - System now continues even with zero structures (generates wilderness quests)

2. **✅ Fixed Structure Detection Issues**:
   - Updated `questService.ts` to handle inconsistent structure field names (location vs x/y coordinates)
   - Added `getStructureLocation()` helper function to safely extract coordinates
   - Fixed all structure filtering to check both `type` and `structureType` fields

3. **✅ Added Wilderness Fallback System**:
   - When NO structures exist, generates wilderness locations at different distances/angles
   - Created survival and exploration quests that don't require structures
   - Examples: "Travel 10 tiles", "Find water", "Survive 5 days"

4. **✅ Fixed Disease Service Error**:
   - Changed `diseaseService.ts` to export singleton instance
   - Updated `EncounterModal.tsx` to use the singleton (was trying to call static method on class)
   - Resolved "checkDirectContactTransmission is not a function" error

### Files Modified:
- **services/questService.ts**: Expanded location types, added wilderness fallback, fixed coordinate access
- **hooks/useCoreLoops.ts**: Expanded valid structure detection, enabled wilderness quest generation
- **services/diseaseService.ts**: Added singleton export for proper instantiation
- **components/EncounterModal.tsx**: Updated to use diseaseService singleton
- **services/eventService.ts**: Added mapData parameter to createQuestFromEvent call

### Rationale:
The quest system was failing on most maps because it required specific POI types (palaces, marketplaces) that rarely exist. By expanding to common structures (hamlets, mills) and adding wilderness fallbacks, quests now work on ALL maps. The coordinate access fixes handle the inconsistent data structures in the codebase.

## COMPREHENSIVE CODE REVIEW - August 15, 2025

### Current Roadmap Status Assessment

#### ✅ **Primary Source System (Phase 1) - COMPLETE**
**Status**: Successfully implemented with excellent architecture
- 42 shard files covering all cultural zones/eras
- Sophisticated caching with IndexedDB
- Context-aware search with temporal relevance scoring
- UI fully integrated with search, modals, and keyword highlighting
- **Ready for Phase 2 expansion**

#### ⚠️ **World Weaver System - BASIC IMPLEMENTATION**
**Status**: Core functionality exists but limited
- Basic prompt interpretation working
- Map area validation integrated
- **Missing**: Scenario generation, special NPCs, victory conditions
- File: `services/worldWeaverService.ts` needs expansion

#### ❌ **NPC System - CRITICAL GAPS**
**Status**: UI exists but backend incomplete
- Trade negotiation panel: No LLM integration (static responses)
- Reputation system: UI present but non-functional
- NPC agency: Cannot initiate interactions
- Memory persistence: Broken between conversations

### Easy Wins & Low-Hanging Fruit

#### 🎯 **Immediate UI Improvements (< 1 hour each)**
1. **Add Loading States**: Many async operations lack visual feedback
2. **Tooltip Enhancements**: Add keyboard shortcuts info to all buttons
3. **Mobile Touch Targets**: Increase to 44px minimum (accessibility)
4. **Error Messages**: Replace console.error with user-friendly toasts
5. **Keyboard Navigation**: Add Tab support for modals and controls

#### 🎮 **Gameplay Quick Fixes**
1. **Connect Trade LLM**: File `NpcTradeInterface.tsx:100` - Connect to existing LLM service
2. **Reputation Notifications**: Add visual feedback when reputation changes
3. **Memory Fix**: Persist NPC memories in localStorage/IndexedDB
4. **Quest Log**: Add simple todo-style quest tracker in sidebar
5. **Save/Load States**: Implement basic game state persistence

#### 📚 **Educational Enhancements**
1. **Source Counter**: Show "3/50 sources discovered" progress
2. **Historical Accuracy Badge**: Visual indicator when actions align with history
3. **Learning Objectives**: Add optional tutorial prompts for first-time players
4. **Citation Helper**: Auto-generate citations for discovered sources
5. **Time Period Context**: Add era-specific hints and warnings

#### ⚡ **Performance Optimizations**
1. **Component Splitting**: Break up 1000+ line `MapDisplayOptimized.tsx`
2. **Lazy Load Shards**: Only load primary source shards when needed
3. **Safari Blur Fix**: Already implemented conditional blur removal
4. **Bundle Analysis**: Run webpack-bundle-analyzer to find bloat
5. **Service Worker**: Enable offline play with cached assets

### Recent Updates Analysis

#### ✅ **Successful Updates**
- **August 10**: Complete faction/city data for ALL regions
- **August 7**: Fixed terrain features (estuaries, coral reefs)
- **August 6**: Mobile improvements, better map rendering, new ruins, ui fixes
- **Safari Performance**: Diagnosed and partially fixed blur issues
- **Day/Night Cycle**: Visual effects and NPC torch lighting
- **Map Generation**: Fixed shoals archetype (95% water)

#### ⚠️ **Partial Successes**
- **Safari Optimizations**: Some fixes caused SVG misalignment, rolled back
- **NPC Shadows**: Added but could use opacity adjustments
- **Touch Gestures**: Work but lack visual feedback

#### ❌ **Failed/Incomplete**
- **NPC Agency**: Still cannot initiate interactions
- **Trade System**: LLM integration never connected
- **Assessment Engine**: Not started
- **World Weaver Scenarios**: Basic implementation only

### Recommended Development Priority

#### **Week 1 - Complete NPC System**
1. Connect trade negotiation to LLM (2 hours)
2. Fix reputation system logic (2 hours)
3. Implement NPC memory persistence (3 hours)
4. Add NPC-initiated interactions (1 day)

#### **Week 2 - World Weaver MVP**
1. Scenario generation from prompts (2 days)
2. Special NPC injection (1 day)
3. Victory conditions system (1 day)
4. Integration with primary sources (1 day)

#### **Week 3 - Polish & Performance**
1. Component code splitting (1 day)
2. Global error boundaries (3 hours)
3. Accessibility audit & fixes (2 days)
4. Mobile UX improvements (2 days)

#### **Week 4 - Educational Features**
1. Assessment engine foundation (3 days)
2. Learning objectives system (1 day)
3. Progress tracking (1 day)

### Technical Debt to Address
1. **Type Safety**: Remove `any` types in map state
2. **Dead Code**: Remove unused `MapDisplay.tsx`
3. **File Organization**: Split mega-components
4. **Error Handling**: Add try-catch blocks and user feedback
5. **Testing**: No test coverage currently

### Overall Health Score: 7.5/10

**Strengths**:
- Excellent primary source implementation
- Solid service architecture
- Rich historical content
- Good performance optimizations

**Weaknesses**:
- Incomplete NPC features
- Missing educational assessment
- Mobile UX needs polish
- No automated testing

**Trajectory**: Strong foundation with clear path forward. Focus should be on completing partially-implemented features before adding new ones.

## Next Steps

## Future Feature Roadmap (To Be Implemented)

### 1. **URL-Based Game Configuration System** 🔗
Enable players to access specific historical scenarios via URL patterns for easy sharing and focused gameplay.

#### URL Schema Design:
```
historysimulator.vercel.app/[date-range]/[geography]/[game-mode]/[seed]

Examples:
- /1500-1600 → Any location in 16th century
- /1940-1954/europe/scholarship → Europe 1940-54 in scholarship mode  
- /medieval/mena → Medieval Middle East, any mode
- /1348/europe/survival → Black Death scenario
- /random → Current default behavior
```

### 2. **Game Seed System** 🎲
Implement reproducible game states via shareable seed codes.

#### Seed Components:
```typescript
interface GameSeed {
  mapSeed: number;        // For terrain generation
  year: number;           // Starting year
  location: string;       // Zone/region
  gameMode: string;       // Selected mode
  characterSeed: number;  // For character generation
  version: string;        // Game version for compatibility
}
```

#### Implementation Steps:
1. **Seed Generation** (2 hours)
   - Create 8-character alphanumeric seed from game state
   - Base64 encode the GameSeed object
   - Display prominently in Settings with copy button

2. **Seed Input UI** (2 hours)
   - Add "Enter Game Seed" input in Settings
   - "Load from Seed" button
   - Validation and error messages

3. **Seed Application** (3 hours)
   - Parse and validate seed structure
   - Apply all seed parameters to game initialization
   - Ensure deterministic random number generation

4. **URL Integration** (1 hour)
   - Support seed as URL parameter: `/1500/europe/survival/ABC123XY`
   - Auto-copy shareable URL with seed

### 3. **NPC & Animal Internal Monologue** 💭 [✅ IMPLEMENTED]
Clickable portraits reveal inner thoughts (up to 3 clicks for deeper monologues).
- Implemented in `EncounterModal.tsx` with `generateInternalMonologue` from LLM service
- Caches responses to avoid repeat API calls
- Works for both NPCs and animals with context-aware thoughts

#### Implementation Steps:
1. **UI Trigger** (2 hours)
   - Make NPC/animal portraits clickable in modals
   - Add subtle hover effect (slight glow)
   - Track click count (max 3)

2. **Monologue Modal** (3 hours)
   - Create `InternalMonologueModal.tsx`
   - Large portrait (200x200px) on left
   - Text area on right with typewriter effect
   - Italic serif font for thoughts

3. **LLM Integration** (3 hours)
   - Create prompt template:
     ```
     Character: [name, age, profession, personality]
     Context: [current situation, health, location]
     Task: Write 2 sentences of internal monologue.
     Style: Stream-of-consciousness, emotional, personal
     ```
   - Cache responses to avoid repeat API calls
   - Different thoughts for each of 3 clicks

4. **Typewriter Animation** (2 hours)
   - Word-by-word reveal (100ms per word)
   - Cursor blink effect
   - Smooth fade-in for each word

### 5. **Theft Mechanic** 🗡️ [⚠️ PARTIALLY IMPLEMENTED]
NPCs can approach with theft intent based on desperation/personality.
- Approach behavior implemented in `npcInitiatedEncounterService.ts`
- Theft probability calculations exist
- Missing: Actual item stealing mechanism and player detection checks

#### Theft Calculation:
```typescript
theftChance = baseChance 
  * personalityModifier (greed, desperation)
  * professionModifier (thief: 5x, merchant: 0.5x)
  * healthModifier (sick: 2x, starving: 3x)
  * reputationModifier (player rep affects trust)
```

#### Implementation Steps:
1. **Theft Detection System** (3 hours)
   - Calculate theft chance during encounters
   - Wisdom check to notice attempt
   - Dexterity check for NPC success

2. **Theft Outcomes** (2 hours)
   - Success: Random item stolen, NPC flees
   - Caught: Reputation loss, combat option
   - Failed: NPC apologizes or becomes hostile

3. **UI Feedback** (2 hours)
   - Red flash animation when theft occurs
   - "Your [item] has been stolen!" notification
   - Option to pursue or let go

4. **Recovery Mechanics** (1 hour)
   - Find thief at nearby locations
   - Negotiate, fight, or forgive

### 6. **Expanded Profession System** 👥 [✅ IMPLEMENTED]
Massive profession database with 4000+ lines of culturally-specific roles.
- Complete coverage of all cultural zones and historical eras
- Includes unique professions like 'Tohunga' (Oceania), 'Griot' (Africa), etc.
- Each profession has stat requirements, social requirements, and gender biases where historically accurate
- Modern era includes contemporary roles (CEO, Software Engineer, etc.)

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Special Maps System - December 2024

### Current State of Special Maps

Special maps are interior/special area maps that players enter from the main world map. When a player enters certain structures (government districts, palaces, marketplaces, holy sites), they transition to a detailed interior map with NPCs, furniture, and cultural theming.

### Core Files

#### Generation Pipeline
1. **`specialMapGenerator.ts`** - Main entry point, routes to archetype generators
2. **`specialMapNpcGenerator.ts`** - Generates culturally appropriate NPCs for rooms
3. **Archetype Generators** (in `/archetypes/`):
   - `governmentGenerator.ts` - Government forums (162 uses)
   - `palaceVariantGenerator.ts` - Palace complexes (73 uses)
   - `sacredGenerator.ts` - Religious buildings (33 uses)
   - `estatesGeneratorFixed.ts` - Noble estates
   - `marketGenerator.ts` - Markets and bazaars
   - Plus 10+ other specialized generators

#### Data & Configuration
1. **`governmentDistricts.ts`** - 339 government building definitions
2. **`specialMapAugmentation.ts`** - Material systems (CULTURE_MATERIALS)
3. **`specialMapTypes.ts`** - Type definitions and enums

#### Utility Systems (Active)
- **`mapLayoutUtils.ts`** - Wall/floor placement with cultural materials
- **`culturalFlooringService.ts`** - Pattern-based flooring (Islamic geometric, etc.)
- **`advancedLightingSystem.ts`** - Torch/brazier placement
- **`directionalFurniturePlacement.ts`** - Furniture orientation
- **`storageUtilitySystem.ts`** - Chest/barrel placement
- **`culturalFurnitureSystem.ts`** - Era-appropriate furniture sets

### How It Works

1. **Player Interaction Flow**:
   - Player stands on GOVERNMENT_DISTRICT tile
   - Presses key/clicks to open GovernmentDistrictModal
   - Modal shows building info with "Enter Building" button
   - Click triggers `onEnterSpecialMap(config)`

2. **Configuration Chain**:
   ```
   GovernmentDistrictModal → selectGovernmentType() → returns GovernmentDistrictType
   GovernmentDistrictType.archetype → SpecialMapArchetype enum value
   specialMapGenerator routes based on archetype
   ```

3. **Generation Process**:
   - Generator creates tiles array with walls/floors
   - Applies cultural materials based on zone/era
   - Places furniture/decorations
   - Defines rooms with bounds for NPC placement
   - NPC generator populates rooms with appropriate NPCs

### ✅ COMPLETED: Special Map Archetype Variety (December 2024)


### Files with Legacy Issues

- `palaceVariantGenerator.ts` - Uses old room format without bounds
- Some older generators may have similar issues

### Benefits of Planned Improvements

1. **Cultural Authenticity**: Tribal councils won't have marble columns
2. **Layout Variety**: 6 distinct layouts instead of 1
3. **Historical Accuracy**: Courts look like courts, not forums
4. **Scalability**: Each archetype can have cultural variations
5. **Reusability**: ~160 buildings get proper archetypes
