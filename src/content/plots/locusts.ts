import { CHINA, neighbours, partnerWords, pickOf, pronounWords, temper, within, working } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const ALL = [-100000, 10000] as const;
/** Where swarms came often enough to be remembered: the desert locust's range,
 * the migratory locust's in China, and the Rocky Mountain locust's on the plains. */
const SWARMS = [
  [-18, 10, 75, 37], // the Sahel and North Africa to Persia and the Indus
  [68, 15, 90, 32], // northern India
  [105, 28, 122, 41], // the North China plain
  [-106, 33, -92, 50], // the Great Plains
] as const;
const PLAINS = { years: [1873, 1878], bounds: [-106, 33, -92, 50] } as const;

const neighbourOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 60);
  return pool.length ? pickOf(c, pool, "locusts-neighbour") : undefined;
};

/** A dark smear on the horizon that is not cloud. */
export const locusts: PlotTemplate = {
  id: "locusts",
  shape: "world",
  look: {
    emblem: "swarm",
    palette: { ink: "#16120a", fill: "#5a5a3a", edge: "#8a6a2a", light: "#f0ecd4", accent: "#d8b84a" },
  },
  weight: (c) => {
    if (!working(c) || c.setting?.season === "winter" || !neighbourOf(c)) return 0;
    return (within(c, PLAINS) ? 0.9 : within(c, ...SWARMS.map((bounds) => ({ years: ALL, bounds }))) ? 0.35 : 0) * temper(c, "neuroticism");
  },
  cast: (c) => {
    const neighbour = neighbourOf(c);
    return neighbour && { neighbour };
  },
  begin: (c, cast) => {
    const neighbour = cast.neighbour!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 19 * 3600,
      words: { neighbour: neighbour.name, ...pronounWords(neighbour), ...p.words },
      refs: { neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "cloud", focus: "neighbour", choices: [{ id: "fight" }, { id: "reap" }, { id: "catch" }] }],
  developments: [
    { id: "joined", when: { type: "fired", id: "fight" }, then: [{ type: "regard", role: "neighbour", delta: 1 }, { type: "gather", at: "edge", when: 1, label: "smoking", aim: "go", scene: "smoke" }] },
    {
      id: "line",
      when: { type: "all", of: [{ type: "fired", id: "fight" }, { type: "came" }] },
      then: [{ type: "choose", line: "fires", focus: "neighbour", choices: [{ id: "hold", check: { stat: "endurance", odds: 0.5 } }, { id: "reap" }] }],
    },
    { id: "near", when: { type: "since", hours: 2 }, then: [{ type: "card", line: "near" }] },
  ],
  endings: [
    { id: "stripped", when: { type: "all", of: [{ type: "fired", id: "near" }, { type: "fired", id: "hold:failed" }] } },
    { id: "saved", when: { type: "all", of: [{ type: "fired", id: "near" }, { type: "fired", id: "hold" }] } },
    { id: "reaped", when: { type: "all", of: [{ type: "fired", id: "near" }, { type: "fired", id: "reap" }] } },
    { id: "eaten", when: { type: "all", of: [{ type: "fired", id: "near" }, { type: "fired", id: "catch" }] } },
    { id: "landed", when: { type: "any", of: [{ type: "gathered" }, { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "joined" } }] }] } },
  ],
  wording: [
    {
      // In 1874 the Rocky Mountain locust stripped the plains from Dakota to Texas; it was extinct by 1902.
      scope: PLAINS,
      title: "Grasshoppers",
      lines: {
        intro: "In the west the sky has gone a strange grey, glittering at the edges. It is grasshoppers, more than anyone can count, and they are coming this way.",
        threat: "Last year they ate everything green, the onions out of the ground, the wool off the sheep, the handles of the hoes.",
        partner: "Your {partnerKin} {partner} is pulling blankets off the beds to throw over the garden.",
        "kin-partner": "Get the blankets over the garden. Then go and help {neighbour}.",
        "cast-neighbour": "Is dragging brush into rows to burn when they land.",
        cloud: "The grey is a cloud now, and the light under it has gone strange. {neighbour} is dragging brush into rows along the field edge to burn, and wants another pair of hands.",
        "fight:label": "Burn brush with {neighbour}",
        "fight:then": "{neighbour} says to meet at the field edge, and to bring a pitchfork.",
        smoking: "Burning brush against the grasshoppers",
        fires: "The brush rows are ready along the field edge, and the grey cloud is nearly overhead. {neighbour} hands you a burning torch.",
        "hold:label": "Light the rows and keep them burning",
        "hold:then": "You get the rows lit, and the smoke lies thick along the field edge.",
        "hold:failed": "You get the rows lit, but the wind is wrong and the smoke blows back over your own house.",
        "catch:label": "Turn the hogs and chickens out on them",
        "catch:then": "You open the pens. The chickens are beside themselves before the first grasshopper lands.",
        near: "The first of them are dropping now, rattling off the roof like hail. The sun has gone dim.",
        saved: "You and {neighbour} burn and beat till dark. A strip of the field behind the smoke is still green. The rest is stalks.",
        stripped: "They fly straight through the smoke. By evening the field is stalks, yours and {neighbour}'s alike.",
        reaped: "You cut what you could, green as it was. The rest of the field is stalks by evening, but you have something.",
        eaten: "The hogs and chickens eat grasshoppers till they can't move. The field is stalks, but the animals are fat, and the eggs taste of grasshopper for a month.",
        landed: "By evening there is nothing green left. They sit on the fence posts, still eating.",
      },
    },
    {
      // In 716 the minister Yao Chong had locusts driven into fires at night and buried in trenches, against those who said they were Heaven's punishment.
      scope: { years: [700, 1912], bounds: CHINA },
      title: "Locusts",
      lines: {
        intro: "There is a dark smear on the horizon, and it isn't cloud: it's locusts. The magistrate's runners are already through the village saying every household must turn out to fight them.",
        threat: "Some people say locusts are Heaven's punishment and shouldn't be killed. The magistrate pays by the bushel for dead ones.",
        partner: "Your {partnerKin} {partner} is getting the sacks out, for catching them.",
        "kin-partner": "Take sacks. The magistrate pays for them by the bushel.",
        "cast-neighbour": "Is digging a trench across the edge of the fields, to drive them into.",
        cloud: "The smear is a cloud now, and the noise has started. {neighbour} is digging a trench across the field edge, to drive them into and bury them, and wants another pair of hands.",
        "fight:label": "Dig the trench with {neighbour}",
        "fight:then": "{neighbour} says to meet at the field edge, and to bring a spade.",
        smoking: "Digging a trench against the locusts",
        fires: "{neighbour} has marked out the trench along the field edge, with fires laid beside it. The cloud is getting closer.",
        "hold:label": "Dig the trench with {neighbour}",
        "hold:then": "You and {neighbour} get the trench dug and the fires lit along it before the first of them come.",
        "hold:failed": "The ground is hard and the trench is only half dug when the first of them come.",
        "catch:label": "Sack them for the magistrate's bounty",
        "catch:then": "You take every sack in the house and go to where they are thickest.",
        near: "The first of them are dropping now. The noise of them is like rain on a roof.",
        saved: "You and {neighbour} drive them into the trench and the fires till dark. Half the field is saved.",
        stripped: "They come over the half-dug trench in a sheet. By evening the field is stalks, and the magistrate's men are counting the damage.",
        eaten: "The field is stalks by evening, but the magistrate's clerk weighs your sacks and pays for three bushels of dead locusts.",
        landed: "By evening there is nothing green left. The magistrate's men count the damage, field by field.",
      },
    },
    {
      title: "Locusts",
      lines: {
        aim: "Save what you can of the harvest.",
        intro: "There is a dark smear on the horizon, and it isn't cloud. It's locusts, and the wind is bringing them this way.",
        threat: "A swarm can strip a field in an hour. What's in the ground now is what you eat this year.",
        partner: "Your {partnerKin} {partner} is getting the pots and pans out, to beat when they come.",
        "kin-partner": "Take a pot to bang. Go and help {neighbour}.",
        "cast-neighbour": "Is gathering people with pots and smoky fires to keep them off the fields.",
        cloud: "The smear is a cloud now, coming on the wind. {neighbour} is gathering people with pots and green wood for smoky fires, and wants another pair of hands.",
        "fight:label": "Make smoke and noise with {neighbour}",
        "fight:then": "{neighbour} says to meet at the field edge, and to bring a pot and some green wood.",
        smoking: "Making smoke against the locusts",
        go: "Be at the field edge with {neighbour} {meet}. It's marked on your map.",
        fires: "The fires are laid along the field edge, and the cloud is nearly overhead. {neighbour} hands you a pot to beat.",
        "hold:label": "Keep the fires smoking",
        "hold:then": "You get the fires smoking and the pots going along the field edge.",
        "hold:failed": "You get the fires going, but the green wood won't smoke properly and the wind takes what there is.",
        "reap:label": "Cut what you can before they land",
        "reap:then": "You cut as fast as you can, green or not, and carry it under a roof.",
        "catch:label": "Get sacks out to catch them",
        "catch:then": "You get every sack and basket in the house ready. Locusts are food.",
        near: "The first of them are dropping now. The noise of them is like rain on a roof.",
        saved: "You and {neighbour} bang and burn till dark. Part of the field behind the smoke is saved.",
        stripped: "They fly straight through the thin smoke. By evening the field is stalks.",
        reaped: "You cut what you could, green as it was. The rest of the field is stalks by evening, but you have something.",
        eaten: "The field is stalks by evening, but you have sacks of locusts, roasted and dried. People will eat them for weeks.",
        landed: "By evening there is nothing green left. At least they can be eaten, people say, and start roasting them.",
      },
    },
  ],
};
