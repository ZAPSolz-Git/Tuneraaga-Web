const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// ── Anon key client — for server-side auth verification ──
// MUST have persistSession:false on the server
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// ── Admin client with SERVICE ROLE KEY — bypasses RLS ──
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const bucket = process.env.SUPABASE_BUCKET || "TuneRaaga";

// ✅ Debug: confirm env vars loaded
console.log("🔧 supabaseClient.js loaded:");
console.log(
  "   SUPABASE_URL:",
  process.env.SUPABASE_URL ? "✅ set" : "❌ MISSING",
);
console.log(
  "   SUPABASE_ANON_KEY:",
  process.env.SUPABASE_ANON_KEY ? "✅ set" : "❌ MISSING",
);
console.log(
  "   SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ set" : "❌ MISSING",
);

module.exports = {
  supabase,
  supabaseAdmin,
  bucket,
};
