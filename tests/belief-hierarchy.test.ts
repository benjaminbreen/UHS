import { describe, expect, it } from "vitest";
import type { PersonalBelief } from "../src/content/beliefs";
import type { Power } from "../src/content/beliefs/types";
import { beliefHierarchy } from "../src/ui/CharacterPanel";

const amun: Power = {
  name: "Amun-Ra",
  domain: "sun and kingship",
  rank: "paramount",
};
const osiris: Power = {
  name: "Osiris",
  domain: "the dead and renewal",
  rank: "major",
};
const isis: Power = {
  name: "Isis",
  domain: "healing and protection",
  rank: "major",
  relations: [{ kind: "consort-of", of: "Osiris" }],
};
const hathor: Power = {
  name: "Hathor",
  domain: "love and music",
  rank: "major",
};

const belief: PersonalBelief = {
  system: {
    id: "test-egypt",
    label: "Test Egyptian practice",
    scope: { years: [-1550, -1069] },
    powers: [amun, osiris, isis, hathor],
    practice: ["Leave an offering."],
    evidence: {
      status: "documented",
      claim: "Test claim.",
      sources: [],
      limitation: "Test fixture.",
    },
  },
  patron: osiris,
  paramount: amun,
  observance: "regular",
};

describe("belief hierarchy", () => {
  it("uses authored ranks and order rather than promoting a patron", () => {
    const hierarchy = beliefHierarchy(belief);
    expect(
      hierarchy.nodes
        .filter((node) => node.tier === "primary")
        .map((node) => node.power.name),
    ).toEqual(["Amun-Ra"]);
    expect(
      hierarchy.nodes
        .filter((node) => node.tier === "secondary")
        .map((node) => node.power.name),
    ).toEqual(["Osiris", "Isis", "Hathor"]);
  });

  it("shows no more than three foundational and five important figures", () => {
    const powers: Power[] = [
      ...Array.from({ length: 4 }, (_, index) => ({
        name: `Foundation ${index}`,
        domain: "the foundation",
        rank: "paramount" as const,
      })),
      ...Array.from({ length: 7 }, (_, index) => ({
        name: `Figure ${index}`,
        domain: "an important concern",
        rank: "major" as const,
      })),
    ];
    const hierarchy = beliefHierarchy({
      ...belief,
      system: { ...belief.system, powers },
    });
    expect(
      hierarchy.nodes.filter((node) => node.tier === "primary"),
    ).toHaveLength(3);
    expect(
      hierarchy.nodes.filter((node) => node.tier === "secondary"),
    ).toHaveLength(5);
    expect(hierarchy.hidden).toBe(3);
  });

  it("draws only real relations as exact orthogonal paths", () => {
    const hierarchy = beliefHierarchy(belief);
    expect(hierarchy.edges).toHaveLength(1);
    expect(hierarchy.edges[0]).toMatchObject({
      key: "Isis-consort-of-Osiris",
      kind: "consort-of",
    });
    expect(hierarchy.edges[0].path).toMatch(
      /^M [\d.]+ [\d.]+ V [\d.]+ H [\d.]+ V [\d.]+$/,
    );
  });
});
