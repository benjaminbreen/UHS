# Worlds: settings, geography and generation

How a prompt becomes a `WorldSetting`, how that setting is pinned, and how the
generator turns it into a world. Entry files: `src/content/geography/types.ts`
(the setting contract), `src/content/geography/defaults.ts` (`integratedSetting`),
`src/runtime/session.ts` and `src/world/worker.ts` (generator dispatch).

## From prompt to setting

- **Procedural.** `src/content/geography/resolve.ts` reads bundled place names,
  period words, dates, roles and seasons offline. Exact dates beat period
  words; a period picks a year from its range with the world seed. Years are
  astronomical (0 is 1 BCE). Unrecognised details are flagged, not dropped.
- **World Weaver.** If the local matcher cannot resolve a request, the optional
  `/api/world-weaver` endpoint (`server/world-weaver.ts`, Vercel handler
  `api/world-weaver.ts`) interprets it into the same fields, including
  coordinates for places outside the catalog. It uses `OPENAI_API_KEY` and
  `UHS_WORLD_WEAVER_MODEL` (default `gpt-6-luna`), is on when the key is set
  unless `UHS_WORLD_WEAVER_ENABLED=0`, and checks
  `UHS_WORLD_WEAVER_ACCESS_CODE` (`UHS_CLASSROOM_CODE` is an alias). Never give
  keys a `VITE_` prefix. The setting is saved whole, so replay never calls the
  model again. Tests inject a fake provider.
- **Places.** `src/content/geography/places.ts` holds featured anchors and
  aliases over the generated Natural Earth catalog (`places.generated.json`,
  built by `npm run prepare:atlas`). Catalog rank is modern prominence;
  `src/content/settlements/urban-form/` and `src/content/geography/onsets.ts`
  date it down (when a place can be a town, when farming began). Before the
  farming onset a place is a camp.
- **Content.** `src/content/geography/pack.ts` adapts a setting to the content
  and art packs. Buildings, households, props and labels resolve from
  coordinates and year; the twelve cultural families are fallbacks that dated
  regional files override.

## Pinned revisions

`integratedSetting` runs once, for new worlds only. Workers and replay use the
pinned values as they are. New worlds get:

| Field | New worlds | What older values mean |
|---|---|---|
| `terrainRevision` | 2 (environment model) | 1: the rev-1 relief study; absent: original landscape |
| `geographyRevision` | 1 (integrated Earth geography) | absent: no regional context |
| `ecologyRevision` | 2 (RESOLVE colourways) | 1: climate-rule envelopes only |
| `hydrologyRevision` | 3 (native water) | 1–2: main-water reaches; 2 adds swamp |
| `vegetationRevision` | 9 | 1–8: earlier spacing, mixes and understory |
| `urbanRevision` | 2 (dated block grammar) | 1: fixed lattice in `v3/urban-v1.ts` |
| `roadRevision` | 1 (sparse regional graph) | absent: older routing |
| `streetRevision` | 1 (earth unless dated paving) | |
| `terraceRevision` | 1 (towns level and wall their steps) | |
| `placementRevision` | 1 unless supplied | 0: older placement |
| `characterRevision` | 2 (naming traditions, gated workforce) | 1: hand-written kits |
| `economyRevision` | 1 | |
| `worksiteRevision` | 7 | 1–6: earlier worksite sets |
| `friendshipRevision`, `employmentRevision`, `beliefRevision`, `namingRevision` | 1 | |

The schema for each is in `src/content/geography/types.ts`. Grep the field name
to find every branch it controls.

## Generator dispatch

The manifest's `generator` picks the world builder:

- **3 (all new worlds):** `createSettlementWorld` in `src/world/v3/generate.ts`.
- **2:** `createAtlasWorld` in `src/world/v2/generate.ts`, for old generator-2 saves.
- **1:** `createWorld` in `src/world/generate.ts`, for the original pack presets
  and `src/dev/fixtures.ts`.

Fresh playable starts go through `prepareConnectedStart` in
`src/runtime/map-travel.ts` (see [TRAVEL.md](TRAVEL.md)).

## Geography

- Earth data lives in `src/world/geography/` (atlas, landscape, climate,
  noise, coordinates): 2,048 game tiles per degree, coastlines, major rivers,
  broad relief and climate. Fine relief, banks and habitats come from v3 (see
  [TERRAIN.md](TERRAIN.md)).
- Dated regional constraints (bounds, date ranges, named settlement footprints,
  land use, rivers, transport lines) are in `src/content/geography/regions/`,
  resolved by `src/world/regional/` (`context.ts`, `settlements.ts`,
  `transport.ts`). Known places beat procedural settlement rolls; an anchored
  region allows settlement only inside its footprints.
- The catalog's named places switch on from 1990; earlier coverage comes from
  dated regional files or the starting setting.

### Queries

`WorldModel.geography` (`src/core/geography.ts`) offers read-only `packAt`,
`placesIn`, `connectionsIn`, `resourcesAt` and `landPotentialAt`. Connections
carry `proposed`/`routed`/`blocked` status. Resource and land potentials are
physical opportunities, not stocks or prices. Boats, freight and trade should
consume these queries rather than build another network.

## Islands, rafts and camps

A setting can carry a `situation` (`src/content/geography/situation.ts`): a
landform and size, land/raft/boat/swimming support, a camp kind, population.
These starts use configured local terrain, not the Earth map. The local parser
handles "tiny desert island 20x8", "ww2 pilot downed, floating in atlantic",
"Everest base camp" and the like without a model. Camp kits are in
`src/content/settlements/camps/`, layout in `src/world/v3/camps.ts`, shelter
art in `scripts/art/camps.py`.

## Where to extend

- A new place or dated region: `places.ts` or a file in `regions/`.
- A new generation rule: v3 only. Gate it behind a revision field only if you
  must keep old output; there are no saves to preserve, so changing the
  current revision directly is usually right.

## Legacy, do not extend

Retiring these is welcome when you work nearby:

- `src/world/generate.ts` (generator 1) and `src/world/v2/generate.ts` (generator 2).
- Revision branches below the values in the table above.

## Checks

```sh
npm run test:quick -- tests/world-v2.test.ts
npm run agent:play -- --setting "Elizabethan London" --seed check
```
