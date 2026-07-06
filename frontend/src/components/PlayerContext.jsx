import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
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
  Maximize2,
  Megaphone,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// ─── Shared helpers (import these from here everywhere instead of
// re-declaring them per-page, so formatting stays consistent) ───
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

// Max time we'll let an ad play before we force it to end. This is a
// safety net in case the ad file's "ended" event never fires (bad
// metadata, network hiccup, etc.) — without this, a broken ad could
// block songs forever.
const AD_FAILSAFE_MS = 45000;

// After how many seconds of an ad the user is allowed to skip it.
const AD_SKIP_AFTER_SECONDS = 5;

const PlayerContext = createContext(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer() must be used inside <PlayerProvider>");
  }
  return ctx;
}

export function PlayerProvider({ children }) {
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

  // Optional "expand" behavior (e.g. TopPlaylist opens its playlist-profile
  // panel when you tap the Maximize2 icon on the sticky player). Any page
  // can plug in its own handler; pages that don't call setExpandHandler
  // just won't show the expand icon.
  const [expandHandler, setExpandHandlerState] = useState(null);
  const [profileOpen, setProfileOpenState] = useState(false);
  const setExpandHandler = useCallback((fn) => {
    // fn may be a function or null to clear it
    setExpandHandlerState(() => fn);
  }, []);

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const countedSongIds = useRef(new Set());
  const userRef = useRef(null);

  // ✅ AD REFS
  const isAdPlayingRef = useRef(false);
  const pendingSongRef = useRef(null);
  const adsListRef = useRef([]);
  const adsFetchedRef = useRef(false);
  const adFailsafeTimerRef = useRef(null);

  // 🔒 PLAY TOKEN: every time we start loading something new (ad OR song),
  // we bump this counter and remember "my" number. If an OLD play()
  // promise (e.g. the ad's) resolves LATE — after we've already moved on
  // to the song — its token no longer matches the current one, so we
  // force-pause it instead of letting it audibly keep playing.
  const playTokenRef = useRef(0);

  // 🔑 Which song.id is ACTUALLY loaded into the <audio> element right
  // now (i.e. audio.src really points at that song's file). This is
  // DELIBERATELY separate from currentSongRef: currentSongRef also gets
  // pointed at the *upcoming* song while an ad is still playing (so the
  // sticky player can show its name/art), and a useEffect keeps
  // currentSongRef in sync with the currentSong *state* on every render.
  // Deciding "is this song new?" off currentSongRef was the bug that made
  // the ad loop forever instead of ever reaching the real song: the
  // moment the ad started, currentSongRef already equalled the pending
  // song, so once the ad ended we'd think the song was "already loaded"
  // and just resume playback — except audio.src was still the AD file.
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

  // ✅ AUTH & SESSION — single subscription, shared everywhere. This is
  // the ONE source of truth for "logged in or not". Because it lives here
  // (not duplicated per-page), every page that uses usePlayer() reads the
  // exact same auth state that decides whether ads play.
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
    };
    getSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
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

  // ─── Generic "try to play, but abandon this attempt if a newer play
  // request has already superseded it" helper. Used for both ads and
  // songs so neither can ever leak audio after being superseded. ───
  const attemptPlay = useCallback((token, onFailure) => {
    const audio = audioRef.current;
    if (!audio) return;
    let hasStarted = false;
    const tryPlay = () => {
      if (hasStarted) return;
      if (playTokenRef.current !== token) return; // superseded before we even tried
      audio
        .play()
        .then(() => {
          if (playTokenRef.current !== token) {
            // 🔒 We were superseded WHILE play() was resolving. Stop it
            // immediately so it can never leak audio.
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

  // Loads a brand-new source (ad or song), bumps the play token (which
  // automatically invalidates/pauses whatever was playing before), and
  // plays it once ready.
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

  // ─── Actually plays the real song (called directly for logged-in
  // users, or after the pre-roll ad finishes/is skipped for logged-out
  // users) ───
  const startActualSong = useCallback(
    (song) => {
      if (!song || !song.audioUrl) return;
      const audio = audioRef.current;
      if (!audio) return;
      // 🔑 Use loadedSongIdRef (what's really in audio.src), NOT
      // currentSongRef — see the comment on loadedSongIdRef's declaration
      // for why currentSongRef is unsafe for this check.
      const isNewSong = loadedSongIdRef.current !== song.id;

      clearAdFailsafe();
      isAdPlayingRef.current = false;
      setIsAdPlaying(false);

      // Always keep the display state in sync with the song we're
      // actually about to play, regardless of whether it's "new" to the
      // audio element or not.
      setCurrentSong(song);
      currentSongRef.current = song;

      if (isNewSong) {
        setDuration(0);
        setCurrentTime(0);
        incrementSongCounts(song);
        if (song.release_id) saveToHistory(song.release_id);
        loadedSongIdRef.current = song.id;
        // 🔒 loadAndPlay bumps the play token itself, which is what
        // forces any still-in-flight ad play() to pause itself the
        // moment it resolves.
        loadAndPlay(song.audioUrl);
      } else {
        // Same song already loaded (e.g. resuming after pause) — don't
        // touch src/position, just resume playback at the current token.
        attemptPlay(playTokenRef.current);
      }
    },
    [incrementSongCounts, saveToHistory, loadAndPlay, attemptPlay],
  );

  // ─── Called when the ad ends, fails, times out, or is skipped by the
  // user — plays the pending song ───
  const finishAdAndPlayPending = useCallback(() => {
    clearAdFailsafe();
    isAdPlayingRef.current = false;
    setIsAdPlaying(false);
    const song = pendingSongRef.current;
    pendingSongRef.current = null;
    if (song) startActualSong(song);
  }, [startActualSong]);

  // ─── Plays an ad (skippable after AD_SKIP_AFTER_SECONDS), then the
  // song ───
  const playAd = useCallback(
    async (song) => {
      const audio = audioRef.current;
      if (!audio) return;

      // 🔒 Lock immediately, BEFORE the async ad fetch below, AND bump
      // the play token now — not after the fetch resolves. This (1)
      // blocks a second click from sneaking in during the fetch, and (2)
      // means that if anything about this specific ad request goes stale
      // later (see attemptPlay), it gets shut down automatically instead
      // of playing over whatever comes next.
      isAdPlayingRef.current = true;
      setIsAdPlaying(true);
      pendingSongRef.current = song;
      setCurrentSong(song); // show the upcoming song's name behind "Advertisement"
      currentSongRef.current = song;
      // 🔑 The audio element is about to hold the AD's src, not the
      // song's — so whatever song.id was last loaded no longer matches
      // what's really playing. This guarantees startActualSong() treats
      // the song as "new" once the ad ends, and actually loads it instead
      // of just resuming the ad.
      loadedSongIdRef.current = null;
      setDuration(0);
      setCurrentTime(0);
      const token = ++playTokenRef.current;

      const ad = await getRandomAd();

      // Something newer already took over while we were fetching the ad
      // (shouldn't normally happen since clicks are blocked, but this is
      // the safety net) — bail out instead of stomping on it.
      if (playTokenRef.current !== token) return;

      if (!ad || !ad.audio_url) {
        // no ad configured / fetch failed — release the lock, don't block
        isAdPlayingRef.current = false;
        setIsAdPlaying(false);
        startActualSong(song);
        return;
      }

      audio.pause();
      audio.src = ad.audio_url;
      audio.load();

      // 🔒 Safety net: if "ended" never fires for some reason, force the
      // real song to start after AD_FAILSAFE_MS instead of hanging forever.
      clearAdFailsafe();
      adFailsafeTimerRef.current = setTimeout(() => {
        if (playTokenRef.current !== token) return;
        finishAdAndPlayPending();
      }, AD_FAILSAFE_MS);

      attemptPlay(token, finishAdAndPlayPending);
    },
    [getRandomAd, startActualSong, attemptPlay, finishAdAndPlayPending],
  );

  // ─── PUBLIC play entrypoint — every song click routes through here.
  // Logged-in users (userRef.current truthy) always skip straight to the
  // song. Logged-out users get an ad first, every single time a *new*
  // song is requested — so it's ad → song → ad → song → ... forever,
  // and never an ad again once you log in. ───
  const playSong = useCallback(
    (song) => {
      if (!song || !song.audioUrl) return;
      if (isAdPlayingRef.current) return; // ad is playing — ignore new-song clicks

      const isNewSong =
        !currentSongRef.current || currentSongRef.current.id !== song.id;

      if (!isNewSong) {
        startActualSong(song);
        return;
      }

      if (userRef.current) {
        // ✅ logged-in users never see ads
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

  // list = the array this song belongs to (queue), used for next/prev/shuffle
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

  // Convenience: play a whole list starting at its first track (e.g. "Play All")
  const playList = useCallback(
    (list) => {
      if (!list || list.length === 0) return;
      handleSongClick(0, list[0], list);
    },
    [handleSongClick],
  );

  // ─── Skip the currently playing ad. Only works once
  // AD_SKIP_AFTER_SECONDS have elapsed (mirrors the "Skip in Xs" UI). ───
  const skipAd = useCallback(() => {
    if (!isAdPlayingRef.current) return;
    if (currentTime < AD_SKIP_AFTER_SECONDS) return;
    finishAdAndPlayPending();
  }, [currentTime, finishAdAndPlayPending]);

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
        finishAdAndPlayPending();
      } else {
        setPlaying(false);
      }
    };
    const onEnded = () => {
      if (isAdPlayingRef.current) {
        finishAdAndPlayPending();
      } else {
        handleNext();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleNext, finishAdAndPlayPending]);

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

  const value = {
    // state
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
    // actions
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
      {/* Sticky player is rendered ONCE here, globally — pages just call
          usePlayer().playSong()/handleSongClick(), they never render
          their own <StickyPlayer> or own an <audio> element. */}
      <AnimatePresence>
        {currentSong && (
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
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
}

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
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[100]"
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-4 py-3 md:py-4 md:px-8">
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
                className={`absolute inset-0 w-full h-full opacity-0 z-10 ${
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
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

          {/* ✅ AD SKIP CONTROL — countdown until AD_SKIP_AFTER_SECONDS,
              then a real "Skip Ad" button. */}
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

        {/* Mobile Right */}
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

        {/* Desktop Right */}
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
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerProvider;
