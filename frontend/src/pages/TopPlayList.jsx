import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  ListMusic,
  ArrowLeft,
  X,
  Music,
  Grid3x3,
  List,
  Loader2,
  Search,
  Users,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Heart,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIGURATION ───
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── UTILITIES ───
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const parseArtists = (str) => {
  if (!str) return [];
  return str
    .split(/,\s*/)
    .map((a) => a.trim())
    .filter(Boolean);
};

// ─── SUB-COMPONENT: STICKY PLAYER ───
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
        {/* LEFT: Song Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img
              src={song.albumArt || "https://via.placeholder.com/50"}
              alt="Art"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">
              {song.title}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-1">{song.artist}</p>
          </div>
        </div>

        {/* CENTER: Controls */}
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPlayPause(song)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 bg-white text-slate-900"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 md:w-7 md:h-7 fill-slate-900" />
              ) : (
                <Play className="w-6 h-6 md:w-7 md:h-7 fill-slate-900 ml-1" />
              )}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleShuffle}
              className={`transition-all hover:scale-110 ${
                isShuffle ? "text-green-500" : "text-gray-400 hover:text-white"
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-medium px-0 md:px-8">
            <span className="w-10 text-right font-mono">
              {formatTime(currentTime)}
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
              ></div>
            </div>
            <span className="w-10 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT: Volume & Close */}
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
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
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

// ─── LANGUAGE FILTERS ───
const LANGUAGES = [
  "For You",
  "Hindi",
  "Tamil",
  "Telugu",
  "English",
  "Punjabi",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Kannada",
  "Bhojpuri",
  "Malayalam",
  "Sanskrit",
  "Haryanvi",
  "Rajasthani",
  "Odia",
  "Assamese",
];

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 select-none ${
      active
        ? "text-white shadow-md transform scale-105"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
    }`}
    style={
      active ? { background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" } : {}
    }
  >
    {label}
  </button>
);

// ─── MAIN COMPONENT ───
const TopPlaylist = ({ isEmbedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState("grid");
  const [layoutMode, setLayoutMode] = useState("grid");
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeFilter, setActiveFilter] = useState("For You");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedSongs, setLikedSongs] = useState({});

  // --- PLAYER STATES ---
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Duration cache system — audio se exact time fetch karke store karega
  const [durationCache, setDurationCache] = useState({});
  const audioRef = useRef(null);
  const currentSongIdRef = useRef(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("playlists")
          .select(
            `*, playlist_songs ( id, title, artist, featuring_artists, album_name, cover_url, audio_url, duration, release_id )`,
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPlaylists(data || []);
      } catch (err) {
        console.error("Error fetching playlists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  // --- AUDIO SYSTEM SETUP ---
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      // Audio se exact duration fetch karke cache mein save karo
      if (currentSongIdRef.current && audio.duration > 0) {
        setDurationCache((prev) => ({
          ...prev,
          [currentSongIdRef.current]: audio.duration,
        }));
      }
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  // Volume Controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Auto-play next song logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => handleNext();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [activePlaylist, currentSong, isShuffle]);

  // ─── PLAY LOGIC ───
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
      .catch((e) => console.error(e));
  };

  const handleNext = () => {
    if (!activePlaylist || !currentSong) return;
    const songs = activePlaylist.playlist_songs;
    if (!songs || songs.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
      do {
        nextIndex = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex =
        (songs.findIndex((s) => s.id === currentSong.id) + 1) % songs.length;
    }
    playSong(songs[nextIndex]);
  };

  const handlePrev = () => {
    if (!activePlaylist || !currentSong) return;
    const songs = activePlaylist.playlist_songs;
    if (!songs || songs.length === 0) return;
    const prevIndex =
      (songs.findIndex((s) => s.id === currentSong.id) - 1 + songs.length) %
      songs.length;
    playSong(songs[prevIndex]);
  };

  const handlePlayPause = (song) => {
    const audio = audioRef.current;
    if (currentSong && currentSong.id === song.id && playing) {
      audio.pause();
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

  // ─── NAVIGATION LOGIC ───
  const handlePlaylistClick = (playlist) => {
    setActivePlaylist(playlist);
    setView("detail");
    if (playlist.playlist_songs && playlist.playlist_songs.length > 0) {
      playSong(playlist.playlist_songs[0]);
    }
  };

  const handleBack = () => {
    setActivePlaylist(null);
    setView("grid");
  };

  const toggleLike = (songId, e) => {
    e.stopPropagation();
    setLikedSongs((prev) => ({ ...prev, [songId]: !prev[songId] }));
  };

  // --- SEARCH LOGIC ---
  const filteredPlaylists = playlists.filter((playlist) => {
    const playlistLang = (playlist.language || "").toLowerCase().trim();
    const activeLang = activeFilter.toLowerCase().trim();
    const matchesLanguage =
      activeLang === "for you" || playlistLang === activeLang;

    const query = searchQuery.toLowerCase().trim();
    const title = (playlist.title || "").toLowerCase();
    const mainArtist = (playlist.artist || "").toLowerCase();
    const songArtistsString =
      playlist.playlist_songs
        ?.map((song) => (song.artist ? song.artist.toLowerCase() : ""))
        .join(" ") || "";

    const matchesSearch =
      title.includes(query) ||
      mainArtist.includes(query) ||
      songArtistsString.includes(query);

    return matchesLanguage && matchesSearch;
  });

  // Get song display duration — cache > DB > audio live > "—"
  const getSongDisplayDuration = (song) => {
    const isActive = currentSong?.id === song.id;

    // Agar song abhi play ho raha hai toh live current / total dikhao
    if (isActive && audioDuration > 0) {
      return `${formatTime(currentTime)} / ${formatTime(audioDuration)}`;
    }

    // Cache mein hai (pehle play hua tha)
    if (durationCache[song.id]) {
      return formatTime(durationCache[song.id]);
    }

    // DB mein stored hai
    if (song.duration) {
      return formatTime(song.duration);
    }

    return "—";
  };

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      {/* --- VIEW 1: GRID PLAYLISTS --- */}
      {view === "grid" && (
        <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div>
                <h1
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
                  style={{ color: "#0f172a" }}
                >
                  Top <span style={{ color: "#1d4ed8" }}>Playlists</span>
                </h1>
                <p className="text-slate-500 text-sm md:text-base">
                  Curated collections for every mood and moment.
                </p>
              </div>

              {!isEmbedded && (
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit overflow-x-auto">
                  <Link
                    to="/topartist"
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      location.pathname === "/top-artists"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <Users size={16} /> Top Artists
                  </Link>
                  <Link
                    to="/new-releases"
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      location.pathname === "/new-releases"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <Music size={16} /> New Releases
                  </Link>
                  <Link
                    to="/top-playlist"
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      location.pathname === "/top-playlist"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <Music size={16} /> Top Playlists
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
              <div className="relative w-full md:w-64 group shrink-0">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movie or artist..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
              <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm shrink-0">
                <button
                  onClick={() => setLayoutMode("grid")}
                  className={`p-2 rounded-md transition-all ${
                    layoutMode === "grid"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setLayoutMode("table")}
                  className={`p-2 rounded-md transition-all ${
                    layoutMode === "table"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
              <div className="flex flex-nowrap gap-3 overflow-x-auto items-center w-full md:w-auto md:max-w-[600px] pb-3 md:pb-0 scroll-smooth">
                {LANGUAGES.map((filter) => (
                  <FilterPill
                    key={filter}
                    label={filter}
                    active={activeFilter === filter}
                    onClick={() => setActiveFilter(filter)}
                  />
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="col-span-full py-20 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <>
              {layoutMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {filteredPlaylists.map((playlist, index) => (
                    <motion.div
                      key={playlist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      onClick={() => handlePlaylistClick(playlist)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border border-slate-200 group-hover:border-blue-400 group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={playlist.image_url}
                          alt={playlist.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
                            style={{
                              background:
                                "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            }}
                          >
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </motion.div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                          <Music size={10} />{" "}
                          {playlist.playlist_songs?.length || 0}
                        </div>
                      </div>
                      <div className="px-1">
                        <h3
                          className="font-bold text-base truncate group-hover:text-blue-600 transition-colors"
                          style={{ color: "#0f172a" }}
                        >
                          {playlist.title}
                        </h3>
                        <p className="text-slate-500 text-sm truncate mt-1 flex items-center gap-1">
                          {playlist.genre} • {playlist.year}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {filteredPlaylists.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400">
                      No playlists found.
                    </div>
                  )}
                </div>
              )}

              {layoutMode === "table" && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Cover
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Tracks
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {filteredPlaylists.map((playlist) => (
                          <tr
                            key={playlist.id}
                            className="hover:bg-slate-50 transition-colors"
                            onClick={() => handlePlaylistClick(playlist)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <img
                                className="h-16 w-16 rounded-lg object-cover shadow-sm"
                                src={
                                  playlist.image_url ||
                                  "https://via.placeholder.com/100"
                                }
                                alt=""
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-900">
                                {playlist.title}
                              </div>
                              <div className="text-sm text-slate-500">
                                {playlist.artist}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">
                                {playlist.genre}
                              </div>
                              <div className="text-xs text-slate-500">
                                {playlist.year} • {playlist.language}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">
                                {playlist.playlist_songs?.length || 0} Songs
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center justify-end gap-2 ml-auto">
                                <ListMusic size={14} /> View Songs
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredPlaylists.length === 0 && (
                      <div className="p-10 text-center text-slate-400">
                        No playlists found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* --- VIEW 2: SONG LIST (DETAIL VIEW) — 6 COLUMN TABLE --- */}
      <AnimatePresence>
        {view === "detail" && activePlaylist && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            {/* Playlist Header */}
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
                  src={activePlaylist.image_url}
                  alt={activePlaylist.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/200";
                  }}
                />
              </div>

              <div className="flex flex-col justify-center flex-1">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wide w-fit">
                  {activePlaylist.genre}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                  {activePlaylist.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
                  <span className="font-semibold text-slate-700">
                    {activePlaylist.artist}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    {activePlaylist.playlist_songs?.length || 0} Songs
                  </span>
                  {activePlaylist.language && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{activePlaylist.language}</span>
                    </>
                  )}
                </div>
                {activePlaylist.description && (
                  <p className="text-slate-500 text-sm mb-4 max-w-xl">
                    {activePlaylist.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activePlaylist.playlist_songs?.length > 0)
                        handlePlayPause(activePlaylist.playlist_songs[0]);
                    }}
                    className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                  >
                    {playing &&
                    currentSong?.id ===
                      activePlaylist.playlist_songs?.[0]?.id ? (
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

              {activePlaylist.playlist_songs &&
              activePlaylist.playlist_songs.length > 0 ? (
                activePlaylist.playlist_songs.map((song, index) => {
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
                      className={`grid grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,6rem)_2.5rem_5.5rem] gap-2 px-5 py-3 border-b border-slate-50 last:border-b-0 transition-colors group cursor-pointer items-center ${
                        isActive ? "bg-blue-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* ── 1. Serial # / Playing bars ── */}
                      <div className="flex items-center justify-center">
                        {isActive && playing ? (
                          <div className="flex items-end gap-[3px] h-4">
                            <motion.div
                              animate={{ height: ["30%", "100%", "30%"] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.6,
                              }}
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
                              className={`text-sm font-semibold tabular-nums group-hover:hidden ${
                                isActive ? "text-blue-600" : "text-slate-400"
                              }`}
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
                          className={`text-[15px] font-bold truncate leading-tight ${
                            isActive ? "text-blue-600" : "text-slate-900"
                          }`}
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
                                className={`text-[13px] hover:text-blue-600 hover:underline transition-colors truncate ${
                                  isActive ? "text-blue-400" : "text-slate-500"
                                }`}
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
                          className={`transition-all duration-200 hover:scale-125 ${
                            isLiked
                              ? "text-red-500"
                              : "text-slate-300 hover:text-slate-500"
                          }`}
                        >
                          <Heart
                            size={16}
                            fill={isLiked ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      {/* ── 6. Exact Duration ── */}
                      <div
                        className={`text-right font-mono tabular-nums pr-1 text-[13px] ${
                          isActive ? "text-blue-500" : "text-slate-400"
                        }`}
                      >
                        {getSongDisplayDuration(song)}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-10 text-center text-slate-400">
                  No songs in this playlist yet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STICKY PLAYER --- */}
      <AnimatePresence>
        {currentSong && (
          <StickyPlayer
            song={{
              ...currentSong,
              albumArt:
                currentSong.cover_url ||
                activePlaylist?.image_url ||
                "https://via.placeholder.com/50",
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

export default TopPlaylist;
