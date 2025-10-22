# Work Offer System - Critical Bugs & Required Fixes

## Summary
The work offer system has **8 critical production-blocking bugs** that must be fixed before it can be considered production-ready.

---

## ❌ CRITICAL BUG #1: Work Completion Only Checked at Midnight

### Location
`hooks/useCoreLoops.ts:315-359`

### Problem
Work completion check is inside the `if (newHours === 0)` block, meaning it only runs **once per day at midnight** instead of every hour as intended.

### Current Code
```typescript
if (newHours === 0) {
  setGameDate((prevDate) => {
    // ... date advancement ...

    // Check work offer completion every hour <- WRONG! Only runs at midnight
    const currentGameHours = ...;
    const activeOffers = getActiveWorkOffers();
    // ...
  });
}
```

### Impact
- Players complete "fetch water" task at 2pm
- They wait 10 hours until midnight to get notification
- Terrible UX - feels broken

### Fix Required
Move work completion check **outside** the date change block into its own hourly check:

```typescript
// Run every hour (moved outside date change block)
if (gameTimeMinutes >= 60) {
  // Check work completion
  const currentGameHours = ...;
  const activeOffers = getActiveWorkOffers();
  // ... completion checking logic ...
}

// Run at midnight for date changes
if (newHours === 0) {
  setGameDate(...);
}
```

---

## ❌ CRITICAL BUG #2: Cross-Map NPC Cleanup Breaks All Cross-Map Work

### Location
- `hooks/useCoreLoops.ts:362`
- `services/workOfferStorage.ts:131`

### Problem
`cleanupOrphanedWorkOffers(npcs)` uses the `npcs` array which **only contains NPCs from the current map**. When player travels to a different map, NPCs from the original map are not in the array, so their work offers are incorrectly marked as "orphaned" and auto-failed.

### Scenario
1. Player is on "North China Plain" map (seed: "ABC123")
2. Player accepts work from merchant Li Wei
3. Player enters a special map (palace interior) - different NPC set
4. Cleanup runs: Li Wei not in palace NPC array → work auto-failed ❌
5. Player returns to world map - work offer is gone!

### Impact
**ALL cross-map work offers will be incorrectly failed**. This completely breaks the system.

### Fix Required
Store `mapSeed` with work offers and only cleanup when on the **same map**:

```typescript
// In workOfferStorage.ts
export function cleanupOrphanedWorkOffers(currentNpcs: NpcEntity[], currentMapSeed?: string): number {
  const offers = loadWorkOffers();
  const validNpcIds = new Set(currentNpcs.map(npc => npc.id));

  let cleanedCount = 0;
  const updatedOffers = offers.map(offer => {
    // ONLY cleanup if we're on the same map as the work offer
    const onSameMap = !currentMapSeed || !offer.npcLocation.mapSeed ||
                      offer.npcLocation.mapSeed === currentMapSeed;

    if (onSameMap && offer.accepted && !offer.completed && !offer.failed && !validNpcIds.has(offer.npcId)) {
      cleanedCount++;
      return { ...offer, failed: true };
    }
    return offer;
  });

  // ...
}
```

---

## ❌ CRITICAL BUG #3: NPC Existence Validation Fails for Cross-Map

### Location
`services/encounterService.ts:98-109`

### Problem
```typescript
const npcExists = allNpcs.some(npc => npc.id === target.id);

if (!npcExists) {
  // Auto-fail work...
}
```

If `allNpcs` only contains current map NPCs, this will incorrectly fail cross-map payments.

### Fix Required
Either:
1. Check mapSeed instead of NPC presence:
```typescript
const onCorrectMap = !completedOffer.npcLocation.mapSeed ||
                     completedOffer.npcLocation.mapSeed === mapData?.seed;

if (!onCorrectMap) {
  return Promise.resolve({
    text: `You need to return to the map where you met ${completedOffer.npcName} to collect your payment.`,
    reputationChange: 0
  } as any);
}
```

2. Or remove this check entirely (the player is talking to the NPC, so it obviously exists)

---

## ❌ BUG #4: No Time Remaining Display

### Location
`components/QuestsPanel.tsx` - work offer rendering

### Problem
Players accept work with deadlines but have no visual feedback about:
- How much time remains
- When deadline expires
- Urgency level

### Fix Required
Add time remaining calculation and display:
```typescript
const renderWorkOffer = (offer: WorkOffer) => {
  const timeRemaining = offer.deadline
    ? (offer.offerTime + offer.deadline) - currentGameHours
    : null;

  const isUrgent = timeRemaining && timeRemaining < 12; // Less than 12 hours
  const isExpiringSoon = timeRemaining && timeRemaining < 3; // Less than 3 hours

  return (
    <div className={`work-offer ${isExpiringSoon ? 'border-red-500 animate-pulse' : ''}`}>
      {/* ... offer details ... */}

      {timeRemaining && (
        <div className={`text-xs ${isExpiringSoon ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-gray-400'}`}>
          ⏰ {Math.floor(timeRemaining)} hours remaining
        </div>
      )}
    </div>
  );
};
```

---

## ❌ BUG #5: No Way to Abandon Work

### Location
`components/QuestsPanel.tsx`

### Problem
Players who accept impossible work are stuck with it forever (unless deadline expires or NPC dies). This clutters the quest panel.

### Fix Required
Add "Abandon" button with confirmation:
```typescript
<button
  onClick={() => {
    if (window.confirm(`Abandon work from ${offer.npcName}? This will hurt your reputation.`)) {
      removeWorkOffer(offer.id);

      // Small reputation penalty for abandoning
      onUpdatePlayer({
        ...playerCharacter,
        mapReputation: Math.max(0, (playerCharacter.mapReputation || 50) - 10)
      });

      window.dispatchEvent(new CustomEvent('workOfferAbandoned', { detail: { offerId: offer.id } }));
      showToast(`Abandoned work for ${offer.npcName}. -10 reputation.`);
    }
  }}
  className="text-xs text-red-400 hover:text-red-300"
>
  Abandon
</button>
```

---

## ❌ BUG #6: Item Duplication Potential

### Location
`hooks/useCoreLoops.ts:332-344`

### Problem
Items are removed when work completes, but there's no verification when collecting payment. Potential exploit: complete task → items removed → dupe items somehow → collect payment.

### Fix Required
Add verification in `encounterService.ts`:
```typescript
if (completedOffer.requiredItem) {
  // Verify player still has the items (or they were already removed)
  const hasItems = playerCharacter.inventory.some(item =>
    item.name.toLowerCase() === completedOffer.requiredItem?.toLowerCase()
  );

  if (hasItems) {
    // Items weren't removed - suspicious! Remove them now
    console.warn('[WORK] Items not removed during completion check - removing now');
    // Remove items here
  }
}
```

---

## ❌ BUG #7: Toast Function Call May Be Wrong

### Location
`hooks/useCoreLoops.ts:364`

### Problem
```typescript
showToast(`${orphanedCount} work offer...`, 'warning');
```

Need to verify `showToast` accepts a second parameter for toast type.

### Fix Required
Check `showToast` signature. If it doesn't support types, remove the second parameter.

---

## ❌ BUG #8: No Visual Work Status Indicators

### Location
`components/QuestsPanel.tsx`

### Problem
No visual differentiation between:
- Available (not accepted)
- In Progress (accepted, not completed)
- Ready for Payment (completed, return to NPC)
- Failed (deadline expired)

### Fix Required
Add status badges:
```typescript
const getStatusBadge = (offer: WorkOffer) => {
  if (offer.failed) return <span className="badge badge-red">FAILED</span>;
  if (offer.completed) return <span className="badge badge-green">✓ COMPLETE - Return for Payment</span>;
  if (offer.accepted) return <span className="badge badge-amber">⏳ IN PROGRESS</span>;
  return <span className="badge badge-blue">NEW</span>;
};
```

---

## Additional Missing Features

### 9. No Progress Tracking
- "Fetch 3 apples" - player has 1 apple, but no UI shows "1/3"
- Need progress bars for quantity-based tasks

### 10. No Location Guidance
- "Deliver to marketplace" - which marketplace? Where is it?
- Need better location descriptions with coordinates

### 11. No NPC Movement Handling
- NPC might wander away from original location
- Player returns to (50, 50) but NPC moved to (55, 48)
- Need radius-based completion or NPC tracking

### 12. No Work Categories
- All work looks the same
- Need icons: 🔨 Crafting, 📦 Delivery, ⚔️ Combat, 🌾 Gathering

### 13. No Reputation Requirements
- Any player can get work from any NPC
- Should require minimum reputation for certain NPCs

### 14. No Work Cooldowns
- Player completes work → immediately asks for more → repeat infinitely
- Need cooldown timer per NPC (e.g., "Ask again in 12 hours")

---

## Testing Checklist (Not Done)

- [ ] Test work acceptance → modal closes → quest panel opens
- [ ] Test work completion → toast shows → status updates
- [ ] Test deadline expiration → work marked failed
- [ ] Test NPC death during active work → work auto-failed
- [ ] Test cross-map scenario: accept work → travel to different map → return → complete work
- [ ] Test item collection for "fetch" tasks
- [ ] Test location delivery for "deliver" tasks
- [ ] Test animal killing for "hunt" tasks
- [ ] Test multiple offers from same NPC (should be rejected)
- [ ] Test payment collection → coins added → reputation increased
- [ ] Test abandoning work → reputation penalty
- [ ] Test work panel auto-refresh on all state changes
- [ ] Test map markers for work locations
- [ ] Test cross-map work marker display

---

## Estimated Fix Time

- Bug #1 (Work completion timing): 15 minutes
- Bug #2 (Cross-map cleanup): 30 minutes
- Bug #3 (NPC validation): 15 minutes
- Bug #4 (Time display): 20 minutes
- Bug #5 (Abandon button): 25 minutes
- Bug #6 (Item verification): 20 minutes
- Bug #7 (Toast call): 5 minutes
- Bug #8 (Status badges): 30 minutes
- Additional features: 2-4 hours

**Total: 4-6 hours of focused development**

---

## Conclusion

The system is **NOT production-ready**. It has critical bugs that will break core functionality (especially cross-map scenarios) and lacks essential UX features (time remaining, abandon button, status indicators).

These are not "nice-to-haves" - they are **blocking bugs** that will cause user frustration and data corruption.

---

## Current Status

✅ **Completed (from previous session):**
1. Payment system callback
2. Quest panel auto-refresh
3. Map markers auto-refresh
4. Cross-map validation warnings
5. Multiple offer prevention

❌ **Critical Issues Remaining:**
1. Work completion timing (only at midnight)
2. Cross-map cleanup breaks work offers
3. NPC validation logic
4. No time remaining display
5. No abandon functionality
6. No status indicators
7. No progress tracking
8. Missing UX polish
