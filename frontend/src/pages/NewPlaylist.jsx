import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Plus,
  Check,
  Music2,
  ListMusic,
  Loader2,
  Trash2,
  Disc3,
  Play,
  Pause,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// ✅ Shared Player Hook (Exactly like NewRelease)
import {
  usePlayer,
  formatDuration,
  parseArtists,
} from "../components/PlayerContext";

// ✅ Helper: Supabase data ko player format mein map karna
const mapReleaseToSong = (release) => ({
  id: release.id,
  title: release.title,
  artist: release.primary_artist,
  featuringArtists: release.featuring_artists || "",
  actorNames: release.actor_names || "",
  movieName: release.movie_name || "",
  img: release.cover_url || "https://via.placeholder.com/300",
  audioUrl: release.audio_url,
  language: release.language || "",
  genre: release.genre || "",
  albumName: release.album_name || "",
  albumCoverUrl: release.album_cover_url || release.cover_url || "",
  duration: release.duration || 0,
  playCount: release.play_count || 0,
});

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 50, x: "-50%" }}
      className={`fixed bottom-24 left-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
        type === "success"
          ? "bg-green-50/95 border-green-200 text-green-800"
          : "bg-red-50/95 border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
      )}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </motion.div>
  );
};

const SongResultRow = ({ song, isAdded, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(song)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
      isAdded
        ? "bg-blue-50 border border-blue-200"
        : "hover:bg-slate-50 border border-transparent"
    }`}
  >
    <img
      src={song.img || "https://via.placeholder.com/44"}
      alt=""
      className="w-11 h-11 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
      onError={(e) => {
        e.target.src = "https://via.placeholder.com/44";
      }}
    />
    <div className="flex-1 min-w-0">
      <p
        className={`text-sm font-semibold truncate ${
          isAdded ? "text-blue-700" : "text-slate-900"
        }`}
      >
        {song.title}
      </p>
      <p className="text-xs text-slate-500 truncate mt-0.5">
        {song.artist}
        {parseArtists(song.featuringArtists).length > 0
          ? ` ft. ${parseArtists(song.featuringArtists).join(", ")}`
          : ""}
      </p>
    </div>
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        isAdded
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
      }`}
    >
      {isAdded ? <Check size={16} /> : <Plus size={16} />}
    </div>
  </button>
);

const NewPlaylist = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams();

  // ✅ Shared Player Context (Same as NewRelease)
  const { user, playing, currentSong, handleSongClick } = usePlayer();

  // Create modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  // Detail view
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const searchTimeoutRef = useRef(null);

  // If playlistId exists → load detail. If not → show create modal.
  useEffect(() => {
    if (!user) return;
    if (playlistId) {
      loadPlaylistDetail(playlistId);
    } else {
      setShowNameModal(true);
    }
  }, [playlistId, user]);

  const loadPlaylistDetail = async (id) => {
    setLoadingDetail(true);
    setErrorMsg("");
    setCurrentPlaylist(null);
    setSelectedSongs([]);
    try {
      const { data: pl, error: plErr } = await supabase
        .from("user_playlists")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (plErr) throw plErr;
      if (!pl) {
        setErrorMsg("Playlist not found.");
        setLoadingDetail(false);
        return;
      }
      setCurrentPlaylist(pl);

      const { data: rows, error: rErr } = await supabase
        .from("newcreate_playlist_songs")
        .select("release_id, position")
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      if (rErr) throw rErr;
      if (!rows || rows.length === 0) {
        setSelectedSongs([]);
        setLoadingDetail(false);
        return;
      }

      const ids = rows.map((r) => r.release_id).filter(Boolean);
      const { data: rels, error: relErr } = await supabase
        .from("releases")
        .select("*")
        .in("id", ids);
      if (relErr) throw relErr;

      // ✅ Map to player format
      const mappedSongs = rows
        .map((row) => {
          const rel = rels?.find((r) => r.id === row.release_id);
          return rel ? mapReleaseToSong(rel) : null;
        })
        .filter(Boolean);

      setSelectedSongs(mappedSongs);
    } catch (err) {
      console.error("Load detail error:", err);
      setErrorMsg("Failed to load: " + (err.message || ""));
    } finally {
      setLoadingDetail(false);
    }
  };

  // ✅ Fetch Songs Logic: Direct releases fetch karega jab panel khulega
  useEffect(() => {
    if (!showSearchPanel) return;

    const fetchSongs = async () => {
      setSearching(true);
      try {
        let query = supabase
          .from("releases")
          .select("*")
          .eq("status", "Published")
          .order("created_at", { ascending: false })
          .limit(30);

        if (searchQuery.trim()) {
          const q = searchQuery.trim();
          query = supabase
            .from("releases")
            .select("*")
            .eq("status", "Published")
            .or(
              `title.ilike.%${q}%,primary_artist.ilike.%${q}%,album_name.ilike.%${q}%`,
            )
            .limit(30);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching songs for playlist:", error.message);
          setSearchResults([]);
        } else {
          // ✅ Map to player format
          setSearchResults(data.map(mapReleaseToSong) || []);
        }
      } catch (e) {
        console.error("Catch error:", e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchQuery.trim()) {
      fetchSongs();
    } else {
      searchTimeoutRef.current = setTimeout(fetchSongs, 300);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, showSearchPanel]);

  const isSongSelected = useCallback(
    (sid) => selectedSongs.some((s) => s.id === sid),
    [selectedSongs],
  );

  const toggleSong = useCallback((song) => {
    setSelectedSongs((p) => {
      const ex = p.some((s) => s.id === song.id);
      if (ex) return p.filter((s) => s.id !== song.id);
      return [...p, song];
    });
  }, []);

  const removeSong = useCallback(
    async (sid) => {
      setSelectedSongs((p) => p.filter((s) => s.id !== sid));
      if (currentPlaylist?.id) {
        try {
          await supabase
            .from("newcreate_playlist_songs")
            .delete()
            .eq("playlist_id", currentPlaylist.id)
            .eq("release_id", sid);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [currentPlaylist?.id],
  );

  // Create Playlist
  const handleCreate = async () => {
    if (!user || !playlistName.trim()) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("user_playlists")
        .insert({ user_id: user.id, title: playlistName.trim() })
        .select()
        .single();
      if (error) {
        setErrorMsg(error.message);
        throw error;
      }
      setShowNameModal(false);
      setToast({
        message: `"${data.title}" created! Add songs now.`,
        type: "success",
      });
      navigate(`/playlist/${data.id}/edit`, { replace: true });
      setTimeout(() => setShowSearchPanel(true), 400);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Save Songs to Playlist
  const handleSaveSongs = async () => {
    if (!currentPlaylist || selectedSongs.length === 0) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const pid = currentPlaylist.id;
      await supabase
        .from("newcreate_playlist_songs")
        .delete()
        .eq("playlist_id", pid);

      const rows = selectedSongs.map((s, i) => ({
        playlist_id: pid,
        release_id: s.id,
        position: i,
      }));

      const { error } = await supabase
        .from("newcreate_playlist_songs")
        .insert(rows);

      if (error) {
        setErrorMsg(error.message);
        throw error;
      }

      if (!currentPlaylist.cover_url && selectedSongs[0]?.img) {
        await supabase
          .from("user_playlists")
          .update({ cover_url: selectedSongs[0].img })
          .eq("id", pid);
        setCurrentPlaylist((p) => ({
          ...p,
          cover_url: selectedSongs[0].img,
        }));
      }

      await loadPlaylistDetail(pid);
      setShowSearchPanel(false);
      setSearchQuery("");
      setToast({
        message: `${selectedSongs.length} song${
          selectedSongs.length !== 1 ? "s" : ""
        } saved!`,
        type: "success",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Direct Delete Playlist Option
  const handleDeletePlaylist = async () => {
    if (!currentPlaylist) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${currentPlaylist.title}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setSaving(true);
    setErrorMsg("");
    try {
      const { error } = await supabase
        .from("user_playlists")
        .delete()
        .eq("id", currentPlaylist.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setToast({ message: "Playlist deleted successfully", type: "success" });
      setTimeout(() => navigate(-1), 500);
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Failed to delete playlist: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Play Song using Shared Player Context
  const playSong = (song, list, index) => {
    handleSongClick(index, song, list);
  };

  // ═══════ LOADING / AUTH ═══════
  if (!user)
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ListMusic className="text-blue-500 mx-auto mb-4" size={28} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign in to use playlists
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );

  if (loadingDetail)
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="animate-spin text-blue-600 mx-auto mb-3"
            size={32}
          />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );

  // ═══════ CREATE MODAL ═══════
  if (showNameModal) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-slate-100"
        >
          <button
            onClick={() => navigate(-1)}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
            <Plus size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Create New Playlist
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Give your playlist a name
          </p>
          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {errorMsg}
            </div>
          )}
          <input
            type="text"
            value={playlistName}
            onChange={(e) => {
              setPlaylistName(e.target.value);
              setErrorMsg("");
            }}
            placeholder="e.g. Workout Mix"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && playlistName.trim()) handleCreate();
            }}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all mb-6"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!playlistName.trim() || saving}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </motion.div>
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ═══════ PLAYLIST DETAIL ═══════
  return (
    <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />
      <div className="relative px-4 md:px-8 pt-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group mb-6"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium text-sm">Back</span>
        </button>

        {errorMsg && (
          <div className="mb-6 px-5 py-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg("")}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-slate-200/50 bg-slate-200"
          >
            {currentPlaylist?.cover_url ? (
              <img
                src={currentPlaylist.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
                <Disc3 size={48} className="text-slate-400" />
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-1 text-center md:text-left pb-2"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Playlist
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
              {currentPlaylist?.title || "—"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500 mb-5">
              <span className="font-semibold text-slate-700">You</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {selectedSongs.length} Song
                {selectedSongs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <button
                onClick={() =>
                  selectedSongs[0] &&
                  playSong(selectedSongs[0], selectedSongs, 0)
                }
                disabled={selectedSongs.length === 0}
                className="flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-green-500/30 transition-all hover:scale-105 disabled:opacity-50"
              >
                <Play size={18} fill="white" className="ml-0.5" />
                Play Now
              </button>
              <button
                onClick={() => setShowSearchPanel(!showSearchPanel)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 font-bold text-sm transition-all ${
                  showSearchPanel
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                <Plus size={16} />
                Add Songs
              </button>
              <button
                onClick={handleDeletePlaylist}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-red-200 text-red-600 font-bold text-sm transition-all hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete Playlist
              </button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showSearchPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search or browse new releases..."
                    className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
                <div className="min-h-[200px] max-h-[320px] overflow-y-auto">
                  {searching ? (
                    <div className="flex justify-center py-10">
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={24}
                      />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-10">
                      <Music2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        No published songs found in database
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchResults.map((s) => (
                        <SongResultRow
                          key={s.id}
                          song={s}
                          isAdded={isSongSelected(s.id)}
                          onToggle={toggleSong}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {selectedSongs.length > 0 && (
                  <button
                    onClick={handleSaveSongs}
                    disabled={saving}
                    className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        Save {selectedSongs.length} Song
                        {selectedSongs.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {selectedSongs.length === 0 && !showSearchPanel ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Music2 className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-2">
                No songs yet
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Add songs to get started
              </p>
              <button
                onClick={() => setShowSearchPanel(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
              >
                <Plus size={16} />
                Add Songs
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {selectedSongs.map((song, i) => {
                const isTrackActive = currentSong?.id === song.id;
                return (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${isTrackActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    onClick={() => playSong(song, selectedSongs, i)}
                  >
                    {/* ✅ Yahan humne number ki jagah hamesha Play button dikhana shuru kar diya hai */}
                    <div className="w-8 flex-shrink-0 flex items-center justify-center">
                      {isTrackActive && playing ? (
                        <div className="flex items-end gap-0.5 h-4">
                          <motion.div
                            animate={{ height: ["40%", "100%", "40%"] }}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                            className="w-1 bg-blue-600 rounded-full"
                          />
                          <motion.div
                            animate={{ height: ["100%", "40%", "100%"] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.6,
                              delay: 0.15,
                            }}
                            className="w-1 bg-blue-600 rounded-full"
                          />
                          <motion.div
                            animate={{ height: ["60%", "100%", "60%"] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.6,
                              delay: 0.3,
                            }}
                            className="w-1 bg-blue-600 rounded-full"
                          />
                        </div>
                      ) : (
                        <Play
                          size={18}
                          className="text-blue-600 fill-blue-600"
                        />
                      )}
                    </div>
                    <img
                      src={song.img || "https://via.placeholder.com/40"}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isTrackActive ? "text-blue-600" : "text-slate-900"
                        }`}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {song.artist}
                        {parseArtists(song.featuringArtists).length > 0
                          ? ` ft. ${parseArtists(song.featuringArtists).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    {/* ✅ Yahan se maine "-" (dash) hata diya hai agar duration nahi hai toh */}
                    <span className="text-xs text-slate-400 font-medium w-10 text-right flex-shrink-0 hidden sm:block">
                      {song.duration ? formatDuration(song.duration) : ""}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSong(song.id);
                      }}
                      className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewPlaylist;
