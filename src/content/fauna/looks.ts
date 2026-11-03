import { random } from "../../core/random";
import type { CharacterScope } from "../characters/context-types";
import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";
import studiesC from "../../render/generated/fauna-c-studies.json" with { type: "json" };
import studiesM from "../../render/generated/fauna-m-studies.json" with { type: "json" };
import studiesR from "../../render/generated/fauna-r-studies.json" with { type: "json" };
import studiesF from "../../render/generated/fauna-f-studies.json" with { type: "json" };
import studiesG from "../../render/generated/fauna-g-studies.json" with { type: "json" };
import studiesU from "../../render/generated/fauna-u-studies.json" with { type: "json" };

type Looks = {
  /** Role to colour in the coat the atlas is drawn in. */
  roles: Record<string, string>;
  forms: readonly {
    id: string;
    weight: number;
    where?: readonly CharacterScope[] | null;
    coats: Record<string, number>;
  }[];
  coats: Record<string, Record<string, string>>;
  /** First year a coat is seen, for the ones breeders made lately. */
  coatFrom: Record<string, number>;
  /** A coat that moults: the coat it wears instead in a given season. */
  seasons?: Record<string, Record<string, string>>;
  /** The species whose drawing this one wears, when it borrows one. */
  art?: string;
};

const looks = Object.fromEntries(
  Object.entries({
    ...studiesC,
    ...studiesM,
    ...studiesR,
    ...studiesF,
    ...studiesG,
    ...studiesU,
  } as Record<string, { looks?: unknown }>)
    .filter(([, study]) => study.looks)
    .map(([species, study]) => [species, study.looks as Looks]),
);

// Drawn as a horse, in the one coat of the wild: dun with dark points.
looks["wild-horse"] = {
  ...looks.horse,
  art: "horse",
  forms: [{ id: "horse", weight: 1, coats: { dun: 1 } }],
};

// Borrowers that keep only the drawing: the roles are the study's palette.
const rabbitRoles = { o: "#7d5a33", d: "#a67c48", m: "#c79d68", l: "#e0bf92", h: "#f4ddb6", b: "#fbf3e2", e: "#241810", u: "#d79a97" };
const deerRoles = { o: "#6a3d22", d: "#8f5732", m: "#bb7941", l: "#dc9d5f", h: "#f1c78c", b: "#f3e4c0", e: "#2a1a12", a: "#55301c" };
const one = (art: string, roles: Record<string, string>, coat: string, to: Record<string, string>): Looks => ({
  roles,
  art,
  forms: [{ id: art, weight: 1, coats: { [coat]: 1 } }],
  coats: { [coat]: { ...roles, ...to } },
  coatFrom: {},
});
looks.hare = one("rabbit", rabbitRoles, "hare", { o: "#55391f", d: "#7a5630", m: "#9f7645", l: "#c09a65", h: "#d9bd8c", u: "#a9806a" });
looks["roe-deer"] = one("red-deer", deerRoles, "roe", { o: "#5e2a16", d: "#8a3f1f", m: "#b5592b", l: "#d07841", h: "#e6a266", b: "#efe0c8" });
looks.chital = one("red-deer", deerRoles, "chital", { o: "#74381a", d: "#a3531f", m: "#cb7430", l: "#e4974b", h: "#f4c27c", b: "#fbf2e0" });
looks["white-tailed-deer"] = one("red-deer", deerRoles, "whitetail", { o: "#55412e", d: "#7c5f43", m: "#a0805c", l: "#bd9e78", h: "#d6bf99", b: "#faf6ec" });
const wild = (to: Record<string, string>) => ({ ...looks.dog.coats.tan, ...to, r: to.d, p: to.m, q: to.l });
looks["golden-jackal"] = {
  ...looks.dog,
  art: "dog",
  forms: [{ id: "pariah", weight: 1, coats: { jackal: 1 } }],
  coats: { jackal: wild({ o: "#5b4022", d: "#8d6a3a", m: "#b48d52", l: "#cfab70", h: "#e4c995", b: "#efe2c4", t: "#efe2c4" }) },
};
looks.coyote = {
  ...looks.dog,
  art: "dog",
  forms: [{ id: "pariah", weight: 1, coats: { coyote: 1 } }],
  coats: { coyote: wild({ o: "#4a4136", d: "#73654f", m: "#998569", l: "#b8a586", h: "#d3c4a6", b: "#ece4d2", t: "#ece4d2" }) },
};

/** A form is a different drawing and has its own frames; a coat is a palette
 * the renderer swaps in. */
export type FaunaLook = { form: string; coat: string; art: string };

function pick<T>(items: readonly (readonly [T, number])[], roll: number) {
  let left = roll * items.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [item, weight] of items) if ((left -= weight) <= 0) return item;
  return items[items.length - 1][0];
}

/** A herd is one breed, and mostly one colour: the form and a herd coat come
 * from the group, and an animal now and then departs from it. */
export function faunaLook(
  species: string,
  seed: string,
  group: string,
  member: string,
  setting?: WorldSetting,
  season?: string,
): FaunaLook | undefined {
  const spec = looks[species];
  if (!spec) return undefined;
  const local = spec.forms.filter(
    (f) =>
      !f.where ||
      !setting ||
      f.where.some((scope) => matchesCharacterScope(scope, setting, "*")),
  );
  const forms = local.length ? local : spec.forms;
  const form = pick(
    forms.map((f) => [f, f.weight] as const),
    random(seed, "fauna-form", group),
  );
  const coats = Object.entries(form.coats).filter(
    ([coat]) => !setting || setting.year >= (spec.coatFrom[coat] ?? -Infinity),
  );
  const herd = pick(coats, random(seed, "fauna-coat", group));
  const own =
    random(seed, "fauna-own-coat", member) < 0.6
      ? herd
      : pick(coats, random(seed, "fauna-coat", member));
  const coat = (season && spec.seasons?.[own]?.[season]) || own;
  return {
    form: form.id,
    coat,
    art:
      spec.art ??
      (form.id === spec.forms[0].id ? species : `${species}.${form.id}`),
  };
}

/** The colour swap for a coat: drawn colour to coat colour, as 0xRRGGBB. */
export function faunaCoats(art: string, coat: string) {
  // A borrower's coats are its own, found by the drawing it wears.
  const spec = [looks[art], ...Object.values(looks).filter((l) => l.art === art)].find(
    (l) => l?.coats[coat],
  );
  const to = spec?.coats[coat];
  if (!spec || !to) return undefined;
  const hex = (value: string) => parseInt(value.slice(1), 16);
  return new Map(
    Object.entries(spec.roles).map(([role, from]) => [
      hex(from),
      hex(to[role]),
    ]),
  );
}
