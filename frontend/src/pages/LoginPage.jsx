// pages/LoginPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  Mic,
  User,
  Lock,
  ArrowLeft,
  Music,
  Music2,
  Music3,
  Music4,
  Headphones,
  Radio,
  Guitar,
  Drum,
  Volume2,
  AudioLines,
  ListMusic,
  PlayCircle,
  Heart,
  Star,
  Zap,
  Waves,
} from "lucide-react";

const MUSIC_ICONS = [
  Music,
  Music2,
  Music3,
  Music4,
  Headphones,
  Radio,
  Guitar,
  Drum,
  Volume2,
  Mic,
  AudioLines,
  ListMusic,
  PlayCircle,
  Heart,
  Star,
  Zap,
  Waves,
];

const GRADIENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#0ea5e9",
  "#f59e0b",
  "#84cc16",
];

const FloatingBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const icons = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const Icon = MUSIC_ICONS[i % MUSIC_ICONS.length];
      const size = Math.random() * 28 + 16;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      // Increased speed by 30% again (Duration decreased)
      const duration = Math.random() * 5 + 4;
      const delay = Math.random() * 8;
      const xMove = (Math.random() - 0.5) * 80;
      const yMove = -(Math.random() * 100 + 50);
      const color = GRADIENT_COLORS[i % GRADIENT_COLORS.length];
      const rotate = Math.random() * 360;

      return (
        <motion.div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            color: color,
            filter: `drop-shadow(0 0 6px ${color}99)`,
            opacity: Math.random() * 0.55 + 0.35,
          }}
          animate={{
            y: [0, yMove, 0],
            x: [0, xMove, 0],
            rotate: [rotate, rotate + 180, rotate + 360],
            scale: [1, 1.3, 1],
            opacity: [
              Math.random() * 0.55 + 0.35,
              Math.random() * 0.85 + 0.5,
              Math.random() * 0.55 + 0.35,
            ],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Icon size={size} strokeWidth={1.8} />
        </motion.div>
      );
    });
  }, []);

  return (
    // Container scaled to 120% so we don't see white edges when moving
    <motion.div
      className="absolute overflow-hidden"
      style={{ width: "120%", height: "120%", top: "-10%", left: "-10%" }}
      animate={{
        x: mousePos.x * 80, // Faster movement when cursor moves
        y: mousePos.y * 80,
      }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
    >
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      {icons}
    </motion.div>
  );
};

const LoginPage = () => {
  const [loginType, setLoginType] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.log("Sign out error (can be ignored):", signOutErr);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

      if (authError) throw new Error(authError.message);
      if (!authData || !authData.user)
        throw new Error("Invalid response from server");

      const userId = authData.user.id;

      const { data: profileData, error: profileError } = await supabase
        .from("artists")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Error fetching user profile");
      }

      if (!profileData)
        throw new Error(
          "User profile not found in database. Please contact support.",
        );

      const userRole = profileData.role;

      if (loginType === "admin") {
        if (userRole !== "admin") {
          await supabase.auth.signOut();
          throw new Error(
            "Access denied. This account does not have admin privileges.",
          );
        }
        localStorage.setItem("adminId", profileData.id);
        localStorage.setItem(
          "adminName",
          profileData.name || profileData.email,
        );
        localStorage.setItem("adminEmail", profileData.email);
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userId", profileData.id);
        navigate("/admin", { replace: true });
      } else if (loginType === "artist") {
        if (userRole !== "artist") {
          await supabase.auth.signOut();
          throw new Error(
            "Access denied. Admin accounts cannot login as artists. Please use Admin Portal.",
          );
        }
        localStorage.setItem("artistId", profileData.id);
        localStorage.setItem(
          "artistName",
          profileData.name || profileData.email,
        );
        localStorage.setItem("artistEmail", profileData.email);
        localStorage.setItem("userRole", "artist");
        localStorage.setItem("userId", profileData.id);
        navigate("/artist/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err);
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
    <div className="h-screen overflow-hidden bg-slate-50 flex items-center justify-center px-4 relative">
      <FloatingBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-3xl border border-white/60 p-5 md:p-7 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
      >
        <div className="bg-slate-100 p-1 rounded-xl mb-5 flex relative">
          <div
            className={`absolute top-1 bottom-1 w-1/2 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out ${loginType === "admin" ? "left-1" : "left-[calc(50%-4px)]"}`}
          />
          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setError("");
            }}
            className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors duration-300 ${loginType === "admin" ? "text-blue-600" : "text-slate-400"}`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("artist");
              setError("");
            }}
            className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors duration-300 ${loginType === "artist" ? "text-blue-600" : "text-slate-400"}`}
          >
            Artist
          </button>
        </div>

        {/* Removed all top/bottom margins around the logo */}
        <div className="text-center">
          <div className="flex justify-center">
            <motion.img
              whileHover={{ scale: 1.05, rotate: 5 }}
              src="/tuneraaga.png"
              alt="Tune Raaga Logo"
              className="w-[180px] sm:w-[220px] h-auto object-contain drop-shadow-lg"
            />
          </div>

          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
            {loginType === "admin" ? "Admin Portal" : "Artist Portal"}
          </h2>

          <p className="text-slate-500 font-medium text-sm mb-3">
            {loginType === "admin"
              ? "Secure access to dashboard"
              : "Access your music profile"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50/90 backdrop-blur border border-red-100 rounded-2xl text-red-600 text-sm text-center font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1.5 group">
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
                className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5 group">
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
                className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 disabled:shadow-none hover:shadow-blue-500/40"
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

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
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
