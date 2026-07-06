import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
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
  Search,
  Loader2,
  X,
  Plus,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Auth from "../components/Auth";
// This MUST point at the exact same PlayerContext.jsx file that wraps
// your <App /> with <PlayerProvider> in e.g. main.jsx/App.jsx — otherwise
// you end up with two separate React contexts and usePlayer() will throw
// "must be used inside <PlayerProvider>" even though a provider exists.
import {
  usePlayer,
  formatCount,
  parseArtists,
} from "../components/PlayerContext";

// ─── EXTRACTED SONG ROW ───
const SongRow = ({
  song,
  index,
  list,
  skipAnimation = false,
  showLike = false,
  onLike,
  isLiked,
  currentSong,
  playing,
  durations,
  onSongClick,
}) => {
  const isActive = currentSong?.id === song.id;
  const uniqueSongArtists = [
    ...new Set([song.artist, ...parseArtists(song.featuring_artists)]),
  ];
  const actualDuration = durations[song.id];

  const rowContent = (
    <>
      <td className="px-4 md:px-6 py-3 whitespace-nowrap">
        <div className="w-8 h-8 flex items-center justify-center">
          {isActive && playing ? (
            <div className="flex items-end gap-0.5 h-4">
              <motion.div
                animate={{ height: ["40%", "100%", "40%"] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-1 bg-blue-600 rounded-full"
              />
              <motion.div
                animate={{ height: ["100%", "40%", "100%"] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                className="w-1 bg-blue-600 rounded-full"
              />
              <motion.div
                animate={{ height: ["60%", "100%", "60%"] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
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
              e.target.src = "https://via.placeholder.com/40";
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
                <span key={i} className="flex items-center gap-0.5">
                  <Link
                    to={`/artist/${encodeURIComponent(a)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {a}
                  </Link>
                  {i < uniqueSongArtists.length - 1 && (
                    <span className="text-slate-300">,</span>
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
            <span key={i} className="flex items-center gap-1">
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
      <td className="px-4 md:px-6 py-3 text-right text-sm text-slate-500 font-mono">
        {formatDuration(actualDuration)}
      </td>
      {showLike && (
        <td className="px-4 md:px-6 py-3 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onLike) onLike(song.release_id || song.id);
            }}
            className={`transition-all hover:scale-110 ${isLiked ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </td>
      )}
    </>
  );

  if (skipAnimation) {
    return (
      <tr
        onClick={() => onSongClick(index, song, list)}
        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
      >
        {rowContent}
      </tr>
    );
  }

  return (
    <motion.tr
      onClick={() => onSongClick(index, song, list)}
      className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
    >
      {rowContent}
    </motion.tr>
  );
};

// Local copy so this file has no other dependency for a one-off format —
// PlayerProvider also exports the same helper, kept identical on purpose.
const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
const TopPlaylist = () => {
  const [searchParams] = useSearchParams();

  // ✅ Everything playback-related now comes from the SHARED player.
  // TopPlaylist no longer owns an <audio> element, its own sticky player,
  // or its own play/pause/next/prev/ad logic — all of that lives once in
  // PlayerProvider so every page (and the global sticky bar) stays in
  // sync, and so ad-before-song behavior is consistent everywhere.
  const {
    user,
    playing,
    currentSong,
    handleSongClick,
    playList,
    profileOpen,
    setProfileOpen,
    setExpandHandler,
  } = usePlayer();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [likedSongs, setLikedSongs] = useState(new Set());
  const [isAllLiked, setIsAllLiked] = useState(false);
  const [durations, setDurations] = useState({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [profilePlaylist, setProfilePlaylist] = useState(null);
  const [profileSongs, setProfileSongs] = useState([]);

  const [showAuthModal, setShowAuthModal] = useState(false);

  // ✅ ADD TO PLAYLIST STATES
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [addToPlaylistLoading, setAddToPlaylistLoading] = useState(false);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState(new Set());

  const moreMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchLikes = async (userId) => {
    const { data } = await supabase
      .from("likes")
      .select("release_id")
      .eq("user_id", userId);
    if (data) setLikedSongs(new Set(data.map((l) => l.release_id)));
  };

  const fetchUserPlaylists = async (uid) => {
    try {
      const { data, error } = await supabase
        .from("user_playlists")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (!error && data) setUserPlaylists(data);
    } catch (err) {
      console.error("Fetch user playlists error:", err);
    }
  };

  // ✅ Likes + user playlists are driven off the SHARED `user` from
  // PlayerProvider — no separate auth listener needed on this page.
  useEffect(() => {
    if (user) {
      fetchLikes(user.id);
      fetchUserPlaylists(user.id);
    } else {
      setLikedSongs(new Set());
      setUserPlaylists([]);
    }
  }, [user]);

  // ✅ ADD ALL SONGS FROM PLAYLIST TO USER PLAYLIST
  const handleAddToUserPlaylist = async (targetPlaylist) => {
    if (!profilePlaylist || !profileSongs.length) return;
    setAddToPlaylistLoading(true);
    try {
      const { data: existingSongs } = await supabase
        .from("user_playlist_songs")
        .select("release_id")
        .eq("playlist_id", targetPlaylist.id);
      const existingIds = new Set(
        (existingSongs || []).map((s) => s.release_id),
      );

      const songsToAdd = profileSongs
        .filter((s) => s.release_id && !existingIds.has(s.release_id))
        .map((s, i) => ({
          playlist_id: targetPlaylist.id,
          release_id: s.release_id,
          position: (existingSongs?.length || 0) + i,
        }));

      if (songsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("user_playlist_songs")
          .insert(songsToAdd);
        if (insertError) throw insertError;
      }

      if (!targetPlaylist.cover_url && profilePlaylist.image_url) {
        await supabase
          .from("user_playlists")
          .update({ cover_url: profilePlaylist.image_url })
          .eq("id", targetPlaylist.id);
        setUserPlaylists((prev) =>
          prev.map((p) =>
            p.id === targetPlaylist.id
              ? { ...p, cover_url: profilePlaylist.image_url }
              : p,
          ),
        );
      }

      setAddedPlaylistIds((prev) => new Set([...prev, targetPlaylist.id]));
    } catch (err) {
      console.error("Add to playlist error:", err);
    } finally {
      setAddToPlaylistLoading(false);
    }
  };

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
              lyrics: rel.lyrics || "",
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

  // Handle playlist query parameter
  useEffect(() => {
    const playlistParam = searchParams.get("playlist");
    if (playlistParam && playlists.length > 0) {
      const normalizedParam = playlistParam.toLowerCase().trim();
      const foundPlaylist = playlists.find((p) => {
        const normalizedTitle = p.title.toLowerCase().trim();
        return (
          normalizedTitle.includes(normalizedParam) ||
          normalizedParam.includes(normalizedTitle)
        );
      });
      if (foundPlaylist) {
        setProfilePlaylist(foundPlaylist);
        setProfileSongs(foundPlaylist.playlist_songs || []);
        setProfileOpen(true);
        setIsAllLiked(
          foundPlaylist.playlist_songs.length > 0 &&
            foundPlaylist.playlist_songs.every((s) =>
              likedSongs.has(s.release_id || s.id),
            ),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, playlists, likedSongs]);

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
    const matched = allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.featuring_artists || "").toLowerCase().includes(q) ||
        (s.lyrics || "").toLowerCase().includes(q),
    );
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

  // Fetch Durations (display-only — just probes metadata, does not touch
  // the shared player's <audio> element)
  useEffect(() => {
    const songsToFetch = profileOpen ? profileSongs : uniqueFilteredSongs;
    if (!searchQuery.trim() && !profileOpen) return;
    songsToFetch.forEach((song) => {
      if (!durations[song.id] && song.audioUrl) {
        const tempAudio = new Audio();
        tempAudio.preload = "metadata";
        tempAudio.src = song.audioUrl;
        tempAudio.onloadedmetadata = () => {
          if (isFinite(tempAudio.duration))
            setDurations((prev) => ({
              ...prev,
              [song.id]: tempAudio.duration,
            }));
        };
      }
    });
  }, [uniqueFilteredSongs, profileSongs, searchQuery, profileOpen, durations]);

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

  const toggleLikeAll = () => {
    if (!profilePlaylist) return;
    if (isAllLiked) {
      setLikedSongs(new Set());
      setIsAllLiked(false);
    } else {
      setLikedSongs(
        new Set(
          profilePlaylist.playlist_songs.map((s) => s.release_id || s.id),
        ),
      );
      setIsAllLiked(true);
    }
  };

  const handleSharePlaylist = () => {
    if (navigator.share)
      navigator.share({
        title: profilePlaylist.title,
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

  const handleOpenPlaylistProfile = useCallback(
    (playlist) => {
      if (profileOpen && profilePlaylist?.id === playlist.id) {
        setProfileOpen(false);
        return;
      }
      setProfilePlaylist(playlist);
      setProfileSongs(playlist.playlist_songs || []);
      setProfileOpen(true);
      setIsAllLiked(
        playlist.playlist_songs.length > 0 &&
          playlist.playlist_songs.every((s) =>
            likedSongs.has(s.release_id || s.id),
          ),
      );
    },
    [profileOpen, profilePlaylist, likedSongs, setProfileOpen],
  );

  // ✅ Wire up the sticky player's "expand" (Maximize2) button: tapping it
  // opens the profile panel for whichever playlist the current song
  // belongs to. Registered with the shared player so it's available
  // regardless of which page rendered the sticky bar.
  const handlePlayerExpandToggle = useCallback(() => {
    if (!currentSong) return;
    const foundPlaylist = playlists.find((p) =>
      p.playlist_songs.some((s) => s.id === currentSong.id),
    );
    if (!foundPlaylist) return;
    if (profileOpen && profilePlaylist?.id === foundPlaylist.id) {
      setProfileOpen(false);
    } else {
      setProfilePlaylist(foundPlaylist);
      setProfileSongs(foundPlaylist.playlist_songs);
      setProfileOpen(true);
      setIsAllLiked(
        foundPlaylist.playlist_songs.every((s) =>
          likedSongs.has(s.release_id || s.id),
        ),
      );
    }
  }, [
    currentSong,
    playlists,
    profileOpen,
    profilePlaylist,
    likedSongs,
    setProfileOpen,
  ]);

  useEffect(() => {
    setExpandHandler(() => handlePlayerExpandToggle);
    return () => setExpandHandler(null);
  }, [handlePlayerExpandToggle, setExpandHandler]);

  const totalListeners = profilePlaylist
    ? profilePlaylist.playlist_songs.reduce(
        (sum, s) => sum + (s.playCount || 0),
        0,
      )
    : 0;
  const allArtists = profilePlaylist
    ? [
        ...new Set(
          profilePlaylist.playlist_songs.flatMap((s) =>
            parseArtists(s.featuring_artists).concat(s.artist),
          ),
        ),
      ]
    : [];

  return (
    <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}

      {/* ═══════════════════════════════════════ */}
      {/* ── ADD TO PLAYLIST MODAL ── */}
      {/* ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showAddToPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={() => setShowAddToPlaylistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAddToPlaylistModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Add to Playlist
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                {profilePlaylist?.title} · {profileSongs.length} songs
              </p>

              {userPlaylists.length === 0 ? (
                <div className="text-center py-8">
                  <Disc3 size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 mb-4">
                    No playlists yet. Create one first!
                  </p>
                  <Link
                    to="/new-playlist"
                    className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-all"
                  >
                    Create Playlist
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {userPlaylists.map((pl) => {
                    const isAdded = addedPlaylistIds.has(pl.id);
                    return (
                      <button
                        key={pl.id}
                        onClick={() => handleAddToUserPlaylist(pl)}
                        disabled={addToPlaylistLoading || isAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isAdded ? "bg-green-50 border-green-200" : "hover:bg-slate-50 border-slate-100"}`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                          {pl.cover_url ? (
                            <img
                              src={pl.cover_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Disc3
                              size={24}
                              className="w-full h-full p-2 text-slate-400"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm truncate ${isAdded ? "text-green-700" : "text-slate-900"}`}
                          >
                            {pl.title}
                          </p>
                          <p className="text-xs text-slate-500">Playlist</p>
                        </div>
                        {isAdded ? (
                          <Check
                            size={18}
                            className="text-green-600 flex-shrink-0"
                          />
                        ) : addToPlaylistLoading ? (
                          <Loader2
                            size={18}
                            className="animate-spin text-blue-600 flex-shrink-0"
                          />
                        ) : (
                          <Plus
                            size={18}
                            className="text-slate-400 flex-shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PROFILE PANEL ── */}
      <AnimatePresence>
        {profileOpen && profilePlaylist && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-0 z-[95] bg-slate-50 overflow-y-auto"
            style={{ paddingBottom: "100px" }}
          >
            <div className="relative px-4 md:px-8 pt-6 max-w-6xl mx-auto">
              <button
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group mb-8"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="font-medium text-sm">
                  Back to Top Playlists
                </span>
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                    <img
                      src={profilePlaylist.image_url}
                      alt={profilePlaylist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center text-center md:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <Disc3 size={14} className="text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                      {profilePlaylist.language}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 text-slate-900">
                    {profilePlaylist.title}
                  </h1>

                  <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                    <Users size={14} className="text-slate-400" />
                    {allArtists.slice(0, 5).map((artist, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <Link
                          to={`/artist/${encodeURIComponent(artist)}`}
                          onClick={(e) => e.stopPropagation()}
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
                      {profilePlaylist.playlist_songs.length} Songs
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Headphones size={14} className="text-blue-500" />{" "}
                      {formatCount(totalListeners)} Listeners
                    </span>
                  </div>

                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => playList(profilePlaylist.playlist_songs)}
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
                              onClick={() => {
                                playList(profilePlaylist.playlist_songs);
                                setShowMoreMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Play size={16} /> Play Playlist Now
                            </button>
                            <button
                              onClick={() => {
                                setShowMoreMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <ListPlus size={16} /> Add to Queue
                            </button>
                            {/* ✅ ADD TO PLAYLIST - Opens the modal */}
                            <button
                              onClick={() => {
                                setShowMoreMenu(false);
                                if (!user) {
                                  setShowAuthModal(true);
                                  return;
                                }
                                setShowAddToPlaylistModal(true);
                                setAddedPlaylistIds(new Set());
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <ListPlus size={16} /> Add to Playlist
                            </button>
                            <div className="mx-3 my-1 border-t border-slate-100" />
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
                        <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {profileSongs.map((song, index) => (
                        <SongRow
                          key={song.id}
                          song={song}
                          index={index}
                          list={profileSongs}
                          skipAnimation
                          showLike
                          onLike={toggleLikeSong}
                          isLiked={likedSongs.has(song.release_id || song.id)}
                          currentSong={currentSong}
                          playing={playing}
                          durations={durations}
                          onSongClick={handleSongClick}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="relative px-4 md:px-8 pt-6 max-w-7xl mx-auto">
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
                      <Disc3 size={18} className="text-blue-600" /> Playlists (
                      {filteredPlaylists.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredPlaylists.map((playlist) => (
                        <motion.div
                          key={playlist.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleOpenPlaylistProfile(playlist)}
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
                            {uniqueFilteredSongs.map((song, index) => (
                              <SongRow
                                key={song.id}
                                song={song}
                                index={index}
                                list={uniqueFilteredSongs}
                                currentSong={currentSong}
                                playing={playing}
                                durations={durations}
                                onSongClick={handleSongClick}
                              />
                            ))}
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
                onClick={() => handleOpenPlaylistProfile(playlist)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
              >
                <img
                  src={
                    playlist.image_url || "https://via.placeholder.com/400x200"
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
        )}
      </div>

      {/* ✅ NOTE: no <StickyPlayer /> here anymore — PlayerProvider renders
          ONE global sticky player at the app root, so it stays mounted
          (and playback keeps going) as you navigate between pages. */}
    </div>
  );
};

export default TopPlaylist;
