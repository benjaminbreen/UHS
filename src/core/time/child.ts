import { inheritLikeness } from "../character";
import { generateCharacter } from "../../content/characters/generate";
import type { WorldSetting } from "../../content/geography/types";
import type { Actor } from "../types";

type Sex = "male" | "female" | undefined;
type Drawn = ReturnType<typeof generateCharacter>;

/** A newborn drawn with the family's name and looks; drawn again older, the
 * name and face kept, the work and clothes their age's. */
export function child(seed: string, setting: WorldSetting, id: string, born: number, sex: Sex, a?: Partial<Actor>, b?: Partial<Actor>, avoid?: ReadonlySet<string>) {
  const father = [a, b].find((x) => x?.origin?.sex === "male" || x?.appearance?.physique?.sex === "male") ?? a;
  const mother = father === a ? b : a;
  const format = father?.origin?.nameFormat;
  const families = format === "family-personal" || format === "personal-family"
    ? father?.origin?.nameFamilies
    : format === "personal-two-families" && father?.origin?.nameFamilies?.[0] && mother?.origin?.nameFamilies?.[0]
      ? [father.origin.nameFamilies[0], mother.origin.nameFamilies[0]]
      : undefined;
  const looks = [a?.appearance, b?.appearance].filter((x): x is NonNullable<typeof x> => !!x);
  let first: Drawn | undefined;
  return (age: number): Drawn => {
    const drawn = generateCharacter({ ...setting, year: born + age }, seed, id, age, age < 14 ? "Child" : undefined, first?.name, families,
      sex, father?.origin?.nameTradition, { community: father?.origin?.community, parentPersonal: father?.origin?.namePersonal, avoid });
    if (drawn.appearance && looks.length) drawn.appearance = inheritLikeness(drawn.appearance, looks, seed, id);
    if (first) drawn.origin = { ...drawn.origin, nameFormat: first.origin.nameFormat, nameFamilies: first.origin.nameFamilies, namePersonal: first.origin.namePersonal };
    first ??= drawn;
    return drawn;
  };
}
