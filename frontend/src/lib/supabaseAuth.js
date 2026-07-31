// lib/supabaseAuth.js — NEW file
import { createClient } from "@supabase/supabase-js";
// lib/supabaseAuth.js
export const supabaseAuth = createClient(
  import.meta.env.VITE_DISTRIBUTION_SUPABASE_URL,
  import.meta.env.VITE_DISTRIBUTION_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // ✅ also turn off — only Streaming's own client should handle URL-based session detection
      storage: localStorage,
      storageKey: "sb-distribution-auth-token", // ✅ separate key — no more collision
      flowType: "pkce",
    },
  },
);