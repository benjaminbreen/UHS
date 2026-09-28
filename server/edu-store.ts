import { neon } from "@neondatabase/serverless";
import type { EduEvent, EduSession } from "../src/edu/events";

export type EduStore = {
  create(id: string, name: string, tokenHash: string): Promise<void>;
  authorized(id: string, tokenHash: string): Promise<boolean>;
  append(id: string, events: EduEvent[]): Promise<void>;
  list(): Promise<EduSession[]>;
  read(id: string): Promise<{ session: EduSession; events: EduEvent[] } | undefined>;
  delete(id: string): Promise<void>;
};

export function neonEduStore(url: string): EduStore {
  const sql = neon(url);
  return {
    async create(id, name, tokenHash) {
      await sql`INSERT INTO edu_sessions (id, name, token_hash) VALUES (${id}, ${name}, ${tokenHash})`;
    },
    async authorized(id, tokenHash) {
      const rows = await sql`SELECT 1 FROM edu_sessions WHERE id = ${id} AND token_hash = ${tokenHash}`;
      return rows.length > 0;
    },
    async append(id, events) {
      await sql`
        INSERT INTO edu_events (session_id, seq, kind, wall_time, sim_time, revision, data)
        SELECT ${id}::uuid, e.seq, e.kind, e."wallTime"::timestamptz, e."simTime", e.revision, e.data
        FROM jsonb_to_recordset(${JSON.stringify(events)}::jsonb)
          AS e(seq integer, kind text, "wallTime" text, "simTime" integer, revision integer, data jsonb)
        ON CONFLICT (session_id, seq) DO NOTHING`;
      await sql`UPDATE edu_sessions SET updated_at = now() WHERE id = ${id}`;
    },
    async list() {
      const rows = await sql`
        SELECT s.id, s.name, s.created_at, s.updated_at,
          (SELECT count(*)::integer FROM edu_events e WHERE e.session_id = s.id) AS event_count
        FROM edu_sessions s ORDER BY s.created_at DESC LIMIT 500`;
      return rows.map((r) => ({
        id: String(r.id), name: String(r.name),
        createdAt: new Date(String(r.created_at)).toISOString(),
        updatedAt: new Date(String(r.updated_at)).toISOString(),
        eventCount: Number(r.event_count),
      }));
    },
    async read(id) {
      const rows = await sql`
        SELECT s.id, s.name, s.created_at, s.updated_at,
          (SELECT count(*)::integer FROM edu_events e WHERE e.session_id = s.id) AS event_count
        FROM edu_sessions s WHERE s.id = ${id}`;
      if (!rows.length) return undefined;
      const r = rows[0];
      const events = await sql`
        SELECT seq, kind, wall_time, sim_time, revision, data
        FROM edu_events WHERE session_id = ${id} ORDER BY seq LIMIT 20000`;
      return {
        session: {
          id: String(r.id), name: String(r.name),
          createdAt: new Date(String(r.created_at)).toISOString(),
          updatedAt: new Date(String(r.updated_at)).toISOString(),
          eventCount: Number(r.event_count),
        },
        events: events.map((e) => ({
          seq: Number(e.seq), kind: e.kind as EduEvent["kind"],
          wallTime: new Date(String(e.wall_time)).toISOString(),
          simTime: Number(e.sim_time), revision: Number(e.revision),
          data: e.data as EduEvent["data"],
        })),
      };
    },
    async delete(id) {
      await sql`DELETE FROM edu_sessions WHERE id = ${id}`;
    },
  };
}
