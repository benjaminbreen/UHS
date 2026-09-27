import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";
import { generalLore } from "./general";
import { europeLore } from "./europe";
import { africaLore } from "./africa";
import { southAsiaLore } from "./south-asia";
import { southeastAsiaPacificLore } from "./southeast-asia-pacific";
import { innerEurasiaLore } from "./inner-eurasia";
import { americasLore } from "./americas";
import { westAsiaNorthAfricaLore } from "./west-asia-north-africa";
import { eastAsiaLore } from "./east-asia";
import { africaFillLore } from "./africa-fill";
import { innerEurasiaFillLore } from "./inner-eurasia-fill";
import { americasFillLore } from "./americas-fill";
import { southeastAsiaPacificFillLore } from "./southeast-asia-pacific-fill";
import { europeFillLore } from "./europe-fill";
import { westAsiaNorthAfricaFillLore } from "./west-asia-north-africa-fill";
import { southAsiaFillLore } from "./south-asia-fill";
import { eastAsiaFillLore } from "./east-asia-fill";
import type { LoreTopic, TaskLore } from "./types";

export const taskLore: readonly TaskLore[] = [
  ...generalLore,
  ...europeLore,
  ...africaLore,
  ...southAsiaLore,
  ...southeastAsiaPacificLore,
  ...innerEurasiaLore,
  ...americasLore,
  ...westAsiaNorthAfricaLore,
  ...eastAsiaLore,
  ...africaFillLore,
  ...innerEurasiaFillLore,
  ...americasFillLore,
  ...southeastAsiaPacificFillLore,
  ...europeFillLore,
  ...westAsiaNorthAfricaFillLore,
  ...southAsiaFillLore,
  ...eastAsiaFillLore,
];

const TOPIC_RANK = { occasion: 5, goal: 4, aim: 4, trade: 3, workplace: 2, scene: 1 };
const kindOf = (t: LoreTopic) => Object.keys(t)[0] as keyof typeof TOPIC_RANK;
/** How particular a scope is: a named culture in a small box over a short span beats a continent over ten thousand years. */
function narrowness(e: TaskLore) {
  const s = e.scope;
  const span = s.years[1] - s.years[0];
  const area = s.bounds ? (s.bounds[2] - s.bounds[0]) * (s.bounds[3] - s.bounds[1]) : 64800;
  return (s.places ? 4 : 0) + (s.cultures ? 1 : 0) + (area < 200 ? 3 : area < 2000 ? 2 : area < 20000 ? 1 : 0) + (span < 500 ? 3 : span < 2000 ? 2 : span < 10000 ? 1 : 0);
}
function matches(topic: LoreTopic, asked: LoreTopic, work: string) {
  if ("trade" in topic) return "trade" in asked && topic.trade.test(work);
  const k = kindOf(topic);
  return k === kindOf(asked) && (topic as Record<string, unknown>)[k] === (asked as Record<string, unknown>)[k];
}

/**
 * The lore for a task, most particular first: up to `n` entries, each about a
 * different side of it (the occasion, then the trade, then the place of work).
 */
export function loreFor(setting: WorldSetting | undefined, community: string | undefined, asked: LoreTopic[], work: string, n = 2) {
  if (!setting) return [];
  const scored = taskLore.flatMap((e) => {
    // The atlas tags some places with a neighbour's culture (Bali as South
    // Asian, Istanbul as European), so within its bounds an entry still
    // applies, ranked below one whose culture matches too.
    const own = matchesCharacterScope(e.scope, setting, community ?? "*");
    if (!own && !(e.scope.bounds && e.scope.cultures && matchesCharacterScope({ ...e.scope, cultures: undefined }, setting, community ?? "*")))
      return [];
    // An entry about particular trades speaks for those trades only, not for
    // everyone who shares their workplace.
    const trades = e.topics.filter((t) => "trade" in t);
    const ofTrade = !trades.length || trades.some((t) => asked.some((a) => matches(t, a, work)));
    const hits = e.topics.filter(
      (t) => (ofTrade || "occasion" in t || "aim" in t || ("goal" in t && t.goal !== "day-of-work")) && asked.some((a) => matches(t, a, work)),
    );
    if (!hits.length) return [];
    const best = Math.max(...hits.map((t) => TOPIC_RANK[kindOf(t)]));
    // Anything written for a region outranks the worldwide fallbacks, whatever it is about.
    const regional = !e.id.startsWith("lore.general.");
    return [{ e, regional, kind: kindOf(hits.find((t) => TOPIC_RANK[kindOf(t)] === best)!), score: (regional ? (own ? 1000 : 500) : 0) + best * 20 + narrowness(e) }];
  });
  scored.sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id));
  const out: TaskLore[] = [];
  const kinds = new Set<string>();
  for (const s of scored) {
    if (out.length >= n) break;
    // A fallback only speaks when nothing regional does, and a bare scene match is too loose to add.
    if (out.length && (!s.regional || s.kind === "scene")) continue;
    if (kinds.has(s.kind)) continue;
    kinds.add(s.kind);
    out.push(s.e);
  }
  return out;
}
export type { LoreTopic, TaskLore };
