

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// ── Streaming's own project — data only (releases, playlists, etc.) ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ── NEW: Distribution's project — identity authority only ──
const distributionAuth = createClient(
  process.env.DISTRIBUTION_SUPABASE_URL,
  process.env.DISTRIBUTION_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const distributionData = createClient(
  process.env.DISTRIBUTION_SUPABASE_URL,
  process.env.DISTRIBUTION_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const bucket = process.env.SUPABASE_BUCKET || "TuneRaaga";

module.exports = { supabase, supabaseAdmin, distributionAuth, distributionData, bucket };

