import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
  ListMusic,
  Podcast,
  Mic2,
  Search,
  Bell,
  User,
  Home,
  Music,
  X,
  Info,
  BookOpen,
  TrendingUp,
  Users,
  Menu,
} from "lucide-react";
import Footer from "./Footer";

// ─── Colors ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const NavItem = ({ icon: Icon, label, to, sidebarOpen }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="block">
      <button
        className={`flex items-center gap-4 px-3 py-2.5 w-full rounded-lg transition-all duration-200 group relative ${
          isActive
            ? "text-white shadow-md"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
        style={isActive ? { background: BLUE_GRADIENT } : {}}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
      </button>
    </Link>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile menu items (Only Tune Raaga)
  const mobileMenuItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/about", label: "Our DNA", icon: Info },
    { path: "/knowledge", label: "Knowledge", icon: BookOpen },
    { path: "/reached", label: "Reached", icon: TrendingUp },
    { path: "/audience", label: "Audience", icon: Users },
    { path: "/what", label: "What we offer", icon: Info },
  ];

  // Desktop Sidebar Browse Items
  const browseItems = [
    { path: "/music", label: "Music", icon: Music },
    { path: "/new-release", label: "New Release", icon: Star },
    { path: "/top-chart", label: "TopChart", icon: TrendingUp },
    { path: "/top-playlist", label: "TopPlayList", icon: ListMusic },
    { path: "/podcast", label: "Podcast", icon: Podcast },
    { path: "/topartist", label: "TopArtist", icon: Mic2 },
  ];

  // Desktop Sidebar Tune Raaga Items
  const tuneraagaItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/about", label: "Our DNA", icon: Info },
    { path: "/knowledge", label: "Knowledge", icon: BookOpen },
    { path: "/reached", label: "Reached", icon: TrendingUp },
    { path: "/audience", label: "Audience", icon: Users },
    { path: "/what", label: "What we offer", icon: Info },
  ];

  // MOBILE VIEW
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Mobile Top Navbar */}
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/tuneraaga.png"
                alt="Tune Raaga"
                className="h-8 w-auto"
              />
            </Link>

            {/* Right Icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
              >
                <User className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b border-slate-200 shadow-lg"
            >
              <div className="px-4 py-3 space-y-1">
                {mobileMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      location.pathname === item.path
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6">
          <Outlet context={{ searchQuery }} />
        </main>

        {/* Footer for Mobile */}
        <Footer />
      </div>
    );
  }

  // DESKTOP VIEW (Original Sidebar)
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
              <Link
                to="/"
                className="flex items-center p-2 rounded-lg"
                style={{ background: "rgba(0, 0, 0, 0.03)" }}
              >
                <img
                  src="/tuneraaga.png"
                  alt="Tune Raaga Logo"
                  className="h-20 w-52 object-cover"
                />
              </Link>
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto shadow-md"
                style={{ background: BLUE_GRADIENT }}
              >
                <Play className="w-5 h-5 fill-white text-white" />
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          {sidebarOpen && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mb-6 mx-2">
              <button
                onClick={() => setActiveTab("browse")}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  activeTab === "browse"
                    ? "text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                style={
                  activeTab === "browse" ? { background: BLUE_GRADIENT } : {}
                }
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab("tuneraaga")}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  activeTab === "tuneraaga"
                    ? "text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                style={
                  activeTab === "tuneraaga" ? { background: BLUE_GRADIENT } : {}
                }
              >
                Tune Raaga
              </button>
            </div>
          )}

          <nav className="flex flex-col gap-2">
            {activeTab === "browse" && (
              <>
                {browseItems.map((item) => (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    sidebarOpen={sidebarOpen}
                  />
                ))}
              </>
            )}

            {activeTab === "tuneraaga" && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <span
                  className={`text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 ${!sidebarOpen && "text-center"}`}
                >
                  {sidebarOpen ? "Menu" : ""}
                </span>
                {tuneraagaItems.map((item) => (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    sidebarOpen={sidebarOpen}
                  />
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:text-white hover:border-blue-500 transition-colors z-50 shadow-sm text-slate-600"
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = BLUE_GRADIENT)
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
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
                placeholder="Search movies, shows, genres..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
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

            {/* Right Icons */}
            <div className="hidden md:flex items-center gap-4 bg-white p-2 pl-6 rounded-full border border-slate-200 shadow-sm absolute right-4 md:right-12 top-1/2 -translate-y-1/2">
              <Bell className="w-5 h-5 text-slate-500 hover:text-blue-600 cursor-pointer transition-colors relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
              </Bell>
              <div
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:ring-2 ring-blue-500 transition-all overflow-hidden"
                onClick={() => navigate("/login")}
              >
                <User className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content with Footer */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 md:px-8 pb-10">
            <Outlet context={{ searchQuery }} />
          </div>
          {/* Footer for Desktop */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
