/** Prints the fabric each profiled place and date resolves to, with the block
 * partition it produces. Terrain is not involved; this is the grammar alone. */
import { resolveSetting } from "../src/content/geography/resolve";
import { urbanForm } from "../src/content/settlements/urban-form";
import { urbanCapacity } from "../src/content/settlements/scale";
import { composeUrban } from "../src/world/v3/blocks";

const places = [
  "Rome 100 BCE",
  "Beijing 1450",
  "Kyoto 1200",
  "Delhi 1400",
  "Baghdad 900",
  "Tenochtitlan 1500",
  "Samarkand 1400",
  "Cusco 1450",
  "Kano 1500",
];
for (const query of places) {
  const result = resolveSetting(query);
  if ("error" in result) {
    console.log(query.padEnd(20), "unresolved");
    continue;
  }
  const setting = result.setting,
    form = urbanForm(setting);
  const start = performance.now();
  const layout = composeUrban(query, { x: 0, y: 0 }, 96, form, "check");
  const areas = layout.blocks.map((b) => b.w * b.h).sort((a, b) => a - b);
  console.log(
    query.padEnd(20),
    form.id.padEnd(28),
    form.plan.padEnd(11),
    "blocks",
    String(layout.blocks.length).padStart(3),
    "median",
    String(areas[areas.length >> 1]).padStart(4),
    "streets",
    String(layout.streets.length).padStart(3),
    "courts",
    String(layout.blocks.filter((b) => b.court).length).padStart(3),
    "alleys",
    String(layout.blocks.filter((b) => b.lane).length).padStart(2),
    "capacity",
    String(urbanCapacity(96, form)).padStart(3),
    `${(performance.now() - start).toFixed(2)}ms`,
  );
}
