import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Music4,
  Calendar,
  Mail,
  Hash,
  CreditCard,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const PaymentReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const receipt = location.state?.receipt;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white/70 gap-4">
        <p className="text-sm">Koi receipt data nahi mila.</p>
        <button
          onClick={() => navigate("/")}
          className="text-emerald-400 text-sm font-semibold underline"
        >
          Home par jao
        </button>
      </div>
    );
  }

  const formattedDate = new Date(receipt.paidAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${API_BASE}/api/orders/${receipt.orderId}/receipt`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setDownloadError(errData?.message || "Receipt download nahi ho paayi.");
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TuneRaaga_Receipt_${receipt.orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Receipt download error:", err);
      setDownloadError("Network error — backend chal raha hai check karo.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full min-h-screen -mx-4 md:-mx-8 -mt-4 bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-emerald-500/20">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 pt-8 pb-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-3 border border-white/30">
                <Music4 size={28} className="text-white" />
              </div>
              <h1 className="text-white text-lg font-extrabold tracking-tight">
                TuneRaaga
              </h1>
              <p className="text-white/80 text-[11px] mt-0.5">
                Payment Receipt
              </p>
            </div>
          </div>

          <div className="flex justify-center -mt-6 relative z-10">
            <div className="bg-slate-800 border border-emerald-500/40 rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="text-white text-sm font-bold">
                Payment Successful
              </span>
            </div>
          </div>

          <div className="px-6 pt-6 pb-8">
            <div className="text-center mb-6">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
                Amount Paid
              </p>
              <p className="text-white text-3xl font-extrabold">
                ₹{receipt.amount}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <span className="flex items-center gap-2 text-white/50 text-xs">
                  <Music4 size={13} /> Plan
                </span>
                <span className="text-white text-xs font-semibold">
                  {receipt.planName} · {receipt.durationLabel}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <span className="flex items-center gap-2 text-white/50 text-xs">
                  <Mail size={13} /> Email
                </span>
                <span className="text-white text-xs font-semibold truncate max-w-[55%] text-right">
                  {receipt.email}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <span className="flex items-center gap-2 text-white/50 text-xs">
                  <Calendar size={13} /> Date
                </span>
                <span className="text-white text-xs font-semibold">
                  {formattedDate}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <span className="flex items-center gap-2 text-white/50 text-xs">
                  <CreditCard size={13} /> Payment ID
                </span>
                <span className="text-white text-[11px] font-mono">
                  {receipt.paymentId}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <span className="flex items-center gap-2 text-white/50 text-xs">
                  <Hash size={13} /> Order ID
                </span>
                <span className="text-white text-[11px] font-mono truncate max-w-[55%] text-right">
                  {receipt.orderId}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-white/10 text-center">
              <p className="text-white/30 text-[10px]">
                Thank you for going Pro with TuneRaaga 🎶
              </p>
            </div>
          </div>
        </div>

        {downloadError && (
          <p className="text-red-400 text-xs mt-3 text-center">
            {downloadError}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {downloading ? "Generating..." : "Download Receipt"}
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Go Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentReceipt;
