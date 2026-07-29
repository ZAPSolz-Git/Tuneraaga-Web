import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  X,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { toastEvents } from "../utils/toastEvents";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Auth({ onClose, onSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false); // resend button dikhane ke liye

  // 🔎 DIAGNOSTIC: kaunse Supabase project pe request ja rahi hai — console mein dekho.
  // Ye wahi project hona chahiye jahan Authentication → Users mein tumhara user dikhta hai.
  useEffect(() => {
    console.log(
      "[Auth] Supabase URL:",
      import.meta.env.VITE_SUPABASE_URL || "❌ VITE_SUPABASE_URL MISSING",
    );
  }, []);

  const resetMessages = () => {
    setError("");
    setInfoMessage("");
    setNeedsConfirm(false);
  };

  // ─── RESEND CONFIRMATION EMAIL ───
  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Pehle email daalein.");
      return;
    }
    setLoading(true);
    resetMessages();
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendErr) {
        setError(resendErr.message);
      } else {
        setInfoMessage(
          "Confirmation email dobara bhej di gayi. Inbox (aur spam) check karo.",
        );
      }
    } catch (err) {
      console.error("Resend confirmation error:", err);
      setError("Confirmation email bhejne mein error aaya.");
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ───
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }
      setInfoMessage(
        data.message ||
          "If this email is registered, a reset link has been sent.",
      );
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── LOGIN / SIGNUP ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    // ── LOGIN ──
    if (mode === "login") {
      if (!email || !password) {
        setError("Email and password are required.");
        return;
      }

      setLoading(true);
      try {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          console.error("Login error:", loginError.message);
          const msg = loginError.message.toLowerCase();
          if (msg.includes("email not confirmed")) {
            setError(
              "Email verify nahi hui. Inbox check karke confirmation link click karo.",
            );
            setNeedsConfirm(true);
          } else if (msg.includes("invalid login")) {
            setError(
              "Galat email ya password — ya email abhi confirm nahi hui. (Neeche Resend try karo, ya Supabase mein 'Confirm email' OFF karo.)",
            );
            setNeedsConfirm(true);
          } else {
            setError(loginError.message);
          }
          return;
        }

        if (data?.session) {
          toastEvents.show("Logged in successfully", "success");
          onSuccess ? onSuccess() : onClose?.();
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
        setError("Kuch galat ho gaya. Dobara try karein.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── SIGNUP ──
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(phone.trim())) {
      setError("Valid phone number daalein.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signupError) {
        console.error("Signup error:", signupError.message);
        const msg = signupError.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("already been")
        ) {
          setError("Ye email pehle se registered hai. Login karein.");
        } else if (msg.includes("rate limit")) {
          setError("Bahut zyada attempts. Kuch minute baad try karein.");
        } else {
          setError(signupError.message);
        }
        return;
      }

      if (data?.session) {
        // "Confirm email" OFF → seedha logged in
        toastEvents.show("Account created successfully", "success");
        onSuccess ? onSuccess() : onClose?.();
      } else {
        // "Confirm email" ON → confirm karna zaroori
        setInfoMessage(
          "Signup successful! Inbox (aur spam) check karke confirmation link click karein, phir login karein.",
        );
        setNeedsConfirm(true);
        setMode("login");
      }
    } catch (err) {
      console.error("Unexpected auth error:", err);
      setError("Kuch galat ho gaya. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8">
          {mode === "forgot" ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => {
                    setMode("login");
                    resetMessages();
                  }}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Forgot Password
                </h2>
              </div>
              <p className="text-slate-500 text-sm mb-6 ml-7">
                Enter your email, and we'll send you a reset link.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}
                {infoMessage && (
                  <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    {infoMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending
                      link...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} /> Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                {mode === "login" ? "Login" : "Create Account"}
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                {mode === "login"
                  ? "Log in to your account."
                  : "Naya account banayein, bas ek minute lagega."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full name"
                        className={inputCls}
                        autoComplete="name"
                      />
                    </div>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        className={inputCls}
                        autoComplete="tel"
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                    autoComplete="email"
                  />
                </div>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls.replace("pr-3", "pr-9")}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {mode === "login" && (
                  <div className="text-right -mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        resetMessages();
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}
                {infoMessage && (
                  <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    {infoMessage}
                  </div>
                )}

                {needsConfirm && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="w-full text-sm text-blue-600 font-semibold hover:underline disabled:opacity-60"
                  >
                    Resend confirmation email
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {mode === "login"
                        ? "Logging in..."
                        : "Creating account..."}
                    </>
                  ) : mode === "login" ? (
                    "Login"
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-sm text-slate-500">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        resetMessages();
                      }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("login");
                        resetMessages();
                      }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Log in
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
