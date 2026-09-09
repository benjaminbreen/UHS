import { inventedName } from "./invented-name";
import { livelihoods } from "./livelihoods";
import { random } from "../../core/random";
import {
  generateAppearance,
  type CharacterAppearance,
} from "../../core/character";
import type { Inventory } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import { resolveCharacterContext, type CharacterContext } from "./resolve";

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
) {
  const kit = context.names;
  if (!kit) {
    const personal = inventedName(seed, id);
    return {
      display: personal,
      personal,
      families: [] as string[],
      format: "invented",
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
  const key = requested?.toLowerCase();
  return (
    context.livelihoods.find((l) => l.id === (key && (alias[key] ?? key))) ??
    pick(context.livelihoods, seed, id, "livelihood")
  );
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
): CharacterAppearance {
  const a = generateAppearance(`${seed}:character-v1:${id}`, 0, age);
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
) {
  const context = resolveCharacterContext(s);
  const naming = characterNameParts(s, seed, id, context, inheritedFamilies);
  const livelihood = characterLivelihood(s, seed, id, requestedRole, context);
  const recognized =
    !requestedRole ||
    livelihoods.some(
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
    appearance: characterAppearance(s, seed, id, age, context),
    origin: {
      revision: 1 as const,
      profile: context.profile.id,
      community: context.community,
      nameKit: context.names?.id,
      nameFormat:
        explicitName && explicitName !== naming.display
          ? "custom"
          : naming.format,
      nameFamilies:
        explicitName && explicitName !== naming.display ? [] : naming.families,
      livelihood: livelihood.id,
      notes: [
        ...context.notes,
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
