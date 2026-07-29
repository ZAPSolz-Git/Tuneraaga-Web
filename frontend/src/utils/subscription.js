import { supabase } from "../lib/supabaseClient";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

// current plan + orders history backend (service role) se — RLS ka issue nahi
export async function fetchMySubscription() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { subscription: null, orders: [] };

  try {
    const res = await fetch(`${API_BASE}/api/me/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) return { subscription: null, orders: [] };
    return { subscription: data.subscription, orders: data.orders || [] };
  } catch (e) {
    console.error("fetchMySubscription error:", e);
    return { subscription: null, orders: [] };
  }
}
