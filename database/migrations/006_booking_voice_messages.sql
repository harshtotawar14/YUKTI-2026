ALTER TABLE bookings ADD COLUMN IF NOT EXISTS voice_audio BYTEA;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS voice_audio_mime TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS voice_audio_duration_ms INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS voice_audio_size INTEGER;

