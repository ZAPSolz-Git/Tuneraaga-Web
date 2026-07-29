import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Crown, ArrowUpRight } from "lucide-react";
import { usePlayer } from "../components/PlayerContext";
import { fetchMySubscription } from "../utils/subscription";

const MyPlan = () => {
  const navigate = useNavigate();
  const { user } = usePlayer();
  const [sub, setSub] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/pro/login");
      return;
    }
    (async () => {
      setLoading(true);
      const { subscription, orders } = await fetchMySubscription();
      setSub(subscription);
      setOrders(orders);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-white/60" size={28} />
      </div>
    );

  const hasActive = sub?.plan_status === "active" && sub?.current_plan_id;

  return (
    <div className="w-full min-h-screen -mx-4 md:-mx-8 -mt-4 bg-slate-900 p-4 md:p-8">
      <h1 className="text-white text-xl font-extrabold mb-6">My Plan</h1>

      <div className="max-w-3xl bg-white rounded-2xl shadow-xl p-6 mb-8">
        {hasActive ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Crown size={18} />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Active Plan
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {sub.current_plan_name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {sub.current_duration_label || "—"} ·{" "}
                <span
                  className={
                    sub.plan_payment_type === "free"
                      ? "text-blue-600 font-bold"
                      : "text-emerald-600 font-bold"
                  }
                >
                  {sub.plan_payment_type === "free" ? "FREE" : "PAID"}
                </span>
              </p>
              {sub.plan_activated_at && (
                <p className="text-xs text-slate-400 mt-1">
                  Activated:{" "}
                  {new Date(sub.plan_activated_at).toLocaleString("en-IN")}
                </p>
              )}
              {sub.last_transaction_id && (
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Txn: {sub.last_transaction_id}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/pro")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              Change / Upgrade Plan <ArrowUpRight size={16} />
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm mb-4">
              Aapke account par abhi koi active plan nahi hai.
            </p>
            <button
              onClick={() => navigate("/pro")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Explore Plans
            </button>
          </div>
        )}
      </div>

      <h2 className="text-white text-lg font-bold mb-3">Transaction History</h2>
      <div className="max-w-4xl overflow-x-auto bg-white rounded-2xl shadow-xl">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              {[
                "Date",
                "Plan",
                "Amount",
                "Type",
                "Status",
                "Transaction ID",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Koi transaction nahi mila.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const free = Number(o.amount) === 0 || o.payment_type === "free";
              return (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    {o.plan_name}
                    {o.duration_label ? ` (${o.duration_label})` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {free ? "FREE" : `₹${o.amount}`}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <span
                      className={
                        o.status === "paid"
                          ? "text-emerald-600"
                          : o.status === "failed"
                            ? "text-red-500"
                            : "text-amber-500"
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {o.razorpay_payment_id || (free ? "FREE" : "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyPlan;
