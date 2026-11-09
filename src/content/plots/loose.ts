import { dueOf, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const ANIMALS: Partial<Record<string, string>> = {
  european: "pig", "east-asian": "pig", "southeast-asian": "pig", mesoamerican: "turkey", andean: "llama",
  "north-african-west-asian": "goat", "south-asian": "goat", "inner-eurasian": "goat",
};

const castOf = (c: PlotContext) => {
  const kids = c.actors.filter((a) => a.kind === "human" && !a.dead && a.householdId !== c.player.householdId && (a.age ?? 30) >= 6 && (a.age ?? 30) < 14);
  const child = kids.length ? pickOf(c, kids, "loose-child") : undefined;
  const neighbour = child && neighbours(c).find((a) => a.householdId === child.householdId);
  return child && neighbour ? { child, neighbour } : undefined;
};

/** A neighbour's animal has got loose and made a mess of your morning. */
export const loose: PlotTemplate = {
  id: "loose",
  shape: "light",
  look: {
    emblem: "loose",
    palette: { ink: "#141208", fill: "#3a3420", edge: "#8a6a3a", light: "#f2eed4", accent: "#d8c040" },
  },
  weight: (c) => ((c.setting?.year ?? 0) > -6000 && (c.setting?.year ?? 0) < 1950 && castOf(c) ? 0.6 : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const child = cast.child!, neighbour = cast.neighbour!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const animal = ANIMALS[c.setting?.culture ?? ""] ?? "goat";
    return {
      deadline,
      words: {
        child: child.name,
        neighbour: neighbour.name,
        due,
        animal,
        mess: pickOf(c, ["eaten half your greens and lain down in the rest", "knocked over your water jars", "got into the house and eaten the bread set out for the day"], "loose-mess"),
        chase: pickOf(c, ["A dozen people chase it twice round the square before it is caught", "It is finally cornered by an old woman with a broom", "It runs through a wedding party before anyone catches it"], "loose-chase"),
        ...pronounWords(child),
        ...p.words,
      },
      refs: { child: child.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "loose", focus: "child", choices: [{ id: "grab", check: { stat: "agility", skill: "animals", odds: 0.5 } }, { id: "called" }, { id: "let" }] }],
  developments: [
    {
      id: "held",
      when: { type: "all", of: [{ type: "fired", id: "grab" }, { type: "not", of: { type: "fired", id: "grab:failed" } }] },
      then: [{ type: "choose", line: "held", focus: "child", choices: [{ id: "helped" }, { id: "paid" }] }],
    },
    { id: "friend", when: { type: "fired", id: "helped" }, then: [{ type: "regard", role: "child", delta: 3 }] },
    { id: "sour", when: { type: "fired", id: "paid" }, then: [{ type: "regard", role: "child", delta: -1 }, { type: "regard", role: "neighbour", delta: 1 }] },
  ],
  endings: [
    { id: "chase", when: { type: "fired", id: "grab:failed" } },
    { id: "helped", when: { type: "fired", id: "helped" } },
    { id: "paid", when: { type: "fired", id: "paid" } },
    { id: "told", when: { type: "fired", id: "called" } },
    { id: "story", when: { type: "fired", id: "let" } },
    { id: "story", when: { type: "due" } },
  ],
  wording: [
    {
      title: "Loose in the Street",
      lines: {
        aim: "Deal with {neighbour}'s {animal}, {due}.",
        intro: "{neighbour}'s {animal} is loose in the street. It has already {mess}, and {child}, who was meant to be watching it, is nowhere to be seen.",
        threat: "Nobody is hurt. But someone ought to make it right, and the whole street is laughing.",
        partner: "Your {partnerKin} {partner} can't stop laughing about it.",
        "kin-partner": "Did you see it run? I will never forget that.",
        "cast-neighbour": "Owns the {animal}, and hasn't heard about it yet.",
        "cast-child": "Was meant to be watching the {animal}, and is hiding.",
        loose: "The {animal} stops in the middle of the street, looks straight at you, and starts on a basket of somebody's onions.",
        "grab:label": "Catch it yourself",
        "grab:failed": "You make a grab, the {animal} goes one way, and you go face down in the mud.",
        "called:label": "Shout for {neighbour}",
        "let:label": "Let it run",
        held: "You get hold of the {animal} at last, muddy to the knees. {child} comes running, out of breath, and begs you not to tell {neighbour}.",
        "helped:label": "Hand it back to {child}",
        "paid:label": "Take it to {neighbour}",
        chase: "{chase}. Half the street saw you in the mud, and you'll be hearing about it for a year.",
        helped: "You hand the {animal} back. {child} spends the afternoon fixing what it broke, and works harder than you'd expect. You've made a friend.",
        paid: "You lead the {animal} home to {neighbour}, who apologises and pays for the damage. {child} gets a scolding and gives you a sour look.",
        told: "{neighbour} comes running, catches the {animal} with a practised arm, and promises to make good the damage. {child} gets a scolding.",
        story: "{chase}. By evening it's a story the whole street is telling, and you're in it.",
      },
    },
  ],
};
