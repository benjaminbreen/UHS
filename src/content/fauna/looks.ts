import { random } from "../../core/random";
import type { CharacterScope } from "../characters/context-types";
import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";
import studiesC from "../../../public/fauna-c/studies.json" with { type: "json" };
import studiesM from "../../../public/fauna-m/studies.json" with { type: "json" };
import studiesR from "../../../public/fauna-r/studies.json" with { type: "json" };
import studiesF from "../../../public/fauna-f/studies.json" with { type: "json" };
import studiesG from "../../../public/fauna-g/studies.json" with { type: "json" };
import studiesU from "../../../public/fauna-u/studies.json" with { type: "json" };

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
export function faunaCoats(species: string, coat: string) {
  const spec = looks[species];
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
