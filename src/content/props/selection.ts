import type { Pack } from "../../core/types";
import type { CultureId } from "../history/types";
import { eraAt } from "../history/dates";
import { historyRegistry, resolveHistory } from "../history";
export type PropContext =
  | "household"
  | "yard"
  | "water"
  | "work"
  | "fire"
  /** Hand tools: what leans against a workshop wall or a field gate. */
  | "tool"
  /** The household's own, placed on its own rule well away from the water. */
  | "privy";
export type PropKit = {
  era: string;
  culture: CultureId;
  contexts: Record<PropContext, string[]>;
  note: string;
};
/** Broad, explicitly provisional material-culture defaults, not universal dates
 * of invention. Local refinements override flat lists; behavior never uses era. */
export function propKit(pack: Pack): PropKit {
  const year = pack.year;
  const culture =
    pack.setting?.culture ??
    (pack.id === "roman" ? "european" : "north-african-west-asian");
  const contexts: PropKit["contexts"] = {
    household: ["basket", "liddedBasket"],
    yard: ["basket"],
    water: ["spring"],
    work: ["woodpile", "stick"],
    fire: ["firepit"],
    tool: ["stick"],
    privy: ["privyShed"],
  };
  const rural =
    pack.setting?.settlement === "farm" ||
    pack.setting?.settlement === "village" ||
    pack.setting?.settlement === "camp";
  const climate = pack.setting?.climate;
  const cold = climate === "boreal" || climate === "tundra";
  const oldWorld = [
    "european",
    "north-african-west-asian",
    "inner-eurasian",
    "south-asian",
    "east-asian",
    "southeast-asian",
  ].includes(culture);
  // These conservative defaults are selection hypotheses; exact place rules below
  // are the extension point for early pottery and regional material exceptions.
  const pottery =
    (oldWorld && year >= -6999) ||
    (!oldWorld && year >= -1999) ||
    (culture === "east-asian" && year >= -15999);
  if (pottery) {
    contexts.household.push("pot", "jar", "bowl");
    contexts.yard.push("jug", "pot", "flask");
    // A sunken vat is a settled household's year of storage, not a camp's.
    if (year >= -3999 && pack.setting?.settlement !== "camp")
      contexts.household.push("vat");
    contexts.work.push("grinder");
    if (year >= -6999) contexts.water = ["well"];
  }
  // A hafted digging blade is a Neolithic-and-after tool; before that the
  // work slot keeps a stick and a grinding stone.
  if (year >= -3999) contexts.tool = ["spade", "sickle", "axe", "stick"];
  // A hafted pick is quarry and field-clearing work: iron, not a stone blade.
  if (year >= -1200) contexts.tool.push("pick");
  if (pottery && year >= -3999) contexts.tool.push("grinder");
  // A town square's wellhead is a public work: bigger kerb, swing arm, bucket.
  const urban =
    pack.setting?.settlement === "city" || pack.setting?.settlement === "port";
  // A rack of split fish or drying cloth belongs to a port or a farmstead.
  if (
    pack.setting?.settlement === "port" ||
    pack.setting?.settlement === "farm"
  )
    contexts.work.push("dryingRack");
  // A roofed wellhead needs carpentry over a shaft, not a new idea about water.
  if (year >= 500 && oldWorld) contexts.water = ["well", "roofedWell"];
  // The lift pump spreads with cast iron; by the factory age it is the
  // ordinary street fitting and the open shaft is the older survival.
  if (year >= 1700 && oldWorld) contexts.water = ["well", "roofedWell", "pump"];
  if (year >= 1860) contexts.water = ["pump", "pump", "well"];
  if (urban && year >= -1999 && year < 1900)
    contexts.water = [...contexts.water, "townWell", "townWell"];
  // A metal pot for the hearth, once smiths are working iron in quantity.
  if (year >= -799) contexts.household.push("cookingPot");
  if (year >= 500 && oldWorld) {
    contexts.household.push("chest", "sack");
    contexts.yard.push("bucket");
  }
  // Farm implements, where there is farming to do. A plough is as old as the
  // furrow; a cart wants roads and a draught animal; churns are industrial
  // dairying and belong with the railway, not with the ard.
  // The granary a place builds: raised on stones in northwest Europe, round
  // mud under thatch in the Sahel, on posts where the monsoon comes, and a
  // clay bin everywhere the first farmers were.
  if (rural || pack.setting?.settlement === "village") {
    const granary =
      culture === "west-central-african" || culture === "east-southern-african"
        ? "granaryMud"
        : culture === "southeast-asian" ||
            culture === "east-asian" ||
            culture === "australian-pacific"
          ? "granaryStilt"
          : culture === "european" && year >= 1399
            ? "granaryStaddle"
            : "granaryClay";
    if (year >= -5999) contexts.work.push(granary);
  }
  if (rural || pack.setting?.settlement === "village") {
    if (year >= -2999) contexts.work.push("plough", "beehive");
    if (year >= -3999) contexts.tool.push("rake", "pitchfork");
    // The long shovel and the scythe are the two-handed versions of tools
    // the kit already has; the scythe is a later invention than the sickle.
    if (year >= -999) contexts.tool.push("shovel");
    if (year >= -499) contexts.tool.push("scythe");
    if (year >= -999) contexts.work.push("farmCart");
    if (year >= 1850) contexts.work.push("milkChurn");
  }
  if (year >= -999) contexts.yard.push("waterButt");
  // One privy per household, in whatever form the place and date built them.
  // Nothing else in the yard kit competes with it: it is placed on its own
  // rule, far from the water.
  const eastern = culture === "east-asian" || culture === "southeast-asian";
  contexts.privy = [
    year >= 1850
      ? "privyOuthouse"
      : eastern && year >= 499
        ? "privyNightSoil"
        : year >= 999 && year < 1700 && oldWorld && urban
          ? "privyStone"
          : year >= -499 && year < 600 && urban && oldWorld
            ? "privyBench"
            : pack.setting?.settlement === "camp" ||
                climate === "arid" ||
                year < -3999
              ? "privyScreen"
              : "privyShed",
  ];
  // A board to sit on is older than any of this; it needs sawn timber and a
  // settled house, so it starts with the farming villages rather than a camp.
  if (year >= -5999 && pack.setting?.settlement !== "camp") {
    contexts.yard.push("bench");
    contexts.work.push("stool");
  }
  if (year >= 900 && oldWorld) contexts.household.push("strappedChest");
  if (year >= 1500) {
    contexts.household.push("chest", "strappedChest", "sack");
    contexts.yard.push("crate");
  }
  if (
    year >= -499 &&
    year < 600 &&
    ["european", "north-african-west-asian"].includes(culture)
  ) {
    contexts.household.push("chest");
    contexts.yard.push("amphora");
  }
  if (
    year >= 500 &&
    ["east-asian", "south-asian", "north-african-west-asian"].includes(culture)
  )
    contexts.household.push("glazed", "paintedChest");
  if (year >= 500 && culture === "european") contexts.yard.push("barrel");
  // The shared fire in its period form. A cold-country camp keeps a long
  // fire; oven cultures move the fire into a clay body early; the classical
  // Mediterranean and East Asia raise it onto a brazier; from the factory
  // age the public fire is an iron basket, then a drum.
  if (cold && year < 1500) contexts.fire = ["longFire"];
  if (
    pottery &&
    year >= -6999 &&
    ["north-african-west-asian", "south-asian", "inner-eurasian"].includes(
      culture,
    )
  )
    contexts.fire = ["tannur"];
  if (
    year >= -800 &&
    year < 650 &&
    ["european", "north-african-west-asian"].includes(culture)
  )
    contexts.fire = ["brazier"];
  if (year >= -500 && culture === "east-asian") contexts.fire = ["brazier"];
  if (year >= 500 && culture === "european") contexts.fire = ["bakeOven"];
  if (year >= 1000 && culture === "east-asian") contexts.fire = ["teaStove"];
  if (year >= 1550 && ["mesoamerican", "andean"].includes(culture))
    contexts.fire = ["bakeOven", "firepit"];
  if (year >= 1600 && culture === "european")
    contexts.fire = ["fireBasket", "bakeOven"];
  if (year >= 1750 && culture === "inner-eurasian")
    contexts.fire = ["teaStove"];
  if (year >= 1850)
    contexts.fire = [...new Set(["fireBasket", ...contexts.fire])];
  if (year >= 1940) contexts.fire = ["drumFire", "fireBasket"];
  if (year >= 1850) {
    contexts.yard.push("tin");
    contexts.household.push("carton");
  }
  // The factory age's own furniture: pressed steel, and a barrow that is
  // older than that but only becomes common with cheap iron tyres.
  if (year >= 1750) contexts.work.push("barrow");
  if (year >= 1860) {
    contexts.yard.push("dustbin", "washingLine");
    contexts.work.push("drum");
  }
  if (year >= 1950) {
    contexts.yard.push("plastic");
    contexts.household.push("plastic");
  }
  // Everything above builds upward from the earliest kit, so without a ceiling
  // a 1990s flat still rolls a storage jar and a city square still gets a
  // village wellhead. These are the things that actually stop being made or
  // stop being kept, not a claim that the old ones vanish everywhere at once.
  const without = (list: string[], gone: string[]) =>
    list.filter((key) => !gone.includes(key));
  if (year >= 1900) {
    const superseded = ["amphora", "vat", "glazed", "flask", "grinder"];
    contexts.household = without(contexts.household, superseded);
    contexts.yard = without(contexts.yard, superseded);
    contexts.work = without(contexts.work, ["grinder"]);
    contexts.tool = without(contexts.tool, ["sickle"]);
    contexts.water = ["pump"];
  }
  if (year >= 1950 && !rural) {
    // A city flat: tins, cartons and plastic. The pump stands in for the
    // standpipe or fountain a square still has; there is no art for a tap.
    contexts.household = ["carton", "plastic", "tin"];
    contexts.yard = ["plastic", "tin", "crate", "dustbin", "washingLine"];
    contexts.work = ["crate", "drum", "barrow", "stick"];
    contexts.tool = ["spade", "pick", "stick"];
    contexts.fire = ["drumFire", "fireBasket"];
  }
  if (year >= 1950 && rural) {
    contexts.household = without(contexts.household, [
      "pot",
      "jar",
      "cookingPot",
    ]);
    contexts.yard = without(contexts.yard, ["jug", "pot"]);
    // A country yard is where the washing actually hangs, so it weighs twice.
    contexts.yard.push("dustbin", "washingLine", "washingLine");
    contexts.work.push("drum", "barrow");
  }
  // Named local exceptions, intentionally not a culture × era master table.
  if (pack.setting?.placeId === "konya" || pack.id === "neolithic") {
    contexts.household = ["basket", "liddedBasket", "pot", "jar"];
    contexts.yard = ["jug", "pot"];
    contexts.water = ["well"];
  }
  if (pack.setting?.settlement === "camp") {
    contexts.water = ["spring"];
    contexts.fire = cold ? ["longFire"] : ["firepit"];
    contexts.yard = pottery ? ["pot", "basket"] : ["basket"];
  }
  if (year < -25999) {
    contexts.tool = ["stick"];
    contexts.household = ["hideBag"];
    contexts.yard = ["hideBag"];
    contexts.fire = cold ? ["longFire"] : ["firepit"];
  }
  const placeId =
    pack.setting?.placeId ??
    (pack.id === "roman"
      ? "tiber"
      : pack.id === "neolithic"
        ? "konya"
        : undefined);
  const place = historyRegistry.places.find(
    (p) => p.id === placeId && p.culture === culture,
  )?.id;
  const contextNames = {
    household: "household",
    yard: "storehouse",
    water: "water",
    work: "workshop",
    fire: "hearth",
    tool: "workshop",
    privy: "household",
  };
  // Authored historical exclusions/context/capability rules outrank broad
  // prototype kits. Unresearched entries remain explicitly provisional.
  for (const context of Object.keys(contexts) as PropContext[]) {
    const resolved = resolveHistory(historyRegistry, {
      culture,
      place,
      date: { year },
      context: contextNames[context],
      hypotheses: true,
    });
    contexts[context] = [...new Set(contexts[context])].filter((key) => {
      const entry = resolved.entries.find((e) => e.id === `prop.${key}`);
      return !entry || entry.status === "included";
    });
  }
  return {
    era: eraAt({ year }).id,
    culture,
    contexts,
    note: "Provisional shared prop kit; local prevalence and date refinements remain incomplete.",
  };
}
