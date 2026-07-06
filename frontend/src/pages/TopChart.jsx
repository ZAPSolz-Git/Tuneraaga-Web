import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Calendar,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  usePlayer,
  formatDuration,
  formatCount,
  parseArtists,
} from "../components/PlayerContext";

const TopChart = () => {
  const navigate = useNavigate();
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [isAllLiked, setIsAllLiked] = useState(false);
  const [durations, setDurations] = useState({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Profile panel state
  const [profileChart, setProfileChart] = useState(null);
  const [profileSongs, setProfileSongs] = useState([]);

  const moreMenuRef = useRef(null);

  // ✅ Everything playback-related now comes from the shared player —
  // no local <audio>, no local ad logic, no local auth listener.
  const {
    playing,
    currentSong,
    currentTime,
    duration,
    handleSongClick,
    profileOpen,
    setProfileOpen,
    setExpandHandler,
  } = usePlayer();

  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch Charts
  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        const { data: chartsData, error } = await supabase
          .from("charts")
          .select(`*, chart_songs (*)`)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const allSongs = (chartsData || []).flatMap((c) => c.chart_songs || []);
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

        const patchedCharts = (chartsData || []).map((chart) => ({
          ...chart,
          chart_songs: (chart.chart_songs || []).map((cs) => {
            const rel = cs.release_id ? releaseMap[cs.release_id] || {} : {};
            return {
              ...cs,
              img: cs.cover_url || "https://via.placeholder.com/300",
              audioUrl: cs.audio_url,
              playCount: rel.play_count || 0,
              lyrics: rel.lyrics || "",
            };
          }),
        }));

        setCharts(patchedCharts);
      } catch (err) {
        console.error("Error fetching charts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  // Register this page's "expand" behavior with the shared player so the
  // sticky player's Maximize2 button opens THIS page's chart-profile panel.
  const handlePlayerExpandToggle = useCallback(() => {
    if (!currentSong) return;
    const foundChart = charts.find((c) =>
      c.chart_songs.some((s) => s.id === currentSong.id),
    );
    if (foundChart) {
      if (profileOpen && profileChart?.id === foundChart.id) {
        setProfileOpen(false);
      } else {
        setProfileChart(foundChart);
        setProfileSongs(foundChart.chart_songs);
        setProfileOpen(true);
        setIsAllLiked(
          foundChart.chart_songs.every((s) => likedSongs.has(s.id)),
        );
      }
    }
  }, [
    charts,
    currentSong,
    profileOpen,
    profileChart,
    likedSongs,
    setProfileOpen,
  ]);

  useEffect(() => {
    setExpandHandler(() => handlePlayerExpandToggle);
    return () => setExpandHandler(null);
  }, [setExpandHandler, handlePlayerExpandToggle]);

  const filteredCharts = charts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    );
  });

  const uniqueFilteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const allSongs = charts.flatMap((c) => c.chart_songs);
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
  }, [charts, searchQuery]);

  // Fetch Durations
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

  const toggleLikeSong = (songId) => {
    setLikedSongs((prev) => {
      const n = new Set(prev);
      if (n.has(songId)) n.delete(songId);
      else n.add(songId);
      if (profileChart)
        setIsAllLiked(
          n.size === profileChart.chart_songs.length &&
            profileChart.chart_songs.length > 0,
        );
      return n;
    });
  };

  const toggleLikeAll = () => {
    if (!profileChart) return;
    if (isAllLiked) {
      setLikedSongs(new Set());
      setIsAllLiked(false);
    } else {
      setLikedSongs(new Set(profileChart.chart_songs.map((s) => s.id)));
      setIsAllLiked(true);
    }
  };

  const handleShareChart = () => {
    if (navigator.share)
      navigator.share({ title: profileChart.title, url: window.location.href });
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

  const handleChartPlay = useCallback(
    (chart) => {
      if (!chart.chart_songs || chart.chart_songs.length === 0) return;
      handleSongClick(0, chart.chart_songs[0], chart.chart_songs);
    },
    [handleSongClick],
  );

  const handleOpenChartProfile = useCallback(
    (chart) => {
      if (profileOpen && profileChart?.id === chart.id) {
        setProfileOpen(false);
        return;
      }
      setProfileChart(chart);
      setProfileSongs(chart.chart_songs || []);
      setProfileOpen(true);
      setIsAllLiked(
        chart.chart_songs.length > 0 &&
          chart.chart_songs.every((s) => likedSongs.has(s.id)),
      );
    },
    [profileOpen, profileChart, likedSongs, setProfileOpen],
  );

  const totalListeners = profileChart
    ? profileChart.chart_songs.reduce((sum, s) => sum + (s.playCount || 0), 0)
    : 0;
  const allArtists = profileChart
    ? [
        ...new Set(
          profileChart.chart_songs.flatMap((s) =>
            parseArtists(s.featuring_artists).concat(s.artist),
          ),
        ),
      ]
    : [];

  const SongRow = ({
    song,
    index,
    list,
    skipAnimation = false,
    showLike = false,
    onLike,
    isLiked,
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
                if (onLike) onLike(song.id);
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
          onClick={() => handleSongClick(index, song, list)}
          className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
        >
          {rowContent}
        </tr>
      );
    }

    return (
      <motion.tr
        onClick={() => handleSongClick(index, song, list)}
        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isActive ? "bg-blue-50" : ""}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
      >
        {rowContent}
      </motion.tr>
    );
  };

  return (
    <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

      {/* ── PROFILE PANEL ── */}
      <AnimatePresence>
        {profileOpen && profileChart && (
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
                <span className="font-medium text-sm">Back to Top Charts</span>
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                    <img
                      src={profileChart.image_url}
                      alt={profileChart.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center text-center md:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <Disc3 size={14} className="text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                      {profileChart.type}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 text-slate-900">
                    {profileChart.title}
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
                      {profileChart.chart_songs.length} Songs
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Headphones size={14} className="text-blue-500" />{" "}
                      {formatCount(totalListeners)} Listeners
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500" />{" "}
                      {profileChart.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <button
                      onClick={() =>
                        handleSongClick(
                          0,
                          profileChart.chart_songs[0],
                          profileChart.chart_songs,
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
                              onClick={handleShareChart}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Share2 size={16} /> Share Chart
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

              {/* Song Table with Like column, no blink */}
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
                          isLiked={likedSongs.has(song.id)}
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
              {searchQuery.trim() ? "Search" : "Top Music"}{" "}
              <span className="text-blue-600">
                {searchQuery.trim() ? "Results" : "Charts"}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery.trim()
                ? `Showing results for "${searchQuery}"`
                : "Curated hits from around the world."}
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
            {filteredCharts.length === 0 && uniqueFilteredSongs.length === 0 ? (
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
                {filteredCharts.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Disc3 size={18} className="text-blue-600" /> Charts (
                      {filteredCharts.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredCharts.map((chart) => (
                        <motion.div
                          key={chart.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleChartPlay(chart)}
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
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                              {chart.type}
                            </p>
                            <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                              {chart.title}
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
            {charts.map((chart) => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleChartPlay(chart)}
                className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-slate-200"
              >
                <img
                  src={chart.image_url || "https://via.placeholder.com/400x200"}
                  alt={chart.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 w-full p-5 text-white z-10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                    {chart.type}
                  </p>
                  <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">
                    {chart.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Music2 size={10} /> {chart.chart_songs?.length || 0}{" "}
                      Songs
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {/* Sticky player is rendered globally by <PlayerProvider> — nothing
          to render here anymore. */}
    </div>
  );
};

export default TopChart;
