CREATE TABLE IF NOT EXISTS auth_login_throttle (
  key_hash TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_login_throttle_block_idx ON auth_login_throttle(blocked_until);
