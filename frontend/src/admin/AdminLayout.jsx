import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Search,
  User,
  Home,
  Music,
  X,
  Info,
  TrendingUp, 
  Flame, 
  Users,
  LogOut,
  Upload, 
  ListMusic, 
  Sparkles, 
  Award,    
} from "lucide-react";
// --- UPDATED: Centralized Supabase Client Import ---
import { supabase } from "@/lib/supabaseClient";

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const NavItem = ({ icon: Icon, label, to, sidebarOpen }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="block">
      <button
        className={`flex items-center gap-4 px-3 py-2.5 w-full rounded-lg transition-all duration-200 group relative ${
          isActive
            ? "text-blue-600 font-semibold bg-blue-50"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
        {isActive && sidebarOpen && (
          <motion.div
            layoutId="adminIndicator"
            className="absolute left-0 w-1 h-5 rounded-r-full"
            style={{ background: BLUE_GRADIENT }}
          />
        )}
      </button>
    </Link>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed inset-0 flex bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: sidebarOpen ? 240 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full bg-white border-r border-slate-200 flex flex-col justify-between py-6 px-3 relative z-20 shadow-sm"
      >
        <div>
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-2 mb-6">
            {sidebarOpen ? (
              <div 
                className="flex items-center p-2 rounded-lg backdrop-blur-sm w-full justify-between cursor-pointer hover:bg-slate-100 transition-colors" 
          
                onClick={() => navigate('/admin')} 
                style={{ background: "rgba(0, 0, 0, 0.03)" }}
              >
                <span className="font-bold text-slate-900">Admin Panel</span>
              
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto cursor-pointer"
                style={{ background: BLUE_GRADIENT }}
                onClick={() => navigate('/admin')}
              >
                <Play className="w-5 h-5 fill-white text-white" />
              </div>
            )}
          </div>

          {/* Tabs */}
          {sidebarOpen && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mb-6 mx-2">
              <button
                onClick={() => setActiveTab("browse")}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  activeTab === "browse"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab("tuneraaga")}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  activeTab === "tuneraaga"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tune Raaga
              </button>
            </div>
          )}

          <nav className="flex flex-col gap-2">
            {activeTab === "browse" && (
              <>
                <NavItem to="/admin" icon={Home} label="Dashboard" sidebarOpen={sidebarOpen} />
                
                {/* TRENDING SONGS */}
                <NavItem to="/admin/trending-songs" icon={Flame} label="Trending Songs" sidebarOpen={sidebarOpen} />
                
                {/* LATEST RELEASES */}
                <NavItem to="/admin/latest-releases" icon={Sparkles} label="Latest Releases" sidebarOpen={sidebarOpen} />

                {/* TOP 10 INDIA */}
                <NavItem to="/admin/top-10-india" icon={Award} label="Top 10 India" sidebarOpen={sidebarOpen} />
                
                <NavItem to="/admin/top-charts" icon={TrendingUp} label="Top Charts" sidebarOpen={sidebarOpen} />
                <NavItem to="/admin/artist" icon={Music} label="Artist Management" sidebarOpen={sidebarOpen} />
                <NavItem to="/admin/top-playlists" icon={ListMusic} label="Top Playlists" sidebarOpen={sidebarOpen} />
                <NavItem to="/admin/songs" icon={Upload} label="Release Song" sidebarOpen={sidebarOpen} />
                
                <div className="border-t border-slate-200 my-2" />
                <NavItem to="/" icon={Home} label="Back to Home" sidebarOpen={sidebarOpen} />
              </>
            )}
            {activeTab === "tuneraaga" && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <NavItem to="/" icon={Home} label="Back to Home" sidebarOpen={sidebarOpen} />
              </>
            )}
          </nav>
        </div>

        {/* --- PROPER LOGOUT BUTTON --- */}
        <div className="px-2">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-4 px-3 py-2.5 w-full rounded-lg transition-all duration-200 group text-red-500 hover:text-red-600 hover:bg-red-50 ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors z-50 text-slate-500"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        {/* Top Search Bar */}
        <div className="sticky top-0 z-30 pointer-events-none bg-gradient-to-b from-slate-50 via-slate-50 to-transparent pb-2 pt-4">
          <div className="flex items-center justify-center px-4 md:px-12 pointer-events-auto relative">
            <div className="relative w-full max-w-lg">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin data..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4 bg-white p-2 pl-6 rounded-full border border-slate-200 shadow-sm absolute right-4 md:right-12 top-1/2 -translate-y-1/2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 ring-blue-500 transition-all overflow-hidden" style={{ background: BLUE_GRADIENT }}>
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet context={{ searchQuery }} />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
