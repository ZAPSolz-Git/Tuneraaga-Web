import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Info,
  Gift,
  ChevronRight,
  Sparkles,
  Music2,
  Loader2,
} from "lucide-react";
import { usePlayer } from "../components/PlayerContext";
import { supabase } from "../lib/supabaseClient";

const THEME_STYLES = {
  blue: {
    card: "bg-gradient-to-br from-blue-600 to-blue-700",
    button: "bg-white text-blue-700 hover:bg-blue-50",
    ribbon: "bg-blue-800",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-700 to-amber-800",
    button: "bg-amber-900/60 text-white hover:bg-amber-900",
    ribbon: "bg-amber-900",
  },
  green: {
    card: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    button: "bg-emerald-900/60 text-white hover:bg-emerald-900",
    ribbon: "bg-emerald-800",
  },
};

const PlanCard = ({ plan, index, onSelect }) => {
  const theme = THEME_STYLES[plan.theme] || THEME_STYLES.blue;

  // Cheapest / most-relevant price to headline on the card.
  // Full duration picker lives on the plan-detail page.
  const prices = plan.prices || [];
  const headlinePrice =
    prices.find((p) => p.is_popular) ||
    [...prices].sort((a, b) => a.price - b.price)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative rounded-2xl overflow-hidden shadow-lg ${theme.card} p-5 flex flex-col text-white`}
    >
      {plan.ribbon && (
        <span
          className={`absolute top-0 right-0 ${theme.ribbon} text-white text-[11px] font-bold px-3 py-1 rounded-bl-lg`}
        >
          {plan.ribbon}
        </span>
      )}

      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-extrabold">{plan.name}</h3>
        {plan.badge && (
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
            {plan.badge}
          </span>
        )}
        {plan.description && (
          <Info size={14} className="text-white/70" title={plan.description} />
        )}
      </div>

      {plan.description && !Array.isArray(plan.features)?.length && (
        <p className="text-sm text-white/90 mb-4 leading-snug">
          {plan.description}
        </p>
      )}

      {Array.isArray(plan.features) && plan.features.length > 0 && (
        <div className="grid grid-cols-2 gap-y-2 gap-x-2 mb-5">
          {plan.features.map((f) => (
            <div key={f} className="flex items-start gap-1.5">
              <Check size={13} className="text-white/90 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-white/90 leading-tight">{f}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto">
        {headlinePrice ? (
          <button
            onClick={() => onSelect(plan)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-bold text-sm transition-colors ${theme.button}`}
          >
            <span className="flex items-baseline gap-1.5">
              {headlinePrice.strike_price && (
                <span className="line-through text-xs opacity-60 font-medium">
                  ₹{headlinePrice.strike_price}
                </span>
              )}
              ₹{headlinePrice.price}
              <span className="text-[11px] font-medium opacity-70">
                / {headlinePrice.duration_label.toLowerCase()}
              </span>
            </span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => onSelect(plan)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-bold text-sm transition-colors ${theme.button}`}
          >
            View plans
            <ChevronRight size={16} />
          </button>
        )}
        {prices.length > 1 && (
          <p className="text-[11px] text-white/70 mt-2">
            {prices.length} pricing options available
          </p>
        )}
      </div>
    </motion.div>
  );
};

const ProPlans = () => {
  const navigate = useNavigate();
  const { user } = usePlayer();
  const [activeCategory, setActiveCategory] = useState("All");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError("");

      const { data: plansData, error: plansErr } = await supabase
        .from("pro_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (plansErr) {
        setError("Could not load plans right now. Please try again.");
        setLoading(false);
        return;
      }

      const { data: pricesData, error: pricesErr } = await supabase
        .from("pro_plan_prices")
        .select("*")
        .order("sort_order", { ascending: true });

      if (pricesErr) {
        setError("Could not load pricing. Please try again.");
        setLoading(false);
        return;
      }

      const merged = (plansData || []).map((plan) => ({
        ...plan,
        prices: (pricesData || []).filter((p) => p.plan_id === plan.id),
      }));

      setPlans(merged);
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(plans.map((p) => p.category))).filter(Boolean),
  ];

  const filteredPlans =
    activeCategory === "All"
      ? plans
      : plans.filter((p) => p.category === activeCategory);

  // ✅ Real Supabase UUID now, not a hardcoded string — /pro/plan/:id
  // will always find a matching row.
  const handleSelectPlan = (plan) => {
    if (!user) {
      navigate(`/pro/login?plan=${plan.id}`);
      return;
    }
    navigate(`/pro/plan/${plan.id}`);
  };

  // 🔧 FIX: pehle yeh navigate("/pro") kar raha tha — jo current page hi hai,
  // isliye button click karne par kuch nahi hota tha (same route par navigate
  // ka koi effect nahi hota). Ab yeh ek actual plan (jisme free-trial/popular
  // price hai, warna sabse pehla plan) ke Package Summary page par le jaata hai.
  const handleStartTrial = () => {
    if (loading) return; // plans abhi load ho rahe hain, thoda ruko

    // free-trial/popular price wala plan dhoondo, warna list ka pehla plan lo
    const trialPlan =
      plans.find((p) => p.prices?.some((pr) => pr.is_popular)) || plans[0];

    if (!trialPlan) {
      setError("Abhi koi plan available nahi hai.");
      return;
    }

    if (!user) {
      navigate(`/pro/login?plan=${trialPlan.id}`);
      return;
    }

    navigate(`/pro/plan/${trialPlan.id}`);
  };

  return (
    <div className="w-full min-h-screen -mx-4 md:-mx-8 -mt-4">
      <div className="bg-slate-900 rounded-2xl mx-4 md:mx-8 mt-4 p-4 md:p-8 shadow-xl">
        {/* ── TOP BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-violet-500 via-purple-500 to-emerald-400 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 mb-8"
        >
          <div className="hidden md:flex items-center justify-center w-40 h-28 flex-shrink-0">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-28 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl"
                    style={{
                      transform: `rotate(${(i - 1) * 12}deg) translateY(${i === 1 ? -8 : 4}px)`,
                    }}
                  />
                ))}
              </div>
              <Music2
                className="absolute inset-0 m-auto text-white/90"
                size={28}
              />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-white text-xl md:text-2xl font-extrabold leading-snug mb-4">
              Play without ads. Set new JioTunes every day. Download unlimited
              music.
            </h2>
            <button
              onClick={handleStartTrial}
              disabled={loading}
              className="bg-white text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm shadow-md hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              Start Free Trial
            </button>
          </div>
        </motion.div>

        <div className="border-t border-white/10 mb-6" />

        {/* ── HEADER + FILTERS ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-white text-2xl font-extrabold mb-1">
              Available Plans
            </h1>
            <p className="text-white/50 text-xs">Filter By Category</p>
          </div>
          <button
            onClick={() =>
              alert("Coupon redemption payment gateway ke saath aayega.")
            }
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-full transition-colors self-start md:self-auto"
          >
            <Gift size={15} /> Redeem Your Coupon
          </button>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-white text-slate-900"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── PLAN CARDS ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-white/60" size={28} />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-red-300 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
            {filteredPlans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={idx}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        )}

        {!loading && !error && filteredPlans.length === 0 && (
          <div className="text-center py-16 text-white/50 text-sm flex flex-col items-center gap-2">
            <Sparkles size={28} className="text-white/30" />
            No plans in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProPlans;
