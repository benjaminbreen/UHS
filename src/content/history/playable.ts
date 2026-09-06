import { packTemplates } from "../legacy-packs";
import type { Pack } from "../../core/types";
import { historyRegistry, resolveHistory } from "./index";

/** Adapter only: the historical framework supplies selected lists to unchanged
 * generator-v1 code. Do not attach new metadata to v1 snapshots or alter RNG order. */
export function resolvePlayablePacks(): Record<string, Pack> {
  return Object.fromEntries(
    (["roman", "neolithic"] as const).map((id) => {
      const template = packTemplates[id];
      const place = historyRegistry.places.find(
        (p) => p.id === (id === "roman" ? "tiber" : "konya"),
      )!;
      const result = resolveHistory(historyRegistry, {
        place: place.id,
        culture: place.culture,
        date: { year: template.year },
      });
      const included = result.entries.filter((e) => e.status === "included");
      const ids = (category: string) =>
        included
          .filter((e) => e.definition.category === category)
          .map((e) => e.definition.runtimeId!);
      const availableItems = new Set(ids("item"));
      for (const item of [
        ...Object.keys(template.startInventory),
        ...template.commodities,
        template.trade.give,
        template.trade.take,
      ]) {
        if (!availableItems.has(item))
          throw Error(`Historical selection excludes required v1 item ${item}`);
      }
      const pack: Pack = {
        ...template,
        buildings: ids("building"),
        roles: ids("occupation"),
        species: ids("animal") as Pack["species"],
        trees: ids("plant"),
        playerSprite: ids("appearance")[0],
      };
      if (!pack.buildings.length || !pack.roles.length || !pack.playerSprite)
        throw Error("Incomplete playable historical profile");
      return [id, pack];
    }),
  );
}
