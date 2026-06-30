import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { X, Mail, Lock, UserPlus, LogIn } from "lucide-react";

export default function Auth({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      if (isSignUp) alert("Check your email for the verification link!");
      else onClose();
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
        >
          <X size={24} />
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-500 mb-6">
            {isSignUp
              ? "Sign up to save your history & likes"
              : "Login to access your history & liked songs"}
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <input
                type="password"
                placeholder="Your password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                  {isSignUp ? "Sign Up" : "Login"}
                </>
              )}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 font-bold hover:underline"
            >
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
