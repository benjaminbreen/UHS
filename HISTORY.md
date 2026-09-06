# Historical content framework

Decision accepted September 6, 2026. This is the contract for future era, cultural-content and procedural-generation work. The twelve eras below are settled. The implementation is `src/content/history/`; the review tool is `/history-lab` (also linked from Settings and Graphics lab).

## Scope of this delivery

Implemented: era/date registry; twelve cultural-family IDs; a pure content resolver with explicit precedence, date/place/community scope, exclusions, context and capability gates; qualified historical facts and alternative hypotheses; a read-only inspector; generator-v1 compatibility adapters for the two existing packs.

Not implemented: new settlement/landscape generation, a world political map, historical events advancing across time, new language/dialogue synthesis, new occupation production cycles, new prop art, equipment, pickup, container opening/breakage. The user explicitly reserved generation for another agent and requested review before item/prop implementation. See `PROP_PLAN.md` for the proposed next phase.

## Permanent chronology

The authoritative executable list is `src/content/history/dates.ts`. IDs and boundaries are stable; changing them is a design migration, not an incidental art edit. These are chronological bands for baseline selection, not a worldwide technology ladder. Local names such as a dynasty, archaeological phase or political regime are refinements, never replacements for the global chronology.

| ID | Display label | Start included | End excluded |
| --- | --- | --- | --- |
| `deep-prehistory` | Deep prehistory | Open | 10,000 BCE |
| `early-holocene` | Early Holocene | 10,000 BCE | 3500 BCE |
| `early-historical` | Later prehistory / early historical periods | 3500 BCE | 1000 BCE |
| `antiquity` | Antiquity | 1000 BCE | 500 CE |
| `early-middle` | Early middle periods | 500 | 1000 |
| `later-middle` | Later middle periods | 1000 | 1500 |
| `early-modern` | Early modern | 1500 | 1750 |
| `1750-1850` | 1750–1850 | 1750 | 1850 |
| `1850-1914` | 1850–1914 | 1850 | 1914 |
| `1914-1945` | 1914–1945 | 1914 | 1945 |
| `1945-1990` | 1945–1990 | 1945 | 1990 |
| `contemporary` | Contemporary | 1990 | Open, coverage through present |

Twelve was chosen over eight to reduce exceptions in recent history and distinguish 500–1000 from 1000–1500. Exact dates always remain relevant within a band. An open computational endpoint does not constitute researched future coverage. Nor does the deep-prehistory band promise supported human behavior for arbitrary geological dates.

Dates use astronomical years, matching the existing engine: `0` = 1 BCE; `-6499` = 6500 BCE. Use `bce(6500)`, not hand-written negative arithmetic. A range is `[start, end)`. Date comparison supports optional month/day and uses a proleptic Gregorian ordering convention, not JavaScript `Date` or local time zones. This is not a claim that historical people used that calendar. Convert source calendars when authoring data.

Omitted month/day anchors a query to the first day; it does not mean a whole uncertain year. Uncertain dating and disputed boundaries must be explained in the evidence limitation. Do not give an archaeological estimate spurious day precision. An ordering key is not an elapsed-day calculation.

## Small data model

| Record | Purpose |
| --- | --- |
| Definition | Stable ID, category, label, optional existing runtime/art ID, delivery status, optional local capability requirements. Shared regardless of historical applicability. |
| Selection | Definition ID, available/excluded, common/uncommon/rare, placement contexts, local/imported/surviving/unspecified supply, evidence. |
| Kit | A flat reusable list of selections. No nested kit inheritance. |
| Place | Named context with explicit region memberships, community, culture-family choice and review date. No automatic ethnicity from coordinates. |
| Rule | Baseline/regional/local scope; family; optional era and exact date range; optional region/place/community constraints; selected kits and records; qualified facts. |
| Fact | A chosen interpretation, evidence, and optional competing interpretations. Currently authority, overlord, claims and language. |
| Source | Stable ID, title and link. Cited by a claim; its existence alone does not authenticate a whole profile. |

Categories are items, props, occupations, buildings, animals, plants, appearance, institutions and music. Category support does not imply populated research or implemented gameplay. `delivery: existing` means a definition/art/label exists in the prototype; it does not certify realistic behavior. The occupation entries are still prototype role labels. `reference` entries are diagnostic only.

The twelve cultural families retain the meaning in UHS_DESIGN §20: production/content families, not immutable populations or political territories. A specific community chooses applicable reusable components. A polity can govern several communities; migration or imported goods does not imply a complete cultural replacement.

## Resolution contract

```ts
resolveHistory(historyRegistry, {
  culture: "north-african-west-asian",
  place: "konya",
  date: bce(6500),
  hypotheses: true,
});
```

1. Validate IDs, references, sources, date ranges and rule scopes.
2. Determine the era from the exact date. Match all specified scope conditions; a places/regions list matches any member of that list.
3. Apply baseline, regional, then local selections. A more local selection **replaces the complete record for that definition**, not an unpredictable deep merge. Facts replace by their named field. Identical-specificity collisions fail; file loading order never settles historical disagreement.
4. Preserve explicit exclusions. Filter by requested placement context; mark missing local capabilities as conditional. Imported goods do not require local production capability unless the definition actually requires it for use. Supply is metadata, not an implemented trade simulator.
5. Return selected/excluded/conditional entries, rule traces, facts, coverage notes and unresearched IDs. The resolver does not sample, generate entities, mutate saves or contact models/networks.

The catalog is not globally available. A definition without a matching selection is **unresearched here**, distinct from explicit exclusion. A local correction may deliberately replace an older exclusion, but must supply its own qualified claim; a capability or visual asset never overrides an exclusion automatically.

Prevalence labels and eventual sampling weights are author judgments, not archaeological percentages. A role, institution, animal, or artifact being attested somewhere does not make it ubiquitous. A crop's historical presence, climatic viability, wild occurrence and local cultivation are separate questions. Keep required habitats and production opportunities in the future generator's supplied context rather than inferring them from cultural-family labels.

## Research, hypotheses and imaginative reach

The user explicitly wants plausible attempts even far beyond secure evidence, including prehistoric language-family hypotheses. Exploratory interpretations are enabled by default. Do not reduce this to either falsely certain history or a refusal to attempt reconstruction.

Four evidence statuses have different meanings:

- **documented:** a specific claim directly supported by a source within its scope.
- **inferred:** a stated extension from evidence (for example, applying a regional practice to an invented household).
- **hypothesis:** a proposed, contested reconstruction; cite the theory, identify our own extrapolation, and preserve meaningful alternatives.
- **fictional:** an explicit gameplay/authoring choice or an invented gap-filler. It may be imaginative and useful without being an attested historical fact.

Nonfictional records require source references. All statuses require a claim and a limitation. Do not manufacture numeric confidence scores. Our exploratory toggle declines hypothetical/fictional selections while still showing the underlying claims; it does not pretend that those things were historically absent. Alternative facts are preserved for research review; switching between arbitrary hypotheses as a saved gameplay setting is future work.

The Konya profile tentatively explores early Indo-European affiliation under the [Anatolian farming hypothesis](https://www.mpg.de/research/indo-european-languages-origins), with links to [hybrid](https://pure.mpg.de/pubman/faces/ViewItemOverviewPage.jsp?itemId=item_3522769) and [steppe-dispersal](https://www.mpg.de/9005184/humans-migration-indo-european-languages) research and an unclassified-language alternative. The attribution to our particular households remains conjectural. It must not become attested Hittite, nor a claim that genetic ancestry identifies spoken language.

The northern-Eurasian thought experiment explores the macrofamily proposal in [Pagel et al. (2013)](https://pubmed.ncbi.nlm.nih.gov/23650390/), around 15,000 years ago. The chosen 13,000 BCE review date and broad region are a scenario exercise, not a recovered community or accepted linguistic reconstruction. A family guess does not supply authentic vocabulary, names, phonology or mutual intelligibility. Later invented language treatment must retain that distinction. These are examples of how to author bold hypotheses, not a comprehensive prehistoric linguistic atlas.

## Politics and other fine-grained changes

Authority, overlord and competing claims can use independently scoped date ranges. A local authority can coexist with a higher-level polity. Claim records should not be presented as effective control. Region memberships are supplied explicitly; this delivery does not contain dated border polygons or point-in-polygon political lookup. Another agent can provide those memberships without changing the selection contract.

The Moscow study proves day-level selection inside the Contemporary era. It uses December 25, 1991 as a **simplified display boundary**, citing Gorbachev's resignation and acknowledging the December 24 UN continuity letter. It is not a universal constitutional timestamp or a rule for every former Soviet territory. Sources: [Office of the Historian](https://history.state.gov/milestones/1989-1992/collapse-soviet-union), [United Nations](https://www.un.org/en/about-us/member-states/russian-federation). Coverage is deliberately only 1991–1992.

The same date ranges can scope clothing, institutions, tools and introductions. No additional eras are needed for each regime. Source-date and local introduction questions belong in the refinements. These records establish historical starting conditions; future event simulation must not overwrite player-created outcomes with historical defaults.

## Compatibility and extension

`src/content/legacy-packs.ts` freezes the old v1 inputs. `catalog.ts` and `profiles/playable.ts` expose those inputs through the framework; `playable.ts` resolves building, role, animal, plant and player-outfit lists and checks required inventory eligibility. Exported packs remain byte-for-byte identical. The original generator, collision geometry, object placement, IDs, PRNG draws and snapshots are not migrated. Existing prop placement and generic NPC inventories are still hard-coded inside generation; do not claim the new catalog controls them yet.

For now, compatibility catalogs are derived from the frozen inputs rather than duplicating every prototype definition by hand. New content belongs in subject-specific definition files and regional profile files. Once new mechanics intentionally change worlds, version and migrate the relevant game content/save contracts; do not silently modify the frozen v1 inputs. Historical registry version 1 is distinct from game manifest `content: 1`. Future worlds that actually depend on new resolved rules must pin their historical registry version (and relevant choices) in their manifest, rather than re-resolving old saves against new research.

`index.ts` is an assembly list, not a master content document. Add a region/subject file when there is real data to place in it. Do not create 144 empty culture-era files. Present coverage: two partial compatibility profiles, two diagnostic research studies; two minimal baseline kits. All 144 combinations resolve, but most are explicitly unresearched. That is an honest framework state, not a restriction against future speculative coverage.

Future generation should consume the resolver's output and supplied context. Building settlement economies, households, layouts, weather, landscapes or new agents is outside this delivery. Item interactions are separately gated for user review.

## Review and checks

- `/history-lab`: family, profile, all twelve eras, exact date, placement context, explicit local capabilities, exploratory toggle, existing sprite previews, sources, rule explanations, coverage, reproducible URL and JSON export.
- The inspector branches before save loading, writer locking and the player API. `window.historyLab.describe()` returns a cloned report for automated inspection. It has no action API.
- `npm test`: chronology, malformed dates, source/definition references, all 144 combinations, exact-day politics, prehistoric hypotheses, exclusions/context/capability gates, conflict failures, pack equality, and existing saved-journey replay tests.
- `npx playwright test tests/browser/history-lab.spec.ts`: real browser interaction, links/report reproducibility, no save alteration, mobile overflow and invalid URL handling.
- `npm run build`: production TypeScript and Vite checks.

Before implementing item/prop mechanics, have the user review the era inspector and `PROP_PLAN.md`. This pause is explicitly requested by the user, not a general approval requirement for future maintenance.
