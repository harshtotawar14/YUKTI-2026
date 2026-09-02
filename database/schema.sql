CREATE TABLE IF NOT EXISTS cooperatives (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL DEFAULT 'Madhya Pradesh',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER','WORKER','COOPERATIVE_ADMIN','FEDERATION_ADMIN')),
  password_hash TEXT NOT NULL,
  cooperative_id BIGINT REFERENCES cooperatives(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  identity_status TEXT NOT NULL DEFAULT 'VERIFIED',
  availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.80,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  demo_distance_km NUMERIC(6,2) NOT NULL DEFAULT 4.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worker_skills (
  worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'VERIFIED',
  PRIMARY KEY(worker_id, service_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_code TEXT UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES users(id),
  service_id BIGINT NOT NULL REFERENCES services(id),
  cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  assigned_worker_id BIGINT REFERENCES workers(id),
  status TEXT NOT NULL DEFAULT 'OFFERING',
  zone TEXT NOT NULL,
  address TEXT NOT NULL,
  problem TEXT NOT NULL,
  request_source TEXT NOT NULL DEFAULT 'TEXT',
  request_language TEXT,
  voice_transcript TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  emergency BOOLEAN NOT NULL DEFAULT false,
  base_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_worker_idx ON bookings(assigned_worker_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS booking_offers (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  rank INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  decline_reason TEXT,
  matching_score NUMERIC(6,2),
  factor_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(booking_id, worker_id)
);
ALTER TABLE booking_offers ADD COLUMN IF NOT EXISTS matching_score NUMERIC(6,2);
ALTER TABLE booking_offers ADD COLUMN IF NOT EXISTS factor_scores JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE booking_offers ADD COLUMN IF NOT EXISTS reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS booking_offers_worker_idx ON booking_offers(worker_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_offers_booking_rank_idx ON booking_offers(booking_id, rank);

CREATE TABLE IF NOT EXISTS booking_history (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  actor_user_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_start_tokens (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS additional_charges (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  work_item TEXT NOT NULL,
  reason TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'PENDING',
  decided_by BIGINT REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id),
  customer_id BIGINT NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  sandbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id),
  payment_id BIGINT NOT NULL UNIQUE REFERENCES payments(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id),
  customer_id BIGINT NOT NULL REFERENCES users(id),
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_requests (
  id BIGSERIAL PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES users(id),
  booking_id BIGINT REFERENCES bookings(id),
  cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worker_schedule (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(worker_id, work_date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES users(id),
  booking_id BIGINT REFERENCES bookings(id),
  event_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capacity_requests (
  id BIGSERIAL PRIMARY KEY,
  request_code TEXT NOT NULL UNIQUE,
  requesting_cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  providing_cooperative_id BIGINT REFERENCES cooperatives(id),
  service_id BIGINT NOT NULL REFERENCES services(id),
  zone TEXT NOT NULL,
  workers_required INTEGER NOT NULL DEFAULT 1 CHECK (workers_required BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capacity_worker_offers (
  id BIGSERIAL PRIMARY KEY,
  capacity_request_id BIGINT NOT NULL REFERENCES capacity_requests(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES workers(id),
  status TEXT NOT NULL DEFAULT 'OFFERED',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(capacity_request_id, worker_id)
);

CREATE TABLE IF NOT EXISTS training_recommendations (
  id BIGSERIAL PRIMARY KEY,
  cooperative_id BIGINT NOT NULL REFERENCES cooperatives(id),
  service_id BIGINT NOT NULL REFERENCES services(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECOMMENDED',
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
