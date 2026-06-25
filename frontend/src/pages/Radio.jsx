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

// ─── Bottom Player ────────────────────────────────────────────────────────────
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
}) => {
  if (!station) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]"
    >
      {/* ── Seek / Progress bar — full width at very top of player ── */}
      <div className="w-full h-1 bg-slate-700/60 relative group cursor-pointer">
        {/* Buffered fill */}
        <div
          className="absolute top-0 left-0 h-full bg-slate-500/40 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Played fill */}
        <div
          className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Thumb dot */}
        {duration > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -ml-1.5"
            style={{ left: `${progress}%` }}
          />
        )}
        {/* Invisible range input for interaction */}
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

      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        {/* ── Left: album art + song/station info ── */}
        <div className="flex items-center gap-3 w-full md:w-1/3 min-w-[180px]">
          <div className="relative w-11 h-11 md:w-13 md:h-13 rounded-full overflow-hidden shadow-lg border-2 border-emerald-500/50 flex-shrink-0">
            <img
              src={
                currentSong?.cover_url ||
                station.image_url ||
                "https://via.placeholder.com/50"
              }
              alt={station.name}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="flex items-end gap-[2px] h-3.5">
                  {[
                    { from: "40%", to: "100%", delay: 0 },
                    { from: "100%", to: "40%", delay: 0.12 },
                    { from: "60%", to: "100%", delay: 0.25 },
                  ].map((bar, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [bar.from, bar.to, bar.from] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5,
                        delay: bar.delay,
                      }}
                      className="w-[3px] bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden min-w-0">
            <h4 className="font-bold text-white truncate text-sm md:text-base leading-tight">
              {currentSong?.title || station.name}
            </h4>
            {currentSong?.primary_artist && (
              <p className="text-[11px] text-emerald-400 truncate font-medium">
                {currentSong.primary_artist}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isPlaying ? "Playing" : "Paused"}
                </span>
              </div>
              {totalSongs > 0 && (
                <span className="text-[10px] text-slate-500">
                  {songIndex + 1}/{totalSongs}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Center: controls + time display ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
          {/* Playback buttons */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={onPlayPause}
              className="w-11 h-11 md:w-13 md:h-13 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-110 transition-all duration-300 bg-emerald-500 text-white"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 md:w-6 md:h-6 fill-white" />
              ) : (
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-white ml-0.5" />
              )}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Time labels — only shown on md+ */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-600">·</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        {/* ── Right: volume + like + close ── */}
        <div className="hidden md:flex w-1/3 flex-col items-end gap-2">
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onToggleLike}
              className={`transition-all hover:scale-110 ${
                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
              }`}
            >
              <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
            >
              <X size={17} />
            </button>
          </div>
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-emerald-500 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={15} />
              ) : (
                <Volume2 size={15} />
              )}
            </button>
            <div className="relative h-1.5 bg-gray-700 rounded-full cursor-pointer w-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-emerald-500"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
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

  // Player state
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

  // Refs to avoid stale closures
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

  // ── Fetch stations ──────────────────────────────────────────────────────────
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

  // ── Single Audio instance — runs ONCE ──────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMeta = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
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

  // ── Sync volume / mute ──────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ── Load songs (2-step) then play ──────────────────────────────────────────
  const loadAndPlayStation = useCallback(async (station) => {
    if (!station) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Same station → toggle
    if (currentStationRef.current?.id === station.id) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
      return;
    }

    // New station
    audio.pause();
    setPlaying(false);
    setNoSongsError(false);
    setLoadingSongs(true);
    setCurrentTime(0);
    setDuration(0);

    try {
      // STEP 1: get song_ids
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

      // STEP 2: fetch from releases
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

      // Increment listener count
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

      // Play first song
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

  // ── Skip helpers ────────────────────────────────────────────────────────────
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

  // ── Derived ─────────────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
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

                    {/* Overlay */}
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

                    {/* Live badge */}
                    {isCurrentlyPlaying && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-emerald-500 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Live
                        </span>
                      </div>
                    )}

                    {/* No songs error badge */}
                    {isActive && noSongsError && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500 px-3 py-1 rounded-full">
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">
                          No songs
                        </span>
                      </div>
                    )}

                    {/* Like button */}
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

      {/* Bottom Player */}
      <AnimatePresence>
        {currentStation && !noSongsError && (
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Radio;
