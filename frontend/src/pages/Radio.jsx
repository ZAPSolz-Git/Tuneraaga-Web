import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Search,
  Loader2,
  Headphones,
  Shuffle,
  Heart,
  SkipForward,
  SkipBack,
  Globe,
  Radio as RadioIcon,
  ArrowLeft,
  Music,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAudioPlayer, parseArtists } from "../hooks/useAudioPlayer";
import StickyPlayer from "../components/StickyPlayer";

const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// ─── LIVE STREAM PLAYER (Emerald - No Seekbar) ───
const LivePlayer = ({
  station,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onClose,
  isLiked,
  onToggleLike,
  volume,
  onVolumeChange,
  isMuted,
  toggleMute,
}) => {
  if (!station) return null;
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-full overflow-hidden shadow-lg border-2 border-emerald-500/50 flex-shrink-0">
            <img
              src={station.image_url || "https://via.placeholder.com/50"}
              alt=""
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="flex items-end gap-[2px] h-3.5">
                  {[
                    { from: "40%", to: "100%", delay: 0 },
                    { from: "100%", to: "40%", delay: 0.12 },
                    { from: "60%", to: "100%", delay: 0.25 },
                  ].map((bar, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [bar.from, bar.to, bar.from] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5,
                        delay: bar.delay,
                      }}
                      className="w-[3px] bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-sm md:text-base leading-tight">
              {station.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {isPlaying ? "Live" : "Paused"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5 flex-1 justify-center">
          <button
            onClick={onPrev}
            className="text-gray-400 hover:text-white transition-colors hover:scale-110"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={() => onPlayPause()}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-110 transition-all duration-300 bg-emerald-500 text-white"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 md:w-6 md:h-6 fill-white" />
            ) : (
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-white ml-0.5" />
            )}
          </button>
          <button
            onClick={onNext}
            className="text-gray-400 hover:text-white transition-colors hover:scale-110"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
          <div className="flex items-center gap-2 w-full justify-end">
            <button
              onClick={onToggleLike}
              className={`transition-all hover:scale-110 ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors hover:rotate-90 transform duration-300"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-emerald-500 transition-colors hover:scale-110"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={15} />
              ) : (
                <Volume2 size={15} />
              )}
            </button>
            <div className="relative h-1.5 bg-gray-700 rounded-full cursor-pointer w-24">
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
                className="absolute top-0 left-0 h-full rounded-full bg-emerald-500"
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
const Radio = () => {
  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [stationSongs, setStationSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [noSongsError, setNoSongsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("All");
  const [likedStations, setLikedStations] = useState(new Set());

  // ─── GLOBAL MUSIC PLAYER (Gray Player with Seekbar) ───
  const player = useAudioPlayer();

  // ─── LIVE STREAM STATE ───
  const [liveStation, setLiveStation] = useState(null);
  const [livePlaying, setLivePlaying] = useState(false);
  const liveAudioRef = useRef(null);
  const liveStationRef = useRef(null);

  useEffect(() => {
    liveStationRef.current = liveStation;
  }, [liveStation]);

  // Fetch Stations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("radio_stations")
          .select("*")
          .eq("is_live", true)
          .order("total_listeners", { ascending: false });
        if (error) throw error;
        setStations(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch songs for a station
  const fetchStationSongs = async (stationId) => {
    setLoadingSongs(true);
    setNoSongsError(false);
    try {
      const { data: rsData } = await supabase
        .from("radio_songs")
        .select("song_id")
        .eq("radio_id", stationId);
      if (!rsData || rsData.length === 0) {
        setStationSongs([]);
        return;
      }
      const songIds = rsData.map((r) => r.song_id).filter(Boolean);
      const { data: songs } = await supabase
        .from("releases")
        .select(
          "id, title, primary_artist, featuring_artists, movie_name, album_name, cover_url, audio_url",
        )
        .in("id", songIds);
      setStationSongs(
        (songs || []).map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.primary_artist,
          featuringArtists: s.featuring_artists || "",
          movieName: s.movie_name || "",
          albumName: s.album_name || "",
          img: s.cover_url || "https://via.placeholder.com/300",
          audioUrl: s.audio_url,
        })),
      );
    } catch (err) {
      console.error(err);
      setStationSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  };

  const availableLanguages = useMemo(() => {
    const langs = new Set(stations.map((s) => s.language).filter(Boolean));
    return ["All", ...Array.from(langs)];
  }, [stations]);

  const filteredStations = useMemo(() => {
    let result = stations;
    if (selectedLang !== "All")
      result = result.filter((s) => s.language === selectedLang);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.genre || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [stations, selectedLang, searchQuery]);

  const incrementListener = useCallback(async (station) => {
    if (!station) return;
    try {
      const { data: sData } = await supabase
        .from("radio_stations")
        .select("total_listeners")
        .eq("id", station.id)
        .single();
      const count = sData?.total_listeners || 0;
      await supabase
        .from("radio_stations")
        .update({ total_listeners: count + 1 })
        .eq("id", station.id);
      setStations((prev) =>
        prev.map((s) =>
          s.id === station.id
            ? { ...s, total_listeners: (s.total_listeners || 0) + 1 }
            : s,
        ),
      );
      setActiveStation((prev) =>
        prev && prev.id === station.id
          ? { ...prev, total_listers: (prev.total_listers || 0) + 1 }
          : prev,
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ─── PLAY LIVE STREAM ───
  const playLive = useCallback(
    (station) => {
      if (!station?.stream_url) return;
      const audio = liveAudioRef.current;
      if (!audio) return;
      const isNew =
        !liveStationRef.current || liveStationRef.current.id !== station.id;
      if (isNew) {
        player.handleClosePlayer(); // Close song player if open
        setLiveStation(station);
        liveStationRef.current = station;
        audio.src = station.stream_url;
        audio.load();
        incrementListener(station);
      }
      audio
        .play()
        .then(() => setLivePlaying(true))
        .catch(() => setLivePlaying(false));
    },
    [incrementListener, player],
  );

  const handleLivePlayPause = useCallback(() => {
    const audio = liveAudioRef.current;
    if (!audio || !liveStationRef.current) return;
    if (!audio.paused) {
      audio.pause();
      setLivePlaying(false);
    } else playLive(liveStationRef.current);
  }, [playLive]);

  const handleLiveNext = useCallback(() => {
    if (filteredStations.length === 0) return;
    const idx = filteredStations.findIndex(
      (s) => s.id === liveStationRef.current?.id,
    );
    playLive(filteredStations[(idx + 1) % filteredStations.length]);
  }, [filteredStations, playLive]);

  const handleLivePrev = useCallback(() => {
    if (filteredStations.length === 0) return;
    const idx = filteredStations.findIndex(
      (s) => s.id === liveStationRef.current?.id,
    );
    playLive(
      filteredStations[
        (idx - 1 + filteredStations.length) % filteredStations.length
      ],
    );
  }, [filteredStations, playLive]);

  const handleLiveClose = useCallback(() => {
    setLivePlaying(false);
    setLiveStation(null);
    liveStationRef.current = null;
    if (liveAudioRef.current) {
      liveAudioRef.current.pause();
      liveAudioRef.current.removeAttribute("src");
      liveAudioRef.current.load();
    }
  }, []);

  const handleSurpriseMe = useCallback(() => {
    if (filteredStations.length === 0) return;
    playLive(
      filteredStations[Math.floor(Math.random() * filteredStations.length)],
    );
  }, [filteredStations, playLive]);

  const handleStationClick = (station) => {
    setActiveStation(station);
    fetchStationSongs(station.id);
  };

  const toggleLikeStation = useCallback((id) => {
    setLikedStations((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  // ─── ACTIVE STATION DETAIL VIEW ───
  if (activeStation) {
    return (
      <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
        <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-emerald-100/60 to-transparent pointer-events-none" />

        <div className="relative px-4 md:px-8 pt-6 max-w-5xl mx-auto">
          <button
            onClick={() => {
              setActiveStation(null);
              handleLiveClose();
            }}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group mb-8"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-medium text-sm">Back to Radio Stations</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="relative group flex-shrink-0 mx-auto md:mx-0">
              <div className="w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src={activeStation.image_url}
                  alt={activeStation.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center text-center md:text-left flex-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
                {activeStation.genre}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                {activeStation.name}
              </h1>
              <p className="text-sm text-slate-500 mb-4">
                {activeStation.description || "Curated radio experience"}
              </p>
              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start text-sm text-slate-600 mb-6">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Globe size={14} className="text-emerald-500" />
                  {activeStation.language}
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Headphones size={14} className="text-emerald-500" />
                  {formatCount(activeStation.total_listeners || 0)} Listens
                </span>
              </div>

              <div className="flex items-center gap-3 justify-center md:justify-start">
                {activeStation.stream_url && (
                  <button
                    onClick={() => playLive(activeStation)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                  >
                    <Play size={18} fill="white" /> Play Live
                  </button>
                )}
                <button
                  onClick={() => toggleLikeStation(activeStation.id)}
                  className={`p-3.5 rounded-full border-2 transition-all hover:scale-110 ${
                    likedStations.has(activeStation.id)
                      ? "text-red-500 border-red-500 bg-red-50"
                      : "text-slate-500 border-slate-300 hover:border-red-400 hover:text-red-400 bg-white"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={
                      likedStations.has(activeStation.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ─── SONGS TABLE (Uses Global Sticky Player) ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <Music size={18} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Songs in this Radio
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                {stationSongs.length} Tracks
              </span>
            </div>

            {loadingSongs ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={30} />
              </div>
            ) : noSongsError ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No songs added to this radio station.
              </div>
            ) : (
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
                        Artist
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {stationSongs.map((song, index) => {
                      const isActive = player.currentSong?.id === song.id;
                      const featuringList = parseArtists(song.featuringArtists);
                      return (
                        <tr
                          key={song.id}
                          onClick={() =>
                            player.handleSongClick(index, song, stationSongs)
                          }
                          className={`hover:bg-slate-50 transition-colors cursor-pointer group ${
                            isActive ? "bg-emerald-50" : ""
                          }`}
                        >
                          <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                            <div className="w-8 h-8 flex items-center justify-center">
                              {isActive && player.playing ? (
                                <div className="flex items-end gap-0.5 h-4">
                                  <motion.div
                                    animate={{ height: ["40%", "100%", "40%"] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 0.6,
                                    }}
                                    className="w-1 bg-emerald-600 rounded-full"
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
                                    className="w-1 bg-emerald-600 rounded-full"
                                  />
                                  <motion.div
                                    animate={{ height: ["60%", "100%", "60%"] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 0.6,
                                      delay: 0.3,
                                    }}
                                    className="w-1 bg-emerald-600 rounded-full"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span
                                    className={`text-sm font-medium group-hover:hidden ${
                                      isActive
                                        ? "text-emerald-600"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                  <Play
                                    size={16}
                                    className="text-emerald-600 hidden group-hover:block fill-emerald-600"
                                  />
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={song.img}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-100 flex-shrink-0"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/40";
                                }}
                              />
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-semibold truncate transition-colors ${
                                    isActive
                                      ? "text-emerald-600"
                                      : "text-slate-900 group-hover:text-emerald-600"
                                  }`}
                                >
                                  {song.title}
                                </p>
                                {featuringList.length > 0 && (
                                  <p className="text-xs text-teal-500 truncate">
                                    ft. {featuringList.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm text-slate-600 hidden md:table-cell truncate">
                            {song.artist}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── GLOBAL STICKY PLAYER (when song is playing) ─── */}
        <AnimatePresence>
          {player.currentSong && (
            <StickyPlayer
              song={player.currentSong}
              isPlaying={player.playing}
              onPlayPause={() => player.handlePlayPause(player.currentSong)}
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
            />
          )}
        </AnimatePresence>

        {/* ─── LIVE PLAYER (when live stream is playing) ─── */}
        <AnimatePresence>
          {liveStation && !player.currentSong && (
            <LivePlayer
              station={liveStation}
              isPlaying={livePlaying}
              onPlayPause={handleLivePlayPause}
              onNext={handleLiveNext}
              onPrev={handleLivePrev}
              onClose={handleLiveClose}
              volume={player.volume}
              onVolumeChange={player.handleVolumeChange}
              isMuted={player.isMuted}
              toggleMute={player.toggleMute}
              isLiked={likedStations.has(liveStation.id)}
              onToggleLike={() => toggleLikeStation(liveStation.id)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── STATIONS GRID VIEW ───
  return (
    <div className="w-full min-h-screen text-slate-900 pb-28 relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-emerald-100/60 to-transparent pointer-events-none" />

      <div className="relative px-4 md:px-8 pt-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              <span className="text-emerald-600">Radio</span> Stations
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Tune into curated radio from across India.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-emerald-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stations..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={handleSurpriseMe}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Shuffle size={16} /> Surprise Me
            </button>
          </div>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                selectedLang === lang
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {lang === "All" ? (
                <span className="flex items-center gap-1.5">
                  <Globe size={14} /> All Languages
                </span>
              ) : (
                lang
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <RadioIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              No Stations Found
            </h3>
            <p className="text-slate-500 text-sm">
              No radio stations available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6 pb-10">
            {filteredStations.map((station, index) => {
              const isLiked = likedStations.has(station.id);
              const isActive = liveStation?.id === station.id;
              const isCurrentlyPlaying = isActive && livePlaying;

              return (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  onClick={() => handleStationClick(station)}
                  className="group flex flex-col items-center text-center cursor-pointer"
                >
                  <div
                    className={`relative w-full aspect-square rounded-full overflow-hidden shadow-lg transition-all duration-500 border-4 ${
                      isCurrentlyPlaying
                        ? "border-emerald-500 shadow-emerald-500/30 scale-105"
                        : isActive
                          ? "border-emerald-300"
                          : "border-white shadow-slate-300/50 group-hover:shadow-xl group-hover:scale-105"
                    }`}
                  >
                    <img
                      src={
                        station.image_url || "https://via.placeholder.com/200"
                      }
                      alt={station.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200";
                      }}
                    />

                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity duration-300 ${
                        isCurrentlyPlaying
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <div className="flex items-end gap-[2px] h-5">
                          {[
                            { from: "40%", to: "100%", delay: 0 },
                            { from: "100%", to: "40%", delay: 0.12 },
                            { from: "60%", to: "100%", delay: 0.25 },
                          ].map((bar, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [bar.from, bar.to, bar.from] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                delay: bar.delay,
                              }}
                              className="w-[3px] bg-emerald-400 rounded-full"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                          <Play className="w-6 h-6 text-emerald-600 fill-emerald-600 ml-0.5" />
                        </div>
                      )}
                    </div>

                    {isCurrentlyPlaying && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-emerald-500 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Live
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeStation(station.id);
                      }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${
                        isLiked
                          ? "text-red-500"
                          : "text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Heart
                        size={16}
                        fill={isLiked ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="mt-3 w-full px-1">
                    <h3
                      className={`text-sm font-bold leading-tight line-clamp-2 transition-colors ${
                        isCurrentlyPlaying
                          ? "text-emerald-600"
                          : "text-slate-900 group-hover:text-emerald-600"
                      }`}
                    >
                      {station.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                        {station.language || "Radio"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                        <Headphones size={9} />
                        {formatCount(station.total_listeners || 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Global Sticky Player (Song) */}
        <AnimatePresence>
          {player.currentSong && (
            <StickyPlayer
              song={player.currentSong}
              isPlaying={player.playing}
              onPlayPause={() => player.handlePlayPause(player.currentSong)}
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
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Radio;
