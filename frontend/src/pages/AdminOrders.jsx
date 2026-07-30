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
    <div className="p-4 md:p-8">
      <h1 className="text-xl font-extrabold mb-1">All Transactions</h1>
      <p className="text-slate-500 text-xs mb-4">
        {orders.length} orders · konse user ne konsa plan liya
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-xs bg-white">
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
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  Koi transaction nahi mila.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const free = Number(o.amount) === 0 || o.payment_type === "free";
              return (
                <tr key={o.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2">{o.full_name || "—"}</td>
                  <td className="px-3 py-2">{o.email}</td>
                  <td className="px-3 py-2">{o.phone || "—"}</td>
                  <td className="px-3 py-2 font-semibold">
                    {o.plan_name || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">
                    {o.plan_id}
                  </td>
                  <td className="px-3 py-2">
                    {free ? "FREE" : `₹${o.amount}`}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        free
                          ? "text-blue-600 font-bold"
                          : "text-emerald-600 font-bold"
                      }
                    >
                      {free ? "FREE" : "PAID"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        o.status === "paid"
                          ? "text-emerald-600 font-semibold"
                          : o.status === "failed"
                            ? "text-red-500 font-semibold"
                            : "text-amber-500 font-semibold"
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">
                    {o.razorpay_payment_id || (free ? "FREE" : "—")}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">{o.id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
