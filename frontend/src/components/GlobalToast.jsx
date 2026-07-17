// src/components/GlobalToast.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { toastEvents } from "../utils/toastEvents";

const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;
const SUCCESS_GRADIENT = "linear-gradient(135deg, #10b981, #059669)";
const ERROR_GRADIENT = "linear-gradient(135deg, #ef4444, #dc2626)";
const INFO_GRADIENT = "linear-gradient(135deg, #6366f1, #4f46e5)";

const ICON_MAP = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const GRADIENT_MAP = {
  success: SUCCESS_GRADIENT,
  error: ERROR_GRADIENT,
  info: INFO_GRADIENT,
};

const TOAST_DURATION = 3500;

const ToastItem = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const Icon = ICON_MAP[toast.type] || CheckCircle2;
  const gradient = GRADIENT_MAP[toast.type] || BLUE_GRADIENT;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl min-w-[300px] max-w-[400px]"
      style={{ background: gradient }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
          animation: "shimmer 2.5s infinite",
        }}
      />

      <div className="relative flex items-center gap-3 px-5 py-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-white" />
        </div>

        {/* Message */}
        <p className="flex-1 text-[13.5px] font-semibold text-white leading-snug">
          {toast.message}
        </p>

        {/* Close */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-black/10">
        <motion.div
          className="h-full bg-white/40"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default function GlobalToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts((prev) => {
      // Prevent duplicate messages
      if (prev.some((t) => t.message === toast.message)) return prev;
      return [...prev, toast];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return toastEvents.subscribe(addToast);
  }, [addToast]);

  return (
    <div
      className="fixed z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      style={{
        bottom: "32px",
        right: "24px",
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
