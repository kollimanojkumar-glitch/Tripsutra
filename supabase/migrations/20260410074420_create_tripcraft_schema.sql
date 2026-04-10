/*
  # TripCraft Schema

  ## New Tables

  ### trips
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `destination` (text)
  - `start_date` (date)
  - `end_date` (date)
  - `preferences` (jsonb: { pace, interests })
  - `created_at` (timestamptz)

  ### days
  - `id` (uuid, primary key)
  - `trip_id` (uuid, FK to trips)
  - `day_number` (int)
  - `date` (date)
  - `title` (text)

  ### activities
  - `id` (uuid, primary key)
  - `day_id` (uuid, FK to days)
  - `name` (text)
  - `start_time` (time)
  - `duration_minutes` (int)
  - `description` (text)
  - `location_text` (text)
  - `sort_order` (int)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own trips, days, and activities
*/

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  date date NOT NULL,
  title text NOT NULL DEFAULT ''
);

ALTER TABLE days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own days"
  ON days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own days"
  ON days FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own days"
  ON days FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own days"
  ON days FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id AND trips.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time,
  duration_minutes int DEFAULT 60,
  description text DEFAULT '',
  location_text text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = activities.day_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = activities.day_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = activities.day_id AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = activities.day_id AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = activities.day_id AND trips.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_day_id ON activities(day_id);
CREATE INDEX IF NOT EXISTS idx_activities_sort_order ON activities(day_id, sort_order);
