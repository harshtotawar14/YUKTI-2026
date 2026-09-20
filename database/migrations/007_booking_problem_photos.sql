ALTER TABLE bookings ADD COLUMN IF NOT EXISTS problem_photo BYTEA;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS problem_photo_mime TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS problem_photo_size INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS problem_photo_width INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS problem_photo_height INTEGER;

