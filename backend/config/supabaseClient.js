

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Fail loudly at startup if a Supabase key is clearly not a real key.
// (Invalid keys make every token check fail, which surfaces as 401s.)
[
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DISTRIBUTION_SUPABASE_ANON_KEY",
  "DISTRIBUTION_SUPABASE_SERVICE_ROLE_KEY",
].forEach((name) => {
  const v = process.env[name] || "";
  if (!(v.startsWith("eyJ") || v.startsWith("sb_")) || v.length < 40) {
    console.error(
      `❌ ${name} in backend/.env is missing or not a valid Supabase key — ` +
        `all auth checks will fail with 401. Copy it from Supabase → Project Settings → API.`,
    );
  }
});

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

