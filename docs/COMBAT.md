# Combat

Two things fight in the game today, and a third is being tried out.

- **Animals** are hunted and fought on the map grid: `src/core/combat.ts`,
  `src/core/fauna-sim.ts`, `docs/FAUNA.md`.
- **Brawls with people** run in the engine's six-second ticks: `brawl()` in
  `src/core/engine.ts`, described under "Robbery and fights" in `docs/LIVES.md`.
- **The skirmish** is a real-time fight for people with weapons. It is played
  only on the battlefield (`/arena`, linked from Settings → Journeys), a
  feature of its own beside the world.
  Nothing in the world starts one yet.

## The skirmish

`src/core/skirmish.ts` is the whole simulation: tiles and seconds, a fixed
sixty steps a second, seeded, with no knowledge of the map or the renderer.
The player and every other fighter act through the same `Input` (move, run,
aim, attack, guard, jump, special, swap), so `think()` is only an input source.
The arena binds it to the game's own keys: WASD, Shift to run, Space to jump,
F to strike and held for the power blow, E for the special. G or the right
mouse button guards and X changes weapon.

- **Blows.** A press is a quick blow, telegraphed for its `windup`. F kept
  held after it winds up the wide swing, on the game's own timings: let go
  past 0.55 seconds for a half circle at half as hard again, past 1.1 for
  the whole circle at double. A point does not go round; it reaches further.
- **Answers.** A guard raised in the last fifth of a second is a parry: the
  attacker reels and the next hit on them is doubled. A guard held longer
  blocks and costs wind; out of wind, the guard breaks. Red telegraphs cannot
  be blocked.
- **The jump.** Space jumps the way you are going, further at a run, and for
  most of it nothing lands. An attack pressed in the air comes down with the
  landing as the weapon would do it: an edge over the head, a point driven
  in, a club into the ground that floors whoever is round it, a kick.
- **Wind and footing.** Stamina pays for blows, blocks and dodges. Poise is
  what a blow takes before the struck stagger; armour gives more of it.
- **Weapons** are `Arm` records in `src/content/arms/weapons.ts`: seventeen
  families with a reach, an arc, timings, a kind of harm and one special move
  (shield bash, sweep, brace, hook, flurry, lunge, unhorse, couched lance,
  aimed shot, bayonet, burst). A named weapon is a family with a few
  numbers changed and a note. A fighter carries a main weapon, a second and
  sometimes more (a legionary's pilum, a rifleman's grenades); X goes round
  them, and a thrown one leaves the hand when the last is gone. Missile ranges and reloads come from `launchers`
  in `core/combat.ts`.
- **Armour** answers the kind of harm: `armours` in the same file. It is read
  from what the person wears (`wearing.armour`, `wearing.shield`).
- **Horses** keep their speed and turn slowly. Space puts a moving horse at
  a leap: half a second clear of stakes, wire and blows, and an attack
  pressed in the air lands with it. A lance strikes by itself at
  speed, a horse knocks down whoever it rides into, and a braced spear or pike
  (or a row of stakes) turns the charge's speed against it.
- **Missiles** are lobbed onto a spot or shot flat. Shields stop a share of
  arrows from the front and none of the bullets. Guns suppress: under fire a
  rifleman goes prone, which is the guard key with a gun in hand.
- **Units and nerve.** A unit has an order (hold, advance, charge, loose,
  skirmish, fall back) and morale. Deaths, charges and blows from behind take
  it down; at nothing the unit runs. Green troops break near four in ten
  down, the best near three in four.
- **No two days the same.** Each fight rolls how each side's blows tell
  (within fifteen parts in a hundred), each unit's nerve, each man's skill
  and how late the orders come. The set battles are sized so that either
  side wins between a quarter and three quarters of the time with nobody
  playing.

`src/content/arms/kits.ts` lists the fighters (who they are dressed as, what
they carry, how skilled) and `battles.ts` the set pieces. The arena dresses
each kit with the game's wardrobe for that place and year.

## The arena

`src/arena/`. Match-up mode sets any kit
against any other in any numbers; Battle mode puts the player in a unit, on
either side, or watches. `/arena?battle=agincourt&side=watch` and
`/arena?you=samurai&foe=knight&foes=3` open a set-up directly; `&auto=1` lets the
computer play the player.

The view is a canvas of its own. It draws people with the game's doll and
horses from the fauna atlas, and turns the simulation's `events` into arcs,
blood, sparks, smoke and sound.

## Moving it into the game

Half done. What exists:

- `src/core/skirmish-bridge.ts`. `fighterOf(actor, …)` reads a real person:
  what is in the hand, the sidearm at the hip, armour and shield from
  `wearing`, a horse under them, and a skill guessed from their work unless
  one is given. `resultsOf(sim)` says what the fight did to each.
- `armFor(id)` in `content/arms/weapons.ts` gives any held thing a weapon. A
  farm tool or a stick takes its strength from the hunting table, so the two
  tables cannot disagree.
- `Engine.settleFight(results)` writes it back: health, injuries on the
  player by the kind of harm (`WOUNDS`), the dead, and a player beaten down
  with fists or a club collapsing as the brawl already has it.
- `Setup.blocked` lets the walls of a real place stand in a skirmish.

What is left: something in the world to start one (a robbery, a press gang,
a brawl) in place of `brawl()`, the world scene drawing it from the same
`events` the arena view reads, and the bystanders, witnesses and regard that
`brawl()` handles and a skirmish knows nothing of.

Tests: the skirmish cases at the end of `tests/combat.test.ts`.
