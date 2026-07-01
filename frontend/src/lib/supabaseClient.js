// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// FOOLPROOF API URL: Automatically ensures /api is at the end
let apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
if (!apiBase.endsWith("/api")) {
  apiBase = apiBase.replace(/\/$/, "") + "/api";
}
export const API_BASE_URL = apiBase;

// Create a single shared client instance with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: "sb-auth-token",
    flowType: "pkce",
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

// API helper for backend calls
export const apiCall = async (endpoint, options = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // This will now correctly become: http://localhost:5000/api/auth/signup
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "API request failed");
  }

  return result;
};
