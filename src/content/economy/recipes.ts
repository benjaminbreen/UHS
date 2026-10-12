import type { Livelihood } from "../characters/context-types";
import type { SeasonId } from "../../core/season";
import type { SkillId } from "../../core/skills";
import type { Step } from "./processes";

type Day = { title: string; steps: Step[] };
/** Work with a day of its own: steps in the trade's words, each somewhere,
 * and for the land a different day in each season. */
export type Recipe = {
  ids?: string[];
  activities?: string[];
  /** The trade's local name, where one kind of work goes by many. */
  label?: RegExp;
  skill: SkillId;
  wiki: string[];
  /** How the day turns into coin: a hired hand's wage, a seller's takings,
   * or a fee from the household served. */
  paid?: "wage" | "takings" | "fee";
  /** The hour the trade's day began; dawn work at 5, a baker at 3. */
  rises?: number;
  /** The prop families the trade works at inside its house, best first; the
   * house gets the first its place and period has, else works at its fire. */
  bench?: string[];
  day: Day | Record<SeasonId, Day>;
};
const recipes: Recipe[] = [
  {
    activities: ["On the line"],
    skill: "stonework",
    wiki: ["Track ballast", "Railway track"],
    paid: "wage",
    day: {
      title: "A day on the line",
      steps: [
        { name: "report", task: "Report to the {boss}", at: "station", scene: "talk", card: "rail-report", hours: 0.5 },
        { name: "tamp", task: "Tamp ballast on the line", at: "line", scene: "haul", card: "rail-line", hours: 7 },
        { name: "wage", task: "Draw the day's wage", at: "station", scene: "market", card: "rail-wage", hours: 0.5 },
      ],
    },
  },
  {
    ids: ["baker"],
    rises: 3,
    // Where the kit has no bread oven: flatbread on a tannur's wall, maize dough on the metate.
    bench: ["oven", "tannur", "earth-oven", "metate"],
    skill: "crafting",
    wiki: ["Baker", "Bread"],
    paid: "takings",
    day: {
      title: "A day at the oven",
      steps: [
        { name: "dough", task: "Fire the oven and set the dough", at: "home", label: "your {bench}", scene: "warm", card: "bake-dough", hours: 2 },
        { name: "bake", task: "Bake the loaves", at: "home", label: "your {bench}", scene: "cook", card: "bake-oven", hours: 3 },
        { name: "sell", task: "Sell the bread", at: "door", label: "your shop window", scene: "market", card: "bake-sell", hours: 3 },
      ],
    },
  },
  {
    ids: ["rice-farmer"],
    label: /\brice\b/i,
    rises: 5,
    skill: "farming",
    wiki: ["Paddy field", "Rice"],
    day: {
      spring: {
        title: "Transplanting",
        steps: [
          { name: "pull", task: "Pull seedlings from the nursery bed", at: "field", scene: "tend", hours: 2 },
          { name: "plant", task: "Transplant the paddy", at: "field", scene: "tend", card: "rice-plant", hours: 5 },
          { name: "flood", task: "Let water into the paddy", at: "water", scene: "water", hours: 1 },
        ],
      },
      summer: {
        title: "Weeding the paddy",
        steps: [
          { name: "weed", task: "Weed between the rows", at: "field", scene: "tend", card: "rice-weed", hours: 4 },
          { name: "bunds", task: "Mend the bunds", at: "field", scene: "tend", hours: 2 },
          { name: "water", task: "See to the water", at: "water", scene: "water", card: "rice-water", hours: 1 },
        ],
      },
      autumn: {
        title: "The rice harvest",
        steps: [
          { name: "cut", task: "Cut the rice", at: "field", scene: "tend", card: "rice-cut", hours: 5 },
          { name: "thresh", task: "Thresh the sheaves", at: "yard", scene: "haul", hours: 2 },
          { name: "store", task: "Measure the grain into the store", at: "yard", scene: "gather", card: "rice-rent", hours: 1 },
        ],
      },
      winter: {
        title: "The slack season",
        steps: [
          { name: "bunds", task: "Rebuild the bunds", at: "field", scene: "tend", hours: 3 },
          { name: "manure", task: "Carry manure to the paddy", at: "field", scene: "haul", card: "rice-manure", hours: 2 },
          { name: "rope", task: "Twist straw into rope", at: "home", scene: "craft", hours: 3 },
        ],
      },
    },
  },
  {
    ids: ["healer", "herbalist", "nurse"],
    rises: 7,
    skill: "foraging",
    wiki: ["Traditional medicine", "Folk medicine"],
    paid: "fee",
    day: {
      title: "A day with the sick",
      steps: [
        { name: "remedies", task: "Make up your remedies", at: "home", scene: "craft", hours: 1 },
        { name: "visit", task: "Call on the sick", at: "sick", scene: "talk", card: "heal-visit", hours: 3 },
        { name: "sit", task: "Sit with them through the worst", at: "sick", scene: "warm", card: "heal-fee", hours: 3 },
      ],
    },
  },
  {
    activities: ["Tending cultivation", "Bringing in the crop", "Watching the crop", "Working the smallholding"],
    rises: 5,
    skill: "farming",
    wiki: ["Agriculture", "Harvest"],
    day: {
      spring: {
        title: "Ploughing and sowing",
        steps: [
          { name: "seed", task: "Fetch the seed from the store", at: "yard", scene: "haul", hours: 1 },
          { name: "break", task: "Break the ground", at: "field", scene: "tend", card: "farm-plough", hours: 4 },
          { name: "sow", task: "Sow the {crop}", at: "field", scene: "tend", card: "farm-sow", hours: 3 },
        ],
      },
      summer: {
        title: "Weeding and watching",
        steps: [
          { name: "weed", task: "Hoe the weeds out of the {crop}", at: "field", scene: "tend", card: "farm-weed", hours: 4 },
          { name: "birds", task: "Scare the birds off the {crop}", at: "field", scene: "tend", hours: 2 },
          { name: "fences", task: "See to the fences and ditches", at: "field", scene: "tend", card: "farm-fence", hours: 2 },
        ],
      },
      autumn: {
        title: "The harvest",
        steps: [
          { name: "reap", task: "Reap the {crop}", at: "field", scene: "tend", card: "farm-reap", hours: 5 },
          { name: "stack", task: "Gather and stack the harvest", at: "field", scene: "haul", hours: 2 },
          { name: "home", task: "Carry the harvest home", at: "yard", scene: "haul", card: "farm-due", hours: 1 },
        ],
      },
      winter: {
        title: "The slack season",
        steps: [
          { name: "store", task: "See to the grain in the store", at: "yard", scene: "gather", card: "farm-store", hours: 2 },
          { name: "mend", task: "Mend the tools and the harness", at: "home", scene: "craft", hours: 3 },
          { name: "muck", task: "Spread muck on the field", at: "field", scene: "haul", card: "farm-muck", hours: 3 },
        ],
      },
    },
  },
  {
    activities: ["Tending animals"],
    rises: 5,
    skill: "animals",
    wiki: ["Pastoralism", "Animal husbandry"],
    day: {
      spring: {
        title: "Birthing season",
        steps: [
          { name: "pen", task: "Look over the {mothers}", at: "yard", scene: "herd", card: "herd-birth", hours: 2 },
          { name: "out", task: "Drive the {herd} out to the new grass", at: "pasture", scene: "herd", hours: 4 },
          { name: "home", task: "Bring the {herd} home", at: "yard", scene: "herd", card: "herd-home", hours: 2 },
        ],
      },
      summer: {
        title: "Summer grazing",
        steps: [
          { name: "out", task: "Drive the {herd} out to graze", at: "pasture", scene: "herd", hours: 1 },
          { name: "watch", task: "Watch the {herd}", at: "pasture", scene: "herd", card: "herd-watch", hours: 5 },
          { name: "home", task: "Bring the {herd} home", at: "yard", scene: "herd", card: "herd-home", hours: 2 },
        ],
      },
      autumn: {
        title: "Before the winter",
        steps: [
          { name: "out", task: "Graze the {herd} while the grass lasts", at: "pasture", scene: "herd", card: "herd-watch", hours: 4 },
          { name: "cull", task: "Choose which {herd} to keep", at: "yard", scene: "herd", card: "herd-cull", hours: 2 },
          { name: "home", task: "Pen the ones you keep", at: "yard", scene: "herd", hours: 2 },
        ],
      },
      winter: {
        title: "Winter feeding",
        steps: [
          { name: "feed", task: "Feed the {herd} from the winter store", at: "yard", scene: "herd", card: "herd-fodder", hours: 2 },
          { name: "water", task: "Water the {herd}", at: "well", scene: "water", hours: 2 },
          { name: "muck", task: "Muck out the pens", at: "yard", scene: "haul", hours: 3 },
        ],
      },
    },
  },
  {
    activities: ["Working cloth", "Weaving"],
    skill: "crafting",
    wiki: ["Weaving", "Spinning (textiles)"],
    day: {
      title: "A day at the loom",
      steps: [
        { name: "spin", task: "Spin the yarn", at: "home", scene: "craft", card: "cloth-yarn", hours: 3 },
        { name: "weave", task: "Weave at the loom", scene: "craft", card: "cloth-loom", hours: 4 },
        { name: "sell", task: "Take the cloth to market", barter: "Trade the cloth with a neighbour", at: "market", scene: "market", card: "cloth-sell", hours: 1 },
      ],
    },
  },
  {
    activities: ["Working metal"],
    bench: ["anvil"],
    skill: "crafting",
    wiki: ["Blacksmith", "Forge"],
    day: {
      title: "A day at the forge",
      steps: [
        { name: "fire", task: "Light the forge and work the bellows", scene: "warm", card: "smith-iron", hours: 1 },
        { name: "hammer", task: "Hammer out the work", scene: "craft", card: "smith-burn", hours: 5 },
        { name: "deliver", task: "Take the {good} to whoever ordered it", at: "client", client: true, scene: "talk", card: "smith-pay", hours: 1 },
      ],
    },
  },
  {
    activities: ["Working wood", "Working timber"],
    skill: "woodcraft",
    wiki: ["Carpentry", "Woodworking"],
    day: {
      title: "A day at the bench",
      steps: [
        { name: "timber", task: "Choose and split the timber", at: "yard", scene: "haul", card: "wood-timber", hours: 2 },
        { name: "shape", task: "Shape it at the bench", scene: "craft", card: "wood-knot", hours: 4 },
        { name: "deliver", task: "Deliver the work", at: "client", client: true, scene: "talk", card: "wood-client", hours: 1 },
      ],
    },
  },
  {
    activities: ["Exchanging goods", "Exchanging supplies", "Minding the stall"],
    rises: 5,
    skill: "trade",
    wiki: ["Marketplace", "Merchant"],
    paid: "takings",
    day: {
      title: "A day at the market",
      steps: [
        { name: "set out", task: "Set out your wares", at: "market", scene: "market", hours: 1 },
        { name: "sell", task: "Sell through the day", at: "market", scene: "market", card: "market-day", hours: 6 },
        { name: "count", task: "Count the takings at home", at: "home", scene: "market", card: "market-count", hours: 1 },
      ],
    },
  },
  {
    activities: ["Household work", "Looking after the household", "Keeping the house"],
    rises: 5,
    skill: "farming",
    wiki: ["Housekeeping", "History of cooking"],
    day: {
      title: "A day keeping house",
      steps: [
        { name: "water", task: "Fetch the day's water", at: "well", scene: "water", card: "house-well", hours: 1 },
        { name: "cook", task: "Grind, cook and keep the fire", at: "home", scene: "cook", card: "house-pot", hours: 5 },
        { name: "buy", task: "Get what the house needs", barter: "Trade with a neighbour for what the house needs", at: "market", scene: "market", card: "house-market", hours: 2 },
      ],
    },
  },
  {
    activities: ["Keeping the record"],
    rises: 8,
    skill: "speech",
    wiki: ["Scribe", "Literacy"],
    day: {
      title: "A day of writing",
      steps: [
        { name: "prepare", task: "Make ready your writing things", at: "home", scene: "craft", hours: 1 },
        { name: "write", task: "Write for whoever needs it", at: "market", scene: "talk", card: "scribe-ask", hours: 5 },
        { name: "deliver", task: "Carry the finished work to its owner", at: "client", client: true, scene: "talk", card: "scribe-fee", hours: 1 },
      ],
    },
  },
  {
    activities: ["Standing watch"],
    skill: "arms",
    wiki: ["Watchman (law enforcement)", "Town guard"],
    day: {
      title: "A day on watch",
      steps: [
        { name: "post", task: "Take up your post", at: "market", label: "your post", scene: "rest", hours: 3 },
        { name: "round", task: "Walk the round", at: "wild", label: "the edge of town", scene: "walk", card: "watch-round", hours: 3 },
        { name: "report", task: "Hand over the watch", at: "market", label: "your post", scene: "talk", card: "watch-report", hours: 1 },
      ],
    },
  },
];
export const recipeFor = (kit: Livelihood) =>
  recipes.find((r) => r.ids?.includes(kit.id)) ??
  recipes.find((r) => r.activities?.includes(kit.activity) || r.label?.test(kit.label));
