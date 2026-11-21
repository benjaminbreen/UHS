import { prisonFind, prisonStyle, type PrisonSentence, type PrisonStyle } from "../content/prisons";
import { exitAt, N4 } from "../world/complex";
import { parsePrisonSpace, prisonLevel, prisonSolid, prisonSpace, prisonWalkable } from "../world/prison";
import { areaTarget, arriveIn, cachedArea, complexRecord, takeFind, type ComplexHost } from "./complex";
import { sewerEnterFrom } from "./sewer";
import { folkDeal, folkTime } from "./tunnel-folk";
import type { DailyGoal } from "../content/goals/types";
import type { Actor, Inspection, Inventory, Point } from "./types";

const AUTHORITY_RE = /\b(guard|watchman|warder|turnkey|bailiff|constable|soldier|sentry|sheriff|magistrate|judge|noble|lord|lady|duke|duchess|earl|baron|count|king|queen|emperor|empress|prince|princess|sultan|vizier|governor|mandarin|daimyo|samurai|senator|prefect|archon|pharaoh|captain|officer|yeoman|halberdier)\b/i;
const THREAT_RE = /\b(kill you|murder|stab you|slit your|burn the palace|burn it down|treason|usurp|overthrow|down with the (king|queen|emperor|lord|magistrate)|hang the (king|queen|emperor|lord)|i('ll| will) kill|die tyrant|off with (his|her|your) head)\b/i;
// Name-calling counts only when aimed at the listener: "I lost my dog" is not an insult.
const INSULT_RE = new RegExp(
  String.raw`\b(shut up|go to hell|damn you|screw you|fuck|asshole)\b|\byou(?:'re| are)?\s+(?:(?:a|an|such a|filthy|dirty|stupid|lying|corrupt)\s+)*(?:corrupt|fool|idiot|pig|dog|bastard|coward|tyrant|scum|cur|knave|filth|wretch|vermin|thief|liar)\b|^\W*(?:fool|idiot|pig|dog|bastard|coward|tyrant|scum|cur|knave|filth|wretch|vermin|thief|liar)\W*$`,
  "i",
);

export const isAuthorityRole = (actor: Pick<Actor, "role" | "underground">) =>
  AUTHORITY_RE.test(`${actor.role ?? ""} ${actor.underground?.person ?? ""}`);

export function evaluateHostileSpeech(text: string, regard?: number): "none" | "insult" | "threat" {
  const s = text.trim();
  if (THREAT_RE.test(s)) return "threat";
  if (INSULT_RE.test(s) || (regard !== undefined && regard <= -2)) return "insult";
  return "none";
}

export type PrisonRun = {
  kind: "prison";
  site: string;
  style: string;
  name: string;
  entry: string;
  out: Point;
  sentence: PrisonSentence;
  /** Escape attempts caught: 1 = solitary/confiscate, 2 = corporal, 3 = execution. */
  caught: number;
  pry: number;
  grate: number;
  tallies: number;
  hasKey?: boolean;
  released?: boolean;
  workedDay?: number;
  alerted?: number;
  sneaked?: number;
  took?: { at: Point; items: Inventory; clock: number };
};

export const prisonRun = (h: ComplexHost) => (h.state.complex?.kind === "prison" ? h.state.complex : undefined);
const record = (h: ComplexHost, site: string) => complexRecord(h.state, `prison:${site}`);
const here = (h: ComplexHost) => (prisonRun(h) ? prisonLevelOf(h, h.state.player.pos.space) : undefined);

export function prisonLevelOf(h: ComplexHost, space: string) {
  const at = parsePrisonSpace(space), style = at && prisonStyle(at.style);
  if (!style) return undefined;
  return cachedArea(h, space, () => prisonLevel(h.state.manifest.seed, style, at.site), (level) => {
    const solid = prisonSolid(level), done = new Set(h.state.complexes?.[`prison:${at.site}`]?.done);
    for (const t of level.things) if (t.solid && done.has(t.id) && !prisonFind(style, t.find)?.keeps)
      for (let y = t.y; y < t.y + (t.h ?? 1); y++) for (let x = t.x; x < t.x + (t.w ?? 1); x++) solid.delete(y * level.w + x);
    return solid;
  });
}

export function prisonGround(h: ComplexHost, space: string, x: number, y: number) {
  const c = prisonLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return !prisonWalkable(level.cells[y * level.w + x]) || solid.has(y * level.w + x);
}

function arrive(h: ComplexHost, space: string, from?: string) {
  const level = prisonLevelOf(h, space)?.level;
  if (level) arriveIn(h, level, `prison:${level.prison}`, from);
  return level;
}

export function prisonEnter(
  h: ComplexHost,
  style: PrisonStyle,
  sentence: PrisonSentence,
  out?: Point,
  n: number | string = 0,
) {
  const p = h.state.player, site = `${style.id}.${n}`;
  const entry = prisonSpace(site);
  h.state.complex = {
    kind: "prison",
    site,
    style: style.id,
    name: style.name,
    entry,
    out: out ? { ...out } : { x: p.pos.x, y: p.pos.y },
    sentence: { ...sentence },
    caught: 0,
    pry: 0,
    grate: 0,
    tallies: 0,
  };
  if (!arrive(h, entry)) return void delete h.state.complex;
  p.direction = 2;
  h.event(`${style.enter} (${sentence.charge}.)`, "world");
}

/** Serve out a short fixed/debt sentence (<= 365 days) day-by-day and step out free. */
export function prisonServe(h: ComplexHost): boolean {
  const run = prisonRun(h);
  if (!run || run.sentence.kind === "life" || run.sentence.daysLeft > 365) return false;
  const days = Math.max(1, run.sentence.daysLeft);
  run.sentence.daysLeft = 0;
  run.released = true;
  h.state.clock = (Math.floor(h.state.clock / 86400) + days) * 86400 + 6 * 3600;
  leave(
    h,
    `You serve out your ${days === 1 ? "last day" : `${days} days`} behind bars. At dawn the turnkey unbolts the outer gate and turns you loose into the street.`,
    true,
    false,
  );
  return true;
}

/** Pass a night in confinement: ticks down fixed/debt sentences and unlocks the gate when served. */
export function prisonNight(h: ComplexHost) {
  const run = prisonRun(h);
  if (!run) return;
  if (run.sentence.kind !== "life" && run.sentence.daysLeft > 0) {
    run.sentence.daysLeft = Math.max(0, run.sentence.daysLeft - 1);
  }
  if (run.sentence.kind !== "life" && run.sentence.daysLeft === 0 && !run.released) {
    run.released = true;
    h.event("Dawn breaks. The turnkey calls your name and unbolts the outer gate—your sentence is served, and you are free to walk out!", "world");
    return;
  }
  const rem =
    run.sentence.kind === "life"
      ? "Another day inside."
      : `${run.sentence.daysLeft} ${run.sentence.daysLeft === 1 ? "day" : "days"} remaining.`;
  h.event(`You wake stiff on the prison pallet as pale light creeps through the high grate. ${rem}`);
}

/** Today's goals while confined: grounded prison routine, social contact, and ways out (replaces outdoor town chores). */
export function prisonDailyGoals(h: ComplexHost): DailyGoal[] {
  const run = prisonRun(h), c = here(h);
  if (!run || !c) return [];
  const today = Math.floor(h.state.clock / 86400);
  const style = prisonStyle(c.level.style)!;
  const bench = c.level.things.find((t) => t.id === "work-bench");
  const inmate = h.state.actors.find((a) => a.pos.space === c.level.space && !a.dead && /inmate|prisoner|veteran|debtor/i.test(`${a.role} ${a.underground?.person ?? ""}`));
  const talkedInmate = !!inmate && (h.state.goalFlags?.talkedTo?.includes(inmate.id) ?? false);
  const goals: DailyGoal[] = [
    {
      id: "prison.work",
      slot: "work",
      text: bench ? "Work a shift at the prison bench" : style.feePaying ? "Buy food or ale at the taproom" : "Take your daily rations",
      check: { type: "talk" },
      done: run.workedDay === today,
    },
    {
      id: "prison.social",
      slot: "own",
      text: inmate ? `Speak with ${inmate.name}` : "Speak with the turnkey",
      check: inmate ? { type: "talk-to", actor: inmate.id } : { type: "talk" },
      done: inmate ? talkedInmate : !!h.state.goalFlags?.talked,
    },
    {
      id: "prison.wayout",
      slot: "own",
      text: run.released
        ? "Walk out through the unbolted outer gate"
        : run.sentence.kind === "debt"
          ? "Settle your debt at the gatehouse ledger, or find another way out"
          : run.pry > 0
            ? `Finish working the cracked cell wall (${run.pry}/3)`
            : "Look for a way out: the cracked cell wall, the drain grate, or the gatehouse keys",
      check: { type: "talk" },
      done: false,
    },
  ];
  return goals;
}

function leave(h: ComplexHost, message: string, celebrate = true, escaped = false) {
  const run = prisonRun(h)!, p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...run.out, space: "outside" };
  p.direction = 2;
  if (escaped) h.state.fugitive = { since: h.state.clock, prison: run.name, charge: run.sentence.charge };
  else delete h.state.fugitive;
  delete h.state.complex;
  if (celebrate) h.cue?.("player", "celebrate");
  h.event(message, "world");
}

function nearestWarder(h: ComplexHost, space: string): Actor | undefined {
  const p = h.state.player.pos;
  return h.state.actors
    .filter((a) => a.pos.space === space && !a.dead && /warder|turnkey|guard/i.test(`${a.role} ${a.underground?.person ?? ""}`))
    .sort((a, b) => Math.hypot(a.pos.x - p.x, a.pos.y - p.y) - Math.hypot(b.pos.x - p.x, b.pos.y - p.y))[0];
}

function caughtEscaping(h: ComplexHost, run: PrisonRun, guard?: Actor) {
  const p = h.state.player;
  run.caught += 1;
  if (guard) {
    h.cue?.(guard.id, run.caught === 1 ? "fury" : "shove", p.pos);
    h.say?.(guard.id, run.caught === 1 ? "Hey! Drop that!" : run.caught === 2 ? "Enough of this!" : "Take them to the yard!");
  }
  h.cue?.("player", "struck", guard?.pos);
  if ((p.inventory.tool ?? 0) > 0) p.inventory.tool = (p.inventory.tool ?? 1) - 1;
  run.hasKey = false;
  const backToCell = () => {
    const c = here(h);
    if (c) p.pos = { ...c.level.entry, space: c.level.space };
    else arrive(h, prisonSpace(run.site));
  };
  if (run.caught === 1) {
    run.sentence.daysLeft += 3;
    h.advance(1800);
    backToCell();
    h.event("The turnkey storms up, confiscates your tool, and slams you back into your cell with three days added to your sentence.", "social");
    return;
  }
  if (run.caught === 2) {
    run.sentence.daysLeft += 14;
    h.hurt(28, "gaoler's cane", "bruised ribs");
    h.advance(3600);
    backToCell();
    h.event("The warders drag you back, beat you with a cane, and lock you in your cell. \"One more attempt and you'll swing for it.\"", "world");
    return;
  }
  h.hurt(999, "executed for attempted escape");
  h.event("Caught a third time trying to break out, the magistrate signs the warrant without delay.", "world");
}

const bailCost = (run: PrisonRun) => run.sentence.debtOwed ?? Math.max(8, Math.min(30, run.sentence.daysLeft));

export function prisonInspect(h: ComplexHost, id: string): Inspection | undefined {
  const c = here(h), run = prisonRun(h);
  if (!c || !run) return undefined;
  const { level } = c, style = prisonStyle(level.style)!;
  const thing = level.things.find((t) => `prison-thing:${t.id}` === id), f = thing && prisonFind(style, thing.find);
  if (!thing || !f) return undefined;
  const p = h.state.player;
  const act = (label: string, enabled = true, reason?: string) => ({
    label,
    enabled,
    reason,
    command: { type: "interact" as const, target: id, action: "complex" as const },
  });
  const pos = { x: thing.x, y: thing.wall ? thing.y + 1 : thing.y, space: level.space };
  if (f.special === "pry") {
    const hasTool = (p.inventory.tool ?? 0) > 0;
    return {
      id,
      name: thing.name,
      kind: "object",
      pos,
      description: run.pry === 0 ? f.look : run.pry === 1 ? "The stone wobbles under your fingers. A gap shows dark mortar beneath." : "One more heave will lift the flagstone clear of the culvert below.",
      affordances: [act(run.pry >= 2 ? "Lift the flagstone and slip out" : `Pry the stone (${run.pry}/3)`, hasTool, "You need an iron spoon or file")],
    };
  }
  if (f.special === "grate") {
    const hasTool = (p.inventory.tool ?? 0) > 0;
    return {
      id,
      name: thing.name,
      kind: "object",
      pos,
      description: run.grate === 0 ? f.look : "Two iron bars are bent wide enough to squeeze through.",
      affordances: [act(run.grate >= 1 ? "Slip down the culvert" : "Pry the drain grate", hasTool, "You need a file or iron tool")],
    };
  }
  if (f.special === "keys") {
    return {
      id,
      name: thing.name,
      kind: "object",
      pos,
      description: run.hasKey ? "An empty peg where the gate key hung." : f.look,
      affordances: run.hasKey ? [] : [act(f.verb)],
    };
  }
  if (f.special === "ledger") {
    const cost = bailCost(run), coin = style.coin[cost === 1 ? 0 : 1];
    const summary = `${run.sentence.charge}. ${run.sentence.kind === "life" ? "Held indefinitely." : `${run.sentence.daysLeft} days remaining.`}`;
    return {
      id,
      name: thing.name,
      kind: "object",
      pos,
      description: `${f.look} ${summary}`,
      affordances: run.released
        ? []
        : [act(`Pay ${cost} ${coin} for release`, (p.inventory.coin ?? 0) >= cost, `Need ${cost} ${coin}`)],
    };
  }
  const done = record(h, level.prison).done.includes(thing.id);
  const broke = !!f.price && (p.inventory.coin ?? 0) < f.price;
  const spent = done && !f.keeps && !f.price;
  return {
    id,
    name: thing.name,
    kind: "object",
    pos,
    description: `${f.look}${f.price ? ` ${f.price} ${style.coin[f.price === 1 ? 0 : 1]}.` : ""}`,
    affordances: spent ? [] : [act(f.verb, !broke, "Not enough money")],
  };
}

export function prisonVerb(h: ComplexHost) {
  const c = here(h), run = prisonRun(h);
  if (!c || !run) return undefined;
  const done = new Set(record(h, c.level.prison).done), style = prisonStyle(c.level.style)!;
  const id = areaTarget(h.state.player, c.level, "prison", (t) => {
    if (t.find === "key-rack" && run.hasKey) return true;
    return done.has(t.id) && !prisonFind(style, t.find)?.keeps;
  });
  const offer = id ? prisonInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled ? { label: offer.label, target: id! } : undefined;
}

export function prisonAct(h: ComplexHost, id: string) {
  const c = here(h), run = prisonRun(h);
  if (!c || !run) return;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  const { level } = c, style = prisonStyle(level.style)!, p = h.state.player;
  const thing = level.things.find((t) => `prison-thing:${t.id}` === id), f = thing && prisonFind(style, thing.find);
  if (!thing || !f) return;

  if (f.special === "pry") {
    if ((p.inventory.tool ?? 0) < 1) return void h.event("You need an iron spoon or file to work the mortar.");
    run.pry += 1;
    h.cue?.("player", "rattle", { x: thing.x, y: thing.y });
    h.advance(f.time ?? 300);
    if (run.pry >= 3) {
      return leave(h, "You heave the fractured stone aside, squeeze through the dark breach, and scramble out into the open air!", true, true);
    }
    h.event(run.pry === 1 ? "You scrape away a handful of dry mortar before footsteps pass outside." : "The stone shifts loose with a dull grind. One more try will lift it clear.");
    return;
  }

  if (f.special === "grate") {
    if ((p.inventory.tool ?? 0) < 1) return void h.event("The rusted bars won't budge bare-handed.");
    const guard = nearestWarder(h, level.space);
    if (guard && Math.hypot(guard.pos.x - p.pos.x, guard.pos.y - p.pos.y) <= 4) {
      return caughtEscaping(h, run, guard);
    }
    run.grate += 1;
    h.cue?.("player", "rattle", { x: thing.x, y: thing.y });
    h.advance(f.time ?? 300);
    if (run.grate >= 2) {
      const out = { ...run.out };
      h.state.fugitive = { since: h.state.clock, prison: run.name, charge: run.sentence.charge };
      for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
      if (sewerEnterFrom(h, out, "You wrench the rusted grate open and drop into the vaulted sewer beneath the prison yard!")) {
        h.cue?.("player", "celebrate");
        return;
      }
      return leave(h, "You wrench the rusted grate open, drop into the drain culvert, and emerge outside the walls!", true, true);
    }
    h.event("Two rusted bars groan and bend apart. One more pull will open a gap wide enough to crawl through.");
    return;
  }

  if (f.special === "keys") {
    if (run.hasKey) return;
    const guard = nearestWarder(h, level.space);
    if (guard && Math.hypot(guard.pos.x - p.pos.x, guard.pos.y - p.pos.y) <= 4) {
      return caughtEscaping(h, run, guard);
    }
    run.hasKey = true;
    h.cue?.("player", "rattle", { x: thing.x, y: thing.y });
    h.cue?.("player", "sneak");
    h.advance(30);
    h.event("While the turnkey's back is turned, you lift a heavy brass gate key off the rack.", "world");
    return;
  }

  if (f.special === "work") {
    p.inventory.coin = (p.inventory.coin ?? 0) + 2;
    p.fatigue = Math.min(100, (p.fatigue ?? 0) + 12);
    run.workedDay = Math.floor(h.state.clock / 86400);
    h.advance(f.time ?? 3600);
    h.event(`You work a hard shift at the bench and earn 2 ${style.coin[1]}.`);
    return;
  }

  if (f.id === "pallet" || f.id === "cot") {
    p.fatigue = Math.max(0, (p.fatigue ?? 0) - 65);
    p.health = Math.min(100, (p.health ?? 100) + 6);
    h.advance(8 * 3600);
    prisonNight(h);
    return;
  }

  if (f.special === "tallies") {
    run.tallies += 1;
    h.advance(30);
    h.event(`You scratch mark #${run.tallies} into the stone beside the older rows.`);
    return;
  }

  if (f.special === "ledger") {
    const cost = bailCost(run);
    if ((p.inventory.coin ?? 0) < cost) return void h.event(`You need ${cost} ${style.coin[1]} to settle your release.`);
    p.inventory.coin = (p.inventory.coin ?? 0) - cost;
    run.released = true;
    const guard = nearestWarder(h, level.space);
    if (guard) {
      h.cue?.("player", "pay", guard.pos);
      h.cue?.(guard.id, "take-coin", p.pos);
      h.say?.(guard.id, "Gate's open.");
    }
    h.advance(60);
    h.event(`The head turnkey strikes your name from the book and unbolts the outer gate.`, "world");
    return;
  }

  if (f.price) {
    if ((p.inventory.coin ?? 0) < f.price) return void h.event("You don't have the coin.");
    p.inventory.coin = (p.inventory.coin ?? 0) - f.price;
    for (const [k, n] of Object.entries(f.loot ?? {})) p.inventory[k] = (p.inventory[k] ?? 0) + (n ?? 0);
    if (f.heal) p.health = Math.min(100, (p.health ?? 100) + f.heal);
    h.advance(f.time ?? 120);
    h.event(f.text);
    return;
  }

  takeFind(h, run, c, thing, { ...f, tier: "common" }, record(h, level.prison).done, { refuel() {} });
}

export function prisonTime(h: ComplexHost) {
  const run = prisonRun(h), p = h.state.player;
  if (!run) return;
  const c = prisonLevelOf(h, p.pos.space);
  if (!c) {
    if (p.pos.space === "outside" || !parsePrisonSpace(p.pos.space)) delete h.state.complex;
    return;
  }
  const exit = exitAt(c.level, p.pos.x, p.pos.y);
  if (exit?.to === "outside") {
    if (run.released) return leave(h, "The heavy gate swings wide and you step back out into the daylight.", true, false);
    if (run.hasKey) return leave(h, "You turn the stolen brass key in the lock, slip the bolt, and bolt out into the street!", true, true);
    const [dx, dy] = N4[exit.inward];
    p.pos.x += dx;
    p.pos.y += dy;
    const guard = nearestWarder(h, c.level.space);
    if (guard) {
      h.cue?.(guard.id, "halt", p.pos);
      h.say?.(guard.id, "Locked tight!");
    }
    h.event("The outer gate is bolted fast. Settle your release at the ledger—or find a key.");
    return;
  }
  if (exit) {
    const next = arrive(h, exit.to, c.level.space);
    if (next) h.event(next.name[0].toUpperCase() + next.name.slice(1) + ".", "action");
    return;
  }
  folkTime(h.folk, c.level.space, (x, y) => !prisonGround(h, c.level.space, x, y));

  // FF6 warder patrol sighting & stealth choreography when outside your starting cell
  const b = c.level.cellBounds;
  const inHomeCell = p.pos.x >= b.x && p.pos.x < b.x + b.w && p.pos.y >= b.y && p.pos.y < b.y + b.h;
  if (!run.released && !inHomeCell) {
    const guard = nearestWarder(h, c.level.space);
    if (guard) {
      const dist = Math.hypot(guard.pos.x - p.pos.x, guard.pos.y - p.pos.y);
      if (dist <= 4.2 && dist > 1.5 && h.state.clock - (run.alerted ?? -999) >= 120) {
        run.alerted = h.state.clock;
        h.cue?.(guard.id, "halt", p.pos);
        h.say?.(guard.id, "Hey! Back in your cell!");
        // Step one tile briskly toward the escapee if open
        const sx = Math.sign(p.pos.x - guard.pos.x), sy = Math.sign(p.pos.y - guard.pos.y);
        const nx = guard.pos.x + sx, ny = guard.pos.y + sy;
        if (!prisonGround(h, c.level.space, nx, ny) && (nx !== p.pos.x || ny !== p.pos.y)) {
          guard.pos.x = nx;
          guard.pos.y = ny;
        }
      } else if (dist > 4.5 && h.state.clock - (run.sneaked ?? -999) >= 240) {
        run.sneaked = h.state.clock;
        h.cue?.("player", "sneak");
      }
    }
  }
}
