import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Shuffle,
  Maximize2,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val;
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

export const parseArtists = (artistStr) => {
  if (!artistStr) return [];
  return String(artistStr)
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
};

const AD_FAILSAFE_MS = 45000;
const AD_SKIP_AFTER_SECONDS = 5;

const PlayerContext = createContext(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer() must be used inside <PlayerProvider>");
  }
  return ctx;
}

export function PlayerProvider({ children, proPlansRoute = "/pro-plans" }) {
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentList, setCurrentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [topBannerDismissed, setTopBannerDismissed] = useState(false);

  const [expandHandler, setExpandHandlerState] = useState(null);
  const [profileOpen, setProfileOpenState] = useState(false);
  const setExpandHandler = useCallback((fn) => {
    setExpandHandlerState(() => fn);
  }, []);

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const countedSongIds = useRef(new Set());
  const userRef = useRef(null);

  const isAdPlayingRef = useRef(false);
  const pendingSongRef = useRef(null);
  const adsListRef = useRef([]);
  const adsFetchedRef = useRef(false);
  const adFailsafeTimerRef = useRef(null);

  const playTokenRef = useRef(0);
  const loadedSongIdRef = useRef(null);

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

  // ✅ AUTH & SESSION
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
      setAuthChecked(true);
    };
    getSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
      setAuthChecked(true);
      if (session?.user) {
        setTopBannerDismissed(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAds = useCallback(async () => {
    if (adsFetchedRef.current) return adsListRef.current;
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true);
      if (!error && data) {
        adsListRef.current = data;
      } else if (error) {
        console.error("Ads fetch error:", error);
      }
    } catch (err) {
      console.error("Ads fetch error:", err);
    }
    adsFetchedRef.current = true;
    return adsListRef.current;
  }, []);

  const getRandomAd = useCallback(async () => {
    const ads = adsFetchedRef.current ? adsListRef.current : await fetchAds();
    if (!ads || ads.length === 0) return null;
    return ads[Math.floor(Math.random() * ads.length)];
  }, [fetchAds]);

  const saveToHistory = useCallback(async (releaseId) => {
    const currentUser = userRef.current;
    if (!currentUser || !releaseId) return;
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("history")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("release_id", releaseId)
        .limit(1)
        .maybeSingle();

      if (fetchErr) console.error("History lookup error:", fetchErr.message);

      if (existing) {
        const { error: updateErr } = await supabase
          .from("history")
          .update({ played_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateErr)
          console.error("History update error:", updateErr.message);
      } else {
        const { error: insertErr } = await supabase
          .from("history")
          .insert({ user_id: currentUser.id, release_id: releaseId });
        if (insertErr)
          console.error("History insert error:", insertErr.message);
      }
    } catch (error) {
      console.error("History save error:", error);
    }
  }, []);

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
      await supabase
        .from("releases")
        .update({ play_count: (current?.play_count || 0) + 1 })
        .eq("id", song.release_id);
    } catch (error) {
      console.error("Error incrementing counts:", error);
    }
  }, []);

  const clearAdFailsafe = () => {
    if (adFailsafeTimerRef.current) {
      clearTimeout(adFailsafeTimerRef.current);
      adFailsafeTimerRef.current = null;
    }
  };

  const attemptPlay = useCallback((token, onFailure) => {
    const audio = audioRef.current;
    if (!audio) return;
    let hasStarted = false;
    const tryPlay = () => {
      if (hasStarted) return;
      if (playTokenRef.current !== token) return;
      audio
        .play()
        .then(() => {
          if (playTokenRef.current !== token) {
            audio.pause();
            return;
          }
          hasStarted = true;
          setPlaying(true);
        })
        .catch((err) => {
          if (err.name !== "AbortError" && err.name !== "NotAllowedError")
            console.error("Play error:", err);
          if (playTokenRef.current === token && onFailure) onFailure();
        });
    };
    if (audio.readyState >= 2) tryPlay();
    else {
      const onCanPlay = () => {
        audio.removeEventListener("canplay", onCanPlay);
        clearTimeout(fb);
        tryPlay();
      };
      audio.addEventListener("canplay", onCanPlay, { once: true });
      const fb = setTimeout(() => {
        audio.removeEventListener("canplay", onCanPlay);
        tryPlay();
      }, 3000);
    }
  }, []);

  const loadAndPlay = useCallback(
    (url) => {
      const audio = audioRef.current;
      if (!audio) return null;
      const token = ++playTokenRef.current;
      audio.pause();
      audio.src = url;
      audio.load();
      attemptPlay(token);
      return token;
    },
    [attemptPlay],
  );

  const startActualSong = useCallback(
    (song) => {
      if (!song || !song.audioUrl) return;
      const audio = audioRef.current;
      if (!audio) return;
      const isNewSong = loadedSongIdRef.current !== song.id;

      clearAdFailsafe();
      isAdPlayingRef.current = false;
      setIsAdPlaying(false);

      setCurrentSong(song);
      currentSongRef.current = song;

      if (isNewSong) {
        setDuration(0);
        setCurrentTime(0);
        incrementSongCounts(song);
        if (song.release_id) saveToHistory(song.release_id);
        loadedSongIdRef.current = song.id;
        loadAndPlay(song.audioUrl);
      } else {
        attemptPlay(playTokenRef.current);
      }
    },
    [incrementSongCounts, saveToHistory, loadAndPlay, attemptPlay],
  );

  const finishAdAndPlayPending = useCallback(() => {
    clearAdFailsafe();
    isAdPlayingRef.current = false;
    setIsAdPlaying(false);
    const song = pendingSongRef.current;
    pendingSongRef.current = null;
    if (song) startActualSong(song);
  }, [startActualSong]);

  const playAd = useCallback(
    async (song) => {
      const audio = audioRef.current;
      if (!audio) return;

      isAdPlayingRef.current = true;
      setIsAdPlaying(true);
      pendingSongRef.current = song;
      setCurrentSong(song);
      currentSongRef.current = song;
      loadedSongIdRef.current = null;
      setDuration(0);
      setCurrentTime(0);
      const token = ++playTokenRef.current;

      const ad = await getRandomAd();

      if (playTokenRef.current !== token) return;

      if (!ad || !ad.audio_url) {
        isAdPlayingRef.current = false;
        setIsAdPlaying(false);
        startActualSong(song);
        return;
      }

      audio.pause();
      audio.src = ad.audio_url;
      audio.load();

      clearAdFailsafe();
      adFailsafeTimerRef.current = setTimeout(() => {
        if (playTokenRef.current !== token) return;
        finishAdAndPlayPending();
      }, AD_FAILSAFE_MS);

      attemptPlay(token, finishAdAndPlayPending);
    },
    [getRandomAd, startActualSong, attemptPlay, finishAdAndPlayPending],
  );

  const playSong = useCallback(
    (song) => {
      if (!song || !song.audioUrl) return;
      if (isAdPlayingRef.current) return;

      const isNewSong =
        !currentSongRef.current || currentSongRef.current.id !== song.id;

      if (!isNewSong) {
        startActualSong(song);
        return;
      }

      if (userRef.current) {
        startActualSong(song);
      } else {
        playAd(song);
      }
    },
    [startActualSong, playAd],
  );

  const handleNext = useCallback(() => {
    if (isAdPlayingRef.current) return;
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
    if (isAdPlayingRef.current) return;
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
      if (isAdPlayingRef.current) return;
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
      if (isAdPlayingRef.current) return;
      if (currentSongRef.current?.id === song.id) {
        handlePlayPause(song);
      } else {
        setCurrentList(list);
        currentListRef.current = list;
        setCurrentIndex(index);
        currentIndexRef.current = index;
        playSong(song);
      }
    },
    [handlePlayPause, playSong],
  );

  const playList = useCallback(
    (list) => {
      if (!list || list.length === 0) return;
      handleSongClick(0, list[0], list);
    },
    [handleSongClick],
  );

  const skipAd = useCallback(() => {
    if (!isAdPlayingRef.current) return;
    if (currentTime < AD_SKIP_AFTER_SECONDS) return;
    finishAdAndPlayPending();
  }, [currentTime, finishAdAndPlayPending]);

  // ✅ FIX: Keep refs in sync with latest callbacks (no re-render, no infinite loop)
  const handleNextRef = useRef(handleNext);
  const finishAdPlayAndPlayPendingRef = useRef(finishAdAndPlayPending);
  useEffect(() => {
    handleNextRef.current = handleNext;
    finishAdPlayAndPlayPendingRef.current = finishAdAndPlayPending;
  });

  // ✅ FIX: Audio setup runs ONCE — uses refs for callbacks, not direct dependencies
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      if (isAdPlayingRef.current) {
        finishAdAndPlayPendingRef.current();
      } else {
        setPlaying(false);
      }
    };
    const onEnded = () => {
      if (isAdPlayingRef.current) {
        finishAdPlayAndPlayPendingRef.current();
      } else {
        handleNextRef.current();
      }
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);
    return () => {
      clearAdFailsafe();
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
    // ✅ Empty dependency array — runs ONCE on mount, never re-runs
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleSeek = useCallback((time) => {
    if (isAdPlayingRef.current) return;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleClosePlayer = useCallback(() => {
    if (isAdPlayingRef.current) return;
    setPlaying(false);
    setCurrentSong(null);
    currentSongRef.current = null;
    loadedSongIdRef.current = null;
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
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);
  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    setIsMuted(v === 0);
  }, []);
  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);

  const canSkipAd = isAdPlaying && currentTime >= AD_SKIP_AFTER_SECONDS;
  const showTopBanner = authChecked && !user && !topBannerDismissed;

  const dismissTopBanner = useCallback(() => {
    setTopBannerDismissed(true);
  }, []);

  const value = {
    playing,
    currentSong,
    currentList,
    currentIndex,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isAdPlaying,
    canSkipAd,
    adSkipAfterSeconds: AD_SKIP_AFTER_SECONDS,
    user,
    profileOpen,
    setProfileOpen: setProfileOpenState,
    showTopBanner,
    dismissTopBanner,
    playSong,
    playList,
    handleSongClick,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    handleClosePlayer,
    toggleMute,
    handleVolumeChange,
    toggleShuffle,
    skipAd,
    setExpandHandler,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}

      <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        <AnimatePresence>
          {showTopBanner && (
            <div className="pointer-events-auto">
              <TopAdBanner
                onClose={dismissTopBanner}
                proPlansRoute={proPlansRoute}
              />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentSong && (
            <div className="pointer-events-auto">
              <StickyPlayer
                song={currentSong}
                isPlaying={playing}
                isAdPlaying={isAdPlaying}
                canSkipAd={canSkipAd}
                adSkipAfterSeconds={AD_SKIP_AFTER_SECONDS}
                onSkipAd={skipAd}
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
                onToggleShuffle={toggleShuffle}
                onClose={handleClosePlayer}
                onExpand={expandHandler || undefined}
                profileOpen={profileOpen}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </PlayerContext.Provider>
  );
}

// ─── TOP AD-FREE / FREE-TRIAL BANNER ───
const TopAdBanner = ({ onClose, proPlansRoute }) => {
  const navigate = useNavigate();
  const [trialLoading, setTrialLoading] = useState(false);

  const handleTrialClick = async () => {
    if (trialLoading) return;
    setTrialLoading(true);

    try {
      const { data: plansData, error: plansErr } = await supabase
        .from("pro_plans")
        .select("id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (plansErr || !plansData || plansData.length === 0) {
        console.error("Trial banner: could not load plans", plansErr);
        navigate(proPlansRoute);
        return;
      }

      const planIds = plansData.map((p) => p.id);
      const { data: pricesData, error: pricesErr } = await supabase
        .from("pro_plan_prices")
        .select("plan_id, is_popular")
        .in("plan_id", planIds);

      if (pricesErr) {
        console.error("Trial banner: could not load prices", pricesErr);
      }

      const popularPrice = (pricesData || []).find((pr) => pr.is_popular);
      const trialPlanId = popularPrice ? popularPrice.plan_id : plansData[0].id;

      navigate(`/pro/login?plan=${trialPlanId}`);
    } catch (err) {
      console.error("Trial banner navigation error:", err);
      navigate(proPlansRoute);
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full bg-slate-900 text-white border-t border-white/10"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-xs md:text-sm font-medium relative">
        <span className="text-center text-white/90">
          Ad-free music, unlimited JioTunes, and unlimited downloads!
        </span>
        <button
          onClick={handleTrialClick}
          disabled={trialLoading}
          className="flex-shrink-0 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 text-white font-bold px-3.5 py-1.5 rounded-full shadow-[0_2px_10px_rgba(59,130,246,0.45)] hover:shadow-[0_2px_14px_rgba(59,130,246,0.6)] transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center gap-1 text-xs md:text-sm whitespace-nowrap"
        >
          {trialLoading ? "Loading..." : "Start 30-day free trial"}
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
        <button
          onClick={onClose}
          className="absolute right-3 md:right-6 text-gray-400 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── STICKY PLAYER UI ───
const StickyPlayer = ({
  song,
  isPlaying,
  isAdPlaying,
  canSkipAd,
  adSkipAfterSeconds,
  onSkipAd,
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
  onExpand,
  profileOpen,
}) => {
  if (!song) return null;
  const disabled = isAdPlaying;
  const skipCountdown = Math.max(
    0,
    Math.ceil(adSkipAfterSeconds - currentTime),
  );

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[180px]">
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10">
            {isAdPlaying ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <Megaphone className="w-6 h-6 text-amber-400" />
              </div>
            ) : (
              <img
                src={
                  song.albumArt || song.img || "https://via.placeholder.com/50"
                }
                alt="Art"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            {isAdPlaying ? (
              <>
                <h4 className="font-bold text-amber-400 truncate text-base leading-tight">
                  Advertisement
                </h4>
                <p className="text-xs text-gray-400 truncate mt-1">
                  Song shuru hoga ad khatam/skip hone ke baad
                </p>
              </>
            ) : (
              <>
                <h4 className="font-bold text-white truncate text-base leading-tight">
                  {song.title}
                </h4>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {song.artist}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center w-full md:max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <button
              onClick={onPrev}
              disabled={disabled}
              className={`transition-colors transform duration-200 ${
                disabled
                  ? "text-gray-600 opacity-30 cursor-not-allowed"
                  : "text-gray-400 hover:text-white hover:scale-110"
              }`}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPlayPause(song)}
              disabled={disabled}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 bg-white text-slate-900 ${
                disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-110"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 md:w-7 md:h-7 fill-slate-900" />
              ) : (
                <Play className="w-6 h-6 md:w-7 md:h-7 fill-slate-900 ml-1" />
              )}
            </button>
            <button
              onClick={onNext}
              disabled={disabled}
              className={`transition-colors transform duration-200 ${
                disabled
                  ? "text-gray-600 opacity-30 cursor-not-allowed"
                  : "text-gray-400 hover:text-white hover:scale-110"
              }`}
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleShuffle}
              disabled={disabled}
              className={`transition-all ${
                disabled
                  ? "text-gray-600 opacity-30 cursor-not-allowed"
                  : isShuffle
                    ? "text-green-500 hover:scale-110"
                    : "text-gray-400 hover:text-white hover:scale-110"
              }`}
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
                disabled={disabled}
                onChange={(e) =>
                  !disabled && onSeek(parseFloat(e.target.value))
                }
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${
                  isAdPlaying
                    ? "bg-amber-400"
                    : "bg-gradient-to-r from-green-500 to-emerald-400"
                }`}
                style={{
                  width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
              {!disabled && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: duration
                      ? `${(currentTime / duration) * 100}%`
                      : "0%",
                    marginLeft: "-6px",
                  }}
                />
              )}
            </div>
            <span className="w-10 font-mono">{formatDuration(duration)}</span>
          </div>

          {isAdPlaying && (
            <div className="mt-1.5 h-4 flex items-center">
              {canSkipAd ? (
                <button
                  onClick={onSkipAd}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                >
                  Skip Ad
                </button>
              ) : (
                <p className="text-[10px] text-amber-400 font-semibold tracking-wide">
                  Skip in {skipCountdown}s
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1 flex-shrink-0">
          {onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              disabled={disabled}
              className={`text-gray-400 hover:text-green-400 transition-all hover:scale-110 p-1.5 rounded-lg hover:bg-white/10 ${profileOpen ? "text-green-400" : ""} ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
              title="View Playlist"
            >
              <Maximize2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            disabled={disabled}
            className={`transition-colors transform duration-300 p-1.5 rounded-lg hover:bg-white/10 ${
              disabled
                ? "text-gray-600 opacity-30 cursor-not-allowed"
                : "text-gray-400 hover:text-red-500 hover:rotate-90"
            }`}
            title="Close Player"
          >
            <X size={18} />
          </button>
        </div>

        <div className="hidden md:flex w-1/4 min-w-[160px] flex-col items-end gap-2">
          <div className="flex items-center gap-3 w-full justify-end">
            {onExpand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                disabled={disabled}
                className={`text-gray-400 hover:text-green-400 transition-all hover:scale-110 p-0.5 rounded hover:bg-white/10 ${profileOpen ? "text-green-400" : ""} ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                title="View Playlist"
              >
                <Maximize2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              disabled={disabled}
              className={`transition-colors transform duration-300 ${
                disabled
                  ? "text-gray-600 opacity-30 cursor-not-allowed"
                  : "text-gray-400 hover:text-red-500 hover:rotate-90"
              }`}
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
                style={{
                  width: `${(isMuted ? 0 : volume) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerProvider;
