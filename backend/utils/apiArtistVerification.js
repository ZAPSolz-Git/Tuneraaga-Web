// Admin-approved blue ticks for artists that come from Spotify/Deezer.
// Stored by Spotify artist ID in `api_artist_verifications`
// (see backend/migrations/create_api_artist_verifications.sql).
const { supabaseAdmin } = require("../config/supabaseClient");

const TABLE = "api_artist_verifications";

let warned = false;

// Returns a Set of verified Spotify artist IDs. If the table has not been
// created yet, artists simply show as unverified instead of failing.
const getVerifiedIdSet = async () => {
  const { data, error } = await supabaseAdmin.from(TABLE).select("spotify_id");
  if (error) {
    if (!warned) {
      console.error(`[${TABLE}] unavailable:`, error.message);
      warned = true;
    }
    return new Set();
  }
  return new Set((data || []).map((r) => r.spotify_id));
};

// Adds `verified` to one artist or an array of artists (matched by Spotify id).
const applyVerified = async (artists) => {
  const ids = await getVerifiedIdSet();
  const mark = (a) => (a ? { ...a, verified: ids.has(String(a.id)) } : a);
  return Array.isArray(artists) ? artists.map(mark) : mark(artists);
};

module.exports = { TABLE, getVerifiedIdSet, applyVerified };
