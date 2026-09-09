import { inventedName } from "./invented-name";
import { random } from "../../core/random";
import {
  generateAppearance,
  type CharacterAppearance,
} from "../../core/character";
import type { Inventory } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import { resolveCharacterContext, type CharacterContext } from "./resolve";
import type { CharacterPhysique } from "../../core/character";

export type Sex = CharacterPhysique["sex"];
export const characterSex = (seed: string, id: string): Sex =>
  random(seed, "character-v1", id, "sex") < 0.5 ? "female" : "male";

const pick = <T>(
  values: readonly T[],
  seed: string,
  id: string,
  purpose: string,
): T =>
  values[Math.floor(random(seed, "character-v1", id, purpose) * values.length)];
export function characterNameParts(
  s: WorldSetting,
  seed: string,
  id: string,
  context = resolveCharacterContext(s),
  inheritedFamilies?: readonly string[],
  sex: Sex = characterSex(seed, id),
) {
  const kit = context.names;
  if (!kit) {
    const drawn = context.traditions;
    if (!drawn) {
      const personal = inventedName(seed, id);
      return {
        display: personal,
        personal,
        families: [] as string[],
        format: "invented",
      };
    }
    const total = drawn.options.reduce((n, o) => n + o.weight, 0);
    let roll = random(seed, "character-v1", id, "tradition") * total;
    const tradition = (
      drawn.options.find((o) => (roll -= o.weight) < 0) ??
      drawn.options[drawn.options.length - 1]
    ).tradition;
    // A tradition may document one gender only; fall back to the whole set.
    const gendered =
      sex === "female" ? tradition.feminine : tradition.masculine;
    const personal = pick(
      gendered.length
        ? gendered
        : [...tradition.masculine, ...tradition.feminine],
      seed,
      id,
      "name",
    );
    const inherited = inheritedFamilies?.[0];
    const family =
      inherited ??
      (tradition.familyNames.length &&
      random(seed, "character-v1", id, "has-family-name") >=
        tradition.noFamilyName
        ? pick(tradition.familyNames, seed, id, "family-name")
        : undefined);
    return {
      display: !family
        ? personal
        : tradition.format === "family-personal"
          ? `${family} ${personal}`
          : `${personal} ${family}`,
      personal,
      families: family ? [family] : [],
      format: family ? tradition.format : "personal",
      tradition: tradition.id,
      region: drawn.region,
      note: tradition.note,
    };
  }
  const personal = pick(kit.names, seed, id, "name");
  const format = kit.format ?? "personal";
  const families: string[] = [];
  if (format === "personal-patronymic") {
    const patronymic = pick(kit.patronymics!, seed, id, "patronymic");
    return {
      display: `${personal} ${patronymic}`,
      personal,
      // A patronymic identifies a parent, not a hereditary household name.
      families,
      format,
    };
  }
  if (format !== "personal") {
    families.push(
      inheritedFamilies?.[0] ?? pick(kit.familyNames!, seed, id, "family-name"),
    );
    if (format === "personal-two-families")
      families.push(
        inheritedFamilies?.[1] ??
          pick(
            kit.secondFamilyNames ?? kit.familyNames!,
            seed,
            id,
            "second-family-name",
          ),
      );
  }
  const display = (
    format === "family-personal"
      ? [...families, personal]
      : [personal, ...families]
  ).join(" ");
  return { display, personal, families, format };
}
export function characterName(
  s: WorldSetting,
  seed: string,
  id: string,
  context = resolveCharacterContext(s),
) {
  return characterNameParts(s, seed, id, context).display;
}

export function characterLivelihood(
  s: WorldSetting,
  seed: string,
  id: string,
  requested?: string,
  context = resolveCharacterContext(s),
  sex: Sex = "unspecified",
) {
  const alias: Record<string, string> = {
    forager: "gatherer",
    weaver: "craftsperson",
    carpenter: "craftsperson",
    toolmaker: "craftsperson",
    merchant: "trader",
    shepherd: "herder",
    resident: "gatherer",
    wanderer: "traveler",
    visitor: "traveler",
  };
  // The exact work first, and only then the alias. These aliases were written
  // when eight kits covered everything, so they map a weaver to a generic
  // craftsperson; now that the tables name a weaver, asking for one and being
  // handed a craftsperson is a downgrade, not a substitution.
  const key = requested?.toLowerCase();
  const named = key
    ? (context.livelihoods.find((l) => l.id === key) ??
      context.livelihoods.find((l) => l.label.toLowerCase() === key) ??
      (alias[key]
        ? context.livelihoods.find((l) => l.id === alias[key])
        : undefined))
    : undefined;
  if (named) return named;
  // A few kinds of work were done overwhelmingly by one sex; the rest are open.
  const open = context.livelihoods.filter((l) => !l.sex || l.sex === sex);
  return pick(open.length ? open : context.livelihoods, seed, id, "livelihood");
}
export function eligibleInventory(
  inventory: Inventory,
  context: CharacterContext,
): Inventory {
  return Object.fromEntries(
    Object.entries(inventory).filter(([key]) =>
      context.profile.allowedItems.includes(key as keyof Inventory),
    ),
  );
}
export function characterAppearance(
  s: WorldSetting,
  seed: string,
  id: string,
  age = 34,
  context = resolveCharacterContext(s),
  sex: Sex = characterSex(seed, id),
): CharacterAppearance {
  const a = generateAppearance(`${seed}:character-v1:${id}`, 0, age, { sex });
  const kit = context.appearance;
  a.skin = pick(kit.skin, seed, id, "skin");
  a.hairColor =
    age >= 60 && random(seed, "character-v1", id, "grey") < 0.5
      ? "#aaa699"
      : pick(kit.hairColors, seed, id, "hair-color");
  a.hair = pick(kit.hairStyles, seed, id, "hair");
  const garment = pick(kit.garments, seed, id, "garment");
  // Generic ornaments and headwear must not leak out of the unrestricted art lab.
  a.wearing = {
    ...a.wearing,
    garment,
    sleeves:
      garment === "wrap" ? "none" : garment === "coat" ? "long" : "short",
    hem: "plain",
    shoulderCloth: false,
    cloak: false,
    headwear: "none",
    necklace: false,
    earrings: false,
  };
  return a;
}
export function generateCharacter(
  s: WorldSetting,
  seed: string,
  id: string,
  age = 34,
  requestedRole?: string,
  explicitName?: string,
  inheritedFamilies?: readonly string[],
  sex: Sex = characterSex(seed, id),
) {
  const context = resolveCharacterContext(s);
  // The hand-written kits are not split by gender yet, so a drawn sex would
  // contradict the name half the time. Ported traditions are split.
  const drawn: Sex = context.names ? "unspecified" : sex;
  const naming = characterNameParts(
    s,
    seed,
    id,
    context,
    inheritedFamilies,
    drawn,
  );
  const livelihood = characterLivelihood(
    s,
    seed,
    id,
    requestedRole,
    context,
    drawn,
  );
  const recognized =
    !requestedRole ||
    context.livelihoods.some(
      (l) => l.label.toLowerCase() === requestedRole.toLowerCase(),
    ) ||
    [
      "forager",
      "weaver",
      "carpenter",
      "toolmaker",
      "merchant",
      "shepherd",
      "resident",
      "wanderer",
      "visitor",
      "household member",
    ].includes(requestedRole.toLowerCase());
  const role = recognized ? livelihood.label : requestedRole!;
  return {
    name: explicitName || naming.display,
    role,
    inventory: eligibleInventory(livelihood.inventory, context),
    appearance: characterAppearance(s, seed, id, age, context, drawn),
    origin: {
      revision: 1 as const,
      profile: context.profile.id,
      community: context.community,
      nameKit: context.names?.id,
      nameTradition: "tradition" in naming ? naming.tradition : undefined,
      nameRegion: "region" in naming ? naming.region : undefined,
      sex: drawn,
      nameFormat:
        explicitName && explicitName !== naming.display
          ? "custom"
          : naming.format,
      nameFamilies:
        explicitName && explicitName !== naming.display ? [] : naming.families,
      livelihood: livelihood.id,
      notes: [
        ...context.notes,
        ...("note" in naming && naming.note ? [naming.note] : []),
        ...(!recognized
          ? [
              `${role} is a requested scenario label; specialized mechanics are not implemented. Supplies use the ${livelihood.label.toLowerCase()} kit.`,
            ]
          : []),
        "Generated individual. Palette frequencies and inventory quantities are authored gameplay choices.",
      ],
    },
  };
}
