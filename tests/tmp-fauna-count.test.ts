import { describe, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { faunaAt } from "../src/content/fauna";
import { spawnFauna } from "../src/world/v3/fauna";
import type { WorldModel } from "../src/core/types";
import type { TopographyCell } from "../src/core/topography";

const at = (id: string, year: number) =>
  settingFor(places.find((p) => p.id === id)!, year);
function cell(h: number, extra: Partial<TopographyCell> = {}): TopographyCell {
  return { height: h, ...extra } as TopographyCell;
}
describe("count", () => {
  it("counts", () => {
    for (const [place, year] of [["konya", -6499], ["london", 1400], ["rome", 100]] as const) {
      const p = places.find((q) => q.id === place);
      if (!p) { console.log(place, "missing"); continue; }
      const setting = at(place, year);
      const world = {
        pack: { setting },
        settlements: [{ id: "s", name: "s", x: 200, y: 200, size: 20 }],
        blocked: () => false,
        terrain: () => "grass",
        topography: (x: number) =>
          cell(1, {
            habitat: { kind: x % 64 < 32 ? "woodland" : "open", ecology: "grassland", wet: 0.2, cover: 0.5, exposed: 0, season: "summer" },
          } as never),
      } as unknown as WorldModel;
      const groups = spawnFauna(world, "seed", 200, 200); // centred on the town
      const byId: Record<string, number> = {};
      let members = 0;
      for (const g of groups) { byId[g.speciesId] = (byId[g.speciesId] ?? 0) + 1; members += g.members.length; }
      console.log(place, year, "| available:", faunaAt(setting).map((f) => f.id).join(","));
      console.log("   groups/9blocks:", JSON.stringify(byId), "members:", members, "→ per 64x64 block:", (members / 9).toFixed(1));
    }
  });
});
