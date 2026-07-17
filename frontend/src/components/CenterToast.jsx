// src/components/CenterToast.jsx
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

// ═══ Simple event bus ═══
const listeners = [];

export const centerToastEvents = {
  show(message, type = "success") {
    listeners.forEach((fn) => fn({ show: true, message, type }));
  },
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
};

// ═══ Icon helper ═══
function ToastIcon({ type }) {
  if (type === "success") {
    return (
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 size={24} className="text-green-600" />
      </div>
    );
  }
  if (type === "error") {
    return (
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle size={24} className="text-red-600" />
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
      <Info size={24} className="text-blue-600" />
    </div>
  );
}

// ═══ Component ═══
export default function CenterToast() {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [visible, setVisible] = useState(false); // for exit animation

  const hideToast = useCallback(() => {
    setVisible(false); // start exit animation
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
      setVisible(false);
    }, 300);
  }, []);

  useEffect(() => {
    const unsub = centerToastEvents.subscribe((newToast) => {
      setToast(newToast);
      setVisible(true);
    });
    return unsub;
  }, []);

  // Auto-hide after 2.5s
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(hideToast, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, hideToast]);

  if (!toast.show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div
        className={`
          pointer-events-auto
          flex items-center gap-3 px-7 py-5 rounded-2xl shadow-2xl
          border backdrop-blur-md
          transition-all duration-300 ease-in-out
          ${
            visible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-4"
          }
          ${
            toast.type === "success"
              ? "bg-white/95 border-green-200"
              : toast.type === "error"
                ? "bg-white/95 border-red-200"
                : "bg-white/95 border-blue-200"
          }
        `}
      >
        <ToastIcon type={toast.type} />
        <span
          className={`text-base font-semibold ${
            toast.type === "success"
              ? "text-green-800"
              : toast.type === "error"
                ? "text-red-800"
                : "text-blue-800"
          }`}
        >
          {toast.message}
        </span>
      </div>
    </div>
  );
}
