import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Music,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

// Palette
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const NavItem = ({ icon: Icon, label, to, sidebarOpen }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="block">
      <button
        className={`flex items-center gap-4 px-3 py-3 w-full rounded-lg transition-all duration-200 group relative ${
          isActive
            ? "text-blue-600 font-semibold bg-blue-50"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
        {isActive && sidebarOpen && (
          <motion.div
            layoutId="artistIndicator"
            className="absolute left-0 w-1 h-5 rounded-r-full"
            style={{ background: BLUE_GRADIENT }}
          />
        )}
      </button>
    </Link>
  );
};

const ArtistLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [artistName, setArtistName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if artist is logged in
    const id = localStorage.getItem("artistId");
    const name = localStorage.getItem("artistName");
    
    if (!id) {
      navigate("/login"); // Redirect to Universal Login
    } else {
      setArtistName(name || "Artist");
    }

    // Responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("artistId");
    localStorage.removeItem("artistName");
    navigate("/login");
  };

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
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
             <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto" style={{ background: BLUE_GRADIENT }}>
                <Music className="w-5 h-5 fill-white text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg leading-tight">Artist</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Panel</p>
              </div>
            )}
          </div>

          <nav className="flex flex-col gap-2">
            <NavItem to="/artist/dashboard" icon={LayoutDashboard} label="My Dashboard" sidebarOpen={sidebarOpen} />
            <NavItem to="/artist/settings" icon={Settings} label="Account Settings" sidebarOpen={sidebarOpen} />
          </nav>
        </div>

        {/* User & Logout */}
        <div>
           <div className={`mb-4 px-3 ${sidebarOpen ? 'block' : 'hidden'}`}>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 font-semibold truncate">{artistName}</p>
                <p className="text-[10px] text-blue-500">Verified Artist</p>
              </div>
           </div>

           <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-500 hover:bg-red-50 transition-colors ${!sidebarOpen && 'justify-center'}`}
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
      
      {/* Main Content */}  
     
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-slate-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ArtistLayout;