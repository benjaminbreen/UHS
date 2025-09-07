# Special Map NPC Guard Behavior Roadmap

## 📊 Current Implementation Status
- **Phase 1 (Core Detection)**: 70% Complete ⚠️
- **Phase 2 (Pursuit System)**: 0% Complete ❌
- **Phase 3 (Advanced Features)**: 10% Complete (Event Bus only) ⚠️
- **Overall Progress**: ~25% Complete

## Overview
Transform special map NPCs from passive entities into dynamic, context-aware actors with a focus on guard NPCs who actively pursue and confront players when appropriate. This creates tension and strategic gameplay in restricted areas while maintaining peaceful behavior for regular NPCs.

## Implementation Status: Phase 1 - 70% Complete

### ✅ Completed Components
1. **Guard Type Identification** - Working in `specialMapNpcBehaviorService.ts`
2. **Visual Warning System** - `NpcAlertIndicator.tsx` created and integrated
3. **Warning Dialogue Box** - `GuardWarningBox.tsx` created
4. **Event Bus System** - `eventBus.ts` created and functional
5. **LLM Integration** - Special map context passed to LLM for location-aware dialogue
6. **Encounter Service Enhancement** - Special map NPCs get role-specific instructions

### ⚠️ Partially Complete
1. **Guard Alert Rendering** - Fixed in `MapDisplayOptimized.tsx` but needs pursuit logic connection
2. **Guard Movement Logic** - Infrastructure exists but pursuit state machine not connected

### ❌ Not Started
1. **GuardPursuitService** - State machine for guard behavior (detecting → warning → pursuing)
2. **Guard-Player Collision** - Guards still blocked from entering player tile
3. **Coordinated Guard Behavior** - Multiple guard coordination system

## Current Architecture Review

### Existing Systems
1. **Encounter System**: 
   - `useUIState.ts`: `handleEncounter(target)` → `setEncounterTarget(target)`
   - `EncounterModal.tsx`: Full encounter UI with dialogue, trade, medical panels
   - `encounterService.ts`: Enhanced with special map context detection
   - ✅ NPCs in special maps now receive location-specific context

2. **NPC Behavior**: 
   - `useSpecialMapNpcBehavior.ts`: Movement, mood, activity system
   - `specialMapNpcBehaviorService.ts`: Context-aware behavior logic
   - ⚠️ Still blocks NPCs from entering player tile (needs update for guards)

3. **Special Map Display**:
   - `SpecialMapLocationDisplay.tsx`: Shows location name at top center
   - `MapViewport.tsx`: Orchestrates special map rendering
   - Position: `absolute top-4 left-1/2 transform -translate-x-1/2`

4. **New Systems Implemented**:
   - ✅ `eventBus.ts` - Event communication system
   - ✅ `NpcAlertIndicator.tsx` - Visual warning indicators (?, !, !!)
   - ✅ `GuardWarningBox.tsx` - FF6-style warning messages
   - ✅ Special map context injection in LLM prompts

## Recent Bug Fixes & Known Issues

### Fixed Issues
1. **NpcAlertIndicator Import Missing** - Added import and rendering logic to `MapDisplayOptimized.tsx`
2. **TypeError in encounterService.ts** - Fixed null reference error with archetype.toLowerCase()
3. **Special Map Context Not Passed** - Now correctly injecting special map context into LLM prompts

### Known Issues
1. **Table Component Errors** - TableLeft, TableCenter, TableRight components fail with undefined material colors in restaurantInn maps
2. **Guard Pursuit Not Active** - GuardPursuitService exists in roadmap but not implemented
3. **Guards Can't Enter Player Tile** - Movement logic still blocks guard-player collision

## 🎯 Next Implementation Steps

### Priority 1: Complete Phase 1 (Remaining 30%)
1. **Implement GuardPursuitService.ts** - Create the state machine for guard detection/warning/pursuit
2. **Connect pursuit logic to MapViewport** - Wire up guard state changes to UI
3. **Enable guard-player collision** - Modify movement logic to allow guards to confront player

### Priority 2: Fix Table Component Bugs
1. Debug material color issues in restaurant/inn special maps
2. Ensure proper prop passing to Table components

### Priority 3: Begin Phase 2
1. Implement pursuit pathfinding
2. Add multiple guard coordination
3. Create context-specific guard behaviors

---

## Phase 1: Core Guard Detection & Warning System (2-3 days) - 70% COMPLETE

### 1.1 Guard Type Identification ✅ COMPLETE
**File**: `services/specialMapNpcBehaviorService.ts`
```typescript
export function isGuardType(npc: NpcEntity): boolean {
  const guardProfessions = [
    'guard', 'soldier', 'sentry', 'watchman', 
    'palace guard', 'temple guard', 'security',
    'enforcer', 'protector', 'sentinel'
  ];
  return guardProfessions.some(prof => 
    npc.profession?.toLowerCase().includes(prof)
  );
}

export function getGuardAlertRadius(
  npc: NpcEntity, 
  mapArchetype: SpecialMapArchetype
): number {
  // Different detection ranges by location
  switch(mapArchetype) {
    case SpecialMapArchetype.ESTATES: return 4;
    case SpecialMapArchetype.SACRED: return 2;
    case SpecialMapArchetype.GOVERNMENT_FORUM: return 3;
    default: return 3;
  }
}
```

### 1.2 Visual Warning System - Exclamation Point ✅ COMPLETE
**File**: `components/NpcAlertIndicator.tsx` (Created)
```typescript
interface NpcAlertIndicatorProps {
  npc: NpcEntity;
  alertLevel: 'detecting' | 'warning' | 'pursuing';
  x: number;
  y: number;
  tileSize: number;
}

const NpcAlertIndicator: React.FC<NpcAlertIndicatorProps> = ({
  npc, alertLevel, x, y, tileSize
}) => {
  const getIndicator = () => {
    switch(alertLevel) {
      case 'detecting': return '?';  // Yellow
      case 'warning': return '!';     // Orange
      case 'pursuing': return '!!';   // Red
    }
  };

  const getColor = () => {
    switch(alertLevel) {
      case 'detecting': return '#FFD700';
      case 'warning': return '#FFA500';
      case 'pursuing': return '#FF0000';
    }
  };

  return (
    <div 
      className="absolute animate-bounce pointer-events-none"
      style={{
        left: x + tileSize * 0.7,
        top: y - tileSize * 0.3,
        fontSize: `${tileSize * 0.5}px`,
        color: getColor(),
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        zIndex: 100
      }}
    >
      {getIndicator()}
    </div>
  );
};
```

### 1.3 Blue Warning Dialogue Box (FF6 Style) ✅ COMPLETE
**File**: `components/GuardWarningBox.tsx` (Created)
```typescript
interface GuardWarningBoxProps {
  message: string;
  guardName?: string;
  severity: 'notice' | 'warning' | 'alert';
}

const GuardWarningBox: React.FC<GuardWarningBoxProps> = ({
  message, guardName, severity
}) => {
  const getBorderStyle = () => {
    switch(severity) {
      case 'notice': return 'border-blue-400';
      case 'warning': return 'border-yellow-400';
      case 'alert': return 'border-red-400';
    }
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 animate-fadeIn">
      <div className={`
        bg-blue-900/95 
        border-4 ${getBorderStyle()} 
        border-double
        rounded-lg 
        px-6 py-3 
        shadow-2xl
        min-w-[300px]
        max-w-[500px]
      `}>
        {/* Pixel art font style */}
        <div className="font-mono text-white text-lg tracking-wide">
          {guardName && (
            <div className="text-yellow-300 text-sm mb-1">
              {guardName}:
            </div>
          )}
          <div className="leading-relaxed">
            {message}
          </div>
        </div>
        
        {/* Optional countdown timer for warning phase */}
        {severity === 'warning' && (
          <div className="mt-2 text-xs text-blue-200 text-center">
            Move away in 3 turns...
          </div>
        )}
      </div>
    </div>
  );
};
```

### 1.4 Update Movement Logic for Guards ❌ NOT IMPLEMENTED
**File**: `hooks/useSpecialMapNpcBehavior.ts`
**Note**: Guards still cannot enter player tile - collision prevention remains in place
```typescript
// Modify applyBehaviorToNpc function (line ~130)
const applyBehaviorToNpc = useCallback((
  npc: NpcEntity, 
  state: NpcBehaviorState, 
  npcs: NpcEntity[], 
  player: PlayerCharacter
) => {
  // ... existing code ...

  // Update NPC movement
  if (state.isMoving && state.targetLocation) {
    const dx = Math.sign(state.targetLocation.x - npc.x);
    const dy = Math.sign(state.targetLocation.y - npc.y);
    
    // Check if target location is walkable
    if (tiles && tiles[npc.y + dy] && tiles[npc.y + dy][npc.x + dx]) {
      const targetTile = tiles[npc.y + dy][npc.x + dx];
      const targetX = npc.x + dx;
      const targetY = npc.y + dy;
      
      // ... existing collision checks ...
      
      // MODIFIED: Allow guards to enter player tile to trigger encounter
      const hasPlayerCollision = player.x === targetX && player.y === targetY;
      
      if (hasPlayerCollision && isGuardType(npc)) {
        // Guard confronts player - trigger encounter
        triggerGuardEncounter(npc, player);
        return; // Allow the move
      }
      
      // Regular NPCs still avoid player
      if (!isBlockingTerrain(targetTile.biome) && 
          !targetTile.isBlocking && 
          !hasBlockingOverlay && 
          !hasNpcCollision && 
          !hasPlayerCollision) {
        // ... move NPC ...
      }
    }
  }
  // ... rest of function ...
}, [tiles, npcs, player, triggerGuardEncounter]);
```

---

## Phase 2: Smart Pursuit & Context System (3-4 days) - NOT STARTED

### 2.1 Guard Detection & Pursuit State Machine ❌ NOT IMPLEMENTED
**File**: `services/guardPursuitService.ts` (Planned - Does not exist)
```typescript
export interface GuardState {
  npcId: string;
  state: 'patrol' | 'detecting' | 'warning' | 'pursuing' | 'searching' | 'returning';
  targetPlayer?: PlayerCharacter;
  lastSeenPosition?: { x: number; y: number };
  detectionTimer: number;
  warningTimer: number;
  pursuitTimer: number;
  alertMessage?: string;
}

export class GuardPursuitService {
  private guardStates: Map<string, GuardState> = new Map();
  
  updateGuardState(
    npc: NpcEntity,
    player: PlayerCharacter,
    mapArchetype: SpecialMapArchetype,
    distance: number
  ): GuardState {
    const currentState = this.guardStates.get(npc.id) || this.createInitialState(npc.id);
    const alertRadius = getGuardAlertRadius(npc, mapArchetype);
    
    // State transitions
    switch(currentState.state) {
      case 'patrol':
        if (distance <= alertRadius && this.shouldDetectPlayer(npc, player, mapArchetype)) {
          currentState.state = 'detecting';
          currentState.detectionTimer = 2; // 2 turns to confirm
          currentState.alertMessage = this.getDetectionMessage(npc, mapArchetype);
        }
        break;
        
      case 'detecting':
        if (distance > alertRadius) {
          currentState.state = 'patrol';
        } else if (currentState.detectionTimer <= 0) {
          currentState.state = 'warning';
          currentState.warningTimer = 3; // 3 turns to comply
          currentState.alertMessage = this.getWarningMessage(npc, mapArchetype);
        }
        currentState.detectionTimer--;
        break;
        
      case 'warning':
        if (distance > alertRadius + 2) {
          currentState.state = 'patrol';
          currentState.alertMessage = "Move along then.";
        } else if (currentState.warningTimer <= 0) {
          currentState.state = 'pursuing';
          currentState.pursuitTimer = 10; // 10 turns of active pursuit
          currentState.alertMessage = this.getPursuitMessage(npc, mapArchetype);
        }
        currentState.warningTimer--;
        break;
        
      case 'pursuing':
        currentState.lastSeenPosition = { x: player.x, y: player.y };
        if (distance > alertRadius * 2) {
          currentState.state = 'searching';
          currentState.pursuitTimer = 5;
        } else if (currentState.pursuitTimer <= 0) {
          currentState.state = 'returning';
        }
        currentState.pursuitTimer--;
        break;
        
      case 'searching':
        if (distance <= alertRadius) {
          currentState.state = 'pursuing';
          currentState.pursuitTimer = 10;
        } else if (currentState.pursuitTimer <= 0) {
          currentState.state = 'returning';
        }
        currentState.pursuitTimer--;
        break;
        
      case 'returning':
        // Return to patrol position
        if (this.reachedPatrolPoint(npc)) {
          currentState.state = 'patrol';
        }
        break;
    }
    
    this.guardStates.set(npc.id, currentState);
    return currentState;
  }
  
  private shouldDetectPlayer(
    npc: NpcEntity,
    player: PlayerCharacter,
    mapArchetype: SpecialMapArchetype
  ): boolean {
    // Context-specific detection
    switch(mapArchetype) {
      case SpecialMapArchetype.ESTATES:
        return !this.playerHasInvitation(player);
      case SpecialMapArchetype.SACRED:
        return this.playerViolatedSacredSpace(player);
      case SpecialMapArchetype.GOVERNMENT_FORUM:
        return this.playerIsWanted(player) || !this.playerHasPapers(player);
      default:
        return true;
    }
  }
  
  private getWarningMessage(npc: NpcEntity, mapArchetype: SpecialMapArchetype): string {
    const messages: Record<SpecialMapArchetype, string[]> = {
      [SpecialMapArchetype.ESTATES]: [
        "Halt! This is private property!",
        "You're not on the guest list!",
        "Turn back immediately!"
      ],
      [SpecialMapArchetype.SACRED]: [
        "Stop! This is holy ground!",
        "You desecrate this sacred space!",
        "Leave at once, blasphemer!"
      ],
      [SpecialMapArchetype.GOVERNMENT_FORUM]: [
        "Papers! Show your papers!",
        "You there! State your business!",
        "This is a restricted area!"
      ],
      // ... other archetypes
    };
    
    const archetypeMessages = messages[mapArchetype] || ["Halt!"];
    return archetypeMessages[Math.floor(Math.random() * archetypeMessages.length)];
  }
}

export const guardPursuitService = new GuardPursuitService();
```

### 2.2 Guard Movement Override
**File**: `hooks/useSpecialMapNpcBehavior.ts` (additions)
```typescript
// Add to updateNpcBehavior function
const updateNpcBehavior = useCallback((npc: NpcEntity) => {
  // ... existing code ...
  
  // Check if this is a guard and override behavior if needed
  if (isGuardType(npc)) {
    const distance = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
    const guardState = guardPursuitService.updateGuardState(
      npc, player, mapArchetype, distance
    );
    
    // Override activity based on guard state
    if (guardState.state === 'pursuing' || guardState.state === 'warning') {
      activity = {
        action: 'pursuing_intruder',
        location: { x: player.x, y: player.y }, // Move toward player
        duration: 1,
        interruptible: false,
        dialogue: guardState.alertMessage || 'Stop right there!'
      };
    } else if (guardState.state === 'searching' && guardState.lastSeenPosition) {
      activity = {
        action: 'searching_area',
        location: guardState.lastSeenPosition,
        duration: 5,
        interruptible: false,
        dialogue: 'Where did they go?'
      };
    }
    
    // Update UI with guard state
    eventBus.emit('guard:stateChange', {
      npcId: npc.id,
      state: guardState.state,
      message: guardState.alertMessage
    });
  }
  
  // ... rest of function ...
});
```

### 2.3 Integration with UI
**File**: `components/MapViewport.tsx` (additions)
```typescript
// Add state for guard warnings
const [guardWarning, setGuardWarning] = useState<{
  message: string;
  guardName?: string;
  severity: 'notice' | 'warning' | 'alert';
} | null>(null);

const [guardAlerts, setGuardAlerts] = useState<Map<string, string>>(new Map());

// Listen for guard state changes
useEffect(() => {
  const handleGuardStateChange = (data: any) => {
    if (data.state === 'warning') {
      setGuardWarning({
        message: data.message,
        guardName: data.guardName,
        severity: 'warning'
      });
      // Auto-hide after 5 seconds
      setTimeout(() => setGuardWarning(null), 5000);
    } else if (data.state === 'pursuing') {
      setGuardWarning({
        message: data.message,
        guardName: data.guardName,
        severity: 'alert'
      });
    }
    
    // Update alert indicators
    setGuardAlerts(prev => {
      const newAlerts = new Map(prev);
      if (data.state === 'patrol') {
        newAlerts.delete(data.npcId);
      } else {
        newAlerts.set(data.npcId, data.state);
      }
      return newAlerts;
    });
  };
  
  // Subscribe to guard events (will need event system implementation)
  // eventBus.on('guard:stateChange', handleGuardStateChange);
  
  return () => {
    // eventBus.off('guard:stateChange', handleGuardStateChange);
  };
}, []);

// Add to render
return (
  <>
    {/* Existing special map display */}
    {isSpecialMap && mapData && (
      <SpecialMapLocationDisplay
        mapDisplayName={getSpecialMapDisplayName(mapData)}
        currentRoom={currentRoom}
        playerX={controlledIconX || 0}
        playerY={controlledIconY || 0}
      />
    )}
    
    {/* Guard warning box - appears below location display */}
    {guardWarning && (
      <GuardWarningBox
        message={guardWarning.message}
        guardName={guardWarning.guardName}
        severity={guardWarning.severity}
      />
    )}
    
    {/* Map display with alert indicators */}
    <MapDisplayOptimized
      // ... existing props ...
      guardAlerts={guardAlerts} // Pass to map for rendering indicators
    />
  </>
);
```

---

## Phase 3: Advanced Features & Polish (2-3 days) - PARTIAL

### 3.1 Event Bus Implementation ✅ COMPLETE
**File**: `services/eventBus.ts` (Created and working)
```typescript
type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();
  
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }
  
  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback);
  }
  
  emit(event: string, data?: any): void {
    this.events.get(event)?.forEach(callback => callback(data));
  }
  
  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
```

### 3.2 Guard Encounter Trigger
**File**: `hooks/useUIState.ts` (additions)
```typescript
// Add guard-specific encounter handler
const triggerGuardEncounter = useCallback((
  guard: NpcEntity,
  reason: 'trespassing' | 'wanted' | 'sacrilege' | 'suspicious'
) => {
  // Set up special guard encounter
  const guardEncounter = {
    ...guard,
    encounterType: 'guard_confrontation',
    encounterReason: reason,
    canFlee: true,
    fleeChance: 0.3 + (playerCharacter?.skills?.dexterity || 0) * 0.02
  };
  
  setEncounterTarget(guardEncounter);
  
  // Add special dialogue based on reason
  const dialogue = getGuardConfrontationDialogue(reason, guard, playerCharacter);
  guard.dialogue = [dialogue];
}, [playerCharacter, setEncounterTarget]);
```

### 3.3 Contextual Guard Dialogue
**New File**: `constants/gameData/guardDialogue.ts`
```typescript
export const GUARD_DIALOGUE = {
  trespassing: {
    initial: [
      "You're trespassing on private property!",
      "This area is off-limits to civilians!",
      "Turn back now or face the consequences!"
    ],
    options: {
      apologize: "I'm sorry, I didn't know. I'll leave immediately.",
      bribe: "Perhaps we can come to an arrangement? (10 gold)",
      bluff: "I'm here on official business.",
      fight: "You'll have to make me leave."
    }
  },
  
  wanted: {
    initial: [
      "You! You're the one we've been looking for!",
      "Criminal! You're under arrest!",
      "Don't move! You're wanted by the authorities!"
    ],
    options: {
      surrender: "I surrender peacefully.",
      bribe: "I can make it worth your while... (50 gold)",
      lie: "You must have me confused with someone else.",
      fight: "You'll never take me alive!"
    }
  },
  
  sacrilege: {
    initial: [
      "Blasphemer! You defile this sacred place!",
      "How dare you violate the sanctity of this temple!",
      "The gods will punish your sacrilege!"
    ],
    options: {
      repent: "Forgive me, I meant no disrespect.",
      donate: "Let me make an offering to atone. (25 gold)",
      argue: "I have as much right to be here as anyone.",
      fight: "Your gods mean nothing to me."
    }
  }
};
```

### 3.4 Multiple Guard Coordination
**File**: `services/guardPursuitService.ts` (additions)
```typescript
// Add method for coordinating multiple guards
coordinateGuards(
  guards: NpcEntity[],
  player: PlayerCharacter,
  mapTiles: Tile[][]
): Map<string, { x: number; y: number }> {
  const guardTargets = new Map();
  
  // If multiple guards are pursuing, surround the player
  const pursuingGuards = guards.filter(g => {
    const state = this.guardStates.get(g.id);
    return state?.state === 'pursuing';
  });
  
  if (pursuingGuards.length > 1) {
    // Calculate surrounding positions
    const surroundPositions = [
      { x: player.x - 1, y: player.y },     // West
      { x: player.x + 1, y: player.y },     // East
      { x: player.x, y: player.y - 1 },     // North
      { x: player.x, y: player.y + 1 },     // South
    ];
    
    pursuingGuards.forEach((guard, index) => {
      const targetPos = surroundPositions[index % surroundPositions.length];
      if (this.isValidPosition(targetPos, mapTiles)) {
        guardTargets.set(guard.id, targetPos);
      } else {
        // Default to moving toward player
        guardTargets.set(guard.id, { x: player.x, y: player.y });
      }
    });
  } else {
    // Single guard moves directly toward player
    pursuingGuards.forEach(guard => {
      guardTargets.set(guard.id, { x: player.x, y: player.y });
    });
  }
  
  return guardTargets;
}

// Call for reinforcements
callReinforcements(
  guard: NpcEntity,
  mapArchetype: SpecialMapArchetype
): void {
  const reinforcementChance = this.getReinforcementChance(mapArchetype);
  
  if (Math.random() < reinforcementChance) {
    eventBus.emit('guard:reinforcements', {
      callingGuard: guard.id,
      position: { x: guard.x, y: guard.y },
      archetype: mapArchetype
    });
  }
}
```

### 3.5 Escape & Stealth Mechanics
**File**: `services/stealthService.ts` (new)
```typescript
export class StealthService {
  calculateDetectionChance(
    player: PlayerCharacter,
    guard: NpcEntity,
    distance: number,
    environment: BiomeType
  ): number {
    let baseChance = 1.0 - (distance * 0.2); // Further = harder to detect
    
    // Player modifiers
    const stealthSkill = player.skills?.stealth || 0;
    baseChance -= stealthSkill * 0.02;
    
    // Environment modifiers
    if (this.isDarkArea(environment)) baseChance -= 0.2;
    if (this.hasHidingSpots(environment)) baseChance -= 0.15;
    
    // Guard modifiers
    if (guard.profession?.includes('elite')) baseChance += 0.2;
    
    return Math.max(0.1, Math.min(1.0, baseChance));
  }
  
  attemptHide(
    player: PlayerCharacter,
    tile: Tile
  ): { success: boolean; duration: number } {
    const hidingSpots = [
      BiomeType.CABINET,
      BiomeType.CHEST,
      BiomeType.BOOKSHELF,
      BiomeType.CURTAIN,
      BiomeType.PILLAR
    ];
    
    if (hidingSpots.includes(tile.biome)) {
      const hideChance = 0.5 + (player.skills?.stealth || 0) * 0.03;
      return {
        success: Math.random() < hideChance,
        duration: 5 + Math.floor(Math.random() * 5)
      };
    }
    
    return { success: false, duration: 0 };
  }
}
```

---

## Implementation Testing Plan

### Test Scenarios

1. **Basic Guard Detection**
   - Place guard NPC in government forum
   - Move player within 3 tiles
   - Verify: ? indicator appears, detection message shows

2. **Warning Phase**
   - Continue from detection
   - Wait 2 turns
   - Verify: ! indicator, warning box appears with message

3. **Pursuit Initiation**
   - Ignore warning for 3 turns
   - Verify: !! indicator, guard moves toward player

4. **Encounter Trigger**
   - Let guard reach player
   - Verify: Encounter modal opens with guard-specific options

5. **Multiple Guards**
   - Place 3 guards in estates
   - Trigger detection
   - Verify: Guards coordinate to surround player

6. **Context-Specific Behavior**
   - Test in each archetype:
     - Sacred: Check for sacrilege detection
     - Estates: Check for invitation validation
     - Government: Check for papers/wanted status

7. **Escape Mechanics**
   - Trigger pursuit
   - Move behind furniture
   - Verify: Hide option available

8. **Performance**
   - Place 10+ guards
   - Verify: No lag in movement/detection

---

## File Changes Summary

### New Files
1. `components/NpcAlertIndicator.tsx` - Visual warning indicators
2. `components/GuardWarningBox.tsx` - FF6-style dialogue box
3. `services/guardPursuitService.ts` - Guard AI state machine
4. `services/eventBus.ts` - Event communication system
5. `services/stealthService.ts` - Hiding/escape mechanics
6. `constants/gameData/guardDialogue.ts` - Contextual dialogue

### Modified Files
1. `hooks/useSpecialMapNpcBehavior.ts` - Allow guards to enter player tile
2. `services/specialMapNpcBehaviorService.ts` - Add guard detection logic
3. `components/MapViewport.tsx` - Integrate warning UI
4. `hooks/useUIState.ts` - Add guard encounter handler
5. `components/MapDisplayOptimized.tsx` - Render alert indicators
6. `components/EncounterModal.tsx` - Handle guard encounters

---

## Success Metrics

1. **Gameplay Impact**
   - Players report increased tension in restricted areas
   - Strategic movement becomes important
   - Multiple solutions to guard encounters

2. **Technical Performance**
   - Detection calculations < 5ms per guard
   - Smooth pursuit pathfinding
   - No memory leaks from event listeners

3. **Visual Polish**
   - Clear, readable warning messages
   - Smooth indicator animations
   - FF6-inspired aesthetic consistency

---

## Future Enhancements

1. **Guard Memory System**
   - Guards remember previous encounters
   - Increased alertness after incidents
   - Reputation affects initial disposition

2. **Disguise System**
   - Wear guard uniforms to bypass detection
   - Cultural appropriate dress reduces suspicion
   - Time-limited disguises

3. **Bribery & Corruption**
   - Some guards accept bribes
   - Build relationships with specific guards
   - Information trading

4. **Day/Night Patterns**
   - Guards more alert at night
   - Shift changes create opportunities
   - Different guard types by time

5. **Sound Detection**
   - Running alerts nearby guards
   - Breaking objects causes investigation
   - Distraction mechanics

---

## Notes

- The warning box position (top-20) places it just below the SpecialMapLocationDisplay
- Guard dialogue should be culturally appropriate to era/zone
- Performance is critical with multiple guards active
- Maintain non-guard NPC peaceful behavior
- Consider mobile UI adjustments for warning displays