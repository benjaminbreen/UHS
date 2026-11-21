# Bicycles and motorcycles

Seventeen kinds of machine, from the 1817 running machine to the sports
motorcycle, each drawn procedurally, parked about towns of its period and
ridable. They extend animal riding (`docs/FAUNA.md`, `src/core/riding.ts`):
a ridden cycle is `player.riding` with a `cycle` field, so everything that
already asks "is the player mounted" holds.

## Where the code is

| What | File |
|---|---|
| Kinds, period and region weights, looks, handling model, tricks | `src/core/cycles.ts` |
| Pixel painter: eight headings, parked and fallen | `src/render/cycles/paint.ts` |
| Scene textures, and drawing the ridden and parked machines | `src/render/cycles/sprites.ts`, `rider.ts` |
| Rider poses (`cycle`, `cycle-tuck`, `cycle-high`, `cycle-ape`, `cycle-scoot`, `cycle-stand`, `moto`) | `src/render/characters/doll/draw.ts` |
| Mount, park, spill, bell, pump, buy | `src/core/engine.ts` (`mount-cycle`, `cycle-spill`, `ring-bell`, `cycle-service`, `buy-cycle`) |
| Input, momentum, skids, air tricks, sounds | `WorldScene.cycleInput` and the methods beside it |
| Placement in towns | `parkCycles` in `src/world/v3/plan.ts` |
| Passing riders | `wheelman`, `cyclist`, `motorcyclist` in `src/content/wayfarers.ts` |
| Rack, pump and jump art | `scripts/art/props_b/kerbside.py` |

## The machines

`CYCLE_SPECS` gives each kind its years and handling; `cycleKindsFor` weights
them by region and year (high wheels in the 1870s and 80s West, the black
roadster everywhere after 1890, mopeds across south-east Asia from the 1980s,
no motor before the region's `modernity().motor`). A `CycleLook` is one
machine: kind, paint, tyres, saddle and what it carries (basket and its
load, rack, box, panniers, mudguards, spoke reflectors, flag, streamers),
drawn deterministically from a key.

The painter authors geometry small and lays it out larger (`K`), so a wheel
stands as high as a chibi rider's hip. The saddle, pedals and grips are placed
from `CYCLE_SEATS`, which the doll's poses read too: change a seat there and
both move together. A machine is two layers, one behind the rider and one in
front, so the front wheel and bars cover the legs head-on and the back wheel
covers them from behind.

A machine has eight headings, like the doll that rides it. Side, head-on and
from behind are drawn; the four diagonals are the side drawing turned an
eighth in `Layer.put` (three columns become two and step one row, a clean
two-to-one line), with the tread's width and the handlebar drawn across
afterwards. A new kind drawn side-on gets its diagonals for nothing. The
scene passes the eased eight-way facing, so a turn swings through the
headings between, and a 360 in the air goes round all eight.

Review sheet: `npm run capture:characters -- cyclists`.

## Riding

- `E`/`F` beside a machine gets on; the alternate verb gets off. Beside a rack
  it is locked there.
- Holding a direction builds speed toward the kind's cruise; `Shift` sprints
  (or opens the throttle). Tapping `Shift` in rhythm is the same cadence burst
  as spurring a horse and costs breath on a pedal machine.
- Letting go coasts. Pressing the way back at speed locks the wheels into a
  skid; a sharp turn at speed drifts. Soft ground slows a road machine far
  more than a mountain bike (`rough`). A drop in ground level adds speed.
- Hitting something at a sprint is a spill: the machine goes down, the rider
  is thrown, and on a high wheel that happens at cruising speed and goes over
  the bars.
- `Space` hops (kinds with `hop`), or pops a wheelie at a standstill. A jump
  prop under the wheels at speed throws any machine three cells.
- In the air on a BMX, mountain bike, chopper or dirt bike: the key against
  the way of travel is a backflip, with it a front flip, across it a tabletop,
  `Space` again a 360. Landed tricks score style, chained landings multiply
  it, and a flip not brought round is a spill.
- The primary verb rings the bell or sounds the horn, which scatters birds.
  Beside a pump it tunes the machine (8% faster until its next spill).

`cycleStep` in `src/core/cycles.ts` is the whole handling model and is pure;
`tests/cycles.test.ts` covers it.

## In the world

A cycle standing about is a `WorldObject` with a `cycle` look and no atlas
sprite: the scene paints it. While ridden its object stays in
`state.objects` marked `carriedBy`, because `populateNearby` restores any
initial object missing from the list.

`parkCycles` stands machines by doors (more where everyone rides), at the
kerb's racks, and for sale outside one shop per town from 1890, which it
renames and gives a pump. From 1972 it lays a line of two jumps on open
ground. Shop machines carry a `price` and the shopkeeper as `owner`; riding
one off unpaid is theft like any other.

## Not built

- The bicycle shop has no building frame of its own. It is one of the town's
  ordinary shops (a general dealer's where there is one), renamed, and known
  by its signs: the `bicycles` trade letters its board (`signs.ts`,
  `sign-words.json`) and the `Wheel` emblem hangs where the street hangs
  trade signs. A front with no sign slot and no hung signs shows only the
  machines and the pump outside.
- Residents do not ride. Only passing travellers do.
- No touch controls for tricks.
