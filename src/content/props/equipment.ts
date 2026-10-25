import type { WorldSetting } from "../geography/types";
import type { PropDef } from "./catalog";

export function equipmentVariant(s: WorldSetting | undefined, key: string, variant: number) {
  if (!["spring", "bakeOven", "kiln", "bloomery", "leverPress", "trough"].includes(key)) return variant;
  if (key === "spring") return 1;
  if (!s) return 0;
  const { year, culture, settlement } = s;
  const european = culture === "european";
  const westAsian = culture === "north-african-west-asian";
  if (key === "bakeOven")
    return variant === 1 && ((european && year >= -499) || year >= 1850) ? 1 : 0;
  if (key === "kiln")
    return variant === 1 && ((european && year >= -499) || (culture === "east-asian" && year >= 200) || year >= 1850) ? 1 : 0;
  if (key === "bloomery")
    return variant === 1 && european && year >= 500 ? 1 : 0;
  if (key === "leverPress")
    return variant === 1 && ((european && year >= 1500) || year >= 1850) ? 1 : 0;
  if (key === "trough")
    return variant === 1 && (european || westAsian || settlement === "city" || year >= 1850) ? 1 : 0;
  return variant;
}

const fixed = { solid: true, variants: 1 } as const;
const fire = { ...fixed, fire: true };
const art = (kind: string, form: string) => `study-prop-equipment-${kind}-${form}`;
export const equipmentProps: Record<string, PropDef> = {
  tannur: { ...fire, name: "Clay tannur", family: "tannur", sprite: art("tannur","b"), visualClearance: [1,1,2,0] },
  bankedTannur: { ...fire, name: "Banked clay oven", family: "tannur", sprite: art("tannur","c"), visualClearance: [1,1,2,0] },
  teaStove: { ...fire, name: "Brick stove and iron kettle", family: "stove", sprite: art("stove","b"), visualClearance: [1,1,2,0] },
  charcoalStove: { ...fire, name: "Clay charcoal stove and brass kettle", family: "stove", sprite: art("stove","c"), visualClearance: [1,1,1,0] },
  brazier: { ...fire, name: "Bronze bowl brazier", family: "brazier", sprite: art("brazier","b"), breakable: "metal", visualClearance: [1,1,1,0] },
  ironPanBrazier: { ...fire, name: "Vented iron pan brazier", family: "brazier", sprite: art("brazier","c"), breakable: "metal", visualClearance: [1,1,1,0] },
  chickenCoop: { ...fixed, name: "Raised timber henhouse", family: "chicken-coop", sprite: art("chicken_coop","b"), container: true, breakable: "wood", visualClearance: [2,2,2,1] },
  wovenHenShelter: { ...fixed, name: "Woven hen shelter", family: "chicken-coop", sprite: art("chicken_coop","c"), container: true, breakable: "fiber", visualClearance: [1,1,2,1] },
  stockPen: { ...fixed, name: "Post-and-rail stock pen", family: "stock-pen", sprite: art("stock_pen","b"), where: "worksite", visualClearance: [2,2,3,0] },
  wattlePen: { ...fixed, name: "Wattle hurdle pen", family: "stock-pen", sprite: art("stock_pen","c"), where: "worksite", visualClearance: [2,2,3,0] },
  joinerBench: { ...fixed, name: "Joiner's bench with wooden vise", family: "workbench", sprite: art("workbench","b"), where: "worksite", breakable: "wood", visualClearance: [2,2,2,0] },
  lowPlaningBench: { ...fixed, name: "Low planing bench", family: "workbench", sprite: art("workbench","c"), where: "worksite", breakable: "wood", visualClearance: [2,2,1,0] },
};

export const equipmentAbout: Record<string,string> = {
  tannur: "A thick-walled clay oven. Flatbread bakes against the hot inner wall; air enters through the small opening at its foot.",
  bankedTannur: "A clay-lined bread oven set into an earthen bench, with a low opening for feeding the fire.",
  teaStove: "An iron kettle stands on the cooking plate of a brick stove. The fire is fed through the opening below.",
  charcoalStove: "A small clay charcoal stove supports a brass kettle above its air vents.",
  brazier: "A shallow bronze bowl holds glowing charcoal on a three-legged stand, with small handles at the rim.",
  ironPanBrazier: "A vented iron pan holds charcoal above a riveted stand. Slots in its sides admit air to the coals.",
  chickenCoop: "A raised timber henhouse with a small ramp, a hen entrance and a separate hatch for collecting eggs and cleaning.",
  wovenHenShelter: "A woven shelter for hens, with a thatched roof and a small framed entrance beneath the eaves.",
  stockPen: "A timber post-and-rail enclosure for small livestock, closed by a braced wooden gate.",
  wattlePen: "Woven hurdles tied to upright stakes form a small livestock pen, with a separate woven gate.",
  joinerBench: "A standing workbench with a wooden face vise, holes for bench dogs and a hand plane on its top.",
  lowPlaningBench: "A low bench for working while seated or kneeling. Wooden stops and wedges hold the work in place.",
};

/** These are regional reconstructions, not universal dates of invention. */
export function regionalEquipment(s: WorldSetting | undefined): string[] {
  if (!s || s.settlement === "camp") return [];
  const {culture:c,year:y}=s;
  const eu=c==="european", west=c==="north-african-west-asian", east=c==="east-asian";
  const south=c==="south-asian", se=c==="southeast-asian", inner=c==="inner-eurasian";
  const african=c==="west-central-african"||c==="east-southern-african";
  const old=eu||west||east||south||se||inner;
  const result: string[]=[];
  if (y>=-5999 && (west || ((south||inner)&&y>=-2499)) && (y<1950||s.settlement!=="city")) result.push("tannur","bankedTannur");
  if (y<1950 && ((east&&y>=1000)||(eu&&y>=1600)||(old&&y>=1800))) result.push("teaStove");
  if (y<1950 && ((east&&y>=1000)||((south||se)&&y>=1600)||(old&&s.settlement==="port"&&y>=1800))) result.push("charcoalStove");
  if (y<1950 && (((eu||west||east)&&y>=-799)||((south||inner)&&y>=-499))) result.push("brazier");
  if (y<1950 && (((eu||west||east)&&y>=1000)||(south&&y>=1500)||y>=1850)) result.push("ironPanBrazier");
  if (((eu&&y>=-499)||(east&&y>=500)||y>=1800)) result.push("chickenCoop");
  if (((south||se)&&y>=-1499)||(east&&y>=-999)||((eu||west)&&y>=-499)||(african&&y>=500)||y>=1800) result.push("wovenHenShelter");
  if (((eu||west||south)&&y>=-2999)||(east&&y>=-1499)||(inner&&y>=-999)||(african&&y>=1000)||y>=1800) result.push("stockPen");
  if ((old&&y>=-3999)||(african&&y>=-1999)||y>=1800) result.push("wattlePen");
  if ((eu&&y>=1500)||y>=1850) result.push("joinerBench");
  if ((east&&y>=800)||(old&&y>=1000)||y>=1850) result.push("lowPlaningBench");
  return result;
}

export function equipmentChoices(s: WorldSetting | undefined, key: string): string[] {
  if (!s) return [key];
  const groups: Record<string,string[]>={tannur:["tannur","bankedTannur"],teaStove:["teaStove","charcoalStove"],brazier:["brazier","ironPanBrazier"],chickenCoop:["chickenCoop","wovenHenShelter"],stockPen:["stockPen","wattlePen"]};
  const group=groups[key];
  if (!group) return [key];
  const eligible=regionalEquipment(s);
  return group.filter(k=>eligible.includes(k));
}
