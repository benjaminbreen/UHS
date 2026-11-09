import { seasonAt } from "../../core/livelihood";
import { B, dueOf, EGYPT, MESOPOTAMIA, partnerWords, temper, trade, within } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const FARMING = /farm|peasant|tenant|serf|villein|fellah|crofter|cottager|cultivator|thresher|ploughman|sharecropper|labourer|homesteader|terrace|rice|millet|potato/;

// The harvest on the Nile and in southern Iraq comes in a rainless season.
const IRRIGATED = [{ years: [-100000, 3000], bounds: EGYPT }, { years: [-100000, 3000], bounds: MESOPOTAMIA }] as const;

const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });

const reaping = (c: PlotContext) => !!c.setting && ["summer", "autumn"].includes(seasonAt(c.setting.season, c.clock));

/** The crop is cut and lying out, and rain is coming. */
export const rain: PlotTemplate = {
  id: "rain",
  shape: "work",
  look: {
    emblem: "harvest",
    palette: { ink: "#0f1214", fill: "#2a3438", edge: "#5e5232", light: "#e8edf0", accent: "#d8b450" },
  },
  weight: (c) => (trade(c, FARMING) && !trade(c, /construction|railway|dock|indentured/) && reaping(c) && !within(c, ...IRRIGATED) ? 0.8 * temper(c, "conscientiousness") : 0),
  cast: () => ({}),
  begin: (c) => {
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return { deadline, words: { due, ...p.words }, refs: p.refs };
  },
  opening: [],
  developments: [
    {
      id: "clouds",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "clouds", choices: [{ id: "cart" }, { id: "cover" }, { id: "gamble", check: { stat: "wit", skill: "farming", odds: 0.4 } }] }],
    },
  ],
  endings: [
    { id: "passed", when: { type: "all", of: [{ type: "fired", id: "gamble" }, { type: "not", of: { type: "fired", id: "gamble:failed" } }] } },
    { id: "soaked", when: any({ type: "fired", id: "gamble:failed" }, { type: "due" }) },
    { id: "in", when: { type: "all", of: [{ type: "fired", id: "cart" }, any({ type: "fired", id: "worked" }, { type: "since", hours: 3 })] } },
    { id: "covered", when: { type: "all", of: [{ type: "fired", id: "cover" }, any({ type: "fired", id: "worked" }, { type: "since", hours: 3 })] } },
  ],
  wording: [
    {
      // Hay rained on while lying cut loses its feed; stacked damp, it heats and can rot or catch fire.
      scope: { years: [800, 1950], bounds: [-10, 45, 30, 62] },
      title: "Before the Rain",
      lines: {
        aim: "Save the hay from the rain.",
        intro: "The hay has been lying in rows for two days and it's nearly dry. Everyone with a rake or a fork is out in the meadow, turning it one last time.",
        threat: "Wet hay rots in the stack, and without hay the animals won't get through the winter.",
        partner: "Your {partnerKin} {partner} is raking the rows into heaps ahead of you.",
        "kin-partner": "Keep going. We can rest when it's raining.",
        clouds: "The sky to the west has gone grey and the wind has turned. The hay is still a little green underneath. Stacked damp, it can heat up and rot, or even catch fire.",
        "cart:label": "Cart it in half-dry",
        "cover:label": "Put it up in haycocks",
        "gamble:label": "Leave it spread and hope",
        in: "The last load goes into the barn as the first drops fall. It went in damp, so for weeks you'll be pushing a rod into the stack to feel for heat.",
        covered: "By the time the rain comes the meadow is dotted with haycocks. The tops get wet, but the hearts stay dry, and in two days you can spread it again.",
        passed: "The cloud goes over to the north and the sun comes back out. By evening the hay is bone dry, and you get it in sweet and green.",
        soaked: "The rain came first. The hay is lying soaked in the field, and it will have to be turned and dried all over again, if it doesn't rot.",
      },
    },
    {
      // Across the north Indian plains the wheat is cut and threshed in April and May, before the monsoon storms.
      scope: { years: [B(2500), 2100], bounds: [66, 8, 92, 32] },
      title: "Before the Rain",
      lines: {
        aim: "Save the grain on the threshing floor from the storm.",
        intro: "The wheat is cut and heaped on the threshing floor, and the oxen are treading it out. Storm clouds are building in the afternoon, the first ones before the monsoon.",
        threat: "Grain soaked on the threshing floor sprouts and rots. This is the household's food for the year.",
        partner: "Your {partnerKin} {partner} is winnowing, throwing the grain up so the wind takes the chaff.",
        "kin-partner": "Get it in the store. Don't stop to eat.",
        clouds: "The sky has gone dark yellow and the wind is picking up dust. Half the grain on the floor is still in the straw.",
        "cart:label": "Bag it as it is, chaff and all",
        "cover:label": "Heap it and cover it with mats",
        "gamble:label": "Keep threshing and hope it holds off",
        in: "The last basket is in the store when the storm breaks. It will all have to be cleaned again, but it's dry.",
        covered: "You heap the grain and tie the mats down with ropes and stones. The storm tears at them all night, but in the morning the heap is dry inside.",
        passed: "The storm passes to the south, with lightning and no rain. You finish threshing by dusk.",
        soaked: "The storm came first. The grain on the floor is soaked, and some of it will sprout before it dries.",
      },
    },
    {
      title: "Before the Rain",
      lines: {
        aim: "Save the harvest from the rain.",
        intro: "The crop is cut and lying out to dry, and the sky is darkening. Everyone is in the fields, bundling and carrying as fast as they can.",
        threat: "A harvest caught by the rain can rot where it lies. This is what the household eats until next year.",
        partner: "Your {partnerKin} {partner} is bundling ahead of you.",
        "kin-partner": "Keep going. We can rest when it's raining.",
        clouds: "The wind has turned and you can smell the rain coming. The crop is still damp underneath. Put away wet, it can go mouldy.",
        "cart:label": "Carry it in damp",
        "cover:label": "Stack it in the field and cover it",
        "gamble:label": "Leave it out and hope",
        in: "The last load is under cover as the first drops fall. It's damp, so you'll have to spread it out again inside, but it's in.",
        covered: "You stack it in the field and cover the stacks. The rain runs off them, and the crop inside stays dry.",
        passed: "The cloud passes and the sun comes back. By evening the crop is dry, and you carry it in without hurrying.",
        soaked: "The rain came first. What was still in the field is soaked, and some of it will spoil.",
      },
    },
  ],
};
