// lib/supabaseAuth.js — NEW file
import { createClient } from "@supabase/supabase-js";

export const supabaseAuth = createClient(
  import.meta.env.VITE_DISTRIBUTION_SUPABASE_URL,
  import.meta.env.VITE_DISTRIBUTION_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: "sb-auth-token", // same key — one session object either way
      flowType: "pkce",
    },
  },
);