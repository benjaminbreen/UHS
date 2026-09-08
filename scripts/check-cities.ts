/** Small deterministic planner benchmark; browser checks exercise actual terrain. */
import { resolveSetting } from "../src/content/geography/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { settlementProfile } from "../src/content/settlements/profiles";
import { planSettlement } from "../src/world/v3/plan";
import { route } from "../src/core/routing";
const result = resolveSetting("Rome 100 BCE");
if ("error" in result) throw Error(result.error);
const setting = integratedSetting(result.setting);
for (const seed of ["city-review", "rome", "blocks"]) {
  const start = performance.now();
  const plan = planSettlement(
    {
      id: "city",
      cx: 0,
      cy: 0,
      home: true,
      center: { x: 0, y: 0 },
      profile: settlementProfile(setting),
    },
    packForSetting(setting),
    seed,
    () => ({
      elevation: 0,
      moisture: 0.5,
      water: 100,
      kind: "river",
      snow: false,
    }),
    [],
  );
  const elapsed = performance.now() - start;
  const destinations = [
    ...plan.places.map((p) => p.entrance),
    ...plan.work.values(),
  ].map((p) => ("work" in p ? p.work : p));
  const unreachable = destinations.filter(
    (goal) =>
      route(plan.spawn, goal, (p) =>
        Math.abs(p.x) > 90 ||
        Math.abs(p.y) > 90 ||
        plan.solid.has(`${p.x},${p.y}`)
          ? Infinity
          : 1,
      ).status !== "found",
  ).length;
  console.log({
    seed,
    ms: Math.round(elapsed),
    buildings: plan.places.length,
    roads: plan.roads.length,
    squares: plan.plots.filter((p) => p.id.includes("-square-")).length,
    unreachable,
    diagnostics: plan.diagnostics,
  });
}
