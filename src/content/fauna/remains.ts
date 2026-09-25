import { faunaCombat, faunaProfile } from "./index";

/** What a kill leaves where it happened. A mouse is eaten whole and leaves
 * nothing; a bird leaves its feathers, a rabbit a tuft of its fur, and
 * anything a pack pulls down lies where it fell until it is bone. */
export type RemainsKind = "feathers" | "fur" | "carcass" | "gift";

/** Hours each lasts before the grass has it. A carcass goes through its
 * stages on the way: picked over in a day, bone in five, old bone by forty. */
export const REMAINS_HOURS: Record<RemainsKind, number> = {
  feathers: 48,
  fur: 24,
  carcass: 2880,
  gift: 12,
};
const CARCASS_STAGES = [24, 120, 960];

const FEATHERS: Record<string, string> = {
  "cattle-egret": "white",
  "rock-dove": "grey",
  turkey: "dark",
  "wild-turkey": "dark",
};

export function remainsOf(preyId: string): RemainsKind | undefined {
  const prey = faunaProfile(preyId);
  if (!prey) return undefined;
  const { mass, yields } = faunaCombat(prey);
  if (yields.feathers) return "feathers";
  if (mass >= 1) return "carcass";
  return yields.hide || yields.meat ? "fur" : undefined;
}

const name = (id: string) =>
  (faunaProfile(id)?.label ?? id).replace(/ study$/, "").toLowerCase();

/** Who ate here, as someone finding the place would put it. */
function by(id?: string) {
  if (!id) return "Something";
  if (id === "gray-wolf") return "Wolves";
  if (id === "cat") return "A cat";
  if (id === "dog") return "A dog";
  if (/fox|fennec/.test(id)) return "A fox";
  return `A ${name(id)}`;
}

/** Sprite, name and the line a person reads, by age in hours. */
export function remainsLook(
  kind: RemainsKind,
  prey: string,
  hunter: string | undefined,
  hours: number,
) {
  const animal = name(prey);
  if (kind === "feathers")
    return {
      sprite: `nature-remains-feathers-${FEATHERS[prey] ?? "brown"}`,
      name: "Feathers",
      description:
        hours < 6
          ? `${capital(animal)} feathers in a loose ring on the ground, and no ${animal}.`
          : "A few feathers caught in the grass. The wind has had the rest.",
    };
  if (kind === "fur")
    return {
      sprite: "nature-remains-fur",
      name: "Fur",
      description:
        hours < 6
          ? `A tuft of ${animal} fur, soft as ash, snagged on the stalks.`
          : "Wisps of fur, gone grey with dew.",
    };
  if (kind === "gift")
    return {
      sprite: "nature-remains-mouse",
      name: "A mouse",
      description: "A dead mouse, laid out neatly. A present from the cat.",
    };
  const stage = CARCASS_STAGES.findIndex((h) => hours < h);
  return [
    {
      sprite: "nature-remains-carcass",
      name: `Dead ${animal}`,
      description: `What is left of a ${animal}. ${by(hunter)} ate here, not long ago.`,
    },
    {
      sprite: "nature-remains-carcass-picked",
      name: "Carcass",
      description: `A ${animal}'s carcass, picked over by the crows.`,
    },
    {
      sprite: "nature-remains-bones",
      name: "Bones",
      description: `${capital(animal)} bones, pale in the grass. The grass is already coming up between the ribs.`,
    },
    {
      sprite: "nature-remains-bones-old",
      name: "Old bones",
      description:
        "A jaw and a scatter of bleached bone. Nobody would know now what it was.",
    },
  ][stage < 0 ? 3 : stage];
}

const capital = (s: string) => s[0].toUpperCase() + s.slice(1);
