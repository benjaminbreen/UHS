import { items, packTemplates } from "../legacy-packs";
import type { Definition, Evidence, Selection } from "./types";

/** Existing content only. Occupations are prototype labels, not implemented work cycles.
 * Prop art and interaction expansion is explicitly waiting for user review. */
export const definitions: Definition[] = [
  ...Object.values(items).map(
    (item): Definition => ({
      id: `item.${item.id}`,
      category: "item",
      label: item.name,
      runtimeId: item.id,
      sprite: item.sprite,
      delivery: "existing",
    }),
  ),
  ...Object.values(packTemplates).flatMap((pack): Definition[] => [
    ...pack.buildings.map((id) => ({
      id: `building.${id}`,
      category: "building" as const,
      label: id,
      runtimeId: id,
      sprite: id,
      delivery: "existing" as const,
    })),
    ...pack.roles.map((role, index) => ({
      id: `occupation.${pack.id}.${index}`,
      category: "occupation" as const,
      label: role,
      runtimeId: role,
      delivery: "existing" as const,
    })),
    {
      id: `appearance.${pack.id}`,
      category: "appearance",
      label: `${pack.subtitle}: prototype player outfit`,
      runtimeId: pack.playerSprite,
      sprite: `${pack.playerSprite}-2-0`,
      delivery: "existing",
    },
  ]),
  ...["sheep", "goat", "lizard", "chicken"].map(
    (id): Definition => ({
      id: `animal.${id}`,
      category: "animal",
      label: id,
      runtimeId: id,
      delivery: "existing",
    }),
  ),
  ...["olive", "cypress", "oak", "hackberry"].map(
    (id): Definition => ({
      id: `plant.${id}`,
      category: "plant",
      label: id,
      runtimeId: id,
      sprite: id,
      delivery: "existing",
    }),
  ),
  {
    id: "prop.amphora",
    category: "prop",
    label: "Existing clay vessel study",
    sprite: "amphora",
    delivery: "existing",
  },
  {
    id: "institution.union-government",
    category: "institution",
    label: "Soviet union-level authority",
    delivery: "reference",
  },
  {
    id: "institution.russian-government",
    category: "institution",
    label: "Russian state authority",
    delivery: "reference",
  },
];
export const choice = (
  id: string,
  evidence: Evidence,
  overrides: Partial<Selection> = {},
): Selection => ({
  id,
  availability: "available",
  frequency: "common",
  contexts: ["any"],
  supply: "unspecified",
  evidence,
  ...overrides,
});
export const prototypeEvidence = (claim: string): Evidence => ({
  status: "fictional",
  claim,
  sources: [],
  limitation:
    "Compatibility with the existing playable prototype; not independent evidence of historical prevalence, distribution, or a functioning occupation.",
});

// A shared component list, explicitly selected by both profiles. No global pots rule.
export const basicStores = ["water", "grain", "wood"].map((id) =>
  choice(
    `item.${id}`,
    prototypeEvidence(
      "Existing staple/store selection shared by the two prototype profiles.",
    ),
  ),
);
export function legacySelections(packId: "roman" | "neolithic") {
  const pack = packTemplates[packId];
  const itemIds = [
    ...new Set([
      ...Object.keys(pack.startInventory),
      ...pack.commodities,
      pack.trade.give,
      pack.trade.take,
    ]),
  ].filter((id) => !["water", "grain", "wood"].includes(id));
  const evidence = prototypeEvidence(
    `Retains ${pack.subtitle}'s current selection without changing generator-v1 worlds.`,
  );
  return [
    ...itemIds.map((id) => choice(`item.${id}`, evidence)),
    ...pack.buildings.map((id) => choice(`building.${id}`, evidence)),
    ...pack.roles.map((_, i) => choice(`occupation.${packId}.${i}`, evidence)),
    ...pack.species.map((id) => choice(`animal.${id}`, evidence)),
    ...pack.trees.map((id) => choice(`plant.${id}`, evidence)),
    choice(`appearance.${packId}`, evidence),
  ];
}
