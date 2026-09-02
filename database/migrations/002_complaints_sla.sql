ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS resolution_note TEXT;

CREATE INDEX IF NOT EXISTS support_requests_sla_idx
  ON support_requests(cooperative_id,status,sla_due_at);

CREATE TABLE IF NOT EXISTS complaint_sla_policies (
  id BIGSERIAL PRIMARY KEY,
  cooperative_id BIGINT REFERENCES cooperatives(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '*',
  severity TEXT NOT NULL CHECK (severity IN ('LOW','NORMAL','HIGH','CRITICAL')),
  response_hours INTEGER NOT NULL CHECK (response_hours BETWEEN 1 AND 720),
  active BOOLEAN NOT NULL DEFAULT true,
  updated_by BIGINT REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cooperative_id,category,severity)
);

CREATE TABLE IF NOT EXISTS complaint_events (
  id BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  actor_user_id BIGINT REFERENCES users(id),
  event_type TEXT NOT NULL,
  note TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS complaint_events_case_idx ON complaint_events(complaint_id,created_at);
