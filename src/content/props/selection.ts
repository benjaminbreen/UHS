import type { Pack } from "../../core/types";
import type { CultureId } from "../history/types";
import { eraAt } from "../history/dates";
import { historyRegistry, resolveHistory } from "../history";
import { lifeway } from "../settlements/lifeways";
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
/** Which Old World kit a place has. Not a claim about who invented what: a
 * statement about which props belong in a settlement at all. Wheeled vehicles,
 * draught traction, coopered barrels, dairying and the balance scale are Old
 * World things, and in the Americas and Oceania they arrive with contact.
 * A wagon and a pair of scales in the 1485 Andes is the error this prevents. */
export function techFor(pack: Pack) {
  const culture = pack.setting?.culture;
  const year = pack.year;
  const americas =
    culture === "andean" ||
    culture === "mesoamerican" ||
    culture === "other-indigenous-american";
  const oceania = culture === "australian-pacific";
  const kit = americas ? year >= 1550 : oceania ? year >= 1800 : true;
  // South of the Sahara the tsetse belt kept out the ox plough and the cart
  // until colonial rule. The Ethiopian highlands ploughed with oxen throughout.
  const african =
    culture === "west-central-african" || culture === "east-southern-african";
  const ethiopia =
    !!pack.setting &&
    pack.setting.lat > 5 &&
    pack.setting.lat < 16 &&
    pack.setting.lon > 34 &&
    pack.setting.lon < 43;
  const hoe = african && year < 1900 && !ethiopia;
  // Coopered casks are a Roman and European craft; East Asia coopered tubs and
  // buckets. Elsewhere liquids went in jars, skins and gourds.
  const cooperage =
    culture === "european" ||
    (culture === "east-asian" && year >= 1000) ||
    year >= 1850;
  return {
    wheels: kit && !hoe,
    draught: kit && !hoe,
    cooperage,
    dairy: kit,
    // Balance weights appear in Egypt and Mesopotamia in the third millennium.
    balance: kit && year >= -2500,
  };
}

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
  const tech = techFor(pack);
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
  // Aboriginal Australia never made pots, and Polynesia gave them up after
  // Lapita; the Pacific cooked in earth ovens and carried water in gourds.
  const pottery =
    (oldWorld && year >= -6999) ||
    (!oldWorld &&
      year >= -1999 &&
      (culture !== "australian-pacific" || year < 1)) ||
    (culture === "east-asian" && year >= -15999);
  const african =
    culture === "west-central-african" || culture === "east-southern-african";
  const americas =
    culture === "mesoamerican" ||
    culture === "andean" ||
    culture === "other-indigenous-american";
  // Pounding in a standing wooden mortar is how grain, yams and palm fruit
  // were dehusked and milled across Africa, South and Southeast Asia, and the
  // eastern woodlands of North America.
  const pounds =
    african ||
    culture === "southeast-asian" ||
    culture === "south-asian" ||
    culture === "other-indigenous-american";
  // The bottle gourd is the vessel wherever pottery was scarce or water was
  // carried far: Africa, the Americas and the Pacific.
  const gourds =
    year >= -7999 &&
    year < 1950 &&
    (african || americas || culture === "australian-pacific");
  if (gourds) {
    contexts.household.push("calabash");
    contexts.yard.push("calabash");
  }
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
  // Lifting river water with a counterweighted sweep: the Nile, the two rivers
  // and the Indus plain.
  const river = pack.setting?.water?.startsWith("river");
  if (
    river &&
    !urban &&
    year >= -2499 &&
    year < 1900 &&
    (culture === "north-african-west-asian" || culture === "south-asian")
  )
    contexts.water = [...contexts.water, "shaduf", "shaduf"];
  // A metal pot for the hearth, once smiths are working iron in quantity.
  // Where there was no iron, the clay pot and the vat already cover cooking.
  // Cast-iron trade pots reach Africa and the Americas with the Atlantic trade.
  if (year >= -799 && tech.dairy && (oldWorld || year >= 1700))
    contexts.household.push("cookingPot");
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
  // Early farming and the ancient world. A hide stretched to dry wherever
  // people still hunted or herded for their clothes; stone worked where metal
  // had not come; storage pits under the yard before granaries rose above it.
  const herders =
    culture === "inner-eurasian" ||
    culture === "other-indigenous-american" ||
    culture === "east-southern-african";
  if (year < -2999 || (herders && year < 1900)) contexts.work.push("hideFrame");
  if (
    (oldWorld && year < -1999) ||
    (americas && year < 1550) ||
    (culture === "australian-pacific" && year < 1800)
  )
    contexts.work.push("knappingFloor");
  if (
    year >= -5999 &&
    ((culture === "european" && year < (cold ? 1500 : 1000)) ||
      (culture === "north-african-west-asian" && year < -999))
  )
    contexts.work.push("warpLoom");
  if (
    year >= -7999 &&
    year < 500 &&
    ["european", "north-african-west-asian", "inner-eurasian", "east-asian"].includes(culture) &&
    pack.setting?.settlement !== "city"
  )
    contexts.yard.push("grainPit");
  if (
    (culture === "european" && year >= -5999 && year < -799) ||
    (culture === "east-southern-african" && year < 1900)
  )
    contexts.work.push("skullPost");
  // The porous jar on its stand, cooling the water it sweats through.
  if (culture === "north-african-west-asian" && year >= -999 && year < 1950) {
    contexts.yard.push("zir");
    contexts.household.push("zir");
  }
  if (pounds && year >= -2999 && year < 1950) {
    contexts.work.push("poundingMortar");
    contexts.yard.push("poundingMortar");
  }
  // The rope bed stands in every South Asian yard by day.
  if (culture === "south-asian" && year >= 1000) {
    contexts.yard.push("charpoy", "charpoy");
    contexts.work.push("charpoy");
  }
  if (rural || pack.setting?.settlement === "village") {
    // The straw skep is northern European. Log and bark hives are hung in
    // trees across Africa and the Russian forest, and the Maya kept stingless
    // bees in hollow logs; the Andes had no honeybee at all.
    if (year >= -2999 && culture === "european") contexts.work.push("beehive");
    // Egypt and the Levant kept bees in stacked clay pipes.
    if (year >= -2499 && culture === "north-african-west-asian")
      contexts.work.push("pipeHive");
    if (
      year >= -2999 &&
      (african ||
        culture === "inner-eurasian" ||
        culture === "east-asian" ||
        (culture === "mesoamerican" && year >= -299))
    )
      contexts.work.push("logHive");
    // Cattle and goats come in at night to a thorn or pole kraal.
    if (african && year >= -1999 && year < 1950)
      contexts.work.push("stockPen");
    // A beam plough wants an animal in front of it; the Andes had a foot
    // plough, which is a different object and not drawn here.
    if (year >= -2999 && tech.draught) contexts.work.push("plough");
    // Rakes and forks go with hay and threshing floors; hoe farming and the
    // Americas used neither.
    const hay =
      culture === "european" ||
      culture === "north-african-west-asian" ||
      culture === "inner-eurasian" ||
      culture === "east-asian";
    if (year >= -3999 && hay) contexts.tool.push("rake", "pitchfork");
    // The long shovel and the scythe are the two-handed versions of tools
    // the kit already has; the scythe is a later invention than the sickle.
    if (year >= -999) contexts.tool.push("shovel");
    if (
      year >= -499 &&
      (culture === "european" || culture === "inner-eurasian")
    )
      contexts.tool.push("scythe");
    if (year >= -999 && tech.wheels) contexts.work.push("farmCart");
    if (year >= 1850 && tech.dairy) contexts.work.push("milkChurn");
  }
  // A butt catches rain off a gutter, which European houses have from about
  // 1600.
  if (year >= 1600 && culture === "european") contexts.yard.push("waterButt");
  // Somewhere to tie an animal, until the animals stop coming into town.
  if (year < 1920 && tech.draught) contexts.work.push("hitchingPost");
  // One privy per household, in whatever form the place and date built them.
  // Nothing else in the yard kit competes with it: it is placed on its own
  // rule, far from the water.
  const eastern = culture === "east-asian" || culture === "southeast-asian";
  // The board privy is a European and West Asian building. Elsewhere a
  // village went to the bush or the midden until colonial sanitary rules.
  const privyBuilders =
    culture === "european" ||
    culture === "north-african-west-asian" ||
    culture === "inner-eurasian";
  // A built privy is a town's habit. A farming hamlet threw everything on one
  // heap at the bottom of the yard, and a farm with stock kept the muck
  // separate because manure was worth keeping.
  contexts.privy = [
    year >= 1850
      ? "privyOuthouse"
      : eastern && year >= 499
        ? "privyNightSoil"
        : year >= 999 && year < 1700 && oldWorld && urban
          ? "privyStone"
          : year >= -499 && year < 600 && urban && oldWorld
            ? "privyBench"
            : pack.setting?.settlement === "camp" || climate === "arid"
              ? "privyScreen"
              : // Nothing built: what a place has before it has a town to
                // copy from. The midden takes everything the household throws
                // out; a farmyard keeps its muck separate, because manure is
                // worth spreading.
                year < -1999 || (!urban && year < 499)
                ? "privyMidden"
                : // Tenochtitlan collected night soil by canoe for the fields.
                  culture === "mesoamerican" && urban && year < 1550
                  ? "privyNightSoil"
                  : privyBuilders
                    ? "privyShed"
                    : "privyMidden",
  ];
  if (
    contexts.privy[0] === "privyMidden" &&
    tech.draught &&
    year >= -3999 &&
    (pack.setting?.settlement === "farm" || rural)
  )
    contexts.privy.push("privyDung");
  // A board to sit on is older than any of this; it needs sawn timber and a
  // settled house, so it starts with the farming villages rather than a camp.
  if (year >= -5999 && pack.setting?.settlement !== "camp") {
    contexts.yard.push("bench");
    contexts.work.push("stool");
  }
  if (year >= 900 && oldWorld) contexts.household.push("strappedChest");
  if (year >= 1500 && (oldWorld || year >= 1800)) {
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
  if (year >= 500 && culture === "european")
    contexts.yard.push("barrel", "crateStack", "flowerTub");
  // Threshed grain is sacked wherever cloth is woven and cereals are grown.
  if (year >= -2999 && oldWorld) contexts.yard.push("grainSacks");
  // The shared fire in its period form. Foragers keep a camp fire; the first
  // farming villages a broad kerbed hearth to sit round; a cold country a
  // long fire; oven cultures move the fire into a clay body early; the
  // classical Mediterranean and East Asia raise it onto a brazier; from the
  // factory age the public fire is an iron basket, then a drum.
  contexts.fire = [year < -8999 ? "campHearth" : "firepit"];
  if (
    year >= -8999 &&
    year < 500 &&
    [
      "european",
      "north-african-west-asian",
      "inner-eurasian",
      "south-asian",
      "east-asian",
    ].includes(culture)
  )
    contexts.fire = ["communalHearth"];
  if (
    pottery &&
    year >= -6999 &&
    ["north-african-west-asian", "south-asian", "inner-eurasian"].includes(
      culture,
    )
  )
    contexts.fire = [...contexts.fire, "tannur"];
  // The brazier is a town's fire; the countryside kept its hearth.
  if (
    year >= -800 &&
    year < 650 &&
    urban &&
    ["european", "north-african-west-asian"].includes(culture)
  )
    contexts.fire = ["brazier"];
  if (year >= -500 && urban && culture === "east-asian")
    contexts.fire = ["brazier"];
  if (year >= 500 && culture === "european") contexts.fire = ["bakeOven"];
  if (year >= 1000 && culture === "east-asian") contexts.fire = ["teaStove"];
  // A cold country's village fire is a long hearth, until the chimney.
  if (cold && year < 1500 && (oldWorld || culture === "inner-eurasian"))
    contexts.fire = ["longFire"];
  // Three stones under the pot: the African, Southeast Asian and
  // Mesoamerican kitchen fire (the Nahuatl tenamaztli).
  if (
    pottery &&
    (african ||
      culture === "southeast-asian" ||
      culture === "mesoamerican")
  )
    contexts.fire = ["threeStoneHearth"];
  // Logs laid like spokes and pushed in as they burn, in the eastern
  // woodlands and on the plains.
  if (culture === "other-indigenous-american" && year >= -8999 && year < 1850)
    contexts.fire = ["councilFire"];
  // Aboriginal Australia cooked on open fires; the islands in earth ovens.
  if (culture === "australian-pacific" && year < 1900) {
    const lon = pack.setting?.lon ?? 0,
      lat = pack.setting?.lat ?? 0;
    const australia = lon > 112 && lon < 154 && lat < -10;
    contexts.fire = australia || year < -999 ? ["campHearth"] : ["earthOven"];
  }
  if (year >= 1550 && ["mesoamerican", "andean"].includes(culture))
    contexts.fire = [
      "bakeOven",
      culture === "mesoamerican" ? "threeStoneHearth" : "firepit",
    ];
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
  if (year >= 1750 && tech.wheels) contexts.work.push("barrow");
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
    contexts.work = tech.wheels
      ? ["crate", "drum", "barrow", "stick"]
      : ["crate", "drum", "stick"];
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
    contexts.work.push("drum");
    if (tech.wheels) contexts.work.push("barrow");
  }
  // Named local exceptions, intentionally not a culture × era master table.
  if (pack.setting?.placeId === "konya" || pack.id === "neolithic") {
    contexts.household = ["basket", "liddedBasket", "pot", "jar"];
    contexts.yard = ["jug", "pot"];
    contexts.water = ["well"];
  }
  if (pack.setting?.settlement === "camp") {
    contexts.water = ["spring"];
    if (!contexts.fire.includes("councilFire")) contexts.fire = ["campHearth"];
    contexts.yard = pottery ? ["pot", "basket"] : ["basket"];
  }
  if (year < -25999) {
    contexts.tool = ["stick", "spear"];
    contexts.household = ["hideBag"];
    contexts.yard = ["hideBag"];
    contexts.fire = ["campHearth"];
  }
  // The spear hunts and guards in every countryside until the gun replaces it.
  else if (year < 1700 && pack.setting?.settlement !== "city")
    contexts.tool.push("spear");
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
  // A band carries what it uses: no granary, no field tools, no dug well,
  // no privy, nothing too heavy to leave behind at the next move.
  // Herders and swidden gardeners keep neither ploughs nor hay tools, and
  // manioc and the herds are stored on the ground and the hoof, not in a
  // granary.
  const way = lifeway(pack.setting);
  if (way && way.mode !== "mixed-farming") {
    const foraging = /foraging/.test(way.mode);
    const settled = foraging
      ? /^(granary|spade|sickle|pick|shovel|rake|pitchfork|scythe|plough|farmCart|vat|grainPit|hitchingPost|well|roofedWell|townWell|pump|privy|warpLoom|beehive|logHive|pipeHive|stockPen)/
      : /^(granary|rake|pitchfork|scythe|plough|farmCart|hitchingPost|privy)/;
    for (const context of Object.keys(contexts) as PropContext[])
      contexts[context] = contexts[context].filter((k) => !settled.test(k));
    if (foraging || way.mode === "horticultural") contexts.water = ["spring"];
  }
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
