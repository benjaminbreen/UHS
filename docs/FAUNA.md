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
  A venomous snake's bite (`venom` in `combat.ts`: share of bites that inject,
  untreated deaths, hours) starts a `venom` illness on the player that runs
  over hours; see `docs/LIVES.md`. People keep clear of venomous snakes:
  routes (`findRoute`) never cross a snake's cell and pay heavily to pass
  beside one. A walker who comes within two cells starts with a "!" (the
  `alarm` cue), often shouts "Snake!", and re-routes; one who ends up beside
  it may be bitten (vipers and adders more often, as they give no warning),
  and the venom runs its course on them as it would on the player
  (`mindSnake`, `poison`). The player gets the same "!" when one is within
  three cells (`snakeWatch`).
  A snake's day is `snakeLife`. Day snakes bask on open ground beside cover
  in the morning and late afternoon and lie up in cover through midday heat
  (30°C), rain and rest hours; night snakes lie up all day and hunt rats
  after dark. Cover is growth, rock or the foot of a wall, tree or house
  (the engine's `cover`). A snake lying in cover is `hidden`: drawn faint,
  left out of route planning, and noticed only from the next cell. Footsteps
  within four cells send most species away to other cover on the far side
  (`SLIPS`; a mamba at three cells a tick); Russell's and saw-scaled vipers
  mostly lie still and hold their ground, and `threaten` takes over.
  Kills leave remains (`src/core/remains.ts`) that age and are pruned.
- **Henhouses.** Where a yard kit (`src/content/settlements/yards.ts`) gives
  a household a henhouse, `plan.ts` builds a small walk-in building
  (`yard-henhouse-*`, claim `yard-henhouse`) behind the house, or with the
  byres beside it when the back yard is too shallow, and links the
  household's flock to it by `house`. The flock routes around obstacles to
  reach the henhouse at dusk and is out of sight and out of a predator's reach
  until morning (the sim reuses
  `burrowed`), lays into `eggs` each day, and stays in while `shut`. Inside,
  the nest boxes give up the eggs and the perch shuts or opens the pop-hole.
  A raider from the raid plot is turned away by a shut henhouse and takes a
  bird from the player's open one. Without any plot, a night with the
  player's pop-hole open has a one-in-four chance of losing a hen to the
  local fox, jackal or coyote (`nightRaid` in the engine), with feathers
  left at the door. Where there is no room at all the coop is a prop and
  the hens roost beside it.
- **Byres.** The same for cattle (`yard-byre-*`, claim `yard-byre`): a cow
  or two of the local milking species, out by day and in from dusk until
  eight, giving `milk` morning and evening and more on a manger filled the
  day before. Inside, the stall is milked at and the manger filled. A byre
  stands in the yard's back corner, or on the nearest clear ground for a
  stock-keeping household, which has a lot rather than a garden yard.
- **Who works there.** The dairy trades (`dairymaid`, `milkmaid`,
  `dairy-farmer`) have their own recipe whose first and last steps are `at:
  "byre"`, a place role that resolves inside the household's byre, and their
  household always gets one. Smallholders (`cottager`, `crofter`) always get
  a henhouse. NPCs of those trades begin and end the working day inside, and
  the player of one has an even chance of starting the game there
  (`startAtWork`). There is no poultry trade: the profiles' work lists are
  generated, and none offers one.

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
- **Draft teams.** The pony cart, hooded buffalo cart and the plough (paired oxen on dry land or one water buffalo in a paddy) draw their own kept animals from the directional fauna atlas, with their individual coats. Hitched members follow the implement and resume ordinary herd movement when unyoked. Cart beds, wheels and the plough beam use the conveyance atlas. The chariot still includes its horses in its baked frame.
- **Riding.** Rideable species (`src/core/riding.ts`: horse, pony, wild horse, donkey, camel, water buffalo, yak, reindeer, llama, elephants, ostrich, zebra) can be mounted with `E` (leaving `F` free to swing), steered through four gaits (walk, trot, gallop, and rhythmic cadence spurring), jumped over fences and streams (`Space` while moving, with a higher mounted arc and leap/landing SFX), reared at a standstill (`Space`), patted/fed (`F`), and dismounted (`E`). Clicking a horse in the world plays a whinny/neigh. Wild mounts require a short hold-on rodeo to break; mounted players and NPCs render the real directional pixel-art animal sprite paired with their animated pixel-art character doll (`ride` / `ride-gallop`). Full-sized `horse` uses `scripts/art/horse.py` (64×56 canvas, 8 directions, 4 builds — riding, collared workhorse, barded war horse, sleek race horse — 8 role-swappable coats, and 7 eight-frame states including `graze`, `trot`, `rest`, and `rear`, plus a gentle head-dip when mounted/patted/fed); the compact 40×35 sprite in `scripts/art/fauna_c.py` is recast as `pony`.
- **Voxel horse** (`public/fauna-v/`): the ridden horse and rider layers, and the conveyance equipment,
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
