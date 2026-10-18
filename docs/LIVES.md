# Lives: conditions, illness, bonds and concerns

Status: building, October 2026. What the opening card says about a person
comes from here, and later plots read the same facts.

## Why

The opening card's second sentence ("You are Teriʻi, twenty-two, and …")
needs the one or two most pressing or remarkable things about a life. Belief
stances are for the Beliefs tab; they read as cryptic here. The facts that
make a life particular are bodily, familial and local: a sister with a fever,
a son gone to sea, someone you hope to marry, hearing lost to a childhood
illness.

Story first. Conditions do not change play yet (hearing, sight, gait); that
is a later pass.

## Four layers

1. **Conditions** (`src/content/health/conditions.ts`, `src/core/health.ts`).
   Lasting: hearing loss, poor sight, cataract, colour-blindness, a limp, a
   clubfoot, missing fingers, smallpox scars, goitre, recurring malaria,
   consumption, the falling sickness, melancholy, a stammer, rickets, Nile
   bilharzia. Each has a rate by age, sex, era and place, a period name with
   a modern gloss, and plain lines. Derived from the seed like stats, so every
   resident has them at no storage cost. Rates are realistic: before modern
   medicine a large share of adults had something; the card mentions one only
   when it outranks everything else. No slurs; period terms that are not slurs
   ("the falling sickness") with the modern name in the gloss.
2. **Ailments** (`src/content/health/ailments.ts`). Acute and stateful in
   `state.ailments`: fevers, the flux, coughs, childbed, smallpox, measles,
   plague in plague years, broken bones. Seasonal and regional, more for the
   young and the old. Each has a course fixed at onset (mend, linger, die)
   in older manifests, which the player can turn by sitting with the sick.
   New worlds use the exposure and care rules below. The sick stay home,
   laid up. A death removes the person, writes `died` into the household's
   history, and shows a turn card. Legacy worlds protect plot cast from illness.
3. **Bonds** (`state.bonds`, `src/core/bonds.ts`). From the player outward:
   someone they love (mutual or not; same-sex love exists and is usually
   unspoken, open only where the culture made room for it, as among Greek
   men in the classical period), a match being arranged, a rival in the same
   trade, an estranged sibling. Absent family and recent deaths come from the
   household's history, given reasons by era and place.
4. **Concerns** (`src/core/concerns.ts`). Every fact above, plus the
   household events the intro already used (widowed, newly come, newly
   married, a new baby), scored for urgency. The intro's second sentence takes
   the top one; a life without a plot may take the second for its second
   paragraph. A belief is a concern only where it collides with the plot
   (usury called theft, while in debt). The rare line takes the rarest
   condition or stat.

## Later

Play effects of conditions; pregnancy and childbirth as state; plots chosen
by concern (a sick child makes the Mending or the Hungry Season likelier);
burials and remains; the bereaved mourning.

## Bodily needs and danger in play

Fresh worlds set `manifest.survival = 1`. Hunger rises about two points per
game hour; eating uses the actual carried food. Hunger above 60 and fatigue
above 50 gradually reduce physical ability, and severe exhaustion prevents
running while allowing slower walking. The common limits apply to work,
combat and narrator attempts. Thirst has no upkeep requirement. Brief rests
and drinking cannot replace a night's sleep.

Sheltered sleep restores fatigue; healing also needs enough food and cannot
remove an active illness. Going without food for days accumulates a deficit;
after two full days at maximum hunger, health wears down slowly. Meals and
time fed reduce that deficit. Injuries expire by game time. Illness, injury,
food deficit and effective ability are visible in the body panel, agent
observations and research snapshots. Player illnesses travel across maps.
These are gameplay calibrations, not a medical model.

Fresh worlds also pin `manifest.disease = 1`. Respiratory infection accumulates
with shared indoor/close outdoor time, provisions can expose a household, and
open wounds can become infected. Incubation precedes symptoms; recovery grants
temporary protection for the two infectious profiles. Other existing ailments
retain scoped outside introductions without simulated transmission. Cold or rain
can injure an exposed sleeper but no longer spontaneously creates an infection.

The body panel, patient inspection and `care` command expose the same actions:
rest, nursing, wound dressing, consultation, appropriate medicine, rehydration
and a day's careful household food/water preparation. No thirst upkeep is added.
Practitioners must actually exist nearby; supplies are finite. Modern supply is
seeded by date and settlement with inferred local variation, never guaranteed
by a year alone. Treatment alters recovery and mortality without repeated cure
rolls; conversation alone has no biological effect. Symptoms and uncertain
assessments are visible, while underlying diagnoses, exposure sources and latent
outcome draws are research-only. Plot characters have no illness exemption in
these worlds. Older manifests keep their previous illness and care rules.

Mechanisms draw on [CDC respiratory guidance](https://www.cdc.gov/respiratory-viruses/about/index.html),
[WHO diarrhoeal disease guidance](https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease)
and [WHO wound guidance](https://www.who.int/publications/i/item/prevention-and-management-of-wound-infection).
Hazards, course lengths, protection and supply probabilities are explicitly
inferred gameplay parameters, not measured historical rates. Research snapshots
include this limitation and the sources. Infection and prevention travel with
the player; local contaminated provisions remain on their own map.

`core/danger.ts` assesses current ground and four nearby locations from
buildings, cover, tracks, nearby people/guards and darkness. Broad setting
and date defaults tune robbery frequency; they are inferred game balancing,
not measured historical crime rates. The 32-cell area id is for locating and
recording risk, not a separate authored crime map. Ruins do not offer the
same protection as buildings in use.

A robbery uses the normal choice cards: surrender coins or a carried item,
run, or resist. Body and skills affect checks. It interrupts the current
action, requires an answer before continuing, and has a one-day cooldown
carried with the player. This represents an encounter, rather than adding a
persistent bandit population. Existing NPCs can defend themselves against
assault or retaliate after serious provocation; a visible threat precedes
their blows. Their hostility and current attack state feed the same danger
assessment for human and model players. A decision to walk away ends a new
retaliation. Older manifests without `survival` keep their previous rules.
