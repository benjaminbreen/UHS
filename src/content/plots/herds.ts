import { B, dueOf, neighbours, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const partyOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) <= 45);
  return pool.length ? pickOf(c, pool, "herds-friend") : undefined;
};

const fired = (id: string): Condition => ({ type: "fired", id });
const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });

/** The animals the band lives on are passing close, for a day or two. */
export const herds: PlotTemplate = {
  id: "herds",
  shape: "work",
  look: {
    emblem: "herd",
    palette: { ink: "#13110d", fill: "#3a3424", edge: "#6a5232", light: "#f0eadc", accent: "#e09a48" },
  },
  weight: (c) => (trade(c, /hunter|trapper/) && partyOf(c) ? 0.8 * temper(c, "strength") : 0),
  cast: (c) => {
    const friend = partyOf(c);
    return friend && { friend };
  },
  begin: (c, cast) => {
    const friend = cast.friend!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return { deadline, words: { friend: friend.name, due, ...pronounWords(friend), ...p.words }, refs: { friend: friend.id, ...p.refs } };
  },
  opening: [{ type: "approach", role: "friend", line: "seen" }],
  developments: [
    {
      id: "plan",
      when: any({ type: "talked", role: "friend" }, { type: "since", hours: 1.5 }),
      then: [{ type: "choose", line: "plan", focus: "friend", from: "friend", choices: [{ id: "drive" }, { id: "stalk", check: { stat: "agility", skill: "hunting", odds: 0.5 } }] }],
    },
    {
      id: "spooked",
      when: { type: "all", of: [fired("stalk:failed"), { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "spooked", focus: "friend", choices: [{ id: "follow", check: { stat: "endurance", skill: "hunting", odds: 0.4 } }, { id: "back" }] }],
    },
  ],
  endings: [
    { id: "kill", when: { type: "all", of: [fired("stalk"), { type: "not", of: fired("stalk:failed") }] } },
    { id: "shared", when: { type: "all", of: [fired("drive"), any(fired("worked"), { type: "since", hours: 3 })] } },
    { id: "late", when: { type: "all", of: [fired("follow"), { type: "not", of: fired("follow:failed") }] } },
    { id: "given", when: fired("back") },
    { id: "gone", when: any(fired("follow:failed"), { type: "due" }) },
  ],
  wording: [
    {
      // Magdalenian camps sat at river crossings on the reindeer's seasonal routes.
      scope: { years: [B(20000), B(10000)], bounds: [-10, 40, 30, 56] },
      title: "The Reindeer Are Crossing",
      lines: {
        aim: "Hunt the reindeer at the crossing while they pass.",
        intro: "The reindeer are coming down the valley to cross the river, hundreds of them, the way they do every year. At the ford they bunch up in the water and can't run.",
        threat: "The herd will be past in a few days, and with it the meat, hides, sinew and antler for half a year.",
        partner: "Your {partnerKin} {partner} is sharpening the scrapers for the hides.",
        "kin-partner": "Bring back a big one. We need the hide.",
        seen: "They're coming down to the ford, more than I can count. Get your spears.",
        plan: "Everyone else is going to wait at the ford, where the herd bunches up in the water and the meat is shared out after. {friend} wants to slip round upstream, just the two of you, and take a big one before it gets there.",
        "drive:label": "Wait at the ford with everyone",
        "stalk:label": "Go round upstream with {friend}",
        spooked: "A stone turned under your foot. The herd has bolted across upstream, out of reach of the ford. {friend} thinks you can still catch the stragglers.",
        shared: "The herd comes down into the ford and the spears go in. By dark the shallows are red, and the meat is shared out at the fires, a fair piece for every family.",
      },
    },
    {
      scope: { years: [B(5000), 1950], bounds: [5, 58, 180, 78] },
      title: "The Reindeer Are Moving",
      lines: {
        aim: "Hunt the wild reindeer while they pass.",
        intro: "The wild reindeer are on the move, and a herd is passing close. Everyone who can hunt is getting ready.",
        threat: "A good kill now means food and skins for the cold months. In a few days they'll be gone.",
        partner: "Your {partnerKin} {partner} is getting the sledges ready to bring the meat back.",
        "kin-partner": "Bring back a big one.",
        seen: "There's a herd moving past the lake. Hundreds. Come on.",
      },
    },
    {
      // Before horses, Plains hunters drove bison into corrals or over bluffs; with horses, they rode alongside.
      // Hunting ahead of the camp's hunt was forbidden, and the camp police punished it.
      scope: { years: [B(8000), 1885], bounds: [-112, 30, -94, 54] },
      title: "The Buffalo Are Close",
      lines: {
        aim: "Hunt the buffalo while the herd is close.",
        intro: "A big herd of buffalo has come close to camp. The scouts have seen them grazing over the next rise, and the whole camp is getting ready.",
        threat: "One good hunt feeds the camp for weeks and gives hides for robes and lodge covers. Spook them and they'll be miles away by morning.",
        partner: "Your {partnerKin} {partner} is getting the knives and drying racks ready.",
        "kin-partner": "Don't come back without meat.",
        seen: "They're just over the rise, more than I've seen all year. Stay downwind.",
        plan: "The hunt leaders say the whole camp goes out together, and nobody hunts alone before then. Anyone who scares the herd off early gets punished. {friend} wants to slip out now anyway and take a fat cow before the crowd.",
        "drive:label": "Wait and hunt with the camp",
        "stalk:label": "Slip out now with {friend}",
        spooked: "The herd caught your scent and ran, and the hunt leaders saw who it was. {friend} thinks you can still catch the stragglers before anyone reaches you.",
        "back:label": "Go back and face the hunt leaders",
        given: "They break your bow and slash your robe in front of the whole camp. That is the rule. But when the camp makes its kill, nobody lets your family go without meat.",
        shared: "The whole camp goes out together and the herd is surrounded. By dark there are cows down all over the slope, and every family is cutting meat.",
      },
    },
    {
      title: "The Herd Is Close",
      lines: {
        aim: "Hunt while the herd is close.",
        intro: "A herd of game has come close to camp, closer than it has been all season. Everyone who can hunt is getting ready.",
        threat: "A good kill feeds everyone for days. In a day or two the herd will move on.",
        partner: "Your {partnerKin} {partner} is getting the knives ready.",
        "kin-partner": "Bring back meat.",
        "cast-friend": "Spotted the herd first and wants to hunt it with you.",
        seen: "There's a herd out past the trees. Come on, before they move.",
        plan: "The rest of the camp is going to drive the herd together, and the meat will be shared out after. {friend} wants to go after them now, just the two of you, and take the best animal before the others are ready.",
        "drive:label": "Join the drive",
        "stalk:label": "Go now with {friend}",
        spooked: "The herd caught your scent and ran. {friend} thinks you can still catch the stragglers.",
        "follow:label": "Go after them",
        "back:label": "Go back to camp",
        kill: "You and {friend} creep up downwind and bring down a fat one before anyone else is out. You get first pick of the meat, and the hide is yours.",
        shared: "The drive works. By dark there are three animals down, and the meat is shared out among every family in camp, a fair piece for yours.",
        late: "You follow the herd until your legs shake, and bring down a straggler at dusk. It's a long walk back with the meat.",
        given: "You come back with nothing. But the others made a kill, and nobody lets your family go without a share.",
        gone: "The herd got away. You come back with nothing, and your legs are shaking.",
      },
    },
  ],
};
