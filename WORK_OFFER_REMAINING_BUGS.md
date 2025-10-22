# Work Offer System - Remaining Critical Bugs

## 🔴 CRITICAL BUG #1: Item Removal Logic is Fundamentally Broken

### **Locations:**
- `services/workOfferService.ts:332-337` (completeWorkOffer function)
- `services/encounterService.ts:122-130` (anti-duplication check)

### **The Problem:**

The code assumes items with quantities are stored as **separate inventory objects**, but checks for quantities as if they're stored in a **single object with a quantity property**.

**Completion Check (CORRECT):**
```typescript
// Line 280: workOfferService.ts
const hasItem = playerCharacter.inventory.some(item =>
    item.name.toLowerCase() === offer.requiredItem?.toLowerCase() &&
    item.quantity >= (offer.requiredQuantity || 1)  // ✅ Checks quantity property
);
```

**Item Removal (WRONG):**
```typescript
// Line 332-337: workOfferService.ts
const itemsToRemove = playerCharacter.inventory
    .filter(item =>
        item.name.toLowerCase() === offer.requiredItem?.toLowerCase()
    )
    .slice(0, offer.requiredQuantity || 1)  // ❌ Tries to slice 5 items from array
    .map(item => item.id);
```

### **The Bug:**

**Scenario:** Player needs to collect 5 apples.

**Case 1: Items stored as separate objects (what the code assumes)**
```javascript
inventory = [
  { id: '1', name: 'Apple', quantity: 1 },
  { id: '2', name: 'Apple', quantity: 1 },
  { id: '3', name: 'Apple', quantity: 1 },
  { id: '4', name: 'Apple', quantity: 1 },
  { id: '5', name: 'Apple', quantity: 1 }
]
// .slice(0, 5) → Gets 5 items ✅
// Removes all 5 apples ✅
```

**Case 2: Items stored with quantity property (what the check assumes)**
```javascript
inventory = [
  { id: '1', name: 'Apple', quantity: 5 }
]
// .slice(0, 5) → Gets 1 item (array only has 1 element) ❌
// Removes 1 stack of 5 apples when it should only remove 5 quantity ❌
```

### **Impact:**
- **Scenario A (Separate Objects):** Might work correctly
- **Scenario B (Quantity Property):** Removes entire stack instead of decrementing quantity
- **Result:** Players lose MORE items than they should, or the wrong number of items

### **The Fix Needed:**

The code needs to handle BOTH cases:

```typescript
export function completeWorkOffer(
  offer: WorkOffer,
  playerCharacter: PlayerCharacter,
  removeItems?: (itemIds: string[]) => void
): { success: boolean; message: string; coinsEarned: number } {
  if (offer.requiredItem && removeItems) {
    const requiredQty = offer.requiredQuantity || 1;
    let remainingToRemove = requiredQty;
    const itemsToRemove: string[] = [];

    for (const item of playerCharacter.inventory) {
      if (item.name.toLowerCase() === offer.requiredItem.toLowerCase()) {
        const itemQty = item.quantity || 1;

        if (itemQty <= remainingToRemove) {
          // Remove entire stack
          itemsToRemove.push(item.id);
          remainingToRemove -= itemQty;
        } else {
          // Partial removal - need to decrement quantity
          // This requires a different approach!
          // Can't just remove by ID, need to UPDATE the item
          console.warn('[WORK] Partial stack removal not implemented!');
          // For now, remove the whole stack
          itemsToRemove.push(item.id);
          remainingToRemove = 0;
        }

        if (remainingToRemove <= 0) break;
      }
    }

    if (itemsToRemove.length > 0) {
      removeItems(itemsToRemove);
    }
  }

  return {
    success: true,
    message: `Thank you for completing the task! Here's your payment.`,
    coinsEarned: offer.payment
  };
}
```

**BUT WAIT:** This still doesn't handle partial quantity removal! The callback `removeItems` only accepts IDs to remove, not quantity updates.

### **The Real Problem:**

The `removeItems` callback is designed to remove entire items, not decrement quantities. The whole architecture is flawed for quantity-based inventory.

**Two possible solutions:**

1. **Change the callback signature:**
```typescript
removeItems?: (updates: Array<{id: string, removeQuantity: number}>) => void
```

2. **Enforce inventory rule:** Never allow stacks > 1 for work offer items
   - When items are added to inventory, split them into separate objects
   - This is simpler but less efficient

---

## ⚠️ CRITICAL BUG #2: Quantity Handling Inconsistency

### **Location:**
Throughout the codebase

### **The Problem:**

The codebase doesn't have a consistent rule for how items with quantities are stored:
- Sometimes: `{ name: "Apple", quantity: 5 }`
- Sometimes: 5 separate `{ name: "Apple", quantity: 1 }` objects

### **Impact:**

All item-based work will behave unpredictably depending on how items were added to inventory.

### **The Fix:**

**Option A:** Enforce consistency - always use quantity property:
```typescript
// When adding items to inventory
const existingItem = inventory.find(i => i.name === newItem.name);
if (existingItem) {
  existingItem.quantity = (existingItem.quantity || 1) + (newItem.quantity || 1);
} else {
  inventory.push({ ...newItem, quantity: newItem.quantity || 1 });
}
```

**Option B:** Always split items into separate objects (quantity always = 1):
```typescript
// When adding items
for (let i = 0; i < quantity; i++) {
  inventory.push({ ...item, id: generateUniqueId(), quantity: 1 });
}
```

---

## 🟡 MEDIUM BUG #3: Progress Tracking May Not Update

### **Location:**
`components/QuestsPanel.tsx:432-445`

### **The Problem:**

Progress tracking calculates on render, but doesn't listen to inventory changes.

```typescript
const calculateItemProgress = () => {
  if (!offer.requiredItem || !playerCharacter?.inventory) return null;

  const requiredQty = offer.requiredQuantity || 1;
  const currentQty = playerCharacter.inventory
    .filter(item => item.name.toLowerCase() === offer.requiredItem?.toLowerCase())
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  return {
    current: Math.min(currentQty, requiredQty),
    required: requiredQty,
    percentage: Math.min(100, (currentQty / requiredQty) * 100)
  };
};
```

### **Impact:**

If QuestsPanel isn't re-rendered when inventory changes, progress bar won't update until panel is closed and reopened.

### **The Fix:**

Add inventory change listener:
```typescript
useEffect(() => {
  const handleInventoryChange = () => {
    // Force re-render
    setWorkOffers(getActiveWorkOffers());
  };

  window.addEventListener('inventoryUpdated', handleInventoryChange);
  return () => window.removeEventListener('inventoryUpdated', handleInventoryChange);
}, []);
```

AND dispatch event when inventory changes:
```typescript
// In useCoreLoops or wherever inventory is updated
setPlayerCharacter(prev => {
  // ... update inventory ...
  window.dispatchEvent(new CustomEvent('inventoryUpdated'));
  return updatedCharacter;
});
```

---

## 🟡 MEDIUM BUG #4: Animal Kill Tracking Not Connected

### **Location:**
`services/workOfferService.ts:310-315`

### **The Problem:**

Work offers can require killing animals, but there's no code that calls `recordAnimalKill()` when an animal is killed.

```typescript
case 'kill_animal':
  // Check if the target animal was killed (tracked in localStorage)
  if (offer.targetAnimal) {
    return wasAnimalKilled(offer.id, offer.targetAnimal) ? 'completed' : 'in_progress';
  }
  return 'in_progress';
```

### **Impact:**

"Kill the wolf" work will NEVER complete because nothing calls `recordAnimalKill()`.

### **The Fix:**

Add kill tracking in combat system or wherever animals die:

```typescript
// In CombatModal or wherever animal death is handled
if (animal.health <= 0) {
  // Check if any active work offers require killing this animal
  const activeOffers = getActiveWorkOffers();
  activeOffers.forEach(offer => {
    if (offer.taskType === 'kill_animal' &&
        offer.targetAnimal?.toLowerCase() === animal.speciesName.toLowerCase()) {
      recordAnimalKill(offer.id, animal.speciesName);
      console.log(`[WORK] Recorded kill of ${animal.speciesName} for offer ${offer.id}`);
    }
  });

  // ... rest of animal death logic
}
```

---

## 🟢 LOW BUG #5: No Validation for Work Generation Failures

### **Location:**
`components/EncounterModalUpdated.tsx:765-783`

### **The Problem:**

When work generation fails (LLM error, no work available, etc.), the code just falls through to normal dialogue without feedback.

```typescript
const offer = await generateWorkOffer(...);

if (offer) {
  setWorkOffer(offer);
  // ...
} else {
  // NPC has no work available (likely already has active offers)
  const rejectionEntry: DialogueEntry = {
    speaker: 'npc',
    text: `I appreciate your interest, but I already have you working on some tasks...`,
    timestamp: new Date()
  };
  setHistory(prev => [...prev, rejectionEntry]);
  // ...
}
```

This only handles the "max offers" case, not LLM failures.

### **Impact:**

If LLM fails, player just sees normal dialogue with no indication that their work request was detected.

### **The Fix:**

Better error handling:
```typescript
try {
  const offer = await generateWorkOffer(...);

  if (offer) {
    // Success case
  } else {
    // Could be max offers OR generation failure
    // Check which one
    const npcOffers = getWorkOffersForNpc(currentTarget.id);
    const activeCount = npcOffers.filter(o => o.accepted && !o.completed && !o.failed).length;

    if (activeCount >= MAX_OFFERS_PER_NPC) {
      // Max offers message
    } else {
      // Generation failure or NPC genuinely has no work
      const rejectionEntry: DialogueEntry = {
        speaker: 'npc',
        text: `I don't have any work for you right now. Perhaps check back later?`,
        timestamp: new Date()
      };
      setHistory(prev => [...prev, rejectionEntry]);
    }
  }
} catch (error) {
  console.error('Work offer generation failed:', error);
  // Show error to player
}
```

---

## 🟢 LOW ISSUE #6: Work Completion Mutates Offer Object

### **Location:**
`hooks/useCoreLoops.ts:316`

### **The Problem:**

```typescript
offer.completed = true;  // ❌ Direct mutation
```

This mutates the offer object before calling `updateWorkOffer()`, which could cause issues if React is using the same reference.

### **Impact:**

Minimal - likely works fine, but not best practice for React.

### **The Fix:**

```typescript
const updatedOffer = {
  ...offer,
  completed: true
};
completeWorkOffer(updatedOffer, ...);
updateWorkOffer(updatedOffer);
```

---

## Summary

| Bug | Severity | Impact | Fix Difficulty |
|-----|----------|--------|----------------|
| #1: Item removal logic broken | 🔴 CRITICAL | High - Wrong items removed | HIGH - Requires architecture change |
| #2: Quantity handling inconsistent | 🔴 CRITICAL | High - Unpredictable behavior | MEDIUM - Need to enforce consistency |
| #3: Progress tracking doesn't update | 🟡 MEDIUM | Medium - Stale UI | LOW - Add event listener |
| #4: Animal kills not tracked | 🟡 MEDIUM | High - Feature doesn't work | MEDIUM - Add kill tracking |
| #5: No LLM failure feedback | 🟢 LOW | Low - Poor UX | LOW - Better error handling |
| #6: Direct mutation | 🟢 LOW | None - Just bad practice | LOW - Use spread operator |

---

## Recommendation

**MUST FIX BEFORE PRODUCTION:**
1. Bug #1 (Item removal) - This will cause data loss and player frustration
2. Bug #2 (Quantity consistency) - This makes bug #1 worse
3. Bug #4 (Animal kills) - Feature is completely broken without this

**NICE TO FIX:**
4. Bug #3 (Progress tracking) - UX improvement
5. Bug #5 (LLM failures) - UX improvement
6. Bug #6 (Direct mutation) - Code quality

The work offer system is **NOT production ready** due to the critical item removal bug. This needs to be fixed first.
