import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  ArrowLeft,
  Loader2,
  Search,
  Shuffle,
  Music,
  Grid3x3,
  List,
  ChevronRight,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LANGUAGES = [
  "All",
  "Hindi",
  "English",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Bhojpuri",
  "International",
];

const formatDuration = (val) => {
  if (!val) return "0:00";
  if (typeof val === "string" && val.includes(":")) return val;
  const num = parseFloat(val);
  if (isNaN(num)) return "0:00";
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return String(num);
};

const parseArtists = (str) => {
  if (!str) return [];
  return str
    .split(/,\s*/)
    .map((a) => a.trim())
    .filter(Boolean);
};

// ─── STICKY PLAYER ───
const StickyPlayer = ({
  song,
  isPlaying,
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  isMuted,
  toggleMute,
  isShuffle,
  onToggleShuffle,
  onClose,
}) => {
  if (!song) return null;
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
            <img
              src={song.albumArt || "https://via.placeholder.com/50"}
              alt="Art"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">
              {song.title}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-1">
              {song.artist}
              {song.featuringArtists ? ` ft. ${song.featuringArtists}` : ""}
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPlayPause(song)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-slate-900" />
              ) : (
                <Play className="w-6 h-6 fill-slate-900 ml-1" />
              )}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleShuffle}
              className={`transition-all hover:scale-110 ${isShuffle ? "text-green-500" : "text-gray-400 hover:text-white"}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
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
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                style={{
                  width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: duration ? `${(currentTime / duration) * 100}%` : "0%",
                  marginLeft: "-6px",
                }}
              />
            </div>
            <span className="w-10 font-mono">{formatDuration(duration)}</span>
          </div>
        </div>
        <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
          <div className="flex items-center gap-3 w-full justify-end">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
              title="Close Player"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 w-full justify-end mt-1">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-green-500 transition-colors hover:scale-110"
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
                  e.stopPropagation();
                  onVolumeChange(parseFloat(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-green-500"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───
const TopChart = () => {
  const navigate = useNavigate();
  const [charts, setCharts] = useState([]);
  const [activeChart, setActiveChart] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isSurpriseMe, setIsSurpriseMe] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [likedSongs, setLikedSongs] = useState({});

  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Duration cache — jab song play hoga toh audio se exact duration save hogi
  const [durationCache, setDurationCache] = useState({});
  const audioRef = useRef(null);
  const currentSongIdRef = useRef(null);

  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("charts")
          .select(
            `*, chart_songs ( id, title, artist, featuring_artists, album_name, cover_url, audio_url, duration, release_id )`,
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        setCharts(data || []);
      } catch (err) {
        console.error("Error fetching charts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime),
    );
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration);
      // Audio se exact duration fetch karke cache mein save karo
      if (currentSongIdRef.current && audio.duration > 0) {
        setDurationCache((prev) => ({
          ...prev,
          [currentSongIdRef.current]: audio.duration,
        }));
      }
    });
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => handleNext();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [activeChart, currentSong, isShuffle]);

  const playSong = (song) => {
    if (!song) return;
    const audio = audioRef.current;
    currentSongIdRef.current = song.id;
    if (currentSong?.id !== song.id) {
      setCurrentSong(song);
      setCurrentTime(0);
      setAudioDuration(0);
      audio.src = song.audio_url;
      audio.load();
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(console.error);
  };

  const handleNext = () => {
    if (!activeChart || !currentSong) return;
    const songs = activeChart.chart_songs;
    if (!songs?.length) return;
    let nextIdx;
    if (isShuffle) {
      const cur = songs.findIndex((s) => s.id === currentSong.id);
      do {
        nextIdx = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && nextIdx === cur);
    } else {
      nextIdx =
        (songs.findIndex((s) => s.id === currentSong.id) + 1) % songs.length;
    }
    playSong(songs[nextIdx]);
  };

  const handlePrev = () => {
    if (!activeChart || !currentSong) return;
    const songs = activeChart.chart_songs;
    if (!songs?.length) return;
    const prevIdx =
      (songs.findIndex((s) => s.id === currentSong.id) - 1 + songs.length) %
      songs.length;
    playSong(songs[prevIdx]);
  };

  const handlePlayPause = (song) => {
    if (currentSong?.id === song.id && playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      playSong(song);
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleClosePlayer = () => {
    setPlaying(false);
    setCurrentSong(null);
    setCurrentTime(0);
    setAudioDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleChartClick = (chart) => {
    setActiveChart(chart);
    if (chart.chart_songs?.length > 0) playSong(chart.chart_songs[0]);
  };

  const handleBack = () => setActiveChart(null);

  const toggleLike = (songId, e) => {
    e.stopPropagation();
    setLikedSongs((prev) => ({ ...prev, [songId]: !prev[songId] }));
  };

  const filteredCharts = charts.filter((chart) => {
    const langMatch =
      activeFilter === "All" ||
      (chart.language || "").toLowerCase() === activeFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return langMatch;
    return (
      langMatch &&
      ((chart.title || "").toLowerCase().includes(q) ||
        (chart.artist || "").toLowerCase().includes(q))
    );
  });

  const displayCharts = isSurpriseMe
    ? [...filteredCharts].sort(() => Math.random() - 0.5)
    : filteredCharts;

  // Song ka exact duration nikalo — cache > DB > audio live > "—"
  const getSongDisplayDuration = (song) => {
    const isActive = currentSong?.id === song.id;

    // Agar song abhi play ho raha hai toh "current / total" dikhao
    if (isActive && audioDuration > 0) {
      return `${formatDuration(currentTime)} / ${formatDuration(audioDuration)}`;
    }

    // Cache mein hai (pehle play hua tha)
    if (durationCache[song.id]) {
      return formatDuration(durationCache[song.id]);
    }

    // DB mein stored hai
    if (song.duration) {
      return formatDuration(song.duration);
    }

    return "—";
  };

  return (
    <div className="w-full h-full pb-20 relative animate-in fade-in duration-500">
      {/* ─── CHARTS LIST VIEW ─── */}
      {!activeChart && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Top Music{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                  Charts
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Curated hits from around the world.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title or artist..."
                  className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-md transition-all ${viewMode === "table" ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <List size={18} />
                  </button>
                </div>
                <button
                  onClick={() => setIsSurpriseMe(!isSurpriseMe)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${isSurpriseMe ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"}`}
                >
                  <Shuffle size={18} />{" "}
                  {isSurpriseMe ? "Shuffled!" : "Surprise Me"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {LANGUAGES.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setSearchQuery("");
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeFilter === filter ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : displayCharts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
              <h3 className="text-lg font-bold text-slate-900">
                No charts found
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mt-2">
                Try adjusting your search or language filter.
              </p>
            </div>
          ) : (
            <>
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayCharts.map((chart, index) => (
                    <motion.div
                      key={chart.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      onClick={() => handleChartClick(chart)}
                      className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
                    >
                      <img
                        src={
                          chart.image_url ||
                          "https://via.placeholder.com/400x200"
                        }
                        alt={chart.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                      <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                              {chart.type}
                            </p>
                            <h3 className="text-xl font-bold leading-tight mb-1 group-hover:text-blue-300 transition-colors line-clamp-2">
                              {chart.title}
                            </h3>
                            <p className="text-xs text-slate-300 flex items-center gap-1">
                              <Music size={10} />{" "}
                              {chart.chart_songs?.length || 0} Songs
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
                              <Play size={16} fill="white" className="ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {viewMode === "table" && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          {[
                            "Cover",
                            "Title",
                            "Details",
                            "Tracks",
                            "Action",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {displayCharts.map((chart) => (
                          <tr
                            key={chart.id}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => handleChartClick(chart)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <img
                                className="h-16 w-16 rounded-lg object-cover shadow-sm"
                                src={
                                  chart.image_url ||
                                  "https://via.placeholder.com/100"
                                }
                                alt=""
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-900">
                                {chart.title}
                              </div>
                              <div className="text-sm text-slate-500">
                                {chart.artist || "Various Artists"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">
                                {chart.type}
                              </div>
                              <div className="text-xs text-slate-500">
                                {chart.year || ""} • {chart.language}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {chart.chart_songs?.length || 0} Songs
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center justify-end gap-2 ml-auto">
                                View <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── DETAIL VIEW — 6 COLUMN TABLE ─── */}
      <AnimatePresence>
        {activeChart && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            {/* Chart Header */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors self-start group"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="text-sm font-medium">Back</span>
              </button>

              <div className="w-44 h-44 rounded-2xl overflow-hidden shadow-xl border border-slate-200 flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={activeChart.image_url}
                  className="w-full h-full object-cover"
                  alt="Cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/200";
                  }}
                />
              </div>

              <div className="flex flex-col justify-center flex-1">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wide w-fit">
                  {activeChart.type}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                  {activeChart.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
                  <span className="font-semibold text-slate-700">
                    {formatCount(activeChart.fans_count || 0)} Fans
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>{activeChart.chart_songs?.length || 0} Songs</span>
                  {activeChart.language && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{activeChart.language}</span>
                    </>
                  )}
                </div>
                {activeChart.description && (
                  <p className="text-slate-500 text-sm mb-4 max-w-xl">
                    {activeChart.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activeChart.chart_songs?.length > 0)
                        handlePlayPause(activeChart.chart_songs[0]);
                    }}
                    className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                  >
                    {playing &&
                    currentSong?.id === activeChart.chart_songs?.[0]?.id ? (
                      <>
                        <Pause size={20} /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={20} fill="white" /> Play
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ─── 6 COLUMN SONG TABLE ─── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,6rem)_2.5rem_5.5rem] gap-2 px-5 py-3 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="text-center">#</span>
                <span>Title</span>
                <span className="hidden md:block">Artists</span>
                <span className="hidden md:block">Movie</span>
                <span></span>
                <span className="text-right pr-1">Duration</span>
              </div>

              {!activeChart.chart_songs ||
              activeChart.chart_songs.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  No songs in this chart yet.
                </div>
              ) : (
                activeChart.chart_songs.map((song, index) => {
                  const isActive = currentSong?.id === song.id;
                  const isLiked = likedSongs[song.id];
                  const primaryArtists = parseArtists(song.artist);
                  const featArtists = parseArtists(song.featuring_artists);
                  const allArtists = [
                    ...new Set([...primaryArtists, ...featArtists]),
                  ];

                  return (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      onClick={() => handlePlayPause(song)}
                      className={`grid grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,6rem)_2.5rem_5.5rem] gap-2 px-5 py-3 border-b border-slate-50 last:border-b-0 transition-colors group cursor-pointer items-center ${isActive ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                    >
                      {/* ── 1. Serial # / Playing bars ── */}
                      <div className="flex items-center justify-center">
                        {isActive && playing ? (
                          <div className="flex items-end gap-[3px] h-4">
                            <motion.div
                              animate={{ height: ["30%", "100%", "30%"] }}
                              transition={{ repeat: Infinity, duration: 0.6 }}
                              className="w-[3px] bg-blue-600 rounded-full"
                            />
                            <motion.div
                              animate={{ height: ["100%", "30%", "100%"] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.6,
                                delay: 0.15,
                              }}
                              className="w-[3px] bg-blue-600 rounded-full"
                            />
                            <motion.div
                              animate={{ height: ["50%", "100%", "50%"] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.6,
                                delay: 0.3,
                              }}
                              className="w-[3px] bg-blue-600 rounded-full"
                            />
                          </div>
                        ) : (
                          <>
                            <span
                              className={`text-sm font-semibold tabular-nums group-hover:hidden ${isActive ? "text-blue-600" : "text-slate-400"}`}
                            >
                              {index + 1}
                            </span>
                            <Play
                              size={15}
                              className="text-blue-600 hidden group-hover:block fill-blue-600"
                            />
                          </>
                        )}
                      </div>

                      {/* ── 2. Song Image + Song Name ── */}
                      <div className="flex items-center gap-3 min-w-0">
                        {song.cover_url ? (
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="w-11 h-11 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Music size={16} className="text-slate-300" />
                          </div>
                        )}
                        <p
                          className={`text-[15px] font-bold truncate leading-tight ${isActive ? "text-blue-600" : "text-slate-900"}`}
                        >
                          {song.title}
                        </p>
                      </div>

                      {/* ── 3. All Artist Names ── */}
                      <div className="hidden md:flex items-center min-w-0">
                        <div className="flex flex-wrap items-center">
                          {allArtists.map((artist, i) => (
                            <span
                              key={`${artist}-${i}`}
                              className="flex items-center"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/artist/${encodeURIComponent(artist)}`,
                                  );
                                }}
                                className={`text-[13px] hover:text-blue-600 hover:underline transition-colors truncate ${isActive ? "text-blue-400" : "text-slate-500"}`}
                              >
                                {artist}
                              </button>
                              {i < allArtists.length - 1 && (
                                <span className="text-slate-300 text-[13px] mx-[2px]">
                                  ,
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ── 4. Movie / Album Name ── */}
                      <div className="hidden md:flex items-center min-w-0">
                        {song.album_name ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/album/${encodeURIComponent(song.album_name)}`,
                              );
                            }}
                            className="text-[13px] text-slate-600 hover:text-blue-600 hover:underline transition-colors truncate"
                          >
                            {song.album_name}
                          </button>
                        ) : (
                          <span className="text-[13px] text-slate-300">—</span>
                        )}
                      </div>

                      {/* ── 5. Like Button ── */}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => toggleLike(song.id, e)}
                          className={`transition-all duration-200 hover:scale-125 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-slate-500"}`}
                        >
                          <Heart
                            size={16}
                            fill={isLiked ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      {/* ── 6. Exact Duration — live current/total ya cached total ── */}
                      <div
                        className={`text-right font-mono tabular-nums pr-1 ${isActive ? "text-blue-500" : "text-slate-400"} text-[13px]`}
                      >
                        {getSongDisplayDuration(song)}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY PLAYER */}
      <AnimatePresence>
        {currentSong && (
          <StickyPlayer
            song={{
              ...currentSong,
              albumArt:
                currentSong.cover_url ||
                activeChart?.image_url ||
                "https://via.placeholder.com/50",
              featuringArtists: currentSong.featuring_artists || "",
            }}
            isPlaying={playing}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onNext={handleNext}
            onPrev={handlePrev}
            currentTime={currentTime}
            duration={audioDuration}
            volume={volume}
            onVolumeChange={(v) => setVolume(v)}
            isMuted={isMuted}
            toggleMute={() => setIsMuted(!isMuted)}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onClose={handleClosePlayer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopChart;
