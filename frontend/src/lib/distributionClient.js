import { createClient } from "@supabase/supabase-js";

// Distribution (Movement Creations) project ka URL + anon key
const url = import.meta.env.VITE_DISTRIBUTION_SUPABASE_URL;
const anonKey = import.meta.env.VITE_DISTRIBUTION_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[distributionClient] VITE_DISTRIBUTION_SUPABASE_URL / _ANON_KEY missing in .env",
  );
}

export const distributionClient = createClient(url, anonKey, {
  auth: { persistSession: false },
});
