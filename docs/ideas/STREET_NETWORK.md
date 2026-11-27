# A street network for residents' routes

Not built. A plan to make residents' daily routes cheap enough that a city can
give hundreds of them a routine, not 48.

## Why

Measured on London 1850 (1,528 residents), building routines across eight parts
of the city:

- A routine is about ten trips (home to work, errands, back), and every trip is
  a cell-by-cell route search (`leg` in `routineFor`, `world/v3/generate.ts`):
  96% of a routine's build time.
- Average routine 83 ms after the retry fix, slowest 1% over 0.2 s. With 48
  residents that is about 4 s of searching per city, which is why the budget is
  48.
- Each search is boxed to 40 cells beyond its two ends. Trips that must go round
  the Thames or a long wall find no way inside the box. 53 of 60 such failures
  had a path outside it. Searching unboxed finds them, at about 1.5 s each.
  Those residents drop the stop (233 dropped stops in 364 routines).

Most of every trip is street to street. Searching the street network once per
town, instead of every cell of every trip, removes most of the work and the box
failures with it.

## What the plan already has

- `plan.roads`: polylines of kind `street`, `lane`, `path`, `bridge`, with
  width, span and cost. `roadCells` in `roads.ts` rasterises one.
- `plan.junctions`, and `plan.lanes` per carriageway cell.
- `route` in `core/routing.ts`, with bounds and node budgets.

## The design

1. **Graph per plan, built once, lazily.** Nodes are road ends, vertices and
   every cell where two roads meet, including where a door's garden path
   (`plan.ts`, the `-door` paths) meets its street halfway down a block. Edges
   are the road between them. Bridges are edges like any other, which is what
   the box search cannot see. Keep it on the plan beside `lanes`, built the
   first time a routine needs it.
2. **Weight edges by walkable steps.** Not by `road.cost`: a street's `cost` is
   already its length, and a bridge's is the score that chose where to build it.
   Count the cells along the segment, with explicit costs only where walking
   differs (a footway preferred over the carriageway).
3. **A trip is three parts.**
   - Onto the network: a door with a garden path joins at the end of that path.
     A stop with none (a well, a field, a stall) takes a short cell search to the
     nearest street cell and splits that edge there, so nobody walks to a
     junction twenty cells off to reach a street one cell away. These ends use
     the resident's own `navigationCost`, so private yards and gates still apply.
   - Along the network: a graph search (hundreds of nodes, under a millisecond),
     cached per node pair for the plan. Only this shared middle is cached.
   - Off the network at the far end, as the first part.
4. **Back to cells.** Expand each edge through its road's cells. Where a cell on
   it is blocked (stall, parked car, lamp, cart), patch with a small cell search
   between the clear cells either side.
5. **Fallback.** No graph route, or a trip that never touches a street (inside
   one yard, across a square): the cell search as now.
6. **Keep the budget at 48 at first.** At 15 ms a routine, 250 routines would
   still cost about what 48 cost now, and the starting town's routines are built
   during preparation (`warmRoutines` in `generate.ts`). Measure the speedup,
   then decide how to spend it: a quicker cold start, busier streets, or some of
   each.

## Where else it helps

- `road()` in `wayfarers.ts` searches a three-cell lattice border to border for
  passers-by. Inside a town it could use the same graph; outside, keep the
  lattice. One router, not two.
- The player's `walkTo` and needs-driven residents (`findRoute` in the engine)
  hit the same box limit on long walks. They could use the graph later.

## Checks

Same London seed, budget 48, before and after; then again at a higher budget,
and Acapulco as a smaller settlement for comparison.

- The London probe: time per routine, failed searches, and stops dropped that
  an unboxed search shows were reachable.
- Begin to first movement on a cold start.
- Frame times while walking into the next neighbourhood, where the 24-cell
  re-ranking wakes residents (`focusRoutines`).
- People within 30 cells of the player on a central London street (11 now).
- Routines must come out the same for the same seed whoever asks first: the
  graph and its cache depend only on the plan.

## Scope

This crosses world generation, the routine builder and the engine's budget.
It runs in its own worktree and branch.
