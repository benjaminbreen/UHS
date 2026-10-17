import { Engine } from "../src/core/engine";
import { items } from "../src/content/packs";
import { packForSetting } from "../src/content/geography/pack";
import { generateCharacter } from "../src/content/characters/generate";
import type { WorldSetting } from "../src/content/geography/types";
import { createWorld } from "../src/world/generate";

// Authored geometry keeps mechanic tests independent of regional generation.
export function smallSession(setting: WorldSetting, seed = "fixture") {
  const world = createWorld(packForSetting(setting), seed);
  world.generatorVersion = 3;
  world.initialActors = world.initialActors.filter((a) => a.kind === "human").slice(0, 6);
  world.households = [0, 1, 2].map((i) => {
    const place = world.places[i];
    const residents = world.initialActors.slice(i * 2, i * 2 + 2);
    const id = `household-${i}`;
    for (const a of residents) {
      Object.assign(a, generateCharacter(setting, seed, a.id, 34, a.role));
      a.age = 34;
      a.householdId = id;
      a.pos = { x: i * 8, y: 40, space: "outside" };
      a.home = { ...place.entrance, space: "outside" };
    }
    const storeId = `store-${i}`;
    world.initialObjects.push({ id: storeId, kind: "container", name: "Household store", sprite: "chest", prop: "chest", pos: { ...place.entrance, space: "outside" }, inventory: { bread: 12, water: 12 } });
    return { id, residence: place.id, members: [...(i === 0 ? ["player"] : []), ...residents.map((a) => a.id)], home: { ...place.entrance, space: "outside" as const }, storeId };
  });
  world.spawn = { ...world.households[0].home };
  const e = new Engine(world, items);
  e.initialize(seed);
  Object.assign(e.state.player, generateCharacter(setting, seed, "player", 34, setting.role));
  e.state.player.health = 100;
  return e;
}
