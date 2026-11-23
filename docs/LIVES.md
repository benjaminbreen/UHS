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

## Illness

Acute illness lives in `state.ailments` (`src/content/health/ailments.ts`):
fevers, flux, coughs, childbed, smallpox, measles, plague in plague years,
broken bones. Residents too ill to work rest in an available ward bed if a hospital is within 60 tiles of home. Otherwise they rest at home. A death removes the person and writes
`died` into the household's history.

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
  take half their coin; a press gang holds them two days.

The same people are livelihoods (`src/content/characters/outlaws.ts`), dressed
by `wardrobe/regions/outlaws.ts`, with days in `recipes.ts` and cards in
`cards/outlaws.ts`, so the player sometimes starts as one.
`npm run capture:characters -- accosters` draws them.

## Death and going on

When the player dies, in a day or in the years, `DeathCard.tsx` first plays
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

- Conditions that change play (hearing, sight, gait).
- Pregnancy as state.
- Burial of the dead. Graveyards are scenery props (`graveMound`), and
  `src/core/remains.ts` is animal remains.
- Mourning.

## Checks

`tests/core.test.ts`, `tests/combat.test.ts`, `tests/baby.test.ts`.
