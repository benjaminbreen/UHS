import { createSettingSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
const started = performance.now();
const e = createSettingSession(
  {
    ...settingFor(places.find((p) => p.id === "konya")!, -6499),
    terrainRevision: 1,
  },
  "anatolia-relief-1",
);
console.log("generation ms", Math.round(performance.now() - started));
for (const p of e.world.places)
  console.log(
    p.id,
    p.entrance,
    e.world.topography!(p.entrance.x, p.entrance.y).height,
    e.findRoute(e.state.player.pos, p.entrance).status,
  );
for (let y = -50; y < 50; y++)
  for (let x = -50; x < 70; x++) {
    const c = e.world.topography!(x, y);
    if (c.ramp) console.log("slope", x, y, c.ramp, c.height);
  }
