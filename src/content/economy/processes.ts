import type { Livelihood } from "../characters/context-types";
import type { SeasonId } from "../../core/season";
import type { SkillId } from "../../core/skills";
import { workplaceFor } from "../characters/workplace";
import { recipeFor, type Recipe } from "./recipes";
import { goodsOf } from "./goods";

/**
 * The shape of a day's work, read off a livelihood's activity like its
 * workplace is. Five families cover the catalogue: a regional kit changes the
 * nouns, not the loop.
 */
export const processFamilies = {
  /** A living stock that grows with care and declines without it. */
  tend: { stages: ["prepare", "tend", "take"], hours: 8 },
  /** Take from a patch that refills; taking hard slows the refill. */
  gather: { stages: ["find", "take", "bring home"], hours: 6 },
  /** Inputs, labour and time become an output. */
  transform: { stages: ["prepare", "work", "finish"], hours: 8 },
  /** Move goods from where they are to where they are needed. */
  carry: { stages: ["load", "carry", "deliver"], hours: 6 },
  /** Meet other people's needs for regard and pay. */
  serve: { stages: ["wait", "attend", "settle"], hours: 8 },
} as const;
export type ProcessFamily = keyof typeof processFamilies;

type Entry = [ProcessFamily, ...string[]];
/** Family, then the prop families where the work is done, if any has one. */
const byActivity: Record<string, Entry> = {
  "Tending cultivation": ["tend", "hoe", "rake"],
  "Watching the crop": ["tend"],
  "Bringing in the crop": ["tend", "sickle", "scythe", "sheaf"],
  "Working the smallholding": ["tend", "hoe", "chicken-coop"],
  "Tending animals": ["tend", "stock-pen", "trough", "milk-churn"],
  "Keeping the hives": ["tend", "beehive", "log-hive", "pipe-hive"],

  "Gathering plants": ["gather", "open-basket"],
  "Gathering supplies": ["gather", "open-basket"],
  "Looking for game": ["gather", "spear", "hide-frame"],
  "Cutting timber": ["gather", "woodpile"],
  "Gathering fuel": ["gather", "woodpile"],
  "Working near water": ["gather", "fish-weir", "drying-rack"],
  "Working the water": ["gather", "fish-weir", "drying-rack"],
  "Working underground": ["gather", "pick"],
  "Working stone": ["gather", "pick", "boulder"],
  "Working the salt": ["gather", "sack"],

  "Working the grain": ["transform", "quern", "grinder", "pounding-mortar", "metate"],
  "Preparing food": ["transform", "grinder", "pounding-mortar", "oven", "tannur", "earth-oven"],
  Cooking: ["transform", "cooking-pot", "hearth", "stove"],
  Brewing: ["transform", "barrel", "storage-jar"],
  "Pressing oil": ["transform", "amphora", "pithos"],
  "Working cloth": ["transform", "warp-loom", "backstrap-loom", "loom"],
  Weaving: ["transform", "warp-loom", "backstrap-loom", "loom"],
  "Twisting fibre": ["transform"],
  "Making clothes": ["transform", "bench"],
  "Household craft work": ["transform"],
  "Working hides": ["transform", "hide-frame"],
  "Working leather": ["transform", "tanning-pits", "hide-frame", "bench"],
  "Making shoes": ["transform", "bench"],
  "Working metal": ["transform", "anvil"],
  "Making tools": ["transform", "knapping-floor", "anvil"],
  "Working wood": ["transform", "woodpile"],
  "Working timber": ["transform", "woodpile"],
  "Raising a barrel": ["transform", "barrel"],
  "At the workbench": ["transform"],
  "Turning pots": ["transform", "earthen-pot"],
  "Working glass": ["transform"],
  "Making candles": ["transform"],
  "Boiling soap": ["transform", "cooking-pot"],
  "Making brick": ["transform"],
  "Burning charcoal": ["transform", "woodpile"],
  "Burning lime": ["transform"],
  "At the machine": ["transform"],
  "On the line": ["transform"],
  Building: ["transform"],
  "Working the roof": ["transform"],

  "Carrying a load": ["carry", "farm-cart", "wheelbarrow", "sack"],
  "Carrying water": ["carry", "well", "town-well", "framed-well", "pump", "water-jug"],
  Traveling: ["carry"],
  "Running errands": ["carry"],
  "Clearing waste": ["carry", "wheelbarrow"],
  "Working the wharf": ["carry", "crate-stack", "barrel"],

  "Exchanging goods": ["serve", "market-counter", "beam-scale", "crate-stack", "grain-sacks"],
  "Exchanging supplies": ["serve", "market-counter", "beam-scale", "crate-stack", "grain-sacks"],
  "Minding the stall": ["serve", "market-counter", "beam-scale", "crate-stack"],
  "Keeping the house": ["serve"],
  "Keeping the record": ["serve"],
  "Standing watch": ["serve"],
  "Tending the sick": ["serve"],
  "Attending on someone": ["serve"],
  "At the rite": ["serve", "wayside-shrine", "standing-stone"],
  "Playing and telling": ["serve", "council-fire"],
  "Household work": ["serve", "hearth"],
  "Looking after the household": ["serve", "hearth"],
  "Keeping the fire": ["serve", "hearth", "camp-hearth", "communal-hearth"],
  Cleaning: ["serve"],
  Washing: ["serve", "washing-line"],
};

/** Trades done under a roof: their station stands inside the house, not in the yard. */
const indoors = new Set([
  "Working the grain", "Cooking", "Brewing", "Working cloth", "Weaving",
  "Twisting fibre", "Making clothes", "Household craft work", "Making shoes",
  "At the workbench", "Turning pots", "Making candles", "Keeping the record",
  "Household work", "Looking after the household", "Keeping the house",
  "Tending the sick", "Playing and telling",
]);

/** Where a recipe's step is done, found on the map rather than at a prop. */
/** `home` is inside the house at its work spot, `yard` the store out front, `door` the street door. */
export type PlaceRole = "workplace" | "station" | "line" | "home" | "yard" | "door" | "field" | "pasture" | "water" | "sick" | "market" | "client" | "wild" | "shore" | "well";
/** One stage of a day: a short name for the strip, the thing to do, and
 * whether it happens at a client's house instead of at home. A recipe's step
 * also names its place, the task screen's scene for it and its card. */
export type Step = {
  name: string;
  task: string;
  client?: boolean;
  at?: PlaceRole;
  scene?: string;
  card?: string;
  /** Its share of the day, where the steps are not equal. */
  hours?: number;
  /** What to call the place, where the role's own name is too plain. */
  label?: string;
  /** The task where people had no market and traded hand to hand. */
  barter?: string;
};

// The work itself stays at the trade's prop; the steps round it go where the
// work went: out for the materials, to the market, to whoever it was for.
const familySteps: Record<ProcessFamily, Step[]> = {
  tend: [
    { name: "prepare", task: "Get your tools ready", at: "home", scene: "craft" },
    { name: "tend", task: "Tend the stock", scene: "tend" },
    { name: "take", task: "Take in what is ready", at: "yard", scene: "gather" },
  ],
  gather: [
    { name: "find", task: "Look for a good patch", at: "wild", scene: "walk" },
    { name: "take", task: "Gather what you can", at: "wild", scene: "gather" },
    { name: "bring home", task: "Bring it home to the stores", at: "yard", scene: "haul" },
  ],
  transform: [
    { name: "prepare", task: "Fetch your materials from the store", at: "yard", scene: "haul" },
    { name: "work", task: "Work steadily at it", scene: "craft" },
    { name: "sell", task: "Take the {good} to market", barter: "Trade the {good} with a neighbour", at: "market", scene: "market" },
  ],
  carry: [
    { name: "load", task: "Take up a load at the market", barter: "Take up a neighbour's load", at: "market", scene: "haul" },
    { name: "carry", task: "Carry it across town", at: "client", client: true, scene: "haul" },
    { name: "deliver", task: "Hand it over at the door", at: "client", client: true, scene: "talk" },
  ],
  serve: [
    { name: "wait", task: "Be ready when you are wanted", scene: "rest" },
    { name: "attend", task: "See to what is needed", at: "client", client: true, scene: "talk" },
    { name: "settle", task: "Settle up for the day", at: "home", scene: "market" },
  ],
};

/** Trades that go out to someone else's house for the day's job. */
const callOuts: [RegExp, Step[]][] = [
  [/^(painter-and-decorator)$/, [
    { name: "load up", task: "Load brushes and paint" },
    { name: "paint", task: "Paint the rooms", client: true },
    { name: "get paid", task: "Show the work and get paid", client: true },
  ]],
  [/^(plumber|electrician|glazier|chimney-sweep|thatcher|roofer)$/, [
    { name: "load up", task: "Pack your tools" },
    { name: "fix", task: "Do the job", client: true },
    { name: "get paid", task: "Show the work and get paid", client: true },
  ]],
  [/^(builder|bricklayer|mason|stonemason|construction-labourer|navvy)$/, [
    { name: "load up", task: "Gather tools and mortar" },
    { name: "build", task: "Put up the wall", client: true },
    { name: "get paid", task: "Take the day's wage", client: true },
  ]],
  [/^(laundress|washerwoman|laundry-worker)$/, [
    { name: "collect", task: "Collect the washing", client: true },
    { name: "wash", task: "Wash and dry it at home" },
    { name: "return", task: "Take it back, clean", client: true },
  ]],
  [/^(midwife|healer|nurse|care-worker|herbalist)$/, [
    { name: "prepare", task: "Pack remedies and cloths" },
    { name: "visit", task: "Call on the patient", client: true },
    { name: "tend", task: "Stay and see it through", client: true },
  ]],
  [/^(charwoman|cleaner|housemaid|domestic-servant|servant|scullion)$/, [
    { name: "set out", task: "Take your brushes and pail" },
    { name: "clean", task: "Clean the house", client: true },
    { name: "get paid", task: "Take your pay", client: true },
  ]],
];

export type Process = {
  family: ProcessFamily;
  title?: string;
  skill?: SkillId;
  wiki?: string[];
  paid?: Recipe["paid"];
  rises: number;
  bench?: string[];
  steps: Step[];
  stages: readonly string[];
  hours: number;
  stations: string[];
  makes: string[];
  indoors: boolean;
};

export function processFor(kit: Livelihood, revision = 0, season: SeasonId = "spring"): Process | undefined {
  const entry = byActivity[kit.activity];
  if (!entry) return undefined;
  const [family, ...stations] = entry;
  if (["basket-maker", "basket-weaver"].includes(kit.id)) stations.splice(0, stations.length, "open-basket");
  const recipe = recipeFor(kit);
  const day = recipe && ("title" in recipe.day ? recipe.day : recipe.day[season]);
  // Work with no day of its own draws the general deck for its family at its
  // second and third steps.
  const workplace = workplaceFor(kit.activity);
  const hunting: Step[] | undefined = kit.activity === "Looking for game" ? [
    { name: "prepare", task: "Get your hunting weapon ready", at: "home", scene: "craft", hours: 0.5 },
    { name: "hunt", task: "Track and hunt wild game", at: "wild", scene: "hunt", hours: 0 },
    { name: "bring home", task: "Bring the meat and hides home", at: "yard", scene: "haul", hours: 0.5 },
  ] : undefined;
  const steps = (hunting ?? day?.steps ?? (callOuts.find(([re]) => re.test(kit.id))?.[1] ?? familySteps[family]))
    .map((st, i) => ({
      ...st,
      ...(st.client && !st.at ? { at: "client" as const } : {}),
      ...(st.at === "wild" && workplace === "water" ? { at: "shore" as const } : {}),
      // Stone and ore are dug where the pick and the boulder are; water is
      // drawn at the well.
      ...(st.at === "wild" && workplace === "extraction" ? { at: undefined } : {}),
      ...(st.name === "load" && kit.activity === "Carrying water" ? { at: undefined, task: "Fill the vessels at the well" } : {}),
      ...(i && !hunting ? { card: `${family}-${i + 1}` } : {}),
    }));
  return {
    family, ...processFamilies[family], title: day?.title, skill: hunting ? "hunting" : recipe?.skill, wiki: recipe?.wiki, paid: recipe?.paid, rises: recipe?.rises ?? 6, bench: recipe?.bench,
    steps, stages: steps.map((s) => s.name),
    stations:recipe?.stations ?? stations, makes: goodsOf(kit, revision), indoors: indoors.has(kit.activity),
  };
}
