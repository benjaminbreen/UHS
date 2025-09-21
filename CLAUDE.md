# Universal History Simulator - Development Notes

## KEY CODEBASE INFORMATION (Updated September 18, 2025)

### DEPRECATED SYSTEMS (September 18, 2025)

#### **Ambiance Text System** - ❌ DEPRECATED
- **Files**: `services/ambianceGenerator.ts`, `components/AmbianceDisplay.tsx`
- **Function**: `generateAmbianceText()`
- **Reason**: Generated repetitive text that didn't align with other game systems' reality depiction
- **Status**: Disabled in UI, LLM calls replaced with placeholder text
- **Alternative**: LLM services now use raw tile/climate data directly for more accurate context

### 1. Special Map Archetypes Currently in Use
**Full list of archetype generator files in `/generation/specialMap/archetypes/`:**
- `arenaGenerator.ts`
- `campgroundGenerator.ts`
- `courtChamberGenerator.ts`
- `estatesGeneratorFixed.ts`
- `exhibitionGenerator.ts`
- `governmentForumFixed.ts`
- `governmentGenerator.ts`
- `marketGenerator.ts`
- `openFieldGenerator.ts`
- `palaceVariantGenerator.ts`
- `restaurantInnGenerator.ts`
- `sacredGenerator.ts`
- `theaterGenerator.ts`
- `tribalCouncilGenerator.ts`
- `universityGenerator.ts`
- `universityGeneratorV2.ts`
- `vesselGenerator.ts`

**Cultural variant generators in `/archetypes/cultures/`:**
- `nativeAmericanGenerators.ts`
- `preColumbianGenerators.ts`
- `oceaniaGenerators.ts`
- `southeastAsianGenerators.ts`
- `asianGenerators.ts`
- `europeanGenerators.ts`
- `africanGenerators.ts`
- `middleEasternGenerators.ts`
- `southAsianGenerators.ts`

### 2. Cultural Zones Used in Game
**Exact CulturalZone type values:**
- `EUROPEAN`
- `EAST_ASIAN`
- `MENA` (Middle East & North Africa)
- `NORTH_AMERICAN_PRE_COLUMBIAN`
- `NORTH_AMERICAN_COLONIAL` [for generation of north america AFTER columbian exchange up to present - variable timeline depending on location]
- `OCEANIA`
- `SOUTH_ASIAN`
- `SOUTH_AMERICAN`
- `SUB_SAHARAN_AFRICAN`

### 3. Historical Eras Used
**HistoricalEra enum values (from `types/ambiance.ts`):**
- `PREHISTORY` (approx. -3000 to -500)
- `ANTIQUITY` (approx. -500 to 500)
- `MEDIEVAL` (approx. 500 to 1500)
- `RENAISSANCE_EARLY_MODERN` (approx. 1500 to 1800)
- `INDUSTRIAL_ERA` (approx. 1800 to 1950)
- `MODERN_ERA` (approx. 1950 to 2000)
- `FUTURE_ERA` (approx. 2000 to 2026) **NOTE: Despite the name, FUTURE_ERA represents 2000-2025 period, not the actual future**

### 4. Standard Map Biome Types
**BiomeType enum values used in standard maps (from `types/biomes/base.ts`):**

**Natural Terrain:**
- `DEEP_OCEAN`, `SHALLOW_OCEAN`, `BEACH`
- `GRASSLAND`, `FOREST`, `DENSE_FOREST`, `JUNGLE`, `SCRUB`
- `HILLS`, `MOUNTAIN`, `HIGH_PEAK`, `CLIFF`
- `DESERT`, `OASIS`, `TUNDRA`, `STEPPE`
- `SNOW`, `SALT_FLATS`

**Water Features:**
- `RIVER`, `MAJOR_RIVER`, `RIVERBANK`
- `FRESHWATER_LAKE`, `WETLANDS`, `MANGROVE`
- `ESTUARY`, `REEF`, `SHOALS_TILE`

**Volcanic/Geothermal:**
- `VOLCANIC_SOIL`, `VOLCANIC_ROCK`, `ACTIVE_LAVA`
- `HOT_SPRINGS`

**Urban/Settlement:**
- `HAMLET`, `LOW_DENSITY_CITY`, `DENSE_CITY`, `CITY_CENTER`
- `URBAN` (Legacy)
- `FARMLAND`, `MARKETPLACE`, `GOVERNMENT_DISTRICT`
- `PALACE`, `HOLY_SITE`, `RUINS`
- `PARK`, `PLAZA`, `ROAD`
- `HARBOR_DISTRICT`, `INDUSTRIAL_DISTRICT`

**Ethereal Realm (Special zones only):**
- `AIR` (clouds, darkness, storms based on climate)
- `UNDERSEA` (glowing underwater realm)

**Architectural (Special maps only):**
- Various wall, floor, and furniture types for interior maps

### 6. Combat Background System (September 2025)

The game uses a sophisticated priority-based background selection system for combat scenarios that supports **weather**, **time of day**, and **cultural zone** customization.

#### **File Naming Convention**
All combat background files use **underscores** (not spaces) and follow this priority pattern:

**Highest Priority (most specific):**
- `biome_weather_time_culture.png` (e.g., `dense_city_rain_night_mena.png`)
- `biome_weather_culture.png` (e.g., `dense_city_rain_mena.png`)
- `biome_time_culture.png` (e.g., `low_density_city_crepuscular_east_asian.png`)
- `biome_culture.png` (e.g., `dense_city_mena.png`)
- `biome_weather_time.png` (e.g., `wetlands_rain_crepuscular.png`)
- `biome_weather.png` (e.g., `wetlands_rain.png`)
- `biome_time.png` (e.g., `wetlands_crepuscular.png`)

**Base & Fallbacks (lowest priority):**
- `biome.png` (e.g., `wetlands.png`, `dense_city.png`, `hot_springs.png`)
- Fallback mappings (if specific biome file doesn't exist)
- Universal fallbacks: `grassland.png`, `hills.png`, `forest.png`, `desert.png`

#### **Biome Naming Convention**
The system ALWAYS checks for the exact biome name first (converted to lowercase with underscores):
- `LOW_DENSITY_CITY` → `low_density_city.png`
- `DENSE_CITY` → `dense_city.png`
- `HOT_SPRINGS` → `hot_springs.png`
- `VOLCANIC_SOIL` → `volcanic_soil.png`
- `HAMLET` → `hamlet.png`

**Urban Fallback Chain:**
- `hamlet` → `low_density_city` → `dense_city`
- `marketplace`, `plaza`, `harbor_district` → `low_density_city` → `dense_city`
- `government_district`, `palace`, `industrial_district` → `dense_city`

Every biome can have its own specific background file before falling back to alternatives.

#### **Supported Variants**
**Weather suffixes:** `rain`, `snow`, `fog`
**Time suffixes:** `crepuscular` (dawn 4-8am, dusk 6-9pm)
**Culture suffixes:** `european`, `east_asian`, `mena`, `precolumbian`, `colonial`, `oceania`, `south_asian`, `south_american`, `african`

**Note: Night backgrounds (10pm-4am) now use automatic CSS filter tinting instead of separate _night.png files**
- Standard backgrounds are darkened and blue-tinted using CSS filters during nighttime
- Filter applied: `brightness(0.5) saturate(0.7) hue-rotate(200deg) contrast(1.1)`
- This creates a classic "film noir" blue-tinted night effect without needing separate assets

**Cultural Fallback Chains** (related cultures check each other):
- **Asian/Eastern Sphere**: `east_asian` ↔ `south_asian` ↔ `oceania` ↔ `mena`
- **Indigenous American**: `precolumbian` ↔ `south_american`
- **Western/Colonial**: `european` ↔ `colonial`
- **African**: `african` → `mena`

#### **Example Priority Chains**

**Example 1: Dense City in African region at dawn/dusk:**
1. `dense_city_crepuscular_african.png` ⭐ Time + Cultural variant
2. `dense_city_african.png` ⭐ Cultural variant
3. `dense_city_crepuscular.png` ⭐ Time variant
4. `dense_city.png` ⭐ Base dense city
5. `grassland.png`, `hills.png`, etc. (universal fallbacks)

**Example 2: Low Density City in African region (no specific file):**
1. `low_density_city_african.png` (doesn't exist, moves on)
2. `low_density_city_mena.png` ⭐ Check related culture (Africa → MENA)
3. `low_density_city.png` (doesn't exist, moves on)
4. `dense_city_african.png` ⭐ Fallback to dense city African variant
5. `dense_city_mena.png` ⭐ Check related culture for fallback biome
6. `dense_city.png` ⭐ Fallback to base dense city
7. `grassland.png`, etc. (universal fallbacks)

**Example 3: Hamlet in Oceania (only South Asian variant exists):**
1. `hamlet_oceania.png` (doesn't exist)
2. `hamlet_south_asian.png` ⭐ Found via cultural fallback chain!
3. `hamlet_east_asian.png` (would check if south_asian didn't exist)
4. `hamlet_mena.png` (would check if previous didn't exist)
5. `hamlet.png` (generic fallback)

This system allows **maximum flexibility** - create detailed cultural variants where needed, simple weather variants elsewhere, or just use base backgrounds.

### 5. Complete List of Modals Currently in Use
**All Modal components (47 total):**
- `AboutModal.tsx`
- `ActionConfigModal.tsx`
- `AnimalCompanionModal.tsx`
- `AnimalInfoModal.tsx`
- `AttributeModal.tsx`
- `CharacterProfileModal.tsx`
- `CityModal.tsx`
- `CombatModal.tsx`
- `ContainerModal.tsx`
- `CraftingModal.tsx`
- `DevBuildingModeModal.tsx`
- `DiseaseContractedModal.tsx`
- `DiseaseModal.tsx`
- `EncounterModal.tsx`
- `EventModal.tsx`
- `ExplanationModal.tsx`
- `FactionsModal.tsx`
- `FishingHutModal.tsx`
- `GameOverModal.tsx`
- `GovernmentDistrictModal.tsx`
- `HolySiteModal.tsx`
- `InitialScenarioModal.tsx`
- `InteractionModal.tsx` (in `/interiorMap/`)
- `InteriorModal.tsx` (in `/interiorMap/`)
- `LevelUpModal.tsx`
- `LootModal.tsx`
- `MapDetailsModal.tsx`
- `MarketplaceModal.tsx`
- `MineModal.tsx`
- `MiningModal.tsx`
- `NewItemModal.tsx`
- `NpcConfrontationModal.tsx`
- `NpcModal.tsx`
- `POIInteractionModal.tsx`
- `POIToastModal.tsx`
- `PointOfInterestModal.tsx`
- `PortraitModal.tsx` (in `/portraits/`)
- `PrimarySourceModal.tsx`
- `ReputationModal.tsx`
- `RuinStructureModal.tsx`
- `SavedGamesModal.tsx`
- `SettlementInfoModal.tsx`
- `SkillsModal.tsx`
- `TerrainStructureModal.tsx`
- `TileInfoModal.tsx`
- `VictoryModal.tsx`
- `WorldMapModal.tsx`
- `WorldWeaverModal.tsx`

##  NOTE FOR FUTURE CLAUDEs
**Date Awareness**: Claude's system does not reliably provide the current date. Do not write dates unless explicitly provided by the user. User has confirmed today is September 13, 2025.

## Project Overview
- **Creator**: Benjamin Breen, Historian at UCSC
- **Purpose**: Educational history simulation game for both general public and history students

## Current State Summary (September 12, 2025)

### ✅ Fully Implemented Systems
- **Event System**: 9 game modes, procedural + LLM quest generation, quest success tracking [not fully implemented]
- **URL Sharing**: Complete state encoding/decoding with character preservation [semi-functional]
- **Special Maps**: Government archetypes with cultural variations (TRIBAL_COUNCIL, COURT_CHAMBER, GOVERNMENT_FORUM, etc.) used to represent interiors
- **NPC Generation**: Culturally accurate names, professions, appearances
- **Professions System**: 4000+ lines of culturally-specific professions across all eras/zones
- **Physical Feat System**: Narration panel detects and evaluates climbing, fording, jumping actions
- **Save/Load System**: Fully integrated via settings menu with localStorage persistence - supports up to 10 saved games with complete state restoration

### ⚠️ Systems With Issues
- **Quest System**: need to finalize the saving and loading system; currently quests should reset with every reloead since reloads start player in new setting as new playable character (PC)
- **Primary Sources**: data embedded in various public/sources/metadata files, naming convention: asia-antiquity.json, asia-medieval.json, etc.

### ⚠️ Partially Implemented
- **NPC Testing Panel**: Basic testing works, missing dialogue/trade testing
- **World Weaver**: Can interpret prompts, generate quests, select game modes, but quest generation not yet integrated

### ❌ Not Yet Implemented
- **Educational Assessment**: Not started
- **Learning Objectives**: Not started

## Audio System Best Practices (September 2025)

### **Procedural Audio Design Philosophy**
The game uses 100% procedural Web Audio API generation - no external audio files. This approach provides:
- **Zero loading times** - sounds generate instantly
- **Infinite variety** - subtle randomization prevents repetition
- **Cultural authenticity** - sounds can be algorithmically adapted to historical contexts
- **Bandwidth efficiency** - no large audio assets to download

### **Context-Aware Audio Integration**
**Key Principle**: Audio should respond to specific game states, not just play globally.

**Implementation Pattern**:
1. **State-Driven Triggers**: Use React `useEffect` hooks to monitor specific state changes (e.g., `isGameActive`, modal opens/closes)
2. **Automatic Cleanup**: Always provide cleanup functions to stop audio when contexts change
3. **Volume Stratification**: Different audio types use different base volumes (UI clicks: 3%, ambient music: 10%, victory fanfares: 15%)
4. **Respectful Integration**: Audio respects existing mute/volume systems and doesn't interfere with other sounds

**Example - Fishing Music Integration**:
```typescript
useEffect(() => {
  if (isGameActive) {
    gameSoundsService.playFishingMusic(); // Start when entering fishing minigame
  } else {
    gameSoundsService.stopFishingMusic();  // Stop when returning to main interface
  }
  return () => gameSoundsService.stopFishingMusic(); // Cleanup on unmount
}, [isGameActive]);
```

This pattern should be applied to future audio features.

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


#### How Seed/URL sharing Works 

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
- Teachers can share exact historical scenarios with students, etc 

## Implementation Report - August, 2025

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


## Physical Feat System (December 2024)

### Overview
The Physical Feat System allows players to attempt contextual physical actions through the narration panel. When players type actions like "climb the cliff" or "ford the river", the system evaluates feasibility and determines success.

### How It Works
1. **Detection** (`physicalFeatService.ts:36-143`): Pattern matching detects feat attempts from player input
2. **Evaluation**:
   - Primary: Google Gemini AI evaluates based on character stats, terrain, equipment
   - Fallback: Formula-based calculation if AI unavailable
3. **Execution**: Random roll against success chance, applies effects (damage, fatigue, position change)

### Success Rates (Post-December 2024 Update)
- **Climbing**: Base 50% + (dexterity × 3%) + strength bonus
  - Average character (dex 10): 80% success chance
  - Good stats (dex 15): 95% success chance
- **Fording**: Base 60% + (strength × 2.5%) - fatigue penalty
  - Average character (str 10): 85% success chance
- **AI Guidance**: Instructed to be generous with success rates for fun gameplay

### Supported Actions
- **Climb/Scale**: Trees, walls, cliffs, rocks, mountains
- **Ford/Wade**: Rivers, streams, creeks
- **Jump/Leap**: Gaps, chasms, obstacles
- **Swim/Dive**: Rivers, lakes, oceans

### Integration Points
- `hooks/useUIState.ts`: Handles narration input and feat detection
- `services/physicalFeatService.ts`: Core feat logic and LLM integration
- Effects: Movement, fatigue cost, health damage, item loss

## Save/Load System Implementation (December 2024 - ACTUALLY IMPLEMENTED)

### Overview
Implement a localStorage-based save/load system that preserves the fresh-start-on-reload behavior while allowing intentional saves through a dedicated UI.

### Phase 1: Basic Save/Load (Core State)
- **SaveGameService**: Service to manage save/load operations
- **SavedGame Interface**: Character, map, location, date, game mode
- **SavedGamesModal**: UI for managing saved games
- **Integration**: Settings panel trigger, App.tsx restoration

### Phase 2: Complete State (NPCs, Quests, Inventory)
- Add NPCs positions and states
- Save active quests and progress
- Preserve full inventory and equipment
- Event history and reputation

### Phase 3: Polish (Future)
- Auto-save every 5 minutes
- Visual thumbnails for saves
- Cloud sync preparation
- Import/export saves

### Implementation Details

#### SavedGame Data Structure:
```typescript
interface SavedGame {
  id: string;
  name: string;
  timestamp: number;
  thumbnailEmoji: string;
  
  // Core state (Phase 1)
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  mapSeed: string;
  currentLocation: { x: number; y: number };
  year: number;
  month: number;
  day: number;
  timeOfDay: number;
  gameMode: string;
  
  // Extended state (Phase 2)
  npcs?: NpcEntity[];
  activeQuests?: Quest[];
  eventHistory?: EventHistoryEntry[];
  reputation?: number;
  
  // Metadata
  playTime: number;
  version: string;
}
```

## ✅ Special Map Workspace Routing Enhancement (COMPLETED - September 19, 2025)

### **Problem Analysis:**
CityModal workspaces previously incorrectly routed to government district special maps instead of appropriate workspace archetypes. The system lacked:
1. ❌ Dedicated WORKSHOP archetype for small craftsman buildings → ✅ **FIXED**
2. ❌ Culture/era-specific routing logic → ✅ **IMPLEMENTED**
3. ❌ Proper archetype mapping between business types and special map generators → ✅ **FIXED**

### **Two-Phase Implementation (COMPLETED):**

#### **✅ Phase 1: WorkshopGenerator Archetype (COMPLETED)**
**Objective:** Create dedicated `WorkshopGenerator` for small craftsman buildings with single shopkeeper

**1.1 Add WORKSHOP archetype to enum** (5 minutes)
- Add `WORKSHOP = 'WORKSHOP'` to `SpecialMapArchetype` enum in `types/specialMapTypes.ts`

**1.2 Create workshopGenerator.ts** (45 minutes)
- Copy structure from `restaurantInnGenerator.ts`
- Create smaller, simpler layout (8x8 or 10x10 default)
- Single main room with:
  - Work area (anvil/workbench/tools based on profession)
  - Storage area (materials, finished goods)
  - Simple entrance
  - Cultural theming for walls/floors
- Support workshop types: smithy, pottery, weaving, carpentry, etc.

**1.3 Register WorkshopGenerator in specialMapGenerator.ts** (10 minutes)
- Import `{ generateWorkshop } from './archetypes/workshopGenerator'`
- Add case for `SpecialMapArchetype.WORKSHOP` in switch statement
- Set appropriate map size constraints in `determineMapSize()`

**1.4 Update CityModal archetype mapping** (15 minutes)
- Fix `determineWorkspaceArchetype()` to return proper enum values
- Map crafting professions (smith, baker, weaver, etc.) to `'WORKSHOP'`
- Ensure config structure matches `SpecialMapConfig` interface

#### **✅ Phase 2: Culture/Era-Specific Routing Logic (COMPLETED)**
**Objective:** Route workspaces to appropriate archetypes based on cultural zone and historical era

**✅ 2.1 Create Advanced Workspace Router (COMPLETED)**
- ✅ Replaced `determineWorkspaceArchetype()` with `determineWorkspaceArchetypeAdvanced()`
- ✅ Input: `businessType`, `culturalZone`, `era`, `population`, `wealthLevel`
- ✅ Logic examples implemented:
  - European Medieval tavern → RESTAURANT_INN
  - MENA Medieval spice merchant → MARKET_BAZAAR
  - East Asian blacksmith → WORKSHOP
  - European Industrial factory → WORKSHOP (larger size)
  - Tribal shaman hut → SACRED_COMPLEX (small)

**✅ 2.2 Era-Specific Archetype Variations (COMPLETED)**
- Modify existing generators to accept era/culture parameters
- **restaurantInnGenerator**: Medieval taverns vs modern restaurants vs tribal gathering spaces
- **marketGenerator**: Bazaars vs trading posts vs department stores vs tribal trade circles
- **workshopGenerator**: Simple huts vs guild workshops vs industrial factories

**✅ 2.3 Culture-Specific Layout Rules (COMPLETED)**
- ✅ Leveraged existing cultural furniture systems
- ✅ **European**: Stone/wood construction, rectangular layouts
- ✅ **East Asian**: Paper screens, courtyard elements, tatami
- ✅ **MENA**: Geometric tile patterns, enclosed courtyards
- ✅ **Indigenous**: Circular layouts, natural materials, open designs
- ✅ **Modern**: Industrial materials, larger spaces, electric lighting

**✅ 2.4 Population-Based Scaling (COMPLETED)**
- ✅ Small settlements (hamlet): Always WORKSHOP for individual craftsmen
- ✅ Medium towns: Mix of WORKSHOP and MARKET_BAZAAR
- ✅ Large cities: MARKET_BAZAAR for major merchants, WORKSHOP for specialists
- ✅ Era scaling: Prehistoric/tribal always small, modern era can be massive
- ✅ Population thresholds: >2000 = large settlements, >5000 = major cities
- ✅ Workshops scale equipment/storage based on population and wealth

**✅ Implementation Files (ALL COMPLETED):**
- ✅ **New:** `generation/specialMap/archetypes/workshopGenerator.ts` (500+ lines)
- ✅ **Modified:** `types/specialMapTypes.ts`, `generation/specialMap/specialMapGenerator.ts`, `components/CityModal.tsx`

**✅ Testing Strategy (IMPLEMENTED):**
- ✅ Phase 1: WORKSHOP archetype generation working across all cultural zones
- ✅ Phase 2: Advanced routing system handles culture/era/population matrix properly
- ✅ All workshop types (smithy, pottery, weaving, carpentry, bakery) implemented with scaling

## Update Log

### September 19, 2025
- **✅ Special Map Workspace Routing Enhancement COMPLETED**: Fixed workspace routing that was incorrectly sending users to government districts
  - ✅ Created comprehensive WorkshopGenerator archetype (500+ lines) supporting smithy, pottery, weaving, carpentry, bakery
  - ✅ Implemented advanced culture/era-specific routing logic in CityModal
  - ✅ Added population-based scaling for workshop complexity (village smithy vs major city industrial operations)
  - ✅ Enhanced all workshop types with era-appropriate materials and technology
  - ✅ Integration tested successfully - businesses now route to appropriate archetypes instead of government districts
- **CityModal Enhancement Complete**: Added LLM-powered city descriptions and responsive banner sizing
- **Special Map Routing Analysis**: Identified workspace routing issues and created implementation plan

### September 12, 2025 (Previous)
- **Physical Feat System**: Improved success rates for better gameplay (50-85% base chances)
- **CLAUDE.md Updates**: Added Physical Feat System documentation, corrected date awareness issue
- **Skeptical Review Results**:
  - ❌ Event System has 9 modes, not 8 as claimed (includes HEALER_MODE)
  - ❌ Quest System SAVES to localStorage, doesn't reset on reload as claimed
  - ❌ Primary Sources has NO shard files (claimed 42), data embedded in service
  - ❌ Save/Load System NOT integrated - modal exists but not hooked up to UI
  - ✅ NPC memory persistence WORKS
  - ✅ Theft mechanic FULLY IMPLEMENTED
  - ✅ NPC Internal Monologue WORKS
  - ✅ URL Sharing WORKS as claimed


**Historical Accuracy Notes**:
- All faction data written with strict attention to historical accuracy and specificity
- Where specific powers were unclear, provided best educated speculation based on historical patterns
- Maintained consistency with existing game date ranges and political entities
- Every region now has complete faction coverage across all historical eras

## Disease Progression System Enhancement (September 20, 2025)

### **Complete Implementation - All 6 Phases ✅**

#### **Phase 1: Disease-Based Movement Restrictions** ✅
- **File**: `services/diseaseProgressionService.ts` (NEW)
- Movement penalty multipliers scale from 1.0x (normal) to 60.0x (terminal stage)
- Movement restrictions ONLY apply at terminal stage (85%+ severity) to prevent premature limitations
- 5 progression stages: early → moderate → severe → critical → terminal
- Disease-specific penalties for rabies (complete paralysis), plague, tuberculosis

#### **Phase 2: Voice Loss Dialogue Restrictions** ✅
- **File**: `hooks/useUIState.ts` - Voice loss detection in narrator input
- **File**: `components/EncounterModalUpdated.tsx` - Visual feedback system
- Voice loss levels 0-3: normal → weak → whispers → complete silence
- Input field color changes based on voice loss level (yellow → red)
- Player input replaced with "..." when voice loss level >= 3
- Warning messages about speech limitations in encounter UI

#### **Phase 3: Severe Visual Symptoms** ✅
- **File**: `components/portraits/ProceduralPortrait.tsx`
- Disease-specific visual symptoms overlaid on portraits:
  - Smallpox: red facial rash/pockmarks
  - Bubonic plague: darkened skin tone with gangrene
  - Cholera: grayish pallor from dehydration
  - Tuberculosis: pale, consumptive complexion
- Symptoms scale with disease severity for realistic progression

#### **Phase 4: NPC Disease Awareness & Avoidance** ✅
- **File**: `services/encounterService.ts` - Disease awareness integration
- **File**: `services/llmService.ts` - LLM prompt modification
- Social avoidance levels 0-3: normal → mild concern → obvious illness → severe/contagious
- NPCs react appropriately to visible symptoms in dialogue
- Disease modifier strings provide NPC context about player's condition

#### **Phase 5: Player Death from Disease** ✅
- **File**: `hooks/useCoreLoops.ts` - Death detection system
- Random death checks for terminal diseases (up to 5% chance per day)
- Immediate death for complete paralysis (rabies day 7+)
- GameOverModal integration with disease-specific death messages

#### **Phase 6: NPC Death Notifications** ✅
- **File**: `components/NpcDeathModal.tsx` (NEW)
- **File**: `hooks/useCoreLoops.ts` - NPC death detection
- **File**: `App.tsx` - Modal integration
- Auto-closing notifications (8 seconds) when NPCs die from disease
- Shows NPC details, disease information, and contextual death messages

### **Disease Stage Progression & Notifications** ✅

#### **Core Notification System**
- **File**: `services/diseaseNotificationService.ts` (NEW)
- **File**: `components/DiseaseProgressionModal.tsx` (NEW)
- Historically accurate, disease-specific progression descriptions
- Stage change detection with notification events
- Auto-closing modals with stage-appropriate timing (6-8 seconds)

#### **Progression Stages & Effects**
1. **Early Stage** (0-30% severity): Minimal symptoms, no gameplay impact
2. **Moderate Stage** (30-50% severity): Visible symptoms, mild social avoidance
3. **Severe Stage** (50-70% severity): Obvious illness, weak voice, social concern
4. **Critical Stage** (70-85% severity): Severe symptoms, whispers only, active avoidance
5. **Terminal Stage** (85%+ severity): Movement severely limited (60x slower), no speech, death approaching

#### **Disease Progression Timing**
- **Updates Once Per Game Day**: Disease progression occurs when game clock reaches midnight (newHours === 0)
- **Location**: `useCoreLoops.ts` lines 305-358
- **Not Hourly**: Progression is daily, not every hour or two as initially unclear
- Stage changes trigger immediate notification modals to inform players

### **Key Design Decisions**
- **Movement restrictions delayed**: Only apply at terminal stage to prevent frustrating early-game limitations
- **Player feedback prioritized**: Comprehensive notification system keeps players informed of disease progression
- **Historical accuracy maintained**: Disease-specific symptoms and progression match historical medical understanding
- **Integrated systems**: All disease effects flow through existing game systems (combat, dialogue, portraits, death)

### **Files Created/Modified**
**New Files:**
- `services/diseaseProgressionService.ts` - Core disease restriction calculations
- `services/diseaseNotificationService.ts` - Progression event generation
- `components/DiseaseProgressionModal.tsx` - Player progression notifications
- `components/NpcDeathModal.tsx` - NPC death notifications

**Modified Files:**
- `hooks/useCoreLoops.ts` - Movement penalties, death detection, progression checking
- `hooks/useUIState.ts` - Voice loss input restrictions
- `components/EncounterModalUpdated.tsx` - Voice loss visual feedback
- `components/portraits/ProceduralPortrait.tsx` - Disease visual symptoms
- `services/encounterService.ts` - NPC disease awareness
- `services/llmService.ts` - Disease context in LLM prompts
- `App.tsx` - Modal state management and callback integration

## Disease & Medical System Status (September 2025)

### ✅ FULLY IMPLEMENTED Systems

**Comprehensive Disease System** (`types/diseaseTypes.ts`)
- 35+ historically accurate diseases with multi-stage progression
- Cultural/era restrictions (Columbian Exchange tracking)
- Disease types: respiratory, gastrointestinal, vector-borne, contact, parasitic, zoonotic, nutritional, toxic
- Progressive symptoms with stat effects (health, fatigue, strength penalties)

**Cultural Medical Knowledge** (`services/culturalMedicalKnowledge.ts`)
- Era-specific medical understanding for each cultural zone
- Authentic historical quotes from real medical texts
- Cultural disease interpretation (humors, qi, spirits, miasma theory)
- Practitioner recommendations by era/culture

**Historical Medicine & Treatments** (`services/historicalMedicineService.ts`)
- Era-appropriate treatments with effectiveness ratings
- Historical medicines: herbal remedies, bloodletting, opium, quinine, antibiotics
- Treatment outcomes with success rates, side effects, costs
- Cultural variation in treatment approaches

**Disease Transmission & Progression** (`services/diseaseService.ts`)
- Proximity, direct contact, and terrain-based transmission
- Daily disease progression with recovery chances
- NPC/Animal disease assignment based on historical prevalence
- Epidemic detection for specific years/regions

**Complete UI System**
- `DiseaseModal.tsx`: Disease information with historical context and progression timeline
- `DiseaseContractedModal.tsx`: Emergency notifications with survival rates
- `NpcMedicalPanel.tsx`: Healer detection and treatment application interface

**Healing Professions** (`constants/characterData/professions.ts`, `startingPackages.ts`)
- 40+ culture-specific healing professions across all eras/zones
- 50+ medical items and equipment in `itemDefinitions.ts`
- Starting packages with appropriate medical supplies

### ⚠️ PARTIALLY IMPLEMENTED

**Medical Quest Integration**
- NPC Medical Panel exists but limited quest scenario integration
- Basic treatment application works but no epidemic response quests
- No medical reputation tracking system

**Entity Health System** (`services/entityHealthService.ts`)
- Basic damage tracking and health persistence for NPCs/animals
- Healing mechanics exist but not fully integrated with medical professions

### ❌ NOT IMPLEMENTED (Future Features)

**Interactive Diagnosis Mechanics**
- No symptom investigation mini-game
- No Intelligence/Wisdom checks for diagnosis accuracy
- No misdiagnosis risk system

**Advanced Medical Features**
- No medical skill progression trees
- No medical equipment crafting system
- No teaching/apprentice system for medical knowledge
- No dosage selection mechanics

**Educational Integration**
- No assessment tied to medical decisions
- No learning objectives for medical scenarios

## Quest System Implementation - Phase 1 Complete (Latest Session)

### Phase 1: Fix Critical Bugs & Expand Location Types ✅

## COMPREHENSIVE CODE REVIEW - August 15, 2025

### Current Roadmap Status Assessment

#### ⚠️ **Primary Source System (Phase 1) - PARTIALLY COMPLETE**
**Status**: Core functionality works but architecture differs from claims
- NO separate shard files (claimed 42) - all data embedded in service
- Sophisticated caching with IndexedDB ✅
- Context-aware search with temporal relevance scoring ✅
- UI fully integrated with search, modals, and keyword highlighting ✅
- **Architecture misleading in documentation**

#### ⚠️ **World Weaver System - BASIC IMPLEMENTATION**
**Status**: Core functionality exists but limited
- Basic prompt interpretation working
- Map area validation integrated
- **Missing**: Scenario generation, special NPCs, victory conditions
- File: `services/worldWeaverService.ts` needs expansion

#### ✅ **NPC System - FULLY COMPLETE**
**Status**: All core functionality working
- Trade negotiation panel: ✅ LLM integration connected via `generateTradeNegotiation`
- Theft mechanic: ✅ FULLY IMPLEMENTED - NPCs can steal items from player inventory (`encounterService.attemptTheft`)
- NPC-initiated encounters: ✅ Working via `npcInitiatedEncounterService`
- Reputation system: ✅ Functional with opinion tracking
- Memory persistence: ✅ WORKING - Saves to localStorage via `npcPersistenceService`, persists conversation summaries

### Easy Wins & Low-Hanging Fruit

#### 🎯 **Immediate UI Improvements (< 1 hour each)**
1. **Add Loading States**: Many async operations lack visual feedback
2. **Tooltip Enhancements**: Add keyboard shortcuts info to all buttons
3. **Mobile Touch Targets**: Increase to 44px minimum (accessibility)
4. **Error Messages**: Replace console.error with user-friendly toasts
5. **Keyboard Navigation**: Add Tab support for modals and controls

#### 🎮 **Gameplay Quick Fixes**
1. ~~**Connect Trade LLM**~~: ✅ ALREADY CONNECTED via `generateTradeNegotiation`
2. **Reputation Notifications**: Add visual feedback when reputation changes
3. ~~**Memory Fix**~~: ✅ ALREADY WORKING - NPCs persist memories via `npcPersistenceService`
4. **Quest Log**: Add simple todo-style quest tracker in sidebar
5. ~~**Save/Load States**~~: ✅ BASIC IMPLEMENTATION EXISTS via `SavedGamesModal`

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
- ~~**NPC Agency**~~: ✅ FIXED - NPCs can initiate via `npcInitiatedEncounterService`
- ~~**Trade System**~~: ✅ FIXED - LLM integration connected
- ~~**Theft System**~~: ✅ FIXED - Fully working with item transfer
- **Assessment Engine**: Not started
- **World Weaver Scenarios**: Basic implementation only

## Inventory & Item Generation System (September 2025)

### How the Procedural Item System Works

The game uses a sophisticated procedural item generation system (`itemGenerationService.ts`) that creates unique variations of base items:

1. **Base Items** (`itemDefinitions.ts`): ~1000+ predefined items with base stats
2. **Procedural Generation** (`generateProceduralItem()`):
   - **Quality Tiers**: poor → standard → good → excellent
   - **Material Variations**: Era and culture-appropriate materials
   - **Condition System**: Items age and degrade (0-100% condition)
   - **Cultural Styles**: Items get culture-specific naming (e.g., "Damascus Steel", "Tang Dynasty")
   - **Color Assignment**: Based on material type or cultural clothing palettes

3. **Era Gating**: Items available based on historical period:
   - Prehistory: Stone, bone, hide materials only
   - Antiquity: Bronze, copper, early iron
   - Medieval: Iron, steel, advanced textiles
   - Industrial: Mass production, synthetic materials
   - Modern: Plastics, composites, electronics

4. **Context-Aware Generation**:
   - NPCs get profession-appropriate items (guards → weapons, merchants → trade goods)
   - Social class affects quality (nobles get "excellent", peasants get "poor")
   - Geographic zone influences materials and styles

### Recent Fix (September 12, 2025)
- **Problem**: Food items were getting inappropriate materials ("Fine Coal Loaf of Bread")
- **Solution**: Added category checking to skip material assignment for Food/Consumables
- **Result**: Food now shows quality only ("Fine Loaf of Bread"), not materials

## Mining Roguelike System (September 2025)

### Overview
The mining system is a tile-based roguelike minigame where players explore mine shafts, dig through walls, expose ore deposits, and collect minerals. It features procedural generation, cultural theming, and immersive audio-visual effects.

### Core Components

#### Main Files:
- **`MiningRoguelikeDisplay.tsx`** - Main component with game loop, rendering, player movement, and ore collection
- **`services/gameSoundsService.ts`** - Audio system with crystal music, ore exposure sounds, and magical pickup effects

#### Key Features:

**1. Procedural Mine Generation**
- Dynamic cave systems with walls, floors, and pre-placed ore deposits
- Cultural zone theming (materials, visual styles)
- Configurable mine depth and ore types based on historical era

**2. Player Movement & Interaction**
- Arrow key navigation through mine tiles
- Digging mechanics to expose hidden ore deposits
- Space bar collection of exposed minerals

**3. Ore System**
- Hidden ore deposits become visible when adjacent walls are dug
- Glowing sparkle effects when ore is exposed (`playOreExposedSound`, `playGemExposedSound`)
- Beautiful floating notifications show collected items with quantities
- Proper inventory integration via `onInventoryAdd` callback

**4. Audio Design**
- **Crystal Music**: Catchy, rhythmic background music that fades in after 8 seconds, loops for 25 seconds, then fades out after 1-2 minutes
- **Sound Effects**: Ore exposure sounds, magical pickup sounds, ambient cave atmosphere
- **Procedural Generation**: 100% Web Audio API with no external files

**5. Visual Effects**
- Intense glowing animations on exposed ore deposits
- Floating pickup notifications with smooth CSS transitions
- Cultural theming for mine materials and colors

### Integration Points
- **Settings Panel**: Test mode accessible via dev panel with visual inventory display
- **Game State**: Integrates with player character stats (health, fatigue changes)
- **Cultural System**: Mine appearance adapts to cultural zone and historical era
- **Inventory System**: Items flow into main game inventory via callback system

### Technical Architecture
- React hooks (`useState`, `useEffect`, `useCallback`) for state management
- Tile-based coordinate system for movement and interaction
- Dynamic ore deposit creation with proper pickup item structure
- Cleanup systems for audio and visual effects on component unmount


### 6. **Expanded Profession System** 👥 [✅ IMPLEMENTED]
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

## Study & Documentation System Implementation (September 2025)

### **Overview**
Implemented a comprehensive study and documentation system that integrates with existing game mechanics to provide educational value without complexity. Replaces the underutilized Beliefs system with an interactive Study system.

### **Phase 1 Implementation - COMPLETED**

#### **A. InventoryPanel Updates** ✅
- **File**: `components/InventoryPanel.tsx`
- Replaced "Combine"/"Disaggregate" buttons with "Craft" and "Study 🔬" buttons
- "Craft" opens CraftingModal (with new mode toggle)
- "Study" moves selected items to Study tab and auto-switches to it
- Separated animal butchering into dedicated "Butcher" button
- Added `onStudy` prop to handle item transfer

#### **B. CraftingModal Enhancement** ✅
- **File**: `components/CraftingModal.tsx`
- Added toggle at top: [Combine Items] [Take Apart]
- Mode selection now happens within modal instead of before opening
- "Take Apart" button disabled unless exactly 1 item selected
- Updated `onExecuteCrafting` to pass selected method

#### **C. Study Tab Implementation** ✅
- **File**: `components/StudyPanel.tsx` (NEW)
- **File**: `components/RightSidebar.tsx` (UPDATED)
- Replaced "Beliefs" tab with "Study 🔬" tab
- StudyPanel shows three sections:
  - **Specimens**: Items under study with progress bars
  - **NPCs**: Encountered NPCs with recall function
  - **Animals**: Encountered animals with recall function
- Each item has "Observe" and "Return to Inventory" buttons
- Beliefs moved to CharacterProfile modal (already existed there)

#### **D. Enhanced Journal Viewport** ✅
- **File**: `components/JournalViewport.tsx` (NEW)
- Slides down from top like POV viewport (mutual exclusion)
- **Desktop Layout**: Left 2/3 writing area, right 1/3 entries list
- **Mobile Layout**: Compact single-column with bottom controls
- Auto-saves every 2 seconds
- Beautiful serif font (Georgia) for text content
- Auto-timestamps entries with location + date
- Documentation mode toggle for click-to-document

### **Data Structures**

```typescript
interface StudiedItem extends Item {
  studyProgress?: number; // 0-100%
  notes?: string[];
  discoveredProperties?: string[];
  dateStudied?: number; // timestamp
}

interface StudyData {
  specimens: StudiedItem[];
  encounters: {
    npcs: NpcEntity[];
    animals: Animal[];
    timestamp: number;
  }[];
}

interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  location: string;
  date: string;
  timestamp: number;
}
```

### **Key Features**
- **Era-Agnostic**: No artificial limitations based on historical period
- **Mobile Responsive**: Compact layouts that work on all screen sizes
- **Auto-Save**: Journal entries persist automatically
- **Study Progress**: Items can be examined multiple times to reveal properties
- **Integration**: Works with existing inventory, crafting, and modal systems
- **Educational**: Encourages documentation and observation

### **Future Phases (Planned)**

#### **Phase 2: Enhanced Documentation** (Next)
- Click-to-document mode integration with map entities
- Auto-generated descriptions for tiles/NPCs/animals
- Mobile swipe gestures and voice-to-text
- Export journal as text file

#### **Phase 3: Advanced Study Actions** (Later)
- Study action buttons: Observe, Examine, Compare, Test
- LLM integration for "Examine" action (detailed historical context)
- Discovery system revealing hidden item properties
- Educational metrics tracking

### **Benefits**
1. **Minimalist Design**: Reuses existing UI patterns and components
2. **Educational Value**: Encourages careful observation and documentation
3. **Historical Accuracy**: No anachronistic features or era-gating
4. **Procedural Richness**: Simple mechanics create emergent documentation gameplay
5. **Assessment Ready**: Study progress easily trackable for educational metrics

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one unless asked otherwise.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
## Maps System Clarification - IMPORTANT

### Interior Maps vs Special Maps
**Interior Maps**: Small maps (often 8x8) accessed via POI modals (POIToastModal, POIInteractionModal). Used for fortress commander chambers, small buildings, etc. Generated and handled separately from special maps.

**Special Maps**: Larger interior areas accessed via tile interactions (government districts, palaces, marketplaces, holy sites). Use the specialMapGenerator system and have their own archetype generators.

These are DIFFERENT SYSTEMS - don't confuse them when making fixes!

## Special Maps System - December 2024

### Current State of Special Maps

Special maps are interior/special area maps that players enter from the main world map. When a player enters certain structures (government districts, palaces, marketplaces, holy sites), they transition to a detailed interior map with NPCs, furniture, and cultural theming.

### ✅ Container System (August 2025)

Players can interact with containers (chests, barrels, crates, cabinets, etc.) in special maps:

**Core Components:**
- **`specialMapContainerService.ts`** - Generates culturally appropriate container contents with theft detection
- **`containerCacheService.ts`** - Caches container contents to prevent regeneration
- **`ContainerModal.tsx`** - Modern UI for container interaction with theft warnings
- **`useSpecialMapItemCollection.ts`** - Handles container detection and "Press E" toast notifications

**Player Interaction:**
- Walk onto container tile → "Press E or click to open container" toast appears
- Press E key or click container → ContainerModal opens with items
- Take items → NPCs within line-of-sight may confront player for theft
- Container contents persist via caching system

**Theft System:**
- NPCs detect item theft based on line-of-sight and item ownership
- Valuable/owned items trigger NPC confrontations
- `npcAwarenessService.ts` handles theft detection and NPC reactions

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

### Files with Legacy Issues

- `palaceVariantGenerator.ts` - Uses old room format without bounds
- Some older generators may have similar issues

### Benefits of Planned Improvements

1. **Cultural Authenticity**: Tribal councils won't have marble columns
2. **Layout Variety**: 6 distinct layouts instead of 1
3. **Historical Accuracy**: Courts look like courts, not forums
4. **Scalability**: Each archetype can have cultural variations
5. **Reusability**: ~160 buildings get proper archetypes

## Gamelog Restoration & Enhancement (September 19, 2025)

### **Phase 1 Implementation - COMPLETED**

#### **Overview**
Restored and enhanced the existing gamelog system to replace the Journal tab with a dedicated Gamelog tab focused on automatic event tracking. The gamelog system tracks the player's historical journey through the simulation, automatically recording both standard and milestone events.

#### **A. Left Sidebar Restructure** ✅
- **File**: `components/LeftSidebar.tsx`
- Replaced "Journal" major tab with "Gamelog"
- Removed JournalPanel dependency
- Direct integration with GamelogPanel component
- Simplified tab structure (no sub-tabs needed)

#### **B. Enhanced LogService** ✅
- **File**: `services/logService.ts`
- **File**: `types/journal.ts`
- Added new log entry types:
  - `QUEST_START` - Quest initiation tracking
  - `QUEST_COMPLETE` - Quest completion with rewards
  - `MILESTONE_COMBAT` - First kills, NPC deaths
  - `MILESTONE_EXPLORATION` - Areas explored milestones
  - `MILESTONE_ACHIEVEMENT` - VIP meetings, major accomplishments

#### **C. Milestone Visual System** ✅
- **File**: `components/GamelogPanel.tsx`
- Special styling for milestone events:
  - Golden gradient background for milestone entries
  - 🏆 trophy icon prepended to milestone events
  - "MILESTONE" badge with yellow highlight
  - Ring border effect for visual emphasis
- Color-coded entry types with distinct borders

#### **D. Milestone Tracking State** ✅
- **File**: `hooks/useGame.ts`
- Added `milestoneStats` state tracking:
  - `areasVisited` (Set) - Unique areas discovered
  - `npcsKilled` (number) - NPCs defeated in combat
  - `animalsKilled` (number) - Animals successfully hunted
  - `questsCompleted` (number) - Quests finished
  - `firstAnimalKill` (boolean) - First hunt milestone
  - `vipsMet` (Set) - Important NPCs encountered
- State management and setter exposure for external hooks

#### **E. LogService Milestone Methods** ✅
New methods for milestone event creation:
- `createMilestoneFirstKillLog()` - First successful hunt
- `createMilestoneNpcKillLog()` - NPC combat deaths
- `createMilestoneAreasExploredLog()` - Exploration milestones (every 10th area)
- `createMilestoneVipMeetingLog()` - Important NPC encounters
- `createQuestStartLog()` / `createQuestCompleteLog()` - Quest tracking

### **System Design Principles**

#### **Automatic Event Detection**
The gamelog captures events through existing game systems:
- **Standard Events**: Map movement, NPC dialogue, combat initiation, item acquisition, trade, skill use
- **Milestone Events**: Achievement thresholds (10th area, first kill, quest completion, VIP meetings)

#### **Event Categories**
- **🗺️ MAP_ENTRY**: Area transitions and exploration
- **💬 DIALOGUE**: NPC conversations via encounter modal
- **⚔️ COMBAT**: Combat initiation with animals/NPCs
- **✨ ITEM_ACQUIRED**: Foraging, purchase, loot, quest rewards
- **💰 TRADE**: Buy/sell transactions
- **🛠️ SKILL_USE**: Skill activation results
- **📜 QUEST_START**: Quest initiation
- **🏆 MILESTONE Events**: Major achievements with special styling

#### **Educational Value**
- **Historical Journey**: Complete record of player's path through historical scenarios
- **Cultural Documentation**: NPCs met, locations visited, items acquired all culturally contextualized
- **Progressive Discovery**: Milestone system rewards thorough exploration and engagement
- **Assessment Ready**: Event data easily exportable for educational analysis

### **Phase 2 Implementation Plan - Next**

#### **A. Study System LLM Integration**
- **File**: `services/llmService.ts` - Add `generateItemStudyText()` function
- Modified version of `generateObservationText()` focused on item analysis
- Remove landscape/companion references, focus on:
  - Item material analysis and historical context
  - Cultural significance and craftsmanship details
  - Era-appropriate scholarly language
  - 3-4 sentence detailed descriptions

#### **B. Study-to-Journal Flow**
- **File**: `components/StudyPanel.tsx` - Wire up "Observe" button functionality
- Connect study observations to Journal viewport
- Auto-open Journal viewport when study observation is triggered
- Create journal entries marked as "🔬 AI Study Analysis"

#### **C. Enhanced Journal Integration**
- **File**: `components/JournalViewport.tsx` - Handle study entry display
- Special styling for AI-generated study entries
- Include item metadata (name, material, condition, cultural origin)
- "AI Study Analysis" badge to distinguish from manual entries

#### **D. Comprehensive Event Logging**
- Hook into existing game systems to auto-generate log entries:
  - `useCoreLoops.ts` - Movement and map transitions
  - `useUIState.ts` - Item acquisition, skill use, combat
  - Quest system integration for quest start/complete
  - NPC encounter detection for VIP meetings

### **Technical Integration Points**
- Leverages existing GamelogPanel component (no new UI needed)
- Uses established LogService patterns for consistency
- Integrates with useGame.ts state management
- Maintains separation between automatic gamelog and manual journal
- Educational assessment data automatically captured

### **Benefits**
1. **Simple Restoration**: Rebuilt existing functionality without over-engineering
2. **Historical Tracking**: Complete automatic record of player's educational journey
3. **Milestone Recognition**: Visual celebration of exploration and achievement
4. **Assessment Ready**: Event data easily exportable for educational analysis
5. **Cultural Context**: All events include era, location, and cultural context
6. **Procedural Discovery**: Emergent storytelling through automatic event capture

## Educational Game Setup Screen Plan (AWAITING APPROVAL)

### **Overview**
Replace the current immediate world generation flow with a proper educational game setup screen (like Civ 6). This would create a true educational onboarding experience with learning objectives selection and assessment tracking.

### **Problem Statement**
Current InitialScenarioModal assumes world is already generated and doesn't provide:
- Game introduction for new educational users
- Learning objectives selection
- Assessment preference setup
- Proper scenario selection (random vs custom vs curated)

### **Proposed Solution: GameSetupScreen.tsx**

#### **Section 1: Game Introduction**
- Title: "Universal History Simulator"
- Educational purpose explanation
- UC Santa Cruz branding
- Brief gameplay mechanics overview

#### **Section 2: Mode Selection**
```
┌─ Quick Play (Traditional) ─┐  ┌─ Learning Mode (Educational) ─┐
│ • Random scenario          │  │ • Learning objectives         │
│ • No assessment tracking   │  │ • Progress tracking           │
│ • Casual gameplay          │  │ • End-session reports         │
└───────────────────────────┘  └───────────────────────────────┘
```

#### **Section 3: Scenario Selection**
1. **Random Scenario** - "Surprise me!" quick start
2. **Browse Scenarios** - Curated historical scenarios ("Survive Black Death", "Navigate Silk Road")
3. **Custom Scenario** - WorldWeaver integration for AI-generated scenarios

#### **Section 4: Learning Objectives (Learning Mode)**
Multi-select checkboxes:
- ☐ Historical Thinking (cause/effect analysis)
- ☐ Cultural Comparison (worldviews/practices)
- ☐ Economic Systems (trade/labor/resources)
- ☐ Social Structures (class/gender/power)
- ☐ Primary Source Analysis (document evaluation)
- ☐ Geographic Impact (environment/human activity)

#### **Section 5: Game Parameters**
- Difficulty: Forgiving → Realistic → Hardcore
- Session Length: Short (30m) → Extended (2h+)
- AI Features: Enhanced descriptions, dynamic NPCs
- Assessment Frequency: None → Occasional → Frequent

### **Implementation Phases**

#### **Phase 1: Basic Structure**
- Create GameSetupScreen.tsx component
- Update App.tsx routing (setup → generation → scenario → gameplay)
- Add curated scenario database

#### **Phase 2: Learning Integration**
- Learning objectives selection system
- Create learningObjectivesService.ts for tracking
- Modify InitialScenarioModal to show selected objectives

#### **Phase 3: WorldWeaver Integration**
- Embed WorldWeaver in setup screen
- Add scenario preview before confirmation
- Save/bookmark custom scenarios

#### **Phase 4: Assessment Setup**
- Assessment preferences selection
- Create assessment scheduler service
- Teacher dashboard preparation

### **New User Flow**
```
Current: App.tsx → World Generation → InitialScenarioModal → Gameplay
Proposed: App.tsx → GameSetupScreen → World Generation → InitialScenarioModal → Gameplay
```

### **Educational Benefits**
- Proper onboarding explains educational purpose
- Learning objectives create clear goals
- Assessment tracking enables classroom use
- Custom scenarios allow curriculum alignment
- Teacher dashboard supports formal education

### **Status: AWAITING USER APPROVAL**
**Note**: This plan requires explicit approval before implementation begins. Implementation will proceed in phases with user confirmation at each stage.

