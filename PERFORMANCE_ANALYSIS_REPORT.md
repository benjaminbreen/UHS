# Performance Analysis Report
**Date:** October 7, 2025
**Focus:** UI Load Times & Rendering Performance

## Executive Summary

After careful code analysis, your optimization work is **already quite good**:
- ✅ **Lazy loading is working** - modals are code-split
- ✅ **MapDisplayOptimized is memoized** with custom comparison function
- ✅ **Main bundle size is reasonable** (112KB / 24KB gzipped)
- ✅ **Cities/Languages data** is NOT a bottleneck (used in only 11-12 files, not imported globally)

## Current Performance Status

### Build Output Analysis
```
Main Bundle:     112.14 kB (24.22 kB gzipped) ✓ Good
CSS Bundle:      74.79 kB (13.99 kB gzipped)  ✓ Good
Total Dist Size: ~4-5 MB (includes all assets)
Code Splitting:  40+ lazy-loaded modal chunks  ✓ Working
```

### Component Sizes
```
MapDisplayOptimized.tsx:  5,016 lines  ⚠️ Very large
LeftSidebar.tsx:          1,245 lines  ⚠️ Large
RightSidebar.tsx:           902 lines  ⚠️ Large
App.tsx:                  1,253 lines  ⚠️ Large
```

## 🔴 Critical Issues (High Impact)

### 1. **MapDisplayOptimized Too Large (5,016 lines)**
**Impact:** Slows initial parse time, harder to optimize, potential re-render issues

**Problem:**
- Massive component with 16 `useEffect` hooks
- 17 console.log statements (removed in production but still parsed)
- Complex viewport culling and rendering logic in one file

**Solutions:**
```typescript
// Split into smaller, focused components:
// 1. Create MapCanvas.tsx (canvas rendering only)
// 2. Create MapSymbols.tsx (symbol rendering layer)
// 3. Create MapOverlays.tsx (tooltips, highlights, etc)
// 4. Create MapControls.tsx (zoom, pan handlers)

// Keep MapDisplayOptimized as orchestrator only
```

**Estimated Impact:** 15-20% faster initial render

### 2. **LeftSidebar Array Operations (31 filter/map calls)**
**Impact:** Re-computes NPC/animal lists on every render

**Problem:**
```typescript
// Current: These run on EVERY render
const visibleNpcs = npcs.filter(npc => ...)
const sortedAnimals = animals.map(a => ...).sort(...)
```

**Solution:**
```typescript
// Wrap in useMemo:
const visibleNpcs = useMemo(() =>
  npcs.filter(npc => npc.isVisible),
  [npcs] // Only recompute when npcs array changes
);

const sortedAnimals = useMemo(() =>
  animals.map(a => ({ ...a, distance: calculateDistance(a) })).sort(...),
  [animals, playerX, playerY]
);
```

**Current Status:** Found **16 useMemo/useCallback** in LeftSidebar (should be ~30)
**Estimated Impact:** 20-30% faster sidebar rendering

## 🟡 Medium Impact Issues

### 3. **Context Re-render Cascades**
**Impact:** Changes to UIContext trigger re-renders in many components

**Problem:**
- `useUIState` returns a single large object
- Any modal state change triggers all consumers to re-render

**Solution:**
```typescript
// Split UIContext into focused contexts:
export const ModalContext = createContext({ modals, setModal });
export const ToastContext = createContext({ toasts, showToast });
export const SidebarContext = createContext({ sidebar, setSidebar });

// Components only subscribe to what they need:
const { modals } = useModals(); // Only re-renders on modal changes
const { showToast } = useToasts(); // Never re-renders
```

**Estimated Impact:** 10-15% fewer re-renders

### 4. **Expensive Color/Style Calculations**
**Impact:** Runs on every tile render

**Current:**
```typescript
// In MapCanvasPerformance.tsx - runs for every tile:
const color = getTileRenderColor(tile.biome, climate, season);
```

**Solution:**
```typescript
// Pre-compute color lookup table:
const COLOR_CACHE = new Map<string, string>();

function getCachedColor(biome: BiomeType, climate: ClimateType) {
  const key = `${biome}-${climate}`;
  if (!COLOR_CACHE.has(key)) {
    COLOR_CACHE.set(key, getTileRenderColor(biome, climate));
  }
  return COLOR_CACHE.get(key)!;
}
```

**Estimated Impact:** 5-10% faster map rendering

## 🟢 Low Hanging Fruit (Easy Wins)

### 5. **Remove Console Statements**
17 console.log statements in MapDisplayOptimized slow parsing

**Fix:**
```bash
# Remove all console.log in production builds
# (Vite should do this automatically but verify)
```

### 6. **Portrait Lazy Loading**
LazyPortrait component could delay loading until visible

**Current:**
```typescript
import { LazyPortrait } from './portraits';
// Renders all NPC portraits immediately
```

**Better:**
```typescript
// Use Intersection Observer to only render visible portraits
const VisiblePortrait = ({ npc }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible && <LazyPortrait npc={npc} />}
    </div>
  );
};
```

**Estimated Impact:** 30-40% faster sidebar with many NPCs

### 7. **Debounce Expensive UI Updates**
**Current:** Fire/weather updates trigger immediate re-renders

**Better:**
```typescript
// In MapDisplayOptimized.tsx line 557:
import { debounce } from '../utils/perfUtils';

const debouncedFireUpdate = useMemo(
  () => debounce(() => setFireUpdateTrigger(prev => prev + 1), 100),
  []
);

useEffect(() => {
  const unsubscribe = fireService.onFireChange(debouncedFireUpdate);
  return unsubscribe;
}, []);
```

**Estimated Impact:** Smoother animations, less jank

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Wrap LeftSidebar array operations in `useMemo` (31 calls)
2. ✅ Add debouncing to fire/weather updates
3. ✅ Implement visible-only portrait rendering

**Expected:** 25-30% faster UI responsiveness

### Phase 2: Medium Refactors (4-6 hours)
1. ✅ Split MapDisplayOptimized into 4 focused components
2. ✅ Add color/style computation caching
3. ✅ Split UIContext into focused contexts

**Expected:** 30-40% faster initial render + fewer re-renders

### Phase 3: Advanced (8-12 hours)
1. ✅ Implement virtual scrolling for NPC/animal lists (if >50 items)
2. ✅ Web Worker for expensive calculations (path finding, etc)
3. ✅ IndexedDB for asset caching

**Expected:** 50%+ faster with large datasets

## What NOT to Do

❌ **Don't split cities.ts/languages.ts** - already optimized, low usage
❌ **Don't add more lazy loading** - already working well
❌ **Don't optimize bundle size** - already good at 24KB gzipped

## Quick Test Commands

```bash
# Profile actual render performance
npm run dev
# Open DevTools > Performance
# Record 5 seconds of normal gameplay
# Look for:
# - Long tasks (>50ms) ⚠️
# - Excessive re-renders ⚠️
# - Layout thrashing ⚠️

# Build size analysis
npm run build
npx vite-bundle-visualizer

# Runtime performance monitoring
# Add to App.tsx:
if (import.meta.env.DEV) {
  const reportWebVitals = await import('web-vitals');
  reportWebVitals.getCLS(console.log);
  reportWebVitals.getFID(console.log);
  reportWebVitals.getFCP(console.log);
}
```

## Conclusion

Your code is already well-optimized! The biggest wins will come from:
1. **Memoizing LeftSidebar computations** (easy, high impact)
2. **Splitting MapDisplayOptimized** (medium effort, high impact)
3. **Intersection Observer for portraits** (easy, medium impact)

Focus on **runtime performance** (re-renders, expensive calculations) rather than bundle size (already good).
