import { fillIn, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const elderOf = (c: PlotContext) => {
  const ours = c.actors.filter((a) => a.kind === "human" && !a.dead && a.householdId === c.player.householdId &&
    a.id !== c.player.id && (a.age ?? 0) >= 66);
  const parents = new Set(c.player.relations?.filter((r) => r.kind === "parent").map((r) => r.other));
  return ours.find((a) => parents.has(a.id)) ?? ours[0];
};

const found = (where: string) => ({
  id: `found-${where}`,
  when: { type: "all" as const, of: [{ type: "fired" as const, id: where }, { type: "since" as const, hours: 2 }] },
  then: [{ type: "choose" as const, line: `found-${where}`, focus: "kin" as const, choices: [{ id: "home" }, { id: "stay" }] }],
});

/** An old member of the household, who has been forgetting things, has
 * wandered off: where to look, and what to do once found. */
export const wandering: PlotTemplate = {
  id: "wandering",
  shape: "household",
  look: {
    emblem: "path",
    palette: { ink: "#12120e", fill: "#262620", edge: "#5e5a44", light: "#efece0", accent: "#d8b070" },
  },
  weight: (c) => (elderOf(c) && neighbours(c).length ? 0.6 : 0),
  cast: (c) => {
    const kin = elderOf(c);
    const neighbour = pickOf(c, neighbours(c), "wandering-neighbour");
    return kin && neighbour && { kin, neighbour };
  },
  begin: (c, cast) => {
    const kin = cast.kin!, neighbour = cast.neighbour!;
    const p = partnerWords(c);
    const parent = c.player.relations?.some((r) => r.kind === "parent" && r.other === kin.id);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 19 * 3600,
      words: {
        kin: kin.name,
        who: parent ? `Your ${pronounWords(kin).he === "she" ? "mother" : "father"}` : "Old",
        neighbour: neighbour.name,
        looking: fillIn(pickOf(c, ["for a house that was pulled down years ago", "for someone who has been dead a long time", "for the way to a place {he} lived as a child"], "wandering-looking"), pronounWords(kin)),
        ...pronounWords(kin),
        ...p.words,
      },
      refs: { kin: kin.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [
    { type: "walk-off", role: "kin", to: "away" },
    { type: "choose", line: "search", choices: [{ id: "river" }, { id: "graves" }, { id: "wait" }] },
  ],
  developments: [found("river"), found("graves")],
  endings: [
    { id: "home", when: { type: "all", of: [{ type: "fired", id: "home" }, { type: "since", hours: 3 }] } },
    { id: "stayed", when: { type: "all", of: [{ type: "fired", id: "stay" }, { type: "since", hours: 5 }] } },
    { id: "brought", when: { type: "any", of: [{ type: "due" }, { type: "all", of: [{ type: "fired", id: "wait" }, { type: "since", hours: 6 }] }] } },
  ],
  wording: [
    {
      title: "Gone Wandering",
      lines: {
        aim: "Find {kin} and bring {him} home before dark.",
        intro: "{who} {kin} has been forgetting things for a while: names, the day, whether {he} has eaten. This morning {he} was gone from the house before anyone woke.",
        threat: "{He} can't be far, but {he} is old and doesn't know where {he} is going. The nights are cold.",
        partner: "Your {partnerKin} {partner} has already been round the nearest houses.",
        "kin-partner": "No sign of {kin} yet? Somebody must have seen {him}.",
        "cast-kin": "Has wandered off and may not know the way home.",
        "cast-neighbour": "Might have seen which way {kin} went.",
        search: "{neighbour} saw {kin} walking out past the last houses at first light. Lately {he} has been talking about the old days, and about people who are dead.",
        "river:label": "Search along the water",
        "river:then": "You go down to the water calling {his} name. There are footprints in the mud, small and dragging.",
        "graves:label": "Look where the dead are buried",
        "graves:then": "You take the path out to where the dead are buried, calling {his} name as you go.",
        "wait:label": "Stay home in case {he} comes back",
        "wait:then": "You stay by the door and ask everyone who passes to keep an eye out.",
        "found-river": "You find {kin} sitting on the bank, wet to the knees, looking {looking}. {He} knows you after a moment.",
        "found-graves": "You find {kin} among the graves, talking to someone who isn't there. {He} knows you after a moment.",
        "home:label": "Take {him} home",
        "home:then": "You take {his} arm and walk {him} home slowly. {He} keeps asking where you are going.",
        "stay:label": "Sit with {him} a while",
        "stay:then": "You sit down next to {him}. {He} talks about people you never met, and you let {him}.",
        home: "{kin} is home, fed, and asleep by the fire. From now on someone will have to watch the door.",
        stayed: "You walk home together in the evening. {kin} is calmer than {he} has been in weeks, and that night {he} sleeps through.",
        brought: "In the end {neighbour} brings {kin} back, tired and muddy. {He} doesn't remember going.",
      },
    },
  ],
};
