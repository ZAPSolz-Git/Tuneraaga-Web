import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useIsPro } from "./useIsPro";

export const formatDuration = (val) => {
  if (!val || !isFinite(val) || val <= 0) return "0:00";
  if (typeof val === "string") return val.includes(":") ? val : "0:00";
  const m = Math.floor(val / 60);
  const s = Math.floor(val % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const parseArtists = (val) => {
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

export const useAudioPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentRadioStation, setCurrentRadioStation] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentList, setCurrentList] = useState([]);

  // 🔊 AD STATE
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adInfo, setAdInfo] = useState(null); // { title }

  const { isPro, checking } = useIsPro();

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const isPlayingRef = useRef(false);

  const userRef = useRef(null);
  const lastHistorySavedIdRef = useRef(null);

  // 🔊 AD REFS — live values callbacks ke andar bhi sahi rahein
  const isProRef = useRef(false);
  const checkingRef = useRef(true);
  const isPlayingAdRef = useRef(false);
  // jab ad khatam ho to ye asli song chalane ke liye call hota hai
  const pendingPlayRef = useRef(null);
  const adAudioRef = useRef(null);

  useEffect(() => {
    isProRef.current = isPro;
  }, [isPro]);
  useEffect(() => {
    checkingRef.current = checking;
  }, [checking]);

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
  useEffect(() => {
    isPlayingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userRef.current = session?.user ?? null;
    };
    getSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      userRef.current = session?.user ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  const saveToHistory = useCallback(async (releaseId) => {
    const currentUser = userRef.current;
    if (!currentUser || !releaseId) return;
    try {
      const { data: existing, error: selectError } = await supabase
        .from("history")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("release_id", releaseId)
        .limit(1)
        .maybeSingle();

      if (selectError) console.error("History select error:", selectError);

      if (existing) {
        const { error: updateError } = await supabase
          .from("history")
          .update({ played_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) console.error("History update error:", updateError);
      } else {
        const { error: insertError } = await supabase
          .from("history")
          .insert({ user_id: currentUser.id, release_id: releaseId });
        if (insertError) console.error("History insert error:", insertError);
      }
    } catch (error) {
      console.error("History save error:", error);
    }
  }, []);

  // 🔊 AD: ek random active ad laao (non-pro ke liye)
  const fetchRandomAd = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true);
      if (error || !data || data.length === 0) return null;
      return data[Math.floor(Math.random() * data.length)];
    } catch (e) {
      console.error("fetchRandomAd error:", e);
      return null;
    }
  }, []);

  // 🔊 AD: ad chalao, khatam hone par `onDone` call karo (jo asli song bajayega)
  const playAd = useCallback(
    async (onDone) => {
      const ad = await fetchRandomAd();
      const adAudio = adAudioRef.current;

      // ad nahi mila / audio nahi -> seedha song
      if (!ad || !ad.audio_url || !adAudio) {
        onDone?.();
        return;
      }

      // asli music pause
      const music = audioRef.current;
      if (music) music.pause();

      setIsPlayingAd(true);
      isPlayingAdRef.current = true;
      setAdInfo({ title: ad.title || "Advertisement" });
      setPlaying(true);

      const finish = () => {
        adAudio.removeEventListener("ended", finish);
        adAudio.removeEventListener("error", finish);
        setIsPlayingAd(false);
        isPlayingAdRef.current = false;
        setAdInfo(null);
        onDone?.();
      };

      adAudio.addEventListener("ended", finish, { once: true });
      adAudio.addEventListener("error", finish, { once: true });

      try {
        adAudio.src = ad.audio_url;
        adAudio.load();
        adAudio.volume = isMuted ? 0 : volume;
        await adAudio.play();
      } catch (e) {
        console.error("Ad play error:", e);
        finish();
      }
    },
    [fetchRandomAd, isMuted, volume],
  );

  // Core: index par song load + play (raw — bina ad ke)
  const _loadAndPlay = useCallback(
    (index, list) => {
      const song = list[index];
      if (!song || !song.audioUrl) return;

      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();

      setCurrentSong(song);
      currentSongRef.current = song;
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setCurrentList(list);
      currentListRef.current = list;
      setDuration(0);
      setCurrentTime(0);

      audio.src = song.audioUrl;
      audio.load();

      if (song.id) saveToHistory(song.id);

      const tryPlay = () => {
        const p = audio.play();
        if (p !== undefined) {
          p.then(() => setPlaying(true)).catch((err) => {
            if (err.name !== "AbortError") console.error("Play error:", err);
          });
        }
      };

      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          tryPlay();
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
      }
    },
    [saveToHistory],
  );

  // 🔊 GATE: non-pro -> pehle ad, phir song. pro -> seedha song.
  const _playSongAtIndex = useCallback(
    (index, list) => {
      const startSong = () => _loadAndPlay(index, list);

      // status pata nahi (checking) ya PAID -> koi ad nahi
      if (checkingRef.current || isProRef.current) {
        startSong();
        return;
      }

      // NON-PAID (sirf login ya logged-out) -> song se pehle ad
      playAd(startSong);
    },
    [_loadAndPlay, playAd],
  );

  // Init MUSIC audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // 🔊 separate audio element sirf ads ke liye
    const adAudio = new Audio();
    adAudio.preload = "auto";
    adAudioRef.current = adAudio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration))
        setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      // ad chal raha ho to music-pause se global "playing" false mat karo
      if (!isPlayingAdRef.current) setPlaying(false);
    };
    const onError = () => setPlaying(false);

    // 🔊 song khatam -> non-pro ko ad, phir agla song (pro ko seedha agla)
    const onEnded = () => {
      const list = currentListRef.current;
      const idx = currentIndexRef.current;
      if (!list || list.length === 0 || idx === null) return;

      let next;
      if (isShuffleRef.current) {
        do {
          next = Math.floor(Math.random() * list.length);
        } while (list.length > 1 && next === idx);
      } else {
        next = (idx + 1) % list.length;
      }

      const goNext = () => _loadAndPlay(next, list);

      if (checkingRef.current || isProRef.current) {
        goNext(); // paid -> koi ad nahi, seedha agla
      } else {
        playAd(goNext); // non-paid -> har song ke baad ad
      }
    };

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

      adAudio.pause();
      adAudio.removeAttribute("src");
      adAudio.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_loadAndPlay, playAd]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    if (adAudioRef.current) {
      adAudioRef.current.volume = volume;
      adAudioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const playRadioStation = useCallback(
    (station, songs) => {
      if (!songs || songs.length === 0) return;
      setCurrentRadioStation(station);
      _playSongAtIndex(0, songs);
    },
    [_playSongAtIndex],
  );

  const handleSongClick = useCallback(
    (index, song, list) => {
      // 🔊 ad chal raha ho to click ignore (ad skip nahi kar sakte)
      if (isPlayingAdRef.current) return;

      const audio = audioRef.current;
      if (currentSongRef.current?.id === song.id && audio) {
        if (audio.paused) {
          audio
            .play()
            .then(() => setPlaying(true))
            .catch(() => {});
        } else {
          audio.pause();
          setPlaying(false);
        }
      } else {
        _playSongAtIndex(index, list);
      }
    },
    [_playSongAtIndex],
  );

  const handlePlayPause = useCallback(() => {
    // 🔊 ad ke dauraan play/pause disabled
    if (isPlayingAdRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (isPlayingAdRef.current) return; // 🔊 ad ke dauraan skip nahi
    const list = currentListRef.current;
    const idx = currentIndexRef.current;
    if (!list || list.length === 0 || idx === null) return;
    let next;
    if (isShuffleRef.current) {
      do {
        next = Math.floor(Math.random() * list.length);
      } while (list.length > 1 && next === idx);
    } else {
      next = (idx + 1) % list.length;
    }
    _playSongAtIndex(next, list);
  }, [_playSongAtIndex]);

  const handlePrev = useCallback(() => {
    if (isPlayingAdRef.current) return; // 🔊
    const list = currentListRef.current;
    const idx = currentIndexRef.current;
    if (!list || list.length === 0 || idx === null) return;
    const prev = (idx - 1 + list.length) % list.length;
    _playSongAtIndex(prev, list);
  }, [_playSongAtIndex]);

  const handleSeek = useCallback((time) => {
    if (isPlayingAdRef.current) return; // 🔊 ad seek nahi hota
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleClosePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    const adAudio = adAudioRef.current;
    if (adAudio) {
      adAudio.pause();
      adAudio.removeAttribute("src");
      adAudio.load();
    }
    setIsPlayingAd(false);
    isPlayingAdRef.current = false;
    setAdInfo(null);
    setPlaying(false);
    setCurrentSong(null);
    currentSongRef.current = null;
    setCurrentRadioStation(null);
    setCurrentIndex(null);
    currentIndexRef.current = null;
    setCurrentList([]);
    currentListRef.current = [];
    setDuration(0);
    setCurrentTime(0);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((p) => !p), []);

  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  const onToggleShuffle = useCallback(() => setIsShuffle((p) => !p), []);

  return {
    playing,
    currentSong,
    currentRadioStation,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    currentList,
    currentIndex,
    // 🔊 ad state — StickyPlayer mein use kar sakte ho ("Ad playing…" dikhane ke liye)
    isPlayingAd,
    adInfo,
    isPro,
    playRadioStation,
    handleSongClick,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    handleClosePlayer,
    toggleMute,
    handleVolumeChange,
    onToggleShuffle,
  };
};
