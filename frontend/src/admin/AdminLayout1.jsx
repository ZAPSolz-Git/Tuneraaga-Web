import React, { useState, useEffect, useRef } from "react";
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
  Podcast,
  Radio,
  Flame,
  Users,
  LogOut,
  Upload,
  Inbox,
  ListMusic,
  Sparkles,
  Award,
  Music,
  Inbox,
  Megaphone,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import HeroBannerAdmin from "./HeroBannerAdmin";

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

// Name of the custom event HeroBannerAdmin.jsx fires right after a
// successful save. AdminLayout listens for this so the sidebar logo /
// top-bar text update immediately, without needing a full page refresh
// (a route change to the same "/admin*" layout does NOT remount this
// component, so the old mount-only useEffect never re-ran).
const ADMIN_BRANDING_EVENT = "admin-branding-updated";

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

  // ─── DYNAMIC ADMIN PANEL LOGO (set from admin/HeroBannerAdmin.jsx) ───
  // null = nothing uploaded yet -> keep showing the "Admin Panel" text
  // (matches previous static behaviour). Once an admin uploads a logo,
  // this switches to showing the image instead.
  const [adminLogoUrl, setAdminLogoUrl] = useState(null);
  const [adminTopText, setAdminTopText] = useState("");
  const [loadingAdminLogo, setLoadingAdminLogo] = useState(true);

  // ─── Profile dropdown (top-right avatar) ───
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
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

  // Close the profile dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  // ✅ Admin panel logo — fetched from the same singleton hero_banner row
  // that HeroBannerAdmin.jsx writes to. If nothing has been uploaded yet
  // (or the fetch fails), adminLogoUrl stays null and the sidebar falls
  // back to the "Admin Panel" text, same as before.
  //
  // Extracted into its own function (instead of only living inside the
  // mount-only useEffect) so it can ALSO be called again whenever
  // HeroBannerAdmin.jsx fires the ADMIN_BRANDING_EVENT after a save —
  // that's what makes the sidebar update immediately instead of needing
  // a manual page refresh.
  const fetchAdminLogo = async () => {
    setLoadingAdminLogo(true);
    try {
      const { data, error } = await supabase
        .from("hero_banner")
        .select("admin_panel_logo_url, admin_panel_top_text")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setAdminLogoUrl(data?.admin_panel_logo_url || null);
      setAdminTopText(data?.admin_panel_top_text || "");
    } catch (err) {
      console.error("Admin panel logo fetch failed, using text fallback:", err);
    } finally {
      setLoadingAdminLogo(false);
    }
  };

  useEffect(() => {
    fetchAdminLogo();

    // Re-fetch as soon as HeroBannerAdmin.jsx saves a change to the admin
    // logo / top-bar text, even though navigating to "/admin" doesn't
    // remount this layout.
    window.addEventListener(ADMIN_BRANDING_EVENT, fetchAdminLogo);
    return () =>
      window.removeEventListener(ADMIN_BRANDING_EVENT, fetchAdminLogo);
  }, []);

  return (
    <div className="fixed inset-0 flex bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: sidebarOpen ? 240 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full bg-white border-r border-slate-200 flex flex-col justify-between py-6 px-3 relative z-20 shadow-sm overflow-hidden"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-2 mb-6 flex-shrink-0">
            {sidebarOpen ? (
              <div
                className="group flex items-center justify-center p-3 rounded-xl w-full cursor-pointer bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden"
                onClick={() => navigate("/admin")}
              >
                {loadingAdminLogo ? (
                  // Brief skeleton while we check for an uploaded logo, so the
                  // text doesn't flash before the real logo pops in.
                  <div className="h-10 w-36 rounded-md bg-slate-200 animate-pulse" />
                ) : adminLogoUrl ? (
                  <img
                    src={adminLogoUrl}
                    alt="Admin Panel"
                    className="h-16 max-w-[200px] object-contain transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                ) : (
                  <span className="font-bold text-slate-900">Admin Panel</span>
                )}
              </div>
            ) : (
              <div
                className="group w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto cursor-pointer overflow-hidden bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                style={adminLogoUrl ? {} : { background: BLUE_GRADIENT }}
                onClick={() => navigate("/admin")}
              >
                {adminLogoUrl ? (
                  <img
                    src={adminLogoUrl}
                    alt="Admin Panel"
                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                ) : (
                  <Play className="w-5 h-5 fill-white text-white" />
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          {sidebarOpen && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mb-6 mx-2 flex-shrink-0">
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

          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <nav className="flex flex-col gap-2 pb-2">
              {activeTab === "browse" && (
                <>
                  <NavItem
                    to="/admin"
                    icon={Home}
                    label="Dashboard"
                    sidebarOpen={sidebarOpen}
                  />

                  {/* TRENDING SONGS */}
                  <NavItem
                    to="/admin/trending-songs"
                    icon={Flame}
                    label="Trending Songs"
                    sidebarOpen={sidebarOpen}
                  />

                  {/* LATEST RELEASES */}
                  <NavItem
                    to="/admin/latest-releases"
                    icon={Sparkles}
                    label="Latest Releases"
                    sidebarOpen={sidebarOpen}
                  />

                  {/* TOP 10 INDIA */}
                  <NavItem
                    to="/admin/top-10-india"
                    icon={Award}
                    label="Top 10 India"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/top-charts"
                    icon={TrendingUp}
                    label="Top Charts"
                    sidebarOpen={sidebarOpen}
                  />
                  <NavItem
                    to="/admin/artist"
                    icon={Music}
                    label="Artist Management"
                    sidebarOpen={sidebarOpen}
                  />
                  <NavItem
                    to="/admin/top-playlists"
                    icon={ListMusic}
                    label="Top Playlists"
                    sidebarOpen={sidebarOpen}
                  />
                  <NavItem
                    to="/admin/new-release"
                    icon={Upload}
                    label="Release Song"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/incoming-songs"
                    icon={Inbox}
                    label="Incoming Songs"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/ads"
                    icon={Megaphone}
                    label="Ads Manager"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/song-edit"
                    icon={Edit3}
                    label="Edit Songs"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/hero-banner"
                    icon={ImageIcon}
                    label="Hero Banner"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/podcasts"
                    icon={Podcast}
                    label="Podcast Admin"
                    sidebarOpen={sidebarOpen}
                  />

                  <NavItem
                    to="/admin/radio"
                    icon={Radio}
                    label="Radio Admin"
                    sidebarOpen={sidebarOpen}
                  />

                  <div className="border-t border-slate-200 my-2" />
                  <NavItem
                    to="/"
                    icon={Home}
                    label="Back to Home"
                    sidebarOpen={sidebarOpen}
                  />
                </>
              )}
              {activeTab === "tuneraaga" && (
                <>
                  <div className="border-t border-slate-200 my-2" />
                  <NavItem
                    to="/"
                    icon={Home}
                    label="Back to Home"
                    sidebarOpen={sidebarOpen}
                  />
                </>
              )}
            </nav>
          </div>

          {/* Logout Button - Fixed at Bottom */}
          <div className="px-2 flex-shrink-0 pt-2 border-t border-slate-200 mt-2">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-4 px-3 py-2.5 w-full rounded-lg transition-all duration-200 group text-red-500 hover:text-red-600 hover:bg-red-50 ${
                !sidebarOpen && "justify-center"
              }`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium text-sm">Logout</span>
              )}
            </button>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors z-50 text-slate-500"
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
          <div className="flex items-center justify-center gap-4 px-4 md:px-12 pointer-events-auto relative">
            {adminTopText && (
              <span
                className="hidden md:flex items-center gap-1.5 absolute left-4 md:left-12 top-1/2 -translate-y-1/2 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-bold text-white shadow-sm"
                style={{ background: BLUE_GRADIENT }}
              >
                <Sparkles size={13} className="text-white/90" />
                {adminTopText}
              </span>
            )}
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

            {/* Profile avatar + dropdown (Logout lives here now) */}
            <div
              ref={profileMenuRef}
              className="hidden md:flex items-center gap-4 bg-white p-2 pl-6 rounded-full border border-slate-200 shadow-sm absolute right-4 md:right-12 top-1/2 -translate-y-1/2"
            >
              <div
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 ring-blue-500 transition-all overflow-hidden"
                style={{ background: BLUE_GRADIENT }}
              >
                <User className="w-4 h-4 text-white" />
              </div>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Logout
                  </button>
                </div>
              )}
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
