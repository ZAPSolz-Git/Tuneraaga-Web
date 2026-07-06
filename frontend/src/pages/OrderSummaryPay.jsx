import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Loader2, QrCode, CreditCard, Tag } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TABS = [
  { key: "offers", label: "Offers", icon: Tag },
  { key: "upi", label: "UPI", icon: QrCode },
  { key: "card", label: "Debit / Credit Card", icon: CreditCard },
];

const OrderSummaryPay = () => {
  const { orderId } = useParams(); // /pro/pay/:orderId

  const [order, setOrder] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upi");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending | paid

  const pollRef = useRef(null);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");

      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr || !orderData) {
        setError("Order nahi mila.");
        setLoading(false);
        return;
      }

      const { data: planData } = await supabase
        .from("pro_plans")
        .select("name")
        .eq("id", orderData.plan_id)
        .single();

      setOrder(orderData);
      setPlan(planData);
      setPaymentStatus(orderData.status || "pending");
      setLoading(false);
    };

    fetchOrder();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  // Razorpay checkout popup khol kar payment lo — isme UPI (QR + intent) aur Card dono already honge
  const handlePayNow = async (preferredMethod) => {
    setPayError("");

    if (!window.Razorpay) {
      setPayError("Payment script load nahi hui. Page reload karke try karo.");
      return;
    }

    setPayLoading(true);
    try {
      const headers = await getAuthHeaders();

      const res = await fetch(
        `${API_BASE}/api/orders/${orderId}/create-razorpay-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPayError(data.message || "Payment shuru nahi ho paaya.");
        setPayLoading(false);
        return;
      }

      // preferredMethod ke hisaab se checkout ka display config
      const displayConfig =
        preferredMethod === "card"
          ? {
              blocks: {
                card: {
                  name: "Pay via Card",
                  instruments: [{ method: "card" }],
                },
              },
              sequence: ["block.card"],
              preferences: { show_default_blocks: false },
            }
          : {
              blocks: {
                upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
              },
              sequence: ["block.upi"],
              preferences: { show_default_blocks: false },
            };

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "TuneRaaga",
        description: `${plan?.name || "Pro Plan"} Purchase`,
        order_id: data.razorpay_order_id,
        config: { display: displayConfig },
        prefill: {
          email: order.email,
        },
        theme: { color: "#10b981" },
        handler: async function (response) {
          try {
            const verifyHeaders = await getAuthHeaders();
            const verifyRes = await fetch(
              `${API_BASE}/api/orders/${orderId}/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...verifyHeaders,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setPaymentStatus("paid");
            } else {
              setPayError(
                verifyData.message || "Payment verify nahi ho paayi.",
              );
            }
          } catch (e) {
            console.error("verify-payment error:", e);
            setPayError(
              "Payment hui lekin verify karte waqt error aaya. Support se contact karein.",
            );
          }
        },
        modal: {
          ondismiss: function () {
            setPayLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response.error);
        setPayError(response.error?.description || "Payment fail ho gayi.");
        setPayLoading(false);
      });

      rzp.open();
      setPayLoading(false);
    } catch (err) {
      console.error("handlePayNow error:", err);
      setPayError("Network error — backend chal raha hai check karo.");
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500 text-sm">{error}</div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto">
        {/* ── LEFT: PAYMENT METHODS ── */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Order Summary</h2>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                Amount
              </p>
              <p className="text-sm font-bold text-slate-800">
                ₹{order.amount}
              </p>
            </div>
          </div>

          <div className="flex">
            {/* tabs */}
            <div className="w-40 border-r border-slate-100 py-3">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-left border-l-2 transition-colors ${
                      isActive
                        ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                        : "border-transparent text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* tab content */}
            <div className="flex-1 p-6">
              {activeTab === "upi" && (
                <div>
                  {paymentStatus === "paid" ? (
                    <div className="text-emerald-600 text-sm font-bold">
                      ✅ Payment successful! Aapka plan activate ho gaya hai.
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        Pay by any UPI app
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        "Pay Now" click karke Razorpay ka secure checkout
                        khulega jisme QR scan ya UPI app se pay kar sakte ho.
                      </p>

                      <button
                        onClick={() => handlePayNow("upi")}
                        disabled={payLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        {payLoading && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        Pay Now via UPI
                      </button>

                      {payError && (
                        <p className="text-[11px] text-red-500 mt-3 max-w-sm">
                          ⚠️ {payError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "card" && (
                <div>
                  {paymentStatus === "paid" ? (
                    <div className="text-emerald-600 text-sm font-bold">
                      ✅ Payment successful! Aapka plan activate ho gaya hai.
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        Pay with Debit / Credit Card
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        "Pay Now" click karke Razorpay ka secure checkout
                        khulega jisme card details daal kar pay kar sakte ho.
                      </p>

                      <button
                        onClick={() => handlePayNow("card")}
                        disabled={payLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        {payLoading && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        Pay Now via Card
                      </button>

                      {payError && (
                        <p className="text-[11px] text-red-500 mt-3 max-w-sm">
                          ⚠️ {payError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "offers" && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Offers
                  </p>
                  <p className="text-xs text-slate-400">
                    Is order ke liye abhi koi offer available nahi hai.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: ORDER SUMMARY ── */}
        <div className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-fit">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Package Summary
          </h3>
          <div className="text-xs text-slate-500 mb-1">Email</div>
          <div className="text-sm text-slate-800 mb-4">{order.email}</div>

          <div className="text-xs text-slate-500 mb-1">Details</div>
          <div className="flex justify-between text-sm text-slate-800 mb-2">
            <span>{plan?.name} - (1 MONTH)</span>
            <span>₹{order.amount}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-100">
            <span>Grand Total</span>
            <span>₹{order.amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPay;
