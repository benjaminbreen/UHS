import { dueOf, fillIn, neighbours, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const castOf = (c: PlotContext) => {
  const kids = c.actors.filter((a) => a.kind === "human" && !a.dead && a.householdId !== c.player.householdId && (a.age ?? 30) >= 6 && (a.age ?? 30) < 12);
  const child = kids.length ? pickOf(c, kids, "follower-child") : undefined;
  const neighbour = child && neighbours(c).find((a) => a.householdId === child.householdId);
  return child && neighbour ? { child, neighbour } : undefined;
};

/** A neighbour's child has decided you are the most interesting person
 * alive, and follows you everywhere. */
export const follower: PlotTemplate = {
  id: "follower",
  shape: "light",
  look: {
    emblem: "shadow",
    palette: { ink: "#10140e", fill: "#2c3a24", edge: "#7a6440", light: "#eef2dc", accent: "#e8c060" },
  },
  weight: (c) => ((c.player.age ?? 30) >= 18 && castOf(c) ? 0.5 * temper(c, "agreeableness") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const child = cast.child!, neighbour = cast.neighbour!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        child: child.name,
        neighbour: neighbour.name,
        due,
        role: c.player.role.toLowerCase(),
        spoil: fillIn(pickOf(c, ["{he} drops the one thing you needed in the mud", "{he} does the one part you told {him} not to touch", "{he} tries a quicker way of {his} own and ruins the lot"], "follower-spoil"), pronounWords(child)),
        question: pickOf(c, ["why the sky doesn't fall down", "whether you have ever seen a ghost", "how much you weigh", "why you do it that way and not the other way"], "follower-question"),
        ...pronounWords(child),
        ...p.words,
      },
      refs: { child: child.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "copy",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "copy", focus: "child", choices: [{ id: "taught" }, { id: "sent" }, { id: "errand" }] }],
    },
    {
      id: "spoiled",
      when: { type: "all", of: [{ type: "fired", id: "taught" }, { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "spoiled", focus: "child", choices: [{ id: "again" }, { id: "home" }] }],
    },
    { id: "proud", when: { type: "fired", id: "again" }, then: [{ type: "regard", role: "child", delta: 3 }, { type: "regard", role: "neighbour", delta: 1 }] },
    { id: "sulk", when: { type: "fired", id: "sent" }, then: [{ type: "regard", role: "child", delta: -1 }] },
  ],
  endings: [
    { id: "taught", when: { type: "fired", id: "again" } },
    { id: "tired", when: { type: "fired", id: "home" } },
    { id: "sent", when: { type: "fired", id: "sent" } },
    { id: "errand", when: { type: "fired", id: "errand" } },
    { id: "dusk", when: { type: "due" } },
  ],
  wording: [
    {
      title: "The Child Who Follows You",
      lines: {
        aim: "Decide what to do about {child}, who wants to learn your work, {due}.",
        intro: "{child}, from {neighbour}'s household, has decided to become a {role}, and to learn it from you. {He} has been following you since breakfast, three steps behind.",
        threat: "Nothing much is at stake. {child} just won't leave you alone.",
        partner: "Your {partnerKin} {partner} thinks it's the funniest thing that has happened all year.",
        "kin-partner": "You've got a shadow. I think it's sweet.",
        "cast-child": "Is following you everywhere and wants to learn your work.",
        "cast-neighbour": "Head of {child}'s household, who has no idea where {child} is.",
        copy: "You turn round and {child} is copying the way you stand, exactly. {He} wants to know {question}.",
        "taught:label": "Let {him} help",
        "taught:then": "You hand {child} something to hold and show {him} where to stand. {He} has never looked so serious.",
        "sent:label": "Walk {him} home",
        "errand:label": "Send {him} off on an errand",
        spoiled: "{child} is a real help for an hour. Then {spoil}, and looks up at you, waiting.",
        "again:label": "Show {him} again, slowly",
        "home:label": "Call it a day",
        taught: "You show {child} again, slowly. {He} gets it wrong, then less wrong, then nearly right, and runs home to tell everyone. {neighbour} comes by later to thank you.",
        tired: "You send {child} home for the day. {He} goes without arguing, and is waiting at your door again the next morning.",
        sent: "You walk {child} home to {neighbour}, who apologises and keeps {him} in. {child} waves at you sadly from the doorway.",
        errand: "You send {child} to fetch something you don't need from the far end of the settlement. {He} comes back three hours later with it, and a story, and keeps following you until dusk.",
        dusk: "At dusk {child} is called home. {He} tells everyone at dinner that you are the best {role} in the world.",
      },
    },
  ],
};
