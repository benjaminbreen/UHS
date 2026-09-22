import type { GoalTemplate } from "./types";

// Work goals: ~28 covering every Workplace, seasonal where relevant
// Need goals: ~7 for hunger, fatigue, water, firewood, food
// Social goals: ~5 for talk, visit, trade

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // WORK: Wild (gather, forage, hunt)
  {
    id: "gather-plants",
    trades: /gather|forag/i,
    workplaces: ["wild"],
    slot: "work",
    bind: (c) => ({
      text: "Gather some plants.",
      check: { type: "gain", item: "flax", n: 2 },
    }),
  },
  {
    id: "hunt-game",
    trades: /hunt/i,
    workplaces: ["wild"],
    slot: "work",
    bind: (c) => ({
      text: "Hunt some game.",
      check: { type: "gain", item: "wool", n: 1 },
    }),
  },
  {
    id: "gather-fuel",
    trades: /gather|fuel/i,
    workplaces: ["wild"],
    seasons: ["winter"],
    slot: "work",
    bind: (c) => ({
      text: "Gather firewood.",
      check: { type: "gain", item: "wood", n: 2 },
    }),
  },
  {
    id: "cut-timber",
    trades: /timber|wood|fell/i,
    workplaces: ["wild"],
    slot: "work",
    bind: (c) => ({
      text: "Cut some timber.",
      check: { type: "gain", item: "wood", n: 3 },
    }),
  },
  // WORK: Water (fish, washing, water work)
  {
    id: "fish-nets",
    trades: /fish|net/i,
    workplaces: ["water"],
    slot: "work",
    bind: (c) => ({
      text: "Catch some fish.",
      check: { type: "gain", item: "fish", n: 2 },
    }),
  },
  {
    id: "haul-water",
    trades: /water|wash/i,
    workplaces: ["water"],
    slot: "work",
    bind: (c) => ({
      text: "Haul some water.",
      check: { type: "gain", item: "water", n: 2 },
    }),
  },
  // WORK: Field (farm, sow, harvest, plough)
  {
    id: "sow-seed",
    trades: /farm|plough|peasant|cultivat|sow/i,
    workplaces: ["field"],
    seasons: ["spring"],
    slot: "work",
    bind: (c) => ({
      text: "Sow some seed.",
      check: { type: "gain", item: "grain", n: 1 },
    }),
  },
  {
    id: "tend-fields",
    trades: /farm|plough|peasant|cultivat|tend/i,
    workplaces: ["field"],
    seasons: ["summer"],
    slot: "work",
    bind: (c) => ({
      text: "Tend the fields.",
      check: { type: "gain", item: "grain", n: 1 },
    }),
  },
  {
    id: "harvest-crop",
    trades: /farm|harvest|crop|reap|gather/i,
    workplaces: ["field"],
    seasons: ["autumn"],
    slot: "work",
    bind: (c) => ({
      text: "Bring in the crop.",
      check: { type: "gain", item: "grain", n: 3 },
    }),
  },
  // WORK: Pasture (herd, shepherd, animals)
  {
    id: "herd-animals",
    trades: /herd|shepherd|goat|cattle|tend.*animal/i,
    workplaces: ["pasture"],
    slot: "work",
    bind: (c) => ({
      text: "Mind the herd.",
      check: { type: "gain", item: "wool", n: 2 },
    }),
  },
  {
    id: "milk-animals",
    trades: /herd|shepherd|dairy|milk/i,
    workplaces: ["pasture"],
    slot: "work",
    bind: (c) => ({
      text: "Milk the animals.",
      check: { type: "gain", item: "wool", n: 1 },
    }),
  },
  // WORK: Extraction (mine, quarry, salt, brick, lime)
  {
    id: "work-mine",
    trades: /mine|dig|extract|under/i,
    workplaces: ["extraction"],
    slot: "work",
    bind: (c) => ({
      text: "Work the mine.",
      check: { type: "gain", item: "obsidian", n: 2 },
    }),
  },
  {
    id: "work-stone",
    trades: /stone|quarry|cut.*stone/i,
    workplaces: ["extraction"],
    slot: "work",
    bind: (c) => ({
      text: "Work the stone.",
      check: { type: "gain", item: "wood", n: 1 },
    }),
  },
  {
    id: "make-brick",
    trades: /brick|clay|fire/i,
    workplaces: ["extraction"],
    slot: "work",
    bind: (c) => ({
      text: "Make some brick.",
      check: { type: "gain", item: "wood", n: 2 },
    }),
  },
  // WORK: Market (merchant, trader, vendor, sell, buy)
  {
    id: "mind-stall",
    trades: /merchant|trader|vendor|market|stall|exchange/i,
    workplaces: ["market"],
    slot: "work",
    bind: (c) => ({
      text: `Sell at the market.`,
      check: { type: "trade" },
    }),
  },
  {
    id: "buy-supplies",
    trades: /merchant|trader|vendor|market|exchange/i,
    workplaces: ["market"],
    slot: "work",
    bind: (c) => ({
      text: `Buy some supplies.`,
      check: { type: "trade" },
    }),
  },
  // WORK: Civic (priest, scribe, official, building)
  {
    id: "keep-records",
    trades: /priest|scribe|official|record|keeper/i,
    workplaces: ["civic"],
    slot: "work",
    bind: (c) => ({
      text: "Keep the records.",
      check: { type: "talk" },
    }),
  },
  {
    id: "tend-sick",
    trades: /priest|healer|doctor|tend.*sick|medicine/i,
    workplaces: ["civic"],
    slot: "work",
    bind: (c) => ({
      text: "Tend the sick.",
      check: { type: "talk" },
    }),
  },
  {
    id: "stand-watch",
    trades: /watch|guard|stand|official/i,
    workplaces: ["civic"],
    slot: "work",
    bind: (c) => ({
      text: "Stand watch.",
      check: { type: "gain", item: "coin", n: 1 },
    }),
  },
  // WORK: Carrying (porter, carter, boatman)
  {
    id: "carry-load",
    trades: /porter|carter|carry|load|boatman/i,
    workplaces: ["carrying"],
    slot: "work",
    bind: (c) => ({
      text: "Carry a load.",
      check: { type: "gain", item: "coin", n: 1 },
    }),
  },
  {
    id: "travel",
    trades: /travel|porter|carry|errand/i,
    workplaces: ["carrying"],
    slot: "work",
    bind: (c) => ({
      text: "Travel.",
      check: { type: "gain", item: "coin", n: 1 },
    }),
  },
  // WORK: Workshop (smith, potter, weaver, tanner, carpenter)
  {
    id: "smith-work",
    trades: /smith|metal|forge/i,
    workplaces: ["workshop"],
    slot: "work",
    bind: (c) => ({
      text: "Work the forge.",
      check: { type: "gain", item: "obsidian", n: 1 },
    }),
  },
  {
    id: "potter-work",
    trades: /potter|clay|ceramic/i,
    workplaces: ["workshop"],
    slot: "work",
    bind: (c) => ({
      text: "Make some pottery.",
      check: { type: "gain", item: "coin", n: 1 },
    }),
  },
  {
    id: "weave",
    trades: /weav|loom|fiber|textile/i,
    workplaces: ["workshop"],
    slot: "work",
    bind: (c) => ({
      text: "Weave some cloth.",
      check: { type: "gain", item: "flax", n: 2 },
    }),
  },
  {
    id: "tanner-work",
    trades: /tanner|leather|hide|skin/i,
    workplaces: ["workshop"],
    slot: "work",
    bind: (c) => ({
      text: "Work the leather.",
      check: { type: "gain", item: "wool", n: 1 },
    }),
  },
  {
    id: "carpenter-work",
    trades: /carpenter|wood|craft|build/i,
    workplaces: ["workshop"],
    slot: "work",
    bind: (c) => ({
      text: "Work the wood.",
      check: { type: "gain", item: "wood", n: 2 },
    }),
  },
  // WORK: Household (cook, preparing food, cleaning, fire)
  {
    id: "cook-meal",
    trades: /cook|kitchen|food|bread|prepare/i,
    workplaces: ["household"],
    slot: "work",
    bind: (c) => ({
      text: "Prepare a meal.",
      check: { type: "gain", item: "bread", n: 1 },
    }),
  },
  {
    id: "household-craft",
    trades: /household|craft|clean|keep/i,
    workplaces: ["household"],
    slot: "work",
    bind: (c) => ({
      text: "Do household work.",
      check: { type: "gain", item: "coin", n: 1 },
    }),
  },

  // NEED: Food, water, rest, fuel
  {
    id: "need-eat",
    slot: "need",
    fit: (c) => (c.hunger > 80 ? 2 : 0),
    bind: (c) => {
      const breadCount = c.inventory.bread ?? 0;
      const grainCount = c.inventory.grain ?? 0;
      if (breadCount > 0 || grainCount > 0) {
        return {
          text: "Eat something.",
          check: { type: "eat", below: 50 },
        };
      }
      return undefined;
    },
  },
  {
    id: "need-rest",
    slot: "need",
    fit: (c) => (c.fatigue > 80 ? 2 : 0),
    bind: (c) => ({
      text: "Get some rest.",
      check: { type: "rest", below: 50 },
    }),
  },
  {
    id: "need-fetch-water",
    slot: "need",
    fit: (c) => ((c.inventory.water ?? 0) === 0 ? 1 : 0),
    bind: (c) => {
      if (!c.places.water) return undefined;
      return {
        text: `Get water from ${c.places.water}.`,
        check: { type: "visit", placeKind: "water" },
      };
    },
  },
  {
    id: "need-gather-firewood",
    slot: "need",
    seasons: ["winter"],
    fit: (c) => ((c.inventory.wood ?? 0) < 2 ? 1 : 0),
    bind: (c) => ({
      text: "Gather firewood.",
      check: { type: "gain", item: "wood", n: 2 },
    }),
  },
  {
    id: "need-buy-food",
    slot: "need",
    fit: (c) => {
      const hasFood = (c.inventory.bread ?? 0) > 0 || (c.inventory.grain ?? 0) > 0;
      return !hasFood && c.currency ? 1 : 0;
    },
    bind: (c) => {
      if (!c.currency || !c.places.market) return undefined;
      const canAfford = (c.inventory[c.currency] ?? 0) > 0;
      if (!canAfford) return undefined;
      return {
        text: `Buy food at ${c.places.market}.`,
        check: { type: "visit", placeKind: "market" },
      };
    },
  },
  {
    id: "need-mend-tools",
    slot: "need",
    seasons: ["winter"],
    fit: (c) => ((c.inventory.tool ?? 0) === 0 ? 1 : 0),
    bind: (c) => ({
      text: "Mend the tools.",
      check: { type: "gain", item: "tool", n: 1 },
    }),
  },
  {
    id: "need-cook-bread",
    slot: "need",
    fit: (c) => {
      const hasGrain = (c.inventory.grain ?? 0) > 0;
      const hasBread = (c.inventory.bread ?? 0) > 0;
      return hasGrain && !hasBread ? 1 : 0;
    },
    bind: (c) => ({
      text: "Bake some bread.",
      check: { type: "gain", item: "bread", n: 1 },
    }),
  },

  // SOCIAL: Talk, visit, trade
  {
    id: "social-talk",
    slot: "social",
    bind: (c) => ({
      text: "Talk to someone.",
      check: { type: "talk" },
    }),
  },
  {
    id: "social-visit-market",
    slot: "social",
    bind: (c) => {
      if (!c.places.market) return undefined;
      return {
        text: `Visit ${c.places.market}.`,
        check: { type: "visit", placeKind: "market" },
      };
    },
  },
  {
    id: "social-visit-shrine",
    slot: "social",
    bind: (c) => {
      if (!c.places.shrine) return undefined;
      return {
        text: `Visit ${c.places.shrine}.`,
        check: { type: "visit", placeKind: "shrine" },
      };
    },
  },
  {
    id: "social-visit-temple",
    slot: "social",
    bind: (c) => {
      if (!c.places.temple) return undefined;
      return {
        text: `Visit ${c.places.temple}.`,
        check: { type: "visit", placeKind: "temple" },
      };
    },
  },
  {
    id: "social-trade",
    slot: "social",
    fit: (c) => (c.commodities.length > 0 ? 1 : 0),
    bind: (c) => ({
      text: "Trade with someone.",
      check: { type: "trade" },
    }),
  },
];
