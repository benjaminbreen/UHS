import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { beliefSystems } from "../src/content/beliefs";
import { deityIconFor } from "../src/content/beliefs/deity-icons";

describe("named deity icons", () => {
  it("resolves canonical names and historical aliases", () => {
    expect(deityIconFor("Osiris")).toBe("/beliefs/deities/v1/icons/osiris.png");
    expect(deityIconFor("Ishtar")).toBe(
      "/beliefs/deities/v1/icons/inanna-ishtar.png",
    );
    expect(deityIconFor("Kannon")).toBe(
      "/beliefs/deities/v1/icons/guanyin.png",
    );
    expect(deityIconFor("The Jade Emperor")).toBe(
      "/beliefs/deities/v1/icons/jade-emperor.png",
    );
  });

  it("leaves unnamed and unsupported powers to the glyph fallback", () => {
    expect(deityIconFor("The hearth fire")).toBeUndefined();
  });

  it("backs every scoped portrait with a shipped icon", () => {
    for (const power of beliefSystems.flatMap((system) => system.powers)) {
      const icon = deityIconFor(power.name);
      if (!icon) continue;
      expect(
        existsSync(new URL(`../public${icon}`, import.meta.url)),
        power.name,
      ).toBe(true);
    }
  });
});
