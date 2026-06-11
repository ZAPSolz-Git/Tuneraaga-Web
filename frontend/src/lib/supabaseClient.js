// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single shared client instance with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: "sb-auth-token",
    flowType: "pkce",
    // Disable lock stealing to prevent conflicts
    debug: false,
  },
  global: {
    headers: { "x-application-name": "tuneraaga" },
  },
});

// Helper function to handle errors
export const handleSupabaseError = (error) => {
  console.error("Supabase Error:", error);

  if (
    error.message?.includes("Lock broken") ||
    error.message?.includes("NavigatorLockAcquireTimeoutError")
  ) {
    console.warn("Lock error detected, refreshing session...");
    return { error: null, needsRefresh: true };
  }

  return { error, needsRefresh: false };
};
