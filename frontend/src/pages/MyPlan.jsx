import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  Crown,
  ArrowUpRight,
  Sparkles,
  CalendarClock,
  Receipt,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  Zap,
} from "lucide-react";
import { usePlayer } from "../components/PlayerContext";
import { fetchMySubscription } from "../utils/subscription";

const StatusPill = ({ status, free }) => {
  const map = {
    paid: {
      cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: <CheckCircle2 size={12} />,
      label: "Paid",
    },
    failed: {
      cls: "bg-red-50 text-red-500 border-red-200",
      icon: <XCircle size={12} />,
      label: "Failed",
    },
    pending: {
      cls: "bg-amber-50 text-amber-600 border-amber-200",
      icon: <Clock3 size={12} />,
      label: "Pending",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 border ${s.cls} text-[11px] font-bold px-2.5 py-1 rounded-full`}
    >
      {s.icon} {s.label}
    </span>
  );
};

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
        <Loader2 className="animate-spin text-emerald-400" size={30} />
      </div>
    );

  const hasActive = sub?.plan_status === "active" && sub?.current_plan_id;
  const isFree = sub?.plan_payment_type === "free";
  const paidCount = orders.filter(
    (o) => o.status === "paid" && Number(o.amount) > 0,
  ).length;
  const totalSpent = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);

  return (
    <div className="w-full min-h-screen -mx-4 md:-mx-8 -mt-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* header */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-extrabold flex items-center gap-2">
            <Sparkles size={22} className="text-emerald-400" /> My Plan
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Aapka subscription aur payment history
          </p>
        </div>
      </div>

      {/* ── HERO PLAN CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto mb-6"
      >
        {hasActive ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-[1.5px] shadow-2xl shadow-emerald-500/20">
            <div className="relative rounded-[22px] bg-slate-900/95 backdrop-blur px-6 py-7 md:px-8 md:py-8 overflow-hidden">
              {/* ambient glow */}
              <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                    <Crown size={12} /> Active Plan
                  </span>

                  <h2 className="text-white text-4xl font-black mt-4 tracking-tight flex items-center gap-3">
                    {sub.current_plan_name}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isFree
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {isFree ? "FREE" : "PAID"}
                    </span>
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-slate-300 text-sm">
                    {sub.current_duration_label && (
                      <span className="flex items-center gap-1.5">
                        <Zap size={14} className="text-emerald-400" />
                        {sub.current_duration_label}
                      </span>
                    )}
                    {sub.plan_activated_at && (
                      <span className="flex items-center gap-1.5">
                        <CalendarClock size={14} className="text-cyan-400" />
                        {new Date(sub.plan_activated_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    )}
                  </div>

                  {sub.last_transaction_id && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                      <Receipt size={12} className="text-slate-400" />
                      <span className="text-[11px] text-slate-300 font-mono">
                        {sub.last_transaction_id}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate("/pro")}
                  className="group flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-emerald-50 text-sm font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:scale-105 whitespace-nowrap"
                >
                  Upgrade Plan
                  <ArrowUpRight
                    size={16}
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </button>
              </div>

              {/* stat strip */}
              <div className="relative grid grid-cols-3 gap-3 mt-7 pt-6 border-t border-white/10">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                    Payments
                  </p>
                  <p className="text-white text-xl font-extrabold mt-0.5">
                    {paidCount}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                    Total Spent
                  </p>
                  <p className="text-white text-xl font-extrabold mt-0.5">
                    ₹{totalSpent}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                    Status
                  </p>
                  <p className="text-emerald-400 text-xl font-extrabold mt-0.5">
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-800/50 border border-white/10 px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Crown size={28} className="text-emerald-400" />
            </div>
            <p className="text-white text-lg font-bold mb-1">
              Koi active plan nahi
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Pro ban ke ad-free music, HD audio aur unlimited downloads
              paayein.
            </p>
            <button
              onClick={() => navigate("/pro")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold px-6 py-3 rounded-2xl transition-all shadow-lg hover:scale-105"
            >
              <Sparkles size={16} /> Explore Plans
            </button>
          </div>
        )}
      </motion.div>

      {/* ── TRANSACTION HISTORY ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={18} className="text-slate-400" />
          <h2 className="text-white text-lg font-bold">Transaction History</h2>
          <span className="text-slate-500 text-xs">({orders.length})</span>
        </div>

        <div className="rounded-2xl bg-slate-800/40 border border-white/10 overflow-hidden">
          {orders.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CreditCard size={30} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Abhi tak koi transaction nahi hui.
              </p>
            </div>
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">
                        Date
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Plan
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Transaction ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const free =
                        Number(o.amount) === 0 || o.payment_type === "free";
                      return (
                        <tr
                          key={o.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            <span className="block text-[11px] text-slate-500">
                              {new Date(o.created_at).toLocaleTimeString(
                                "en-IN",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-white font-semibold">
                              {o.plan_name || "—"}
                            </span>
                            {o.duration_label && (
                              <span className="block text-[11px] text-slate-500">
                                {o.duration_label}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`font-bold ${
                                free ? "text-blue-400" : "text-emerald-400"
                              }`}
                            >
                              {free ? "FREE" : `₹${o.amount}`}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={o.status} free={free} />
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-slate-400 text-[11px] font-mono">
                              {o.razorpay_payment_id || (free ? "FREE" : "—")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* mobile cards */}
              <div className="md:hidden divide-y divide-white/5">
                {orders.map((o) => {
                  const free =
                    Number(o.amount) === 0 || o.payment_type === "free";
                  return (
                    <div key={o.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-bold text-sm">
                            {o.plan_name || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(o.created_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <StatusPill status={o.status} free={free} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-bold ${
                            free ? "text-blue-400" : "text-emerald-400"
                          }`}
                        >
                          {free ? "FREE" : `₹${o.amount}`}
                          {o.duration_label ? ` · ${o.duration_label}` : ""}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {o.razorpay_payment_id || (free ? "FREE" : "—")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MyPlan;
