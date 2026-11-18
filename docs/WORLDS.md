# Worlds: settings, geography and generation

How a prompt becomes a `WorldSetting`, how that setting is pinned, and how the
generator turns it into a world. Entry files: `src/content/geography/types.ts`
(the setting contract), `src/content/geography/defaults.ts` (`integratedSetting`),
`src/runtime/session.ts` and `src/world/worker.ts` (generator dispatch).

## From prompt to setting

- **Procedural.** `src/content/geography/resolve.ts` reads bundled place names,
  period words, dates, roles and seasons offline. Exact dates beat period
  words; a period picks a year from its range with the world seed. Years are
  astronomical (0 is 1 BCE). A household title selects a local palace plan and
  the room for that work. An explicit room takes priority, so a Roman noblewoman
  starts in the atrium and a Roman noblewoman in the kitchen starts there.
  Named residents carry a name, office, sex, birth year and playable years.
  Richard Nixon starts in the Oval Office in 1970. The West Wing is a simplified
  three-room plan based on the [post-1934 office](https://www.whitehousehistory.org/questions/has-every-president-worked-in-the-oval-office).
  The [public-domain congressional roster](https://github.com/unitedstates/congress-legislators)
  supplies historical US senators from 1859 onward. A title or date can select a
  different office for the same person: “Senator Richard Nixon” opens in the
  Senate chamber. Its desks follow the [Senate seating plans](https://www.senate.gov/art-artifacts/decorative-art/furniture/senate-chamber-desks/content/choosing-seats.htm).
  Visitors use the venue entrance. The setup preview shows the opening room.
  Unrecognised details are flagged, not dropped.
- **World Weaver.** If the local matcher cannot resolve a request, the optional
  `/api/world-weaver` endpoint (`server/world-weaver.ts`, Vercel handler
  `api/world-weaver.ts`) interprets it into the same fields, including
  coordinates for places outside the catalog. It uses `OPENAI_API_KEY` and
  `UHS_WORLD_WEAVER_MODEL` (default `gpt-6-luna`), is on when the key is set
  unless `UHS_WORLD_WEAVER_ENABLED=0`, and checks
  `UHS_WORLD_WEAVER_ACCESS_CODE` (`UHS_CLASSROOM_CODE` is an alias). Never give
  keys a `VITE_` prefix. The setting is saved whole, so replay never calls the
  model again. Tests inject a fake provider.
  For a particular scene ("Socrates about to drink the hemlock") it also
  returns `brief.moment`: a kind of room, who of the named kin and figures is
  there, and what they are doing. `Engine.startMoment` starts the player in the
  nearest building of that kind (their own house if the town has none) with
  those people standing round for three hours, and the life then draws no plot
  and seeds no ailments, and that day has no work card. The room is the town's
  ordinary interior of that kind, so a prison is a public hall. Each figure
  carries an age, a `tie` to the player and an `about` line onto their
  stand-in (`Actor.figure`); `dialogueContext` tells them who the player is,
  the day's hook and, for a documented figure, to answer as that real person.
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
| `geographyRevision` | 1 (integrated Earth geography) | absent: no regional context |
| `ecologyRevision` | 2 (RESOLVE colourways) | 1: climate-rule envelopes only |
| `roadRevision` | 1 (sparse regional graph) | absent: older routing |
| `streetRevision` | 1 (earth unless dated paving) | |
| `terraceRevision` | 1 (towns level and wall their steps) | |
| `placementRevision` | 1 unless supplied | 0: older placement |
| `characterRevision` | 2 (naming traditions, gated workforce) | 1: hand-written kits |
| `economyRevision` | 1 | |
| `worksiteRevision` | 7 | 1–6: earlier worksite sets |
| `friendshipRevision`, `employmentRevision`, `beliefRevision`, `namingRevision` | 1 | |

The schema for each is in `src/content/geography/types.ts`. Grep the field name
to find every branch it controls. Terrain, hydrology, vegetation and urban
layout have no field: there is one model of each. A local scene needs a setting
with an `environment`; `createSettlementWorld` throws without one, so pass
settings through `integratedSetting` (or `createSettingSession`).

## Generator dispatch

`createSession` picks the world builder from what it is given:

- **3, a setting:** `createSettlementWorld` in `src/world/v3/generate.ts`. Every
  playable world.
- **1, a pack id and no setting:** `createWorld` in `src/world/generate.ts`, a
  small authored town with the `roman` and `neolithic` packs from
  `src/content/legacy-packs.ts`. It is the fast fixture for mechanics tests
  (`createSession("roman", …)`, `smallSession` in `tests/fixtures.ts`) and the
  building lab (`src/dev/fixtures.ts`). Not a place to add generation rules.

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

## Vessels that are not ships

A start aboard (`below: "ship"`, `ship: <hull id>`) can also be a capsule in
Earth orbit, lunar orbit or open space, a submarine, an aircraft cabin, a
balloon basket, or one of two floors that are nowhere (`limbo` in mist, `void`
among stars, for a dream or an afterlife). They are hulls in
`src/content/ships/hulls.ts` with a `medium`, weight 0 so chance never draws
them; the ship system runs them like any voyage, and stepping out puts the
player at the setting's place. The local parser knows "in orbit", "lunar
orbit", "deep space", "submarine", "aboard a bomber", "balloon", "limbo" and
"the void"; World Weaver sets `vessel`. `MediumView`
(`src/render/ship/medium.ts`) lays the paintings in `public/backdrops/` behind
the hull and moves them: the globe turns under a fixed limb glow and night
side, clouds and their shadows cross the ground, mist drifts in two layers.
A staged opening's named people are not yet put aboard.

## Where to extend

- A new place or dated region: `places.ts` or a file in `regions/`.
- A new generation rule: v3 only. Gate it behind a revision field only if you
  must keep old output; there are no saves to preserve, so changing the
  current revision directly is usually right.

## Legacy, do not extend

Retiring these is welcome when you work nearby:

- Revision branches below the values in the table above (`ecologyRevision` 1,
  `placementRevision` 0, `characterRevision` 1, `worksiteRevision` below 7,
  settings without `geographyRevision`, `roadRevision` or `streetRevision`).

## Checks

```sh
npm run test:quick -- tests/world-weaver.test.ts
npm run agent:play -- --setting "Elizabethan London" --seed check
```
