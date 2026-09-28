import { afterEach, expect, it, vi } from "vitest";
import { education } from "../server/edu";
import type { EduStore } from "../server/edu-store";
import type { EduEvent, EduSession } from "../src/edu/events";
import { EduRecorder } from "../src/edu/recorder";
import type { Runtime } from "../src/runtime/session";
import { handleEdu } from "../server/node-handler";
import type { IncomingMessage, ServerResponse } from "node:http";

const env = {
  DATABASE_URL: "test-db",
  UHS_EDU_CLASS_CODE: "class-secret",
  UHS_EDU_TEACHER_TOKEN: "teacher-secret",
};

function memoryStore(): EduStore {
  const sessions = new Map<string, { session: EduSession; hash: string; events: EduEvent[] }>();
  return {
    async create(id, name, hash) {
      sessions.set(id, { session: { id, name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), eventCount: 0 }, hash, events: [] });
    },
    async authorized(id, hash) { return sessions.get(id)?.hash === hash; },
    async append(id, events) {
      const record = sessions.get(id)!;
      for (const event of events)
        if (!record.events.some((e) => e.seq === event.seq)) record.events.push(event);
      record.session.eventCount = record.events.length;
    },
    async list() { return [...sessions.values()].map((r) => r.session); },
    async read(id) {
      const record = sessions.get(id);
      return record && { session: record.session, events: record.events };
    },
    async delete(id) { sessions.delete(id); },
  };
}

const request = (view: string, method = "GET", body?: unknown, token?: string) =>
  new Request(`https://uhs.test/api/edu?view=${view}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

it("requires explicit enrollment, authenticates uploads, deduplicates retries, and limits teacher reads", async () => {
  const store = memoryStore();
  expect((await (await education(request("config"), env, store)).json()).available).toBe(true);
  expect((await education(request("start", "POST", { name: "Ada", code: "class-secret" }), env, store)).status).toBe(400);
  expect((await education(request("start", "POST", { name: "Ada", code: "wrong", consent: true }), env, store)).status).toBe(403);
  const start = await education(request("start", "POST", { name: "Ada", code: "class-secret", consent: true }), env, store);
  const { sessionId, token } = await start.json();
  expect((await education(request("resume", "POST", { sessionId, code: "wrong" }, token), env, store)).status).toBe(403);
  expect((await education(request("resume", "POST", { sessionId, code: "class-secret" }, token), env, store)).status).toBe(200);
  const event: EduEvent = { seq: 1, kind: "text", wallTime: new Date().toISOString(), simTime: 32400, revision: 0, data: { input: "Hello" } };
  const batch = { sessionId, events: [event] };
  expect((await education(request("events", "POST", batch, "wrong"), env, store)).status).toBe(401);
  expect((await education(request("events", "POST", batch, token), env, store)).status).toBe(200);
  expect((await education(request("events", "POST", batch, token), env, store)).status).toBe(200);
  expect((await education(request("sessions", "GET", undefined, token), env, store)).status).toBe(401);
  const list = await (await education(request("sessions", "GET", undefined, "teacher-secret"), env, store)).json();
  expect(list.sessions[0]).toMatchObject({ id: sessionId, name: "Ada", eventCount: 1 });
  const detail = await (await education(new Request(`https://uhs.test/api/edu?view=session&id=${sessionId}`, { headers: { Authorization: "Bearer teacher-secret" } }), env, store)).json();
  expect(detail.events).toEqual([event]);
  expect((await education(new Request(`https://uhs.test/api/edu?view=session&id=${sessionId}`, { method: "DELETE", headers: { Authorization: "Bearer teacher-secret" } }), env, store)).status).toBe(200);
  expect((await education(new Request(`https://uhs.test/api/edu?view=session&id=${sessionId}`, { headers: { Authorization: "Bearer teacher-secret" } }), env, store)).status).toBe(404);
});

afterEach(() => vi.unstubAllGlobals());

it("forwards the classroom route query through the local and deployed HTTP adapter", async () => {
  let body = "";
  const req = { method: "GET", url: "/api/edu?view=config", headers: {} } as IncomingMessage;
  const res = {
    on: () => {},
    writeHead: () => {},
    end: (text: string) => { body = text; },
  } as unknown as ServerResponse;
  await handleEdu(req, res);
  expect(JSON.parse(body)).toHaveProperty("available");
});

it("keeps the same ordered events locally until an upload is acknowledged", async () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
  vi.stubGlobal("window", {
    addEventListener: () => {}, removeEventListener: () => {},
    setTimeout: () => 1, clearTimeout: () => {},
  });
  const send = vi.fn()
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValue({ ok: true, json: async () => ({ through: 2 }) });
  vi.stubGlobal("fetch", send);
  const recorder = new EduRecorder({ sessionId: "00000000-0000-4000-8000-000000000001", token: "token", name: "Ada" });
  const runtime = { engine: { state: { clock: 10, revision: 0, manifest: { seed: "test" } } } } as unknown as Runtime;
  recorder.attach(runtime);
  runtime.onRecord!("text", { input: "Look around" });
  expect(recorder.pending).toBe(2);
  expect(await recorder.flush()).toBe(false);
  expect(recorder.pending).toBe(2);
  expect(await recorder.flush()).toBe(true);
  expect(recorder.pending).toBe(0);
  const first = JSON.parse(send.mock.calls[0][1].body);
  const second = JSON.parse(send.mock.calls[1][1].body);
  expect(second.events).toEqual(first.events);
  recorder.dispose();
});
