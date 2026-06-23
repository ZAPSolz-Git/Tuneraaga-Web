import React, { useState, useEffect, useRef } from "react";
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
  MoreHorizontal,
  UserCircle,
  Music2,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Disc3,
  ExternalLink,
  Radio,
  Mic2,
  Album,
  Share2,
  Link2,
  Flag,
  Film,
  User,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const formatDuration = (val) => {
  if (!val && val !== 0) return null;
  if (typeof val === "string") {
    const parts = val.split(":");
    if (parts.length === 2) return val;
    if (parts.length === 3) return val;
    return null;
  }
  if (typeof val === "number" && isFinite(val)) {
    const m = Math.floor(val / 60);
    const s = Math.floor(val % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return null;
};

const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};

const parseArtists = (artistStr) => {
  if (!artistStr) return [];
  if (Array.isArray(artistStr))
    return artistStr
      .map((a) => (typeof a === "string" ? a.trim() : ""))
      .filter(Boolean);
  return artistStr
    .split(/,|ft\.|feat\./i)
    .map((a) => a.trim())
    .filter(Boolean);
};

// ─── ROBUST: Parse actor names ───
const parseActorNames = (val) => {
  if (Array.isArray(val))
    return val.map((s) => String(s).trim()).filter(Boolean);
  if (
    val == null ||
    val === "" ||
    typeof val === "number" ||
    typeof val === "boolean"
  )
    return [];
  const str = String(val).trim();
  if (str === "") return [];
  return str
    .split(",")
    .map((a) => a.trim())
    .filter((s) => s.length > 0);
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
  const featuringList = parseArtists(song.featuringArtists);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] z-[100]"
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
            <p className="text-xs text-gray-400 truncate mt-1">
              {song.artist}
              {featuringList.length > 0 && ` ft. ${featuringList.join(", ")}`}
            </p>
            {/* Movie/Album in player */}
            {song.movieName && (
              <p className="text-[10px] text-purple-400 truncate flex items-center gap-1 mt-0.5">
                <Film size={9} /> {song.movieName}
              </p>
            )}
            {song.albumName && !song.movieName && (
              <p className="text-[10px] text-blue-400 truncate flex items-center gap-1 mt-0.5">
                <Disc3 size={9} /> {song.albumName}
              </p>
            )}
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
              {formatDuration(currentTime) || "0:00"}
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
            <span className="w-10 font-mono">
              {formatDuration(duration) || "0:00"}
            </span>
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

// ─── MAIN COMPONENT ───
const ArtistProfile = () => {
  const { artistName } = useParams();
  const navigate = useNavigate();
  const decodedArtistName = decodeURIComponent(artistName || "");

  const [artistSongs, setArtistSongs] = useState([]);
  const [collabSongs, setCollabSongs] = useState([]);
  const [featuringData, setFeaturingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("songs");
  const [sortBy, setSortBy] = useState("popular");

  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentList, setCurrentList] = useState([]);
  const [isArtistLiked, setIsArtistLiked] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const audioRef = useRef(null);
  const countedSongIds = useRef(new Set());
  const songDurationsRef = useRef({});
  const moreMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!decodedArtistName) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: primaryData, error: primaryError } = await supabase
          .from("releases")
          .select("*")
          .eq("primary_artist", decodedArtistName)
          .eq("status", "Published")
          .order("play_count", { ascending: false });
        if (primaryError) throw primaryError;

        const { data: featData, error: featError } = await supabase
          .from("releases")
          .select("*")
          .eq("status", "Published")
          .ilike("featuring_artists", `%${decodedArtistName}%`)
          .order("play_count", { ascending: false });
        if (featError) throw featError;

        const collabOnly = (featData || []).filter(
          (s) => s.primary_artist !== decodedArtistName,
        );

        const formatSong = (song) => {
          const featArtists =
            song.featuring_artists ||
            song.feat_artists ||
            song.featured_artists ||
            song.featuring ||
            song.feat ||
            "";
          const dbDuration =
            song.duration ||
            song.song_duration ||
            song.track_duration ||
            song.length ||
            0;

          return {
            id: song.id,
            title: song.title,
            artist: song.primary_artist,
            featuringArtists: featArtists,
            companyName:
              song.company_name || song.label || song.record_label || "",
            img: song.cover_url || "https://via.placeholder.com/300",
            albumArt: song.cover_url || "https://via.placeholder.com/300",
            audioUrl: song.audio_url,
            language: song.language || "",
            genre: song.genre || "",
            // ── FIX: Extract album & movie names properly ──
            albumName: song.album_name || "",
            albumCoverUrl: song.album_cover_url || song.cover_url || "",
            movieName: song.movie_name || "",
            actorNames: song.actor_names || "",
            playCount: song.play_count || 0,
            listenersCount: song.listeners_count || 0,
            trackNumber: song.track_number || 1,
            releaseDate: song.release_date,
            artist_image_url: song.artist_image_url || "",
            format: song.format || "Single",
            dbDuration: dbDuration,
          };
        };

        const primary = (primaryData || []).map(formatSong);
        const collabs = collabOnly.map(formatSong);

        setArtistSongs(primary);
        setCollabSongs(collabs);

        const allSongs = [...primary, ...collabs];
        const albumMap = new Map();
        allSongs.forEach((s) => {
          if (!s.albumName) return;
          if (!albumMap.has(s.albumName)) {
            albumMap.set(s.albumName, {
              title: s.albumName,
              type: "Album",
              coverUrl:
                s.albumCoverUrl ||
                s.img ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(s.albumName)}&size=200&background=2563eb&color=fff`,
              songCount: 1,
              year: s.releaseDate
                ? new Date(s.releaseDate).getFullYear().toString()
                : "",
            });
          } else {
            albumMap.get(s.albumName).songCount += 1;
          }
        });

        try {
          const { data: albumData } = await supabase
            .from("releases")
            .select(
              "album_name, album_cover_url, cover_url, release_date, primary_artist, featuring_artists",
            )
            .eq("status", "Published")
            .or(
              `primary_artist.ilike.%${decodedArtistName}%,featuring_artists.ilike.%${decodedArtistName}%`,
            )
            .not("album_name", "is", null)
            .not("album_name", "eq", "");

          if (albumData && albumData.length > 0) {
            albumData.forEach((row) => {
              const name = row.album_name;
              if (!name || albumMap.has(name)) return;
              albumMap.set(name, {
                title: name,
                type:
                  row.primary_artist?.toLowerCase() ===
                  decodedArtistName.toLowerCase()
                    ? "Album"
                    : "Feature",
                coverUrl:
                  row.album_cover_url ||
                  row.cover_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=2563eb&color=fff`,
                songCount: 0,
                year: row.releaseDate
                  ? new Date(row.release_date).getFullYear().toString()
                  : "",
              });
            });
          }
        } catch (e) {}

        setFeaturingData(Array.from(albumMap.values()));
      } catch (error) {
        console.error("Error fetching artist songs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtistData();
  }, [decodedArtistName]);

  const incrementSongCounts = async (song) => {
    if (!song || !song.id) return;
    if (countedSongIds.current.has(song.id)) return;
    countedSongIds.current.add(song.id);
    try {
      const { data: current, error: fetchErr } = await supabase
        .from("releases")
        .select("play_count, listeners_count")
        .eq("id", song.id)
        .single();
      if (fetchErr) throw fetchErr;
      const newPlayCount = (current?.play_count || 0) + 1;
      const newListenersCount = (current?.listeners_count || 0) + 1;
      const { error: updateErr } = await supabase
        .from("releases")
        .update({
          play_count: newPlayCount,
          listeners_count: newListenersCount,
        })
        .eq("id", song.id);
      if (updateErr) throw updateErr;
      const updateList = (list) =>
        list.map((s) =>
          s.id === song.id
            ? {
                ...s,
                playCount: newPlayCount,
                listenersCount: newListenersCount,
              }
            : s,
        );
      setArtistSongs((prev) => updateList(prev));
      setCollabSongs((prev) => updateList(prev));
    } catch (error) {
      console.error("Error incrementing song counts:", error);
      countedSongIds.current.delete(song.id);
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime),
    );
    audio.addEventListener("loadedmetadata", () => {
      const dur = audio.duration;
      setDuration(dur);
      if (currentSong?.id && isFinite(dur)) {
        songDurationsRef.current[currentSong.id] = dur;
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
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    const handleMeta = () => {
      if (isFinite(audio.duration)) {
        songDurationsRef.current[currentSong.id] = audio.duration;
      }
    };
    audio.addEventListener("loadedmetadata", handleMeta);
    return () => audio.removeEventListener("loadedmetadata", handleMeta);
  }, [currentSong]);

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
  }, [currentList, currentIndex, isShuffle]);

  const getSongDuration = (song) => {
    const cached = songDurationsRef.current[song.id];
    if (cached && isFinite(cached)) return formatDuration(cached);
    if (song.dbDuration) return formatDuration(song.dbDuration);
    return "—";
  };

  // ── Helper: Get movie or album for display ──
  const getMovieOrAlbum = (song) => {
    if (song.movieName) return { type: "movie", name: song.movieName };
    if (song.albumName) return { type: "album", name: song.albumName };
    return null;
  };

  const playSong = (song) => {
    if (!song) return;
    const audio = audioRef.current;
    if (currentSong?.id !== song.id) {
      setCurrentSong(song);
      audio.src = song.audioUrl;
      audio.load();
      incrementSongCounts(song);
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(console.error);
  };

  const handleNext = () => {
    if (!currentList.length || currentIndex === null) return;
    let nextIndex = isShuffle
      ? (() => {
          let n;
          do {
            n = Math.floor(Math.random() * currentList.length);
          } while (currentList.length > 1 && n === currentIndex);
          return n;
        })()
      : (currentIndex + 1) % currentList.length;
    setCurrentIndex(nextIndex);
    playSong(currentList[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentList.length || currentIndex === null) return;
    const prev = (currentIndex - 1 + currentList.length) % currentList.length;
    setCurrentIndex(prev);
    playSong(currentList[prev]);
  };

  const handlePlayPause = (song) => {
    if (currentSong?.id === song.id && playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else playSong(song);
  };

  const handleSongClick = (index, song, list) => {
    if (currentSong?.id === song.id) handlePlayPause(song);
    else {
      setCurrentList(list);
      setCurrentIndex(index);
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
  const toggleMute = () => setIsMuted(!isMuted);
  const handleVolumeChange = (v) => {
    setVolume(v);
    setIsMuted(v === 0);
  };

  const sortSongs = (songs) => {
    const sorted = [...songs];
    if (sortBy === "popular")
      return sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    if (sortBy === "date")
      return sorted.sort(
        (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0),
      );
    if (sortBy === "name")
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  };

  const displayList =
    activeTab === "songs" ? sortSongs(artistSongs) : sortSongs(collabSongs);

  const totalListeners = artistSongs.reduce(
    (sum, s) => sum + (s.listenersCount || 0),
    0,
  );
  const totalPlays = artistSongs.reduce(
    (sum, s) => sum + (s.playCount || 0),
    0,
  );
  const uniqueAlbums = [
    ...new Set(artistSongs.map((s) => s.albumName).filter(Boolean)),
  ];
  const uniqueLanguages = [
    ...new Set(artistSongs.map((s) => s.language).filter(Boolean)),
  ];

  const featuringArtistsList = (() => {
    const set = new Set();
    [...artistSongs, ...collabSongs].forEach((s) => {
      if (!s.featuringArtists) return;
      parseArtists(s.featuringArtists).forEach((a) => {
        const trimmed = a.trim();
        if (
          trimmed &&
          trimmed.toLowerCase() !== decodedArtistName.toLowerCase()
        )
          set.add(trimmed);
      });
    });
    return [...set];
  })();

  const getFeaturingForSong = (song) => {
    if (!song.featuringArtists) return [];
    return parseArtists(song.featuringArtists).filter(
      (a) => a.trim().toLowerCase() !== decodedArtistName.toLowerCase(),
    );
  };

  const handleShareArtist = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: decodedArtistName, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
    setShowMoreMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
    setShowMoreMenu(false);
  };

  return (
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-24 px-4 md:px-8 relative overflow-hidden bg-white">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium text-sm">Back</span>
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : artistSongs.length === 0 && collabSongs.length === 0 ? (
        <div className="text-center py-20">
          <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-400">Artist not found</h2>
          <p className="text-slate-400 mt-2">
            No songs found for "{decodedArtistName}"
          </p>
        </div>
      ) : (
        <>
          {/* ─── ARTIST HEADER ─── */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600">
                <img
                  src={
                    artistSongs[0]?.artist_image_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(decodedArtistName)}&size=300&background=2563eb&color=fff&bold=true&font-size=0.4`
                  }
                  alt={decodedArtistName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col justify-center text-center md:text-left flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
                  {decodedArtistName}
                </h1>
                <CheckCircle2
                  size={24}
                  className="text-blue-600 fill-blue-600 flex-shrink-0"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                <span className="text-sm font-medium text-slate-500">
                  Artist
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-sm font-semibold text-slate-700">
                  {formatCount(totalListeners)} Listeners
                </span>
                {featuringArtistsList.length > 0 && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                      <Mic2 size={13} className="text-amber-500" /> ft.
                    </span>
                    {featuringArtistsList.map((fa, fi) => (
                      <span key={fa} className="flex items-center gap-0.5">
                        <Link
                          to={`/artist/${encodeURIComponent(fa)}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          {fa}
                        </Link>
                        {fi < featuringArtistsList.length - 1 && (
                          <span className="text-slate-300 text-sm">,</span>
                        )}
                      </span>
                    ))}
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start text-sm text-slate-500 mb-6">
                <span className="flex items-center gap-1.5">
                  <Music2 size={14} className="text-blue-500" />
                  <strong className="text-slate-700">
                    {artistSongs.length + collabSongs.length}
                  </strong>{" "}
                  Songs
                </span>
                <span className="flex items-center gap-1.5">
                  <Disc3 size={14} className="text-blue-500" />
                  <strong className="text-slate-700">
                    {uniqueAlbums.length}
                  </strong>{" "}
                  Albums
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-blue-500" />
                  <strong className="text-slate-700">
                    {formatCount(totalPlays)}
                  </strong>{" "}
                  Plays
                </span>
                {uniqueLanguages.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    {uniqueLanguages.join(", ")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 justify-center md:justify-start">
                <button
                  onClick={() => {
                    if (artistSongs.length > 0)
                      handleSongClick(
                        0,
                        sortSongs(artistSongs)[0],
                        sortSongs(artistSongs),
                      );
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-base flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                >
                  <Play size={20} fill="white" /> Play All
                </button>
                <button
                  onClick={() => setIsArtistLiked(!isArtistLiked)}
                  className={`p-3 rounded-full border-2 transition-all hover:scale-110 ${isArtistLiked ? "text-red-500 border-red-500 bg-red-50" : "text-slate-400 border-slate-300 hover:border-red-400 hover:text-red-400"}`}
                >
                  <Heart
                    size={20}
                    fill={isArtistLiked ? "currentColor" : "none"}
                  />
                </button>
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-3 rounded-full border-2 border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-all hover:scale-110"
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
                        className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
                      >
                        <button
                          onClick={handleShareArtist}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <Share2 size={16} className="text-slate-400" /> Share
                          Artist
                        </button>
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <Link2 size={16} className="text-slate-400" /> Copy
                          Link
                        </button>
                        <div className="mx-3 my-1 border-t border-slate-100" />
                        <button
                          onClick={() => setShowMoreMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Flag size={16} className="text-red-400" /> Report
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* ─── TABS + SONG LIST ─── */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 border-b border-slate-200 mb-4">
                {[
                  ["songs", "Songs", artistSongs.length],
                  ["collabs", "Collaborations", collabSongs.length],
                ].map(([key, label, count]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  >
                    {label}{" "}
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Sort:
                </span>
                {[
                  ["popular", "Popular"],
                  ["date", "Date"],
                  ["name", "Name"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${sortBy === key ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ─── SONG LIST TABLE ─── */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                        {/* ── FIX: "Company" replaced with "Movie / Album" ── */}
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Movie / Album
                        </th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Featuring
                        </th>
                        <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                          Plays
                        </th>
                        <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {displayList.map((song, index) => {
                        const isActive = currentSong?.id === song.id;
                        const featuringList = getFeaturingForSong(song);
                        const movieOrAlbum = getMovieOrAlbum(song);
                        const actors = parseActorNames(song.actorNames);

                        return (
                          <motion.tr
                            key={song.id}
                            onClick={() =>
                              handleSongClick(index, song, displayList)
                            }
                            className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                          >
                            {/* # Column */}
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

                            {/* Song Column */}
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
                                  <Link
                                    to={`/artist/${encodeURIComponent(song.artist)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`text-xs truncate mt-0.5 block hover:underline transition-colors ${song.artist.toLowerCase() === decodedArtistName.toLowerCase() ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-blue-600"}`}
                                  >
                                    {song.artist}
                                  </Link>
                                  {/* Actor names under artist */}
                                  {actors.length > 0 && (
                                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5 mt-0.5">
                                      <User size={8} /> {actors.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* ── FIX: Movie / Album Column ── */}
                            <td className="px-4 md:px-6 py-3">
                              {movieOrAlbum ? (
                                <span
                                  className={`text-sm truncate flex items-center gap-1 max-w-[160px] lg:max-w-[200px] ${movieOrAlbum.type === "movie" ? "text-purple-600 font-medium" : "text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-medium"}`}
                                  onClick={(e) => {
                                    if (movieOrAlbum.type === "album") {
                                      e.stopPropagation();
                                      navigate(
                                        `/album/${encodeURIComponent(movieOrAlbum.name)}`,
                                      );
                                    }
                                  }}
                                >
                                  {movieOrAlbum.type === "movie" ? (
                                    <Film size={12} className="flex-shrink-0" />
                                  ) : (
                                    <Disc3
                                      size={12}
                                      className="flex-shrink-0"
                                    />
                                  )}
                                  <span className="truncate">
                                    {movieOrAlbum.name}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Featuring Column */}
                            <td className="px-4 md:px-6 py-3">
                              {featuringList.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                                    <Mic2 size={10} /> feat.
                                  </span>
                                  {featuringList.map((fa, fi) => (
                                    <span
                                      key={fi}
                                      className="flex items-center gap-0.5"
                                    >
                                      <Link
                                        to={`/artist/${encodeURIComponent(fa)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sm text-slate-600 hover:text-amber-600 hover:underline transition-colors"
                                      >
                                        {fa}
                                      </Link>
                                      {fi < featuringList.length - 1 && (
                                        <span className="text-slate-300 text-xs">
                                          ,
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Plays Column */}
                            <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-medium">
                              {formatCount(song.playCount)}
                            </td>

                            {/* Duration Column */}
                            <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                              {isActive
                                ? formatDuration(duration) || "—"
                                : getSongDuration(song)}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── STICKY PLAYER ─── */}
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

export default ArtistProfile;
