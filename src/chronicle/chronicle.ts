import type { PlayerCommand, CommandResult, Position } from "../core/types";
import type { Engine } from "../core/engine";
import { worldFacts, sceneDigest, hourWord } from "../narrator/prompt";

export type Rationale = {
  intent?: string;
  reasoning?: string;
  expectation?: string;
};

export type ChronicleTurn = {
  clock: number;
  command: PlayerCommand;
  status: CommandResult["status"];
  reason?: string;
  events: string[];
  rationale?: Rationale;
  /** Set on a folded run of walking; the command is the last step taken. */
  steps?: number;
  /** Set when the same refusal repeated; a stuck agent should cost one line. */
  repeats?: number;
  /** Total seconds of a folded run of waiting. */
  waited?: number;
  /** Idle seconds absorbed after this turn. `pass` is the clock moving, not a
   * decision, so it never earns a line of its own. */
  passed?: number;
  from?: Position;
  pos?: Position;
  /** Full scene text, kept only when the chronicle re-establishes context. */
  scene?: string;
};

export type ChronicleHeader = {
  id: string;
  author: "human" | "agent";
  pack: string;
  seed: string;
  startedAt: string;
};

/** Sim seconds between scene captures. The scene is by far the largest thing
 * written, so it goes in on a clock, not every turn. */
const SCENE_INTERVAL = 1800;

/** The narrator's digest ends with prompt scaffolding and a recap of recent
 * turns. A record drops the recap too, having those lines already. */
export const trimScene = (scene: string, keepEvents = false) => {
  let out = scene
    .replace(/\nRecent turns:(\n.*)*/g, "")
    .replace(/\nPLAYER SAYS: *.*$/, "");
  if (!keepEvents) out = out.replace(/\nSince last turn:(\n- .*)*/g, "");
  return out.trimEnd();
};

const place = (p?: Position) =>
  p ? `${p.x},${p.y}${p.space !== "outside" ? ` in ${p.space}` : ""}` : "";

const compassOf = (from: Position, to: Position) => {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  if (!dx && !dy) return "";
  const ns = dy > 0 ? "south" : dy < 0 ? "north" : "";
  const ew = dx > 0 ? "east" : dx < 0 ? "west" : "";
  return Math.abs(dx) > 2 * Math.abs(dy)
    ? ew
    : Math.abs(dy) > 2 * Math.abs(dx)
      ? ns
      : `${ns}${ew}`;
};

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

const duration = (seconds: number) => {
  if (seconds < 60) return plural(Math.round(seconds), "second");
  const h = Math.floor(seconds / 3600),
    m = Math.round((seconds % 3600) / 60);
  return h
    ? `${plural(h, "hour")}${m ? ` ${plural(m, "minute")}` : ""}`
    : plural(m, "minute");
};

function describe(turn: ChronicleTurn): string {
  const c = turn.command;
  if (turn.waited) return `Waited ${duration(turn.waited)}.`;
  if (c.type === "pass")
    return `Stood still for ${duration(turn.passed ?? c.seconds)}.`;
  if (turn.steps && c.type === "move") {
    const dir =
      turn.from && turn.pos ? compassOf(turn.from, turn.pos) : undefined;
    return `Walked ${plural(turn.steps, "step")}${dir ? ` ${dir}` : ""}, to ${place(turn.pos)}.`;
  }
  switch (c.type) {
    case "move":
      return `Stepped ${compassOf({ x: 0, y: 0, space: "outside" }, { x: c.dx, y: c.dy, space: "outside" })}.`;
    case "wait":
      return `Waited ${duration(c.seconds)}.`;
    case "sleep":
      return c.seconds >= 5 * 3600
        ? `Slept ${duration(c.seconds)}.`
        : `Rested ${duration(c.seconds)}.`;
    case "interact":
      return `${c.action} → ${c.target}.`;
    case "use":
      return `Used ${c.item}.`;
    case "wear":
      return `Put on ${c.item}.`;
    case "remove":
      return `Took off the ${c.slot}.`;
    case "throw":
      return "Threw what they were carrying.";
    case "trade":
      return `Offered ${c.giveQuantity} ${c.give} to ${c.target} for ${c.takeQuantity} ${c.take}.`;
    default:
      return JSON.stringify(c);
  }
}

/**
 * The written record of one playthrough. It sits at the command boundary, so a
 * human at the keyboard and an agent over MCP produce the same document; only
 * the rationale is missing when a person plays.
 */
export class Chronicle {
  readonly turns: ChronicleTurn[] = [];
  private lastScene = -Infinity;
  private startedFrom?: Position;
  private lastSpace?: string;
  private written = 0;
  private pending?: Rationale;
  private cachedCard?: string;

  constructor(
    readonly header: ChronicleHeader,
    private readonly engine: Engine,
    private readonly onTurn?: (turn: ChronicleTurn, index: number) => void,
  ) {
    this.startedFrom = structuredClone(engine.state.player.pos);
  }

  /** Witness every command the engine accepts, whoever issued it. */
  attach(): this {
    this.engine.onAct = (request, result) => {
      const rationale = this.pending;
      this.pending = undefined;
      this.record(request.command, result, rationale);
    };
    return this;
  }

  /** Stage the reasoning behind the next command. Agents call this; a human at
   * the keyboard simply does not, and the turn records without one. */
  explain(rationale?: Rationale): void {
    this.pending =
      rationale && Object.values(rationale).some(Boolean) ? rationale : undefined;
  }

  record(
    command: PlayerCommand,
    result: CommandResult,
    rationale?: Rationale,
  ): void {
    const pos = structuredClone(this.engine.state.player.pos);
    const events = result.events
      .filter((e) => e.kind !== "system")
      .map((e) => e.text);
    const previous = this.turns.at(-1);

    // Idle time belongs to the turn before it, so a walk still reads as one
    // walk when the clock ticks between steps.
    if (
      command.type === "pass" &&
      result.status === "completed" &&
      !rationale &&
      previous
    ) {
      previous.passed = (previous.passed ?? 0) + command.seconds;
      previous.events.push(...events);
      return;
    }

    // A walk is hundreds of identical single-step commands. Fold them into one
    // line unless the agent said something about this particular step.
    if (
      command.type === "move" &&
      result.status === "completed" &&
      !rationale &&
      !events.length &&
      previous &&
      previous.command.type === "move" &&
      previous.status === "completed" &&
      !previous.events.length
    ) {
      previous.steps = (previous.steps ?? 1) + 1;
      previous.command = command;
      previous.pos = pos;
      return;
    }

    if (
      result.status === "rejected" &&
      previous?.status === "rejected" &&
      previous.reason === result.reason &&
      previous.command.type === command.type &&
      !rationale
    ) {
      previous.repeats = (previous.repeats ?? 1) + 1;
      return;
    }

    if (
      command.type === "wait" &&
      result.status === "completed" &&
      !rationale &&
      previous?.command.type === "wait" &&
      previous.status === "completed"
    ) {
      previous.waited =
        (previous.waited ?? previous.command.seconds) + command.seconds;
      previous.command = command;
      previous.pos = pos;
      // "You wait 60 minutes" restates the line; anything else is real news.
      previous.events = [...previous.events, ...events].filter(
        (e) => !/^You wait\b/.test(e),
      );
      return;
    }

    const turn: ChronicleTurn = {
      clock: this.engine.state.clock,
      command,
      status: result.status,
      reason: result.reason,
      events,
      rationale,
      from: previous?.pos ?? this.startedFrom,
      pos,
    };
    const space = pos.space;
    if (
      this.lastSpace !== space ||
      turn.clock - this.lastScene >= SCENE_INTERVAL
    ) {
      turn.scene = trimScene(sceneDigest(this.engine, ""));
      this.lastScene = turn.clock;
      this.lastSpace = space;
    }
    this.turns.push(turn);
    this.onTurn?.(turn, this.turns.length - 1);
  }

  /** The world and character, resolved on demand: every session builds a
   * chronicle, and most are never written out. */
  card(): string {
    return (this.cachedCard ??= worldFacts(this.engine));
  }

  /** First line of the JSONL: what the turns after it happened in. */
  headerLine(): string {
    return JSON.stringify({ header: this.header, card: this.card() });
  }

  /** Structured record, one turn per line, for programmatic analysis. */
  jsonl(from = 0): string {
    return this.turns
      .slice(from)
      .map((t) => JSON.stringify(t))
      .join("\n");
  }

  /** The prose record. This is what you hand to a model to read. */
  markdown(): string {
    const lines = [
      `# Chronicle: ${this.header.id}`,
      "",
      `Played by ${this.header.author} · ${this.header.pack} · seed \`${this.header.seed}\` · ${this.header.startedAt}`,
      "",
      "## The world",
      "",
      "```",
      this.card(),
      "```",
      "",
      "## The record",
      "",
    ];
    let day = 0;
    for (const turn of this.turns) {
      const d = Math.floor(turn.clock / 86400) + 1;
      if (d !== day) {
        lines.push(`### Day ${d}`, "");
        day = d;
      }
      const time = hourWord(turn.clock);
      if (turn.rationale?.intent)
        lines.push(`**${time} — ${turn.rationale.intent}**`, "");
      if (turn.rationale?.reasoning) lines.push(turn.rationale.reasoning, "");
      lines.push(
        `${turn.rationale?.intent ? "" : `**${time}** `}${describe(turn)}${
          turn.status === "rejected"
            ? ` *(refused: ${turn.reason}${turn.repeats ? `, tried ${turn.repeats} times` : ""})*`
            : ""
        }`,
      );
      if (turn.rationale?.expectation)
        lines.push("", `Expected: ${turn.rationale.expectation}`);
      for (const event of turn.events) lines.push(`- ${event}`);
      lines.push("");
      // The scene is read after the action, because that is the state it shows.
      if (turn.scene) lines.push("```", turn.scene, "```", "");
    }
    lines.push(
      "## Close",
      "",
      `${this.turns.length} turns, ${Math.floor(this.engine.state.clock / 3600)} hours elapsed. Final hash \`${this.engine.hash()}\`.`,
      "",
    );
    return lines.join("\n");
  }

  /** Turns not yet handed to a sink, so a long run can append as it goes. */
  drain(): ChronicleTurn[] {
    const pending = this.turns.slice(this.written);
    this.written = this.turns.length;
    return pending;
  }
}

export function startChronicle(
  engine: Engine,
  author: ChronicleHeader["author"],
  onTurn?: (turn: ChronicleTurn, index: number) => void,
): Chronicle {
  const m = engine.state.manifest;
  return new Chronicle(
    {
      id: `${m.pack}-${m.seed}-${Date.now().toString(36)}`,
      author,
      pack: m.pack,
      seed: m.seed,
      startedAt: new Date().toISOString(),
    },
    engine,
    onTurn,
  ).attach();
}
