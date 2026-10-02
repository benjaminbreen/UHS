# Plots, cast and the event card

Status: planned, September 2026. Bucket A of the narrative work; the
source-scenario half is shelved in `SCENARIOS.md` and will reuse what this
builds.

## What it is

Every life starts inside one plot, chosen by the game from the world's state:
a debt, a hungry season, a stranger, a levy. A staged title card names it.
A handful of people are marked as the cast. Things then develop when
conditions are met, not on a script. The plot ends in one of its resolutions,
and many of those are deaths. Real history was heavy and the game should be
too: debt bondage, famine, execution, children dying.

Everything here is seeded, deterministic code. No model call is needed. Luna
only rewrites card text when enabled, and never adds facts.

## What already exists

- `src/core/life-aim.ts` picks one of 12 lasting concerns from household
  history, with `eligible`/`bind` templates in `src/content/goals/life-aims.ts`.
  A plot is the life aim grown up, and replaces it.
- Relations: partner, parent, child, co-resident, servant, apprentice, master,
  friend. Households carry `history`, `fortune`, `owes`, `familyPlans`.
- NPC-initiated speech: the temple guard (`engine.challenger`, set near
  `engine.ts:6916`) is given an `errand` to the player, cues on arrival, and
  `App.tsx` opens `DialogueModal` with a `situation`. `blockComplaint` is the
  same shape. The approach mechanic generalises this; it is not new.
- `engine.cue()` emotes, `engine.event()` lines, `engine.rng(key)`.
- Player death with a cause (`p.dead`), shown by `CollapseNotice`.
- Map travel by road and rail (`src/runtime/map-travel.ts`), era vehicles in
  `src/content/conveyances.ts`.
- Theft noticed by owners, doors broken, walking off to the authority,
  give, trade, work, combat.
- Visual references: `Splash`/`SplashStars` (loading screen), `SkillSky`
  (the star skill menu), `Arrival`. Camera `zoomTo` in `WorldScene`.

## Engine gaps, built in the phase that first needs them

1. **NPC death outside combat**, recorded as a `died` household event and
   leaving remains or a burial. Needed by: Dying Elder, Hungry Season, Grief,
   Stranger.
2. **A newcomer spawned at the map edge** with a generated appearance and
   household-less status. Needed by: Stranger, Levy (the official), Accused.
3. **An NPC who travels with the player** across a map change. Needed by:
   Love (elopement), Journey (companion).
4. **A kin contact on the destination map**: a relation bound to a
   household there when the player arrives. Needed by: Journey.
5. **Sibling relation**, derived from a shared parent.

Saves do not exist yet; spawning and death need no version handling (see
memory note `no-saves-yet`). Keep plot state plain data in `engine.state` so a
future save system can serialise it.

## Data shape

The types are in `src/content/plots/types.ts`; The Debt in
`src/content/plots/debt.ts` is the worked example. `Condition` and `Effect`
are small closed unions of plain data, not callbacks, so a scenario from
sources can later write the same thing. Add a condition or effect only when a
plot needs it. Conditions still to come as plots need them: `fortune-below`,
`stock-below`, `regard-below/above`, `player-health-below`, `flag`, `any`.
Effects still to come: `injure`/`kill`, `spawn`, `set-flag`.

## Clocks

Many players will see only a few hours of game time (an hour of game time is
three real minutes). So a plot must open within minutes and develop within
hours. Most deadlines are hours away: "by sundown", "by noon tomorrow",
"before the levy marches at dawn". The longest, such as the Hungry Season's
harvest or the Dying Elder's last days, is 30 days at most, and even those
need a development in the first game hour.

Card and approach text comes from wording tables keyed by scope, like life
aims: one template per plot with era and culture slots, never a copy per
culture.

## The plots

† marks an ending with a death.

| # | Plot | Eligible | Cast | Developments | Endings |
|---|---|---|---|---|---|
| 1 | The Debt | `owes`, or fortune < 0.4 | creditor, authority | deadline passes → creditor at the door, regard falls; second miss → goods seized or creditor walks to authority; fortune rises → more time | paid · fled · goods seized · child taken as pledge · imprisoned · creditor dies † |
| 2 | The Mending | latest hardship bad-year, fire, robbed | healer, partner | start injured, store low; working while injured → health falls; store empty → child urge; healer visits → cost or remedy | restored by deadline · relapse † · partner breaks |
| 3 | The Grind | low standing, age < 35 | master, tempter, patron | savings threshold → a chance (ship, caravan, rail, workshop); tempter offers theft or enlisting; master learns → dismissal | set up alone · left with savings · caught stealing · worn down · † |
| 4 | Love and Trouble | unpartnered adult, marriage practice | beloved, obstacle, rival suitor | regard over threshold → obstacle forbids; rival household offers; beloved proposes flight; seen together → standing falls | wed · eloped · beloved married off · exiled · killing † |
| 5 | A Stranger Comes | settled world | stranger, authority | stranger arrives day 2; asks shelter; something stolen → town suspects; authority questions you | stranger leaves · joins · driven out · harmed † · brings sickness † |
| 6 | The Journey Out | age 14 to 25, younger child, or after Grind | parent, companion, contact | parting at the map exit; contact gone or dead on arrival; money runs out; danger on the road | settled · returned · died on the road † |
| 7 | The Dying Elder | elderly parent | parent, sibling, authority | parent's health falls daily; sibling's urge rises; death → rite → division by inheritance practice | fair share · disinherited · reconciled · feud |
| 8 | The Rival | same-livelihood household | rival, authority | rival's sales rise; undercutting; talk lowers others' regard; fire with suspicion; match offered between households | outsold · allied or married in · one ruined · violence † |
| 9 | The Hungry Season | farming, bad-year roll | landlord, tempter, child | stock below threshold → child urge; rent due; hoarder; crowd at the granary | reached harvest · emigrated · child dies † · player dies † |
| 10 | The Wrong Done | robbed in history | suspect, authority, witness | asking round, gated by regard; authority won't act; confrontation | restitution · revenge · forgiveness · wrong man punished |
| 11 | The Accused | low regard with authority, or a theft unsolved | accuser, authority, patron | summons with a day; patron speaks if regard high; flight | cleared · fined · flogged · exiled · hanged † |
| 12 | The Levy | adult man, or a household owing labour | official, partner, child | the day named; family urges peak; bribe or substitute if fortune allows; hiding → search | served (leave the map) · evaded · substitute paid · deserted · killed † |
| 13 | Grief | widowed or remember-dead | the dead (absent), kin | anniversary rite by the `dead-remain` stance; pressure to remarry; child asks | remarried · kept the house alone · the dead honoured · following them † |

Era and culture permutations to write into each plot's wording and
parameter tables, as starting points:

- Debt: a Babylonian temple barley loan with a son pledged; a medieval reeve
  and the lord's dues; a London chandler's slate and the Fleet; a Ming pawnshop.
- Mending: a vow to Asclepius; plague-year recovery in 1350; a factory injury
  with no wage.
- Grind: a Roman slave buying freedom from the peculium; a journeyman's
  masterpiece; a serf's year and a day in a chartered town; a Lowell mill girl.
- Love: a Song matchmaker and horoscopes; Roman *coemptio* versus elopement;
  bride-price in cattle; love across caste in Mughal Agra.
- Stranger: a pedlar, pilgrim, deserter, refugee, missionary, tax assessor,
  recruiting sergeant, surveyor.
- Journey: a Neolithic youth leaving their band; Compostela; a Tang exam
  candidate; the 1890 railway to Chicago.
- Dying Elder: partible versus primogeniture from `households/practices`;
  a Roman will; succession by adoption in a Japanese *ie*.
- Rival: Lyon bakers and the bread assize; Athenian potters; Edo rice
  merchants; two Iron Age smiths.
- Hungry Season: 1315, Ireland 1847, Bengal 1770, Maya drought.
- Wrong Done: wergild; private prosecution at the Old Bailey; a headman's court.
- Accused: ordeal by water; a Salem examination; the Inquisition; an
  Athenian court.
- Levy: Egyptian corvée; a legion levy; the press gang; Qin wall labour; 1914.
- Grief: Parentalia; ancestor tablets; a Victorian year of mourning; Día de
  Muertos.

## Cast and marks

- **Permanent cast**, red border, present in every life: partner, child,
  parent, sibling, and master/apprentice/servant where they exist.
- **Plot roles**, gold border, only while the plot runs. Bound from people
  who already exist (creditor from `owes`, rival by same livelihood and
  overlapping sales, beloved as an unpartnered adult in another household,
  and so on), except spawned roles (stranger, official).
- At most six marked people at once.
- Marks show on the focus card portrait and as a small marker over the
  sprite.

## Urge and approach

Each permanent cast member has an urge, recomputed each game hour from state
the engine has:

- child: hunger, clock, fear, age (the line differs at 5 and at 15),
- partner: regard drift, household stock, hours the player has been away,
- parent: age and health, days since last spoken to.

Plot roles get urge only from their plot's `approach` effects. Over the
threshold, the person gets an `errand` to the player (the guard pattern), and
on arrival cues, says a line through `engine.event`, and sets
`engine.approacher = { id, situation }`. The UI opens the dialogue on it if a
model is enabled. Otherwise the line stands, and talking to them answers it.
Ignoring them is allowed and has effects (regard, the child's hunger
unanswered). A cooldown stops nagging.

## The cards

One record feeds all of them:

```ts
type PlotCard = {
  kind: "title" | "turn" | "ending";
  plot: string; title: string; text: string;
  focus?: { role?: string; place?: string };
  choices?: { label: string; command?: PlayerCommand; flag?: string }[];
};
```

- **Title card**, once per life, after `Arrival`. Short by default: the
  game is meant to be easy to dive into. The plot's name, the era line
  ("Lyon, the autumn of 1771.") and one line of pressure and clock ("The
  miller wants his money by sundown."), over a star field in the language of
  `Splash` and `SkillSky`, with a quick, polished entrance and one button to
  play. It must look beautiful, not elaborate.
- **More**, a link on the title card, opens the staged version: letterbox,
  the camera finding each cast member in turn with an emote, and their
  portraits and roles sliding into a row. Nobody has to sit through it. Both
  are skippable, honour reduced motion, and work on phones.
- **Turn card**, for developments that change the world: a death, a fire,
  a summons, an arrival, a seizure. It uses the same visual language, but
  shorter: freeze, pan to `focus`, card, optional choices mapped to commands
  the engine has (pay is `give`, flee is `travel`). At most one per game day.
  Most developments are approaches, not cards.
- **Ending card**: the resolution and its aftermath. Choices: keep living, or
  let go. A † ending for the player hands over to the passing scene in
  `GENERATIONS.md`; until that exists, to `CollapseNotice`.

## Phases

Each phase ends playable. Verify with `npx vitest run tests/core.test.ts`
(life aims are tested there; plot cases go beside them) and one `npm run shot`
per new card. `npm run check` at the end of each phase.

### Phase 1: the runner and one plot (done)

- `src/content/plots/` with types and **The Debt**, wording for three eras
  (Babylon, medieval England, 18th-century London).
- `src/core/plot.ts`: pick by seeded weighted choice over eligible plots,
  bind the cast, store `PlotState` in engine state, evaluate conditions and
  apply effects each game hour from `engine.advance`, apply the daily hazard.
- The plot's aim replaces `lifeAimOf` on the task card.
- Generalise `challenger` into `approacher`; the Debt's creditor walks over.
- Cards render as plain text toasts for now.
- Tests: the same seed picks the same plot and cast; an unpaid deadline
  fires the door visit; giving the sum ends the plot paid.

As built: the runner steps every game minute, not hourly, so short clocks
bite. Paying is its own action (`pay` on the creditor's card) because `give`
moves one item at a time. It takes money where there is coinage and food
where there is not. Plot state crosses map travel, so leaving the map ends
the Debt as fled. No hazard yet: the Debt has no death ending until NPC death
lands in phase 5.

### Phase 2: the cards (done)

- `PlotCard` (`src/ui/PlotCard.tsx`, `plot-card.css`) with title, turn and
  ending variants. The engine queues `PlotCard` records in `engine.cards`
  (never saved); App shows one at a time when no other modal is open and
  holds the clock (`runtime.hold`) while it is up.
- The title card is short, with **More** opening the letterboxed cast
  introduction: plot roles in gold, the player's partner, children and
  parents in red, six at most.
- `WorldScene.lookAt(id)` pans to someone, but only someone the scene is
  drawing. People out of the player's sight are not drawn, so the camera
  stays on the player and the portrait and caption carry the introduction.
- Marks: a small diamond over marked people in the world, and a coloured
  ring on their focus-card and nearby-list portraits.
- One development fires per plot step, so each sees what the previous one
  did to the deadline and the debt.

Restyled after review, to the skills sky's pixel vocabulary rather than the
arrival screen's gold panel:

- Each plot carries a `look` (in its content file): an emblem and a
  five-colour palette (`ink`, `fill`, `edge`, `light`, `accent`). The card's
  frame, buttons and text take their colours from it; nothing is gold by
  default. New plots add an emblem to `src/ui/plot-emblems.ts`, drawn
  procedurally at native pixels.
- The Debt's emblem is a slate on a nail with a chalk tally, one stroke per
  unit owed. Its ending shows how it came out: wiped clean (paid), half wiped
  (seized), a wax seal (denounced), the chalk dropped (fled).
- Everything a plot person says arrives in a speech box: their portrait, a
  name tab, text typed out over the `blip` sound, **Answer** (opens the
  conversation on what they said) and **Later**. These replace the toasts.
  Plot lines spoken this way are written without the speaker's name.
- Titles use Pixelify Sans; prose stays in Baskervville.

### Phase 3: the permanent cast (done)

- `src/core/kin.ts`: `kinOf` (partner, children, parents, and siblings by a
  shared parent, since no sibling relation is recorded), `markOf`, and
  `kinCall`, which picks the most pressing reason one of them has to come
  over. Lines are in `src/content/plots/kin.ts`; a plot can add a
  `kin-partner` line for the partner to raise it.
- Reasons, most pressing first: a child (3 to 15) hungry or the household
  store empty; the partner raising the plot, once; the store nearly empty; a
  young child who has not seen the player for 4 hours; the partner, after
  19:00, when the player has been away 3 hours; a parent over 55 not spoken
  to for 5 hours; a sibling for 8.
- Checked every 10 game minutes. One call at a time, a plot's messenger
  first, none between 21:00 and 06:00, at most one every 90 game minutes,
  the same reason from the same person at most every 6 hours.
- A call unanswered for an hour (no talk or gift since) costs a point of
  regard and leaves a memory. Food handed to someone hungry is eaten at once.
- Residents parked out of the simulated ring have hunger capped at 30, so a
  child's hunger alone is unreliable; the empty store is what carries it.

### Phase 4: plots that need no new engine work

Mending, Grind, Rival, Hungry Season, Wrong Done, Accused, Levy, Grief. Each
with wording for at least three eras, its hazard, and a test that one
resolution fires.

### Phase 5: the engine gaps and the plots that need them

NPC death, newcomer spawn, travelling companion, destination contact. Then
Dying Elder, Stranger, Love, Journey.

### Phase 6: coverage and model text

- A headless pass over the character presets that prints the plot each one
  gets, to find eras or livelihoods with no eligible plot, and fill them.
  Extend an existing capture or test, do not add a script.
- With a model enabled, Luna rewrites card text and ending aftermaths from
  the plot's facts and the wording template. It adds no facts.
- The † ending hands over to the passing scene once `GENERATIONS.md` lands.

## Later

- The player ending one plot and starting another.
- The player choosing among eligible plots at arrival.
- Scenarios from sources (`SCENARIOS.md`) writing `PlotTemplate` data.
