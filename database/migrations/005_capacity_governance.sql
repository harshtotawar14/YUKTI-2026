ALTER TABLE capacity_worker_offers ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;
ALTER TABLE capacity_worker_offers ADD COLUMN IF NOT EXISTS decline_reason TEXT;

CREATE TABLE IF NOT EXISTS cross_cooperative_assignments (
  id BIGSERIAL PRIMARY KEY,
  capacity_request_id BIGINT NOT NULL REFERENCES capacity_requests(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  home_cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  serving_cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  complaint_owner_cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  worker_consent_at TIMESTAMPTZ NOT NULL,
  approved_by BIGINT NOT NULL REFERENCES users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_responsibility JSONB NOT NULL DEFAULT '{"mode":"serving_cooperative_collects","split":"to_be_configured"}'::jsonb,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED','CANCELLED','COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(capacity_request_id,worker_id)
);
CREATE INDEX IF NOT EXISTS cross_assignment_worker_idx ON cross_cooperative_assignments(worker_id,status);
