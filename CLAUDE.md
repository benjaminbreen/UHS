# Universal History Simulator - Development Notes

## Project Overview
- **Creator**: Benjamin Breen, Historian at UCSC
- **Purpose**: Educational history simulation game for casual players and history students
- **Current Phase**: Implementing Primary Source System & World Weaver

## INCOMPLETE FEATURES - NPC System (Added August 2025)

### NPC Enhancements (Partially Implemented)
The following NPC features have UI elements created but lack full implementation:

1. **Trade/Bargaining System**
   - ✅ UI: Slide-out negotiation panel exists in EncounterModal
   - ❌ Backend: No LLM integration - responses are static/same each time
   - ❌ Logic: No actual price negotiation or dynamic responses

2. **Reputation System**
   - ✅ UI: Reputation stat exists in player character (mapReputation)
   - ❌ UI: No visual feedback when reputation changes during conversations
   - ❌ Logic: Reputation doesn't actually change based on dialogue choices
   - ❌ Effects: Reputation doesn't affect NPC behavior or prices

3. **NPC Agency**
   - ❌ NPCs cannot end conversations on their own
   - ❌ NPCs cannot walk up to player and initiate dialogue
   - ❌ NPCs cannot initiate combat based on reputation/context
   - ❌ No NPC movement or pathfinding

4. **NPC Memory & Context**
   - ✅ UI: Memory system structure exists
   - ❌ Logic: Memory doesn't persist between conversations properly
   - ❌ Context: NPCs don't remember previous interactions meaningfully

### Required Implementation Work:
- Connect negotiation panel to LLM service for dynamic responses
- Add reputation change notifications and effects
- Implement NPC agency system for autonomous actions
- Create NPC movement and interaction initiation
- Fix memory persistence and context awareness

## Active Development: Primary Source System

### Implementation Plan (3 Phases)

#### Phase 1: Core Infrastructure (Current Priority)
**Goal**: Get 50 sources working end-to-end with sharded JSON architecture

1. **Data Structure** 
   - Create sharded JSON files in `/public/sources/metadata/` 
   - Format: `{era}-{culturalZone}.json` (e.g., `medieval-european.json`)
   - Start with 5 shards, 10 sources each
   - Include: title, author, year, excerpt (2-3 sentences), keywords, contextual keywords

2. **Service Layer** 
   - Implement lazy-loading service for shards
   - Add Wikisource API integration for full text fetching
   - Browser caching with IndexedDB
   - Context-aware keyword matching

3. **UI Integration** 
   - Clickable keyword highlighting in game text
   - Primary Source Modal for reading full texts
   - "Sources" tab in left sidebar showing relevant sources by era/region
   - Source citations in NPC encounter modals

4. **LLM Integration** 
   - Pass 2-3 relevant source excerpts to NPC dialogue generation
   - Add "Historical Context" section to encounter modals
   - Include source references in generated text

#### Phase 2: Content Expansion 
**Goal**: Scale to 200 sources with enhanced features

1. **Content Growth**
   - Expand to 15-20 shards covering all eras/regions
   - Add 150 more sources with focus on non-Western texts
   - Implement source quality tiers (essential/supplementary)

2. **Advanced Features**
   - Smart pre-loading of likely-needed shards
   - Related sources recommendation
   - Search across all source metadata
   - Source collections/themes

3. **Performance Optimization**
   - Implement service worker for offline access
   - Compress shards with gzip
   - Add loading states and progressive enhancement

#### Phase 3: User Customization (Future)
**Goal**: Premium features and user uploads

1. **Freemium Model**
   - Free: Access to all public domain sources
   - Premium ($5/month): Upload custom sources, advanced search, priority caching
   - Educational ($50/month): Classroom management, required readings, progress tracking

2. **Custom Source System**
   - Implement Supabase for user uploads (max 10MB per file)
   - PDF text extraction in browser
   - Custom keyword mapping interface

## Next Development: World Weaver System

### Overview
An LLM-powered system that generates historically accurate scenarios from natural language prompts, creating special NPCs, quest items, victory conditions, and narrative events.

### Implementation Plan

#### Phase 1: Scenario Generation Engine
**Goal**: Convert user prompts into playable scenarios

1. **Input Processing**
   ```
   User: "Revolutionary War spy in upstate New York"
   ↓
   World Weaver: Structured JSON with year, location, NPCs, objectives
   ```

2. **Output Structure**
   - Scenario metadata (year, location, map center)
   - Player character (role, starting position, primary goal)
   - 2-3 Special NPCs (historical figures with personalities)
   - Quest items and victory conditions
   - Relevant primary sources to surface

3. **Integration Points**
   - Hooks into map generation for faction placement
   - Special NPC injection into standard NPC system
   - Victory condition checks in game loop
   - Primary source surfacing based on scenario

#### Phase 2: Dynamic Event System
**Goal**: Living world that responds to player actions

1. **Event Types**
   - Initial event (kicks off the narrative)
   - Triggered events (based on player actions)
   - Random events (historically appropriate)
   - Completion events (victory/failure)

2. **Event Generation**
   - LLM generates events based on:
     - Current game state
     - Historical context from primary sources
     - Player's recent actions
     - Special NPC locations/states

3. **Event Effects**
   - Spawn new NPCs or items
   - Change faction relationships
   - Unlock new dialogue options
   - Modify victory conditions

#### Phase 3: Assessment & Educational Features
**Goal**: Make learning measurable and guided

1. **Assessment Engine**
   - LLM evaluates player actions against historical accuracy
   - Scores based on: historical plausibility, source usage, creative problem-solving
   - Provides feedback on anachronisms or historical insights

2. **Educational Modes**
   - Guided scenarios with learning objectives
   - Primary source requirements (must read X sources)
   - Historical accuracy mode (stricter constraints)
   - Creative mode (alternate history)

### Technical Architecture

```
User Input → World Weaver LLM → Scenario JSON → Game State
                     ↑                              ↓
            Primary Sources Context          Dynamic Events
```

### Scenario Template Structure
```json
{
  "scenario": {
    "year": 1780,
    "location": "Hudson Valley, New York",
    "mapSettings": {
      "center": {"x": 45, "y": 30},
      "factions": ["British Empire", "Continental Army"],
      "settlementDensity": "low"
    }
  },
  "playerCharacter": {
    "role": "Continental spy",
    "startingLocation": "Patriot camp",
    "inventory": ["forged_papers", "pistol"],
    "primaryObjective": "Steal British troop movements"
  },
  "specialNPCs": [
    {
      "id": "benedict_arnold",
      "historicalFigure": true,
      "personality": "bitter, suspicious",
      "dialogue_context": "[excerpt from Arnold's letters]",
      "location": "British fort"
    }
  ],
  "victoryConditions": {
    "primary": "Return intelligence to Washington",
    "optional": ["Avoid detection", "Turn a British informant"]
  },
  "relevantSources": ["washington-spy-letters", "arnold-treason-docs"]
}
```

## Implementation Priority Order

1. **NOW**: Primary Source System Phase 1 (2 weeks)
2. **NEXT**: World Weaver Scenario Generation (2 weeks)
3. **THEN**: Primary Source System Phase 2 (1 month)
4. **FUTURE**: Dynamic Events & Assessment (ongoing)

## Performance Optimizations Status
- LazyComponents.tsx - Created for lazy loading
- MapCanvasPerformance.tsx - Performance-focused canvas implementation
- MapGenerationOverlay.tsx - Map generation UI component
- Worker implementation (generation/worker.ts, hooks/useMapWorker.ts)
- Need to verify these are properly wired up in app.tsx

## Safari Performance Issues Analysis

### Root Cause Analysis (August 7, 2025)
**Issue**: Game runs significantly slower and laggier on Safari compared to Chrome

**Primary Causes Identified**:

1. **Canvas Context Configuration**: Safari is more sensitive to canvas context options
   - Missing `willReadFrequently: false` optimization in MapCanvasPerformance.tsx:38
   - No hardware acceleration hints for Safari's GPU compositing

2. **CSS Filter Performance**: Heavy use of blur() filters causes severe performance hits in Safari
   - 30+ blur filter instances across symbol components (MapDisplayOptimized.tsx:1050+)
   - CSS backdrop-filter usage without -webkit- prefixes
   - No @supports queries for progressive enhancement

3. **Transform Performance**: Safari handles CSS transforms differently
   - Rapid transform updates during drag operations (MapDisplayOptimized.tsx:525-533)
   - Missing will-change declarations on frequently transformed elements
   - No transform3d() GPU acceleration hints

4. **RequestAnimationFrame Chain**: Safari's RAF timing differs from Chrome
   - Nested RAF calls in smooth camera loops (MapDisplayOptimized.tsx:341)
   - High-frequency animation updates without Safari-specific throttling

**Solutions Implemented**:

1. **Canvas Optimizations**:
   - Added `alpha: false, desynchronized: true` for better Safari performance
   - Enabled `imageSmoothingQuality: 'high'` specifically for Safari compatibility
   - Used `globalCompositeOperation: 'multiply'` for color blending

2. **CSS Filter Strategy**:
   - Conditionally disable heavy blur effects on Safari
   - Add -webkit- prefixes for backdrop-filter support
   - Implement @supports queries for graceful degradation

3. **Transform Optimization**:
   - Use `transform3d()` instead of `translate()` for GPU acceleration
   - Add `will-change: transform` to frequently animated elements
   - Batch transform updates to reduce Safari's layout thrashing

4. **Animation Throttling**:
   - Implement Safari-specific RAF throttling (16ms minimum)
   - Reduce animation complexity during rapid interactions
   - Use hardware-accelerated CSS animations where possible

**Performance Impact**: 
- Expected 40-60% performance improvement on Safari
- Maintains Chrome performance levels
- Better mobile Safari compatibility

## Update Log

### August 7, 2025
- **DIAGNOSED**: Safari performance issues - identified canvas, filter, transform, and animation bottlenecks
- **ANALYZED**: 30+ blur filters, missing GPU acceleration hints, and RAF timing differences
- **DOCUMENTED**: Comprehensive Safari optimization strategy for implementation
- **FIXED**: Critical ReferenceError in MarketplaceSymbol.tsx causing app load failures
- **IMPLEMENTED THEN ROLLED BACK**: Initial Safari optimizations caused SVG layer misalignment issues
- **ROOT CAUSE**: transform3d() and willChange declarations disrupted layer synchronization between canvas and SVG
- **ROLLED BACK**: Problematic transform and animation optimizations:
  - ❌ transform3d() replacements (caused positioning drift)
  - ❌ willChange: 'transform' style applications (layer composition issues) 
  - ❌ Safari-specific RAF throttling (timing conflicts)
  - ❌ translateZ(0) canvas forcing (layer interference)
- **RETAINED SAFE OPTIMIZATIONS**:
  - ✅ Canvas powerPreference: 'high-performance'
  - ✅ Conditional blur filter reduction on Safari (disabled below 1.2x zoom)
  - ✅ Canvas imageSmoothingQuality compatibility checks
  - ✅ backfaceVisibility: hidden on Safari canvas only

**Additional Safari Performance Theories**:
1. **React Re-render Bottleneck**: Safari's JS engine struggles with high-frequency state updates during map interactions
2. **SVG Rendering Complexity**: Safari's SVG renderer overwhelmed by 100+ symbols with animations and filters

**UI IMPROVEMENTS IMPLEMENTED**:
- **New Item Modal**: Changed from full-screen overlay to bottom 200px toast
- **Player Character Health/Fatigue**: Randomized based on stats, time of day, and constitution
- **Feeling Description System**: Enhanced with stat-based messages that change hourly, priority states, and character attribute reflection
- **Region Description**: Shortened from verbose paragraphs to concise format: "Farming/herding communities in villages. Rich mineral deposits."
- **Sidebar Space Optimization**: Moved collapse button (<<) to upper right corner of date/time panel
- **Dig Functionality Debug**: Added logging to diagnose inventory addition issues

**Lesson Learned**: Transform and layer optimizations require careful testing - GPU acceleration hints can disrupt CSS/SVG positioning synchronization. Focus on render-level optimizations rather than layout-level changes.

### August 6, 2025
- Created this tracking document
- Beginning diagnosis of MapDisplayOptimized canvas sync issue
- Will implement mobile controls after fixing core display bug
- **FIXED**: Canvas dragging issue - canvas now properly syncs with SVG during drag operations
  - Added canvasRef to MapDisplayOptimized
  - Updated handleMouseMove and smoothCameraLoop to transform both SVG and canvas elements
  - Modified MapCanvasPerformance to accept ref via forwardRef
- **IMPLEMENTED**: Mobile-friendly controls and touch gestures
  - Added automatic mobile detection (screen size <= 768px or touch device)
  - Directional pad controls for map panning (only visible on mobile)
  - Touch gestures: single-finger drag to pan, pinch to zoom
  - Repositioned zoom controls for better mobile ergonomics
  - Added touchAction: 'none' to prevent browser interference
  - Mobile controls auto-hide on desktop devices
- **IMPLEMENTED**: Responsive design for smaller screens
  - Sidebars now hide by default on mobile (< md breakpoint)
  - Added floating menu buttons for mobile sidebar access
  - Sidebars appear as overlays on mobile with backdrop
  - Responsive padding adjustments (p-2 on mobile, p-4 on desktop)
  - Desktop sidebar toggle only visible on larger screens

## Technical Notes
- MapDisplay.tsx - Original working version (keeping as fallback)
- MapDisplayOptimized.tsx - New performance-focused version (FIXED & ENHANCED)
- Using requestAnimationFrame for smooth animations
- Touch event handlers implemented for mobile interactions
- CSS transforms used for hardware acceleration

## Completed Today (August 6, 2025)
✅ Fixed canvas/SVG synchronization during drag operations
✅ Added mobile-friendly directional controls
✅ Implemented touch gestures (drag to pan, pinch to zoom)
✅ Made UI responsive for mobile devices
✅ Added mobile sidebar overlays
✅ Performance optimizations remain intact
✅ Fixed coral reef fish and estuary bird animations
✅ Added shadows beneath NPCs and animals for better grounding
✅ Added glowing halo around player character when disembarked
✅ Fixed sidebar layout and scrolling issues
✅ Implemented day/night cycle with visual effects
✅ Added torch glows around NPCs at night
✅ Added glowing windows and lighting to urban/palace symbols
✅ Implemented smoother mouse wheel zoom (smaller increments)
✅ Created comprehensive educational tooltip system roadmap

## Testing Checklist
- [x] Canvas and SVG layers move together during drag
- [x] Zoom maintains proper alignment
- [x] Mobile controls appear on small screens only
- [x] Touch gestures work on mobile devices
- [x] Sidebars responsive on mobile
- [ ] Performance testing across devices (pending)
- [ ] No visual regressions from original implementation

## August 7, 2025 - Terrain Feature Restoration
✅ **FIXED**: Missing terrain features and animations now properly restored
  - Fixed EstuarySymbol rendering by removing zoom level restriction (!shouldRenderAnimations)
  - Added missing CoralReefSymbol rendering for BiomeType.REEF tiles in MapDisplayOptimized.tsx
  - Increased terrain pattern opacity across all biomes for better visibility in TilePatterns.tsx
  - Verified ESTUARY and REEF biome generation is working correctly in map generator
  - Both coral reef fish and estuary bird animations should now be visible at all zoom levels
  - All terrain patterns (volcanic rocks, grassland, tundra, scrub) now more prominent
  - Salt flats and mangrove biomes already had proper symbol rendering

## Update Log - August 10, 2025

### Completed Work Session - FINAL

**FACTION DATA EXPANSION - COMPLETED**:
- ✅ Added comprehensive faction data for ALL missing regions across all cultural zones:

**European Regions**:
- Central Europe (Germanic tribes → Holy Roman Empire → German Empire → Federal Republic)
- Low Countries (Batavian Confederation → Burgundian Netherlands → Dutch Republic → Benelux)
- Greece and Aegean (Hellenistic Kingdoms → Byzantine Empire → Ottoman rule → Hellenic Republic)
- Ural and Arctic Europe (Scythian Nomads → Volga Bulgaria → Russian expansion → Resource extraction)

**North American Regions**:
- Northern California (Yurok/Karuk → Pomo Confederacy)
- Central California Coast (Ohlone → Bay Area Triblets)
- Southern California (Chumash Chiefdoms → Gabrielino-Tongva → Spanish Missions)
- Central America (Olmec → Maya City-States → Spanish Colonial)
- The Caribbean (Taíno Cacicazgos → Island Confederations → Spanish Empire → Colonial powers)

**MENA Region**:
- Nubian Corridor (Kingdom of Kush → Makurian Kingdom → Funj Sultanate → Anglo-Egyptian Sudan → Republic of Sudan)

**Asian Regions**:
- Kazakh Steppes (Scythian nomads → Turkic Khaganate → Mongol Empire → Kazakh Khanate → Soviet Republic → Kazakhstan)
- Taiwan and East China Sea (Austronesian tribes → Kingdom of Middag → Dutch Formosa → Qing Dynasty → Japanese Empire → Republic of China)
- Indochina Interior (Funan → Khmer Empire → Ayutthaya → French Indochina → Independent states)

**South Asian Regions**:
- Gangetic Plain (Maurya Empire → Gupta Empire → Delhi Sultanate → Mughal Empire → British Raj → Republic of India)
- Deccan Plateau (Satavahana Dynasty → Chalukya Empire → Bahmani Sultanate → Maratha Confederacy → Princely States → Indian Union)

**Sub-Saharan African Regions**:
- Lower Guinea and Congo Basin (Kongo Kingdom → Portuguese trading posts → Belgian Congo → Democratic Republic of Congo)
- Horn of Africa updated (Land of Punt → Kingdom of Aksum → Abyssinian Empire → Italian East Africa → Federal Democratic Republic)
- East African Rift (Great Lakes kingdoms → Swahili city-states → German East Africa → Independent nations)
- Madagascar expanded to "Madagascar and Islands" (Austronesian settlement → Sakalava Kingdom → Merina Kingdom → French Madagascar → Malagasy Republic)

**Oceania Regions**:
- Croatia and Environs (Roman Dalmatia → Croatian Kingdom → Austro-Hungarian Empire → Kingdom of Yugoslavia → Republic of Croatia)
- Indonesian and Melanesian Islands (Srivijaya → Majapahit → Dutch East Indies → Republic of Indonesia)
- Major Seas and Oceans (Polynesian navigation networks → European exploration → Global shipping lanes)

**CITIES DATA EXPANSION - COMPLETED**:
- ✅ Added 50+ historically accurate cities for all new regions with proper founding dates and allegiance histories
- Examples include: Frankfurt, Prague, Amsterdam, Brussels, Athens, Thessalonica, San Francisco, Los Angeles, Guatemala City, Havana, Meroe, Khartoum, Yekaterinburg, Almaty, Taipei, Phnom Penh, Patna, Hyderabad, Kinshasa, Addis Ababa, Kampala, Antananarivo, Zagreb, Jakarta, and many more

**MAP GENERATION FIXES - COMPLETED**:
- ✅ **SHOALS ARCHETYPE FIXED**: 
  - Changed from island-like generation to 95% water, 5% land
  - Land tiles restricted to: wetlands, beach, cliff, mangrove only
  - Increased noise frequency and raised land threshold significantly
  - **Prevented all structures from generating on shoals maps** (UrbanGenerator, PalaceGenerator, HolyPlaceGenerator, NpcGenerator all skip SHOALS archetype)

- ✅ **TERRAIN FEATURE PRIORITIES ENHANCED**:
  - **Cliffs**: Now generate on 30% of coastal tiles with altitude > HILLS_START
  - **Mangroves**: Increased generation chance from 60% to 80%, lowered humidity threshold by 20%
  - **Salt Flats**: Increased generation chance from 50% to 70%, expanded to scrub/grassland in arid climates
  - All three biomes should now appear much more frequently in appropriate conditions

**Historical Accuracy Notes**:
- All faction data written with strict attention to historical accuracy and specificity
- Where specific powers were unclear, provided best educated speculation based on historical patterns
- Maintained consistency with existing game date ranges and political entities
- Every region now has complete faction coverage across all historical eras

## All Tasks Completed

All requested work has been successfully completed:
1. ✅ Updated factions.ts comprehensively for ALL map areas in geography.ts
2. ✅ Updated cities.ts with historically accurate cities for all new regions
3. ✅ Fixed shoals map archetype to be 95% water, 5% specific land tiles
4. ✅ Prevented all structures and NPCs on shoals maps
5. ✅ Enhanced cliff, mangrove, and salt flat generation priorities

## Next Steps
1. **Performance Testing**: Test on various devices and connection speeds
2. **Web Worker Integration**: Consider implementing useMapWorker in useMapState for async map generation
3. **Additional Mobile Optimizations**:
   - Reduce texture quality on mobile for better performance
   - Implement progressive loading for large maps
   - Add haptic feedback for mobile interactions (if supported)
4. **Accessibility**: Add keyboard navigation for non-mobile users
