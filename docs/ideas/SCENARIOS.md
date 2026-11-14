# Scenarios from sources (shelved)

Status: planned, not started. Waits on the plot system (bucket A), whose
situation format is what this feature produces. Written September 2026.

## The idea

A user gives the game documents (an Old Bailey trial, a set of PDFs, images of
a place, or a detailed prompt). A worldbuilder model turns them into a playable
situation: the people, places, relationships, what each person wants and knows,
and a start time and place. The engine runs it like any other world. A director
model watches for consequential changes and responds. The player can let
history run or change it.

## The rule that governs everything

A source is an attributed claim about what happened. It is never a command
about what must happen. Testimony that "he took the watch" becomes:

- a documented intention on the thief ("means to take the watch tonight"),
- documented knowledge and positions for the witnesses,
- a reference timeline entry, attributed to that witness.

If nobody interferes, the documented outcome tends to happen because the
intentions point there. If the player warns the owner, the owner acts on the
warning. Nothing is scripted, so there is nothing to break and no
on-record/off-record switch. The reference timeline stays visible so the
player can compare what happened in this run with what the sources say.

## What the worldbuilder writes

Data only, never code. The same format as a plot in bucket A, plus:

1. **Stage**: a `WorldSetting` the existing resolver accepts, a list of
   required places with spatial constraints ("long narrow alley off a
   main street", "courtroom with a public gallery"), and a start window
   ("after dark", picked inside the window from the seed).
2. **Cast**: documented people with names, ages, trades and relations from
   the source. Gaps are filled with invented people, tagged as invented. The
   player may be any of them; documented witnesses are preferred.
3. **Intentions and knowledge** for each person, each tagged documented,
   inferred, hypothesis or fictional, with the source passage attached.
4. **Reference timeline**: the sources' account, in order, attributed,
   with disagreements kept side by side.

## The director

It is a separate small prompt, not the worldbuilder reused. It is woken by
significant changes in the world (an accusation, a theft, a death, someone
leaving, a door broken), not by the clock. It may only:

- revise a person's intention,
- introduce an external development, such as the judge returning, a letter,
  a teletype, a constable arriving, using the same event record and modal as
  bucket A,
- propose an ending, with a written aftermath. The player may decline it and
  keep playing.

It narrates only consequences that have happened in the engine. It cannot
declare someone arrested while they are walking the street.

## The hard part: space

Matching "a long narrow alley in East London" to a place the generator happens
to have made is not enough. The generator must be able to *guarantee* a few
required places. Test this first, before writing the extractor: can three
or four hard constraints reliably produce visibly different, playable maps?
If not, nothing else here works. Image-to-map waits until text constraints
work.

Each pilot also needs a bounded list of interiors: courtroom, lodging house,
tavern, cell.

## NPC minds

Richer people come from richer state (beliefs, intentions, knowledge), acted
on by ordinary engine code and voiced by Luna. They do not need a model call
per decision. Jev is a later option for genuinely ambiguous social choices,
and for any experiment where its probabilities are the measurement.

## Pilots

1. **Old Bailey**: one theft case, 4 to 8 people, a street and an interior,
   about an hour of action. Structured XML, CC BY-NC. Hand-build this one
   first to learn what the worldbuilder must produce, then write the
   extractor against it.
2. **Macy conferences**: a live option. Ben has the Macy Foundation's
   permission to quote the transcripts in his book; check whether that
   extends to this use. A bounded conversational setting is a virtue if
   playing reveals what reading the transcript does not: who could hear whom,
   interruptions, alliances, competing meanings of a term.

Later candidates: Becket's murder (five disagreeing eyewitnesses), Socrates'
last day, Salem examinations, Boston 1770 and the trial.

## Research framing

The question: can an interactive reconstruction help people see how different
readings of the same evidence produce different accounts, and which
assumptions each account needs? Reruns show the system's priors, not
history. "The documented outcome should be most probable" is not a
validation rule, because a real outcome need not have been the likely one,
and the model may already know the story.

## Order when this resumes

1. Bucket A shipped, so the situation format, event record and modal exist.
2. Spatial constraint test.
3. One hand-built Old Bailey scene, with the director.
4. The extractor, tested on a legal record, a narrative account and a
   dialogue.
