CREATE TABLE IF NOT EXISTS service_estimates (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT,
  total NUMERIC(12,2) NOT NULL CHECK (total > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by BIGINT REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_estimates_booking_status_idx ON service_estimates(booking_id,status);
