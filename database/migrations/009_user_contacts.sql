CREATE TABLE IF NOT EXISTS user_contacts (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
