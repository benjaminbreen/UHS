# Time travel implementation plan

## Accepted experience

The central world selector opens a dedicated time dialog; New world keeps its
existing behavior. Choose a year within 1,000 years either side of the current
date, clipped to the existing −1,000,000…10,000 limits. Selection does not
change the world. Start prepares the destination, accelerates and decelerates
through stylized days and nights, then opens a short arrival account and the
new playable character's relationship to the previous one. A clickable direct
ancestral line connects every generation. The family is procedural fiction;
regional historical context retains its evidence and limitations.

## Work sequence

1. Add deterministic site chronology, dated setting resolution and an explicit
   lineage. Use the existing geographic/content resolvers. Preserve original
   terrain and sites; retain earlier fabric as ruins. Returning to an already
   visited date restores its session checkpoint. No save-system expansion.
2. Add material/component structural state shared by natural deterioration and
   future impact/fire commands. A ruin's surviving walls determine collision.
   Keep burial and vegetation separate from surviving structure. Add native
   pixel ruin rendering without rewriting the existing building art compiler.
3. Implement a runtime time-travel transaction: pause, prepare, animate, commit,
   announce. Errors/cancellation retain the current world. Keep animation time
   separate from simulation time and prevent ordinary runtime input throughout.
4. Build the distinctive minimal time dialog, transition, arrival view and
   linked family tree. Integrate original synthesized sound with existing audio
   preferences; support keyboard, mobile and reduced motion.
5. Add optional server-side GPT-5.6 Luna arrival prose from committed changes
   and historical context, with a deterministic fallback. Model prose cannot
   change lineage, physics, dates or authoritative world state.
6. Verify chronology/order invariants, kinship, damage/collision, API fallback,
   and complete browser flows. Run npm test and production build. Inspect UI
   screenshots and a representative settlement before/after.

## Constraints and decisions

Historical progression is guided by existing regional/date data, not an
unconstrained alternate-history economy. New scoped context belongs in regional
files. Ancient fabric must not silently change material with the date. The
initial continuity model evolves existing building sites; citywide population,
street-network redevelopment and complete historical coverage remain explicit
extension points, not claims made by the arrival prose. Weapons and torch
interactions are future work; structural damage accepts their future effects.

Keep courtyard-art work already present in the checkout intact. Changes to
WorldScene must be small integration points. Timeline state is session-local
in this first delivery and must not be mistaken for a durable save format.

## Initial implementation

The complete choose → prepare → passage → arrival → family flow is wired to
Change your world. Original synthesized audio follows the existing mute/SFX
settings. Reduced motion uses a short transition without repeated day/night
cycles. The quotation is from Shakespeare's *The Tempest*.

`src/core/time` owns deterministic building-site incarnations, material decay,
prop remains and parent-child links. Twelve wall sections, roof integrity,
charring, burial and vegetation are separate values. `damageStructure` accepts
localized impact, fire and repair effects; weapons, ignition and fire spread
are not implemented. The renderer uses native pixel rubble and surviving walls;
partial original roofs and bespoke ruin silhouettes remain art improvements.

Naples has a scoped sourced historical account and inferred local names.
Elsewhere the existing date/regional profiles drive the destination, with a
plain fallback account. Eligible venues replace earlier institutions on
occupied sites. This is not exhaustive historical reconstruction: founding and
abandonment of whole settlements, changing street plans, migration, population
and regional events need additional authored profiles and simulation rules.
Trees and terrain landforms currently persist across the passage.

Returning to a visited date restores its session checkpoint. Unvisited dates
are evaluated from the initial site chronology, independently of scrub order.
The lineage survives geographic map travel; changing maps starts a new local
site chronology and discards the old map's temporal checkpoints. Branching
player interventions and persistent history across reloads are not implemented.
Do not represent the reconstructed family as a documented genealogy.

Optional `/api/time-arrival` prose uses server-side `gpt-5.6-luna`, fixed input
limits and a timeout. It can summarize supplied history and committed state;
it cannot invent authoritative events or change the simulation. Missing keys,
provider failures and access-code-protected deployments retain local prose.

Next foundations: retain local histories across map changes; layer interventions
on the dated site model; add repair/maintenance and ignition commands; expand
scoped historical profiles; improve partial-collapse art and vegetation
succession. Durable timeline storage can follow when saves become a priority.

## Verification

Ten focused tests and the full desktop/mobile browser journey pass. A live
Luna call succeeded; no-key and provider-failure fallbacks are covered.
Production build and TypeScript checks pass. The full suite reports 571 passes,
four assertion failures reproduced on unchanged HEAD, and a world-v2 timeout
that passes in isolation (4/4). Two worker-update timeouts also occurred under
shared-machine contention. No failing assertion was attributed to time travel.
