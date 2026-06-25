import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Search,
  Loader2,
  Headphones,
  Shuffle,
  Heart,
  SkipForward,
  SkipBack,
  Globe,
  Radio as RadioIcon,
  ChevronUp,
  ChevronDown,
  ListMusic,
  Music2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatTime = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ─── Expanded Full-Screen Player ──────────────────────────────────────────────
const ExpandedPlayer = ({
  station,
  stationSongs,
  currentSong,
  songIndex,
  isPlaying,
  onPlayPause,
  onSeek,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  isMuted,
  toggleMute,
  onNext,
  onPrev,
  onClose,
  onCollapse,
  isLiked,
  onToggleLike,
  onSongSelect,
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[200] flex flex-col md:flex-row overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1a2744 40%, #064e3b 100%)",
      }}
    >
      {/* ── LEFT: Now Playing ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 relative overflow-y-auto">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <button
            onClick={onCollapse}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-sm font-semibold"
          >
            <ChevronDown size={18} />
            <span>Minimise</span>
          </button>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest truncate max-w-[160px]">
            {station?.name}
          </p>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/70 text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Album Art */}
        <div className="relative w-52 h-52 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.3)] border border-white/10 mb-6 mt-16">
          <img
            src={
              currentSong?.cover_url ||
              station?.image_url ||
              "https://via.placeholder.com/300"
            }
            alt={currentSong?.title || station?.name}
            className="w-full h-full object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4">
              <div className="flex items-end gap-1 h-6">
                {[
                  { from: "30%", to: "100%", delay: 0 },
                  { from: "100%", to: "40%", delay: 0.1 },
                  { from: "50%", to: "100%", delay: 0.2 },
                  { from: "80%", to: "30%", delay: 0.15 },
                ].map((bar, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [bar.from, bar.to, bar.from] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.55,
                      delay: bar.delay,
                    }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="text-center mb-4 px-4 w-full max-w-xs">
          <h2 className="text-xl md:text-2xl font-extrabold text-white truncate">
            {currentSong?.title || station?.name}
          </h2>
          {currentSong?.primary_artist && (
            <p className="text-emerald-400 font-medium mt-1 text-sm truncate">
              {currentSong.primary_artist}
            </p>
          )}
          <p className="text-white/30 text-[11px] mt-1">
            {songIndex + 1} / {stationSongs.length}
          </p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-sm mb-2">
          <div className="relative h-1.5 bg-white/15 rounded-full cursor-pointer group">
            <div
              className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: "-7px" }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] font-mono text-white/40">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-7 mb-6">
          <button
            onClick={onPrev}
            className="text-white/50 hover:text-white transition-colors hover:scale-110"
          >
            <SkipBack className="w-7 h-7" />
          </button>
          <button
            onClick={onPlayPause}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-105 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-0.5" />
            )}
          </button>
          <button
            onClick={onNext}
            className="text-white/50 hover:text-white transition-colors hover:scale-110"
          >
            <SkipForward className="w-7 h-7" />
          </button>
        </div>

        {/* Volume + Like */}
        <div className="flex items-center gap-5">
          <button
            onClick={onToggleLike}
            className={`transition-all hover:scale-110 ${isLiked ? "text-red-400" : "text-white/40 hover:text-red-400"}`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={toggleMute}
            className="text-white/40 hover:text-emerald-400 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <div className="relative h-1.5 bg-white/15 rounded-full cursor-pointer w-28">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-emerald-500"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Song Queue ── */}
      <div className="w-full md:w-[360px] flex flex-col border-t md:border-t-0 md:border-l border-white/10 bg-black/25 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
          <ListMusic size={16} className="text-emerald-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Up Next
          </h3>
          <span className="ml-auto text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
            {stationSongs.length} songs
          </span>
        </div>
        <div
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {stationSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/30">
              <Music2 size={32} className="mb-2" />
              <p className="text-sm">No songs in queue</p>
            </div>
          ) : (
            stationSongs.map((song, idx) => {
              const isActive = idx === songIndex;
              return (
                <button
                  key={song.id}
                  onClick={() => onSongSelect(idx)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all group ${
                    isActive
                      ? "bg-emerald-500/15 border-l-[3px] border-emerald-500"
                      : "hover:bg-white/5 border-l-[3px] border-transparent"
                  }`}
                >
                  <div className="w-6 flex-shrink-0 flex items-center justify-center">
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-4">
                        {[0, 0.1, 0.2].map((delay, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ["30%", "100%", "30%"] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.5,
                              delay,
                            }}
                            className="w-[3px] bg-emerald-400 rounded-full"
                          />
                        ))}
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-bold ${isActive ? "text-emerald-400" : "text-white/30 group-hover:text-white/60"}`}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                    <img
                      src={song.cover_url || "https://via.placeholder.com/40"}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${isActive ? "text-emerald-400" : "text-white/80 group-hover:text-white"}`}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {song.primary_artist || "Unknown Artist"}
                    </p>
                  </div>
                  {!isActive && (
                    <Play
                      size={12}
                      className="text-white/0 group-hover:text-white/60 flex-shrink-0 transition-colors fill-current"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Bottom Mini Player ────────────────────────────────────────────────────────
const RadioPlayer = ({
  station,
  currentSong,
  isPlaying,
  onPlayPause,
  onSeek,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  isMuted,
  toggleMute,
  onNext,
  onPrev,
  onClose,
  isLiked,
  onToggleLike,
  songIndex,
  totalSongs,
  onExpand,
}) => {
  if (!station) return null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{
        background: "#0f172a",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Progress bar */}
      <div
        className="w-full h-[3px] relative cursor-pointer"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute top-0 left-0 h-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ margin: 0 }}
        />
      </div>

      {/* Player row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "10px 20px",
          gap: "12px",
        }}
      >
        {/* ── LEFT: Album + Info + EXPAND BUTTON ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          {/* Album art */}
          <div
            onClick={onExpand}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              overflow: "hidden",
              flexShrink: 0,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.12)",
              position: "relative",
            }}
          >
            <img
              src={
                currentSong?.cover_url ||
                station.image_url ||
                "https://via.placeholder.com/50"
              }
              alt={station.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {isPlaying && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "2px",
                    height: "14px",
                  }}
                >
                  {[0, 0.12, 0.25].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ["40%", "100%", "40%"] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay }}
                      style={{
                        width: "3px",
                        background: "#34d399",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Song info */}
          <div
            onClick={onExpand}
            style={{ minWidth: 0, flex: 1, cursor: "pointer" }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#fff",
                fontSize: "14px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentSong?.title || station.name}
            </div>
            {currentSong?.primary_artist && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#34d399",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentSong.primary_artist}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isPlaying ? "#34d399" : "#475569",
                  ...(isPlaying ? { animation: "pulse 1.5s infinite" } : {}),
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#64748b",
                }}
              >
                {isPlaying ? "Playing" : "Paused"}
              </span>
              {totalSongs > 0 && (
                <span style={{ fontSize: "10px", color: "#475569" }}>
                  {songIndex + 1}/{totalSongs}
                </span>
              )}
            </div>
          </div>

          {/* ═══ EXPAND BUTTON — always visible, always styled ═══ */}
          <button
            onClick={onExpand}
            title="Open full player"
            style={{
              flexShrink: 0,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid #10b981",
              background: "rgba(16,185,129,0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(16,185,129,0.35)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(16,185,129,0.15)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <ChevronUp size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── CENTER: Controls + time ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={onPrev}
              style={{
                color: "#94a3b8",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={onPlayPause}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#10b981",
                border: "none",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(16,185,129,0.4)",
              }}
            >
              {isPlaying ? (
                <Pause size={20} fill="white" />
              ) : (
                <Play size={20} fill="white" style={{ marginLeft: "2px" }} />
              )}
            </button>
            <button
              onClick={onNext}
              style={{
                color: "#94a3b8",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <SkipForward size={20} />
            </button>
          </div>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#475569",
            }}
          >
            {formatTime(currentTime)}
            <span style={{ margin: "0 4px", color: "#1e293b" }}>·</span>
            {duration > 0 ? formatTime(duration) : "--:--"}
          </div>
        </div>

        {/* ── RIGHT: Volume + Like + Close ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={onToggleLike}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isLiked ? "#ef4444" : "#64748b",
            }}
          >
            <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={toggleMute}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
            }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} />
            )}
          </button>
          <div
            style={{
              position: "relative",
              height: "6px",
              background: "#1e293b",
              borderRadius: "3px",
              cursor: "pointer",
              width: "80px",
            }}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
                zIndex: 10,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                borderRadius: "3px",
                background: "#10b981",
                width: `${(isMuted ? 0 : volume) * 100}%`,
              }}
            />
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
            }}
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Radio Component ─────────────────────────────────────────────────────
const Radio = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("All");

  const [currentStation, setCurrentStation] = useState(null);
  const [stationSongs, setStationSongs] = useState([]);
  const [songIndex, setSongIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [likedStations, setLikedStations] = useState(new Set());
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [noSongsError, setNoSongsError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef(null);
  const currentStationRef = useRef(null);
  const stationSongsRef = useRef([]);
  const songIndexRef = useRef(0);

  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);
  useEffect(() => {
    stationSongsRef.current = stationSongs;
  }, [stationSongs]);
  useEffect(() => {
    songIndexRef.current = songIndex;
  }, [songIndex]);

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("radio_stations")
          .select("*")
          .eq("is_live", true)
          .order("total_listeners", { ascending: false });
        if (error) throw error;
        setStations(data || []);
      } catch (err) {
        console.error("Error fetching stations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMeta = () => {
      if (audio.duration && isFinite(audio.duration))
        setDuration(audio.duration);
    };
    const onEnded = () => {
      const songs = stationSongsRef.current;
      if (!songs.length) return;
      const nextIdx = (songIndexRef.current + 1) % songs.length;
      setSongIndex(nextIdx);
      songIndexRef.current = nextIdx;
      setCurrentTime(0);
      setDuration(0);
      const next = songs[nextIdx];
      if (next?.audio_url) {
        audio.src = next.audio_url;
        audio.load();
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const loadAndPlayStation = useCallback(async (station) => {
    if (!station) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (currentStationRef.current?.id === station.id) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
      return;
    }

    audio.pause();
    setPlaying(false);
    setNoSongsError(false);
    setLoadingSongs(true);
    setCurrentTime(0);
    setDuration(0);

    try {
      const { data: rsData, error: rsErr } = await supabase
        .from("radio_songs")
        .select("song_id")
        .eq("radio_id", station.id);
      if (rsErr) throw rsErr;

      const songIds = (rsData || []).map((r) => r.song_id).filter(Boolean);

      if (!songIds.length) {
        setCurrentStation(station);
        currentStationRef.current = station;
        setStationSongs([]);
        stationSongsRef.current = [];
        setSongIndex(0);
        songIndexRef.current = 0;
        setNoSongsError(true);
        return;
      }

      const { data: relData, error: relErr } = await supabase
        .from("releases")
        .select("id, title, primary_artist, audio_url, cover_url")
        .in("id", songIds);
      if (relErr) throw relErr;

      const songs = (relData || []).filter(
        (s) => s && s.audio_url && s.audio_url.trim() !== "",
      );

      setCurrentStation(station);
      currentStationRef.current = station;
      setStationSongs(songs);
      stationSongsRef.current = songs;
      setSongIndex(0);
      songIndexRef.current = 0;

      if (!songs.length) {
        setNoSongsError(true);
        return;
      }

      supabase
        .from("radio_stations")
        .update({ total_listeners: (station.total_listeners || 0) + 1 })
        .eq("id", station.id)
        .then(() => {
          setStations((prev) =>
            prev.map((s) =>
              s.id === station.id
                ? { ...s, total_listeners: (s.total_listeners || 0) + 1 }
                : s,
            ),
          );
        });

      audio.src = songs[0].audio_url;
      audio.load();

      const tryPlay = () =>
        audio.play().catch((e) => {
          console.error("Play error:", e);
          setPlaying(false);
        });

      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        audio.addEventListener("canplay", tryPlay, { once: true });
      }
    } catch (err) {
      console.error("Error loading station:", err);
      setNoSongsError(true);
    } finally {
      setLoadingSongs(false);
    }
  }, []);

  const skipToIndex = useCallback((idx) => {
    const songs = stationSongsRef.current;
    if (!songs.length) return;
    const audio = audioRef.current;
    if (!audio) return;
    const i = (idx + songs.length) % songs.length;
    setSongIndex(i);
    songIndexRef.current = i;
    setCurrentTime(0);
    setDuration(0);
    audio.src = songs[i].audio_url;
    audio.load();
    audio.play().catch(() => {});
  }, []);

  const handleNext = useCallback(
    () => skipToIndex(songIndexRef.current + 1),
    [skipToIndex],
  );
  const handlePrev = useCallback(
    () => skipToIndex(songIndexRef.current - 1),
    [skipToIndex],
  );

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  }, []);

  const handleSeek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(time)) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleClosePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPlaying(false);
    setCurrentStation(null);
    currentStationRef.current = null;
    setStationSongs([]);
    stationSongsRef.current = [];
    setSongIndex(0);
    songIndexRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setNoSongsError(false);
    setIsExpanded(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);
  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    setIsMuted(v === 0);
  }, []);
  const toggleLikeStation = useCallback((id) => {
    setLikedStations((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const availableLanguages = useMemo(() => {
    const langs = new Set(stations.map((s) => s.language).filter(Boolean));
    return ["All", ...Array.from(langs)];
  }, [stations]);

  const filteredStations = useMemo(() => {
    let result = stations;
    if (selectedLang !== "All")
      result = result.filter((s) => s.language === selectedLang);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.genre || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [stations, selectedLang, searchQuery]);

  const currentSong = stationSongs[songIndex] || null;

  return (
    <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-emerald-100/60 to-transparent pointer-events-none" />

      <div className="relative px-4 md:px-8 pt-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              <span className="text-emerald-600">Radio</span> Stations
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Tune into live radio from across India.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-emerald-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stations..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
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
            <button
              onClick={() => {
                if (!filteredStations.length) return;
                const random =
                  filteredStations[
                    Math.floor(Math.random() * filteredStations.length)
                  ];
                loadAndPlayStation(random);
              }}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Shuffle size={16} /> Surprise Me
            </button>
          </div>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                selectedLang === lang
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {lang === "All" ? (
                <span className="flex items-center gap-1.5">
                  <Globe size={14} /> All Languages
                </span>
              ) : (
                lang
              )}
            </button>
          ))}
        </div>

        {/* Station Grid */}
        {loading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <RadioIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              No Stations Found
            </h3>
            <p className="text-slate-500 text-sm">
              No radio stations available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6 pb-10">
            {filteredStations.map((station, index) => {
              const isActive = currentStation?.id === station.id;
              const isCurrentlyPlaying = isActive && playing;
              const isThisLoading = loadingSongs && isActive;
              const isLiked = likedStations.has(station.id);
              return (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  onClick={() => loadAndPlayStation(station)}
                  className="group flex flex-col items-center text-center cursor-pointer"
                >
                  <div
                    className={`relative w-full aspect-square rounded-full overflow-hidden shadow-lg transition-all duration-500 border-4 ${
                      isCurrentlyPlaying
                        ? "border-emerald-500 shadow-emerald-500/30 scale-105"
                        : isActive
                          ? "border-emerald-300"
                          : "border-white shadow-slate-300/50 group-hover:shadow-xl group-hover:scale-105"
                    }`}
                  >
                    <img
                      src={
                        station.image_url || "https://via.placeholder.com/200"
                      }
                      alt={station.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200";
                      }}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity duration-300 ${
                        isThisLoading || isCurrentlyPlaying
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isThisLoading ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                          {isCurrentlyPlaying ? (
                            <div className="flex items-end gap-0.5 h-5">
                              {[0, 0.12, 0.25].map((delay, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ height: ["30%", "100%", "30%"] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.5,
                                    delay,
                                  }}
                                  className="w-1 bg-emerald-500 rounded-full"
                                />
                              ))}
                            </div>
                          ) : (
                            <Play className="w-6 h-6 text-emerald-600 fill-emerald-600 ml-0.5" />
                          )}
                        </div>
                      )}
                    </div>
                    {isCurrentlyPlaying && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-emerald-500 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Live
                        </span>
                      </div>
                    )}
                    {isActive && noSongsError && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500 px-3 py-1 rounded-full">
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">
                          No songs
                        </span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeStation(station.id);
                      }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${
                        isLiked
                          ? "text-red-500"
                          : "text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Heart
                        size={16}
                        fill={isLiked ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="mt-3 w-full px-1">
                    <h3
                      className={`text-sm font-bold leading-tight line-clamp-2 transition-colors ${
                        isCurrentlyPlaying
                          ? "text-emerald-600"
                          : "text-slate-900 group-hover:text-emerald-600"
                      }`}
                    >
                      {station.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                        {station.language || "Radio"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                        <Headphones size={9} />
                        {formatCount(station.total_listeners || 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Expanded Full-Screen Player ── */}
      <AnimatePresence>
        {isExpanded && currentStation && !noSongsError && (
          <ExpandedPlayer
            station={currentStation}
            stationSongs={stationSongs}
            currentSong={currentSong}
            songIndex={songIndex}
            isPlaying={playing}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            toggleMute={toggleMute}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClosePlayer}
            onCollapse={() => setIsExpanded(false)}
            isLiked={likedStations.has(currentStation.id)}
            onToggleLike={() => toggleLikeStation(currentStation.id)}
            onSongSelect={skipToIndex}
          />
        )}
      </AnimatePresence>

      {/* ── Mini Bottom Player ── */}
      <AnimatePresence>
        {currentStation && !noSongsError && !isExpanded && (
          <RadioPlayer
            station={currentStation}
            currentSong={currentSong}
            isPlaying={playing}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            toggleMute={toggleMute}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClosePlayer}
            isLiked={likedStations.has(currentStation.id)}
            onToggleLike={() => toggleLikeStation(currentStation.id)}
            songIndex={songIndex}
            totalSongs={stationSongs.length}
            onExpand={() => setIsExpanded(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Radio;
