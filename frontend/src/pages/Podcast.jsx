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
  Heart,
  ArrowLeft,
  Clock,
  MoreHorizontal,
  Mic2,
  Disc3,
  Headphones,
  Share2,
  Link2,
  Flag,
  ListPlus,
  Search,
  Loader2,
  UserCircle,
  X,
  Maximize2, // ✅ Added Maximize2
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import StickyPlayer from "../components/StickyPlayer";

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val.includes(":") ? val : "0:00";
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

const Podcast = () => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState([]);
  const [activePodcast, setActivePodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [likedEpisodes, setLikedEpisodes] = useState(new Set());
  const [isAllLiked, setIsAllLiked] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // ✅ Duration wala logic wapas local state mein
  const [durations, setDurations] = useState({});

  const moreMenuRef = useRef(null);
  const player = useAudioPlayer();

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchPodcasts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("podcasts")
          .select(`*, podcast_episodes (*)`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const patchedPodcasts = (data || []).map((p) => ({
          ...p,
          podcast_episodes: (p.podcast_episodes || []).map((ep) => ({
            ...ep,
            title: ep.episode_title,
            audioUrl: ep.audio_url,
            img: p.image_url || "https://via.placeholder.com/300",
            host: p.host,
            podcastId: p.id,
            playCount: 0,
          })),
        }));
        setPodcasts(patchedPodcasts);
      } catch (err) {
        console.error("Error fetching podcasts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPodcasts();
  }, []);

  const filteredPodcasts = podcasts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.host || "").toLowerCase().includes(q) ||
      (p.type || "").toLowerCase().includes(q)
    );
  });

  const uniqueFilteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const allEps = podcasts.flatMap((p) => p.podcast_episodes || []);
    const matched = allEps.filter((ep) => {
      return (
        (ep.title || "").toLowerCase().includes(q) ||
        (ep.host || "").toLowerCase().includes(q) ||
        (ep.description || "").toLowerCase().includes(q)
      );
    });
    const seen = new Set();
    const unique = [];
    matched.forEach((ep) => {
      if (!seen.has(ep.id)) {
        seen.add(ep.id);
        unique.push(ep);
      }
    });
    return unique;
  }, [podcasts, searchQuery]);

  const visibleEpisodesInActivePodcast = activePodcast
    ? activePodcast.podcast_episodes.filter((ep) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (ep.title || "").toLowerCase().includes(q) ||
          (ep.host || "").toLowerCase().includes(q) ||
          (ep.description || "").toLowerCase().includes(q)
        );
      })
    : [];

  // ✅ Local Duration Fetching Logic
  useEffect(() => {
    const epsToFetch = activePodcast
      ? visibleEpisodesInActivePodcast
      : uniqueFilteredEpisodes;
    if (!searchQuery.trim() && !activePodcast) return;
    epsToFetch.forEach((ep) => {
      if (!durations[ep.id] && ep.audioUrl) {
        const tempAudio = new Audio();
        tempAudio.preload = "metadata";
        tempAudio.src = ep.audioUrl;
        tempAudio.onloadedmetadata = () => {
          if (isFinite(tempAudio.duration)) {
            setDurations((prev) => ({
              ...prev,
              [ep.id]: tempAudio.duration,
            }));
          }
        };
      }
    });
  }, [
    uniqueFilteredEpisodes,
    visibleEpisodesInActivePodcast,
    searchQuery,
    activePodcast,
    durations,
  ]);

  const toggleLikeEpisode = (epId) => {
    setLikedEpisodes((prev) => {
      const n = new Set(prev);
      if (n.has(epId)) n.delete(epId);
      else n.add(epId);
      if (activePodcast)
        setIsAllLiked(
          n.size === activePodcast.podcast_episodes.length &&
            activePodcast.podcast_episodes.length > 0,
        );
      return n;
    });
  };

  const toggleLikeAll = () => {
    if (!activePodcast) return;
    if (isAllLiked) {
      setLikedEpisodes(new Set());
      setIsAllLiked(false);
    } else {
      setLikedEpisodes(
        new Set(activePodcast.podcast_episodes.map((s) => s.id)),
      );
      setIsAllLiked(true);
    }
  };

  const handleSharePodcast = () => {
    if (navigator.share)
      navigator.share({
        title: activePodcast.title,
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

  const totalEpisodes = activePodcast
    ? activePodcast.podcast_episodes.length
    : 0;
  const totalListens = activePodcast ? activePodcast.total_listens || 0 : 0;

  // ✅ Expand toggle from StickyPlayer (Same logic as TopPlaylist & Radio)
  const handlePlayerExpandToggle = useCallback(() => {
    if (!player.currentSong) return;

    // Find which podcast contains the currently playing episode
    const foundPodcast = podcasts.find((p) =>
      p.podcast_episodes.some((ep) => ep.id === player.currentSong.id),
    );

    if (foundPodcast) {
      // If the same podcast profile is already open, close it
      if (activePodcast?.id === foundPodcast.id) {
        setActivePodcast(null);
      } else {
        // Otherwise, open that podcast's profile
        setActivePodcast(foundPodcast);
        setSearchQuery(""); // Clear search so all episodes show
        setIsAllLiked(
          (foundPodcast.podcast_episodes || []).every((ep) =>
            likedEpisodes.has(ep.id),
          ),
        );
      }
    }
  }, [podcasts, activePodcast, likedEpisodes, player.currentSong]);

  // ✅ Check if the current playing song belongs to the active podcast profile
  const isCurrentPodcastPlaying =
    activePodcast &&
    player.currentSong &&
    activePodcast.podcast_episodes.some(
      (ep) => ep.id === player.currentSong.id,
    );

  return (
    <div className="w-full min-h-screen text-slate-900 pb-24 relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/40 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-purple-100/50 to-transparent pointer-events-none"></div>

      <div className="relative px-4 md:px-8 pt-6 max-w-7xl mx-auto">
        {!activePodcast ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="w-full md:w-auto">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {searchQuery.trim() ? "Search" : "Top"}{" "}
                  <span className="text-purple-600">
                    {searchQuery.trim() ? "Results" : "Podcasts"}
                  </span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {searchQuery.trim()
                    ? `Showing results for "${searchQuery}"`
                    : "Real conversations with real people."}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shows, hosts, episodes..."
                    className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-purple-500 shadow-sm"
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
                <Loader2 className="animate-spin text-purple-600" size={40} />
              </div>
            ) : searchQuery.trim() ? (
              <div className="pb-10">
                {filteredPodcasts.length === 0 &&
                uniqueFilteredEpisodes.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <Mic2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">
                      No results found
                    </h3>
                    <p className="text-slate-500">
                      Try searching with a different keyword.
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredPodcasts.length > 0 && (
                      <div className="mb-12">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Disc3 size={18} className="text-purple-600" />{" "}
                          Podcasts ({filteredPodcasts.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {filteredPodcasts.map((p) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => {
                                setActivePodcast(p);
                                setSearchQuery("");
                              }}
                              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
                            >
                              <img
                                src={
                                  p.image_url ||
                                  "https://via.placeholder.com/400x200"
                                }
                                alt={p.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                              <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                                  {p.type || "Podcast"}
                                </p>
                                <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                                  {p.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                                  <span className="flex items-center gap-1">
                                    <UserCircle size={10} /> {p.host}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Headphones size={10} />{" "}
                                    {formatCount(p.total_listens || 0)}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uniqueFilteredEpisodes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Mic2 size={18} className="text-purple-600" />{" "}
                          Episodes ({uniqueFilteredEpisodes.length})
                        </h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 md:px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                                    #
                                  </th>
                                  <th className="px-4 md:px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Episode
                                  </th>
                                  <th className="px-4 md:px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Host Name
                                  </th>
                                  <th className="px-4 md:px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                                    Like
                                  </th>
                                  <th className="px-4 md:px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                                    <Clock size={14} className="inline" />
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100">
                                {uniqueFilteredEpisodes.map((ep, index) => {
                                  const isActive =
                                    player.currentSong?.id === ep.id;
                                  const actualDuration = durations[ep.id];
                                  const isLiked = likedEpisodes.has(ep.id);
                                  return (
                                    <motion.tr
                                      key={ep.id}
                                      onClick={() =>
                                        player.handleSongClick(
                                          index,
                                          ep,
                                          uniqueFilteredEpisodes,
                                        )
                                      }
                                      className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-purple-50" : ""}`}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        duration: 0.3,
                                        delay: index * 0.02,
                                      }}
                                    >
                                      <td className="px-4 md:px-5 py-3 whitespace-nowrap">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                          {isActive && player.playing ? (
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
                                                className="w-1 bg-purple-600 rounded-full"
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
                                                className="w-1 bg-purple-600 rounded-full"
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
                                                className="w-1 bg-purple-600 rounded-full"
                                              />
                                            </div>
                                          ) : (
                                            <>
                                              <span
                                                className={`text-sm font-medium group-hover:hidden ${isActive ? "text-purple-600" : "text-slate-500"}`}
                                              >
                                                {index + 1}
                                              </span>
                                              <Play
                                                size={16}
                                                className="text-purple-600 hidden group-hover:block fill-purple-600"
                                              />
                                            </>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 md:px-5 py-3">
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={ep.img}
                                            alt={ep.title}
                                            className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                                            onError={(e) => {
                                              e.target.src =
                                                "https://via.placeholder.com/40";
                                            }}
                                          />
                                          <div className="min-w-0">
                                            <div
                                              className={`text-sm font-semibold truncate ${isActive ? "text-purple-600" : "text-slate-900"}`}
                                            >
                                              {ep.title}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 md:px-5 py-3">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                          <UserCircle
                                            size={14}
                                            className="text-slate-400 flex-shrink-0"
                                          />
                                          <span className="truncate font-medium">
                                            {ep.host}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 md:px-5 py-3 text-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLikeEpisode(ep.id);
                                          }}
                                          className="inline-flex items-center justify-center transition-all hover:scale-125"
                                        >
                                          <Heart
                                            size={18}
                                            className={`transition-colors ${isLiked ? "text-red-500 fill-red-500" : "text-slate-300 hover:text-red-400"}`}
                                          />
                                        </button>
                                      </td>
                                      <td className="px-4 md:px-5 py-3 text-right text-sm text-slate-500 font-mono whitespace-nowrap">
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
                {podcasts.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setActivePodcast(p)}
                    className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
                  >
                    <img
                      src={p.image_url || "https://via.placeholder.com/400x200"}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                    <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                        {p.type || "Podcast"}
                      </p>
                      <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                        <span className="flex items-center gap-1">
                          <UserCircle size={10} /> {p.host}
                        </span>
                        <span className="flex items-center gap-1">
                          <Headphones size={10} />{" "}
                          {formatCount(p.total_listens || 0)}
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <button
                onClick={() => {
                  setActivePodcast(null);
                  player.handleClosePlayer();
                  setSearchQuery("");
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="font-medium text-sm">Back to Podcasts</span>
              </button>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search within this podcast..."
                    className="w-full pl-10 pr-10 py-3 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-purple-500 shadow-sm"
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

            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                  <img
                    src={activePodcast.image_url}
                    alt={activePodcast.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center text-center md:text-left flex-1">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Disc3 size={14} className="text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                    {activePodcast.type || "Podcast"}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 text-slate-900">
                  {activePodcast.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-2">
                  <UserCircle size={16} className="text-purple-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Host Name:
                  </span>
                  <span className="text-base font-semibold text-slate-800">
                    {activePodcast.host}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start text-sm text-slate-600 mb-8">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Mic2 size={14} className="text-purple-500" />
                    {totalEpisodes} Episodes
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Headphones size={14} className="text-green-500" />
                    {formatCount(totalListens)} Listens
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    Audio Show
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <button
                    onClick={() =>
                      player.handleSongClick(
                        0,
                        activePodcast.podcast_episodes[0],
                        activePodcast.podcast_episodes,
                      )
                    }
                    className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-3.5 rounded-full font-bold text-base flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
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
                            onClick={handleSharePodcast}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          >
                            <Share2 size={16} /> Share Podcast
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          >
                            <Link2 size={16} /> Copy Link
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Episode
                      </th>
                      <th className="px-4 md:px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Host Name
                      </th>
                      <th className="px-4 md:px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                        Like
                      </th>
                      <th className="px-4 md:px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
                        <Clock size={14} className="inline" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {visibleEpisodesInActivePodcast.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-10 text-slate-400"
                        >
                          No episodes match your search
                        </td>
                      </tr>
                    ) : (
                      visibleEpisodesInActivePodcast.map((ep, index) => {
                        const isActive = player.currentSong?.id === ep.id;
                        const actualDuration = durations[ep.id];
                        const isLiked = likedEpisodes.has(ep.id);
                        return (
                          <tr
                            key={ep.id}
                            onClick={() =>
                              player.handleSongClick(
                                index,
                                ep,
                                visibleEpisodesInActivePodcast,
                              )
                            }
                            className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-purple-50" : ""}`}
                          >
                            <td className="px-4 md:px-5 py-3 whitespace-nowrap">
                              <div className="w-8 h-8 flex items-center justify-center">
                                {isActive && player.playing ? (
                                  <div className="flex items-end gap-0.5 h-4">
                                    <motion.div
                                      animate={{
                                        height: ["40%", "100%", "40%"],
                                      }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.6,
                                      }}
                                      className="w-1 bg-purple-600 rounded-full"
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
                                      className="w-1 bg-purple-600 rounded-full"
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
                                      className="w-1 bg-purple-600 rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className={`text-sm font-medium group-hover:hidden ${isActive ? "text-purple-600" : "text-slate-500"}`}
                                    >
                                      {index + 1}
                                    </span>
                                    <Play
                                      size={16}
                                      className="text-purple-600 hidden group-hover:block fill-purple-600"
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 md:px-5 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={ep.img}
                                  alt={ep.title}
                                  className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/40";
                                  }}
                                />
                                <div className="min-w-0">
                                  <div
                                    className={`text-sm font-semibold truncate ${isActive ? "text-purple-600" : "text-slate-900"}`}
                                  >
                                    {ep.title}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-5 py-3">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                <UserCircle
                                  size={14}
                                  className="text-slate-400 flex-shrink-0"
                                />
                                <span className="truncate font-medium">
                                  {ep.host}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 md:px-5 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLikeEpisode(ep.id);
                                }}
                                className="inline-flex items-center justify-center transition-all hover:scale-125"
                              >
                                <Heart
                                  size={18}
                                  className={`transition-colors ${isLiked ? "text-red-500 fill-red-500" : "text-slate-300 hover:text-red-400"}`}
                                />
                              </button>
                            </td>
                            <td className="px-4 md:px-5 py-3 text-right text-sm text-slate-500 font-mono whitespace-nowrap">
                              {formatDuration(actualDuration)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── STICKY PLAYER ── */}
      <AnimatePresence>
        {player.currentSong && (
          <StickyPlayer
            song={player.currentSong}
            isPlaying={player.playing}
            onPlayPause={player.handlePlayPause}
            onSeek={player.handleSeek}
            onPrev={player.handlePrev}
            onNext={player.handleNext}
            currentTime={player.currentTime}
            duration={player.duration}
            volume={player.volume}
            onVolumeChange={player.handleVolumeChange}
            isMuted={player.isMuted}
            toggleMute={player.toggleMute}
            isShuffle={player.isShuffle}
            onToggleShuffle={player.onToggleShuffle}
            onClose={player.handleClosePlayer}
            currentRadioStation={null}
            profileOpen={isCurrentPodcastPlaying} // ✅ Fixed
            onToggleProfile={
              player.currentSong ? handlePlayerExpandToggle : null
            } // ✅ Fixed
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Podcast;
