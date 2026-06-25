import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Shuffle,
  Film,
  Disc3,
} from "lucide-react";

const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val.includes(":") ? val : "0:00";
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
  return String(val)
    .split(",")
    .map((a) => a.trim())
    .filter((s) => s.length > 0);
};

// ─── CONTEXT ───
const PlayerContext = createContext();

export const useGlobalPlayer = () => useContext(PlayerContext);

// ─── STICKY PLAYER UI ───
const StickyPlayer = ({
  mode,
  song,
  station,
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
  const isActive = mode === "song" && song;
  const isLiveActive = mode === "live" && station;
  if (!isActive && !isLiveActive) return null;

  const currentData = isActive ? song : station;
  const isLive = mode === "live";

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        {/* Left: Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
            <img
              src={
                song?.img ||
                station?.image_url ||
                "https://via.placeholder.com/50"
              }
              alt="Art"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            {isLive && isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex items-end gap-0.5 h-4">
                  <motion.div
                    animate={{ height: ["40%", "100%", "40%"] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                  <motion.div
                    animate={{ height: ["100%", "40%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: 0.12,
                    }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                  <motion.div
                    animate={{ height: ["60%", "100%", "60%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: 0.25,
                    }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <h4 className="font-bold text-white truncate text-base leading-tight">
              {song?.title || station?.name}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {song?.artist || (isLive ? "Live Stream" : "")}
            </p>
            {isActive &&
              song?.featuringArtists &&
              parseArtists(song.featuringArtists).length > 0 && (
                <p className="text-xs text-gray-500 truncate">
                  ft. {parseArtists(song.featuringArtists).join(", ")}
                </p>
              )}
            {isActive && song?.movieName && (
              <p className="text-[10px] text-purple-400 truncate flex items-center gap-1 mt-0.5">
                <Film size={9} /> {song.movieName}
              </p>
            )}
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={onPlayPause}
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

          {/* Seekbar (Hidden in Live Mode) */}
          {!isLive && (
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
                    width: duration
                      ? `${(currentTime / duration) * 100}%`
                      : "0%",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: duration
                      ? `${(currentTime / duration) * 100}%`
                      : "0%",
                    marginLeft: "-6px",
                  }}
                />
              </div>
              <span className="w-10 font-mono">{formatDuration(duration)}</span>
            </div>
          )}
        </div>

        {/* Right: Volume & Close */}
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

// ─── PROVIDER COMPONENT ───
export const PlayerProvider = ({ children }) => {
  const [state, setState] = useState({
    mode: null, // 'song' | 'live' | null
    isPlaying: false,
    currentSong: null,
    currentLiveStation: null,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isShuffle: false,
    currentList: [],
    currentIndex: null,
    liveList: [], // Stations list for next/prev in live mode
  });

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const currentLiveRef = useRef(null);
  const liveListRef = useRef([]);

  // Sync State to Refs
  useEffect(() => {
    currentSongRef.current = state.currentSong;
  }, [state.currentSong]);
  useEffect(() => {
    currentListRef.current = state.currentList;
  }, [state.currentList]);
  useEffect(() => {
    currentIndexRef.current = state.currentIndex;
  }, [state.currentIndex]);
  useEffect(() => {
    isShuffleRef.current = state.isShuffle;
  }, [state.isShuffle]);
  useEffect(() => {
    currentLiveRef.current = state.currentLiveStation;
  }, [state.currentLiveStation]);
  useEffect(() => {
    liveListRef.current = state.liveList;
  }, [state.liveList]);

  // Audio Element Setup
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () =>
      setState((p) => ({ ...p, currentTime: audio.currentTime }));
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setState((p) => ({ ...p, duration: audio.duration }));
      }
    };
    const onPlay = () => setState((p) => ({ ...p, isPlaying: true }));
    const onPause = () => setState((p) => ({ ...p, isPlaying: false }));
    const onError = () => setState((p) => ({ ...p, isPlaying: false }));
    const onEnded = () => handleNext();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  // Sync Volume/Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
      audioRef.current.muted = state.isMuted;
    }
  }, [state.volume, state.isMuted]);

  // ─── CORE AUDIO FUNCTIONS ───
  const playSong = useCallback((song, list, index) => {
    if (!song?.audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const isNew = currentSongRef.current?.id !== song.id;
    if (isNew) {
      setState((p) => ({
        ...p,
        mode: "song",
        currentSong: song,
        currentLiveStation: null,
        currentTime: 0,
        duration: 0,
        currentList: list || [],
        currentIndex: index ?? 0,
      }));
      audio.src = song.audioUrl;
      audio.load();
    }

    let hasStarted = false;
    const tryPlay = () => {
      if (hasStarted) return;
      audio
        .play()
        .then(() => {
          hasStarted = true;
          setState((p) => ({ ...p, isPlaying: true }));
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
  }, []);

  const playLive = useCallback((station, stationList) => {
    if (!station?.stream_url) return;
    const audio = audioRef.current;
    if (!audio) return;

    const isNew = currentLiveRef.current?.id !== station.id;
    if (isNew) {
      setState((p) => ({
        ...p,
        mode: "live",
        currentLiveStation: station,
        currentSong: null,
        liveList: stationList || [],
        currentTime: 0,
        duration: 0,
      }));
      audio.src = station.stream_url;
      audio.load();
    }
    audio
      .play()
      .then(() => setState((p) => ({ ...p, isPlaying: true })))
      .catch(() => setState((p) => ({ ...p, isPlaying: false })));
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused)
      audio
        .play()
        .then(() => setState((p) => ({ ...p, isPlaying: true })))
        .catch(() => {});
    else {
      audio.pause();
      setState((p) => ({ ...p, isPlaying: false }));
    }
  }, []);

  const handleNext = useCallback(() => {
    if (
      state.mode === "song" &&
      currentListRef.current.length > 0 &&
      currentIndexRef.current !== null
    ) {
      let nextIndex;
      if (isShuffleRef.current) {
        do {
          nextIndex = Math.floor(Math.random() * currentListRef.current.length);
        } while (
          currentListRef.current.length > 1 &&
          nextIndex === currentIndexRef.current
        );
      } else {
        nextIndex =
          (currentIndexRef.current + 1) % currentListRef.current.length;
      }
      setState((p) => ({ ...p, currentIndex: nextIndex }));
      playSong(
        currentListRef.current[nextIndex],
        currentListRef.current,
        nextIndex,
      );
    } else if (state.mode === "live" && liveListRef.current.length > 0) {
      const idx = liveListRef.current.findIndex(
        (s) => s.id === currentLiveRef.current?.id,
      );
      playLive(
        liveListRef.current[(idx + 1) % liveListRef.current.length],
        liveListRef.current,
      );
    }
  }, [state.mode, playSong, playLive]);

  const handlePrev = useCallback(() => {
    if (
      state.mode === "song" &&
      currentListRef.current.length > 0 &&
      currentIndexRef.current !== null
    ) {
      const prevIndex =
        (currentIndexRef.current - 1 + currentListRef.current.length) %
        currentListRef.current.length;
      setState((p) => ({ ...p, currentIndex: prevIndex }));
      playSong(
        currentListRef.current[prevIndex],
        currentListRef.current,
        prevIndex,
      );
    } else if (state.mode === "live" && liveListRef.current.length > 0) {
      const idx = liveListRef.current.findIndex(
        (s) => s.id === currentLiveRef.current?.id,
      );
      playLive(
        liveListRef.current[
          (idx - 1 + liveListRef.current.length) % liveListRef.current.length
        ],
        liveListRef.current,
      );
    }
  }, [state.mode, playSong, playLive]);

  const handleSeek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((p) => ({ ...p, currentTime: time }));
    }
  }, []);

  const handleClosePlayer = useCallback(() => {
    setState({
      mode: null,
      isPlaying: false,
      currentSong: null,
      currentLiveStation: null,
      currentTime: 0,
      duration: 0,
      currentList: [],
      currentIndex: null,
      liveList: [],
    });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
  }, []);

  const toggleMute = useCallback(
    () => setState((p) => ({ ...p, isMuted: !p.isMuted })),
    [],
  );
  const handleVolumeChange = useCallback(
    (v) => setState((p) => ({ ...p, volume: v, isMuted: v === 0 })),
    [],
  );
  const onToggleShuffle = useCallback(
    () => setState((p) => ({ ...p, isShuffle: !p.isShuffle })),
    [],
  );

  const contextValue = {
    ...state,
    playSong,
    playLive,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    handleClosePlayer,
    toggleMute,
    handleVolumeChange,
    onToggleShuffle,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {state.mode && (
          <StickyPlayer
            mode={state.mode}
            song={state.currentSong}
            station={state.currentLiveStation}
            isPlaying={state.isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onPrev={handlePrev}
            onNext={handleNext}
            currentTime={state.currentTime}
            duration={state.duration}
            volume={state.volume}
            onVolumeChange={handleVolumeChange}
            isMuted={state.isMuted}
            toggleMute={toggleMute}
            isShuffle={state.isShuffle}
            onToggleShuffle={onToggleShuffle}
            onClose={handleClosePlayer}
          />
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
};
