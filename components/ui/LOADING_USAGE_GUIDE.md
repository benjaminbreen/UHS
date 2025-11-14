# Loading States Usage Guide

Beautiful, theme-aware loading indicators for the Universal History Simulator.

## Components Available

### 1. **LoadingSpinner** - Primary loading indicator

```tsx
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With size variations
<LoadingSpinner size="xs" />   // 12px
<LoadingSpinner size="sm" />   // 16px
<LoadingSpinner size="md" />   // 24px (default)
<LoadingSpinner size="lg" />   // 32px
<LoadingSpinner size="xl" />   // 48px

// With text
<LoadingSpinner text="Loading historical context..." />

// Color variants
<LoadingSpinner variant="primary" />    // Accent color (default)
<LoadingSpinner variant="secondary" />  // Secondary accent
<LoadingSpinner variant="white" />      // White (for dark backgrounds)
<LoadingSpinner variant="current" />    // Inherits text color

// Centered
<LoadingSpinner center />
```

### 2. **LoadingDots** - Alternative subtle loader

```tsx
import { LoadingDots } from './components/ui/LoadingSpinner';

// Perfect for inline loading
<LoadingDots />
```

### 3. **LoadingProgress** - Indeterminate progress bar

```tsx
import { LoadingProgress } from './components/ui/LoadingSpinner';

// Great for full-width loading states
<LoadingProgress />
<LoadingProgress className="w-64" />
```

### 4. **Skeleton** - Content placeholders

```tsx
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from './components/ui/Skeleton';

// Basic skeleton
<Skeleton width={200} height={20} />

// Pre-built variants
<Skeleton variant="text" lines={3} />    // Text lines
<Skeleton variant="title" />             // Title placeholder
<Skeleton variant="avatar" />            // Circular avatar
<Skeleton variant="card" />              // Card placeholder

// Pre-built layouts
<SkeletonCard />                         // Complete card skeleton
<SkeletonList items={5} />              // List of items
<SkeletonTable rows={5} cols={4} />     // Table skeleton
```

---

## Migration Examples

### Before (Old Tailwind Spinner)
```tsx
{isLoading && (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
)}
```

### After (New LoadingSpinner)
```tsx
{isLoading && <LoadingSpinner size="md" />}
```

---

## Real-World Examples

### Modal Loading State
```tsx
{isLoadingContext ? (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner text="Loading historical context..." />
  </div>
) : (
  <p className="text-text-primary">{historicalContext}</p>
)}
```

### Inline Button Loading
```tsx
<button disabled={isProcessing}>
  {isProcessing ? (
    <>
      <LoadingSpinner size="sm" variant="white" />
      <span>Processing...</span>
    </>
  ) : (
    'Submit'
  )}
</button>
```

### Content Loading with Skeleton
```tsx
{isLoadingData ? (
  <SkeletonCard />
) : (
  <div className="card">
    <h3>{data.title}</h3>
    <p>{data.description}</p>
  </div>
)}
```

### Full Page Loading
```tsx
{isLoadingPage ? (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-text-secondary">Loading page...</p>
    </div>
  </div>
) : (
  <PageContent />
)}
```

---

## CSS Classes Available

You can also use the CSS classes directly:

- `.loading-spinner` - The base spinner (theme-aware)
- `.skeleton` - Shimmer effect
- `.progress-bar` - Progress bar container
- `.progress-bar-fill` - Animated fill
- `.dots-loader` - Bouncing dots
- `.pulse-slow` - Slow pulse animation

---

## Theme Behavior

All loading components automatically adapt to light/dark mode:

- **Light Mode**: Blue accent colors
- **Dark Mode**: Green accent colors with glow effect
- Skeleton loaders use theme-aware background colors
- Spinners have theme-specific animations (glow in dark mode)

---

## Performance Notes

- All animations use CSS only (no JavaScript)
- GPU-accelerated transforms
- Minimal DOM elements
- No external dependencies
- Works with Tailwind v4

---

## Accessibility

All loading components include:
- `role="status"` or `role="progressbar"`
- `aria-label="Loading"`
- Proper semantic markup

---

## Quick Wins - Replace These

Search for these patterns and replace with the new components:

1. `animate-spin rounded-full` → `<LoadingSpinner />`
2. Hardcoded loading text + spinner → `<LoadingSpinner text="..." />`
3. Empty states while loading → `<Skeleton variant="..." />`
4. Progress bars → `<LoadingProgress />`

---

## Questions?

All components are fully typed with TypeScript. Check the component files for detailed prop types and options.
