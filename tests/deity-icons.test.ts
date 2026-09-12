import { describe, expect, it } from "vitest";
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
  });

  it("leaves unnamed and unsupported powers to the glyph fallback", () => {
    expect(deityIconFor("The hearth fire")).toBeUndefined();
  });
});
