import type { WorldSetting } from "../geography/types";
import type { PropDef } from "./catalog";

const vessel = { solid: true, container: true, variants: 1, rarity: 0.65 } as const;
const portable = { ...vessel, portable: true };
export const containerProps: Record<string, PropDef> = {
  waterskin: { ...portable, name: "Sewn waterskin", family: "waterskin", sprite: "nature-container-waterskin", breakable: "fiber", contents: { water: 2 }, shove: { as: "free", mass: 0.4 } },
  merchantBale: { ...portable, name: "Bound cloth bale", family: "merchant-bale", sprite: "nature-container-bale", breakable: "fiber", shove: { as: "free", mass: 1.2 }, visualClearance: [1,1,0,0] },
  waterJar: { ...portable, name: "Covered water jar", family: "water-jar", sprite: "nature-container-matka", breakable: "clay", contents: { water: 3 }, shove: { as: "free", mass: 0.8, rolls: true } },
  milkBag: { ...portable, name: "Leather milk bag", family: "milk-bag", sprite: "nature-container-milkbag", breakable: "fiber", shove: { as: "free", mass: 0.6 }, visualClearance: [1,1,0,0] },
  onggiJar: { ...vessel, name: "Onggi storage jar", family: "onggi", sprite: "nature-container-onggi", breakable: "glaze", shove: { as: "free", mass: 1.6 }, visualClearance: [1,1,0,0] },
  taru: { ...portable, name: "Wooden storage tub", family: "taru", sprite: "nature-container-taru", breakable: "wood", shove: { as: "free", mass: 1 }, visualClearance: [1,1,0,0] },
  riceBale: { ...portable, name: "Straw rice bale", family: "rice-bale", sprite: "nature-container-ricebale", breakable: "fiber", contents: { grain: 4 }, shove: { as: "free", mass: 1.1 } },
  tradeJar: { ...vessel, name: "Lugged storage jar", family: "trade-jar", sprite: "nature-container-tradejar", breakable: "glaze", shove: { as: "free", mass: 1.6 }, visualClearance: [1,1,0,0] },
  milkVessel: { ...portable, name: "Covered woven milk vessel", family: "milk-vessel", sprite: "nature-container-milkcontainer", breakable: "fiber", shove: { as: "free", mass: 0.5 } },
  urpu: { ...portable, name: "Urpu storage vessel", family: "urpu", sprite: "nature-container-urpu", breakable: "clay", shove: { as: "free", mass: 1.3 }, visualClearance: [1,1,0,0] },
  barkBox: { ...portable, name: "Birchbark storage box", family: "bark-box", sprite: "nature-container-barkbox", breakable: "fiber", shove: { as: "free", mass: 0.4 }, visualClearance: [1,1,0,0] },
  coolamon: { ...portable, name: "Carved wooden carrying dish", family: "coolamon", sprite: "nature-container-coolamon", breakable: "wood", shove: { as: "free", mass: 0.5 }, visualClearance: [1,1,0,0] },
  egyptJar: { ...portable, name: "Sealed Egyptian storage jar", family: "egyptian-jar", sprite: "nature-container-egyptjar", breakable: "clay", shove: { as: "free", mass: 1.1 } },
  canaanJar: { ...portable, name: "Canaanite transport jar", family: "canaanite-jar", sprite: "nature-container-canaanjar", breakable: "clay", shove: { as: "free", mass: 1.2 }, visualClearance: [1,1,0,0] },
  paintedChineseJar: { ...portable, name: "Painted storage jar", family: "majiayao-jar", sprite: "nature-container-majiayao", breakable: "clay", shove: { as: "free", mass: 1.1 }, visualClearance: [1,1,0,0] },
  grainHamper: { ...portable, name: "Lidded grain basket", family: "grain-hamper", sprite: "nature-container-grainhamper", breakable: "fiber", contents: { grain: 4 }, shove: { as: "free", mass: 1.3 }, visualClearance: [1,1,0,0] },
  olla: { ...portable, name: "Earthen storage olla", family: "olla", sprite: "nature-container-olla", breakable: "clay", shove: { as: "free", mass: 0.9 }, visualClearance: [1,1,0,0] },
  andeanSack: { ...portable, name: "Woven Andean storage sack", family: "andean-sack", sprite: "nature-container-andeansack", breakable: "fiber", shove: { as: "free", mass: 0.7 }, visualClearance: [1,1,0,0] },
  parfleche: { ...portable, name: "Rawhide parfleche case", family: "parfleche", sprite: "nature-container-parfleche", breakable: "fiber", shove: { as: "free", mass: 0.5 }, visualClearance: [1,1,0,0] },
  pacificBasket: { ...portable, name: "Plaited leaf carrying basket", family: "pacific-basket", sprite: "nature-container-pacificbasket", breakable: "fiber", shove: { as: "free", mass: 0.5 }, visualClearance: [1,1,0,0] },
  grainBin: { ...vessel, name: "Raised woven grain bin", family: "woven-grain-bin", sprite: "nature-container-grainbin", breakable: "fiber", contents: { grain: 8 }, shove: { as: "free", mass: 2.5 }, visualClearance: [1,1,1,0] },
  stonewareCrock: { ...portable, name: "Lidded stoneware crock", family: "stoneware-crock", sprite: "nature-container-stoneware", breakable: "glaze", shove: { as: "free", mass: 0.9 }, visualClearance: [1,1,0,0] },
  demijohn: { ...portable, name: "Wicker-protected glass demijohn", family: "demijohn", sprite: "nature-container-demijohn", breakable: "glaze", shove: { as: "free", mass: 1.1 }, visualClearance: [1,1,0,0] },
  keroseneTin: { ...portable, name: "Reused kerosene tin", family: "kerosene-tin", sprite: "nature-container-kerosenetin", breakable: "metal", shove: { as: "free", mass: 0.7 }, visualClearance: [1,1,0,0] },
};

export const containerAbout: Record<string, string> = {
  waterskin: "A sewn leather vessel with a tied neck and a carrying sling, for keeping water on a journey.",
  merchantBale: "Goods folded into a cloth covering and bound with rope for storage or transport.",
  waterJar: "An earthenware water jar with a cloth cover, resting on a woven support ring.",
  milkBag: "A leather bag with a wooden mouth, used to hold milk and prepare fermented dairy foods.",
  onggiJar: "A large brown-glazed earthenware jar with a separate lid, for storing and fermenting food.",
  taru: "A wooden tub made from fitted staves, held together by bamboo hoops beneath a wooden lid.",
  riceBale: "Rice packed into woven straw and tied with rope, ready to store or carry.",
  tradeJar: "A heavy glazed stoneware jar with shoulder loops and a stopper, for keeping supplies or shipping goods.",
  milkVessel: "A tightly woven milk vessel with a leather cover and a carrying strap.",
  urpu: "A tall-necked Andean vessel for storing, carrying and serving drink. Its pointed base rests in a support ring.",
  barkBox: "A folded birchbark box with root stitching, a fitted lid and a bentwood rim.",
  coolamon: "A shallow dish carved from wood, for gathering and carrying food and other belongings.",
  egyptJar: "A tall earthenware storage jar with pale slip and a mud-sealed mouth. A woven ring supports its tapered base.",
  canaanJar: "A shoulder-handled transport jar with a sealed mouth, for shipping and keeping supplies.",
  paintedChineseJar: "A rounded storage jar with low handles and dark painted bands across its shoulders.",
  grainHamper: "A large coiled basket with a fitted lid, for keeping grain and other dry supplies.",
  olla: "A broad-bellied earthenware pot with a wide mouth and small lifting handles, for storing water or food.",
  andeanSack: "A soft woven storage sack with a folded mouth, carrying ties and coloured bands worked into the fabric.",
  parfleche: "A folded rawhide case with overlapping painted flaps, fastened with cords for storage and travel.",
  pacificBasket: "A carrying basket plaited from broad leaf strips, with folded corners and handles woven into the body.",
  grainBin: "A woven grain bin reinforced with wooden ribs, raised on short feet and closed with a removable lid.",
  stonewareCrock: "A thick-walled stoneware crock with a lid, lifting ears and blue bands, for keeping food and household supplies.",
  demijohn: "A large green-glass bottle protected by a fitted wicker jacket, with carrying handles and a cork stopper.",
  keroseneTin: "A sheet-metal fuel tin reused as a household container. Its folded seams, wire handle and faded label are still visible.",
};

type ContainerSite = Pick<WorldSetting, "year" | "culture" | "lon" | "lat" | "settlement">;

/** Broad uses are reconstructions; specific silhouettes keep narrower regional windows.
 * Early sewn hide vessels are inferred from leatherworking, not a dated survival of this design. */
export function regionalContainers(s: ContainerSite | undefined): string[] {
  if (!s) return [];
  const { year, culture, lon, lat, settlement } = s;
  const result: string[] = [];
  const oldWorld = ["european","north-african-west-asian","inner-eurasian","south-asian","east-asian","southeast-asian"].includes(culture);
  const african = culture === "west-central-african" || culture === "east-southern-african";
  const camp = settlement === "camp";
  if (year >= -9999 && (oldWorld || african) && (year < 1950 || settlement !== "city" && settlement !== "port")) result.push("waterskin");
  if (year >= -2999 && (oldWorld || african || (["mesoamerican","andean"].includes(culture) && year >= -1499) || year >= 1550) && !camp) result.push("merchantBale");
  if (culture === "south-asian" && lon >= 60 && lon <= 95 && lat >= 5 && lat <= 36 && year >= -2499 && !camp) result.push("waterJar");
  if (culture === "inner-eurasian" && year >= -999 && lon >= 30 && lon <= 125 && lat >= 30 && lat <= 58) result.push("milkBag");
  const japan = culture === "east-asian" && lat >= 30 && lat <= 46 && lon <= 146 && (lon >= 130 || (lon >= 128 && lat < 34.2));
  const korea = culture === "east-asian" && lon >= 124 && lon <= 130 && lat >= 33 && lat <= 43;
  if (korea && year >= 1400 && !camp) result.push("onggiJar");
  if (japan && year >= 800 && !camp) result.push("taru", "riceBale");
  if (culture === "southeast-asian" && year >= 1200 && !camp) result.push("tradeJar");
  // The same trade jars travel through Indian Ocean ports; inland households use local wares.
  if (year >= 1400 && settlement === "port" && ((culture === "south-asian" && lon >= 65) ||
      (culture === "east-southern-african" && lon >= 35 && lat >= -25 && lat <= 15) ||
      (culture === "north-african-west-asian" && lon >= 40 && lat <= 30))) result.push("tradeJar");
  if (culture === "east-southern-african" && year >= 1000 && lon >= 35 && lon <= 52 && lat >= -5 && lat <= 15) result.push("milkVessel");
  if (culture === "andean" && year >= 1400 && year < 1650 && lon >= -82 && lon <= -65 && lat >= -30 && lat <= 2 && !camp) result.push("urpu");
  if (culture === "other-indigenous-american" && year >= -2999 && lon >= -100 && lon <= -55 && lat >= 40 && lat <= 60) result.push("barkBox");
  if (culture === "australian-pacific" && year >= -9999 && lon >= 112 && lon <= 154 && lat >= -44 && lat <= -10) result.push("coolamon");
  const nile = lon >= 25 && lon <= 33.5 && lat >= 15 && lat <= 32;
  if (nile && ["north-african-west-asian","east-southern-african"].includes(culture) && year >= -2999 && year < 300 && !camp) result.push("egyptJar");
  const levant = culture === "north-african-west-asian" && lon >= 33 && lon <= 37 && lat >= 29 && lat <= 37;
  const easternTrade = (nile && culture === "north-african-west-asian" && (settlement === "city" || settlement === "port")) ||
    (settlement === "port" && culture === "european" && lon >= 22 && lon <= 36 && lat >= 33 && lat <= 41);
  if ((levant || easternTrade) && year >= -1699 && year < -1099 && !camp) result.push("canaanJar");
  if (culture === "east-asian" && year >= -3299 && year < -1999 && lon >= 98 && lon <= 108 && lat >= 32 && lat <= 40 && !camp) result.push("paintedChineseJar");
  // Plain basketry and woven sacks are inferred beyond the surviving, later examples.
  if (culture === "west-central-african" && year >= -499 && lon >= -18 && lon <= 20 && lat >= 5 && lat <= 18 && !camp) result.push("grainHamper");
  if ((culture === "mesoamerican" || year >= 1550) && year >= -1499 && lon >= -105 && lon <= -95 && lat >= 15 && lat <= 25 && !camp) result.push("olla");
  if ((culture === "andean" || year >= 1550) && year >= -1499 && lon >= -82 && lon <= -65 && lat >= -30 && lat <= 2) result.push("andeanSack");
  if (culture === "other-indigenous-american" && year >= 1700 && lon >= -112 && lon <= -95 && lat >= 30 && lat <= 55) result.push("parfleche");
  const australia = lon >= 112 && lon <= 154 && lat >= -44 && lat <= -10;
  if (culture === "australian-pacific" && year >= -999 && (lon >= 130 || lon <= -130) && lat >= -25 && lat <= 25 && !australia) result.push("pacificBasket");
  if (["south-asian","southeast-asian"].includes(culture) && year >= -499 && lon >= 70 && lon <= 135 && lat >= 5 && lat <= 30 && !camp) result.push("grainBin");
  const europeanSupply = culture === "european" && lon >= -12 && lon <= 40 && lat >= 30 && lat <= 65;
  if (!camp && ((europeanSupply && year >= 1600) || (settlement === "port" && year >= 1750) || year >= 1850)) result.push("stonewareCrock");
  if (!camp && ((europeanSupply && year >= 1700) || (settlement === "port" && year >= 1800) || year >= 1850)) result.push("demijohn");
  if ((year >= 1870 && (oldWorld || settlement === "port")) || year >= 1900) result.push("keroseneTin");
  return result;
}

/** Match the function of an existing store, without changing its goods or ownership. */
export function regionalContainer(s: ContainerSite | undefined, key: string, roll: number): string | undefined {
  const candidates = regionalContainers(s).filter((id) => {
    if (["jug","flask","hideBag"].includes(key)) return ["waterskin","waterJar","milkBag","milkVessel","egyptJar","canaanJar","olla","demijohn","keroseneTin"].includes(id);
    if (["jar","vat","glazed","amphora","room-jars"].includes(key)) return ["waterJar","onggiJar","tradeJar","urpu","taru","egyptJar","canaanJar","paintedChineseJar","olla","stonewareCrock","demijohn"].includes(id);
    if (["sack","grainSacks","crate","crateStack","room-sacks","room-crate"].includes(key)) return ["merchantBale","riceBale","taru","andeanSack","parfleche","grainHamper","grainBin","keroseneTin"].includes(id);
    if (key === "barrel") return ["taru","stonewareCrock","demijohn","keroseneTin"].includes(id);
    if (["basket","liddedBasket","room-basket","coolamon","room-pack"].includes(key)) return ["barkBox","coolamon","milkVessel","milkBag","grainHamper","pacificBasket","grainBin","andeanSack","parfleche"].includes(id) || key === "room-pack" && id === "waterskin";
    return false;
  });
  return candidates.length && roll < .72 ? candidates[Math.min(candidates.length-1, Math.floor(roll/.72*candidates.length))] : undefined;
}
