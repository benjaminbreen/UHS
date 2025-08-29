# 🏛️ Special Maps Implementation Roadmap v2.1
*Last Updated: December 2024*

## Vision Statement
Special Maps transform historically significant interiors and focused outdoor spaces into playable, educational experiences. Using a combination of existing biomes and new architectural tiles, we create authentic historical environments from the Roman Senate to WWII bunkers, from medieval markets to Mongol polo fields.

## 📊 Current Implementation Status

### ✅ Phase 1: Core Infrastructure (COMPLETED)

#### Infrastructure Complete:
- ✅ **Type System**: `types/specialMapTypes.ts` with full type definitions
- ✅ **Generator Framework**: `generation/specialMap/specialMapGenerator.ts` 
- ✅ **Entry/Exit System**: Working transitions between main and special maps
- ✅ **Map Context Integration**: `enterSpecialMap` and `exitSpecialMap` in MapContext
- ✅ **Loading State Fix**: Fixed infinite loading issue when entering special maps

#### Archetypes Implemented (7/10):
1. ✅ **PalaceComplex** - Enhanced version with gardens, throne rooms, cultural variants
2. ✅ **MarketBazaar** - Stalls, specialized zones, cultural layouts
3. ✅ **GovernmentForum** - Assembly halls, committee rooms, cultural styles
4. ✅ **SacredComplex** - Churches, mosques, temples with appropriate layouts
5. ✅ **MilitaryFortress** - Castles, bunkers, star forts
6. ✅ **UniversityAcademy** - Quadrangles, libraries, lecture halls
7. ✅ **OpenField** - Parade grounds, polo fields, festival spaces
8. ⏳ **Theater** - Basic structure exists, needs enhancement
9. ⏳ **Arena** - Basic structure exists, needs enhancement
10. ⏳ **Exhibition** - Basic structure exists, needs enhancement

#### File Structure Created:
```
generation/specialMap/
├── specialMapGenerator.ts          ✅ Main generator
├── specialMapNpcGenerator.ts       ✅ NPC placement
├── archetypes/
│   ├── palaceGenerator.ts          ✅ Basic palace
│   ├── palaceGeneratorEnhanced.ts  ✅ Enhanced palace
│   ├── marketGenerator.ts          ✅ Market/bazaar
│   ├── governmentGenerator.ts      ✅ Government buildings
│   ├── sacredGenerator.ts          ✅ Religious buildings
│   ├── fortressGenerator.ts        ✅ Military structures
│   ├── universityGenerator.ts      ✅ Academic buildings
│   ├── theaterGenerator.ts         ✅ Performance venues
│   ├── arenaGenerator.ts           ✅ Sports venues
│   ├── exhibitionGenerator.ts      ✅ Fairs/museums
│   └── openFieldGenerator.ts       ✅ Open spaces

constants/specialMaps/
├── specialGeography.ts             ✅ Registry system
└── archetypes/                      ✅ Historical examples

components/
├── GovernmentDistrictModal.tsx     ✅ Entry point modal
├── GovernmentDistrictBanner.tsx    ✅ Visual banner
└── symbols/government/specialMap/  ✅ Special map symbols
```

### 🚧 Phase 2: Current Work In Progress

#### Modal Integration (90% Complete):
- ✅ GovernmentDistrictModal shows available special maps
- ✅ Entry mechanism via `onEnterSpecialMap` prop
- ✅ Special map generation triggers correctly
- ✅ Map context switches between normal and special maps
- ⏳ Exit zones need testing
- ⏳ Return to original map needs verification

#### Special Map Registry (80% Complete):
- ✅ `SPECIAL_MAP_REGISTRY` structure in place
- ✅ Historical examples for major cities/regions
- ✅ Era-specific variants (Medieval, Renaissance, Modern)
- ⏳ Need more coverage for non-European zones
- ⏳ Missing OCEANIA and some AFRICAN examples

### ❌ Phase 3: Not Yet Started

#### Rendering & Interaction:
- ❌ Special biome symbols for architectural tiles
- ❌ Furniture rendering on tiles
- ❌ Interactive zones (throne, altar, shop counter)
- ❌ Special map-specific UI overlays

#### NPCs & Events:
- ❌ Special map NPC behaviors
- ❌ Context-aware dialogue (palace guard vs market vendor)
- ❌ Special map exclusive events
- ❌ Quest integration with special maps

#### Polish & Performance:
- ❌ Transition animations
- ❌ Sound/ambiance per archetype
- ❌ Historical information panels
- ❌ Save/load special map state
- ❌ Performance optimization for large maps

## 🎯 Priority Issues to Fix

### 1. **Special Map Rendering** (CRITICAL)
Currently special maps generate but may not render correctly:
- Need to verify tile rendering in `MapDisplayOptimized.tsx`
- Special biomes (WALL, FLOOR_MARBLE, etc.) need symbols
- Check if `isSpecialMap` flag propagates to renderer

### 2. **Exit System** (HIGH)
- Exit zones are created but interaction not tested
- Need UI feedback when player approaches exit
- Verify return to original map with correct position

### 3. **NPC Population** (MEDIUM)
- `specialMapNpcGenerator.ts` exists but not integrated
- Need to spawn appropriate NPCs (guards, merchants, officials)
- NPCs should have special map-specific behaviors

## 📋 Next Steps Proposal

### Immediate Priority (Week 1):

#### 1. Fix Special Map Rendering
**File**: `components/MapDisplayOptimized.tsx`
- Add check for `isSpecialMap` flag
- Create symbol mappings for architectural biomes (WALL, FLOOR_MARBLE, etc.)
- Test rendering with a government forum entry

#### 2. Implement Exit Zones
**Files**: `hooks/useMapState.ts`, `components/MapViewport.tsx`
- Add player position checking against exit zones
- Show "Press E to Exit" UI when near exit
- Test return to original map position

#### 3. Add Special Biome Symbols
**File**: `components/symbols/government/specialMap/`
- Create SVG symbols for: WALL, FLOOR_STONE, FLOOR_MARBLE, FLOOR_WOOD
- Add furniture symbols: TABLE, CHAIR, THRONE, ALTAR
- Integrate with existing symbol generation system

### Short Term (Week 2-3):

#### 4. NPC Integration
- Call `generateSpecialMapNpcs()` after map generation
- Create context-aware NPC templates (guards, merchants, officials)
- Add special dialogue for special map NPCs

#### 5. Interaction Zones
- Implement interaction prompts for special zones
- Add throne audience mechanic
- Create shop counter interactions for markets

#### 6. Complete Remaining Archetypes
- Enhance Theater with proper seating generation
- Complete Arena with spectator areas
- Finish Exhibition with pavilion layouts

### Medium Term (Month 2):

#### 7. Historical Accuracy Pass
- Add more non-European examples to registry
- Create era-specific architectural details
- Add historical information tooltips

#### 8. Quest Integration
- Allow quests to target special map locations
- Create special map-specific quest objectives
- Add quest markers inside special maps

#### 9. Performance & Polish
- Implement viewport culling for large special maps
- Add transition animations (fade/slide)
- Create ambient sound profiles per archetype

### Long Term (Month 3+):

#### 10. Advanced Features
- Multi-floor support (dungeons, towers)
- Dynamic special maps (markets change by time of day)
- Special map exclusive items and treasures
- Historical event recreations in special maps

## 🐛 Known Bugs

1. **Loading stuck after entering special map** - FIXED
2. **Special map tiles may not render correctly** - PENDING
3. **Exit zones untested** - PENDING
4. **NPCs don't spawn in special maps** - PENDING

## 📈 Success Metrics

- [ ] Player can enter all 10 archetype types
- [ ] Each archetype has 3+ cultural variants
- [ ] Special maps render correctly with proper symbols
- [ ] NPCs behave appropriately in special contexts
- [ ] Exit/return flow works smoothly
- [ ] Performance: <500ms generation, 60fps rendering
- [ ] 50+ historical examples implemented

## 🎨 Design Principles

1. **Historical Authenticity**: Every special map should teach something real
2. **Cultural Sensitivity**: Respectful representation of all cultures
3. **Gameplay Integration**: Special maps enhance, not interrupt, core gameplay
4. **Performance First**: Large maps must remain playable
5. **Modular Architecture**: Easy to add new archetypes and variants