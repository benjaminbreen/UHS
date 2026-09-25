import type { GoalContext, GoalTemplate } from "./types";

const has = (c: GoalContext, ...ids: string[]) =>
  ids.some((id) => (c.inventory[id] ?? 0) > 0);
const place = (c: GoalContext, pattern: RegExp) =>
  c.places.find((p) => pattern.test(p.name) || pattern.test(p.sprite));
const commodity = (c: GoalContext, pattern: RegExp) =>
  c.commodities.find((id) => pattern.test(id));
const gain = (text: string, items: string[], n: number) => ({
  text,
  check: { type: "gain" as const, items, n },
});
const workText = (role: string) => {
  const title = role.toLowerCase();
  const article = /^[aeiou]/.test(title) ? "an" : "a";
  return `Do a full day's work as ${article} ${title}.`;
};
const FOOD = [
  "bread",
  "grain",
  "fish",
  "fruit",
  "berries",
  "meat",
  "cooked-meat",
];

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // Work
  {
    id: "day-of-work",
    slot: "work",
    bind: (c) => ({
      text: workText(c.role),
      check: { type: "work" as const },
    }),
  },
  {
    id: "forage",
    slot: "work",
    workplaces: ["wild"],
    trades: /gather|forag|collect|honey|nut/i,
    bind: (c) =>
      gain(
        c.season === "autumn"
          ? "Gather fruit and nuts before they fall."
          : "Gather berries and wild food.",
        ["fruit", "berries"],
        3,
      ),
  },
  {
    id: "hunt",
    slot: "work",
    trades: /hunt|trap|fowler/i,
    bind: () => gain("Bring back meat from a hunt.", ["meat"], 1),
  },
  {
    id: "hides",
    slot: "work",
    trades: /hunt|trap|tann|leather/i,
    seasons: ["autumn", "winter"],
    bind: () => gain("Take a hide for the winter.", ["hide"], 1),
  },
  {
    id: "fish",
    slot: "work",
    trades: /fish|net|boat|angl/i,
    bind: () => gain("Catch fish enough to sell or eat.", ["fish"], 2),
  },
  {
    id: "reeds",
    slot: "work",
    workplaces: ["water"],
    trades: /reed|mat|basket|thatch/i,
    bind: () => gain("Cut reeds by the water.", ["reeds"], 4),
  },
  {
    id: "wood",
    slot: "work",
    trades: /wood|timber|carpent|charcoal|fell|forest/i,
    bind: () => gain("Cut and bring in wood.", ["wood"], 3),
  },
  {
    id: "sow",
    slot: "work",
    workplaces: ["field"],
    seasons: ["spring"],
    bind: (c) =>
      has(c, "grain")
        ? undefined
        : gain("Find seed grain for sowing.", ["grain"], 1),
  },
  {
    id: "weed",
    slot: "work",
    workplaces: ["field"],
    seasons: ["summer"],
    bind: () =>
      gain(
        "Clear weeds and cut fodder from the edges.",
        ["fodder", "reeds"],
        3,
      ),
  },
  {
    id: "harvest",
    slot: "work",
    workplaces: ["field"],
    seasons: ["autumn"],
    bind: () => gain("Bring in the harvest.", ["grain", "flax", "fruit"], 3),
  },
  {
    id: "winter-field",
    slot: "work",
    workplaces: ["field"],
    seasons: ["winter"],
    bind: () => gain("Lay in fuel while the fields rest.", ["wood"], 3),
  },
  {
    id: "fodder",
    slot: "work",
    workplaces: ["pasture"],
    bind: (c) =>
      gain(
        c.season === "winter"
          ? "Find fodder for the animals."
          : "Cut fodder for the flock.",
        ["fodder"],
        3,
      ),
  },
  {
    id: "wool",
    slot: "work",
    workplaces: ["pasture"],
    seasons: ["spring", "summer"],
    fit: (c) => (commodity(c, /wool/) ? 1 : 0),
    bind: () => gain("Take wool from the flock.", ["wool"], 1),
  },
  {
    id: "quarry",
    slot: "work",
    workplaces: ["extraction"],
    bind: (c) => {
      const stone = commodity(c, /obsidian|stone|ore|salt|clay/);
      return stone ? gain(`Dig out ${stone}.`, [stone], 2) : undefined;
    },
  },
  {
    id: "sell-goods",
    slot: "work",
    workplaces: ["market", "workshop"],
    bind: (c) =>
      c.currency
        ? gain("Sell enough to earn some coin.", [c.currency], 2)
        : {
            text: "Trade some of your work for what you need.",
            check: { type: "trade" },
          },
  },
  {
    id: "stock",
    slot: "work",
    workplaces: ["market"],
    bind: (c) => {
      const good = c.commodities.find((id) => id !== c.currency);
      return good ? gain(`Buy in ${good} to sell on.`, [good], 2) : undefined;
    },
  },
  {
    id: "materials",
    slot: "work",
    workplaces: ["workshop"],
    bind: (c) => {
      const raw = commodity(c, /wool|flax|wood|hide|obsidian|reeds|clay/);
      return raw ? gain(`Get ${raw} to work with.`, [raw], 2) : undefined;
    },
  },
  {
    id: "carry",
    slot: "work",
    workplaces: ["carrying"],
    bind: (c) =>
      c.currency
        ? gain("Carry a load and get paid for it.", [c.currency], 1)
        : {
            text: "Carry goods to someone who needs them.",
            check: { type: "trade" },
          },
  },
  {
    id: "civic-rounds",
    slot: "work",
    workplaces: ["civic"],
    bind: () => ({
      text: "Speak with the people in your charge.",
      check: { type: "talk" },
    }),
  },
  {
    id: "rites",
    slot: "work",
    trades: /priest|priestess|shaman|monk|nun|imam|rabbi|diviner|healer/i,
    bind: (c) => {
      const holy = place(c, /shrine|temple|church|mosque|chapel|altar|chedi/i);
      return holy
        ? {
            text: `Tend to ${holy.name}.`,
            check: { type: "visit", place: holy.name },
          }
        : {
            text: "Visit those who need your prayers.",
            check: { type: "talk" },
          };
    },
  },
  {
    id: "household",
    slot: "work",
    workplaces: ["household"],
    bind: (c) =>
      gain(
        c.season === "winter"
          ? "Keep the fire fed."
          : "Fetch water for the house.",
        [c.season === "winter" ? "wood" : "water"],
        2,
      ),
  },
  {
    id: "any-work",
    slot: "work",
    fit: () => 0.2,
    bind: (c) => {
      const good = c.commodities.find((id) => id !== c.currency);
      return good ? gain(`Get some ${good} together.`, [good], 2) : undefined;
    },
  },

  // Needs
  {
    id: "eat",
    slot: "need",
    fit: (c) => (c.hunger > 60 ? 3 : c.hunger > 40 ? 1 : 0),
    bind: () => ({
      text: "Find something to eat.",
      check: { type: "eat", below: 25 },
    }),
  },
  {
    id: "food-store",
    slot: "need",
    fit: (c) => (has(c, ...FOOD) ? 0 : 2),
    bind: () => gain("Get food to keep by you.", FOOD, 2),
  },
  {
    id: "sleep",
    slot: "need",
    fit: (c) => (c.fatigue > 70 ? 3 : 0),
    bind: () => ({
      text: "Get some rest.",
      check: { type: "rest", below: 30 },
    }),
  },
  {
    id: "water",
    slot: "need",
    seasons: ["summer"],
    fit: (c) => (has(c, "water") ? 0 : 1.5),
    bind: () => gain("Fill up with water.", ["water"], 1),
  },
  {
    id: "firewood",
    slot: "need",
    seasons: ["winter", "autumn"],
    fit: (c) => (has(c, "wood") ? 0.5 : 2),
    bind: () => gain("Gather firewood before dark.", ["wood"], 2),
  },

  // Social
  {
    id: "neighbour",
    slot: "social",
    bind: () => ({
      text: "Pass the time with a neighbour.",
      check: { type: "talk" },
    }),
  },
  {
    id: "news",
    slot: "social",
    fit: (c) => (place(c, /market|forum|square|tavern|inn|well/i) ? 1 : 0),
    bind: (c) => {
      const p = place(c, /market|forum|square|tavern|inn|well/i)!;
      return {
        text: `Hear the news at ${p.name}.`,
        check: { type: "visit", place: p.name },
      };
    },
  },
  {
    id: "worship",
    slot: "social",
    fit: (c) => (place(c, /shrine|temple|church|mosque|chapel|altar/i) ? 1 : 0),
    bind: (c) => {
      const p = place(c, /shrine|temple|church|mosque|chapel|altar/i)!;
      return {
        text: `Make an offering at ${p.name}.`,
        check: { type: "visit", place: p.name },
      };
    },
  },
  {
    id: "barter",
    slot: "social",
    bind: () => ({
      text: "Strike a bargain with someone.",
      check: { type: "trade" },
    }),
  },
];
