# Fauna

Wild and domestic animals: which species live where, how they are spawned,
how they behave, and which art sets draw them. Entry files:
`src/content/fauna/index.ts` (profiles, `faunaAt`), `src/world/v3/fauna.ts`
(spawning), `src/core/fauna-sim.ts` (behaviour), `src/core/fauna.ts` (state).

## How it works

- **Profiles.** `src/content/fauna/` holds flat species profiles by subject:
  `birds`, `domestic`, `working`, `temperate`, `big-game`, `megafauna`,
  `bears`, `foxes`, `dangerous`, `americas`, `pests`, `directional`. A
  profile names habitat tags, human tolerance, social organisation, diet,
  decision cadence, density and art. `herding.ts` chooses people's herds. `faunaAt(setting)`
  picks the species for a place and date using the same scopes as characters.
  `looks.ts` (`faunaLook`) picks forms and coats, some dated by breed;
  `combat.ts` holds tempers and attacks; `remains.ts` and `dung.ts` cover what
  animals leave behind.
- **Spawning.** `spawnFauna` in `src/world/v3/fauna.ts` places groups per
  block as chunks activate, scoring cells with `habitatTagsAt`,
  `habitatScorer`, `standingCrop` and `settlementDistance`.
  `forgetFaunaBlock` releases a block. Only environment worlds without a
  `situation` get wildlife.
- **State.** `FaunaGroup` and `FaunaMember` in `src/core/fauna.ts` are
  serialisable: one group decision drives several members.
- **Behaviour.** `advanceFauna` in `src/core/fauna-sim.ts` runs from the
  engine on simulation time: grazing, wandering, fleeing, resting, predation,
  attacks on people. `stepAllowed` and `wallowable` are its movement rules.
  Kills leave remains (`src/core/remains.ts`) that age and are pruned.

## Art sets

The game loads these atlases (`src/render/scene-assets.ts`):

- **Set B** (`public/fauna-b/`, `faunab-` frames): side-view birds and small
  animals, mirrored east/west. `npm run art:fauna-b` from `scripts/art/fauna_b.py`.
- **Four-direction rig sets**, each facing drawn separately, west mirrored.
  `npm run art:fauna-c` (`scripts/build_fauna_c.py`) builds all of them:
  `fauna-c` (horses, rabbits), `fauna-w` (their wild states), `fauna-m`
  (mammoths and other megafauna), `fauna-e` (living elephants), `fauna-r`
  (cervids), `fauna-f` (felids), `fauna-g` (grazers), `fauna-u` (bears), `fauna-o` (ratites), `fauna-k`
  (macropods), `fauna-x` (reptiles), `fauna-h` (hippos). Rigs are in
  `scripts/art/rig.py` and one module per body plan (`cervid.py`, `felid.py` …).
  `FaunaProfile.directions` marks these species; `faunaFrames(profile, state,
  facing)` picks frames.
- **Voxel horse** (`public/fauna-v/`): a horse and horse-drawn vehicles,
  from `scripts/art/voxel_rig.py` and `vehicles.py`.

Sizes are set against the 37 px adult. Coats are recoloured at runtime from
`looks.ts` roles.

## Where to extend

A new species: a profile in the right subject file, art on an existing rig
(or a new body-plan module beside the others), built by `art:fauna-c`. Do not
add a new atlas family for one animal if a rig set fits.

## Legacy, do not extend

- **Set A** (`public/fauna/`, `npm run art:fauna`, `scripts/art/fauna.py`):
  used only by `/fauna-lab` for comparison. Retiring it is welcome.

## Lab and checks

- `/fauna-lab` shows every set, state, facing and coat at native scale.
- Tests: `fauna` (art coverage), `fauna-world` (spawning and behaviour).
