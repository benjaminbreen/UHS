```text
██    ██ ███    ██ ██ ██    ██ ███████ ██████  ███████  █████  ██
██    ██ ████   ██ ██ ██    ██ ██      ██   ██ ██      ██   ██ ██
██    ██ ██ ██  ██ ██ ██    ██ █████   ██████  ███████ ███████ ██
██    ██ ██  ██ ██ ██  ██  ██  ██      ██   ██      ██ ██   ██ ██
 ██████  ██   ████ ██   ████   ███████ ██   ██ ███████ ██   ██ ███████

██   ██ ██ ███████ ████████  ██████  ██████  ██    ██
██   ██ ██ ██         ██    ██    ██ ██   ██  ██  ██
███████ ██ ███████    ██    ██    ██ ██████    ████
██   ██ ██      ██    ██    ██    ██ ██   ██    ██                 v.02
██   ██ ██ ███████    ██     ██████  ██   ██    ██             Feb 2026

███████ ██ ███    ███ ██    ██ ██       █████  ████████  ██████  ██████
██      ██ ████  ████ ██    ██ ██      ██   ██    ██    ██    ██ ██   ██
███████ ██ ██ ████ ██ ██    ██ ██      ███████    ██    ██    ██ ██████
     ██ ██ ██  ██  ██ ██    ██ ██      ██   ██    ██    ██    ██ ██   ██
███████ ██ ██      ██  ██████  ███████ ██   ██    ██     ██████  ██   ██
```

An educational history game and experiment in pushing the limits of LLM's historical fiction ability that was built by a history professor using AI coding tools (mostly Claude Code). You play as a historical person, either someone you choose or a procedurally generated figure (a merchant, a peasant, a scholar, or a range of other professions) navigating daily life in a specific time and place.

This is an ongoing personal project, not a polished product. The code reflects that. It is really buggy in parts, and filled with technical debt - fair warning! 

---

## What This Project Is

Universal History Simulator is a historically grounded educational simulation with some gamified systems and a a pixel art aesthetic built by a professional historian who loved SNES RPG games as a kid. That said, it is not really a game. I actively use this as an educational tool in my classrooms. 

The core thing to stress about this at the outset is that these simulations will NEVER be fully accurate, and they often fail to reflect reality in myriad ways. That's partly the point. Those failure modes are precisely what is teachable and interestign about this, however. When I use this tool in class activities, I explain to students that they will encounter anachronisms and errors and ask them to track the ways the simulation breaks down. Students then research those issues and (ideally) gain a more targeted, specific, and customized understanding of the past by fact checking and researching what are often very esoteric mistakes (was sugar grown in 4th century East Africa? Would the profession of "porcelain maker" have existed in 11th century Mongolia?)  

Another thing I have found interesting about this app's failure modes is what it reveals about LLMs and how they "think" about history. LLMs generating historical scenarios often have a sort of melancholic, heightened, quasi-fantastical tone that I think reflects their training data's rootedness in hitorical fan fiction corpora (in fact, the very first transformer models were partially trained on historical fan fiction, so this goes deep). They struggle to maintain historical realism and authenticity. That said, these models are also capable of wielding considerable multilingual erudition about obscure and archaic terms or objects from the past, and will sometimes surprise you. 

Core focus:
- Historically plausible world generation (time, place, culture, constraints)
- Character-driven simulation (stats, inventory, disease, social dynamics)
- LLM-assisted scenario setup and narration (constrained by geography/era data)
- Educational instrumentation (logs, journal, assessment-oriented systems)

--- 

## ⚙️ Core Mechanics (The below is an AI-written summary - may, and probably does, contain errors and out-of-date info)

1. **World generation**
- Procedural map generation in `generation/standardMap/standardMapGenerator.ts`
- Geography source of truth in `constants/gameData/geography.ts`
- Adjacency + liminal transitions in `constants/gameData/adjacencies.ts`

2. **Simulation loops**
- Main loop in `hooks/useCoreLoops.ts`
- Handles time progression, movement consequences, weather/disease hooks, NPC/animal updates, and map-edge traversal checks

3. **Game modes and events**
- Event/mode engine in `hooks/useEventSystem.ts` + `services/eventService.ts`
- Game mode influences event selection and progression logic

4. **WorldWeaver (scenario generation)**
- Natural-language prompt -> constrained historical scenario
- Service: `services/worldWeaverService.ts`
- Entry paths:
  - Splash page path: `components/GameSplashPage.tsx`
  - In-game (top nav bar text entry box) path: `components/TopNavBarPolished.tsx`

5. **HistoryLens (narrative/action interface)**
- Panel: `components/HistoryLensPanel.tsx`
- LLM response + action routing:
  - `services/historyLensService.ts`
  - `services/historyLensActionRouter.ts`
  - `services/historyLensEntryService.ts`

---

##  Runtime Architecture

### Routes (`App.tsx`)
- `/` -> `GameSplashPage`
- `/start` -> `GameSplashPage`
- `/home` -> `GameSetupScreen` (legacy)
- `/:year/*` -> main runtime

### Provider stack (`App.tsx`)
`GameProvider -> PlayerProvider -> MapProvider -> UIProvider`

### Context responsibilities
- `GameContext` (`hooks/useGameState.ts`): clock/date, logs/journal, zone/region, loading flags
- `PlayerContext` (`hooks/usePlayerState.ts`): character, stats, inventory/equipment, movement mode/position
- `MapContext` (`hooks/useMapState.ts`): map generation/cache, transitions, special maps, world coordinates
- `UIContext` (`hooks/useUIState.ts`): modals/panels, central view mode, UI interaction state

---

##  Startup + Session Boot Flow

```text
BrowserRouter (index.tsx)
  -> App routes (App.tsx)
    -> parse startup inputs:
       1) pending saved game handoff (localStorage)
       2) shareable URL ?state=...
    -> validate/repair scenario state
    -> apply generation guards (avoid duplicate world generation)
    -> call one:
       - onStartNewWorldAtLocation(...)
       - onStartNewWorldAtZoneRegion(...)
    -> App-level scenario modals:
       - WorldWeaverModal
       - InitialScenarioModal
```

---

## 🗺️ Core File Map

```text
.
├── App.tsx
├── index.tsx
├── contexts/
│   ├── GameContext.tsx
│   ├── PlayerContext.tsx
│   ├── MapContext.tsx
│   └── UIContext.tsx
├── hooks/
│   ├── useGameState.ts
│   ├── usePlayerState.ts
│   ├── useMapState.ts
│   ├── useUIState.ts
│   ├── useCoreLoops.ts
│   └── useEventSystem.ts
├── generation/
│   ├── standardMap/
│   └── specialMap/
├── services/
│   ├── worldWeaverService.ts
│   ├── historyLensService.ts
│   ├── historyLensActionRouter.ts
│   ├── eventService.ts
│   ├── assessmentService.ts
│   └── saveGameService.ts
├── constants/
│   └── gameData/
│       ├── geography.ts
│       └── adjacencies.ts
├── types/
└── tests/
```

---

## 🛠️ Local Development

### Prereqs
- Node.js 18+ (recommended)
- npm

### Install + run
```bash
npm install
npm run dev
```

### Build + test
```bash
npm run build
npm test
```

### Environment variables
The project has mixed historical env conventions; these are the important ones:

- `GEMINI_API_KEY`
  - Mapped by Vite (`vite.config.ts`) into:
    - `process.env.API_KEY`
    - `process.env.GEMINI_API_KEY`
  - Used by WorldWeaver, HistoryLens, event/narrative services
- `VITE_RUNWARE_API_KEY` (optional; image generation path)
- Supabase/R2 keys are optional unless you are using those data/storage paths

See `.env.example` for template keys.

---

## 📦 NPM Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview built app
- `npm test` - run Vitest
- `npm run test:ui` - open Vitest UI
- `npm run test:coverage` - run coverage
- `npm run check:circular` - circular dependency check (best-effort)

---

## 🚧 Current Reality

- Some systems are mature (procedural map generation, core loops, scenario setup).
- Some systems are partial or unevenly integrated (especially parts of quests/UI surfacing).
- Educational features exist and are meaningful, but not always front-and-center in UX.

---

## 🤝 Contributing

Open to all ideas.

---

## 👤 About

Built by Benjamin Breen, historian at UC Santa Cruz. I used Claude Code and GPT-5 to write this code pretty much in its entirety - I am, I freely admit, a vibe coder! 

License: MIT
