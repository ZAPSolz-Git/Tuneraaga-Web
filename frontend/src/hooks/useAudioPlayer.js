import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

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

  const audioRef = useRef(null);
  const currentSongRef = useRef(null);
  const currentListRef = useRef([]);
  const currentIndexRef = useRef(null);
  const isShuffleRef = useRef(false);
  const isPlayingRef = useRef(false);

  // ✅ AUTH / USER TRACKING (needed for history saving)
  const userRef = useRef(null);
  // Keep track of release_id we already pushed to history this "play action"
  // to avoid duplicate inserts for the exact same trigger.
  const lastHistorySavedIdRef = useRef(null);

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

  // ✅ Keep a live reference to the logged-in user (session) so that
  // saveToHistory always has the latest auth state, even inside callbacks
  // created before the session resolved.
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

  // ✅ SAVE TO HISTORY DB (check then update/insert to prevent duplicates & silent fails)
  const saveToHistory = useCallback(async (releaseId) => {
    const currentUser = userRef.current;
    if (!currentUser || !releaseId) return;
    try {
      // 1. Check if this song already exists in history
      const { data: existing, error: selectError } = await supabase
        .from("history")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("release_id", releaseId)
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error("History select error:", selectError);
      }

      if (existing) {
        // 2. If exists, just update the timestamp to move it to top
        const { error: updateError } = await supabase
          .from("history")
          .update({ played_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) console.error("History update error:", updateError);
      } else {
        // 3. If new, insert it
        const { error: insertError } = await supabase
          .from("history")
          .insert({ user_id: currentUser.id, release_id: releaseId });
        if (insertError) console.error("History insert error:", insertError);
      }
    } catch (error) {
      console.error("History save error:", error);
    }
  }, []);

  // Core: load and play a song at index
  const _playSongAtIndex = useCallback(
    (index, list) => {
      const song = list[index];
      if (!song || !song.audioUrl) return;

      const audio = audioRef.current;
      if (!audio) return;

      // Pause current before loading new
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

      // ✅ SAVE TO HISTORY — every time a (new) song actually starts loading.
      // song.id works for both regular tracks/playlist items and podcast
      // episodes/radio station songs since they all carry the underlying
      // release id as `id` by the time they reach this hook.
      if (song.id) {
        saveToHistory(song.id);
      }

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

  // Init audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration))
        setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setPlaying(false);
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
      _playSongAtIndex(next, list);
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
    };
  }, [_playSongAtIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Public: play radio station → plays first song from list
  const playRadioStation = useCallback(
    (station, songs) => {
      if (!songs || songs.length === 0) return;
      setCurrentRadioStation(station);
      _playSongAtIndex(0, songs);
    },
    [_playSongAtIndex],
  );

  // Public: play a specific song with list context
  const handleSongClick = useCallback(
    (index, song, list) => {
      const audio = audioRef.current;
      if (currentSongRef.current?.id === song.id && audio) {
        // Toggle play/pause for same song
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

  // Public: global play/pause toggle
  const handlePlayPause = useCallback(() => {
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
    const list = currentListRef.current;
    const idx = currentIndexRef.current;
    if (!list || list.length === 0 || idx === null) return;
    const prev = (idx - 1 + list.length) % list.length;
    _playSongAtIndex(prev, list);
  }, [_playSongAtIndex]);

  const handleSeek = useCallback((time) => {
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
