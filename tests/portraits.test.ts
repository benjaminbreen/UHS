import { describe, expect, it } from "vitest";
import {
  describeAdornment,
  earOrnaments,
  faceMarks,
  generateAdornment,
  generateAppearance,
  noseShapes,
  type CharacterAppearance,
} from "../src/core/character";
import { characterAppearanceSchema } from "../src/runtime/schema";
import { MAT } from "../src/render/portraits/raster";
import { appearanceKits } from "../src/content/characters/profiles/communities";
import {
  expressions,
  facePose,
  paintConstructed,
  restingFace,
  type Expression,
} from "../src/render/portraits/constructed";

const base = (over: Partial<CharacterAppearance> = {}): CharacterAppearance => {
  const a = generateAppearance("portrait-test", 3, 30);
  return {
    ...a,
    hair: "cropped",
    beard: "none",
    wearing: {
      ...a.wearing,
      headwear: "none",
      earrings: false,
      necklace: false,
    },
    adornment: { ears: "none", nose: "none", marks: "none" },
    ...over,
  };
};
const pixels = (a: CharacterAppearance, pose = restingFace) =>
  paintConstructed(a, 30, undefined, 0, false, pose).color.join("");

describe("portrait expressions", () => {
  it("rests when nothing is asked of the face", () => {
    expect(facePose("neutral")).toEqual(restingFace);
    expect(facePose("happy", 0)).toEqual(restingFace);
    expect(pixels(base(), facePose("neutral"))).toBe(pixels(base()));
  });
  it("draws a different face for every named expression", () => {
    const drawn = new Map<string, Expression>();
    for (const expression of expressions) {
      const key = pixels(base(), facePose(expression));
      expect(drawn.has(key)).toBe(false);
      drawn.set(key, expression);
    }
    expect(drawn.size).toBe(expressions.length);
  });
  it("scales a pose, so a change can be played rather than cut to", () => {
    const half = facePose("laugh", 0.5);
    const full = facePose("laugh", 1);
    expect(half.mouthOpen).toBe(full.mouthOpen / 2);
    expect(pixels(base(), half)).not.toBe(pixels(base(), full));
    expect(pixels(base(), half)).not.toBe(pixels(base()));
  });
});

describe("portrait ornament", () => {
  it("draws every ear ornament, and differently", () => {
    const drawn = new Set(
      earOrnaments.map((ears) =>
        pixels(base({ adornment: { ears, nose: "none", marks: "none" } })),
      ),
    );
    expect(drawn.size).toBe(earOrnaments.length);
  });
  it("draws every face mark, and never over an eye or a hat", () => {
    const drawn = new Set(
      faceMarks.map((marks) =>
        pixels(base({ adornment: { marks, ears: "none", nose: "none" } })),
      ),
    );
    expect(drawn.size).toBe(faceMarks.length);
  });
  it("marks skin and nothing else", () => {
    // Everything a hat, hood, beard or garment covers stays covered, and no
    // line is drawn through an eye.
    for (const headwear of ["none", "hood", "helmet"] as const) {
      const wearing = { ...base().wearing, headwear };
      for (const marks of faceMarks) {
        const plain = paintConstructed(
          base({ wearing, adornment: { marks: "none" } }),
        );
        const inked = paintConstructed(base({ wearing, adornment: { marks } }));
        for (let i = 0; i < plain.color.length; i++)
          if (plain.color[i] !== inked.color[i])
            expect(plain.mat[i]).toBe(MAT.skin);
      }
    }
  });
  it("keeps marks and stretched lobes off small children", () => {
    const pools = {
      ears: ["spool"] as const,
      nose: ["ring"] as const,
      marks: ["cheek-lines"] as const,
    };
    const child = generateAdornment("seed", 0, 6, "female", pools);
    expect(child.marks).toBe("none");
    expect(child.nose).toBe("none");
    expect(child.ears).toBe("stud");
    expect(generateAdornment("seed", 0, 30, "female", pools).marks).toBe(
      "cheek-lines",
    );
  });
  it("honours a kit's sex convention for nose ornaments", () => {
    const pools = { nose: ["ring"] as const, noseSex: "female" as const };
    expect(generateAdornment("seed", 0, 30, "female", pools).nose).toBe("ring");
    expect(generateAdornment("seed", 0, 30, "male", pools).nose).toBe("none");
  });
  it("is deterministic and survives a save round trip", () => {
    const a = generateAppearance("adorn", 7, 30);
    expect(a.adornment).toEqual(generateAppearance("adorn", 7, 30).adornment);
    expect(characterAppearanceSchema.safeParse(a).success).toBe(true);
  });
  it("only draws ornaments a kit actually names", () => {
    for (const kit of appearanceKits) {
      const pools = kit.adornment ?? {};
      for (const ears of pools.ears ?? []) expect(earOrnaments).toContain(ears);
      for (const marks of pools.marks ?? []) expect(faceMarks).toContain(marks);
      // A pool with no "none" in it puts an ornament on every single person.
      if (pools.marks) expect(pools.marks).toContain("none");
      if (pools.ears) expect(pools.ears).toContain("none");
    }
  });
});

describe("portrait noses", () => {
  it("draws all nine profiles, and differently", () => {
    const drawn = new Set(
      noseShapes.map((nose) =>
        pixels(base({ face: { ...base().face!, nose } })),
      ),
    );
    expect(drawn.size).toBe(noseShapes.length);
  });
});

describe("saying what the portrait shows", () => {
  it("names each ornament and mark, and says nothing when there is none", () => {
    expect(describeAdornment(base())).toEqual([]);
    const notes = describeAdornment(
      base({
        adornment: {
          ears: "spool",
          nose: "septum",
          marks: "cheek-lines",
          markStyle: "scar",
          metal: "bone",
        },
        wearing: { ...base().wearing, necklace: true },
      }),
    );
    expect(notes.map((n) => n.kind)).toEqual(["ear", "nose", "neck", "mark"]);
    expect(notes[0].label).toBe("Bone spool in a stretched lobe");
    expect(notes[3].label).toBe("Lines across both cheeks, cut into the skin");
  });
  it("describes a worn pair of earrings the recipe never styled", () => {
    const notes = describeAdornment(
      base({
        adornment: undefined,
        wearing: { ...base().wearing, earrings: true },
      }),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0].label).toBe("Gold drop earring");
  });
  it("has a phrase for every shape the painter can draw", () => {
    for (const ears of earOrnaments)
      expect(
        describeAdornment(base({ adornment: { ears } })).length,
      ).toBe(ears === "none" ? 0 : 1);
    for (const marks of faceMarks) {
      const notes = describeAdornment(base({ adornment: { marks } }));
      expect(notes.length).toBe(marks === "none" ? 0 : 1);
      if (marks !== "none") expect(notes[0].label).not.toMatch(/undefined/);
    }
  });
});
