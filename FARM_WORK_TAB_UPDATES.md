# Farm Work Tab Realistic Time Updates

## Summary
This document contains the code changes needed to implement:
1. Confirmation modals for farm actions
2. Realistic time/fatigue costs based on field size
3. 8PM cutoff with farmer warning

## Key Changes

### 1. Add action confirmation modal rendering (at end of component, before closing </div>)

```tsx
{/* Action Confirmation Modal */}
{actionConfirmation && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 border-2 border-amber-500/40 rounded-xl shadow-2xl p-6 max-w-md w-full">
      <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
        {actionConfirmation.action === 'Water Field' && '💧'}
        {actionConfirmation.action === 'Plant Crops' && '🌱'}
        {actionConfirmation.action === 'Harvest Crops' && '🌾'}
        {actionConfirmation.action}?
      </h3>

      <div className="space-y-3 mb-6">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Field</span>
            <span className="text-white font-semibold">Field {actionConfirmation.fieldId + 1}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Time Required</span>
            <span className="text-amber-400 font-semibold">{actionConfirmation.timeRequired.toFixed(1)} hours</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Fatigue Cost</span>
            <span className="text-red-400 font-semibold">+{actionConfirmation.fatigueRequired}</span>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="text-xs text-blue-300">
            Current time: <span className="font-semibold">{Math.floor(currentFarmTime % 24)}:00</span>
            {' → '}
            After work: <span className="font-semibold">{Math.floor((currentFarmTime + actionConfirmation.timeRequired) % 24)}:00</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setActionConfirmation(null)}
          className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            actionConfirmation.onConfirm();
            setActionConfirmation(null);
          }}
          className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

### 2. Update handleWater to use confirmation

Replace the entire `handleWater` function with this version that shows confirmation and checks time limits.

### 3. Update handlePlant similarly

### 4. Update handleHarvest similarly

### 5. Add farmer warning toast when working past 8 PM

Add this check inside each action's execution (after onTimeAdvance):

```tsx
// Check if we worked past 8 PM
const newHour = (currentFarmTime + timeRequired) % 24;
if (newHour >= 20 && currentFarmTime % 24 < 20) {
  // Farmer comes out to warn
  setTimeout(() => {
    showToast('🌙 The farmer calls out: "It\'s getting late! Come inside before you catch cold!"', 'warning');
    setMessage('🌙 The farmer insists you come inside for the night. Press Space at the farmhouse to sleep.');
  }, 1000);
}
```
