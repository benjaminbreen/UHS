# Universal History Simulator - Development Documentation
*Last Updated: September 6, 2025*

## Project Overview
- **Creator**: Professor Benjamin Breen, Department of History, UC Santa Cruz
- **Purpose**: Educational history simulation game for teaching and research
- **Audience**: History students and casual players interested in historical accuracy
- **Core Principle**: Strict historical accuracy - no fantasy elements, all content based on historical evidence
- **Visual Style**: FF6/Stardew Valley inspired - richly rendered top-down pixel art with beautiful highlights, shadows, and sophisticated color work

## Critical Instructions for Future Claudes

### Identity & Context
- The creator is Professor Benjamin Breen, a historian at UC Santa Cruz
- This is an academic project for teaching and historical research
- NEVER add fantasy, magical, or ahistorical elements
- When uncertain about historical details, use best scholarly evidence
- Maintain educational value in all features

### Code Style & Best Practices
1. **Historical Accuracy First**: Every feature must be historically grounded
2. **No Comments**: Do not add code comments unless explicitly requested
3. **Preserve Existing Patterns**: Study surrounding code before modifications
4. **Use Existing Services**: Check for existing services/utilities before creating new ones
5. **TypeScript Strict**: Maintain type safety, avoid `any` types
6. **Component Size**: Break components >500 lines into smaller pieces
7. **Error Handling**: Use user-friendly toasts, not console.error
8. **Performance**: Use React.memo, useCallback, and useMemo appropriately

### Visual Design Guidelines
- **Pixel Art Style**: Rich, detailed sprites inspired by FF6/Chrono Trigger
- **Color Palette**: Sophisticated use of highlights and shadows
- **Tile Size**: 16x16 base tiles scaled to current zoom level
- **Animations**: Smooth, subtle animations (avoid jarring transitions)
- **UI Elements**: Clean, readable interface with historical theming
- **Day/Night Cycle**: Dynamic lighting with torches and shadows
- **Weather Effects**: Atmospheric but performance-conscious

## Current System Architecture (September 2025)

### ✅ Core Systems - IMPLEMENTED

#### Map Generation System
- **Files**: `generation/standardMapGenerator.ts`, `generation/terrainAndBiomeGenerator.ts`
- **Features**:
  - Procedural world generation with 50+ biome types
  - Climate-aware terrain (temperate, arid, tropical, arctic)
  - Rivers, coasts, estuaries, coral reefs, salt flats
  - Urban areas with period-appropriate architecture
  - Ruins, farms, marketplaces, holy sites
  - Mineral deposits and vegetation
- **Seed System**: Partial implementation via `seedService.ts`

#### Event System
- **Files**: `services/eventService.ts`, `hooks/useEventSystem.ts`
- **Status**: Core infrastructure complete, some integration issues
- **Features**:
  - 8 game modes with unique victory conditions
  - Template-based procedural events
  - LLM-enhanced custom events
  - Disease outbreak events
  - API usage tracking
  - Event history and outcomes
- **Issues**: 
  - Initial event timing needs refinement
  - Some events don't properly create quests

#### Quest System
- **Files**: `services/questService.ts`, `components/QuestsPanel.tsx`
- **Status**: Functional with location-based objectives
- **Features**:
  - Quests tied to actual map locations
  - Multi-step objectives with progress tracking
  - Categories: main, trade, exploration, social, survival
  - Quest markers on map
  - Wilderness fallback for maps without structures
- **Issues**:
  - Quest completion sometimes doesn't register
  - Limited variety in wilderness quests

#### NPC System - FULLY IMPLEMENTED
- **Files**: `components/EncounterModal.tsx`, `services/encounterService.ts`, `services/llmService.ts`
- **Status**: Complete with advanced memory and interaction systems
- **Core Features**:
  - **Persistent Memory System**: NPCs store `conversationSummaries` (last 5 conversations) and `opinionOfPlayer` ratings
  - **LLM-Powered Interactions**: Full dialogue system with `generateEncounterDialogue()` using conversation history
  - **Dynamic Relationship Tracking**: Opinion changes based on conversation sentiment (+10/-10 adjustments)
  - **Trade System Integration**: `generateTradeNegotiation()` with LLM-powered negotiation responses
  - **Multi-Tab Interface**: Dialogue, history, trade, medical, household, and quest interactions
  - **Reputation Feedback**: Real-time reputation display in PlayerProfileCard with percentage tracking
- **Advanced Features**:
  - **NPC-Initiated Encounters**: Infrastructure exists in `skillService.ts` with approach dialogue system
  - **Memory Persistence**: Conversation summaries saved between sessions via NPC memory object
  - **Language Barriers**: Historical language comprehension system with cultural zones
  - **Visual Feedback**: ReputationModal for significant relationship changes

### 🏗️ Special Map System - ADVANCED IMPLEMENTATION

#### Interior/Special Locations
- **Files**: `generation/specialMap/*`, `services/specialMapNpcBehaviorService.ts`
- **Archetypes Implemented**:
  - Sacred spaces (temples, shrines)
  - Markets and bazaars
  - Government buildings (forums, courts)
  - Restaurants and inns
  - Universities and libraries
  - Theaters and arenas
  - Noble estates
  - Ships and vessels
- **Features**:
  - Detailed interior tile layouts
  - Context-aware NPC behaviors
  - Cultural furniture systems
  - Period-appropriate decorations
  - Dynamic lighting for interiors

### 🦠 Disease System - FULLY IMPLEMENTED

#### Disease Mechanics
- **Files**: `services/diseaseService.ts`, `constants/gameData/diseases.ts`
- **Features**:
  - 30+ historical diseases with accurate symptoms
  - Transmission mechanics (contact, airborne, vector, water)
  - Immunity and resistance systems
  - Integration with events and NPCs
  - Period-appropriate treatments
  - Epidemic modeling

### 🌐 World Generation & Configuration

#### URL-Based Configuration System - FULLY IMPLEMENTED
- **Files**: `services/urlConfigService.ts`, `services/seedService.ts`, `App.tsx`, `components/InitialScenarioModal.tsx`
- **Status**: Complete shareable scenario system with deterministic generation
- **URL Format**: `/:dateRange/:geography/:gameMode/:seed`
- **Core Features**:
  - **Era Parsing**: Supports `medieval`, `renaissance`, `industrial`, `modern` etc. and year ranges like `1348-1350`
  - **Geography Parsing**: Cultural zones (`europe`, `mena`, `asia`) and regions (`europe.iberia`, `mena.levant`)
  - **Game Mode Integration**: `survival`, `exploration`, `empire`, `cultural`, `sandbox`, `balanced`
  - **Seed System**: Deterministic `SeededRandom` class with Linear Congruential Generator algorithm
  - **Context Separation**: Independent random streams for `SeedManager.CONTEXTS` (map, npc, item, quest, etc.)
- **User Interface**:
  - **Seed Display**: Purple-styled seed section in InitialScenarioModal with 8-character alphanumeric codes
  - **Share Functionality**: "Share" button generates shareable URLs via `createShareableURL()`
  - **Copy-to-Clipboard**: One-click URL sharing with success feedback
  - **URL Initialization**: `App.tsx` parses URL on mount and initializes `SeedManager.getInstance(seed)`
- **Examples**:
  - `/1348/europe/survival/ABC12345` - Black Death scenario with specific seed
  - `/medieval/mena/exploration` - Medieval Middle East with random generation
  - `/1800-1900/asia.japan/cultural/XYZ789` - 19th century Japan cultural scenario
  - `/1066/england/leadership` - Norman Conquest
- **Status**: Functional but needs polish

#### WorldWeaver AI System
- **Files**: `services/worldWeaverService.ts`, `components/WorldWeaverModal.tsx`
- **Features**:
  - Natural language to historical scenario
  - Generates appropriate year, location, character
  - Creates 3 custom events per scenario
  - Spawns 2 special NPCs with backstories
  - Auto-selects suitable game mode
- **Status**: Fully functional

### 📚 Primary Source System - COMPLETE

#### Historical Documents
- **Files**: `services/primarySourceService.ts`, `constants/historicalShards/*`
- **Features**:
  - 42 shard files covering all eras/regions
  - IndexedDB caching for performance
  - Context-aware search with temporal relevance
  - Source discovery mechanics
  - Citation generation
- **Status**: Fully implemented and polished

### 🎮 Game Modes & Victory Conditions

#### Available Modes
1. **Survival**: Resource management, avoid death
2. **Exploration**: Map discovery, find landmarks
3. **Commerce**: Trade and wealth accumulation
4. **Scholarship**: Knowledge and source collection
5. **Leadership**: Political influence and territory
6. **Livelihood**: Professional advancement
7. **Diplomacy**: Reputation and alliances
8. **Legal**: Justice and law enforcement

Each mode has 3 unique victory conditions and tailored events.

## System Issues & Known Bugs

### Critical Issues
1. **Quest Completion**: Some quests don't complete properly (radius and detection issues)
2. **Safari Performance**: Blur filters cause slowdowns on older devices
3. **Component Size**: `MapDisplayOptimized.tsx` is extremely large and needs code splitting

### Minor Issues
1. **SVG Path Errors**: Occasional malformed path warnings
2. **Favicon Missing**: 404 error in development
3. **Disease Display**: Object rendering issues (recently fixed)
4. **Special Map NPCs**: Logs spam when not in special maps

## Pending/Planned Features

### ⚔️ Combat System - WELL IMPLEMENTED

#### Turn-Based Combat System
- **Files**: `components/CombatModal.tsx`, `services/combatService.ts`, `types/combat.ts`
- **Status**: Feature-complete turn-based tactical combat system
- **Features**:
  - Turn-based mechanics (Player → Tamed Animals → Opponent)
  - Advanced attack calculations with hit/miss, critical hits, damage variance
  - Status effects system (poison, burn, stunned, bleeding, defense_down, etc.)
  - Equipment integration with weapon categories and combat modifiers
  - Defense stance system reducing incoming damage
  - Tamed animal companions fighting alongside player
  - Enemy enhancement system (Strong/Enraged/Elite variants)
  - Profession-specific combat skills with unique abilities
  - Visual combat system with detailed pixel-art sprites
  - Combat animations and feedback (damage splats, screen shake)
  - LLM-powered combat dialogue and reactions

#### Combat Skills & Abilities
- **Core Combat Skills**: Power Strike, First Aid, Intimidating Shout, Chop, Burn
- **Profession Skills**: 10+ professions each with 3 unique combat abilities
- **Weapon Categories**: Blade, Axe, Polearm, Blunt, Bow, Dagger, Staff integration
- **Special Mechanics**: Weapon-specific attack animations, armor penetration

#### Next 5 Development Phases
1. **Combat Polish**: Add weapon durability, shield blocking mechanics, and more status effects
2. **Formation Combat**: Allow positioning tactics and flanking bonuses in group encounters
3. **Environmental Combat**: Weather effects, terrain bonuses, and destructible objects
4. **Combat AI Enhancement**: Smarter enemy tactics, group coordination, and adaptive difficulty
5. **Historical Combat Styles**: Culture-specific fighting techniques and weapon mastery systems

### Not Yet Implemented
- **Healing System**: Medical professions and diagnosis mechanics
- **Assessment Engine**: Educational progress tracking
- **NPC Relationships**: Family and social networks
- **Seasonal Events**: Holiday and festival system
- **Achievement System**: Historical milestone tracking

## Current Development Priorities

### High Priority (Easy Wins)
1. **Quest Completion Fixes**: Improve detection radius and completion logic in `services/questService.ts`
2. **Code Splitting**: Break up `MapDisplayOptimized.tsx` (extremely large component) into smaller modules
3. **NPC-Initiated Encounters**: Connect existing `skillService.ts` approach system to main game loop
4. **Mobile UX Polish**: Improve touch feedback and mobile-specific interactions

### Medium Priority
1. **Performance Optimization**: Lazy load components, improve Safari blur performance
2. **Error Boundaries**: Add global error handling with user-friendly messages  
3. **WorldWeaver Expansion**: Enhance scenario generation with more complex NPCs and events
4. **Educational Features**: Progress tracking and learning objectives system

### Fully Implemented Systems (No Action Needed)
- ✅ **NPC Memory & Relationships**: Persistent conversation history, opinion tracking, LLM integration
- ✅ **URL-Based Scenarios**: Complete shareable world generation with seeds
- ✅ **Trade System**: LLM-powered negotiation and commerce mechanics
- ✅ **Event System**: Procedural and custom events with quest generation
- ✅ **Combat System**: Turn-based tactical combat with status effects
- ✅ **Primary Source Integration**: Historical document discovery and caching

**Note**: CLAUDE.md was significantly outdated regarding NPC and URL systems - both are fully functional.

## Technical Architecture

### Service Layer
- 70+ service files handling game logic
- Singleton pattern for global services
- Event bus for cross-component communication
- LLM integration via Google Gemini API

### State Management
- React Context for global state (Game, Player, Map, UI)
- Custom hooks for feature-specific state
- localStorage for persistence
- IndexedDB for large data caching

### Performance Optimizations
- Conditional Safari blur reduction
- Canvas rendering with WebGL hints
- React.memo for expensive components
- Lazy loading for primary source shards
- Virtualized lists for large datasets

## Development Guidelines

### When Adding Features
1. Check existing services first
2. Maintain historical accuracy
3. Consider performance impact
4. Add to relevant game modes
5. Update victory conditions if applicable
6. Test with different eras/cultures

### When Fixing Bugs
1. Understand root cause first
2. Check for similar issues elsewhere
3. Test edge cases
4. Verify historical accuracy maintained
5. Update tests if they exist

### Historical Accuracy Checklist
- [ ] Is this feature documented in historical sources?
- [ ] Does it respect cultural variations?
- [ ] Is it appropriate for the time period?
- [ ] Are names/terms historically accurate?
- [ ] Would a history professor approve?

## Recent Updates (September 2025)

### This Session
- Fixed React rendering error with disease status objects
- Identified and documented undocumented systems (special maps, diseases)
- Comprehensive code review and documentation update
- Corrected dates and misleading status indicators

### Previous Sessions
- Quest system enhancements with wilderness fallback
- Disease service singleton fix
- URL configuration double-generation fix
- Special map interior generation system
- NPC behavior context awareness
- Primary source discovery mechanics

## Performance Metrics

### Current Status
- **Map Generation**: ~2-3 seconds for 100x100 map
- **NPC Pathfinding**: 60 FPS with 50+ NPCs
- **Memory Usage**: ~200-300MB typical
- **Safari Performance**: Reduced but functional
- **Mobile Performance**: Playable with touch controls

## API Integration

### Google Gemini (Primary LLM)
- Used for: NPC dialogue, event generation, WorldWeaver
- Rate limiting: Implemented
- Caching: Responses cached to reduce API calls
- Cost tracking: Usage statistics displayed in UI

## Testing Recommendations

### Critical Test Scenarios
1. Generate world via WorldWeaver with "Black Death 1348"
2. Complete a multi-step quest
3. Trade with NPCs in marketplace
4. Trigger disease outbreak event
5. Achieve victory condition in any game mode
6. Test on Safari browser
7. Test mobile touch controls

## Deployment Notes

### Current Setup
- **Framework**: React + TypeScript + Vite
- **Hosting**: Vercel
- **URL**: historysimulator.vercel.app
- **Environment Variables**: VITE_GEMINI_API_KEY required

### Build Commands
```bash
npm install        # Install dependencies
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
```

## Contact & Resources

- **Creator**: Professor Benjamin Breen, UCSC History Department
- **GitHub Issues**: Report bugs via GitHub
- **Historical Consultation**: Maintain academic standards
- **Visual References**: FF6, Chrono Trigger, Stardew Valley

## ⚠️ **CRITICAL CODEBASE REFERENCE INFO**

### **Cultural Zones (CulturalZone)**
**ALWAYS check the actual values before using. The correct CulturalZone values are:**
- `'EUROPEAN'`
- `'EAST_ASIAN'` 
- `'MENA'`
- `'NORTH_AMERICAN_PRE_COLUMBIAN'`
- `'NORTH_AMERICAN_COLONIAL'`
- `'OCEANIA'`
- `'SOUTH_ASIAN'`
- `'SOUTH_AMERICAN'`
- `'SUB_SAHARAN_AFRICAN'`

**NOT** "INDIGENOUS_AMERICAN" or "AFRICAN" - these are incorrect values.

### **Historical Eras (HistoricalEra)**
**ALWAYS check the actual values before using. The correct HistoricalEra values are:**
- `'PREHISTORY'`
- `'ANTIQUITY'`
- `'MEDIEVAL'`
- `'RENAISSANCE_EARLY_MODERN'`
- `'INDUSTRIAL_ERA'`
- `'MODERN_ERA'`
- `'FUTURE_ERA'`

**Important**: `FUTURE_ERA` refers to the 2020s/contemporary period, NOT sci-fi. It should not be presumed to be futuristic or science fiction - just modern contemporary times.

**Source Files**: 
- Cultural zones: `/types/characterData.ts:5`
- Historical eras: `/types/ambiance.ts:4-12`

Item System Report: Universal History Simulator

  Based on my analysis of the codebase, here's a comprehensive report on how
   items are generated, rendered, and handled in the game:

  System Architecture

  1. Item Type Definitions (types/itemTypes.ts)

  - Base Types: ItemDefinition (templates) and Item (instances)
  - Categories: Tool, Weapon, Material, Apparel, Food, Special, Document,
  Consumable, Vessel
  - Rarity: Junk, Common, Uncommon, Rare, Ultra-rare, Unique
  - Quality: poor, standard, good, excellent
  - Properties: attack, defense, sustenance, weight, value, condition,
  cultural style, etc.

  2. Item Database (constants/gameData/itemDefinitions.ts)

  - Massive catalog (302KB+) with 1000+ base item definitions
  - Categories covered: Tools, ores, processed metals, religious items,
  weapons, food, clothing
  - Each item has: baseId, name, description, emoji, stats, material,
  equipment slot
  - Examples: AXE, IRON_ORE, RELIGIOUS_TEXT, STURDY_STICK

  3. Procedural Generation System (services/itemGenerationService.ts)

  This is the most sophisticated part - a 1000+ line service that handles:

  Cultural & Era Awareness

  - Cultural Zones: European, East Asian, MENA, South Asian, Sub-Saharan
  African, etc.
  - Historical Eras: Prehistory through Future Era (2020s+)
  - Era-appropriate materials: Stone age → Bronze → Iron → Steel progression
  - Cultural weapon preferences: Katana for East Asian, Scimitar for MENA,
  etc.

  Advanced Color System

  - Material-based colors: Iron = grays/blacks, Bronze = copper tones, Gold
  = yellows
  - Cultural clothing palettes: Different color preferences by culture and
  social class
  - 200+ hex color definitions for authentic material appearance

  Quality & Condition System

  - Quality affects: attack/defense bonuses, value multipliers, durability
  - Condition degradation: Age reduces item effectiveness
  - Quality descriptors: "Masterwork", "Crude", "Exceptional", etc.

  Contextual Weapon Generation

  - Profession-based: Guards get military weapons, herders get staffs
  - Era-appropriate: No gunpowder weapons in medieval times
  - Cultural variations: Different weapon preferences by region

  4. Item Rendering (components/symbols/GenerativeItemIcon.tsx)

  Visual representation system that creates pixel-art style icons:
  - Dynamic color application based on item's material/color properties
  - Category-specific symbols: Tools, weapons, food, etc. get appropriate
  sprites
  - Quality indicators: Visual effects for rare/excellent items
  - 64x64 base resolution scaled for different UI contexts

  5. Inventory Management (components/InventoryPanel.tsx, 
  utils/inventoryUtils.ts)

  Inventory Panel Features

  - Enhanced tooltips with detailed item stats, quality indicators, rarity
  badges
  - Grid-based layout with drag-and-drop (implied from UI structure)
  - Quality color coding: Excellent = gold, Good = blue, Poor = orange
  - Item stacking for stackable materials

  Utility Functions

  - createItemInstance(): Converts base definitions to unique instances
  - addItemToInventory(): Handles stacking logic for similar items
  - assembleStartingPackage(): Creates profession-based starting equipment
  - Procedural item generation for items not in main database

  6. Description Generation (services/itemDescriptionGenerator.ts)

  - Template-based descriptions that vary by rarity and category
  - Generic fallback prevention: Avoids boring "A standard X" descriptions
  - Category-specific language: Weapons described differently than clothing

  Key Features

  Historical Accuracy

  - Era-gated items: No steel in stone age, no gunpowder before Renaissance
  - Cultural authenticity: Region-appropriate weapons, clothing, materials
  - Material progression: Realistic technological advancement

  Procedural Variety

  - Infinite item variations: Same base item can have different quality,
  color, cultural style
  - Contextual generation: Items appropriate to character's
  profession/culture
  - Dynamic naming: "Masterwork Bronze Scimitar" vs "Crude Iron Sword"



**Always verify these values in the actual type definitions before implementing cultural or era-specific features.**

---

*Remember: This is an educational tool for teaching history. Every feature should enhance historical understanding while remaining engaging and accessible.*

