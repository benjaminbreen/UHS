import type { PlayerAdapter } from "./player";
import {
  RULES,
  decide,
  extractJson,
  journalRequest,
  journalSchema,
  rationaleOf,
  type Complete,
  type Decision,
} from "./brain";

const HOUR = 3600;
const DAY = 86400;
/** Nobody is abroad before this hour, and the day is over after it. */
const DAWN = 5;
const DUSK = 21;
/** How much of the record to carry forward. Days are summarised; only the
 * last few turns go in verbatim. */
const RECENT_TURNS = 8;

export type PlaythroughOptions = {
  days?: number;
  maxTurns?: number;
  /** Looking costs no time, so it needs its own bound. */
  inspectsPerTurn?: number;
  onTurn?: (note: string) => void;
};

export type PlaythroughResult = {
  turns: number;
  calls: number;
  days: number;
  journal: string[];
  stopped: string;
};

const hourOf = (clock: number) => Math.floor(clock / HOUR) % 24;
const dayOf = (clock: number) => Math.floor(clock / DAY) + 1;

/**
 * Drive one character through several days. The model is asked only when
 * there is something to decide: walking is one call, and a night passes
 * without asking anybody.
 */
export async function playthrough(
  adapter: PlayerAdapter,
  model: Complete,
  options: PlaythroughOptions = {},
): Promise<PlaythroughResult> {
  const engine = adapter.engine;
  let calls = 0;
  const complete: Complete = (system, messages) => {
    calls++;
    return model(system, messages);
  };
  const days = options.days ?? 1;
  const maxTurns = options.maxTurns ?? days * 60;
  const inspectLimit = options.inspectsPerTurn ?? 3;
  const startDay = dayOf(engine.state.clock);
  const system = `${RULES}\n\n${adapter.world()}`;
  const journal: string[] = [];
  const recent: string[] = [];
  const note = options.onTurn ?? (() => {});

  let turns = 0;
  let serial = 0;
  let daysClosed = 0;
  let stopped = "finished the last day";

  /** Nothing to decide in the dark: sleep through to dawn in one command,
   * without a call. Where the character lies down decides what the night
   * costs them, so this is the same command a person would use. */
  const passNight = () => {
    adapter.act({
      actionId: `night-${serial++}`,
      expectedRevision: engine.state.revision,
      command: { type: "sleep", seconds: engine.untilMorning(DAWN + 1) },
      rationale: { intent: "Sleep until first light" },
    });
  };

  const closeDay = async (day: number) => {
    const reply = await complete(system, [
      { role: "user", content: `${recent.join("\n")}\n\n${journalRequest}` },
    ]);
    try {
      const entry = journalSchema.parse(extractJson(reply)).journal;
      journal.push(`Day ${day}: ${entry}`);
      note(`— day ${day} closed: ${entry.slice(0, 120)}`);
    } catch {
      // A missing journal entry is not worth ending a run over.
      journal.push(`Day ${day}: (no entry)`);
    }
    recent.length = 0;
    daysClosed++;
  };

  while (turns < maxTurns) {
    if (dayOf(engine.state.clock) - startDay >= days) break;
    if (hourOf(engine.state.clock) >= DUSK || hourOf(engine.state.clock) < DAWN) {
      const day = dayOf(engine.state.clock);
      await closeDay(day);
      passNight();
      if (dayOf(engine.state.clock) - startDay >= days) break;
      continue;
    }

    const context = [
      journal.length ? `WHAT CAME BEFORE\n${journal.join("\n")}` : "",
      recent.length ? `THIS DAY SO FAR\n${recent.join("\n")}` : "",
      adapter.scene(),
      "What do you do?",
    ]
      .filter(Boolean)
      .join("\n\n");

    let decision: Decision;
    try {
      decision = await decide(complete, system, [
        { role: "user", content: context },
      ]);
    } catch (error) {
      stopped = `the model stopped making sense: ${
        error instanceof Error ? error.message : error
      }`;
      break;
    }

    const rationale = rationaleOf(decision);
    const action = decision.action;
    let outcome: string;

    if (action.kind === "inspect") {
      // Free in time, so it repeats within one turn rather than becoming one.
      const seen: string[] = [];
      let current = action;
      for (let look = 0; look < inspectLimit; look++) {
        seen.push(JSON.stringify(adapter.inspect(current.targetId)));
        const next = await decide(complete, system, [
          { role: "user", content: context },
          { role: "assistant", content: JSON.stringify(decision) },
          { role: "user", content: `You look closer:\n${seen.at(-1)}\n\nNow what do you do?` },
        ]);
        if (next.action.kind !== "inspect") {
          decision = next;
          break;
        }
        current = next.action;
      }
      if (decision.action.kind === "inspect") {
        note(`${decision.intent} — looked, decided nothing`);
        recent.push(`Looked at things, without acting.`);
        turns++;
        continue;
      }
    }

    const chosen = decision.action;
    if (chosen.kind === "goto") {
      const result = adapter.goto({
        actionId: `goto-${serial++}`,
        target: chosen.target,
        x: chosen.x,
        y: chosen.y,
        rationale,
      });
      outcome = `${result.status}, ${result.steps} steps${
        result.reason ? `: ${result.reason}` : ""
      }`;
    } else if (chosen.kind === "wait") {
      const result = adapter.act({
        actionId: `wait-${serial++}`,
        expectedRevision: engine.state.revision,
        command: { type: "wait", seconds: chosen.minutes * 60 },
        rationale,
      });
      outcome = result.status;
    } else if (chosen.kind === "act") {
      const result = adapter.act({
        actionId: `act-${serial++}`,
        expectedRevision: engine.state.revision,
        command: chosen.command,
        rationale,
      });
      outcome =
        result.status === "rejected"
          ? `refused: ${result.reason}`
          : result.events.map((e) => e.text).join(" ") || "done";
    } else {
      outcome = "nothing";
    }

    turns++;
    recent.push(`${decision.intent} → ${outcome}`);
    if (recent.length > RECENT_TURNS) recent.shift();
    note(`${decision.intent} → ${outcome}`);
  }

  if (turns >= maxTurns) stopped = `ran out of turns (${maxTurns})`;
  if (recent.length) await closeDay(dayOf(engine.state.clock));
  return { turns, calls, days: daysClosed, journal, stopped };
}
