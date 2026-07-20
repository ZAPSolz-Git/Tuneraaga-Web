import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Play,
  Pause,
  Users,
  Music,
  ChevronDown,
  ChevronUp,
  Grid3x3,
  List,
  Film,
  Disc3,
  User,
  ArrowLeft,
  Heart,
  Clock,
  Headphones,
  Loader2,
  Share2,
  Link2,
  Flag,
  ListPlus,
  MoreHorizontal,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Auth from "../components/Auth";
import {
  usePlayer,
  formatDuration,
  formatCount,
  parseArtists,
} from "../components/PlayerContext";

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

// ✅ FIXED: ArtistLink with proper navigation using React Router Link
const ArtistLink = ({ name, className = "", onClick }) => {
  if (!name || name.trim() === "") return null;

  const encodedName = encodeURIComponent(name.trim());
  const to = `/artist/${encodedName}`;

  return (
    <Link
      to={to}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={`cursor-pointer hover:text-blue-600 hover:underline transition-colors ${className}`}
    >
      {name}
    </Link>
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
  onOpenProfile,
  trackDurations,
  fetchDurations,
  likedSongs,
  onLike,
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
          onClick={() => onOpenProfile(album)}
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
                const isLiked = likedSongs && likedSongs.has(track.id);
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onLike) onLike(track.id);
                      }}
                      className={`transition-all hover:scale-110 flex-shrink-0 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
                    >
                      <Heart
                        size={14}
                        fill={isLiked ? "currentColor" : "none"}
                      />
                    </button>
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
  const [searchParams] = useSearchParams();

  const {
    user,
    playing,
    currentSong,
    handleSongClick,
    profileOpen,
    setProfileOpen,
    setExpandHandler,
  } = usePlayer();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState("For You");
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [activeActor, setActiveActor] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const [profileAlbum, setProfileAlbum] = useState(null);
  const [profileSongs, setProfileSongs] = useState([]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [isAllLiked, setIsAllLiked] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const trackDurationsRef = useRef({});
  const moreMenuRef = useRef(null);

  const [trackDurations, setTrackDurations] = useState({});

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchLikes = useCallback(async (userId) => {
    const { data } = await supabase
      .from("likes")
      .select("release_id")
      .eq("user_id", userId);
    if (data) setLikedSongs(new Set(data.map((l) => l.release_id)));
  }, []);

  useEffect(() => {
    if (user) fetchLikes(user.id);
    else setLikedSongs(new Set());
  }, [user, fetchLikes]);

  const toggleLikeSong = async (releaseId) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const isLiked = likedSongs.has(releaseId);
    setLikedSongs((prev) => {
      const n = new Set(prev);
      if (isLiked) n.delete(releaseId);
      else n.add(releaseId);
      return n;
    });
    if (isLiked)
      await supabase
        .from("likes")
        .delete()
        .match({ user_id: user.id, release_id: releaseId });
    else
      await supabase
        .from("likes")
        .insert({ user_id: user.id, release_id: releaseId });
  };

  const toggleLikeAll = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!profileAlbum) return;

    if (isAllLiked) {
      const profileIds = profileSongs.map((s) => s.id);
      setLikedSongs((prev) => {
        const n = new Set(prev);
        profileIds.forEach((id) => n.delete(id));
        return n;
      });
      for (const song of profileSongs) {
        await supabase
          .from("likes")
          .delete()
          .match({ user_id: user.id, release_id: song.id });
      }
      setIsAllLiked(false);
    } else {
      setLikedSongs((prev) => {
        const n = new Set(prev);
        profileSongs.forEach((s) => n.add(s.id));
        return n;
      });
      for (const song of profileSongs) {
        await supabase
          .from("likes")
          .insert({ user_id: user.id, release_id: song.id })
          .catch(() => {});
      }
      setIsAllLiked(true);
    }
  };

  useEffect(() => {
    if (profileOpen && profileSongs.length > 0) {
      setIsAllLiked(profileSongs.every((s) => likedSongs.has(s.id)));
    }
  }, [likedSongs, profileOpen, profileSongs]);

  useEffect(() => {
    const languageParam = searchParams.get("language");
    const actorParam = searchParams.get("actor");

    if (languageParam) {
      const foundLanguage = LANGUAGE_OPTIONS.find(
        (lang) =>
          lang.toLowerCase().trim() === languageParam.toLowerCase().trim(),
      );
      if (foundLanguage) {
        setActiveLanguage(foundLanguage);
        setActiveActor(null);
      }
    }

    if (actorParam) {
      setActiveActor(actorParam);
      setActiveLanguage("For You");
    }
  }, [searchParams]);

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
      } catch (e) {}
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

  // ✅ FIXED: memoized so this doesn't create a brand-new array on every
  // single render (which was cascading into an infinite update loop via
  // handlePlayerExpandToggle → setExpandHandler → PlayerProvider re-render)
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesLanguage =
        activeLanguage.toLowerCase().trim() === "for you" ||
        (song.language || "").toLowerCase().trim() ===
          activeLanguage.toLowerCase().trim();

      const matchesGenre =
        activeGenre.toLowerCase().trim() === "all genres" ||
        (song.genre || "").toLowerCase().trim() ===
          activeGenre.toLowerCase().trim();

      let matchesActor = true;
      if (activeActor) {
        const actorNames = parseArtists(song.actorNames);
        matchesActor = actorNames.some(
          (name) =>
            name.toLowerCase().trim() === activeActor.toLowerCase().trim(),
        );
      }

      return matchesLanguage && matchesGenre && matchesActor;
    });
  }, [songs, activeLanguage, activeGenre, activeActor]);

  // ✅ FIXED: memoized so `albums`/`singles` keep the same reference across
  // unrelated re-renders (e.g. PlayerProvider context updates)
  const { albums, singles } = useMemo(
    () => groupByAlbum(filteredSongs),
    [filteredSongs],
  );

  const handleAlbumTrackPlay = useCallback(
    (track, trackList, trackIndex) => {
      handleSongClick(trackIndex, track, trackList);
    },
    [handleSongClick],
  );

  const handleCardClick = (song) => {
    const idx = singles.findIndex((s) => s.id === song.id);
    if (idx !== -1) handleSongClick(idx, song, singles);
  };

  const handlePlayButtonClick = (e, index, song, list) => {
    e.stopPropagation();
    handleSongClick(index, song, list);
  };

  const handleOpenAlbumProfile = useCallback(
    (album) => {
      if (
        profileOpen &&
        profileAlbum?.albumName?.toLowerCase() ===
          album.albumName?.toLowerCase()
      ) {
        setProfileOpen(false);
        return;
      }
      setProfileAlbum(album);
      setProfileSongs(album.tracks);
      setProfileOpen(true);
      fetchDurations(album.tracks);
      setIsAllLiked(
        album.tracks.length > 0 &&
          album.tracks.every((s) => likedSongs.has(s.id)),
      );
    },
    [profileOpen, profileAlbum, fetchDurations, likedSongs, setProfileOpen],
  );

  const handlePlayerExpandToggle = useCallback(() => {
    if (!currentSong) return;
    const foundAlbum = albums.find((a) =>
      a.tracks.some((t) => t.id === currentSong.id),
    );
    if (foundAlbum) {
      if (
        profileOpen &&
        profileAlbum?.albumName?.toLowerCase() ===
          foundAlbum.albumName?.toLowerCase()
      ) {
        setProfileOpen(false);
      } else {
        setProfileAlbum(foundAlbum);
        setProfileSongs(foundAlbum.tracks);
        setProfileOpen(true);
        fetchDurations(foundAlbum.tracks);
        setIsAllLiked(
          foundAlbum.tracks.length > 0 &&
            foundAlbum.tracks.every((s) => likedSongs.has(s.id)),
        );
      }
    } else {
      const singleContext = {
        albumName: "Single",
        albumCoverUrl: currentSong.img,
        primaryArtist: currentSong.artist,
        language: currentSong.language,
        genre: currentSong.genre,
        movieName: currentSong.movieName,
        tracks: [currentSong],
      };
      setProfileAlbum(singleContext);
      setProfileSongs([currentSong]);
      setProfileOpen(true);
      setIsAllLiked(likedSongs.has(currentSong.id));
    }
  }, [
    albums,
    profileOpen,
    profileAlbum,
    fetchDurations,
    likedSongs,
    currentSong,
    setProfileOpen,
  ]);

  useEffect(() => {
    setExpandHandler(() => handlePlayerExpandToggle);
    return () => setExpandHandler(null);
  }, [handlePlayerExpandToggle, setExpandHandler]);

  const handleSharePlaylist = () => {
    if (navigator.share)
      navigator.share({
        title: profileAlbum?.albumName || "Album",
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
    alert("Link copied!");
    setShowMoreMenu(false);
  };

  const getMovieOrAlbum = (song) => {
    if (song.movieName) return { type: "movie", name: song.movieName };
    if (song.albumName) return { type: "album", name: song.albumName };
    return null;
  };

  const totalPlayCount = profileAlbum
    ? profileSongs.reduce((sum, s) => sum + (s.playCount || 0), 0)
    : 0;
  const allArtists = profileAlbum
    ? [
        ...new Set(
          profileSongs.flatMap((s) =>
            parseArtists(s.featuringArtists).concat(s.artist),
          ),
        ),
      ]
    : [];

  return (
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-32 px-4 md:px-8 relative overflow-hidden bg-white">
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}

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
              {activeActor && (
                <span className="text-purple-500 font-medium ml-2">
                  · Showing songs featuring <strong>{activeActor}</strong>
                </span>
              )}
              {activeLanguage !== "For You" && !activeActor && (
                <span className="text-blue-500 font-medium ml-2">
                  · Showing <strong>{activeLanguage}</strong> songs
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
            onChange={(val) => {
              setActiveLanguage(val);
              setActiveActor(null);
            }}
            options={LANGUAGE_OPTIONS}
            label={activeLanguage}
          />
          <FilterDropdown
            value={activeGenre}
            onChange={setActiveGenre}
            options={GENRE_OPTIONS}
            label={activeGenre}
          />
          {activeActor && (
            <button
              onClick={() => {
                setActiveActor(null);
                setActiveLanguage("For You");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-all"
            >
              <X size={12} /> Clear: {activeActor}
            </button>
          )}
          {activeLanguage !== "For You" && !activeActor && (
            <button
              onClick={() => {
                setActiveLanguage("For You");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-all"
            >
              <X size={12} /> Clear: {activeLanguage}
            </button>
          )}
        </div>
      </div>

      {/* ── PROFILE PANEL ── */}
      <AnimatePresence>
        {profileOpen && profileAlbum && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-0 z-[95] bg-slate-50 overflow-y-auto"
            style={{ paddingBottom: "100px" }}
          >
            <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6">
              <button
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group mb-8"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="font-medium text-sm">
                  Back to New Releases
                </span>
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="relative flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                    <img
                      src={
                        profileAlbum.albumCoverUrl ||
                        "https://via.placeholder.com/200"
                      }
                      alt={profileAlbum.albumName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200";
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center text-center md:text-left flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
                    {profileAlbum.genre || "Album"}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                    {profileAlbum.albumName}
                  </h1>
                  <p className="text-sm text-slate-500 mb-4">
                    <ArtistLink
                      name={profileAlbum.primaryArtist}
                      className="text-sm text-slate-500 hover:text-blue-600"
                    />
                  </p>
                  <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start text-sm text-slate-600 mb-6">
                    {profileAlbum.language && (
                      <span className="font-semibold">
                        {profileAlbum.language}
                      </span>
                    )}
                    {profileAlbum.language && profileAlbum.movieName && (
                      <span className="text-slate-300">|</span>
                    )}
                    {profileAlbum.movieName && (
                      <span className="text-purple-500 font-semibold flex items-center gap-1">
                        <Film size={14} /> {profileAlbum.movieName}
                      </span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold">
                      {profileSongs.length} Tracks
                    </span>
                    {totalPlayCount > 0 && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Headphones size={14} className="text-blue-500" />{" "}
                          {formatCount(totalPlayCount)} Plays
                        </span>
                      </>
                    )}
                  </div>

                  {allArtists.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                      <Users size={14} className="text-slate-400" />
                      {allArtists.slice(0, 5).map((artist, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <ArtistLink
                            name={artist}
                            className="text-sm font-medium text-slate-600 hover:text-blue-600"
                          />
                          {idx < Math.min(allArtists.length, 5) - 1 && (
                            <span className="text-slate-400 text-xs">,</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => {
                        if (profileSongs.length > 0) {
                          handleAlbumTrackPlay(
                            profileSongs[0],
                            profileSongs,
                            0,
                          );
                        }
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                    >
                      <Play size={18} fill="white" /> Play All
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
                              <Share2 size={16} /> Share Album
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
                            <div className="mx-3 my-1 border-t border-slate-100" />
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                              <Flag size={16} /> Report
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <Music size={18} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Tracklist
                  </h2>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                    {profileSongs.length} Tracks
                  </span>
                </div>
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
                        <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {profileSongs.map((track, index) => {
                        const isTrackActive = currentSong?.id === track.id;
                        const dur = trackDurations[track.id];
                        const isLiked = likedSongs.has(track.id);
                        const uniqueTrackArtists = [
                          ...new Set([
                            track.artist,
                            ...parseArtists(track.featuringArtists),
                          ]),
                        ];
                        return (
                          <tr
                            key={track.id}
                            onClick={() =>
                              handleAlbumTrackPlay(track, profileSongs, index)
                            }
                            className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isTrackActive ? "bg-blue-50" : ""}`}
                          >
                            <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                              <div className="w-8 h-8 flex items-center justify-center">
                                {isTrackActive && playing ? (
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
                                      className={`text-sm font-medium group-hover:hidden ${isTrackActive ? "text-blue-600" : "text-slate-500"}`}
                                    >
                                      {track.trackNumber || index + 1}
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
                                  src={
                                    track.img ||
                                    track.albumCoverUrl ||
                                    "https://via.placeholder.com/40"
                                  }
                                  alt={track.title}
                                  className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/40";
                                  }}
                                />
                                <div className="min-w-0">
                                  <div
                                    className={`text-sm font-semibold truncate ${isTrackActive ? "text-blue-600" : "text-slate-900"}`}
                                  >
                                    {track.title}
                                  </div>
                                  {track.featuringArtists && (
                                    <div className="text-xs text-teal-500 truncate">
                                      ft. {track.featuringArtists}
                                    </div>
                                  )}
                                  <div className="md:hidden text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1 flex-wrap">
                                    {uniqueTrackArtists.map((a, i) => (
                                      <span
                                        key={i}
                                        className="flex items-center gap-0.5"
                                      >
                                        <ArtistLink
                                          name={a}
                                          className="hover:text-blue-600 text-slate-500 text-xs"
                                        />
                                        {i < uniqueTrackArtists.length - 1 && (
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
                                {uniqueTrackArtists.map((a, i) => (
                                  <span
                                    key={i}
                                    className="flex items-center gap-1"
                                  >
                                    <ArtistLink
                                      name={a}
                                      className="hover:text-blue-600 text-slate-600 text-sm"
                                    />
                                    {i < uniqueTrackArtists.length - 1 && (
                                      <span className="text-slate-300">,</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                              {formatDuration(dur)}
                            </td>
                            <td className="px-4 md:px-6 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLikeSong(track.id);
                                }}
                                className={`transition-all hover:scale-110 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
                              >
                                <Heart
                                  size={16}
                                  fill={isLiked ? "currentColor" : "none"}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      {loading ? (
        <div className="flex justify-center py-40">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Music className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">
            No releases found
          </h3>
          <p className="text-slate-500">
            Try changing the language or genre filter.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <>
          {albums.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Disc3 size={20} className="text-blue-600" /> Albums (
                {albums.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {albums.map((album, idx) => (
                  <AlbumCard
                    key={album.albumName}
                    album={album}
                    index={idx}
                    currentSong={currentSong}
                    playing={playing}
                    onPlayTrack={handleAlbumTrackPlay}
                    onOpenProfile={handleOpenAlbumProfile}
                    trackDurations={trackDurations}
                    fetchDurations={fetchDurations}
                    likedSongs={likedSongs}
                    onLike={toggleLikeSong}
                  />
                ))}
              </div>
            </div>
          )}

          {singles.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Music size={20} className="text-blue-600" /> Singles (
                {singles.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {singles.map((song, idx) => {
                  const isSongActive = currentSong?.id === song.id;
                  const isLiked = likedSongs.has(song.id);
                  const featuringList = parseArtists(song.featuringArtists);
                  const actors = parseArtists(song.actorNames);
                  return (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.04 }}
                      className="group"
                    >
                      <div
                        onClick={() => handleCardClick(song)}
                        className={`relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border cursor-pointer ${isSongActive ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 group-hover:border-blue-400"} group-hover:shadow-xl transition-all duration-300`}
                      >
                        <img
                          src={song.img || "https://via.placeholder.com/300"}
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
                              handlePlayButtonClick(e, idx, song, singles)
                            }
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                          >
                            {isSongActive && playing ? (
                              <Pause size={20} className="text-white" />
                            ) : (
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            )}
                          </motion.div>
                        </div>
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 text-blue-600">
                          NEW
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong(song.id);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all hover:scale-110 ${isLiked ? "bg-red-500/90 text-white" : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100"}`}
                        >
                          <Heart
                            size={14}
                            fill={isLiked ? "currentColor" : "none"}
                          />
                        </button>
                        {song.movieName && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-purple-200 text-[11px] font-semibold truncate flex items-center gap-1">
                              <Film size={9} /> {song.movieName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-0.5">
                        <h3
                          className={`font-bold text-sm truncate transition-colors leading-tight text-slate-900 ${isSongActive ? "text-blue-600" : ""}`}
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
                        {song.movieName && (
                          <p className="text-[10px] text-purple-500 truncate mt-0.5 flex items-center gap-1">
                            <Film size={9} /> {song.movieName}
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
            </div>
          )}
        </>
      ) : (
        /* ── TABLE VIEW ── */
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
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Album / Movie
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                    <Clock size={14} className="inline" />
                  </th>
                  <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredSongs.map((song, index) => {
                  const isSongActive = currentSong?.id === song.id;
                  const dur = trackDurations[song.id];
                  const isLiked = likedSongs.has(song.id);
                  const uniqueArtists = [
                    ...new Set([
                      song.artist,
                      ...parseArtists(song.featuringArtists),
                    ]),
                  ];
                  const movieOrAlbum = getMovieOrAlbum(song);
                  return (
                    <tr
                      key={song.id}
                      onClick={() =>
                        handleSongClick(index, song, filteredSongs)
                      }
                      className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isSongActive ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {isSongActive && playing ? (
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
                                className={`text-sm font-medium group-hover:hidden ${isSongActive ? "text-blue-600" : "text-slate-500"}`}
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
                            src={song.img || "https://via.placeholder.com/40"}
                            alt={song.title}
                            className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/40";
                            }}
                          />
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-semibold truncate ${isSongActive ? "text-blue-600" : "text-slate-900"}`}
                            >
                              {song.title}
                            </div>
                            {song.featuringArtists && (
                              <div className="text-xs text-teal-500 truncate">
                                ft. {song.featuringArtists}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 flex-wrap text-sm text-slate-600">
                          {uniqueArtists.map((a, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <ArtistLink
                                name={a}
                                className="hover:text-blue-600 text-slate-600 text-sm"
                              />
                              {i < uniqueArtists.length - 1 && (
                                <span className="text-slate-300">,</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 hidden md:table-cell">
                        {movieOrAlbum && (
                          <span
                            className={`text-sm truncate flex items-center gap-1 ${movieOrAlbum.type === "movie" ? "text-purple-500" : "text-blue-500"}`}
                          >
                            {movieOrAlbum.type === "movie" ? (
                              <Film size={12} />
                            ) : (
                              <Disc3 size={12} />
                            )}
                            {movieOrAlbum.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
                        {formatDuration(dur)}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong(song.id);
                          }}
                          className={`transition-all hover:scale-110 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
                        >
                          <Heart
                            size={16}
                            fill={isLiked ? "currentColor" : "none"}
                          />
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
    </div>
  );
};

export default NewRelease;
