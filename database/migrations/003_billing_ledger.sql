CREATE TABLE IF NOT EXISTS billing_policies (
  cooperative_id BIGINT PRIMARY KEY REFERENCES cooperatives(id) ON DELETE CASCADE,
  routine_extra_limit NUMERIC(12,2) NOT NULL DEFAULT 1000 CHECK (routine_extra_limit >= 0),
  cooperative_charge_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (cooperative_charge_percent BETWEEN 0 AND 100),
  platform_charge_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (platform_charge_percent BETWEEN 0 AND 100),
  updated_by BIGINT REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE additional_charges ADD COLUMN IF NOT EXISTS admin_decided_by BIGINT REFERENCES users(id);
ALTER TABLE additional_charges ADD COLUMN IF NOT EXISTS admin_decided_at TIMESTAMPTZ;
ALTER TABLE additional_charges ADD COLUMN IF NOT EXISTS admin_note TEXT;

CREATE TABLE IF NOT EXISTS worker_earnings_ledger (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  payment_id BIGINT NOT NULL UNIQUE REFERENCES payments(id),
  gross_service_amount NUMERIC(12,2) NOT NULL CHECK (gross_service_amount >= 0),
  approved_additions NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (approved_additions >= 0),
  cooperative_charge NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cooperative_charge >= 0),
  platform_charge NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (platform_charge >= 0),
  net_earnings NUMERIC(12,2) NOT NULL CHECK (net_earnings >= 0),
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS worker_earnings_worker_idx ON worker_earnings_ledger(worker_id,created_at DESC);
