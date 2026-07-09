import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Loader2,
  Music2,
  AlertCircle,
  X,
  Filter,
  Disc3,
  Play,
  Eye,
  Image as ImageIcon,
  Headphones,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000/api/content";

const AdminManageReleases = () => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFormat, setFilterFormat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLang, setFilterLang] = useState("All");
  const [previewSong, setPreviewSong] = useState(null);

  // Fetch all releases
  const fetchReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReleases(data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load releases", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // ✅ SECURE DELETE — Backend API, NO direct supabase.delete()
  // ═══════════════════════════════════════════════════════════
  const handleDelete = async (release) => {
    const result = await Swal.fire({
      title: "Delete Release?",
      html: `
        <div class="text-left">
          <p>Delete <strong>"${release.title}"</strong>?</p>
          <p class="text-xs text-slate-400 mt-1">
            ${release.primary_artist} · ${release.format} · ${release.language}
          </p>
          <p class="text-xs text-red-400 mt-2">This cannot be undone.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      showClass: { popup: "swal2-show" },
    });

    if (!result.isConfirmed) return;

    setDeletingId(release.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/releases/${release.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Failed to delete");

      Swal.fire("Deleted!", `"${release.title}" has been deleted.`, "success");
      fetchReleases();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Filters
  const filteredReleases = releases.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      (r.primary_artist || "").toLowerCase().includes(q) ||
      (r.album_name || "").toLowerCase().includes(q);
    const matchFormat = filterFormat === "All" || r.format === filterFormat;
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchLang = filterLang === "All" || r.language === filterLang;
    return matchSearch && matchFormat && matchStatus && matchLang;
  });

  const formats = [
    "All",
    ...Array.from(new Set(releases.map((r) => r.format).filter(Boolean))),
  ];
  const statuses = ["All", "Published", "Draft"];
  const languages = [
    "All",
    ...Array.from(
      new Set(releases.map((r) => r.language).filter(Boolean)),
    ).sort(),
  ];

  const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return String(num);
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Manage <span className="text-teal-600">Releases</span>
        </h2>
        <p className="text-slate-500 text-sm">
          View and delete published songs and albums.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, artist, or album..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            {formats.map((f) => (
              <option key={f} value={f}>
                {f === "All" ? "All Formats" : f}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Status" : s}
              </option>
            ))}
          </select>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l === "All" ? "All Languages" : l}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-400">
            {filteredReleases.length} of {releases.length} releases
          </span>
        </div>
      </div>

      {/* Releases List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      ) : filteredReleases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Music2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            No Releases Found
          </h3>
          <p className="text-slate-400 text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[44px_1fr_160px_100px_80px_80px_80px_50px] gap-2 px-4 py-2.5 bg-slate-100 rounded-t-xl border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div></div>
            <div>Title / Album</div>
            <div>Artist</div>
            <div>Language</div>
            <div>Format</div>
            <div>Status</div>
            <div>Plays</div>
            <div></div>
          </div>

          <div className="border border-t-0 border-slate-200 rounded-b-xl overflow-hidden">
            {filteredReleases.map((release) => (
              <div
                key={release.id}
                className="grid grid-cols-[44px_1fr_160px_100px_80px_80px_80px_50px] gap-2 items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group"
              >
                {/* Cover */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                  <img
                    src={release.cover_url || "https://via.placeholder.com/40"}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40";
                    }}
                  />
                </div>

                {/* Title */}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {release.title}
                  </p>
                  {release.album_name && (
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <Disc3 size={10} /> {release.album_name}
                    </p>
                  )}
                </div>

                {/* Artist */}
                <p className="text-xs text-slate-500 truncate">
                  {release.primary_artist || "—"}
                </p>

                {/* Language */}
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold w-fit">
                  {release.language || "—"}
                </span>

                {/* Format */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-fit ${
                    release.format === "Album"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-teal-50 text-teal-600"
                  }`}
                >
                  {release.format || "—"}
                </span>

                {/* Status */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-fit ${
                    release.status === "Published"
                      ? "bg-green-50 text-green-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {release.status || "—"}
                </span>

                {/* Plays */}
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                  <Headphones size={9} /> {formatCount(release.play_count || 0)}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(release)}
                  disabled={deletingId === release.id}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all flex-shrink-0 disabled:opacity-50"
                  title="Delete release"
                >
                  {deletingId === release.id ? (
                    <Loader2 size={15} className="animate-spin text-red-400" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Preview Modal */}
      <AnimatePresence>
        {previewSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
            onClick={() => setPreviewSong(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 truncate">
                  {previewSong.title}
                </h3>
                <button
                  onClick={() => setPreviewSong(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={
                    previewSong.cover_url || "https://via.placeholder.com/60"
                  }
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/60";
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {previewSong.primary_artist}
                  </p>
                  <p className="text-xs text-slate-400">
                    {previewSong.format} · {previewSong.language}
                  </p>
                </div>
              </div>
              {previewSong.audio_url && (
                <audio
                  controls
                  autoPlay
                  className="w-full"
                  src={previewSong.audio_url}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManageReleases;
