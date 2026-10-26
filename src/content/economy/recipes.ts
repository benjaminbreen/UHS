import type { Livelihood } from "../characters/context-types";
import type { SeasonId } from "../../core/season";
import type { SkillId } from "../../core/skills";
import type { Step } from "./processes";

/** Where a day or a piece belongs; unset, it belongs everywhere. */
type When = {
  seasons?: readonly SeasonId[];
  /** Astronomical years, start inclusive. */
  years?: readonly [number, number];
  /** West, south, east, north. */
  bounds?: readonly [number, number, number, number];
};
/** Several `When`s: the day fits any of them. */
type Day = { title: string; steps: Step[]; when?: When | readonly When[] };
/** The day being worked and where: `pick` chooses among the days that fit. */
export type Today = { pick: number; year: number; lon: number; lat: number };
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
  stations?: string[];
  /** One day, several to vary between, or one for each season. */
  day: Day | Day[] | Record<SeasonId, Day>;
  /** What the trade turns out, by place and period: `{piece}` in a day's words. */
  pieces?: { when?: When; names: string[] }[];
};
const CHINA = [100, 20, 125, 42] as const;
const EUROPE = [-10, 36, 30, 60] as const;
const EGYPT = [24, 22, 35, 32] as const;
const SOUTH_ASIA = [60, 5, 97, 37] as const;
const JAPAN = [129, 30, 146, 46] as const;
const WEST_AFRICA = [-18, 0, 15, 20] as const;
const ANDES = [-82, -35, -62, 2] as const;
const ISLAMIC = [-17, 12, 70, 44] as const;
/** Before the churches and mosques, and outside their lands after. */
const OLD_GODS = [
  { years: [-10000, 400] },
  { bounds: [-170, -60, -30, 75] },
  { bounds: [-20, -35, 52, 10] },
  { bounds: [70, -12, 180, 60] },
] as const;

const recipes: Recipe[] = [
  {
    ids:["boatwright"],skill:"crafting",wiki:["Boat building"],stations:["bench","woodpile"],
    day:{title:"A day building and repairing boats",steps:[
      {name:"timber",task:"Select timber and shape replacement pieces",at:"workplace",scene:"craft",hours:2},
      {name:"fit",task:"Fit planks and frames to the boat",at:"workplace",scene:"craft",hours:4},
      {name:"inspect",task:"Check joints and keep the launching way clear",at:"workplace",scene:"craft",hours:2},
    ]},
  },
  {
    ids:["potter"],skill:"crafting",wiki:["Pottery"],stations:["earthen-pot","bench"],
    day:{title:"A day at the pottery",steps:[
      {name:"shape",task:"Prepare clay and shape the next batch",at:"workplace",scene:"craft",hours:3},
      {name:"fire",task:"Tend the kiln and its fuel",at:"workplace",scene:"warm",hours:3},
      {name:"sort",task:"Sort cooled ware and check the drying pots",at:"workplace",scene:"craft",hours:2},
    ]},
  },
  {
    ids:["brickmaker"],skill:"crafting",wiki:["Brick"],stations:["bench","crate"],
    day:{title:"A day in the brickyard",steps:[
      {name:"mould",task:"Mould green bricks and lay them out",at:"workplace",scene:"craft",hours:3},
      {name:"dry",task:"Turn drying bricks and protect them from weather",at:"workplace",scene:"craft",hours:2},
      {name:"fire",task:"Tend the clamp and sort cooled bricks",at:"workplace",scene:"warm",hours:3},
    ]},
  },
  {
    ids:["lime-burner"],skill:"crafting",wiki:["Lime kiln"],stations:["woodpile","boulder"],
    day:{title:"A day at the lime kiln",steps:[
      {name:"charge",task:"Prepare limestone and fuel for the kiln",at:"workplace",scene:"haul",hours:3},
      {name:"tend",task:"Tend the firing or draw cooled lime",at:"workplace",scene:"warm",hours:4},
      {name:"store",task:"Keep the finished lime dry and clear the yard",at:"workplace",scene:"craft",hours:1},
    ]},
  },
  {
    ids:["dyer"],skill:"crafting",wiki:["Dyeing"],stations:["wash-tub","drying-rack"],
    day:{title:"A day at the dyehouse",steps:[
      {name:"prepare",task:"Prepare the dye bath and sort the cloth",at:"workplace",scene:"craft",hours:2},
      {name:"dye",task:"Work cloth through dye and rinsing vats",at:"workplace",scene:"water",hours:4},
      {name:"dry",task:"Hang batches to dry and clean the vats",at:"workplace",scene:"craft",hours:2},
    ]},
  },
  {
    ids:["fuller"],skill:"crafting",wiki:["Fulling"],stations:["wash-tub","drying-rack"],
    day:{title:"A day at the fullery",steps:[
      {name:"wash",task:"Sort and wet the cloth",at:"workplace",scene:"water",hours:1},
      {name:"full",task:"Full and rinse batches of cloth",at:"workplace",scene:"craft",hours:5},
      {name:"finish",task:"Stretch, inspect and dry the finished pieces",at:"workplace",scene:"craft",hours:2},
    ]},
  },
  {
    ids:["tanner"],skill:"crafting",wiki:["Tanning (leather)"],stations:["tanning-pits","hide-frame","bench"],
    day:{title:"A day in the tannery",steps:[
      {name:"scrape",task:"Scrape and sort the hides",at:"workplace",scene:"craft",hours:3},
      {name:"pits",task:"Check soaking and tanning pits",at:"workplace",scene:"water",hours:3},
      {name:"finish",task:"Hang prepared hides and clean the working area",at:"workplace",scene:"craft",hours:2},
    ]},
  },
  {
    ids: ["tax-collector"],
    skill: "speech",
    wiki: ["Tax collector"],
    paid: "wage",
    day: {
      title: "A day collecting taxes",
      steps: [
        { name: "prepare", task: "Check the tax records", at: "workplace", scene: "craft", hours: 1 },
        { name: "collect", task: "Collect payments and record what is owed", at: "workplace", scene: "talk", hours: 5 },
        { name: "account", task: "Balance the accounts and hand over the receipts", at: "workplace", scene: "craft", hours: 1 },
      ],
    },
  },
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
    pieces: [
      { names: ["a length of plain cloth", "a blanket"] },
      { when: { bounds: EUROPE }, names: ["a length of wool twill", "a cloak length"] },
      { when: { bounds: EGYPT }, names: ["a length of fine linen", "a linen shroud"] },
      { when: { bounds: SOUTH_ASIA }, names: ["a length of cotton", "a dhoti length"] },
      { when: { years: [-1500, 10001], bounds: CHINA }, names: ["a bolt of silk", "a length of hemp cloth"] },
      { when: { bounds: ANDES }, names: ["a tunic length", "a mantle"] },
    ],
    day: [
      {
        title: "Weaving {piece}",
        steps: [
          { name: "spin", task: "Spin the yarn", at: "home", scene: "craft", card: "cloth-yarn", hours: 3 },
          { name: "weave", task: "Weave at the loom", scene: "craft", card: "cloth-loom", hours: 4 },
          { name: "sell", task: "Take the cloth to market", barter: "Trade the cloth with a neighbour", at: "market", scene: "market", card: "cloth-sell", hours: 1 },
        ],
      },
      // Measuring out and threading a new warp took a whole day before a thread of weft went in.
      {
        title: "Setting up a new warp",
        steps: [
          { name: "measure", task: "Measure out the warp threads", at: "home", scene: "craft", hours: 3 },
          { name: "thread", task: "Thread the warp through the loom", scene: "craft", card: "cloth-loom", hours: 4 },
          { name: "test", task: "Weave a test strip and check the tension", scene: "craft", hours: 1 },
        ],
      },
      {
        title: "A day's spinning",
        steps: [
          { name: "comb", task: "Comb out the fibre", at: "home", scene: "craft", hours: 2 },
          { name: "spin", task: "Spin it into yarn", at: "home", scene: "craft", card: "cloth-yarn", hours: 5 },
          { name: "skein", task: "Wind the yarn into skeins", at: "home", scene: "craft", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["spinner", "wool-comber"],
    skill: "crafting",
    wiki: ["Spinning (textiles)", "Spindle (textiles)"],
    day: [
      {
        title: "A day's spinning",
        steps: [
          { name: "comb", task: "Comb out the fibre", at: "home", scene: "craft", hours: 2 },
          { name: "spin", task: "Spin it into yarn", at: "home", scene: "craft", card: "cloth-yarn", hours: 5 },
          { name: "sell", task: "Take the yarn to the weaver", barter: "Trade the yarn with a neighbour", at: "client", client: true, scene: "talk", hours: 1 },
        ],
      },
      {
        title: "Fetching fibre",
        steps: [
          { name: "buy", task: "Get raw fibre from the market", barter: "Trade with a neighbour for raw fibre", at: "market", scene: "market", hours: 2 },
          { name: "wash", task: "Wash and pick it clean", at: "well", scene: "water", hours: 3 },
          { name: "dry", task: "Spread it to dry and spin what's ready", at: "home", scene: "craft", card: "cloth-yarn", hours: 3 },
        ],
      },
    ],
  },
  {
    ids: ["basket-weaver", "basket-maker"],
    skill: "crafting",
    wiki: ["Basket weaving"],
    pieces: [{ names: ["a winnowing basket", "storage baskets", "a fish trap", "a carrying basket", "sleeping mats"] }],
    day: [
      {
        title: "Making {piece}",
        steps: [
          { name: "cut", task: "Cut reeds and willow", at: "wild", scene: "gather", hours: 2 },
          { name: "soak", task: "Soak them until they bend", at: "well", scene: "water", hours: 1 },
          { name: "weave", task: "Weave {piece}", at: "home", scene: "craft", hours: 5 },
        ],
      },
      {
        title: "Selling baskets",
        steps: [
          { name: "load", task: "Stack the finished baskets", at: "home", scene: "haul", hours: 1 },
          { name: "sell", task: "Sell them at market", barter: "Trade them with the neighbours", at: "market", scene: "market", hours: 5 },
          { name: "mend", task: "Mend a neighbour's broken basket", at: "client", client: true, scene: "craft", hours: 1 },
        ],
      },
    ],
  },
  {
    // Bark cloth from Polynesia to Uganda: the inner bark soaked and beaten out thin on a log with a grooved mallet.
    ids: ["bark-cloth-beater"],
    skill: "crafting",
    wiki: ["Tapa cloth", "Barkcloth"],
    day: {
      title: "Beating bark cloth",
      steps: [
        { name: "strip", task: "Strip the inner bark from the cut stems", at: "yard", scene: "craft", hours: 2 },
        { name: "soak", task: "Soak the strips", at: "well", scene: "water", hours: 1 },
        { name: "beat", task: "Beat the strips out thin on the log", at: "home", scene: "craft", hours: 5 },
      ],
    },
  },
  {
    ids: ["silk-farmer"],
    rises: 5,
    skill: "animals",
    wiki: ["Sericulture"],
    day: {
      title: "Feeding the silkworms",
      steps: [
        { name: "pick", task: "Pick mulberry leaves", at: "field", scene: "gather", hours: 3 },
        { name: "feed", task: "Chop the leaves and feed the trays", at: "home", scene: "tend", hours: 3 },
        { name: "clean", task: "Clean the trays and keep the room warm", at: "home", scene: "warm", hours: 2 },
      ],
    },
  },
  {
    activities: ["Working metal"],
    bench: ["anvil"],
    skill: "crafting",
    wiki: ["Blacksmith", "Forge"],
    pieces: [
      { when: { years: [-4500, -800] }, names: ["a bronze axe head", "bronze pins", "a bronze dagger", "bronze sickle blades"] },
      { when: { years: [-1600, -200], bounds: CHINA }, names: ["a bronze ritual vessel", "a bronze halberd blade"] },
      { when: { years: [-800, 10001] }, names: ["an iron sickle", "nails", "an axe head", "a door hinge", "a cooking pot"] },
      { when: { years: [-500, 10001], bounds: EUROPE }, names: ["a ploughshare", "a set of shears"] },
      { when: { years: [900, 1950], bounds: EUROPE }, names: ["horseshoes", "a barrel hoop"] },
      { when: { years: [-800, 10001], bounds: WEST_AFRICA }, names: ["hoe blades", "a spearhead"] },
    ],
    day: [
      {
        title: "Forging {piece}",
        when: { years: [-800, 10001] },
        steps: [
          { name: "fire", task: "Light the forge and work the bellows", scene: "warm", card: "smith-iron", hours: 1 },
          { name: "hammer", task: "Hammer out {piece}", scene: "craft", card: "smith-burn", hours: 5 },
          { name: "deliver", task: "Take {piece} to whoever ordered it", at: "client", client: true, scene: "talk", card: "smith-pay", hours: 1 },
        ],
      },
      // Before iron, a smith cast: copper or bronze poured into a clay or stone mould, then hammered and ground to an edge.
      {
        title: "Casting {piece}",
        when: { years: [-4500, -800] },
        steps: [
          { name: "mould", task: "Make the clay mould", scene: "craft", hours: 2 },
          { name: "pour", task: "Melt the metal and pour", scene: "warm", card: "smith-burn", hours: 3 },
          { name: "finish", task: "Break the mould and grind the edge", scene: "craft", hours: 2 },
        ],
      },
      {
        title: "Mending tools",
        steps: [
          { name: "collect", task: "Collect the broken tools from the neighbours", at: "client", client: true, scene: "talk", hours: 1 },
          { name: "mend", task: "Mend and sharpen them", scene: "craft", card: "smith-burn", hours: 5 },
          { name: "return", task: "Take them back and get paid", at: "client", client: true, scene: "talk", card: "smith-pay", hours: 1 },
        ],
      },
      {
        title: "Getting in fuel and metal",
        steps: [
          { name: "charcoal", task: "Buy charcoal and bar metal", barter: "Trade for charcoal and metal", at: "market", scene: "market", hours: 2 },
          { name: "haul", task: "Carry it home", at: "yard", scene: "haul", hours: 2 },
          { name: "forge", task: "Work up small pieces from the scrap", scene: "craft", card: "smith-iron", hours: 3 },
        ],
      },
    ],
  },
  {
    activities: ["Working wood", "Working timber"],
    skill: "woodcraft",
    wiki: ["Carpentry", "Woodworking"],
    pieces: [
      { names: ["a door", "a chest", "a bed frame", "a set of shelves", "a plough beam"] },
      { when: { years: [-3500, 10001] }, names: ["a cart bed", "a set of roof beams"] },
    ],
    day: [
      {
        title: "Making {piece}",
        steps: [
          { name: "timber", task: "Choose and split the timber", at: "yard", scene: "haul", card: "wood-timber", hours: 2 },
          { name: "shape", task: "Shape {piece} at the bench", scene: "craft", card: "wood-knot", hours: 4 },
          { name: "deliver", task: "Deliver {piece}", at: "client", client: true, scene: "talk", card: "wood-client", hours: 1 },
        ],
      },
      // Green timber was felled and split, then stacked to season for a year or more before it was worked.
      {
        title: "Felling and stacking timber",
        steps: [
          { name: "fell", task: "Fell and trim a tree", at: "wild", scene: "haul", card: "wood-timber", hours: 4 },
          { name: "haul", task: "Drag the logs home", at: "yard", scene: "haul", hours: 2 },
          { name: "stack", task: "Split and stack them to season", at: "yard", scene: "craft", hours: 2 },
        ],
      },
      {
        title: "Repairs around the village",
        steps: [
          { name: "tools", task: "Pack your tools", at: "home", scene: "craft", hours: 1 },
          { name: "fix", task: "Fix a sagging door and a broken frame", at: "client", client: true, scene: "craft", card: "wood-knot", hours: 5 },
          { name: "paid", task: "Get paid for the work", at: "client", client: true, scene: "talk", card: "wood-client", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["carver"],
    skill: "woodcraft",
    wiki: ["Carving", "Bone carving"],
    pieces: [
      { names: ["a ladle", "a set of spoons", "a carved bowl"] },
      { when: { years: [-10000, -2000] }, names: ["a bone comb", "an antler handle", "bone needles", "a bone fish hook"] },
      // Xinglongwa and Hongshan jade: jue earrings and pig-dragons, ground and drilled with sand.
      { when: { years: [-6200, -2900], bounds: CHINA }, names: ["a pair of jade earrings", "a jade pendant"] },
      { when: { years: [-3300, -2000], bounds: CHINA }, names: ["a jade bi disc", "a jade cong"] },
      { when: { years: [-3000, 10001], bounds: EGYPT }, names: ["a cosmetic box", "a statuette"] },
      { when: { years: [1000, 1700], bounds: EUROPE }, names: ["a bench end for the church", "a carved chest front"] },
      { when: { years: [960, 1368], bounds: CHINA }, names: ["a carved lacquer box", "a carved brush pot"] },
      { when: { years: [1368, 1912], bounds: CHINA }, names: ["a stone seal", "a carved brush pot"] },
      { when: { years: [1600, 1900], bounds: JAPAN }, names: ["a netsuke", "a carved comb"] },
      { when: { bounds: WEST_AFRICA }, names: ["a carved stool", "a mask for the dancers"] },
    ],
    day: [
      {
        title: "Making {piece}",
        steps: [
          { name: "choose", task: "Choose the material for {piece}", at: "yard", scene: "haul", hours: 1 },
          { name: "carve", task: "Shape {piece}", scene: "craft", card: "wood-knot", hours: 5 },
          { name: "deliver", task: "Take {piece} to whoever asked for it", at: "client", client: true, scene: "talk", card: "wood-client", hours: 1 },
        ],
      },
      // Jade is too hard to cut with a blade: it was sawn with string, ground with wet sand and drilled with a bow drill.
      {
        title: "Grinding jade",
        when: { years: [-6200, -2000], bounds: CHINA },
        steps: [
          { name: "sand", task: "Fetch wet sand for the grinding", at: "wild", scene: "gather", hours: 1 },
          { name: "grind", task: "Grind the jade with sand and water", scene: "craft", hours: 5 },
          { name: "drill", task: "Drill the hole with the bow drill", scene: "craft", card: "wood-knot", hours: 2 },
        ],
      },
      {
        title: "Working bone and antler",
        when: { years: [-10000, -2000] },
        steps: [
          { name: "soak", task: "Soak the antler until it softens", at: "well", scene: "water", hours: 1 },
          { name: "groove", task: "Cut grooves and split out blanks", scene: "craft", hours: 4 },
          { name: "polish", task: "Grind and polish the pieces", scene: "craft", card: "wood-knot", hours: 2 },
        ],
      },
      {
        title: "Finishing and polishing",
        steps: [
          { name: "smooth", task: "Smooth the rough pieces with sand and stone", scene: "craft", hours: 3 },
          { name: "oil", task: "Oil and polish them", scene: "craft", hours: 2 },
          { name: "sell", task: "Show the finished pieces", barter: "Trade the pieces with the neighbours", at: "market", scene: "market", hours: 2 },
        ],
      },
    ],
  },
  {
    ids: ["fletcher"],
    skill: "woodcraft",
    wiki: ["Fletching", "Arrow"],
    day: [
      {
        title: "Making arrows",
        steps: [
          { name: "shafts", task: "Straighten the shafts over the fire", at: "home", scene: "warm", hours: 3 },
          { name: "fletch", task: "Fit the heads and bind on the feathers", at: "home", scene: "craft", card: "wood-knot", hours: 4 },
          { name: "deliver", task: "Bundle them for the buyer", at: "client", client: true, scene: "talk", hours: 1 },
        ],
      },
      {
        title: "Gathering shafts and feathers",
        steps: [
          { name: "cut", task: "Cut straight shoots for shafts", at: "wild", scene: "gather", hours: 3 },
          { name: "feathers", task: "Get feathers and glue", barter: "Trade for feathers and glue", at: "market", scene: "market", hours: 2 },
          { name: "dry", task: "Bind the shoots to dry straight", at: "home", scene: "craft", hours: 2 },
        ],
      },
    ],
  },
  {
    ids: ["wheelwright"],
    skill: "woodcraft",
    wiki: ["Wheelwright"],
    day: {
      title: "Building a wheel",
      steps: [
        { name: "hub", task: "Shape the hub and cut the spoke holes", scene: "craft", card: "wood-knot", hours: 3 },
        { name: "spokes", task: "Drive in the spokes and fit the rim", scene: "craft", hours: 4 },
        { name: "deliver", task: "Fit the wheel to the customer's cart", at: "client", client: true, scene: "talk", card: "wood-client", hours: 1 },
      ],
    },
  },
  {
    // Dugouts were hollowed with fire and adze: burn a little, scrape the charcoal, burn again.
    ids: ["canoe-builder"],
    skill: "woodcraft",
    wiki: ["Dugout canoe"],
    day: {
      title: "Hollowing a canoe",
      steps: [
        { name: "burn", task: "Burn a shallow hollow along the log", at: "shore", scene: "warm", hours: 3 },
        { name: "scrape", task: "Scrape out the charcoal with the adze", at: "shore", scene: "craft", card: "wood-knot", hours: 4 },
        { name: "check", task: "Check the walls for thickness", at: "shore", scene: "craft", hours: 1 },
      ],
    },
  },
  {
    ids: ["cabinetmaker"],
    skill: "woodcraft",
    wiki: ["Cabinetry"],
    pieces: [{ names: ["a chest of drawers", "a writing desk", "a bookcase", "a dining table"] }],
    day: {
      title: "Making {piece}",
      steps: [
        { name: "cut", task: "Cut and plane the boards", scene: "craft", card: "wood-timber", hours: 3 },
        { name: "joint", task: "Cut the joints and glue up {piece}", scene: "craft", card: "wood-knot", hours: 4 },
        { name: "finish", task: "Polish and show {piece} to the customer", at: "client", client: true, scene: "talk", card: "wood-client", hours: 1 },
      ],
    },
  },
  {
    activities: ["Making tools"],
    skill: "stonework",
    wiki: ["Knapping", "Stone tool"],
    pieces: [
      { when: { years: [-10000, -1000] }, names: ["sickle blades", "arrowheads", "a scraper", "a polished axe"] },
      { when: { years: [-3000, 10001] }, names: ["a whetstone", "a quern stone"] },
      { when: { years: [1600, 1900] }, names: ["gunflints"] },
    ],
    day: [
      {
        title: "Knapping {piece}",
        steps: [
          { name: "find", task: "Look for good flint nodules", at: "wild", scene: "gather", hours: 2 },
          { name: "knap", task: "Knap {piece}", at: "home", scene: "craft", hours: 4 },
          { name: "haft", task: "Fit handles and trade them", barter: "Trade the tools with the neighbours", at: "market", scene: "market", hours: 2 },
        ],
      },
      // Neolithic axes were roughed out by flaking, then ground for days on a sandstone slab.
      {
        title: "Grinding an axe",
        when: { years: [-10000, -1000] },
        steps: [
          { name: "rough", task: "Rough out the axe by flaking", at: "home", scene: "craft", hours: 2 },
          { name: "grind", task: "Grind it on the sandstone with water", at: "well", scene: "water", hours: 5 },
          { name: "haft", task: "Fit it to its handle", at: "home", scene: "craft", hours: 1 },
        ],
      },
    ],
  },
  {
    activities: ["Exchanging goods", "Exchanging supplies", "Minding the stall"],
    rises: 5,
    skill: "trade",
    wiki: ["Marketplace", "Merchant"],
    paid: "takings",
    day: [
      {
        title: "A day at the market",
        steps: [
          { name: "set out", task: "Set out your wares", at: "market", scene: "market", hours: 1 },
          { name: "sell", task: "Sell through the day", at: "market", scene: "market", card: "market-day", hours: 6 },
          { name: "count", task: "Count the takings at home", at: "home", scene: "market", card: "market-count", hours: 1 },
        ],
      },
      {
        title: "Buying in stock",
        steps: [
          { name: "round", task: "Go round the producers", at: "client", client: true, scene: "talk", hours: 3 },
          { name: "haggle", task: "Haggle over the price", at: "client", client: true, scene: "market", card: "market-day", hours: 2 },
          { name: "carry", task: "Carry the stock home", at: "home", scene: "haul", card: "market-count", hours: 2 },
        ],
      },
      {
        title: "Collecting what you're owed",
        steps: [
          { name: "book", task: "Go over who owes you what", at: "home", scene: "market", hours: 1 },
          { name: "collect", task: "Call on the customers who owe you", at: "client", client: true, scene: "talk", hours: 4 },
          { name: "stall", task: "Open the stall for the afternoon", at: "market", scene: "market", card: "market-day", hours: 3 },
        ],
      },
    ],
  },
  {
    ids: ["pedlar", "chapman"],
    rises: 5,
    skill: "trade",
    wiki: ["Peddler"],
    paid: "takings",
    day: {
      title: "On the road with the pack",
      steps: [
        { name: "pack", task: "Pack needles, ribbons and small goods", at: "home", scene: "haul", hours: 1 },
        { name: "walk", task: "Walk out to the farms", at: "wild", scene: "walk", hours: 3 },
        { name: "sell", task: "Sell door to door", at: "client", client: true, scene: "market", card: "market-day", hours: 4 },
      ],
    },
  },
  {
    ids: ["hawker", "street-hawker", "costermonger", "street-vendor"],
    rises: 5,
    skill: "trade",
    wiki: ["Street vendor"],
    paid: "takings",
    day: {
      title: "Crying your wares",
      steps: [
        { name: "buy", task: "Buy your stock at first light", at: "market", scene: "market", hours: 1 },
        { name: "cry", task: "Walk the streets calling out what you sell", at: "client", client: true, scene: "walk", card: "market-day", hours: 6 },
        { name: "count", task: "Count what's left and what you made", at: "home", scene: "market", card: "market-count", hours: 1 },
      ],
    },
  },
  {
    ids: ["money-changer"],
    skill: "trade",
    wiki: ["Money changer"],
    paid: "takings",
    day: {
      title: "At the changing table",
      steps: [
        { name: "set", task: "Set out the scales and the coin", at: "market", scene: "market", hours: 1 },
        { name: "weigh", task: "Weigh and test the coins brought to you", at: "market", scene: "market", card: "market-day", hours: 6 },
        { name: "count", task: "Count the day's margin", at: "home", scene: "market", card: "market-count", hours: 1 },
      ],
    },
  },
  {
    ids: ["innkeeper", "publican"],
    skill: "trade",
    wiki: ["Inn", "Tavern"],
    paid: "takings",
    day: {
      title: "Keeping the inn",
      steps: [
        { name: "stock", task: "Buy in food and drink", barter: "Trade for food and drink", at: "market", scene: "market", hours: 2 },
        { name: "cook", task: "Cook and draw drink for the guests", at: "home", scene: "cook", card: "house-pot", hours: 5 },
        { name: "count", task: "Take the guests' money and close up", at: "home", scene: "market", card: "market-count", hours: 1 },
      ],
    },
  },
  {
    activities: ["Household work", "Looking after the household", "Keeping the house"],
    rises: 5,
    skill: "farming",
    wiki: ["Housekeeping", "History of cooking"],
    day: [
      {
        title: "A day keeping house",
        steps: [
          { name: "water", task: "Fetch the day's water", at: "well", scene: "water", card: "house-well", hours: 1 },
          { name: "cook", task: "Grind, cook and keep the fire", at: "home", scene: "cook", card: "house-pot", hours: 5 },
          { name: "buy", task: "Get what the house needs", barter: "Trade with a neighbour for what the house needs", at: "market", scene: "market", card: "house-market", hours: 2 },
        ],
      },
      {
        title: "Washing day",
        steps: [
          { name: "water", task: "Haul water and heat it", at: "well", scene: "water", card: "house-well", hours: 2 },
          { name: "wash", task: "Wash, beat and rinse the clothes", at: "well", scene: "water", hours: 4 },
          { name: "dry", task: "Spread the washing to dry", at: "yard", scene: "craft", hours: 2 },
        ],
      },
      // Grinding by hand on a quern or saddle stone took hours every day wherever grain was the staple.
      {
        title: "Grinding the grain",
        steps: [
          { name: "fetch", task: "Bring grain from the store", at: "yard", scene: "haul", hours: 1 },
          { name: "grind", task: "Grind it on the stone", at: "home", scene: "cook", card: "house-pot", hours: 4 },
          { name: "bake", task: "Bake and cook the day's meal", at: "home", scene: "cook", hours: 3 },
        ],
      },
      {
        title: "Putting food by",
        when: { seasons: ["autumn"] },
        steps: [
          { name: "gather", task: "Bring in what's ripe", at: "field", scene: "gather", hours: 3 },
          { name: "dry", task: "Dry, salt and pack it", at: "home", scene: "cook", card: "house-pot", hours: 4 },
          { name: "store", task: "Seal it in the store", at: "yard", scene: "haul", hours: 1 },
        ],
      },
    ],
  },
  {
    activities: ["Keeping the record"],
    rises: 8,
    skill: "speech",
    wiki: ["Scribe", "Literacy"],
    day: [
      {
        title: "A day of writing",
        steps: [
          { name: "prepare", task: "Make ready your writing things", at: "home", scene: "craft", hours: 1 },
          { name: "write", task: "Write for whoever needs it", at: "market", scene: "talk", card: "scribe-ask", hours: 5 },
          { name: "deliver", task: "Carry the finished work to its owner", at: "client", client: true, scene: "talk", card: "scribe-fee", hours: 1 },
        ],
      },
      {
        title: "Copying a text",
        steps: [
          { name: "prepare", task: "Rule the lines and mix the ink", at: "home", scene: "craft", hours: 1 },
          { name: "copy", task: "Copy the text, line by line", at: "home", scene: "craft", hours: 6 },
          { name: "check", task: "Read it back against the original", at: "home", scene: "craft", card: "scribe-fee", hours: 1 },
        ],
      },
      {
        title: "Keeping accounts",
        steps: [
          { name: "count", task: "Count what came into the store", at: "client", client: true, scene: "talk", card: "scribe-ask", hours: 3 },
          { name: "record", task: "Write up the tallies", at: "home", scene: "craft", hours: 3 },
          { name: "report", task: "Report the totals", at: "client", client: true, scene: "talk", card: "scribe-fee", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["headman", "village-elder"],
    rises: 6,
    skill: "speech",
    wiki: ["Village head", "Customary law"],
    day: [
      {
        title: "Hearing a dispute",
        steps: [
          { name: "hear", task: "Hear both sides of a quarrel", at: "client", client: true, scene: "talk", hours: 3 },
          { name: "see", task: "Go and look at the ground in dispute", at: "field", scene: "walk", hours: 2 },
          { name: "decide", task: "Give your judgement in front of everyone", at: "market", label: "the meeting place", scene: "talk", hours: 1 },
        ],
      },
      {
        title: "Walking the boundaries",
        steps: [
          { name: "walk", task: "Walk the village boundaries", at: "wild", scene: "walk", hours: 4 },
          { name: "marks", task: "Check the boundary marks are where they should be", at: "field", scene: "tend", hours: 2 },
          { name: "tell", task: "Tell the households what you found", at: "market", label: "the meeting place", scene: "talk", hours: 1 },
        ],
      },
      {
        title: "Gathering what the village owes",
        steps: [
          { name: "list", task: "Go over what each household owes", at: "home", scene: "craft", hours: 1 },
          { name: "collect", task: "Collect it, house by house", at: "client", client: true, scene: "talk", hours: 5 },
          { name: "store", task: "Store it until it is called for", at: "yard", scene: "haul", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["schoolteacher"],
    rises: 7,
    skill: "speech",
    wiki: ["Teacher"],
    day: {
      title: "A day of teaching",
      steps: [
        { name: "prepare", task: "Set the day's lessons", at: "home", scene: "craft", hours: 1 },
        { name: "teach", task: "Teach the children their letters and sums", at: "workplace", scene: "talk", hours: 5 },
        { name: "visit", task: "Call on a family about a child who stays away", at: "client", client: true, scene: "talk", hours: 1 },
      ],
    },
  },
  {
    activities: ["Standing watch"],
    skill: "arms",
    wiki: ["Watchman (law enforcement)", "Town guard"],
    day: [
      {
        title: "A day on watch",
        steps: [
          { name: "post", task: "Take up your post", at: "market", label: "your post", scene: "rest", hours: 3 },
          { name: "round", task: "Walk the round", at: "wild", label: "the edge of town", scene: "walk", card: "watch-round", hours: 3 },
          { name: "report", task: "Hand over the watch", at: "market", label: "your post", scene: "talk", card: "watch-report", hours: 1 },
        ],
      },
      {
        title: "Keeping the gate",
        steps: [
          { name: "open", task: "Open the gate at first light", at: "wild", label: "the gate", scene: "rest", hours: 1 },
          { name: "check", task: "Question strangers and check their loads", at: "wild", label: "the gate", scene: "talk", card: "watch-round", hours: 5 },
          { name: "close", task: "Close the gate and report", at: "market", label: "your post", scene: "talk", card: "watch-report", hours: 1 },
        ],
      },
      {
        title: "The night watch",
        steps: [
          { name: "lamp", task: "Light your lamp and take up your staff", at: "home", scene: "craft", hours: 1 },
          { name: "round", task: "Walk the streets through the dark", at: "wild", label: "the streets", scene: "walk", card: "watch-round", hours: 5 },
          { name: "report", task: "Report anything you saw", at: "market", label: "your post", scene: "talk", card: "watch-report", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["warrior", "retainer"],
    skill: "arms",
    wiki: ["Warrior", "Retinue"],
    day: [
      {
        title: "Training with weapons",
        steps: [
          { name: "arms", task: "See to your weapons", at: "home", scene: "craft", hours: 1 },
          { name: "train", task: "Practise with the others", at: "wild", label: "the practice ground", scene: "walk", card: "watch-round", hours: 4 },
          { name: "hall", task: "Eat and drink at your leader's table", at: "client", client: true, scene: "talk", hours: 2 },
        ],
      },
      {
        title: "Riding escort",
        steps: [
          { name: "ready", task: "Get ready to ride out", at: "home", scene: "craft", hours: 1 },
          { name: "escort", task: "Guard your leader on the road", at: "wild", scene: "walk", card: "watch-round", hours: 5 },
          { name: "report", task: "Report what you saw on the road", at: "client", client: true, scene: "talk", card: "watch-report", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["porter"],
    rises: 5,
    skill: "wayfaring",
    wiki: ["Porter (carrier)"],
    day: {
      title: "Carrying for hire",
      steps: [
        { name: "wait", task: "Wait at the market to be hired", at: "market", scene: "rest", hours: 2 },
        { name: "carry", task: "Carry the load across town", at: "client", client: true, scene: "haul", card: "carry-2", hours: 4 },
        { name: "paid", task: "Set it down and get paid", at: "client", client: true, scene: "talk", card: "carry-3", hours: 1 },
      ],
    },
  },
  {
    ids: ["carter", "muleteer"],
    rises: 5,
    skill: "wayfaring",
    wiki: ["Carter", "Muleteer"],
    day: [
      {
        title: "Hauling goods",
        steps: [
          { name: "load", task: "Load up at the market", at: "market", scene: "haul", hours: 2 },
          { name: "road", task: "Drive the animals along the road", at: "wild", scene: "walk", card: "carry-2", hours: 4 },
          { name: "unload", task: "Unload and get paid", at: "client", client: true, scene: "talk", card: "carry-3", hours: 1 },
        ],
      },
      {
        title: "Seeing to the animals",
        steps: [
          { name: "feed", task: "Feed and water the animals", at: "yard", scene: "herd", hours: 2 },
          { name: "mend", task: "Mend the harness and the loads' ropes", at: "home", scene: "craft", hours: 3 },
          { name: "hire", task: "Find the next load to carry", at: "market", scene: "talk", hours: 2 },
        ],
      },
    ],
  },
  {
    ids: ["boatman", "ferryman"],
    rises: 5,
    skill: "wayfaring",
    wiki: ["Ferry", "Boatman"],
    day: {
      title: "Working the ferry",
      steps: [
        { name: "bail", task: "Bail out the boat and check the oars", at: "shore", scene: "water", hours: 1 },
        { name: "ferry", task: "Take people and goods across", at: "shore", scene: "water", card: "carry-2", hours: 6 },
        { name: "fares", task: "Count the fares", at: "home", scene: "market", hours: 1 },
      ],
    },
  },
  {
    ids: ["butcher"],
    rises: 4,
    skill: "crafting",
    wiki: ["Butcher"],
    paid: "takings",
    day: {
      title: "At the block",
      steps: [
        { name: "kill", task: "Kill and bleed the animal", at: "yard", scene: "craft", hours: 2 },
        { name: "joint", task: "Joint the carcass", at: "home", scene: "craft", hours: 3 },
        { name: "sell", task: "Sell the meat before it turns", at: "market", scene: "market", hours: 3 },
      ],
    },
  },
  {
    ids: ["cook"],
    rises: 5,
    skill: "farming",
    wiki: ["Cook (domestic worker)"],
    day: {
      title: "Cooking for the household",
      steps: [
        { name: "buy", task: "Buy the day's food", barter: "Trade for the day's food", at: "market", scene: "market", hours: 2 },
        { name: "cook", task: "Cook in your employer's kitchen", at: "client", client: true, scene: "cook", card: "house-pot", hours: 5 },
        { name: "clean", task: "Scour the pots and bank the fire", at: "client", client: true, scene: "water", hours: 1 },
      ],
    },
  },
  {
    // Foragers moved through the year by what was ripe: shoots and greens, then fruit, then nuts and roots to store.
    activities: ["Gathering plants"],
    rises: 6,
    skill: "foraging",
    wiki: ["Foraging", "Hunter-gatherer"],
    day: [
      {
        title: "Gathering greens",
        when: { seasons: ["spring"] },
        steps: [
          { name: "walk", task: "Walk out to the damp ground", at: "wild", scene: "walk", hours: 1 },
          { name: "pick", task: "Pick young shoots and greens", at: "wild", scene: "gather", card: "gather-2", hours: 4 },
          { name: "home", task: "Bring them home", at: "yard", scene: "haul", card: "gather-3", hours: 1 },
        ],
      },
      {
        title: "Picking fruit",
        when: { seasons: ["summer"] },
        steps: [
          { name: "walk", task: "Walk out to the fruiting thickets", at: "wild", scene: "walk", hours: 1 },
          { name: "pick", task: "Pick berries and fruit", at: "wild", scene: "gather", card: "gather-2", hours: 4 },
          { name: "dry", task: "Spread some to dry for later", at: "yard", scene: "craft", card: "gather-3", hours: 1 },
        ],
      },
      {
        title: "Gathering nuts",
        when: { seasons: ["autumn"] },
        steps: [
          { name: "walk", task: "Walk out to the nut trees", at: "wild", scene: "walk", hours: 1 },
          { name: "gather", task: "Gather nuts and acorns", at: "wild", scene: "gather", card: "gather-2", hours: 4 },
          { name: "store", task: "Carry them home to the store pit", at: "yard", scene: "haul", card: "gather-3", hours: 1 },
        ],
      },
      {
        title: "Digging roots",
        when: { seasons: ["winter"] },
        steps: [
          { name: "walk", task: "Walk out with the digging stick", at: "wild", scene: "walk", hours: 1 },
          { name: "dig", task: "Dig roots and tubers", at: "wild", scene: "gather", card: "gather-2", hours: 4 },
          { name: "home", task: "Carry them home", at: "yard", scene: "haul", card: "gather-3", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["shellfish-gatherer"],
    rises: 5,
    skill: "foraging",
    wiki: ["Shellfish", "Shell midden"],
    day: {
      title: "Out at low tide",
      steps: [
        { name: "walk", task: "Walk out across the flats as the tide drops", at: "shore", scene: "walk", hours: 1 },
        { name: "pick", task: "Prise shellfish off the rocks", at: "shore", scene: "gather", card: "gather-2", hours: 3 },
        { name: "home", task: "Carry them home before the tide turns", at: "yard", scene: "haul", card: "gather-3", hours: 1 },
      ],
    },
  },
  {
    ids: ["quarryman"],
    rises: 6,
    skill: "stonework",
    wiki: ["Quarry"],
    paid: "wage",
    day: {
      title: "In the quarry",
      steps: [
        { name: "wedge", task: "Drive wedges along the line to split the stone", scene: "craft", hours: 3 },
        { name: "dress", task: "Rough-dress the blocks", scene: "craft", hours: 3 },
        { name: "haul", task: "Lever the blocks onto rollers", scene: "haul", hours: 2 },
      ],
    },
  },
  {
    ids: ["leatherworker", "saddler"],
    skill: "crafting",
    wiki: ["Leather crafting", "Saddler"],
    pieces: [
      { names: ["a belt", "a water skin", "a bag", "a sheath"] },
      { when: { years: [-300, 10001] }, names: ["a bridle", "a saddle"] },
    ],
    day: {
      title: "Making {piece}",
      steps: [
        { name: "cut", task: "Cut the leather for {piece}", scene: "craft", hours: 2 },
        { name: "stitch", task: "Punch and stitch {piece}", scene: "craft", hours: 4 },
        { name: "deliver", task: "Take {piece} to whoever ordered it", at: "client", client: true, scene: "talk", hours: 1 },
      ],
    },
  },
  {
    activities: ["Making clothes"],
    skill: "crafting",
    wiki: ["Tailor", "Sewing"],
    pieces: [
      { names: ["a coat", "a shirt", "a pair of trousers", "a cloak"] },
      { when: { bounds: SOUTH_ASIA }, names: ["a kurta", "a tunic"] },
      { when: { bounds: CHINA }, names: ["a padded jacket", "a robe"] },
      { when: { years: [1400, 1900], bounds: EUROPE }, names: ["a doublet", "a waistcoat"] },
    ],
    day: [
      {
        title: "Making {piece}",
        steps: [
          { name: "measure", task: "Measure the customer for {piece}", at: "client", client: true, scene: "talk", hours: 1 },
          { name: "cut", task: "Cut the cloth", at: "home", scene: "craft", hours: 2 },
          { name: "sew", task: "Sew {piece}", at: "home", scene: "craft", hours: 5 },
        ],
      },
      {
        title: "Alterations and mending",
        steps: [
          { name: "collect", task: "Collect clothes to mend", at: "client", client: true, scene: "talk", hours: 1 },
          { name: "mend", task: "Let out, take in and patch", at: "home", scene: "craft", hours: 5 },
          { name: "return", task: "Take them back and get paid", at: "client", client: true, scene: "talk", hours: 1 },
        ],
      },
    ],
  },
  {
    activities: ["Brewing"],
    rises: 5,
    skill: "crafting",
    wiki: ["Brewing", "History of beer"],
    paid: "takings",
    day: [
      {
        title: "Brewing day",
        steps: [
          { name: "mash", task: "Mash the malt in hot water", at: "home", scene: "warm", hours: 3 },
          { name: "cool", task: "Draw off the liquid and let it cool", at: "home", scene: "cook", hours: 3 },
          { name: "pitch", task: "Add the yeast and set it to work", at: "home", scene: "craft", hours: 1 },
        ],
      },
      // English alewives hung a bush or stake over the door when a brew was ready to sell.
      {
        title: "Selling the brew",
        steps: [
          { name: "taste", task: "Taste the brew and put out the sign", at: "home", scene: "craft", hours: 1 },
          { name: "sell", task: "Sell it by the jug at your door", at: "door", scene: "market", hours: 6 },
          { name: "clean", task: "Scald the empty vessels", at: "well", scene: "water", hours: 1 },
        ],
      },
      {
        title: "Malting",
        steps: [
          { name: "steep", task: "Steep the grain", at: "well", scene: "water", hours: 2 },
          { name: "spread", task: "Spread it on the floor to sprout", at: "home", scene: "craft", hours: 3 },
          { name: "dry", task: "Dry the sprouted grain by the fire", at: "home", scene: "warm", hours: 3 },
        ],
      },
    ],
  },
  {
    activities: ["Twisting fibre"],
    skill: "crafting",
    wiki: ["Rope", "Ropewalk"],
    day: {
      title: "Making rope",
      steps: [
        { name: "comb", task: "Comb out the hemp or bark fibre", at: "home", scene: "craft", hours: 2 },
        { name: "twist", task: "Walk the strands out and twist them together", at: "yard", scene: "craft", hours: 5 },
        { name: "coil", task: "Coil the rope and sell it", barter: "Coil the rope and trade it", at: "market", scene: "market", hours: 1 },
      ],
    },
  },
  {
    ids: ["miller"],
    rises: 5,
    skill: "crafting",
    wiki: ["Watermill", "Gristmill"],
    // The miller kept back a share of every sack as the toll for grinding it.
    day: {
      title: "At the mill",
      steps: [
        { name: "take", task: "Take in the neighbours' grain", at: "workplace", scene: "haul", hours: 2 },
        { name: "grind", task: "Grind it and watch the stones", at: "workplace", scene: "craft", hours: 5 },
        { name: "toll", task: "Take your toll and hand back the flour", at: "workplace", scene: "market", hours: 1 },
      ],
    },
  },
  {
    ids: ["midwife"],
    rises: 6,
    skill: "foraging",
    wiki: ["Midwife", "History of childbirth"],
    paid: "fee",
    day: {
      title: "Attending a birth",
      steps: [
        { name: "pack", task: "Pack cloths, oil and a sharp blade", at: "home", scene: "craft", hours: 1 },
        { name: "labour", task: "Sit with the mother through the labour", at: "sick", scene: "warm", card: "heal-visit", hours: 5 },
        { name: "deliver", task: "Bring the child safely into the world", at: "sick", scene: "talk", card: "heal-fee", hours: 1 },
      ],
    },
  },
  {
    // The label comes from the local beliefs, so the day does too: an offering where there is no church or mosque.
    activities: ["At the rite"],
    rises: 5,
    skill: "speech",
    wiki: ["Ritual", "Religion"],
    day: [
      {
        title: "Making an offering",
        when: OLD_GODS,
        steps: [
          { name: "prepare", task: "Prepare the offering", at: "home", scene: "craft", hours: 2 },
          { name: "offer", task: "Make the offering at the sacred place", at: "wild", label: "the sacred place", scene: "rest", hours: 3 },
          { name: "tell", task: "Tell the household what the signs say", at: "client", client: true, scene: "talk", hours: 1 },
        ],
      },
      {
        title: "A healing rite",
        when: OLD_GODS,
        steps: [
          { name: "gather", task: "Gather the herbs the rite needs", at: "wild", scene: "gather", hours: 2 },
          { name: "rite", task: "Sing over the sick person", at: "sick", scene: "warm", card: "heal-visit", hours: 4 },
          { name: "fee", task: "Accept the family's gift", at: "sick", scene: "talk", card: "heal-fee", hours: 1 },
        ],
      },
      // Late Shang diviners heated ox shoulder blades and turtle shells and read the cracks; the answers were carved on the bone.
      {
        title: "Reading the cracks",
        when: { years: [-1250, -1046], bounds: CHINA },
        steps: [
          { name: "prepare", task: "Scrape and drill the ox bone", at: "home", scene: "craft", hours: 2 },
          { name: "crack", task: "Heat the bone and read the cracks", at: "home", scene: "warm", hours: 3 },
          { name: "carve", task: "Carve the question and the answer into the bone", at: "home", scene: "craft", hours: 2 },
        ],
      },
      {
        title: "Services and visits",
        when: { years: [400, 1900], bounds: EUROPE },
        steps: [
          { name: "service", task: "Say the morning service", at: "workplace", scene: "rest", hours: 2 },
          { name: "visit", task: "Visit the sick and the dying", at: "sick", scene: "talk", card: "heal-visit", hours: 3 },
          { name: "register", task: "Write up the baptisms and burials", at: "home", scene: "craft", hours: 1 },
        ],
      },
      {
        title: "Leading the prayers",
        when: { years: [650, 1900], bounds: ISLAMIC },
        steps: [
          { name: "prayer", task: "Lead the dawn prayer", at: "workplace", scene: "rest", hours: 1 },
          { name: "teach", task: "Teach the children to recite", at: "workplace", scene: "talk", hours: 4 },
          { name: "advise", task: "Answer people's questions about what is permitted", at: "client", client: true, scene: "talk", hours: 2 },
        ],
      },
    ],
  },
  {
    ids: ["sexton"],
    skill: "stonework",
    wiki: ["Sexton (office)"],
    day: {
      title: "Keeping the churchyard",
      steps: [
        { name: "bell", task: "Ring the bell for the morning service", at: "workplace", scene: "rest", hours: 1 },
        { name: "dig", task: "Dig a grave", at: "workplace", scene: "haul", hours: 4 },
        { name: "tidy", task: "Sweep the church and trim the grass", at: "workplace", scene: "craft", hours: 2 },
      ],
    },
  },
  {
    activities: ["Playing and telling"],
    rises: 9,
    skill: "speech",
    wiki: ["Musician", "Storytelling"],
    day: {
      title: "Playing for a gathering",
      steps: [
        { name: "practise", task: "Practise the songs and stories", at: "home", scene: "rest", hours: 3 },
        { name: "play", task: "Play for the gathering", at: "client", client: true, scene: "talk", hours: 4 },
        { name: "paid", task: "Collect what they'll give you", at: "client", client: true, scene: "market", hours: 1 },
      ],
    },
  },
  {
    ids: ["peat-cutter"],
    rises: 5,
    skill: "foraging",
    wiki: ["Peat"],
    day: {
      title: "Cutting peat",
      steps: [
        { name: "walk", task: "Walk out to the bog", at: "wild", scene: "walk", hours: 1 },
        { name: "cut", task: "Cut the peat with the spade", at: "wild", scene: "haul", card: "gather-2", hours: 4 },
        { name: "stack", task: "Stack the turves to dry", at: "wild", scene: "craft", card: "gather-3", hours: 2 },
      ],
    },
  },
  {
    ids: ["wood-gatherer"],
    rises: 6,
    skill: "foraging",
    wiki: ["Firewood"],
    day: {
      title: "Gathering firewood",
      steps: [
        { name: "walk", task: "Walk out to the woods", at: "wild", scene: "walk", hours: 1 },
        { name: "gather", task: "Gather dead wood and cut what you're allowed", at: "wild", scene: "gather", card: "gather-2", hours: 4 },
        { name: "carry", task: "Carry the bundles home", at: "yard", scene: "haul", card: "gather-3", hours: 2 },
      ],
    },
  },
  {
    activities: ["Working the salt"],
    rises: 5,
    skill: "foraging",
    wiki: ["Salt evaporation pond", "History of salt"],
    day: {
      title: "At the salt pans",
      steps: [
        { name: "flood", task: "Let brine into the pans", at: "shore", scene: "water", hours: 2 },
        { name: "rake", task: "Rake up the salt that has formed", at: "shore", scene: "gather", hours: 4 },
        { name: "bag", task: "Drain it and bag it", at: "yard", scene: "haul", hours: 2 },
      ],
    },
  },
  {
    activities: ["Working underground"],
    rises: 5,
    skill: "stonework",
    wiki: ["Mining"],
    paid: "wage",
    day: {
      title: "Down the mine",
      steps: [
        { name: "down", task: "Climb down to the face", scene: "walk", hours: 1 },
        { name: "dig", task: "Dig at the face by lamplight", scene: "haul", hours: 6 },
        { name: "up", task: "Haul the ore up and draw your pay", scene: "haul", hours: 1 },
      ],
    },
  },
  {
    activities: ["Working the wharf"],
    rises: 5,
    skill: "wayfaring",
    wiki: ["Stevedore"],
    paid: "wage",
    day: {
      title: "On the wharf",
      steps: [
        { name: "wait", task: "Wait at the wharf to be taken on", at: "shore", scene: "rest", hours: 1 },
        { name: "unload", task: "Unload the ship", at: "shore", scene: "haul", card: "carry-2", hours: 6 },
        { name: "paid", task: "Line up for the day's pay", at: "shore", scene: "market", card: "carry-3", hours: 1 },
      ],
    },
  },
  {
    // Barber-surgeons shaved, cut hair, pulled teeth and let blood until surgeons split from them.
    ids: ["barber"],
    skill: "crafting",
    wiki: ["Barber", "Barber surgeon"],
    paid: "takings",
    day: {
      title: "At the barber's",
      steps: [
        { name: "hone", task: "Hone the razors", at: "home", scene: "craft", hours: 1 },
        { name: "shave", task: "Shave and cut hair for whoever comes in", at: "home", scene: "talk", hours: 5 },
        { name: "tooth", task: "Pull a tooth for a man in pain", at: "home", scene: "craft", hours: 1 },
      ],
    },
  },
  {
    // In Edo and in Chinese cities, night soil was collected from houses and sold to farmers as fertiliser.
    ids: ["night-soil-collector"],
    rises: 3,
    skill: "wayfaring",
    wiki: ["Night soil"],
    day: {
      title: "The night soil round",
      steps: [
        { name: "round", task: "Collect from the houses before dawn", at: "client", client: true, scene: "haul", hours: 3 },
        { name: "carry", task: "Carry the buckets out to the farms", at: "field", scene: "haul", hours: 3 },
        { name: "paid", task: "Sell it to the farmers", at: "field", scene: "market", hours: 1 },
      ],
    },
  },
  {
    ids: ["sweeper"],
    rises: 5,
    skill: "wayfaring",
    wiki: ["Street sweeper"],
    day: {
      title: "Sweeping the streets",
      steps: [
        { name: "sweep", task: "Sweep the streets", at: "market", label: "the streets", scene: "craft", hours: 4 },
        { name: "cart", task: "Carry the sweepings out of town", at: "wild", scene: "haul", hours: 2 },
        { name: "paid", task: "Draw your pay", at: "market", scene: "market", hours: 1 },
      ],
    },
  },
  {
    ids: ["apprentice"],
    rises: 5,
    skill: "crafting",
    wiki: ["Apprenticeship"],
    day: [
      {
        title: "Fetching and carrying",
        steps: [
          { name: "fire", task: "Light the workshop fire before your master is up", at: "client", client: true, scene: "warm", hours: 1 },
          { name: "fetch", task: "Fetch materials and sweep up", at: "market", scene: "haul", hours: 3 },
          { name: "watch", task: "Watch your master work and try it yourself", at: "client", client: true, scene: "craft", hours: 4 },
        ],
      },
      {
        title: "Your first piece",
        steps: [
          { name: "prepare", task: "Set out your tools", at: "client", client: true, scene: "craft", hours: 1 },
          { name: "work", task: "Make a piece on your own", at: "client", client: true, scene: "craft", hours: 5 },
          { name: "show", task: "Show your master what you made", at: "client", client: true, scene: "talk", hours: 1 },
        ],
      },
    ],
  },
  {
    ids: ["printer"],
    skill: "crafting",
    wiki: ["Printing press"],
    day: {
      title: "At the press",
      steps: [
        { name: "set", task: "Set the type for the page", at: "workplace", scene: "craft", hours: 3 },
        { name: "ink", task: "Ink the forme and pull the sheets", at: "workplace", scene: "craft", hours: 4 },
        { name: "hang", task: "Hang the wet sheets to dry", at: "workplace", scene: "craft", hours: 1 },
      ],
    },
  },
  {
    // The words come from the household's own way of fishing; see fishing.ts.
    ids: ["fisher", "fisherman", "sea-fisher", "reef-fisher"], skill: "foraging", wiki: ["Fishing"], rises: 5,
    day: { title: "A day's fishing", steps: [
      { name: "ready", task: "{Ready}", at: "gear", scene: "craft", hours: 1 },
      { name: "fish", task: "{Fishing}", at: "grounds", scene: "gather", hours: 4 },
      { name: "land", task: "{Land}", at: "yard", scene: "haul", hours: 1 },
    ] },
  },
];
// Without a place, only what belongs everywhere fits.
const fits = (w: When | readonly When[] | undefined, season: SeasonId, at?: Today): boolean => !w || ("length" in w ? w.some((x) => fits(x, season, at)) : (
  (!w.seasons || w.seasons.includes(season)) &&
  (!w.years || (!!at && at.year >= w.years[0] && at.year < w.years[1])) &&
  (!w.bounds || (!!at && at.lon >= w.bounds[0] && at.lat >= w.bounds[1] && at.lon <= w.bounds[2] && at.lat <= w.bounds[3]))));

export function dayOf(recipe: Recipe, season: SeasonId, at?: Today): Day | undefined {
  if (!Array.isArray(recipe.day)) return "title" in recipe.day ? recipe.day : recipe.day[season];
  const days = recipe.day.filter((d) => fits(d.when, season, at));
  return days[Math.floor((at?.pick ?? 0) * days.length)] ?? recipe.day[0];
}

export function pieceOf(recipe: Recipe | undefined, season: SeasonId, at: Today | undefined, pick: number) {
  const names = recipe?.pieces?.filter((p) => fits(p.when, season, at)).flatMap((p) => p.names) ?? [];
  return names.length ? names[Math.floor(pick * names.length)] : undefined;
}

export const recipeFor = (kit: Livelihood) =>
  recipes.find((r) => r.ids?.includes(kit.id)) ??
  recipes.find((r) => r.activities?.includes(kit.activity) || r.label?.test(kit.label));
