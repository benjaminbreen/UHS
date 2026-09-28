CREATE TABLE IF NOT EXISTS edu_sessions (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  token_hash char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS edu_events (
  session_id uuid NOT NULL REFERENCES edu_sessions(id) ON DELETE CASCADE,
  seq integer NOT NULL CHECK (seq > 0),
  kind text NOT NULL CHECK (kind IN ('world', 'command', 'text', 'note', 'selection', 'dialogue')),
  wall_time timestamptz NOT NULL,
  sim_time integer NOT NULL,
  revision integer NOT NULL,
  data jsonb NOT NULL,
  PRIMARY KEY (session_id, seq)
);
