import { faunaAt } from "../fauna";
import { neighbours, partnerWords, pickOf, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

/** Raiders that go for each kind of stock, likeliest first. */
const RAIDERS: [RegExp, string, [string, string][]][] = [
  [/poultry|hen|chicken|goose|duck/, "the hens", [["red-fox", "fox"], ["grey-fox", "fox"], ["golden-jackal", "jackal"], ["coyote", "coyote"]]],
  [/cattle|dairy|milk|ranch|drover|buffalo|yak/, "the cattle", [["lion", "lion"], ["spotted-hyena", "hyena"], ["tiger", "tiger"], ["gray-wolf", "wolf"], ["brown-bear", "bear"], ["jaguar", "jaguar"], ["cougar", "cougar"]]],
  [/shepherd|sheep|goat|herd|pastoral|camel|llama|reindeer|swine|pig|farm|peasant/, "the flock", [["gray-wolf", "wolf"], ["leopard", "leopard"], ["spotted-hyena", "hyena"], ["african-wild-dog", "wild dog"], ["golden-jackal", "jackal"], ["coyote", "coyote"], ["cougar", "cougar"], ["red-fox", "fox"]]],
];

const raiderOf = (c: PlotContext) => {
  if (!c.setting || c.setting.settlement === "city") return;
  const kept = RAIDERS.find(([re]) => trade(c, re));
  const here = new Set(faunaAt(c.setting).map((f) => f.id));
  const found = kept?.[2].find(([id]) => here.has(id));
  return kept && found && { stock: kept[1], species: found[0], kind: found[1] };
};

const fenceOf = (c: PlotContext) => {
  switch (c.setting?.culture) {
    case "east-southern-african": return "kraal";
    case "west-central-african": case "south-asian": return "thorn fence";
    case "european": return "fold";
    default: return "pen";
  }
};

const helperOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 60);
  return pool.length ? pickOf(c, pool, "raid-helper") : undefined;
};

const fired = (id: string): Condition => ({ type: "fired", id });
const won = (id: string): Condition => ({ type: "all", of: [fired(id), { type: "not", of: fired(`${id}:failed`) }] });
const night: Condition = { type: "due" };

/** Something is getting at the stock at night. A herder's whole wealth stood in
 * the pen, and losing a few head to wolves or a leopard could ruin a family. */
export const raid: PlotTemplate = {
  id: "raid",
  shape: "work",
  look: {
    emblem: "fold",
    palette: { ink: "#100e0b", fill: "#2a2a22", edge: "#6a5a3a", light: "#ece6d6", accent: "#b0904a" },
  },
  weight: (c) => (raiderOf(c) && helperOf(c) ? 0.6 : 0),
  cast: (c) => {
    const helper = helperOf(c);
    return helper && { helper };
  },
  begin: (c, cast) => {
    const helper = cast.helper!;
    const r = raiderOf(c)!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 31 * 3600,
      words: { helper: helper.name, fence: fenceOf(c), ...r, ...p.words },
      refs: { helper: helper.id, ...p.refs },
    };
  },
  opening: [{ type: "card", line: "found" }],
  developments: [
    {
      id: "plan",
      when: { type: "since", hours: 0.5 },
      then: [{ type: "choose", line: "plan", focus: "helper", choices: [
        { id: "watch", check: { stat: "endurance", odds: 0.55 } },
        { id: "mend" },
        { id: "trap", check: { stat: "wit", skill: "hunting", odds: 0.4 } },
        { id: "move" },
        { id: "ask", check: { stat: "agreeableness", odds: 0.6 } },
        { id: "accept" },
      ] }],
    },
    { id: "helped", when: won("ask"), then: [{ type: "regard", role: "helper", delta: 1 }] },
    { id: "dark", when: { type: "due", hours: -11 }, then: [{ type: "card", line: "dark" }, { type: "loose", as: "raider" }] },
  ],
  endings: [
    { id: "killed", when: fired("beast:slain") },
    { id: "took", when: fired("beast:took") },
    { id: "kept", when: { type: "all", of: [night, won("watch")] } },
    { id: "held", when: { type: "all", of: [night, fired("mend"), fired("worked")] } },
    { id: "caught", when: { type: "all", of: [night, won("trap")] } },
    { id: "moved", when: { type: "all", of: [night, fired("move")] } },
    { id: "shared", when: { type: "all", of: [night, won("ask")] } },
    { id: "warded", when: { type: "all", of: [night, fired("beast:repelled")] } },
    { id: "lost", when: night },
  ],
  wording: [
    {
      title: "Something at the {fence}",
      lines: {
        aim: "Keep {stock} safe tonight.",
        intro: "In the morning there's blood in the {fence}. One animal is dead and half eaten, and another is missing. The tracks in the mud are a {kind}'s.",
        threat: "It will be back tonight, and every night after, until it's stopped or there's nothing left. {stock} are most of what your family owns.",
        partner: "Your {partnerKin} {partner} has been counting the animals twice.",
        "kin-partner": "We can't lose any more. Do something before dark.",
        "cast-helper": "Keeps animals nearby, and is losing them too.",
        found: "You find the gap where it got into the {fence}, and drag marks going off into the scrub. A {kind}, and it will come back.",
        plan: "{helper} has lost animals too. What will you do before dark?",
        "watch:label": "Sit up with a light, a stick and the dog",
        "watch:then": "You'll sit up by the {fence} tonight with a fire and a heavy stick.",
        "watch:failed": "You doze off near dawn, and wake to the animals screaming.",
        "mend:label": "Rebuild the {fence} higher and tighter",
        "mend:then": "Mending the {fence} will take the whole day's work.",
        "trap:label": "Set a trap by the gap",
        "trap:then": "You set a trap where it got in and leave the carcass as bait.",
        "trap:failed": "The trap goes off, but it gets away and leaves only some fur behind.",
        "move:label": "Bring the animals in by the house",
        "move:then": "Tonight the animals sleep up against the house, where you can hear every one of them.",
        "ask:label": "Ask {helper} and the others to watch together",
        "ask:then": "{helper} agrees. The men will take turns watching all the pens through the night.",
        "ask:failed": "{helper} has enough to do watching {his} own animals.",
        "accept:label": "Accept the losses and get on with the day",
        dark: "It's getting dark. The animals are restless and the dogs keep growling at the scrub.",
        killed: "You killed the {kind}. You hang its body by the {fence} for the others to see.",
        took: "The {kind} came back in the night and took another one. In the morning there's nothing left but blood on the ground.",
        kept: "Twice in the night you see eyes at the edge of the firelight, and twice you shout and wave the burning stick. In the morning every animal is still there.",
        held: "In the night something circles the {fence} for a long time, scratching and testing it. It can't get in, and in the morning every animal is there.",
        caught: "In the morning there's a {kind} in the trap, worn out from fighting it. That's the end of the losses.",
        moved: "The animals are crowded and miserable, but they're all there in the morning. You can't keep them by the house forever.",
        shared: "With fires and watchers at every pen, the {kind} doesn't come near. People say it went to the next valley.",
        warded: "More than once in the night it comes close to the {fence}, and each time it turns back from you and the fire. In the morning every animal is still there.",
        lost: "In the morning another animal is gone. You're poorer than you were yesterday, and it will come back again.",
      },
    },
  ],
};
