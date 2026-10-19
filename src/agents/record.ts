import type { bodyState, healthResearch } from "../core/health";
import type { dangerAt } from "../core/danger";
import type { Position, Inventory } from "../core/types";
import type { WorldSetting } from "../content/geography/types";

export type Rationale = { intent?: string; reasoning?: string; expectation?: string };

export type State = ReturnType<typeof bodyState> & { pos: Position; inventory: Inventory; dead?: string; danger: ReturnType<typeof dangerAt>; researchHealth?: ReturnType<typeof healthResearch> };
export type Trace = {
  i: number; at: string; turn: number; kind: string;
  request?: unknown; response?: unknown; error?: string; ms?: number;
};

export type Entry = {
  /** Order within the run, from 0. */
  i: number;
  at: string;
  tool: string;
  input: unknown;
  rationale?: Rationale;
  status: string;
  /** Exactly what the agent was shown in reply. */
  text: string;
  /** Game seconds before and after the call. */
  clock: number;
  after: number;
  hash?: string;
  beforeState?: State;
  state?: State;
  place: string;
  year?: number;
};

export type Manifest = {
  id: string;
  startedAt: string;
  mode: "serve" | "run";
  protocol?: number;
  setting?: { asked?: string; place: string; year: number; role: string; seed: string };
  initialSetting?: WorldSetting;
  timeTravel?: boolean;
  offline?: boolean;
  [key: string]: unknown;
};

/** One run: a manifest saying what produced it and an entry per tool call.
 * Solo and run mode write the same thing; where it goes is the caller's. */
export class RunRecord {
  readonly entries: Entry[] = [];
  readonly traces: Trace[] = [];
  manifest: Manifest;

  constructor(
    base: Pick<Manifest, "mode"> & Partial<Manifest>,
    private readonly onEntry?: (entry: Entry, record: RunRecord) => void,
    private readonly onTrace?: (trace: Trace, record: RunRecord) => void,
  ) {
    const startedAt = new Date().toISOString();
    this.manifest = { id: `${startedAt.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`, startedAt, ...base };
  }

  start(details: Partial<Manifest>) {
    Object.assign(this.manifest, details);
  }

  entry(fields: Omit<Entry, "i" | "at">) {
    const entry = { i: this.entries.length, at: new Date().toISOString(), ...fields };
    this.entries.push(entry);
    this.onEntry?.(entry, this);
  }

  trace(fields: Omit<Trace, "i" | "at" | "turn">) {
    const trace = { i: this.traces.length, at: new Date().toISOString(), turn: this.entries.length, ...fields };
    this.traces.push(trace);
    this.onTrace?.(trace, this);
  }

  fetch(kind: string, send: typeof fetch): typeof fetch {
    return async (url, init) => {
      const began = Date.now();
      const request = { url: String(url), body: init?.body ? String(init.body) : undefined };
      try {
        const response = await send(url, init);
        this.trace({ kind, request, response: { status: response.status, body: await response.clone().text() }, ms: Date.now() - began });
        return response;
      } catch (error) {
        this.trace({ kind, request, error: String(error), ms: Date.now() - began });
        throw error;
      }
    };
  }

  /** A readable account: one line per thing done, looks left out. */
  chronicle(): string {
    const s = this.manifest.setting;
    const lines = [`# ${s ? `${s.role}, ${s.place}, ${s.year}` : this.manifest.id}`, ""];
    let day = -1;
    for (const e of this.entries) {
      if (e.tool === "look" || e.tool === "inspect") continue;
      const d = Math.floor(e.clock / 86400) + 1;
      if (d !== day) lines.push("", `## Day ${(day = d)}`, "");
      const time = `${String(Math.floor((e.clock % 86400) / 3600)).padStart(2, "0")}:${String(Math.floor((e.clock % 3600) / 60)).padStart(2, "0")}`;
      const what = e.rationale?.intent ?? `${e.tool} ${JSON.stringify(e.input)}`;
      if (e.tool === "diary") { lines.push(`- ${time} Diary: ${e.text}`); continue; }
      const result = e.text.split("\n\n")[0].split("\n").slice(1).join(" ").slice(0, 300);
      lines.push(`- ${time} ${what} — ${e.status.toLowerCase()}${result ? `: ${result}` : ""}`);
      if (e.rationale?.reasoning) lines.push(`  > ${e.rationale.reasoning}`);
    }
    return lines.join("\n") + "\n";
  }
}
