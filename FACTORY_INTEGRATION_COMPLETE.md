# Factory Labor System - Integration Complete! ✅

## What Was Implemented (Option B - Quick Direct Path)

### Files Modified

1. **`hooks/useUIState.ts`**
   - Added `showFactoryPanel` state
   - Added `showFactoryContractModal` state
   - Added `activeFactoryData` state
   - Exported all three in return statement

2. **`components/POIToastModal.tsx`**
   - Replaced "Commission Crafting" button with "💼 Ask for Work"
   - Added import for `getFactoryType`
   - Button now:
     - Gets factory type from factoryTypes.ts
     - Finds nearby NPCs (within 15 tiles)
     - Sets up activeFactoryData with factory info + NPCs
     - Closes POI toast
     - Opens contract negotiation modal

3. **`components/ModalHub.tsx`**
   - Added lazy imports for ContractNegotiationModal and FactoryLaborPanel
   - Added state destructuring from UIContext
   - Added rendering for ContractNegotiationModal (lines 1028-1049)
   - Added rendering for FactoryLaborPanel (lines 1051-1113)
   - Wired up callbacks:
     - `onAccept`: Opens factory panel after contract accepted
     - `onDecline`: Closes everything
     - `onWagesEarned`: Adds coins to inventory
     - `onPlayerStateChange`: Updates health/fatigue
     - `onTimeAdvance`: Advances game clock

4. **`App.tsx`**
   - Added `showFactoryPanel` to useUI destructuring
   - Wrapped LeftSidebar in conditional: `{!showFactoryPanel && (...)}` (line 931)
   - Left sidebar now hides when factory panel is open (like farm panel)

---

## How It Works (User Flow)

### Step 1: Find a Factory
Player walks to a factory tile on the map → POI toast appears

### Step 2: Ask for Work
Player clicks "💼 Ask for Work" button

**What Happens Behind the Scenes:**
- System calls `getFactoryType()` to get factory data (textile mill, steel mill, etc.)
- Finds nearby NPCs (anyone within 15 tiles of factory)
- Looks for overseer/factory_manager/foreman NPC
- Sets up `activeFactoryData`:
  ```typescript
  {
    factoryType: FactoryType,
    factoryName: string,
    factoryStructure: TerrainStructure,
    npcs: NpcEntity[],
    contract: null
  }
  ```
- Closes POI toast
- Opens `ContractNegotiationModal`

### Step 3: Negotiate Contract
ContractNegotiationModal opens with:
- Factory name and overseer info
- Base contract terms:
  - Hourly wage (based on factory type + player charisma/reputation)
  - Shift length (hours)
  - Break time (minutes)
  - Daily quota (units to produce)
- Negotiation buttons:
  - Try +$0.05/hr wage (easier)
  - Try +$0.10/hr wage (harder)
  - Try -1 hour shift
  - Try +15 min break
- Overseer mood: neutral → pleased → annoyed → hostile
- Push too hard = get rejected!

Player can:
- **Accept Contract** → Opens factory panel
- **Decline** → Closes everything, returns to map

### Step 4: Work the Shift
FactoryLaborPanel opens (full screen, left sidebar hidden):
- **Top**: FactoryInteriorBanner (pixel art showing workers/machines)
- **Left**: Available task cards grid
- **Right**: Player stats, contract info, coworkers

**Gameplay:**
1. Click task cards to start work (e.g., "Operate Loom", "Pour Ladle")
2. Some tasks have 🎯 timed actions (button appears, click at right moment)
3. Random events trigger every ~2 minutes:
   - Button mash events (FURNACE EMERGENCY! Click 20x fast!)
   - Timed choice events (8 seconds to decide)
   - Moral dilemmas (help child worker vs make quota)
4. Shift ends after contracted hours
5. Wages calculated (base + quota bonus/penalty)
6. Coins added to inventory
7. Health/fatigue changes applied
8. Game clock advances

### Step 5: Return to Map
Player clicks "End Shift" → Factory panel closes → Left sidebar reappears → Back to normal gameplay

---

## What Gets Integrated

### ✅ Player Stats
- **Health**: Decreases from injuries (random chance based on task risk)
- **Fatigue**: Increases with each task (some tasks more tiring)
- Changes persist after shift ends

### ✅ Inventory
- **Coins**: Added after shift completes
  - Base wages × hours worked
  - × quota bonus/penalty multiplier (0.8 to 1.3)
  - Example: $0.50/hr × 12 hours × 1.2 bonus = $7.20

### ✅ Time Advancement
- Game clock advances by shift length
- Days advance if shift crosses midnight
- Example: Start at 6 AM, work 12 hours → End at 6 PM

### ✅ NPC Relationships
- Coworker NPCs are visible in right sidebar
- Future: Actions affect relationships (help worker = +rep, snitch = -rep)

---

## Testing Checklist

### Phase 1: Basic Flow
- [ ] Load game with factory structures on map
- [ ] Walk to factory tile
- [ ] POI toast appears
- [ ] Click "💼 Ask for Work" button
- [ ] POI toast closes
- [ ] ContractNegotiationModal opens

### Phase 2: Contract Negotiation
- [ ] See factory name and overseer
- [ ] See base contract terms (wage, hours, quota)
- [ ] Click "+$0.05/hr wage" → Sometimes succeeds/fails
- [ ] Click multiple times → Overseer mood changes
- [ ] Push to "hostile" → Contract offer withdrawn
- [ ] Click "Decline & Leave" → Everything closes
- [ ] Restart, click "Accept Contract" → Opens factory panel

### Phase 3: Factory Panel
- [ ] FactoryInteriorBanner shows at top
- [ ] Left sidebar is HIDDEN
- [ ] Task cards grid shows 6 different tasks
- [ ] Right sidebar shows player stats, contract, coworkers
- [ ] Click a task card → Active task appears
- [ ] Progress bar animates
- [ ] For 🎯 tasks → "CLICK NOW!" button appears
- [ ] Click button → Bonus output
- [ ] Don't click → Reduced output + more fatigue
- [ ] Task completes → Output added, fatigue increased
- [ ] Sometimes get injured → Health decreases

### Phase 4: Random Events
- [ ] Wait ~2 minutes → Event modal appears
- [ ] **Button Mash Event**: Click rapidly → Counter increases → Success at 20
- [ ] **Timed Choice Event**: 8-second countdown → Make choice before 0
- [ ] **Standard Choice**: Pick option → See effects (health, fatigue, output)

### Phase 5: Shift Completion
- [ ] Shift ends after contracted hours
- [ ] Final wages calculated
- [ ] Toast shows "Earned X gold coins!"
- [ ] Check inventory → Coins added
- [ ] Check health/fatigue → Changes applied
- [ ] Check game clock → Time advanced
- [ ] Factory panel closes
- [ ] Left sidebar reappears

### Phase 6: Edge Cases
- [ ] Click "End Shift" early → Closes immediately
- [ ] No NPCs near factory → Still works (empty coworker list)
- [ ] Factory type not found → Shows warning toast
- [ ] Player dies during shift → Factory panel closes, death modal shows

---

## Current Factory Types

### 1. Textile Mill (1845, North American Colonial)
**Tasks:**
- Operate Loom (🎯)
- Thread Bobbin (🎯)
- Clean Machine
- Package Cloth
- Repair Thread (🎯)
- Fetch Materials

**Events:**
- Thread breakage (timed)
- Child worker struggling (moral choice)

**Wages:** $0.25-0.50/hr
**Shift:** 12-14 hours
**Danger:** Low-Medium

### 2. Steel Mill (1892, Industrial Era)
**Tasks:**
- Pour Ladle (🎯, dangerous)
- Load Furnace
- Move Ingots (🎯)
- Clear Slag
- Check Temperature
- Shovel Coal

**Events:**
- Furnace emergency (button mash!)
- Worker injured (moral choice)

**Wages:** $0.50-1.00/hr
**Shift:** 10-12 hours
**Danger:** Very High

### 3. Sugar Plantation (1720, Caribbean/South American)
**Tasks:**
- Cut Cane (🎯, brutal)
- Load Cart
- Operate Press
- Boil Juice (dangerous)
- Fetch Water
- Clear Field

**Events:**
- Heat exhaustion (timed)
- Overseer cruelty (moral choice)

**Wages:** $0.10-0.25/hr (subsistence)
**Shift:** 14+ hours
**Danger:** Extreme

---

## What's NOT Yet Implemented

### Missing Features (Future Work)
- [ ] More factory types (15 more planned)
- [ ] LLM text input moments (occasional custom actions)
- [ ] Multi-shift progression (work multiple days)
- [ ] NPC relationship tracking (workers remember you)
- [ ] Quest hooks (union organizing, strikes, reforms)
- [ ] Achievement system (safety records, output records)
- [ ] Sound effects (machinery, whistles, button clicks)
- [ ] Factory production integration (player work affects economy)

---

## Troubleshooting

### "This factory is not currently hiring workers"
- **Cause**: `getFactoryType()` returned null
- **Fix**: Check that factory structure has correct era/culturalZone
- **Workaround**: Try a different factory or different map area

### Contract modal doesn't open
- **Cause**: No NPCs found near factory
- **Fix**: Factory should auto-spawn worker NPCs in `factoryNpcBehaviors.ts`
- **Workaround**: Stand near any NPC before clicking "Ask for Work"

### Factory panel is blank
- **Cause**: `activeFactoryData.contract` is null
- **Fix**: Make sure contract was accepted in negotiation modal
- **Check**: ModalHub line 1052 requires `activeFactoryData.contract` to exist

### Left sidebar still visible
- **Cause**: `showFactoryPanel` not properly set
- **Fix**: Check App.tsx line 931 conditional
- **Check**: useUI() should export showFactoryPanel

### Wages not added to inventory
- **Cause**: Callback not firing or coin item malformed
- **Fix**: Check ModalHub lines 1064-1087 onWagesEarned callback
- **Check**: Look for "Earned X gold coins" toast

---

## Performance Notes

- Factory panel uses lazy loading (Suspense)
- Only loads when opened (not on app startup)
- Task interval: 1000ms (1 second per game minute)
- Random event check: Every 2 minutes
- Should run smoothly on all devices

---

## Next Steps

### Immediate Priorities
1. **Test thoroughly** using checklist above
2. **Fix any bugs** that appear during testing
3. **Add more factory types** (see FACTORY_LABOR_REDESIGN.md for full list)

### Future Enhancements
1. **Add sound effects**
   - Machinery sounds (different per factory type)
   - Whistle sound for shift start/end
   - Button click sounds for timed actions
   - Danger alerts for events

2. **Add LLM text input**
   - Occasional moments where player can type custom actions
   - Overseer responds based on context
   - Use similar pattern to farm panel

3. **Multi-shift system**
   - Track days worked at same factory
   - Build relationships with coworkers
   - Unlock promotions (better pay, easier tasks)

4. **Union organizing**
   - Secret meetings with union NPCs
   - Strike events (choose to join or cross picket line)
   - Historical accuracy (Knights of Labor, IWW, etc.)

---

## Code Quality Notes

✅ TypeScript types properly defined
✅ React hooks used correctly (useState, useCallback, useEffect)
✅ Lazy loading for performance
✅ Proper cleanup on unmount
✅ State managed centrally (UIContext)
✅ Callbacks properly wired
✅ Error handling (null checks, fallbacks)

---

**Status**: ✅ **READY FOR TESTING**

Try it out and let me know what needs adjustment!
