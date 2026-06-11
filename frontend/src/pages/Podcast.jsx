/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Mic,
  Loader2,
  Search,
  ArrowLeft,
  ListMusic,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Headphones,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// ─── UTILITIES ───
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

// ─── STICKY PLAYER COMPONENT ───
const StickyPlayer = ({
  episode,
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
  if (!episode) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        {/* LEFT: Episode Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img
              src={episode.coverArt || "https://via.placeholder.com/50"}
              alt="Art"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">
              {episode.title}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-1">
              {episode.host}
            </p>
          </div>
        </div>

        {/* CENTER: Controls */}
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPlayPause(episode)}
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
              className="text-gray-400 hover:text-white transition-colors hover:scale-110"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleShuffle}
              className={`transition-all hover:scale-110 ${isShuffle ? "text-green-500" : "text-gray-400 hover:text-white"}`}
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
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
            title="Close Player"
          >
            <X size={20} />
          </button>
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
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
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

// ─── FILTER PILL ───
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 select-none ${active ? "text-white shadow-md transform scale-105" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"}`}
    style={
      active ? { background: `linear-gradient(135deg, #8b5cf6, #7c3aed)` } : {}
    }
  >
    {label}
  </button>
);

// ─── MAIN COMPONENT ───
const Podcast = () => {
  const [view, setView] = useState("grid");
  const [podcasts, setPodcasts] = useState([]);
  const [activePodcast, setActivePodcast] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Player states
  const [playing, setPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const audioRef = useRef(null);

  // Fetch podcasts
  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*, podcast_episodes(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched podcasts:", data);
      setPodcasts(data || []);
    } catch (err) {
      console.error("Error fetching podcasts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Audio setup
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
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

  // Volume controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Auto-play next episode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [activePodcast, currentEpisode, isShuffle]);

  // Play episode
  const playEpisode = (episode, podcast) => {
    if (!episode) return;
    const audio = audioRef.current;

    if (currentEpisode?.id !== episode.id) {
      setCurrentEpisode(episode);
      audio.src = episode.audio_url;
      audio.load();
    }

    audio.play().catch((e) => console.error(e));
  };

  const handlePlayPause = (episode, podcast) => {
    const audio = audioRef.current;
    if (currentEpisode && currentEpisode.id === episode.id && playing) {
      audio.pause();
      setPlaying(false);
    } else {
      playEpisode(episode, podcast);
    }
  };

  const handleNext = () => {
    if (!activePodcast || !currentEpisode) return;
    const episodes = activePodcast.podcast_episodes;
    if (!episodes || episodes.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      const currentIndex = episodes.findIndex(
        (e) => e.id === currentEpisode.id,
      );
      do {
        nextIndex = Math.floor(Math.random() * episodes.length);
      } while (episodes.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex =
        (episodes.findIndex((e) => e.id === currentEpisode.id) + 1) %
        episodes.length;
    }
    playEpisode(episodes[nextIndex], activePodcast);
    setCurrentEpisodeIndex(nextIndex);
  };

  const handlePrev = () => {
    if (!activePodcast || !currentEpisode) return;
    const episodes = activePodcast.podcast_episodes;
    if (!episodes || episodes.length === 0) return;
    const prevIndex =
      (episodes.findIndex((e) => e.id === currentEpisode.id) -
        1 +
        episodes.length) %
      episodes.length;
    playEpisode(episodes[prevIndex], activePodcast);
    setCurrentEpisodeIndex(prevIndex);
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleClosePlayer = () => {
    setPlaying(false);
    setCurrentEpisode(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handlePodcastClick = (podcast) => {
    setActivePodcast(podcast);
    setView("detail");
    if (podcast.podcast_episodes && podcast.podcast_episodes.length > 0) {
      playEpisode(podcast.podcast_episodes[0], podcast);
      setCurrentEpisodeIndex(0);
    }
  };

  const handleBack = () => {
    setActivePodcast(null);
    setView("grid");
  };

  // Get unique types for filters
  const getFilterTypes = () => {
    const types = [
      "All",
      ...new Set(podcasts.map((pod) => pod.type).filter(Boolean)),
    ];
    return types;
  };

  // Filter podcasts
  const filteredPodcasts = podcasts.filter((podcast) => {
    if (activeFilter !== "All" && podcast.type !== activeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = (podcast.title || "").toLowerCase();
      const host = (podcast.host || "").toLowerCase();
      if (!title.includes(query) && !host.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen text-slate-900 pt-6 pb-20 px-4 md:px-8 relative overflow-hidden bg-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
            style={{ color: "#0f172a" }}
          >
            <span style={{ color: "#7c3aed" }}>Podcasts</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Real conversations with real people. {podcasts.length} shows
            available
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search podcast..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {getFilterTypes().map((filter) => (
          <FilterPill
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          />
        ))}
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
          ) : filteredPodcasts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <Mic className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Podcasts Found
              </h3>
              <p className="text-slate-500">
                Check back later for new episodes!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredPodcasts.map((podcast, index) => (
                <motion.div
                  key={podcast.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => handlePodcastClick(podcast)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 shadow-sm border border-slate-200 group-hover:border-purple-400 group-hover:shadow-xl transition-all duration-300">
                    <img
                      src={
                        podcast.image_url ||
                        "https://via.placeholder.com/300x300?text=Podcast"
                      }
                      alt={podcast.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x300?text=Podcast";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
                        style={{
                          background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                        }}
                      >
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </motion.div>
                    </div>
                    <div
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200"
                      style={{ color: "#7c3aed" }}
                    >
                      {podcast.total_episodes ||
                        podcast.podcast_episodes?.length ||
                        0}{" "}
                      EPS
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className="font-bold text-base truncate group-hover:text-purple-600 transition-colors">
                      {podcast.title}
                    </h3>
                    <p className="text-slate-500 text-sm truncate mt-1">
                      {podcast.host || "Unknown Host"}
                    </p>
                    {podcast.type && (
                      <span className="text-xs text-purple-500 mt-1 inline-block">
                        {podcast.type}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL VIEW - Episodes List */}
      <AnimatePresence>
        {view === "detail" && activePodcast && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <img
                src={
                  activePodcast.image_url || "https://via.placeholder.com/80"
                }
                alt={activePodcast.title}
                className="w-20 h-20 rounded-xl shadow-md object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold" style={{ color: "#0f172a" }}>
                  {activePodcast.title}
                </h1>
                <p className="text-slate-500">
                  Hosted by {activePodcast.host} •{" "}
                  {activePodcast.podcast_episodes?.length || 0} Episodes
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {activePodcast.podcast_episodes &&
              activePodcast.podcast_episodes.length > 0 ? (
                activePodcast.podcast_episodes.map((episode, index) => {
                  const isActive = currentEpisode?.id === episode.id;
                  return (
                    <div
                      key={episode.id}
                      onClick={() => handlePlayPause(episode, activePodcast)}
                      className={`flex items-center justify-between p-4 border-b border-slate-100 transition-colors group cursor-pointer ${isActive ? "bg-purple-50" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-slate-400 font-bold w-8 text-sm">
                          #{episode.episode_number || index + 1}
                        </span>
                        <button
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-md"
                          style={{
                            background:
                              isActive && playing
                                ? `linear-gradient(135deg, #8b5cf6, #7c3aed)`
                                : "#e2e8f0",
                          }}
                        >
                          {isActive && playing ? (
                            <Pause size={14} className="text-white" />
                          ) : (
                            <Play
                              size={14}
                              className={
                                isActive ? "text-white" : "text-purple-600"
                              }
                            />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4
                            className={`font-bold text-sm ${isActive ? "text-purple-600" : "text-slate-900"}`}
                          >
                            {episode.episode_title}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <Clock size={12} /> {episode.duration || "—"}
                          </p>
                        </div>
                      </div>
                      {isActive && playing && (
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-3 bg-purple-500 animate-[bounce_1s_infinite]"></div>
                          <div className="w-1 h-5 bg-purple-500 animate-[bounce_1.2s_infinite]"></div>
                          <div className="w-1 h-4 bg-purple-500 animate-[bounce_0.8s_infinite]"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center text-slate-400">
                  No episodes in this podcast yet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY PLAYER */}
      <AnimatePresence>
        {currentEpisode && activePodcast && (
          <StickyPlayer
            episode={{
              ...currentEpisode,
              coverArt: activePodcast.image_url,
              host: activePodcast.host,
              title: currentEpisode.episode_title,
            }}
            isPlaying={playing}
            onPlayPause={() => handlePlayPause(currentEpisode, activePodcast)}
            onSeek={handleSeek}
            onNext={handleNext}
            onPrev={handlePrev}
            currentTime={currentTime}
            duration={duration}
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

export default Podcast;
