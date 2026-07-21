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

// ─── ROBUST AUTH HEADER HELPER ───
// Gets session, refreshes if expired, returns Authorization header
export const getAuthHeader = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.warn("⚠️ getAuthHeader: No session found");
      return {};
    }

    // Check if token is about to expire (60s buffer)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);

    if (expiresAt && expiresAt < now + 60) {
      console.log("🔄 Token expiring — refreshing...");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.error("❌ Token refresh failed:", refreshError?.message);
        return {};
      }
      return { Authorization: `Bearer ${refreshData.session.access_token}` };
    }

    return { Authorization: `Bearer ${session.access_token}` };
  } catch (err) {
    console.error("❌ getAuthHeader error:", err);
    return {};
  }
};

// API helper for backend calls — enhanced with status in errors
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

  // Remove Content-Type for FormData (file uploads)
  if (config.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const result = await response.json();

  if (!response.ok) {
    // ✅ Include status code in the error so callers can handle 401 etc.
    const err = new Error(
      result.message || result.error || "API request failed",
    );
    err.status = response.status;
    err.data = result;
    throw err;
  }

  return result;
};
