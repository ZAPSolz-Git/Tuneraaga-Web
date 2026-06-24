import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Users,
  Music,
  ChevronDown,
  ChevronUp,
  Grid3x3,
  List,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Shuffle,
  Film,
  Disc3,
  User,
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
  const str = String(val).trim();
  if (str === "") return [];
  return str
    .split(",")
    .map((a) => a.trim())
    .filter((s) => s.length > 0);
};

const groupByAlbum = (songList) => {
  const albumMap = {};
  const singles = [];
  songList.forEach((song) => {
    if (song.albumName && song.albumName.trim() !== "") {
      const key = song.albumName.trim().toLowerCase();
      if (!albumMap[key]) {
        albumMap[key] = {
          albumName: song.albumName,
          albumCoverUrl: song.albumCoverUrl || song.img,
          primaryArtist: song.artist,
          language: song.language,
          genre: song.genre,
          movieName: song.movieName,
          tracks: [],
        };
      }
      albumMap[key].tracks.push(song);
      if (song.albumCoverUrl) albumMap[key].albumCoverUrl = song.albumCoverUrl;
    } else {
      singles.push(song);
    }
  });
  const albums = Object.values(albumMap).map((album) => ({
    ...album,
    tracks: album.tracks.sort(
      (a, b) => (a.trackNumber || 1) - (b.trackNumber || 1),
    ),
  }));
  return { albums, singles };
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
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
            <img
              src={
                song.img || song.albumArt || "https://via.placeholder.com/50"
              }
              alt="Art"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">
              {song.title}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {song.artist}
            </p>
            {featuringList.length > 0 && (
              <p className="text-xs text-gray-500 truncate">
                ft. {featuringList.join(", ")}
              </p>
            )}
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

const TEXT_BLACK = "#0f172a";
const BLUE_DARK = "#2563eb";

const LANGUAGE_OPTIONS = [
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
const GENRE_OPTIONS = [
  "All Genres",
  "Pop",
  "Hip Hop/Rap",
  "Rock",
  "Indian",
  "Arabic",
  "Latin",
  "Dance",
  "R&B/Soul",
  "Country",
  "Classical",
  "Jazz",
  "Alternative",
  "Blues",
  "Electronic",
  "Folk",
  "Metal",
  "Reggae",
  "World Music",
];

const FilterDropdown = ({ value, onChange, options, label }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border shadow-sm select-none whitespace-nowrap ${value === "For You" || value === "All Genres" ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-md"}`}
      >
        <span>{label || value}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 w-52 max-h-72 overflow-y-auto z-50"
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            {filtered.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setSearch("");
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 flex items-center justify-between ${value === opt ? "text-blue-600 font-bold bg-blue-50" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <span>{opt}</span>
                {value === opt && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">
                No results
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArtistLink = ({ name, className = "" }) => {
  const navigate = useNavigate();
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/artist/${encodeURIComponent(name)}`);
      }}
      className={`cursor-pointer hover:text-blue-600 hover:underline transition-colors ${className}`}
    >
      {name}
    </span>
  );
};

// ═══════════════════════════════════════════
// ALBUM CARD
// ═══════════════════════════════════════════
const AlbumCard = ({
  album,
  index,
  currentSong,
  playing,
  onPlayTrack,
  onNavigateAlbum,
  trackDurations,
  fetchDurations,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isActive =
    currentSong && album.tracks.some((t) => t.id === currentSong.id);
  const featuringList =
    album.tracks.length > 0
      ? parseArtists(album.tracks[0].featuringArtists)
      : [];
  const actors =
    album.tracks.length > 0 ? parseArtists(album.tracks[0].actorNames) : [];

  useEffect(() => {
    if (expanded) {
      fetchDurations(album.tracks);
    }
  }, [expanded, album.tracks, fetchDurations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className={`relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border cursor-pointer ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 group-hover:border-blue-400"} group-hover:shadow-xl transition-all duration-300`}
      >
        {!imgError && album.albumCoverUrl ? (
          <img
            src={album.albumCoverUrl}
            alt={album.albumName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <Disc3 size={48} className="text-blue-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onPlayTrack(album.tracks[0], album.tracks, 0);
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer bg-gradient-to-br from-blue-400 to-blue-600 text-white"
          >
            {isActive && playing ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </motion.div>
        </div>
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 text-blue-600">
          NEW
        </div>
        <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
          <Disc3 size={9} /> {album.tracks.length}
        </div>
        {album.movieName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-purple-200 text-[11px] font-semibold truncate flex items-center gap-1">
              <Film size={9} /> {album.movieName}
            </span>
          </div>
        )}
      </div>

      <div className="px-0.5">
        <h3
          className="font-bold text-sm truncate transition-colors leading-tight cursor-pointer hover:text-blue-600 text-slate-900"
          onClick={() => onNavigateAlbum(album.albumName)}
        >
          {album.albumName}
        </h3>
        <p className="text-slate-500 text-xs truncate mt-1">
          <ArtistLink
            name={album.primaryArtist}
            className="hover:text-blue-600 text-slate-500 text-xs"
          />
        </p>
        {featuringList.length > 0 && (
          <p className="text-[11px] text-teal-500 truncate mt-0.5 flex items-center gap-0.5 flex-wrap">
            <span className="text-teal-400 font-semibold text-[10px]">ft.</span>
            {featuringList.map((a, i) => (
              <span key={a} className="flex items-center gap-0.5">
                <ArtistLink
                  name={a}
                  className="hover:text-blue-600 text-teal-500 text-[11px]"
                />
                {i < featuringList.length - 1 && (
                  <span className="text-teal-300 text-[11px]">,</span>
                )}
              </span>
            ))}
          </p>
        )}
        {album.movieName && (
          <p className="text-[10px] text-purple-500 truncate mt-0.5 flex items-center gap-1">
            <Film size={9} /> {album.movieName}
          </p>
        )}
        {actors.length > 0 && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
            <User size={9} /> {actors.join(", ")}
          </p>
        )}
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {album.genre && (
            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
              {album.genre}
            </span>
          )}
          {album.language && (
            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
              {album.language}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden mt-3"
          >
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              {album.tracks.map((track, i) => {
                const isTrackActive = currentSong?.id === track.id;
                const dur = trackDurations[track.id];
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors group/row hover:bg-white ${isTrackActive ? "bg-blue-50" : ""} ${i < album.tracks.length - 1 ? "border-b border-slate-200" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track, album.tracks, i);
                    }}
                  >
                    <div className="w-7 flex items-center justify-center flex-shrink-0">
                      {isTrackActive && playing ? (
                        <Music
                          size={13}
                          className="text-blue-500 animate-pulse"
                        />
                      ) : (
                        <>
                          <span
                            className={`text-xs font-semibold group-hover/row:hidden ${isTrackActive ? "text-blue-500" : "text-slate-400"}`}
                          >
                            {track.trackNumber || i + 1}
                          </span>
                          <Play
                            size={13}
                            className="text-blue-500 hidden group-hover/row:block"
                            fill="currentColor"
                          />
                        </>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${isTrackActive ? "text-blue-600" : "text-slate-800"}`}
                      >
                        {track.title}
                      </p>
                      {track.featuringArtists && (
                        <p className="text-[10px] text-teal-500 truncate">
                          ft. {track.featuringArtists}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate hidden sm:block max-w-[100px]">
                      <ArtistLink
                        name={track.artist}
                        className="text-[10px] text-slate-500 hover:text-blue-600"
                      />
                    </p>
                    {track.movieName && (
                      <span className="text-[10px] text-purple-500 truncate hidden md:flex items-center gap-0.5 max-w-[80px]">
                        <Film size={8} /> {track.movieName}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono flex-shrink-0 w-10 text-right ${dur ? "text-slate-400" : "text-slate-300"}`}
                    >
                      {dur ? formatDuration(dur) : "—"}
                    </span>
                  </motion.div>
                );
              })}
              <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">
                  {album.tracks.length} track
                  {album.tracks.length > 1 ? "s" : ""}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(false);
                  }}
                  className="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-0.5"
                >
                  <ChevronUp size={10} /> Collapse
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───
const NewRelease = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState("For You");
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [viewMode, setViewMode] = useState("grid");
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentList, setCurrentList] = useState([]);

  // ✅ Refs for bulletproof audio handling (No stale closures)
  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const trackDurationsRef = useRef({});

  const [trackDurations, setTrackDurations] = useState({});

  // Sync state to refs
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

  const fetchDurations = useCallback((tracks) => {
    tracks.forEach((track) => {
      if (trackDurationsRef.current[track.id] || !track.audioUrl) return;
      try {
        const tempAudio = new Audio();
        tempAudio.preload = "metadata";
        tempAudio.src = track.audioUrl;
        const onMeta = () => {
          if (
            tempAudio.duration &&
            isFinite(tempAudio.duration) &&
            tempAudio.duration > 0
          ) {
            trackDurationsRef.current[track.id] = tempAudio.duration;
            setTrackDurations((prev) => ({
              ...prev,
              [track.id]: tempAudio.duration,
            }));
          }
          cleanup();
        };
        const onErr = () => cleanup();
        const cleanup = () => {
          tempAudio.removeEventListener("loadedmetadata", onMeta);
          tempAudio.removeEventListener("error", onErr);
          tempAudio.removeAttribute("src");
          tempAudio.load();
        };
        tempAudio.addEventListener("loadedmetadata", onMeta);
        tempAudio.addEventListener("error", onErr);
      } catch (e) {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("releases")
          .select("*")
          .eq("status", "Published")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setSongs(
          data.map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.primary_artist,
            featuringArtists: song.featuring_artists || "",
            actorNames: song.actor_names || "",
            movieName: song.movie_name || "",
            img: song.cover_url || "https://via.placeholder.com/300",
            audioUrl: song.audio_url,
            language: song.language || "",
            genre: song.genre || "",
            subgenre: song.subgenre || "",
            albumName: song.album_name || "",
            albumCoverUrl: song.album_cover_url || song.cover_url || "",
            format: song.format || "Single",
            trackNumber: song.track_number || 1,
            playCount: song.play_count || 0,
          })),
        );
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter((song) => {
    const matchesLanguage =
      activeLanguage.toLowerCase().trim() === "for you" ||
      (song.language || "").toLowerCase().trim() ===
        activeLanguage.toLowerCase().trim();
    const matchesGenre =
      activeGenre.toLowerCase().trim() === "all genres" ||
      (song.genre || "").toLowerCase().trim() ===
        activeGenre.toLowerCase().trim();
    return matchesLanguage && matchesGenre;
  });

  const { albums, singles } = groupByAlbum(filteredSongs);

  // ✅ 100% Stable playSong function
  const playSong = useCallback((song) => {
    if (!song || !song.audioUrl) {
      console.warn("No audio URL for song:", song?.title);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;

    const isNewSong = currentSongRef.current?.id !== song.id;

    if (isNewSong) {
      setCurrentSong(song);
      currentSongRef.current = song; // Immediate update for ref
      setDuration(0);
      setCurrentTime(0);
      audio.src = song.audioUrl;
      audio.load();
    }

    let hasStarted = false;

    const tryPlay = () => {
      if (hasStarted) return;
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            hasStarted = true;
            setPlaying(true);
          })
          .catch((err) => {
            if (err.name === "NotAllowedError") {
              console.warn(
                "Autoplay blocked by browser — user interaction needed",
              );
            } else if (err.name === "AbortError") {
              // Song changed before play could start — ignore
            } else {
              console.error("Play error:", err);
            }
          });
      }
    };

    if (audio.readyState >= 2) {
      tryPlay();
    } else {
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
  }, []);

  // ✅ 100% Stable handleNext
  const handleNext = useCallback(() => {
    if (currentListRef.current.length === 0 || currentIndexRef.current === null)
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
    currentIndexRef.current = nextIndex; // Immediate update
    playSong(currentListRef.current[nextIndex]);
  }, [playSong]);

  const handlePrev = useCallback(() => {
    if (currentListRef.current.length === 0 || currentIndexRef.current === null)
      return;
    const prevIndex =
      (currentIndexRef.current - 1 + currentListRef.current.length) %
      currentListRef.current.length;
    setCurrentIndex(prevIndex);
    currentIndexRef.current = prevIndex; // Immediate update
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

  // ✅ Stable handleSongClick
  const handleSongClick = useCallback(
    (index, song, list) => {
      if (currentSongRef.current?.id === song.id) {
        handlePlayPause(song);
      } else {
        setCurrentList(list);
        currentListRef.current = list; // Immediate update
        setCurrentIndex(index);
        currentIndexRef.current = index; // Immediate update
        playSong(song);
      }
    },
    [handlePlayPause, playSong],
  );

  const handleAlbumTrackPlay = useCallback(
    (track, trackList, trackIndex) => {
      handleSongClick(trackIndex, track, trackList);
    },
    [handleSongClick],
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        if (currentSongRef.current?.id) {
          setTrackDurations((prev) => ({
            ...prev,
            [currentSongRef.current.id]: audio.duration,
          }));
        }
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

  const handleCardClick = (song) => {
    if (song.albumName)
      navigate(`/album/${encodeURIComponent(song.albumName)}`);
    else {
      const idx = singles.findIndex((s) => s.id === song.id);
      if (idx !== -1) handleSongClick(idx, song, singles);
    }
  };

  const handlePlayButtonClick = (e, index, song, list) => {
    e.stopPropagation();
    handleSongClick(index, song, list);
  };

  const onToggleShuffle = () => setIsShuffle(!isShuffle);
  const getActorNames = (song) => parseArtists(song.actorNames);
  const getFeaturingArtists = (song) => parseArtists(song.featuringArtists);
  const getMovieOrAlbum = (song) => {
    if (song.movieName) return { type: "movie", name: song.movieName };
    if (song.albumName) return { type: "album", name: song.albumName };
    return null;
  };

  const allSongsForTable = [
    ...albums.flatMap((album) => album.tracks),
    ...singles,
  ];

  return (
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-32 px-4 md:px-8 relative overflow-hidden bg-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
              style={{ color: TEXT_BLACK }}
            >
              New <span style={{ color: BLUE_DARK }}>Releases</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Fresh tracks and trending hits just for you.
              {albums.length > 0 && (
                <span className="text-blue-500 font-medium">
                  {" "}
                  {albums.length} album{albums.length !== 1 ? "s" : ""},{" "}
                  {singles.length} single{singles.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
            <Link
              to="/topartist"
              className="px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-white/50"
            >
              <Users size={16} /> Top Artists
            </Link>
            <button className="px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 cursor-pointer bg-white text-blue-600 shadow-sm">
              <Music size={16} /> New Releases
            </button>
            <Link
              to="/top-playlist"
              className="px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-white/50"
            >
              <Music size={16} /> Top Playlists
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "table" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List size={16} />
            </button>
          </div>
          <FilterDropdown
            value={activeLanguage}
            onChange={setActiveLanguage}
            options={LANGUAGE_OPTIONS}
            label={activeLanguage}
          />
          <FilterDropdown
            value={activeGenre}
            onChange={setActiveGenre}
            options={GENRE_OPTIONS}
            label={activeGenre}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {filteredSongs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Music size={32} className="text-slate-300" />
              </div>
              <p className="text-gray-400 text-lg font-medium">
                No songs found
              </p>
              <p className="text-gray-300 text-sm mt-1">
                Try changing your filters
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-10">
                  {albums.map((album, i) => (
                    <AlbumCard
                      key={album.albumName.toLowerCase()}
                      album={album}
                      index={i}
                      currentSong={currentSong}
                      playing={playing}
                      onPlayTrack={handleAlbumTrackPlay}
                      onNavigateAlbum={(name) =>
                        navigate(`/album/${encodeURIComponent(name)}`)
                      }
                      trackDurations={trackDurations}
                      fetchDurations={fetchDurations}
                    />
                  ))}

                  {singles.map((song, index) => {
                    const isActive = currentSong?.id === song.id;
                    const featuringList = getFeaturingArtists(song);
                    const actors = getActorNames(song);
                    const movieOrAlbum = getMovieOrAlbum(song);

                    return (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: (albums.length + index) * 0.04,
                        }}
                        className="group cursor-pointer"
                        onClick={() => handleCardClick(song)}
                      >
                        <div
                          className={`relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 group-hover:border-blue-400"} group-hover:shadow-xl transition-all duration-300`}
                        >
                          <img
                            src={song.img}
                            alt={song.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) =>
                                handlePlayButtonClick(e, index, song, singles)
                              }
                              className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                            >
                              {isActive && playing ? (
                                <Pause size={20} className="text-white" />
                              ) : (
                                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                              )}
                            </motion.div>
                          </div>
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 text-blue-600">
                            NEW
                          </div>
                          {movieOrAlbum && movieOrAlbum.type === "movie" && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="text-purple-200 text-[11px] font-semibold truncate flex items-center gap-1">
                                <Film size={9} /> {movieOrAlbum.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="px-0.5">
                          <h3
                            className={`font-bold text-sm truncate transition-colors leading-tight ${isActive ? "text-blue-600" : "group-hover:text-blue-600 text-slate-900"}`}
                          >
                            {song.title}
                          </h3>
                          <p className="text-slate-500 text-xs truncate mt-1">
                            <ArtistLink
                              name={song.artist}
                              className="hover:text-blue-600 text-slate-500 text-xs"
                            />
                          </p>
                          {featuringList.length > 0 && (
                            <p className="text-[11px] text-teal-500 truncate mt-0.5 flex items-center gap-0.5 flex-wrap">
                              <span className="text-teal-400 font-semibold text-[10px]">
                                ft.
                              </span>
                              {featuringList.map((a, i) => (
                                <span
                                  key={a}
                                  className="flex items-center gap-0.5"
                                >
                                  <ArtistLink
                                    name={a}
                                    className="hover:text-blue-600 text-teal-500 text-[11px]"
                                  />
                                  {i < featuringList.length - 1 && (
                                    <span className="text-teal-300 text-[11px]">
                                      ,
                                    </span>
                                  )}
                                </span>
                              ))}
                            </p>
                          )}
                          {movieOrAlbum && movieOrAlbum.type === "movie" && (
                            <p className="text-[10px] text-purple-500 truncate mt-0.5 flex items-center gap-1">
                              <Film size={9} /> {movieOrAlbum.name}
                            </p>
                          )}
                          {actors.length > 0 && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                              <User size={9} /> {actors.join(", ")}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {song.genre && (
                              <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                {song.genre}
                              </span>
                            )}
                            {song.language && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                {song.language}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {viewMode === "table" && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-14">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Song
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                            Artists
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Movie / Album
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                            Cast
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Genre
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                            Language
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {albums.map((album) => (
                          <React.Fragment key={album.albumName.toLowerCase()}>
                            <tr
                              className="bg-blue-50/70 hover:bg-blue-50 cursor-pointer"
                              onClick={() =>
                                navigate(
                                  `/album/${encodeURIComponent(album.albumName)}`,
                                )
                              }
                            >
                              <td colSpan={7} className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-blue-200 flex-shrink-0 shadow-sm">
                                    <img
                                      src={
                                        album.albumCoverUrl ||
                                        "https://via.placeholder.com/40"
                                      }
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src =
                                          "https://via.placeholder.com/40";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                      <Disc3
                                        size={13}
                                        className="text-blue-500"
                                      />
                                      {album.albumName}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                      {album.primaryArtist} •{" "}
                                      {album.tracks.length} tracks
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlbumTrackPlay(
                                        album.tracks[0],
                                        album.tracks,
                                        0,
                                      );
                                    }}
                                    className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0"
                                  >
                                    <Play
                                      size={14}
                                      fill="white"
                                      className="ml-0.5"
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {album.tracks.map((track, trackIdx) => {
                              const isTrackActive =
                                currentSong?.id === track.id;
                              return (
                                <tr
                                  key={track.id}
                                  className={`hover:bg-slate-50 cursor-pointer ${isTrackActive ? "bg-blue-50" : ""}`}
                                  onClick={() =>
                                    handleAlbumTrackPlay(
                                      track,
                                      album.tracks,
                                      trackIdx,
                                    )
                                  }
                                >
                                  <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">
                                    {isTrackActive && playing ? (
                                      <Music
                                        size={12}
                                        className="text-blue-500 animate-pulse"
                                      />
                                    ) : (
                                      track.trackNumber || trackIdx + 1
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={
                                          track.img ||
                                          "https://via.placeholder.com/30"
                                        }
                                        alt=""
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                        onError={(e) => {
                                          e.target.src =
                                            "https://via.placeholder.com/30";
                                        }}
                                      />
                                      <span
                                        className={`text-sm font-medium truncate ${isTrackActive ? "text-blue-600" : "text-slate-800"}`}
                                      >
                                        {track.title}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-500 hidden md:table-cell">
                                    <ArtistLink
                                      name={track.artist}
                                      className="text-xs text-slate-500 hover:text-blue-600"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-500">
                                    {track.movieName ? (
                                      <span className="flex items-center gap-1 text-purple-500">
                                        <Film size={10} /> {track.movieName}
                                      </span>
                                    ) : track.albumName ? (
                                      <span className="flex items-center gap-1 text-blue-500">
                                        <Disc3 size={10} /> {track.albumName}
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">
                                    {parseArtists(track.actorNames).join(
                                      ", ",
                                    ) || "—"}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {track.genre ? (
                                      <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                        {track.genre}
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">
                                    {track.language || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}

                        {singles.map((song, index) => {
                          const isActive = currentSong?.id === song.id;
                          const albumIdx = albums.reduce(
                            (acc, a) => acc + a.tracks.length,
                            0,
                          );
                          const globalIdx = albumIdx + index;
                          return (
                            <tr
                              key={song.id}
                              className={`hover:bg-slate-50 cursor-pointer ${isActive ? "bg-blue-50" : ""}`}
                              onClick={() =>
                                handleSongClick(
                                  globalIdx,
                                  song,
                                  allSongsForTable,
                                )
                              }
                            >
                              <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">
                                {isActive && playing ? (
                                  <Music
                                    size={12}
                                    className="text-blue-500 animate-pulse"
                                  />
                                ) : (
                                  globalIdx + 1
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={
                                      song.img ||
                                      "https://via.placeholder.com/30"
                                    }
                                    alt=""
                                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                                    onError={(e) => {
                                      e.target.src =
                                        "https://via.placeholder.com/30";
                                    }}
                                  />
                                  <span
                                    className={`text-sm font-medium truncate ${isActive ? "text-blue-600" : "text-slate-800"}`}
                                  >
                                    {song.title}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-500 hidden md:table-cell">
                                <ArtistLink
                                  name={song.artist}
                                  className="text-xs text-slate-500 hover:text-blue-600"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">
                                {song.movieName ? (
                                  <span className="flex items-center gap-1 text-purple-500">
                                    <Film size={10} /> {song.movieName}
                                  </span>
                                ) : song.albumName ? (
                                  <span className="flex items-center gap-1 text-blue-500">
                                    <Disc3 size={10} /> {song.albumName}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">
                                {parseArtists(song.actorNames).join(", ") ||
                                  "—"}
                              </td>
                              <td className="px-4 py-2.5">
                                {song.genre ? (
                                  <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                    {song.genre}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">
                                {song.language || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {currentSong && (
          <StickyPlayer
            song={currentSong}
            isPlaying={playing}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onPrev={handlePrev}
            onNext={handleNext}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            toggleMute={toggleMute}
            isShuffle={isShuffle}
            onToggleShuffle={onToggleShuffle}
            onClose={handleClosePlayer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewRelease;
