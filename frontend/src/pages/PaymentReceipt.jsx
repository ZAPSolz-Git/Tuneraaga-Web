import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Calendar,
  Mail,
  Hash,
  CreditCard,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const LOGO_URL =
  "https://suaguciltgydkoyjmbmx.supabase.co/storage/v1/object/public/TuneRaaga/1781762603953_tuneraaga.png";

const PaymentReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const receipt = location.state?.receipt;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0B1A] text-white/60 gap-4">
        <p className="text-sm">Koi receipt data nahi mila.</p>
        <button
          onClick={() => navigate("/")}
          className="text-[#F2B705] text-sm font-semibold underline"
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
    <div className="w-full min-h-screen -mx-4 md:-mx-8 -mt-4 bg-[#0D0B1A] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-[#F2B705]/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-[#22D3AE]/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* ── TICKET STUB CARD ── */}
        <div className="relative rounded-[28px] shadow-[0_20px_60px_-15px_rgba(242,183,5,0.25)] overflow-visible">
          {/* top: event info */}
          <div className="bg-gradient-to-br from-[#1A1730] to-[#0D0B1A] rounded-t-[28px] px-6 pt-7 pb-8 text-center border border-b-0 border-white/10">
            <img
              src={LOGO_URL}
              alt="TuneRaaga"
              className="h-9 w-auto mx-auto mb-4 object-contain"
            />

            <div className="inline-flex items-center gap-1.5 text-[#22D3AE] mb-4">
              <CheckCircle2 size={16} />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                Payment Successful
              </span>
            </div>

            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1">
              Amount Paid
            </p>
            <p className="text-white text-4xl font-extrabold tracking-tight tabular-nums">
              ₹{receipt.amount}
            </p>

            <p className="text-white/50 text-xs mt-2">
              {receipt.planName} · {receipt.durationLabel}
            </p>
          </div>

          {/* perforated divider with punch notches */}
          <div className="relative h-0">
            <div className="absolute left-0 right-0 border-t-2 border-dashed border-white/15" />
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#0D0B1A]" />
            <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#0D0B1A]" />
          </div>

          {/* bottom: stub details */}
          <div className="bg-[#16132B] rounded-b-[28px] px-6 pt-8 pb-6 border border-t-0 border-white/10">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/40 text-[11px]">
                  <Mail size={13} /> Email
                </span>
                <span className="text-white/90 text-xs font-semibold truncate max-w-[60%] text-right">
                  {receipt.email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/40 text-[11px]">
                  <Calendar size={13} /> Date
                </span>
                <span className="text-white/90 text-xs font-semibold">
                  {formattedDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/40 text-[11px]">
                  <CreditCard size={13} /> Payment ID
                </span>
                <span className="text-white/90 text-[11px] font-mono">
                  {receipt.paymentId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/40 text-[11px]">
                  <Hash size={13} /> Order ID
                </span>
                <span className="text-white/90 text-[11px] font-mono truncate max-w-[60%] text-right">
                  {receipt.orderId}
                </span>
              </div>
            </div>

            {/* barcode strip — signature ticket detail */}
            <div className="mt-6 flex items-end gap-[2px] h-8 opacity-70">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/25"
                  style={{
                    width: 2,
                    height: [4, 8, 6, 8, 4, 8][i % 6] * 2.2,
                  }}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-white/25">
              <Sparkles size={11} />
              <p className="text-[10px]">
                Thank you for going Pro with TuneRaaga
              </p>
            </div>
          </div>
        </div>

        {downloadError && (
          <p className="text-red-400 text-xs mt-4 text-center">
            {downloadError}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-[#F2B705] hover:bg-[#e0a800] disabled:opacity-60 text-[#0D0B1A] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-[0_8px_24px_-6px_rgba(242,183,5,0.5)]"
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
            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3.5 rounded-2xl transition-colors border border-white/10"
          >
            Go Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentReceipt;
