import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ==========================================
// SUPABASE IMPORT (Sirf Ek Baar)
// ==========================================
import { supabase } from "@/lib/supabaseClient";

// ==========================================
// ICONS IMPORT
// ==========================================
import {
  User,
  Lock,
  Shield,
  ArrowLeft,
  Music,
  Mic,
  Mic2,
  Headphones,
  Radio,
  Disc,
  Album,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Rewind,
  FastForward,
  PlayCircle,
  PauseCircle,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Airplay,
  RadioTower,
  Speaker,
  Waves,
  Zap,
  Sparkles,
  Star,
  Award,
  Crown,
  Heart,
  Bell,
  ListMusic,
  Shuffle,
  Repeat,
  Repeat1,
  LayoutList,
  Clapperboard,
  Film,
  Video,
  Image,
  Aperture,
  Circle,
  Hexagon,
  Diamond,
  Triangle,
} from "lucide-react";

const musicIconSet = [
  Music, Mic, Mic2, Headphones, Radio, Disc, Album, Play, Pause,
  SkipForward, SkipBack, Rewind, FastForward, PlayCircle, PauseCircle,
  Volume, Volume1, Volume2, VolumeX, Airplay, RadioTower, Speaker,
  Waves, Zap, Sparkles, Star, Award, Crown, Heart, Bell, ListMusic,
  Shuffle, Repeat, Repeat1, LayoutList, Clapperboard, Film, Video,
  Image, Aperture, Circle, Hexagon, Diamond, Triangle, Music, Mic,
  Headphones, Radio, Disc, Play, Pause, SkipForward, SkipBack, Rewind, FastForward,
];

// ... Baaki ka code (AntiGravityIcon, FloatingBackground, LoginPage component) same rahega ...

// ==========================================
// 2. ANTI-GRAVITY ICON COMPONENT
// ==========================================
const AntiGravityIcon = ({
  Icon,
  top,
  left,
  size,
  rotate,
  colorClass,
  delay,
  mouseRef,
}) => {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 120, damping: 20 });
  const y = useSpring(0, { stiffness: 120, damping: 20 });

  useEffect(() => {
    let animationFrameId;
    const updatePosition = () => {
      if (!ref.current || !mouseRef.current) return;
      const rect = ref.current.getBoundingClientRect();
      const iconX = rect.left + rect.width / 2;
      const iconY = rect.top + rect.height / 2;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const distX = mouseX - iconX;
      const distY = mouseY - iconY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      const maxDist = 350;
      if (distance < maxDist) {
        const force = (maxDist - distance) / maxDist;
        const moveX = -distX * force * 0.8;
        const moveY = -distY * force * 0.8;
        x.set(moveX);
        y.set(moveY);
      } else {
        x.set(0);
        y.set(0);
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };
    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ position: "absolute", top: top, left: left, x, y }}
      animate={{
        opacity: [0.3, 0.7, 0.3],
        scale: 1,
        rotate: [rotate - 15, rotate + 15, rotate - 15],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      whileHover={{
        scale: 1.4,
        rotate: 360,
        color: "#2563eb",
        transition: { duration: 0.5, type: "spring", stiffness: 200 },
      }}
      className={`${colorClass} drop-shadow-xl opacity-60`}
    >
      <Icon size={size} strokeWidth={1.5} />
    </motion.div>
  );
};

const FloatingBackground = () => {
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const iconsData = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => {
      const RandomIcon =
        musicIconSet[Math.floor(Math.random() * musicIconSet.length)];
      const colors = [
        "text-blue-700",
        "text-indigo-700",
        "text-cyan-700",
        "text-slate-600",
        "text-blue-600",
        "text-indigo-600",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      return {
        Icon: RandomIcon,
        top: Math.random() * 100 + "%",
        left: Math.random() * 100 + "%",
        size: 28 + Math.random() * 35,
        rotate: Math.random() * 360,
        colorClass: randomColor,
        delay: Math.random() * 2,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {iconsData.map((props, index) => (
        <AntiGravityIcon key={index} {...props} mouseRef={mouseRef} />
      ))}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-slate-100 z-[-1]" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px]" />
    </div>
  );
};

// ==========================================
// 3. LOGIN PAGE COMPONENT
// ==========================================
const LoginPage = () => {
  const [loginType, setLoginType] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

 
const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. SIGN IN WITH SUPABASE AUTH
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      const userId = authData.user.id;

      // 2. FETCH USER PROFILE WITH ROLE
      const { data: profileData, error: profileError } = await supabase
        .from("artists")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        throw new Error("User profile not found in database.");
      }

      const userRole = profileData.role;

      // 3. ROLE-BASED ACCESS CONTROL
      if (loginType === "admin") {
        // Check if user has admin role
        if (userRole !== "admin") {
          throw new Error("Access denied. This account does not have admin privileges.");
        }
        
        console.log("Admin Login Success:", profileData);
        localStorage.setItem("adminId", profileData.id);
        localStorage.setItem("adminName", profileData.name);
        localStorage.setItem("adminEmail", profileData.email);
        localStorage.setItem("userRole", "admin");
        
        navigate("/admin");
      } 
      else if (loginType === "artist") {
        // Check if user has artist role
        if (userRole !== "artist") {
          throw new Error("Access denied. Admin accounts cannot login as artists. Please use Admin Portal.");
        }
        
        console.log("Artist Login Success:", profileData);
        localStorage.setItem("artistId", profileData.id);
        localStorage.setItem("artistName", profileData.name);
        localStorage.setItem("artistEmail", profileData.email);
        localStorage.setItem("userRole", "artist");
        
        navigate("/artist/dashboard");
      }
      
    } catch (err) {
      console.error("Login Error:", err);
      
      // Custom error messages for better UX
      let errorMessage = err.message || "Login failed.";
      
      if (err.message.includes("admin privileges")) {
        errorMessage = "❌ This account is not an admin. Please login as Artist.";
      } else if (err.message.includes("Admin accounts cannot login as artists")) {
        errorMessage = "❌ Admin accounts cannot login as Artists. Please login as Admin.";
      } else if (err.message.includes("Invalid login credentials")) {
        errorMessage = "❌ Invalid email or password. Please try again.";
      }
      
      setError(errorMessage);
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
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
