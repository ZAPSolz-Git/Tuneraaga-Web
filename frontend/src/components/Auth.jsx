// src/components/Auth.js
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  X,
  Loader2,
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { toastEvents } from "../utils/toastEvents";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Auth({ onClose, onSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const resetMessages = () => {
    setError("");
    setInfoMessage("");
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

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (loginError) {
          console.error("Login error:", loginError.message);
          if (
            loginError.message.toLowerCase().includes("email not confirmed")
          ) {
            setError(
              "Your email is not verified. Please check your inbox and click the confirmation link.",
            );
          } else if (
            loginError.message.toLowerCase().includes("invalid login")
          ) {
            setError("Invalid email or password.");
          } else {
            setError(loginError.message);
          }
          return;
        }

        if (data?.session) {
          toastEvents.show("Logged in successfully", "success");
          if (onSuccess) {
            onSuccess();
          } else {
            onClose?.();
          }
        }
      } else {
        // signup
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          return;
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) {
          console.error("Signup error:", signupError.message);
          if (
            signupError.message.toLowerCase().includes("already registered")
          ) {
            setError("This email is already registered. Please log in.");
          } else if (signupError.message.toLowerCase().includes("rate limit")) {
            setError(
              "Too many attempts. Please wait a few minutes and try again.",
            );
          } else {
            setError(signupError.message);
          }
          return;
        }

        if (data?.session) {
          toastEvents.show("Account created successfully", "success");
          if (onSuccess) {
            onSuccess();
          } else {
            onClose?.();
          }
        } else {
          setInfoMessage(
            "Signup successful! Please check your inbox and click the confirmation link to log in.",
          );
        }
      }
    } catch (err) {
      console.error("Unexpected auth error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ───
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
          {/* ═══ FORGOT PASSWORD MODE ═══ */}
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
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">
                    Email
                  </label>
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoComplete="email"
                    />
                  </div>
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
                      <Loader2 size={16} className="animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-sm text-slate-500">
                Remember your password?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    resetMessages();
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Log in
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ═══ LOGIN / SIGNUP MODE ═══ */}
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                {mode === "login" ? "Login" : "Create Account"}
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                {mode === "login"
                  ? "Log in to your account."
                  : "Create a new account, it only takes a minute."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">
                    Email
                  </label>
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">
                    Password
                  </label>
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
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {mode === "login" && (
                    <div className="mt-1.5 text-right">
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
