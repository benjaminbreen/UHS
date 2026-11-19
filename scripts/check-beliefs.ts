/** Coverage of the belief scopes against the places the app can actually
 * generate. `npx tsx scripts/check-beliefs.ts [culture-id]` */
import { beliefsForActor, beliefOptions, beliefsFor } from "../src/content/beliefs/index";
import { places } from "../src/content/geography/places";

import { settingFor, resolveSetting } from "../src/content/geography/resolve";
import { communityFor, populationFor } from "../src/content/characters/resolve";
import { religiousProfile, sanctuaryAt } from "../src/content/settlements/religious";
import { interiorProfileFor } from "../src/content/interiors/select";
import { createSettingSession } from "../src/runtime/session";
import { officeAtSanctuary, officiantsFor } from "../src/content/characters/officiant";


/** Geographic remits, one per regional data file. Place `culture` tags are not
 * reliable enough to bucket a coverage gap by. */
const regions: [id: string, box: [number, number, number, number]][] = [
  ["european", [-25, 35, 45, 72]],
  ["west-asia", [-18, 12, 63, 45]],
  ["inner-eurasia", [25, 38, 180, 78]],
  ["south-asia", [60, 5, 92, 37]],
  ["east-asia", [95, 18, 150, 55]],
  ["southeast-asia", [92, -11, 142, 25]],
  ["west-central-africa", [-18, -10, 32, 20]],
  ["east-southern-africa", [10, -36, 52, 18]],
  ["mesoamerica", [-107, 12, -82, 25]],
  ["andes", [-82, -40, -60, 13]],
  ["indigenous-americas", [-170, -56, -35, 83]],
  ["australia-pacific", [110, -50, 180, 25]],
  ["australia-pacific", [-180, -30, -130, 30]],
];
const regionOf = (lon: number, lat: number) =>
  regions.find(
    ([, b]) => lon >= b[0] && lat >= b[1] && lon <= b[2] && lat <= b[3],
  )?.[0] ?? "unassigned";
const only = process.argv[2];
const years = [-8000, -3000, -1200, -400, 200, 800, 1200, 1500, 1750, 1900, 2020];
const byCulture = new Map<
  string,
  { miss: Map<number, string[]>; n: number; hit: number }
>();
let placed = 0, matched = 0, office = 0, communities = 0, distinct = 0;
const gaps = new Map<string,number>();
for (const p of places) {
  const region = regionOf(p.lon, p.lat);
  if (only && region !== only) continue;
  const e = byCulture.get(region) ?? { miss: new Map(), n: 0, hit: 0 };
  byCulture.set(region, e);
  for (const year of years) {
    e.n++;
    const s = settingFor(p,year), site = religiousProfile(s);
    const groups = populationFor(s)?.groups.map(g => g.community) ?? [communityFor(s)];
    const members = groups.flatMap(g => beliefOptions(s,g).map(o => o.system));
    const ok = members.every(b => b.id !== "unscoped");
    if (groups.length > 1) {
      communities++;
      if (new Set(groups.map(g => beliefsFor(s,g).id)).size > 1) distinct++;
    }
    if (site) {
      placed++;
      const compatible = members.filter(b => b.worship?.includes(site.faith));
      if (compatible.length) matched++;
      else {
        const pair = site.faith+" / "+members.map(b => b.id).join(", ");
        gaps.set(pair,(gaps.get(pair) ?? 0)+1);
      }
      if (compatible.some(b => officiantsFor(s,b,site).some(o => officeAtSanctuary(s,o.label,b,site)))) office++;
    }
    if (ok) e.hit++;
    else {
      const list = e.miss.get(year) ?? [];
      if (list.length < 8)
        list.push(`${p.name} (${p.lon.toFixed(0)},${p.lat.toFixed(0)})`);
      e.miss.set(year, list);
    }
  }
}
let n = 0,
  hit = 0;
for (const [region, e] of [...byCulture].sort()) {
  n += e.n;
  hit += e.hit;
  console.log(
    `\n### ${region}: ${Math.round((100 * e.hit) / e.n)}% covered (${e.n - e.hit} misses of ${e.n})`,
  );
  for (const year of years) {
    const list = e.miss.get(year);
    if (list?.length) console.log(`  ${year}: ${list.join(", ")}`);
  }
}
console.log(`\ntotal ${Math.round((100 * hit) / n)}% of ${n} place-years`);

console.log({sitePlaceYears:placed, withCompatibleResidentProfile:matched, withoutCompatibleResidentProfile:placed-matched, withEligibleOffice:office, pluralPlaceYears:communities, withDistinctCommunityProfiles:distinct});

console.log("Most frequent unmatched sanctuary / resident profiles", [...gaps].sort((a,b) => b[1]-a[1]).slice(0,8));

let atlas = 0, scoped = 0, sites = 0, readings = 0, shared = 0, plural = 0;
for (const place of places) {
  if (only && regionOf(place.lon,place.lat) !== only) continue;
  const s = settingFor(place);
  const groups = populationFor(s)?.groups.map(g => g.community) ?? [communityFor(s)];
  const profiles = new Set(groups.map(g => beliefsFor(s,g).id));
  atlas++;
  if (!profiles.has("unscoped")) scoped++;
  if (groups.length > 1) { plural++; if (profiles.size === 1) shared++; }
  const site = religiousProfile(s);
  if (!site) continue;
  sites++;
  const schools = site.schools?.filter(b => s.year >= b.from && s.year < b.to).map(b => b.id);
  if ((schools?.length ? schools : [undefined]).some(worshipSchool => {
    const rite = interiorProfileFor({...s,use:"religious."+site.id,worshipSchool}).observance;
    return [rite?.service,rite?.gathering,rite?.visit].some(a => a?.passage);
  })) readings++;
}
console.log({atlas, scoped, sites, readings, pluralPopulations:plural, allGroupsShareProfile:shared});

if (!only) for (const [prompt,seed] of [
  ["A rabbi in Thessaloniki, 1700","faith-audit"],
  ["An imam in Istanbul, 1700","faith-audit"],
  ["A weaver in Paris, 1350","faith-audit"],
  ["An imam in London, 2020","faith-audit"],
  ["A monk in Kyoto, 1350","faith-audit"],
  ["A Pure Land monk in Kyoto, 1350","temple-audit-2"],
  ["A hunter in Sydney, 1750","faith-audit"],
]) {
  const start = resolveSetting(prompt,seed);
  if ("error" in start) throw Error(start.error);
  const e = createSettingSession(start.setting,seed), s = e.world.pack.setting!;
  const people = [e.state.player,...e.state.actors.filter(a => a.kind === "human")];
  const profiles = new Map<string,number>(), workplaces = [];
  for (const a of people) {
    const b = beliefsForActor(s,a);
    profiles.set(b.id,(profiles.get(b.id) ?? 0)+1);
    const job = e.world.activitySites?.(a.id)?.employment;
    if (job?.kind === "worship") {
      const place = e.world.place(job.id);
      if (!officeAtSanctuary(s,a.role,b,sanctuaryAt(place),place?.worshipSchool))
        throw Error(`${prompt}: ${a.name}, ${a.role} (${b.id}) assigned to ${job.label}`);
      workplaces.push([a.role,b.id,job.label]);
    }
  }
  const sanctuaries = e.world.places.filter(p => sanctuaryAt(p));
  const buildings = sanctuaries.map(p => {
    const rite = e.interiorOf(p.id)?.observance;
    return [p.name,p.claim,rite?.service?.passage?.title ?? rite?.gathering.passage?.title];
  });
  const withoutSite = [...new Set(people.map(a => beliefsForActor(s,a)).filter(b => b.worship?.length &&
    !sanctuaries.some(p => b.worship!.includes(p.worshipSchool ?? sanctuaryAt(p)!.faith))).map(b => b.label))];
  console.log(JSON.stringify({prompt,seed,withoutSite,player:[e.state.player.role,e.state.player.origin?.belief],people:people.length,profiles:Object.fromEntries(profiles),buildings,workplaces}));
}
