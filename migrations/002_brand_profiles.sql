-- Run this in the Supabase SQL editor (https://supabase.com/dashboard → SQL editor).
-- Creates the table the onboarding flow saves to.

CREATE TABLE IF NOT EXISTS brand_profiles (
  user_id              uuid PRIMARY KEY,
  responses            jsonb NOT NULL,
  archetype_primary    text,
  archetype_secondary  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_profiles_archetype_idx
  ON brand_profiles(archetype_primary);
