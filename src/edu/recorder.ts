import type { Runtime } from "../runtime/session";
import type { EduEvent } from "./events";

export type EduCredentials = { sessionId: string; token: string; name: string };
type Queue = { sessionId: string; nextSeq: number; pending: EduEvent[] };
const ACTIVE = "uhs-edu-active";
const queueKey = (id: string) => `uhs-edu-queue-${id}`;

export function activeEduSession(): EduCredentials | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(ACTIVE) ?? "null");
    return value?.sessionId && value?.token && value?.name ? value : undefined;
  } catch { return undefined; }
}

export function rememberEduSession(value: EduCredentials) {
  localStorage.setItem(ACTIVE, JSON.stringify(value));
}

export class EduRecorder {
  private queue: Queue;
  private timer?: number;
  private busy = false;
  private closed = false;
  private runtime?: Runtime;
  error = "";
  onStatus?: () => void;

  constructor(readonly credentials: EduCredentials) {
    try {
      const saved = JSON.parse(localStorage.getItem(queueKey(credentials.sessionId)) ?? "null") as Queue | null;
      this.queue = saved?.sessionId === credentials.sessionId && Array.isArray(saved.pending)
        ? saved : { sessionId: credentials.sessionId, nextSeq: 1, pending: [] };
    } catch {
      this.queue = { sessionId: credentials.sessionId, nextSeq: 1, pending: [] };
    }
    window.addEventListener("online", this.online);
    this.schedule();
  }

  get pending() { return this.queue.pending.length; }

  attach(runtime: Runtime) {
    this.runtime = runtime;
    runtime.onRecord = (kind, data) => this.record(kind, data);
    this.record("world", { manifest: runtime.engine.state.manifest });
  }

  private record(kind: EduEvent["kind"], data: EduEvent["data"]) {
    if (this.closed || !this.runtime) return;
    const state = this.runtime.engine.state;
    this.queue.pending.push({
      seq: this.queue.nextSeq++, kind, wallTime: new Date().toISOString(),
      simTime: state.clock, revision: state.revision, data,
    });
    try {
      localStorage.setItem(queueKey(this.credentials.sessionId), JSON.stringify(this.queue));
    } catch {
      this.error = "Local recording storage is full. Reconnect to upload this session.";
    }
    this.onStatus?.();
    this.schedule();
  }

  private online = () => { void this.flush(); };

  private schedule() {
    if (this.timer || this.closed || !this.queue.pending.length) return;
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      void this.flush();
    }, 1200);
  }

  async flush(): Promise<boolean> {
    if (this.busy || this.closed) return !this.queue.pending.length;
    this.busy = true;
    try {
      while (this.queue.pending.length) {
        const batch = this.queue.pending.slice(0, 10);
        while (batch.length > 1 && JSON.stringify(batch).length > 90000) batch.pop();
        const response = await fetch("/api/edu?view=events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.credentials.token}`,
          },
          body: JSON.stringify({ sessionId: this.credentials.sessionId, events: batch }),
        });
        if (!response.ok) throw Error(response.status === 401 ? "Session expired." : "Waiting to sync.");
        const result = await response.json() as { through: number };
        this.queue.pending = this.queue.pending.filter((e) => e.seq > result.through);
        localStorage.setItem(queueKey(this.credentials.sessionId), JSON.stringify(this.queue));
        this.error = "";
        this.onStatus?.();
      }
      return true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Waiting to sync.";
      this.onStatus?.();
      return false;
    } finally {
      this.busy = false;
      if (this.queue.pending.length && !this.closed)
        this.timer = window.setTimeout(() => { this.timer = undefined; void this.flush(); }, 5000);
    }
  }

  async finish(): Promise<boolean> {
    if (!await this.flush()) return false;
    localStorage.removeItem(ACTIVE);
    localStorage.removeItem(queueKey(this.credentials.sessionId));
    this.dispose();
    return true;
  }

  dispose() {
    this.closed = true;
    if (this.timer) window.clearTimeout(this.timer);
    window.removeEventListener("online", this.online);
    if (this.runtime) this.runtime.onRecord = undefined;
  }
}
