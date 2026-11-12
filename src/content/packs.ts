import type { Pack } from "../core/types";
import { resolvePlayablePacks } from "./history/playable";
import { items as baseItems } from "./legacy-packs";
import { ecologicalItems } from "./ecology/resources";
import { forageItems } from "./ecology/forage";
import { metalItems } from "./ecology/metals";
import { caveItems } from "./caves/items";
import { floraItems } from "./ecology/flora";
import { wearableItems } from "./characters/wearables";
import { dungItems } from "./fauna/dung";
import { vegetableItems } from "./agriculture/gardens";
import { wareItems } from "./economy/wares";
// legacy-packs is frozen, so its items get their descriptions here.
const baseAbout: Record<string, string> = {
  bread:
    "Flour, water and salt baked on a hot stone or in an oven: the day's plain meal.",
  grain:
    "Threshed seed from the harvest, stored against the lean months and ground into flour.",
  water:
    "Drawn from a well or river and carried home in a clay jar; drunk, cooked with, and never quite enough.",
  coin:
    "Struck bronze small change, worn smooth in purses and market stalls.",
  obsidian:
    "Volcanic glass knapped into flakes sharper than any metal; traded far from where it was found.",
  wool:
    "A sheep's fleece, greasy and matted, waiting to be washed, combed and spun.",
  wood:
    "Split logs and branches for the hearth, gathered daily and never plentiful near town.",
  fish:
    "Split, salted and dried in the sun; it keeps for months and softens in a stew.",
  tool:
    "A short blade for cutting cord, food and everything else a day brings.",
  flax:
    "Stalks pulled, retted and beaten for their fibre, which is spun into linen thread.",
  lizard:
    "A small lizard caught by hand, wriggling; a snack, a curiosity or a child's prize.",
};
export const items: Record<
  import("../core/types").ItemId,
  import("../core/types").ItemDef
> = {
  ...Object.fromEntries(
    Object.entries(baseItems).map(([id, d]) => [
      id,
      { description: baseAbout[id], ...d },
    ]),
  ),
  ...ecologicalItems,
  ...forageItems,
  ...metalItems,
  ...caveItems,
  ...floraItems,
  ...wearableItems,
  ...dungItems,
  ...vegetableItems,
  ...wareItems,
  "walking-cane": { id: "walking-cane", name: "Walking cane", description: "A stout stick with a curved or knobbed head, for steadying a walk or for show.", sprite: "walking-cane", value: 4, hand: {} },
  fan: { id: "fan", name: "Folding fan", description: "Pleated paper or silk on slender ribs, snapped open to stir the air or hide a smile.", sprite: "fan", value: 3, hand: {} },
  spear: { id: "spear", name: "Hunting spear", description: "A wooden shaft tipped with a sharp point for hunting game.", sprite: "spear", value: 4, hand: { strike: true, edge: true, weapon: "spear" } },
  bow: { id: "bow", name: "Bow", description: "A stave of wood, horn or both, strung taut to send an arrow farther than any throw.", sprite: "bow", value: 8, hand: {} },
  arrow: { id: "arrow", name: "Arrow", description: "A straight shaft fletched with feathers and tipped with stone, bone or metal.", sprite: "arrow", value: 1 },
  halberd: { id: "halberd", name: "Halberd", description: "An axe blade, a spike and a hook on a shaft taller than a man: the arm of the town watch and the palace gate.", sprite: "halberd", value: 12, hand: { strike: true, edge: true, weapon: "spear" } },
  glaive: { id: "glaive", name: "Glaive", description: "A long curved blade on a pole, swept rather than thrust: the Chinese guandao, the Japanese naginata.", sprite: "glaive", value: 12, hand: { strike: true, edge: true, weapon: "spear" } },
  musket: { id: "musket", name: "Musket", description: "A smoothbore gun fired by match, wheel or flint, loaded from the muzzle one ball at a time.", sprite: "musket", value: 30, hand: {} },
  macuahuitl: { id: "macuahuitl", name: "Macuahuitl", description: "A flat wooden club edged both sides with set blades of obsidian: the Mexica warrior's sword.", sprite: "macuahuitl", value: 10, hand: { strike: true, edge: true } },
  crossbow: { id: "crossbow", name: "Crossbow", description: "A short bow set crosswise on a stock, spanned by hand, foot or windlass and loosed by a trigger.", sprite: "crossbow", value: 16, hand: {} },
  beads: { id: "beads", name: "Prayer beads", description: "A string of beads told through the fingers to count prayers: rosary, tasbih, mala, juzu.", sprite: "beads", value: 2, hand: {} },
  "alms-bowl": { id: "alms-bowl", name: "Alms bowl", description: "A plain bowl a monk carries on the morning round, filled by whoever chooses to give.", sprite: "alms-bowl", value: 2, hand: {} },
  censer: { id: "censer", name: "Censer", description: "A pot of burning incense carried or swung on chains: frankincense in a church, copal before a Mexica temple.", sprite: "censer", value: 6, hand: {} },
  ledger: { id: "ledger", name: "Register", description: "A bound book or roll of accounts: who has paid, who owes, what came through the gate.", sprite: "ledger", value: 4, hand: {} },
  "water-pole": { id: "water-pole", name: "Pails on a pole", description: "Two pails slung from a pole across the shoulder: water to sell by the cup, or night soil to the fields.", sprite: "water-pole", value: 4, hand: {} },
  "carrying-pole": { id: "carrying-pole", name: "Carrying pole", description: "A springy pole across one shoulder with a basket at each end: how loads moved through most of Asia.", sprite: "carrying-pole", value: 3, hand: {} },
  "lamp-pole": { id: "lamp-pole", name: "Lamplighter's pole", description: "A long pole with a hook to open a street lamp and a wick to light it.", sprite: "lamp-pole", value: 3, hand: {} },
  "sweep-brush": { id: "sweep-brush", name: "Sweep's brush", description: "A round head of stiff bristle on jointed rods, pushed up a chimney to bring the soot down.", sprite: "sweep-brush", value: 3, hand: {} },
  lute: { id: "lute", name: "Lute", description: "A plucked instrument with a round back and a fretted neck: lute, oud, pipa, biwa, kora.", sprite: "lute", value: 12, hand: {} },
  drum: { id: "drum", name: "Hand drum", description: "A skin stretched over a frame or a hollow log, played with the hands or a stick.", sprite: "drum", value: 6, hand: {} },
  flute: { id: "flute", name: "Flute", description: "A pipe of cane, bone, clay or bamboo with finger holes.", sprite: "flute", value: 3, hand: {} },
  rifle: { id: "rifle", name: "Rifle", description: "A breech-loading rifle with a bolt or lever and a magazine of cartridges; a bayonet fixes to the muzzle.", sprite: "rifle", value: 30, hand: {} },
  harpoon: { id: "harpoon", name: "Harpoon", description: "A barbed or toggling iron head on a long shaft, with a line made fast to it, thrown into a whale, seal or walrus.", sprite: "harpoon", value: 8, hand: { strike: true, edge: true, weapon: "spear" } },
  paddle: { id: "paddle", name: "Steering paddle", description: "A long carved paddle held over the stern to steer a canoe, or dug in to drive it.", sprite: "paddle", value: 4, hand: {} },
  scales: { id: "scales", name: "Hand scales", description: "A beam and two pans on cords, with a set of weights, for coin, gold dust, spice or medicine.", sprite: "scales", value: 8, hand: {} },
  briefcase: { id: "briefcase", name: "Briefcase", description: "A flat leather case with a handle for papers: deeds, ledgers, contracts, drawings.", sprite: "briefcase", value: 6, hand: {} },
  "doctor-bag": { id: "doctor-bag", name: "Doctor's bag", description: "A hinged leather bag that opens wide on a metal frame, holding instruments, dressings and medicines.", sprite: "doctor-bag", value: 10, hand: {} },
  "throwing-stick": { id: "throwing-stick", name: "Throwing stick", description: "A flat, bent club of hardwood thrown spinning low over the ground at birds and small game. Australian hunting sticks, the Hopi rabbit stick and Egyptian fowling sticks were made not to come back.", sprite: "throwing-stick", value: 3, hand: {} },
  blowgun: { id: "blowgun", name: "Blowgun", description: "A long tube of cane or bored wood. A puff of breath sends a light dart, tipped with curare or another plant poison, into a monkey or a bird high in the trees.", sprite: "blowgun", value: 6, hand: {} },
  dart: { id: "dart", name: "Poison dart", description: "A palm-spine dart with a wad of kapok to seal the tube, its tip dipped in poison. The animal runs on for a while before it falls.", sprite: "dart", value: 1 },
  bolt: { id: "bolt", name: "Crossbow bolt", description: "A short, heavy arrow with an iron head, also called a quarrel.", sprite: "bolt", value: 1 },
  shot: { id: "shot", name: "Shot and powder", description: "Lead balls and a horn of black powder: one charge for each shot from a muzzle-loading gun.", sprite: "shot", value: 1 },
  cartridge: { id: "cartridge", name: "Cartridge", description: "A brass case holding powder, primer and bullet together, loaded from the breech.", sprite: "cartridge", value: 1 },
  snare: { id: "snare", name: "Snare", description: "A running noose of cord or wire on a peg, set where a hare or a bird runs. Set it, leave it overnight, and come back to see what it has caught.", sprite: "snare", value: 1, hand: {} },
  hound: { id: "hound", name: "Hunting dog", description: "A dog that goes out with you: it runs down hares and birds and holds a deer or a boar at bay until you come up. Dogs hunted with people for at least fifteen thousand years.", sprite: "hound", value: 20 },
  hawk: { id: "hawk", name: "Hawk", description: "A trained hawk or falcon carried hooded on a gloved fist and cast off at birds and hares. It comes back to the fist for meat.", sprite: "hawk", value: 40, hand: {} },
  sling: { id: "sling", name: "Sling", description: "Two cords and a pouch; whirled overhead, it hurls a stone hard enough to kill.", sprite: "sling", value: 3, hand: {} },
};
export const packs: Record<string, Pack> = resolvePlayablePacks();
export function resolvePrompt(
  input: string,
): { pack: Pack; seed: string } | { error: string } {
  const q = input.trim().toLowerCase();
  const date = /\b(\d+)\s*(bce|bc|ce|ad)\b/.exec(q);
  if (date) {
    const year = Number(date[1]),
      bce = date[2].startsWith("b");
    if (!((bce && year === 6500) || (!bce && year === 100)))
      return {
        error:
          "That date is outside this build’s supported periods: 100 CE and c. 6500 BCE. Your requested setting is preserved.",
      };
  }
  if (/roman|rome|tiber|ostia/.test(q) && /neolith|anatolia|konya|6500/.test(q))
    return {
      error:
        "This description combines the two supported settings. Choose Roman Italy or Neolithic Anatolia.",
    };
  const p = /neolith|anatolia|konya|6500|çatal|catal|early farmer/.test(q)
    ? packs.neolithic
    : /roman|rome|tiber|ostia|100\s*(ce|ad)|gaius/.test(q)
      ? packs.roman
      : undefined;
  return p
    ? { pack: p, seed: p.defaultSeed }
    : {
        error:
          "This build supports Roman Italy around 100 CE and Neolithic Anatolia around 6500 BCE. Your requested setting is preserved above; choose a supported world below.",
      };
}
