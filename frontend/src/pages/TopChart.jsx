import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Headphones,
  Users,
  Clock,
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

// ─── DURATION HELPERS ───
const parseDurationToSeconds = (val) => {
  if (!val || val === "") return 0;
  if (typeof val === "number") return Math.max(0, val);
  if (typeof val === "string") {
    if (val.includes(":")) {
      const parts = val.split(":");
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10);
        const s = parseFloat(parts[1]);
        return (isNaN(m) ? 0 : m * 60) + (isNaN(s) ? 0 : s);
      }
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parseFloat(parts[2]);
        return (
          (isNaN(h) ? 0 : h * 3600) +
          (isNaN(m) ? 0 : m * 60) +
          (isNaN(s) ? 0 : s)
        );
      }
    }
    const num = parseFloat(val);
    if (!isNaN(num)) return Math.max(0, num);
  }
  return 0;
};

const formatDuration = (val) => {
  const s = parseDurationToSeconds(val);
  if (!s || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
};

const formatTotalDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  if (h > 0) return `${h} hr ${m} min`;
  if (m > 0) return `${m} min ${sec} sec`;
  return `${sec} sec`;
};

const formatCount = (num) => {
  if (!num || num === 0) return "0";
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

// ─── ARTIST LINK — navigates using the CORRECT release primary_artist name ───
const ArtistLink = ({ name, className = "" }) => {
  const navigate = useNavigate();
  if (!name) return null;
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/artist/${encodeURIComponent(name.trim())}`);
      }}
      className={`cursor-pointer hover:text-blue-600 hover:underline transition-colors ${className}`}
    >
      {name}
    </span>
  );
};

// ─── Renders multiple artists with comma separators, each clickable ───
const ArtistList = ({ names, baseClassName = "", separator = ", " }) => {
  if (!names || names.length === 0) return null;
  return (
    <span className="flex items-center flex-wrap">
      {names.map((name, i) => (
        <span key={`${name}-${i}`} className="flex items-center">
          <ArtistLink name={name} className={baseClassName} />
          {i < names.length - 1 && (
            <span className="text-slate-400 text-inherit">{separator}</span>
          )}
        </span>
      ))}
    </span>
  );
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
  // ✅ Use _primaryArtist from releases table (not chart_songs.artist)
  const displayName = song._primaryArtist || song.artist || "";
  const featArtists = parseArtists(
    song._primaryFeatArtists || song.featuringArtists || "",
  );

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
            {/* ✅ Clickable primary artist from releases table */}
            <p className="text-xs text-gray-400 truncate mt-1">
              <ArtistLink
                name={displayName}
                className="text-xs text-gray-400 hover:text-blue-400"
              />
            </p>
            {/* ✅ Clickable featuring artists from releases table */}
            {featArtists.length > 0 && (
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <span className="text-gray-600 text-[10px] font-semibold">
                  ft.
                </span>
                <ArtistList
                  names={featArtists}
                  baseClassName="text-xs text-gray-500 hover:text-blue-400"
                  separator=", "
                />
              </p>
            )}
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

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
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
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const [durationCache, setDurationCache] = useState({});
  const audioRef = useRef(null);
  const currentSongIdRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(0);
  const playingRef = useRef(false);
  const chartsRef = useRef([]);
  const activeChartRef = useRef(null);

  useEffect(() => {
    currentListRef.current = currentList;
  }, [currentList]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    chartsRef.current = charts;
  }, [charts]);
  useEffect(() => {
    activeChartRef.current = activeChart;
  }, [activeChart]);

  // ─── FETCH: Also grabs primary_artist & featuring_artists from releases ───
  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        const { data: chartsData, error: chartsError } = await supabase
          .from("charts")
          .select(
            `
            *,
            chart_songs (
              id, title, artist, featuring_artists,
              album_name, cover_url, audio_url, duration, release_id
            )
          `,
          )
          .order("created_at", { ascending: false });
        if (chartsError) throw chartsError;

        const allSongs = (chartsData || []).flatMap((c) => c.chart_songs || []);
        const uniqueReleaseIds = [
          ...new Set(allSongs.map((s) => s.release_id).filter(Boolean)),
        ];

        const releaseMap = {};
        if (uniqueReleaseIds.length > 0) {
          for (let i = 0; i < uniqueReleaseIds.length; i += 100) {
            const chunk = uniqueReleaseIds.slice(i, i + 100);
            // ✅ KEY FIX: Also fetch primary_artist & featuring_artists from releases
            const { data: relData, error: relError } = await supabase
              .from("releases")
              .select(
                "id, play_count, listeners_count, duration, primary_artist, featuring_artists",
              )
              .in("id", chunk);
            if (relError) {
              console.error("releases fetch error:", relError);
            } else {
              (relData || []).forEach((r) => {
                releaseMap[r.id] = {
                  play_count:
                    typeof r.play_count === "number" ? r.play_count : 0,
                  listeners_count:
                    typeof r.listeners_count === "number"
                      ? r.listeners_count
                      : 0,
                  _durationFallbackSec: parseDurationToSeconds(r.duration),
                  // ✅ Store actual release names for correct navigation
                  _primaryArtist: r.primary_artist || "",
                  _primaryFeatArtists: r.featuring_artists || "",
                };
              });
            }
          }
        }

        const patchedCharts = (chartsData || []).map((chart) => ({
          ...chart,
          chart_songs: (chart.chart_songs || []).map((cs) => {
            const rel = cs.release_id ? releaseMap[cs.release_id] || {} : {};
            return {
              ...cs,
              _playCount: rel.play_count ?? 0,
              _listenersCount: rel.listeners_count ?? 0,
              _durationFallbackSec: rel._durationFallbackSec ?? 0,
              // ✅ These come from releases table — ensures correct artist name for navigation
              _primaryArtist: rel._primaryArtist || cs.artist || "",
              _primaryFeatArtists:
                rel._primaryFeatArtists || cs.featuring_artists || "",
            };
          }),
        }));

        setCharts(patchedCharts);
        chartsRef.current = patchedCharts;
      } catch (err) {
        console.error("fetchCharts error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  // ─── AUDIO SETUP ───
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime),
    );
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration);
      if (currentSongIdRef.current && audio.duration > 0) {
        setDurationCache((prev) => ({
          ...prev,
          [currentSongIdRef.current]: audio.duration,
        }));
      }
    });
    audio.addEventListener("play", () => {
      setPlaying(true);
      playingRef.current = true;
    });
    audio.addEventListener("pause", () => {
      setPlaying(false);
      playingRef.current = false;
    });
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

  // ─── INCREMENT PLAY COUNT ───
  const incrementPlayCount = useCallback(async (releaseId) => {
    if (!releaseId) return;
    const updateSongField = (prev) =>
      prev.map((chart) => ({
        ...chart,
        chart_songs: chart.chart_songs.map((cs) =>
          cs.release_id === releaseId
            ? { ...cs, _playCount: (cs._playCount || 0) + 1 }
            : cs,
        ),
      }));
    setCharts((prev) => {
      chartsRef.current = updateSongField(prev);
      return chartsRef.current;
    });
    setActiveChart((prev) => {
      if (!prev) return prev;
      activeChartRef.current = {
        ...prev,
        chart_songs: prev.chart_songs.map((cs) =>
          cs.release_id === releaseId
            ? { ...cs, _playCount: (cs._playCount || 0) + 1 }
            : cs,
        ),
      };
      return activeChartRef.current;
    });
    setCurrentSong((prev) => {
      if (prev && prev.release_id === releaseId)
        return { ...prev, _playCount: (prev._playCount || 0) + 1 };
      return prev;
    });
    try {
      const { data, error } = await supabase
        .from("releases")
        .select("play_count")
        .eq("id", releaseId)
        .single();
      if (!error && data) {
        await supabase
          .from("releases")
          .update({ play_count: (data.play_count || 0) + 1 })
          .eq("id", releaseId);
      }
    } catch (err) {
      console.error("incrementPlayCount error:", err);
    }
  }, []);

  // ─── PLAY SONG ───
  const playSong = useCallback(
    (song) => {
      if (!song) return;
      const audio = audioRef.current;
      currentSongIdRef.current = song.id;
      setCurrentSong((prev) => {
        if (prev?.id !== song.id) {
          setCurrentTime(0);
          setAudioDuration(0);
          audio.src = song.audio_url;
          audio.load();
        }
        return song;
      });
      if (song.release_id) incrementPlayCount(song.release_id);
      audio
        .play()
        .then(() => {
          setPlaying(true);
          playingRef.current = true;
        })
        .catch((err) => console.warn("Play blocked:", err.message));
    },
    [incrementPlayCount],
  );

  const handlePlayPause = useCallback(
    (song) => {
      if (currentSongIdRef.current === song.id && playingRef.current) {
        audioRef.current.pause();
        setPlaying(false);
        playingRef.current = false;
      } else {
        playSong(song);
      }
    },
    [playSong],
  );

  const handleSongClick = useCallback(
    (index, song, list) => {
      if (currentSongIdRef.current === song.id) {
        handlePlayPause(song);
      } else {
        setCurrentList(list);
        currentListRef.current = list;
        setCurrentIndex(index);
        currentIndexRef.current = index;
        playSong(song);
      }
    },
    [handlePlayPause, playSong],
  );

  const handlePlayButtonClick = useCallback(
    (e, index, song, list) => {
      e.stopPropagation();
      handleSongClick(index, song, list);
    },
    [handleSongClick],
  );

  const handleChartTrackPlay = useCallback(
    (track, trackList, trackIndex) => {
      handleSongClick(trackIndex, track, trackList);
    },
    [handleSongClick],
  );

  const handleNext = useCallback(() => {
    const list = currentListRef.current;
    let curIdx = currentIndexRef.current;
    if (list && list.length > 0) {
      const f = list.findIndex((s) => s.id === currentSongIdRef.current);
      if (f !== -1) curIdx = f;
    }
    if (!list || list.length === 0) return;
    let nextIdx = isShuffle
      ? (() => {
          let n;
          do {
            n = Math.floor(Math.random() * list.length);
          } while (list.length > 1 && n === curIdx);
          return n;
        })()
      : (curIdx + 1) % list.length;
    const nextSong = list[nextIdx];
    if (nextSong) {
      currentListRef.current = list;
      currentIndexRef.current = nextIdx;
      setCurrentIndex(nextIdx);
      playSong(nextSong);
    }
  }, [isShuffle, playSong]);

  const handlePrev = useCallback(() => {
    const list = currentListRef.current;
    let curIdx = currentIndexRef.current;
    if (list && list.length > 0) {
      const f = list.findIndex((s) => s.id === currentSongIdRef.current);
      if (f !== -1) curIdx = f;
    }
    if (!list || list.length === 0) return;
    const prevIdx = (curIdx - 1 + list.length) % list.length;
    const prevSong = list[prevIdx];
    if (prevSong) {
      currentListRef.current = list;
      currentIndexRef.current = prevIdx;
      setCurrentIndex(prevIdx);
      playSong(prevSong);
    }
  }, [playSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const h = () => handleNext();
    audio.addEventListener("ended", h);
    return () => audio.removeEventListener("ended", h);
  }, [handleNext]);

  const handleSeek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);
  const handleClosePlayer = useCallback(() => {
    setPlaying(false);
    playingRef.current = false;
    setCurrentSong(null);
    currentSongIdRef.current = null;
    setCurrentTime(0);
    setAudioDuration(0);
    setCurrentList([]);
    currentListRef.current = [];
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleChartClick = useCallback(
    (chart) => {
      setActiveChart(chart);
      activeChartRef.current = chart;
      const songList = chart.chart_songs || [];
      setCurrentList(songList);
      currentListRef.current = songList;
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      if (songList.length > 0) playSong(songList[0]);
    },
    [playSong],
  );

  const handleBack = useCallback(() => {
    setActiveChart(null);
    activeChartRef.current = null;
  }, []);
  const toggleLike = useCallback((songId, e) => {
    e.stopPropagation();
    setLikedSongs((prev) => ({ ...prev, [songId]: !prev[songId] }));
  }, []);

  // ─── COMPUTED HELPERS — use _primaryArtist from releases for correct names ───
  const getAllArtists = (chart) => {
    if (!chart?.chart_songs) return [];
    const set = new Set();
    chart.chart_songs.forEach((s) => {
      // ✅ Use _primaryArtist from releases table (not chart_songs.artist)
      parseArtists(s._primaryArtist).forEach((a) => {
        if (a) set.add(a);
      });
      parseArtists(s._primaryFeatArtists).forEach((a) => {
        if (a) set.add(a);
      });
    });
    return [...set];
  };

  const getTotalListeners = (chart) => {
    if (!chart?.chart_songs) return 0;
    return chart.chart_songs.reduce(
      (sum, s) => sum + (s._listenersCount || 0),
      0,
    );
  };

  const getSongListeners = (song) => song._listenersCount || 0;

  const getSongDurationSeconds = (song) => {
    if (currentSong?.id === song.id && audioDuration > 0) return audioDuration;
    if (durationCache[song.id] > 0) return durationCache[song.id];
    const fromDB = parseDurationToSeconds(song.duration);
    if (fromDB > 0) return fromDB;
    return song._durationFallbackSec || 0;
  };

  const getTotalDuration = (chart) => {
    if (!chart?.chart_songs) return 0;
    return chart.chart_songs.reduce(
      (sum, s) => sum + getSongDurationSeconds(s),
      0,
    );
  };

  const getSongDisplayDuration = (song) => {
    if (currentSong?.id === song.id && audioDuration > 0)
      return `${formatDuration(currentTime)} / ${formatDuration(audioDuration)}`;
    const sec = getSongDurationSeconds(song);
    return sec > 0 ? formatDuration(sec) : "—";
  };

  // Helper: get all artist names for a single song from releases data
  const getSongAllArtists = (song) => {
    const primary = parseArtists(song._primaryArtist || song.artist);
    const feat = parseArtists(
      song._primaryFeatArtists || song.featuring_artists,
    );
    return [...new Set([...primary, ...feat])];
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

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
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
              {/* ── GRID VIEW ── */}
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
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                              <span className="flex items-center gap-1">
                                <Music size={10} />{" "}
                                {chart.chart_songs?.length || 0} Songs
                              </span>
                              <span className="flex items-center gap-1">
                                <Headphones size={10} />{" "}
                                {formatCount(getTotalListeners(chart))}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />{" "}
                                {formatTotalDuration(getTotalDuration(chart))}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChartClick(chart);
                              }}
                            >
                              <Play size={16} fill="white" className="ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── TABLE VIEW ── */}
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
                            "Duration",
                            "Listeners",
                            "Artists",
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
                        {displayCharts.map((chart) => {
                          const allArtists = getAllArtists(chart);
                          return (
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
                                {/* ✅ Use _primaryArtist for first artist in table */}
                                <div className="text-sm text-slate-500">
                                  <ArtistLink
                                    name={
                                      allArtists[0] ||
                                      chart.artist ||
                                      "Various Artists"
                                    }
                                    className="text-sm text-slate-500 hover:text-blue-600"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-700">
                                  {chart.type}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {chart.year || ""}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {chart.chart_songs?.length || 0} Songs
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="flex items-center gap-1 text-sm text-slate-600">
                                  <Clock size={14} className="text-slate-400" />
                                  {formatTotalDuration(getTotalDuration(chart))}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                                  <Headphones
                                    size={14}
                                    className="text-blue-500"
                                  />
                                  {formatCount(getTotalListeners(chart))}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <Users size={14} className="text-slate-400" />
                                  {allArtists.length} Artists
                                </div>
                                {/* ✅ All artist names clickable using _primaryArtist from releases */}
                                <div className="text-xs text-slate-400 truncate max-w-[150px] flex flex-wrap gap-0.5">
                                  {allArtists.slice(0, 3).map((a, i) => (
                                    <span key={a} className="flex items-center">
                                      <ArtistLink
                                        name={a}
                                        className="text-xs text-slate-400 hover:text-blue-600"
                                      />
                                      {i <
                                        Math.min(allArtists.length, 3) - 1 && (
                                        <span className="text-slate-300 text-xs">
                                          ,
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                  {allArtists.length > 3 && (
                                    <span className="text-slate-300 text-xs">
                                      ...
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChartClick(chart);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center justify-end gap-2 ml-auto"
                                >
                                  View <ChevronRight size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── CHART DETAIL / PROFILE VIEW ─── */}
      <AnimatePresence>
        {activeChart && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
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
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wide w-fit">
                  {activeChart.type}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
                  {activeChart.title}
                </h1>

                {/* ✅ Stats: Listeners count from releases.listeners_count */}
                <div className="flex items-center gap-4 text-sm flex-wrap mb-3">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Headphones size={16} className="text-blue-500" />
                    {formatCount(getTotalListeners(activeChart))} Listeners
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Music size={16} className="text-blue-500" />
                    {activeChart.chart_songs?.length || 0} Songs
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Clock size={16} className="text-blue-500" />
                    {formatTotalDuration(getTotalDuration(activeChart))}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Users size={16} className="text-blue-500" />
                    {getAllArtists(activeChart).length} Artists
                  </span>
                </div>

                {activeChart.description && (
                  <p className="text-slate-500 text-sm mb-4 max-w-xl">
                    {activeChart.description}
                  </p>
                )}

                {/* ✅ Artist pills — all using _primaryArtist from releases */}
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Artists
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getAllArtists(activeChart).map((artist, i) => (
                      <button
                        key={`${artist}-${i}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/artist/${encodeURIComponent(artist.trim())}`,
                          );
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-full transition-colors"
                      >
                        {artist}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      if (activeChart.chart_songs?.length > 0)
                        handlePlayButtonClick(
                          e,
                          0,
                          activeChart.chart_songs[0],
                          activeChart.chart_songs,
                        );
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

            {/* Song List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="hidden md:grid grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,6rem)_minmax(0,5rem)_2.5rem_5.5rem] gap-2 px-5 py-3 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="text-center">#</span>
                <span>Title</span>
                <span>Artists</span>
                <span>Movie / Album</span>
                <span className="text-center">Listeners</span>
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
                  // ✅ Get artist names from releases table data
                  const allSongArtists = getSongAllArtists(song);
                  const listeners = getSongListeners(song);

                  return (
                    <div key={song.id}>
                      {/* ── MOBILE ── */}
                      <div
                        onClick={() =>
                          handleSongClick(index, song, activeChart.chart_songs)
                        }
                        className={`md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-b-0 transition-colors cursor-pointer ${isActive ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center justify-center w-6 shrink-0">
                          {isActive && playing ? (
                            <div className="flex items-end gap-[2px] h-3.5">
                              <motion.div
                                animate={{ height: ["30%", "100%", "30%"] }}
                                transition={{ repeat: Infinity, duration: 0.6 }}
                                className="w-[2.5px] bg-blue-600 rounded-full"
                              />
                              <motion.div
                                animate={{ height: ["100%", "30%", "100%"] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6,
                                  delay: 0.15,
                                }}
                                className="w-[2.5px] bg-blue-600 rounded-full"
                              />
                              <motion.div
                                animate={{ height: ["50%", "100%", "50%"] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6,
                                  delay: 0.3,
                                }}
                                className="w-[2.5px] bg-blue-600 rounded-full"
                              />
                            </div>
                          ) : (
                            <span
                              className={`text-xs font-semibold tabular-nums ${isActive ? "text-blue-600" : "text-slate-400"}`}
                            >
                              {index + 1}
                            </span>
                          )}
                        </div>
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
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold truncate leading-tight ${isActive ? "text-blue-600" : "text-slate-900"}`}
                          >
                            {song.title}
                          </p>
                          {/* ✅ Clickable primary artist from releases */}
                          <p className="text-[11px] text-slate-500 truncate">
                            <ArtistLink
                              name={song._primaryArtist || song.artist}
                              className={`text-[11px] truncate ${isActive ? "text-blue-400 hover:text-blue-500" : "text-slate-500 hover:text-blue-600"}`}
                            />
                          </p>
                          {/* ✅ Clickable featuring artists from releases */}
                          {song._primaryFeatArtists && (
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                              <span className="text-slate-500 text-[10px] font-semibold">
                                ft.
                              </span>
                              <ArtistList
                                names={parseArtists(song._primaryFeatArtists)}
                                baseClassName={`text-[11px] truncate ${isActive ? "text-blue-400 hover:text-blue-500" : "text-slate-400 hover:text-blue-600"}`}
                                separator=", "
                              />
                            </p>
                          )}
                          {/* ✅ Per-song listeners count */}
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Headphones size={10} />
                              {formatCount(listeners)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {getSongDisplayDuration(song)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleLike(song.id, e)}
                          className={`shrink-0 p-1 transition-all duration-200 hover:scale-125 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-slate-500"}`}
                        >
                          <Heart
                            size={16}
                            fill={isLiked ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      {/* ── DESKTOP ── */}
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        onClick={() =>
                          handleSongClick(index, song, activeChart.chart_songs)
                        }
                        className={`hidden md:grid grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,6rem)_minmax(0,5rem)_2.5rem_5.5rem] gap-2 px-5 py-3 border-b border-slate-50 last:border-b-0 transition-colors group cursor-pointer items-center ${isActive ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                      >
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
                        {/* ✅ All artists clickable — using _primaryArtist from releases */}
                        <div className="flex items-center min-w-0">
                          <div className="flex flex-wrap items-center">
                            {allSongArtists.map((artist, i) => (
                              <span
                                key={`${artist}-${i}`}
                                className="flex items-center"
                              >
                                <ArtistLink
                                  name={artist}
                                  className={`text-[13px] hover:text-blue-600 hover:underline transition-colors truncate ${isActive ? "text-blue-400" : "text-slate-500"}`}
                                />
                                {i < allSongArtists.length - 1 && (
                                  <span className="text-slate-300 text-[13px] mx-[2px]">
                                    ,
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center min-w-0">
                    
{song.album_name ? (
  <button
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/album/${encodeURIComponent(song.album_name)}`);
    }}
    className="text-[13px] text-slate-600 hover:text-blue-600 hover:underline transition-colors truncate"
  >
    {song.album_name}
  </button>
) : (
  <span className="text-[13px] text-slate-300">—</span>
)}
                        </div>
                        {/* ✅ Per-song listeners count */}
                        <div className="flex items-center justify-center gap-1.5">
                          <Headphones
                            size={13}
                            className={
                              isActive ? "text-blue-500" : "text-slate-400"
                            }
                          />
                          <span
                            className={`text-[13px] font-semibold tabular-nums ${isActive ? "text-blue-500" : "text-slate-500"}`}
                          >
                            {formatCount(listeners)}
                          </span>
                        </div>
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
                        <div
                          className={`text-right font-mono tabular-nums pr-1 text-[13px] ${isActive ? "text-blue-500" : "text-slate-400"}`}
                        >
                          {getSongDisplayDuration(song)}
                        </div>
                      </motion.div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── STICKY PLAYER — uses _primaryArtist from releases ─── */}
      <AnimatePresence>
        {currentSong && (
          <StickyPlayer
            song={{
              ...currentSong,
              albumArt: currentSong.cover_url,
              // ✅ Pass releases table names so player shows correct clickable artists
              artist: currentSong._primaryArtist || currentSong.artist,
              featuringArtists:
                currentSong._primaryFeatArtists ||
                currentSong.featuring_artists,
            }}
            isPlaying={playing}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onPrev={handlePrev}
            onNext={handleNext}
            currentTime={currentTime}
            duration={audioDuration}
            volume={volume}
            onVolumeChange={setVolume}
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
