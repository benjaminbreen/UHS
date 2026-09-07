# Universal History Simulator: design and implementation brief

Version 2 · 6 September 2026 · Implementation brief; revised after asset review and cultural-content planning

Current implementation and recommended next work are tracked in [PROGRESS.md](PROGRESS.md). The implemented settlement generator is described in [SETTLEMENTS.md](SETTLEMENTS.md). The accepted cultural-content direction is in [section 20](#20-cultural-content-families-and-dated-local-profiles); it is a design decision, not a claim of implemented world coverage.

## 1. What to build

Build a browser-based procedural historical world simulator, deployed on Vercel. A person describes a historical situation, receives a plausible playable character, and explores a persistent world of connected landscapes, settlements, interiors, people, animals, and objects. Geography should remain coherent as the player travels and zooms out. Historical sources should inform the world and be available for examination.

Example prompts include “Neolithic hunter,” “Brutus at the forum,” “Korean peasant, eighteenth century,” and “cosmonaut without much air left.” These express the eventual breadth of the project. They are not a claim that the first release can faithfully generate every environment or institution. The foundation must support expansion without making the initial build depend on universal coverage.

The experience should be open-ended. A player can spend a day herding, follow someone to work, hunt a small animal, trade, steal, investigate an unfamiliar object, or leave for another settlement. Interesting situations should emerge from geography, possessions, obligations, opportunities, and other actors pursuing their routines.

Use attractive pixel graphics whose design language can be consistently extended by LLM-authored pixel arrays and drawing recipes. Target visual richness between mockups 1 and 2, using their composition and interface as references. Prove original additions before adopting a visual family. The visual reference is a restrained top-down pixel game: readable terrain, repeated modular buildings, small animated people, and a quiet interface. Generated concept art is an aesthetic reference, not an asset-production promise.

Support two modes of the same game:

| Mode | Required behavior |
| --- | --- |
| Procedural | Complete playable simulation with seeded generation, rule-based actors, contextual actions, and template dialogue. No model API calls, account, or API key required. |
| LLM enhanced | The same simulation with natural-language interpretation, richer conversations, and occasional validated changes to circumstances. It remains playable when the model is unavailable. |

Both humans and external agents must be able to control a playable character through the same commands. The engine must run without a browser so it can support reproducible experiments and visual replays.

**Architectural priority: understandable code with explicit ownership.** Prefer a small number of ordinary TypeScript modules, plain data, and direct function calls. Add abstractions when working implementations demonstrate a need.

## 2. Starting point and boundaries

Use a fresh implementation. The existing repository, [benjaminbreen/UHS](https://github.com/benjaminbreen/UHS), is reference material for the concept, possible source records, and useful discoveries. Review licenses and provenance before selectively importing data. Do not import its application architecture or pursue feature parity.

The earlier review found a useful breadth of historical content and action ideas, but also tightly coupled UI and simulation, mixed rendering systems, fragile persistence, partly non-deterministic generation, and places where model narration could precede successful action execution. This design makes those concerns explicit.

The first public prototype should provide a small geographic region containing multiple generated settlements, navigable countryside, interiors, people with routines, and a complete day of ordinary activity. Each seed changes plausible local detail. The region is a reusable set of geographic and historical constraints; it does not prescribe a quest or a player route.

Use two first playable packs: a generated Roman town in the Tiber lowlands around 100 CE, and a generated Neolithic settlement in the Konya plain around 6500 BCE. Echo the two visual mockups without presenting invented neighborhoods as surveyed reconstructions. Settlement layouts, ecology, materials, routines, tools, exchange, and access should vary through content and explicit shared rules. Use the same engine and renderer for both. A future contrasting tropical South American pack remains a valuable further extensibility test, not a prerequisite for these two first scenes.

The product priority is dynamic, open-ended simulation. These two settings exercise a reusable foundation; do not optimize the architecture around recreating their particular streets. Expand supported content through resolved definitions and small justified mechanics. Explain unsupported settings honestly rather than pretending the engine already simulates every possible scenario.

The Roman Forum, Rome–Ostia corridor, and further travel toward Tuscany are later geographic integration targets. Exact named historical people, orbital environments, continental seamless walking, full political simulation, generational demography, and comprehensive historical economies are deferred. Keep these possibilities compatible with the design without building empty frameworks for them now.

## 3. Technology decisions

Use one repository and one application package initially. A monorepo, microservices, a custom ECS, and a generic plugin system would increase the maintenance burden before they solve a demonstrated problem.

| Concern | Decision | Reason and boundary |
| --- | --- | --- |
| Language and build | TypeScript with strict checking; React; Vite; npm lockfile | A familiar browser stack, with the same engine importable in Node. |
| World rendering | Phaser | Tile layers, sprites, camera, input, and animation. No authoritative simulation inside Phaser scenes. |
| Interface | React and ordinary CSS | Panels, dialogs, notebook, settings, and accessible controls. Avoid a second canvas-based UI framework. |
| Simulation | Project-owned TypeScript modules | Small explicit rules, integer simulation time, deterministic randomness. |
| Geographic preparation | Python and GDAL, run offline | Convert selected source data into small versioned regional assets. Never run heavy GIS inside a game request. |
| Background generation | One Web Worker with typed messages | Generate chunks away from the main thread. Keep generation functions usable synchronously in Node. Add Comlink only if it materially simplifies this bridge. |
| Browser saves | Dexie over IndexedDB | Local saves, caches, and exports without a backend requirement. |
| Boundary validation | Zod | Validate imported content, saves, API requests, and model outputs. Avoid validating every internal function call. |
| LLM integration | Vercel AI SDK and one provider adapter initially | Server-side credentials, structured responses, replaceable provider configuration. |
| Agent interface | Local Node runner, then official TypeScript MCP SDK | Both call the engine's existing player interface. MCP is a transport adapter. |
| Verification | Vitest and a small Playwright suite | Rules and determinism in Node; browser integration and playability in a real browser. |
| Deployment | Vercel static frontend and discrete server functions | Browser performs local simulation. Functions serve bounded optional model requests. |

The [official Phaser React/TypeScript template](https://github.com/phaserjs/template-react-ts) supplies an integration reference. Inspect its current dependencies before adopting it; its major versions have changed over time. Choose mutually compatible stable versions, lock them, and first prove a tile layer, sprite, camera, and production build. Remove unused demonstration code and optional template telemetry. Vercel documents [Vite deployment directly](https://vercel.com/docs/frameworks/frontend/vite).

[Dexie](https://dexie.org/docs) wraps browser IndexedDB. The [AI SDK](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) supports schema-constrained generation; schema validity alone does not establish that a proposed action is legal or historically supported. Use the [official MCP SDK documentation](https://modelcontextprotocol.io/docs/sdk) when implementing the adapter rather than freezing a transport revision from this document.

Do not require Supabase, PostGIS, a vector database, Redis, account management, or cloud synchronization for the first playable build. Add a Postgres-backed hosted session store only when remote agent sessions actually need durable server state. Larger regional asset collections can move to object storage when their measured size warrants it.

## 4. Module ownership

These are directory boundaries within the application, not separately published packages. Create modules as functionality lands; do not scaffold an empty subsystem for every future feature.

| Location | Owns | Must not own |
| --- | --- | --- |
| `src/core/` | State types, time, randomness, commands, rules, visibility, NPC behavior, observation projection | Browser APIs, React, Phaser, HTTP, model calls, storage |
| `src/world/` | Atlas queries, regional plans, chunk generation, settlement and interior generation | UI, player saves, model SDKs |
| `src/content/` | Content schemas, loaders, historical rule resolution, source references | Mutable actor state or rendering behavior |
| `src/runtime/` | Session orchestration, command serialization, loading, worker bridge, save boundaries | Duplicate game rules |
| `src/render/` | Phaser scenes, tile and sprite presentation, camera, animation | Ownership changes, NPC decisions, trade outcomes |
| `src/audio/` | Original scores, synthesis, transport, mixing and presentation-time audio selection | Simulation time advancement, inventory changes or cultural-authenticity claims inferred from a timbre |
| `src/dev/` | Graphics and audio review controls and isolated graphics fixtures | A second implementation of game rules or writes from graphics fixtures to playable saves |
| `src/ui/` | React panels, controls, accessibility, presentation state | A second copy of the simulation |
| `src/llm/` | Context assembly, proposal schemas, provider-neutral request contracts | Unvalidated mutation of world state |
| `api/` | Vercel handlers, secrets, model provider calls, request limits | A continuously running world loop |
| `src/agents/` | Headless player adapter, MCP tools, trajectory recording | Privileged information in player observations |
| `scripts/` | Data preparation, content validation, atlas export, experiment runners | Runtime dependence on a developer's local GIS installation |
| `public/packs/` | Versioned geographic, historical, and art assets | Executable scripts from downloaded content |

Share foundational types through a small leaf module inside `core`. Keep `core` independent of concrete content files and generation: it receives resolved definitions and loaded world data. `world` may import those types. `runtime` assembles these pieces and is responsible for obtaining required chunks before asking the core to advance.

The runtime owns one authoritative session. React subscribes to a small read-only player view. Phaser consumes the visible map and entity presentation data. Neither modifies the world directly. An ordinary subscription function is sufficient; a global event bus must not become a hidden mutation channel.

Keep transient UI state—open panel, hover, zoom, text being typed—outside saves and simulation hashes. Rendering and animations may use wall-clock time. Simulation rules may not.

## 5. Core state and command contract

Use plain serializable records with stable IDs. A small actor record with an optional animal behavior profile is enough initially; do not create deep inheritance hierarchies.

| Record | Minimum responsibility |
| --- | --- |
| World manifest | Seed; simulation, generator, save-schema, and content versions; geographic region; historical date; enabled rule capabilities |
| Session state | Simulation clock, command revision, dynamic entities, relationships, pending activities, random counters, loaded-area metadata |
| Actor | ID, position, role, household where relevant, possessions, needs, abilities, current activity, knowledge and memories |
| Object | ID, definition, location or container, quantity, condition, owner or stewardship relation |
| Place | ID, footprint, access points, interior link, known identity, historical claim references |
| Relationship | Directional familiarity/trust and explicit obligations or permissions where needed |
| Claim/source | Evidence supporting a historical assertion, its applicability and limitations |
| Event | What actually happened, when, participants, visibility, and resulting changes |

Separate possession, ownership, and access. Carrying an object does not necessarily mean owning it. Permission to accompany someone does not automatically grant access to their household or possessions. Permit communal and household ownership; do not force every resource into individual private property.

Start with a small command union: `move`, `wait`, `interact`, `use`, `transfer`, and `request`. `interact` can dispatch a short explicit set such as open, close, examine closely, and attempt capture. Add domain-specific commands when they clarify actual rules. Do not encode all gameplay as unrestricted strings or arbitrary JSON patches.

Keep observation separate from action. Reading the current view, checking an already known inventory, or reopening a source costs no simulated time. Looking closely under a rock, searching a bag, or examining an unfamiliar mechanism is an action and can consume time or require access.

The intended public shape is small. The following is an interface sketch, not a demand to copy these exact type names:

```ts
interface PlayerSession {
  observe(): PlayerObservation;
  inspect(targetId: string): Inspection;
  act(request: CommandRequest): CommandResult;
}

interface CommandRequest {
  actionId: string;
  expectedRevision: number;
  command: PlayerCommand;
}

interface CommandResult {
  actionId: string;
  revision: number;
  status: "completed" | "interrupted" | "rejected";
  elapsedSeconds: number;
  events: PlayerVisibleEvent[];
  observation: PlayerObservation;
  reason?: string;
}
```

Bind the player identity in the session adapter. An external caller cannot select another actor by supplying an arbitrary ID. Internal NPC decisions use the same action rules through an engine-owned identity.

For every accepted command: validate current preconditions, resolve the action with deterministic randomness where required, advance the relevant simulation time, commit effects, and derive the visible result from committed events. Failed attempts can be real actions with costs. Invalid requests such as an unknown ID or an impossible quantity are rejected without advancing time.

Duplicate action IDs return their original results. Reusing an ID with a different payload is an error. Stale revisions return a conflict and the current player view; they do not repeat the action. Track request receipts separately from world changes so failed requests can also be retried safely. Serializing commands in the local runtime is sufficient initially.

Do not narrate a successful trade, theft, or agreement until its authoritative effects have committed.

## 6. Time, uncertainty, and actor behavior

Use integer simulation seconds. Each action has an explicit duration, determined by distance, activity, and capabilities. A walking step can take a few seconds; a conversation can take minutes. Waiting and travel advance this same clock. Reading, typing, API latency, and browser frame rate never make the character hungry or move other actors.

Keep historical date conversion in one tested utility. Use astronomical year numbering internally if convenient, with year 0 displayed as 1 BCE; ordinary BCE/CE labels have no year zero. The first release can use a documented simplified seasonal calendar. Do not imply that its displayed calendar reproduces every local historical dating system.

Begin with a simple advancement loop and a bounded active population. During long activities, advance in manageable intervals and stop at relevant events: a blocked route, an animal escaping, an NPC withdrawing consent, a threat, or arrival. Rendering may interpolate movement between resolved positions without changing outcomes.

Player abilities influence concrete actions such as detecting movement, handling animals, carrying weight, or bargaining within plausible bounds. Avoid a universal experience-point system. Start with hunger, fatigue, and injury only where they produce useful choices; add further physiology when a supported setting requires it. An orbital survival pack will need explicit oxygen and environment rules later.

Use a documented seeded PRNG and stable seed derivation. Never use `Math.random()`, `Date.now()`, rendering order, network completion order, or object enumeration accidents for simulation outcomes. Give geographic generation and simulation independent random domains. Address local generation randomness by seed, feature ID, and purpose. Persist counters for random simulation decisions. Sorting active actors by stable ID makes update order explicit.

A repeated run with the same versions, initial state, commands, and recorded external inputs must reproduce the same state hashes. “Deterministic” permits seeded uncertainty. It does not mean every hunt succeeds or every person responds identically.

NPCs initially need a home or base, occupation, short daily routine, inventory, a few needs, and a current concern. Use explicit priorities such as immediate danger, essential needs, current commitment, then ordinary routine. Give people variation through sampled parameters and situated concerns. Do not call a model to decide each walking step.

Use compact state machines for animals: graze or rest, investigate, flee, regroup, and seek shelter where appropriate. Species data should affect these rules, rather than swapping a sheep sprite for a lizard.

Persist encountered actors by ID, never by matching them to whatever occupies an old tile. For the first release, simulate the player's neighborhood in detail; retain changed distant actors and catch them up using bounded schedule/need rules. Unvisited population can remain aggregate data until instantiated. Keep companion and pursuit groups active across chunk boundaries. Only explicit modeled events alter distant relationships or obligations.

This is an approximation. Record the active-area and catch-up policy as part of the simulation version, and use the same policy for human and headless runs. Agent behavior findings must not be presented as independent of this simplification.

## 7. Affordances and the first playable mechanics

Compute available actions from the current actor, target, reach, tools, knowledge, and permissions. Both the UI and agent observation receive this same contextual affordance list. It describes known options, not hidden success probabilities. The engine still validates every submitted action.

| Player intention | Smallest useful implementation | Consequences that must persist |
| --- | --- | --- |
| Herd sheep | Sheep graze, maintain loose flock cohesion, and move away from nearby pressure. The player positions themselves, uses a handling action if capable, guides animals through a gate, and closes it. | Individual animal positions, owner, enclosure state, escaped animals, and any completed request. |
| Hunt a lizard | Detect a small animal, approach, watch, attempt capture by hand or a suitable tool. Alertness, distance, cover, and skill affect the attempt. | Time and fatigue, prey relocation or capture, actual inventory transfer; no duplicate animal loot. |
| Follow someone | Request permission; the NPC can accept, decline, or set an endpoint. Follow their existing activity and stop when circumstances change. | Scope and expiry of consent, actual travel, introductions or withdrawals. |
| Steal | Take a reachable object without authorization. Resolve observation locally. An owner can discover a loss later. | Ownership remains distinct from possession, witnesses retain what they observed, suspicion has a stated basis, and restitution is possible. |
| Trade | Open an exact offer showing items and quantities on each side. A rule evaluates stock, needs, access, and an acceptable exchange. Confirm the displayed terms. | Atomic exchange: both sides change or neither does. Currency is optional and supplied by the setting. |

These mechanics share movement, perception, inventory, permissions, and time. They should not become five disconnected minigames.

Keep early exchange rules modest. Content can define useful goods, rough valuations, and whether bargaining, gifting, barter, or money is appropriate. Do not infer a complete economy from a price table. Debts, where supported, are explicit records with parties and terms; words in dialogue alone do not create enforceable obligations.

There is no omniscient crime meter. A witness knows an observed event; someone who finds an empty basket knows a loss, with any inference recorded separately. Initial social consequences can be refusal, confrontation, a request for return, or reduced trust. Implement elaborate legal institutions only with a relevant content pack and real gameplay need.

Free-form input proposes a command or a short plan composed of these affordances. “Help her take the sheep home” can become ask permission, follow, guide, and close a gate. Plans execute step by step, revalidate, and interrupt. The model cannot turn an unsupported request into a narrated success.

The player may choose their own purposes. An optional character concern—return borrowed equipment, feed a household, meet someone—can make the opening legible without imposing a quest chain. Ordinary routines should continue if the player ignores it.

## 8. Geography and scale

The current implementation and user-approved simplification are documented in [WORLDS.md](WORLDS.md). Use a compressed Earth atlas for recognizable coastlines and broad landforms, then generate evocative local detail. Exact GIS fidelity, per-feature citations, regional projection packages, and dated historical corrections are not prerequisites.

Both local keyword interpretation and optional model interpretation produce the same saved setting. The generator owns geography, settlements, and shared feature IDs. Chunks sample that world and cannot invent their own boundaries. Regional maps use the same landscape. Interiors remain attached local spaces with stable doors.

V2 uses 2,048 tiles per geographic degree and 64 × 64 tile chunks. This preserves broad orientation and recognizable shapes while deliberately compressing travel distances. V1 retains its original regional projection and scale for recordings.

## 9. Generation and geographic data

Resolve a setting, establish shared land/water/relief, then place settlements, paths, vegetation, and people. Keep these as ordinary functions and data. The model supplies setting parameters, never tile maps or adjacency graphs.

Natural Earth coastlines and major river lines form the bundled atlas. Simple authored mountain belts and climate rules supply broad environmental character. Local river/coast templates give important settings their recognizable composition and blend into the atlas. Valleys follow channels; a full erosion, drainage-basin, or historical sea-level simulation is not required for this approach.

Place settlements on usable ground with valid entrances, and rasterize shared paths and crossings into chunks. Validate coordinate/schema consistency, traversable starts, stable IDs, and save/replay behavior. Richer cultural assets and regional landscape adjustments can be added directly as the user tests the game, without a historical-certification gate.

Preparation scripts use pinned public-domain inputs and the Python standard library. No GIS installation or network data request is needed to play. See [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md) for source revisions and generated files.

## 10. Pixel art and interface

### Repeatable visual language

Visual quality and authoring repeatability are joint requirements. The target sits between mockups 1 and 2: the richness of composed places, material distinctions, vegetation, and useful objects, achieved with simple, reproducible individual sprites. Mystic Woods and the supplied desert/swamp sheets guide the design language, not a requirement to copy their assets or their exact pixel dimensions.

First demonstrate original architecture, vegetation, and small props beside one another at gameplay scale. Use 16 × 16 terrain cells initially, people around 20 × 32 pixels (the current world-character canvas), and larger multi-cell buildings and trees. Source sprite dimensions, ground footprints, and the geographic grid are separate. Maintain common light direction, perspective, restrained outlines, small material-specific color ramps, and quiet terrain beneath detailed objects. Use few broad foliage clusters and repeated wall/roof motifs rather than high-frequency noise. Simple two-frame walks are sufficient initially.

Store original palette-indexed art or deterministic drawing recipes, compile them to a PNG atlas, and keep an original-asset proof sheet. Inspect every new family in the renderer. Reuse construction pieces and vary footprint, roof, openings, material, and surroundings; a new culture must be more than a palette swap. Prefer a small well-finished set over an arbitrary numerical asset quota.

Free assets are preferred for this proof of concept; a total budget up to $10 is available if needed. The user does not intend to publish the full repository. Retain source/license information and keep restricted source assets out of public GitHub exports. Actual use still follows the asset terms; the supplied Mystic Woods free pack is noncommercial and contains premium previews. Original atlas recipes can ship independently of all reference downloads. No asset purchases or model spending are necessary for the first implementation.

Use Phaser for the world surface, including its tile layers and sprites. Keep a small layer order: ground, ground detail, structures/props, actors, overhead elements, selection. Use stable depth rules, especially around doors and trees. Avoid SVG buildings, DOM characters, Three.js, procedural vector portraits, and separate rendering paths for special locations.

Use nearest-neighbor sampling and integer zoom where practical. Show fewer tiles at larger pixel scale before shrinking everything into illegibility. Do not stretch the map to match an arbitrary screenshot aspect ratio. Use crisp readable UI typography rather than a pixel font for long passages.

The desktop interface has a dominant map, a slim top bar, one contextual side panel, and a compact action/input area. The top bar shows place, date, time, and mode. Selecting a person or object reveals its identity as known to the character, a short description, and contextual actions. Inventory, notebook, and evidence open on demand. On a smaller screen, the side panel becomes a drawer.

Keyboard movement and click-to-walk should both work. Space waits; Escape cancels a pending activity or closes a panel. Keep key bindings discoverable and configurable later. Input focus must prevent movement while typing. Long actions always have a visible cancel control and explain why they stopped.

Offer a calm procedural interface: actions and conversation choices are sufficient without text generation. In enhanced mode, the same input area accepts free text. Show the interpreted action before executing ambiguous or compound intentions; ordinary explicit clicks execute immediately. Keep model usage and errors in a compact status/settings surface.

## 11. Historical grounding and educational use

Keep three categories separate: what the simulation has established, what a character knows or believes, and what historical evidence supports. An invented resident can be a real actor in the simulation without becoming a documented historical person.

Historical assertions should carry claim references. A claim records its statement, geographic and temporal applicability, supporting source IDs, and status: documented, inferred, contested, or unknown. A source records title, author or institution where known, date, stable URL or identifier, locator such as page or object number, usable excerpt or paraphrase, and rights information. Do not manufacture citations to make a pack appear complete.

Distinguish source location from the place described, and source date from the historical date of the claim. Later ethnography can inform an explicitly qualified inference; it cannot silently establish a practice for a much earlier community. Material and archaeological evidence belongs alongside written sources.

Begin with a compact reviewed claim set for the reference pack. Prioritize rules with visible gameplay consequences: which animals exist, what structures and tools are plausible, which foods and materials are available, and what can reasonably be inferred about exchange and household life. Do not require a source record for every generated blade of grass.

The evidence panel should answer “Why does the simulation depict this?” It can say that the building material is supported regionally while this particular building and resident are invented. Keep these qualifications available without covering the map in warning labels.

Generate characters from supported roles and constraints: approximate age, practical abilities, equipment, household or affiliation where appropriate, and a current circumstance. Mark invented biographies as generated. Avoid presenting precise psychological beliefs as historical facts. A named person such as Brutus needs a later, separately grounded biography and date-specific context.

For educational use, implement a notebook that can save an observation, its simulation event, relevant evidence, and the player's own note. Keep player interpretation separate from source text. Export a short session record with source links and identified uncertainties. A teacher should be able to reproduce the same starting seed and choose procedural or enhanced mode.

Add reflective prompts such as “Which parts of this household are supported by evidence?” or “What would change if this reconstruction of land use were wrong?” Assessment should ask students to reason about evidence and model assumptions. Do not grade historical understanding through time played, keywords used, or a model's unsupervised judgment of whether a player made the correct life choice.

## 12. Optional LLM mode

The procedural game must already be complete before a model is added. Keep one saved world and one ruleset. Switching modes changes the source of optional interpretation and proposals; it does not regenerate the map, reset people, or replace the economy.

Allow three bounded uses initially:

| Use | Model receives | Model may return |
| --- | --- | --- |
| Prompt interpretation | User prompt, place/era catalog, supported roles and capabilities | A proposed world specification with uncertainties and unsupported requirements |
| Conversation and intent | Speaker's permitted knowledge, player-visible situation, allowed actions, relevant source excerpts | Dialogue and a structured request or short action plan |
| Occasional circumstances | A limited local situation and enabled proposal types | A request, offer, rumor/belief, or other small proposal admitted by explicit rules |

Do not send a whole save to a model. NPC context includes that NPC's knowledge and appropriate historical background, with other actors' secrets excluded. Narrator/evidence context and NPC context are different products. Source IDs in responses must resolve to supplied evidence; a real source ID still does not prove that the generated sentence follows from it.

Separate dialogue prose from mechanically binding facts. Trade terms, transfers, access permissions, commitments, and discoveries appear in structured records and authoritative UI cards. The model can phrase an offer but cannot create stock, consent, an item, or a debt merely by mentioning it.

The lifecycle is: prepare bounded context, request structured output, validate schema, validate world preconditions and historical applicability, commit accepted proposals at a defined action boundary, then show the resulting dialogue and events. Claims of completed action must derive from the committed result. A stale response is discarded or re-evaluated; it does not overwrite a newer state.

Start dynamic proposals with a very short whitelist, such as asking for help using existing objects or offering an available good. Unsupported proposed visitors, institutions, or technology are rejected. Add new proposal types only with an engine rule, state representation, and test. This still permits consequential variation through relationships and commitments.

Treat retrieved text and dialogue as data, never instructions that can change tool permissions or engine rules. Enforce source selection, action legality, and inventory conservation in code outside the model.

Set server-enforced request, token, and spending limits before exposing a public model endpoint. Keep provider credentials on the server. Enhanced features must have cancellation, a timeout, and deterministic fallback text. At most one pending conversational request per session is enough initially. Cache with relevant state/context and model-version keys so a stale response cannot masquerade as current knowledge.

No calls are made for movement, rendering, pathfinding, ordinary NPC schedules, or trade arithmetic. No background ambient model calls in the initial enhanced release. Later, occasional circumstances can be requested at explicit simulated-time boundaries with a user-configured budget.

Without a model, the opening prompt field uses a lightweight parser over a shipped place/date/role catalog and exposes the resolved fields for editing. It should explain unsupported input rather than pretend to understand arbitrary prose. Once a pack has loaded, procedural play requires no model requests; fully offline reload is a later service-worker/cache feature unless explicitly included in the milestone.

For an unsupported enhanced prompt, preserve the requested setting and explain which dimensions lack support. Offer the closest supported selection or a clearly marked approximate generated specification when rules allow it. A cosmonaut must not quietly become an ordinary land character. Broad prompt recognition and historically credible simulation coverage are separate capabilities.

## 13. Agent play and reproducible trajectories

Make the headless player interface work as soon as basic movement and interaction exist. A simple Node command runner is sufficient before MCP. Rendering is an observer of engine state; a graphical browser must not be required to take a turn.

Expose three player tools: `observe`, `inspect`, and `act`. Tool responses include the current revision, player-visible state, contextual actions, and reasons for interruption or rejection. Supply compact local tile semantics, visible actors, known destinations, inventory, and recent events. Unknown cells remain unknown. Names and IDs must not reveal hidden roles or dispositions.

Inspection returns only information that a human could obtain without a time-consuming action. Searching, approaching, reading an unfamiliar object, or opening a container goes through commands and ordinary permissions. An agent cannot inspect a distant person's private inventory by guessing its ID.

Use the same movement/pathfinding assistance for agents and humans. Bounded commands such as walking to a visible destination, following someone, or waiting until a specified time reduce tool-call overhead. Stop them on important changes. Give equivalent controls to human players so research results are not driven by unequal interfaces.

Start with structured observations to study decisions without confounding visual recognition. Later add screenshot-only or mixed observations as explicitly different experimental conditions. A researcher may inspect full state, clone a session, or create a start; those capabilities belong to a separate administrative interface and are never exposed as player tools.

Use the official TypeScript MCP SDK for a thin local adapter around this player interface. Implement local process transport first. Remote MCP or HTTP sessions on Vercel come later: each request authenticates a session, loads state, validates revision, applies a bounded command, atomically persists the new revision and idempotency receipt, and returns. Durable storage and conflict handling are prerequisites for hosted sessions. Do not store remote game state only in a function's process memory.

The first research log should capture exact observations supplied to the agent, commands, command results, simulation timestamps, state hashes, model identifiers and exposed generation settings, controller prompt, versions, seed, and any external proposals. Store optional stated reasons as model self-reports. Do not describe them as access to private reasoning.

A trajectory is one sequence of events. A decision tree requires explicit branches from saved states. Fork only at selected consequential decisions, preserving parent run ID and branch point. Reuse the same exogenous inputs or random schedules where possible, and state when changed actions necessarily cause different random draws. Do not construct an exponential tree of every tile step.

For model comparisons, begin with a deterministic environment, identical starting characters, paired seeds, comparable observation/action budgets, and declared stopping conditions. Record timeouts, invalid actions, API failures, and non-completion. If background NPC models are enabled later, hold their configuration constant or treat it as another experimental factor.

Collect interpretable measures such as movement, activities attempted, exchanges, kept commitments, observed harms, changes in relationships, and access to resources. Avoid a universal morality or historical authenticity score. The simulation embodies assumptions; agent results describe behavior within those assumptions.

## 14. Place-and-era selection study

Keep this as an independent experiment script and data export, not a dependency of the game build. It should eventually run against configured providers using real responses; generated demonstration data must never be presented as measured model behavior.

Ask each model for 100 historical place/era combinations it would choose to simulate, with a role and short reason. Run several fresh sessions per configuration and retain the original ordered responses. Specify the prompt, output budget, model identifier, date, and any sampling controls.

Normalize each response into a place label, location or geographic extent, historical date range, proposed role, rationale, rank, and normalization status. Preserve the original text and the geocoding decision. Represent uncertain regions and dates honestly; do not convert a civilization or century into an unjustifiably precise point and year. Adopt one explicit BCE/CE conversion convention, with tests around the absence of a year zero in display dates.

Create linked geographic and chronological views with filters for model, run, role, and rank. Compare regional/period distributions, repeated selections, overlap, and within-model stability. Report raw counts alongside any derived diversity metric. The result concerns expressed selections under a prompt, not stable intrinsic desires.

A list of 100 can encourage deliberate coverage and list-position effects. Compare it with repeated single selections in fresh contexts and, optionally, choices from a shuffled shared menu. These answer different questions about recall, framing, and preference expression.

Later connect selection to play: test both a model's nominated settings and shared settings, then examine whether its enacted choices resemble its stated interests. Keep this study separate from software acceptance tests.

## 15. Persistence, replay, and operational limits

Separate immutable generated base data from mutable changes. Regenerate unchanged terrain from the manifest and seed; save changed tiles, moved or removed objects, encountered actor state, relationships, permissions, activities, clock, and random counters. Deletion needs an explicit tombstone so a generated object does not reappear on reload.

Begin with serialized snapshots and a compact command/external-input log. This is sufficient for save/load and replay; do not introduce a distributed event-sourcing framework. Events support the interface and research record. Periodic snapshots bound replay time.

Every save includes independent schema, simulation, generator, content, and atlas versions. Pin old dependencies when reproducing a run. A changed generator must not silently rearrange an existing player's home. For incompatible versions, provide an explicit migration or a clear refusal while preserving the original export.

Record accepted LLM proposals and displayed responses. Exact replay uses those recorded inputs and does not call the provider again. Fresh model calls can diverge even when the same model label and settings are requested; do not promise deterministic live inference.

Autosave after completed command boundaries, serialize writes, and provide export/import from the first playable milestone. Validate imports before replacing a session. Use a single-writer policy for the same local save across browser tabs; a second tab should open a copy or read-only view rather than silently race.

Keep generated chunks in a bounded cache and release render objects when chunks leave it. Active simulation and changed entities have their own explicit retention policy. Worker request completion order may change load speed but never feature identity or simulation outcomes.

Initial performance targets should be measured on a recorded ordinary laptop/browser: responsive movement and panels, smooth camera motion around a modest active population, no repeated visible generation pauses at chunk edges, and memory that plateaus during sustained travel. Record cold start, warm chunk generation, frame time, active entity count, and memory over a fixed traversal. Treat numerical budgets as measurements to establish in the first working build, not unsupported guarantees.

A public Vercel deployment needs a working production build, static pack URLs, an isolated optional model endpoint, and no exposed secrets. Document the local frontend command and the command needed to exercise server functions. Verify the production route behavior; do not assume Vite development proxy behavior is identical to deployment.

## 16. Implementation milestones

Complete and demonstrate each milestone before broadening scope. Keep the application runnable throughout. Implementation may span several Codex sessions; update a short progress file with completed gates and the next concrete task.

### Milestone 0: original art and playable visual proof

Create original Roman and mudbrick architecture, foliage, people, and everyday objects within a shared style. Render the original assets in a working scene with movement, selection, depth ordering, and one interior. Inspect at actual gameplay scale. Record art decisions and any remaining mismatch with the references. The same assets must then support generated layouts.

### Milestone 1: deterministic geographic walking build

Create the new app, the core/runtime/render boundary, the first prepared geographic pack, seeded regional planning, and chunk generation. Render a real atlas with ground, water, vegetation, a generated structure, and a player. Support movement across multiple chunk boundaries, a linked interior, an overview derived from the same regional plan, and save/load.

Include a minimal headless runner that takes the same movement commands. Provide seed selection and a development view that can export a stitched chunk image. The reference terrain must be tied to actual declared geographic data. Synthetic fixtures are appropriate for tests, but label them and do not substitute them for the reference region.

**Gate:** the same seed produces the same chunks in different request orders; rivers and roads agree at boundaries; an interior returns to its persistent door; save/reload preserves the player and a changed door; browser and headless movement produce matching state hashes.

### Milestone 2: a complete procedural day

Add a modest population, schedules, visibility, objects, inventories, ownership/access, template conversations, needs, and the five example activities. Give the player a generated role and plausible equipment. Add contextual controls, interruptions, the first claim/source records, and notebook capture.

**Gate:** a human and a scripted controller can each play a full simulated day without a model or API key. Demonstrate herding, capture attempts, consensual following, theft with local observation, and an atomic trade. Consequences survive save/load and leaving/revisiting the area. Log actual failure cases as well as successes.

### Milestone 3: the second initial historical pack

Add the researched Neolithic Konya plain pack with a new local seed, ecological definitions, construction modules, role definitions, and evidence. Test its date/region exclusions and materially different settlement form. Reuse the same engine and UI.

**Gate:** both settings are playable through the same command interface. No setting-specific branches appear in React or Phaser scenes. A genuinely missing mechanic may justify a small core extension, but document it explicitly; ordinary asset and content variation belongs in pack data. The new pack must not be a palette swap.

### Milestone 4: optional model enhancement

Add server-side provider configuration, structured prompt interpretation, source-informed conversation, validated action proposals, and a small supported circumstance type. Add budgets, cancellation, timeouts, recorded external inputs, and fallback behavior.

**Gate:** switching modes preserves the world; failed or malformed model responses cannot corrupt it; unavailable service returns the player to usable procedural controls; exact replay uses recorded responses; model prose cannot grant an uncommitted item, trade, or permission.

### Milestone 5: agent access and experiment exports

Add the local MCP adapter, authenticated session binding where applicable, player-view information controls, trajectory export, replay controls, and branch-from-snapshot support. Provide one scripted baseline policy and a documented example of configuring an external model controller. Keep provider secrets outside the repository.

**Gate:** an MCP client can complete an ordinary session, cannot obtain private state through inspection or guessed IDs, and can export a run that the graphical client replays. Duplicate requests do not repeat actions. Provide a documented paired-seed comparison procedure; do not invent model findings.

### Later extensions

Expand the connected Rome–Ostia region and dated urban anchors; add more eras and ecologies; improve settlement and drainage detail; support hosted agent sessions; build the place/era study viewer; add classroom setup and richer evidence comparison. Choose extensions based on observed limitations, rather than adding all of them to the first implementation backlog.

## 17. Tests that protect the foundation

Favor tests of meaningful invariants over snapshots of implementation details. Use small deterministic fixtures plus a bounded set of varied seeds. Add a browser test where integration itself is the risk.

| Area | Required check |
| --- | --- |
| Determinism | Same manifest and commands produce matching hashes in browser and Node; reordered chunk requests produce the same geometry. |
| Geography | Shared features agree across edges; known anchors project correctly; minimap and local maps agree; negative chunk coordinates work. |
| Generation | Required doors and routes are reachable; multi-chunk structures have one identity; supported seeds do not strand the player. |
| Conservation | Trades and transfers preserve quantities; invalid exchanges change neither side; removed prey/objects do not respawn after reload. |
| Identity and persistence | Actors, ownership, relationships, interiors, and permissions survive reload and return travel. |
| Knowledge | Occluded/private objects and unobserved events remain hidden; later suspicion is distinct from direct witnessing. |
| Time | Typing, rendering, and API delay advance no simulation time; long actions interrupt; distant catch-up is stable. |
| Model boundary | Invalid schemas, invented IDs, stale responses, unsupported actions, and contradictory mechanical claims cannot change authoritative state. |
| Agent boundary | UI and agent commands have equivalent effects; actor identity cannot be spoofed; duplicate action IDs are idempotent. |
| Content | Definitions and source IDs resolve; date/region exclusions work; missing evidence is exposed, not fabricated. |
| Replay | Recorded model inputs and commands reproduce state without network calls; incompatible versions fail clearly. |
| Browser | Start, walk, select, enter/exit, trade, save/reload, and use the narrow-screen panel in an actual browser. |

Inspect screenshots from the running game for tile seams, scale, depth order, repeated asset legibility, and interface clutter. A passing test suite does not establish historical accuracy or enjoyable play. Maintain a short list of observed problems from actual sessions.

## 18. Code quality rules for Codex

Keep functions and modules focused on a domain responsibility. Extract a module when a file owns unrelated concerns or its API becomes hard to follow; avoid arbitrary file-size policing and forests of tiny wrappers. Prefer explicit imports and straightforward control flow.

Use discriminated unions for commands, activities, and proposals. Prefer explicit handlers to reflective dispatch or a generic rule interpreter. Keep data schemas small and evolve them with actual content. Do not solve future diseases, governments, languages, crafts, and vehicle systems through speculative abstractions.

Use controlled mutation inside the core if it keeps the implementation simple and efficient. External callers receive read-only projections or snapshots. Every mutation must pass through an identifiable command/update boundary. Do not deep-clone an entire geographic world for every tile step.

Keep caches disposable, saves authoritative for changes, and provenance explicit. Add comments for assumptions, determinism rules, historical limitations, and non-obvious tradeoffs. Avoid comments that merely narrate the next line of code.

Add dependencies only when they replace meaningful work. Start without a generic agent framework, workflow service, vector retrieval service, physics engine, custom ECS, or universal cultural ontology. Introduce a spatial index, more sophisticated scheduler, or cloud database when profiling or a delivered feature shows the need.

Keep a short README with setup and commands, this design document, and a compact progress/decisions file. Record consequential deviations with a reason and verification evidence. Avoid generating a large collection of aspirational architecture documents that drift from the code.

Every milestone handoff should state what works, how it was verified, known limitations, and the next concrete task. Never describe a fixture, mocked provider, prewritten transcript, or static screenshot as implemented procedural functionality.

## 19. Initial instruction to the implementing Codex session

> Read this document as the product and architecture brief. Build a fresh implementation and preserve the existing UHS repository as reference material. Start with the original-art proof in Milestone 0, then Milestone 1, and complete its acceptance gate before expanding into the later milestones. Create only the modules that the running implementation needs. Use a real, documented geographic sample, a small working pixel atlas, and one authoritative TypeScript engine shared by the browser and headless runner. Keep model calls out of the first milestone. Make routine implementation decisions independently, record material tradeoffs, and verify the result in Node and a real browser. Leave a runnable application, clear setup instructions, a short progress record, and evidence for each completed gate. If an external dependency or geographic source is unavailable, identify the exact limitation and use a clearly labeled development fixture while continuing other work; do not claim the geographic gate has passed. Do not deploy publicly, incur model spending, or modify the old repository unless separately authorized.

### Implemented graphics contracts and review gate (September 6)

The art direction is a quality target rather than an instruction to reconstruct a particular reference scene. Building identity now resolves through a content recipe with physical footprint and entrance plus independent visual bounds, ground anchor, height, roof/opening/material and attachments. The compiler composes common parts; packs select recipe IDs. Landscape construction (earth bank versus quay, bridge, paving and water palette) is independent of historical building selection. Parcel-derived districts and communal-hub paths replace renderer assumptions about a named architecture and fixed town rectangle. Enclosure visuals read the same geometry records as collision.

A `/graphics-lab` review route uses the normal renderer with disposable, non-saving fixtures. Classical/Hellenistic and mudbrick are the first quality targets. Timber, courtyard and weatherboard examples are clearly labeled secondary construction studies. Their purpose is to expose assumptions in the common system before larger era packs are authored. Controls cover landscape, light treatment, source-pixel magnification, viewport aspect, seed, camera, animation freeze and footprint/entrance/bounds overlays. URLs and PNGs are the review artifacts.

This is a graphics refactor, not a migration of existing physical worlds: generator version 1 remains intact. New channel shapes are tested in an isolated contour fixture; changing playable collision geometry must be versioned separately. See `GRAPHICS.md` for the current module boundaries and remaining visual quality checks. Do not interpret passing functional or screenshot-repeatability tests as artistic acceptance of the mockup target.

## 20. Cultural content families and dated local profiles

**Decision recorded September 6, 2026:** use at most twelve broad reusable content families as the initial production budget, with a specific dated local profile underneath each playable setting. Families organize asset creation and reuse; they are not a historical taxonomy, permanent map zones, or NPC identities. This direction is accepted for planning. The twelve-era registry, bounded resolver, two compatibility profiles and historical inspector are now implemented; additional playable settings are not. See [HISTORY.md](HISTORY.md) for the authoritative chronology and extension contract.

The family determines which components we can reuse. Place, date and community determine which components, institutions and capabilities may actually appear. A family alone must never be enough to generate a historical setting. Unresearched combinations retain visible coverage gaps. The user welcomes explicit, source-linked hypotheses and fictional gap-filling for future specifications, including prehistoric languages; do not silently substitute a superficially similar world or confuse a plausible specification with supported gameplay.

### Initial twelve families

| Content family | Distinctions that local profiles must preserve |
| --- | --- |
| European | Mediterranean/classical, northern/Atlantic and eastern European traditions; later European-derived settler settings. |
| North African & West Asian | Egyptian, Maghrebi, Levantine, Mesopotamian, Iranian and Arabian settings. |
| Inner Eurasian | Steppe, oasis and highland settings; pastoral settlements and trading cities. |
| South Asian | Northern, southern, eastern and Himalayan settings. |
| East Asian | Chinese, Korean, Japanese and neighboring regional traditions. |
| Southeast Asian | Mainland river valleys, maritime trading settlements, Javanese/Balinese and upland communities. |
| West & Central African | Sahelian, coastal/forest and Congo-region settings. |
| East & Southern African | Ethiopian/Horn, Swahili coast, Great Lakes and southern African settings. |
| Mesoamerican | Central Mexican, Maya, Oaxaca and neighboring traditions. |
| Andean | Coastal, highland and adjoining eastern-slope settings. |
| Other Indigenous American | Separate woodland, plains, Arctic, Northwest Coast and Amazonian profiles. |
| Australian & Pacific | Separate Aboriginal Australian, Papuan and island-Pacific profiles. |

The final two groupings are the weakest compression and require particularly strong local distinctions. They share production budgets, not a claim of cultural equivalence. Specific community names replace these umbrella labels in player-facing identity. Examples in this table are planning categories, not ready-made historical definitions.

Keep Mesoamerica and the Andes separate to budget for substantially different agriculture, architecture, transport, clothing and institutions. European periods can share a production family because the dated profile selects different construction and object sets; classical Rome and industrial Britain are not interchangeable. Early Anatolia may reuse earthen-building components without inheriting the institutions, clothing or music of later West Asian societies.

### Independent dimensions and resolution

Start with a small explicit resolution function and plain records, not an unrestricted inheritance system or universal cultural ontology.

| Dimension | Responsibility |
| --- | --- |
| Place, date and community | Specific historical identity, applicability, evidence, names and exclusions. Several community profiles may coexist in one region. |
| Content family | Reusable visual and musical components and authoring conventions. A local profile may explicitly borrow appropriate components from another library. |
| Technology and institutions | Available tools, infrastructure, occupations, work processes, exchange and access rules, subject to local evidence. |
| Ecology and seasonal context | Materials, vegetation, crops, terrain, climate and meaningful local seasons. |
| Dated local overrides | Concrete building recipes, outfits, inventory distributions, work sites, schedules, musical treatment and exceptions. |

Retain the precedence from section 9: **local dated override → regional dated rule → declared fallback**. Apply explicit exclusions and validate the resolved result; inherited content cannot bypass a date or region restriction. Do not derive cultural identity from coordinates alone. Do not use an undifferentiated influence percentage to mix institutions or props; select the particular historically justified contributions.

“Neolithic,” “industrial,” “tropical” and “nomadic” describe aspects of a setting; none replaces local identity. Technologies and practices do not advance everywhere on a single ancient/medieval/modern ladder. A shared date does not imply shared infrastructure, social organization or access to goods.

### Distinction examples and future acceptance cases

| Setting | Proposed assembly | What must not happen |
| --- | --- | --- |
| Melbourne, 1950 | European family; Australian urban profile; locally appropriate industrial infrastructure, buildings, jobs and community composition. | Assign it a generic tropical or Oceanian setting because of its continental location. |
| Java, around 950 | Southeast Asian family; a researched Javanese locality and date; appropriate agriculture, housing, crafts, exchange and temple institutions. | Reuse Melbourne's setting, or turn South Asian connections into wholesale replacement of Javanese identity. |
| A specific Aboriginal Australian community, 1950 | A named community and place; its own material and social setting, with contemporary colonial institutions and introduced goods where supported. | Replace it automatically with either an industrial suburb or a timeless prehistoric scene. |
| Konya plain, around 6500 BCE | Existing Neolithic profile, with its own evidence, buildings, goods and access conventions. | Back-project later regional religions, currencies, clothing or instruments onto it. |

These are design tests, not implemented packs or fully sourced scene specifications. The Australian examples are informed by the National Museum of Australia's accounts of [migration](https://www.nma.gov.au/exhibitions/defining-symbols-australia/suitcase) and [First Australians](https://www.nma.gov.au/exhibitions/first-australians). The Met's [early Southeast Asian kingdoms](https://www.metmuseum.org/exhibitions/listings/2014/lost-kingdoms) provides background on regional connections. These sources do not authenticate every proposed object, role or musical choice; pack authoring must supply more specific evidence.

### Reuse across graphics, work, objects and music

- **Graphics:** compose shared walls, roofs, openings, garments and props. Local profiles need distinctive silhouettes and coherent everyday houses, workplaces and interiors. Clothing and household goods deserve the same attention as monuments. Do not implement the twelve families as twelve palette swaps.
- **Professions:** reuse activities such as cultivation, weaving, transport and trade, while profiles specify titles, equipment, workplaces, inputs/outputs, schedules and social constraints. Renaming an NPC does not implement a different occupation. Add a small shared mechanic only when a supported work cycle requires it.
- **Inventory:** use a shared catalog with locally and temporally restricted availability. Materials, use and trade introductions affect selection. One basket implementation can serve many settings, but a universally available catalog must not leak inappropriate goods into a world.
- **Music:** preserve recognizable theme identity while profiles select instruments, tuning, ornament, rhythm, accompaniment and texture. Reuse seasonal/time arrangements rather than composing every combination separately. “Ancient = panpipe and drum” is one sketch, not a universal historical rule. Later technology expands options; it does not require every setting to end in techno. The current five themes and three orchestration previews are groundwork, not authenticated cultural music. See [AUDIO.md](AUDIO.md).
- **Ecology and time:** keep climate and seasons independent of cultural family. The current four 28-day music seasons are a declared placeholder. Southern-hemisphere and monsoon settings need appropriate local seasonal profiles; a family match does not justify importing northern temperate seasons.

For a new supported setting, author a small **local identity package**: characteristic building and roof forms, clothing details, signature objects, names and roles, institutional rules, one musical treatment, and evidence/exclusions. Reuse remaining components. Do not budget for twelve complete copies of the game or a fully authored family × era × season × time cross-product.

### Delivery order and decision tracking

| Item | Status |
| --- | --- |
| Twelve-family production approach, local identity requirement and independent ecology/technology | Accepted design direction; documented here. |
| Twelve fixed eras, concrete dated profiles and bounded resolver | Delivered for two compatibility profiles and diagnostic research cases; see HISTORY.md. |
| Existing Roman and Neolithic packs reproduced through resolved definitions | Compatibility gate passes; IDs, contents, random draws and checkpoint results preserved. |
| Small researched Javanese setting around 950 | Later candidate; current user priority is era review, then approved props/interactions. Generation is reserved for another phase. |
| Melbourne around 1950 | Later stress test for modern infrastructure and shared European-derived components outside Europe. |
| Content for all twelve families | Deferred; prove the approach with actual settings before expanding the libraries. |

The proposed test set is Rome, Neolithic Anatolia, Java and Melbourne. Java and Melbourne are recommendations for sequencing, not newly supported world-selector entries. The earlier tropical South American suggestion remains a useful later test. All new playable setting expansion is deferred behind the current user review and prop priorities. Current blockers and implementation acceptance are tracked in [PROGRESS.md](PROGRESS.md#current-handoff-review-eras-before-props).

## 21. Fixed eras and the current review gate

The user accepted the twelve chronological buckets and requested their executable foundation before new generation or props. [HISTORY.md](HISTORY.md) and `src/content/history/dates.ts` are authoritative: deep prehistory, Early Holocene, 3500–1000 BCE, Antiquity, 500–1000, 1000–1500, 1500–1750, 1750–1850, 1850–1914, 1914–1945, 1945–1990, and 1990 onward. Custom dated regional rules refine those buckets; political control is independent of material culture.

Use `/history-lab` to inspect exact dates, evidence, alternatives and selection results. The framework permits ambitious, explicitly labeled prehistoric hypotheses; it does not implement language generation or a global historical atlas. Most culture-era combinations still lack authored content.

The latest user instruction supersedes the earlier Java-first sequencing: stop for their review of eras and the era/culture breakdown in [PROP_PLAN.md](PROP_PLAN.md) before drawing or implementing new props. After that review, the intended interaction MVP includes adjacent portable-container pickup on Space with empty hands, equipped-object use on Space, and persistent container identity/contents/ownership. It is planned, not delivered. Do not change settlement or landscape generation in this phase.
