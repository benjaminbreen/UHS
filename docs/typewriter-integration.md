# Typewriter Effect Integration Guide

## How to Use in EncounterModal

### 1. Import the hook
```tsx
import { TypewriterText } from '../hooks/useTypewriter';
```

### 2. Modify dialogue display
Replace this in EncounterModal.tsx (around line 700-720):
```tsx
<div className="text-white">
    {entry.text}
</div>
```

With:
```tsx
<div className="text-white">
    {entry.speaker === 'npc' && index === history.length - 1 ? (
        // Only use typewriter for the most recent NPC response
        <TypewriterText 
            text={entry.text}
            speed={20} // Adjust speed as needed
            showCursor={false}
        />
    ) : (
        entry.text
    )}
</div>
```

## Performance Benefits

### Perceived Speed Improvements:
- **Immediate feedback**: Text starts appearing within ~50ms instead of waiting 1-3 seconds
- **Psychological engagement**: Users focus on reading appearing text rather than waiting
- **Reduced frustration**: No "dead air" while waiting for response

### Actual Timing:
- API call: 1-3 seconds (unchanged)
- Typewriter duration: ~1-2 seconds for average response
- But user sees activity immediately!

### Best Practices:
1. **Speed**: 15-25ms per character is optimal (feels natural, not too slow)
2. **Click to complete**: Allow users to click to instantly show full text
3. **Only animate latest**: Don't re-animate old messages when scrolling
4. **Word mode**: For very fast readers, use word-by-word mode instead

## Customization Options

```tsx
// Character by character (default)
<TypewriterText text={npcResponse} speed={20} />

// Word by word (faster feel)
<TypewriterText text={npcResponse} wordMode={true} speed={50} />

// With typing cursor
<TypewriterText text={npcResponse} showCursor={true} />

// Slower for dramatic effect
<TypewriterText text={npcResponse} speed={40} />
```

## Mobile Considerations
- Touch to complete works same as click
- Consider slightly faster speed on mobile (users expect quicker interactions)
- Test on actual devices as perceived speed varies by screen size