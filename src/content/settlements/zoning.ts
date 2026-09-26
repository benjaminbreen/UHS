import type { WorldSetting } from "../geography/types";
import { modernity, type Modernity } from "./modernity";

/** What a block of an industrial-age city is for. Older towns keep the
 * market/craft/elite quarters; these replace them once a region industrialises. */
export type LandUse =
  | "downtown"
  | "commercial"
  | "industrial"
  | "rowhouse"
  | "tenement"
  | "suburb"
  | "estate"
  | "informal";

/** How a region's cities grew outward once industry arrived. Each ring of
 * growth is built in the idiom of its own date: the housing laid out before
 * mass motoring is `inner`, after it `outer`, and from `estates` on some outer
 * blocks are towers standing in open ground. */
export type Zoning = {
  /** Years after the industrial onset before the centre is rebuilt as offices. */
  downtownAfter: number;
  /** Share of the ring beyond the old centre given to factories and yards. */
  industry: number;
  inner: LandUse;
  outer: LandUse;
  /** From this year, a share of new outer blocks are built as estates. */
  estates?: { from: number; share: number };
  /** From this year, a share of the edge is self-built. */
  informal?: { from: number; share: number };
  note: string;
};

const zonings: Record<string, Zoning> = {
  britain: {
    downtownAfter: 60,
    industry: 0.2,
    inner: "rowhouse",
    outer: "suburb",
    estates: { from: 1950, share: 0.3 },
    note: "By-law terraces round the mills, then interwar semis and postwar council estates.",
  },
  "north-america": {
    downtownAfter: 40,
    industry: 0.18,
    inner: "rowhouse",
    outer: "suburb",
    estates: { from: 1950, share: 0.06 },
    note: "Rowhouses and triple-deckers near the rail yards, a downtown of office buildings by 1900, then detached suburbs; public housing towers are rare.",
  },
  "western-europe": {
    downtownAfter: 70,
    industry: 0.16,
    inner: "tenement",
    outer: "suburb",
    estates: { from: 1955, share: 0.45 },
    note: "Five- and six-storey rental blocks in the nineteenth-century rings, grands ensembles and Siedlungen after the war, with detached houses beyond.",
  },
  "eastern-europe": {
    downtownAfter: 80,
    industry: 0.24,
    inner: "tenement",
    outer: "estate",
    estates: { from: 1958, share: 0.85 },
    note: "Tenement rings, then the prefabricated microdistricts of the Khrushchev programme from 1957 on.",
  },
  japan: {
    downtownAfter: 50,
    industry: 0.2,
    inner: "rowhouse",
    outer: "suburb",
    estates: { from: 1955, share: 0.3 },
    note: "Nagaya row houses, then danchi estates and small detached houses packed on narrow lots.",
  },
  "east-asia": {
    downtownAfter: 70,
    industry: 0.22,
    inner: "rowhouse",
    outer: "estate",
    estates: { from: 1955, share: 0.8 },
    note: "Lane houses in the treaty ports, then work-unit compounds and, after 1990, tower estates.",
  },
  "south-asia": {
    downtownAfter: 70,
    industry: 0.16,
    inner: "tenement",
    outer: "estate",
    estates: { from: 1970, share: 0.3 },
    informal: { from: 1950, share: 0.35 },
    note: "Chawls near the mills, colonial civil lines and postwar housing colonies, and self-built settlements on the edge.",
  },
  "latin-america": {
    downtownAfter: 50,
    industry: 0.16,
    inner: "rowhouse",
    outer: "suburb",
    estates: { from: 1960, share: 0.2 },
    informal: { from: 1945, share: 0.4 },
    note: "Single-storey courtyard rows on the grid, conjuntos habitacionales after the war and self-built barrios on the periphery.",
  },
  "west-asia-north-africa": {
    downtownAfter: 40,
    industry: 0.12,
    inner: "tenement",
    outer: "estate",
    estates: { from: 1960, share: 0.4 },
    informal: { from: 1960, share: 0.25 },
    note: "A planned new town of apartment blocks beside the old city, and informal quarters beyond it.",
  },
  "sub-saharan-africa": {
    downtownAfter: 30,
    industry: 0.1,
    inner: "rowhouse",
    outer: "suburb",
    estates: { from: 1955, share: 0.15 },
    informal: { from: 1950, share: 0.5 },
    note: "A colonial grid of offices and bungalows, planned townships, and self-built settlement that outgrows both.",
  },
  "southern-africa": {
    downtownAfter: 30,
    industry: 0.2,
    inner: "rowhouse",
    outer: "suburb",
    estates: { from: 1950, share: 0.3 },
    informal: { from: 1980, share: 0.3 },
    note: "A mining-town grid with a downtown of towers, detached suburbs and planned townships.",
  },
  "southeast-asia": {
    downtownAfter: 50,
    industry: 0.14,
    inner: "rowhouse",
    outer: "estate",
    estates: { from: 1965, share: 0.4 },
    informal: { from: 1950, share: 0.35 },
    note: "Shophouse rows, then public housing blocks and kampung on the edge.",
  },
  australasia: {
    downtownAfter: 40,
    industry: 0.14,
    inner: "rowhouse",
    outer: "suburb",
    note: "Terraces in the inner ring, then the quarter-acre detached suburb.",
  },
};

const generic: Zoning = {
  downtownAfter: 50,
  industry: 0.14,
  inner: "rowhouse",
  outer: "estate",
  estates: { from: 1960, share: 0.3 },
  informal: { from: 1960, share: 0.25 },
  note: "No regional entry: a generic industrial-age city.",
};

export function zoningFor(
  s: Pick<WorldSetting, "lon" | "lat">,
): Zoning & { modernity: Modernity } {
  const m = modernity(s);
  return { ...(zonings[m.id] ?? generic), modernity: m };
}
