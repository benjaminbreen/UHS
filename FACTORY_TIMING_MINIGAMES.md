# Factory Timing Minigames - Design Document

## Philosophy

Factory work is ALL about timing:
- **Textile mills**: Threading must happen in split-second windows when the loom shuttle passes
- **Steel mills**: Pouring molten metal requires precise timing or it solidifies
- **Assembly lines**: Parts must be installed in rhythm with the conveyor
- **Railway workshops**: Riveting requires hitting while the metal is hot

These aren't arbitrary button-mashing - they simulate real industrial timing challenges.

---

## Minigame 1: Precision Timing (Looms, Riveting, Welding)

### Visual Design
```
┌─────────────────────────────────────────────────┐
│  RIVET THE PLATE - Hit when hot!               │
├─────────────────────────────────────────────────┤
│                                                 │
│      🔴═══════════════════════════🟢           │
│      ▼                                          │
│   ┌──┴──┐                                       │
│   │ HOT │  <-- Click when slider hits green!   │
│   └─────┘                                       │
│                                                 │
│   [████████████░░░░░] Temperature              │
│   Cooling fast! 3.2 seconds left               │
└─────────────────────────────────────────────────┘
```

### Mechanics
1. **Slider moves** from left to right across a bar
2. **Green zone** in the middle (represents perfect timing window)
3. **Temperature bar** drains (metal cooling, thread tension dropping, etc.)
4. **Player must click** when slider is in green zone
5. **One chance** per task - if you miss, task completes at reduced efficiency

### Implementation
```typescript
interface TimingMinigame {
  type: 'precision';
  sliderSpeed: number; // pixels per second (faster = harder)
  targetZoneStart: number; // 0-100 position
  targetZoneEnd: number; // 0-100 position
  timeLimit: number; // seconds before auto-fail
  taskContext: {
    verb: 'Rivet' | 'Thread' | 'Weld' | 'Pour';
    noun: 'the Plate' | 'the Bobbin' | 'the Seam' | 'the Ladle';
    urgencyMessage: 'Metal cooling!' | 'Thread slipping!' | 'Mold filling!';
  };
}
```

### Factory-Specific Variations

**Textile Mill - Threading the Bobbin**
- Fast slider (thread moves quickly through loom)
- Medium green zone
- 2 seconds to complete
- Context: "Thread the shuttle - catch it as it passes!"

**Steel Mill - Pour the Ladle**
- Slow slider (heavy ladle)
- Small green zone (precise pour needed)
- 5 seconds before metal hardens
- Context: "Pour molten steel - hit the mold perfectly!"

**Railway Workshop - Rivet the Plate**
- Medium slider
- Small green zone (rivet must be hit while hot)
- 3 seconds before metal cools
- Context: "Hammer the rivet - strike while red-hot!"

### Scoring
```typescript
const hitPosition = sliderPosition; // 0-100
const targetCenter = (targetZoneStart + targetZoneEnd) / 2;
const deviation = Math.abs(hitPosition - targetCenter);

if (deviation === 0) {
  // PERFECT HIT
  outputBonus = 1.5;
  fatigueReduction = 0.8;
  message = "⭐ PERFECT! Expert timing!";
} else if (deviation <= 5) {
  // GREAT HIT
  outputBonus = 1.3;
  fatigueReduction = 0.9;
  message = "✓ Great timing!";
} else if (hitPosition >= targetZoneStart && hitPosition <= targetZoneEnd) {
  // GOOD HIT
  outputBonus = 1.1;
  fatigueReduction = 1.0;
  message = "✓ Good enough";
} else {
  // MISS
  outputBonus = 0.7;
  fatigueMultiplier = 1.3;
  message = "✗ Missed! Had to redo the work";
}
```

---

## Minigame 2: Rhythm Timing (Assembly Lines, Packing, Sorting)

### Visual Design
```
┌─────────────────────────────────────────────────┐
│  INSTALL PARTS - Match the rhythm!             │
├─────────────────────────────────────────────────┤
│                                                 │
│   ⚙️  →  ⚙️  →  ⚙️  →  [ ? ]                  │
│                         ▲                       │
│                    CLICK HERE!                  │
│                                                 │
│   Last 3 parts: 1.2s  1.3s  1.1s               │
│   Average: 1.2s per part                        │
│                                                 │
│   Parts installed: ██████░░░░ (6/10)           │
└─────────────────────────────────────────────────┘
```

### Mechanics
1. **Parts appear** at regular intervals on a conveyor
2. **Player must click** to install each part
3. **Rhythm is established** - must maintain consistent timing
4. **Too fast**: Part not ready yet, wasted effort
5. **Too slow**: Conveyor moves past, miss the part
6. **Just right**: Part installed smoothly

### Implementation
```typescript
interface RhythmMinigame {
  type: 'rhythm';
  bpm: number; // beats per minute (factory conveyor speed)
  targetCount: number; // how many parts to install
  toleranceMs: number; // ±200ms is acceptable timing
  showRhythmHelp: boolean; // visual metronome for first 2 beats
}
```

### Factory-Specific Variations

**Automobile Factory - Install Parts**
- 60 BPM (1 part per second)
- Install 10 parts
- ±200ms tolerance
- Context: "Install engine components as they arrive on the line"

**Electronics Factory - Solder Joints**
- 90 BPM (faster, smaller components)
- Solder 15 joints
- ±150ms tolerance
- Context: "Solder each joint as the board moves through"

**Textile Mill - Package Cloth Bolts**
- 75 BPM
- Package 8 bolts
- ±250ms tolerance
- Context: "Wrap each bolt as it comes off the loom"

### Scoring
```typescript
let perfectCount = 0;
let goodCount = 0;
let missedCount = 0;

for (const click of playerClicks) {
  const expectedTime = baseTime + (beatInterval * beatIndex);
  const deviation = Math.abs(click.time - expectedTime);

  if (deviation <= 50) {
    perfectCount++;
    score += 10;
  } else if (deviation <= toleranceMs) {
    goodCount++;
    score += 5;
  } else {
    missedCount++;
    score -= 2;
  }
}

const successRate = (perfectCount + goodCount) / targetCount;

if (successRate >= 0.9) {
  outputBonus = 1.4;
  message = "⭐ Perfect rhythm! You're a natural!";
} else if (successRate >= 0.7) {
  outputBonus = 1.2;
  message = "✓ Good rhythm, kept up with the line";
} else if (successRate >= 0.5) {
  outputBonus = 1.0;
  message = "Acceptable, but struggled to keep pace";
} else {
  outputBonus = 0.6;
  fatigueMultiplier = 1.4;
  message = "✗ Couldn't keep up! Slowed down the whole line";
}
```

---

## When to Use Which Minigame

### Precision Timing (Minigame 1)
**Use for**: Tasks requiring one precise action
- Threading (textile mill)
- Riveting (railway workshop, steel mill)
- Pouring molten metal (steel mill)
- Welding (automobile factory, steel mill)
- Hammering red-hot metal (any industrial metalwork)

**Characteristics**:
- **One-shot action**: Click once at the right moment
- **High stakes**: Miss = significant penalty
- **Visual feedback**: Clear "sweet spot" to hit
- **Real-world analog**: Catching a moving shuttle, striking while hot

### Rhythm Timing (Minigame 2)
**Use for**: Repetitive tasks on assembly lines
- Installing parts (automobile factory)
- Soldering (electronics factory)
- Packaging (textile mill, any factory)
- Quality inspection (any factory)
- Sorting components (electronics, any factory)

**Characteristics**:
- **Repeated action**: Click 10-15 times in rhythm
- **Flow state**: Good rhythm feels satisfying
- **Cumulative scoring**: One miss doesn't ruin everything
- **Real-world analog**: Working in sync with conveyor belt

---

## Visual Polish

### Precision Timing Visual Elements
```typescript
// Animated slider with glow effect
const sliderGlow = sliderInGreenZone ? 'drop-shadow-lg drop-shadow-green-400' : '';

// Pulsing target zone when close
const targetPulse = Math.abs(sliderPosition - targetCenter) < 10
  ? 'animate-pulse scale-110'
  : '';

// Temperature/urgency visualization
const urgencyColor = timeRemaining < 1 ? 'text-red-500' :
                     timeRemaining < 2 ? 'text-orange-400' :
                     'text-yellow-300';

// Success particle burst
if (perfect) {
  showParticles('⭐', sliderPosition, 10); // 10 star particles
}
```

### Rhythm Timing Visual Elements
```typescript
// Conveyor belt animation (CSS)
.conveyor-belt {
  background: repeating-linear-gradient(
    90deg,
    #444 0px,
    #444 20px,
    #555 20px,
    #555 40px
  );
  animation: scroll 2s linear infinite;
}

@keyframes scroll {
  0% { background-position: 0 0; }
  100% { background-position: 40px 0; }
}

// Part arrival indicator (flashes when part is ready)
const partReady = Math.abs(currentTime - nextPartTime) < 200;
const readyIndicator = partReady
  ? 'ring-4 ring-green-400 animate-ping'
  : '';

// Rhythm helper (first 2 beats only)
if (showRhythmHelp && beatIndex < 2) {
  <div className="absolute top-0 animate-bounce">
    <div className="text-4xl">👇 CLICK!</div>
  </div>
}
```

---

## Audio Integration

### Precision Timing Sounds
- **Slider moving**: Subtle mechanical whir (increases pitch as it moves)
- **Entering green zone**: Light "ding" sound
- **Perfect hit**: Satisfying metallic "CLANG" + success chime
- **Miss**: Dull "thunk" + error buzz

### Rhythm Timing Sounds
- **Background**: Conveyor belt mechanical hum (sets the beat)
- **Part arriving**: Subtle "click" sound (metronome)
- **Successful install**: Quick "snap" sound
- **Perfect rhythm streak**: Musical notes that harmonize
- **Missed beat**: Discordant note

---

## Component Structure

### New Components to Create
```
components/factory/minigames/
├── PrecisionTimingGame.tsx      (Minigame 1)
├── RhythmTimingGame.tsx         (Minigame 2)
└── MinigameContainer.tsx        (Wrapper with results)
```

### Integration with FactoryWorkTab
```typescript
// When task with timing requirement starts
if (task.requiresTimedAction) {
  if (task.timingType === 'precision') {
    setActiveMinigame({
      type: 'precision',
      taskContext: getTaskContext(task),
      onComplete: (score) => {
        applyTimingBonus(score);
        completeTask(task);
      }
    });
  } else if (task.timingType === 'rhythm') {
    setActiveMinigame({
      type: 'rhythm',
      bpm: task.rhythmBPM,
      targetCount: task.rhythmCount,
      onComplete: (score) => {
        applyTimingBonus(score);
        completeTask(task);
      }
    });
  }
}
```

---

## Task Configuration Updates

Add timing properties to FactoryTask interface:
```typescript
interface FactoryTask {
  // ... existing properties
  requiresTimedAction?: boolean;
  timingType?: 'precision' | 'rhythm';

  // Precision timing config
  precisionConfig?: {
    sliderSpeed: number;
    targetZoneSize: 'small' | 'medium' | 'large';
    timeLimit: number;
  };

  // Rhythm timing config
  rhythmConfig?: {
    bpm: number;
    targetCount: number;
    toleranceMs: number;
  };
}
```

### Example Task Definitions
```typescript
// Textile mill - Threading
{
  id: 'thread_bobbin',
  name: 'Thread Bobbin',
  requiresTimedAction: true,
  timingType: 'precision',
  precisionConfig: {
    sliderSpeed: 80, // fast
    targetZoneSize: 'medium',
    timeLimit: 2
  }
}

// Automobile factory - Install parts
{
  id: 'install_engine',
  name: 'Install Engine Parts',
  requiresTimedAction: true,
  timingType: 'rhythm',
  rhythmConfig: {
    bpm: 60,
    targetCount: 10,
    toleranceMs: 200
  }
}
```

---

## Why These Minigames Work

1. **Precision Timing** = High-stakes, one-shot industrial actions
   - Simulates: "Strike while the iron is hot"
   - Teaches: Importance of split-second timing in dangerous work
   - Feels: Tense, focused, rewarding when successful

2. **Rhythm Timing** = Monotonous, repetitive assembly line work
   - Simulates: Keeping pace with machinery
   - Teaches: How soul-crushing repetitive work can be
   - Feels: Meditative at first, then exhausting

Both are **historically accurate** and **educationally valuable** while being **fun to play**.
