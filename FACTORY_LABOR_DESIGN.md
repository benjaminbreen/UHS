# Factory Labor Simulator - Design Document

## Core Concept
A hybrid visual task board + rhythm game where players experience historical factory work through pre-coded tasks and events, enhanced by selective LLM integration for personalization and narrative depth.

## System Architecture

### 1. Pre-Coded Task Cards (No LLM)

Each factory type has 8-12 base task types. Tasks are objects with:
```typescript
{
  id: string,
  name: string,
  icon: string,
  duration: number, // minutes (5-30)
  quotaValue: number, // how much this adds to quota
  fatigueeCost: number,
  healthRisk: number, // 0-10, chance of injury
  requiresSkill: boolean, // if true, has timing element
  description: string
}
```

**Factory-Specific Task Libraries:**

**Textile Mill (1780-1920)**
- Thread Bobbin (5min, +2 quota, -5 fatigue, low risk)
- Operate Loom (10min, +5 quota, -10 fatigue, medium risk)
- Tie Broken Thread (3min, +1 quota, -3 fatigue, low risk)
- Replace Shuttle (8min, +3 quota, -7 fatigue, medium risk)
- Package Cloth (7min, +4 quota, -6 fatigue, low risk)
- Clean Lint Trap (5min, +0 quota, -4 fatigue, high risk - fire prevention)
- Repair Loom Belt (15min, +0 quota, -15 fatigue, high risk)
- Fetch Water (5min, +0 quota, -8 fatigue, low risk)

**Steel Mill (1850-1950)**
- Pour Ladle (10min, +8 quota, -15 fatigue, very high risk)
- Load Furnace (8min, +5 quota, -12 fatigue, high risk)
- Clear Slag (6min, +3 quota, -10 fatigue, high risk)
- Check Temperature (4min, +2 quota, -5 fatigue, medium risk)
- Move Ingots (7min, +4 quota, -11 fatigue, medium risk)
- Repair Tongs (10min, +0 quota, -8 fatigue, low risk)
- Shovel Coal (12min, +6 quota, -18 fatigue, low risk)
- Clean Work Area (5min, +0 quota, -6 fatigue, low risk)

**Automobile Assembly (1910-2020)**
- Install Engine Part (8min, +6 quota, -8 fatigue, low risk)
- Tighten Bolts (5min, +4 quota, -6 fatigue, low risk, REQUIRES_SKILL)
- Weld Joint (12min, +8 quota, -12 fatigue, high risk)
- Inspect Quality (6min, +3 quota, -5 fatigue, low risk)
- Move Chassis (10min, +5 quota, -14 fatigue, medium risk)
- Fetch Parts (4min, +0 quota, -7 fatigue, low risk)
- Clean Station (5min, +0 quota, -5 fatigue, low risk)
- Adjust Tooling (7min, +0 quota, -6 fatigue, low risk)

**Chemical Refinery (1800-2020)**
- Mix Compounds (15min, +10 quota, -10 fatigue, very high risk)
- Monitor Gauges (5min, +2 quota, -4 fatigue, medium risk, REQUIRES_SKILL)
- Transfer Barrels (8min, +5 quota, -12 fatigue, high risk)
- Clean Vats (20min, +0 quota, -20 fatigue, very high risk)
- Take Samples (4min, +2 quota, -3 fatigue, low risk)
- Adjust Valves (6min, +3 quota, -5 fatigue, medium risk)
- Record Readings (3min, +1 quota, -2 fatigue, low risk)
- Seal Containers (7min, +4 quota, -6 fatigue, low risk)

**Sugar Refinery (1750-1900)**
- Pour Sugar into Molds (8min, +6 quota, -10 fatigue, high risk - burns)
- Stir Boiling Syrup (10min, +5 quota, -12 fatigue, very high risk)
- Remove Loaves from Molds (5min, +4 quota, -7 fatigue, medium risk)
- Crush Sugar Cane (15min, +8 quota, -18 fatigue, high risk)
- Carry Sugar Sacks (6min, +3 quota, -14 fatigue, medium risk)
- Clean Boiling Pans (12min, +0 quota, -15 fatigue, very high risk)
- Stack Barrels (7min, +4 quota, -9 fatigue, medium risk)
- Fetch Firewood (5min, +0 quota, -8 fatigue, low risk)

### 2. Pre-Coded Event Cards (No LLM)

Events are triggered probabilistically each hour. Types:

**Mechanical Events (30% chance per hour)**
- Machine Breakdown: Lose 10 min + task to fix, or lose 30 min waiting for supervisor
- Belt Snaps: Immediate repair needed (15min task) or production stops
- Tool Shortage: Work slower (tasks take 1.5x time) or wait for resupply
- Power Failure: All work stops for 10 minutes
- Equipment Jam: Clear it (quick timing mini-game) or call supervisor

**Injury Events (15% chance per hour, higher if fatigued)**
- Co-worker Injured: Help (lose 20min, +trust) or Continue (no time loss, -trust)
- Finger Caught: Take 5 damage, -10 fatigue (recovery), continue or rest?
- Burns (Chemical/Steel): Take 10 damage, must rest 15 minutes
- Cut/Scrape: Take 3 damage, -5 fatigue, can continue
- Heat Exhaustion: Take 8 damage, must rest 10 minutes

**Supervisor Events (20% chance per hour)**
- Inspection: Pass if quota >50% for current hour, fail = warning
- Quota Pressure: "Speed up!" - tasks spawn faster for next hour
- Quality Check: Pass if recent tasks done carefully, fail = dock 20% wages
- Discipline: If trust <40, warning or threat of firing
- Praise: If trust >70 and quota >80%, small wage bonus

**Social Events (10% chance per hour)**
- Union Organizer: Talk (+interest in organizing) or Ignore (safe)
- Wage Dispute: Protest (risk firing, +solidarity) or Accept (safe, -morale)
- Break Time Request: Ask for break (risk supervisor anger) or Continue (fatigue++)
- Co-worker Chat: Listen (small morale boost, -2min) or Ignore
- Theft Accusation: Defend yourself or accept blame

**Hazard Events (15% chance per hour, varies by factory)**
- Fire Risk: Evacuate (-30min) or Try to Extinguish (timing game, risk damage)
- Gas Leak (Chemical): Evacuate immediately (safe) or Continue (heavy damage)
- Cave-in Risk (Foundry): Stop work or risk injury
- Flood: Clear drain or lose production
- Electrical Hazard: Report it (-10min) or Work Around (risk)

### 3. Rhythm/Timing Elements (Concept 1)

**Tasks marked REQUIRES_SKILL have timing bar:**
```
Task Active: Tighten Bolts
[████████████|═══════════]
         CLICK HERE! ↑
         (green zone)
```

- Perfect hit (in green): +2 quota, +quality
- Good hit (near green): +1 quota
- Miss: +0 quota, -quality, possible injury

**Urgent Tasks spawn with countdown:**
```
⚠️ URGENT: Machine Overheating!
[Adjust Valve NOW - 30 seconds]
```

### 4. LLM Integration Points (4 per shift)

**A. Shift Start (LLM Call #1)**
```
Input: Factory type, era, location, player reputation
Output: Opening scene + supervisor introduction
Example: "You arrive at the Lowell Textile Mills on a frigid January morning, 1845.
Overseer Hiram Carter eyes you coldly. 'You're late. Get to loom #17 immediately.'"
```

**B. Custom Event #1 (Hour 4-6, LLM Call #2)**
```
Input: Factory context, current performance stats, historical era
Output: Unique situation requiring text response
Example: "A child worker collapses near your station. The overseer hasn't noticed.
What do you do?"
Player types response → LLM evaluates → outcome
```

**C. Custom Event #2 (Hour 8-10, LLM Call #3)**
```
Input: Previous choices, performance, trust level
Output: Another unique dilemma
Example: "Your machine is producing defective output. You could hide it and maintain
quota, or report it and fall behind. What do you do?"
```

**D. Shift End Assessment (LLM Call #4)**
```
Input: Full shift stats (quota, quality, injuries, trust, choices made)
Output: Supervisor evaluation + consequences
Example: "Overseer Carter approaches. 'You made quota, but I saw you helping that
child. We're here to work, not play nursemaid. One more incident and you're done.'"
```

**LLM Integration via NPCToast Pattern:**
- Uses existing `generateFarmerDecision()` or similar function
- Passes performance object to LLM
- Returns dialogue + trust adjustment + consequences

### 5. Performance Tracking System

```typescript
ShiftStats {
  // Quota & Production
  quotaCompleted: number, // 0-100
  quotaTarget: number, // typically 100
  tasksCompleted: number,
  tasksFailed: number,
  qualityScore: number, // 0-100, average of all task quality

  // Health & Safety
  health: number, // starts at 100
  fatigue: number, // starts at 0, max 100
  injuries: number, // count
  injuryDescriptions: string[], // for narrative

  // Social & Economic
  trust: number, // 0-100, supervisor trust/reputation
  wageEarned: number, // calculated at end
  wageDocked: number, // penalties

  // Time
  hour: number, // 0-12 (shift length)
  minutesWorked: number,

  // Choices
  helpedCoworkers: number,
  refusedDangerousTasks: number,
  unionActivity: number,

  // Events
  eventsTriggered: string[],
  llmEventResponses: { question: string, response: string, outcome: string }[]
}
```

### 6. Shift Flow

```
SHIFT START
↓
[LLM] Opening Scene + Supervisor Intro
↓
HOUR 1-3: Regular Tasks + Random Events
- Player selects from 3-4 available task cards
- Tasks auto-complete after duration
- Random events can interrupt
- Quota pressure increases gradually
↓
HOUR 4-6: [LLM] Custom Event #1
- Mid-shift challenge
- Player types text response
- LLM evaluates and applies outcome
↓
HOUR 7-9: Regular Tasks + Increased Pressure
- Task spawn rate increases
- More injuries/breakdowns
- Supervisor inspections more frequent
↓
HOUR 9-10: [LLM] Custom Event #2
- Late-shift dilemma
- Tests accumulated choices
↓
HOUR 11-12: Final Push
- Quota check
- Last chance events
↓
SHIFT END
↓
[LLM] Supervisor Assessment
- Wage calculation
- Trust adjustment
- Narrative conclusion
- Option to work another shift
```

### 7. UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Cotton Mill, Lowell MA, 1845]    Hour: 3/12    $0.45  │
│ ⏰ 08:47 AM  │  Quota: ████████░░░░ 67/100              │
├─────────────────────────────────────────────────────────┤
│ ❤️ Health: ████████░░ 85/100   😴 Fatigue: ███░░░░░░ 35 │
│ ⭐ Trust: ██████░░░░ 6/10      💰 Wage: $0.45 (+bonus?) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Available Tasks (click to start):                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 🧵 Thread │  │ 🪡 Operate│  │ 📦 Package│             │
│  │  Bobbin  │  │   Loom   │  │   Cloth  │             │
│  │          │  │          │  │          │             │
│  │ 5 min    │  │ 10 min   │  │ 7 min    │             │
│  │ +2 quota │  │ +5 quota │  │ +4 quota │             │
│  │ -5 ⚡    │  │ -10 ⚡   │  │ -6 ⚡    │             │
│  │ 🎯 Timing│  │          │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  Active Task: Operating Loom #17                       │
│  [████████████░░░░░░░░] 8min remaining                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  💬 Overseer Carter:                                   │
│  "Keep that pace up. Quota's behind for the morning."  │
│                                                         │
│  📜 Recent Events:                                      │
│  ✓ Completed: Thread Bobbin (+2 quota)                │
│  ⚠️ Warning: Machine vibrating - may break soon        │
└─────────────────────────────────────────────────────────┘
```

### 8. Difficulty & Balance

**Quota Targets by Era:**
- Early Industrial (1780-1850): 60-80 quota = full wage
- Late Industrial (1850-1920): 80-100 quota = full wage
- Modern (1920+): 100+ quota = keep job

**Injury Risk by Factory:**
- Textile: 2-3% per task
- Steel: 8-10% per task
- Chemical: 6-8% per task
- Assembly: 3-5% per task

**Trust System:**
- Start at 50/100
- Good performance: +5 per successful inspection
- Poor performance: -10 per failed quota
- Help co-workers: +5 but lose time
- Refuse dangerous task: -10 trust, +safety

### 9. Technical Implementation Notes

**Task Card System:**
```javascript
const FACTORY_TASKS = {
  'textile': [...],
  'steel': [...],
  'chemical': [...],
  // etc
};

function generateAvailableTasks(factoryType, hour) {
  const taskPool = FACTORY_TASKS[factoryType];
  // Return 3-4 random tasks from pool
  // Weight toward quota tasks early shift
  // Weight toward maintenance/cleanup late shift
}
```

**Event Triggering:**
```javascript
function checkForEvent(hour, stats) {
  const roll = Math.random();
  if (roll < 0.30) return triggerMechanicalEvent();
  if (roll < 0.45) return triggerInjuryEvent(stats.fatigue);
  if (roll < 0.65) return triggerSupervisorEvent(stats);
  if (roll < 0.75) return triggerSocialEvent();
  if (roll < 0.90) return triggerHazardEvent(factoryType);
  return null;
}
```

**LLM Call Points:**
```javascript
// Shift start
await generateSupervisorIntro(factoryType, era, location);

// Custom event (hours 4-6)
if (hour === 5 && !customEvent1Triggered) {
  const event = await generateCustomEvent(stats, context);
  // Show modal with text input
  const response = await getUserTextInput();
  const outcome = await evaluateResponse(event, response);
  applyOutcome(outcome);
}

// Similar for custom event 2

// Shift end
await generateSupervisorAssessment(stats);
```

### 10. Prototype Simplifications

For HTML prototype:
- Mock LLM responses (show where LLM would be called)
- 6-hour shift instead of 12 (faster testing)
- 3 factory types: Textile, Steel, Assembly
- Simplified injury system (just HP loss)
- Basic timing mini-game for skill tasks
- Pre-written LLM-style responses for testing

This design balances **pre-coded efficiency** (most tasks/events) with **LLM personalization** (opening, custom events, assessment), creating an engaging, educational, and historically authentic factory labor experience.
