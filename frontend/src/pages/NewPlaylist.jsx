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
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const parseArtists = (val) => {
  if (Array.isArray(val))
    return val.map((s) => String(s).trim()).filter(Boolean);
  if (!val || typeof val === "number" || typeof val === "boolean") return [];
  return String(val)
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
};

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

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
      className={`fixed bottom-24 left-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${type === "success" ? "bg-green-50/95 border-green-200 text-green-800" : "bg-red-50/95 border-red-200 text-red-800"}`}
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
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${isAdded ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"}`}
  >
    <img
      src={song.cover_url || "https://via.placeholder.com/44"}
      alt=""
      className="w-11 h-11 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
      onError={(e) => {
        e.target.src = "https://via.placeholder.com/44";
      }}
    />
    <div className="flex-1 min-w-0">
      <p
        className={`text-sm font-semibold truncate ${isAdded ? "text-blue-700" : "text-slate-900"}`}
      >
        {song.title}
      </p>
      <p className="text-xs text-slate-500 truncate mt-0.5">
        {song.primary_artist}
        {parseArtists(song.featuring_artists).length > 0
          ? ` ft. ${parseArtists(song.featuring_artists).join(", ")}`
          : ""}
      </p>
    </div>
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"}`}
    >
      {isAdded ? <Check size={16} /> : <Plus size={16} />}
    </div>
  </button>
);

const NewPlaylist = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

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

  // Player
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);
  useEffect(() => {
    currentListRef.current = currentList;
  }, [currentList]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Auth
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthChecked(true);
    };
    init();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // If playlistId exists → load detail. If not → show create modal.
  useEffect(() => {
    if (!user || !authChecked) return;
    if (playlistId) {
      loadPlaylistDetail(playlistId);
    } else {
      setShowNameModal(true);
    }
  }, [playlistId, user, authChecked]);

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
        .from("user_playlist_songs")
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
      setSelectedSongs(
        rows
          .map((row) => rels?.find((r) => r.id === row.release_id))
          .filter(Boolean),
      );
    } catch (err) {
      console.error("Load detail error:", err);
      setErrorMsg("Failed to load: " + (err.message || ""));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const q = searchQuery.trim();
        const { data, error } = await supabase
          .from("releases")
          .select(
            "id, title, primary_artist, featuring_artists, album_name, cover_url, audio_url, duration",
          )
          .eq("status", "Published")
          .or(
            `title.ilike.%${q}%,primary_artist.ilike.%${q}%,album_name.ilike.%${q}%`,
          )
          .limit(20);
        if (!error && data) setSearchResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchQuery]);

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
            .from("user_playlist_songs")
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

  // Create
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

  // Save songs
  const handleSaveSongs = async () => {
    if (!currentPlaylist || selectedSongs.length === 0) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const pid = currentPlaylist.id;
      await supabase
        .from("user_playlist_songs")
        .delete()
        .eq("playlist_id", pid);
      const rows = selectedSongs.map((s, i) => ({
        playlist_id: pid,
        release_id: s.id,
        position: i,
      }));
      const { error } = await supabase.from("user_playlist_songs").insert(rows);
      if (error) {
        setErrorMsg(error.message);
        throw error;
      }
      if (!currentPlaylist.cover_url && selectedSongs[0]?.cover_url) {
        await supabase
          .from("user_playlists")
          .update({ cover_url: selectedSongs[0].cover_url })
          .eq("id", pid);
        setCurrentPlaylist((p) => ({
          ...p,
          cover_url: selectedSongs[0].cover_url,
        }));
      }
      await loadPlaylistDetail(pid);
      setShowSearchPanel(false);
      setSearchQuery("");
      setSearchResults([]);
      setToast({
        message: `${selectedSongs.length} song${selectedSongs.length !== 1 ? "s" : ""} saved!`,
        type: "success",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveHistory = async (rid) => {
    if (!user || !rid) return;
    try {
      await supabase
        .from("history")
        .insert({ user_id: user.id, release_id: rid });
    } catch (e) {}
  };

  const playSong = useCallback(
    (song, list, index) => {
      if (!song || !song.audio_url) return;
      const a = audioRef.current;
      const f = {
        ...song,
        audioUrl: song.audio_url,
        img: song.cover_url,
        artist: song.primary_artist,
      };
      setCurrentSong(f);
      currentSongRef.current = f;
      setCurrentList(list);
      currentListRef.current = list;
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setDuration(0);
      setCurrentTime(0);
      a.src = song.audio_url;
      a.load();
      a.play()
        .then(() => setPlaying(true))
        .catch((e) => {
          if (e.name !== "AbortError") console.error(e);
        });
      if (song.id) saveHistory(song.id);
    },
    [user],
  );

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    const onT = () => setCurrentTime(a.currentTime);
    const onM = () => {
      if (isFinite(a.duration)) setDuration(a.duration);
    };
    const onP = () => setPlaying(true);
    const onPa = () => setPlaying(false);
    const onE = () => {
      if (!currentListRef.current.length || currentIndexRef.current === null)
        return;
      const i = (currentIndexRef.current + 1) % currentListRef.current.length;
      setCurrentIndex(i);
      currentIndexRef.current = i;
      playSong(currentListRef.current[i], currentListRef.current, i);
    };
    a.addEventListener("timeupdate", onT);
    a.addEventListener("loadedmetadata", onM);
    a.addEventListener("play", onP);
    a.addEventListener("pause", onPa);
    a.addEventListener("ended", onE);
    return () => {
      a.pause();
      [onT, onM, onP, onPa, onE].forEach((fn, i) =>
        a.removeEventListener(
          ["timeupdate", "loadedmetadata", "play", "pause", "ended"][i],
          fn,
        ),
      );
    };
  }, [playSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  const togglePlay = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };
  const seek = (t) => {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };
  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setCurrentSong(null);
    currentSongRef.current = null;
    setPlaying(false);
    setCurrentIndex(null);
    currentIndexRef.current = null;
    setCurrentList([]);
    currentListRef.current = [];
    setDuration(0);
    setCurrentTime(0);
  };
  const toggleMute = () => setIsMuted(!isMuted);

  // ═══════ LOADING / AUTH ═══════
  if (!authChecked)
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
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
                className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 font-bold text-sm transition-all ${showSearchPanel ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"}`}
              >
                <Plus size={16} />
                Add Songs
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
                    placeholder="Search songs..."
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
                        Search to add songs
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
              {selectedSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-all group"
                  onClick={() => playSong(song, selectedSongs, i)}
                >
                  <div
                    className={`flex-1 flex items-center gap-4 min-w-0 rounded-xl px-2 py-1 ${currentSongRef.current?.id === song.id ? "bg-blue-50 border border-blue-100" : "border border-transparent"}`}
                  >
                    <div className="w-8 flex-shrink-0 flex items-center justify-center">
                      {currentSongRef.current?.id === song.id && playing ? (
                        <div className="flex items-end gap-[2px] h-4">
                          <span
                            className="w-[3px] bg-blue-600 rounded-full animate-pulse"
                            style={{ height: "60%" }}
                          />
                          <span
                            className="w-[3px] bg-blue-600 rounded-full animate-pulse"
                            style={{ height: "100%", animationDelay: "0.15s" }}
                          />
                          <span
                            className="w-[3px] bg-blue-600 rounded-full animate-pulse"
                            style={{ height: "40%", animationDelay: "0.3s" }}
                          />
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-400 group-hover:hidden">
                            {i + 1}
                          </span>
                          <Play
                            size={14}
                            className="text-slate-900 hidden group-hover:block fill-slate-900"
                          />
                        </>
                      )}
                    </div>
                    <img
                      src={song.cover_url || "https://via.placeholder.com/40"}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${currentSongRef.current?.id === song.id ? "text-blue-700" : "text-slate-900"}`}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {song.primary_artist}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium w-10 text-right flex-shrink-0">
                      {song.duration ? formatDuration(song.duration) : "—"}
                    </span>
                  </div>
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
              ))}
            </div>
          )}
        </div>
      </div>

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 md:py-4 md:px-8">
            <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                <img
                  src={currentSong.img || "https://via.placeholder.com/50"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <h4 className="font-bold text-white truncate text-base leading-tight">
                  {currentSong.title}
                </h4>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {currentSong.artist}
                </p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
              <div className="flex items-center gap-4 md:gap-6 mb-2">
                <button
                  onClick={() => {
                    if (
                      !currentListRef.current.length ||
                      currentIndexRef.current === null
                    )
                      return;
                    const i =
                      (currentIndexRef.current -
                        1 +
                        currentListRef.current.length) %
                      currentListRef.current.length;
                    playSong(
                      currentListRef.current[i],
                      currentListRef.current,
                      i,
                    );
                  }}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all bg-white text-slate-900"
                >
                  {playing ? (
                    <Pause size={24} className="fill-slate-900" />
                  ) : (
                    <Play size={24} className="fill-slate-900 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (
                      !currentListRef.current.length ||
                      currentIndexRef.current === null
                    )
                      return;
                    const i =
                      (currentIndexRef.current + 1) %
                      currentListRef.current.length;
                    playSong(
                      currentListRef.current[i],
                      currentListRef.current,
                      i,
                    );
                  }}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110"
                >
                  <SkipForward size={20} />
                </button>
              </div>
              <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-medium px-0 md:px-8">
                <span className="w-10 text-right font-mono">
                  {formatDuration(currentTime)}
                </span>
                <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                    style={{
                      width: duration
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="w-10 font-mono">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
            <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
              <button
                onClick={closePlayer}
                className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 w-full justify-end mt-1">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-green-500 hover:scale-110"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>
                <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer w-24">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(parseFloat(e.target.value) === 0);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-blue-500"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
