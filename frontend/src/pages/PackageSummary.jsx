import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, Gift, Info } from "lucide-react";
import { usePlayer } from "../components/PlayerContext";
import { supabase } from "../lib/supabaseClient";

const PackageSummary = () => {
  const { id: planId } = useParams(); // /pro/plan/:id
  const navigate = useNavigate();
  const { user } = usePlayer();

  const [plan, setPlan] = useState(null);
  const [prices, setPrices] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate(`/pro/login?plan=${planId}`);
      return;
    }

    const fetchPlanDetail = async () => {
      setLoading(true);
      setError("");

      const { data: planData, error: planErr } = await supabase
        .from("pro_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .single();

      if (planErr || !planData) {
        setError("Yeh plan available nahi hai.");
        setLoading(false);
        return;
      }

      const { data: priceData, error: priceErr } = await supabase
        .from("pro_plan_prices")
        .select("*")
        .eq("plan_id", planId)
        .order("sort_order", { ascending: true });

      if (priceErr) {
        setError("Pricing load nahi ho paayi.");
        setLoading(false);
        return;
      }

      setPlan(planData);
      setPrices(priceData || []);

      // default: is_popular price ya sabse pehla option select karo
      const defaultPrice =
        (priceData || []).find((p) => p.is_popular) || (priceData || [])[0];
      setSelectedPriceId(defaultPrice?.id || null);

      setLoading(false);
    };

    fetchPlanDetail();
  }, [planId, user, navigate]);

  const selectedPrice = prices.find((p) => p.id === selectedPriceId);

  const handleContinue = async () => {
    if (!selectedPrice) return;
    setSubmitting(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/api/ordersummarypay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          plan: planId,
          amount: selectedPrice.price,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError(
          `Server se sahi response nahi mila (status ${res.status}). Backend chal raha hai kya, aur API URL sahi hai kya, check karo.`,
        );
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.message || "Order create nahi ho paaya.");
        setSubmitting(false);
        return;
      }

      navigate(`/pro/pay/${data.order.id}`);
    } catch (err) {
      console.error(err);
      setError("Kuch galat ho gaya. Dobara try karein.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-white/60" size={28} />
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="text-center py-20 text-red-300 text-sm">{error}</div>
    );
  }

  return (
    <div className="w-full min-h-screen -mx-4 md:-mx-8 -mt-4 bg-slate-900 p-4 md:p-8">
      <h1 className="text-white text-xl font-extrabold mb-6">
        Package Summary
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── LEFT: PLAN CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full lg:flex-1 rounded-2xl overflow-hidden shadow-xl bg-white"
        >
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-extrabold">{plan.name}</h2>
              {plan.badge && (
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {plan.badge}
                </span>
              )}
            </div>
            {Array.isArray(plan.features) && plan.features.length > 0 && (
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-1.5">
                    <Check
                      size={13}
                      className="text-white/90 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs text-white/90 leading-tight">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── duration options ── */}
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {prices.map((p) => {
                const isSelected = p.id === selectedPriceId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPriceId(p.id)}
                    className={`text-left border rounded-xl p-3 transition-colors ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <Check size={10} className="text-white" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {p.strike_price && (
                            <span className="line-through text-slate-400 font-medium mr-1">
                              ₹{p.strike_price}
                            </span>
                          )}
                          ₹{p.price}{" "}
                          <span className="text-xs font-medium text-slate-500">
                            for {p.duration_label}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {p.plan_note || "Standard price plan"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border border-slate-200 rounded-xl p-3 mb-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
                Email ID
              </p>
              <p className="text-sm text-slate-700">{user?.email}</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 mb-5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
                Details
              </p>
              <div className="flex justify-between text-sm text-slate-700 mb-1">
                <span>
                  {plan.name} - ({selectedPrice?.duration_label})
                </span>
                <span>₹{selectedPrice?.price}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                <span>Grand Total</span>
                <span>₹{selectedPrice?.price}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              onClick={handleContinue}
              disabled={!selectedPrice || submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Continue with ₹{selectedPrice?.price ?? 0}
            </button>
          </div>
        </motion.div>

        {/* ── RIGHT: COUPONS ── */}
        <div className="w-full lg:w-72 bg-white rounded-2xl shadow-xl p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Coupons</h3>
          <div className="flex items-center gap-2 mb-6">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Select or Enter Coupon Code"
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            />
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              Apply
            </button>
          </div>
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <Info size={22} className="text-slate-300" />
            <p className="text-xs text-slate-400">
              There are no coupons that are available currently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageSummary;
