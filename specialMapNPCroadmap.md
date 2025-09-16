# Special Map NPC Guard Behavior Roadmap

## 📊 Current Implementation Status (Updated: January 2025)
- **Core NPC Systems**: 95% Complete ✅
- **Guard Detection**: 50% Complete ⚠️
- **Guard Pursuit**: 0% Complete ❌
- **Permission System**: 0% Complete ❌
- **Overall Progress**: ~45% Complete

## Overview
Transform special map NPCs from passive entities into dynamic, context-aware actors with a focus on guard NPCs who actively pursue and confront players when appropriate. This creates tension and strategic gameplay in restricted areas while maintaining peaceful behavior for regular NPCs.

## Current Implementation Analysis (January 2025)

### ✅ **Fully Implemented Systems**

1. **Special Map NPC Generation** (`specialMapNpcGenerator.ts`)
   - Culturally appropriate NPC placement by room type
   - Profession-specific roles and equipment
   - Context-aware for different archetypes (government, palace, temple, market)

2. **Advanced NPC Behavior System** (`specialMapNpcBehaviorService.ts` & `useSpecialMapNpcBehavior.ts`)
   - Context-aware mood system (happy, angry, suspicious, fearful)
   - Activity system (praying, hawking wares, patrolling, studying)
   - Attitude system based on player reputation and actions
   - Dynamic dialogue generation based on location and context

3. **NPC Awareness & Theft Detection** (`npcAwarenessService.ts`)
   - Line-of-sight calculations using Bresenham's algorithm
   - Detection ranges (5-12 tiles based on role)
   - Reputation impact calculation
   - Context-aware theft confrontation dialogue
   - Different reactions by NPC type (guard, merchant, noble, commoner)

4. **NPC Confrontation System** (`NpcConfrontationModal.tsx`)
   - Modal UI for theft confrontations
   - Multiple resolution options (pay, fight, surrender, escape)
   - Role-specific options (guards vs merchants vs nobles)
   - Fine calculations based on item value

5. **Arrest Service** (`arrestService.ts`)
   - Complete arrest event generation
   - Culturally appropriate scenarios and punishments
   - Teleportation to jail structures
   - Severity-based consequences (minor, major, capital)
   - **⚠️ Not connected to guard detection system**

6. **Historical Access Rules** (`historicalAccessRules.ts`)
   - 339 comprehensive rules for gender, profession, social class
   - Era-specific restrictions
   - Cultural variations (Islamic, Hindu, European, etc.)

7. **Event Bus System** (`eventBus.ts`)
   - Event communication infrastructure
   - Ready for guard state changes

### ⚠️ **Partially Implemented**

1. **Guard Detection System** - 50% Complete
   - Guard type identification (`isGuardType()`) ✅
   - Visual warning indicators (`NpcAlertIndicator.tsx`) created but not integrated
   - Restricted area detection logic exists but incomplete
   - Guards emit detection events but don't pursue or arrest

2. **Container System** - 80% Complete
   - Container interaction functional
   - Theft detection working
   - NPC line-of-sight reactions working
   - Missing: Persistent consequences

### ❌ **Not Implemented**

1. **Guard Pursuit State Machine**
   - No `GuardPursuitService.ts` (doesn't exist)
   - No state transitions (detect → warn → pursue → arrest)
   - Guards can't enter player tile to confront

2. **Guard Coordination**
   - No multiple guard coordination
   - No reinforcement system
   - No persistent alert states

3. **Arrest Integration**
   - Arrest service not triggered by guards
   - No connection between detection and arrest
   - No jail system integration

4. **Permission System**
   - No dialogue-based access granting
   - Guards don't respect NPC dialogue outcomes
   - No "call off the guards" mechanism

## Key Working Event Flows

### ✅ **Theft Detection Flow (Working)**
1. Player takes item from container → `specialMapContainerService.ts`
2. Theft detected by `npcAwarenessService.ts`
3. NPCs within line-of-sight react with dialogue
4. `NpcConfrontationModal.tsx` opens with resolution options
5. Reputation changes applied

### ❌ **Guard Arrest Flow (Broken)**
1. Player enters restricted area → Guard detection triggers
2. **BROKEN**: No guard state machine exists
3. **BROKEN**: Guards can't move to confront player
4. **BROKEN**: No arrest system integration

## Critical Missing Links
- `GuardPursuitService.ts` (doesn't exist)
- Guard-player collision (guards blocked from player tile)
- Integration between `arrestService.ts` and guard detection
- Persistent state management for guard alerts
- Permission system for dialogue-based access

---

## 🎯 NEW PRIORITY: Dialogue-Based Permission System ("Call Off the Guards")

### Problem Statement
Guards in special maps automatically arrest players approaching restricted zones (throne rooms, inner sanctums) regardless of dialogue outcomes. Even when NPCs decide through LLM dialogue that the player has a valid reason, guards continue to arrest them.

### Solution: Permission Grant System

#### **Phase 1: Create Permission Service** (2 hours)
**NEW FILE**: `services/guardPermissionService.ts`
```typescript
interface AccessPermission {
  mapId: string;
  grantedBy: string; // NPC ID who granted permission
  accessLevel: 'partial' | 'full'; // partial = some areas, full = everywhere
  restrictedAreas?: string[]; // room IDs still restricted
  expiresAt?: number; // timestamp when permission expires
  reason?: string; // why permission was granted
}

class GuardPermissionService {
  private permissions: Map<string, AccessPermission> = new Map();

  grantAccess(mapId: string, npcId: string, level: 'partial' | 'full', reason?: string): void
  revokeAccess(mapId: string): void
  hasPermission(mapId: string, roomId?: string): boolean
  getPermissionDetails(mapId: string): AccessPermission | null
}
```

#### **Phase 2: Extend LLM Dialogue Response** (3 hours)
**MODIFY**: `services/llmClientService.ts`
- Add permission evaluation to NPC dialogue response schema:
```typescript
responseSchema: {
  text: { type: Type.STRING },
  disposition: { type: Type.STRING },
  grantAccess: { type: Type.BOOLEAN }, // NEW
  accessLevel: { type: Type.STRING, enum: ['none', 'partial', 'full'] }, // NEW
  accessReason: { type: Type.STRING } // NEW
}
```

**MODIFY**: `services/npcDialogueService.ts`
- Include context for permission decisions:
  - Player's reputation score
  - Player's clothing quality (from appearance)
  - Player's profession/social class
  - Player's stated reason for access
  - NPC's role (can they grant permission?)

#### **Phase 3: Integrate Permission Checks** (2 hours)
**MODIFY**: `services/specialMapNpcBehaviorService.ts`
- Add permission check before guard alerts
- Check if player has permission for current map/room
- Guards don't react to permitted players

**MODIFY**: `components/EncounterModal.tsx`
- Handle permission grants from dialogue
- Store permissions in service
- Show success notification
- Emit event for guard state updates

#### **Phase 4: Visual Feedback** (1 hour)
**MODIFY**: `components/MapDisplayOptimized.tsx`
- Show green checkmark above guards when permission granted
- Different guard stance/animation for permitted players

**CREATE**: Permission status indicator in UI
- Small badge showing "Access Granted" status
- Timer showing remaining permission duration

### Permission Decision Factors (LLM Context)

#### High Success (80-95% chance):
- Player reputation > 80
- Matching social class (nobility in palace)
- Official profession (diplomat, merchant with papers)
- Wearing appropriate attire (formal clothes in court)
- Convincing reason + good reputation

#### Medium Success (40-60% chance):
- Neutral reputation (40-60)
- Decent clothing/appearance
- Plausible excuse
- Small bribe offered (if culturally appropriate)

#### Low Success (5-20% chance):
- Poor reputation (< 30)
- Inappropriate attire (peasant clothes in palace)
- Suspicious behavior or poor explanation
- No valid reason given

### Implementation Priority
1. **Immediate**: Permission service + LLM response extension
2. **Next**: Integration with guard behavior
3. **Polish**: Visual feedback and UI indicators

---

## 🎯 Implementation Priorities

### Priority 1: Dialogue-Based Permission System (8 hours)
1. **Create `guardPermissionService.ts`** - Central permission tracking
2. **Extend LLM dialogue response** - Add permission grant fields
3. **Integrate permission checks** - Modify guard behavior to respect permissions
4. **Add visual feedback** - Show permission status in UI

### Priority 2: Connect Existing Systems (4 hours)
1. **Link arrest service to guards** - Use existing `arrestService.ts`
2. **Enable guard confrontations** - Allow guards to enter player tile
3. **Wire up visual indicators** - Connect `NpcAlertIndicator.tsx`

### Priority 3: Fix Known Issues (2 hours)
1. **Fix table component errors** - Debug material colors in restaurant/inn maps
2. **Persist guard states** - Remember alerts between interactions

---

## Known Issues
1. **Table Component Errors** - TableLeft, TableCenter, TableRight components fail with undefined material colors in restaurantInn maps
2. **Guard Pursuit Not Active** - GuardPursuitService doesn't exist (only planned in old roadmap)
3. **Guards Can't Enter Player Tile** - Movement logic still blocks guard-player collision
4. **No Permission System** - Guards don't respect dialogue outcomes
5. **Visual Indicators Not Connected** - `NpcAlertIndicator.tsx` exists but not rendered

---

## Success Metrics
1. **Gameplay Impact**
   - Players can negotiate access through dialogue
   - Guards respect permission grants
   - Strategic conversation becomes important

2. **Technical Performance**
   - Permission checks < 5ms per guard
   - Smooth state transitions
   - No memory leaks from event listeners

3. **Visual Polish**
   - Clear permission status indicators
   - Smooth guard state changes
   - Consistent UI feedback

---

## Files Summary

### Existing Files That Work
- `services/specialMapNpcBehaviorService.ts` - NPC behavior logic
- `services/npcAwarenessService.ts` - Theft detection
- `services/arrestService.ts` - Arrest events (not connected)
- `components/NpcConfrontationModal.tsx` - Theft resolution UI
- `constants/specialMaps/historicalAccessRules.ts` - Access rules

### Files to Create
- `services/guardPermissionService.ts` - Permission tracking

### Files to Modify
- `services/llmClientService.ts` - Add permission fields
- `services/npcDialogueService.ts` - Add permission context
- `components/EncounterModal.tsx` - Handle permission grants
- `hooks/useSpecialMapNpcBehavior.ts` - Check permissions