import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, ListMusic, Disc3, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PlaylistSidebar = ({ user, sidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPlaylists();
  }, [user, location.pathname]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error("Error fetching playlists:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Collapsed sidebar — just show a small icon
  if (!sidebarOpen) {
    return (
      <button
        onClick={() => navigate("/playlist/new")}
        className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
        title="My Playlists"
      >
        <ListMusic className="w-[18px] h-[18px]" />
      </button>
    );
  }

  // Expanded sidebar
  return (
    <div>
      {/* + New Playlist Button */}
      <button
        onClick={() => navigate("/playlist/new")}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-blue-600 font-semibold text-[13px] hover:bg-blue-50 transition-all group"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
          <Plus size={15} />
        </div>
        <span>New Playlist</span>
      </button>

      {/* MY PLAYLISTS Header */}
      <div className="mt-4 mb-1.5 px-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          My Playlists
        </p>
      </div>

      {/* Playlist List */}
      <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-slate-300" size={18} />
          </div>
        ) : playlists.length === 0 ? (
          <div className="px-4 py-4 text-center">
            <p className="text-[11px] text-slate-400">No playlists yet</p>
          </div>
        ) : (
          playlists.map((pl) => {
            const isActive = location.pathname === `/playlist/${pl.id}/edit`;
            return (
              <button
                key={pl.id}
                onClick={() => navigate(`/playlist/${pl.id}/edit`)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-all group ${
                  isActive
                    ? "text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      }
                    : {}
                }
              >
                {/* Cover */}
                <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-100">
                  {pl.cover_url ? (
                    <img
                      src={pl.cover_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3
                        size={12}
                        className={
                          isActive ? "text-blue-200" : "text-slate-400"
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="flex-1 text-[13px] font-medium truncate">
                  {pl.title}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlaylistSidebar;
