import { PLOTS } from "../content/plots";
import { matchesCharacterScope } from "../content/characters/resolve";
import { random } from "./random";
import { orderKeeper } from "../content/history/order";
import type { Condition, Effect, PlotContext } from "../content/plots/types";
import type { Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";
import type { Intro } from "./intro";

export type PlotState = {
  id: string;
  title: string;
  /** Which of the template's wordings, chosen by scope at the start. */
  wording: number;
  words: Record<string, string>;
  /** Which words name someone: `creditor` to the creditor's id. */
  refs?: Record<string, string>;
  cast: Record<string, string>;
  began: number;
  deadline: number;
  owed?: number;
  /** What was owed at the start, for the tally on the slate. */
  total?: number;
  seized?: number;
  fired: string[];
  ended?: string;
  /** The life aim the plot displaced, given back when it ends. */
  aim?: Snapshot["lifeAim"];
};

/** What the card component shows; the engine queues these and never saves them. */
export type PlotCard = {
  kind: "title" | "turn" | "speech" | "ending";
  title: string;
  text: string;
  /** The opening paragraphs, for the title card. */
  intro?: Intro;
  aim?: string;
  /** Who the camera finds while the card is up. */
  focus?: string;
  /** Who says it, for a speech. */
  speaker?: string;
  /** Which ending, so the emblem can show how it came out. */
  ending?: string;
  /** A work card waiting for one of these; `odds` is shown on hover. */
  choose?: { card: string; choices: { index: number; label: string; note?: string; odds?: number; minutes?: number; coin?: number; unavailable?: string }[] };
};

export const plotTemplate = (plot: PlotState) => PLOTS.find((t) => t.id === plot.id);

const templateOf = (plot: PlotState) => PLOTS.find((t) => t.id === plot.id);

export function plotLine(plot: PlotState, key: string) {
  const line = templateOf(plot)?.wording[plot.wording]?.lines[key] ?? "";
  return line.replace(/\{(\w+)\}/g, (_, w) => plot.words[w] ?? "");
}

const RECENT = "uhs.recent-plots";
/** How much a plot from one, two, three or four lives ago is held back. */
const REPEAT = [0.15, 0.35, 0.6, 0.8];

/** Plots of the last few lives in this browser, newest first. Outside a
 * browser there are none, so seeded runs and tests choose the same way. */
function recentPlots(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const ids = JSON.parse(window.localStorage.getItem(RECENT) ?? "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function remember(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT, JSON.stringify([id, ...recentPlots().filter((x) => x !== id)].slice(0, REPEAT.length)));
  } catch { /* storage blocked: every life draws fresh */ }
}

/** The game's choice for this life, or undefined when no plot fits. */
export function startPlot(snapshot: Snapshot, setting?: WorldSetting): PlotState | undefined {
  if (snapshot.plot) return snapshot.plot;
  const seed = snapshot.manifest.seed;
  const households = snapshot.households ?? [];
  const context: PlotContext = {
    seed,
    setting,
    clock: snapshot.clock,
    player: snapshot.player,
    actors: snapshot.actors,
    households,
    household: households.find((h) => h.members.includes(snapshot.player.id)),
  };
  const recent = recentPlots();
  const chosen = PLOTS
    .map((t) => ({ t, score: t.weight(context) * (0.5 + random(seed, "plot", t.id, snapshot.player.id)) * (REPEAT[recent.indexOf(t.id)] ?? 1) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id))[0]?.t;
  const cast = chosen?.cast(context);
  if (!chosen || !cast) return;
  const begun = chosen.begin(context, cast);
  const community = snapshot.player.origin?.community ?? "*";
  const wording = Math.max(0, chosen.wording.findIndex((w) =>
    !w.scope || (!!setting && matchesCharacterScope(w.scope, setting, community))));
  const plot: PlotState = {
    id: chosen.id,
    title: chosen.wording[wording].title,
    wording,
    words: { ...begun.words, authority: orderKeeper(setting).who, Authority: orderKeeper(setting).who.replace(/^./, (c) => c.toUpperCase()) },
    refs: begun.refs,
    cast: Object.fromEntries(Object.entries(cast).map(([role, a]) => [role, a!.id])),
    began: snapshot.clock,
    deadline: begun.deadline,
    owed: begun.owed,
    total: begun.owed,
    fired: [],
    aim: snapshot.lifeAim,
  };
  snapshot.plot = plot;
  remember(plot.id);
  snapshot.lifeAim = {
    id: `plot:${plot.id}`,
    text: plotLine(plot, "aim"),
    subjects: Object.values(plot.cast),
    revision: 1,
  };
  return plot;
}

function holds(c: Condition, plot: PlotState, snapshot: Snapshot): boolean {
  switch (c.type) {
    case "since": return snapshot.clock >= plot.began + c.hours * 3600;
    case "due": return snapshot.clock >= plot.deadline + (c.hours ?? 0) * 3600;
    case "settled": return (plot.owed ?? 0) <= 0;
    case "seized": return (plot.seized ?? 0) > 0;
    case "gone": return !snapshot.actors.some((a) => a.id === plot.cast[c.role] && !a.dead);
    case "fired": return plot.fired.includes(c.id);
    case "talked": return plot.fired.includes(`talked:${c.role}`);
    case "not": return !holds(c.of, plot, snapshot);
    case "all": return c.of.every((x) => holds(x, plot, snapshot));
  }
}

/** What the plot does now: the opening on the first call, then the first
 * development whose condition has come true. One a step, so each sees what
 * the last one did to the deadline and the debt. The engine applies the effects. */
export function stepPlot(snapshot: Snapshot): Effect[] {
  const plot = snapshot.plot;
  const template = plot && !plot.ended ? templateOf(plot) : undefined;
  if (!plot || !template) return [];
  const effects: Effect[] = [];
  if (!plot.fired.includes("opening")) {
    plot.fired.push("opening");
    effects.push(...template.opening);
  }
  for (const d of template.developments) {
    if (plot.fired.includes(d.id) || !holds(d.when, plot, snapshot)) continue;
    plot.fired.push(d.id);
    effects.push(...d.then);
    break;
  }
  return effects;
}

/** Called after the effects have landed, so an ending sees what they did. */
export function endPlot(snapshot: Snapshot) {
  const plot = snapshot.plot;
  const template = plot && templateOf(plot);
  if (!plot || plot.ended || !template) return;
  const ending = template.endings.find((e) => holds(e.when, plot, snapshot));
  if (!ending) return;
  plot.ended = ending.id;
  if (plot.id === "debt" && (plot.owed ?? 0) <= 0) {
    const h = snapshot.households?.find((h) => h.members.includes(snapshot.player.id));
    if (h?.credit?.seller === plot.cast.creditor) {
      delete h.credit;
      delete h.owes;
    }
  }
  snapshot.lifeAim = plot.aim;
  return ending;
}
