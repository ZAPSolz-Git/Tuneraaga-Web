import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { X, Loader2, Mail, Lock } from "lucide-react";

export default function Auth({ onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const resetMessages = () => {
    setError("");
    setInfoMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password) {
      setError("Email aur password dono zaroori hain.");
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
              "Aapka email verify nahi hua. Apna inbox check karo aur confirmation link click karo.",
            );
          } else if (
            loginError.message.toLowerCase().includes("invalid login")
          ) {
            setError("Email ya password galat hai.");
          } else {
            setError(loginError.message);
          }
          return; // loading will still be reset in `finally` below
        }

        if (data?.session) {
          // Login successful — onAuthStateChange in the parent page will
          // pick this up automatically, so we just close the modal.
          onClose?.();
        }
      } else {
        // signup
        if (password.length < 6) {
          setError("Password kam se kam 6 characters ka hona chahiye.");
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
            setError("Yeh email pehle se registered hai. Login karo.");
          } else if (signupError.message.toLowerCase().includes("rate limit")) {
            setError(
              "Bahut zyada attempts ho gaye. Thodi der (kuch minute) ruk ke dobara try karo.",
            );
          } else {
            setError(signupError.message);
          }
          return;
        }

        if (data?.session) {
          // No email confirmation required — user is logged in immediately
          onClose?.();
        } else {
          // Email confirmation required
          setInfoMessage(
            "Signup ho gaya! Apna email inbox check karo aur confirmation link par click karo, uske baad login karo.",
          );
        }
      }
    } catch (err) {
      console.error("Unexpected auth error:", err);
      setError("Kuch galat ho gaya. Dobara try karo.");
    } finally {
      // ALWAYS reset loading — this is what stops the spinner from getting stuck
      setLoading(false);
    }
  };

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
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            {mode === "login" ? "Login" : "Create Account"}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {mode === "login"
              ? "Apne account mein login karo."
              : "Naya account banao, ek minute lagega."}
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
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
                  {mode === "login" ? "Logging in..." : "Creating account..."}
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
                Account nahi hai?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    resetMessages();
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign up karo
                </button>
              </>
            ) : (
              <>
                Pehle se account hai?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    resetMessages();
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Login karo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}