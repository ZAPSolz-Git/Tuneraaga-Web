import { supabase } from "../lib/supabaseClient";

// UI ke liye current plan + history SEEDHA Supabase orders se derive karo.
// Isse backend endpoint ya backend restart ki zaroorat nahi — jaise hi
// koi order 'paid' hoga (aur DB trigger plan_name fill karega), UI dikha dega.
export async function fetchMySubscription() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { subscription: null, orders: [] };

  const email = (user.email || "").toLowerCase();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, paid_at, status, payment_type, amount, plan_id, plan_name, duration_label, razorpay_payment_id, email, full_name, phone",
    )
    .ilike("email", email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMySubscription error:", error.message);
    return { subscription: null, orders: [] };
  }

  const paid = (orders || []).filter((o) => o.status === "paid");
  const current =
    [...paid].sort(
      (a, b) =>
        new Date(b.paid_at || b.created_at) -
        new Date(a.paid_at || a.created_at),
    )[0] || null;

  const subscription = current
    ? {
        email,
        plan_status: "active",
        current_plan_id: current.plan_id,
        current_plan_name: current.plan_name,
        current_duration_label: current.duration_label,
        plan_payment_type: current.payment_type,
        plan_activated_at: current.paid_at || current.created_at,
        last_transaction_id:
          current.razorpay_payment_id ||
          (current.payment_type === "free" ? "FREE" : null),
        full_name: current.full_name,
        phone: current.phone,
      }
    : {
        email,
        plan_status: "none",
        current_plan_id: null,
        current_plan_name: null,
        current_duration_label: null,
        plan_payment_type: null,
        plan_activated_at: null,
        last_transaction_id: null,
        full_name: null,
        phone: null,
      };

  return { subscription, orders: orders || [] };
}
