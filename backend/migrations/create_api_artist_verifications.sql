-- Admin-approved blue ticks for Spotify/Deezer (API) artists.
-- Keyed by the Spotify artist ID, so artists with the same name stay distinct.
-- Run once in the Supabase SQL editor.
CREATE TABLE IF NOT EXISTS public.api_artist_verifications (
  spotify_id  text PRIMARY KEY,
  name        text NOT NULL,
  image       text,
  verified_by uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Only the backend (service role) reads/writes this table.
ALTER TABLE public.api_artist_verifications ENABLE ROW LEVEL SECURITY;
