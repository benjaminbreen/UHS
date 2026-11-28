# Lives: body, illness, death, bonds and concerns

What makes one life particular and what can end it: lasting conditions,
illness and care, hunger and danger, death and going on as kin, bonds, and
the concerns the opening card reads. Entry files: `src/core/health.ts`,
`src/content/health/`, `src/core/bonds.ts`, `src/core/concerns.ts`,
`src/core/danger.ts`, `src/ui/DeathCard.tsx`.

A person remembers their four latest gift exchanges and household greetings or warnings. Conversation uses the same account shown in recent events, including whether they refused an offer or ate the food. An awake resident who sees an uninvited stranger enter can ask them to leave. Invited guests, friends, close family and visitors with a warm household relationship get a welcome. Answer opens the conversation with that resident. Walking away ends the warning. Nearby traders call out an item they have for sale, with its current price or an offer to barter. Locate points to the seller, and Trade opens the shop with that item selected.

## Conditions

`src/content/health/conditions.ts` with `conditionsOf` in
`src/core/health.ts`. These are lasting conditions such as hearing loss, a
limp, smallpox scars, recurring malaria, consumption or a stammer. Each has a
rate by age, sex, era and place, a period name with a modern gloss, and
plain lines. They derive from the seed like stats, so every resident has them
at no storage cost. Rates are realistic: before modern medicine most adults
had something. No slurs; a period term gets the modern name in its gloss.
Conditions colour text; they do not yet change play.

A condition's `body` says how it shows and what it stops, for residents and
the player alike (`conditionBody`). The player starts with their own at the
same rates, and the opening says so. A limp slows the walk. A twisted foot
before 1960 means a crutch, no running and no climbing. A wooden peg (before
1950; after it, a fitted leg and a slight limp) means no running and no
climbing. A lost arm means no climbing. Withered legs mean a wheeled board
rowed along on hand-blocks before 1850, calipers and crutches until 1930, and
a wheelchair after. From 1930, paralysis from the spine also means a
wheelchair. Board and wheelchair rule out running, climbing, jumping down and
riding. The validator answers "Not with withered legs." A wheelchair also
needs level ground or a slope: it will not go up or down a bank, take the
wall stairs or a walk-up tower's stairs, and route-finding goes round banks.
Before 1990 (the ADA) any door but your own has a step, which costs time and
a hand from inside. Blindness, leprosy
and a lost arm are looks: the blind carry a stick with their eyes shut, lepers
wear linen over mouth and hands. A lasting look (board, wheelchair, peg) shows
over a mending injury; otherwise the injury's sling or crutch shows. About
one player in a hundred starts restricted, and about one in twenty with a limp.

A start can ask for a condition. The setting's `condition` (one of
`requestableConditions`) is given to the player on top of the roll and stays
with them across maps and years. The procedural parser reads words such as
"wheelchair", "blind", "leper", "one-legged", "club foot" and "disabled" (one
picked at random), and a prompt with nothing else gets a curated place.
World Weaver sets it when asked, or for a figure known to have had one.
Paralysis before 1930 becomes withered legs, so a wheelchair asked for in
1350 is a wheeled board.

On top of that, about one adult resident in fifty before 1950 (one in 120
after, more in hard trades) is mending an injury in any three-week spell and
shows a sling, a bound hand or head, a crutch or a splint
(`residentLook`). Lame residents limp. All told, a premodern town shows
something on about one person in eleven.

## Illness

Acute illness lives in `state.ailments` (`src/content/health/ailments.ts`):
fevers, flux, coughs, childbed, smallpox, measles, plague in plague years,
broken bones. Residents too ill to work rest in an available ward bed if a hospital is within 60 tiles of home. Otherwise they rest at home. A death removes the person and writes
`died` into the household's history, with its cause.

Every `died` in a household's history has a grave (`src/core/graves.ts`). A
household buries in the nearest ground. The ground fills in order of death and
is then reused, so the newest dead keep their markers and the oldest markers
belong to nobody anyone remembers. Looking at a grave says who lies there,
whose kin they were, when they died and of what where the game knows. A marker
that would carry writing (a headstone, a Chinese stele, an Ottoman stone, a
gorinto) is read; any other is known by the people who live there. A dead
player is in the same record, so their heir finds the grave. Residents sent to
the graves go to their own household's latest one.

Illness, death and want reach the rest of the town through
`src/core/household.ts`. The rule: the household ledger decides what
happens, town-wide and whether or not the player is near; residents show it
through the day's agenda. Sudden things (fire, a fight, an arrest) stay on
the engine's errands.

- **Conditions** (`householdConditions`, derived hourly): who in a house is
  laid up, whether it is in mourning (three days after a death in play) and
  burying today (the first day), whether it is short of a staple, who it
  shuns, and whether a member is serving a public sentence. Someone laid up
  counts as no worker in the ledger.
- **The agenda** reads them through the `household` trigger
  (`src/content/days/types.ts`; occasions in `days/general.ts`): the house
  buries its dead at the burial ground with kin from elsewhere, keeps at
  home and does no work while mourning, kin call with food, someone goes
  home at midday to the sick, one of a house short of bread goes to ask its
  seller, and the sentenced stand in the market. A routine is rebuilt the
  next time its owner is home at rest after a condition changes in their own
  house or a kin house; nobody else is rechecked.
- **Hunger.** A house short of a staple eats late and little: its people
  stay on their routines at up to hunger 80 and may ask the player for food.
- **Regard between households** (`state.houseRegard`, sparse, `from>to`,
  with the wrong behind a bad one in `state.houseWrongs`), settled daily by
  `settleRegard`. It fades by a tenth. A house sours on the seller who let
  it go short (not one that is ill or in mourning) and on a debtor (ordinary
  credit stops at -2; a hardship debt keeps souring). A house short of bread
  is sent grain by kin who have it to spare and warms to them; a poor one
  with nobody may take grain from a neighbour's store, which is written into
  the victim's history. A house in trouble warms slowly to its kin. Each of
  these starts a rumour marked `conduct`, which moves every hearer's
  household for or against its subject; news that is nobody's doing does
  not. At -3 a household makes no kin calls.
- **The keeper** (`hearCase`, daily, never the player's household; the
  player's cases are `keeperStep`): at -4.5 with a wrong on record, the
  sorest quarrel is heard. Severity is its depth plus the accuser's rank
  over the accused's, doubled before 1850 (`keeperStep` weighs rank the same
  way). A debt is seized in grain and cleared, a fine or compensation moves
  household fortune, shaming or labour puts the accused in the market for
  the day. The town hears of it, the loser resents the winner, and the
  accuser's regard cools to -1, or -3 if sent away.
- **Where the player meets it**: dialogue context names who the speaker's
  house has fallen out with; a house's place brief carries `houseTalk`, one
  sentence on a sentence, a death, a quarrel or an illness there.
- **A world opens with it under way** (`seedHouseholds`, when a map's ledger
  first opens): debts already soured, a house robbed lately suspecting its
  poorest neighbour, a quarter of the houses that buried someone this year
  still in mourning, the morning's gossip gone round, and the affected
  routines rebuilt before anyone is seen.

New worlds pin `manifest.disease = 1` (`src/runtime/schema.ts`), which turns
on transmission (`src/content/health/infections.ts`):

- Respiratory infection builds with shared indoor and close time.
- Provisions can expose a household.
- Open wounds can become infected.
- Incubation precedes symptoms, and recovery gives temporary protection.

Practitioners must actually exist nearby and supplies are finite. Treatment
changes recovery and mortality. Diagnoses and latent outcomes are research
only. Rates are inferred game calibrations; the sources are in
`infectionEvidence`.

**Care.** Care cards (`src/content/cards/care.ts`) wait in `state.care`,
apart from the work. For the player's own illness they offer the healer, lying
up, a household remedy, prayer or keeping on, with honest odds: before germ
theory a fee bought care, not a cure. For kin they offer sitting with them or
sending for the healer. The `care` command and the body panel expose the same
treatments. A card's `risk` effect can start an illness. Illness wears health
down and costs up to half of strength, agility and endurance
(`engine.stats()`).

**Hazards.** Drowning, falls and rock falls are choices on hazard cards
(`src/content/cards/hazards.ts`, filtered by trade), not silent rolls.
Falls on ice and going through it are in [WATER.md](WATER.md), "Ice underfoot".

## Injuries

`src/content/health/injuries.ts` lists the player's injuries: a part (leg,
arm, hand, ribs, head, face, skin), a grade (1 sore, 2 laid low, 3 a broken
bone or worse), days to mend, whether it is open (and can go bad) and whether
it is a bone. `injuryLimits` turns part and grade into what it stops, easing
as it knits: a broken leg walks at 0.4 pace and comes back, running returns
at three quarters mended, climbing and riding at six tenths. `engine.gait()`
gives the renderer the pace and limp; `validate` refuses the run, the climb,
the jump and the mount ("Not with a broken leg.").

Where they come from (`hurt(damage, cause, injury)` and `pickInjury`):
falls (a two-level drop turns an ankle about a third of the time and breaks
something one time in seven; higher, a broken leg is likely), coming off a
cycle (collarbone and wrist when fast), a car crash (worse before 1970),
being thrown by a mount, animals (horned beasts gore and crack ribs, the rest
bite and maul), blows in a fight (a black eye, a split lip; a weapon cuts or
concusses), a beating that puts the player down, burns and lightning, and
trade hazard cards. A worse injury already mending is not replaced.

A grade 2 or 3 injury stops the world for a moment (`injured` signal,
`src/render/injury-scene.ts`): the view closes in and darkens round the
player, who doubles over and sinks to a knee (`wince` pose), the hurt part
throbs red, and a lament plays under the ducked score (`injured` in
`sfx.ts`). Then `SetbackCard` (`src/ui/Skills.tsx`, from `engine.setback`)
names it and lists the new reality. A healer, bonesetter, surgeon or doctor
can set a broken bone (the `consult` care option): it mends in 70% of the
time. The figure wears it while it mends (`hurtLook`, drawn by the doll in
`draw.ts` and `head.ts` from `appearance.hurt`): a crutch under the right arm
for a broken leg, the bad foot held clear and swung through with it, giving
way to a stiff splinted leg; a sling across the chest for a broken arm or
collarbone; a bound head (hidden under a hood), a plaster on a cut face, a
bound hand, a bandaged arm for bites and gashes, and a hand guarding cracked
ribs. Idle, the player shifts weight on the crutch, touches the bandaged
head or winces. `npm run capture:characters -- sprite-study` with
`HURT=crutch` draws a look. An unset broken leg knits crooked half the time before 1900, a fifth
after, and the `crooked-leg` scar limps for life.

## Body and danger

New worlds pin `manifest.survival = 1`:

- Hunger rises about two points per game hour, and eating uses carried food.
- High hunger and fatigue reduce physical ability.
- After two full days at maximum hunger, health wears down.
- Sheltered sleep restores fatigue. There is no thirst upkeep.

`src/core/danger.ts` rates the ground nearby from buildings, cover, people,
guards and darkness. NPCs defend themselves and can retaliate after
serious provocation, with a visible threat first.

## Robbers and accosters

In every game, not only survival, the player can be stopped out of doors
(`roadEncounter` in `engine.ts`). `src/content/accosters.ts` says who, by place
and era, each with a source note: latrones on Roman roads, highwaymen and
footpads in Georgian England, a press gang in its ports, marauders in the
Thirty Years' War, dacoits, klephts, tufei, cangaceiros, bushrangers and
general robbers where nothing more specific is on file.
- **Where.** A lonely road (danger's area risk) by day or night, or a town's
  streets after dark. In a town by day a pickpocket may lighten the purse with
  no confrontation.
- **How often.** The danger's hourly risk times the accoster's `rate`: high in
  wartime and on lawless frontiers, low after modern policing. One encounter
  per twelve hours at most.
- **The scene.** The party walks up dressed and armed as their livelihood, and
  a card offers pay, run or fight (press gangs: argue, run or fight). Fighting,
  or being caught running, starts a real fight. Robbers who beat the player
  take half their coin, and one with a blade can kill; a press gang holds
  them two days.

The same people are livelihoods (`src/content/characters/outlaws.ts`), dressed
by `wardrobe/regions/outlaws.ts`, with days in `recipes.ts` and cards in
`cards/outlaws.ts`, so the player sometimes starts as one.
`npm run capture:characters -- accosters` draws them.

## Death and going on

What kills: illness, hunger, burns, drowning, falls, an animal, a blade, a
crash, a train, lightning, venom.

- **Lightning** (`lightningExposure`). In a thunderstorm (`Weather.storm`,
  warm heavy rain) a strike on the player is rare in the open, about four
  times likelier beside a tree and eight times up one or on a roof, more on
  the water or horseback; never indoors or in a car. A third of those struck
  die; the rest are burned and knocked down. The scene flashes and throws
  bolts through any storm (`src/render/lightning.ts`).
- **Hail** (`hailExposure`). Heavy hail (`Weather.hail` of 0.6 or more)
  bruises a player caught in the open, once a storm and never fatally unless
  they were nearly dead; a tree overhead, a roof or a car keeps it off.
- **Snakebite** (`envenom`). Most bites from the venomous snakes inject; the
  rest are dry. Venom is an illness (`venom`) that runs from five hours (a
  mamba) to three days (a saw-scaled viper), with the snake's untreated death
  rate. Rest and a healer help a little; antivenom, from 1900 where a doctor
  has modern stock, turns most deaths.
- **Trains** (`trainExposure`, `trainOver` in `railway.ts`). A moving train
  that runs over the player's cell on a town's line kills them, checked over
  each six-second tick so a fast train cannot skip a cell. A standing train
  hits nothing. Townsfolk on their rounds wait for it; someone on the line in
  a fright or a fight (`terror` or `offRoutine`) is killed too.
- **Out of their depth.** A swimmer who tires out (`washAshore`) wakes on the
  shore with little health left, unless they were already down to 30 or less:
  then they drown.

A cycle or car that hits something fast enough may kill its rider
(`crashKills` in `engine.ts`); the chance climbs with speed past a floor, and
a car before seatbelts (1970) is worse.
A fall's harm grows steeply with height (`fall` in `engine.ts`): one storey
hurts and may injure (see Injuries), two cripple, three or more kill. Jumping
off a town wall walk is about two storeys and off a tower three; a field wall
or hedge is a hop. A jump mid-roof hops along it; only
the edge drops to the street. An animal that takes the player's health to
nothing kills them (mauled, gored, or taken in the water), as does a blow
from an edged weapon. A beating with fists or a club puts them down instead,
and they wake carried home or where they fell (`collapse`), with an injury
the wake card spells out.

The body falls in the world where it happened: struck, then laid on its
side, with the dark gathering round it. When the player dies, in a day or in
the years, `DeathCard.tsx` first plays
a short scene: a knell, the world darkens round the player with a "…", the
figure rises in the `transcend` pose as the passing music begins, and the
place their tradition sent them fills in behind, with two lines. Click skips
it. Each belief system names a `realm`, and `src/content/beliefs/afterlife.ts`
judges within it by what that tradition cared about: conduct for Latin
Christians (gossip about the player, from `deeds()` in `word.ts`), the
weighing of the heart for Egyptians, how they died for the Mexica, whether
kin are left to remember them for ancestor traditions. Someone indifferent
to religion after 1750 gets nothing after. The paintings are in
`public/backdrops/afterlife/`. Each realm also names the end its people hoped
for (`hopeFor`), which the character panel's Beliefs tab shows behind the
tradition.

The card then names the cause, age, place and year. The player chooses:

- **Go on as** one of the household aged twelve or more: the `become`
  command, which swaps identity and carries the household, plot and record.
- **Close this life**.

## A baby on the back

`src/core/baby.ts`: an infant carried by a parent, with mood and needs
(milk, wet, tired, startled, bored). It reacts to motion and rain and can be
nursed. The carrying cloth comes from `infantCarry` in the wardrobe.

## Bonds and concerns

- **Bonds** (`state.bonds`, `src/core/bonds.ts`): someone the player loves, a
  match being arranged, a rival in the trade, an estranged sibling. Absent
  family and recent deaths come from household history.
- **Concerns** (`src/core/concerns.ts`) score every fact above, plus
  household events (widowed, newly married, a new baby), for urgency. The
  opening card's second sentence takes the top one. A belief counts only
  where it collides with the plot.

## Legacy, do not extend

Manifests without `survival` or `disease` keep the older rules: a fixed
illness course set at onset, and plot cast exempt from illness. Extend only
the `disease: 1` and `survival: 1` paths. Retiring the old branches is welcome
when you work here.

## Not built

- Conditions that change play beyond movement: hearing, sight (a blind player sees as well as anyone), a lost hand at work.
- Residents' injuries are looks: they do not slow them or keep them from work, and a working pose drops the crutch or board.
- Pregnancy as state.
- A grave dug for a death in play: the dead take an existing marker.
  `src/core/remains.ts` is animal remains.
- The rite of a burial: mourners gather at the ground and nothing more is shown.

## Checks

`tests/core.test.ts`, `tests/combat.test.ts`, `tests/baby.test.ts`.
