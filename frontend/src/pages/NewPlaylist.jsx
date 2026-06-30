import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  GripVertical,
  Disc3,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ImagePlus,
  Heart,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// ─── HELPERS ───
const parseArtists = (val) => {
  if (Array.isArray(val))
    return val.map((s) => String(s).trim()).filter(Boolean);
  if (
    val == null ||
    val === "" ||
    typeof val === "number" ||
    typeof val === "boolean"
  )
    return [];
  return String(val)
    .split(",")
    .map((a) => a.trim())
    .filter((s) => s.length > 0);
};

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ─── SONG SEARCH RESULT ROW ───
const SongResultRow = ({ song, isAdded, onToggle }) => {
  const featuringList = parseArtists(song.featuring_artists);
  return (
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
        src={song.cover_url || "https://via.placeholder.com/44"}
        alt={song.title}
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
          {song.primary_artist}
          {featuringList.length > 0 ? ` ft. ${featuringList.join(", ")}` : ""}
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
};

// ─── SELECTED SONG ROW (in the playlist being built) ───
const SelectedSongRow = ({ song, index, onRemove }) => {
  const featuringList = parseArtists(song.featuring_artists);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-200 group"
    >
      <GripVertical
        size={14}
        className="text-slate-300 flex-shrink-0 cursor-grab active:cursor-grabbing"
      />
      <span className="text-xs font-mono text-slate-400 w-5 flex-shrink-0 text-center">
        {index + 1}
      </span>
      <img
        src={song.cover_url || "https://via.placeholder.com/40"}
        alt={song.title}
        className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/40";
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {song.title}
        </p>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {song.primary_artist}
          {featuringList.length > 0 ? ` ft. ${featuringList.join(", ")}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(song.id)}
        className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
        title="Remove from playlist"
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
  );
};

// ─── SUCCESS PAGE SONG ROW ───
const SuccessSongRow = ({ song, index, isPlaying, isCurrentSong, onPlay }) => {
  const featuringList = parseArtists(song.featuring_artists);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onPlay(song, index)}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all group ${
        isCurrentSong
          ? "bg-blue-50 border border-blue-100"
          : "hover:bg-slate-50 border border-transparent"
      }`}
    >
      {/* Number / Play indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isCurrentSong && isPlaying ? (
          <div className="flex items-end gap-[2px] h-4">
            <span
              className="w-[3px] bg-blue-600 rounded-full animate-pulse"
              style={{ height: "60%", animationDelay: "0s" }}
            />
            <span
              className="w-[3px] bg-blue-600 rounded-full animate-pulse"
              style={{ height: "100%", animationDelay: "0.15s" }}
            />
            <span
              className="w-[3px] bg-blue-600 rounded-full animate-pulse"
              style={{ height: "40%", animationDelay: "0.3s" }}
            />
            <span
              className="w-[3px] bg-blue-600 rounded-full animate-pulse"
              style={{ height: "80%", animationDelay: "0.45s" }}
            />
          </div>
        ) : (
          <span
            className={`text-sm font-medium ${isCurrentSong ? "text-blue-600" : "text-slate-400 group-hover:hidden"}`}
          >
            {index + 1}
          </span>
        )}
        {!(isCurrentSong && isPlaying) && (
          <Play
            size={14}
            className="text-slate-900 hidden group-hover:block fill-slate-900"
          />
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${isCurrentSong ? "text-blue-700" : "text-slate-900"}`}
        >
          {song.title}
        </p>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {song.primary_artist}
          {featuringList.length > 0 ? ` · ${featuringList.join(", ")}` : ""}
        </p>
      </div>

      {/* Heart */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
      >
        <Heart size={16} />
      </button>

      {/* Duration */}
      <span className="text-xs text-slate-400 font-medium w-10 text-right flex-shrink-0">
        {song.duration ? formatDuration(song.duration) : "—"}
      </span>

      {/* More */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-slate-300 hover:text-slate-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal size={16} />
      </button>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
const NewPlaylist = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedSongs, setSelectedSongs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successPlaylist, setSuccessPlaylist] = useState(null);
  const [createdPlaylistId, setCreatedPlaylistId] = useState(null);

  // Player States
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // ✅ Auth check
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthChecked(true);
      if (!session?.user) setShowAuthModal(true);
    };
    getSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuthModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ✅ Debounced song search
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
        const { data, error: searchError } = await supabase
          .from("releases")
          .select(
            "id, title, primary_artist, featuring_artists, album_name, cover_url, audio_url, language, genre, duration",
          )
          .eq("status", "Published")
          .or(
            `title.ilike.%${q}%,primary_artist.ilike.%${q}%,featuring_artists.ilike.%${q}%,album_name.ilike.%${q}%`,
          )
          .limit(20);

        if (!searchError && data) {
          setSearchResults(data);
        } else if (searchError) {
          console.error("Song search error:", searchError);
        }
      } catch (err) {
        console.error("Song search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const isSongSelected = useCallback(
    (songId) => selectedSongs.some((s) => s.id === songId),
    [selectedSongs],
  );

  const toggleSongSelection = useCallback((song) => {
    setSelectedSongs((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) return prev.filter((s) => s.id !== song.id);
      return [...prev, song];
    });
  }, []);

  const removeSelectedSong = useCallback((songId) => {
    setSelectedSongs((prev) => prev.filter((s) => s.id !== songId));
  }, []);

  const saveToHistory = async (releaseId) => {
    if (!user || !releaseId) return;
    try {
      await supabase
        .from("history")
        .delete()
        .match({ user_id: user.id, release_id: releaseId });
      await supabase
        .from("history")
        .insert({ user_id: user.id, release_id: releaseId });
    } catch (error) {
      console.error("History save error:", error);
    }
  };

  const playSong = useCallback(
    (song, list, index) => {
      if (!song || !song.audio_url) return;
      const audio = audioRef.current;
      const formattedSong = {
        ...song,
        audioUrl: song.audio_url,
        img: song.cover_url,
        artist: song.primary_artist,
      };

      setCurrentSong(formattedSong);
      currentSongRef.current = formattedSong;
      setCurrentList(list);
      currentListRef.current = list;
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setDuration(0);
      setCurrentTime(0);

      audio.src = song.audio_url;
      audio.load();
      audio
        .play()
        .then(() => setPlaying(true))
        .catch((err) => {
          if (err.name !== "AbortError" && err.name !== "NotAllowedError")
            console.error("Play error:", err);
        });

      if (song.id) saveToHistory(song.id);
    },
    [user],
  );

  const handleNext = useCallback(() => {
    if (!currentListRef.current.length || currentIndexRef.current === null)
      return;
    const nextIndex =
      (currentIndexRef.current + 1) % currentListRef.current.length;
    setCurrentIndex(nextIndex);
    currentIndexRef.current = nextIndex;
    playSong(
      currentListRef.current[nextIndex],
      currentListRef.current,
      nextIndex,
    );
  }, [playSong]);

  const handlePrev = useCallback(() => {
    if (!currentListRef.current.length || currentIndexRef.current === null)
      return;
    const prevIndex =
      (currentIndexRef.current - 1 + currentListRef.current.length) %
      currentListRef.current.length;
    setCurrentIndex(prevIndex);
    currentIndexRef.current = prevIndex;
    playSong(
      currentListRef.current[prevIndex],
      currentListRef.current,
      prevIndex,
    );
  }, [playSong]);

  const handlePlayPause = useCallback(
    (song) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (
        currentSongRef.current &&
        currentSongRef.current.id === song.id &&
        !audio.paused
      ) {
        audio.pause();
        setPlaying(false);
      } else {
        playSong(song);
      }
    },
    [playSong],
  );

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleClosePlayer = () => {
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

  const handleCreatePlaylist = async () => {
    setError("");

    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!title.trim()) {
      setError("Please give your playlist a name.");
      return;
    }
    if (selectedSongs.length === 0) {
      setError("Add at least one song to your playlist.");
      return;
    }

    setSaving(true);
    try {
      const coverUrl = selectedSongs[0]?.cover_url || null;

      const { data: playlistRow, error: playlistError } = await supabase
        .from("user_playlists")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          cover_url: coverUrl,
        })
        .select()
        .single();

      if (playlistError) throw playlistError;

      const songRows = selectedSongs.map((song, index) => ({
        playlist_id: playlistRow.id,
        release_id: song.id,
        position: index,
      }));

      const { error: songsError } = await supabase
        .from("user_playlist_songs")
        .insert(songRows);

      if (songsError) throw songsError;

      setSuccessPlaylist(playlistRow);
      setCreatedPlaylistId(playlistRow.id);
    } catch (err) {
      console.error("Create playlist error:", err);
      setError(
        "Something went wrong while creating your playlist. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePlaySuccessSong = (song, index) => {
    playSong(song, selectedSongs, index);
  };

  const handleStartAnother = () => {
    handleClosePlayer();
    setSuccessPlaylist(null);
    setCreatedPlaylistId(null);
    setTitle("");
    setDescription("");
    setSelectedSongs([]);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
  };

  // ── Not logged in ──
  if (authChecked && !user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <ListMusic className="text-blue-500" size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Sign in to create a playlist
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            You need an account to build and save your own playlists.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-600/30 hover:scale-105 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // ── SUCCESS STATE — Playlist Detail UI ──
  // ═══════════════════════════════════════
  if (successPlaylist) {
    const totalDuration = selectedSongs.reduce(
      (acc, s) => acc + (s.duration || 0),
      0,
    );

    return (
      <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        {/* Top gradient bg */}
        <div
          className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
          style={{
            background: successPlaylist.cover_url
              ? `linear-gradient(to bottom, rgba(59,130,246,0.15), transparent)`
              : `linear-gradient(to bottom, rgba(59,130,246,0.1), transparent)`,
          }}
        />

        <div className="relative px-4 md:px-8 pt-6 max-w-5xl mx-auto">
          {/* Back button */}
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

          {/* Header: Cover + Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-8">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-slate-200/50"
            >
              <img
                src={
                  successPlaylist.cover_url || "https://via.placeholder.com/224"
                }
                alt={successPlaylist.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/224";
                }}
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 text-center md:text-left pb-2"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Playlist
              </p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
                {successPlaylist.title}
              </h1>
              {successPlaylist.description && (
                <p className="text-sm text-slate-500 mb-3 max-w-md">
                  {successPlaylist.description}
                </p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-500 mb-5">
                <span className="font-semibold text-slate-700">You</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {selectedSongs.length} Song
                  {selectedSongs.length !== 1 ? "s" : ""}
                </span>
                {totalDuration > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-green-600 font-semibold">
                  Just Created
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => handlePlaySuccessSong(selectedSongs[0], 0)}
                  className="flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-green-500/30 transition-all hover:scale-105"
                >
                  <Play size={18} fill="white" className="ml-0.5" />
                  Play
                </button>
                <button
                  onClick={handleStartAnother}
                  className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition-all"
                >
                  <Plus size={16} />
                  Create Another
                </button>
              </div>
            </motion.div>
          </div>

          {/* Song list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
          >
            {/* List header */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Title</span>
              <span className="w-8" />
              <span className="w-10 text-right">
                <Clock size={13} />
              </span>
              <span className="w-8" />
            </div>

            {/* Songs */}
            <div className="divide-y divide-slate-50">
              {selectedSongs.map((song, index) => (
                <SuccessSongRow
                  key={song.id}
                  song={song}
                  index={index}
                  isPlaying={playing}
                  isCurrentSong={currentSongRef.current?.id === song.id}
                  onPlay={handlePlaySuccessSong}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedSongs.length} song
                {selectedSongs.length !== 1 ? "s" : ""} ·{" "}
                {formatDuration(totalDuration)}
              </span>
              <span className="text-xs text-green-600 font-medium">
                ✓ Playlist saved
              </span>
            </div>
          </motion.div>
        </div>

        {/* ✅ Sticky Player */}
        {currentSong && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]">
            <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 md:py-4 md:px-8">
              <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
                <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                  <img
                    src={currentSong.img || "https://via.placeholder.com/50"}
                    alt="Art"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                    onClick={handlePrev}
                    className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                  >
                    <SkipBack size={20} />
                  </button>
                  <button
                    onClick={() => handlePlayPause(currentSong)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300 bg-white text-slate-900"
                  >
                    {playing ? (
                      <Pause size={24} className="fill-slate-900" />
                    ) : (
                      <Play size={24} className="fill-slate-900 ml-1" />
                    )}
                  </button>
                  <button
                    onClick={handleNext}
                    className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>
                <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-medium px-0 md:px-8">
                  <span className="w-10 text-right font-mono">
                    {formatDuration(currentTime)}
                  </span>
                  <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer group">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
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
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        left: duration
                          ? `${(currentTime / duration) * 100}%`
                          : "0%",
                        marginLeft: "-6px",
                      }}
                    />
                  </div>
                  <span className="w-10 font-mono">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>

              {/* Mobile Right Controls */}
              <div className="flex md:hidden items-center gap-1 flex-shrink-0">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>
                <button
                  onClick={handleClosePlayer}
                  className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300 p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Desktop Right Controls */}
              <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
                <div className="flex items-center gap-3 w-full justify-end">
                  <button
                    onClick={handleClosePlayer}
                    className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-3 w-full justify-end mt-1">
                  <button
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-red-400 transition-colors hover:scale-110"
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
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        setIsMuted(v === 0);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className="absolute top-0 left-0 h-full rounded-full bg-blue-500"
                      style={{
                        width: `${(isMuted ? 0 : volume) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  // ── CREATE PLAYLIST STATE ──
  // ═══════════════════════════════════════
  return (
    <div className="w-full min-h-screen text-slate-900 pb-16 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

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

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Create <span className="text-blue-600">Playlist</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Give it a name, then search and add any songs you like.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center">
                  {selectedSongs[0]?.cover_url ? (
                    <img
                      src={selectedSongs[0].cover_url}
                      alt="Playlist cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="text-slate-300" size={26} />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cover is automatically set from the first song you add.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Mix"
                    maxLength={80}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description{" "}
                    <span className="font-normal normal-case text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this playlist about?"
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ListMusic size={16} className="text-blue-600" />
                  Your Songs
                </h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                  {selectedSongs.length}
                </span>
              </div>

              {selectedSongs.length === 0 ? (
                <div className="text-center py-10">
                  <Music2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    No songs added yet. Search on the right and tap{" "}
                    <Plus size={12} className="inline" /> to add.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {selectedSongs.map((song, index) => (
                      <SelectedSongRow
                        key={song.id}
                        song={song}
                        index={index}
                        onRemove={removeSelectedSong}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleCreatePlaylist}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus size={18} /> Create Playlist
                </>
              )}
            </button>
          </div>

          {/* ── RIGHT ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Search size={16} className="text-blue-600" />
                Add Songs
              </h3>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs, artists, albums..."
                  className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="min-h-[300px] max-h-[520px] overflow-y-auto">
                {searching ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-blue-600" size={28} />
                  </div>
                ) : !searchQuery.trim() ? (
                  <div className="text-center py-16">
                    <Disc3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      Start typing to find songs to add.
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <Music2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      No songs found for "{searchQuery}".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {searchResults.map((song) => (
                      <SongResultRow
                        key={song.id}
                        song={song}
                        isAdded={isSongSelected(song.id)}
                        onToggle={toggleSongSelection}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Sticky Player */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 md:py-4 md:px-8">
            <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
              <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                <img
                  src={currentSong.img || "https://via.placeholder.com/50"}
                  alt="Art"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                  onClick={handlePrev}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={() => handlePlayPause(currentSong)}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300 bg-white text-slate-900"
                >
                  {playing ? (
                    <Pause size={24} className="fill-slate-900" />
                  ) : (
                    <Play size={24} className="fill-slate-900 ml-1" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
                >
                  <SkipForward size={20} />
                </button>
              </div>
              <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-medium px-0 md:px-8">
                <span className="w-10 text-right font-mono">
                  {formatDuration(currentTime)}
                </span>
                <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer group">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
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
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      left: duration
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                      marginLeft: "-6px",
                    }}
                  />
                </div>
                <span className="w-10 font-mono">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-1 flex-shrink-0">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <button
                onClick={handleClosePlayer}
                className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300 p-1.5 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Desktop */}
            <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
              <div className="flex items-center gap-3 w-full justify-end">
                <button
                  onClick={handleClosePlayer}
                  className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-3 w-full justify-end mt-1">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-red-400 transition-colors hover:scale-110"
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
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(v === 0);
                    }}
                    onClick={(e) => e.stopPropagation()}
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
    </div>
  );
};

export default NewPlaylist;
