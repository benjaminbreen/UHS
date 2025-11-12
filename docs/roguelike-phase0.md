# Roguelike Ruins Refactor – Phase 0 Deliverables

This document captures the agreed-upon guardrails and technical scaffolding for the ruins roguelike refactor. All decisions respect the requirement that shared game systems (primary source shards, language tables, etc.) remain untouched; every change described below is scoped to the roguelike module or new supplemental assets.

---

## 1. Design Tenets (Finalized)
- **Historically Plausible by Default**  
  All procedurally generated content must trace back to curated data or validated LLM output. When a fallback is used, the UI makes that explicit.
- **Agency-First Gameplay**  
  Discoveries, translations, and encounters are driven by player choices (expedition deck, room actions) rather than passive triggers. Story moments earn their reveal.
- **Surgical Integration**  
  The refactor introduces a roguelike-only data bridge and state slices that consume existing services without mutating them, guaranteeing zero regressions for other features.
- **Deterministic & Observable**  
  Every run can be replayed by seed; metrics and logs reveal LLM reliability, player flow, and discovery quality in real time.
- **Author-Friendly**  
  Designers add or tweak ruins content through schema-validated supplemental files and preview tools—no need to touch React or global datasets.

---

## 2. Roguelike Data Bridge Schema (Approved)

### 2.1 File Layout
```
generation/ruins/data/
├── scripts.json             # Supplemental script metadata (roguelike only)
├── artifactTemplates.json   # Artifact + room mappings
├── discoveryTemplates.json  # Curated discovery scaffolds per room/era
├── expeditionCards.json     # Deck definitions
└── index.d.ts               # Shared TypeScript interfaces
services/
└── ruinsDataBridge.ts       # Read-only adapter over existing shards + supplements
```

### 2.2 Core Interfaces
```ts
export interface RuinScriptMetadata {
  id: string;                         // e.g. "quipu"
  displayName: string;                // "Quipu Cord Records"
  writingMedium: 'textile' | 'stone' | 'metal' | 'parchment' | 'oral';
  culturalZones: CulturalZone[];
  eras: HistoricalEra[];
  notes?: string;
  fallbackLanguageId?: string;        // Optional pointer to existing ERA_LANGUAGES entry
}

export interface ArtifactTemplate {
  id: string;
  label: string;                      // "Feathered Headdress"
  description: string;
  structureTypes: string[];           // ['temple', 'fortress']
  rooms: string[];                    // ['altar', 'treasury']
  culturalZones: CulturalZone[];
  eras: HistoricalEra[];
  educationalFocus: 'ritual' | 'governance' | 'economy' | 'daily_life';
  primarySourceRefs?: PrimarySourceRef[];
}

export interface PrimarySourceRef {
  shard: string;                      // e.g. "south-america-antiquity"
  sourceId: string;                   // Matches metadata JSON entry
  usage: 'discovery' | 'encounter' | 'translation';
}

export interface DiscoveryTemplate {
  id: string;
  room: string;                       // 'altar', 'library', etc.
  structureTypes: string[];
  culturalZones: CulturalZone[];
  eras: HistoricalEra[];
  scriptedElements: string[];         // Key facts the LLM must include
  recommendedArtifacts: string[];     // ArtifactTemplate ids
  knowledgeTags: string[];            // Ties into knowledge meter
}
```

### 2.3 Bridge Responsibilities
- Resolve supplemental metadata and join it with existing shards by cultural zone + era.
- Provide convenience methods (`getScriptsForContext`, `getArtifactSet`, `getDiscoveryTemplate`) without mutating global data.
- Expose contextual payloads for dossier generation while caching lookups locally.

---

## 3. Validation & Author Tooling
- **CLI (`scripts/validate-ruins-data.ts`)**  
  - Checks supplemental JSON against `index.d.ts`.  
  - Confirms referenced primary source IDs exist by reading shard files (read-only).  
  - Validates chronological sanity (artifact eras encompass discovery templates, etc.).  
  - Outputs a diff-style report listing missing data or overlapping definitions.
- **Author Preview (Storybook/Playground)**  
  - Loads the data bridge with mock map context.  
  - Displays assembled dossiers, candidate discoveries, and linked primary sources.  
  - Flags when fallbacks would trigger so authors can fill gaps before release.
- **Content Checklist**  
  - Every new ruin archetype requires: ≥1 discovery template, ≥2 artifact templates, ≥1 expedition card, and at least one linked primary source ref.

---

## 4. Baseline Instrumentation Plan

### 4.1 Observability Goals
- Measure run duration, floor depth reached, cards played, and discoveries completed.
- Track LLM usage: request counts, latency, schema validation success/failure, fallback rate.
- Capture player engagement with educational elements (time spent in terminal, quiz accuracy).

### 4.2 Event Map
| Event ID | Payload | Emitted From | Notes |
|----------|---------|--------------|-------|
| `ruins.run.start` | `{ seed, dossierId }` | Roguelike entry point | Seed logged for replay |
| `ruins.run.end` | `{ durationMs, depth, knowledgeScore }` | On exit/death | Pairs with start event |
| `ruins.discovery.viewed` | `{ discoveryId, templateId, sourceType }` | DiscoveryTerminal mount | `sourceType`: `llm` \| `curated` |
| `ruins.llm.request` | `{ requestId, templateId, room, latencyMs, status }` | `historicalContentBroker` | `status`: `success` \| `fallback` \| `error` |
| `ruins.translation.completed` | `{ manuscriptId, success, attempts }` | TranslationLab | Measures educational challenge |
| `ruins.card.played` | `{ cardId, depth }` | Expedition deck system | Ties actions to outcomes |

Events will be broadcast via the existing `eventBus` and optionally forwarded to the wider analytics/logging stack if/when one lands. Default implementation records to a dedicated `ruinsMetricsStore` (simple in-memory array persisted to `localStorage` for QA).

### 4.3 Baseline Dashboard (QA use)
- `runsPerSession`, `avgRunDuration`, `medianLLMLatency`, `fallbackRate`, `knowledgeGainPerRun`.
- Export command (`npm run report:ruins`) collects local metrics and prints a concise table for manual testing.

### 4.4 Implementation Checklist
1. Introduce `services/ruinsMetricsService.ts` (singleton with `record(eventId, payload)` and `flush` helpers).
2. Wire `RoguelikeDisplayEnhanced` entry/exit to emit `ruins.run.start/end`.
3. Wrap LLM broker calls with timing and emit `ruins.llm.request`.
4. Instrument Discovery Terminal, Translation Lab, Expedition Deck hooks.
5. Add temporary console reporter gated by `process.env.NODE_ENV === 'development'`.

---

## 5. Open Questions
| Topic | Notes | Owner |
|-------|-------|-------|
| Metrics Storage Target | Should we persist beyond local QA (e.g., Supabase, analytics)? | TBD with platform team |
| Expedition Card Design | Final list of card archetypes & unlock rules | Gameplay design |
| Knowledge Meter Integration | How to surface new score in global UI without disrupting existing flows | UX + Integrations |

Once these items are resolved, we can move directly into Phase 1 (data bridge implementation + dossier generator).
