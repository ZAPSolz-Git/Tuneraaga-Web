import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Heart,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Shuffle,
  ArrowLeft,
  Clock,
  MoreHorizontal,
  Music2,
  Disc3,
  Users,
  Headphones,
  Share2,
  Link2,
  Flag,
  ListPlus,
  Radio,
  Calendar,
  Grid3x3,
  List,
  Search,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const parseArtists = (artistStr) => {
  if (!artistStr) return [];
  return String(artistStr)
    .split(",")
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
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
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
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300 bg-white text-slate-900"
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
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
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
              onClick={() => toggleMute()}
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
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
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

const TopPlaylist = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Player States
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [isAllLiked, setIsAllLiked] = useState(false);
  const [durations, setDurations] = useState({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const moreMenuRef = useRef(null);
  const countedSongIds = useRef(new Set());

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);
  useEffect(() => {
    currentListRef.current = currentList;
  }, [currentList]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch Playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        const { data: playlistsData, error } = await supabase
          .from("playlists")
          .select(`*, playlist_songs (*)`)
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Fetch release data for play counts AND LYRICS
        const allSongs = (playlistsData || []).flatMap(
          (p) => p.playlist_songs || [],
        );
        const uniqueReleaseIds = [
          ...new Set(allSongs.map((s) => s.release_id).filter(Boolean)),
        ];
        const releaseMap = {};

        if (uniqueReleaseIds.length > 0) {
          const { data: relData } = await supabase
            .from("releases")
            .select("id, play_count, listeners_count, lyrics")
            .in("id", uniqueReleaseIds);
          (relData || []).forEach((r) => {
            releaseMap[r.id] = r;
          });
        }

        const patchedPlaylists = (playlistsData || []).map((playlist) => ({
          ...playlist,
          playlist_songs: (playlist.playlist_songs || []).map((ps) => {
            const rel = ps.release_id ? releaseMap[ps.release_id] || {} : {};
            return {
              ...ps,
              img: ps.cover_url || "https://via.placeholder.com/300",
              audioUrl: ps.audio_url,
              playCount: rel.play_count || 0,
              lyrics: rel.lyrics || "", // Added lyrics for search
            };
          }),
        }));

        setPlaylists(patchedPlaylists);
      } catch (err) {
        console.error("Error fetching playlists:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  // Global Search Filtering Logic
  const filteredPlaylists = playlists.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.language || "").toLowerCase().includes(q)
    );
  });

  const uniqueFilteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const allSongs = playlists.flatMap((p) => p.playlist_songs);
    const matched = allSongs.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.featuring_artists || "").toLowerCase().includes(q) ||
        (s.lyrics || "").toLowerCase().includes(q) // Searching inside lyrics
      );
    });
    const seen = new Set();
    const unique = [];
    matched.forEach((s) => {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        unique.push(s);
      }
    });
    return unique;
  }, [playlists, searchQuery]);

  // Filter songs inside the active playlist
  const visibleSongsInActivePlaylist = activePlaylist
    ? activePlaylist.playlist_songs.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.featuring_artists || "").toLowerCase().includes(q) ||
          (s.lyrics || "").toLowerCase().includes(q)
        );
      })
    : [];

  // Fetch Durations for Search Results or Active Playlist
  useEffect(() => {
    const songsToFetch = activePlaylist
      ? visibleSongsInActivePlaylist
      : uniqueFilteredSongs;
    if (!searchQuery.trim() && !activePlaylist) return;

    songsToFetch.forEach((song) => {
      if (!durations[song.id] && song.audioUrl) {
        const tempAudio = new Audio();
        tempAudio.preload = "metadata";
        tempAudio.src = song.audioUrl;
        tempAudio.onloadedmetadata = () => {
          if (isFinite(tempAudio.duration)) {
            setDurations((prev) => ({
              ...prev,
              [song.id]: tempAudio.duration,
            }));
          }
        };
      }
    });
  }, [
    uniqueFilteredSongs,
    visibleSongsInActivePlaylist,
    searchQuery,
    activePlaylist,
    durations,
  ]);

  const incrementSongCounts = useCallback(async (song) => {
    if (!song || !song.release_id || countedSongIds.current.has(song.id))
      return;
    countedSongIds.current.add(song.id);
    try {
      const { data: current } = await supabase
        .from("releases")
        .select("play_count")
        .eq("id", song.release_id)
        .single();
      const newPlayCount = (current?.play_count || 0) + 1;
      await supabase
        .from("releases")
        .update({ play_count: newPlayCount })
        .eq("id", song.release_id);
    } catch (error) {
      console.error("Error incrementing counts:", error);
    }
  }, []);

  const playSong = useCallback(
    (song) => {
      if (!song || !song.audioUrl) return;
      const audio = audioRef.current;
      if (!audio) return;

      const isNewSong =
        !currentSongRef.current || currentSongRef.current.id !== song.id;
      if (isNewSong) {
        setCurrentSong(song);
        currentSongRef.current = song;
        setDuration(0);
        setCurrentTime(0);
        audio.src = song.audioUrl;
        audio.load();
        incrementSongCounts(song);
      }

      let hasStarted = false;
      const tryPlay = () => {
        if (hasStarted) return;
        audio
          .play()
          .then(() => {
            hasStarted = true;
            setPlaying(true);
          })
          .catch((err) => console.error("Play error:", err));
      };

      if (audio.readyState >= 2) tryPlay();
      else {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          clearTimeout(fallbackTimer);
          tryPlay();
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        const fallbackTimer = setTimeout(() => {
          audio.removeEventListener("canplay", onCanPlay);
          tryPlay();
        }, 3000);
      }
    },
    [incrementSongCounts],
  );

  const handleNext = useCallback(() => {
    if (!currentListRef.current.length || currentIndexRef.current === null)
      return;
    let nextIndex;
    if (isShuffleRef.current) {
      do {
        nextIndex = Math.floor(Math.random() * currentListRef.current.length);
      } while (
        currentListRef.current.length > 1 &&
        nextIndex === currentIndexRef.current
      );
    } else {
      nextIndex = (currentIndexRef.current + 1) % currentListRef.current.length;
    }
    setCurrentIndex(nextIndex);
    currentIndexRef.current = nextIndex;
    playSong(currentListRef.current[nextIndex]);
  }, [playSong]);

  const handlePrev = useCallback(() => {
    if (!currentListRef.current.length || currentIndexRef.current === null)
      return;
    const prevIndex =
      (currentIndexRef.current - 1 + currentListRef.current.length) %
      currentListRef.current.length;
    setCurrentIndex(prevIndex);
    currentIndexRef.current = prevIndex;
    playSong(currentListRef.current[prevIndex]);
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

  const handleSongClick = useCallback(
    (index, song, list) => {
      if (currentSongRef.current?.id === song.id) handlePlayPause(song);
      else {
        setCurrentList(list);
        currentListRef.current = list;
        setCurrentIndex(index);
        currentIndexRef.current = index;
        playSong(song);
      }
    },
    [handlePlayPause, playSong],
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        if (currentSongRef.current?.id)
          setDurations((prev) => ({
            ...prev,
            [currentSongRef.current.id]: audio.duration,
          }));
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => handleNext();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeAttribute("src");
      audio.load();
    };
  }, [handleNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  const handleClosePlayer = () => {
    setPlaying(false);
    setCurrentSong(null);
    currentSongRef.current = null;
    setCurrentIndex(null);
    currentIndexRef.current = null;
    setCurrentList([]);
    currentListRef.current = [];
    setDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const handleVolumeChange = (v) => {
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleLikeSong = (songId) => {
    setLikedSongs((prev) => {
      const n = new Set(prev);
      if (n.has(songId)) n.delete(songId);
      else n.add(songId);
      if (activePlaylist)
        setIsAllLiked(
          n.size === activePlaylist.playlist_songs.length &&
            activePlaylist.playlist_songs.length > 0,
        );
      return n;
    });
  };

  const toggleLikeAll = () => {
    if (!activePlaylist) return;
    if (isAllLiked) {
      setLikedSongs(new Set());
      setIsAllLiked(false);
    } else {
      setLikedSongs(new Set(activePlaylist.playlist_songs.map((s) => s.id)));
      setIsAllLiked(true);
    }
  };

  const handleSharePlaylist = () => {
    if (navigator.share)
      navigator.share({
        title: activePlaylist.title,
        url: window.location.href,
      });
    else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
    setShowMoreMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
    setShowMoreMenu(false);
  };

  // Calculations for Active Playlist UI
  const totalListeners = activePlaylist
    ? activePlaylist.playlist_songs.reduce(
        (sum, s) => sum + (s.playCount || 0),
        0,
      )
    : 0;
  const allArtists = activePlaylist
    ? [
        ...new Set(
          activePlaylist.playlist_songs.flatMap((s) =>
            parseArtists(s.featuring_artists).concat(s.artist),
          ),
        ),
      ]
    : [];

  return (
    <div className="w-full min-h-screen text-slate-900 pb-24 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none"></div>

      <div className="relative px-4 md:px-8 pt-6 max-w-7xl mx-auto">
        {!activePlaylist ? (
          <>
            {/* Main Header with Search */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="w-full md:w-auto">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {searchQuery.trim() ? "Search" : "Top"}{" "}
                  <span className="text-blue-600">
                    {searchQuery.trim() ? "Results" : "Playlists"}
                  </span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {searchQuery.trim()
                    ? `Showing results for "${searchQuery}"`
                    : "Curated collections for every mood and moment."}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search songs, artists, lyrics..."
                    className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-40">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            ) : searchQuery.trim() ? (
              <div className="pb-10">
                {filteredPlaylists.length === 0 &&
                uniqueFilteredSongs.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <Music2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">
                      No results found
                    </h3>
                    <p className="text-slate-500">
                      Try searching with a different keyword.
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredPlaylists.length > 0 && (
                      <div className="mb-12">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Disc3 size={18} className="text-blue-600" />{" "}
                          Playlists ({filteredPlaylists.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {filteredPlaylists.map((playlist) => (
                            <motion.div
                              key={playlist.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => {
                                setActivePlaylist(playlist);
                                setSearchQuery("");
                              }}
                              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
                            >
                              <img
                                src={
                                  playlist.image_url ||
                                  "https://via.placeholder.com/400x200"
                                }
                                alt={playlist.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                              <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                                  {playlist.language}
                                </p>
                                <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                                  {playlist.title}
                                </h3>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uniqueFilteredSongs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Music2 size={18} className="text-blue-600" /> Songs (
                          {uniqueFilteredSongs.length})
                        </h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                                    #
                                  </th>
                                  <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Song
                                  </th>
                                  <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                                    Artists
                                  </th>
                                  <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                                    <Clock size={14} className="inline" />
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100">
                                {uniqueFilteredSongs.map((song, index) => {
                                  const isActive = currentSong?.id === song.id;
                                  const uniqueSongArtists = [
                                    ...new Set([
                                      song.artist,
                                      ...parseArtists(song.featuring_artists),
                                    ]),
                                  ];
                                  const actualDuration = durations[song.id];

                                  return (
                                    <motion.tr
                                      key={song.id}
                                      onClick={() =>
                                        handleSongClick(
                                          index,
                                          song,
                                          uniqueFilteredSongs,
                                        )
                                      }
                                      className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        duration: 0.3,
                                        delay: index * 0.02,
                                      }}
                                    >
                                      <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                          {isActive && playing ? (
                                            <div className="flex items-end gap-0.5 h-4">
                                              <motion.div
                                                animate={{
                                                  height: [
                                                    "40%",
                                                    "100%",
                                                    "40%",
                                                  ],
                                                }}
                                                transition={{
                                                  repeat: Infinity,
                                                  duration: 0.6,
                                                }}
                                                className="w-1 bg-blue-600 rounded-full"
                                              />
                                              <motion.div
                                                animate={{
                                                  height: [
                                                    "100%",
                                                    "40%",
                                                    "100%",
                                                  ],
                                                }}
                                                transition={{
                                                  repeat: Infinity,
                                                  duration: 0.6,
                                                  delay: 0.15,
                                                }}
                                                className="w-1 bg-blue-600 rounded-full"
                                              />
                                              <motion.div
                                                animate={{
                                                  height: [
                                                    "60%",
                                                    "100%",
                                                    "60%",
                                                  ],
                                                }}
                                                transition={{
                                                  repeat: Infinity,
                                                  duration: 0.6,
                                                  delay: 0.3,
                                                }}
                                                className="w-1 bg-blue-600 rounded-full"
                                              />
                                            </div>
                                          ) : (
                                            <>
                                              <span
                                                className={`text-sm font-medium group-hover:hidden ${isActive ? "text-blue-600" : "text-slate-500"}`}
                                              >
                                                {index + 1}
                                              </span>
                                              <Play
                                                size={16}
                                                className="text-blue-600 hidden group-hover:block fill-blue-600"
                                              />
                                            </>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 md:px-6 py-3">
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={song.img}
                                            alt={song.title}
                                            className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                                            onError={(e) => {
                                              e.target.src =
                                                "https://via.placeholder.com/40";
                                            }}
                                          />
                                          <div className="min-w-0">
                                            <div
                                              className={`text-sm font-semibold truncate ${isActive ? "text-blue-600" : "text-slate-900"}`}
                                            >
                                              {song.title}
                                            </div>
                                            <div className="md:hidden text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1 flex-wrap">
                                              {uniqueSongArtists.map((a, i) => (
                                                <span
                                                  key={i}
                                                  className="flex items-center gap-0.5"
                                                >
                                                  <Link
                                                    to={`/artist/${encodeURIComponent(a)}`}
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                    className="hover:text-blue-600 hover:underline"
                                                  >
                                                    {a}
                                                  </Link>
                                                  {i <
                                                    uniqueSongArtists.length -
                                                      1 && (
                                                    <span className="text-slate-300">
                                                      ,
                                                    </span>
                                                  )}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 md:px-6 py-3 hidden md:table-cell">
                                        <div className="flex items-center gap-1 flex-wrap text-sm text-slate-600">
                                          {uniqueSongArtists.map((a, i) => (
                                            <span
                                              key={i}
                                              className="flex items-center gap-1"
                                            >
                                              <Link
                                                to={`/artist/${encodeURIComponent(a)}`}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                className="hover:text-blue-600 hover:underline transition-colors"
                                              >
                                                {a}
                                              </Link>
                                              {i <
                                                uniqueSongArtists.length -
                                                  1 && (
                                                <span className="text-slate-300">
                                                  ,
                                                </span>
                                              )}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                                        {formatDuration(actualDuration)}
                                      </td>
                                    </motion.tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                {playlists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setActivePlaylist(playlist)}
                    className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
                  >
                    <img
                      src={
                        playlist.image_url ||
                        "https://via.placeholder.com/400x200"
                      }
                      alt={playlist.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                    <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                        {playlist.language}
                      </p>
                      <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                        {playlist.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <Music2 size={10} />{" "}
                          {playlist.playlist_songs?.length || 0} Songs
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Active Playlist View */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <button
                onClick={() => {
                  setActivePlaylist(null);
                  handleClosePlayer();
                  setSearchQuery("");
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="font-medium text-sm">Back to Playlists</span>
              </button>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search within this playlist..."
                    className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Playlist Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                  <img
                    src={activePlaylist.image_url}
                    alt={activePlaylist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center text-center md:text-left flex-1">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Disc3 size={14} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    {activePlaylist.language}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 text-slate-900">
                  {activePlaylist.title}
                </h1>

                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                  <Users size={14} className="text-slate-400" />
                  {allArtists.slice(0, 5).map((artist, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <Link
                        to={`/artist/${encodeURIComponent(artist)}`}
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                      >
                        {artist}
                      </Link>
                      {idx < Math.min(allArtists.length, 5) - 1 && (
                        <span className="text-slate-400 text-xs">,</span>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start text-sm text-slate-600 mb-8">
                  <span className="font-semibold text-slate-800">
                    {activePlaylist.playlist_songs.length} Songs
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Headphones size={14} className="text-blue-500" />{" "}
                    {formatCount(totalListeners)} Listeners
                  </span>
                </div>

                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <button
                    onClick={() =>
                      handleSongClick(
                        0,
                        activePlaylist.playlist_songs[0],
                        activePlaylist.playlist_songs,
                      )
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-full font-bold text-base flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                  >
                    <Play size={20} fill="white" /> Play All
                  </button>
                  <button
                    onClick={toggleLikeAll}
                    className={`p-3.5 rounded-full border-2 transition-all hover:scale-110 ${isAllLiked ? "text-red-500 border-red-500 bg-red-50" : "text-slate-500 border-slate-300 hover:border-red-400 hover:text-red-400 bg-white"}`}
                  >
                    <Heart
                      size={20}
                      fill={isAllLiked ? "currentColor" : "none"}
                    />
                  </button>

                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-3.5 rounded-full border-2 border-slate-300 text-slate-500 hover:border-slate-500 hover:text-slate-700 transition-all hover:scale-110 bg-white"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-14 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                        >
                          <button
                            onClick={handleSharePlaylist}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Share2 size={16} /> Share Playlist
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Link2 size={16} /> Copy Link
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <ListPlus size={16} /> Add to Playlist
                          </button>
                          <div className="mx-3 my-1 border-t border-slate-100"></div>
                          <button
                            onClick={() => setShowMoreMenu(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Flag size={16} /> Report
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Song List Table (Filtered if searching) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Song
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        Artists
                      </th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                        Like
                      </th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                        <Clock size={14} className="inline" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {visibleSongsInActivePlaylist.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-10 text-slate-400"
                        >
                          No songs match your search.
                        </td>
                      </tr>
                    ) : (
                      visibleSongsInActivePlaylist.map((song, index) => {
                        const isActive = currentSong?.id === song.id;
                        const isLiked = likedSongs.has(song.id);
                        const uniqueSongArtists = [
                          ...new Set([
                            song.artist,
                            ...parseArtists(song.featuring_artists),
                          ]),
                        ];
                        const actualDuration = durations[song.id];

                        return (
                          <motion.tr
                            key={song.id}
                            onClick={() =>
                              handleSongClick(
                                index,
                                song,
                                visibleSongsInActivePlaylist,
                              )
                            }
                            className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                          >
                            <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                              <div className="w-8 h-8 flex items-center justify-center">
                                {isActive && playing ? (
                                  <div className="flex items-end gap-0.5 h-4">
                                    <motion.div
                                      animate={{
                                        height: ["40%", "100%", "40%"],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                      }}
                                      className="w-1 bg-blue-600 rounded-full"
                                    />
                                    <motion.div
                                      animate={{
                                        height: ["100%", "40%", "100%"],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        delay: 0.15,
                                      }}
                                      className="w-1 bg-blue-600 rounded-full"
                                    />
                                    <motion.div
                                      animate={{
                                        height: ["60%", "100%", "60%"],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                        delay: 0.3,
                                      }}
                                      className="w-1 bg-blue-600 rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className={`text-sm font-medium group-hover:hidden ${isActive ? "text-blue-600" : "text-slate-500"}`}
                                    >
                                      {index + 1}
                                    </span>
                                    <Play
                                      size={16}
                                      className="text-blue-600 hidden group-hover:block fill-blue-600"
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={song.img}
                                  alt={song.title}
                                  className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/40";
                                  }}
                                />
                                <div className="min-w-0">
                                  <div
                                    className={`text-sm font-semibold truncate ${isActive ? "text-blue-600" : "text-slate-900"}`}
                                  >
                                    {song.title}
                                  </div>
                                  <div className="md:hidden text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1 flex-wrap">
                                    {uniqueSongArtists.map((a, i) => (
                                      <span
                                        key={i}
                                        className="flex items-center gap-0.5"
                                      >
                                        <Link
                                          to={`/artist/${encodeURIComponent(a)}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="hover:text-blue-600 hover:underline"
                                        >
                                          {a}
                                        </Link>
                                        {i < uniqueSongArtists.length - 1 && (
                                          <span className="text-slate-300">
                                            ,
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 hidden md:table-cell">
                              <div className="flex items-center gap-1 flex-wrap text-sm text-slate-600">
                                {uniqueSongArtists.map((a, i) => (
                                  <span
                                    key={i}
                                    className="flex items-center gap-1"
                                  >
                                    <Link
                                      to={`/artist/${encodeURIComponent(a)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="hover:text-blue-600 hover:underline transition-colors"
                                    >
                                      {a}
                                    </Link>
                                    {i < uniqueSongArtists.length - 1 && (
                                      <span className="text-slate-300">,</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLikeSong(song.id);
                                }}
                                className={`transition-all hover:scale-125 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
                              >
                                <Heart
                                  size={18}
                                  fill={isLiked ? "currentColor" : "none"}
                                />
                              </button>
                            </td>
                            <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                              {formatDuration(actualDuration)}
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Artists Grid - Hidden when searching inside playlist to keep focus on results */}
            {!searchQuery.trim() && (
              <div className="mt-12 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" /> All Artists in
                  this Playlist
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {allArtists.map((artist) => (
                    <Link
                      key={artist}
                      to={`/artist/${encodeURIComponent(artist)}`}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                        {artist.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 truncate w-full text-center transition-colors">
                        {artist}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {currentSong && (
          <StickyPlayer
            song={{
              ...currentSong,
              albumArt: currentSong.img || "https://via.placeholder.com/50",
            }}
            isPlaying={playing}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onNext={handleNext}
            onPrev={handlePrev}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            toggleMute={toggleMute}
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
