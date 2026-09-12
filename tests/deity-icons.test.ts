import { readdirSync } from "node:fs";
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

  it("keeps every shipped portrait connected to a scoped power", () => {
    const files = readdirSync(
      new URL("../public/beliefs/deities/v1/icons", import.meta.url),
    ).filter((file) => file.endsWith(".png"));
    const used = new Set(
      beliefSystems
        .flatMap((system) => system.powers)
        .map((power) => deityIconFor(power.name)?.split("/").at(-1))
        .filter((file): file is string => Boolean(file)),
    );

    expect(files.filter((file) => !used.has(file))).toEqual([]);
  });
});
