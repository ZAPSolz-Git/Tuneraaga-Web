import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Loader2 } from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || "Orders load nahi hue.");
        } else {
          setOrders(data.orders);
        }
      } catch (e) {
        setError("Network error — backend check karo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  if (error)
    return (
      <div className="text-center py-20 text-red-500 text-sm">{error}</div>
    );

  return (
    <div className="p-4 md:p-8 overflow-x-auto">
      <h1 className="text-xl font-extrabold mb-4">All Transactions</h1>
      <table className="min-w-full text-xs border border-slate-200">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {[
              "Date",
              "Name",
              "Email",
              "Phone",
              "Plan",
              "Plan ID",
              "Amount",
              "Type",
              "Status",
              "Transaction ID",
              "Order ID",
              "User ID",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left border-b whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b hover:bg-slate-50">
              <td className="px-3 py-2 whitespace-nowrap">
                {new Date(o.created_at).toLocaleString("en-IN")}
              </td>
              <td className="px-3 py-2">{o.full_name || "—"}</td>
              <td className="px-3 py-2">{o.email}</td>
              <td className="px-3 py-2">{o.phone || "—"}</td>
              <td className="px-3 py-2">{o.plan_name || "—"}</td>
              <td className="px-3 py-2 font-mono">{o.plan_id}</td>
              <td className="px-3 py-2">₹{o.amount}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    Number(o.amount) === 0 || o.payment_type === "free"
                      ? "text-blue-600 font-bold"
                      : "text-emerald-600 font-bold"
                  }
                >
                  {Number(o.amount) === 0 || o.payment_type === "free"
                    ? "FREE"
                    : "PAID"}
                </span>
              </td>
              <td className="px-3 py-2">{o.status}</td>
              <td className="px-3 py-2 font-mono">
                {o.razorpay_payment_id || "—"}
              </td>
              <td className="px-3 py-2 font-mono">{o.id}</td>
              <td className="px-3 py-2 font-mono">{o.user_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrders;
