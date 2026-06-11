// pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Shield, Mic, User, Lock, ArrowLeft } from "lucide-react";

const FloatingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </div>
  );
};

const LoginPage = () => {
  const [loginType, setLoginType] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Clear any existing sessions on component mount
  useEffect(() => {
    const clearSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          console.log("Session exists, clearing...");
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    clearSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prevent multiple login attempts
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      // First, sign out any existing session
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.log("Sign out error (can be ignored):", signOutErr);
      }

      // Small delay to ensure sign out completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 1. SIGN IN WITH SUPABASE AUTH
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData || !authData.user) {
        throw new Error("Invalid response from server");
      }

      const userId = authData.user.id;

      // 2. FETCH USER PROFILE WITH ROLE
      const { data: profileData, error: profileError } = await supabase
        .from("artists")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Error fetching user profile");
      }

      if (!profileData) {
        throw new Error(
          "User profile not found in database. Please contact support.",
        );
      }

      const userRole = profileData.role;

      // 3. ROLE-BASED ACCESS CONTROL
      if (loginType === "admin") {
        // Check if user has admin role
        if (userRole !== "admin") {
          await supabase.auth.signOut(); // Sign out if wrong role
          throw new Error(
            "Access denied. This account does not have admin privileges.",
          );
        }

        console.log("Admin Login Success:", profileData);

        // Clear any existing data
        localStorage.removeItem("artistId");
        localStorage.removeItem("artistName");
        localStorage.removeItem("artistEmail");

        // Set admin data
        localStorage.setItem("adminId", profileData.id);
        localStorage.setItem(
          "adminName",
          profileData.name || profileData.email,
        );
        localStorage.setItem("adminEmail", profileData.email);
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userId", profileData.id);

        // Navigate with replace to prevent back button issues
        navigate("/admin", { replace: true });
      } else if (loginType === "artist") {
        // Check if user has artist role
        if (userRole !== "artist") {
          await supabase.auth.signOut(); // Sign out if wrong role
          throw new Error(
            "Access denied. Admin accounts cannot login as artists. Please use Admin Portal.",
          );
        }

        console.log("Artist Login Success:", profileData);

        // Clear any existing data
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminEmail");

        // Set artist data
        localStorage.setItem("artistId", profileData.id);
        localStorage.setItem(
          "artistName",
          profileData.name || profileData.email,
        );
        localStorage.setItem("artistEmail", profileData.email);
        localStorage.setItem("userRole", "artist");
        localStorage.setItem("userId", profileData.id);

        // Navigate with replace to prevent back button issues
        navigate("/artist/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err);

      // Custom error messages for better UX
      let errorMessage = err.message || "Login failed. Please try again.";

      if (err.message.includes("Invalid login credentials")) {
        errorMessage = "❌ Invalid email or password. Please try again.";
      } else if (err.message.includes("admin privileges")) {
        errorMessage =
          "❌ This account is not an admin. Please login as Artist.";
      } else if (
        err.message.includes("Admin accounts cannot login as artists")
      ) {
        errorMessage =
          "❌ Admin accounts cannot login as Artists. Please login as Admin.";
      } else if (err.message.includes("profile not found")) {
        errorMessage = "❌ User profile not found. Please contact support.";
      }

      setError(errorMessage);

      // Sign out on error to clear any partial session
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.log("Sign out error on catch:", signOutErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-3xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
      >
        {/* Role Selector */}
        <div className="bg-slate-100 p-1 rounded-xl mb-8 flex relative">
          <div
            className={`absolute top-1 bottom-1 w-1/2 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out ${
              loginType === "admin" ? "left-1" : "left-[calc(50%-4px)]"
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setError("");
            }}
            className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors duration-300 ${
              loginType === "admin" ? "text-blue-600" : "text-slate-400"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("artist");
              setError("");
            }}
            className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors duration-300 ${
              loginType === "artist" ? "text-blue-600" : "text-slate-400"
            }`}
          >
            Artist
          </button>
        </div>

        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl bg-gradient-to-br text-white transition-colors duration-500"
            style={{
              background:
                loginType === "admin"
                  ? "linear-gradient(to bottom right, #2563eb, #4f46e5)"
                  : "linear-gradient(to bottom right, #db2777, #9333ea)",
            }}
          >
            {loginType === "admin" ? (
              <Shield size={40} strokeWidth={1.5} />
            ) : (
              <Mic size={40} strokeWidth={1.5} />
            )}
          </motion.div>

          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-2">
            {loginType === "admin" ? "Admin Portal" : "Artist Portal"}
          </h2>
          <p className="text-slate-500 font-medium">
            {loginType === "admin"
              ? "Secure access to dashboard"
              : "Access your music profile"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50/90 backdrop-blur border border-red-100 rounded-2xl text-red-600 text-sm text-center font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User
                  className={`h-5 w-5 transition-colors ${loginType === "admin" ? "text-blue-600" : "text-pink-600"}`}
                />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  loginType === "admin" ? "admin@email.com" : "artist@email.com"
                }
                className="block w-full pl-11 pr-3 py-4 border border-slate-200 rounded-xl leading-5 bg-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock
                  className={`h-5 w-5 transition-colors ${loginType === "admin" ? "text-blue-600" : "text-pink-600"}`}
                />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••"
                className="block w-full pl-11 pr-3 py-4 border border-slate-200 rounded-xl leading-5 bg-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 disabled:shadow-none hover:shadow-blue-500/40"
            style={{
              background:
                loginType === "admin"
                  ? "linear-gradient(to right, #2563eb, #4f46e5)"
                  : "linear-gradient(to right, #db2777, #9333ea)",
            }}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              `Login as ${loginType === "admin" ? "Admin" : "Artist"}`
            )}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-1 w-full"
          >
            <ArrowLeft size={14} /> Return to Home Page
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
